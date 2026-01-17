/**
 * Brand Voice Injection
 * Injects brand-specific vocabulary and tone into content
 * Part of Layer 4: Humanization Layer
 */

import { createClient } from '@supabase/supabase-js';

export interface BrandVoice {
  id?: string;
  brandProfileId: string;
  vocabulary: BrandVocabulary;
  toneAttributes: ToneAttribute[];
  avoidWords: string[];
  preferredPhrases: string[];
  emojiStyle: 'none' | 'minimal' | 'moderate' | 'heavy';
  formality: 'casual' | 'balanced' | 'formal';
}

export interface BrandVocabulary {
  productTerms: Record<string, string>; // generic -> brand-specific
  actionVerbs: string[];
  descriptors: string[];
  taglines: string[];
}

export interface ToneAttribute {
  attribute: string;
  intensity: number; // 0-1
}

// Industry-specific vocabulary templates
const INDUSTRY_VOCABULARY: Record<string, BrandVocabulary> = {
  finance: {
    productTerms: {
      'money': 'funds',
      'send': 'transfer',
      'app': 'platform',
      'account': 'wallet',
      'payment': 'transaction',
    },
    actionVerbs: ['transfer', 'save', 'invest', 'grow', 'secure', 'manage', 'track'],
    descriptors: ['secure', 'instant', 'seamless', 'trusted', 'reliable', 'smart'],
    taglines: ['Banking made simple', 'Your money, your way', 'Financial freedom starts here'],
  },
  retail: {
    productTerms: {
      'buy': 'shop',
      'stuff': 'collection',
      'cheap': 'affordable',
      'expensive': 'premium',
    },
    actionVerbs: ['discover', 'explore', 'shop', 'find', 'get', 'grab', 'snag'],
    descriptors: ['exclusive', 'curated', 'handpicked', 'trending', 'must-have', 'limited'],
    taglines: ['Style that speaks', 'Discover your look', 'Shop the difference'],
  },
  food: {
    productTerms: {
      'food': 'cuisine',
      'eat': 'savor',
      'tasty': 'delicious',
      'cook': 'craft',
    },
    actionVerbs: ['savor', 'taste', 'enjoy', 'indulge', 'discover', 'experience'],
    descriptors: ['fresh', 'homemade', 'artisan', 'locally-sourced', 'authentic', 'crafted'],
    taglines: ['Taste the difference', 'Made with love', 'Fresh from our kitchen'],
  },
  healthcare: {
    productTerms: {
      'doctor': 'specialist',
      'sick': 'unwell',
      'medicine': 'treatment',
      'hospital': 'facility',
    },
    actionVerbs: ['heal', 'care', 'support', 'treat', 'prevent', 'protect'],
    descriptors: ['caring', 'professional', 'trusted', 'experienced', 'compassionate', 'expert'],
    taglines: ['Your health, our priority', 'Care you can trust', 'Healing with heart'],
  },
  service: {
    productTerms: {
      'help': 'assist',
      'fix': 'resolve',
      'problem': 'challenge',
      'work': 'service',
    },
    actionVerbs: ['deliver', 'provide', 'ensure', 'guarantee', 'exceed', 'transform'],
    descriptors: ['professional', 'reliable', 'expert', 'dedicated', 'quality', 'premium'],
    taglines: ['Excellence delivered', 'Service you deserve', 'Quality guaranteed'],
  },
};

// Tone attribute definitions
const TONE_DEFINITIONS: Record<string, {
  words: string[];
  phrases: string[];
}> = {
  friendly: {
    words: ['hey', 'awesome', 'love', 'amazing', 'great', 'wonderful'],
    phrases: ['We\'re here for you', 'Let\'s do this together', 'You\'ve got this'],
  },
  professional: {
    words: ['ensure', 'provide', 'deliver', 'maintain', 'achieve', 'implement'],
    phrases: ['We are committed to', 'Our team ensures', 'We deliver excellence'],
  },
  playful: {
    words: ['fun', 'exciting', 'cool', 'awesome', 'wow', 'yay'],
    phrases: ['Ready to have some fun?', 'Let\'s shake things up', 'Get ready for'],
  },
  trustworthy: {
    words: ['reliable', 'secure', 'trusted', 'proven', 'guaranteed', 'certified'],
    phrases: ['You can count on us', 'Trusted by thousands', 'Your security is our priority'],
  },
  innovative: {
    words: ['new', 'cutting-edge', 'revolutionary', 'modern', 'smart', 'advanced'],
    phrases: ['The future is here', 'Redefining the way', 'Next-generation'],
  },
  caring: {
    words: ['support', 'help', 'care', 'understand', 'listen', 'comfort'],
    phrases: ['We understand', 'We\'re with you', 'Your wellbeing matters'],
  },
};

/**
 * Get default brand voice for an industry
 */
export function getDefaultBrandVoice(industry: string): Partial<BrandVoice> {
  const vocabulary = INDUSTRY_VOCABULARY[industry] || INDUSTRY_VOCABULARY.service;

  return {
    vocabulary,
    toneAttributes: [
      { attribute: 'professional', intensity: 0.7 },
      { attribute: 'friendly', intensity: 0.5 },
    ],
    avoidWords: ['cheap', 'basic', 'simple', 'just', 'only'],
    preferredPhrases: vocabulary.taglines,
    emojiStyle: 'minimal',
    formality: 'balanced',
  };
}

/**
 * Inject brand voice into content
 */
export function injectBrandVoice(
  content: string,
  brandVoice: BrandVoice
): { result: string; changesApplied: string[] } {
  let result = content;
  const changesApplied: string[] = [];

  // Replace generic terms with brand-specific vocabulary
  for (const [generic, brandSpecific] of Object.entries(brandVoice.vocabulary.productTerms)) {
    const regex = new RegExp(`\\b${generic}\\b`, 'gi');
    const before = result;
    result = result.replace(regex, brandSpecific);
    if (before !== result) {
      changesApplied.push(`Replaced "${generic}" with "${brandSpecific}"`);
    }
  }

  // Remove avoided words
  for (const word of brandVoice.avoidWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const before = result;
    result = result.replace(regex, '');
    if (before !== result) {
      changesApplied.push(`Removed avoided word "${word}"`);
    }
  }

  // Clean up double spaces from removals
  result = result.replace(/\s{2,}/g, ' ').trim();

  // Adjust emoji usage based on style
  result = adjustEmojiUsage(result, brandVoice.emojiStyle);

  // Adjust formality
  result = adjustFormality(result, brandVoice.formality);

  return { result, changesApplied };
}

/**
 * Adjust emoji usage in content
 */
function adjustEmojiUsage(content: string, style: BrandVoice['emojiStyle']): string {
  // Regex to match emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = content.match(emojiRegex) || [];

  switch (style) {
    case 'none':
      // Remove all emojis
      return content.replace(emojiRegex, '').replace(/\s{2,}/g, ' ').trim();

    case 'minimal':
      // Keep only first emoji
      if (emojis.length > 1) {
        let count = 0;
        return content.replace(emojiRegex, (match) => {
          count++;
          return count === 1 ? match : '';
        }).replace(/\s{2,}/g, ' ').trim();
      }
      return content;

    case 'moderate':
      // Keep up to 3 emojis
      if (emojis.length > 3) {
        let count = 0;
        return content.replace(emojiRegex, (match) => {
          count++;
          return count <= 3 ? match : '';
        }).replace(/\s{2,}/g, ' ').trim();
      }
      return content;

    case 'heavy':
      // Keep all emojis
      return content;

    default:
      return content;
  }
}

/**
 * Adjust formality level of content
 */
function adjustFormality(content: string, formality: BrandVoice['formality']): string {
  let result = content;

  switch (formality) {
    case 'casual':
      // Add contractions, use simpler words
      result = result
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bwill not\b/gi, "won't")
        .replace(/\bcannot\b/gi, "can't")
        .replace(/\bit is\b/gi, "it's")
        .replace(/\bwe are\b/gi, "we're")
        .replace(/\byou are\b/gi, "you're")
        .replace(/\bpurchase\b/gi, 'buy')
        .replace(/\butilize\b/gi, 'use')
        .replace(/\bassist\b/gi, 'help');
      break;

    case 'formal':
      // Expand contractions, use formal words
      result = result
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bit's\b/gi, 'it is')
        .replace(/\bwe're\b/gi, 'we are')
        .replace(/\byou're\b/gi, 'you are')
        .replace(/\bbuy\b/gi, 'purchase')
        .replace(/\bget\b/gi, 'obtain')
        .replace(/\bhelp\b/gi, 'assist');
      break;

    case 'balanced':
    default:
      // Keep as is
      break;
  }

  return result;
}

/**
 * Get brand voice from database
 */
export async function getBrandVoice(brandProfileId: string): Promise<BrandVoice | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('brand_voice')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    brandProfileId: data.brand_profile_id,
    vocabulary: data.vocabulary || {},
    toneAttributes: data.tone_attributes || [],
    avoidWords: data.avoid_words || [],
    preferredPhrases: data.preferred_phrases || [],
    emojiStyle: data.emoji_style || 'minimal',
    formality: data.formality || 'balanced',
  };
}

/**
 * Save brand voice to database
 */
export async function saveBrandVoice(brandVoice: BrandVoice): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from('brand_voice').upsert({
    brand_profile_id: brandVoice.brandProfileId,
    vocabulary: brandVoice.vocabulary,
    tone_attributes: brandVoice.toneAttributes,
    avoid_words: brandVoice.avoidWords,
    preferred_phrases: brandVoice.preferredPhrases,
    emoji_style: brandVoice.emojiStyle,
    formality: brandVoice.formality,
  }, {
    onConflict: 'brand_profile_id',
  });
}

/**
 * Analyze content for brand voice consistency
 */
export function analyzeBrandVoiceConsistency(
  content: string,
  brandVoice: BrandVoice
): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 1.0;

  // Check for avoided words
  for (const word of brandVoice.avoidWords) {
    if (content.toLowerCase().includes(word.toLowerCase())) {
      issues.push(`Contains avoided word: "${word}"`);
      score -= 0.1;
    }
  }

  // Check for brand vocabulary usage
  let vocabUsed = 0;
  for (const term of Object.values(brandVoice.vocabulary.productTerms)) {
    if (content.toLowerCase().includes(term.toLowerCase())) {
      vocabUsed++;
    }
  }
  if (vocabUsed === 0 && Object.keys(brandVoice.vocabulary.productTerms).length > 0) {
    suggestions.push('Consider using brand-specific vocabulary');
    score -= 0.1;
  }

  // Check emoji consistency
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (brandVoice.emojiStyle === 'none' && emojiCount > 0) {
    issues.push('Contains emojis but brand style is "none"');
    score -= 0.1;
  }
  if (brandVoice.emojiStyle === 'heavy' && emojiCount === 0) {
    suggestions.push('Consider adding emojis for brand consistency');
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

/**
 * Format brand voice for AI assistant
 */
export function formatBrandVoiceForAssistant(brandVoice: BrandVoice): string {
  return `
🎨 BRAND VOICE GUIDELINES:

📝 VOCABULARY:
• Action verbs: ${brandVoice.vocabulary.actionVerbs.join(', ')}
• Descriptors: ${brandVoice.vocabulary.descriptors.join(', ')}
• Preferred phrases: ${brandVoice.preferredPhrases.slice(0, 3).join(', ')}

🚫 AVOID:
${brandVoice.avoidWords.map(w => `• "${w}"`).join('\n')}

🎭 TONE:
${brandVoice.toneAttributes.map(t => `• ${t.attribute}: ${Math.round(t.intensity * 100)}%`).join('\n')}

📱 STYLE:
• Emoji usage: ${brandVoice.emojiStyle}
• Formality: ${brandVoice.formality}
`;
}

export default {
  getDefaultBrandVoice,
  injectBrandVoice,
  getBrandVoice,
  saveBrandVoice,
  analyzeBrandVoiceConsistency,
  formatBrandVoiceForAssistant,
};
