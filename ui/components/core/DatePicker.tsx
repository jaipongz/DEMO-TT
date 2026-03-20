'use client'

import { useState, useRef, useEffect } from 'react'
import { getTimezoneOffsetLabel } from '../../utils/timezone'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  type?: 'date' | 'datetime'
  disabled?: boolean
  triggerClassName?: string
}

const parseOffsetToMinutes = (offset: string): number => {
  const match = String(offset || '').match(/^UTC([+-])(\d{2}):(\d{2})$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hour = Number(match[2] || '0')
  const minute = Number(match[3] || '0')
  return sign * (hour * 60 + minute)
}

const parseIncomingUtcDate = (rawValue: string): Date | null => {
  const raw = String(rawValue || '').trim()
  if (!raw) return null

  const hasZone = /(z|[+-]\d{2}:?\d{2})$/i.test(raw)
  const hasTime = raw.includes('T') || raw.includes(' ')
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const withTime = hasTime ? normalized : `${normalized}T00:00:00`
  const iso = hasZone ? withTime : `${withTime}Z`
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getZonedParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value || '0')

  return {
    year: get('year'),
    month: get('month') - 1,
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

const zonedDateTimeToUtcIso = (
  year: number,
  month: number,
  day: number,
  time: string,
  timeZone: string,
): string => {
  const [hoursRaw, minutesRaw] = String(time || '00:00').split(':')
  const hours = Number(hoursRaw || '0')
  const minutes = Number(minutesRaw || '0')

  const targetUtcMs = Date.UTC(year, month, day, hours, minutes, 0)

  let guessUtcMs = targetUtcMs
  let offsetMinutes = parseOffsetToMinutes(getTimezoneOffsetLabel(timeZone, new Date(guessUtcMs)))
  guessUtcMs = targetUtcMs - offsetMinutes * 60_000

  const secondOffsetMinutes = parseOffsetToMinutes(getTimezoneOffsetLabel(timeZone, new Date(guessUtcMs)))
  if (secondOffsetMinutes !== offsetMinutes) {
    guessUtcMs = targetUtcMs - secondOffsetMinutes * 60_000
  }

  return new Date(guessUtcMs).toISOString()
}

export default function DatePicker({ value, onChange, type = 'date', disabled = false, triggerClassName }: DatePickerProps) {
  const [timezone, setTimezone] = useState('Asia/Bangkok')
  const [isOpen, setIsOpen] = useState(false)
  const initialDate = parseIncomingUtcDate(value) || new Date()
  const [displayDate, setDisplayDate] = useState<Date>(initialDate)
  const [month, setMonth] = useState<number>(initialDate.getMonth())
  const [year, setYear] = useState<number>(initialDate.getFullYear())
  const [time, setTime] = useState<string>('00:00')
  const pickerRef = useRef<HTMLDivElement>(null)

  const pad2 = (num: number) => String(num).padStart(2, '0')
  const formatDate = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`
  const formatDateTime = (y: number, m: number, d: number, t: string) => `${formatDate(y, m, d)}T${t}`
  useEffect(() => {
    const syncTimezone = () => {
      try {
        const raw = localStorage.getItem('site-settings')
        if (!raw) return
        const parsed = JSON.parse(raw) as { timezone?: string }
        const next = String(parsed?.timezone || '').trim()
        if (next) setTimezone(next)
      } catch {
        // ignore
      }
    }

    syncTimezone()
    const handler = () => syncTimezone()
    window.addEventListener('site-settings:update', handler)
    return () => window.removeEventListener('site-settings:update', handler)
  }, [])

  // Update state when value prop changes
  useEffect(() => {
    const parsed = parseIncomingUtcDate(value)
    if (parsed) {
      const zoned = getZonedParts(parsed, timezone)
      const zonedDate = new Date(zoned.year, zoned.month, zoned.day)
      setDisplayDate(zonedDate)
      setMonth(zoned.month)
      setYear(zoned.year)
      if (type === 'datetime') {
        setTime(`${pad2(zoned.hour)}:${pad2(zoned.minute)}`)
      }
      return
    }

    if (!value && type === 'datetime') {
      setTime('00:00')
    }
  }, [value, type, timezone])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDayClick = (day: number) => {
    setDisplayDate(new Date(year, month, day))
    if (type === 'datetime') {
      onChange(zonedDateTimeToUtcIso(year, month, day, time, timezone))
    } else {
      onChange(formatDate(year, month, day))
    }
    setIsOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)

    onChange(zonedDateTimeToUtcIso(year, month, displayDate.getDate(), newTime, timezone))
  }

  const handleSelectToday = () => {
    const now = new Date()
    const zoned = getZonedParts(now, timezone)
    const nowYear = zoned.year
    const nowMonth = zoned.month
    const nowDay = zoned.day
    const nowTime = `${pad2(zoned.hour)}:${pad2(zoned.minute)}`

    setDisplayDate(new Date(nowYear, nowMonth, nowDay))
    setMonth(nowMonth)
    setYear(nowYear)

    if (type === 'datetime') {
      setTime(nowTime)
      onChange(now.toISOString())
    } else {
      onChange(formatDate(nowYear, nowMonth, nowDay))
    }

    setIsOpen(false)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const days = []
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const selectedParsedDate = value ? parseIncomingUtcDate(value) : null
  const selectedZoned = selectedParsedDate ? getZonedParts(selectedParsedDate, timezone) : null
  const selectedDateParts = selectedZoned
    ? [String(selectedZoned.year), pad2(selectedZoned.month + 1), pad2(selectedZoned.day)]
    : null
  const selectedDate = selectedDateParts
    ? `${selectedDateParts[2]}/${selectedDateParts[1]}/${selectedDateParts[0]}`
    : 'Select date'
  const selectedTime = selectedZoned ? `${pad2(selectedZoned.hour)}:${pad2(selectedZoned.minute)}` : time
  const placeholderText = type === 'datetime' ? 'Select datetime' : 'Select date'
  const displayValue = value
    ? `${selectedDate}${type === 'datetime' ? ` ${selectedTime}` : ''}`
    : placeholderText
  const selectedYear = selectedDateParts ? parseInt(selectedDateParts[0]) : null
  const selectedMonth = selectedDateParts ? parseInt(selectedDateParts[1]) - 1 : null
  const selectedDay = selectedDateParts ? parseInt(selectedDateParts[2]) : null

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-0 bg-[color:var(--background)] text-[color:var(--text)] text-left flex justify-between items-center ${disabled ? 'cursor-not-allowed opacity-70' : 'focus:border-[color:var(--accent)]'} ${triggerClassName || ''}`}
        disabled={disabled}
      >
        <span>{displayValue}</span>
        <i className="fas fa-calendar text-[color:var(--text-muted)]" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full right-0 mt-2 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg p-4 z-50 w-80">
          {/* Header with month year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (month === 0) {
                  setMonth(11)
                  setYear(year - 1)
                } else {
                  setMonth(month - 1)
                }
              }}
              className="p-2 hover:bg-[color:var(--border)] rounded"
            >
              <i className="fas fa-chevron-left text-sm" />
            </button>
            <div className="text-center">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="bg-transparent font-medium text-sm cursor-pointer"
              >
                {monthNames.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-transparent font-medium text-sm cursor-pointer ml-2"
              >
                {Array.from({ length: 100 }, (_, i) => year - 50 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (month === 11) {
                  setMonth(0)
                  setYear(year + 1)
                } else {
                  setMonth(month + 1)
                }
              }}
              className="p-2 hover:bg-[color:var(--border)] rounded"
            >
              <i className="fas fa-chevron-right text-sm" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-[color:var(--text-muted)] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => day && handleDayClick(day)}
                disabled={!day}
                className={`py-2 text-sm rounded font-medium transition-colors ${
                  !day
                    ? 'cursor-default'
                    : value && selectedDay === day &&
                      selectedMonth === month &&
                      selectedYear === year
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'hover:bg-[color:var(--border)] text-[color:var(--text)]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Time picker for datetime */}
          {type === 'datetime' && (
            <div className="border-t border-[color:var(--border)] pt-3">
              <label className="block text-xs font-medium text-[color:var(--text-muted)] mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="w-full px-2 py-2 border border-[color:var(--border)] rounded text-sm focus:outline-none focus:ring-0 focus:border-[color:var(--accent)]"
              />
            </div>
          )}

          {/* Clear button */}
          <div className="border-t border-[color:var(--border)] mt-3 pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="flex-1 px-2 py-2 text-sm rounded border border-[color:var(--border)] hover:bg-[color:var(--border)] transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex-1 px-2 py-2 text-sm rounded bg-[color:var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
