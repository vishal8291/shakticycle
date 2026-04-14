import { Link, router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { AppScreen, Field, HeroCard, PrimaryButton, SectionCard, Banner } from '../../src/components/MobileUI'
import { useAuth } from '../../src/providers/AuthProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { isEmail } from '../../src/utils/validation'
import { colors } from '../../src/theme/colors'

export default function ForgotScreen() {
  const { forgotPassword, resetPassword } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const requestCode = async () => {
    if (!isEmail(email)) { toast.error('Enter a valid email'); return }
    setSubmitting(true)
    try {
      await forgotPassword(email.trim())
      setStep('reset')
      toast.success('Check your email for the reset code')
    } catch (err: any) {
      toast.error(err?.message || 'Could not send reset code')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReset = async () => {
    if (!code.trim()) { toast.error('Enter the code'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSubmitting(true)
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), password })
      toast.success('Password updated. Please sign in.')
      router.replace('/(auth)/login')
    } catch (err: any) {
      toast.error(err?.message || 'Could not reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppScreen>
      <HeroCard title="Reset password" subtitle="We will email you a 6-digit code to verify your identity." />
      {step === 'request' ? (
        <SectionCard title="Request a code">
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <PrimaryButton label="Send reset code" onPress={requestCode} loading={submitting} />
          <Text style={styles.footerText}><Link href="/(auth)/login" style={styles.link}>Back to sign in</Link></Text>
        </SectionCard>
      ) : (
        <SectionCard title="Enter code">
          <Banner tone="info" text="Check your email for the reset code" />
          <Field label="6-digit reset code" value={code} onChangeText={setCode} keyboardType="number-pad" />
          <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry help="Minimum 8 characters" />
          <PrimaryButton label="Update password" onPress={submitReset} loading={submitting} />
          <Text style={styles.footerText}><Link href="/(auth)/login" style={styles.link}>Back to sign in</Link></Text>
        </SectionCard>
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  footerText: { color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  link: { color: colors.primary, fontWeight: '700' },
})
