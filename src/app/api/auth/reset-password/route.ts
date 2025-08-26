import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, newPassword } = body as { email?: string; newPassword?: string }
    if (!email || !newPassword) return NextResponse.json({ error: 'Missing email or newPassword' }, { status: 400 })

    const normalizedEmail = String(email).trim().toLowerCase()

    // Diagnostic logging: surface which email is being requested and which project the admin SDK is connected to.
    try {
      const proj = (adminAuth?.app?.options && (adminAuth.app.options as any).projectId) || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      console.info('reset-password: attempting password reset for', normalizedEmail, 'against project:', proj)
    } catch (e) {
      console.warn('reset-password: could not determine admin project', e)
    }

    const userRecord = await adminAuth.getUserByEmail(normalizedEmail).catch((err) => {
      console.warn('adminAuth.getUserByEmail error for', normalizedEmail, err instanceof Error ? err.message : err)
      return null
    })

    if (!userRecord) {
      console.warn('reset-password: user not found for', normalizedEmail)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await adminAuth.updateUser(userRecord.uid, { password: newPassword })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('reset-password error', err)
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
