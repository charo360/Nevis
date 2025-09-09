'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/config';

export default function TestSupabaseConnection() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    
    const tests = [
      {
        name: 'Basic Connection',
        test: async () => {
          const { data, error } = await supabase.from('users').select('count').limit(1);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'Auth Status',
        test: async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          return { success: !error, data: { hasSession: !!session }, error: error?.message };
        }
      },
      {
        name: 'Database Tables',
        test: async () => {
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
          return { success: !error, data, error: error?.message };
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2 text-sm">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>

        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? 'Testing...' : 'Run Connection Tests'}
        </button>

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
      </div>
    </div>
  );
}
