/**
 * Supabase Authentication Test Page
 * Test the new Supabase auth system before migration
 */

'use client';

import { useState } from 'react';
import { useAuthSupabase } from '@/hooks/use-auth-supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function TestSupabasePage() {
  const { user, loading, error, signUp, signIn, signOut, isAuthenticated } = useAuthSupabase();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setMessage('Please enter email and password');
      return;
    }

    setActionLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const result = await signUp({ email, password, fullName });
        if (result.needsEmailConfirmation) {
          setMessage('Please check your email to confirm your account');
        } else {
          setMessage('Account created successfully!');
        }
      } else {
        await signIn({ email, password });
        setMessage('Signed in successfully!');
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    try {
      await signOut();
      setMessage('Signed out successfully!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Supabase auth...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Supabase Auth Test</h1>
          <p className="text-gray-600 mt-2">Testing the new authentication system</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>You are successfully authenticated with Supabase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p><strong>User ID:</strong> {user?.userId}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Full Name:</strong> {user?.fullName || 'Not set'}</p>
                <p><strong>Created:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
              
              <Button 
                onClick={handleSignOut} 
                disabled={actionLoading}
                className="w-full"
                variant="outline"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
              <CardDescription>
                {isSignUp ? 'Create a new account with Supabase' : 'Sign in to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                {isSignUp && (
                  <Input
                    type="text"
                    placeholder="Full Name (optional)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                )}
              </div>

              <Button 
                onClick={handleAuth} 
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>

              <Button 
                onClick={() => setIsSignUp(!isSignUp)}
                variant="ghost"
                className="w-full"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Back to App
          </Button>
        </div>
      </div>
    </div>
  );
}
