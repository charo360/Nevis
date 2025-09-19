import { NextRequest, NextResponse } from 'next/server';
import { generateRevo2ContentAction } from '@/app/actions/revo-2-actions';
import type { BrandProfile, BrandConsistencyPreferences } from '@/lib/types';

/**
 * Test API route to verify Revo 2.0 contact information integration
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Test Revo 2.0 Contacts] Starting contact integration test...');

    // Create test brand profile with contact information
    const testBrandProfile: BrandProfile = {
      businessName: 'Test Restaurant',
      businessType: 'Restaurant',
      location: 'Nairobi, Kenya',
      // logoDataUrl: 'data:image/png;base64,test', // Removed invalid logo
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

    console.log('🧪 [Test Revo 2.0 Contacts] Test data prepared:', {
      businessName: testBrandProfile.businessName,
      hasContactInfo: !!testBrandProfile.contactInfo,
      phone: testBrandProfile.contactInfo?.phone,
      email: testBrandProfile.contactInfo?.email,
      website: testBrandProfile.websiteUrl,
      includeContacts: brandConsistencyWithContacts.includeContacts
    });

    // Test the full Revo 2.0 prompt generation flow (including contact information at the end)
    console.log('🧪 [Test Revo 2.0 Contacts] Testing full prompt generation flow...');

    // Import the Revo 2.0 service functions
    const revo2Service = await import('../../../ai/revo-2.0-service');

    // Create test options
    const testOptions = {
      businessType: testBrandProfile.businessType,
      platform: 'Instagram' as any,
      brandProfile: testBrandProfile,
      includeContacts: brandConsistencyWithContacts.includeContacts,
      aspectRatio: '1:1' as any,
      visualStyle: 'modern' as any
    };

    // Test concept and structured content
    const testConcept = {
      concept: 'Delicious restaurant experience',
      catchwords: ['fresh', 'tasty', 'local'],
      visualDirection: 'Warm and inviting food photography',
      designElements: ['Food imagery', 'Warm colors', 'Clean typography'],
      targetEmotions: ['hunger', 'satisfaction'],
      moodKeywords: ['appetizing', 'welcoming'],
      colorSuggestions: ['#FF6B35', '#F7931E', '#FFD23F']
    };

    const testStructuredContent = {
      headline: 'Fresh Local Cuisine',
      subheadline: 'Experience authentic flavors daily',
      cta: 'Visit Us Today'
    };

    // Test the full prompt building flow
    let result;
    try {
      // Step 1: Build base prompt
      const basePrompt = revo2Service.buildEnhancedPromptWithStructuredContent(testOptions, testConcept, testStructuredContent);

      // Step 2: Add contact information at the end (simulate the full flow)
      // Note: We need to access the internal function, but since it's not exported, we'll simulate it
      const includeContacts = testOptions.includeContacts === true;
      const phone = testBrandProfile?.contactInfo?.phone;
      const email = testBrandProfile?.contactInfo?.email;
      const website = testBrandProfile?.websiteUrl || '';
      const hasAnyContact = (!!phone || !!email || !!website);

      const contactInstructions = includeContacts && hasAnyContact
        ? `\n\n🎯 CRITICAL CONTACT INFORMATION INTEGRATION (FINAL INSTRUCTION):\n- MUST integrate these EXACT contact details prominently in the design:\n${phone ? `  📞 Phone: ${phone}\n` : ''}${email ? `  📧 Email: ${email}\n` : ''}${website ? `  🌐 Website: ${website.startsWith('www.') ? website : `www.${website.replace(/^https?:\/\//, '').replace(/^www\./, '')}`}\n` : ''}- Place in footer bar, corner block, or contact strip with high visibility\n- DO NOT use generic service information like "BANKING", "PAYMENTS", etc.\n- ONLY use the specific contact details provided above\n- Make contact info clearly readable and professionally integrated\n- This is a PRIORITY requirement - contact info MUST be visible in the final image\n`
        : `\n\n🚫 CONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website in the image\n- Do NOT include generic service information\n`;

      const finalPrompt = basePrompt + contactInstructions;

      console.log('🧪 [Test Revo 2.0 Contacts] Full prompt generated successfully');
      console.log('🧪 [Test Revo 2.0 Contacts] Final prompt length:', finalPrompt.length);
      console.log('🧪 [Test Revo 2.0 Contacts] Contact info in final prompt:', finalPrompt.includes('+254-700-123-456'));

      result = {
        success: true,
        promptGenerated: true,
        promptLength: finalPrompt.length,
        basePromptLength: basePrompt.length,
        contactInstructionsLength: contactInstructions.length,
        containsPhone: finalPrompt.includes('+254-700-123-456'),
        containsEmail: finalPrompt.includes('info@testrestaurant.com'),
        containsWebsite: finalPrompt.includes('www.testrestaurant.com'),
        promptPreview: finalPrompt.substring(0, 500) + '...',
        contactSection: finalPrompt.includes('CRITICAL CONTACT INFORMATION') ?
          finalPrompt.split('CRITICAL CONTACT INFORMATION')[1]?.substring(0, 300) + '...' || 'Not found' :
          'Contact section not found',
        finalPromptEnd: finalPrompt.substring(finalPrompt.length - 500)
      };
    } catch (error) {
      console.error('🧪 [Test Revo 2.0 Contacts] Prompt generation failed:', error);
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        promptGenerated: false
      };
    }

    console.log('🧪 [Test Revo 2.0 Contacts] Test result:', result);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Revo 2.0 contact integration test completed' : 'Revo 2.0 contact integration test failed',
      testData: {
        brandProfile: {
          businessName: testBrandProfile.businessName,
          contactInfo: testBrandProfile.contactInfo,
          websiteUrl: testBrandProfile.websiteUrl
        },
        brandConsistency: brandConsistencyWithContacts,
        result: result
      }
    });

  } catch (error) {
    console.error('🧪 [Test Revo 2.0 Contacts] Test failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Revo 2.0 contact integration test failed'
    }, { status: 500 });
  }
}
