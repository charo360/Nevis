/**
 * Subscription Access Check API
 * Provides frontend components with subscription status information
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'Authentication required',
        subscriptionStatus: 'unauthenticated',
        creditsRemaining: 0
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'Invalid authentication token',
        subscriptionStatus: 'invalid_token',
        creditsRemaining: 0
      }, { status: 401 });
    }

    // Get feature from request body
    const { feature } = await request.json();
    if (!feature) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'Feature parameter required',
        subscriptionStatus: 'invalid_request',
        creditsRemaining: 0
      }, { status: 400 });
    }

    // Check subscription access
    const accessStatus = await SubscriptionService.checkAccess(decoded.userId, feature);
    
    return NextResponse.json({
      hasAccess: accessStatus.hasAccess,
      reason: accessStatus.reason,
      subscriptionStatus: accessStatus.subscriptionStatus,
      creditsRemaining: accessStatus.creditsRemaining,
      userId: decoded.userId
    });

  } catch (error) {
    console.error('❌ Subscription check error:', error);
    return NextResponse.json({
      hasAccess: false,
      reason: 'System error during access check',
      subscriptionStatus: 'system_error',
      creditsRemaining: 0
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Subscription Access Check API',
    description: 'Use POST method to check feature access',
    requiredHeaders: ['Authorization: Bearer <token>'],
    requiredBody: ['feature'],
    supportedFeatures: [
      'revo-1.0',
      'revo-1.5', 
      'revo-2.0',
      'brand-profile',
      'content-calendar',
      'artifacts'
    ]
  });
}
