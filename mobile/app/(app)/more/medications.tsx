import { useState } from 'react'
import { AppScreen, EmptyState, Field, GhostButton, ListItem, MetricGrid, PrimaryButton, SectionCard, SelectChips } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useToast } from '../../../src/providers/ToastProvider'

const ADHERENCE = ['New', 'Daily', 'As needed', 'Paused']
const EMPTY = { name: '', dose: '', schedule: '', adherence: 'Daily' }

export default function MedicationsScreen() {
  const { record, saving, loading, reload, addMedication, updateMedication, deleteMedication } = useRecord()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)

  const meds = record.medications || []
  const daily = meds.filter((m: any) => m.adherence === 'Daily').length

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    if (!form.dose.trim()) { toast.error('Dose required'); return }
    if (!form.schedule.trim()) { toast.error('Schedule required'); return }
    try {
      if (editingId) await updateMedication(editingId, form)
      else await addMedication(form)
      setForm(EMPTY)
      setEditingId(null)
    } catch { /* ignore */ }
  }

  const edit = (m: any) => {
    setEditingId(m.id)
    setForm({ name: m.name, dose: m.dose, schedule: m.schedule, adherence: m.adherence })
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <MetricGrid items={[
        { label: 'Total', value: meds.length, tone: 'primary' },
        { label: 'Daily', value: daily, tone: 'accent' },
        { label: 'Paused', value: meds.filter((m: any) => m.adherence === 'Paused').length, tone: 'warning' },
      ]} />

      <SectionCard title={editingId ? 'Edit medication' : 'Add medication'}>
        <Field label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Field label="Dose" value={form.dose} onChangeText={(v) => setForm({ ...form, dose: v })} placeholder="e.g. 10 mg" />
        <Field label="Schedule" value={form.schedule} onChangeText={(v) => setForm({ ...form, schedule: v })} placeholder="e.g. 1 tab after dinner" />
        <SelectChips options={ADHERENCE} value={form.adherence} onChange={(v) => setForm({ ...form, adherence: v })} />
        <PrimaryButton label={editingId ? 'Save changes' : 'Add medication'} onPress={submit} loading={saving} />
        {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(EMPTY) }} /> : null}
      </SectionCard>

      <SectionCard title="Your medications">
        {meds.length === 0 ? (
          <EmptyState title="No medications" message="Log one to keep track of doses and schedules." />
        ) : meds.map((m: any) => (
          <ListItem
            key={m.id}
            title={`${m.name} · ${m.dose}`}
            subtitle={m.schedule}
            meta={m.adherence}
            tone={m.adherence === 'Paused' ? 'warning' : m.adherence === 'New' ? 'primary' : 'accent'}
            onEdit={() => edit(m)}
            onDelete={() => deleteMedication(m.id).catch(() => {})}
          />
        ))}
      </SectionCard>
    </AppScreen>
  )
}
