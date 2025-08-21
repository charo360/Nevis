import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { email, newPassword } = req.body as { email?: string; newPassword?: string }
    if (!email || !newPassword) return res.status(400).json({ error: 'Missing email or newPassword' })

    const normalizedEmail = String(email).trim().toLowerCase()

    // Find user by email using adminAuth
    const userRecord = await adminAuth.getUserByEmail(normalizedEmail).catch(() => null)
    if (!userRecord) return res.status(404).json({ error: 'User not found' })

    await adminAuth.updateUser(userRecord.uid, { password: newPassword })
    return res.json({ ok: true })
  } catch (err: any) {
    console.error('reset-password error', err)
    return res.status(500).json({ error: err.message || 'server error' })
  }
}
