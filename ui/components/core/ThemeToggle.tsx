import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('theme')
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  }

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative inline-flex h-10 w-16 items-center rounded-full border border-[color:var(--border)] bg-[color:var(--bg-alt)] transition-colors hover:border-[color:var(--accent)]"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-label="Toggle theme"
    >
      <span
        className={`absolute left-2 top-2 h-6 w-6 rounded-full bg-[color:var(--card)] shadow-sm transition-transform ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      ></span>
      <span className="flex w-full items-center justify-between px-2 text-xs text-[color:var(--text-muted)]">
        <i className="fa-regular fa-sun" aria-hidden="true"></i>
        <i className="fa-solid fa-moon" aria-hidden="true"></i>
      </span>
    </button>
  )
}
