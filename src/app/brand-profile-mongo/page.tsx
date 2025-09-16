// Supabase-based brand profile page (redirected from MongoDB)
'use client';

import { CbrandWizardUnified } from '@/components/cbrand/cbrand-wizard-unified';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BrandProfileMongoContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const brandId = searchParams.get('id');

  return <CbrandWizardUnified mode={mode} brandId={brandId} />;
}

export default function BrandProfileMongoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <BrandProfileMongoContent />
    </Suspense>
  );
}
