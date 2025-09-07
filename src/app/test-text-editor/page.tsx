'use client';

import React, { useState } from 'react';
import { ImageTextEditor } from '@/components/studio/image-text-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function TestTextEditorPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const { toast } = useToast();

  // Sample image URLs for testing
  const sampleImages = [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
  ];

  const handleStartEditing = (url: string) => {
    setImageUrl(url);
    setIsEditorOpen(true);
  };

  const handleSaveEdit = (editedImageUrl: string) => {
    setEditedImages(prev => [...prev, editedImageUrl]);
    setIsEditorOpen(false);
    setImageUrl('');
    
    toast({
      title: 'Text Edit Saved',
      description: 'Your image has been updated with the new text.',
    });
  };

  const handleCancelEdit = () => {
    setIsEditorOpen(false);
    setImageUrl('');
  };

  const handleCustomImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const customUrl = formData.get('customUrl') as string;
    
    if (customUrl) {
      handleStartEditing(customUrl);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Image Text Editor Test</h1>
        <p className="text-muted-foreground">
          Test the image text editing functionality with sample images or your own URL
        </p>
      </div>

      {/* Custom Image URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test with Custom Image</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCustomImageSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customUrl">Image URL</Label>
              <Input
                id="customUrl"
                name="customUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>
            <Button type="submit">Edit This Image</Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample Images */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleImages.map((url, index) => (
              <div key={index} className="space-y-2">
                <img
                  src={url}
                  alt={`Sample ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <Button
                  onClick={() => handleStartEditing(url)}
                  className="w-full"
                  size="sm"
                >
                  Edit Text on Image {index + 1}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edited Images Gallery */}
      {editedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Edited Images ({editedImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editedImages.map((url, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={url}
                    alt={`Edited ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartEditing(url)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Edit Again
                    </Button>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `edited-image-${index + 1}.png`;
                        link.click();
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Editor Modal */}
      {isEditorOpen && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <ImageTextEditor
            imageUrl={imageUrl}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Edit Text on Image" on any sample image or enter your own image URL</li>
            <li>The text editor will open with the image loaded on a canvas</li>
            <li>Click "Add Text" to create new text elements</li>
            <li>Click on any text element to select and edit it</li>
            <li>Use the control panel to customize font, size, color, rotation, and more</li>
            <li>Drag text elements around the canvas to position them</li>
            <li>Use Undo/Redo buttons to manage your changes</li>
            <li>Click "Save Changes" to export the edited image</li>
            <li>The edited image will appear in the gallery below</li>
          </ol>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Text Editor Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Text Properties</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Multiple font families</li>
                <li>• Adjustable font size (8-120px)</li>
                <li>• Bold, italic, underline styles</li>
                <li>• Text alignment (left, center, right)</li>
                <li>• Custom colors with color picker</li>
                <li>• Rotation (-180° to 180°)</li>
                <li>• Opacity control (0-100%)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Editor Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Drag and drop text positioning</li>
                <li>• Multiple text elements</li>
                <li>• Undo/Redo functionality</li>
                <li>• Visual selection indicators</li>
                <li>• Real-time preview</li>
                <li>• High-quality PNG export</li>
                <li>• Responsive canvas sizing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
