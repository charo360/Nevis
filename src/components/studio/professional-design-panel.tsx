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
      // Generate professional design with all inputs
      console.log('Generating professional design with:', {
        assets: uploadedAssets.length,
        textElements: textElements.filter(el => el.content.trim()).length,
        template: selectedTemplate,
        brandProfile: brandProfile?.businessName
      });

      // Simulate professional generation process
      setTimeout(() => {
        setGeneratedImage('https://placehold.co/1080x1080/6366f1/white?text=Professional+Design+Created');
        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      console.error('Professional design generation failed:', error);
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

        {/* Right Panel - Text Controls & Generation */}
        <div className="col-span-3 flex flex-col space-y-4 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="w-5 h-5" />
                Text Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[450px] overflow-y-auto">
              <TextControls
                textElements={textElements}
                onChange={handleTextChange}
                brandProfile={brandProfile}
              />
            </CardContent>
          </Card>

          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="w-5 h-5" />
                AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
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
