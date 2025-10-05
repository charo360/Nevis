/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses Gemini 2.5 Flash Image Preview for enhanced content generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { BrandProfile, Platform } from '@/lib/types';

// Lazily initialize AI clients to avoid import-time failures when environment variables
// (OPENAI_API_KEY, GEMINI_API_KEY, etc.) are not present. Clients are created only
// when a function actually needs them.
let ai: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

function getAiClient(): GoogleGenerativeAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY_REVO_2_0 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Revo 2.0: No Gemini API key found. Please set GEMINI_API_KEY_REVO_2_0 or GEMINI_API_KEY in your environment variables.');
    }
    ai = new GoogleGenerativeAI(apiKey);
  }
  return ai;
}

// CRITICAL: Block search tools to prevent expensive charges
function createSafeModel(modelName: string, config?: any) {
  const client = getAiClient();
  const model = client.getGenerativeModel({
    model: modelName,
    tools: [], // EXPLICITLY DISABLE ALL TOOLS
    ...config
  });

  // Double-check no tools are enabled
  if ((model as any)?.tools?.length) {
    throw new Error('🚫 BLOCKED: Search tools detected. This would cause expensive charges.');
  }

  return model;
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI: OPENAI_API_KEY is missing. Set OPENAI_API_KEY in your environment variables to use OpenAI features.');
    }
    openai = new OpenAI({ apiKey: key });
  }
  return openai;
}

// Revo 2.0 uses Gemini 2.5 Flash Image Preview (same as Revo 1.0 but with enhanced prompting)
const REVO_2_0_MODEL = 'gemini-2.5-flash-image-preview';

/**
 * Sanitize generic/template-sounding openings commonly produced by LLMs
 * Ensures outputs avoid phrases like "Visually showcase how ..." or "We'll showcase ..."
 */
function sanitizeGeneratedCopy(
  input: string | undefined,
  brandProfile?: { businessName?: string; location?: string },
  businessType?: string
): string | undefined {
  if (!input) return input;

  const company = brandProfile?.businessName || 'our brand';
  const location = brandProfile?.location || 'your area';
  const biz = (businessType || 'business').toLowerCase();

  let text = input.trim();

  // Normalize fancy quotes and whitespace
  text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ').trim();

  // Disallowed/generic starts → rewrite succinctly
  const genericStarts: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /^visually\s+showcase\s+how\b/i, replacement: `${company} shows` },
    { pattern: /^visual\s+showcasing\s+how\b/i, replacement: `${company} shows` },
    { pattern: /^we['’]ll\s+showcase\b/i, replacement: `${company} showcases` },
    { pattern: /^we\s+will\s+showcase\b/i, replacement: `${company} showcases` },
    { pattern: /^we\s+showcase\b/i, replacement: `${company} showcases` },
    { pattern: /^unlocking\s+dreams,?\s+one\s+swipe\s+at\s+a\s+time:?\s*/i, replacement: '' },
    { pattern: /^experience\s+the\s+excellence\s+of\b/i, replacement: `${company} delivers` },
  ];

  for (const rule of genericStarts) {
    if (rule.pattern.test(text)) {
      text = text.replace(rule.pattern, rule.replacement).trim();
      break;
    }
  }

  // Minor cleanups: spacing, double punctuation, stray quotes
  text = text
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s{2,}/g, ' ')
    .replace(/\bSACCOS\b/g, 'SACCOs');

  // If the text became empty due to removal, fall back to concise statement
  if (text.length === 0) {
    text = `${company} showcases real ${biz} impact in ${location}.`;
  }

  return text;
}

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
 * Convert logo URL to base64 data URL for AI models (matching Revo 1.5 logic)
 */
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  try {
    console.log('🔄 Revo 2.0: Fetching logo from storage URL...');
    const response = await fetch(logoUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type from response headers or URL extension
    const contentType = response.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log('✅ Revo 2.0: Logo converted to data URL successfully');
    return dataUrl;

  } catch (error) {
    console.error('❌ Revo 2.0: Logo conversion failed:', error);
    return undefined;
  }
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
 * Generate creative concept for Revo 2.0 with enhanced AI creativity
 */
async function generateCreativeConcept(options: Revo20GenerationOptions): Promise<any> {
  const { businessType, brandProfile, platform, scheduledServices } = options;

  // Extract today's services for focused content
  const todaysServices = scheduledServices?.filter(s => s.isToday) || [];
  const upcomingServices = scheduledServices?.filter(s => s.isUpcoming) || [];

  console.log('📅 Revo 2.0: Using scheduled services for concept generation:', {
    todaysServicesCount: todaysServices.length,
    todaysServiceNames: todaysServices.map(s => s.serviceName),
    upcomingServicesCount: upcomingServices.length
  });

  try {
    // Temporarily use Gemini for creative concept generation to avoid OpenAI hanging issues
    console.log('🎨 Revo 2.0: Using Gemini for creative concept generation...');

    const model = createSafeModel(REVO_2_0_MODEL, {
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });

    // Build service-aware concept prompt
    let serviceContext = '';
    if (todaysServices.length > 0) {
      serviceContext = `\n\n🎯 TODAY'S FEATURED SERVICES (Priority Focus):\n${todaysServices.map(s => `- ${s.serviceName}: ${s.description || 'Premium service offering'}`).join('\n')}`;
    }

    const conceptPrompt = `Generate a creative concept for ${brandProfile.businessName || businessType} (${businessType}) on ${platform}.
    ${serviceContext}

    Business Context:
    - Location: ${brandProfile.location || 'Global'}
    - Target Audience: ${brandProfile.targetAudience || 'General audience'}
    - Writing Tone: ${brandProfile.writingTone || 'Professional'}

    Create a concept that feels authentic and locally relevant.
    ${todaysServices.length > 0 ? `Highlight today's featured service: ${todaysServices[0].serviceName}` : ''}

    Return a brief creative concept (2-3 sentences) that will guide the visual design.`;

    const result = await model.generateContent(conceptPrompt);
    const response = await result.response;
    const conceptText = response.text();

    return {
      concept: conceptText.trim() || 'Professional content creation',
      visualTheme: 'modern-authentic',
      emotionalTone: 'engaging-professional',
      designElements: ['clean typography', 'professional imagery', 'brand colors'],
      colorSuggestions: [brandProfile.primaryColor || '#3B82F6'],
      moodKeywords: ['professional', 'trustworthy', 'engaging'],
      featuredServices: todaysServices,
      upcomingServices: upcomingServices.slice(0, 2)
    };

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Creative concept generation failed, using fallback');
    const fallbackConcept = todaysServices.length > 0
      ? `Create engaging visual content for ${brandProfile.businessName} featuring today's ${todaysServices[0].serviceName} with authentic, professional appeal.`
      : `Create engaging visual content for ${brandProfile.businessName} that showcases their ${businessType} expertise with authentic, professional appeal.`;

    return {
      concept: fallbackConcept,
      visualTheme: 'modern-authentic',
      emotionalTone: 'engaging-professional',
      featuredServices: todaysServices,
      upcomingServices: upcomingServices.slice(0, 2)
    };
  }
}

/**
 * Build enhanced prompt for Revo 2.0 with brand integration, visual consistency, and scheduled services
 */
function buildEnhancedPrompt(options: Revo20GenerationOptions, concept: any): string {
  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern', scheduledServices } = options;

  // Extract brand colors from profile
  const primaryColor = brandProfile.primaryColor || '#3B82F6';
  const accentColor = brandProfile.accentColor || '#1E40AF';
  const backgroundColor = brandProfile.backgroundColor || '#FFFFFF';

  // Build color scheme instruction
  const colorScheme = `Primary: ${primaryColor} (60% dominant), Accent: ${accentColor} (30% secondary), Background: ${backgroundColor} (10% highlights)`;

  // Brand location info
  const brandInfo = brandProfile.location ? ` based in ${brandProfile.location}` : '';

  // Determine specific visual context based on business type and concept
  const visualContext = getVisualContextForBusiness(businessType, concept.concept);

  // Build scheduled services context for visual design
  let serviceVisualContext = '';
  if (concept.featuredServices && concept.featuredServices.length > 0) {
    const todayService = concept.featuredServices[0];
    serviceVisualContext = `\n\n🎯 TODAY'S FEATURED SERVICE INTEGRATION:\n- Service: ${todayService.serviceName}\n- Description: ${todayService.description || 'Premium service offering'}\n- Visual Focus: Create imagery that showcases this specific service in action\n- Service Priority: This should be the PRIMARY visual element in the design`;
  }

  // Build people inclusion instructions based on toggle
  let peopleInstructions = '';
  if (options.includePeopleInDesigns === false) {
    peopleInstructions = `\n\n👥 PEOPLE EXCLUSION REQUIREMENT:\n- MANDATORY: Create a clean, professional design WITHOUT any people or human figures\n- AVOID: Any human faces, bodies, or silhouettes\n- FOCUS: Products, services, abstract elements, or clean minimalist design\n- STYLE: Professional, clean aesthetics without human elements\n- EMPHASIS: Brand elements, typography, and non-human visual elements`;
  } else {
    // Default behavior - include people when appropriate
    const location = brandProfile.location || 'Global';
    const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda'];
    const isAfricanCountry = africanCountries.some(country => location.toLowerCase().includes(country.toLowerCase()));

    if (isAfricanCountry) {
      peopleInstructions = `\n\n👥 PEOPLE INCLUSION (AFRICAN REPRESENTATION):\n- Include authentic Black/African people who represent the target market\n- Show people who would actually use ${businessType} services\n- Display local African people in settings relevant to ${businessType} business\n- Ensure faces are fully visible, well-lit, and anatomically correct\n- PRIORITY: 80%+ of people should be Black/African for cultural authenticity\n- Context: Show people in ${businessType}-relevant settings, not generic offices`;
    } else {
      peopleInstructions = `\n\n👥 PEOPLE INCLUSION (DIVERSE REPRESENTATION):\n- Include diverse, authentic people who represent the target market\n- Show people who would actually use ${businessType} services\n- Display people in settings relevant to ${businessType} business\n- Ensure faces are fully visible, well-lit, and anatomically correct\n- Context: Show people in ${businessType}-relevant settings`;
    }
  }

  // Lightweight contact integration - only add if contacts toggle is enabled
  let contactInstruction = '';
  if (options.includeContacts === true) {
    const contacts: string[] = [];

    // Simple contact detection (multiple data structure support)
    const phone = brandProfile?.contactInfo?.phone ||
      (brandProfile as any)?.contact?.phone ||
      (brandProfile as any)?.contactPhone ||
      (brandProfile as any)?.phone;

    const email = brandProfile?.contactInfo?.email ||
      (brandProfile as any)?.contact?.email ||
      (brandProfile as any)?.contactEmail ||
      (brandProfile as any)?.email;

    const website = brandProfile?.websiteUrl ||
      (brandProfile as any)?.contact?.website ||
      (brandProfile as any)?.website;

    const address = brandProfile?.contactInfo?.address ||
      (brandProfile as any)?.contact?.address ||
      (brandProfile as any)?.contactAddress ||
      (brandProfile as any)?.address;

    if (phone) contacts.push(`📞 ${phone}`);
    if (email) contacts.push(`📧 ${email}`);
    if (website) contacts.push(`🌐 ${website}`);
    if (address) contacts.push(`📍 ${address}`);

    if (contacts.length > 0) {
      contactInstruction = `\n\n📞 CONTACT INFORMATION (Include in design):\n${contacts.join('\n')}\n- Display contact info prominently in footer/corner area\n- Ensure contact details are readable and well-formatted\n- Use professional styling that complements the brand colors`;
    }
  }

  return `🎨 Create a ${visualStyle} social media design for ${brandProfile.businessName} (${businessType}) for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

🎯 VISUAL CONTEXT REQUIREMENT: ${visualContext}${serviceVisualContext}

DESIGN REQUIREMENTS:
- Platform: ${platform} (${getPlatformDimensions(platform)})
- Visual Style: ${visualStyle}
- Business: ${brandProfile.businessName} - ${businessType}${brandInfo}
- Location: ${brandProfile.location || 'Global'}
- Visual Theme: ${visualContext}
${concept.featuredServices && concept.featuredServices.length > 0 ? `- Featured Service: ${concept.featuredServices[0].serviceName} (TODAY'S FOCUS)` : ''}

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

❌ CRITICAL VISUAL RESTRICTIONS - NEVER INCLUDE:
❌ Glowing AI portals and tech visualizations
❌ Perfect corporate stock scenarios
❌ Overly dramatic lighting effects
❌ Artificial neon glows or sci-fi elements
❌ Generic stock photo poses
❌ Unrealistic perfect lighting setups
❌ AI-generated abstract patterns
❌ Futuristic tech interfaces
❌ Holographic or digital overlays

CRITICAL REQUIREMENTS:
- Resolution: 992x1056px (1:1 square format)
- High-quality, professional appearance
- MANDATORY: Use the specified brand colors (${primaryColor}, ${accentColor}, ${backgroundColor})
- Clear, readable text elements with proper contrast
- Engaging visual composition with brand consistency
- Cultural sensitivity and relevance
- Professional typography that complements the brand colors
- VISUAL CONSISTENCY: Ensure the image clearly represents ${visualContext}

📝 TEXT ELEMENT REQUIREMENTS:
- Include clear, readable headline text in the design
- Include supporting subheadline text that complements the headline
- Ensure all text is legible and professionally styled
- Text should be integrated naturally into the design composition
- Use typography that matches the brand aesthetic

Create a visually stunning design that stops scrolling and drives engagement while maintaining perfect brand consistency.${contactInstruction}${peopleInstructions}`;
}

/**
 * Generate image with Gemini 2.5 Flash Image Preview with logo integration
 */
async function generateImageWithGemini(prompt: string, options: Revo20GenerationOptions): Promise<{ imageUrl: string }> {
  try {
    console.log('🎨 Revo 2.0: Starting direct image generation (bypassing Genkit)');

    const model = createSafeModel(REVO_2_0_MODEL, {
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });

    if ((model as any)?.tools?.length) {
      console.error('❌ Guard: Tools detected on model initialization. Blocking to avoid search charges.');
      throw new Error('Guard: Tools are disabled for Gemini usage in this project.');
    }

    // Prepare generation parts array
    const generationParts: any[] = [prompt];

    // Enhanced logo integration (same logic as Revo 1.0 with URL conversion)
    const logoDataUrl = options.brandProfile.logoDataUrl;
    const logoStorageUrl = (options.brandProfile as any).logoUrl || (options.brandProfile as any).logo_url;
    let logoUrl = logoDataUrl || logoStorageUrl;

    console.log('🔍 Revo 2.0 Logo availability check:', {
      businessName: options.brandProfile.businessName,
      hasLogoDataUrl: !!logoDataUrl,
      hasLogoStorageUrl: !!logoStorageUrl,
      logoDataUrlLength: logoDataUrl?.length || 0,
      logoStorageUrlLength: logoStorageUrl?.length || 0,
      finalLogoUrl: logoUrl ? logoUrl.substring(0, 100) + '...' : 'None'
    });

    // Convert storage URL to data URL if needed (same as Revo 1.5)
    if (logoUrl && !logoUrl.startsWith('data:') && logoUrl.startsWith('http')) {
      console.log('🔄 Revo 2.0: Converting logo storage URL to data URL...');
      try {
        logoUrl = await convertLogoToDataUrl(logoUrl);
        console.log('✅ Revo 2.0: Logo URL converted successfully');
      } catch (conversionError) {
        console.warn('⚠️ Revo 2.0: Logo URL conversion failed:', conversionError);
        logoUrl = undefined; // Clear invalid logo
      }
    }

    // Add logo to generation parts if available
    if (logoUrl && logoUrl.startsWith('data:image/')) {
      console.log('✅ Revo 2.0: Adding logo to image generation');

      // Extract base64 data and mime type
      const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (logoMatch) {
        const [, mimeType, base64Data] = logoMatch;

        generationParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });

        // Add logo integration prompt (same as Revo 1.0)
        const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.
- Integrate the logo naturally into the layout - do not create a new logo
- The logo should be prominently displayed but not overwhelming the design
- Position the logo in a professional manner (top-left, top-right, or center as appropriate)
- Maintain the logo's aspect ratio and clarity
- Ensure the logo is clearly visible against the background

The client specifically requested their brand logo to be included. FAILURE TO INCLUDE THE LOGO IS UNACCEPTABLE.`;

        generationParts[0] = prompt + logoPrompt;
        console.log('✅ Revo 2.0: Logo integration prompt added');
      } else {
        console.error('❌ Revo 2.0: Invalid logo data URL format');
      }
    } else {
      console.log('ℹ️ Revo 2.0: No valid logo available for integration');
    }

    console.log('🔄 Revo 2.0: Generating image with Gemini 2.0 Flash Image Generation...');
    const result = await model.generateContent(generationParts);
    const response = await result.response;

    console.log('📊 Revo 2.0: Response received:', {
      candidates: response.candidates?.length || 0,
      finishReason: response.candidates?.[0]?.finishReason
    });

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    const candidate = candidates[0];
    const parts = candidate.content?.parts;

    if (!parts || parts.length === 0) {
      throw new Error('No parts in candidate content');
    }

    // Find the image part
    let imageData: string | null = null;
    let mimeType: string = 'image/png';

    for (const part of parts) {
      if ((part as any).inlineData) {
        imageData = (part as any).inlineData.data;
        mimeType = (part as any).inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageData) {
      console.error('❌ Revo 2.0: No image data found in response parts');
      throw new Error('No image data found in response');
    }

    // Convert to data URL
    const imageUrl = `data:${mimeType};base64,${imageData}`;
    console.log('✅ Revo 2.0: Image generated successfully (direct generation)');

    return { imageUrl };

  } catch (error) {
    console.error('❌ Revo 2.0: Image generation failed:', error);
    throw new Error(`Revo 2.0 image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate unique caption and hashtags for Revo 2.0 that align with the image
 */
async function generateCaptionAndHashtags(options: Revo20GenerationOptions, concept: any, imagePrompt: string, imageUrl?: string): Promise<{
  caption: string;
  hashtags: string[];
  headline?: string;
  subheadline?: string;
  cta?: string;
  captionVariations?: string[];
}> {
  const { businessType, brandProfile, platform } = options;

  // Determine hashtag count based on platform
  const hashtagCount = String(platform).toLowerCase() === 'instagram' ? 5 : 3;

  // Generate unique timestamp-based seed for variety
  const uniqueSeed = Date.now() + Math.random();
  const creativityBoost = Math.floor(uniqueSeed % 10) + 1;

  try {
    const model = createSafeModel(REVO_2_0_MODEL, {
      generationConfig: {
        temperature: 0.9, // Higher temperature for more creativity
        topP: 0.95,
        topK: 50,
        maxOutputTokens: 2048,
      }
    });
    if ((model as any)?.tools?.length) {
      console.error('❌ Guard: Tools detected on model initialization. Blocking to avoid search charges.');
      throw new Error('Guard: Tools are disabled for Gemini usage in this project.');
    }

    // Build service-specific content context
    let serviceContentContext = '';
    if (concept.featuredServices && concept.featuredServices.length > 0) {
      const todayService = concept.featuredServices[0];
      serviceContentContext = `\n\n🎯 TODAY'S FEATURED SERVICE (Primary Focus):\n- Service: ${todayService.serviceName}\n- Description: ${todayService.description || 'Premium service offering'}\n- Content Focus: Write about THIS specific service as today's highlight\n- Call-to-Action: Encourage engagement with this service`;

      if (concept.upcomingServices && concept.upcomingServices.length > 0) {
        serviceContentContext += `\n\n📅 UPCOMING SERVICES (Mention briefly):\n${concept.upcomingServices.map(s => `- ${s.serviceName}`).join('\n')}`;
      }
    }

    // Prepare the generation parts - include image if available for analysis
    const generationParts: any[] = [];

    let imageAnalysisContext = '';
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      // Add the actual generated image for analysis
      generationParts.push({
        inlineData: {
          data: imageUrl.split(',')[1], // Remove data:image/...;base64, prefix
          mimeType: imageUrl.split(';')[0].split(':')[1] // Extract mime type
        }
      });
      imageAnalysisContext = '\n\n🖼️ CRITICAL: Analyze the uploaded image and generate headlines/subheadlines that EXACTLY match the text and visual elements shown in this specific image.';
    }

    // Generate unique seed-based variations
    const timeBasedSeed = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    const uniqueId = `${timeBasedSeed}-${randomSeed}`;

    // Create variation themes to ensure uniqueness
    const variationThemes = [
      'innovation-focused', 'results-driven', 'customer-centric', 'quality-emphasis',
      'expertise-showcase', 'trust-building', 'solution-oriented', 'value-proposition',
      'transformation-story', 'excellence-highlight'
    ];
    const selectedTheme = variationThemes[creativityBoost % variationThemes.length];

    const contentPrompt = `Generate COMPLETELY UNIQUE social media content for ${brandProfile.businessName} (${businessType}) on ${platform}.

🚨 UNIQUENESS MANDATE (ID: ${uniqueId}):
- This content must be 100% DIFFERENT from any previous generation
- Use creativity level ${creativityBoost}/10 with theme: ${selectedTheme}
- NEVER repeat previous headlines, subheadlines, or phrases
- Create fresh, original content every single time
- Variation theme: ${selectedTheme}

🖼️ IMAGE CONTEXT: The visual design shows: ${concept.concept}
📝 VISUAL ELEMENTS: ${imagePrompt.includes('office') ? 'Professional office/workspace setting' : imagePrompt.includes('market') ? 'Market/business environment' : 'Business-focused visual elements'}${serviceContentContext}${imageAnalysisContext}

CREATIVE CONCEPT: ${concept.concept}
LOCATION: ${brandProfile.location || 'Global'}
BUSINESS FOCUS: ${businessType}
PLATFORM: ${platform}
THEME: ${selectedTheme}

🎯 CRITICAL ALIGNMENT REQUIREMENT:
- The caption MUST match the visual elements described above
- If the image shows office/workspace, write about office/workspace services
- If the image shows market/business, write about market/business solutions
- DO NOT write about markets if the image shows offices
- DO NOT write about offices if the image shows markets
- ENSURE perfect alignment between visual and text content
${concept.featuredServices && concept.featuredServices.length > 0 ? `- MANDATORY: Feature today's service "${concept.featuredServices[0].serviceName}" prominently in the caption` : ''}
${concept.featuredServices && concept.featuredServices.length > 0 ? `- Write as if promoting TODAY'S special service offering` : ''}

🚫 ANTI-REPETITION RULES (STRICTLY ENFORCED):
- BANNED PHRASES: "Experience the excellence of", "Your trusted partner", "Innovation meets", "Transform your"
- BANNED PATTERNS: "Ready to [verb]", "Discover why", "Join the [noun]", "Where [noun] meets [noun]"
- NO generic business templates or corporate speak
- NO repetitive sentence structures from previous generations
- CREATE completely original headlines and subheadlines
- USE unexpected angles and fresh perspectives
- VARY sentence length, tone, and approach dramatically
- MUST sound human, not AI-generated

✅ CONTENT REQUIREMENTS:
1. HEADLINE (max 6 words): Catchy, ${selectedTheme}, NEVER used before
2. SUBHEADLINE (max 25 words): Compelling, specific, completely original
3. CAPTION (50-100 words): Engaging, authentic, conversational, UNIQUE
4. CALL-TO-ACTION (2-4 words): Action-oriented, compelling, fresh

🎯 HEADLINE VARIATION REQUIREMENTS:
- Use different emotional triggers: urgency, curiosity, benefit, social proof
- Vary formats: questions, statements, commands, exclamations
- Theme-specific approach: ${selectedTheme}
- Examples of variety: "Why [Business] Wins", "[Number] Game-Changers", "Behind [Service]", "[Location]'s Choice"

🎯 SUBHEADLINE VARIATION REQUIREMENTS:
- Different value propositions each time
- Vary between features, benefits, outcomes, and social proof
- Use specific numbers, locations, or unique selling points
- Theme alignment: ${selectedTheme}

🚨 CRITICAL TEXT ALIGNMENT:
- If the image contains headline text, use EXACTLY that text
- If the image contains subheadline text, use EXACTLY that text
- DO NOT create different headlines/subheadlines than what appears in the image
- The goal is perfect alignment between image text and metadata
5. HASHTAGS (EXACTLY ${hashtagCount} - NO MORE, NO LESS): ${platform === 'instagram' ? 'Instagram gets EXACTLY 5 hashtags' : 'Other platforms get EXACTLY 3 hashtags'}

🚨 CRITICAL HASHTAG REQUIREMENT:
- You MUST generate EXACTLY ${hashtagCount} hashtags
- Do NOT generate more than ${hashtagCount} hashtags
- Do NOT generate fewer than ${hashtagCount} hashtags
- Count your hashtags before responding

🎨 CONTENT STYLE:
- Write like a sophisticated marketer who understands ${brandProfile.location || 'the local market'}
- Use persuasive, engaging language that drives interest
- Be conversational and authentic, not corporate
- Include specific benefits and value propositions
- Make it feel personal and relatable
- Use local cultural context when appropriate

  📱 PLATFORM OPTIMIZATION:
  - ${String(platform).toLowerCase() === 'instagram' ? 'Instagram: Visual storytelling, lifestyle focus, 5 strategic hashtags' : 'Other platforms: Professional tone, business focus, 3 targeted hashtags'}

🌍 CULTURAL INTELLIGENCE:
- Adapt tone for ${brandProfile.location || 'global audience'}
- Use culturally relevant references when appropriate
- Consider local business practices and communication styles

Format as JSON:
{
  "headline": "...",
  "subheadline": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": ["#tag1", "#tag2", ...]
}`;

    // Add the text prompt to generation parts
    generationParts.push(contentPrompt);

    const result = await model.generateContent(generationParts);
    const response = await result.response;
    const content = response.text();

    try {
      // Clean the response to extract JSON
      let cleanContent = content.trim();
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
      } else if (cleanContent.includes('```')) {
        cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(cleanContent);

      // Ensure hashtag count is EXACTLY correct (5 for Instagram, 3 for others)
      let finalHashtags = parsed.hashtags || [];
      // ALWAYS enforce exact count - trim if too many, pad if too few
      if (finalHashtags.length > hashtagCount) {
        finalHashtags = finalHashtags.slice(0, hashtagCount);
        console.log(`✂️ Revo 2.0: Trimmed hashtags from ${parsed.hashtags.length} to ${hashtagCount} for ${platform}`);
      } else if (finalHashtags.length < hashtagCount) {
        // Generate platform-appropriate hashtags if count is wrong
        finalHashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount);
        console.log(`➕ Revo 2.0: Added hashtags to reach ${hashtagCount} for ${platform}`);
      }

      // Final validation - ensure EXACTLY the right count
      finalHashtags = finalHashtags.slice(0, hashtagCount);

      // Ensure no repetitive captions
      const caption = parsed.caption && !parsed.caption.includes('Experience the excellence of')
        ? parsed.caption
        : generateUniqueFallbackCaption(brandProfile, businessType, creativityBoost);

      return {
        caption: sanitizeGeneratedCopy(caption, brandProfile, businessType) as string,
        hashtags: finalHashtags,
        headline: sanitizeGeneratedCopy(parsed.headline, brandProfile, businessType),
        subheadline: sanitizeGeneratedCopy(parsed.subheadline, brandProfile, businessType),
        cta: sanitizeGeneratedCopy(parsed.cta, brandProfile, businessType),
        captionVariations: [sanitizeGeneratedCopy(caption, brandProfile, businessType) as string]
      };

    } catch (parseError) {
      console.warn('⚠️ Revo 2.0: Failed to parse content JSON, generating unique fallback');
      console.log('Parse error details:', parseError);
      return generateUniqueFallbackContent(brandProfile, businessType, platform, hashtagCount, creativityBoost, concept);
    }

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Content generation failed, generating unique fallback');
    console.log('Generation error details:', error);
    return generateUniqueFallbackContent(brandProfile, businessType, platform, hashtagCount, Date.now() % 10, concept);
  }
}

/**
 * Generate unique fallback content to avoid repetition with service integration
 */
function generateUniqueFallbackContent(brandProfile: any, businessType: string, platform: string, hashtagCount: number, creativityLevel: number, concept?: any) {
  // Check if we have today's featured service
  const todayService = concept?.featuredServices?.[0];

  const uniqueCaptions = todayService ? [
    `Today's spotlight: ${todayService.serviceName} at ${brandProfile.businessName}. Experience excellence in ${businessType.toLowerCase()} like never before.`,
    `Featuring today: ${todayService.serviceName}. ${brandProfile.businessName} brings you premium ${businessType.toLowerCase()} solutions in ${brandProfile.location || 'your area'}.`,
    `Don't miss today's ${todayService.serviceName} from ${brandProfile.businessName}. Your trusted ${businessType.toLowerCase()} partner delivers again.`,
    `Today we're highlighting ${todayService.serviceName}. See why ${brandProfile.businessName} leads in ${businessType.toLowerCase()} innovation.`,
    `Special focus today: ${todayService.serviceName}. ${brandProfile.businessName} continues to set the standard in ${businessType.toLowerCase()}.`
  ] : [
    `Transform your ${businessType.toLowerCase()} experience with ${brandProfile.businessName}. We're redefining excellence in ${brandProfile.location || 'the industry'}.`,
    `Ready to elevate your ${businessType.toLowerCase()} journey? ${brandProfile.businessName} brings innovation and expertise to ${brandProfile.location || 'every project'}.`,
    `Discover why ${brandProfile.businessName} is the preferred choice for ${businessType.toLowerCase()} solutions in ${brandProfile.location || 'the market'}.`,
    `Your success is our mission. ${brandProfile.businessName} delivers exceptional ${businessType.toLowerCase()} services with a personal touch.`,
    `Innovation meets reliability at ${brandProfile.businessName}. Experience the future of ${businessType.toLowerCase()} today.`
  ];

  const selectedCaption = uniqueCaptions[creativityLevel % uniqueCaptions.length];
  const hashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount, todayService);

  return {
    caption: sanitizeGeneratedCopy(selectedCaption, brandProfile, businessType) as string,
    hashtags,
    headline: sanitizeGeneratedCopy(todayService ? `Today's ${todayService.serviceName}` : 'Innovation Delivered', brandProfile, businessType),
    subheadline: sanitizeGeneratedCopy(todayService ? `Featured service from ${brandProfile.businessName}` : `Your trusted ${businessType.toLowerCase()} partner`, brandProfile, businessType),
    cta: sanitizeGeneratedCopy(todayService ? 'Learn More' : 'Get Started', brandProfile, businessType),
    captionVariations: [sanitizeGeneratedCopy(selectedCaption, brandProfile, businessType) as string]
  };
}

/**
 * Generate platform-appropriate hashtags with service integration
 */
function generateFallbackHashtags(brandProfile: any, businessType: string, platform: string, count: number, todayService?: any): string[] {
  const brandTag = `#${brandProfile.businessName.replace(/\s+/g, '')}`;
  const businessTag = `#${businessType.replace(/\s+/g, '')}`;
  const serviceTag = todayService ? `#${todayService.serviceName.replace(/\s+/g, '')}` : null;

  const instagramHashtags = serviceTag
    ? [brandTag, businessTag, serviceTag, '#TodaysFocus', '#Featured']
    : [brandTag, businessTag, '#Innovation', '#Quality', '#Success'];

  const otherHashtags = serviceTag
    ? [brandTag, businessTag, serviceTag]
    : [brandTag, businessTag, '#Professional'];

  const baseHashtags = platform.toLowerCase() === 'instagram' ? instagramHashtags : otherHashtags;

  return baseHashtags.slice(0, count);
}

/**
 * Get visual context based on business type to ensure image-caption alignment
 */
function getVisualContextForBusiness(businessType: string, concept: string): string {
  const businessLower = businessType.toLowerCase();

  if (businessLower.includes('office') || businessLower.includes('workspace') || businessLower.includes('corporate')) {
    return 'Professional office/workspace environment with modern business aesthetics';
  }

  if (businessLower.includes('market') || businessLower.includes('retail') || businessLower.includes('shop')) {
    return 'Market/retail business environment with customer-focused elements';
  }

  if (businessLower.includes('restaurant') || businessLower.includes('food') || businessLower.includes('cafe')) {
    return 'Food service environment with culinary and hospitality elements';
  }

  if (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('digital')) {
    return 'Modern technology workspace with digital innovation elements';
  }

  if (businessLower.includes('health') || businessLower.includes('medical') || businessLower.includes('clinic')) {
    return 'Healthcare/medical environment with professional wellness aesthetics';
  }

  // Default based on concept
  if (concept.includes('office') || concept.includes('workspace')) {
    return 'Professional office/workspace environment';
  }

  if (concept.includes('market') || concept.includes('customer')) {
    return 'Market/customer-focused business environment';
  }

  return 'Professional business environment that matches the service offering';
}

/**
 * Generate unique fallback caption
 */
function generateUniqueFallbackCaption(brandProfile: any, businessType: string, creativityLevel: number): string {
  const templates = [
    `Elevate your ${businessType.toLowerCase()} experience with ${brandProfile.businessName} - where innovation meets excellence.`,
    `Transform your business with ${brandProfile.businessName}. We're redefining ${businessType.toLowerCase()} standards.`,
    `Ready for exceptional ${businessType.toLowerCase()} solutions? ${brandProfile.businessName} delivers results that matter.`,
    `Your success story starts here. ${brandProfile.businessName} brings expertise and innovation to every project.`,
    `Discover the ${brandProfile.businessName} difference in ${businessType.toLowerCase()} excellence.`
  ];

  return templates[creativityLevel % templates.length];
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

    // Step 1: Generate creative concept with timeout
    console.log('🎨 Revo 2.0: Generating creative concept...');
    const concept = await Promise.race([
      generateCreativeConcept(enhancedOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Creative concept generation timeout')), 15000))
    ]);
    console.log('✅ Revo 2.0: Creative concept generated');

    // Step 2: Build enhanced prompt
    console.log('📝 Revo 2.0: Building enhanced prompt...');
    const enhancedPrompt = buildEnhancedPrompt(enhancedOptions, concept);
    console.log('✅ Revo 2.0: Enhanced prompt built');

    // Step 3: Generate image with Gemini 2.5 Flash Image Preview with timeout
    console.log('🖼️ Revo 2.0: Generating image...');
    const imageResult = await Promise.race([
      generateImageWithGemini(enhancedPrompt, enhancedOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 20000))
    ]);
    console.log('✅ Revo 2.0: Image generated');

    // Step 4: Generate caption and hashtags with timeout
    console.log('📱 Revo 2.0: Generating content...');
    const contentResult = await Promise.race([
      generateCaptionAndHashtags(enhancedOptions, concept),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Content generation timeout')), 15000))
    ]);
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
        'Brand consistency optimization',
        'Platform-specific formatting',
        'Cultural relevance integration',
        'Advanced visual storytelling'
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

    const model = createSafeModel(REVO_2_0_MODEL);
    if ((model as any)?.tools?.length) {
      console.error('❌ Guard: Tools detected on model initialization. Blocking to avoid search charges.');
      throw new Error('Guard: Tools are disabled for Gemini usage in this project.');
    }
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

/**
 * Generate unique headlines based on theme
 */
function generateUniqueHeadline(brandProfile: any, businessType: string, theme: string): string {
  const headlines = {
    'innovation-focused': [
      'Next-Level Solutions',
      'Future-Ready Business',
      'Innovation Unleashed',
      'Tomorrow Starts Today',
      'Breakthrough Results'
    ],
    'results-driven': [
      'Proven Performance',
      'Results That Matter',
      'Success Delivered',
      'Measurable Impact',
      'Achievement Unlocked'
    ],
    'customer-centric': [
      'Your Success First',
      'Client-Focused Excellence',
      'Tailored Solutions',
      'Personal Attention',
      'Customer Champions'
    ],
    'quality-emphasis': [
      'Premium Standards',
      'Excellence Defined',
      'Quality Guaranteed',
      'Superior Service',
      'Unmatched Quality'
    ],
    'expertise-showcase': [
      'Expert Solutions',
      'Professional Excellence',
      'Skilled Specialists',
      'Master Craftsmen',
      'Industry Leaders'
    ]
  };

  const themeHeadlines = headlines[theme as keyof typeof headlines] || headlines['innovation-focused'];
  const randomIndex = Math.floor(Math.random() * themeHeadlines.length);
  return themeHeadlines[randomIndex];
}

/**
 * Generate unique subheadlines based on theme and service
 */
function generateUniqueSubheadline(brandProfile: any, businessType: string, theme: string, todayService?: any): string {
  const location = brandProfile.location || 'your area';
  const business = brandProfile.businessName;
  const service = todayService?.serviceName || businessType;

  const subheadlines = {
    'innovation-focused': [
      `${business} brings cutting-edge ${service} to ${location}`,
      `Revolutionary ${service} solutions from ${business}`,
      `Advanced ${service} technology meets local expertise`,
      `${business} pioneers the future of ${service}`,
      `Next-generation ${service} available in ${location}`
    ],
    'results-driven': [
      `${business} delivers measurable ${service} outcomes`,
      `Proven ${service} results from ${business}`,
      `${business} guarantees ${service} success in ${location}`,
      `Track record of ${service} excellence at ${business}`,
      `${business} turns ${service} goals into reality`
    ],
    'customer-centric': [
      `${business} puts your ${service} needs first`,
      `Personalized ${service} solutions from ${business}`,
      `${business} listens, understands, delivers ${service}`,
      `Your ${service} success is our priority at ${business}`,
      `${business} creates ${service} experiences just for you`
    ]
  };

  const themeSubheadlines = subheadlines[theme as keyof typeof subheadlines] || subheadlines['innovation-focused'];
  const randomIndex = Math.floor(Math.random() * themeSubheadlines.length);
  return themeSubheadlines[randomIndex];
}

/**
 * Generate unique CTAs based on theme
 */
function generateUniqueCTA(theme: string): string {
  const ctas = {
    'innovation-focused': ['Explore Now', 'Discover More', 'See Innovation', 'Try Today'],
    'results-driven': ['Get Results', 'Start Now', 'Achieve More', 'See Proof'],
    'customer-centric': ['Connect Today', 'Let\'s Talk', 'Your Solution', 'Get Personal'],
    'quality-emphasis': ['Experience Quality', 'See Excellence', 'Choose Best', 'Premium Access'],
    'expertise-showcase': ['Meet Experts', 'Get Professional', 'Expert Help', 'Skilled Service']
  };

  const themeCTAs = ctas[theme as keyof typeof ctas] || ctas['innovation-focused'];
  const randomIndex = Math.floor(Math.random() * themeCTAs.length);
  return themeCTAs[randomIndex];
}