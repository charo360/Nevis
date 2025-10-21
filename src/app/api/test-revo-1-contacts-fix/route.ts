import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {

    // Test brand profile with contact information
    const testBrandProfile = {
      businessName: 'Test Restaurant',
      businessType: 'Restaurant',
      location: 'Nairobi, Kenya',
      contactInfo: {
        phone: '+254-700-123-456',
        email: 'info@testrestaurant.com',
        address: '123 Test Street, Nairobi'
      },
      websiteUrl: 'testrestaurant.com',
      writingTone: 'professional',
      visualStyle: 'modern',
      primaryColor: '#3B82F6',
      targetAudience: 'Local food lovers',
      services: 'Fine dining, catering',
      keyFeatures: 'Fresh ingredients, authentic cuisine',
      competitiveAdvantages: 'Award-winning chef, local sourcing'
    };

    // Import Revo 1.0 config to check the template
    const { revo10Prompts } = await import('../../../ai/models/versions/revo-1.0/config');
    
    // Check if the content template still has duplicate contact instructions
    const contentTemplate = revo10Prompts.CONTENT_USER_PROMPT_TEMPLATE;
    
    const hasDuplicateContactInstructions = contentTemplate.includes('naturally incorporate contact information');
    const hasProperContactHandling = contentTemplate.includes('Contact information will be handled separately during image generation');
    
    // Build a sample content prompt to verify no contact duplication
    const sampleContentPrompt = contentTemplate
      .replace('{businessName}', testBrandProfile.businessName)
      .replace('{businessType}', testBrandProfile.businessType)
      .replace('{platform}', 'Instagram')
      .replace('{writingTone}', testBrandProfile.writingTone)
      .replace('{location}', testBrandProfile.location)
      .replace('{primaryColor}', testBrandProfile.primaryColor)
      .replace('{visualStyle}', testBrandProfile.visualStyle)
      .replace('{targetAudience}', testBrandProfile.targetAudience)
      .replace('{services}', testBrandProfile.services)
      .replace('{keyFeatures}', testBrandProfile.keyFeatures)
      .replace('{competitiveAdvantages}', testBrandProfile.competitiveAdvantages)
      .replace('{contentThemes}', 'food, dining')
      .replace('{includeContacts}', 'true')
      .replace('{contactPhone}', '') // Should be empty now
      .replace('{contactEmail}', '') // Should be empty now
      .replace('{contactAddress}', '') // Should be empty now
      .replace('{websiteUrl}', ''); // Should be empty now

    // Verify the fix
    const fixVerification = {
      success: true,
      fixApplied: !hasDuplicateContactInstructions && hasProperContactHandling,
      analysis: {
        duplicateContactInstructionsRemoved: !hasDuplicateContactInstructions,
        properContactHandlingAdded: hasProperContactHandling,
        contentTemplateLength: contentTemplate.length,
        samplePromptLength: sampleContentPrompt.length
      },
      templateChanges: {
        before: 'naturally incorporate contact information (phone, email, address, website) into the content',
        after: 'Contact information will be handled separately during image generation for optimal placement',
        impactOnGeneration: 'Contact information will now appear only once in footer/corner/strip, not duplicated in content'
      },
      expectedBehavior: {
        contentGeneration: 'No contact information in main content or CTA',
        imageGeneration: 'Contact information added only at the end for footer/corner/strip placement',
        result: 'Single, clean contact information display like Revo 1.5'
      }
    };

    return NextResponse.json({
      message: 'Revo 1.0 contact duplication fix verification completed',
      timestamp: new Date().toISOString(),
      testBrandProfile: {
        businessName: testBrandProfile.businessName,
        contactInfo: testBrandProfile.contactInfo,
        websiteUrl: testBrandProfile.websiteUrl
      },
      verification: fixVerification
    });

  } catch (error) {
    console.error('🚨 [Test Revo 1.0 Contacts Fix] Error:', error);
    return NextResponse.json({
      error: 'Failed to verify Revo 1.0 contact fix',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
