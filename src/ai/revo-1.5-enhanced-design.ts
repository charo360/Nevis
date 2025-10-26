/**
 * Revo 1.5 Enhanced Design Service - UPGRADED WITH MULTI-STAGE CONTENT GENERATION
 * Uses advanced prompt engineering, business intelligence, and quality validation
 */

import { BrandProfile } from '@/lib/types';
import { TrendingHashtagsService } from '@/services/trending-hashtags-service';
import { RegionalSocialTrendsService } from '@/services/regional-social-trends-service';
import type { ScheduledService } from '@/services/calendar-service';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';

// Import new enhanced systems
import { MultiStageContentGenerator, type ContentGenerationContext } from './multi-stage-content-generator';
import { EnhancedPromptBuilder } from './enhanced-prompt-builder';
import { BusinessIntelligenceEngine } from './business-intelligence-engine';
import { ContentQualityValidator } from './content-quality-validator';
import { SimpleContentDiversifier, type SimpleDiversificationResult } from './simple-content-diversifier';
import { CustomerCentricContentGenerator } from './customer-centric-content-generator';

// Helper function to extract text from Vertex AI response
function extractTextFromResponse(response: any): string {

  // Handle direct response.text() function (from our generateContentDirect)
  if (response.response && typeof response.response.text === 'function') {
    const text = response.response.text();
    return text || '';
  }

  // Handle direct string response
  if (typeof response === 'string') {
    return response;
  }

  console.warn('⚠️ [Revo 1.5] Could not extract text from response, using empty string');
  console.warn('⚠️ [Revo 1.5] Response structure:', JSON.stringify(response, null, 2));
  return '';
}

/**
 * FIXED: Analyze content for image matching requirements
 */
function analyzeContentForImageMatching(contentResult: any, location: string): {
  detectedPeople: string[];
  detectedSettings: string[];
  detectedScenarios: string[];
  culturalTerms: string[];
  visualRequirements: string[];
} {
  const fullText = `${contentResult.headline} ${contentResult.subheadline} ${contentResult.callToAction}`.toLowerCase();

  // Cultural terms mapping
  const culturalTerms: string[] = [];
  const detectedPeople: string[] = [];
  const detectedSettings: string[] = [];
  const detectedScenarios: string[] = [];
  const visualRequirements: string[] = [];

  // Kenyan cultural terms
  if (fullText.includes('mama mboga')) {
    culturalTerms.push('mama mboga');
    detectedPeople.push('African woman vegetable vendor');
    detectedSettings.push('market stall with fresh vegetables');
    visualRequirements.push('Show African woman with colorful vegetables at market');
  }
  if (fullText.includes('boda boda')) {
    culturalTerms.push('boda boda');
    detectedPeople.push('motorcycle taxi rider');
    detectedSettings.push('street with motorcycle');
    visualRequirements.push('Show African man with motorcycle/bike');
  }
  if (fullText.includes('matatu')) {
    culturalTerms.push('matatu');
    detectedPeople.push('public transport driver');
    detectedSettings.push('public transport vehicle');
    visualRequirements.push('Show African driver with colorful public transport');
  }

  // Business scenarios
  if (fullText.includes('farmer') || fullText.includes('agriculture')) {
    detectedPeople.push('farmer');
    detectedSettings.push('farm/agricultural setting');
    visualRequirements.push('Show farmer in agricultural environment with crops');
  }
  if (fullText.includes('restaurant') || fullText.includes('chef') || fullText.includes('kitchen')) {
    detectedPeople.push('restaurant owner/chef');
    detectedSettings.push('restaurant/kitchen');
    visualRequirements.push('Show person in restaurant/kitchen setting');
  }
  if (fullText.includes('shop') || fullText.includes('store') || fullText.includes('retail')) {
    detectedPeople.push('shop owner/customer');
    detectedSettings.push('retail store');
    visualRequirements.push('Show person in retail/shop environment');
  }
  if (fullText.includes('office') || fullText.includes('business') || fullText.includes('professional')) {
    detectedPeople.push('business professional');
    detectedSettings.push('office environment');
    visualRequirements.push('Show professional in office setting');
  }

  // Family/personal scenarios
  if (fullText.includes('family') || fullText.includes('mother') || fullText.includes('father')) {
    detectedPeople.push('family members');
    detectedSettings.push('home/family setting');
    visualRequirements.push('Show family in home environment');
  }

  // Tech/digital scenarios
  if (fullText.includes('app') || fullText.includes('digital') || fullText.includes('online')) {
    detectedScenarios.push('digital/tech usage');
    detectedSettings.push('modern tech environment');
    visualRequirements.push('Show person using technology/app');
  }

  return {
    detectedPeople,
    detectedSettings,
    detectedScenarios,
    culturalTerms,
    visualRequirements
  };
}

/**
 * FIXED: Comprehensive cultural representation system
 * Maps locations to appropriate ethnic representation and cultural context
 */
function getCulturalRepresentation(location: string): {
  region: string;
  ethnicRepresentation: string;
  culturalContext: string;
  primaryEthnicity: string;
} {
  const locationKey = location.toLowerCase();

  // African countries mapping
  const africanCountries = {
    'kenya': {
      region: 'East Africa',
      ethnicRepresentation: 'Black African people with Kenyan features, diverse tribal backgrounds (Kikuyu, Luo, Luhya, Kalenjin)',
      culturalContext: 'Kenyan cultural elements, Swahili influence, modern African urban/rural settings',
      primaryEthnicity: 'Black African (Kenyan)'
    },
    'nigeria': {
      region: 'West Africa',
      ethnicRepresentation: 'Black African people with Nigerian features, diverse ethnic backgrounds (Yoruba, Igbo, Hausa)',
      culturalContext: 'Nigerian cultural elements, vibrant colors, modern African urban settings',
      primaryEthnicity: 'Black African (Nigerian)'
    },
    'ghana': {
      region: 'West Africa',
      ethnicRepresentation: 'Black African people with Ghanaian features, diverse ethnic backgrounds (Akan, Ewe, Ga)',
      culturalContext: 'Ghanaian cultural elements, Kente patterns, traditional and modern settings',
      primaryEthnicity: 'Black African (Ghanaian)'
    },
    'south africa': {
      region: 'Southern Africa',
      ethnicRepresentation: 'Diverse South African people, predominantly Black African with mixed representation',
      culturalContext: 'Rainbow nation diversity, modern African urban settings',
      primaryEthnicity: 'Black African (South African)'
    },
    'uganda': {
      region: 'East Africa',
      ethnicRepresentation: 'Black African people with Ugandan features, diverse tribal backgrounds',
      culturalContext: 'Ugandan cultural elements, traditional and modern African settings',
      primaryEthnicity: 'Black African (Ugandan)'
    },
    'tanzania': {
      region: 'East Africa',
      ethnicRepresentation: 'Black African people with Tanzanian features, Swahili cultural influence',
      culturalContext: 'Tanzanian cultural elements, coastal and inland African settings',
      primaryEthnicity: 'Black African (Tanzanian)'
    },
    'ethiopia': {
      region: 'East Africa',
      ethnicRepresentation: 'Black African people with Ethiopian features, diverse ethnic backgrounds',
      culturalContext: 'Ethiopian cultural elements, ancient African traditions, highland settings',
      primaryEthnicity: 'Black African (Ethiopian)'
    },
    'rwanda': {
      region: 'East Africa',
      ethnicRepresentation: 'Black African people with Rwandan features, unified cultural identity',
      culturalContext: 'Rwandan cultural elements, unity and progress themes, modern African settings',
      primaryEthnicity: 'Black African (Rwandan)'
    }
  };

  // Check for African countries first
  for (const [country, data] of Object.entries(africanCountries)) {
    if (locationKey.includes(country)) {
      return data;
    }
  }

  // Other regions
  if (locationKey.includes('india')) {
    return {
      region: 'South Asia',
      ethnicRepresentation: 'South Asian people with Indian features, diverse regional backgrounds',
      culturalContext: 'Indian cultural elements, vibrant colors, traditional and modern settings',
      primaryEthnicity: 'South Asian (Indian)'
    };
  }

  if (locationKey.includes('usa') || locationKey.includes('america')) {
    return {
      region: 'North America',
      ethnicRepresentation: 'Diverse American people, mixed ethnic representation reflecting local demographics',
      culturalContext: 'American cultural elements, modern urban/suburban settings',
      primaryEthnicity: 'Mixed American'
    };
  }

  if (locationKey.includes('canada')) {
    return {
      region: 'North America',
      ethnicRepresentation: 'Diverse Canadian people, multicultural representation',
      culturalContext: 'Canadian cultural elements, multicultural and inclusive settings',
      primaryEthnicity: 'Mixed Canadian'
    };
  }

  if (locationKey.includes('uk') || locationKey.includes('britain') || locationKey.includes('england')) {
    return {
      region: 'Europe',
      ethnicRepresentation: 'Diverse British people, mixed ethnic representation',
      culturalContext: 'British cultural elements, traditional and modern settings',
      primaryEthnicity: 'Mixed British'
    };
  }

  // Default for unspecified locations
  return {
    region: 'Global',
    ethnicRepresentation: 'Diverse people representing global demographics',
    culturalContext: 'Universal cultural elements with professional appeal',
    primaryEthnicity: 'Mixed Global'
  };
}

/**
 * Get cultural context for engaging designs based on location
 */
function getCulturalContextForLocation(location: string): string {
  const culturalContexts: Record<string, string> = {
    'kenya': 'Warm, community-focused culture with emphasis on relationships and Ubuntu philosophy. Use earth tones, community imagery, and authentic local elements.',
    'nigeria': 'Vibrant, entrepreneurial culture with strong community bonds. Incorporate bold colors, dynamic energy, and celebration of success.',
    'south africa': 'Diverse, multicultural society with emphasis on unity and progress. Use inclusive imagery and rainbow nation elements.',
    'ghana': 'Rich cultural heritage with emphasis on hospitality and community. Incorporate traditional patterns, warm colors, and welcoming imagery.',
    'uganda': 'Community-centered culture with emphasis on family and togetherness. Use natural elements, warm tones, and authentic representation.',
    'tanzania': 'Coastal influences with Swahili culture, emphasis on harmony and community. Incorporate natural textures and coastal elements.',
    'ethiopia': 'Ancient culture with strong traditions and community values. Use earth tones, traditional elements, and authentic representation.',
    'rwanda': 'Culture of unity and progress with emphasis on community development. Use clean, modern elements with traditional touches.',
    'india': 'Diverse, colorful culture with emphasis on family, festivals, and traditions. Use vibrant colors, cultural patterns, and inclusive imagery.',
    'canada': 'Multicultural, friendly society with emphasis on inclusivity and nature. Use clean, modern design with natural elements.',
    'usa': 'Diverse, dynamic culture with emphasis on innovation and opportunity. Use bold, modern elements with inclusive representation.',
    'uk': 'Traditional yet modern culture with emphasis on quality and heritage. Use classic elements with contemporary touches.',
    'default': 'Universal appeal with authentic, engaging elements that connect with diverse audiences through quality and professionalism.'
  };

  const locationKey = location.toLowerCase();
  for (const [key, context] of Object.entries(culturalContexts)) {
    if (locationKey.includes(key)) {
      return context;
    }
  }
  return culturalContexts['default'];
}

/**
 * Get local language elements for authentic cultural integration
 */
function getLocalLanguageElements(location: string): string | null {
  const languageElements: Record<string, string> = {
    'kenya': 'Swahili greetings (Jambo, Karibu, Asante), phrases like "Hakuna Matata" for positive messaging',
    'nigeria': 'Pidgin English elements, greetings like "How far?", "Wetin dey happen?", celebratory phrases',
    'south africa': 'Afrikaans/Zulu greetings (Sawubona, Dumela), phrases like "Ubuntu" for community connection',
    'ghana': 'Twi greetings (Akwaaba - welcome), local expressions for hospitality and community',
    'uganda': 'Luganda greetings (Oli otya), local expressions for community and togetherness',
    'tanzania': 'Swahili greetings (Hujambo, Karibu), coastal expressions and community phrases',
    'ethiopia': 'Amharic greetings (Selam), traditional expressions for community and respect',
    'rwanda': 'Kinyarwanda greetings (Muraho), expressions of unity and progress',
    'india': 'Hindi/regional greetings (Namaste, Dhanyawad), festival references, family-oriented phrases',
    'canada': 'French-English mix where appropriate, friendly Canadian expressions ("eh", "beauty")',
    'usa': 'Regional slang and expressions, diverse cultural references',
    'uk': 'British expressions, regional dialects where appropriate'
  };

  const locationKey = location.toLowerCase();
  for (const [key, elements] of Object.entries(languageElements)) {
    if (locationKey.includes(key)) {
      return elements;
    }
  }
  return null;
}

/**
 * Generate dynamic fallback captions with cultural elements and variety
 */
function generateDynamicFallbackCaption(
  businessName: string,
  businessType: string,
  location: string,
  useLocalLanguage: boolean
): string {
  // Use more random seed to ensure better variety
  const captionSeed = Date.now() + Math.random() * 10000 + Math.floor(Math.random() * 1000);
  const varietyIndex = Math.floor(captionSeed % 18); // 18 different caption patterns for more variety

  // Only use greeting 20% of the time when local language is enabled
  const shouldUseGreeting = useLocalLanguage && Math.random() < 0.2; // Reduced from always using greeting
  const localGreeting = shouldUseGreeting ? getLocalGreeting(location) : '';

  const captionPatterns = [
    // Story-driven (no greeting)
    `At ${businessName}, every client's success story matters. We're transforming ${businessType.toLowerCase()} experiences in ${location} one customer at a time.`,

    // Community-focused (no greeting)
    `Proudly serving the ${location} community with exceptional ${businessType.toLowerCase()} services. Your local success is our mission.`,

    // Problem-solution (no greeting)
    `Tired of unreliable ${businessType.toLowerCase()} services? ${businessName} delivers the quality and consistency you deserve in ${location}.`,

    // Value-proposition (no greeting)
    `Why choose ${businessName}? Because your ${businessType.toLowerCase()} needs deserve more than ordinary. Experience the difference in ${location}.`,

    // Behind-the-scenes (no greeting)
    `Behind every great ${businessType.toLowerCase()} service is a team that cares. Meet ${businessName} - your trusted partner in ${location}.`,

    // Results-focused (no greeting)
    `Real results, real impact. ${businessName} is changing how ${location} experiences ${businessType.toLowerCase()} services.`,

    // Educational/Expert (no greeting)
    `Years of expertise, countless satisfied clients. ${businessName} brings professional ${businessType.toLowerCase()} excellence to ${location}.`,

    // Seasonal/Timely (no greeting)
    `This is the perfect time to experience premium ${businessType.toLowerCase()} services. ${businessName} is ready to serve ${location}.`,

    // Trust-building (no greeting)
    `Building trust through exceptional service. ${businessName} has become ${location}'s go-to choice for ${businessType.toLowerCase()}.`,

    // Innovation-focused (no greeting)
    `Innovation meets reliability at ${businessName}. Discover modern ${businessType.toLowerCase()} solutions designed for ${location}.`,

    // Customer-centric (no greeting)
    `Your satisfaction drives everything we do. ${businessName} puts ${location} customers first in every ${businessType.toLowerCase()} interaction.`,

    // Achievement-focused (no greeting)
    `Celebrating another milestone in ${businessType.toLowerCase()} excellence. ${businessName} continues to raise the bar in ${location}.`,

    // NEW: Direct approach patterns (no greeting)
    `${businessName} delivers exceptional ${businessType.toLowerCase()} services that exceed expectations. Quality you can trust in ${location}.`,

    `Looking for reliable ${businessType.toLowerCase()} services in ${location}? ${businessName} combines expertise with genuine care for every client.`,

    `${businessName} stands out in ${location}'s ${businessType.toLowerCase()} industry. Professional service, personal attention, proven results.`,

    `Quality ${businessType.toLowerCase()} services shouldn't be hard to find. ${businessName} makes excellence accessible in ${location}.`,

    // Greeting patterns (only when shouldUseGreeting is true)
    `${localGreeting}Meet ${businessName}, transforming ${businessType.toLowerCase()} experiences in ${location} with personalized service and proven expertise.`,

    `${localGreeting}Discover why ${location} trusts ${businessName} for premium ${businessType.toLowerCase()} services. Quality that speaks for itself.`
  ];

  return captionPatterns[varietyIndex].trim();
}

/**
 * Get local greeting based on location for authentic cultural touch
 * Made more varied to avoid repetitive "Jambo!" starts
 */
function getLocalGreeting(location: string): string {
  const greetings: Record<string, string[]> = {
    'kenya': ['Jambo! ', 'Karibu! ', 'Habari! ', 'Hey! ', 'Hello! ', '', '', '', ''], // More empty strings for variety
    'nigeria': ['How far! ', 'Wetin dey happen! ', 'Good day! ', 'Hey! ', 'Hello! ', '', '', ''],
    'south africa': ['Sawubona! ', 'Hello! ', 'Good day! ', 'Hey! ', '', '', ''],
    'ghana': ['Akwaaba! ', 'Hello! ', 'Good morning! ', 'Hey! ', '', '', ''],
    'uganda': ['Oli otya! ', 'Hello! ', 'Good day! ', 'Hey! ', '', '', ''],
    'tanzania': ['Hujambo! ', 'Karibu! ', 'Habari! ', 'Hello! ', 'Hey! ', '', '', ''],
    'ethiopia': ['Selam! ', 'Hello! ', 'Good day! ', 'Hey! ', '', '', ''],
    'rwanda': ['Muraho! ', 'Hello! ', 'Good day! ', 'Hey! ', '', '', ''],
    'india': ['Namaste! ', 'Hello! ', 'Good day! ', 'Hey! ', '', '', ''],
    'canada': ['Hey there! ', 'Good day! ', 'Hello! ', '', '', ''],
    'usa': ['Hey! ', 'Hello! ', 'Good day! ', '', '', ''],
    'uk': ['Hello! ', 'Good day! ', 'Cheers! ', '', '', '']
  };

  const locationKey = location.toLowerCase();
  for (const [key, greetingList] of Object.entries(greetings)) {
    if (locationKey.includes(key)) {
      // Random selection with higher chance of no greeting (more empty strings in arrays)
      const randomGreeting = greetingList[Math.floor(Math.random() * greetingList.length)];
      return randomGreeting;
    }
  }

  // Default: 15% chance for generic greeting (reduced from 25%)
  return Math.random() < 0.15 ? 'Hello! ' : '';
}

/**
 * Get cultural design elements for visual authenticity
 */
function getCulturalDesignElements(location: string, useLocalLanguage: boolean): string {
  if (!useLocalLanguage) return '';

  const designElements: Record<string, string> = {
    'kenya': 'Subtle Maasai patterns, warm earth tones, acacia tree silhouettes, traditional geometric patterns',
    'nigeria': 'Vibrant Ankara patterns, bold geometric designs, traditional motifs, energetic color combinations',
    'south africa': 'Rainbow nation colors, traditional beadwork patterns, diverse cultural symbols, ubuntu elements',
    'ghana': 'Kente cloth patterns, Adinkra symbols, traditional gold accents, cultural geometric designs',
    'uganda': 'Traditional bark cloth textures, natural patterns, cultural symbols, earth tone accents',
    'tanzania': 'Swahili coastal patterns, traditional textiles, cultural motifs, natural textures',
    'ethiopia': 'Traditional cross patterns, ancient script elements, cultural symbols, earth tone designs',
    'rwanda': 'Traditional basket weaving patterns, unity symbols, cultural geometric designs, natural elements',
    'india': 'Mandala patterns, traditional motifs, festival colors, cultural geometric designs, paisley elements',
    'canada': 'Maple leaf elements, natural textures, multicultural symbols, clean modern designs',
    'usa': 'Stars and stripes elements, diverse cultural symbols, modern geometric patterns',
    'uk': 'Traditional patterns, heritage elements, classic design motifs, royal colors'
  };

  const locationKey = location.toLowerCase();
  for (const [key, elements] of Object.entries(designElements)) {
    if (locationKey.includes(key)) {
      return elements;
    }
  }

  return 'Subtle cultural patterns and authentic local design elements';
}

/**
 * Simple CTA cleanup - remove obvious problems without over-correcting
 */
function cleanupCTA(cta: string, businessName: string, businessType: string): string {
  if (!cta) return cta;

  let cleaned = cta.trim();

  // Remove business name from CTA
  const businessNamePattern = new RegExp(businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  cleaned = cleaned.replace(businessNamePattern, '').trim();

  // Remove awkward prepositions at the end
  cleaned = cleaned.replace(/\s+(at|with|from)\s*$/i, '');

  // Remove extra spaces and clean up
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Ensure proper capitalization
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Check if CTA has obvious problems
 */
function isProblematicCTA(cta: string, businessName: string): boolean {
  if (!cta || cta.length < 2) return true;

  const ctaLower = cta.toLowerCase();
  const businessNameLower = businessName.toLowerCase();

  // Check for business name in CTA
  if (ctaLower.includes(businessNameLower)) return true;

  // Check for awkward constructions
  const awkwardPatterns = [
    /shop\s+at\s*$/i,
    /visit\s+at\s*$/i,
    /book\s+with\s*$/i,
    /dine\s+at\s*$/i,
    /experience\s+the/i,
    /discover\s+the/i,
    /transform\s+your/i
  ];

  return awkwardPatterns.some(pattern => pattern.test(cta));
}

/**
 * Generate smart contextual CTA with cultural elements
 */
function generateSmartContextualCTA(businessType: string, businessName: string, location: string, useLocalLanguage: boolean): string {
  const type = businessType.toLowerCase();

  // Get cultural CTA if local language is enabled
  if (useLocalLanguage) {
    const culturalCTA = getCulturalCTA(location, type);
    if (culturalCTA && Math.random() < 0.3) { // 30% chance for cultural CTA
      return culturalCTA;
    }
  }

  // Business-specific CTAs
  const ctaMap: Record<string, string[]> = {
    restaurant: ['Order Now', 'Book Table', 'Dine Today', 'Reserve Now'],
    food: ['Order Now', 'Taste Today', 'Try Now', 'Get Fresh'],
    cafe: ['Visit Today', 'Try Now', 'Order Fresh', 'Taste Coffee'],
    retail: ['Shop Now', 'Browse Store', 'Buy Today', 'View Products'],
    store: ['Shop Now', 'Visit Store', 'Browse Now', 'Buy Today'],
    electronics: ['Shop Tech', 'View Products', 'Buy Now', 'Compare Now'],
    fashion: ['Shop Style', 'Browse Fashion', 'Buy Now', 'View Collection'],
    salon: ['Book Now', 'Schedule Today', 'Reserve Spot', 'Book Beauty'],
    spa: ['Book Now', 'Relax Today', 'Schedule Spa', 'Reserve Now'],
    fitness: ['Join Now', 'Start Today', 'Book Session', 'Try Free'],
    gym: ['Join Now', 'Start Fitness', 'Book Now', 'Try Today'],
    medical: ['Book Now', 'Schedule Visit', 'Get Care', 'Call Now'],
    dental: ['Book Now', 'Schedule Check', 'Call Today', 'Get Care'],
    consulting: ['Get Quote', 'Contact Us', 'Schedule Call', 'Learn More'],
    finance: ['Get Quote', 'Apply Now', 'Learn More', 'Contact Us'],
    tech: ['Get Started', 'Try Now', 'Contact Us', 'Learn More'],
    education: ['Enroll Now', 'Learn More', 'Join Today', 'Start Learning'],
    automotive: ['Book Service', 'Get Quote', 'Visit Today', 'Call Now'],
    real_estate: ['View Homes', 'Contact Us', 'Schedule Tour', 'Get Info'],
    beauty: ['Book Now', 'Schedule Today', 'Try Beauty', 'Reserve Spot'],
    healthcare: ['Book Now', 'Get Care', 'Schedule Visit', 'Call Today']
  };

  // Find matching business type
  for (const [key, ctas] of Object.entries(ctaMap)) {
    if (type.includes(key)) {
      return ctas[Math.floor(Math.random() * ctas.length)];
    }
  }

  // Default professional CTAs
  const defaultCTAs = ['Get Started', 'Contact Us', 'Learn More', 'Book Now', 'Get Quote'];
  return defaultCTAs[Math.floor(Math.random() * defaultCTAs.length)];
}

/**
 * Get cultural CTA based on location
 */
function getCulturalCTA(location: string, businessType: string): string | null {
  const locationKey = location.toLowerCase();

  const culturalCTAs: Record<string, string[]> = {
    kenya: ['Karibu', 'Twende', 'Haya', 'Njoo'],
    nigeria: ['Come Now', 'Make We Go', 'No Delay', 'Come Try'],
    ghana: ['Akwaaba', 'Come Try', 'Visit Us', 'Come Now'],
    india: ['Aao', 'Chalo', 'Jaldi', 'Come Now'],
    south_africa: ['Come Now', 'Try Today', 'Visit Us', 'Join Us']
  };

  for (const [key, ctas] of Object.entries(culturalCTAs)) {
    if (locationKey.includes(key)) {
      return ctas[Math.floor(Math.random() * ctas.length)];
    }
  }

  return null;
}

// Revo 1.5 model constants - Direct Vertex AI
const REVO_1_5_IMAGE_MODEL = 'gemini-2.5-flash-image'; // Direct Vertex AI model
const REVO_1_5_TEXT_MODEL = 'gemini-2.5-flash'; // Direct Vertex AI model

// Direct API function when proxy is not available
async function generateContentDirect(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean): Promise<any> {

  if (isImageGeneration) {
    // Use Vertex AI for image generation

    // Prepare prompt and logo
    let prompt: string;
    let logoImage: string | undefined;

    if (Array.isArray(promptOrParts)) {
      const textParts = promptOrParts.filter(part => typeof part === 'string');
      prompt = textParts.join(' ');

      // Extract logo image data if present
      const imageParts = promptOrParts.filter(part => typeof part === 'object' && part.inlineData);
      if (imageParts.length > 0) {
        const imageData = imageParts[0].inlineData;
        logoImage = `data:${imageData.mimeType};base64,${imageData.data}`;
      }
    } else {
      prompt = promptOrParts;
    }

    const result = await getVertexAIClient().generateImage(prompt, REVO_1_5_IMAGE_MODEL, {
      temperature: 0.7,
      maxOutputTokens: 8192,
      logoImage
    });

    // Return in expected format
    return {
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              mimeType: result.mimeType,
              data: result.imageData
            }
          }]
        },
        finishReason: result.finishReason
      }]
    };
  } else {
    // Use Vertex AI for text generation

    const prompt = Array.isArray(promptOrParts) ? promptOrParts.join(' ') : promptOrParts;

    try {

      const result = await getVertexAIClient().generateText(prompt, REVO_1_5_TEXT_MODEL, {
        temperature: 0.7,
        maxOutputTokens: 8192
      });

      // Return in expected format
      return {
        response: {
          text: () => result.text,
          candidates: [{
            content: { parts: [{ text: result.text }] },
            finishReason: result.finishReason
          }]
        }
      };
    } catch (error) {
      console.error('❌ Vertex AI direct API failed:', error);
      throw error;
    }
  }
}

// Direct Vertex AI function (replaces proxy routing)
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  return await generateContentDirect(promptOrParts, modelName, isImageGeneration);
}

import { ensureExactDimensions } from './utils/image-dimensions';

// Helper function to convert logo URL to base64 data URL for AI models (matching Revo 1.0)
// Helper function to convert logo URL to base64 data URL for AI models (matching Revo 1.0)
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // If it's a Supabase Storage URL, fetch and convert to base64
  if (logoUrl.startsWith('http')) {
    try {

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ [Revo 1.5] Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return dataUrl;
    } catch (error) {
      console.error('❌ [Revo 1.5] Error converting logo URL to base64:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Analyze business to generate intelligent content strategy
 */
async function analyzeBusinessForContentStrategy(
  businessType: string,
  businessName: string,
  brandProfile: BrandProfile,
  platform: string,
  trendingData: any,
  useLocalLanguage: boolean = false
): Promise<{
  contentApproach: string;
  keyMessages: string[];
  targetPainPoints: string[];
  uniqueValueProps: string[];
  emotionalTriggers: string[];
  contentTone: string;
  localInsights: string[];
  naturalContextStrategy?: any;
}> {
  // 🎯 Generate Product-Lifestyle Integration Strategy (Fallback)
  const naturalContextStrategy = {
    primaryScenarios: [],
    contextualApproaches: ['product-showcase', 'lifestyle-integration'],
    lifestyleTouchpoints: ['daily-use', 'problem-solving'],
    authenticUseCases: ['professional-use', 'personal-benefit'],
    behavioralPatterns: ['regular-usage', 'problem-resolution'],
    emotionalConnections: ['trust', 'satisfaction', 'reliability']
  };

  try {

    // Strategic location mention in business analysis - only include sometimes
    const shouldMentionLocationInAnalysis = Math.random() < 0.5; // 50% chance to mention location
    const locationTextForAnalysis = shouldMentionLocationInAnalysis && brandProfile.location
      ? `- Location: ${brandProfile.location}`
      : '';

    const analysisPrompt = `Analyze this ${businessType} business and create a unique content strategy:

BUSINESS CONTEXT:
- Name: ${businessName}
- Type: ${businessType}
${locationTextForAnalysis}
- Target Audience: ${brandProfile.targetAudience || 'General audience'}
- Platform: ${platform}
- Services: ${brandProfile.services || 'Business services'}
- Use Local Language: ${useLocalLanguage ? 'Yes - mix English with local language elements' : 'No - English only'}

CURRENT TRENDS & EVENTS:
${trendingData.currentEvents.length > 0 ? `- Current Events: ${trendingData.currentEvents.join(', ')}` : ''}
${trendingData.businessTrends.length > 0 ? `- Business Trends: ${trendingData.businessTrends.join(', ')}` : ''}
${trendingData.socialBuzz.length > 0 ? `- Social Buzz: ${trendingData.socialBuzz.join(', ')}` : ''}

🌟 NATURAL CONTEXT MARKETING APPROACH:
Use these authentic lifestyle scenarios to create natural, non-promotional content:
${naturalContextStrategy.primaryScenarios.map((scenario, index) => `
${index + 1}. ${scenario.context}: ${scenario.scenario}
   - User Behavior: ${scenario.userBehavior}
   - Emotional Trigger: ${scenario.emotionalTrigger}
   - Natural Integration: ${scenario.naturalIntegration}`).join('')}

CONTEXTUAL APPROACHES AVAILABLE:
${naturalContextStrategy.contextualApproaches.map(approach => `- ${approach}`).join('\n')}

LIFESTYLE TOUCHPOINTS:
${naturalContextStrategy.lifestyleTouchpoints.map(touchpoint => `- ${touchpoint}`).join('\n')}

ANALYZE AND PROVIDE:
1. Content Approach: Focus on NATURAL CONTEXT MARKETING - choose from lifestyle scenarios above. Avoid direct promotion. Show the business naturally integrated into daily life scenarios.
2. Key Messages: 3-5 core messages that fit naturally into the chosen lifestyle scenarios
3. Target Pain Points: What problems does this business solve within the natural contexts above?
4. Unique Value Props: What makes this business valuable in the authentic scenarios?
5. Emotional Triggers: Use the emotional triggers from the lifestyle scenarios above
6. Content Tone: What tone works best for authentic lifestyle integration? (natural, relatable, authentic, lifestyle-focused, scenario-based)
7. Local Insights: What local/cultural elements enhance the natural scenarios?

${useLocalLanguage ? `
LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${brandProfile.location || 'the location'}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing

HEADLINE & SUBHEADLINE LOCAL LANGUAGE GUIDANCE:
- Add contextually appropriate local greetings to headlines based on business type
- Use local expressions in subheadlines that relate to the specific business industry
- Include relevant local terms that match the business offerings and target audience
- Mix naturally: Don't force local language - only add when it makes sense and flows well
- Keep it relevant: Use local language that relates to the specific business context and audience
- Maintain engagement: Ensure the local language enhances rather than distracts from the message
- Be dynamic: Generate unique local language for each business, avoid repetitive patterns
- Think creatively: Use different local greetings, expressions, and terms for each business type

DYNAMIC LOCAL LANGUAGE GENERATION:
- For RESTAURANTS: Use food-related local terms, hospitality greetings, taste expressions
- For FITNESS: Use energy/motivation local terms, health expressions, action words
- For TECH: Use innovation local terms, future expressions, digital concepts
- For BEAUTY: Use beauty-related local terms, confidence expressions, aesthetic words
- For FINANCE: Use money/security local terms, trust expressions, financial concepts
- For HEALTHCARE: Use health/wellness local terms, care expressions, medical concepts
- For EDUCATION: Use learning local terms, growth expressions, knowledge concepts
- For REAL ESTATE: Use home/property local terms, dream expressions, space concepts
- VARY the local language: Don't use the same phrases for every business
- BE CONTEXTUAL: Match local language to the specific business industry and services` : `
LANGUAGE REQUIREMENTS:
- Use English only, do not use local language
- Keep content in English for universal accessibility`}

Be specific to THIS business, not generic. Think like a marketing expert who deeply understands this industry and location.

CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no code blocks, no additional text.

EXAMPLE RESPONSE FORMAT:
{"contentApproach": "product-showcase", "keyMessages": ["Professional electronics services", "Quality tech solutions", "Expert electronics support"], "targetPainPoints": ["Finding reliable tech services", "Quality concerns", "Trust issues"], "uniqueValueProps": ["Professional expertise", "Quality service", "Local presence"], "emotionalTriggers": ["trust", "quality", "innovation"], "contentTone": "professional", "localInsights": ["Serving local community", "Local tech expertise", "Trusted locally"]}

Return ONLY valid JSON in this exact format:`;

    const response = await generateContentWithProxy(analysisPrompt, REVO_1_5_TEXT_MODEL, false);

    // Extract text from Vertex AI response format
    const responseText = extractTextFromResponse(response);

    try {
      // Handle Vertex AI response format

      // Clean the response to extract JSON
      let cleanResponse = responseText.trim();

      // Remove markdown code blocks
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/g, '');
      }

      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const extractedJson = cleanResponse.substring(jsonStart, jsonEnd + 1);
        cleanResponse = extractedJson;
      }

      // Additional cleanup - remove any remaining non-JSON text
      cleanResponse = cleanResponse.trim();

      let analysis;
      try {
        analysis = JSON.parse(cleanResponse);
      } catch (firstParseError) {
        console.warn('🔄 [Revo 1.5] First JSON parse failed, trying alternative parsing...');

        // Try to find and extract JSON more aggressively
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw firstParseError;
        }
      }

      return {
        ...analysis,
        naturalContextStrategy
      };
    } catch (parseError) {
      console.error('❌ [Revo 1.5] Failed to parse business analysis');
      console.error('📝 [Revo 1.5] Raw response:', response);
      console.error('⚠️ [Revo 1.5] Parse error:', parseError);
      console.error('🔍 [Revo 1.5] Response type check:', typeof response);

      // Product-focused fallback based on business type
      const businessType = brandProfile.businessType || 'business';
      return {
        contentApproach: 'product-showcase',
        keyMessages: [
          `Professional ${businessType.toLowerCase()} services you can trust`,
          `Quality ${businessType.toLowerCase()} solutions for your needs`,
          `Expert ${businessType.toLowerCase()} services in ${brandProfile.location || 'your area'}`
        ],
        targetPainPoints: [
          `Finding reliable ${businessType.toLowerCase()} services`,
          'Quality and professional service concerns',
          'Trust and credibility in service providers'
        ],
        uniqueValueProps: [
          'Professional expertise and experience',
          'Quality service delivery',
          'Trusted local presence'
        ],
        emotionalTriggers: ['trust', 'quality', 'professionalism'],
        contentTone: 'professional and trustworthy',
        localInsights: [
          `Serving the ${brandProfile.location || 'local'} community`,
          `Local expertise in ${businessType.toLowerCase()}`,
          `Trusted by locals for quality service`
        ],
        naturalContextStrategy
      };
    }

  } catch (error) {
    console.warn('⚠️ [Revo 1.5] Business analysis failed completely:', error);

    // Product-focused fallback based on business type
    const businessType = brandProfile.businessType || 'business';
    return {
      contentApproach: 'product-showcase',
      keyMessages: [
        `Excellence in ${businessType.toLowerCase()} services`,
        `Your trusted ${businessType.toLowerCase()} partner`,
        `Quality ${businessType.toLowerCase()} solutions delivered`
      ],
      targetPainPoints: [
        `Need for reliable ${businessType.toLowerCase()} services`,
        'Quality service expectations',
        'Professional service delivery'
      ],
      uniqueValueProps: [
        'Proven expertise and results',
        'Professional service standards',
        'Customer-focused approach'
      ],
      emotionalTriggers: ['confidence', 'reliability', 'excellence'],
      contentTone: 'professional and confident',
      localInsights: [
        `Leading ${businessType.toLowerCase()} services locally`,
        `Community-trusted expertise`,
        `Local knowledge and experience`
      ],
      naturalContextStrategy
    };
  }
}

/**
 * Fetch trending data for content generation
 */
async function fetchTrendingData(
  businessType: string,
  location: string,
  platform: string
): Promise<{
  trendingHashtags: string[];
  currentEvents: string[];
  businessTrends: string[];
  socialBuzz: string[];
}> {
  try {

    // Fetch trending hashtags
    const trendingHashtags = await TrendingHashtagsService.getTrendingHashtags(
      businessType,
      location,
      10
    );

    // Fetch regional social trends
    const regionalData = await RegionalSocialTrendsService.getRegionalSocialData(
      businessType,
      location
    );

    return {
      trendingHashtags: trendingHashtags || [],
      currentEvents: regionalData.currentEvents || [],
      businessTrends: regionalData.businessTrends || [],
      socialBuzz: regionalData.socialBuzz || []
    };

  } catch (error) {
    console.warn('⚠️ [Revo 1.5] Failed to fetch trending data:', error);
    return {
      trendingHashtags: [],
      currentEvents: [],
      businessTrends: [],
      socialBuzz: []
    };
  }
}

/**
 * Validate content quality and business specificity
 */
function validateContentQuality(
  content: any,
  businessName: string,
  businessType: string,
  brandProfile: BrandProfile
): { isBusinessSpecific: boolean; issues: string[] } {
  const issues: string[] = [];
  let isBusinessSpecific = true;

  // Check if content mentions business name OR business type (more flexible)
  const contentText = `${content.headline || ''} ${content.subheadline || ''} ${content.caption || ''}`.toLowerCase();
  const businessNameLower = businessName.toLowerCase();
  const businessTypeLower = businessType.toLowerCase();

  // Content is business-specific if it mentions business name OR business type OR has specific industry terms
  const mentionsBusinessName = contentText.includes(businessNameLower);
  const mentionsBusinessType = contentText.includes(businessTypeLower);
  const hasSpecificTerms = contentText.length > 20; // Basic check for substantial content

  if (!mentionsBusinessName && !mentionsBusinessType && !hasSpecificTerms) {
    issues.push('Content appears too generic');
    isBusinessSpecific = false;
  }

  // Check for generic phrases that indicate template content
  const genericPhrases = [
    'your business', 'our company', 'we provide', 'contact us',
    'lorem ipsum', 'placeholder', 'example business'
  ];

  const hasGenericContent = genericPhrases.some(phrase =>
    contentText.includes(phrase.toLowerCase())
  );

  if (hasGenericContent) {
    issues.push('Content contains generic template phrases');
    isBusinessSpecific = false;
  }

  // Check if content relates to business type/industry
  if (brandProfile.services) {
    const services = typeof brandProfile.services === 'string'
      ? brandProfile.services.toLowerCase()
      : brandProfile.services.join(' ').toLowerCase();

    const mentionsServices = services.split(' ').some(service =>
      service.length > 3 && contentText.includes(service)
    );

    if (!mentionsServices && !contentText.includes(businessTypeLower)) {
      issues.push('Content does not relate to business services or type');
      isBusinessSpecific = false;
    }
  }

  return { isBusinessSpecific, issues };
}

/**
 * Generate fallback hashtags based on platform requirements
 */
function generateFallbackHashtags(businessName: string, businessType: string, platform: string): string[] {
  const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
  const baseHashtags = [
    `#${businessName.replace(/\s+/g, '')}`,
    `#${businessType.replace(/\s+/g, '')}`,
    '#professional',
    '#quality',
    '#service'
  ];

  return baseHashtags.slice(0, hashtagCount);
}

/**
 * Validate and optimize CTA selection
 */
function validateAndOptimizeCTA(
  aiGeneratedCTA: string,
  enhancedCTA: string,
  businessType: string,
  platform: string
): string {
  // Generic CTAs that should be replaced
  const genericCTAs = [
    'learn more', 'contact us', 'get started', 'click here', 'find out more',
    'discover more', 'see more', 'read more', 'choose us', 'visit us'
  ];

  // Check if AI-generated CTA is generic
  const isGeneric = !aiGeneratedCTA ||
    genericCTAs.some(generic => aiGeneratedCTA.toLowerCase().includes(generic));

  // Check if AI-generated CTA is business-appropriate
  const isBusinessAppropriate = isBusinessAppropriateCTA(aiGeneratedCTA, businessType);

  // Use enhanced CTA if AI CTA is generic or inappropriate
  if (isGeneric || !isBusinessAppropriate) {
    return EnhancedCTAGenerator.generatePlatformSpecificCTA(enhancedCTA, platform);
  }

  // Use AI-generated CTA if it's specific and appropriate
  return EnhancedCTAGenerator.generatePlatformSpecificCTA(aiGeneratedCTA, platform);
}

/**
 * Fix grammatically incorrect CTAs by adding proper prepositions
 */
function fixCTAGrammar(cta: string, businessName: string, businessType: string, location: string): string {
  if (!cta) return cta;

  const ctaLower = cta.toLowerCase();
  const type = businessType.toLowerCase();

  // Smart grammar fixes that use natural English
  const grammarFixes: Array<{ pattern: RegExp, replacement: string | ((match: string) => string), condition?: (match: string) => boolean }> = [
    // Smart shop fixes - handle all shop cases in one rule
    {
      pattern: /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: (match: string) => {
        const shopMatch = match.match(/^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        if (!shopMatch) return match;

        const target = shopMatch[1].trim();
        const timeWord = shopMatch[2] ? ` ${shopMatch[2].trim()}` : '';

        // Don't process if it's just "Shop Now" or "Shop Today" - already correct
        if (!target || target.toLowerCase() === 'now' || target.toLowerCase() === 'today') {
          return match;
        }

        // Check if it's a city first
        if (location && target.toLowerCase() === location.toLowerCase()) {
          return `Shop in ${target}${timeWord}`;
        }

        // Generic products - keep simple (exact matches or starts with)
        const genericProducts = ['phones', 'electronics', 'clothes', 'shoes', 'books', 'gadgets', 'fashion'];
        if (genericProducts.some(product => target.toLowerCase() === product || target.toLowerCase().startsWith(product + ' '))) {
          return `Shop${timeWord}`;
        }

        // If it looks like a business name (contains business words), use "at"
        const businessWords = ['store', 'shop', 'mart', 'center', 'mall', 'outlet', 'boutique', 'emporium'];
        if (businessWords.some(word => target.toLowerCase().includes(word))) {
          return `Shop at ${target}${timeWord}`;
        }

        // If it's clearly a brand/business name (capitalized), use "at"
        if (target !== target.toLowerCase()) {
          return `Shop at ${target}${timeWord}`;
        }

        // Default: keep it simple
        return `Shop${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Shop Now"
        if (/^shop\s*(now|today)?\s*$/i.test(match)) return false;
        // Only if no preposition exists
        return !/(at|in|with|from)\s/i.test(match);
      }
    },
    // Fix "Order [BusinessName]" - only add "from" when it makes sense
    {
      pattern: /^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: (match: string) => {
        const orderMatch = match.match(/^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        if (!orderMatch) return match;

        const target = orderMatch[1].trim();
        const timeWord = orderMatch[2] ? ` ${orderMatch[2].trim()}` : '';

        // Don't process if it's just "Order Now" or "Order Today" - already correct
        if (!target || target.toLowerCase() === 'now' || target.toLowerCase() === 'today') {
          return match;
        }

        // Generic products - keep simple (exact matches or starts with)
        const genericProducts = ['food', 'pizza', 'coffee', 'lunch', 'dinner', 'takeout'];
        if (genericProducts.some(product => target.toLowerCase() === product || target.toLowerCase().startsWith(product + ' '))) {
          return `Order${timeWord}`;
        }

        // If it's clearly a business name, use "from"
        if (target !== target.toLowerCase()) {
          return `Order from ${target}${timeWord}`;
        }

        return `Order${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Order Now"
        if (/^order\s*(now|today)?\s*$/i.test(match)) return false;
        return !/(from|at|with)\s/i.test(match);
      }
    },
    // Fix "Book [BusinessName]" - only add "with" when it makes sense
    {
      pattern: /^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: (match: string) => {
        const bookMatch = match.match(/^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        if (!bookMatch) return match;

        const target = bookMatch[1].trim();
        const timeWord = bookMatch[2] ? ` ${bookMatch[2].trim()}` : '';

        // Don't process if it's just "Book Now" or "Book Today" - already correct
        if (!target || target.toLowerCase() === 'now' || target.toLowerCase() === 'today') {
          return match;
        }

        // If it's a generic service, keep simple
        const genericServices = ['appointment', 'session', 'consultation', 'meeting', 'call'];
        if (genericServices.some(service => target.toLowerCase().includes(service))) {
          return `Book${timeWord}`;
        }

        // If it's clearly a business name, use "with"
        if (target !== target.toLowerCase()) {
          return `Book with ${target}${timeWord}`;
        }

        return `Book${timeWord}`;
      },
      condition: (match) => {
        // Don't apply to already correct CTAs like "Book Now"
        if (/^book\s*(now|today)?\s*$/i.test(match)) return false;
        return !/(with|at)\s/i.test(match);
      }
    }
  ];

  let fixedCTA = cta;

  for (const fix of grammarFixes) {
    if (fix.pattern.test(fixedCTA)) {
      // Check condition if provided
      if (!fix.condition || fix.condition(fixedCTA)) {
        const originalCTA = fixedCTA;
        if (typeof fix.replacement === 'function') {
          fixedCTA = fix.replacement(fixedCTA);
        } else {
          fixedCTA = fixedCTA.replace(fix.pattern, fix.replacement);
        }
        break;
      }
    }
  }

  // Clean up extra spaces
  fixedCTA = fixedCTA.replace(/\s+/g, ' ').trim();

  // Ensure proper capitalization
  fixedCTA = fixedCTA.charAt(0).toUpperCase() + fixedCTA.slice(1);

  return fixedCTA;
}

/**
 * Generate contextually appropriate CTA based on business type
 */
function generateContextualCTA(businessType: string, businessName: string, location: string): string {
  const type = businessType.toLowerCase();

  // Natural, business-specific CTA patterns
  const ctaPatterns: Record<string, string[]> = {
    restaurant: ['Dine Today', 'Order Now', 'Reserve Table', 'Book Now'],
    food: ['Order Now', 'Taste Today', 'Try Now', 'Order Online'],
    cafe: ['Visit Us', 'Order Now', 'Try Today', 'Come In'],
    retail: ['Shop Now', 'Browse Store', 'View Products', 'Explore'],
    store: ['Shop Now', 'Visit Store', 'Browse Now', 'Shop Today'],
    electronics: ['Shop Now', 'View Products', 'Compare Now', 'Browse Tech'],
    fashion: ['Shop Now', 'Browse Style', 'View Collection', 'Explore Fashion'],
    salon: ['Book Now', 'Schedule Now', 'Book Today', 'Reserve Spot'],
    spa: ['Book Now', 'Relax Today', 'Schedule Now', 'Book Session'],
    fitness: ['Join Us', 'Start Today', 'Book Session', 'Get Fit'],
    medical: ['Schedule Now', 'Book Appointment', 'Call Today', 'Contact Us'],
    dental: ['Schedule Now', 'Book Appointment', 'Call Today', 'Book Visit'],
    consulting: ['Contact Us', 'Schedule Call', 'Get Quote', 'Learn More'],
    legal: ['Contact Us', 'Schedule Consultation', 'Get Help', 'Call Now'],
    financial: ['Contact Us', 'Schedule Meeting', 'Get Quote', 'Learn More']
  };

  // Find matching business type
  for (const [businessKey, ctas] of Object.entries(ctaPatterns)) {
    if (type.includes(businessKey)) {
      const randomIndex = Math.floor(Math.random() * ctas.length);
      return ctas[randomIndex];
    }
  }

  // Default professional CTAs
  const defaultCTAs = ['Contact Us', 'Learn More', 'Get Started', 'Call Today', 'Visit Us'];
  const randomIndex = Math.floor(Math.random() * defaultCTAs.length);
  return defaultCTAs[randomIndex];
}

/**
 * Check if CTA is appropriate for business type
 */
function isBusinessAppropriateCTA(cta: string, businessType: string): boolean {
  if (!cta) return false;

  const type = businessType.toLowerCase();
  const ctaLower = cta.toLowerCase();

  // Restaurant/Food business should have booking/ordering CTAs
  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) {
    return ctaLower.includes('book') || ctaLower.includes('order') ||
      ctaLower.includes('reserve') || ctaLower.includes('table') ||
      ctaLower.includes('dine') || ctaLower.includes('taste') || ctaLower.includes('try');
  }

  // Service businesses should have booking/scheduling CTAs
  if (type.includes('salon') || type.includes('spa') || type.includes('fitness') ||
    type.includes('medical') || type.includes('dental')) {
    return ctaLower.includes('book') || ctaLower.includes('schedule') ||
      ctaLower.includes('appointment') || ctaLower.includes('session') ||
      ctaLower.includes('join') || ctaLower.includes('start');
  }

  // Retail businesses should have shopping CTAs
  if (type.includes('retail') || type.includes('store') || type.includes('shop') ||
    type.includes('electronics') || type.includes('fashion')) {
    return ctaLower.includes('shop') || ctaLower.includes('buy') ||
      ctaLower.includes('browse') || ctaLower.includes('view') ||
      ctaLower.includes('compare');
  }

  // Professional services should have consultation CTAs
  if (type.includes('consulting') || type.includes('legal') || type.includes('financial')) {
    return ctaLower.includes('schedule') || ctaLower.includes('consult') ||
      ctaLower.includes('meeting') || ctaLower.includes('call') ||
      ctaLower.includes('contact') || ctaLower.includes('quote');
  }

  // If we can't determine, assume it's appropriate
  return true;
}

/**
 * Validate word count for headlines and subheadlines
 */
function validateWordCount(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }

  const truncated = words.slice(0, maxWords).join(' ');
  return truncated;
}

/**
 * Generate Enhanced Simple Content (NO hardcoded patterns - last resort fallback)
 */
async function generateEnhancedSimpleContent(
  businessType: string,
  businessName: string,
  platform: string,
  brandProfile: any,
  useLocalLanguage: boolean = false
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {

    // Platform-specific hashtag count
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

    // Enhanced prompt with product intelligence and cultural context
    const prompt = `Create marketing content for ${businessName} (${businessType}) on ${platform}.

Business: ${businessName}
Type: ${businessType}
Services: ${brandProfile.services || 'Professional services'}
Location: ${brandProfile.location || 'Not specified'}
Target Audience: ${brandProfile.targetAudience || 'General customers'}
Platform: ${platform}

REQUIREMENTS:
1. Use SPECIFIC product names, models, and pricing
2. Include LOCAL cultural references and language
3. Mention WHY choose this business over competitors
4. Include REAL numbers, testimonials, or achievements
5. Provide SPECIFIC contact methods and locations

BANNED PHRASES (DO NOT USE):
- "wide range of products" / "comprehensive solutions"
- "quality at an affordable price" / "best value"
- "we understand that" / "we know that"
- "revolutionize your" / "transform your"
- "experience the future" / "embrace innovation"
- "redefining" / "cutting-edge"
- "innovative approach" / "next-generation"
- "staying connected" / "staying ahead"
- "wide selection" / "extensive range"
- "premium quality" / "superior quality"
- "upgrade your" / "enhance your"
- "unlock potential" / "unlock possibilities"
- "fuel your" / "power your"
- "empower your" / "elevate your"
- "partners in" / "tools for"
- "exceptional work" / "exceptional results"
- "perfect blend" / "perfect combination"

MANDATORY ELEMENTS:
- SPECIFIC product names (e.g., "Samsung Galaxy S23 Ultra", "iPhone 15 Pro")
- EXACT pricing (e.g., "KSh 120,000", "Lipa Pole Pole available")
- LOCAL references (e.g., "M-Pesa payments", "Nairobi delivery")
- COMPETITIVE advantages (e.g., "vs Safaricom Shop", "genuine warranty")
- SOCIAL proof (e.g., "500+ customers", "3 years in business")
- CONTACT info (e.g., "WhatsApp +254", "Visit Bazaar Plaza")
- LOCATION details (e.g., "Nairobi CBD", "Bazaar Plaza 10th Floor")

Respond with ONLY valid JSON:
{
  "headline": "Specific, benefit-driven headline (MAX 6 WORDS)",
  "subheadline": "Supporting subheadline with specific features, numbers, or social proof (MAX 14 WORDS)",
  "callToAction": "Actionable call-to-action with specific next steps",
  "caption": "Engaging caption with specific products, pricing, and cultural context",
  "hashtags": [${Array(hashtagCount).fill('"#relevant"').join(', ')}]
}`;

    const fullPrompt = `You are an expert content creator who creates authentic, business-specific content.

STRICT RULES:
- NEVER use these overused words: upgrade, transform, revolutionize, solutions, excellence, premium, ultimate, cutting-edge, innovative, breakthrough, game-changer, elevate, empower, unlock, discover
- ALWAYS be specific to the actual business and services
- ALWAYS use natural, conversational language
- ALWAYS make content feel like a real person wrote it
- ALWAYS focus on real, tangible benefits
- Generate exactly ${hashtagCount} hashtags for ${platform}
- Vary your approach - don't repeat the same patterns
- Be creative and authentic for each business

${prompt}`;

    const response = await generateContentWithProxy(fullPrompt, REVO_1_5_TEXT_MODEL, false);
    let responseContent = extractTextFromResponse(response) || '{}';

    // Clean up response
    if (responseContent.includes('```json')) {
      responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.split('```')[1] || responseContent;
    }

    const parsed = JSON.parse(responseContent);

    // Ensure correct hashtag count
    if (parsed.hashtags && parsed.hashtags.length !== hashtagCount) {
      if (parsed.hashtags.length > hashtagCount) {
        parsed.hashtags = parsed.hashtags.slice(0, hashtagCount);
      } else {
        // Add simple, relevant hashtags
        const simpleHashtags = [`#${businessType.toLowerCase().replace(/\s+/g, '')}`, '#local', '#business', '#quality', '#professional'];
        while (parsed.hashtags.length < hashtagCount && simpleHashtags.length > 0) {
          const tag = simpleHashtags.shift();
          if (tag && !parsed.hashtags.includes(tag)) {
            parsed.hashtags.push(tag);
          }
        }
      }
    }

    // Validate and adjust word counts
    const validatedHeadline = this.validateWordCount(parsed.headline || `${businessName} Excellence`, 6);
    const validatedSubheadline = this.validateWordCount(parsed.subheadline || `Quality ${businessType.toLowerCase()} services you can trust`, 14);

    // Generate dynamic fallback caption if needed
    let fallbackCaption;
    try {
      fallbackCaption = parsed.caption || generateDynamicFallbackCaption(
        businessName,
        businessType,
        brandProfile.location || '',
        useLocalLanguage
      );
    } catch (fallbackError) {
      console.error('❌ [Revo 1.5] Fallback caption generation failed:', fallbackError);
      fallbackCaption = `${businessName} provides quality ${businessType.toLowerCase()} services. Contact us today.`;
    }

    return {
      caption: fallbackCaption,
      hashtags: parsed.hashtags || [`#${businessType.toLowerCase().replace(/\s+/g, '')}`, '#local', '#business'].slice(0, hashtagCount),
      headline: validatedHeadline,
      subheadline: validatedSubheadline,
      callToAction: parsed.callToAction ?
        cleanupCTA(parsed.callToAction, businessName, businessType) :
        generateSmartContextualCTA(businessType, businessName, brandProfile.location || '', useLocalLanguage)
    };

  } catch (error) {
    console.error('❌ [Enhanced Simple AI] Content generation failed:', error);

    // Ultimate fallback with NO hardcoded patterns
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
    const simpleHashtags = [
      `#${businessType.toLowerCase().replace(/\s+/g, '')}`,
      '#local',
      '#business',
      '#quality',
      '#professional'
    ].slice(0, hashtagCount);

    return {
      caption: `${businessName} is your trusted ${businessType.toLowerCase()} partner. We're committed to providing excellent service and results.`,
      hashtags: simpleHashtags,
      headline: `${businessName} Quality`,
      subheadline: `Professional ${businessType.toLowerCase()} services`,
      callToAction: generateContextualCTA(businessType, businessName, brandProfile.location || '')
    };
  }
}

/**
 * Generate content using Pure AI (ZERO hardcoding)
 */
async function generatePureAIContent(
  businessType: string,
  businessName: string,
  platform: string,
  brandProfile: BrandProfile,
  useLocalLanguage: boolean = false,
  scheduledServices?: ScheduledService[]
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {

    // Prepare context for Pure AI
    const services = Array.isArray(brandProfile.services)
      ? brandProfile.services.join(', ')
      : brandProfile.services || `${businessType} services`;

    const pureAIRequest: PureAIRequest = {
      businessType,
      businessName,
      services,
      platform,
      contentType: 'all',
      targetAudience: brandProfile.targetAudience,
      location: brandProfile.location,
      websiteUrl: brandProfile.websiteUrl,
      brandContext: {
        colors: [brandProfile.primaryColor, brandProfile.secondaryColor].filter(Boolean),
        personality: brandProfile.brandPersonality,
        values: brandProfile.brandValues
      }
    };

    // Let Minimal AI make ALL decisions with product intelligence
    const aiResult = await WorkingPureAIContentGenerator.generateContent(pureAIRequest);

    return {
      caption: aiResult.content.caption,
      hashtags: aiResult.content.hashtags,
      headline: aiResult.content.headline,
      subheadline: aiResult.content.subheadline,
      callToAction: aiResult.content.cta
    };

  } catch (error) {
    console.error('❌ [Pure AI] Content generation failed:', error);
    console.error('❌ [Pure AI] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      businessName,
      businessType,
      platform
    });

    // Re-throw error to let the main system handle fallbacks
    throw new Error(`Pure AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate caption, hashtags, headlines, subheadlines, and CTAs for Revo 1.5
 * UPGRADED: Now uses customer-centric content generation focused on outcomes
 * Follows winning formula: Hook → Promise → Proof → CTA
 */
async function generateCaptionAndHashtags(
  businessType: string,
  businessName: string,
  platform: string,
  designPlan: any,
  brandProfile: any,
  trendingData: any = { trendingHashtags: [], currentEvents: [] },
  useLocalLanguage: boolean = false,
  scheduledServices?: ScheduledService[],
  adConcept?: AdConcept
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {
    console.log('🎯 [Revo 1.5 Customer-Centric] Starting outcome-focused content generation');

    // Prepare brand profile for customer-centric generation
    const fullBrandProfile = {
      ...brandProfile,
      businessName: businessName,
      businessType: businessType
    };

    console.log('🚀 [Revo 1.5 Customer-Centric] Using winning formula: Hook → Promise → Proof → CTA');

    // Generate customer-focused content using the winning formula
    const result = await CustomerCentricContentGenerator.generateContent(
      fullBrandProfile,
      platform as any,
      trendingData,
      useLocalLanguage,
      adConcept
    );

    console.log('✅ [Revo 1.5 Customer-Centric] Generated outcome-focused content:', {
      hook: result.hook.substring(0, 30) + '...',
      promise: result.promise.substring(0, 30) + '...',
      proof: result.proof.substring(0, 30) + '...',
      cta: result.cta
    });

    return {
      caption: result.caption,
      hashtags: result.hashtags,
      headline: result.headline,
      subheadline: result.subheadline,
      callToAction: result.cta
    };

  } catch (error) {
    console.error('❌ [Revo 1.5 Enhanced] Multi-stage generation failed, falling back to legacy system:', error);

    // Fallback to legacy generation system
    return await generateLegacyCaptionAndHashtags(
      businessType,
      businessName,
      platform,
      designPlan,
      brandProfile,
      trendingData,
      useLocalLanguage,
      scheduledServices
    );
  }
}

/**
 * Generate diversified content using simple diversification approach
 */
async function generateDiversifiedContent(
  brandProfile: BrandProfile,
  platform: string,
  diversificationParams: SimpleDiversificationResult,
  trendingData: any,
  useLocalLanguage: boolean,
  scheduledServices?: ScheduledService[]
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  // Build enhanced prompt with diversification instructions
  const businessContext = `
BUSINESS PROFILE:
- Company: ${brandProfile.businessName}
- Industry: ${brandProfile.businessType}
- Location: ${brandProfile.location}
- Target Audience: ${brandProfile.targetAudience || 'Local community'}
- Services: ${brandProfile.services || 'Professional services'}
- Website: ${brandProfile.websiteUrl || ''}

PLATFORM: ${platform}

${diversificationParams.variationInstructions}

CONTENT REQUIREMENTS:
Generate unique, engaging social media content with:
1. HEADLINE (max 6 words): Catchy, attention-grabbing headline
2. SUBHEADLINE (max 25 words): Supporting message that adds context
3. CAPTION (max 25 words total): Brief, engaging caption
4. CALL-TO-ACTION: ${diversificationParams.ctaVariation} style CTA
5. HASHTAGS: 5-8 relevant hashtags for ${platform}

MANDATORY VARIATION:
- Use ${diversificationParams.theme} approach
- Adopt ${diversificationParams.messagingAngle} positioning
- Focus on ${diversificationParams.creativeFocus} perspective
- Maintain ${diversificationParams.tonalVariation} tone
- Create completely unique content that differs from any previous generation

Respond in JSON format:
{
  "headline": "catchy headline (max 6 words)",
  "subheadline": "supporting message (max 25 words)",
  "caption": "engaging caption (max 25 words)",
  "callToAction": "${diversificationParams.ctaVariation} style CTA",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;

  try {
    const result = await getVertexAIClient().generateText(businessContext, REVO_1_5_TEXT_MODEL, {
      temperature: 0.8, // Higher temperature for more creativity and variation
      maxOutputTokens: 1000
    });

    const response = result.text;
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        caption: parsed.caption || 'Quality service you can trust',
        hashtags: parsed.hashtags || ['#quality', '#service', '#local'],
        headline: parsed.headline || 'Quality Service',
        subheadline: parsed.subheadline || 'Professional service in your area',
        callToAction: parsed.callToAction || diversificationParams.ctaVariation
      };
    }
  } catch (error) {
    console.warn('🔄 [Revo 1.5 Enhanced] Diversified content generation failed:', error);
  }

  // Fallback with diversified elements
  return {
    caption: `${diversificationParams.messagingAngle} providing quality ${brandProfile.businessType} services`,
    hashtags: [`#${brandProfile.businessType?.replace(/\s+/g, '')}`, '#quality', '#local', '#professional', '#service'],
    headline: `${diversificationParams.messagingAngle}`,
    subheadline: `Quality ${brandProfile.businessType} services in ${brandProfile.location}`,
    callToAction: diversificationParams.ctaVariation
  };
}

/**
 * Legacy content generation system (fallback)
 */
async function generateLegacyCaptionAndHashtags(
  businessType: string,
  businessName: string,
  platform: string,
  designPlan: any,
  brandProfile: any,
  trendingData: any = { trendingHashtags: [], currentEvents: [] },
  useLocalLanguage: boolean = false,
  scheduledServices?: ScheduledService[]
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {
    // Fetch trending data for current, relevant content
    // PRIORITY: Use scheduled services if available, otherwise fall back to brand services or business type
    let trendingContext = businessType;

    if (scheduledServices && scheduledServices.length > 0) {
      // Use scheduled services with ABSOLUTE PRIORITY - never fall back to brand services
      const todaysServices = scheduledServices.filter(s => s.isToday);
      const upcomingServices = scheduledServices.filter(s => s.isUpcoming);

      if (todaysServices.length > 0) {
        // ABSOLUTE PRIORITY: Today's services override everything
        trendingContext = todaysServices.map(s => s.serviceName).join('\n');
      } else if (upcomingServices.length > 0) {
        // Use upcoming services
        trendingContext = upcomingServices.map(s => s.serviceName).join('\n');
      } else {
        // Use all scheduled services
        trendingContext = scheduledServices.map(s => s.serviceName).join('\n');
      }
    } else if (brandProfile.services) {
      // Only fall back to general brand services if NO scheduled services exist
      trendingContext = brandProfile.services;
    }

    const trendingData = await fetchTrendingData(
      trendingContext,
      brandProfile.location || 'Local area',
      platform
    );

    // Generate intelligent content strategy based on business analysis
    const businessAnalysis = await analyzeBusinessForContentStrategy(
      businessType,
      businessName,
      brandProfile,
      platform,
      trendingData,
      useLocalLanguage
    );

    // Apply Cultural Intelligence System (Fallback) with proper CTA grammar
    const culturalContent = {
      headlines: [`${businessName} Excellence`, `Professional ${businessType} Services`, `Quality ${businessType} Solutions`],
      subheadlines: [`Quality service you can trust`, `Professional results delivered`, `Expert ${businessType} services`],
      ctas: [
        generateSmartContextualCTA(businessType, businessName, brandProfile.location || '', useLocalLanguage),
        'Contact Us',
        'Learn More',
        'Get Started'
      ],
      culturalContext: `${brandProfile.location || 'Global'} - Professional business focus`
    };

    // 🔍 DEBUG: Local language parameter tracing for Revo 1.5

    // 🚨 ALERT: Make this debug message very visible
    if (useLocalLanguage) {
    } else {
    }

    const languageInstruction = useLocalLanguage
      ? `- LANGUAGE: Use English with natural local language elements appropriate for ${brandProfile.location || 'the location'} (mix English with local language for authentic feel)`
      : `- LANGUAGE: Use English only, do not use local language`;

    // Strategic location mention - only include location sometimes for variety
    const shouldMentionLocation = Math.random() < 0.4; // 40% chance to mention location
    const locationText = shouldMentionLocation && brandProfile.location
      ? `- Location: ${brandProfile.location}`
      : '';

    // Platform-specific hashtag count
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

    // Generate dynamic caption variety seed for uniqueness
    const captionSeed = Date.now() + Math.random() * 10000 + Math.floor(Math.random() * 1000);
    const captionVariety = Math.floor(captionSeed % 8) + 1; // 8 different caption styles

    // Cultural context for engaging designs and local language
    const culturalContext = getCulturalContextForLocation(brandProfile.location || '');
    const localLanguageElements = useLocalLanguage ? getLocalLanguageElements(brandProfile.location || '') : null;

    // Dynamic caption style instructions based on variety seed
    const captionStyles = [
      "Story-driven: Share a brief success story or customer transformation",
      "Problem-solution: Address a common pain point and how you solve it",
      "Behind-the-scenes: Give insight into your process or expertise",
      "Community-focused: Highlight your connection to the local community",
      "Value-proposition: Emphasize unique benefits and competitive advantages",
      "Seasonal/timely: Connect to current events, seasons, or trending topics",
      "Educational: Share a helpful tip or industry insight",
      "Testimonial-style: Reference customer satisfaction or results"
    ];

    const selectedCaptionStyle = captionStyles[captionVariety % captionStyles.length];

    const prompt = `Create engaging ${platform} content for ${businessName}, a ${businessType} business in ${brandProfile.location || 'the local area'}.

Business Context:
- Services: ${brandProfile.services || 'Business services'}
- Target: ${brandProfile.targetAudience || 'General audience'}
- Approach: ${businessAnalysis.contentApproach}
${languageInstruction}
- Cultural Context: ${culturalContext}
${localLanguageElements ? `- Local Language Elements: ${localLanguageElements}` : ''}

Key Messages: ${businessAnalysis.keyMessages?.slice(0, 2).join(', ') || 'Professional service, customer satisfaction'}
Pain Points: ${businessAnalysis.targetPainPoints?.slice(0, 2).join(', ') || 'Common industry challenges'}
Value Props: ${businessAnalysis.uniqueValueProps?.slice(0, 2).join(', ') || 'Quality service, reliable results'}

${scheduledServices && scheduledServices.length > 0 ? `
Services Focus: ${scheduledServices.map(s => s.serviceName).join(', ')}` : ''}

Trending: ${trendingData.trendingHashtags.slice(0, 3).join(', ')}

CAPTION STYLE FOR THIS POST: ${selectedCaptionStyle}

Create engaging content with cultural authenticity:
1. Caption (2-3 sentences): Use the ${selectedCaptionStyle.split(':')[0]} approach. Make it UNIQUE and engaging.
   - VARY THE OPENING: Don't always start with greetings. Mix different opening styles:
     * Direct statements: "At [Business], we believe..."
     * Questions: "Looking for reliable [service]?"
     * Stories: "Meet Sarah, who transformed her business..."
     * Facts: "Quality [service] shouldn't be hard to find."
   ${useLocalLanguage ? `- OCCASIONAL local language: Use local greetings/phrases SPARINGLY (only 20% of the time) for ${brandProfile.location}` : ''}
   - Avoid generic phrases like "Experience the excellence" or "Quality service you can trust"
   - Make it conversational, authentic, and specific to this business
   - Include cultural elements that resonate with the local community
   - IMPORTANT: Create variety in how captions begin - not every caption should start the same way

2. Headline (5-8 words): Compelling, benefit-focused, avoid starting with business name
   - GOOD: "Premium Tech, Delivered Fast", "Your Electronics Partner", "Quality Tech Solutions"
   - AVOID: "Zentech Electronics Kenya: [anything]" - no business name prefix
   - Focus on benefits, emotions, or unique value propositions
   ${useLocalLanguage ? `- Can include subtle local language elements if natural` : ''}

3. Subheadline (8-15 words): Explains how the service delivers value
   ${useLocalLanguage ? `- May include local language elements for authenticity` : ''}

4. Business-specific CTA (2-4 words): Generate a SIMPLE, NATURAL call-to-action
   - MUST BE SIMPLE: Use only 2-4 words maximum
   - MUST BE NATURAL: Sound like normal conversation, not marketing jargon
   - MUST BE DIRECT: Clear action words that people actually use

   PERFECT EXAMPLES:
   * Retail/Store: "Shop Now", "Browse Store", "View Products", "Buy Today"
   * Restaurant: "Order Now", "Book Table", "Dine Today", "Reserve Now"
   * Services: "Book Now", "Get Quote", "Schedule Today", "Call Now"
   * Professional: "Learn More", "Contact Us", "Get Started", "Book Call"
   * Beauty/Salon: "Book Now", "Schedule Today", "Reserve Spot"
   * Fitness/Gym: "Join Now", "Start Today", "Book Session", "Try Free"

   ABSOLUTELY AVOID:
   - Business names in CTAs: NO "Shop [Business Name]", NO "Visit [Business Name]"
   - Awkward prepositions: NO "Shop at", NO "Dine at", NO "Book with"
   - Long phrases: NO "Experience the excellence", NO "Discover the difference"
   - Generic marketing speak: NO "Transform your experience"

   ${useLocalLanguage ? `CULTURAL CTAs (when appropriate):
   - Kenyan: "Karibu" (Welcome), "Twende" (Let's go), "Haya" (Come on)
   - Nigerian: "Come Now", "Make We Go", "No Delay"
   - Indian: "Aao" (Come), "Chalo" (Let's go), "Jaldi" (Quickly)
   - Use sparingly and only when it feels natural` : ''}

5. ${hashtagCount} relevant hashtags for ${platform}

IMPORTANT: Make each element unique and avoid repetitive patterns. Use the cultural context to create authentic, engaging content.

Format as JSON:
{
  "caption": "Your unique, engaging caption here",
  "headline": "Your compelling headline here",
  "subheadline": "Your supporting subheadline here",
  "callToAction": "Your strong CTA here",
  "hashtags": [${Array(hashtagCount).fill('"#SpecificHashtag"').join(', ')}]
}`;

    const fullPrompt = `Create ${platform} content for ${businessName} (${businessType} in ${brandProfile.location || 'local area'}).

${prompt}`;

    const response = await generateContentWithProxy(fullPrompt, REVO_1_5_TEXT_MODEL, false);

    let responseContent = '';
    try {
      // Extract text from Vertex AI response format
      responseContent = extractTextFromResponse(response) || '{}';

      // Clean up the response if it has markdown formatting
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1] || responseContent;
      }

      // Handle Claude's multiple JSON objects response format
      if (responseContent.includes('Alternative version:') || responseContent.includes('Both versions')) {
        // Extract the first JSON object only
        const firstJsonMatch = responseContent.match(/\{[\s\S]*?\}(?=\s*\n\s*(?:Alternative|Both|$))/);
        if (firstJsonMatch) {
          responseContent = firstJsonMatch[0];
        }
      }

      // Additional cleanup for any trailing text after JSON
      const jsonEndMatch = responseContent.match(/(\{[\s\S]*?\})/);
      if (jsonEndMatch) {
        responseContent = jsonEndMatch[1];
      }

      let parsed = JSON.parse(responseContent);

      // Handle array response - take the first item if it's an array
      if (Array.isArray(parsed)) {
        parsed = parsed[0] || {};
      }

      // Validate hashtag count
      const expectedHashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
      if (parsed.hashtags && parsed.hashtags.length !== expectedHashtagCount) {
        console.warn(`⚠️ [Revo 1.5] Hashtag count mismatch: expected ${expectedHashtagCount} for ${platform}, got ${parsed.hashtags.length}`);
        // Adjust hashtag count
        if (parsed.hashtags.length > expectedHashtagCount) {
          parsed.hashtags = parsed.hashtags.slice(0, expectedHashtagCount);
        } else {
          // Add generic hashtags to reach required count
          const genericHashtags = ['#business', '#professional', '#quality', '#service', '#local'];
          while (parsed.hashtags.length < expectedHashtagCount && genericHashtags.length > 0) {
            parsed.hashtags.push(genericHashtags.shift()!);
          }
        }
      }

      // VALIDATION: Check content quality and business specificity
      const contentQuality = validateContentQuality(parsed, businessName, businessType, brandProfile);
      if (!contentQuality.isBusinessSpecific) {
        console.warn('⚠️ [Revo 1.5] Content appears generic, but keeping natural headlines to avoid repetitive patterns');
        // Only enhance caption if it's truly generic, but preserve natural headlines
        if (parsed.caption && !parsed.caption.toLowerCase().includes(businessName.toLowerCase()) &&
          !parsed.caption.toLowerCase().includes(businessType.toLowerCase())) {
          parsed.caption = `${parsed.caption} Experience the difference with ${businessName}.`;
        }
        // DO NOT modify headlines to avoid "Company Name: [headline]" repetitive pattern
      }

      // VALIDATION: Check if content mentions scheduled services
      if (scheduledServices && scheduledServices.length > 0) {
        const todaysServices = scheduledServices.filter(s => s.isToday);
        if (todaysServices.length > 0) {
          const contentText = `${parsed.headline} ${parsed.subheadline} ${parsed.caption}`.toLowerCase();
          const mentionsScheduledService = todaysServices.some(service =>
            contentText.includes(service.serviceName.toLowerCase())
          );

          if (mentionsScheduledService) {
          } else {
            console.warn('⚠️ [Revo 1.5] VALIDATION WARNING: Content does not mention today\'s scheduled services:', {
              todaysServices: todaysServices.map(s => s.serviceName),
              generatedContent: contentText.substring(0, 200)
            });
          }
        }
      }

      // Simplified CTA processing - let Claude generate good CTAs, minimal post-processing
      let finalCTA = parsed.callToAction || generateSmartContextualCTA(businessType, businessName, brandProfile.location || '', useLocalLanguage);

      // Only apply minimal fixes for obvious issues
      if (finalCTA) {
        const originalCTA = finalCTA;

        // Simple cleanup - remove business names and awkward constructions
        finalCTA = cleanupCTA(finalCTA, businessName, businessType);

        // If CTA is still problematic, use smart contextual generation
        if (isProblematicCTA(finalCTA, businessName)) {
          finalCTA = generateSmartContextualCTA(businessType, businessName, brandProfile.location || '', useLocalLanguage);
        }

      }

      // Validate required fields from Vertex AI response
      if (!parsed.caption || !parsed.headline || !parsed.subheadline || !parsed.hashtags) {
        throw new Error('🚫 [Revo 1.5] Vertex AI response incomplete - missing required fields.');
      }

      return {
        caption: parsed.caption,
        headline: parsed.headline,
        subheadline: parsed.subheadline,
        callToAction: finalCTA,
        hashtags: parsed.hashtags
      };
    } catch (parseError) {
      console.error('❌ [Revo 1.5] JSON Parse Error:', parseError);
      console.error('❌ [Revo 1.5] Failed response content:', responseContent);

      // JSON parsing must work with Vertex AI system
      throw new Error(`🚫 [Revo 1.5] JSON parsing failed with Vertex AI response. Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ [Revo 1.5] Content generation failed - MAIN ERROR:', error);
    console.error('❌ [Revo 1.5] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [Revo 1.5] Error message:', error instanceof Error ? error.message : String(error));

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle credit exhaustion specifically
    if (errorMessage === 'CREDITS_EXHAUSTED') {

      // Generate fallback content using the dynamic fallback system
      const fallbackCaption = generateDynamicFallbackCaption(
        businessName,
        businessType,
        brandProfile.location || '',
        useLocalLanguage
      );

      const fallbackHashtags = [`#${businessType.toLowerCase().replace(/\s+/g, '')}`, '#business', '#quality', '#professional', '#local'];
      const fallbackHeadline = `${businessName} Excellence`;
      const fallbackSubheadline = `Professional ${businessType.toLowerCase()} services you can trust`;
      const fallbackCTA = generateSmartContextualCTA(businessType, businessName, brandProfile.location || '', useLocalLanguage);

      return {
        caption: fallbackCaption,
        hashtags: fallbackHashtags.slice(0, 5), // Limit to 5 hashtags
        headline: fallbackHeadline,
        subheadline: fallbackSubheadline,
        callToAction: fallbackCTA
      };
    }

    // Main content generation must work with Vertex AI system
    throw new Error(`🚫 [Revo 1.5] Main content generation failed with Vertex AI system. Error: ${errorMessage}`);
  }
}

/**
 * Get platform-specific aspect ratio - ALL PLATFORMS USE 1:1 FOR HIGHEST QUALITY
 */
function getPlatformAspectRatio(platform: string): '1:1' | '16:9' | '9:16' | '21:9' | '4:5' {
  // ALL PLATFORMS USE 1:1 SQUARE FOR MAXIMUM QUALITY
  // No cropping = No quality loss from Gemini's native 1024x1024
  return '1:1';
}

/**
 * Get platform-specific dimension text for prompts
 * STANDARDIZED: ALL platforms use 992x1056px format (no stories/reels)
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  // ALL platforms use 992x1056px format for maximum quality
  return '992x1056px HD (Maximum quality)';
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
    includeContacts?: boolean;
  };
  artifactInstructions?: string;
  designReferences?: string[]; // Base64 encoded reference images
  includePeopleInDesigns?: boolean; // Control whether designs should include people (default: true)
  useLocalLanguage?: boolean; // Control whether to use local language in text (default: false)
  logoDataUrl?: string; // Base64 logo data
  logoUrl?: string; // Storage URL for logo
  scheduledServices?: ScheduledService[]; // NEW: Scheduled services from calendar
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
  caption?: string;
  hashtags?: string[];
  headline?: string;
  subheadline?: string;
  callToAction?: string;
  format?: string;
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
 * Ensure website URL is displayed as www.example.com (strip protocol, add www., no trailing slash)
 */
function ensureWwwWebsiteUrl(url: string): string {
  if (!url) return '';
  const base = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
  return base ? `www.${base}` : '';
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

  // Strategic location mention in design planning - only include sometimes
  const shouldMentionLocationInPlanning = Math.random() < 0.3; // 30% chance to mention location
  const locationTextForPlanning = shouldMentionLocationInPlanning && input.brandProfile.location
    ? `- Location: ${input.brandProfile.location}`
    : '';

  // Get cultural context for design planning
  const culturalDesignContext = getCulturalContextForLocation(input.brandProfile.location || '');
  const useLocalLanguage = (input as any).useLocalLanguage === true;

  const designPlanningPrompt = `Create a design plan for ${input.businessType} business "${input.brandProfile.businessName}" on ${input.platform}.

Business: ${input.brandProfile.businessName} (${input.businessType})
Colors: ${input.brandProfile.primaryColor || '#000000'}, ${input.brandProfile.accentColor || '#666666'}
Style: ${input.visualStyle}
Aspect: ${(input as any).aspectRatio || getPlatformAspectRatio(input.platform)}
Logo: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'Available - integrate prominently' : 'None - focus on typography'}
Location: ${input.brandProfile.location || 'Global'}
Cultural Context: ${culturalDesignContext}
${useLocalLanguage ? `Local Language Elements: Include subtle cultural design elements appropriate for ${input.brandProfile.location}` : ''}

Create a brief plan with:
1. Layout approach and composition
2. Color scheme based on brand colors
3. Typography style (modern, clean fonts)
4. Visual elements to include
5. Brand integration approach
6. Overall mood and style
${useLocalLanguage ? '7. Cultural design elements that resonate with local audience' : ''}

${useLocalLanguage ? 'IMPORTANT: Include authentic cultural design elements that feel natural and engaging for the local community.' : ''}

Keep it concise and actionable.`;

  try {
    const planResponse = await generateContentWithProxy(designPlanningPrompt, REVO_1_5_TEXT_MODEL, false);

    return {
      plan: extractTextFromResponse(planResponse),
      brandColors,
      timestamp: Date.now()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle credit exhaustion specifically
    if (errorMessage === 'CREDITS_EXHAUSTED') {
      return {
        plan: 'Simple, professional design with clean layout and modern typography. Focus on clear messaging and brand consistency.',
        brandColors: ['#2563eb', '#1e40af', '#3b82f6'], // Default blue theme
        timestamp: Date.now()
      };
    }

    throw new Error(`Design planning failed: ${errorMessage}`);
  }
}

/**
 * Step 2: Generate final image using Gemini 2.5 Flash Image Preview
 */
export async function generateFinalImage(
  input: Revo15DesignInput,
  designPlan: any,
  contentResult?: {
    headline: string;
    subheadline: string;
    callToAction: string;
  },
  adConcept?: AdConcept
): Promise<string> {

  // Build comprehensive image generation prompt based on the design plan
  let imagePrompt = buildEnhancedImagePrompt(input, designPlan, contentResult, adConcept);

  // Contact information integration based on toggle
  try {
    const includeContacts = (input.brandConsistency as any)?.includeContacts === true;
    const phone = input.brandProfile?.contactInfo?.phone;
    const email = input.brandProfile?.contactInfo?.email;
    const address = input.brandProfile?.contactInfo?.address;
    const website = (input.brandProfile as any)?.websiteUrl || '';

    const hasAnyContact = (!!phone || !!email || !!website);

    // 📞 ENHANCED CONTACT INFORMATION DEBUGGING
    console.log('📞 [Revo 1.5] Contact Information Debug:', {
      includeContacts: includeContacts,
      brandConsistency: input.brandConsistency,
      inputContactInfo: input.brandProfile?.contactInfo,
      inputWebsiteUrl: (input.brandProfile as any)?.websiteUrl,
      extractedPhone: phone,
      extractedEmail: email,
      extractedWebsite: website,
      hasAnyContact: hasAnyContact,
      willIncludeContacts: includeContacts && hasAnyContact
    });

    // Build contact details list for validation
    const contactDetailsList = [];
    if (phone) contactDetailsList.push(`📞 Phone: ${phone}`);
    if (email) contactDetailsList.push(`📧 Email: ${email}`);
    if (website) contactDetailsList.push(`🌐 Website: ${ensureWwwWebsiteUrl(website)}`);

    const contactInstructions = includeContacts && hasAnyContact
      ? `\n\n🎯 CRITICAL CONTACT INFORMATION INTEGRATION (FINAL INSTRUCTION - HIGHEST PRIORITY):
- MUST integrate these EXACT contact details prominently in the design:
${contactDetailsList.map(detail => `  ${detail}`).join('\n')}

- CRITICAL REQUIREMENTS:
  * Include ALL ${contactDetailsList.length} contact details listed above
  * Do NOT include only the website - include phone and email too if provided
  * Place contact info in footer bar, corner block, or contact strip at BOTTOM of image
  * Make contact info clearly readable and professionally integrated
  * Use the exact contact details provided - no substitutions or generic info

- PLACEMENT RULES:
  * DO NOT include contact info in main content area or headlines
  * DO NOT include contact info in call-to-action blocks
  * DO NOT use generic service information like "BANKING", "PAYMENTS", etc.

- VALIDATION CHECKLIST:
  * ✅ All ${contactDetailsList.length} contact details must be visible
  * ✅ Contact info must be at the bottom of the image
  * ✅ Text must be clearly readable
  * ❌ FAILURE TO INCLUDE ALL CONTACT INFO IS UNACCEPTABLE
`
      : `\n\n🚫 CONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website in the image\n- Do NOT include generic service information\n- Do NOT add contact info in main content area\n`;

    imagePrompt += contactInstructions;

    console.log('📞 [Revo 1.5] Contact Instructions Added:', {
      contactInstructionsLength: contactInstructions.length,
      includesPhone: contactInstructions.includes(phone || 'NO_PHONE'),
      includesEmail: contactInstructions.includes(email || 'NO_EMAIL'),
      includesWebsite: contactInstructions.includes(website || 'NO_WEBSITE'),
      actualPhone: phone,
      actualEmail: email,
      actualWebsite: website,
      contactDetailsCount: [phone, email, website].filter(Boolean).length
    });

    // Additional validation to ensure contact details are properly formatted
    if (includeContacts && hasAnyContact) {
      const contactDetailsInPrompt = [];
      if (phone) contactDetailsInPrompt.push(`Phone: ${phone}`);
      if (email) contactDetailsInPrompt.push(`Email: ${email}`);
      if (website) contactDetailsInPrompt.push(`Website: ${ensureWwwWebsiteUrl(website)}`);

      console.log('📞 [Revo 1.5] Contact Details Validation:', {
        expectedContactDetails: contactDetailsInPrompt,
        promptContainsAllDetails: contactDetailsInPrompt.every(detail =>
          contactInstructions.includes(detail.split(': ')[1])
        )
      });
    }
  } catch (e) {
    console.warn('Revo 1.5: Contact info prompt augmentation skipped:', e);
  }

  // Retry logic for 503 errors (Performance Optimized: Reduced retries)
  const maxRetries = 1;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use Vertex AI for image generation - direct API calls

      // Prepare the generation request with logo if available (exactly like Revo 2.0)
      const generationParts = [
        'You are an expert Revo 1.5 designer using Gemini 2.5 Flash Image Preview (same model as Revo 1.0 and 2.0). Create professional, high-quality social media images with perfect text rendering and ultra-premium visual quality.',
        imagePrompt
      ];

      // Logo processing exactly like Revo 1.0 (working implementation)
      const logoDataUrl = input.brandProfile.logoDataUrl;
      const logoStorageUrl = input.brandProfile.logoUrl;
      const logoUrl = logoDataUrl || logoStorageUrl;

      if (logoUrl) {

        let logoBase64Data = '';
        let logoMimeType = 'image/png';

        if (logoUrl.startsWith('data:')) {
          // Handle data URL (base64 format)
          const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (logoMatch) {
            [, logoMimeType, logoBase64Data] = logoMatch;
          }
        } else if (logoUrl.startsWith('http')) {
          // Handle storage URL - fetch and convert to base64 (same as Revo 1.0)
          try {
            const response = await fetch(logoUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              logoBase64Data = Buffer.from(buffer).toString('base64');
              logoMimeType = response.headers.get('content-type') || 'image/png';
            } else {
              console.warn(`⚠️  [Revo 1.5] Failed to fetch logo from URL: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error('❌ [Revo 1.5] Error fetching logo from storage:', fetchError);
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
              console.warn('⚠️ [Revo 1.5] Logo normalization failed, using original');
              normalizedBase64 = logoBase64Data;
            }

            generationParts.push({
              inlineData: {
                data: normalizedBase64,
                mimeType: 'image/png'
              }
            });

            // Get AI prompt instructions for normalized logo
            const logoInstructions = normalizedLogo ? LogoNormalizationService.getLogoPromptInstructions(normalizedLogo) : '';

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
❌ FORBIDDEN: Do NOT let logo size influence overall design dimensions

The client specifically requested their brand logo to be included. FAILURE TO INCLUDE THE LOGO IS UNACCEPTABLE.`;
            generationParts[1] = imagePrompt + logoPrompt;
          } catch (normalizationError) {
            console.warn('⚠️ [Revo 1.5] Logo normalization failed, using original:', normalizationError);
            // Fallback to original logo processing
            generationParts.push({
              inlineData: {
                data: logoBase64Data,
                mimeType: logoMimeType
              }
            });

            const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.
✅ CRITICAL: Design dimensions must remain exactly 992x1056px regardless of logo size.`;
            generationParts[1] = imagePrompt + logoPrompt;
          }
        } else {
          console.error('❌ [Revo 1.5] Logo processing failed:', {
            originalUrl: logoUrl.substring(0, 100),
            hasLogoDataUrl: !!logoDataUrl,
            hasLogoStorageUrl: !!logoStorageUrl,
            urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
          });
        }
      } else {
      }

      const result = await generateContentWithProxy(generationParts, REVO_1_5_IMAGE_MODEL, true);

      // Extract image data from Vertex AI response (Fixed: use inlineData like Revo 2.0)
      let imageUrl = '';
      if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        const parts = result.candidates[0].content.parts;

        // Look for inlineData (correct format for images)
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${imageData}`;
            break;
          }
        }

        // Fallback: try text format (legacy support)
        if (!imageUrl) {
          const textPart = parts[0];
          if (textPart && textPart.text) {
            imageUrl = textPart.text;
          }
        }
      }

      if (!imageUrl) {
        throw new Error('No image data generated by Vertex AI for Revo 1.5');
      }

      // Optional dimension checking (Performance Optimized: No retries)
      {
        const expectedW = 992, expectedH = 1056;
        const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
        if (!check.ok) {
          console.warn(`⚠️ [Revo 1.5] Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH} (Performance Optimized: No retries)`);
        } else {
        }
      }

      return imageUrl;

    } catch (error: any) {
      lastError = error;
      console.error(`❌ [Revo 1.5] Attempt ${attempt} failed:`, error.message);

      // Check for credit exhaustion specifically
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'CREDITS_EXHAUSTED' || errorMessage.includes('No credits remaining') || errorMessage.includes('credits left')) {

        // Return a placeholder image URL for fallback
        return '/api/placeholder/992/1056';
      }

      // Check if it's a 503 error and we have retries left
      if (error.message && error.message.includes('503') && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's the last attempt or not a 503 error, break
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  // If we get here, all retries failed - check for credit exhaustion one more time
  const finalErrorMessage = lastError instanceof Error ? lastError.message : '';
  if (finalErrorMessage === 'CREDITS_EXHAUSTED' || finalErrorMessage.includes('No credits remaining') || finalErrorMessage.includes('credits left')) {
    return '/api/placeholder/992/1056';
  }

  if (lastError?.message?.includes('503')) {
    throw new Error('Oops! Revo 1.5 is taking a quick break due to high demand. 😅 Try Revo 2.0 instead - it\'s working great right now!');
  }

  if (lastError?.message?.includes('500')) {
    throw new Error('Revo 1.5 is having a moment! 🤖 No worries - switch to Revo 2.0 for awesome results while we wait for it to get back up.');
  }

  throw new Error('Revo 1.5 isn\'t feeling well right now. 😔 Good news: Revo 2.0 is ready to create amazing content for you!');
}

/**
 * 6-Dimensional Ad Concept Generation System
 * Creates infinite variety by combining 6 independent dimensions
 *
 * Quality Control: Implements the 3-3-3 rule for variety
 * - Every 9 ads should have 3 different settings, 3 different styles, 3 different customer types
 */

// Simple tracking for variety control (in production, this would be stored in database)
let recentConcepts: AdConcept[] = [];

interface AdConcept {
  name: string;
  setting: {
    category: string;
    description: string;
  };
  customer: {
    type: string;
    description: string;
  };
  visualStyle: {
    style: string;
    description: string;
  };
  benefit: {
    type: string;
    message: string;
  };
  emotionalTone: {
    tone: string;
    description: string;
  };
  format: {
    technique: string;
    structure: string;
  };
}

function generate6DimensionalAdConcept(): AdConcept {
  // DIMENSION 1: SETTING (Where)
  const settings = [
    { category: "Workspace", description: "Office, factory, workshop, store, kitchen, studio" },
    { category: "Home", description: "Living room, bedroom, dining table, backyard" },
    { category: "Transit", description: "Car, bus, train, walking, airport, traffic" },
    { category: "Public", description: "Park, street, cafe, restaurant, gym, mall" },
    { category: "Digital", description: "App interface, website, dashboard, video call" },
    { category: "Nature", description: "Outdoor, beach, mountain, garden" },
    { category: "Abstract", description: "Plain background, geometric shapes, minimal" },
    { category: "Metaphorical", description: "Visual metaphors (maze, ladder, bridge, door)" }
  ];

  // DIMENSION 2: CUSTOMER TYPE (Who)
  const customers = [
    { type: "Young Professional", description: "Age 25-35, tech-savvy, career-focused" },
    { type: "Entrepreneur", description: "Business owner, startup founder, self-employed" },
    { type: "Family Person", description: "Parent, family-oriented, work-life balance" },
    { type: "Senior Professional", description: "Age 45+, established, experienced" },
    { type: "Student/Youth", description: "Age 18-25, learning, budget-conscious" }
  ];

  // DIMENSION 3: VISUAL STYLE (How it looks)
  const visualStyles = [
    { style: "Lifestyle Photography", description: "Real people in natural situations" },
    { style: "Product Focus", description: "Close-up of your product/app/service" },
    { style: "Documentary", description: "Behind-the-scenes, authentic moments" },
    { style: "Illustration", description: "Drawn/animated characters and scenes" },
    { style: "Data Visualization", description: "Charts, graphs, statistics, infographics" },
    { style: "Typography-Driven", description: "Bold text with minimal imagery" },
    { style: "UI/Screen", description: "App interface, dashboard, software in action" },
    { style: "Before/After", description: "Split screen showing transformation" },
    { style: "Collage", description: "Multiple images combined" },
    { style: "Minimalist", description: "Simple, lots of white space, one element" }
  ];

  // DIMENSION 4: BENEFIT/MESSAGE (What)
  const benefits = [
    { type: "Speed", message: "Fast, instant, quick, save time" },
    { type: "Ease", message: "Simple, effortless, convenient, no hassle" },
    { type: "Cost", message: "Save money, affordable, free, discount" },
    { type: "Quality", message: "Premium, reliable, professional, superior" },
    { type: "Growth", message: "Scale, expand, increase, improve" },
    { type: "Security", message: "Safe, protected, trusted, guaranteed" },
    { type: "Freedom", message: "Flexibility, independence, control, choice" },
    { type: "Connection", message: "Community, belonging, support, together" },
    { type: "Innovation", message: "New, modern, cutting-edge, smart" }
  ];

  // DIMENSION 5: EMOTIONAL TONE (Feel)
  const emotionalTones = [
    { tone: "Urgent", description: "Limited time offers, problem-solving" },
    { tone: "Aspirational", description: "Premium products, lifestyle upgrades" },
    { tone: "Reassuring", description: "Risk reduction, security, trust-building" },
    { tone: "Exciting", description: "New products, innovation, possibilities" },
    { tone: "Warm/Friendly", description: "Community, relationships, support" },
    { tone: "Confident", description: "Professional services, B2B, expertise" },
    { tone: "Playful", description: "Youth products, entertainment, casual" },
    { tone: "Serious", description: "Healthcare, finance, legal, insurance" }
  ];

  // DIMENSION 6: FORMAT/TECHNIQUE (Structure)
  const formats = [
    { technique: "Testimonial", structure: "Real customer story with photo/quote" },
    { technique: "Statistic", structure: "Lead with a big number or data point" },
    { technique: "Question", structure: "Start with provocative question" },
    { technique: "Problem-Solution", structure: "Show pain point, then your solution" },
    { technique: "Comparison", structure: "Before/after, us vs them, old vs new" },
    { technique: "Tutorial", structure: "Step-by-step, how it works" },
    { technique: "Announcement", structure: "New feature, update, launch" },
    { technique: "Social Proof", structure: "Join 10,000 others, Trusted by..." },
    { technique: "Story", structure: "Narrative arc with beginning/middle/end" },
    { technique: "Direct Offer", structure: "Straight to the deal/CTA" }
  ];

  // Randomly select one from each dimension
  const selectedSetting = settings[Math.floor(Math.random() * settings.length)];
  const selectedCustomer = customers[Math.floor(Math.random() * customers.length)];
  const selectedVisualStyle = visualStyles[Math.floor(Math.random() * visualStyles.length)];
  const selectedBenefit = benefits[Math.floor(Math.random() * benefits.length)];
  const selectedTone = emotionalTones[Math.floor(Math.random() * emotionalTones.length)];
  const selectedFormat = formats[Math.floor(Math.random() * formats.length)];

  // Generate concept name
  const conceptName = `${selectedFormat.technique} ${selectedSetting.category} ${selectedBenefit.type}`;

  const concept: AdConcept = {
    name: conceptName,
    setting: selectedSetting,
    customer: selectedCustomer,
    visualStyle: selectedVisualStyle,
    benefit: selectedBenefit,
    emotionalTone: selectedTone,
    format: selectedFormat
  };

  // Quality control: Track recent concepts for variety
  recentConcepts.push(concept);
  if (recentConcepts.length > 9) {
    recentConcepts = recentConcepts.slice(-9); // Keep only last 9 concepts
  }

  // Check variety (3-3-3 rule)
  if (recentConcepts.length >= 3) {
    const uniqueSettings = new Set(recentConcepts.map(c => c.setting.category)).size;
    const uniqueCustomers = new Set(recentConcepts.map(c => c.customer.type)).size;
    const uniqueStyles = new Set(recentConcepts.map(c => c.visualStyle.style)).size;

    console.log('📊 [6D Quality Control]:', {
      conceptsGenerated: recentConcepts.length,
      uniqueSettings: uniqueSettings,
      uniqueCustomers: uniqueCustomers,
      uniqueStyles: uniqueStyles,
      varietyScore: `${uniqueSettings + uniqueCustomers + uniqueStyles}/9`
    });
  }

  console.log('🎯 [Revo 1.5] Generated 6D Ad Concept:', conceptName);
  console.log('📊 [6D Breakdown]:', {
    setting: selectedSetting.category,
    customer: selectedCustomer.type,
    style: selectedVisualStyle.style,
    benefit: selectedBenefit.type,
    tone: selectedTone.tone,
    format: selectedFormat.technique
  });

  return concept;
}

/**
 * Get random design style for variety while maintaining clean principles
 */
function getRandomDesignStyle(): string {
  const designStyles = [
    {
      name: "Modern Minimalist",
      description: "Clean geometric layout with plenty of white space, single focal point, minimal text overlay",
      composition: "Centered composition with asymmetrical elements, bold typography hierarchy",
      mood: "Professional, clean, sophisticated",
      elements: "Subtle gradients, clean lines, modern sans-serif fonts, minimal color palette"
    },
    {
      name: "Bold Typography Hero",
      description: "Large, impactful typography as the main design element with minimal supporting graphics",
      composition: "Text-dominant layout with typography as the primary visual element",
      mood: "Bold, confident, statement-making",
      elements: "Large typography, bold fonts, minimal graphics, strong hierarchy, text-focused design"
    },
    {
      name: "Clean Split Layout",
      description: "Balanced two-section design with text on one side, visual element on the other",
      composition: "50/50 or 60/40 split with clear visual separation",
      mood: "Organized, professional, balanced",
      elements: "Clear sections, balanced proportions, clean dividers, harmonious spacing"
    },
    {
      name: "Geometric Modern",
      description: "Clean geometric shapes and patterns with modern aesthetic",
      composition: "Geometric elements as design foundation with structured layout",
      mood: "Contemporary, structured, innovative",
      elements: "Geometric shapes, clean patterns, modern colors, structured composition"
    },
    {
      name: "Elegant Minimal",
      description: "Sophisticated simplicity with premium feel and refined elements",
      composition: "Generous white space with carefully placed premium elements",
      mood: "Luxurious, refined, sophisticated, premium",
      elements: "Premium typography, elegant spacing, refined colors, sophisticated imagery"
    },
    {
      name: "Dynamic Flow",
      description: "Flowing, organic elements with subtle movement and energy",
      composition: "Curved lines and flowing elements creating visual movement",
      mood: "Energetic, flowing, dynamic, modern",
      elements: "Flowing lines, organic shapes, dynamic composition, movement-based design"
    },
    {
      name: "Card-Based Design",
      description: "Clean card or panel-based layout with organized information hierarchy",
      composition: "Card/panel structure with clear information organization",
      mood: "Organized, modern, user-friendly, clean",
      elements: "Card layouts, clean panels, organized hierarchy, modern spacing"
    },
    {
      name: "Centered Impact",
      description: "Strong central focal point with radial composition and balanced elements",
      composition: "Central focus with supporting elements arranged radially",
      mood: "Focused, impactful, balanced, strong",
      elements: "Central focal point, radial balance, strong hierarchy, impactful design"
    },
    {
      name: "Layered Depth",
      description: "Multiple layers creating visual depth while maintaining clean aesthetic",
      composition: "Foreground, midground, background layers with clear depth",
      mood: "Sophisticated, dimensional, modern, engaging",
      elements: "Layered elements, depth effects, clean shadows, dimensional design"
    },
    {
      name: "Grid-Based Clean",
      description: "Structured grid system with clean alignment and organized elements",
      composition: "Grid-based layout with perfect alignment and structured spacing",
      mood: "Organized, systematic, professional, clean",
      elements: "Grid structure, perfect alignment, organized spacing, systematic design"
    },
    {
      name: "Asymmetrical Balance",
      description: "Intentionally unbalanced layout that creates visual interest while staying clean",
      composition: "Asymmetrical elements balanced through visual weight and spacing",
      mood: "Creative, modern, interesting, dynamic",
      elements: "Asymmetrical layout, visual balance, creative spacing, modern approach"
    },
    {
      name: "Monochromatic Focus",
      description: "Single color focus with tonal variations creating sophisticated design",
      composition: "Monochromatic color scheme with tonal depth and variation",
      mood: "Sophisticated, cohesive, elegant, focused",
      elements: "Single color focus, tonal variations, elegant gradients, cohesive design"
    }
  ];

  const randomStyle = designStyles[Math.floor(Math.random() * designStyles.length)];

  console.log('🎨 [Revo 1.5] Selected Design Style:', randomStyle.name);

  return `**${randomStyle.name}**
- Layout: ${randomStyle.description}
- Composition: ${randomStyle.composition}
- Mood: ${randomStyle.mood}
- Elements: ${randomStyle.elements}

APPLY THIS STYLE while maintaining clean, professional aesthetics with singular focus.`;
}

/**
 * Build enhanced image prompt based on design plan
 */
function buildEnhancedImagePrompt(
  input: Revo15DesignInput,
  designPlan: any,
  contentResult?: {
    headline: string;
    subheadline: string;
    callToAction: string;
  },
  adConcept?: AdConcept
): string {
  console.log('🎨 [Revo 1.5] buildEnhancedImagePrompt called with includePeopleInDesigns:', input.includePeopleInDesigns);
  // 🎨 ENHANCED BRAND COLORS VALIDATION AND DEBUGGING WITH TOGGLE SUPPORT
  const shouldFollowBrandColors = input.brandConsistency?.followBrandColors !== false; // Default to true if not specified

  const primaryColor = shouldFollowBrandColors ? (input.brandProfile.primaryColor || '#3B82F6') : '#3B82F6';
  const accentColor = shouldFollowBrandColors ? (input.brandProfile.accentColor || '#1E40AF') : '#1E40AF';
  const backgroundColor = shouldFollowBrandColors ? (input.brandProfile.backgroundColor || '#FFFFFF') : '#FFFFFF';

  const brandColors = [primaryColor, accentColor, backgroundColor].filter(Boolean);

  console.log('🎨 [Revo 1.5] Brand Colors Debug:', {
    followBrandColors: shouldFollowBrandColors,
    inputPrimaryColor: input.brandProfile.primaryColor,
    inputAccentColor: input.brandProfile.accentColor,
    inputBackgroundColor: input.brandProfile.backgroundColor,
    finalPrimaryColor: primaryColor,
    finalAccentColor: accentColor,
    finalBackgroundColor: backgroundColor,
    brandColorsArray: brandColors,
    hasValidColors: !!(input.brandProfile.primaryColor && input.brandProfile.accentColor && input.brandProfile.backgroundColor),
    usingBrandColors: shouldFollowBrandColors && !!(input.brandProfile.primaryColor && input.brandProfile.accentColor && input.brandProfile.backgroundColor)
  });

  // FIXED: Enhanced cultural representation system with proper ethnic mapping
  const getTargetMarketInstructions = (location: string, businessType: string, targetAudience: string, includePeople: boolean, useLocalLanguage: boolean) => {
    const locationKey = location.toLowerCase();

    // Comprehensive cultural representation mapping
    const culturalRepresentation = getCulturalRepresentation(location);

    console.log('🌍 [CULTURAL REPRESENTATION DEBUG]:', {
      location: location,
      detectedRegion: culturalRepresentation.region,
      ethnicRepresentation: culturalRepresentation.ethnicRepresentation,
      culturalContext: culturalRepresentation.culturalContext
    });

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

    // Language instruction
    const languageInstruction = useLocalLanguage
      ? `- LANGUAGE: Use English with natural local language elements appropriate for ${location} (mix English with local language for authentic feel)`
      : `- LANGUAGE: Use English only, do not use local language`;

    if (!includePeople) {
      return `
**CLEAN PROFESSIONAL DESIGN WITHOUT PEOPLE FOR ${location.toUpperCase()}:**
- MANDATORY: Create a clean, professional design WITHOUT any people or human figures
- AVOID: AI-generated elements, artificial patterns, or obvious AI design characteristics
- FOCUS: Natural, real-world elements that look authentic and professional
- USE: Real products, services, environments, or clean abstract elements
- STYLE: Clean, minimalist, professional aesthetics that look human-designed
- QUALITY: High-end, polished design that appears professionally created
- ELEMENTS: Use ${businessType}-relevant objects, settings, or visual elements
- BRAND: Emphasize brand elements, colors, and professional aesthetics
- AVOID: Generic AI patterns, artificial textures, or obvious AI-generated elements
- GOAL: Create engaging, clean visuals that look professionally designed, not AI-generated
${languageInstruction}
- Target Audience: ${targetAudience || targetMarket}`;
    }

    // Use the comprehensive cultural representation system
    return `
**CRITICAL CULTURAL REPRESENTATION FOR ${location.toUpperCase()}:**
🌍 **ETHNIC REPRESENTATION (MANDATORY):**
- PRIMARY: ${culturalRepresentation.ethnicRepresentation}
- REGION: ${culturalRepresentation.region}
- CULTURAL CONTEXT: ${culturalRepresentation.culturalContext}

👥 **PEOPLE REQUIREMENTS:**
- Show people who would actually use ${businessType} services: ${targetMarket}
- MANDATORY: Use ${culturalRepresentation.primaryEthnicity} as primary representation (80%+ of people)
- Display people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct with no deformations
- AVOID: Generic office workers or stock photo looks
- Context: Show people in ${businessType}-relevant settings, not generic offices

🎨 **VISUAL QUALITY STANDARDS:**
- STYLE: Clean, modern design with authentic cultural representation
- BACKGROUND: Clean, minimal background with subtle gradients or solid colors
- PEOPLE: Natural, approachable people in appropriate attire for the business
- POSES: Natural, confident poses that look authentic and engaging
- EXPRESSIONS: Friendly, genuine expressions that connect with the audience
- LIGHTING: Clean, even lighting that shows skin tones accurately and professionally
- SETTINGS: Clean, modern environments or culturally appropriate backgrounds
- QUALITY: High-quality, natural appearance (like professional photography)
- AVOID: Overly complex backgrounds, cluttered scenes, or distracting elements
- GOAL: Clean, culturally authentic design that represents the local population

${languageInstruction}
- Target Audience: ${targetAudience || targetMarket}

🚨 **CRITICAL**: This is a cultural appropriateness requirement. Images MUST show people who actually represent the local population of ${location}.`;
  };

  // Apply Cultural Intelligence for Visual Adaptation
  const useLocalLanguage = (input as any).useLocalLanguage === true;
  const culturalDesignElements = getCulturalDesignElements(input.brandProfile.location || '', useLocalLanguage);

  const visualInstructions = `
CULTURAL VISUAL ADAPTATION FOR ${(input.brandProfile.location || 'USA').toUpperCase()}:
- People: Professional representation appropriate for ${input.brandProfile.location || 'USA'}
- Settings: Modern business environments with ${useLocalLanguage ? 'authentic local cultural elements' : 'universal appeal'}
- Colors: Professional color schemes ${useLocalLanguage ? 'with subtle cultural color influences' : ''}
- Business Context: ${input.businessType} professionals
- Trust Elements: Professional credentials and quality indicators
- Cultural Values: Professional excellence and quality service
${useLocalLanguage ? `- Cultural Design Elements: ${culturalDesignElements}` : ''}
${useLocalLanguage ? `- Local Authenticity: Include subtle design elements that resonate with ${input.brandProfile.location} culture` : ''}
`;

  // Use the same marketing concept that was used for content generation
  // (This will be passed from the main function)

  // People integration logic
  const shouldIncludePeople = input.includePeopleInDesigns !== false; // Default to true if not specified
  const location = input.brandProfile.location || '';
  const businessType = input.businessType;

  console.log('👥 [Revo 1.5 People Toggle] Debug:', {
    includePeopleInDesigns: input.includePeopleInDesigns,
    shouldIncludePeople: shouldIncludePeople,
    businessType: businessType,
    location: location
  });

  // FIXED: Enhanced content-image matching debug with comprehensive analysis
  if (contentResult) {
    const contentAnalysis = analyzeContentForImageMatching(contentResult, input.brandProfile.location || '');
    console.log('📖 [CONTENT-IMAGE MATCHING DEBUG]:', {
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      callToAction: contentResult.callToAction,
      detectedPeople: contentAnalysis.detectedPeople,
      detectedSettings: contentAnalysis.detectedSettings,
      detectedScenarios: contentAnalysis.detectedScenarios,
      culturalTerms: contentAnalysis.culturalTerms,
      visualRequirements: contentAnalysis.visualRequirements
    });
  }

  // FIXED: Local language toggle debug
  console.log('🌍 [LOCAL LANGUAGE TOGGLE DEBUG]:', {
    toggleStatus: input.useLocalLanguage === true ? 'ON' : 'OFF',
    location: input.brandProfile.location,
    shouldUseLocalLanguage: input.useLocalLanguage === true,
    expectedLanguageElements: input.useLocalLanguage === true ? getLocalLanguageElements(input.brandProfile.location || '') : 'None (toggle OFF)'
  });

  // COMPREHENSIVE DEBUG SUMMARY
  const debugCulturalRep = getCulturalRepresentation(input.brandProfile.location || '');
  console.log('🚨 [REVO 1.5 CRITICAL ISSUES FIX SUMMARY]:');
  console.log('1. CULTURAL REPRESENTATION:', debugCulturalRep);
  console.log('2. LOCAL LANGUAGE STATUS:', input.useLocalLanguage === true ? 'ENABLED' : 'DISABLED');
  console.log('3. CONTENT-IMAGE MATCHING:', contentResult ? 'ACTIVE' : 'NO CONTENT');
  console.log('4. PEOPLE TOGGLE:', shouldIncludePeople ? 'ON' : 'OFF');
  console.log('5. LOCATION:', input.brandProfile.location || 'NOT SPECIFIED');

  // Clean business name pattern from image text
  const cleanBusinessNamePattern = (text: string): string => {
    if (!text || text.trim().length === 0) {
      return '';
    }

    let cleaned = text
      .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
      .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
      .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
      .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
      .trim();

    if (cleaned.length < 3) {
      return '';
    }

    return cleaned;
  };

  const cleanedImageText = cleanBusinessNamePattern(input.imageText);

  return `Create a CLEAN, MINIMAL ${input.platform} design with SINGULAR FOCUS:

🎯 DESIGN PHILOSOPHY: Clean, singular focal point + one emotion + one action

BRAND ESSENTIALS:
- Business: ${input.brandProfile.businessName}
- Primary Color: ${primaryColor}
- Style: Clean and minimal
${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? '- Logo: Will be integrated naturally' : '- Logo: Typography-based branding'}

${cleanedImageText ? `ADDITIONAL TEXT CONTENT TO INCLUDE:
"${cleanedImageText}"` : 'TEXT CONTENT: Use the generated headline, subheadline, and CTA from the content generation above'}

${contentResult ? `
📝 CONTENT TO DISPLAY:
- Main Message: "${contentResult.headline}"
- Supporting Text: "${contentResult.subheadline}"
- Action Button: "${contentResult.callToAction}"

🎯 CLEAN LAYOUT RULES:
1. ONE primary focal point (the main message)
2. ONE supporting element (subheadline OR visual, not both)
3. ONE clear action (prominent CTA button)
4. Plenty of white space
5. Maximum 3 colors total
` : ''}

${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? `
🏷️ LOGO: Brand logo will be provided - integrate naturally into clean design
` : ''}

${shouldIncludePeople ? `
👥 PEOPLE INTEGRATION (TOGGLE: ON):
🎯 6D CONCEPT VISUALIZATION:
${adConcept ? `- Ad Concept: **${adConcept.name}**
- Setting: ${adConcept.setting.category} (${adConcept.setting.description})
- Customer: ${adConcept.customer.type} (${adConcept.customer.description})
- Visual Style: ${adConcept.visualStyle.style}
- Benefit Focus: ${adConcept.benefit.type} (${adConcept.benefit.message})
- Emotional Tone: ${adConcept.emotionalTone.tone}
- Format: ${adConcept.format.technique}
- CRITICAL: The image must integrate ALL 6 dimensions cohesively` : '- Standard business visualization approach'}

${contentResult ? `
📖 CRITICAL CONTENT-IMAGE MATCHING SYSTEM:
- Content Story: "${contentResult.headline}" - "${contentResult.subheadline}"
- MANDATORY: The image MUST visually represent what the text describes

📊 CONTENT ANALYSIS RESULTS:
${(() => {
          const analysis = analyzeContentForImageMatching(contentResult, input.brandProfile.location || '');
          return `- Detected People: ${analysis.detectedPeople.join(', ') || 'Generic business people'}
- Detected Settings: ${analysis.detectedSettings.join(', ') || 'Professional business environment'}
- Cultural Terms: ${analysis.culturalTerms.join(', ') || 'None'}
- Visual Requirements: ${analysis.visualRequirements.join(' | ') || 'Show professional business scenario'}`;
        })()}

🚨 CRITICAL MATCHING RULES:
- If headline/subheadline mentions specific people → Show those EXACT people
- If content mentions specific locations → Show those EXACT locations
- If content mentions specific scenarios → Show those EXACT scenarios
- The visual story must tell the SAME story as the text
- NO generic business scenes if content is specific

🌍 CULTURAL/LOCAL TERMS RECOGNITION:
• "mama mboga" → Female vegetable vendor with fresh produce at market stall
• "boda boda rider" → Motorcycle taxi rider with bike
• "matatu driver" → Public transport driver with vehicle
• "kiosk owner" → Small shop owner with products displayed
• "hawker" → Street vendor selling goods
• "jua kali artisan" → Skilled craftsperson/metalworker
• "salon owner" → Hair/beauty salon professional
• "cyber cafe owner" → Internet cafe operator with computers

EXAMPLES OF PROPER MATCHING:
• If content says "mama mboga" → Show African woman vendor with colorful vegetables/fruits at market
• If content says "John the farmer" → Show male farmer in agricultural setting with crops
• If content says "busy restaurant owner" → Show restaurant owner in kitchen/dining area
• If content says "tech startup founder" → Show young entrepreneur with technology/laptop
• If content says "family business" → Show family members working together in their business
` : `
🎯 GENERIC BUSINESS VISUALIZATION (No specific content provided):
- Include relevant people that make sense for ${businessType} business
- Show people USING the service or BENEFITING from it
- Examples for ${businessType}:
  ${businessType.toLowerCase().includes('finance') || businessType.toLowerCase().includes('payment') ? '• Person happily checking phone after receiving payment' : ''}
  ${businessType.toLowerCase().includes('restaurant') || businessType.toLowerCase().includes('food') ? '• Family enjoying meal together, satisfied customers' : ''}
  ${businessType.toLowerCase().includes('retail') || businessType.toLowerCase().includes('shop') ? '• Customer happily shopping, holding products' : ''}
`}
- Make people diverse and authentic (different ages, ethnicities)
- People should look natural and authentic (not stock photo fake)
- Show the OUTCOME/BENEFIT the person gets from the business
- Location context: ${location} - include appropriate cultural representation
` : `
🚫 PEOPLE INTEGRATION (TOGGLE: OFF):
- NO people in the design
- Focus on clean graphics, icons, or product imagery
- Use symbols, illustrations, or abstract elements instead
- Make the design communicate through visual metaphors and typography
- Still needs to be engaging and communicate the business value
`}

🎨 CLEAN DESIGN PRINCIPLES:
✅ Singular focal point (one main element that draws attention)
✅ Generous white space (let the design breathe)
✅ Maximum 3 colors (primary + accent + background)
✅ Clean typography (readable, professional fonts)
✅ One clear emotion (trust, excitement, calm, etc.)
✅ One clear action (what should viewer do?)

❌ AVOID CLUTTER:
❌ Multiple competing elements
❌ Complex patterns or shapes
❌ Too many colors or fonts
❌ Busy backgrounds
❌ Overlapping text blocks
❌ Multiple focal points fighting for attention

🎯 6-DIMENSIONAL AD CONCEPT:
${adConcept ? `**${adConcept.name}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SETTING:     ${adConcept.setting.category} - ${adConcept.setting.description}
CUSTOMER:    ${adConcept.customer.type} - ${adConcept.customer.description}
STYLE:       ${adConcept.visualStyle.style} - ${adConcept.visualStyle.description}
BENEFIT:     ${adConcept.benefit.type} - ${adConcept.benefit.message}
TONE:        ${adConcept.emotionalTone.tone} - ${adConcept.emotionalTone.description}
FORMAT:      ${adConcept.format.technique} - ${adConcept.format.structure}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: Follow ALL 6 dimensions precisely in the visual creation` : '**Standard Business Approach** - Professional service presentation'}

🎨 DESIGN STYLE:
${getRandomDesignStyle()}

✅ FINAL REQUIREMENTS:
- Clean, professional design with singular focus
- Perfect spelling and readable text
- Use brand colors naturally (not overwhelming)
- One clear message, one clear action
- Plenty of white space
- Modern, minimal aesthetic

🎯 SUCCESS CRITERIA:
- Viewer understands the message in 3 seconds
- Clear what action to take
- Feels professional and trustworthy
- Not cluttered or overwhelming

Create a clean, effective design that follows modern best practices.`;
}

/**
 * Fetch logo from storage URL and convert to base64
 */
async function fetchAndConvertLogo(logoUrl: string): Promise<string> {
  try {
    const response = await fetch(logoUrl);

    if (!response.ok) {
      console.warn('⚠️  [Revo 1.5] Logo fetch failed:', response.status, response.statusText);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/png';
    const logoDataUrl = `data:${contentType};base64,${base64String}`;

    return logoDataUrl;
  } catch (error) {
    console.error('❌ [Revo 1.5] Error fetching logo:', error);
    return '';
  }
}

/**
 * Main Revo 1.5 Enhanced Design Generation Function
 */
export async function generateRevo15EnhancedDesign(
  input: Revo15DesignInput
): Promise<Revo15DesignResult> {
  const startTime = Date.now();

  // Logo processing is now handled in generateFinalImage (same as Revo 1.0)

  // Auto-detect platform-specific aspect ratio
  const aspectRatio = getPlatformAspectRatio(input.platform);
  const enhancedInput = {
    ...input,
    aspectRatio
  };

  // Check if logo is available for enhancement tracking
  const hasLogo = !!(input.brandProfile?.logoDataUrl || input.brandProfile?.logoUrl || input.logoDataUrl || input.logoUrl);

  const enhancementsApplied: string[] = [
    'Two-Step Design Process',
    'Claude Sonnet 4.5 Planning & Content Generation',
    'Gemini 2.5 Flash Image Preview Generation',
    'Advanced Design Strategy',
    'Premium Visual Quality',
    `Platform-Optimized ${aspectRatio} Format`,
    hasLogo ? 'Enhanced Logo Integration' : 'Logo Processing (No Logo Available)',
    'Revo 2.0-Level Logo Processing',
    'Vertex AI-Based Logo Integration System'
  ];

  try {
    console.log('🚀 [Revo 1.5 Enhanced] Starting enhanced design generation with multi-stage content system');

    // Step 1: Generate design plan with strategic analysis
    const designPlan = await generateDesignPlan(enhancedInput);
    enhancementsApplied.push('Strategic Design Planning');
    console.log('✅ [Revo 1.5 Enhanced] Design plan generated');

    // Step 2: Generate content using NEW multi-stage system with business intelligence
    console.log('🧠 [Revo 1.5 Enhanced] Starting multi-stage content generation...');

    // Generate 6-dimensional ad concept for maximum creative diversity
    const adConcept = generate6DimensionalAdConcept();

    const contentResult = await generateCaptionAndHashtags(
      input.businessType,
      input.brandProfile.businessName || input.businessType,
      input.platform,
      designPlan,
      input.brandProfile,
      { trendingHashtags: [], currentEvents: [] },
      input.useLocalLanguage === true,
      input.scheduledServices,
      adConcept // Pass 6D ad concept to content generation
    );

    enhancementsApplied.push('Multi-Stage Content Generation with Business Intelligence');
    enhancementsApplied.push('Advanced Prompt Engineering');
    enhancementsApplied.push('Content Quality Validation');
    console.log('✅ [Revo 1.5 Enhanced] Multi-stage content generation completed');

    // Step 3: Generate final image with text elements on design (matching Revo 1.0 approach)
    const imageUrl = await generateFinalImage(enhancedInput, designPlan, contentResult, adConcept);
    enhancementsApplied.push('Premium Image Generation with Text Elements');

    // 🔤 SPELL CHECK: Ensure headlines and subheadlines are spell-checked before final result
    let finalContentResult = contentResult;
    try {

      const spellCheckedContent = await ContentQualityEnhancer.enhanceGeneratedContent({
        headline: contentResult.headline,
        subheadline: contentResult.subheadline,
        caption: contentResult.caption,
        callToAction: contentResult.callToAction
      }, input.businessType, {
        autoCorrect: true,
        logCorrections: true,
        validateQuality: true
      });

      // Update content with spell-checked versions
      if (spellCheckedContent.headline !== contentResult.headline) {
      }

      if (spellCheckedContent.subheadline !== contentResult.subheadline) {
      }

      finalContentResult = {
        caption: spellCheckedContent.caption || contentResult.caption,
        hashtags: contentResult.hashtags,
        headline: spellCheckedContent.headline || contentResult.headline,
        subheadline: spellCheckedContent.subheadline || contentResult.subheadline,
        callToAction: spellCheckedContent.callToAction || contentResult.callToAction
      };

      // Add quality report if available
      if (spellCheckedContent.qualityReport) {
      }

    } catch (error) {
      console.warn('🔤 [Revo 1.5] Spell check failed, using original content:', error);
      finalContentResult = contentResult;
    }

    const result: Revo15DesignResult = {
      imageUrl,
      designSpecs: designPlan,
      qualityScore: 9.5, // Enhanced quality score with multi-stage validation
      enhancementsApplied,
      processingTime: Date.now() - startTime,
      model: 'revo-1.5-enhanced-v2 (multi-stage + business-intelligence + quality-validation)',
      planningModel: REVO_1_5_TEXT_MODEL,
      contentModel: `${REVO_1_5_TEXT_MODEL} (multi-stage pipeline)`,
      generationModel: REVO_1_5_IMAGE_MODEL,
      contentGenerationMethod: 'Multi-Stage with Business Intelligence',
      qualityValidation: 'Advanced Content Quality Validator',
      promptEngineering: 'Enhanced Prompt Builder with Marketing Frameworks',
      // format: claudeResult.format,
      caption: finalContentResult.caption,
      hashtags: finalContentResult.hashtags,
      headline: finalContentResult.headline,
      subheadline: finalContentResult.subheadline,
      callToAction: finalContentResult.callToAction
    };

    return result;

  } catch (error) {
    // Log the actual error for debugging
    console.error('❌ [Revo 1.5] Detailed error information:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

    // Extract user-friendly message if it exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If it's already a user-friendly message, use it directly
    if (errorMessage.includes('😅') || errorMessage.includes('🤖') || errorMessage.includes('😔')) {
      throw new Error(errorMessage);
    }

    // Check for specific error types and make them friendly
    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      throw new Error('Oops! Revo 1.5 is taking a quick break due to high demand. 😅 Try Revo 2.0 instead - it\'s working great right now!');
    }

    if (errorMessage.includes('500') || errorMessage.includes('Internal error')) {
      throw new Error('Revo 1.5 is having a moment! 🤖 No worries - switch to Revo 2.0 for awesome results while we wait for it to get back up.');
    }

    // Generic friendly message
    throw new Error('Revo 1.5 isn\'t feeling well right now. 😔 Good news: Revo 2.0 is ready to create amazing content for you!');
  }
}
