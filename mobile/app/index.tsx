import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../src/providers/AuthProvider'
import { colors } from '../src/theme/colors'

export default function Index() {
  const { token, loading } = useAuth()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((value) => {
      setOnboardingComplete(value === 'true')
      setOnboardingChecked(true)
    })
  }, [])

  if (loading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />
  }

  return <Redirect href={token ? '/(app)' : '/(auth)/login'} />
}
