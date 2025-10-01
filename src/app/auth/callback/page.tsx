'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        // Get the session from Supabase (this handles the URL hash automatically)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          setStatus('error');
          setMessage(`Authentication failed: ${error.message}`);
          return;
        }

        if (data.session?.user) {
          console.log('✅ OAuth authentication successful:', data.session.user.email);
          setUserEmail(data.session.user.email || '');
          
          // Initialize user if this is their first login
          try {
            const token = data.session.access_token;
            if (token) {
              console.log('🔄 Initializing user account...');
              const response = await fetch('/api/users/initialize', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  Authorization: `Bearer ${token}` 
                },
              });
              
              if (response.ok) {
                console.log('✅ User initialized successfully');
              } else {
                console.warn('⚠️ User initialization failed, but authentication succeeded');
              }
            }
          } catch (initError) {
            console.warn('⚠️ Failed to initialize user:', initError);
            // Don't fail the auth process for initialization errors
          }

          setStatus('success');
          setMessage('Authentication successful! Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          
        } else {
          console.error('❌ No session found after OAuth callback');
          setStatus('error');
          setMessage('No valid session found. Please try signing in again.');
        }
      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 text-center">
          
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            )}
            {status === 'success' && (
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className="text-2xl font-bold mb-4">
            {status === 'loading' && 'Signing you in...'}
            {status === 'success' && 'Welcome to Crevo!'}
            {status === 'error' && 'Authentication Failed'}
          </h1>

          <p className="text-gray-600 mb-6">{message}</p>

          {/* User Email for Success */}
          {status === 'success' && userEmail && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Signed in as: <strong>{userEmail}</strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'success' && (
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth')}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          )}

          {/* Loading state - no buttons needed */}
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <strong>Debug Info:</strong><br />
            Status: {status}<br />
            URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}