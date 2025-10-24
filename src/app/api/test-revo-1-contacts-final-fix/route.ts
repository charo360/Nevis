import { NextRequest, NextResponse } from 'next/server';
import type { BrandProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {

    // Test brand profile with real contact information
    const testBrandProfile: BrandProfile = {
      businessName: 'Paya Financial Services',
      businessType: 'Financial Services',
      location: 'Nairobi, Kenya',
      visualStyle: 'modern',
      writingTone: 'professional',
      contentThemes: 'finance,payments,banking',
      websiteUrl: 'www.paya.co.ke',
      contactInfo: {
        phone: '+254-708-881-600',
        email: 'support@paya.co.ke',
        address: 'Nairobi, Kenya'
      },
      primaryColor: '#FF6B35',
      accentColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      targetAudience: 'Kenyan professionals and businesses'
    };

    
    const { generateRevo10Content } = await import('../../../ai/revo-1.0-service');
    
    const contentResult = await generateRevo10Content({
      businessType: testBrandProfile.businessType,
      businessName: testBrandProfile.businessName,
      location: testBrandProfile.location,
      platform: 'Instagram',
      writingTone: testBrandProfile.writingTone,
      contentThemes: Array.isArray(testBrandProfile.contentThemes) ? testBrandProfile.contentThemes : [testBrandProfile.contentThemes],
      targetAudience: testBrandProfile.targetAudience,
      services: 'Digital payments, mobile banking, financial services',
      keyFeatures: 'Instant payments, secure transactions, 24/7 support',
      competitiveAdvantages: 'Local expertise, trusted platform, competitive rates',
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

    const subheadlineHasPhone = contentResult.subheadline?.includes(testBrandProfile.contactInfo.phone || '') || false;
    const subheadlineHasEmail = contentResult.subheadline?.includes(testBrandProfile.contactInfo.email || '') || false;
    const subheadlineHasWebsite = contentResult.subheadline?.includes(testBrandProfile.websiteUrl || '') || false;

    const hasAnyContactInContent = contentHasPhone || contentHasEmail || contentHasWebsite;
    const hasAnyContactInCTA = ctaHasPhone || ctaHasEmail || ctaHasWebsite;
    const hasAnyContactInSubheadline = subheadlineHasPhone || subheadlineHasEmail || subheadlineHasWebsite;

    const fixSuccessful = !hasAnyContactInContent && !hasAnyContactInCTA && !hasAnyContactInSubheadline;

    return NextResponse.json({
      success: true,
      message: 'Revo 1.0 final contact fix test completed',
      timestamp: new Date().toISOString(),
      fixStatus: {
        successful: fixSuccessful,
        description: fixSuccessful 
          ? 'Contact information correctly excluded from content generation' 
          : 'Contact information still appearing in content generation'
      },
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
            ctaHasContact: hasAnyContactInCTA,
            subheadlineHasContact: hasAnyContactInSubheadline,
            details: {
              content: { hasPhone: contentHasPhone, hasEmail: contentHasEmail, hasWebsite: contentHasWebsite },
              cta: { hasPhone: ctaHasPhone, hasEmail: ctaHasEmail, hasWebsite: ctaHasWebsite },
              subheadline: { hasPhone: subheadlineHasPhone, hasEmail: subheadlineHasEmail, hasWebsite: subheadlineHasWebsite }
            }
          }
        }
      },
      expectedBehavior: {
        contentGeneration: 'Should NOT include any contact information (phone, email, website)',
        imageGeneration: 'Should include contact information only in footer/corner/strip when includeContacts=true',
        result: 'Single, clean contact information display in image only'
      },
      nextSteps: fixSuccessful 
        ? 'Fix successful! Contact information will now appear only once in generated images.'
        : 'Additional fixes needed to prevent contact information in content generation.'
    });

  } catch (error) {
    console.error('🚨 [Test Revo 1.0 Final Fix] Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test Revo 1.0 final contact fix',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
