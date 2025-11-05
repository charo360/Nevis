/**
 * Universal Marketing Rules
 * 
 * Core rules that apply to ALL business types regardless of industry
 * These are non-negotiable requirements for quality content
 */

export interface UniversalRule {
  id: string;
  name: string;
  description: string;
  validationFunction: (content: any) => boolean;
  errorMessage: string;
}

/**
 * Universal Marketing Rules - Apply to ALL business types
 */
export const UNIVERSAL_RULES: UniversalRule[] = [
  {
    id: 'headline_visual_caption_match',
    name: 'Headline-Visual-Caption Coherence',
    description: 'Headline must match visual and caption - all elements tell ONE unified story',
    validationFunction: (content) => {
      // This is validated by the story coherence system
      return content.coherenceScore >= 70;
    },
    errorMessage: 'Headline, visual, and caption do not tell a unified story'
  },
  
  {
    id: 'angle_diversity',
    name: 'Marketing Angle Diversity',
    description: 'Each ad in campaign must use a different marketing angle',
    validationFunction: (content) => {
      // This is validated by the angle tracking system
      return content.marketingAngle !== undefined;
    },
    errorMessage: 'Marketing angle not assigned or repeated'
  },
  
  {
    id: 'no_generic_jargon',
    name: 'No Generic Corporate Jargon',
    description: 'Avoid overused corporate buzzwords and generic phrases',
    validationFunction: (content) => {
      const jargon = ['journey', 'seamless', 'effortless', 'transform', 'empower', 'revolutionize'];
      const text = `${content.headline} ${content.caption}`.toLowerCase();
      return !jargon.some(word => text.includes(word));
    },
    errorMessage: 'Content contains generic corporate jargon'
  },
  
  {
    id: 'clear_cta',
    name: 'Clear Call-to-Action',
    description: 'Every ad must have a clear, actionable CTA',
    validationFunction: (content) => {
      return content.cta && content.cta.length > 0 && content.cta.length <= 25;
    },
    errorMessage: 'Missing or invalid call-to-action'
  },
  
  {
    id: 'target_audience_clarity',
    name: 'Target Audience Clarity',
    description: 'Content must be clear about who it\'s for',
    validationFunction: (content) => {
      // Check if content addresses a specific audience or use case
      return content.caption && content.caption.length > 20;
    },
    errorMessage: 'Target audience not clear'
  },
  
  {
    id: 'tone_match',
    name: 'Tone Matches Audience and Context',
    description: 'Messaging tone must be appropriate for target audience and business context',
    validationFunction: (content) => {
      // This is validated by the story coherence system
      return content.emotionalTone !== undefined;
    },
    errorMessage: 'Tone does not match audience or context'
  },
  
  {
    id: 'one_main_message',
    name: 'One Main Message Per Ad',
    description: 'Each ad should focus on ONE clear message, not multiple competing ideas',
    validationFunction: (content) => {
      // Check that headline is focused (not too long)
      return content.headline && content.headline.split(' ').length <= 8;
    },
    errorMessage: 'Ad tries to communicate too many messages'
  },
  
  {
    id: 'visual_supports_headline',
    name: 'Visual Supports Headline Story',
    description: 'Visual content must directly support and illustrate the headline message',
    validationFunction: (content) => {
      // This is validated by visual guidance system
      return content.visualGuidance !== undefined;
    },
    errorMessage: 'Visual does not support headline story'
  },
  
  {
    id: 'no_formula_repetition',
    name: 'No Formula Repetition',
    description: 'Avoid repeating the same headline or caption formulas within campaign',
    validationFunction: (content) => {
      // This is validated by the anti-repetition system
      return !content.isRepetitive;
    },
    errorMessage: 'Content uses repetitive formulas'
  },
  
  {
    id: 'specific_over_vague',
    name: 'Specific Benefits Over Vague Claims',
    description: 'Use concrete, specific benefits instead of vague marketing claims',
    validationFunction: (content) => {
      const vagueTerms = ['best', 'leading', 'premier', 'world-class', 'cutting-edge'];
      const text = `${content.headline} ${content.caption}`.toLowerCase();
      const vagueCount = vagueTerms.filter(term => text.includes(term)).length;
      return vagueCount <= 1; // Allow max 1 vague term
    },
    errorMessage: 'Content uses too many vague claims instead of specific benefits'
  }
];

/**
 * Universal Content Requirements
 */
export const UNIVERSAL_REQUIREMENTS = {
  headline: {
    minLength: 3,
    maxLength: 50,
    maxWords: 8,
    required: true
  },
  
  subheadline: {
    minLength: 0,
    maxLength: 150,
    maxWords: 25,
    required: false
  },
  
  caption: {
    minLength: 20,
    maxLength: 500,
    maxWords: 100,
    required: true
  },
  
  cta: {
    minLength: 2,
    maxLength: 25,
    maxWords: 5,
    required: true
  }
};

/**
 * Universal Banned Patterns
 */
export const UNIVERSAL_BANNED_PATTERNS = [
  /finance your ambitions/i,
  /transform your business/i,
  /empower your (future|journey|dreams)/i,
  /unlock your (potential|tomorrow|success)/i,
  /the future is now/i,
  /banking made simple/i,
  /seamless experience/i,
  /effortless (banking|shopping|service)/i,
  /revolutionize your/i,
  /cutting-edge (technology|solution)/i
];

/**
 * Universal Overused Words (to be stripped)
 */
export const UNIVERSAL_OVERUSED_WORDS = [
  'journey',
  'journeys',
  'everyday',
  'seamless',
  'effortless',
  'transform',
  'empower',
  'ambitions',
  'revolutionize',
  'innovative',
  'cutting-edge',
  'world-class',
  'premier',
  'leading'
];

/**
 * Validate content against universal rules
 */
export function validateUniversalRules(content: any): {
  passed: boolean;
  failedRules: string[];
  passedRules: string[];
} {
  const failedRules: string[] = [];
  const passedRules: string[] = [];
  
  UNIVERSAL_RULES.forEach(rule => {
    try {
      if (rule.validationFunction(content)) {
        passedRules.push(rule.name);
      } else {
        failedRules.push(`${rule.name}: ${rule.errorMessage}`);
      }
    } catch (error) {
      // If validation function fails, consider it a failed rule
      failedRules.push(`${rule.name}: Validation error`);
    }
  });
  
  return {
    passed: failedRules.length === 0,
    failedRules,
    passedRules
  };
}

/**
 * Check if content contains banned patterns
 */
export function containsBannedPatterns(text: string): {
  hasBanned: boolean;
  matches: string[];
} {
  const matches: string[] = [];
  
  UNIVERSAL_BANNED_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      matches.push(pattern.source);
    }
  });
  
  return {
    hasBanned: matches.length > 0,
    matches
  };
}

/**
 * Strip overused words from text
 */
export function stripOverusedWords(text: string): string {
  let cleaned = text;
  
  UNIVERSAL_OVERUSED_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Generate universal rules prompt section
 */
export function generateUniversalRulesPrompt(): string {
  return `
🌐 UNIVERSAL MARKETING RULES (Apply to ALL business types):

ALWAYS (regardless of business type):

1. ✅ Headline-Visual-Caption Coherence
   - All elements must tell ONE unified story
   - No disconnected messages between headline and caption
   
2. ✅ Marketing Angle Diversity
   - Each ad in campaign uses a different strategic angle
   - Never repeat the same approach twice in a row
   
3. ✅ No Generic Corporate Jargon
   - Avoid: journey, seamless, effortless, transform, empower, revolutionize
   - Use specific, concrete language instead
   
4. ✅ Clear Call-to-Action
   - Every ad must have a clear, actionable CTA
   - CTA must be appropriate for business type and context
   
5. ✅ Target Audience Clarity
   - Be clear about who this ad is for
   - Address specific customer needs or situations
   
6. ✅ Tone Matches Audience and Context
   - Professional for B2B, conversational for B2C
   - Appropriate for industry and cultural context
   
7. ✅ One Main Message Per Ad
   - Focus on ONE clear benefit or message
   - Don't try to communicate multiple competing ideas
   
8. ✅ Visual Supports Headline Story
   - Visual must directly illustrate the headline message
   - No generic stock photos that could apply to any business
   
9. ✅ No Formula Repetition
   - Avoid repeating headline or caption structures
   - Each ad should feel fresh and unique
   
10. ✅ Specific Benefits Over Vague Claims
    - Use concrete numbers, features, outcomes
    - Avoid vague terms like "best", "leading", "world-class"

⛔ BANNED PHRASES (Never use these):
- "Finance Your Ambitions"
- "Transform Your Business"
- "Empower Your Journey"
- "Unlock Your Tomorrow"
- "The Future is Now"
- "Banking Made Simple"
- "Seamless Experience"
- "Revolutionize Your..."

📏 CONTENT REQUIREMENTS:
- Headline: 3-50 characters, max 8 words
- Caption: 20-500 characters, max 100 words
- CTA: 2-25 characters, max 5 words
`;
}

