import { useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSubscription, Plan } from '../../../src/providers/SubscriptionProvider'
import { useAuth } from '../../../src/providers/AuthProvider'
import { apiRequest } from '../../../src/services/api'
import { AppScreen, Badge, Banner } from '../../../src/components/MobileUI'
import { colors } from '../../../src/theme/colors'

interface PlanFeature {
  label: string
  included: boolean
}

interface PlanCard {
  id: Plan
  name: string
  price: string
  period: string
  tagline: string
  features: PlanFeature[]
  recommended?: boolean
}

const PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    period: 'forever',
    tagline: 'Get started with the basics',
    features: [
      { label: '5 reports/month', included: true },
      { label: 'Basic vitals tracking', included: true },
      { label: 'Appointment reminders', included: true },
      { label: 'Community support', included: true },
      { label: 'AI Health Chat', included: false },
      { label: 'Advanced analytics', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '\u20B9199',
    period: '/month',
    tagline: 'Unlock the full power of HealthMap',
    recommended: true,
    features: [
      { label: 'Unlimited reports', included: true },
      { label: 'AI Health Chat', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Export PDF reports', included: true },
      { label: 'Priority support', included: true },
      { label: 'Custom reminders', included: true },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: '\u20B9399',
    period: '/month',
    tagline: 'Health for the whole family',
    features: [
      { label: 'Everything in Premium', included: true },
      { label: 'Up to 5 family members', included: true },
      { label: 'Shared health dashboard', included: true },
      { label: 'Family health reports', included: true },
    ],
  },
]

async function loadRazorpay(): Promise<any> {
  if (Platform.OS !== 'web') return null
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve((window as any).Razorpay)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve((window as any).Razorpay)
    script.onerror = () => resolve(null)
    document.body.appendChild(script)
  })
}

export default function PlansScreen() {
  const { subscription, isTrial, trialDaysLeft, refresh } = useSubscription()
  const { token } = useAuth()
  const currentPlan = subscription?.plan ?? 'free'
  const [upgrading, setUpgrading] = useState<Plan | null>(null)

  const handleUpgrade = async (planId: Plan) => {
    if (planId === 'free') return
    if (Platform.OS === 'web') {
      // Alert.alert buttons don't work on web — use confirm()
      const ok = window.confirm(`Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan?`)
      if (ok) processPayment(planId)
      return
    }
    Alert.alert(
      'Upgrade Plan',
      `You are about to upgrade to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => processPayment(planId),
        },
      ]
    )
  }

  const processPayment = async (planId: Plan) => {
    if (!token) return
    setUpgrading(planId)
    try {
      const data = await apiRequest<any>('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ plan: planId }),
      }, token)

      // Dev mode: no Razorpay keys configured, server directly upgraded
      if (data.devMode) {
        await refresh()
        if (Platform.OS === 'web') window.alert(`Upgraded! You are now on the ${planId} plan.`)
        else Alert.alert('Upgraded!', `You are now on the ${planId} plan.`)
        setUpgrading(null)
        return
      }

      // Production mode: open Razorpay checkout
      if (Platform.OS === 'web') {
        const RazorpayClass = await loadRazorpay()
        if (!RazorpayClass) {
          Alert.alert('Error', 'Could not load payment gateway. Please try again.')
          setUpgrading(null)
          return
        }

        const options = {
          key: data.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: 'HealthMap AI',
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
          handler: async (rzpResponse: any) => {
            try {
              await apiRequest<any>('/payment/verify', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: rzpResponse.razorpay_order_id,
                  razorpay_payment_id: rzpResponse.razorpay_payment_id,
                  razorpay_signature: rzpResponse.razorpay_signature,
                  plan: planId,
                }),
              }, token)
              await refresh()
              Alert.alert('Payment Successful', `You are now on the ${planId} plan.`)
            } catch {
              Alert.alert('Error', 'Payment verification failed. Contact support if amount was deducted.')
            }
            setUpgrading(null)
          },
          modal: {
            ondismiss: () => {
              setUpgrading(null)
            },
          },
          theme: {
            color: colors.primary,
          },
        }

        const rzp = new RazorpayClass(options)
        rzp.on('payment.failed', (failResponse: any) => {
          Alert.alert('Payment Failed', failResponse?.error?.description || 'Something went wrong.')
          setUpgrading(null)
        })
        rzp.open()
      } else {
        // Native Android/iOS: will be handled via react-native-razorpay in the future
        Alert.alert('Info', 'Native payment is not yet supported. Please use the web app to upgrade.')
        setUpgrading(null)
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not initiate payment. Please try again later.')
      setUpgrading(null)
    }
  }

  return (
    <AppScreen>
      {isTrial && (
        <Banner
          text={`Trial: ${trialDaysLeft} days remaining. Upgrade to keep all features.`}
          tone="warning"
        />
      )}

      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <Text style={styles.headerSubtitle}>
          Unlock premium features to take full control of your health journey.
        </Text>
      </View>

      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id
        const isRecommended = plan.recommended

        return (
          <View key={plan.id} style={[styles.planCard, isRecommended && styles.planCardRecommended]}>
            {isRecommended && (
              <LinearGradient
                colors={[colors.primary, '#4e9af5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recommendedBanner}
              >
                <Text style={styles.recommendedBannerText}>Recommended</Text>
              </LinearGradient>
            )}

            <View style={styles.planHeader}>
              <View style={styles.planTitleRow}>
                <Text style={[styles.planName, isRecommended && styles.planNameRecommended]}>
                  {plan.name}
                </Text>
                {isCurrent && <Badge label="Current Plan" tone="accent" />}
              </View>
              <Text style={styles.planTagline}>{plan.tagline}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, isRecommended && styles.priceRecommended]}>
                  {plan.price}
                </Text>
                {plan.period !== 'forever' && (
                  <Text style={styles.pricePeriod}>{plan.period}</Text>
                )}
                {plan.period === 'forever' && (
                  <Text style={styles.pricePeriod}> forever</Text>
                )}
              </View>
            </View>

            <View style={styles.featuresArea}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, !feature.included && styles.featureX]}>
                    {feature.included ? '\u2713' : '\u2715'}
                  </Text>
                  <Text
                    style={[
                      styles.featureLabel,
                      !feature.included && styles.featureLabelDisabled,
                    ]}
                  >
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>

            {isCurrent ? (
              <View style={styles.currentPlanButton}>
                <Text style={styles.currentPlanButtonText}>Your Current Plan</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleUpgrade(plan.id)}
                disabled={upgrading !== null}
                style={({ pressed }) => [
                  styles.upgradeButton,
                  isRecommended && styles.upgradeButtonRecommended,
                  pressed && styles.upgradeButtonPressed,
                  upgrading !== null && { opacity: 0.6 },
                ]}
              >
                {upgrading === plan.id ? (
                  <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                    <ActivityIndicator color={isRecommended ? '#ffffff' : colors.primary} />
                  </View>
                ) : isRecommended ? (
                  <LinearGradient
                    colors={[colors.primary, '#4e9af5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeButtonGradient}
                  >
                    <Text style={styles.upgradeButtonTextLight}>Upgrade to {plan.name}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.upgradeButtonText}>Upgrade to {plan.name}</Text>
                )}
              </Pressable>
            )}
          </View>
        )
      })}

      <Text style={styles.footerNote}>
        All plans include end-to-end encryption and HIPAA-compliant storage. Cancel anytime.
      </Text>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  headerArea: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  planCardRecommended: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  recommendedBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    alignItems: 'center',
  },
  recommendedBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    gap: 6,
    paddingTop: 16,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  planNameRecommended: {
    color: colors.primary,
  },
  planTagline: {
    fontSize: 14,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  priceRecommended: {
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
  },
  featuresArea: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    width: 20,
    textAlign: 'center',
  },
  featureX: {
    color: colors.border,
  },
  featureLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  featureLabelDisabled: {
    color: colors.textMuted,
    opacity: 0.6,
  },
  currentPlanButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentPlanButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeButtonRecommended: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
  },
  upgradeButtonPressed: {
    opacity: 0.85,
  },
  upgradeButtonGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  upgradeButtonTextLight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  footerNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})
