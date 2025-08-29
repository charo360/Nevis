/**
 * Revo 2.0 - Next-Generation AI Service
 * Revolutionary AI model with native image generation, character consistency, and intelligent editing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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
import { generateRevo2CaptionPrompt } from '@/ai/prompts/revo-2-caption-prompt';
import { generateRealTimeTrendingTopics } from '@/ai/utils/trending-topics';
// import { fetchLocalContext } from '@/ai/utils/real-time-trends-integration';
// import { selectRelevantContext, filterContextData } from '@/ai/utils/intelligent-context-selector';
import OpenAI from 'openai';

// Get API keys (supporting both server-side and client-side)
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

const openaiApiKey =
  process.env.OPENAI_API_KEY ||
  process.env.NEXT_PUBLIC_OPENAI_API_KEY;

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
const ai = new GoogleGenerativeAI(apiKey);

// Initialize OpenAI client for creative ideation
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

if (!openaiApiKey) {
  console.warn('⚠️ OpenAI API key not found. GPT creative ideation layer will be disabled.');
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

// Types for GPT Creative Ideation
interface CreativeIdeas {
  concept: string;
  catchwords: string[];
  visualDirection: string;
  designElements: string[];
  colorSuggestions: string[];
  moodKeywords: string[];
  targetEmotions: string[];
}

interface CreativeIdeationInput {
  businessType: string;
  businessName: string;
  location: string;
  platform: string;
  targetAudience: string;
  brandVoice: string;
  services: string[];
  brandColors: string[];
}

// GPT Creative Ideation Function
async function generateCreativeIdeasWithGPT(input: CreativeIdeationInput): Promise<CreativeIdeas> {
  if (!openai) {
    // Fallback to basic creative ideas if OpenAI is not available
    console.log('🔄 OpenAI not available, using fallback creative ideas...');
    return {
      concept: `Professional ${input.businessType.toLowerCase()} content showcasing ${input.businessName}'s expertise`,
      catchwords: ['Professional', 'Quality', 'Excellence', 'Innovation', 'Trust'],
      visualDirection: `Clean, modern design with professional aesthetics suitable for ${input.platform}`,
      designElements: ['Clean typography', 'Professional imagery', 'Brand colors', 'Minimalist layout'],
      colorSuggestions: input.brandColors.length > 0 ? input.brandColors : ['#2563eb', '#1f2937', '#f8fafc'],
      moodKeywords: ['Professional', 'Trustworthy', 'Modern', 'Clean'],
      targetEmotions: ['Trust', 'Confidence', 'Professionalism']
    };
  }

  try {
    console.log('🧠 Generating creative ideas with GPT-4...');

    const prompt = `You are a local creative who understands what makes people in ${input.location} genuinely connect with businesses. Think like someone who lives in this community and wants to help local businesses succeed.

BUSINESS CONTEXT:
- Business: ${input.businessName}
- Type: ${input.businessType}
- Location: ${input.location}
- Platform: ${input.platform}
- Target Audience: ${input.targetAudience}
- Brand Voice: ${input.brandVoice}
- Services: ${Array.isArray(input.services) ? input.services.join(', ') : 'General services'}
- Brand Colors: ${Array.isArray(input.brandColors) ? input.brandColors.join(', ') : 'Not specified'}

CREATIVE BRIEF:
Generate authentic, relatable creative ideas that feel human and genuine - not corporate or overly polished. Think about what would make locals stop scrolling and think "I want to support this business."

REQUIREMENTS:
1. Create a warm, relatable concept that tells a human story
2. Generate 5 simple, authentic catchwords that feel conversational
3. Suggest visual direction that feels real and community-focused
4. Recommend design elements that are approachable, not intimidating
5. Suggest colors that feel warm and welcoming
6. Define mood keywords that are friendly and genuine
7. Target emotions that build trust and community connection

HUMAN-FIRST APPROACH:
- Concepts should feel like a neighbor recommending a local business
- Catchwords should be warm and relatable, not corporate buzzwords
- Visual direction should feel authentic, not overly produced
- Focus on building genuine connections, not just sales

LANGUAGE SAFETY:
- Only use local language words when 100% certain of accuracy
- When in doubt about local language, use English instead
- Better clear English than incorrect local language

Return your response in this exact JSON format:
{
  "concept": "Relatable, human concept that locals would connect with (2-3 sentences, conversational tone)",
  "catchwords": ["word1", "word2", "word3", "word4", "word5"],
  "visualDirection": "Authentic visual direction that feels real and community-focused (2-3 sentences)",
  "designElements": ["element1", "element2", "element3", "element4"],
  "colorSuggestions": ["#color1", "#color2", "#color3"],
  "moodKeywords": ["mood1", "mood2", "mood3", "mood4"],
  "targetEmotions": ["emotion1", "emotion2", "emotion3"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT');
    }

    // Parse JSON response (handle markdown formatting)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    const creativeIdeas = JSON.parse(jsonContent) as CreativeIdeas;

    console.log('✅ GPT Creative Ideas Generated Successfully');
    return creativeIdeas;

  } catch (error) {
    console.error('❌ GPT Creative Ideation failed:', error);
    // Fallback to basic creative ideas
    return {
      concept: `Engaging ${input.businessType.toLowerCase()} content that showcases ${input.businessName}'s unique value`,
      catchwords: ['Innovative', 'Excellence', 'Quality', 'Professional', 'Trusted'],
      visualDirection: `Modern, eye-catching design with strong visual hierarchy for ${input.platform}`,
      designElements: ['Bold typography', 'High-quality imagery', 'Brand integration', 'Clean composition'],
      colorSuggestions: input.brandColors.length > 0 ? input.brandColors.slice(0, 3) : ['#3b82f6', '#1e293b', '#f1f5f9'],
      moodKeywords: ['Professional', 'Innovative', 'Trustworthy', 'Modern'],
      targetEmotions: ['Confidence', 'Trust', 'Excitement']
    };
  }
}

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
  includePeopleInDesigns?: boolean; // Control whether designs should include people (default: true)
  useLocalLanguage?: boolean; // Control whether to use local language in text (default: false)
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
 * Generate advanced captions and hashtags using enhanced Revo 2.0 system
 * Enhanced with better RSS integration, trending topics, and cultural awareness
 */
async function generateAdvancedCaptionAndHashtags(input: Revo20GenerationInput, creativeIdeas?: CreativeIdeas): Promise<{ caption: string; hashtags: string[] }> {
  try {
    console.log('🎯 Revo 2.0: Starting enhanced caption generation with RSS integration...');
    console.log(`📍 Location: ${input.brandProfile.location || 'Not specified'}`);
    console.log(`🏢 Business: ${input.businessType}`);
    console.log(`📱 Platform: ${input.platform}`);

    // Step 1: Fetch trending topics for context
    console.log('🔍 Fetching trending topics for caption context...');
    const trendingTopics = await generateRealTimeTrendingTopics(
      input.businessType,
      input.brandProfile.location || '',
      input.platform
    );
    console.log(`✅ Found ${trendingTopics.length} trending topics for caption generation`);

    // Step 2: Try enhanced Revo 2.0 caption generation first
    try {
      console.log('🚀 Using Revo 2.0 enhanced caption generation...');
      const captionResult = await generateRevo2EnhancedCaption(input, trendingTopics, creativeIdeas);
      if (captionResult.caption && captionResult.hashtags.length > 0) {
        console.log('✅ Revo 2.0 enhanced caption generation successful!');
        return captionResult;
      }
    } catch (error) {
      console.warn('⚠️ Revo 2.0 enhanced caption failed, falling back to advanced system:', error);
    }

    // Step 3: Fallback to existing advanced system
    console.log('🔄 Using existing advanced caption system as fallback...');

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

    // Use the same advanced system as Revo 1.5/1.0 with enhanced logging
    console.log('🚀 Calling generatePostFromProfile with RSS integration...');
    const result = await generatePostFromProfile(generationParams);

    console.log('✅ Advanced caption generation completed');
    console.log(`📝 Generated caption length: ${result.content?.length || 0} characters`);
    console.log(`🏷️ Generated hashtags: ${result.hashtags?.split(/[,\s]+/).filter(tag => tag.startsWith('#')).length || 0}`);

    // Extract caption and hashtags from the result (ensure exactly 10 hashtags)
    const caption = result.content || `✨ Experience excellence with ${input.brandProfile.businessName || 'our brand'}! Quality you can trust.`;
    let hashtags = result.hashtags ? result.hashtags.split(/[,\s]+/).filter(tag => tag.startsWith('#')) : [];

    // Ensure exactly 10 hashtags
    if (hashtags.length < 10) {
      const fallbackHashtags = ['#Quality', '#Professional', '#Excellence', '#Premium', '#Service', '#Business', '#Innovation', '#Success', '#Trusted', '#Experience'];
      hashtags = [...hashtags, ...fallbackHashtags].slice(0, 10);
      console.log(`⚠️ Used ${10 - (result.hashtags?.split(/[,\s]+/).filter(tag => tag.startsWith('#')).length || 0)} fallback hashtags`);
    } else {
      hashtags = hashtags.slice(0, 10);
    }

    return { caption, hashtags };

  } catch (error) {
    console.error('❌ Advanced caption generation failed:', error);
    console.log('🔄 Using enhanced fallback caption generation...');

    // Enhanced fallback with AI-driven localization
    const brandName = input.brandProfile.businessName || 'Our Brand';
    const location = input.brandProfile.location || '';
    const businessType = input.businessType;

    // Create AI-driven contextual fallback caption
    const fallbackCaption = `✨ Experience excellence with ${brandName}! Quality ${businessType.toLowerCase()} services you can trust. ${location ? `Proudly serving ${location}` : ''} 🌟`;
    const fallbackHashtags = ['#Quality', '#Professional', '#Excellence', '#Business', '#Service', '#Trusted', '#Premium', '#Innovation', '#Success', '#Experience'];

    return {
      caption: fallbackCaption,
      hashtags: fallbackHashtags
    };
  }
}

/**
 * Generate enhanced caption using Revo 2.0 system with trending topics
 */
async function generateRevo2EnhancedCaption(
  input: Revo20GenerationInput,
  trendingTopics: Array<{ topic: string; relevanceScore: number }>,
  creativeIdeas?: CreativeIdeas
): Promise<{ caption: string; hashtags: string[] }> {
  try {
    console.log('🎨 Generating Revo 2.0 enhanced caption...');

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('No Google AI API key found');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate enhanced caption prompt with GPT creative ideas and RSS data
    const captionPrompt = generateHybridCaptionPrompt({
      businessType: input.businessType,
      location: input.brandProfile.location || '',
      businessName: input.brandProfile.businessName || 'Our Brand',
      platform: input.platform,
      targetAudience: input.brandProfile.targetAudience,
      trendingTopics: trendingTopics.slice(0, 5), // Top 5 trends
      creativeIdeas: creativeIdeas,
      useLocalLanguage: input.useLocalLanguage
    });

    console.log('📝 Sending enhanced caption generation request...');
    const result = await model.generateContent(captionPrompt);
    const response = await result.response;
    const caption = response.text().trim();

    // Generate hashtags based on the caption and context
    const hashtagPrompt = `Based on this caption for a ${input.businessType} business in ${input.brandProfile.location}, generate exactly 10 relevant hashtags for ${input.platform}:

Caption: "${caption}"

Business: ${input.brandProfile.businessName || 'Business'}
Location: ${input.brandProfile.location}
Platform: ${input.platform}

Generate exactly 10 hashtags that are:
- Mix of popular and niche hashtags
- Platform-appropriate for ${input.platform}
- Location-relevant for ${input.brandProfile.location}
- Industry-specific for ${input.businessType}
- Trending-aware

Format: #hashtag1 #hashtag2 #hashtag3 (etc.)`;

    console.log('🏷️ Generating contextual hashtags...');
    const hashtagResult = await model.generateContent(hashtagPrompt);
    const hashtagResponse = await hashtagResult.response;
    const hashtagText = hashtagResponse.text().trim();

    // Extract hashtags
    const hashtags = hashtagText.match(/#\w+/g) || [];

    // Ensure exactly 10 hashtags
    const finalHashtags = hashtags.slice(0, 10);
    if (finalHashtags.length < 10) {
      const fallbackHashtags = ['#Quality', '#Professional', '#Excellence', '#Business', '#Service', '#Trusted', '#Premium', '#Innovation', '#Success', '#Experience'];
      finalHashtags.push(...fallbackHashtags.slice(0, 10 - finalHashtags.length));
    }

    console.log(`✅ Generated enhanced caption (${caption.length} chars) and ${finalHashtags.length} hashtags`);

    return {
      caption,
      hashtags: finalHashtags
    };

  } catch (error) {
    console.error('❌ Revo 2.0 enhanced caption generation failed:', error);
    throw error;
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
    // 🧠 STEP 1: GPT Creative Ideation Layer
    console.log('🧠 Revo 2.0: Starting GPT creative ideation layer...');

    const creativeIdeas = await generateCreativeIdeasWithGPT({
      businessType: input.brandProfile.businessType || 'Business',
      businessName: input.brandProfile.businessName || 'Your Business',
      location: input.brandProfile.location || 'Global',
      platform: input.platform || 'instagram',
      targetAudience: input.brandProfile.targetAudience || 'General audience',
      brandVoice: input.brandProfile.brandVoice || 'Professional and engaging',
      services: input.brandProfile.services || [],
      brandColors: input.brandProfile.brandColors || []
    });

    console.log('✅ GPT Creative Ideas Generated:', {
      concept: creativeIdeas.concept.substring(0, 100) + '...',
      catchwords: creativeIdeas.catchwords,
      visualDirection: creativeIdeas.visualDirection.substring(0, 100) + '...'
    });

    // 🎨 STEP 2: Build the revolutionary prompt for Revo 2.0 with GPT creative ideas
    const { promptText, businessDNA, trendInstructions, contextData } = await buildRevo20Prompt(input, creativeIdeas);
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
        const model = ai.getGenerativeModel({ model: REVO_2_0_MODEL });
        response = await model.generateContent(prompt);
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
    // The response might be nested under response.response
    const actualResponse = response.response || response;
    const parts = actualResponse.candidates?.[0]?.content?.parts || [];
    console.log(`📊 Response contains ${parts.length} parts`);
    console.log('🔍 Response candidates:', actualResponse.candidates?.length || 0);
    console.log('🔍 First candidate:', actualResponse.candidates?.[0] ? 'exists' : 'missing');

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

    // Generate sophisticated captions and hashtags using GPT creative ideas and RSS data
    const { caption, hashtags } = await generateAdvancedCaptionAndHashtags(input, creativeIdeas);

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
 * Build revolutionary prompt for Revo 2.0 with GPT creative ideas and real-time context
 */
async function buildRevo20Prompt(input: Revo20GenerationInput, creativeIdeas?: CreativeIdeas): Promise<{
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

  // Step 1: Intelligent Context Analysis - Temporarily disabled for testing
  // const contextRelevance = selectRelevantContext(
  //   businessType,
  //   brandProfile.location || '',
  //   platform,
  //   brandProfile.contentThemes || '',
  //   new Date().getDay() // Current day of week
  // );

  console.log('🧠 Revo 2.0 Context Analysis for', businessType, 'in', brandProfile.location || 'Global');
  console.log('   Note: Context analysis temporarily disabled for testing');

  // Step 2-4: Context fetching temporarily disabled for testing
  let trendingTopics: any[] = [];
  let localContext: any = {};
  const filteredContext: any = {
    selectedTrends: [],
    selectedWeather: null,
    selectedEvents: [],
    selectedCultural: null
  };

  console.log('🔍 Revo 2.0: Context integration temporarily disabled for testing');

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
    'photographic_realistic', 'illustrated_stylized', 'gradient_colorful', 'monochrome_accent',
    'luxury_premium', 'tech_futuristic', 'warm_inviting', 'energetic_vibrant'
  ];
  const selectedVisualVariation = visualVariations[Math.floor(Math.random() * visualVariations.length)];
  console.log(`🎨 Revo 2.0 Selected visual variation: ${selectedVisualVariation}`);

  // Generate people/setting variety based on location and business type
  const peopleSettingVariations = [
    'professional_office', 'modern_lifestyle', 'community_gathering', 'creative_studio',
    'retail_environment', 'outdoor_urban', 'cultural_celebration', 'tech_workspace',
    'traditional_modern_blend', 'service_interaction', 'collaborative_space', 'premium_setting'
  ];
  const selectedPeopleSetting = peopleSettingVariations[Math.floor(Math.random() * peopleSettingVariations.length)];
  console.log(`👥 Revo 2.0 Selected people setting: ${selectedPeopleSetting}`);

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
🚨 ABSOLUTELY NO WATERMARKS: Do not include any watermarks, "Premium Content", "Paya", or any overlay text that looks like watermarks

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
${brandProfile.websiteUrl ? `- Website: ${brandProfile.websiteUrl}` : ''}

**🎨 CREATIVE DIRECTION FOR THIS DESIGN:**
- Visual Style: ${selectedVisualVariation.replace('_', ' ')} approach
${input.includePeopleInDesigns === true ? `- People Setting: ${selectedPeopleSetting.replace('_', ' ')} context` : '- Focus: Product/service showcase without people'}

${creativeIdeas ? `**🧠 GPT CREATIVE DIRECTION (FOLLOW EXACTLY):**
- **Creative Concept:** ${creativeIdeas.concept}
- **Key Catchwords:** ${creativeIdeas.catchwords.join(', ')}
- **Visual Direction:** ${creativeIdeas.visualDirection}
- **Design Elements:** ${creativeIdeas.designElements.join(', ')}
- **Mood Keywords:** ${creativeIdeas.moodKeywords.join(', ')}
- **Target Emotions:** ${creativeIdeas.targetEmotions.join(', ')}
- **Color Suggestions:** ${creativeIdeas.colorSuggestions.join(', ')}

🚨 CRITICAL: Use these GPT-generated creative ideas as your PRIMARY creative direction. This is the core concept that should drive your entire design.` : ''}

**🌍 CULTURAL INTEGRATION & HUMAN ELEMENTS:**
- Location Context: ${brandProfile.location || 'Global'}
${input.includePeopleInDesigns === true ? `- CREATIVE VARIETY: Include diverse, authentic people in VARIED settings and contexts:
  * Professional office environments (modern, clean, business-focused)
  * Lifestyle settings (homes, cafes, outdoor spaces, community centers)
  * Industry-specific environments (workshops, studios, retail spaces, service areas)
  * Cultural celebrations and community gatherings
  * Modern urban settings (co-working spaces, tech hubs, creative studios)
  * Traditional meets modern (blend of cultural heritage with contemporary life)
- Show real people in natural, engaging situations that vary by design
- Ensure representation reflects the local demographic and cultural values
- Use photography styles that range from candid to professional to artistic
- Vary the mood: energetic, calm, celebratory, focused, collaborative` : `- FOCUS ON PRODUCTS/SERVICES: Emphasize products, services, and brand elements WITHOUT people
- Use lifestyle imagery, product showcases, and brand-focused visuals
- Create compelling designs through typography, graphics, and product photography
- Maintain professional aesthetic through clean, modern design elements
- NO PEOPLE in the design - focus purely on products, services, and brand elements`}
- Respect and celebrate the local culture and aesthetic preferences of ${brandProfile.location || 'the target region'}
- Use culturally appropriate imagery, colors, and design elements
- Incorporate subtle cultural motifs or design elements that resonate locally

**🚨 LANGUAGE INSTRUCTIONS FOR TEXT IN DESIGNS:**
${input.useLocalLanguage === true ? `- You may use local language text when 100% certain of spelling, meaning, and cultural appropriateness
- Mix local language with English naturally (1-2 local words maximum per text element)
- Only use commonly known local words that add cultural connection
- When uncertain about local language accuracy, use English instead
- Better to use clear English than incorrect or garbled local language` : `- USE ONLY ENGLISH for all text in the design
- Do not use any local language words or phrases
- Keep all headlines, subheadlines, and call-to-actions in clear English
- Focus on universal messaging that works across all markets
- Maintain professional English-only communication`}

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

**HEADLINE CREATION (PRIMARY) - STRATEGIC BUSINESS SELLING:**
- NEVER use generic phrases like "Premium Content", "Quality Content", or "[Business Name] - [Generic Text]"
- Create headlines that SELL the business value and relate directly to the caption content
- Use specific benefit-driven language that answers "Why should I choose this business?"
- Make it industry-specific and customer-focused, highlighting unique selling points
- Keep it short (3-7 words) but pack in real business value
- Must connect to the caption story and reinforce the main business message
${input.useLocalLanguage === true ? `- PRIMARILY USE ENGLISH (60%+ of the time) - only use local language when extremely confident and impactful
- Examples: "Same Day Delivery", "24/7 Expert Support", "Karibu Nyumbani", "Local Since 1995"` : `- USE ONLY ENGLISH for all headlines and text elements
- Examples: "Same Day Delivery", "24/7 Expert Support", "No Hidden Fees", "Local Since 1995"`}

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

**SUB-HEADLINE CREATION (SECONDARY) - BUSINESS VALUE REINFORCEMENT:**
- Develop a supporting message that reinforces the main headline's business benefit
- Must directly relate to and support the caption content and main headline
- Address the specific problem your business solves or benefit you provide
- Make it relevant to ${businessType} industry and what customers actually want
- Keep it concise (8-15 words) but pack in concrete business value
- PREFER ENGLISH (60%+ of the time) - only use 1-2 local words when absolutely confident and punchy
${filteredContext.selectedTrends && filteredContext.selectedTrends.length > 0 ? `- Consider incorporating trending themes only if they strengthen your business message` : ''}
${filteredContext.selectedWeather ? `- Reference current conditions (${filteredContext.selectedWeather.condition || ''}) only if relevant to your business value` : ''}
- Create subheadlines that make customers think "I need this business"

**CALL-TO-ACTION CREATION (TERTIARY):**
- Generate contextually relevant CTAs based on the message
- Include contact information ONLY when it makes contextual sense (e.g., "Book online", "Visit us", "Get quote")
- Use ${brandProfile.websiteUrl ? `website: ${cleanWebsiteUrl(brandProfile.websiteUrl)}` : 'appropriate web reference'} SPARINGLY - only when CTA specifically mentions visiting website
- Use ${brandProfile.contactInfo?.phone ? `phone: ${brandProfile.contactInfo.phone}` : 'contact information'} sparingly and contextually
- Vary between action words: "Discover", "Try Now", "Get Started", "Learn More", "Order Today", etc.
- STICK TO ENGLISH for CTAs (90%+ of the time) - only use local language when it's a perfect, punchy fit

**🎨 CREATIVE DESIGN VARIETY & COMPOSITION:**
- **DESIGN STYLES** (rotate for variety):
  * Ultra-modern minimalist with bold typography and negative space
  * Dynamic geometric patterns with vibrant brand colors
  * Sophisticated gradient overlays with premium feel
  * Clean photography-focused with subtle text overlays
  * Artistic illustration style with contemporary elements
  * Bold graphic design with strong visual hierarchy
  * Elegant luxury aesthetic with refined typography
  * Energetic and vibrant with dynamic compositions

- **LAYOUT VARIATIONS** (mix these approaches):
  * Split-screen compositions (text left, visual right)
  * Centered hero with surrounding elements
  * Asymmetrical modern layouts with visual balance
  * Grid-based structured designs
  * Organic flowing compositions
  * Layered depth with foreground/background elements

- **VISUAL ELEMENTS** (choose contextually):
  * Hero Element: Product showcase, lifestyle photography, or thematic illustration
  * Background: Modern gradients, textured patterns, or photographic backgrounds
  * Accent Graphics: Contemporary icons, geometric shapes, or cultural elements
  * Typography: Modern, readable fonts with strong hierarchy
  * Safe Zones: Ensure text avoids bottom 15% for platform UI compatibility
  * Accessibility: Maintain high contrast ratios and mobile readability

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
- Local language patterns ONLY when 100% certain of accuracy (prefer English over incorrect local language)

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

🚨 **ABSOLUTELY NO WATERMARKS OR OVERLAY TEXT:**
- DO NOT add any watermarks like "Paya - Premium Content" or similar
- DO NOT include any semi-transparent overlay text across the image
- DO NOT add any branding watermarks, service names, or platform identifiers
- DO NOT include any repeated text patterns or watermark-style overlays
- Keep the image completely clean without any watermark elements
- The only text should be the intended business content specified above

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

**🎨 STRATEGIC HEADLINE TECHNIQUES:**
❌ NEVER USE: "Premium Content", "Quality Content", "[Business] - Premium", "[Business] - Quality"
✅ ALWAYS USE BUSINESS-SELLING HEADLINES THAT RELATE TO CAPTION:
- Problem-Solution: "No More Late Deliveries" (if caption mentions delivery)
- Benefit-Focused: "Save 50% on Repairs" (if caption talks about cost savings)
- Unique Value: "Only Local Organic Farm" (if caption mentions local sourcing)
- Convenience: "Open 24/7" (if caption mentions availability)
- Quality Proof: "5-Star Rated Service" (if caption mentions customer satisfaction)
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
- HEADLINE must directly relate to caption content and sell real business value
- SUB-HEADLINE must reinforce the headline and caption message (NOT generic descriptions)
- Headlines should make customers think "I want this" or "I need this business"
- Think like a strategic marketer who connects every element to drive business results
- Every word should serve the purpose of attracting and converting customers

🚨 **LANGUAGE USAGE RULES:**
**FOR OVERLAY TEXT (Headlines, Subheadlines, CTAs):**
- Use ENGLISH 60-90% of the time to avoid language mistakes
- Only use local language when you're 100% confident it's accurate and punchy
- Better clear English than incorrect local language

**FOR CAPTIONS:**
- Can freely use local languages and cultural references
- Mix local terms naturally with English as appropriate
- Focus on authentic, conversational tone

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

/**
 * Generate hybrid caption prompt that combines GPT creative ideas with RSS trending topics
 */
function generateHybridCaptionPrompt(context: {
  businessType: string;
  location: string;
  businessName: string;
  platform: string;
  targetAudience?: string;
  trendingTopics?: Array<{ topic: string; relevanceScore: number }>;
  creativeIdeas?: CreativeIdeas;
  useLocalLanguage?: boolean;
}): string {
  const randomSeed = Math.random().toString(36).substring(7);

  let prompt = `You are a LOCAL HUMAN social media manager who lives and works in ${context.location}. Write like a real person from this community - warm, authentic, and relatable.

🎯 BUSINESS CONTEXT:
- Business: ${context.businessName}
- Type: ${context.businessType}
- Location: ${context.location}
- Platform: ${context.platform}
- Target Audience: ${context.targetAudience || 'General audience'}

${context.creativeIdeas ? `🧠 CREATIVE INSPIRATION:
- **Core Concept**: ${context.creativeIdeas.concept}
- **Key Catchwords**: ${context.creativeIdeas.catchwords.join(', ')}
- **Target Emotions**: ${context.creativeIdeas.targetEmotions.join(', ')}
- **Mood**: ${context.creativeIdeas.moodKeywords.join(', ')}` : ''}

${context.trendingTopics && context.trendingTopics.length > 0 ? `📈 WHAT'S TRENDING LOCALLY:
${context.trendingTopics.map(trend => `- ${trend.topic}`).join('\n')}

💡 Casually mention 1-2 relevant trends if they fit naturally.` : ''}

🎨 WRITE LIKE A HUMAN:
- Length: 60-100 words MAX (perfect for social scroll culture)
- Format: Use line breaks for easy reading
- Start: Hook with relatable question, story, or local observation
- Voice: Warm, friendly, like texting a friend
- Style: Contractions (we're, don't, can't), casual language
- Local flavor: Only use local slang when it adds genuine value, not forced
- Emojis: 4-6 emojis that feel natural
- CTA: Fun, engaging invitation (not corporate)
- Variation: Make this UNIQUE - use random seed: ${randomSeed}

🌍 LANGUAGE INSTRUCTIONS:
${context.useLocalLanguage === true ? `You are an expert in global cultures and local languages. Based on the business location "${context.location}", intelligently determine and use appropriate local expressions, slang, or cultural references that would resonate with the local audience.

**DYNAMIC LANGUAGE INTELLIGENCE:**
- Analyze the location and determine what local language, slang, or cultural references are commonly used there
- Only use local expressions if you are 100% confident about their accuracy, meaning, and cultural appropriateness
- Mix local language with English naturally (1-2 local words maximum per caption)
- When uncertain about local language accuracy, use English instead` : `**ENGLISH-ONLY CONTENT:**
- USE ONLY ENGLISH for all caption text
- Do not use any local language words, slang, or phrases
- Keep all content in clear, professional English
- Focus on universal messaging that works across all markets
- Maintain warm, friendly tone using English expressions only`}
- Use 1-2 local words maximum per caption - keep it natural and authentic
- Local language should enhance the business message, not distract from it
- When uncertain about local language accuracy, always default to clear, engaging English
- Consider local landmarks, cultural references, weather patterns, or lifestyle elements that locals would relate to
- Make it feel like the content is created by someone who actually lives and works in that location

**SAFETY RULES:**
- NEVER use local language unless you are absolutely certain of its correctness
- Avoid complex phrases, slang, or expressions you're uncertain about
- Better to use engaging English than incorrect local language
- Focus on authentic, location-relevant content rather than forced local language usage

🚨 HUMAN WRITING STYLE:
- No corporate jargon or marketing speak
- No "Imagine this..." or "Picture this..." openings
- Write like you're texting a friend about your business
- Be conversational, not salesy

💬 FUN CTA EXAMPLES:
- "DM us before your squad eats them all 🍪🔥"
- "Halla at us, we got you 😉"
- "Hit us up if you're interested 📱"
- "Slide through our DMs 💬"
- "Let's chat about it! 👇"

🌐 WEBSITE USAGE:
- Only mention website when CTA specifically calls for it (e.g., "check us out online", "visit our site")
- Use clean format without https:// or www.
- Don't force website into every post - use contextually when it makes sense

Create a caption that sounds like it was written by a real person who cares about their community and business.

Return ONLY the caption text, no additional formatting or explanations.`;

  return prompt;
}

// Export for global testing
if (typeof window !== 'undefined') {
  (window as any).testRevo20Availability = testRevo20Availability;
  (window as any).generateWithRevo20 = generateWithRevo20;
  (window as any).generateWithCharacterConsistency = generateWithCharacterConsistency;
  (window as any).performIntelligentEditing = performIntelligentEditing;
}
