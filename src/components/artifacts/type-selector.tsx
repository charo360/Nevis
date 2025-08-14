// src/components/artifacts/type-selector.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Image as ImageIcon, 
  FileText, 
  File,
  Info
} from 'lucide-react';
import { ArtifactUploadType } from '@/lib/types/artifacts';

interface TypeSelectorProps {
  selectedType: ArtifactUploadType;
  onTypeChange: (type: ArtifactUploadType) => void;
  className?: string;
}

const typeOptions = [
  {
    value: 'image' as ArtifactUploadType,
    label: 'Image',
    description: 'Photos, graphics, screenshots, logos',
    icon: ImageIcon,
    examples: 'JPG, PNG, GIF, SVG, WebP'
  },
  {
    value: 'text' as ArtifactUploadType,
    label: 'Text',
    description: 'Text documents, notes, copy',
    icon: FileText,
    examples: 'TXT, MD files'
  },
  {
    value: 'document' as ArtifactUploadType,
    label: 'Document',
    description: 'PDFs, presentations, other documents',
    icon: File,
    examples: 'PDF, DOC, PPT'
  }
];

export function TypeSelector({ selectedType, onTypeChange, className }: TypeSelectorProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Select Content Type</Label>
          </div>
          
          <RadioGroup
            value={selectedType}
            onValueChange={(value) => onTypeChange(value as ArtifactUploadType)}
            className="space-y-3"
          >
            {typeOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: {option.examples}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
