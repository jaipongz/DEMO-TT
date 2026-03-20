'use client'

import { useState, useRef, useEffect } from 'react'

interface VideoUploadProps {
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

export default function VideoUpload({ 
  value, 
  onChange, 
  onUploaded,
  gen,
  returnType = 'url',
  module, 
  accept = 'video/*', 
  maxSize = 100,
  disabled = false,
}: VideoUploadProps) {
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
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (uploading) return
    setPreview(resolvePreview(value, gen))
  }, [value, gen, module, returnType, uploading])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file')
      return
    }

    // Clear any previous errors
    setError('')

    // Upload file and wait for completion
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('module', module)

    try {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 201 || xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          let fileUrl = response.url || response.data?.url
          
          // Convert relative URL to absolute URL
          if (fileUrl && fileUrl.startsWith('/')) {
            fileUrl = `${apiHost}${fileUrl}`
          }

          const logicalName = String(response.fileName || response.file_name || '')
          const valueToStore = returnType === 'filename' ? logicalName : String(fileUrl || '')
          onChange(valueToStore)
          onUploaded?.({
            url: String(fileUrl || ''),
            gen: String(response.gen || ''),
            fileName: logicalName,
          })
          setError('')
          setPreview(String(fileUrl || ''))
        } else {
          setError('Upload failed')
          onUploaded?.(null)
        }
        setUploading(false)
        setProgress(0)
      })

      xhr.addEventListener('error', () => {
        setError('Upload error')
        onUploaded?.(null)
        setUploading(false)
        setProgress(0)
      })

      xhr.open('POST', `${apiHost}/api/uploads`)
      xhr.send(formData)
    } catch (err) {
      setError('Failed to upload video')
      onUploaded?.(null)
      setUploading(false)
      setProgress(0)
    }
  }

  const handleRemove = () => {
    if (disabled) return
    setPreview(null)
    onChange('')
    onUploaded?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
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
            <i className="fas fa-video text-3xl text-[color:var(--text-muted)]" />
            <p className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Click to upload video'}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              MP4, WebM, or OGG (Max {maxSize}MB)
            </p>
          </div>

          {/* Progress Bar */}
          {uploading && progress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-[color:var(--border)] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[color:var(--accent)] h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[color:var(--text-muted)] mt-2">{progress}%</p>
            </div>
          )}
        </div>
      ) : (
        /* Video Preview */
        <div className="relative bg-black rounded-lg overflow-hidden h-48 flex items-center justify-center group">
          <video
            ref={videoRef}
            src={preview}
            controls
            className="w-full h-full object-contain"
          />

          {/* Action Buttons - Top right with icons only */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              title="Change video"
            >
              <i className="fas fa-sync-alt" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove video"
            >
              <i className="fas fa-trash" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}
