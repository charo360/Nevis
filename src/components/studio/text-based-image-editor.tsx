'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrandProfile } from '@/lib/types';

interface TextBasedImageEditorProps {
  originalImageUrl: string;
  brandProfile?: BrandProfile;
  platform?: string;
  onEditComplete?: (editedImageUrl: string, explanation: string) => void;
  className?: string;
}

interface EditCommand {
  type: string;
  target: string;
  replacement?: string;
  color?: string;
  size?: string;
}

interface EditResult {
  success: boolean;
  editedImageUrl?: string;
  appliedEdits: EditCommand[];
  processingTime: number;
  explanation?: string;
  error?: string;
}

export function TextBasedImageEditor({
  originalImageUrl,
  brandProfile,
  platform,
  onEditComplete,
  className = ''
}: TextBasedImageEditorProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editHistory, setEditHistory] = useState<EditResult[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState(originalImageUrl);
  const { toast } = useToast();

  // Example commands for user guidance
  const exampleCommands = [
    'Change "Special Offer" to "Limited Time Deal"',
    'Remove the background text',
    'Replace "Buy Now" with "Shop Today"',
    'Change color of title to blue',
    'Make the logo bigger',
    'Remove the phone number'
  ];

  const handleEdit = async () => {
    if (!command.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Command',
        description: 'Please enter an edit command'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: currentImageUrl,
          command: command.trim(),
          brandProfile,
          platform,
          preserveStyle: true
        }),
      });

      const result: EditResult = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to edit image');
      }

      // Update the current image and history
      if (result.editedImageUrl) {
        setCurrentImageUrl(result.editedImageUrl);
        setEditHistory(prev => [...prev, result]);
        
        toast({
          title: 'Edit Applied Successfully!',
          description: result.explanation || 'Your image has been edited',
        });

        // Notify parent component
        if (onEditComplete) {
          onEditComplete(result.editedImageUrl, result.explanation || '');
        }
      }

      // Clear the command input
      setCommand('');

    } catch (error) {
      console.error('Edit failed:', error);
      toast({
        variant: 'destructive',
        title: 'Edit Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setCommand(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleEdit();
    }
  };

  const resetToOriginal = () => {
    setCurrentImageUrl(originalImageUrl);
    setEditHistory([]);
    setCommand('');
    toast({
      title: 'Reset Complete',
      description: 'Image has been reset to original'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Text-Based Image Editor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit your generated image using natural language commands. Tell the AI what changes you want to make!
          </p>
        </CardHeader>
      </Card>

      {/* Current Image Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Current Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Current design"
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
            />
            {editHistory.length > 0 && (
              <Badge className="absolute top-2 right-2 bg-green-500">
                {editHistory.length} edit{editHistory.length !== 1 ? 's' : ''} applied
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Command Input */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Command</CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe what you want to change in plain English
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='e.g., "Change Special Offer to Limited Deal"'
              disabled={isProcessing}
              className="flex-1"
            />
            <Button 
              onClick={handleEdit} 
              disabled={isProcessing || !command.trim()}
              className="min-w-[100px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Editing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Apply Edit
                </>
              )}
            </Button>
          </div>

          {/* Example Commands */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Example commands:</p>
            <div className="flex flex-wrap gap-2">
              {exampleCommands.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          {editHistory.length > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                onClick={resetToOriginal}
                disabled={isProcessing}
                className="w-full"
              >
                Reset to Original Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit History */}
      {editHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Edit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {editHistory.map((edit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {edit.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      Edit #{index + 1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {edit.explanation || 'Edit applied'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {edit.appliedEdits.map((cmd, cmdIndex) => (
                        <Badge key={cmdIndex} variant="secondary" className="text-xs">
                          {cmd.type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Processed in {edit.processingTime}ms
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
