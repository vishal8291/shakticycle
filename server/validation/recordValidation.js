const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const abhaNumberRegex = /^\d{2}-\d{4}-\d{4}-\d{4}$/
const abhaAddressRegex = /^[A-Za-z0-9._-]{2,}@[A-Za-z]{3,}$/
const mobileRegex = /^(?:\+91)?[6-9]\d{9}$/
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const allowedTimelineTypes = new Set(['Symptoms', 'Vitals', 'Doctor', 'Report', 'Medication', 'System'])
const allowedReportStatuses = new Set(['Pending review', 'Reviewed', 'Needs follow-up'])
const allowedMedicationStatuses = new Set(['New', 'Daily', 'As needed', 'Paused'])
const allowedAppointmentStatuses = new Set(['Scheduled', 'Completed', 'Cancelled'])
const allowedBloodGroups = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
const allowedSex = new Set(['Male', 'Female', 'Other', 'Prefer not to say'])

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function requireMinLength(value, min, label) {
  const next = cleanString(value)
  if (next.length < min) throw new Error(`${label} must be at least ${min} characters.`)
  return next
}

function requireEmail(value) {
  const next = cleanString(value).toLowerCase()
  if (!emailRegex.test(next)) throw new Error('Enter a valid email address.')
  return next
}

function normalizeMobileNumber(value, required = false) {
  const next = cleanString(value).replace(/[\s-]/g, '')
  if (!next) {
    if (required) throw new Error('Enter a valid Indian mobile number.')
    return ''
  }
  if (!mobileRegex.test(next)) throw new Error('Enter a valid Indian mobile number.')
  return next.startsWith('+91') ? next : `+91${next}`
}

function requireStrongPassword(value) {
  const next = typeof value === 'string' ? value : ''
  if (!strongPasswordRegex.test(next)) {
    throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.')
  }
  return next
}

function requireDate(value, label = 'Date') {
  const next = cleanString(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) throw new Error(`${label} must be in YYYY-MM-DD format.`)
  if (Number.isNaN(new Date(next).getTime())) throw new Error(`${label} is invalid.`)
  return next
}

function requireTime(value, label = 'Time') {
  const next = cleanString(value)
  if (!timeRegex.test(next)) throw new Error(`${label} must be in HH:MM format.`)
  return next
}

function cleanStringList(value, label, maxItems = 20) {
  if (!Array.isArray(value)) throw new Error(`${label} must be a list.`)
  const next = value.map((item) => cleanString(item)).filter(Boolean)
  if (next.length > maxItems) throw new Error(`${label} cannot contain more than ${maxItems} items.`)
  return next
}

function cleanAbhaNumber(value) {
  const next = cleanString(value)
  if (next && !abhaNumberRegex.test(next)) throw new Error('ABHA number must be in the format 12-3456-7890-1234.')
  return next
}

function cleanAbhaAddress(value) {
  const next = cleanString(value).toLowerCase()
  if (next && !abhaAddressRegex.test(next)) throw new Error('ABHA address must look like name@abdm.')
  return next
}

export function validateSignup(payload) {
  return {
    fullName: requireMinLength(payload.fullName, 2, 'Full name'),
    email: requireEmail(payload.email),
    mobileNumber: normalizeMobileNumber(payload.mobileNumber),
    password: requireStrongPassword(payload.password),
  }
}

export function validateLogin(payload) {
  const explicitEmail = cleanString(payload.email)
  const explicitMobile = cleanString(payload.mobileNumber)
  const identifier = cleanString(payload.identifier || explicitEmail || explicitMobile)
  if (!identifier) throw new Error('Email or mobile number is required.')

  let loginIdentifier = ''
  if (explicitEmail) loginIdentifier = requireEmail(explicitEmail)
  else if (explicitMobile) loginIdentifier = normalizeMobileNumber(explicitMobile, true)
  else loginIdentifier = identifier.includes('@') ? requireEmail(identifier) : normalizeMobileNumber(identifier, true)

  return {
    identifier: loginIdentifier,
    password: requireMinLength(payload.password, 8, 'Password'),
  }
}

export function validateForgotPassword(payload) {
  return { email: requireEmail(payload.email) }
}

export function validateResetPassword(payload) {
  return {
    email: requireEmail(payload.email),
    code: requireMinLength(payload.code, 4, 'Reset code'),
    password: requireStrongPassword(payload.password),
  }
}

export function validateMobileOtpRequest(payload) {
  return { mobileNumber: normalizeMobileNumber(payload.mobileNumber, true) }
}

export function validateMobileOtpVerify(payload) {
  return {
    mobileNumber: normalizeMobileNumber(payload.mobileNumber, true),
    code: requireMinLength(payload.code, 4, 'OTP code'),
  }
}

export function validateGoogleLogin(payload) {
  const credential = cleanString(payload.credential)
  if (credential.length < 20) throw new Error('Google sign-in could not be verified. Please try again.')
  return { credential }
}

export function validatePatient(payload, fallbackName = '') {
  const name = cleanString(payload.name) || fallbackName
  if (name.length < 2) throw new Error('Patient name must be at least 2 characters.')

  const age = Number(payload.age)
  if (!Number.isFinite(age) || age < 0 || age > 120) throw new Error('Age must be between 0 and 120.')

  const bloodGroup = cleanString(payload.bloodGroup)
  if (!allowedBloodGroups.has(bloodGroup)) {
    throw new Error('Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, or O-.')
  }

  const dob = cleanString(payload.dob)
  if (dob) {
    const checkedDob = requireDate(dob, 'Date of birth')
    if (new Date(checkedDob).getTime() > Date.now()) throw new Error('Date of birth cannot be in the future.')
  }

  const sex = cleanString(payload.sex)
  if (sex && !allowedSex.has(sex)) throw new Error('Choose a valid sex.')

  return {
    name,
    dob,
    sex,
    age,
    bloodGroup,
    primaryDoctor: cleanString(payload.primaryDoctor),
    emergencyContact: cleanString(payload.emergencyContact),
    conditions: cleanStringList(payload.conditions || [], 'Conditions'),
    allergies: cleanStringList(payload.allergies || [], 'Allergies'),
    abhaNumber: cleanAbhaNumber(payload.abhaNumber),
    abhaAddress: cleanAbhaAddress(payload.abhaAddress),
    abdmLinked: Boolean(payload.abdmLinked),
    consentStatus: cleanString(payload.consentStatus) || 'Not connected',
    lastAbdmSync: cleanString(payload.lastAbdmSync),
  }
}

export function validateEmergencyInfo(payload) {
  return {
    primaryContactName: cleanString(payload.primaryContactName),
    primaryContactPhone: normalizeMobileNumber(payload.primaryContactPhone),
    secondaryContactName: cleanString(payload.secondaryContactName),
    secondaryContactPhone: normalizeMobileNumber(payload.secondaryContactPhone),
    preferredHospital: cleanString(payload.preferredHospital),
    insuranceProvider: cleanString(payload.insuranceProvider),
    allergiesNote: cleanString(payload.allergiesNote),
    emergencyNotes: cleanString(payload.emergencyNotes),
  }
}

export function validateTimeline(payload) {
  const type = cleanString(payload.type)
  if (!allowedTimelineTypes.has(type)) throw new Error('Timeline type is invalid.')

  return {
    title: requireMinLength(payload.title, 2, 'Timeline title'),
    detail: requireMinLength(payload.detail, 5, 'Timeline detail'),
    date: requireDate(payload.date),
    type,
  }
}

export function validateReport(payload) {
  const status = cleanString(payload.status)
  if (!allowedReportStatuses.has(status)) throw new Error('Report status is invalid.')

  return {
    name: requireMinLength(payload.name, 2, 'Report name'),
    doctor: requireMinLength(payload.doctor, 2, 'Doctor name'),
    date: requireDate(payload.date, 'Report date'),
    status,
  }
}

export function validateConsultation(payload) {
  const nextSteps = Array.isArray(payload.nextSteps)
    ? cleanStringList(payload.nextSteps, 'Next steps', 15)
    : []

  return {
    doctor: requireMinLength(payload.doctor, 2, 'Doctor name'),
    specialty: cleanString(payload.specialty) || 'General Medicine',
    date: requireDate(payload.date, 'Consultation date'),
    summary: requireMinLength(payload.summary, 8, 'Consultation summary'),
    nextSteps,
  }
}

export function validateAppointment(payload) {
  const status = cleanString(payload.status)
  if (!allowedAppointmentStatuses.has(status)) throw new Error('Appointment status is invalid.')

  return {
    title: requireMinLength(payload.title, 2, 'Appointment title'),
    doctor: requireMinLength(payload.doctor, 2, 'Doctor name'),
    date: requireDate(payload.date, 'Appointment date'),
    time: requireTime(payload.time, 'Appointment time'),
    location: cleanString(payload.location),
    status,
    reminder: cleanString(payload.reminder),
  }
}

export function validateMedication(payload) {
  const adherence = cleanString(payload.adherence)
  if (!allowedMedicationStatuses.has(adherence)) throw new Error('Medication status is invalid.')

  return {
    name: requireMinLength(payload.name, 2, 'Medication name'),
    dose: requireMinLength(payload.dose, 1, 'Dose'),
    schedule: cleanString(payload.schedule) || 'Schedule not added yet',
    adherence,
  }
}

export function validateVital(payload) {
  return {
    label: requireMinLength(payload.label, 2, 'Vital name'),
    value: requireMinLength(payload.value, 1, 'Vital value'),
    note: requireMinLength(payload.note, 2, 'Vital note'),
    date: requireDate(payload.date, 'Vital date'),
    category: cleanString(payload.category) || 'General',
  }
}

