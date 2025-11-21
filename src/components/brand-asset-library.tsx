'use client';

/**
 * Brand Asset Library Component
 * Displays and manages brand assets (logos, product images, etc.)
 */

import { useState, useEffect } from 'react';
import { BrandAsset, BrandLibrary } from '@/lib/brand-asset-library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Upload, Trash2, Star, StarOff, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BrandAssetLibraryProps {
  brandProfileId: string;
  onSelectAsset?: (asset: BrandAsset) => void;
}

export function BrandAssetLibrary({ brandProfileId, onSelectAsset }: BrandAssetLibraryProps) {
  const [library, setLibrary] = useState<BrandLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadLibrary();
  }, [brandProfileId]);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/brand-assets?brandProfileId=${brandProfileId}`);
      const data = await response.json();

      if (data.success) {
        setLibrary(data.library);
      } else {
        throw new Error(data.error || 'Failed to load library');
      }
    } catch (error) {
      console.error('Error loading library:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load asset library'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/api/brand-assets?assetId=${assetId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Asset deleted successfully'
        });
        loadLibrary();
      } else {
        throw new Error(data.error || 'Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete asset'
      });
    }
  };

  const handleSetDefault = async (assetId: string) => {
    try {
      const response = await fetch('/api/brand-assets/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, brandProfileId })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Default asset updated'
        });
        loadLibrary();
      } else {
        throw new Error(data.error || 'Failed to set default');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to set default asset'
      });
    }
  };

  const renderAssetGrid = (assets: BrandAsset[]) => {
    if (assets.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assets found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="relative group overflow-hidden">
            <div className="aspect-square relative bg-gray-100">
              <img
                src={asset.fileUrl}
                alt={asset.name}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => onSelectAsset?.(asset)}
              />
              {asset.isDefault && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Default
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={() => handleSetDefault(asset.id)}
                  title={asset.isDefault ? 'Remove as default' : 'Set as default'}
                >
                  {asset.isDefault ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDelete(asset.id)}
                  title="Delete asset"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate" title={asset.name}>
                {asset.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500 capitalize">{asset.type.replace('_', ' ')}</span>
                <span className="text-xs text-gray-400">{asset.source}</span>
              </div>
              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{asset.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Failed to load asset library</p>
      </div>
    );
  }

  const allAssets = [
    ...library.logos,
    ...library.productImages,
    ...library.heroImages,
    ...library.banners,
    ...library.icons,
    ...library.other
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asset Library</h2>
          <p className="text-gray-600 text-sm">
            {allAssets.length} assets • {library.logos.length} logos • {library.productImages.length} products
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All ({allAssets.length})</TabsTrigger>
          <TabsTrigger value="logos">Logos ({library.logos.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({library.productImages.length})</TabsTrigger>
          <TabsTrigger value="hero">Hero Images ({library.heroImages.length})</TabsTrigger>
          <TabsTrigger value="banners">Banners ({library.banners.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderAssetGrid(allAssets)}
        </TabsContent>

        <TabsContent value="logos" className="mt-6">
          {renderAssetGrid(library.logos)}
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          {renderAssetGrid(library.productImages)}
        </TabsContent>

        <TabsContent value="hero" className="mt-6">
          {renderAssetGrid(library.heroImages)}
        </TabsContent>

        <TabsContent value="banners" className="mt-6">
          {renderAssetGrid(library.banners)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

