import { Link, router } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, Field, GradientButton, SectionCard, Spacer } from '../../src/components/MobileUI'
import { useAuth } from '../../src/providers/AuthProvider'
import { useToast } from '../../src/providers/ToastProvider'
import { colors, typography, shadows, radii, spacing } from '../../src/theme/colors'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const toast = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({})

  const handleLogin = async () => {
    const nextErrors: typeof errors = {}
    if (!identifier.trim()) nextErrors.identifier = 'Enter email or mobile'
    if (!password) nextErrors.password = 'Enter password'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      await signIn({ identifier: identifier.trim(), password })
      router.replace('/(app)')
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppScreen>
      {/* Brand header */}
      <LinearGradient colors={['#2c73d9', '#4a90e8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandHeader}>
        <Text style={styles.brandIcon}>💙</Text>
        <Text style={styles.brandTitle}>HealthMap AI</Text>
        <Text style={styles.brandSub}>Your intelligent health companion</Text>
      </LinearGradient>

      <SectionCard>
        <Text style={styles.formTitle}>Welcome back</Text>
        <Text style={styles.formSub}>Sign in to continue your health journey</Text>
        <Spacer size={8} />
        <Field label="Email or mobile" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" placeholder="name@example.com" error={errors.identifier} icon="📧" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholder="Your password" error={errors.password} icon="🔒" />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.showPwRow}>
          <Text style={styles.showPwIcon}>{showPassword ? '🙈' : '👁'}</Text>
          <Text style={styles.showPwText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        </Pressable>
        <GradientButton label="Sign in" onPress={handleLogin} loading={submitting} icon="→" />
        <View style={styles.links}>
          <Link href="/(auth)/forgot" style={styles.link}>Forgot password?</Link>
          <Link href="/(auth)/otp" style={styles.link}>Use OTP</Link>
        </View>
      </SectionCard>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/signup" style={styles.footerLink}>Create one</Link>
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
  formSub: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  link: { ...typography.caption, color: colors.primary },
  showPwRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: -4 },
  showPwIcon: { fontSize: 14 },
  showPwText: { ...typography.caption, color: colors.primary },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: 8 },
  footerText: { ...typography.body, color: colors.textMuted },
  footerLink: { ...typography.bodyBold, color: colors.primary },
})
