import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY) throw new Error('SendGrid API key not configured')

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'no-reply@nevis.app', name: 'Nevis' },
    subject,
    content: [{ type: 'text/html', value: html }],
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
    throw new Error(`SendGrid error: ${res.status} ${body}`)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { email, type = 'signup' } = req.body as { email?: string; type?: string }
    if (!email) return res.status(400).json({ error: 'Missing email' })

    const normalizedEmail = String(email).trim().toLowerCase()

    // Invalidate previous codes for this email/type
    const snaps = await adminDb.collection('authCodes')
      .where('email', '==', normalizedEmail)
      .where('type', '==', type)
      .where('used', '==', false)
      .get()

    const batch = adminDb.batch()
    snaps.forEach(doc => batch.update(doc.ref, { used: true }))
    await batch.commit()

    // Create a new code record
    const code = Math.floor(10000 + Math.random() * 90000).toString()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 15)

    await adminDb.collection('authCodes').add({
      email: normalizedEmail,
      code,
      type,
      used: false,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    })

    const html = `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111827;">
        <div style="background:#6B21A8;padding:20px;border-radius:8px;color:white;text-align:center;">
          <h1 style="margin:0;font-size:20px;">Nevis Verification</h1>
        </div>
        <div style="padding:18px;border:1px solid #E5E7EB;border-top:0;border-radius:0 0 8px 8px;background:#ffffff;">
          <p style="margin:0 0 12px 0;color:#374151">Your verification code is:</p>
          <div style="font-size:28px;font-weight:700;color:#111827;margin:10px 0;padding:12px;background:#F3F4F6;border-radius:6px;display:inline-block;">${code}</div>
          <p style="color:#6B21A8;margin-top:12px">This code expires in 15 minutes.</p>
        </div>
      </div>
    `

    await sendEmail(normalizedEmail, 'Your Nevis verification code', html)

    return res.json({ ok: true })
  } catch (err: any) {
    console.error('resend-code error', err)
    return res.status(500).json({ error: err.message || 'server error' })
  }
}
