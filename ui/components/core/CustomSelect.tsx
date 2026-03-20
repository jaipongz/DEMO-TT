'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

export interface SelectOption {
  value: string
  label: string
  flag?: string
  emoji?: string
  iconClassName?: string
  badgeClassName?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  name?: string
  searchable?: boolean
  disabled?: boolean
  triggerClassName?: string
  menuClassName?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required,
  name,
  searchable = false,
  disabled = false,
  triggerClassName,
  menuClassName,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const filteredOptions = useMemo(() => {
    if (!searchable) return options
    const term = searchTerm.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, searchable, searchTerm])

  const renderOptionContent = (option: SelectOption) => {
    if (option.badgeClassName) {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${option.badgeClassName}`}>
          <span>{option.label}</span>
          {option.iconClassName && <i className={option.iconClassName} aria-hidden="true" />}
        </span>
      )
    }

    return (
      <>
        {option.flag && <span className={`fi fi-${option.flag} text-lg`} style={{ lineHeight: '1em' }} aria-hidden="true" />}
        {!option.flag && option.emoji && <span className="text-lg" aria-hidden="true">{option.emoji}</span>}
        {!option.flag && !option.emoji && option.iconClassName && <i className={option.iconClassName} aria-hidden="true" />}
        <span className="flex-1">{option.label}</span>
      </>
    )
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Hidden native select for form submission */}
      {name && (
        <select name={name} value={value} required={required} className="sr-only" tabIndex={-1} onChange={() => {}}>
          {!value && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2
          px-4 py-2.5 text-sm text-left
          bg-[color:var(--card)] border rounded-lg
          transition-all duration-150 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
          ${isOpen
            ? 'border-[color:var(--accent)] ring-0'
            : 'border-[color:var(--border)] hover:border-[color:var(--accent)]'
          }
          ${triggerClassName || ''}
        `}
        disabled={disabled}
      >
        <span className={selected ? '' : 'text-[color:var(--text-muted)]'}>
          {selected ? (
            <span className="inline-flex items-center gap-2">{renderOptionContent(selected)}</span>
          ) : (
            placeholder
          )}
        </span>
        <svg
          className={`w-4 h-4 text-[color:var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className={`absolute z-50 mt-1 w-full bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${menuClassName || ''}`}
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
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`
                    w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left
                    transition-colors duration-100 cursor-pointer
                    ${isSelected
                      ? 'bg-[color:var(--accent)] text-white font-medium'
                      : 'hover:bg-[color:var(--border)]'
                    }
                  `}
                >
                  <span className="flex-1 inline-flex items-center gap-2">{renderOptionContent(option)}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
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
