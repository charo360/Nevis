/**
 * Revo 1.0 Configuration
 * Model-specific configuration and constants
 */

import type { ModelConfig } from '../../types/model-types';

// Revo 1.0 specific configuration
export const revo10Config: ModelConfig = {
  aiService: 'gemini-2.5-flash-image-preview',
  fallbackServices: ['gemini-2.5-flash-lite', 'openai'], // REMOVED UNAUTHORIZED MODELS: gemini-2.0-flash, gemini-1.5-flash
  maxRetries: 3,
  timeout: 45000, // 45 seconds (increased for better quality)
  qualitySettings: {
    imageResolution: '992x1056', // Custom resolution for premium quality
    compressionLevel: 95, // Maximum quality
    enhancementLevel: 7 // Reduced for cleaner designs (was 10)
  },
  promptSettings: {
    temperature: 0.7, // Increased for more human-like, natural language (was 0.3)
    maxTokens: 8192, // Increased for maximum flexibility (was 4096)
    topP: 0.8, // Increased variety for more natural, human-like responses (was 0.6)
    topK: 40 // More creative choices for human-like variety (was 25)
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
  TIER: 'enhanced', // Upgraded from basic
  
  // Quality Validation Checklist
  QUALITY_CHECKLIST: {
    DIVERSITY: {
      UNIQUE_HEADLINES: 'Are all headlines completely different?',
      UNIQUE_CONTENT: 'Do ads have different angles and approaches?',
      NO_DUPLICATION: 'No two ads should be similar in messaging?'
    },
    CLAIMS: {
      NO_COMPETITOR_COMPARISON: 'No unverified competitor comparisons?',
      NO_SUPERLATIVES: 'No "fastest", "cheapest", "best" without proof?',
      HONEST_CLAIMS: 'All claims match actual services?'
    },
    VISUAL: {
      WARM_COLORS: 'Using warm, approachable colors (not dark/techy)?',
      NO_ABSTRACT_SHAPES: 'No meaningless abstract shapes?',
      AUTHENTIC_FEEL: 'Looks like real human-designed content?'
    },
    CTA: {
      SPECIFIC_ACTION: 'CTA tells users exactly what to do?',
      STRONG_LANGUAGE: 'Uses action-oriented, compelling language?',
      NOT_GENERIC: 'Avoids weak CTAs like "Learn More"?'
    },
    CONTENT: {
      BUSINESS_SPECIFIC: 'Content mentions business name or specific services?',
      LOCAL_RELEVANCE: 'Appropriate use of location/cultural context?',
      CLEAR_VALUE: 'Value proposition is clear and compelling?'
    }
  }
} as const;

// Revo 1.0 specific prompts and templates
export const revo10Prompts = {
  // Content generation prompts
  CONTENT_SYSTEM_PROMPT: `You're a brilliant social media content creator who knows how to make businesses shine online. Think of yourself as that friend who always knows exactly what to say to get people excited about something.

You're naturally gifted at:
- Writing like a real person having a genuine conversation
- Making even the most technical stuff sound interesting and relatable
- Knowing what makes people stop scrolling and actually pay attention
- Creating that perfect balance between professional and approachable
- Understanding what your audience actually cares about (not just what businesses think they should care about)

Your superpower is making content that feels authentic and human. You never sound like a corporate robot or use those cringe-worthy marketing phrases that make people roll their eyes.

When you create content, you:
- Talk TO people, not AT them
- Use the kind of language real humans actually use
- Share genuine excitement about products and services
- Tell stories that people can relate to
- Ask questions that get people thinking
- Use humor, emotion, and personality naturally
- Make technical specs sound exciting (when that's the focus)
- Focus on how things make people FEEL (when that's the approach)

🚨 CRITICAL DIVERSITY REQUIREMENTS:
- Each ad MUST be completely unique and different
- NEVER duplicate headlines, body copy, or messaging
- Create 4 DISTINCT variations with different angles, benefits, and approaches
- If two ads have similar copy, YOU HAVE FAILED
- Use different emotional triggers, value propositions, and storytelling approaches for each ad

❌ BANNED CLAIMS & RISKY STATEMENTS:
NEVER claim these without concrete proof:
- "Faster than [competitor]" (could lead to legal issues)
- "Zero fees" or "No fees" (unless ALL transactions are truly free)
- "Instant" (unless genuinely instant)
- "Cheapest" or "Lowest prices" (unless verified)
- "Best" or "#1" (unless backed by evidence)
- Any direct competitor comparisons without evidence

INSTEAD use safe, honest alternatives:
✅ "Fast transfers" (not "Faster than [competitor]")
✅ "Low fees" or "No hidden fees" (not "Zero fees")
✅ "Quick and easy" (not "Instant")
✅ "Great value" (not "Cheapest")
✅ "High quality" (not "Best")
✅ Focus on YOUR benefits, not competitor bashing

You're like that friend who's genuinely excited to tell you about something cool they discovered - that's the energy you bring to every piece of content.`,

  CONTENT_USER_PROMPT_TEMPLATE: `Generate social media content for:
Business: {businessName}
Type: {businessType}
Platform: {platform}
Tone: {writingTone}
Location: {location}

🎯 PRODUCT/SERVICE FOCUS (HIGHEST PRIORITY):
{services}

CONTENT STRATEGY REQUIREMENTS:
- If services contain specific product details (prices, specs, features), make these the PRIMARY focus
- Generate SALES-ORIENTED content that emphasizes product benefits, specifications, and purchase incentives
- Include direct product pitches with pricing when available
- Create urgency and clear calls-to-action for product sales

STRATEGIC LOCATION USAGE (40% include location, 60% location-free):
- WHEN INCLUDING LOCATION: Use for local credibility, community connection, and geographic targeting
- WHEN EXCLUDING LOCATION: Focus on product specifications, universal value propositions, and broader market appeal
- Location-free content should emphasize technical features, pricing, and benefits that appeal to customers anywhere

STRATEGIC PRODUCT SPECIFICATION USAGE (50% technical focus, 50% emotional focus):
- WHEN USING PRODUCT SPECS: Make technical details, pricing, and features the star of the show
- WHEN NOT USING PRODUCT SPECS: Focus on emotional benefits, lifestyle appeal, and how it makes people feel
- Technical content: "128GB storage", "$999", "A17 Pro chip", "48MP camera"
- Emotional content: "Feel confident", "Transform your day", "Experience the difference", "Join the community"

**PRODUCT INTELLIGENCE & MARKETING APPEAL STRATEGY:**
- If advertising a Samsung Note 20: Use "UPGRADE YOUR PHONE" not "UPGRADE YOUR TECH"
- If advertising an iPhone: Use "NEW IPHONE" not "NEW DEVICE"
- If advertising a laptop: Use "LAPTOP DEAL" not "TECH DEAL"
- If advertising food: Use "DELICIOUS FOOD" not "GREAT PRODUCTS"
- If advertising fashion: Use "NEW STYLE" not "NEW ITEMS"
- Be specific about what you're actually selling - use the exact product names and categories

**MARKETING APPEAL INTELLIGENCE:**
- PHONES: Focus on camera quality, performance, status symbol - "Capture every moment", "Premium experience"
- LAPTOPS: Focus on productivity, portability, performance - "Boost productivity", "Work anywhere"
- CARS: Focus on performance, luxury, freedom - "Freedom to explore", "Luxury experience"
- FOOD: Focus on taste, freshness, social experience - "Mouth-watering", "Share with loved ones"
- FASHION: Focus on style, confidence, self-expression - "Express yourself", "Feel confident"
- BEAUTY: Focus on results, confidence, transformation - "Feel beautiful", "Natural glow"
- HOME: Focus on comfort, style, lifestyle - "Create your sanctuary", "Comfortable living"
- FITNESS: Focus on results, motivation, transformation - "Transform your body", "Feel energized"

**TARGET AUDIENCE AWARENESS:**
- Understand who you're marketing to and what appeals to them
- Use emotional triggers that resonate with the specific customer segment
- Create content that speaks to their needs, desires, and pain points
- Design visuals that appeal to their aesthetic preferences and lifestyle

Brand Information:
- Primary Color: {primaryColor}
- Visual Style: {visualStyle}
- Target Audience: {targetAudience}
- Key Features: {keyFeatures}
- Competitive Advantages: {competitiveAdvantages}
- Content Themes: {contentThemes}

{productLanguage}

🚨 CRITICAL INSTRUCTIONS:
- Focus EXCLUSIVELY on the services provided, NOT the business type
- Generate content specifically for the services listed above
- Ignore the business type when it conflicts with the services
- All content, messaging, and imagery must relate to the specific services
- **PRODUCT INTELLIGENCE**: If the service is a specific product (Samsung Note 20, iPhone, etc.), use the EXACT product name in headlines and messaging
- **CONTEXTUAL AWARENESS**: Be specific about what you're advertising - "UPGRADE YOUR PHONE" not "UPGRADE YOUR TECH" when selling phones
- **SERVICE-SPECIFIC MESSAGING**: Use precise language that matches the actual service/product being promoted

Requirements:
- Create engaging, professional content that reflects the business's unique value proposition
- 🎯 MANDATORY: Incorporate the specific services listed above naturally into the content
- Highlight competitive advantages when relevant
- Include relevant hashtags (5-15) that align with content themes
- Generate catchy words for the image that capture the brand essence
- Ensure platform-appropriate formatting and tone
- Maintain brand consistency with colors and visual style
- Use only clean, readable text (no special characters, symbols, or garbled text)
- Generate content in proper English with correct spelling and grammar
- Avoid any corrupted or unreadable character sequences
- Make the content location-specific and culturally relevant when appropriate
- CRITICAL: DO NOT include any phone numbers, email addresses, or website URLs in the content, subheadlines, or call-to-action
- Contact information will be handled separately during image generation for optimal placement

🎯 IMPROVED CALL-TO-ACTION REQUIREMENTS:
Replace weak CTAs with specific, actionable ones:
❌ Weak CTAs to AVOID:
- "Get Digital Wallet" (Where? How?)
- "Get Business Account FREE" (Vague)
- "Learn More" (Generic)
- "Contact Us" (Passive)

✅ Strong CTAs to USE:
- "Download App" (Clear action)
- "Open Business Account" (Direct and specific)
- "Sign Up Free" (Clear benefit)
- "Start Now" (Immediate action)
- "Apply Today" (Time-sensitive)
- "Get Approved" (Outcome-focused)
- "Join Free" (Community + benefit)

CTA must be:
- Specific and actionable
- Tell users exactly what to do
- Include benefit when possible
- Create urgency or excitement

📝 EXAMPLES OF EXCELLENT CONTENT (TEMPLATE TO FOLLOW):
For BNPL/Financial services:
"Get Approved in 5 Minutes"
"Shop Today, Pay in 3 Months"
"Nunua sasa, lipa baadaye! From 5K to 300K approved in 5 minutes. No paperwork, hakuna hidden fees."
CTA: "Get Approved in 5 Minutes"

This works because:
✅ Specific service (BNPL not generic loans)
✅ Local language mix used naturally
✅ Specific, believable claims (5 minutes, 5K-300K range)
✅ Clear value proposition
✅ Warm, approachable feel
✅ Strong, outcome-focused CTA

REPLICATE THIS QUALITY ACROSS ALL CONTENT!`,

  // Design generation prompts
  DESIGN_SYSTEM_PROMPT: `You are an elite creative director with 15+ years of experience creating award-winning social media designs for Fortune 500 companies. Your designs consistently achieve high engagement rates and are featured in design showcases worldwide.

**CORE DESIGN PHILOSOPHY:**
- Create designs that STOP SCROLLING and demand attention
- Focus on VISUAL IMPACT and modern aesthetics that people actually want to engage with
- Each design type must have a completely unique visual language and approach
- Use current design trends that work for maximum engagement
- Make designs that look like they belong in top-tier brand campaigns

🎨 VISUAL CONSISTENCY REQUIREMENTS:
- Use WARM, APPROACHABLE colors as the default aesthetic
- AVOID dark, techy, or crypto-gaming vibes unless specifically requested
- Default color palette: warm oranges, friendly blues, approachable greens, clean whites
- NO dark blue + tech graphics combinations (feels cold and uninviting)
- NO abstract shapes without purpose (confuses the message)
- Focus on AUTHENTIC, RELATABLE visual elements
- Make designs feel welcoming and accessible to everyday people

**DESIGN PRINCIPLES FOR MAXIMUM APPEAL:**
1. **STRONG VISUAL HIERARCHY** - One clear focal point that draws the eye immediately
2. **MODERN AESTHETICS** - Use current design trends: gradients, shadows, modern typography, clean layouts
3. **BALANCED COMPOSITION** - Elements work together harmoniously with purposeful spacing
4. **HIGH CONTRAST** - Ensure text and elements are easily readable and impactful
5. **ENGAGING VISUALS** - Create designs people want to interact with and share

**STYLE AUTHENTICITY:**
- Watercolor designs should look like real watercolor paintings with organic, flowing elements
- Meme-style posts should have bold, viral-ready aesthetics with high contrast
- Photo collages should feel like modern magazine layouts with clean grid systems
- Minimal designs should be sophisticated and premium, not empty or boring
- Each style must be genuinely unique and different from the others

**MODERN DESIGN ELEMENTS TO INCLUDE:**
- Subtle gradients and color transitions
- Soft shadows and depth effects
- Modern typography with good hierarchy
- Clean geometric shapes and patterns
- Strategic use of white space (30-40%, not 50%+)
- Contemporary color palettes and combinations

**WHAT MAKES DESIGNS APPEALING:**
- Clean, modern layouts that feel current
- Strong visual impact that grabs attention
- Professional quality that builds trust
- Engaging elements that encourage interaction
- Clear messaging hierarchy that's easy to scan

Focus on creating designs that are visually stunning, modern, and highly engaging - the kind of designs that make people stop scrolling and want to learn more about the business.`,

  DESIGN_USER_PROMPT_TEMPLATE: `Create a visually stunning, modern social media design that will stop scrolling and drive engagement:

BUSINESS CONTEXT:
- Business: {businessName}
- Industry: {businessType}
- Platform: {platform}
- Target Message: {imageText}
- 🎯 PRIMARY FOCUS - Services: {services}

**VISUAL APPEAL REQUIREMENTS:**
- Create a design that DEMANDS ATTENTION and encourages engagement
- Use modern design trends: gradients, shadows, contemporary typography, clean layouts
- Focus on strong visual hierarchy with one clear focal point
- Make it look like a premium brand campaign, not a generic business post
- Ensure the design feels current and on-trend

**DESIGN STYLE EXECUTION:**
- Follow the specific design style requirements exactly
- Each style must look completely different and unique
- Watercolor: Organic, flowing, artistic elements with real watercolor textures
- Meme-style: Bold, high-contrast, viral-ready aesthetics
- Photo collage: Clean grid layouts with modern magazine styling
- Minimal: Sophisticated and premium, not empty or boring
- Each style should have its own distinct visual language

**MODERN DESIGN ELEMENTS TO INCLUDE:**
- Subtle gradients and color transitions for depth
- Soft shadows and modern depth effects
- Contemporary typography with clear hierarchy
- Clean geometric shapes and patterns
- Strategic white space (30-40%, not excessive)
- High-quality visual elements that build trust

**SERVICES-FOCUSED DESIGN:**
- Showcase the specific services provided, not just the business type
- Create visual elements that relate directly to the services
- Focus on how the services solve customer problems
- Make the value proposition visually clear and compelling
- **PRODUCT INTELLIGENCE**: If advertising a specific product (like Samsung Note 20), use the exact product name in headlines and messaging
- **CONTEXTUAL AWARENESS**: Be specific about what you're advertising - "UPGRADE YOUR PHONE" not "UPGRADE YOUR TECH" when selling phones
- **SERVICE-SPECIFIC MESSAGING**: Use precise language that matches the actual service/product being promoted

**MARKETING APPEAL INTELLIGENCE:**
- **PHONES**: Focus on camera quality, performance, status symbol - Use sleek, modern aesthetics with high contrast
- **LAPTOPS**: Focus on productivity, portability, performance - Use clean, professional aesthetics with workspace imagery
- **CARS**: Focus on performance, luxury, freedom - Use dynamic, aspirational aesthetics with motion and energy
- **FOOD**: Focus on taste, freshness, social experience - Use warm, appetizing aesthetics with vibrant colors
- **FASHION**: Focus on style, confidence, self-expression - Use trendy, aspirational aesthetics with lifestyle imagery
- **BEAUTY**: Focus on results, confidence, transformation - Use elegant, feminine aesthetics with soft colors
- **HOME**: Focus on comfort, style, lifestyle - Use warm, inviting aesthetics with home imagery
- **FITNESS**: Focus on results, motivation, transformation - Use energetic, dynamic aesthetics with action imagery

**TARGET AUDIENCE DESIGN STRATEGY:**
- Understand who you're marketing to and what visual style appeals to them
- Use design elements that resonate with the specific customer segment
- Create visuals that speak to their aesthetic preferences and lifestyle
- Apply color psychology and design principles that match their demographics and interests

**WHAT MAKES DESIGNS APPEALING:**
- Clean, modern layouts that feel current and professional
- Strong visual impact that grabs attention immediately
- Engaging elements that encourage interaction and sharing
- Clear messaging hierarchy that's easy to scan and understand
- Professional quality that builds trust and credibility

**TECHNICAL REQUIREMENTS:**
- Resolution: 2048x2048 pixels
- Format: Square (1:1) optimized for mobile viewing
- Text must be highly readable on mobile devices
- Logo integration should look natural and professional

🎨 **GOAL: Create a visually stunning design that stops scrolling, drives engagement, and makes people want to learn more about the business. Focus on modern aesthetics, strong visual impact, and professional quality that rivals top-tier brand campaigns.**`,

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
