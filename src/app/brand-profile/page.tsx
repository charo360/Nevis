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
      {/* Full-bleed wrapper */}
      <div className="w-full px-6 py-10 lg:py-16 lg:px-12">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {isCreateMode ? 'Create New Brand Profile' :
              isEditMode ? 'Edit Brand Profile' :
                'Brand Profile Setup'}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mx-auto max-w-4xl">
            {isCreateMode ? 'Create a new comprehensive brand profile with AI-powered analysis.' :
              isEditMode ? 'Update your existing brand profile information.' :
                'Create a comprehensive brand profile with AI-powered analysis, detailed information sections, and professional customization options.'}
          </p>
        </div>

        {/* Wizard should occupy the full available width; it can still render internal columns as needed */}
        <div className="w-full">
          <CbrandWizard key={`${mode}-${brandId || 'new'}`} mode={mode} brandId={brandId} />
        </div>
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
