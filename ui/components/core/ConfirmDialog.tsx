interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-[520px] rounded-xl bg-[color:var(--card)] border border-[color:var(--border)] px-6 py-8 text-center shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          onClick={onCancel}
          aria-label="Close"
        >
          <i className="fas fa-times" />
        </button>

        <h3 className="text-3 font-semibold text-[color:var(--text)]">{title}</h3>
        {description && (
          <p className="mt-4 text-[color:var(--text)] text-base leading-relaxed">{description}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
