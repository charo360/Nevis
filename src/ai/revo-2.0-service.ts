/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses Gemini 2.5 Flash Image Preview for enhanced content generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { BrandProfile, Platform } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';
import { resolveLocationFromProfile } from '@/ai/tools/local-data';

import { ensureExactDimensions } from './utils/image-dimensions';

/**
 * Generate diverse, context-aware African content based on business type and target audience
 * Provides a balanced mix of traditional and modern African contexts
 */
function generateAfricanContentVariety(businessType: string, brandProfile: BrandProfile, locationLower: string): string {
  const businessTypeLower = businessType.toLowerCase();
  const targetAudience = brandProfile.targetAudience?.toLowerCase() || '';

  // Create a diverse mix of African contexts - both traditional and modern
  const allAfricanContexts = [
    // Modern Professional Contexts
    'Show African professionals in modern office environments, corporate meetings, or business centers',
    'Depict African entrepreneurs in contemporary business settings, tech hubs, or innovation centers',
    'Include African businesspeople using modern technology, digital tools, or professional equipment',
    'Show African professionals in modern workspaces, co-working environments, or startup incubators',

    // Traditional Market & Community Contexts
    'Show African people in vibrant local markets, community gatherings, or traditional business settings',
    'Depict African families and individuals in authentic local environments, cultural celebrations, or community events',
    'Include African people in traditional marketplaces, local shops, or community-based business activities',
    'Show African individuals in cultural settings, traditional ceremonies, or local community interactions',

    // Urban & Modern Lifestyle Contexts
    'Show African people in modern urban settings, shopping centers, or contemporary lifestyle environments',
    'Depict African individuals in modern cafes, restaurants, or contemporary social settings',
    'Include African people in modern transportation, urban mobility, or city life scenarios',
    'Show African individuals in modern entertainment venues, cultural centers, or contemporary social spaces',

    // Educational & Learning Contexts
    'Show African students and professionals in educational settings, libraries, or learning environments',
    'Depict African people in training sessions, workshops, or skill development programs',
    'Include African individuals in modern learning centers, educational institutions, or knowledge-sharing spaces',

    // Healthcare & Wellness Contexts
    'Show African people in healthcare settings, wellness centers, or medical facilities',
    'Depict African individuals in fitness centers, wellness programs, or health-focused environments',
    'Include African people in community health settings, wellness activities, or healthcare access scenarios',

    // Technology & Digital Contexts
    'Show African people using modern technology, mobile devices, or digital platforms',
    'Depict African individuals in tech-enabled environments, digital workspaces, or innovation hubs',
    'Include African people in modern communication settings, digital interactions, or technology adoption scenarios'
  ];

  // Business-specific context enhancement
  let businessContext = '';
  if (businessTypeLower.includes('fintech') || businessTypeLower.includes('banking') || businessTypeLower.includes('finance')) {
    businessContext = ' Focus on financial services, digital banking, payment systems, or financial technology usage.';
  } else if (businessTypeLower.includes('health') || businessTypeLower.includes('medical')) {
    businessContext = ' Focus on healthcare services, medical facilities, wellness programs, or health technology.';
  } else if (businessTypeLower.includes('education') || businessTypeLower.includes('training')) {
    businessContext = ' Focus on educational services, learning environments, skill development, or knowledge sharing.';
  } else if (businessTypeLower.includes('technology') || businessTypeLower.includes('software')) {
    businessContext = ' Focus on technology usage, digital innovation, software development, or tech-enabled services.';
  } else if (businessTypeLower.includes('retail') || businessTypeLower.includes('ecommerce')) {
    businessContext = ' Focus on retail services, shopping experiences, product sales, or customer interactions.';
  }

  // Randomly select a context to ensure variety
  const selectedContext = allAfricanContexts[Math.floor(Math.random() * allAfricanContexts.length)];

  return `CONTENT VARIETY: ${selectedContext}${businessContext} Ensure authentic representation of diverse African backgrounds, communities, and contexts.`;
}

// Initialize AI clients lazily to avoid build-time issues
let ai: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

function getGoogleAI(): GoogleGenerativeAI {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return ai;
}

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}


// Ensure website URL is displayed as www.example.com (strip protocol, add www., no trailing slash)
function ensureWwwWebsiteUrl(url?: string): string {
  if (!url) return '';
  const base = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
  return base ? `www.${base}` : '';
}

// Revo 2.0 uses Gemini 2.5 Flash Image Preview (the only working image generation model)
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
  includeContacts?: boolean;
  scheduledServices?: ScheduledService[]; // NEW: Scheduled services integration
}

export interface Revo20GenerationResult {
  imageUrl: string;
  model: string;
  qualityScore: number;
  processingTime: number;
  enhancementsApplied: string[];
  headline: string;
  subheadline: string;
  caption: string;
  captionVariations?: string[];
  cta: string;
  hashtags: string[];
  businessIntelligence: {
    strategy: string;
    targetAudience: string;
    keyMessage: string;
    competitiveAdvantage: string;
  };
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
 * STANDARDIZED: ALL platforms use 992x1056px format (no stories/reels)
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  // ALL platforms use 992x1056px format for maximum quality
  return '992x1056px HD (Maximum quality)';
}

/**
 * Get platform-specific description for prompts
 */
function getPlatformDescription(platform: string): string {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes('instagram')) {
    if (platformLower.includes('story') || platformLower.includes('reel')) {
      return 'mobile-first vertical viewing with high engagement';
    }
    return 'mobile-first square feed posts with high visual impact';
  }

  if (platformLower.includes('facebook')) {
    return 'news feed display with broad audience appeal';
  }

  if (platformLower.includes('twitter')) {
    return 'timeline display with quick visual impact';
  }

  if (platformLower.includes('linkedin')) {
    return 'professional networking with business-focused content';
  }

  if (platformLower.includes('tiktok')) {
    return 'vertical mobile video with Gen Z appeal';
  }

  return 'social media engagement and brand awareness';
}

/**
 * Generate enhanced creative concept using GPT-4
 */
async function generateCreativeConcept(options: Revo20GenerationOptions): Promise<any> {
  const { businessType, platform, brandProfile, visualStyle = 'modern', scheduledServices } = options;

  // Determine service focus based on scheduled services priority
  let serviceFocus = businessType;
  let serviceContext = '';

  if (scheduledServices && scheduledServices.length > 0) {
    const todaysServices = scheduledServices.filter(s => s.isToday);
    const upcomingServices = scheduledServices.filter(s => s.isUpcoming);

    if (todaysServices.length > 0) {
      serviceFocus = todaysServices.map(s => s.serviceName).join(', ');
      serviceContext = `\n🎯 PRIORITY SERVICES (Focus content on these specific services scheduled for TODAY):
${todaysServices.map(s => `- ${s.serviceName}: ${s.description || 'Available today'}`).join('\n')}

CRITICAL: The creative concept MUST specifically promote these TODAY'S services. Do not create generic business content.`;
      console.log('🎯 [Revo 2.0] Creative concept focusing on TODAY\'S services:', todaysServices.map(s => s.serviceName));
    } else if (upcomingServices.length > 0) {
      serviceFocus = upcomingServices.map(s => s.serviceName).join(', ');
      serviceContext = `\n📅 UPCOMING SERVICES (Build anticipation for these services):
${upcomingServices.map(s => `- ${s.serviceName} (in ${s.daysUntil} days): ${s.description || ''}`).join('\n')}`;
      console.log('📅 [Revo 2.0] Creative concept focusing on UPCOMING services:', upcomingServices.map(s => s.serviceName));
    }
  } else {
    console.log('🏢 [Revo 2.0] Creative concept using general business type (no scheduled services)');
  }

  const prompt = `You are a world-class creative director specializing in ${businessType} businesses.
Create an authentic, locally-relevant creative concept for ${platform} that feels genuine and relatable.

Business Context:
- Type: ${businessType}
- Platform: ${platform}
- Style: ${visualStyle}
- Location: ${brandProfile.location || 'Global'}
- Brand: ${brandProfile.businessName || businessType}
- Service Focus: ${serviceFocus}${serviceContext}

Create a concept that:
1. Feels authentic and locally relevant
2. Uses relatable human experiences
3. Connects emotionally with the target audience
4. Incorporates cultural nuances naturally
5. Avoids generic corporate messaging
${scheduledServices && scheduledServices.length > 0 ? '6. SPECIFICALLY promotes the scheduled services listed above' : ''}

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

  const response = await getOpenAI().chat.completions.create({
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

  try {
    // Resolve global location context once
    const resolved = resolveLocationFromProfile(options.brandProfile);
    if (resolved?.currency && options.brandProfile) {
      // Light augmentation so prompts can reference currency if needed
      (options as any).__resolvedCurrency = resolved.currency;
      (options as any).__resolvedRegion = resolved.region;
    }
    // Auto-detect platform-specific aspect ratio if not provided
    const aspectRatio = options.aspectRatio || getPlatformAspectRatio(options.platform);
    const enhancedOptions = { ...options, aspectRatio };

    console.log(`🎯 Revo 2.0: Using ${aspectRatio} aspect ratio for ${options.platform}`);
    console.log('🌍 Revo 2.0 Brand Profile Location:', {
      location: options.brandProfile?.location,
      hasLocation: !!options.brandProfile?.location,
      locationType: typeof options.brandProfile?.location
    });

    // Step 1: Generate creative concept
    const concept = await generateCreativeConcept(enhancedOptions);

    // Step 2: Generate structured content first (needed for prompt)
    const contentResult = await generateStructuredContent(enhancedOptions, concept);

    // Step 3: Build enhanced prompt with structured content
    let enhancedPrompt = buildEnhancedPromptWithStructuredContent(enhancedOptions, concept, contentResult);

    // Step 3.5: Add contact information at the very end (exactly like Revo 1.5)
    enhancedPrompt = addContactInformationToPrompt(enhancedPrompt, enhancedOptions);

    // Step 4: Generate image with Gemini 2.5 Flash Image Preview
    const imageResult = await generateImageWithGemini(enhancedPrompt, enhancedOptions);

    const processingTime = Date.now() - startTime;

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
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      caption: contentResult.caption,
      captionVariations: contentResult.captionVariations,
      cta: contentResult.cta,
      hashtags: contentResult.hashtags,
      businessIntelligence: contentResult.businessIntelligence
    };

  } catch (error) {
    throw new Error(`Revo 2.0 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build enhanced prompt with structured content integrated into the design
 */
export function buildEnhancedPromptWithStructuredContent(
  options: Revo20GenerationOptions,
  concept: any,
  structuredContent: {
    headline: string;
    subheadline: string;
    cta: string;
  }
): string {
  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern' } = options;
  // Check if location implies a region where local representation is important (for guidance only)
  const locationAutoPeople = !!(options.brandProfile?.location && /(africa|nigeria|kenya|ethiopia|ghana|uganda|tanzania|south\s*africa|rwanda|zambia|zimbabwe|botswana|cameroon|ivory\s*coast|senegal|somalia|sudan|angola|mali|burkina\s*faso|niger|chad|central\s*african\s*republic|congo|democratic\s*republic\s*of\s*congo|gabon|equatorial\s*guinea|sao\s*tome|madagascar|mauritius|seychelles|comoros|malawi|mozambique|lesotho|swaziland|namibia|liberia|sierra\s*leone|guinea|guinea-bissau|cape\s*verde|gambia|benin|togo|burundi|djibouti|eritrea|asia|latin|middle\s*east|europe|usa|united\s*states|canada|australia|new\s*zealand)/i.test(options.brandProfile.location));
  // Respect user's people setting - only include people if explicitly enabled
  const includePeople = options.includePeopleInDesigns === true;

  console.log('👥 People in Designs Check:', {
    includePeopleInDesigns: options.includePeopleInDesigns,
    locationAutoPeople: locationAutoPeople,
    finalIncludePeople: includePeople
  });

  // Determine simple regional guidance based on location
  const location = (brandProfile.location || brandProfile.city || '').trim();
  const locationLower = location.toLowerCase();
  let regionalPeopleInstruction = '';

  console.log('🌍 Revo 2.0 Location Detection:', {
    location: location,
    locationLower: locationLower,
    includePeople: includePeople,
    locationAutoPeople: locationAutoPeople,
    brandProfileLocation: brandProfile.location,
    brandProfileCity: brandProfile.city
  });

  if (includePeople && location) {
    if (/(africa|nigeria|kenya|nairobi|mombasa|kisumu|ethiopia|ghana|uganda|tanzania|south\s*africa|rwanda|zambia|zimbabwe|botswana|cameroon|ivory\s*coast|senegal|somalia|sudan|angola|mali|burkina\s*faso|niger|chad|central\s*african\s*republic|congo|democratic\s*republic\s*of\s*congo|gabon|equatorial\s*guinea|sao\s*tome|madagascar|mauritius|seychelles|comoros|malawi|mozambique|lesotho|swaziland|namibia|liberia|sierra\s*leone|guinea|guinea-bissau|cape\s*verde|gambia|benin|togo|burundi|djibouti|eritrea)/i.test(locationLower)) {
      // Generate diverse, context-aware African content based on business type and target audience
      const africanContentVariety = generateAfricanContentVariety(businessType, brandProfile, locationLower);
      regionalPeopleInstruction = `CRITICAL: Include people in the scene. MUST depict Black African people with authentic African features, skin tones, and natural styling that represents the local region. Do NOT portray non-African, light-skinned, or non-representative models as the primary subjects. Ensure respectful, realistic representation of African people (no stereotypes). This is mandatory for African locations. ${africanContentVariety}`;
      console.log('✅ African location detected - Black people instruction with content variety added');
    } else if (/(asia|india|china|japan|korea|philippines|vietnam|thailand|indonesia|malaysia|pakistan|bangladesh|sri\s*lanka|nepal)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict Asian people reflecting the local region with authentic features and styling. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(latin|mexico|brazil|colombia|argentina|peru|chile|ecuador|bolivia|paraguay|uruguay|venezuela)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict Latin American people with authentic local features and styling. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(middle\s*east|saudi|uae|emirates|qatar|oman|bahrain|kuwait|jordan|lebanon|turkey|israel|egypt|morocco|tunisia|algeria)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict people representative of the Middle East region with authentic features and context-appropriate styling. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(europe|france|germany|italy|spain|uk|united\s*kingdom|ireland|poland|netherlands|belgium|sweden|norway|finland|denmark|switzerland|austria|portugal|greece)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict people representative of the local European region. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(usa|united\s*states|canada|australia|new\s*zealand)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict people representative of the local community and its diversity in this region. Ensure respectful, realistic representation (no stereotypes).';
    }
  } else if (!includePeople) {
    regionalPeopleInstruction = 'DO NOT include any people, faces, or human figures in the design. Focus on objects, products, abstract elements, or architectural elements only.';
    console.log('🚫 People disabled - no people instruction added');
  }

  // Currency/localization guidance
  let currencyInstruction = '';
  const resolvedCurrency = (options as any).__resolvedCurrency as { code: string; symbol: string } | undefined;
  if (resolvedCurrency) {
    currencyInstruction = `Use ${resolvedCurrency.code} (${resolvedCurrency.symbol}) for any pricing visuals. Avoid incorrect foreign symbols.`;
  } else if (/(kenya|nairobi|mombasa|kisumu)/i.test(locationLower)) {
    currencyInstruction = 'Use Kenyan Shilling (KES, KSh) for any pricing visuals. Avoid using €, £, or $ symbols.';
  }

  const finalPrompt = `Create a professional ${businessType} design for ${platform}.

Business: ${brandProfile.businessName || businessType}
Type: ${businessType}
Location: ${brandProfile.location || 'Professional setting'}

Text to Include:
"${structuredContent.headline} | ${structuredContent.subheadline} | ${structuredContent.cta}"

Design Requirements:
- Style: ${visualStyle}, high quality
- Aspect Ratio: ${aspectRatio}
- Platform: ${platform} optimized
${brandProfile.primaryColor ? `- Colors: ${brandProfile.primaryColor}` : ''}
${(brandProfile.logoDataUrl || brandProfile.logoUrl) ? '- Include brand logo prominently' : ''}
${regionalPeopleInstruction ? `- People: ${regionalPeopleInstruction}` : ''}
- Professional, clean composition
- Clear, readable text rendering
- Do NOT include generic service information

Create a high-quality design with integrated text elements.`;

  // Note: Contact information is now added at the very end of the prompt in addContactInformationToPrompt()
  // for better AI attention, similar to how Revo 1.5 works
  return finalPrompt;

}

/**
 * Add contact information to the very end of the prompt (like Revo 1.5) for better AI attention
 */
function addContactInformationToPrompt(prompt: string, options: Revo20GenerationOptions): string {
  try {
    const { brandProfile } = options;
    const includeContacts = options.includeContacts === true;
    const phone = brandProfile?.contactInfo?.phone;
    const email = brandProfile?.contactInfo?.email;
    const website = (brandProfile as any)?.websiteUrl || '';
    const hasAnyContact = (!!phone || !!email || !!website);

    console.log('🔍 [Revo 2.0] Final Contact Information Integration:', {
      includeContacts: includeContacts,
      phone: phone,
      email: email,
      website: website,
      hasAnyContact: hasAnyContact
    });

    const contactInstructions = includeContacts && hasAnyContact
      ? `\n\n🎯 CRITICAL CONTACT INFORMATION INTEGRATION (FINAL INSTRUCTION):\n- MUST integrate these EXACT contact details prominently in the design:\n${phone ? `  📞 Phone: ${phone}\n` : ''}${email ? `  📧 Email: ${email}\n` : ''}${website ? `  🌐 Website: ${ensureWwwWebsiteUrl(website)}\n` : ''}- Place ONLY in footer bar, corner block, or contact strip at the BOTTOM of the image\n- DO NOT include contact info in main content area, headlines, or call-to-action blocks\n- DO NOT use generic service information like "BANKING", "PAYMENTS", etc.\n- ONLY use the specific contact details provided above\n- Make contact info clearly readable and professionally integrated\n- This is a PRIORITY requirement - contact info MUST be visible in the final image\n`
      : `\n\n🚫 CONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website in the image\n- Do NOT include generic service information\n- Do NOT add contact info in main content area\n`;

    const finalPromptWithContacts = prompt + contactInstructions;

    console.log('📝 [Revo 2.0] Contact Instructions Added to End:', {
      originalPromptLength: prompt.length,
      contactInstructionsLength: contactInstructions.length,
      finalPromptLength: finalPromptWithContacts.length,
      contactInstructionsPreview: contactInstructions.substring(0, 150) + '...'
    });

    return finalPromptWithContacts;
  } catch (e) {
    console.warn('Revo 2.0: Final contact info integration failed:', e);
    return prompt;
  }
}

/**
 * Build enhanced prompt for Revo 2.0 (legacy function - kept for compatibility)
 */
function buildEnhancedPrompt(options: Revo20GenerationOptions, concept: any): string {
  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern' } = options;
  // Check if location implies a region where local representation is important (for guidance only)
  const locationAutoPeople = !!(options.brandProfile?.location && /(africa|nigeria|kenya|ethiopia|ghana|uganda|tanzania|south\s*africa|rwanda|zambia|zimbabwe|botswana|cameroon|ivory\s*coast|senegal|somalia|sudan|angola|mali|burkina\s*faso|niger|chad|central\s*african\s*republic|congo|democratic\s*republic\s*of\s*congo|gabon|equatorial\s*guinea|sao\s*tome|madagascar|mauritius|seychelles|comoros|malawi|mozambique|lesotho|swaziland|namibia|liberia|sierra\s*leone|guinea|guinea-bissau|cape\s*verde|gambia|benin|togo|burundi|djibouti|eritrea|asia|latin|middle\s*east|europe|usa|united\s*states|canada|australia|new\s*zealand)/i.test(options.brandProfile.location));
  // Respect user's people setting - only include people if explicitly enabled
  const includePeople = options.includePeopleInDesigns === true;

  console.log('👥 People in Designs Check:', {
    includePeopleInDesigns: options.includePeopleInDesigns,
    locationAutoPeople: locationAutoPeople,
    finalIncludePeople: includePeople
  });

  // Determine simple regional guidance based on location
  const location = (brandProfile.location || brandProfile.city || '').trim();
  const locationLower = location.toLowerCase();
  let regionalPeopleInstruction = '';

  console.log('🌍 Revo 2.0 Location Detection:', {
    location: location,
    locationLower: locationLower,
    includePeople: includePeople,
    locationAutoPeople: locationAutoPeople,
    brandProfileLocation: brandProfile.location,
    brandProfileCity: brandProfile.city
  });

  if (includePeople && location) {
    if (/(africa|nigeria|kenya|nairobi|mombasa|kisumu|ethiopia|ghana|uganda|tanzania|south\s*africa|rwanda|zambia|zimbabwe|botswana|cameroon|ivory\s*coast|senegal|somalia|sudan|angola|mali|burkina\s*faso|niger|chad|central\s*african\s*republic|congo|democratic\s*republic\s*of\s*congo|gabon|equatorial\s*guinea|sao\s*tome|madagascar|mauritius|seychelles|comoros|malawi|mozambique|lesotho|swaziland|namibia|liberia|sierra\s*leone|guinea|guinea-bissau|cape\s*verde|gambia|benin|togo|burundi|djibouti|eritrea)/i.test(locationLower)) {
      // Generate diverse, context-aware African content based on business type and target audience
      const africanContentVariety = generateAfricanContentVariety(businessType, brandProfile, locationLower);
      regionalPeopleInstruction = `CRITICAL: Include people in the scene. MUST depict Black African people with authentic African features, skin tones, and natural styling that represents the local region. Do NOT portray non-African, light-skinned, or non-representative models as the primary subjects. Ensure respectful, realistic representation of African people (no stereotypes). This is mandatory for African locations. ${africanContentVariety}`;
      console.log('✅ African location detected - Black people instruction with content variety added');
    } else if (/(asia|india|china|japan|korea|philippines|vietnam|thailand|indonesia|malaysia|pakistan|bangladesh|sri\s*lanka|nepal)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict Asian people reflecting the local region with authentic features and styling. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(latin|mexico|brazil|colombia|argentina|peru|chile|ecuador|bolivia|paraguay|uruguay|venezuela)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict Latin American people with authentic local features and styling. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(middle\s*east|saudi|uae|emirates|qatar|oman|bahrain|kuwait|jordan|lebanon|turkey|israel|egypt|morocco|tunisia|algeria)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict people representative of the Middle East region with authentic features and context-appropriate styling. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(europe|france|germany|italy|spain|uk|united\s*kingdom|ireland|poland|netherlands|belgium|sweden|norway|finland|denmark|switzerland|austria|portugal|greece)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict people representative of the local European region. Ensure respectful, realistic representation (no stereotypes).';
    } else if (/(usa|united\s*states|canada|australia|new\s*zealand)/i.test(locationLower)) {
      regionalPeopleInstruction = 'Include people in the scene. Depict people representative of the local community and its diversity in this region. Ensure respectful, realistic representation (no stereotypes).';
    }
  } else if (!includePeople) {
    regionalPeopleInstruction = 'DO NOT include any people, faces, or human figures in the design. Focus on objects, products, abstract elements, or architectural elements only.';
    console.log('🚫 People disabled - no people instruction added');
  }

  // Currency/localization guidance
  let currencyInstruction = '';
  const resolvedCurrency = (options as any).__resolvedCurrency as { code: string; symbol: string } | undefined;
  if (resolvedCurrency) {
    currencyInstruction = `Use ${resolvedCurrency.code} (${resolvedCurrency.symbol}) for any pricing visuals. Avoid incorrect foreign symbols.`;
  } else if (/(kenya|nairobi|mombasa|kisumu)/i.test(locationLower)) {
    currencyInstruction = 'Use Kenyan Shilling (KES, KSh) for any pricing visuals. Avoid using €, £, or $ symbols.';
  }

  return `Create a high-quality, professional ${businessType} design for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

VISUAL DIRECTION: ${concept.visualDirection}

DESIGN REQUIREMENTS:
- Style: ${visualStyle}, premium quality
- Aspect Ratio: ${aspectRatio} (${getPlatformDimensionsText(aspectRatio)})
- Platform: ${platform} optimized for ${getPlatformDescription(platform)}
- Business: ${brandProfile.businessName || businessType}
- Location: ${brandProfile.location || 'Professional setting'}
${regionalPeopleInstruction ? `- People: ${regionalPeopleInstruction}` : ''}
${currencyInstruction ? `- Currency: ${currencyInstruction}` : ''}

DESIGN ELEMENTS:
${concept.designElements.map((element: string) => `- ${element}`).join('\n')}

MOOD & EMOTIONS:
- Target emotions: ${concept.targetEmotions.join(', ')}
- Mood keywords: ${concept.moodKeywords.join(', ')}

BRAND INTEGRATION:
- Colors: ${brandProfile.primaryColor ? `Primary: ${brandProfile.primaryColor}, Accent: ${brandProfile.accentColor}, Background: ${brandProfile.backgroundColor}` : concept.colorSuggestions.join(', ')}
- Business name: ${brandProfile.businessName || businessType}
- Logo: ${(brandProfile.logoDataUrl || brandProfile.logoUrl) ? 'Include provided brand logo prominently' : 'No logo provided'}
- Services: ${brandProfile.services || 'Business services'}
- Target Audience: ${brandProfile.targetAudience || 'General audience'}
- Key Features: ${brandProfile.keyFeatures || 'Key business features'}
- Visual Style: ${brandProfile.visualStyle || 'Modern'}
- Professional, trustworthy appearance

QUALITY STANDARDS:
- Ultra-high resolution and clarity
- Professional composition
- Perfect typography and text rendering
- MAXIMUM 3 COLORS ONLY (use brand colors if provided)
- NO LINES: no decorative lines, borders, dividers, or linear elements
- Platform-optimized dimensions
- Brand consistency throughout
- Clean, minimalist design with 50%+ white space

Create a stunning, professional design that captures the essence of this ${businessType} business.`;

  console.log('📝 Legacy Prompt with People Instruction:', {
    hasRegionalPeopleInstruction: !!regionalPeopleInstruction,
    regionalPeopleInstruction: regionalPeopleInstruction
  });
}

/**
 * Generate image using Gemini 2.5 Flash Image Preview with logo support
 */
async function generateImageWithGemini(prompt: string, options: Revo20GenerationOptions): Promise<{ imageUrl: string }> {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      const model = getGoogleAI().getGenerativeModel({
        model: REVO_2_0_MODEL,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      // Prepare the generation request with logo if available (exactly like Revo 1.5)
      const generationParts = [
        'You are an expert graphic designer using Gemini 2.5 Flash Image Preview. Create professional, high-quality social media images with perfect text rendering and 2048x2048 resolution.',
        prompt
      ];

      // If logo is provided, include it in the generation
      // Check both logoDataUrl (base64) and logoUrl (Supabase storage URL)
      const logoDataUrl = options.brandProfile.logoDataUrl;
      const logoStorageUrl = options.brandProfile.logoUrl;
      const logoUrl = logoDataUrl || logoStorageUrl;

      console.log('🔍 Logo availability check:', {
        businessName: options.brandProfile.businessName,
        hasLogoDataUrl: !!logoDataUrl,
        hasLogoStorageUrl: !!logoStorageUrl,
        logoDataUrlLength: logoDataUrl?.length || 0,
        logoStorageUrlLength: logoStorageUrl?.length || 0,
        finalLogoUrl: logoUrl ? logoUrl.substring(0, 100) + '...' : 'None'
      });

      if (logoUrl) {
        console.log('🎨 Processing brand logo for generation using:', logoDataUrl ? 'base64 data' : 'storage URL');

        let logoBase64Data = '';
        let logoMimeType = 'image/png';

        if (logoUrl.startsWith('data:')) {
          // Handle data URL (base64 format)
          const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (logoMatch) {
            [, logoMimeType, logoBase64Data] = logoMatch;
            console.log('✅ Using base64 logo data directly');
          }
        } else if (logoUrl.startsWith('http')) {
          // Handle storage URL - fetch and convert to base64
          console.log('📡 Fetching logo from storage URL...');
          try {
            const response = await fetch(logoUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              logoBase64Data = Buffer.from(buffer).toString('base64');
              logoMimeType = response.headers.get('content-type') || 'image/png';
              console.log(`✅ Logo fetched and converted to base64 (${buffer.byteLength} bytes)`);
            } else {
              console.warn(`⚠️  Failed to fetch logo from URL: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error('❌ Error fetching logo from storage:', fetchError);
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

            // Extract normalized base64 data
            const normalizedBase64 = normalizedLogo.dataUrl.split(',')[1];

            generationParts.push({
              inlineData: {
                data: normalizedBase64,
                mimeType: 'image/png'
              }
            });

            // Get AI prompt instructions for normalized logo
            const logoInstructions = LogoNormalizationService.getLogoPromptInstructions(normalizedLogo);

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
            generationParts[1] = prompt + logoPrompt;
            console.log('✅ [Revo 2.0] NORMALIZED logo integration prompt added');
          } catch (normalizationError) {
            console.warn('⚠️ [Revo 2.0] Logo normalization failed, using original:', normalizationError);
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
            generationParts[1] = prompt + logoPrompt;
            console.log('✅ [Revo 2.0] FALLBACK logo integration prompt added');
          }
        } else {
          console.error('❌ Logo processing failed:', {
            originalUrl: logoUrl.substring(0, 100),
            hasLogoDataUrl: !!logoDataUrl,
            hasLogoStorageUrl: !!logoStorageUrl,
            urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
          });
        }
      } else {
        console.log('ℹ️  No logo provided for generation:', {
          businessName: options.brandProfile.businessName,
          brandProfileKeys: Object.keys(options.brandProfile).filter(key => key.includes('logo'))
        });
      }

      const result = await model.generateContent(generationParts);
      const response = await result.response;


      // Extract image data from Gemini response (same as Revo 1.0)
      const parts = response.candidates?.[0]?.content?.parts || [];
      let imageUrl = '';

      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          imageUrl = `data:${mimeType};base64,${imageData}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error('No image data generated by Gemini 2.5 Flash Image Preview');
      }

      // Dimension enforcement: ensure 992x1056 exactly
      {
        const expectedW = 992, expectedH = 1056;
        const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
        if (!check.ok) {
          console.warn(`⚠️ [Revo 2.0] Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH}. Enforcing strict dimensions and retrying (attempt ${attempt + 1}/${maxRetries})...`);
          if (attempt < maxRetries) {
            // Strengthen prompt and retry within the loop
            prompt += `\nSTRICT DIMENSION ENFORCEMENT: Output must be exactly ${expectedW}x${expectedH} pixels. Do not adjust canvas based on logo.`;
            continue;
          }
        }
      }

      return { imageUrl };

    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`Revo 2.0 generation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Generate structured content including headlines, subheadlines, CTAs, captions, hashtags, and business intelligence
 */
async function generateStructuredContent(options: Revo20GenerationOptions, concept: any): Promise<{
  headline: string;
  subheadline: string;
  caption: string;
  captionVariations?: string[];
  cta: string;
  hashtags: string[];
  businessIntelligence: {
    strategy: string;
    targetAudience: string;
    keyMessage: string;
    competitiveAdvantage: string;
  };
}> {
  const { businessType, platform, brandProfile, scheduledServices } = options;

  // Determine service focus based on scheduled services priority
  let serviceFocus = brandProfile.services || 'Business services';
  let serviceContext = '';

  if (scheduledServices && scheduledServices.length > 0) {
    const todaysServices = scheduledServices.filter(s => s.isToday);
    const upcomingServices = scheduledServices.filter(s => s.isUpcoming);

    if (todaysServices.length > 0) {
      serviceFocus = todaysServices.map(s => s.serviceName).join(', ');
      serviceContext = `\n🎯 PRIORITY SERVICES (HIGHEST PRIORITY - Focus ALL content on these specific services scheduled for TODAY):
${todaysServices.map(s => `- ${s.serviceName}: ${s.description || 'Available today'}`).join('\n')}

⚠️ CRITICAL REQUIREMENT:
- The content MUST specifically promote ONLY these TODAY'S services
- Use the EXACT service names in headlines, subheadlines, and captions
- Create urgent, today-focused language: "today", "now", "available today", "don't miss out"
- DO NOT mention other business services not listed above`;
      console.log('🎯 [Revo 2.0] Structured content focusing on TODAY\'S services:', todaysServices.map(s => s.serviceName));
    } else if (upcomingServices.length > 0) {
      serviceFocus = upcomingServices.map(s => s.serviceName).join(', ');
      serviceContext = `\n📅 UPCOMING SERVICES (Build anticipation for these services):
${upcomingServices.map(s => `- ${s.serviceName} (in ${s.daysUntil} days): ${s.description || ''}`).join('\n')}`;
      console.log('📅 [Revo 2.0] Structured content focusing on UPCOMING services:', upcomingServices.map(s => s.serviceName));
    }
  } else {
    console.log('🏢 [Revo 2.0] Structured content using general brand services (no scheduled services)');
  }

  // Contact information for CTA generation
  const includeContacts = options.includeContacts === true;
  const phone = brandProfile?.contactInfo?.phone;
  const email = brandProfile?.contactInfo?.email;
  const website = (brandProfile as any)?.websiteUrl || '';
  const hasAnyContact = (!!phone || !!email || !!website);

  console.log('🔍 [Revo 2.0] Structured Content Contact Debug:', {
    includeContacts: includeContacts,
    hasAnyContact: hasAnyContact,
    phone: phone,
    email: email,
    website: website
  });

  // 🔍 DEBUG: Local language parameter tracing
  console.log('🌍 [Revo 2.0] Local Language Debug:', {
    useLocalLanguage: options.useLocalLanguage || false,
    location: brandProfile?.location,
    businessType: businessType,
    platform: platform
  });

  // 🚨 ALERT: Make this debug message very visible
  if (options.useLocalLanguage) {
    console.log('🚨🌍 REVO 2.0 LOCAL LANGUAGE IS ENABLED! Should generate local language content for:', brandProfile?.location);
  } else {
    console.log('❌🌍 REVO 2.0 LOCAL LANGUAGE IS DISABLED - English only');
  }

  const prompt = `Create comprehensive ${platform} content for a ${businessType} business with structured marketing elements.

Business Details:
- Name: ${brandProfile.businessName || businessType}
- Type: ${businessType}
- Location: ${brandProfile.location || 'Local area'}
- Description: ${brandProfile.description || 'Professional business'}
- Services Focus: ${serviceFocus}
- Target Audience: ${brandProfile.targetAudience || 'General audience'}
- Key Features: ${brandProfile.keyFeatures || 'Key business features'}
- Competitive Advantages: ${brandProfile.competitiveAdvantages || 'Business advantages'}
- Visual Style: ${brandProfile.visualStyle || 'Modern'}
- Writing Tone: ${brandProfile.writingTone || 'Professional'}
- Content Themes: ${brandProfile.contentThemes || 'Business themes'}
- Website: ${brandProfile.websiteUrl || 'Not specified'}
- Concept: ${concept.concept}
- Catchwords: ${concept.catchwords.join(', ')}${serviceContext}

${includeContacts && hasAnyContact ? `
CONTACT INFORMATION AVAILABLE:
${phone ? `- Phone: ${phone}` : ''}
${email ? `- Email: ${email}` : ''}
${website ? `- Website: ${ensureWwwWebsiteUrl(website)}` : ''}
- Include contact details in CTA when appropriate (e.g., "Call ${phone}", "Visit ${ensureWwwWebsiteUrl(website)}")
` : `
CONTACT INFORMATION: Not to be included in content
`}

Create structured content with these components:

1. **HEADLINE** (5-8 words): Eye-catching, benefit-focused main message
2. **SUBHEADLINE** (8-12 words): Supporting detail that reinforces the headline
3. **CAPTION** (2-3 sentences): Engaging social media caption for ${platform}
4. **CTA** (3-5 words): Clear, actionable call-to-action
5. **HASHTAGS** (10 hashtags): Mix of business-specific, location-based, and platform-optimized
6. **BUSINESS INTELLIGENCE**: Strategic analysis

Requirements:
- Make content authentic and locally relevant
- Use varied vocabulary (no repetitive words)
- Professional yet engaging tone
- Platform-optimized for ${platform}
- Include 5 different caption variations for Instagram

${options.useLocalLanguage ? `
LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${brandProfile.location || 'the location'}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing

🚨 **CRITICAL LANGUAGE SAFETY RULE**:
- ONLY use local language words when you are 100% certain of their spelling, meaning, and cultural appropriateness
- When in doubt about local language accuracy, ALWAYS use English instead
- Better to use clear English than incorrect or garbled local language
- Avoid complex local phrases, slang, or words you're uncertain about` : `
LANGUAGE REQUIREMENTS:
- Use English only, do not use local language
- Keep content in English for universal accessibility
- Focus on local cultural understanding in English rather than local language mixing`}

Format as JSON:
{
  "headline": "Compelling 5-8 word headline",
  "subheadline": "Supporting 8-12 word subheadline",
  "caption": "Engaging social media caption",
  "captionVariations": ["Caption 1", "Caption 2", "Caption 3", "Caption 4", "Caption 5"],
  "cta": "Clear call-to-action",
  "hashtags": ["#SpecificHashtag1", "#LocationBased", "#IndustryRelevant", ...],
  "businessIntelligence": {
    "strategy": "Marketing strategy insight",
    "targetAudience": "Primary audience description",
    "keyMessage": "Core value proposition",
    "competitiveAdvantage": "What sets this business apart"
  }
}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 600
  });

  try {
    let responseContent = response.choices[0].message.content || '{}';

    // Remove markdown code blocks if present
    responseContent = responseContent.replace(/```json\s*|\s*```/g, '').trim();

    const result = JSON.parse(responseContent);

    // Validate the response
    if (result.headline && result.subheadline && result.caption && result.cta && Array.isArray(result.hashtags)) {

      // VALIDATION: Check if content mentions scheduled services
      if (scheduledServices && scheduledServices.length > 0) {
        const todaysServices = scheduledServices.filter(s => s.isToday);
        if (todaysServices.length > 0) {
          const contentText = `${result.headline} ${result.subheadline} ${result.caption}`.toLowerCase();
          const mentionsScheduledService = todaysServices.some(service =>
            contentText.includes(service.serviceName.toLowerCase())
          );

          if (mentionsScheduledService) {
            console.log('✅ [Revo 2.0] VALIDATION PASSED: Structured content mentions scheduled services');
          } else {
            console.warn('⚠️ [Revo 2.0] VALIDATION WARNING: Structured content does not mention today\'s scheduled services:', {
              todaysServices: todaysServices.map(s => s.serviceName),
              generatedContent: contentText.substring(0, 200)
            });
          }
        }
      }

      return {
        headline: result.headline,
        subheadline: result.subheadline,
        caption: result.captionVariations && result.captionVariations.length > 0 ? result.captionVariations[0] : result.caption,
        captionVariations: result.captionVariations || [result.caption],
        cta: result.cta,
        hashtags: result.hashtags.slice(0, 10),
        businessIntelligence: result.businessIntelligence || {
          strategy: 'Professional content strategy',
          targetAudience: 'Local customers and prospects',
          keyMessage: 'Quality service and expertise',
          competitiveAdvantage: 'Trusted local business'
        }
      };
    }
  } catch (error) {
    console.warn('Failed to parse AI structured content response:', error);
  }

  // Fallback with contextual generation (no hardcoded placeholders)
  return generateStructuredFallback(businessType, brandProfile, platform, concept);
}

/**
 * Generate structured fallback content without hardcoded placeholders
 */
function generateStructuredFallback(
  businessType: string,
  brandProfile: BrandProfile,
  platform: string,
  concept: any
): {
  headline: string;
  subheadline: string;
  caption: string;
  captionVariations?: string[];
  cta: string;
  hashtags: string[];
  businessIntelligence: {
    strategy: string;
    targetAudience: string;
    keyMessage: string;
    competitiveAdvantage: string;
  };
} {
  const businessName = brandProfile.businessName || businessType;
  const location = brandProfile.location || 'your area';

  // Generate structured content
  const headline = `${concept.catchwords[0] || 'Discover'} ${businessName}`;
  const subheadline = `Experience excellence in ${location}`;
  const caption = `${concept.catchwords[0] || 'Discover'} what makes ${businessName} special in ${location}! ${concept.concept || 'Experience the difference with our exceptional service.'}`;
  const cta = `Visit ${businessName} Today!`;

  // Generate contextual hashtags
  const hashtags: string[] = [];

  // Business-specific
  hashtags.push(`#${businessName.replace(/\s+/g, '')}`);
  hashtags.push(`#${businessType.replace(/\s+/g, '')}Business`);

  // Location-based
  const locationParts = location.split(',').map(part => part.trim());
  locationParts.forEach(part => {
    if (part.length > 2) {
      hashtags.push(`#${part.replace(/\s+/g, '')}`);
    }
  });

  // Platform-specific contextual
  if (platform === 'instagram') {
    hashtags.push('#InstagramContent', '#VisualStory');
  } else if (platform === 'facebook') {
    hashtags.push('#FacebookPost', '#CommunityBusiness');
  } else if (platform === 'linkedin') {
    hashtags.push('#LinkedInBusiness', '#ProfessionalServices');
  } else if (platform === 'tiktok') {
    hashtags.push('#TikTokBusiness', '#CreativeContent');
  }

  // Add current date context
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  hashtags.push(`#${dayName}Vibes`);

  // Generate 5 caption variations for Instagram
  const captionVariations = platform.toLowerCase() === 'instagram' ? [
    caption,
    `${concept.catchwords[1] || 'Experience'} the difference at ${businessName}! ${concept.concept || 'Quality service you can trust.'} #${businessName.replace(/\s+/g, '')}`,
    `Ready for something amazing? ${businessName} in ${location} delivers excellence every time! 🎆`,
    `👋 Hey ${location}! Looking for quality services? ${businessName} has you covered!`,
    `✨ ${businessName} - where ${concept.catchwords[0]?.toLowerCase() || 'quality'} meets excellence in ${location}! Come see what makes us special.`
  ] : [caption];

  return {
    headline,
    subheadline,
    caption,
    captionVariations,
    cta,
    hashtags: [...new Set(hashtags)].slice(0, 10),
    businessIntelligence: {
      strategy: `Professional ${businessType} marketing focused on local engagement`,
      targetAudience: `Local customers in ${location} seeking quality services`,
      keyMessage: `Quality services with personalized attention`,
      competitiveAdvantage: `Trusted local ${businessType} business with proven expertise`
    }
  };
}

/**
 * Test Revo 2.0 availability
 */
export async function testRevo20Availability(): Promise<boolean> {
  try {

    const model = getGoogleAI().getGenerativeModel({ model: REVO_2_0_MODEL });
    const response = await model.generateContent('Create a simple test image with the text "Revo 2.0 Test" on a modern gradient background');

    const parts = response.candidates?.[0]?.content?.parts || [];
    let hasImage = false;

    for (const part of parts) {
      if (part.inlineData) {
        hasImage = true;
      }
    }

    if (hasImage) {
      return true;
    } else {
      return false;
    }

  } catch (error) {
    return false;
  }
}
