import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { scoreColor, scoreLabel } from '../utils/healthScore'

interface HealthScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

const COLORS = {
  primary: '#2c73d9',
  accent: '#4ebd95',
  text: '#17324a',
}

/**
 * Animated circular progress ring showing the health score.
 * Uses the two-half-circle clipping technique to draw an arc.
 */
export default function HealthScoreRing({
  score,
  size = 180,
  strokeWidth = 14,
}: HealthScoreRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current
  const color = scoreColor(score)
  const label = scoreLabel(score)

  const outerRadius = size / 2
  const innerRadius = outerRadius - strokeWidth

  useEffect(() => {
    animatedValue.setValue(0)
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start()
  }, [score])

  // For the ring we use two half-circle technique:
  // - A background circle (track) in light gray
  // - Two overlapping half-circles that rotate to reveal the colored arc

  // Calculate rotation degrees for first and second halves
  const clampedScore = Math.min(100, Math.max(0, score))
  const totalDeg = (clampedScore / 100) * 360

  // First half covers 0-180 deg, second half covers 180-360 deg
  const firstHalfDeg = Math.min(totalDeg, 180)
  const secondHalfDeg = Math.max(0, totalDeg - 180)

  // Animated display value
  const displayScore = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  })

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Track (background ring) */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: outerRadius,
            borderWidth: strokeWidth,
            borderColor: '#e8ecf0',
          },
        ]}
      />

      {/* Right half (first 180 degrees) */}
      <View style={[styles.halfWrapper, { width: size / 2, height: size, left: size / 2, overflow: 'hidden' }]}>
        <View
          style={[
            styles.halfCircle,
            {
              width: size,
              height: size,
              borderRadius: outerRadius,
              borderWidth: strokeWidth,
              borderColor: color,
              left: -(size / 2),
              transform: [{ rotate: `${firstHalfDeg}deg` }],
            },
          ]}
        />
      </View>

      {/* Left half (second 180 degrees, only if score > 50%) */}
      {secondHalfDeg > 0 && (
        <View style={[styles.halfWrapper, { width: size / 2, height: size, left: 0, overflow: 'hidden' }]}>
          <View
            style={[
              styles.halfCircle,
              {
                width: size,
                height: size,
                borderRadius: outerRadius,
                borderWidth: strokeWidth,
                borderColor: color,
                left: size / 2,
                transform: [{ rotate: `${secondHalfDeg}deg` }],
              },
            ]}
          />
        </View>
      )}

      {/* Inner white circle to mask the filled area */}
      <View
        style={[
          styles.innerCircle,
          {
            width: innerRadius * 2,
            height: innerRadius * 2,
            borderRadius: innerRadius,
            top: strokeWidth,
            left: strokeWidth,
          },
        ]}
      />

      {/* Center content */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <AnimatedScore value={displayScore} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  )
}

/** Renders the animated score number */
function AnimatedScore({ value, color }: { value: Animated.AnimatedInterpolation<number>; color: string }) {
  const textRef = useRef<Text>(null)
  const listenerId = useRef<string | undefined>(undefined)
  const currentValue = useRef(0)

  useEffect(() => {
    listenerId.current = value.addListener(({ value: v }) => {
      currentValue.current = Math.round(v)
      if (textRef.current) {
        (textRef.current as any).setNativeProps?.({ text: String(Math.round(v)) })
      }
    })
    return () => {
      if (listenerId.current) value.removeListener(listenerId.current)
    }
  }, [value])

  // Fallback: use Animated.Text for web compatibility
  return (
    <Animated.Text
      ref={textRef as any}
      style={[styles.scoreText, { color }]}
    >
      {/* Static fallback — animated listener handles updates on native */}
      {'0'}
    </Animated.Text>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  halfWrapper: {
    position: 'absolute',
    top: 0,
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  innerCircle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
