/**
 * Example component showing how to use the MagicStudioModal
 * This demonstrates the complete workflow for AI image editing
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MagicStudioModal } from './magic-studio-modal';
import { ImageAsset, urlToImageAsset } from '@/hooks/use-ai-image-editor';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Upload } from 'lucide-react';

export function AIImageEditorExample() {
  const [currentImage, setCurrentImage] = useState<ImageAsset | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const imageAsset = await urlToImageAsset(dataUrl, `upload_${Date.now()}`);
          setCurrentImage(imageAsset);
          toast({
            title: 'Image Loaded',
            description: 'Ready for AI editing!',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to load the image',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit confirmation
  const handleEditConfirm = (original: ImageAsset, editedImage: ImageAsset) => {
    setCurrentImage(editedImage);
    setShowEditor(false);
    toast({
      title: 'Edit Applied',
      description: 'Your image has been successfully edited!',
    });
  };

  // Handle edit cancellation
  const handleEditCancel = () => {
    setShowEditor(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">AI Image Editor</h1>
        <p className="text-gray-600">
          Upload an image and use AI to edit it with natural language prompts and optional masking
        </p>
      </div>

      {/* Upload Section */}
      {!currentImage && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload an Image</h3>
          <p className="text-gray-600 mb-4">Select an image to start editing with AI</p>
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
            <Button disabled={isLoading} className="cursor-pointer">
              {isLoading ? 'Loading...' : 'Choose Image'}
            </Button>
          </label>
        </div>
      )}

      {/* Image Display and Edit Section */}
      {currentImage && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Current Image</h3>
              <div className="space-x-2">
                <Button
                  onClick={() => setShowEditor(true)}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Edit with AI
                </Button>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <Button variant="outline" disabled={isLoading} className="cursor-pointer">
                    Upload New
                  </Button>
                </label>
              </div>
            </div>
            
            <div className="flex justify-center">
              <img
                src={currentImage.url}
                alt="Current image"
                className="max-w-full max-h-96 object-contain rounded border"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>ID:</strong> {currentImage.id}</p>
              <p><strong>Type:</strong> {currentImage.mimeType}</p>
              <p><strong>Size:</strong> {Math.round(currentImage.base64.length / 1024)} KB</p>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Edit with AI" to open the editor</li>
              <li>• Use the brush tool to select areas you want to modify (optional)</li>
              <li>• Enter a natural language prompt describing your desired changes</li>
              <li>• Click "Apply Edit" to let AI transform your image</li>
              <li>• Examples: "add sunglasses", "change background to beach", "make it nighttime"</li>
            </ul>
          </div>
        </div>
      )}

      {/* Magic Studio Modal */}
      {showEditor && currentImage && (
        <MagicStudioModal
          image={currentImage}
          onConfirm={handleEditConfirm}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}

export default AIImageEditorExample;
