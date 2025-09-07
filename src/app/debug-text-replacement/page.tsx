'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube } from 'lucide-react';

export default function DebugTextReplacementPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCanvasTextReplacement = async () => {
    setIsProcessing(true);
    setDebugLog([]);
    setOriginalImage('');
    setProcessedImage('');

    try {
      addLog('🔍 Starting canvas text replacement test...');

      // Use a simple test image
      const testImageUrl = 'https://tesseract.projectnaptha.com/img/eng_bw.png';
      setOriginalImage(testImageUrl);
      addLog(`📷 Using test image: ${testImageUrl}`);

      // Create canvas and load image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      addLog('✅ Canvas context created');

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const imageLoaded = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          addLog(`✅ Image loaded: ${img.width}x${img.height}`);
          resolve();
        };
        img.onerror = (error) => {
          addLog(`❌ Image load failed: ${error}`);
          reject(new Error('Failed to load image'));
        };
        img.src = testImageUrl;
      });

      await imageLoaded;

      // Set canvas size and draw image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      addLog(`✅ Image drawn to canvas: ${canvas.width}x${canvas.height}`);

      // Test text replacement in a known area
      const testRegion = {
        x: 50,
        y: 50,
        width: 200,
        height: 30
      };

      addLog(`🎨 Testing text replacement in region: (${testRegion.x}, ${testRegion.y}) ${testRegion.width}x${testRegion.height}`);

      // Step 1: Paint over area with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(testRegion.x, testRegion.y, testRegion.width, testRegion.height);
      addLog('✅ Painted white rectangle over test region');

      // Step 2: Add new text
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('REPLACED TEXT!', testRegion.x + 5, testRegion.y + 5);
      addLog('✅ Added replacement text');

      // Step 3: Convert to blob and create URL
      const blobPromise = new Promise<string>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            addLog(`✅ Canvas converted to blob: ${blob.size} bytes`);
            addLog(`✅ Blob URL created: ${url.substring(0, 50)}...`);
            resolve(url);
          } else {
            addLog('❌ Failed to create blob from canvas');
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 1.0);
      });

      const processedUrl = await blobPromise;
      setProcessedImage(processedUrl);
      addLog('🎉 Text replacement test completed successfully!');

      toast({
        title: 'Canvas Test Successful',
        description: 'Text replacement worked! Check the before/after images.',
      });

    } catch (error: any) {
      addLog(`❌ Test failed: ${error.message}`);
      toast({
        variant: 'destructive',
        title: 'Canvas Test Failed',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Debug Text Replacement</h1>
        <p className="text-muted-foreground">
          Test canvas-based text replacement with detailed logging
        </p>
      </div>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Canvas Text Replacement Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testCanvasTextReplacement}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Running Canvas Test...
              </>
            ) : (
              <>
                <TestTube className="w-5 h-5 mr-2" />
                Test Canvas Text Replacement
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Debug Log */}
      {debugLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
              {debugLog.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Before/After Images */}
      {originalImage && processedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Before & After Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-center">Before (Original)</h4>
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-auto border rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-center">After (Canvas Modified)</h4>
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-auto border rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Information */}
      <Card>
        <CardHeader>
          <CardTitle>What This Test Does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Purpose:</strong> Test if canvas-based text replacement is working</p>
          <p><strong>Process:</strong></p>
          <ol className="list-decimal list-inside ml-4 space-y-1">
            <li>Load a test image with text</li>
            <li>Draw the image to a canvas</li>
            <li>Paint a white rectangle over a test region</li>
            <li>Add new text "REPLACED TEXT!" in that region</li>
            <li>Convert canvas to blob and create URL</li>
            <li>Display before/after comparison</li>
          </ol>
          <p><strong>Expected Result:</strong> The processed image should show "REPLACED TEXT!" in the test region</p>
          <p><strong>If this works:</strong> The canvas processing is functional</p>
          <p><strong>If this fails:</strong> There's an issue with canvas operations or blob creation</p>
        </CardContent>
      </Card>
    </div>
  );
}
