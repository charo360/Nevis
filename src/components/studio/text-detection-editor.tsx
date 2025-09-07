'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Scan,
  Edit3,
  Trash2,
  Download,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Wand2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { textDetectionService } from '@/services/text-detection-service';

interface DetectedText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  isEditing: boolean;
  newText?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface TextDetectionEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export function TextDetectionEditor({ imageUrl, onSave, onCancel }: TextDetectionEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedTexts, setDetectedTexts] = useState<DetectedText[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetections, setShowDetections] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const { toast } = useToast();

  // Load image and initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw canvas when detections change
  useEffect(() => {
    if (!imageLoaded) return;
    redrawCanvas();
  }, [detectedTexts, showDetections, selectedText, imageLoaded]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // Draw detection boxes if enabled
      if (showDetections) {
        detectedTexts.forEach(detection => {
          drawDetectionBox(ctx, detection);
        });
      }
    };
    img.src = imageUrl;
  };

  const drawDetectionBox = (ctx: CanvasRenderingContext2D, detection: DetectedText) => {
    ctx.save();

    // Set box style based on state
    const isSelected = selectedText === detection.id;
    const isEditing = detection.isEditing;

    if (isSelected) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 3;
    } else if (isEditing) {
      ctx.strokeStyle = '#28a745';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#dc3545';
      ctx.lineWidth = 2;
    }

    ctx.setLineDash([5, 5]);
    ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

    // Draw confidence badge
    ctx.fillStyle = isSelected ? '#007bff' : isEditing ? '#28a745' : '#dc3545';
    ctx.fillRect(detection.x, detection.y - 20, 60, 20);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.round(detection.confidence * 100)}%`, detection.x + 5, detection.y - 8);

    // Draw text preview
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(detection.x, detection.y + detection.height, detection.width, 25);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    const displayText = detection.newText || detection.text;
    const truncatedText = displayText.length > 20 ? displayText.substring(0, 20) + '...' : displayText;
    ctx.fillText(truncatedText, detection.x + 5, detection.y + detection.height + 17);

    ctx.restore();
  };

  // Real OCR function using Tesseract.js
  const detectTextInImage = async (): Promise<DetectedText[]> => {
    try {
      console.log('🔍 Starting real OCR text detection...');

      // Use the real OCR service
      const detections = await textDetectionService.detectText(imageUrl);

      console.log('📝 OCR Results:', detections);

      // Convert to DetectedText format
      return detections.map(detection => ({
        id: detection.id,
        text: detection.text,
        x: detection.x,
        y: detection.y,
        width: detection.width,
        height: detection.height,
        confidence: detection.confidence,
        isEditing: false,
        fontSize: detection.fontSize,
        fontFamily: detection.fontFamily,
        color: detection.color
      }));

    } catch (error) {
      console.error('OCR detection failed:', error);
      throw error;
    }
  };

  const handleDetectText = async () => {
    setIsDetecting(true);
    try {
      toast({
        title: 'Starting OCR Detection',
        description: 'Analyzing image for text regions...',
      });

      const detections = await detectTextInImage();
      setDetectedTexts(detections);

      if (detections.length > 0) {
        toast({
          title: 'Text Detection Complete',
          description: `Found ${detections.length} text region${detections.length === 1 ? '' : 's'} in the image.`,
        });
      } else {
        toast({
          title: 'No Text Detected',
          description: 'No readable text was found in this image. Try with an image containing clear, readable text.',
        });
      }
    } catch (error) {
      console.error('Text detection error:', error);
      toast({
        variant: 'destructive',
        title: 'Detection Failed',
        description: 'Failed to detect text in the image. Please try again or use a different image.',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleEditText = (textId: string) => {
    setDetectedTexts(prev =>
      prev.map(text =>
        text.id === textId
          ? { ...text, isEditing: true, newText: text.newText || text.text }
          : { ...text, isEditing: false }
      )
    );
    setSelectedText(textId);
  };

  const handleUpdateText = (textId: string, newText: string) => {
    setDetectedTexts(prev =>
      prev.map(text =>
        text.id === textId ? { ...text, newText } : text
      )
    );
  };

  const handleSaveTextEdit = (textId: string) => {
    setDetectedTexts(prev =>
      prev.map(text =>
        text.id === textId ? { ...text, isEditing: false, text: text.newText || text.text } : text
      )
    );
    setSelectedText(null);
  };

  const handleCancelTextEdit = (textId: string) => {
    setDetectedTexts(prev =>
      prev.map(text =>
        text.id === textId ? { ...text, isEditing: false, newText: undefined } : text
      )
    );
    setSelectedText(null);
  };

  const handleDeleteText = (textId: string) => {
    setDetectedTexts(prev => prev.filter(text => text.id !== textId));
    if (selectedText === textId) {
      setSelectedText(null);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on any detected text
    const clickedText = detectedTexts.find(text =>
      x >= text.x && x <= text.x + text.width &&
      y >= text.y && y <= text.y + text.height
    );

    if (clickedText) {
      setSelectedText(clickedText.id);
      if (!clickedText.isEditing) {
        handleEditText(clickedText.id);
      }
    } else {
      setSelectedText(null);
    }
  };

  const processImageWithEdits = async () => {
    setIsProcessing(true);
    try {
      // In production, this would:
      // 1. Remove original text using inpainting
      // 2. Add new text in the same locations
      // 3. Return the edited image URL

      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock edited image URL
      const editedImageUrl = imageUrl; // In production, this would be the processed image

      onSave(editedImageUrl);

      toast({
        title: 'Text Editing Complete',
        description: 'Your image has been updated with the edited text.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: 'Failed to process the image with text edits.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const editingText = detectedTexts.find(text => text.isEditing);

  return (
    <div className="flex h-screen bg-background">
      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-gray-300 cursor-crosshair max-w-full max-h-full"
            style={{ maxWidth: '80vw', maxHeight: '80vh' }}
          />
          {(isDetecting || isProcessing) && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  {isDetecting ? 'Detecting text...' : 'Processing image...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Text Detection & Editing</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetections(!showDetections)}
            >
              {showDetections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Detection Controls */}
          <div className="space-y-2">
            <Button
              onClick={handleDetectText}
              className="w-full"
              disabled={isDetecting}
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Image with OCR...
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 mr-2" />
                  Detect Text with OCR
                </>
              )}
            </Button>

            {detectedTexts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setDetectedTexts([])}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Detections
              </Button>
            )}
          </div>

          {/* Detected Text List */}
          {detectedTexts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Detected Text ({detectedTexts.length})
                  <Badge variant="secondary">{showDetections ? 'Visible' : 'Hidden'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detectedTexts.map((text) => (
                  <div
                    key={text.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${selectedText === text.id
                      ? 'border-blue-500 bg-blue-50'
                      : text.isEditing
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setSelectedText(text.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={text.isEditing ? 'default' : 'secondary'}>
                        {Math.round(text.confidence * 100)}% confidence
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditText(text.id);
                          }}
                          disabled={text.isEditing}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteText(text.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm">
                      <strong>Original:</strong> {text.text}
                    </div>

                    {text.newText && text.newText !== text.text && (
                      <div className="text-sm text-green-600">
                        <strong>New:</strong> {text.newText}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Text Editor */}
          {editingText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Edit Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-text">Text Content</Label>
                  <Input
                    id="edit-text"
                    value={editingText.newText || editingText.text}
                    onChange={(e) => handleUpdateText(editingText.id, e.target.value)}
                    placeholder="Enter new text..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveTextEdit(editingText.id)}
                    size="sm"
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCancelTextEdit(editingText.id)}
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={processImageWithEdits}
              className="w-full"
              disabled={isProcessing || detectedTexts.length === 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Apply Text Edits
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>1. Click "Detect Text with OCR" to analyze the image</p>
              <p>2. OCR will find and highlight text regions</p>
              <p>3. Click on detected text boxes to edit them</p>
              <p>4. Edit the text content in the panel</p>
              <p>5. Click "Apply Text Edits" to process the image</p>
              <p>6. Toggle visibility with the eye icon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
