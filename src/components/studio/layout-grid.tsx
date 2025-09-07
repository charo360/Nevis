// src/components/studio/layout-grid.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Grid3X3, 
  Ruler, 
  Move, 
  AlignCenter,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  Square,
  Circle,
  Triangle,
  Layout,
  Target,
  Zap
} from 'lucide-react';

interface LayoutGridProps {
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snap: boolean) => void;
  alignmentGuides: boolean;
  onAlignmentGuidesChange: (show: boolean) => void;
}

const GRID_PRESETS = [
  { name: 'Fine', size: 8, description: '8px grid for precise work' },
  { name: 'Medium', size: 16, description: '16px grid for balanced layouts' },
  { name: 'Coarse', size: 32, description: '32px grid for large elements' },
  { name: 'Custom', size: 0, description: 'Custom grid size' }
];

const ALIGNMENT_TOOLS = [
  { name: 'Align Left', icon: AlignLeft, action: 'align-left' },
  { name: 'Align Center', icon: AlignCenter, action: 'align-center' },
  { name: 'Align Right', icon: AlignRight, action: 'align-right' },
  { name: 'Align Top', icon: AlignStartVertical, action: 'align-top' },
  { name: 'Align Middle', icon: AlignCenterVertical, action: 'align-middle' },
  { name: 'Align Bottom', icon: AlignEndVertical, action: 'align-bottom' }
];

const SHAPE_TOOLS = [
  { name: 'Rectangle', icon: Square, action: 'rectangle' },
  { name: 'Circle', icon: Circle, action: 'circle' },
  { name: 'Triangle', icon: Triangle, action: 'triangle' }
];

export function LayoutGrid({ 
  showGrid, 
  onShowGridChange, 
  gridSize, 
  onGridSizeChange, 
  snapToGrid, 
  onSnapToGridChange,
  alignmentGuides,
  onAlignmentGuidesChange
}: LayoutGridProps) {
  const [selectedPreset, setSelectedPreset] = useState(1); // Default to Medium
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePresetChange = (presetIndex: number) => {
    setSelectedPreset(presetIndex);
    if (presetIndex < GRID_PRESETS.length - 1) {
      onGridSizeChange(GRID_PRESETS[presetIndex].size);
    }
  };

  const handleGridSizeChange = (value: number[]) => {
    onGridSizeChange(value[0]);
    setSelectedPreset(GRID_PRESETS.length - 1); // Set to Custom
  };

  const handleAlignmentAction = (action: string) => {
    console.log('Alignment action:', action);
    // This would integrate with the design canvas
  };

  const handleShapeAction = (action: string) => {
    console.log('Shape action:', action);
    // This would add shapes to the design
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid3X3 className="w-5 h-5" />
          Layout & Alignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Grid System</Label>
            <Badge variant={showGrid ? "default" : "secondary"}>
              {showGrid ? "ON" : "OFF"}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={onShowGridChange}
            />
            <Label htmlFor="show-grid" className="text-sm">
              Show Grid
            </Label>
          </div>

          {showGrid && (
            <div className="space-y-3">
              {/* Grid Presets */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Grid Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GRID_PRESETS.slice(0, -1).map((preset, index) => (
                    <Button
                      key={index}
                      variant={selectedPreset === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetChange(index)}
                      className="text-xs justify-start"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Grid Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600">Grid Size</Label>
                  <span className="text-xs text-gray-500">{gridSize}px</span>
                </div>
                <Slider
                  value={[gridSize]}
                  onValueChange={handleGridSizeChange}
                  min={4}
                  max={64}
                  step={2}
                  className="w-full"
                />
              </div>

              {/* Snap to Grid */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="snap-to-grid"
                  checked={snapToGrid}
                  onCheckedChange={onSnapToGridChange}
                />
                <Label htmlFor="snap-to-grid" className="text-sm">
                  Snap to Grid
                </Label>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Alignment Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Alignment Tools</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALIGNMENT_TOOLS.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAlignmentAction(tool.action)}
                  className="h-8"
                  title={tool.name}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>

          {/* Alignment Guides */}
          <div className="flex items-center space-x-2">
            <Switch
              id="alignment-guides"
              checked={alignmentGuides}
              onCheckedChange={onAlignmentGuidesChange}
            />
            <Label htmlFor="alignment-guides" className="text-sm">
              Show Alignment Guides
            </Label>
          </div>
        </div>

        {showAdvanced && (
          <>
            <Separator />

            {/* Shape Tools */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Shape Tools</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHAPE_TOOLS.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleShapeAction(tool.action)}
                      className="h-8"
                      title={tool.name}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Layout Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Layout Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Golden ratio layout')}
                  className="text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Golden Ratio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Rule of thirds')}
                  className="text-xs"
                >
                  <Layout className="w-3 h-3 mr-1" />
                  Rule of Thirds
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Center layout')}
                  className="text-xs"
                >
                  <AlignHorizontalCenter className="w-3 h-3 mr-1" />
                  Center Focus
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Asymmetric layout')}
                  className="text-xs"
                >
                  <Move className="w-3 h-3 mr-1" />
                  Asymmetric
                </Button>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Distribute horizontally')}
                  className="text-xs"
                >
                  <AlignHorizontalCenter className="w-3 h-3 mr-1" />
                  Distribute H
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Distribute vertically')}
                  className="text-xs"
                >
                  <AlignVerticalCenter className="w-3 h-3 mr-1" />
                  Distribute V
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Center all elements')}
                  className="text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Center All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Reset positions')}
                  className="text-xs"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Grid Preview */}
        {showGrid && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <Label className="text-xs text-gray-600 mb-2 block">Grid Preview</Label>
            <div 
              className="w-full h-16 border border-gray-200 rounded"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
