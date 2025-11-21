'use client';

/**
 * Asset Library Page
 * Displays and manages brand assets (logos, product images, etc.)
 */

import { BrandAssetLibrary } from '@/components/brand-asset-library';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';
import { DesktopSidebarTrigger } from '@/components/layout/desktop-sidebar-trigger';

export default function AssetLibraryPage() {
  const { brandProfile, loading } = useUnifiedBrand();

  if (loading) {
    return (
      <>
        <MobileSidebarTrigger />
        <DesktopSidebarTrigger />
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </>
    );
  }

  if (!brandProfile) {
    return (
      <>
        <MobileSidebarTrigger />
        <DesktopSidebarTrigger />
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No Brand Selected</h2>
            <p className="text-gray-600 mb-6">
              Please create or select a brand profile to view your asset library.
            </p>
            <a
              href="/brand-profile"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Brand Profile
            </a>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileSidebarTrigger />
      <DesktopSidebarTrigger />
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asset Library</h1>
            <p className="text-gray-600 mt-2">
              Manage your brand's visual assets including logos, product images, and more
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Assets are automatically imported when you analyze an e-commerce website. You can also upload assets manually.
            </AlertDescription>
          </Alert>

          {/* Asset Library Component */}
          <BrandAssetLibrary brandProfileId={brandProfile.id} />
        </div>
      </div>
    </>
  );
}

