import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSiteBranding } from '../../hooks/useSiteBranding'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { siteName, faviconUrl } = useSiteBranding()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsSubmitting(true)
    try {
      // Placeholder: call API when available
      await new Promise((resolve) => setTimeout(resolve, 500))
      setMessage('If an account exists for this email, password reset instructions have been sent.')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-alt)]">
      <div className="w-full max-w-md card p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-6 space-y-2">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-[color:var(--bg)] border border-[color:var(--border)] flex items-center justify-center">
            {faviconUrl ? (
              <img src={faviconUrl} alt={siteName} className="h-full w-full object-contain" />
            ) : (
              <span className="text-xl font-semibold">{siteName?.charAt(0) || 'C'}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-center">{siteName || 'Forgot password'}</h1>
          <p className="text-[color:var(--text-muted)] text-sm text-center">
            Enter your email to receive a reset link
          </p>
        </div>

        {message && <div className="mb-4 p-3 rounded-lg bg-[color:var(--success)] text-white text-sm">{message}</div>}
        {error && <div className="mb-4 p-3 rounded-lg bg-[color:var(--danger)] text-white text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Email</label>
            <input
              className="w-full px-3 py-2 rounded border border-[color:var(--border)] bg-[color:var(--bg)] focus:outline-none focus:border-[color:var(--primary)]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-[color:var(--primary)] hover:underline"
            onClick={() => router.push('/auth/login')}
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
