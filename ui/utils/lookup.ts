import { api } from './api'
import type { LookupSource } from '../types/formConfig'
import { langOptions } from '../config/core'

export interface LookupOption {
  value: string | boolean
  label: string
}

const lookupCache = new Map<string, LookupOption[]>()
const inFlightRequests = new Map<string, Promise<LookupOption[]>>()

function getClientLang(): string {
  if (typeof window === 'undefined') return langOptions[0].value
  try {
    const raw = localStorage.getItem('site-settings')
    if (!raw) return langOptions[0].value
    const parsed = JSON.parse(raw) as Record<string, any>
    return String(parsed.obj_lang || langOptions[0].value)
  } catch {
    return langOptions[0].value
  }
}

function toLookupKey(endpoint: string, body: Record<string, any>): string {
  const sorted = Object.entries(body)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|')
  return `${endpoint}?${sorted}`
}

function normalizeOption(option: any): LookupOption | null {
  if (!option) return null
  const value = option.value
  const label = option.label
  if (value === undefined || value === null) return null
  return {
    value: typeof value === 'boolean' ? value : String(value),
    label: String(label ?? value),
  }
}

export async function fetchLookupOptions(source: LookupSource): Promise<LookupOption[]> {
  const endpoint = String(source.endpoint || '').trim() || (source.module ? `/${String(source.module).replace(/^\/+/, '')}/lookup` : '')
  if (!endpoint) return []

  const body: Record<string, any> = {
    ...(source.payload || {}),
    lang: source.lang || getClientLang(),
  }
  if (source.field) body.field = source.field
  if (source.valueField) body.valueField = source.valueField
  if (source.labelField) body.labelField = source.labelField
  if (source.search) body.search = source.search
  if (typeof source.limit === 'number') body.limit = source.limit
  if (typeof source.activeOnly === 'boolean') body.activeOnly = source.activeOnly

  const requestKey = toLookupKey(endpoint, body)
  const cached = lookupCache.get(requestKey)
  if (cached) return cached

  const inFlight = inFlightRequests.get(requestKey)
  if (inFlight) return inFlight

  const requestPromise = api.post(endpoint, body).then((response) => {
    const payload = response?.data

    const rawOptions = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.options)
        ? payload.options
        : []

    const normalized = rawOptions.map(normalizeOption).filter((item): item is LookupOption => Boolean(item))
    lookupCache.set(requestKey, normalized)
    return normalized
  }).finally(() => {
    inFlightRequests.delete(requestKey)
  })

  inFlightRequests.set(requestKey, requestPromise)
  return requestPromise
}
