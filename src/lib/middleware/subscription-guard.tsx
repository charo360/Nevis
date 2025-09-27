'use client';

import React from 'react';
import { useSubscriptionAccess } from '@/hooks/use-subscription-access';

/**
 * Client-side Subscription Guard Components
 * Protects React components with subscription-based access control
 */

/**
 * React Component HOC - Protects React components
 */
export function withSubscriptionAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ProtectedComponent = (props: P) => {
    const accessStatus = useSubscriptionAccess(feature);

    if (accessStatus.loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Checking access...</span>
        </div>
      );
    }

    if (!accessStatus.hasAccess) {
      return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Subscription Required
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {accessStatus.reason}
            </p>
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                Credits remaining: {accessStatus.creditsRemaining}
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  ProtectedComponent.displayName = `withSubscriptionAccess(${displayName})`;
  return ProtectedComponent;
}

/**
 * Subscription Status Component
 */
export function SubscriptionStatus({ feature }: { feature: string }) {
  const accessStatus = useSubscriptionAccess(feature);

  if (accessStatus.loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Checking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`h-2 w-2 rounded-full ${accessStatus.hasAccess ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
      <span className={accessStatus.hasAccess ? 'text-green-700' : 'text-red-700'}>
        {accessStatus.hasAccess ? 'Access granted' : 'Subscription required'}
      </span>
      <span className="text-gray-500">
        ({accessStatus.creditsRemaining} credits)
      </span>
    </div>
  );
}


