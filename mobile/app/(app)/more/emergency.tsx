import { useEffect, useState } from 'react'
import { AppScreen, Field, PrimaryButton, SectionCard, Banner } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'

const EMPTY = {
  primaryContactName: '', primaryContactPhone: '',
  secondaryContactName: '', secondaryContactPhone: '',
  preferredHospital: '', insuranceProvider: '',
  allergiesNote: '', emergencyNotes: '',
}

export default function EmergencyScreen() {
  const { record, saving, loading, reload, putEmergency } = useRecord()
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    setForm({ ...EMPTY, ...(record.emergencyInfo || {}) })
  }, [record.emergencyInfo])

  const submit = async () => {
    try { await putEmergency(form) } catch { /* ignore */ }
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      <Banner tone="warning" text="This card shows contacts and medical info to emergency responders." />
      <SectionCard title="Primary contact">
        <Field label="Name" value={form.primaryContactName} onChangeText={(v) => setForm({ ...form, primaryContactName: v })} />
        <Field label="Phone" value={form.primaryContactPhone} onChangeText={(v) => setForm({ ...form, primaryContactPhone: v })} keyboardType="phone-pad" />
      </SectionCard>

      <SectionCard title="Secondary contact">
        <Field label="Name" value={form.secondaryContactName} onChangeText={(v) => setForm({ ...form, secondaryContactName: v })} />
        <Field label="Phone" value={form.secondaryContactPhone} onChangeText={(v) => setForm({ ...form, secondaryContactPhone: v })} keyboardType="phone-pad" />
      </SectionCard>

      <SectionCard title="Medical">
        <Field label="Preferred hospital" value={form.preferredHospital} onChangeText={(v) => setForm({ ...form, preferredHospital: v })} />
        <Field label="Insurance provider" value={form.insuranceProvider} onChangeText={(v) => setForm({ ...form, insuranceProvider: v })} />
        <Field label="Allergies" value={form.allergiesNote} onChangeText={(v) => setForm({ ...form, allergiesNote: v })} multiline />
        <Field label="Notes for responders" value={form.emergencyNotes} onChangeText={(v) => setForm({ ...form, emergencyNotes: v })} multiline />
      </SectionCard>

      <PrimaryButton label="Save emergency card" onPress={submit} loading={saving} />
    </AppScreen>
  )
}
