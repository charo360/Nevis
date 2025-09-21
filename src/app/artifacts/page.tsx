// src/app/artifacts/page.tsx
'use client';

import React from 'react';
import { Archive } from 'lucide-react';

export default function ArtifactsPage() {
  // COMING SOON - Feature not fully implemented yet
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-6">
      <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
        <Archive className="w-12 h-12 text-purple-600" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Artifacts</h1>
        <p className="text-xl text-gray-600">Coming Soon!</p>
      </div>
      <div className="max-w-md space-y-4">
        <p className="text-gray-500">
          We're building a powerful artifacts system to help you manage and reuse your creative assets. 
          Soon you'll be able to store, organize, and easily access your images, text, and design elements.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">What's Coming:</h3>
          <ul className="text-sm text-purple-800 space-y-1 text-left">
            <li>• Upload and organize your creative assets</li>
            <li>• Categorize images, text, and design elements</li>
            <li>• Quick access during content creation</li>
            <li>• Brand-consistent asset management</li>
          </ul>
        </div>
        <p className="text-sm text-gray-400">
          Stay tuned for updates! In the meantime, you can still create amazing content 
          with our Quick Content and Creative Studio features.
        </p>
      </div>
    </div>
  );
}