'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Palette, RotateCcw } from 'lucide-react';
import { useDesignColors } from '@/contexts/design-color-context';

export function DesignColorPicker() {
  const { designColors, updateDesignColors, resetDesignColors } = useDesignColors();

  const handleColorChange = (colorType: 'primaryColor' | 'accentColor' | 'backgroundColor', value: string) => {
    updateDesignColors({ [colorType]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Palette className="h-4 w-4" />
          Design Colors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primary-color" className="text-xs font-medium">
            Primary Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="primary-color"
              type="color"
              value={designColors.primaryColor}
              onChange={(e) => handleColorChange('primaryColor', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {designColors.primaryColor}
            </span>
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <Label htmlFor="accent-color" className="text-xs font-medium">
            Accent Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="accent-color"
              type="color"
              value={designColors.accentColor}
              onChange={(e) => handleColorChange('accentColor', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {designColors.accentColor}
            </span>
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="background-color" className="text-xs font-medium">
            Background Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              id="background-color"
              type="color"
              value={designColors.backgroundColor}
              onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
              className="w-8 h-8 rounded border border-input cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {designColors.backgroundColor}
            </span>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetDesignColors}
          className="w-full"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset to Brand Colors
        </Button>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground">
          These colors only affect generated designs, not the platform interface.
        </p>
      </CardContent>
    </Card>
  );
}
