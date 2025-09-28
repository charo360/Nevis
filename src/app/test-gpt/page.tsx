'use client';

import { useState } from 'react';

export default function TestGPTPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('Acme Corp');
  const [industry, setIndustry] = useState('Technology');

  const testGPT = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, industry })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">GPT Content Generation Diagnostic</h1>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Business Name:</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Industry:</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          onClick={testGPT}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test GPT Generation'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Test Results:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && (
            <div className="mt-4 p-4 bg-white rounded">
              <h3 className="font-bold">Generated Content:</h3>
              <p className="mt-2">{result.generatedContent}</p>
              
              {result.containsFallbackWords && (
                <div className="mt-2 p-2 bg-red-100 rounded">
                  <strong>⚠️ Fallback words detected:</strong> {result.fallbackWordsFound.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}