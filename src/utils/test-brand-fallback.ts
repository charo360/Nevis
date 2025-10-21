/**
 * Test Brand Fallback Utility
 * Creates a temporary brand profile for testing when Supabase is unavailable
 */

import type { CompleteBrandProfile } from '@/types/brand-profile';

export function createTestBrandProfile(): CompleteBrandProfile {
  const testBrand: CompleteBrandProfile = {
    id: 'test-brand-' + Date.now(),
    userId: 'test-user',
    businessName: 'Test Electronics Store',
    businessType: 'ecommerce',
    description: 'A test electronics store for development purposes',
    location: 'Kenya, Nairobi',
    targetAudience: 'Tech enthusiasts and professionals',
    uniqueSellingProposition: 'Quality electronics at affordable prices',
    brandPersonality: 'Professional, reliable, innovative',
    communicationStyle: 'Friendly and informative',
    keyFeatures: 'Wide product range, fast delivery, excellent support',
    competitiveAdvantages: 'Local expertise, competitive pricing, quality assurance',
    
    // Contact Information
    contactInfo: {
      phone: '+254 700 123 456',
      email: 'info@testelectronics.co.ke',
      address: 'Nairobi, Kenya'
    },
    websiteUrl: 'https://testelectronics.co.ke',
    
    // Brand Colors
    primaryColor: '#2563EB',
    accentColor: '#1D4ED8',
    backgroundColor: '#FFFFFF',
    
    // Logo (placeholder)
    logoUrl: '',
    logoDataUrl: '',
    
    // Services
    services: [
      'Laptops',
      'Smartphones',
      'Accessories',
      'Repair Services'
    ],
    
    // Social Media
    socialMediaHandles: {
      facebook: '@testelectronics',
      twitter: '@testelectronics',
      instagram: '@testelectronics',
      linkedin: 'test-electronics'
    },
    
    // Status
    isActive: true,
    isComplete: true,
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return testBrand;
}

export function saveTestBrandToLocalStorage(): CompleteBrandProfile {
  const testBrand = createTestBrandProfile();
  
  try {
    localStorage.setItem('completeBrandProfile', JSON.stringify(testBrand));
    localStorage.setItem('selectedBrandId', testBrand.id);
    return testBrand;
  } catch (error) {
    console.error('❌ Failed to save test brand to localStorage:', error);
    throw error;
  }
}

export function loadTestBrandFromLocalStorage(): CompleteBrandProfile | null {
  try {
    const stored = localStorage.getItem('completeBrandProfile');
    if (stored) {
      const brand = JSON.parse(stored);
      return brand;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load test brand from localStorage:', error);
    return null;
  }
}

export function clearTestBrandFromLocalStorage(): void {
  try {
    localStorage.removeItem('completeBrandProfile');
    localStorage.removeItem('selectedBrandId');
  } catch (error) {
    console.error('❌ Failed to clear test brand from localStorage:', error);
  }
}
