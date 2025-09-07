'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBrand } from '@/contexts/brand-context-mongo';

// Import validation and progress components
import { ProgressIndicator } from './progress-indicator';
import { validateBrandProfile } from './form-validation';

// Import step components (will create these next)
import { WebsiteAnalysisStep } from './steps/website-analysis-step';
import { BrandDetailsStep } from './steps/brand-details-step';
import { LogoUploadStep } from './steps/logo-upload-step';

// Types for the complete brand profile
export interface CompleteBrandProfile {
  // Optional compatibility fields (may come from persisted data)
  id?: string;
  name?: string;
  // Basic Information
  businessName: string;
  businessType: string;
  location: string;
  description: string;

  // Services & Target Audience
  services: Array<{
    name: string;
    description: string;
  }>;
  targetAudience: string;
  keyFeatures: string;
  competitiveAdvantages: string;

  // Contact Information
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;

  // Brand Identity & Voice
  visualStyle: string;
  writingTone: string;
  contentThemes: string;

  // Brand Colors
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;

  // Social Media
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;

  // Website & Logo
  websiteUrl: string;
  logoDataUrl: string;

  // Design Examples (for AI reference)
  designExamples: string[]; // Array of data URIs from uploaded design samples
}

const STEPS = [
  {
    id: 1,
    title: 'Website Analysis',
    description: 'AI-powered analysis of your website',
  },
  {
    id: 2,
    title: 'Brand Details',
    description: 'Comprehensive brand information',
  },
  {
    id: 3,
    title: 'Logo Upload',
    description: 'Upload your brand logo',
  },
];

interface CbrandWizardProps {
  mode?: string | null;
  brandId?: string | null;
}

export function CbrandWizard({ mode, brandId }: CbrandWizardProps = {}) {
  const { currentBrand, loading: brandLoading } = useBrand();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Default brand profile with all required fields and default colors
  const defaultBrandProfile: CompleteBrandProfile = {
    businessName: '',
    businessType: '',
    location: '',
    description: '',
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
    primaryColor: '#3B82F6',
    accentColor: '#10B981',
    backgroundColor: '#F8FAFC',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    logoDataUrl: '',
    designExamples: [],
  };

  const [brandProfile, setBrandProfile] = useState<CompleteBrandProfile>(defaultBrandProfile);

  // Load existing profile on component mount
  useEffect(() => {
    const loadExistingProfile = () => {
      try {

        // If we're in edit mode with a specific brandId, load that brand
        if (mode === 'edit' && brandId) {
          // Load specific brand by ID
          // For now, we'll use the current brand from context if it matches
          if (currentBrand && (currentBrand as any).id === brandId) {
            // Merge with defaults to ensure all color properties exist
            setBrandProfile({ ...defaultBrandProfile, ...currentBrand });
            return;
          }
        }

        // If we have a current brand selected and we're not in create mode, use it
        if (currentBrand && mode !== 'create') {
          // Merge with defaults to ensure all color properties exist
          setBrandProfile({ ...defaultBrandProfile, ...currentBrand });
          return;
        }

        // For create mode or when no brand is selected, try to load from storage

        // Try to load the complete brand profile first
        const savedProfile = localStorage.getItem('completeBrandProfile');
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          // Merge with defaults to ensure all color properties exist
          const mergedProfile = { ...defaultBrandProfile, ...parsedProfile };
          setBrandProfile(mergedProfile);
          return;
        }

        // Fallback to legacy profile format
        const legacyProfile = localStorage.getItem('brandProfile');
        if (legacyProfile) {
          const parsedLegacy = JSON.parse(legacyProfile);

          // Convert legacy format to new format
          const convertedProfile: CompleteBrandProfile = {
            businessName: parsedLegacy.businessName || '',
            businessType: parsedLegacy.businessType || '',
            location: parsedLegacy.location || '',
            description: parsedLegacy.description || '',
            services: parsedLegacy.services
              ? (typeof parsedLegacy.services === 'string'
                ? parsedLegacy.services.split('\n').filter(s => s.trim()).map(service => {
                  const parts = service.split(':');
                  return {
                    name: parts[0]?.trim() || service.trim(),
                    description: parts.slice(1).join(':').trim() || ''
                  };
                })
                : parsedLegacy.services)
              : [],
            websiteUrl: parsedLegacy.websiteUrl || '',
            logoDataUrl: parsedLegacy.logoDataUrl || '',
            designExamples: parsedLegacy.designExamples || [],
            visualStyle: parsedLegacy.visualStyle || '',
            writingTone: parsedLegacy.writingTone || '',
            contentThemes: parsedLegacy.contentThemes || '',
            primaryColor: parsedLegacy.primaryColor || '#3B82F6',
            accentColor: parsedLegacy.accentColor || '#10B981',
            backgroundColor: parsedLegacy.backgroundColor || '#F8FAFC',
            contactPhone: parsedLegacy.contactPhone || '',
            contactEmail: parsedLegacy.contactEmail || '',
            contactAddress: parsedLegacy.contactAddress || '',
            targetAudience: parsedLegacy.targetAudience || '',
            keyFeatures: parsedLegacy.keyFeatures || '',
            competitiveAdvantages: parsedLegacy.competitiveAdvantages || '',
            facebookUrl: parsedLegacy.socialMedia?.facebook || '',
            instagramUrl: parsedLegacy.socialMedia?.instagram || '',
            twitterUrl: parsedLegacy.socialMedia?.twitter || '',
            linkedinUrl: parsedLegacy.socialMedia?.linkedin || '',
          };

          // Merge with defaults to ensure all color properties exist
          const mergedProfile = { ...defaultBrandProfile, ...convertedProfile };
          setBrandProfile(mergedProfile);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    // Only load when brand context is ready
    if (!brandLoading) {
      loadExistingProfile();
    }
  }, [currentBrand, brandLoading, mode, brandId]);

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const updateBrandProfile = (updates: Partial<CompleteBrandProfile>) => {
    const updatedProfile = { ...brandProfile, ...updates };
    setBrandProfile(updatedProfile);

    // Auto-save to localStorage whenever profile is updated with size check
    try {
      const profileSize = JSON.stringify(updatedProfile).length;
      const maxSize = 10 * 1024 * 1024; // 10MB limit for localStorage (increased for larger profiles)

      if (profileSize > maxSize) {
        // Try saving without design examples
        const profileWithoutDesigns = { ...updatedProfile, designExamples: [] };
        localStorage.setItem('completeBrandProfile', JSON.stringify(profileWithoutDesigns));
        return;
      }

      localStorage.setItem('completeBrandProfile', JSON.stringify(updatedProfile));
    } catch (error) {
      // Try saving without design examples as fallback
      try {
        const profileWithoutDesigns = { ...updatedProfile, designExamples: [] };
        localStorage.setItem('completeBrandProfile', JSON.stringify(profileWithoutDesigns));
      } catch (fallbackError) {
      }
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
          <LogoUploadStep
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state while profile is being loaded
  if (isLoading) {
    return (
      <div className="w-full px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your brand profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-4">
          {/* Progress Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Step {currentStep} of {STEPS.length}
                    </h2>
                    {brandProfile.businessName && (
                      <div className="flex items-center mt-1">
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Editing: {brandProfile.businessName}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <Progress value={progress} className="mb-4" />
              </div>

              {/* Step Navigation */}
              <div className="flex justify-between items-center">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex-1 ${index < STEPS.length - 1 ? 'mr-4' : ''}`}
                  >
                    <button
                      onClick={() => handleStepClick(step.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${currentStep === step.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : currentStep > step.id
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${currentStep === step.id
                            ? 'bg-blue-500 text-white'
                            : currentStep > step.id
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                            }`}
                        >
                          {step.id}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{step.title}</div>
                          <div className="text-sm text-gray-500">{step.description}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Step Content */}
          {renderCurrentStep()}
        </div>

        {/* Progress Sidebar - Right Side */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Progress
              </h3>
              <ProgressIndicator
                brandProfile={brandProfile}
                currentStep={currentStep}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
