// Supabase-based authentication wrapper (replaces MongoDB auth)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-supabase';
// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
);

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      // Public routes that don't require authentication
      // Treat any route that starts with /billing as public so billing redirects don't force the dashboard.
  const publicRoutes = ['/', '/auth', '/auth/forgot-password'];
  const currentPath = pathname ?? '';
  const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/billing');

      if (!user && !isPublicRoute) {
        console.log('🔒 User not authenticated, redirecting to login');
        router.push('/auth');
      } else if (user && currentPath === '/auth') {
        // Add a small delay to prevent immediate redirect when users want to logout/switch accounts
        const timeoutId = setTimeout(() => {
          console.log('✅ User authenticated, redirecting to brand profile');
          router.push('/brand-profile');
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
      }
    }
  }, [user, loading, pathname, router, mounted]);

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-2">Authenticating...</span>
      </div>
    );
  }

  // Show error if there's an auth error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Public routes - render without auth check
  const publicRoutes = ['/', '/auth', '/auth/forgot-password'];
  const currentPath = pathname ?? '';
  const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/billing');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes - require authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-2">Redirecting to login...</span>
      </div>
    );
  }

  return <>{children}</>;
}

// Export user context for components that need user data
export function useAuthUser() {
  const { user } = useAuth();
  return user;
}
