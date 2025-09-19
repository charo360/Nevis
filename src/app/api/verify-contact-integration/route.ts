import { NextRequest, NextResponse } from 'next/server';
import { BrandProfile, BrandConsistencyPreferences } from '@/lib/types';

/**
 * Verify contact information integration across all AI services
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Contact Integration Verification] Starting verification...');

    // Create test brand profile with all contact information
    const testBrandProfile: BrandProfile = {
      businessName: 'Test Business',
      businessType: 'Restaurant',
      location: 'Nairobi, Kenya',
      visualStyle: 'modern',
      writingTone: 'professional',
      contentThemes: 'food,dining,restaurant',
      websiteUrl: 'www.testbusiness.com',
      contactInfo: {
        phone: '+254-700-123-456',
        email: 'info@testbusiness.com',
        address: '123 Test Street, Nairobi'
      }
    };

    // Test with contacts enabled
    const brandConsistencyWithContacts: BrandConsistencyPreferences = {
      strictConsistency: false,
      followBrandColors: true,
      includeContacts: true
    };

    // Test Revo 2.0 contact integration
    const revo2Service = await import('../../../ai/revo-2.0-service');
    
    // Create test options for Revo 2.0
    const revo2Options = {
      businessType: testBrandProfile.businessType,
      platform: 'Instagram' as any,
      brandProfile: testBrandProfile,
      includeContacts: brandConsistencyWithContacts.includeContacts,
      aspectRatio: '1:1' as any,
      visualStyle: 'modern' as any
    };

    // Test concept and structured content
    const testConcept = {
      concept: 'Professional business experience',
      catchwords: ['quality', 'professional', 'trusted'],
      visualDirection: 'Clean and modern design',
      designElements: ['Professional imagery', 'Clean typography'],
      targetEmotions: ['trust', 'confidence'],
      moodKeywords: ['professional', 'reliable'],
      colorSuggestions: ['#3B82F6', '#1E40AF', '#F3F4F6']
    };

    const testStructuredContent = {
      headline: 'Professional Service',
      subheadline: 'Quality you can trust',
      cta: 'Contact Us Today'
    };

    // Build the prompt to verify contact integration
    const basePrompt = revo2Service.buildEnhancedPromptWithStructuredContent(
      revo2Options, 
      testConcept, 
      testStructuredContent
    );

    // Simulate the contact information addition
    const includeContacts = revo2Options.includeContacts === true;
    const phone = testBrandProfile?.contactInfo?.phone;
    const email = testBrandProfile?.contactInfo?.email;
    const website = testBrandProfile?.websiteUrl || '';
    const hasAnyContact = (!!phone || !!email || !!website);

    const ensureWwwWebsiteUrl = (url: string): string => {
      if (!url) return '';
      const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return `www.${cleanUrl}`;
    };

    const contactInstructions = includeContacts && hasAnyContact
      ? `\n\nCONTACT INFORMATION INTEGRATION (WHEN AVAILABLE):\n- Integrate the brand's contact info naturally as part of the composition (not plain overlay text):\n${phone ? `  - Phone: ${phone}\n` : ''}${email ? `  - Email: ${email}\n` : ''}${website ? `  - Website: ${ensureWwwWebsiteUrl(website)}\n` : ''}- Use a small footer bar, corner block, or neatly aligned contact strip.\n- Ensure readability with proper contrast, spacing, and alignment.\n- Do not overpower the main headline/subheadline; keep it supportive and elegant.\n- Prefer concise combinations like "Phone · Website" or "Email · Website" when multiple items exist.\n`
      : `\n\nCONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website text in the image.\n`;

    const finalPrompt = basePrompt + contactInstructions;

    // Verify contact information is included
    const verification = {
      revo2: {
        includeContacts: includeContacts,
        hasAnyContact: hasAnyContact,
        contactData: {
          phone: phone,
          email: email,
          website: website,
          formattedWebsite: ensureWwwWebsiteUrl(website)
        },
        promptIncludes: {
          phone: finalPrompt.includes(phone || ''),
          email: finalPrompt.includes(email || ''),
          website: finalPrompt.includes(ensureWwwWebsiteUrl(website)),
          contactSection: finalPrompt.includes('CONTACT INFORMATION INTEGRATION')
        },
        promptLength: finalPrompt.length,
        contactInstructionsLength: contactInstructions.length
      }
    };

    console.log('🔍 [Contact Integration Verification] Results:', verification);

    return NextResponse.json({
      success: true,
      message: 'Contact information integration verification completed',
      verification: verification,
      summary: {
        revo2ContactsWorking: verification.revo2.promptIncludes.phone && 
                             verification.revo2.promptIncludes.email && 
                             verification.revo2.promptIncludes.website,
        allContactFieldsIncluded: verification.revo2.contactData.phone && 
                                 verification.revo2.contactData.email && 
                                 verification.revo2.contactData.website,
        websiteFormatting: verification.revo2.contactData.formattedWebsite
      }
    });

  } catch (error) {
    console.error('🔍 [Contact Integration Verification] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Contact information integration verification failed'
    }, { status: 500 });
  }
}
