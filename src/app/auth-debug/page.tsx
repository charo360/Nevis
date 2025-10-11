"use client";

import { useAuth } from '@/hooks/use-auth-supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-client';
import { useState } from 'react';

export default function AuthDebugPage() {
  const { user, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [manualCheck, setManualCheck] = useState<any>(null);

  const checkSession = async () => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    setSessionInfo({ session, error });
  };

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    setManualCheck({ user, error });
  };

  const testAPI = async () => {
    try {
      const response = await fetch('/api/debug/auth', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      console.log('API Response:', data);
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Authentication Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>useAuth Hook Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-gray-100 p-4 rounded">
            {JSON.stringify({ user, loading }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Session Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={checkSession} className="mb-4">
            Check Session
          </Button>
          {sessionInfo && (
            <pre className="text-sm bg-gray-100 p-4 rounded">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual User Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={checkUser} className="mb-4">
            Check User
          </Button>
          {manualCheck && (
            <pre className="text-sm bg-gray-100 p-4 rounded">
              {JSON.stringify(manualCheck, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test API</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPI} className="mb-4">
            Test Debug API
          </Button>
          <p className="text-sm text-gray-600">Check console for API response</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={() => window.location.href = '/auth'}
            variant="outline"
          >
            Go to Sign In
          </Button>
          <Button 
            onClick={() => {
              const supabase = createClient();
              supabase.auth.signOut();
            }}
            variant="destructive"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}