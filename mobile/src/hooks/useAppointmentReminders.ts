import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { useRecord } from '../providers/RecordProvider'
import { reminderOffsetMs } from '../utils/date'

// Schedules local notifications for upcoming appointments so reminders still
// fire even when the server push route is unreachable (e.g. dev without Expo project).
export function useAppointmentReminders() {
  const { record } = useRecord()
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const settings = await Notifications.getPermissionsAsync()
        if (settings.status !== 'granted') return
        // Cancel everything and re-schedule (idempotent).
        await Notifications.cancelAllScheduledNotificationsAsync()
        const appts = (record.appointments || []).filter((a: any) => a.status === 'Scheduled')
        for (const a of appts) {
          const offset = reminderOffsetMs(a.reminder)
          if (!offset) continue
          const when = new Date(`${a.date}T${a.time || '09:00'}:00`)
          const triggerDate = new Date(when.getTime() - offset)
          if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now() + 30_000) continue
          if (cancelled) return
          await Notifications.scheduleNotificationAsync({
            content: {
              title: a.title || 'Upcoming appointment',
              body: `${a.doctor ? a.doctor + ' · ' : ''}${a.date}${a.time ? ' ' + a.time : ''}${a.location ? ' · ' + a.location : ''}`,
              data: { type: 'appointment', appointmentId: a.id },
            },
            trigger: { type: 'date' as any, date: triggerDate } as any,
          })
        }
      } catch {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [record.appointments])
}
