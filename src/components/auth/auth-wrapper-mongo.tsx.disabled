// MongoDB-based authentication wrapper (replaces Firebase auth wrapper)
'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthWrapper({ children, requireAuth = false }: AuthWrapperProps) {
  const { user, loading, signInAnonymous } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, show demo mode option
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={signInAnonymous}
              className="w-full"
              size="lg"
            >
              Try Demo Mode
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Demo mode allows you to try all features without creating an account
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children
  return <>{children}</>;
}

// Higher-order component for pages that require authentication
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthWrapper requireAuth={requireAuth}>
        <Component {...props} />
      </AuthWrapper>
    );
  };
}

// Hook for getting auth status in components
export function useAuthStatus() {
  const { user, loading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false,
    isLoading: loading,
    user,
  };
}
