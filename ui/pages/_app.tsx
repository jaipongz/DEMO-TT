import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/core/Layout'
import { AuthProvider } from '../context/AuthContext'

const LOGIN_PATH = '/auth/login'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  )
}
