export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso: string, time?: string): string {
  if (!iso) return '—'
  const d = new Date(time ? `${iso}T${time}:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function relativeDays(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Math.round((d.getTime() - Date.now()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 14) return `in ${diff} days`
  if (diff < -1 && diff > -14) return `${-diff} days ago`
  return formatDate(iso)
}

export function reminderOffsetMs(reminder: string): number | null {
  const v = String(reminder || '').toLowerCase()
  if (v.includes('1 day')) return 24 * 60 * 60 * 1000
  if (v.includes('3 hours')) return 3 * 60 * 60 * 1000
  if (v.includes('1 hour')) return 60 * 60 * 1000
  if (v.includes('same day')) return 6 * 60 * 60 * 1000
  return null
}
