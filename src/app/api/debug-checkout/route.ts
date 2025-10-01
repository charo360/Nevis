import { NextRequest, NextResponse } from 'next/server';
import { getPlanById, planIdToStripePrice } from '@/lib/secure-pricing';

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
        'price_1SCjDVCXEBwbxwozB5a6oXUp': 'try-free',
        'price_1SDUAiCXEBwbxwozr788ke9X': 'starter',
        'price_1SCjJlCXEBwbxwozhKzAtCH1': 'growth',
        'price_1SCjMpCXEBwbxwozhT1RWAYP': 'pro',
        'price_1SCjPgCXEBwbxwozjCNWanOY': 'enterprise',
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

    return NextResponse.json({
      success: true,
      debug: {
        originalPlanId: planId,
        actualPlanId,
        planDetails,
        stripePriceId,
        message: 'All validations passed - would create Stripe session'
      }
    });

  } catch (error: any) {
    console.error('🧪 DEBUG ERROR:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}