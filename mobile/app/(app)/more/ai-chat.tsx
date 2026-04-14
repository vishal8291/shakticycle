import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { AppScreen } from '../../../src/components/MobileUI'
import { useAuth } from '../../../src/providers/AuthProvider'
import { useRecord } from '../../../src/providers/RecordProvider'
import { useSubscription } from '../../../src/providers/SubscriptionProvider'
import { apiRequest } from '../../../src/services/api'

const COLORS = {
  primary: '#2c73d9',
  accent: '#4ebd95',
  text: '#17324a',
  textMuted: '#7b8fa0',
  surface: '#ffffff',
  bg: '#f2f5f9',
  border: '#e2e8f0',
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  text: "Hello! I'm VishalBytes, your personal AI health companion. 🩺\n\nI can see your complete health profile — vitals, medications, reports, daily habits, and more. I'm here to monitor everything and help you stay healthy.\n\nAsk me anything:\n• \"How are my vitals looking?\"\n• \"What should I eat for my condition?\"\n• \"Analyze my latest report\"\n• \"Am I drinking enough water?\"\n• \"What medicines am I on?\"",
}

export default function AiChatScreen() {
  const { token } = useAuth()
  const { record } = useRecord()
  const { plan } = useSubscription()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const isPremium = plan === 'premium' || plan === 'family'

  useEffect(() => {
    scrollToEnd()
  }, [messages])

  function scrollToEnd() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = { id: createId(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Send conversation history so AI has context of the chat
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-10) // Last 10 messages
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }))

      const result = await apiRequest<{
        reply: string
        source?: string
        remaining?: number
        limit?: number
      }>(
        '/ai/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: trimmed,
            history,
          }),
        },
        token,
      )
      const aiMsg: ChatMessage = { id: createId(), role: 'ai', text: result.reply }
      setMessages((prev) => [...prev, aiMsg])
      if (typeof result.remaining === 'number') setRemaining(result.remaining)
    } catch (err: any) {
      // Handle rate limit
      if (err?.status === 429) {
        const errMsg: ChatMessage = {
          id: createId(),
          role: 'ai',
          text: `⚠️ ${err?.message || 'Daily message limit reached.'}\n\n${isPremium ? 'Your limit resets in a few hours.' : 'Upgrade to Premium for 100 messages/day!'}`,
        }
        setMessages((prev) => [...prev, errMsg])
      } else {
        const errMsg: ChatMessage = {
          id: createId(),
          role: 'ai',
          text: 'Sorry, I could not process your request right now. Please try again later.',
        }
        setMessages((prev) => [...prev, errMsg])
      }
    } finally {
      setLoading(false)
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.role === 'user'
    return (
      <View style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAi]}>
            {item.text}
          </Text>
        </View>
      </View>
    )
  }

  // Paywall overlay for free plan users
  if (!isPremium) {
    return (
      <AppScreen>
        <View style={styles.paywallContainer}>
          <Text style={styles.paywallIcon}>{'🔒'}</Text>
          <Text style={styles.paywallTitle}>AI Chat is a Premium feature</Text>
          <Text style={styles.paywallSub}>
            Upgrade to Premium to unlock AI-powered health conversations, personalized advice, and more.
          </Text>
          <Pressable onPress={() => router.push('/(app)/more/plans')} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </Pressable>
        </View>
      </AppScreen>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.flex}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToEnd}
        />

        {loading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.typingText}>VishalBytes is analyzing your health data...</Text>
          </View>
        )}

        {remaining !== null && !loading && (
          <View style={styles.remainingRow}>
            <Text style={styles.remainingText}>
              {remaining > 0 ? `${remaining} messages remaining today` : 'Daily limit reached'}
            </Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your health..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || loading}
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || loading) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
          >
            <Text style={styles.sendButtonText}>{'>'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  bubbleTextAi: {
    color: COLORS.text,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  remainingRow: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  paywallContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  paywallIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  paywallSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
