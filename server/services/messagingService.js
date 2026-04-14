import nodemailer from 'nodemailer'
import twilio from 'twilio'

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'no-reply@healthmap.local'
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM || ''

const isProd = process.env.NODE_ENV === 'production'

const transporter = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

const smsClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

export function emailConfigured() {
  return Boolean(transporter)
}

export function smsConfigured() {
  return Boolean(smsClient && TWILIO_SMS_FROM)
}

export async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error('Recipient email is required.')
  if (!transporter) {
    if (!isProd) {
      console.log(`[dev-email] To: ${to} | Subject: ${subject}`)
      return { accepted: [to], mocked: true }
    }
    throw new Error('Email sender is not configured.')
  }

  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  })
}

export async function sendSms({ to, body }) {
  if (!to) throw new Error('Recipient mobile number is required.')
  if (!smsConfigured()) {
    if (!isProd) {
      console.log(`[dev-sms] To: ${to} | Message: ${body}`)
      return { mocked: true, to }
    }
    throw new Error('SMS sender is not configured.')
  }

  return smsClient.messages.create({
    from: TWILIO_SMS_FROM,
    to,
    body,
  })
}

export async function sendPasswordResetEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: 'HealthMap password reset code',
    text: `Hi ${name || 'there'}, your HealthMap password reset code is ${code}. It will expire in 15 minutes.`,
    html: `<p>Hi ${name || 'there'},</p><p>Your <strong>HealthMap</strong> password reset code is <strong>${code}</strong>.</p><p>This code will expire in 15 minutes.</p>`,
  })
}

export async function sendAppointmentReminderEmail({ to, name, appointment }) {
  return sendEmail({
    to,
    subject: `HealthMap reminder: ${appointment.title}`,
    text: `Hi ${name || 'there'}, this is a reminder for ${appointment.title} with ${appointment.doctor} on ${appointment.date} at ${appointment.time}${appointment.location ? ` at ${appointment.location}` : ''}.`,
    html: `<p>Hi ${name || 'there'},</p><p>This is a reminder for <strong>${appointment.title}</strong> with <strong>${appointment.doctor}</strong> on <strong>${appointment.date}</strong> at <strong>${appointment.time}</strong>${appointment.location ? ` at <strong>${appointment.location}</strong>` : ''}.</p>`,
  })
}

export async function sendAppointmentReminderSms({ mobileNumber, appointment }) {
  return sendSms({
    to: mobileNumber,
    body: `HealthMap reminder: ${appointment.title} with ${appointment.doctor} on ${appointment.date} at ${appointment.time}${appointment.location ? `, ${appointment.location}` : ''}.`,
  })
}

export async function sendMobileOtpMessage({ mobileNumber, email, name, otpCode }) {
  if (smsConfigured()) {
    await sendSms({
      to: mobileNumber,
      body: `Your HealthMap OTP is ${otpCode}. It expires in 10 minutes.`,
    })
    return { channel: 'sms' }
  }

  if (email) {
    await sendEmail({
      to: email,
      subject: 'HealthMap mobile login OTP',
      text: `Hi ${name || 'there'}, your HealthMap mobile login OTP is ${otpCode}. It will expire in 10 minutes.`,
      html: `<p>Hi ${name || 'there'},</p><p>Your <strong>HealthMap</strong> mobile login OTP is <strong>${otpCode}</strong>.</p><p>This code will expire in 10 minutes.</p>`,
    })
    return { channel: 'email-fallback' }
  }

  if (!isProd) {
    console.log(`[dev-otp] Mobile ${mobileNumber} OTP: ${otpCode}`)
    return { channel: 'dev-log' }
  }

  throw new Error('Mobile OTP sender is not configured yet.')
}
