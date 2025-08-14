// src/app/artifacts/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Archive,
  Image as ImageIcon,
  FileText,
  Palette,
  Camera,
  Layers,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  X
} from 'lucide-react';
import {
  Artifact,
  ArtifactCategory,
  ArtifactType,
  ArtifactSearchFilters
} from '@/lib/types/artifacts';
import { artifactsService } from '@/lib/services/artifacts-service';
import { UploadZone } from '@/components/artifacts/upload-zone';
import { ArtifactCard } from '@/components/artifacts/artifact-card';
import { ThumbnailImage } from '@/components/artifacts/thumbnail-image';
// TODO: Re-enable enhanced folder components once they're properly set up
// import { FolderManager } from '@/components/artifacts/folder-manager';
// import { FolderView } from '@/components/artifacts/folder-view';

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArtifactCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ArtifactType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]);

  // Load selected artifacts from localStorage and sync with active artifacts on component mount
  useEffect(() => {
    try {
      // First, get active artifacts from the service
      const activeArtifacts = artifactsService.getActiveArtifacts();
      const activeIds = activeArtifacts.map(a => a.id);

      // Try to load from localStorage
      const saved = localStorage.getItem('selectedArtifacts');
      if (saved) {
        const parsedSelected = JSON.parse(saved);

        // Use the union of localStorage and active artifacts
        const combinedSelection = [...new Set([...parsedSelected, ...activeIds])];
        setSelectedArtifacts(combinedSelection);

        // Ensure all selected artifacts are marked as active
        for (const id of combinedSelection) {
          artifactsService.setArtifactActive(id, true);
        }
      } else {
        // No localStorage data, just use active artifacts
        setSelectedArtifacts(activeIds);
      }
    } catch (error) {
      console.warn('Failed to load selected artifacts:', error);
    }
  }, []);

  // Save selected artifacts to localStorage whenever selection changes
  useEffect(() => {
    try {
      localStorage.setItem('selectedArtifacts', JSON.stringify(selectedArtifacts));
    } catch (error) {
      console.warn('Failed to save selected artifacts:', error);
    }
  }, [selectedArtifacts]);

  // New folder management state
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'all' | 'reference' | 'exact-use' | 'folders'>('all');
  const [showUploadZone, setShowUploadZone] = useState<'exact-use' | 'reference' | null>(null);
  const [showTextCreator, setShowTextCreator] = useState<'exact-use' | null>(null);
  const [textFormData, setTextFormData] = useState({
    name: '',
    headline: '',
    message: '',
    contact: '',
    cta: '',
    discount: '',
    instructions: ''
  });
  const [imageFormData, setImageFormData] = useState({
    name: '',
    files: [] as File[],
    instructions: ''
  });

  // Load artifacts on component mount
  useEffect(() => {
    loadArtifacts();
  }, []);

  // Filter artifacts when search or filters change
  useEffect(() => {
    filterArtifacts();
  }, [artifacts, searchText, selectedCategory, selectedType, currentView]);

  const loadArtifacts = () => {
    const allArtifacts = artifactsService.getAllArtifacts();
    setArtifacts(allArtifacts);

    // Sync selected artifacts with active artifacts
    const activeArtifacts = artifactsService.getActiveArtifacts();
    const activeIds = activeArtifacts.map(a => a.id);

    // Update selected artifacts to match active artifacts
    setSelectedArtifacts(activeIds);
  };

  const filterArtifacts = () => {
    const filters: ArtifactSearchFilters = {
      searchText: searchText || undefined,
      categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
      types: selectedType !== 'all' ? [selectedType] : undefined
    };

    let result = artifactsService.searchArtifacts(filters);

    // Apply usage type filter based on current view
    if (currentView === 'reference') {
      result.artifacts = result.artifacts.filter(artifact => artifact.usageType === 'reference');
    } else if (currentView === 'exact-use') {
      result.artifacts = result.artifacts.filter(artifact => artifact.usageType === 'exact-use');
    }

    setFilteredArtifacts(result.artifacts);
  };



  const handleDeleteArtifact = async (artifactId: string) => {
    try {
      await artifactsService.deleteArtifact(artifactId);
      loadArtifacts();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Debug function to test artifact states
  const debugArtifactStates = () => {
    console.log('🔍 === ARTIFACT DEBUG TEST ===');
    const allArtifacts = artifactsService.getAllArtifacts();
    const activeArtifacts = artifactsService.getActiveArtifacts();

    console.log(`📊 Total artifacts: ${allArtifacts.length}`);
    console.log(`✅ Active artifacts: ${activeArtifacts.length}`);
    console.log(`🎯 Selected in UI: ${selectedArtifacts.length}`);

    console.log('📋 All artifacts details:');
    allArtifacts.forEach(a => {
      console.log(`  - ${a.name}: isActive=${a.isActive}, usageType=${a.usageType}, instructions="${a.instructions}"`);
    });

    console.log('✅ Active artifacts details:');
    activeArtifacts.forEach(a => {
      console.log(`  - ${a.name}: instructions="${a.instructions}"`);
    });

    console.log('🎯 Selected artifacts in UI:', selectedArtifacts);
    console.log('🔍 === END DEBUG TEST ===');
  };

  // Fix missing instructions in existing artifacts
  const fixMissingInstructions = () => {
    artifactsService.fixMissingInstructions();
    loadArtifacts(); // Reload to see the changes
  };

  const toggleArtifactSelection = async (artifactId: string) => {
    const isCurrentlySelected = selectedArtifacts.includes(artifactId);

    console.log(`🎯 toggleArtifactSelection called: ${artifactId}, currently selected: ${isCurrentlySelected}`);

    try {
      if (isCurrentlySelected) {
        // Deselect: remove from selection and set isActive to false
        console.log(`❌ Deselecting artifact: ${artifactId}`);
        setSelectedArtifacts(prev => prev.filter(id => id !== artifactId));
        await artifactsService.setArtifactActive(artifactId, false);
      } else {
        // Select: add to selection and set isActive to true
        console.log(`✅ Selecting artifact: ${artifactId}`);
        setSelectedArtifacts(prev => [...prev, artifactId]);
        await artifactsService.setArtifactActive(artifactId, true);
      }
      console.log(`🎯 Selection toggle completed for: ${artifactId}`);
    } catch (error) {
      console.error('Failed to toggle artifact selection:', error);
    }
  };

  const handleCreateTextArtifact = async () => {
    if (!textFormData.headline.trim() || !textFormData.message.trim()) {
      alert('Please fill in the required fields: Headline and Message');
      return;
    }

    try {
      // Create a text artifact with structured content
      const textContent = {
        headline: textFormData.headline.trim(),
        message: textFormData.message.trim(),
        contact: textFormData.contact.trim(),
        cta: textFormData.cta.trim(),
        discount: textFormData.discount.trim(),
        instructions: textFormData.instructions.trim()
      };

      const artifactName = textFormData.name.trim() ||
        (textFormData.headline.length > 30
          ? `${textFormData.headline.substring(0, 30)}...`
          : textFormData.headline) ||
        'Text Content';

      const artifact = await artifactsService.createTextArtifact({
        name: artifactName,
        content: JSON.stringify(textContent),
        usageType: 'exact-use',
        category: 'text'
      });

      // Reset form and close modal
      setTextFormData({
        name: '',
        headline: '',
        message: '',
        contact: '',
        cta: '',
        discount: '',
        instructions: ''
      });
      setShowTextCreator(null);
      loadArtifacts();

      console.log('Text artifact created:', artifact);
    } catch (error) {
      console.error('Failed to create text artifact:', error);
      alert('Failed to create text content. Please try again.');
    }
  };

  const categories: { value: ArtifactCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'brand-assets', label: 'Brand Assets' },
    { value: 'product-images', label: 'Product Images' },
    { value: 'screenshots', label: 'Screenshots' },
    { value: 'templates', label: 'Templates' },
    { value: 'references', label: 'References' },
    { value: 'logos', label: 'Logos' },
    { value: 'backgrounds', label: 'Backgrounds' },
    { value: 'uncategorized', label: 'Uncategorized' }
  ];

  const types: { value: ArtifactType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'screenshot', label: 'Screenshots' },
    { value: 'document', label: 'Documents' },
    { value: 'logo', label: 'Logos' },
    { value: 'template', label: 'Templates' },
    { value: 'reference', label: 'References' }
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artifacts</h1>
          <p className="text-muted-foreground">
            Manage your images, screenshots, and reference materials for AI content generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={debugArtifactStates}
            className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
          >
            🔍 Debug
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fixMissingInstructions}
            className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
          >
            🔧 Fix Instructions
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => setShowUploadZone(showUploadZone ? null : 'reference')}
            variant={showUploadZone ? "secondary" : "default"}
          >
            <Upload className="h-4 w-4 mr-2" />
            {showUploadZone ? 'Hide Upload' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Old Upload Zone - Temporarily Hidden */}
      {/* This old upload zone is replaced by the new modal-based system */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Artifacts</p>
                <p className="text-2xl font-bold">{artifacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Images</p>
                <p className="text-2xl font-bold">
                  {artifacts.filter(a => a.type === 'image' || a.type === 'screenshot').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Templates</p>
                <p className="text-2xl font-bold">
                  {artifacts.filter(a => a.type === 'template').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Recently Used</p>
                <p className="text-2xl font-bold">
                  {artifacts.filter(a => a.usage.lastUsed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artifacts by name, description, or tags..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ArtifactCategory | 'all')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ArtifactType | 'all')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {searchText || selectedCategory !== 'all' || selectedType !== 'all' ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredArtifacts.length} of {artifacts.length} artifacts
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchText('');
              setSelectedCategory('all');
              setSelectedType('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : null}

      {/* Two-Column Layout: Exact Use (Left) | Reference (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: EXACT USE */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Exact Use Content
                    <Badge variant="secondary">
                      {artifacts.filter(a => a.usageType === 'exact-use').length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Content that will be directly used in your posts
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Content
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowUploadZone('exact-use')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Exact Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowTextCreator('exact-use')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Text to Appear on Design
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {artifacts.filter(a => a.usageType === 'exact-use').map(artifact => (
                  <div key={artifact.id} className="relative">
                    <div className={`border rounded-lg p-4 transition-all ${selectedArtifacts.includes(artifact.id)
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{artifact.name}</h4>
                            <Badge variant={artifact.type === 'text' ? 'secondary' : 'default'}>
                              {artifact.type === 'text' ? 'Text' : 'Image'}
                            </Badge>
                            {selectedArtifacts.includes(artifact.id) && (
                              <Badge variant="default" className="bg-green-500">
                                ✓ Selected
                              </Badge>
                            )}
                          </div>

                          {/* Text Content Preview */}
                          {artifact.type === 'text' && artifact.textOverlay && (
                            <div className="bg-white p-3 rounded border text-sm space-y-2">
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
                              {artifact.textOverlay.instructions && (
                                <div><strong>Instructions:</strong> {artifact.textOverlay.instructions}</div>
                              )}
                            </div>
                          )}

                          {/* Image Preview */}
                          {artifact.type !== 'text' && (
                            <div className="mt-2">
                              <ThumbnailImage
                                artifactId={artifact.id}
                                alt={artifact.name}
                                className="w-20 h-20 object-cover rounded border"
                              />
                            </div>
                          )}

                          {/* Usage Instructions */}
                          {artifact.instructions && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border text-sm">
                              <strong>Instructions:</strong> {artifact.instructions}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant={selectedArtifacts.includes(artifact.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleArtifactSelection(artifact.id)}
                          >
                            {selectedArtifacts.includes(artifact.id) ? 'Selected' : 'Select'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArtifact(artifact.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {artifacts.filter(a => a.usageType === 'exact-use').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No exact-use content yet</p>
                    <p className="text-sm">Add images, text, or other content to use directly in posts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: REFERENCE */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Reference Materials
                    <Badge variant="secondary">
                      {artifacts.filter(a => a.usageType === 'reference').length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Materials for AI training and style inspiration
                  </CardDescription>
                </div>
                <Button onClick={() => setShowUploadZone('reference')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload References
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {artifacts.filter(a => a.usageType === 'reference').map(artifact => (
                  <div key={artifact.id} className="relative">
                    <div className={`border rounded-lg p-4 transition-all ${selectedArtifacts.includes(artifact.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{artifact.name}</h4>
                            <Badge variant="outline">Reference</Badge>
                            {selectedArtifacts.includes(artifact.id) && (
                              <Badge variant="default" className="bg-blue-500">
                                ✓ Selected
                              </Badge>
                            )}
                          </div>

                          {/* Image Preview */}
                          <div className="mt-2">
                            <ThumbnailImage
                              artifactId={artifact.id}
                              alt={artifact.name}
                              className="w-20 h-20 object-cover rounded border"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant={selectedArtifacts.includes(artifact.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleArtifactSelection(artifact.id)}
                          >
                            {selectedArtifacts.includes(artifact.id) ? 'Selected' : 'Select'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArtifact(artifact.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {artifacts.filter(a => a.usageType === 'reference').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reference materials yet</p>
                    <p className="text-sm">Upload images to help train the AI on your brand style</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>







      {/* Upload Zone Modal */}
      {showUploadZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {showUploadZone === 'exact-use' ? 'Exact Image' : 'Upload Reference Materials'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {showUploadZone === 'exact-use'
                    ? 'Upload images or screenshots that will be used directly in your posts'
                    : 'Upload materials for AI training and style inspiration'
                  }
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowUploadZone(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Name Field for Exact Use */}
            {showUploadZone === 'exact-use' && (
              <div className="mb-4 space-y-4">
                <div>
                  <Label htmlFor="image-name">Image Name (Optional)</Label>
                  <Input
                    id="image-name"
                    placeholder="e.g., Product Photo, Logo, Summer Sale Banner"
                    value={imageFormData.name}
                    onChange={(e) => setImageFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use the original filename
                  </p>
                </div>

                <div>
                  <Label htmlFor="image-instructions">Usage Instructions (Optional)</Label>
                  <textarea
                    id="image-instructions"
                    placeholder="e.g., put this in a phone, this jacket be on this, place this logo in the top right corner"
                    value={imageFormData.instructions}
                    onChange={(e) => setImageFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm min-h-[80px] resize-y"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide specific instructions on how this image should be used in designs
                  </p>
                </div>
              </div>
            )}

            <UploadZone
              onUploadComplete={(artifacts) => {
                console.log('Uploaded artifacts:', artifacts);
                // Reset image form data
                setImageFormData({ name: '', files: [], instructions: '' });
                loadArtifacts();
                setShowUploadZone(null);
              }}
              defaultUsageType={showUploadZone}
              customName={showUploadZone === 'exact-use' ? imageFormData.name : undefined}
              instructions={showUploadZone === 'exact-use' ? imageFormData.instructions : undefined}
              maxFiles={5}
            />
          </div>
        </div>
      )}

      {/* Text Creator Modal */}
      {showTextCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Text to Appear on Design</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create structured text content that will appear directly on your designs
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowTextCreator(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="text-name">Content Name</Label>
                <Input
                  id="text-name"
                  placeholder="e.g., Holiday Sale Message, Contact Info"
                  value={textFormData.name}
                  onChange={(e) => setTextFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* Required Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="headline">Headline *</Label>
                  <Input
                    id="headline"
                    placeholder="Main headline text"
                    value={textFormData.headline}
                    onChange={(e) => setTextFormData(prev => ({ ...prev, headline: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Concise Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Brief, clear message"
                    rows={2}
                    value={textFormData.message}
                    onChange={(e) => setTextFormData(prev => ({ ...prev, message: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Optional Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact">Contact Information</Label>
                    <Textarea
                      id="contact"
                      placeholder="Phone, email, address, etc."
                      rows={2}
                      value={textFormData.contact}
                      onChange={(e) => setTextFormData(prev => ({ ...prev, contact: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta">Call to Action</Label>
                    <Input
                      id="cta"
                      placeholder="e.g., Shop Now, Call Today, Visit Us"
                      value={textFormData.cta}
                      onChange={(e) => setTextFormData(prev => ({ ...prev, cta: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">Discount Information</Label>
                    <Input
                      id="discount"
                      placeholder="e.g., 20% OFF, Buy 1 Get 1 Free"
                      value={textFormData.discount}
                      onChange={(e) => setTextFormData(prev => ({ ...prev, discount: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Usage Instructions */}
              <div>
                <Label htmlFor="instructions">Usage Instructions (Optional)</Label>
                <textarea
                  id="instructions"
                  placeholder="e.g., put this in a phone, this jacket be on this, place this logo in the top right corner"
                  value={textFormData.instructions}
                  onChange={(e) => setTextFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm min-h-[80px] resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide specific instructions on how this content should be used in designs
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateTextArtifact}
                  className="flex-1"
                  disabled={!textFormData.headline.trim() || !textFormData.message.trim()}
                >
                  Create Text Content
                </Button>
                <Button variant="outline" onClick={() => {
                  setTextFormData({
                    name: '',
                    headline: '',
                    message: '',
                    contact: '',
                    cta: '',
                    discount: '',
                    instructions: ''
                  });
                  setShowTextCreator(null);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
