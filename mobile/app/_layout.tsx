import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/providers/AuthProvider'
import { SubscriptionProvider } from '../src/providers/SubscriptionProvider'
import { DailyLogProvider } from '../src/providers/DailyLogProvider'
import { RecordProvider } from '../src/providers/RecordProvider'
import { ToastProvider } from '../src/providers/ToastProvider'
import { ErrorBoundary } from '../src/components/ErrorBoundary'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <SubscriptionProvider>
            <RecordProvider>
              <DailyLogProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
              </DailyLogProvider>
            </RecordProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
