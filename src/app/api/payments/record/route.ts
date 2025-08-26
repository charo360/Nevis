import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
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
    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(idToken)
    } catch (e: any) {
      console.warn('Invalid idToken:', e?.message || e)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const userId = decoded.uid

    // Idempotency: ensure we haven't recorded this session already
    let existing: any = null
    try {
      existing = await adminDb.collection('payments').where('sessionId', '==', sessionId).limit(1).get()
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('payments.record: Firestore read failed', msg)
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions')) {
        return NextResponse.json({ ok: false, reason: 'permission_denied', hint: 'Server cannot access Firestore. Check service account credentials and IAM roles (grant Firestore access).' }, { status: 503 })
      }
      return NextResponse.json({ error: 'Failed to query payments', details: msg }, { status: 500 })
    }

    if (!existing.empty) {
      return NextResponse.json({ ok: true, idempotent: true })
    }

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
      createdAt: Timestamp.fromDate(now)
    }

    try {
      await adminDb.collection('payments').add(paymentDoc)
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('payments.record: Firestore write failed', msg)
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions')) {
        return NextResponse.json({ ok: false, reason: 'permission_denied', hint: 'Server cannot write to Firestore. Check service account credentials and IAM roles (grant Firestore access).' }, { status: 503 })
      }
      return NextResponse.json({ error: 'Failed to record payment', details: msg }, { status: 500 })
    }

    // Update user's credits and plan atomically
    try {
      const userRef = adminDb.collection('users').doc(userId)
      await userRef.set(
        {
          plan: planId,
          totalCredits: FieldValue.increment(creditsToAdd),
          remainingCredits: FieldValue.increment(creditsToAdd),
          lastPlanChange: Timestamp.fromDate(now)
        },
        { merge: true }
      )
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('payments.record: Firestore user update failed', msg)
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions')) {
        return NextResponse.json({ ok: false, reason: 'permission_denied', hint: 'Server cannot update users collection. Check service account credentials and IAM roles (grant Firestore access).' }, { status: 503 })
      }
      return NextResponse.json({ error: 'Failed to update user credits', details: msg }, { status: 500 })
    }

    // Send receipt email if possible
    try {
      const userRecord = await adminAuth.getUser(userId)
      const email = userRecord.email
      if (email) {
        const html = paymentReceiptHTML({ planName: plan?.name || planId, amount, currency, credits: creditsToAdd, sessionId })
        const text = paymentReceiptText({ planName: plan?.name || planId, amount, currency, credits: creditsToAdd, sessionId })
        // Lazy import of sendEmail helper from auth endpoints to avoid duplicate implementations
        const { default: sendgridSend } = await import('@/app/api/auth/_sendEmailShim')
        // sendgridSend expects (to, subject, html, text?)
        await sendgridSend(email, `Payment receipt — ${plan?.name || planId}`, html, text)
      }
    } catch (e) {
      console.warn('Failed to send payment receipt email:', e)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('payments.record error', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
