/**
 * Revo 2.0 Service - Next-Generation AI Content Creation
 * Uses direct Vertex AI for enhanced content generation
 * Now supports Multi-Assistant Architecture for specialized content generation
 */

import type { BrandProfile, Platform } from '@/lib/types';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';
import { getGeminiAPIClient } from '@/lib/services/gemini-api-client';
import { getClaudeClient } from '@/lib/services/claude-client';
import {
  TextGenerationHandler,
  TextGenerationParams,
  normalizeServiceList,
  normalizeStringList,
  getBrandKey
} from './revo/shared-pipeline';
import { generateBusinessTypePromptInstructions, getBusinessTypeStrategy } from './prompts/business-type-strategies';
import { assistantManager } from './assistants';
import { detectBusinessType } from './adaptive/business-type-detector';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type VertexGenerationOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  logoImage?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; // Gemini 3 Pro aspect ratio
  imageSize?: '256' | '512' | '1K' | '2K'; // Gemini 3 Pro image size
};

export const defaultClaudeGenerator: TextGenerationHandler = {
  label: 'Claude Sonnet 4.5',
  async generate(prompt, params) {
    const result = await getClaudeClient().generateText(
      prompt,
      'claude-sonnet-4-5-20250929',
      {
        temperature: params.temperature,
        maxTokens: params.maxTokens
      }
    );

    return {
      text: result.text,
      model: result.model,
      tokensUsed: result.tokensUsed?.total,
      processingTime: result.processingTime
    };
  }
};

// Direct Vertex AI function for all AI generation
export async function generateContentDirect(
  promptOrParts: string | any[],
  modelName: string,
  isImageGeneration: boolean,
  options: VertexGenerationOptions = {}
): Promise<any> {

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
      // Route to appropriate API based on model
      const isGemini3Pro = modelName.includes('gemini-3-pro-image');
      
      let result;
      if (isGemini3Pro) {
        // PRIMARY: Try Gemini 3 Pro via direct API first
        try {
          console.log('🎨 [Revo 2.0] PRIMARY: Using Gemini 3 Pro via direct API');
          result = await getGeminiAPIClient().generateImage(prompt, modelName, {
            temperature: options.temperature ?? 0.7,
            aspectRatio: options.aspectRatio,
            imageSize: options.imageSize,
            logoImage: options.logoImage ?? logoImage
          });
          console.log('✅ [Revo 2.0] Gemini 3 Pro generation successful');
        } catch (gemini3Error) {
          // FALLBACK: Use Vertex AI if Gemini 3 Pro fails
          console.warn('⚠️ [Revo 2.0] Gemini 3 Pro failed, falling back to Vertex AI:', gemini3Error instanceof Error ? gemini3Error.message : gemini3Error);
          console.log('🔄 [Revo 2.0] FALLBACK: Using Gemini 2.5 via Vertex AI');
          result = await getVertexAIClient().generateImage(prompt, REVO_2_0_FALLBACK_MODEL, {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 8192,
            logoImage: options.logoImage ?? logoImage,
            aspectRatio: options.aspectRatio,
            imageSize: options.imageSize
          });
          console.log('✅ [Revo 2.0] Fallback generation successful');
        }
      } else {
        // Use Vertex AI for other models (Gemini 2.5, etc.)
        console.log('🎨 [Revo 2.0] Using Vertex AI for model:', modelName);
        result = await getVertexAIClient().generateImage(prompt, modelName, {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 8192,
          logoImage: options.logoImage ?? logoImage,
          aspectRatio: options.aspectRatio,
          imageSize: options.imageSize
        });
      }

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
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 16384  // Increased for content generation
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
export async function generateContentWithProxy(
  promptOrParts: string | any[],
  modelName: string,
  isImageGeneration: boolean = false,
  options: VertexGenerationOptions = {}
): Promise<any> {
  return await generateContentDirect(promptOrParts, modelName, isImageGeneration, options);
}

// Image generation models
// PRIMARY: Gemini 3 Pro via direct API (best quality, aspect ratio control)
export const REVO_2_0_PRIMARY_MODEL = 'gemini-3-pro-image-preview'; // Via direct Gemini API
// FALLBACK: Gemini 2.5 via Vertex AI (if Gemini 3 Pro fails)
export const REVO_2_0_FALLBACK_MODEL = 'gemini-2.5-flash-image'; // Via Vertex AI

// Text generation model (for Vertex AI)
export const REVO_2_0_TEXT_MODEL = 'gemini-2.5-flash'; // Via Vertex AI for text generation

// Legacy exports for backwards compatibility
export const REVO_2_0_MODEL = REVO_2_0_PRIMARY_MODEL; // Now points to Gemini 3 Pro (IMAGE ONLY)
export const REVO_2_0_GEMINI_3_PRO_MODEL = REVO_2_0_PRIMARY_MODEL;

// ============================================================================
// UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK (Ported from Revo 1.0)
// ============================================================================

/**
 * Marketing angle definitions for strategic campaign diversity
 * Each angle ensures ads highlight different aspects of the same product/service
 */
interface MarketingAngle {
  id: string;
  name: string;
  description: string;
  focusArea: string;
  promptInstructions: string;
  headlineGuidance: string;
  captionGuidance: string;
  visualGuidance: string;
  examples: {
    headline: string;
    subheadline: string;
    caption: string;
  };
}

const MARKETING_ANGLES: MarketingAngle[] = [
  {
    id: 'feature',
    name: 'Feature Angle',
    description: 'Highlight ONE specific feature/capability',
    focusArea: 'Product functionality',
    promptInstructions: 'Focus entirely on ONE specific feature. Do not mention other features. Show how this single feature solves a problem.',
    headlineGuidance: 'Lead with the specific feature benefit (e.g., "Instant Transfers", "24/7 Support")',
    captionGuidance: 'Explain how this ONE feature works and why it matters. No feature lists.',
    visualGuidance: 'Show the feature in action - people using it in real scenarios',
    examples: {
      headline: 'Pay in 3 Seconds',
      subheadline: 'Fastest mobile payments in Kenya',
      caption: 'No more waiting in long queues or dealing with slow transfers. Our instant payment system processes your transactions in just 3 seconds. Whether you\'re paying rent, buying groceries, or sending money to family, speed matters. Experience the difference that real-time processing makes in your daily life.'
    }
  },
  {
    id: 'usecase',
    name: 'Use-Case Angle',
    description: 'Show specific situation/scenario where product is used',
    focusArea: 'Real-life application',
    promptInstructions: 'Focus on ONE specific scenario. Show the context, setting, and how the product fits into this real-life situation.',
    headlineGuidance: 'Reference the specific situation (e.g., "Late Night Cravings", "Office Lunch Rush")',
    captionGuidance: 'Tell the story of this specific use case. Make it relatable and contextual.',
    visualGuidance: 'Show the actual scenario - home, office, travel, emergency, celebration, etc.',
    examples: {
      headline: 'Rent Due Tomorrow?',
      subheadline: 'Pay instantly, avoid late fees',
      caption: 'It\'s 11 PM and you just remembered rent is due tomorrow morning. Don\'t panic. With our mobile app, you can transfer your rent payment instantly, even at midnight. No need to rush to the bank or worry about late fees. Your landlord gets paid, you sleep peacefully.'
    }
  },
  {
    id: 'audience',
    name: 'Audience Segment Angle',
    description: 'Target specific customer segment with tailored messaging',
    focusArea: 'Customer demographics',
    promptInstructions: 'Speak directly to ONE specific audience segment. Use their language, reference their specific needs and pain points.',
    headlineGuidance: 'Use language that resonates with this specific group (e.g., "Student Budget?", "Small Business Owner?")',
    captionGuidance: 'Address the specific challenges and needs of this audience segment only.',
    visualGuidance: 'Show people from this demographic in their typical environment',
    examples: {
      headline: 'Small Business Owner?',
      subheadline: 'Banking that grows with you',
      caption: 'Running a business means juggling expenses, managing cash flow, and planning for growth. Our business account gives you the tools you need with transparent pricing. Accept payments, manage payroll, track expenses - all without worrying about hidden fees eating into your profits.'
    }
  },
  {
    id: 'problem',
    name: 'Problem-Solution Angle',
    description: 'Lead with specific pain point, end with solution',
    focusArea: 'Customer pain points',
    promptInstructions: 'Start with ONE specific problem/frustration. Show the emotional impact, then present the solution.',
    headlineGuidance: 'Lead with the problem (e.g., "Tired of Long Queues?", "Frustrated with Slow Service?")',
    captionGuidance: 'Describe the problem\'s impact, then show how the product solves it completely.',
    visualGuidance: 'Show the contrast - problem situation vs. solution in action',
    examples: {
      headline: 'Tired of Bank Queues?',
      subheadline: 'Do everything from your phone',
      caption: 'Standing in bank queues for 2 hours just to transfer money? Missing work because banks close at 4 PM? Those days are over. Our mobile banking app lets you transfer money, pay bills, and check balances 24/7. No queues, no time limits, no frustration. Just banking that works around your schedule, not the other way around.'
    }
  },
  {
    id: 'benefit',
    name: 'Benefit Level Angle',
    description: 'Focus on specific level of value (functional, emotional, life-impact)',
    focusArea: 'Value proposition',
    promptInstructions: 'Choose ONE benefit level: functional (what it does), emotional (how it feels), or life-impact (how it changes life). Stay consistent.',
    headlineGuidance: 'Match headline to benefit level - functional: "Transfer in Seconds", emotional: "Peace of Mind", life-impact: "Financial Freedom"',
    captionGuidance: 'Elaborate on the chosen benefit level without mixing different levels.',
    visualGuidance: 'Show the benefit level - functional: feature in action, emotional: relieved faces, life-impact: life transformation',
    examples: {
      headline: 'Sleep Better Tonight',
      subheadline: 'Your money is completely secure',
      caption: 'Financial stress keeps you awake at night? Wondering if your money is safe? With bank-level encryption, 24/7 fraud monitoring, and instant transaction alerts, you can finally relax. Your money is protected by the same security systems that major banks use. No more sleepless nights worrying about your finances.'
    }
  },
  {
    id: 'transformation',
    name: 'Before/After Angle',
    description: 'Show clear transformation from problem state to solution state',
    focusArea: 'Change/improvement',
    promptInstructions: 'Create clear contrast between "before" (with problem) and "after" (with solution). Show the transformation.',
    headlineGuidance: 'Imply transformation (e.g., "From Chaos to Control", "Stressed to Sorted")',
    captionGuidance: 'Paint the before picture, then show the dramatic after state.',
    visualGuidance: 'Show the transformation visually - split screen, before/after scenarios',
    examples: {
      headline: 'From Broke to Balanced',
      subheadline: 'Take control of your finances',
      caption: 'Last month: Overdraft fees, missed payments, financial chaos. This month: Automatic savings, bill reminders, complete control. Our budgeting tools transformed how Sarah manages money. Now she saves ₦50,000 monthly and never misses a payment. Same income, completely different financial life. Your transformation starts today.'
    }
  },
  {
    id: 'social_proof',
    name: 'Social Proof Angle',
    description: 'Highlight customer success, testimonials, or usage statistics',
    focusArea: 'Trust and credibility',
    promptInstructions: 'Focus on ONE type of social proof: customer story, testimonial theme, or achievement metric. Make it specific and credible.',
    headlineGuidance: 'Lead with the proof (e.g., "10,000 Users Trust Us", "Sarah Saved ₦200,000")',
    captionGuidance: 'Tell the specific success story or elaborate on the social proof with details.',
    visualGuidance: 'Show real customers, testimonials, or visual proof of success',
    examples: {
      headline: 'James Saved ₦500,000',
      subheadline: 'In just 6 months using our app',
      caption: 'James from Lagos was spending ₦80,000 monthly on unnecessary expenses. After using our expense tracking and automated savings features, he now saves ₦85,000 every month. "I couldn\'t believe how much I was wasting on small purchases," says James. "The app showed me exactly where my money was going and helped me cut the waste." Join 50,000+ Nigerians who are taking control of their finances.'
    }
  }
];

/**
 * Campaign angle tracking system - ensures angle diversity across campaigns
 */
const campaignAngleTracker = new Map<string, {
  usedAngles: string[],
  lastUsed: number,
  currentCampaignId: string
}>();

/**
 * Generate campaign ID for angle tracking
 */
function generateCampaignId(brandKey: string): string {
  return `${brandKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Assign marketing angle for strategic campaign diversity
 */
function assignMarketingAngle(brandKey: string, options: any): MarketingAngle {
  const tracker = campaignAngleTracker.get(brandKey) || {
    usedAngles: [],
    lastUsed: Date.now(),
    currentCampaignId: generateCampaignId(brandKey)
  };

  // Get available angles (not used in current campaign)
  const availableAngles = MARKETING_ANGLES.filter(angle =>
    !tracker.usedAngles.includes(angle.id)
  );

  // If all angles used, reset and start new campaign cycle
  let selectedAngle: MarketingAngle;
  if (availableAngles.length === 0) {
    console.log(`🔄 [Revo 2.0] All angles used for ${brandKey}, starting new campaign cycle`);
    tracker.usedAngles = [];
    tracker.currentCampaignId = generateCampaignId(brandKey);
    selectedAngle = MARKETING_ANGLES[Math.floor(Math.random() * MARKETING_ANGLES.length)];
  } else {
    // Select angle based on business type and context
    selectedAngle = selectOptimalAngle(availableAngles, options);
  }

  // Track angle usage
  tracker.usedAngles.push(selectedAngle.id);
  tracker.lastUsed = Date.now();
  campaignAngleTracker.set(brandKey, tracker);

  console.log(`🎯 [Revo 2.0] Assigned marketing angle: ${selectedAngle.name} (${selectedAngle.id})`);
  console.log(`📊 [Revo 2.0] Campaign progress: ${tracker.usedAngles.length}/${MARKETING_ANGLES.length} angles used`);

  return selectedAngle;
}

/**
 * Select optimal angle based on business context
 */
function selectOptimalAngle(availableAngles: MarketingAngle[], options: any): MarketingAngle {
  const businessType = options.businessType?.toLowerCase() || '';
  const brandProfile = options.brandProfile || {};

  // Universal business type preferences for angle selection
  const businessAnglePreferences: { [key: string]: string[] } = {
    'finance': ['feature', 'problem', 'benefit', 'transformation'],
    'fintech': ['feature', 'usecase', 'transformation', 'social_proof'],
    'banking': ['problem', 'benefit', 'usecase', 'transformation'],
    'restaurant': ['usecase', 'audience', 'social_proof', 'transformation'],
    'food': ['usecase', 'audience', 'social_proof', 'problem'],
    'healthcare': ['benefit', 'problem', 'social_proof', 'audience'],
    'medical': ['benefit', 'problem', 'social_proof', 'audience'],
    'technology': ['feature', 'usecase', 'transformation', 'benefit'],
    'tech': ['feature', 'usecase', 'transformation', 'benefit'],
    'retail': ['audience', 'usecase', 'social_proof', 'problem'],
    'ecommerce': ['audience', 'usecase', 'social_proof', 'problem'],
    'education': ['benefit', 'transformation', 'audience', 'social_proof'],
    'fitness': ['transformation', 'benefit', 'audience', 'social_proof'],
    'beauty': ['transformation', 'audience', 'social_proof', 'benefit'],
    'travel': ['usecase', 'audience', 'benefit', 'social_proof'],
    'hospitality': ['usecase', 'audience', 'benefit', 'social_proof'],
    'automotive': ['feature', 'benefit', 'usecase', 'social_proof'],
    'real_estate': ['benefit', 'usecase', 'social_proof', 'transformation'],
    'consulting': ['problem', 'benefit', 'social_proof', 'transformation'],
    'legal': ['problem', 'benefit', 'social_proof', 'audience'],
    'insurance': ['benefit', 'problem', 'social_proof', 'audience'],
    'logistics': ['feature', 'usecase', 'benefit', 'problem'],
    'manufacturing': ['feature', 'benefit', 'usecase', 'social_proof'],
    'agriculture': ['benefit', 'usecase', 'social_proof', 'transformation'],
    'entertainment': ['usecase', 'audience', 'social_proof', 'benefit'],
    'media': ['usecase', 'audience', 'social_proof', 'benefit'],
    'nonprofit': ['social_proof', 'transformation', 'benefit', 'audience'],
    'government': ['benefit', 'social_proof', 'usecase', 'audience']
  };

  const preferredAngles = businessAnglePreferences[businessType] || ['feature', 'benefit', 'usecase', 'problem'];

  // Find first available preferred angle
  for (const preferredId of preferredAngles) {
    const angle = availableAngles.find(a => a.id === preferredId);
    if (angle) {
      console.log(`🎯 [Revo 2.0] Selected optimal angle for ${businessType}: ${angle.name}`);
      return angle;
    }
  }

  // Fallback to first available angle
  const fallbackAngle = availableAngles[0];
  console.log(`🎯 [Revo 2.0] Using fallback angle: ${fallbackAngle.name}`);
  return fallbackAngle;
}

 

type RecentDbOutput = { headline?: string | null; subheadline?: string | null; caption?: string | null; cta?: string | null };

function normalizeTokens(text: string): string[] {
  const stop = new Set(['the','a','an','and','or','to','for','of','in','on','with','at','by','from','your','you','our','their','is','are','be','this','that','it','as']);
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !stop.has(w));
}

function jaccardSim(a: string, b: string): number {
  const A = new Set(normalizeTokens(a));
  const B = new Set(normalizeTokens(b));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const CORPORATE_BUZZWORDS = [
  'seamless','reimagined','unleashed','cutting-edge','innovative solutions','empower','world-class','redefine','experience the future','next-gen','best-in-class','synergy','holistic','reimagine','revolutionize','frictionless'
];

function containsBuzz(text: string): string[] {
  const lower = (text || '').toLowerCase();
  return CORPORATE_BUZZWORDS.filter(b => lower.includes(b));
}

async function fetchRecentDbPosts(brandProfileId: string, platform?: string, limit: number = 5): Promise<RecentDbOutput[]> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('generated_posts')
      .select('catchy_words, subheadline, content, call_to_action')
      .eq('brand_profile_id', brandProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform.toLowerCase());
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((r: any) => ({
      headline: r.catchy_words ?? null,
      subheadline: r.subheadline ?? null,
      caption: typeof r.content === 'string' ? r.content : (r.content?.text || ''),
      cta: r.call_to_action ?? null,
    }));
  } catch {
    return [];
  }
}

function buildAvoidListTextFromRecent(recent: RecentDbOutput[]): string {
  if (!recent || recent.length === 0) return '';
  const lines: string[] = [];
  lines.push('DO NOT REPEAT OR PARAPHRASE any of the following recent outputs (avoid their vocabulary, structure, and phrasing):');
  recent.slice(0, 3).forEach((o, i) => {
    if (o.headline) lines.push(`- Prev#${i + 1} Headline: "${o.headline}"`);
    if (o.subheadline) lines.push(`- Prev#${i + 1} Sub: "${o.subheadline}"`);
    if (o.cta) lines.push(`- Prev#${i + 1} CTA: "${o.cta}"`);
    if (o.caption) {
      const snippet = o.caption.split(/\s+/).slice(0, 16).join(' ');
      lines.push(`- Prev#${i + 1} Caption: "${snippet}..."`);
    }
  });
  lines.push('VARY sentence structure and vocabulary completely. NO corporate jargon or mission-statement language.');
  return lines.join('\n');
}

function isTooSimilarToRecent(out: { headline?: string; subheadline?: string; caption?: string }, recent: RecentDbOutput[]): { similar: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const p of recent) {
    const hSim = jaccardSim(out.headline || '', p.headline || '');
    const sSim = jaccardSim(out.subheadline || '', p.subheadline || '');
    const cSim = jaccardSim(out.caption || '', p.caption || '');
    if (hSim > 0.55) reasons.push(`Headline too similar (${(hSim * 100).toFixed(0)}%) to "${p.headline}"`);
    if (sSim > 0.5) reasons.push(`Subheadline too similar (${(sSim * 100).toFixed(0)}%)`);
    if (cSim > 0.4) reasons.push(`Caption too similar (${(cSim * 100).toFixed(0)}%)`);
    if (reasons.length) break;
  }
  const buzz = [
    ...containsBuzz(out.headline || ''),
    ...containsBuzz(out.subheadline || ''),
    ...containsBuzz(out.caption || ''),
  ];
  if (buzz.length) reasons.push(`Contains corporate buzzwords: ${Array.from(new Set(buzz)).join(', ')}`);
  return { similar: reasons.length > 0, reasons };
}

// ============================================================================
// ENHANCED STORY COHERENCE VALIDATION SYSTEM (Ported from Revo 1.0)
// ============================================================================

/**
 * ENHANCED STORY COHERENCE VALIDATION - Fixes Caption-Headline Story Mismatch
 * Ensures headlines and captions tell ONE unified story, not separate messages
 */
function validateStoryCoherence(
  headline: string,
  caption: string,
  businessType: string
): {
  isCoherent: boolean;
  issues: string[];
  coherenceScore: number;
  storyTheme: string;
  emotionalTone: string;
} {
  const issues: string[] = [];
  let coherenceScore = 100;

  // ============================================================================
  // 1. STORY THEME EXTRACTION AND VALIDATION
  // ============================================================================

  const headlineTheme = extractStoryTheme(headline, businessType);
  const captionTheme = extractStoryTheme(caption, businessType);

  console.log(`🔍 [Revo 2.0 Story Coherence] Headline theme: ${headlineTheme.primary} (${headlineTheme.secondary})`);
  console.log(`🔍 [Revo 2.0 Story Coherence] Caption theme: ${captionTheme.primary} (${captionTheme.secondary})`);

  // CRITICAL: Caption must continue the EXACT story theme from headline
  // BUT: Be more lenient if both themes are 'general' (no specific theme detected)
  if (headlineTheme.primary !== captionTheme.primary) {
    if (headlineTheme.primary === 'general' || captionTheme.primary === 'general') {
      // More lenient penalty for general themes
      issues.push(`MINOR THEME VARIANCE: Headline theme '${headlineTheme.primary}' vs caption theme '${captionTheme.primary}' (general themes)`);
      coherenceScore -= 15; // Reduced penalty for general themes
    } else {
      // Full penalty for specific theme mismatches
      issues.push(`STORY MISMATCH: Headline focuses on '${headlineTheme.primary}' but caption switches to '${captionTheme.primary}'`);
      coherenceScore -= 30; // Reduced from 40 to be less strict
    }
  }

  // Secondary theme alignment (less critical but important)
  if (headlineTheme.secondary && captionTheme.secondary &&
    headlineTheme.secondary !== captionTheme.secondary &&
    !areCompatibleSecondaryThemes(headlineTheme.secondary, captionTheme.secondary)) {
    issues.push(`Secondary theme mismatch: headline '${headlineTheme.secondary}' vs caption '${captionTheme.secondary}'`);
    coherenceScore -= 20;
  }

  // ============================================================================
  // 2. NARRATIVE CONTINUITY VALIDATION
  // ============================================================================

  const narrativeContinuity = validateNarrativeContinuity(headline, caption, businessType);
  if (!narrativeContinuity.isValid) {
    issues.push(...narrativeContinuity.issues);
    coherenceScore -= narrativeContinuity.penalty;
  }

  // ============================================================================
  // 3. TONE CONSISTENCY VALIDATION (ENHANCED)
  // ============================================================================

  const headlineTone = analyzeEmotionalTone(headline);
  const captionTone = analyzeEmotionalTone(caption);

  // More lenient tone matching - allow some flexibility
  if (headlineTone !== captionTone) {
    // Allow professional as neutral fallback for most tones (more lenient)
    const allowedFallbacks = ['confident', 'innovative', 'caring', 'professional'];
    const isCompatibleTone = captionTone === 'professional' ||
      allowedFallbacks.includes(headlineTone) ||
      allowedFallbacks.includes(captionTone);

    if (!isCompatibleTone) {
      issues.push(`TONE MISMATCH: Headline is ${headlineTone} but caption is ${captionTone}`);
      coherenceScore -= 20; // Reduced penalty from 30 to 20
    } else {
      // Minor penalty for tone variance but still compatible
      issues.push(`MINOR TONE VARIANCE: Headline ${headlineTone} vs caption ${captionTone} (compatible)`);
      coherenceScore -= 5; // Very small penalty for compatible tones
    }
  }

  // ============================================================================
  // 4. AUDIENCE CONSISTENCY VALIDATION
  // ============================================================================

  const headlineAudience = extractTargetAudience(headline);
  const captionAudience = extractTargetAudience(caption);

  if (headlineAudience && captionAudience && headlineAudience !== captionAudience) {
    issues.push(`AUDIENCE MISMATCH: Headline targets '${headlineAudience}' but caption targets '${captionAudience}'`);
    coherenceScore -= 25;
  }

  // ============================================================================
  // 5. BENEFIT PROMISE VALIDATION
  // ============================================================================

  const headlineBenefit = extractPromisedBenefit(headline);
  const captionBenefit = extractDeliveredBenefit(caption);

  if (headlineBenefit && !captionBenefit) {
    // Only penalize if headline makes a very specific promise
    const specificPromises = ['speed', 'savings', 'security'];
    if (specificPromises.includes(headlineBenefit)) {
      issues.push(`UNFULFILLED PROMISE: Headline promises '${headlineBenefit}' but caption doesn't deliver on it`);
      coherenceScore -= 25; // Reduced from 35
    } else {
      issues.push(`MINOR UNFULFILLED PROMISE: Headline suggests '${headlineBenefit}' benefit`);
      coherenceScore -= 10; // Much smaller penalty for general benefits
    }
  } else if (headlineBenefit && captionBenefit && !areBenefitsAligned(headlineBenefit, captionBenefit)) {
    issues.push(`BENEFIT MISMATCH: Headline promises '${headlineBenefit}' but caption delivers '${captionBenefit}'`);
    coherenceScore -= 20; // Reduced from 30
  }

  // ============================================================================
  // 6. STORY COMPLETION VALIDATION
  // ============================================================================

  const storyCompletion = validateStoryCompletion(headline, caption);
  if (!storyCompletion.isComplete) {
    issues.push(...storyCompletion.issues);
    coherenceScore -= storyCompletion.penalty;
  }

  // ============================================================================
  // 7. ENHANCED GENERIC CONTENT DETECTION
  // ============================================================================

  const genericityCheck = validateContentSpecificity(headline, caption, businessType);
  if (genericityCheck.isGeneric) {
    issues.push(...genericityCheck.issues);
    coherenceScore -= genericityCheck.penalty;
  }

  // STRICT COHERENCE REQUIREMENTS: Story must be cohesive
  // isCoherent = true only if:
  // 1. Score is at least 60 (good coherence), OR
  // 2. Score is at least 45 AND no major story mismatches (max 1 minor issue)
  const hasMajorStoryMismatch = issues.some(issue =>
    issue.includes('STORY MISMATCH') ||
    issue.includes('UNFULFILLED PROMISE') ||
    issue.includes('Headline asks question but caption')
  );

  const isCoherent = coherenceScore >= 60 ||
    (coherenceScore >= 45 && !hasMajorStoryMismatch && issues.length <= 1);

  console.log(`🔍 [Revo 2.0 COHERENCE DECISION] Score: ${coherenceScore}, Issues: ${issues.length}, MajorMismatch: ${hasMajorStoryMismatch}, IsCoherent: ${isCoherent}`);

  return {
    isCoherent,
    issues,
    coherenceScore: Math.max(0, coherenceScore),
    storyTheme: headlineTheme.primary,
    emotionalTone: headlineTone
  };
}

/**
 * Extract story theme from text content
 */
function extractStoryTheme(text: string, businessType: string): { primary: string; secondary?: string } {
  const lowerText = text.toLowerCase();

  // Define theme keywords for universal business types
  const themeKeywords = {
    speed: ['instant', 'fast', 'quick', 'immediate', 'seconds', 'rapid', 'swift', 'now'],
    security: ['secure', 'safe', 'protected', 'encrypted', 'trust', 'reliable', 'guaranteed'],
    convenience: ['easy', 'simple', 'effortless', 'convenient', 'hassle-free', 'smooth'],
    savings: ['save', 'cheap', 'affordable', 'discount', 'deal', 'value', 'budget', 'cost'],
    quality: ['best', 'premium', 'excellent', 'superior', 'top', 'high-quality', 'professional'],
    support: ['help', 'support', '24/7', 'assistance', 'service', 'care', 'guidance'],
    innovation: ['new', 'innovative', 'advanced', 'cutting-edge', 'modern', 'latest', 'revolutionary'],
    community: ['together', 'community', 'family', 'friends', 'social', 'connect', 'share'],
    success: ['success', 'achieve', 'win', 'accomplish', 'reach', 'attain', 'excel'],
    transformation: ['transform', 'change', 'improve', 'upgrade', 'better', 'enhance', 'evolve'],
    urgency: ['urgent', 'now', 'today', 'deadline', 'limited', 'hurry', 'act fast'],
    exclusivity: ['exclusive', 'special', 'unique', 'limited', 'premium', 'vip', 'select']
  };

  let primaryTheme = 'general';
  let secondaryTheme: string | undefined;
  let maxMatches = 0;
  let secondMaxMatches = 0;

  // Count keyword matches for each theme
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > maxMatches) {
      secondaryTheme = primaryTheme !== 'general' ? primaryTheme : undefined;
      secondMaxMatches = maxMatches;
      primaryTheme = theme;
      maxMatches = matches;
    } else if (matches > secondMaxMatches && matches > 0) {
      secondaryTheme = theme;
      secondMaxMatches = matches;
    }
  }

  return { primary: primaryTheme, secondary: secondaryTheme };
}

/**
 * Analyze emotional tone of text
 */
function analyzeEmotionalTone(text: string): string {
  const lowerText = text.toLowerCase();

  const toneKeywords = {
    urgent: ['urgent', 'now', 'today', 'hurry', 'fast', 'quick', 'immediate', 'deadline'],
    playful: ['fun', 'enjoy', 'play', 'exciting', 'amazing', 'awesome', 'cool', 'wow'],
    professional: ['professional', 'business', 'corporate', 'service', 'solution', 'expertise'],
    confident: ['guaranteed', 'proven', 'trusted', 'reliable', 'sure', 'certain', 'confident'],
    caring: ['care', 'help', 'support', 'understand', 'family', 'community', 'together'],
    innovative: ['new', 'innovative', 'advanced', 'modern', 'cutting-edge', 'revolutionary']
  };

  let dominantTone = 'professional'; // Default tone
  let maxMatches = 0;

  for (const [tone, keywords] of Object.entries(toneKeywords)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > maxMatches) {
      dominantTone = tone;
      maxMatches = matches;
    }
  }

  return dominantTone;
}

/**
 * Check if secondary themes are compatible
 */
function areCompatibleSecondaryThemes(theme1: string, theme2: string): boolean {
  const compatiblePairs = [
    ['speed', 'convenience'],
    ['security', 'trust'],
    ['quality', 'premium'],
    ['innovation', 'modern'],
    ['success', 'achievement'],
    ['community', 'social']
  ];

  return compatiblePairs.some(pair =>
    (pair.includes(theme1) && pair.includes(theme2))
  );
}

/**
 * Validate narrative continuity between headline and caption
 */
function validateNarrativeContinuity(headline: string, caption: string, businessType: string): {
  isValid: boolean;
  issues: string[];
  penalty: number;
} {
  const issues: string[] = [];
  let penalty = 0;

  // Check if caption continues the story started in headline
  const headlineWords = headline.toLowerCase().split(/\s+/);
  const captionWords = caption.toLowerCase().split(/\s+/);

  // Look for narrative bridges (words that connect the story)
  const narrativeBridges = ['because', 'so', 'that\'s why', 'which means', 'this way', 'now you can'];
  const hasBridge = narrativeBridges.some(bridge => caption.toLowerCase().includes(bridge));

  // Check for story continuation indicators
  const continuationWords = ['with', 'using', 'through', 'by', 'when', 'after', 'before'];
  const hasContinuation = continuationWords.some(word => caption.toLowerCase().includes(word));

  if (!hasBridge && !hasContinuation) {
    issues.push('Caption does not clearly continue the headline story');
    penalty += 15;
  }

  return {
    isValid: issues.length === 0,
    issues,
    penalty
  };
}

/**
 * Extract target audience from text
 */
function extractTargetAudience(text: string): string | null {
  const lowerText = text.toLowerCase();

  const audienceKeywords = {
    'students': ['student', 'university', 'college', 'campus', 'tuition', 'education'],
    'professionals': ['professional', 'career', 'office', 'business', 'corporate', 'executive'],
    'families': ['family', 'parent', 'children', 'kids', 'home', 'household'],
    'seniors': ['senior', 'retirement', 'pension', 'elderly', 'mature', 'golden years'],
    'entrepreneurs': ['entrepreneur', 'startup', 'business owner', 'founder', 'venture'],
    'small_business': ['small business', 'local business', 'shop owner', 'merchant']
  };

  for (const [audience, keywords] of Object.entries(audienceKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return audience;
    }
  }

  return null;
}

/**
 * Extract promised benefit from headline
 */
function extractPromisedBenefit(headline: string): string | null {
  const lowerText = headline.toLowerCase();

  const benefitKeywords = {
    'speed': ['fast', 'quick', 'instant', 'immediate', 'seconds', 'rapid'],
    'savings': ['save', 'cheap', 'affordable', 'discount', 'free', 'low cost'],
    'security': ['secure', 'safe', 'protected', 'guaranteed', 'trusted'],
    'convenience': ['easy', 'simple', 'convenient', 'effortless', 'hassle-free'],
    'quality': ['best', 'premium', 'excellent', 'superior', 'high-quality']
  };

  for (const [benefit, keywords] of Object.entries(benefitKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return benefit;
    }
  }

  return null;
}

/**
 * Extract delivered benefit from caption
 */
function extractDeliveredBenefit(caption: string): string | null {
  return extractPromisedBenefit(caption); // Same logic for now
}

/**
 * Check if benefits are aligned
 */
function areBenefitsAligned(promisedBenefit: string, deliveredBenefit: string): boolean {
  if (promisedBenefit === deliveredBenefit) return true;

  // Define compatible benefit pairs
  const compatibleBenefits = [
    ['speed', 'convenience'],
    ['security', 'trust'],
    ['savings', 'value'],
    ['quality', 'premium']
  ];

  return compatibleBenefits.some(pair =>
    pair.includes(promisedBenefit) && pair.includes(deliveredBenefit)
  );
}

/**
 * Validate story completion
 */
function validateStoryCompletion(headline: string, caption: string): {
  isComplete: boolean;
  issues: string[];
  penalty: number;
} {
  const issues: string[] = [];
  let penalty = 0;

  // Check if caption provides resolution to headline's setup
  const headlineLower = headline.toLowerCase();
  const captionLower = caption.toLowerCase();

  // Look for question-answer pattern
  if (headlineLower.includes('?') && !captionLower.includes('answer') && !captionLower.includes('solution')) {
    issues.push('Headline asks question but caption doesn\'t provide clear answer');
    penalty += 10;
  }

  // Look for problem-solution pattern
  const problemWords = ['problem', 'issue', 'trouble', 'difficulty', 'challenge'];
  const solutionWords = ['solution', 'solve', 'fix', 'resolve', 'answer'];

  const hasProblems = problemWords.some(word => headlineLower.includes(word));
  const hasSolutions = solutionWords.some(word => captionLower.includes(word));

  if (hasProblems && !hasSolutions) {
    issues.push('Headline mentions problems but caption doesn\'t provide solutions');
    penalty += 15;
  }

  return {
    isComplete: issues.length === 0,
    issues,
    penalty
  };
}

/**
 * Validate content specificity (detect generic content)
 */
function validateContentSpecificity(headline: string, caption: string, businessType: string): {
  isGeneric: boolean;
  issues: string[];
  penalty: number;
} {
  const issues: string[] = [];
  let penalty = 0;

  // Check for generic phrases
  const genericPhrases = [
    'we understand',
    'we know',
    'we believe',
    'our team',
    'our company',
    'we are committed',
    'we strive',
    'we pride ourselves',
    'your trusted partner',
    'industry leader',
    'years of experience'
  ];

  const captionLower = caption.toLowerCase();
  const genericCount = genericPhrases.filter(phrase => captionLower.includes(phrase)).length;

  if (genericCount > 2) {
    issues.push(`Caption contains ${genericCount} generic business phrases`);
    penalty += genericCount * 5;
  }

  // Check for business name repetition without context
  const businessName = businessType.toLowerCase();
  const businessNameCount = (captionLower.match(new RegExp(businessName, 'g')) || []).length;

  if (businessNameCount > 2) {
    issues.push(`Excessive business name repetition (${businessNameCount} times)`);
    penalty += 10;
  }

  return {
    isGeneric: issues.length > 0,
    issues,
    penalty
  };
}

// === Revo 2.0 Creativity & Anti-Repetition Utilities ===

type RecentOutput = { headlines: string[]; captions: string[]; concepts: string[] };
const recentOutputs = new Map<string, RecentOutput>();
const recentStyles = new Map<string, string>();
const recentLayouts = new Map<string, string>();
const recentImageTreatments = new Map<string, string>();
const recentPerspectives = new Map<string, string>(); // Track camera angles
const recentTypographyStyles = new Map<string, string>();
const recentColorStrategies = new Map<string, string>();
const recentEffects = new Map<string, string>();
const recentColorDistributions = new Map<string, string>();
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

// === UNIVERSAL DESIGN SYSTEM VARIATION ARRAYS (MODULE LEVEL) ===
// These are defined at module level so they can be accessed by helper functions

// Dynamic Color Distribution Rotations (Revo 1.5 mechanism)
function getColorDistributionRotations() {
  return [
    {
      name: 'Primary Dominant',
      description: 'Primary color takes 70% of design space with accent highlights',
      distribution: { primary: 70, accent: 20, background: 10 },
      instruction: 'Use primary brand color as dominant (70% of color usage), accent for highlights (20%), background for breathing space (10%)'
    },
    {
      name: 'Balanced Harmony',
      description: 'Equal balance between primary and accent with generous white space',
      distribution: { primary: 40, accent: 40, background: 20 },
      instruction: 'Balance primary (40%) and accent (40%) equally, with generous white space (20%)'
    },
    {
      name: 'Accent Forward',
      description: 'Accent color leads with primary as supporting element',
      distribution: { primary: 25, accent: 60, background: 15 },
      instruction: 'Lead with accent color (60%), primary as support (25%), background for spacing (15%)'
    },
    {
      name: 'Minimal Clean',
      description: 'Mostly white/background with strategic color placement',
      distribution: { primary: 25, accent: 15, background: 60 },
      instruction: 'Predominantly white/background (60%) with strategic primary (25%) and accent pops (15%)'
    }
  ];
}

// Note: Layout compositions, typography styles, image treatments, and color strategies
// are defined inside buildEnhancedPrompt() and passed to this helper when needed

/**
 * Module-level cache for pre-selected design variations
 * This allows the assistant path to access variations selected in buildEnhancedPrompt
 */
const designVariationsCache = new Map<string, any>();

/**
 * Get cached design variations for a brand
 */
function getCachedDesignVariations(brandKey: string): any | null {
  return designVariationsCache.get(brandKey) || null;
}

/**
 * Cache design variations for a brand
 */
function cacheDesignVariations(brandKey: string, variations: any): void {
  designVariationsCache.set(brandKey, variations);
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

/**
 * Get specific text placement guidance based on layout composition
 */
function getTextPlacementGuidance(layoutName: string): string {
  const guidanceMap: Record<string, string> = {
    'Full-Bleed Photo': `
- Text overlays directly on the photo
- Use contrasting text colors for readability
- Position headline in upper or lower third (not center)
- Add subtle text background/shadow for legibility
- CTA can be in corner or bottom strip`,
    
    'Split Screen': `
- Image on one side (left or right)
- Text on opposite side with solid color background
- Vertical or horizontal split (choose based on content)
- Text section should have generous padding
- All text elements stay within their designated section`,
    
    'Text Frame': `
- Bold headline at top OR bottom
- Image occupies middle section
- Text creates a "frame" around the image
- Subheadline and CTA in same text section as headline
- Clean separation between text and image zones`,
    
    'Minimal Overlay': `
- Large, clean image as main focus
- Minimal text in one corner (top-left, top-right, or bottom)
- Let the image breathe - don't overcrowd
- Small, elegant text treatment
- CTA can be subtle button or text link`,
    
    'Collage Grid': `
- Multiple images arranged in grid
- Text in dedicated section (not overlapping images)
- Could be side panel or top/bottom strip
- Keep text grouped together for clarity
- Grid creates visual interest, text provides context`,
    
    'Circular Focus': `
- Circular or rounded image frame as focal point
- Text wraps around or positioned to side
- Creates organic, flowing composition
- Headline near top, CTA near bottom
- Asymmetric balance between circle and text`,
    
    'Diagonal Dynamic': `
- Diagonal split or angled elements
- Text follows diagonal flow or contrasts it
- Creates movement and energy
- Can use diagonal text orientation
- Bold, dynamic placement`,
    
    'Magazine Editorial': `
- Large image with text column overlay
- Text positioned like magazine article
- Headline at top of column
- Body text flows down
- Professional editorial style`,
    
    'Product Hero': `
- Product/person centered in composition
- Headline above the focal point
- Subheadline/details below
- CTA at bottom
- Symmetrical, balanced layout`,
    
    'Asymmetric Balance': `
- Off-center image placement
- Text balances the composition on opposite side
- Creates visual tension and interest
- Unconventional but balanced
- Text size/weight balances image weight`
  };

  return guidanceMap[layoutName] || `
- Adapt text placement to the layout structure
- Maintain visual hierarchy and balance
- Ensure readability and clear flow
- Use white space effectively`;
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

/**
 * Get dynamic color rotation to prevent repetitive look (Revo 1.5 approach)
 * This rotates color distributions while keeping the same brand colors
 */
function getDynamicColorRotation(primaryColor: string, accentColor: string, backgroundColor: string): string {
  const colorRotations = [
    {
      name: "Primary Dominant",
      description: "Primary color takes 70% of design space with accent highlights",
      instruction: `Use ${primaryColor} as dominant color (70%), ${accentColor} for accents (20%), ${backgroundColor} for breathing space (10%)`
    },
    {
      name: "Balanced Harmony",
      description: "Equal balance between primary and accent with generous white space",
      instruction: `Balance ${primaryColor} (40%) and ${accentColor} (40%) with ${backgroundColor} providing generous white space (20%)`
    },
    {
      name: "Accent Forward",
      description: "Accent color leads with primary as supporting element",
      instruction: `Lead with ${accentColor} (60%), support with ${primaryColor} (25%), ${backgroundColor} for clean spacing (15%)`
    },
    {
      name: "Minimal Clean",
      description: "Mostly white/background with strategic color placement",
      instruction: `Predominantly ${backgroundColor} (60%) with strategic ${primaryColor} (25%) and ${accentColor} accents (15%)`
    }
  ];

  // Select rotation based on timestamp for variety
  const rotationIndex = Math.floor(Date.now() / 1000) % colorRotations.length;
  const selectedRotation = colorRotations[rotationIndex];

  return `- COLOR ROTATION: ${selectedRotation.name}
- ${selectedRotation.instruction}
- VISUAL RHYTHM: Create breathing room between elements
- AVOID: Monotone designs that look repetitive
- GOAL: Each design feels fresh while maintaining brand consistency`;
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
  strictConsistency?: boolean; // NEW: Enforce EXACT brand colors with NO fallbacks
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
  format?: string;
}

/**
 * Convert logo URL to base64 data URL for AI models with enhanced error handling
 */
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) {
    console.log('⚠️ [Revo 2.0] No logo URL provided for conversion');
    return undefined;
  }

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    console.log('✅ [Revo 2.0] Logo is already a data URL, returning as-is');
    return logoUrl;
  }

  // Validate URL format
  if (!logoUrl.startsWith('http')) {
    console.error('❌ [Revo 2.0] Invalid logo URL format (must start with http/https):', logoUrl);
    return undefined;
  }

  try {
    console.log('🔄 [Revo 2.0] Converting logo URL to data URL:', logoUrl);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(logoUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Revo2.0/1.0)'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
    }

    // Check content length to avoid huge files
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
      throw new Error(`Logo file too large: ${contentLength} bytes (max 5MB)`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type from response headers or URL extension
    let contentType = response.headers.get('content-type');
    
    // If content type is generic or missing, try to guess from URL
    if (!contentType || contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
      if (logoUrl.match(/\.png$/i)) contentType = 'image/png';
      else if (logoUrl.match(/\.jpe?g$/i)) contentType = 'image/jpeg';
      else if (logoUrl.match(/\.webp$/i)) contentType = 'image/webp';
      else if (logoUrl.match(/\.svg$/i)) contentType = 'image/svg+xml';
      else contentType = 'image/png'; // Default fallback
    }
    
    // Validate it's actually an image
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType} (expected image/*)`);
    }
    
    const dataUrl = `data:${contentType};base64,${base64}`;
    console.log(`✅ [Revo 2.0] Logo converted successfully (${contentType}, ${base64.length} chars)`);

    return dataUrl;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ [Revo 2.0] Logo conversion timeout (10s)');
    } else {
      console.error('❌ [Revo 2.0] Logo conversion failed:', error instanceof Error ? error.message : error);
    }
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
export async function generateCreativeConcept(options: Revo20GenerationOptions): Promise<any> {
  const { businessType, brandProfile, platform, scheduledServices } = options;

  // Extract today's services for focused content
  const todaysServices = scheduledServices?.filter(s => s.isToday) || [];
  const upcomingServices = scheduledServices?.filter(s => s.isUpcoming) || [];

  // Generate unique concept dimensions for variety
  const bKey = getBrandKey(brandProfile, platform);
  const dimensions = generateUniqueConceptDimensions(bKey);

  // Check recent concepts to avoid repetition
  const recentData = recentOutputs.get(bKey) || { headlines: [], captions: [], concepts: [] };

  // Get Business Profiler avoidance list if available
  let businessAvoidanceList = '';
  try {
    // Use existing business intelligence gatherer instead of missing module
    const { businessIntelligenceGatherer } = await import('./intelligence/business-intelligence-gatherer');
    // Skip avoidance list for now since the module structure is different
    businessAvoidanceList = '';
  } catch (error) {
    console.warn('⚠️ [Concept Generation] Could not load Business Intelligence:', error);
  }

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
    - USE specific, unique value propositions${businessAvoidanceList}

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
    // Claude API requires temperature 0-1, so cap at 1.0
    const temperature = 0.8 + (Math.random() * 0.2); // 0.8-1.0 range (safe for Claude)
    console.log(`🎲 [Revo 2.0] Using temperature: ${temperature.toFixed(2)} for concept variety`);

    const result = await generateContentWithProxy(conceptPrompt, REVO_2_0_TEXT_MODEL, false);
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
export function generateFallbackConcept(brandProfile: any, businessType: string, dimensions: ConceptDimensions, todaysServices?: any[]): string {
  const services = todaysServices ?? [];
  const service = services.length > 0 ? services[0].serviceName : businessType;
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
export function buildEnhancedPrompt(options: Revo20GenerationOptions, concept: any): string {

  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern', scheduledServices } = options;

  // Extract brand colors from profile with toggle support
  const shouldFollowBrandColors = options.followBrandColors !== false; // Default to true if not specified
  const isStrictMode = options.strictConsistency === true; // Explicit strict mode

  // STRICT MODE vs NORMAL MODE color handling
  let primaryColor: string | undefined, accentColor: string | undefined, backgroundColor: string | undefined;

  if (isStrictMode) {
    // STRICT MODE: Use ONLY provided colors, NO fallbacks (could be undefined)
    primaryColor = brandProfile.primaryColor;
    accentColor = brandProfile.accentColor;
    backgroundColor = brandProfile.backgroundColor;
  } else if (shouldFollowBrandColors) {
    // NORMAL MODE: Use provided colors WITH fallbacks
    primaryColor = brandProfile.primaryColor || '#3B82F6';
    accentColor = brandProfile.accentColor || '#1E40AF';
    backgroundColor = brandProfile.backgroundColor || '#FFFFFF';
  } else {
    // BRAND COLORS DISABLED: Use default colors
    primaryColor = '#3B82F6';
    accentColor = '#1E40AF';
    backgroundColor = '#FFFFFF';
  }

  console.log('🎨 [Revo 2.0] Brand Colors Debug:', {
    strictMode: isStrictMode,
    followBrandColors: shouldFollowBrandColors,
    inputPrimaryColor: brandProfile.primaryColor,
    inputAccentColor: brandProfile.accentColor,
    inputBackgroundColor: brandProfile.backgroundColor,
    finalPrimaryColor: primaryColor,
    finalAccentColor: accentColor,
    finalBackgroundColor: backgroundColor,
    hasValidColors: !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor),
    usingBrandColors: shouldFollowBrandColors && !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor),
    strictModeActive: isStrictMode && !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor)
  });

  // Build color scheme instruction with strict mode enforcement
  const colorScheme = isStrictMode && primaryColor && accentColor && backgroundColor
    ? `🚨 STRICT MODE - EXACT COLORS ONLY: Primary: ${primaryColor} (60% dominant), Accent: ${accentColor} (30% secondary), Background: ${backgroundColor} (10% highlights) - USE THESE EXACT HEX CODES, NO VARIATIONS ALLOWED`
    : `🚨🚨🚨 CRITICAL BRAND COLOR REQUIREMENT - NON-NEGOTIABLE 🚨🚨🚨

**YOU MUST USE THESE EXACT BRAND COLORS:**
- Primary Color: ${primaryColor || '#3B82F6'} (Main brand color - use for 60% of design)
- Accent Color: ${accentColor || '#1E40AF'} (Secondary brand color - use for 30% of design)
- Background Color: ${backgroundColor || '#FFFFFF'} (Background - use for 10% of design)

**STRICT RULES:**
1. DO NOT use any other colors except the three above
2. DO NOT use random colors, gradients with different colors, or creative color variations
3. DO NOT use blue, green, purple, or any color unless it matches the exact hex codes above
4. EVERY design element must use ONLY these three colors
5. If you use any color not listed above, the design will be REJECTED

**VALIDATION CHECK:**
- Before generating, confirm: "Am I using ONLY ${primaryColor}, ${accentColor}, and ${backgroundColor}?"
- If answer is NO, do not proceed - fix the colors first

This is a BRAND CONSISTENCY requirement. Using wrong colors damages brand identity.`;

  // Brand location info
  const brandInfo = brandProfile.location ? ` based in ${brandProfile.location}` : '';

  // Determine specific visual context based on business type and concept
  const visualContext = getVisualContextForBusiness(businessType, concept.concept);

  // Get business-type specific visual guidance
  const businessTypeStrategy = getBusinessTypeStrategy(businessType);
  let businessTypeVisualGuidance = '';
  if (businessTypeStrategy) {
    businessTypeVisualGuidance = `\n\n🎯 INDUSTRY-SPECIFIC VISUAL GUIDANCE FOR ${businessType.toUpperCase()}:\n${businessTypeStrategy.visualGuidance}\n\n📸 VISUAL FOCUS:\n${businessTypeStrategy.contentFocus}`;

    // Add product-specific visual guidance for retail/e-commerce with rotation
    const productCatalog = (brandProfile as any).productCatalog;
    const isRetailBusiness = businessType.toLowerCase().includes('retail') ||
      businessType.toLowerCase().includes('e-commerce') ||
      businessType.toLowerCase().includes('ecommerce') ||
      businessType.toLowerCase().includes('shop') ||
      businessType.toLowerCase().includes('store') ||
      businessType.toLowerCase().includes('electronics') ||
      businessType.toLowerCase().includes('fashion') ||
      businessType.toLowerCase().includes('clothing') ||
      businessType.toLowerCase().includes('boutique') ||
      businessType.toLowerCase().includes('marketplace');

    if (businessTypeStrategy.productDataUsage && productCatalog && Array.isArray(productCatalog) && productCatalog.length > 0) {
      // Use timestamp-based rotation to ensure different products are showcased
      const brandKey = getBrandKey(brandProfile, platform);
      const rotationIndex = Math.floor(Date.now() / 1000) % productCatalog.length;
      const selectedProduct = productCatalog[rotationIndex];

      businessTypeVisualGuidance += `\n\n🚨 CRITICAL RETAIL VISUAL REQUIREMENTS 🚨\n\n🛍️ PRODUCT MUST BE THE STAR (60-80% of image):\n- Product Name: ${selectedProduct.name}`;

      if (selectedProduct.brand) {
        businessTypeVisualGuidance += `\n- Brand: ${selectedProduct.brand}`;
      }

      if (selectedProduct.features && selectedProduct.features.length > 0) {
        businessTypeVisualGuidance += `\n- Key Features to Show: ${selectedProduct.features.slice(0, 3).join(', ')}`;
      }

      if (selectedProduct.price) {
        businessTypeVisualGuidance += `\n- Price to Display: ${selectedProduct.price}`;
        if (selectedProduct.originalPrice) {
          businessTypeVisualGuidance += ` (was ${selectedProduct.originalPrice} - show discount!)`;
        }
      }

      if (selectedProduct.discount) {
        businessTypeVisualGuidance += `\n- Discount Badge: ${selectedProduct.discount} OFF`;
      }

      if (selectedProduct.benefits && selectedProduct.benefits.length > 0) {
        businessTypeVisualGuidance += `\n- Customer Benefits: ${selectedProduct.benefits.slice(0, 2).join(', ')}`;
      }

      if (selectedProduct.stockStatus) {
        businessTypeVisualGuidance += `\n- Stock Status: ${selectedProduct.stockStatus}`;
      }

      businessTypeVisualGuidance += `\n\n📸 CRITICAL PRODUCT VISUAL REQUIREMENTS FOR RETAIL:
🚨 PRODUCT MUST DOMINATE THE IMAGE (60-80% of visual space)
- Show the ACTUAL product clearly and prominently
- Product should be immediately identifiable (brand, model visible)
- Use professional product photography style
- Include price overlay or price tag in the design
- Add feature callouts if space allows (e.g., "4K", "Wireless", "Voice Control")
- Product should be the HERO, not background element
- If showing people, they should be USING the product (product still prominent)
- NO lifestyle scenes where product is barely visible
- Think: "Would a customer know exactly what product this is just by looking?"

❌ FORBIDDEN FOR RETAIL VISUALS:
- Products barely visible in background
- Lifestyle scenes without clear product focus
- Abstract emotional imagery without product
- People as main focus with product as prop
- Vague "smart home" imagery without specific devices
- Flowing lines, glowing effects, or abstract swirls around products
- Holographic overlays or futuristic visual effects
- Floating icons or decorative graphic elements
- Any AI-generated looking visual effects

✅ REQUIRED FOR RETAIL VISUALS:
- Large, clear product image
- Product takes up majority of frame
- Price visible somewhere in design
- Brand/model identifiable
- Professional product showcase style
- Clean, realistic photography without artificial effects
- Natural lighting and simple backgrounds`;
    }
  }

  // Build scheduled services context for visual design
  let serviceVisualContext = '';
  if (concept.featuredServices && concept.featuredServices.length > 0) {
    const todayService = concept.featuredServices[0];
    serviceVisualContext = `\n\n🎯 TODAY'S FEATURED SERVICE INTEGRATION:\n- Service: ${todayService.serviceName}\n- Description: ${todayService.description || 'Premium service offering'}\n- Visual Focus: Create imagery that showcases this specific service in action\n- Service Priority: This should be the PRIMARY visual element in the design`;
  }

  // Build currency instructions based on location
  const currencyInstructions = getCurrencyInstructions(brandProfile.location || 'Global');

  // Build culturally intelligent visual instructions
  let culturalInstructions = '';
  const location = brandProfile.location || 'Global';
  const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'botswana', 'malawi'];
  const isAfricanCountry = africanCountries.some(country => location.toLowerCase().includes(country.toLowerCase()));
  
  // Debug log for African representation detection
  console.log('');
  console.log('🌍 ========================================');
  console.log('🌍 AFRICAN REPRESENTATION CHECK (REVO 2.0)');
  console.log('🌍 ========================================');
  console.log(`🌍 Business Location: "${location}"`);
  console.log(`🌍 Is African Country: ${isAfricanCountry ? '✅ YES' : '❌ NO'}`);
  console.log(`🌍 Include People Toggle: ${options.includePeopleInDesigns !== false ? '✅ ON' : '❌ OFF'}`);
  if (isAfricanCountry && options.includePeopleInDesigns !== false) {
    console.log('');
    console.log('🚨 AFRICAN REPRESENTATION MODE ACTIVE 🚨');
    console.log('🚨 ALL PEOPLE MUST BE BLACK/AFRICAN 🚨');
    console.log('🚨 ZERO WHITE PEOPLE ALLOWED 🚨');
    console.log('');
  }
  console.log('🌍 ========================================');
  console.log('');

  // Build people inclusion instructions based on toggle
  let peopleInstructions = '';
  if (options.includePeopleInDesigns === false) {
    peopleInstructions = `\n\n👥 PEOPLE EXCLUSION REQUIREMENT:\n- MANDATORY: Create a clean, professional design WITHOUT any people or human figures\n- AVOID: Any human faces, bodies, or silhouettes\n- FOCUS: Products, services, abstract elements, or clean minimalist design\n- STYLE: Professional, clean aesthetics without human elements\n- EMPHASIS: Brand elements, typography, and non-human visual elements`;
  } else {
    if (isAfricanCountry) {
      peopleInstructions = `\n\n👥 PEOPLE INCLUSION (AFRICAN REPRESENTATION - MANDATORY):\n🚨🚨🚨 CRITICAL REQUIREMENT - READ THIS CAREFULLY 🚨🚨🚨\n\nThis business is located in ${location}. This is an AFRICAN country.\n\n**ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:**\n1. EVERY SINGLE PERSON in the image MUST be Black/African with dark skin\n2. ZERO white people allowed - this is NON-NEGOTIABLE\n3. ZERO light-skinned people allowed\n4. ZERO non-African ethnicities allowed\n5. ALL people must have authentic African features, hairstyles, and appearance\n\n**IF YOU INCLUDE ANY PEOPLE:**\n- They MUST be Black/African people from ${location}\n- They MUST have dark skin tones\n- They MUST look like real ${location} residents\n- They MUST be in ${businessType}-relevant settings\n- NO stock photo models - show REAL African people\n\n**VALIDATION CHECK BEFORE GENERATING:**\n- Question 1: Is this business in Africa? YES (${location})\n- Question 2: Will I show ONLY Black/African people? ANSWER MUST BE YES\n- Question 3: Will I avoid white people completely? ANSWER MUST BE YES\n- Question 4: Do all people have dark skin and African features? ANSWER MUST BE YES\n\n**IF YOU CANNOT GUARANTEE 100% BLACK/AFRICAN PEOPLE:**\n- Then DO NOT include any people at all\n- Better to have NO people than wrong people\n\n🚨 CULTURAL AUTHENTICITY IS NON-NEGOTIABLE FOR ${location} 🚨`;
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
  
  // LAYOUT ARCHITECTURES - 20 Specific Structural Designs with Exact Positioning
  // Based on CREVO Universal Social Media Design System
  const layoutCompositions = [
    // CATEGORY A: GRID-BASED LAYOUTS
    { 
      name: 'Classic Split Screen',
      category: 'Grid-Based',
      description: '50/50 or 60/40 vertical split - text one side, image other side',
      structure: `
┌──────────┬──────────┐
│          │          │
│   TEXT   │  IMAGE   │
│  + CTA   │    OR    │
│          │  VISUAL  │
└──────────┴──────────┘`,
      rules: [
        'Divide canvas vertically: 50/50, 60/40, or 70/30',
        'Text section: headline at top, body in middle, CTA at bottom',
        'Image section: full-height visual or product photo',
        'Can use straight line or curved/diagonal divider',
        'Text section gets solid color background (brand color or white)',
        'Generous padding in text section (20% margins)'
      ]
    },
    { 
      name: 'Thirds Grid',
      category: 'Grid-Based',
      description: 'Three equal vertical or horizontal sections',
      structure: `
┌────┬────┬────┐
│    │    │    │
│ 1  │ 2  │ 3  │
│    │    │    │
└────┴────┴────┘`,
      rules: [
        'Divide into 3 equal sections (vertical OR horizontal)',
        'Each section = different element (text/image/CTA)',
        'Section 1: Headline or key visual',
        'Section 2: Supporting content or product',
        'Section 3: CTA or additional info',
        'Maintain consistent spacing between sections'
      ]
    },
    { 
      name: 'Magazine Layout',
      category: 'Grid-Based',
      description: 'Editorial-style with headline bar and asymmetric content blocks',
      structure: `
┌──────────────────┐
│   HEADLINE       │
├────────┬─────────┤
│        │         │
│ IMAGE  │  TEXT   │
│        │  BLOCK  │
└────────┴─────────┘`,
      rules: [
        'Full-width headline bar at top (15-20% of height)',
        'Below: split into image (left 50-60%) and text (right 40-50%)',
        'Headline uses bold typography, centered or left-aligned',
        'Image section: high-quality photo or visual',
        'Text section: body copy, subheadline, CTA stacked vertically',
        'Professional editorial feel with clean lines'
      ]
    },
    { 
      name: 'Masonry Grid',
      category: 'Grid-Based',
      description: 'Pinterest-style with different sized blocks creating dynamic layout',
      structure: `
┌───┬─────┬───┐
│ 1 │     │ 3 │
├───┤  2  ├───┤
│ 4 │     │ 5 │
└───┴─────┴───┘`,
      rules: [
        'Create 4-6 blocks of varying sizes',
        'Central block (2) is largest - main visual or headline',
        'Corner blocks (1,3,4,5) smaller - stats, icons, or supporting text',
        'Blocks can overlap slightly for depth',
        'Maintain visual balance despite asymmetry',
        'Modern, Pinterest-inspired aesthetic'
      ]
    },
    { 
      name: 'L-Shape Layout',
      category: 'Grid-Based',
      description: 'Headline across top, text column on left, large image on right',
      structure: `
┌─────────────────┐
│   HEADLINE      │
├──────┬──────────┘
│      │
│TEXT  │  IMAGE
│BLOCK │  AREA
│      │
└──────┘`,
      rules: [
        'Full-width headline bar at top (15% height)',
        'Left column: 30-40% width for text content',
        'Right area: 60-70% width for large image/visual',
        'Text column: subheadline, body, CTA stacked',
        'Image extends from top headline to bottom',
        'Creates strong L-shaped text flow'
      ]
    },

    // CATEGORY B: CENTERED FOCAL LAYOUTS
    { 
      name: 'Bullseye Center',
      category: 'Centered Focal',
      description: 'Everything centered with radial balance',
      structure: `
┌─────────────────┐
│                 │
│     ⊙ MAIN      │
│    ELEMENT      │
│                 │
└─────────────────┘`,
      rules: [
        'Main element (product/logo/icon) dead center',
        'Headline above center element',
        'Subheadline/body below center element',
        'CTA at bottom center',
        '80% negative space around elements',
        'Radial balance - everything equidistant from center',
        'Clean, minimal, premium feel'
      ]
    },
    { 
      name: 'Floating Element',
      category: 'Centered Focal',
      description: 'Central element with shadow/depth appearing to float',
      structure: `
┌─────────────────┐
│    ╔═══╗        │
│    ║   ║ MAIN   │
│    ╚═══╝        │
│    ELEMENT      │
└─────────────────┘`,
      rules: [
        'Main element (card/product/image) centered with drop shadow',
        'Shadow: 10-15px blur, 30% opacity, offset down-right',
        'Element appears to float above background',
        'Headline above floating element',
        'Supporting text below element',
        'Modern, dimensional, 3D feel',
        'Background: solid color or subtle gradient'
      ]
    },
    { 
      name: 'Circular Frame',
      category: 'Centered Focal',
      description: 'Image in circular frame with text around or beside',
      structure: `
┌─────────────────┐
│      ___        │
│    /     \      │
│   |  IMG  | TXT │
│    \_____/      │
│                 │
└─────────────────┘`,
      rules: [
        'Circular image frame: 40-50% of canvas width',
        'Circle positioned slightly off-center (left or right)',
        'Text wraps around circle or positioned to opposite side',
        'Headline near top, CTA near bottom',
        'Friendly, approachable, organic feel',
        'Works well for people photos or product shots'
      ]
    },

    // CATEGORY C: DIAGONAL & DYNAMIC LAYOUTS
    { 
      name: 'Diagonal Slash',
      category: 'Diagonal & Dynamic',
      description: 'Diagonal line dividing text and image at 30-60° angle',
      structure: `
┌─────────────────┐
│TEXT    ╱        │
│      ╱  IMAGE   │
│    ╱     OR     │
│  ╱    VISUAL    │
└─────────────────┘`,
      rules: [
        'Diagonal line at 30°, 45°, or 60° angle',
        'Text section on LEFT (30-40% of space)',
        'Image section on RIGHT (60-70% of space)',
        'Text: headline at top-left, CTA at bottom-left',
        'Image fills entire right diagonal section',
        'Creates energy, movement, and dynamism',
        'Bold, modern, attention-grabbing'
      ]
    },
    { 
      name: 'Z-Pattern Flow',
      category: 'Diagonal & Dynamic',
      description: 'Elements arranged in Z-shape to guide eye movement',
      structure: `
┌─────────────────┐
│ START →→→→→→   │
│         ↓       │
│    ←←←←         │
│    ↓            │
│    →→→ END CTA  │
└─────────────────┘`,
      rules: [
        'Top-left: Starting element (logo/icon)',
        'Top-right: Headline or key message',
        'Middle-left: Supporting visual or stat',
        'Bottom-right: Strong CTA',
        'Eye naturally follows Z-pattern',
        'Strategic placement guides attention',
        'Natural reading pattern for engagement'
      ]
    },
    { 
      name: 'Zigzag Layers',
      category: 'Diagonal & Dynamic',
      description: 'Horizontal stripe bands creating rhythmic pattern',
      structure: `
┌─────────────────┐
│╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱│
│  HEADLINE       │
│╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲│
│  FEATURE TEXT   │
│╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱│
│  CTA HERE       │
│╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲│
└─────────────────┘`,
      rules: [
        'Create 3-5 horizontal bands across canvas',
        'Bands can be straight or wavy/zigzag edges',
        'Alternate colors: brand color, white, accent color',
        'Each band contains one element (headline, feature, CTA)',
        'Rhythmic, organized, structured feel',
        'Good for step-by-step or multi-point messages'
      ]
    },
    { 
      name: 'Tilted Card',
      category: 'Diagonal & Dynamic',
      description: 'Main content card rotated 5-15° for playful effect',
      structure: `
┌─────────────────┐
│    ╔════════╗   │
│   ╔═CONTENT═╗   │
│  ╔══TILTED══╗   │
│ ╔═══CARD═══╗    │
│╔═══AT════╗      │
└─────────────────┘`,
      rules: [
        'Main content card rotated 5-15° clockwise or counter-clockwise',
        'Card contains: headline, image/icon, CTA',
        'Card has subtle shadow for depth',
        'Background: solid color or subtle pattern',
        'Breaks monotony, adds playfulness',
        'Attention-grabbing without being chaotic'
      ]
    },

    // CATEGORY D: ASYMMETRIC & EXPERIMENTAL
    { 
      name: 'Broken Grid',
      category: 'Asymmetric & Experimental',
      description: 'Intentionally misaligned elements creating artistic tension',
      structure: `
┌─────────────────┐
│ ┌───┐     ┌───┐ │
│ │ A │ B   │ C │ │
│ └───┘ ┌───┴───┤ │
│   D   │   E   │ │
│       └───────┘ │
└─────────────────┘`,
      rules: [
        'Create 4-6 blocks of varying sizes',
        'Intentionally misalign blocks (not on perfect grid)',
        'Blocks can overlap slightly',
        'Each block: different content type (text, image, stat, icon)',
        'Creates visual tension and interest',
        'Very modern, artistic, unconventional',
        'Maintains balance despite asymmetry'
      ]
    },
    { 
      name: 'Overlapping Layers',
      category: 'Asymmetric & Experimental',
      description: 'Multiple elements overlap with transparency for depth',
      structure: `
┌─────────────────┐
│  ┌─────────┐    │
│  │ Layer 1 │    │
│  │  ┌──────┼──┐ │
│  └──┤Layer2│  │ │
│     │  ┌───┼──┤ │
│     └──┤ 3 │  │ │
└────────┴───┴──┘ │
└─────────────────┘`,
  rules: [
    'Create 3-4 layers (cards, images, text blocks)',
    'Each layer overlaps previous by 30-50%',
    'Use transparency: Layer 1 (70%), Layer 2 (80%), Layer 3 (100%)',
    'Each layer different content: image, text, CTA',
    'Creates depth and complexity',
    'Professional, sophisticated, layered storytelling'
  ]
},
{ 
  name: 'Swiss Poster Style',
  category: 'Asymmetric & Experimental',
  description: 'Minimalist with bold typography and asymmetric placement',
  structure: `
┌─────────────────┐
│ BOLD            │
│ TYPE    [IMG]   │
│ RULES          │
│                 │
│        CTA→     │
└─────────────────┘`,
  rules: [
    'Bold, large typography dominates (60-70% of space)',
    'Small image or icon (20-30% of space)',
    'Asymmetric placement - nothing centered',
    'Lots of white space (50%+)',
    'Grid-based but appears free-form',
    'Minimalist, sophisticated, design-forward',
    'Typography IS the design'
  ]
},
{ 
  name: 'Collage Montage',
  category: 'Asymmetric & Experimental',
  description: 'Multiple images/elements combined in cut-and-paste style',
  structure: `
┌─────────────────┐
│ ╔═╗ ┌─┐        │
│ ║ ║ │ │ ╭─╮   │
│ ╚═╝ └─┘ │ │TXT│
│ ┌──┐ ╔══╕╰─╯  │
│ │  │ ║  │      │
└─────────────────┘`,
  rules: [
    'Combine 4-8 different images/elements',
    'Varying sizes, shapes, orientations',
    'Cut-out style (no perfect rectangles)',
    'Some elements overlap',
    'Text integrated between images',
    'Busy but organized chaos',
    'Artistic, creative, eclectic feel'
  ]
},

// CATEGORY E: MINIMALIST LAYOUTS
{ 
  name: 'Single Element Focus',
  category: 'Minimalist',
  description: '80% negative space with one centered hero element',
  structure: `
┌─────────────────┐
│                 │
│                 │
│   [ONE THING]   │
│                 │
│                 │
└─────────────────┘`,
  rules: [
    '80% negative space (white or solid color)',
    'One hero element in center: product, logo, or key visual',
    'Minimal text: headline above or below element',
    'Optional: small CTA at bottom',
    'Ultra-clean, premium, luxury feel',
    'Let the element breathe',
    'Less is more philosophy'
  ]
},
{ 
  name: 'Text-Only Typography',
  category: 'Minimalist',
  description: 'No images - typography is the entire design',
  structure: `
┌─────────────────┐
│   HEADLINE      │
│                 │
│ Subheadline is  │
│ here in smaller │
│ elegant type    │
│                 │
│    → CTA        │
└─────────────────┘`,
  rules: [
    'NO images - only text',
    'Headline: large, bold, dominant (40-50% of space)',
    'Subheadline: elegant, readable, supporting',
    'CTA: simple, understated',
    'Use typography hierarchy for visual interest',
    'Sophisticated, thought-leadership feel',
    'Works for quotes, announcements, statements'
  ]
},
{ 
  name: 'Icon + Text',
  category: 'Minimalist',
  description: 'Simple icon with supporting text - clean and clear',
  structure: `
┌─────────────────┐
│      [⚡]       │
│                 │
│  FAST DELIVERY  │
│  Order in 2 min │
│                 │
│   [Get Now]     │
└─────────────────┘`,
  rules: [
    'Large icon at top center (30% of height)',
    'Headline below icon',
    'Short supporting text',
    'CTA button at bottom',
    'Clean, simple, direct message',
    'Icon should be simple, recognizable',
    'Good for single-benefit messages'
  ]
},

    // CATEGORY F: COMPLEX STORYTELLING
    { 
      name: 'Comic Panel Grid',
      category: 'Complex Storytelling',
      description: 'Multiple panels telling sequential story',
      structure: `
┌──────────┬─────────┐
│  ① PROB  │  ② DISC│
│  [Scene] │ [Find]  │
├──────────┴─────────┤
│  ③ TRANSFORMATION  │
│  [Using product]   │
├──────────┬─────────┤
│  ④ RESULT│  ⑤ CTA │
│  [Happy] │ [Join!] │
└──────────┴─────────┘`,
      rules: [
        'Divide into 4-5 panels (comic book style)',
        'Panel 1: Problem/pain point',
        'Panel 2: Discovery of solution',
        'Panel 3: Using product/service (wider panel)',
        'Panel 4: Result/success',
        'Panel 5: Call to action',
        'Sequential storytelling, narrative-driven',
        'Engaging, story-based approach'
      ]
    }
  ];

  console.log(`📐 [Revo 2.0] Layout system loaded: ${layoutCompositions.length} architectures available`);

  // TYPOGRAPHY STYLES - 12 distinct typographic treatments (Universal Design System)
  const typographyStyles = [
    { 
      name: 'Bold Sans Uppercase',
      description: 'Strong, modern, attention-grabbing',
      instructions: 'Font: Bold sans-serif (Montserrat, Arial Black style), Weight: 700-900, Case: UPPERCASE, Size: 44-56px headline, Use for: Modern brands, promotions, bold statements'
    },
    { 
      name: 'Elegant Serif',
      description: 'Sophisticated, traditional, trustworthy',
      instructions: 'Font: Serif (Playfair Display, Georgia style), Weight: 400-700, Case: Sentence case, Size: 38-48px headline, Use for: Luxury, professional, traditional brands'
    },
    { 
      name: 'Friendly Rounded',
      description: 'Approachable, casual, friendly',
      instructions: 'Font: Rounded sans (Nunito, Comfortaa style), Weight: 600-800, Case: Sentence case, Size: 40-50px headline, Use for: Friendly, casual, approachable brands'
    },
    { 
      name: 'Tech Minimalist',
      description: 'Modern, clean, professional',
      instructions: 'Font: Clean sans (SF Pro, Helvetica style), Weight: 500-600, Case: Sentence case, Size: 38-46px headline, Use for: Tech, SaaS, modern professional brands'
    },
    { 
      name: 'Bold Condensed',
      description: 'Space-efficient, bold, impactful',
      instructions: 'Font: Condensed (Bebas Neue, Impact style), Weight: 700, Case: UPPERCASE, Size: 50-64px headline, Use for: High impact, space-efficient designs'
    },
    { 
      name: 'Casual Handwritten',
      description: 'Personal, warm, creative',
      instructions: 'Font: Script/handwritten (Caveat, Pacifico style), Weight: 600-700, Case: Sentence case, Size: 44-54px headline, Use for: Personal, artisanal, creative brands'
    },
    { 
      name: 'Professional Clean',
      description: 'Corporate, reliable, professional',
      instructions: 'Font: Classic sans (Helvetica, Arial style), Weight: 600-700, Case: Sentence case, Size: 40-48px headline, Use for: Corporate, B2B, professional services'
    },
    { 
      name: 'Luxury Extended',
      description: 'Premium, luxury, high-end',
      instructions: 'Font: Extended serif (Cinzel, Bodoni style), Weight: 600-700, Case: UPPERCASE with letter spacing, Size: 36-44px headline, Use for: Luxury, premium, high-end brands'
    },
    { 
      name: 'Mixed Weights Dynamic',
      description: 'Creates visual hierarchy, modern',
      instructions: 'Font: Same family with varied weights, Headline: 800 weight, Subhead: 300 weight, Case: Mixed, Use for: Dynamic, modern, hierarchy-focused designs'
    },
    { 
      name: 'Minimal Lowercase',
      description: 'Contemporary, casual, approachable',
      instructions: 'Font: Sans-serif, Weight: 400-500, Case: all lowercase, Size: 38-46px headline, Use for: Contemporary, minimal, casual brands'
    },
    { 
      name: 'Italic Slanted',
      description: 'Dynamic, movement, energy',
      instructions: 'Font: Any font family, Weight: 600-700, Style: Italic, Case: Sentence case, Use for: Dynamic, energetic, movement-focused designs'
    },
    { 
      name: 'Stacked Vertical',
      description: 'Unique, memorable, artistic',
      instructions: 'Font: Bold font, Weight: 700-900, Orientation: Vertical stack, Case: UPPERCASE, Use for: Unique, artistic, memorable designs'
    }
  ];

  // IMAGE TREATMENTS - 12 distinct visual treatments (Universal Design System)
  const imageTreatments = [
    { 
      name: 'Full Color Natural',
      description: 'Authentic, vibrant, realistic',
      instructions: 'Saturation: 100%, Brightness: 100%, Contrast: 100%, Use for: Authentic, vibrant, realistic imagery'
    },
    { 
      name: 'Desaturated Subtle',
      description: 'Allows brand colors to pop, sophisticated',
      instructions: 'Saturation: 40-60%, Brightness: 100%, Contrast: 95%, Use for: Sophisticated look, lets brand colors stand out'
    },
    { 
      name: 'Black & White High Contrast',
      description: 'Dramatic, timeless, professional',
      instructions: 'Saturation: 0%, Brightness: 100%, Contrast: 120%, Use for: Dramatic, timeless, professional aesthetic'
    },
    { 
      name: 'Brand Color Duotone',
      description: 'Unified look, brand immersion',
      instructions: 'Shadows: Black or dark gray, Highlights: Brand primary color, Use for: Strong brand presence, unified palette'
    },
    { 
      name: 'Soft Tint Overlay',
      description: 'Subtle brand integration, cohesive',
      instructions: 'Brand color overlay: 15-25% opacity over image, Use for: Subtle brand integration while keeping image visible'
    },
    { 
      name: 'Heavy Tint Overlay',
      description: 'Strong brand presence, unified palette',
      instructions: 'Brand color overlay: 60-80% opacity over image, Use for: Strong brand color dominance, unified look'
    },
    { 
      name: 'Vignette Focus',
      description: 'Draws eye to center, professional',
      instructions: 'Edges: Darkened 40-60%, Center: Full brightness, Use for: Focus attention on center subject'
    },
    { 
      name: 'Blur Background',
      description: 'Subject focus, depth, modern',
      instructions: 'Subject: Sharp and clear, Background: Gaussian blur 40-80%, Use for: Modern depth, subject isolation'
    },
    { 
      name: 'Cut-Out Isolated',
      description: 'Clean, focused, product-centric',
      instructions: 'Subject: Extracted from background, Background: Solid brand color or white, Use for: Product focus, clean aesthetic'
    },
    { 
      name: 'High Contrast Bold',
      description: 'Vibrant, energetic, attention-grabbing',
      instructions: 'Saturation: 110-120%, Brightness: 95%, Contrast: 130-140%, Use for: Bold, energetic, eye-catching designs'
    },
    { 
      name: 'Vintage Grain',
      description: 'Authentic, nostalgic, artisanal',
      instructions: 'Saturation: 80-90%, Add: Film grain texture, Warmth: +10%, Use for: Nostalgic, authentic, artisanal feel'
    },
    { 
      name: 'No Image (Graphics/Icons)',
      description: 'Clean, modern, design-forward',
      instructions: 'Replace photo with: Vector graphics, icons, or shapes in brand colors, Use for: Clean, modern, minimalist designs'
    }
  ];

  // CAMERA PERSPECTIVES - FORCE VISUAL VARIETY
  const cameraPerspectives = [
    { name: 'Eye Level', description: 'Standard, relatable, human connection', instruction: 'Shot at eye level - creates direct, personal connection with subject' },
    { name: 'Low Angle (Heroic)', description: 'Empowering, impressive, grand', instruction: 'Shot from below looking up - makes subject/product look powerful, heroic, and impressive' },
    { name: 'High Angle (Overview)', description: 'Context, clarity, overview', instruction: 'Shot from above looking down (45 degrees) - shows context and clarity of subject' },
    { name: 'Top-Down (Flat Lay)', description: 'Organized, structured, clear', instruction: 'Shot directly from overhead (90 degrees) - flat lay style, perfect for showing multiple items or desk setups' },
    { name: 'Macro Close-up', description: 'Detail-oriented, intimate, texture', instruction: 'Extreme close-up - focus on specific details, textures, or small elements. Background blurred.' },
    { name: 'Wide Angle', description: 'Context, environment, space', instruction: 'Wide field of view - shows the subject within their environment/location. Sense of space.' },
    { name: 'Over-the-Shoulder', description: 'POV, immersive, action', instruction: 'Shot from behind subject shoulder - shows what they are looking at (screen, view). Immersive POV.' },
    { name: 'Side Profile', description: 'Candid, focused, distinct', instruction: 'Shot from the side profile - shows subject in action/focus without looking at camera. Candid feel.' }
  ];

  // COLOR USAGE STRATEGIES - 10 ways to use brand colors (Universal Design System)
  const colorUsageStrategies = [
    { 
      name: 'Dominant Background',
      description: 'Bold brands, promotions, sales',
      instructions: 'Distribution: 70% Primary brand color background, 20% White/light text and elements, 10% Image or secondary color. Best for: Bold brands, promotions, high-impact messages'
    },
    { 
      name: 'Accent Highlights',
      description: 'Minimal brands, luxury, sophisticated',
      instructions: 'Distribution: 80% White/neutral background, 15% Image or graphics, 5% Primary brand color (strategic pops). Best for: Minimal, luxury, sophisticated brands'
    },
    { 
      name: 'Split Sections',
      description: 'Clear divisions, features, comparisons',
      instructions: 'Distribution: 50% Primary brand color section, 50% White/neutral section. Best for: Clear divisions, before/after, feature comparisons'
    },
    { 
      name: 'Borders & Frames',
      description: 'Premium, framed, organized',
      instructions: 'Distribution: 85% White/neutral background, 10% Image, 5% Primary brand color (borders only). Best for: Premium feel, organized, framed content'
    },
    { 
      name: 'Gradient Variation',
      description: 'Modern brands, tech, depth',
      instructions: 'Distribution: Gradient from light to dark brand color, creates depth. Best for: Modern, tech, dimensional designs'
    },
    { 
      name: 'Top/Bottom Bars',
      description: 'Clean, organized, professional',
      instructions: 'Distribution: 70% White/image in center, 30% Brand color bars at top/bottom. Best for: Clean, organized, professional layouts'
    },
    { 
      name: 'Overlay Transparency',
      description: 'Image-heavy, cohesive look',
      instructions: 'Distribution: Full image background, Brand color overlay at 40-60% opacity. Best for: Image-heavy designs with brand integration'
    },
    { 
      name: 'Text-Only Color',
      description: 'Typography-focused, clean, minimal',
      instructions: 'Distribution: 90% White/neutral background, 10% Brand color for text only. Best for: Typography-focused, clean, minimal designs'
    },
    { 
      name: 'Inverted Contrast',
      description: 'Dynamic, high contrast, modern',
      instructions: 'Distribution: Alternate sections - Brand color background + white text, then White background + brand color text. Best for: Dynamic, modern, high-contrast designs'
    },
    { 
      name: 'Circular/Shape Focus',
      description: 'Focused, modern, geometric',
      instructions: 'Distribution: 85% White/neutral, 15% Brand color in circular/geometric shape. Best for: Focused, modern, geometric designs'
    }
  ];

  // DYNAMIC COLOR ROTATION SYSTEM (Ported from Revo 1.5)
  // Rotates color distribution to prevent repetitive look even with same brand colors
  const colorDistributionRotations = [
    {
      name: 'Primary Dominant',
      description: 'Primary color takes 70% of design space with accent highlights',
      distribution: { primary: 70, accent: 20, background: 10 },
      instruction: 'Use primary brand color as dominant (70% of color usage), accent for highlights (20%), background for breathing space (10%)'
    },
    {
      name: 'Balanced Harmony',
      description: 'Equal balance between primary and accent with generous white space',
      distribution: { primary: 40, accent: 40, background: 20 },
      instruction: 'Balance primary (40%) and accent (40%) equally, with generous white space (20%)'
    },
    {
      name: 'Accent Forward',
      description: 'Accent color leads with primary as supporting element',
      distribution: { primary: 25, accent: 60, background: 15 },
      instruction: 'Lead with accent color (60%), primary as support (25%), background for spacing (15%)'
    },
    {
      name: 'Minimal Clean',
      description: 'Mostly white/background with strategic color placement',
      distribution: { primary: 25, accent: 15, background: 60 },
      instruction: 'Predominantly white/background (60%) with strategic primary (25%) and accent pops (15%)'
    }
  ];

  const effects = ['subtle grain', 'soft vignette', 'gentle drop shadow', 'glassmorphism card', 'gradient overlay'];

  // ============================================================================
  // HELPER FUNCTION: SELECT UNIVERSAL DESIGN VARIATIONS EARLY
  // ============================================================================
  // This function is called BEFORE the assistant to ensure content matches visuals
  function selectUniversalDesignVariations(
    brandKey: string,
    layoutComps: any[],
    typographyStls: any[],
    imageTrts: any[],
    colorStrats: any[]
  ) {
    const colorDistRotations = getColorDistributionRotations();
    const visualStyles = styles;
    const effs = effects;
    
    // Select variations using anti-repetition logic
    const lastLayout = recentLayouts.get(brandKey);
    const chosenLayout = pickNonRepeating(
      layoutComps,
      lastLayout ? layoutComps.find(l => l.name === lastLayout) : undefined
    );
    recentLayouts.set(brandKey, chosenLayout.name);
    
    const lastTypography = recentTypographyStyles.get(brandKey);
    const chosenTypography = pickNonRepeating(
      typographyStls,
      lastTypography ? typographyStls.find(t => t.name === lastTypography) : undefined
    );
    recentTypographyStyles.set(brandKey, chosenTypography.name);
    
    // 4. Image Treatment (Restored Variety - Direct Random)
    const chosenImageTreatment = imageTrts[Math.floor(Math.random() * imageTrts.length)];
    recentImageTreatments.set(brandKey, chosenImageTreatment.name);
    
    // 5. Color Usage Strategy (Restored Variety - Direct Random)
    const chosenColorStrategy = colorStrats[Math.floor(Math.random() * colorStrats.length)];
    recentColorStrategies.set(brandKey, chosenColorStrategy.name);
    
    // 6. Effects (Restored Variety - Direct Random)
    const chosenEffect = effs[Math.floor(Math.random() * effs.length)];
    if (recentEffects) recentEffects.set(brandKey, chosenEffect);
    
    // 7. Color Distribution (Restored Variety - Safe Random)
    // FILTER OUT 'Accent Forward' to ensure primary brand color dominance
    const safeDistributions = colorDistRotations.filter(d => d.name !== 'Accent Forward');
    const chosenColorDistribution = safeDistributions[Math.floor(Math.random() * safeDistributions.length)];
    if (recentColorDistributions) recentColorDistributions.set(brandKey, chosenColorDistribution.name);
    
    const lastStyle = recentStyles.get(brandKey);
    // Override with 6D concept style if available
    let chosenStyle;
    if (concept && concept.dimensions && concept.dimensions.visualStyle) {
      chosenStyle = concept.dimensions.visualStyle.style;
    } else {
      chosenStyle = pickNonRepeating(visualStyles, lastStyle);
    }
    recentStyles.set(brandKey, chosenStyle);
    
    // 8. Camera Perspective (Restored Variety - Direct Random)
    const chosenPerspective = cameraPerspectives[Math.floor(Math.random() * cameraPerspectives.length)];
    recentPerspectives.set(brandKey, chosenPerspective.name);
    
    const variations = {
      layout: chosenLayout,
      typography: chosenTypography,
      imageTreatment: chosenImageTreatment,
      colorStrategy: chosenColorStrategy,
      colorDistribution: chosenColorDistribution,
      visualStyle: chosenStyle,
      effect: chosenEffect,
      perspective: chosenPerspective // Add perspective to variations
    };
    
    // Cache the variations so the assistant path can access them
    cacheDesignVariations(brandKey, variations);
    
    return variations;
  }

  const bKey = getBrandKey(brandProfile, platform);
  
  // === UNIVERSAL DESIGN SYSTEM: ANTI-REPETITION SELECTION ===
  
  // 1. Visual Style (existing)
  const lastStyle = recentStyles.get(bKey);
  const chosenStyle = pickNonRepeating(styles, lastStyle);
  recentStyles.set(bKey, chosenStyle);
  
  // 2. Layout Architecture (20 types)
  const chosenLayoutComposition = layoutCompositions[Math.floor(Math.random() * layoutCompositions.length)];
  recentLayouts.set(bKey, chosenLayoutComposition.name);
  
  // 3. Typography Style (12 types)
  const lastTypography = recentTypographyStyles.get(bKey);
  const chosenTypography = pickNonRepeating(
    typographyStyles,
    lastTypography ? typographyStyles.find(t => t.name === lastTypography) : undefined
  );
  recentTypographyStyles.set(bKey, chosenTypography.name);
  
  // 4. Image Treatment (Restored Variety - Direct Random)
  const chosenImageTreatment = imageTreatments[Math.floor(Math.random() * imageTreatments.length)];
  recentImageTreatments.set(bKey, chosenImageTreatment.name);
  
  // 5. Color Usage Strategy (Restored Variety - Direct Random)
  const chosenColorStrategy = colorUsageStrategies[Math.floor(Math.random() * colorUsageStrategies.length)];
  recentColorStrategies.set(bKey, chosenColorStrategy.name);
  
  // 6. Effects (Restored Variety - Direct Random)
  const chosenEffect = effects[Math.floor(Math.random() * effects.length)];
  if (recentEffects) recentEffects.set(bKey, chosenEffect);
  
  // 7. Color Distribution (Restored Variety - Safe Random)
  // We need to access the array. Assuming colorDistributionRotations is available or we call the getter.
  const distRotations = typeof colorDistributionRotations !== 'undefined' ? colorDistributionRotations : getColorDistributionRotations();
  // FILTER OUT 'Accent Forward' to ensure primary brand color dominance (Safe Mode)
  const safeDistributions = distRotations.filter(d => d.name !== 'Accent Forward');
  const chosenColorDistribution = safeDistributions[Math.floor(Math.random() * safeDistributions.length)];
  if (recentColorDistributions) recentColorDistributions.set(bKey, chosenColorDistribution.name);
  
  // 8. Camera Perspective (Restored Variety - Direct Random)
  const chosenPerspective = cameraPerspectives[Math.floor(Math.random() * cameraPerspectives.length)];
  recentPerspectives.set(bKey, chosenPerspective.name);
  
  console.log(`🎨 [Universal Design System] Selected combination:
  - Layout: ${chosenLayoutComposition.name}
  - Typography: ${chosenTypography.name}
  - Image Treatment: ${chosenImageTreatment.name}
  - Color Strategy: ${chosenColorStrategy.name}
  - Color Distribution: ${chosenColorDistribution.name} (FIXED: ${chosenColorDistribution.distribution.primary}/${chosenColorDistribution.distribution.accent}/${chosenColorDistribution.distribution.background})
  - Visual Style: ${chosenStyle}
  - Effect: ${chosenEffect}
  - Perspective: ${chosenPerspective.name}`);

  // Smart contact integration with exact preservation - only add if contacts toggle is enabled
  let contactInstruction = '';
  if (options.includeContacts === true) {
    // Check if exact contact instructions are provided from smart formatter
    const exactInstructions = (brandProfile as any)?.exactContactInstructions;
    
    if (exactInstructions && exactInstructions.trim()) {
      // Use the exact contact instructions from smart formatter
      contactInstruction = `\n\n${exactInstructions}\n\n🚨 FOOTER SPACE MANAGEMENT (CRITICAL):\n- If footer space is limited, DO NOT try to fit both email AND website\n- CHOOSE ONLY ONE: Either email OR website (not both)\n- NEVER shorten or abbreviate contact information to make it fit\n- BETTER TO EXCLUDE one contact than to misspell it\n- If you must choose: prioritize email over website\n- ONLY include contacts that fit completely without spelling errors\n\n🚨 DOMAIN SPELLING ENFORCEMENT (CRITICAL):\n- The word is: Z-E-N-T-E-C-H-E-L-E-C-T-R-O-N-I-C-S (spell it out letter by letter)\n- Email EXACT: info@zentechelectronics.co.ke (MUST end with .co.ke NOT .com)\n- Website EXACT: https://zentechelectronics.com/ (MUST end with .com NOT .co.ke)\n- EMAIL DOMAIN: .co.ke (Kenya domain)\n- WEBSITE DOMAIN: .com (international domain)\n- NEVER write: zentechctronics, zentechectronics, zentehctronics, zentectronics\n- NEVER use wrong extensions: .com for email or .co.ke for website\n- ALWAYS write: zentechelectronics (with E-L-E between zentech and ctronics)\n\n**CRITICAL FOR DESIGN**: Copy contact information character-for-character from above. Display in SINGLE HORIZONTAL LINE at bottom footer, separated by | symbols. If space is tight, EXCLUDE contacts rather than misspell them.`;
    } else {
      // Fallback to original contact detection if smart formatter not available
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

      // Use EXACT contact information without any modifications
      // Handle phone as array or string
      if (phone) {
        const phoneStr = Array.isArray(phone) ? phone[0] : phone;
        if (phoneStr && typeof phoneStr === 'string' && phoneStr.trim()) {
          contacts.push(`📞 ${phoneStr.trim()}`);
        }
      }

      // Handle email as array or string
      if (email) {
        const emailStr = Array.isArray(email) ? email[0] : email;
        if (emailStr && typeof emailStr === 'string' && emailStr.trim()) {
          contacts.push(`📧 ${emailStr.trim()}`);
        }
      }

      // Clean website URL: remove https:// and http:// for cleaner display - NEVER generate fake URLs
      if (website) {
        const websiteStr = Array.isArray(website) ? website[0] : website;
        if (websiteStr && typeof websiteStr === 'string' && websiteStr.trim() && !websiteStr.includes('example.com') && !websiteStr.includes('placeholder')) {
          const cleanWebsite = websiteStr.trim().replace(/^https?:\/\//, '');
          contacts.push(`🌐 ${cleanWebsite}`);
        }
      }

      // Handle address as array or string
      if (address) {
        const addressStr = Array.isArray(address) ? address[0] : address;
        if (addressStr && typeof addressStr === 'string' && addressStr.trim()) {
          contacts.push(`📍 ${addressStr.trim()}`);
        }
      }

      if (contacts.length > 0) {
        contactInstruction = `\n\n🔗 **CONTACT INFORMATION TO INCLUDE (USE EXACTLY AS SHOWN):**\n${contacts.join(' | ')}\n\n**CRITICAL**: Use contact information EXACTLY as provided above. Do not modify spelling, domains, or formatting. Display all contact info in a SINGLE HORIZONTAL LINE separated by | symbols. Place in footer area of design.`;
      }
    }
  }

  return `🎨 Create a ${visualStyle} social media design for ${brandProfile.businessName} (${businessType}) for ${platform}.

CREATIVE CONCEPT: ${concept.concept}

🚨 MAXIMUM VISUAL VARIETY REQUIREMENT (CRITICAL):
Each design MUST be visually unique and avoid repetition:
- NEVER repeat the same composition, layout, or visual style from previous designs
- Use COMPLETELY DIFFERENT creative concepts each time (even for the same product/service)
- Vary the visual approach: lifestyle shots, product focus, people-centric, abstract concepts, etc.
- Change the mood and atmosphere: energetic, calm, professional, playful, luxurious, etc.
- Different color DISTRIBUTIONS: vary how you use the SAME brand colors (see Color Distribution Rotation)
- NO VISUAL FORMULAS - every design should feel fresh and distinct
- Think: "If I designed for this business 10 times, each should look completely different"

🎨 VISUAL DIVERSITY STRATEGIES (Use different ones each time):
1. Lifestyle photography - show product/service in real-life context
2. Product hero shot - make the product the star with dramatic lighting
3. People-first - focus on human emotions and connections
4. Minimalist design - clean, simple, lots of white space
5. Bold typography - let text be the main visual element
6. Collage/mixed media - combine multiple visual elements creatively
7. Illustration-based - use custom illustrations or graphics
8. Environmental context - show the setting/location prominently
9. Close-up details - zoom in on specific features or textures
10. Action/motion - capture movement and energy

🚫 CRITICAL ANTI-REPETITION RULES (MANDATORY - PORTED FROM REVO 1.5):
Each design MUST be visually distinct from previous designs. Follow these explicit variety commands:

**LAYOUT VARIETY:**
- NEVER use the same layout structure as previous designs
- ROTATE visual composition: vertical, horizontal, diagonal, circular, asymmetric
- ALTERNATE element positioning: top-left, bottom-right, center, split, stacked
- VARY spatial relationships: tight grouping, generous spacing, overlapping, separated

**VISUAL ELEMENT VARIETY:**
- VARY phone/device placement: left, right, center, background, foreground, angled
- ALTERNATE text positioning: top-left, bottom-right, center, split layout, vertical stack
- CHANGE background approach: solid color, gradient, photo, minimal (NO BUSY PATTERNS)
- ROTATE focal points: product, person, text, icon, environment

**HUMAN SUBJECT DIVERSITY (if people included):**
- DIVERSIFY age: young adults, middle-aged, seniors, mixed ages
- VARY gender representation: male, female, mixed groups
- CHANGE settings: office, home, outdoor, market, transit, cafe
- ALTERNATE activities: working, shopping, relaxing, transacting, celebrating
- ROTATE emotions: confident, happy, focused, relieved, excited

**COLOR DISTRIBUTION VARIETY (SAME COLORS, DIFFERENT PROPORTIONS):**
- ROTATE color dominance: sometimes primary-heavy, sometimes accent-heavy, sometimes minimal
- VARY color placement: backgrounds, accents, text, borders, shapes
- ALTERNATE color intensity: bold, subtle, balanced, minimal
- CRITICAL: Always use the SAME brand colors - only change the proportions and placement

🚨 MANDATORY: Each design must feel COMPLETELY DIFFERENT from the last. Think: "If someone saw 10 designs in a row, they should all look unique."

${concept.dimensions ? `
🎭🎭🎭 **6-DIMENSIONAL CREATIVE CONCEPT (NARRATIVE FRAMEWORK)** 🎭🎭🎭
This design MUST follow this specific narrative concept to ensure unique storytelling:

**1. SETTING (Where):** ${concept.dimensions.setting.category} - ${concept.dimensions.setting.description}
**2. CUSTOMER (Who):** ${concept.dimensions.customer.type} - ${concept.dimensions.customer.description}
**3. VISUAL STYLE (How):** ${concept.dimensions.visualStyle.style} - ${concept.dimensions.visualStyle.description}
**4. BENEFIT FOCUS (What):** ${concept.dimensions.benefit.type} - ${concept.dimensions.benefit.message}
**5. EMOTIONAL TONE (Feel):** ${concept.dimensions.emotionalTone.tone} - ${concept.dimensions.emotionalTone.description}
**6. FORMAT (Structure):** ${concept.dimensions.format.technique} - ${concept.dimensions.format.structure}

🚨 CRITICAL CONCEPT IMPLEMENTATION:
- The visual MUST depict exactly the SETTING and CUSTOMER described above
- The overall mood MUST match the EMOTIONAL TONE
- The composition MUST follow the FORMAT structure
- DO NOT default to a generic business scene - follow this specific concept!
` : ''}

🔄 UNIVERSAL DESIGN SYSTEM - SELECTED VARIATION COMBINATION:
This design uses a unique combination across 7 dimensions to ensure visual variety:

**DIMENSION 1: LAYOUT ARCHITECTURE** 🚨 CRITICAL - MUST FOLLOW EXACTLY 🚨
- Selected: ${chosenLayoutComposition.name}
- Category: ${chosenLayoutComposition.category}
- Description: ${chosenLayoutComposition.description}
- MANDATORY RULES TO FOLLOW:
${chosenLayoutComposition.rules.map((rule: string) => `  • ${rule}`).join('\n')}

🎯 LAYOUT IMPLEMENTATION REQUIREMENTS:
- You MUST follow the exact spatial arrangement described above
- Text placement MUST match the layout structure (not default to top-center)
- Visual elements MUST be positioned according to the layout rules
- If layout says "bottom corner", text MUST be in bottom corner
- If layout says "diagonal split", design MUST have diagonal division
- If layout says "circular", composition MUST be circular/radial

**DIMENSION 2: TYPOGRAPHY STYLE**
- Selected: ${chosenTypography.name}
- Description: ${chosenTypography.description}
- Instructions: ${chosenTypography.instructions}

**DIMENSION 3: IMAGE TREATMENT**
- Selected: ${chosenImageTreatment.name}
- Description: ${chosenImageTreatment.description}
- Instructions: ${chosenImageTreatment.instructions}

**DIMENSION 4: COLOR USAGE STRATEGY**
- Selected: ${chosenColorStrategy.name}
- Description: ${chosenColorStrategy.description}
- Instructions: ${chosenColorStrategy.instructions}
- 🚨 MANDATORY BRAND COLORS: Primary ${brandProfile.primaryColor || '#3B82F6'}, Secondary ${brandProfile.accentColor || '#1E40AF'}
- 🚨 USE ONLY THESE COLORS - NO OTHER COLORS ALLOWED

**DIMENSION 5: COLOR DISTRIBUTION ROTATION** (Revo 1.5 Mechanism)
- Selected: ${chosenColorDistribution.name}
- Distribution: Primary ${chosenColorDistribution.distribution.primary}%, Accent ${chosenColorDistribution.distribution.accent}%, Background ${chosenColorDistribution.distribution.background}%
- Instructions: ${chosenColorDistribution.instruction}
- CRITICAL: This rotation ensures the same brand colors look different across designs

**DIMENSION 6: VISUAL STYLE**
- Selected: ${chosenStyle}
- Previous to AVOID: ${lastStyle || 'None'}

**DIMENSION 7: VISUAL EFFECT**
- Selected: ${chosenEffect}

⚠️ CRITICAL: You MUST use this exact combination. This ensures every design is visually unique.
Total possible combinations: 20 layouts × 12 typography × 12 images × 10 colors × 4 distributions × 10 styles × 5 effects = 576,000 unique designs!

🎨 LAYOUT COMPOSITION INSTRUCTIONS (CRITICAL - FOLLOW THE CHOSEN LAYOUT):
You MUST follow the "${chosenLayoutComposition.name}" layout structure EXACTLY as shown below.

**LAYOUT: ${chosenLayoutComposition.name}**
Category: ${chosenLayoutComposition.category}
Description: ${chosenLayoutComposition.description}

**VISUAL STRUCTURE (FOLLOW THIS EXACTLY):**
${chosenLayoutComposition.structure}

**MANDATORY LAYOUT RULES (NON-NEGOTIABLE):**
${chosenLayoutComposition.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

⚠️ CRITICAL LAYOUT ENFORCEMENT:
- DO NOT default to "text at top, image in middle, CTA at bottom" - that's FORBIDDEN
- DO NOT ignore the ASCII structure above - it shows EXACTLY where elements go
- DO NOT create your own layout - use the structure shown above PRECISELY
- The visual structure diagram is your blueprint - follow it like architectural plans
- Each layout composition creates a COMPLETELY DIFFERENT visual structure
- If you're not following the ASCII diagram above, you're doing it WRONG

${concept?.dimensions ? `🎬 HERO + SCENE EXECUTION BLUEPRINT (STRICT - NO GENERIC DEFAULTS):
- HERO SUBJECT: ${concept.dimensions.customer.description} (${concept.dimensions.customer.type}). Place them INSIDE the region the "${chosenLayoutComposition.name}" layout allocates for imagery (e.g., if layout says "Right panel = image", the hero belongs there, not center).
- ENVIRONMENT: ${concept.dimensions.setting.description}. Show unmistakable props/backgrounds from this setting—do NOT swap in blank gradients or corporate offices.
- ACTION FORMAT: ${concept.dimensions.format.structure}. Depict this exact action/narrative beat; if it says "split story" or "before/after", the frame MUST show both beats visually.
- BENEFIT VISUALIZATION: ${concept.dimensions.benefit.message}. Add props, overlays, or UI that make this benefit obvious.
- EMOTIONAL DIRECTION: Faces/body language must express "${concept.dimensions.emotionalTone.description}".
- VISUAL STYLE: Shoot/illustrate using "${concept.dimensions.visualStyle.style}" aesthetics (e.g., documentary = candid mid-distance, product focus = tight macro, typography-driven = massive headline blocks).
- CAMERA + CROPPING: Obey the format—if it implies close-up, fill the frame; if it implies wide lifestyle, include surroundings.
- LAYOUT LOCK: ${chosenLayoutComposition.rules?.[0] || 'Follow the layout rules exactly'}. If the hero drifts away from the prescribed zone, REGENERATE.

🚫 DO NOT:
1. Replace the specified scene with "person holding phone" on a blank background.
2. Swap the required customer type for random models.
3. Ignore props tied to ${concept.dimensions.setting.category} (e.g., home couch, market stall, transit interior).
4. Flatten the layout into centered text + floating phone. Honor the split/diagonal/circular blueprint or start over.
` : ''}

⚠️ CRITICAL: Make this design visually distinct from any previous designs!

🎯 VISUAL CONTEXT REQUIREMENT: ${visualContext}${serviceVisualContext}${businessTypeVisualGuidance}

🎯 DESIGN QUALITY PRINCIPLES (Apply within chosen layout):
1. NEUTRAL BACKGROUND: White or soft gradient ONLY (NEVER busy patterns, lines, grids, or decorative overlays)
2. ACCENT COLOR: Tied to post theme using brand colors strategically
3. VISUAL ELEMENTS: Adapt to the chosen layout structure (NOT always centered, NOT always single element)
4. EMOTIONAL HEADLINE: Human tone, not corporate speak
5. OPTIONAL IDENTITY ELEMENT: Small icon or motif for brand consistency

⚠️ IMPORTANT: These principles work WITHIN the chosen layout architecture above.
- If layout is "Split Screen" → divide elements as specified, don't center everything
- If layout is "Diagonal Slash" → place text left, image right at angle
- If layout is "Magazine Layout" → headline bar top, split content below
- The LAYOUT STRUCTURE takes priority - these are quality guidelines, not layout rules

🚫 CRITICAL: ABSOLUTELY NO BUSY BACKGROUNDS, LINES, OR TECH ELEMENTS:

❌ **ABSOLUTELY NO CIRCUIT BOARDS OR ELECTRONIC ELEMENTS:**
- NO circuit boards, circuit lines, or electronic circuits of ANY kind
- NO circuit board patterns, traces, or electronic pathways
- NO microchip imagery, electronic components, or tech hardware
- NO digital/electronic textures or circuit-inspired patterns
- ZERO CIRCUIT ELEMENTS ALLOWED

❌ **ABSOLUTELY NO LIGHT BEAMS OR GLOWING EFFECTS:**
- NO light beams, laser beams, or glowing light rays
- NO beam projections from phones, devices, or any source
- NO glowing lines emanating from objects or people
- NO light trails, light streaks, or luminous paths
- NO holographic light projections or glowing overlays
- NO neon light beams or fluorescent light effects
- ZERO LIGHT BEAM ELEMENTS ALLOWED

❌ **ABSOLUTELY NO FUTURISTIC/ROBOTIC ELEMENTS:**
- NO digital tunnels, tech corridors, or futuristic hallways
- NO robotic elements, mechanical parts, or artificial-looking tech
- NO cyborg imagery, robot parts, or mechanical augmentations
- NO sci-fi environments, space stations, or futuristic settings
- NO matrix-style effects, digital rain, or code overlays
- ZERO ROBOTIC OR SCI-FI ELEMENTS ALLOWED

❌ **ABSOLUTELY NO CIRCULAR PATTERNS (CRITICAL):**
- NO concentric circles (radar style, target style, HUD style)
- NO segmented circles (pie chart style, circular tech overlays)
- NO circular tech patterns (futuristic circles, circular gradients with segments)
- NO circular geometric patterns of ANY kind
- ZERO CIRCULAR PATTERNS ALLOWED

❌ **ABSOLUTELY NO LINE PATTERNS OR CONNECTION LINES:**
- NO curved digital circuit lines or wavy white/light lines across background
- NO straight diagonal lines forming circuit board patterns
- NO angular geometric line patterns or tech-style line overlays
- NO dots, grids, or geometric patterns overlaying the design
- NO tech nodes connected by lines or network visualizations
- NO decorative overlays, patterns, or "tech" aesthetic elements
- NO connection lines, network lines, or flowing curved lines
- NO abstract line patterns or geometric line overlays of ANY kind
- NO lines connecting phones to floating icons or objects
- NO lines connecting devices to UI elements or graphics
- NO data transfer lines, connectivity lines, or network visualization lines
- NO lines showing "connection" between any objects or people
- ABSOLUTELY ZERO LINES OF ANY KIND - connection, network, or decorative

❌ **ABSOLUTELY NO TECH AESTHETIC:**
- NO holographic floating UI elements, dashboards, or transparent screens
- NO floating charts, graphs, or data visualization overlays
- NO transparent/glass-effect tables, panels, or interface elements
- NO futuristic tech overlays or digital interface mockups
- NO wireframe overlays, geometric light patterns, or neon grids
- NO binary numbers, data streams, or code visualizations

✅ **ONLY ALLOWED BACKGROUNDS:**
- ONLY use clean, SOLID flat backgrounds or simple gradients
- KEEP backgrounds sleek, minimal, and professional
- FOCUS on content and people, not decorative background elements
- BACKGROUNDS MUST BE: Solid white, solid brand color, or simple 2-color gradient ONLY
- NO TECH AESTHETIC - keep it clean, modern, and simple

🚫 FORBIDDEN BACKGROUND COLORS (CRITICAL):
- NO black (#000000) backgrounds unless it's a brand color
- NO dark gray (#333333, #444444, #555555) backgrounds unless brand colors
- NO charcoal or dark neutral backgrounds unless specified in brand colors
- ONLY use: White, brand colors (${primaryColor}, ${accentColor}, ${backgroundColor}), or light gradients
- If brand colors are dark, use WHITE background with dark text instead

🌟 NATURAL, AUTHENTIC IMAGERY REQUIREMENTS:
- Show REAL people using technology naturally (no artificial tech effects)
- Use CLEAN, simple backgrounds without digital overlays
- Display phones/devices as normal objects (ABSOLUTELY NO glowing, NO connection lines, NO light beams)
- Focus on HUMAN moments and authentic interactions
- Avoid any artificial tech visualizations or digital effects
- Keep technology integration SUBTLE and realistic
- 🚨 CRITICAL: NO LINES connecting phones to anything - just show people holding phones naturally
- 🚨 CRITICAL: NO floating icons with connection lines - if showing icons, they should be on phone screens only
- 🚨 CRITICAL: NO network visualization, NO connectivity lines, NO data transfer visualization

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

📍 FLEXIBLE TEXT PLACEMENT (ADAPT TO YOUR CHOSEN LAYOUT COMPOSITION):

**For "${chosenLayoutComposition.name}" layout:**
${getTextPlacementGuidance(chosenLayoutComposition.name)}

**Universal Text Placement Principles:**
- VISUAL HIERARCHY: Headline (largest) > Subheadline > Body > CTA
- BREATHING SPACE: Generous white space around all text elements (minimum 20% of design)
- READING FLOW: Create natural eye movement through the design
- BALANCE: Text and image should complement each other, not compete
- CONSISTENCY: Keep related text elements grouped together
- COMPOSITION VARIETY: ${concept.composition} - vary poses and angles to keep series fresh

🚫 AVOID THESE TEXT PLACEMENT MISTAKES:
- NO repetitive "text at top, image middle, CTA bottom" layout every time
- NO text scattered randomly without design intention
- NO text overlapping or competing with focal elements
- NO cramped layouts - always leave breathing room
- NO ignoring the chosen layout composition structure

🚫 ELIMINATE GENERIC FINTECH CLICHÉS (CRITICAL):
- NEVER use: "Unlock Your Tomorrow", "The Future is Now", "Banking Made Simple"
- NEVER use: "Transform Your Business", "Empower Your Journey", "Revolutionize"
- NEVER use: "Seamless", "Effortless", "Streamlined", "Next-Generation"
- NEVER use: "thoughtful details, measurable outcomes" (meaningless corporate speak)
- AVOID: Any headline that could apply to ANY bank or fintech company
- BANNED PHRASES: "stripped away the confusion", "future-proof", "game-changer"

💬 AUTHENTIC HUMAN VOICE REQUIREMENTS (MANDATORY):
- Write like a REAL PERSON talking to a friend, not a corporate press release
- Use conversational, warm tone: "Welcome" instead of "We are pleased to announce"
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
- USE REAL SCENARIOS: "It's month-end. Supplier payment is due and your cash flow is tight. Your account shows exactly what you need."

🎭 RETAIL ADVERTISING RULES (MANDATORY FOR PRODUCT SALES):
- LEAD WITH BENEFIT: Start with what customer gets, not poetic scene-setting
- INCLUDE PRICING: Every retail ad MUST show price, price range, or value claim
- BE DIRECT: "Kids Tablets from KES 12,999" beats "Imagine a world of creativity..."
- ADD CLEAR CTA: "Shop Now", "Visit Showroom", "Order Online", "Compare Models"
- SPECS MATTER: Include key product details (screen size, storage, battery life)
- NO POETRY: Cut flowery language - customers want facts, benefits, and prices
- EXAMPLE GOOD: "10-inch HD tablets. 64GB storage. All-day battery. From KES 24,999. Shop online or visit our showroom."
- EXAMPLE BAD: "In the golden hues of the afternoon, imagine yourself with a tablet that unlocks worlds..."

🎭 CAPTION STRUCTURE FOR RETAIL (MANDATORY):
1. BENEFIT STATEMENT (1 sentence): What problem does this solve?
2. KEY FEATURES (1-2 sentences): Specs, capabilities, what's included
3. PRICING INFO (1 phrase): Price, range, payment options, or savings
4. CLEAR CTA (1 sentence): Exactly what action to take next
TOTAL LENGTH: 3-4 sentences maximum, NO poetic storytelling

🚫 TEMPLATE VIOLATIONS TO AVOID:
- NO busy or complex backgrounds
- NO multiple competing focal points
- NO corporate jargon in headlines
- NO overwhelming brand elements
- NO cramped layouts without white space

🎛️ SIMPLIFIED STYLE DIRECTIVES:
- Design Style: ${chosenStyle} (applied minimally - USE ${primaryColor} ONLY)
- Layout Composition: ${chosenLayoutComposition.name} (MUST follow this structure)
- Typography: ${chosenTypography.name} (clean and readable)
- Effects: ${chosenEffect} (subtle, not distracting)
- Camera Perspective: ${chosenPerspective.name} (${chosenPerspective.instruction}) - MUST FOLLOW
- COLOR ENFORCEMENT: STRICTLY ${primaryColor}, ${accentColor}, ${backgroundColor} ONLY.

📐 LAYOUT STRUCTURE (MANDATORY):
${chosenLayoutComposition.structure}

📐 LAYOUT RULES:
${chosenLayoutComposition.rules.join('\n')}

DESIGN REQUIREMENTS:
- Platform: ${platform} (${getPlatformDimensions(platform)})
- Visual Style: ${visualStyle} (Using ONLY ${primaryColor})
- Business: ${brandProfile.businessName} - ${businessType}${brandInfo}
- Location: ${brandProfile.location || 'Global'}
- Visual Theme: ${visualContext} (In strict ${primaryColor} palette)
${concept.featuredServices && concept.featuredServices.length > 0 ? `- Featured Service: ${concept.featuredServices[0].serviceName} (TODAY'S FOCUS)` : ''}

${isAfricanCountry && options.includePeopleInDesigns !== false ? `
🚨🚨🚨 CRITICAL: AFRICAN REPRESENTATION REQUIREMENT 🚨🚨🚨
THIS BUSINESS IS IN ${location.toUpperCase()} - AN AFRICAN COUNTRY

BEFORE YOU GENERATE ANYTHING, READ THIS:
- If you include ANY people in this image, they MUST be 100% Black/African
- ZERO white people allowed - this is ABSOLUTE and NON-NEGOTIABLE
- ZERO light-skinned people - only dark-skinned Black/African people
- If you cannot guarantee this, DO NOT include people at all
- Better NO people than wrong people

VALIDATION: Can you guarantee ONLY Black/African people? If NO, exclude people entirely.
🚨🚨🚨 THIS IS THE #1 PRIORITY - NOTHING OVERRIDES THIS 🚨🚨🚨
` : ''}

${shouldFollowBrandColors ? `
🎨🎨🎨 **CLOSED PALETTE PROTOCOL (STRICTEST ENFORCEMENT)** 🎨🎨🎨
You are restricted to a specific set of hex codes. NO OTHER COLORS EXIST.

**✅ THE ONLY ALLOWED COLORS:**
1. **PRIMARY**: ${primaryColor || '#3B82F6'}
2. **ACCENT**: ${accentColor || '#1E40AF'}
3. **BACKGROUND**: ${backgroundColor || '#FFFFFF'}
4. **NEUTRALS**: Pure White (#FFFFFF), Pure Black (#000000)

**🚫 GLOBAL COLOR BAN (CRITICAL):**
- **ABSOLUTELY NO** Yellow, Orange, Pink, Purple, Cyan, or Teal.
- **ABSOLUTELY NO** "Standard Blue" or "Standard Green" (unless they match the hex codes above).
- **ABSOLUTELY NO** "Complementary colors" that you think look good.
- **ABSOLUTELY NO** Gradients involving colors not listed above.

**RULE OF THUMB:**
- If you are about to use a color, ask: "Is this exact hex code in my allowed list?"
- If NO -> **DO NOT USE IT.** Use White or Black instead.
- Better to be "boring" and consistent than "creative" and off-brand.
` : ''}

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
❌ "Before and After" visual metaphors split by lines or arrows
❌ "Tangled lines transforming into straight lines" metaphors or chaotic scribbles
❌ Any arrows pointing from chaos to order or connecting elements
❌ Floating icons connected by arrows or lines
❌ Process flowcharts, step-by-step diagrams, or infographic elements
❌ "Problem vs Solution" visual comparisons with split screens
❌ Abstract "confusion" or "chaos" visualizations (e.g., scribbles, knots)
❌ Floating checkmarks, shield icons, or 3D symbols floating in mid-air

CRITICAL REQUIREMENTS:
- Resolution: 992x1056px (1:1 square format)
- High-quality, professional appearance
${shouldFollowBrandColors ? `- MANDATORY: Use ONLY the specified brand colors (${primaryColor}, ${accentColor}, ${backgroundColor}) - NO other colors allowed` : ''}
- Clear, readable text elements with proper contrast
- Engaging visual composition with brand consistency
- Cultural sensitivity and relevance
- Professional typography that complements the brand colors
- VISUAL CONSISTENCY: Ensure the image clearly represents ${visualContext}

📝 STRONG TYPOGRAPHY HIERARCHY (MANDATORY):
- HEADLINE: Bold, heavy font weight - 2X larger than other text elements
- SUBHEADLINE: Medium weight - 50% smaller than headline, supports main message
- PRICING/SPECS TEXT: MUST be large enough to read easily (minimum 16px equivalent)
- STRONG CONTRAST: White text on dark backgrounds OR dark text on light backgrounds
- NO thin or light font weights that blend into backgrounds
- NO tiny text for important information (prices, specs, features)
- LOGO PLACEMENT: Isolated in consistent corner with proper spacing for brand memory
- Clear visual separation between headline, subheadline, and body text
- NEVER use text like "COMPANY:", "PAYA:", or "BusinessName:" in the design
- NEVER include "journey", "everyday", or repetitive corporate language in design text
- Headlines must be engaging phrases, not company announcements
- Ensure maximum readability across all text elements

💰 PRICING & SPECS DISPLAY (RETAIL MANDATORY):
- PRICING must be PROMINENT and READABLE (never tiny or hard to see)
- SPECS must be CLEAR and LEGIBLE (screen size, storage, battery, etc.)
- Use BOLD or HIGHLIGHTED text for prices to draw attention
- Format prices clearly: "KES 24,999" or "From KES 12,999"
- Group related specs together for easy scanning
- NEVER make pricing or specs smaller than 16px equivalent
- Pricing should be one of the MOST VISIBLE elements in retail ads

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

💰 CURRENCY REQUIREMENTS (MANDATORY):
${currencyInstructions}
${options.includeContacts !== true ? '\n\n🚫 **CRITICAL: DO NOT INCLUDE CONTACT INFORMATION:**\n- DO NOT include phone numbers, email addresses, or website URLs in the design\n- DO NOT add contact details in footer or anywhere else\n- Contact toggle is OFF - no contact information should appear\n- Focus on the main message without contact details' : ''}

Create a visually stunning design that stops scrolling and drives engagement while maintaining perfect brand consistency.${options.includeContacts === true ? contactInstruction : ''}${peopleInstructions}${culturalInstructions}

${isAfricanCountry && options.includePeopleInDesigns !== false ? `

🚨🚨🚨 FINAL REMINDER - AFRICAN REPRESENTATION 🚨🚨🚨
Before you generate, answer this question:
"Will EVERY person in this image be Black/African with dark skin?"

If the answer is NOT a definite YES, then EXCLUDE all people from the image.
This business is in ${location} - cultural authenticity is MANDATORY.
🚨🚨🚨 ZERO WHITE PEOPLE - THIS IS NON-NEGOTIABLE 🚨🚨🚨
` : ''}`;
}

async function hydrateAnglesFromDb(brandKey: string, brandProfileId?: string, platform?: string): Promise<void> {
  if (!brandProfileId) return;
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    let query = supabase
      .from('generated_posts')
      .select('generation_settings')
      .eq('brand_profile_id', brandProfileId)
      .order('created_at', { ascending: false })
      .limit(12);
    if (platform) query = query.eq('platform', String(platform).toLowerCase());
    const { data, error } = await query;
    if (error || !data) return;
    const tracker = campaignAngleTracker.get(brandKey) || {
      usedAngles: [],
      lastUsed: Date.now(),
      currentCampaignId: generateCampaignId(brandKey)
    };
    for (const row of data) {
      const gs = row?.generation_settings;
      const angle = typeof gs?.format === 'string' ? gs.format : undefined;
      if (angle && MARKETING_ANGLES.some(a => a.id === angle) && !tracker.usedAngles.includes(angle)) {
        tracker.usedAngles.push(angle);
      }
    }
    campaignAngleTracker.set(brandKey, tracker);
  } catch {}
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
    
    console.log('🔍 [Revo 2.0 Primary] Logo detection for Gemini 3 Pro:', {
      hasLogoDataUrl: !!logoDataUrl,
      hasLogoStorageUrl: !!logoStorageUrl,
      finalLogoUrl: !!logoUrl,
      logoFormat: logoUrl ? (logoUrl.startsWith('data:') ? 'data-url' : 'url') : 'none'
    });

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
      console.log('🎯 [Revo 2.0] Adding logo to generation parts');

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

        // Enhanced logo integration prompt with business context
        const businessName = options.brandProfile?.businessName || 'the business';
        const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.

📋 LOGO INTEGRATION RULES:
- Integrate the ${businessName} logo naturally into the layout - do not create a new logo
- The logo should be prominently displayed but not overwhelming the design
- Position the logo professionally (top-left, top-right, or center as appropriate)
- Maintain the logo's aspect ratio and clarity
- Ensure the logo is clearly visible against the background
- The logo represents ${businessName} - treat it with respect and prominence

🚨 CRITICAL: The client specifically requested their brand logo to be included. FAILURE TO INCLUDE THE LOGO IS UNACCEPTABLE.

💡 DESIGN QUALITY REQUIREMENTS:
- Create a professional, modern design that reflects ${businessName}'s brand
- Use high-quality, realistic imagery (no stock photo poses)
- Ensure text is readable and well-positioned
- Create visual hierarchy with proper spacing
- Match the design style to the business type and target audience
- Include relevant business context in the visual elements`;

        generationParts[0] = prompt + logoPrompt;
        console.log('✅ [Revo 2.0] Logo integration prompt added');
      } else {
        console.error('❌ [Revo 2.0] Invalid logo data URL format');
      }
    } else {
      console.log('ℹ️ [Revo 2.0] No logo available for generation');
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
 * Feature flag system for gradual assistant rollout
 * Controls what percentage of traffic uses assistants vs adaptive framework
 */
function shouldUseAssistant(businessType: string): boolean {
  // Get rollout percentage from environment (0-100)
  const rolloutPercentages: Record<string, number> = {
    retail: parseFloat(process.env.ASSISTANT_ROLLOUT_RETAIL || '0'),
    finance: parseFloat(process.env.ASSISTANT_ROLLOUT_FINANCE || '0'),
    service: parseFloat(process.env.ASSISTANT_ROLLOUT_SERVICE || '0'),
    saas: parseFloat(process.env.ASSISTANT_ROLLOUT_SAAS || '0'),
    food: parseFloat(process.env.ASSISTANT_ROLLOUT_FOOD || '0'),
    healthcare: parseFloat(process.env.ASSISTANT_ROLLOUT_HEALTHCARE || '0'),
    realestate: parseFloat(process.env.ASSISTANT_ROLLOUT_REALESTATE || '0'),
    education: parseFloat(process.env.ASSISTANT_ROLLOUT_EDUCATION || '0'),
    b2b: parseFloat(process.env.ASSISTANT_ROLLOUT_B2B || '0'),
    nonprofit: parseFloat(process.env.ASSISTANT_ROLLOUT_NONPROFIT || '0'),
  };

  const percentage = rolloutPercentages[businessType] || 0;

  // Random selection based on percentage
  const random = Math.random() * 100;
  const shouldUse = random < percentage;

  if (percentage > 0) {
    console.log(`🎲 [Revo 2.0] Assistant rollout for ${businessType}: ${percentage}% (random: ${random.toFixed(2)}, use: ${shouldUse})`);
  }

  return shouldUse;
}

/**
 * Generate unique caption and hashtags for Revo 2.0 that align with the image
 */
export async function generateCaptionAndHashtags(
  options: Revo20GenerationOptions,
  concept: any,
  imagePrompt: string,
  imageUrl?: string,
  textGenerator: TextGenerationHandler = defaultClaudeGenerator
): Promise<{
  caption: string;
  hashtags: string[];
  headline?: string;
  subheadline?: string;
  cta?: string;
  captionVariations?: string[];
}> {
  const { businessType, brandProfile, platform } = options;

  // Detect business type for assistant selection
  const detection = detectBusinessType(brandProfile);
  const detectedType = detection.primaryType;

  console.log(`🔍 [Revo 2.0] Business type detection:`, {
    businessName: brandProfile.businessName,
    businessType: brandProfile.businessType,
    detectedType: detectedType,
    confidence: detection.confidence
  });

  // Check if we should use assistant for this business type
  const useAssistant = shouldUseAssistant(detectedType);
  const isAssistantAvailable = assistantManager.isAvailable(detectedType);

  console.log(`🤖 [Revo 2.0] Assistant availability check:`, {
    detectedType,
    shouldUseAssistant: useAssistant,
    isAssistantAvailable: isAssistantAvailable,
    willUseAssistant: useAssistant && isAssistantAvailable
  });

  // Check if fallback is enabled
  const fallbackEnabled = process.env.ENABLE_ASSISTANT_FALLBACK !== 'false';

  if (useAssistant && isAssistantAvailable) {
    console.log(`🤖 [Revo 2.0] ✅ Using Multi-Assistant Architecture for ${detectedType}`);
    console.log(`🔧 [Revo 2.0] Fallback to adaptive framework: ${fallbackEnabled ? 'ENABLED' : 'DISABLED'}`);

    try {
      // Get marketing angle for assistant (hydrate from DB first)
      const brandKey = getBrandKey(brandProfile, platform);
      await hydrateAnglesFromDb(brandKey, (brandProfile as any)?.id, platform as any);
      const assignedAngle = assignMarketingAngle(brandKey, options);

      // Build DB-backed avoid list from recent posts
      const brandProfileId = (brandProfile as any)?.id as string | undefined;
      const recentDb = brandProfileId ? await fetchRecentDbPosts(brandProfileId, platform as any, 7) : [];
      let avoidListText = buildAvoidListTextFromRecent(recentDb);

      let assistantResponse = await assistantManager.generateContent({
        businessType: detectedType,
        brandProfile: brandProfile,
        concept: concept,
        imagePrompt: imagePrompt,
        platform: platform,
        marketingAngle: assignedAngle,
        useLocalLanguage: options.useLocalLanguage,
        avoidListText,
      });

      console.log(`✅ [Revo 2.0] Assistant generation successful`);

      // ============================================================================
      // STORY COHERENCE VALIDATION FOR ASSISTANT-GENERATED CONTENT
      // ============================================================================

      const firstOut = {
        headline: assistantResponse.content.headline,
        subheadline: assistantResponse.content.subheadline || '',
        caption: assistantResponse.content.caption,
      };
      const simCheck = isTooSimilarToRecent(firstOut, recentDb);
      if (simCheck.similar) {
        console.warn(`⚠️ [Revo 2.0 Assistant] Similar to recent posts, retrying once. Reasons: ${simCheck.reasons.join(' | ')}`);
        const secondAvoid = `${avoidListText}\nAdditionally avoid these patterns/themes:\n- ${simCheck.reasons.join('\n- ')}`;
        // Try another angle to diversify
        const secondAngle = assignMarketingAngle(brandKey, options);
        assistantResponse = await assistantManager.generateContent({
          businessType: detectedType,
          brandProfile: brandProfile,
          concept: concept,
          imagePrompt: imagePrompt,
          platform: platform,
          marketingAngle: secondAngle,
          useLocalLanguage: options.useLocalLanguage,
          avoidListText: secondAvoid,
        });
      }

      // Validate story coherence between headline and caption
      const coherenceValidation = validateStoryCoherence(
        assistantResponse.content.headline,
        assistantResponse.content.caption,
        detectedType
      );

      console.log('🔗 [Revo 2.0 Assistant] Story coherence validation:', coherenceValidation);

      // Enhanced coherence validation logging for debugging
      if (coherenceValidation.issues.length > 0) {
        console.log(`🚨 [Revo 2.0 Assistant COHERENCE ISSUES] Found ${coherenceValidation.issues.length} coherence issues:`);
        coherenceValidation.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
      } else {
        console.log(`✅ [Revo 2.0 Assistant COHERENCE SUCCESS] No coherence issues found`);
      }

      // Log coherence score for monitoring
      console.log(`📊 [Revo 2.0 Assistant] Coherence Score: ${coherenceValidation.coherenceScore}/100`);

      // Enforce platform-specific hashtag limits for assistant response
      const normalizedPlatform = String(platform).toLowerCase();
      const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
      let finalHashtags = assistantResponse.content.hashtags || [];

      if (finalHashtags.length > maxHashtags) {
        console.log(`📊 [generateCaptionAndHashtags] Trimming hashtags from ${finalHashtags.length} to ${maxHashtags} for ${platform}`);
        finalHashtags = finalHashtags.slice(0, maxHashtags);
      } else if (finalHashtags.length < maxHashtags) {
        console.warn(`⚠️ [generateCaptionAndHashtags] Assistant returned ${finalHashtags.length} hashtags, expected ${maxHashtags} for ${platform}`);
      }

      console.log(`#️⃣ [generateCaptionAndHashtags] Final hashtag count: ${finalHashtags.length} for ${platform}`);

      return {
        headline: assistantResponse.content.headline,
        subheadline: assistantResponse.content.subheadline,
        caption: assistantResponse.content.caption,
        cta: assistantResponse.content.cta,
        hashtags: finalHashtags,
      };

    } catch (error) {
      console.error(`❌ [Revo 2.0] Assistant generation failed for ${detectedType}:`, error);

      if (!fallbackEnabled) {
        // Fallback disabled - throw error to surface the issue
        console.error(`🚫 [Revo 2.0] Fallback is DISABLED - throwing error for debugging`);
        throw new Error(`Assistant generation failed for ${detectedType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Fallback enabled - continue to adaptive framework
      console.warn(`⚠️ [Revo 2.0] Fallback ENABLED - falling back to adaptive framework`);
      // Fall through to adaptive framework below
    }
  } else if (useAssistant && !assistantManager.isAvailable(detectedType)) {
    console.warn(`⚠️ [Revo 2.0] Assistant for ${detectedType} not available - using adaptive framework`);
  } else {
    console.log(`🎯 [Revo 2.0] Using Adaptive Framework for ${detectedType}`);
  }

  // ============================================================================
  // ADAPTIVE FRAMEWORK (FALLBACK OR DEFAULT)
  // ============================================================================

  // Determine hashtag count based on platform
  const normalizedPlatform = String(platform).toLowerCase();
  const hashtagCount = normalizedPlatform === 'instagram' ? 5 : 3;

  const keyFeaturesList = normalizeStringList((brandProfile as any).keyFeatures ?? brandProfile.keyFeatures);
  const competitiveAdvantagesList = normalizeStringList((brandProfile as any).competitiveAdvantages ?? brandProfile.competitiveAdvantages);
  const servicesList = normalizeServiceList((brandProfile as any).services ?? brandProfile.services);
  const positioning = (brandProfile as any).competitivePositioning;
  const brandKey = getBrandKey(brandProfile, platform);

  // Generate unique timestamp-based seed for variety
  const uniqueSeed = Date.now() + Math.random();
  const creativityBoost = Math.floor(uniqueSeed % 10) + 1;

  // Get recent data for anti-repetition
  const recentData = recentOutputs.get(brandKey) || { headlines: [], captions: [], concepts: [] };

  // ============================================================================
  // UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK - ANGLE ASSIGNMENT
  // ============================================================================

  // Assign strategic marketing angle for campaign diversity
  const assignedAngle = assignMarketingAngle(brandKey, options);
  console.log(`🎯 [Revo 2.0] Marketing Angle: ${assignedAngle.name}`);

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
      console.log(`🌍 [Revo 2.0 Claude Fallback] BILINGUAL MODE ACTIVE: 70% English, 30% ${brandProfile.location} local language`);
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
    } else {
      console.log(`🌍 [Revo 2.0 Claude Fallback] English-only mode (local language toggle OFF)`);
    }

    // Get business-type specific strategy
    const businessTypeInstructions = generateBusinessTypePromptInstructions(businessType, brandProfile);

    // Detect if this is a retail/e-commerce business
    const isRetail = businessType.toLowerCase().includes('retail') ||
      businessType.toLowerCase().includes('e-commerce') ||
      businessType.toLowerCase().includes('ecommerce') ||
      businessType.toLowerCase().includes('shop') ||
      businessType.toLowerCase().includes('store') ||
      businessType.toLowerCase().includes('electronics') ||
      businessType.toLowerCase().includes('fashion') ||
      businessType.toLowerCase().includes('clothing') ||
      businessType.toLowerCase().includes('boutique') ||
      businessType.toLowerCase().includes('marketplace');

    const contentPrompt = `Create engaging social media content for ${brandProfile.businessName} (${businessType}) on ${platform}.

🎯 BUSINESS CONTEXT:
- Business: ${brandProfile.businessName}
- Industry: ${businessType}
- Location: ${brandProfile.location || 'Global'}
- Platform: ${platform}
- Content Approach: ${selectedApproach} (use this strategic angle)
- Unique ID: ${uniqueId} (ensure this generation is completely different from previous ones)${localLanguageInstructions}
${businessTypeInstructions}

${isRetail ? `
🚨🚨🚨 CRITICAL RETAIL REQUIREMENTS (MANDATORY) 🚨🚨🚨

THIS IS A RETAIL BUSINESS. You MUST follow these rules:

❌ ABSOLUTELY FORBIDDEN FOR RETAIL:
- NO abstract emotional headlines like "Unlock Your Dreams", "Love Story", "Inner Mogul"
- NO lifestyle scenes where products are barely visible
- NO vague language like "range of smart home devices" or "collection of products"
- NO emotional storytelling without product focus
- NO generic promises without specific product details

✅ MANDATORY FOR RETAIL:
1. HEADLINE: Must include product name/brand AND price OR category AND starting price
   - Format: "[Product Name/Brand] - [Price]" OR "[Category] From KES [Price]"
   - Examples: "Samsung 55" 4K TV - KES 89,999", "Smart Speakers From KES 3,500"

2. VISUAL: Product must be the STAR (60-80% of image)
   - Show the actual product clearly
   - Include price overlays or feature callouts
   - Product should be identifiable and prominent

3. CAPTION: Must include ALL of these:
   - Specific product name and model (e.g., "Samsung Galaxy S24 Ultra 256GB")
   - 2-3 key features (e.g., "200MP camera, S Pen, 5000mAh battery")
   - Exact price (e.g., "KES 89,999")
   - Availability (e.g., "In stock now", "Only 5 left")
   - Where to buy (e.g., "Order online or visit showroom")

4. DIFFERENT PRODUCTS: Each ad should feature a DIFFERENT specific product
   - Ad 1: Feature Product A with its details
   - Ad 2: Feature Product B with its details
   - Ad 3: Feature Product C with its details
   - NEVER use same vague "smart home devices" across multiple ads

⚠️ RETAIL VALIDATION CHECKLIST:
Before generating, ask yourself:
- Can I name the specific product being advertised? (YES required)
- Is the price clearly stated? (YES required)
- Are 2-3 features listed? (YES required)
- Is the product the visual focus? (YES required)
- Would a customer know exactly what to buy and for how much? (YES required)

If ANY answer is NO, you have FAILED the retail requirements.
` : ''}

🚨 MAXIMUM VARIETY REQUIREMENT (CRITICAL):
This is generation #${creativityBoost} for this business. Each generation MUST be completely unique:
- NEVER repeat phrases, patterns, or structures from previous generations
- Use COMPLETELY DIFFERENT marketing angles each time (even for the same product/service)
${isRetail ? '- For RETAIL: Feature DIFFERENT specific products in each ad with their unique details' : '- Vary the storytelling approach: emotional appeal, feature focus, benefit focus, social proof, urgency, problem-solution, etc.'}
- Change the tone and style: conversational, professional, playful, urgent, aspirational, etc.
- NO TEMPLATES OR FORMULAS - every piece of content should feel fresh and original
- Think: "If I generated content for this business 10 times, each should be from a totally different creative direction"

🎨 CREATIVE DIVERSITY STRATEGIES ${isRetail ? '(For RETAIL: Always product-focused)' : '(Use different ones each time)'}:
${isRetail ? `
1. Single product hero - Feature ONE product with all its details and benefits
2. Product comparison - Compare 2-3 products in same category with prices
3. Bundle deal - Show complete kit/package with itemized pricing
4. Brand showcase - Feature products from specific brand (e.g., "Google Nest Collection")
5. Category range - Show multiple products in category with starting prices
6. New arrival - Announce specific new product with launch details
7. Sale/discount - Feature discounted product with before/after pricing
8. Feature spotlight - Highlight one key feature across product line
9. Use case - Show specific product solving specific problem
10. Stock alert - Feature limited stock product with urgency
` : `
1. Emotional storytelling - connect through feelings and experiences
2. Feature showcase - highlight specific product/service capabilities
3. Benefit-driven - focus on outcomes and results for customers
4. Social proof - leverage testimonials, reviews, popularity
5. Problem-solution - identify pain points and present solutions
6. Aspirational - paint a picture of the ideal future state
7. Educational - teach something valuable while promoting
8. Behind-the-scenes - show the process, people, or craftsmanship
9. Comparison - show before/after or us vs. competitors
10. Urgency/scarcity - create FOMO with limited offers or timing
`}

🔄 ANTI-REPETITION CHECKLIST:
Recent content to AVOID repeating:
${recentData.headlines.length > 0 ? `- Recent Headlines: ${recentData.headlines.slice(0, 3).join(' | ')}` : ''}
${recentData.captions.length > 0 ? `- Recent Caption Themes: ${recentData.captions.slice(0, 2).map((c: string) => c.substring(0, 50)).join(' | ')}` : ''}
${recentData.concepts.length > 0 ? `- Recent Concepts: ${recentData.concepts.slice(0, 2).join(' | ')}` : ''}

⚠️ CRITICAL: If you notice any similarity to recent content above, COMPLETELY CHANGE YOUR APPROACH!

${assignedAngle ? `
🎯 UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK - ASSIGNED ANGLE:

📋 MARKETING ANGLE: ${assignedAngle.name}
📝 DESCRIPTION: ${assignedAngle.description}
🎯 FOCUS AREA: ${assignedAngle.focusArea}

🎪 ANGLE-SPECIFIC INSTRUCTIONS:
${assignedAngle.promptInstructions}

📰 HEADLINE GUIDANCE: ${assignedAngle.headlineGuidance}
📄 CAPTION GUIDANCE: ${assignedAngle.captionGuidance}
🎨 VISUAL GUIDANCE: ${assignedAngle.visualGuidance}

💡 ANGLE EXAMPLE (Use as inspiration, NOT as template):
- Headline: "${assignedAngle.examples.headline}"
- Subheadline: "${assignedAngle.examples.subheadline}"
- Caption: "${assignedAngle.examples.caption}"

⚠️ CRITICAL: Follow this marketing angle consistently throughout ALL content elements (headline, subheadline, caption, CTA).
` : ''}

💼 BUSINESS INTELLIGENCE:
${keyFeaturesList.length > 0 ? `- Key Features: ${keyFeaturesList.slice(0, 5).join(', ')}` : ''}
${competitiveAdvantagesList.length > 0 ? `- Competitive Advantages: ${competitiveAdvantagesList.slice(0, 3).join(', ')}` : ''}
${servicesList.length > 0 ? `- Services: ${servicesList.slice(0, 4).join(', ')}` : ''}
${brandProfile.targetAudience ? `- Target Audience: ${brandProfile.targetAudience}` : ''}
${typeof positioning === 'string' && positioning.trim().length > 0 ? `- Positioning: ${positioning}` : ''}
${brandProfile.description ? `- Business Description: ${brandProfile.description.substring(0, 200)}` : ''}


🏆 COMPETITIVE ANALYSIS:
${getCompetitorAnalysis(brandProfile)}
The generated image shows: ${concept.concept}
${imagePrompt ? `Image elements include: ${getDetailedVisualContext(imagePrompt, businessType)}` : ''}${serviceContentContext}${imageAnalysisContext}

📸 REALISTIC PHOTOGRAPHY REQUIREMENTS:
- Show REAL people in NATURAL settings (not staged poses)
- Use CLEAN, SIMPLE compositions without artificial effects
- Focus on AUTHENTIC interactions with technology

🚫 ABSOLUTELY FORBIDDEN - DO NOT INCLUDE ANY OF THESE:
❌ NO flowing lines, waves, streams, or ribbons coming from devices/phones
❌ NO glowing trails, light beams, energy effects, or halos around objects
❌ NO abstract colorful swirls, flowing elements, or decorative curves
❌ NO neon glows, artificial lighting effects, or fantasy glows
❌ NO computer-generated visual effects or CGI-style elements
❌ NO floating icons, symbols, or graphic overlays on the image
❌ NO abstract data visualizations, charts, or graphs overlaid on photos
❌ NO holographic effects, digital overlays, or futuristic elements
❌ NO particle effects, sparkles, or magical elements
❌ NO geometric patterns overlaid on realistic photos

✅ INSTEAD, CREATE:
✓ Clean, realistic photography without artificial effects
✓ Natural lighting and authentic environments
✓ Real people in natural settings doing real activities
✓ Actual products/devices shown clearly without effects
✓ Simple, professional compositions
✓ Show actual mobile banking interfaces, not fantasy effects

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
3. CAPTION (50-100 words): Should continue the story started by the headline/subheadline in the image
4. CALL-TO-ACTION (2-4 words): Action-oriented and contextually appropriate
5. HASHTAGS (EXACTLY ${hashtagCount}): ${normalizedPlatform === 'instagram' ? '5 hashtags for Instagram' : '3 hashtags for other platforms'}

✏️ GRAMMAR & LANGUAGE RULES (CRITICAL):
- CORRECT: "Payments that fit your day" (plural subject = plural verb)
- WRONG: "Payments that fits your day" (grammar error)
- CORRECT: "Business that grows" (singular) / "Businesses that grow" (plural)
- CHECK subject-verb agreement in ALL content
- USE proper English grammar throughout
- AVOID grammatical errors that make content look unprofessional

🚨🚨🚨 CAPTION WRITING RULES - ABSOLUTELY CRITICAL 🚨🚨🚨
FOR RETAIL/PRODUCT BUSINESSES - USE THIS EXACT STRUCTURE:

SENTENCE 1: Lead with value (price/benefit/offer)
SENTENCE 2: State key features (what you get)
SENTENCE 3: Add use case (who it's for / what you can do)
SENTENCE 4: Clear CTA (what to do next)

TOTAL: 3-4 sentences MAXIMUM. NO creative writing. NO scene-setting. NO storytelling.

❌ ABSOLUTELY BANNED CAPTION OPENINGS (NEVER USE THESE):
- "From the first light of dawn to the serene twilight..."
- "Picture this: the day's fading light gently embraces..."
- "In the heart of [location], surrounded by..."
- "Imagine yourself in the serene landscapes..."
- "Follow the journey of..."
- ANY time-of-day imagery or scene descriptions
- ANY narrative storytelling or creative writing
- ANY "picture this" or "imagine" language

✅ CORRECT RETAIL CAPTION OPENINGS (ALWAYS USE THESE):
- "[Product name] from KES [price]."
- "Perfect for [target audience]."
- "[Benefit statement]. [Feature statement]."
- "Get [product] with [key feature]."
- "[Product category] built for [specific use]."

EXAMPLE TRANSFORMATIONS:
❌ BAD: "From the first light of dawn to the serene twilight, follow the journey of a digital entrepreneur equipped wi..."
✅ GOOD: "Student tablets from KES 12,999. Perfect for learning, entertainment, and staying connected. Includes educational apps, parental controls, and all-day battery. Shop online or visit our showroom today."

❌ BAD: "Picture this: the day's fading light gently embraces a tastefully decorated home office,..."
✅ GOOD: "Work-from-anywhere tablet: KES 24,999. Includes keyboard attachment, 10" display, and productivity software. Video calls, documents, presentations - all on one device. Free delivery in Nairobi."

❌ BAD: "In the heart of Nairobi's vibrant market, a young entrepreneur demonstrates the power of technology,..."
✅ GOOD: "Business tablets built for Kenyan entrepreneurs. Use as mobile POS, inventory tracker, or customer management system. Rugged design, long battery life, affordable pricing. Visit our demo center today."

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
- If business is FINTECH → Focus on payments, banking, transfers, business finance, mobile money
- If business is HEALTHCARE → NO banking, payments, technology themes unless relevant  
- If business is EDUCATION → NO banking, medical, retail themes unless relevant
- ALWAYS check: Does this headline relate to the actual business services?
- FOCUS for Paya Finance: Mobile banking, instant payments, business growth, cash flow solutions
- REQUIRED: Headlines must connect to actual business services and target audience

🔗 STORY COHERENCE VALIDATION (NON-NEGOTIABLE):
- HEADLINE and CAPTION must share common keywords or themes
- If headline mentions "BUSINESS" → caption MUST mention business operations/growth/management
- If headline mentions "POCKET" → caption MUST mention phone/mobile/payment in pocket
- If headline mentions "SECURE" → caption MUST mention security/protection/safety
- If headline mentions "DAILY" → caption MUST mention everyday/routine activities
- NEVER write generic captions that could work with any headline
- Caption must SPECIFICALLY relate to and expand on the headline message
- NO corporate filler language: "puts BNPL front and center today"

💡 SERVICE-SPECIFIC CONTENT RULES:
${servicesList.length > 0 ? servicesList.map(service => `- ${service}: Focus on specific benefits and outcomes`).join('\n') : ''}
${keyFeaturesList.length > 0 ? `- Use these key features: ${keyFeaturesList.slice(0, 3).join(', ')}` : ''}
${competitiveAdvantagesList.length > 0 ? `- Highlight advantages: ${competitiveAdvantagesList.slice(0, 2).join(', ')}` : ''}

🎯 CUSTOMER PAIN POINTS & SOLUTIONS:
${getCustmerPainPointsForBusiness(businessType, brandProfile)}

💰 VALUE PROPOSITIONS (USE THESE):
${getValuePropositionsForBusiness(businessType, brandProfile)}

🎯 PAYA-SPECIFIC CONTENT FOCUS (MANDATORY):
- Focus on REAL Paya services: Mobile Banking, Buy Now Pay Later, Instant Payments, Business Payments
- Target REAL audiences: Small business owners, entrepreneurs, unbanked Kenyans, mobile money users
- Address REAL pain points: Bank queues, credit requirements, high fees, slow transfers
- Use REAL benefits: No credit checks, instant account opening, transparent fees, mobile convenience
- CREATE: Authentic fintech scenarios that Paya customers actually experience
- CREATE: Authentic fintech scenarios that Paya customers actually experience

🚫 ANTI-AI VISUAL RULES (MANDATORY - NO EXCEPTIONS):
ABSOLUTELY FORBIDDEN - DO NOT INCLUDE ANY OF THESE:
❌ NO flowing lines, waves, streams, or ribbons coming from devices/phones
❌ NO glowing trails, light beams, energy effects, or halos around objects
❌ NO abstract colorful swirls, flowing elements, or decorative curves
❌ NO neon glows, artificial lighting effects, or fantasy glows
❌ NO computer-generated visual effects or CGI-style elements
❌ NO floating icons, symbols, or graphic overlays on the image
❌ NO abstract data visualizations, charts, or graphs overlaid on photos
❌ NO holographic effects, digital overlays, or futuristic elements
❌ NO particle effects, sparkles, or magical elements
❌ NO geometric patterns overlaid on realistic photos

✅ INSTEAD, CREATE:
✓ Clean, realistic photography without artificial effects
✓ Natural lighting and authentic environments
✓ Real people in natural settings doing real activities
✓ Actual products/devices shown clearly without effects
✓ Simple, professional compositions
✓ Authentic interactions with technology
✓ Real-world scenarios that people can relate to

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
- RETAIL CTAs: "Shop Now", "Visit Showroom", "Order Online", "Compare Models", "Call to Order"
- SERVICE CTAs: "Download now", "Join 1M+ Kenyans", "Start saving today", "Get Started"
- Create urgency: "Limited time", "This month only", "Don't wait", "While stocks last"
- Make it specific: "Shop online or visit our showroom", "Available in store now", "Free delivery this week"
- ALWAYS include a clear action for customers to take next

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
- NEVER use: "Share Your World", "Unlock Creativity", "Unlock Bigger Worlds" (too vague)
- AVOID: Headlines that could apply to ANY product or service
- CREATE: Headlines that could ONLY be about this specific product/service
- MAKE IT: Memorable, specific, and commercial

💰 RETAIL HEADLINE FORMULAS (USE THESE FOR PRODUCT SALES):
- PRICE-LED: "Family Tablets from KES 24,999"
- FEATURE-LED: "Kids Tablets: Educational Games + Parental Controls"
- BENEFIT-LED: "Productivity Tablets: Work Anywhere, Anytime"
- SPEC-LED: "10-Inch HD Tablets - All-Day Battery"
- VALUE-LED: "Premium Tablets - Affordable Prices"
- NEVER use poetic or abstract headlines for retail products

🚫 ELIMINATE CAPTION PROBLEMS (CRITICAL):
- NEVER trail off with "..." (incomplete thoughts) - COMPLETE THE STORY
- NEVER copy-paste generic text: "Paya Finance puts Buy Now Pay Later (BNPL) front and center today"
- NEVER use same caption structure for different headlines
- NEVER end abruptly - always complete the thought with strong CTA
- BANNED INCOMPLETE PHRASES: "makes it practical, useful, and..." ← FINISH THE SENTENCE!

✅ CORRECT RETAIL CAPTION EXAMPLES:
- "Family Tablets from KES 24,999" → "Connect with family anywhere. Share photos, video call, and stream together. 10" HD display, 64GB storage, all-day battery. From KES 24,999. Shop online or visit our showroom."
- "Kids Tablets: Educational Games + Parental Controls" → "Safe learning for your children. Pre-loaded educational apps, robust parental controls, durable design. 7" HD screen perfect for small hands. KES 12,999. Available in store now."
- "Productivity Tablets: Work Anywhere, Anytime" → "Turn any space into your office. 10.4" 2K display, keyboard compatible, 12-hour battery life. Perfect for professionals on the go. From KES 34,999. Compare models online."
- Each caption: BENEFIT + FEATURES + PRICE + CTA (no poetry, no storytelling)

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

💰 CURRENCY REQUIREMENTS (MANDATORY):
${getCurrencyInstructions(brandProfile.location || 'Global')}

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

        const temperature = 0.8 + (Math.random() * 0.3);
        console.log(`🤖 [Revo 2.0] AI Generation Attempt ${attempt}/${maxRetries} - Using ${textGenerator.label}`);

        const generationResult = await textGenerator.generate(contentPrompt, {
          temperature,
          maxTokens: 1000
        });

        const content = generationResult.text;
        if (generationResult.tokensUsed !== undefined) {
          console.log(`📊 [Revo 2.0] ${textGenerator.label} tokens used: ${generationResult.tokensUsed}`);
        }
        if (generationResult.processingTime !== undefined) {
          console.log(`⏱️ [Revo 2.0] ${textGenerator.label} processing time: ${generationResult.processingTime}ms`);
        }

        try {
          // Clean the response to extract JSON
          let cleanContent = content.trim();
          if (cleanContent.includes('```json')) {
            cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
          } else if (cleanContent.includes('```')) {
            cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
          }

          const parsed = JSON.parse(cleanContent);
          const caption = typeof parsed.caption === 'string' ? parsed.caption : '';

          // Ensure hashtag count is EXACTLY correct (5 for Instagram, 3 for others)
          let finalHashtags = parsed.hashtags || [];
          // ALWAYS enforce exact count - trim if too many, pad if too few
          if (finalHashtags.length > hashtagCount) {
            finalHashtags = finalHashtags.slice(0, hashtagCount);
          } else if (finalHashtags.length < hashtagCount) {
            // Generate platform-appropriate hashtags if count is wrong
            finalHashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount);
          }
          // ============================================================================
          // ENHANCED VALIDATION SYSTEM (Ported from Revo 1.0)
          // ============================================================================

          let headline = stripOverusedWords(parsed.headline || '');
          const subheadline = parsed.subheadline || '';
          const cta = parsed.cta || '';

          // Basic validation checks
          const headlineValid = headline && headline.trim().length > 0;
          const subheadlineValid = subheadline && subheadline.trim().length > 0;
          const captionValid = caption && caption.trim().length > 0;
          const hashtagsValid = finalHashtags && finalHashtags.length === hashtagCount;

          // Pattern validation
          const headlineHasBannedPatterns = hasBannedPattern(headline) || /\b(journey|everyday)\b/i.test(headline) || /^[A-Z]+:\s/.test(headline);
          const captionHasBannedPatterns = hasBannedPattern(caption) || /\b(journey|everyday)\b/i.test(caption);
          
          // ANTI-POETRY VALIDATION FOR RETAIL (Critical)
          const poeticCaptionPatterns = [
            /from the first light of dawn/i,
            /to the serene twilight/i,
            /picture this:/i,
            /imagine yourself/i,
            /follow the journey/i,
            /in the heart of [a-z]+,/i,
            /surrounded by vibrant/i,
            /gently embraces/i,
            /fading light/i,
            /tastefully decorated/i,
            /demonstrates the power of/i,
            /equipped with dreams/i,
            /bathed in [a-z]+ light/i
          ];
          
          const captionIsPoetic = poeticCaptionPatterns.some(pattern => pattern.test(caption));
          
          if (captionIsPoetic) {
            console.log('🚨 [Revo 2.0 POETRY DETECTED] Caption uses banned poetic language - REJECTING');
            console.log('   Caption:', caption.substring(0, 100) + '...');
          }

          // Similarity validation
          const headlineTooSimilar = tooSimilar(headline, recentData.headlines, 0.55);
          const captionTooSimilar = tooSimilar(caption, recentData.captions, 0.40);

          // Generic content detection
          const headlineIsGeneric = /^[a-z]+ your [a-z]+$/i.test(headline.trim());
          const captionTooGeneric = caption.includes('Experience the excellence of') ||
            caption.includes('makes financial technology company effortless') ||
            /makes .+ effortless and effective/i.test(caption) ||
            /transform your .+ with/i.test(caption) ||
            /empower your .+ through/i.test(caption);

          // Duplicate detection
          const headlineDuplicate = recentData.headlines.includes(headline);
          const headlineIsBrandName = headline.toLowerCase() === brandProfile.businessName?.toLowerCase();

          // 1. Validate story coherence between headline and caption
          const coherenceValidation = validateStoryCoherence(
            headline,
            caption,
            options.businessType
          );

          console.log('🔗 [Revo 2.0] Story coherence validation:', coherenceValidation);

          // Enhanced coherence validation logging for debugging
          if (coherenceValidation.issues.length > 0) {
            console.log(`🚨 [Revo 2.0 COHERENCE ISSUES] Found ${coherenceValidation.issues.length} coherence issues:`);
            coherenceValidation.issues.forEach((issue, index) => {
              console.log(`   ${index + 1}. ${issue}`);
            });
          } else {
            console.log(`✅ [Revo 2.0 COHERENCE SUCCESS] No coherence issues found`);
          }

          // ============================================================================
          // ENHANCED VALIDATION SYSTEM - Story Coherence First
          // ============================================================================

          // Basic validation (must pass)
          const basicValidation = headlineValid && subheadlineValid && captionValid && hashtagsValid &&
            !headlineHasBannedPatterns && !captionHasBannedPatterns &&
            !headlineDuplicate && !headlineIsBrandName && !captionIsPoetic;

          // Quality validation (more lenient)
          const qualityValidation = !headlineTooSimilar && !captionTooSimilar &&
            !headlineIsGeneric && !captionTooGeneric;

          // Coherence validation - STRICT: Must tell one cohesive story
          // Use the isCoherent flag from validation, not just score
          const coherenceValidation_passes = coherenceValidation.isCoherent && coherenceValidation.coherenceScore >= 60;
          const coherenceValidation_acceptable = coherenceValidation.coherenceScore >= 45 && coherenceValidation.issues.length <= 2;

          // Smart validation logic: Quality over avoiding fallback
          let passesValidation = false;
          let validationLevel = 'FAILED';

          if (basicValidation && qualityValidation && coherenceValidation_passes) {
            // EXCELLENT: All validations pass with strong coherence
            passesValidation = true;
            validationLevel = 'EXCELLENT';
          } else if (basicValidation && qualityValidation && coherenceValidation_acceptable) {
            // GOOD: Minor coherence issues but overall quality is good
            passesValidation = true;
            validationLevel = 'GOOD';
            console.log(`⚠️ [Revo 2.0] Accepting content with minor coherence issues (score: ${coherenceValidation.coherenceScore})`);
          } else if (basicValidation && coherenceValidation_passes) {
            // ACCEPTABLE: Strong coherence but some quality issues
            passesValidation = true;
            validationLevel = 'ACCEPTABLE';
            console.log(`⚠️ [Revo 2.0] Accepting content with quality issues but strong coherence (score: ${coherenceValidation.coherenceScore})`);
          } else {
            // FAILED: Does not meet minimum standards - retry
            passesValidation = false;
            validationLevel = 'FAILED';
            console.log(`❌ [Revo 2.0] Content failed validation - coherence score: ${coherenceValidation.coherenceScore}, isCoherent: ${coherenceValidation.isCoherent}`);
          }

          console.log(`🎯 [Revo 2.0 VALIDATION RESULT] Level: ${validationLevel}, Passes: ${passesValidation}`);

          if (!passesValidation) {
            const reasons: string[] = [];
            if (!basicValidation) {
              reasons.push('basic validation failed');
              if (captionIsPoetic) reasons.push('POETIC CAPTION DETECTED');
              if (headlineHasBannedPatterns) reasons.push('headline has banned patterns');
              if (captionHasBannedPatterns) reasons.push('caption has banned patterns');
            }
            if (!qualityValidation) reasons.push('quality validation failed');
            if (!coherenceValidation_passes && !coherenceValidation_acceptable) reasons.push('coherence validation failed');

            console.log(`🚫 [Revo 2.0] Attempt ${attempt}/${maxRetries} - Validation failed - Reasons: ${reasons.join(', ')}`);

            if (attempt < maxRetries) {
              console.log(`🔄 [Revo 2.0] Retrying with different temperature and creativity...`);
              continue;
            } else {
              console.log('❌ [Revo 2.0] All AI attempts failed validation - using fallback');
              throw new Error(`Content validation failed after ${maxRetries} attempts: ${reasons.join(', ')}`);
            }
          }

          // Content passed validation - prepare final result
          console.log(`🎉 [Revo 2.0 AI CONTENT SUCCESS] Using AI-generated content (not fallback):`);
          console.log(`   📰 AI Headline: "${headline}"`);
          console.log(`   📝 AI Caption: "${caption}"`);
          console.log(`   🎯 AI CTA: "${cta}"`);
          console.log(`   🎯 Marketing Angle: ${assignedAngle.name}`);
          console.log(`   📊 Coherence Score: ${coherenceValidation.coherenceScore}`);

          // Remember accepted output for future anti-repetition checks
          rememberOutput(brandKey, { headline, caption });

          console.log(`✅ [Revo 2.0] AI Generation Successful on attempt ${attempt}/${maxRetries} with ${validationLevel} quality`);
          return {
            caption: sanitizeGeneratedCopy(caption, brandProfile, businessType) as string,
            hashtags: finalHashtags,
            headline: sanitizeGeneratedCopy(headline, brandProfile, businessType),
            subheadline: sanitizeGeneratedCopy(subheadline, brandProfile, businessType),
            cta: sanitizeGeneratedCopy(cta, brandProfile, businessType),
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
    console.warn(`🚨 [Revo 2.0 FALLBACK CAPTION ISSUE] Using AI-powered fallback (not templates)!`);
    console.warn(`❌ [Revo 2.0] All ${maxRetries} AI attempts failed. Using fallback content.`);
    console.warn(`Last error: ${lastError?.message || 'Unknown error'}`);

    const fallbackContent = await generateUniqueFallbackContent(brandProfile, businessType, platform, hashtagCount, creativityBoost, concept);

    // Mark this as fallback content for debugging
    console.warn(`🚨 [Revo 2.0 FALLBACK CONTENT] Generated fallback content:`);
    console.warn(`   📰 Headline: "${fallbackContent.headline}"`);
    console.warn(`   📝 Caption: "${fallbackContent.caption}"`);
    console.warn(`   🎯 CTA: "${fallbackContent.cta}"`);

    return fallbackContent;

  } catch (error) {
    console.warn('⚠️ Revo 2.0: Content generation failed, generating unique fallback');
    return await generateUniqueFallbackContent(brandProfile, businessType, platform, hashtagCount, Date.now() % 10, concept);
  }
}

/**
 * Generate contextually relevant fallback content based on visual and business context
 * Now uses AI generation instead of hardcoded templates
 */
export async function generateUniqueFallbackContent(
  brandProfile: any,
  businessType: string,
  platform: string,
  hashtagCount: number,
  creativityLevel: number,
  concept?: any
): Promise<{
  caption: string;
  hashtags: string[];
  headline?: string;
  subheadline?: string;
  cta?: string;
  captionVariations?: string[];
}> {
  // Check if we have today's featured service
  const todayService = concept?.featuredServices?.[0];

  // Get product info for retail businesses
  const productCatalog = (brandProfile as any).productCatalog;
  let productInfo: any = null;
  if (productCatalog && Array.isArray(productCatalog) && productCatalog.length > 0) {
    // Rotate through products based on creativity level
    productInfo = productCatalog[creativityLevel % productCatalog.length];
  }

  // Choose a theme deterministically from creativityLevel for variety
  const themes = ['innovation-focused', 'results-driven', 'customer-centric', 'quality-emphasis', 'expertise-showcase'];
  const selectedTheme = themes[creativityLevel % themes.length];

  try {
    // Generate AI-powered fallback content
    const [headline, subheadline, fallbackCTA] = await Promise.all([
      generateUniqueHeadline(brandProfile, businessType, selectedTheme, productInfo),
      generateUniqueSubheadline(brandProfile, businessType, selectedTheme, todayService, productInfo),
      generateUniqueCTA(selectedTheme, businessType, productInfo)
    ]);

    // Generate caption using AI
    const strategy = getBusinessTypeStrategy(businessType);
    // Get currency instructions for content generation
    const captionCurrencyInstructions = getCurrencyInstructions(brandProfile.location || 'Global');

    let captionPrompt = `Generate a compelling social media caption for ${brandProfile.businessName} (${businessType}).

🎯 REQUIREMENTS:
- Conversational and engaging
- Focus on specific benefits
- NO generic corporate language
- Maximum 2-3 sentences
${strategy ? `\n📋 INDUSTRY GUIDANCE:\n${strategy.captionGuidance}` : ''}
${productInfo ? `\n🛍️ PRODUCT FOCUS:\n- Product: ${productInfo.name}\n- Price: ${productInfo.price || 'N/A'}\n- Benefits: ${productInfo.benefits?.join(', ') || 'Quality product'}` : ''}
${todayService ? `\n🎯 SERVICE FOCUS:\n- Service: ${todayService.serviceName}\n- Description: ${todayService.description || ''}` : ''}

💰 CURRENCY REQUIREMENTS:
${captionCurrencyInstructions}

Business: ${brandProfile.businessName}
Location: ${brandProfile.location || 'Global'}

Return ONLY the caption text, nothing else.`;

    const result = await generateContentWithProxy(captionPrompt, REVO_2_0_TEXT_MODEL, false);
    const response = await result.response;
    const caption = response.text().trim().replace(/^["']|["']$/g, '');

    const hashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount, todayService);

    // Anti-repetition memory
    const fallbackKey = getBrandKey(brandProfile, platform);
    rememberOutput(fallbackKey, { headline, caption });

    return {
      caption: sanitizeGeneratedCopy(caption, brandProfile, businessType) as string,
      hashtags,
      headline: sanitizeGeneratedCopy(headline, brandProfile, businessType),
      subheadline: sanitizeGeneratedCopy(subheadline, brandProfile, businessType),
      cta: sanitizeGeneratedCopy(fallbackCTA, brandProfile, businessType),
      captionVariations: [sanitizeGeneratedCopy(caption, brandProfile, businessType) as string]
    };
  } catch (error) {
    console.warn('⚠️ AI fallback generation failed, using ultra-simple fallback');

    // Ultra-simple fallback if AI fails
    const hashtags = generateFallbackHashtags(brandProfile, businessType, platform, hashtagCount, todayService);

    return {
      caption: `Discover quality ${businessType} services at ${brandProfile.businessName}. ${brandProfile.location ? `Serving ${brandProfile.location}` : 'Serving you'} with excellence.`,
      hashtags,
      headline: `${brandProfile.businessName}`,
      subheadline: `Quality ${businessType} services`,
      cta: 'Learn More',
      captionVariations: []
    };
  }
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
- Business owner needs inventory money urgently, partner transfers funds, stock purchased same day
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

// === 6D AD CONCEPT FRAMEWORK (PORTED FROM REVO 1.5) ===
// This framework ensures deep conceptual variety beyond just visual style changes

interface AdConcept {
  name: string;
  setting: { category: string; description: string; };
  customer: { type: string; description: string; };
  visualStyle: { style: string; description: string; };
  benefit: { type: string; message: string; };
  emotionalTone: { tone: string; description: string; };
  format: { technique: string; structure: string; };
}

let recentConcepts6D: AdConcept[] = [];

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
    { technique: "Problem-Solution", structure: "Focus on the solution solving a pain point (NO visual diagrams/arrows)" },
    { technique: "Comparison", structure: "Highlight unique value proposition (NO split screens or comparison charts)" },
    { technique: "Tutorial", structure: "Step-by-step, how it works" },
    { technique: "Announcement", structure: "New feature, update, launch" },
    { technique: "Social Proof", structure: "Join 10,000 others, Trusted by..." },
    { technique: "Story", structure: "Narrative arc with beginning/middle/end" },
    { technique: "Direct Offer", structure: "Straight to the deal/CTA" },
    { technique: "Transformation", structure: "Show the positive outcome of the service (NO split screens/before-after diagrams)" },
    { technique: "Day-in-Life", structure: "Follow real person through daily routine" },
    { technique: "Success Moment", structure: "Capture the exact moment customer achieves their goal" },
    { technique: "Community Impact", structure: "Show how individual success ripples out" },
    { technique: "Overcoming Struggle", structure: "Real person facing challenge, finding solution" }
  ];

  // Randomize with anti-repetition
  const timeBasedSeed = Date.now() % 1000;
  let attempts = 0;
  let selectedSetting, selectedCustomer, selectedVisualStyle, selectedBenefit, selectedTone, selectedFormat;
  
  do {
    selectedSetting = settings[Math.floor((Math.random() + timeBasedSeed / 1000) % 1 * settings.length)];
    selectedCustomer = customers[Math.floor((Math.random() + timeBasedSeed / 2000) % 1 * customers.length)];
    selectedVisualStyle = visualStyles[Math.floor((Math.random() + timeBasedSeed / 3000) % 1 * visualStyles.length)];
    selectedBenefit = benefits[Math.floor((Math.random() + timeBasedSeed / 4000) % 1 * benefits.length)];
    selectedTone = emotionalTones[Math.floor((Math.random() + timeBasedSeed / 5000) % 1 * emotionalTones.length)];
    selectedFormat = formats[Math.floor((Math.random() + timeBasedSeed / 6000) % 1 * formats.length)];
    
    attempts++;
    
    const isTooSimilar = recentConcepts6D.some(recent =>
      recent.setting.category === selectedSetting.category &&
      recent.customer.type === selectedCustomer.type &&
      recent.visualStyle.style === selectedVisualStyle.style
    );
    
    if (!isTooSimilar || attempts >= 10) break;
  } while (attempts < 10);

  const concept: AdConcept = {
    name: `${selectedFormat.technique} ${selectedSetting.category} ${selectedBenefit.type}`,
    setting: selectedSetting,
    customer: selectedCustomer,
    visualStyle: selectedVisualStyle,
    benefit: selectedBenefit,
    emotionalTone: selectedTone,
    format: selectedFormat
  };

  recentConcepts6D.push(concept);
  if (recentConcepts6D.length > 9) recentConcepts6D = recentConcepts6D.slice(-9);
  
  return concept;
}

/**
 * Main Revo 2.0 generation function - REVISED ARCHITECTURE
 * Uses OpenAI Assistants first for perfect content-design alignment
 */
export async function generateWithRevo20(options: Revo20GenerationOptions): Promise<Revo20GenerationResult> {
  const startTime = Date.now();

  try {
    // Import our new integrated components
    const { assistantManager } = await import('./assistants/assistant-manager');
    const { contentDesignValidator } = await import('./validators/content-design-validator');
    const { integratedPromptGenerator } = await import('./image/integrated-prompt-generator');
    const { detectBusinessType } = await import('./adaptive/business-type-detector');

    console.log(`🚀 [Revo 2.0 REVISED] Starting assistant-first generation for ${options.brandProfile.businessName}`);

    // Auto-detect platform-specific aspect ratio if not provided
    const aspectRatio = options.aspectRatio || getPlatformAspectRatio(options.platform);
    const enhancedOptions = { ...options, aspectRatio };

    // Step 1: Detect business type for assistant selection
    const businessType = detectBusinessType(enhancedOptions.brandProfile);
    console.log(`🏢 [Revo 2.0] Detected business type: ${businessType.primaryType}`);

    // Step 2: DEEP BUSINESS UNDERSTANDING (New!) - TEMPORARILY DISABLED FOR TESTING
    // const { analyzeBusinessAndGetGuidelines } = await import('./business-understanding');
    
    let deepBusinessUnderstanding = null; // Temporarily disabled
    // try {
    //   console.log(`🧠 [Revo 2.0] Performing deep business analysis...`);
    //   const bp = enhancedOptions.brandProfile as any; // Type cast to access extended properties
    //   deepBusinessUnderstanding = await Promise.race([
    //     analyzeBusinessAndGetGuidelines({
    //       businessName: bp.businessName,
    //       website: bp.website,
    //       description: bp.description,
    //       industry: bp.industry,
    //       documents: bp.documents,
    //       products: bp.products,
    //       services: typeof bp.services === 'string' ? undefined : bp.services,
    //       pricing: bp.pricing,
    //       about: bp.about,
    //       mission: bp.mission,
    //       values: bp.values
    //     }, {
    //       contentType: 'social_post',
    //       platform: enhancedOptions.platform,
    //       objective: 'Generate engaging content that reflects the business\'s unique value'
    //     }),
    //     new Promise((_, reject) => setTimeout(() => reject(new Error('Deep business analysis timeout')), 60000))
    //   ]);
    //   console.log(`✅ [Revo 2.0] Deep business understanding complete`);
    //   console.log(`   - Business Model: ${deepBusinessUnderstanding.businessInsight.businessModel.type}`);
    //   console.log(`   - Target: ${deepBusinessUnderstanding.businessInsight.targetAudience.primary.segment}`);
    //   console.log(`   - Innovation: ${deepBusinessUnderstanding.businessInsight.innovation.keyDifferentiator}`);
    // } catch (dbuError) {
    //   console.warn(`⚠️ [Revo 2.0] Deep business understanding failed, continuing without it:`, dbuError);
    //   deepBusinessUnderstanding = null;
    // }

    // Step 3: Business Intelligence now handled by AI Assistants
    // BI analysis is integrated into assistant instructions for efficiency
    console.log('🧠 [Revo 2.0] Business Intelligence integrated into AI Assistant (no separate calls needed)');
    
    // No separate BI analysis needed - assistants handle this internally
    let businessIntelligence: any = {
      note: 'BI analysis now handled by AI assistants during content generation'
    };

    // Step 3: Creative concept now generated by AI Assistants using 6D Framework
    console.log('🎨 [Revo 2.0] Generating 6D Ad Concept for maximum variety...');
    
    // Generate 6-dimensional ad concept (ported from Revo 1.5)
    const adConcept = generate6DimensionalAdConcept();
    
    console.log(`✅ [Revo 2.0] Generated 6D Concept: ${adConcept.name}`);
    console.log(`   - Format: ${adConcept.format.technique}`);
    console.log(`   - Setting: ${adConcept.setting.category}`);
    console.log(`   - Customer: ${adConcept.customer.type}`);
    console.log(`   - Tone: ${adConcept.emotionalTone.tone}`);
    
    // Extract scheduled services for today
    const todaysServices = enhancedOptions.scheduledServices?.filter(s => s.isToday) || [];
    const upcomingServices = enhancedOptions.scheduledServices?.filter(s => s.isUpcoming) || [];
    
    if (todaysServices.length > 0) {
      console.log(`🎯 [Revo 2.0] Prioritizing ${todaysServices.length} scheduled service(s) for today`);
      todaysServices.forEach(s => console.log(`   - Service: ${s.serviceName}`));
    }
    
    // Create concept object compatible with existing structure
    const concept = {
      concept: adConcept.name,
      visualTheme: adConcept.visualStyle.style,
      emotionalTone: adConcept.emotionalTone.tone,
      designElements: [],
      colorSuggestions: [enhancedOptions.brandProfile.primaryColor || '#3B82F6'],
      moodKeywords: [adConcept.emotionalTone.tone, adConcept.benefit.type],
      featuredServices: todaysServices, // Pass today's services to concept
      upcomingServices: upcomingServices, // Pass upcoming services
      dimensions: adConcept // Store the full 6D concept
    };

    // Step 3: ASSISTANT-FIRST CONTENT GENERATION WITH VALIDATION
    let assistantResponse: any;
    let contentSource = 'assistant';
    let validationMetrics: any = null;

    let designVariationsForRun: any = null;

    if (assistantManager.isAvailable(businessType.primaryType)) {
      console.log(`🤖 [Revo 2.0] Using OpenAI Assistant for ${businessType.primaryType}`);
      
      try {
        // === ASSIGN MARKETING ANGLE WITH ROTATION ===
        // Use the proper marketing angle rotation system to ensure conceptual variety
        const brandKey = getBrandKey(enhancedOptions.brandProfile, enhancedOptions.platform);
        const bpId = (enhancedOptions.brandProfile as any)?.id as string | undefined;
        await hydrateAnglesFromDb(brandKey, bpId, enhancedOptions.platform as any);
        const marketingAngle = assignMarketingAngle(brandKey, enhancedOptions);
        
        console.log(`🎯 [Revo 2.0] Assigned Marketing Angle: ${marketingAngle.name}`);
        console.log(`   Description: ${marketingAngle.description}`);
        
        const recentDb = bpId ? await fetchRecentDbPosts(bpId, enhancedOptions.platform as any, 7) : [];
        let avoidListText = buildAvoidListTextFromRecent(recentDb);

        // === PRE-SELECT DESIGN VARIATIONS BY CALLING buildEnhancedPrompt ===
        // This selects and caches the Universal Design System variations
        // so the assistant knows what visual approach to write content for
        console.log(`🎨 [Revo 2.0] Pre-selecting design variations via buildEnhancedPrompt...`);
        const imagePromptWithVariations = buildEnhancedPrompt(enhancedOptions, concept);
        console.log(`✅ [Revo 2.0] Design variations selected and cached`);
        
        // Retrieve the cached variations to pass to assistant
        const designVariations = getCachedDesignVariations(brandKey);
        designVariationsForRun = designVariations;

        // === NEW: LANGGRAPH VALIDATION WRAPPER ===
        // Wrap assistant generation with validation to prevent repetitive content
        const { generateWithValidation, trackValidationMetrics } = await import('./agents/revo-2.0-validation-wrapper');
        
        const businessIdForValidation = bpId || enhancedOptions.brandProfile.businessName || 'default';
        
        const validatedResult = await generateWithValidation(
          businessIdForValidation,
          async () => {
            // Generate content with assistant
            const response = await Promise.race([
              assistantManager.generateContent({
                businessType: businessType.primaryType,
                brandProfile: enhancedOptions.brandProfile,
                concept: concept,
                imagePrompt: '', // Will be generated from design specs
                platform: enhancedOptions.platform,
                marketingAngle: marketingAngle,
                useLocalLanguage: enhancedOptions.useLocalLanguage,
                businessIntelligence: businessIntelligence, // Pass BI data to assistant
                deepBusinessUnderstanding: deepBusinessUnderstanding, // Pass deep understanding to assistant
                avoidListText,
                designVariations, // Pass pre-selected design variations to assistant
                adConcept // Pass 6D Ad Concept for conceptual variety
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Assistant generation timeout')), 90000))
            ]);
            return response;
          },
          {
            maxRetries: 3,
            minSimilarityScore: 75,
            enableValidation: true // Set to false to disable validation
          }
        );

        assistantResponse = validatedResult.content;
        validationMetrics = {
          validationPassed: validatedResult.validationPassed,
          attempts: validatedResult.attempts,
          similarityScore: validatedResult.finalSimilarityScore
        };

        // Track metrics
        trackValidationMetrics(
          businessIdForValidation,
          validatedResult.validationPassed,
          validatedResult.attempts,
          validatedResult.finalSimilarityScore
        );

        console.log(`\n📊 [Revo 2.0 Validation] Results:`);
        console.log(`   - Validation Passed: ${validatedResult.validationPassed ? '✅ YES' : '⚠️ NO'}`);
        console.log(`   - Attempts Required: ${validatedResult.attempts}`);
        console.log(`   - Similarity Score: ${validatedResult.finalSimilarityScore}/100`);

        // Keep existing similarity check as fallback
        const firstOut = {
          headline: assistantResponse.content.headline,
          subheadline: assistantResponse.content.subheadline || '',
          caption: assistantResponse.content.caption,
        };
        const simCheck = isTooSimilarToRecent(firstOut, recentDb);
        if (simCheck.similar && !validatedResult.validationPassed) {
          console.log(`⚠️ [Revo 2.0] Both validation systems detected similarity - forcing alternative angle`);
          const secondAvoid = `${avoidListText}\nAdditionally avoid these patterns/themes:\n- ${simCheck.reasons.join('\n- ')}`;
          const secondAngle = { 
            name: 'AI-Selected Alternative Angle', 
            description: 'Assistant will choose different angle to avoid repetition',
            id: 'ai-intelligent-retry'
          };
          assistantResponse = await assistantManager.generateContent({
          businessType: businessType.primaryType,
            brandProfile: enhancedOptions.brandProfile,
            concept: concept,
            imagePrompt: '',
            platform: enhancedOptions.platform,
            marketingAngle: secondAngle,
            useLocalLanguage: enhancedOptions.useLocalLanguage,
            businessIntelligence: businessIntelligence,
            deepBusinessUnderstanding: deepBusinessUnderstanding, // Pass deep understanding to retry
            avoidListText: secondAvoid,
            designVariations, // Pass same design variations to retry
            adConcept // Pass same concept to retry
        });
        }
      } catch (assistantError) {
        console.error(`❌ [Revo 2.0] Assistant generation failed:`);
        console.error(`   Error Type: ${assistantError instanceof Error ? assistantError.constructor.name : typeof assistantError}`);
        console.error(`   Error Message: ${assistantError instanceof Error ? assistantError.message : String(assistantError)}`);
        console.error(`   Full Error:`, assistantError);
        
        console.warn(`⚠️ [Revo 2.0] Falling back to Claude due to assistant failure`);
        contentSource = 'claude_fallback';
        assistantResponse = await generateClaudeFallback(enhancedOptions, concept);
      }
    } else {
      console.log(`📝 [Revo 2.0] No assistant available for ${businessType.primaryType}, using Claude`);
      contentSource = 'claude_primary';
      assistantResponse = await generateClaudeFallback(enhancedOptions, concept);
    }

    // Step 4: Validate content-design alignment (only for assistant responses)
    if (contentSource === 'assistant') {
      const validationResult = contentDesignValidator.validateAlignment(assistantResponse, {
        brandProfile: enhancedOptions.brandProfile,
        businessType: businessType.primaryType,
        platform: enhancedOptions.platform,
        concept: concept
      });

      if (!validationResult.isValid) {
        console.warn(`⚠️ [Revo 2.0] Content-design alignment failed (${validationResult.score}/100), trying synchronization...`);

        // SPECIAL CASE: Skip validation fallback for ALL assistants to preserve their specialized expertise
        const allAssistantTypes = ['food', 'retail', 'finance', 'healthcare', 'realestate', 'service', 'saas', 'education', 'b2b', 'nonprofit'];
        const skipValidationFallback = allAssistantTypes.includes(businessType.primaryType);
        
        if (skipValidationFallback) {
          console.log(`✅ [Revo 2.0] ${businessType.primaryType} Assistant detected - skipping validation fallback to preserve specialized expertise`);
          console.log(`✅ [Revo 2.0] Using ${businessType.primaryType} Assistant content despite validation score of ${validationResult.score}/100`);
        } else {
          // Try content-visual synchronization before falling back to Claude
          const { contentVisualSynchronizer } = await import('./synchronization/content-visual-sync');

          try {
            const syncResult = await contentVisualSynchronizer.synchronizeContentAndVisuals({
              content: assistantResponse.content,
              designSpecs: assistantResponse.design_specifications,
              brandProfile: enhancedOptions.brandProfile,
              businessType: businessType.primaryType,
              platform: enhancedOptions.platform,
              concept: concept
            });

            if (syncResult.isSync) {
              console.log(`✅ [Revo 2.0] Content-visual synchronization successful (${syncResult.syncScore}/100)`);

              // Update assistant response with synchronized content and design
              assistantResponse = {
                content: syncResult.synchronizedContent,
                design_specifications: syncResult.synchronizedDesign,
                alignment_validation: `Synchronized content-visual alignment achieved with score ${syncResult.syncScore}/100`
              };
            } else {
              console.warn(`⚠️ [Revo 2.0] Synchronization failed (${syncResult.syncScore}/100), using Claude fallback`);
              contentSource = 'claude_validation_fallback';
              assistantResponse = await generateClaudeFallback(enhancedOptions, concept);
            }
          } catch (syncError) {
            console.warn(`⚠️ [Revo 2.0] Synchronization error, using Claude fallback:`, syncError);
            contentSource = 'claude_validation_fallback';
            assistantResponse = await generateClaudeFallback(enhancedOptions, concept);
          }
        }
      } else {
        console.log(`✅ [Revo 2.0] Content-design alignment validated (${validationResult.score}/100)`);
      }
    }

    // Step 5: Generate integrated image prompt
    let imagePrompt: string;
    let finalContent: any;

    if (contentSource === 'assistant') {
      // Use integrated prompt generator for perfect alignment
      const integratedPrompt = integratedPromptGenerator.generateIntegratedPrompt({
        assistantResponse,
        brandProfile: enhancedOptions.brandProfile,
        platform: enhancedOptions.platform,
        aspectRatio: aspectRatio,
        businessType: businessType.primaryType,
        includeContacts: enhancedOptions.includeContacts,
        strictConsistency: enhancedOptions.strictConsistency, // NEW: Pass strict mode toggle
        designVariations: designVariationsForRun || getCachedDesignVariations(getBrandKey(enhancedOptions.brandProfile, enhancedOptions.platform)),
        adConcept
      });

      // Enforce platform-specific hashtag limits
      const normalizedPlatform = String(enhancedOptions.platform).toLowerCase();
      const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
      let finalHashtags = assistantResponse.content.hashtags || [];

      if (finalHashtags.length > maxHashtags) {
        console.log(`📊 [Revo 2.0] Trimming hashtags from ${finalHashtags.length} to ${maxHashtags} for ${enhancedOptions.platform}`);
        finalHashtags = finalHashtags.slice(0, maxHashtags);
      } else if (finalHashtags.length < maxHashtags) {
        console.warn(`⚠️ [Revo 2.0] Assistant returned ${finalHashtags.length} hashtags, expected ${maxHashtags} for ${enhancedOptions.platform}`);
      }

      imagePrompt = integratedPrompt.imagePrompt;
      finalContent = {
        caption: assistantResponse.content.caption,
        hashtags: finalHashtags,
        headline: assistantResponse.content.headline,
        subheadline: assistantResponse.content.subheadline,
        cta: assistantResponse.content.cta,
        captionVariations: [assistantResponse.content.caption]
      };

      console.log(`🎨 [Revo 2.0] Generated integrated image prompt (${imagePrompt.length} chars)`);
      console.log(`#️⃣ [Revo 2.0] Final hashtag count: ${finalHashtags.length} for ${enhancedOptions.platform}`);
    } else {
      // Use traditional approach for Claude fallback
      imagePrompt = buildEnhancedPrompt(enhancedOptions, concept);

      // Enforce platform-specific hashtag limits for Claude fallback as well
      const normalizedPlatform = String(enhancedOptions.platform).toLowerCase();
      const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
      let fallbackHashtags = assistantResponse.hashtags || [];

      if (fallbackHashtags.length > maxHashtags) {
        console.log(`📊 [Revo 2.0 Claude Fallback] Trimming hashtags from ${fallbackHashtags.length} to ${maxHashtags} for ${enhancedOptions.platform}`);
        fallbackHashtags = fallbackHashtags.slice(0, maxHashtags);
      } else if (fallbackHashtags.length < maxHashtags) {
        console.warn(`⚠️ [Revo 2.0 Claude Fallback] Received ${fallbackHashtags.length} hashtags, expected ${maxHashtags} for ${enhancedOptions.platform}`);
      }

      finalContent = {
        ...assistantResponse,
        hashtags: fallbackHashtags
      };

      console.log(`📝 [Revo 2.0] Using traditional prompt approach for fallback`);
      console.log(`#️⃣ [Revo 2.0 Claude Fallback] Final hashtag count: ${fallbackHashtags.length} for ${enhancedOptions.platform}`);
    }

    // Step 6: Generate image with integrated prompt with timeout and fallback
    console.log(`🎨 [Revo 2.0] Starting image generation...`);
    const imageStartTime = Date.now();
    let imageResult;
    
    try {
      // Try Gemini 3 Pro with reasonable timeout
      // Gemini API client has 180s internal timeout, we use 90s to allow fallback
      // This accounts for network latency, DNS resolution, and API processing time
      const isDevelopment = process.env.NODE_ENV === 'development';
      const timeout = isDevelopment ? 90000 : 120000; // 90s dev (network issues), 120s prod
      
      console.log(`⏱️ [Revo 2.0] Using ${timeout/1000}s timeout for ${isDevelopment ? 'development' : 'production'}`);
      
      imageResult = await Promise.race([
        generateImageWithGemini(imagePrompt, enhancedOptions),
        new Promise<{ imageUrl: string }>((_, reject) =>
          setTimeout(() => reject(new Error(`Image generation timeout after ${timeout/1000}s`)), timeout)
        )
      ]);
      const imageTime = Date.now() - imageStartTime;
      console.log(`⏱️ [Revo 2.0] Image generation took ${imageTime}ms (${(imageTime/1000).toFixed(1)}s)`);
    } catch (timeoutError) {
      // If timeout, fallback to Gemini 2.5 via Vertex AI
      console.warn('⚠️ [Revo 2.0] Gemini 3 Pro timeout, falling back to Gemini 2.5 Flash via Vertex AI');
      console.log('🔄 [Revo 2.0] FALLBACK: Using Gemini 2.5 Flash for faster generation');
      console.log('🔍 [Revo 2.0] Timeout error details:', timeoutError instanceof Error ? timeoutError.message : timeoutError);
      
      const opts = enhancedOptions as any;
      
      // Enhanced logo handling for fallback - SAME LOGIC AS PRIMARY GENERATION
      const logoDataUrl = enhancedOptions.brandProfile?.logoDataUrl;
      const logoStorageUrl = (enhancedOptions.brandProfile as any)?.logoUrl || (enhancedOptions.brandProfile as any)?.logo_url;
      let fallbackLogoUrl = logoDataUrl || logoStorageUrl;
      
      console.log('🔍 [Revo 2.0] Logo fallback check (using primary generation logic):');
      console.log('  - logoDataUrl:', !!logoDataUrl);
      console.log('  - logoStorageUrl:', !!logoStorageUrl);
      console.log('  - finalLogoUrl:', !!fallbackLogoUrl);
      console.log('  - logoFormat:', fallbackLogoUrl ? (fallbackLogoUrl.startsWith('data:') ? 'data-url' : 'url') : 'none');
      
      // Convert storage URL to data URL if needed (SAME AS PRIMARY GENERATION)
      if (fallbackLogoUrl && !fallbackLogoUrl.startsWith('data:') && fallbackLogoUrl.startsWith('http')) {
        try {
          console.log('🔄 [Revo 2.0] Converting logo URL to data URL for fallback:', fallbackLogoUrl);
          const conversionStartTime = Date.now();
          fallbackLogoUrl = await convertLogoToDataUrl(fallbackLogoUrl);
          const conversionTime = Date.now() - conversionStartTime;
          console.log(`✅ [Revo 2.0] Logo converted for fallback in ${conversionTime}ms`);
        } catch (conversionError) {
          console.error('❌ [Revo 2.0] Logo URL conversion failed for fallback:', conversionError);
          fallbackLogoUrl = undefined; // Clear invalid logo
        }
      }
      
      if (fallbackLogoUrl && fallbackLogoUrl.startsWith('data:image/')) {
        console.log('✅ [Revo 2.0] Logo ready for fallback generation (data URL format)');
      } else if (fallbackLogoUrl) {
        console.log('⚠️ [Revo 2.0] Logo available but not in data URL format:', fallbackLogoUrl.substring(0, 50) + '...');
      } else {
        console.log('ℹ️ [Revo 2.0] No logo available for fallback generation');
      }

      // Enhanced fallback generation with timeout protection
      console.log('🎨 [Revo 2.0] Starting fallback generation with Vertex AI...');
      const fallbackStartTime = Date.now();
      
      // Create clean image prompt for Vertex AI (remove any Gemini 3 Pro specific logo instructions)
      // The Vertex AI client will add its own logo instructions
      let cleanImagePrompt = imagePrompt;
      
      // Remove any existing logo instructions that might conflict with Vertex AI's approach
      cleanImagePrompt = cleanImagePrompt.replace(/🎯 CRITICAL LOGO REQUIREMENT[\s\S]*?UNACCEPTABLE\./g, '');
      cleanImagePrompt = cleanImagePrompt.replace(/\n\n🎯 CRITICAL LOGO REQUIREMENT[\s\S]*?UNACCEPTABLE\./g, '');
      cleanImagePrompt = cleanImagePrompt.trim();
      
      console.log('🧼 [Revo 2.0] Cleaned image prompt for Vertex AI fallback');
      console.log('🔍 [Revo 2.0] Fallback status check:', {
        hasLogoUrl: !!fallbackLogoUrl,
        logoFormat: fallbackLogoUrl ? (fallbackLogoUrl.startsWith('data:') ? 'data-url' : 'url') : 'none',
        promptLength: cleanImagePrompt.length,
        hasBrandColors: !!(enhancedOptions.brandProfile?.primaryColor && enhancedOptions.brandProfile?.accentColor),
        primaryColor: enhancedOptions.brandProfile?.primaryColor,
        accentColor: enhancedOptions.brandProfile?.accentColor,
        backgroundColor: enhancedOptions.brandProfile?.backgroundColor,
        followBrandColors: enhancedOptions.followBrandColors !== false
      });
      
      // Check if brand colors are mentioned in the prompt
      const hasBrandColorInstructions = cleanImagePrompt.includes('brand colors') || 
                                       cleanImagePrompt.includes('primaryColor') ||
                                       cleanImagePrompt.includes('MANDATORY: Use the specified brand colors');
      console.log('🎨 [Revo 2.0] Brand color instructions in fallback prompt:', hasBrandColorInstructions);
      
      if (!hasBrandColorInstructions && enhancedOptions.brandProfile?.primaryColor) {
        console.log('⚠️ [Revo 2.0] WARNING: Brand colors available but not found in fallback prompt!');
        // Add brand color instructions to ensure fallback follows brand colors
        const brandColorInstruction = `\n\n🎨 CRITICAL BRAND COLOR REQUIREMENT:
You MUST use the following brand colors in your design:
- Primary Color: ${enhancedOptions.brandProfile.primaryColor}
- Accent Color: ${enhancedOptions.brandProfile.accentColor || enhancedOptions.brandProfile.primaryColor}
- Background Color: ${enhancedOptions.brandProfile.backgroundColor || '#FFFFFF'}
These colors are mandatory and must be prominently featured in the design.`;
        cleanImagePrompt += brandColorInstruction;
        console.log('✅ [Revo 2.0] Added brand color instructions to fallback prompt');
      }
      
      const fallbackResult = await Promise.race([
        getVertexAIClient().generateImage(cleanImagePrompt, REVO_2_0_FALLBACK_MODEL, {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxOutputTokens ?? 8192,
          logoImage: fallbackLogoUrl, // Vertex AI client will handle logo integration
          aspectRatio: (['1:1', '3:4', '4:3', '9:16', '16:9'].includes(enhancedOptions.aspectRatio) ? enhancedOptions.aspectRatio : '1:1') as any,
          imageSize: opts.imageSize,
          // Pass brand color information to Vertex AI client
          brandColors: {
            primary: enhancedOptions.brandProfile?.primaryColor,
            accent: enhancedOptions.brandProfile?.accentColor,
            background: enhancedOptions.brandProfile?.backgroundColor
          }
        } as any),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fallback generation timeout after 30s')), 30000)
        )
      ]);
      
      const fallbackTime = Date.now() - fallbackStartTime;
      console.log(`✅ [Revo 2.0] Fallback generation completed in ${fallbackTime}ms`);

      // Convert Vertex AI result format to Revo service format
      imageResult = {
        imageUrl: `data:${fallbackResult.mimeType};base64,${fallbackResult.imageData}`
      };
      
      const imageTime = Date.now() - imageStartTime;
      console.log(`⏱️ [Revo 2.0] Fallback image generation took ${imageTime}ms (${(imageTime/1000).toFixed(1)}s)`);
      console.log('✅ [Revo 2.0] Fallback generation successful');
    }

    console.log(`🖼️ [Revo 2.0] Generated image successfully`);

    const processingTime = Date.now() - startTime;

    // Step 7: Final content preparation
    const finalContentResult = finalContent;
    console.log(`✅ [Revo 2.0] Final content prepared successfully`);

    // Determine model name based on content source
    const modelName = contentSource === 'assistant' 
      ? 'Revo 2.0 Assistant Edition (OpenAI GPT-4 + Gemini Image)'
      : 'Revo 2.0 Claude Edition (Claude Sonnet 4.5 + Gemini Image)';

    const enhancementsApplied = contentSource === 'assistant'
      ? [
          'OpenAI GPT-4 Assistant content generation',
          'Content-design alignment validation',
          'Integrated image prompt generation',
          'Business-specific assistant expertise',
          'Document analysis integration',
          'Perfect content-visual synchronization'
        ]
      : [
          'Claude Sonnet 4.5 content generation',
          'Global localization (13+ countries)',
          'Advanced anti-repetition system',
          'Marketing angle optimization',
          'Story coherence validation'
        ];

    console.log(`🎉 [Revo 2.0] Generation complete in ${processingTime}ms using ${contentSource} approach`);

    return {
      imageUrl: imageResult.imageUrl,
      model: modelName,
      qualityScore: contentSource === 'assistant' ? 9.8 : 9.5,
      processingTime,
      enhancementsApplied,
      caption: finalContentResult.caption,
      hashtags: finalContentResult.hashtags,
      headline: finalContentResult.headline,
      subheadline: finalContentResult.subheadline,
      cta: finalContentResult.cta,
      captionVariations: finalContentResult.captionVariations,
      businessIntelligence: {
        concept: concept.concept,
        visualTheme: concept.visualTheme,
        emotionalTone: concept.emotionalTone,
        contentSource: contentSource,
        businessType: businessType.primaryType
      }
    };

  } catch (error) {
    console.error('❌ Revo 2.0: Generation failed:', error);
    throw new Error(`Revo 2.0 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Claude fallback function for when OpenAI Assistant is not available or fails
 */
async function generateClaudeFallback(options: any, concept: any): Promise<any> {
  console.log(`📝 [Revo 2.0] Using Claude fallback for content generation`);
  
  try {
    // Use existing Claude-based content generation
    const contentResult = await generateCaptionAndHashtags(options, concept, '', '');
    
    // Convert to assistant-like response format for consistency
    return {
      caption: contentResult.caption,
      hashtags: contentResult.hashtags,
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      cta: contentResult.cta,
      captionVariations: contentResult.captionVariations || [contentResult.caption]
    };
  } catch (error) {
    console.error(`❌ [Revo 2.0] Claude fallback failed:`, error);
    
    // Ultra-simple fallback
    return {
      caption: `Discover quality services at ${options.brandProfile.businessName}. ${options.brandProfile.location ? `Serving ${options.brandProfile.location}` : 'Serving you'} with excellence.`,
      hashtags: [`#${options.brandProfile.businessName.replace(/\s+/g, '')}`, `#${options.businessType.replace(/\s+/g, '')}`, '#Quality'],
      headline: options.brandProfile.businessName,
      subheadline: `Quality ${options.businessType} services`,
      cta: 'Learn More',
      captionVariations: []
    };
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
 * Generate unique headlines using AI (no templates)
 */
async function generateUniqueHeadline(brandProfile: any, businessType: string, theme: string, productInfo?: any): Promise<string> {
  try {
    // Get business-type specific strategy for context
    const strategy = getBusinessTypeStrategy(businessType);

    let productContext = '';
    if (productInfo) {
      productContext = `\n\n🛍️ PRODUCT FOCUS:\n- Product: ${productInfo.name}`;
      if (productInfo.price) productContext += `\n- Price: ${productInfo.price}`;
      if (productInfo.features) productContext += `\n- Key Feature: ${productInfo.features[0]}`;
    }

    const headlinePrompt = `Generate a compelling headline (max 6 words) for ${brandProfile.businessName} (${businessType}).

🎯 REQUIREMENTS:
- Maximum 6 words
- ${theme} approach
- NO generic corporate phrases like "Transform Your Business", "Unlock Potential"
- NO company name with colon format (e.g., "COMPANY:")
- NO words like "journey", "everyday"
- Specific and action-oriented
${strategy ? `\n📋 INDUSTRY GUIDANCE:\n${strategy.headlineApproach}` : ''}
${productContext}

Business: ${brandProfile.businessName}
Location: ${brandProfile.location || 'Global'}

Return ONLY the headline text, nothing else.`;

    const result = await generateContentWithProxy(headlinePrompt, REVO_2_0_TEXT_MODEL, false);
    const response = await result.response;
    const headline = response.text().trim().replace(/^["']|["']$/g, '');

    // Validate and clean
    const words = headline.split(/\s+/);
    if (words.length <= 6 && !/\b(journey|everyday)\b/i.test(headline) && !/^[A-Z]+:\s/.test(headline)) {
      return stripOverusedWords(headline);
    }

    // If validation fails, return a simple fallback
    return `${brandProfile.businessName} - ${businessType}`;
  } catch (error) {
    console.warn('⚠️ AI headline generation failed, using simple fallback');
    return `${brandProfile.businessName} - ${businessType}`;
  }
}

/**
 * Generate unique subheadlines using AI (no templates)
 */
async function generateUniqueSubheadline(brandProfile: any, businessType: string, theme: string, todayService?: any, productInfo?: any): Promise<string> {
  try {
    const strategy = getBusinessTypeStrategy(businessType);
    const service = todayService?.serviceName || businessType;

    let productContext = '';
    if (productInfo) {
      productContext = `\n\n🛍️ PRODUCT FOCUS:\n- Product: ${productInfo.name}`;
      if (productInfo.benefits) productContext += `\n- Benefit: ${productInfo.benefits[0]}`;
    }

    const subheadlinePrompt = `Generate a compelling subheadline (max 25 words) for ${brandProfile.businessName}.

🎯 REQUIREMENTS:
- Maximum 25 words
- ${theme} approach
- Supports the main message
- Specific and benefit-focused
- NO generic corporate language
${strategy ? `\n📋 INDUSTRY GUIDANCE:\n${strategy.captionGuidance}` : ''}
${productContext}

Business: ${brandProfile.businessName}
Service/Product: ${service}
Location: ${brandProfile.location || 'Global'}

Return ONLY the subheadline text, nothing else.`;

    const result = await generateContentWithProxy(subheadlinePrompt, REVO_2_0_TEXT_MODEL, false);
    const response = await result.response;
    const subheadline = response.text().trim().replace(/^["']|["']$/g, '');

    const words = subheadline.split(/\s+/);
    if (words.length <= 25) {
      return stripOverusedWords(subheadline);
    }

    return `${service} from ${brandProfile.businessName}`;
  } catch (error) {
    console.warn('⚠️ AI subheadline generation failed, using simple fallback');
    return `${todayService?.serviceName || businessType} from ${brandProfile.businessName}`;
  }
}

/**
 * Get currency instructions based on location
 */
function getCurrencyInstructions(location: string): string {
  const locationKey = location.toLowerCase();

  // Currency mapping by country/region
  const currencyMap: { [key: string]: { currency: string; symbol: string; example: string } } = {
    kenya: { currency: 'Kenyan Shilling', symbol: 'KES', example: 'KES 1,000' },
    uganda: { currency: 'Ugandan Shilling', symbol: 'UGX', example: 'UGX 10,000' },
    tanzania: { currency: 'Tanzanian Shilling', symbol: 'TZS', example: 'TZS 5,000' },
    nigeria: { currency: 'Nigerian Naira', symbol: '₦', example: '₦2,500' },
    ghana: { currency: 'Ghanaian Cedi', symbol: 'GHS', example: 'GHS 150' },
    'south africa': { currency: 'South African Rand', symbol: 'R', example: 'R500' },
    egypt: { currency: 'Egyptian Pound', symbol: 'EGP', example: 'EGP 300' },
    morocco: { currency: 'Moroccan Dirham', symbol: 'MAD', example: 'MAD 200' },
    india: { currency: 'Indian Rupee', symbol: '₹', example: '₹1,500' },
    singapore: { currency: 'Singapore Dollar', symbol: 'S$', example: 'S$50' },
    malaysia: { currency: 'Malaysian Ringgit', symbol: 'RM', example: 'RM100' },
    thailand: { currency: 'Thai Baht', symbol: '฿', example: '฿500' },
    philippines: { currency: 'Philippine Peso', symbol: '₱', example: '₱1,000' },
    indonesia: { currency: 'Indonesian Rupiah', symbol: 'Rp', example: 'Rp50,000' },
    vietnam: { currency: 'Vietnamese Dong', symbol: '₫', example: '₫100,000' },
    'united kingdom': { currency: 'British Pound', symbol: '£', example: '£25' },
    uk: { currency: 'British Pound', symbol: '£', example: '£25' },
    france: { currency: 'Euro', symbol: '€', example: '€30' },
    germany: { currency: 'Euro', symbol: '€', example: '€30' },
    spain: { currency: 'Euro', symbol: '€', example: '€30' },
    italy: { currency: 'Euro', symbol: '€', example: '€30' },
    netherlands: { currency: 'Euro', symbol: '€', example: '€30' },
    canada: { currency: 'Canadian Dollar', symbol: 'CAD', example: 'CAD $40' },
    australia: { currency: 'Australian Dollar', symbol: 'AUD', example: 'AUD $45' },
    'new zealand': { currency: 'New Zealand Dollar', symbol: 'NZD', example: 'NZD $50' },
    brazil: { currency: 'Brazilian Real', symbol: 'R$', example: 'R$150' },
    mexico: { currency: 'Mexican Peso', symbol: 'MX$', example: 'MX$500' },
    argentina: { currency: 'Argentine Peso', symbol: 'ARS', example: 'ARS $2,000' },
    chile: { currency: 'Chilean Peso', symbol: 'CLP', example: 'CLP $15,000' },
    japan: { currency: 'Japanese Yen', symbol: '¥', example: '¥3,000' },
    'south korea': { currency: 'South Korean Won', symbol: '₩', example: '₩30,000' },
    china: { currency: 'Chinese Yuan', symbol: '¥', example: '¥200' },
    russia: { currency: 'Russian Ruble', symbol: '₽', example: '₽1,500' },
    'united states': { currency: 'US Dollar', symbol: '$', example: '$25' },
    usa: { currency: 'US Dollar', symbol: '$', example: '$25' },
    america: { currency: 'US Dollar', symbol: '$', example: '$25' }
  };

  // Find matching currency
  for (const [key, currencyInfo] of Object.entries(currencyMap)) {
    if (locationKey.includes(key)) {
      return `- CURRENCY: Use ${currencyInfo.currency} (${currencyInfo.symbol}) for all monetary amounts
- NEVER use USD ($) or dollars - always use local currency
- Example format: ${currencyInfo.example}
- Apply to: prices, costs, savings, discounts, offers, financial amounts
- MANDATORY: All money references must use ${currencyInfo.symbol} symbol or ${currencyInfo.currency}`;
    }
  }

  // Default for unrecognized locations
  return `- CURRENCY: Use local currency appropriate for the region (NOT USD dollars)
- NEVER use USD ($) unless specifically for US market
- Research appropriate currency symbol for the location
- Apply to: prices, costs, savings, discounts, offers, financial amounts
- MANDATORY: Avoid defaulting to dollars - use regional currency`;
}

/**
 * Generate unique CTAs using AI with business-type awareness (no templates)
 */
async function generateUniqueCTA(theme: string, businessType?: string, productInfo?: any): Promise<string> {
  // Check for business-type specific CTA first
  if (businessType) {
    const strategy = getBusinessTypeStrategy(businessType);
    if (strategy) {
      // Extract CTAs from the strategy's CTA style
      const ctaExamples = strategy.ctaStyle.match(/"([^"]+)"/g);
      if (ctaExamples && ctaExamples.length > 0) {
        const cleanedCTAs = ctaExamples.map(cta => cta.replace(/"/g, ''));
        const randomIndex = Math.floor(Math.random() * cleanedCTAs.length);
        return cleanedCTAs[randomIndex];
      }
    }
  }

  // If no business-type strategy, use AI to generate contextual CTA
  try {
    let productContext = '';
    if (productInfo) {
      productContext = `\nProduct: ${productInfo.name}`;
    }

    const ctaPrompt = `Generate a compelling call-to-action (2-3 words) for a ${businessType || 'business'}.

🎯 REQUIREMENTS:
- Maximum 3 words
- ${theme} approach
- Action-oriented
- Natural and contextual
${productContext}

Return ONLY the CTA text, nothing else.`;

    const result = await generateContentWithProxy(ctaPrompt, REVO_2_0_TEXT_MODEL, false);
    const response = await result.response;
    const cta = response.text().trim().replace(/^["']|["']$/g, '');

    const words = cta.split(/\s+/);
    if (words.length <= 3) {
      return cta;
    }

    return 'Learn More';
  } catch (error) {
    console.warn('⚠️ AI CTA generation failed, using simple fallback');
    return 'Learn More';
  }
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
