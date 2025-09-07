// src/components/studio/asset-library.tsx
"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Plus,
  Crown,
  Palette,
  Star
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

interface AssetLibraryProps {
  assets: DesignAsset[];
  onUpload: (assets: DesignAsset[]) => void;
  brandProfile: BrandProfile | null;
}

export function AssetLibrary({ assets, onUpload, brandProfile }: AssetLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAssets: DesignAsset[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const asset: DesignAsset = {
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: e.target?.result as string,
            name: file.name,
            type: 'image',
            scale: 1,
            position: { x: 0, y: 0 }
          };
          newAssets.push(asset);
          
          if (newAssets.length === files.length) {
            onUpload(newAssets);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeAsset = (assetId: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== assetId);
    onUpload(updatedAssets);
  };

  return (
    <div className="space-y-4">
      {/* Brand Assets Section */}
      {brandProfile?.logoDataUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Brand Assets</span>
          </div>
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border">
                  <Image
                    src={brandProfile.logoDataUrl}
                    alt="Brand Logo"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Brand Logo</p>
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Auto-included
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Area */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Upload Assets</span>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Drop images here</p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Images
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Uploaded Assets */}
      {assets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">Design Assets</span>
            <Badge variant="outline" className="text-xs">
              {assets.length}
            </Badge>
          </div>
          
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {assets.map((asset) => (
                <Card key={asset.id} className="group">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={asset.url}
                          alt={asset.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {asset.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {asset.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAsset(asset.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Usage Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Pro Tips:</strong></p>
        <p>• Upload product photos, graphics, or icons</p>
        <p>• Images will be integrated into your design</p>
        <p>• Brand logo is automatically included</p>
        <p>• Supports PNG, JPG, and SVG formats</p>
      </div>
    </div>
  );
}
