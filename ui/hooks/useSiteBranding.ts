import { useEffect, useState } from 'react'
import type { SiteSettings } from '../types/siteSettings'
import { DEFAULT_BRANDING, normalizeSiteBranding, normalizeSiteSettings } from '../utils/siteSettings'

export function useSiteBranding() {
  const [branding, setBranding] = useState(DEFAULT_BRANDING)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const load = () => {
      try {
        const raw = localStorage.getItem('site-settings')
        if (!raw) return
        const parsed = JSON.parse(raw) as Partial<SiteSettings>
        const normalized = normalizeSiteSettings(parsed)
        setBranding(normalizeSiteBranding(normalized))
        localStorage.setItem('site-settings', JSON.stringify(normalized))
      } catch {
        // Ignore malformed storage
      }
    }

    load()

    const handler = (event: Event) => {
      const custom = event as CustomEvent<Partial<SiteSettings>>
      if (!custom.detail) return
      const normalizedDetail = normalizeSiteSettings(custom.detail)
      setBranding(normalizeSiteBranding(normalizedDetail))
      try {
        const existing = normalizeSiteSettings(JSON.parse(localStorage.getItem('site-settings') || '{}'))
        localStorage.setItem('site-settings', JSON.stringify({
          ...existing,
          ...normalizedDetail,
        }))
      } catch {
        // Ignore storage errors
      }
    }

    window.addEventListener('site-settings:update', handler)
    return () => window.removeEventListener('site-settings:update', handler)
  }, [])

  return branding
}
