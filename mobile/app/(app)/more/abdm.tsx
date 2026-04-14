import { useState } from 'react'
import { AppScreen, Badge, Banner, EmptyState, Field, ListItem, PrimaryButton, SectionCard, StatRow } from '../../../src/components/MobileUI'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useToast } from '../../../src/providers/ToastProvider'
import { formatDate } from '../../../src/utils/date'

export default function AbdmScreen() {
  const { record, saving, loading, reload, abdmStatus, connectAbha, discoverCareContexts, requestConsent, approveDemoConsent, importAbdm } = useRecord()
  const toast = useToast()
  const patient = record.patient || {}
  const [form, setForm] = useState({ abhaNumber: patient.abhaNumber || '', abhaAddress: patient.abhaAddress || '' })

  const linked = !!patient.abdmLinked
  const careContexts = record.careContexts || []
  const consents = record.consentRequests || []
  const imported = record.importedRecords || []

  const connect = async () => {
    if (!form.abhaNumber.trim() || !form.abhaAddress.trim()) { toast.error('Enter ABHA number and address'); return }
    try { await connectAbha({ abhaNumber: form.abhaNumber.trim(), abhaAddress: form.abhaAddress.trim() }) } catch { /* ignore */ }
  }

  return (
    <AppScreen refreshing={loading} onRefresh={reload}>
      {abdmStatus ? (
        <SectionCard title="ABDM status" subtitle={`Mode: ${abdmStatus.mode}`}>
          <StatRow label="Configured" value={abdmStatus.configured ? 'Yes' : 'No'} />
          {abdmStatus.missingConfig && abdmStatus.missingConfig.length > 0 ? (
            <Banner tone="warning" text={`Missing config: ${abdmStatus.missingConfig.join(', ')}`} />
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Step 1 · Connect ABHA" subtitle="Link your ABHA identity locally.">
        <Field label="ABHA number" value={form.abhaNumber} onChangeText={(v) => setForm({ ...form, abhaNumber: v })} placeholder="12-3456-7890-1234" />
        <Field label="ABHA address" value={form.abhaAddress} onChangeText={(v) => setForm({ ...form, abhaAddress: v })} placeholder="name@abdm" autoCapitalize="none" />
        <PrimaryButton label={linked ? 'Update ABHA' : 'Connect ABHA'} onPress={connect} loading={saving} />
        <StatRow label="Status" value={patient.consentStatus || 'Not connected'} />
      </SectionCard>

      <SectionCard title="Step 2 · Discover care contexts">
        <PrimaryButton label="Find records" onPress={() => discoverCareContexts().catch(() => {})} loading={saving} disabled={!linked} />
        {careContexts.length === 0 ? (
          <EmptyState title="No care contexts" message="Connect ABHA first, then discover linked health records." />
        ) : careContexts.map((c: any) => (
          <ListItem key={c.id} title={c.display} subtitle={`${c.hiType || '—'} · ${c.provider || '—'}`} meta={c.status} tone="primary" right={<Badge label={c.status} tone="primary" />} />
        ))}
      </SectionCard>

      <SectionCard title="Step 3 · Request consent">
        <PrimaryButton label="Request consent" onPress={() => requestConsent().catch(() => {})} loading={saving} disabled={careContexts.length === 0} />
        {consents.length === 0 ? (
          <EmptyState title="No consent requests" message="Request consent to fetch discovered records." />
        ) : consents.map((c: any) => (
          <ListItem key={c.id} title={c.purpose} subtitle={`${c.requester} · ${c.status}`} meta={`Created ${formatDate(c.createdAt)}${c.expiresAt ? ' · expires ' + formatDate(c.expiresAt) : ''}`} tone={c.status === 'Approved' ? 'accent' : 'warning'} right={<Badge label={c.status} tone={c.status === 'Approved' ? 'accent' : 'warning'} />} />
        ))}
      </SectionCard>

      <SectionCard title="Step 4 · Approve & import">
        <PrimaryButton label="Approve Consent" onPress={() => approveDemoConsent().catch(() => {})} loading={saving} disabled={consents.length === 0} />
        <PrimaryButton label="Import records" onPress={() => importAbdm().catch(() => {})} loading={saving} disabled={!consents.some((c: any) => c.status === 'Approved')} />
      </SectionCard>

      <SectionCard title="Imported records">
        {imported.length === 0 ? (
          <EmptyState title="Nothing imported" message="Approved consent brings records into your HealthMap." />
        ) : imported.map((r: any) => (
          <ListItem key={r.id} title={r.title} subtitle={`${r.category} · ${r.provider || '—'}`} meta={`${formatDate(r.date)} · ${r.source}`} tone="accent" />
        ))}
      </SectionCard>
    </AppScreen>
  )
}
