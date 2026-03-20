import { useEffect, useRef, useState } from 'react'

interface FilterBarProps {
  filters: Array<{
    key: string
    label: string
    options: Array<{ value: string | boolean; label: string }>
  }>
  values: Record<string, any>
  onChange: (key: string, value: string[]) => void
}

export default function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; minWidth: number } | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      const target = event.target as Node
      if (containerRef.current.contains(target)) return
      setOpenKey(null)
      setMenuPosition(null)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    const closeMenu = () => {
      setOpenKey(null)
      setMenuPosition(null)
    }

    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    return () => {
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full sm:w-auto overflow-x-auto">
      <div className="flex gap-3 flex-nowrap w-max min-w-full">
        {filters.map((filter) => {
        const selected = Array.isArray(values[filter.key])
          ? (values[filter.key] as string[])
          : values[filter.key]
            ? [String(values[filter.key])]
            : []

        const toggle = (val: string) => {
          const isActive = selected.includes(val)
          const next = isActive ? selected.filter((v) => v !== val) : [...selected, val]
          onChange(filter.key, next)
        }

        const isOpen = openKey === filter.key

          return (
            <div key={filter.key} className="relative w-auto shrink-0">
              <button
                type="button"
                onClick={(event) => {
                  if (isOpen) {
                    setOpenKey(null)
                    setMenuPosition(null)
                    return
                  }

                  const rect = event.currentTarget.getBoundingClientRect()
                  const panelWidth = Math.max(rect.width, 220)
                  const viewportPadding = 8
                  const maxLeft = window.innerWidth - panelWidth - viewportPadding
                  const left = Math.max(viewportPadding, Math.min(rect.left, maxLeft))

                  setOpenKey(filter.key)
                  setMenuPosition({
                    left,
                    top: rect.bottom + 8,
                    minWidth: rect.width,
                  })
                }}
                className="cursor-pointer list-none flex items-center justify-between gap-2 border border-[color:var(--border)] rounded-lg px-3 py-2 bg-[color:var(--card)] text-sm whitespace-nowrap"
              >
                <span>{filter.label}</span>
                <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-[color:var(--text-muted)]`} />
              </button>
            </div>
          )
        })}
      </div>

      {openKey && menuPosition && (
        <div
          className="fixed z-[80] bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg p-3 space-y-1"
          style={{
            left: `${menuPosition.left}px`,
            top: `${menuPosition.top}px`,
            minWidth: `${menuPosition.minWidth}px`,
          }}
        >
          <div className="max-h-56 overflow-auto space-y-1 min-w-max">
            {(filters.find((f) => f.key === openKey)?.options || []).map((opt) => {
              const value = String(opt.value)
              const selected = Array.isArray(values[openKey])
                ? (values[openKey] as string[])
                : values[openKey]
                  ? [String(values[openKey])]
                  : []
              const checked = selected.includes(value)

              return (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = Array.isArray(values[openKey])
                        ? (values[openKey] as string[])
                        : values[openKey]
                          ? [String(values[openKey])]
                          : []
                      const isActive = current.includes(value)
                      const next = isActive ? current.filter((v) => v !== value) : [...current, value]
                      onChange(openKey, next)
                    }}
                    className="accent-[color:var(--accent)]"
                  />
                  <span>{opt.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
