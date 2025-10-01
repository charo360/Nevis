import { NextResponse } from 'next/server';
import { PRICING_PLANS } from '@/lib/secure-pricing';

/**
 * GET /api/pricing/plans
 * Returns secure pricing plans without exposing Stripe price IDs
 */
export async function GET() {
  try {
    // Return only the frontend-safe pricing data
    return NextResponse.json({
      plans: PRICING_PLANS,
      success: true
    });
  } catch (error) {
    console.error('❌ Error fetching pricing plans:', error);
    return NextResponse.json(
      { error: 'Unable to fetch pricing plans' },
      { status: 500 }
    );
  }
}