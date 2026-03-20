import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[color:var(--bg-alt)] transition-colors"
      >
        <div className="text-right">
          <p className="text-sm font-medium">{user.username}</p>
          <p className="text-xs text-[color:var(--text-muted)]">{user.email}</p>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M6 9l6 6 6-6"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 card rounded-lg shadow-lg z-50 border border-[color:var(--border)]"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => {
                logout()
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[color:var(--danger)] hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
