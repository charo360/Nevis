"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth-supabase';

export default function CreditTestPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCreditsAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/credits?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Credit System Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="text-green-600">
              ✅ Signed in as: {user.email}
              <br />
              User ID: {user.userId}
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Not signed in. <a href="/auth" className="underline">Go to Sign In</a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credits API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testCreditsAPI} 
            disabled={loading || !user}
          >
            {loading ? 'Testing...' : 'Test Credits API'}
          </Button>
          
          {result && (
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>New users should automatically get 10 free credits ("Try Agent Free")</li>
            <li>Credits should show on the /credits page</li>
            <li>Users cannot generate content without sufficient credits</li>
            <li>Each AI model has different costs: Revo 1.0 (2), Revo 1.5 (3), Revo 2.0 (4)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}