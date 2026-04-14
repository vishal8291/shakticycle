import { useEffect } from 'react'
import { configureNotificationHandler, registerForPushNotifications } from '../services/notifications'
import { useAuth } from '../providers/AuthProvider'

export function useRegisterNotifications() {
  const { token } = useAuth()
  useEffect(() => {
    configureNotificationHandler()
    if (!token) return
    let cancelled = false
    ;(async () => {
      const pushToken = await registerForPushNotifications(token)
      if (cancelled) return
      // Token registered successfully — no action needed
    })()
    return () => { cancelled = true }
  }, [token])
}
