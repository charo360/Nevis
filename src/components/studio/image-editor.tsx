// src/components/studio/image-editor.tsx
"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Wand, Brush, Eraser, Undo, Redo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateCreativeAssetAction } from '@/app/actions';
import type { BrandProfile } from '@/lib/types';

interface ImageEditorProps {
    imageUrl: string;
    onClose: () => void;
    brandProfile: BrandProfile | null;
}

export function ImageEditor({ imageUrl, onClose, brandProfile }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
    const { toast } = useToast();

    const getCanvasContext = () => canvasRef.current?.getContext('2d');

    const saveToHistory = (data: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(data);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const drawImageOnCanvas = (url: string) => {
        const canvas = canvasRef.current;
        const ctx = getCanvasContext();
        if (!canvas || !ctx) return;

        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        image.onload = () => {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.drawImage(image, 0, 0);
            imageRef.current = image;
            // Clear mask on new image
            ctx.globalCompositeOperation = 'source-over';
        };
    };

    useEffect(() => {
        drawImageOnCanvas(currentImageUrl);
    }, [currentImageUrl]);


    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = getCanvasContext();
        if (!ctx) return;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };
    
    const getMaskDataUrl = (): string => {
        const canvas = canvasRef.current;
        if (!canvas) return '';

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if(!tempCtx) return '';
        
        const originalCtx = getCanvasContext();
        if(!originalCtx) return '';

        const imageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Create a new imageData object for the mask
        const maskImageData = tempCtx.createImageData(canvas.width, canvas.height);
        const maskData = maskImageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Check if the pixel is part of the red mask (with some tolerance)
            if (data[i] > 200 && data[i+1] < 50 && data[i+2] < 50 && data[i+3] > 100) {
                 maskData[i] = 0;   // R
                 maskData[i+1] = 0; // G
                 maskData[i+2] = 0; // B
                 maskData[i+3] = 255; // A (black)
            } else {
                 maskData[i] = 255;   // R
                 maskData[i+1] = 255; // G
                 maskData[i+2] = 255; // B
                 maskData[i+3] = 255; // A (white)
            }
        }
        
        tempCtx.putImageData(maskImageData, 0, 0);
        return tempCanvas.toDataURL('image/png');
    };
    

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: "Prompt is required", description: "Please describe what you want to change." });
            return;
        }
        setIsLoading(true);

        const maskDataUrl = getMaskDataUrl();

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
                    <Label>Tool</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={tool === 'brush' ? 'secondary' : 'outline'} onClick={() => setTool('brush')}><Brush className="mr-2"/> Brush</Button>
                        <Button variant={tool === 'eraser' ? 'secondary' : 'outline'} onClick={() => setTool('eraser')}><Eraser className="mr-2"/> Eraser</Button>
                    </div>
                </div>
                <div className="space-y-4">
                    <Label htmlFor="brush-size">Brush Size: {brushSize}px</Label>
                    <Slider id="brush-size" min={1} max={100} value={[brushSize]} onValueChange={(v) => setBrushSize(v[0])} />
                </div>
                <Separator />
                <div className="space-y-2">
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
                 <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain cursor-crosshair rounded-md shadow-lg"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />
            </div>
        </div>
    );
}
