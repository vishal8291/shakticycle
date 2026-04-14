import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, Banner, GhostButton, ListItem, MetricGrid, SectionCard, GradientButton, Badge, ProgressBar, Spacer } from '../../src/components/MobileUI'
import HealthScoreRing from '../../src/components/HealthScoreRing'
import { useRecord } from '../../src/providers/RecordProvider'
import { useAuth } from '../../src/providers/AuthProvider'
import { useDailyLog } from '../../src/providers/DailyLogProvider'
import { formatDate, relativeDays } from '../../src/utils/date'
import { calculateHealthScore, scoreColor } from '../../src/utils/healthScore'
import { colors, typography, shadows, radii, spacing } from '../../src/theme/colors'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeScreen() {
  const { record, loading, saving, offline, lastSyncedAt, reload, rebuildAi } = useRecord()
  const { user } = useAuth()
  const { today } = useDailyLog()
  const name = (record.patient?.name || user?.fullName || '').split(' ')[0]

  const { score, breakdown } = useMemo(() => calculateHealthScore(record), [record])

  // Smart notifications/reminders
  const notifications = useMemo(() => {
    const items: { id: string; icon: string; text: string; tone: string; action?: string }[] = []
    const now = new Date()
    const hour = now.getHours()

    // Medication reminders
    const activeMeds = (record.medications || []).filter((m: any) => m.active !== false)
    if (activeMeds.length > 0) {
      items.push({ id: 'med', icon: '💊', text: `${activeMeds.length} active medication${activeMeds.length > 1 ? 's' : ''} — remember to take on time`, tone: 'purple', action: '/(app)/more/medications' })
    }

    // Today's appointment
    const todayStr = now.toISOString().slice(0, 10)
    const todayAppts = (record.appointments || []).filter((a: any) => a.date === todayStr && a.status === 'Scheduled')
    if (todayAppts.length > 0) {
      items.push({ id: 'appt', icon: '🏥', text: `You have ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} today`, tone: 'warning', action: '/(app)/appointments' })
    }

    // Daily log reminder
    if (!today?.water && !today?.sleep && hour >= 10) {
      items.push({ id: 'log', icon: '📊', text: "Log today's water, sleep & exercise", tone: 'primary', action: '/(app)/more/daily-log' })
    }

    // Water reminder
    if (today?.water && today.water < 6 && hour >= 14) {
      items.push({ id: 'water', icon: '💧', text: `${today.water}/8 glasses today — drink more water!`, tone: 'info' })
    }

    // Profile incomplete
    const p = record.patient || {}
    if (!p.name || !p.bloodGroup || !p.sex) {
      items.push({ id: 'profile', icon: '👤', text: 'Complete your profile for better health insights', tone: 'accent', action: '/(app)/more/profile' })
    }

    // Emergency info missing
    const e = record.emergencyInfo || {}
    if (!e.contacts?.length && !e.allergies?.length) {
      items.push({ id: 'emer', icon: '🚨', text: 'Add emergency contacts & allergies', tone: 'danger', action: '/(app)/more/emergency' })
    }

    // No vitals tracked
    if (!(record.vitals || []).length) {
      items.push({ id: 'vital', icon: '💓', text: 'Start tracking your vitals (BP, glucose, weight)', tone: 'accent', action: '/(app)/more/vitals' })
    }

    return items.slice(0, 4) // Show max 4 notifications
  }, [record, today])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return (record.appointments || [])
      .filter((a: any) => a.status === 'Scheduled')
      .map((a: any) => ({ ...a, when: new Date(`${a.date}T${a.time || '09:00'}:00`).getTime() }))
      .filter((a: any) => !Number.isNaN(a.when) && a.when >= now)
      .sort((a: any, b: any) => a.when - b.when)
      .slice(0, 3)
  }, [record.appointments])

  const recentActivity = useMemo(() => (record.timeline || []).slice(0, 4), [record.timeline])

  return (
    <AppScreen refreshing={loading} onRefresh={reload} padded={false}>
      {/* ──── Top Navbar ──── */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.navLogo}>
            <Text style={styles.navLogoText}>H</Text>
          </LinearGradient>
          <View>
            <Text style={styles.navTitle}>HealthMap AI</Text>
            <Text style={styles.navSub}>Your health companion</Text>
          </View>
        </View>
        <View style={styles.navRight}>
          <Pressable onPress={() => router.push('/(app)/more/search')} style={styles.navBtn}>
            <Text style={styles.navBtnIcon}>🔍</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(app)/more/settings')} style={styles.navBtn}>
            <Text style={styles.navBtnIcon}>⚙️</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(app)/more/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || 'U')[0].toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {offline ? <Banner tone="warning" text="You're offline — showing cached data" icon="📡" /> : null}

        {/* Hero greeting */}
        <LinearGradient colors={['#dff0ff', '#eef9ff', '#f7fcff']} style={[styles.hero, shadows.md]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.greetLabel}>{greeting()}</Text>
          <Text style={styles.greetName}>{name || 'there'} 👋</Text>
          <Text style={styles.greetSub}>Here's your health overview</Text>
        </LinearGradient>

        {/* ──── Smart Notifications ──── */}
        {notifications.length > 0 && (
          <SectionCard title="Reminders & Tips">
            {notifications.map((n) => (
              <Pressable
                key={n.id}
                onPress={n.action ? () => router.push(n.action as any) : undefined}
                style={({ pressed }) => [styles.notifRow, pressed && n.action ? { opacity: 0.7 } : null]}
              >
                <View style={[styles.notifDot, { backgroundColor: (colors as any)[n.tone + 'Soft'] || colors.primarySoft }]}>
                  <Text style={styles.notifIcon}>{n.icon}</Text>
                </View>
                <Text style={styles.notifText} numberOfLines={2}>{n.text}</Text>
                {n.action ? <Text style={styles.notifArrow}>›</Text> : null}
              </Pressable>
            ))}
          </SectionCard>
        )}

        {/* ──── AI Chat Assistant ──── */}
        <Pressable onPress={() => router.push('/(app)/more/ai-chat')} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={['#7c5cbf', '#9b7ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.aiAssistant, shadows.md]}>
            <View style={styles.aiAvatarCircle}>
              <Text style={styles.aiAvatarEmoji}>🤖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiAssistantName}>VishalBytes</Text>
              <Text style={styles.aiAssistantMsg}>Hello! I'm your AI health assistant. Tap to chat with me about your health, symptoms, or get wellness tips!</Text>
            </View>
            <View style={styles.aiChatBubble}>
              <Text style={styles.aiChatBubbleText}>Chat</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Health Score Card */}
        <SectionCard>
          <View style={styles.scoreSection}>
            <HealthScoreRing score={score} size={150} strokeWidth={12} />
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={styles.scoreTitle}>Health Score</Text>
              <Text style={styles.scoreSub}>Based on {breakdown.length} health factors</Text>
            </View>
          </View>

          <View style={styles.breakdownGrid}>
            {breakdown.slice(0, 4).map((b, i) => (
              <View key={i} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownCat}>{b.category}</Text>
                  <Text style={[styles.breakdownPts, { color: b.points >= b.maxPoints ? colors.success : colors.textMuted }]}>{b.points}/{b.maxPoints}</Text>
                </View>
                <ProgressBar progress={b.points / b.maxPoints} color={b.points >= b.maxPoints ? colors.success : colors.primary} height={6} />
              </View>
            ))}
          </View>

          <GhostButton label="View full breakdown →" onPress={() => router.push('/(app)/more/health-score')} />
        </SectionCard>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="📄" label="Report" color={colors.primarySoft} onPress={() => router.push('/(app)/reports')} />
          <QuickAction icon="💓" label="Vital" color={colors.accentSoft} onPress={() => router.push('/(app)/more/vitals')} />
          <QuickAction icon="📅" label="Visit" color={colors.warningSoft} onPress={() => router.push('/(app)/appointments')} />
          <QuickAction icon="📊" label="Track" color={colors.purpleSoft} onPress={() => router.push('/(app)/more/daily-log')} />
        </View>

        {/* Stats */}
        <MetricGrid
          items={[
            { label: 'Reports', value: record.reports?.length || 0, icon: '📄', tone: 'primary' },
            { label: 'AI Insights', value: (record.reports || []).filter((r: any) => r.aiStatus).length, icon: '✨', tone: 'accent' },
            { label: 'Appointments', value: record.appointments?.length || 0, icon: '📅', tone: 'warning' },
            { label: 'Medications', value: record.medications?.length || 0, icon: '💊', tone: 'purple' },
          ]}
        />

        {/* Upcoming visits */}
        <SectionCard title="Upcoming Visits" action={<GhostButton label="All" onPress={() => router.push('/(app)/appointments')} />}>
          {upcoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <GradientButton label="Schedule visit" onPress={() => router.push('/(app)/appointments')} icon="+" />
            </View>
          ) : upcoming.map((a: any) => (
            <ListItem
              key={a.id}
              icon="🏥"
              title={a.title || 'Appointment'}
              subtitle={`${a.doctor || '—'}${a.location ? ' · ' + a.location : ''}`}
              meta={`${formatDate(a.date)}${a.time ? ' · ' + a.time : ''} · ${relativeDays(a.date)}`}
              tone="primary"
            />
          ))}
        </SectionCard>

        {/* Recent activity */}
        <SectionCard title="Recent Activity" action={<GhostButton label="Timeline" onPress={() => router.push('/(app)/timeline')} />}>
          {recentActivity.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Start logging to build your health story</Text>
            </View>
          ) : recentActivity.map((t: any) => (
            <ListItem
              key={t.id}
              title={t.title}
              subtitle={t.detail}
              meta={`${t.type} · ${formatDate(t.date)}`}
              tone={t.type?.startsWith?.('AI') ? 'accent' : 'neutral'}
            />
          ))}
        </SectionCard>

        {/* AI rebuild banner */}
        <Pressable onPress={rebuildAi} disabled={saving}>
          <LinearGradient colors={['#2c73d9', '#4a90e8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.aiBanner, shadows.md]}>
            <Text style={styles.aiBannerIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>{saving ? 'Analyzing...' : 'AI Health Analysis'}</Text>
              <Text style={styles.aiBannerSub}>Tap to refresh AI insights from your reports</Text>
            </View>
            <Text style={styles.aiBannerArrow}>→</Text>
          </LinearGradient>
        </Pressable>

        {lastSyncedAt ? <Banner tone="info" text={`Synced ${new Date(lastSyncedAt).toLocaleString()}`} icon="✓" /> : null}

        <Spacer size={20} />
      </View>
    </AppScreen>
  )
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }, shadows.sm]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  // Navbar
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: 50, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogo: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navLogoText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  navTitle: { ...typography.h4, color: colors.text },
  navSub: { ...typography.tiny, color: colors.textMuted },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  navBtnIcon: { fontSize: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  body: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },

  // Hero
  hero: { borderRadius: radii.xxxl, padding: spacing.xxl, gap: 4, borderWidth: 1, borderColor: colors.borderLight },
  greetLabel: { ...typography.caption, color: colors.textMuted },
  greetName: { ...typography.hero, color: colors.text, marginTop: 2 },
  greetSub: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

  // AI Assistant
  aiAssistant: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radii.xl, gap: 12 },
  aiAvatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  aiAvatarEmoji: { fontSize: 26 },
  aiAssistantName: { ...typography.bodyBold, color: '#fff', marginBottom: 2 },
  aiAssistantMsg: { ...typography.small, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  aiChatBubble: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full },
  aiChatBubbleText: { ...typography.caption, color: '#fff' },

  // Score
  scoreSection: { alignItems: 'center', paddingVertical: 8 },
  scoreTitle: { ...typography.h3, color: colors.text },
  scoreSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  breakdownGrid: { gap: 10 },
  breakdownItem: { gap: 4 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownCat: { ...typography.caption, color: colors.textSecondary },
  breakdownPts: { ...typography.small },

  // Quick actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  quickAction: { alignItems: 'center', flex: 1, gap: 6 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { ...typography.caption, color: colors.text },

  // Empty
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  emptyIcon: { fontSize: 36 },
  emptyText: { ...typography.body, color: colors.textMuted },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  notifDot: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 18 },
  notifText: { ...typography.body, color: colors.text, flex: 1 },
  notifArrow: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },

  // AI banner
  aiBanner: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: radii.xl, gap: 14 },
  aiBannerIcon: { fontSize: 28 },
  aiBannerTitle: { ...typography.bodyBold, color: '#fff' },
  aiBannerSub: { ...typography.small, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  aiBannerArrow: { fontSize: 22, color: '#fff', fontWeight: '700' },
})
