'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/config';

export default function DebugSupabase() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    
    const tests = [
      {
        name: 'Environment Variables',
        test: async () => {
          return {
            success: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            data: {
              url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
              key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
            }
          };
        }
      },
      {
        name: 'Supabase Connection',
        test: async () => {
          const { data, error } = await supabase.from('users').select('count').limit(1);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'Database Tables Check',
        test: async () => {
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'Auth Status',
        test: async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          return { success: !error, data: { hasSession: !!session }, error: error?.message };
        }
      }
    ];

    const testResults = [];
    for (const test of tests) {
      try {
        console.log(`🧪 Running test: ${test.name}`);
        const result = await test.test();
        testResults.push({
          name: test.name,
          ...result
        });
        console.log(`✅ ${test.name}:`, result);
      } catch (error) {
        testResults.push({
          name: test.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ ${test.name}:`, error);
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  const testBrandCreation = async () => {
    setLoading(true);
    try {
      const testProfile = {
        businessName: 'Test Brand',
        businessType: 'Technology',
        description: 'A test brand for debugging',
        location: 'Test City',
        targetAudience: 'Developers',
        brandVoice: 'Professional',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF'
      };

      const response = await fetch('/api/brand-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This will fail auth but show the error
        },
        body: JSON.stringify(testProfile)
      });

      const result = await response.text();
      setResults([{
        name: 'Brand Creation Test',
        success: response.ok,
        data: { status: response.status, response: result },
        error: response.ok ? null : `HTTP ${response.status}: ${result}`
      }]);
    } catch (error) {
      setResults([{
        name: 'Brand Creation Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Debug Page</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-4"
          >
            {loading ? 'Running...' : 'Run Diagnostics'}
          </button>
          
          <button
            onClick={testBrandCreation}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Brand Creation'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  <h3 className="font-semibold">{result.name}</h3>
                </div>
                
                {result.error && (
                  <p className="text-red-600 text-sm mb-2">Error: {result.error}</p>
                )}
                
                {result.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>If environment variables are missing, check your .env.local file</li>
            <li>If connection fails, verify your Supabase URL and API key</li>
            <li>If tables don't exist, run the schema setup in Supabase dashboard</li>
            <li>If auth fails, check your Supabase authentication settings</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
