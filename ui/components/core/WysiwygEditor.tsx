'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WysiwygImageUpload from './WysiwygImageUpload'
import VideoUpload from './VideoUpload'

declare global {
  interface Window {
    tinymce?: any
  }
}

interface WysiwygEditorProps {
  id: string
  value: string
  onChange: (content: string) => void
  height?: number
  readOnly?: boolean
  module?: string
}

type PickerMode = 'image' | 'media'

let tinymceLoader: Promise<any> | null = null
let unloadBlockerRefCount = 0
let restoreUnloadBlocker: (() => void) | null = null

const attachGlobalUnloadBlocker = (): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  unloadBlockerRefCount += 1
  if (restoreUnloadBlocker) {
    return () => {
      unloadBlockerRefCount = Math.max(0, unloadBlockerRefCount - 1)
      if (unloadBlockerRefCount === 0 && restoreUnloadBlocker) {
        restoreUnloadBlocker()
        restoreUnloadBlocker = null
      }
    }
  }

  const originalAddEventListener = EventTarget.prototype.addEventListener

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'unload') return
    return originalAddEventListener.call(this, type, listener as EventListenerOrEventListenerObject, options)
  }

  restoreUnloadBlocker = () => {
    EventTarget.prototype.addEventListener = originalAddEventListener
  }

  return () => {
    unloadBlockerRefCount = Math.max(0, unloadBlockerRefCount - 1)
    if (unloadBlockerRefCount === 0 && restoreUnloadBlocker) {
      restoreUnloadBlocker()
      restoreUnloadBlocker = null
    }
  }
}

const withUnloadListenerBlocked = async <T,>(task: () => Promise<T>): Promise<T> => {
  const originalAddEventListener = window.addEventListener

  window.addEventListener = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    if (type === 'unload') return
    return originalAddEventListener.call(window, type, listener, options)
  }) as typeof window.addEventListener

  try {
    return await task()
  } finally {
    window.addEventListener = originalAddEventListener
  }
}

const loadTinymceScript = () => {
  if ((window as any).tinymce) return Promise.resolve((window as any).tinymce)
  if (tinymceLoader) return tinymceLoader

  tinymceLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/tinymce/tinymce.min.js'
    script.async = true
    script.onload = () => resolve((window as any).tinymce)
    script.onerror = (err) => {
      console.warn('Failed to load TinyMCE script')
      tinymceLoader = null
      reject(err)
    }
    document.head.appendChild(script)
  })

  return tinymceLoader
}

export default function WysiwygEditor({ id, value, onChange, height = 400, readOnly = false, module = 'article' }: WysiwygEditorProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
  const apiHost = useMemo(() => baseUrl.replace(/\/+$/, ''), [baseUrl])
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const initRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const editorRef = useRef<any>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('image')
  const [uploadValue, setUploadValue] = useState('')
  const [uploaderKey, setUploaderKey] = useState(0)

  const resolveAbsoluteUrl = useCallback((url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${apiHost}${url.startsWith('/') ? url : `/${url}`}`
  }, [apiHost])

  const openPicker = useCallback((mode: PickerMode) => {
    if (readOnly) return
    setPickerMode(mode)
    setUploadValue('')
    setUploaderKey((prev) => prev + 1)
    setPickerOpen(true)
  }, [readOnly])

  const closePicker = useCallback(() => {
    setPickerOpen(false)
    setUploadValue('')
  }, [])

  const insertUploadedMedia = useCallback((args: { src: string; fileName: string; mimeType: string }) => {
    const editor = editorRef.current
    if (!editor) return

    const src = String(args.src || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const fileName = String(args.fileName || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (args.mimeType.startsWith('image/')) {
      editor.insertContent(`<img src="${src}" alt="" />`)
    } else if (args.mimeType.startsWith('video/')) {
      editor.insertContent(`<video controls src="${src}"></video>`)
    } else if (args.mimeType.startsWith('audio/')) {
      editor.insertContent(`<audio controls src="${src}"></audio>`)
    } else {
      editor.insertContent(`<a href="${src}" target="_blank" rel="noopener noreferrer">${fileName || 'Download file'}</a>`)
    }

    onChangeRef.current(editor.getContent())
    setPickerOpen(false)
  }, [])

  const handleUploadedImage = useCallback((meta: { url: string; gen: string; fileName?: string } | null) => {
    if (!meta?.fileName) return
    const fileName = String(meta.fileName || '').trim()
    const gen = String(meta.gen || '').trim()
    const canonical = fileName && gen
      ? `${apiHost}/stock/${encodeURIComponent(module)}/${encodeURIComponent(gen)}/${encodeURIComponent(fileName)}`
      : resolveAbsoluteUrl(String(meta.url || ''))

    insertUploadedMedia({ src: canonical, fileName, mimeType: 'image/*' })
  }, [apiHost, insertUploadedMedia, module, resolveAbsoluteUrl])

  const handleUploadedVideo = useCallback((meta: { url: string; gen: string; fileName?: string } | null) => {
    if (!meta?.fileName) return
    const fileName = String(meta.fileName || '').trim()
    const gen = String(meta.gen || '').trim()
    const canonical = fileName && gen
      ? `${apiHost}/stock/${encodeURIComponent(module)}/${encodeURIComponent(gen)}/${encodeURIComponent(fileName)}`
      : resolveAbsoluteUrl(String(meta.url || ''))

    insertUploadedMedia({ src: canonical, fileName, mimeType: 'video/*' })
  }, [apiHost, insertUploadedMedia, module, resolveAbsoluteUrl])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    let isMounted = true
    const detachUnloadBlocker = attachGlobalUnloadBlocker()

    const initTinymce = async () => {
      try {
        const tinymce = await withUnloadListenerBlocked(() => loadTinymceScript())
        if (!isMounted || !textareaRef.current || !tinymce) return

        const existing = tinymce.get(id)
        if (existing) existing.remove()

        await withUnloadListenerBlocked(() => tinymce.init({
          target: textareaRef.current,
          selector: `#${id}`,
          height: height,
          menubar: false,
          statusbar: true,
          branding: false,
          resize: true,
          readonly: readOnly ? 1 : 0,
          add_unload_trigger: false,
          placeholder: 'Start typing here...',
          plugins: [
            'advlist autolink lists link image charmap preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste wordcount hr'
          ],
          toolbar: [
            'fontselect fontsizeselect formatselect | bold italic underline strikethrough | forecolor backcolor',
            'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link customImageUpload customMediaUpload table | hr blockquote code removeformat | undo redo fullscreen'
          ],
          toolbar_mode: 'wrap',
          font_formats: [
            'Inter=Inter, sans-serif',
            'Kanit=Kanit, sans-serif',
            'Sarabun=Sarabun, sans-serif',
            'Noto Sans Thai=Noto Sans Thai, sans-serif',
            'Arial=Arial, Helvetica, sans-serif',
            'Georgia=Georgia, serif',
            'Times New Roman=Times New Roman, serif',
            'Courier New=Courier New, monospace',
            'Verdana=Verdana, sans-serif',
            'Tahoma=Tahoma, sans-serif',
          ].join('; '),
          fontsize_formats: '10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 48px',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Blockquote=blockquote; Code=pre',
          setup: (editor: any) => {
            editorRef.current = editor

            const emitContent = () => {
              if (readOnly) return
              const content = editor.getContent()
              onChangeRef.current(content)
            }

            editor.ui.registry.addButton('customImageUpload', {
              icon: 'image',
              tooltip: 'Upload image',
              onAction: () => openPicker('image'),
            })

            editor.ui.registry.addButton('customMediaUpload', {
              icon: 'embed',
              tooltip: 'Upload media',
              onAction: () => openPicker('media'),
            })

            editor.on('init', () => {
              if (!isMounted) {
                editor.remove()
                return
              }
              editor.setContent(valueRef.current || '')
              initRef.current = true
            })

            editor.on('change keyup input undo redo setcontent', emitContent)
            editor.on('ObjectResized mouseup blur', () => {
              window.setTimeout(() => emitContent(), 0)
            })
          },
          skin_url: '/tinymce/skins/ui/oxide',
          content_css: '/tinymce/skins/content/default/content.min.css',
          content_style: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 15px;
            line-height: 1.7;
            color: #0a0a0a;
            background: #ffffff;
            padding: 16px 20px;
            max-width: 100%;
            -webkit-font-smoothing: antialiased;
          }
          p { margin: 0 0 0.85em; }
          h1, h2, h3, h4 {
            margin: 1.2em 0 0.5em;
            font-weight: 700;
            color: #0a0a0a;
            letter-spacing: -0.02em;
            line-height: 1.3;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.2em; }
          h4 { font-size: 1.05em; }
          blockquote {
            border-left: 3px solid #0a0a0a;
            margin: 1.25em 0;
            padding: 0.75em 1.25em;
            background: #f5f5f5;
            border-radius: 0 8px 8px 0;
            color: #111111;
            font-style: italic;
          }
          pre {
            background: #0a0a0a;
            color: #f5f5f5;
            padding: 16px 20px;
            border-radius: 10px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
            font-size: 13px;
            overflow-x: auto;
            border: 1px solid #222222;
            line-height: 1.5;
          }
          code {
            background: #f3f3f3;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
            font-family: 'JetBrains Mono', monospace;
            color: #111111;
          }
          pre code { background: none; padding: 0; color: inherit; }
          table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #d6d6d6;
          }
          table td, table th {
            border-bottom: 1px solid #d6d6d6;
            border-right: 1px solid #d6d6d6;
            padding: 10px 14px;
          }
          table td:last-child, table th:last-child { border-right: none; }
          table tr:last-child td { border-bottom: none; }
          table th {
            background: #f5f5f5;
            font-weight: 600;
            text-align: left;
            color: #111111;
            font-size: 0.875em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          table tr:hover td { background: #fafafa; }
          a { color: #111111; text-decoration: underline; text-decoration-color: #999999; transition: text-decoration-color 0.15s; }
          a:hover { text-decoration-color: #111111; }
          img {
            border-radius: 8px;
          }
          img:not([width]):not([style*="width"]) {
            max-width: 100%;
            height: auto;
          }
          hr {
            border: none;
            height: 1px;
            background: linear-gradient(to right, transparent, #cfcfcf, transparent);
            margin: 2em 0;
          }
          ul, ol { padding-left: 1.5em; margin: 0.5em 0 1em; }
          li { margin: 0.25em 0; }
          li::marker { color: #666666; }
          ::selection { background: #e5e5e5; color: #0a0a0a; }
        `,
        // Optional: add your TinyMCE API key if you have a license
        // api_key: process.env.NEXT_PUBLIC_TINYMCE_KEY
        }))
      } catch (err) {
        console.warn('TinyMCE init failed', err)
        initRef.current = false
      }
    }

    initTinymce()

    return () => {
      isMounted = false
      detachUnloadBlocker()
      editorRef.current = null
      try {
        const tinymce = (window as any).tinymce
        if (tinymce && tinymce.get(id)) {
          tinymce.get(id).remove()
        }
      } catch (e) {
        // Silently fail
      }
    }
  }, [id, height, readOnly])

  useEffect(() => {
    if (!initRef.current) return
    const tinymce = (window as any).tinymce
    const editor = tinymce?.get(id)
    if (editor && editor.getContent() !== (value || '')) {
      editor.setContent(value || '')
    }
  }, [value, id])

  useEffect(() => {
    if (!initRef.current) return
    const tinymce = (window as any).tinymce
    const editor = tinymce?.get(id)
    if (editor) {
      editor.setMode(readOnly ? 'readonly' : 'design')
    }
  }, [readOnly, id])

  return (
    <div className="wysiwyg-wrapper rounded-xl overflow-hidden border border-[color:var(--border)]  ">
      {pickerOpen && !readOnly && (
        <div className="fixed top-[calc(var(--nav-height)-1px)] right-0 bottom-0 left-0 lg:left-64 z-[55] bg-[color:var(--bg)]/80 backdrop-blur-sm overflow-y-auto !mt-0">
          <div className="px-4 py-3 sm:py-5 sm:px-6 lg:px-10 h-full">
            <div className="max-w-7xl mx-auto w-full min-h-full flex items-center justify-center">
              <div className="w-full max-w-2xl bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">
                    {pickerMode === 'image' ? 'Upload Image' : 'Upload Media'}
                  </h4>
                  <button
                    type="button"
                    onClick={closePicker}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>

                {pickerMode === 'image' ? (
                  <WysiwygImageUpload
                    key={`wysiwyg-image-${uploaderKey}`}
                    value={uploadValue}
                    onChange={(next) => setUploadValue(next)}
                    onUploaded={handleUploadedImage}
                    returnType="filename"
                    module={module}
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={50}
                    disabled={readOnly}
                  />
                ) : (
                  <VideoUpload
                    key={`wysiwyg-video-${uploaderKey}`}
                    value={uploadValue}
                    onChange={(next) => setUploadValue(next)}
                    onUploaded={handleUploadedVideo}
                    returnType="filename"
                    module={module}
                    accept="video/*"
                    maxSize={100}
                    disabled={readOnly}
                  />
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        id={id}
        defaultValue={value}
        className="w-full px-3 py-2"
      />
      <style jsx global>{`
        .wysiwyg-wrapper .tox.tox-tinymce {
          border: none !important;
          border-radius: 0 !important;
        }
        .wysiwyg-wrapper .tox .tox-toolbar__group {
          border-color: var(--border) !important;
        }
        .wysiwyg-wrapper .tox .tox-toolbar,
        .wysiwyg-wrapper .tox .tox-toolbar__overflow,
        .wysiwyg-wrapper .tox .tox-toolbar__primary {
          background: var(--bg-alt) !important;
          border: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }
        .wysiwyg-wrapper .tox .tox-toolbar-overlord {
          border-bottom: none !important;
          box-shadow: none !important;
        }
        .wysiwyg-wrapper .tox .tox-editor-header {
          border-bottom: none !important;
          box-shadow: none !important;
        }
        .wysiwyg-wrapper .tox .tox-edit-area {
          border-top: none !important;
        }
        .wysiwyg-wrapper .tox .tox-edit-area__iframe {
          background: var(--card) !important;
        }
        .wysiwyg-wrapper .tox .tox-tbtn {
          border-radius: 6px !important;
          margin: 2px 1px !important;
          transition: all 0.15s ease !important;
        }
        .wysiwyg-wrapper .tox .tox-tbtn:hover {
          background: var(--bg) !important;
          color: var(--text) !important;
        }
        .wysiwyg-wrapper .tox .tox-tbtn--enabled,
        .wysiwyg-wrapper .tox .tox-tbtn--enabled:hover {
          background: var(--text) !important;
          color: var(--card) !important;
        }
        .wysiwyg-wrapper .tox .tox-statusbar {
          border-top: none !important;
          box-shadow: none !important;
          background: var(--bg-alt) !important;
          font-size: 11px;
          color: var(--text-muted);
        }
        .wysiwyg-wrapper .tox .tox-tbtn svg {
          fill: var(--text-muted) !important;
        }
        .wysiwyg-wrapper .tox .tox-tbtn:hover svg {
          fill: var(--text) !important;
        }
        .wysiwyg-wrapper .tox .tox-tbtn--enabled svg,
        .wysiwyg-wrapper .tox .tox-tbtn--enabled:hover svg {
          fill: var(--card) !important;
        }
        .wysiwyg-wrapper .tox .tox-selectfield select,
        .wysiwyg-wrapper .tox .tox-tbtn--select {
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  )
}
