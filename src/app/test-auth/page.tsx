"use client";

import { useAuth } from '@/hooks/use-auth-supabase';
import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const { user, loading } = useAuth();
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('/api/user/credits', {
          method: 'GET',
          credentials: 'include',
        });
        
        const result = {
          status: response.status,
          data: response.ok ? await response.json() : await response.text()
        };
        
        setApiTest(result);
      } catch (error) {
        setApiTest({ error: error.message });
      }
    };

    if (user) {
      testAPI();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Authentication Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">User Status:</h2>
        {user ? (
          <div>
            <p>✅ User authenticated</p>
            <p>User ID: {user.userId}</p>
            <p>Email: {user.email}</p>
          </div>
        ) : (
          <p>❌ No user authenticated</p>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">API Test:</h2>
        {apiTest ? (
          <pre>{JSON.stringify(apiTest, null, 2)}</pre>
        ) : (
          <p>No API test run yet</p>
        )}
      </div>
    </div>
  );
}