import { Link, router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { AppScreen, Field, HeroCard, PrimaryButton, SectionCard, Banner } from '../../src/components/MobileUI'
import { useAuth } from '../../src/providers/AuthProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { isMobile } from '../../src/utils/validation'
import { colors } from '../../src/theme/colors'

export default function OtpScreen() {
  const { requestMobileOtp, verifyMobileOtp } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const request = async () => {
    if (!isMobile(mobile)) { toast.error('Enter a valid mobile number'); return }
    setSubmitting(true)
    try {
      await requestMobileOtp(mobile.trim())
      setStep('verify')
      toast.success('Check your phone for the OTP')
    } catch (err: any) {
      toast.error(err?.message || 'Could not send OTP')
    } finally {
      setSubmitting(false)
    }
  }

  const verify = async () => {
    if (!code.trim()) { toast.error('Enter the code'); return }
    setSubmitting(true)
    try {
      await verifyMobileOtp({ mobileNumber: mobile.trim(), code: code.trim() })
      router.replace('/(app)')
    } catch (err: any) {
      toast.error(err?.message || 'Could not verify OTP')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppScreen>
      <HeroCard title="Mobile OTP" subtitle="Sign in quickly with a one-time password." />
      {step === 'request' ? (
        <SectionCard title="Your number">
          <Field label="Mobile number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="+91 98765 43210" />
          <PrimaryButton label="Send OTP" onPress={request} loading={submitting} />
          <Text style={styles.footerText}><Link href="/(auth)/login" style={styles.link}>Use password instead</Link></Text>
        </SectionCard>
      ) : (
        <SectionCard title="Verify OTP">
          <Banner tone="info" text="Check your phone for the OTP" />
          <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" />
          <PrimaryButton label="Verify & sign in" onPress={verify} loading={submitting} />
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
