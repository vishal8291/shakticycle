/**
 * Health Score calculator for HealthMap AI.
 * Produces a 0-100 score with per-category breakdown and tips.
 */

interface BreakdownItem {
  category: string
  points: number
  maxPoints: number
  tip: string
}

interface HealthScoreResult {
  score: number
  breakdown: BreakdownItem[]
}

function daysSince(dateStr: string | undefined | null): number {
  if (!dateStr) return Infinity
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return Infinity
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateHealthScore(record: any): HealthScoreResult {
  const breakdown: BreakdownItem[] = []
  const patient = record?.patient || {}
  const emergency = record?.emergencyInfo || record?.emergency || {}
  const vitals: any[] = Array.isArray(record?.vitals) ? record.vitals : []
  const reports: any[] = Array.isArray(record?.reports) ? record.reports : []
  const medications: any[] = Array.isArray(record?.medications) ? record.medications : []
  const appointments: any[] = Array.isArray(record?.appointments) ? record.appointments : []
  const timeline: any[] = Array.isArray(record?.timeline) ? record.timeline : []

  // 1. Profile completeness (+15)
  const hasName = Boolean(patient.name && patient.name.trim())
  const hasDob = Boolean(patient.dob || patient.dateOfBirth)
  const hasBloodGroup = Boolean(patient.bloodGroup)
  const profileParts = [hasName, hasDob, hasBloodGroup].filter(Boolean).length
  const profilePoints = profileParts === 3 ? 15 : profileParts === 2 ? 10 : profileParts === 1 ? 5 : 0
  const profileTip =
    profilePoints >= 15
      ? 'Great! Your profile is complete.'
      : !hasBloodGroup
        ? 'Add your blood group to complete your profile.'
        : !hasDob
          ? 'Add your date of birth for a complete profile.'
          : 'Fill in your name to start building your profile.'
  breakdown.push({ category: 'Profile', points: profilePoints, maxPoints: 15, tip: profileTip })

  // 2. Emergency info (+10)
  const hasEmergency =
    Boolean(emergency.contactName || emergency.emergencyContact) ||
    Boolean(emergency.allergies && emergency.allergies.length) ||
    Boolean(emergency.insuranceProvider || emergency.insurance)
  const emergencyPoints = hasEmergency ? 10 : 0
  const emergencyTip = hasEmergency
    ? 'Emergency info is on file. Well done!'
    : 'Add emergency contacts and allergy info for safety.'
  breakdown.push({ category: 'Emergency Info', points: emergencyPoints, maxPoints: 10, tip: emergencyTip })

  // 3. Recent vitals within 30 days (+20)
  const recentVital = vitals.some((v) => daysSince(v.date || v.createdAt) <= 30)
  const vitalsPoints = recentVital ? 20 : vitals.length > 0 ? 10 : 0
  const vitalsTip =
    vitalsPoints >= 20
      ? 'Great! Your vitals are up to date.'
      : vitals.length > 0
        ? 'Your last vitals reading is over 30 days old. Time for an update!'
        : 'Start tracking vitals like BP, glucose, and weight.'
  breakdown.push({ category: 'Vitals', points: vitalsPoints, maxPoints: 20, tip: vitalsTip })

  // 4. Reports uploaded (+15, max at 5+)
  const reportCount = reports.length
  const reportPoints = reportCount >= 5 ? 15 : reportCount >= 3 ? 10 : reportCount >= 1 ? 5 : 0
  const reportTip =
    reportPoints >= 15
      ? 'Excellent! You have a solid collection of reports.'
      : reportCount > 0
        ? `Upload more reports to reach the full score (${reportCount}/5).`
        : 'Upload your first medical report to get started.'
  breakdown.push({ category: 'Reports', points: reportPoints, maxPoints: 15, tip: reportTip })

  // 5. Active medications tracked (+10)
  const activeMeds = medications.filter(
    (m) => m.status === 'Active' || m.status === 'active' || !m.status,
  )
  const medPoints = activeMeds.length > 0 ? 10 : 0
  const medTip = medPoints > 0
    ? `Tracking ${activeMeds.length} medication${activeMeds.length > 1 ? 's' : ''}. Keep it updated!`
    : 'Add your current medications for better health tracking.'
  breakdown.push({ category: 'Medications', points: medPoints, maxPoints: 10, tip: medTip })

  // 6. Appointments kept — scheduled within 90 days (+15)
  const now = Date.now()
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
  const recentAppt = appointments.some((a) => {
    const d = new Date(a.date)
    if (isNaN(d.getTime())) return false
    const diff = d.getTime() - now
    return diff >= -ninetyDaysMs && diff <= ninetyDaysMs
  })
  const apptPoints = recentAppt ? 15 : 0
  const apptTip = apptPoints > 0
    ? 'You have appointments on track. Nice!'
    : 'Schedule a checkup to stay on top of your health.'
  breakdown.push({ category: 'Appointments', points: apptPoints, maxPoints: 15, tip: apptTip })

  // 7. Timeline entries — symptom logging activity (+15)
  const recentTimeline = timeline.some((t) => daysSince(t.date || t.createdAt) <= 30)
  const timelinePoints = recentTimeline ? 15 : timeline.length > 0 ? 7 : 0
  const timelineTip =
    timelinePoints >= 15
      ? 'Active health logging detected. Keep it up!'
      : timeline.length > 0
        ? 'Log symptoms or events more frequently for better insights.'
        : 'Start logging symptoms and health events on your timeline.'
  breakdown.push({ category: 'Timeline Activity', points: timelinePoints, maxPoints: 15, tip: timelineTip })

  const score = breakdown.reduce((sum, item) => sum + item.points, 0)
  return { score, breakdown }
}

export function scoreColor(score: number): string {
  if (score < 40) return '#e74c3c'   // red
  if (score < 60) return '#f39c12'   // orange
  if (score < 75) return '#f1c40f'   // yellow
  return '#4ebd95'                    // green
}

export function scoreLabel(score: number): string {
  if (score < 40) return 'Needs Attention'
  if (score < 60) return 'Fair'
  if (score < 75) return 'Good'
  return 'Excellent'
}
