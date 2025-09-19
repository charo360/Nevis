import { NextRequest, NextResponse } from 'next/server';
import type { BrandProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Test Different Business] Testing with different business name...');

    // Test with a completely different business name to see if AI still generates same contact info
    const testBrandProfile: BrandProfile = {
      businessName: 'Sunrise Bakery',
      businessType: 'Bakery',
      location: 'Mombasa, Kenya',
      visualStyle: 'modern',
      writingTone: 'friendly',
      contentThemes: 'baking,pastries,fresh bread',
      websiteUrl: 'www.sunrisebakery.co.ke',
      contactInfo: {
        phone: '+254-722-555-999',
        email: 'hello@sunrisebakery.co.ke',
        address: 'Mombasa, Kenya'
      },
      primaryColor: '#FF6B35',
      accentColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      targetAudience: 'Local families and bread lovers'
    };

    console.log('🧪 [Test Different Business] Testing content generation...');
    
    const { generateRevo10Content } = await import('../../../ai/revo-1.0-service');
    
    const contentResult = await generateRevo10Content({
      businessType: testBrandProfile.businessType,
      businessName: testBrandProfile.businessName,
      location: testBrandProfile.location,
      platform: 'Instagram',
      writingTone: testBrandProfile.writingTone,
      contentThemes: Array.isArray(testBrandProfile.contentThemes) ? testBrandProfile.contentThemes : [testBrandProfile.contentThemes],
      targetAudience: testBrandProfile.targetAudience,
      services: 'Fresh bread, pastries, custom cakes',
      keyFeatures: 'Daily fresh baking, local ingredients, custom orders',
      competitiveAdvantages: 'Family recipes, early morning fresh bread, community favorite',
      dayOfWeek: 'Monday',
      currentDate: new Date().toLocaleDateString(),
      primaryColor: testBrandProfile.primaryColor,
      visualStyle: testBrandProfile.visualStyle,
      includeContacts: true, // Enable contacts - but should only affect image generation
      contactInfo: testBrandProfile.contactInfo,
      websiteUrl: testBrandProfile.websiteUrl
    });

    // Check if contact information appears in content generation results
    const contentHasPhone = contentResult.content?.includes(testBrandProfile.contactInfo.phone || '') || false;
    const contentHasEmail = contentResult.content?.includes(testBrandProfile.contactInfo.email || '') || false;
    const contentHasWebsite = contentResult.content?.includes(testBrandProfile.websiteUrl || '') || false;
    
    const ctaHasPhone = contentResult.callToAction?.includes(testBrandProfile.contactInfo.phone || '') || false;
    const ctaHasEmail = contentResult.callToAction?.includes(testBrandProfile.contactInfo.email || '') || false;
    const ctaHasWebsite = contentResult.callToAction?.includes(testBrandProfile.websiteUrl || '') || false;

    // Check if it's generating the old Paya contact info (hallucination test)
    const ctaHasPayaPhone = contentResult.callToAction?.includes('+254-708-881-600') || false;
    const ctaHasPayaEmail = contentResult.callToAction?.includes('support@paya.co.ke') || false;
    const ctaHasPayaWebsite = contentResult.callToAction?.includes('www.paya.co.ke') || false;

    const hasAnyContactInContent = contentHasPhone || contentHasEmail || contentHasWebsite;
    const hasAnyContactInCTA = ctaHasPhone || ctaHasEmail || ctaHasWebsite;
    const hasPayaContactInCTA = ctaHasPayaPhone || ctaHasPayaEmail || ctaHasPayaWebsite;

    console.log('🧪 [Test Different Business] Analysis:', {
      businessName: testBrandProfile.businessName,
      actualContactInfo: testBrandProfile.contactInfo,
      actualWebsite: testBrandProfile.websiteUrl,
      generatedCTA: contentResult.callToAction,
      hasRealContactInCTA: hasAnyContactInCTA,
      hasPayaContactInCTA: hasPayaContactInCTA
    });

    return NextResponse.json({
      success: true,
      message: 'Different business contact test completed',
      timestamp: new Date().toISOString(),
      testResults: {
        brandProfile: {
          businessName: testBrandProfile.businessName,
          contactInfo: testBrandProfile.contactInfo,
          websiteUrl: testBrandProfile.websiteUrl
        },
        contentGeneration: {
          content: contentResult.content?.substring(0, 200) + '...',
          catchyWords: contentResult.catchyWords,
          subheadline: contentResult.subheadline,
          callToAction: contentResult.callToAction,
          contactAnalysis: {
            contentHasContact: hasAnyContactInContent,
            ctaHasRealContact: hasAnyContactInCTA,
            ctaHasPayaContact: hasPayaContactInCTA,
            details: {
              realContact: { hasPhone: ctaHasPhone, hasEmail: ctaHasEmail, hasWebsite: ctaHasWebsite },
              payaContact: { hasPhone: ctaHasPayaPhone, hasEmail: ctaHasPayaEmail, hasWebsite: ctaHasPayaWebsite }
            }
          }
        }
      },
      analysis: {
        isHallucinating: hasPayaContactInCTA,
        isUsingRealContact: hasAnyContactInCTA && !hasPayaContactInCTA,
        isContactFree: !hasAnyContactInCTA && !hasPayaContactInCTA,
        conclusion: hasPayaContactInCTA 
          ? 'AI is hallucinating Paya contact info regardless of business'
          : hasAnyContactInCTA 
            ? 'AI is using real contact info from business profile'
            : 'AI is not including contact info (DESIRED BEHAVIOR)'
      }
    });

  } catch (error) {
    console.error('🚨 [Test Different Business] Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test different business contact behavior',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
