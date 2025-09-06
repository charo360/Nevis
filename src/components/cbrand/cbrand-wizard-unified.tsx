'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteAnalysisStep } from './steps/website-analysis-step';
import { BrandDetailsStep } from './steps/brand-details-step';
import { LogoUploadStepUnified } from './steps/logo-upload-step-unified';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useAuth, useUserId } from '@/hooks/use-auth';
import type { CompleteBrandProfile } from './cbrand-wizard';

interface CbrandWizardUnifiedProps {
  mode?: string | null;
  brandId?: string | null;
}

export function CbrandWizardUnified({ mode, brandId }: CbrandWizardUnifiedProps) {
  console.log('🚀 CbrandWizardUnified component rendered');
  const [currentStep, setCurrentStep] = useState(1);
  const [brandProfile, setBrandProfile] = useState<CompleteBrandProfile>({
    businessName: '',
    businessType: '',
    description: '',
    location: '',
    services: [],
    targetAudience: '',
    keyFeatures: '',
    competitiveAdvantages: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    visualStyle: '',
    writingTone: '',
    contentThemes: '',
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    backgroundColor: '#f8fafc',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    logoDataUrl: '',
    designExamples: [],
  });

  const { currentBrand, selectBrand, brands, saveProfile, updateProfile, refreshBrands } = useUnifiedBrand();
  const userId = useUserId();
  const router = useRouter();

  // Load existing profile on component mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        console.log('🔄 Loading brand profile (Unified). Mode:', mode, 'BrandId:', brandId, 'CurrentBrand:', currentBrand?.businessName);

        // If we're in edit mode with a specific brandId, load that brand
        if (mode === 'edit' && brandId && userId) {
          console.log('🔄 Loading brand for edit mode:', brandId);
          // For now, we'll use the current brand from context if it matches
          if (currentBrand && currentBrand.id === brandId) {
            console.log('✅ Using current brand from context for edit');
            setBrandProfile(currentBrand);
            return;
          }
        }

        // If we have a current brand selected and we're not in create mode, use it
        if (currentBrand && mode !== 'create') {
          console.log('✅ Using current brand from unified context:', currentBrand.businessName);
          setBrandProfile(currentBrand);
          return;
        }

        // For create mode or when no brand is selected, try to load from unified context
        if (userId) {
          console.log('🔄 Loading from unified context for create mode or no current brand');
          await refreshBrands();
          // Use the first available brand if any exist
          if (brands.length > 0) {
            const savedProfile = brands[0];
            setBrandProfile(savedProfile);
            console.log('✅ Loaded existing profile from unified context:', savedProfile.businessName);
            return;
          }
        }

        console.log('📝 No existing profile found, starting with empty profile');
      } catch (error) {
        console.error('❌ Failed to load brand profile:', error);
      }
    };

    loadExistingProfile();
  }, [mode, brandId, currentBrand, userId]);

  const updateBrandProfile = async (updates: Partial<CompleteBrandProfile>) => {
    console.log('🔧 UNIFIED WIZARD updateBrandProfile called with updates:', updates);

    // Update local state immediately
    setBrandProfile(prev => ({ ...prev, ...updates }));

    // If this is a color update and we have a current brand with an ID, save to Firebase immediately
    const isColorUpdate = updates.primaryColor || updates.accentColor || updates.backgroundColor;
    if (isColorUpdate && currentBrand?.id) {
      try {
        console.log('🎨 Color update detected, saving to Firebase:', {
          brandId: currentBrand.id,
          updates: {
            primaryColor: updates.primaryColor,
            accentColor: updates.accentColor,
            backgroundColor: updates.backgroundColor
          }
        });

        // Save color changes to Firebase immediately
        await updateProfile(currentBrand.id, updates);

        // Update the current brand in the unified context with new colors
        const updatedBrand = { ...currentBrand, ...updates };
        selectBrand(updatedBrand);

        console.log('✅ Color changes saved to Firebase and context updated');
      } catch (error) {
        console.error('❌ Failed to save color changes to Firebase:', error);
        // Don't throw error to avoid disrupting user experience
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveComplete = async (profileId: string) => {
    console.log('✅ Profile saved successfully:', profileId);

    try {
      // First, immediately select the updated brand profile with current data
      const immediateProfile = { ...brandProfile, id: profileId };
      console.log('🔄 Immediately selecting updated profile with current colors:', {
        businessName: immediateProfile.businessName,
        primaryColor: immediateProfile.primaryColor,
        accentColor: immediateProfile.accentColor,
        backgroundColor: immediateProfile.backgroundColor
      });
      selectBrand(immediateProfile);

      // Then refresh brands from Firebase to ensure consistency
      console.log('🔄 Refreshing brands from unified context for consistency...');
      await refreshBrands();

      // Wait a moment for the refresh to complete and then re-select
      setTimeout(() => {
        const updatedProfile = brands.find(brand => brand.id === profileId);
        if (updatedProfile) {
          console.log('✅ Re-selecting with fresh Firebase data:', updatedProfile.businessName);
          console.log('🎨 Fresh colors from Firebase:', {
            primaryColor: updatedProfile.primaryColor,
            accentColor: updatedProfile.accentColor,
            backgroundColor: updatedProfile.backgroundColor
          });
          selectBrand(updatedProfile);
        } else {
          console.warn('⚠️ Could not find updated profile in refreshed brands, keeping current selection');
        }
      }, 500); // Small delay to ensure refresh completes

    } catch (error) {
      console.error('❌ Failed to refresh brands after save:', error);
      // Ensure we still have the updated profile selected
      const savedProfile = { ...brandProfile, id: profileId };
      selectBrand(savedProfile);
    }

    // Navigate to content calendar or dashboard
    router.push('/content-calendar');
  };

  const calculateProgress = () => {
    let progress = 0;

    // Website Analysis (Step 1) - 20%
    if (brandProfile.websiteUrl || brandProfile.designExamples?.length > 0) {
      progress += 20;
    }

    // Brand Details (Step 2) - 50%
    const requiredFields = [
      'businessName',
      'businessType',
      'location',
      'description',
      'services'
    ];

    const completedFields = requiredFields.filter(field => {
      const value = brandProfile[field as keyof CompleteBrandProfile];
      return value && (
        typeof value === 'string' ? value.trim().length > 0 :
          Array.isArray(value) ? value.length > 0 :
            true
      );
    });

    progress += (completedFields.length / requiredFields.length) * 50;

    // Logo Upload (Step 3) - 30%
    if (brandProfile.logoDataUrl) {
      progress += 30;
    }

    return Math.round(progress);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WebsiteAnalysisStep
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <BrandDetailsStep
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <LogoUploadStepUnified
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
            onPrevious={handlePrevious}
            onSaveComplete={handleSaveComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep === step
                      ? 'bg-blue-600 text-white'
                      : currentStep > step
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${currentStep > step ? 'bg-green-600' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-lg">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
