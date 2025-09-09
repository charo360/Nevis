'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WebsiteDebugPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testWebsite = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-website-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testAnalyzeBrand = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const { analyzeBrandAction } = await import('@/app/actions');
      const result = await analyzeBrandAction(url.trim(), []);
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Website Analysis Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter website URL (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testWebsite} 
              disabled={loading || !url.trim()}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Basic Fetch'}
            </Button>
            
            <Button 
              onClick={testAnalyzeBrand} 
              disabled={loading || !url.trim()}
            >
              {loading ? 'Testing...' : 'Test Full Analysis'}
            </Button>
          </div>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✅ Success' : '❌ Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">Test URLs:</h3>
            <div className="space-y-1 text-sm">
              <div>• google.com (should work)</div>
              <div>• httpbin.org (should work)</div>
              <div>• example.com (should work)</div>
              <div>• Your previously working website</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
