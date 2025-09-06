import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { userService } from '@/lib/mongodb/database'
import { paymentReceiptHTML, paymentReceiptText } from '@/lib/email/paymentReceiptTemplate'
import { getPlanById } from '@/lib/pricing-data'

interface Body {
  idToken?: string
  sessionId: string
  planId: string
  amount: number
  currency: string
  paymentMethod?: string
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json()
    const { idToken, sessionId, planId, amount, currency, paymentMethod } = body

    if (!idToken) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (!sessionId || !planId || !amount || !currency) return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 })

    // Verify user
    const decoded = verifyToken(idToken)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const userId = decoded.userId

    // TODO: Check for existing payment in MongoDB
    // For now, we'll skip the idempotency check

    const plan = getPlanById(planId)
    const creditsToAdd = plan ? plan.credits : 0

    const now = new Date()

    // Record payment
    const paymentDoc = {
      userId,
      planId,
      sessionId,
      amount,
      currency,
      paymentMethod: paymentMethod || null,
      creditsAdded: creditsToAdd,
      createdAt: now.toISOString()
    }

    try {
      // TODO: Save to MongoDB payments collection
      console.log('Payment recorded:', paymentDoc)
    } catch (e: any) {
      return NextResponse.json({ error: 'Failed to record payment', details: e.message }, { status: 500 })
    }

    // Update user's credits and plan
    try {
      // TODO: Update user in MongoDB
      console.log('User credits updated:', { userId, planId, creditsToAdd })
    } catch (e: any) {
      return NextResponse.json({ error: 'Failed to update user credits', details: e.message }, { status: 500 })
    }

    // Send receipt email if possible
    try {
      // TODO: Get user email from MongoDB and send receipt
      console.log('Receipt email would be sent to user:', userId)
    } catch (e) {
      // Email sending is not critical, so we don't fail the request
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
