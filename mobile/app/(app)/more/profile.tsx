import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, Banner, Field, GradientButton, PrimaryButton, SectionCard, SecondaryButton, SelectChips, StatRow, Spacer, ProgressBar, Badge } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useAuth } from '../../../src/providers/AuthProvider'
import { useSubscription } from '../../../src/providers/SubscriptionProvider'
import { useToast } from '../../../src/providers/ToastProvider'
import { colors, typography, shadows, radii, spacing } from '../../../src/theme/colors'

const SEX_OPTIONS = ['Female', 'Male', 'Other', 'Prefer not to say']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']

const EMPTY = {
  name: '', dob: '', sex: '', age: '', bloodGroup: '',
  height: '', weight: '',
  primaryDoctor: '', doctorPhone: '', emergencyContact: '', emergencyPhone: '',
  conditionsText: '', allergiesText: '', activityLevel: '',
}

function calculateBmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return null
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10
}

function bmiCategory(bmi: number | null) {
  if (!bmi) return { label: 'Unknown', color: colors.textMuted }
  if (bmi < 18.5) return { label: 'Underweight', color: colors.info }
  if (bmi < 25) return { label: 'Normal', color: colors.success }
  if (bmi < 30) return { label: 'Overweight', color: colors.warning }
  return { label: 'Obese', color: colors.danger }
}

function calculateAge(dob: string): number {
  if (!dob) return 0
  const d = new Date(dob)
  if (isNaN(d.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

function profileCompleteness(form: typeof EMPTY, record: any): number {
  let total = 0
  let filled = 0
  const checks = [
    form.name, form.dob, form.sex, form.bloodGroup,
    form.height, form.weight, form.primaryDoctor,
    form.emergencyContact, form.conditionsText || '(none)',
    form.allergiesText || '(none)',
  ]
  total = checks.length
  filled = checks.filter(v => v && v.trim() !== '' && v !== '(none)').length
  // Bonus for having health data
  if ((record.vitals || []).length > 0) filled += 0.5
  if ((record.reports || []).length > 0) filled += 0.5
  return Math.min(Math.round((filled / total) * 100), 100)
}

export default function ProfileScreen() {
  const { record, saving, loading, reload, putPatient } = useRecord()
  const { user } = useAuth()
  const { isPremium, plan } = useSubscription()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const p = record.patient || {} as any
    setForm({
      name: p.name || '',
      dob: p.dob || '',
      sex: p.sex || '',
      age: p.age ? String(p.age) : '',
      bloodGroup: p.bloodGroup || '',
      height: p.height ? String(p.height) : '',
      weight: p.weight ? String(p.weight) : '',
      primaryDoctor: p.primaryDoctor || '',
      doctorPhone: p.doctorPhone || '',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || '',
      conditionsText: (p.conditions || []).join(', '),
      allergiesText: (p.allergies || []).join(', '),
      activityLevel: p.activityLevel || '',
    })
  }, [record.patient])

  const bmi = useMemo(() => calculateBmi(Number(form.weight), Number(form.height)), [form.weight, form.height])
  const bmiInfo = useMemo(() => bmiCategory(bmi), [bmi])
  const autoAge = useMemo(() => calculateAge(form.dob), [form.dob])
  const completeness = useMemo(() => profileCompleteness(form, record), [form, record])

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const payload: any = {
      name: form.name.trim(),
      dob: form.dob.trim(),
      sex: form.sex,
      age: autoAge || Number(form.age) || 0,
      bloodGroup: form.bloodGroup,
      height: Number(form.height) || 0,
      weight: Number(form.weight) || 0,
      primaryDoctor: form.primaryDoctor.trim(),
      doctorPhone: form.doctorPhone.trim(),
      emergencyContact: form.emergencyContact.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      conditions: form.conditionsText.split(',').map((s) => s.trim()).filter(Boolean),
      allergies: form.allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
      activityLevel: form.activityLevel,
    }
    try {
      await putPatient(payload)
      setEditing(false)
      toast.success('Profile saved')
    } catch { toast.error('Failed to save profile') }
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      {/* Profile Header Card */}
      <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.headerCard, shadows.md]}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{(form.name || user?.fullName || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.headerName}>{form.name || user?.fullName || 'Your Name'}</Text>
        <Text style={styles.headerEmail}>{user?.email || ''}</Text>
        <View style={styles.headerBadges}>
          <Badge label={isPremium ? 'Premium' : 'Free Plan'} tone={isPremium ? 'gold' : 'neutral'} />
          {form.bloodGroup ? <Badge label={form.bloodGroup} tone="primary" /> : null}
          {autoAge ? <Badge label={`${autoAge} yrs`} tone="neutral" /> : null}
        </View>
      </LinearGradient>

      {/* Profile Completeness */}
      <SectionCard>
        <View style={styles.completenessRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.completenessTitle}>Profile Completeness</Text>
            <Text style={styles.completenessSub}>
              {completeness >= 80 ? 'Great! Your profile is well-filled' : completeness >= 50 ? 'Good start — fill more for better insights' : 'Complete your profile for personalized AI advice'}
            </Text>
          </View>
          <View style={styles.completenessCircle}>
            <Text style={[styles.completenessPercent, { color: completeness >= 80 ? colors.success : completeness >= 50 ? colors.warning : colors.danger }]}>{completeness}%</Text>
          </View>
        </View>
        <ProgressBar
          progress={completeness / 100}
          color={completeness >= 80 ? colors.success : completeness >= 50 ? colors.warning : colors.primary}
          height={8}
        />
      </SectionCard>

      {/* BMI Card */}
      {bmi && (
        <SectionCard>
          <View style={styles.bmiCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bmiLabel}>Body Mass Index (BMI)</Text>
              <View style={styles.bmiRow}>
                <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmi}</Text>
                <Badge label={bmiInfo.label} tone={bmi < 25 && bmi >= 18.5 ? 'success' : 'warning'} />
              </View>
              <Text style={styles.bmiRange}>Healthy range: 18.5 - 24.9</Text>
            </View>
            <Text style={styles.bmiIcon}>⚖️</Text>
          </View>
        </SectionCard>
      )}

      {/* Quick Stats */}
      <SectionCard title="Health Summary">
        <View style={styles.statsGrid}>
          <StatPill icon="📄" label="Reports" value={String(record.reports?.length || 0)} />
          <StatPill icon="💊" label="Medications" value={String(record.medications?.length || 0)} />
          <StatPill icon="💓" label="Vitals" value={String(record.vitals?.length || 0)} />
          <StatPill icon="📅" label="Visits" value={String(record.appointments?.length || 0)} />
        </View>
      </SectionCard>

      {/* Account Info */}
      <SectionCard title="Account">
        <StatRow label="Email" value={user?.email || '—'} icon="📧" />
        {user?.mobileNumber ? <StatRow label="Mobile" value={user.mobileNumber} icon="📱" /> : null}
        <StatRow label="Plan" value={plan || 'free'} icon="💎" />
        <StatRow label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'} icon="📅" />
      </SectionCard>

      {/* Personal Information */}
      <SectionCard title="Personal Information" action={
        !editing ? <SecondaryButton label="Edit" onPress={() => setEditing(true)} icon="✏️" /> : null
      }>
        {!editing ? (
          <>
            <StatRow label="Full name" value={form.name || '—'} />
            <StatRow label="Date of birth" value={form.dob || '—'} />
            <StatRow label="Age" value={autoAge ? `${autoAge} years` : form.age ? `${form.age} years` : '—'} />
            <StatRow label="Sex" value={form.sex || '—'} />
            <StatRow label="Blood group" value={form.bloodGroup || '—'} />
            <StatRow label="Height" value={form.height ? `${form.height} cm` : '—'} />
            <StatRow label="Weight" value={form.weight ? `${form.weight} kg` : '—'} />
            <StatRow label="Activity level" value={form.activityLevel || '—'} />
          </>
        ) : (
          <>
            <Field label="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Your full name" />
            <Field label="Date of birth" value={form.dob} onChangeText={(v) => setForm({ ...form, dob: v })} placeholder="YYYY-MM-DD" />
            {autoAge > 0 && <Banner tone="info" text={`Auto-calculated age: ${autoAge} years`} icon="🎂" />}
            <Field label="Age (if no DOB)" value={form.age} onChangeText={(v) => setForm({ ...form, age: v })} keyboardType="number-pad" placeholder="e.g. 28" />
            <Text style={styles.chipLabel}>Sex</Text>
            <SelectChips options={SEX_OPTIONS} value={form.sex} onChange={(v) => setForm({ ...form, sex: v })} />
            <Text style={styles.chipLabel}>Blood Group</Text>
            <SelectChips options={BLOOD_GROUPS} value={form.bloodGroup} onChange={(v) => setForm({ ...form, bloodGroup: v })} />
            <Field label="Height (cm)" value={form.height} onChangeText={(v) => setForm({ ...form, height: v })} keyboardType="number-pad" placeholder="e.g. 175" />
            <Field label="Weight (kg)" value={form.weight} onChangeText={(v) => setForm({ ...form, weight: v })} keyboardType="number-pad" placeholder="e.g. 70" />
            <Text style={styles.chipLabel}>Activity Level</Text>
            <SelectChips options={ACTIVITY_LEVELS} value={form.activityLevel} onChange={(v) => setForm({ ...form, activityLevel: v })} />
          </>
        )}
      </SectionCard>

      {/* Medical Care */}
      <SectionCard title="Medical Care">
        {!editing ? (
          <>
            <StatRow label="Primary doctor" value={form.primaryDoctor || '—'} icon="🩺" />
            <StatRow label="Doctor's phone" value={form.doctorPhone || '—'} icon="📞" />
            <StatRow label="Emergency contact" value={form.emergencyContact || '—'} icon="🚨" />
            <StatRow label="Emergency phone" value={form.emergencyPhone || '—'} icon="📱" />
            <StatRow label="Conditions" value={form.conditionsText || 'None listed'} icon="🏥" />
            <StatRow label="Allergies" value={form.allergiesText || 'None listed'} icon="⚠️" />
          </>
        ) : (
          <>
            <Field label="Primary doctor" value={form.primaryDoctor} onChangeText={(v) => setForm({ ...form, primaryDoctor: v })} placeholder="Dr. name" />
            <Field label="Doctor's phone" value={form.doctorPhone} onChangeText={(v) => setForm({ ...form, doctorPhone: v })} placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" />
            <Field label="Emergency contact name" value={form.emergencyContact} onChangeText={(v) => setForm({ ...form, emergencyContact: v })} placeholder="Family member name" />
            <Field label="Emergency phone" value={form.emergencyPhone} onChangeText={(v) => setForm({ ...form, emergencyPhone: v })} placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" />
            <Field label="Medical conditions" value={form.conditionsText} onChangeText={(v) => setForm({ ...form, conditionsText: v })} multiline placeholder="Diabetes, Hypertension, etc." />
            <Banner tone="neutral" text="Separate multiple conditions with commas" />
            <Field label="Allergies" value={form.allergiesText} onChangeText={(v) => setForm({ ...form, allergiesText: v })} multiline placeholder="Penicillin, Dust, etc." />
          </>
        )}
      </SectionCard>

      {editing && (
        <View style={styles.buttonRow}>
          <SecondaryButton label="Cancel" onPress={() => setEditing(false)} />
          <GradientButton label="Save Profile" onPress={submit} loading={saving} icon="✓" />
        </View>
      )}

      {/* App info footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>HealthMap AI v1.0.0</Text>
        <Text style={styles.footerText}>Copyright 2026 Vishal Tiwari. All rights reserved.</Text>
      </View>

      <Spacer size={24} />
    </AppScreen>
  )
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillIcon}>{icon}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  // Header card
  headerCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderRadius: radii.xxl, gap: 6 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarLargeText: { color: '#fff', fontSize: 34, fontWeight: '900' },
  headerName: { ...typography.h1, color: '#fff' },
  headerEmail: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  headerBadges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },

  // Completeness
  completenessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  completenessTitle: { ...typography.h4, color: colors.text },
  completenessSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  completenessCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  completenessPercent: { fontSize: 16, fontWeight: '800' },

  // BMI
  bmiCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bmiLabel: { ...typography.caption, color: colors.textMuted },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  bmiValue: { fontSize: 32, fontWeight: '900' },
  bmiRange: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  bmiIcon: { fontSize: 40 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statPill: { flex: 1, minWidth: '45%', backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, padding: 14, alignItems: 'center', gap: 4 },
  statPillIcon: { fontSize: 22 },
  statPillValue: { ...typography.h2, color: colors.text },
  statPillLabel: { ...typography.small, color: colors.textMuted },

  // Chips
  chipLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 12, marginBottom: 4 },

  // Buttons
  buttonRow: { flexDirection: 'row', gap: 12 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  footerText: { ...typography.tiny, color: colors.textMuted },
})
