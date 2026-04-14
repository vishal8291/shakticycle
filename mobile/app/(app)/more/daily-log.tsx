import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppScreen, SectionCard } from '../../../src/components/MobileUI'
import { useDailyLog } from '../../../src/providers/DailyLogProvider'
import { colors } from '../../../src/theme/colors'

const WATER_COLOR = '#2c73d9'
const EXERCISE_COLOR = '#4ebd95'
const SLEEP_COLOR = '#7c5cbf'
const MOOD_COLOR = '#d68d2f'

const MOODS = [
  { key: 'great', emoji: '\u{1F604}', label: 'Great' },
  { key: 'good', emoji: '\u{1F642}', label: 'Good' },
  { key: 'okay', emoji: '\u{1F610}', label: 'Okay' },
  { key: 'bad', emoji: '\u{1F61F}', label: 'Bad' },
  { key: 'terrible', emoji: '\u{1F622}', label: 'Terrible' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function shortDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_LABELS[d.getDay()]
}

export default function DailyLogScreen() {
  const { today, week, loading, updateToday, refresh } = useDailyLog()
  const [refreshing, setRefreshing] = useState(false)
  const [notesInput, setNotesInput] = useState('')
  const [notesFocused, setNotesFocused] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!today) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Unable to load daily log. Pull to refresh.</Text>
        </View>
      </AppScreen>
    )
  }

  const todayDate = new Date().toISOString().slice(0, 10)

  return (
    <AppScreen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Date header */}
      <LinearGradient colors={['#e8f0fe', '#f0f7ff', '#f8fbff']} style={styles.dateHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.dateIcon}>{'\u{1F4C5}'}</Text>
        <Text style={styles.dateText}>{formatDate(todayDate)}</Text>
      </LinearGradient>

      {/* Mood selector */}
      <SectionCard title="How are you feeling?">
        <View style={styles.moodRow}>
          {MOODS.map((m) => {
            const selected = today.mood === m.key
            return (
              <Pressable
                key={m.key}
                onPress={() => updateToday({ mood: m.key })}
                style={[styles.moodBtn, selected && styles.moodBtnSelected]}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{m.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </SectionCard>

      {/* Water tracker */}
      <SectionCard title="Water intake">
        <View style={styles.trackerRow}>
          <View style={styles.trackerLeft}>
            <Text style={[styles.trackerIcon, { color: WATER_COLOR }]}>{'\u{1F4A7}'}</Text>
            <View>
              <Text style={styles.trackerValue}>{today.water}</Text>
              <Text style={styles.trackerTarget}>/ 8 glasses</Text>
            </View>
          </View>
          <View style={styles.trackerButtons}>
            <Pressable
              onPress={() => updateToday({ water: Math.max(0, today.water - 1) })}
              style={[styles.roundBtn, { borderColor: WATER_COLOR }]}
            >
              <Text style={[styles.roundBtnText, { color: WATER_COLOR }]}>-</Text>
            </Pressable>
            <Pressable
              onPress={() => updateToday({ water: today.water + 1 })}
              style={[styles.roundBtn, styles.roundBtnFilled, { backgroundColor: WATER_COLOR }]}
            >
              <Text style={[styles.roundBtnText, { color: '#fff' }]}>+</Text>
            </Pressable>
          </View>
        </View>
        {/* Glass icons */}
        <View style={styles.glassRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.glassIcon, i < today.water && { backgroundColor: WATER_COLOR + '30' }]}>
              <Text style={{ fontSize: 18, opacity: i < today.water ? 1 : 0.25 }}>{'\u{1F4A7}'}</Text>
            </View>
          ))}
        </View>
        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, (today.water / 8) * 100)}%`, backgroundColor: WATER_COLOR }]} />
        </View>
      </SectionCard>

      {/* Sleep tracker */}
      <SectionCard title="Sleep">
        <View style={styles.trackerRow}>
          <View style={styles.trackerLeft}>
            <Text style={[styles.trackerIcon, { color: SLEEP_COLOR }]}>{'\u{1F319}'}</Text>
            <View>
              <Text style={styles.trackerValue}>{today.sleep}</Text>
              <Text style={styles.trackerTarget}>hrs</Text>
            </View>
          </View>
          <View style={styles.trackerButtons}>
            <Pressable
              onPress={() => updateToday({ sleep: Math.max(0, +(today.sleep - 0.5).toFixed(1)) })}
              style={[styles.roundBtn, { borderColor: SLEEP_COLOR }]}
            >
              <Text style={[styles.roundBtnText, { color: SLEEP_COLOR }]}>-</Text>
            </Pressable>
            <Pressable
              onPress={() => updateToday({ sleep: Math.min(24, +(today.sleep + 0.5).toFixed(1)) })}
              style={[styles.roundBtn, styles.roundBtnFilled, { backgroundColor: SLEEP_COLOR }]}
            >
              <Text style={[styles.roundBtnText, { color: '#fff' }]}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, (today.sleep / 8) * 100)}%`, backgroundColor: SLEEP_COLOR }]} />
        </View>
      </SectionCard>

      {/* Exercise tracker */}
      <SectionCard title="Exercise">
        <View style={styles.trackerRow}>
          <View style={styles.trackerLeft}>
            <Text style={[styles.trackerIcon, { color: EXERCISE_COLOR }]}>{'\u{1F3C3}'}</Text>
            <View>
              <Text style={styles.trackerValue}>{today.exercise}</Text>
              <Text style={styles.trackerTarget}>min</Text>
            </View>
          </View>
          <View style={styles.trackerButtons}>
            <Pressable
              onPress={() => updateToday({ exercise: Math.max(0, today.exercise - 5) })}
              style={[styles.roundBtn, { borderColor: EXERCISE_COLOR }]}
            >
              <Text style={[styles.roundBtnText, { color: EXERCISE_COLOR }]}>-</Text>
            </Pressable>
            <Pressable
              onPress={() => updateToday({ exercise: today.exercise + 5 })}
              style={[styles.roundBtn, styles.roundBtnFilled, { backgroundColor: EXERCISE_COLOR }]}
            >
              <Text style={[styles.roundBtnText, { color: '#fff' }]}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, (today.exercise / 60) * 100)}%`, backgroundColor: EXERCISE_COLOR }]} />
        </View>
      </SectionCard>

      {/* Steps */}
      <SectionCard title="Steps">
        <View style={styles.trackerRow}>
          <View style={styles.trackerLeft}>
            <Text style={[styles.trackerIcon, { color: colors.primary }]}>{'\u{1F463}'}</Text>
            <View>
              <Text style={styles.trackerValue}>{today.steps.toLocaleString()}</Text>
              <Text style={styles.trackerTarget}>steps</Text>
            </View>
          </View>
          <View style={styles.trackerButtons}>
            <Pressable
              onPress={() => updateToday({ steps: Math.max(0, today.steps - 500) })}
              style={[styles.roundBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.roundBtnText, { color: colors.primary }]}>-</Text>
            </Pressable>
            <Pressable
              onPress={() => updateToday({ steps: today.steps + 500 })}
              style={[styles.roundBtn, styles.roundBtnFilled, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.roundBtnText, { color: '#fff' }]}>+</Text>
            </Pressable>
          </View>
        </View>
      </SectionCard>

      {/* Notes */}
      <SectionCard title="Notes">
        <TextInput
          style={[styles.notesInput, notesFocused && styles.notesInputFocused]}
          placeholder="How was your day? Any symptoms?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={notesFocused ? notesInput : today.notes}
          onFocus={() => { setNotesInput(today.notes); setNotesFocused(true) }}
          onBlur={() => { setNotesFocused(false); if (notesInput !== today.notes) updateToday({ notes: notesInput }) }}
          onChangeText={setNotesInput}
          maxLength={500}
        />
      </SectionCard>

      {/* Week overview */}
      <SectionCard title="This week">
        <View style={styles.weekChart}>
          {week.map((day) => {
            const waterH = Math.min(100, (day.water / 8) * 100)
            const sleepH = Math.min(100, (day.sleep / 8) * 100)
            const exerciseH = Math.min(100, (day.exercise / 60) * 100)
            const isToday = day.date === todayDate
            return (
              <View key={day.date} style={styles.weekDayCol}>
                <View style={styles.weekBars}>
                  <View style={[styles.weekBar, { height: `${waterH}%`, backgroundColor: WATER_COLOR }]} />
                  <View style={[styles.weekBar, { height: `${sleepH}%`, backgroundColor: SLEEP_COLOR }]} />
                  <View style={[styles.weekBar, { height: `${exerciseH}%`, backgroundColor: EXERCISE_COLOR }]} />
                </View>
                <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>{shortDay(day.date)}</Text>
              </View>
            )
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: WATER_COLOR }]} />
            <Text style={styles.legendText}>Water</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SLEEP_COLOR }]} />
            <Text style={styles.legendText}>Sleep</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: EXERCISE_COLOR }]} />
            <Text style={styles.legendText}>Exercise</Text>
          </View>
        </View>
      </SectionCard>

      <View style={{ height: 32 }} />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  dateIcon: {
    fontSize: 22,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodBtnSelected: {
    borderColor: MOOD_COLOR,
    backgroundColor: MOOD_COLOR + '18',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 4,
  },
  moodLabelSelected: {
    color: MOOD_COLOR,
    fontWeight: '800',
  },

  // Tracker shared
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  trackerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackerIcon: {
    fontSize: 32,
  },
  trackerValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  trackerTarget: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  trackerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roundBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnFilled: {
    borderWidth: 0,
  },
  roundBtnText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },

  // Glass icons
  glassRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  glassIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  // Progress bar
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  notesInputFocused: {
    borderColor: colors.primary,
  },

  // Week chart
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginTop: 8,
    gap: 4,
  },
  weekDayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 2,
  },
  weekBar: {
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  weekDayLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  weekDayLabelToday: {
    color: colors.primary,
    fontWeight: '800',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
})
