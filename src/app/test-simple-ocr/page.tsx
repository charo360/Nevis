'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Scan } from 'lucide-react';

export default function TestSimpleOCRPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const testSimpleOCR = async () => {
    setIsLoading(true);
    setResult('');
    setError('');

    try {
      console.log('🔍 Starting simple OCR test...');

      // Test image with clear text
      const imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // Import and test Tesseract v6
      const { createWorker } = await import('tesseract.js');
      console.log('✅ Tesseract imported successfully');

      // Create worker with language - v6 simplified API
      const worker = await createWorker('eng', 1, {
        logger: m => console.log('OCR:', m)
      });

      const { data } = await worker.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png');

      console.log('OCR Result:', data);
      setResult(JSON.stringify(data, null, 2));

      await worker.terminate();

      toast({
        title: 'OCR Test Successful',
        description: 'Tesseract.js is working correctly',
      });

    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'Unknown error');
      toast({
        variant: 'destructive',
        title: 'OCR Test Failed',
        description: err.message || 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Simple OCR Test</h1>
        <p className="text-muted-foreground">
          Basic Tesseract.js functionality test
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OCR Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testSimpleOCR}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing OCR...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Test Simple OCR
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Error:</h4>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Success:</h4>
              <pre className="text-sm text-green-700 whitespace-pre-wrap max-h-96 overflow-y-auto">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
