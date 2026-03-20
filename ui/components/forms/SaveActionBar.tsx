interface SaveActionBarProps {
  isVisible: boolean
  submitting: boolean
  showPublishAction?: boolean
  onCancel: () => void
  onSaveDraft: () => void
  onSavePublish: () => void
}

export default function SaveActionBar({
  isVisible,
  submitting,
  showPublishAction = true,
  onCancel,
  onSaveDraft,
  onSavePublish,
}: SaveActionBarProps) {
  if (!isVisible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] bg-[color:var(--card)] border-b border-[color:var(--border)] shadow-sm px-6 h-14"
    >
      <div className="flex items-center justify-between h-full max-w-6xl mx-auto">
        <span className="text-sm text-[color:var(--text-muted)]">You have unsaved changes</span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-secondary">
            Cancel
          </button>
          {showPublishAction ? (
            <>
              <button type="button" onClick={onSaveDraft} disabled={submitting} className="btn btn-secondary">
                {submitting ? 'Saving...' : 'Save Draft'}
              </button>
              <button type="button" onClick={onSavePublish} disabled={submitting} className="btn btn-primary">
                {submitting ? 'Saving...' : 'Save & Published'}
              </button>
            </>
          ) : (
            <button type="button" onClick={onSaveDraft} disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
