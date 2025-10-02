import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth/jwt'
import { getStripeConfig, getCheckoutUrls } from '@/lib/stripe-config'
import { getPlanById, planIdToStripePrice, PRICING_PLANS } from '@/lib/secure-pricing'

type Body = {
  planId?: string  // New secure format
  priceId?: string // Legacy format for backward compatibility
  quantity?: number
  customerEmail?: string
  mode?: 'payment' | 'subscription'
  metadata?: Record<string, string>
}

export async function POST(req: NextRequest) {
  let stripeConfig: any = null;
  let stripe: Stripe | null = null;
  let supabase: any = null;

  try {
    // Initialize configuration inside the function with error handling
    try {
      stripeConfig = getStripeConfig();
      stripe = new Stripe(stripeConfig.secretKey, {
        apiVersion: '2025-08-27.basil'
      });
      // Validate configured price IDs (best-effort) and log missing ones
      try {
        const { validateStripePrices } = await import('@/lib/stripe-config');
        const val = await validateStripePrices(stripe as any);
        if (val && !val.ok) {
          console.warn('⚠️ Stripe price validation detected missing price IDs:', val.missing || val.error);
        }
      } catch (e) {
        // ignore validator errors
      }
    } catch (configError: any) {
      console.error('❌ Stripe configuration error:', configError);
      return NextResponse.json({ 
        error: 'Payment system configuration error. Please try again later.'
      }, { status: 500 });
    }

    // Initialize Supabase if keys are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      } catch (supabaseError: any) {
        console.error('❌ Supabase initialization error:', supabaseError);
        // Continue without Supabase - don't fail the entire request
      }
    }

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
        'price_1SDqaWELJu3kIHjxZQBntjuO': 'try-free',
        'price_1SDqfQELJu3kIHjxzHWPNMPs': 'starter',
        'price_1SDqiKELJu3kIHjx0LWHBgfV': 'growth',
        'price_1SDqloELJu3kIHjxU187qSj1': 'pro',
        'price_1SDqp4ELJu3kIHjx7oLcQwzh': 'enterprise',
        // Development/Test price IDs  
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
        environment: stripeConfig?.environment || 'unknown',
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'Invalid pricing plan selected. Please try again or contact support.'
      }, { status: 400 })
    }

    // If the plan is free (price === 0), short-circuit Stripe and grant credits directly
    if (planDetails.price === 0) {
      console.log('ℹ️ Free plan selected - granting credits without Stripe:', { planId: actualPlanId, credits: planDetails.credits })

      // Persist the free transaction if Supabase is available and we have a user id in metadata
      if (supabase) {
        try {
          const userIdToPersist = body.metadata?.userId || null
          const payload = {
            user_id: userIdToPersist,
            stripe_session_id: null,
            plan_id: actualPlanId,
            amount: 0,
            status: 'completed',
            credits_added: planDetails.credits,
          }

          const { error: insertError } = await supabase.from('payment_transactions').insert(payload as any)
          if (insertError) {
            console.error('Database insert failed for free plan grant:', insertError)
          }
        } catch (e) {
          console.error('Failed to persist free plan grant to Supabase:', e)
        }
      } else {
        console.log('ℹ️ No Supabase configured - skipping persistence for free plan grant')
      }

      // Return success URL so frontend can redirect to the success page
      return NextResponse.json({ id: `free-${Date.now()}`, url: getCheckoutUrls().successUrl })
    }

    // Note: We'll map plan -> Stripe price later (after we know the mode)

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

    // Create Stripe Checkout session
    // For one-time payments (mode === 'payment') always use inline price_data so Checkout will open
    // For subscriptions, attempt to use mapped Stripe price IDs (server-side mapping)
    let session
    try {
      if (mode === 'payment') {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: { name: planDetails.name, metadata: { planId: actualPlanId } },
                unit_amount: Math.round((planDetails.price || 0) * 100),
              },
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
      } else {
        // subscription flow: require mapped Stripe price ID
        const mapped = planIdToStripePrice(actualPlanId)
        if (!mapped) {
          console.error('❌ Subscription plan has no mapped Stripe price ID:', actualPlanId)
          return NextResponse.json({ error: 'Subscription plan not available. Please contact support.' }, { status: 400 })
        }

        session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: mapped, quantity: Number(quantity) || 1 }],
          allow_promotion_codes: true,
          customer_email: body.customerEmail,
          metadata: metadataWithUser,
          client_reference_id: clientReferenceId,
          success_url: getCheckoutUrls().successUrl,
          cancel_url: getCheckoutUrls().cancelUrl,
          locale: 'auto',
        })
      }
    } catch (stripeError: any) {
      console.error('❌ Stripe session creation failed:', {
        message: stripeError?.message || String(stripeError),
        code: stripeError?.code,
        planId: actualPlanId,
        environment: stripeConfig.environment,
        timestamp: new Date().toISOString(),
        raw: stripeError
      })
      
    const isProd = process.env.NODE_ENV === 'production';

      return NextResponse.json({ error: publicMessage }, { status: 500 })
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
