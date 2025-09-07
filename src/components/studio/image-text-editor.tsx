'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Type,
  Move,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  RotateCw,
  Trash2,
  Plus,
  Download,
  Undo,
  Redo,
  Loader2
} from 'lucide-react';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  opacity: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

interface ImageTextEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export function ImageTextEditor({ imageUrl, onSave, onCancel }: ImageTextEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<TextElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Font options
  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console'
  ];

  // Color presets
  const colorPresets = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

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

  // Redraw canvas when text elements change
  useEffect(() => {
    if (!imageLoaded) return;
    redrawCanvas();
  }, [textElements, imageLoaded]);

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

      // Draw all text elements
      textElements.forEach(element => {
        drawTextElement(ctx, element);
      });

      // Highlight selected element
      if (selectedElement) {
        const element = textElements.find(el => el.id === selectedElement);
        if (element) {
          drawSelectionBox(ctx, element);
        }
      }
    };
    img.src = imageUrl;
  };

  const drawTextElement = (ctx: CanvasRenderingContext2D, element: TextElement) => {
    ctx.save();

    // Apply transformations
    ctx.translate(element.x, element.y);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.globalAlpha = element.opacity;

    // Set font properties
    const fontStyle = element.fontStyle === 'italic' ? 'italic ' : '';
    const fontWeight = element.fontWeight === 'bold' ? 'bold ' : '';
    ctx.font = `${fontStyle}${fontWeight}${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textAlign = element.textAlign;

    // Apply shadow if specified
    if (element.shadowColor) {
      ctx.shadowColor = element.shadowColor;
      ctx.shadowBlur = element.shadowBlur || 0;
      ctx.shadowOffsetX = element.shadowOffsetX || 0;
      ctx.shadowOffsetY = element.shadowOffsetY || 0;
    }

    // Apply stroke if specified
    if (element.strokeColor && element.strokeWidth) {
      ctx.strokeStyle = element.strokeColor;
      ctx.lineWidth = element.strokeWidth;
      ctx.strokeText(element.text, 0, 0);
    }

    // Draw text
    ctx.fillText(element.text, 0, 0);

    // Apply underline if specified
    if (element.textDecoration === 'underline') {
      const metrics = ctx.measureText(element.text);
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(metrics.width, 5);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, element: TextElement) => {
    ctx.save();
    ctx.translate(element.x, element.y);
    ctx.rotate((element.rotation * Math.PI) / 180);

    const metrics = ctx.measureText(element.text);
    const width = metrics.width;
    const height = element.fontSize;

    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-10, -height - 10, width + 20, height + 20);

    ctx.restore();
  };

  const addTextElement = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: 'New Text',
      x: 100,
      y: 100,
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      rotation: 0,
      opacity: 1,
    };

    const newElements = [...textElements, newElement];
    setTextElements(newElements);
    setSelectedElement(newElement.id);
    saveToHistory(newElements);
  };

  const updateSelectedElement = (updates: Partial<TextElement>) => {
    if (!selectedElement) return;

    const newElements = textElements.map(el =>
      el.id === selectedElement ? { ...el, ...updates } : el
    );
    setTextElements(newElements);
    saveToHistory(newElements);
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    const newElements = textElements.filter(el => el.id !== selectedElement);
    setTextElements(newElements);
    setSelectedElement(null);
    saveToHistory(newElements);
  };

  const saveToHistory = (elements: TextElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTextElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTextElements([...history[historyIndex + 1]]);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on any text element
    const clickedElement = textElements.find(element => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      const metrics = ctx.measureText(element.text);

      return (
        x >= element.x - 10 &&
        x <= element.x + metrics.width + 10 &&
        y >= element.y - element.fontSize - 10 &&
        y <= element.y + 10
      );
    });

    setSelectedElement(clickedElement?.id || null);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const element = textElements.find(el => el.id === selectedElement);
    if (element) {
      setIsDragging(true);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    updateSelectedElement({
      x: x - dragOffset.x,
      y: y - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);

    // Create a temporary canvas for export without selection indicators
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) {
      setIsExporting(false);
      return;
    }

    // Set canvas dimensions
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    // Clear the export canvas
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Redraw original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      exportCtx.drawImage(img, 0, 0);

      // Draw all text elements WITHOUT selection indicators
      textElements.forEach(element => {
        drawTextElement(exportCtx, element);
      });

      // Export the clean canvas
      exportCanvas.toBlob((blob) => {
        setIsExporting(false);
        if (blob) {
          const url = URL.createObjectURL(blob);
          onSave(url);
        }
      }, 'image/png');
    };

    img.onerror = () => {
      setIsExporting(false);
    };

    img.src = imageUrl;
  };

  const selectedElementData = selectedElement
    ? textElements.find(el => el.id === selectedElement)
    : null;

  return (
    <div className="flex h-screen bg-background">
      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="border border-gray-300 cursor-crosshair max-w-full max-h-full"
            style={{ maxWidth: '80vw', maxHeight: '80vh' }}
          />
          {isExporting && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Exporting clean image...</span>
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
            <h2 className="text-lg font-semibold">Text Editor</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Add Text Button */}
          <Button onClick={addTextElement} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Text
          </Button>

          {/* Text Elements List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Text Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {textElements.map((element) => (
                <div
                  key={element.id}
                  className={`p-2 border rounded cursor-pointer ${selectedElement === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{element.text}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(element.id);
                        deleteSelectedElement();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {textElements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No text elements. Click "Add Text" to start.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Text Properties */}
          {selectedElementData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Text Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Content */}
                <div>
                  <Label htmlFor="text-content">Text</Label>
                  <Input
                    id="text-content"
                    value={selectedElementData.text}
                    onChange={(e) => updateSelectedElement({ text: e.target.value })}
                    placeholder="Enter text..."
                  />
                </div>

                {/* Font Family */}
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={selectedElementData.fontFamily}
                    onValueChange={(value) => updateSelectedElement({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div>
                  <Label>Font Size: {selectedElementData.fontSize}px</Label>
                  <Slider
                    value={[selectedElementData.fontSize]}
                    onValueChange={([value]) => updateSelectedElement({ fontSize: value })}
                    min={8}
                    max={120}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Font Style Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedElementData.fontWeight === 'bold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSelectedElement({
                      fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold'
                    })}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedElementData.fontStyle === 'italic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSelectedElement({
                      fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic'
                    })}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={selectedElementData.textDecoration === 'underline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSelectedElement({
                      textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline'
                    })}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>

                {/* Text Alignment */}
                <div>
                  <Label>Text Alignment</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={selectedElementData.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSelectedElement({ textAlign: 'left' })}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedElementData.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSelectedElement({ textAlign: 'center' })}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedElementData.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSelectedElement({ textAlign: 'right' })}
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <Label>Text Color</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${selectedElementData.color === color ? 'border-blue-500' : 'border-gray-300'
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateSelectedElement({ color })}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={selectedElementData.color}
                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                    className="mt-2 w-full h-10"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <Label>Rotation: {selectedElementData.rotation}°</Label>
                  <Slider
                    value={[selectedElementData.rotation]}
                    onValueChange={([value]) => updateSelectedElement({ rotation: value })}
                    min={-180}
                    max={180}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <Label>Opacity: {Math.round(selectedElementData.opacity * 100)}%</Label>
                  <Slider
                    value={[selectedElementData.opacity]}
                    onValueChange={([value]) => updateSelectedElement({ opacity: value })}
                    min={0}
                    max={1}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={exportImage}
              className="w-full"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
              disabled={isExporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
