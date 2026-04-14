import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'healthmap-cache:'

export async function readCache<T = any>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.value as T
  } catch {
    return null
  }
}

export async function writeCache(key: string, value: any): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ value, savedAt: Date.now() }))
  } catch {
    // swallow storage errors (quota etc.)
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const ours = keys.filter((k) => k.startsWith(PREFIX))
    if (ours.length) await AsyncStorage.multiRemove(ours)
  } catch {
    // ignore
  }
}

export async function cachedAt(key: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw).savedAt ?? null
  } catch {
    return null
  }
}
