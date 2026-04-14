const ABDM_MODE = (process.env.ABDM_MODE || 'demo').toLowerCase()
const ABDM_BASE_URL = process.env.ABDM_BASE_URL || ''
const ABDM_CLIENT_ID = process.env.ABDM_CLIENT_ID || ''
const ABDM_CLIENT_SECRET = process.env.ABDM_CLIENT_SECRET || ''
const ABDM_HIU_ID = process.env.ABDM_HIU_ID || ''
const ABDM_CM_ID = process.env.ABDM_CM_ID || ''

function getMissingSandboxConfig() {
  return [
    ['ABDM_BASE_URL', ABDM_BASE_URL],
    ['ABDM_CLIENT_ID', ABDM_CLIENT_ID],
    ['ABDM_CLIENT_SECRET', ABDM_CLIENT_SECRET],
    ['ABDM_HIU_ID', ABDM_HIU_ID],
    ['ABDM_CM_ID', ABDM_CM_ID],
  ].filter(([, value]) => !value).map(([label]) => label)
}

function hasSandboxConfig() {
  return getMissingSandboxConfig().length === 0
}

export function getAbdmRuntime() {
  return {
    mode: ABDM_MODE,
    configured: hasSandboxConfig(),
    baseUrl: ABDM_BASE_URL,
    hiuId: ABDM_HIU_ID,
    consentManagerId: ABDM_CM_ID,
    missingConfig: getMissingSandboxConfig(),
  }
}

export function assertSandboxReady() {
  if (ABDM_MODE !== 'sandbox') return
  if (!hasSandboxConfig()) {
    throw new Error(`ABDM sandbox configuration is incomplete. Missing: ${getMissingSandboxConfig().join(', ')}.`)
  }
}

export function buildDemoCareContexts(patient) {
  const displayName = patient.name || 'Patient'
  return [
    {
      id: Date.now(),
      referenceNumber: 'cc-lab-001',
      display: `${displayName} | Diagnostic Center`,
      hiType: 'DiagnosticReport',
      provider: 'ABDM-linked Diagnostic Center',
      status: 'Discovered',
    },
    {
      id: Date.now() + 1,
      referenceNumber: 'cc-opd-002',
      display: `${displayName} | OPD Visit`,
      hiType: 'OPConsultation',
      provider: 'ABDM-linked Hospital',
      status: 'Discovered',
    },
  ]
}

export function buildDemoConsentRequest(patient, careContexts) {
  const timestamp = new Date().toISOString()
  return {
    id: Date.now(),
    purpose: 'Care management',
    requester: 'HealthMap HIU',
    status: 'Requested',
    createdAt: timestamp,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    abhaAddress: patient.abhaAddress || '',
    careContextReferences: careContexts.map((item) => item.referenceNumber),
  }
}

export function buildDemoImportedRecords() {
  return [
    {
      id: Date.now(),
      source: 'ABDM',
      category: 'Lab report',
      title: 'Imported CBC Report',
      provider: 'ABDM-linked Diagnostic Center',
      date: '2026-03-18',
      status: 'Imported',
      referenceId: 'abdm-demo-cbc',
      summary: 'Imported placeholder record for future consent-based ABDM integration.',
    },
    {
      id: Date.now() + 1,
      source: 'ABDM',
      category: 'Prescription',
      title: 'Imported Prescription Summary',
      provider: 'ABDM-linked Hospital',
      date: '2026-03-12',
      status: 'Imported',
      referenceId: 'abdm-demo-rx',
      summary: 'Sample imported prescription entry showing how connected records will appear.',
    },
  ]
}

export async function discoverCareContexts(patient) {
  if (ABDM_MODE === 'demo') return buildDemoCareContexts(patient)
  assertSandboxReady()
  throw new Error('Sandbox ABDM discovery is not wired yet. Add the ABDM gateway request implementation in server/services/abdmService.js.')
}

export async function createConsentRequest(patient, careContexts) {
  if (ABDM_MODE === 'demo') return buildDemoConsentRequest(patient, careContexts)
  assertSandboxReady()
  throw new Error('Sandbox ABDM consent creation is not wired yet. Add the consent manager request implementation in server/services/abdmService.js.')
}

export async function importConsentedRecords() {
  if (ABDM_MODE === 'demo') return buildDemoImportedRecords()
  assertSandboxReady()
  throw new Error('Sandbox ABDM record fetch is not wired yet. Add the HIU fetch implementation in server/services/abdmService.js.')
}