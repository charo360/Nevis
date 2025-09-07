// src/components/studio/style-controls.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Palette, 
  Layout, 
  Sparkles,
  Crown,
  Zap,
  Star
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';

interface StyleControlsProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  brandProfile: BrandProfile | null;
}

const DESIGN_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimalist design with bold typography',
    icon: <Layout className="w-4 h-4" />,
    premium: false
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated layout with refined aesthetics',
    icon: <Crown className="w-4 h-4" />,
    premium: true
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-impact design with vibrant colors',
    icon: <Zap className="w-4 h-4" />,
    premium: false
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate-style layout for business content',
    icon: <Star className="w-4 h-4" />,
    premium: true
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Artistic design with unique layouts',
    icon: <Sparkles className="w-4 h-4" />,
    premium: true
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean design with lots of white space',
    icon: <Layout className="w-4 h-4" />,
    premium: false
  }
];

export function StyleControls({ selectedTemplate, onTemplateChange, brandProfile }: StyleControlsProps) {
  return (
    <div className="space-y-4">
      {/* Brand Colors Preview */}
      {brandProfile && (brandProfile.primaryColor || brandProfile.accentColor) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <Label className="text-sm font-medium">Brand Colors</Label>
          </div>
          <div className="flex gap-2">
            {brandProfile.primaryColor && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: brandProfile.primaryColor }}
                />
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
            )}
            {brandProfile.accentColor && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: brandProfile.accentColor }}
                />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Design Templates */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Design Templates</Label>
        <div className="grid grid-cols-1 gap-2">
          {DESIGN_TEMPLATES.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onTemplateChange(template.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedTemplate === template.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{template.name}</span>
                      {template.premium && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Style Options */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Style Options</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            High Contrast
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Soft Shadows
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Rounded Corners
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Gradient Overlay
          </Button>
        </div>
      </div>

      {/* Brand Integration */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Brand Integration</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Brand colors automatically applied</p>
              <p>✓ Logo positioned optimally</p>
              <p>✓ Typography matches brand style</p>
              {brandProfile?.visualStyle && (
                <p>✓ Visual style: {brandProfile.visualStyle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Selected:</strong> {DESIGN_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
        <p>{DESIGN_TEMPLATES.find(t => t.id === selectedTemplate)?.description}</p>
      </div>
    </div>
  );
}
