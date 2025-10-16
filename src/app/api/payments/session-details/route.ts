import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken } from '@/lib/auth/jwt'
import { getStripeConfig } from '@/lib/stripe-config'

const stripeConfig = getStripeConfig()
const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sessionId = String(body?.sessionId || '').trim()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    // Retrieve the Checkout Session from Stripe. This endpoint intentionally allows
    // unauthenticated access for basic session metadata lookup because the session_id
    // is a hard-to-guess token created by Stripe and is included in the redirect URL.
    const session = await stripe.checkout.sessions.retrieve(sessionId as string)

    // session.amount_total is in cents; session.currency is lowercase code
    const amountCents = (session as any).amount_total ?? (session as any).amount_subtotal ?? 0
    const currency = (session as any).currency || 'usd'
    const planId = (session as any).metadata?.planId || (session as any).metadata?.plan_id || null

    return NextResponse.json({ ok: true, planId, amountCents, currency })
  } catch (err: any) {
    console.error('Failed to retrieve session details:', err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
