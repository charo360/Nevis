import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { email, code, type } = req.body as { email?: string; code?: string; type?: string }
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' })

    const normalizedEmail = String(email).trim().toLowerCase()

    // Query latest unused code for this email and type
    const q = adminDb.collection('authCodes')
      .where('email', '==', normalizedEmail)
      .where('type', '==', type || 'signup')
      .where('used', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(5)

    const snaps = await q.get()
    type CodeDoc = { id: string; data: any }
    let matched: CodeDoc | null = null
    snaps.forEach(doc => {
      const data: any = doc.data()
      if (data.code === code) matched = { id: doc.id, data }
    })

    if (!matched) return res.status(400).json({ ok: false, error: 'Invalid or expired code' })

    const expiresAt = (matched.data.expiresAt as Timestamp).toDate()
    if (expiresAt < new Date()) return res.status(400).json({ ok: false, error: 'Code expired' })

    // Mark code used
    await adminDb.collection('authCodes').doc(matched.id).update({ used: true })

    // If type is reset, allow change password flow by returning ok
    return res.json({ ok: true })
  } catch (err: any) {
    console.error('verify-code error', err)
    return res.status(500).json({ error: err.message || 'server error' })
  }
}
