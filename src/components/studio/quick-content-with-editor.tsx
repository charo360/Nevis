'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextBasedImageEditor } from './text-based-image-editor';
import { Edit3, Image as ImageIcon, Sparkles, History } from 'lucide-react';
import { BrandProfile } from '@/lib/types';
import { useTextImageEditor } from '@/hooks/use-text-image-editor';
import { useToast } from '@/hooks/use-toast';

interface QuickContentWithEditorProps {
  generatedContent?: {
    imageUrl: string;
    headline?: string;
    subheadline?: string;
    caption?: string;
    cta?: string;
    hashtags?: string[];
  };
  brandProfile?: BrandProfile;
  platform?: string;
  onContentUpdate?: (updatedContent: any) => void;
  className?: string;
}

export function QuickContentWithEditor({
  generatedContent,
  brandProfile,
  platform,
  onContentUpdate,
  className = ''
}: QuickContentWithEditorProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const [editedImageUrl, setEditedImageUrl] = useState<string>('');
  const { toast } = useToast();

  const {
    isProcessing,
    editHistory,
    applyEdit,
    resetToOriginal,
    undoLastEdit,
    canUndo,
    hasEdits,
    getEditStats
  } = useTextImageEditor({
    brandProfile,
    platform,
    onEditComplete: (result) => {
      if (result.success && result.editedImageUrl) {
        setEditedImageUrl(result.editedImageUrl);
        
        // Update parent component with new content
        if (onContentUpdate && generatedContent) {
          onContentUpdate({
            ...generatedContent,
            imageUrl: result.editedImageUrl
          });
        }
        
        toast({
          title: 'Edit Applied!',
          description: result.explanation || 'Your image has been successfully edited'
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Edit Failed',
        description: error
      });
    }
  });

  const currentImageUrl = editedImageUrl || generatedContent?.imageUrl || '';
  const stats = getEditStats();

  const handleEditComplete = (newImageUrl: string, explanation: string) => {
    setEditedImageUrl(newImageUrl);
    
    if (onContentUpdate && generatedContent) {
      onContentUpdate({
        ...generatedContent,
        imageUrl: newImageUrl
      });
    }
  };

  const handleReset = () => {
    if (generatedContent?.imageUrl) {
      resetToOriginal(generatedContent.imageUrl);
      setEditedImageUrl('');
      
      if (onContentUpdate) {
        onContentUpdate(generatedContent);
      }
      
      toast({
        title: 'Reset Complete',
        description: 'Image has been reset to original'
      });
    }
  };

  const handleUndo = () => {
    undoLastEdit();
    
    // Update with previous image state
    if (editHistory.length > 1) {
      const previousEdit = editHistory[editHistory.length - 2];
      if (previousEdit.editedImageUrl) {
        setEditedImageUrl(previousEdit.editedImageUrl);
        
        if (onContentUpdate && generatedContent) {
          onContentUpdate({
            ...generatedContent,
            imageUrl: previousEdit.editedImageUrl
          });
        }
      }
    } else if (generatedContent?.imageUrl) {
      setEditedImageUrl('');
      
      if (onContentUpdate) {
        onContentUpdate(generatedContent);
      }
    }
    
    toast({
      title: 'Edit Undone',
      description: 'Reverted to previous version'
    });
  };

  if (!generatedContent?.imageUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No generated content available for editing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Content with Text Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasEdits && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Edit3 className="h-3 w-3" />
                  {stats.totalEdits} edit{stats.totalEdits !== 1 ? 's' : ''}
                </Badge>
              )}
              {stats.successRate > 0 && (
                <Badge variant="outline">
                  {stats.successRate.toFixed(0)}% success
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Text Editor
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Design</CardTitle>
                <div className="flex gap-2">
                  {canUndo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndo}
                      disabled={isProcessing}
                    >
                      Undo Last Edit
                    </Button>
                  )}
                  {hasEdits && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={isProcessing}
                    >
                      Reset to Original
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Image Display */}
                <div className="relative">
                  <img
                    src={currentImageUrl}
                    alt="Generated content"
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                  {hasEdits && (
                    <Badge className="absolute top-2 right-2 bg-blue-500">
                      Edited
                    </Badge>
                  )}
                </div>

                {/* Content Details */}
                <div className="space-y-2 text-sm">
                  {generatedContent.headline && (
                    <div>
                      <span className="font-medium">Headline:</span> {generatedContent.headline}
                    </div>
                  )}
                  {generatedContent.subheadline && (
                    <div>
                      <span className="font-medium">Subheadline:</span> {generatedContent.subheadline}
                    </div>
                  )}
                  {generatedContent.cta && (
                    <div>
                      <span className="font-medium">CTA:</span> {generatedContent.cta}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor">
          <TextBasedImageEditor
            originalImageUrl={currentImageUrl}
            brandProfile={brandProfile}
            platform={platform}
            onEditComplete={handleEditComplete}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track all the edits made to your content
              </p>
            </CardHeader>
            <CardContent>
              {editHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No edits have been made yet</p>
                  <p className="text-sm">Switch to the Editor tab to start making changes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalEdits}</div>
                      <div className="text-sm text-muted-foreground">Total Edits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.successfulEdits}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.averageProcessingTime}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Time</div>
                    </div>
                  </div>

                  {/* Edit List */}
                  <div className="space-y-3">
                    {editHistory.map((edit, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Edit #{index + 1}</span>
                          <Badge variant={edit.success ? "default" : "destructive"}>
                            {edit.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {edit.explanation || edit.error || 'No description available'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {edit.appliedEdits.map((cmd, cmdIndex) => (
                            <Badge key={cmdIndex} variant="outline" className="text-xs">
                              {cmd.type.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
