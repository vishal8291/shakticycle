import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppScreen, SectionCard, Spacer } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { colors, typography, shadows, radii, spacing } from '../../../src/theme/colors'

type SearchResult = {
  category: string
  icon: string
  title: string
  detail: string
}

const CATEGORY_ICONS: Record<string, string> = {
  Timeline: '\u{1F4DD}',
  Reports: '\u{1F4C4}',
  Medications: '\u{1F48A}',
  Appointments: '\u{1F4C5}',
  Vitals: '\u{1F493}',
}

function searchRecords(record: any, query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []

  // Timeline
  const timeline: any[] = Array.isArray(record?.timeline) ? record.timeline : []
  timeline.forEach((t) => {
    const title = t.title || ''
    const details = t.details || t.description || ''
    if (title.toLowerCase().includes(q) || details.toLowerCase().includes(q)) {
      results.push({
        category: 'Timeline',
        icon: CATEGORY_ICONS.Timeline,
        title: title || 'Timeline entry',
        detail: details ? details.slice(0, 80) : t.date || '',
      })
    }
  })

  // Reports
  const reports: any[] = Array.isArray(record?.reports) ? record.reports : []
  reports.forEach((r) => {
    const name = r.name || r.title || ''
    const summary = r.aiSummary || r.summary || ''
    if (name.toLowerCase().includes(q) || summary.toLowerCase().includes(q)) {
      results.push({
        category: 'Reports',
        icon: CATEGORY_ICONS.Reports,
        title: name || 'Report',
        detail: summary ? summary.slice(0, 80) : r.date || '',
      })
    }
  })

  // Medications
  const medications: any[] = Array.isArray(record?.medications) ? record.medications : []
  medications.forEach((m) => {
    const name = m.name || ''
    if (name.toLowerCase().includes(q)) {
      results.push({
        category: 'Medications',
        icon: CATEGORY_ICONS.Medications,
        title: name,
        detail: `${m.dosage || ''} ${m.frequency || ''} [${m.status || 'Active'}]`.trim(),
      })
    }
  })

  // Appointments
  const appointments: any[] = Array.isArray(record?.appointments) ? record.appointments : []
  appointments.forEach((a) => {
    const title = a.title || ''
    const doctor = a.doctor || ''
    if (title.toLowerCase().includes(q) || doctor.toLowerCase().includes(q)) {
      results.push({
        category: 'Appointments',
        icon: CATEGORY_ICONS.Appointments,
        title: title || doctor || 'Appointment',
        detail: doctor ? `Dr. ${doctor} — ${a.date || ''}` : a.date || '',
      })
    }
  })

  // Vitals
  const vitals: any[] = Array.isArray(record?.vitals) ? record.vitals : []
  vitals.forEach((v) => {
    const type = v.type || ''
    if (type.toLowerCase().includes(q)) {
      results.push({
        category: 'Vitals',
        icon: CATEGORY_ICONS.Vitals,
        title: type,
        detail: `${v.value || ''} ${v.unit || ''} (${v.date || ''})`,
      })
    }
  })

  return results
}

export default function SearchScreen() {
  const { record } = useRecord()
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchRecords(record, query), [record, query])

  // Group results by category
  const grouped = useMemo(() => {
    const map: Record<string, SearchResult[]> = {}
    results.forEach((r) => {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    })
    return map
  }, [results])

  const categories = Object.keys(grouped)
  const hasQuery = query.trim().length >= 2
  const noResults = hasQuery && results.length === 0

  return (
    <AppScreen>
      {/* Search input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>{'\u{1F50D}'}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your health records..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
            <Text style={styles.clearText}>{'\u{2715}'}</Text>
          </Pressable>
        )}
      </View>

      <Spacer size={spacing.lg} />

      {/* Empty state */}
      {!hasQuery && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'\u{1F50E}'}</Text>
          <Text style={styles.emptyTitle}>Search your records</Text>
          <Text style={styles.emptyDescription}>
            Find timeline entries, reports, medications, appointments, and vitals across all your
            health data.
          </Text>
        </View>
      )}

      {/* No results */}
      {noResults && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'\u{1F6AB}'}</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyDescription}>
            No matches for "{query}". Try a different search term.
          </Text>
        </View>
      )}

      {/* Results grouped by category */}
      {categories.map((cat) => (
        <View key={cat}>
          <SectionCard title={`${CATEGORY_ICONS[cat] || ''} ${cat}`}>
            {grouped[cat].map((result, idx) => (
              <Pressable
                key={`${cat}-${idx}`}
                style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
              >
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {result.title}
                  </Text>
                  {result.detail ? (
                    <Text style={styles.resultDetail} numberOfLines={2}>
                      {result.detail}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </SectionCard>
          <Spacer size={spacing.md} />
        </View>
      ))}

      {hasQuery && results.length > 0 && (
        <Text style={styles.resultCount}>
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </Text>
      )}

      <Spacer size={spacing.xxxl} />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resultRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultRowPressed: {
    opacity: 0.6,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  resultDetail: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  resultCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
