import { useEffect } from 'react'

export interface ContextMenuItem {
  label: string
  onClick: () => void
  className?: string
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  x: number
  y: number
  onClose: () => void
  fixedRightOffset?: number
}

export default function ContextMenu({ items, x, y, onClose, fixedRightOffset }: ContextMenuProps) {

  useEffect(() => {
    const handleClick = () => onClose()
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])

  return (
    <div
      className="fixed card rounded-lg shadow-lg z-50 py-1 border border-[color:var(--border)]"
      style={{
        ...(typeof fixedRightOffset === 'number' ? { right: `${fixedRightOffset}px` } : { left: `${x}px` }),
        top: `${y}px`,
      }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-[color:var(--accent)] hover:text-white transition-colors ${item.className || ''}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
