/**
 * Magic Studio Modal - AI-powered image editing with masking support
 * Uses Google Gemini for intelligent image modifications
 */

"use client";

import React, { FC, useState, useRef, useEffect } from 'react';
import { X, Brush, Eraser, Undo, Redo, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useAIImageEditor, ImageAsset, urlToImageAsset, canvasToImageAsset } from '@/hooks/use-ai-image-editor';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TextEditHelper } from './text-edit-helper';

// Icon components
const ICONS = {
  BRUSH: <Brush className="w-4 h-4" />,
  ERASER: <Eraser className="w-4 h-4" />,
  UNDO: <Undo className="w-4 h-4" />,
  REDO: <Redo className="w-4 h-4" />,
  WAND: <Wand2 className="w-4 h-4" />,
  CLOSE: <X className="w-4 h-4" />,
  SPINNER: <Loader2 className="w-4 h-4 animate-spin" />
};

interface MagicStudioModalProps {
  image: ImageAsset;
  onConfirm: (original: ImageAsset, editedImage: ImageAsset) => void;
  onCancel: () => void;
}

export const MagicStudioModal: FC<MagicStudioModalProps> = ({ 
  image, 
  onConfirm, 
  onCancel 
}) => {
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(30);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [useOpenAI, setUseOpenAI] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDrawing = useRef(false);

  // History for undo/redo
  const history = useRef<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // AI image editor hook
  const { editImage, isProcessing, error, clearError } = useAIImageEditor();
  const { toast } = useToast();

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
  };

  // Initialize canvas when image loads
  useEffect(() => {
    const imageEl = imageRef.current;
    const canvasEl = canvasRef.current;
    if (!imageEl || !canvasEl) return;

    const handleImageLoad = () => {
      const ctx = getCanvasContext();
      if (!ctx) return;
      
      // Match canvas dimensions to the actual image dimensions
      canvasEl.width = imageEl.naturalWidth;
      canvasEl.height = imageEl.naturalHeight;
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      
      // Save initial state for undo
      history.current = [ctx.getImageData(0, 0, canvasEl.width, canvasEl.height)];
      setHistoryIndex(0);
    };

    // If image is already cached and loaded
    if (imageEl.complete) {
      handleImageLoad();
    } else {
      imageEl.addEventListener('load', handleImageLoad);
    }

    return () => {
      imageEl.removeEventListener('load', handleImageLoad);
    };
  }, [image]);

  // Clear error when prompt changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [prompt, error, clearError]);

  const saveHistory = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    const currentHistory = history.current.slice(0, historyIndex + 1);
    currentHistory.push(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
    history.current = currentHistory;
    setHistoryIndex(currentHistory.length - 1);
  };
  
  const restoreHistory = (index: number) => {
    const ctx = getCanvasContext();
    if (!ctx || !history.current[index]) return;
    ctx.putImageData(history.current[index], 0, 0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreHistory(newIndex);
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.current.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreHistory(newIndex);
    }
  };

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getMousePos(e);

    ctx.beginPath();
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 150, 0.7)'; // Visible pink color for mask
    } else { // eraser
      ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y); // Draw a dot on click
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const pos = getMousePos(e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    isDrawing.current = false;
    ctx.closePath();
    saveHistory();
  };

  const handleConfirm = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Missing Prompt',
        description: 'Please describe what you want to edit',
        variant: 'destructive',
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    const isMaskDrawn = historyIndex > 0;
    let maskAsset: ImageAsset | null = null;
    
    if (isMaskDrawn) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      
      if (maskCtx) {
        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < originalImageData.data.length; i += 4) {
          const alpha = originalImageData.data[i + 3];
          if (alpha > 0) { // Pixel was drawn on (area to edit)
            maskImageData.data[i] = 255;     // R (White)
            maskImageData.data[i + 1] = 255; // G
            maskImageData.data[i + 2] = 255; // B
            maskImageData.data[i + 3] = 255; // A
          } else { // Pixel was not touched (area to keep)
            maskImageData.data[i] = 0;       // R (Black)
            maskImageData.data[i + 1] = 0;   // G
            maskImageData.data[i + 2] = 0;   // B
            maskImageData.data[i + 3] = 255; // A
          }
        }
        maskCtx.putImageData(maskImageData, 0, 0);
        maskAsset = canvasToImageAsset(maskCanvas, `mask_${Date.now()}`);
      }
    }

    try {
      // TODO: Fix hook to support useOpenAI parameter
      const editedImage = await editImage(image, prompt, maskAsset);
      if (editedImage) {
        onConfirm(image, editedImage);
      }
    } catch (error) {
      console.error('Edit failed:', error);
      // Error handling is done by the hook
    }
  };

  const clearMask = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    history.current = [ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)];
    setHistoryIndex(0);
  };
  
  const isUndoable = historyIndex > 0;
  const isRedoable = historyIndex < history.current.length - 1;
  const hasMask = historyIndex > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {ICONS.WAND}
            <h3 className="text-lg font-semibold">AI Image Editor</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {ICONS.CLOSE}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'brush' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('brush')}
              className="flex items-center gap-2"
            >
              {ICONS.BRUSH}
              Brush
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              className="flex items-center gap-2"
            >
              {ICONS.ERASER}
              Eraser
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="brush-size">Size:</Label>
            <Slider
              id="brush-size"
              min={1}
              max={100}
              step={1}
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              className="w-24"
            />
            <span className="text-sm text-gray-600 w-8">{brushSize}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!isUndoable}
              title="Undo"
            >
              {ICONS.UNDO}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!isRedoable}
              title="Redo"
            >
              {ICONS.REDO}
            </Button>
          </div>

          {hasMask && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMask}
              className="text-red-600 hover:text-red-700"
            >
              Clear Mask
            </Button>
          )}
        </div>

        {/* Canvas Area */}
        <div className="p-4 bg-gray-100 flex justify-center" style={{ maxHeight: '400px', overflow: 'auto' }}>
          <div className="relative inline-block">
            <img 
              ref={imageRef} 
              src={image.url} 
              alt="Editing canvas" 
              className="max-w-full max-h-80 object-contain"
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                width: imageRef.current?.clientWidth || 'auto',
                height: imageRef.current?.clientHeight || 'auto'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-4">
          {/* Text Edit Helper */}
          <TextEditHelper onPromptGenerated={(generatedPrompt) => setPrompt(generatedPrompt)} />

          {/* Or Custom Prompt */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or enter custom prompt</span>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-prompt">Custom edit command</Label>
            <Input
              id="edit-prompt"
              type="text"
              placeholder="e.g., 'add a birthday hat', 'change the background to a beach', 'make the person smile'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
            />
            {hasMask && (
              <p className="text-sm text-gray-600">
                💡 Pink areas will be edited. Use the brush to select areas to modify, or leave blank to edit the entire image.
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isProcessing || !prompt.trim()}
              className="flex items-center gap-2"
            >
              {isProcessing ? ICONS.SPINNER : ICONS.WAND}
              {isProcessing ? 'Editing...' : 'Apply Edit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicStudioModal;
