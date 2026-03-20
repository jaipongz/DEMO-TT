import Link from 'next/link'
import Image from 'next/image'
import UserMenu from './UserMenu'
import { useAuth } from '../../context/AuthContext'

export default function Header({
  onMenuToggle,
  siteName,
  faviconUrl,
}: {
  onMenuToggle?: () => void
  siteName?: string
  faviconUrl?: string
}) {
  const { user } = useAuth()
  const displayName = siteName && siteName.trim().length > 0 ? siteName : 'Content Management System'
  const logoSrc = faviconUrl && faviconUrl.trim().length > 0 ? faviconUrl : '/favicon.png'

  return (
    <header
      className="sticky top-0 z-40 shrink-0 border-b border-[color:var(--border)] bg-[color:var(--card)] rounded-none"
      style={{ height: 'var(--nav-height)' }}
    >
      <div className="flex h-full items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden text-xl px-2 py-1 rounded-lg hover:bg-[color:var(--bg-alt)]"
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold tracking-tight min-w-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black shadow-sm overflow-hidden flex-shrink-0">
              <Image src={logoSrc} alt="Logo" width={36} height={36} priority unoptimized />
            </span>
            <div className="leading-tight min-w-0">
              <div className="sm:hidden text-xs truncate">{displayName}</div>
              <div className="hidden sm:block text-sm truncate">{displayName}</div>
            </div>
          </Link>
        </div>
        {user && <UserMenu />}
      </div>
    </header>
  )
}
