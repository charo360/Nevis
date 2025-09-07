// src/components/studio/text-controls.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Wand2, 
  RefreshCw,
  Sparkles,
  Target,
  MessageSquare,
  Zap
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';

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

interface TextControlsProps {
  textElements: TextElement[];
  onChange: (type: TextElement['type'], content: string) => void;
  brandProfile: BrandProfile | null;
}

export function TextControls({ textElements, onChange, brandProfile }: TextControlsProps) {
  const [isGeneratingText, setIsGeneratingText] = useState<string | null>(null);

  const getTextElement = (type: TextElement['type']) => {
    return textElements.find(element => element.type === type);
  };

  const generateAIText = async (type: TextElement['type']) => {
    setIsGeneratingText(type);
    
    try {
      // Simulate AI text generation based on brand profile
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let generatedText = '';
      
      switch (type) {
        case 'headline':
          generatedText = brandProfile?.businessName 
            ? `${brandProfile.businessName}: Premium Quality`
            : 'Your Brand: Premium Quality';
          break;
        case 'subheadline':
          generatedText = brandProfile?.description 
            ? `${brandProfile.description.slice(0, 50)}...`
            : 'Experience excellence with our premium products and services';
          break;
        case 'cta':
          generatedText = 'Shop Now';
          break;
      }
      
      onChange(type, generatedText);
    } catch (error) {
      console.error('AI text generation failed:', error);
    } finally {
      setIsGeneratingText(null);
    }
  };

  const getCharacterLimit = (type: TextElement['type']) => {
    switch (type) {
      case 'headline': return 60;
      case 'subheadline': return 120;
      case 'cta': return 20;
      default: return 100;
    }
  };

  const getPlaceholder = (type: TextElement['type']) => {
    switch (type) {
      case 'headline': return 'Enter your main headline...';
      case 'subheadline': return 'Add supporting text or description...';
      case 'cta': return 'Call to action...';
      default: return 'Enter text...';
    }
  };

  const getIcon = (type: TextElement['type']) => {
    switch (type) {
      case 'headline': return <Type className="w-4 h-4" />;
      case 'subheadline': return <MessageSquare className="w-4 h-4" />;
      case 'cta': return <Target className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  const getTitle = (type: TextElement['type']) => {
    switch (type) {
      case 'headline': return 'Headline';
      case 'subheadline': return 'Subheadline';
      case 'cta': return 'Call to Action';
      default: return 'Text';
    }
  };

  return (
    <div className="space-y-4">
      {/* Text Elements */}
      {textElements.map((element) => {
        const currentLength = element.content.length;
        const maxLength = getCharacterLimit(element.type);
        const isOverLimit = currentLength > maxLength;
        
        return (
          <Card key={element.type} className={isOverLimit ? 'border-destructive' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(element.type)}
                  <Label className="font-medium">
                    {getTitle(element.type)}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateAIText(element.type)}
                  disabled={isGeneratingText === element.type}
                  className="h-7 px-2"
                >
                  {isGeneratingText === element.type ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {element.type === 'subheadline' ? (
                <Textarea
                  value={element.content}
                  onChange={(e) => onChange(element.type, e.target.value)}
                  placeholder={getPlaceholder(element.type)}
                  className="min-h-[80px] resize-none"
                  maxLength={maxLength}
                />
              ) : (
                <Input
                  value={element.content}
                  onChange={(e) => onChange(element.type, e.target.value)}
                  placeholder={getPlaceholder(element.type)}
                  maxLength={maxLength}
                />
              )}

              <div className="flex items-center justify-between text-xs">
                <Badge 
                  variant={isOverLimit ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {currentLength}/{maxLength}
                </Badge>
                {element.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(element.type, '')}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Separator />

      {/* AI Text Generation Options */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI Text Assistant</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  generateAIText('headline');
                  generateAIText('subheadline');
                  generateAIText('cta');
                }}
                disabled={isGeneratingText !== null}
                className="text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Generate All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('headline', '');
                  onChange('subheadline', '');
                  onChange('cta', '');
                }}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>💡 AI will use your brand profile to generate relevant text</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Best Practices:</strong></p>
        <p>• <strong>Headlines:</strong> Clear, attention-grabbing (max 60 chars)</p>
        <p>• <strong>Subheadlines:</strong> Supporting details (max 120 chars)</p>
        <p>• <strong>CTAs:</strong> Action-oriented, concise (max 20 chars)</p>
      </div>
    </div>
  );
}
