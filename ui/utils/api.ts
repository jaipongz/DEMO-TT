import axios from 'axios'

const base = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'
const baseHost = base.replace(/\/+$/, '')

export const api = axios.create({
  baseURL: `${baseHost}/api`,
  headers: { 'Content-Type': 'application/json' }
})

// Add auth interceptor
if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login'
        }
      }
      return Promise.reject(error)
    }
  )
}

export default api
