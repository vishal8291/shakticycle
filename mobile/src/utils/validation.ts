export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function isMobile(value: string): boolean {
  const cleaned = value.replace(/[\s-()]/g, '')
  return /^(\+?\d{10,15})$/.test(cleaned)
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function minLength(value: string, n: number): boolean {
  return value.trim().length >= n
}

export function passwordStrength(value: string): 'weak' | 'ok' | 'strong' {
  if (value.length < 8) return 'weak'
  const hasUpper = /[A-Z]/.test(value)
  const hasDigit = /\d/.test(value)
  const hasSymbol = /[^A-Za-z0-9]/.test(value)
  const score = (hasUpper ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSymbol ? 1 : 0) + (value.length >= 12 ? 1 : 0)
  if (score >= 3) return 'strong'
  if (score >= 1) return 'ok'
  return 'weak'
}

export type FieldError = { field: string; message: string }

export function validate(rules: Array<() => FieldError | null>): FieldError[] {
  const errors: FieldError[] = []
  for (const rule of rules) {
    const r = rule()
    if (r) errors.push(r)
  }
  return errors
}

export function requireField(field: string, value: string, label?: string): FieldError | null {
  return isNonEmpty(value) ? null : { field, message: `${label || field} is required` }
}
