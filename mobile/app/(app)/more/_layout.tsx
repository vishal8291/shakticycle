import { Stack } from 'expo-router'
import { colors } from '../../../src/theme/colors'

export default function MoreStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'More', headerShown: false }} />
      <Stack.Screen name="daily-log" options={{ title: 'Daily Tracking' }} />
      <Stack.Screen name="plans" options={{ title: 'Subscription Plans' }} />
      <Stack.Screen name="vitals" options={{ title: 'Vitals' }} />
      <Stack.Screen name="medications" options={{ title: 'Medications' }} />
      <Stack.Screen name="consultations" options={{ title: 'Doctor visits' }} />
      <Stack.Screen name="emergency" options={{ title: 'Emergency card' }} />
      <Stack.Screen name="abdm" options={{ title: 'ABDM / ABHA' }} />
      <Stack.Screen name="insights" options={{ title: 'AI insights' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="ai-chat" options={{ title: 'AI Health Chat' }} />
      <Stack.Screen name="health-score" options={{ title: 'Health Score' }} />
      <Stack.Screen name="export" options={{ title: 'Export & Share' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="food-guide" options={{ title: 'Indian Food Guide' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
    </Stack>
  )
}
