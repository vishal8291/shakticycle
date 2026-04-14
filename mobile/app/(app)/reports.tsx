import { useState, useMemo } from 'react'
import { View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { AppScreen, Field, GhostButton, ListItem, MetricGrid, PrimaryButton, SectionCard, SecondaryButton, SelectChips, Badge, EmptyState } from '../../src/components/MobileUI'
import { useRecord } from '../../src/providers/RecordProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { todayISO, formatDate } from '../../src/utils/date'

const STATUSES = ['Pending review', 'Reviewed', 'Needs follow-up']
const EMPTY_FORM = { name: '', doctor: '', date: todayISO(), status: 'Pending review' }

export default function ReportsScreen() {
  const { record, saving, loading, reload, uploadReport, updateReport, deleteReport, rebuildAi } = useRecord()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const reports = record.reports || []
  const aiReady = reports.filter((r: any) => r.aiStatus).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reports.filter((r: any) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (!q) return true
      return [r.name, r.doctor, r.aiSummary, r.extractedSummary].some((v: any) => String(v || '').toLowerCase().includes(q))
    })
  }, [reports, query, statusFilter])

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, multiple: false })
      if (res.canceled) return
      const asset = (res.assets || [])[0]
      if (!asset) return
      setFile({ uri: asset.uri, name: asset.name || 'report.pdf', type: asset.mimeType || 'application/pdf' })
    } catch (err: any) {
      toast.error(err?.message || 'Could not pick file')
    }
  }

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Report name required'); return }
    if (!form.date.trim()) { toast.error('Date required'); return }
    try {
      if (editingId) {
        await updateReport(editingId, form)
      } else {
        await uploadReport(form, file)
      }
      setForm(EMPTY_FORM)
      setFile(null)
      setEditingId(null)
    } catch { /* toast shown by provider */ }
  }

  const startEdit = (r: any) => {
    setEditingId(r.id)
    setForm({ name: r.name, doctor: r.doctor, date: r.date, status: r.status })
    setFile(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFile(null)
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <MetricGrid items={[
        { label: 'Reports', value: reports.length, tone: 'primary' },
        { label: 'AI ready', value: aiReady, tone: 'accent' },
        { label: 'Pending review', value: reports.filter((r: any) => r.status === 'Pending review').length, tone: 'warning' },
      ]} />

      <SectionCard title={editingId ? 'Edit report' : 'Add report'} subtitle="PDFs are scanned with AI for summaries and measurements.">
        <Field label="Report name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Blood test, MRI…" />
        <Field label="Doctor" value={form.doctor} onChangeText={(v) => setForm({ ...form, doctor: v })} placeholder="Dr. Name" />
        <Field label="Date" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" />
        <Field label="Status" value={form.status} onChangeText={(v) => setForm({ ...form, status: v })} help="Pending review / Reviewed / Needs follow-up" />
        <SelectChips options={STATUSES} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
        {!editingId && (
          <View style={{ gap: 8 }}>
            <SecondaryButton label={file ? `Selected: ${file.name}` : 'Attach PDF or image'} onPress={pickFile} />
            {file ? <GhostButton label="Remove file" onPress={() => setFile(null)} /> : null}
          </View>
        )}
        <PrimaryButton label={editingId ? 'Save changes' : file ? 'Upload & analyze' : 'Save report'} onPress={submit} loading={saving} />
        {editingId ? <GhostButton label="Cancel" onPress={cancelEdit} /> : null}
      </SectionCard>

      <SectionCard title="Your reports" action={<GhostButton label={saving ? '…' : 'Re-run AI'} onPress={rebuildAi} disabled={saving} />}>
        <Field label="Search" value={query} onChangeText={setQuery} placeholder="Search by name, doctor, summary…" />
        <SelectChips options={['All', ...STATUSES]} value={statusFilter} onChange={setStatusFilter} />
        {filtered.length === 0 ? (
          <EmptyState title="No reports yet" message="Upload a PDF to get an AI summary and extracted measurements." />
        ) : filtered.map((r: any) => (
          <ListItem
            key={r.id}
            title={r.name}
            subtitle={r.aiSummary || r.extractedSummary || 'No summary yet.'}
            meta={`${r.doctor || '—'} · ${formatDate(r.date)} · ${r.status}`}
            tone={r.status === 'Needs follow-up' ? 'warning' : r.aiStatus ? 'accent' : 'neutral'}
            right={r.aiStatus ? <Badge label="AI" tone="accent" /> : undefined}
            onEdit={() => startEdit(r)}
            onDelete={() => deleteReport(r.id).catch(() => {})}
          />
        ))}
      </SectionCard>
    </AppScreen>
  )
}
