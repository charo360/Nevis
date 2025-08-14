// src/components/artifacts/artifact-card.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Copy,
  Tag,
  Calendar,
  FileImage,
  FileText,
  File,
  Camera,
  Palette,
  Layers,
  Archive,
  Power,
  PowerOff,
  MousePointer,
  Type,
  Target,
  Lightbulb
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Artifact, ArtifactType, ArtifactCategory } from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';

interface ArtifactCardProps {
  artifact: Artifact;
  onSelect?: (artifact: Artifact) => void;
  onEdit?: (artifact: Artifact) => void;
  onDelete?: (artifactId: string) => void;
  onView?: (artifact: Artifact) => void;
  onUse?: (artifact: Artifact) => void;
  onActivationToggle?: (artifact: Artifact, isActive: boolean) => void;
  onTextOverlayEdit?: (artifact: Artifact) => void;
  selected?: boolean;
  showUsageStats?: boolean;
  showAdvancedControls?: boolean;
  viewMode?: 'grid' | 'list';
}

export function ArtifactCard({
  artifact,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onUse,
  onActivationToggle,
  onTextOverlayEdit,
  selected = false,
  showUsageStats = true,
  showAdvancedControls = true,
  viewMode = 'grid'
}: ArtifactCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case 'image': return <FileImage className="h-4 w-4" />;
      case 'screenshot': return <Camera className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'logo': return <Palette className="h-4 w-4" />;
      case 'template': return <Layers className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  const getUsageTypeIcon = (usageType: string) => {
    return usageType === 'exact-use' ? <Target className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />;
  };

  const handleActivationToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);

    try {
      const newActiveState = !artifact.isActive;
      await artifactsService.toggleArtifactActivation(artifact.id);
      onActivationToggle?.(artifact, newActiveState);
    } catch (error) {
      console.error('Failed to toggle activation:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleUse = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Activate the artifact if not already active
      if (!artifact.isActive) {
        await artifactsService.activateArtifact(artifact.id, 'quick-content');
      }

      // Navigate to Quick Content
      window.location.href = '/quick-content';

      onUse?.(artifact);
    } catch (error) {
      console.error('Failed to use artifact:', error);
    }
  };

  const handleTextOverlayEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTextOverlayEdit?.(artifact);
  };

  const getCategoryColor = (category: ArtifactCategory) => {
    const colors = {
      'brand-assets': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'product-images': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'screenshots': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'templates': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'references': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'logos': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'backgrounds': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'uncategorized': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };
    return colors[category] || colors.uncategorized;
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on dropdown menu
    if (isMenuOpen) return;

    if (onSelect) {
      onSelect(artifact);
    }
  };

  const handleMenuAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);

    switch (action) {
      case 'view':
        onView?.(artifact);
        break;
      case 'edit':
        onEdit?.(artifact);
        break;
      case 'delete':
        onDelete?.(artifact.id);
        break;
      case 'copy':
        navigator.clipboard.writeText(artifact.filePath);
        break;
      case 'download':
        // In production, implement download functionality
        window.open(artifact.filePath, '_blank');
        break;
    }
  };

  if (viewMode === 'list') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-primary' : ''
          }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              {artifact.thumbnailPath ? (
                <img
                  src={artifact.thumbnailPath}
                  alt={artifact.name}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                getArtifactIcon(artifact.type)
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{artifact.name}</h3>
                  {artifact.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {artifact.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="secondary" className={`text-xs ${getCategoryColor(artifact.category)}`}>
                    {artifact.category}
                  </Badge>

                  <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleMenuAction('view', e)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleMenuAction('edit', e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleMenuAction('copy', e)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Path
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleMenuAction('download', e)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleMenuAction('delete', e)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>{formatFileSize(artifact.metadata.fileSize)}</span>
                {artifact.metadata.dimensions && (
                  <span>{artifact.metadata.dimensions.width}×{artifact.metadata.dimensions.height}</span>
                )}
                <span>{formatDate(artifact.timestamps.created)}</span>
                {showUsageStats && artifact.usage.usageCount > 0 && (
                  <span>Used {artifact.usage.usageCount} times</span>
                )}
              </div>

              {/* Tags */}
              {artifact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {artifact.tags.slice(0, 5).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {artifact.tags.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{artifact.tags.length - 5}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-primary' : ''
        }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Thumbnail/Preview */}
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative group">
            {artifact.thumbnailPath ? (
              <img
                src={artifact.thumbnailPath}
                alt={artifact.name}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {getArtifactIcon(artifact.type)}
                <span className="text-xs capitalize">{artifact.type}</span>
              </div>
            )}

            {/* Status badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {artifact.isActive && (
                <Badge variant="default" className="text-xs bg-green-600">
                  Active
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {getUsageTypeIcon(artifact.usageType)}
                {artifact.usageType === 'exact-use' ? 'Exact' : 'Ref'}
              </Badge>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={(e) => {
                e.stopPropagation();
                onView?.(artifact);
              }}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>

              {showAdvancedControls && artifact.usageType === 'exact-use' && (
                <Button variant="default" size="sm" onClick={handleUse}>
                  <MousePointer className="h-4 w-4 mr-1" />
                  Use
                </Button>
              )}
            </div>
          </div>

          {/* Artifact Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-sm truncate flex-1" title={artifact.name}>
                {artifact.name}
              </h3>

              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleMenuAction('view', e)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleMenuAction('edit', e)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleMenuAction('copy', e)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Path
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleMenuAction('download', e)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => handleMenuAction('delete', e)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Category and Usage */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${getCategoryColor(artifact.category)}`}>
                {artifact.category}
              </Badge>
              {showUsageStats && artifact.usage.usageCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  Used {artifact.usage.usageCount}x
                </Badge>
              )}
            </div>

            {/* File Info */}
            <div className="text-xs text-muted-foreground">
              {formatFileSize(artifact.metadata.fileSize)}
              {artifact.metadata.dimensions && (
                <span> • {artifact.metadata.dimensions.width}×{artifact.metadata.dimensions.height}</span>
              )}
            </div>

            {/* Tags */}
            {artifact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {artifact.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {artifact.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{artifact.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Directives indicator */}
            {artifact.directives.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                <span>{artifact.directives.length} directive{artifact.directives.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Enhanced Controls */}
            {showAdvancedControls && (
              <div className="pt-3 border-t border-border space-y-2">
                {/* Activation Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Activation</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleActivationToggle}
                    disabled={isToggling}
                    className={`h-6 px-2 ${artifact.isActive ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    {isToggling ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : artifact.isActive ? (
                      <Power className="h-3 w-3" />
                    ) : (
                      <PowerOff className="h-3 w-3" />
                    )}
                    <span className="ml-1 text-xs">
                      {artifact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Button>
                </div>

                {/* Text Overlay Controls for Exact Use */}
                {artifact.usageType === 'exact-use' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Text Overlay</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleTextOverlayEdit}
                      className="h-6 px-2"
                    >
                      <Type className="h-3 w-3 mr-1" />
                      <span className="text-xs">
                        {artifact.textOverlay ? 'Edit' : 'Add'}
                      </span>
                    </Button>
                  </div>
                )}

                {/* Text Overlay Preview */}
                {artifact.textOverlay && (artifact.textOverlay.headline || artifact.textOverlay.message) && (
                  <div className="text-xs bg-muted/50 p-2 rounded-md">
                    {artifact.textOverlay.headline && (
                      <p className="font-medium truncate">{artifact.textOverlay.headline}</p>
                    )}
                    {artifact.textOverlay.message && (
                      <p className="text-muted-foreground truncate">{artifact.textOverlay.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
