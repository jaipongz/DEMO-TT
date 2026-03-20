import { ReactNode, useState, useEffect } from 'react'
import Head from 'next/head'
import { useAuth } from '../../context/AuthContext'
import Header from './Header'
import Aside from './Aside'
import { useRouter } from 'next/router'
import api from '../../utils/api'
import type { SiteSettings } from '../../types/siteSettings'
import { DEFAULT_BRANDING, normalizeSiteBranding, normalizeSiteSettings } from '../../utils/siteSettings'

const LOGIN_PATH = '/auth/login'
const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password']

export default function Layout({ children }: { children: ReactNode }) {
  const [asideOpen, setAsideOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('site-settings')
      if (!raw) return null
      return normalizeSiteSettings(JSON.parse(raw)) as SiteSettings
    } catch {
      return null
    }
  })
  const { user, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !user && !PUBLIC_PATHS.includes(router.pathname)) {
      router.replace(LOGIN_PATH)
    }
  }, [isInitialized, user, router.pathname])

  useEffect(() => {
    if (!isInitialized || !user) return
    let isActive = true
    api
      .get('/site-settings')
      .then((res) => {
        if (isActive) {
          setSiteSettings(normalizeSiteSettings(res.data) as SiteSettings)
        }
      })
      .catch(() => {
        // Ignore settings fetch errors
      })
    return () => {
      isActive = false
    }
  }, [isInitialized, user])

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<SiteSettings>
      setSiteSettings(normalizeSiteSettings(customEvent.detail) as SiteSettings)
    }
    window.addEventListener('site-settings:update', handler)
    return () => window.removeEventListener('site-settings:update', handler)
  }, [])

  const branding = normalizeSiteBranding(siteSettings)
  const resolvedTitle = branding.siteName || DEFAULT_BRANDING.siteName
  const resolvedFavicon = branding.faviconUrl || DEFAULT_BRANDING.faviconUrl

  useEffect(() => {
    if (!siteSettings || typeof window === 'undefined') return
    try {
      localStorage.setItem('site-settings', JSON.stringify(normalizeSiteSettings(siteSettings)))
    } catch {
      // Ignore storage errors
    }
  }, [siteSettings])

  // Show loading while initializing
  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-center">Loading...</div>
  }

  // Public pages render without layout and without auth
  if (PUBLIC_PATHS.includes(router.pathname)) {
    return <>{children}</>
  }

  // Redirect if not logged in
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{resolvedTitle}</title>
        <link rel="icon" href={resolvedFavicon} />
      </Head>
      <Header
        onMenuToggle={() => setAsideOpen(!asideOpen)}
        siteName={resolvedTitle}
        faviconUrl={resolvedFavicon}
      />
      <div className="flex flex-1">
        <Aside open={asideOpen} onClose={() => setAsideOpen(false)} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-10 overflow-auto lg:ml-64">
          <div className="max-w-7xl mx-auto w-full space-y-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
