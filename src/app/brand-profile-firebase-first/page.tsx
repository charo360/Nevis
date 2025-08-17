'use client';

import { CbrandWizardFirebaseFirst } from '@/components/cbrand/cbrand-wizard-firebase-first';
import { BrandProviderFirebaseFirst } from '@/contexts/brand-context-firebase-first';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BrandProfileFirebaseFirstContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const brandId = searchParams.get('id');

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit' && brandId;

  return (
    <BrandProviderFirebaseFirst>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header with Firebase-first indicator */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                🔥 Firebase-First Approach
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isCreateMode && 'Create New Brand Profile'}
                {isEditMode && 'Edit Brand Profile'}
                {!isCreateMode && !isEditMode && 'Brand Profile Setup'}
              </h1>
              <p className="text-gray-600">
                Testing the new Firebase-first approach with logo persistence
              </p>
            </div>

            <CbrandWizardFirebaseFirst key={`${mode}-${brandId || 'new'}`} mode={mode} brandId={brandId} />
          </div>
        </div>
      </div>
    </BrandProviderFirebaseFirst>
  );
}

export default function BrandProfileFirebaseFirstPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Firebase-first brand profile...</p>
        </div>
      </div>
    }>
      <BrandProfileFirebaseFirstContent />
    </Suspense>
  );
}
