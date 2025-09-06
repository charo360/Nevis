import { CompleteBrandProfile } from './cbrand-wizard';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export function validateBrandProfile(profile: CompleteBrandProfile, step?: number): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Step 1 validation (Website Analysis)
  if (!step || step >= 1) {
    if (!profile.websiteUrl && !profile.description) {
      warnings.websiteUrl = 'Website URL or manual description is recommended for better AI analysis';
    }

    if (profile.websiteUrl && !isValidUrl(profile.websiteUrl)) {
      errors.websiteUrl = 'Please enter a valid website URL';
    }
  }

  // Step 2 validation (Brand Details)
  if (!step || step >= 2) {
    // Required fields
    if (!profile.businessName?.trim()) {
      errors.businessName = 'Business name is required';
    }

    if (!profile.businessType?.trim()) {
      errors.businessType = 'Business type is required';
    }

    if (!profile.location?.trim()) {
      errors.location = 'Location is required';
    }

    if (!profile.description?.trim()) {
      errors.description = 'Business description is required';
    }

    if (!profile.services || profile.services.length === 0) {
      errors.services = 'At least one service/product is required';
    } else {
      // Check if all services have names (description is optional)
      const incompleteServices = profile.services.some(
        service => !service.name?.trim()
      );
      if (incompleteServices) {
        errors.services = 'All service/product names must be filled';
      }
    }

    // Optional but recommended fields
    if (!profile.targetAudience?.trim()) {
      warnings.targetAudience = 'Target audience description helps create better content';
    }

    if (!profile.visualStyle?.trim()) {
      warnings.visualStyle = 'Visual style description helps with content generation';
    }

    if (!profile.writingTone?.trim()) {
      warnings.writingTone = 'Writing tone helps maintain consistent brand voice';
    }

    // Email validation
    if (profile.contactEmail && !isValidEmail(profile.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    // Social media URL validation
    if (profile.facebookUrl && !isValidUrl(profile.facebookUrl)) {
      errors.facebookUrl = 'Please enter a valid Facebook URL';
    }

    if (profile.instagramUrl && !isValidUrl(profile.instagramUrl)) {
      errors.instagramUrl = 'Please enter a valid Instagram URL';
    }

    if (profile.twitterUrl && !isValidUrl(profile.twitterUrl)) {
      errors.twitterUrl = 'Please enter a valid Twitter URL';
    }

    if (profile.linkedinUrl && !isValidUrl(profile.linkedinUrl)) {
      errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }

    // Color validation
    if (profile.primaryColor && !isValidHexColor(profile.primaryColor)) {
      errors.primaryColor = 'Please enter a valid hex color';
    }

    if (profile.accentColor && !isValidHexColor(profile.accentColor)) {
      errors.accentColor = 'Please enter a valid hex color';
    }

    if (profile.backgroundColor && !isValidHexColor(profile.backgroundColor)) {
      errors.backgroundColor = 'Please enter a valid hex color';
    }
  }

  // Step 3 validation (Logo Upload)
  if (!step || step >= 3) {
    if (!profile.logoDataUrl) {
      errors.logoDataUrl = 'Logo upload is required to complete your brand profile';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

export function getFieldValidationState(
  profile: CompleteBrandProfile,
  fieldName: keyof CompleteBrandProfile
): 'valid' | 'invalid' | 'warning' | 'neutral' {
  const validation = validateBrandProfile(profile);

  if (validation.errors[fieldName]) {
    return 'invalid';
  }

  if (validation.warnings[fieldName]) {
    return 'warning';
  }

  const value = profile[fieldName];
  if (value && typeof value === 'string' && value.trim()) {
    return 'valid';
  }

  return 'neutral';
}

// Utility functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

// Progress calculation
export function calculateProgress(profile: CompleteBrandProfile): {
  overall: number;
  byStep: { step1: number; step2: number; step3: number };
} {
  // Step 1: Website Analysis (20%)
  let step1Progress = 0;
  if (profile.websiteUrl) step1Progress += 50;
  if (profile.description) step1Progress += 50;

  // Step 2: Brand Details (70%)
  const basicRequiredFields = [
    'businessName', 'businessType', 'location', 'description'
  ];
  const optionalFields = [
    'targetAudience', 'keyFeatures', 'competitiveAdvantages',
    'contactPhone', 'contactEmail', 'contactAddress',
    'visualStyle', 'writingTone', 'contentThemes'
  ];
  // Social media fields are now completely optional and don't affect progress
  // 'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl' - removed from progress calculation

  // Count basic required fields
  const basicRequiredCompleted = basicRequiredFields.filter(
    field => profile[field as keyof CompleteBrandProfile]?.toString().trim()
  ).length;

  // Check services separately (array format)
  const servicesCompleted = profile.services && profile.services.length > 0 &&
    profile.services.every(service => service.name?.trim()) ? 1 : 0;

  const totalRequiredCompleted = basicRequiredCompleted + servicesCompleted;
  const totalRequiredFields = basicRequiredFields.length + 1; // +1 for services
  const optionalCompleted = optionalFields.filter(
    field => profile[field as keyof CompleteBrandProfile]?.toString().trim()
  ).length;

  const step2Progress = (
    (totalRequiredCompleted / totalRequiredFields) * 70 +
    (optionalCompleted / optionalFields.length) * 30
  );

  // Step 3: Logo Upload (10%)
  const step3Progress = profile.logoDataUrl ? 100 : 0;

  const overall = (step1Progress * 0.2) + (step2Progress * 0.7) + (step3Progress * 0.1);

  return {
    overall: Math.round(overall),
    byStep: {
      step1: Math.round(step1Progress),
      step2: Math.round(step2Progress),
      step3: Math.round(step3Progress),
    },
  };
}
