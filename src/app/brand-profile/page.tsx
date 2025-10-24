'use client';

import { CbrandWizardUnified } from '@/components/cbrand/cbrand-wizard-unified';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { SidebarInset } from '@/components/ui/sidebar';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';

function BrandProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentBrand } = useUnifiedBrand();
  const modeParam = searchParams.get('mode');
  const brandId = searchParams.get('id');

  // Auto-redirect to edit mode if no mode specified but there's an active brand
  useEffect(() => {
    if (!modeParam && currentBrand?.id) {
      router.replace(`/brand-profile?mode=edit&id=${currentBrand.id}`);
      return;
    }
  }, [modeParam, currentBrand, router]);

  // Update URL when brand changes (for brand selector switching)
  useEffect(() => {
    if (modeParam === 'edit' && currentBrand?.id && brandId !== currentBrand.id) {
      router.replace(`/brand-profile?mode=edit&id=${currentBrand.id}`);
      return;
    }
  }, [currentBrand, modeParam, brandId, router]);

  // Default to 'create' mode if no mode is specified
  const mode = modeParam || 'create';

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit' && brandId;

  return (
    <SidebarInset fullWidth>
      <MobileSidebarTrigger />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
        <div className="w-full h-full">
          <div className="w-full h-full px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isCreateMode && 'Create New Brand Profile'}
              {isEditMode && 'Edit Brand Profile'}
              {!isCreateMode && !isEditMode && 'Brand Profile Setup'}
              </h1>
              <p className="text-gray-600">
                {isCreateMode ? 'Create a new comprehensive brand profile with AI-powered analysis.' :
                  isEditMode ? 'Update your existing brand profile information.' :
                    'Create a comprehensive brand profile with AI-powered analysis, detailed information sections, and professional customization options.'}
              </p>
            </div>

            <CbrandWizardUnified key={`${mode}-${brandId || 'new'}`} mode={mode} brandId={brandId} />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

export default function BrandProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brand profile...</p>
        </div>
      </div>
    }>
      <BrandProfileContent />
    </Suspense>
  );
}
