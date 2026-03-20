import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { collectPermissionNames, hasPermission as checkPermission } from '../utils/permissions'

export interface User {
  id: string
  username?: string
  email: string
  name?: string
  roles?: any[]
  permissions?: any[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  permissions: string[]
  hasPermission: (permission: string | string[]) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const permissions = collectPermissionNames(user)

  const hasPermission = (permission: string | string[]) => {
    return checkPermission(user, permission)
  }

  const clearLogoutTimer = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current)
      logoutTimer.current = null
    }
  }

  const decodeTokenExp = (jwt?: string | null): number | null => {
    if (!jwt) return null
    const parts = jwt.split('.')
    if (parts.length < 2) return null
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const json = atob(base64)
      const payload = JSON.parse(json)
      return typeof payload.exp === 'number' ? payload.exp : null
    } catch (err) {
      console.error('Failed to decode token exp', err)
      return null
    }
  }

  const scheduleAutoLogout = (exp: number | null) => {
    clearLogoutTimer()
    if (!exp) return
    const delay = exp * 1000 - Date.now()
    if (delay <= 0) {
      logout()
      return
    }
    logoutTimer.current = setTimeout(() => logout(), delay)
  }

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        const exp = decodeTokenExp(savedToken)
        if (exp && exp * 1000 <= Date.now()) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        } else {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
          scheduleAutoLogout(exp)
        }
      } catch (err) {
        console.error('Failed to parse saved user', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsInitialized(true)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
      const apiHost = baseUrl.replace(/\/+$/, '')
      const res = await fetch(`${apiHost}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json()
      setToken(data.access_token)
      setUser(data.user)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      scheduleAutoLogout(decodeTokenExp(data.access_token))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearLogoutTimer()
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, permissions, hasPermission, login, logout, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
