// src/components/studio/professional-studio.tsx
"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatLayout } from './chat-layout';
import { ProfessionalDesignPanel } from './professional-design-panel';
import { 
  MessageSquare, 
  Palette, 
  Sparkles, 
  Zap,
  Crown,
  Settings
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';

interface ProfessionalStudioProps {
  brandProfile: BrandProfile | null;
  onEditImage: (imageUrl: string) => void;
}

export function ProfessionalStudio({ brandProfile, onEditImage }: ProfessionalStudioProps) {
  const [activeMode, setActiveMode] = useState<'simple' | 'professional'>('simple');

  return (
    <div className="h-full flex flex-col">
      {/* Mode Selection Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Palette className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold font-headline">Creative Studio</h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                Professional Edition
              </Badge>
            </div>
            
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'simple' | 'professional')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Simple Mode
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Professional Mode
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Mode Description */}
          <div className="mt-3 text-sm text-muted-foreground">
            {activeMode === 'simple' ? (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick AI-powered design generation with chat interface
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Professional design controls with manual text inputs, asset integration, and advanced prompting
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeMode} className="h-full">
          <TabsContent value="simple" className="h-full m-0 p-0">
            <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="container mx-auto px-4 py-8 h-full">
                <div className="max-w-7xl mx-auto h-full">
                  <ChatLayout
                    brandProfile={brandProfile}
                    onEditImage={onEditImage}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="professional" className="h-full m-0 p-0">
            <div className="h-full bg-gradient-to-br from-purple-50 to-pink-100">
              <div className="container mx-auto px-4 py-8 h-full">
                <div className="max-w-7xl mx-auto h-full">
                  <ProfessionalDesignPanel
                    brandProfile={brandProfile}
                    onEditImage={onEditImage}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
