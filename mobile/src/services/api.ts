import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra || {}) as Record<string, any>
const fallbackUrl = typeof extra.apiUrl === 'string' ? extra.apiUrl : 'http://localhost:3001/api'
export const API_URL = process.env.EXPO_PUBLIC_API_URL || fallbackUrl

function joinUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export class ApiError extends Error {
  status: number
  offline: boolean
  constructor(message: string, status = 0, offline = false) {
    super(message)
    this.status = status
    this.offline = offline
  }
}

export type RequestOpts = RequestInit & {
  retries?: number
  timeoutMs?: number
}

async function timedFetch(url: string, init: RequestInit, timeoutMs = 15000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function apiRequest<T = any>(path: string, options: RequestOpts = {}, token?: string): Promise<T> {
  const { retries = 2, timeoutMs = 15000, ...init } = options
  const headers = new Headers(init.headers || {})
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let lastError: any = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await timedFetch(joinUrl(path), { ...init, headers }, timeoutMs)
      const text = await res.text()
      const data = text ? safeParse(text) : {}
      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`
        // Don't retry 4xx
        if (res.status >= 400 && res.status < 500) throw new ApiError(msg, res.status)
        lastError = new ApiError(msg, res.status)
      } else {
        return data as T
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err
      const offline = err?.name === 'AbortError' || /Network request failed|Failed to fetch/i.test(err?.message || '')
      lastError = new ApiError(offline ? 'You appear to be offline.' : err?.message || 'Request failed', 0, offline)
    }
    // backoff before retry
    if (attempt < retries) await sleep(300 * (attempt + 1))
  }
  throw lastError || new ApiError('Request failed')
}

function safeParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
