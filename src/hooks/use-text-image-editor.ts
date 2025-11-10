'use client';

import { useState, useCallback } from 'react';
import { BrandProfile } from '@/lib/types';

interface EditCommand {
  type: string;
  target: string;
  replacement?: string;
  color?: string;
  size?: string;
  confidence?: number;
}

interface EditResult {
  success: boolean;
  editedImageUrl?: string;
  appliedEdits: EditCommand[];
  processingTime: number;
  explanation?: string;
  error?: string;
  suggestions?: string[];
  warnings?: string[];
}

interface UseTextImageEditorOptions {
  brandProfile?: BrandProfile;
  platform?: string;
  onEditComplete?: (result: EditResult) => void;
  onError?: (error: string) => void;
}

export function useTextImageEditor(options: UseTextImageEditorOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [editHistory, setEditHistory] = useState<EditResult[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const applyEdit = useCallback(async (
    originalImageUrl: string,
    command: string,
    preserveStyle: boolean = true
  ): Promise<EditResult> => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl,
          command: command.trim(),
          brandProfile: options.brandProfile,
          platform: options.platform,
          preserveStyle
        }),
      });

      const result: EditResult = await response.json();

      if (!response.ok || !result.success) {
        const error = result.error || 'Failed to edit image';
        if (options.onError) {
          options.onError(error);
        }
        throw new Error(error);
      }

      // Update history
      setEditHistory(prev => [...prev, result]);

      // Update current image if successful
      if (result.editedImageUrl) {
        setCurrentImageUrl(result.editedImageUrl);
      }

      // Notify completion
      if (options.onEditComplete) {
        options.onEditComplete(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResult: EditResult = {
        success: false,
        appliedEdits: [],
        processingTime: 0,
        error: errorMessage
      };

      if (options.onError) {
        options.onError(errorMessage);
      }

      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  const resetToOriginal = useCallback((originalImageUrl: string) => {
    setCurrentImageUrl(originalImageUrl);
    setEditHistory([]);
  }, []);

  const undoLastEdit = useCallback(() => {
    if (editHistory.length > 0) {
      const newHistory = editHistory.slice(0, -1);
      setEditHistory(newHistory);
      
      // Set image to previous state
      if (newHistory.length > 0) {
        const lastEdit = newHistory[newHistory.length - 1];
        if (lastEdit.editedImageUrl) {
          setCurrentImageUrl(lastEdit.editedImageUrl);
        }
      }
    }
  }, [editHistory]);

  const getEditSuggestions = useCallback((command: string): string[] => {
    // Basic suggestions based on command analysis
    const suggestions: string[] = [];
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('change') && !lowerCommand.includes(' to ')) {
      suggestions.push('Try: "Change [old text] to [new text]"');
    }

    if (lowerCommand.includes('remove') && lowerCommand.length < 15) {
      suggestions.push('Be more specific about what to remove');
    }

    if (lowerCommand.includes('color') && !lowerCommand.includes(' to ')) {
      suggestions.push('Try: "Change color of [element] to [color]"');
    }

    if (lowerCommand.includes('bigger') || lowerCommand.includes('smaller')) {
      suggestions.push('Try: "Make [element] bigger" or "Make [element] smaller"');
    }

    return suggestions;
  }, []);

  const validateCommand = useCallback((command: string): { valid: boolean; error?: string } => {
    if (!command || command.trim().length === 0) {
      return { valid: false, error: 'Command cannot be empty' };
    }

    if (command.length > 500) {
      return { valid: false, error: 'Command is too long (max 500 characters)' };
    }

    // Check for potentially harmful commands
    const harmfulPatterns = [
      /delete\s+all/i,
      /remove\s+everything/i,
      /clear\s+image/i,
      /destroy/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(command)) {
        return { 
          valid: false, 
          error: 'This command might remove too much content. Please be more specific.' 
        };
      }
    }

    return { valid: true };
  }, []);

  const getCommandExamples = useCallback((): string[] => {
    return [
      'Change "Special Offer" to "Limited Deal"',
      'Remove the background text',
      'Replace "Buy Now" with "Shop Today"',
      'Change color of title to blue',
      'Make the logo bigger',
      'Remove the phone number',
      'Add "New Product" text',
      'Make the headline smaller',
      'Change "Sale" to "Discount"',
      'Remove the watermark'
    ];
  }, []);

  const getEditStats = useCallback(() => {
    const totalEdits = editHistory.length;
    const successfulEdits = editHistory.filter(edit => edit.success).length;
    const averageProcessingTime = editHistory.length > 0 
      ? editHistory.reduce((sum, edit) => sum + edit.processingTime, 0) / editHistory.length 
      : 0;

    return {
      totalEdits,
      successfulEdits,
      successRate: totalEdits > 0 ? (successfulEdits / totalEdits) * 100 : 0,
      averageProcessingTime: Math.round(averageProcessingTime)
    };
  }, [editHistory]);

  return {
    // State
    isProcessing,
    editHistory,
    currentImageUrl,
    
    // Actions
    applyEdit,
    resetToOriginal,
    undoLastEdit,
    
    // Utilities
    validateCommand,
    getEditSuggestions,
    getCommandExamples,
    getEditStats,
    
    // Computed values
    canUndo: editHistory.length > 0,
    hasEdits: editHistory.length > 0
  };
}
