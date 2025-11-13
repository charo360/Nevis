// src/components/studio/image-editor.tsx
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { X, Wand, Brush, Eraser, Undo, Redo, Loader2, RectangleHorizontal, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCredits } from '@/hooks/use-credits';
// Removed generateCreativeAssetAction - now using /api/image-edit endpoint directly
import type { BrandProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SmartEditSuggestions } from './smart-edit-suggestions';


interface ImageEditorProps {
    imageUrl: string;
    onClose: () => void;
    brandProfile: BrandProfile | null;
    onImageUpdated?: (newImageUrl: string) => void;
}

export function ImageEditor({ imageUrl, onClose, brandProfile, onImageUpdated }: ImageEditorProps) {
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const { useCreditsForImageEdit } = useCredits();

    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [tool, setTool] = useState<'brush' | 'eraser' | 'rect'>('brush');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // History for drawing actions (masking)
    const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
    const [drawHistoryIndex, setDrawHistoryIndex] = useState(-1);

    // History for generated images
    const [imageHistory, setImageHistory] = useState<string[]>([imageUrl]);
    const [imageHistoryIndex, setImageHistoryIndex] = useState(0);

    const { toast } = useToast();
    
    const [rectStart, setRectStart] = useState<{x: number, y: number} | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const currentImageUrl = imageHistory[imageHistoryIndex];

    // Function to draw the main image onto its canvas
    const drawImage = (url: string) => {
        const imageCanvas = imageCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!imageCanvas || !drawingCanvas) return;

        const imageCtx = imageCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (!imageCtx || !drawingCtx) return;

        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        image.onload = () => {
            // Calculate scaled dimensions to fit within 70vw x 70vh
            const maxWidth = window.innerWidth * 0.7;
            const maxHeight = window.innerHeight * 0.7;
            
            let { width, height } = image;
            const aspectRatio = width / height;
            
            // Scale down if image is too large
            if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
            }
            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }
            
            imageCanvas.width = width;
            imageCanvas.height = height;
            drawingCanvas.width = width;
            drawingCanvas.height = height;

            imageCtx.drawImage(image, 0, 0, width, height);

            // Clear drawing canvas and reset its history
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            const initialImageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            setDrawHistory([initialImageData]);
            setDrawHistoryIndex(0);
        };
        image.onerror = () => {
            toast({ variant: 'destructive', title: "Error loading image", description: "Could not load the image for editing." });
        }
    };
    
    // Redraw the image whenever the currentImageUrl changes (from undo/redo or new generation)
    useEffect(() => {
        if (currentImageUrl) {
            drawImage(currentImageUrl);
        }
    }, [currentImageUrl]);


    const getDrawingContext = () => drawingCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    
    const saveToDrawHistory = () => {
        const drawingCtx = getDrawingContext();
        if (!drawingCtx || !drawingCanvasRef.current) return;
        
        const newHistory = drawHistory.slice(0, drawHistoryIndex + 1);
        newHistory.push(drawingCtx.getImageData(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height));
        setDrawHistory(newHistory);
        setDrawHistoryIndex(newHistory.length - 1);
    }
    
    const handleDrawUndo = () => {
        if (drawHistoryIndex > 0) {
            const newIndex = drawHistoryIndex - 1;
            setDrawHistoryIndex(newIndex);
            const drawingCtx = getDrawingContext();
            if (drawingCtx) {
                drawingCtx.putImageData(drawHistory[newIndex], 0, 0);
            }
        }
    }
    
    const handleDrawRedo = () => {
        if (drawHistoryIndex < drawHistory.length - 1) {
            const newIndex = drawHistoryIndex + 1;
            setDrawHistoryIndex(newIndex);
            const drawingCtx = getDrawingContext();
            if (drawingCtx) {
                drawingCtx.putImageData(drawHistory[newIndex], 0, 0);
            }
        }
    }
    
    const handleGenerationUndo = () => {
        if (imageHistoryIndex > 0) {
            setImageHistoryIndex(prev => prev - 1);
        }
    }

    const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
            y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
        };
    }

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = drawingCanvasRef.current;
        const ctx = getDrawingContext();
        if (!ctx || !canvas) return;

        const { x, y } = getMousePos(canvas, e);
        setIsDrawing(true);
        
        if (tool === 'brush' || tool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        } else if (tool === 'rect') {
            setRectStart({ x, y });
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = drawingCanvasRef.current;
        const ctx = getDrawingContext();
        if (!ctx || !canvas) return;
        
        const { x, y } = getMousePos(canvas, e);
        
        if (tool === 'brush' || tool === 'eraser') {
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (tool === 'rect' && rectStart) {
            // Restore previous state to draw rect preview
            ctx.putImageData(drawHistory[drawHistoryIndex], 0, 0);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(rectStart.x, rectStart.y, x - rectStart.x, y - rectStart.y);
        }
    };
    
    const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = drawingCanvasRef.current;
        const ctx = getDrawingContext();
        if (!ctx || !canvas) return;

        if (tool === 'brush' || tool === 'eraser') {
            ctx.closePath();
        } else if (tool === 'rect' && rectStart) {
            // Restore canvas before drawing final rect
            ctx.putImageData(drawHistory[drawHistoryIndex], 0, 0);
            const { x, y } = getMousePos(canvas, e);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(rectStart.x, rectStart.y, x - rectStart.x, y - rectStart.y);
            setRectStart(null);
        }

        setIsDrawing(false);
        saveToDrawHistory();
    };


    const getMaskDataUrl = (): string => {
        const drawingCanvas = drawingCanvasRef.current;
        if (!drawingCanvas) return '';
        const ctx = getDrawingContext();
        if (!ctx) return '';
        
        const originalImageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        const originalData = originalImageData.data;

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = drawingCanvas.width;
        maskCanvas.height = drawingCanvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return '';

        const maskImageData = maskCtx.createImageData(drawingCanvas.width, drawingCanvas.height);
        const maskData = maskImageData.data;
        
        for (let i = 0; i < originalData.length; i += 4) {
            if (originalData[i + 3] > 0) { // If pixel has alpha
                maskData[i] = 0;     // R (black)
                maskData[i + 1] = 0; // G
                maskData[i + 2] = 0; // B
                maskData[i + 3] = 255; // A (opaque)
            } else {
                maskData[i] = 255;   // R (white)
                maskData[i + 1] = 255; // G
                maskData[i + 2] = 255; // B
                maskData[i + 3] = 255; // A (opaque)
            }
        }

        maskCtx.putImageData(maskImageData, 0, 0);
        return maskCanvas.toDataURL('image/png');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: "Prompt is required", description: "Please describe what you want to change." });
            return;
        }

        setIsLoading(true);

        try {
            // Deduct 1 credit for image editing
            const creditResult = await useCreditsForImageEdit({
                feature: 'image_editing',
                editType: 'ai_inpainting',
                prompt: prompt.substring(0, 100) // Log first 100 chars of prompt
            });
            if (!creditResult.success) {
                toast({
                    variant: "destructive",
                    title: "Insufficient Credits",
                    description: "You need 1 credit to edit this image. Please purchase more credits.",
                    duration: 6000,
                });
                setIsLoading(false);
                return;
            }

            const maskDataUrl = getMaskDataUrl();
            if (!maskDataUrl) {
                toast({ variant: 'destructive', title: "Mask Error", description: "Could not generate the mask data." });
                setIsLoading(false);
                return;
            }

            // Convert current image to base64 for the API
            const imageCanvas = imageCanvasRef.current;
            if (!imageCanvas) {
                toast({ variant: 'destructive', title: "Canvas Error", description: "Image canvas not found." });
                setIsLoading(false);
                return;
            }

            const originalImage = {
                id: `img_${Date.now()}`,
                url: currentImageUrl,
                base64: imageCanvas.toDataURL('image/png').split(',')[1],
                mimeType: 'image/png',
            };

            const mask = maskDataUrl ? {
                id: `mask_${Date.now()}`,
                url: maskDataUrl,
                base64: maskDataUrl.split(',')[1],
                mimeType: 'image/png',
            } : null;

            const response = await fetch('/api/image-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImage,
                    prompt,
                    mask,
                    editType: 'ai',
                }),
            });

            const result = await response.json();

            if (result.success && result.editedImage) {
                const newHistory = imageHistory.slice(0, imageHistoryIndex + 1);
                newHistory.push(result.editedImage.url);
                setImageHistory(newHistory);
                setImageHistoryIndex(newHistory.length - 1);
                
                // Call the callback to update the parent component
                if (onImageUpdated) {
                    onImageUpdated(result.editedImage.url);
                }
                
                toast({ title: "Image Updated!", description: "Edit applied successfully" });
            } else {
                toast({ variant: 'destructive', title: "Edit Failed", description: result.error || 'The AI did not return an image.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Generation Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
            setPrompt("");
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
        toast({ title: "Suggestion Applied", description: "Edit prompt has been filled. Click Generate to apply the edit." });
    };

    return (
        <div className="flex h-full w-full bg-background">
            {/* Toolbar */}
            <div className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Image Editor</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
                </div>
                
                 <div className="space-y-4">
                    <Label>History</Label>
                     <div className="grid grid-cols-2 gap-2">
                        <Button variant='outline' onClick={handleDrawUndo} disabled={drawHistoryIndex <= 0}> <Undo className="mr-2"/> Undo Mask</Button>
                        <Button variant='outline' onClick={handleDrawRedo} disabled={drawHistoryIndex >= drawHistory.length - 1}><Redo className="mr-2"/> Redo Mask</Button>
                    </div>
                     <Button variant='outline' onClick={handleGenerationUndo} disabled={imageHistoryIndex <= 0} className="w-full">
                        <Undo className="mr-2"/> Undo Generation
                    </Button>
                </div>

                <div className="space-y-4">
                    <Label>Tool</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant={tool === 'brush' ? 'secondary' : 'outline'} onClick={() => setTool('brush')}><Brush/></Button>
                        <Button variant={tool === 'rect' ? 'secondary' : 'outline'} onClick={() => setTool('rect')}><RectangleHorizontal/></Button>
                        <Button variant={tool === 'eraser' ? 'secondary' : 'outline'} onClick={() => setTool('eraser')}><Eraser/></Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Brush Size</Label>
                    <Slider
                        value={[brushSize]}
                        onValueChange={(value) => setBrushSize(value[0])}
                        max={100}
                        min={5}
                        step={5}
                    />
                    <div className="text-sm text-muted-foreground">{brushSize}px</div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="inpaint-prompt">Edit Prompt</Label>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="h-6 px-2"
                        >
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Tips
                        </Button>
                    </div>
                    <Input 
                        id="inpaint-prompt" 
                        placeholder="e.g., 'Change headline to Welcome' or 'Add a Buy Now button'" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Wand className="mr-2" />}
                        Generate
                    </Button>
                </div>
                
                {/* Smart Edit Suggestions Panel */}
                {showSuggestions && (
                    <div className="mt-4">
                        <SmartEditSuggestions onSuggestionClick={handleSuggestionClick} />
                    </div>
                )}
            </div>
            
            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-muted/20">
                <div className="relative max-w-[70vw] max-h-[70vh]">
                    <canvas
                        ref={imageCanvasRef}
                        className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                        style={{ maxWidth: '70vw', maxHeight: '70vh' }}
                    />
                    <canvas
                        ref={drawingCanvasRef}
                        className={cn(
                            "absolute top-0 left-0 max-w-full max-h-full object-contain cursor-crosshair"
                        )}
                        style={{ maxWidth: '70vw', maxHeight: '70vh' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>
            </div>
        </div>
    );
}
