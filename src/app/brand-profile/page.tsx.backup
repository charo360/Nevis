'use client';

import { CbrandWizard } from '@/components/cbrand/cbrand-wizard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BrandProfileContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const brandId = searchParams.get('id');

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit' && brandId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isCreateMode ? 'Create New Brand Profile' :
              isEditMode ? 'Edit Brand Profile' :
                'Brand Profile Setup'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isCreateMode ? 'Create a new comprehensive brand profile with AI-powered analysis.' :
              isEditMode ? 'Update your existing brand profile information.' :
                'Create a comprehensive brand profile with AI-powered analysis, detailed information sections, and professional customization options.'}
          </p>
        </div>

        <CbrandWizard key={`${mode}-${brandId || 'new'}`} mode={mode} brandId={brandId} />
      </div>
    </div>
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
