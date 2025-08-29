/**
 * Revo 1.0 Configuration
 * Model-specific configuration and constants
 */

import type { ModelConfig } from '../../types/model-types';

// Revo 1.0 specific configuration
export const revo10Config: ModelConfig = {
  aiService: 'gemini-2.0',
  fallbackServices: ['gemini-2.5', 'openai'],
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  qualitySettings: {
    imageResolution: '1024x1024',
    compressionLevel: 85,
    enhancementLevel: 7 // Good enhancement (was too basic)
  },
  promptSettings: {
    temperature: 0.5, // Reduced for more consistent, readable text
    maxTokens: 2048,
    topP: 0.8,        // Reduced for better text quality
    topK: 30          // Reduced for more focused output
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
  MAX_QUALITY_SCORE: 7.5,

  // Performance targets
  TARGET_PROCESSING_TIME: 20000, // 20 seconds
  TARGET_SUCCESS_RATE: 0.95, // 95%
  TARGET_QUALITY_SCORE: 7.0,

  // Resource limits
  MAX_CONTENT_LENGTH: 2000,
  MAX_HASHTAGS: 15,
  MAX_IMAGE_SIZE: 1024,

  // Feature flags
  FEATURES: {
    ARTIFACTS_SUPPORT: false,
    REAL_TIME_CONTEXT: true,  // Enable for better context
    TRENDING_TOPICS: true,    // Enable for better content
    MULTIPLE_ASPECT_RATIOS: false,
    VIDEO_GENERATION: false,
    ADVANCED_PROMPTING: true, // Enable for better prompts
    ENHANCED_DESIGN: true     // Enable for better designs!
  },

  // Pricing
  CREDITS_PER_GENERATION: 1,
  CREDITS_PER_DESIGN: 1,
  TIER: 'basic'
} as const;

// Revo 1.0 specific prompts and templates
export const revo10Prompts = {
  // Content generation prompts
  CONTENT_SYSTEM_PROMPT: `You are a reliable content generator for Revo 1.0, focused on creating stable, consistent social media content. 
Your goal is to produce professional, engaging content that follows brand guidelines and platform best practices.

Key principles:
- Maintain consistent quality and tone
- Focus on clarity and engagement
- Follow platform-specific formatting
- Ensure brand consistency
- Keep content concise and impactful`,

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

Requirements:
- Create engaging, professional content
- Include relevant hashtags (5-15)
- Generate catchy words for the image
- Ensure platform-appropriate formatting
- Maintain brand consistency
- Use only clean, readable text (no special characters, symbols, or garbled text)
- Generate content in proper English with correct spelling and grammar
- Avoid any corrupted or unreadable character sequences`,

  // Design generation prompts
  DESIGN_SYSTEM_PROMPT: `You are a design generator for Revo 1.0, creating clean, professional 1:1 square images for social media.
Focus on simplicity, brand consistency, and clear visual communication.

Design principles:
- Clean, uncluttered layouts
- Strong brand color usage
- Clear, readable text (no garbled or corrupted characters)
- Professional appearance
- Platform optimization
- Text must be perfectly readable and properly spelled
- No special symbols or unreadable character sequences`,

  DESIGN_USER_PROMPT_TEMPLATE: `Create a 1:1 square social media design for:
Business: {businessName}
Type: {businessType}
Platform: {platform}
Visual Style: {visualStyle}

Brand Colors:
- Primary: {primaryColor}
- Accent: {accentColor}
- Background: {backgroundColor}

Text to include: {imageText}

Requirements:
- 1:1 aspect ratio (square)
- Clean, professional design
- Use brand colors effectively
- Ensure text is readable
- Optimize for {platform}`,

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
      target: 20000, // 20 seconds
      acceptable: 30000, // 30 seconds
      maximum: 45000 // 45 seconds
    },
    qualityScore: {
      minimum: 5.0,
      target: 7.0,
      maximum: 7.5
    },
    successRate: {
      minimum: 0.90, // 90%
      target: 0.95, // 95%
      maximum: 0.98 // 98%
    }
  },

  // Monitoring thresholds
  ALERTS: {
    processingTimeHigh: 35000, // Alert if processing takes > 35s
    qualityScoreLow: 6.0, // Alert if quality drops below 6.0
    successRateLow: 0.92, // Alert if success rate drops below 92%
    errorRateHigh: 0.08 // Alert if error rate exceeds 8%
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
