'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Search,
  Image as ImageIcon,
  FileText,
  Folder,
  Clock,
  Plus,
  Settings,
  Bug,
  Wrench,
  X,
  Grid,
  List
} from 'lucide-react';
import { brandScopedArtifactsService } from '@/lib/services/brand-scoped-artifacts-service';
import { useUnifiedBrand, useBrandChangeListener } from '@/contexts/unified-brand-context';
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from '@/components/layout/unified-brand-layout';
import { UploadZone } from '@/components/artifacts/upload-zone';
import type { Artifact, ArtifactUsageType } from '@/lib/types/artifacts';

function ArtifactsBrandScopedPageContent() {
  const { currentBrand, loading: brandLoading } = useUnifiedBrand();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadZone, setShowUploadZone] = useState<ArtifactUsageType | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadArtifacts = useCallback(() => {
    setIsLoading(true);

    try {
      if (!currentBrand?.id) {
        setArtifacts([]);
        setSelectedArtifacts([]);
        setIsLoading(false);
        return;
      }

      const brandName = currentBrand.businessName || currentBrand.name;

      // The unified brand context already ensures the service is set to the current brand
      // Load all artifacts for this brand
      const brandArtifacts = brandScopedArtifactsService.getAllArtifacts();
      setArtifacts(brandArtifacts);

      // Load selected artifacts for this brand
      const activeArtifacts = brandScopedArtifactsService.getActiveArtifacts();
      const activeIds = activeArtifacts.map(a => a.id);
      setSelectedArtifacts(activeIds);


    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [currentBrand]);

  // Listen for brand changes using the unified system
  useBrandChangeListener(useCallback((brand) => {
    const brandName = brand?.businessName || brand?.name || 'none';

    // The unified brand context already updates the artifacts service
    // We just need to reload the artifacts for the UI
    loadArtifacts();
  }, [loadArtifacts]));

  const toggleArtifactSelection = (artifactId: string) => {
    const isSelected = selectedArtifacts.includes(artifactId);
    const newSelection = isSelected
      ? selectedArtifacts.filter(id => id !== artifactId)
      : [...selectedArtifacts, artifactId];

    setSelectedArtifacts(newSelection);

    // Update the service
    brandScopedArtifactsService.setArtifactActive(artifactId, !isSelected);

  };

  // Debug function to test artifact states
  const debugArtifactStates = () => {
    if (!currentBrand) {
      return;
    }

    const allArtifacts = brandScopedArtifactsService.getAllArtifacts();
    const activeArtifacts = brandScopedArtifactsService.getActiveArtifacts();


    allArtifacts.forEach(a => {
    });

    activeArtifacts.forEach(a => {
    });

  };

  // Fix missing instructions in existing artifacts
  const fixMissingInstructions = () => {
    if (!currentBrand) {
      return;
    }

    // Note: We would need to implement this in the brand-scoped service
    // For now, just reload artifacts
    loadArtifacts();
  };

  // Delete artifact
  const handleDeleteArtifact = (artifactId: string) => {
    if (!currentBrand) {
      return;
    }

    if (confirm('Are you sure you want to delete this artifact?')) {
      // Note: We would need to implement deleteArtifact in the brand-scoped service
      loadArtifacts();
    }
  };

  const getFilteredArtifacts = () => {
    return artifacts.filter(artifact => {
      const matchesSearch = artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.instructions?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || artifact.category === categoryFilter;
      const matchesType = typeFilter === 'all' || artifact.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  };

  const getArtifactsByUsageType = (usageType: 'exact-use' | 'reference') => {
    return getFilteredArtifacts().filter(artifact => artifact.usageType === usageType);
  };

  const getStats = () => {
    const total = artifacts.length;
    const images = artifacts.filter(a => a.type === 'image').length;
    const templates = artifacts.filter(a => a.type === 'template').length;
    const recentlyUsed = artifacts.filter(a =>
      a.usage.lastUsed &&
      Date.now() - new Date(a.usage.lastUsed).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    return { total, images, templates, recentlyUsed };
  };

  const stats = getStats();
  const exactUseArtifacts = getArtifactsByUsageType('exact-use');
  const referenceArtifacts = getArtifactsByUsageType('reference');

  // Use BrandContent component for better UX
  const renderContent = (brand: typeof currentBrand) => {
    if (!brand) return null;

    const brandName = brand.businessName || brand.name;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">Artifacts</h1>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    🔥 Unified Brand System
                  </Badge>
                </div>
                <p className="text-gray-600">
                  Manage artifacts for <strong>{brandName}</strong> -
                  Images, screenshots, and reference materials for AI content generation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={debugArtifactStates}
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  🔍 Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fixMissingInstructions}
                  className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  🔧 Fix Instructions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </Button>
                <Button onClick={() => setShowUploadZone(showUploadZone ? null : 'reference')}>
                  <Upload className="w-4 h-4 mr-2" />
                  {showUploadZone ? 'Hide Upload' : 'Upload Files'}
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="flex items-center p-6">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Artifacts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <ImageIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Images</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.images}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Folder className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Templates</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.templates}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center p-6">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recently Used</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentlyUsed}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search artifacts by name, description, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="brand-assets">Brand Assets</SelectItem>
                        <SelectItem value="product-images">Product Images</SelectItem>
                        <SelectItem value="screenshots">Screenshots</SelectItem>
                        <SelectItem value="templates">Templates</SelectItem>
                        <SelectItem value="references">References</SelectItem>
                        <SelectItem value="logos">Logos</SelectItem>
                        <SelectItem value="backgrounds">Backgrounds</SelectItem>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="screenshot">Screenshots</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="logo">Logos</SelectItem>
                        <SelectItem value="template">Templates</SelectItem>
                        <SelectItem value="reference">References</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exact Use Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>Exact Use Content</span>
                        <Badge variant="secondary">{exactUseArtifacts.length}</Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Content that will be directly used in your posts
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setShowUploadZone('exact-use')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading artifacts...</p>
                    </div>
                  ) : exactUseArtifacts.length > 0 ? (
                    <div className="space-y-4">
                      {exactUseArtifacts.map((artifact) => (
                        <div key={artifact.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{artifact.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{artifact.type}</Badge>
                                {selectedArtifacts.includes(artifact.id) && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    ✓ Selected
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {artifact.textOverlay && (
                            <div className="text-sm text-gray-600 mb-3 space-y-1">
                              {artifact.textOverlay.headline && (
                                <div><strong>Headline:</strong> {artifact.textOverlay.headline}</div>
                              )}
                              {artifact.textOverlay.message && (
                                <div><strong>Message:</strong> {artifact.textOverlay.message}</div>
                              )}
                              {artifact.textOverlay.cta && (
                                <div><strong>CTA:</strong> {artifact.textOverlay.cta}</div>
                              )}
                              {artifact.textOverlay.contact && (
                                <div><strong>Contact:</strong> {artifact.textOverlay.contact}</div>
                              )}
                              {artifact.textOverlay.discount && (
                                <div><strong>Discount:</strong> {artifact.textOverlay.discount}</div>
                              )}
                            </div>
                          )}

                          {artifact.instructions && (
                            <div className="text-sm text-gray-600 mb-3">
                              <strong>Instructions:</strong> {artifact.instructions}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={selectedArtifacts.includes(artifact.id) ? "default" : "outline"}
                              onClick={() => toggleArtifactSelection(artifact.id)}
                            >
                              {selectedArtifacts.includes(artifact.id) ? "Selected" : "Select"}
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteArtifact(artifact.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No exact use content yet</p>
                      <p className="text-sm text-gray-500">Add content that will be directly used in posts</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reference Materials */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>Reference Materials</span>
                        <Badge variant="secondary">{referenceArtifacts.length}</Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Materials for AI training and style inspiration
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setShowUploadZone('reference')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload References
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading references...</p>
                    </div>
                  ) : referenceArtifacts.length > 0 ? (
                    <div className="space-y-4">
                      {referenceArtifacts.map((artifact) => (
                        <div key={artifact.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{artifact.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{artifact.type}</Badge>
                                <Badge variant="outline">{artifact.category}</Badge>
                              </div>
                              {artifact.instructions && (
                                <p className="text-sm text-gray-600 mt-2">{artifact.instructions}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteArtifact(artifact.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No reference materials yet</p>
                      <p className="text-sm text-gray-500">Upload images to help train the AI on your brand style</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Upload Zone Modal */}
        {showUploadZone && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {showUploadZone === 'exact-use' ? 'Add Exact Use Content' : 'Upload Reference Materials'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {showUploadZone === 'exact-use'
                      ? 'Upload images or content that will be used directly in your posts'
                      : 'Upload materials for AI training and style inspiration'
                    }
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadZone(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <UploadZone
                onUploadComplete={(artifactIds) => {
                  loadArtifacts();
                  setShowUploadZone(null);
                }}
                defaultUsageType={showUploadZone}
                maxFiles={5}
                useBrandScopedService={true}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <BrandContent fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Brand Selected</h2>
          <p className="text-gray-600">Please select a brand to view and manage artifacts.</p>
        </div>
      </div>
    }>
      {renderContent}
    </BrandContent>
  );
}

export default function ArtifactsBrandScopedPage() {
  return (
    <UnifiedBrandLayout>
      <ArtifactsBrandScopedPageContent />
      <BrandSwitchingStatus />
    </UnifiedBrandLayout>
  );
}
