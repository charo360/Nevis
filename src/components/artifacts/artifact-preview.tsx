// src/components/artifacts/artifact-preview.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Download,
  Edit,
  MousePointer,
  Power,
  PowerOff,
  Type,
  Target,
  Lightbulb,
  Calendar,
  Hash,
  Tag,
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

interface ArtifactPreviewProps {
  artifact: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
  onUse?: (artifact: Artifact) => void;
  onEdit?: (artifact: Artifact) => void;
  onActivationToggle?: (artifact: Artifact) => void;
}

export function ArtifactPreview({
  artifact,
  isOpen,
  onClose,
  onUse,
  onEdit,
  onActivationToggle
}: ArtifactPreviewProps) {
  if (!artifact) return null;

  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case 'image': return <FileImage className="h-5 w-5" />;
      case 'screenshot': return <Camera className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'logo': return <Palette className="h-5 w-5" />;
      case 'template': return <Layers className="h-5 w-5" />;
      default: return <Archive className="h-5 w-5" />;
    }
  };

  const getUsageTypeIcon = (usageType: string) => {
    return usageType === 'exact-use' ? <Target className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleActivationToggle = async () => {
    try {
      await artifactsService.toggleArtifactActivation(artifact.id);
      onActivationToggle?.(artifact);
    } catch (error) {
      console.error('Failed to toggle activation:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getArtifactIcon(artifact.type)}
            {artifact.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Preview Section */}
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {artifact.thumbnailPath ? (
                <img
                  src={artifact.thumbnailPath}
                  alt={artifact.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  {getArtifactIcon(artifact.type)}
                  <span className="text-lg capitalize">{artifact.type}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(artifact)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {artifact.usageType === 'exact-use' && (
                <Button size="sm" onClick={() => onUse?.(artifact)}>
                  <MousePointer className="h-4 w-4 mr-2" />
                  Use in Content
                </Button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6">
              {/* Status and Type */}
              <div className="space-y-3">
                <h3 className="font-medium">Status & Type</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={artifact.isActive ? "default" : "secondary"} className="flex items-center gap-1">
                    {artifact.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                    {artifact.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getUsageTypeIcon(artifact.usageType)}
                    {artifact.usageType === 'exact-use' ? 'Exact Use' : 'Reference'}
                  </Badge>
                  <Badge variant="secondary">
                    {artifact.category}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleActivationToggle}
                  className="w-full justify-start"
                >
                  {artifact.isActive ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                  {artifact.isActive ? 'Deactivate' : 'Activate'} Artifact
                </Button>
              </div>

              {/* Text Overlay */}
              {artifact.textOverlay && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text Overlay
                  </h3>
                  <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                    {artifact.textOverlay.headline && (
                      <div>
                        <p className="text-xs text-muted-foreground">Headline</p>
                        <p className="font-medium">{artifact.textOverlay.headline}</p>
                      </div>
                    )}
                    {artifact.textOverlay.message && (
                      <div>
                        <p className="text-xs text-muted-foreground">Message</p>
                        <p>{artifact.textOverlay.message}</p>
                      </div>
                    )}
                    {artifact.textOverlay.cta && (
                      <div>
                        <p className="text-xs text-muted-foreground">Call to Action</p>
                        <p>{artifact.textOverlay.cta}</p>
                      </div>
                    )}
                    {artifact.textOverlay.contact && (
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p>{artifact.textOverlay.contact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* File Information */}
              <div className="space-y-3">
                <h3 className="font-medium">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatFileSize(artifact.metadata.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{artifact.metadata.mimeType}</span>
                  </div>
                  {artifact.metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span>{artifact.metadata.dimensions.width} × {artifact.metadata.dimensions.height}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Usage Statistics
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Times Used:</span>
                    <span>{artifact.usage.usageCount}</span>
                  </div>
                  {artifact.usage.lastUsed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span>{formatDate(artifact.usage.lastUsed)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timestamps
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(artifact.timestamps.created)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span>{formatDate(artifact.timestamps.uploaded)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modified:</span>
                    <span>{formatDate(artifact.timestamps.modified)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {artifact.tags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {artifact.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
