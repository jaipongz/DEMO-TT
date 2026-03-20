'use client'

import { useState, useRef, useEffect } from 'react'

interface FileTypeUploadProps {
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

export default function FileTypeUpload({
  value,
  onChange,
  onUploaded,
  gen,
  returnType = 'url',
  module,
  accept = '*',
  maxSize = 50,
  disabled = false,
}: FileTypeUploadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
  const apiHost = baseUrl.replace(/\/+$/, '')
  const resolveFileName = (rawValue: string) => {
    if (!rawValue) return null
    if (rawValue.startsWith('http://') || rawValue.startsWith('https://') || rawValue.startsWith('/')) {
      return decodeURIComponent(rawValue.split('/').pop() || '')
    }
    return rawValue
  }

  const resolvePreviewUrl = (rawValue: string, rawGen?: string) => {
    if (!rawValue) return ''
    if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) return rawValue
    if (rawValue.startsWith('/')) return `${apiHost}${rawValue}`
    if (returnType === 'filename' && rawGen) {
      return `${apiHost}/stock/${module}/${rawGen}/${encodeURIComponent(rawValue)}`
    }
    return ''
  }

  const [fileName, setFileName] = useState<string | null>(resolveFileName(value))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (uploading) return
    setFileName(resolveFileName(value))
  }, [value, gen, uploading])

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''

    const iconMap: Record<string, string> = {
      pdf: 'fa-file-pdf text-red-500',
      doc: 'fa-file-word text-blue-500',
      docx: 'fa-file-word text-blue-500',
      xls: 'fa-file-excel text-green-500',
      xlsx: 'fa-file-excel text-green-500',
      ppt: 'fa-file-powerpoint text-orange-500',
      pptx: 'fa-file-powerpoint text-orange-500',
      zip: 'fa-file-zipper text-yellow-600',
      txt: 'fa-file-text text-gray-500',
      json: 'fa-file-code text-yellow-500',
      csv: 'fa-file-csv text-green-500',
    }

    return iconMap[ext] || 'fa-file text-gray-400'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    setError('')
    await uploadFile(file)
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
      const logicalName = String(data.fileName || data.file_name || file.name)
      const valueToStore = returnType === 'filename' ? logicalName : absoluteUrl
      setFileName(logicalName)
      onChange(valueToStore)
      onUploaded?.({
        url: absoluteUrl,
        gen: String(data.gen || ''),
        fileName: logicalName,
      })
    } catch (err: any) {
      setError(err.message || 'Upload error')
      setFileName(null)
      onUploaded?.(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    if (disabled) return
    setFileName(null)
    onChange('')
    onUploaded?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      {!fileName ? (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-[color:var(--border)] rounded-lg p-6 py-8 text-center transition-colors bg-[color:var(--background)] flex items-center justify-center ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[color:var(--accent)]'}`}
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
            <i className="fas fa-cloud-arrow-up text-3xl text-[color:var(--text-muted)]" />
            <p className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Click to upload file'}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              Max {maxSize}MB
            </p>
          </div>
        </div>
      ) : (
        /* File Display */
        <div className="relative flex items-center p-4 bg-[color:var(--background)] border border-[color:var(--border)] rounded-lg group hover:bg-[color:var(--card)] transition-colors overflow-hidden">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <i className={`fas ${getFileIcon(fileName)} text-2xl`} />
            <span className="text-sm font-medium truncate" title={fileName}>
              {fileName}
            </span>
            {returnType === 'filename' && fileName && gen && (
              <a
                href={resolvePreviewUrl(fileName, gen)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[color:var(--accent)] hover:underline ml-2"
              >
                Open
              </a>
            )}
          </div>

          {/* Action Buttons - hover to show */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              title="Replace file"
            >
              <i className="fas fa-sync-alt text-sm" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[color:var(--accent)] text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove file"
            >
              <i className="fas fa-trash text-sm" />
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
