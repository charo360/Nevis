import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  // Fail fast at import time in development so it's obvious
  throw new Error('Missing STRIPE_SECRET_KEY in environment')
}

const stripe = new Stripe(stripeSecret)

type Body = {
  priceId: string
  quantity?: number
  customerEmail?: string
  mode?: 'payment' | 'subscription'
  metadata?: Record<string, string>
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Body

    if (!body || !body.priceId) {
      return NextResponse.json({ error: 'Missing priceId in request body' }, { status: 400 })
    }

    const url = new URL(req.url)
    const origin = url.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const quantity = body.quantity && body.quantity > 0 ? body.quantity : 1
    const mode = body.mode === 'subscription' ? 'subscription' : 'payment'

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: body.priceId,
          quantity: Number(quantity) || 1,
        },
      ],
      allow_promotion_codes: true,
      customer_email: body.customerEmail,
      metadata: body.metadata,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      locale: 'auto',
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: any) {
    console.error('create-checkout-session error:', err)
    return NextResponse.json({ error: (err && err.message) || 'Internal Server Error' }, { status: 500 })
  }
}
