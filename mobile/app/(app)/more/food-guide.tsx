import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppScreen, SectionCard, Spacer } from '../../../src/components/MobileUI'
import { useAuth } from '../../../src/providers/AuthProvider'
import { apiRequest } from '../../../src/services/api'
import { colors, typography, spacing, radii, shadows } from '../../../src/theme/colors'

interface Food {
  id: string; name: string; hindi: string; category: string; veg: boolean
  cal: number; protein: number; carbs: number; fat: number; fiber: number
  tags: string[]; region: string
}

interface ConditionData {
  label: string; tips: string[]
  recommendedFoods: Food[]; avoidFoods: Food[]
}

interface MealPlan {
  label: string
  meals: Record<string, string>
}

const CATEGORY_LABELS: Record<string, string> = {
  grain: '🌾 Grains', lentil: '🫘 Lentils', vegetable: '🥬 Vegetables', fruit: '🍎 Fruits',
  dairy: '🥛 Dairy', spice: '🌶️ Spices', nut_seed: '🥜 Nuts & Seeds',
  non_veg: '🍗 Non-Veg', snack: '🍽️ Snacks', beverage: '🥤 Beverages',
}

const CONDITION_LABELS: Record<string, { icon: string; label: string }> = {
  diabetes: { icon: '🩸', label: 'Diabetes' },
  hypertension: { icon: '💓', label: 'High BP' },
  anemia: { icon: '🩸', label: 'Anemia' },
  cholesterol: { icon: '🫀', label: 'Cholesterol' },
  weight_loss: { icon: '⚖️', label: 'Weight Loss' },
  thyroid: { icon: '🦋', label: 'Thyroid' },
  immunity: { icon: '🛡️', label: 'Immunity' },
  pregnancy: { icon: '🤰', label: 'Pregnancy' },
}

const MEAL_PLAN_LABELS: Record<string, { icon: string; label: string }> = {
  balanced: { icon: '🍽️', label: 'Balanced Diet' },
  diabetes_friendly: { icon: '🩸', label: 'Diabetes Diet' },
  weight_loss_plan: { icon: '⚖️', label: 'Weight Loss' },
  heart_healthy: { icon: '❤️', label: 'Heart Healthy' },
  pregnancy_plan: { icon: '🤰', label: 'Pregnancy' },
}

type Tab = 'browse' | 'conditions' | 'meals'

export default function FoodGuideScreen() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('browse')
  const [foods, setFoods] = useState<Food[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [conditionData, setConditionData] = useState<ConditionData | null>(null)
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null)
  const [mealPlanData, setMealPlanData] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFoods()
  }, [])

  async function loadFoods() {
    setLoading(true)
    try {
      const res = await apiRequest<{ foods: Food[] }>('/foods', { method: 'GET' }, token)
      setFoods(res.foods || [])
    } catch { } finally { setLoading(false) }
  }

  async function handleSearch(q: string) {
    setSearch(q)
    if (!q.trim()) { loadFoods(); return }
    try {
      const res = await apiRequest<{ foods: Food[] }>(`/foods?q=${encodeURIComponent(q)}`, { method: 'GET' }, token)
      setFoods(res.foods || [])
    } catch { }
  }

  async function handleCategory(cat: string) {
    setSelectedCategory(cat === selectedCategory ? null : cat)
    if (cat === selectedCategory) { loadFoods(); return }
    try {
      const res = await apiRequest<{ foods: Food[] }>(`/foods?category=${cat}`, { method: 'GET' }, token)
      setFoods(res.foods || [])
    } catch { }
  }

  async function handleCondition(cond: string) {
    setSelectedCondition(cond)
    setLoading(true)
    try {
      const res = await apiRequest<ConditionData>(`/foods?condition=${cond}`, { method: 'GET' }, token)
      setConditionData(res)
    } catch { } finally { setLoading(false) }
  }

  async function handleMealPlan(key: string) {
    setSelectedMealPlan(key)
    setLoading(true)
    try {
      const res = await apiRequest<MealPlan>(`/foods?meal_plan=${key}`, { method: 'GET' }, token)
      setMealPlanData(res)
    } catch { } finally { setLoading(false) }
  }

  function renderFoodCard({ item }: { item: Food }) {
    return (
      <View style={styles.foodCard}>
        <View style={styles.foodHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodHindi}>{item.hindi}</Text>
          </View>
          <View style={[styles.vegBadge, { backgroundColor: item.veg ? '#16a34a' : '#dc2626' }]}>
            <Text style={styles.vegBadgeText}>{item.veg ? 'VEG' : 'NON-VEG'}</Text>
          </View>
        </View>
        <View style={styles.nutritionRow}>
          <NutritionPill label="Cal" value={item.cal} unit="kcal" color="#f59e0b" />
          <NutritionPill label="Protein" value={item.protein} unit="g" color="#3b82f6" />
          <NutritionPill label="Carbs" value={item.carbs} unit="g" color="#8b5cf6" />
          <NutritionPill label="Fat" value={item.fat} unit="g" color="#ef4444" />
          <NutritionPill label="Fiber" value={item.fiber} unit="g" color="#22c55e" />
        </View>
        {item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 4).map(t => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <AppScreen>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['browse', 'conditions', 'meals'] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => { setTab(t); setSelectedCondition(null); setSelectedMealPlan(null) }}
            style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'browse' ? '🔍 Browse' : t === 'conditions' ? '🏥 By Condition' : '📋 Meal Plans'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'browse' && (
        <>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods (e.g. paneer, iron, ragi...)"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={handleSearch}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Pressable key={key} onPress={() => handleCategory(key)}
                style={[styles.categoryChip, selectedCategory === key && styles.categoryChipActive]}>
                <Text style={[styles.categoryChipText, selectedCategory === key && styles.categoryChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={foods}
              keyExtractor={item => item.id}
              renderItem={renderFoodCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No foods found. Try a different search.</Text>}
            />
          )}
        </>
      )}

      {tab === 'conditions' && !selectedCondition && (
        <SectionCard title="Select a Health Condition">
          <Spacer size={4} />
          {Object.entries(CONDITION_LABELS).map(([key, { icon, label }]) => (
            <Pressable key={key} onPress={() => handleCondition(key)} style={({ pressed }) => [styles.conditionRow, pressed && { opacity: 0.6 }]}>
              <Text style={styles.conditionIcon}>{icon}</Text>
              <Text style={styles.conditionLabel}>{label}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          ))}
        </SectionCard>
      )}

      {tab === 'conditions' && selectedCondition && conditionData && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Pressable onPress={() => setSelectedCondition(null)} style={styles.backButton}>
            <Text style={styles.backText}>{'< Back to conditions'}</Text>
          </Pressable>

          <SectionCard title={conditionData.label}>
            <Spacer size={8} />

            <Text style={styles.sectionLabel}>{'✅ Recommended Foods'}</Text>
            {conditionData.recommendedFoods?.map(f => (
              <View key={f.id} style={styles.miniFood}>
                <Text style={styles.miniFoodName}>{f.name}</Text>
                <Text style={styles.miniFoodHindi}>{f.hindi}</Text>
                <Text style={styles.miniFoodCal}>{f.cal} kcal</Text>
              </View>
            ))}

            {conditionData.avoidFoods?.length > 0 && (
              <>
                <Spacer size={12} />
                <Text style={styles.sectionLabel}>{'❌ Foods to Limit/Avoid'}</Text>
                {conditionData.avoidFoods.map(f => (
                  <View key={f.id} style={styles.miniFood}>
                    <Text style={styles.miniFoodName}>{f.name}</Text>
                    <Text style={styles.miniFoodHindi}>{f.hindi}</Text>
                  </View>
                ))}
              </>
            )}

            <Spacer size={12} />
            <Text style={styles.sectionLabel}>{'💡 Tips'}</Text>
            {conditionData.tips?.map((tip, i) => (
              <Text key={i} style={styles.tipText}>{'• '}{tip}</Text>
            ))}
          </SectionCard>
        </ScrollView>
      )}

      {tab === 'meals' && !selectedMealPlan && (
        <SectionCard title="Choose a Meal Plan">
          <Spacer size={4} />
          {Object.entries(MEAL_PLAN_LABELS).map(([key, { icon, label }]) => (
            <Pressable key={key} onPress={() => handleMealPlan(key)} style={({ pressed }) => [styles.conditionRow, pressed && { opacity: 0.6 }]}>
              <Text style={styles.conditionIcon}>{icon}</Text>
              <Text style={styles.conditionLabel}>{label}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          ))}
        </SectionCard>
      )}

      {tab === 'meals' && selectedMealPlan && mealPlanData && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Pressable onPress={() => setSelectedMealPlan(null)} style={styles.backButton}>
            <Text style={styles.backText}>{'< Back to plans'}</Text>
          </Pressable>

          <SectionCard title={mealPlanData.label}>
            <Spacer size={8} />
            {Object.entries(mealPlanData.meals || {}).map(([time, meal]) => (
              <View key={time} style={styles.mealRow}>
                <Text style={styles.mealTime}>{time.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                <Text style={styles.mealDesc}>{meal}</Text>
              </View>
            ))}
          </SectionCard>
        </ScrollView>
      )}

      {tab === 'conditions' && selectedCondition && loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      )}
      {tab === 'meals' && selectedMealPlan && loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      )}
    </AppScreen>
  )
}

function NutritionPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + '40' }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillUnit}>{unit}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.xl, padding: 4, ...shadows.sm, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radii.lg, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.xl, paddingHorizontal: 14, marginBottom: 8, ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: colors.text },

  categoryScroll: { maxHeight: 44, marginBottom: 8 },
  categoryContent: { gap: 8, paddingHorizontal: 2 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },

  listContent: { paddingBottom: 24 },

  foodCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: 16, marginBottom: 10, ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  foodName: { fontSize: 16, fontWeight: '700', color: colors.text },
  foodHindi: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  vegBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  vegBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginBottom: 8 },
  pill: { alignItems: 'center', flex: 1, paddingVertical: 6, borderRadius: 10, borderWidth: 1, backgroundColor: '#fafbfc' },
  pillValue: { fontSize: 14, fontWeight: '800' },
  pillUnit: { fontSize: 9, color: colors.textMuted },
  pillLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 2 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#eef4ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  conditionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 12 },
  conditionIcon: { fontSize: 24 },
  conditionLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  chevron: { fontSize: 20, color: colors.textMuted },

  backButton: { paddingVertical: 10, marginBottom: 4 },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '600' },

  sectionLabel: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 },
  miniFood: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 8 },
  miniFoodName: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
  miniFoodHindi: { fontSize: 12, color: colors.textMuted },
  miniFoodCal: { fontSize: 12, color: colors.primary, fontWeight: '700' },

  tipText: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 6 },

  mealRow: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  mealTime: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'capitalize', marginBottom: 4 },
  mealDesc: { fontSize: 14, color: colors.text, lineHeight: 21 },

  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 15, marginTop: 40 },
})
