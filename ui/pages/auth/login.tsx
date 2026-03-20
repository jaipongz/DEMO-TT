import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/router'
import { useSiteBranding } from '../../hooks/useSiteBranding'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const { siteName, faviconUrl } = useSiteBranding()

  const submit = async (e: any) => {
    e.preventDefault()
    setError('')
    try {
      await login(email.trim(), password.trim())
      router.push('/')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      setError(msg)
      console.error('Login error:', err)
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
          <h1 className="text-2xl font-bold text-center">{siteName || 'Dashboard'}</h1>
          <p className="text-[color:var(--text-muted)] text-sm text-center">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[color:var(--danger)] text-white text-sm">
            {error}
          </div>
        )}

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

          <div className="space-y-1">
            <label className="block text-sm font-medium">Password</label>
            <input
              className="w-full px-3 py-2 rounded border border-[color:var(--border)] bg-[color:var(--bg)] focus:outline-none focus:border-[color:var(--primary)]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-right">
          <button
            type="button"
            className="text-sm text-[color:var(--primary)] hover:underline"
            onClick={() => router.push('/auth/forgot-password')}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  )
}
