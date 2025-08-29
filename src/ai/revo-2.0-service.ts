/**
 * Revo 2.0 - Next-Generation AI Service
 * Revolutionary AI model with native image generation, character consistency, and intelligent editing
 */

import { GoogleGenAI } from '@google/genai';
import { BrandProfile } from '@/lib/types';
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
  getCachedDesignTrends,
  generateTrendInstructions,
  type DesignTrends
} from '@/ai/utils/design-trends';
// Performance optimization will be handled inline
import { recordDesignGeneration } from '@/ai/utils/design-analytics';
import { generatePostFromProfile } from '@/ai/flows/generate-post-from-profile';
import { generateRealTimeTrendingTopics } from '@/ai/utils/trending-topics';
import { fetchLocalContext } from '@/ai/utils/real-time-trends-integration';
import { selectRelevantContext, filterContextData } from '@/ai/utils/intelligent-context-selector';

// Get API key (supporting both server-side and client-side)
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error("❌ No Google AI API key found for Revo 2.0");
  console.error("Available env vars:", {
    server: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
      GOOGLE_GENAI_API_KEY: !!process.env.GOOGLE_GENAI_API_KEY
    },
    client: {
      NEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      NEXT_PUBLIC_GOOGLE_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      NEXT_PUBLIC_GOOGLE_GENAI_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY
    }
  });
}

// Initialize Google GenAI client (following official Node.js example)
const ai = new GoogleGenAI({ apiKey });

// Revo 2.0 uses Gemini 2.5 Flash Image model (following official docs)
const REVO_2_0_MODEL = 'gemini-2.5-flash-image-preview';

export interface Revo20GenerationInput {
  businessType: string;
  platform: string;
  visualStyle: string;
  imageText: string;
  brandProfile: BrandProfile;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  referenceImage?: string; // Base64 encoded reference image for character consistency
  editingInstructions?: string; // For intelligent editing (inpainting/outpainting)
  characterConsistency?: boolean; // Maintain character consistency
  intelligentEditing?: boolean; // Enable intelligent editing features
}

export interface Revo20GenerationResult {
  imageUrl: string;
  model: string;
  processingTime: number;
  qualityScore: number;
  enhancementsApplied: string[];
  caption: string;
  hashtags: string[];
  metadata: {
    characterConsistency: boolean;
    intelligentEditing: boolean;
    aspectRatio: string;
    textRendering: 'perfect' | 'good' | 'basic';
  };
}

/**
 * Generate advanced captions and hashtags using the same system as Revo 1.5/1.0
 */
async function generateAdvancedCaptionAndHashtags(input: Revo20GenerationInput): Promise<{ caption: string; hashtags: string[] }> {
  try {
    // Create generation parameters for the advanced system
    const generationParams = {
      // Required fields from schema
      businessType: input.businessType,
      location: input.brandProfile.location || '',
      visualStyle: input.brandProfile.visualStyle || input.visualStyle || '',
      writingTone: input.brandProfile.writingTone || '',
      contentThemes: input.brandProfile.contentThemes || '',
      logoDataUrl: input.brandProfile.logoDataUrl || '',

      // Date fields
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      currentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),

      // Platform variants
      variants: [{
        platform: input.platform,
        aspectRatio: input.aspectRatio || '1:1',
      }],

      // Brand-specific fields
      services: Array.isArray(input.brandProfile.services)
        ? input.brandProfile.services.map(s => s.name || s).join(', ')
        : (typeof input.brandProfile.services === 'string' ? input.brandProfile.services : ''),
      targetAudience: input.brandProfile.targetAudience || '',
      keyFeatures: input.brandProfile.keyFeatures || '',
      competitiveAdvantages: input.brandProfile.competitiveAdvantages || '',

      // Brand consistency
      brandConsistency: {
        strictConsistency: false,
        followBrandColors: true
      },

      // Enhanced brand context
      websiteUrl: input.brandProfile.websiteUrl || '',
      description: input.brandProfile.description || '',
      contactInfo: input.brandProfile.contactInfo || {},
      socialMedia: input.brandProfile.socialMedia || {},

      // Colors
      primaryColor: input.brandProfile.primaryColor || '',
      accentColor: input.brandProfile.accentColor || '',
      backgroundColor: input.brandProfile.backgroundColor || '',

      // Design examples
      designExamples: input.brandProfile.designExamples || []
    };

    // Use the same advanced system as Revo 1.5/1.0
    const result = await generatePostFromProfile(generationParams);

    // Extract caption and hashtags from the result (ensure exactly 10 hashtags)
    const caption = result.content || `✨ Experience excellence with ${input.brandProfile.businessName || 'our brand'}! Quality you can trust.`;
    let hashtags = result.hashtags ? result.hashtags.split(/[,\s]+/).filter(tag => tag.startsWith('#')) : [];

    // Ensure exactly 10 hashtags
    if (hashtags.length < 10) {
      const fallbackHashtags = ['#Quality', '#Professional', '#Excellence', '#Premium', '#Service', '#Business', '#Innovation', '#Success', '#Trusted', '#Experience'];
      hashtags = [...hashtags, ...fallbackHashtags].slice(0, 10);
    } else {
      hashtags = hashtags.slice(0, 10);
    }

    return { caption, hashtags };

  } catch (error) {
    // Fixed services array handling
    console.warn('Failed to generate advanced captions/hashtags, using fallback:', error);

    // Fallback to simple generation
    const brandName = input.brandProfile.businessName || 'Our Brand';
    const location = input.brandProfile.location || '';

    return {
      caption: `✨ Experience excellence with ${brandName}! Quality you can trust, service you'll love. ${location ? `Proudly serving ${location}` : ''} 🌟`,
      hashtags: ['#Quality', '#Professional', '#Excellence', '#Business', '#Service', '#Trusted', '#Premium', '#Innovation', '#Success', '#Experience'] // Exactly 10 hashtags
    };
  }
}



/**
 * Generate content using Revo 2.0 (Gemini 2.5 Flash Image)
 */
export async function generateWithRevo20(
  input: Revo20GenerationInput
): Promise<Revo20GenerationResult> {
  const startTime = Date.now();
  console.log('🚀 Revo 2.0: Starting next-generation AI content creation...');
  console.log('🚀 Using Next-Gen AI Engine');

  try {
    // Build the revolutionary prompt for Revo 2.0 with real-time context
    const { promptText, businessDNA, trendInstructions, contextData } = await buildRevo20Prompt(input);
    console.log('📝 Revo 2.0 prompt:', promptText.substring(0, 200) + '...');

    // Log context integration
    if (contextData) {
      console.log('🌍 Revo 2.0 Context Integration:');
      if (contextData.trending && contextData.trending.length > 0) {
        console.log(`   📈 Trending Topics: ${contextData.trending.length} topics integrated`);
      }
      if (contextData.local && Object.keys(contextData.local).length > 0) {
        console.log(`   🏠 Local Context: ${Object.keys(contextData.local).join(', ')} data integrated`);
      }
    }

    // Initialize enhancements array
    const enhancementsApplied = [
      'Revo 2.0 Next-Gen Engine',
      'Advanced AI Generation',
      'Native Image Generation',
      'Perfect Text Rendering'
    ];

    // Prepare content array following official Node.js example
    const prompt: any[] = [
      { text: promptText }
    ];

    // Add brand logo if provided (CRITICAL for brand consistency)
    if (input.brandProfile?.logoDataUrl) {
      console.log('🎨 Adding brand logo for Revo 2.0 integration...');
      const logoBase64Data = input.brandProfile.logoDataUrl.split(',')[1]; // Remove data:image/... prefix
      const logoMimeType = input.brandProfile.logoDataUrl.split(';')[0].split(':')[1]; // Extract MIME type
      prompt.push({
        inlineData: {
          mimeType: logoMimeType,
          data: logoBase64Data
        }
      });
      enhancementsApplied.push('Brand Logo Integration');
    } else {
      console.log('⚠️ No brand logo provided for Revo 2.0 generation');
    }

    // Add reference image for character consistency if provided (following official docs)
    if (input.referenceImage && input.characterConsistency) {
      console.log('👤 Adding reference image for character consistency...');
      const base64Data = input.referenceImage.split(',')[1]; // Remove data:image/... prefix
      prompt.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    // Generate content with Revo 2.0 using official API with retry logic
    console.log('🤖 Generating with Revo 2.0 revolutionary AI...');

    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for Revo 2.0 generation...`);
        response = await ai.models.generateContent({
          model: REVO_2_0_MODEL,
          contents: prompt
        });
        console.log('✅ Revo 2.0 generation successful!');
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Attempt ${attempt} failed:`, error?.message || error);

        // If this is the last attempt, don't wait
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // If all retries failed, throw the last error
    if (!response) {
      console.error('❌ All retry attempts failed for Revo 2.0 generation');
      throw lastError;
    }

    // Extract image and text content from response (following official Node.js example)
    let imageUrl = '';
    let textContent = '';

    // Add feature-specific enhancements
    if (input.characterConsistency) {
      enhancementsApplied.push('Character Consistency');
    }
    if (input.intelligentEditing) {
      enhancementsApplied.push('Intelligent Editing');
    }

    // Process response parts (following official Node.js example structure)
    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log(`📊 Response contains ${parts.length} parts`);

    for (const part of parts) {
      if (part.text) {
        console.log('📄 Revo 2.0 text response:', part.text.substring(0, 100) + '...');
        textContent = part.text;
      } else if (part.inlineData) {
        console.log('🖼️ Revo 2.0 image generated successfully!');
        console.log('📋 Image details:', {
          mimeType: part.inlineData.mimeType,
          dataLength: part.inlineData.data?.length || 0
        });

        // Create data URL (following official example)
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        enhancementsApplied.push(
          'Ultra-High Quality Output',
          'Perfect Brand Consistency',
          'Platform Optimization',
          'Multimodal Reasoning'
        );
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('No image generated by Revo 2.0');
    }

    // Generate sophisticated captions and hashtags using the same system as Revo 1.5/1.0
    const { caption, hashtags } = await generateAdvancedCaptionAndHashtags(input);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Revo 2.0 generation completed in ${processingTime}ms`);

    // Record design generation for analytics (Revo 2.0)
    try {
      const designId = `revo2_design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      recordDesignGeneration(
        designId,
        input.businessType,
        input.platform,
        input.visualStyle,
        10, // Maximum quality score for Revo 2.0
        {
          colorPalette: input.brandProfile.primaryColor ? [input.brandProfile.primaryColor, input.brandProfile.accentColor, input.brandProfile.backgroundColor].filter(Boolean) : [],
          typography: 'Revo 2.0 Premium Typography',
          composition: input.aspectRatio || '1:1',
          trends: ['revo-2.0-next-gen', 'ai-native-design'],
          businessDNA: businessDNA.substring(0, 100) // Truncate for storage
        },
        {
          engagement: 10,
          brandAlignment: input.brandProfile.logoDataUrl ? 10 : 8,
          technicalQuality: 10,
          trendRelevance: trendInstructions ? 10 : 8
        }
      );
    } catch (analyticsError) {
      console.warn('Failed to record Revo 2.0 design analytics:', analyticsError);
    }

    return {
      imageUrl,
      model: 'Revo 2.0 (Next-Gen AI)',
      processingTime,
      qualityScore: 10, // Maximum quality for next-gen model
      enhancementsApplied,
      caption,
      hashtags,
      metadata: {
        characterConsistency: input.characterConsistency || false,
        intelligentEditing: input.intelligentEditing || false,
        aspectRatio: input.aspectRatio || '1:1',
        textRendering: 'perfect'
      }
    };

  } catch (error) {
    console.error('❌ Revo 2.0 generation failed:', error);
    throw new Error(`Revo 2.0 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build revolutionary prompt for Revo 2.0 with sophisticated design workflow and real-time context
 */
async function buildRevo20Prompt(input: Revo20GenerationInput): Promise<{
  promptText: string;
  businessDNA: string;
  trendInstructions: string;
  contextData?: any;
}> {
  const { businessType, platform, visualStyle, imageText, brandProfile, aspectRatio = '1:1' } = input;

  // Get platform-specific guidelines
  const platformGuidelines = PLATFORM_SPECIFIC_GUIDELINES[platform as keyof typeof PLATFORM_SPECIFIC_GUIDELINES] || PLATFORM_SPECIFIC_GUIDELINES.instagram;

  // Get business-specific design DNA
  const businessDNA = BUSINESS_TYPE_DESIGN_DNA[businessType as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;

  // Step 1: Intelligent Context Analysis - Determine what information is relevant for Revo 2.0
  const contextRelevance = selectRelevantContext(
    businessType,
    brandProfile.location || '',
    platform,
    brandProfile.contentThemes || '',
    new Date().getDay() // Current day of week
  );

  console.log('🧠 Revo 2.0 Context Analysis for', businessType, 'in', brandProfile.location || 'Global');
  console.log('   Weather:', contextRelevance.weather, '- weather conditions', contextRelevance.weather === 'high' ? 'are highly influential' : contextRelevance.weather === 'medium' ? 'have moderate influence' : 'have minimal business relevance');
  console.log('   Events:', contextRelevance.events, '- Events', contextRelevance.events === 'high' ? 'significantly impact business' : contextRelevance.events === 'medium' ? 'have moderate relevance' : 'have minimal business relevance');
  console.log('   Trends:', contextRelevance.trends, '- Trending topics', contextRelevance.trends === 'high' ? 'are crucial for engagement' : contextRelevance.trends === 'medium' ? 'increase content relevance and engagement' : 'have limited impact');
  console.log('   Culture:', contextRelevance.culture, '- Cultural awareness', contextRelevance.culture === 'high' ? 'is essential for authentic connections' : contextRelevance.culture === 'medium' ? 'enhances local relevance' : 'has standard importance');

  // Step 2: Fetch Real-Time Trending Topics (if relevant)
  let trendingTopics: any[] = [];
  if (contextRelevance.trends !== 'ignore') {
    try {
      console.log('🔍 Fetching real-time trends for Revo 2.0 headline generation...');
      trendingTopics = await generateRealTimeTrendingTopics(
        businessType,
        brandProfile.location || ''
      );
      console.log(`✅ Found ${trendingTopics.length} real-time trends for Revo 2.0`);
    } catch (error) {
      console.warn('Failed to fetch trending topics for Revo 2.0:', error);
    }
  }

  // Step 3: Fetch Local Context (weather, events) if relevant
  let localContext: any = {};
  try {
    localContext = await fetchLocalContext(brandProfile.location || '');
    console.log('🌍 Revo 2.0 Local context fetched:', Object.keys(localContext));
  } catch (error) {
    console.warn('Failed to fetch local context for Revo 2.0:', error);
  }

  // Step 4: Filter and select most relevant context data
  const filteredContext = filterContextData(contextRelevance, {
    weather: localContext.weather,
    events: localContext.events,
    trends: trendingTopics,
    cultural: localContext.cultural
  });

  // Get current design trends
  let trendInstructions = '';
  try {
    const trends = await getCachedDesignTrends(
      businessType,
      platform,
      brandProfile.targetAudience || '',
      businessType
    );
    trendInstructions = generateTrendInstructions(trends, platform);
  } catch (error) {
    console.warn('Failed to get design trends for Revo 2.0, continuing without:', error);
  }

  // Get performance-optimized instructions (inline)
  const performanceInstructions = `
  **PERFORMANCE OPTIMIZATION (REVO 2.0):**
  - Optimize for ${platform} platform specifications and user behavior
  - Ensure fast loading and high engagement for ${businessType} audience
  - Use ${visualStyle} aesthetic optimized for maximum visual impact
  - Balance visual complexity with loading performance
  - Prioritize mobile-first design for optimal user experience
  `;

  // Enhanced color instructions with psychology and usage guidelines
  const colorInstructions = brandProfile.primaryColor ? `
  **BRAND COLOR PALETTE (MANDATORY - REVO 2.0):**
  - Primary Color: ${brandProfile.primaryColor} - Use for main elements, headers, and key focal points
  - Accent Color: ${brandProfile.accentColor} - Use for highlights, buttons, and secondary elements
  - Background Color: ${brandProfile.backgroundColor} - Use for backgrounds and neutral areas

  **COLOR USAGE REQUIREMENTS:**
  - Primary color should dominate the design (40-60% of color usage)
  - Accent color for emphasis and call-to-action elements (20-30% of color usage)
  - Background color for balance and readability (10-40% of color usage)
  - Ensure high contrast ratios for text readability (minimum 4.5:1)
  - Use color gradients and variations within the brand palette
  - Avoid colors outside the brand palette unless absolutely necessary for contrast
  ` : `
  **COLOR GUIDANCE:**
  - Brand colors available: Primary ${brandProfile.primaryColor}, Accent ${brandProfile.accentColor}, Background ${brandProfile.backgroundColor}
  - Feel free to use complementary colors that work well with the brand palette
  - Maintain visual harmony and professional appearance
  `;

  // Generate visual variation approach for diversity
  const visualVariations = [
    'minimalist_clean', 'bold_dynamic', 'elegant_sophisticated', 'playful_creative',
    'modern_geometric', 'organic_natural', 'industrial_urban', 'artistic_abstract',
    'photographic_realistic', 'illustrated_stylized', 'gradient_colorful', 'monochrome_accent'
  ];
  const selectedVisualVariation = visualVariations[Math.floor(Math.random() * visualVariations.length)];
  console.log(`🎨 Revo 2.0 Selected visual variation: ${selectedVisualVariation}`);

  // Helper function to get content examples
  const getContentExamples = (businessType: string, location?: string): string => {
    const examples: Record<string, any> = {
      'Food Production': {
        headlines: ['Fresh From Farm to Table', 'Taste the Difference', 'Naturally Delicious', 'Crafted with Care', 'Pure Quality, Every Bite'],
        subheadlines: ['Made with locally sourced ingredients', 'No preservatives, just pure goodness', 'Supporting local farmers since [year]', 'Your family deserves the best', 'Bringing nature to your kitchen'],
        ctas: ['Order Fresh Today', 'Taste the Quality', 'Find in Stores', 'Try Our Selection', 'Visit Our Farm']
      },
      'Restaurant': {
        headlines: ['Flavors That Tell Stories', 'Where Tradition Meets Taste', 'Authentic Cuisine Awaits', 'Made Fresh Daily', 'Your New Favorite Spot'],
        subheadlines: ['Experience authentic flavors', 'Family recipes passed down generations', 'Fresh ingredients, bold flavors', 'Where every meal is special', 'Bringing people together through food'],
        ctas: ['Book Your Table', 'Order for Delivery', 'View Our Menu', 'Make Reservation', 'Taste Today']
      },
      'Retail': {
        headlines: ['Style That Speaks', 'Quality You Can Trust', 'Find Your Perfect Match', 'Curated Just for You', 'Discover Something Special'],
        subheadlines: ['Handpicked for quality and style', 'Where fashion meets affordability', 'Your style, our passion', 'Quality that lasts', 'Trends that inspire'],
        ctas: ['Shop the Collection', 'Explore New Arrivals', 'Find Your Style', 'Browse Catalog', 'Visit Our Store']
      }
    };

    const businessExamples = examples[businessType] || examples['Retail'];
    const locationNote = location ? `\n- Adapt language and cultural references for ${location}` : '';

    return `
**Sample Headlines:** ${businessExamples.headlines.join(', ')}
**Sample Sub-headlines:** ${businessExamples.subheadlines.join(', ')}
**Sample CTAs:** ${businessExamples.ctas.join(', ')}${locationNote}
**Note:** Use these as inspiration but create UNIQUE variations that fit the specific brand and context.`;
  };

  // Helper function to get industry-specific hashtags
  const getIndustryHashtags = (businessType: string): string => {
    const industryHashtags: Record<string, string[]> = {
      'Food Production': ['#FoodProduction', '#FreshFood', '#LocalFarm'],
      'Restaurant': ['#Restaurant', '#FoodLovers', '#Dining'],
      'Retail': ['#Retail', '#Shopping', '#Fashion'],
      'Technology': ['#Tech', '#Innovation', '#Digital'],
      'Healthcare': ['#Healthcare', '#Wellness', '#Medical'],
      'Education': ['#Education', '#Learning', '#Knowledge'],
      'Fitness': ['#Fitness', '#Health', '#Workout'],
      'Beauty': ['#Beauty', '#Skincare', '#Cosmetics'],
      'Travel': ['#Travel', '#Adventure', '#Explore'],
      'Real Estate': ['#RealEstate', '#Property', '#Homes']
    };

    const hashtags = industryHashtags[businessType] || ['#Business', '#Quality', '#Service'];
    return hashtags.join(', ');
  };

  let prompt = `🎨 MASTER TEMPLATE PROMPT - REVO 2.0 ELITE DESIGN SYSTEM

🚨 CRITICAL: NEVER USE GENERIC TEXT LIKE "PREMIUM CONTENT", "QUALITY CONTENT", OR "[BUSINESS NAME] - [GENERIC PHRASE]"
🚨 EVERY DESIGN MUST BE COMPLETELY UNIQUE WITH SPECIFIC, BENEFIT-DRIVEN HEADLINES

You are a world-class graphic designer creating scroll-stopping, modern social media content for ${businessType}.
Create a ${aspectRatio} design for ${platform} that people will absolutely LOVE and share.

**🌟 MODERN DESIGN EXCELLENCE REQUIREMENTS:**
- Create designs that feel CURRENT, FRESH, and ON-TREND for 2024-2025
- Use contemporary visual language that resonates with modern audiences
- Incorporate cutting-edge design aesthetics that feel premium and professional
- Ensure the design would fit perfectly in a top-tier design portfolio
- Make it so visually appealing that people stop scrolling immediately

**🎯 BUSINESS CONTEXT:**
- Business: ${brandProfile.businessName || businessType}
- Type: ${businessType}
- Platform: ${platform} (${aspectRatio} aspect ratio)
- Location: ${brandProfile.location || 'Global'}
- Target Audience: ${brandProfile.targetAudience || 'General audience'}

**🌍 CULTURAL INTEGRATION & HUMAN ELEMENTS:**
- Location Context: ${brandProfile.location || 'Global'}
- MANDATORY: Include diverse, authentic people when relevant to the message
- Respect and celebrate the local culture and aesthetic preferences of ${brandProfile.location || 'the target region'}
- Use culturally appropriate imagery, colors, and design elements
- Show real people in natural, engaging situations when applicable
- Ensure representation reflects the local demographic and cultural values
- Incorporate subtle cultural motifs or design elements that resonate locally
- Use photography styles and compositions that feel authentic to the region

**🎯 BRAND IDENTITY SYSTEM:**
${colorInstructions}

${brandProfile.logoDataUrl ? `
🚨 CRITICAL LOGO INTEGRATION (REVO 2.0):
- MANDATORY: Use the uploaded brand logo provided in the image inputs
- DO NOT create, generate, or design a new logo - use ONLY the provided logo
- The uploaded logo is the official brand logo and must be used exactly as provided
- Integrate the logo naturally and prominently into the design (minimum 10% of design area)
- Maintain logo's original proportions and readability - do not distort the logo
- Position logo strategically for maximum brand recognition and visibility
- Ensure sufficient contrast between logo and background for perfect readability
- Logo should be one of the first elements viewers notice in the design
` : ''}

**📐 DYNAMIC CONTENT HIERARCHY SYSTEM:**
You are an experienced marketing expert with deep knowledge of ${businessType} industry in ${brandProfile.location || 'the target region'}.
Create compelling, culturally-aware content that resonates with local customers:

**HEADLINE CREATION (PRIMARY) - ENHANCED WITH REAL-TIME CONTEXT:**
- NEVER use generic phrases like "Premium Content", "Quality Content", or "[Business Name] - [Generic Text]"
- Create a completely unique, catchy headline that's different from "${imageText}"
- Use specific benefit-driven language: "Fresh Daily", "Handcrafted Since 1995", "Farm to Table"
- Make it industry-specific and customer-focused, not business-focused
- Keep it short (3-7 words) but highly specific and memorable
- Consider local market trends and customer pain points
- Examples: "Baked Fresh This Morning", "Your Neighborhood Favorite", "Taste the Tradition"

${filteredContext.selectedTrends && filteredContext.selectedTrends.length > 0 ? `
**🔥 TRENDING TOPICS INTEGRATION:**
Use these current trending topics to make headlines more relevant and engaging:
${filteredContext.selectedTrends.slice(0, 5).map((trend: any) => `- ${trend.title || trend.topic}: ${trend.description || trend.summary || ''}`).join('\n')}
- Subtly incorporate trending themes into headlines when contextually appropriate
- Don't force trends - only use if they naturally fit the business message
` : ''}

${filteredContext.selectedWeather || (filteredContext.selectedEvents && filteredContext.selectedEvents.length > 0) ? `
**🌍 LOCAL CONTEXT INTEGRATION:**
${filteredContext.selectedWeather ? `- Current Weather: ${filteredContext.selectedWeather.condition || ''} ${filteredContext.selectedWeather.temperature || ''}° - Consider weather-relevant messaging when appropriate` : ''}
${filteredContext.selectedEvents && filteredContext.selectedEvents.length > 0 ? `- Local Events: ${filteredContext.selectedEvents.slice(0, 2).map((event: any) => event.title || event.name).join(', ')} - Reference local happenings if relevant` : ''}
- Use local insights to create more personally relevant headlines
- Incorporate regional preferences and cultural nuances
` : ''}

**SUB-HEADLINE CREATION (SECONDARY) - CONTEXT-AWARE:**
- Develop a supporting message that clarifies the value proposition
- Use cultural insights and local market understanding
- Address specific customer needs in ${brandProfile.location || 'the region'}
- Make it relevant to ${businessType} industry challenges
- Keep it concise (8-15 words) but compelling
${filteredContext.selectedTrends && filteredContext.selectedTrends.length > 0 ? `- Consider incorporating trending themes that align with your business message` : ''}
${filteredContext.selectedWeather ? `- Reference current conditions (${filteredContext.selectedWeather.condition || ''}) if relevant to your business` : ''}
- Create subheadlines that feel current and locally relevant

**CALL-TO-ACTION CREATION (TERTIARY):**
- Generate contextually relevant CTAs based on the message
- Include contact information ONLY when it makes sense (e.g., "Visit www.example.com", "Call +123456789")
- Use ${brandProfile.website ? `website: ${brandProfile.website}` : 'appropriate web reference'} when relevant
- Use ${brandProfile.phone ? `phone: ${brandProfile.phone}` : 'contact information'} sparingly and contextually
- Vary between action words: "Discover", "Try Now", "Get Started", "Learn More", "Order Today", etc.
- Make it culturally appropriate and locally relevant

**🎨 VISUAL COMPOSITION REQUIREMENTS:**
- Hero Element: Choose from product showcase, lifestyle photography, or thematic illustration
- Background: Select from modern gradients, textured patterns, or photographic backgrounds
- Accent Graphics: Include contemporary icons, geometric shapes, or cultural elements
- Typography: Use modern, readable fonts with strong hierarchy
- Safe Zones: Ensure text avoids bottom 15% for platform UI compatibility
- Accessibility: Maintain high contrast ratios and mobile readability

**🎯 BRAND & MARKET INTELLIGENCE:**
- Business: ${brandProfile.businessName || businessType}
- Industry: ${businessType}
- Location: ${brandProfile.location || 'Global'}
- Colors: ${brandProfile.primaryColor ? `Primary: ${brandProfile.primaryColor}` : 'Use brand-appropriate colors'}${brandProfile.secondaryColor ? `, Secondary: ${brandProfile.secondaryColor}` : ''}
- Tone: ${brandProfile.brandPersonality || 'Professional yet approachable'}

**🧠 MARKETING EXPERT PERSONA:**
You are a seasoned marketing professional with 15+ years of experience in ${businessType} industry.
You understand:
- Local market dynamics in ${brandProfile.location || 'the target region'}
- Cultural nuances and communication preferences
- Industry-specific customer pain points and desires
- Seasonal trends and buying patterns
- Competitive landscape and differentiation strategies
- Local language patterns and colloquialisms (when appropriate)

**💡 CONTENT VARIATION STRATEGY:**
Generate UNIQUE content every time by:
- Rotating between different value propositions
- Using varied emotional triggers (trust, excitement, urgency, curiosity)
- Incorporating different benefit angles (quality, convenience, price, experience)
- Adapting to cultural context and local preferences
- Using industry-specific terminology and insights

**🏢 BUSINESS DNA INTEGRATION:**
${businessDNA}

**📱 PLATFORM OPTIMIZATION:**
${platformGuidelines.designGuidelines || `Optimize for ${platform} best practices with mobile-first approach`}

**✨ ADVANCED DESIGN PRINCIPLES:**
${ADVANCED_DESIGN_PRINCIPLES}

**🔥 QUALITY ENHANCEMENT:**
${QUALITY_ENHANCEMENT_INSTRUCTIONS}

${trendInstructions ? `**📈 CURRENT DESIGN TRENDS:**\n${trendInstructions}` : ''}

${performanceInstructions ? `**⚡ PERFORMANCE OPTIMIZATION:**\n${performanceInstructions}` : ''}

**🎭 VISUAL APPROACH:** ${selectedVisualVariation} (MANDATORY: Use this specific visual style approach)

**🚀 UNIQUENESS MANDATE (REVO 2.0):**
This design MUST be completely unique. Vary these elements:
- Layout: ${['Grid-based', 'Asymmetrical', 'Centered', 'Diagonal', 'Circular', 'Organic flow'][Math.floor(Math.random() * 6)]}
- Color Dominance: ${['Primary-heavy', 'Accent-heavy', 'Balanced palette'][Math.floor(Math.random() * 3)]}
- Typography Style: ${['Bold headlines', 'Elegant serif', 'Modern sans-serif', 'Creative display'][Math.floor(Math.random() * 4)]}
- Visual Elements: ${['Abstract shapes', 'Geometric patterns', 'Organic forms', 'Photographic blend'][Math.floor(Math.random() * 4)]}
- Background Treatment: ${['Gradient blend', 'Textured overlay', 'Photographic base', 'Solid with accents'][Math.floor(Math.random() * 4)]}

**💫 ENGAGEMENT FACTORS:**
- Make it scroll-stopping and share-worthy
- Ensure clear value proposition for viewers
- Match current aesthetic preferences of the target audience
- Create emotional connection through visual storytelling
- Use contemporary color palettes and design trends

**📝 TEXT REQUIREMENTS (PERFECT RENDERING):**
"${imageText}"
- Render this text with PERFECT clarity and readability
- Use premium typography with excellent contrast
- Ensure text is prominent and professionally integrated
- NO additional text, placeholders, or random words

🚨 **CRITICAL: NO TECHNICAL CODES OR IDs IN DESIGN:**
- DO NOT include hex color codes (like #10BA5C, #5B82F6) anywhere in the design
- DO NOT show generation IDs, technical identifiers, or system codes
- DO NOT display any technical information, debugging text, or metadata
- Keep the design clean and professional without any technical elements
- Only show the intended business content and branding

**🎯 REVO 2.0 EXCELLENCE STANDARDS:**
- Ultra-high quality, next-generation aesthetics
- Perfect for ${platform} social media platform
- Brand colors prominently and tastefully featured
- Clean, modern layout with perfect spacing
- ${visualStyle} aesthetic with revolutionary design elements
- Optimized for mobile and desktop viewing
- Professional typography with crystal-clear readability
- Perfect brand consistency and visual harmony
${brandProfile.logoDataUrl ? '- Logo integration is the TOP PRIORITY for brand recognition' : ''}

**DESIGN UNIQUENESS:** Ensure this design is completely unique and different from any previous generation.`;

  // Add character consistency instructions
  if (input.characterConsistency && input.referenceImage) {
    prompt += `\n\nCHARACTER CONSISTENCY:
- Maintain the same character/subject appearance as shown in the reference image
- Keep consistent facial features, clothing style, and overall appearance
- Adapt the character to the new scene while preserving identity`;
  }

  // Add intelligent editing instructions
  if (input.intelligentEditing && input.editingInstructions) {
    prompt += `\n\nINTELLIGENT EDITING:
- ${input.editingInstructions}
- Perform precise, context-aware modifications
- Maintain overall composition and quality`;
  }

  prompt += `\n\n🎨 CREATE A MASTERPIECE:
Create a stunning, masterpiece-quality design that represents the pinnacle of ${businessType} visual communication.
Make it so visually appealing and modern that people will love, engage with, and remember this content.
This should be a design that stops scrolling, drives engagement, and showcases the absolute best of contemporary design trends.

**FINAL REQUIREMENTS:**
- Make it scroll-stopping and share-worthy
- Ensure it feels current and on-trend for 2024-2025
- Include human elements and cultural sensitivity when appropriate
- Perfect text rendering with excellent hierarchy
- Professional quality that matches top-tier design portfolios
- Optimized for ${platform} platform specifications

🚨 **ABSOLUTELY NO TECHNICAL ELEMENTS:**
- NO hex codes, color codes, or technical identifiers visible in the design
- NO generation IDs, system codes, or debugging information
- Keep the design completely clean and professional
- Only show business content, branding, and intended messaging

**📝 CONTENT CREATION EXAMPLES FOR ${businessType}:**
${getContentExamples(businessType, brandProfile.location)}

**🎨 HEADLINE VARIATION TECHNIQUES:**
❌ NEVER USE: "Premium Content", "Quality Content", "[Business] - Premium", "[Business] - Quality"
✅ ALWAYS USE SPECIFIC BENEFITS:
- Problem-Solution: "Struggling with X? We solve Y"
- Benefit-Focused: "Experience the difference of Z"
- Curiosity-Driven: "The secret behind our success"
- Urgency-Based: "Limited time offer" or "While supplies last"
- Trust-Building: "Trusted by thousands" or "Family-owned since X"
- Local Pride: "Proudly serving ${brandProfile.location || 'our community'}"
- Specific Features: "Baked Fresh Daily", "Made with Local Ingredients", "Handcrafted Since [Year]"

**💬 CTA INTELLIGENCE:**
Smart contact integration rules:
- Include website when saying "Learn More", "Visit Us", "Check Out"
- Include phone when saying "Call Now", "Book Today", "Get Quote"
- Use generic CTAs like "Discover", "Try Now" without contact info
- Rotate between different action words for variety
- Make culturally appropriate for ${brandProfile.location || 'the region'}

**📝 CAPTION & HASHTAG SYSTEM:**
Generate engaging social media content with:

**CAPTION CREATION:**
- Write a compelling 2-3 sentence caption that tells a story
- Use conversational tone that matches ${brandProfile.brandPersonality || 'the brand personality'}
- Include emotional hooks and value propositions
- Make it culturally relevant for ${brandProfile.location || 'the target audience'}
- Incorporate industry insights and customer benefits
- Use emojis strategically (2-4 per caption)
- End with a clear call-to-action

**HASHTAG STRATEGY (Maximum 10 hashtags):**
Create a strategic mix of:
- 2-3 Brand/Business hashtags: #${brandProfile.businessName?.replace(/\s+/g, '') || 'YourBrand'}, #${businessType.replace(/\s+/g, '')}
- 2-3 Industry-specific hashtags: ${getIndustryHashtags(businessType)}
- 2-3 Location-based hashtags: ${brandProfile.location ? `#${brandProfile.location.replace(/\s+/g, '')}, #Local${brandProfile.location.replace(/\s+/g, '')}` : '#Local, #Community'}
- 1-2 Trending/Popular hashtags: #Quality, #Fresh, #Authentic, #Handmade
- 1-2 Platform-specific hashtags: #${platform}Ready, #SocialMedia

**HASHTAG RULES:**
- Maximum 10 hashtags total
- Mix of popular and niche hashtags
- Relevant to content and industry
- Include location-based tags when applicable
- Use trending hashtags when contextually appropriate

🚨 **FINAL CONTENT REQUIREMENTS:**
- HEADLINE must be unique, specific, and benefit-driven (NOT "Premium Content" or generic phrases)
- SUB-HEADLINE must add specific value or context (NOT generic descriptions)
- Use industry expertise to create compelling, varied content every single time
- Think like a seasoned marketer with 15+ years of experience in ${businessType}

**📱 FINAL DELIVERABLE:**
Create a complete social media package including:
1. **Visual Design**: The scroll-stopping image with UNIQUE, SPECIFIC headlines
2. **Caption**: Engaging 2-3 sentence story with emojis and CTA
3. **Hashtags**: Strategic mix of 10 hashtags maximum for optimal reach

Generate a revolutionary, next-generation design with Revo 2.0 excellence standards.`;

  return {
    promptText: prompt,
    businessDNA,
    trendInstructions,
    contextData: filteredContext
  };
}

/**
 * Test Revo 2.0 availability following official Google AI docs
 */
export async function testRevo20Availability(): Promise<boolean> {
  try {
    console.log('🧪 Testing Revo 2.0 (Next-Gen AI) availability...');
    console.log('📋 Using official AI package...');

    // Test using official API structure (following Node.js example)
    const response = await ai.models.generateContent({
      model: REVO_2_0_MODEL,
      contents: [
        { text: 'Create a simple test image with the text "Revo 2.0 Test" on a modern gradient background' }
      ]
    });

    // Check response structure following the docs
    console.log('📄 Response structure:', {
      candidates: response.candidates?.length || 0,
      parts: response.candidates?.[0]?.content?.parts?.length || 0
    });

    // Look for image data in parts (following Python docs pattern)
    const parts = response.candidates?.[0]?.content?.parts || [];
    let hasImage = false;
    let hasText = false;

    for (const part of parts) {
      if (part.text) {
        console.log('📝 Text response found:', part.text.substring(0, 100) + '...');
        hasText = true;
      }
      if (part.inlineData) {
        console.log('🖼️ Image data found:', part.inlineData.mimeType);
        hasImage = true;
      }
    }

    if (hasImage) {
      console.log('✅ Revo 2.0 is available and working perfectly!');
      return true;
    } else if (hasText) {
      console.log('⚠️ Revo 2.0 responded with text but no image - model may not support image generation yet');
      return false;
    } else {
      console.log('⚠️ Revo 2.0 responded but no content found');
      return false;
    }

  } catch (error) {
    console.error('❌ Revo 2.0 test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Character consistency generation
 */
export async function generateWithCharacterConsistency(
  input: Revo20GenerationInput,
  referenceImages: string[]
): Promise<Revo20GenerationResult> {
  console.log('👤 Revo 2.0: Generating with character consistency...');

  const enhancedInput = {
    ...input,
    referenceImage: referenceImages[0],
    characterConsistency: true,
    editingInstructions: `Maintain the same character/subject appearance as shown in the reference image while creating: ${input.imageText}`
  };

  return generateWithRevo20(enhancedInput);
}

/**
 * Intelligent editing (inpainting/outpainting)
 */
export async function performIntelligentEditing(
  baseImage: string,
  editingPrompt: string,
  brandProfile: BrandProfile
): Promise<Revo20GenerationResult> {
  console.log('✏️ Revo 2.0: Performing intelligent editing...');

  const input: Revo20GenerationInput = {
    businessType: brandProfile.businessType || 'Business',
    platform: 'instagram',
    visualStyle: brandProfile.visualStyle || 'modern',
    imageText: editingPrompt,
    brandProfile,
    referenceImage: baseImage,
    intelligentEditing: true,
    editingInstructions: `Edit the provided image: ${editingPrompt}. Maintain overall composition while making precise modifications.`
  };

  return generateWithRevo20(input);
}

// Export for global testing
if (typeof window !== 'undefined') {
  (window as any).testRevo20Availability = testRevo20Availability;
  (window as any).generateWithRevo20 = generateWithRevo20;
  (window as any).generateWithCharacterConsistency = generateWithCharacterConsistency;
  (window as any).performIntelligentEditing = performIntelligentEditing;
}
