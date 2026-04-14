import { useEffect, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
// Brand icons rendered as styled badge Views (GH, in) since SVG isn't natively supported
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, Banner, GradientButton, PrimaryButton, SectionCard, SecondaryButton, StatRow, Badge, Spacer, ListItem } from '../../../src/components/MobileUI'
import { useAuth } from '../../../src/providers/AuthProvider'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useSubscription } from '../../../src/providers/SubscriptionProvider'
import { useToast } from '../../../src/providers/ToastProvider'
import { clearCache } from '../../../src/services/cache'
import { registerForPushNotifications, cancelAllReminders } from '../../../src/services/notifications'
import { API_URL } from '../../../src/services/api'
import { colors, typography, shadows, radii, spacing } from '../../../src/theme/colors'

export default function SettingsScreen() {
  const { signOut, token, user } = useAuth()
  const { reload, resetRecord, lastSyncedAt } = useRecord()
  const { subscription, isPremium } = useSubscription()
  const toast = useToast()
  const [permStatus, setPermStatus] = useState<string>('unknown')
  const [scheduled, setScheduled] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      try {
        const p = await Notifications.getPermissionsAsync()
        setPermStatus(p.status)
        const list = await Notifications.getAllScheduledNotificationsAsync()
        setScheduled(list.length)
      } catch { /* ignore */ }
    })()
  }, [])

  const enableNotifications = async () => {
    const tokenStr = await registerForPushNotifications(token)
    if (tokenStr) toast.success('Push notifications enabled')
    else toast.error('Could not enable push notifications')
    const p = await Notifications.getPermissionsAsync()
    setPermStatus(p.status)
  }

  const clearLocal = async () => {
    await clearCache()
    await cancelAllReminders()
    toast.success('Local cache cleared')
    await reload()
  }

  const confirmSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (confirm('This will permanently delete all your health data. Continue?')) {
        resetRecord().then(() => toast.success('Record reset')).catch(() => {})
      }
      return
    }
    Alert.alert('Reset Record', 'This will permanently delete all your health data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetRecord().then(() => toast.success('Record reset')).catch(() => {}) },
    ])
  }

  return (
    <AppScreen>
      {/* Account card */}
      <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.accountCard, shadows.md]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(user?.fullName || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.accountEmail}>{user?.email || ''}</Text>
        </View>
        <Badge label={isPremium ? 'Premium' : 'Free'} tone={isPremium ? 'gold' : 'neutral'} />
      </LinearGradient>

      {!isPremium && (
        <SectionCard>
          <View style={styles.upgradeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Unlock Premium</Text>
              <Text style={styles.upgradeSub}>AI Chat, unlimited reports, PDF export & more</Text>
            </View>
            <GradientButton label="Upgrade" onPress={() => router.push('/(app)/more/plans')} icon="✨" />
          </View>
        </SectionCard>
      )}

      <SectionCard title="Notifications">
        <StatRow label="Permission" value={permStatus === 'granted' ? '✅ Enabled' : '❌ Disabled'} icon="🔔" />
        <StatRow label="Scheduled reminders" value={String(scheduled)} icon="⏰" />
        {permStatus !== 'granted' ? (
          <PrimaryButton label="Enable notifications" onPress={enableNotifications} icon="🔔" />
        ) : (
          <Banner tone="success" text="Notifications are active" icon="✓" />
        )}
      </SectionCard>

      <SectionCard title="Data & Storage">
        <StatRow label="Last sync" value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'} icon="🔄" />
        <StatRow label="Server" value={API_URL.replace('http://', '').replace('/api', '')} icon="🌐" />
        <StatRow label="Plan" value={subscription?.plan || 'free'} icon="💎" />
        <Spacer size={8} />
        <SecondaryButton label="Clear local cache" onPress={clearLocal} icon="🗑" />
        <SecondaryButton label="Reset all health data" onPress={confirmReset} tone="danger" icon="⚠️" />
      </SectionCard>

      <SectionCard title="Account">
        <SecondaryButton label="Sign out" onPress={confirmSignOut} tone="danger" icon="🚪" />
      </SectionCard>

      <SectionCard title="About HealthMap AI">
        <StatRow label="App" value="HealthMap AI" icon="💙" />
        <StatRow label="Version" value="1.0.0 (Build 1)" icon="📦" />
        <StatRow label="Platform" value="Expo SDK 55 / React Native" icon="⚙️" />
        <StatRow label="Database" value="MongoDB Atlas" icon="🗄️" />
        <Spacer size={4} />
        <View style={styles.copyrightBox}>
          <Text style={styles.copyrightText}>Copyright {'\u00A9'} 2026 Vishal Tiwari.</Text>
          <Text style={styles.copyrightText}>All rights reserved. Made in India 🇮🇳</Text>
        </View>
      </SectionCard>

      <SectionCard title="Founder & Developer">
        <LinearGradient colors={colors.gradientDark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.founderCard}>
          <View style={styles.founderAvatar}>
            <Text style={styles.founderAvatarText}>VT</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.founderName}>Vishal Tiwari</Text>
            <Text style={styles.founderRole}>Founder & Lead Developer</Text>
          </View>
        </LinearGradient>
        <Spacer size={8} />
        <StatRow label="Contact" value="+91 8291569470" icon="📞" />
        <Pressable onPress={() => Linking.openURL('https://github.com/vishal8291/vishal8291')} style={styles.linkRow}>
          <View style={[styles.brandIconFallback, { backgroundColor: '#24292e' }]}>
            <Text style={styles.brandIconText}>GH</Text>
          </View>
          <Text style={styles.linkLabel}>GitHub</Text>
          <Text style={styles.linkValue}>github.com/vishal8291</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL('https://www.linkedin.com/in/vishal-tiwari-158a5216b')} style={styles.linkRow}>
          <View style={[styles.brandIconFallback, { backgroundColor: '#0A66C2' }]}><Text style={styles.brandIconText}>in</Text></View>
          <Text style={styles.linkLabel}>LinkedIn</Text>
          <Text style={styles.linkValue}>Vishal Tiwari</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Legal">
        <Pressable onPress={() => router.push('/(app)/more/terms')} style={styles.linkRow}>
          <Text style={{ fontSize: 18 }}>📜</Text>
          <Text style={styles.linkLabel}>Terms</Text>
          <Text style={styles.linkValue}>Terms & Conditions</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(app)/more/privacy')} style={styles.linkRow}>
          <Text style={{ fontSize: 18 }}>🔐</Text>
          <Text style={styles.linkLabel}>Privacy</Text>
          <Text style={styles.linkValue}>Privacy Policy</Text>
        </Pressable>
      </SectionCard>

      <Spacer size={20} />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.xl, borderRadius: radii.xxl },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  accountName: { ...typography.bodyBold, color: '#fff' },
  accountEmail: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  upgradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: { ...typography.h4, color: colors.text },
  upgradeSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  brandIconFallback: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  linkLabel: { ...typography.body, color: colors.textMuted, width: 70 },
  linkValue: { ...typography.bodyBold, color: colors.primary, flex: 1 },
  copyrightBox: { alignItems: 'center', paddingVertical: 12, gap: 2 },
  copyrightText: { ...typography.small, color: colors.textMuted, textAlign: 'center' },
  founderCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.lg, borderRadius: radii.xl },
  founderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  founderAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  founderName: { ...typography.h3, color: '#fff' },
  founderRole: { ...typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
})
