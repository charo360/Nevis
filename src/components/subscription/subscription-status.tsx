/**
 * Subscription Status Component
 * Shows user's current subscription status and provides upgrade options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-supabase';

interface SubscriptionStatusProps {
  feature?: string;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

interface SubscriptionInfo {
  hasAccess: boolean;
  reason: string;
  subscriptionStatus: string;
  creditsRemaining: number;
  loading: boolean;
}

export function SubscriptionStatus({ 
  feature = 'general', 
  showUpgradeButton = true,
  compact = false 
}: SubscriptionStatusProps) {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    hasAccess: false,
    reason: 'Loading...',
    subscriptionStatus: 'loading',
    creditsRemaining: 0,
    loading: true
  });

  useEffect(() => {
    async function checkSubscriptionStatus() {
      if (!user) {
        setSubscriptionInfo({
          hasAccess: false,
          reason: 'Please sign in to continue',
          subscriptionStatus: 'unauthenticated',
          creditsRemaining: 0,
          loading: false
        });
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No auth token found');
        }

        const response = await fetch('/api/subscription/check-access', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ feature })
        });

        const data = await response.json();
        
        setSubscriptionInfo({
          hasAccess: data.hasAccess,
          reason: data.reason,
          subscriptionStatus: data.subscriptionStatus,
          creditsRemaining: data.creditsRemaining,
          loading: false
        });

      } catch (error) {
        console.error('❌ Failed to check subscription status:', error);
        setSubscriptionInfo({
          hasAccess: false,
          reason: 'Error checking subscription status',
          subscriptionStatus: 'error',
          creditsRemaining: 0,
          loading: false
        });
      }
    }

    checkSubscriptionStatus();
  }, [user, feature]);

  if (subscriptionInfo.loading) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Checking subscription...</span>
      </div>
    );
  }

  // Success state - user has access
  if (subscriptionInfo.hasAccess) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Active ({subscriptionInfo.creditsRemaining} credits)</span>
        </div>
      );
    }

    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-green-800">Subscription Active</h4>
            <p className="text-sm text-green-600">
              {subscriptionInfo.creditsRemaining} credits remaining
            </p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Error states and subscription required
  const getStatusColor = () => {
    switch (subscriptionInfo.subscriptionStatus) {
      case 'trial_expired':
        return 'yellow';
      case 'inactive':
      case 'subscription_required':
        return 'red';
      default:
        return 'gray';
    }
  };

  const color = getStatusColor();
  const bgColor = `bg-${color}-50`;
  const borderColor = `border-${color}-200`;
  const textColor = `text-${color}-800`;
  const subtextColor = `text-${color}-600`;

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${subtextColor}`}>
        <div className={`w-2 h-2 bg-${color}-500 rounded-full`}></div>
        <span>
          {subscriptionInfo.subscriptionStatus === 'trial_expired' ? 'Trial Expired' : 'Upgrade Required'}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 ${bgColor} border ${borderColor} rounded-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className={`font-medium ${textColor}`}>
            {subscriptionInfo.subscriptionStatus === 'trial_expired' 
              ? 'Trial Period Ended' 
              : 'Subscription Required'}
          </h4>
          <p className={`text-sm ${subtextColor} mt-1`}>
            {subscriptionInfo.reason}
          </p>
          {subscriptionInfo.creditsRemaining > 0 && (
            <p className={`text-xs ${subtextColor} mt-1`}>
              {subscriptionInfo.creditsRemaining} credits remaining
            </p>
          )}
        </div>
        <div className={`w-3 h-3 bg-${color}-500 rounded-full mt-1`}></div>
      </div>
      
      {showUpgradeButton && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => window.location.href = '/pricing'}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
          <button
            onClick={() => window.location.href = '/pricing'}
            className={`px-4 py-2 border border-${color}-300 ${subtextColor} text-sm rounded-md hover:bg-${color}-100 transition-colors`}
          >
            View Plans
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Subscription Guard Component
 * Wraps content that requires subscription access
 */
interface SubscriptionGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showStatus?: boolean;
}

export function SubscriptionGuard({ 
  feature, 
  children, 
  fallback,
  showStatus = true 
}: SubscriptionGuardProps) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setHasAccess(false);
          return;
        }

        const response = await fetch('/api/subscription/check-access', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ feature })
        });

        const data = await response.json();
        setHasAccess(data.hasAccess);

      } catch (error) {
        console.error('❌ Access check failed:', error);
        setHasAccess(false);
      }
    }

    checkAccess();
  }, [user, feature]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking access...</span>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-6 text-center">
        {showStatus && <SubscriptionStatus feature={feature} />}
      </div>
    );
  }

  return <>{children}</>;
}
