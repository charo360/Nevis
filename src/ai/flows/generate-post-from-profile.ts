
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
import { viralHashtagEngine } from '@/ai/viral-hashtag-engine';
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
// Clean design system implemented inline for immediate use

// 7 Different Design Template Styles for Variety - STRONG VISUAL DIFFERENTIATION
const DESIGN_TEMPLATES = [
  {
    name: "Motivational Quote",
    style: "WATERCOLOR BACKGROUND - NO ILLUSTRATIONS",
    description: "MANDATORY: Soft watercolor wash background in pastels (pink/blue/purple). NO illustrations, NO graphics, NO icons. Only elegant typography on watercolor texture.",
    elements: ["watercolor texture background", "script font headlines", "minimal text-only design"],
    forbidden: ["illustrations", "graphics", "icons", "people", "objects", "geometric shapes"]
  },
  {
    name: "Behind the Brand",
    style: "CUSTOM ILLUSTRATIONS ONLY",
    description: "MANDATORY: Hand-drawn style illustrations of business elements. Illustrated style with warm storytelling visuals.",
    elements: ["custom illustrations", "hand-drawn style", "storytelling visuals"],
    forbidden: ["photos", "watercolor", "geometric shapes", "minimal design"]
  },
  {
    name: "Engagement Post",
    style: "SPLIT PHOTO COLLAGE - NO ILLUSTRATIONS",
    description: "MANDATORY: Split screen layout with real photos on each side. 'This or That' style with bold text overlay. NO illustrations allowed.",
    elements: ["split screen layout", "real photographs", "comparison design", "bold overlay text"],
    forbidden: ["illustrations", "watercolor", "single image", "minimal design"]
  },
  {
    name: "Promotional Highlight",
    style: "BOLD TYPOGRAPHY FOCUS - MINIMAL GRAPHICS",
    description: "MANDATORY: Typography-driven design with clean background. Focus on text hierarchy and product showcase. Minimal geometric accents only.",
    elements: ["large typography", "text hierarchy", "clean background", "minimal geometric accents"],
    forbidden: ["illustrations", "watercolor", "complex graphics", "busy backgrounds"]
  },
  {
    name: "Fun/Trending",
    style: "MEME TEMPLATE - WHITE BACKGROUND",
    description: "MANDATORY: Clean white background with meme-style text placement. Simple, humorous layout with minimal visual elements.",
    elements: ["white background", "meme-style text", "simple layout", "humorous approach"],
    forbidden: ["illustrations", "watercolor", "complex graphics", "busy designs", "multiple colors"]
  },
  {
    name: "Customer Love",
    style: "POLAROID FRAME - RETRO PHOTO STYLE",
    description: "MANDATORY: Polaroid photo frame design with retro styling. Testimonial presentation with vintage photo aesthetic.",
    elements: ["polaroid frame", "retro photo style", "vintage aesthetic", "testimonial layout"],
    forbidden: ["illustrations", "watercolor", "modern design", "minimal layout"]
  },
  {
    name: "Creativity + Brand Values",
    style: "MIXED MEDIA ARTISTIC - WATERCOLOR + ELEMENTS",
    description: "MANDATORY: Watercolor splash background combined with artistic mixed media elements. Creative inspiration with artistic flair.",
    elements: ["watercolor splash", "mixed media", "artistic elements", "creative inspiration"],
    forbidden: ["pure illustrations", "clean minimal", "geometric only", "photo-based"]
  }
];
// Enhanced design system temporarily disabled - will be re-enabled after module resolution
// import { generateEnhancedDesignPrompt, generateDesignEnhancements, validateDesignQuality } from '@/ai/utils/enhanced-design-generator';
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

// Export function moved to end of file after flow definition


/**
 * Combines catchy words, subheadline, and call to action into a single text for image overlay
 */
function combineTextComponents(catchyWords: string, subheadline?: string, callToAction?: string): string {
  // Clean catchy words to remove business name + colon pattern
  const cleanCatchyWords = cleanBusinessNamePattern(catchyWords);
  const components = [cleanCatchyWords];

  if (subheadline && subheadline.trim()) {
    components.push(subheadline.trim());
  }

  if (callToAction && callToAction.trim()) {
    components.push(callToAction.trim());
  }

  return components.join('\n');
}

/**
 * Removes business name + colon pattern from catchy words
 */
function cleanBusinessNamePattern(text: string): string {
  // Remove patterns like "PAYA: FAST, EASY, BETTER" -> "FAST, EASY, BETTER"
  // Remove patterns like "Business Name: Description" -> "Description"
  // Handle various business name patterns
  let cleaned = text
    .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
    .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
    .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
    .trim();
  
  // If the text is too short after cleaning, return original
  if (cleaned.length < 3) {
    return text;
  }
  
  return cleaned;
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

// Helper function to generate an image for a single variant with ENHANCED design principles
async function generateImageForVariant(
  variant: { platform: string, aspectRatio: string },
  input: GeneratePostFromProfileInput,
  textOutput: { imageText: string }
) {

  // TEMPORARILY DISABLED - Enhanced design system will be re-enabled after module resolution
  /*
  const enhancedDesignInput = {
    businessType: input.businessType,
    platform: variant.platform,
    visualStyle: input.visualStyle,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
    backgroundColor: input.backgroundColor,
    imageText: textOutput.imageText,
    businessName: input.businessName,
    logoDataUrl: input.logoDataUrl,
    designExamples: input.designExamples,
    qualityLevel: 'premium' as const
  };

  const designEnhancements = generateDesignEnhancements(enhancedDesignInput);

  const enhancedPrompt = generateEnhancedDesignPrompt(enhancedDesignInput);
  */
  // Determine consistency level based on preferences first
  const isStrictConsistency = input.brandConsistency?.strictConsistency ?? false;
  const followBrandColors = input.brandConsistency?.followBrandColors ?? true;

  // STRICT 3-color maximum with brand color enforcement
  const colorInstructions = followBrandColors ? `
  **MAXIMUM 3 COLORS ONLY - BRAND COLORS MANDATORY:**
  - Primary Color: ${input.primaryColor} - DOMINANT color (60-70% of design)
  - Accent Color: ${input.accentColor} - HIGHLIGHT color (20-30% of design)
  - Background Color: ${input.backgroundColor} - BASE color (10-20% of design)

  **ABSOLUTE COLOR LIMITS - NO EXCEPTIONS:**
  - MAXIMUM 3 colors total in entire design
  - ONLY use these exact 3 brand colors - NO additional colors
  - NO 4th, 5th, or more colors allowed
  - NO random colors, NO complementary colors, NO decorative colors
  - NO gradients using non-brand colors
  - Text: Use high contrast white or black only when needed
  - FORBIDDEN: Any design with more than 3 colors total
  ` : `
  **MAXIMUM 3 COLORS TOTAL:**
  - Primary: ${input.primaryColor} - DOMINANT (60-70%)
  - Accent: ${input.accentColor} - HIGHLIGHT (20-30%)
  - Background: ${input.backgroundColor} - BASE (10-20%)
  - ABSOLUTE LIMIT: 3 colors maximum in entire design
  `;

  // Get platform-specific guidelines
  const platformGuidelines = PLATFORM_SPECIFIC_GUIDELINES[variant.platform as keyof typeof PLATFORM_SPECIFIC_GUIDELINES] || PLATFORM_SPECIFIC_GUIDELINES.instagram;

  // Get business-specific design DNA
  const businessDNA = BUSINESS_TYPE_DESIGN_DNA[input.businessType as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;

  // Enhanced ethnicity representation for African locations
  const getEthnicityInstructions = (location: string, businessType: string) => {
    const locationKey = location.toLowerCase();
    const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];
    
    for (const country of africanCountries) {
      if (locationKey.includes(country)) {
        return `
**CRITICAL ETHNICITY REQUIREMENTS FOR ${location.toUpperCase()}:**
- MANDATORY: Include authentic Black/African people with PERFECT FACIAL FEATURES
- Show complete faces, symmetrical features, natural expressions, professional poses
- Display local African people in modern, professional settings that reflect contemporary African life
- Ensure faces are fully visible, well-lit, and anatomically correct with no deformations
- Emphasize cultural authenticity and local representation
- For ${businessType} business: Show African professionals, customers, or business owners
- AVOID: Non-African people as primary subjects when business is in Africa
- PRIORITY: 80%+ of people in the image should be Black/African when business is in African country
- Cultural context: Reflect the specific African country's modern business environment`;
      }
    }
    return '';
  };

  const ethnicityInstructions = getEthnicityInstructions(input.location, input.businessType);

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

  // Select random design template for variety
  const selectedTemplate = DESIGN_TEMPLATES[Math.floor(Math.random() * DESIGN_TEMPLATES.length)];

  // Generate visual variation approach for diversity
  const visualVariations = [
    'minimalist_clean', 'bold_dynamic', 'elegant_sophisticated', 'playful_creative',
    'modern_geometric', 'organic_natural', 'industrial_urban', 'artistic_abstract',
    'photographic_realistic', 'illustrated_stylized', 'gradient_colorful', 'monochrome_accent'
  ];
  const selectedVisualVariation = visualVariations[Math.floor(Math.random() * visualVariations.length)];

  // TEMPLATE-BASED DESIGN APPROACH - Using selected template style

  let imagePrompt = `Create a ${selectedTemplate.style.toUpperCase()} social media design following the "${selectedTemplate.name}" template approach.

**BUSINESS:** ${input.businessType}
**PLATFORM:** ${variant.platform}
**ASPECT RATIO:** ${variant.aspectRatio}
**MESSAGE:** "${combineTextComponents(textOutput.catchyWords, textOutput.subheadline, textOutput.callToAction)}"

**MANDATORY TEMPLATE STYLE:** ${selectedTemplate.name}
**MANDATORY TEMPLATE DESCRIPTION:** ${selectedTemplate.description}
**REQUIRED ELEMENTS:** ${selectedTemplate.elements.join(', ')}
**ABSOLUTELY FORBIDDEN:** ${selectedTemplate.forbidden.join(', ')}

${ethnicityInstructions}

**CRITICAL: You MUST follow the template style exactly. Do NOT default to illustrations if the template specifies otherwise.**

**STRICT REQUIREMENTS - FOLLOW EXACTLY:**
- Use ONLY 3 visual elements maximum: logo, main text, one simple accent
- 50%+ of the design must be white/empty space
- Single, clean sans-serif font family only
- MAXIMUM 3 COLORS TOTAL in entire design
- NO LINES: no decorative lines, borders, dividers, or linear elements
- No decorative elements, shapes, or complex backgrounds
- High contrast for perfect readability
- Generous margins and spacing throughout
- One clear focal point only

**MAXIMUM 3 COLORS ONLY - BRAND COLORS:**
- Primary Color: ${input.primaryColor} (DOMINANT - 60-70% of design)
- Accent Color: ${input.accentColor} (HIGHLIGHTS - 20-30% of design)
- Background Color: ${input.backgroundColor} (BASE - 10-20% of design)
- ABSOLUTE LIMIT: These 3 colors only - NO 4th color allowed
- FORBIDDEN: Any design using more than 3 colors total
- FORBIDDEN: Additional colors, random colors, decorative colors

**MANDATORY DESIGN APPROACH - ${selectedTemplate.name.toUpperCase()}:**
- MUST follow ${selectedTemplate.style} aesthetic - NO EXCEPTIONS
- MUST incorporate: ${selectedTemplate.elements.join(', ')}
- ABSOLUTELY FORBIDDEN: ${selectedTemplate.forbidden.join(', ')}
- ${selectedTemplate.description}
- DO NOT default to illustration style unless template specifically requires it
- Template requirements override all other design preferences

**FORBIDDEN ELEMENTS:**
❌ Multiple competing focal points
❌ Decorative shapes or ornaments
❌ Complex backgrounds or textures
❌ Multiple font families
❌ MORE THAN 3 COLORS TOTAL in the design
❌ Any 4th, 5th, or additional colors beyond the 3 brand colors
❌ Random colors, rainbow colors, complementary colors
❌ Gradients using non-brand colors
❌ ALL LINES: decorative lines, border lines, divider lines, underlines
❌ Frame lines, geometric lines, separator lines, outline borders
❌ Any linear elements or line-based decorations
❌ Cramped spacing
❌ Overlapping elements
❌ Busy compositions
❌ Multiple graphics or icons
❌ Patterns or textures

**MANDATORY SIMPLICITY:**
- Single clear message
- Generous white space (50%+ empty)
- Maximum 3 visual elements
- High contrast readability
- Professional, uncluttered appearance

**TEMPLATE ENFORCEMENT:**
- If template says "WATERCOLOR" → Use watercolor texture, NOT illustrations
- If template says "SPLIT PHOTO" → Use real photos split screen, NOT illustrations
- If template says "MEME TEMPLATE" → Use white background with simple text, NOT illustrations
- If template says "POLAROID" → Use retro photo frame style, NOT illustrations
- If template says "TYPOGRAPHY FOCUS" → Focus on text design, NOT illustrations

**FINAL INSTRUCTION:** Create a ${selectedTemplate.style} design following the ${selectedTemplate.name} template using MAXIMUM 3 COLORS ONLY and NO LINES. STRICTLY follow template requirements - do NOT default to illustration style. ABSOLUTE LIMITS: 3 colors maximum, NO lines, FOLLOW TEMPLATE EXACTLY - NO EXCEPTIONS.`;

  // Add brand colors section if colors are available
  if (input.brandProfile?.colors?.primary || input.brandProfile?.colors?.accent || input.brandProfile?.colors?.background) {
    const primaryColor = input.brandProfile.colors.primary || 'default';
    const accentColor = input.brandProfile.colors.accent || 'default';
    const backgroundColor = input.brandProfile.colors.background || 'default';

    imagePrompt += '\n - Brand Colors: The brand\'s color palette is: Primary HSL(' + primaryColor + '), Accent HSL(' + accentColor + '), Background HSL(' + backgroundColor + '). Please use these colors in the design.';
  }

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
            input.visualStyle + " design for " + textOutput.imageText
          );
          analyses.push(analysis);
        } catch (error) {
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
      selectedExamples = isStrictConsistency
        ? input.designExamples
        : [input.designExamples[Math.floor(Math.random() * input.designExamples.length)]];
    }
  }

  // Add design consistency instructions based on analysis
  if (isStrictConsistency) {
    imagePrompt += "\n ** STRICT STYLE REFERENCE:**\n" +
      "Use the provided design examples as strict style reference. Closely match the visual aesthetic, color scheme, typography, layout patterns, and overall design approach of the reference designs. Create content that looks very similar to the uploaded examples while incorporating the new text and subject matter.\n\n" +
      designDNA;
  } else {
    imagePrompt += "\n ** STYLE INSPIRATION:**\n" +
      "Use the provided design examples as loose inspiration for the overall aesthetic and mood, but feel free to create more varied and creative designs while maintaining the brand essence.\n\n" +
      designDNA;

  }

  // Add clean design consistency instruction
  imagePrompt += "\n\n** CLEAN DESIGN CONSISTENCY:** Maintain the same clean, minimal approach for all designs. Focus on clarity and simplicity rather than variation. Each design should feel part of a cohesive, professional brand family.\n\n" +
    "** SIMPLICITY REQUIREMENT:** Every design must prioritize:\n" +
    "- Single clear message\n" +
    "- Generous white space (50%+ empty)\n" +
    "- Maximum 3 visual elements\n" +
    "- High contrast readability\n" +
    "- Professional, uncluttered appearance\n\n" +
    "** GENERATION ID:** " + Date.now() + "_clean_minimal - Clean design approach";

  // Build prompt parts array - Enhanced system temporarily disabled
  const promptParts: any[] = [{ text: imagePrompt }];


  // Enhanced logo integration with analysis
  if (input.logoDataUrl) {
    // Add logo analysis instructions to the prompt
    const logoInstructions =
      "\n\n** CRITICAL LOGO USAGE REQUIREMENTS:**\n" +
      "🚨 MANDATORY: You MUST use the uploaded brand logo image provided below. DO NOT create, generate, or design a new logo.\n\n" +
      "** LOGO INTEGRATION REQUIREMENTS:**\n" +
      "- Use ONLY the provided logo image - never create or generate a new logo\n" +
      "- The uploaded logo is the official brand logo and must be used exactly as provided\n" +
      "- Incorporate the provided logo naturally and prominently into the design\n" +
      "- Ensure logo is clearly visible and properly sized for the platform (minimum 10% of design area)\n" +
      "- Maintain logo's original proportions and readability - do not distort or modify the logo\n" +
      "- Position logo strategically: " + (platformGuidelines.logoPlacement || 'Place logo prominently in corner or integrated into layout') + "\n" +
      "- Ensure sufficient contrast between logo and background (minimum 4.5:1 ratio)\n" +
      "- For " + variant.platform + ": Logo should be clearly visible and recognizable\n\n" +
      "** BRAND CONSISTENCY WITH UPLOADED LOGO:**\n" +
      "- Extract and use colors from the provided logo for the overall color scheme\n" +
      "- Match the design style to complement the logo's aesthetic and personality\n" +
      "- Ensure visual harmony between the uploaded logo and all design elements\n" +
      "- The logo is the primary brand identifier - treat it as the most important visual element";


    // Add additional logo placement instructions
    const logoPlacementInstructions =
      "\n\n** LOGO PLACEMENT PRIORITY:**\n" +
      "- Logo visibility is more important than other design elements\n" +
      "- If space is limited, reduce other elements to ensure logo prominence\n" +
      "- Logo should be one of the first things viewers notice in the design";

    // Update the main prompt with logo instructions
    promptParts[0].text += logoInstructions + logoPlacementInstructions;

    // Add logo as media with high priority
    promptParts.push({
      media: {
        url: input.logoDataUrl,
        contentType: getMimeTypeFromDataURI(input.logoDataUrl)
      }
    });

  } else {
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
        model: 'googleai/gemini-2.5-flash-image-preview',
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
        try {
          imageUrl = await cropImageFromUrl(imageUrl, variant.platform);
        } catch (cropError) {
          // Continue with original image if cropping fails
        }
      }

      // ENHANCED Quality validation for first attempt
      if (attempts === 1) {
        try {

          // Standard quality assessment (Enhanced validation temporarily disabled)
          const quality = await assessDesignQuality(
            imageUrl,
            input.businessType,
            variant.platform,
            input.visualStyle,
            followBrandColors && input.primaryColor ? colorInstructions : undefined,
            "Create engaging design for: " + textOutput.catchyWords
          );


          // If quality is acceptable, use this design
          if (meetsQualityStandards(quality, 7)) {
            finalImageUrl = imageUrl;
            break;
          }

          // If quality is poor and we have attempts left, try to improve
          if (attempts < maxAttempts) {

            // Add improvement instructions to prompt
            const improvementInstructions = generateImprovementPrompt(quality);
            const improvedPrompt = imagePrompt + "\n\n" + improvementInstructions;
            promptParts[0] = { text: improvedPrompt };
            continue;
          } else {
            // Use the design even if quality is subpar (better than nothing)
            finalImageUrl = imageUrl;
            break;
          }
        } catch (qualityError) {
          finalImageUrl = imageUrl;
          break;
        }
      } else {
        // For subsequent attempts, use the result
        finalImageUrl = imageUrl;
        break;
      }
    } catch (error) {
      if (attempts === maxAttempts) {
        throw error;
      }
    }
  }

  // Record design generation for analytics
  if (finalImageUrl) {
    try {
      const designId = "design_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
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
    }
  }

  return {
    platform: variant.platform,
    imageUrl: finalImageUrl,
  };
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

    // Step 1: Intelligent Context Analysis - Determine what information is relevant
    const contextRelevance = selectRelevantContext(
      input.businessType,
      input.location,
      primaryPlatform,
      input.contentThemes,
      input.dayOfWeek
    );


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
      // Template-specific content guidance
      designTemplate: selectedTemplate.name,
      templateStyle: selectedTemplate.style,
      templateDescription: selectedTemplate.description,
      // Language preferences
      useLocalLanguage: input.useLocalLanguage || false,
    });

    if (!textOutput) {
      throw new Error('Failed to generate advanced AI post content.');
    }

    // 🚀 ENHANCED: Generate Strategic Hashtag Analysis using Advanced RSS-Integrated System
    const viralHashtagStrategy = await viralHashtagEngine.generateViralHashtags(
      input.businessType,
      input.businessName || input.businessType, // Use business name if available
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

    // Step 11: Combine text components for image overlay
    const combinedImageText = combineTextComponents(
      textOutput.catchyWords,
      textOutput.subheadline,
      textOutput.callToAction
    );

    // 🎯 ENHANCED: Use Advanced RSS-Integrated Hashtags (exactly 10 hashtags)
    const finalHashtags = viralHashtagStrategy.total.slice(0, 10); // Use the intelligently mixed hashtags

    // Step 13: Combine results with intelligently selected context
    return {
      content: textOutput.content,
      catchyWords: textOutput.catchyWords,
      subheadline: textOutput.subheadline,
      callToAction: textOutput.callToAction,
      hashtags: finalHashtags.join(' '), // Convert to string format
      contentVariants: textOutput.contentVariants,
      hashtagAnalysis: {
        trending: viralHashtagStrategy.trending,
        viral: viralHashtagStrategy.viral,
        niche: viralHashtagStrategy.niche,
        location: viralHashtagStrategy.location,
        community: viralHashtagStrategy.community,
        platform: viralHashtagStrategy.platform,
        seasonal: viralHashtagStrategy.seasonal,
        analytics: viralHashtagStrategy.analytics // Include advanced analytics
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

// Export function for use in other modules
export async function generatePostFromProfile(input: GeneratePostFromProfileInput): Promise<GeneratePostFromProfileOutput> {
  return generatePostFromProfileFlow(input);
}

// End of file
export { generatePostFromProfileFlow };
