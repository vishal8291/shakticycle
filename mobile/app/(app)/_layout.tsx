import { Tabs, Redirect } from 'expo-router'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../src/providers/AuthProvider'
import { colors, shadows } from '../../src/theme/colors'
import { useRegisterNotifications } from '../../src/hooks/useRegisterNotifications'
import { useAppointmentReminders } from '../../src/hooks/useAppointmentReminders'

const TABS = [
  { name: 'index', title: 'Home', icon: '🏠', iconActive: '🏠' },
  { name: 'reports', title: 'Reports', icon: '📄', iconActive: '📄' },
  { name: 'timeline', title: 'Timeline', icon: '🕐', iconActive: '🕐' },
  { name: 'appointments', title: 'Visits', icon: '📅', iconActive: '📅' },
  { name: 'more', title: 'More', icon: '☰', iconActive: '☰' },
]

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
      {focused && <View style={styles.dot} />}
    </View>
  )
}

export default function AppTabsLayout() {
  const { token, loading } = useAuth()
  useRegisterNotifications()
  useAppointmentReminders()

  if (loading) return null
  if (!token) return <Redirect href="/(auth)/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          ...shadows.sm,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => <TabIcon icon={focused ? tab.iconActive : tab.icon} focused={focused} />,
          }}
        />
      ))}
      {/* Hidden screens that exist in the (app) group but shouldn't show as tabs */}
      <Tabs.Screen name="insights" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 44, height: 32, borderRadius: 16 },
  iconWrapActive: { backgroundColor: colors.primarySoft },
  icon: { fontSize: 20, opacity: 0.55 },
  iconActive: { opacity: 1, fontSize: 22 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 2 },
})
