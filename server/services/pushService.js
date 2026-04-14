// Thin wrapper around the Expo Push API. No external dependencies.
// https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function isExpoPushToken(token) {
  return typeof token === 'string' && /^ExponentPushToken\[.+\]$/.test(token.trim())
}

export async function sendExpoPushNotifications(messages) {
  const valid = (messages || []).filter((m) => m && isExpoPushToken(m.to))
  if (!valid.length) return { sent: 0, invalid: messages.length }
  const batches = chunk(valid, 100)
  let sent = 0
  for (const batch of batches) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })
      if (res.ok) sent += batch.length
      else {
        console.warn('[push] batch failed:', res.status, await res.text().catch(() => ''))
      }
    } catch (err) {
      console.warn('[push] send error:', err?.message || err)
    }
  }
  return { sent, invalid: messages.length - valid.length }
}

export async function sendPushToUser(user, { title, body, data }) {
  const tokens = (user?.pushTokens || []).map((t) => t.token).filter(isExpoPushToken)
  if (!tokens.length) return { sent: 0, invalid: 0 }
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data: data || {},
    channelId: 'reminders',
  }))
  return sendExpoPushNotifications(messages)
}

export { isExpoPushToken }
