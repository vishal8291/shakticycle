import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from './AuthProvider'

export type DailyLog = {
  date: string
  water: number
  sleep: number
  exercise: number
  mood: string
  steps: number
  notes: string
}

type DailyLogContextValue = {
  today: DailyLog | null
  week: DailyLog[]
  loading: boolean
  updateToday: (updates: Partial<DailyLog>) => Promise<void>
  refresh: () => Promise<void>
}

const DailyLogContext = createContext<DailyLogContextValue | null>(null)

function todayStr() { return new Date().toISOString().slice(0, 10) }

export function DailyLogProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [today, setToday] = useState<DailyLog | null>(null)
  const [week, setWeek] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!token) { setToday(null); setWeek([]); setLoading(false); return }
    try {
      const [todayRes, weekRes] = await Promise.all([
        apiRequest<{ log: DailyLog }>(`/daily-log?date=${todayStr()}`, {}, token),
        apiRequest<{ logs: DailyLog[] }>('/daily-log/week', {}, token),
      ])
      setToday(todayRes.log)
      setWeek(weekRes.logs)
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => { refresh() }, [refresh])

  const updateToday = async (updates: Partial<DailyLog>) => {
    if (!token) return
    const body = { date: todayStr(), ...updates }
    const res = await apiRequest<{ log: DailyLog }>('/daily-log', { method: 'PUT', body: JSON.stringify(body) }, token)
    setToday(res.log)
    // refresh week data too
    try {
      const weekRes = await apiRequest<{ logs: DailyLog[] }>('/daily-log/week', {}, token)
      setWeek(weekRes.logs)
    } catch {}
  }

  return (
    <DailyLogContext.Provider value={{ today, week, loading, updateToday, refresh }}>
      {children}
    </DailyLogContext.Provider>
  )
}

export function useDailyLog() {
  const c = useContext(DailyLogContext)
  if (!c) throw new Error('useDailyLog must be inside DailyLogProvider')
  return c
}
