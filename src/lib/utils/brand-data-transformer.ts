// src/lib/utils/brand-data-transformer.ts

import type { SupabaseBrandProfile } from '@/lib/services/supabase-service';
import type { BrandProfile } from '@/lib/types';

/**
 * Transform Supabase brand profile to the expected BrandProfile format
 */
export function transformSupabaseBrand(supabaseBrand: SupabaseBrandProfile): BrandProfile & { id: string } {
  return {
    id: supabaseBrand.id,
    businessName: supabaseBrand.business_name,
    businessType: supabaseBrand.business_type || '',
    location: supabaseBrand.location || '',
    logoDataUrl: supabaseBrand.logo_url || '', // Map logo_url to logoDataUrl
    visualStyle: extractFromBrandVoice(supabaseBrand.brand_voice, 'visualStyle') || 'modern',
    writingTone: extractFromBrandVoice(supabaseBrand.brand_voice, 'writingTone') || 'professional',
    contentThemes: extractFromBrandVoice(supabaseBrand.brand_voice, 'contentThemes') || '',
    websiteUrl: supabaseBrand.website_url,
    description: supabaseBrand.description,
    services: supabaseBrand.services,
    targetAudience: supabaseBrand.target_audience,
    // Extract color information from brand_colors if available
    primaryColor: extractFromBrandColors(supabaseBrand.brand_colors, 'primary') || '#3B82F6',
    accentColor: extractFromBrandColors(supabaseBrand.brand_colors, 'accent') || '#10B981',
    backgroundColor: extractFromBrandColors(supabaseBrand.brand_colors, 'background') || '#F8FAFC',
    // Contact and social media info
    contactInfo: supabaseBrand.contact_info || {},
    socialMedia: supabaseBrand.social_handles || {},
    // Design examples - may need to extract from website_analysis
    designExamples: extractDesignExamples(supabaseBrand.website_analysis) || [],
  };
}

/**
 * Extract specific field from brand_voice JSON
 */
function extractFromBrandVoice(brandVoice: any, field: string): string | undefined {
  if (!brandVoice || typeof brandVoice !== 'object') return undefined;
  return brandVoice[field];
}

/**
 * Extract specific color from brand_colors JSON
 */
function extractFromBrandColors(brandColors: any, colorType: string): string | undefined {
  if (!brandColors || typeof brandColors !== 'object') return undefined;
  return brandColors[colorType] || brandColors[`${colorType}Color`];
}

/**
 * Extract design examples from website_analysis JSON
 */
function extractDesignExamples(websiteAnalysis: any): string[] | undefined {
  if (!websiteAnalysis || typeof websiteAnalysis !== 'object') return undefined;
  return websiteAnalysis.designExamples || [];
}

/**
 * Transform array of Supabase brands
 */
export function transformSupabaseBrands(supabaseBrands: SupabaseBrandProfile[]): (BrandProfile & { id: string })[] {
  return supabaseBrands.map(transformSupabaseBrand);
}