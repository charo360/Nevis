
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
});

export type GeneratePostFromProfileInput = z.infer<typeof GeneratePostFromProfileInputSchema>;

const GeneratePostFromProfileOutputSchema = z.object({
  content: z.string().describe('The primary generated social media post content (the caption).'),
  imageText: z.string().describe('A brief, catchy headline for the image itself (max 5 words).'),
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
    })
  },
  output: {
    schema: z.object({
      content: z.string().describe('The primary generated social media post content (the caption).'),
      imageText: z.string().describe('A brief, catchy headline for the image itself (max 5 words).'),
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
  const colorInstructions = `The brand's color palette is: Primary HSL(${input.primaryColor}), Accent HSL(${input.accentColor}), Background HSL(${input.backgroundColor}). Please use these colors in the design.`;

  // Determine consistency level based on preferences
  const isStrictConsistency = input.brandConsistency?.strictConsistency ?? false;
  const followBrandColors = input.brandConsistency?.followBrandColors ?? true;

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

  let imagePrompt = `You are a world-class creative director and visual designer with expertise in social media marketing, brand design, and visual psychology.

    **DESIGN BRIEF:**
    Create a professional, high-impact social media design for a ${input.businessType} business.
    Target Platform: ${variant.platform} | Aspect Ratio: ${variant.aspectRatio}
    Visual Style: ${input.visualStyle} | Location: ${input.location}

    ${ADVANCED_DESIGN_PRINCIPLES}

    ${platformGuidelines}

    ${businessDNA}

    ${trendInstructions}

    ${performanceInstructions}

    **BRAND INTEGRATION:**
    - **Brand Colors:** ${followBrandColors && input.primaryColor ? colorInstructions : 'Use a visually appealing and appropriate palette that fits the business type.'}
    - **Logo Placement:** The provided logo must be integrated naturally into the design. It should be clearly visible but not overpower the main subject. For example, it could be on a product, a sign, or as a subtle watermark.

    **CONTENT REQUIREMENTS:**
    - **Primary Subject:** The core subject of the image should be directly inspired by: "${textOutput.imageText}"
    - **Text Overlay:** The following text must be overlaid on the image in a stylish, readable font: "${textOutput.imageText}". It is critical that the text is clearly readable, well-composed, and not cut off or truncated. The entire text must be visible.
    - **Cultural Representation:** If the image includes people, they should be representative of the location: ${input.location}. For example, for a post in Africa, depict Black people; for Europe, White people; for the USA, a diverse mix of ethnicities. Be thoughtful and authentic in your representation.

    ${QUALITY_ENHANCEMENT_INSTRUCTIONS}`;

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

      **CREATIVE VARIATION:** Feel free to experiment with different layouts, compositions, and design elements to create fresh, engaging content that avoids repetitive appearance while maintaining brand recognition.`;
    }
  }

  // Build prompt parts array
  const promptParts: any[] = [{ text: imagePrompt }];

  // Add logo
  promptParts.push({ media: { url: input.logoDataUrl, contentType: getMimeTypeFromDataURI(input.logoDataUrl) } });

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

      const imageUrl = media?.url ?? '';
      if (!imageUrl) {
        throw new Error('No image generated');
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
            `Create engaging design for: ${textOutput.imageText}`
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
        8, // Default quality score, will be updated if assessment was performed
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
    });

    if (!textOutput) {
      throw new Error('Failed to generate advanced AI post content.');
    }

    // Step 9: Generate Strategic Hashtag Analysis
    const hashtagStrategy = generateHashtagStrategy(
      input.businessType,
      input.location,
      primaryPlatform,
      input.services,
      input.targetAudience
    );

    // Step 10: Generate Image for each variant in parallel
    const imagePromises = input.variants.map(variant =>
      generateImageForVariant(variant, input, textOutput)
    );

    const variants = await Promise.all(imagePromises);

    // Step 11: Combine results with intelligently selected context
    return {
      content: textOutput.content,
      imageText: textOutput.imageText,
      hashtags: textOutput.hashtags,
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
