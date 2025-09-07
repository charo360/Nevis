'use client';

import React from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';

export function LogoDebug() {
  const { currentBrand } = useUnifiedBrand();

  if (!currentBrand) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Logo Debug: No Brand Selected</h3>
        <p className="text-yellow-700">No current brand found in context.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-2">Logo Debug Information</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Brand Name:</strong> {currentBrand.businessName || currentBrand.name || 'N/A'}
        </div>
        <div>
          <strong>Logo Data URL:</strong>
          {currentBrand.logoUrl ? (
            <span className="text-green-600"> ✅ Present ({currentBrand.logoUrl.length} chars)</span>
          ) : (
            <span className="text-red-600"> ❌ Missing</span>
          )}
        </div>
        {currentBrand.logoUrl && (
          <div>
            <strong>Logo Preview:</strong>
            <div className="mt-2 p-2 bg-white border rounded">
              <img
                src={currentBrand.logoUrl}
                alt="Logo Preview"
                className="max-w-[100px] max-h-[100px] object-contain"
              />
            </div>
          </div>
        )}
        <div>
          <strong>Logo URL Preview:</strong>
          <code className="text-xs bg-gray-100 p-1 rounded block mt-1 break-all">
            {currentBrand.logoUrl ? currentBrand.logoUrl.substring(0, 100) + '...' : 'No logo data'}
          </code>
        </div>
      </div>
    </div>
  );
}
