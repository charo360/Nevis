/**
 * Revo 1.0 Configuration
 * Model-specific configuration and constants
 */

import type { ModelConfig } from '../../types/model-types';

// Revo 1.0 specific configuration
export const revo10Config: ModelConfig = {
  aiService: 'gemini-2.5-flash-image-preview',
  fallbackServices: ['gemini-2.5', 'gemini-2.0', 'openai'],
  maxRetries: 3,
  timeout: 45000, // 45 seconds (increased for better quality)
  qualitySettings: {
    imageResolution: '2048x2048', // Upgraded from 1024x1024
    compressionLevel: 92, // Upgraded from 85
    enhancementLevel: 9 // Upgraded from 7 (maximum enhancement)
  },
  promptSettings: {
    temperature: 0.7, // Increased from 0.5 for more creative output
    maxTokens: 2048,
    topP: 0.9, // Increased from 0.8 for better quality
    topK: 40 // Increased from 30 for more variety
  }
};

// Revo 1.0 specific constants
export const revo10Constants = {
  // Model identification
  MODEL_ID: 'revo-1.0',
  MODEL_NAME: 'Revo 1.0',
  MODEL_VERSION: '1.0.0',

  // Capabilities
  SUPPORTED_ASPECT_RATIOS: ['1:1'],
  SUPPORTED_PLATFORMS: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'],
  MAX_QUALITY_SCORE: 9.0, // Upgraded from 7.5

  // Performance targets
  TARGET_PROCESSING_TIME: 30000, // 30 seconds (increased for better quality)
  TARGET_SUCCESS_RATE: 0.97, // 97% (increased from 95%)
  TARGET_QUALITY_SCORE: 8.5, // Upgraded from 7.0

  // Resource limits
  MAX_CONTENT_LENGTH: 2000,
  MAX_HASHTAGS: 15,
  MAX_IMAGE_SIZE: 2048, // Upgraded from 1024

  // Feature flags
  FEATURES: {
    ARTIFACTS_SUPPORT: false,
    REAL_TIME_CONTEXT: true,  // Enable for better context
    TRENDING_TOPICS: true,    // Enable for better content
    MULTIPLE_ASPECT_RATIOS: false,
    VIDEO_GENERATION: false,
    ADVANCED_PROMPTING: true, // Enable for better prompts
    ENHANCED_DESIGN: true,    // Enable for better designs!
    PERFECT_TEXT_RENDERING: true, // NEW: Gemini 2.5 Flash Image Preview feature
    HIGH_RESOLUTION: true,    // NEW: 2048x2048 resolution support
    NATIVE_IMAGE_GENERATION: true // NEW: Direct image generation capability
  },

  // Pricing
  CREDITS_PER_GENERATION: 1.5, // Upgraded from 1 for enhanced capabilities
  CREDITS_PER_DESIGN: 1.5, // Upgraded from 1 for enhanced capabilities
  TIER: 'enhanced' // Upgraded from basic
} as const;

// Revo 1.0 specific prompts and templates
export const revo10Prompts = {
  // Content generation prompts
  CONTENT_SYSTEM_PROMPT: `You are an elite social media content strategist for Revo 1.0, powered by Gemini 2.5 Flash Image Preview for enhanced quality and perfect text rendering.
Your expertise spans viral content creation, brand storytelling, and audience engagement optimization.

Core competencies:
- Craft scroll-stopping, engagement-driving captions
- Create strategic hashtag combinations for maximum reach
- Develop brand-consistent content that converts
- Optimize content for platform-specific algorithms
- Generate compelling headlines and calls-to-action
- Integrate local relevance and cultural context
- Drive meaningful audience interaction and community building
- Leverage trending topics and industry insights
- Create content that balances professionalism with personality`,

  CONTENT_USER_PROMPT_TEMPLATE: `Generate social media content for:
Business: {businessName}
Type: {businessType}
Platform: {platform}
Tone: {writingTone}
Location: {location}

Brand Information:
- Primary Color: {primaryColor}
- Visual Style: {visualStyle}
- Target Audience: {targetAudience}
- Services: {services}
- Key Features: {keyFeatures}
- Competitive Advantages: {competitiveAdvantages}
- Content Themes: {contentThemes}

Requirements:
- Create engaging, professional content that reflects the business's unique value proposition
- Incorporate services and key features naturally into the content
- Highlight competitive advantages when relevant
- Include relevant hashtags (5-15) that align with content themes
- Generate catchy words for the image that capture the brand essence
- Ensure platform-appropriate formatting and tone
- Maintain brand consistency with colors and visual style
- Use only clean, readable text (no special characters, symbols, or garbled text)
- Generate content in proper English with correct spelling and grammar
- Avoid any corrupted or unreadable character sequences
- Make the content location-specific and culturally relevant when appropriate`,

  // Design generation prompts
  DESIGN_SYSTEM_PROMPT: `You are an elite visual designer and creative director for Revo 1.0, powered by Gemini 2.5 Flash Image Preview for professional-grade design generation.
Your expertise spans advanced composition, typography, color theory, and modern design trends. You create designs that surpass Canva quality.

CORE DESIGN PHILOSOPHY:
- Create visually stunning, professional designs that command attention
- Apply advanced design principles and composition rules
- Use sophisticated typography and color harmony
- Implement modern design trends and visual techniques
- Ensure every element serves a purpose and enhances the message
- Generate designs that convert viewers into customers

ADVANCED DESIGN PRINCIPLES:
**COMPOSITION & VISUAL HIERARCHY:**
- Apply Rule of Thirds: Position key elements along grid lines/intersections
- Create clear visual hierarchy using size, contrast, and positioning
- Establish strong focal points that draw the eye immediately
- Use negative space strategically for breathing room and emphasis
- Balance elements with sophisticated asymmetrical composition
- Guide viewer's eye through design with leading lines and flow

**TYPOGRAPHY EXCELLENCE:**
- Establish clear typographic hierarchy (Primary headline, secondary, body)
- Use maximum 2-3 font families with strong contrast
- Ensure text contrast ratio meets accessibility standards (4.5:1 minimum)
- Apply proper letter spacing, line height, and alignment
- Scale typography for platform and viewing distance
- Use typography as a design element, not just information delivery

**COLOR THEORY & HARMONY:**
- Apply color psychology appropriate to business type and message
- Use complementary colors for high contrast and attention
- Apply analogous colors for harmony and cohesion
- Implement triadic color schemes for vibrant, balanced designs
- Use 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
- Ensure sufficient contrast between text and background

**MODERN DESIGN TRENDS:**
- Embrace minimalism with purposeful white space
- Use bold, geometric shapes and clean lines
- Apply subtle gradients and depth effects
- Incorporate authentic, diverse imagery when appropriate
- Use consistent border radius and spacing
- Apply subtle shadows and depth for modern dimensionality`,

  DESIGN_USER_PROMPT_TEMPLATE: `Create a professional-grade 2048x2048 social media design that surpasses Canva quality for:

BUSINESS CONTEXT:
- Business: {businessName}
- Industry: {businessType}
- Platform: {platform}
- Visual Style: {visualStyle}
- Target Message: {imageText}

BRAND IDENTITY SYSTEM:
- Primary Color: {primaryColor} (60% usage - dominant color)
- Accent Color: {accentColor} (30% usage - secondary elements)
- Background: {backgroundColor} (10% usage - highlights and details)
- Logo Integration: {logoInstruction}

PLATFORM-SPECIFIC OPTIMIZATION FOR {platform}:
${'{platform}' === 'Instagram' ? `
- Mobile-first design with bold, clear elements
- High contrast colors that pop on small screens
- Text minimum 24px equivalent for readability
- Center important elements for square crop
- Thumb-stopping power for fast scroll feeds
- Logo: Bottom right or naturally integrated` : ''}
${'{platform}' === 'LinkedIn' ? `
- Professional, business-appropriate aesthetics
- Corporate design standards and clean look
- Clear value proposition for business audience
- Professional photography and imagery
- Thought leadership positioning
- Logo: Prominent for brand authority` : ''}
${'{platform}' === 'Facebook' ? `
- Desktop and mobile viewing optimization
- Engagement and shareability focus
- Clear value proposition in hierarchy
- Authentic, relatable imagery
- Logo: Top left or bottom right` : ''}
${'{platform}' === 'Twitter' ? `
- Rapid consumption and high engagement
- Bold, contrasting timeline colors
- Minimal, impactful text
- Trending visual styles
- Logo: Small, subtle placement` : ''}

BUSINESS TYPE DESIGN DNA FOR {businessType}:
Apply industry-specific design principles and visual language appropriate for this business type.

ADVANCED COMPOSITION REQUIREMENTS:
- Apply Rule of Thirds for element placement
- Create strong focal point with {imageText} as primary message
- Use sophisticated asymmetrical balance
- Implement clear visual hierarchy: Headline → Supporting elements → CTA
- Strategic negative space for premium feel
- Leading lines to guide eye flow

TYPOGRAPHY SPECIFICATIONS:
- Primary headline: Bold, attention-grabbing, high contrast
- Secondary text: Supporting, readable, complementary
- Ensure 4.5:1 contrast ratio minimum
- Professional font pairing (max 2-3 families)
- Proper spacing and alignment

COLOR IMPLEMENTATION:
- Use {primaryColor} as dominant (60%)
- {accentColor} for secondary elements (30%)
- {backgroundColor} for highlights (10%)
- Apply color psychology for {businessType}
- Ensure accessibility and contrast

MODERN DESIGN ELEMENTS:
- Subtle gradients and depth effects
- Clean geometric shapes
- Consistent border radius
- Professional shadows and lighting
- Premium visual texture and finish

QUALITY STANDARDS:
- Professional agency-level quality
- Better than Canva templates
- Print-ready resolution and clarity
- Perfect text rendering
- Sophisticated visual appeal
- Commercial-grade finish`,

  // Error messages
  ERROR_MESSAGES: {
    GENERATION_FAILED: 'Revo 1.0 content generation failed. Please try again.',
    DESIGN_FAILED: 'Revo 1.0 design generation failed. Please try again.',
    INVALID_REQUEST: 'Invalid request for Revo 1.0. Please check your parameters.',
    SERVICE_UNAVAILABLE: 'Revo 1.0 service is temporarily unavailable.',
    TIMEOUT: 'Revo 1.0 generation timed out. Please try again.',
    QUOTA_EXCEEDED: 'Revo 1.0 usage quota exceeded. Please upgrade your plan.'
  }
} as const;

// Revo 1.0 validation rules
export const revo10Validation = {
  // Content validation
  content: {
    minLength: 10,
    maxLength: 2000,
    requiredFields: ['businessType', 'platform', 'businessName'],
    supportedPlatforms: revo10Constants.SUPPORTED_PLATFORMS
  },

  // Design validation
  design: {
    requiredFields: ['businessType', 'platform', 'visualStyle', 'imageText'],
    supportedAspectRatios: revo10Constants.SUPPORTED_ASPECT_RATIOS,
    maxImageTextLength: 200,
    supportedPlatforms: revo10Constants.SUPPORTED_PLATFORMS
  },

  // Brand profile validation
  brandProfile: {
    requiredFields: ['businessType', 'businessName'],
    optionalFields: [
      'location', 'writingTone', 'visualStyle', 'primaryColor',
      'accentColor', 'backgroundColor', 'logoDataUrl', 'targetAudience'
    ]
  }
} as const;

// Revo 1.0 performance metrics
export const revo10Metrics = {
  // Expected performance benchmarks
  BENCHMARKS: {
    processingTime: {
      target: 30000, // 30 seconds (upgraded from 20s)
      acceptable: 40000, // 40 seconds (upgraded from 30s)
      maximum: 60000 // 60 seconds (upgraded from 45s)
    },
    qualityScore: {
      minimum: 7.0, // Upgraded from 5.0
      target: 8.5, // Upgraded from 7.0
      maximum: 9.0 // Upgraded from 7.5
    },
    successRate: {
      minimum: 0.95, // Upgraded from 90%
      target: 0.97, // Upgraded from 95%
      maximum: 0.99 // Upgraded from 98%
    }
  },

  // Monitoring thresholds
  ALERTS: {
    processingTimeHigh: 45000, // Alert if processing takes > 45s (upgraded from 35s)
    qualityScoreLow: 7.5, // Alert if quality drops below 7.5 (upgraded from 6.0)
    successRateLow: 0.95, // Alert if success rate drops below 95% (upgraded from 92%)
    errorRateHigh: 0.05 // Alert if error rate exceeds 5% (upgraded from 8%)
  }
} as const;

// Export utility functions
export function getRevo10Config(): ModelConfig {
  return revo10Config;
}

export function isFeatureEnabled(feature: keyof typeof revo10Constants.FEATURES): boolean {
  return revo10Constants.FEATURES[feature];
}

export function getPromptTemplate(type: 'content' | 'design', templateName: string): string {
  if (type === 'content') {
    return revo10Prompts.CONTENT_USER_PROMPT_TEMPLATE;
  } else if (type === 'design') {
    return revo10Prompts.DESIGN_USER_PROMPT_TEMPLATE;
  }
  throw new Error(`Unknown prompt template: ${type}/${templateName}`);
}

export function validateRequest(type: 'content' | 'design', request: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validation = type === 'content' ? revo10Validation.content : revo10Validation.design;

  // Check required fields
  for (const field of validation.requiredFields) {
    if (!request[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check platform support
  if (request.platform && !validation.supportedPlatforms.includes(request.platform)) {
    errors.push(`Unsupported platform: ${request.platform}`);
  }

  // Design-specific validation
  if (type === 'design') {
    if (request.imageText && request.imageText.length > revo10Validation.design.maxImageTextLength) {
      errors.push(`Image text too long (max ${revo10Validation.design.maxImageTextLength} characters)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function getPerformanceBenchmark(metric: string) {
  return revo10Metrics.BENCHMARKS[metric as keyof typeof revo10Metrics.BENCHMARKS];
}

export function shouldAlert(metric: string, value: number): boolean {
  const alerts = revo10Metrics.ALERTS;

  switch (metric) {
    case 'processingTime':
      return value > alerts.processingTimeHigh;
    case 'qualityScore':
      return value < alerts.qualityScoreLow;
    case 'successRate':
      return value < alerts.successRateLow;
    case 'errorRate':
      return value > alerts.errorRateHigh;
    default:
      return false;
  }
}
