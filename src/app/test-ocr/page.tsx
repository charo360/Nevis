'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { textDetectionService } from '@/services/text-detection-service';
import { Scan, Loader2, Eye, EyeOff } from 'lucide-react';

export default function TestOCRPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [showOverlays, setShowOverlays] = useState(true);
  const { toast } = useToast();

  // Sample images with clear text for testing
  const sampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
      description: 'Business Sign with Text'
    },
    {
      url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
      description: 'Menu Board'
    },
    {
      url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=600&fit=crop',
      description: 'Product Label'
    }
  ];

  const handleDetectText = async (url: string) => {
    setImageUrl(url);
    setIsDetecting(true);
    setDetections([]);

    try {
      toast({
        title: 'Starting OCR Analysis',
        description: 'Analyzing image with Tesseract.js...',
      });

      console.log('🔍 Starting OCR detection for:', url);
      const results = await textDetectionService.detectText(url);
      
      console.log('📝 OCR Results:', results);
      setDetections(results);

      if (results.length > 0) {
        toast({
          title: 'OCR Detection Complete',
          description: `Found ${results.length} text region${results.length === 1 ? '' : 's'} with confidence scores.`,
        });
      } else {
        toast({
          title: 'No Text Detected',
          description: 'OCR did not find any readable text in this image.',
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        variant: 'destructive',
        title: 'OCR Failed',
        description: 'Failed to analyze image. Please try again.',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCustomImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const customUrl = formData.get('customUrl') as string;
    
    if (customUrl) {
      handleDetectText(customUrl);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">OCR Text Detection Test</h1>
        <p className="text-muted-foreground">
          Test real OCR text detection using Tesseract.js
        </p>
      </div>

      {/* Custom Image URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test OCR with Custom Image</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCustomImageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customUrl">Image URL (with clear, readable text)</Label>
              <Input
                id="customUrl"
                name="customUrl"
                type="url"
                placeholder="https://example.com/image-with-text.jpg"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isDetecting}>
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with OCR...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  Detect Text with OCR
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample Images */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Images for OCR Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleImages.map((sample, index) => (
              <div key={index} className="space-y-2">
                <div className="relative group">
                  <img
                    src={sample.url}
                    alt={sample.description}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      onClick={() => handleDetectText(sample.url)}
                      variant="secondary"
                      disabled={isDetecting}
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Test OCR
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{sample.description}</h4>
                  <Button
                    onClick={() => handleDetectText(sample.url)}
                    size="sm"
                    className="w-full"
                    disabled={isDetecting}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Detect Text
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* OCR Results */}
      {imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              OCR Analysis Results
              {detections.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverlays(!showOverlays)}
                >
                  {showOverlays ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Overlays
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Overlays
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Image with OCR Overlays */}
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="OCR Analysis"
                  className="max-w-full h-auto border rounded-lg"
                  style={{ maxHeight: '500px' }}
                />
                
                {/* OCR Detection Overlays */}
                {showOverlays && detections.map((detection) => (
                  <div
                    key={detection.id}
                    className="absolute border-2 border-red-500 border-dashed bg-red-500/10"
                    style={{
                      left: `${detection.x}px`,
                      top: `${detection.y}px`,
                      width: `${detection.width}px`,
                      height: `${detection.height}px`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-1 rounded">
                      {Math.round(detection.confidence * 100)}%
                    </div>
                    <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 max-w-full truncate">
                      {detection.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detection Details */}
              {detections.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Detected Text Regions ({detections.length})</h4>
                  <div className="grid gap-2">
                    {detections.map((detection, index) => (
                      <div key={detection.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{detection.text}</div>
                          <div className="text-sm text-muted-foreground">
                            Position: ({detection.x}, {detection.y}) | 
                            Size: {detection.width}×{detection.height}px
                          </div>
                        </div>
                        <Badge variant={detection.confidence > 0.8 ? 'default' : detection.confidence > 0.6 ? 'secondary' : 'destructive'}>
                          {Math.round(detection.confidence * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {!isDetecting && detections.length === 0 && imageUrl && (
                <div className="text-center py-8 text-muted-foreground">
                  <Scan className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No text detected in this image.</p>
                  <p className="text-sm">Try with an image containing clear, readable text.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OCR Information */}
      <Card>
        <CardHeader>
          <CardTitle>OCR Technology Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Current Implementation</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Engine:</strong> Tesseract.js v5</li>
                <li>• <strong>Language:</strong> English (eng)</li>
                <li>• <strong>Mode:</strong> Uniform block of text</li>
                <li>• <strong>Confidence:</strong> Minimum 30% threshold</li>
                <li>• <strong>Processing:</strong> Client-side OCR</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Detection Features</h4>
              <ul className="text-sm space-y-1">
                <li>• Word-level text detection</li>
                <li>• Intelligent text block grouping</li>
                <li>• Confidence scoring per detection</li>
                <li>• Accurate bounding box coordinates</li>
                <li>• Noise filtering and validation</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Best Practices for OCR</h4>
            <ul className="text-sm space-y-1">
              <li>• Use high-contrast images (dark text on light background)</li>
              <li>• Ensure text is clearly readable and not too small</li>
              <li>• Avoid heavily stylized or decorative fonts</li>
              <li>• Images should be well-lit and not blurry</li>
              <li>• Horizontal text works better than rotated text</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
