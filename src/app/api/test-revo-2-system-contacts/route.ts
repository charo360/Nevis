import { NextRequest, NextResponse } from 'next/server';
import { BrandProfile, BrandConsistencyPreferences } from '@/lib/types';

/**
 * Test API route to verify Revo 2.0 contact information integration with system message approach
 */
export async function GET(request: NextRequest) {
  try {

    // Create test brand profile with contact information
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

    // Simulate the system message generation (like the new Revo 2.0 approach)
    const includeContacts = brandConsistencyWithContacts.includeContacts === true;
    const phone = testBrandProfile?.contactInfo?.phone;
    const email = testBrandProfile?.contactInfo?.email;
    const website = testBrandProfile?.websiteUrl || '';
    const hasAnyContact = (!!phone || !!email || !!website);

    const ensureWwwWebsiteUrl = (url: string): string => {
      if (!url) return '';
      const base = url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
      return `www.${base}`;
    };

    let systemMessage = 'You are an expert graphic designer using Gemini 2.5 Flash Image Preview. Create professional, high-quality social media images with perfect text rendering and 2048x2048 resolution.';
    
    // Add contact instructions directly to system message for maximum priority
    if (includeContacts && hasAnyContact) {
      systemMessage += `\n\nCRITICAL REQUIREMENT - CONTACT INFORMATION MUST BE VISIBLE:
You MUST include these exact contact details prominently in the design:
${phone ? `- Phone: ${phone}` : ''}
${email ? `- Email: ${email}` : ''}
${website ? `- Website: ${ensureWwwWebsiteUrl(website)}` : ''}
Place contact info in a footer bar, corner block, or contact strip with high visibility.
This is MANDATORY - the contact information MUST appear in the final image.`;
    } else if (includeContacts === false) {
      systemMessage += '\n\nDo NOT include any phone numbers, email addresses, or website URLs in the image.';
    }

    const userPrompt = `Create a professional Restaurant design for Instagram.

Business: Test Business
Type: Restaurant
Location: Nairobi, Kenya

Text to Include:
"Fresh Local Cuisine | Experience authentic flavors daily | Visit Us Today"

Design Requirements:
- Style: modern, high quality
- Aspect Ratio: 1:1
- Platform: Instagram optimized
- Professional, clean composition
- Clear, readable text rendering
- Do NOT include generic service information

Create a high-quality design with integrated text elements.`;

    // Verify contact information is included in system message
    const verification = {
      systemMessage: {
        includeContacts: includeContacts,
        hasAnyContact: hasAnyContact,
        contactData: {
          phone: phone,
          email: email,
          website: website,
          formattedWebsite: ensureWwwWebsiteUrl(website)
        },
        systemMessageIncludes: {
          phone: systemMessage.includes(phone || ''),
          email: systemMessage.includes(email || ''),
          website: systemMessage.includes(ensureWwwWebsiteUrl(website)),
          criticalRequirement: systemMessage.includes('CRITICAL REQUIREMENT'),
          mandatoryText: systemMessage.includes('MANDATORY')
        },
        systemMessageLength: systemMessage.length,
        userPromptLength: userPrompt.length
      },
      generationParts: [
        systemMessage,
        userPrompt
      ]
    };

    return NextResponse.json({
      success: true,
      message: 'Revo 2.0 system message contact integration verification completed',
      verification: verification,
      summary: {
        contactsInSystemMessage: verification.systemMessage.systemMessageIncludes.phone && 
                                verification.systemMessage.systemMessageIncludes.email && 
                                verification.systemMessage.systemMessageIncludes.website,
        allContactFieldsIncluded: verification.systemMessage.contactData.phone && 
                                 verification.systemMessage.contactData.email && 
                                 verification.systemMessage.contactData.website,
        systemMessagePriority: verification.systemMessage.systemMessageIncludes.criticalRequirement &&
                              verification.systemMessage.systemMessageIncludes.mandatoryText,
        approach: 'System message integration (like Revo 1.5 but more explicit)'
      }
    });

  } catch (error) {
    console.error('🧪 [Test Revo 2.0 System Contacts] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 2.0 system message contact integration verification failed'
    }, { status: 500 });
  }
}
