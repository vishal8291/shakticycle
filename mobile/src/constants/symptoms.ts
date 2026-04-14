export type SymptomGuidance = 'Emergency' | 'See a doctor' | 'Monitor'

export const SYMPTOMS: Array<{ label: string; guidance: SymptomGuidance; note: string }> = [
  { label: 'Chest pain', guidance: 'Emergency', note: 'Severe or radiating chest pain needs urgent care.' },
  { label: 'Shortness of breath', guidance: 'Emergency', note: 'Especially if sudden or at rest.' },
  { label: 'Sudden severe headache', guidance: 'Emergency', note: 'Worst-ever headache needs immediate evaluation.' },
  { label: 'Fainting', guidance: 'Emergency', note: 'Loss of consciousness requires same-day review.' },
  { label: 'High fever', guidance: 'See a doctor', note: 'Persistent fever above 39°C / 102°F.' },
  { label: 'Persistent cough', guidance: 'See a doctor', note: 'Cough lasting over 2 weeks.' },
  { label: 'Severe abdominal pain', guidance: 'See a doctor', note: 'Sharp or worsening belly pain.' },
  { label: 'Vomiting', guidance: 'See a doctor', note: 'Especially with inability to keep fluids.' },
  { label: 'Diarrhea', guidance: 'Monitor', note: 'Watch for dehydration, see doctor if over 2 days.' },
  { label: 'Mild fever', guidance: 'Monitor', note: 'Rest, hydrate, track temperature.' },
  { label: 'Headache', guidance: 'Monitor', note: 'Track frequency and triggers.' },
  { label: 'Sore throat', guidance: 'Monitor', note: 'Usually resolves in 3-5 days.' },
  { label: 'Runny nose', guidance: 'Monitor', note: 'Common cold symptom, track other symptoms.' },
  { label: 'Fatigue', guidance: 'Monitor', note: 'Note when it started and contributing factors.' },
  { label: 'Joint pain', guidance: 'Monitor', note: 'Track affected joints and activity.' },
  { label: 'Rash', guidance: 'Monitor', note: 'Photograph and see doctor if spreading.' },
  { label: 'Dizziness', guidance: 'Monitor', note: 'See doctor if persistent or with fainting.' },
  { label: 'Back pain', guidance: 'Monitor', note: 'Note triggers, activities, duration.' },
  { label: 'Trouble sleeping', guidance: 'Monitor', note: 'Track pattern and possible causes.' },
  { label: 'Anxiety', guidance: 'Monitor', note: 'Note triggers; see a professional if persistent.' },
]

export const TIMELINE_TYPES = ['System', 'Symptoms', 'Vitals', 'Doctor', 'Report', 'Medication']
