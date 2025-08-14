// Authentication wrapper component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Zap } from 'lucide-react';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { DataMigrationDialog, useMigrationDialog } from '@/components/migration/data-migration-dialog';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthWrapper({ children, requireAuth = false }: AuthWrapperProps) {
  const { user, loading, signInAnonymous } = useFirebaseAuth();
  const { showDialog, setShowDialog } = useMigrationDialog();

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

  // Show auth prompt if user is not signed in and auth is required
  if (!user && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Welcome to Nevis AI</CardTitle>
            <CardDescription>
              Sign in to access your personalized AI content generation platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={signInAnonymous} 
              className="w-full"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Get Started (Demo Mode)
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Demo mode allows you to try all features without creating an account
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children with migration dialog
  return (
    <>
      {children}
      <DataMigrationDialog 
        open={showDialog} 
        onOpenChange={setShowDialog}
        onComplete={() => setShowDialog(false)}
      />
    </>
  );
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
  const { user, loading } = useFirebaseAuth();
  
  return {
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false,
    isLoading: loading,
    user,
  };
}
