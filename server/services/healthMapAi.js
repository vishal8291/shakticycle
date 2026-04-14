function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function pickMatches(text, patterns) {
  const results = []
  for (const [label, pattern] of patterns) {
    if (pattern.test(text)) results.push(label)
  }
  return unique(results)
}

function extractMeasurements(observations = [], text = '') {
  const source = `${observations.join('\n')}\n${text}`
  const rules = [
    { label: 'Hemoglobin', regex: /(hemoglobin|hb)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, unit: 'g/dL' },
    { label: 'Glucose', regex: /(glucose|sugar)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, unit: 'mg/dL' },
    { label: 'TSH', regex: /\bTSH\b\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, unit: 'uIU/mL' },
    { label: 'Creatinine', regex: /creatinine\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, unit: 'mg/dL' },
    { label: 'Cholesterol', regex: /cholesterol\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, unit: 'mg/dL' },
    { label: 'Blood Pressure', regex: /(blood pressure|bp)\s*[:\-]?\s*(\d{2,3}\/\d{2,3})/i, unit: 'mmHg' },
  ]

  return rules.flatMap((rule) => {
    const match = source.match(rule.regex)
    if (!match) return []
    const numericValue = match[2] || match[1]
    return [{ label: rule.label, value: normalizeText(numericValue), unit: rule.unit }]
  })
}

function detectReportType(reportName, text) {
  const source = `${reportName} ${text}`.toLowerCase()
  if (/cbc|blood|biochemistry|thyroid|vitamin|lipid|hba1c|lab/.test(source)) return 'Lab report'
  if (/x-?ray|mri|ct|scan|ultrasound/.test(source)) return 'Imaging report'
  if (/prescription|medicine|rx/.test(source)) return 'Prescription'
  if (/discharge|summary|admission/.test(source)) return 'Hospital summary'
  return 'Clinical report'
}

function buildSourceHighlights(extractedSummary, observations = []) {
  const highlights = []
  if (extractedSummary) highlights.push(extractedSummary)
  observations.slice(0, 4).forEach((item) => highlights.push(item))
  return unique(highlights).slice(0, 5)
}

function buildTimelineSuggestions({ report, structuredData, extractionStatus }) {
  const items = [
    {
      date: report.date,
      title: `HealthMap AI reviewed ${report.name}`,
      detail: `AI summary prepared from ${report.originalFileName || report.name}. Extraction status: ${extractionStatus || 'Not available'}.`,
      type: 'AI Summary',
    },
  ]

  if (structuredData.followUpSuggestions.length > 0) {
    items.push({
      date: report.date,
      title: `${report.name} needs follow-up`,
      detail: structuredData.followUpSuggestions.join(' '),
      type: 'AI Follow-up',
    })
  }

  return items.slice(0, 2)
}

function buildSafeSummary({ report, structuredData, patient }) {
  const parts = []
  parts.push(`${report.name} was added to ${patient?.name || 'the patient'}'s health record.`)
  parts.push(`HealthMap AI classified it as a ${structuredData.reportType.toLowerCase()}.`)

  if (structuredData.clinicalAreas.length > 0) {
    parts.push(`Possible focus areas mentioned: ${structuredData.clinicalAreas.join(', ')}.`)
  }

  if (structuredData.measurements.length > 0) {
    const measurementText = structuredData.measurements.slice(0, 3).map((item) => `${item.label} ${item.value}${item.unit ? ` ${item.unit}` : ''}`).join(', ')
    parts.push(`Key measurements found: ${measurementText}.`)
  }

  if (structuredData.followUpSuggestions.length > 0) {
    parts.push(`Suggested next step: ${structuredData.followUpSuggestions[0]}`)
  } else {
    parts.push('Review the full report with your doctor before making any care changes.')
  }

  return parts.join(' ')
}

export function buildHealthMapAiLlmInput({ patient, report, extraction }) {
  return {
    systemGoal: 'Organize personal health documents into a safe, source-grounded health history without diagnosing or prescribing.',
    allowedTasks: [
      'Summarize the uploaded report in plain language',
      'Extract structured medical entities mentioned in the source text',
      'Suggest timeline events grounded in the uploaded report',
      'Highlight doctor follow-up questions or tests mentioned in the report',
    ],
    blockedTasks: [
      'Do not diagnose',
      'Do not prescribe treatment or medicines',
      'Do not claim a medical emergency unless directly stated in the source text',
      'Do not invent lab values, conditions, or medicines that are not in the report',
    ],
    sourceContext: {
      patient: {
        name: patient?.name || '',
        age: patient?.age || '',
        sex: patient?.sex || '',
        bloodGroup: patient?.bloodGroup || '',
        knownConditions: patient?.conditions || [],
        allergies: patient?.allergies || [],
      },
      report: {
        name: report.name,
        doctor: report.doctor,
        date: report.date,
        status: report.status,
        originalFileName: report.originalFileName || '',
      },
      extraction: {
        status: extraction.extractionStatus || '',
        patientMentions: extraction.extractedPatient || {},
        observations: extraction.extractedObservations || [],
        textExcerpt: String(extraction.extractedText || '').slice(0, 6000),
      },
    },
    requiredOutputShape: {
      safeSummary: 'plain-language summary grounded in the report',
      reportType: 'one of Lab report, Imaging report, Prescription, Hospital summary, Clinical report',
      clinicalAreas: ['conditions or specialties explicitly suggested by the source'],
      measurements: [{ label: 'measurement name', value: 'reported value', unit: 'reported unit if available' }],
      medicinesMentioned: ['medicines explicitly named in the source'],
      conditionsMentioned: ['conditions explicitly named in the source'],
      followUpSuggestions: ['source-grounded next steps or doctor review reminders'],
      sourceHighlights: ['exact or near-exact source-grounded phrases from extracted content'],
      timelineSuggestions: [{ title: 'timeline title', detail: 'grounded explanation', date: 'YYYY-MM-DD', type: 'AI Summary or AI Follow-up' }],
      safetyNotes: ['brief safety disclaimer'],
    },
  }
}

export function analyzeReportForHealthMapAi({ patient, report, extraction }) {
  const lowerText = normalizeText(extraction.extractedText).toLowerCase()
  const observations = extraction.extractedObservations || []
  const reportType = detectReportType(report.name, extraction.extractedText || '')

  const clinicalAreas = pickMatches(lowerText, [
    ['Cardiology', /heart|cardio|blood pressure|cholesterol/],
    ['Endocrinology', /thyroid|tsh|t3|t4|glucose|hba1c|diabet/],
    ['Nephrology', /creatinine|urea|renal|kidney/],
    ['Hematology', /hemoglobin|platelet|wbc|rbc|cbc/],
    ['Liver care', /bilirubin|liver|sgot|sgpt/],
  ])

  const conditionsMentioned = unique([
    ...pickMatches(lowerText, [
      ['Diabetes', /diabet|hba1c|glucose/],
      ['Thyroid disorder', /thyroid|tsh|t3|t4/],
      ['Anemia', /anemia|hemoglobin|hb/],
      ['Hypertension', /hypertension|blood pressure|\bbp\b/],
      ['Kidney concern', /creatinine|kidney|renal/],
    ]),
  ])

  const medicinesMentioned = unique((String(extraction.extractedText || '').match(/\b(?:metformin|thyroxine|levothyroxine|amlodipine|telmisartan|atorvastatin|aspirin)\b/gi) || []).map((item) => item.trim()))
  const measurements = extractMeasurements(observations, extraction.extractedText || '')

  const followUpSuggestions = unique([
    conditionsMentioned.length > 0 ? 'Discuss these findings with your treating doctor before changing any medicines.' : '',
    report.status === 'Needs follow-up' ? 'This report is marked as needing follow-up. Schedule or prepare for review.' : '',
    measurements.length > 0 ? 'Track repeat measurements over time and compare them with future reports.' : '',
  ]).slice(0, 3)

  const structuredData = {
    reportType,
    clinicalAreas,
    measurements,
    medicinesMentioned,
    conditionsMentioned,
    followUpSuggestions,
    sourceHighlights: buildSourceHighlights(extraction.extractedSummary, observations),
    patientMentions: extraction.extractedPatient || {},
  }

  const timelineSuggestions = buildTimelineSuggestions({ report, structuredData, extractionStatus: extraction.extractionStatus })
  const safeSummary = buildSafeSummary({ report, structuredData, patient })

  return {
    status: extraction.extractedText ? 'AI summary ready' : 'AI summary limited',
    engine: 'HealthMap AI structured summarizer',
    generatedAt: new Date().toISOString(),
    llmInput: buildHealthMapAiLlmInput({ patient, report, extraction }),
    safeOutput: {
      safeSummary,
      structuredData,
      timelineSuggestions,
      safetyNotes: [
        'This summary is for organizing and understanding your record.',
        'It does not replace a doctor and should not be used as a diagnosis or prescription.',
      ],
    },
  }
}
