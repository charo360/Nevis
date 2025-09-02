// src/components/artifacts/artifact-selector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  X, 
  Archive,
  Image as ImageIcon,
  FileText,
  Camera,
  Palette,
  Layers,
  Plus,
  Check
} from 'lucide-react';
import { 
  Artifact, 
  ArtifactCategory, 
  ArtifactType, 
  ArtifactSearchFilters 
} from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';

interface ArtifactSelectorProps {
  selectedArtifacts?: string[];
  onSelectionChange?: (artifactIds: string[]) => void;
  maxSelection?: number;
  allowedTypes?: ArtifactType[];
  allowedCategories?: ArtifactCategory[];
  title?: string;
  description?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export function ArtifactSelector({
  selectedArtifacts = [],
  onSelectionChange,
  maxSelection = 5,
  allowedTypes,
  allowedCategories,
  title = "Select Artifacts",
  description = "Choose artifacts to reference in your content generation",
  showUploadButton = true,
  onUploadClick
}: ArtifactSelectorProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArtifactCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load artifacts on component mount
  useEffect(() => {
    loadArtifacts();
  }, []);

  // Filter artifacts when search or filters change
  useEffect(() => {
    filterArtifacts();
  }, [artifacts, searchText, selectedCategory, allowedTypes, allowedCategories]);

  const loadArtifacts = () => {
    setIsLoading(true);
    try {
      const allArtifacts = artifactsService.getAllArtifacts();
      setArtifacts(allArtifacts);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const filterArtifacts = () => {
    let filtered = artifacts;

    // Apply type filter
    if (allowedTypes?.length) {
      filtered = filtered.filter(a => allowedTypes.includes(a.type));
    }

    // Apply category filter
    if (allowedCategories?.length) {
      filtered = filtered.filter(a => allowedCategories.includes(a.category));
    }

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower) ||
        a.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply category dropdown filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    setFilteredArtifacts(filtered);
  };

  const handleArtifactToggle = (artifactId: string) => {
    let newSelection: string[];
    
    if (selectedArtifacts.includes(artifactId)) {
      // Remove from selection
      newSelection = selectedArtifacts.filter(id => id !== artifactId);
    } else {
      // Add to selection (respect max limit)
      if (selectedArtifacts.length >= maxSelection) {
        // Replace the first selected item
        newSelection = [...selectedArtifacts.slice(1), artifactId];
      } else {
        newSelection = [...selectedArtifacts, artifactId];
      }
    }

    onSelectionChange?.(newSelection);
  };

  const clearSelection = () => {
    onSelectionChange?.([]);
  };

  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'screenshot': return <Camera className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'logo': return <Palette className="h-4 w-4" />;
      case 'template': return <Layers className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
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

  const categories: { value: ArtifactCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'brand-assets', label: 'Brand Assets' },
    { value: 'product-images', label: 'Product Images' },
    { value: 'screenshots', label: 'Screenshots' },
    { value: 'templates', label: 'Templates' },
    { value: 'references', label: 'References' },
    { value: 'logos', label: 'Logos' },
    { value: 'backgrounds', label: 'Backgrounds' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {showUploadButton && (
            <Button variant="outline" size="sm" onClick={onUploadClick}>
              <Plus className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        {selectedArtifacts.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedArtifacts.length} of {maxSelection} artifacts selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search artifacts..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ArtifactCategory | 'all')}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Artifacts List */}
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading artifacts...</div>
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Archive className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {artifacts.length === 0 ? 'No artifacts available' : 'No artifacts match your filters'}
              </p>
              {artifacts.length === 0 && showUploadButton && (
                <Button variant="link" size="sm" onClick={onUploadClick} className="mt-2">
                  Upload your first artifact
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArtifacts.map(artifact => {
                const isSelected = selectedArtifacts.includes(artifact.id);
                
                return (
                  <div
                    key={artifact.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleArtifactToggle(artifact.id)}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{artifact.name}</h4>
                        <Badge variant="secondary" className={`text-xs ${getCategoryColor(artifact.category)}`}>
                          {artifact.category}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(artifact.metadata.fileSize)}
                        {artifact.metadata.dimensions && (
                          <span> • {artifact.metadata.dimensions.width}×{artifact.metadata.dimensions.height}</span>
                        )}
                      </div>
                      
                      {artifact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {artifact.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {artifact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{artifact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : 'border-muted-foreground'
                    }`}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
