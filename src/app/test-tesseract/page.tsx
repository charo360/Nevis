'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Scan } from 'lucide-react';

export default function TestTesseractPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Simple test image with clear text
  const testImageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop';

  const testTesseract = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🔍 Testing Tesseract.js installation...');
      
      // Import Tesseract.js
      const { createWorker } = await import('tesseract.js');
      console.log('✅ Tesseract.js imported successfully');

      // Create worker
      const worker = await createWorker('eng', 1, {
        logger: m => {
          console.log('Tesseract Logger:', m);
          if (m.status === 'recognizing text') {
            console.log(`Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      console.log('✅ Tesseract worker created');

      // Recognize text
      console.log('🔍 Starting text recognition...');
      const { data } = await worker.recognize(testImageUrl);
      console.log('✅ Text recognition complete');
      console.log('📝 Full OCR Response:', data);

      // Terminate worker
      await worker.terminate();
      console.log('✅ Worker terminated');

      setResult(data);
      toast({
        title: 'Tesseract.js Test Successful',
        description: `Detected text with ${Math.round(data.confidence)}% confidence`,
      });

    } catch (err: any) {
      console.error('❌ Tesseract.js test failed:', err);
      setError(err.message || 'Unknown error occurred');
      toast({
        variant: 'destructive',
        title: 'Tesseract.js Test Failed',
        description: err.message || 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Tesseract.js Installation Test</h1>
        <p className="text-muted-foreground">
          Test if Tesseract.js is properly installed and working
        </p>
      </div>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Tesseract.js Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <img
              src={testImageUrl}
              alt="Test Image"
              className="mx-auto max-w-full h-auto border rounded-lg mb-4"
              style={{ maxHeight: '300px' }}
            />
            <p className="text-sm text-muted-foreground mb-4">
              Test image for OCR analysis
            </p>
            <Button
              onClick={testTesseract}
              disabled={isLoading}
              className="w-full max-w-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Tesseract.js...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  Test Tesseract.js OCR
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-mono text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>OCR Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-lg font-semibold">{Math.round(result.confidence)}%</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Words Found</div>
                <div className="text-lg font-semibold">{result.words?.length || 0}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Lines Found</div>
                <div className="text-lg font-semibold">{result.lines?.length || 0}</div>
              </div>
            </div>

            {/* Detected Text */}
            <div>
              <h4 className="font-semibold mb-2">Detected Text:</h4>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{result.text || 'No text detected'}</pre>
              </div>
            </div>

            {/* Words Array */}
            {result.words && result.words.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Individual Words ({result.words.length}):</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {result.words.map((word: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono">{word.text}</span>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(word.confidence)}% | 
                        ({word.bbox?.x0}, {word.bbox?.y0}) 
                        {word.bbox?.x1 - word.bbox?.x0}×{word.bbox?.y1 - word.bbox?.y0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data */}
            <details className="border rounded-lg">
              <summary className="p-3 cursor-pointer font-semibold">Raw OCR Data (Click to expand)</summary>
              <div className="p-3 border-t">
                <pre className="text-xs overflow-x-auto bg-muted p-3 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Installation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Package:</strong> tesseract.js</p>
          <p><strong>Purpose:</strong> Client-side OCR (Optical Character Recognition)</p>
          <p><strong>Engine:</strong> Tesseract OCR engine compiled to WebAssembly</p>
          <p><strong>Languages:</strong> English (eng) - can be extended to support 100+ languages</p>
          <p><strong>Processing:</strong> Runs entirely in the browser, no server required</p>
        </CardContent>
      </Card>
    </div>
  );
}
