import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/jwt'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  // Fail fast at import time in development so it's obvious
  throw new Error('Missing STRIPE_SECRET_KEY in environment')
}

const stripe = new Stripe(stripeSecret)

// Optional Supabase persistence (only if keys are provided)
let supabase: ReturnType<typeof createClient> | null = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

type Body = {
  priceId: string
  quantity?: number
  customerEmail?: string
  mode?: 'payment' | 'subscription'
  metadata?: Record<string, string>
}

// Map known Stripe price IDs to internal plans/credits
const PRICE_MAP: Record<string, { planId: string; credits: number; name: string }> = {
  // new price ids provided by the user
  'price_1SCjPgCXEBwbxwozjCNWanOY': { planId: 'enterprise', credits: 550, name: 'Enterprise Agent' },
  'price_1SCjMpCXEBwbxwozhT1RWAYP': { planId: 'pro', credits: 250, name: 'Pro Agent' },
  'price_1SCjJlCXEBwbxwozhKzAtCH1': { planId: 'growth', credits: 150, name: 'Growth Agent' },
  'price_1SCjHOCXEBwbxwozVVUdU1TW': { planId: 'starter', credits: 50, name: 'Starter Agent' },
  'price_1SCjDVCXEBwbxwozB5a6oXUp': { planId: 'free', credits: 10, name: 'Try Agent Free' },
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

  // Determine plan from price map if available
  const mapped = PRICE_MAP[body.priceId]
  const metadata: Record<string, string> = { ...(body.metadata || {}), planId: mapped ? mapped.planId : 'custom', priceId: body.priceId }

    // Require Authorization header (Bearer token) to associate session with a user
    const authHeader = req.headers.get('authorization') || ''
    let clientReferenceId: string | undefined = undefined
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - missing token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // Try Supabase verification first (most callers supply Supabase access tokens)
    let verifiedUserId: string | null = null
    try {
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token as string)
        if (!error && user) {
          verifiedUserId = user.id
        }
      }
    } catch (e) {
      // ignore and try JWT fallback
      console.warn('Supabase token verification attempt failed, falling back to JWT:', e)
    }

    // Fallback to application JWT verification
    if (!verifiedUserId) {
      const decoded = verifyToken(token)
      if (decoded) verifiedUserId = decoded.userId
    }

    if (!verifiedUserId) {
      return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 })
    }

    clientReferenceId = verifiedUserId
    const metadataWithUser: Record<string, string> = { ...metadata, userId: verifiedUserId }

    // Create Stripe Checkout session (using price id directly)
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
  metadata: metadataWithUser,
      client_reference_id: clientReferenceId,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      locale: 'auto',
    })

    // Persist pending payment to Supabase if available
    if (supabase) {
      try {
        const payload: any = {
          stripe_session_id: session.id,
          user_id: verifiedUserId || null,
          price_id: body.priceId,
          plan_id: mapped ? mapped.planId : null,
          credits_reserved: mapped ? mapped.credits : null,
          amount: null,
          currency: null,
          status: 'pending',
          metadata: metadataWithUser,
          created_at: new Date().toISOString(),
        }

        // Attempt to read amount from session if available
        if ((session as any).amount_total) {
          payload.amount = (session as any).amount_total / 100
        }
        if ((session as any).currency) {
          payload.currency = (session as any).currency
        }

        await supabase.from('payment_transactions').insert(payload)
      } catch (e) {
        console.error('Failed to persist checkout session to Supabase:', e)
      }
    }

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: (err && err.message) || 'Internal Server Error' }, { status: 500 })
  }
}
