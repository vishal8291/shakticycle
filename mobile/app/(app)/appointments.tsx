import { useMemo, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { AppScreen, Banner, EmptyState, Field, GhostButton, ListItem, MetricGrid, PrimaryButton, SectionCard, SelectChips, SecondaryButton } from '../../src/components/MobileUI'
import { useRecord } from '../../src/providers/RecordProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { todayISO, nowTime, formatDate, reminderOffsetMs, formatDateTime } from '../../src/utils/date'

const STATUSES = ['Scheduled', 'Completed', 'Cancelled']
const REMINDERS = ['None', 'Same day', '1 hour', '3 hours', '1 day']
const EMPTY = { title: '', doctor: '', date: todayISO(), time: nowTime(), location: '', status: 'Scheduled', reminder: '1 day' }

export default function AppointmentsScreen() {
  const { record, saving, loading, reload, addAppointment, updateAppointment, deleteAppointment } = useRecord()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [permStatus, setPermStatus] = useState<string>('unknown')

  const appointments = record.appointments || []

  const { upcoming, past, dueSoon } = useMemo(() => {
    const now = Date.now()
    const withTime = appointments.map((a: any) => ({ ...a, when: new Date(`${a.date}T${a.time || '09:00'}:00`).getTime() }))
    const upcoming = withTime.filter((a: any) => !Number.isNaN(a.when) && a.when >= now && a.status === 'Scheduled').sort((a: any, b: any) => a.when - b.when)
    const past = withTime.filter((a: any) => Number.isNaN(a.when) || a.when < now || a.status !== 'Scheduled').sort((a: any, b: any) => (b.when || 0) - (a.when || 0))
    const dueSoon = upcoming.filter((a: any) => {
      const offset = reminderOffsetMs(a.reminder)
      if (!offset) return false
      return a.when - now <= offset
    })
    return { upcoming, past, dueSoon }
  }, [appointments])

  const requestNotifications = async () => {
    const res = await Notifications.requestPermissionsAsync()
    setPermStatus(res.status)
    if (res.status === 'granted') toast.success('Notifications enabled')
    else toast.error('Please enable notifications in settings')
  }

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (!form.date.trim()) { toast.error('Date required'); return }
    try {
      if (editingId) await updateAppointment(editingId, form)
      else await addAppointment(form)
      setForm(EMPTY)
      setEditingId(null)
    } catch { /* ignore */ }
  }

  const edit = (a: any) => {
    setEditingId(a.id)
    setForm({ title: a.title || '', doctor: a.doctor || '', date: a.date, time: a.time || '09:00', location: a.location || '', status: a.status, reminder: a.reminder || 'None' })
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <MetricGrid items={[
        { label: 'Upcoming', value: upcoming.length, tone: 'primary' },
        { label: 'Due soon', value: dueSoon.length, tone: 'warning' },
        { label: 'Total', value: appointments.length, tone: 'neutral' },
      ]} />

      {permStatus !== 'granted' ? (
        <Banner tone="warning" text="Enable notifications to get reminded before appointments." />
      ) : null}
      {permStatus !== 'granted' ? <SecondaryButton label="Enable reminders" onPress={requestNotifications} /> : null}

      <SectionCard title={editingId ? 'Edit appointment' : 'Add appointment'}>
        <Field label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="General checkup" />
        <Field label="Doctor" value={form.doctor} onChangeText={(v) => setForm({ ...form, doctor: v })} />
        <Field label="Date" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" />
        <Field label="Time" value={form.time} onChangeText={(v) => setForm({ ...form, time: v })} placeholder="HH:MM" />
        <Field label="Location" value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} />
        <SelectChips options={STATUSES} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
        <Field label="Reminder" value={form.reminder} onChangeText={(v) => setForm({ ...form, reminder: v })} />
        <SelectChips options={REMINDERS} value={form.reminder} onChange={(v) => setForm({ ...form, reminder: v })} />
        <PrimaryButton label={editingId ? 'Save changes' : 'Add appointment'} onPress={submit} loading={saving} />
        {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(EMPTY) }} /> : null}
      </SectionCard>

      <SectionCard title="Upcoming">
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming visits" message="Add your next appointment to get reminders." />
        ) : upcoming.map((a: any) => (
          <ListItem
            key={a.id}
            title={a.title}
            subtitle={`${a.doctor || '—'}${a.location ? ' · ' + a.location : ''}${a.reminder && a.reminder !== 'None' ? ' · remind ' + a.reminder : ''}`}
            meta={formatDateTime(a.date, a.time)}
            tone={dueSoon.some((d: any) => d.id === a.id) ? 'warning' : 'primary'}
            onEdit={() => edit(a)}
            onDelete={() => deleteAppointment(a.id).catch(() => {})}
          />
        ))}
      </SectionCard>

      {past.length > 0 && (
        <SectionCard title="Past & other">
          {past.map((a: any) => (
            <ListItem
              key={a.id}
              title={a.title}
              subtitle={`${a.doctor || '—'}${a.location ? ' · ' + a.location : ''}`}
              meta={`${formatDate(a.date)} · ${a.status}`}
              tone={a.status === 'Cancelled' ? 'danger' : 'neutral'}
              onEdit={() => edit(a)}
              onDelete={() => deleteAppointment(a.id).catch(() => {})}
            />
          ))}
        </SectionCard>
      )}
    </AppScreen>
  )
}
