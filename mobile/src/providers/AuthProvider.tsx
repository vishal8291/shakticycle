import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from '../services/secureStorage'
import { apiRequest } from '../services/api'
import { clearCache } from '../services/cache'

type User = {
  id: string
  fullName: string
  email: string
  mobileNumber?: string
  avatarUrl?: string
  role?: string
}

type AuthContextValue = {
  user: User | null
  token: string
  loading: boolean
  signIn: (payload: { identifier: string; password: string }) => Promise<void>
  signUp: (payload: { fullName: string; email: string; mobileNumber: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ message: string }>
  resetPassword: (payload: { email: string; code: string; password: string }) => Promise<void>
  requestMobileOtp: (mobileNumber: string) => Promise<{ message: string }>
  verifyMobileOtp: (payload: { mobileNumber: string; code: string }) => Promise<void>
  refreshMe: () => Promise<void>
}

const TOKEN_KEY = 'healthmap-ai-mobile-token'
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = (await SecureStore.getItem(TOKEN_KEY)) || ''
        if (!stored) return
        try {
          const result = await apiRequest<{ user: User }>('/auth/me', {}, stored)
          setToken(stored)
          setUser(result.user)
        } catch {
          await SecureStore.deleteItem(TOKEN_KEY)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const storeSession = async (nextToken: string, nextUser: User) => {
    await SecureStore.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }

  const signIn: AuthContextValue['signIn'] = async ({ identifier, password }) => {
    const result = await apiRequest<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) })
    await storeSession(result.token, result.user)
  }

  const signUp: AuthContextValue['signUp'] = async (payload) => {
    const result = await apiRequest<{ token: string; user: User }>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) })
    await storeSession(result.token, result.user)
  }

  const signOut = async () => {
    try { if (token) await apiRequest('/push/unregister', { method: 'POST', body: JSON.stringify({}) }, token) } catch { /* ignore */ }
    await SecureStore.deleteItem(TOKEN_KEY)
    await clearCache()
    setToken('')
    setUser(null)
  }

  const forgotPassword: AuthContextValue['forgotPassword'] = async (email) => {
    return apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  }

  const resetPassword: AuthContextValue['resetPassword'] = async (payload) => {
    await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) })
  }

  const requestMobileOtp: AuthContextValue['requestMobileOtp'] = async (mobileNumber) => {
    return apiRequest<{ message: string }>('/auth/request-mobile-otp', { method: 'POST', body: JSON.stringify({ mobileNumber }) })
  }

  const verifyMobileOtp: AuthContextValue['verifyMobileOtp'] = async ({ mobileNumber, code }) => {
    const result = await apiRequest<{ token: string; user: User }>('/auth/verify-mobile-otp', { method: 'POST', body: JSON.stringify({ mobileNumber, code }) })
    await storeSession(result.token, result.user)
  }

  const refreshMe = async () => {
    if (!token) return
    try {
      const result = await apiRequest<{ user: User }>('/auth/me', {}, token)
      setUser(result.user)
    } catch { /* ignore */ }
  }

  const value = useMemo<AuthContextValue>(() => ({
    user, token, loading,
    signIn, signUp, signOut,
    forgotPassword, resetPassword,
    requestMobileOtp, verifyMobileOtp,
    refreshMe,
  }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
