import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/jwt'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  // Fail fast at import time in development so it's obvious
  throw new Error('Missing STRIPE_SECRET_KEY in environment')
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16'
})

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
  // CORRECT price IDs from your TEST Stripe account
  'price_1SCkjkCik0ZJySexpx9RGhu3': { planId: 'power', credits: 550, name: 'Enterprise Agent' },
  'price_1SCkhJCik0ZJySexgkXpFKTO': { planId: 'pro', credits: 250, name: 'Pro Agent' },
  'price_1SCkefCik0ZJySexBO34LAsl': { planId: 'growth', credits: 150, name: 'Growth Agent' },
  'price_1SCwe1Cik0ZJySexYVYW97uQ': { planId: 'starter', credits: 50, name: 'Starter Agent' },
  'price_1SCkZMCik0ZJySexGFq9FtxO': { planId: 'free', credits: 10, name: 'Try Agent Free' },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Body

    if (!body || !body.priceId) {
      return NextResponse.json({ error: 'Missing priceId in request body' }, { status: 400 })
    }

    // Validate price ID exists in our mapping
    const mapped = PRICE_MAP[body.priceId]
    if (!mapped) {
      return NextResponse.json({ 
        error: `Invalid price ID: ${body.priceId}. Available prices: ${Object.keys(PRICE_MAP).join(', ')}`
      }, { status: 400 })
    }

    // Determine the correct origin based on environment
    const getAppOrigin = () => {
      if (process.env.NODE_ENV === 'production') {
        return 'https://crevo.app'
      }
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    }
    
    const origin = getAppOrigin()

    const quantity = body.quantity && body.quantity > 0 ? body.quantity : 1
    const mode = body.mode === 'subscription' ? 'subscription' : 'payment'
    const metadata: Record<string, string> = { ...(body.metadata || {}), planId: mapped.planId, priceId: body.priceId }

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
      try {
        const decoded = verifyToken(token)
        if (decoded) verifiedUserId = decoded.userId
      } catch (jwtError) {
        console.warn('JWT token verification failed:', jwtError)
      }
    }

    if (!verifiedUserId) {
      return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 })
    }

    clientReferenceId = verifiedUserId
    const metadataWithUser: Record<string, string> = { ...metadata, userId: verifiedUserId }

    // Create Stripe Checkout session (using price id directly)
    let session
    try {
      session = await stripe.checkout.sessions.create({
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
    } catch (stripeError: any) {
      console.error('❌ Stripe session creation failed:', stripeError.message)
      
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          error: `Price not found: ${body.priceId}. Please verify this price ID exists in your Stripe account.`,
          details: stripeError.message
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create checkout session',
        details: stripeError.message
      }, { status: 500 })
    }

    // Persist pending payment to Supabase if available
    if (supabase) {
      try {
        // Get default amount from known plans
        const defaultAmount = (() => {
          if (mapped?.planId === 'power') return 99
          if (mapped?.planId === 'pro') return 49
          if (mapped?.planId === 'growth') return 29
          if (mapped?.planId === 'starter') return 10
          if (mapped?.planId === 'free') return 0
          return 0
        })()

        const payload = {
          user_id: verifiedUserId,
          stripe_session_id: session.id,
          plan_id: mapped ? mapped.planId : 'custom',
          amount: defaultAmount,
          status: 'pending',
          credits_added: mapped ? mapped.credits : 0,
        }

        const { error: insertError } = await supabase.from('payment_transactions').insert(payload as any)
        if (insertError) {
          console.error('Database insert failed:', insertError)
        }
      } catch (e) {
        console.error('Failed to persist checkout session to Supabase:', e)
      }
    }

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (err: any) {
    console.error('❌ Checkout session creation failed:', err)
    return NextResponse.json({ 
      error: (err && err.message) || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}
