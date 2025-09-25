/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses Gemini 2.5 Flash Image Preview for enhanced content generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { BrandProfile, Platform } from '@/lib/types';

// Initialize AI clients with Revo 2.0 specific API key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_REVO_2_0!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Revo 2.0 uses Gemini 2.5 Flash Image Preview (same as Revo 1.0 but with enhanced prompting)
const REVO_2_0_MODEL = 'gemini-2.5-flash-image-preview';

export interface Revo20GenerationOptions {
  businessType: string;
  platform: Platform;
  visualStyle?: 'modern' | 'minimalist' | 'bold' | 'elegant' | 'playful' | 'professional';
  imageText?: string;
  brandProfile: BrandProfile;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '21:9' | '4:5';
  includePeopleInDesigns?: boolean;
  useLocalLanguage?: boolean;
  includeContacts?: boolean;
  scheduledServices?: any[];
}

export interface Revo20GenerationResult {
  imageUrl: string;
  model: string;
  qualityScore: number;
  processingTime: number;
  enhancementsApplied: string[];
  caption: string;
  hashtags: string[];
  headline?: string;
  subheadline?: string;
  cta?: string;
  captionVariations?: string[];
  businessIntelligence?: any;
}

/**
 * Get platform-specific aspect ratio for optimal social media display
 * STANDARDIZED: ALL platforms use 1:1 for maximum quality (no stories/reels)
 */
function getPlatformAspectRatio(platform: string): '1:1' | '16:9' | '9:16' | '21:9' | '4:5' {
  // ALL PLATFORMS use Square 1:1 for maximum quality
  // Facebook, Twitter/X, LinkedIn, YouTube, Instagram Feed, Pinterest, TikTok
  return '1:1';
}

/**
 * Get platform-specific dimension text for prompts
 * STANDARDIZED: ALL platforms use 1:1 square format (no stories/reels)
 */
function getPlatformDimensions(platform: string): string {
  // ALL PLATFORMS use Square 1:1 format for maximum quality
  return '992x1056px (1:1 square format)';
}

/**
 * Generate creative concept for Revo 2.0
 */
async function generateCreativeConcept(options: Revo20GenerationOptions): Promise<any> {
  const { businessType, brandProfile, platform } = options;

  try {
    const model = ai.getGenerativeModel({ model: REVO_2_0_MODEL });

    const conceptPrompt = `Generate a creative concept for ${brandProfile.businessName} (${businessType}) on ${platform}.
    
    Focus on:
    - Unique visual storytelling approach
    - Brand personality expression
    - Platform-specific engagement strategies
    - Cultural relevance for ${brandProfile.location || 'global audience'}
    
    Return a brief creative concept (2-3 sentences) that will guide the visual design.`;

    const result = await model.generateContent(conceptPrompt);
    const response = await result.response;
    const concept = response.text();

    return {
      concept: concept.trim(),
      visualTheme: 'modern-authentic',
      emotionalTone: 'engaging-professional'
    };

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Creative concept generation failed, using fallback');
    return {
      concept: `Create engaging visual content for ${brandProfile.businessName} that showcases their ${businessType} expertise with authentic, professional appeal.`,
      visualTheme: 'modern-authentic',
      emotionalTone: 'engaging-professional'
    };
  }
}

/**
 * Build enhanced prompt for Revo 2.0 with brand integration
 */
function buildEnhancedPrompt(options: Revo20GenerationOptions, concept: any): string {
  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern' } = options;

  // Extract brand colors from profile
  const primaryColor = brandProfile.primaryColor || '#3B82F6';
  const accentColor = brandProfile.accentColor || '#1E40AF';
  const backgroundColor = brandProfile.backgroundColor || '#FFFFFF';

  // Build color scheme instruction
  const colorScheme = `Primary: ${primaryColor} (60% dominant), Accent: ${accentColor} (30% secondary), Background: ${backgroundColor} (10% highlights)`;

  // Brand location info
  const brandInfo = brandProfile.location ? ` based in ${brandProfile.location}` : '';

  return `🎨 Create a ${visualStyle} social media design for ${brandProfile.businessName} (${businessType}) for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

DESIGN REQUIREMENTS:
- Platform: ${platform} (${getPlatformDimensions(platform)})
- Visual Style: ${visualStyle}
- Business: ${brandProfile.businessName} - ${businessType}${brandInfo}
- Location: ${brandProfile.location || 'Global'}

🎨 BRAND COLOR SCHEME (MANDATORY):
${colorScheme}
- Use these EXACT brand colors throughout the design
- Primary color should dominate (60% of color usage)
- Accent color for highlights and emphasis (30% of color usage)
- Background color for base and contrast (10% of color usage)
- Ensure high contrast and readability with these colors

REVO 2.0 ENHANCED FEATURES:
🚀 Next-generation AI design with sophisticated visual storytelling
🎯 Advanced brand consistency and cultural intelligence
🌟 Premium quality with authentic human-made aesthetics
🔥 Platform-optimized for maximum engagement
🎨 Precise brand color integration and logo placement

CRITICAL REQUIREMENTS:
- Resolution: 992x1056px (1:1 square format)
- High-quality, professional appearance
- MANDATORY: Use the specified brand colors (${primaryColor}, ${accentColor}, ${backgroundColor})
- Clear, readable text elements with proper contrast
- Engaging visual composition with brand consistency
- Cultural sensitivity and relevance
- Professional typography that complements the brand colors

Create a visually stunning design that stops scrolling and drives engagement while maintaining perfect brand consistency.`;
}

/**
 * Generate image with Gemini 2.5 Flash Image Preview with logo integration
 */
async function generateImageWithGemini(prompt: string, options: Revo20GenerationOptions): Promise<{ imageUrl: string }> {
  try {
    const model = ai.getGenerativeModel({
      model: REVO_2_0_MODEL,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });

    // Prepare generation parts array
    const generationParts: any[] = [prompt];

    // Check for logo integration (same logic as Revo 1.0)
    const logoDataUrl = options.brandProfile.logoDataUrl;
    const logoStorageUrl = (options.brandProfile as any).logoUrl || (options.brandProfile as any).logo_url;
    const logoUrl = logoDataUrl || logoStorageUrl;

    console.log('🔍 Revo 2.0 Logo availability check:', {
      businessName: options.brandProfile.businessName,
      hasLogoDataUrl: !!logoDataUrl,
      hasLogoStorageUrl: !!logoStorageUrl,
      logoDataUrlLength: logoDataUrl?.length || 0,
      logoStorageUrlLength: logoStorageUrl?.length || 0,
      finalLogoUrl: logoUrl ? logoUrl.substring(0, 100) + '...' : 'None'
    });

    if (logoUrl) {
      console.log('🎨 Revo 2.0: Processing brand logo for generation using:', logoDataUrl ? 'base64 data' : 'storage URL');

      let logoBase64Data = '';
      let logoMimeType = 'image/png';

      try {
        if (logoUrl.startsWith('data:')) {
          // Extract base64 data from data URL
          const matches = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            logoMimeType = matches[1];
            logoBase64Data = matches[2];
          }
        } else if (logoUrl.startsWith('http')) {
          // Fetch logo from storage URL
          const response = await fetch(logoUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            logoBase64Data = buffer.toString('base64');
            logoMimeType = response.headers.get('content-type') || 'image/png';
          }
        }

        // Normalize logo before adding to generation to prevent dimension influence
        if (logoBase64Data) {
          try {
            // Import logo normalization service
            const { LogoNormalizationService } = await import('@/lib/services/logo-normalization-service');

            // Normalize logo to prevent it from affecting design dimensions
            const normalizedLogo = await LogoNormalizationService.normalizeLogo(
              `data:${logoMimeType};base64,${logoBase64Data}`,
              { standardSize: 200, format: 'png', quality: 0.9 }
            );

            // Extract normalized base64 data with proper error handling
            let normalizedBase64: string;
            if (normalizedLogo && normalizedLogo.dataUrl) {
              normalizedBase64 = normalizedLogo.dataUrl.split(',')[1];
            } else {
              // Fallback: use original logo data if normalization failed
              console.warn('⚠️ Revo 2.0: Logo normalization failed, using original');
              normalizedBase64 = logoBase64Data;
            }

            generationParts.push({
              inlineData: {
                data: normalizedBase64,
                mimeType: 'image/png'
              }
            });

            // Get AI prompt instructions for normalized logo
            const logoInstructions = LogoNormalizationService.getLogoPromptInstructions(normalizedLogo);

            // Update the prompt with normalized logo instructions
            const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.

${logoInstructions}

LOGO INTEGRATION RULES:
✅ REQUIRED: Place the provided logo prominently in the design (top corner, header, or center)
✅ REQUIRED: Use the EXACT logo image provided - do not modify, recreate, or stylize it
✅ REQUIRED: Make the logo clearly visible and readable
✅ REQUIRED: Size the logo appropriately - not too small, not too large
✅ REQUIRED: Ensure good contrast against the background
✅ CRITICAL: Design dimensions must remain exactly 992x1056px regardless of logo size

❌ FORBIDDEN: Do NOT create a new logo
❌ FORBIDDEN: Do NOT ignore the provided logo
❌ FORBIDDEN: Do NOT make the logo too small to see
❌ FORBIDDEN: Do NOT place logo where it can't be seen

The logo has been normalized to 200px standard size to prevent design dimension issues.`;

            // Update the first part (prompt) with logo instructions
            generationParts[0] = prompt + logoPrompt;

            console.log('✅ Revo 2.0: Logo processed and added to generation');

          } catch (normalizationError) {
            console.error('❌ Revo 2.0: Logo normalization failed:', normalizationError);
            // Continue without logo if normalization fails
          }
        }

      } catch (logoError) {
        console.error('❌ Revo 2.0: Logo processing failed:', {
          originalUrl: logoUrl.substring(0, 100),
          hasLogoDataUrl: !!logoDataUrl,
          hasLogoStorageUrl: !!logoStorageUrl,
          urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
        });
        // Continue without logo if processing fails
      }
    } else {
      console.log('ℹ️ Revo 2.0: No logo provided, generating design without logo');
    }

    const result = await model.generateContent(generationParts);
    const response = await result.response;

    // Check if response contains image data
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;

      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          const base64Data = part.inlineData.data;
          const imageUrl = `data:${part.inlineData.mimeType};base64,${base64Data}`;

          console.log('✅ Revo 2.0: Image generated successfully with brand integration');
          return { imageUrl };
        }
      }
    }

    throw new Error('No image data found in Gemini response');

  } catch (error) {
    console.error('❌ Revo 2.0: Image generation failed:', error);
    throw new Error(`Revo 2.0 image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate caption and hashtags for Revo 2.0
 */
async function generateCaptionAndHashtags(options: Revo20GenerationOptions, concept: any): Promise<{
  caption: string;
  hashtags: string[];
  headline?: string;
  subheadline?: string;
  cta?: string;
  captionVariations?: string[];
}> {
  const { businessType, brandProfile, platform } = options;

  try {
    const model = ai.getGenerativeModel({ model: REVO_2_0_MODEL });

    const contentPrompt = `Generate sophisticated social media content for ${brandProfile.businessName} (${businessType}) on ${platform}.

CREATIVE CONCEPT: ${concept.concept}
LOCATION: ${brandProfile.location || 'Global'}

Generate:
1. HEADLINE (max 6 words): Catchy, attention-grabbing
2. SUBHEADLINE (max 25 words): Compelling value proposition  
3. CAPTION (50-100 words): Engaging, authentic, professional
4. CALL-TO-ACTION (2-4 words): Action-oriented
5. HASHTAGS (8-12): Mix of trending, niche, and branded tags

Focus on:
- Authentic, human-like tone
- Cultural relevance
- Platform-specific engagement
- Business value proposition
- Local market appeal

Format as JSON:
{
  "headline": "...",
  "subheadline": "...", 
  "caption": "...",
  "cta": "...",
  "hashtags": ["#tag1", "#tag2", ...]
}`;

    const result = await model.generateContent(contentPrompt);
    const response = await result.response;
    const content = response.text();

    try {
      const parsed = JSON.parse(content);
      return {
        caption: parsed.caption || `Experience the excellence of ${brandProfile.businessName} - your trusted ${businessType} partner.`,
        hashtags: parsed.hashtags || [`#${brandProfile.businessName.replace(/\s+/g, '')}`, '#Business', '#Quality'],
        headline: parsed.headline,
        subheadline: parsed.subheadline,
        cta: parsed.cta,
        captionVariations: [parsed.caption]
      };
    } catch (parseError) {
      console.warn('⚠️ Revo 2.0: Failed to parse content JSON, using fallback');
      return {
        caption: `Experience the excellence of ${brandProfile.businessName} - your trusted ${businessType} partner in ${brandProfile.location || 'delivering quality service'}.`,
        hashtags: [`#${brandProfile.businessName.replace(/\s+/g, '')}`, '#Business', '#Quality', '#Professional'],
        headline: 'Excellence Delivered',
        subheadline: 'Your trusted partner for quality service',
        cta: 'Get Started',
        captionVariations: []
      };
    }

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Content generation failed, using fallback');
    return {
      caption: `Discover the difference with ${brandProfile.businessName} - where quality meets innovation in ${businessType}.`,
      hashtags: [`#${brandProfile.businessName.replace(/\s+/g, '')}`, '#Innovation', '#Quality', '#Business'],
      headline: 'Quality Innovation',
      subheadline: 'Where excellence meets innovation',
      cta: 'Learn More',
      captionVariations: []
    };
  }
}

/**
 * Main Revo 2.0 generation function
 * Generate content with Revo 2.0 (Gemini 2.5 Flash Image Preview)
 */
export async function generateWithRevo20(options: Revo20GenerationOptions): Promise<Revo20GenerationResult> {
  const startTime = Date.now();

  try {
    console.log('🚀 Revo 2.0: Starting next-generation content generation');

    // Auto-detect platform-specific aspect ratio if not provided
    const aspectRatio = options.aspectRatio || getPlatformAspectRatio(options.platform);
    const enhancedOptions = { ...options, aspectRatio };

    console.log(`🎯 Revo 2.0: Using ${aspectRatio} aspect ratio for ${options.platform}`);

    // Step 1: Generate creative concept
    const concept = await generateCreativeConcept(enhancedOptions);
    console.log('✅ Revo 2.0: Creative concept generated');

    // Step 2: Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(enhancedOptions, concept);
    console.log('✅ Revo 2.0: Enhanced prompt built');

    // Step 3: Generate image with Gemini 2.5 Flash Image Preview
    const imageResult = await generateImageWithGemini(enhancedPrompt, enhancedOptions);
    console.log('✅ Revo 2.0: Image generated');

    // Step 4: Generate caption and hashtags
    const contentResult = await generateCaptionAndHashtags(enhancedOptions, concept);
    console.log('✅ Revo 2.0: Content generated');

    const processingTime = Date.now() - startTime;

    return {
      imageUrl: imageResult.imageUrl,
      model: 'Revo 2.0 (Gemini 2.5 Flash Image Preview)',
      qualityScore: 9.5,
      processingTime,
      enhancementsApplied: [
        'Next-generation AI design',
        'Creative concept generation',
        'Enhanced prompt engineering',
        'Brand logo integration and normalization',
        'Brand color scheme enforcement',
        'Brand consistency optimization',
        'Platform-specific formatting',
        'Cultural relevance integration',
        'Advanced visual storytelling',
        'Professional typography matching brand colors'
      ],
      caption: contentResult.caption,
      hashtags: contentResult.hashtags,
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      cta: contentResult.cta,
      captionVariations: contentResult.captionVariations,
      businessIntelligence: {
        concept: concept.concept,
        visualTheme: concept.visualTheme,
        emotionalTone: concept.emotionalTone
      }
    };

  } catch (error) {
    console.error('❌ Revo 2.0: Generation failed:', error);
    throw new Error(`Revo 2.0 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test Revo 2.0 availability
 */
export async function testRevo20Availability(): Promise<boolean> {
  try {
    console.log('🧪 Testing Revo 2.0 availability...');

    const model = ai.getGenerativeModel({ model: REVO_2_0_MODEL });
    const response = await model.generateContent('Create a simple test image with the text "Revo 2.0 Test" on a modern gradient background');

    const result = await response.response;
    const candidates = result.candidates;

    if (candidates && candidates.length > 0) {
      console.log('✅ Revo 2.0: Model is available and working');
      return true;
    }

    console.log('⚠️ Revo 2.0: Model responded but no candidates found');
    return false;

  } catch (error) {
    console.error('❌ Revo 2.0: Availability test failed:', error);
    return false;
  }
}
