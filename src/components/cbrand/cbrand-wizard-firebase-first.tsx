'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteAnalysisStep } from './steps/website-analysis-step';
import { BrandDetailsStep } from './steps/brand-details-step';
import { LogoUploadStepFirebaseFirst } from './steps/logo-upload-step-firebase-first';
import { useBrandFirebaseFirst } from '@/contexts/brand-context-firebase-first';
import { loadBrandProfileFirebaseFirst } from '@/lib/firebase/services/brand-profile-firebase-first';
import { useUserId } from '@/hooks/use-firebase-auth';
import type { CompleteBrandProfile } from './cbrand-wizard';

interface CbrandWizardFirebaseFirstProps {
  mode?: string | null;
  brandId?: string | null;
}

export function CbrandWizardFirebaseFirst({ mode, brandId }: CbrandWizardFirebaseFirstProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [brandProfile, setBrandProfile] = useState<CompleteBrandProfile>({
    businessName: '',
    businessType: '',
    businessDescription: '',
    description: '',
    location: '',
    websiteUrl: '',
    logoDataUrl: '',
    socialMedia: {},
    brandColors: [],
    brandFonts: [],
    visualStyle: '',
    targetAudience: '',
    brandVoice: '',
    writingTone: '',
    contentThemes: '',
    keyFeatures: '',
    competitiveAdvantages: '',
    services: [],
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    designExamples: [],
    isComplete: false,
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const { currentBrand, selectBrand, brands, refreshBrands } = useBrandFirebaseFirst();
  const userId = useUserId();
  const router = useRouter();

  // Load existing profile on component mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {

        // If we're in edit mode with a specific brandId, load that brand
        if (mode === 'edit' && brandId && userId) {
          // For now, we'll use the current brand from context if it matches
          if (currentBrand && currentBrand.id === brandId) {
            setBrandProfile(currentBrand);
            return;
          }
        }

        // If we have a current brand selected and we're not in create mode, use it
        if (currentBrand && mode !== 'create') {
          setBrandProfile(currentBrand);
          return;
        }

        // For create mode or when no brand is selected, try to load from Firebase
        if (userId) {
          const savedProfile = await loadBrandProfileFirebaseFirst(userId);
          if (savedProfile) {
            setBrandProfile(savedProfile);
            return;
          }
        }

      } catch (error) {
      }
    };

    loadExistingProfile();
  }, [mode, brandId, currentBrand, userId]);

  const updateBrandProfile = (updates: Partial<CompleteBrandProfile>) => {
    setBrandProfile(prev => {
      const updated = { ...prev, ...updates };
      return updated;
    });
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

    try {
      // Refresh brands from Firebase to get the latest data (including updated colors)
      await refreshBrands();

      // Find the saved profile from the refreshed brands list
      const updatedProfile = brands.find(brand => brand.id === profileId);
      if (updatedProfile) {
          primaryColor: updatedProfile.primaryColor,
          accentColor: updatedProfile.accentColor,
          backgroundColor: updatedProfile.backgroundColor
        });
        selectBrand(updatedProfile);
      } else {
        // Fallback to local data if refresh fails
        const savedProfile = { ...brandProfile, id: profileId };
        selectBrand(savedProfile);
      }
    } catch (error) {
      // Fallback to local data if refresh fails
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

    progress += Math.round((completedFields.length / requiredFields.length) * 50);

    // Logo Upload (Step 3) - 30%
    if (brandProfile.logoDataUrl) {
      progress += 30;
    }

    return Math.min(progress, 100);
  };

  const getStepProgress = (step: number) => {
    switch (step) {
      case 1: // Website Analysis
        return (brandProfile.websiteUrl || brandProfile.designExamples?.length > 0) ? 100 : 0;
      case 2: // Brand Details
        const requiredFields = ['businessName', 'businessType', 'location', 'description', 'services'];
        const completedFields = requiredFields.filter(field => {
          const value = brandProfile[field as keyof CompleteBrandProfile];
          return value && (
            typeof value === 'string' ? value.trim().length > 0 :
              Array.isArray(value) ? value.length > 0 :
                true
          );
        });
        return Math.round((completedFields.length / requiredFields.length) * 100);
      case 3: // Logo Upload
        return brandProfile.logoDataUrl ? 100 : 0;
      default:
        return 0;
    }
  };

  const renderCurrentStep = () => {
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
          <LogoUploadStepFirebaseFirst
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'create' ? 'Create New Brand Profile' : 'Brand Profile Setup'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create'
                ? 'Create a new comprehensive brand profile with AI-powered analysis.'
                : 'Create a comprehensive brand profile with AI-powered analysis, detailed information sections, and professional customization options.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Progress Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Step {currentStep} of 3
                    </h2>
                    <p className="text-sm text-gray-600">
                      ✓ Editing: {brandProfile.businessName || 'New Brand Profile'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {calculateProgress()}% Complete
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between">
                  {[1, 2, 3].map((step) => {
                    const stepInfo = {
                      1: { title: 'Website Analysis', subtitle: 'AI-powered analysis of your website' },
                      2: { title: 'Brand Details', subtitle: 'Comprehensive brand information' },
                      3: { title: 'Logo Upload', subtitle: 'Upload your brand logo' }
                    };

                    return (
                      <button
                        key={step}
                        onClick={() => setCurrentStep(step)}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${currentStep === step
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep === step
                          ? 'bg-blue-600 text-white'
                          : getStepProgress(step) === 100
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                          }`}>
                          {step}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {stepInfo[step as keyof typeof stepInfo].title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stepInfo[step as keyof typeof stepInfo].subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Step Content */}
              <div className="bg-white rounded-lg shadow-sm">
                {renderCurrentStep()}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Overall Progress</span>
                      <span className="text-sm text-gray-600">{calculateProgress()}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Individual Step Progress */}
                  {[
                    { step: 1, title: 'Website Analysis', icon: '🌐' },
                    { step: 2, title: 'Brand Details', icon: '📝' },
                    { step: 3, title: 'Logo Upload', icon: '🎨' }
                  ].map(({ step, title, icon }) => (
                    <div key={step} className="flex items-center space-x-3">
                      <div className="text-lg">{icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{title}</span>
                          <span className="text-sm text-gray-600">{getStepProgress(step)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${getStepProgress(step) === 100 ? 'bg-green-500' : 'bg-blue-600'
                              }`}
                            style={{ width: `${getStepProgress(step)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
