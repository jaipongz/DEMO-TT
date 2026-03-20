const THAI_TIMEZONE = 'Asia/Bangkok'

type DateInput = Date | string | number

export class OMDatetime {
  private static pad2(value: number): string {
    return String(value).padStart(2, '0')
  }

  private static toDate(input?: DateInput | unknown | null): Date | null {
    if (input === undefined || input === null || input === '') return null
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? null : input
    }

    if (typeof input === 'number') {
      const date = new Date(input)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const raw = String(input).trim()
    if (!raw) return null

    const hasTimeZone = /(z|[+-]\d{2}:?\d{2})$/i.test(raw)
    const parsed = new Date(hasTimeZone ? raw : `${raw}Z`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  private static toUtcDateTimeString(date: Date): string {
    const year = date.getUTCFullYear()
    const month = OMDatetime.pad2(date.getUTCMonth() + 1)
    const day = OMDatetime.pad2(date.getUTCDate())
    const hour = OMDatetime.pad2(date.getUTCHours())
    const minute = OMDatetime.pad2(date.getUTCMinutes())
    const second = OMDatetime.pad2(date.getUTCSeconds())
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  private static formatDateTimeByTimezone(date: Date, timeZone: string, locale = 'en-GB'): string {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
  }

  static getUtcNow(): Date {
    return new Date()
  }

  static getThaiNow(locale = 'th-TH'): string {
    return OMDatetime.formatDateTimeByTimezone(OMDatetime.getUtcNow(), THAI_TIMEZONE, locale)
  }

  static parseUtcDate(input?: DateInput | unknown | null): Date | null {
    return OMDatetime.toDate(input)
  }

  static formatUtcDate(input?: DateInput | unknown | null): string {
    const date = OMDatetime.toDate(input)
    if (!date) return ''
    return OMDatetime.toUtcDateTimeString(date)
  }

  static toThaiDate(input?: DateInput | unknown | null, locale = 'th-TH'): string {
    const date = OMDatetime.toDate(input)
    if (!date) return ''
    return OMDatetime.formatDateTimeByTimezone(date, THAI_TIMEZONE, locale)
  }
}