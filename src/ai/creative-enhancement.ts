/**
 * Creative Enhancement System for Revo 1.0
 * Transforms generic business content into creative, engaging designs
 */

// Enhanced Creative Prompt Framework
export const CREATIVE_PROMPT_SYSTEM = {
  creativeVariation: {
    style: ['minimalist', 'bold', 'elegant', 'playful', 'sophisticated', 'modern', 'artistic', 'dynamic'],
    mood: ['energetic', 'calm', 'confident', 'friendly', 'luxurious', 'inspiring', 'trustworthy', 'innovative'],
    approach: ['storytelling', 'visual metaphor', 'abstract', 'photographic', 'illustrative', 'conceptual', 'emotional', 'cultural']
  },

  creativeConstraints: {
    avoidGeneric: [
      'business jargon', 'stock phrases', 'overused layouts', 'template language',
      'generic headlines', 'boring subheadlines', 'predictable designs'
    ],
    requireUnique: [
      'visual storytelling', 'emotional connection', 'brand personality',
      'cultural relevance', 'creative metaphors', 'unexpected elements'
    ],
    creativeElements: [
      'unexpected angles', 'visual metaphors', 'cultural references',
      'emotional triggers', 'storytelling elements', 'innovative compositions'
    ]
  }
};

// Content Variation System
export const CONTENT_VARIATION_ENGINE = {
  headlineStyles: [
    'Question-based', 'Statistic-driven', 'Story-opening', 'Bold statement',
    'Emotional trigger', 'Curiosity gap', 'Local relevance', 'Trend integration',
    'Problem-solution', 'Benefit-focused', 'Aspirational', 'Contrarian'
  ],

  emotionalTones: [
    'Inspiring', 'Humorous', 'Empathetic', 'Confident', 'Curious',
    'Nostalgic', 'Aspirational', 'Relatable', 'Surprising', 'Authentic',
    'Warm', 'Professional', 'Innovative', 'Trustworthy'
  ],

  creativeFrameworks: [
    'Before/After', 'Problem/Solution', 'Story Arc', 'Contrast',
    'Metaphor', 'Analogy', 'Question/Answer', 'Challenge/Overcome',
    'Journey', 'Transformation', 'Discovery', 'Achievement'
  ]
};

// Business Intelligence System
export const BUSINESS_INTELLIGENCE_SYSTEM = {
  industryInsights: {
    'restaurant': {
      trends: ['farm-to-table', 'fusion cuisine', 'sustainable dining', 'local ingredients'],
      challenges: ['food costs', 'staff retention', 'customer loyalty', 'online reviews'],
      language: ['culinary', 'artisanal', 'fresh', 'authentic', 'experience'],
      culture: 'hospitality-focused, community-centered, quality-driven'
    },
    'retail': {
      trends: ['omnichannel', 'personalization', 'sustainability', 'local sourcing'],
      challenges: ['online competition', 'inventory management', 'customer experience'],
      language: ['curated', 'exclusive', 'quality', 'style', 'value'],
      culture: 'customer-centric, trend-aware, service-oriented'
    },
    'technology': {
      trends: ['AI integration', 'automation', 'cloud solutions', 'cybersecurity'],
      challenges: ['rapid change', 'skill gaps', 'security', 'scalability'],
      language: ['innovative', 'cutting-edge', 'efficient', 'scalable', 'secure'],
      culture: 'innovation-driven, problem-solving, future-focused'
    },
    'healthcare': {
      trends: ['telemedicine', 'preventive care', 'patient experience', 'digital health'],
      challenges: ['regulations', 'patient trust', 'technology adoption'],
      language: ['caring', 'professional', 'trusted', 'comprehensive', 'personalized'],
      culture: 'patient-centered, ethical, evidence-based'
    },
    'financial': {
      trends: ['digital banking', 'fintech', 'financial literacy', 'personalized advice'],
      challenges: ['trust', 'regulations', 'competition', 'security'],
      language: ['secure', 'trusted', 'growth', 'stability', 'prosperity'],
      culture: 'trust-based, security-focused, growth-oriented'
    }
  },

  audiencePsychology: {
    motivations: ['success', 'security', 'convenience', 'status', 'belonging', 'growth'],
    painPoints: ['time constraints', 'budget concerns', 'trust issues', 'complexity'],
    aspirations: ['better life', 'success', 'recognition', 'peace of mind', 'efficiency'],
    communication: ['clear benefits', 'social proof', 'emotional connection', 'practical value']
  }
};

// Creative Design System
export const CREATIVE_DESIGN_SYSTEM = {
  visualInnovation: {
    composition: [
      'Asymmetric balance', 'Dynamic tension', 'Visual flow', 'Focal hierarchy',
      'Rule of thirds', 'Golden ratio', 'Negative space', 'Layered depth'
    ],
    colorPsychology: [
      'Emotional color mapping', 'Cultural color significance', 'Brand color storytelling',
      'Contrast for impact', 'Harmony for trust', 'Accent for attention'
    ],
    typography: [
      'Expressive fonts', 'Creative layouts', 'Visual hierarchy', 'Emotional impact',
      'Readability balance', 'Brand personality', 'Cultural appropriateness'
    ]
  },

  creativeElements: {
    visualMetaphors: [
      'Growth as plants/trees', 'Connection as bridges/networks', 'Security as shields/locks',
      'Innovation as light/sparks', 'Success as mountains/peaks', 'Journey as paths/roads'
    ],
    culturalReferences: [
      'Local landmarks', 'Cultural symbols', 'Traditional patterns', 'Regional colors',
      'Local customs', 'Community values', 'Historical references'
    ],
    unexpectedAngles: [
      'Bird\'s eye view', 'Close-up details', 'Reflection shots', 'Shadow play',
      'Silhouettes', 'Through objects', 'Unusual perspectives', 'Abstract representations'
    ],
    emotionalImagery: [
      'Human connections', 'Achievement moments', 'Peaceful scenes', 'Dynamic action',
      'Warm interactions', 'Inspiring landscapes', 'Celebratory moments', 'Thoughtful expressions'
    ]
  }
};

// Utility Functions
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateCreativeSeed(): number {
  return Math.floor(Math.random() * 10000);
}

// Creative Headline Generator
export function generateCreativeHeadline(
  businessType: string,
  businessName: string,
  location: string,
  context: any
): { headline: string; style: string; tone: string } {
  const style = getRandomElement(CONTENT_VARIATION_ENGINE.headlineStyles);
  const tone = getRandomElement(CONTENT_VARIATION_ENGINE.emotionalTones);
  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  const creativeApproaches = {
    'Question-based': `What makes ${businessName} different in ${location}?`,
    'Statistic-driven': `Join thousands who trust ${businessName} in ${location}`,
    'Story-opening': `Discover the ${businessName} story in ${location}`,
    'Bold statement': `${businessName}: Redefining ${businessType} in ${location}`,
    'Emotional trigger': `Feel the difference at ${businessName}`,
    'Curiosity gap': `The ${location} secret everyone's talking about`,
    'Local relevance': `${location}'s favorite ${businessType} destination`,
    'Trend integration': `Where ${industry.trends[0]} meets excellence`,
    'Problem-solution': `Finally, a ${businessType} that gets it right`,
    'Benefit-focused': `Experience ${businessType} like never before`,
    'Aspirational': `Your journey to better ${businessType} starts here`,
    'Contrarian': `Why ${businessName} does ${businessType} differently`
  };

  return {
    headline: creativeApproaches[style] || `${businessName}: Your trusted ${businessType} partner`,
    style,
    tone
  };
}

// Creative Subheadline Generator
export function generateCreativeSubheadline(
  businessType: string,
  services: string,
  location: string,
  tone: string
): { subheadline: string; framework: string } {
  const framework = getRandomElement(CONTENT_VARIATION_ENGINE.creativeFrameworks);
  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  const creativeFrameworks = {
    'Before/After': `Transform your ${businessType} experience with us`,
    'Problem/Solution': `Solving ${location}'s ${businessType} challenges, one customer at a time`,
    'Story Arc': `Your ${businessType} journey begins with quality and trust`,
    'Contrast': `Where traditional ${businessType} meets modern innovation`,
    'Metaphor': `Building bridges between you and exceptional ${businessType}`,
    'Analogy': `Like a trusted friend in the ${businessType} world`,
    'Question/Answer': `Looking for quality ${businessType}? You found it.`,
    'Challenge/Overcome': `Overcoming ${businessType} challenges with expertise and care`,
    'Journey': `Every step of your ${businessType} journey, we're here`,
    'Transformation': `Transforming how ${location} experiences ${businessType}`,
    'Discovery': `Discover what makes great ${businessType} truly great`,
    'Achievement': `Achieving excellence in ${businessType}, every single day`
  };

  return {
    subheadline: creativeFrameworks[framework] || `Quality ${businessType} services in ${location}`,
    framework
  };
}

// Enhanced Design Creativity Generator
export function enhanceDesignCreativity(
  designPrompt: string,
  businessType: string,
  location: string,
  context: any
): { enhancedPrompt: string; creativeElements: string[]; visualStyle: string } {
  const visualStyle = getRandomElement(CREATIVE_PROMPT_SYSTEM.creativeVariation.style);
  const mood = getRandomElement(CREATIVE_PROMPT_SYSTEM.creativeVariation.mood);
  const approach = getRandomElement(CREATIVE_PROMPT_SYSTEM.creativeVariation.approach);

  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  const creativeElements = getRandomElements(CREATIVE_DESIGN_SYSTEM.creativeElements.visualMetaphors, 2);
  const culturalElements = getRandomElements(CREATIVE_DESIGN_SYSTEM.creativeElements.culturalReferences, 2);
  const emotionalElements = getRandomElements(CREATIVE_DESIGN_SYSTEM.creativeElements.emotionalImagery, 2);

  const creativeEnhancements = [
    `CREATIVE STYLE: ${visualStyle} design with ${mood} mood using ${approach} approach`,
    `VISUAL STORYTELLING: Create a visual narrative that tells the story of ${businessType} excellence`,
    `CULTURAL INTEGRATION: Naturally incorporate ${culturalElements.join(' and ')} from ${location}`,
    `EMOTIONAL DESIGN: Design should evoke ${mood} feelings and ${emotionalElements.join(' with ')}`,
    `INNOVATIVE COMPOSITION: Use ${getRandomElement(CREATIVE_DESIGN_SYSTEM.visualInnovation.composition)} with creative layouts`,
    `AVOID GENERIC: No ${CREATIVE_PROMPT_SYSTEM.creativeConstraints.avoidGeneric.join(', ')}`,
    `CREATIVE METAPHORS: Incorporate ${creativeElements.join(' and ')} as visual storytelling elements`,
    `INDUSTRY RELEVANCE: Reflect ${industry.trends.slice(0, 2).join(' and ')} trends naturally`,
    `UNIQUE PERSPECTIVE: Show ${businessType} from ${getRandomElement(CREATIVE_DESIGN_SYSTEM.creativeElements.unexpectedAngles)}`,
    `EMOTIONAL CONNECTION: Create designs that make viewers feel ${mood} and ${getRandomElement(CONTENT_VARIATION_ENGINE.emotionalTones)}`
  ];

  const enhancedPrompt = designPrompt + '\n\nCREATIVE ENHANCEMENT INSTRUCTIONS:\n' +
    creativeEnhancements.join('\n') +
    '\n\nIMPORTANT: Create something unique, memorable, and emotionally engaging that stands out from typical business designs.';

  return {
    enhancedPrompt,
    creativeElements: [...creativeElements, ...culturalElements, ...emotionalElements],
    visualStyle: `${visualStyle} ${mood} ${approach}`
  };
}

// Anti-Repetition System
export class AntiRepetitionSystem {
  private static usedCombinations: Set<string> = new Set();
  private static maxHistory = 100;

  static generateUniqueVariation(
    businessType: string,
    platform: string,
    baseElements: any
  ): any {
    let attempts = 0;
    let variation;

    do {
      variation = this.createVariation(businessType, platform, baseElements);
      attempts++;
    } while (this.isRepetitive(variation) && attempts < 10);

    this.recordVariation(variation);
    return variation;
  }

  private static createVariation(businessType: string, platform: string, baseElements: any): any {
    const creativeSeed = generateCreativeSeed();
    const style = getRandomElement(CREATIVE_PROMPT_SYSTEM.creativeVariation.style);
    const mood = getRandomElement(CREATIVE_PROMPT_SYSTEM.creativeVariation.mood);
    const approach = getRandomElement(CREATIVE_PROMPT_SYSTEM.creativeVariation.approach);
    const headlineStyle = getRandomElement(CONTENT_VARIATION_ENGINE.headlineStyles);
    const framework = getRandomElement(CONTENT_VARIATION_ENGINE.creativeFrameworks);

    return {
      creativeSeed,
      style,
      mood,
      approach,
      headlineStyle,
      framework,
      signature: `${style}-${mood}-${approach}-${headlineStyle}-${framework}`
    };
  }

  private static isRepetitive(variation: any): boolean {
    return this.usedCombinations.has(variation.signature);
  }

  private static recordVariation(variation: any): void {
    this.usedCombinations.add(variation.signature);

    // Keep history manageable
    if (this.usedCombinations.size > this.maxHistory) {
      const oldestEntries = Array.from(this.usedCombinations).slice(0, 20);
      oldestEntries.forEach(entry => this.usedCombinations.delete(entry));
    }
  }
}

// Creative Call-to-Action Generator
export function generateCreativeCTA(
  businessType: string,
  tone: string,
  context: any
): { cta: string; urgency: string; emotion: string } {
  const urgency = getRandomElement(['immediate', 'gentle', 'compelling', 'friendly']);
  const emotion = getRandomElement(['excitement', 'trust', 'curiosity', 'confidence']);

  const creativeCTAs = {
    'immediate': [
      'Start Your Journey Today',
      'Experience the Difference Now',
      'Join Us Today',
      'Get Started Right Away'
    ],
    'gentle': [
      'Discover More',
      'Learn About Us',
      'Explore Our Services',
      'See What We Offer'
    ],
    'compelling': [
      'Transform Your Experience',
      'Unlock Your Potential',
      'Make the Change',
      'Take the Next Step'
    ],
    'friendly': [
      'Come Visit Us',
      'Let\'s Connect',
      'Say Hello',
      'We\'d Love to Meet You'
    ]
  };

  const ctas = creativeCTAs[urgency] || creativeCTAs['friendly'];

  return {
    cta: getRandomElement(ctas),
    urgency,
    emotion
  };
}

// Business Context Analyzer
export function analyzeBusinessContext(
  businessType: string,
  businessName: string,
  location: string,
  services: string
): {
  industryInsights: any;
  creativePotential: string[];
  emotionalTriggers: string[];
  culturalElements: string[];
} {
  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  const creativePotential = [
    `Leverage ${industry.trends[0]} trend for modern appeal`,
    `Address ${industry.challenges[0]} pain point creatively`,
    `Use ${industry.language.slice(0, 3).join(', ')} language naturally`,
    `Reflect ${industry.culture} in visual storytelling`
  ];

  const emotionalTriggers = getRandomElements(BUSINESS_INTELLIGENCE_SYSTEM.audiencePsychology.motivations, 3);
  const culturalElements = getRandomElements(CREATIVE_DESIGN_SYSTEM.creativeElements.culturalReferences, 3);

  return {
    industryInsights: industry,
    creativePotential,
    emotionalTriggers,
    culturalElements
  };
}
