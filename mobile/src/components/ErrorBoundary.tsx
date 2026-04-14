import React from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { colors } from '../theme/colors'

type State = { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(err: any): State {
    return { hasError: true, message: err?.message || 'Something went wrong' }
  }

  componentDidCatch(err: any) {
    // eslint-disable-next-line no-console
    console.warn('[ErrorBoundary]', err)
  }

  reset = () => this.setState({ hasError: false, message: undefined })

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.message}</Text>
          <Pressable onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  button: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  buttonText: { color: '#fff', fontWeight: '700' },
})
