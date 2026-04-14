import { PDFParse } from 'pdf-parse'

function normalizeWhitespace(value) {
  return String(value || '').replace(/\r/g, '\n').replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
}

function matchValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function buildSummary(lines) {
  return lines.slice(0, 6).join(' | ').slice(0, 500)
}

function extractObservations(text) {
  const lines = normalizeWhitespace(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.filter((line) => {
    const lower = line.toLowerCase()
    return /\b(hb|hemoglobin|glucose|sugar|cholesterol|creatinine|platelet|wbc|rbc|vitamin|thyroid|tsh|t3|t4|bilirubin|urea|uric acid|bp|blood pressure)\b/.test(lower)
  }).slice(0, 12)
}

function extractPatientDetails(text) {
  return {
    name: matchValue(text, [
      /patient name\s*[:\-]\s*([^\n]+)/i,
      /name\s*[:\-]\s*([^\n]+)/i,
    ]),
    age: matchValue(text, [
      /age\s*[:\-]\s*(\d{1,3})/i,
    ]),
    sex: matchValue(text, [
      /sex\s*[:\-]\s*([^\n]+)/i,
      /gender\s*[:\-]\s*([^\n]+)/i,
    ]),
    reportDate: matchValue(text, [
      /report date\s*[:\-]\s*([^\n]+)/i,
      /date\s*[:\-]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    ]),
  }
}

async function readPdfText(fileBuffer) {
  const parser = new PDFParse({ data: fileBuffer })

  try {
    const result = await parser.getText()
    return normalizeWhitespace(result?.text || '')
  } finally {
    await parser.destroy().catch(() => {})
  }
}

export async function extractReportDetails(fileBuffer, fileMeta = {}) {
  const isPdf = (fileMeta.mimeType || '').includes('pdf') || (fileMeta.originalFileName || '').toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return {
      extractedText: '',
      extractedSummary: '',
      extractedPatient: { name: '', age: '', sex: '', reportDate: '' },
      extractedObservations: [],
      extractionStatus: 'Not a PDF',
    }
  }

  try {
    const extractedText = await readPdfText(fileBuffer)

    if (!extractedText) {
      return {
        extractedText: '',
        extractedSummary: '',
        extractedPatient: { name: '', age: '', sex: '', reportDate: '' },
        extractedObservations: [],
        extractionStatus: 'No readable text found. This PDF may need OCR.',
      }
    }

    const lines = extractedText.split('\n').filter(Boolean)

    return {
      extractedText,
      extractedSummary: buildSummary(lines),
      extractedPatient: extractPatientDetails(extractedText),
      extractedObservations: extractObservations(extractedText),
      extractionStatus: 'Text extracted',
    }
  } catch (error) {
    return {
      extractedText: '',
      extractedSummary: '',
      extractedPatient: { name: '', age: '', sex: '', reportDate: '' },
      extractedObservations: [],
      extractionStatus: `Could not read PDF text: ${error.message}`,
    }
  }
}