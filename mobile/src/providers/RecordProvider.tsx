import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, apiRequest } from '../services/api'
import { readCache, writeCache, cachedAt } from '../services/cache'
import { useAuth } from './AuthProvider'
import { useToast } from './ToastProvider'

export type HealthRecord = {
  patient: any
  emergencyInfo: any
  timeline: any[]
  reports: any[]
  medications: any[]
  consultations: any[]
  appointments: any[]
  vitals: any[]
  importedRecords: any[]
  careContexts: any[]
  consentRequests: any[]
}

const EMPTY: HealthRecord = {
  patient: { name: '', conditions: [], allergies: [], consentStatus: 'Not connected' },
  emergencyInfo: {},
  timeline: [],
  reports: [],
  medications: [],
  consultations: [],
  appointments: [],
  vitals: [],
  importedRecords: [],
  careContexts: [],
  consentRequests: [],
}

type AbdmStatus = { mode: string; configured: boolean; baseUrl?: string; hiuId?: string; consentManagerId?: string; missingConfig?: string[] }

type RecordContextValue = {
  record: HealthRecord
  loading: boolean
  saving: boolean
  offline: boolean
  lastSyncedAt: number | null
  abdmStatus: AbdmStatus | null
  reload: () => Promise<void>
  // CRUD helpers (each returns the updated record or throws)
  putPatient: (payload: any) => Promise<void>
  putEmergency: (payload: any) => Promise<void>
  addTimeline: (payload: any) => Promise<void>
  updateTimeline: (id: number, payload: any) => Promise<void>
  deleteTimeline: (id: number) => Promise<void>
  addReport: (payload: any) => Promise<void>
  uploadReport: (payload: any, file: { uri: string; name: string; type: string } | null) => Promise<void>
  updateReport: (id: number, payload: any) => Promise<void>
  deleteReport: (id: number) => Promise<void>
  rebuildAi: () => Promise<void>
  addVital: (payload: any) => Promise<void>
  updateVital: (id: number, payload: any) => Promise<void>
  deleteVital: (id: number) => Promise<void>
  addAppointment: (payload: any) => Promise<void>
  updateAppointment: (id: number, payload: any) => Promise<void>
  deleteAppointment: (id: number) => Promise<void>
  addMedication: (payload: any) => Promise<void>
  updateMedication: (id: number, payload: any) => Promise<void>
  deleteMedication: (id: number) => Promise<void>
  addConsultation: (payload: any) => Promise<void>
  updateConsultation: (id: number, payload: any) => Promise<void>
  deleteConsultation: (id: number) => Promise<void>
  connectAbha: (payload: { abhaNumber: string; abhaAddress: string }) => Promise<void>
  discoverCareContexts: () => Promise<void>
  requestConsent: () => Promise<void>
  approveDemoConsent: () => Promise<void>
  importAbdm: () => Promise<void>
  resetRecord: () => Promise<void>
}

const RecordContext = createContext<RecordContextValue | null>(null)

const CACHE_KEY = 'record'
const ABDM_CACHE_KEY = 'abdm-status'

export function RecordProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const toast = useToast()
  const [record, setRecord] = useState<HealthRecord>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [offline, setOffline] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [abdmStatus, setAbdmStatus] = useState<AbdmStatus | null>(null)

  // Hydrate from cache on token change.
  useEffect(() => {
    if (!token) {
      setRecord(EMPTY)
      setLoading(false)
      return
    }
    let mounted = true
    ;(async () => {
      const cached = await readCache<HealthRecord>(CACHE_KEY)
      const cachedAbdm = await readCache<AbdmStatus>(ABDM_CACHE_KEY)
      const savedAt = await cachedAt(CACHE_KEY)
      if (mounted && cached) {
        setRecord({ ...EMPTY, ...cached })
        setLastSyncedAt(savedAt)
      }
      if (mounted && cachedAbdm) setAbdmStatus(cachedAbdm)
      await reload()
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const applyRecord = useCallback(async (next: any) => {
    const merged = { ...EMPTY, ...next }
    setRecord(merged)
    setOffline(false)
    setLastSyncedAt(Date.now())
    await writeCache(CACHE_KEY, merged)
  }, [])

  const reload = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [rec, abdm] = await Promise.all([
        apiRequest<HealthRecord>('/record', {}, token),
        apiRequest<{ abdm: AbdmStatus }>('/abdm/status', {}, token).catch(() => ({ abdm: null as any })),
      ])
      await applyRecord(rec)
      if (abdm?.abdm) {
        setAbdmStatus(abdm.abdm)
        await writeCache(ABDM_CACHE_KEY, abdm.abdm)
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.offline) {
        setOffline(true)
        toast.info('Offline — showing cached data')
      } else {
        toast.error(err?.message || 'Could not load record')
      }
    } finally {
      setLoading(false)
    }
  }, [token, applyRecord, toast])

  // Generic mutation wrapper
  const run = useCallback(async (fn: () => Promise<any>, successMessage?: string) => {
    if (!token) throw new Error('Not signed in')
    setSaving(true)
    try {
      const next = await fn()
      if (next) await applyRecord(next)
      if (successMessage) toast.success(successMessage)
    } catch (err: any) {
      if (err instanceof ApiError && err.offline) {
        toast.error('You are offline. Changes not saved.')
      } else {
        toast.error(err?.message || 'Could not save')
      }
      throw err
    } finally {
      setSaving(false)
    }
  }, [token, applyRecord, toast])

  // Helpers per entity -------------------------------------------------------
  const putPatient = (payload: any) => run(() => apiRequest('/patient', { method: 'PUT', body: JSON.stringify(payload) }, token), 'Profile saved')
  const putEmergency = (payload: any) => run(() => apiRequest('/emergency-info', { method: 'PUT', body: JSON.stringify(payload) }, token), 'Emergency card saved')

  const addTimeline = (payload: any) => run(() => apiRequest('/timeline', { method: 'POST', body: JSON.stringify(payload) }, token), 'Timeline entry added')
  const updateTimeline = (id: number, payload: any) => run(() => apiRequest(`/timeline/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token), 'Updated')
  const deleteTimeline = (id: number) => run(() => apiRequest(`/timeline/${id}`, { method: 'DELETE' }, token), 'Removed')

  const addReport = (payload: any) => run(() => apiRequest('/reports', { method: 'POST', body: JSON.stringify(payload) }, token), 'Report added')
  const uploadReport = async (payload: any, file: { uri: string; name: string; type: string } | null) => {
    if (!file) return addReport(payload)
    return run(async () => {
      const fd = new FormData()
      fd.append('name', payload.name)
      fd.append('doctor', payload.doctor)
      fd.append('date', payload.date)
      fd.append('status', payload.status)
      fd.append('reportFile', { uri: file.uri, name: file.name, type: file.type } as any)
      return apiRequest('/reports/upload', { method: 'POST', body: fd }, token)
    }, 'Report uploaded')
  }
  const updateReport = (id: number, payload: any) => run(() => apiRequest(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token), 'Updated')
  const deleteReport = (id: number) => run(() => apiRequest(`/reports/${id}`, { method: 'DELETE' }, token), 'Removed')
  const rebuildAi = () => run(() => apiRequest('/ai/rebuild-reports', { method: 'POST' }, token), 'AI summaries refreshed')

  const addVital = (payload: any) => run(() => apiRequest('/vitals', { method: 'POST', body: JSON.stringify(payload) }, token), 'Vital added')
  const updateVital = (id: number, payload: any) => run(() => apiRequest(`/vitals/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token), 'Updated')
  const deleteVital = (id: number) => run(() => apiRequest(`/vitals/${id}`, { method: 'DELETE' }, token), 'Removed')

  const addAppointment = (payload: any) => run(() => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(payload) }, token), 'Appointment added')
  const updateAppointment = (id: number, payload: any) => run(() => apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token), 'Updated')
  const deleteAppointment = (id: number) => run(() => apiRequest(`/appointments/${id}`, { method: 'DELETE' }, token), 'Removed')

  const addMedication = (payload: any) => run(() => apiRequest('/medications', { method: 'POST', body: JSON.stringify(payload) }, token), 'Medication added')
  const updateMedication = (id: number, payload: any) => run(() => apiRequest(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token), 'Updated')
  const deleteMedication = (id: number) => run(() => apiRequest(`/medications/${id}`, { method: 'DELETE' }, token), 'Removed')

  const addConsultation = (payload: any) => run(() => apiRequest('/consultations', { method: 'POST', body: JSON.stringify(payload) }, token), 'Consultation added')
  const updateConsultation = (id: number, payload: any) => run(() => apiRequest(`/consultations/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token), 'Updated')
  const deleteConsultation = (id: number) => run(() => apiRequest(`/consultations/${id}`, { method: 'DELETE' }, token), 'Removed')

  const connectAbha = (payload: { abhaNumber: string; abhaAddress: string }) => run(() => apiRequest('/abha/connect', { method: 'POST', body: JSON.stringify(payload) }, token), 'ABHA linked')
  const discoverCareContexts = () => run(() => apiRequest('/abdm/discover', { method: 'POST' }, token), 'Care contexts discovered')
  const requestConsent = () => run(() => apiRequest('/abdm/request-consent', { method: 'POST' }, token), 'Consent requested')
  const approveDemoConsent = () => run(() => apiRequest('/abdm/approve-demo-consent', { method: 'POST' }, token), 'Consent approved')
  const importAbdm = () => run(() => apiRequest('/abha/import-demo', { method: 'POST' }, token), 'Records imported')
  const resetRecord = () => run(() => apiRequest('/reset', { method: 'POST' }, token), 'Record reset')

  const value = useMemo<RecordContextValue>(() => ({
    record, loading, saving, offline, lastSyncedAt, abdmStatus, reload,
    putPatient, putEmergency,
    addTimeline, updateTimeline, deleteTimeline,
    addReport, uploadReport, updateReport, deleteReport, rebuildAi,
    addVital, updateVital, deleteVital,
    addAppointment, updateAppointment, deleteAppointment,
    addMedication, updateMedication, deleteMedication,
    addConsultation, updateConsultation, deleteConsultation,
    connectAbha, discoverCareContexts, requestConsent, approveDemoConsent, importAbdm, resetRecord,
  }), [record, loading, saving, offline, lastSyncedAt, abdmStatus, reload])

  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>
}

export function useRecord() {
  const c = useContext(RecordContext)
  if (!c) throw new Error('useRecord must be used inside RecordProvider')
  return c
}
