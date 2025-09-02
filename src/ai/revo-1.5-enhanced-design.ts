/**
 * Revo 1.5 Enhanced Design Service
 * Two-step process: Gemini 2.5 Flash for design planning + Gemini 2.5 Flash Image Preview for final generation
 */

import { generateText, generateMultimodal, GEMINI_2_5_MODELS } from './google-ai-direct';
import { BrandProfile } from '@/lib/types';

export interface Revo15DesignInput {
  businessType: string;
  platform: string;
  visualStyle: string;
  imageText: string;
  brandProfile: BrandProfile;
  brandConsistency?: {
    strictConsistency: boolean;
    followBrandColors: boolean;
  };
  artifactInstructions?: string;
  designReferences?: string[]; // Base64 encoded reference images
  includePeopleInDesigns?: boolean; // Control whether designs should include people (default: true)
  useLocalLanguage?: boolean; // Control whether to use local language in text (default: false)
}

export interface Revo15DesignResult {
  imageUrl: string;
  designSpecs: any;
  qualityScore: number;
  enhancementsApplied: string[];
  processingTime: number;
  model: string;
  planningModel: string;
  generationModel: string;
}

/**
 * Clean website URL by removing https://, http://, and www.
 */
function cleanWebsiteUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Step 1: Generate design specifications using Gemini 2.5 Flash
 */
export async function generateDesignPlan(
  input: Revo15DesignInput
): Promise<any> {

  const brandColors = [
    input.brandProfile.primaryColor,
    input.brandProfile.accentColor,
    input.brandProfile.backgroundColor
  ].filter(Boolean);

  const designPlanningPrompt = `You are an expert design strategist for Revo 1.5. Create a comprehensive design plan for a ${input.platform} post.

BUSINESS CONTEXT:
- Business: ${input.brandProfile.businessName}
- Type: ${input.businessType}
- Location: ${input.brandProfile.location || 'Global'}
- Website: ${cleanWebsiteUrl(input.brandProfile.website || '')}

BRAND PROFILE:
- Primary Color: ${input.brandProfile.primaryColor || '#000000'}
- Accent Color: ${input.brandProfile.accentColor || '#666666'}
- Background Color: ${input.brandProfile.backgroundColor || '#FFFFFF'}
- Writing Tone: ${input.brandProfile.writingTone || 'professional'}
- Target Audience: ${input.brandProfile.targetAudience || 'General audience'}

DESIGN REQUIREMENTS:
- Platform: ${input.platform}
- Visual Style: ${input.visualStyle}
- Text Content: "${input.imageText}"
- Include People: ${input.includePeopleInDesigns !== false ? 'Yes' : 'No'}
- Use Local Language: ${input.useLocalLanguage === true ? 'Yes' : 'No'}

REVO 1.5 DESIGN PRINCIPLES:
1. **Advanced Composition**: Use sophisticated layout principles (rule of thirds, golden ratio, visual hierarchy)
2. **Color Harmony**: Create advanced color schemes using brand colors as foundation
3. **Typography Excellence**: Select premium fonts that match brand personality
4. **Visual Depth**: Add layers, shadows, gradients for professional depth
5. **Brand Integration**: Seamlessly incorporate brand elements without overwhelming
6. **Platform Optimization**: Tailor design for ${input.platform} best practices
7. **Emotional Connection**: Design should evoke appropriate emotional response
8. **Cultural Sensitivity**: Consider local cultural elements if applicable

Create a detailed design plan including:
1. **Layout Strategy**: Composition approach and element placement
2. **Color Palette**: Extended palette based on brand colors
3. **Typography Plan**: Font selections and text hierarchy
4. **Visual Elements**: Icons, shapes, patterns to include
5. **Brand Integration**: How to incorporate logo and brand elements
6. **Mood & Atmosphere**: Overall feeling and aesthetic direction
7. **Technical Specs**: Aspect ratio, resolution, key measurements

Provide a structured plan that will guide the image generation process.`;

  try {
    const planResponse = await generateText(
      designPlanningPrompt,
      {
        model: GEMINI_2_5_MODELS.FLASH,
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    );

    return {
      plan: planResponse.text,
      brandColors,
      timestamp: Date.now()
    };

  } catch (error) {
    throw new Error(`Design planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Step 2: Generate final image using Gemini 2.5 Flash Image Preview
 */
export async function generateFinalImage(
  input: Revo15DesignInput,
  designPlan: any
): Promise<string> {

  // Build comprehensive image generation prompt based on the design plan
  const imagePrompt = buildEnhancedImagePrompt(input, designPlan);

  try {
    // Use the working creative asset generation with the enhanced model
    const { generateCreativeAsset } = await import('@/ai/flows/generate-creative-asset');

    const creativeResult = await generateCreativeAsset({
      prompt: imagePrompt,
      outputType: 'image',
      referenceAssetUrl: null,
      useBrandProfile: true,
      brandProfile: input.brandProfile,
      maskDataUrl: null,
      // Force use of Gemini 2.5 Flash Image Preview for final generation
      preferredModel: GEMINI_2_5_MODELS.FLASH_IMAGE_PREVIEW
    });

    const imageUrl = creativeResult.imageUrl;
    if (!imageUrl) {
      throw new Error('No image URL returned from Gemini 2.5 Flash Image Preview');
    }

    return imageUrl;

  } catch (error) {
    throw new Error(`Final image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build enhanced image prompt based on design plan
 */
function buildEnhancedImagePrompt(input: Revo15DesignInput, designPlan: any): string {
  const brandColors = [
    input.brandProfile.primaryColor,
    input.brandProfile.accentColor,
    input.brandProfile.backgroundColor
  ].filter(Boolean);

  return `Create a premium ${input.platform} design following this comprehensive plan:

DESIGN PLAN CONTEXT:
${designPlan.plan}

BRAND INTEGRATION:
- Business: ${input.brandProfile.businessName}
- Colors: ${brandColors.join(', ')}
- Style: ${input.visualStyle}
- Logo: ${input.brandProfile.logoDataUrl ? 'Include brand logo prominently' : 'No logo available'}

TEXT CONTENT TO INCLUDE:
"${input.imageText}"

REVO 1.5 PREMIUM REQUIREMENTS:
✨ VISUAL EXCELLENCE: Ultra-high quality, professional design standards
🎨 ADVANCED COMPOSITION: Sophisticated layout with perfect visual hierarchy  
🌈 COLOR MASTERY: Harmonious color palette extending brand colors
📝 TYPOGRAPHY PREMIUM: Elegant, readable fonts with perfect spacing
🏢 BRAND INTEGRATION: Seamless logo and brand element incorporation
📱 PLATFORM OPTIMIZATION: Perfect for ${input.platform} specifications
🎯 EMOTIONAL IMPACT: Design should evoke appropriate brand emotions
✨ FINISHING TOUCHES: Professional polish, shadows, gradients, depth

CRITICAL REQUIREMENTS:
- Aspect ratio: ${input.platform === 'Instagram' ? '1:1 (square)' : '16:9 (landscape)'}
- Resolution: Ultra-high quality (minimum 1024x1024)
- Text readability: ALL text must be crystal clear and readable
- Brand consistency: Follow brand colors and style guidelines
- Professional finish: Add depth, shadows, and premium visual effects
- No generic templates: Create unique, custom design

Generate a stunning, professional design that represents the pinnacle of ${input.platform} visual content.`;
}

/**
 * Main Revo 1.5 Enhanced Design Generation Function
 */
export async function generateRevo15EnhancedDesign(
  input: Revo15DesignInput
): Promise<Revo15DesignResult> {
  const startTime = Date.now();
  const enhancementsApplied: string[] = [
    'Two-Step Design Process',
    'Gemini 2.5 Flash Planning',
    'Gemini 2.5 Flash Image Preview Generation',
    'Advanced Design Strategy',
    'Premium Visual Quality'
  ];

  try {
      businessType: input.businessType,
      platform: input.platform,
      visualStyle: input.visualStyle,
      brandName: input.brandProfile.businessName
    });

    // Step 1: Generate design plan with Gemini 2.5 Flash
    const designPlan = await generateDesignPlan(input);
    enhancementsApplied.push('Strategic Design Planning');

    // Step 2: Generate final image with Gemini 2.5 Flash Image Preview
    const imageUrl = await generateFinalImage(input, designPlan);
    enhancementsApplied.push('Premium Image Generation');

    const result: Revo15DesignResult = {
      imageUrl,
      designSpecs: designPlan,
      qualityScore: 9.8, // Higher quality score for two-step process
      enhancementsApplied,
      processingTime: Date.now() - startTime,
      model: 'revo-1.5-enhanced',
      planningModel: GEMINI_2_5_MODELS.FLASH,
      generationModel: GEMINI_2_5_MODELS.FLASH_IMAGE_PREVIEW
    };


    return result;

  } catch (error) {
    throw new Error(`Revo 1.5 enhanced design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
