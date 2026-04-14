import { useMemo } from 'react'
import { AppScreen, EmptyState, GhostButton, ListItem, MetricGrid, PrimaryButton, SectionCard } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { formatDate } from '../../../src/utils/date'

export default function InsightsScreen() {
  const { record, saving, loading, reload, rebuildAi } = useRecord()

  const aiEntries = useMemo(() => (record.timeline || []).filter((t: any) => String(t.type || '').startsWith('AI')), [record.timeline])
  const aiReports = useMemo(() => (record.reports || []).filter((r: any) => r.aiStatus), [record.reports])

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <MetricGrid items={[
        { label: 'AI summaries', value: aiReports.length, tone: 'accent' },
        { label: 'AI timeline items', value: aiEntries.length, tone: 'primary' },
      ]} />

      <SectionCard title="Generate" subtitle="Re-runs AI on all reports and refreshes timeline suggestions.">
        <PrimaryButton label={saving ? 'Generating…' : 'Rebuild AI summaries'} onPress={rebuildAi} loading={saving} />
      </SectionCard>

      <SectionCard title="AI report summaries">
        {aiReports.length === 0 ? (
          <EmptyState title="No AI summaries yet" message="Upload a report or press 'Rebuild AI summaries' above." />
        ) : aiReports.map((r: any) => (
          <ListItem
            key={r.id}
            title={r.name}
            subtitle={r.aiSummary || r.extractedSummary}
            meta={`${r.doctor || '—'} · ${formatDate(r.date)}`}
            tone="accent"
          />
        ))}
      </SectionCard>

      <SectionCard title="AI timeline items">
        {aiEntries.length === 0 ? (
          <EmptyState title="No AI timeline items" message="AI follow-ups will appear here after reports are analyzed." />
        ) : aiEntries.map((t: any) => (
          <ListItem key={t.id} title={t.title} subtitle={t.detail} meta={`${t.type} · ${formatDate(t.date)}`} tone="accent" />
        ))}
      </SectionCard>
    </AppScreen>
  )
}
