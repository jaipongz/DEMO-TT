import { useEffect } from 'react'

type ToastType = 'success' | 'error'

interface ToastProps {
  open: boolean
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ open, message, type = 'success', onClose, duration = 2600 }: ToastProps) {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [duration, onClose, open])

  if (!open) return null

  const accentTone =
    type === 'error'
      ? 'text-rose-300 border-rose-400/45 bg-rose-400/12'
      : 'text-emerald-300 border-emerald-400/45 bg-emerald-400/12'

  return (
    <div className="pointer-events-none fixed right-3 top-[calc(var(--nav-height)+0.65rem)] z-[130] w-[min(92vw,420px)] sm:right-5 sm:w-[min(70vw,420px)]">
      <div className="toast-shell pointer-events-auto animate-toast-in rounded-xl border border-white/20 bg-[#111318] text-[#f5f7fb] shadow-[0_18px_42px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
          <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border ${accentTone}`}>
            <i className={`text-xs ${type === 'error' ? 'fas fa-exclamation' : 'fas fa-check'}`} aria-hidden="true" />
          </span>
          <p className="flex-1 text-sm font-medium leading-5">{message}</p>
          <button
            type="button"
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#c4c9d6]/80 transition-colors hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close toast"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>
    </div>
  )
}
