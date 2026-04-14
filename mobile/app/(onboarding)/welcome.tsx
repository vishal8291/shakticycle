import { useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const PAGES = [
  {
    icon: '💓',
    title: 'Your Health, Mapped',
    description: 'Track everything from vitals to AI insights — all in one beautiful, secure place.',
    gradientColors: ['#2c73d9', '#4e9af5'] as const,
  },
  {
    icon: '✨',
    title: 'AI-Powered Insights',
    description: 'Get smart analysis of your reports and symptoms. Your personal health assistant, always learning.',
    gradientColors: ['#6c5ce7', '#a29bfe'] as const,
  },
  {
    icon: '🛡️',
    title: 'Always With You',
    description: 'Offline access, reminders, and emergency card — your health data is available anytime, anywhere.',
    gradientColors: ['#4ebd95', '#6dd5b0'] as const,
  },
]

const colors = {
  primary: '#2c73d9',
  accent: '#4ebd95',
  background: '#f4f8fc',
  text: '#17324a',
  textMuted: '#5d738b',
}

export default function WelcomeScreen() {
  const scrollX = useRef(new Animated.Value(0)).current
  const scrollRef = useRef<ScrollView>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH)
        setCurrentPage(page)
      },
    }
  )

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ x: page * SCREEN_WIDTH, animated: true })
  }

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true')
    router.replace('/(auth)/login')
  }

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      goToPage(currentPage + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {PAGES.map((page, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.illustrationArea}>
              <LinearGradient
                colors={[...page.gradientColors]}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.iconText}>{page.icon}</Text>
              </LinearGradient>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
            </View>
            <View style={styles.textArea}>
              <Text style={styles.title}>{page.title}</Text>
              <Text style={styles.description}>{page.description}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Pagination dots */}
      <View style={styles.dotsRow}>
        {PAGES.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ]
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          })
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          })
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity: dotOpacity },
              ]}
            />
          )
        })}
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <Pressable onPress={handleNext} style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed]}>
          <LinearGradient
            colors={[colors.primary, '#4e9af5']}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === PAGES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2c73d9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  iconText: {
    fontSize: 64,
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(44, 115, 217, 0.1)',
    top: 10,
    left: 10,
  },
  decorCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(44, 115, 217, 0.05)',
    top: 0,
    left: 0,
  },
  textArea: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  nextButtonPressed: {
    opacity: 0.85,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
