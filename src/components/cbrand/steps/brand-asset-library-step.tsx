'use client';

import { useState } from 'react';
import { Upload, Palette, Type, Image, Save, ArrowLeft } from 'lucide-react';
import type { CompleteBrandProfile } from '../cbrand-wizard';

interface BrandAssetLibraryStepProps {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
  onPrevious: () => void;
  onSaveComplete: (profileId: string) => void;
  mode?: string;
}

export function BrandAssetLibraryStep({
  brandProfile,
  updateBrandProfile,
  onPrevious,
  onSaveComplete,
  mode
}: BrandAssetLibraryStepProps) {
  const [activeTab, setActiveTab] = useState<'fonts' | 'images' | 'logos'>('fonts');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save - replace with actual save logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSaveComplete(brandProfile.id || 'new-id');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'fonts', label: 'Typography', icon: Type },
    { id: 'images', label: 'Brand Images', icon: Image },
    { id: 'logos', label: 'Logo Variations', icon: Upload }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Asset Library</h2>
        <p className="text-gray-600">
          Expand your brand assets with additional fonts, images, and logo variations that will enhance your content generation.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
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
      <div className="mb-8">
        {activeTab === 'fonts' && (
          <FontManager 
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
          />
        )}
        {activeTab === 'images' && (
          <ImageLibraryManager 
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
          />
        )}
        {activeTab === 'logos' && (
          <LogoVariationsManager 
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrevious}
          className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save & Complete'}
        </button>
      </div>
    </div>
  );
}

function LogoVariationsManager({ brandProfile, updateBrandProfile }: {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Logo Variations</h3>
      <p className="text-gray-600 mb-6">
        Upload different versions of your logo for various use cases.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
            {brandProfile.logoDataUrl ? (
              <img src={brandProfile.logoDataUrl} alt="Primary Logo" className="max-w-full max-h-full" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium text-center">Primary Logo</p>
          <p className="text-xs text-gray-500 text-center">Main brand mark</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-center">Secondary Logo</p>
          <p className="text-xs text-gray-500 text-center">Simplified version</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-center">Icon/Favicon</p>
          <p className="text-xs text-gray-500 text-center">Square format</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-center">Watermark</p>
          <p className="text-xs text-gray-500 text-center">Transparent overlay</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Coming Soon</h4>
        <p className="text-sm text-blue-700">
          Multiple logo variations will be available in the next update. 
          For now, your primary logo from Step 4 will be used for all content.
        </p>
      </div>
    </div>
  );
}

function FontManager({ brandProfile, updateBrandProfile }: {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
}) {
  const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro'
  ];

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Typography Settings</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Font Family
          </label>
          <select
            value={brandProfile.fontFamily || 'Inter'}
            onChange={(e) => updateBrandProfile({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {fonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Font Preview</h4>
          <div style={{ fontFamily: brandProfile.fontFamily || 'Inter' }}>
            <p className="text-2xl font-bold mb-2">Headline Text</p>
            <p className="text-lg mb-2">Subheadline text example</p>
            <p className="text-base">Body text example for your brand content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageLibraryManager({ brandProfile, updateBrandProfile }: {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Brand Image Library</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 cursor-pointer">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload Product Images</p>
          </div>
        </div>

        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 cursor-pointer">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload Team Photos</p>
          </div>
        </div>

        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 cursor-pointer">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload Location Images</p>
          </div>
        </div>

        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 cursor-pointer">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload Lifestyle Photos</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Coming Soon</h4>
        <p className="text-sm text-blue-700">
          Image upload and management features will be available in the next update. 
          For now, you can continue with your brand colors and fonts.
        </p>
      </div>
    </div>
  );
}