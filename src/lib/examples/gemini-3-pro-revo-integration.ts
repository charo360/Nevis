/**
 * Example: Gemini 3 Pro Integration with Revo 2.0
 * Shows how to use Gemini 3 Pro for high-quality image generation
 */

import { generateGemini3ProImage, generateInfluencerImage, generateRevo2AdImage } from '../services/gemini-3-pro';

// ============================================================================
// EXAMPLE 1: Basic High-Resolution Image Generation
// ============================================================================

export async function example1_BasicImageGeneration() {
  const prompt = `
    A professional Kenyan businesswoman using a mobile banking app on her smartphone.
    Modern office setting with natural lighting. She's smiling confidently while 
    making a payment. Clean, professional aesthetic. Brand colors: red and dark gray.
  `;

  const imageDataUrl = await generateGemini3ProImage(prompt, {
    aspectRatio: '3:4', // Instagram portrait
    imageSize: '1K', // High resolution
    temperature: 0.7
  });

  console.log('✅ Generated image:', imageDataUrl.substring(0, 50) + '...');
  return imageDataUrl;
}

// ============================================================================
// EXAMPLE 2: Influencer-Style Persona Images
// ============================================================================

export async function example2_InfluencerPersona() {
  // Step 1: Define persona (this would come from AI analysis in real app)
  const personaDescription = `
    A 28-year-old Kenyan woman with natural curly hair, warm brown skin tone,
    bright smile, wearing modern casual business attire. Athletic build, 
    confident posture, approachable demeanor.
  `;

  // Step 2: Generate different scenarios with same persona
  const scenarios = [
    'Working on laptop in a trendy Nairobi coffee shop, morning light streaming through windows',
    'Making a mobile payment at a local market, surrounded by colorful produce',
    'Video call with team members, home office setup with plants in background'
  ];

  const images = await Promise.all(
    scenarios.map(scenario => 
      generateInfluencerImage(personaDescription, scenario, {
        aspectRatio: '3:4',
        imageSize: '1K'
      })
    )
  );

  console.log(`✅ Generated ${images.length} influencer images with consistent persona`);
  return images;
}

// ============================================================================
// EXAMPLE 3: Revo 2.0 Ad Generation with Platform-Specific Ratios
// ============================================================================

export async function example3_Revo2AdGeneration() {
  const adPrompt = `
    Paya mobile banking advertisement. Young Kenyan entrepreneur using smartphone
    to accept instant payment from customer. Market stall background with fresh 
    produce. Text overlay: "Get Paid Instantly - No Waiting". 
    Brand colors: #E4574C (red) and #2A2A2A (dark gray).
    Professional, trustworthy, modern aesthetic.
  `;

  // Generate for different platforms
  const platforms = ['instagram', 'facebook', 'tiktok'] as const;
  
  const platformImages = await Promise.all(
    platforms.map(platform =>
      generateRevo2AdImage(adPrompt, platform, {
        imageSize: '1K',
        temperature: 0.7
      })
    )
  );

  console.log('✅ Generated ads for:', platforms.join(', '));
  return platformImages;
}

// ============================================================================
// EXAMPLE 4: Multi-Angle Marketing Campaign (Revo 2.0 Style)
// ============================================================================

export async function example4_MultiAngleCampaign() {
  const businessName = 'Paya';
  const service = 'Mobile Banking & Payments';
  
  // Different marketing angles (from Revo 2.0 framework)
  const angles = [
    {
      angle: 'Feature Focus',
      prompt: `${businessName} ad highlighting instant payment feature. Close-up of 
               smartphone screen showing "Payment Confirmed in 3 seconds" notification.
               Happy customer in background. Modern, clean design.`
    },
    {
      angle: 'Use Case',
      prompt: `${businessName} ad showing rent payment scenario. Young professional 
               at home, 11 PM, using phone to pay rent instantly. Relief and satisfaction 
               on face. Cozy home setting.`
    },
    {
      angle: 'Problem-Solution',
      prompt: `${businessName} ad contrasting bank queue vs mobile banking. Split screen:
               left shows frustrated people in long bank queue, right shows relaxed person 
               using phone app at home. Clear before/after visual.`
    },
    {
      angle: 'Social Proof',
      prompt: `${businessName} ad showing community impact. Group of small business owners
               in Nairobi market, all using the app. Text: "Join 1M+ Kenyans". 
               Diverse, authentic, community-focused.`
    }
  ];

  const campaignImages = await Promise.all(
    angles.map(({ angle, prompt }) =>
      generateGemini3ProImage(prompt, {
        aspectRatio: '3:4',
        imageSize: '1K',
        temperature: 0.8 // Slightly higher for creative variety
      }).then(image => ({ angle, image }))
    )
  );

  console.log('✅ Generated multi-angle campaign with', campaignImages.length, 'variations');
  return campaignImages;
}

// ============================================================================
// EXAMPLE 5: Brand Logo Integration
// ============================================================================

export async function example5_BrandLogoIntegration() {
  // In real app, this would be the actual brand logo as base64
  const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const adPrompt = `
    Professional fintech advertisement. Modern smartphone displaying mobile 
    banking dashboard with transaction history. Clean white background, 
    professional lighting. Minimalist design. Brand logo should appear 
    in bottom right corner.
  `;

  const imageWithLogo = await generateGemini3ProImage(adPrompt, {
    aspectRatio: '3:4',
    imageSize: '1K',
    logoImage: logoBase64
  });

  console.log('✅ Generated image with brand logo integration');
  return imageWithLogo;
}

// ============================================================================
// EXAMPLE 6: Batch Variation Generation
// ============================================================================

export async function example6_BatchVariations() {
  const basePrompt = `
    Paya mobile payment ad. Kenyan small business owner accepting payment 
    via smartphone. Market setting, authentic local context. Professional 
    yet approachable aesthetic.
  `;

  // Generate 5 variations with different compositions
  const variations = await Promise.all(
    Array.from({ length: 5 }, (_, i) => 
      generateGemini3ProImage(`${basePrompt} Variation ${i + 1}: unique angle and composition.`, {
        aspectRatio: '3:4',
        imageSize: '1K',
        temperature: 0.9 // Higher temperature for more variety
      })
    )
  );

  console.log(`✅ Generated ${variations.length} unique variations`);
  return variations;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export async function runAllExamples() {
  console.log('🚀 Starting Gemini 3 Pro + Revo 2.0 Integration Examples\n');

  try {
    console.log('📸 Example 1: Basic Image Generation');
    await example1_BasicImageGeneration();
    console.log('');

    console.log('👤 Example 2: Influencer Persona');
    await example2_InfluencerPersona();
    console.log('');

    console.log('📱 Example 3: Platform-Specific Ads');
    await example3_Revo2AdGeneration();
    console.log('');

    console.log('🎯 Example 4: Multi-Angle Campaign');
    await example4_MultiAngleCampaign();
    console.log('');

    console.log('🏷️ Example 5: Brand Logo Integration');
    await example5_BrandLogoIntegration();
    console.log('');

    console.log('🔄 Example 6: Batch Variations');
    await example6_BatchVariations();
    console.log('');

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
    throw error;
  }
}
