import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { apiRequest } from './api'

let handlerConfigured = false

export function configureNotificationHandler() {
  if (handlerConfigured) return
  handlerConfigured = true
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as any),
  })
}

export async function registerForPushNotifications(token: string): Promise<string | null> {
  try {
    if (!Device.isDevice) return null
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2c73d9',
      })
    }
    const settings = await Notifications.getPermissionsAsync()
    let status = settings.status
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync()
      status = req.status
    }
    if (status !== 'granted') return null
    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId || (Constants as any).easConfig?.projectId
    const tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    const pushToken = tokenResult.data
    if (pushToken && token) {
      try {
        await apiRequest('/push/register', { method: 'POST', body: JSON.stringify({ pushToken, platform: Platform.OS }) }, token)
      } catch {
        // Non-fatal; device is registered locally.
      }
    }
    return pushToken
  } catch {
    return null
  }
}

export async function scheduleLocalReminder(opts: { title: string; body: string; dateIso: string; data?: Record<string, any> }): Promise<string | null> {
  try {
    const trigger = new Date(opts.dateIso)
    if (Number.isNaN(trigger.getTime()) || trigger.getTime() < Date.now() + 5_000) return null
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: opts.title, body: opts.body, data: opts.data || {} },
      trigger: { type: 'date' as any, date: trigger } as any,
    })
    return id
  } catch {
    return null
  }
}

export async function cancelReminder(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id)
  } catch {
    // ignore
  }
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch {
    // ignore
  }
}
