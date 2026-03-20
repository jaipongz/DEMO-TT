interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
}

export default function SearchBar({ placeholder = 'Search...', value, onChange, onSubmit }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSubmit?.()
        }
      }}
      className="w-full min-w-[220px] px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--card)] text-sm focus:outline-none focus:ring-0 focus:border-[color:var(--accent)]"
    />
  )
}
