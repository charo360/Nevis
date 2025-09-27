'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-supabase';

export interface SubscriptionAccessStatus {
  loading: boolean;
  hasAccess: boolean;
  reason: string;
  creditsRemaining: number;
  subscriptionStatus: string;
  error?: string;
}

/**
 * Hook to check subscription access for a specific feature
 */
export function useSubscriptionAccess(feature: string): SubscriptionAccessStatus {
  const { user, loading: authLoading } = useAuth();
  const [accessStatus, setAccessStatus] = useState<SubscriptionAccessStatus>({
    loading: true,
    hasAccess: false,
    reason: 'Checking access...',
    creditsRemaining: 0,
    subscriptionStatus: 'unknown'
  });

  useEffect(() => {
    async function checkAccess() {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // No user means no access
      if (!user) {
        setAccessStatus({
          loading: false,
          hasAccess: false,
          reason: 'Please log in to access this feature',
          creditsRemaining: 0,
          subscriptionStatus: 'unauthenticated'
        });
        return;
      }

      try {
        setAccessStatus(prev => ({ ...prev, loading: true }));

        // Call the subscription check API
        const response = await fetch('/api/subscription/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token || 'dummy-token'}`
          },
          body: JSON.stringify({ feature })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        setAccessStatus({
          loading: false,
          hasAccess: result.hasAccess || false,
          reason: result.reason || 'Access check completed',
          creditsRemaining: result.creditsRemaining || 0,
          subscriptionStatus: result.subscriptionStatus || 'unknown'
        });

      } catch (error) {
        console.error('Failed to check subscription access:', error);

        // Graceful degradation - allow access during errors
        setAccessStatus({
          loading: false,
          hasAccess: true, // Allow access when system is down
          reason: 'System temporarily unavailable - access granted',
          creditsRemaining: 0,
          subscriptionStatus: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    checkAccess();
  }, [user, authLoading, feature]);

  return accessStatus;
}

/**
 * Hook to get current user's subscription status
 */
export function useSubscriptionStatus() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState({
    loading: true,
    subscriptionPlan: 'free',
    subscriptionStatus: 'unknown',
    creditsRemaining: 0,
    trialEndsAt: null as Date | null,
    subscriptionExpiresAt: null as Date | null
  });

  useEffect(() => {
    async function fetchStatus() {
      if (authLoading || !user) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${user.access_token || 'dummy-token'}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStatus({
            loading: false,
            subscriptionPlan: data.subscriptionPlan || 'free',
            subscriptionStatus: data.subscriptionStatus || 'inactive',
            creditsRemaining: data.creditsRemaining || 0,
            trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
            subscriptionExpiresAt: data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt) : null
          });
        } else {
          setStatus(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    }

    fetchStatus();
  }, [user, authLoading]);

  return status;
}

/**
 * Hook to track feature usage
 */
export function useTrackUsage() {
  const { user } = useAuth();

  const trackUsage = async (feature: string, credits: number = 1) => {
    if (!user) return;

    try {
      await fetch('/api/subscription/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token || 'dummy-token'}`
        },
        body: JSON.stringify({ feature, credits })
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }
  };

  return { trackUsage };
}
