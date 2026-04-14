import mongoose from 'mongoose'

const careContextSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    referenceNumber: { type: String, default: '' },
    display: { type: String, required: true },
    hiType: { type: String, default: '' },
    provider: { type: String, default: '' },
    status: { type: String, default: 'Discovered' },
  },
  { _id: false },
)

const consentRequestSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    purpose: { type: String, default: 'Care management' },
    requester: { type: String, default: 'HealthMap HIU' },
    status: { type: String, default: 'Requested' },
    createdAt: { type: String, default: '' },
    expiresAt: { type: String, default: '' },
    abhaAddress: { type: String, default: '' },
    careContextReferences: { type: [String], default: [] },
  },
  { _id: false },
)

const importedRecordSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    source: { type: String, default: 'ABDM' },
    category: { type: String, default: 'Clinical document' },
    title: { type: String, required: true },
    provider: { type: String, default: '' },
    date: { type: String, required: true },
    status: { type: String, default: 'Imported' },
    referenceId: { type: String, default: '' },
    summary: { type: String, default: '' },
  },
  { _id: false },
)

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    dob: { type: String, default: '' },
    sex: { type: String, default: '' },
    age: { type: Number, default: 0 },
    bloodGroup: { type: String, default: '' },
    primaryDoctor: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    conditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    abhaNumber: { type: String, default: '' },
    abhaAddress: { type: String, default: '' },
    abdmLinked: { type: Boolean, default: false },
    consentStatus: { type: String, default: 'Not connected' },
    lastAbdmSync: { type: String, default: '' },
  },
  { _id: false },
)

const emergencyInfoSchema = new mongoose.Schema(
  {
    primaryContactName: { type: String, default: '' },
    primaryContactPhone: { type: String, default: '' },
    secondaryContactName: { type: String, default: '' },
    secondaryContactPhone: { type: String, default: '' },
    preferredHospital: { type: String, default: '' },
    insuranceProvider: { type: String, default: '' },
    allergiesNote: { type: String, default: '' },
    emergencyNotes: { type: String, default: '' },
  },
  { _id: false },
)

const timelineItemSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    type: { type: String, required: true },
  },
  { _id: false },
)

const extractedPatientSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    age: { type: String, default: '' },
    sex: { type: String, default: '' },
    reportDate: { type: String, default: '' },
  },
  { _id: false },
)

const reportSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
    doctor: { type: String, required: true },
    fileName: { type: String, default: '' },
    originalFileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    extractionStatus: { type: String, default: '' },
    extractedSummary: { type: String, default: '' },
    extractedText: { type: String, default: '' },
    extractedObservations: { type: [String], default: [] },
    extractedPatient: { type: extractedPatientSchema, default: () => ({}) },
    aiStatus: { type: String, default: '' },
    aiSummary: { type: String, default: '' },
    aiStructuredData: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    aiSourceHighlights: { type: [String], default: [] },
    aiTimelineItems: { type: [timelineItemSchema], default: [] },
    aiGeneratedAt: { type: String, default: '' },
  },
  { _id: false },
)

const medicationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    dose: { type: String, required: true },
    schedule: { type: String, required: true },
    adherence: { type: String, required: true },
  },
  { _id: false },
)

const consultationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    doctor: { type: String, required: true },
    specialty: { type: String, required: true },
    date: { type: String, required: true },
    summary: { type: String, required: true },
    nextSteps: { type: [String], default: [] },
  },
  { _id: false },
)

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    doctor: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, default: '' },
    status: { type: String, required: true },
    reminder: { type: String, default: '' },
  },
  { _id: false },
)

const vitalSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    note: { type: String, required: true },
    date: { type: String, required: true },
    category: { type: String, default: 'General' },
  },
  { _id: false },
)

const healthRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    patient: { type: patientSchema, required: true },
    emergencyInfo: { type: emergencyInfoSchema, default: () => ({}) },
    timeline: { type: [timelineItemSchema], default: [] },
    reports: { type: [reportSchema], default: [] },
    medications: { type: [medicationSchema], default: [] },
    consultations: { type: [consultationSchema], default: [] },
    appointments: { type: [appointmentSchema], default: [] },
    vitals: { type: [vitalSchema], default: [] },
    importedRecords: { type: [importedRecordSchema], default: [] },
    careContexts: { type: [careContextSchema], default: [] },
    consentRequests: { type: [consentRequestSchema], default: [] },
  },
  { timestamps: true },
)

export default mongoose.models.HealthRecord || mongoose.model('HealthRecord', healthRecordSchema)
