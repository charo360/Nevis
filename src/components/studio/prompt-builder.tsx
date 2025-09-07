// src/components/studio/prompt-builder.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  Eye, 
  Sparkles,
  Zap,
  Settings,
  RefreshCw,
  Copy,
  CheckCircle
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';

interface DesignAsset {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'logo' | 'icon';
}

interface TextElement {
  type: 'headline' | 'subheadline' | 'cta';
  content: string;
}

interface PromptBuilderProps {
  assets: DesignAsset[];
  textElements: TextElement[];
  template: string;
  brandProfile: BrandProfile | null;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function PromptBuilder({ 
  assets, 
  textElements, 
  template, 
  brandProfile, 
  onGenerate, 
  isGenerating 
}: PromptBuilderProps) {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const buildProfessionalPrompt = () => {
    const headline = textElements.find(el => el.type === 'headline')?.content || '';
    const subheadline = textElements.find(el => el.type === 'subheadline')?.content || '';
    const cta = textElements.find(el => el.type === 'cta')?.content || '';

    let prompt = `Create a professional ${template} design for social media (1080x1080px, 1:1 aspect ratio) with the following specifications:\n\n`;

    // Brand Context
    if (brandProfile) {
      prompt += `BRAND CONTEXT:\n`;
      prompt += `- Business: ${brandProfile.businessName}\n`;
      prompt += `- Industry: ${brandProfile.businessType}\n`;
      if (brandProfile.description) {
        prompt += `- Description: ${brandProfile.description}\n`;
      }
      if (brandProfile.targetAudience) {
        prompt += `- Target Audience: ${brandProfile.targetAudience}\n`;
      }
      prompt += `\n`;
    }

    // Visual Style & Colors
    prompt += `VISUAL STYLE:\n`;
    prompt += `- Template: ${template} design aesthetic\n`;
    if (brandProfile?.primaryColor) {
      prompt += `- Primary Color: ${brandProfile.primaryColor}\n`;
    }
    if (brandProfile?.accentColor) {
      prompt += `- Accent Color: ${brandProfile.accentColor}\n`;
    }
    if (brandProfile?.visualStyle) {
      prompt += `- Brand Visual Style: ${brandProfile.visualStyle}\n`;
    }
    prompt += `- Layout: Professional, balanced composition\n`;
    prompt += `- Quality: High-end, premium appearance\n\n`;

    // Text Elements
    if (headline || subheadline || cta) {
      prompt += `TEXT ELEMENTS (overlay on image with high readability):\n`;
      if (headline) {
        prompt += `- HEADLINE: "${headline}" (large, bold, primary typography)\n`;
      }
      if (subheadline) {
        prompt += `- SUBHEADLINE: "${subheadline}" (medium size, supporting text)\n`;
      }
      if (cta) {
        prompt += `- CALL TO ACTION: "${cta}" (button or prominent text)\n`;
      }
      prompt += `\n`;
    }

    // Asset Integration
    if (assets.length > 0 || brandProfile?.logoDataUrl) {
      prompt += `ASSET INTEGRATION:\n`;
      if (brandProfile?.logoDataUrl) {
        prompt += `- Brand logo positioned strategically (top corner or bottom)\n`;
      }
      if (assets.length > 0) {
        prompt += `- ${assets.length} uploaded image${assets.length > 1 ? 's' : ''} integrated as design elements\n`;
        assets.forEach((asset, index) => {
          prompt += `  • ${asset.name} (${asset.type})\n`;
        });
      }
      prompt += `\n`;
    }

    // Professional Requirements
    prompt += `PROFESSIONAL REQUIREMENTS:\n`;
    prompt += `- Ensure all text is clearly readable with proper contrast\n`;
    prompt += `- Use professional typography hierarchy\n`;
    prompt += `- Maintain brand consistency throughout\n`;
    prompt += `- Create visually balanced composition\n`;
    prompt += `- Optimize for social media engagement\n`;
    prompt += `- Ensure high-quality, crisp output\n`;
    
    if (brandProfile?.location) {
      prompt += `- Consider cultural context for ${brandProfile.location}\n`;
    }

    return prompt;
  };

  useEffect(() => {
    const prompt = buildProfessionalPrompt();
    setGeneratedPrompt(prompt);
  }, [assets, textElements, template, brandProfile]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const hasRequiredContent = () => {
    const hasText = textElements.some(el => el.content.trim());
    const hasAssets = assets.length > 0 || brandProfile?.logoDataUrl;
    return hasText || hasAssets;
  };

  return (
    <div className="space-y-4">
      {/* Generation Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || !hasRequiredContent()}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Professional Design
          </>
        )}
      </Button>

      {!hasRequiredContent() && (
        <div className="text-xs text-muted-foreground text-center">
          Add text or upload assets to enable generation
        </div>
      )}

      <Separator />

      {/* Prompt Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">AI Prompt Preview</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrompt(!showPrompt)}
            className="h-7 px-2"
          >
            <Eye className="w-3 h-3 mr-1" />
            {showPrompt ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showPrompt && (
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Professional Prompt
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPrompt}
                    className="h-6 px-2"
                  >
                    {promptCopied ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="text-xs font-mono resize-none min-h-[200px]"
                />
                
                <div className="text-xs text-muted-foreground">
                  <p>This prompt combines your inputs with professional design principles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generation Settings */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-primary/20">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Generation Settings</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>1:1 Aspect Ratio</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>HD Quality</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Brand Integration</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Professional Style</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Quick Generate
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          <RefreshCw className="w-3 h-3 mr-1" />
          Regenerate
        </Button>
      </div>

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Pro Tips:</strong></p>
        <p>• Upload high-quality images for best results</p>
        <p>• Keep text concise and impactful</p>
        <p>• Brand elements are automatically integrated</p>
      </div>
    </div>
  );
}
