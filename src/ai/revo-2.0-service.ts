/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses Gemini 2.5 Flash Image Preview for enhanced content generation
 */

import type { BrandProfile, Platform } from '@/lib/types';
import { aiProxyClient, getUserIdForProxy, getUserTierForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';

// All AI calls now go through the proxy system for cost control and model management

// Note: All AI calls now go through proxy for cost control and model management

// Helper function to route AI calls through proxy - PROXY ONLY, NO FALLBACK
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  if (!shouldUseProxy()) {
    throw new Error('🚫 Proxy is disabled. This system requires AI_PROXY_ENABLED=true to function.');
  }

  console.log(`🔄 Revo 2.0: Using proxy for ${isImageGeneration ? 'image' : 'text'} generation with ${modelName}`);

  // Handle multimodal requests (text + images) properly
  let prompt: string;
  let imageData: string | undefined;

  if (Array.isArray(promptOrParts)) {
    // Extract text parts
    const textParts = promptOrParts.filter(part => typeof part === 'string');
    prompt = textParts.join(' ');

    // Extract image data from inlineData parts (for logo integration)
    const imageParts = promptOrParts.filter(part =>
      typeof part === 'object' && part.inlineData && part.inlineData.data
    );

    if (imageParts.length > 0) {
      // Use the first image (logo) - convert back to data URL format for proxy
      const firstImage = imageParts[0];
      const mimeType = firstImage.inlineData.mimeType || 'image/png';
      imageData = `data:${mimeType};base64,${firstImage.inlineData.data}`;
      console.log('🖼️ Revo 2.0: Logo data extracted for proxy transmission');
    }
  } else {
    prompt = promptOrParts;
  }

  if (isImageGeneration) {
    const response = await aiProxyClient.generateImage({
      prompt,
      model: modelName,
      user_id: getUserIdForProxy(),
      user_tier: getUserTierForProxy(),
      // Include logo image data if available
      ...(imageData && { logoImage: imageData })
    });

    // Extract image data from proxy response
    const candidates = response.data?.candidates;
    if (!candidates || !candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
      throw new Error('Invalid image response from proxy - no image data found');
    }

    // Mock the Google AI response structure for image generation
    return {
      response: {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: candidates[0].content.parts[0].inlineData.data
              }
            }]
          }
        }]
      }
    };
  } else {
    const response = await aiProxyClient.generateText({
      prompt,
      model: modelName,
      user_id: getUserIdForProxy(),
      user_tier: getUserTierForProxy()
    });

    // Extract text content from proxy response
    const candidates = response.data?.candidates;
    if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid text response from proxy - no text content found');
    }

    return { response: { text: () => candidates[0].content.parts[0].text } };
  }
}

// Removed: getOpenAIClient() - All AI calls now go through proxy for cost control

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
    console.log('🎨 Revo 2.0: Using proxy for creative concept generation...');

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

    const result = await generateContentWithProxy(conceptPrompt, REVO_2_0_MODEL, false);
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
    console.log('🎨 Revo 2.0: Starting proxy image generation...');

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
    const result = await generateContentWithProxy(generationParts, REVO_2_0_MODEL, true);
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
    console.log('🎨 Revo 2.0: Using proxy for content generation...');

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

    const contentPrompt = `Create engaging social media content for ${brandProfile.businessName} (${businessType}) on ${platform}.

🎯 BUSINESS CONTEXT:
- Business: ${brandProfile.businessName}
- Industry: ${businessType}
- Location: ${brandProfile.location || 'Global'}
- Platform: ${platform}

🖼️ VISUAL CONTEXT:
The generated image shows: ${concept.concept}
${imagePrompt ? `Image elements include: ${getDetailedVisualContext(imagePrompt, businessType)}` : ''}${serviceContentContext}${imageAnalysisContext}

🎯 CONTENT ALIGNMENT REQUIREMENTS:
- Caption MUST be relevant to the visual elements in the image
- Write about what's actually shown in the design
- Match the tone and context of the visual setting
- Be specific about the business services that relate to the visual context
${concept.featuredServices && concept.featuredServices.length > 0 ? `- Highlight today's featured service: "${concept.featuredServices[0].serviceName}"` : ''}

📝 CONTENT REQUIREMENTS:
1. HEADLINE (max 6 words): Catchy and relevant to the visual content
2. SUBHEADLINE (max 25 words): Specific to the business and visual context
3. CAPTION (50-100 words): Engaging, authentic, and directly related to the image
4. CALL-TO-ACTION (2-4 words): Action-oriented and contextually appropriate
5. HASHTAGS (EXACTLY ${hashtagCount}): ${platform === 'instagram' ? '5 hashtags for Instagram' : '3 hashtags for other platforms'}

🎨 WRITING GUIDELINES:
- Write in a conversational, authentic tone
- Avoid generic corporate speak
- Be specific about the business value proposition
- Include relevant details about the location or services
- Make it engaging and scroll-stopping
- Ensure the content matches what's shown in the image

🚨 CRITICAL: If the generated image contains text elements, your headline and subheadline should complement (not contradict) that text.

🌍 PLATFORM & CULTURAL CONTEXT:
- Platform: ${String(platform).toLowerCase() === 'instagram' ? 'Instagram - Visual storytelling with lifestyle focus' : 'Professional business platform'}
- Location: ${brandProfile.location || 'Global'} - Use appropriate cultural context
- Tone: Conversational and authentic, not corporate
- Focus: Specific benefits and value propositions that relate to the visual content

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

    const result = await generateContentWithProxy(generationParts, REVO_2_0_MODEL, false);
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
 * Generate contextually relevant fallback content based on visual and business context
 */
function generateUniqueFallbackContent(brandProfile: any, businessType: string, platform: string, hashtagCount: number, creativityLevel: number, concept?: any) {
  // Check if we have today's featured service
  const todayService = concept?.featuredServices?.[0];

  // Get visual context for better alignment
  const visualContext = getVisualContextForBusiness(businessType, concept?.concept || '');

  const uniqueCaptions = todayService ? [
    `Spotlight on ${todayService.serviceName}! ${brandProfile.businessName} delivers exceptional ${businessType.toLowerCase()} services in ${brandProfile.location || 'your area'}.`,
    `Today's feature: ${todayService.serviceName}. See why ${brandProfile.businessName} is your go-to choice for quality ${businessType.toLowerCase()} solutions.`,
    `Highlighting ${todayService.serviceName} from ${brandProfile.businessName}. Professional ${businessType.toLowerCase()} services that make a difference.`,
    `${todayService.serviceName} takes center stage today. ${brandProfile.businessName} brings you excellence in ${businessType.toLowerCase()}.`,
    `Featured service: ${todayService.serviceName}. ${brandProfile.businessName} continues to lead in ${businessType.toLowerCase()} innovation.`
  ] : [
    `${brandProfile.businessName} brings you professional ${businessType.toLowerCase()} services in ${brandProfile.location || 'your area'}. Quality you can trust.`,
    `Looking for reliable ${businessType.toLowerCase()} solutions? ${brandProfile.businessName} delivers excellence every time.`,
    `${brandProfile.businessName}: Your partner for premium ${businessType.toLowerCase()} services. Experience the difference quality makes.`,
    `Professional ${businessType.toLowerCase()} services from ${brandProfile.businessName}. Serving ${brandProfile.location || 'the community'} with dedication.`,
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
 * Get detailed visual context from image prompt for better caption alignment
 */
function getDetailedVisualContext(imagePrompt: string, businessType: string): string {
  const promptLower = imagePrompt.toLowerCase();
  const businessLower = businessType.toLowerCase();

  // Analyze the image prompt for specific visual elements
  if (promptLower.includes('office') || promptLower.includes('workspace') || promptLower.includes('desk')) {
    return 'Professional office/workspace setting with modern business aesthetics';
  }

  if (promptLower.includes('market') || promptLower.includes('shopping') || promptLower.includes('store')) {
    return 'Market/retail business environment with customer-focused elements';
  }

  if (promptLower.includes('restaurant') || promptLower.includes('food') || promptLower.includes('kitchen') || promptLower.includes('dining')) {
    return 'Restaurant/food service environment with culinary and hospitality elements';
  }

  if (promptLower.includes('tech') || promptLower.includes('computer') || promptLower.includes('digital') || promptLower.includes('software')) {
    return 'Modern technology workspace with digital innovation elements';
  }

  if (promptLower.includes('health') || promptLower.includes('medical') || promptLower.includes('clinic') || promptLower.includes('hospital')) {
    return 'Healthcare/medical environment with professional wellness aesthetics';
  }

  if (promptLower.includes('construction') || promptLower.includes('building') || promptLower.includes('tools')) {
    return 'Construction/building environment with professional craftsmanship elements';
  }

  if (promptLower.includes('education') || promptLower.includes('school') || promptLower.includes('classroom')) {
    return 'Educational environment with learning and development focus';
  }

  // Fallback to business type analysis
  return getVisualContextForBusiness(businessType, imagePrompt);
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
    console.log('🚀 Revo 2.0: Starting next-generation content generation (Fixed Timeouts)');

    // Auto-detect platform-specific aspect ratio if not provided
    const aspectRatio = options.aspectRatio || getPlatformAspectRatio(options.platform);
    const enhancedOptions = { ...options, aspectRatio };

    console.log(`🎯 Revo 2.0: Using ${aspectRatio} aspect ratio for ${options.platform}`);

    // Step 1: Generate creative concept with timeout
    console.log('🎨 Revo 2.0: Generating creative concept...');
    const concept = await Promise.race([
      generateCreativeConcept(enhancedOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Creative concept generation timeout')), 60000))
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
      generateCaptionAndHashtags(enhancedOptions, concept, enhancedPrompt, imageResult.imageUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Content generation timeout')), 60000))
    ]);
    console.log('✅ Revo 2.0: Content generated');

    const processingTime = Date.now() - startTime;

    // 🔤 SPELL CHECK: Ensure headlines and subheadlines are spell-checked before final result
    let finalContentResult = contentResult;
    try {
      console.log('🔤 [Revo 2.0] Running spell check on headlines and subheadlines...');

      const spellCheckedContent = await ContentQualityEnhancer.enhanceGeneratedContent({
        headline: contentResult.headline,
        subheadline: contentResult.subheadline,
        caption: contentResult.caption,
        callToAction: contentResult.cta
      }, options.businessType, {
        autoCorrect: true,
        logCorrections: true,
        validateQuality: true
      });

      // Update content with spell-checked versions
      if (spellCheckedContent.headline !== contentResult.headline) {
        console.log(`🔤 [Revo 2.0] Headline corrected: "${contentResult.headline}" → "${spellCheckedContent.headline}"`);
      }

      if (spellCheckedContent.subheadline !== contentResult.subheadline) {
        console.log(`🔤 [Revo 2.0] Subheadline corrected: "${contentResult.subheadline}" → "${spellCheckedContent.subheadline}"`);
      }

      finalContentResult = {
        caption: spellCheckedContent.caption || contentResult.caption,
        hashtags: contentResult.hashtags,
        headline: spellCheckedContent.headline || contentResult.headline,
        subheadline: spellCheckedContent.subheadline || contentResult.subheadline,
        cta: spellCheckedContent.callToAction || contentResult.cta,
        captionVariations: contentResult.captionVariations
      };

      // Add quality report if available
      if (spellCheckedContent.qualityReport) {
        console.log(`🔤 [Revo 2.0] Content quality score: ${spellCheckedContent.qualityReport.overallQuality.score}/100`);
      }

    } catch (error) {
      console.warn('🔤 [Revo 2.0] Spell check failed, using original content:', error);
      finalContentResult = contentResult;
    }

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
      caption: finalContentResult.caption,
      hashtags: finalContentResult.hashtags,
      headline: finalContentResult.headline,
      subheadline: finalContentResult.subheadline,
      cta: finalContentResult.cta,
      captionVariations: finalContentResult.captionVariations,
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
    console.log('🧪 Testing Revo 2.0 availability via proxy...');

    const response = await generateContentWithProxy('Create a simple test image with the text "Revo 2.0 Test" on a modern gradient background', REVO_2_0_MODEL, true);

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