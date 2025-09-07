'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { textDetectionService } from '@/services/text-detection-service';
import { Loader2, Scan, Edit, Download, ArrowRight } from 'lucide-react';

export default function TestTextReplacementPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [editedTexts, setEditedTexts] = useState<{ [key: string]: string }>({});
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const { toast } = useToast();

  // Test image with clear text
  const testImageUrl = 'https://tesseract.projectnaptha.com/img/eng_bw.png';

  const handleDetectText = async (url: string) => {
    setImageUrl(url);
    setIsDetecting(true);
    setDetections([]);
    setEditedTexts({});
    setProcessedImageUrl('');

    try {
      toast({
        title: 'Detecting Text',
        description: 'Analyzing image with OCR...',
      });

      const results = await textDetectionService.detectText(url);
      setDetections(results);

      if (results.length > 0) {
        toast({
          title: 'Text Detection Complete',
          description: `Found ${results.length} text region${results.length === 1 ? '' : 's'}.`,
        });
      } else {
        toast({
          title: 'No Text Found',
          description: 'No readable text was detected in this image.',
        });
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast({
        variant: 'destructive',
        title: 'Detection Failed',
        description: 'Failed to detect text in the image.',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTextEdit = (detectionId: string, newText: string) => {
    setEditedTexts(prev => ({
      ...prev,
      [detectionId]: newText
    }));
  };

  const handleApplyTextEdits = async () => {
    if (detections.length === 0) return;

    setIsProcessing(true);
    try {
      toast({
        title: 'Processing Text Edits',
        description: 'Removing original text and applying changes...',
      });

      // Prepare text edits
      const textEdits = detections.map(detection => ({
        region: {
          id: detection.id,
          text: detection.text,
          x: detection.x,
          y: detection.y,
          width: detection.width,
          height: detection.height,
          confidence: detection.confidence,
          fontSize: detection.fontSize,
          fontFamily: detection.fontFamily,
          color: detection.color
        },
        newText: editedTexts[detection.id] || detection.text
      }));

      console.log('🎨 Applying text edits:', textEdits);

      const processedUrl = await textDetectionService.processImageWithTextEdits({
        imageUrl,
        textEdits
      });

      setProcessedImageUrl(processedUrl);

      toast({
        title: 'Text Replacement Complete! ✅',
        description: 'Original text has been removed and replaced with your edits.',
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: 'Failed to apply text edits to the image.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Text Replacement Demonstration</h1>
        <p className="text-muted-foreground">
          See real text detection and replacement in action
        </p>
      </div>

      {/* Test Image Input */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Load Test Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <img
              src={testImageUrl}
              alt="Test Image"
              className="mx-auto max-w-full h-auto border rounded-lg mb-4"
              style={{ maxHeight: '300px' }}
            />
            <Button
              onClick={() => handleDetectText(testImageUrl)}
              disabled={isDetecting}
              className="w-full max-w-md"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detecting Text...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  Detect Text in Image
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Text Editing */}
      {detections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Edit Detected Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detections.map((detection, index) => (
              <div key={detection.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium">Original Text:</Label>
                    <div className="font-mono bg-gray-100 p-2 rounded">
                      "{detection.text}"
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(detection.confidence * 100)}% | 
                      Position: ({detection.x}, {detection.y})
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`edit-${detection.id}`}>New Text:</Label>
                    <Input
                      id={`edit-${detection.id}`}
                      value={editedTexts[detection.id] || detection.text}
                      onChange={(e) => handleTextEdit(detection.id, e.target.value)}
                      placeholder="Enter replacement text..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={handleApplyTextEdits}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Applying Text Edits...
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Apply Text Replacements
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Before/After Comparison */}
      {processedImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Before & After Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="space-y-2">
                <h4 className="font-semibold text-center">Before (Original)</h4>
                <img
                  src={imageUrl}
                  alt="Original Image"
                  className="w-full h-auto border rounded-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => downloadImage(imageUrl, 'original-image.png')}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </Button>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-muted-foreground" />
              </div>

              {/* After */}
              <div className="space-y-2">
                <h4 className="font-semibold text-center">After (Text Replaced)</h4>
                <img
                  src={processedImageUrl}
                  alt="Processed Image"
                  className="w-full h-auto border rounded-lg"
                />
                <Button
                  onClick={() => downloadImage(processedImageUrl, 'text-replaced-image.png')}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Processed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Text Replacement Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Detection Process</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>OCR analyzes image with Tesseract.js</li>
                <li>Identifies text regions with bounding boxes</li>
                <li>Extracts text content and confidence scores</li>
                <li>Provides editing interface for each region</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Replacement Process</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Analyzes surrounding pixels for background color</li>
                <li>Paints over original text with matching background</li>
                <li>Adds new text in same location with proper styling</li>
                <li>Applies blur and smoothing for natural appearance</li>
              </ol>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Real Text Removal:</strong> Original text is actually removed from the image</li>
              <li>• <strong>Background Matching:</strong> Intelligent background color detection</li>
              <li>• <strong>Style Preservation:</strong> Maintains font size, family, and color</li>
              <li>• <strong>Natural Appearance:</strong> Blur and smoothing for seamless integration</li>
              <li>• <strong>High Quality:</strong> Canvas-based processing maintains image resolution</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
