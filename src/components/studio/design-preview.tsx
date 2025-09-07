// src/components/studio/design-preview.tsx
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  Edit,
  Download,
  Maximize2,
  Loader2,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import type { BrandProfile } from '@/lib/types';

interface DesignAsset {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'logo' | 'icon';
  position?: { x: number; y: number };
  scale?: number;
}

interface TextElement {
  type: 'headline' | 'subheadline' | 'cta';
  content: string;
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    position?: { x: number; y: number };
  };
}

interface DesignPreviewProps {
  assets: DesignAsset[];
  textElements: TextElement[];
  template: string;
  generatedImage: string | null;
  isGenerating: boolean;
  brandProfile: BrandProfile | null;
  onEditImage: (imageUrl: string) => void;
}

export function DesignPreview({
  assets,
  textElements,
  template,
  generatedImage,
  isGenerating,
  brandProfile,
  onEditImage
}: DesignPreviewProps) {
  const hasContent = assets.length > 0 || textElements.some(el => el.content.trim());

  const renderPreviewContent = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium">Creating Your Professional Design...</p>
            <p className="text-sm text-muted-foreground">
              Applying brand elements and professional styling
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      );
    }

    if (generatedImage) {
      return (
        <div className="relative h-full group">
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-white shadow-lg">
            <Image
              src={generatedImage}
              alt="Generated Design"
              fill
              className="object-contain"
            />
          </div>

          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEditImage(generatedImage)}
                className="backdrop-blur-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="backdrop-blur-sm"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>

          {/* Quality Badge */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-green-500 hover:bg-green-600">
              <Sparkles className="w-3 h-3 mr-1" />
              Design Complete
            </Badge>
          </div>
        </div>
      );
    }

    if (!hasContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-lg">Ready to Create</h3>
            <p className="text-muted-foreground max-w-sm">
              Upload images and add text to see a preview of your professional design
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">Upload Assets</Badge>
            <Badge variant="outline">Add Text</Badge>
            <Badge variant="outline">Generate Design</Badge>
          </div>
        </div>
      );
    }

    // Show preview mockup when content is added but not generated yet
    return (
      <div className="relative h-full">
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-4">
          <div className="text-center space-y-2">
            <Eye className="w-8 h-8 mx-auto text-muted-foreground" />
            <h3 className="font-medium">Preview Ready</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your design elements are ready. Click "Generate Design" to create your professional image.
            </p>
          </div>

          {/* Content Summary */}
          <div className="space-y-2">
            {assets.length > 0 && (
              <Badge variant="secondary">
                {assets.length} Asset{assets.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {textElements.filter(el => el.content.trim()).length > 0 && (
              <Badge variant="secondary">
                {textElements.filter(el => el.content.trim()).length} Text Element{textElements.filter(el => el.content.trim()).length !== 1 ? 's' : ''}
              </Badge>
            )}
            {brandProfile?.logoDataUrl && (
              <Badge variant="secondary">
                Brand Logo
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Area */}
      <div className="flex-1 min-h-0">
        <div className="w-full h-full max-w-lg mx-auto aspect-square">
          {renderPreviewContent()}
        </div>
      </div>

      {/* Preview Info */}
      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Template:</span>
            <Badge variant="outline" className="capitalize">
              {template}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Format:</span>
            <Badge variant="outline">
              1:1 Square
            </Badge>
          </div>
        </div>

        {generatedImage && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Professional design ready
              </span>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
