import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { email } = body as { email?: string }
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const normalizedEmail = String(email).trim().toLowerCase()

    try {
      const user = await adminAuth.getUserByEmail(normalizedEmail)
      // Return a minimal, masked payload for debugging
      const masked = {
        uid: user.uid ? `${user.uid.slice(0, 6)}...` : null,
        email: user.email,
        emailVerified: user.emailVerified,
        providers: user.providerData?.map(p => p.providerId) || [],
      }
      console.info('debug-user: found user for', normalizedEmail, 'uid:', user.uid)
      return NextResponse.json({ ok: true, user: masked })
    } catch (err: any) {
      console.warn('debug-user: adminAuth.getUserByEmail error for', normalizedEmail, err && err.message ? err.message : err)
      return NextResponse.json({ ok: false, error: 'User not found in Firebase Auth' }, { status: 404 })
    }
  } catch (err: any) {
    console.error('debug-user error', err)
    return NextResponse.json({ error: err?.message || 'server error' }, { status: 500 })
  }
}
