import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, SectionCard, ProgressBar, GradientButton, Badge, Spacer } from '../../../src/components/MobileUI'
import HealthScoreRing from '../../../src/components/HealthScoreRing'
import { calculateHealthScore, scoreColor, scoreLabel } from '../../../src/utils/healthScore'
import { useRecord } from '../../../src/providers/RecordProvider'
import { colors, typography, shadows, radii, spacing } from '../../../src/theme/colors'

const CATEGORY_ICONS: Record<string, string> = {
  Profile: '\u{1F464}',
  'Emergency Info': '\u{1F198}',
  Vitals: '\u{1F493}',
  Reports: '\u{1F4C4}',
  Medications: '\u{1F48A}',
  Appointments: '\u{1F4C5}',
  'Timeline Activity': '\u{1F4DD}',
}

export default function HealthScoreScreen() {
  const { record } = useRecord()
  const { score, breakdown } = calculateHealthScore(record)
  const color = scoreColor(score)
  const label = scoreLabel(score)

  const improvementTips = breakdown.filter((b) => b.points < b.maxPoints)

  return (
    <AppScreen>
      {/* Hero section */}
      <LinearGradient
        colors={[colors.primarySoft, colors.surfaceAlt, colors.background]}
        style={styles.hero}
      >
        <HealthScoreRing score={score} size={180} />
        <Spacer size={spacing.lg} />
        <Text style={styles.heroLabel}>Your Health Score</Text>
        <View style={styles.badgeRow}>
          <Badge
            label={label}
            tone={score >= 75 ? 'accent' : score >= 60 ? 'primary' : score >= 40 ? 'warning' : 'danger'}
          />
        </View>
        <Text style={styles.heroSub}>
          Based on {breakdown.length} health categories
        </Text>
      </LinearGradient>

      <Spacer size={spacing.xl} />

      {/* Score Breakdown */}
      <SectionCard title="Score Breakdown">
        {breakdown.map((item) => {
          const progress = item.maxPoints > 0 ? item.points / item.maxPoints : 0
          const barColor =
            progress >= 1 ? colors.accent : progress >= 0.5 ? colors.warning : colors.danger
          const icon = CATEGORY_ICONS[item.category] || '\u{2753}'

          return (
            <View key={item.category} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{icon}</Text>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <Text style={styles.categoryName}>{item.category}</Text>
                    <Text style={styles.categoryPoints}>
                      {item.points}/{item.maxPoints}
                    </Text>
                  </View>
                  <Spacer size={spacing.xs} />
                  <ProgressBar progress={progress} color={barColor} height={6} />
                  <Spacer size={spacing.xs} />
                  <Text style={styles.categoryTip}>{item.tip}</Text>
                </View>
              </View>
            </View>
          )
        })}
      </SectionCard>

      <Spacer size={spacing.xl} />

      {/* How to improve */}
      {improvementTips.length > 0 && (
        <SectionCard title="How to Improve">
          {improvementTips.map((item) => {
            const icon = CATEGORY_ICONS[item.category] || '\u{2753}'
            const missing = item.maxPoints - item.points
            return (
              <View key={item.category} style={styles.tipRow}>
                <Text style={styles.tipIcon}>{icon}</Text>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>
                    {item.category}{' '}
                    <Text style={styles.tipPoints}>+{missing} pts possible</Text>
                  </Text>
                  <Text style={styles.tipText}>{item.tip}</Text>
                </View>
              </View>
            )
          })}
        </SectionCard>
      )}

      <Spacer size={spacing.xxxl} />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  heroLabel: {
    ...typography.h3,
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  heroSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  categoryRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  categoryIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
    marginTop: 2,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  categoryPoints: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryTip: {
    ...typography.small,
    color: colors.textMuted,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tipIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  tipPoints: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  tipText: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
})
