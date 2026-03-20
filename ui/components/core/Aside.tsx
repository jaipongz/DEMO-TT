import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { modules, ModuleConfig } from '../../config/modules'
import { useAuth } from '../../context/AuthContext'
import { canAccessModule, resolveModuleKey } from '../../utils/permissions'

function MenuItem({ item, pathname }: { item: ModuleConfig; pathname: string }) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href
  const isParentActive = item.children && item.children.some(child => pathname === child.href)

  if (!item.href) {
    return (
      <div>
        <button
          onClick={() => setOpen(isParentActive || !open)}
          className={`w-full text-left px-4 py-2 text-sm font-semibold flex justify-between items-center rounded-lg transition-colors ${
            isParentActive
              ? 'bg-[color:var(--accent)] text-white shadow-sm'
              : 'hover:bg-[color:var(--bg-alt)]'
          }`}
        >
          {item.label}
          <svg
            className={`w-4 h-4 transition-transform ${open || isParentActive ? 'rotate-180' : ''}`}
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
        {(open || isParentActive) && hasChildren && (
          <div className="pl-2 mt-1 space-y-1">
            {item.children.map(child => (
              <MenuItem key={child.id} item={child} pathname={pathname} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={`block px-4 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[color:var(--accent)] text-white rounded-lg'
          : 'hover:bg-[color:var(--bg-alt)] rounded-lg'
      }`}
    >
      {item.label}
    </Link>
  )
}

export default function Aside({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { user } = useAuth()

  const filterByPermission = (items: ModuleConfig[]): ModuleConfig[] => {
    return items
      .map((item) => {
        const children = item.children ? filterByPermission(item.children) : undefined

        if (children && children.length > 0) {
          return { ...item, children }
        }

        if (item.href) {
          const fromHref = resolveModuleKey(item.href)
          const fromId = resolveModuleKey(item.id)
          const moduleKey = fromHref || fromId
          if (!moduleKey) return item
          return canAccessModule(user, moduleKey) ? { ...item, children } : null
        }

        return null
      })
      .filter((item): item is ModuleConfig => Boolean(item))
  }

  const allowedModules = filterByPermission(modules)
  const bottomIds = new Set(['site-setting', 'admin'])
  const topModules = allowedModules.filter(item => !bottomIds.has(item.id))
  const bottomModules = allowedModules.filter(item => bottomIds.has(item.id))

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/30"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 max-w-[80vw] lg:max-w-none lg:top-[var(--nav-height)] lg:h-[calc(100vh-var(--nav-height))] bg-[color:var(--card)] border-r border-[color:var(--border)] flex flex-col transform transition-transform z-50 lg:z-0 shadow-sm ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-[color:var(--border)] bg-[color:var(--bg)]/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm tracking-[0.08em] text-[color:var(--text-muted)]">Modules</p>
            <button
              onClick={onClose}
              className="lg:hidden text-sm hover:opacity-70 px-2 py-1 rounded-lg hover:bg-[color:var(--bg-alt)]"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto flex flex-col">
          <div className="space-y-1">
            {topModules.map(item => (
              <MenuItem key={item.id} item={item} pathname={router.pathname} />
            ))}
          </div>
          <div className="mt-auto space-y-1 pt-4">
            {bottomModules.map(item => (
              <MenuItem key={item.id} item={item} pathname={router.pathname} />
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}
