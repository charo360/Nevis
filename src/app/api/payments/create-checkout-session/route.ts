import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { getRegionPriceForCountry, resolveCountryFromHeaders } from '@/lib/region-pricing';
import { planIdToStripePrice } from '@/lib/secure-pricing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

// Minimal plan map (amounts in cents) — adjust to match your pricing-data if desired
const PLANS: Record<string, { amountCents: number; credits: number; name: string }> = {
  free: { amountCents: 0, credits: 10, name: 'Free Plan' },
  starter: { amountCents: 999, credits: 40, name: 'Starter Pack' },
  growth: { amountCents: 2499, credits: 100, name: 'Growth Pack' },
  pro: { amountCents: 5999, credits: 250, name: 'Pro Pack' },
  enterprise: { amountCents: 19999, credits: 1000, name: 'Enterprise Pack' },
};

export async function POST(req: Request) {
  try {
    // Infer origin early so Stripe redirect URLs are correct for the environment
    const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const protoHeader = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol') || req.headers.get('referer')?.split(':')[0] || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const inferredOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : null;
    const preferredProd = process.env.NEXT_PUBLIC_APP_URL || (inferredOrigin && /crevo\.app$/.test(inferredOrigin) ? inferredOrigin : 'https://www.crevo.app');
  const getAppOriginPayments = () => inferredOrigin || preferredProd || (process.env.NODE_ENV === 'production' ? 'https://www.crevo.app' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
  const origin = getAppOriginPayments();
    // enforce id token (user must be logged in)
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - missing token' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const decoded = verifyToken(idToken);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });

  const body = await req.json();

    // New regional one-time product: 45 generations, price by region
    const isRegional45 = String(body?.product || '').toLowerCase() === 'regional_45';

    const rawPlanId = String(body?.planId || 'starter').toLowerCase();
    // Accept both 'try-free' (frontend) and 'free' (server canonical) as the free plan
    const planIdForLookup = rawPlanId === 'try-free' ? 'free' : rawPlanId;
    const plan = PLANS[planIdForLookup];
    if (!isRegional45 && !plan) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

    // For free plan, don't create Stripe session — create pending succeeded payment and return a simple response
  if (planIdForLookup === 'free') {
      const doc = {
        userId: decoded.userId,
        planId: planIdForLookup,
        amount: 0,
        currency: 'usd',
        creditsAdded: plan.credits,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        metadata: { source: 'free-plan' },
      } as any;

  try {
        // Save to Supabase payment_transactions table
        await supabase
          .from('payment_transactions')
          .insert({
            user_id: decoded.userId,
            plan_id: planIdForLookup,
            amount: 0,
            status: 'completed',
            credits_added: plan.credits,
            payment_method: 'free_plan',
            metadata: { source: 'free-plan' }
          });
        console.log('Free plan payment recorded:', doc);
      } catch (e) {
        console.error('Failed to record free plan payment:', e);
      }

      return NextResponse.json({ ok: true, message: 'Free credits granted' });
    }

  const successUrl = body?.successUrl || `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body?.cancelUrl || `${origin}/billing/cancel`;

    // Determine price data
    let currency = 'usd';
    let unitAmount = 0;
    let name = '';
    let credits = 0;
    let regionCountry: string | undefined;

    if (isRegional45) {
      regionCountry = resolveCountryFromHeaders(req.headers) || String(body?.countryCode || '').toUpperCase() || undefined;
      const regional = getRegionPriceForCountry(regionCountry);
      currency = regional.currency;
      unitAmount = regional.amountCents;
      credits = 45;
      name = `45 Generations`;
    } else {
      currency = 'usd';
      unitAmount = plan.amountCents;
      credits = plan.credits;
      name = `${plan.name} (${plan.credits} credits)`;
    }

    // Prefer using configured Stripe Price IDs (server-side mapping). If missing, fall back to inline price_data.
    let session;
    try {
  // For Stripe price mapping, use the original plan key from the frontend when possible
  // (e.g. 'try-free' maps to a specific Stripe price id in secure-pricing). For non-free plans
  // we use the rawPlanId; for fallback where rawPlanId was 'try-free', it's fine because we
  // won't create a Stripe session for free plans above.
  const mappingPlanId = rawPlanId;
  const mappedPriceId = isRegional45 ? null : planIdToStripePrice(mappingPlanId);
      if (mappedPriceId) {
        // Try to retrieve the price to ensure it exists in this Stripe account
        try {
          await stripe.prices.retrieve(mappedPriceId);
          // Use the stored price id
          session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [ { price: mappedPriceId, quantity: 1 } ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { userId: decoded.userId, planId: isRegional45 ? 'regional_45' : rawPlanId, country: regionCountry || '' },
            client_reference_id: decoded.userId,
          });
        } catch (priceErr: any) {
          console.warn('Configured Stripe price ID not available or retrieval failed, falling back to price_data', { mappedPriceId, err: priceErr?.message || priceErr });
        }
      }

      if (!session) {
        // Fallback to inline price_data (creates temporary Price for the Checkout Session)
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency,
                product_data: { name, metadata: { planId: isRegional45 ? 'regional_45' : rawPlanId } },
                unit_amount: unitAmount,
              },
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { userId: decoded.userId, planId: isRegional45 ? 'regional_45' : rawPlanId, country: regionCountry || '' },
          client_reference_id: decoded.userId,
        });
      }
    } catch (err: any) {
      console.error('Failed to create Stripe checkout session (both mapped price and fallback):', err);
      return NextResponse.json({ error: 'Unable to create checkout session. Please try again or contact support.' }, { status: 500 });
    }

    // Note: Payment record will be created by webhook when payment completes
    // This prevents duplicate records and race conditions
    console.log('Checkout session created:', {
      session_id: session.id,
      user_id: decoded.userId,
      plan_id: isRegional45 ? 'regional_45' : planIdForLookup,
      amount: unitAmount / 100,
      credits_to_add: credits
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    // Only logged in users that present a valid ID token receive the Checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
