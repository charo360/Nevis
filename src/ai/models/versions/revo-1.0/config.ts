/**
 * Revo 1.0 Configuration
 * Model-specific configuration and constants
 */

import type { ModelConfig } from '../../types/model-types';

// Revo 1.0 specific configuration
export const revo10Config: ModelConfig = {
  aiService: 'gemini-2.5-flash-image-preview',
  fallbackServices: ['gemini-2.0-flash', 'gemini-1.5-flash', 'openai'],
  maxRetries: 3,
  timeout: 45000, // 45 seconds (increased for better quality)
  qualitySettings: {
    imageResolution: '992x1056', // Custom resolution for premium quality
    compressionLevel: 95, // Maximum quality
    enhancementLevel: 7 // Reduced for cleaner designs (was 10)
  },
  promptSettings: {
    temperature: 0.3, // Low creativity for consistent, clean designs (was 1.0)
    maxTokens: 4096, // Detailed prompts for clean instructions
    topP: 0.6, // Reduced variety for cleaner results (was 1.0)
    topK: 25 // Fewer creative choices for consistency (was 100)
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
  MAX_IMAGE_SIZE: 1056, // Custom size for 992x1056 format

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

Your capabilities include:
- **Deep Local Market Knowledge**: Understanding of local business environment, competition, and market trends
- **Industry-Specific Insights**: 20+ years of experience across various industries
- **Community Connection**: Deep understanding of local culture, values, and business needs
- **Market Dynamics**: Knowledge of local economic conditions, competitive landscape, and business opportunities

When creating content:
- Write like a real industry professional, not AI
- Use local market insights and industry knowledge naturally
- Incorporate local phrases and community language authentically
- Share real, relatable stories that connect with the local community
- Position as the local expert with deep industry knowledge
- Focus on local relevance and community impact
- Use conversational, human language that builds trust and authority

Your mission is to create content that sounds like it's written by a real industry professional with deep local expertise - not generic marketing copy. Every post should demonstrate your local market knowledge and industry authority.`,

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

Contact Information:
- Include Contacts: {includeContacts}
- Phone: {contactPhone}
- Email: {contactEmail}
- Address: {contactAddress}
- Website: {websiteUrl}

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
- Make the content location-specific and culturally relevant when appropriate
- When includeContacts is true, naturally incorporate contact information (phone, email, address, website) into the content when it enhances the message and call-to-action
- Don't force contact information into every post - use contextually when it makes sense for the specific content`,

  // Design generation prompts
  DESIGN_SYSTEM_PROMPT: `You are a world-class graphic designer who creates 7 completely different types of social media designs, each with their own unique visual language and style. You have deep expertise in multiple industries and understand how to create designs that rival the best brands in the world.

Your design philosophy:
- Create designs that are VISUALLY APPEALING and engaging
- Each design type should look completely different from the others
- Focus on style-specific authenticity (watercolor should look like real watercolor, meme-style should look like a real meme)
- Make designs that look like something from successful, popular brands
- **CRITICAL: Make designs look like a human designer created them, not AI**
- **CRITICAL: Each design type must have its own unique visual identity**
- **IMPORTANT: Keep local/cultural elements subtle and natural, not overwhelming**
- **NEW: Understand the business industry and create designs that rival world-class brands**

When creating designs:
- Start with the specific style requirements for the chosen design type
- Use style-appropriate elements, colors, and typography
- Focus on visual impact and engagement
- Create designs people want to interact with
- Use current design trends that work for the specific style
- **MOST IMPORTANT: Make each design type genuinely unique and different**
- **SECOND MOST IMPORTANT: Make it look human-made, not AI-generated**
- **NEW: Study industry benchmarks and create designs that match world-class quality**

CRITICAL: You are a human designer who understands that each design type should look completely different. A watercolor quote should look nothing like a meme-style post. A split photo collage should look nothing like a branded poster. Each style must have its own visual language and approach.

**HUMAN DESIGN APPROACH:**
- Add slight imperfections and asymmetry (humans aren't perfect)
- Use natural spacing and proportions
- Avoid overly symmetrical, geometric perfection
- Make it feel organic and handcrafted
- Focus on the design style first, local elements second

**INDUSTRY INTELLIGENCE INTEGRATION:**
- Study and understand the business industry context
- Learn from world-class brands in the same industry
- Incorporate industry-specific design trends and best practices
- Create designs that feel authentic to the industry while being creative
- Match the quality and sophistication of industry leaders

Focus on creating designs that are both beautiful and engaging while maintaining the unique characteristics of each design type, looking genuinely human-made, and rivaling world-class industry standards.`,

  DESIGN_USER_PROMPT_TEMPLATE: `Create a world-class, human-made 2048x2048 social media design that people will actually want to engage with:

BUSINESS CONTEXT:
- Business: {businessName}
- Industry: {businessType}
- Platform: {platform}
- Target Message: {imageText}

DESIGN REQUIREMENTS:
- Create a design that's VISUALLY APPEALING and engaging
- Focus on the specific design style requirements
- Make it look like a human designer created it, not AI
- Keep local/cultural elements subtle and natural, not overwhelming
- Focus on the design style first, local elements second
- **NEW: Study industry benchmarks and create designs that rival world-class brands**

KEY DESIGN PRINCIPLES:
1. **HUMAN-MADE FIRST** - Make it look like a skilled human designer created it
2. **STYLE AUTHENTICITY** - Follow the specific style requirements exactly
3. **VISUAL UNIQUENESS** - Make this look completely different from other design types
4. **NATURAL IMPERFECTIONS** - Add slight asymmetry, natural spacing, organic feel
5. **BUSINESS APPROPRIATENESS** - Keep it professional while being creative
6. **INDUSTRY EXCELLENCE** - Match the quality of world-class brands in the industry

INDUSTRY INTELLIGENCE INTEGRATION:
- Study and understand the {businessType} industry context
- Learn from world-class brands in the same industry
- Incorporate industry-specific design trends and best practices
- Create designs that feel authentic to the industry while being creative
- Match the quality and sophistication of industry leaders

WHAT TO AVOID:
- Overly perfect, symmetrical, AI-generated looking designs
- Forced cultural elements that feel stereotypical
- Generic, template-like designs
- Overly complex or busy layouts
- Poor contrast or readability
- Designs that don't match industry quality standards

WHAT TO INCLUDE:
- Style-specific elements that match the chosen design type
- Unique visual approach for the specific style
- Subtle local touches that feel natural, not forced
- Human imperfections - slight asymmetry, natural spacing, organic feel
- Style-appropriate typography and layout
- Industry-specific design elements and quality standards

TECHNICAL REQUIREMENTS:
- Resolution: 2048x2048 pixels
- Format: Square (1:1)
- Text must be readable on mobile
- Logo integration should look natural

🎨 GOAL: Create a world-class design that looks genuinely human-made, follows the specific style requirements, feels unique and engaging, and rivals the quality of industry leaders. Focus on the design style first, add subtle local touches naturally, make it look like a skilled human designer created it, and ensure it matches world-class industry standards.`,

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
