import { ReactNode } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, ViewStyle, TextStyle, TextInput, TextInputProps, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radii, typography, shadows } from '../theme/colors'

/* ────── Layout ────── */

export function AppScreen({ children, refreshing, onRefresh, padded = true }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; padded?: boolean }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={padded ? styles.content : styles.contentFlush}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

/* ────── Hero ────── */

export function HeroCard({ title, subtitle, actionLabel, onAction, accent, icon }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; accent?: string; icon?: string }) {
  return (
    <LinearGradient colors={[accent ?? '#dff0ff', '#eef9ff', '#f7fcff']} style={[styles.heroCard, shadows.md]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {icon ? <Text style={styles.heroIcon}>{icon}</Text> : null}
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
    </LinearGradient>
  )
}

/* ────── Cards ────── */

export function SectionCard({ title, subtitle, children, action, gradient }: { title?: string; subtitle?: string; children: ReactNode; action?: ReactNode; gradient?: boolean }) {
  const inner = (
    <>
      {(title || action) && (
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      )}
      {children}
    </>
  )

  if (gradient) {
    return (
      <LinearGradient colors={['#ffffff', '#f8fbff']} style={[styles.card, shadows.sm]}>
        {inner}
      </LinearGradient>
    )
  }

  return <View style={[styles.card, shadows.sm]}>{inner}</View>
}

export function GlassCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.glassCard, shadows.md, style]}>
      {children}
    </View>
  )
}

/* ────── Stats & Metrics ────── */

export function StatRow({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <View style={styles.statRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

export function MetricGrid({ items }: { items: Array<{ label: string; value: string | number; icon?: string; tone?: 'primary' | 'accent' | 'warning' | 'neutral' | 'purple' | 'danger' }> }) {
  return (
    <View style={styles.metricGrid}>
      {items.map((item, idx) => (
        <View key={idx} style={[styles.metricTile, toneBg(item.tone), shadows.sm]}>
          {item.icon ? <Text style={styles.metricIcon}>{item.icon}</Text> : null}
          <Text style={[styles.metricValue, toneText(item.tone)]}>{item.value}</Text>
          <Text style={styles.metricLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

function toneBg(tone?: string): ViewStyle {
  switch (tone) {
    case 'primary': return { backgroundColor: colors.primarySoft }
    case 'accent': return { backgroundColor: colors.accentSoft }
    case 'warning': return { backgroundColor: colors.warningSoft }
    case 'danger': return { backgroundColor: colors.dangerSoft }
    case 'purple': return { backgroundColor: colors.purpleSoft }
    default: return { backgroundColor: colors.surfaceAlt }
  }
}

function toneText(tone?: string): TextStyle {
  switch (tone) {
    case 'primary': return { color: colors.primary }
    case 'accent': return { color: colors.accentDark }
    case 'warning': return { color: colors.warning }
    case 'danger': return { color: colors.danger }
    case 'purple': return { color: colors.purple }
    default: return { color: colors.text }
  }
}

/* ────── Buttons ────── */

export function PrimaryButton({ label, onPress, disabled, loading, icon, size = 'md' }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; icon?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeStyle = size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : {}
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.primaryButton, sizeStyle, (disabled || loading) && styles.buttonDisabled, pressed && styles.buttonPressed]}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
          <Text style={[styles.primaryButtonText, size === 'sm' && { fontSize: 13 }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

export function GradientButton({ label, onPress, disabled, loading, colors: gradColors, icon }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; colors?: readonly [string, string]; icon?: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [pressed && styles.buttonPressed, (disabled || loading) && styles.buttonDisabled]}>
      <LinearGradient colors={gradColors ?? colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.primaryButton, shadows.md]}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
            <Text style={styles.primaryButtonText}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  )
}

export function SecondaryButton({ label, onPress, disabled, tone, icon }: { label: string; onPress: () => void; disabled?: boolean; tone?: 'neutral' | 'danger'; icon?: string }) {
  const dangerStyle = tone === 'danger' ? { backgroundColor: colors.dangerSoft, borderColor: '#f3c2c2' } : null
  const dangerText = tone === 'danger' ? { color: colors.danger } : null
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.secondaryButton, dangerStyle, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
        <Text style={[styles.secondaryButtonText, dangerText]}>{label}</Text>
      </View>
    </Pressable>
  )
}

export function GhostButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.ghostButton, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon ? <Text style={{ fontSize: 14 }}>{icon}</Text> : null}
        <Text style={styles.ghostButtonText}>{label}</Text>
      </View>
    </Pressable>
  )
}

export function IconButton({ icon, onPress, size = 40, bg }: { icon: string; onPress: () => void; size?: number; bg?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || colors.surfaceAlt }, pressed && styles.buttonPressed]}>
      <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
    </Pressable>
  )
}

/* ────── Form ────── */

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, error, help, editable = true, autoCapitalize, icon }: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: TextInputProps['keyboardType']
  multiline?: boolean
  error?: string
  help?: string
  editable?: boolean
  autoCapitalize?: TextInputProps['autoCapitalize']
  icon?: string
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError, !editable && styles.inputDisabled]}>
        {icon ? <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text> : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
    </View>
  )
}

export function SelectChips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = value === opt
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/* ────── Badges & Labels ────── */

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'primary' | 'accent' | 'warning' | 'danger' | 'purple' | 'gold'; icon?: string }) {
  return (
    <View style={[styles.badge, badgeToneBg(tone)]}>
      {icon ? <Text style={{ fontSize: 10, marginRight: 3 }}>{icon}</Text> : null}
      <Text style={[styles.badgeText, badgeToneText(tone)]}>{label}</Text>
    </View>
  )
}

function badgeToneBg(tone: string): ViewStyle {
  switch (tone) {
    case 'primary': return { backgroundColor: colors.primarySoft }
    case 'accent': return { backgroundColor: colors.accentSoft }
    case 'warning': return { backgroundColor: colors.warningSoft }
    case 'danger': return { backgroundColor: colors.dangerSoft }
    case 'purple': return { backgroundColor: colors.purpleSoft }
    case 'gold': return { backgroundColor: colors.goldSoft }
    default: return { backgroundColor: colors.surfaceAlt }
  }
}

function badgeToneText(tone: string): TextStyle {
  switch (tone) {
    case 'primary': return { color: colors.primary }
    case 'accent': return { color: colors.accent }
    case 'warning': return { color: colors.warning }
    case 'danger': return { color: colors.danger }
    case 'purple': return { color: colors.purple }
    case 'gold': return { color: colors.gold }
    default: return { color: colors.text }
  }
}

export function ProBadge() {
  return <Badge label="PRO" tone="gold" icon="✨" />
}

/* ────── Lists ────── */

export function EmptyState({ title, message, actionLabel, onAction, icon }: { title: string; message?: string; actionLabel?: string; onAction?: () => void; icon?: string }) {
  return (
    <View style={styles.empty}>
      {icon ? <Text style={styles.emptyIcon}>{icon}</Text> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}

export function ListItem({ title, subtitle, meta, onPress, right, tone, onDelete, onEdit, icon }: {
  title: string
  subtitle?: string
  meta?: string
  onPress?: () => void
  right?: ReactNode
  tone?: 'primary' | 'accent' | 'warning' | 'danger' | 'neutral' | 'purple'
  onDelete?: () => void
  onEdit?: () => void
  icon?: string
}) {
  const Wrap = onPress ? Pressable : View
  return (
    <Wrap onPress={onPress as any} style={({ pressed }: any) => [styles.listItem, pressed && onPress && styles.listItemPressed]}>
      {icon ? (
        <View style={[styles.listIconWrap, toneBg(tone)]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
      ) : (
        <View style={[styles.listDot, toneDot(tone)]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle} numberOfLines={3}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
        {(onEdit || onDelete) && (
          <View style={styles.listActions}>
            {onEdit && <Pressable onPress={onEdit} style={styles.listAction}><Text style={styles.listActionText}>Edit</Text></Pressable>}
            {onDelete && <Pressable onPress={onDelete} style={[styles.listAction, styles.listActionDanger]}><Text style={styles.listActionTextDanger}>Delete</Text></Pressable>}
          </View>
        )}
      </View>
      {right}
    </Wrap>
  )
}

function toneDot(tone?: string): ViewStyle {
  switch (tone) {
    case 'primary': return { backgroundColor: colors.primary }
    case 'accent': return { backgroundColor: colors.accent }
    case 'warning': return { backgroundColor: colors.warning }
    case 'danger': return { backgroundColor: colors.danger }
    case 'purple': return { backgroundColor: colors.purple }
    default: return { backgroundColor: colors.border }
  }
}

/* ────── Layout helpers ────── */

export function Divider() { return <View style={styles.divider} /> }

export function Row({ children, gap = 12, wrap, align }: { children: ReactNode; gap?: number; wrap?: boolean; align?: 'center' | 'flex-start' | 'flex-end' }) {
  return <View style={{ flexDirection: 'row', gap, flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: align || 'flex-start' }}>{children}</View>
}

export function Spacer({ size = 16 }: { size?: number }) {
  return <View style={{ height: size }} />
}

export function Banner({ text, tone = 'neutral', onDismiss, icon }: { text: string; tone?: 'neutral' | 'error' | 'success' | 'warning' | 'info'; onDismiss?: () => void; icon?: string }) {
  const bg = tone === 'error' ? colors.dangerSoft : tone === 'success' ? colors.successSoft : tone === 'warning' ? colors.warningSoft : tone === 'info' ? colors.infoSoft : colors.surfaceAlt
  const color = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : tone === 'info' ? colors.info : colors.text
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      {icon ? <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text> : null}
      <Text style={[styles.bannerText, { color, flex: 1 }]}>{text}</Text>
      {onDismiss ? <Pressable onPress={onDismiss} hitSlop={8}><Text style={[styles.bannerDismiss, { color }]}>✕</Text></Pressable> : null}
    </View>
  )
}

/* ────── Paywall overlay ────── */

export function PaywallGate({ children, locked, featureName, onUpgrade }: { children: ReactNode; locked: boolean; featureName: string; onUpgrade: () => void }) {
  if (!locked) return <>{children}</>
  return (
    <View style={styles.paywallWrap}>
      <View style={styles.paywallOverlay}>
        <Text style={styles.paywallIcon}>🔒</Text>
        <Text style={styles.paywallTitle}>{featureName}</Text>
        <Text style={styles.paywallMsg}>Upgrade to Premium to unlock this feature</Text>
        <GradientButton label="Upgrade Now" onPress={onUpgrade} icon="✨" />
      </View>
    </View>
  )
}

/* ────── Progress ────── */

export function ProgressBar({ progress, color, height = 8 }: { progress: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, progress))
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, height, borderRadius: height / 2, backgroundColor: color || colors.primary }]} />
    </View>
  )
}

/* ────── Skeleton loading ────── */

export function Skeleton({ width, height = 16, radius = 8 }: { width?: number | string; height?: number; radius?: number }) {
  return <View style={[styles.skeleton, { width: width as any || '100%', height, borderRadius: radius }]} />
}

/* ────── Styles ────── */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  contentFlush: { paddingBottom: 40 },

  // Hero
  heroCard: { borderRadius: radii.xxxl, padding: spacing.xxl, gap: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  heroIcon: { fontSize: 36 },
  heroTitle: { ...typography.h1, color: colors.text },
  heroSubtitle: { ...typography.body, color: colors.textMuted },

  // Cards
  card: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.xl, gap: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: radii.xxl, padding: spacing.xl, gap: spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}) },

  // Stats
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  statLabel: { ...typography.body, color: colors.textMuted },
  statValue: { ...typography.bodyBold, color: colors.text },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2 },
  metricTile: { borderRadius: radii.xl, padding: spacing.lg, minWidth: '47%', flexGrow: 1, gap: spacing.xs },
  metricIcon: { fontSize: 22 },
  metricValue: { ...typography.h2, color: colors.text },
  metricLabel: { ...typography.caption, color: colors.textMuted },

  // Buttons
  primaryButton: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.textInverse, ...typography.bodyBold },
  secondaryButton: { backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, paddingVertical: 14, paddingHorizontal: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.text, ...typography.bodyBold },
  ghostButton: { paddingVertical: spacing.md, paddingHorizontal: 14, alignItems: 'center' },
  ghostButtonText: { color: colors.primary, ...typography.bodyBold },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonSm: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: radii.md },
  buttonLg: { paddingVertical: 18, paddingHorizontal: spacing.xxl, borderRadius: radii.xl },

  // Form
  fieldWrap: { gap: spacing.xs + 2 },
  fieldLabel: { ...typography.caption, color: colors.text },
  fieldHelp: { ...typography.small, color: colors.textMuted },
  fieldError: { ...typography.small, color: colors.danger },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 14, backgroundColor: colors.surface },
  input: { flex: 1, paddingVertical: 12, ...typography.body, color: colors.text },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  inputDisabled: { backgroundColor: colors.surfaceAlt },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextActive: { color: colors.textInverse },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full, alignSelf: 'flex-start' },
  badgeText: { ...typography.tiny },

  // Empty
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h4, color: colors.text },
  emptyMessage: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  // List
  listItem: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  listItemPressed: { opacity: 0.7 },
  listDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  listIconWrap: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  listTitle: { ...typography.bodyBold, color: colors.text },
  listSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  listMeta: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  listActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 10 },
  listAction: { paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.surfaceAlt, borderRadius: radii.sm },
  listActionDanger: { backgroundColor: colors.dangerSoft },
  listActionText: { ...typography.small, fontWeight: '700', color: colors.text },
  listActionTextDanger: { ...typography.small, fontWeight: '700', color: colors.danger },

  // Divider & Banner
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.xs },
  banner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.lg },
  bannerText: { ...typography.caption },
  bannerDismiss: { fontSize: 16, fontWeight: '700', paddingLeft: 8 },

  // Paywall
  paywallWrap: { borderRadius: radii.xxl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  paywallOverlay: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl, backgroundColor: 'rgba(244,248,252,0.95)' },
  paywallIcon: { fontSize: 44 },
  paywallTitle: { ...typography.h3, color: colors.text },
  paywallMsg: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  // Progress
  progressTrack: { backgroundColor: colors.borderLight, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.primary },

  // Skeleton
  skeleton: { backgroundColor: colors.borderLight },
})
