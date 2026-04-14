import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type ToastTone = 'success' | 'error' | 'info' | 'warning'
type Toast = { id: number; text: string; tone: ToastTone }

type ToastContextValue = {
  show: (text: string, tone?: ToastTone) => void
  success: (text: string) => void
  error: (text: string) => void
  info: (text: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const opacity = useRef(new Animated.Value(0)).current
  const timer = useRef<any>(null)

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setToast(null))
  }, [opacity])

  const show = useCallback((text: string, tone: ToastTone = 'info') => {
    if (timer.current) clearTimeout(timer.current)
    seq += 1
    setToast({ id: seq, text, tone })
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start()
    timer.current = setTimeout(hide, 3200)
  }, [hide, opacity])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (t) => show(t, 'success'),
    error: (t) => show(t, 'error'),
    info: (t) => show(t, 'info'),
  }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View pointerEvents="box-none" style={[styles.wrap, { opacity }]}>
          <Pressable onPress={hide} style={[styles.toast, toneStyles[toast.tone]]}>
            <Text style={styles.text}>{toast.text}</Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const c = useContext(ToastContext)
  if (!c) throw new Error('useToast must be used inside ToastProvider')
  return c
}

const toneStyles = {
  success: { backgroundColor: '#1e6b48' },
  error: { backgroundColor: '#b04141' },
  info: { backgroundColor: colors.text },
  warning: { backgroundColor: '#a66620' },
} as const

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 90, alignItems: 'center' },
  toast: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, maxWidth: '100%' },
  text: { color: '#fff', fontWeight: '600', fontSize: 14 },
})
