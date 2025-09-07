// src/components/studio/typography-controls.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sparkles,
  RefreshCw,
  Target
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';

interface TypographyControlsProps {
  textElement: {
    type: 'headline' | 'subheadline' | 'cta';
    content: string;
    style?: {
      fontSize?: number;
      color?: string;
      fontWeight?: string;
      fontFamily?: string;
      textAlign?: 'left' | 'center' | 'right' | 'justify';
      lineHeight?: number;
      letterSpacing?: number;
    };
  };
  onChange: (style: any) => void;
  brandProfile: BrandProfile | null;
}

// Professional font families
const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter', category: 'Modern' },
  { name: 'Roboto', value: 'Roboto', category: 'Modern' },
  { name: 'Open Sans', value: 'Open Sans', category: 'Modern' },
  { name: 'Lato', value: 'Lato', category: 'Modern' },
  { name: 'Montserrat', value: 'Montserrat', category: 'Modern' },
  { name: 'Poppins', value: 'Poppins', category: 'Modern' },
  { name: 'Playfair Display', value: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', value: 'Merriweather', category: 'Serif' },
  { name: 'Lora', value: 'Lora', category: 'Serif' },
  { name: 'Source Serif Pro', value: 'Source Serif Pro', category: 'Serif' },
  { name: 'Fira Code', value: 'Fira Code', category: 'Monospace' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'Monospace' },
  { name: 'Space Mono', value: 'Space Mono', category: 'Monospace' },
  { name: 'Oswald', value: 'Oswald', category: 'Display' },
  { name: 'Bebas Neue', value: 'Bebas Neue', category: 'Display' },
  { name: 'Anton', value: 'Anton', category: 'Display' }
];

const FONT_WEIGHTS = [
  { name: 'Thin', value: '100' },
  { name: 'Extra Light', value: '200' },
  { name: 'Light', value: '300' },
  { name: 'Regular', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' },
  { name: 'Black', value: '900' }
];

const TEXT_ALIGNMENTS = [
  { name: 'Left', value: 'left', icon: AlignLeft },
  { name: 'Center', value: 'center', icon: AlignCenter },
  { name: 'Right', value: 'right', icon: AlignRight },
  { name: 'Justify', value: 'justify', icon: AlignJustify }
];

// Typography presets for different text types
const TYPOGRAPHY_PRESETS = {
  headline: [
    { name: 'Bold Impact', style: { fontSize: 48, fontWeight: '700', fontFamily: 'Inter', lineHeight: 1.1 } },
    { name: 'Elegant Serif', style: { fontSize: 42, fontWeight: '400', fontFamily: 'Playfair Display', lineHeight: 1.2 } },
    { name: 'Modern Clean', style: { fontSize: 44, fontWeight: '600', fontFamily: 'Roboto', lineHeight: 1.15 } },
    { name: 'Display Bold', style: { fontSize: 52, fontWeight: '800', fontFamily: 'Oswald', lineHeight: 1.0 } }
  ],
  subheadline: [
    { name: 'Readable', style: { fontSize: 24, fontWeight: '400', fontFamily: 'Inter', lineHeight: 1.4 } },
    { name: 'Medium Weight', style: { fontSize: 22, fontWeight: '500', fontFamily: 'Roboto', lineHeight: 1.3 } },
    { name: 'Elegant', style: { fontSize: 26, fontWeight: '300', fontFamily: 'Lora', lineHeight: 1.35 } },
    { name: 'Compact', style: { fontSize: 20, fontWeight: '600', fontFamily: 'Montserrat', lineHeight: 1.25 } }
  ],
  cta: [
    { name: 'Action Button', style: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter', lineHeight: 1.2 } },
    { name: 'Bold Callout', style: { fontSize: 20, fontWeight: '800', fontFamily: 'Roboto', lineHeight: 1.1 } },
    { name: 'Elegant CTA', style: { fontSize: 16, fontWeight: '600', fontFamily: 'Montserrat', lineHeight: 1.3 } },
    { name: 'Impact Text', style: { fontSize: 22, fontWeight: '900', fontFamily: 'Oswald', lineHeight: 1.0 } }
  ]
};

export function TypographyControls({ textElement, onChange, brandProfile }: TypographyControlsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const currentStyle = textElement.style || {};

  const handleStyleChange = (property: string, value: any) => {
    onChange({
      ...currentStyle,
      [property]: value
    });
  };

  const applyPreset = (preset: any) => {
    onChange({
      ...currentStyle,
      ...preset.style
    });
    setActivePreset(preset.name);
  };

  const generateAITypography = async () => {
    // This would integrate with AI to generate brand-appropriate typography
    // For now, we'll apply a random preset
    const presets = TYPOGRAPHY_PRESETS[textElement.type];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    applyPreset(randomPreset);
  };

  const resetToDefaults = () => {
    const defaults = {
      fontSize: textElement.type === 'headline' ? 36 : textElement.type === 'subheadline' ? 20 : 16,
      fontWeight: textElement.type === 'headline' ? '700' : textElement.type === 'subheadline' ? '400' : '600',
      fontFamily: 'Inter',
      textAlign: 'center' as const,
      lineHeight: 1.2,
      letterSpacing: 0
    };
    onChange(defaults);
    setActivePreset(null);
  };

  const presets = TYPOGRAPHY_PRESETS[textElement.type] || [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Type className="w-5 h-5" />
          Typography Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Typography Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={generateAITypography}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generate
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset, index) => (
              <Button
                key={index}
                variant={activePreset === preset.name ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(preset)}
                className="text-xs justify-start"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Family</Label>
          <Select
            value={currentStyle.fontFamily || 'Inter'}
            onValueChange={(value) => handleStyleChange('fontFamily', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Object.entries(
                FONT_FAMILIES.reduce((acc, font) => {
                  if (!acc[font.category]) acc[font.category] = [];
                  acc[font.category].push(font);
                  return acc;
                }, {} as Record<string, typeof FONT_FAMILIES>)
              ).map(([category, fonts]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                    {category}
                  </div>
                  {fonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Font Size</Label>
            <span className="text-xs text-gray-500">{currentStyle.fontSize || 24}px</span>
          </div>
          <Slider
            value={[currentStyle.fontSize || 24]}
            onValueChange={([value]) => handleStyleChange('fontSize', value)}
            min={8}
            max={72}
            step={1}
            className="w-full"
          />
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Weight</Label>
          <Select
            value={currentStyle.fontWeight || '400'}
            onValueChange={(value) => handleStyleChange('fontWeight', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  <span style={{ fontWeight: weight.value }}>{weight.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Text Alignment</Label>
          <div className="grid grid-cols-4 gap-1">
            {TEXT_ALIGNMENTS.map((alignment) => {
              const Icon = alignment.icon;
              return (
                <Button
                  key={alignment.value}
                  variant={currentStyle.textAlign === alignment.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleChange('textAlign', alignment.value)}
                  className="h-8"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Advanced Typography */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Advanced Settings</Label>
          
          {/* Line Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Line Height</Label>
              <span className="text-xs text-gray-500">{currentStyle.lineHeight || 1.2}</span>
            </div>
            <Slider
              value={[currentStyle.lineHeight || 1.2]}
              onValueChange={([value]) => handleStyleChange('lineHeight', value)}
              min={0.8}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Letter Spacing</Label>
              <span className="text-xs text-gray-500">{currentStyle.letterSpacing || 0}px</span>
            </div>
            <Slider
              value={[currentStyle.letterSpacing || 0]}
              onValueChange={([value]) => handleStyleChange('letterSpacing', value)}
              min={-2}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={resetToDefaults}
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const style = {
                fontSize: currentStyle.fontSize || 24,
                fontWeight: currentStyle.fontWeight || '400',
                fontFamily: currentStyle.fontFamily || 'Inter',
                textAlign: currentStyle.textAlign || 'center',
                lineHeight: currentStyle.lineHeight || 1.2,
                letterSpacing: currentStyle.letterSpacing || 0
              };
              console.log('Typography Style:', style);
            }}
            className="flex-1"
          >
            <Target className="w-3 h-3 mr-1" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
