import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppScreen, HeroCard, SectionCard } from '../../../src/components/MobileUI'
import { useAuth } from '../../../src/providers/AuthProvider'
import { useRecord } from '../../../src/providers/RecordProvider'
import { colors } from '../../../src/theme/colors'

type Item = { icon: string; label: string; sub: string; href: string }

const ITEMS: Item[] = [
  { icon: '✨', label: 'Subscription Plans', sub: 'Free, Premium & Family plans', href: '/(app)/more/plans' },
  { icon: '\u{1F4CA}', label: 'Daily Tracking', sub: 'Water, sleep, exercise & mood', href: '/(app)/more/daily-log' },
  { icon: '❤', label: 'Vitals', sub: 'BP, glucose, weight, pulse', href: '/(app)/more/vitals' },
  { icon: '💊', label: 'Medications', sub: 'Prescriptions & adherence', href: '/(app)/more/medications' },
  { icon: '🩺', label: 'Doctor visits', sub: 'Consultations & follow-ups', href: '/(app)/more/consultations' },
  { icon: '🚨', label: 'Emergency card', sub: 'Contacts, insurance, allergies', href: '/(app)/more/emergency' },
  { icon: '🪪', label: 'ABDM / ABHA', sub: 'Link national health records', href: '/(app)/more/abdm' },
  { icon: '\u{1F916}', label: 'AI Health Chat', sub: 'Ask questions, get wellness tips', href: '/(app)/more/ai-chat' },
  { icon: '🍛', label: 'Indian Food Guide', sub: '100+ foods, diet plans & nutrition', href: '/(app)/more/food-guide' },
  { icon: '\u{1F4AF}', label: 'Health Score', sub: 'Your personalized health rating', href: '/(app)/more/health-score' },
  { icon: '✨', label: 'AI insights', sub: 'Report summaries & follow-ups', href: '/(app)/more/insights' },
  { icon: '\u{1F4E4}', label: 'Export & Share', sub: 'Export records, share with doctor', href: '/(app)/more/export' },
  { icon: '\u{1F50D}', label: 'Search Records', sub: 'Find anything in your health data', href: '/(app)/more/search' },
  { icon: '👤', label: 'Profile', sub: 'Personal & medical info', href: '/(app)/more/profile' },
  { icon: '⚙️', label: 'Settings', sub: 'Notifications, cache, sign out', href: '/(app)/more/settings' },
  { icon: '📜', label: 'Terms & Conditions', sub: 'Usage terms and policies', href: '/(app)/more/terms' },
  { icon: '🔐', label: 'Privacy Policy', sub: 'How we handle your data', href: '/(app)/more/privacy' },
]

export default function MoreIndex() {
  const { user } = useAuth()
  const { record } = useRecord()
  const name = record.patient?.name || user?.fullName || 'Your account'

  return (
    <AppScreen>
      <HeroCard title={name} subtitle={user?.email || ''} />
      <SectionCard title="Manage">
        {ITEMS.map((item) => (
          <Pressable key={item.href} onPress={() => router.push(item.href as any)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowSub}>{item.sub}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </SectionCard>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { opacity: 0.6 },
  icon: { fontSize: 22, width: 28, textAlign: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
})
