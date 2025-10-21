/**
 * Test file for Enhanced AI Caption and Hashtag Generation
 * 
 * This file can be used to test the enhanced AI generation system
 * with sample data to verify all features are working correctly.
 */

import { generatePostFromProfile } from './flows/generate-post-from-profile';
import type { GeneratePostFromProfileInput } from './flows/generate-post-from-profile';

/**
 * Sample test data for different business types
 */
const testProfiles = {
  restaurant: {
    businessType: 'restaurant',
    location: 'New York, NY',
    visualStyle: 'modern and elegant',
    writingTone: 'friendly and appetizing',
    contentThemes: 'fresh ingredients, local sourcing, comfort food',
    logoDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Mb2dvPC90ZXh0Pgo8L3N2Zz4K',
    dayOfWeek: 'Friday',
    currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    variants: [{ platform: 'instagram', aspectRatio: '1:1' }],
    services: 'Farm-to-table dining, craft cocktails, weekend brunch, private events',
    targetAudience: 'Food enthusiasts, young professionals, families',
    keyFeatures: 'Locally sourced ingredients, seasonal menu, cozy atmosphere',
    competitiveAdvantages: 'Only restaurant in the area with 100% local sourcing'
  },
  fitness: {
    businessType: 'fitness',
    location: 'Los Angeles, CA',
    visualStyle: 'energetic and motivational',
    writingTone: 'motivational and energetic',
    contentThemes: 'strength training, wellness, community',
    logoDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5GaXRuZXNzPC90ZXh0Pgo8L3N2Zz4K',
    dayOfWeek: 'Monday',
    currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    variants: [{ platform: 'instagram', aspectRatio: '1:1' }],
    services: 'Personal training, group classes, nutrition coaching, recovery services',
    targetAudience: 'Fitness enthusiasts, busy professionals, beginners',
    keyFeatures: 'Certified trainers, modern equipment, flexible scheduling',
    competitiveAdvantages: '24/7 access, personalized workout plans, community support'
  },
  technology: {
    businessType: 'technology',
    location: 'San Francisco, CA',
    visualStyle: 'innovative and professional',
    writingTone: 'innovative and professional',
    contentThemes: 'AI solutions, digital transformation, efficiency',
    logoDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UZWNoPC90ZXh0Pgo8L3N2Zz4K',
    dayOfWeek: 'Wednesday',
    currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    variants: [{ platform: 'linkedin', aspectRatio: '16:9' }],
    services: 'AI consulting, software development, digital transformation, cloud migration',
    targetAudience: 'CTOs, IT managers, startup founders, enterprise clients',
    keyFeatures: 'Cutting-edge AI, scalable solutions, expert team',
    competitiveAdvantages: 'Proprietary AI algorithms, 99.9% uptime guarantee, rapid deployment'
  }
};

/**
 * Test function to verify enhanced AI generation
 */
export async function testEnhancedGeneration(businessType: keyof typeof testProfiles = 'restaurant') {
  
  try {
    const testInput: GeneratePostFromProfileInput = testProfiles[businessType];
    
    const result = await generatePostFromProfile(testInput);
    
    
    if (result.contentVariants && result.contentVariants.length > 0) {
      result.contentVariants.forEach((variant, index) => {
      });
    }
    
    if (result.hashtagAnalysis) {
    }
    
    result.variants.forEach((variant, index) => {
    });
    
    return result;
    
  } catch (error) {
    console.error(`❌ Test failed for ${businessType}:`, error);
    throw error;
  }
}

/**
 * Test all business types
 */
export async function testAllBusinessTypes() {
  
  const results: Array<{ businessType: keyof typeof testProfiles; success: boolean; result: any }> = [];
  const errors: Array<{ businessType: keyof typeof testProfiles; error: any }> = [];
  
  for (const businessType of Object.keys(testProfiles) as Array<keyof typeof testProfiles>) {
    try {
      const result = await testEnhancedGeneration(businessType);
      results.push({ businessType, success: true, result });
    } catch (error) {
      console.error(`❌ ${businessType} test failed:`, error);
      errors.push({ businessType, error });
    }
  }
  
  
  if (errors.length > 0) {
    errors.forEach(({ businessType, error }) => {
    });
  }
  
  
  return { results, errors };
}

// Export test profiles for use in other tests
export { testProfiles };
