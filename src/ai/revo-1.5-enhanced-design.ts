/**
 * Revo 1.5 Enhanced Design Service
 * Two-step process: Gemini 2.5 Flash for design planning + Gemini 2.5 Flash Image Preview for final generation
 */

import { generateText, generateMultimodal, GEMINI_2_5_MODELS } from './google-ai-direct';
import { BrandProfile } from '@/lib/types';

/**
 * Get platform-specific aspect ratio for optimal social media display
 */
function getPlatformAspectRatio(platform: string): '1:1' | '16:9' | '9:16' | '21:9' | '4:5' {
  const platformLower = platform.toLowerCase();

  // Instagram Stories, Reels, TikTok - Vertical 9:16
  if (platformLower.includes('story') ||
    platformLower.includes('reel') ||
    platformLower.includes('tiktok')) {
    return '9:16';
  }

  // Facebook, Twitter/X, LinkedIn, YouTube - Landscape 16:9
  if (platformLower.includes('facebook') ||
    platformLower.includes('twitter') ||
    platformLower.includes('linkedin') ||
    platformLower.includes('youtube')) {
    return '16:9';
  }

  // Instagram Feed, Pinterest - Square 1:1 (default)
  return '1:1';
}

/**
 * Get platform-specific dimension text for prompts
 * MOBILE-FIRST: Optimized for 1080x1080px square format
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  switch (aspectRatio) {
    case '1:1': return 'Square format - 1080x1080px HD (Mobile-optimized)';
    case '16:9': return 'Square format - 1080x1080px HD (Mobile-optimized)';
    case '9:16': return 'Portrait format - 1080x1920px (Stories/Reels)';
    case '4:5': return 'Square format - 1080x1080px HD (Mobile-optimized)';
    case '21:9': return 'Square format - 1080x1080px HD (Mobile-optimized)';
    default: return 'Square format - 1080x1080px HD (Mobile-optimized)';
  }
}

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
- Aspect Ratio: ${(input as any).aspectRatio || getPlatformAspectRatio(input.platform)} (${getPlatformDimensionsText((input as any).aspectRatio || getPlatformAspectRatio(input.platform))})
- Visual Style: ${input.visualStyle}
- Text Content: "${input.imageText}"
- Include People: ${input.includePeopleInDesigns !== false ? 'Yes' : 'No'}
- Use Local Language: ${input.useLocalLanguage === true ? 'Yes' : 'No'}

REVO 1.5 PREMIUM DESIGN PRINCIPLES (UNIQUE TO REVO 1.5):
1. **Ultra-Modern Composition**: Use cutting-edge layout principles (asymmetrical balance, dynamic grids, fluid compositions)
2. **Intelligent Color Psychology**: Create sophisticated color schemes that trigger specific emotions and actions
3. **Premium Typography System**: Use exclusive font combinations with perfect weight distribution and spacing
4. **Advanced Visual Depth**: Multi-layered designs with sophisticated shadows, glows, and dimensional effects
5. **Seamless Brand Fusion**: Integrate brand elements as natural design components, not add-ons
6. **Platform-Specific Intelligence**: Optimize for each platform's unique algorithm and user behavior
7. **Emotional Architecture**: Design that builds emotional connection through visual storytelling
8. **Cultural Intelligence**: Subtle, authentic cultural elements that enhance rather than distract
9. **Micro-Interactions**: Design elements that suggest interactivity and engagement
10. **Future-Forward Aesthetics**: Trends that will remain relevant for 2+ years

REVO 1.5 EXCLUSIVE DESIGN STYLES (CHOOSE ONE):
1. **Neo-Minimalist**: Ultra-clean with strategic negative space, single focal point, premium typography
2. **Fluid Dynamics**: Organic shapes, flowing lines, gradient overlays, dynamic movement
3. **Geometric Precision**: Sharp angles, perfect symmetry, mathematical proportions, bold contrasts
4. **Layered Depth**: Multiple transparent layers, sophisticated shadows, 3D-like depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with artistic overlays, filters, and effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest buttons, hover effects, and engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Future-Tech**: Cutting-edge aesthetics, metallic elements, neon accents, sci-fi inspired

REVO 1.5 PREMIUM TYPOGRAPHY SYSTEM:
- **Headlines**: Use bold, modern fonts (Inter Bold, Poppins Black, Montserrat ExtraBold)
- **Subheadings**: Medium-weight fonts (Inter Medium, Poppins SemiBold, Montserrat Bold)
- **Body Text**: Clean, readable fonts (Inter Regular, Poppins Regular, Montserrat Regular)
- **Accent Text**: Distinctive fonts for CTAs (Nunito Bold, Source Sans Pro Bold)
- **Font Pairing Rules**: Maximum 2 fonts with strong contrast and complementary personalities
- **Weight Hierarchy**: 900 (headlines), 600 (subheadings), 400 (body), 700 (CTAs)
- **Spacing**: Generous letter-spacing for headlines, tight for body text
- **Line Height**: 1.2 for headlines, 1.4 for subheadings, 1.6 for body text

Create a detailed design plan including:
1. **Layout Strategy**: Composition approach and element placement
2. **Color Palette**: Extended palette based on brand colors
3. **Typography Plan**: Font selections and text hierarchy
4. **Visual Elements**: Icons, shapes, patterns to include
5. **Brand Integration**: How to incorporate logo and brand elements
6. **Mood & Atmosphere**: Overall feeling and aesthetic direction
7. **Technical Specs**: Aspect ratio, resolution, key measurements
8. **Style Selection**: Choose one of the 10 exclusive Revo 1.5 design styles
9. **Typography Hierarchy**: Specific font selections and weight distribution
10. **Visual Storytelling**: How the design tells the brand story

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

  // Enhanced target market representation for all locations
  const getTargetMarketInstructions = (location: string, businessType: string, targetAudience: string) => {
    const locationKey = location.toLowerCase();
    const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];
    
    // Get business-specific target market
    const getBusinessTargetMarket = (businessType: string) => {
      const businessTypeLower = businessType.toLowerCase();
      
      if (businessTypeLower.includes('restaurant') || businessTypeLower.includes('food') || businessTypeLower.includes('cafe')) {
        return 'diverse families, couples, food enthusiasts, local community members';
      } else if (businessTypeLower.includes('fitness') || businessTypeLower.includes('gym') || businessTypeLower.includes('health')) {
        return 'fitness enthusiasts, health-conscious individuals, athletes, people working out';
      } else if (businessTypeLower.includes('beauty') || businessTypeLower.includes('salon') || businessTypeLower.includes('spa')) {
        return 'beauty-conscious individuals, people getting beauty treatments, fashion-forward people';
      } else if (businessTypeLower.includes('retail') || businessTypeLower.includes('shop') || businessTypeLower.includes('store')) {
        return 'shoppers, customers browsing products, families shopping, fashion enthusiasts';
      } else if (businessTypeLower.includes('finance') || businessTypeLower.includes('bank') || businessTypeLower.includes('payment')) {
        return 'business professionals, entrepreneurs, people using financial services, tech-savvy individuals';
      } else if (businessTypeLower.includes('tech') || businessTypeLower.includes('software') || businessTypeLower.includes('digital')) {
        return 'tech professionals, entrepreneurs, digital natives, people using technology';
      } else if (businessTypeLower.includes('education') || businessTypeLower.includes('school') || businessTypeLower.includes('training')) {
        return 'students, teachers, parents, people learning, educational professionals';
      } else if (businessTypeLower.includes('real estate') || businessTypeLower.includes('property') || businessTypeLower.includes('housing')) {
        return 'homebuyers, families, property investors, people looking for homes';
      } else if (businessTypeLower.includes('automotive') || businessTypeLower.includes('car') || businessTypeLower.includes('vehicle')) {
        return 'car owners, drivers, automotive enthusiasts, people with vehicles';
      } else if (businessTypeLower.includes('healthcare') || businessTypeLower.includes('medical') || businessTypeLower.includes('clinic')) {
        return 'patients, healthcare workers, families, people seeking medical care';
      } else {
        return 'local community members, customers, people using the service';
      }
    };

    const targetMarket = getBusinessTargetMarket(businessType);
    
    // Check if it's an African country
    const isAfricanCountry = africanCountries.some(country => locationKey.includes(country));
    
    if (isAfricanCountry) {
      return `
**CRITICAL TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- MANDATORY: Include authentic Black/African people who represent the target market
- Show people who would actually use ${businessType} services: ${targetMarket}
- Display local African people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct with no deformations
- Emphasize cultural authenticity and local representation
- AVOID: Generic office workers - show people who match the target audience
- PRIORITY: 80%+ of people in the image should be Black/African when business is in African country
- Context: Show people in ${businessType}-relevant settings, not generic offices
- Target Audience: ${targetAudience || targetMarket}`;
    } else {
      return `
**TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- Include people who represent the target market: ${targetMarket}
- Show people who would actually use ${businessType} services
- Display people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- Context: Show people in ${businessType}-relevant settings, not generic offices
- Target Audience: ${targetAudience || targetMarket}`;
    }
  };

  const targetMarketInstructions = getTargetMarketInstructions(
    input.brandProfile.location || '', 
    input.businessType, 
    input.brandProfile.targetAudience || ''
  );

  // Clean business name pattern from image text
  const cleanBusinessNamePattern = (text: string): string => {
    let cleaned = text
      .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
      .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
      .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
      .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
      .trim();
    
    if (cleaned.length < 3) {
      return text;
    }
    
    return cleaned;
  };

  const cleanedImageText = cleanBusinessNamePattern(input.imageText);

  return `Create a premium ${input.platform} design following this comprehensive plan:

DESIGN PLAN CONTEXT:
${designPlan.plan}

BRAND INTEGRATION:
- Business: ${input.brandProfile.businessName}
- Colors: ${brandColors.join(', ')}
- Style: ${input.visualStyle}
- Logo: ${input.brandProfile.logoDataUrl ? 'Include brand logo prominently' : 'No logo available'}

TEXT CONTENT TO INCLUDE:
"${cleanedImageText}"

${targetMarketInstructions}

REVO 1.5 EXCLUSIVE PREMIUM REQUIREMENTS:
✨ ULTRA-MODERN AESTHETICS: Cutting-edge design that stands out from Revo 1.0
🎨 DYNAMIC COMPOSITION: Asymmetrical balance, fluid layouts, sophisticated visual hierarchy
🌈 INTELLIGENT COLOR PSYCHOLOGY: Color schemes that trigger specific emotions and actions
📝 PREMIUM TYPOGRAPHY SYSTEM: Exclusive font combinations with perfect weight distribution
🏢 SEAMLESS BRAND FUSION: Brand elements as natural design components, not add-ons
📱 PLATFORM-SPECIFIC INTELLIGENCE: Optimized for ${input.platform} algorithm and user behavior
🎯 EMOTIONAL ARCHITECTURE: Visual storytelling that builds emotional connection
✨ ADVANCED VISUAL DEPTH: Multi-layered designs with sophisticated shadows and glows
🚀 FUTURE-FORWARD AESTHETICS: Trends that will remain relevant for 2+ years
💫 MICRO-INTERACTIONS: Design elements that suggest interactivity and engagement

REVO 1.5 EXCLUSIVE DESIGN STYLE SELECTION:
Choose ONE of these 10 exclusive Revo 1.5 design styles (completely different from Revo 1.0):

1. **Neo-Minimalist**: Ultra-clean with strategic negative space, single focal point, premium typography
2. **Fluid Dynamics**: Organic shapes, flowing lines, gradient overlays, dynamic movement
3. **Geometric Precision**: Sharp angles, perfect symmetry, mathematical proportions, bold contrasts
4. **Layered Depth**: Multiple transparent layers, sophisticated shadows, 3D-like depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with artistic overlays, filters, and effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest buttons, hover effects, and engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Future-Tech**: Cutting-edge aesthetics, metallic elements, neon accents, sci-fi inspired

CRITICAL REQUIREMENTS:
- Aspect ratio: ${input.platform === 'Instagram' ? '1:1 (square)' : '16:9 (landscape)'}
- Resolution: Ultra-high quality (minimum 1024x1024)
- Text readability: ALL text must be crystal clear and readable
- Brand consistency: Follow brand colors and style guidelines
- Professional finish: Add depth, shadows, and premium visual effects
- No generic templates: Create unique, custom design
- MUST be completely different from Revo 1.0 designs
- Use one of the 10 exclusive Revo 1.5 design styles above

Generate a stunning, cutting-edge design that represents the pinnacle of ${input.platform} visual content using Revo 1.5's exclusive design system.`;
}

/**
 * Main Revo 1.5 Enhanced Design Generation Function
 */
export async function generateRevo15EnhancedDesign(
  input: Revo15DesignInput
): Promise<Revo15DesignResult> {
  const startTime = Date.now();

  // Auto-detect platform-specific aspect ratio
  const aspectRatio = getPlatformAspectRatio(input.platform);
  const enhancedInput = { ...input, aspectRatio };
  console.log(`🎯 Revo 1.5: Using ${aspectRatio} aspect ratio for ${input.platform}`);

  const enhancementsApplied: string[] = [
    'Two-Step Design Process',
    'Gemini 2.5 Flash Planning',
    'Gemini 2.5 Flash Image Preview Generation',
    'Advanced Design Strategy',
    'Premium Visual Quality',
    `Platform-Optimized ${aspectRatio} Format`
  ];

  try {

    // Step 1: Generate design plan with Gemini 2.5 Flash
    const designPlan = await generateDesignPlan(enhancedInput);
    enhancementsApplied.push('Strategic Design Planning');

    // Step 2: Generate final image with Gemini 2.5 Flash Image Preview
    const imageUrl = await generateFinalImage(enhancedInput, designPlan);
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
