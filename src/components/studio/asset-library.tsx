// src/components/studio/asset-library.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  X,
  Trash2,
  Edit2,
  Clock,
  TrendingUp,
  Folder,
  Tag,
  Grid3x3,
  List,
  ChevronDown,
  FileImage,
  Package,
  Palette,
  Layout,
  Check,
  MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-supabase';
import { creativeAssetsService, type CreativeAsset } from '@/lib/services/creative-assets-service';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AssetLibraryProps {
  onSelectAsset: (asset: CreativeAsset) => void;
  brandProfileId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetLibrary({ onSelectAsset, brandProfileId, open, onOpenChange }: AssetLibraryProps) {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<CreativeAsset[]>([]);
  const [recentAssets, setRecentAssets] = useState<CreativeAsset[]>([]);
  const [popularAssets, setPopularAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingAsset, setEditingAsset] = useState<CreativeAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CreativeAsset | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load assets on mount and when dialog opens
  useEffect(() => {
    if (open && user) {
      console.log('📂 [AssetLibrary] Dialog opened, loading assets for user:', user.userId);
      loadAssets();
      loadRecentAssets();
      loadPopularAssets();
      loadTags();
    } else if (open && !user) {
      console.warn('⚠️ [AssetLibrary] Dialog opened but no user logged in');
    }
  }, [open, user, brandProfileId]);

  // Filter assets when search/filters change
  useEffect(() => {
    filterAssets();
  }, [assets, searchQuery, selectedType, selectedTag]);

  const loadAssets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await creativeAssetsService.getAssets(
        user.userId,
        brandProfileId ? { brandProfileId } : undefined,
        100
      );
      console.log('✅ [AssetLibrary] Loaded assets:', data.length);
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load assets'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentAssets = async () => {
    if (!user) return;
    const data = await creativeAssetsService.getRecentAssets(user.userId, 5);
    setRecentAssets(data);
  };

  const loadPopularAssets = async () => {
    if (!user) return;
    const data = await creativeAssetsService.getPopularAssets(user.userId, 5);
    setPopularAssets(data);
  };

  const loadTags = async () => {
    if (!user) return;
    const tags = await creativeAssetsService.getUserTags(user.userId);
    setAvailableTags(tags);
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(asset => asset.asset_type === selectedType);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(asset => asset.tags.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.filename.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredAssets(filtered);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        creativeAssetsService.uploadAsset({
          file,
          userId: user.userId,
          brandProfileId,
          assetType: 'other', // Default type, can be changed later
          tags: []
        })
      );

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r !== null).length;

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} of ${files.length} files`
      });

      // Reload assets
      await loadAssets();
      await loadTags();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload files'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectAsset = async (asset: CreativeAsset) => {
    console.log('🎯 [AssetLibrary] handleSelectAsset called!', {
      id: asset.id,
      filename: asset.filename,
      fileUrl: asset.file_url,
      timestamp: new Date().toISOString()
    });

    // Call parent callback FIRST - this is critical!
    console.log('📤 [AssetLibrary] Calling onSelectAsset callback...');
    try {
      // Call the parent's handler - don't await, let it run
      onSelectAsset(asset);
    } catch (error) {
      console.error('❌ [AssetLibrary] Error in onSelectAsset callback:', error);
    }

    // Close dialog after a tiny delay to ensure parent received the callback
    setTimeout(() => {
      console.log('🚪 [AssetLibrary] Closing dialog...');
      onOpenChange(false);
    }, 10);

    // Track usage (fire and forget)
    creativeAssetsService.trackAssetUsage(asset.id).catch(err => {
      console.warn('⚠️ [AssetLibrary] Failed to track asset usage:', err);
    });

    console.log('✅ [AssetLibrary] handleSelectAsset completed');
  };

  const handleDeleteAsset = async (asset: CreativeAsset) => {
    const success = await creativeAssetsService.deleteAsset(asset.id);

    if (success) {
      toast({
        title: 'Asset Deleted',
        description: `${asset.filename} has been removed`
      });
      await loadAssets();
      await loadRecentAssets();
      await loadPopularAssets();
    } else {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete asset'
      });
    }

    setDeleteConfirm(null);
  };

  const handleUpdateAsset = async (asset: CreativeAsset, updates: Partial<CreativeAsset>) => {
    const updated = await creativeAssetsService.updateAsset(asset.id, updates);

    if (updated) {
      toast({
        title: 'Asset Updated',
        description: 'Changes saved successfully'
      });
      await loadAssets();
      await loadTags();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update asset'
      });
    }

    setEditingAsset(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAssetTypeIcon = (type: CreativeAsset['asset_type']) => {
    switch (type) {
      case 'logo':
        return <Palette className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'background':
        return <FileImage className="h-4 w-4" />;
      case 'template':
        return <Layout className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const AssetCard = ({ asset }: { asset: CreativeAsset }) => {
    return (
      <div
        className={cn(
          "group relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:border-primary hover:scale-[1.02]",
          viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-4 p-3'
        )}
        onPointerDown={() => handleSelectAsset(asset)}
        role="button"
        tabIndex={0}
        aria-label={`Select asset ${asset.filename}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectAsset(asset);
          }
        }}
      >
        {/* Image */}
        <div className={cn(
          "relative bg-muted",
          viewMode === 'grid' ? 'w-full h-full' : 'w-20 h-20 flex-shrink-0'
        )}>
          <Image
            src={asset.file_url}
            alt={asset.filename}
            fill
            className="object-cover pointer-events-none"
          />

          {/* Asset Type Badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs pointer-events-none z-10">
            {getAssetTypeIcon(asset.asset_type)}
            <span className="capitalize">{asset.asset_type}</span>
          </div>

          {/* Click to Use Indicator - Grid Only */}
          {viewMode === 'grid' && (
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-20"
              onPointerDown={() => handleSelectAsset(asset)}
            >
              <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                <MousePointerClick className="h-5 w-5" />
                Click to Use
              </div>
            </div>
          )}

          {/* Quick Actions - Bottom Right */}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 shadow-md bg-green-500 hover:bg-green-600 text-white"
              onPointerDown={(e) => {
                e.stopPropagation();
                handleSelectAsset(asset);
              }}
              title="Select this asset"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setEditingAsset(asset);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(asset);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className={cn(
          "p-3 bg-background/95",
          viewMode === 'list' && 'flex-1'
        )}>
          <p className="text-sm font-semibold truncate">{asset.filename}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{formatFileSize(asset.file_size)}</span>
            {asset.usage_count > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <TrendingUp className="h-3 w-3" />
                {asset.usage_count} uses
              </span>
            )}
          </div>
        </div>
      </div >
    );
  };

  // Debug: Log when dialog state changes
  React.useEffect(() => {
    if (open) {
      console.log('🔍 [AssetLibrary] Dialog opened');
    } else {
      console.log('🔍 [AssetLibrary] Dialog closed');
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">Asset Library</DialogTitle>
            <DialogDescription className="text-base">
              Click any asset to use it in your design • Upload new assets • Organize with tags
            </DialogDescription>
          </DialogHeader>

          <div className="px-6">
            {/* Upload & Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="logo">Logo</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  size="icon"
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">
                  All Assets ({filteredAssets.length})
                </TabsTrigger>
                <TabsTrigger value="recent">
                  <Clock className="mr-2 h-4 w-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="popular">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Most Used
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                <TabsContent value="all" className="mt-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-muted-foreground">Loading assets...</p>
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                      <div>
                        <p className="text-muted-foreground font-semibold">No assets found</p>
                        <p className="text-sm text-muted-foreground mt-1">Upload images to get started</p>
                      </div>
                      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md space-y-2">
                          <p className="text-sm text-yellow-800 font-medium">⚠️ Supabase Not Configured</p>
                          <p className="text-xs text-yellow-700">
                            Asset storage requires Supabase. Check the console for setup instructions.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const testAsset: CreativeAsset = {
                                id: 'test-123',
                                user_id: 'test-user',
                                filename: 'test-image.jpg',
                                file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
                                file_size: 100000,
                                mime_type: 'image/jpeg',
                                asset_type: 'image',
                                width: 400,
                                height: 400,
                                created_at: new Date().toISOString(),
                                usage_count: 0
                              };
                              console.log('🧪 [AssetLibrary] Testing with mock asset');
                              handleSelectAsset(testAsset);
                            }}
                            className="w-full"
                          >
                            🧪 Test Asset Selection (Click Me!)
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "gap-4 pb-4",
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'flex flex-col'
                    )}>
                      {filteredAssets.map(asset => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recent" className="mt-0">
                  {recentAssets.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-muted-foreground">No recently used assets</p>
                    </div>
                  ) : (
                    <div className={cn(
                      "gap-4 pb-4",
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'flex flex-col'
                    )}>
                      {recentAssets.map(asset => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="popular" className="mt-0">
                  {popularAssets.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-muted-foreground">No frequently used assets yet</p>
                    </div>
                  ) : (
                    <div className={cn(
                      "gap-4 pb-4",
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'flex flex-col'
                    )}>
                      {popularAssets.map(asset => (
                        <AssetCard key={asset.id} asset={asset} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      {editingAsset && (
        <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Filename</Label>
                <Input
                  value={editingAsset.filename}
                  onChange={(e) => setEditingAsset({ ...editingAsset, filename: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingAsset.description || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={editingAsset.asset_type}
                  onValueChange={(value: any) => setEditingAsset({ ...editingAsset, asset_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editingAsset.tags.join(', ')}
                  onChange={(e) => setEditingAsset({
                    ...editingAsset,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., logo, brand, red"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAsset(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateAsset(editingAsset, {
                filename: editingAsset.filename,
                description: editingAsset.description,
                tags: editingAsset.tags,
                category: editingAsset.category
              })}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Asset</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteConfirm.filename}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteAsset(deleteConfirm)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
