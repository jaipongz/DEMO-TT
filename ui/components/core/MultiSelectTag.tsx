'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectTagProps {
  value: string
  onChange: (value: string) => void
  options: MultiSelectOption[]
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
}

function parseCsv(input: string): string[] {
  if (!input) return []
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function MultiSelectTag({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchable = true,
  disabled = false,
}: MultiSelectTagProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selectedValues = useMemo(() => parseCsv(String(value || '')), [value])

  const filteredOptions = useMemo(() => {
    if (!searchable) return options
    const term = searchTerm.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, searchable, searchTerm])

  const selectedOptions = useMemo(() => {
    const selectedSet = new Set(selectedValues)
    return options.filter((option) => selectedSet.has(option.value))
  }, [options, selectedValues])

  const toggleValue = (target: string) => {
    const hasValue = selectedValues.includes(target)
    const nextValues = hasValue
      ? selectedValues.filter((item) => item !== target)
      : [...selectedValues, target]
    onChange(nextValues.join(','))
  }

  const removeValue = (target: string) => {
    const nextValues = selectedValues.filter((item) => item !== target)
    onChange(nextValues.join(','))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setIsOpen((open) => !open)
          }
        }}
        aria-disabled={disabled}
        className={`
          w-full min-h-[42px] px-3 py-2 border rounded-lg text-left
          bg-[color:var(--card)] transition-all duration-150
          ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
          ${isOpen ? 'border-[color:var(--accent)]' : 'border-[color:var(--border)] hover:border-[color:var(--accent)]'}
        `}
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center rounded-full bg-[color:var(--border)] px-2 py-1 text-xs"
              >
                <span className="mr-1">{option.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeValue(option.value)
                    }}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[11px] leading-none text-[color:var(--text-muted)] hover:bg-[color:var(--card)] hover:text-[color:var(--text)]"
                    aria-label={`Remove ${option.label}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[color:var(--text-muted)] text-sm">{placeholder}</span>
        )}
      </div>

      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}
        >
          {searchable && (
            <div className="p-2 border-b border-[color:var(--border)]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm bg-[color:var(--card)] border border-[color:var(--border)] rounded-md focus:outline-none"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.map((option) => {
              const checked = selectedValues.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    transition-colors duration-100 cursor-pointer
                    ${checked ? 'bg-[color:var(--border)] font-medium' : 'hover:bg-[color:var(--border)]'}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option.value)}
                    className="accent-[color:var(--accent)]"
                  />
                  <span>{option.label}</span>
                </button>
              )
            })}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-[color:var(--text-muted)]">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
