import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import adminApp, { adminAuth, adminDb } from '@/lib/firebase/admin';

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
    const decoded = await adminAuth.verifyIdToken(idToken).catch((e) => {
      return null;
    });

    if (!decoded) return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });

    const body = await req.json();
    const planId = String(body?.planId || 'starter').toLowerCase();
    const plan = PLANS[planId];
    if (!plan) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

    // For free plan, don't create Stripe session — create pending succeeded payment and return a simple response
    if (planId === 'free') {
      const doc = {
        userId: decoded.uid,
        planId,
        amount: 0,
        currency: 'usd',
        creditsAdded: plan.credits,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        metadata: { source: 'free-plan' },
      } as any;

      try {
        await adminDb.collection('payments').add(doc);
      } catch (e) {
      }

      return NextResponse.json({ ok: true, message: 'Free credits granted' });
    }

    const successUrl = body?.successUrl || `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body?.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/cancel`;

    // create stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${plan.name} (${plan.credits} credits)`, metadata: { planId } },
            unit_amount: plan.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: decoded.uid, planId },
      client_reference_id: decoded.uid,
    });

    // persist pending payment keyed by session id
    try {
      const payload = {
        userId: decoded.uid,
        planId,
        amount: plan.amountCents / 100,
        currency: 'usd',
        creditsAdded: plan.credits,
        status: 'pending',
        sessionId: session.id,
        createdAt: new Date().toISOString(),
      } as any;

      await adminDb.collection('payments').doc(session.id).set(payload);
    } catch (e) {
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
