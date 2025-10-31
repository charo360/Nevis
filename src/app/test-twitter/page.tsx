'use client';

import { useState } from 'react';

export default function TestTwitterPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTwitterConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-twitter');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.details || data.error || 'Test failed');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Twitter API Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={testTwitterConnection}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Twitter Connection'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">Error:</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-yellow-800 font-medium">Note:</h3>
          <p className="text-yellow-700 mt-1">
            This test will attempt to post a test tweet to your Twitter account. 
            Make sure you have connected your Twitter account and have the necessary permissions.
          </p>
        </div>
      </div>
    </div>
  );
}

