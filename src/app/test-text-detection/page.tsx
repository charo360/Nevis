'use client';

import React, { useState } from 'react';
import { TextDetectionEditor } from '@/components/studio/text-detection-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Scan, Type, Eye, Download } from 'lucide-react';

export default function TestTextDetectionPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const { toast } = useToast();

  // Sample images with text for testing
  const sampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
      description: 'Business Advertisement with Text'
    },
    {
      url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
      description: 'Store Sign with Text'
    },
    {
      url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop',
      description: 'Menu Board with Text'
    },
    {
      url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=600&fit=crop',
      description: 'Product Label with Text'
    },
  ];

  const handleStartDetection = (url: string) => {
    setImageUrl(url);
    setIsEditorOpen(true);
  };

  const handleSaveDetection = (editedImageUrl: string) => {
    setProcessedImages(prev => [...prev, editedImageUrl]);
    setIsEditorOpen(false);
    setImageUrl('');
    
    toast({
      title: 'Text Detection Complete',
      description: 'Your image has been processed with text edits.',
    });
  };

  const handleCancelDetection = () => {
    setIsEditorOpen(false);
    setImageUrl('');
  };

  const handleCustomImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const customUrl = formData.get('customUrl') as string;
    
    if (customUrl) {
      handleStartDetection(customUrl);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Text Detection & Editing Test</h1>
        <p className="text-muted-foreground">
          Test the OCR-based text detection and editing functionality
        </p>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Text Detection Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Detection Capabilities
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Automatic text region detection</li>
                <li>• Confidence scoring for each detection</li>
                <li>• Visual bounding boxes with color coding</li>
                <li>• Click-to-select text regions</li>
                <li>• Toggle detection visibility</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Type className="w-4 h-4" />
                Editing Features
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Edit detected text in-place</li>
                <li>• Real-time text preview</li>
                <li>• Delete unwanted text regions</li>
                <li>• Batch text processing</li>
                <li>• High-quality image output</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Image URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test with Custom Image</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCustomImageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customUrl">Image URL (preferably with visible text)</Label>
              <Input
                id="customUrl"
                name="customUrl"
                type="url"
                placeholder="https://example.com/image-with-text.jpg"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Scan className="w-4 h-4 mr-2" />
              Detect & Edit Text
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample Images */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Images with Text</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onClick={() => handleStartDetection(sample.url)}
                      variant="secondary"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Detect Text
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{sample.description}</h4>
                  <Button
                    onClick={() => handleStartDetection(sample.url)}
                    size="sm"
                    className="w-full"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Detect & Edit Text
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processed Images Gallery */}
      {processedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Processed Images ({processedImages.length})
              <Badge variant="secondary">
                <Download className="w-3 h-3 mr-1" />
                Ready for Download
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedImages.map((url, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={url}
                    alt={`Processed ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartDetection(url)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Scan className="w-3 h-3 mr-1" />
                      Edit Again
                    </Button>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `text-edited-${index + 1}.png`;
                        link.click();
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Detection Editor Modal */}
      {isEditorOpen && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <TextDetectionEditor
            imageUrl={imageUrl}
            onSave={handleSaveDetection}
            onCancel={handleCancelDetection}
          />
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Text Detection & Editing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Step-by-Step Process</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Choose a sample image or enter your own URL</li>
                <li>Click "Detect & Edit Text" to open the editor</li>
                <li>Click "Detect Text in Image" to scan for text</li>
                <li>Review detected text regions with confidence scores</li>
                <li>Click on any text region to edit its content</li>
                <li>Use the text editor panel to modify the text</li>
                <li>Click "Apply Text Edits" to process the image</li>
                <li>Download or further edit the processed image</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Visual Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-500 border-dashed"></div>
                  <span>Red: Detected text (unedited)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-dashed"></div>
                  <span>Blue: Selected text region</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-dashed"></div>
                  <span>Green: Text being edited</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">95%</Badge>
                  <span>Confidence score for detection accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Current Status:</strong> Mock implementation for development and testing</p>
          <p><strong>Production Integration:</strong> Ready for OCR services like Google Vision API, AWS Textract, or Tesseract.js</p>
          <p><strong>Text Processing:</strong> Supports inpainting-based text removal and intelligent text replacement</p>
          <p><strong>Image Quality:</strong> Maintains original resolution and applies professional text styling</p>
        </CardContent>
      </Card>
    </div>
  );
}
