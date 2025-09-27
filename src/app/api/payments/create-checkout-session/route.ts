import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { getRegionPriceForCountry, resolveCountryFromHeaders } from '@/lib/region-pricing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-07-30.basil' });

// Minimal plan map (amounts in cents) — adjust to match your pricing-data if desired
const PLANS: Record<string, { amountCents: number; credits: number; name: string }> = {
  free: { amountCents: 0, credits: 10, name: 'Free Plan' },
  starter: { amountCents: 1000, credits: 50, name: 'Starter Pack' },
  growth: { amountCents: 2900, credits: 150, name: 'Growth Pack' },
  pro: { amountCents: 4900, credits: 250, name: 'Pro Pack' },
  power: { amountCents: 9900, credits: 550, name: 'Power Users' },
};

export async function POST(req: Request) {
  try {
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

    const planId = String(body?.planId || 'starter').toLowerCase();
    const plan = PLANS[planId];
    if (!isRegional45 && !plan) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

    // For free plan, don't create Stripe session — create pending succeeded payment and return a simple response
    if (planId === 'free') {
      const doc = {
        userId: decoded.userId,
        planId,
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
            plan_id: planId,
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

    const successUrl = body?.successUrl || `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body?.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/cancel`;

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

    // create stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name, metadata: { planId: isRegional45 ? 'regional_45' : planId } },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: decoded.userId, planId: isRegional45 ? 'regional_45' : planId, country: regionCountry || '' },
      client_reference_id: decoded.userId,
    });

    // persist pending payment keyed by session id
    try {
      const payload = {
        user_id: decoded.userId,
        stripe_session_id: session.id,
        plan_id: isRegional45 ? 'regional_45' : planId,
        amount: unitAmount / 100,
        currency,
        status: 'pending',
        credits_added: 0, // Will be updated on successful payment
        payment_method: 'stripe_checkout',
        metadata: {
          session_id: session.id,
          country: regionCountry || null,
          credits_to_add: credits
        }
      };

      // Save to Supabase payment_transactions table
      await supabase
        .from('payment_transactions')
        .insert(payload);

      console.log('Payment session created:', payload);
    } catch (e) {
      console.error('Failed to record payment session:', e);
      // continue — do not leak internal error to end user unnecessarily
    }

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    // Only logged in users that present a valid ID token receive the Checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
