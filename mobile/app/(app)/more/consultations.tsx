import { useState } from 'react'
import { AppScreen, EmptyState, Field, GhostButton, ListItem, PrimaryButton, SectionCard } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useToast } from '../../../src/providers/ToastProvider'
import { todayISO, formatDate } from '../../../src/utils/date'

const EMPTY = { doctor: '', specialty: '', date: todayISO(), summary: '', nextStepsText: '' }

export default function ConsultationsScreen() {
  const { record, saving, loading, reload, addConsultation, updateConsultation, deleteConsultation } = useRecord()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)

  const list = record.consultations || []

  const submit = async () => {
    if (!form.doctor.trim()) { toast.error('Doctor required'); return }
    if (!form.summary.trim()) { toast.error('Summary required'); return }
    const payload = {
      doctor: form.doctor.trim(),
      specialty: form.specialty.trim(),
      date: form.date,
      summary: form.summary.trim(),
      nextSteps: form.nextStepsText.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    try {
      if (editingId) await updateConsultation(editingId, payload)
      else await addConsultation(payload)
      setForm(EMPTY)
      setEditingId(null)
    } catch { /* ignore */ }
  }

  const edit = (c: any) => {
    setEditingId(c.id)
    setForm({ doctor: c.doctor, specialty: c.specialty || '', date: c.date, summary: c.summary, nextStepsText: (c.nextSteps || []).join('\n') })
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <SectionCard title={editingId ? 'Edit visit' : 'Log a doctor visit'}>
        <Field label="Doctor" value={form.doctor} onChangeText={(v) => setForm({ ...form, doctor: v })} />
        <Field label="Specialty" value={form.specialty} onChangeText={(v) => setForm({ ...form, specialty: v })} placeholder="e.g. Cardiology" />
        <Field label="Date" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
        <Field label="Conversation summary" value={form.summary} onChangeText={(v) => setForm({ ...form, summary: v })} multiline />
        <Field label="Next steps" value={form.nextStepsText} onChangeText={(v) => setForm({ ...form, nextStepsText: v })} multiline help="One step per line" />
        <PrimaryButton label={editingId ? 'Save changes' : 'Add visit'} onPress={submit} loading={saving} />
        {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(EMPTY) }} /> : null}
      </SectionCard>

      <SectionCard title="History">
        {list.length === 0 ? (
          <EmptyState title="No visits yet" message="Log a consultation to keep notes and next steps together." />
        ) : list.map((c: any) => (
          <ListItem
            key={c.id}
            title={`${c.doctor}${c.specialty ? ' · ' + c.specialty : ''}`}
            subtitle={c.summary}
            meta={`${formatDate(c.date)}${c.nextSteps?.length ? ' · ' + c.nextSteps.length + ' next steps' : ''}`}
            tone="primary"
            onEdit={() => edit(c)}
            onDelete={() => deleteConsultation(c.id).catch(() => {})}
          />
        ))}
      </SectionCard>
    </AppScreen>
  )
}
