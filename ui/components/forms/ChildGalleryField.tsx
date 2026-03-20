import { useEffect, useMemo, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop'
import FileUpload from '../core/FileUpload'
import VideoUpload from '../core/VideoUpload'
import { FormField, GalleryMode, supportToAccept } from '../../types/formConfig'

interface GalleryItem {
  file: string
  file_gen?: string
  type: 'image' | 'video'
}

interface QueueFile {
  file: File
  url: string
}

interface ChildGalleryFieldProps {
  field: FormField
  value: any
  onChange: (value: GalleryItem[]) => void
  readOnly?: boolean
  uploadModule?: string
}

function normalizeItems(raw: any): GalleryItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const mediaType: GalleryItem['type'] = item.type === 'video' ? 'video' : 'image'
      return {
        file: String(item.file || item.filename || ''),
        file_gen: item.file_gen ? String(item.file_gen) : item.fileGen ? String(item.fileGen) : '',
        type: mediaType,
      }
    })
    .filter((item) => item.file)
}

function resolveFileUrl(uploadModule: string, item: GalleryItem): string {
  const baseApi = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
  if (!item.file) return ''
  if (item.file.startsWith('http://') || item.file.startsWith('https://')) return item.file
  if (item.file.startsWith('/')) return `${baseApi}${item.file}`
  const gen = String(item.file_gen || '').trim()
  if (!gen) return ''
  return `${baseApi}/stock/${uploadModule}/${gen}/${encodeURIComponent(item.file)}`
}

function asImageMode(mode?: GalleryMode): { type: 'crop'; width: number; height: number } | { type: 'scaledown' } | undefined {
  if (!mode) return undefined
  if (mode.type === 'scaledown') return { type: 'scaledown' }
  if (mode.type === 'crop') {
    return {
      type: 'crop',
      width: Number(mode.width || 1),
      height: Number(mode.height || 1),
    }
  }
  return undefined
}

export default function ChildGalleryField({ field, value, onChange, readOnly = false, uploadModule = 'article' }: ChildGalleryFieldProps) {
  const items = useMemo(() => normalizeItems(value), [value])
  const galleryMode = field.mode as GalleryMode | undefined
  const mode = galleryMode?.mode || 'image'
  // Apply image processing mode for both `image` and `mixed` gallery modes.
  const imageMode = mode !== 'video' ? asImageMode(galleryMode) : undefined
  const support = field.support || (mode === 'video' ? 'mp4,webm,ogg' : mode === 'mixed' ? 'jpeg,jpg,png,webp,mp4,webm,ogg' : 'jpeg,jpg,png,webp')
  const maxSize = Number(field.maxSize || (mode === 'video' ? 100 : 5))

  const [uploadValue, setUploadValue] = useState('')
  const [uploaderKey, setUploaderKey] = useState(0)
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [uploadType, setUploadType] = useState<'image' | 'video'>(mode === 'video' ? 'video' : 'image')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragPreviewItems, setDragPreviewItems] = useState<GalleryItem[] | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [cropQueueOpen, setCropQueueOpen] = useState(false)
  const [cropQueueFiles, setCropQueueFiles] = useState<QueueFile[]>([])
  const [cropQueueIndex, setCropQueueIndex] = useState(0)
  const [cropQueueBaseItems, setCropQueueBaseItems] = useState<GalleryItem[]>([])
  const [cropQueueUploadedItems, setCropQueueUploadedItems] = useState<GalleryItem[]>([])
  const [cropQueueUploading, setCropQueueUploading] = useState(false)
  const [queueCrop, setQueueCrop] = useState({ x: 0, y: 0 })
  const [queueZoom, setQueueZoom] = useState(1)
  const [queueCroppedAreaPixels, setQueueCroppedAreaPixels] = useState<Area | null>(null)
  const multiInputRef = useRef<HTMLInputElement>(null)
  const didDropRef = useRef(false)

  const renderItems = dragPreviewItems ?? items

  const imageAccept = supportToAccept('image', support)
  const videoAccept = supportToAccept('video', support)
  const activeAccept = uploadType === 'video' ? videoAccept : imageAccept

  const removeItem = (index: number) => {
    const next = items.filter((_, idx) => idx !== index)
    onChange(next)
  }

  const openUploadForAdd = () => {
    setEditingIndex(null)
    if (mode === 'video') setUploadType('video')
    else setUploadType('image')
    setUploadValue('')
    setUploaderOpen(true)
    setUploaderKey((prev) => prev + 1)
  }

  const openUploadForReplace = (index: number) => {
    const item = items[index]
    if (!item) return
    setEditingIndex(index)
    setUploadType(item.type)
    setUploadValue('')
    setUploaderOpen(true)
    setUploaderKey((prev) => prev + 1)
  }

  const closeUploader = () => {
    setUploaderOpen(false)
    setEditingIndex(null)
    setUploadValue('')
    setBulkUploading(false)
    setBulkError('')
    if (multiInputRef.current) {
      multiInputRef.current.value = ''
    }
  }

  const closeCropQueue = () => {
    cropQueueFiles.forEach((item) => {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
    setCropQueueOpen(false)
    setCropQueueFiles([])
    setCropQueueIndex(0)
    setCropQueueBaseItems([])
    setCropQueueUploadedItems([])
    setQueueCrop({ x: 0, y: 0 })
    setQueueZoom(1)
    setQueueCroppedAreaPixels(null)
    setCropQueueUploading(false)
  }

  const closePreview = () => {
    setPreviewIndex(null)
  }

  useEffect(() => {
    if (!uploaderOpen || readOnly || editingIndex !== null || bulkUploading) return
    // Default behavior for gallery add flow: open multi-select picker immediately.
    multiInputRef.current?.click()
  }, [uploaderOpen, readOnly, editingIndex, bulkUploading])

  useEffect(() => {
    return () => {
      cropQueueFiles.forEach((item) => {
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
      })
    }
  }, [cropQueueFiles])

  const applyUploadedItem = (payload: GalleryItem) => {
    const next = [...items]
    if (editingIndex === null) {
      next.push(payload)
    } else if (editingIndex >= 0 && editingIndex < next.length) {
      next[editingIndex] = payload
    }
    onChange(next)
    closeUploader()
  }

  const uploadSingleFile = async (file: File, type: 'image' | 'video'): Promise<GalleryItem | null> => {
    const baseApi = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
    const formData = new FormData()
    formData.append('file', file)
    formData.append('module', uploadModule)

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const response = await fetch(`${baseApi}/api/uploads`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || `Upload failed: ${file.name}`)
    }

    const data = await response.json()
    const fileName = String(data.fileName || '').trim()
    if (!fileName) return null

    return {
      file: fileName,
      file_gen: String(data.gen || ''),
      type,
    }
  }

  const openMultiUpload = () => {
    setBulkError('')
    multiInputRef.current?.click()
  }

  const openCropQueueForFiles = (files: File[]) => {
    const queue = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setCropQueueFiles(queue)
    setCropQueueIndex(0)
    setCropQueueBaseItems(items)
    setCropQueueUploadedItems([])
    setQueueCrop({ x: 0, y: 0 })
    setQueueZoom(1)
    setQueueCroppedAreaPixels(null)
    setCropQueueOpen(true)
  }

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (err) => reject(err))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })
  }

  const getCroppedBlobFromQueue = async (imageSrc: string, pixelCrop: Area, fileName: string): Promise<File> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2d context')

    const targetWidth = imageMode?.type === 'crop' ? Number(imageMode.width || 1) : pixelCrop.width
    const targetHeight = imageMode?.type === 'crop' ? Number(imageMode.height || 1) : pixelCrop.height

    canvas.width = Math.max(1, Math.round(targetWidth))
    canvas.height = Math.max(1, Math.round(targetHeight))

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Failed to create cropped image'))
          return
        }
        resolve(result)
      }, 'image/jpeg', 0.95)
    })

    return new File([blob], fileName || 'cropped.jpg', { type: 'image/jpeg' })
  }

  const onQueueCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setQueueCroppedAreaPixels(croppedAreaPixels)
  }

  const handleConfirmCurrentQueueItem = async () => {
    const current = cropQueueFiles[cropQueueIndex]
    if (!current || !queueCroppedAreaPixels) return

    setCropQueueUploading(true)
    setBulkError('')

    try {
      const croppedFile = await getCroppedBlobFromQueue(current.url, queueCroppedAreaPixels, current.file.name)
      const uploaded = await uploadSingleFile(croppedFile, 'image')
      const nextUploadedItems = uploaded
        ? [...cropQueueUploadedItems, uploaded]
        : [...cropQueueUploadedItems]

      const nextIndex = cropQueueIndex + 1
      if (nextIndex >= cropQueueFiles.length) {
        if (nextUploadedItems.length > 0) {
          onChange([...cropQueueBaseItems, ...nextUploadedItems])
        }
        closeCropQueue()
        closeUploader()
      } else {
        setCropQueueUploadedItems(nextUploadedItems)
        setCropQueueIndex(nextIndex)
        setQueueCrop({ x: 0, y: 0 })
        setQueueZoom(1)
        setQueueCroppedAreaPixels(null)
      }
    } catch (err: any) {
      setBulkError(err?.message || 'Crop upload failed')
    } finally {
      setCropQueueUploading(false)
    }
  }

  const handleMultiSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) {
      // Keep popup open so image upload UI behaves like video mode when dialog is canceled.
      return
    }

    const files = Array.from(fileList)
    const expectedPrefix = uploadType === 'video' ? 'video/' : 'image/'

    const oversized = files.find((file) => file.size > maxSize * 1024 * 1024)
    if (oversized) {
      setBulkError(`${oversized.name} exceeds ${maxSize}MB limit`)
      return
    }

    const invalid = files.find((file) => !file.type.startsWith(expectedPrefix))
    if (invalid) {
      setBulkError(`${invalid.name} is not a valid ${uploadType} file`)
      return
    }

    if (uploadType === 'image' && imageMode?.type === 'crop') {
      openCropQueueForFiles(files)
      if (multiInputRef.current) multiInputRef.current.value = ''
      return
    }

    setBulkUploading(true)
    setBulkError('')

    try {
      const uploaded: GalleryItem[] = []
      for (const file of files) {
        const item = await uploadSingleFile(file, uploadType)
        if (item) uploaded.push(item)
      }

      if (uploaded.length > 0) {
        onChange([...items, ...uploaded])
        closeUploader()
      }
    } catch (err: any) {
      setBulkError(err?.message || 'Bulk upload failed')
    } finally {
      setBulkUploading(false)
      if (multiInputRef.current) {
        multiInputRef.current.value = ''
      }
    }
  }

  const addImage = (meta: { url: string; gen: string; fileName?: string } | null) => {
    if (!meta?.fileName) return
    applyUploadedItem({ file: String(meta.fileName), file_gen: String(meta.gen || ''), type: 'image' })
  }

  const addVideo = (meta: { url: string; gen: string; fileName?: string } | null) => {
    if (!meta?.fileName) return
    applyUploadedItem({ file: String(meta.fileName), file_gen: String(meta.gen || ''), type: 'video' })
  }

  const handleDrop = () => {
    didDropRef.current = true
    if (dragPreviewItems && dragIndex !== null) {
      onChange(dragPreviewItems)
    }
    setDragPreviewItems(null)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm text-[color:var(--text-muted)]">{items.length} item(s)</span>
        {!readOnly && (
          <button type="button" className="btn btn-primary" onClick={openUploadForAdd}>
            Upload
          </button>
        )}
      </div>

      <div className="card p-3 min-h-[260px] sm:min-h-[320px]">
        {renderItems.length === 0 ? (
          <div className="h-full min-h-[220px] sm:min-h-[280px] flex items-center justify-center text-[color:var(--text-muted)] text-sm text-center px-4">
            {readOnly ? 'No gallery content.' : 'No gallery content yet. Upload to create content.'}
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 286 }}>
            <div className="flex flex-wrap gap-3 items-start">
              {renderItems.map((item, index) => {
                const src = resolveFileUrl(uploadModule, item)
                const isDraggingCard = dragIndex === index
                const isDropTarget = dragOverIndex === index && dragIndex !== null && dragIndex !== index
                return (
                  <div
                    key={`${item.file}-${index}`}
                    className={`relative border rounded-xl overflow-hidden bg-[color:var(--card)] group flex-[0_0_calc((100%-0.75rem)/2)] sm:flex-[0_0_calc((100%-1.5rem)/3)] lg:flex-[0_0_calc((100%-3rem)/5)] transition-all duration-200 ease-out will-change-transform ${isDraggingCard ? 'border-[color:var(--accent)] opacity-45 scale-[0.96] shadow-2xl z-20' : 'border-[color:var(--border)]'} ${isDropTarget ? 'border-[color:var(--accent)] ring-1 ring-[color:var(--accent)]/35 -translate-y-1 shadow-lg' : ''}`}
                    draggable={!readOnly}
                    onDragStart={(event) => {
                      didDropRef.current = false
                      setDragPreviewItems(renderItems)
                      setDragIndex(index)
                      setDragOverIndex(index)
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', String(index))
                    }}
                    onDragOver={(e) => {
                      if (readOnly) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (dragIndex === null || dragIndex === index) return
                      if (dragOverIndex !== index) {
                        setDragOverIndex(index)
                      }

                      setDragPreviewItems((prev) => {
                        const current = prev ?? renderItems
                        if (!current[dragIndex] || !current[index]) return current

                        const next = [...current]
                        const [moved] = next.splice(dragIndex, 1)
                        next.splice(index, 0, moved)
                        return next
                      })
                      setDragIndex(index)
                    }}
                    onDrop={(e) => {
                      if (readOnly) return
                      e.preventDefault()
                      handleDrop()
                    }}
                    onDragEnd={() => {
                      if (!didDropRef.current) {
                        setDragPreviewItems(null)
                      }
                      setDragIndex(null)
                      setDragOverIndex(null)
                      didDropRef.current = false
                    }}
                  >
                    {item.type === 'video' ? (
                      <video src={src} className="w-full h-full aspect-square object-cover" controls={false} muted />
                    ) : (
                      <img src={src} alt={item.file} className="w-full h-full aspect-square object-cover" loading="lazy" />
                    )}
                    {!readOnly && (
                      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${dragIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm shadow-sm">
                          <i className="fas fa-arrows-alt" aria-hidden="true" />
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(index)}
                        className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Preview media"
                      >
                        <i className="fas fa-eye" />
                      </button>
                      {!readOnly && (
                        <>
                        <button
                          type="button"
                          onClick={() => openUploadForReplace(index)}
                          className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Change media"
                        >
                          <i className="fas fa-sync-alt" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove media"
                        >
                          <i className="fas fa-trash" />
                        </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {previewIndex !== null && items[previewIndex] && (
        <div className="preview-overlay-standard">
          <div className="px-4 py-3 sm:py-5 sm:px-6 lg:px-10 h-full">
            <div className="max-w-7xl mx-auto w-full min-h-full flex items-center justify-center">
              <div className="w-full max-w-4xl bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-base font-semibold">Preview Gallery Item</h4>
                  <button type="button" onClick={closePreview} className="btn btn-secondary">Close</button>
                </div>
                <div className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-alt)] p-2 flex items-center justify-center min-h-[260px]">
                  {items[previewIndex].type === 'video' ? (
                    <video
                      src={resolveFileUrl(uploadModule, items[previewIndex])}
                      className="max-h-[70vh] w-auto max-w-full rounded"
                      controls
                    />
                  ) : (
                    <img
                      src={resolveFileUrl(uploadModule, items[previewIndex])}
                      alt={items[previewIndex].file}
                      className="max-h-[70vh] w-auto max-w-full rounded"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploaderOpen && !readOnly && (
        <div className="fixed top-[calc(var(--nav-height)-1px)] right-0 bottom-0 left-0 lg:left-64 z-[55] bg-[color:var(--bg)]/80 backdrop-blur-sm overflow-y-auto !mt-0">
          <div className="px-4 py-3 sm:py-5 sm:px-6 lg:px-10 h-full">
            <div className="max-w-7xl mx-auto w-full min-h-full flex items-center justify-center">
              <div className="w-full max-w-2xl bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">{editingIndex === null ? 'Upload Gallery Item' : 'Replace Gallery Item'}</h4>
                  <button type="button" onClick={closeUploader} className="btn btn-secondary">Close</button>
                </div>

                {mode === 'mixed' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`btn ${uploadType === 'image' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setUploadType('image')}
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      className={`btn ${uploadType === 'video' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setUploadType('video')}
                    >
                      Video
                    </button>
                  </div>
                )}

                {editingIndex === null && (
                  <div className="space-y-2">
                    <input
                      ref={multiInputRef}
                      type="file"
                      multiple
                      accept={activeAccept}
                      className="hidden"
                      onChange={handleMultiSelect}
                      disabled={bulkUploading}
                    />
                    {bulkUploading && (
                      <div className="p-2 border border-[color:var(--border)] bg-[color:var(--bg-alt)] text-[color:var(--text)] text-sm rounded-md">
                        Uploading multiple files...
                      </div>
                    )}
                    {bulkError && (
                      <div className="p-2 border border-red-200 bg-red-50 text-red-700 text-sm rounded-md">
                        {bulkError}
                      </div>
                    )}
                  </div>
                )}

                {(mode === 'image' || uploadType === 'image') && mode !== 'video' ? (
                  <FileUpload
                    key={`gallery-image-${uploaderKey}`}
                    value={uploadValue}
                    onChange={(next) => setUploadValue(next)}
                    onUploaded={addImage}
                    returnType="filename"
                    module={uploadModule}
                    accept={imageAccept}
                    mode={imageMode}
                    maxSize={maxSize}
                    disabled={readOnly || bulkUploading}
                  />
                ) : (mode === 'video' || uploadType === 'video') ? (
                  <VideoUpload
                    key={`gallery-video-${uploaderKey}`}
                    value={uploadValue}
                    onChange={(next) => setUploadValue(next)}
                    onUploaded={addVideo}
                    returnType="filename"
                    module={uploadModule}
                    accept={videoAccept}
                    maxSize={maxSize}
                    disabled={readOnly || bulkUploading}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {cropQueueOpen && cropQueueFiles[cropQueueIndex] && (
        <div className="fixed top-[calc(var(--nav-height)-1px)] right-0 bottom-0 left-0 lg:left-64 z-[57] bg-[color:var(--bg)]/80 backdrop-blur-sm overflow-y-auto !mt-0">
          <div className="px-4 py-3 sm:py-5 sm:px-6 lg:px-10 h-full">
            <div className="max-w-7xl mx-auto w-full min-h-full flex items-center justify-center">
              <div className="w-full max-w-7xl bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg flex flex-col overflow-hidden">
                <div className="border-b border-[color:var(--border)] p-4 flex items-center justify-between">
                  <h4 className="text-2xl font-semibold">Crop & edit</h4>
                  <button type="button" onClick={closeCropQueue} className="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_280px]">
                  <div className="bg-black p-4 sm:p-6 flex items-center justify-center overflow-hidden min-h-[420px]">
                    <div className="relative w-full h-[62vh] max-h-[650px] min-h-[340px] border border-white/15 rounded-xl overflow-hidden">
                      <Cropper
                        image={cropQueueFiles[cropQueueIndex].url}
                        crop={queueCrop}
                        zoom={queueZoom}
                        aspect={imageMode?.type === 'crop' ? Number(imageMode.width || 1) / Number(imageMode.height || 1) : undefined}
                        onCropChange={setQueueCrop}
                        onCropComplete={onQueueCropComplete}
                        onZoomChange={setQueueZoom}
                        restrictPosition
                        showGrid={false}
                      />
                    </div>
                  </div>

                  <aside className="border-t lg:border-t-0 lg:border-l border-[color:var(--border)] p-4 bg-[color:var(--card)] space-y-3 overflow-y-auto">
                    {cropQueueFiles.map((item, index) => (
                      <button
                        key={`${item.file.name}-${index}`}
                        type="button"
                        onClick={() => {
                          setCropQueueIndex(index)
                          setQueueCrop({ x: 0, y: 0 })
                          setQueueZoom(1)
                          setQueueCroppedAreaPixels(null)
                        }}
                        className={`w-full border rounded-md p-2 flex items-center gap-3 text-left transition-colors ${index === cropQueueIndex ? 'border-[color:var(--accent)] bg-[color:var(--bg-alt)]' : 'border-[color:var(--border)] hover:bg-[color:var(--bg-alt)]'}`}
                      >
                        <img src={item.url} alt={item.file.name} className="w-12 h-12 rounded object-cover border border-[color:var(--border)]" />
                        <span className="text-sm truncate">{item.file.name}</span>
                      </button>
                    ))}
                  </aside>
                </div>

                <div className="border-t border-[color:var(--border)] p-4 flex flex-wrap items-center justify-between gap-3 bg-[color:var(--bg)]">
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <span className="text-sm">-</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={queueZoom}
                      onChange={(e) => setQueueZoom(Number(e.target.value))}
                      className="w-28"
                    />
                    <span className="text-sm">+</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setQueueCrop({ x: 0, y: 0 })
                        setQueueZoom(1)
                      }}
                      className="px-4 py-2 border border-[color:var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--border)] transition-colors font-medium"
                      disabled={cropQueueUploading}
                    >
                      Revert to original
                    </button>
                    <button
                      type="button"
                      onClick={closeCropQueue}
                      className="px-4 py-2 border border-[color:var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--border)] transition-colors font-medium"
                      disabled={cropQueueUploading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCurrentQueueItem}
                      className="px-4 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                      disabled={cropQueueUploading}
                    >
                      {cropQueueUploading
                        ? 'Uploading...'
                        : cropQueueIndex >= cropQueueFiles.length - 1
                          ? 'Confirm'
                          : 'Confirm & Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
