import { NextRequest, NextResponse } from 'next/server';
import type { BrandProfile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Debug Revo 1.0 Contacts] Starting comprehensive contact information debug...');

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

    console.log('🔍 [Debug Revo 1.0 Contacts] Test brand profile:', {
      businessName: testBrandProfile.businessName,
      contactInfo: testBrandProfile.contactInfo,
      websiteUrl: testBrandProfile.websiteUrl
    });

    // Step 1: Test the content generation flow
    console.log('🔍 [Debug Revo 1.0 Contacts] Step 1: Testing content generation flow...');
    
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
      includeContacts: true, // Enable contacts
      contactInfo: testBrandProfile.contactInfo,
      websiteUrl: testBrandProfile.websiteUrl
    });

    console.log('🔍 [Debug Revo 1.0 Contacts] Content generation result:', {
      hasContent: !!contentResult.content,
      hasCatchyWords: !!contentResult.catchyWords,
      hasSubheadline: !!contentResult.subheadline,
      hasCallToAction: !!contentResult.callToAction,
      contentPreview: contentResult.content?.substring(0, 100) + '...',
      catchyWords: contentResult.catchyWords,
      subheadline: contentResult.subheadline,
      callToAction: contentResult.callToAction
    });

    // Step 2: Test the image generation flow directly
    console.log('🔍 [Debug Revo 1.0 Contacts] Step 2: Testing image generation flow...');
    
    const { generateRevo10Image } = await import('../../../ai/revo-1.0-service');
    
    // Prepare structured text for image
    const imageTextComponents = [];
    if (contentResult.catchyWords) imageTextComponents.push(contentResult.catchyWords);
    if (contentResult.subheadline) imageTextComponents.push(contentResult.subheadline);
    if (contentResult.callToAction) imageTextComponents.push(contentResult.callToAction);
    const structuredImageText = imageTextComponents.join(' | ');

    console.log('🔍 [Debug Revo 1.0 Contacts] Image generation input:', {
      businessName: testBrandProfile.businessName,
      includeContacts: true,
      contactInfo: testBrandProfile.contactInfo,
      websiteUrl: testBrandProfile.websiteUrl,
      structuredImageText: structuredImageText
    });

    // This will trigger the actual image generation and show us the contact information flow
    try {
      const imageResult = await generateRevo10Image({
        businessType: testBrandProfile.businessType,
        businessName: testBrandProfile.businessName,
        platform: 'Instagram',
        visualStyle: testBrandProfile.visualStyle,
        primaryColor: testBrandProfile.primaryColor,
        accentColor: testBrandProfile.accentColor,
        backgroundColor: testBrandProfile.backgroundColor,
        imageText: structuredImageText,
        designDescription: `Professional ${testBrandProfile.businessType} content for Instagram`,
        location: testBrandProfile.location,
        headline: contentResult.catchyWords,
        subheadline: contentResult.subheadline,
        callToAction: contentResult.callToAction,
        // Contact information - this is the critical part
        includeContacts: true,
        contactInfo: testBrandProfile.contactInfo,
        websiteUrl: testBrandProfile.websiteUrl
      });

      console.log('🔍 [Debug Revo 1.0 Contacts] Image generation successful:', {
        hasImageUrl: !!imageResult.imageUrl,
        imageUrlLength: imageResult.imageUrl?.length || 0
      });

      return NextResponse.json({
        success: true,
        message: 'Revo 1.0 contact information debug completed',
        timestamp: new Date().toISOString(),
        testData: {
          brandProfile: {
            businessName: testBrandProfile.businessName,
            contactInfo: testBrandProfile.contactInfo,
            websiteUrl: testBrandProfile.websiteUrl
          },
          contentGeneration: {
            content: contentResult.content?.substring(0, 200) + '...',
            catchyWords: contentResult.catchyWords,
            subheadline: contentResult.subheadline,
            callToAction: contentResult.callToAction
          },
          imageGeneration: {
            inputContactInfo: testBrandProfile.contactInfo,
            inputWebsiteUrl: testBrandProfile.websiteUrl,
            includeContacts: true,
            imageGenerated: !!imageResult.imageUrl
          }
        },
        analysis: {
          contactDataFlow: 'Contact information passed through all stages',
          expectedBehavior: 'Real contact details should appear in generated image',
          actualContactInfo: {
            phone: testBrandProfile.contactInfo.phone,
            email: testBrandProfile.contactInfo.email,
            website: testBrandProfile.websiteUrl
          },
          debugNote: 'Check console logs for detailed contact information flow during image generation'
        }
      });

    } catch (imageError) {
      console.error('🚨 [Debug Revo 1.0 Contacts] Image generation failed:', imageError);
      
      return NextResponse.json({
        success: false,
        message: 'Image generation failed during contact debug',
        error: imageError instanceof Error ? imageError.message : 'Unknown error',
        testData: {
          brandProfile: {
            businessName: testBrandProfile.businessName,
            contactInfo: testBrandProfile.contactInfo,
            websiteUrl: testBrandProfile.websiteUrl
          },
          contentGeneration: {
            content: contentResult.content?.substring(0, 200) + '...',
            catchyWords: contentResult.catchyWords,
            subheadline: contentResult.subheadline,
            callToAction: contentResult.callToAction
          }
        }
      });
    }

  } catch (error) {
    console.error('🚨 [Debug Revo 1.0 Contacts] Debug failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug Revo 1.0 contact information',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
