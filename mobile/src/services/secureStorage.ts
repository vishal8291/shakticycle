import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const isWeb = Platform.OS === 'web'

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null } catch { return null }
  }
  return SecureStore.getItemAsync(key)
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try { window.localStorage.setItem(key, value) } catch { /* ignore */ }
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try { window.localStorage.removeItem(key) } catch { /* ignore */ }
    return
  }
  await SecureStore.deleteItemAsync(key)
}
