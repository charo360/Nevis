// src/components/artifacts/usage-category-selector.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Eye, 
  MousePointer,
  Lightbulb,
  Target,
  AlertCircle
} from 'lucide-react';
import { ArtifactUsageType } from '@/lib/types/artifacts';

interface UsageCategorySelectorProps {
  selectedUsage: ArtifactUsageType;
  onUsageChange: (usage: ArtifactUsageType) => void;
  className?: string;
}

const usageOptions = [
  {
    value: 'reference' as ArtifactUsageType,
    label: 'Reference',
    description: 'For AI training and style inspiration',
    icon: Lightbulb,
    examples: 'Previous posts, design examples, style guides',
    color: 'text-blue-600'
  },
  {
    value: 'exact-use' as ArtifactUsageType,
    label: 'Exact Use',
    description: 'For direct incorporation into content',
    icon: Target,
    examples: 'Product photos, logos, specific images to include',
    color: 'text-green-600'
  }
];

export function UsageCategorySelector({ 
  selectedUsage, 
  onUsageChange, 
  className 
}: UsageCategorySelectorProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MousePointer className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">How will this be used?</Label>
          </div>
          
          <RadioGroup
            value={selectedUsage}
            onValueChange={(value) => onUsageChange(value as ArtifactUsageType)}
            className="space-y-3"
          >
            {usageOptions.map((option) => {
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
                      <IconComponent className={`h-4 w-4 ${option.color}`} />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Examples: {option.examples}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>

          {selectedUsage === 'exact-use' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Exact Use Selected</p>
                  <p className="text-amber-700">
                    You'll be able to add text overlays and use the "Use" button to directly 
                    integrate this content into your posts.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
