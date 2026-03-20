'use client'

import { useEffect, useRef, useState } from 'react'
import ReactCrop, { PercentCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface WysiwygImageUploadProps {
  value: string
  onChange: (url: string) => void
  onUploaded?: (meta: { url: string; gen: string; fileName?: string } | null) => void
  gen?: string
  returnType?: 'url' | 'filename'
  module: string
  accept?: string
  maxSize?: number
  disabled?: boolean
}

export default function WysiwygImageUpload({
  value,
  onChange,
  onUploaded,
  gen,
  returnType = 'url',
  module,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 50,
  disabled = false,
}: WysiwygImageUploadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
  const apiHost = baseUrl.replace(/\/+$/, '')

  const resolvePreview = (rawValue: string, rawGen?: string) => {
    if (!rawValue) return null
    if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) return rawValue
    if (rawValue.startsWith('/')) return `${apiHost}${rawValue}`
    if (returnType === 'filename' && rawGen) {
      return `${apiHost}/stock/${module}/${rawGen}/${encodeURIComponent(rawValue)}`
    }
    return null
  }

  const [preview, setPreview] = useState<string | null>(resolvePreview(value, gen))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [crop, setCrop] = useState<PercentCrop>({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
  const [completedPercentCrop, setCompletedPercentCrop] = useState<PercentCrop | null>(null)
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [altText, setAltText] = useState('')
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropImageRef = useRef<HTMLImageElement | null>(null)
  const cropFrameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (uploading) return
    setPreview(resolvePreview(value, gen))
  }, [value, gen, module, returnType, uploading])

  useEffect(() => {
    return () => {
      if (imageToCrop?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToCrop)
      }
    }
  }, [imageToCrop])

  useEffect(() => {
    if (!showCropModal) return
    const frame = cropFrameRef.current
    if (!frame) return

    const updateFrameSize = () => {
      setFrameSize({ width: frame.clientWidth, height: frame.clientHeight })
    }

    updateFrameSize()

    const observer = new ResizeObserver(() => {
      updateFrameSize()
    })
    observer.observe(frame)

    return () => {
      observer.disconnect()
    }
  }, [showCropModal])

  const isFrameLandscape = frameSize.width >= frameSize.height

  const clearCropState = () => {
    if (imageToCrop?.startsWith('blob:')) {
      URL.revokeObjectURL(imageToCrop)
    }
    setShowCropModal(false)
    setImageToCrop(null)
    setFileToUpload(null)
    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
    setCompletedPercentCrop(null)
    setImageMeta({ width: 0, height: 0 })
    setAltText('')
    cropImageRef.current = null
  }

  const getCroppedBlob = (image: HTMLImageElement, percentCrop: PercentCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return Promise.reject(new Error('No 2d context'))
    }

    // Use percent crop to avoid visual-scaling drift and ensure final output matches selected area.
    const sourceX = Math.max(0, Math.round((percentCrop.x / 100) * image.naturalWidth))
    const sourceY = Math.max(0, Math.round((percentCrop.y / 100) * image.naturalHeight))
    const sourceWidth = Math.max(1, Math.round((percentCrop.width / 100) * image.naturalWidth))
    const sourceHeight = Math.max(1, Math.round((percentCrop.height / 100) * image.naturalHeight))

    canvas.width = sourceWidth
    canvas.height = sourceHeight

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create cropped image'))
          return
        }
        resolve(blob)
      }, 'image/jpeg', 0.95)
    })
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('module', module)

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch(`${apiHost}/api/uploads`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Upload failed')
      }

      const data = await response.json()
      const fileUrl = String(data.url || data.path || '')
      const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${apiHost}${fileUrl}`
      const logicalName = String(data.fileName || data.file_name || '')
      const valueToStore = returnType === 'filename' ? logicalName : absoluteUrl

      setPreview(absoluteUrl)
      onChange(valueToStore)
      onUploaded?.({
        url: absoluteUrl,
        gen: String(data.gen || ''),
        fileName: logicalName,
      })
    } catch (err: any) {
      setError(err?.message || 'Upload error')
      setPreview(null)
      onUploaded?.(null)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const nextAltText = file.name || ''

    try {
      const imageSize = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const probe = new Image()
        probe.onload = () => {
          resolve({ width: probe.naturalWidth, height: probe.naturalHeight })
        }
        probe.onerror = () => {
          reject(new Error('Failed to read image dimensions'))
        }
        probe.src = objectUrl
      })

      const fullCrop: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 }
      setImageMeta(imageSize)
      setAltText(nextAltText)
      setCrop(fullCrop)
      setCompletedPercentCrop(fullCrop)
      setFileToUpload(file)
      setImageToCrop(objectUrl)
      setShowCropModal(true)
      setError('')
    } catch (err: any) {
      URL.revokeObjectURL(objectUrl)
      setError(err?.message || 'Cannot open image for crop')
    }
  }

  const handleCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    cropImageRef.current = img
    if (!imageMeta.width || !imageMeta.height) {
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight })
    }
    if (!altText) {
      setAltText(fileToUpload?.name || '')
    }
  }

  const handleConfirmCrop = async () => {
    if (!fileToUpload || !cropImageRef.current) {
      setError('Please select crop area')
      return
    }

    const effectivePercentCrop = completedPercentCrop ?? crop
    const normalizedPercentCrop: PercentCrop = {
      unit: '%',
      x: Math.min(100, Math.max(0, effectivePercentCrop.x ?? 0)),
      y: Math.min(100, Math.max(0, effectivePercentCrop.y ?? 0)),
      width: Math.min(100, Math.max(0.1, effectivePercentCrop.width ?? 100)),
      height: Math.min(100, Math.max(0.1, effectivePercentCrop.height ?? 100)),
    }

    try {
      setUploading(true)
      setError('')
      const croppedBlob = await getCroppedBlob(cropImageRef.current, normalizedPercentCrop)
      const croppedFile = new File([croppedBlob], fileToUpload.name || 'wysiwyg-image.jpg', { type: 'image/jpeg' })
      clearCropState()
      await uploadFile(croppedFile)
    } catch (err: any) {
      setError(err?.message || 'Crop error')
      setUploading(false)
    }
  }

  const handleCancelCrop = () => {
    if (disabled || uploading) return
    clearCropState()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    if (disabled) return
    setPreview(null)
    setError('')
    onChange('')
    onUploaded?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="border-b border-[color:var(--border)] p-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Crop & edit</h2>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors"
                disabled={uploading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_300px]">
              <div className="bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_30%),#0b0b0b] p-4 sm:p-6 flex items-center justify-center min-h-0 overflow-hidden">
                <div
                  ref={cropFrameRef}
                  className="wysiwyg-crop-frame w-full max-w-4xl h-full max-h-[620px] min-h-[320px] overflow-hidden flex items-center justify-center border border-white/15 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(_, percentCrop) => setCompletedPercentCrop(percentCrop)}
                    keepSelection
                    className="wysiwyg-crop-surface"
                  >
                    <img
                      src={imageToCrop}
                      alt="Crop"
                      onLoad={handleCropImageLoad}
                      className={[
                        'object-contain block select-none',
                        isFrameLandscape
                          ? 'h-full w-auto'
                          : 'w-full h-auto',
                      ].join(' ')}
                      draggable={false}
                    />
                  </ReactCrop>
                </div>
              </div>

              <aside className="border-t lg:border-t-0 lg:border-l border-[color:var(--border)] p-4 bg-[color:var(--card)] space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Alt Image <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="w-full h-10 px-3 border border-[color:var(--border)] rounded-md bg-[color:var(--bg)] text-sm"
                    placeholder="Image alt text"
                  />
                </div>

                <div className="pt-1 border-t border-[color:var(--border)]">
                  <p className="text-sm font-semibold mb-2">Image size</p>
                  <p className="text-sm text-[color:var(--text-muted)]">
                    Width: {imageMeta.width || '-'} px
                  </p>
                  <p className="text-sm text-[color:var(--text-muted)]">
                    Height: {imageMeta.height || '-'} px
                  </p>
                </div>

                <div className="pt-1 border-t border-[color:var(--border)]">
                  <p className="text-sm font-semibold mb-2">Crop options</p>
                  <p className="text-xs text-[color:var(--text-muted)] leading-5">
                    Drag handles to freely crop. Final image will match selected frame exactly.
                  </p>
                </div>
              </aside>
            </div>

            <div className="border-t border-[color:var(--border)] p-4 flex flex-wrap gap-3 justify-end bg-[color:var(--bg)]">
              <button
                type="button"
                onClick={() => {
                  const fullCrop: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 }
                  setCrop(fullCrop)
                  setCompletedPercentCrop(fullCrop)
                }}
                className="px-4 py-2 border border-[color:var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--border)] transition-colors font-medium"
                disabled={uploading}
              >
                Revert to original
              </button>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="px-4 py-2 border border-[color:var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--border)] transition-colors font-medium"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={uploading}
                className="px-4 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!preview ? (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-[color:var(--border)] rounded-lg p-8 h-48 text-center transition-colors bg-[color:var(--background)] flex items-center justify-center ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[color:var(--accent)]'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            className="hidden"
          />

          <div className="space-y-2">
            <i className="fas fa-image text-3xl text-[color:var(--text-muted)]" />
            <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload image'}</p>
            <p className="text-xs text-[color:var(--text-muted)]">JPG, PNG, WEBP (Max {maxSize}MB)</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-48 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg overflow-hidden flex items-center justify-center group">
          <img src={preview} alt="Preview" className="h-full w-auto object-contain" />

          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              title="Change image"
            >
              <i className="fas fa-sync-alt" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove image"
            >
              <i className="fas fa-trash" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      <style jsx global>{`
        .wysiwyg-crop-frame .ReactCrop {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }
        .wysiwyg-crop-frame .wysiwyg-crop-surface {
          width: 100%;
          height: 100%;
        }
        .wysiwyg-crop-frame .ReactCrop__child-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .wysiwyg-crop-frame .ReactCrop__child-wrapper > img {
          max-width: 100% !important;
          max-height: 100% !important;
        }
        .wysiwyg-crop-frame .ReactCrop__crop-selection {
          border: 2px solid #ffffff;
          background-image: none !important;
          animation: none !important;
          box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.45);
        }
        .wysiwyg-crop-frame .ReactCrop__crop-selection::before,
        .wysiwyg-crop-frame .ReactCrop__crop-selection::after {
          content: none !important;
        }
        .wysiwyg-crop-frame .ReactCrop__drag-bar {
          display: none !important;
        }
        .wysiwyg-crop-frame .ReactCrop__drag-handle {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          border: 1px solid rgba(0, 0, 0, 0.45);
          background: #ffffff;
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
