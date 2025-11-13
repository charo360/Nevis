/**
 * Custom hook for AI-powered image editing with masking support
 * Integrates with the new /api/image-edit endpoint
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Image asset interface matching the API
export interface ImageAsset {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
}

// Hook return type
interface UseAIImageEditorReturn {
  editImage: (originalImage: ImageAsset, prompt: string, mask?: ImageAsset | null) => Promise<ImageAsset | null>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

// API response interface
interface AIEditResponse {
  success: boolean;
  editedImage?: ImageAsset;
  processingTime?: number;
  editType?: string;
  originalPrompt?: string;
  hasMask?: boolean;
  error?: string;
}

export function useAIImageEditor(): UseAIImageEditorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const editImage = useCallback(async (
    originalImage: ImageAsset,
    prompt: string,
    mask?: ImageAsset | null,
    useOpenAI: boolean = false
  ): Promise<ImageAsset | null> => {
    if (!originalImage || !prompt.trim()) {
      const errorMsg = 'Original image and prompt are required';
      setError(errorMsg);
      toast({
        title: 'Invalid Input',
        description: errorMsg,
        variant: 'destructive',
      });
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🎨 [AIImageEditor] Starting AI edit:', {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        hasMask: !!mask,
        imageId: originalImage.id
      });

      const requestBody = {
        editType: 'ai',
        originalImage,
        prompt: prompt.trim(),
        ...(mask && { mask })
      };

      const apiEndpoint = useOpenAI ? '/api/image-edit-openai' : '/api/image-edit';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: AIEditResponse = await response.json();

      if (!result.success || !result.editedImage) {
        throw new Error(result.error || 'Image editing failed');
      }

      console.log('✅ [AIImageEditor] Edit successful:', {
        processingTime: result.processingTime,
        hasMask: result.hasMask,
        editType: result.editType
      });

      toast({
        title: 'Edit Successful',
        description: `Image edited successfully in ${result.processingTime}ms`,
      });

      return result.editedImage;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ [AIImageEditor] Edit failed:', err);
      
      setError(errorMessage);
      toast({
        title: 'Edit Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    editImage,
    isProcessing,
    error,
    clearError,
  };
}

// Utility function to convert image URL to ImageAsset
export async function urlToImageAsset(url: string, id?: string): Promise<ImageAsset> {
  return new Promise((resolve, reject) => {
    if (url.startsWith('data:')) {
      // Already a data URL
      const [header, base64] = url.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
      
      resolve({
        id: id || `image_${Date.now()}`,
        url,
        base64,
        mimeType,
      });
      return;
    }

    // Convert regular URL to data URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        
        resolve({
          id: id || `image_${Date.now()}`,
          url: dataUrl,
          base64,
          mimeType: 'image/png',
        });
      } catch (error) {
        reject(new Error('Failed to convert image to base64'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Utility function to create mask from canvas
export function canvasToImageAsset(canvas: HTMLCanvasElement, id?: string): ImageAsset {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  
  return {
    id: id || `mask_${Date.now()}`,
    url: dataUrl,
    base64,
    mimeType: 'image/png',
  };
}
