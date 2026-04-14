import { Link, router } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, Field, GradientButton, SectionCard, Spacer } from '../../src/components/MobileUI'
import { useAuth } from '../../src/providers/AuthProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { isEmail, isMobile, passwordStrength } from '../../src/utils/validation'
import { colors, typography, shadows, radii, spacing } from '../../src/theme/colors'

export default function SignupScreen() {
  const { signUp } = useAuth()
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSignup = async () => {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Enter your name'
    if (!isEmail(email)) next.email = 'Enter a valid email'
    if (mobileNumber && !isMobile(mobileNumber)) next.mobileNumber = 'Enter a valid mobile number'
    if (password.length < 8) next.password = 'At least 8 characters'
    if (!agreedTerms) next.terms = 'Please accept the Terms & Conditions'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      await signUp({ fullName: fullName.trim(), email: email.trim(), mobileNumber: mobileNumber.trim(), password })
      router.replace('/(app)')
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign up')
    } finally {
      setSubmitting(false)
    }
  }

  const strength = password ? passwordStrength(password) : null
  const strengthColor = strength === 'strong' ? colors.success : strength === 'medium' ? colors.warning : colors.danger

  return (
    <AppScreen>
      <LinearGradient colors={['#4ebd95', '#6dd5ab']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandHeader}>
        <Text style={styles.brandIcon}>🌿</Text>
        <Text style={styles.brandTitle}>Join HealthMap</Text>
        <Text style={styles.brandSub}>Start your health journey in under a minute</Text>
      </LinearGradient>

      <SectionCard>
        <Text style={styles.formTitle}>Create account</Text>
        <Spacer size={4} />
        <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={errors.fullName} icon="👤" placeholder="Your full name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} icon="📧" placeholder="name@example.com" />
        <Field label="Mobile (optional)" value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" error={errors.mobileNumber} help="For OTP login and reminders" icon="📱" placeholder="+91 9876543210" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} icon="🔒" placeholder="Min 8 characters" help={strength ? `Strength: ${strength}` : 'Minimum 8 characters'} />
        {strength && (
          <View style={styles.strengthBar}>
            <View style={[styles.strengthFill, { width: strength === 'strong' ? '100%' : strength === 'medium' ? '60%' : '30%', backgroundColor: strengthColor }]} />
          </View>
        )}
        {/* Terms checkbox */}
        <Pressable onPress={() => setAgreedTerms(!agreedTerms)} style={styles.termsRow}>
          <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
            {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/(app)/more/terms' as any)}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={styles.termsLink} onPress={() => router.push('/(app)/more/privacy' as any)}>Privacy Policy</Text>
          </Text>
        </Pressable>
        {errors.terms ? <Text style={styles.termsError}>{errors.terms}</Text> : null}

        <GradientButton label="Create account" onPress={handleSignup} loading={submitting} colors={colors.gradientAccent} icon="✓" />
      </SectionCard>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already a member? </Text>
        <Link href="/(auth)/login" style={styles.footerLink}>Sign in</Link>
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  brandHeader: { alignItems: 'center', padding: spacing.xxl, borderRadius: radii.xxxl, gap: 6, ...shadows.lg },
  brandIcon: { fontSize: 44 },
  brandTitle: { ...typography.h1, color: '#fff' },
  brandSub: { ...typography.body, color: 'rgba(255,255,255,0.85)' },
  formTitle: { ...typography.h2, color: colors.text },
  strengthBar: { height: 4, backgroundColor: colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: 4, borderRadius: 2 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  termsText: { ...typography.small, color: colors.textMuted, flex: 1, lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: '700' },
  termsError: { ...typography.small, color: colors.danger, marginTop: -4 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 8 },
  footerText: { ...typography.body, color: colors.textMuted },
  footerLink: { ...typography.bodyBold, color: colors.primary },
})
