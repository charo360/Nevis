// src/components/artifacts/active-artifacts-indicator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Power,
  PowerOff,
  ChevronDown,
  ChevronRight,
  Target,
  Lightbulb,
  X,
  Settings,
  FileImage,
  FileText,
  File,
  Camera,
  Palette,
  Layers,
  Archive
} from 'lucide-react';
import { Artifact, ArtifactType } from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';

interface ActiveArtifactsIndicatorProps {
  onArtifactDeactivate?: (artifactId: string) => void;
  onManageArtifacts?: () => void;
  className?: string;
}

export function ActiveArtifactsIndicator({
  onArtifactDeactivate,
  onManageArtifacts,
  className
}: ActiveArtifactsIndicatorProps) {
  const [activeArtifacts, setActiveArtifacts] = useState<Artifact[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadActiveArtifacts();
    
    // Set up interval to refresh active artifacts
    const interval = setInterval(loadActiveArtifacts, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveArtifacts = () => {
    const artifacts = artifactsService.getActiveArtifacts();
    setActiveArtifacts(artifacts);
  };

  const handleDeactivate = async (artifactId: string) => {
    try {
      await artifactsService.deactivateArtifact(artifactId);
      loadActiveArtifacts();
      onArtifactDeactivate?.(artifactId);
    } catch (error) {
      console.error('Failed to deactivate artifact:', error);
    }
  };

  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case 'image': return <FileImage className="h-3 w-3" />;
      case 'screenshot': return <Camera className="h-3 w-3" />;
      case 'document': return <FileText className="h-3 w-3" />;
      case 'logo': return <Palette className="h-3 w-3" />;
      case 'template': return <Layers className="h-3 w-3" />;
      default: return <Archive className="h-3 w-3" />;
    }
  };

  const getUsageTypeIcon = (usageType: string) => {
    return usageType === 'exact-use' ? <Target className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />;
  };

  const exactUseArtifacts = activeArtifacts.filter(a => a.usageType === 'exact-use');
  const referenceArtifacts = activeArtifacts.filter(a => a.usageType === 'reference');

  if (activeArtifacts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PowerOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No active artifacts</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onManageArtifacts}>
              <Settings className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Power className="h-4 w-4 text-green-600" />
                Active Artifacts
                <Badge variant="secondary" className="text-xs">
                  {activeArtifacts.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onManageArtifacts}>
                  <Settings className="h-3 w-3" />
                </Button>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-64">
              <div className="space-y-3">
                {/* Exact Use Artifacts */}
                {exactUseArtifacts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Exact Use ({exactUseArtifacts.length})</span>
                    </div>
                    {exactUseArtifacts.map(artifact => (
                      <div
                        key={artifact.id}
                        className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md"
                      >
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          {artifact.thumbnailPath ? (
                            <img
                              src={artifact.thumbnailPath}
                              alt={artifact.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            getArtifactIcon(artifact.type)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{artifact.name}</p>
                          {artifact.textOverlay?.headline && (
                            <p className="text-xs text-muted-foreground truncate">
                              "{artifact.textOverlay.headline}"
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(artifact.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reference Artifacts */}
                {referenceArtifacts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Reference ({referenceArtifacts.length})</span>
                    </div>
                    {referenceArtifacts.map(artifact => (
                      <div
                        key={artifact.id}
                        className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md"
                      >
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          {artifact.thumbnailPath ? (
                            <img
                              src={artifact.thumbnailPath}
                              alt={artifact.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            getArtifactIcon(artifact.type)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{artifact.name}</p>
                          <p className="text-xs text-muted-foreground">Style reference</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(artifact.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await artifactsService.deactivateAllArtifacts();
                    loadActiveArtifacts();
                  }}
                  className="flex-1 text-xs"
                >
                  <PowerOff className="h-3 w-3 mr-1" />
                  Deactivate All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onManageArtifacts}
                  className="flex-1 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
