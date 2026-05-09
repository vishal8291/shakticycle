import 'dotenv/config'
import { createServer } from 'node:http'
import { createHash, randomInt, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import Busboy from 'busboy'
import jwt from 'jsonwebtoken'
import { connectDatabase } from './db/connect.js'
import DailyLog from './models/DailyLog.js'
import HealthRecord from './models/HealthRecord.js'
import Subscription from './models/Subscription.js'
import User from './models/User.js'
import { createConsentRequest, discoverCareContexts, getAbdmRuntime, importConsentedRecords } from './services/abdmService.js'
import { extractReportDetails } from './services/reportExtraction.js'
import { analyzeReportForHealthMapAi } from './services/healthMapAi.js'
import { emailConfigured, sendAppointmentReminderEmail, sendAppointmentReminderSms, sendMobileOtpMessage, sendPasswordResetEmail, smsConfigured } from './services/messagingService.js'
import { sendPushToUser } from './services/pushService.js'
import { createRazorpayOrder, verifyRazorpaySignature, isPaymentConfigured, getRazorpayKeyId } from './services/paymentService.js'
import Payment from './models/Payment.js'
import { INDIAN_FOODS, CONDITION_FOODS, MEAL_PLANS, getFoodsForCondition, searchFoods, getFoodsByCategory, getMealPlan } from './data/indianFoods.js'
import { buildFullHealthContext, callGemini, checkRateLimit, isGeminiConfigured } from './services/aiService.js'
import {
  validateAppointment,
  validateConsultation,
  validateEmergencyInfo,
  validateForgotPassword,
  validateGoogleLogin,
  validateLogin,
  validateMobileOtpRequest,
  validateMobileOtpVerify,
  validateMedication,
  validatePatient,
  validateReport,
  validateResetPassword,
  validateSignup,
  validateTimeline,
  validateVital,
} from './validation/recordValidation.js'

const PORT = Number(process.env.PORT || 3001)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const JWT_SECRET = process.env.JWT_SECRET || ''
const MAX_BODY_BYTES = 50 * 1024
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const UPLOAD_DIR = resolve('server/uploads')
const isProd = process.env.NODE_ENV === 'production'

if (!JWT_SECRET || JWT_SECRET === 'dev-secret-change-me') {
  throw new Error('JWT_SECRET environment variable must be set to a secure random value before starting the server.')
}

if (JWT_SECRET.length < 24) {
  console.warn('JWT_SECRET is shorter than recommended. Use a longer random secret.')
}

const authRateLimit = new Map()
const apiRateLimit = new Map()

const sentReminderKeys = new Set()

function getReminderOffsetMs(reminder) {
  const value = String(reminder || '').toLowerCase()
  if (value.includes('1 day')) return 24 * 60 * 60 * 1000
  if (value.includes('3 hours')) return 3 * 60 * 60 * 1000
  if (value.includes('1 hour')) return 60 * 60 * 1000
  if (value.includes('same day')) return 6 * 60 * 60 * 1000
  return null
}

function getAppointmentDateTime(appointment) {
  return new Date(`${appointment.date}T${appointment.time || '09:00'}:00`)
}

async function processAppointmentReminders() {
  const records = await HealthRecord.find({ 'appointments.status': 'Scheduled' }).lean()
  if (!records.length) return

  const userIds = records.map((record) => record.userId)
  const users = await User.find({ _id: { $in: userIds } })
  const userMap = new Map(users.map((user) => [String(user._id), user]))

  for (const record of records) {
    const user = userMap.get(String(record.userId))
    if (!user?.email) continue

    for (const appointment of record.appointments || []) {
      if (appointment.status !== 'Scheduled') continue
      const offset = getReminderOffsetMs(appointment.reminder)
      if (!offset) continue
      const appointmentTime = getAppointmentDateTime(appointment).getTime()
      const delta = appointmentTime - Date.now()
      if (delta <= 0 || delta > offset) continue

      const reminderKey = `${record.userId}-${appointment.id}-${appointment.date}-${appointment.time}-${appointment.reminder}`
      if (sentReminderKeys.has(reminderKey)) continue

      if (emailConfigured()) {
        await sendAppointmentReminderEmail({ to: user.email, name: user.fullName, appointment })
      }
      if (smsConfigured() && user.mobileNumber) {
        await sendAppointmentReminderSms({ mobileNumber: user.mobileNumber, appointment })
      }
      const hasPushTokens = (user.pushTokens || []).length > 0
      if (hasPushTokens) {
        await sendPushToUser(user, {
          title: appointment.title || 'Upcoming appointment',
          body: `${appointment.doctor ? appointment.doctor + ' · ' : ''}${appointment.date}${appointment.time ? ' ' + appointment.time : ''}${appointment.location ? ' · ' + appointment.location : ''}`,
          data: { type: 'appointment', appointmentId: appointment.id },
        })
      }
      if (!emailConfigured() && !(smsConfigured() && user.mobileNumber) && !hasPushTokens) {
        continue
      }
      sentReminderKeys.add(reminderKey)
    }
  }
}

function buildDefaultRecord(user) {
  return {
    userId: user._id,
    patient: {
      name: user.fullName,
      dob: '',
      sex: '',
      age: 0,
      bloodGroup: '',
      primaryDoctor: '',
      emergencyContact: '',
      conditions: [],
      allergies: [],
      abhaNumber: '',
      abhaAddress: '',
      abdmLinked: false,
      consentStatus: 'Not connected',
      lastAbdmSync: '',
    },
    emergencyInfo: {
      primaryContactName: '',
      primaryContactPhone: '',
      secondaryContactName: '',
      secondaryContactPhone: '',
      preferredHospital: '',
      insuranceProvider: '',
      allergiesNote: '',
      emergencyNotes: '',
    },
    timeline: [
      {
        id: 1,
        date: new Date().toISOString().slice(0, 10),
        title: 'Account created',
        detail: 'Welcome to HealthMap. Start adding your medical history and health records.',
        type: 'System',
      },
    ],
    reports: [],
    medications: [],
    consultations: [],
    appointments: [],
    vitals: [],
    importedRecords: [],
    careContexts: [],
    consentRequests: [],
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': CLIENT_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  response.end(JSON.stringify(payload))
}

function sendFile(response, filePath, mimeType) {
  response.writeHead(200, {
    'Content-Type': mimeType || 'application/octet-stream',
    'Access-Control-Allow-Origin': CLIENT_ORIGIN,
  })
  createReadStream(filePath).pipe(response)
}

// Only trust X-Forwarded-For when TRUST_PROXY=true (i.e. running behind Render/Nginx reverse proxy).
// Without this flag an attacker can rotate IPs by forging the header and bypass rate limits.
const TRUST_PROXY = process.env.TRUST_PROXY === 'true'

function getClientKey(request) {
  if (TRUST_PROXY) {
    const forwarded = request.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim()
  }
  return request.socket.remoteAddress || 'unknown'
}

function applyRateLimit(store, key, limit, windowMs) {
  const now = Date.now()
  const current = store.get(key)
  if (!current || current.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + windowMs })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  store.set(key, current)
  return true
}

function enforceRateLimit(request, response, limitType = 'api') {
  const key = `${limitType}:${getClientKey(request)}`
  const config = limitType === 'auth'
    ? { store: authRateLimit, limit: 10, windowMs: 10 * 60 * 1000, message: 'Too many authentication attempts. Please wait and try again.' }
    : { store: apiRateLimit, limit: 200, windowMs: 15 * 60 * 1000, message: 'Too many API requests. Please slow down and try again shortly.' }

  if (applyRateLimit(config.store, key, config.limit, config.windowMs)) return true
  sendJson(response, 429, { error: config.message })
  return false
}

async function readBody(request) {
  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY_BYTES) throw new Error('Request body is too large.')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('Request body must be valid JSON.')
  }
}

async function readMultipart(request) {
  await mkdir(UPLOAD_DIR, { recursive: true })
  return new Promise((resolvePromise, rejectPromise) => {
    const fields = {}
    let fileMeta = null
    let fileSize = 0
    const fileChunks = []
    let failed = false

    const busboy = Busboy({ headers: request.headers, limits: { files: 1, fileSize: MAX_UPLOAD_BYTES, fields: 10 } })

    busboy.on('field', (name, value) => {
      fields[name] = value
    })

    busboy.on('file', (name, file, info) => {
      // Strict allowlist: only PDF and common image formats (medical reports)
      const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
      const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp'])
      const clientMime = (info.mimeType || '').toLowerCase().split(';')[0].trim()
      const extension = extname(info.filename || '').toLowerCase()
      if (!ALLOWED_MIME.has(clientMime) || !ALLOWED_EXT.has(extension)) {
        failed = true
        rejectPromise(new Error('Only PDF, JPG, PNG, and WebP files are allowed.'))
        file.resume() // drain and discard the stream
        return
      }
      const safeBase = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      const savedName = `${safeBase}${extension}`
      const filePath = join(UPLOAD_DIR, savedName)
      fileMeta = {
        fieldName: name,
        originalFileName: info.filename || 'upload',
        mimeType: clientMime,
        fileName: savedName,
        filePath,
      }

      file.on('data', (chunk) => {
        fileSize += chunk.length
        fileChunks.push(chunk)
      })

      file.on('limit', () => {
        failed = true
        rejectPromise(new Error('Uploaded file is too large. Limit is 5 MB.'))
      })
    })

    busboy.on('finish', async () => {
      if (failed) return
      try {
        if (fileMeta && fileChunks.length > 0) {
          await writeFile(fileMeta.filePath, Buffer.concat(fileChunks))
          fileMeta.sizeBytes = fileSize
          fileMeta.fileUrl = `/uploads/${fileMeta.fileName}`
        }
        resolvePromise({ fields, file: fileMeta })
      } catch (error) {
        rejectPromise(error)
      }
    })

    busboy.on('error', rejectPromise)
    request.pipe(busboy)
  })
}

const DISCLAIMER = '\n\n⚕️ Note: This is AI-generated health guidance, not medical advice. Always consult your doctor for diagnosis and treatment.'

function generateAiChatReply(message) {
  const msg = (message || '').toLowerCase().trim()

  // Greetings
  if (/^(hi|hello|hey|good\s?(morning|afternoon|evening)|howdy|namaste)\b/.test(msg)) {
    return 'Hello! I\'m VishalBytes, your AI health assistant. I can help with questions about symptoms, medications, vitals, nutrition, fitness, mental health, and much more. What would you like to know?' + DISCLAIMER
  }

  // EMERGENCY — always prioritize
  if (/chest\s?pain|heart\s?attack|can\'?t\s?breathe|breathing\s?difficulty|stroke|unconscious|seizure|severe\s?bleeding|choking/.test(msg)) {
    return '🚨 EMERGENCY: This sounds like it could be a medical emergency. Please call emergency services (112/108 in India, 911 in US) IMMEDIATELY. While waiting: stay calm, sit upright if having breathing difficulty, do not eat or drink anything, and have someone stay with you. Do NOT delay seeking help.' + DISCLAIMER
  }

  // Headache & Migraine
  if (/headache|head\s?ache|migraine/.test(msg)) {
    return '🤕 Headaches can stem from dehydration, tension, sinus issues, or migraines. Immediate tips: drink water, rest in a quiet dark room, apply a cold compress to your forehead, and try OTC pain relief like paracetamol. For migraines, avoid bright lights and loud sounds. See a doctor if: headaches are sudden and severe ("thunderclap"), occur with fever/stiff neck, follow a head injury, or happen frequently (3+ times/week).' + DISCLAIMER
  }

  // Fever
  if (/fever|temperature|pyrexia/.test(msg)) {
    return '🌡️ Fever (above 100.4°F/38°C) is your body\'s response to infection. Tips: rest well, stay hydrated with water and electrolytes, wear light clothing, and take paracetamol if needed. Sponge with lukewarm water (not cold). See a doctor if: fever exceeds 103°F/39.4°C, lasts more than 3 days, comes with rash, stiff neck, confusion, or difficulty breathing.' + DISCLAIMER
  }

  // Cold & Flu
  if (/cold|flu|influenza|sore\s?throat|runny\s?nose|congestion|sneez/.test(msg)) {
    return '🤧 Common cold/flu tips: rest adequately, drink warm fluids (soup, tea, warm water with honey and lemon), gargle with warm salt water for sore throat, use steam inhalation for congestion, and wash hands frequently. OTC antihistamines and decongestants may help. See a doctor if: symptoms worsen after 7 days, you have high fever, chest pain, or difficulty breathing.' + DISCLAIMER
  }

  // Cough
  if (/cough|coughing/.test(msg)) {
    return '😷 For cough management: stay hydrated, use honey in warm water (not for children under 1), try steam inhalation, avoid irritants like smoke and dust, and elevate your head while sleeping. Dry cough: lozenges or OTC suppressants. Wet cough: expectorants may help. See a doctor if: cough lasts more than 3 weeks, produces blood-tinged mucus, or comes with fever/weight loss.' + DISCLAIMER
  }

  // Stomach & Digestion
  if (/stomach|abdomen|abdominal|digest|gastric|acidity|acid\s?reflux|gerd|bloat|nausea|vomit|diarr|constipat/.test(msg)) {
    return '🤢 Digestive issues tips: eat smaller frequent meals, avoid spicy/oily/fried food, don\'t lie down right after eating, stay hydrated, eat fiber-rich foods for constipation, and try the BRAT diet (bananas, rice, applesauce, toast) for diarrhea. For acidity: avoid coffee, alcohol, and late-night meals. See a doctor if: pain is severe, persistent, there\'s blood in stool/vomit, or symptoms last more than a week.' + DISCLAIMER
  }

  // Back Pain
  if (/back\s?pain|spine|sciatica|lower\s?back|lumbar/.test(msg)) {
    return '🔙 Back pain management: apply ice (first 48 hours) then heat, maintain good posture, avoid prolonged sitting, do gentle stretching exercises, sleep on a firm mattress (side position with pillow between knees), and strengthen your core muscles. OTC anti-inflammatories can help temporarily. See a doctor if: pain radiates down your legs, causes numbness/weakness, follows an injury, or doesn\'t improve in 2 weeks.' + DISCLAIMER
  }

  // Blood Pressure
  if (/blood\s?pressure|bp\b|hypertension|hypotension/.test(msg)) {
    return '💓 Normal BP: ~120/80 mmHg. High BP (>140/90) management: reduce salt to <5g/day, exercise 30 min most days, maintain healthy weight, limit alcohol, manage stress, eat potassium-rich foods (bananas, spinach), and take prescribed medications regularly. Low BP (<90/60): increase fluid and salt intake, rise slowly from sitting. Monitor at home and see your doctor for readings consistently outside normal range.' + DISCLAIMER
  }

  // Diabetes / Blood Sugar
  if (/sugar|glucose|diabet|hba1c|insulin/.test(msg)) {
    return '🩸 Blood sugar management: eat balanced meals with complex carbs (whole grains, legumes), avoid refined sugars and white flour, include protein and fiber in every meal, exercise regularly (150 min/week), monitor blood glucose as advised, take medications on time, manage stress, and get regular HbA1c tests. Normal fasting: 70-100 mg/dL. Post-meal (<140 mg/dL). See your doctor for readings outside these ranges or if you experience excessive thirst/urination.' + DISCLAIMER
  }

  // Cholesterol
  if (/cholesterol|ldl|hdl|triglycerid|lipid/.test(msg)) {
    return '🫀 Healthy cholesterol tips: limit saturated fats (red meat, full-fat dairy), avoid trans fats, eat omega-3 rich foods (fish, walnuts, flaxseed), increase soluble fiber (oats, beans, fruits), exercise regularly, maintain healthy weight, and quit smoking. Ideal: Total <200, LDL <100, HDL >40 (men) / >50 (women), Triglycerides <150 mg/dL. Get a lipid panel every 4-6 years, or annually if at risk.' + DISCLAIMER
  }

  // Thyroid
  if (/thyroid|tsh|t3|t4|hypothyroid|hyperthyroid/.test(msg)) {
    return '🦋 Thyroid health: take thyroid medication on an empty stomach (30-60 min before food), get TSH tested every 6-12 months, eat iodine-rich foods (iodized salt, seafood), manage stress, and exercise regularly. Hypothyroid symptoms: fatigue, weight gain, cold intolerance, constipation. Hyperthyroid: weight loss, rapid heartbeat, anxiety. See your doctor if symptoms change or TSH is outside 0.4-4.0 mIU/L range.' + DISCLAIMER
  }

  // Anemia
  if (/anemia|anaemia|iron\s?deficiency|hemoglobin|haemoglobin|hb\b/.test(msg)) {
    return '🩸 Anemia management: eat iron-rich foods (spinach, lentils, red meat, fortified cereals), pair with Vitamin C (citrus, tomatoes) for better absorption, avoid tea/coffee with meals (inhibits iron absorption), take iron supplements if prescribed (on empty stomach), and get regular CBC tests. Normal Hb: 12-16 g/dL (women), 14-18 g/dL (men). See your doctor if you feel extreme fatigue, dizziness, or shortness of breath.' + DISCLAIMER
  }

  // Vitamins & Deficiency
  if (/vitamin|deficiency|supplement|calcium|d3|b12|folic/.test(msg)) {
    return '💊 Common deficiencies: Vitamin D — get 15-20 min sunlight daily, eat fortified foods, supplement if <20 ng/mL. B12 — found in meat, eggs, dairy; vegetarians may need supplements. Iron — see anemia tips above. Calcium — dairy, leafy greens, fortified foods; adults need 1000-1200 mg/day. Folic acid — crucial during pregnancy; eat leafy greens, legumes. Get tested before starting supplements as excess can be harmful.' + DISCLAIMER
  }

  // Skin
  if (/skin|acne|rash|eczema|psoriasis|dermat|itch|allerg.*skin|hives/.test(msg)) {
    return '🧴 Skin health tips: keep skin clean and moisturized, use mild/fragrance-free products, apply sunscreen SPF 30+ daily, stay hydrated, avoid harsh scrubbing, and don\'t pop pimples. For acne: try benzoyl peroxide or salicylic acid products. For rashes: identify and avoid triggers, use calamine for itching. See a dermatologist if: rashes spread or don\'t improve, there\'s pain/swelling, changes in moles, or persistent acne scarring.' + DISCLAIMER
  }

  // Eye
  if (/eye|vision|sight|glasses|dry\s?eye|blur/.test(msg)) {
    return '👁️ Eye care tips: follow the 20-20-20 rule (every 20 min, look 20 feet away for 20 seconds), maintain adequate lighting when reading, wear UV-protective sunglasses outdoors, stay hydrated, eat vitamin A-rich foods (carrots, sweet potatoes), and get eye exams every 1-2 years. For dry eyes: use lubricating eye drops, blink frequently. See an ophthalmologist if: sudden vision changes, flashes of light, eye pain, or persistent redness.' + DISCLAIMER
  }

  // Dental
  if (/dental|teeth|tooth|gum|cavity|mouth\s?ulcer|oral/.test(msg)) {
    return '🦷 Dental health: brush twice daily with fluoride toothpaste, floss daily, limit sugary foods/drinks, replace toothbrush every 3 months, and visit your dentist every 6 months. For mouth ulcers: rinse with warm salt water, avoid spicy food, use OTC oral gels. For toothache: rinse with warm salt water and take OTC pain relief. See a dentist urgently if: severe pain, swelling, bleeding gums, or loose teeth.' + DISCLAIMER
  }

  // Allergies
  if (/allerg|histamine|hay\s?fever|pollen|dust\s?mite|food\s?allergy/.test(msg)) {
    return '🤧 Allergy management: identify and avoid triggers, keep windows closed during high pollen days, use air purifiers, wash bedding weekly in hot water, take antihistamines as needed, and carry prescribed epinephrine if you have severe allergies. For food allergies: read labels carefully and inform restaurants. See a doctor for: allergy testing, immunotherapy options, or if you experience anaphylaxis (swelling, difficulty breathing).' + DISCLAIMER
  }

  // Asthma & Respiratory
  if (/asthma|wheez|inhaler|bronch|respiratory/.test(msg)) {
    return '🌬️ Asthma management: take controller medications daily as prescribed, always carry your rescue inhaler, avoid triggers (smoke, dust, cold air, strong odors), use peak flow meter regularly, keep home dust-free, and get flu vaccine annually. During an attack: sit upright, stay calm, use rescue inhaler (2 puffs every 20 min up to 3 times). Call emergency services if: no improvement after 3 rounds, lips turn blue, or difficulty speaking.' + DISCLAIMER
  }

  // Heart
  if (/heart|cardiac|palpitation|arrhythm|coronary/.test(msg)) {
    return '❤️ Heart health: exercise regularly (150 min/week moderate), eat a heart-healthy diet (Mediterranean-style), manage blood pressure and cholesterol, quit smoking, limit alcohol, maintain healthy weight, manage stress and diabetes, and get regular checkups. For palpitations: reduce caffeine, practice deep breathing, stay hydrated. See a cardiologist if: chest discomfort, shortness of breath during activity, irregular heartbeat, or family history of heart disease.' + DISCLAIMER
  }

  // Kidney
  if (/kidney|renal|creatinine|urine|urinary|uti|kidney\s?stone/.test(msg)) {
    return '🫘 Kidney health: drink 8-10 glasses of water daily, limit salt and processed foods, control blood pressure and blood sugar, avoid excessive painkillers (NSAIDs), and get annual kidney function tests (creatinine, eGFR). For UTIs: increase water intake, urinate frequently, maintain hygiene. For kidney stones: increase fluids dramatically, reduce oxalate-rich foods. See a doctor if: pain in flanks, blood in urine, painful urination, or swelling in feet.' + DISCLAIMER
  }

  // Liver
  if (/liver|hepat|jaundice|fatty\s?liver|bilirubin|sgpt|sgot|alt\b|ast\b/.test(msg)) {
    return '🫁 Liver health: limit alcohol consumption, maintain healthy weight, eat a balanced diet low in saturated fats, exercise regularly, avoid unnecessary medications, get hepatitis vaccinations, and drink coffee moderately (may be protective). For fatty liver: weight loss of 5-10% can significantly help. Get LFTs (liver function tests) annually. See a doctor if: yellowing of skin/eyes, dark urine, abdominal swelling, or persistent fatigue.' + DISCLAIMER
  }

  // Weight Loss
  if (/weight\s?loss|lose\s?weight|slim|overweight|obese|bmi/.test(msg)) {
    return '⚖️ Healthy weight loss tips: aim for 0.5-1 kg/week, create a moderate calorie deficit (500 cal/day), eat protein-rich meals to stay fuller longer, include fiber-rich vegetables, drink water before meals, exercise 150-300 min/week (mix cardio and strength), sleep 7-9 hours, avoid crash diets, and track your progress. Healthy BMI: 18.5-24.9. See a doctor before starting if you have underlying conditions.' + DISCLAIMER
  }

  // Weight Gain
  if (/weight\s?gain|gain\s?weight|underweight|thin|skinny|bulk/.test(msg)) {
    return '💪 Healthy weight gain: eat calorie-dense nutritious foods (nuts, avocados, whole grains, dairy), eat more frequently (5-6 smaller meals), add healthy fats and proteins, do strength training exercises, drink smoothies/shakes between meals, and ensure adequate sleep. Aim for 0.5 kg/week gain. See a doctor if: unexplained weight changes, loss of appetite, or if BMI is below 18.5.' + DISCLAIMER
  }

  // Pregnancy
  if (/pregnan|prenatal|trimester|morning\s?sickness|fetal|obstetric/.test(msg)) {
    return '🤰 Pregnancy wellness: take prenatal vitamins (especially folic acid), attend all scheduled check-ups, eat balanced meals rich in iron, calcium and protein, stay hydrated, exercise gently (walking, prenatal yoga), avoid alcohol/smoking/raw foods, get adequate rest, and monitor baby movements in later trimesters. For morning sickness: eat small frequent meals, try ginger tea. See your doctor immediately if: bleeding, severe pain, reduced baby movement, or sudden swelling.' + DISCLAIMER
  }

  // Mental Health / Depression
  if (/depress|mental\s?health|sad|lonely|hopeless|suicide|self.?harm/.test(msg)) {
    return '🧠 Mental health matters. If you\'re struggling: talk to someone you trust, maintain a daily routine, get regular exercise and sunlight, practice mindfulness or meditation, limit alcohol, and prioritize sleep. Professional help (therapy, counseling) is highly effective — there\'s no shame in seeking it. For crisis: call iCall (9152987821), Vandrevala Foundation (1860-2662-345), or AASRA (9820466726). You are not alone, and help is available.' + DISCLAIMER
  }

  // Sleep & Insomnia
  if (/sleep|insomnia|can\'?t\s?sleep|restless/.test(msg)) {
    return '😴 Sleep hygiene: maintain consistent sleep/wake times (even weekends), create a cool/dark/quiet bedroom, avoid screens 60 min before bed, limit caffeine after 2 PM, exercise during the day (not close to bedtime), try relaxation techniques (4-7-8 breathing, progressive relaxation), avoid heavy meals before bed, and limit naps to 20 min. Adults need 7-9 hours. See a doctor if: insomnia lasts >4 weeks, you snore loudly, or feel excessively sleepy during the day.' + DISCLAIMER
  }

  // Stress & Anxiety
  if (/stress|anxiety|anxious|worried|panic|nervous|overwhelm/.test(msg)) {
    return '🧘 Stress management: practice deep breathing (inhale 4s, hold 4s, exhale 6s), try progressive muscle relaxation, exercise regularly, maintain social connections, limit news/social media, prioritize sleep, journal your thoughts, try the 5-4-3-2-1 grounding technique (5 things you see, 4 hear, 3 touch, 2 smell, 1 taste). For panic attacks: slow breathing, remind yourself it will pass. Consider therapy (CBT is very effective) if anxiety is persistent.' + DISCLAIMER
  }

  // Indian food specific queries
  if (/\b(indian\s?food|desi\s?food|desi\s?diet|roti|dal\b|sabzi|khichdi|idli|dosa|paratha|biryani|rajma|chole|paneer|chapati)\b/.test(msg)) {
    const plan = MEAL_PLANS.balanced
    const mealLines = Object.entries(plan.meals).map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`).join('\n')
    return `🍛 Here\'s a balanced Indian diet plan:\n\n${mealLines}\n\n💡 Key Indian superfoods: Ragi (calcium+iron), Bajra (iron), Amla (Vitamin C), Turmeric (anti-inflammatory), Dahi (probiotics), Moong dal (easy protein).\n\nTip: Replace white rice with millets (jowar/bajra/ragi) for better nutrition. Use our Food Guide (in More menu) to explore 100+ Indian foods with nutrition data!` + DISCLAIMER
  }

  // Condition-specific diet queries
  if (/diabetes.*(?:diet|food|eat|kha)|(?:diet|food|eat|kha).*diabetes|sugar.*(?:diet|food|control)|what.*eat.*sugar/.test(msg)) {
    const cond = CONDITION_FOODS.diabetes
    const tips = cond.tips.slice(0, 5).map(t => `• ${t}`).join('\n')
    const foods = cond.recommended.slice(0, 8).map(id => INDIAN_FOODS.find(f => f.id === id)?.name).filter(Boolean).join(', ')
    return `🩸 Diabetes-Friendly Indian Diet:\n\n✅ Best foods: ${foods}\n\n${tips}\n\n🍽️ Sample meal: Methi water (morning) → Besan chilla (breakfast) → Bajra roti + karela sabzi + dal (lunch) → Sprouts (snack) → Khichdi + lauki (dinner)\n\nCheck the Food Guide in the More menu for the complete diabetes diet plan!` + DISCLAIMER
  }

  if (/(?:bp|blood\s?pressure|hypertension).*(?:diet|food|eat)|(?:diet|food|eat).*(?:bp|blood\s?pressure)/.test(msg)) {
    const cond = CONDITION_FOODS.hypertension
    const tips = cond.tips.slice(0, 4).map(t => `• ${t}`).join('\n')
    return `💓 Foods for Blood Pressure Control:\n\n✅ Include: Banana, spinach, beetroot, coconut water, garlic, flaxseed, dahi\n❌ Limit: Salt, pickles, papad, processed foods, excess ghee\n\n${tips}\n\n🥤 Try daily: Beetroot juice + a pinch of black pepper = natural BP reducer!` + DISCLAIMER
  }

  if (/(?:weight\s?loss|lose\s?weight|slim|fat\s?loss).*(?:diet|food|eat|plan)|(?:diet|food|eat|plan).*(?:weight\s?loss|lose\s?weight)/.test(msg)) {
    const plan = MEAL_PLANS.weight_loss_plan
    const mealLines = Object.entries(plan.meals).map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`).join('\n')
    return `⚖️ Indian Weight Loss Diet Plan:\n\n${mealLines}\n\n💡 Key rules:\n• Replace rice with millets\n• Protein in every meal\n• No eating after 8 PM\n• Chaach > lassi, Sprouts > pakoras\n• Walk 10,000 steps daily` + DISCLAIMER
  }

  if (/(?:pregnan|garbh).*(?:diet|food|eat|kha)|(?:diet|food|eat|kha).*(?:pregnan|garbh)/.test(msg)) {
    const plan = MEAL_PLANS.pregnancy_plan
    const mealLines = Object.entries(plan.meals).map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v}`).join('\n')
    return `🤰 Pregnancy Nutrition Plan (Indian):\n\n${mealLines}\n\n⚠️ Avoid: Raw papaya, excess caffeine, raw/undercooked meat, unpasteurized dairy\n✅ Focus: Iron (palak, ragi), Calcium (milk, dahi), Folic acid (methi, dal), DHA (walnuts, fish)` + DISCLAIMER
  }

  if (/(?:anemia|anaemia|iron|hemoglobin|hb\b).*(?:diet|food|eat)|(?:diet|food|eat).*(?:anemia|iron)/.test(msg)) {
    const cond = CONDITION_FOODS.anemia
    const tips = cond.tips.slice(0, 5).map(t => `• ${t}`).join('\n')
    return `🩸 Iron-Rich Indian Diet for Anemia:\n\n✅ Top foods: Spinach (palak), Beetroot, Pomegranate, Ragi, Bajra, Masoor dal, Jaggery, Dates\n\n${tips}\n\n🥤 Power drink: Beetroot + Pomegranate + Amla juice — have it 3x/week for better hemoglobin!` + DISCLAIMER
  }

  if (/(?:cholesterol|ldl|hdl).*(?:diet|food|eat)|(?:diet|food|eat).*cholesterol/.test(msg)) {
    const cond = CONDITION_FOODS.cholesterol
    const tips = cond.tips.slice(0, 5).map(t => `• ${t}`).join('\n')
    return `🫀 Heart-Healthy Indian Diet for Cholesterol:\n\n✅ Include: Oats, flaxseed, walnuts, garlic, amla, green tea, fish\n❌ Limit: Ghee, butter, full-fat paneer, red meat, fried foods\n\n${tips}\n\nCheck the Food Guide in More menu for the complete heart-healthy meal plan!` + DISCLAIMER
  }

  if (/(?:immunity|immune|immun).*(?:diet|food|eat|boost)|(?:boost|food|eat).*immun/.test(msg)) {
    const cond = CONDITION_FOODS.immunity
    const tips = cond.tips.slice(0, 5).map(t => `• ${t}`).join('\n')
    return `🛡️ Immunity-Boosting Indian Foods:\n\n✅ Superfoods: Turmeric, Amla, Ginger, Garlic, Tulsi, Dahi, Green tea\n\n${tips}\n\n🍵 Daily kadha: Boil tulsi + ginger + dalchini + black pepper in water, add honey when warm. Best immune booster!` + DISCLAIMER
  }

  // General Diet & Nutrition (enhanced with Indian context)
  if (/diet|nutrition|food|eat|meal|calor/.test(msg)) {
    return '🥗 Balanced Indian Nutrition:\n\n🍽️ Plate method: ½ vegetables/salad + ¼ whole grains (roti/millet) + ¼ protein (dal/paneer/egg)\n\n💡 Indian superfoods to eat daily:\n• Haldi (turmeric) — anti-inflammatory\n• Dahi (curd) — probiotics for gut health\n• Dal — affordable complete protein\n• Amla — richest Vitamin C source\n• Ragi/Bajra — calcium + iron\n\nTip: Explore our Food Guide (More menu) for 100+ Indian foods with nutrition data, condition-specific diets, and meal plans!\n\nAsk me about diet for specific conditions: diabetes, BP, weight loss, pregnancy, anemia, cholesterol, immunity, or thyroid.' + DISCLAIMER
  }

  // Exercise & Fitness
  if (/exercise|workout|fitness|physical\s?activity|gym|run|jog|yoga|walk/.test(msg)) {
    return '🏃 Exercise guidelines: 150-300 min moderate OR 75-150 min vigorous aerobic activity per week, plus 2+ days of strength training. Start gradually (10-15 min walks), warm up before and cool down after, stay hydrated, rest between intense sessions, and listen to your body. Great options: walking, swimming, cycling, yoga, bodyweight exercises. Exercise improves heart health, mood, sleep, immunity, and longevity. See a doctor before starting intense exercise if you have health conditions.' + DISCLAIMER
  }

  // Hydration & Water
  if (/water|hydrat|dehydrat|fluid|thirst/.test(msg)) {
    return '💧 Hydration tips: drink 2-3 liters of water daily (more in heat/exercise), start your day with a glass of water, carry a water bottle, eat water-rich foods (cucumber, watermelon, oranges), set reminders to drink regularly, and check urine color (pale yellow = well hydrated). Signs of dehydration: dark urine, headache, fatigue, dizziness, dry mouth. Increase intake if: exercising, ill with fever/diarrhea, in hot weather, or pregnant/breastfeeding.' + DISCLAIMER
  }

  // Vaccination
  if (/vaccin|immuniz|booster|shot/.test(msg)) {
    return '💉 Stay up to date with vaccinations. Key adult vaccines: annual flu shot, COVID-19 boosters as recommended, Td/Tdap every 10 years, hepatitis B (if not vaccinated), HPV (up to age 26), pneumococcal (65+), shingles (50+). Keep a vaccination record in your HealthMap profile. Side effects are usually mild (soreness, low fever). See your doctor for a personalized vaccination schedule based on your age and health conditions.' + DISCLAIMER
  }

  // First Aid
  if (/first\s?aid|burn|cut|wound|bleed|sprain|fracture|broken\s?bone/.test(msg)) {
    return '🩹 Basic first aid: For cuts — clean with water, apply pressure to stop bleeding, use antiseptic and bandage. For burns — cool under running water 10-20 min (no ice/butter), cover loosely. For sprains — RICE (Rest, Ice, Compression, Elevation). For nosebleed — lean forward, pinch soft part of nose for 10 min. For choking — 5 back blows then 5 abdominal thrusts. Seek emergency care for: deep wounds, burns larger than palm, suspected fractures, or severe bleeding.' + DISCLAIMER
  }

  // Medicines & Medication
  if (/medic|medicine|drug|prescription|dose|dosage|side\s?effect|tablet|capsule/.test(msg)) {
    return '💊 Medication safety: take medicines exactly as prescribed (right dose, right time), don\'t skip doses or stop early (especially antibiotics), read labels for storage instructions, track medications in your HealthMap profile, set reminders, inform your doctor about all medications you take (including supplements), report any side effects, never share prescriptions, and keep medicines out of children\'s reach. Ask your pharmacist about food/drug interactions.' + DISCLAIMER
  }

  // General health / default
  return 'I appreciate your question! While I may not have specific information on that exact topic, here are some general wellness tips: stay hydrated, eat a balanced diet, exercise regularly, sleep 7-9 hours, manage stress, attend regular check-ups, and keep your HealthMap profile updated for better health tracking. You can ask me about specific topics like blood pressure, diabetes, nutrition, mental health, sleep, exercise, medications, and many more!' + DISCLAIMER
}

function createId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function hashResetCode(code) {
  return createHash('sha256').update(code).digest('hex')
}

function sanitizeUser(user) {
  return {
    id: user._id?.toString?.() || user.id,
    fullName: user.fullName,
    email: user.email,
    mobileNumber: user.mobileNumber || '',
    avatarUrl: user.avatarUrl || '',
    role: user.role,
  }
}

async function verifyGoogleCredential(credential) {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google sign-in is not configured on the server yet.')
  const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
  if (!googleResponse.ok) throw new Error('Google sign-in could not be verified.')
  const payload = await googleResponse.json()
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Google sign-in client mismatch.')
  if (payload.email_verified !== 'true' && payload.email_verified !== true) throw new Error('Google account email is not verified.')
  return {
    googleId: payload.sub,
    email: (payload.email || '').toLowerCase(),
    fullName: payload.name || 'Google user',
    avatarUrl: payload.picture || '',
  }
}

async function getUserFromRequest(request) {
  const header = request.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const token = header.slice(7)
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  const user = await User.findById(decoded.id)
  if (!user || user.banned) return null
  return user
}

async function getRecordForUser(userId) {
  let record = await HealthRecord.findOne({ userId }).lean()
  if (!record) {
    const user = await User.findById(userId)
    record = (await HealthRecord.create(buildDefaultRecord(user))).toObject()
  }
  delete record._id
  delete record.__v
  return record
}

async function saveRecord(record, userId) {
  const saved = await HealthRecord.findOneAndUpdate(
    { userId },
    { ...record, userId },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).lean()
  delete saved._id
  delete saved.__v
  return saved
}

async function enrichReportWithAi(report, patient) {
  const nextReport = {
    ...report,
    extractedPatient: { name: '', age: '', sex: '', reportDate: '', ...(report.extractedPatient || {}) },
    extractedObservations: Array.isArray(report.extractedObservations) ? report.extractedObservations : [],
  }

  let extraction = {
    extractionStatus: nextReport.extractionStatus || '',
    extractedSummary: nextReport.extractedSummary || '',
    extractedText: nextReport.extractedText || '',
    extractedObservations: nextReport.extractedObservations,
    extractedPatient: nextReport.extractedPatient,
  }

  if ((!extraction.extractedText || !extraction.extractedSummary) && nextReport.fileName) {
    try {
      const fileBuffer = await readFile(join(UPLOAD_DIR, nextReport.fileName))
      extraction = await extractReportDetails(fileBuffer, {
        fileName: nextReport.fileName,
        originalFileName: nextReport.originalFileName,
        mimeType: nextReport.mimeType,
      })
      nextReport.extractionStatus = extraction.extractionStatus
      nextReport.extractedSummary = extraction.extractedSummary
      nextReport.extractedText = extraction.extractedText
      nextReport.extractedObservations = extraction.extractedObservations
      nextReport.extractedPatient = extraction.extractedPatient
    } catch {
      // Keep existing extraction fields if the original file is unavailable.
    }
  }

  const aiResult = analyzeReportForHealthMapAi({ patient, report: nextReport, extraction })
  nextReport.aiStatus = aiResult.status
  nextReport.aiSummary = aiResult.safeOutput.safeSummary
  nextReport.aiStructuredData = aiResult.safeOutput.structuredData
  nextReport.aiSourceHighlights = aiResult.safeOutput.structuredData.sourceHighlights || []
  nextReport.aiGeneratedAt = aiResult.generatedAt
  nextReport.aiTimelineItems = aiResult.safeOutput.timelineSuggestions.map((item) => ({ id: createId(), ...item }))

  return nextReport
}

function addTimelineItem(record, item) {
  record.timeline.unshift({ id: createId(), ...item })
}

function parseItemId(url, prefix) {
  if (!url.startsWith(prefix)) return null
  const id = Number(url.slice(prefix.length))
  return Number.isFinite(id) ? id : null
}

function updateCollectionItem(record, key, id, nextValue) {
  let found = false
  record[key] = record[key].map((item) => {
    if (item.id !== id) return item
    found = true
    return { ...item, ...nextValue, id }
  })
  if (!found) throw new Error('Record item not found.')
}

function deleteCollectionItem(record, key, id) {
  const index = record[key].findIndex((item) => item.id === id)
  if (index === -1) throw new Error('Record item not found.')
  const [removed] = record[key].splice(index, 1)
  return removed
}

await connectDatabase()
await mkdir(UPLOAD_DIR, { recursive: true })

const server = createServer(async (request, response) => {
  const { method, url } = request

  if (method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': CLIENT_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    response.end()
    return
  }

  try {
    if (method === 'GET' && url === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'HealthMap API', database: 'mongodb', abdm: getAbdmRuntime() })
      return
    }

    if (method === 'GET' && url.startsWith('/uploads/')) {
      // Require authentication to access medical report files
      const fileUser = await getUserFromRequest(request).catch(() => null)
      if (!fileUser) {
        sendJson(response, 401, { error: 'Unauthorized' })
        return
      }
      // Prevent path traversal: only allow simple filenames, no slashes or dots that escape
      const rawName = url.replace('/uploads/', '').split('/')[0]
      const fileName = rawName.replace(/\.\./g, '')
      const filePath = resolve(join(UPLOAD_DIR, fileName))
      // Ensure resolved path stays inside UPLOAD_DIR
      if (!filePath.startsWith(UPLOAD_DIR + '/') && filePath !== UPLOAD_DIR) {
        sendJson(response, 403, { error: 'Forbidden' })
        return
      }
      const fileStat = await stat(filePath)
      if (!fileStat.isFile()) throw new Error('File not found.')
      // Force download; never render HTML/SVG in browser context
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Access-Control-Allow-Origin': CLIENT_ORIGIN,
      })
      createReadStream(filePath).pipe(response)
      return
    }

    if (method === 'POST' && url.startsWith('/api/auth/')) {
      if (!enforceRateLimit(request, response, 'auth')) return
    } else if (url.startsWith('/api/')) {
      if (!enforceRateLimit(request, response, 'api')) return
    }

    if (method === 'POST' && url === '/api/auth/signup') {
      const payload = validateSignup(await readBody(request))
      const lookup = [{ email: payload.email }]
      if (payload.mobileNumber) lookup.push({ mobileNumber: payload.mobileNumber })
      const existing = await User.findOne({ $or: lookup })
      if (existing) {
        sendJson(response, 409, { error: 'An account with this email or mobile number already exists.' })
        return
      }
      const passwordHash = await User.hashPassword(payload.password)
      const user = await User.create({ fullName: payload.fullName, email: payload.email, mobileNumber: payload.mobileNumber || undefined, passwordHash, role: 'patient' })
      await HealthRecord.create(buildDefaultRecord(user))
      sendJson(response, 201, { token: createToken(user), user: sanitizeUser(user) })
      return
    }

    if (method === 'POST' && url === '/api/auth/login') {
      const payload = validateLogin(await readBody(request))
      const query = payload.identifier.includes('@') ? { email: payload.identifier } : { mobileNumber: payload.identifier }
      const user = await User.findOne(query)
      if (!user || !(await user.comparePassword(payload.password))) {
        sendJson(response, 401, { error: 'Invalid email or mobile number, or password.' })
        return
      }
      sendJson(response, 200, { token: createToken(user), user: sanitizeUser(user) })
      return
    }

    if (method === 'POST' && url === '/api/auth/forgot-password') {
      const payload = validateForgotPassword(await readBody(request))
      const user = await User.findOne({ email: payload.email })
      if (user) {
        const resetCode = String(randomInt(100000, 1000000))
        user.passwordResetCodeHash = hashResetCode(resetCode)
        user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()
        await sendPasswordResetEmail({ to: user.email, name: user.fullName, code: resetCode })
        sendJson(response, 200, { message: 'If an account exists for this email, a reset code has been sent.' })
        return
      }
      sendJson(response, 200, { message: 'If an account exists for this email, a reset code has been prepared.' })
      return
    }

    if (method === 'POST' && url === '/api/auth/reset-password') {
      const payload = validateResetPassword(await readBody(request))
      const user = await User.findOne({ email: payload.email })
      if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
        sendJson(response, 400, { error: 'Reset code is invalid or has expired.' })
        return
      }
      if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
        user.passwordResetCodeHash = ''
        user.passwordResetExpiresAt = null
        await user.save()
        sendJson(response, 400, { error: 'Reset code is invalid or has expired.' })
        return
      }
      if (hashResetCode(payload.code) !== user.passwordResetCodeHash) {
        sendJson(response, 400, { error: 'Reset code is invalid or has expired.' })
        return
      }
      user.passwordHash = await User.hashPassword(payload.password)
      user.passwordResetCodeHash = ''
      user.passwordResetExpiresAt = null
      await user.save()
      sendJson(response, 200, { message: 'Password updated successfully. You can log in now.' })
      return
    }
    if (method === 'POST' && url === '/api/auth/request-mobile-otp') {
      const payload = validateMobileOtpRequest(await readBody(request))
      const user = await User.findOne({ mobileNumber: payload.mobileNumber })
      if (!user) {
        sendJson(response, 404, { error: 'No account found for this mobile number.' })
        return
      }
      const otpCode = String(randomInt(100000, 1000000))
      user.loginOtpCodeHash = hashResetCode(otpCode)
      user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await user.save()
      await sendMobileOtpMessage({ mobileNumber: user.mobileNumber, email: user.email, name: user.fullName, otpCode })
      sendJson(response, 200, { message: 'OTP has been sent to your registered mobile number.' })
      return
    }

    if (method === 'POST' && url === '/api/auth/verify-mobile-otp') {
      const payload = validateMobileOtpVerify(await readBody(request))
      const user = await User.findOne({ mobileNumber: payload.mobileNumber })
      if (!user || !user.loginOtpCodeHash || !user.loginOtpExpiresAt) {
        sendJson(response, 400, { error: 'OTP is invalid or has expired.' })
        return
      }
      if (new Date(user.loginOtpExpiresAt).getTime() < Date.now()) {
        user.loginOtpCodeHash = ''
        user.loginOtpExpiresAt = null
        await user.save()
        sendJson(response, 400, { error: 'OTP is invalid or has expired.' })
        return
      }
      if (hashResetCode(payload.code) !== user.loginOtpCodeHash) {
        sendJson(response, 400, { error: 'OTP is invalid or has expired.' })
        return
      }
      user.loginOtpCodeHash = ''
      user.loginOtpExpiresAt = null
      await user.save()
      sendJson(response, 200, { token: createToken(user), user: sanitizeUser(user) })
      return
    }
    if (method === 'POST' && url === '/api/auth/google') {
      const payload = validateGoogleLogin(await readBody(request))
      const googleProfile = await verifyGoogleCredential(payload.credential)
      const lookup = [{ googleId: googleProfile.googleId }]
      if (googleProfile.email) lookup.push({ email: googleProfile.email })
      let user = await User.findOne({ $or: lookup })
      if (!user) {
        const passwordHash = await User.hashPassword(randomUUID())
        user = await User.create({ fullName: googleProfile.fullName, email: googleProfile.email, googleId: googleProfile.googleId, avatarUrl: googleProfile.avatarUrl, passwordHash, role: 'patient' })
        await HealthRecord.create(buildDefaultRecord(user))
      } else {
        let changed = false
        if (!user.googleId) { user.googleId = googleProfile.googleId; changed = true }
        if (googleProfile.avatarUrl && user.avatarUrl !== googleProfile.avatarUrl) { user.avatarUrl = googleProfile.avatarUrl; changed = true }
        if ((!user.fullName || user.fullName === 'Google user') && googleProfile.fullName) { user.fullName = googleProfile.fullName; changed = true }
        if (changed) await user.save()
      }
      sendJson(response, 200, { token: createToken(user), user: sanitizeUser(user) })
      return
    }

    if (method === 'GET' && url === '/api/auth/me') {
      const user = await getUserFromRequest(request)
      if (!user) {
        sendJson(response, 401, { error: 'Unauthorized' })
        return
      }
      sendJson(response, 200, { user: sanitizeUser(user) })
      return
    }

    if (!url.startsWith('/api/')) {
      sendJson(response, 404, { error: `Route ${method} ${url} not found` })
      return
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      sendJson(response, 401, { error: 'Unauthorized' })
      return
    }

    if (method === 'GET' && url === '/api/abdm/status') {
      sendJson(response, 200, { abdm: getAbdmRuntime() })
      return
    }

    if (method === 'POST' && url === '/api/push/register') {
      const body = await readBody(request)
      const pushToken = typeof body.pushToken === 'string' ? body.pushToken.trim() : ''
      const platform = typeof body.platform === 'string' ? body.platform.trim() : ''
      if (!pushToken) {
        sendJson(response, 400, { error: 'pushToken required' })
        return
      }
      const existing = (user.pushTokens || []).filter((entry) => entry.token !== pushToken)
      existing.push({ token: pushToken, platform, registeredAt: new Date() })
      user.pushTokens = existing.slice(-5)
      await user.save()
      sendJson(response, 200, { ok: true, count: user.pushTokens.length })
      return
    }

    if (method === 'POST' && url === '/api/push/unregister') {
      const body = await readBody(request)
      const pushToken = typeof body.pushToken === 'string' ? body.pushToken.trim() : ''
      user.pushTokens = (user.pushTokens || []).filter((entry) => entry.token !== pushToken)
      await user.save()
      sendJson(response, 200, { ok: true })
      return
    }

    if (method === 'GET' && url === '/api/record') {
      const record = await getRecordForUser(user._id)
      sendJson(response, 200, record)
      return
    }

    if (method === 'PUT' && url === '/api/patient') {
      const payload = validatePatient(await readBody(request), user.fullName)
      const record = await getRecordForUser(user._id)
      record.patient = { ...record.patient, ...payload }
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'PUT' && url === '/api/emergency-info') {
      const payload = validateEmergencyInfo(await readBody(request))
      const record = await getRecordForUser(user._id)
      record.emergencyInfo = { ...(record.emergencyInfo || {}), ...payload }
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/timeline') {
      const payload = validateTimeline(await readBody(request))
      const record = await getRecordForUser(user._id)
      record.timeline.unshift({ id: createId(), ...payload })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    const timelineId = parseItemId(url, '/api/timeline/')
    if (timelineId !== null && method === 'PUT') {
      const payload = validateTimeline(await readBody(request))
      const record = await getRecordForUser(user._id)
      updateCollectionItem(record, 'timeline', timelineId, payload)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (timelineId !== null && method === 'DELETE') {
      const record = await getRecordForUser(user._id)
      deleteCollectionItem(record, 'timeline', timelineId)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/reports') {
      const report = { id: createId(), ...validateReport(await readBody(request)), fileName: '', originalFileName: '', fileUrl: '', mimeType: '', sizeBytes: 0 }
      const record = await getRecordForUser(user._id)
      record.reports.unshift(report)
      addTimelineItem(record, { title: `${report.name} added`, detail: `Report uploaded under ${report.doctor}. Status: ${report.status}.`, date: report.date, type: 'Report' })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    if (method === 'POST' && url === '/api/reports/upload') {
      const { fields, file } = await readMultipart(request)
      const record = await getRecordForUser(user._id)
      const report = {
        id: createId(),
        ...validateReport(fields),
        fileName: '', originalFileName: '', fileUrl: '', mimeType: '', sizeBytes: 0,
        extractionStatus: '', extractedSummary: '', extractedText: '', extractedObservations: [],
        extractedPatient: { name: '', age: '', sex: '', reportDate: '' },
        aiStatus: '', aiSummary: '', aiStructuredData: {}, aiSourceHighlights: [], aiTimelineItems: [], aiGeneratedAt: '',
      }
      let extracted = {
        extractionStatus: '', extractedSummary: '', extractedText: '', extractedObservations: [], extractedPatient: { name: '', age: '', sex: '', reportDate: '' },
      }

      if (file) {
        report.fileName = file.fileName
        report.originalFileName = file.originalFileName
        report.fileUrl = file.fileUrl
        report.mimeType = file.mimeType
        report.sizeBytes = file.sizeBytes
        const fileBuffer = await readFile(file.filePath)
        extracted = await extractReportDetails(fileBuffer, file)
        report.extractionStatus = extracted.extractionStatus
        report.extractedSummary = extracted.extractedSummary
        report.extractedText = extracted.extractedText
        report.extractedObservations = extracted.extractedObservations
        report.extractedPatient = extracted.extractedPatient
      }

      const enrichedReport = await enrichReportWithAi(report, record.patient)
      Object.assign(report, enrichedReport)

      record.reports.unshift(report)
      if (!record.patient.name && report.extractedPatient?.name) record.patient.name = report.extractedPatient.name
      if ((!record.patient.age || Number(record.patient.age) === 0) && report.extractedPatient?.age) {
        const age = Number(report.extractedPatient.age)
        if (Number.isFinite(age)) record.patient.age = age
      }
      addTimelineItem(record, { title: `${report.name} added`, detail: file ? `Report file ${report.originalFileName} uploaded under ${report.doctor}. ${report.extractionStatus || 'Text extraction not available.'}` : `Report added under ${report.doctor}. Status: ${report.status}.`, date: report.date, type: 'Report' })
      report.aiTimelineItems.forEach((item) => {
        record.timeline.unshift(item)
      })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    if (method === 'POST' && url === '/api/ai/chat') {
      const body = await readBody(request)
      const { message, history } = body
      if (!message) {
        sendJson(response, 400, { error: 'Message is required' })
        return
      }

      // Check subscription for rate limiting
      const sub = await Subscription.findOne({ userId: user._id }).lean()
      const isPremium = sub?.plan === 'premium' || sub?.plan === 'family'
      const rateCheck = checkRateLimit(user._id, isPremium)

      if (!rateCheck.allowed) {
        sendJson(response, 429, {
          error: isPremium
            ? `Daily AI limit reached (${rateCheck.limit}/day). Resets in ${rateCheck.hoursLeft}h.`
            : `Free plan limit: ${rateCheck.limit} messages/day. Upgrade to Premium for 100/day. Resets in ${rateCheck.hoursLeft}h.`,
          remaining: 0,
          limit: rateCheck.limit,
          isPremium,
        })
        return
      }

      // Try Gemini AI with full health context
      if (isGeminiConfigured()) {
        try {
          // Gather ALL user health data
          const record = await getRecordForUser(user._id)
          const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
          const dailyLogs = await DailyLog.find({
            userId: user._id,
            date: { $gte: weekAgo }
          }).sort({ date: -1 }).lean()

          // Build complete health context
          const healthContext = buildFullHealthContext(record, dailyLogs, sub)

          // Call Gemini with full context + conversation history
          const aiReply = await callGemini(message, healthContext, history || [])

          if (aiReply) {
            sendJson(response, 200, {
              reply: aiReply,
              source: 'gemini',
              remaining: rateCheck.remaining,
              limit: rateCheck.limit,
            })
            return
          }
        } catch (err) {
          // Fall through to keyword fallback
        }
      }

      // Fallback: keyword-based responses (works without API key)
      const reply = generateAiChatReply(message)
      sendJson(response, 200, {
        reply,
        source: 'local',
        remaining: rateCheck.remaining,
        limit: rateCheck.limit,
      })
      return
    }

    // ── Food Guide API ──
    if (method === 'GET' && url.startsWith('/api/foods')) {
      const foodUrl = new URL(url, `http://localhost:${PORT}`)
      const searchQuery = foodUrl.searchParams.get('q')
      const category = foodUrl.searchParams.get('category')
      const condition = foodUrl.searchParams.get('condition')
      const mealPlanKey = foodUrl.searchParams.get('meal_plan')

      if (condition) {
        const result = getFoodsForCondition(condition)
        if (!result) { sendJson(response, 404, { error: 'Condition not found' }); return }
        sendJson(response, 200, result)
        return
      }
      if (mealPlanKey) {
        sendJson(response, 200, getMealPlan(mealPlanKey))
        return
      }
      if (searchQuery) {
        sendJson(response, 200, { foods: searchFoods(searchQuery) })
        return
      }
      if (category) {
        sendJson(response, 200, { foods: getFoodsByCategory(category) })
        return
      }
      sendJson(response, 200, { foods: INDIAN_FOODS, categories: FOOD_CATEGORIES, conditions: Object.keys(CONDITION_FOODS), mealPlans: Object.keys(MEAL_PLANS) })
      return
    }

    if (method === 'POST' && url === '/api/ai/rebuild-reports') {
      const record = await getRecordForUser(user._id)
      const reports = Array.isArray(record.reports) ? record.reports : []
      const aiTimelineItems = []
      const refreshedReports = []

      for (const report of reports) {
        const nextReport = await enrichReportWithAi(report, record.patient)
        refreshedReports.push(nextReport)
        aiTimelineItems.push(...(nextReport.aiTimelineItems || []))
      }

      record.reports = refreshedReports
      record.timeline = (record.timeline || []).filter((item) => !['AI Summary', 'AI Follow-up'].includes(String(item.type || '')))
      aiTimelineItems
        .sort((left, right) => String(right.date).localeCompare(String(left.date)))
        .forEach((item) => record.timeline.unshift(item))

      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }
    const reportId = parseItemId(url, '/api/reports/')
    if (reportId !== null && method === 'PUT') {
      const payload = validateReport(await readBody(request))
      const record = await getRecordForUser(user._id)
      updateCollectionItem(record, 'reports', reportId, payload)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (reportId !== null && method === 'DELETE') {
      const record = await getRecordForUser(user._id)
      const removed = deleteCollectionItem(record, 'reports', reportId)
      if (removed.fileName) await unlink(join(UPLOAD_DIR, removed.fileName)).catch(() => {})
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/consultations') {
      const consultation = { id: createId(), ...validateConsultation(await readBody(request)) }
      const record = await getRecordForUser(user._id)
      record.consultations.unshift(consultation)
      addTimelineItem(record, { title: `Consultation with ${consultation.doctor}`, detail: consultation.summary, date: consultation.date, type: 'Doctor' })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    const consultationId = parseItemId(url, '/api/consultations/')
    if (consultationId !== null && method === 'PUT') {
      const payload = validateConsultation(await readBody(request))
      const record = await getRecordForUser(user._id)
      updateCollectionItem(record, 'consultations', consultationId, payload)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (consultationId !== null && method === 'DELETE') {
      const record = await getRecordForUser(user._id)
      deleteCollectionItem(record, 'consultations', consultationId)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/appointments') {
      const appointment = { id: createId(), ...validateAppointment(await readBody(request)) }
      const record = await getRecordForUser(user._id)
      record.appointments.unshift(appointment)
      addTimelineItem(record, { title: appointment.title, detail: `${appointment.doctor} at ${appointment.time}${appointment.location ? ` ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${appointment.location}` : ''}`, date: appointment.date, type: 'Doctor' })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    const appointmentId = parseItemId(url, '/api/appointments/')
    if (appointmentId !== null && method === 'PUT') {
      const payload = validateAppointment(await readBody(request))
      const record = await getRecordForUser(user._id)
      updateCollectionItem(record, 'appointments', appointmentId, payload)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (appointmentId !== null && method === 'DELETE') {
      const record = await getRecordForUser(user._id)
      deleteCollectionItem(record, 'appointments', appointmentId)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/medications') {
      const medication = { id: createId(), ...validateMedication(await readBody(request)) }
      const record = await getRecordForUser(user._id)
      record.medications.unshift(medication)
      addTimelineItem(record, { title: `${medication.name} added to treatment plan`, detail: `${medication.dose}. ${medication.schedule}.`, date: new Date().toISOString().slice(0, 10), type: 'Medication' })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    const medicationId = parseItemId(url, '/api/medications/')
    if (medicationId !== null && method === 'PUT') {
      const payload = validateMedication(await readBody(request))
      const record = await getRecordForUser(user._id)
      updateCollectionItem(record, 'medications', medicationId, payload)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (medicationId !== null && method === 'DELETE') {
      const record = await getRecordForUser(user._id)
      deleteCollectionItem(record, 'medications', medicationId)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/vitals') {
      const vital = { id: createId(), ...validateVital(await readBody(request)) }
      const record = await getRecordForUser(user._id)
      record.vitals.unshift(vital)
      addTimelineItem(record, { title: `${vital.label} recorded`, detail: `${vital.value} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${vital.note}`, date: vital.date, type: 'Vitals' })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 201, saved)
      return
    }

    const vitalId = parseItemId(url, '/api/vitals/')
    if (vitalId !== null && method === 'PUT') {
      const payload = validateVital(await readBody(request))
      const record = await getRecordForUser(user._id)
      updateCollectionItem(record, 'vitals', vitalId, payload)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (vitalId !== null && method === 'DELETE') {
      const record = await getRecordForUser(user._id)
      deleteCollectionItem(record, 'vitals', vitalId)
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/abha/connect') {
      const payload = await readBody(request)
      // Sanitize ABHA fields: only allow digits/hyphens for number, alphanumeric/@/. for address
      const rawAbhaNumber = typeof payload.abhaNumber === 'string' ? payload.abhaNumber.trim() : ''
      const rawAbhaAddress = typeof payload.abhaAddress === 'string' ? payload.abhaAddress.trim() : ''
      const abhaNumber = rawAbhaNumber.replace(/[^0-9-]/g, '').slice(0, 20)
      const abhaAddress = rawAbhaAddress.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 100)
      if (!abhaNumber && !abhaAddress) {
        sendJson(response, 400, { error: 'Provide a valid ABHA number or ABHA address.' })
        return
      }
      const record = await getRecordForUser(user._id)
      record.patient = { ...record.patient, abhaNumber: abhaNumber || record.patient.abhaNumber, abhaAddress: abhaAddress || record.patient.abhaAddress, abdmLinked: true, consentStatus: 'Linked locally - discovery pending', lastAbdmSync: record.patient.lastAbdmSync || '' }
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/abdm/discover') {
      const record = await getRecordForUser(user._id)
      if (!record.patient.abdmLinked) {
        sendJson(response, 400, { error: 'Connect ABHA details before discovery.' })
        return
      }
      record.careContexts = await discoverCareContexts(record.patient)
      record.patient.consentStatus = 'Care contexts discovered'
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/abdm/request-consent') {
      const record = await getRecordForUser(user._id)
      if (!record.patient.abdmLinked) {
        sendJson(response, 400, { error: 'Connect ABHA details before requesting consent.' })
        return
      }
      if (!record.careContexts?.length) {
        sendJson(response, 400, { error: 'Discover care contexts before requesting consent.' })
        return
      }
      const consent = await createConsentRequest(record.patient, record.careContexts)
      record.consentRequests.unshift(consent)
      record.patient.consentStatus = 'Consent requested'
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/abdm/approve-demo-consent') {
      const record = await getRecordForUser(user._id)
      if (!record.consentRequests?.length) {
        sendJson(response, 400, { error: 'No consent request found to approve.' })
        return
      }
      record.consentRequests[0].status = 'Approved'
      record.patient.consentStatus = 'Consent approved'
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/abha/import-demo') {
      const record = await getRecordForUser(user._id)
      if (!record.patient.abhaNumber && !record.patient.abhaAddress) {
        sendJson(response, 400, { error: 'Add ABHA details before importing ABDM-linked records.' })
        return
      }
      const approvedConsent = record.consentRequests?.find((item) => item.status === 'Approved')
      if (!approvedConsent) {
        sendJson(response, 400, { error: 'Approve a consent request before importing ABDM-linked records.' })
        return
      }
      const syncDate = new Date().toISOString().slice(0, 10)
      record.patient.abdmLinked = true
      record.patient.consentStatus = 'Demo import completed'
      record.patient.lastAbdmSync = syncDate
      record.importedRecords = await importConsentedRecords()
      addTimelineItem(record, { title: 'ABDM records imported', detail: 'Demo imported records were added after ABHA linking, discovery, and consent approval. Replace this with real ABDM APIs later.', date: syncDate, type: 'System' })
      const saved = await saveRecord(record, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'POST' && url === '/api/reset') {
      const existing = await getRecordForUser(user._id)
      for (const report of existing.reports || []) {
        if (report.fileName) await unlink(join(UPLOAD_DIR, report.fileName)).catch(() => {})
      }
      const reset = buildDefaultRecord(user)
      const saved = await saveRecord(reset, user._id)
      sendJson(response, 200, saved)
      return
    }

    if (method === 'GET' && url === '/api/subscription') {
      let sub = await Subscription.findOne({ userId: user._id })
      if (!sub) {
        sub = await Subscription.create({
          userId: user._id,
          plan: 'free',
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          features: {
            aiInsights: false,
            unlimitedReports: false,
            exportPdf: false,
            familyMembers: 0,
            prioritySupport: false,
            advancedAnalytics: false,
            aiChat: false,
            customReminders: false,
          },
        })
      }
      sendJson(response, 200, { subscription: sub })
      return
    }

    // NOTE: Direct subscription upgrade without payment is intentionally removed.
    // Subscription activation must go through /api/payment/create-order → /api/payment/verify.

    if (method === 'POST' && url === '/api/subscription/cancel') {
      const freeFeatures = {
        aiInsights: false, unlimitedReports: false, exportPdf: false,
        familyMembers: 0, prioritySupport: false, advancedAnalytics: false,
        aiChat: false, customReminders: false,
      }
      const sub = await Subscription.findOneAndUpdate(
        { userId: user._id },
        { plan: 'free', status: 'cancelled', features: freeFeatures, cancelledAt: new Date() },
        { new: true, upsert: true }
      )
      sendJson(response, 200, { subscription: sub })
      return
    }

    // --- Payment endpoints ---

    if (method === 'GET' && url === '/api/payment/config') {
      sendJson(response, 200, {
        keyId: getRazorpayKeyId(),
        configured: isPaymentConfigured(),
      })
      return
    }

    if (method === 'POST' && url === '/api/payment/create-order') {
      const body = await readBody(request)
      if (!body) return
      const { plan } = body
      if (!plan || !['premium', 'family'].includes(plan)) {
        sendJson(response, 400, { error: 'Invalid plan' })
        return
      }

      if (!isPaymentConfigured()) {
        // Dev mode: skip payment, directly upgrade
        let sub = await Subscription.findOne({ userId: user._id })
        if (!sub) sub = new Subscription({ userId: user._id })
        const features = plan === 'family'
          ? { aiInsights: true, unlimitedReports: true, exportPdf: true, familyMembers: 5, prioritySupport: true, advancedAnalytics: true, aiChat: true, customReminders: true }
          : { aiInsights: true, unlimitedReports: true, exportPdf: true, familyMembers: 0, prioritySupport: true, advancedAnalytics: true, aiChat: true, customReminders: true }
        sub.plan = plan
        sub.status = 'active'
        sub.features = features
        sub.currentPeriodStart = new Date()
        sub.currentPeriodEnd = new Date(Date.now() + 30 * 86400000)
        await sub.save()
        sendJson(response, 200, { devMode: true, subscription: sub })
        return
      }

      const amount = plan === 'family' ? 39900 : 19900
      const order = await createRazorpayOrder(amount, 'INR', `${plan}_${user._id}`)

      // Save payment record with status 'created'
      await Payment.create({
        userId: user._id,
        razorpayOrderId: order.id,
        plan,
        amount,
        currency: 'INR',
        status: 'created',
      })

      sendJson(response, 200, { order, keyId: getRazorpayKeyId() })
      return
    }

    if (method === 'POST' && url === '/api/payment/verify') {
      const body = await readBody(request)
      if (!body) return
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        sendJson(response, 400, { error: 'Missing payment details' })
        return
      }

      const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
      if (!valid) {
        sendJson(response, 400, { error: 'Payment verification failed' })
        return
      }

      // Look up the original plan from the server-side payment record.
      // We NEVER trust the plan submitted by the client — it must match what was ordered.
      const paymentRecord = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId: user._id })
      if (!paymentRecord) {
        sendJson(response, 404, { error: 'Order not found for this account' })
        return
      }
      const plan = paymentRecord.plan

      // Mark payment as paid
      paymentRecord.razorpayPaymentId = razorpay_payment_id
      paymentRecord.razorpaySignature = razorpay_signature
      paymentRecord.status = 'paid'
      await paymentRecord.save()

      // Activate subscription using the server-verified plan
      let sub = await Subscription.findOne({ userId: user._id })
      if (!sub) sub = new Subscription({ userId: user._id })
      const features = plan === 'family'
        ? { aiInsights: true, unlimitedReports: true, exportPdf: true, familyMembers: 5, prioritySupport: true, advancedAnalytics: true, aiChat: true, customReminders: true }
        : { aiInsights: true, unlimitedReports: true, exportPdf: true, familyMembers: 0, prioritySupport: true, advancedAnalytics: true, aiChat: true, customReminders: true }
      sub.plan = plan
      sub.status = 'active'
      sub.features = features
      sub.currentPeriodStart = new Date()
      sub.currentPeriodEnd = new Date(Date.now() + 30 * 86400000)
      await sub.save()
      sendJson(response, 200, { success: true, subscription: sub })
      return
    }

    // --- Daily Log endpoints ---
    if (method === 'GET' && url.startsWith('/api/daily-log/week')) {
      const now = new Date()
      const dates = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        dates.push(d.toISOString().slice(0, 10))
      }
      const logs = await DailyLog.find({ userId: user._id, date: { $in: dates } }).lean()
      const logMap = new Map(logs.map((l) => [l.date, l]))
      const result = dates.map((date) => {
        const l = logMap.get(date)
        return l
          ? { date: l.date, water: l.water, sleep: l.sleep, exercise: l.exercise, mood: l.mood, steps: l.steps, notes: l.notes }
          : { date, water: 0, sleep: 0, exercise: 0, mood: '', steps: 0, notes: '' }
      })
      sendJson(response, 200, { logs: result })
      return
    }

    if (method === 'GET' && url.startsWith('/api/daily-log')) {
      const qIdx = url.indexOf('?')
      const params = qIdx >= 0 ? new URLSearchParams(url.slice(qIdx + 1)) : new URLSearchParams()
      const date = params.get('date') || new Date().toISOString().slice(0, 10)
      let log = await DailyLog.findOne({ userId: user._id, date }).lean()
      if (!log) {
        log = await DailyLog.create({ userId: user._id, date })
        log = log.toObject()
      }
      sendJson(response, 200, { log: { date: log.date, water: log.water, sleep: log.sleep, exercise: log.exercise, mood: log.mood, steps: log.steps, notes: log.notes } })
      return
    }

    if (method === 'PUT' && url === '/api/daily-log') {
      const body = await readBody(request)
      const date = typeof body.date === 'string' ? body.date : new Date().toISOString().slice(0, 10)
      const updates = {}
      if (typeof body.water === 'number') updates.water = Math.max(0, Math.min(50, body.water))
      if (typeof body.sleep === 'number') updates.sleep = Math.max(0, Math.min(24, body.sleep))
      if (typeof body.exercise === 'number') updates.exercise = Math.max(0, Math.min(1440, body.exercise))
      if (typeof body.mood === 'string') updates.mood = ['great', 'good', 'okay', 'bad', 'terrible', ''].includes(body.mood) ? body.mood : ''
      if (typeof body.steps === 'number') updates.steps = Math.max(0, Math.min(200000, body.steps))
      if (typeof body.notes === 'string') updates.notes = body.notes.slice(0, 500)
      const log = await DailyLog.findOneAndUpdate(
        { userId: user._id, date },
        { $set: updates, $setOnInsert: { userId: user._id, date } },
        { new: true, upsert: true }
      ).lean()
      sendJson(response, 200, { log: { date: log.date, water: log.water, sleep: log.sleep, exercise: log.exercise, mood: log.mood, steps: log.steps, notes: log.notes } })
      return
    }

    // ── Admin API (role: admin only) ──
    if (url.startsWith('/api/admin')) {
      if (user.role !== 'admin') {
        sendJson(response, 403, { error: 'Admin access required' })
        return
      }

      // Admin stats dashboard
      if (method === 'GET' && url === '/api/admin/stats') {
        const [totalUsers, totalPayments, subscriptions] = await Promise.all([
          User.countDocuments(),
          Payment.find({ status: 'paid' }).lean(),
          Subscription.find().lean(),
        ])
        const premiumCount = subscriptions.filter(s => s.plan === 'premium' && s.status === 'active').length
        const familyCount = subscriptions.filter(s => s.plan === 'family' && s.status === 'active').length
        const totalRevenue = totalPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const last30Days = new Date(Date.now() - 30 * 86400000)
        const newUsersMonth = await User.countDocuments({ createdAt: { $gte: last30Days } })
        const revenueMonth = totalPayments.filter(p => new Date(p.createdAt) >= last30Days).reduce((s, p) => s + (p.amount || 0), 0)

        sendJson(response, 200, {
          totalUsers,
          newUsersMonth,
          premiumCount,
          familyCount,
          freeCount: totalUsers - premiumCount - familyCount,
          totalRevenue,
          revenueMonth,
          totalPayments: totalPayments.length,
        })
        return
      }

      // List users (paginated)
      if (method === 'GET' && url.startsWith('/api/admin/users')) {
        const adminUrl = new URL(url, `http://localhost:${PORT}`)
        const page = Math.max(1, Number(adminUrl.searchParams.get('page')) || 1)
        const limit = Math.min(50, Number(adminUrl.searchParams.get('limit')) || 20)
        const search = adminUrl.searchParams.get('q') || ''
        const query = search ? { $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {}
        const [users, total] = await Promise.all([
          User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-passwordHash -loginOtpCodeHash -passwordResetCodeHash -googleId -pushTokens').lean(),
          User.countDocuments(query),
        ])
        sendJson(response, 200, { users, total, page, pages: Math.ceil(total / limit) })
        return
      }

      // Update user (ban, change role, etc.)
      if (method === 'PUT' && url.startsWith('/api/admin/user/')) {
        const targetId = url.replace('/api/admin/user/', '')
        const body = await readBody(request)
        const updates = {}
        if (body.role && ['user', 'admin'].includes(body.role)) updates.role = body.role
        if (typeof body.banned === 'boolean') updates.banned = body.banned
        const updated = await User.findByIdAndUpdate(targetId, updates, { new: true }).select('-passwordHash').lean()
        if (!updated) { sendJson(response, 404, { error: 'User not found' }); return }
        sendJson(response, 200, { user: updated })
        return
      }

      // View all payments
      if (method === 'GET' && url === '/api/admin/payments') {
        const payments = await Payment.find().sort({ createdAt: -1 }).limit(100).lean()
        sendJson(response, 200, { payments })
        return
      }

      // Broadcast push notification
      if (method === 'POST' && url === '/api/admin/broadcast') {
        const body = await readBody(request)
        const { title, message: msg } = body
        if (!title || !msg) { sendJson(response, 400, { error: 'Title and message required' }); return }
        const allUsers = await User.find({ pushTokens: { $exists: true, $ne: [] } }).select('pushTokens').lean()
        let sent = 0
        for (const u of allUsers) {
          try {
            await sendPushToUser(u._id, title, msg, {})
            sent++
          } catch { /* skip failed */ }
        }
        sendJson(response, 200, { sent, total: allUsers.length })
        return
      }

      // App config / announcement
      if (method === 'GET' && url === '/api/admin/config') {
        sendJson(response, 200, {
          version: '1.0.0',
          appName: 'HealthMap AI',
          founder: 'Vishal Tiwari',
          paymentConfigured: isPaymentConfigured(),
          emailConfigured: emailConfigured(),
          smsConfigured: smsConfigured(),
          abdmMode: process.env.ABDM_MODE || 'demo',
        })
        return
      }

      sendJson(response, 404, { error: 'Admin route not found' })
      return
    }

    sendJson(response, 404, { error: `Route ${method} ${url} not found` })
  } catch (error) {
    const statusCode = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
      ? 401
      : error.message === 'Request body is too large.'
        ? 413
        : error.message === 'Uploaded file is too large. Limit is 5 MB.'
          ? 413
          : error.code === 'ENOENT'
            ? 404
            : 400
    sendJson(response, statusCode, { error: error.message || 'Unknown server error' })
  }
})

server.listen(PORT, () => {
  console.log(`HealthMap API running at http://localhost:${PORT}`)
})









