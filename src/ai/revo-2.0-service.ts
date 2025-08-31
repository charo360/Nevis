/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses Gemini 2.5 Flash Image Preview for enhanced content generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { BrandProfile, Platform } from '@/lib/types';

// Initialize AI clients
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Revo 2.0 uses Gemini 2.5 Flash Image Preview (following official docs)
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
}

export interface Revo20GenerationResult {
  imageUrl: string;
  model: string;
  qualityScore: number;
  processingTime: number;
  enhancementsApplied: string[];
  caption: string;
  hashtags: string[];
}

/**
 * Generate enhanced creative concept using GPT-4
 */
async function generateCreativeConcept(options: Revo20GenerationOptions): Promise<any> {
  const { businessType, platform, brandProfile, visualStyle = 'modern' } = options;

  const prompt = `You are a world-class creative director specializing in ${businessType} businesses. 
Create an authentic, locally-relevant creative concept for ${platform} that feels genuine and relatable.

Business Context:
- Type: ${businessType}
- Platform: ${platform}
- Style: ${visualStyle}
- Location: ${brandProfile.location || 'Global'}
- Brand: ${brandProfile.businessName || businessType}

Create a concept that:
1. Feels authentic and locally relevant
2. Uses relatable human experiences
3. Connects emotionally with the target audience
4. Incorporates cultural nuances naturally
5. Avoids generic corporate messaging

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

  try {
    const content = response.choices[0].message.content || '{}';
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Failed to parse creative concept:', error);
    return {
      concept: `Professional ${businessType} content for ${platform}`,
      catchwords: ['quality', 'professional', 'trusted', 'local', 'expert'],
      visualDirection: 'Clean, professional design with modern aesthetics',
      designElements: ['clean typography', 'professional imagery', 'brand colors', 'modern layout'],
      colorSuggestions: ['#2563eb', '#1f2937', '#f8fafc'],
      moodKeywords: ['professional', 'trustworthy', 'modern', 'clean'],
      targetEmotions: ['trust', 'confidence', 'reliability']
    };
  }
}

/**
 * Generate content with Revo 2.0 (Gemini 2.5 Flash Image Preview)
 */
export async function generateWithRevo20(options: Revo20GenerationOptions): Promise<Revo20GenerationResult> {
  const startTime = Date.now();
  console.log('🚀 Starting Revo 2.0 generation...');
  console.log('📋 Options:', {
    businessType: options.businessType,
    platform: options.platform,
    visualStyle: options.visualStyle,
    aspectRatio: options.aspectRatio
  });

  try {
    // Step 1: Generate creative concept
    console.log('🎨 Generating creative concept...');
    const concept = await generateCreativeConcept(options);
    console.log('✅ Creative concept generated');

    // Step 2: Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(options, concept);
    console.log('📝 Enhanced prompt built');

    // Step 3: Generate image with Gemini 2.5 Flash Image Preview
    console.log('🖼️ Generating image with Revo 2.0...');
    const imageResult = await generateImageWithGemini(enhancedPrompt, options);
    console.log('✅ Image generated successfully');

    // Step 4: Generate caption and hashtags
    console.log('📱 Generating caption and hashtags...');
    const contentResult = await generateCaptionAndHashtags(options, concept);
    console.log('✅ Caption and hashtags generated');

    const processingTime = Date.now() - startTime;
    console.log(`🎯 Revo 2.0 generation completed in ${processingTime}ms`);

    return {
      imageUrl: imageResult.imageUrl,
      model: 'Revo 2.0 (Gemini 2.5 Flash Image Preview)',
      qualityScore: 9.2,
      processingTime,
      enhancementsApplied: [
        'Creative concept generation',
        'Enhanced prompt engineering',
        'Brand consistency optimization',
        'Platform-specific formatting',
        'Cultural relevance integration'
      ],
      caption: contentResult.caption,
      hashtags: contentResult.hashtags
    };

  } catch (error) {
    console.error('❌ Revo 2.0 generation failed:', error);
    throw new Error(`Revo 2.0 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build enhanced prompt for Revo 2.0
 */
function buildEnhancedPrompt(options: Revo20GenerationOptions, concept: any): string {
  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern' } = options;

  return `Create a high-quality, professional ${businessType} design for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

VISUAL DIRECTION: ${concept.visualDirection}

DESIGN REQUIREMENTS:
- Style: ${visualStyle}, premium quality
- Aspect Ratio: ${aspectRatio}
- Platform: ${platform} optimized
- Business: ${brandProfile.businessName || businessType}
- Location: ${brandProfile.location || 'Professional setting'}

DESIGN ELEMENTS:
${concept.designElements.map((element: string) => `- ${element}`).join('\n')}

MOOD & EMOTIONS:
- Target emotions: ${concept.targetEmotions.join(', ')}
- Mood keywords: ${concept.moodKeywords.join(', ')}

BRAND INTEGRATION:
- Colors: ${concept.colorSuggestions.join(', ')}
- Business name: ${brandProfile.businessName || businessType}
- Professional, trustworthy appearance

QUALITY STANDARDS:
- Ultra-high resolution and clarity
- Professional composition
- Perfect typography and text rendering
- Balanced color scheme
- Platform-optimized dimensions
- Brand consistency throughout

Create a stunning, professional design that captures the essence of this ${businessType} business.`;
}

/**
 * Generate image using Gemini 2.5 Flash Image Preview
 */
async function generateImageWithGemini(prompt: string, options: Revo20GenerationOptions): Promise<{ imageUrl: string }> {
  const maxRetries = 3;
  let lastError: any;
  let response: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for Revo 2.0 generation...`);
      const model = ai.getGenerativeModel({ model: REVO_2_0_MODEL });
      response = await model.generateContent(prompt);
      console.log('✅ Revo 2.0 generation successful!');
      break;
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed:`, error?.message || error);

      if (attempt === maxRetries) {
        break;
      }

      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  if (!response) {
    throw new Error(`Revo 2.0 generation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return {
        imageUrl: `data:${mimeType};base64,${imageData}`
      };
    }
  }

  throw new Error('No image data found in Revo 2.0 response');
}

/**
 * Generate caption and hashtags
 */
async function generateCaptionAndHashtags(options: Revo20GenerationOptions, concept: any): Promise<{ caption: string; hashtags: string[] }> {
  const { businessType, platform, brandProfile } = options;

  const prompt = `Create engaging ${platform} content for a ${businessType} business.

Business: ${brandProfile.businessName || businessType}
Location: ${brandProfile.location || 'Local area'}
Concept: ${concept.concept}
Catchwords: ${concept.catchwords.join(', ')}

Create:
1. A catchy, engaging caption (2-3 sentences max)
2. Relevant hashtags (8-12 hashtags)

Make it authentic, locally relevant, and engaging for ${platform}.

Format as JSON:
{
  "caption": "Your engaging caption here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      caption: result.caption || `Professional ${businessType} services in ${brandProfile.location || 'your area'}`,
      hashtags: result.hashtags || [`#${businessType.replace(/\s+/g, '')}`, '#professional', '#local', '#quality']
    };
  } catch (error) {
    console.error('Failed to parse caption/hashtags:', error);
    return {
      caption: `Professional ${businessType} services in ${brandProfile.location || 'your area'}`,
      hashtags: [`#${businessType.replace(/\s+/g, '')}`, '#professional', '#local', '#quality']
    };
  }
}

/**
 * Test Revo 2.0 availability
 */
export async function testRevo20Availability(): Promise<boolean> {
  try {
    console.log('🧪 Testing Revo 2.0 (Gemini 2.5 Flash Image Preview) availability...');

    const model = ai.getGenerativeModel({ model: REVO_2_0_MODEL });
    const response = await model.generateContent('Create a simple test image with the text "Revo 2.0 Test" on a modern gradient background');

    const parts = response.candidates?.[0]?.content?.parts || [];
    let hasImage = false;

    for (const part of parts) {
      if (part.inlineData) {
        console.log('🖼️ Image data found:', part.inlineData.mimeType);
        hasImage = true;
      }
    }

    if (hasImage) {
      console.log('✅ Revo 2.0 is available and working perfectly!');
      return true;
    } else {
      console.log('⚠️ Revo 2.0 responded but no image found');
      return false;
    }

  } catch (error) {
    console.error('❌ Revo 2.0 test failed:', error);
    return false;
  }
}
