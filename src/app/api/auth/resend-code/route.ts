import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import fs from 'fs/promises'
import path from 'path'
import { verificationEmailHTML, verificationEmailText } from '@/lib/email/verificationTemplate'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@nevis.app'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@nevis.app'

async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!SENDGRID_API_KEY) throw new Error('SendGrid API key not configured')

  const payload: any = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: SENDGRID_FROM, name: 'Nevis' },
    reply_to: { email: SUPPORT_EMAIL, name: 'Nevis Support' },
    subject,
    // If plain text is provided, SendGrid requires text/plain first, then text/html
    content: text ? [{ type: 'text/plain', value: text }, { type: 'text/html', value: html }] : [{ type: 'text/html', value: html }],
    headers: { 'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}>` },
  }

  const enableSandbox = process.env.SENDGRID_SANDBOX === 'true'
  if (enableSandbox) {
    payload.mail_settings = { sandbox_mode: { enable: true } }
    console.info('SendGrid sandbox mode enabled (SENDGRID_SANDBOX=true)')
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text()
    const message = `SendGrid error: ${res.status} ${body}`
    if (process.env.NODE_ENV !== 'production' || enableSandbox) {
      console.warn('SendGrid warning (non-production):', message)
      console.warn('SendGrid response body:', body)
      if (res.status === 403) {
        console.warn('SendGrid 403: common cause is an unverified sender identity. Verify SENDGRID_FROM in SendGrid dashboard or verify a sending domain.')
      }
      return
    }
    throw new Error(message)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, type = 'signup' } = body as { email?: string; type?: string }
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const normalizedEmail = String(email).trim().toLowerCase()

    // Invalidate previous codes for this email/type (try Firestore, otherwise update local file)
    try {
      const snaps = await adminDb.collection('authCodes')
        .where('email', '==', normalizedEmail)
        .where('type', '==', type)
        .where('used', '==', false)
        .get()

      const batch = adminDb.batch()
      snaps.forEach(doc => batch.update(doc.ref, { used: true }))
      await batch.commit()
    } catch (e) {
      try {
        const file = path.resolve(process.cwd(), 'tmp', 'authCodes.json')
        const raw = await fs.readFile(file, 'utf-8')
        const arr = JSON.parse(raw || '[]')
        for (const it of arr) {
          if (it.email === normalizedEmail && it.type === type && !it.used) it.used = true
        }
        await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf-8')
      } catch (fe) {}
    }

    // Create a new code record
    const code = Math.floor(10000 + Math.random() * 90000).toString()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 15)

    try {
      await adminDb.collection('authCodes').add({
        email: normalizedEmail,
        code,
        type,
        used: false,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
      })
    } catch (e) {
      const DIR = path.resolve(process.cwd(), 'tmp')
      await fs.mkdir(DIR, { recursive: true })
      const file = path.join(DIR, 'authCodes.json')
      let current = []
      try { current = JSON.parse(await fs.readFile(file, 'utf-8') || '[]') } catch (er) { current = [] }
      current.push({ email: normalizedEmail, code, type, used: false, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() })
      await fs.writeFile(file, JSON.stringify(current, null, 2), 'utf-8')
    }

  const html = verificationEmailHTML({ code, appName: 'Nevis', expiresMinutes: 15 })
  const text = verificationEmailText({ code, appName: 'Nevis', expiresMinutes: 15 })

  await sendEmail(normalizedEmail, 'Your Nevis verification code', html, text)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('resend-code error', err)
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
