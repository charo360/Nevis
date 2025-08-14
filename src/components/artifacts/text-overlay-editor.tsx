// src/components/artifacts/text-overlay-editor.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Type, 
  MessageSquare, 
  MousePointer, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { ArtifactTextOverlay } from '@/lib/types/artifacts';

interface TextOverlayEditorProps {
  textOverlay: ArtifactTextOverlay;
  onTextOverlayChange: (textOverlay: ArtifactTextOverlay) => void;
  required?: boolean;
  className?: string;
}

export function TextOverlayEditor({ 
  textOverlay, 
  onTextOverlayChange, 
  required = false,
  className 
}: TextOverlayEditorProps) {
  const updateField = (field: keyof ArtifactTextOverlay, value: string) => {
    onTextOverlayChange({
      ...textOverlay,
      [field]: value || undefined
    });
  };

  const isValid = required ? !!(textOverlay.headline && textOverlay.message) : true;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Type className="h-4 w-4" />
          Text Overlay Configuration
        </CardTitle>
        {required && (
          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Required for Exact Use</p>
              <p className="text-blue-700">
                Headline and Message are required when using artifacts for exact integration.
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline" className="flex items-center gap-2">
            <Type className="h-3 w-3" />
            Headline {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="headline"
            placeholder="Main headline text"
            value={textOverlay.headline || ''}
            onChange={(e) => updateField('headline', e.target.value)}
            className={required && !textOverlay.headline ? 'border-red-300' : ''}
          />
          <p className="text-xs text-muted-foreground">
            The main attention-grabbing text for your content
          </p>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="flex items-center gap-2">
            <MessageSquare className="h-3 w-3" />
            Concise Message {required && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="message"
            placeholder="Brief, compelling message"
            value={textOverlay.message || ''}
            onChange={(e) => updateField('message', e.target.value)}
            rows={2}
            className={required && !textOverlay.message ? 'border-red-300' : ''}
          />
          <p className="text-xs text-muted-foreground">
            A short, clear message that supports your headline
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label htmlFor="cta" className="flex items-center gap-2">
            <MousePointer className="h-3 w-3" />
            Call to Action <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="cta"
            placeholder="e.g., Shop Now, Learn More, Get Started"
            value={textOverlay.cta || ''}
            onChange={(e) => updateField('cta', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Action you want viewers to take
          </p>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <Label htmlFor="contact" className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            Contact Information <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="contact"
            placeholder="Phone, email, or website"
            value={textOverlay.contact || ''}
            onChange={(e) => updateField('contact', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            How customers can reach you
          </p>
        </div>

        {/* Validation Status */}
        {required && (
          <div className={`text-xs p-2 rounded-md ${
            isValid 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {isValid 
              ? '✓ All required fields completed' 
              : '⚠ Please fill in Headline and Message fields'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
