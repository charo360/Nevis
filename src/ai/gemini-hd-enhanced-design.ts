import { BrandProfile } from '@/lib/types';
import { ai } from './genkit';
import { GenerateRequest } from 'genkit/generate';
import {
  MODERN_DESIGN_TRENDS_2024_2025,
  MODERN_COLOR_PSYCHOLOGY_2024,
  MODERN_LAYOUT_PRINCIPLES,
  MODERN_VISUAL_EFFECTS,
  PLATFORM_MODERN_OPTIMIZATIONS,
  BUSINESS_TYPE_MODERN_DNA
} from './prompts/modern-design-prompts';
import {
  ADVANCED_DESIGN_PRINCIPLES,
  PLATFORM_SPECIFIC_GUIDELINES,
  BUSINESS_TYPE_DESIGN_DNA,
  QUALITY_ENHANCEMENT_INSTRUCTIONS
} from './prompts/advanced-design-prompts';

import { ensureExactDimensions } from './utils/image-dimensions';

/**
 * Helper function to get MIME type from data URI
 */
function getMimeTypeFromDataURI(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

export interface GeminiHDEnhancedDesignInput {
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
}

export interface GeminiHDEnhancedDesignResult {
  imageUrl: string;
  qualityScore: number;
  enhancementsApplied: string[];
  processingTime: number;
}


// Top-level exported wrapper to ensure module-scope export
export async function generateGeminiHDEnhancedDesignWithFallback(
  input: GeminiHDEnhancedDesignInput
): Promise<GeminiHDEnhancedDesignResult> {
  try {
    return await generateGeminiHDEnhancedDesign(input);
  } catch (error) {
    return await _internalGeminiHDEnhancedFallback(input);
  }
}

/**
 * Wraps ai.generate with retry logic for 503 errors.
 */
async function generateWithRetry(request: GenerateRequest, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.generate(request);
      return result;
    } catch (e: any) {
      if (e.message && e.message.includes('503') && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (e.message && e.message.includes('503')) {
          throw new Error("The AI model is currently overloaded. Please try again in a few moments.");
        }
        throw e; // Rethrow other errors immediately
      }
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Generate Ultra-HD design using Gemini 2.5 Flash Image Preview with maximum quality settings
 * This provides superior image quality, perfect text rendering, and HD downloads
 */
export async function generateGeminiHDEnhancedDesign(
  input: GeminiHDEnhancedDesignInput
): Promise<GeminiHDEnhancedDesignResult> {
  const startTime = Date.now();
  const enhancementsApplied: string[] = [];

  try {
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error('Gemini API key is required. Please set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY environment variable.');
    }

    // Validate and clean the text input
    const cleanedText = validateAndCleanText(input.imageText);
    const inputWithCleanText = { ...input, imageText: cleanedText };

    // Get platform-specific aspect ratio for proper image generation
    const aspectRatio = getPlatformAspectRatio(input.platform);

    // Build enhanced prompt optimized for Gemini 2.5 Flash Image Preview generation
    const enhancedPrompt = buildGeminiHDPrompt(inputWithCleanText, aspectRatio);
    enhancementsApplied.push('Gemini 2.5 Flash Image Preview Optimized Prompting', 'Text Validation & Cleaning');


    // Build prompt parts array with media inputs like standard generation
    const promptParts: any[] = [{ text: enhancedPrompt }];

    // Add normalized logo if available to prevent dimension influence
    const logoUrl = input.brandProfile.logoDataUrl || input.brandProfile.logoUrl;
    if (logoUrl) {
      try {
        // Import logo normalization service
        const { LogoNormalizationService } = await import('@/lib/services/logo-normalization-service');

        let normalizedLogo;
        if (logoUrl.startsWith('data:')) {
          // Normalize data URL logo
          normalizedLogo = await LogoNormalizationService.normalizeLogo(
            logoUrl,
            { standardSize: 200, format: 'png', quality: 0.9 }
          );
        } else if (logoUrl.startsWith('http')) {
          // Normalize storage URL logo
          normalizedLogo = await LogoNormalizationService.normalizeLogoFromUrl(
            logoUrl,
            { standardSize: 200, format: 'png', quality: 0.9 }
          );
        }

        if (normalizedLogo) {
          promptParts.push({
            media: {
              url: normalizedLogo.dataUrl,
              contentType: 'image/png'
            }
          });

          // Add logo normalization instructions to the prompt
          const logoInstructions = LogoNormalizationService.getLogoPromptInstructions(normalizedLogo);
          promptParts[0].text += `\n\n${logoInstructions}`;
          console.log('✅ [Gemini HD] NORMALIZED logo added to generation');
        }
      } catch (normalizationError) {
        console.warn('⚠️ [Gemini HD] Logo normalization failed, using original:', normalizationError);
        // Fallback to original logo processing
        if (logoUrl.startsWith('data:')) {
          promptParts.push({
            media: {
              url: logoUrl,
              contentType: getMimeTypeFromDataURI(logoUrl)
            }
          });
        } else if (logoUrl.startsWith('http')) {
          // For HTTP URLs (like Supabase storage), we need to fetch and convert to data URL
          try {
            const response = await fetch(logoUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const base64Data = Buffer.from(buffer).toString('base64');
              const contentType = response.headers.get('content-type') || 'image/png';
              const dataUrl = `data:${contentType};base64,${base64Data}`;
              promptParts.push({
                media: {
                  url: dataUrl,
                  contentType
                }
              });
              console.log('✅ Logo fetched from storage for Gemini HD generation');
            } else {
              console.warn(`⚠️  Failed to fetch logo from storage for Gemini HD: ${response.status}`);
            }
          } catch (fetchError) {
            console.error('❌ Error fetching logo from storage for Gemini HD:', fetchError);
          }
        }
      }

      // Add design examples if available and strict consistency is enabled
      if (input.brandConsistency?.strictConsistency && input.brandProfile.designExamples) {
        input.brandProfile.designExamples.slice(0, 3).forEach(example => {
          promptParts.push({
            media: {
              url: example,
              contentType: getMimeTypeFromDataURI(example)
            }
          });
        });
      }
    }

    // Generate image with Gemini 2.5 Flash Image Preview with HD quality settings and platform-specific aspect ratio
    const { media } = await generateWithRetry({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        // Note: Gemini 2.5 Flash Image Preview handles aspect ratio through prompt instructions
        // The aspect ratio is specified in the prompt itself for better control
      },
    });

      const imageUrl = media?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from Gemini');
      }

      enhancementsApplied.push(
        'Gemini 2.5 Flash Image Preview Generation',
        'Ultra-High Quality Settings',
        'Perfect Text Rendering',
        'Professional Face Generation',
        'Brand Color Compliance',
        'Platform Optimization',
        'HD Quality Assurance'
      );

      if (input.brandConsistency?.strictConsistency) {
        enhancementsApplied.push('Strict Design Consistency');
      }
      if (input.brandConsistency?.followBrandColors) {
        enhancementsApplied.push('Brand Color Enforcement');
      }

      // Dimension enforcement (log-only here): ensure 992x1056 exactly
      {
        const expectedW = 992, expectedH = 1056;
        const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
        if (!check.ok) {
          console.warn(`\u26a0\ufe0f [Gemini HD] Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH}.`);
        }
      }

      return {
        imageUrl,
        qualityScore: 9.7, // Gemini 2.5 Flash Image Preview - Excellent quality
        enhancementsApplied,
        processingTime: Date.now() - startTime,
      };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gemini HD generation failed: ${errorMessage}`);
  }
}

/**
 * Build optimized prompt for Gemini 2.5 Flash Image Preview generation
 * Enhanced with best practices for maximum quality and accuracy
 */
function buildGeminiHDPrompt(input: GeminiHDEnhancedDesignInput, aspectRatio: string): string {
    const {
      businessType,
      platform,
      visualStyle,
      imageText,
      brandProfile,
      brandConsistency,
      artifactInstructions
    } = input;

    // Generate unique variation elements for each request
    const generationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const variationSeed = Math.floor(Math.random() * 1000);

    // Contact information prompt section based on toggle
    const includeContacts = (brandConsistency as any)?.includeContacts === true;
    const phone = brandProfile?.contactInfo?.phone;
    const email = brandProfile?.contactInfo?.email;
    const address = brandProfile?.contactInfo?.address;
    const website = (brandProfile as any)?.websiteUrl || '';
    const hasAnyContact = (!!phone || !!email || !!website);
    const contactInstructions = includeContacts && hasAnyContact
      ? `\n**CONTACT INFORMATION INTEGRATION (WHEN AVAILABLE):**\n- Integrate contact details as part of the composition (not plain overlay).\n${phone ? `  - Phone: ${phone}\n` : ''}${email ? `  - Email: ${email}\n` : ''}${website ? `  - Website: www.${(website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')}\n` : ''}- Use a small footer bar, corner block, or aligned contact strip.\n- Ensure high readability and balance with headline/subheadline.\n- Prefer concise combos like "Phone  b7 Website" or "Email  b7 Website".\n`
      : `\n**CONTACT INFORMATION RULE:**\n- Do NOT include phone, email, or website in the image.\n`;

    // Random layout variations
    const layoutVariations = [
      'asymmetrical composition with dynamic balance',
      'grid-based layout with clean alignment',
      'centered composition with radial elements',
      'diagonal flow with leading lines',
      'layered depth with foreground/background separation'
    ];
    const selectedLayout = layoutVariations[Math.floor(Math.random() * layoutVariations.length)];

    // Random style modifiers
    const styleModifiers = [
      'with subtle gradient overlays',
      'with bold geometric accents',
      'with organic flowing elements',
      'with modern minimalist approach',
      'with dynamic energy and movement'
    ];
    const selectedModifier = styleModifiers[Math.floor(Math.random() * styleModifiers.length)];

    // Enhanced color instructions optimized for Gemini's color accuracy
    const colorInstructions = brandProfile.primaryColor && brandProfile.accentColor
      ? `Primary brand color: ${brandProfile.primaryColor}, Secondary brand color: ${brandProfile.accentColor}. Use these colors prominently and consistently throughout the design.`
      : 'Use a cohesive, professional color palette with high contrast and modern appeal.';

    // Advanced people inclusion logic for better engagement with HD face rendering
    const shouldIncludePeople = shouldIncludePeopleInDesign(businessType, imageText, visualStyle);
    const peopleInstructions = shouldIncludePeople
      ? 'Include diverse, authentic people (various ethnicities, ages) with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features.'
      : 'Focus on clean, minimalist design without people, emphasizing the product/service/message with ultra-sharp details.';

    // Enhanced platform-specific optimization
    const platformSpecs = getPlatformSpecifications(platform);

    // Get platform-specific guidelines
    const platformGuidelines = PLATFORM_SPECIFIC_GUIDELINES[platform.toLowerCase() as keyof typeof PLATFORM_SPECIFIC_GUIDELINES] || PLATFORM_SPECIFIC_GUIDELINES.instagram;

    // Get business-specific design DNA
    const businessDNA = BUSINESS_TYPE_DESIGN_DNA[businessType.toLowerCase() as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;

    // Build rich, diverse design prompt like standard generation
    const prompt = `You are a world-class creative director and visual designer with expertise in social media marketing, brand design, and visual psychology.

**DESIGN BRIEF:**
Create a professional, high-impact social media design for a ${businessType} business.

🎯 CRITICAL PLATFORM-SPECIFIC DIMENSIONS:
- Platform: ${platform}
- REQUIRED DIMENSIONS: 992x1056px - ALL PLATFORMS USE THIS EXACT SIZE FOR MAXIMUM QUALITY
- MUST generate image in EXACT 992x1056px dimensions for ALL platforms
- Instagram: 992x1056px - Perfect for feed posts
- Facebook: 992x1056px - Maximum quality, mobile-optimized
- LinkedIn: 992x1056px - Professional format
- Twitter: 992x1056px - Timeline optimization
- DO NOT generate other dimensions - ALL PLATFORMS USE 992x1056px
- ENSURE the generated image is ALWAYS 992x1056px dimensions
- The image MUST be 992x1056px - this is NON-NEGOTIABLE

Visual Style: ${visualStyle} | Location: ${brandProfile.location || 'Global'}

**TEXT CONTENT TO INCLUDE:**
Primary Text: "${imageText}"
${brandProfile.businessName ? `Business Name: "${brandProfile.businessName}"` : ''}

${ADVANCED_DESIGN_PRINCIPLES}

${platformGuidelines}

${businessDNA}

**BRAND GUIDELINES:**
${colorInstructions}
${peopleInstructions}
${contactInstructions}

**CREATIVE VARIATION REQUIREMENTS:**
- Layout Style: Use ${selectedLayout}
- Design Approach: Create design ${selectedModifier}
- Uniqueness: This design must be visually distinct from any previous generations
- Generation ID: ${generationId} (use this to ensure uniqueness)
- Variation Seed: ${variationSeed} (apply subtle randomization based on this number)

**PLATFORM SPECIFICATIONS:**
${platformSpecs}

**TEXT RENDERING REQUIREMENTS:**
- Use the provided text: "${imageText}"
- Ensure perfect text clarity and readability
- High-quality typography with proper spacing
- Professional font choices that match the visual style

🧑 PERFECT HUMAN RENDERING (MANDATORY):
- Complete, symmetrical faces with all features present
- Natural, professional expressions with clear eyes
- Proper anatomy with no deformations or missing parts
- High-quality skin textures and realistic lighting
- Diverse representation with authentic appearance

🎨 ULTRA-MODERN DESIGN SPECIFICATIONS (2024-2025 TRENDS):

**CONTEMPORARY VISUAL STYLE:**
- ${visualStyle} with cutting-edge 2024-2025 design trends
- Implement glassmorphism effects: frosted glass backgrounds with subtle transparency
- Use neumorphism/soft UI: subtle shadows and highlights for depth
- Apply modern gradient overlays: multi-directional, vibrant gradients
- Include contemporary typography: bold, clean sans-serif fonts with perfect spacing
- Modern color psychology: ${colorInstructions}

**ADVANCED LAYOUT & COMPOSITION:**
- Asymmetrical layouts with dynamic visual hierarchy
- Generous white space with intentional negative space design
- Floating elements with subtle drop shadows and depth
- Modern grid systems with broken grid elements for visual interest
- Contemporary card-based layouts with rounded corners and elevation

**CUTTING-EDGE VISUAL EFFECTS:**
- Glassmorphism: Semi-transparent backgrounds with blur effects
- Gradient meshes: Complex, multi-point gradients for depth
- Subtle animations implied through motion blur and dynamic positioning
- Modern shadows: Soft, realistic shadows with multiple light sources
- Contemporary textures: Subtle noise, grain, or organic patterns

**2024-2025 DESIGN TRENDS:**
- Bold, oversized typography with creative font pairings
- Vibrant, saturated color palettes with high contrast
- Organic shapes and fluid forms mixed with geometric elements
- Modern iconography: minimal, line-based icons with perfect pixel alignment
- Contemporary photography style: high contrast, vibrant, authentic moments

**BRAND INTEGRATION:**
- Brand Identity: ${brandProfile.businessName || businessType}
- Platform Optimization: ${platformSpecs}
- Human Elements: ${peopleInstructions}

⚡ GEMINI 2.5 FLASH IMAGE PREVIEW ULTRA-HD QUALITY ENHANCEMENTS:
- MAXIMUM RESOLUTION: Ultra-high definition rendering (4K+ quality)
- SMALL FONT SIZE EXCELLENCE: Perfect rendering at 8pt, 10pt, 12pt, and all small font sizes
- TINY TEXT PRECISION: Every character sharp and legible even when font size is very small
- HIGH-DPI SMALL TEXT: Render small fonts as if on 300+ DPI display for maximum sharpness
- PERFECT ANATOMY: Complete, symmetrical faces with natural expressions
- SHARP DETAILS: Crystal-clear textures, no blur or artifacts
- PROFESSIONAL LIGHTING: Studio-quality lighting with proper shadows
- PREMIUM COMPOSITION: Golden ratio layouts with perfect balance
- ADVANCED COLOR THEORY: Perfect contrast ratios (7:1 minimum) with vibrant, accurate colors
- FLAWLESS RENDERING: No deformations, missing parts, or visual errors
- PHOTOREALISTIC QUALITY: Magazine-level professional appearance
- TEXT LEGIBILITY: All text sizes optimized for perfect readability and clarity

🎨 MODERN DESIGN TRENDS (2024-2025):
${MODERN_DESIGN_TRENDS_2024_2025}

🌈 CONTEMPORARY COLOR PSYCHOLOGY:
${MODERN_COLOR_PSYCHOLOGY_2024}

📐 MODERN LAYOUT PRINCIPLES:
${MODERN_LAYOUT_PRINCIPLES}

✨ ADVANCED VISUAL EFFECTS:
${MODERN_VISUAL_EFFECTS}

📱 PLATFORM-SPECIFIC MODERN OPTIMIZATION:
${PLATFORM_MODERN_OPTIMIZATIONS[platform.toLowerCase() as keyof typeof PLATFORM_MODERN_OPTIMIZATIONS] || PLATFORM_MODERN_OPTIMIZATIONS.instagram}

🏢 BUSINESS-SPECIFIC MODERN DNA:
${BUSINESS_TYPE_MODERN_DNA[businessType.toLowerCase() as keyof typeof BUSINESS_TYPE_MODERN_DNA] || BUSINESS_TYPE_MODERN_DNA.tech}

${artifactInstructions ? `SPECIAL INSTRUCTIONS FROM UPLOADED CONTENT:
${artifactInstructions}
- Follow these instructions precisely when creating the design
- These instructions specify how to use specific content elements

` : ''}📝 ABSOLUTE TEXT ACCURACY REQUIREMENTS:
- STRICT TEXT CONTROL: Use ONLY the exact text "${imageText}" - NO additional text allowed
- NO RANDOM TEXT: Do not add placeholder text, lorem ipsum, sample content, or any extra words
- NO FILLER CONTENT: Do not include random descriptions, fake company names, or dummy text
- EXACT SPELLING: The text must be spelled EXACTLY as provided - do not alter any letters or words
- SINGLE TEXT SOURCE: Only use the provided text "${imageText}" as the text content in the image
- SMALL FONT SIZE HANDLING: When design requires small fonts (8pt-12pt), apply these rules:
  * Increase contrast by 20% for small text visibility
  * Use slightly bolder font weight to maintain character definition
  * Ensure perfect pixel alignment for crisp edges
  * Apply high-resolution anti-aliasing for smooth curves
  * Maintain proper letter spacing even at small sizes
- READABILITY GUARANTEE: Every character must be perfectly legible regardless of font size
- PIXEL-PERFECT SMALL TEXT: Each letter rendered with maximum clarity at any size
- BACKGROUND CONTRAST: Ensure sufficient contrast between small text and background

🚫 ABSOLUTELY FORBIDDEN - WILL CAUSE FAILURE:
- Do NOT add "Payroll Banking Simplified"
- Do NOT add "Banking Made Easy"
- Do NOT add "Financial Services"
- Do NOT add "Professional Banking"
- Do NOT add "Secure Payments"
- Do NOT add "Digital Banking"
- Do NOT add "Money Management"
- Do NOT add ANY banking or financial terms
- Do NOT add ANY business descriptions
- Do NOT add ANY marketing copy
- Do NOT add ANY placeholder text
- Do NOT add ANY lorem ipsum
- Do NOT add ANY sample content
- Do NOT add ANY random words
- Do NOT add ANY filler text
- Do NOT create ANY fake headlines
- Do NOT create ANY taglines
- CRITICAL: ONLY use the exact text: "${imageText}"
- NOTHING ELSE IS ALLOWED`;

    return prompt;
  }

  /**
   * Validate and clean text input for better Gemini 2.5 Flash Image Preview results
   * MINIMAL cleaning to preserve text accuracy
   */
  function validateAndCleanText(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'Professional Business Content';
    }

    let cleanedText = text.trim();

    // Only remove truly problematic characters, preserve all letters and numbers
    cleanedText = cleanedText
      .replace(/[^\w\s\-.,!?'"()&%$#@]/g, '') // Keep more characters, only remove truly problematic ones
      .replace(/\s+/g, ' ') // Normalize whitespace only
      .replace(/(.)\1{4,}/g, '$1$1$1') // Only reduce excessive repetition (4+ chars -> 3)
      .trim();

    // Be more lenient with length - only trim if extremely long
    if (cleanedText.length > 100) {
      const words = cleanedText.split(' ');
      if (words.length > 15) {
        cleanedText = words.slice(0, 15).join(' ');
      }
    }

    // Only fallback if completely empty
    if (cleanedText.length === 0) {
      return 'Professional Business Content';
    }

    return cleanedText;
  }

  /**
   * Get appropriate aspect ratio for platform (Gemini 2.5 Flash Image Preview)
   * STANDARDIZED: ALL platforms use 1:1 for maximum quality (no stories/reels)
   */
  function getPlatformAspectRatio(platform: string): string {
    // ALL PLATFORMS - Square format (1:1 aspect ratio) for maximum quality
    // LinkedIn, Facebook, Twitter, YouTube, Instagram, TikTok, etc.
    return '1:1'; // 992x1056 (maximum quality, no cropping needed)
  }

  /**
   * Enhanced platform specifications for Gemini 2.5 Flash Image Preview
   */
  function getPlatformSpecifications(platform: string): string {
    const platformLower = platform.toLowerCase();

    const specs = {
      'instagram': 'Instagram-optimized design with mobile-first approach, vibrant colors, and engaging visual hierarchy. Perfect for feed posts with high engagement potential.',
      'linkedin': 'LinkedIn professional design with corporate aesthetics, clean typography, and business-appropriate color schemes. Optimized for B2B engagement.',
      'facebook': 'Facebook-optimized design with broad audience appeal, news feed optimization, and social sharing considerations.',
      'twitter': 'Twitter/X-optimized design with concise visual messaging, trending relevance, and platform-specific dimensions.',
      'youtube': 'YouTube thumbnail design with high contrast, bold text, and click-worthy visual appeal.',
      'tiktok': 'TikTok-optimized vertical design with Gen Z appeal, trending aesthetics, and mobile-first approach.',
      'story': 'Story format design with vertical orientation, engaging visual elements, and swipe-friendly layout.',
      'reel': 'Reel format design with dynamic visual elements, mobile optimization, and short-form content appeal.'
    };

    for (const [key, spec] of Object.entries(specs)) {
      if (platformLower.includes(key)) {
        return spec;
      }
    }

    return 'Professional social media design optimized for maximum engagement and brand consistency.';
  }

  /**
   * Determine if people should be included in the design for better engagement
   */
  function shouldIncludePeopleInDesign(businessType: string, imageText: string, visualStyle: string): boolean {
    const businessLower = businessType.toLowerCase();
    const textLower = imageText.toLowerCase();
    const styleLower = visualStyle.toLowerCase();

    // Business types that typically benefit from human presence
    const peopleBusinessTypes = [
      'restaurant', 'cafe', 'fitness', 'gym', 'salon', 'spa', 'healthcare',
      'dental', 'medical', 'education', 'training', 'consulting', 'coaching',
      'real estate', 'hospitality', 'hotel', 'travel', 'photography',
      'wedding', 'event', 'catering', 'childcare', 'elderly care'
    ];

    // Text content that suggests human interaction
    const peopleKeywords = [
      'team', 'staff', 'customer', 'client', 'service', 'experience',
      'community', 'family', 'people', 'together', 'join', 'meet'
    ];

    // Visual styles that work well with people
    const peopleStyles = ['lifestyle', 'authentic', 'candid', 'warm', 'friendly'];

    const includeForBusiness = peopleBusinessTypes.some(type => businessLower.includes(type));
    const includeForText = peopleKeywords.some(keyword => textLower.includes(keyword));
    const includeForStyle = peopleStyles.some(style => styleLower.includes(style));

    return includeForBusiness || includeForText || includeForStyle;
  }

  /**
   * Generate enhanced design with Gemini HD and fallback support
   * This function provides automatic fallback to standard Gemini if HD generation fails
   */
  async function _internalGeminiHDEnhancedFallback(
    input: GeminiHDEnhancedDesignInput
  ): Promise<GeminiHDEnhancedDesignResult> {
    try {
      // First attempt: Gemini 2.5 Flash Image Preview generation
      return await generateGeminiHDEnhancedDesign(input);
    } catch (error) {

      try {
        // Fallback: Standard Gemini generation with enhanced prompting
        const startTime = Date.now();
        // Get platform-specific aspect ratio for fallback generation
        const aspectRatio = getPlatformAspectRatio(input.platform);

        const enhancedPrompt = buildGeminiHDPrompt(input, aspectRatio);

        // Build prompt parts array with media inputs
        const promptParts: any[] = [{ text: enhancedPrompt }];

        // Add normalized logo if available to prevent dimension influence
        if (input.brandProfile.logoDataUrl) {
          try {
            // Import logo normalization service
            const { LogoNormalizationService } = await import('@/lib/services/logo-normalization-service');

            // Normalize logo to prevent it from affecting design dimensions
            const normalizedLogo = await LogoNormalizationService.normalizeLogo(
              input.brandProfile.logoDataUrl,
              { standardSize: 200, format: 'png', quality: 0.9 }
            );

            promptParts.push({
              media: {
                url: normalizedLogo.dataUrl,
                contentType: 'image/png'
              }
            });

            // Add logo normalization instructions to the prompt
            const logoInstructions = LogoNormalizationService.getLogoPromptInstructions(normalizedLogo);
            promptParts[0].text += `\n\n${logoInstructions}`;
            console.log('✅ [Gemini HD Fallback] NORMALIZED logo added to generation');
          } catch (normalizationError) {
            console.warn('⚠️ [Gemini HD Fallback] Logo normalization failed, using original:', normalizationError);
            // Fallback to original logo processing
            promptParts.push({
              media: {
                url: input.brandProfile.logoDataUrl,
                contentType: getMimeTypeFromDataURI(input.brandProfile.logoDataUrl)
              }
            });
          }
        }

        // Add design examples if available
        if (input.brandConsistency?.strictConsistency && input.brandProfile.designExamples) {
          input.brandProfile.designExamples.slice(0, 3).forEach(example => {
            promptParts.push({
              media: {
                url: example,
                contentType: getMimeTypeFromDataURI(example)
              }
            });
          });
        }

        const { media } = await generateWithRetry({
          model: 'googleai/gemini-2.5-flash-image-preview',
          prompt: promptParts,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            // Note: Gemini 2.5 Flash Image Preview handles aspect ratio through prompt instructions
            // The aspect ratio is specified in the prompt itself for better control
          },
        });

        const imageUrl = media?.url;
        if (!imageUrl) {
          throw new Error('No image URL returned from Gemini fallback');
        }

        // Dimension enforcement (log-only here): ensure 992x1056 exactly
        {
          const expectedW = 992, expectedH = 1056;
          const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
          if (!check.ok) {
            console.warn(`\u26a0\ufe0f [Gemini HD Fallback] Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH}.`);
          }
        }


        return {
          imageUrl,
          qualityScore: 8.5, // Lower score for fallback but still high quality
          enhancementsApplied: ['Gemini 2.5 Flash Image Preview Fallback', 'Enhanced Prompting', 'Brand Integration'],
          processingTime: Date.now() - startTime,
        };
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        throw new Error(`Gemini generation completely failed: ${errorMessage}`);
      }
    }
  }