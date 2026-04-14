/**
 * HealthMap AI Service — Full health monitoring via Google Gemini
 *
 * This service builds a COMPLETE picture of the user's health and sends it
 * to Gemini so the AI knows everything: vitals, meds, reports, daily habits,
 * conditions, allergies, appointments, emergency info, food preferences.
 *
 * The AI acts as a personal health companion that monitors and advises.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=`

// Rate limiting per user
const rateLimits = new Map() // userId -> { count, resetAt }

const SYSTEM_PROMPT = `You are VishalBytes, the AI health assistant inside HealthMap AI — a personal health monitoring app built in India by Vishal Tiwari.

## YOUR ROLE
You are the user's personal health companion. You have access to their COMPLETE health profile — vitals, medications, medical reports, daily habits, conditions, allergies, appointments, and more. You must:

1. **Monitor their health holistically** — Connect dots between their vitals, medications, diet, sleep, exercise, and conditions
2. **Be proactive** — If you notice concerning patterns (e.g., rising BP, irregular glucose, poor sleep + stress), flag them
3. **Give personalized advice** — Based on THEIR specific data, not generic tips
4. **Remember Indian context** — Use Indian foods, Indian medications, Indian health norms, Indian helpline numbers
5. **Be warm but professional** — Like a caring doctor friend who explains things simply

## HEALTH MONITORING RULES
- If vitals are outside normal range, ALWAYS flag it with specific guidance
- Normal ranges: BP 90/60-120/80, Glucose fasting 70-100, HbA1c <5.7%, BMI 18.5-24.9, SpO2 95-100%, Heart rate 60-100
- If user has diabetes + is eating high-GI food, warn them
- If user has hypertension + high salt intake, advise
- If medications have known interactions, mention
- Track patterns: "Your BP has been elevated for the last 3 readings"
- Suggest when to see a doctor based on their data

## RESPONSE FORMAT
- Keep responses 150-300 words (concise but thorough)
- Use emoji for visual clarity (🩸 💊 💓 🥗 💧 😴 🏃 ⚠️)
- Always end with the medical disclaimer
- For emergencies (chest pain, stroke symptoms, severe breathing), give IMMEDIATE action + call 112/108
- When suggesting food, use Indian foods with Hindi names
- Reference their actual data: "Your last BP reading was 145/92 on March 5th — this is elevated"

## WHAT YOU CAN DO
- Analyze vitals trends and flag concerns
- Review medication schedules and interactions
- Suggest diet based on their conditions (Indian food focused)
- Interpret report summaries in simple language
- Remind about upcoming appointments
- Suggest lifestyle changes based on daily logs
- Calculate health risks based on their profile
- Provide mental health support with Indian helpline numbers

## WHAT YOU MUST NOT DO
- Never diagnose diseases (say "this could indicate..." not "you have...")
- Never prescribe specific medications (say "ask your doctor about..." not "take X medicine")
- Never ignore emergency symptoms
- Never discuss non-health topics (politely redirect)
- Never share user data or reference other users

## MEDICAL DISCLAIMER
Always end with: "⚕️ This is AI health guidance, not medical advice. Always consult your doctor for diagnosis and treatment."
`

/**
 * Build COMPLETE health context string from user's record + daily logs
 */
function buildFullHealthContext(record, dailyLogs, subscription) {
  const parts = []

  // Patient profile
  const p = record?.patient || {}
  parts.push('=== PATIENT PROFILE ===')
  if (p.name) parts.push(`Name: ${p.name}`)
  if (p.age) parts.push(`Age: ${p.age} years`)
  if (p.sex) parts.push(`Sex: ${p.sex}`)
  if (p.bloodGroup) parts.push(`Blood Group: ${p.bloodGroup}`)
  if (p.height) parts.push(`Height: ${p.height} cm`)
  if (p.weight) parts.push(`Weight: ${p.weight} kg`)
  if (p.height && p.weight) {
    const bmi = (p.weight / ((p.height / 100) ** 2)).toFixed(1)
    parts.push(`BMI: ${bmi} (${bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'})`)
  }
  if (p.activityLevel) parts.push(`Activity Level: ${p.activityLevel}`)
  if (p.primaryDoctor) parts.push(`Primary Doctor: ${p.primaryDoctor}`)

  // Medical conditions & allergies
  const conditions = p.conditions || []
  const allergies = p.allergies || []
  if (conditions.length) parts.push(`\nKnown Conditions: ${conditions.join(', ')}`)
  if (allergies.length) parts.push(`Allergies: ${allergies.join(', ')}`)

  // Emergency info
  const e = record?.emergencyInfo || {}
  if (e.conditions?.length) parts.push(`Emergency Conditions: ${e.conditions.join(', ')}`)
  if (e.allergies?.length) parts.push(`Emergency Allergies: ${e.allergies.join(', ')}`)

  // Vitals (last 10 readings)
  const vitals = (record?.vitals || []).slice(0, 10)
  if (vitals.length) {
    parts.push('\n=== RECENT VITALS (latest first) ===')
    for (const v of vitals) {
      parts.push(`- ${v.type}: ${v.value} ${v.unit || ''} (${v.date || 'no date'})${v.notes ? ' — ' + v.notes : ''}`)
    }
  }

  // Medications
  const meds = record?.medications || []
  if (meds.length) {
    parts.push('\n=== CURRENT MEDICATIONS ===')
    for (const m of meds) {
      const status = m.active === false ? '[STOPPED]' : '[ACTIVE]'
      parts.push(`- ${status} ${m.name} — ${m.dosage || '?'}, ${m.frequency || '?'}${m.prescribedBy ? ', by Dr. ' + m.prescribedBy : ''}${m.notes ? ' (' + m.notes + ')' : ''}`)
    }
  }

  // Reports (summaries of last 5)
  const reports = (record?.reports || []).slice(0, 5)
  if (reports.length) {
    parts.push('\n=== RECENT MEDICAL REPORTS ===')
    for (const r of reports) {
      parts.push(`- ${r.name || 'Report'} (${r.date || 'no date'}) — Doctor: ${r.doctor || '?'}, Status: ${r.status || '?'}`)
      if (r.aiSummary) parts.push(`  AI Summary: ${r.aiSummary}`)
      if (r.extractedSummary) parts.push(`  Extracted: ${r.extractedSummary}`)
      if (r.extractedObservations?.length) {
        parts.push(`  Key values: ${r.extractedObservations.map(o => `${o.label}: ${o.value} ${o.unit || ''}`).join(', ')}`)
      }
    }
  }

  // Appointments
  const appointments = (record?.appointments || []).slice(0, 5)
  if (appointments.length) {
    parts.push('\n=== UPCOMING/RECENT APPOINTMENTS ===')
    for (const a of appointments) {
      parts.push(`- ${a.title || 'Appointment'} with ${a.doctor || '?'} on ${a.date || '?'} at ${a.time || '?'} — Status: ${a.status || '?'}${a.location ? ', at ' + a.location : ''}`)
    }
  }

  // Consultations (last 3)
  const consultations = (record?.consultations || []).slice(0, 3)
  if (consultations.length) {
    parts.push('\n=== RECENT DOCTOR CONSULTATIONS ===')
    for (const c of consultations) {
      parts.push(`- ${c.doctorName || '?'} (${c.specialty || '?'}) on ${c.date || '?'}: ${c.diagnosis || 'No diagnosis noted'}${c.notes ? ' — ' + c.notes : ''}`)
    }
  }

  // Daily logs (last 7 days)
  if (dailyLogs?.length) {
    parts.push('\n=== DAILY HEALTH LOG (last 7 days) ===')
    for (const d of dailyLogs) {
      const items = []
      if (d.water) items.push(`Water: ${d.water} glasses`)
      if (d.sleep) items.push(`Sleep: ${d.sleep}h`)
      if (d.exercise) items.push(`Exercise: ${d.exercise}min`)
      if (d.mood) items.push(`Mood: ${d.mood}`)
      if (d.steps) items.push(`Steps: ${d.steps}`)
      if (items.length) parts.push(`- ${d.date}: ${items.join(', ')}${d.notes ? ' | Notes: ' + d.notes : ''}`)
    }
  }

  // Timeline (last 5 events)
  const timeline = (record?.timeline || []).slice(0, 5)
  if (timeline.length) {
    parts.push('\n=== RECENT HEALTH TIMELINE ===')
    for (const t of timeline) {
      parts.push(`- [${t.type || '?'}] ${t.title} (${t.date || '?'})${t.detail ? ': ' + t.detail : ''}`)
    }
  }

  // Subscription
  if (subscription) {
    parts.push(`\n=== SUBSCRIPTION: ${(subscription.plan || 'free').toUpperCase()} ===`)
  }

  return parts.join('\n')
}

/**
 * Call Google Gemini API with full health context
 */
async function callGemini(userMessage, healthContext, conversationHistory) {
  if (!GEMINI_API_KEY) return null

  const messages = []

  // Add conversation history (last 6 messages for context)
  if (conversationHistory?.length) {
    for (const msg of conversationHistory.slice(-6)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })
    }
  }

  // Current user message with health context
  messages.push({
    role: 'user',
    parts: [{
      text: `${userMessage}\n\n--- USER'S COMPLETE HEALTH DATA ---\n${healthContext}`
    }]
  })

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  }

  try {
    const res = await fetch(GEMINI_URL + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[Gemini] API error:', res.status, errText)
      return null
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text || null
  } catch (err) {
    console.error('[Gemini] Fetch error:', err.message)
    return null
  }
}

/**
 * Check rate limit for a user
 * Free: 10 messages/day, Premium: 100 messages/day
 */
function checkRateLimit(userId, isPremium) {
  const now = Date.now()
  const limit = isPremium ? 100 : 10
  const key = userId.toString()

  let entry = rateLimits.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 }
    rateLimits.set(key, entry)
  }

  if (entry.count >= limit) {
    const hoursLeft = Math.ceil((entry.resetAt - now) / (60 * 60 * 1000))
    return { allowed: false, remaining: 0, hoursLeft, limit }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, limit }
}

/**
 * Clean up old rate limit entries every hour
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimits) {
    if (now > entry.resetAt) rateLimits.delete(key)
  }
}, 60 * 60 * 1000)

function isGeminiConfigured() {
  return !!GEMINI_API_KEY
}

export {
  buildFullHealthContext,
  callGemini,
  checkRateLimit,
  isGeminiConfigured,
  SYSTEM_PROMPT,
}
