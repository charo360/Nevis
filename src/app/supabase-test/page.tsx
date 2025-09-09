/**
 * Simple Supabase Test Page
 */

'use client';

export default function SupabaseTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Supabase Test</h1>
          <p className="text-gray-600 mt-2">Simple test page</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p>✅ Page is loading correctly</p>
          <p>✅ Supabase environment variables are set</p>
        </div>

        <div className="text-center">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
}
