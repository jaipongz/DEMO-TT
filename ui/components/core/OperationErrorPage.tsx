interface OperationErrorPageProps {
    title?: string
    message?: string
    details?: string
}

function normalizeErrorMessage(value: any): string {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.map((item) => String(item)).join(', ')
    if (typeof value === 'object') {
        if (typeof value.message === 'string') return value.message
        if (Array.isArray(value.message)) return value.message.map((item) => String(item)).join(', ')
    }
    return String(value)
}

export function extractApiErrorMessage(error: any): string {
    if (!error) return ''
    const apiMessage = normalizeErrorMessage(error?.response?.data?.message)
    if (apiMessage) return apiMessage
    const fallbackMessage = normalizeErrorMessage(error?.message)
    return fallbackMessage
}

export default function OperationErrorPage({
    title = 'Sorry, Operation failed',
    message,
    details,
}: OperationErrorPageProps) {
    return (
        <div className="min-h-[70vh] w-full bg-[color:var(--bg)]/60 flex items-center justify-center px-4 py-10">
            <div className="max-w-3xl w-full text-center space-y-6">
                <div className="mx-auto w-24 h-24 rounded-full bg-[color:var(--card)] flex items-center justify-center">
                    <svg className="w-11 h-11 text-[color:var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 8v5" strokeLinecap="round" />
                        <path d="M12 16h.01" strokeLinecap="round" />
                        <path d="M6.34 6.34a8 8 0 1 1 11.32 11.32A8 8 0 0 1 6.34 6.34Z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{title}</h2>
                    <p className="text-sm text-[color:var(--text-muted)]">
                        {message || 'Permission denied or request failed. Please sign out and try again.'}
                    </p>
                    {details && <p className="text-xs text-[color:var(--text-muted)]">{details}</p>}
                </div>

                <div className="text-xs text-[color:var(--text-muted)] leading-6">
                    <p>If this issue persists, please contact your system administrator.</p>
                </div>

                <div className="max-w-xl mx-auto text-left bg-[color:var(--card)]/60 rounded-xl px-4 py-4 space-y-3">
                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-[color:var(--text)]">Need help with this software?</p>
                        <p className="text-xs text-[color:var(--text-muted)]">Please feel free to contact us via the channels below.</p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--bg)]/70 px-3 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Telephone</span>
                            <a href="tel:0956864500" className="font-medium text-[color:var(--text)] hover:opacity-80 transition-opacity">0956864500</a>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--bg)]/70 px-3 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Email</span>
                            <a href="mailto:sir.kapong1@gmail.com" className="font-medium text-[color:var(--text)] hover:opacity-80 transition-opacity">sir.kapong1@gmail.com</a>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--bg)]/70 px-3 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Website</span>
                            <a
                                href="https://jaipongz.manga208.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-[color:var(--text)] hover:opacity-80 transition-opacity"
                            >
                                jaipongz.manga208.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
