// src/components/studio/image-editor.tsx
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { X, Wand, Brush, Eraser, Undo, Redo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateCreativeAssetAction } from '@/app/actions';
import type { BrandProfile } from '@/lib/types';
import { cn } from '@/lib/utils';


interface ImageEditorProps {
    imageUrl: string;
    onClose: () => void;
    brandProfile: BrandProfile | null;
}

export function ImageEditor({ imageUrl, onClose, brandProfile }: ImageEditorProps) {
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
    const { toast } = useToast();
    
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
            // Set both canvases to the image's dimensions
            imageCanvas.width = image.naturalWidth;
            imageCanvas.height = image.naturalHeight;
            drawingCanvas.width = image.naturalWidth;
            drawingCanvas.height = image.naturalHeight;

            // Draw the image on the bottom canvas
            imageCtx.drawImage(image, 0, 0);

            // Clear the top (drawing) canvas and initialize history
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            const initialImageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            setHistory([initialImageData]);
            setHistoryIndex(0);
        };
        image.onerror = () => {
            toast({ variant: 'destructive', title: "Error loading image", description: "Could not load the image for editing." });
        }
    };
    
    // Redraw the main image when the URL changes
    useEffect(() => {
        drawImage(currentImageUrl);
    }, [currentImageUrl]);


    const getDrawingContext = () => drawingCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    
    const saveToHistory = () => {
        const drawingCtx = getDrawingContext();
        if (!drawingCtx || !drawingCanvasRef.current) return;
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(drawingCtx.getImageData(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height));
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }
    
    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const drawingCtx = getDrawingContext();
            if (drawingCtx) {
                drawingCtx.putImageData(history[newIndex], 0, 0);
            }
        }
    }
    
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const drawingCtx = getDrawingContext();
            if (drawingCtx) {
                drawingCtx.putImageData(history[newIndex], 0, 0);
            }
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
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'brush') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black for mask
        } else { // Eraser
            ctx.globalCompositeOperation = 'destination-out';
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = drawingCanvasRef.current;
        const ctx = getDrawingContext();
        if (!ctx || !canvas) return;
        
        const { x, y } = getMousePos(canvas, e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    
    const stopDrawing = () => {
        if (!isDrawing) return;
        const ctx = getDrawingContext();
        if (ctx) ctx.closePath();
        setIsDrawing(false);
        saveToHistory();
    };

    const getMaskDataUrl = (): string => {
        const drawingCanvas = drawingCanvasRef.current;
        if (!drawingCanvas) return '';
        const ctx = getDrawingContext();
        if (!ctx) return '';
        
        const originalImageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        const originalData = originalImageData.data;

        // Create a new canvas for the final black and white mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = drawingCanvas.width;
        maskCanvas.height = drawingCanvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return '';

        const maskImageData = maskCtx.createImageData(drawingCanvas.width, drawingCanvas.height);
        const maskData = maskImageData.data;
        
        for (let i = 0; i < originalData.length; i += 4) {
            // If the pixel on the drawing canvas has any content (alpha > 0), make it black on the mask
            if (originalData[i + 3] > 0) {
                maskData[i] = 0;     // R
                maskData[i + 1] = 0; // G
                maskData[i + 2] = 0; // B
                maskData[i + 3] = 255; // A (fully opaque black)
            } else {
                // Otherwise, make it white
                maskData[i] = 255;
                maskData[i + 1] = 255;
                maskData[i + 2] = 255;
                maskData[i + 3] = 255; // A (fully opaque white)
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

        const maskDataUrl = getMaskDataUrl();
        if (!maskDataUrl) {
            toast({ variant: 'destructive', title: "Mask Error", description: "Could not generate the mask data." });
            setIsLoading(false);
            return;
        }

        try {
            const result = await generateCreativeAssetAction(
                prompt,
                'image',
                currentImageUrl,
                !!brandProfile,
                brandProfile,
                maskDataUrl
            );

            if (result.imageUrl) {
                setCurrentImageUrl(result.imageUrl);
                 toast({ title: "Image Updated!", description: result.aiExplanation });
            } else {
                 toast({ variant: 'destructive', title: "Generation Failed", description: "The AI did not return an image." });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Generation Failed", description: (error as Error).message });
        } finally {
            setIsLoading(false);
            setPrompt("");
        }
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
                        <Button variant='outline' onClick={handleUndo} disabled={historyIndex <= 0}> <Undo className="mr-2"/> Undo</Button>
                        <Button variant='outline' onClick={handleRedo} disabled={historyIndex >= history.length - 1}><Redo className="mr-2"/> Redo</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Tool</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={tool === 'brush' ? 'secondary' : 'outline'} onClick={() => setTool('brush')}><Brush className="mr-2"/> Brush</Button>
                        <Button variant={tool === 'eraser' ? 'secondary' : 'outline'} onClick={() => setTool('eraser')}><Eraser className="mr-2"/> Eraser</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label htmlFor="brush-size">Brush Size: {brushSize}px</Label>
                    <Slider id="brush-size" min={5} max={100} value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} />
                </div>
                <Separator />
                <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="inpaint-prompt">Edit Prompt</Label>
                    <Input 
                        id="inpaint-prompt" 
                        placeholder="e.g., 'add sunglasses'" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Wand className="mr-2" />}
                    Generate
                </Button>
            </div>
            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-muted/20">
                <div className="relative">
                    <canvas
                        ref={imageCanvasRef}
                        className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                    />
                    <canvas
                        ref={drawingCanvasRef}
                        className={cn(
                            "absolute top-0 left-0 max-w-full max-h-full object-contain cursor-crosshair",
                            tool === 'brush' && 'cursor-crosshair',
                            tool === 'eraser' && 'cursor-grab' // A better cursor for erasing
                        )}
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
