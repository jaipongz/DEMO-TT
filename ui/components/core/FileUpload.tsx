'use client'

import { useState, useRef, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop'

type FileUploadMode =
  | { type: 'crop'; width: number; height: number }
  | { type: 'scaledown' }

interface FileUploadProps {
  value: string
  onChange: (url: string) => void
  onUploaded?: (meta: { url: string; gen: string; fileName?: string } | null) => void
  gen?: string
  returnType?: 'url' | 'filename'
  module: string
  accept?: string
  maxSize?: number
  aspect?: number | null
  mode?: FileUploadMode
  disabled?: boolean
}

export default function FileUpload({
  value,
  onChange,
  onUploaded,
  gen,
  returnType = 'url',
  module,
  accept = 'image/*',
  maxSize = 5,
  aspect = 16 / 9,
  mode,
  disabled = false,
}: FileUploadProps) {
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  useEffect(() => {
    const nextPreview = resolvePreview(value, gen)
    if (nextPreview) {
      setPreview(nextPreview)
    } else if (!showCropModal) {
      setPreview(null)
      setPreviewOpen(false)
    }
  }, [value, gen, showCropModal])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    if (mode?.type === 'scaledown') {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setError('')
      uploadFile(file)
      return
    }

    // Create preview for cropping
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setImageToCrop(result)
      setFileToUpload(file)
      setShowCropModal(true)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) throw new Error('No 2d context')

    const targetWidth = mode?.type === 'crop' ? mode.width : pixelCrop.width
    const targetHeight = mode?.type === 'crop' ? mode.height : pixelCrop.height

    canvas.width = targetWidth
    canvas.height = targetHeight

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight,
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob as Blob)
      }, 'image/jpeg', 0.95)
    })
  }

  const handleConfirmCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) return

    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], fileToUpload?.name || 'cropped.jpg', { type: 'image/jpeg' })
      
      setShowCropModal(false)
      setImageToCrop(null)
      
      // Show cropped preview
      const croppedPreview = URL.createObjectURL(croppedBlob)
      setPreview(croppedPreview)
      
      // Upload cropped file
      await uploadFile(croppedFile)
    } catch (err: any) {
      setError(err.message || 'Crop error')
    }
  }

  const handleCancelCrop = () => {
    if (disabled) return
    setShowCropModal(false)
    setImageToCrop(null)
    setFileToUpload(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('module', module)

      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const response = await fetch(`${apiHost}/api/uploads`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Upload failed')
      }

      const data = await response.json()
      const fileUrl = data.url || data.path
      // Convert relative URL to absolute URL pointing to backend API
      const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${apiHost}${fileUrl}`
      setPreview(absoluteUrl)
      const logicalName = String(data.fileName || data.file_name || '')
      const valueToStore = returnType === 'filename' ? logicalName : absoluteUrl
      onChange(valueToStore)
      onUploaded?.({
        url: absoluteUrl,
        gen: String(data.gen || ''),
        fileName: logicalName,
      })
    } catch (err: any) {
      setError(err.message || 'Upload error')
      setPreview(null)
      onUploaded?.(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    if (disabled) return
    setPreview(null)
    setPreviewOpen(false)
    onChange('')
    onUploaded?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {previewOpen && preview && (
        <div className="preview-overlay-standard">
          <div className="px-4 py-3 sm:py-5 sm:px-6 lg:px-10 h-full">
            <div className="max-w-7xl mx-auto w-full min-h-full flex items-center justify-center">
              <div className="w-full max-w-4xl bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-base font-semibold">Preview Image</h4>
                  <button type="button" onClick={() => setPreviewOpen(false)} className="btn btn-secondary">Close</button>
                </div>
                <div className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-alt)] p-2 flex items-center justify-center min-h-[260px]">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-[70vh] w-auto max-w-full rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && imageToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-[color:var(--border)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Crop Image</h2>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Crop Area */}
            <div className="flex-1 bg-black relative overflow-hidden" style={{ minHeight: '400px' }}>
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={mode?.type === 'crop' ? mode.width / mode.height : (aspect ?? undefined)}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
                restrictPosition={true}
                showGrid={true}
              />
            </div>

            {/* Controls */}
            <div className="border-t border-[color:var(--border)] p-4 space-y-4">
              {/* Zoom Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Zoom</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-[color:var(--border)] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="px-4 py-2 border border-[color:var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--border)] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  disabled={uploading}
                  className="px-4 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Crop & Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area or Preview */}
      {preview ? (
        // Preview State
        <div className="relative w-full h-48 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg overflow-hidden flex items-center justify-center group">
          <img
            src={preview}
            alt="Preview"
            className="h-full w-auto"
          />

          {/* Action Buttons - hover to show */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              title="Preview image"
            >
              <i className="fas fa-eye" />
            </button>
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
              disabled={uploading || disabled}
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
            disabled={uploading || showCropModal || disabled}
            className="hidden"
          />
        </div>
      ) : (
        // Upload Area
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-[color:var(--border)] rounded-lg p-8 h-48 text-center transition-colors flex items-center justify-center ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[color:var(--accent)] hover:bg-[color:var(--card)]'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading || showCropModal || disabled}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[color:var(--text-muted)]">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <i className="fas fa-image text-3xl text-[color:var(--text-muted)]" />
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs text-[color:var(--text-muted)]">JPG, PNG, or WebP (Max {maxSize}MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
