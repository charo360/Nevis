import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

/**
 * Server-side Subscription Guard Middleware
 * Protects API routes with subscription-based access control
 */

export interface SubscriptionGuardOptions {
  feature: string;
  requireCredits?: number;
  gracefulDegradation?: boolean;
}

export interface AccessResult {
  hasAccess: boolean;
  reason: string;
  creditsRemaining: number;
  subscriptionStatus: string;
}

/**
 * API Route Middleware - Protects API endpoints
 */
export function withSubscriptionGuard(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SubscriptionGuardOptions
) {
  return async function guardedHandler(req: NextRequest): Promise<NextResponse> {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { 
            error: 'Unauthorized', 
            message: 'Authentication required',
            accessRequired: true 
          }, 
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const user = verifyToken(token);
      
      if (!user) {
        return NextResponse.json(
          { 
            error: 'Invalid token', 
            message: 'Please log in again',
            accessRequired: true 
          }, 
          { status: 401 }
        );
      }

      // Check subscription access
      const subscriptionService = new SubscriptionService();
      const accessResult = await subscriptionService.checkAccess(user.userId, options.feature);

      if (!accessResult.hasAccess) {
        // Graceful degradation - return limited functionality instead of blocking
        if (options.gracefulDegradation) {
          return NextResponse.json({
            success: false,
            message: 'Limited functionality - subscription required for full features',
            accessResult,
            gracefulMode: true
          }, { status: 200 });
        }

        // Block access completely
        return NextResponse.json({
          error: 'Subscription required',
          message: `Access to ${options.feature} requires an active subscription`,
          accessResult,
          upgradeRequired: true
        }, { status: 403 });
      }

      // Log usage if credits are required
      if (options.requireCredits && options.requireCredits > 0) {
        await subscriptionService.logUsage(
          user.userId, 
          options.feature, 
          options.requireCredits
        );
      }

      // Add user and access info to request for handler use
      const requestWithUser = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      
      // Store user info in headers for the handler
      requestWithUser.headers.set('x-user-id', user.userId);
      requestWithUser.headers.set('x-user-email', user.email);
      requestWithUser.headers.set('x-credits-remaining', accessResult.creditsRemaining.toString());

      return await handler(requestWithUser);

    } catch (error) {
      console.error('Subscription guard error:', error);
      
      // Graceful degradation on system errors
      if (options.gracefulDegradation) {
        return NextResponse.json({
          success: false,
          message: 'Service temporarily unavailable - limited functionality enabled',
          gracefulMode: true,
          systemError: true
        }, { status: 200 });
      }

      return NextResponse.json(
        { 
          error: 'Service unavailable', 
          message: 'Please try again later',
          systemError: true 
        }, 
        { status: 503 }
      );
    }
  };
}

/**
 * Usage tracking helper
 */
export async function trackFeatureUsage(userId: string, feature: string, credits: number = 1) {
  try {
    const subscriptionService = new SubscriptionService();
    await subscriptionService.logUsage(userId, feature, credits);
  } catch (error) {
    console.error('Failed to track usage:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}

/**
 * Check access helper for server-side usage
 */
export async function checkSubscriptionAccess(userId: string, feature: string): Promise<AccessResult> {
  try {
    const subscriptionService = new SubscriptionService();
    return await subscriptionService.checkAccess(userId, feature);
  } catch (error) {
    console.error('Failed to check subscription access:', error);
    // Return graceful degradation
    return {
      hasAccess: true, // Allow access during system errors
      reason: 'System temporarily unavailable',
      creditsRemaining: 0,
      subscriptionStatus: 'unknown'
    };
  }
}
