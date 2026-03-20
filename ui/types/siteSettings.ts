export interface SiteSettings {
  siteName: string
  faviconUrl: string
  googleApiKey: string
  googleOAuthClientId: string
  googleOAuthClientSecret: string
  passwordLifetimeDays: number
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  maxRevision: number
  actionLogsRetention: '1_month' | '3_month' | '6_month' | '9_month' | '12_month' | 'never'
  locale: string
  timezone: string
  maintenanceMode: 'on' | 'off'
  dynamicConfigs: Array<{ key: string; value: string }>
  updatedAt?: string
}
