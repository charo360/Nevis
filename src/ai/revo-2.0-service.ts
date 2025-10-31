/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses direct Vertex AI for enhanced content generation
 */

import type { BrandProfile, Platform } from '@/lib/types';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';
import { getClaudeClient } from '@/lib/services/claude-client';

// Direct Vertex AI function for all AI generation
async function generateContentDirect(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean): Promise<any> {

  // Check if Vertex AI is enabled
  if (!process.env.VERTEX_AI_ENABLED || process.env.VERTEX_AI_ENABLED !== 'true') {
    throw new Error('🚫 Vertex AI is not enabled. Please set VERTEX_AI_ENABLED=true in your environment variables.');
  }

  // Prepare prompt
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

  try {
    if (isImageGeneration) {
      // Use Vertex AI for image generation
      const result = await getVertexAIClient().generateImage(prompt, modelName, {
        temperature: 0.7,
        maxOutputTokens: 8192,
        logoImage
      });

      // Return in expected format
      return {
        response: {
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
        }
      };
    } else {
      // Use Vertex AI for text generation
      const result = await getVertexAIClient().generateText(prompt, modelName, {
        temperature: 0.7,
        maxOutputTokens: 16384  // Increased for content generation
      });

      // Return in expected format for text generation
      return {
        response: {
          text: () => result.text,
          candidates: [{
            content: { parts: [{ text: result.text }] },
            finishReason: result.finishReason
          }]
        }
      };
    }
  } catch (error) {
    console.error('❌ Revo 2.0 Direct API generation failed:', error);
    throw error;
  }
}

// All AI calls now use direct Vertex AI for reliability and performance

// Direct Vertex AI function (replaces proxy routing)
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  return await generateContentDirect(promptOrParts, modelName, isImageGeneration);
}

// Direct Vertex AI models (no proxy dependencies)
const REVO_2_0_MODEL = 'gemini-2.5-flash-image';

// === Revo 2.0 Creativity & Anti-Repetition Utilities ===

type RecentOutput = { headlines: string[]; captions: string[]; concepts: string[] };
const recentOutputs = new Map<string, RecentOutput>();
const recentStyles = new Map<string, string>();
const recentConcepts = new Map<string, Array<{ concept: string; timestamp: number }>>;

// Enhanced variety system for concept generation
interface ConceptDimensions {
  setting: string;
  customerType: string;
  visualStyle: string;
  composition: string;
  benefit: string;
  emotionalTone: string;
  format: string;
  approach: string;
}

const CONCEPT_DIMENSIONS = {
  settings: [
    'Workspace', 'Home', 'Transit', 'Public', 'Digital', 'Nature', 'Abstract', 'Metaphorical'
  ],
  customerTypes: [
    'Young Professional', 'Entrepreneur', 'Family Person', 'Senior Professional', 'Student'
  ],
  visualStyles: [
    'Clean Minimalist', 'Single Product Focus', 'Simple Portrait', 'Clean Illustration', 
    'Minimal Graphics', 'Focused Lifestyle', 'Clean Documentary', 'Simple Professional',
    'Uncluttered Environmental', 'Clean Abstract'
  ],
  compositions: [
    'Standing Shot', 'Over-Shoulder Angle', 'Hand Detail Focus', 'Small Group Dynamic',
    'Left-Aligned Layout', 'Right-Aligned Layout', 'Centered Composition', 'Split Layout'
  ],
  benefits: [
    'Speed', 'Ease', 'Cost', 'Quality', 'Growth', 'Security', 'Freedom', 'Connection', 'Innovation'
  ],
  emotionalTones: [
    'Urgent', 'Aspirational', 'Reassuring', 'Exciting', 'Warm', 'Confident', 'Playful', 'Serious'
  ],
  formats: [
    'Testimonial', 'Statistic', 'Question', 'Problem-Solution', 'Comparison', 
    'Before-After', 'Day-in-Life', 'Success Story', 'Community Impact', 'Transformation'
  ],
  approaches: [
    'Innovation-Focus', 'Results-Driven', 'Customer-Centric', 'Quality-Emphasis',
    'Speed-Focus', 'Security-Focus', 'Community-Impact', 'Cost-Savings',
    'Convenience', 'Growth-Enabler', 'Trust-Builder', 'Accessibility',
    'Problem-Solver', 'Lifestyle-Enhancement', 'Transformation-Story'
  ]
};

// Generate unique concept using 6-dimensional system
function generateUniqueConceptDimensions(brandKey: string): ConceptDimensions {
  const timeBasedSeed = Date.now();
  const recent = recentConcepts.get(brandKey) || [];
  
  // Clean old concepts (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentConcepts_filtered = recent.filter(c => c.timestamp > oneHourAgo);
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Use time-based randomization for better variety
    const settingSeed = (timeBasedSeed + attempts * 1000) % CONCEPT_DIMENSIONS.settings.length;
    const customerSeed = (timeBasedSeed + attempts * 2000) % CONCEPT_DIMENSIONS.customerTypes.length;
    const styleSeed = (timeBasedSeed + attempts * 3000) % CONCEPT_DIMENSIONS.visualStyles.length;
    const benefitSeed = (timeBasedSeed + attempts * 4000) % CONCEPT_DIMENSIONS.benefits.length;
    const toneSeed = (timeBasedSeed + attempts * 5000) % CONCEPT_DIMENSIONS.emotionalTones.length;
    const formatSeed = (timeBasedSeed + attempts * 6000) % CONCEPT_DIMENSIONS.formats.length;
    const approachSeed = (timeBasedSeed + attempts * 7000) % CONCEPT_DIMENSIONS.approaches.length;
    
    const compositionSeed = (timeBasedSeed + attempts * 8000) % CONCEPT_DIMENSIONS.compositions.length;
    
    const concept: ConceptDimensions = {
      setting: CONCEPT_DIMENSIONS.settings[settingSeed],
      customerType: CONCEPT_DIMENSIONS.customerTypes[customerSeed],
      visualStyle: CONCEPT_DIMENSIONS.visualStyles[styleSeed],
      composition: CONCEPT_DIMENSIONS.compositions[compositionSeed],
      benefit: CONCEPT_DIMENSIONS.benefits[benefitSeed],
      emotionalTone: CONCEPT_DIMENSIONS.emotionalTones[toneSeed],
      format: CONCEPT_DIMENSIONS.formats[formatSeed],
      approach: CONCEPT_DIMENSIONS.approaches[approachSeed]
    };
    
    // Check if this combination is too similar to recent ones
    const conceptString = `${concept.setting}-${concept.customerType}-${concept.visualStyle}`;
    const isTooSimilar = recentConcepts_filtered.some(recent => {
      const recentString = recent.concept;
      return recentString === conceptString;
    });
    
    if (!isTooSimilar || attempts === maxAttempts) {
      // Store this concept
      recentConcepts_filtered.push({ concept: conceptString, timestamp: Date.now() });
      recentConcepts.set(brandKey, recentConcepts_filtered.slice(-9)); // Keep last 9
      
      console.log(`🎲 [Revo 2.0] Generated 6D Concept (Attempt ${attempts}): ${conceptString}`);
      return concept;
    }
  }
  
  // Fallback if all attempts failed
  return {
    setting: 'Digital',
    customerType: 'Young Professional', 
    visualStyle: 'Lifestyle Photography',
    composition: 'Centered Composition',
    benefit: 'Innovation',
    emotionalTone: 'Confident',
    format: 'Success Story',
    approach: 'Innovation-Focus'
  };
}

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

function rememberOutput(key: string, { headline, caption, concept }: { headline?: string; caption?: string; concept?: string }) {
  const entry = recentOutputs.get(key) || { headlines: [], captions: [], concepts: [] };
  if (headline) {
    entry.headlines.unshift(headline);
    entry.headlines = entry.headlines.slice(0, 10);
  }
  if (caption) {
    entry.captions.unshift(caption);
    entry.captions = entry.captions.slice(0, 10);
  }
  if (concept) {
    entry.concepts.unshift(concept);
    entry.concepts = entry.concepts.slice(0, 10);
  }
  recentOutputs.set(key, entry);
}

const OVERUSED_WORDS = new Set<string>(['journey', 'journeys', 'everyday', 'seamless', 'effortless', 'transform', 'empower', 'ambitions', 'revolutionize', 'innovative', 'cutting-edge']); // Enhanced list

// Banned headline patterns that cause repetition
const BANNED_HEADLINE_PATTERNS = [
  /finance your ambitions/i,
  /transform your business/i,
  /empower your future/i,
  /revolutionize your/i,
  /seamless .+ solutions/i,
  /effortless .+ experience/i,
  /cutting-edge .+ technology/i,
  /innovative .+ approach/i,
  /next-generation .+/i,
  /^[a-z]+ your [a-z]+$/i // Generic "[Action] Your [Concept]" pattern
];

// Check if text matches banned patterns
function hasBannedPattern(text: string): boolean {
  if (!text) return false;
  return BANNED_HEADLINE_PATTERNS.some(pattern => pattern.test(text));
}

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
  followBrandColors?: boolean;
  scheduledServices?: any[];
  contentApproach?: string;
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
    const response = await fetch(logoUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type from response headers or URL extension
    const contentType = response.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

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
 * Generate creative concept for Revo 2.0 with enhanced variety and anti-repetition
 */
async function generateCreativeConcept(options: Revo20GenerationOptions): Promise<any> {
  const { businessType, brandProfile, platform, scheduledServices } = options;

  // Extract today's services for focused content
  const todaysServices = scheduledServices?.filter(s => s.isToday) || [];
  const upcomingServices = scheduledServices?.filter(s => s.isUpcoming) || [];

  // Generate unique concept dimensions for variety
  const bKey = brandKey(brandProfile, platform);
  const dimensions = generateUniqueConceptDimensions(bKey);
  
  // Check recent concepts to avoid repetition
  const recentData = recentOutputs.get(bKey) || { headlines: [], captions: [], concepts: [] };
  
  try {
    // Build service-aware concept prompt with variety dimensions
    let serviceContext = '';
    if (todaysServices.length > 0) {
      serviceContext = `\n\n🎯 TODAY'S FEATURED SERVICES (Priority Focus):\n${todaysServices.map(s => `- ${s.serviceName}: ${s.description || 'Premium service offering'}`).join('\n')}`;
    }

    // Enhanced concept prompt with variety instructions
    const conceptPrompt = `Generate a unique creative concept for ${brandProfile.businessName || businessType} (${businessType}) on ${platform}.
    ${serviceContext}

    🎯 CONCEPT VARIETY REQUIREMENTS:
    - Setting: ${dimensions.setting} environment
    - Target Customer: ${dimensions.customerType}
    - Visual Style: ${dimensions.visualStyle}
    - Composition: ${dimensions.composition}
    - Key Benefit: ${dimensions.benefit}
    - Emotional Tone: ${dimensions.emotionalTone}
    - Content Format: ${dimensions.format}
    - Marketing Approach: ${dimensions.approach}

    🚫 ANTI-REPETITION RULES:
    - NEVER repeat these recent concepts: ${recentData.concepts.slice(0, 3).join(', ')}
    - AVOID generic phrases like "Finance Your Ambitions", "Transform Your Business"
    - CREATE completely different messaging and visual approach
    - USE specific, unique value propositions

    🎯 HUMAN-CENTERED MESSAGING (MANDATORY):
    - Use HUMAN, conversational tone (not corporate speak)
    - Focus on LIFE OUTCOMES, not banking features
    - Make it PERSONAL and relatable to everyday experiences
    - AVOID business jargon like "leverage", "optimize", "synergize", "empowering your financial flow"
    - AVOID corporate phrases like "Transform Your Business", "Unlock Your Potential"
    - Examples: "Your goals. Your rhythm. One simple app that fits your flow" vs "Empowering your financial flow"
    - Focus on lifestyle outcomes: "Banking that actually works for you" vs "Advanced financial solutions"

    Business Context:
    - Location: ${brandProfile.location || 'Global'}
    - Target Audience: ${brandProfile.targetAudience || 'General audience'}
    - Writing Tone: ${brandProfile.writingTone || 'Professional'}

    🎨 CONCEPT REQUIREMENTS:
    - Create a UNIQUE concept that combines the variety dimensions above
    - Focus on specific business benefits, not generic statements
    - Make it visually distinctive and memorable
    - Ensure it's different from recent generations
    ${todaysServices.length > 0 ? `- Highlight today's featured service: ${todaysServices[0].serviceName}` : ''}

    Return a brief creative concept (2-3 sentences) that will guide unique visual design.`;

    // Add randomization to temperature for more variety
    const temperature = 0.8 + (Math.random() * 0.3); // 0.8-1.1 range
    console.log(`🎲 [Revo 2.0] Using temperature: ${temperature.toFixed(2)} for concept variety`);

    const result = await generateContentWithProxy(conceptPrompt, REVO_2_0_MODEL, false);
    const response = await result.response;
    const conceptText = response.text();

    const finalConcept = conceptText.trim() || generateFallbackConcept(brandProfile, businessType, dimensions);
    
    // Remember this concept to avoid repetition
    rememberOutput(bKey, { concept: finalConcept });

    return {
      concept: finalConcept,
      visualTheme: dimensions.visualStyle.toLowerCase().replace(' ', '-'),
      emotionalTone: dimensions.emotionalTone.toLowerCase(),
      designElements: getDesignElementsForStyle(dimensions.visualStyle),
      colorSuggestions: [brandProfile.primaryColor || '#3B82F6'],
      moodKeywords: getMoodKeywordsForTone(dimensions.emotionalTone),
      featuredServices: todaysServices,
      upcomingServices: upcomingServices.slice(0, 2),
      dimensions: dimensions // Include for debugging
    };

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Creative concept generation failed, using enhanced fallback');
    const fallbackConcept = generateFallbackConcept(brandProfile, businessType, dimensions, todaysServices);
    
    // Remember fallback concept too
    rememberOutput(bKey, { concept: fallbackConcept });

    return {
      concept: fallbackConcept,
      visualTheme: dimensions.visualStyle.toLowerCase().replace(' ', '-'),
      emotionalTone: dimensions.emotionalTone.toLowerCase(),
      featuredServices: todaysServices,
      upcomingServices: upcomingServices.slice(0, 2),
      dimensions: dimensions
    };
  }
}

/**
 * Generate fallback concept with variety
 */
function generateFallbackConcept(brandProfile: any, businessType: string, dimensions: ConceptDimensions, todaysServices?: any[]): string {
  const service = todaysServices?.length > 0 ? todaysServices[0].serviceName : businessType;
  const company = brandProfile.businessName || 'the business';
  
  const conceptTemplates = [
    `Show ${dimensions.customerType.toLowerCase()} experiencing ${dimensions.benefit.toLowerCase()} through ${service} in a ${dimensions.setting.toLowerCase()} setting with ${dimensions.emotionalTone.toLowerCase()} energy.`,
    `Capture ${dimensions.format.toLowerCase()} showcasing how ${company} delivers ${dimensions.benefit.toLowerCase()} via ${service} using ${dimensions.visualStyle.toLowerCase()} approach.`,
    `Create ${dimensions.approach.toLowerCase()} content featuring ${dimensions.customerType.toLowerCase()} achieving ${dimensions.benefit.toLowerCase()} with ${service} in ${dimensions.emotionalTone.toLowerCase()} tone.`,
    `Demonstrate ${service} impact through ${dimensions.format.toLowerCase()} showing ${dimensions.benefit.toLowerCase()} for ${dimensions.customerType.toLowerCase()} in ${dimensions.setting.toLowerCase()}.`
  ];
  
  const selectedTemplate = conceptTemplates[Date.now() % conceptTemplates.length];
  return selectedTemplate;
}

/**
 * Get design elements based on visual style
 */
function getDesignElementsForStyle(visualStyle: string): string[] {
  const styleMap: Record<string, string[]> = {
    'Clean Minimalist': ['generous white space', 'single focal point', 'clean typography'],
    'Single Product Focus': ['isolated product', 'clean background', 'professional lighting'],
    'Simple Portrait': ['single person', 'uncluttered background', 'natural lighting'],
    'Clean Illustration': ['minimal graphics', 'simple shapes', 'clear messaging'],
    'Minimal Graphics': ['essential elements only', 'clean lines', 'purposeful design'],
    'Focused Lifestyle': ['single activity', 'authentic moment', 'clear context'],
    'Clean Documentary': ['real environment', 'single story', 'authentic capture'],
    'Simple Professional': ['business context', 'clean composition', 'professional tone'],
    'Uncluttered Environmental': ['simple setting', 'clear background', 'focused scene'],
    'Clean Abstract': ['minimal elements', 'clear concept', 'simple execution']
  };
  
  return styleMap[visualStyle] || ['clean composition', 'single focus', 'minimal elements'];
}

/**
 * Get mood keywords based on emotional tone
 */
function getMoodKeywordsForTone(emotionalTone: string): string[] {
  const toneMap: Record<string, string[]> = {
    'Urgent': ['immediate', 'action-oriented', 'decisive'],
    'Aspirational': ['inspiring', 'uplifting', 'motivational'],
    'Reassuring': ['trustworthy', 'reliable', 'comforting'],
    'Exciting': ['dynamic', 'energetic', 'vibrant'],
    'Warm': ['friendly', 'approachable', 'welcoming'],
    'Confident': ['strong', 'assured', 'professional'],
    'Playful': ['fun', 'creative', 'engaging'],
    'Serious': ['professional', 'focused', 'authoritative']
  };
  
  return toneMap[emotionalTone] || ['professional', 'trustworthy', 'engaging'];
}

/**
 * Build enhanced prompt for Revo 2.0 with brand integration, visual consistency, and scheduled services
 */
function buildEnhancedPrompt(options: Revo20GenerationOptions, concept: any): string {

  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern', scheduledServices } = options;

  // Extract brand colors from profile with toggle support
  const shouldFollowBrandColors = options.followBrandColors !== false; // Default to true if not specified

  const primaryColor = shouldFollowBrandColors ? (brandProfile.primaryColor || '#3B82F6') : '#3B82F6';
  const accentColor = shouldFollowBrandColors ? (brandProfile.accentColor || '#1E40AF') : '#1E40AF';
  const backgroundColor = shouldFollowBrandColors ? (brandProfile.backgroundColor || '#FFFFFF') : '#FFFFFF';

  console.log('🎨 [Revo 2.0] Brand Colors Debug:', {
    followBrandColors: shouldFollowBrandColors,
    inputPrimaryColor: brandProfile.primaryColor,
    inputAccentColor: brandProfile.accentColor,
    inputBackgroundColor: brandProfile.backgroundColor,
    finalPrimaryColor: primaryColor,
    finalAccentColor: accentColor,
    finalBackgroundColor: backgroundColor,
    hasValidColors: !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor),
    usingBrandColors: shouldFollowBrandColors && !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor)
  });

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
      // Clean website format: remove https:// and http://, ensure www. prefix
      let cleanWebsite = website.replace(/^https?:\/\//, '');
      if (!cleanWebsite.startsWith('www.')) {
        cleanWebsite = `www.${cleanWebsite}`;
      }
      contacts.push(`🌐 ${cleanWebsite}`);
    }
    if (address) contacts.push(`📍 ${address}`);

    if (contacts.length > 0) {
      contactInstruction = `\n\n📞 MANDATORY CONTACT FOOTER:\n${contacts.join('\n')}\n- ALWAYS place contact information at the BOTTOM FOOTER of the design\n- Create a clean contact strip/bar at the bottom edge\n- Use contrasting background (dark bar with light text OR light bar with dark text)\n- Ensure contact details are large enough to read (minimum 14px equivalent)\n- Format: ${contacts.join(' | ')}\n- NEVER place contacts anywhere except the footer area`;
    }

  }

  return `🎨 Create a ${visualStyle} social media design for ${brandProfile.businessName} (${businessType}) for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

🎯 VISUAL CONTEXT REQUIREMENT: ${visualContext}${serviceVisualContext}

🎯 STRONG FLEXIBLE TEMPLATE STRUCTURE (MANDATORY):
1. NEUTRAL BACKGROUND: White or soft gradient (never busy patterns)
2. ACCENT COLOR: Tied to post theme using brand colors strategically
3. SINGLE FOCAL ELEMENT: 1 person photo OR 1 relatable object (never both)
4. EMOTIONAL HEADLINE: Human tone, not corporate speak
5. OPTIONAL IDENTITY ELEMENT: Small icon or motif for brand consistency

🌟 NATURAL, AUTHENTIC IMAGERY REQUIREMENTS:
- Show REAL people using technology naturally (no artificial tech effects)
- Use CLEAN, simple backgrounds without digital overlays
- Display phones/devices as normal objects (no glowing or connection lines)
- Focus on HUMAN moments and authentic interactions
- Avoid any artificial tech visualizations or digital effects
- Keep technology integration SUBTLE and realistic

📱 REALISTIC PHONE POSITIONING (CRITICAL):
- Phone screens must be visible from the VIEWER'S perspective, not from behind
- Show phones held naturally - screen facing toward camera/viewer
- NEVER show phone screens from impossible angles (back of phone showing screen)
- Use realistic viewing angles: over-shoulder, side view, or front-facing
- Phone should be held naturally in hands, not floating or awkwardly positioned
- Screen content should be logically visible from the camera's viewpoint
- Ensure phone orientation matches natural human interaction patterns

📸 CONSISTENT LIGHTING & TONE (MANDATORY):
- Apply WARM, BALANCED lighting across ALL images for brand consistency
- Use consistent photographic tone and color temperature (NO orange/red tints)
- Ensure natural, flattering skin tones without heavy color casts
- NO washed out or overly cool lighting that breaks brand continuity
- Maintain same lighting quality and warmth across entire feed
- CONSISTENT photographic filter/LUT for unified brand appearance

🎨 STRATEGIC TEXT PLACEMENT SYSTEM (MANDATORY):
- BACKGROUND: Clean white (#FFFFFF) or subtle gradient using brand colors
- ACCENT COLOR: Use ${primaryColor} or ${accentColor} strategically for theme connection
- FOCAL ELEMENT: Choose ONE - either person OR object, positioned prominently

📍 STRATEGIC HEADLINE & SUBHEADLINE PLACEMENT:
- HEADLINE POSITION: Top-left or top-right corner for maximum impact and readability
- SUBHEADLINE POSITION: Directly below headline with consistent spacing (never scattered)
- VISUAL FLOW: Create clear reading path - headline → image → subheadline → CTA
- GOLDEN RATIO: Place text in upper third or lower third zones, never center-cramped
- BRAND MOTIF: Opposite corner from headline for balanced composition
- BREATHING SPACE: At least one-third negative space around all text elements
- NO RANDOM PLACEMENT: Text positioned with clear design intention and visual hierarchy
- LAYOUT SYSTEM: Left-aligned headline with right image OR right-aligned headline with left image
- COMPOSITION VARIETY: ${concept.composition} - vary poses and angles to keep series fresh

🚫 AVOID POOR TEXT PLACEMENT:
- NO text scattered randomly across the design
- NO headlines placed wherever there's leftover space
- NO subheadlines disconnected from headlines
- NO text overlapping or competing with focal elements
- NO center-heavy text that creates cramped layouts

🚫 ELIMINATE GENERIC FINTECH CLICHÉS (CRITICAL):
- NEVER use: "Unlock Your Tomorrow", "The Future is Now", "Banking Made Simple"
- NEVER use: "Transform Your Business", "Empower Your Journey", "Revolutionize"
- NEVER use: "Seamless", "Effortless", "Streamlined", "Next-Generation"
- NEVER use: "thoughtful details, measurable outcomes" (meaningless corporate speak)
- AVOID: Any headline that could apply to ANY bank or fintech company
- BANNED PHRASES: "stripped away the confusion", "future-proof", "game-changer"

💬 AUTHENTIC HUMAN VOICE REQUIREMENTS (MANDATORY):
- Write like a REAL PERSON talking to a friend, not a corporate press release
- Use conversational, warm tone: "Hey" instead of "We are pleased to announce"
- Include personality and character - sound distinctly like Paya, not generic fintech
- Use specific, concrete language instead of vague corporate buzzwords
- Sound like someone who actually understands Kenyan life and challenges
- NO corporate jargon: "featuring", "thoughtful details", "measurable outcomes"

🚨 ELIMINATE ALL CORPORATE SPEAK (ABSOLUTELY CRITICAL):
- BANNED PHRASES (NEVER USE THESE): 
  * "authentic, high-impact"
  * "BNPL is today's focus"
  * "Paya Finance puts Buy Now Pay Later (BNPL) front and center today"
  * "makes it practical, useful, and..."
  * "timing is everything"
  * "We've all been there"
  * "brings a human, professional touch"
  * "See how Paya Finance makes it..."
- NEVER sound like a PowerPoint presentation or press release
- NEVER use generic filler text that could apply to any product
- WRITE LIKE: A friend explaining a solution they discovered
- USE REAL SCENARIOS: "It's week 3. Professor just assigned 5 new textbooks at $80 each. Your account says $47."

🎭 REAL HUMAN STORYTELLING (MANDATORY):
- START with a REAL SCENARIO: "Three weeks into semester and your laptop died. Again."
- CREATE A SCENE: Paint a picture people can see and feel
- USE REAL EMOTIONS: stress, relief, hope, frustration, excitement
- SHOW, DON'T TELL: "Mom's birthday is coming up" vs "family obligations"
- ADD PERSONALITY: "Here's the thing:", "Plot twist:", "Real talk:"
- END WITH EMPATHY: "We get it", "You're not alone", "Been there"

🚫 TEMPLATE VIOLATIONS TO AVOID:
- NO busy or complex backgrounds
- NO multiple competing focal points
- NO corporate jargon in headlines
- NO overwhelming brand elements
- NO cramped layouts without white space

🎛️ SIMPLIFIED STYLE DIRECTIVES:
- Design Style: ${chosenStyle} (applied minimally)
- Layout: ${chosenLayout} (with generous white space)
- Typography: ${chosenType} (clean and readable)
- Effects: ${chosenEffect} (subtle, not distracting)

DESIGN REQUIREMENTS:
- Platform: ${platform} (${getPlatformDimensions(platform)})
- Visual Style: ${visualStyle}
- Business: ${brandProfile.businessName} - ${businessType}${brandInfo}
- Location: ${brandProfile.location || 'Global'}
- Visual Theme: ${visualContext}
${concept.featuredServices && concept.featuredServices.length > 0 ? `- Featured Service: ${concept.featuredServices[0].serviceName} (TODAY'S FOCUS)` : ''}

🎨 STRICT BRAND COLOR CONSISTENCY (MANDATORY):
${colorScheme}
- Use EXACT brand colors with NO variations or different shades
- Primary color: ${primaryColor} (60% of color usage) - NO other reds/corals
- Accent color: ${accentColor} (30% of color usage) - NO other secondary colors  
- Background: ${backgroundColor} (10% of color usage) - NO other neutrals
- NEVER use similar but different shades (e.g., different reds, browns, beiges)
- CONSISTENT color temperature across all designs for brand recognition
- NO color variations that make the feed look uncoordinated

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
❌ ELECTRICAL/DIGITAL CONNECTION LINES from phones or devices
❌ Network visualization lines, nodes, or connection patterns
❌ Digital current/electricity effects around electronics
❌ Tech circuit patterns or digital network overlays
❌ Artificial connection lines between person and device
❌ Glowing digital pathways or data streams
❌ Electronic signal visualizations or tech auras

CRITICAL REQUIREMENTS:
- Resolution: 992x1056px (1:1 square format)
- High-quality, professional appearance
${shouldFollowBrandColors ? `- MANDATORY: Use the specified brand colors (${primaryColor}, ${accentColor}, ${backgroundColor})` : `- Use professional, modern colors that complement the ${visualStyle} style`}
- Clear, readable text elements with proper contrast
- Engaging visual composition with brand consistency
- Cultural sensitivity and relevance
- Professional typography that complements the brand colors
- VISUAL CONSISTENCY: Ensure the image clearly represents ${visualContext}

📝 STRONG TYPOGRAPHY HIERARCHY (MANDATORY):
- HEADLINE: Bold, heavy font weight - 2X larger than other text elements
- SUBHEADLINE: Medium weight - 50% smaller than headline, supports main message
- STRONG CONTRAST: White text on dark backgrounds OR dark text on light backgrounds
- NO thin or light font weights that blend into backgrounds
- LOGO PLACEMENT: Isolated in consistent corner with proper spacing for brand memory
- Clear visual separation between headline, subheadline, and body text
- NEVER use text like "COMPANY:", "PAYA:", or "BusinessName:" in the design
- NEVER include "journey", "everyday", or repetitive corporate language in design text
- Headlines must be engaging phrases, not company announcements
- Ensure maximum readability across all text elements

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

    // Prepare generation parts array
    const generationParts: any[] = [prompt];

    // Enhanced logo integration (same logic as Revo 1.0 with URL conversion)
    const logoDataUrl = options.brandProfile.logoDataUrl;
    const logoStorageUrl = (options.brandProfile as any).logoUrl || (options.brandProfile as any).logo_url;
    let logoUrl = logoDataUrl || logoStorageUrl;

    // Convert storage URL to data URL if needed (same as Revo 1.5)
    if (logoUrl && !logoUrl.startsWith('data:') && logoUrl.startsWith('http')) {
      try {
        logoUrl = await convertLogoToDataUrl(logoUrl);
      } catch (conversionError) {
        console.warn('⚠️ Revo 2.0: Logo URL conversion failed:', conversionError);
        logoUrl = undefined; // Clear invalid logo
      }
    }

    // Add logo to generation parts if available
    if (logoUrl && logoUrl.startsWith('data:image/')) {

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
      } else {
        console.error('❌ Revo 2.0: Invalid logo data URL format');
      }
    } else {
    }

    const result = await generateContentWithProxy(generationParts, REVO_2_0_MODEL, true);
    const response = await result.response;

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

  // Get recent data for anti-repetition
  const recentData = recentOutputs.get(brandKey(brandProfile, platform)) || { headlines: [], captions: [], concepts: [] };

  try {

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

    // Select enhanced content approach for variety
    const contentApproaches = getEnhancedContentApproaches();
    const selectedApproach = options.contentApproach || contentApproaches[Math.floor(Math.random() * contentApproaches.length)];
    
    // Build local language integration if enabled
    let localLanguageInstructions = '';
    if (options.useLocalLanguage && brandProfile.location) {
      localLanguageInstructions = `\n\n🌍 CRITICAL LOCAL LANGUAGE INTEGRATION FOR ${brandProfile.location.toUpperCase()}:
- MANDATORY: Mix English (70%) with local language elements (30%)
- NATURAL INTEGRATION: Don't force it - only add when it flows naturally
- CONTEXTUAL USE: Match local language to business type and audience
- VARIETY: Use different local phrases for each generation (avoid repetition)

📍 LOCATION-SPECIFIC LANGUAGE ELEMENTS:
${getLocationSpecificLanguageInstructions(brandProfile.location)}

🎯 INTEGRATION EXAMPLES (ADAPTS TO USER'S COUNTRY):
- Headlines: "Digital Banking Made Simple" → Add local welcome (Karibu/Hola/Bonjour/etc.)
- Subheadlines: "Fast payments, zero hassle" → Mix with local reassurance phrases
- Benefits: "Secure transactions" → Include local trust expressions
- CTAs: "Get Started Today" → Use local action phrases (Twende/Vamos/Allons-y/etc.)
- Social Proof: "Trusted by customers" → Localize with country-specific language
- Urgency: "Don't wait" → Use local urgency expressions
- Captions: Mix English (70%) with local language (30%) naturally
- ADAPTS TO: Kenya, Nigeria, Ghana, South Africa, India, Philippines, Indonesia, Thailand, Vietnam, Brazil, Mexico, Spain, France, Germany, and more

⚠️ CRITICAL: Local language should enhance, not confuse. Keep it natural and contextual.`;
    }

    const contentPrompt = `Create engaging social media content for ${brandProfile.businessName} (${businessType}) on ${platform}.

🎯 BUSINESS CONTEXT:
- Business: ${brandProfile.businessName}
- Industry: ${businessType}
- Location: ${brandProfile.location || 'Global'}
- Platform: ${platform}
- Content Approach: ${selectedApproach} (use this strategic angle)${localLanguageInstructions}

💼 BUSINESS INTELLIGENCE:
${Array.isArray(brandProfile.keyFeatures) ? `- Key Features: ${brandProfile.keyFeatures.slice(0, 5).join(', ')}` : ''}
${Array.isArray(brandProfile.competitiveAdvantages) ? `- Competitive Advantages: ${brandProfile.competitiveAdvantages.slice(0, 3).join(', ')}` : ''}
${Array.isArray(brandProfile.services) ? `- Services: ${brandProfile.services.map(s => s.name).slice(0, 4).join(', ')}` : ''}
${brandProfile.targetAudience ? `- Target Audience: ${brandProfile.targetAudience}` : ''}
${brandProfile.competitivePositioning ? `- Positioning: ${brandProfile.competitivePositioning}` : ''}
${brandProfile.description ? `- Business Description: ${brandProfile.description.substring(0, 200)}` : ''}

🏆 COMPETITIVE ANALYSIS:
${getCompetitorAnalysis(brandProfile)}

🖼️ VISUAL CONTEXT:
The generated image shows: ${concept.concept}
${imagePrompt ? `Image elements include: ${getDetailedVisualContext(imagePrompt, businessType)}` : ''}${serviceContentContext}${imageAnalysisContext}

📸 REALISTIC PHOTOGRAPHY REQUIREMENTS:
- Show REAL people in NATURAL settings (not staged poses)
- Use CLEAN, SIMPLE compositions without artificial effects
- Focus on AUTHENTIC interactions with technology
- Avoid ANY flowing lines, glowing effects, or abstract elements
- Show actual mobile banking interfaces, not fantasy effects
- Use natural lighting and realistic environments
- NO computer-generated visual effects that look fake

📖 AUTHENTIC STORYTELLING SCENARIOS (USE THESE REAL-LIFE STORIES):
${getAuthenticStoryScenarios(brandProfile, businessType)}

🎯 CONTENT ALIGNMENT REQUIREMENTS:
- Caption MUST be relevant to the visual elements in the image
- Write about what's actually shown in the design
- Match the tone and context of the visual setting
- Be specific about the business services that relate to the visual context
${concept.featuredServices && concept.featuredServices.length > 0 ? `- Highlight today's featured service: "${concept.featuredServices[0].serviceName}"` : ''}

📝 CONTENT REQUIREMENTS - MUST WORK TOGETHER AS ONE STORY:
1. HEADLINE (max 6 words): This will appear as text IN the image design - make it compelling
2. SUBHEADLINE (max 25 words): This will also appear IN the image - should support the headline

✏️ GRAMMAR & LANGUAGE RULES (CRITICAL):
- CORRECT: "Payments that fit your day" (plural subject = plural verb)
- WRONG: "Payments that fits your day" (grammar error)
- CORRECT: "Business that grows" (singular) / "Businesses that grow" (plural)
- CHECK subject-verb agreement in ALL content
- USE proper English grammar throughout
- AVOID grammatical errors that make content look unprofessional
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

🚨 CRITICAL: UNIFIED STORY REQUIREMENT (MANDATORY):
ALL ELEMENTS MUST TELL ONE COHERENT STORY - NO DISCONNECTED PIECES!

📝 CONTENT REQUIREMENTS - SINGLE NARRATIVE THREAD:
1. HEADLINE (max 6 words): Sets the CORE MESSAGE - everything else builds on this
2. SUBHEADLINE (max 12 words): DIRECTLY supports and expands the headline message
3. CAPTION (2-3 sentences): CONTINUES the exact story started in headline, NO topic shifts
4. HASHTAGS (exactly 5 tags): REFLECT the same theme as headline/caption
5. CALL-TO-ACTION: COMPLETES the story with clear next step

🚨 BUSINESS RELEVANCE VALIDATION (CRITICAL):
- NEVER create content about industries/services the business doesn't offer
- If business is FINTECH → NO textbooks, education, semester themes unless specifically relevant
- If business is HEALTHCARE → NO banking, payments, technology themes unless relevant  
- If business is EDUCATION → NO banking, medical, retail themes unless relevant
- ALWAYS check: Does this headline relate to the actual business services?
- BANNED for Paya Finance: Textbook themes, education scenarios, semester content (unless specifically about education financing)
- REQUIRED: Headlines must connect to actual business services and target audience

🔗 STORY COHERENCE VALIDATION (NON-NEGOTIABLE):
- HEADLINE and CAPTION must share common keywords or themes
- If headline mentions "TEXTBOOK" → caption MUST mention textbooks/education/studying
- If headline mentions "POCKET" → caption MUST mention phone/mobile/payment in pocket
- If headline mentions "SECURE" → caption MUST mention security/protection/safety
- If headline mentions "DAILY" → caption MUST mention everyday/routine activities
- NEVER write generic captions that could work with any headline
- Caption must SPECIFICALLY relate to and expand on the headline message
- NO corporate filler language: "puts BNPL front and center today"

💡 SERVICE-SPECIFIC CONTENT RULES:
${Array.isArray(brandProfile.services) ? brandProfile.services.map(service => 
  `- ${service.name}: ${service.description || 'Focus on specific benefits and outcomes'}`
).join('\n') : ''}
${Array.isArray(brandProfile.keyFeatures) ? `- Use these key features: ${brandProfile.keyFeatures.slice(0, 3).join(', ')}` : ''}
${Array.isArray(brandProfile.competitiveAdvantages) ? `- Highlight advantages: ${brandProfile.competitiveAdvantages.slice(0, 2).join(', ')}` : ''}

🎯 CUSTOMER PAIN POINTS & SOLUTIONS:
${getCustmerPainPointsForBusiness(businessType, brandProfile)}

💰 VALUE PROPOSITIONS (USE THESE):
${getValuePropositionsForBusiness(businessType, brandProfile)}

🎯 PAYA-SPECIFIC CONTENT FOCUS (MANDATORY):
- Focus on REAL Paya services: Mobile Banking, Buy Now Pay Later, Instant Payments, Business Payments
- Target REAL audiences: Small business owners, entrepreneurs, unbanked Kenyans, mobile money users
- Address REAL pain points: Bank queues, credit requirements, high fees, slow transfers
- Use REAL benefits: No credit checks, instant account opening, transparent fees, mobile convenience
- AVOID: Generic education themes, textbook scenarios, semester content (unless specifically about education financing)
- CREATE: Authentic fintech scenarios that Paya customers actually experience

🚫 ANTI-AI VISUAL RULES (CRITICAL):
- NO flowing lines, waves, or streams coming from devices
- NO glowing trails, light beams, or energy effects around phones
- NO abstract colorful ribbons or flowing elements
- NO overly stylized lighting effects or artificial glows
- NO computer-generated looking visual effects
- USE: Clean, realistic photography without artificial effects
- SHOW: Real people using real devices in natural settings
- AVOID: Any elements that look obviously AI-generated or fake

🚫 BANNED CORPORATE JARGON (ELIMINATE THESE):
- "Payments that fits your day" (WRONG GRAMMAR + GENERIC)
- "focuses on what matters and cuts the noise" (CORPORATE SPEAK)
- "streamlined solutions" / "seamless experience" / "cutting-edge technology"
- "empowering businesses" / "driving growth" / "innovative solutions"
- "best-in-class" / "world-class" / "industry-leading"
- REPLACE WITH: Specific, measurable benefits and real business scenarios
- USE: "98% faster means your supplier gets paid before lunch, your team sees deposits by Friday morning"
- SHOW: Concrete outcomes, not abstract concepts

🏆 COMPETITIVE MESSAGING RULES (USE THESE):
${getCompetitiveMessagingRules(brandProfile)}

📱 HASHTAG REQUIREMENTS (CRITICAL - EXACTLY 5 ONLY):
- MAXIMUM 5 hashtags total - NO MORE than 5
- NEVER exceed 5 hashtags - this is non-negotiable
- Choose the BEST 5 most relevant hashtags only
- Example format: #Paya #DigitalBanking #Kenya #Fintech #MobileMoney
- DO NOT include: #PayaFintech #BNPLKenya #SmartSpending #NairobiFinance #FinTechKenya #PaymentPlans #BuyNowPayLater #DeferredPayment #FlexiblePayment #InstallmentPlans
- PRIORITIZE: Brand name (#Paya) + Service type + Location + Industry + One specific feature
- QUALITY over quantity - 5 strategic hashtags perform better than 10 generic ones

🇰🇪 KENYAN CULTURAL CONNECTION (MANDATORY):
- Reference real Kenyan experiences: matatu rides, M-Pesa, university fees, family support
- Use locally relevant scenarios: "When your cousin needs school fees", "After a long day at work"
- Include Kenyan context: Nairobi traffic, campus life, family obligations, side hustles
- Sound like someone who actually lives in Kenya and understands daily challenges
- Reference local pain points: expensive bank charges, long queues, complicated processes

💪 SPECIFIC VALUE PROPOSITIONS (NO VAGUE BENEFITS):
- Instead of "thoughtful details" → "No hidden fees, ever"
- Instead of "measurable outcomes" → "Save KES 500 monthly on bank charges"
- Instead of "stripped away confusion" → "Open account in 3 minutes, not 3 hours"
- Use EXACT numbers, SPECIFIC benefits, CONCRETE improvements
- Answer "So what?" - why should someone care about this specific feature?

💔 EMOTIONAL PAIN POINTS & SOLUTIONS:
- Address real struggles: "Tired of banks treating you like a number?"
- Connect to family: "Your family deserves better than expensive bank fees"
- Student focus: "University fees shouldn't break your budget"
- Entrepreneur angle: "Your business dreams shouldn't wait for bank approval"
- Show understanding: "We get it - banking shouldn't be this hard"

📢 COMPELLING CALL-TO-ACTION (NO TRAILING OFF):
- NEVER end captions with "..." or weak conclusions
- Use action-driving CTAs: "Download now", "Join 1M+ Kenyans", "Start saving today"
- Create urgency: "Limited time", "This month only", "Don't wait"
- Make it specific: "Get your account in 5 minutes", "Save KES 200 this week"

🎭 CONTENT STRUCTURE VARIETY (BREAK REPETITIVE PATTERNS):
- REAL SCENARIO: "Three weeks into semester and your laptop died. Again. But next month's rent is due..."
- EMOTIONAL MOMENT: "Your mom calls. The shop needs new equipment. Your heart sinks because..."
- RELATABLE STRUGGLE: "It's 2am. Assignment due tomorrow. Laptop screen goes black. Panic mode."
- TRANSFORMATION STORY: "Last month: stressed about money. This month: sleeping peacefully. What changed?"
- FRIEND CONVERSATION: "Real talk: remember when banking meant standing in line for hours?"
- BREAKTHROUGH MOMENT: "Plot twist: what if paying bills didn't have to stress you out?"
- EMPATHY FIRST: "We've all been there. Paycheck delayed, bills due, options limited."
- SOLUTION REVEAL: "Here's what nobody tells you about managing money in Kenya..."

🚫 ELIMINATE GENERIC HEADLINES (CRITICAL):
- NEVER use: "Family Fun, On Your Terms" (could be Netflix, Airbnb, anything)
- NEVER use: "Shop. Travel. Live. Easy." (zero personality)
- AVOID: Headlines that could apply to ANY product or service
- CREATE: Headlines that could ONLY be about Paya's specific solution
- MAKE IT: Memorable, shareable, and distinctly Paya

🚫 ELIMINATE CAPTION PROBLEMS (CRITICAL):
- NEVER trail off with "..." (incomplete thoughts) - COMPLETE THE STORY
- NEVER copy-paste generic text: "Paya Finance puts Buy Now Pay Later (BNPL) front and center today"
- NEVER use same caption structure for different headlines
- NEVER end abruptly - always complete the thought with strong CTA
- BANNED INCOMPLETE PHRASES: "makes it practical, useful, and..." ← FINISH THE SENTENCE!

✅ CORRECT CAPTION EXAMPLES BY HEADLINE:
- "TEXTBOOK STRESS?" → "It's week 3. Professor just assigned 5 new textbooks at $80 each. Your account says $47. Paya Finance lets you get every book today, pay over time. Stay in class, not behind."
- "DREAM IT, GET IT." → "That vision board isn't decoration—it's a to-do list. The laptop upgrade, the desk setup, the tools that turn ideas into income. Paya Finance funds your hustle now, you pay as you profit."
- "OWN YOUR EDUCATION. PAY LATER" → "Tuition. Books. Lab fees. Accommodation. The list is long, the bank account isn't. Paya Finance breaks down the barriers between you and your degree. Learn now, pay as you earn."
- Each caption tells a COMPLETE, SPECIFIC story that matches its headline

🚫 ELIMINATE JARGON OVERUSE (CRITICAL):
- NEVER overuse "BNPL" acronym or "(BNPL)" in parentheses
- INSTEAD OF: "Buy Now Pay Later (BNPL)" → "Get what you need now, pay when you're ready"
- FOCUS ON: Benefits and outcomes, not technical terms
- WRITE FOR: Regular people, not fintech insiders
- ASSUME: People care about solutions, not acronyms

💡 BENEFIT-FOCUSED, NOT FEATURE-FOCUSED (MANDATORY):
- WRONG: "Paya offers Buy Now Pay Later feature"
- RIGHT: "Get your laptop today, pay next month when your freelance project pays out"
- WRONG: "Our BNPL solution provides flexible payment options"
- RIGHT: "Sleep better knowing you can handle emergencies without stress"
- SHOW: How life gets better, not what the product does
- FOCUS: On transformation and outcomes, not features and functions

🎯 AUTHENTIC PAYA PERSONALITY TRAITS:
- UNDERSTANDING: "We get the hustle - banking shouldn't add stress"
- SUPPORTIVE: "Your dreams matter, whether big or small"
- PRACTICAL: "Real solutions for real Kenyans"
- ACCESSIBLE: "Banking that speaks your language"
- EMPOWERING: "Take control of your money, your way"
- RELIABLE: "Always there when you need us"
- NEVER start headlines with company name followed by colon (e.g., "PAYA:", "CompanyName:")
- Use DISTINCT vocabulary and a different angle from common phrases
- Vary sentence length; avoid template-like structures
- Headlines should be engaging and standalone, not company-prefixed
- CULTURAL INTELLIGENCE: Use language and concepts that local people easily understand

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

🚨 CRITICAL CONTENT ALIGNMENT & ANTI-REPETITION:
- The headline and subheadline you generate MUST match the text elements shown in the image
- If the image shows "Smart Banking Solutions", your headline should be "Smart Banking Solutions"
- If the image shows "Quality You Can Trust", your caption should reinforce this message
- NEVER contradict what's visually shown in the image with different text in the caption
- However, NEVER generate headlines with company name prefix or "journey" language, even if it appears in the image
- The caption should tell the story that the visual headline/subheadline starts

🚫 CRITICAL ANTI-REPETITION RULES (MANDATORY):
- NEVER use these overused phrases: "Finance Your Ambitions", "Transform Your Business", "Empower Your Future"
- NEVER use "journey", "everyday", "seamless", "effortless" in headlines
- AVOID generic templates like "[Action] Your [Business Concept]"
- CREATE unique, specific value propositions instead of generic corporate speak
- USE concrete benefits and specific outcomes
- VARY sentence structure and vocabulary completely from recent generations
- Recent concepts to AVOID: ${recentData.concepts.slice(0, 3).join(', ')}
- Recent headlines to AVOID: ${recentData.headlines.slice(0, 3).join(', ')}

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

    // Retry mechanism - attempt AI generation multiple times before fallback
    const maxRetries = 3;
    let lastError: any = null;
    const fallbackTheme = 'customer-centric'; // Define theme for headline generation
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 [Revo 2.0] AI Generation Attempt ${attempt}/${maxRetries} - Using Claude Sonnet 4.5`);
        
        const claudeResult = await getClaudeClient().generateText(
          contentPrompt,
          'claude-sonnet-4-5-20250929',
          {
            temperature: 0.8 + (Math.random() * 0.3), // 0.8-1.1 for variety
            maxTokens: 1000
          }
        );
        const content = claudeResult.text;
        console.log(`📊 [Revo 2.0] Claude tokens used: ${claudeResult.tokensUsed.total}`);
        console.log(`⏱️ [Revo 2.0] Claude processing time: ${claudeResult.processingTime}ms`);

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
      } else if (finalHashtags.length < hashtagCount) {
        // Generate platform-appropriate hashtags if count is wrong
        finalHashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount);
      }

      // Final validation - ensure EXACTLY the right count
      finalHashtags = finalHashtags.slice(0, hashtagCount);

      // Anti-repetition enforcement
      const key = brandKey(brandProfile, platform);
      const recent = recentOutputs.get(key) || { headlines: [], captions: [], concepts: [] };

      // Enhanced caption validation with multiple checks
      let caption = parsed.caption || '';

      // Enhanced caption validation with more checks
      const captionHasJourney = /\b(journey|everyday)\b/i.test(caption);
      const captionTooSimilar = tooSimilar(caption, recent.captions, 0.40);
      const captionHasBannedPatterns = hasBannedPattern(caption);
      const captionIsGeneric = caption.includes('Experience the excellence of') ||
        caption.includes('makes financial technology company effortless') ||
        /makes .+ effortless and effective/i.test(caption) ||
        /makes .+ company effortless and effective/i.test(caption) ||
        caption.includes('crafted for Kenya') ||
        caption.includes('crafted for Nigeria') ||
        caption.includes('crafted for Ghana') ||
        /crafted for [A-Z][a-z]+/i.test(caption) ||
        /transform your .+ with/i.test(caption) ||
        /empower your .+ through/i.test(caption);
      const captionIsEmpty = !caption || caption.trim().length === 0;

      // NEW: Add headline-caption coherence validation
      const headlineWords = (parsed.headline || '').toLowerCase().split(/\s+/);
      const captionWords = caption.toLowerCase().split(/\s+/);
      const hasCommonWords = headlineWords.some(word => 
        word.length > 3 && captionWords.some(capWord => capWord.includes(word) || word.includes(capWord))
      );
      const captionDisconnected = !hasCommonWords && caption.length > 50; // Only check if caption is substantial

      if (captionIsEmpty || captionHasJourney || captionTooSimilar || captionIsGeneric || captionHasBannedPatterns || captionDisconnected) {
        const reason = captionIsEmpty ? 'empty' : 
                      captionHasJourney ? 'journey words' : 
                      captionTooSimilar ? 'too similar' : 
                      captionIsGeneric ? 'generic pattern' : 
                      captionHasBannedPatterns ? 'banned pattern' : 
                      'disconnected from headline';
        console.log(`🚫 [Revo 2.0] Attempt ${attempt}/${maxRetries} - Rejected caption - Reason: ${reason}`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 [Revo 2.0] Retrying with different temperature and creativity...`);
          // Adjust temperature for next attempt
          continue;
        } else {
          console.log('❌ [Revo 2.0] All AI attempts failed validation - using fallback');
          throw new Error(`Caption validation failed after ${maxRetries} attempts: ${reason}`);
        }
      }

      let headline = stripOverusedWords(parsed.headline || '');

      // Enhanced validation layers for headline quality
      const hasJourneyWords = /\b(journey|everyday)\b/i.test(headline);
      const hasColonPrefix = /^[A-Z]+:\s/.test(headline);
      const hasBannedPatterns = hasBannedPattern(headline);
      const isTooSimilar = tooSimilar(headline, recent.headlines, 0.55);
      const isEmpty = !headline || headline.trim().length === 0;
      const isGenericPattern = /^[a-z]+ your [a-z]+$/i.test(headline.trim());

      if (isEmpty || hasJourneyWords || hasColonPrefix || hasBannedPatterns || isTooSimilar || isGenericPattern) {
        const headlineReason = isEmpty ? 'empty' : hasJourneyWords ? 'journey words' : hasColonPrefix ? 'colon prefix' : hasBannedPatterns ? 'banned pattern' : isTooSimilar ? 'too similar' : 'generic pattern';
        console.log(`🚫 [Revo 2.0] Attempt ${attempt}/${maxRetries} - Rejected headline: "${headline}" - Reason: ${headlineReason}`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 [Revo 2.0] Retrying with different approach...`);
          continue;
        } else {
          console.log('❌ [Revo 2.0] All AI attempts failed headline validation - using fallback');
          headline = generateUniqueHeadline(brandProfile, businessType, fallbackTheme);
        }
      }

      // Remember accepted output for future anti-repetition checks
      rememberOutput(key, { headline, caption });

      console.log(`✅ [Revo 2.0] AI Generation Successful on attempt ${attempt}/${maxRetries}`);
      return {
        caption: sanitizeGeneratedCopy(caption, brandProfile, businessType) as string,
        hashtags: finalHashtags,
        headline: sanitizeGeneratedCopy(headline, brandProfile, businessType),
        subheadline: sanitizeGeneratedCopy(parsed.subheadline, brandProfile, businessType),
        cta: sanitizeGeneratedCopy(parsed.cta, brandProfile, businessType),
        captionVariations: [sanitizeGeneratedCopy(caption, brandProfile, businessType) as string]
      };

      } catch (parseError) {
        console.warn(`⚠️ [Revo 2.0] Attempt ${attempt}/${maxRetries} - Failed to parse JSON: ${parseError.message}`);
        lastError = parseError;
        if (attempt < maxRetries) {
          console.log(`🔄 [Revo 2.0] Retrying with different temperature...`);
          continue;
        }
      }

      } catch (aiError) {
        console.warn(`⚠️ [Revo 2.0] Attempt ${attempt}/${maxRetries} - AI generation failed: ${aiError.message}`);
        lastError = aiError;
        if (attempt < maxRetries) {
          console.log(`🔄 [Revo 2.0] Retrying AI generation...`);
          continue;
        }
      }
    }

    // All retries failed, use fallback
    console.warn(`❌ [Revo 2.0] All ${maxRetries} AI attempts failed. Using fallback content.`);
    console.warn(`Last error: ${lastError?.message || 'Unknown error'}`);
    return generateUniqueFallbackContent(brandProfile, businessType, platform, hashtagCount, creativityBoost, concept);

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Content generation failed, generating unique fallback');
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
    `${svc} that actually works. Your ${loc} supplier gets paid in 3 minutes, not 3 days.`,
    `KES 50,000 sent at 9 AM, confirmed by 9:03 AM. Your inventory arrives tomorrow, not next week.`,
    `Your Friday payroll runs automatically while you're in client meetings. No more payment delays.`,
    `Mombasa Road supplier paid before lunch. Your team sees deposits by Friday morning.`,
    `98% faster payments mean you stop being the bottleneck. Focus on growing, not admin chaos.`,
    `Student needs lunch money at 1 PM. Parent sends KES 500, student buying food by 1:03 PM.`,
    `Emergency medicine money sent instantly. Baby gets treatment, family sends grateful messages.`,
    `Business cash flow that actually flows. Payments in minutes, not days or weeks.`
  ] : [
    `Your ${loc} business runs smoother when payments work instantly. No more waiting days for confirmations.`,
    `KES 25,000 supplier payment sent at 2 PM, confirmed by 2:02 PM. Your ${loc} operations never skip a beat.`,
    `While competitors take 3-5 business days, ${base} processes payments in under 3 minutes.`,
    `Friday payroll for your ${loc} team runs automatically. You focus on business, we handle the money flow.`,
    `Emergency funds sent instantly to your ${loc} branch. Crisis handled, business continues.`,
    `Your ${loc} customers pay instantly, you receive money immediately. Cash flow that actually flows.`,
    `98% faster than traditional banking means your ${loc} suppliers get paid before lunch, not next week.`,
    `Student in ${loc} needs transport money. Parent sends KES 200, student catches the next matatu.`
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
 * Get customer pain points for specific business types
 */
function getCustmerPainPointsForBusiness(businessType: string, brandProfile: any): string {
  const businessLower = businessType.toLowerCase();
  const location = brandProfile?.location || 'your area';
  
  // Fintech/Financial Services
  if (businessLower.includes('financial') || businessLower.includes('fintech') || 
      businessLower.includes('banking') || businessLower.includes('payment')) {
    return `- PAIN: Long bank queues and slow approval processes
- PAIN: Complex credit requirements that exclude many people
- PAIN: High transaction fees eating into profits
- PAIN: Delayed payments affecting cash flow
- PAIN: Limited banking access in remote areas
- SOLUTION: Instant account opening in minutes
- SOLUTION: No credit checks required - banking for everyone
- SOLUTION: Transparent, low fees with no hidden charges
- SOLUTION: Real-time payments and transfers`;
  }
  
  // Technology/Software
  if (businessLower.includes('technology') || businessLower.includes('software') || 
      businessLower.includes('app') || businessLower.includes('digital')) {
    return `- PAIN: Complex software that's hard to use
- PAIN: Expensive implementation and maintenance costs
- PAIN: Poor customer support and long response times
- PAIN: Data security concerns and privacy issues
- SOLUTION: User-friendly interface anyone can master
- SOLUTION: Affordable pricing with transparent costs
- SOLUTION: 24/7 support with real human experts
- SOLUTION: Bank-level security protecting your data`;
  }
  
  // E-commerce/Retail
  if (businessLower.includes('retail') || businessLower.includes('shop') || 
      businessLower.includes('store') || businessLower.includes('commerce')) {
    return `- PAIN: High shipping costs and slow delivery
- PAIN: Limited payment options for customers
- PAIN: Difficulty finding quality products at fair prices
- PAIN: Poor customer service and return policies
- SOLUTION: Fast, affordable delivery to ${location}
- SOLUTION: Multiple secure payment methods
- SOLUTION: Quality products at competitive prices
- SOLUTION: Excellent customer service and easy returns`;
  }
  
  // Default for any business
  return `- PAIN: Slow, inefficient processes wasting time
- PAIN: High costs without clear value
- PAIN: Poor customer service experiences
- PAIN: Lack of transparency and hidden fees
- SOLUTION: Fast, efficient service that saves time
- SOLUTION: Clear, competitive pricing with real value
- SOLUTION: Excellent customer support when you need it
- SOLUTION: Complete transparency with no surprises`;
}

/**
 * Get competitor analysis for marketing positioning
 */
function getCompetitorAnalysis(brandProfile: any): string {
  if (!Array.isArray(brandProfile.competitors) || brandProfile.competitors.length === 0) {
    return '- No specific competitor data available - focus on general market advantages';
  }

  let analysis = '';
  brandProfile.competitors.forEach((competitor: any, index: number) => {
    if (index < 3) { // Limit to top 3 competitors
      analysis += `\n🆚 VS ${competitor.name}:`;
      if (Array.isArray(competitor.weaknesses)) {
        analysis += `\n  - Their weaknesses: ${competitor.weaknesses.join(', ')}`;
      }
      if (Array.isArray(competitor.ourAdvantages)) {
        analysis += `\n  - Our advantages: ${competitor.ourAdvantages.join(', ')}`;
      }
    }
  });

  return analysis || '- Focus on unique value propositions and market differentiation';
}

/**
 * Get authentic storytelling scenarios for real-life use cases
 */
function getAuthenticStoryScenarios(brandProfile: any, businessType: string): string {
  const businessLower = businessType.toLowerCase();
  const location = brandProfile?.location?.country || 'Kenya';
  
  // Fintech/Financial Services Stories
  if (businessLower.includes('financial') || businessLower.includes('fintech') || 
      businessLower.includes('banking') || businessLower.includes('payment')) {
    
    return `CHOOSE ONE OF THESE REAL-LIFE STORIES TO TELL:

📱 FAMILY CONNECTION STORIES:
- University student in Nairobi sends money to mother in village, mother receives notification and sends "Asante sana" message back
- Young professional sends school fees to younger sibling, sibling confirms receipt with gratitude
- Daughter working in city sends monthly support to parents, parents reply with blessing message
- Son abroad sends money home for family emergency, family receives instantly and calls to thank

💼 BUSINESS REALITY STORIES:  
- Small shop owner pays supplier instantly via mobile, supplier confirms goods will be delivered today
- Market vendor receives payment from customer, immediately sends money to restock inventory
- Taxi driver receives fare payment, uses same app to pay for fuel at next station
- Food vendor gets paid by customer, instantly transfers money to buy fresh ingredients

🎓 STUDENT LIFE STORIES:
- Student runs out of lunch money, parent sends money instantly, student buys meal within minutes
- Student needs textbook money urgently, parent transfers funds, student purchases book same day
- Student's phone credit runs out during exam period, parent sends money for airtime top-up
- Student needs transport money to get home, parent sends fare money instantly

🏥 EMERGENCY STORIES:
- Mother needs medicine money for sick child, relative sends money immediately, medicine purchased within hour
- Family member in hospital needs money for treatment, relatives contribute and send funds instantly
- Emergency car repair needed, family member sends money, car fixed same day
- School fees deadline today, parent receives money from relative and pays fees on time

USE THESE STORY ELEMENTS:
- Show BOTH sender and receiver in the story
- Include the EMOTIONAL connection (gratitude, relief, joy)
- Show the IMMEDIATE impact of the transaction
- Use REAL locations (Nairobi to village, campus to home, etc.)
- Include authentic Kenyan expressions of gratitude
- Show the COMPLETE transaction journey from send to receive to outcome`;
  }
  
  // Default for other business types
  return `CREATE AUTHENTIC CUSTOMER JOURNEY STORIES:
- Show real people using your service in their daily lives
- Include the problem, solution, and positive outcome
- Use specific locations and realistic scenarios
- Show emotional connections and genuine reactions
- Focus on how the service improves real situations`;
}

/**
 * Get competitive messaging rules for content generation
 */
function getCompetitiveMessagingRules(brandProfile: any): string {
  if (!Array.isArray(brandProfile.competitors) || brandProfile.competitors.length === 0) {
    return '- Focus on unique value propositions and market leadership\n- Highlight what makes you different from generic alternatives\n- Use specific benefits rather than generic claims';
  }

  let rules = '';
  brandProfile.competitors.forEach((competitor: any, index: number) => {
    if (index < 2) { // Focus on top 2 competitors
      rules += `\n- VS ${competitor.name}: `;
      if (Array.isArray(competitor.ourAdvantages) && competitor.ourAdvantages.length > 0) {
        rules += `Emphasize "${competitor.ourAdvantages[0]}" advantage`;
      }
      if (Array.isArray(competitor.weaknesses) && competitor.weaknesses.length > 0) {
        rules += ` (they have: ${competitor.weaknesses[0]})`;
      }
    }
  });

  // Add general competitive messaging rules
  rules += `\n- Use specific numbers and concrete benefits (not generic claims)
- Position as the BETTER alternative, not just another option
- Address competitor weaknesses without naming them directly
- Focus on what customers get that they can't get elsewhere`;

  return rules;
}

/**
 * Get value propositions for specific business types
 */
function getValuePropositionsForBusiness(businessType: string, brandProfile: any): string {
  const businessLower = businessType.toLowerCase();
  const businessName = brandProfile?.businessName || 'Our Business';
  const location = brandProfile?.location || 'your area';
  
  // Fintech/Financial Services
  if (businessLower.includes('financial') || businessLower.includes('fintech') || 
      businessLower.includes('banking') || businessLower.includes('payment')) {
    return `- "Open account in minutes, not days"
- "No credit checks - banking for everyone in ${location}"
- "Save money with transparent, low fees"
- "Bank-level security protecting every transaction"
- "Mobile banking anywhere, anytime"
- "Join thousands already banking smarter"`;
  }
  
  // Technology/Software
  if (businessLower.includes('technology') || businessLower.includes('software') || 
      businessLower.includes('app') || businessLower.includes('digital')) {
    return `- "Technology that actually works for you"
- "Save time with automated solutions"
- "Reduce costs while improving efficiency"
- "24/7 support from real experts"
- "Secure, reliable platform you can trust"
- "Easy setup - running in minutes, not months"`;
  }
  
  // Default value propositions
  return `- "${businessName} delivers real results"
- "Save time and money with our efficient solutions"
- "Professional service with personal attention"
- "Trusted by customers throughout ${location}"
- "Quality results at competitive prices"
- "Your success is our priority"`;
}

/**
 * REMOVED: Fallback caption function replaced with forced regeneration
 * This function was causing generic corporate language to override AI output
 * Now we force Claude to regenerate with stricter coherence rules instead
 */

/**
 * Main Revo 2.0 generation function
 * Generate content with Revo 2.0 (Gemini 2.5 Flash Image Preview)
 */
export async function generateWithRevo20(options: Revo20GenerationOptions): Promise<Revo20GenerationResult> {
  const startTime = Date.now();

  try {

    // Auto-detect platform-specific aspect ratio if not provided
    const aspectRatio = options.aspectRatio || getPlatformAspectRatio(options.platform);
    const enhancedOptions = { ...options, aspectRatio };

    // Step 1: Generate creative concept with timeout
    const concept = await Promise.race([
      generateCreativeConcept(enhancedOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Creative concept generation timeout')), 60000))
    ]);

    // Step 2: Build enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(enhancedOptions, concept);

    // Step 3: Generate image with Gemini 2.5 Flash Image Preview with timeout
    const imageResult = await Promise.race([
      generateImageWithGemini(enhancedPrompt, enhancedOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 20000))
    ]);

    // Step 4: Generate caption and hashtags with timeout
    const contentResult = await Promise.race([
      generateCaptionAndHashtags(enhancedOptions, concept, enhancedPrompt, imageResult.imageUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Content generation timeout')), 60000))
    ]);

    const processingTime = Date.now() - startTime;

    // 🔤 SPELL CHECK: Ensure headlines and subheadlines are spell-checked before final result
    let finalContentResult = contentResult;
    try {

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
      }

      if (spellCheckedContent.subheadline !== contentResult.subheadline) {
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
      }

    } catch (error) {
      console.warn('🔤 [Revo 2.0] Spell check failed, using original content:', error);
      finalContentResult = contentResult;
    }

    return {
      imageUrl: imageResult.imageUrl,
      model: 'Revo 2.0 Claude Edition (Claude Sonnet 4.5 + Gemini Image)',
      qualityScore: 9.5,
      processingTime,
      enhancementsApplied: [
        'Claude Sonnet 4.5 content generation',
        'Global localization (13+ countries)',
        '15 enhanced content approaches',
        'Advanced anti-repetition system',
        'Image analysis integration',
        'Cultural intelligence',
        'Brand consistency optimization',
        'Platform-specific formatting',
        'Spell check integration'
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

    const response = await generateContentWithProxy('Create a simple test image with the text "Revo 2.0 Test" on a modern gradient background', REVO_2_0_MODEL, true);

    const result = await response.response;
    const candidates = result.candidates;

    if (candidates && candidates.length > 0) {
      return true;
    }

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

/**
 * Get location-specific language instructions for global localization
 * Supports 13+ countries with authentic local language integration
 */
function getLocationSpecificLanguageInstructions(location: string): string {
  const locationKey = location.toLowerCase();

  if (locationKey.includes('kenya')) {
    return `- SWAHILI ELEMENTS: "Karibu" (welcome), "Asante" (thank you), "Haraka" (fast), "Poa" (cool/good), "Mambo" (what's up)
- BUSINESS CONTEXT: "Biashara" (business), "Huduma" (service), "Kazi" (work), "Pesa" (money), "Benki" (bank)
- FINTECH TERMS: "M-Pesa" (mobile money), "Simu" (phone), "Mitandao" (networks), "Usalama" (security)
- GREETINGS: "Jambo" (hello), "Habari" (how are you), "Sawa" (okay/fine), "Vipi" (how's it going)
- EXPRESSIONS: "Hakuna matata" (no problem), "Pole pole" (slowly/carefully), "Twende" (let's go), "Fanya haraka" (do it quickly)
- ENCOURAGEMENT: "Hongera" (congratulations), "Vizuri sana" (very good), "Umefanya vizuri" (you did well)
- INTEGRATION EXAMPLES: 
  * "Fast payments" → "Malipo ya haraka"
  * "No worries" → "Hakuna wasiwasi" 
  * "Let's start" → "Twende tuanze"
  * "Very secure" → "Salama sana"`;
  }

  if (locationKey.includes('nigeria')) {
    return `- PIDGIN ELEMENTS: "How far?" (how are you), "Wetin dey happen?" (what's happening), "No wahala" (no problem)
- BUSINESS CONTEXT: "Business dey boom" (business is booming), "Make we go" (let's go), "Sharp sharp" (quickly)
- GREETINGS: "Bawo" (Yoruba hello), "Ndewo" (Igbo hello), "Sannu" (Hausa hello)
- EXPRESSIONS: "E go better" (it will be better), "God dey" (God is there), "Correct" (right/good)`;
  }

  if (locationKey.includes('ghana')) {
    return `- TWI ELEMENTS: "Akwaaba" (welcome), "Medaase" (thank you), "Yie" (good), "Adwo" (peace)
- BUSINESS CONTEXT: "Adwuma" (work), "Sika" (money), "Dwuma" (business)
- GREETINGS: "Maakye" (good morning), "Maaha" (good afternoon)
- EXPRESSIONS: "Ɛyɛ" (it's good), "Ampa" (truly), "Sɛ ɛyɛ a" (if it's good)`;
  }

  if (locationKey.includes('south africa')) {
    return `- MIXED ELEMENTS: "Howzit" (how are you), "Sharp" (good), "Lekker" (nice), "Eish" (expression)
- BUSINESS CONTEXT: "Bakkie" (pickup truck), "Robot" (traffic light), "Braai" (barbecue)
- GREETINGS: "Sawubona" (Zulu hello), "Dumela" (Sotho hello)
- EXPRESSIONS: "Ag man" (oh man), "Just now" (later), "Now now" (soon)`;
  }

  if (locationKey.includes('india')) {
    return `- HINDI ELEMENTS: "Namaste" (hello), "Dhanyawad" (thank you), "Accha" (good), "Jaldi" (quickly)
- BUSINESS CONTEXT: "Vyavasaya" (business), "Seva" (service), "Kaam" (work), "Paisa" (money)
- GREETINGS: "Namaskar" (respectful hello), "Sat Sri Akal" (Punjabi hello)
- EXPRESSIONS: "Bahut accha" (very good), "Chalo" (let's go), "Kya baat hai" (what's the matter)`;
  }

  if (locationKey.includes('philippines')) {
    return `- FILIPINO ELEMENTS: "Kumusta" (how are you), "Salamat" (thank you), "Mabuti" (good), "Bilisan" (hurry up)
- BUSINESS CONTEXT: "Negosyo" (business), "Serbisyo" (service), "Trabaho" (work), "Pera" (money)
- GREETINGS: "Magandang umaga" (good morning), "Kamusta ka" (how are you)
- EXPRESSIONS: "Walang problema" (no problem), "Tara na" (let's go), "Sulit" (difficult/valuable)`;
  }

  if (locationKey.includes('indonesia')) {
    return `- BAHASA ELEMENTS: "Halo" (hello), "Terima kasih" (thank you), "Bagus" (good), "Cepat" (fast)
- BUSINESS CONTEXT: "Bisnis" (business), "Layanan" (service), "Kerja" (work), "Uang" (money)
- GREETINGS: "Selamat pagi" (good morning), "Apa kabar" (how are you)
- EXPRESSIONS: "Tidak masalah" (no problem), "Ayo" (let's go), "Mantap" (great/solid)`;
  }

  if (locationKey.includes('thailand')) {
    return `- THAI ELEMENTS: "Sawasdee" (hello), "Khob khun" (thank you), "Dee" (good), "Rew" (fast)
- BUSINESS CONTEXT: "Thurakit" (business), "Borikan" (service), "Ngan" (work), "Ngern" (money)
- GREETINGS: "Sawasdee krab/ka" (hello), "Sabai dee mai" (how are you)
- EXPRESSIONS: "Mai pen rai" (no problem), "Pai kan" (let's go), "Jai yen" (stay calm)`;
  }

  if (locationKey.includes('vietnam')) {
    return `- VIETNAMESE ELEMENTS: "Xin chào" (hello), "Cảm ơn" (thank you), "Tốt" (good), "Nhanh" (fast)
- BUSINESS CONTEXT: "Kinh doanh" (business), "Dịch vụ" (service), "Công việc" (work), "Tiền" (money)
- GREETINGS: "Chào bạn" (hello friend), "Bạn khỏe không" (how are you)
- EXPRESSIONS: "Không sao" (no problem), "Đi thôi" (let's go), "Tuyệt vời" (excellent)`;
  }

  if (locationKey.includes('brazil')) {
    return `- PORTUGUESE ELEMENTS: "Olá" (hello), "Obrigado/a" (thank you), "Bom" (good), "Rápido" (fast)
- BUSINESS CONTEXT: "Negócio" (business), "Serviço" (service), "Trabalho" (work), "Dinheiro" (money)
- GREETINGS: "Bom dia" (good morning), "Como vai" (how are you)
- EXPRESSIONS: "Sem problema" (no problem), "Vamos lá" (let's go), "Perfeito" (perfect)`;
  }

  if (locationKey.includes('mexico') || locationKey.includes('spain')) {
    return `- SPANISH ELEMENTS: "Hola" (hello), "Gracias" (thank you), "Bueno" (good), "Rápido" (fast)
- BUSINESS CONTEXT: "Negocio" (business), "Servicio" (service), "Trabajo" (work), "Dinero" (money)
- GREETINGS: "Buenos días" (good morning), "¿Cómo estás?" (how are you)
- EXPRESSIONS: "Sin problema" (no problem), "Vamos" (let's go), "Excelente" (excellent)`;
  }

  if (locationKey.includes('france')) {
    return `- FRENCH ELEMENTS: "Bonjour" (hello), "Merci" (thank you), "Bon" (good), "Rapide" (fast)
- BUSINESS CONTEXT: "Affaires" (business), "Service" (service), "Travail" (work), "Argent" (money)
- GREETINGS: "Salut" (hi), "Comment allez-vous" (how are you)
- EXPRESSIONS: "Pas de problème" (no problem), "Allons-y" (let's go), "Parfait" (perfect)`;
  }

  if (locationKey.includes('germany')) {
    return `- GERMAN ELEMENTS: "Hallo" (hello), "Danke" (thank you), "Gut" (good), "Schnell" (fast)
- BUSINESS CONTEXT: "Geschäft" (business), "Service" (service), "Arbeit" (work), "Geld" (money)
- GREETINGS: "Guten Tag" (good day), "Wie geht's" (how are you)
- EXPRESSIONS: "Kein Problem" (no problem), "Los geht's" (let's go), "Perfekt" (perfect)`;
  }

  return `- Use appropriate local language elements for ${location}
- Mix naturally with English for authentic feel
- Focus on greetings, business terms, and common expressions
- Keep it contextual and business-appropriate
- Research local business language and cultural expressions
- Maintain professional tone while adding cultural authenticity`;
}

/**
 * Get enhanced content approaches for Claude-powered generation
 * Expanded from 5 to 15 approaches for maximum variety
 */
function getEnhancedContentApproaches(): string[] {
  return [
    'Storytelling-Master', 'Cultural-Connector', 'Problem-Solver-Pro',
    'Innovation-Showcase', 'Trust-Builder-Elite', 'Community-Champion',
    'Speed-Emphasis', 'Security-Focus', 'Accessibility-First',
    'Growth-Enabler', 'Cost-Savings-Expert', 'Convenience-King',
    'Social-Proof-Power', 'Transformation-Story', 'Local-Hero'
  ];
}
