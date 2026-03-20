export interface TimezoneOption {
  value: string
  label: string
  offsetMinutes: number
}

const FALLBACK_TIMEZONES = ['UTC', 'Asia/Bangkok']

const STANDARD_TIMEZONE_PRIORITY = [
  'UTC',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Halifax',
  'America/Sao_Paulo',
  'Atlantic/Azores',
  'Europe/London',
  'Europe/Paris',
  'Europe/Athens',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const normalizeOffset = (raw: string): string => {
  const normalized = String(raw || '').trim().toUpperCase().replace(/^GMT/, 'UTC')
  if (!normalized) return 'UTC+00:00'
  if (normalized === 'UTC') return 'UTC+00:00'

  const match = normalized.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return 'UTC+00:00'

  const sign = match[1]
  const hour = String(Number(match[2] || '0')).padStart(2, '0')
  const minute = String(Number(match[3] || '0')).padStart(2, '0')
  return `UTC${sign}${hour}:${minute}`
}

export function getTimezoneOffsetLabel(timeZone: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(at)

    const zone = parts.find((part) => part.type === 'timeZoneName')?.value || 'UTC'
    return normalizeOffset(zone)
  } catch {
    return 'UTC+00:00'
  }
}

const offsetLabelToMinutes = (offset: string): number => {
  const match = offset.match(/^UTC([+-])(\d{2}):(\d{2})$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hour = Number(match[2] || '0')
  const minute = Number(match[3] || '0')
  return sign * (hour * 60 + minute)
}

export function getTimezoneSelectOptions(referenceDate: Date = new Date()): TimezoneOption[] {
  const intlAny = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  const values = typeof intlAny.supportedValuesOf === 'function'
    ? intlAny.supportedValuesOf('timeZone')
    : FALLBACK_TIMEZONES

  const deduped = Array.from(new Set(values.concat(FALLBACK_TIMEZONES)))
  const allOptions = deduped.map((timeZone) => {
    const offset = getTimezoneOffsetLabel(timeZone, referenceDate)
    return {
      value: timeZone,
      label: `${timeZone} (${offset})`,
      offsetMinutes: offsetLabelToMinutes(offset),
    }
  })

  const priorityOrder = new Map(STANDARD_TIMEZONE_PRIORITY.map((zone, index) => [zone, index]))
  const pickRank = (zone: string) => priorityOrder.get(zone) ?? Number.MAX_SAFE_INTEGER

  // Keep one canonical timezone per UTC offset to avoid repeated equivalent times.
  const byOffset = new Map<number, TimezoneOption>()
  for (const option of allOptions) {
    const existing = byOffset.get(option.offsetMinutes)
    if (!existing) {
      byOffset.set(option.offsetMinutes, option)
      continue
    }

    const existingRank = pickRank(existing.value)
    const nextRank = pickRank(option.value)
    if (nextRank < existingRank) {
      byOffset.set(option.offsetMinutes, option)
      continue
    }

    if (nextRank === existingRank && option.value.localeCompare(existing.value) < 0) {
      byOffset.set(option.offsetMinutes, option)
    }
  }

  const options = Array.from(byOffset.values())

  return options.sort((left, right) => {
    if (left.offsetMinutes !== right.offsetMinutes) {
      return left.offsetMinutes - right.offsetMinutes
    }
    return left.value.localeCompare(right.value)
  })
}
