/**
 * Imagen 4 Service for Revo 2.0
 * Next-generation AI image generation with advanced capabilities
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateGeminiHDEnhancedDesignWithFallback } from '@/ai/gemini-hd-enhanced-design';
import type { BrandProfile, BrandConsistencyPreferences } from '@/lib/types';

// Initialize Google AI with API key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error("❌ No Google AI API key found for Imagen 4. Please set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey!);

// Imagen 4 Models
export const IMAGEN_4_MODELS = {
  STANDARD: 'imagen-4',
  ULTRA: 'imagen-4-ultra',
} as const;

export type Imagen4Model = typeof IMAGEN_4_MODELS[keyof typeof IMAGEN_4_MODELS];

// Aspect ratio options for Revo 2.0
export const REVO_2_ASPECT_RATIOS = {
  SQUARE: '1:1',
  LANDSCAPE: '16:9',
  PORTRAIT: '9:16',
  WIDE: '21:9',
  TALL: '4:5',
} as const;

export type Revo2AspectRatio = typeof REVO_2_ASPECT_RATIOS[keyof typeof REVO_2_ASPECT_RATIOS];

/**
 * Convert aspect ratio to actual pixel dimensions for Revo 2.0
 */
function getAspectRatioDimensions(aspectRatio: Revo2AspectRatio): { width: number; height: number } {
  const dimensionMap: Record<Revo2AspectRatio, { width: number; height: number }> = {
    '1:1': { width: 1080, height: 1080 },     // Instagram square
    '16:9': { width: 1200, height: 675 },     // Facebook/LinkedIn/Twitter landscape
    '9:16': { width: 675, height: 1200 },     // Instagram/TikTok stories
    '21:9': { width: 1400, height: 600 },     // Ultra-wide format
    '4:5': { width: 1080, height: 1350 },     // Instagram portrait
  };

  return dimensionMap[aspectRatio] || dimensionMap['1:1'];
}

/**
 * Map Revo 2.0 aspect ratios to Imagen 4 API format
 */
function mapToImagen4AspectRatio(revo2AspectRatio: Revo2AspectRatio): string {
  const aspectRatioMap: Record<Revo2AspectRatio, string> = {
    '1:1': '1:1',       // Square - supported by Imagen 4
    '16:9': '16:9',     // Widescreen - supported by Imagen 4
    '9:16': '9:16',     // Portrait - supported by Imagen 4
    '4:5': '3:4',       // Map to closest supported ratio (3:4 portrait)
    '21:9': '16:9',     // Map to closest supported ratio (16:9 widescreen)
  };

  return aspectRatioMap[revo2AspectRatio] || '1:1';
}

/**
 * Generate Google Cloud access token using service account
 */
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const jwt = require('jsonwebtoken');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Build comprehensive AI prompt for Revo 2.0 image generation
 */
function buildRevo2Prompt(basePrompt: string, config: Imagen4Config): string {
  const platformContext = getPlatformContext(config.platform);
  const styleEnhancements = getStyleEnhancements(config.style);
  const qualityModifiers = getQualityModifiers(config.quality);

  return `
🎨 REVO 2.0 AI DESIGN GENERATION 🎨

${basePrompt}

📱 PLATFORM: ${config.platform?.toUpperCase()}
${platformContext}

🎭 VISUAL STYLE: ${config.style}
${styleEnhancements}

⚡ QUALITY LEVEL: ${config.quality}
${qualityModifiers}

📐 ASPECT RATIO: ${config.aspectRatio}
- Generate image in exact ${config.aspectRatio} format
- Platform-optimized dimensions for ${config.platform}

🚀 REVO 2.0 SPECIFICATIONS:
- Ultra-high quality AI generation
- Professional social media design
- Modern, engaging visual composition
- Brand-appropriate aesthetic
- Platform-native optimization
- Next-generation AI enhancement

Generate a stunning, professional social media design that captures attention and drives engagement.
`.trim();
}

/**
 * Get platform-specific context for AI generation
 */
function getPlatformContext(platform?: string): string {
  const contexts: Record<string, string> = {
    'instagram': '- Square format optimized for Instagram feed\n- Visually striking and scroll-stopping\n- Mobile-first design approach',
    'facebook': '- Landscape format for Facebook news feed\n- Community-focused and shareable\n- Engaging for social interaction',
    'linkedin': '- Professional landscape format\n- Business-appropriate and polished\n- Career and industry focused',
    'twitter': '- Landscape format for Twitter timeline\n- Attention-grabbing and concise\n- News-worthy and trending'
  };

  return contexts[platform?.toLowerCase() || ''] || '- Social media optimized design\n- Platform-appropriate formatting';
}

/**
 * Get style-specific enhancements for AI generation
 */
function getStyleEnhancements(style?: string): string {
  const enhancements: Record<string, string> = {
    'photographic': '- Realistic photography style\n- Natural lighting and shadows\n- High-resolution details',
    'artistic': '- Creative and expressive design\n- Artistic composition and colors\n- Unique visual elements',
    'digital_art': '- Modern digital art style\n- Clean vector graphics\n- Contemporary design elements',
    'cinematic': '- Dramatic lighting and composition\n- Movie-like visual quality\n- Epic and engaging atmosphere',
    'anime': '- Vibrant anime-inspired style\n- Colorful and dynamic design\n- Playful visual elements',
    'sketch': '- Hand-drawn sketch aesthetic\n- Minimal and clean lines\n- Artistic simplicity'
  };

  return enhancements[style || ''] || '- Professional visual style\n- High-quality design elements';
}

/**
 * Get quality-specific modifiers for AI generation
 */
function getQualityModifiers(quality?: string): string {
  const modifiers: Record<string, string> = {
    'ultra': '- Maximum detail and resolution\n- Ultra-high quality rendering\n- Professional-grade output',
    'high': '- High-quality generation\n- Detailed and polished\n- Premium visual quality',
    'standard': '- Standard quality output\n- Good visual quality\n- Reliable generation'
  };

  return modifiers[quality || ''] || '- Quality AI generation\n- Professional output';
}

// Imagen 4 generation options
export interface Imagen4GenerationOptions {
  model?: Imagen4Model;
  aspectRatio?: Revo2AspectRatio;
  quality?: 'standard' | 'high' | 'ultra';
  style?: 'photographic' | 'artistic' | 'digital_art' | 'cinematic' | 'anime' | 'sketch';
  lighting?: 'natural' | 'studio' | 'dramatic' | 'soft' | 'golden_hour' | 'neon';
  mood?: 'professional' | 'energetic' | 'calm' | 'vibrant' | 'elegant' | 'bold';
  colorScheme?: string[]; // Brand colors
  enhancePrompt?: boolean;
  safetyLevel?: 'strict' | 'moderate' | 'permissive';
  // Revo 2.0 specific options for design generation
  brandProfile?: BrandProfile;
  brandConsistency?: BrandConsistencyPreferences;
  platform?: string;
}

// Imagen 4 generation result
export interface Imagen4Result {
  imageUrl: string;
  model: Imagen4Model;
  aspectRatio: Revo2AspectRatio;
  qualityScore: number;
  processingTime: number;
  enhancementsApplied: string[];
  metadata: {
    prompt: string;
    enhancedPrompt?: string;
    style: string;
    quality: string;
    safetyLevel: string;
  };
}

/**
 * Generate enhanced prompt for Imagen 4
 */
function enhancePromptForImagen4(
  basePrompt: string,
  options: Imagen4GenerationOptions,
  brandColors?: string[]
): string {
  const enhancements: string[] = [];

  // Add style enhancement
  if (options.style) {
    const styleMap = {
      photographic: 'professional photography style, high resolution, sharp details',
      artistic: 'artistic composition, creative interpretation, expressive style',
      digital_art: 'digital art style, modern aesthetic, clean lines',
      cinematic: 'cinematic composition, dramatic framing, movie-like quality',
      anime: 'anime art style, vibrant colors, stylized characters',
      sketch: 'hand-drawn sketch style, artistic lines, creative interpretation'
    };
    enhancements.push(styleMap[options.style]);
  }

  // Add lighting enhancement
  if (options.lighting) {
    const lightingMap = {
      natural: 'natural lighting, soft shadows, realistic illumination',
      studio: 'professional studio lighting, even illumination, clean shadows',
      dramatic: 'dramatic lighting, strong contrast, moody atmosphere',
      soft: 'soft diffused lighting, gentle shadows, warm ambiance',
      golden_hour: 'golden hour lighting, warm tones, beautiful natural glow',
      neon: 'neon lighting effects, vibrant colors, modern urban aesthetic'
    };
    enhancements.push(lightingMap[options.lighting]);
  }

  // Add mood enhancement
  if (options.mood) {
    const moodMap = {
      professional: 'professional atmosphere, clean composition, business-appropriate',
      energetic: 'dynamic energy, vibrant composition, active feeling',
      calm: 'peaceful atmosphere, serene composition, relaxing mood',
      vibrant: 'bright vibrant colors, lively composition, energetic feel',
      elegant: 'elegant sophistication, refined composition, luxury aesthetic',
      bold: 'bold statement, strong visual impact, confident composition'
    };
    enhancements.push(moodMap[options.mood]);
  }

  // Add brand colors if provided
  if (brandColors && brandColors.length > 0) {
    enhancements.push(`incorporating brand colors: ${brandColors.join(', ')}`);
  }

  // Add quality enhancement
  if (options.quality === 'ultra') {
    enhancements.push('ultra-high quality, maximum detail, professional grade');
  } else if (options.quality === 'high') {
    enhancements.push('high quality, detailed rendering, professional standard');
  }

  // Combine base prompt with enhancements
  const enhancedPrompt = `${basePrompt}. ${enhancements.join(', ')}.`;

  return enhancedPrompt;
}

/**
 * Generate image with Imagen 4 for Revo 2.0
 */
export async function generateImagen4Image(
  prompt: string,
  options: Imagen4GenerationOptions = {}
): Promise<Imagen4Result> {
  const startTime = Date.now();

  try {
    console.log('🌟 Starting Revo 2.0 Imagen 4 generation...');

    // Set defaults
    const config = {
      model: options.model || IMAGEN_4_MODELS.STANDARD,
      aspectRatio: options.aspectRatio || REVO_2_ASPECT_RATIOS.SQUARE,
      quality: options.quality || 'high',
      style: options.style || 'photographic',
      lighting: options.lighting || 'natural',
      mood: options.mood || 'professional',
      enhancePrompt: options.enhancePrompt !== false,
      safetyLevel: options.safetyLevel || 'moderate',
      // Revo 2.0 specific options
      brandProfile: options.brandProfile,
      brandConsistency: options.brandConsistency,
      platform: options.platform
    };

    // Enhance prompt if requested
    let finalPrompt = prompt;
    let enhancedPrompt: string | undefined;

    if (config.enhancePrompt) {
      enhancedPrompt = enhancePromptForImagen4(prompt, config, options.colorScheme);
      finalPrompt = enhancedPrompt;
    }

    console.log(`🎨 Using ${config.model} with ${config.aspectRatio} aspect ratio`);
    console.log(`🎯 Style: ${config.style}, Quality: ${config.quality}`);

    // Get the Imagen 4 model
    const model = genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        // Imagen 4 specific configuration
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      }
    });

    // Generate actual social media design with Revo 2.0 enhanced capabilities
    console.log('🎨 Revo 2.0 Imagen 4 generating social media design...');
    console.log(`- Prompt: ${finalPrompt}`);
    console.log(`- Aspect Ratio: ${config.aspectRatio}`);
    console.log(`- Style: ${config.style}`);
    console.log(`- Quality: ${config.quality}`);
    console.log(`- Brand Profile: ${config.brandProfile ? 'PROVIDED' : 'MISSING'}`);
    console.log(`- Platform: ${config.platform || 'MISSING'}`);

    let imageUrl: string;

    try {
      // Pure Revo 2.0 generation - no mixing with enhanced design system
      console.log('🚀 Using pure Revo 2.0 Imagen 4 generation...');

      // Get platform-specific dimensions for Revo 2.0
      const dimensions = getAspectRatioDimensions(config.aspectRatio);
      console.log(`📐 Platform dimensions: ${dimensions.width}x${dimensions.height} (${config.aspectRatio})`);

      // Build comprehensive prompt for Revo 2.0 AI generation
      const revo2Prompt = buildRevo2Prompt(finalPrompt, config);
      console.log(`🎨 Revo 2.0 AI prompt: ${revo2Prompt.substring(0, 100)}...`);

      // Generate actual AI image with Revo 2.0 specifications
      console.log('🤖 Generating AI design with Revo 2.0 specifications...');

      try {
        // Use actual Imagen 4 API with proper format
        console.log('🚀 Calling Imagen 4 API with proper format...');

        // Map Revo 2.0 aspect ratios to Imagen 4 format
        const imagen4AspectRatio = mapToImagen4AspectRatio(config.aspectRatio);

        // Determine sample image size based on quality
        const sampleImageSize = config.quality === 'ultra' ? '2K' : '1K';

        // Build Imagen 4 API request body
        const imagen4Request = {
          instances: [
            {
              prompt: revo2Prompt,
              aspectRatio: imagen4AspectRatio,
              sampleImageSize: sampleImageSize
            }
          ]
        };

        console.log(`📐 Imagen 4 Request: aspectRatio=${imagen4AspectRatio}, sampleImageSize=${sampleImageSize}`);
        console.log(`🎨 Imagen 4 Prompt: ${revo2Prompt.substring(0, 150)}...`);

        // Make actual Imagen 4 API call using Firebase service account
        console.log('🚀 Making actual Imagen 4 API call...');

        // Get project ID from Firebase config
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!projectId || !serviceAccountKey) {
          throw new Error('❌ IMAGEN 4 NOT CONFIGURED: Missing Firebase project ID or service account key');
        }

        // Parse service account key
        const serviceAccount = JSON.parse(serviceAccountKey);

        // Generate access token using service account
        const accessToken = await getGoogleAccessToken(serviceAccount);

        const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-4.0-generate-001:predict`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(imagen4Request)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`❌ IMAGEN 4 API FAILED: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Imagen 4 API response received');

        // Extract image from Imagen 4 response
        if (!result.predictions || !result.predictions[0] || !result.predictions[0].bytesBase64Encoded) {
          throw new Error('❌ IMAGEN 4 RESPONSE INVALID: No image data in response');
        }

        imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
        console.log('✅ Revo 2.0 Imagen 4 generation completed successfully');
      } catch (aiError) {
        console.error('❌ IMAGEN 4 GENERATION FAILED:', aiError.message);
        throw new Error(`Imagen 4 generation failed: ${aiError.message}`);
      }
    } catch (error) {
      console.error('❌ REVO 2.0 IMAGEN 4 GENERATION FAILED:', error);
      throw new Error(`Revo 2.0 Imagen 4 generation failed: ${(error as Error).message}`);
    }

    const processingTime = Date.now() - startTime;

    // Calculate quality score based on configuration
    let qualityScore = 7.0; // Base score
    if (config.quality === 'ultra') qualityScore += 2.0;
    else if (config.quality === 'high') qualityScore += 1.0;
    if (config.model === IMAGEN_4_MODELS.ULTRA) qualityScore += 1.0;
    if (config.enhancePrompt) qualityScore += 0.5;

    qualityScore = Math.min(10.0, qualityScore);

    // Track enhancements applied
    const enhancementsApplied: string[] = [];
    if (config.enhancePrompt) enhancementsApplied.push('Enhanced Prompting');
    if (config.quality === 'ultra') enhancementsApplied.push('Ultra Quality');
    if (config.model === IMAGEN_4_MODELS.ULTRA) enhancementsApplied.push('Imagen 4 Ultra');
    enhancementsApplied.push(`${config.style} Style`);
    enhancementsApplied.push(`${config.lighting} Lighting`);
    enhancementsApplied.push(`${config.mood} Mood`);

    console.log(`✅ Revo 2.0 Imagen 4 generation completed in ${processingTime}ms`);
    console.log(`🎯 Quality Score: ${qualityScore}/10`);
    console.log(`🚀 Enhancements: ${enhancementsApplied.join(', ')}`);

    return {
      imageUrl,
      model: config.model,
      aspectRatio: config.aspectRatio,
      qualityScore,
      processingTime,
      enhancementsApplied,
      metadata: {
        prompt,
        enhancedPrompt,
        style: config.style,
        quality: config.quality,
        safetyLevel: config.safetyLevel
      }
    };

  } catch (error) {
    console.error('❌ Revo 2.0 Imagen 4 generation failed:', error);
    throw new Error(`Imagen 4 generation failed: ${(error as Error).message}`);
  }
}

/**
 * Get available Imagen 4 capabilities for Revo 2.0
 */
export function getImagen4Capabilities() {
  return {
    models: IMAGEN_4_MODELS,
    aspectRatios: REVO_2_ASPECT_RATIOS,
    styles: ['photographic', 'artistic', 'digital_art', 'cinematic', 'anime', 'sketch'],
    lighting: ['natural', 'studio', 'dramatic', 'soft', 'golden_hour', 'neon'],
    moods: ['professional', 'energetic', 'calm', 'vibrant', 'elegant', 'bold'],
    qualities: ['standard', 'high', 'ultra'],
    features: [
      'Multi-aspect ratio support',
      'Advanced style control',
      'Professional lighting options',
      'Mood-based generation',
      'Brand color integration',
      'Enhanced prompt engineering',
      'Ultra-high quality output'
    ]
  };
}
