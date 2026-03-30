import type { SiteSettings } from '../types/siteSettings'
import { displayLocaleOptions } from '../config/core'

type SiteSettingsLike = Partial<SiteSettings> & {
  site_name?: string
  favicon_url?: string
  google_api_key?: string
  google_oauth_client_id?: string
  google_oauth_client_secret?: string
  password_lifetime_days?: number | string
  session_timeout_minutes?: number | string
  max_login_attempts?: number | string
  max_revision?: number | string
  action_logs_retention?: SiteSettings['actionLogsRetention'] | string
  maintenance_mode?: SiteSettings['maintenanceMode'] | string
  dynamic_configs?: Array<{ key?: unknown; value?: unknown }>
}

export const DEFAULT_BRANDING = {
  siteName: 'Content Management System',
  faviconUrl: '/favicon.png',
} as const

const toStringValue = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback
  return String(value)
}

const toNumberValue = (value: unknown, fallback: number): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const normalizeDynamicConfigs = (value: unknown): SiteSettings['dynamicConfigs'] => {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = (item || {}) as Record<string, unknown>
    return {
      key: toStringValue(row.key, ''),
      value: toStringValue(row.value, ''),
    }
  })
}

export function normalizeSiteSettings(input: unknown): Partial<SiteSettings> {
  const data = (input || {}) as SiteSettingsLike

  return {
    siteName: toStringValue(data.siteName ?? data.site_name, ''),
    faviconUrl: toStringValue(data.faviconUrl ?? data.favicon_url, ''),
    googleApiKey: toStringValue(data.googleApiKey ?? data.google_api_key, ''),
    googleOAuthClientId: toStringValue(data.googleOAuthClientId ?? data.google_oauth_client_id, ''),
    googleOAuthClientSecret: toStringValue(data.googleOAuthClientSecret ?? data.google_oauth_client_secret, ''),
    passwordLifetimeDays: toNumberValue(data.passwordLifetimeDays ?? data.password_lifetime_days, 90),
    sessionTimeoutMinutes: toNumberValue(data.sessionTimeoutMinutes ?? data.session_timeout_minutes, 60),
    maxLoginAttempts: toNumberValue(data.maxLoginAttempts ?? data.max_login_attempts, 5),
    maxRevision: toNumberValue(data.maxRevision ?? data.max_revision, 5),
    actionLogsRetention: toStringValue(data.actionLogsRetention ?? data.action_logs_retention, '6_month') as SiteSettings['actionLogsRetention'],
    locale: toStringValue(data.locale, displayLocaleOptions[0].value),
    timezone: toStringValue(data.timezone, 'Asia/Bangkok'),
    maintenanceMode: toStringValue(data.maintenanceMode ?? data.maintenance_mode, 'off') as SiteSettings['maintenanceMode'],
    dynamicConfigs: normalizeDynamicConfigs(data.dynamicConfigs ?? data.dynamic_configs),
    updatedAt: toStringValue(data.updatedAt, ''),
  }
}

export function normalizeSiteBranding(input: unknown): Pick<SiteSettings, 'siteName' | 'faviconUrl'> {
  const normalized = normalizeSiteSettings(input)
  return {
    siteName: normalized.siteName?.trim() || DEFAULT_BRANDING.siteName,
    faviconUrl: normalized.faviconUrl?.trim() || DEFAULT_BRANDING.faviconUrl,
  }
}
