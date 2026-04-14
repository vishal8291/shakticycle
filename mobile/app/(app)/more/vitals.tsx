import { useMemo, useState } from 'react'
import { AppScreen, EmptyState, Field, GhostButton, ListItem, MetricGrid, PrimaryButton, SectionCard, SelectChips } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useToast } from '../../../src/providers/ToastProvider'
import { todayISO, formatDate } from '../../../src/utils/date'

const CATEGORIES = ['General', 'Blood Pressure', 'Glucose', 'Temperature', 'Weight', 'Oxygen', 'Pulse']
const EMPTY = { label: '', value: '', note: '', date: todayISO(), category: 'General' }

export default function VitalsScreen() {
  const { record, saving, loading, reload, addVital, updateVital, deleteVital } = useRecord()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)

  const vitals = record.vitals || []
  const latest = vitals[0]

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of vitals) counts[v.category || 'General'] = (counts[v.category || 'General'] || 0) + 1
    return counts
  }, [vitals])

  const submit = async () => {
    if (!form.label.trim()) { toast.error('Label required'); return }
    if (!form.value.trim()) { toast.error('Value required'); return }
    try {
      if (editingId) await updateVital(editingId, form)
      else await addVital(form)
      setForm(EMPTY)
      setEditingId(null)
    } catch { /* ignore */ }
  }

  const edit = (v: any) => {
    setEditingId(v.id)
    setForm({ label: v.label, value: v.value, note: v.note || '', date: v.date, category: v.category || 'General' })
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <MetricGrid items={[
        { label: 'Readings', value: vitals.length, tone: 'primary' },
        { label: 'Categories', value: Object.keys(categoryCounts).length, tone: 'accent' },
        { label: 'Latest', value: latest ? (latest.label || '—') : '—', tone: 'neutral' },
      ]} />

      <SectionCard title={editingId ? 'Edit vital' : 'Log vital'}>
        <SelectChips options={CATEGORIES} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Label" value={form.label} onChangeText={(v) => setForm({ ...form, label: v })} placeholder="e.g. BP, Glucose" />
        <Field label="Value" value={form.value} onChangeText={(v) => setForm({ ...form, value: v })} placeholder="e.g. 120/80 mmHg" />
        <Field label="Date" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
        <Field label="Note" value={form.note} onChangeText={(v) => setForm({ ...form, note: v })} multiline />
        <PrimaryButton label={editingId ? 'Save changes' : 'Add vital'} onPress={submit} loading={saving} />
        {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(EMPTY) }} /> : null}
      </SectionCard>

      <SectionCard title="History">
        {vitals.length === 0 ? (
          <EmptyState title="No vitals yet" message="Log a reading to track trends over time." />
        ) : vitals.map((v: any) => (
          <ListItem
            key={v.id}
            title={`${v.label} · ${v.value}`}
            subtitle={v.note || ''}
            meta={`${v.category || 'General'} · ${formatDate(v.date)}`}
            tone="accent"
            onEdit={() => edit(v)}
            onDelete={() => deleteVital(v.id).catch(() => {})}
          />
        ))}
      </SectionCard>
    </AppScreen>
  )
}
