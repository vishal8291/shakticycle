import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppScreen, Banner, EmptyState, Field, GhostButton, ListItem, PrimaryButton, SectionCard, SelectChips, Badge } from '../../src/components/MobileUI'
import { useRecord } from '../../src/providers/RecordProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { SYMPTOMS, TIMELINE_TYPES } from '../../src/constants/symptoms'
import { todayISO, formatDate } from '../../src/utils/date'
import { colors } from '../../src/theme/colors'

const EMPTY = { date: todayISO(), title: '', detail: '', type: 'Symptoms' }

export default function TimelineScreen() {
  const { record, saving, loading, reload, addTimeline, updateTimeline, deleteTimeline } = useRecord()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (record.timeline || []).filter((t: any) => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false
      if (!q) return true
      return [t.title, t.detail, t.type].some((v: any) => String(v || '').toLowerCase().includes(q))
    })
  }, [record.timeline, query, typeFilter])

  const guidance = useMemo(() => SYMPTOMS.find((s) => s.label === selectedSymptom) || null, [selectedSymptom])

  const useSymptom = (label: string) => {
    const s = SYMPTOMS.find((x) => x.label === label)
    setSelectedSymptom(label)
    if (s) setForm((f) => ({ ...f, title: s.label, detail: s.note, type: 'Symptoms' }))
  }

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    if (!form.detail.trim()) { toast.error('Detail required'); return }
    try {
      if (editingId) await updateTimeline(editingId, form)
      else await addTimeline(form)
      setForm(EMPTY)
      setEditingId(null)
      setSelectedSymptom(null)
    } catch { /* ignore */ }
  }

  const edit = (t: any) => {
    setEditingId(t.id)
    setForm({ date: t.date, title: t.title, detail: t.detail, type: t.type })
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <SectionCard title="Symptom assistant" subtitle="Tap a symptom to see guidance and add it to your timeline.">
        <View style={styles.chipGrid}>
          {SYMPTOMS.map((s) => (
            <Pressable key={s.label} onPress={() => useSymptom(s.label)} style={[styles.symptomChip, selectedSymptom === s.label && styles.symptomChipActive]}>
              <Text style={[styles.symptomText, selectedSymptom === s.label && styles.symptomTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
        {guidance && (
          <Banner
            tone={guidance.guidance === 'Emergency' ? 'error' : guidance.guidance === 'See a doctor' ? 'warning' : 'neutral'}
            text={`${guidance.guidance}: ${guidance.note}`}
          />
        )}
      </SectionCard>

      <SectionCard title={editingId ? 'Edit entry' : 'Add timeline entry'}>
        <SelectChips options={TIMELINE_TYPES} value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
        <Field label="Date" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" />
        <Field label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        <Field label="Detail" value={form.detail} onChangeText={(v) => setForm({ ...form, detail: v })} multiline />
        <PrimaryButton label={editingId ? 'Save changes' : 'Add to timeline'} onPress={submit} loading={saving} />
        {editingId ? <GhostButton label="Cancel" onPress={() => { setEditingId(null); setForm(EMPTY) }} /> : null}
      </SectionCard>

      <SectionCard title="History">
        <Field label="Search" value={query} onChangeText={setQuery} placeholder="Search history…" />
        <SelectChips options={['All', ...TIMELINE_TYPES]} value={typeFilter} onChange={setTypeFilter} />
        {filtered.length === 0 ? (
          <EmptyState title="Empty timeline" message="Log a symptom, vital, or appointment to start your history." />
        ) : filtered.map((t: any) => (
          <ListItem
            key={t.id}
            title={t.title}
            subtitle={t.detail}
            meta={`${t.type} · ${formatDate(t.date)}`}
            tone={t.type?.startsWith?.('AI') ? 'accent' : t.type === 'Symptoms' ? 'warning' : 'primary'}
            right={t.type ? <Badge label={t.type} /> : undefined}
            onEdit={() => edit(t)}
            onDelete={() => deleteTimeline(t.id).catch(() => {})}
          />
        ))}
      </SectionCard>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  symptomChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  symptomText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  symptomTextActive: { color: '#fff' },
})
