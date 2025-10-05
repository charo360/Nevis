'use client';

import { useState } from 'react';
import { Upload, Palette, Type, Image } from 'lucide-react';

interface AssetLibraryProps {
  brandId: string;
  onAssetSelect?: (asset: any) => void;
}

export default function AssetLibrary({ brandId, onAssetSelect }: AssetLibraryProps) {
  const [activeTab, setActiveTab] = useState<'logos' | 'colors' | 'fonts' | 'images'>('logos');

  const tabs = [
    { id: 'logos', label: 'Logos', icon: Upload },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'fonts', label: 'Fonts', icon: Type },
    { id: 'images', label: 'Images', icon: Image }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'logos' && <LogoLibrary brandId={brandId} />}
        {activeTab === 'colors' && <ColorLibrary brandId={brandId} />}
        {activeTab === 'fonts' && <FontLibrary brandId={brandId} />}
        {activeTab === 'images' && <ImageLibrary brandId={brandId} />}
      </div>
    </div>
  );
}

function LogoLibrary({ brandId }: { brandId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Brand Logos</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          Upload Logo
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Upload Logo</p>
        </div>
      </div>
    </div>
  );
}

function ColorLibrary({ brandId }: { brandId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Color Palettes</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          Create Palette
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Primary Palette</span>
            <span className="text-xs text-gray-500">Default</span>
          </div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 rounded bg-blue-600"></div>
            <div className="w-8 h-8 rounded bg-blue-400"></div>
            <div className="w-8 h-8 rounded bg-gray-600"></div>
            <div className="w-8 h-8 rounded bg-gray-100"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FontLibrary({ brandId }: { brandId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Brand Fonts</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          Add Font
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">Inter</p>
              <p className="text-sm text-gray-600">Headlines & Body</p>
            </div>
            <span className="text-xs text-gray-500">Default</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageLibrary({ brandId }: { brandId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Brand Images</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          Upload Images
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400">
          <div className="text-center">
            <Image className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Upload</p>
          </div>
        </div>
      </div>
    </div>
  );
}