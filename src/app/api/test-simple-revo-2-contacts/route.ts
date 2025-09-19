import { NextRequest, NextResponse } from 'next/server';
import { BrandProfile, BrandConsistencyPreferences } from '@/lib/types';

/**
 * Simple test API route to verify Revo 2.0 contact information with minimal prompt
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Simple Revo 2.0 Contacts] Starting simple contact test...');

    // Create test brand profile with contact information
    const testBrandProfile: BrandProfile = {
      businessName: 'Test Restaurant',
      businessType: 'Restaurant',
      location: 'Nairobi, Kenya',
      visualStyle: 'modern',
      writingTone: 'professional',
      contentThemes: 'food,dining,restaurant',
      websiteUrl: 'www.testrestaurant.com',
      contactInfo: {
        phone: '+254-700-123-456',
        email: 'info@testrestaurant.com',
        address: '123 Test Street, Nairobi'
      }
    };

    // Test with contacts enabled
    const brandConsistencyWithContacts: BrandConsistencyPreferences = {
      strictConsistency: false,
      followBrandColors: true,
      includeContacts: true
    };

    // Create a VERY simple prompt similar to Revo 1.5 style
    const simpleBasePrompt = `Create a professional Restaurant design for Instagram.

Business: Test Restaurant
Type: Restaurant
Location: Nairobi, Kenya

Design Requirements:
- Style: Modern, clean design
- Text: "Fresh Local Cuisine | Experience authentic flavors daily | Visit Us Today"
- Colors: Use warm, appetizing colors
- Layout: Professional social media post format
- Quality: High-resolution, clear text rendering`;

    // Add contact information exactly like Revo 1.5
    const includeContacts = brandConsistencyWithContacts.includeContacts === true;
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

    const finalSimplePrompt = simpleBasePrompt + contactInstructions;

    console.log('🧪 [Simple Revo 2.0 Contacts] Simple prompt generated:', {
      basePromptLength: simpleBasePrompt.length,
      contactInstructionsLength: contactInstructions.length,
      finalPromptLength: finalSimplePrompt.length,
      containsPhone: finalSimplePrompt.includes('+254-700-123-456'),
      containsEmail: finalSimplePrompt.includes('info@testrestaurant.com'),
      containsWebsite: finalSimplePrompt.includes('www.testrestaurant.com')
    });

    return NextResponse.json({
      success: true,
      message: 'Simple Revo 2.0 contact integration test completed',
      testData: {
        brandProfile: {
          businessName: testBrandProfile.businessName,
          contactInfo: testBrandProfile.contactInfo,
          websiteUrl: testBrandProfile.websiteUrl
        },
        brandConsistency: brandConsistencyWithContacts,
        result: {
          basePromptLength: simpleBasePrompt.length,
          contactInstructionsLength: contactInstructions.length,
          finalPromptLength: finalSimplePrompt.length,
          containsPhone: finalSimplePrompt.includes('+254-700-123-456'),
          containsEmail: finalSimplePrompt.includes('info@testrestaurant.com'),
          containsWebsite: finalSimplePrompt.includes('www.testrestaurant.com'),
          promptPreview: finalSimplePrompt.substring(0, 300) + '...',
          contactSection: finalSimplePrompt.includes('CONTACT INFORMATION INTEGRATION') ? 
            finalSimplePrompt.split('CONTACT INFORMATION INTEGRATION')[1]?.substring(0, 200) + '...' || 'Not found' : 
            'Contact section not found'
        }
      }
    });

  } catch (error) {
    console.error('🧪 [Simple Revo 2.0 Contacts] Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Simple Revo 2.0 contact integration test failed'
    }, { status: 500 });
  }
}
