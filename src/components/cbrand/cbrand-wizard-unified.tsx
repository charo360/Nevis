'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteAnalysisStep } from './steps/website-analysis-step';
import { BrandArchetypeStep } from './steps/brand-archetype-step';
import { BrandDetailsStep } from './steps/brand-details-step';
import { LogoUploadStepUnified } from './steps/logo-upload-step-unified';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useAuth } from '@/hooks/use-auth-supabase';
import type { CompleteBrandProfile } from './cbrand-wizard';

interface CbrandWizardUnifiedProps {
  mode?: string | null;
  brandId?: string | null;
}

export function CbrandWizardUnified({ mode: modeProp, brandId }: CbrandWizardUnifiedProps) {
  // Default to 'create' mode if no mode is specified
  const mode = modeProp || 'create';

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
  const hasInitializedRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);

  // Generate unique session ID for create mode (persists across re-renders)
  const sessionIdRef = useRef<string>();
  if (!sessionIdRef.current) {
    sessionIdRef.current = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Draft persistence per brand (survives refresh and step changes)
  const draftKey = useMemo(() => {
    // In create mode, use unique session ID to avoid loading other brand drafts
    if (mode === 'create') {
      return `BRAND_DRAFT_new_${sessionIdRef.current}`;
    }
    return `BRAND_DRAFT_${brandId || currentBrand?.id || 'new'}`;
  }, [brandId, currentBrand?.id, mode]);

  const saveDraft = (profile: CompleteBrandProfile) => {
    try {
      const payload = { ts: Date.now(), profile };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch { }
  };

  const loadDraft = (): CompleteBrandProfile | null => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile) return parsed.profile as CompleteBrandProfile;
      return null;
    } catch {
      return null;
    }
  };

  const clearDraft = (key?: string) => {
    try {
      localStorage.removeItem(key || draftKey);
    } catch { }
  };
  const { user } = useAuth();
  const router = useRouter();

  // Load existing profile on component mount (only once, unless not initialized and not dirty)
  useEffect(() => {
    if (hasInitializedRef.current || isDirty) {
      return;
    }
    const loadExistingProfile = async () => {
      try {
        // 1) Prefer draft if present (user edits not yet saved to DB)
        const draft = loadDraft();
        if (draft) {

          // In create mode, ensure we remove any ID from the draft to prevent updates
          if (mode === 'create') {
            const cleanDraft = { ...draft };
            delete cleanDraft.id;
            setBrandProfile(cleanDraft);
          } else {
            setBrandProfile(draft);
          }

          hasInitializedRef.current = true;
          return;
        }

        // If we're in edit mode with a specific brandId, load that brand
        if (mode === 'edit' && brandId && user?.userId) {
          // For now, we'll use the current brand from context if it matches
          if (currentBrand && currentBrand.id === brandId) {
            setBrandProfile(currentBrand);
            saveDraft(currentBrand);
            hasInitializedRef.current = true;
            return;
          } else {
            console.warn('⚠️ Edit mode but current brand ID does not match:', {
              requestedBrandId: brandId,
              currentBrandId: currentBrand?.id,
              currentBrandName: currentBrand?.businessName
            });
          }
        }

        // If we have a current brand selected and we're not in create mode, use it
        if (currentBrand && mode !== 'create') {
          setBrandProfile(currentBrand);
          saveDraft(currentBrand);
          hasInitializedRef.current = true;
          return;
        }

        // For create mode, always start with empty profile
        if (mode === 'create') {
          // Keep the default empty profile that was set in useState
          hasInitializedRef.current = true;
          return;
        }

        // For non-create mode, try to load existing brands from MongoDB
        if (user?.userId && brands.length > 0) {
          const firstBrand = brands[0];
          if (firstBrand) {
            setBrandProfile(firstBrand);
            saveDraft(firstBrand);
            hasInitializedRef.current = true;
            return;
          }
        }

      } catch (error) {
        console.error('❌ Failed to load brand profile:', error);
      }
    };

    loadExistingProfile();
  }, [mode, brandId, currentBrand, user?.userId, isDirty]);

  const updateBrandProfile = async (updates: Partial<CompleteBrandProfile>) => {

    // Update local state immediately
    setIsDirty(true);
    setBrandProfile(prev => {
      const merged = { ...prev, ...updates } as CompleteBrandProfile;
      // Persist draft on every change so fields survive refresh/navigation
      saveDraft(merged);
      return merged;
    });

    // If this is a color update, only auto-save when editing an existing brand (NEVER in create mode)
    const isColorUpdate = updates.primaryColor || updates.accentColor || updates.backgroundColor;
    const isCreateMode = (mode === 'create');
    const targetBrandId = brandId || currentBrand?.id;
    if (isColorUpdate && !isCreateMode && targetBrandId) {
      try {

        // Save color changes to DB immediately for the brand being edited
        await updateProfile(targetBrandId, updates);

        // Update the current brand in the unified context if it matches the edited brand
        if (currentBrand?.id === targetBrandId) {
          const updatedBrand = { ...currentBrand, ...updates };
          selectBrand(updatedBrand);
        }

      } catch (error) {
        console.error('❌ Failed to save color changes (edit mode):', error);
        // Don't throw error to avoid disrupting user experience
      }
    } else if (isColorUpdate && isCreateMode) {
      // In create mode, DO NOT save to DB or touch the active brand; keep it local to the wizard draft
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
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
      // First, immediately select the updated brand profile with current data
      const immediateProfile = { ...brandProfile, id: profileId };
      selectBrand(immediateProfile);

      // Clear current draft after successful save
      clearDraft(draftKey);
      // Also clear any old generic drafts that might exist
      clearDraft(`BRAND_DRAFT_new`);
      clearDraft(`BRAND_DRAFT_${profileId}`);

      // Then refresh brands from Supabase to ensure consistency
      await refreshBrands();

      // Wait a moment for the refresh to complete and then re-select
      setTimeout(() => {
        const updatedProfile = brands.find(brand => brand.id === profileId);
        if (updatedProfile) {
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

    // Navigate to quick content to test the content generation fixes
    router.push('/quick-content');
  };

  const calculateProgress = () => {
    let progress = 0;

    // Website Analysis (Step 1) - 20%
    if (brandProfile.websiteUrl || brandProfile.designExamples?.length > 0) {
      progress += 20;
    }

    // Brand Archetype (Step 2) - 20%
    if (brandProfile.brandArchetype) {
      progress += 20;
    }

    // Brand Details (Step 3) - 40%
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

    progress += (completedFields.length / requiredFields.length) * 40;

    // Logo Upload (Step 4) - 20%
    if (brandProfile.logoDataUrl) {
      progress += 20;
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
          <BrandArchetypeStep
            brandProfile={brandProfile}
            onUpdate={updateBrandProfile}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <BrandDetailsStep
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <LogoUploadStepUnified
            brandProfile={brandProfile}
            updateBrandProfile={updateBrandProfile}
            onPrevious={handlePrevious}
            onSaveComplete={handleSaveComplete}
            mode={mode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-none">
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
          {[1, 2, 3, 4].map((step) => (
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
              {step < 4 && (
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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-none">
        {renderStep()}
      </div>
    </div>
  );
}
