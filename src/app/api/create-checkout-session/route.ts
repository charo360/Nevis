import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/jwt'
import { getStripeConfig, getCheckoutUrls } from '@/lib/stripe-config'
import { getPlanById, planIdToStripePrice, PRICING_PLANS } from '@/lib/secure-pricing'

// Get environment-aware Stripe configuration
const stripeConfig = getStripeConfig()
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2023-10-16'
})

// Optional Supabase persistence (only if keys are provided)
let supabase: ReturnType<typeof createClient> | null = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

type Body = {
  planId?: string  // New secure format
  priceId?: string // Legacy format for backward compatibility
  quantity?: number
  customerEmail?: string
  mode?: 'payment' | 'subscription'
  metadata?: Record<string, string>
}

// No longer needed - using secure pricing system instead

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Body
    
    // Debug logging for troubleshooting
    console.log('🔄 Checkout request received:', {
      planId: body.planId,
      priceId: body.priceId,
      customerEmail: body.customerEmail,
      hasAuth: !!req.headers.get('authorization'),
      environment: stripeConfig.environment
    });

    // Support both old priceId (legacy) and new planId (secure) formats
    const planId = body.planId || body.priceId; // priceId for backward compatibility
    
    if (!planId) {
      return NextResponse.json({ error: 'Missing planId in request body' }, { status: 400 })
    }

    // If it's a legacy priceId (starts with price_), convert it to planId  
    let actualPlanId = planId;
    if (planId.startsWith('price_')) {
      // Map old price IDs to plan IDs for backward compatibility
      const legacyMapping: Record<string, string> = {
        // Production price IDs
        'price_1SCjDVCXEBwbxwozB5a6oXUp': 'try-free',
        'price_1SDUAiCXEBwbxwozr788ke9X': 'starter',
        'price_1SCjJlCXEBwbxwozhKzAtCH1': 'growth',
        'price_1SCjMpCXEBwbxwozhT1RWAYP': 'pro',
        'price_1SCjPgCXEBwbxwozjCNWanOY': 'enterprise',
        // Development/Test price IDs (corrected)
        'price_1SCkZMCik0ZJySexGFq9FtxO': 'try-free',
        'price_1SCwe1Cik0ZJySexYVYW97uQ': 'starter',
        'price_1SCkefCik0ZJySexBO34LAsl': 'growth',
        'price_1SCkhJCik0ZJySexgkXpFKTO': 'pro',
        'price_1SCkjkCik0ZJySexpx9RGhu3': 'enterprise'
      };
      actualPlanId = legacyMapping[planId] || 'starter'; // fallback to starter
      console.log(`🔄 Converting legacy price ID ${planId} to plan ID: ${actualPlanId}`);
    }

    // Validate plan ID and get plan details
    const planDetails = getPlanById(actualPlanId)
    if (!planDetails) {
      console.error(`❌ Invalid plan ID attempted: ${actualPlanId}`, {
        attempted: actualPlanId,
        original: planId,
        environment: stripeConfig.environment,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Invalid pricing plan selected. Please try again or contact support.'
      }, { status: 400 })
    }

    // Convert plan ID to Stripe price ID (server-side only)
    const stripePriceId = planIdToStripePrice(actualPlanId)
    if (!stripePriceId) {
      console.error(`❌ No Stripe price ID found for plan: ${actualPlanId}`, {
        planId: actualPlanId,
        environment: stripeConfig.environment,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Pricing configuration error. Please contact support.'
      }, { status: 500 })
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
    const metadata: Record<string, string> = { 
      ...(body.metadata || {}), 
      planId: actualPlanId,
      planName: planDetails.name,
      credits: planDetails.credits.toString()
    }

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
            price: stripePriceId,  // Use the mapped Stripe price ID
            quantity: Number(quantity) || 1,
          },
        ],
        allow_promotion_codes: true,
        customer_email: body.customerEmail,
        metadata: metadataWithUser,
        client_reference_id: clientReferenceId,
        success_url: getCheckoutUrls().successUrl,
        cancel_url: getCheckoutUrls().cancelUrl,
        locale: 'auto',
      })
    } catch (stripeError: any) {
      // Log detailed error internally but don't expose sensitive data
      console.error('❌ Stripe session creation failed:', {
        error: stripeError.message,
        code: stripeError.code,
        planId: actualPlanId,
        stripePriceId: stripePriceId, // Safe to log internally
        environment: stripeConfig.environment,
        timestamp: new Date().toISOString()
      })
      
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          error: 'The selected pricing plan is not available. Please try again or contact support.'
        }, { status: 400 })
      }
      
      // Generic error response for security
      return NextResponse.json({ 
        error: 'Unable to process payment. Please try again or contact support.'
      }, { status: 500 })
    }

    // Persist pending payment to Supabase if available
    if (supabase) {
      try {
        const payload = {
          user_id: verifiedUserId,
          stripe_session_id: session.id,
          plan_id: actualPlanId,
          amount: planDetails.price,
          status: 'pending',
          credits_added: planDetails.credits,
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
    // Log detailed error internally
    console.error('❌ Checkout session creation failed:', {
      error: err?.message || 'Unknown error',
      stack: err?.stack,
      timestamp: new Date().toISOString(),
      environment: stripeConfig.environment
    })
    
    // Return generic error response to prevent information leakage
    return NextResponse.json({ 
      error: 'Payment processing is temporarily unavailable. Please try again later.'
    }, { status: 500 })
  }
}
