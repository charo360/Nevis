import { NextRequest, NextResponse } from 'next/server';
import { getPlanById, planIdToStripePrice } from '@/lib/secure-pricing';
import { getStripeConfig } from '@/lib/stripe-config';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('🧪 DEBUG: Received checkout request:', {
      body,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    });

    // Test plan ID resolution
    const planId = body.planId || body.priceId;
    console.log('🧪 DEBUG: Plan ID resolution:', { planId, bodyPlanId: body.planId, bodyPriceId: body.priceId });

    if (!planId) {
      return NextResponse.json({ 
        error: 'Missing planId or priceId',
        debug: { received: body }
      }, { status: 400 });
    }

    // Test plan lookup
    let actualPlanId = planId;
    if (planId.startsWith('price_')) {
      const legacyMapping: Record<string, string> = {
        'price_1SDqaWELJu3kIHjxZQBntjuO': 'try-free',
  'price_1SDqfQELJu3kIHjxzHWPNMPs': 'starter',
        'price_1SDqiKELJu3kIHjx0LWHBgfV': 'growth',
        'price_1SDqloELJu3kIHjxU187qSj1': 'pro',
        'price_1SDqp4ELJu3kIHjx7oLcQwzh': 'enterprise',
        // Test price IDs
        'price_1QOmb6CXEBwbxwozSgD8cGay': 'try-free',
        'price_1QOmbYCXEBwbxwozp29zWxFb': 'starter',
        'price_1QOmc2CXEBwbxwozVGm9iUy5': 'growth',
        'price_1QOmcQCXEBwbxwozAEfhfgME': 'pro',
        'price_1QOmclCXEBwbxwozO9Z1tBbt': 'enterprise'
      };
      actualPlanId = legacyMapping[planId] || 'starter';
      console.log('🧪 DEBUG: Legacy mapping:', { original: planId, mapped: actualPlanId });
    }

    const planDetails = getPlanById(actualPlanId);
    console.log('🧪 DEBUG: Plan details:', { actualPlanId, planDetails });

    if (!planDetails) {
      return NextResponse.json({ 
        error: 'Invalid plan ID',
        debug: { actualPlanId, available: ['try-free', 'starter', 'growth', 'pro', 'enterprise'] }
      }, { status: 400 });
    }

    const stripePriceId = planIdToStripePrice(actualPlanId);
    console.log('🧪 DEBUG: Stripe price mapping:', { actualPlanId, stripePriceId });

    if (!stripePriceId) {
      return NextResponse.json({ 
        error: 'No Stripe price ID found',
        debug: { actualPlanId }
      }, { status: 500 });
    }

    // Attempt to retrieve the Stripe Price object using server Stripe keys
    try {
      const stripeConfig = getStripeConfig();
      const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2025-08-27.basil' });

      let priceObj = null;
      try {
        priceObj = await stripe.prices.retrieve(stripePriceId as string);
      } catch (stripeErr: any) {
        console.error('🧪 DEBUG: Stripe price retrieval failed:', { message: stripeErr?.message, code: stripeErr?.code, stripePriceId });
        return NextResponse.json({
          success: false,
          debug: {
            originalPlanId: planId,
            actualPlanId,
            planDetails,
            stripePriceId,
            stripeError: { message: stripeErr?.message, code: stripeErr?.code }
          }
        }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        debug: {
          originalPlanId: planId,
          actualPlanId,
          planDetails,
          stripePriceId,
          priceObject: priceObj,
          message: 'All validations passed - Stripe price retrieved successfully'
        }
      });
    } catch (err: any) {
      console.error('🧪 DEBUG ERROR (stripe init):', err);
      return NextResponse.json({ error: 'Debug stripe init failed', debug: { message: err?.message } }, { status: 500 });
    }

  } catch (error: any) {
    console.error('🧪 DEBUG ERROR:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}