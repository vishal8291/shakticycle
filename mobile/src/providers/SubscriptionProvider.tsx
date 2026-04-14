import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from './AuthProvider'

export type Plan = 'free' | 'premium' | 'family'
export type SubStatus = 'active' | 'cancelled' | 'expired' | 'trial'

export type SubscriptionFeatures = {
  aiInsights: boolean
  unlimitedReports: boolean
  exportPdf: boolean
  familyMembers: number
  prioritySupport: boolean
  advancedAnalytics: boolean
  aiChat: boolean
  customReminders: boolean
}

export type Subscription = {
  plan: Plan
  status: SubStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  features: SubscriptionFeatures
}

type SubscriptionContextValue = {
  subscription: Subscription | null
  loading: boolean
  isPremium: boolean
  isFamily: boolean
  isTrial: boolean
  trialDaysLeft: number
  hasFeature: (key: keyof SubscriptionFeatures) => boolean
  upgrade: (plan: Plan) => Promise<void>
  cancel: () => Promise<void>
  refresh: () => Promise<void>
}

const FREE_FEATURES: SubscriptionFeatures = {
  aiInsights: false, unlimitedReports: false, exportPdf: false,
  familyMembers: 0, prioritySupport: false, advancedAnalytics: false,
  aiChat: false, customReminders: false,
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!token) { setSubscription(null); setLoading(false); return }
    try {
      const data = await apiRequest<{ subscription: Subscription }>('/subscription', {}, token)
      setSubscription(data.subscription)
    } catch { /* keep existing */ }
    setLoading(false)
  }, [token])

  useEffect(() => { refresh() }, [refresh])

  const isPremium = subscription?.plan === 'premium' || subscription?.plan === 'family'
  const isFamily = subscription?.plan === 'family'
  const isTrial = subscription?.status === 'trial'
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0

  const hasFeature = (key: keyof SubscriptionFeatures) => {
    return subscription?.features?.[key] ?? FREE_FEATURES[key] ?? false
  }

  const upgrade = async (plan: Plan) => {
    if (!token) return
    const data = await apiRequest<{ subscription: Subscription }>('/subscription/upgrade', { method: 'POST', body: JSON.stringify({ plan }) }, token)
    setSubscription(data.subscription)
  }

  const cancel = async () => {
    if (!token) return
    const data = await apiRequest<{ subscription: Subscription }>('/subscription/cancel', { method: 'POST', body: JSON.stringify({}) }, token)
    setSubscription(data.subscription)
  }

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, isPremium, isFamily, isTrial, trialDaysLeft, hasFeature, upgrade, cancel, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const c = useContext(SubscriptionContext)
  if (!c) throw new Error('useSubscription must be inside SubscriptionProvider')
  return c
}
