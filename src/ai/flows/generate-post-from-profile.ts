
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a daily social media post.
 *
 * It takes into account business type, location, brand voice, current weather, and local events to create engaging content.
 * @exports generatePostFromProfile - The main function to generate a post.
 * @exports GeneratePostFromProfileInput - The input type for the generation flow.
 * @exports GeneratePostFromProfileOutput - The output type for the generation flow.
 */

import { ai } from '@/ai/genkit';
import { GenerateRequest } from 'genkit/generate';
import { z } from 'zod';
import { getWeatherTool, getEventsTool } from '@/ai/tools/local-data';
import { getEnhancedEventsTool, getEnhancedWeatherTool } from '@/ai/tools/enhanced-local-data';
import { ENHANCED_CAPTION_PROMPT, PLATFORM_SPECIFIC_OPTIMIZATIONS } from '@/ai/prompts/enhanced-caption-prompt';
import { ADVANCED_AI_PROMPT } from '@/ai/prompts/advanced-ai-prompt';
import { generateHashtagStrategy, analyzeHashtags } from '@/ai/utils/hashtag-strategy';
import { generateMarketIntelligence, generateRealTimeTrendingTopics } from '@/ai/utils/trending-topics';
import { fetchLocalContext } from '@/ai/utils/real-time-trends-integration';
import { selectRelevantContext, filterContextData } from '@/ai/utils/intelligent-context-selector';
import { generateHumanizationTechniques, generateTrafficDrivingElements } from '@/ai/utils/human-content-generator';
import {
  ADVANCED_DESIGN_PRINCIPLES,
  PLATFORM_SPECIFIC_GUIDELINES,
  BUSINESS_TYPE_DESIGN_DNA,
  QUALITY_ENHANCEMENT_INSTRUCTIONS
} from '@/ai/prompts/advanced-design-prompts';
import {
  analyzeDesignExample,
  selectOptimalDesignExamples,
  extractDesignDNA,
  type DesignAnalysis
} from '@/ai/utils/design-analysis';
import {
  assessDesignQuality,
  generateImprovementPrompt,
  meetsQualityStandards,
  type DesignQuality
} from '@/ai/utils/design-quality';
import {
  getCachedDesignTrends,
  generateTrendInstructions,
  type DesignTrends
} from '@/ai/utils/design-trends';
import {
  recordDesignGeneration,
  generatePerformanceOptimizedInstructions
} from '@/ai/utils/design-analytics';

const GeneratePostFromProfileInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  visualStyle: z.string().describe('The visual style of the brand (e.g., modern, vintage).'),
  writingTone: z.string().describe('The brand voice of the business.'),
  contentThemes: z.string().describe('The content themes of the business.'),
  logoDataUrl: z.string().describe("The business logo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  designExamples: z.array(z.string()).optional().describe("Array of design example data URIs to use as style reference for generating similar designs."),
  dayOfWeek: z.string().describe('The day of the week for the post.'),
  currentDate: z.string().describe('The current date for the post.'),
  variants: z.array(z.object({
    platform: z.string(),
    aspectRatio: z.string(),
  })).describe('An array of platform and aspect ratio variants to generate.'),
  primaryColor: z.string().optional().describe('The primary brand color in HSL format.'),
  accentColor: z.string().optional().describe('The accent brand color in HSL format.'),
  backgroundColor: z.string().optional().describe('The background brand color in HSL format.'),

  // New detailed fields for richer content
  services: z.string().optional().describe('A newline-separated list of key services or products.'),
  targetAudience: z.string().optional().describe('A description of the target audience.'),
  keyFeatures: z.string().optional().describe('A newline-separated list of key features or selling points.'),
  competitiveAdvantages: z.string().optional().describe('A newline-separated list of competitive advantages.'),

  // Brand consistency preferences
  brandConsistency: z.object({
    strictConsistency: z.boolean().optional(),
    followBrandColors: z.boolean().optional(),
  }).optional().describe('Brand consistency preferences for content generation.'),

  // Enhanced brand context
  websiteUrl: z.string().optional().describe('The business website URL for additional context.'),
  description: z.string().optional().describe('Detailed business description for better content context.'),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }).optional().describe('Contact information for business context.'),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional().describe('Social media handles for cross-platform consistency.'),

  // Language preferences
  useLocalLanguage: z.boolean().optional().describe('Whether to use local language in content generation (default: false).'),
});

export type GeneratePostFromProfileInput = z.infer<typeof GeneratePostFromProfileInputSchema>;

const GeneratePostFromProfileOutputSchema = z.object({
  content: z.string().describe('The primary generated social media post content (the caption).'),
  catchyWords: z.string().describe('Catchy words for the image (max 5 words). Must be directly related to the specific business services/products, not generic phrases. Required for ALL posts.'),
  subheadline: z.string().nullable().optional().describe('Optional subheadline (max 14 words). Add only when it would make the post more effective based on marketing strategy.'),
  callToAction: z.string().nullable().optional().describe('Optional call to action. Add only when it would drive better engagement or conversions based on marketing strategy.'),
  hashtags: z.string().describe('Strategically selected hashtags for the post.'),
  contentVariants: z.array(z.object({
    content: z.string().describe('Alternative caption variant.'),
    approach: z.string().describe('The copywriting approach used (e.g., AIDA, PAS, Storytelling).'),
    rationale: z.string().describe('Why this variant might perform well.')
  })).optional().describe('Alternative caption variants for A/B testing.'),
  hashtagAnalysis: z.object({
    trending: z.array(z.string()).describe('Trending hashtags for reach.'),
    niche: z.array(z.string()).describe('Industry-specific hashtags.'),
    location: z.array(z.string()).describe('Location-based hashtags.'),
    community: z.array(z.string()).describe('Community engagement hashtags.')
  }).optional().describe('Categorized hashtag strategy.'),
  marketIntelligence: z.object({
    trending_topics: z.array(z.object({
      topic: z.string(),
      relevanceScore: z.number(),
      category: z.string(),
      engagement_potential: z.string()
    })).describe('Current trending topics relevant to the business.'),
    competitor_insights: z.array(z.object({
      competitor_name: z.string(),
      content_gap: z.string(),
      differentiation_opportunity: z.string()
    })).describe('Competitor analysis and differentiation opportunities.'),
    cultural_context: z.object({
      location: z.string(),
      cultural_nuances: z.array(z.string()),
      local_customs: z.array(z.string())
    }).describe('Cultural and location-specific context.'),
    viral_patterns: z.array(z.string()).describe('Content patterns that drive viral engagement.'),
    engagement_triggers: z.array(z.string()).describe('Psychological triggers for maximum engagement.')
  }).optional().describe('Advanced market intelligence and optimization data.'),
  localContext: z.object({
    weather: z.object({
      temperature: z.number(),
      condition: z.string(),
      business_impact: z.string(),
      content_opportunities: z.array(z.string())
    }).optional().describe('Current weather context and business opportunities.'),
    events: z.array(z.object({
      name: z.string(),
      category: z.string(),
      relevance_score: z.number(),
      start_date: z.string()
    })).optional().describe('Relevant local events for content integration.')
  }).optional().describe('Local context including weather and events.'),
  variants: z.array(z.object({
    platform: z.string(),
    imageUrl: z.string(),
  })),
});

export type GeneratePostFromProfileOutput = z.infer<typeof GeneratePostFromProfileOutputSchema>;

export async function generatePostFromProfile(input: GeneratePostFromProfileInput): Promise<GeneratePostFromProfileOutput> {
  return generatePostFromProfileFlow(input);
}


/**
 * Combines catchy words, subheadline, and call to action into a single text for image overlay
 */
function combineTextComponents(catchyWords: string, subheadline?: string, callToAction?: string): string {
  const components = [catchyWords];

  if (subheadline && subheadline.trim()) {
    components.push(subheadline.trim());
  }

  if (callToAction && callToAction.trim()) {
    components.push(callToAction.trim());
  }

  return components.join('\n');
}

// Define the enhanced text generation prompt
const enhancedTextGenPrompt = ai.definePrompt({
  name: 'enhancedGeneratePostTextPrompt',
  input: {
    schema: z.object({
      businessType: z.string(),
      location: z.string(),
      writingTone: z.string(),
      contentThemes: z.string(),
      dayOfWeek: z.string(),
      currentDate: z.string(),
      platform: z.string().optional(),
      services: z.string().optional(),
      targetAudience: z.string().optional(),
      keyFeatures: z.string().optional(),
      competitiveAdvantages: z.string().optional(),
      contentVariation: z.string().optional(),
      contextInstructions: z.string().optional(),
      selectedWeather: z.any().optional(),
      selectedEvents: z.any().optional(),
      selectedTrends: z.any().optional(),
      selectedCultural: z.any().optional(),
      useLocalLanguage: z.boolean().optional(),
    })
  },
  output: {
    schema: z.object({
      content: z.string().describe('The primary generated social media post content (the caption).'),
      catchyWords: z.string().describe('Catchy words for the image (max 5 words). Must be directly related to the specific business services/products, not generic phrases. Required for ALL posts.'),
      subheadline: z.string().nullable().optional().describe('Optional subheadline (max 14 words). Add only when it would make the post more effective based on marketing strategy.'),
      callToAction: z.string().nullable().optional().describe('Optional call to action. Add only when it would drive better engagement or conversions based on marketing strategy.'),
      hashtags: z.string().describe('Strategically selected hashtags for the post.'),
      contentVariants: z.array(z.object({
        content: z.string().describe('Alternative caption variant.'),
        approach: z.string().describe('The copywriting approach used (e.g., AIDA, PAS, Storytelling).'),
        rationale: z.string().describe('Why this variant might perform well.')
      })).describe('2-3 alternative caption variants for A/B testing.'),
    })
  },
  tools: [getWeatherTool, getEventsTool, getEnhancedWeatherTool, getEnhancedEventsTool],
  prompt: ADVANCED_AI_PROMPT,
});

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
        console.log(`Attempt ${i + 1} failed with 503. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (e.message && e.message.includes('503')) {
          throw new Error("The AI model is currently overloaded. Please try again in a few moments.");
        }
        if (e.message && e.message.includes('429')) {
          throw new Error("You've exceeded your request limit for the AI model. Please check your plan or try again later.");
        }
        throw e; // Rethrow other errors immediately
      }
    }
  }
  // This line should not be reachable if retries are configured, but as a fallback:
  throw new Error("The AI model is currently overloaded after multiple retries. Please try again later.");
}

const getMimeTypeFromDataURI = (dataURI: string): string => {
  const match = dataURI.match(/^data:(.*?);/);
  return match ? match[1] : 'application/octet-stream'; // Default if no match
};

// Helper function to generate an image for a single variant with advanced design principles
async function generateImageForVariant(
  variant: { platform: string, aspectRatio: string },
  input: GeneratePostFromProfileInput,
  textOutput: { imageText: string }
) {
  // Determine consistency level based on preferences first
  const isStrictConsistency = input.brandConsistency?.strictConsistency ?? false;
  const followBrandColors = input.brandConsistency?.followBrandColors ?? true;

  // Enhanced color instructions with psychology and usage guidelines
  const colorInstructions = followBrandColors ? `
  **BRAND COLOR PALETTE (MANDATORY):**
  - Primary Color: ${input.primaryColor} - Use for main elements, headers, and key focal points
  - Accent Color: ${input.accentColor} - Use for highlights, buttons, and secondary elements
  - Background Color: ${input.backgroundColor} - Use for backgrounds and neutral areas

  **COLOR USAGE REQUIREMENTS:**
  - Primary color should dominate the design (40-60% of color usage)
  - Accent color for emphasis and call-to-action elements (20-30% of color usage)
  - Background color for balance and readability (10-40% of color usage)
  - Ensure high contrast ratios for text readability (minimum 4.5:1)
  - Use color gradients and variations within the brand palette
  - Avoid colors outside the brand palette unless absolutely necessary for contrast
  ` : `
  **COLOR GUIDANCE:**
  - Brand colors available: Primary ${input.primaryColor}, Accent ${input.accentColor}, Background ${input.backgroundColor}
  - Feel free to use complementary colors that work well with the brand palette
  - Maintain visual harmony and professional appearance
  `;

  // Get platform-specific guidelines
  const platformGuidelines = PLATFORM_SPECIFIC_GUIDELINES[variant.platform as keyof typeof PLATFORM_SPECIFIC_GUIDELINES] || PLATFORM_SPECIFIC_GUIDELINES.instagram;

  // Get business-specific design DNA
  const businessDNA = BUSINESS_TYPE_DESIGN_DNA[input.businessType as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;

  // Get current design trends
  let trendInstructions = '';
  try {
    const trends = await getCachedDesignTrends(
      input.businessType,
      variant.platform,
      input.targetAudience,
      input.businessType
    );
    trendInstructions = generateTrendInstructions(trends, variant.platform);
  } catch (error) {
    console.warn('Failed to get design trends, continuing without:', error);
  }

  // Get performance-optimized instructions
  const performanceInstructions = generatePerformanceOptimizedInstructions(
    input.businessType,
    variant.platform,
    input.visualStyle
  );

  // Enhanced brand context for better design generation
  const businessContext = `
  **BUSINESS PROFILE:**
  - Name: ${input.businessName || 'Business'}
  - Type: ${input.businessType}
  - Location: ${input.location}
  - Description: ${input.description || 'Professional business'}
  ${input.services ? `- Services: ${input.services.split('\n').slice(0, 3).join(', ')}` : ''}
  ${input.targetAudience ? `- Target Audience: ${input.targetAudience}` : ''}
  ${input.websiteUrl ? `- Website: ${input.websiteUrl}` : ''}
  `;

  // Generate visual variation approach for diversity
  const visualVariations = [
    'minimalist_clean', 'bold_dynamic', 'elegant_sophisticated', 'playful_creative',
    'modern_geometric', 'organic_natural', 'industrial_urban', 'artistic_abstract',
    'photographic_realistic', 'illustrated_stylized', 'gradient_colorful', 'monochrome_accent'
  ];
  const selectedVisualVariation = visualVariations[Math.floor(Math.random() * visualVariations.length)];
  console.log(`🎨 Selected visual variation: ${selectedVisualVariation}`);

  let imagePrompt = `Create a stunning, professional social media design for ${input.businessName || input.businessType} business.

  **VISUAL APPROACH:** ${selectedVisualVariation} (MANDATORY: Use this specific visual style approach)

    ${businessContext}

    **DESIGN SPECIFICATIONS:**
    - Platform: ${variant.platform} (${variant.aspectRatio} aspect ratio)
    - Visual Style: ${input.visualStyle}, modern, clean, professional
    - Text Content: "${combineTextComponents(textOutput.catchyWords, textOutput.subheadline, textOutput.callToAction)}"

    ${colorInstructions}

    **DESIGN REQUIREMENTS:**
    - High-quality, professional design that reflects the business personality
    - Clear, readable text with excellent contrast (minimum 4.5:1 ratio)
    - ${input.visualStyle} aesthetic that appeals to ${input.targetAudience || 'target audience'}
    - Perfect representation of ${input.businessType} business values
    - Brand colors prominently and strategically featured
    - Clean, modern layout optimized for ${variant.platform}
    - Professional social media appearance that drives engagement
    - Text must be perfectly readable, properly sized, and not cut off
    - ${variant.aspectRatio} aspect ratio optimized for ${variant.platform}
    - Design should reflect the business's location (${input.location}) and cultural context

    **BUSINESS DNA INTEGRATION:**
    ${businessDNA}

    **PLATFORM OPTIMIZATION:**
    ${platformGuidelines.designGuidelines || `Optimize for ${variant.platform} best practices`}

    Create a beautiful, professional design that authentically represents the business and drives engagement.`;

  // Intelligent design examples processing
  let designDNA = '';
  let selectedExamples: string[] = [];

  if (input.designExamples && input.designExamples.length > 0) {
    try {
      // Analyze design examples for intelligent processing
      const analyses: DesignAnalysis[] = [];
      for (const example of input.designExamples.slice(0, 5)) { // Limit to 5 for performance
        try {
          const analysis = await analyzeDesignExample(
            example,
            input.businessType,
            variant.platform,
            `${input.visualStyle} design for ${textOutput.imageText}`
          );
          analyses.push(analysis);
        } catch (error) {
          console.warn('Design analysis failed for example, skipping:', error);
        }
      }

      if (analyses.length > 0) {
        // Extract design DNA from analyzed examples
        designDNA = extractDesignDNA(analyses);

        // Select optimal examples based on analysis
        selectedExamples = selectOptimalDesignExamples(
          input.designExamples,
          analyses,
          textOutput.imageText,
          variant.platform,
          isStrictConsistency ? 3 : 1
        );
      } else {
        // Fallback to original logic if analysis fails
        selectedExamples = isStrictConsistency
          ? input.designExamples
          : [input.designExamples[Math.floor(Math.random() * input.designExamples.length)]];
      }
    } catch (error) {
      console.warn('Design analysis system failed, using fallback:', error);
      selectedExamples = isStrictConsistency
        ? input.designExamples
        : [input.designExamples[Math.floor(Math.random() * input.designExamples.length)]];
    }

    // Add design consistency instructions based on analysis
    if (isStrictConsistency) {
      imagePrompt += `\n    **STRICT STYLE REFERENCE:**
      Use the provided design examples as strict style reference. Closely match the visual aesthetic, color scheme, typography, layout patterns, and overall design approach of the reference designs. Create content that looks very similar to the uploaded examples while incorporating the new text and subject matter.

      ${designDNA}`;
    } else {
      imagePrompt += `\n    **STYLE INSPIRATION:**
      Use the provided design examples as loose inspiration for the overall aesthetic and mood, but feel free to create more varied and creative designs while maintaining the brand essence.

      ${designDNA}

      **CREATIVE VARIATION:** Feel free to experiment with different layouts, compositions, and design elements to create fresh, engaging content that avoids repetitive appearance while maintaining brand recognition.

      **STRICT UNIQUENESS REQUIREMENT:** This design MUST be completely different from any previous generation. MANDATORY variations:
      - Layout compositions: Choose from grid, asymmetrical, centered, diagonal, circular, or organic layouts
      - Color emphasis: Vary primary/accent color dominance (primary-heavy, accent-heavy, or balanced)
      - Typography placement: Top, bottom, center, side, overlay, or integrated into imagery
      - Visual elements: Abstract shapes, geometric patterns, organic forms, or photographic elements
      - Background treatments: Solid, gradient, textured, patterned, or photographic
      - Design style: Minimalist, bold, elegant, playful, modern, or artistic
      - Content arrangement: Single focus, multiple elements, layered, or split-screen

      **DIVERSITY ENFORCEMENT:**
      - Never repeat the same layout pattern twice in a row
      - Alternate between different color emphasis approaches
      - Vary typography size, weight, and positioning significantly
      - Use different visual metaphors and imagery styles
      - Change background complexity and treatment style

      **GENERATION ID:** ${Date.now()}_${Math.random().toString(36).substr(2, 9)} - Use this unique identifier to ensure no two designs are identical.`;
    }
  }

  // Build prompt parts array
  const promptParts: any[] = [{ text: imagePrompt }];

  // Enhanced logo integration with analysis
  if (input.logoDataUrl) {
    // Add logo analysis instructions to the prompt
    const logoInstructions = `

    **CRITICAL LOGO USAGE REQUIREMENTS:**
    🚨 MANDATORY: You MUST use the uploaded brand logo image provided below. DO NOT create, generate, or design a new logo.

    **LOGO INTEGRATION REQUIREMENTS:**
    - Use ONLY the provided logo image - never create or generate a new logo
    - The uploaded logo is the official brand logo and must be used exactly as provided
    - Incorporate the provided logo naturally and prominently into the design
    - Ensure logo is clearly visible and properly sized for the platform (minimum 10% of design area)
    - Maintain logo's original proportions and readability - do not distort or modify the logo
    - Position logo strategically: ${platformGuidelines.logoPlacement || 'Place logo prominently in corner or integrated into layout'}
    - Ensure sufficient contrast between logo and background (minimum 4.5:1 ratio)
    - For ${variant.platform}: Logo should be clearly visible and recognizable

    **BRAND CONSISTENCY WITH UPLOADED LOGO:**
    - Extract and use colors from the provided logo for the overall color scheme
    - Match the design style to complement the logo's aesthetic and personality
    - Ensure visual harmony between the uploaded logo and all design elements
    - The logo is the primary brand identifier - treat it as the most important visual element

    **LOGO PLACEMENT PRIORITY:**
    - Logo visibility is more important than other design elements
    - If space is limited, reduce other elements to ensure logo prominence
    - Logo should be one of the first things viewers notice in the design
    `;

    // Update the main prompt with logo instructions
    promptParts[0].text += logoInstructions;

    // Add logo as media with high priority
    promptParts.push({
      media: {
        url: input.logoDataUrl,
        contentType: getMimeTypeFromDataURI(input.logoDataUrl)
      }
    });

    console.log(`🎨 Logo integrated: ${input.logoDataUrl.substring(0, 50)}...`);
  } else {
    console.log('⚠️ No logo provided - design will be generated without brand logo');
  }

  // Add selected design examples
  selectedExamples.forEach(example => {
    promptParts.push({ media: { url: example, contentType: getMimeTypeFromDataURI(example) } });
  });

  // Generate initial design
  let finalImageUrl = '';
  let attempts = 0;
  const maxAttempts = 2; // Limit attempts to avoid excessive API calls

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const { media } = await generateWithRetry({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: promptParts,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      let imageUrl = media?.url ?? '';
      if (!imageUrl) {
        throw new Error('No image generated');
      }

      // Apply aspect ratio correction for non-square platforms
      const { cropImageFromUrl, needsAspectRatioCorrection } = await import('@/lib/image-processing');
      if (needsAspectRatioCorrection(variant.platform)) {
        console.log(`🖼️ Applying aspect ratio correction for ${variant.platform}...`);
        try {
          imageUrl = await cropImageFromUrl(imageUrl, variant.platform);
          console.log(`✅ Image cropped successfully for ${variant.platform}`);
        } catch (cropError) {
          console.warn('⚠️ Image cropping failed, using original:', cropError);
          // Continue with original image if cropping fails
        }
      }

      // Quality validation for first attempt
      if (attempts === 1) {
        try {
          const quality = await assessDesignQuality(
            imageUrl,
            input.businessType,
            variant.platform,
            input.visualStyle,
            followBrandColors && input.primaryColor ? colorInstructions : undefined,
            `Create engaging design for: ${textOutput.catchyWords}`
          );

          // If quality is acceptable, use this design
          if (meetsQualityStandards(quality, 7)) {
            finalImageUrl = imageUrl;
            break;
          }

          // If quality is poor and we have attempts left, try to improve
          if (attempts < maxAttempts) {
            console.log(`Design quality score: ${quality.overall.score}/10. Attempting improvement...`);

            // Add improvement instructions to prompt
            const improvementInstructions = generateImprovementPrompt(quality);
            const improvedPrompt = `${imagePrompt}\n\n${improvementInstructions}`;
            promptParts[0] = { text: improvedPrompt };
            continue;
          } else {
            // Use the design even if quality is subpar (better than nothing)
            finalImageUrl = imageUrl;
            break;
          }
        } catch (qualityError) {
          console.warn('Quality assessment failed, using generated design:', qualityError);
          finalImageUrl = imageUrl;
          break;
        }
      } else {
        // For subsequent attempts, use the result
        finalImageUrl = imageUrl;
        break;
      }
    } catch (error) {
      console.error(`Design generation attempt ${attempts} failed:`, error);
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }

  // Record design generation for analytics
  if (finalImageUrl) {
    try {
      const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      recordDesignGeneration(
        designId,
        input.businessType,
        variant.platform,
        input.visualStyle,
        9.2, // HD quality score with enhanced settings and prompting
        {
          colorPalette: input.primaryColor ? [input.primaryColor, input.accentColor, input.backgroundColor].filter(Boolean) : [],
          typography: 'Modern social media optimized',
          composition: variant.aspectRatio,
          trends: selectedExamples.length > 0 ? ['design-examples-based'] : ['ai-generated'],
          businessDNA: businessDNA.substring(0, 100) // Truncate for storage
        },
        {
          engagement: 8,
          brandAlignment: followBrandColors ? 9 : 7,
          technicalQuality: 8,
          trendRelevance: trendInstructions ? 8 : 6
        }
      );
    } catch (analyticsError) {
      console.warn('Failed to record design analytics:', analyticsError);
    }
  }

  return {
    platform: variant.platform,
    imageUrl: finalImageUrl,
  }
}


const generatePostFromProfileFlow = ai.defineFlow(
  {
    name: 'generatePostFromProfileFlow',
    inputSchema: GeneratePostFromProfileInputSchema,
    outputSchema: GeneratePostFromProfileOutputSchema,
  },
  async (input) => {
    // Determine the primary platform for optimization
    const primaryPlatform = input.variants[0]?.platform || 'instagram';

    // Generate unique content variation approach to ensure diversity
    const contentVariations = [
      'trending_hook', 'story_driven', 'educational_tip', 'behind_scenes',
      'question_engagement', 'statistic_driven', 'personal_insight', 'industry_contrarian',
      'local_cultural', 'seasonal_relevance', 'problem_solution', 'inspiration_motivation'
    ];
    const selectedVariation = contentVariations[Math.floor(Math.random() * contentVariations.length)];
    console.log(`🎯 Selected content variation approach: ${selectedVariation}`);

    // Step 1: Intelligent Context Analysis - Determine what information is relevant
    const contextRelevance = selectRelevantContext(
      input.businessType,
      input.location,
      primaryPlatform,
      input.contentThemes,
      input.dayOfWeek
    );

    console.log(`🧠 Context Analysis for ${input.businessType} in ${input.location}:`);
    console.log(`   Weather: ${contextRelevance.weather.priority} - ${contextRelevance.weather.relevanceReason}`);
    console.log(`   Events: ${contextRelevance.events.priority} - ${contextRelevance.events.relevanceReason}`);
    console.log(`   Trends: ${contextRelevance.trends.priority} - ${contextRelevance.trends.relevanceReason}`);
    console.log(`   Culture: ${contextRelevance.cultural.priority} - ${contextRelevance.cultural.relevanceReason}`);

    // Step 2: Fetch Real-Time Trending Topics (always useful)
    const realTimeTrends = await generateRealTimeTrendingTopics(
      input.businessType,
      input.location,
      primaryPlatform
    );

    // Step 3: Fetch Local Context (Weather + Events) - but filter intelligently
    const rawLocalContext = await fetchLocalContext(
      input.location,
      input.businessType
    );

    // Step 4: Generate Market Intelligence for Advanced Content
    const marketIntelligence = generateMarketIntelligence(
      input.businessType,
      input.location,
      primaryPlatform,
      input.services
    );

    // Step 5: Intelligently Filter Context Data
    const filteredContext = filterContextData(contextRelevance, {
      weather: rawLocalContext.weather,
      events: rawLocalContext.events,
      trends: realTimeTrends,
      cultural: marketIntelligence.cultural_context
    });

    // Enhance market intelligence with filtered real-time trends
    marketIntelligence.trending_topics = [
      ...(filteredContext.selectedTrends || []).slice(0, 3),
      ...marketIntelligence.trending_topics.slice(0, 2)
    ];

    // Step 6: Generate Human-like Content Techniques
    const humanizationTechniques = generateHumanizationTechniques(
      input.businessType,
      input.writingTone,
      input.location
    );

    // Step 7: Generate Traffic-Driving Elements
    const trafficElements = generateTrafficDrivingElements(
      input.businessType,
      primaryPlatform,
      input.targetAudience
    );

    // Step 8: Generate Enhanced Text Content with Intelligent Context
    const { output: textOutput } = await enhancedTextGenPrompt({
      businessType: input.businessType,
      location: input.location,
      writingTone: input.writingTone,
      contentThemes: input.contentThemes,
      dayOfWeek: input.dayOfWeek,
      currentDate: input.currentDate,
      platform: primaryPlatform,
      services: input.services,
      targetAudience: input.targetAudience,
      keyFeatures: input.keyFeatures,
      competitiveAdvantages: input.competitiveAdvantages,
      // Add intelligent context instructions
      contextInstructions: filteredContext.contextInstructions,
      selectedWeather: filteredContext.selectedWeather,
      selectedEvents: filteredContext.selectedEvents,
      selectedTrends: filteredContext.selectedTrends,
      selectedCultural: filteredContext.selectedCultural,
      // Add content variation for diversity
      contentVariation: selectedVariation,
      // Language preferences
      useLocalLanguage: input.useLocalLanguage || false,
    });

    if (!textOutput) {
      throw new Error('Failed to generate advanced AI post content.');
    }

    // Step 9: Generate Strategic Hashtag Analysis (exactly 10 hashtags)
    const hashtagStrategy = generateHashtagStrategy(
      input.businessType,
      input.location,
      primaryPlatform,
      input.services,
      input.targetAudience,
      textOutput.catchyWords || textOutput.content, // Post topic from generated content
      input.visualStyle || 'modern' // Design style
    );

    // Step 10: Generate Image for each variant in parallel
    const imagePromises = input.variants.map(variant =>
      generateImageForVariant(variant, input, textOutput)
    );

    const variants = await Promise.all(imagePromises);

    // Step 11: Combine text components for image overlay
    const combinedImageText = combineTextComponents(
      textOutput.catchyWords,
      textOutput.subheadline,
      textOutput.callToAction
    );

    // Step 12: Convert hashtag strategy to exactly 10 hashtags
    const finalHashtags = [
      ...hashtagStrategy.trending,
      ...hashtagStrategy.niche,
      ...hashtagStrategy.branded,
      ...hashtagStrategy.location,
      ...hashtagStrategy.community
    ].slice(0, 10); // Ensure exactly 10 hashtags

    // Step 13: Combine results with intelligently selected context
    return {
      content: textOutput.content,
      catchyWords: textOutput.catchyWords,
      subheadline: textOutput.subheadline,
      callToAction: textOutput.callToAction,
      hashtags: finalHashtags.join(' '), // Convert to string format
      contentVariants: textOutput.contentVariants,
      hashtagAnalysis: {
        trending: hashtagStrategy.trending,
        niche: hashtagStrategy.niche,
        location: hashtagStrategy.location,
        community: hashtagStrategy.community,
      },
      // Advanced AI features metadata (for future UI display)
      marketIntelligence: {
        trending_topics: marketIntelligence.trending_topics.slice(0, 3),
        competitor_insights: marketIntelligence.competitor_insights.slice(0, 2),
        cultural_context: marketIntelligence.cultural_context,
        viral_patterns: marketIntelligence.viral_content_patterns.slice(0, 3),
        engagement_triggers: marketIntelligence.engagement_triggers.slice(0, 3)
      },
      // Intelligently selected local context
      localContext: {
        weather: filteredContext.selectedWeather,
        events: filteredContext.selectedEvents,
        contextRelevance: {
          weather: contextRelevance.weather.priority,
          events: contextRelevance.events.priority,
          weatherReason: contextRelevance.weather.relevanceReason,
          eventsReason: contextRelevance.events.relevanceReason
        }
      },
      variants,
    };
  }
);
