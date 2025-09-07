// src/components/studio/professional-design-panel.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AssetLibrary } from './asset-library';
import { TextControls } from './text-controls';
import { DesignPreview } from './design-preview';
import { PromptBuilder } from './prompt-builder';
import { StyleControls } from './style-controls';
import {
  Upload,
  Type,
  Eye,
  Wand2,
  Palette,
  Download,
  Save,
  Share,
  Settings
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';

interface ProfessionalDesignPanelProps {
  brandProfile: BrandProfile | null;
  onEditImage: (imageUrl: string) => void;
}

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

export function ProfessionalDesignPanel({ brandProfile, onEditImage }: ProfessionalDesignPanelProps) {
  const [uploadedAssets, setUploadedAssets] = useState<DesignAsset[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([
    { type: 'headline', content: '' },
    { type: 'subheadline', content: '' },
    { type: 'cta', content: '' }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleAssetUpload = (assets: DesignAsset[]) => {
    setUploadedAssets(prev => [...prev, ...assets]);
  };

  const handleTextChange = (type: TextElement['type'], content: string) => {
    setTextElements(prev =>
      prev.map(element =>
        element.type === type ? { ...element, content } : element
      )
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Build professional design prompt
      const textContent = textElements
        .filter(el => el.content.trim())
        .map(el => `${el.type}: ${el.content}`)
        .join(', ');

      const assetInfo = uploadedAssets.length > 0
        ? `with ${uploadedAssets.length} uploaded asset(s)`
        : '';

      const designPrompt = `Create a professional ${selectedTemplate} style social media design for ${brandProfile?.businessName || 'business'}. ${textContent}. ${assetInfo}. Use brand colors and professional layout. 1:1 square format, high quality, readable text.`;

      console.log('Generating professional design with AI:', {
        prompt: designPrompt,
        assets: uploadedAssets.length,
        textElements: textElements.filter(el => el.content.trim()).length,
        template: selectedTemplate,
        brandProfile: brandProfile?.businessName
      });

      // Call the Professional Studio API
      const response = await fetch('/api/professional-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: designPrompt,
          textElements: textElements.filter(el => el.content.trim()),
          assets: uploadedAssets,
          template: selectedTemplate,
          brandProfile: brandProfile,
          aspectRatio: '1:1'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'API request failed');
      }

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        throw new Error('No image URL returned from API');
      }

      setIsGenerating(false);
    } catch (error) {
      console.error('Professional design generation failed:', error);

      // Fallback to demo for now if AI fails
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 0, 1080, 1080);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI Generation Failed', 540, 480);
        ctx.font = '24px Arial';
        ctx.fillText('Using Demo Preview', 540, 540);
        ctx.fillText('Check API keys & connection', 540, 580);
        if (error instanceof Error) {
          ctx.font = '18px Arial';
          ctx.fillText(error.message.substring(0, 40), 540, 620);
        }

        setGeneratedImage(canvas.toDataURL('image/png'));
      }

      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Panel - Asset Library */}
        <div className="col-span-3 flex flex-col space-y-4 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5" />
                Asset Library
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              <AssetLibrary
                assets={uploadedAssets}
                onUpload={handleAssetUpload}
                brandProfile={brandProfile}
              />
            </CardContent>
          </Card>

          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="w-5 h-5" />
                Style Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              <StyleControls
                selectedTemplate={selectedTemplate}
                onTemplateChange={setSelectedTemplate}
                brandProfile={brandProfile}
              />
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - Design Preview */}
        <div className="col-span-6 flex flex-col min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5" />
                  Design Preview
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1:1 Square</Badge>
                  <Badge variant="outline">1080×1080</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <DesignPreview
                assets={uploadedAssets}
                textElements={textElements}
                template={selectedTemplate}
                generatedImage={generatedImage}
                isGenerating={isGenerating}
                brandProfile={brandProfile}
                onEditImage={onEditImage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Generation & Text Controls */}
        <div className="col-span-3 flex flex-col space-y-4 overflow-hidden">
          {/* AI Generation - Move to top for visibility */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="w-5 h-5" />
                AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              <PromptBuilder
                assets={uploadedAssets}
                textElements={textElements}
                template={selectedTemplate}
                brandProfile={brandProfile}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </CardContent>
          </Card>

          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="w-5 h-5" />
                Text Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto">
              <TextControls
                textElements={textElements}
                onChange={handleTextChange}
                brandProfile={brandProfile}
              />
            </CardContent>
          </Card>

          {generatedImage && (
            <Card className="flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="w-5 h-5" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download HD
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save to Artifacts
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Share className="w-4 h-4 mr-2" />
                    Share Design
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
