'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import CustomSelect from '../../components/core/CustomSelect'
import FileUpload from '../../components/core/FileUpload'
import api from '../../utils/api'
import type { SiteSettings } from '../../types/siteSettings'
import { getTimezoneOffsetLabel, getTimezoneSelectOptions } from '../../utils/timezone'
import { normalizeSiteSettings } from '../../utils/siteSettings'
import { displayLocaleOptions } from '../../config/core'

export default function SiteSettingPage() {
  const rowIdRef = useRef(0)
  const nextRowId = () => {
    rowIdRef.current += 1
    return `cfg-${rowIdRef.current}`
  }

  const toStringValue = (value: unknown, fallback = ''): string => {
    if (value === undefined || value === null) return fallback
    const text = String(value)
    return text
  }

  const toNumberValue = (value: unknown, fallback: number): number => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
  }

  const normalizeDynamicConfigs = (items: unknown) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [{ rowId: nextRowId(), key: 'STABLE_API_KEY', value: '' }]
    }

    return items.map((item) => {
      const row = item as Record<string, unknown>
      return {
        rowId: nextRowId(),
        key: toStringValue(row?.key, ''),
        value: toStringValue(row?.value, ''),
      }
    })
  }

  const [siteName, setSiteName] = useState('')
  const [googleApiKey, setGoogleApiKey] = useState('')
  const [googleOAuthClientId, setGoogleOAuthClientId] = useState('')
  const [googleOAuthClientSecret, setGoogleOAuthClientSecret] = useState('')
  const [passwordLifetimeDays, setPasswordLifetimeDays] = useState(90)
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)
  const [maxRevision, setMaxRevision] = useState(5)
  const [actionLogsRetention, setActionLogsRetention] = useState<'1_month' | '3_month' | '6_month' | '9_month' | '12_month' | 'never'>('6_month')
  const [locale, setLocale] = useState(displayLocaleOptions[0].value)
  const [timezone, setTimezone] = useState('Asia/Bangkok')
  const [maintenanceMode, setMaintenanceMode] = useState('off')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [dynamicConfigs, setDynamicConfigs] = useState([{ rowId: 'cfg-0', key: 'STABLE_API_KEY', value: '' }])
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const timezoneOptions = useMemo(() => {
    const base = getTimezoneSelectOptions()
    const hasCurrent = base.some((item) => item.value === timezone)
    if (hasCurrent) return base

    const currentOffset = getTimezoneOffsetLabel(timezone || 'UTC')
    return [
      { value: timezone || 'UTC', label: `${timezone || 'UTC'} (${currentOffset})` },
      ...base,
    ]
  }, [timezone])

  useEffect(() => {
    let isActive = true
    api
      .get('/site-settings')
      .then((res) => {
        if (!isActive) return
        const data = normalizeSiteSettings(res.data)
        setSiteName(toStringValue(data.siteName, ''))
        setGoogleApiKey(toStringValue(data.googleApiKey, ''))
        setGoogleOAuthClientId(toStringValue(data.googleOAuthClientId, ''))
        setGoogleOAuthClientSecret(toStringValue(data.googleOAuthClientSecret, ''))
        setPasswordLifetimeDays(toNumberValue(data.passwordLifetimeDays, 90))
        setSessionTimeoutMinutes(toNumberValue(data.sessionTimeoutMinutes, 60))
        setMaxLoginAttempts(toNumberValue(data.maxLoginAttempts, 5))
        setMaxRevision(toNumberValue(data.maxRevision, 5))
        setActionLogsRetention((toStringValue(data.actionLogsRetention, '6_month') as SiteSettings['actionLogsRetention']) || '6_month')
        setLocale(toStringValue(data.locale, displayLocaleOptions[0].value))
        setTimezone(toStringValue(data.timezone, 'Asia/Bangkok'))
        setMaintenanceMode(toStringValue(data.maintenanceMode, 'off'))
        setFaviconUrl(toStringValue(data.faviconUrl, ''))
        setDynamicConfigs(normalizeDynamicConfigs(data.dynamicConfigs))
      })
      .catch(() => {
        // Ignore load errors
      })
    return () => {
      isActive = false
    }
  }, [])

  const addDynamicConfig = () => {
    setDynamicConfigs((prev) => [...prev, { rowId: nextRowId(), key: '', value: '' }])
  }

  const updateDynamicConfig = (index: number, field: 'key' | 'value', nextValue: string) => {
    setDynamicConfigs((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: nextValue } : item))
    )
  }

  const removeDynamicConfig = (index: number) => {
    setDynamicConfigs((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    const payload: Partial<SiteSettings> = {
      siteName,
      faviconUrl,
      googleApiKey,
      googleOAuthClientId,
      googleOAuthClientSecret,
      passwordLifetimeDays,
      sessionTimeoutMinutes,
      maxLoginAttempts,
      maxRevision,
      actionLogsRetention,
      locale,
      timezone,
      maintenanceMode: maintenanceMode as 'on' | 'off',
      dynamicConfigs: dynamicConfigs.map(({ key, value }) => ({ key, value })),
    }

    try {
      const response = await api.put('/site-settings', payload)
      const saved = normalizeSiteSettings(response.data) as SiteSettings
      setSiteName(saved.siteName || '')
      setFaviconUrl(saved.faviconUrl || '')
      try {
        localStorage.setItem('site-settings', JSON.stringify(saved))
      } catch {
        // Ignore storage errors
      }
      setSaveMessage('Saved successfully')
      window.dispatchEvent(new CustomEvent('site-settings:update', { detail: saved }))
    } catch (error) {
      setSaveMessage('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Site Settings</h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            Configure core CMS settings and integrations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs text-[color:var(--text-muted)]">{saveMessage}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Google Integration</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              API keys for analytics, maps, or OAuth.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Google API Key</label>
            <input
              type="text"
              placeholder="Enter Google API key"
              className="w-full"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">OAuth Client ID</label>
            <input
              type="text"
              placeholder="Enter OAuth client ID"
              className="w-full"
              value={googleOAuthClientId}
              onChange={(e) => setGoogleOAuthClientId(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">OAuth Client Secret</label>
            <input
              type="password"
              placeholder="Enter client secret"
              className="w-full"
              value={googleOAuthClientSecret}
              onChange={(e) => setGoogleOAuthClientSecret(e.target.value)}
            />
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Security</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              Password policy and session configuration.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Password Lifetime (days)</label>
            <input
              type="number"
              min={1}
              placeholder="90"
              className="w-full"
              value={passwordLifetimeDays}
              onChange={(e) => setPasswordLifetimeDays(Number(e.target.value))}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Session Timeout (minutes)</label>
            <input
              type="number"
              min={1}
              placeholder="60"
              className="w-full"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Maximum Login Attempts</label>
            <input
              type="number"
              min={1}
              placeholder="5"
              className="w-full"
              value={maxLoginAttempts}
              onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
            />
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Branding</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              Basic appearance and metadata.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Site Name</label>
            <input
              type="text"
              placeholder="Content Management System"
              className="w-full"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Favicon</label>
            <FileUpload
              value={faviconUrl}
              onChange={setFaviconUrl}
              module="site-setting"
              accept="image/x-icon,image/png,image/svg+xml"
              maxSize={2}
              aspect={1}
            />
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">System</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              General CMS behavior and defaults.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Default Locale</label>
            <CustomSelect
              value={locale}
              onChange={setLocale}
              options={displayLocaleOptions}
              placeholder="Select locale"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Default Timezone</label>
            <CustomSelect
              value={timezone}
              onChange={setTimezone}
              options={timezoneOptions}
              placeholder="Select timezone"
              searchable
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Maintenance Mode</label>
            <CustomSelect
              value={maintenanceMode}
              onChange={setMaintenanceMode}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'on', label: 'On' },
              ]}
              placeholder="Select mode"
            />
          </div>
        </section>
        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Revision</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              You can set max revisions for content items.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Maximum Revisions</label>
            <input
              type="number"
              min={1}
              placeholder="5"
              className="w-full"
              value={maxRevision}
              onChange={(e) => setMaxRevision(Number(e.target.value))}
            />
          </div>
        </section>
        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Action logs</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              Manage delete logs.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium">Duration</label>
            <CustomSelect
              value={actionLogsRetention}
              onChange={(value) => setActionLogsRetention(value as '1_month' | '3_month' | '6_month' | '9_month' | '12_month' | 'never')}
              options={[
                { value: '1_month', label: '1 month' },
                { value: '3_month', label: '3 months' },
                { value: '6_month', label: '6 months' },
                { value: '9_month', label: '9 months' },
                { value: '12_month', label: '12 months' },
                { value: 'never', label: 'Never' },
              ]}
              placeholder="Select duration"
            />
          </div>
        </section>
      </div>

      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dynamic Config</h2>
            <p className="text-xs text-[color:var(--text-muted)]">
              Add custom key/value settings for this CMS.
            </p>
          </div>
          <button
            type="button"
            onClick={addDynamicConfig}
            className="btn btn-secondary btn-sm"
          >
            Add Config
          </button>
        </div>

        <div className="space-y-3">
          {dynamicConfigs.map((item, index) => (
            <div key={item.rowId} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <input
                type="text"
                placeholder="Config key"
                value={item.key}
                onChange={(e) => updateDynamicConfig(index, 'key', e.target.value)}
                className="w-full"
              />
              <input
                type="text"
                placeholder="Config value"
                value={item.value}
                onChange={(e) => updateDynamicConfig(index, 'value', e.target.value)}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => removeDynamicConfig(index)}
                className="w-full md:w-auto px-3 py-2 border border-[color:var(--border)] rounded-lg text-sm hover:bg-[color:var(--bg-alt)] transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
