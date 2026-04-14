import crypto from 'node:crypto'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const RAZORPAY_API = 'https://api.razorpay.com/v1'

function razorpayAuth() {
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
}

export function isPaymentConfigured() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)
}

export async function createRazorpayOrder(amountInPaise, currency = 'INR', receipt = '') {
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': razorpayAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.description || 'Failed to create order')
  }
  return res.json()
}

export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = orderId + '|' + paymentId
  const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex')
  return expected === signature
}

export function getRazorpayKeyId() {
  return RAZORPAY_KEY_ID
}
