/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses Gemini 2.5 Flash Image Preview for enhanced content generation
 */

import type { BrandProfile, Platform } from '@/lib/types';
import { aiProxyClient, getUserIdForProxy, getUserTierForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';

// Direct API fallback function when proxy is not available
async function generateContentDirect(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean): Promise<any> {
  console.log('🔄 Revo 2.0: Using direct Google AI API fallback');

  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY_REVO_2_0 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('🚫 No Google API key found for Revo 2.0. Please set GEMINI_API_KEY_REVO_2_0 or GEMINI_API_KEY in your environment variables.');
  }

  // Prepare prompt
  let prompt: string;
  if (Array.isArray(promptOrParts)) {
    const textParts = promptOrParts.filter(part => typeof part === 'string');
    prompt = textParts.join(' ');
  } else {
    prompt = promptOrParts;
  }

  // Prepare payload
  const parts = [{ text: prompt }];

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(isImageGeneration && { responseModalities: ['IMAGE'] })
    }
  };

  // Determine endpoint based on model
  const cleanModelName = modelName.replace(/^(googleai\/|anthropic\/|openai\/)/, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (isImageGeneration) {
      // Extract image data
      const candidates = result.candidates;
      if (!candidates || !candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
        throw new Error('Invalid image response from Google API');
      }

      const base64Data = candidates[0].content.parts[0].inlineData.data;
      const imageDataUrl = `data:image/png;base64,${base64Data}`;

      return {
        response: {
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/png'
                }
              }]
            },
            finishReason: 'STOP'
          }]
        },
        media: {
          url: imageDataUrl,
          contentType: 'image/png'
        }
      };
    } else {
      // Extract text content
      const candidates = result.candidates;
      if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid text response from Google API');
      }

      return {
        response: {
          text: () => candidates[0].content.parts[0].text,
          candidates: [{
            content: { parts: [{ text: candidates[0].content.parts[0].text }] },
            finishReason: 'STOP'
          }]
        }
      };
    }
  } catch (error) {
    console.error('❌ Revo 2.0 Direct API generation failed:', error);
    throw error;
  }
}

// All AI calls now go through the proxy system for cost control and model management

// Note: All AI calls now go through proxy for cost control and model management

// Helper function to route AI calls through proxy - PROXY ONLY, NO FALLBACK
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  if (!shouldUseProxy()) {
    console.log('🔄 Revo 2.0: Proxy disabled, using direct API fallback');
    return await generateContentDirect(promptOrParts, modelName, isImageGeneration);
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

  try {
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
  } catch (error) {
    console.error('❌ Revo 2.0: Proxy call failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If proxy fails and we should be using it, try direct API fallback
    if (shouldUseProxy()) {
      console.log('🔄 Revo 2.0: Proxy failed, attempting direct API fallback...');
      try {
        return await generateContentDirect(promptOrParts, modelName, isImageGeneration);
      } catch (fallbackError) {
        console.error('❌ Revo 2.0: Direct API fallback also failed:', fallbackError);
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        throw new Error(`Both proxy and direct API failed. Proxy error: ${errorMessage}. Direct API error: ${fallbackErrorMessage}`);
      }
    }

    throw new Error(`Revo 2.0 proxy generation failed: ${errorMessage}`);
  }
}

// Removed: getOpenAIClient() - All AI calls now go through proxy for cost control

// Revo 2.0 uses Gemini 2.5 Flash Image Preview (same as Revo 1.0 but with enhanced prompting)
const REVO_2_0_MODEL = 'gemini-2.5-flash-image-preview';

// === Revo 2.0 Creativity & Anti-Repetition Utilities ===

type RecentOutput = { headlines: string[]; captions: string[] };
const recentOutputs = new Map<string, RecentOutput>();
const recentStyles = new Map<string, string>();

function brandKey(brand: any, platform: any) {
  return `${brand.businessName || 'unknown'}|${platform}`.toLowerCase();
}

function tokenize(text: string): Set<string> {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
}

function jaccard(a: string, b: string): number {
  const A = tokenize(a), B = tokenize(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function tooSimilar(text: string | undefined, previous: string[] = [], threshold: number): boolean {
  if (!text) return false;

  // Check for banned patterns
  if (/\b(journey|everyday)\b/i.test(text)) return true;
  if (/^[A-Z]+:\s/.test(text)) return true; // Company name with colon pattern

  for (const p of previous) {
    if (jaccard(text, p) >= threshold) return true;
  }
  return false;
}

function rememberOutput(key: string, { headline, caption }: { headline?: string; caption?: string }) {
  const entry = recentOutputs.get(key) || { headlines: [], captions: [] };
  if (headline) {
    entry.headlines.unshift(headline);
    entry.headlines = entry.headlines.slice(0, 10);
  }
  if (caption) {
    entry.captions.unshift(caption);
    entry.captions = entry.captions.slice(0, 10);
  }
  recentOutputs.set(key, entry);
}

const OVERUSED_WORDS = new Set<string>(['journey', 'journeys', 'everyday', 'kenyan', 'financial']); // add more as needed

function stripOverusedWords(text: string): string {
  let cleaned = (text || '')
    .split(/\s+/)
    .filter((w) => !OVERUSED_WORDS.has(w.toLowerCase()))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Remove company name with colon pattern (e.g., "PAYA:", "COMPANY:")
  cleaned = cleaned.replace(/^[A-Z]+:\s*/i, '');

  return cleaned;
}

function pickNonRepeating<T>(arr: T[], last?: T): T {
  if (!arr.length) throw new Error('Empty choices');
  if (arr.length === 1) return arr[0];
  const filtered = last == null ? arr : arr.filter((x) => x !== last);
  return filtered[Math.floor(Math.random() * filtered.length)] || arr[0];
}

function getCulturalBusinessGuidance(businessType: string): string {
  const businessLower = businessType.toLowerCase();

  if (businessLower.includes('bank') || businessLower.includes('financial') || businessLower.includes('money')) {
    return `💰 FINANCIAL SERVICES GUIDANCE:
- GOOD: Show families saving for goals, mobile money transfers, small business growth
- GOOD: Simple money concepts like "save more", "send money easily", "grow your business"
- BAD: Trading charts, stock market graphs, complex investment diagrams
- BAD: Corporate banking halls, suited executives, abstract financial concepts`;
  }

  if (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('app')) {
    return `📱 TECHNOLOGY GUIDANCE:
- GOOD: People using smartphones naturally, solving everyday problems with apps
- GOOD: Simple tech benefits like "stay connected", "make life easier", "save time"
- BAD: Complex coding screens, server rooms, abstract digital concepts
- BAD: Futuristic tech imagery that feels disconnected from reality`;
  }

  if (businessLower.includes('health') || businessLower.includes('medical')) {
    return `🏥 HEALTHCARE GUIDANCE:
- GOOD: Families staying healthy, accessible medical care, community wellness
- GOOD: Simple health messages like "stay healthy", "care for family", "feel better"
- BAD: Complex medical equipment, sterile hospital environments, clinical imagery
- BAD: Abstract health concepts that don't connect to daily life`;
  }

  if (businessLower.includes('education') || businessLower.includes('school')) {
    return `📚 EDUCATION GUIDANCE:
- GOOD: Students learning practical skills, community education, real-world applications
- GOOD: Simple learning concepts like "learn new skills", "grow your knowledge", "build your future"
- BAD: Abstract academic concepts, complex educational theories, sterile classrooms
- BAD: Western educational imagery that doesn't reflect local learning environments`;
  }

  return `🏢 GENERAL BUSINESS GUIDANCE:
- GOOD: Real people using services, community-focused business interactions
- GOOD: Simple value propositions that connect to everyday life and local needs
- BAD: Abstract corporate concepts, complex business processes, generic office imagery
- BAD: Western business imagery that doesn't reflect local business culture`;
}


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

  // Build culturally intelligent visual instructions
  let culturalInstructions = '';
  const location = brandProfile.location || 'Global';
  const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'botswana', 'malawi'];
  const isAfricanCountry = africanCountries.some(country => location.toLowerCase().includes(country.toLowerCase()));

  // Build people inclusion instructions based on toggle
  let peopleInstructions = '';
  if (options.includePeopleInDesigns === false) {
    peopleInstructions = `\n\n👥 PEOPLE EXCLUSION REQUIREMENT:\n- MANDATORY: Create a clean, professional design WITHOUT any people or human figures\n- AVOID: Any human faces, bodies, or silhouettes\n- FOCUS: Products, services, abstract elements, or clean minimalist design\n- STYLE: Professional, clean aesthetics without human elements\n- EMPHASIS: Brand elements, typography, and non-human visual elements`;
  } else {
    if (isAfricanCountry) {
      peopleInstructions = `\n\n👥 PEOPLE INCLUSION (AFRICAN REPRESENTATION):\n- Include authentic Black/African people who represent the target market\n- Show people who would actually use ${businessType} services\n- Display local African people in settings relevant to ${businessType} business\n- Ensure faces are fully visible, well-lit, and anatomically correct\n- PRIORITY: 80%+ of people should be Black/African for cultural authenticity\n- Context: Show people in ${businessType}-relevant settings, not generic offices`;
    } else {
      peopleInstructions = `\n\n👥 PEOPLE INCLUSION (DIVERSE REPRESENTATION):\n- Include diverse, authentic people who represent the target market\n- Show people who would actually use ${businessType} services\n- Display people in settings relevant to ${businessType} business\n- Ensure faces are fully visible, well-lit, and anatomically correct\n- Context: Show people in ${businessType}-relevant settings`;
    }
  }

  // Add cultural intelligence for visual elements
  if (isAfricanCountry) {
    const businessSpecificGuidance = getCulturalBusinessGuidance(businessType);
    culturalInstructions = `\n\n🌍 AFRICAN CULTURAL INTELLIGENCE:\n- AVOID: Complex trading graphs, stock charts, or financial diagrams that are hard to understand\n- AVOID: Western corporate imagery that doesn't resonate locally\n- AVOID: Abstract business concepts that feel disconnected from daily life\n- USE: Simple, clear visuals that everyday people can relate to\n- USE: Local cultural elements, colors, and symbols that feel familiar\n- USE: Real-life scenarios people experience (family, community, daily activities)\n- FOCUS: Visual storytelling that connects with local values and experiences\n- SIMPLICITY: Keep visual elements clean and easy to understand at first glance\n- AUTHENTICITY: Show genuine African environments, not generic stock imagery\n\n${businessSpecificGuidance}`;
  }

  // Style/Layout/Typography variation (avoid repeating last style per brand/platform)
  const styles = ['modern-minimal', 'bold-color-blocking', 'editorial-magazine', 'organic-textured', 'geometric-abstract', 'photo-forward', 'duotone', 'retro-modern', 'ultra-clean', 'dynamic-diagonal'];
  const layouts = ['grid', 'asymmetrical', 'centered', 'diagonal-flow', 'layered-collage', 'rule-of-thirds', 'framed', 'split-screen'];
  const typographySet = ['bold sans-serif headline + light subhead', 'elegant serif display + sans body', 'condensed uppercase headline', 'playful rounded sans', 'high-contrast modern serif'];
  const effects = ['subtle grain', 'soft vignette', 'gentle drop shadow', 'glassmorphism card', 'gradient overlay'];

  const bKey = brandKey(brandProfile, platform);
  const lastStyle = recentStyles.get(bKey);
  const chosenStyle = pickNonRepeating(styles, lastStyle);
  recentStyles.set(bKey, chosenStyle);
  const chosenLayout = pickNonRepeating(layouts);
  const chosenType = pickNonRepeating(typographySet);
  const chosenEffect = pickNonRepeating(effects);


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
    // Only include website if it actually exists in brand profile - NEVER generate fake URLs
    if (website && website.trim() && !website.includes('example.com') && !website.includes('placeholder')) {
      contacts.push(`🌐 ${website}`);
    }
    if (address) contacts.push(`📍 ${address}`);

    if (contacts.length > 0) {
      contactInstruction = `\n\n📞 CONTACT INFORMATION (Include in design):\n${contacts.join('\n')}\n- Display contact info prominently in footer/corner area\n- Ensure contact details are readable and well-formatted\n- Use professional styling that complements the brand colors`;
    }

  }

  return `🎨 Create a ${visualStyle} social media design for ${brandProfile.businessName} (${businessType}) for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

🎯 VISUAL CONTEXT REQUIREMENT: ${visualContext}${serviceVisualContext}

🎛️ STYLE VARIATION DIRECTIVES (Do not repeat last style for this brand/platform):
- Design Style: ${chosenStyle}
- Layout: ${chosenLayout}
- Typography: ${chosenType}
- Subtle Effects: ${chosenEffect}

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
❌ Company name with colon format in text (e.g., "PAYA:", "COMPANY:")
❌ Text containing "journey", "everyday", or repetitive corporate language
❌ Fake website URLs or made-up domain names (e.g., "payaventures.com")
❌ Fictional contact information or web addresses not provided in brand profile
❌ Website mockups or computer screens showing fake websites
❌ Complex trading graphs, stock charts, or financial diagrams
❌ Western corporate imagery that doesn't resonate with local culture
❌ Generic business charts, analytics dashboards, or complex data visualizations
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
- Include clear, readable headline text in the design (NO company name with colon)
- Include supporting subheadline text that complements the headline
- NEVER use text like "COMPANY:", "PAYA:", or "BusinessName:" in the design
- NEVER include "journey", "everyday", or repetitive corporate language in design text
- Ensure all text is legible and professionally styled
- Text should be integrated naturally into the design composition
- Use typography that matches the brand aesthetic
- Headlines in design should be engaging phrases, not company announcements

🎯 TEXT-CAPTION ALIGNMENT STRATEGY:
- The text in the image should be the "hook" that grabs attention
- Make the image text compelling enough that people want to read the caption to learn more
- Think: Image text = "What" or "Why should I care?" → Caption = "How" or "What's in it for me?"
- Example: Image shows "Banking Made Simple" → Caption explains how it's simple and what that means

🔤 **CRITICAL SPELLING & TEXT QUALITY REQUIREMENTS:**
- **PERFECT SPELLING**: Every single word MUST be spelled correctly
- **NO MISSPELLINGS**: Double-check all text for spelling errors before generating
- **PROFESSIONAL LANGUAGE**: Use proper business English throughout
- **SPELL CHECK MANDATORY**: All text must pass professional spell-check standards
- **COMMON ERROR PREVENTION**: Avoid common misspellings like:
  * "bussiness" → Use "business"
  * "servises" → Use "services"
  * "profesional" → Use "professional"
  * "experiance" → Use "experience"
  * "qualaty" → Use "quality"
- **INDUSTRY TERMS**: Use correct spelling for industry-specific terms
- **PLURAL VALIDATION**: Ensure plurals are spelled correctly (services, products, experiences)

🚫 **CRITICAL: NEVER GENERATE FAKE INFORMATION IN DESIGN:**
- NEVER create fake website URLs (e.g., "payaventures.com" when real site is "paya.co.ke")
- NEVER invent domain names or web addresses not provided in brand profile
- NEVER show fake contact information
- Only use actual contact details if explicitly provided in brand profile
- If no website is provided, don't include any website URL in the design
- Stick to actual business information only
- **PROOFREADING**: Review all text content for spelling accuracy before finalizing
- **CREDIBILITY**: Spelling errors destroy professional credibility - avoid at all costs

Create a visually stunning design that stops scrolling and drives engagement while maintaining perfect brand consistency.${contactInstruction}${peopleInstructions}${culturalInstructions}`;
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

📝 CONTENT REQUIREMENTS - MUST WORK TOGETHER AS ONE STORY:
1. HEADLINE (max 6 words): This will appear as text IN the image design - make it compelling
2. SUBHEADLINE (max 25 words): This will also appear IN the image - should support the headline
3. CAPTION (50-100 words): Should continue the story started by the headline/subheadline in the image
4. CALL-TO-ACTION (2-4 words): Action-oriented and contextually appropriate
5. HASHTAGS (EXACTLY ${hashtagCount}): ${platform === 'instagram' ? '5 hashtags for Instagram' : '3 hashtags for other platforms'}

🔗 CONTENT COHESION REQUIREMENTS:
- The headline and subheadline will be embedded as text elements in the visual design
- Your caption must continue and expand on the message shown in the image text
- Think of it as: Image shows the "hook" → Caption provides the "story" → CTA drives "action"
- Example: If image shows "Smart Banking" → Caption explains why it's smart and what that means for the customer

🚫 CRITICAL HEADLINE RESTRICTIONS:
- NEVER start with company name followed by colon (e.g., "PAYA:", "COMPANY:")
- NEVER use "journey", "everyday", or repetitive corporate language
- Headlines should be engaging standalone phrases, not company announcements

🚫 CRITICAL CONTENT RESTRICTIONS:
- NEVER generate fake website URLs or domain names
- NEVER assume the business has a website unless explicitly provided
- NEVER create fictional contact information or web addresses
- Only use actual contact details provided in the brand profile

🎨 WRITING GUIDELINES:
- Write in a conversational, authentic tone that resonates with local culture
- Avoid generic corporate speak and complex business jargon
- Be specific about the business value proposition in simple, relatable terms
- Include relevant details about the location or services
- Make it engaging and scroll-stopping
- Ensure the content matches what's shown in the image
- NEVER use the words "journey", "everyday", or repeat phrasing from prior posts
- NEVER start headlines with company name followed by colon (e.g., "PAYA:", "CompanyName:")
- Use DISTINCT vocabulary and a different angle from common phrases
- Vary sentence length; avoid template-like structures
- Headlines should be engaging and standalone, not company-prefixed
- CULTURAL INTELLIGENCE: Use language and concepts that local people easily understand
- AVOID: Complex financial terms, technical jargon, or Western business concepts that don't translate
- AVOID: Repetitive patterns like "makes [business type] effortless and effective—crafted for [location]"
- AVOID: Generic templates that sound robotic or formulaic
- AVOID: Assuming the business has a website or online presence unless explicitly provided
- AVOID: Creating fake website URLs, domain names, or contact information
- USE: Simple, clear language that connects with everyday experiences and local values
- USE: Fresh, varied vocabulary and sentence structures for each generation
- USE: Only actual contact information provided in the brand profile
- Uniqueness token (do not print): ${uniqueId}

🚨 CRITICAL CONTENT ALIGNMENT:
- The headline and subheadline you generate MUST match the text elements shown in the image
- If the image shows "Smart Banking Solutions", your headline should be "Smart Banking Solutions"
- If the image shows "Quality You Can Trust", your caption should reinforce this message
- NEVER contradict what's visually shown in the image with different text in the caption
- However, NEVER generate headlines with company name prefix or "journey" language, even if it appears in the image
- The caption should tell the story that the visual headline/subheadline starts

🌍 PLATFORM & CULTURAL CONTEXT:
- Platform: ${String(platform).toLowerCase() === 'instagram' ? 'Instagram - Visual storytelling with lifestyle focus' : 'Professional business platform'}
- Location: ${brandProfile.location || 'Global'} - Use appropriate cultural context
- Tone: Conversational and authentic, not corporate
- Focus: Specific benefits and value propositions that relate to the visual content

💡 CONTENT STRATEGY - CREATE A COHESIVE STORY:
1. HEADLINE (in image): The attention-grabbing hook - what makes people stop scrolling
2. SUBHEADLINE (in image): The supporting detail that adds context to the hook
3. CAPTION (below image): The story that explains why the headline matters and what's in it for them
4. Think of it as a conversation: Image text starts it, caption continues it, CTA completes it

EXAMPLE FLOW:
- Image shows: "Smart Banking" (headline) + "Technology that works for you" (subheadline)
- Caption continues: "No more complicated apps or confusing processes. Paya makes banking as simple as sending a text message. Whether you're saving for your family's future or growing your business, our technology adapts to how you actually live and work in Kenya."

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

      // Anti-repetition enforcement
      const key = brandKey(brandProfile, platform);
      const recent = recentOutputs.get(key) || { headlines: [], captions: [] };

      // Enhanced caption validation with multiple checks
      let caption = parsed.caption || '';

      // Check for repetitive or problematic captions
      const captionHasJourney = /\b(journey|everyday)\b/i.test(caption);
      const captionTooSimilar = tooSimilar(caption, recent.captions, 0.40);
      const captionIsGeneric = caption.includes('Experience the excellence of') ||
        caption.includes('makes financial technology company effortless') ||
        /makes .+ effortless and effective/i.test(caption) ||
        /makes .+ company effortless and effective/i.test(caption) ||
        caption.includes('crafted for Kenya') ||
        caption.includes('crafted for Nigeria') ||
        caption.includes('crafted for Ghana') ||
        /crafted for [A-Z][a-z]+/i.test(caption);
      const captionIsEmpty = !caption || caption.trim().length === 0;

      if (captionIsEmpty || captionHasJourney || captionTooSimilar || captionIsGeneric) {
        console.log(`🚫 Revo 2.0: Rejecting caption "${caption}" - isEmpty:${captionIsEmpty}, hasJourney:${captionHasJourney}, tooSimilar:${captionTooSimilar}, isGeneric:${captionIsGeneric}`);
        caption = generateUniqueFallbackCaption(brandProfile, businessType, creativityBoost);
      }

      let headline = stripOverusedWords(parsed.headline || '');

      // Multiple validation layers for headline quality
      const hasJourneyWords = /\b(journey|everyday)\b/i.test(headline);
      const hasColonPrefix = /^[A-Z]+:\s/.test(headline);
      const isTooSimilar = tooSimilar(headline, recent.headlines, 0.55);
      const isEmpty = !headline || headline.trim().length === 0;

      if (isEmpty || hasJourneyWords || hasColonPrefix || isTooSimilar) {
        console.log(`🚫 Revo 2.0: Rejecting headline "${headline}" - isEmpty:${isEmpty}, hasJourney:${hasJourneyWords}, hasColon:${hasColonPrefix}, tooSimilar:${isTooSimilar}`);
        headline = generateUniqueHeadline(brandProfile, businessType, selectedTheme);
      }

      // Remember accepted output for future anti-repetition checks
      rememberOutput(key, { headline, caption });

      return {
        caption: sanitizeGeneratedCopy(caption, brandProfile, businessType) as string,
        hashtags: finalHashtags,
        headline: sanitizeGeneratedCopy(headline, brandProfile, businessType),
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

  // Choose a theme deterministically from creativityLevel for variety
  const themes = ['innovation-focused', 'results-driven', 'customer-centric', 'quality-emphasis', 'expertise-showcase'];
  const selectedTheme = themes[creativityLevel % themes.length];

  const base = `${brandProfile.businessName}`;
  const svc = todayService?.serviceName || businessType;
  const loc = brandProfile.location || 'your area';

  const uniqueCaptions = todayService ? [
    `${base} puts ${svc} front and center today—authentic, high-impact results for ${loc}.`,
    `${svc} is today's focus. See how ${base} makes it practical, useful, and genuinely better for ${loc}.`,
    `On the agenda: ${svc}. Real benefits, clear value—delivered by ${base}.`,
    `${svc}, done right. ${base} brings a human, professional touch to ${businessType.toLowerCase()} in ${loc}.`,
    `Today's highlight: ${svc}. Built for your needs by ${base}—reliable, modern, and effective.`,
    `From idea to action—${svc} by ${base}. Designed to work for real people in ${loc}.`,
    `We’re featuring ${svc}: thoughtful details, measurable outcomes. That’s ${base}.`,
    `${svc} that fits your day. ${base} focuses on what matters and cuts the noise.`
  ] : [
    `${base} brings a fresh take on ${businessType.toLowerCase()} in ${loc}—useful, polished, and built for real-world impact.`,
    `Clear, modern ${businessType.toLowerCase()}—delivered by ${base} for people in ${loc}.`,
    `From strategy to delivery, ${base} elevates ${businessType.toLowerCase()} with a practical, human approach.`,
    `${base} makes ${businessType.toLowerCase()} effortless and effective—crafted for ${loc}.`,
    `Quality-first ${businessType.toLowerCase()} from ${base}. Thoughtful details, consistent results.`,
    `Real impact, no fluff. ${base} leads with smart ${businessType.toLowerCase()} built for ${loc}.`,
    `${base}: a better standard for ${businessType.toLowerCase()}—reliable, clean, and professional.`,
    `We keep it simple—and excellent. ${base} for ${businessType.toLowerCase()} that actually works.`
  ];

  const selectedCaption = uniqueCaptions[creativityLevel % uniqueCaptions.length];
  const hashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount, todayService);

  const headline = generateUniqueHeadline(brandProfile, businessType, selectedTheme);
  const subheadline = generateUniqueSubheadline(brandProfile, businessType, selectedTheme, todayService);

  // Anti-repetition memory
  const key = brandKey(brandProfile, platform);
  rememberOutput(key, { headline, caption: selectedCaption });

  return {
    caption: sanitizeGeneratedCopy(selectedCaption, brandProfile, businessType) as string,
    hashtags,
    headline: sanitizeGeneratedCopy(headline, brandProfile, businessType),
    subheadline: sanitizeGeneratedCopy(subheadline, brandProfile, businessType),
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

  // Financial services - culturally appropriate visuals
  if (businessLower.includes('bank') || businessLower.includes('financial') || businessLower.includes('money') || businessLower.includes('payment')) {
    return 'Simple, relatable financial scenarios: people saving money, family financial planning, mobile money transactions, or small business growth - AVOID complex charts or trading graphs';
  }

  // Technology - accessible tech visuals
  if (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('digital') || businessLower.includes('app')) {
    return 'Everyday technology use: people using smartphones, simple app interfaces, digital solutions solving real problems - AVOID complex coding or server imagery';
  }

  // Healthcare - community-focused health
  if (businessLower.includes('health') || businessLower.includes('medical') || businessLower.includes('clinic') || businessLower.includes('hospital')) {
    return 'Community healthcare: families staying healthy, accessible medical care, wellness in daily life - AVOID complex medical equipment or sterile hospital imagery';
  }

  // Education - practical learning
  if (businessLower.includes('education') || businessLower.includes('school') || businessLower.includes('learning') || businessLower.includes('training')) {
    return 'Real-world learning: students in classrooms, practical skills training, community education - AVOID abstract academic concepts';
  }

  // Retail/Commerce - local market feel
  if (businessLower.includes('market') || businessLower.includes('retail') || businessLower.includes('shop') || businessLower.includes('store')) {
    return 'Local commerce: vibrant markets, customers shopping, small business interactions, community trade - AVOID sterile corporate retail environments';
  }

  // Food & Hospitality - community dining
  if (businessLower.includes('restaurant') || businessLower.includes('food') || businessLower.includes('cafe') || businessLower.includes('catering')) {
    return 'Community dining: families sharing meals, local food culture, authentic cooking, social dining experiences - AVOID fancy fine dining that feels disconnected';
  }

  // Agriculture - practical farming
  if (businessLower.includes('agriculture') || businessLower.includes('farming') || businessLower.includes('crop')) {
    return 'Real farming life: farmers working the land, crop growth, agricultural community, practical farming solutions - AVOID industrial agriculture imagery';
  }

  // Transportation - everyday mobility
  if (businessLower.includes('transport') || businessLower.includes('logistics') || businessLower.includes('delivery')) {
    return 'Everyday transportation: people traveling, goods being delivered, community mobility solutions - AVOID complex logistics diagrams';
  }

  // Default based on concept
  if (concept.includes('office') || concept.includes('workspace')) {
    return 'Accessible business environment: real people working, practical business solutions, community-focused workspace';
  }

  if (concept.includes('market') || concept.includes('customer')) {
    return 'Community-focused business environment with authentic local interactions';
  }

  return 'Authentic business environment that connects with everyday life and local community values';
}

/**
 * Generate unique fallback caption
 */
function generateUniqueFallbackCaption(brandProfile: any, businessType: string, creativityLevel: number): string {
  const business = brandProfile?.businessName || 'Our Business';
  const location = brandProfile?.location || 'your area';
  const service = businessType || 'services';

  // Generate timestamp-based seed for more variety
  const timeSeed = Date.now() + creativityLevel;
  const variationIndex = timeSeed % 24; // 24 different caption styles

  // These captions are designed to work with common headline patterns
  const captionTemplates = [
    // For "Smart/Modern" headlines - explain the simplicity
    `No more complicated processes or confusing interfaces. ${business} makes ${service.toLowerCase()} as simple as it should be. Whether you're managing daily tasks or planning for the future, our approach adapts to how you actually live and work in ${location}.`,

    // For "Quality/Trust" headlines - build on reliability
    `You deserve ${service.toLowerCase()} that actually works. ${business} has built our reputation in ${location} by delivering consistent results, honest communication, and genuine care for every customer. That's not just a promise—it's how we do business.`,

    // For "Innovation/Technology" headlines - make it relatable
    `Technology should make life easier, not more complicated. ${business} brings cutting-edge ${service.toLowerCase()} solutions to ${location}, but we keep the experience human. Advanced capabilities, simple interactions—that's how innovation should work.`,

    // For "Community/Local" headlines - emphasize connection
    `${business} isn't just another ${service.toLowerCase()} provider—we're part of the ${location} community. We understand local needs, respect local values, and build lasting relationships. When you succeed, we succeed.`,

    // For "Results/Performance" headlines - show outcomes
    `Talk is cheap. Results matter. ${business} has helped countless people in ${location} achieve their goals through reliable ${service.toLowerCase()}. We measure our success by your success, and we're proud of what we've accomplished together.`,

    // For "Simple/Easy" headlines - explain the ease
    `Why should ${service.toLowerCase()} be complicated? ${business} strips away the unnecessary complexity and focuses on what actually matters to you. Clear communication, straightforward processes, and results you can see—that's our approach in ${location}.`,

    // For "Professional/Expert" headlines - demonstrate expertise
    `Experience makes the difference. ${business} brings years of ${service.toLowerCase()} expertise to ${location}, but we never forget that every customer is unique. Professional service with a personal touch—that's what sets us apart.`,

    // For "Affordable/Value" headlines - justify the value
    `Great ${service.toLowerCase()} doesn't have to break the bank. ${business} offers exceptional value to ${location} by focusing on efficiency, transparency, and results. You get premium quality without the premium price tag.`,

    // For "Fast/Efficient" headlines - explain the speed
    `Time is precious. ${business} respects that by delivering fast, efficient ${service.toLowerCase()} without cutting corners. We've streamlined our processes so you can get what you need quickly, without sacrificing quality in ${location}.`,

    // For "Reliable/Dependable" headlines - build trust
    `When you need ${service.toLowerCase()} you can count on, ${business} delivers. We've built our reputation in ${location} one satisfied customer at a time. Consistent quality, reliable service, and genuine care—that's what you can expect from us.`,

    // For "Custom/Personalized" headlines - show individual attention
    `One size doesn't fit all. ${business} understands that every customer in ${location} has unique needs and goals. That's why we take the time to listen, understand, and deliver ${service.toLowerCase()} solutions that actually fit your situation.`,

    // For "Secure/Safe" headlines - address peace of mind
    `Your security is our priority. ${business} uses industry-leading practices to protect what matters most to you. In ${location}, you can trust us with your ${service.toLowerCase()} needs because we take that responsibility seriously.`,

    // For "Growth/Success" headlines - inspire achievement
    `Your success story starts here. ${business} has helped people throughout ${location} achieve their goals through strategic ${service.toLowerCase()} support. We're not just a service provider—we're your partner in growth.`,

    // For "Convenient/Accessible" headlines - highlight ease of access
    `${service.toLowerCase()} should fit into your life, not the other way around. ${business} makes it convenient for ${location} residents to get what they need, when they need it, how they need it. Accessibility without compromise.`,

    // For "Transparent/Honest" headlines - build credibility
    `No hidden fees, no confusing terms, no surprises. ${business} believes in complete transparency with our ${location} customers. You'll always know exactly what you're getting and what it costs—that's our commitment to honest business.`,

    // For "Local/Community" headlines - emphasize local connection
    `${location} is our home too. ${business} is deeply rooted in this community, and we understand what makes it special. Our ${service.toLowerCase()} reflects local values while meeting global standards.`,

    // For "Experienced/Proven" headlines - showcase track record
    `Results speak louder than promises. ${business} has a proven track record of delivering exceptional ${service.toLowerCase()} throughout ${location}. Our experience means you get solutions that actually work, backed by real success stories.`,

    // For "Flexible/Adaptable" headlines - show versatility
    `Life changes, and your ${service.toLowerCase()} should adapt with you. ${business} offers flexible solutions that grow and change as your needs evolve. In ${location}, we're known for our ability to adjust and deliver exactly what you need.`,

    // For "Comprehensive/Complete" headlines - show full service
    `Why work with multiple providers when one can handle everything? ${business} offers comprehensive ${service.toLowerCase()} solutions for ${location}, covering all your needs under one roof. Complete service, consistent quality, single point of contact.`,

    // For "Innovative/Forward-thinking" headlines - balance innovation with practicality
    `The future of ${service.toLowerCase()} is here, but it's designed for real people living real lives in ${location}. ${business} combines innovative approaches with practical solutions that make sense for your daily routine.`,

    // For "Dedicated/Committed" headlines - show dedication
    `Your success is our mission. ${business} is completely dedicated to delivering outstanding ${service.toLowerCase()} results for every customer in ${location}. We don't just work for you—we work with you to achieve your goals.`,

    // For "Efficient/Streamlined" headlines - explain the process
    `We've eliminated the waste and focused on what works. ${business} has streamlined our ${service.toLowerCase()} delivery to give ${location} customers maximum value with minimum hassle. Efficient processes, exceptional results.`,

    // For "Trusted/Established" headlines - leverage reputation
    `Trust is earned, not given. ${business} has earned the confidence of ${location} through consistent delivery of quality ${service.toLowerCase()}. Our reputation is built on real results and genuine relationships with every customer.`,

    // For "Personalized/Individual" headlines - emphasize personal attention
    `You're not just another customer—you're an individual with unique needs and goals. ${business} takes the time to understand what matters most to you and delivers ${service.toLowerCase()} solutions that reflect your personal priorities in ${location}.`
  ];

  return captionTemplates[variationIndex];
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
  const svc = (businessType || '').toLowerCase();
  const brand = (brandProfile?.businessName || '').trim();

  const verbs = ['Build', 'Shape', 'Refine', 'Launch', 'Elevate', 'Design', 'Create', 'Focus', 'Deliver', 'Unlock'];
  const adjectives = ['Real', 'Bold', 'Smart', 'Clean', 'Modern', 'Authentic', 'Fresh', 'Precise', 'Human', 'Premium'];
  const nouns = ['Impact', 'Value', 'Clarity', 'Momentum', 'Results', 'Quality', 'Growth', 'Presence', 'Performance', 'Standards'];
  const svcNouns = [svc, `${svc} Results`, `${svc} Quality`, `${svc} Excellence`].filter(Boolean);

  // Theme modifiers to bias word choice subtly
  const themeBias: Record<string, { adj?: string[]; noun?: string[]; verb?: string[] }> = {
    'innovation-focused': { adj: ['Modern', 'Bold', 'Fresh'], noun: ['Momentum', 'Next'], verb: ['Launch', 'Unlock'] },
    'results-driven': { adj: ['Real', 'Precise'], noun: ['Results', 'Impact', 'Performance'], verb: ['Deliver', 'Drive'] },
    'customer-centric': { adj: ['Human', 'Authentic'], noun: ['Value', 'Experience'], verb: ['Create', 'Design'] },
    'quality-emphasis': { adj: ['Premium', 'Clean'], noun: ['Quality', 'Standards', 'Clarity'], verb: ['Refine'] },
    'expertise-showcase': { adj: ['Smart'], noun: ['Excellence'], verb: ['Elevate', 'Shape'] }
  };

  const bias = themeBias[theme] || {};
  function pick<T>(arr: T[], extra?: T[]): T { const pool = extra ? [...arr, ...extra] : arr; return pool[Math.floor(Math.random() * pool.length)]; }

  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const pattern = Math.floor(Math.random() * 4);
    let candidate = '';
    if (pattern === 0) candidate = `${pick(verbs, bias.verb)} ${pick(nouns, bias.noun)}`;
    else if (pattern === 1) candidate = `${pick(adjectives, bias.adj)} ${pick(nouns, bias.noun)}`;
    else if (pattern === 2) candidate = `${pick(adjectives, bias.adj)} ${pick(svcNouns)}`;
    else candidate = `${pick(verbs, bias.verb)} ${pick(svcNouns)}`;

    // Enforce max 6 words and strip overused terms
    candidate = stripOverusedWords(candidate).trim();
    const words = candidate.split(/\s+/);
    if (candidate && words.length <= 6 && !/\b(journey|everyday)\b/i.test(candidate) && !/^[A-Z]+:\s/.test(candidate)) {
      return candidate;
    }
  }

  // Fallback simple unique line
  return stripOverusedWords(`${pick(adjectives)} ${pick(nouns)}`);
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