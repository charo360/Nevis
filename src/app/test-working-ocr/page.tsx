'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { textDetectionService } from '@/services/text-detection-service';
import { Loader2, Scan, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestWorkingOCRPage() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  // Clear test image with readable text
  const testImageUrl = 'https://tesseract.projectnaptha.com/img/eng_bw.png';

  const testOCRDetection = async () => {
    setIsDetecting(true);
    setDetections([]);
    setError('');

    try {
      console.log('🔍 Testing OCR with clear text image...');
      
      toast({
        title: 'Starting OCR Test',
        description: 'Analyzing test image with Tesseract.js...',
      });

      const results = await textDetectionService.detectText(testImageUrl);
      
      console.log('📝 OCR Test Results:', results);
      setDetections(results);

      if (results.length > 0) {
        toast({
          title: 'OCR Test Successful! ✅',
          description: `Detected ${results.length} text region${results.length === 1 ? '' : 's'} with real OCR.`,
        });
      } else {
        toast({
          title: 'OCR Test - No Text Found',
          description: 'OCR completed but no text regions were detected.',
        });
      }
    } catch (err: any) {
      console.error('OCR Test Error:', err);
      setError(err.message || 'Unknown error occurred');
      toast({
        variant: 'destructive',
        title: 'OCR Test Failed',
        description: err.message || 'Unknown error occurred',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Working OCR Demonstration</h1>
        <p className="text-muted-foreground">
          Test real OCR text detection with a known working image
        </p>
      </div>

      {/* Test Status */}
      <Card className={`border-2 ${error ? 'border-red-200 bg-red-50' : detections.length > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {error ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                OCR Test Failed
              </>
            ) : detections.length > 0 ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                OCR Test Successful
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                OCR Test Ready
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Image */}
          <div className="text-center">
            <img
              src={testImageUrl}
              alt="Test Image with Clear Text"
              className="mx-auto max-w-full h-auto border rounded-lg mb-4"
              style={{ maxHeight: '300px' }}
            />
            <p className="text-sm text-muted-foreground mb-4">
              Official Tesseract.js test image with clear, readable text
            </p>
          </div>

          {/* Test Button */}
          <Button
            onClick={testOCRDetection}
            disabled={isDetecting}
            className="w-full"
            size="lg"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Running OCR Analysis...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5 mr-2" />
                Test Real OCR Detection
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
              <p className="text-sm text-red-600 mt-2">
                Check the browser console for more detailed error information.
              </p>
            </div>
          )}

          {/* Success Results */}
          {detections.length > 0 && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3">
                ✅ OCR Detection Successful! Found {detections.length} text region{detections.length === 1 ? '' : 's'}:
              </h4>
              <div className="space-y-2">
                {detections.map((detection, index) => (
                  <div key={detection.id} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-green-900">"{detection.text}"</div>
                        <div className="text-sm text-green-700">
                          Position: ({detection.x}, {detection.y}) | 
                          Size: {detection.width}×{detection.height}px
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-800">
                        {Math.round(detection.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>OCR System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Current Configuration</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Engine:</strong> Tesseract.js v6.0.1</li>
                <li>• <strong>Language:</strong> English (eng)</li>
                <li>• <strong>Processing:</strong> Client-side WebAssembly</li>
                <li>• <strong>API:</strong> Simplified v6 createWorker</li>
                <li>• <strong>Detection:</strong> Real OCR analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Test Results Expected</h4>
              <ul className="text-sm space-y-1">
                <li>• Multiple text regions detected</li>
                <li>• High confidence scores (80-95%)</li>
                <li>• Accurate bounding box coordinates</li>
                <li>• Clear text content extraction</li>
                <li>• No API errors or crashes</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What This Test Proves</h4>
            <p className="text-sm text-blue-800">
              This test uses the official Tesseract.js example image to verify that:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Tesseract.js v6 is properly installed and configured</li>
              <li>• The OCR API is working without errors</li>
              <li>• Text detection produces accurate results</li>
              <li>• The service integration is functioning correctly</li>
              <li>• Real OCR analysis (not mock data) is being performed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>If the test succeeds:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• OCR system is working correctly</li>
              <li>• You can now use text detection in Creative Studio</li>
              <li>• Try the full text detection editor at <code>/test-text-detection</code></li>
              <li>• Test with your own images containing text</li>
            </ul>
            
            <p className="mt-4"><strong>If the test fails:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Check browser console for detailed error messages</li>
              <li>• Verify Tesseract.js installation: <code>npm list tesseract.js</code></li>
              <li>• Try refreshing the page and running the test again</li>
              <li>• Check network connectivity for downloading OCR models</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
