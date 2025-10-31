/**
 * Revo 1.0 - Enhanced AI Service with Gemini 2.5 Flash Image Preview
 * Enhanced with Gemini 2.5 Flash Image Preview for enhanced quality and perfect text rendering
 */

// Updated: Using direct Vertex AI for all AI generation (no proxy dependencies)
import { BrandProfile } from '@/lib/types';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';
import { revo10Config, revo10Prompts } from './models/versions/revo-1.0/config';
import type { ScheduledService } from '@/services/calendar-service';
import { advancedContentGenerator, BusinessProfile } from './advanced-content-generator';
import { CircuitBreakerManager } from './utils/circuit-breaker';
import { performanceAnalyzer } from './content-performance-analyzer';
import { trendingEnhancer } from './trending-content-enhancer';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';
import {
  generateCreativeHeadline,
  generateCreativeSubheadline,
  enhanceDesignCreativity,
  generateCreativeCTA,
  analyzeBusinessContext,
  AntiRepetitionSystem,
  CREATIVE_PROMPT_SYSTEM,
  CONTENT_VARIATION_ENGINE,
  // NEW: Import business-specific content generation
  StrategicContentPlanner,
  generateBusinessSpecificHeadline,
  generateBusinessSpecificSubheadline,
  generateBusinessSpecificCaption
} from './creative-enhancement';

// Enhanced features integration (copied from Revo 1.5)
import { ensureExactDimensions } from './utils/image-dimensions';

/**
 * Validate content quality and business specificity (copied from Revo 1.5)
 */
function validateContentQuality(
  content: any,
  businessName: string,
  businessType: string,
  brandProfile: BrandProfile
): { isBusinessSpecific: boolean; issues: string[] } {
  const issues: string[] = [];
  let isBusinessSpecific = true;

  // Check if content mentions business name OR business type (more flexible)
  const contentText = `${content.headline || ''} ${content.subheadline || ''} ${content.caption || ''}`.toLowerCase();
  const businessNameLower = businessName.toLowerCase();
  const businessTypeLower = businessType.toLowerCase();

  // Business name or type should appear in content
  const hasBusinessName = contentText.includes(businessNameLower);
  const hasBusinessType = contentText.includes(businessTypeLower);

  if (!hasBusinessName && !hasBusinessType) {
    issues.push('Content does not mention business name or type');
    isBusinessSpecific = false;
  }

  // Check for generic phrases that indicate low quality
  const genericPhrases = [
    'quality service', 'professional service', 'best service',
    'your trusted', 'we provide', 'contact us today'
  ];

  const hasGenericPhrases = genericPhrases.some(phrase => contentText.includes(phrase));
  if (hasGenericPhrases) {
    issues.push('Content contains generic phrases');
  }

  return { isBusinessSpecific, issues };
}

/**
 * Generate fallback hashtags based on platform requirements (copied from Revo 1.5)
 */
function generateFallbackHashtags(businessName: string, businessType: string, platform: string): string[] {
  const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
  const baseHashtags = [
    `#${businessName.replace(/\s+/g, '')}`,
    `#${businessType.replace(/\s+/g, '')}`,
    '#professional',
    '#quality',
    '#service'
  ];

  return baseHashtags.slice(0, hashtagCount);
}

// Smart Product-Specific Language System
interface ProductCategory {
  category: string;
  specificTerms: string[];
  actionWords: string[];
  descriptors: string[];
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    category: 'phone',
    specificTerms: ['phone', 'smartphone', 'mobile device', 'handset'],
    actionWords: ['upgrade your phone', 'get a new phone', 'switch to', 'experience'],
    descriptors: ['latest smartphone', 'powerful phone', 'flagship device', 'mobile powerhouse']
  },
  {
    category: 'laptop',
    specificTerms: ['laptop', 'notebook', 'computer', 'business machine'],
    actionWords: ['upgrade your laptop', 'get a powerful laptop', 'invest in', 'experience'],
    descriptors: ['business laptop', 'powerful computer', 'professional machine', 'productivity powerhouse']
  },
  {
    category: 'audio',
    specificTerms: ['microphone', 'audio equipment', 'recording gear', 'sound system'],
    actionWords: ['upgrade your audio', 'get professional sound', 'invest in quality audio', 'experience'],
    descriptors: ['professional microphone', 'quality audio gear', 'recording equipment', 'sound solution']
  },
  {
    category: 'accessories',
    specificTerms: ['keyboard', 'mouse', 'accessory', 'peripheral'],
    actionWords: ['upgrade your setup', 'enhance your workspace', 'get quality accessories', 'improve'],
    descriptors: ['professional accessories', 'quality peripherals', 'workspace essentials', 'productivity tools']
  },
  {
    category: 'food',
    specificTerms: ['dish', 'meal', 'food', 'cuisine'],
    actionWords: ['try our', 'taste our', 'enjoy our', 'experience'],
    descriptors: ['delicious', 'fresh', 'authentic', 'quality']
  },
  {
    category: 'financial',
    specificTerms: ['loan', 'payment', 'banking service', 'financial solution'],
    actionWords: ['apply for', 'get', 'access', 'use'],
    descriptors: ['flexible', 'convenient', 'secure', 'reliable']
  },
  {
    category: 'software',
    specificTerms: ['software', 'platform', 'solution', 'system'],
    actionWords: ['use our', 'try our', 'implement', 'experience'],
    descriptors: ['powerful', 'innovative', 'comprehensive', 'advanced']
  }
];

function detectProductCategory(productName: string): ProductCategory | null {
  const productLower = productName.toLowerCase();

  // Phone detection
  if (productLower.includes('galaxy') || productLower.includes('iphone') ||
    productLower.includes('phone') || productLower.includes('smartphone') ||
    productLower.includes('mobile')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'phone') || null;
  }

  // Laptop detection
  if (productLower.includes('latitude') || productLower.includes('inspiron') ||
    productLower.includes('laptop') || productLower.includes('notebook') ||
    productLower.includes('dell') || productLower.includes('xps')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'laptop') || null;
  }

  // Audio equipment detection
  if (productLower.includes('lark') || productLower.includes('microphone') ||
    productLower.includes('audio') || productLower.includes('mic') ||
    productLower.includes('hollyland') || productLower.includes('sound')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'audio') || null;
  }

  // Accessories detection
  if (productLower.includes('keyboard') || productLower.includes('mouse') ||
    productLower.includes('logitech') || productLower.includes('combo') ||
    productLower.includes('peripheral')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'accessories') || null;
  }

  // Food detection
  if (productLower.includes('cookie') || productLower.includes('food') ||
    productLower.includes('meal') || productLower.includes('dish') ||
    productLower.includes('nutrition')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'food') || null;
  }

  // Financial services detection
  if (productLower.includes('loan') || productLower.includes('payment') ||
    productLower.includes('banking') || productLower.includes('finance') ||
    productLower.includes('bnpl') || productLower.includes('buy now pay later')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'financial') || null;
  }

  // Software detection
  if (productLower.includes('software') || productLower.includes('platform') ||
    productLower.includes('system') || productLower.includes('api') ||
    productLower.includes('solution')) {
    return PRODUCT_CATEGORIES.find(cat => cat.category === 'software') || null;
  }

  return null;
}

function generateProductSpecificLanguage(scheduledServices: any[]): {
  primaryProduct: string;
  specificLanguage: string;
  actionWords: string[];
  descriptors: string[];
} {
  if (!scheduledServices || scheduledServices.length === 0) {
    return {
      primaryProduct: 'product',
      specificLanguage: 'Upgrade your experience',
      actionWords: ['get', 'try', 'experience'],
      descriptors: ['quality', 'premium', 'excellent']
    };
  }

  // Get today's primary service
  const primaryService = scheduledServices[0];
  const productCategory = detectProductCategory(primaryService);

  if (productCategory) {
    const randomActionWord = productCategory.actionWords[Math.floor(Math.random() * productCategory.actionWords.length)];
    const randomDescriptor = productCategory.descriptors[Math.floor(Math.random() * productCategory.descriptors.length)];

    return {
      primaryProduct: productCategory.specificTerms[0],
      specificLanguage: randomActionWord,
      actionWords: productCategory.actionWords,
      descriptors: productCategory.descriptors
    };
  }

  // Fallback for unrecognized products
  return {
    primaryProduct: 'product',
    specificLanguage: 'Get quality products',
    actionWords: ['get', 'try', 'choose'],
    descriptors: ['quality', 'premium', 'reliable']
  };
}

// Helper functions for advanced design generation
function getBusinessDesignDNA(businessType: string): string {
  const designDNA: Record<string, string> = {
    'restaurant': 'Warm, appetizing colors (reds, oranges, warm yellows). High-quality food photography. Cozy, inviting atmosphere. Emphasis on freshness and quality.',
    'technology': 'Clean, modern aesthetics. Blue and tech-forward color schemes. Geometric shapes. Innovation and reliability focus. Professional typography.',
    'healthcare': 'Clean, trustworthy design. Calming blues and greens. Professional imagery. Focus on care and expertise. Accessible design principles.',
    'fitness': 'Dynamic, energetic design. Bold colors and strong contrasts. Action-oriented imagery. Motivational messaging. Strong, athletic typography.',
    'finance': 'Professional, trustworthy design. Conservative color palette. Clean lines. Security and stability focus. Authoritative typography.',
    'education': 'Approachable, inspiring design. Bright, optimistic colors. Clear information hierarchy. Growth and learning focus. Readable typography.',
    'retail': 'Attractive, commercial design. Brand-focused colors. Product-centric imagery. Sales and value focus. Eye-catching typography.',
    'real estate': 'Luxurious, aspirational design. Sophisticated color palette. High-quality property imagery. Trust and expertise focus. Elegant typography.',
    'default': 'Professional, modern design. Balanced color scheme. Clean, contemporary aesthetics. Quality and reliability focus. Professional typography.'
  };

  return designDNA[businessType.toLowerCase()] || designDNA['default'];
}

// MODERN DESIGN VARIATIONS - Focused on Visual Appeal and Engagement
function getHumanDesignVariations(seed: number): any {
  const variations = [
    {
      style: 'Modern Minimalist',
      layout: 'Clean, sophisticated layout with strategic white space and single focal point',
      composition: 'Centered composition with asymmetrical elements, modern typography hierarchy',
      mood: 'Professional, clean, sophisticated, premium',
      elements: 'Subtle gradients, soft shadows, modern sans-serif fonts, clean geometric shapes, strategic white space',
      description: 'Create a sophisticated minimal design with clean lines, subtle gradients, and modern typography. Think Apple or premium brand aesthetics - clean, elegant, and highly professional.'
    },
    {
      style: 'Bold Vibrant',
      layout: 'High-energy design with dynamic composition and bold visual elements',
      composition: 'Diagonal composition with strong focal points, energetic flow, modern grid systems',
      mood: 'Energetic, exciting, attention-grabbing, modern',
      elements: 'Bold colors, dynamic shapes, modern gradients, strong typography, contemporary patterns',
      description: 'Create a bold, vibrant design that demands attention. Use modern gradients, dynamic layouts, and contemporary design elements that feel current and engaging.'
    },
    {
      style: 'Photo-Driven Modern',
      layout: 'Large photo background with modern text overlay and contemporary styling',
      composition: 'Photo-focused with modern text treatment, clean overlays, magazine-style layout',
      mood: 'Contemporary, aspirational, lifestyle-focused, premium',
      elements: 'High-quality photos, modern text overlays, clean typography, contemporary filters',
      description: 'Design with a large, high-quality photo as the main element, with modern text overlays and contemporary styling. Think modern magazine or lifestyle brand aesthetics.'
    },
    {
      style: 'Creative Artistic',
      layout: 'Artistic composition with creative elements, hand-drawn touches, and unique visual treatments',
      composition: 'Creative angles, artistic overlays, organic shapes, unique perspectives',
      mood: 'Creative, innovative, unique, inspiring, artistic',
      elements: 'Hand-drawn elements, artistic effects, creative typography, unique color combinations, organic shapes',
      description: 'Create an artistic design with hand-drawn elements, creative compositions, and unique visual treatments. Think modern art meets graphic design - creative, inspiring, and visually interesting.'
    },
    {
      style: 'Luxury Premium',
      layout: 'Elegant, sophisticated layout with premium materials and refined aesthetics',
      composition: 'Luxurious spacing, premium typography, elegant proportions, sophisticated hierarchy',
      mood: 'Luxurious, premium, exclusive, sophisticated, high-end',
      elements: 'Premium materials, elegant typography, sophisticated colors, luxury imagery, refined details',
      description: 'Create a luxurious, premium design with elegant typography, sophisticated color palettes, and refined details. Think high-end luxury brand aesthetics - sophisticated, exclusive, and premium.'
    },
    {
      style: 'Tech Modern',
      layout: 'Futuristic design with modern tech elements and contemporary digital aesthetics',
      composition: 'Digital grid systems, modern UI elements, contemporary layouts, tech-inspired design',
      mood: 'Innovative, cutting-edge, digital, forward-thinking, modern',
      elements: 'Digital effects, modern interfaces, tech imagery, contemporary gradients, sleek typography',
      description: 'Create a modern, tech-forward design with contemporary digital aesthetics and sleek interfaces. Think modern tech company or startup aesthetics - innovative, cutting-edge, and digitally sophisticated.'
    },
    {
      style: 'Lifestyle Aspirational',
      layout: 'Lifestyle-focused design with aspirational imagery and modern lifestyle aesthetics',
      composition: 'Lifestyle imagery, modern composition, aspirational mood, contemporary styling',
      mood: 'Aspirational, lifestyle-focused, modern, inspiring, contemporary',
      elements: 'Lifestyle photos, modern filters, contemporary typography, aspirational imagery, clean layouts',
      description: 'Create an aspirational lifestyle design with modern imagery and contemporary styling. Think lifestyle brand or modern influencer aesthetics - aspirational, contemporary, and lifestyle-focused.'
    },
    {
      style: 'Neon Cyberpunk',
      layout: 'Dark background with bright neon accents and futuristic elements',
      composition: 'High contrast with glowing text and tech-inspired geometric shapes',
      mood: 'Futuristic, bold, cutting-edge, energetic',
      elements: 'Neon colors, dark backgrounds, glowing effects, geometric shapes, tech elements',
      description: 'Create a futuristic cyberpunk aesthetic with bright neon colors against dark backgrounds. Think Blade Runner meets modern tech - glowing text, geometric shapes, and high-tech visual elements.'
    },
    {
      style: 'Hand-Drawn Sketch',
      layout: 'Organic, hand-drawn elements with sketch-like typography and illustrations',
      composition: 'Asymmetrical, natural flow with hand-drawn borders and decorative elements',
      mood: 'Personal, authentic, creative, approachable',
      elements: 'Hand-drawn lines, sketch textures, organic shapes, handwritten fonts, doodle elements',
      description: 'Design that looks like it was sketched by hand with pencil or pen. Include hand-drawn borders, organic shapes, and typography that feels handwritten and personal.'
    },
    {
      style: 'Magazine Editorial',
      layout: 'Clean, sophisticated layout inspired by high-end fashion and lifestyle magazines',
      composition: 'Grid-based with perfect typography hierarchy and premium spacing',
      mood: 'Sophisticated, premium, editorial, refined',
      elements: 'Clean typography, sophisticated layouts, premium spacing, editorial-style imagery',
      description: 'Create designs inspired by Vogue, GQ, or Architectural Digest - clean, sophisticated layouts with perfect typography and premium aesthetic that feels like a magazine spread.'
    },
    {
      style: 'Retro Vintage',
      layout: 'Nostalgic design with vintage color palettes and retro typography',
      composition: 'Centered or badge-style layouts with vintage decorative elements',
      mood: 'Nostalgic, warm, timeless, authentic',
      elements: 'Vintage colors, retro fonts, aged textures, classic design elements, nostalgic imagery',
      description: 'Design with 70s, 80s, or 90s aesthetic - warm vintage colors, retro typography, and nostalgic elements that evoke classic design eras with authentic vintage feel.'
    },
    {
      style: 'Geometric Patterns',
      layout: 'Bold geometric shapes and patterns with mathematical precision',
      composition: 'Symmetrical or asymmetrical geometric arrangements with clean lines',
      mood: 'Modern, precise, bold, structured',
      elements: 'Geometric shapes, mathematical patterns, clean lines, bold colors, precise alignment',
      description: 'Create designs using bold geometric shapes, patterns, and mathematical precision. Think Bauhaus meets modern design - clean lines, perfect shapes, and structured compositions.'
    },
    {
      style: 'Textured Backgrounds',
      layout: 'Rich textural backgrounds (paper, fabric, concrete) with overlay text',
      composition: 'Texture as foundation with carefully placed typography and elements',
      mood: 'Tactile, organic, sophisticated, grounded',
      elements: 'Paper textures, fabric patterns, concrete surfaces, wood grain, natural textures',
      description: 'Use rich, tactile textures as the foundation - paper, fabric, concrete, wood, or stone textures with elegant text overlay that feels sophisticated and grounded.'
    },
    {
      style: 'Photo Frames & Borders',
      layout: 'Decorative frames and borders around content with Instagram-style aesthetics',
      composition: 'Framed content with decorative borders and elegant spacing',
      mood: 'Elegant, framed, curated, premium',
      elements: 'Decorative frames, elegant borders, premium spacing, curated aesthetic, frame styles',
      description: 'Design with beautiful decorative frames and borders - think Instagram story frames, elegant photo borders, or premium packaging design with sophisticated framing elements.'
    },
    {
      style: 'Typography Hero',
      layout: 'Large, bold typography as the main design element with minimal supporting graphics',
      composition: 'Text-dominant layout with typography as the primary visual element',
      mood: 'Bold, impactful, statement-making, confident',
      elements: 'Large typography, bold fonts, minimal graphics, strong hierarchy, text-focused design',
      description: 'Make typography the hero of the design - large, bold, impactful text with minimal supporting elements. Think Nike or Apple advertising where the message is the main visual element.'
    }
  ];

  return variations[seed % variations.length];
}

// NEW: Simple, clean design instructions for better visual appeal
function injectHumanImperfections(designPrompt: string, seed: number): string {
  const instructions = [
    'Use organic spacing and natural proportions - avoid perfect symmetry',
    'Include subtle imperfections that make the design feel handcrafted',
    'Focus on authentic, relatable visual elements over artificial perfection',
    'Create designs that feel like they were made by a human, not AI'
  ];

  const selectedInstruction = instructions[seed % instructions.length];

  return designPrompt + `

🎨 AUTHENTIC DESIGN APPROACH:
${selectedInstruction}

AVOID: Perfect symmetry, overly polished elements, AI-generated aesthetics, sterile perfection
FOCUS: Natural, organic design with human touches and authentic imperfections`;
}

// NEW: Natural creative approach for authentic designs
function injectCreativeRebellion(designPrompt: string, seed: number): string {
  const approaches = [
    `DESIGN APPROACH: Create a design that feels natural and authentic. Focus on what real people find appealing and relatable, not artificial perfection.`,

    `CREATIVE STYLE: Use an organic, human-centered approach that feels genuine. Make it look like something a talented human designer would create.`,

    `VISUAL APPROACH: Design with authenticity and natural appeal. Create something that feels real and connects with people emotionally.`,

    `DESIGN PHILOSOPHY: Focus on creating designs that feel human-made and authentic - natural, relatable, and genuinely engaging.`
  ];

  const selectedApproach = approaches[seed % approaches.length];

  return designPrompt + `

🎨 DESIGN APPROACH:
${selectedApproach}

Focus on creating designs that are visually appealing and engaging.`;
}

// NEW: Simple design guidelines for better results
function addArtisticConstraints(designPrompt: string, seed: number): string {
  const constraints = [
    `DESIGN FOCUS: Create a design that feels natural and authentic. Focus on organic aesthetics that people genuinely connect with.`,

    `COMPOSITION APPROACH: Use natural, flowing layouts with organic spacing. Embrace subtle asymmetry and human imperfections.`,

    `CREATIVE ELEMENTS: Add authentic, relatable elements that feel human-made rather than artificially generated.`,

    `VISUAL BALANCE: Create natural balance with organic flow, avoiding overly perfect symmetry.`,

    `DESIGN STYLE: Use an authentic, human-centered approach that feels genuine and relatable.`,

    `CREATIVE APPROACH: Design with emotional authenticity - focus on what feels real and meaningful to people.`,

    `VISUAL HIERARCHY: Create intuitive visual flow that feels natural, not forced or overly structured.`,

    `DESIGN PRINCIPLES: Focus on creating designs that feel human-made with natural imperfections and authentic appeal.`
  ];

  const selectedConstraint = constraints[seed % constraints.length];

  return designPrompt + `

🎨 AUTHENTIC DESIGN GUIDELINE:
${selectedConstraint}

Focus on natural, human-made aesthetics with authentic imperfections.`;
}

function getPlatformOptimization(platform: string): string {
  const optimizations: Record<string, string> = {
    'instagram': `
- Mobile-first design with bold, clear elements
- High contrast colors that pop on small screens
- Text minimum 24px equivalent for readability
- Center important elements for square crop compatibility
- Thumb-stopping power for fast scroll feeds
- Logo: Bottom right corner or naturally integrated`,

    'linkedin': `
- Professional, business-appropriate aesthetics
- Corporate design standards and clean look
- Clear value proposition for business audience
- Professional photography and imagery
- Thought leadership positioning
- Logo: Prominent placement for brand authority`,

    'facebook': `
- Desktop and mobile viewing optimization
- Engagement and shareability focus
- Clear value proposition in visual hierarchy
- Authentic, relatable imagery
- Community-focused design elements
- Logo: Top left or bottom right corner`,

    'twitter': `
- Rapid consumption and high engagement design
- Bold, contrasting colors for timeline visibility
- Minimal, impactful text elements
- Trending visual styles integration
- Real-time relevance
- Logo: Small, subtle placement`,

    'default': `
- Cross-platform compatibility
- Universal appeal and accessibility
- Balanced design for multiple contexts
- Professional appearance across devices
- Logo: Flexible placement based on composition`
  };

  return optimizations[platform.toLowerCase()] || optimizations['default'];
}

// Advanced real-time context gathering for Revo 1.0 (enhanced version with unified knowledge service)
async function gatherRealTimeContext(
  businessType: string,
  location: string,
  platform: string,
  brandId?: string,
  scheduledServices?: any[]
) {
  const context: any = {
    trends: [],
    weather: null,
    events: [],
    news: [],
    rssData: null,
    scheduledServices: [],
    localLanguage: {},
    climateInsights: {},
    trendingTopics: [],
    relevanceInsights: [],
    timeContext: {
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      season: getSeason(),
      timeOfDay: getTimeOfDay()
    }
  };

  try {
    // 🚀 ENHANCED: Use unified knowledge service for comprehensive data integration
    const { unifiedKnowledgeService } = await import('@/services/unified-knowledge-service');

    // Import legacy utilities for fallback and additional processing
    const { filterContextualData } = await import('@/ai/utils/data-relevance-filter');
    const { CalendarService } = await import('@/services/calendar-service');

    // 🚀 ENHANCED: Get unified contextual data first
    let unifiedContext = null;
    try {

      unifiedContext = await unifiedKnowledgeService.getUnifiedContext({
        businessType,
        location,
        platform,
        includeRSS: true,
        includeWeather: true,
        includeCultural: true,
        includeEvents: true,
        includeCorrelation: true,
        cachePreference: 'balanced',
        fallbackStrategy: 'graceful'
      });

    } catch (error) {
      console.warn('⚠️ [Revo 1.0] Unified knowledge service failed, will use legacy data fetching:', error);
    }

    // Collect all contextual data
    const contextualData: any[] = [];

    // 1. SCHEDULED SERVICES INTEGRATION (Highest Priority)
    if (scheduledServices && scheduledServices.length > 0) {
      context.scheduledServices = scheduledServices;

      // Add to contextual data for relevance filtering
      scheduledServices.forEach(service => {
        contextualData.push({
          type: 'scheduled_service',
          content: service,
          source: 'calendar',
          timestamp: new Date()
        });
      });

      // 🚀 ENHANCED: Add calendar-enhanced context
      try {
        const { Revo10CalendarEnhancer } = await import('./revo-1.0-calendar-enhancer');
        const calendarContext = await Revo10CalendarEnhancer.getEnhancedCalendarContext(
          brandId || 'default',
          { businessName, businessType, location } as any
        );
        context.calendarEnhanced = calendarContext;
      } catch (error) {
        console.warn('Calendar enhancement failed:', error);
      }

    } else {
      // Try to fetch calendar data if brandId is available
      if (brandId) {
        try {
          const todaysServices = await CalendarService.getTodaysScheduledServices(brandId);
          if (todaysServices.length > 0) {
            context.scheduledServices = todaysServices;
            const { Revo10CalendarEnhancer } = await import('./revo-1.0-calendar-enhancer');
            const calendarContext = await Revo10CalendarEnhancer.getEnhancedCalendarContext(
              brandId,
              { businessName, businessType, location } as any
            );
            context.calendarEnhanced = calendarContext;
          }
        } catch (error) {
          console.warn('Failed to fetch calendar services:', error);
        }
      }
    }

    // 2. RSS DATA INTEGRATION (Enhanced with unified knowledge service)
    if (unifiedContext) {
      // Use unified context RSS data
      context.rssData = {
        articles: unifiedContext.rssData.articles,
        trends: unifiedContext.rssData.trends.map(t => t.topic),
        localNews: unifiedContext.rssData.localNews.map(n => n.headline),
        industryNews: unifiedContext.rssData.industryNews.map(n => n.headline),
        insights: unifiedContext.rssData.insights,
        relevanceScore: unifiedContext.rssData.relevanceScore
      };

      // Add RSS articles to contextual data
      unifiedContext.rssData.articles.forEach(article => {
        contextualData.push({
          type: 'rss',
          content: article,
          source: 'unified_knowledge_service',
          timestamp: new Date()
        });
      });

    } else {
      // Fallback to legacy RSS fetching
      try {
        const { fetchBusinessRelevantRSSData } = await import('@/ai/utils/enhanced-rss-integration');
        const rssData = await fetchBusinessRelevantRSSData(businessType, location);
        context.rssData = rssData;

        // Add RSS articles to contextual data
        rssData.articles.forEach(article => {
          contextualData.push({
            type: 'rss',
            content: article,
            source: 'legacy_rss_feeds',
            timestamp: new Date()
          });
        });

      } catch (error) {
        console.warn('Failed to fetch RSS data:', error);

        // Fallback: Provide basic RSS structure with empty data
        context.rssData = {
          articles: [],
          trends: [],
          localNews: [],
          industryNews: [],
          insights: [`RSS data temporarily unavailable for ${businessType} in ${location}`],
          relevanceScore: 0.1
        };
      }
    }

    // 3. WEATHER DATA INTEGRATION (Enhanced with unified knowledge service)
    if (unifiedContext) {
      // Use unified context weather data
      context.weather = {
        condition: unifiedContext.weatherData.current.description,
        business_impact: unifiedContext.weatherData.businessImpact,
        content_opportunities: unifiedContext.weatherData.contentOpportunities
      };

      contextualData.push({
        type: 'weather',
        content: context.weather,
        source: 'unified_knowledge_service',
        timestamp: new Date()
      });

    } else {
      // Fallback to legacy weather fetching
      try {
        const { getWeather } = await import('@/services/weather');
        const weatherData = await getWeather(location);
        if (weatherData && !weatherData.includes('Could not retrieve')) {
          context.weather = {
            condition: weatherData,
            business_impact: generateBusinessWeatherImpact(weatherData, businessType),
            content_opportunities: generateWeatherContentOpportunities(weatherData, businessType)
          };

          contextualData.push({
            type: 'weather',
            content: context.weather,
            source: 'legacy_weather_api',
            timestamp: new Date()
          });
        } else {
          // Fallback to simulated weather context
          context.weather = generateWeatherContext(location);
        }
      } catch (error) {
        console.warn('Failed to fetch weather data:', error);
        context.weather = generateWeatherContext(location);
      }
    }

    // 4. LOCAL EVENTS INTEGRATION (Enhanced with unified knowledge service)
    if (unifiedContext) {
      // Use unified context events data
      context.events = unifiedContext.eventsData.localEvents.map(e => e.name).join(', ') ||
        generateLocalOpportunities(businessType, location);

      // Add events to contextual data
      unifiedContext.eventsData.localEvents.forEach(event => {
        contextualData.push({
          type: 'event',
          content: { description: event.name, location: event.venue || location },
          source: 'unified_knowledge_service',
          timestamp: new Date()
        });
      });

    } else {
      // Fallback to legacy events fetching
      try {
        const { getEvents } = await import('@/services/events');
        const eventsData = await getEvents(location, new Date());
        if (eventsData && !eventsData.includes('Could not retrieve')) {
          context.events = eventsData;

          contextualData.push({
            type: 'event',
            content: { description: eventsData, location },
            source: 'legacy_events_api',
            timestamp: new Date()
          });
        } else {
          // Fallback to simulated events
          context.events = generateLocalOpportunities(businessType, location);
        }
      } catch (error) {
        console.warn('Failed to fetch events data:', error);
        context.events = generateLocalOpportunities(businessType, location);
      }
    }

    // 5. ENHANCED LOCAL LANGUAGE AND CULTURAL CONTEXT (Enhanced with unified knowledge service)
    if (unifiedContext) {
      // Use unified context cultural data
      context.localLanguage = generateLocalLanguageContext(location);
      context.culturalContext = unifiedContext.culturalData;
      context.correlatedInsights = unifiedContext.correlatedInsights;

      // Add correlated insights to context for enhanced content generation
      context.enhancedInsights = {
        weatherEventCorrelation: unifiedContext.correlatedInsights.weatherEventCorrelation,
        culturalTrendAlignment: unifiedContext.correlatedInsights.culturalTrendAlignment,
        seasonalOpportunities: unifiedContext.correlatedInsights.seasonalBusinessOpportunities,
        crossSourceRecommendations: unifiedContext.correlatedInsights.crossSourceRecommendations,
        contentOptimization: unifiedContext.correlatedInsights.contentOptimizationSuggestions
      };

    } else {
      // Fallback to legacy cultural context
      context.localLanguage = generateLocalLanguageContext(location);
      context.culturalContext = { region: location, primaryLanguage: 'English' };
      context.correlatedInsights = {
        weatherEventCorrelation: [],
        culturalTrendAlignment: [],
        seasonalBusinessOpportunities: [],
        crossSourceRecommendations: [],
        contentOptimizationSuggestions: []
      };
    }

    // 5.1. ENHANCED CULTURAL INTELLIGENCE
    try {
      const { getCulturalContext } = await import('@/ai/utils/enhanced-cultural-intelligence');
      const enhancedCulturalContext = getCulturalContext(location);
      if (enhancedCulturalContext) {
        context.enhancedCulturalContext = enhancedCulturalContext;
      }
    } catch (error) {
      console.warn('Failed to load enhanced cultural intelligence:', error);
    }

    // 6. ADVANCED CLIMATE INSIGHTS FOR BUSINESS RELEVANCE
    context.climateInsights = generateClimateInsights(location, businessType);

    // 7. REAL-TIME TRENDING TOPICS
    context.trendingTopics = generateTrendingTopics(businessType, location, platform);

    // 8. DATA RELEVANCE FILTERING
    if (contextualData.length > 0) {
      const filteredContext = filterContextualData(
        contextualData,
        businessType,
        location,
        platform,
        context.scheduledServices
      );

      context.highRelevanceData = filteredContext.highRelevance;
      context.mediumRelevanceData = filteredContext.mediumRelevance;
      context.relevanceInsights = filteredContext.insights;
      context.relevanceSummary = filteredContext.summary;

    }

    return context;

  } catch (error) {
    console.error('Error in gatherRealTimeContext:', error);
    return context; // Return partial context
  }
}

// Advanced design enhancement functions
function shouldIncludePeopleInDesign(businessType: string, location: string, visualStyle: string): boolean {
  const peopleBusinessTypes = [
    // Service-based businesses
    'restaurant', 'fitness', 'healthcare', 'education', 'retail', 'hospitality',
    'beauty', 'wellness', 'consulting', 'coaching', 'real estate', 'finance',
    'technology', 'marketing', 'events', 'photography', 'fashion',

    // Food & Nutrition related
    'food', 'nutritional', 'nutrition', 'catering', 'bakery', 'cafe', 'deli',
    'grocery', 'organic', 'healthy', 'diet', 'meal', 'cooking', 'culinary',

    // Business & Professional services
    'company', 'business', 'service', 'agency', 'firm', 'studio', 'center',
    'clinic', 'office', 'shop', 'store', 'boutique', 'salon', 'spa',

    // Community & Social
    'community', 'social', 'training', 'workshop', 'seminar', 'course',
    'therapy', 'counseling', 'support', 'care', 'assistance',

    // E-commerce & Tech
    'ecommerce', 'e-commerce', 'electronics', 'tech', 'digital'
  ];

  const businessTypeLower = businessType.toLowerCase();
  const matchesBusinessType = peopleBusinessTypes.some(type => businessTypeLower.includes(type));
  const matchesVisualStyle = visualStyle === 'lifestyle' || visualStyle === 'authentic';

  return matchesBusinessType || matchesVisualStyle;
}

function getLocalCulturalContext(location: string): string {
  const culturalContexts: Record<string, string> = {
    'kenya': 'Subtle Kenyan elements: warm earth tones, natural textures, community feel',
    'nigeria': 'Subtle Nigerian elements: vibrant accents, natural patterns, community warmth',
    'south africa': 'Subtle South African elements: diverse representation, natural colors, community spirit',
    'ghana': 'Subtle Ghanaian elements: warm tones, natural textures, community connection',
    'uganda': 'Subtle Ugandan elements: natural colors, community feel, authentic representation',
    'tanzania': 'Subtle Tanzanian elements: coastal influences, natural textures, community warmth',
    'ethiopia': 'Subtle Ethiopian elements: natural earth tones, community connection, authentic feel',
    'rwanda': 'Subtle Rwandan elements: natural colors, community spirit, authentic representation',
    'default': 'Natural, authentic feel with subtle local elements that feel genuine, not forced'
  };

  const locationKey = location.toLowerCase();
  for (const [key, context] of Object.entries(culturalContexts)) {
    if (locationKey.includes(key)) {
      return context;
    }
  }
  return culturalContexts['default'];
}

function getDesignVariations(seed: number) {
  const variations = [
    {
      style: 'Modern Minimalist',
      layout: 'Clean geometric layout with plenty of white space, single focal point, minimal text overlay',
      composition: 'Centered composition with asymmetrical elements, bold typography hierarchy',
      mood: 'Professional, clean, sophisticated',
      elements: 'Subtle gradients, clean lines, modern sans-serif fonts, minimal color palette'
    },
    {
      style: 'Dynamic Action',
      layout: 'Diagonal composition with movement, multiple focal points, energetic flow',
      composition: 'Rule of thirds with dynamic angles, overlapping elements, motion blur effects',
      mood: 'Energetic, exciting, forward-moving',
      elements: 'Bold colors, dynamic shapes, action-oriented imagery, strong directional lines'
    },
    {
      style: 'Lifestyle Authentic',
      layout: 'Natural, candid composition with real-world settings, human-centered design',
      composition: 'Environmental context, natural lighting, authentic moments captured',
      mood: 'Warm, relatable, trustworthy, human',
      elements: 'Natural lighting, authentic people, real environments, warm color tones'
    },
    {
      style: 'Corporate Professional',
      layout: 'Structured grid layout, balanced composition, formal presentation',
      composition: 'Symmetrical balance, clear hierarchy, professional spacing',
      mood: 'Trustworthy, established, reliable, premium',
      elements: 'Corporate colors, professional imagery, clean typography, structured layout'
    },
    {
      style: 'Creative Artistic',
      layout: 'Artistic composition with creative elements, unique perspectives, artistic flair',
      composition: 'Creative angles, artistic overlays, unique visual treatments',
      mood: 'Creative, innovative, unique, inspiring',
      elements: 'Artistic effects, creative typography, unique color combinations, artistic imagery'
    },
    {
      style: 'Tech Innovation',
      layout: 'Futuristic design with tech elements, digital aesthetics, modern interfaces',
      composition: 'Digital grid systems, tech-inspired layouts, modern UI elements',
      mood: 'Innovative, cutting-edge, digital, forward-thinking',
      elements: 'Digital effects, tech imagery, modern interfaces, futuristic elements'
    },
    {
      style: 'Cultural Heritage',
      layout: 'Traditional patterns mixed with modern design, cultural elements integrated',
      composition: 'Cultural motifs, traditional-modern fusion, heritage-inspired layouts',
      mood: 'Cultural, authentic, heritage-proud, modern-traditional',
      elements: 'Traditional patterns, cultural colors, heritage imagery, modern interpretation'
    },
    {
      style: 'Luxury Premium',
      layout: 'Elegant, sophisticated layout with premium materials and finishes',
      composition: 'Luxurious spacing, premium typography, elegant proportions',
      mood: 'Luxurious, premium, exclusive, sophisticated',
      elements: 'Premium materials, elegant typography, sophisticated colors, luxury imagery'
    }
  ];

  return variations[seed % variations.length];
}

function getAdvancedPeopleInstructions(businessType: string, location: string): string {
  const culturalContext = getLocalCulturalContext(location);

  return `
**NATURAL PEOPLE INTEGRATION:**
- ${getCulturallyAppropriatePersonDescription(location)}
- Cultural Context: ${culturalContext}
- Show people in authentic, real-world settings:
  * Natural work environments (actual offices, real workshops, genuine studios)
  * Everyday lifestyle moments (real homes, local cafes, outdoor activities)
  * Authentic ${businessType} contexts with real interactions
  * Community gatherings with genuine social connections
  * Urban life with natural city interactions
  * Cultural heritage blended naturally with modern life
- Focus on genuine human moments and authentic interactions
- Show people engaged in real activities, not posed scenarios
- Use natural expressions - genuine laughter, focused concentration, relaxed conversations
- Include diverse ages and backgrounds that reflect real communities
- Show contemporary local fashion and natural styling choices
- Make people the heart of authentic stories, not decorative elements`;
}

// NEW: Enhanced product intelligence for contextual awareness and marketing appeal
function getProductIntelligence(imageText: string, businessType: string): string {
  const text = imageText.toLowerCase();

  // Phone/Electronics Intelligence
  if (text.includes('samsung') || text.includes('note') || text.includes('galaxy') || text.includes('iphone') || text.includes('phone') || text.includes('mobile')) {
    return `PRODUCT INTELLIGENCE: This is about a PHONE/MOBILE DEVICE. Use specific language like "UPGRADE YOUR PHONE", "NEW PHONE", "MOBILE UPGRADE" instead of generic "TECH" terms.

MARKETING APPEAL STRATEGY FOR PHONES:
- Focus on: Camera quality, performance, storage, design, status symbol
- Visual elements: Show the phone prominently, highlight camera features, display screen quality
- Emotional triggers: "Capture every moment", "Stay connected", "Premium experience", "Cutting-edge technology"
- Target audience: Tech enthusiasts, professionals, social media users, young adults
- Design approach: Modern, sleek, premium aesthetics with clean lines and high contrast`;
  }

  // Laptop/Computer Intelligence
  if (text.includes('laptop') || text.includes('computer') || text.includes('macbook') || text.includes('dell') || text.includes('hp')) {
    return `PRODUCT INTELLIGENCE: This is about a LAPTOP/COMPUTER. Use specific language like "UPGRADE YOUR LAPTOP", "NEW COMPUTER", "LAPTOP DEAL" instead of generic "TECH" terms.

MARKETING APPEAL STRATEGY FOR LAPTOPS:
- Focus on: Performance, portability, battery life, screen quality, productivity
- Visual elements: Show laptop in use, highlight screen clarity, emphasize portability
- Emotional triggers: "Boost productivity", "Work anywhere", "Powerful performance", "Professional grade"
- Target audience: Professionals, students, remote workers, creative professionals
- Design approach: Clean, professional, productivity-focused with modern workspace aesthetics`;
  }

  // Car/Vehicle Intelligence
  if (text.includes('car') || text.includes('vehicle') || text.includes('toyota') || text.includes('honda') || text.includes('bmw') || text.includes('mercedes')) {
    return `PRODUCT INTELLIGENCE: This is about a VEHICLE/CAR. Use specific language like "NEW CAR", "CAR DEAL", "VEHICLE UPGRADE" instead of generic terms.

MARKETING APPEAL STRATEGY FOR CARS:
- Focus on: Performance, luxury, reliability, fuel efficiency, safety, status
- Visual elements: Show car in motion, highlight design features, emphasize interior/exterior
- Emotional triggers: "Freedom to explore", "Luxury experience", "Safe travels", "Adventure awaits"
- Target audience: Families, professionals, adventure seekers, luxury buyers
- Design approach: Dynamic, aspirational, lifestyle-focused with motion and energy`;
  }

  // Food/Restaurant Intelligence
  if (text.includes('pizza') || text.includes('burger') || text.includes('food') || text.includes('meal') || text.includes('restaurant') || text.includes('delivery')) {
    return `PRODUCT INTELLIGENCE: This is about FOOD/DINING. Use specific language like "DELICIOUS FOOD", "FRESH MEAL", "FOOD DELIVERY" instead of generic terms.

MARKETING APPEAL STRATEGY FOR FOOD:
- Focus on: Taste, freshness, presentation, convenience, comfort, social experience
- Visual elements: Show food prominently, highlight ingredients, emphasize presentation
- Emotional triggers: "Mouth-watering", "Fresh ingredients", "Comfort food", "Share with loved ones"
- Target audience: Food lovers, families, busy professionals, social groups
- Design approach: Warm, appetizing, social, vibrant colors, food-focused imagery`;
  }

  // Fashion/Clothing Intelligence
  if (text.includes('shirt') || text.includes('dress') || text.includes('clothes') || text.includes('fashion') || text.includes('outfit') || text.includes('style')) {
    return `PRODUCT INTELLIGENCE: This is about FASHION/CLOTHING. Use specific language like "NEW STYLE", "FASHION TREND", "CLOTHING DEAL" instead of generic terms.

MARKETING APPEAL STRATEGY FOR FASHION:
- Focus on: Style, quality, trendiness, confidence, self-expression, fit
- Visual elements: Show clothing on models, highlight details, emphasize style
- Emotional triggers: "Express yourself", "Feel confident", "Stay trendy", "Perfect fit"
- Target audience: Fashion-conscious individuals, young adults, professionals, style enthusiasts
- Design approach: Trendy, aspirational, lifestyle-focused with modern aesthetics`;
  }

  // Beauty/Cosmetics Intelligence
  if (text.includes('makeup') || text.includes('cosmetic') || text.includes('beauty') || text.includes('skincare') || text.includes('perfume') || text.includes('lipstick')) {
    return `PRODUCT INTELLIGENCE: This is about BEAUTY/COSMETICS. Use specific language like "BEAUTY PRODUCTS", "COSMETIC DEAL", "SKINCARE" instead of generic terms.

MARKETING APPEAL STRATEGY FOR BEAUTY:
- Focus on: Results, quality, natural ingredients, confidence, self-care, transformation
- Visual elements: Show before/after, highlight product details, emphasize results
- Emotional triggers: "Feel beautiful", "Natural glow", "Confidence boost", "Self-care ritual"
- Target audience: Beauty enthusiasts, young women, professionals, self-care focused individuals
- Design approach: Elegant, feminine, aspirational, clean with soft colors and premium feel`;
  }

  // Home/Furniture Intelligence
  if (text.includes('furniture') || text.includes('sofa') || text.includes('chair') || text.includes('table') || text.includes('home') || text.includes('decor')) {
    return `PRODUCT INTELLIGENCE: This is about HOME/FURNITURE. Use specific language like "HOME DECOR", "FURNITURE DEAL", "HOME UPGRADE" instead of generic terms.

MARKETING APPEAL STRATEGY FOR HOME/FURNITURE:
- Focus on: Comfort, style, quality, durability, home improvement, lifestyle
- Visual elements: Show furniture in home settings, highlight comfort, emphasize style
- Emotional triggers: "Create your sanctuary", "Comfortable living", "Style your space", "Quality that lasts"
- Target audience: Homeowners, families, interior design enthusiasts, young professionals
- Design approach: Warm, inviting, lifestyle-focused with home aesthetics`;
  }

  // Fitness/Health Intelligence
  if (text.includes('gym') || text.includes('fitness') || text.includes('workout') || text.includes('exercise') || text.includes('health') || text.includes('training')) {
    return `PRODUCT INTELLIGENCE: This is about FITNESS/HEALTH. Use specific language like "FITNESS TRAINING", "HEALTHY LIFESTYLE", "WORKOUT DEAL" instead of generic terms.

MARKETING APPEAL STRATEGY FOR FITNESS:
- Focus on: Results, motivation, health benefits, community, transformation, energy
- Visual elements: Show active people, highlight equipment, emphasize results
- Emotional triggers: "Transform your body", "Feel energized", "Join the community", "Achieve your goals"
- Target audience: Fitness enthusiasts, health-conscious individuals, beginners, athletes
- Design approach: Energetic, motivational, dynamic with bold colors and action imagery`;
  }

  // Default Intelligence
  return `PRODUCT INTELLIGENCE: Analyze the specific product/service being advertised and use precise, contextual language that matches what's actually being sold. Avoid generic terms like "TECH" when advertising specific products.

GENERAL MARKETING APPEAL STRATEGY:
- Focus on: Benefits, quality, value, customer satisfaction, results
- Visual elements: Show product in use, highlight key features, emphasize benefits
- Emotional triggers: "Transform your experience", "Quality you can trust", "Results that matter"
- Target audience: Identify the specific customer segment and their needs
- Design approach: Professional, trustworthy, benefit-focused with clear value proposition`;
}

// NEW: Industry Intelligence System with World-Class Design Benchmarks
function getIndustryDesignIntelligence(businessType: string): any {
  const industryIntelligence: Record<string, any> = {
    'restaurant': {
      name: 'Restaurant & Food Service',
      worldClassBrands: ['Noma', 'Eleven Madison Park', 'The French Laundry', 'Osteria Francescana', 'Gaggan'],
      designBenchmarks: {
        visualStyle: 'Sophisticated, appetizing, experiential',
        colorPalettes: ['Warm earth tones', 'Rich burgundies', 'Cream whites', 'Deep greens', 'Gold accents'],
        typography: 'Elegant serifs, sophisticated sans-serifs, handwritten touches',
        imagery: 'Food photography, intimate dining scenes, chef portraits, ingredient close-ups',
        layout: 'Clean, spacious, food-focused, premium feel',
        creativeElements: ['Food textures', 'Culinary tools', 'Seasonal ingredients', 'Dining atmosphere', 'Chef artistry']
      },
      creativityFrameworks: [
        'Culinary storytelling through visual narrative',
        'Seasonal and ingredient-driven design evolution',
        'Chef personality and restaurant atmosphere integration',
        'Food photography as art form',
        'Dining experience visualization'
      ],
      industryTrends: ['Farm-to-table aesthetics', 'Minimalist plating influence', 'Chef celebrity culture', 'Sustainable dining', 'Global fusion']
    },

    'technology': {
      name: 'Technology & Innovation',
      worldClassBrands: ['Apple', 'Tesla', 'SpaceX', 'Google', 'Microsoft', 'Adobe'],
      designBenchmarks: {
        visualStyle: 'Futuristic, clean, innovative, premium',
        colorPalettes: ['Deep blues', 'Pure whites', 'Accent colors', 'Gradients', 'Neon highlights'],
        typography: 'Modern sans-serifs, geometric precision, clean hierarchy',
        imagery: 'Abstract tech elements, clean interfaces, innovation concepts, premium materials',
        layout: 'Grid-based, clean lines, lots of white space, focused messaging',
        creativeElements: ['Geometric shapes', 'Digital interfaces', 'Innovation metaphors', 'Premium materials', 'Future concepts']
      },
      creativityFrameworks: [
        'Technology as art and innovation',
        'Clean, premium aesthetic with bold innovation',
        'Future-focused visual storytelling',
        'Interface and product integration',
        'Innovation and progress visualization'
      ],
      industryTrends: ['AI integration', 'Sustainable tech', 'Minimalist interfaces', 'Premium positioning', 'Innovation focus']
    },

    'healthcare': {
      name: 'Healthcare & Wellness',
      worldClassBrands: ['Mayo Clinic', 'Cleveland Clinic', 'Johns Hopkins', 'Stanford Health', 'Cleveland Clinic'],
      designBenchmarks: {
        visualStyle: 'Trustworthy, caring, professional, accessible',
        colorPalettes: ['Calming blues', 'Soft greens', 'Warm whites', 'Accent colors', 'Professional tones'],
        typography: 'Clean, readable fonts, professional hierarchy, accessible sizing',
        imagery: 'Caring professionals, modern facilities, wellness concepts, community health',
        layout: 'Clean, organized, easy to navigate, trustworthy appearance',
        creativeElements: ['Medical symbols', 'Wellness imagery', 'Community health', 'Professional care', 'Modern facilities']
      },
      creativityFrameworks: [
        'Care and compassion through visual design',
        'Trust and professionalism building',
        'Wellness and health promotion',
        'Community health engagement',
        'Modern healthcare accessibility'
      ],
      industryTrends: ['Telehealth integration', 'Patient-centered care', 'Digital health', 'Wellness focus', 'Community health']
    },

    'fitness': {
      name: 'Fitness & Wellness',
      worldClassBrands: ['Peloton', 'Nike', 'Adidas', 'Equinox', 'Planet Fitness', 'CrossFit'],
      designBenchmarks: {
        visualStyle: 'Energetic, motivational, premium, inclusive',
        colorPalettes: ['Bold reds', 'Energetic oranges', 'Motivational yellows', 'Strong blacks', 'Accent colors'],
        typography: 'Bold, energetic fonts, motivational messaging, strong hierarchy',
        imagery: 'Action shots, diverse athletes, motivational scenes, fitness environments',
        layout: 'Dynamic, energetic, motivational, inclusive',
        creativeElements: ['Movement lines', 'Athletic energy', 'Diversity representation', 'Motivational elements', 'Fitness environments']
      },
      creativityFrameworks: [
        'Energy and motivation through visual design',
        'Inclusive fitness for all',
        'Athletic achievement celebration',
        'Community and belonging',
        'Personal transformation stories'
      ],
      industryTrends: ['Digital fitness', 'Inclusive representation', 'Community building', 'Personal transformation', 'Wellness integration']
    },

    'finance': {
      name: 'Finance & Banking',
      worldClassBrands: ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'BlackRock', 'Visa', 'Mastercard'],
      designBenchmarks: {
        visualStyle: 'Trustworthy, sophisticated, stable, premium',
        colorPalettes: ['Deep blues', 'Professional grays', 'Gold accents', 'Clean whites', 'Trustworthy tones'],
        typography: 'Professional serifs, clean sans-serifs, authoritative hierarchy',
        imagery: 'Modern buildings, professional environments, growth concepts, stability symbols',
        layout: 'Structured, professional, trustworthy, premium',
        creativeElements: ['Financial symbols', 'Growth metaphors', 'Stability elements', 'Professional environments', 'Premium materials']
      },
      creativityFrameworks: [
        'Trust and stability through design',
        'Sophistication and premium positioning',
        'Growth and progress visualization',
        'Professional excellence',
        'Financial security representation'
      ],
      industryTrends: ['Digital banking', 'Fintech innovation', 'Sustainable finance', 'Personal finance', 'Cryptocurrency']
    },

    'education': {
      name: 'Education & Learning',
      worldClassBrands: ['Harvard', 'MIT', 'Stanford', 'Coursera', 'Khan Academy', 'Duolingo'],
      designBenchmarks: {
        visualStyle: 'Inspiring, accessible, modern, engaging',
        colorPalettes: ['Inspiring blues', 'Creative purples', 'Warm oranges', 'Growth greens', 'Accent colors'],
        typography: 'Readable fonts, inspiring hierarchy, accessible design',
        imagery: 'Learning environments, diverse students, innovation concepts, growth metaphors',
        layout: 'Engaging, organized, inspiring, accessible',
        creativeElements: ['Learning symbols', 'Growth metaphors', 'Innovation elements', 'Diversity representation', 'Knowledge visualization']
      },
      creativityFrameworks: [
        'Inspiration and learning through design',
        'Accessibility and inclusion',
        'Innovation and progress',
        'Community and collaboration',
        'Personal growth stories'
      ],
      industryTrends: ['Online learning', 'Personalized education', 'STEM focus', 'Global accessibility', 'Innovation in learning']
    },

    'retail': {
      name: 'Retail & E-commerce',
      worldClassBrands: ['Amazon', 'Apple', 'Nike', 'IKEA', 'Zara', 'Uniqlo'],
      designBenchmarks: {
        visualStyle: 'Attractive, commercial, engaging, conversion-focused',
        colorPalettes: ['Brand colors', 'Attractive accents', 'Commercial tones', 'Engaging highlights'],
        typography: 'Commercial fonts, conversion-focused messaging, attractive hierarchy',
        imagery: 'Product showcases, lifestyle integration, commercial appeal, brand personality',
        layout: 'Commercial, attractive, conversion-optimized, engaging',
        creativeElements: ['Product elements', 'Lifestyle integration', 'Commercial appeal', 'Brand personality', 'Conversion elements']
      },
      creativityFrameworks: [
        'Commercial appeal and conversion',
        'Brand personality expression',
        'Lifestyle integration',
        'Product storytelling',
        'Customer engagement'
      ],
      industryTrends: ['E-commerce growth', 'Personalization', 'Sustainability', 'Mobile commerce', 'Social commerce']
    },

    'real estate': {
      name: 'Real Estate & Property',
      worldClassBrands: ['Sotheby\'s', 'Christie\'s', 'Douglas Elliman', 'Compass', 'Zillow'],
      designBenchmarks: {
        visualStyle: 'Luxurious, aspirational, trustworthy, premium',
        colorPalettes: ['Luxury golds', 'Sophisticated grays', 'Premium whites', 'Rich browns', 'Accent colors'],
        typography: 'Luxury fonts, sophisticated hierarchy, premium appearance',
        imagery: 'Luxury properties, premium environments, aspirational lifestyles, professional service',
        layout: 'Luxurious, sophisticated, premium, aspirational',
        creativeElements: ['Luxury elements', 'Premium materials', 'Aspirational lifestyles', 'Professional service', 'Property showcase']
      },
      creativityFrameworks: [
        'Luxury and aspiration through design',
        'Trust and professionalism',
        'Premium positioning',
        'Lifestyle visualization',
        'Property storytelling'
      ],
      industryTrends: ['Digital property viewing', 'Sustainable properties', 'Luxury market growth', 'Technology integration', 'Global investment']
    },

    'default': {
      name: 'Professional Services',
      worldClassBrands: ['McKinsey', 'Bain', 'BCG', 'Deloitte', 'PwC', 'EY'],
      designBenchmarks: {
        visualStyle: 'Professional, trustworthy, modern, sophisticated',
        colorPalettes: ['Professional blues', 'Trustworthy grays', 'Modern accents', 'Clean whites'],
        typography: 'Professional fonts, clean hierarchy, trustworthy appearance',
        imagery: 'Professional environments, modern offices, business concepts, trust symbols',
        layout: 'Professional, organized, trustworthy, modern',
        creativeElements: ['Professional elements', 'Business concepts', 'Trust symbols', 'Modern environments', 'Success indicators']
      },
      creativityFrameworks: [
        'Professional excellence through design',
        'Trust and credibility building',
        'Modern sophistication',
        'Business success visualization',
        'Professional service representation'
      ],
      industryTrends: ['Digital transformation', 'Remote work', 'Sustainability', 'Innovation focus', 'Global expansion']
    }
  };

  return industryIntelligence[businessType.toLowerCase()] || industryIntelligence['default'];
}

// NEW: Enhanced Creativity System with Industry Intelligence
function getEnhancedCreativityFramework(businessType: string, designStyle: string, seed: number): any {
  const industryIntel = getIndustryDesignIntelligence(businessType);

  const creativityFrameworks = [
    {
      name: 'World-Class Benchmarking',
      approach: `Study and emulate the design excellence of ${industryIntel.worldClassBrands.slice(0, 3).join(', ')}`,
      focus: 'Premium positioning, industry best practices, sophisticated aesthetics',
      elements: industryIntel.designBenchmarks.creativeElements,
      description: `Create designs that rival the sophistication and quality of ${industryIntel.name} industry leaders`
    },
    {
      name: 'Industry Trend Integration',
      approach: `Incorporate current ${industryIntel.name} trends: ${industryIntel.industryTrends.slice(0, 3).join(', ')}`,
      focus: 'Modern relevance, industry innovation, forward-thinking design',
      elements: ['Trend elements', 'Innovation concepts', 'Modern aesthetics', 'Industry relevance'],
      description: 'Design that feels current and relevant to the industry while maintaining creativity'
    },
    {
      name: 'Creative Storytelling',
      approach: industryIntel.creativityFrameworks[seed % industryIntel.creativityFrameworks.length],
      focus: 'Narrative design, emotional connection, brand storytelling',
      elements: ['Story elements', 'Emotional triggers', 'Narrative flow', 'Brand personality'],
      description: 'Use visual design to tell compelling stories that connect with the audience'
    },
    {
      name: 'Innovation & Disruption',
      approach: 'Challenge industry conventions with creative innovation',
      focus: 'Breaking norms, creative disruption, unique positioning',
      elements: ['Innovation elements', 'Disruptive concepts', 'Unique approaches', 'Creative risk-taking'],
      description: 'Create designs that stand out by challenging industry conventions'
    },
    {
      name: 'Cultural & Global Fusion',
      approach: 'Blend local cultural elements with global industry standards',
      focus: 'Cultural authenticity, global relevance, unique positioning',
      elements: ['Cultural elements', 'Global standards', 'Local authenticity', 'Fusion concepts'],
      description: 'Create designs that feel both locally authentic and globally competitive'
    }
  ];

  return creativityFrameworks[seed % creativityFrameworks.length];
}

// NEW: Industry-Specific Design Enhancement
function enhanceDesignWithIndustryIntelligence(designPrompt: string, businessType: string, designStyle: string, seed: number): string {
  const industryIntel = getIndustryDesignIntelligence(businessType);
  const creativityFramework = getEnhancedCreativityFramework(businessType, designStyle, seed);

  const industryEnhancement = `
🏭 INDUSTRY INTELLIGENCE INTEGRATION:
**Industry:** ${industryIntel.name}
**World-Class Benchmarks:** ${industryIntel.worldClassBrands.slice(0, 3).join(', ')}
**Industry Visual Style:** ${industryIntel.designBenchmarks.visualStyle}
**Industry Color Palettes:** ${industryIntel.designBenchmarks.colorPalettes.slice(0, 3).join(', ')}
**Industry Typography:** ${industryIntel.designBenchmarks.typography}
**Industry Imagery:** ${industryIntel.designBenchmarks.imagery}
**Industry Layout:** ${industryIntel.designBenchmarks.layout}

🎨 CREATIVITY FRAMEWORK: ${creativityFramework.name}
**Approach:** ${creativityFramework.approach}
**Focus:** ${creativityFramework.focus}
**Creative Elements:** ${creativityFramework.elements.slice(0, 3).join(', ')}
**Description:** ${creativityFramework.description}

🚀 INDUSTRY TRENDS TO INCORPORATE:
${industryIntel.industryTrends.slice(0, 3).map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

🎯 DESIGN REQUIREMENTS:
- **Industry Benchmarking:** Create designs that rival ${industryIntel.name} industry leaders
- **Trend Integration:** Incorporate current industry trends naturally
- **Creative Innovation:** Use ${creativityFramework.name} approach for unique positioning
- **Quality Standards:** Match world-class design quality and sophistication
- **Industry Relevance:** Ensure design feels authentic to ${industryIntel.name} industry`;

  return designPrompt + industryEnhancement;
}

// NEW: Business Intelligence Engine - Local Marketing Expert System
function getBusinessIntelligenceEngine(businessType: string, location: string): any {
  const businessIntelligence: Record<string, any> = {
    'restaurant': {
      name: 'Restaurant & Food Service',
      localExpertise: {
        experience: '25+ years in hospitality and culinary marketing',
        marketDynamics: [
          'Seasonal menu optimization and local ingredient sourcing',
          'Customer loyalty programs and repeat business strategies',
          'Local competition analysis and unique positioning',
          'Food trends and cultural preferences in the area',
          'Pricing strategies for local market conditions'
        ],
        localPhrases: [
          'Taste of [location]',
          'Where locals eat',
          'Fresh from our kitchen',
          'Made with love',
          'Family recipe',
          'Local favorite',
          'Chef\'s special',
          'Daily fresh',
          'Home-cooked taste',
          'Local ingredients'
        ],
        contentStrategies: [
          'Behind-the-scenes kitchen stories',
          'Chef personality and cooking philosophy',
          'Local ingredient sourcing stories',
          'Customer testimonials and success stories',
          'Seasonal menu highlights',
          'Local food culture integration',
          'Community involvement and events',
          'Sustainability and local farming partnerships'
        ],
        engagementHooks: [
          'Food memories and nostalgia',
          'Local pride and community connection',
          'Health and wellness benefits',
          'Family traditions and gatherings',
          'Adventure and trying new flavors',
          'Social sharing and food photography',
          'Exclusive offers and VIP experiences',
          'Local events and celebrations'
        ]
      }
    },

    'technology': {
      name: 'Technology & Innovation',
      localExpertise: {
        experience: '22+ years in tech marketing and digital transformation',
        marketDynamics: [
          'Local tech ecosystem and startup culture',
          'Digital adoption rates in the region',
          'Competitive landscape and innovation gaps',
          'Local talent pool and skill development',
          'Government tech initiatives and support'
        ],
        localPhrases: [
          'Innovation hub',
          'Digital transformation',
          'Tech-forward solutions',
          'Future-ready',
          'Smart [location]',
          'Digital innovation',
          'Tech excellence',
          'Innovation center',
          'Digital leadership',
          'Tech ecosystem'
        ],
        contentStrategies: [
          'Local tech success stories',
          'Innovation case studies',
          'Digital transformation stories',
          'Tech talent development',
          'Local startup ecosystem',
          'Government tech partnerships',
          'Digital skills training',
          'Smart city initiatives'
        ],
        engagementHooks: [
          'Career advancement and skill development',
          'Innovation and future thinking',
          'Local tech community building',
          'Digital transformation success',
          'Tech entrepreneurship',
          'Smart city development',
          'Digital inclusion',
          'Tech for social good'
        ]
      }
    },

    'healthcare': {
      name: 'Healthcare & Wellness',
      localExpertise: {
        experience: '28+ years in healthcare marketing and patient care',
        marketDynamics: [
          'Local health demographics and needs',
          'Healthcare accessibility and insurance coverage',
          'Competing healthcare providers and services',
          'Local health trends and concerns',
          'Community health initiatives and partnerships'
        ],
        localPhrases: [
          'Your health, our priority',
          'Caring for [location] families',
          'Local healthcare excellence',
          'Community health partner',
          'Your wellness journey',
          'Health close to home',
          'Caring professionals',
          'Local health experts',
          'Community wellness',
          'Health for everyone'
        ],
        contentStrategies: [
          'Patient success stories and testimonials',
          'Local health education and prevention',
          'Community health initiatives',
          'Healthcare professional spotlights',
          'Local health trends and insights',
          'Wellness tips and advice',
          'Health technology integration',
          'Community partnerships and events'
        ],
        engagementHooks: [
          'Family health and wellness',
          'Preventive care and early detection',
          'Local health community',
          'Professional healthcare expertise',
          'Health technology innovation',
          'Community health improvement',
          'Patient-centered care',
          'Health education and awareness'
        ]
      }
    },

    'fitness': {
      name: 'Fitness & Wellness',
      localExpertise: {
        experience: '24+ years in fitness marketing and community building',
        marketDynamics: [
          'Local fitness culture and preferences',
          'Competing gyms and fitness options',
          'Seasonal fitness trends and activities',
          'Local sports teams and community events',
          'Health awareness and wellness trends'
        ],
        localPhrases: [
          'Your fitness transformation starts here',
          'Stronger [location] community',
          'Local fitness excellence',
          'Your wellness partner',
          'Fitness for everyone',
          'Local strength',
          'Community fitness',
          'Your health transformation',
          'Local fitness family',
          'Wellness close to home'
        ],
        contentStrategies: [
          'Member transformation stories',
          'Local fitness challenges and events',
          'Community fitness initiatives',
          'Trainer spotlights and expertise',
          'Local sports team partnerships',
          'Seasonal fitness programs',
          'Wellness education and tips',
          'Community health partnerships'
        ],
        engagementHooks: [
          'Personal transformation and goals',
          'Community fitness challenges',
          'Local sports pride',
          'Health and wellness education',
          'Fitness community building',
          'Seasonal fitness motivation',
          'Professional training expertise',
          'Inclusive fitness for all'
        ]
      }
    },

    'finance': {
      name: 'Finance & Banking',
      localExpertise: {
        experience: '26+ years in financial services and local banking',
        marketDynamics: [
          'Local economic conditions and growth',
          'Competing financial institutions',
          'Local business financing needs',
          'Personal finance trends in the area',
          'Community investment opportunities'
        ],
        localPhrases: [
          'Your financial partner in [location]',
          'Local financial expertise',
          'Community banking excellence',
          'Your financial future',
          'Local financial solutions',
          'Community financial partner',
          'Your money, our care',
          'Local financial guidance',
          'Community wealth building',
          'Financial security close to home'
        ],
        contentStrategies: [
          'Local business success stories',
          'Financial education and literacy',
          'Community investment initiatives',
          'Local economic insights',
          'Personal finance success stories',
          'Business financing solutions',
          'Local financial trends',
          'Community financial partnerships'
        ],
        engagementHooks: [
          'Financial security and planning',
          'Local business growth',
          'Community economic development',
          'Personal finance education',
          'Investment opportunities',
          'Business financing solutions',
          'Local economic pride',
          'Financial wellness for families'
        ]
      }
    },

    'education': {
      name: 'Education & Learning',
      localExpertise: {
        experience: '23+ years in educational marketing and community learning',
        marketDynamics: [
          'Local education standards and performance',
          'Competing educational institutions',
          'Local learning needs and preferences',
          'Community education initiatives',
          'Employment and skill development needs'
        ],
        localPhrases: [
          'Learning excellence in [location]',
          'Your educational path forward',
          'Local learning excellence',
          'Community education partner',
          'Your learning success',
          'Local educational leadership',
          'Community learning center',
          'Your knowledge partner',
          'Local educational excellence',
          'Learning close to home'
        ],
        contentStrategies: [
          'Student success stories',
          'Local educational achievements',
          'Community learning initiatives',
          'Educational innovation and technology',
          'Local employment partnerships',
          'Skill development programs',
          'Community education events',
          'Local learning trends'
        ],
        engagementHooks: [
          'Personal growth and development',
          'Career advancement opportunities',
          'Local educational pride',
          'Community learning initiatives',
          'Innovation in education',
          'Skill development and training',
          'Local employment success',
          'Educational excellence recognition'
        ]
      }
    },

    'retail': {
      name: 'Retail & E-commerce',
      localExpertise: {
        experience: '25+ years in retail marketing and customer experience',
        marketDynamics: [
          'Local shopping preferences and trends',
          'Competing retail options and malls',
          'Local economic conditions and spending',
          'Seasonal shopping patterns',
          'Community shopping habits and events'
        ],
        localPhrases: [
          'Your local shopping destination',
          'Shopping excellence in [location]',
          'Local retail leadership',
          'Your shopping partner',
          'Local retail excellence',
          'Community shopping center',
          'Your retail destination',
          'Local shopping experience',
          'Community retail partner',
          'Shopping close to home'
        ],
        contentStrategies: [
          'Local product highlights',
          'Customer success stories',
          'Community shopping events',
          'Local brand partnerships',
          'Seasonal shopping guides',
          'Local shopping trends',
          'Community retail initiatives',
          'Local customer appreciation'
        ],
        engagementHooks: [
          'Local product discovery',
          'Community shopping events',
          'Seasonal shopping excitement',
          'Local brand support',
          'Customer appreciation',
          'Shopping convenience',
          'Local retail pride',
          'Community shopping experience'
        ]
      }
    },

    'real estate': {
      name: 'Real Estate & Property',
      localExpertise: {
        experience: '27+ years in real estate marketing and local property',
        marketDynamics: [
          'Local property market conditions',
          'Competing real estate agencies',
          'Local property trends and values',
          'Community development and growth',
          'Local investment opportunities'
        ],
        localPhrases: [
          'Your local real estate expert',
          'Real estate excellence in [location]',
          'Local property specialist',
          'Your property partner',
          'Local real estate leadership',
          'Community property expert',
          'Your real estate guide',
          'Local property excellence',
          'Community real estate partner',
          'Property close to home'
        ],
        contentStrategies: [
          'Local property success stories',
          'Community development updates',
          'Local property market insights',
          'Property investment opportunities',
          'Local neighborhood highlights',
          'Community real estate events',
          'Local property trends',
          'Community property partnerships'
        ],
        engagementHooks: [
          'Property investment opportunities',
          'Local neighborhood pride',
          'Community development',
          'Property market insights',
          'Local real estate success',
          'Community property events',
          'Property investment guidance',
          'Local real estate expertise'
        ]
      }
    },

    'default': {
      name: 'Professional Services',
      localExpertise: {
        experience: '20+ years in professional services and local business',
        marketDynamics: [
          'Local business environment and competition',
          'Community business needs and trends',
          'Local economic conditions',
          'Business development opportunities',
          'Community partnerships and networking'
        ],
        localPhrases: [
          'Your local business partner',
          'Professional excellence in [location]',
          'Local business expertise',
          'Your success partner',
          'Local professional leadership',
          'Community business partner',
          'Your business guide',
          'Local professional excellence',
          'Community business expert',
          'Success close to home'
        ],
        contentStrategies: [
          'Local business success stories',
          'Community business initiatives',
          'Local business insights',
          'Business development opportunities',
          'Local business trends',
          'Community business events',
          'Local business partnerships',
          'Community business support'
        ],
        engagementHooks: [
          'Business growth and success',
          'Local business community',
          'Professional development',
          'Business opportunities',
          'Local business pride',
          'Community business support',
          'Business innovation',
          'Local business expertise'
        ]
      }
    },
    'financial technology software': {
      name: 'Financial Technology Software',
      localExpertise: {
        experience: '15+ years in fintech and digital payments',
        marketDynamics: [
          'Digital payment adoption rates in the region',
          'Mobile banking and fintech competition',
          'Financial inclusion and accessibility needs',
          'Regulatory compliance and security requirements',
          'Local banking partnerships and integrations'
        ],
        contentStrategies: [
          'Digital financial innovation',
          'Payment security and trust',
          'Financial inclusion stories',
          'Fintech industry insights',
          'User experience excellence',
          'Local market expansion',
          'Partnership announcements',
          'Technology advancement'
        ],
        engagementHooks: [
          'Financial innovation',
          'Digital payments',
          'Financial inclusion',
          'Secure transactions',
          'Fintech solutions',
          'Payment convenience',
          'Financial empowerment',
          'Digital banking'
        ]
      },
      localPhrases: [
        'Your digital payment partner',
        'Fintech innovation in [location]',
        'Digital financial solutions',
        'Your payment solution',
        'Financial technology excellence',
        'Digital banking for [location]',
        'Your fintech partner',
        'Payment innovation'
      ]
    },
    'default': {
      name: 'Professional Services',
      localExpertise: {
        experience: '20+ years in professional services',
        marketDynamics: [
          'Local business environment and competition',
          'Market trends and opportunities',
          'Customer needs and preferences',
          'Industry best practices and standards',
          'Local economic conditions and growth'
        ],
        contentStrategies: [
          'Professional excellence and expertise',
          'Client success stories',
          'Industry insights and trends',
          'Local market knowledge',
          'Service quality and reliability',
          'Innovation and solutions',
          'Community involvement',
          'Professional development'
        ],
        engagementHooks: [
          'Professional excellence',
          'Client success',
          'Industry expertise',
          'Local market knowledge',
          'Quality service',
          'Innovation solutions',
          'Community partnership',
          'Professional growth'
        ]
      },
      localPhrases: [
        'Your local professional partner',
        'Excellence in [location]',
        'Local expertise you can trust',
        'Your success partner',
        'Professional solutions for [location]',
        'Local industry leadership',
        'Your trusted advisor',
        'Professional excellence'
      ]
    }
  };

  const result = businessIntelligence[businessType.toLowerCase()] || businessIntelligence['default'];
  return result;
}

// NEW: Dynamic Content Strategy Engine - Never Repetitive
function getDynamicContentStrategy(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);

  const contentStrategies = [
    {
      name: 'Local Market Expert',
      approach: `Position as the ${businessIntel.name} expert in ${location} with ${businessIntel.localExpertise.experience}`,
      focus: 'Local expertise, community knowledge, market insights',
      hooks: businessIntel.localExpertise.engagementHooks.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['local expertise', 'community focused', 'trusted service', 'proven results']).slice(0, 4),
      description: `Write like a ${businessIntel.localExpertise.experience} professional who knows ${location} inside and out`
    },
    {
      name: 'Community Storyteller',
      approach: `Share authentic stories about local ${businessIntel.name} success and community impact`,
      focus: 'Real stories, community connection, authentic experiences',
      hooks: businessIntel.localExpertise.engagementHooks.slice(4, 8),
      phrases: (businessIntel.localPhrases || ['community stories', 'local success', 'authentic experiences', 'real results']).slice(4, 8),
      description: 'Share real, relatable stories that connect with the local community'
    },
    {
      name: 'Industry Innovator',
      approach: `Showcase cutting-edge ${businessIntel.name} solutions and industry leadership`,
      focus: 'Innovation, industry trends, competitive advantage',
      hooks: businessIntel.localExpertise.contentStrategies.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['innovative solutions', 'industry leader', 'cutting-edge', 'advanced technology']).slice(0, 4),
      description: 'Position as an industry leader with innovative solutions and insights'
    },
    {
      name: 'Problem Solver',
      approach: `Address specific ${businessIntel.name} challenges that local businesses and people face`,
      focus: 'Problem identification, solution offering, value demonstration',
      hooks: businessIntel.localExpertise.marketDynamics.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['problem solver', 'effective solutions', 'proven results', 'reliable service']).slice(0, 4),
      description: 'Identify and solve real problems that matter to the local community'
    },
    {
      name: 'Success Catalyst',
      approach: `Inspire and guide local ${businessIntel.name} success through proven strategies`,
      focus: 'Success stories, proven methods, inspirational guidance',
      hooks: businessIntel.localExpertise.contentStrategies.slice(4, 8),
      phrases: (businessIntel.localPhrases || ['success catalyst', 'proven strategies', 'inspiring results', 'growth partner']).slice(4, 8),
      description: 'Inspire success through proven strategies and real results'
    }
  ];

  return contentStrategies[seed % contentStrategies.length];
}

// NEW: Human Writing Style Generator - Authentic, Engaging
function getHumanWritingStyle(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);

  const writingStyles = [
    {
      name: 'Conversational Expert',
      tone: 'Friendly, knowledgeable, approachable',
      voice: `Like a ${businessIntel.localExpertise.experience} professional chatting with a friend over coffee`,
      characteristics: [
        'Use local phrases naturally',
        'Share personal insights and experiences',
        'Ask engaging questions',
        'Use conversational language',
        'Show genuine enthusiasm for the business'
      ],
      examples: [
        `"You know what I love about ${location}? The way our community..."`,
        `"After ${businessIntel.localExpertise.experience} in this industry, I've learned..."`,
        `"Here's something that always makes me smile about our business..."`
      ]
    },
    {
      name: 'Storytelling Mentor',
      tone: 'Inspirational, narrative, engaging',
      voice: 'Like sharing a compelling story that teaches and inspires',
      characteristics: [
        'Start with intriguing hooks',
        'Build narrative tension',
        'Include relatable characters',
        'End with meaningful insights',
        'Use vivid, descriptive language'
      ],
      examples: [
        `"Last week, something incredible happened that reminded me why..."`,
        `"I'll never forget the day when..."`,
        `"There's a story behind every success, and this one..."`
      ]
    },
    {
      name: 'Local Champion',
      tone: 'Proud, community-focused, authentic',
      voice: 'Like a proud local business owner celebrating community success',
      characteristics: [
        'Celebrate local achievements',
        'Use local pride and identity',
        'Highlight community connections',
        'Show genuine local love',
        'Connect business to community values'
      ],
      examples: [
        `"This is why I'm so proud to be part of the ${location} community..."`,
        `"Our ${location} neighbors never cease to amaze me..."`,
        `"There's something special about doing business in ${location}..."`
      ]
    },
    {
      name: 'Problem-Solving Partner',
      tone: 'Helpful, solution-oriented, trustworthy',
      voice: 'Like a trusted advisor helping solve real problems',
      characteristics: [
        'Identify real problems',
        'Offer practical solutions',
        'Show understanding and empathy',
        'Build trust through expertise',
        'Focus on customer benefit'
      ],
      examples: [
        `"I've noticed that many ${location} businesses struggle with..."`,
        `"Here's a solution that's worked for countless local businesses..."`,
        `"Let me share what I've learned about solving this common challenge..."`
      ]
    },
    {
      name: 'Success Celebrator',
      tone: 'Enthusiastic, celebratory, motivational',
      voice: 'Like celebrating wins and inspiring future success',
      characteristics: [
        'Celebrate achievements',
        'Share success stories',
        'Inspire future action',
        'Use positive, uplifting language',
        'Connect success to community'
      ],
      examples: [
        `"I'm thrilled to share some amazing news from our ${location} community..."`,
        `"This success story is exactly why I love ${businessIntel.name} in ${location}..."`,
        `"Let's celebrate this incredible achievement together..."`
      ]
    }
  ];

  return writingStyles[seed % writingStyles.length];
}

// NEW: Anti-Repetition Content Engine
function generateUniqueContentVariation(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);
  const contentStrategy = getDynamicContentStrategy(businessType, location, seed);
  const writingStyle = getHumanWritingStyle(businessType, location, seed);

  // Generate unique content angle based on multiple factors
  const contentAngles = [
    {
      type: 'Local Insight',
      focus: `Share unique ${businessIntel.name} insights specific to ${location}`,
      examples: [
        `"What I've learned about ${businessIntel.name} in ${location} after ${businessIntel.localExpertise.experience}..."`,
        `"The ${businessIntel.name} landscape in ${location} is unique because..."`,
        `"Here's what makes ${location} special for ${businessIntel.name} businesses..."`
      ]
    },
    {
      type: 'Community Story',
      focus: `Tell a compelling story about local ${businessIntel.name} impact`,
      examples: [
        `"Last month, something incredible happened in our ${location} community..."`,
        `"I want to share a story that perfectly captures why we do what we do..."`,
        `"This is the kind of moment that makes ${businessIntel.name} in ${location} special..."`
      ]
    },
    {
      type: 'Industry Innovation',
      focus: `Showcase cutting-edge ${businessIntel.name} solutions`,
      examples: [
        `"We're excited to introduce something that's changing ${businessIntel.name} in ${location}..."`,
        `"Here's how we're innovating in the ${businessIntel.name} space..."`,
        `"This new approach is revolutionizing how we do ${businessIntel.name} in ${location}..."`
      ]
    },
    {
      type: 'Problem Solution',
      focus: `Address specific ${businessIntel.name} challenges in ${location}`,
      examples: [
        `"I've noticed that many ${location} businesses struggle with..."`,
        `"Here's a common challenge in ${businessIntel.name} and how we solve it..."`,
        `"Let me share what I've learned about overcoming this ${businessIntel.name} obstacle..."`
      ]
    },
    {
      type: 'Success Celebration',
      focus: `Celebrate local ${businessIntel.name} achievements`,
      examples: [
        `"I'm thrilled to share some amazing news from our ${location} community..."`,
        `"This success story is exactly why I love ${businessIntel.name} in ${location}..."`,
        `"Let's celebrate this incredible achievement together..."`
      ]
    }
  ];

  const selectedAngle = contentAngles[seed % contentAngles.length];

  return {
    contentStrategy: contentStrategy,
    writingStyle: writingStyle,
    contentAngle: selectedAngle,
    uniqueSignature: `${selectedAngle.type}-${contentStrategy.name}-${writingStyle.name}-${seed}`,
    localPhrases: (businessIntel.localPhrases || ['professional service', 'quality results', 'trusted expertise']).slice(0, 3),
    engagementHooks: businessIntel.localExpertise.engagementHooks.slice(0, 3),
    marketInsights: businessIntel.localExpertise.marketDynamics.slice(0, 2)
  };
}

// Helper functions for context generation
function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

function generateContextualTrends(businessType: string, location: string): any[] {
  const trends = [
    { topic: `${businessType} innovation trends`, category: 'Industry', relevance: 'high' },
    { topic: `${location} business growth`, category: 'Local', relevance: 'high' },
    { topic: 'Digital transformation', category: 'Technology', relevance: 'medium' },
    { topic: 'Customer experience optimization', category: 'Business', relevance: 'high' },
    { topic: 'Sustainable business practices', category: 'Trends', relevance: 'medium' }
  ];
  return trends.slice(0, 3);
}

function generateWeatherContext(location: string): any {
  // Simplified weather context based on location and season
  const season = getSeason();
  const contexts = {
    'Spring': { condition: 'Fresh and energizing', business_impact: 'New beginnings, growth opportunities', content_opportunities: 'Renewal, fresh starts, growth themes' },
    'Summer': { condition: 'Bright and active', business_impact: 'High energy, outdoor activities', content_opportunities: 'Vibrant colors, active lifestyle, summer solutions' },
    'Fall': { condition: 'Cozy and productive', business_impact: 'Planning, preparation, harvest', content_opportunities: 'Preparation, results, autumn themes' },
    'Winter': { condition: 'Focused and strategic', business_impact: 'Planning, reflection, indoor focus', content_opportunities: 'Planning, strategy, winter solutions' }
  };

  return {
    temperature: '22',
    condition: contexts[season as keyof typeof contexts].condition,
    business_impact: contexts[season as keyof typeof contexts].business_impact,
    content_opportunities: contexts[season as keyof typeof contexts].content_opportunities
  };
}

// NEW: Generate business-specific weather impact analysis
function generateBusinessWeatherImpact(weatherCondition: string, businessType: string): string {
  const condition = weatherCondition.toLowerCase();

  const businessWeatherImpacts: Record<string, Record<string, string>> = {
    'restaurant': {
      'rain': 'Customers prefer indoor dining, delivery orders may increase',
      'sunny': 'Perfect for outdoor seating and patio dining',
      'cold': 'Hot food and warm beverages are more appealing',
      'hot': 'Cold drinks, ice cream, and light meals are in demand',
      'default': 'Weather affects dining preferences and customer comfort'
    },
    'fitness': {
      'rain': 'Indoor workouts become more popular, gym attendance may increase',
      'sunny': 'Outdoor fitness activities and sports are favored',
      'cold': 'Indoor heating and warm-up activities are important',
      'hot': 'Hydration and cooling become critical for workouts',
      'default': 'Weather impacts exercise preferences and safety considerations'
    },
    'retail': {
      'rain': 'Customers may prefer online shopping or covered shopping areas',
      'sunny': 'Great weather for shopping trips and outdoor displays',
      'cold': 'Winter clothing and heating products are in demand',
      'hot': 'Summer clothing and cooling products are popular',
      'default': 'Weather influences shopping behavior and product demand'
    },
    'beauty': {
      'rain': 'Hair protection and skincare for humidity are important',
      'sunny': 'Sun protection and summer beauty routines are needed',
      'cold': 'Moisturizing and winter skincare become priorities',
      'hot': 'Lightweight products and sweat-proof makeup are preferred',
      'default': 'Weather affects beauty routines and product needs'
    }
  };

  const businessImpacts = businessWeatherImpacts[businessType.toLowerCase()] || businessWeatherImpacts['retail'];

  // Find the most relevant weather condition
  for (const [weatherKey, impact] of Object.entries(businessImpacts)) {
    if (weatherKey !== 'default' && condition.includes(weatherKey)) {
      return impact;
    }
  }

  return businessImpacts['default'];
}

// NEW: Generate weather-based content opportunities
function generateWeatherContentOpportunities(weatherCondition: string, businessType: string): string {
  const condition = weatherCondition.toLowerCase();

  const contentOpportunities: Record<string, Record<string, string>> = {
    'restaurant': {
      'rain': 'Cozy indoor dining promotions, comfort food specials, delivery deals',
      'sunny': 'Outdoor seating highlights, fresh salads, cold beverages',
      'cold': 'Hot soup specials, warm drink promotions, hearty meal deals',
      'hot': 'Cold appetizers, frozen treats, refreshing drink specials',
      'default': 'Seasonal menu highlights and weather-appropriate dining experiences'
    },
    'fitness': {
      'rain': 'Indoor workout challenges, gym membership promotions, home fitness tips',
      'sunny': 'Outdoor fitness classes, running groups, sports activities',
      'cold': 'Winter fitness motivation, indoor training programs, warm-up routines',
      'hot': 'Hydration tips, early morning workouts, cooling strategies',
      'default': 'Weather-appropriate fitness motivation and safety tips'
    },
    'retail': {
      'rain': 'Indoor shopping comfort, umbrella promotions, cozy product highlights',
      'sunny': 'Outdoor lifestyle products, summer collections, sun protection items',
      'cold': 'Winter clothing sales, heating products, warm accessories',
      'hot': 'Summer sales, cooling products, lightweight clothing',
      'default': 'Seasonal product promotions and weather-appropriate shopping experiences'
    },
    'beauty': {
      'rain': 'Humidity-proof beauty tips, hair protection products, waterproof makeup',
      'sunny': 'Sun protection skincare, summer beauty routines, SPF products',
      'cold': 'Winter skincare tips, moisturizing products, lip protection',
      'hot': 'Sweat-proof makeup, cooling skincare, lightweight summer products',
      'default': 'Weather-appropriate beauty tips and seasonal product recommendations'
    }
  };

  const opportunities = contentOpportunities[businessType.toLowerCase()] || contentOpportunities['retail'];

  // Find the most relevant weather condition
  for (const [weatherKey, opportunity] of Object.entries(opportunities)) {
    if (weatherKey !== 'default' && condition.includes(weatherKey)) {
      return opportunity;
    }
  }

  return opportunities['default'];
}

function generateLocalOpportunities(businessType: string, location: string): any[] {
  const opportunities = [
    { name: `${location} Business Expo`, venue: 'Local Convention Center', relevance: 'networking' },
    { name: `${businessType} Innovation Summit`, venue: 'Business District', relevance: 'industry' },
    { name: 'Local Entrepreneur Meetup', venue: 'Community Center', relevance: 'community' }
  ];
  return opportunities.slice(0, 2);
}

// Direct Vertex AI models (no proxy dependencies)
const REVO_1_0_IMAGE_MODEL = 'gemini-2.5-flash-image'; // Direct Vertex AI model
const REVO_1_0_TEXT_MODEL = 'gemini-2.5-flash'; // Direct Vertex AI model

// Direct Vertex AI function (no proxy dependencies)
async function generateContentDirect(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean): Promise<any> {

  // Check if Vertex AI is enabled
  if (!process.env.VERTEX_AI_ENABLED || process.env.VERTEX_AI_ENABLED !== 'true') {
    throw new Error('🚫 Vertex AI is not enabled. Please set VERTEX_AI_ENABLED=true in your environment variables.');
  }

  try {
    if (isImageGeneration) {
      // Handle multimodal requests (text + images) for image generation
      let prompt: string;
      let logoImage: string | undefined;

      if (Array.isArray(promptOrParts)) {
        // Extract text parts
        const textParts = promptOrParts.filter(part => typeof part === 'string');
        prompt = textParts.join(' ');

        // Extract image parts (logo)
        const imageParts = promptOrParts.filter(part =>
          typeof part === 'object' && part.inlineData
        );

        if (imageParts.length > 0) {
          // Convert back to data URL format for Vertex AI
          const firstImage = imageParts[0];
          const mimeType = firstImage.inlineData.mimeType || 'image/png';
          logoImage = `data:${mimeType};base64,${firstImage.inlineData.data}`;
        }
      } else {
        prompt = promptOrParts;
      }

      const result = await getVertexAIClient().generateImage(prompt, modelName, {
        temperature: 0.7,
        maxOutputTokens: 8192,
        logoImage
      });

      // Convert to expected format
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
            }
          }]
        }
      };
    } else {
      // Text generation using Vertex AI
      let prompt: string;
      if (Array.isArray(promptOrParts)) {
        // Extract text parts only
        const textParts = promptOrParts.filter(part => typeof part === 'string');
        prompt = textParts.join(' ');
      } else {
        prompt = promptOrParts;
      }

      const result = await getVertexAIClient().generateText(prompt, modelName, {
        temperature: 0.7,
        maxOutputTokens: 8192
      });

      // Convert to expected format
      return {
        response: {
          text: () => result.text
        }
      };
    }
  } catch (error) {
    console.error('❌ Revo 1.0: Direct Vertex AI call failed:', error);
    throw new Error(`Revo 1.0 direct generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Direct Vertex AI function (replaces proxy routing)
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  return await generateContentDirect(promptOrParts, modelName, isImageGeneration);
}

/**
 * Get platform-specific aspect ratio - ALL PLATFORMS USE 1:1 FOR HIGHEST QUALITY
 */
function getPlatformAspectRatio(platform: string): '1:1' | '16:9' | '9:16' | '21:9' | '4:5' {
  // ALL PLATFORMS USE 1:1 SQUARE FOR MAXIMUM QUALITY
  // No cropping = No quality loss from Gemini's native 1024x1024
  return '1:1';
}

/**
 * Get platform-specific dimension text for prompts
 * MOBILE-FIRST: Optimized for 992x1056px format
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  switch (aspectRatio) {
    case '1:1': return '992x1056px HD (Mobile-optimized)';
    case '16:9': return '992x1056px HD (Mobile-optimized)';
    case '9:16': return 'Portrait format - 1080x1920px (Stories/Reels)';
    case '4:5': return '992x1056px HD (Mobile-optimized)';
    case '21:9': return '992x1056px HD (Mobile-optimized)';
    default: return '992x1056px HD (Mobile-optimized)';
  }
}

/**
 * Content diversity tracking system to prevent duplication
 */
class ContentDiversityTracker {
  private static recentContent: Array<{
    headline: string;
    subheadline: string;
    caption: string;
    timestamp: number;
  }> = [];

  static addContent(content: { headline: string; subheadline: string; caption: string }) {
    this.recentContent.push({
      ...content,
      timestamp: Date.now()
    });
    
    // Keep only last 20 pieces of content to prevent memory issues
    if (this.recentContent.length > 20) {
      this.recentContent = this.recentContent.slice(-20);
    }
  }

  static checkDiversity(content: { headline: string; subheadline: string; caption: string }): {
    isDiverse: boolean;
    duplications: string[];
    similarityScore: number;
  } {
    const duplications: string[] = [];
    let maxSimilarity = 0;

    // Check for specific repetitive patterns
    this.checkRepetitivePatterns(content, duplications);

    for (const existing of this.recentContent) {
      // Check headline similarity
      const headlineSimilarity = this.calculateSimilarity(content.headline, existing.headline);
      if (headlineSimilarity > 0.8) {
        duplications.push(`Headline too similar to recent content: "${existing.headline}"`);
      }

      // Check subheadline similarity
      const subheadlineSimilarity = this.calculateSimilarity(content.subheadline, existing.subheadline);
      if (subheadlineSimilarity > 0.8) {
        duplications.push(`Subheadline too similar to recent content: "${existing.subheadline}"`);
      }

      // Check overall content similarity
      const overallSimilarity = (
        headlineSimilarity + 
        subheadlineSimilarity + 
        this.calculateSimilarity(content.caption, existing.caption)
      ) / 3;

      maxSimilarity = Math.max(maxSimilarity, overallSimilarity);
      
      if (overallSimilarity > 0.7) {
        duplications.push('Overall content too similar to recent generation');
      }
    }

    return {
      isDiverse: duplications.length === 0,
      duplications,
      similarityScore: maxSimilarity
    };
  }

  private static checkRepetitivePatterns(content: { headline: string; subheadline: string; caption: string }, duplications: string[]) {
    const headline = content.headline.toLowerCase();
    const caption = content.caption.toLowerCase();

    // Check for banned headline patterns
    const bannedHeadlinePatterns = [
      /unlock\s+.*('s|s)?\s+/i,
      /.*'s\s+best\s+/i,
      /experience\s+the\s+/i,
      /discover\s+.*\s+in\s+/i,
      /transform\s+your\s+/i,
      /your\s+.*\s+solution/i
    ];

    for (const pattern of bannedHeadlinePatterns) {
      if (pattern.test(headline)) {
        duplications.push(`Headline uses banned repetitive pattern: "${content.headline}"`);
        break;
      }
    }

    // Check for banned caption starters
    const bannedCaptionStarters = [
      /^experience\s+/i,
      /^imagine\s+/i,
      /^discover\s+the\s+/i,
      /^welcome\s+to\s+/i,
      /^at\s+.*,\s+we\s+/i,
      /^quality\s+service/i
    ];

    for (const pattern of bannedCaptionStarters) {
      if (pattern.test(caption)) {
        duplications.push(`Caption uses banned repetitive starter: "${content.caption.substring(0, 50)}..."`);
        break;
      }
    }
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const words1 = str1.toLowerCase().split(' ').filter(w => w.length > 3); // Filter out small words
    const words2 = str2.toLowerCase().split(' ').filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  static clearHistory() {
    this.recentContent = [];
  }
}

/**
 * Quality validation system for generated content
 */
function validateContentQuality_Enhanced(
  content: any,
  businessName: string,
  businessType: string
): { isValid: boolean; issues: string[]; score: number } {
  const issues: string[] = [];
  let score = 10;

  // Check for content duplication indicators
  const contentText = `${content.headline || ''} ${content.subheadline || ''} ${content.caption || ''}`.toLowerCase();
  
  // Check for banned risky claims
  const bannedClaims = [
    'faster than',
    'zero fees',
    'zero transaction fees',
    'no fees',
    'instant',
    'cheapest',
    'lowest price',
    'best',
    '#1'
  ];
  
  for (const claim of bannedClaims) {
    if (contentText.includes(claim)) {
      issues.push(`Contains risky claim: "${claim}" - could lead to legal issues or customer complaints`);
      score -= 2;
    }
  }
  
  // Check for weak CTAs
  const weakCTAs = [
    'get digital wallet',
    'learn more',
    'contact us',
    'get business account free'
  ];
  
  const cta = (content.callToAction || '').toLowerCase();
  for (const weakCTA of weakCTAs) {
    if (cta.includes(weakCTA)) {
      issues.push(`Weak CTA detected: "${content.callToAction}" - should be more specific and actionable`);
      score -= 1;
    }
  }
  
  // Check for business specificity
  const hasBusinessName = contentText.includes(businessName.toLowerCase());
  const hasBusinessType = contentText.includes(businessType.toLowerCase());
  
  if (!hasBusinessName && !hasBusinessType) {
    issues.push('Content lacks business specificity - should mention business name or type');
    score -= 1;
  }
  
  // Check for generic phrases
  const genericPhrases = [
    'quality service',
    'professional service', 
    'best service',
    'contact us today'
  ];
  
  for (const phrase of genericPhrases) {
    if (contentText.includes(phrase)) {
      issues.push(`Contains generic phrase: "${phrase}" - content should be more specific`);
      score -= 0.5;
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(score, 0)
  };
}

/**
 * Generate content using Revo 1.0 with Gemini 2.5 Flash Image Preview
 */
export async function generateRevo10Content(input: {
  businessType: string;
  businessName: string;
  location: string;
  platform: string;
  writingTone: string;
  contentThemes: string[];
  targetAudience: string;
  services: string;
  keyFeatures: string;
  competitiveAdvantages: string;
  dayOfWeek: string;
  currentDate: string;
  primaryColor?: string;
  visualStyle?: string;
  includeContacts?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  websiteUrl?: string;
  followBrandColors?: boolean;
  useLocalLanguage?: boolean; // When true, mix local language with English; when false, use 100% English
  scheduledServices?: ScheduledService[]; // NEW: Scheduled services integration
  includePeople?: boolean; // NEW: People in designs toggle
}) {
  try {
    // Auto-detect platform-specific aspect ratio
    const aspectRatio = getPlatformAspectRatio(input.platform);

    // Convert input to BusinessProfile for advanced analysis
    const businessProfile: BusinessProfile = {
      businessName: input.businessName,
      businessType: input.businessType,
      location: input.location,
      targetAudience: input.targetAudience,
      brandVoice: input.writingTone,
      uniqueSellingPoints: [input.competitiveAdvantages || 'Quality service'],
      competitors: [], // Could be enhanced with competitor data
    };

    // 📊 GENERATE ADVANCED CONTENT WITH DEEP ANALYSIS
    const advancedContent = await advancedContentGenerator.generateEngagingContent(
      businessProfile,
      input.platform,
      'promotional'
    );

    // 🎯 GET TRENDING INSIGHTS FOR ENHANCED RELEVANCE
    const trendingEnhancement = await trendingEnhancer.getTrendingEnhancement({
      businessType: input.businessType,
      platform: input.platform,
      location: input.location,
      targetAudience: input.targetAudience,
    });

    // 📈 ANALYZE PERFORMANCE FOR CONTINUOUS IMPROVEMENT
    const performanceAnalysis = performanceAnalyzer.analyzePerformance(
      advancedContent,
      businessProfile
    );

    // Extract hashtags from advanced content for use in business-specific generation
    const hashtags = advancedContent.hashtags;

    // Gather enhanced real-time context data with scheduled services integration
    const realTimeContext = await gatherRealTimeContext(
      input.businessType,
      input.location,
      input.platform,
      input.brandId, // Pass brandId for calendar access
      input.scheduledServices || [] // Pass scheduled services from input
    );

    // 🎯 ENHANCED: Scheduled Services Integration from Real-Time Context (Revo 2.0 Style)
    let serviceFocus = '';
    let serviceContext = '';
    let featuredServices: any[] = [];

    // Use scheduled services from enhanced real-time context OR direct input
    let scheduledServices = realTimeContext.scheduledServices || input.scheduledServices || [];
    
    // 🚨 TEMPORARY: Create test scheduled service if none provided (for debugging)
    if (scheduledServices.length === 0 && input.businessName?.toLowerCase().includes('paya')) {
      scheduledServices = [{
        serviceId: 'payments-001',
        serviceName: 'Payments',
        description: 'Fast, secure digital payments and money transfers',
        contentType: 'promotional',
        platform: input.platform,
        priority: 'high',
        isToday: true,
        isUpcoming: false,
        daysUntil: 0
      }];
      console.log('🚨 [Revo 1.0] Created test scheduled service for Paya:', scheduledServices);
    }

    console.log('🎯 [Revo 1.0] Scheduled Services Debug:', {
      totalScheduledServices: scheduledServices.length,
      scheduledServices: scheduledServices,
      inputScheduledServices: input.scheduledServices || [],
      realTimeContextKeys: Object.keys(realTimeContext)
    });

    if (scheduledServices.length > 0) {
      const todaysServices = scheduledServices.filter((s: any) => s.isToday);
      const upcomingServices = scheduledServices.filter((s: any) => s.isUpcoming);
      
      console.log('🎯 [Revo 1.0] Service Filtering Debug:', {
        todaysServicesCount: todaysServices.length,
        todaysServices: todaysServices,
        upcomingServicesCount: upcomingServices.length,
        upcomingServices: upcomingServices
      });

      if (todaysServices.length > 0) {
        serviceFocus = todaysServices.map((s: any) => s.serviceName).join(', ');
        serviceContext = `\n\n🚨🚨🚨 MANDATORY SERVICE FOCUS - THIS OVERRIDES EVERYTHING 🚨🚨🚨\n\n🎯 TODAY'S FEATURED SERVICES (ABSOLUTE PRIORITY - MUST FOCUS ON THESE):\n${todaysServices.map((s: any) => `- ${s.serviceName}: ${s.description || 'Premium service offering'}`).join('\n')}\n\n⚠️ CRITICAL REQUIREMENTS:\n- Content MUST be specifically about ${todaysServices.map((s: any) => s.serviceName).join(', ')}\n- Headlines MUST relate to ${todaysServices[0].serviceName}\n- DO NOT create generic financial content\n- DO NOT use vague terms like "financial journey" or "financial horizon"\n- BE SPECIFIC: If it's Payments, talk about payments, transactions, sending money\n- Examples for Payments: "Send Money Instantly", "Pay Anyone, Anywhere", "Seamless Payment Solutions"\n\n🚫 FORBIDDEN CORPORATE JARGON (NEVER USE):\n- "Step into a world where..." ❌\n- "Tired of [X]? Try [Y]" ❌\n- "We're dedicated to..." ❌\n- "Redefines [industry]" ❌\n- "Experience seamless..." ❌\n- "Unlock your..." ❌\n- "Elevate your..." ❌\n- "Transform your..." ❌\n- "Navigating your [X] should be effortless" ❌\n- "Done right" / "Built for you" ❌\n- "[Product] puts [feature] front and center" ❌\n- "brings a human, professional touch to..." ❌\n- "authentic, high-impact" ❌\n- "reliable, modern" ❌\n\n✅ HUMAN CONTENT RULES (MANDATORY):\n1. START WITH CRISIS/CONFLICT:\n   - "It's 2pm. Your supplier needs payment now. Bank transfer takes 2 days. Client meeting at 4pm..."\n   - "Week 3 of semester. Your laptop crashes during group project at midnight. Everyone's counting on you."\n   - "Three customers walked away this week. Not because your prices were wrong—because paying upfront was too much."\n\n2. USE SPECIFIC DETAILS:\n   - Times: Monday, 8am, Week 3, 2pm\n   - Amounts: KES 15,000, KES 847, KES 3,200\n   - Places: Gikomba, Mombasa Road, Eastleigh, Westlands\n   - Items: textbooks, school shoes, matatu ride\n\n3. TELL STORIES WITH CHARACTERS:\n   - "Mama Wanjiku runs three market stalls in Gikomba. Last month, she lost KES 15,000 to a payment scam..."\n   - Use real Kenyan names: Mama Wanjiku, Kamau, Akinyi\n   - Show what happened, how they felt, resolution\n\n4. CONVERSATIONAL LANGUAGE:\n   - Write how people actually talk\n   - Use contractions (you're, it's, we've)\n   - Local context: matatu, boda boda, MPESA\n   - Swahili phrases when appropriate\n\n5. SHOW EMOTION, DON'T STATE IT:\n   - "You watched them leave. That hurt." ✓\n   - NOT "stress-free" or "effortless" ❌\n\n6. REAL VERBS ONLY:\n   ❌ Experience, Explore, Discover, Unlock, Transform, Elevate, Revolutionize, Navigate\n   ✅ Crashed, Walked away, Lost, Stuck, Waiting, Failed, Broke down\n\n7. TEST: Could this be ANY product? If yes, REWRITE.\n\n✅ PAYMENT-SPECIFIC HUMAN CONTENT EXAMPLES:\n- "It's Monday morning. Your daughter needs new school shoes by Wednesday. The textbook list just came—5 books at KES 3,200 each. Your account says KES 847."\n- "Between the matatu ride to your meeting and the bank queue that never moves—your whole morning's gone. Your supplier's still waiting."\n- "Mama Wanjiku's phone buzzes. 'Payment confirmed.' Her customer smiles. No cash counting. No change drama. Just done."`;
        featuredServices = todaysServices;
      } else if (upcomingServices.length > 0) {
        serviceFocus = upcomingServices[0].serviceName;
        serviceContext = `\n\n📅 UPCOMING SERVICE HIGHLIGHT (Priority Focus):\n- ${upcomingServices[0].serviceName}: ${upcomingServices[0].description || 'Coming soon'}\n\n⚠️ Build anticipation for this upcoming service.`;
        featuredServices = [upcomingServices[0]];
      }
    }

    // Direct Vertex AI model initialization

    // Debug logging for contact information

    // Store original contact info for image generation, but remove from content generation
    const originalContactInfo = input.contactInfo;
    const originalWebsiteUrl = input.websiteUrl;
    const originalIncludeContacts = input.includeContacts;

    // Temporarily remove contact info during content generation to prevent AI from accessing it
    const contentGenerationInput = {
      ...input,
      contactInfo: undefined,
      websiteUrl: undefined,
      includeContacts: false
    };

    // Generate product-specific language BEFORE template replacement
    const todaysServices = scheduledServices ? scheduledServices.filter((s: any) => s.isToday).map((s: any) => s.serviceName) : [];
    const productLanguage = generateProductSpecificLanguage(todaysServices);

    // Generate unique session identifiers to prevent AI repetition
    const globalUniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
    const diversitySeed = Math.floor(Math.random() * 100000);
    
    // Inject global uniqueness requirements
    const uniquenessInjection = `

🚨 GLOBAL CONTENT UNIQUENESS SYSTEM:
- Unique Generation ID: ${globalUniqueId}
- Diversity Seed: ${diversitySeed}
- MANDATE: Create completely unique content that breaks previous patterns
- FORBIDDEN: Reusing phrases, structures, or approaches from previous generations
- REQUIRED: Fresh vocabulary, new sentence structures, different emotional appeals
- GOAL: Every piece of content must feel like it was written by a different creative expert

🚨 CRITICAL ANTI-REPETITION PATTERNS (NEVER USE THESE):
❌ BANNED HEADLINE PATTERNS:
- "Unlock [Location]'s [Something]" or any "Unlock" variations
- "[Location]'s Best [Service]" or "Best-Kept Secret" patterns
- "Experience the [Something]" or "Experience [Business]" patterns
- "Discover [Service] in [Location]" patterns
- "Transform Your [Something]" patterns
- "Your [Service] Solution" patterns

❌ BANNED CAPTION STARTERS:
- "Experience effortless..." or any "Experience" beginnings
- "Imagine seamless..." or any "Imagine" beginnings  
- "Discover the difference..." patterns
- "Welcome to [Business]..." openings
- "At [Business], we..." corporate speak
- "Quality service..." or "Professional excellence" phrases

❌ BANNED CTA PATTERNS:
- "Download App" (overused - be more creative!)
- "Learn More" (generic)
- "Get Started" (boring)
- "Contact Us" (passive)

✅ REQUIRED CREATIVITY:
- Use completely different headline structures each time
- Start captions with fresh, unexpected openings
- Create unique, engaging CTAs that specify the actual benefit
- Vary emotional appeals: excitement, curiosity, urgency, social proof, etc.
- Use different vocabulary and sentence lengths
- Take unique creative angles that haven't been used before

🎯 CREATIVE MANDATE: If you find yourself using familiar patterns, STOP and create something completely different!

🚫 FORBIDDEN CONTENT:
- Do NOT invent business details not provided
- Do NOT add generic claims like "fastest", "cheapest", "best" without proof
- Do NOT create fake testimonials or statistics
- Do NOT add contact information not explicitly provided
- Do NOT use template phrases or boilerplate content

✅ REQUIRED APPROACH:
- Use ONLY the actual business information provided
- If a field shows [FIELD_NOT_PROVIDED], omit that aspect entirely
- Create unique content based on real business data
- For Kenya businesses: Add "T&Cs apply" for financial claims
- Mention the actual business name and type in the content`;

    // 🚨 STRICT BUSINESS DATA GUARDRAILS - ZERO HALLUCINATION POLICY
    const businessDataGuardrails = `
🚨 ZERO HALLUCINATION POLICY - CRITICAL BUSINESS DATA RULES:

❌ ABSOLUTELY FORBIDDEN - DO NOT INVENT:
- Specific amounts (KSh 300,000, $1000, etc.) unless explicitly provided
- Timelines or speeds ("in 5 minutes", "same day", "instant") unless stated
- Fees, rates, or pricing ("low fees", "competitive rates") unless given
- Approval processes ("no credit checks", "fast approval") unless confirmed
- Payment methods ("M-Pesa", "mobile money") unless specified
- Geographic details beyond what's provided (specific cities, regions)
- Customer numbers or statistics unless explicitly stated
- Technical features not mentioned in business profile
- Competitive claims ("best", "fastest", "cheapest") without proof

✅ ONLY USE WHAT'S EXPLICITLY PROVIDED:
- Exact business name as given
- Exact business type as stated  
- Only services listed in the business profile
- Only features explicitly mentioned
- Only contact information provided
- Only target audience specified
- Only competitive advantages listed

🎯 CONTENT CREATION RULES:
- Build content ONLY from provided business information
- If information is missing, omit that aspect entirely
- Use exact wording from business profile when possible
- Create engaging content without adding unsourced details
- For Kenya businesses: Add "T&Cs apply" only for financial services

🚫 VIOLATION EXAMPLES TO AVOID:
- "Get KSh 50,000 in minutes" (amount + timeline not provided)
- "No collateral required" (process detail not confirmed)
- "Trusted by 10,000+ customers" (statistic not given)
- "Best rates in Kenya" (competitive claim without proof)
- "Instant M-Pesa disbursement" (method + speed not specified)

`;

    // Build the content generation prompt with strict business data validation
    const contentPrompt = (businessDataGuardrails + revo10Prompts.CONTENT_USER_PROMPT_TEMPLATE + uniquenessInjection)
      .replace('{businessName}', contentGenerationInput.businessName || '[BUSINESS_NAME_MISSING]')
      .replace('{businessType}', contentGenerationInput.businessType || '[BUSINESS_TYPE_MISSING]')
      .replace('{platform}', contentGenerationInput.platform)
      .replace('{writingTone}', contentGenerationInput.writingTone || 'professional')
      .replace('{location}', contentGenerationInput.location || '[LOCATION_NOT_PROVIDED]')
      .replace('{primaryColor}', contentGenerationInput.primaryColor || '[COLOR_NOT_PROVIDED]')
      .replace('{visualStyle}', contentGenerationInput.visualStyle || 'modern')
      .replace('{targetAudience}', contentGenerationInput.targetAudience || '[AUDIENCE_NOT_PROVIDED]')
      .replace('{services}', serviceFocus + serviceContext || '[SERVICES_NOT_PROVIDED]')
      .replace('{keyFeatures}', contentGenerationInput.keyFeatures || '[FEATURES_NOT_PROVIDED]')
      .replace('{productLanguage}', `
🎯 PRODUCT-SPECIFIC LANGUAGE REQUIREMENTS:
- Primary Product Type: ${productLanguage.primaryProduct}
- Use Specific Action Language: ${productLanguage.specificLanguage}
- Available Action Words: ${(productLanguage.actionWords || []).join(', ')}
- Product Descriptors: ${(productLanguage.descriptors || []).join(', ')}

⚠️ CRITICAL: Instead of generic terms like "tech", "product", or "service", use the SPECIFIC product language above.
Examples:
- ❌ "Upgrade your tech" → ✅ "${productLanguage.specificLanguage}"
- ❌ "Get our products" → ✅ "Get our ${productLanguage.primaryProduct}"
- ❌ "Quality tech solutions" → ✅ "${(productLanguage.descriptors || ['quality'])[0]} ${productLanguage.primaryProduct}"

This makes content more engaging and specific to what you're actually selling.`)
      .replace('{competitiveAdvantages}', contentGenerationInput.competitiveAdvantages || '[ADVANTAGES_NOT_PROVIDED]')
      .replace('{contentThemes}', Array.isArray(contentGenerationInput.contentThemes) ? contentGenerationInput.contentThemes.join(', ') : '[THEMES_NOT_PROVIDED]')
      .replace('{contactPhone}', '') // Contact details will be added during image generation
      .replace('{contactEmail}', '') // Contact details will be added during image generation
      .replace('{contactAddress}', '') // Contact details will be added during image generation
      .replace('{websiteUrl}', ''); // Contact details will be added during image generation

    // 🔥 ENHANCED: Add RSS Data and Relevance Insights to Content Prompt
    let enhancedContentPrompt = contentPrompt;

    // Add RSS insights if available
    if (realTimeContext.rssData && realTimeContext.rssData.articles.length > 0) {
      const rssInsights = `\n\n📰 CURRENT NEWS & TRENDS (Use these insights to make content timely and relevant):
${(realTimeContext.rssData.insights || []).join('\n')}

🔥 TRENDING TOPICS: ${(realTimeContext.rssData.trends || []).slice(0, 5).join(', ')}

📈 RELEVANT NEWS HEADLINES:
${(realTimeContext.rssData.articles || []).slice(0, 3).map((article: any) => `- ${article.title}`).join('\n')}

💡 CONTENT OPPORTUNITIES: Use these current events to create timely, engaging content that connects your business to what's happening now.`;

      enhancedContentPrompt += rssInsights;
    }

    // Add relevance insights if available
    if (realTimeContext.relevanceInsights && realTimeContext.relevanceInsights.length > 0) {
      const relevanceSection = `\n\n🎯 DATA RELEVANCE INSIGHTS:
${(realTimeContext.relevanceInsights || []).join('\n')}

📊 CONTEXT SUMMARY: ${realTimeContext.relevanceSummary || 'Focus on core business messaging with available contextual enhancements.'}`;

      enhancedContentPrompt += relevanceSection;
    }

    // Add high-relevance data insights
    if (realTimeContext.highRelevanceData && realTimeContext.highRelevanceData.length > 0) {
      const highRelevanceSection = `\n\n⭐ HIGH-PRIORITY CONTEXTUAL DATA (Integrate these into content):
${realTimeContext.highRelevanceData.map((item: any) => {
        if (item.type === 'scheduled_service') {
          return `🎯 SCHEDULED: ${item.content.serviceName} - ${item.content.description || 'Priority service'}`;
        } else if (item.type === 'rss' || item.type === 'news') {
          return `📰 NEWS: ${item.content.title}`;
        } else if (item.type === 'weather') {
          return `🌤️ WEATHER: ${item.content.condition} - ${item.content.business_impact}`;
        } else if (item.type === 'event') {
          return `🎉 EVENT: ${item.content.description}`;
        }
        return `📌 ${item.type.toUpperCase()}: ${JSON.stringify(item.content).substring(0, 100)}`;
      }).join('\n')}`;

      enhancedContentPrompt += highRelevanceSection;
    }

    // Debug logging for the enhanced prompt

    // 🎨 CREATIVE CAPTION GENERATION: Apply creative enhancement system

    // NEW: Get business intelligence and local marketing expertise
    const businessIntel = getBusinessIntelligenceEngine(input.businessType, input.location);
    const randomSeed = Math.floor(Math.random() * 10000) + Date.now();
    const uniqueContentVariation = generateUniqueContentVariation(input.businessType, input.location, randomSeed % 1000);

    // 🎯 STRATEGIC LOCATION MENTION SYSTEM
    // Only 40% of content should include location references for variety and broader market appeal
    const shouldIncludeLocationContext = Math.random() < 0.40; // 40% chance for location mentions

    // 🛍️ STRATEGIC PRODUCT SPECIFICATION USAGE SYSTEM
    // Only 50% of content should prominently feature product specifications for variety
    const shouldUseProductSpecs = Math.random() < 0.50; // 50% chance for product spec focus

    // 🎯 NEW: Generate business-specific content strategy with enhanced product focus

    // Extract product specifications from scheduled services
    const extractProductSpecs = (services: any[]): any => {
      const specs = {
        hasSpecs: false,
        pricing: [],
        features: [],
        specifications: [],
        urgencyIndicators: []
      };

      services.forEach(service => {
        if (service.description) {
          const desc = service.description;

          // Extract pricing
          const priceMatches = desc.match(/\$[\d,]+|\d+\s*GB|\d+MP|starting at \$[\d,]+/gi);
          if (priceMatches) {
            specs.pricing.push(...priceMatches);
            specs.hasSpecs = true;
          }

          // Extract technical specifications
          const techSpecs = desc.match(/\d+GB|\d+MP|A\d+\s*Pro|Pro\s*chip|camera\s*system|titanium|storage/gi);
          if (techSpecs) {
            specs.specifications.push(...techSpecs);
            specs.hasSpecs = true;
          }

          // Extract features
          const features = desc.match(/Pro|chip|camera|system|design|available|colors?|free\s*shipping|trade-in/gi);
          if (features) {
            specs.features.push(...features);
          }

          // Extract urgency indicators
          const urgency = desc.match(/available\s*now|today\s*only|limited\s*time|while\s*supplies\s*last|free\s*shipping/gi);
          if (urgency) {
            specs.urgencyIndicators.push(...urgency);
          }
        }
      });

      return specs;
    };

    const productSpecs = scheduledServices ? extractProductSpecs(scheduledServices.filter((s: any) => s.isToday)) : { hasSpecs: false };

    const businessDetails = {
      experience: '5+ years', // Could be extracted from business profile
      expertise: input.keyFeatures,
      services: serviceFocus, // Use scheduled services focus instead of generic services
      location: input.location,
      targetAudience: input.targetAudience,
      productSpecs: productSpecs, // Enhanced product specifications
      salesFocus: productSpecs.hasSpecs && shouldUseProductSpecs, // Only sales-focused when specs available AND strategy enabled
      contentMode: (productSpecs.hasSpecs && shouldUseProductSpecs) ? 'sales' : 'awareness', // Dynamic content mode
      locationStrategy: {
        includeLocation: shouldIncludeLocationContext,
        purpose: shouldIncludeLocationContext ? 'local_credibility' : 'universal_appeal',
        focus: shouldIncludeLocationContext ? 'community_connection' : 'product_specifications'
      },
      productSpecStrategy: {
        useSpecs: shouldUseProductSpecs && productSpecs.hasSpecs,
        focus: shouldUseProductSpecs ? 'technical_specifications' : 'emotional_benefits',
        approach: shouldUseProductSpecs ? 'product_focused' : 'lifestyle_focused'
      },
      productLanguage: {
        primaryProduct: productLanguage.primaryProduct,
        specificLanguage: productLanguage.specificLanguage,
        actionWords: productLanguage.actionWords,
        descriptors: productLanguage.descriptors
      }
    };

    // Generate strategic content plan based on business type and goals (dynamic based on product specs)
    const contentGoal = businessDetails.salesFocus ? 'conversion' : 'awareness';

    const contentPlan = StrategicContentPlanner.generateBusinessSpecificContent(
      input.businessType,
      input.businessName,
      input.location,
      businessDetails,
      input.platform,
      contentGoal // Dynamic: 'conversion' for sales, 'awareness' for general
    );

    // 🎨 DIRECT AI GENERATION - Bypass template functions entirely
    
    // Generate completely unique content using RANDOMIZED prompt structures
    const promptStructures = [
      // Structure 1: Question-based approach
      `${enhancedContentPrompt}\n\n🎯 QUESTION-DRIVEN CONTENT CREATION:\nYou're a curious marketer asking engaging questions. Create:\n- HOOK QUESTION: Start with "What if...?" or "Ready for...?" or "Tired of...?"\n- ANSWER BENEFIT: 10-15 words explaining the solution\n- STORY CAPTION: Tell a mini-story in 2-3 sentences\n- ACTION CTA: Specific action that solves their problem\n- HASHTAGS: ${input.platform === 'instagram' ? '5' : '3'} relevant tags`,
      
      // Structure 2: Problem-solution approach  
      `${enhancedContentPrompt}\n\n🎯 PROBLEM-SOLUTION CONTENT CREATION:\nYou're a solution-focused expert. Create:\n- PROBLEM HEADLINE: Identify a specific pain point (5-8 words)\n- SOLUTION PROMISE: How you solve it (10-15 words)\n- PROOF CAPTION: Show evidence or results in 2-3 sentences\n- RESULT CTA: What outcome they'll get\n- HASHTAGS: ${input.platform === 'instagram' ? '5' : '3'} relevant tags`,
      
      // Structure 3: Benefit-focused approach
      `${enhancedContentPrompt}\n\n🎯 BENEFIT-FOCUSED CONTENT CREATION:\nYou're an enthusiastic advocate. Create:\n- BENEFIT HEADLINE: Lead with the main advantage (5-8 words)\n- VALUE EXPLANATION: Why it matters (10-15 words)\n- SUCCESS CAPTION: Paint the success picture in 2-3 sentences\n- GET STARTED CTA: How to begin the journey\n- HASHTAGS: ${input.platform === 'instagram' ? '5' : '3'} relevant tags`,
      
      // Structure 4: Social proof approach
      `${enhancedContentPrompt}\n\n🎯 SOCIAL PROOF CONTENT CREATION:\nYou're sharing community success. Create:\n- SOCIAL HEADLINE: "Join [Number] People Who..." format (5-8 words)\n- COMMUNITY BENEFIT: What the community gets (10-15 words)\n- TESTIMONIAL CAPTION: Share a success story or result in 2-3 sentences\n- JOIN CTA: Invitation to join the community\n- HASHTAGS: ${input.platform === 'instagram' ? '5' : '3'} relevant tags`,
      
      // Structure 5: Urgency-driven approach
      `${enhancedContentPrompt}\n\n🎯 URGENCY-DRIVEN CONTENT CREATION:\nYou're creating time-sensitive excitement. Create:\n- URGENT HEADLINE: Include timeframe or limit (5-8 words)\n- SCARCITY REASON: Why they need to act now (10-15 words)\n- FOMO CAPTION: What they'll miss if they wait in 2-3 sentences\n- TIME CTA: Action with deadline or urgency\n- HASHTAGS: ${input.platform === 'instagram' ? '5' : '3'} relevant tags`
    ];
    
    // Add content persona randomization to make AI think differently
    const contentPersonas = [
      "You're an enthusiastic startup founder who gets excited about helping people solve problems",
      "You're a seasoned marketing expert with 15+ years of experience crafting compelling messages", 
      "You're a friendly community leader who knows exactly what local people need and want",
      "You're a creative storyteller who turns business benefits into engaging narratives",
      "You're a results-focused consultant who speaks directly about outcomes and value",
      "You're an innovative disruptor who challenges conventional approaches with fresh ideas"
    ];
    
    const selectedPersona = contentPersonas[diversitySeed % contentPersonas.length];
    const personaInjection = `\n\n🎭 CONTENT PERSONA:\n${selectedPersona}. Write from this perspective and personality.\n`;
    
    // Select random prompt structure to break AI patterns  
    const selectedStructure = promptStructures[diversitySeed % promptStructures.length];
    const directContentPrompt = selectedStructure + personaInjection + `

CREATIVE HEADLINE INSPIRATION (Don't copy - use as creativity sparks):
- Question format: "Ready for [specific benefit]?"
- Number format: "5 Ways [Business] Changes [Life Aspect]"
- Benefit format: "Get [Specific Result] in [Timeframe]"
- Social proof: "Join [Number] Happy [Customers]"
- Urgency format: "[Limited Offer] Ends [Timeframe]"
- Problem-solution: "No More [Problem] - Try [Solution]"
- Local pride: "[Location] Loves [Business] Because..."

CREATIVE CTA INSPIRATION (Don't copy - create unique versions):
- Specific benefit CTAs: "Start Saving Today", "Book Your Session", "Claim Your Spot"
- Urgency CTAs: "Reserve Now", "Join Before It's Full", "Get Early Access"
- Social CTAs: "Join the Community", "See What Others Say", "Share Your Story"
- Value CTAs: "Try Risk-Free", "Get Your Quote", "Unlock Benefits"
- Local CTAs: "Visit Our [Location] Store", "Call [Local Number]", "Find Us Downtown"

CREATIVE CAPTION STARTERS (Don't copy - use for inspiration):
- Question hooks: "What if you could...?", "Ever wondered how...?", "Tired of...?"
- Story hooks: "Last week, a customer told us...", "Here's what happened when..."
- Benefit hooks: "In just [timeframe], you'll...", "[Number] people have already..."
- Local hooks: "Every [Location] resident deserves...", "We've been serving [Location] because..."
- Problem hooks: "Stop struggling with...", "Never again worry about..."

🚨 HUMAN CONTENT RULES (MANDATORY - OVERRIDE ALL OTHER INSTRUCTIONS):

1. NEVER USE CORPORATE JARGON:
❌ "Step into a world where..." ❌ "Experience seamless..." ❌ "Transform your..." ❌ "Unlock your..." ❌ "Elevate your..." ❌ "Redefines [industry]" ❌ "We're dedicated to..." ❌ "Done right" ❌ "Built for you"

2. START WITH CRISIS/CONFLICT (MANDATORY):
✅ "It's 2pm. Your supplier needs payment now. Bank transfer takes 2 days. Client meeting at 4pm..."
✅ "Week 3 of semester. Your laptop crashes during group project at midnight. Everyone's counting on you."
✅ "Three customers walked away this week. Not because your prices were wrong—because paying upfront was too much."

3. USE SPECIFIC DETAILS (MANDATORY):
✅ Times: Monday, 8am, Week 3, 2pm, Friday
✅ Amounts: KES 15,000, KES 847, KES 3,200
✅ Places: Gikomba, Mombasa Road, Eastleigh, Westlands, Nairobi CBD
✅ Items: textbooks, school shoes, matatu ride, MPESA

4. TELL STORIES WITH KENYAN CHARACTERS:
✅ "Mama Wanjiku runs three market stalls in Gikomba. Last month, she lost KES 15,000 to a payment scam..."
✅ Use names: Mama Wanjiku, Kamau, Akinyi, Njeri
✅ Local context: matatu, boda boda, MPESA, Gikomba market

5. CONVERSATIONAL LANGUAGE:
✅ Write how people actually talk
✅ Use contractions (you're, it's, we've)
✅ Short sentences for impact
✅ Local slang when appropriate

6. SHOW EMOTION, DON'T STATE IT:
✅ "You watched them leave. That hurt." 
❌ Never say "stress-free" or "effortless"

7. USE REAL VERBS ONLY:
❌ Experience, Explore, Discover, Unlock, Transform, Elevate, Revolutionize, Navigate
✅ Crashed, Walked away, Lost, Stuck, Waiting, Failed, Broke down, Buzzed, Confirmed

8. TEST: Could this be ANY product? If yes, REWRITE.

Output format:
HEADLINE: [Start with crisis/conflict - specific time/place/amount]
SUBHEADLINE: [Continue the story - show the problem and solution] 
CAPTION: [Complete the story with character, emotion, resolution - 2-3 sentences max]
CTA: [Natural next step from the story]
HASHTAGS: [relevant hashtags]

EXAMPLE FOR PAYMENTS:
HEADLINE: It's Monday Morning. School Fees Due Friday.
SUBHEADLINE: Your account says KES 847. The reminder says KES 15,000. Paya lets you pay over time.
CAPTION: Mama Wanjiku's phone buzzes. "Payment confirmed." Her daughter stays in school. No stress, no drama, just done.
CTA: Pay Smart Today

Remember: HUMAN STORIES ONLY. NO CORPORATE SPEAK. KENYAN CONTEXT ALWAYS.`;

    let businessHeadline, businessSubheadline, businessCaption;
    
    try {
      // Direct AI generation without templates
      const directResult = await generateContentWithProxy(directContentPrompt, 'gemini-2.5-flash', false);
      const directResponse = directResult.response.text();
      
      // Parse the response
      const headlineMatch = directResponse.match(/HEADLINE:\s*([^\n]+)/i);
      const subheadlineMatch = directResponse.match(/SUBHEADLINE:\s*([^\n]+)/i);
      const captionMatch = directResponse.match(/CAPTION:\s*([^\n]+(?:\n[^\n]*)*?)(?=\nCTA:|\nHASHTAGS:|$)/i);
      const ctaMatch = directResponse.match(/CTA:\s*([^\n]+)/i);
      const hashtagsMatch = directResponse.match(/HASHTAGS:\s*([^\n]+)/i);
      
      businessHeadline = {
        headline: headlineMatch ? headlineMatch[1].trim() : `${contentGenerationInput.businessName} - Your ${contentGenerationInput.businessType} Solution`,
        approach: 'direct-ai',
        emotionalImpact: 'engaging'
      };
      
      businessSubheadline = {
        subheadline: subheadlineMatch ? subheadlineMatch[1].trim() : `Professional ${contentGenerationInput.businessType} services for your needs`,
        framework: 'direct-ai',
        benefit: 'value-focused'
      };
      
      businessCaption = {
        caption: captionMatch ? captionMatch[1].trim() : `Discover quality ${contentGenerationInput.businessType} services from ${contentGenerationInput.businessName}. We provide exceptional value and professional results.`,
        callToAction: ctaMatch ? ctaMatch[1].trim() : 'Get Started Today',
        engagementHooks: ['professional service', 'quality results']
      };
      
      // Store hashtags for later use
      var generatedHashtags = hashtagsMatch ? hashtagsMatch[1].trim() : `#${contentGenerationInput.businessType.replace(/\s+/g, '')} #quality #professional`;
      
    } catch (error) {
      console.error('Direct AI generation failed:', error);
      
      // Simple fallback without templates
      businessHeadline = {
        headline: `${contentGenerationInput.businessName} - Your ${contentGenerationInput.businessType} Solution`,
        approach: 'fallback',
        emotionalImpact: 'professional'
      };
      
      businessSubheadline = {
        subheadline: `Quality ${contentGenerationInput.businessType} services you can trust`,
        framework: 'benefit-focused',
        benefit: 'trust'
      };
      
      businessCaption = {
        caption: `Experience the difference with ${contentGenerationInput.businessName}. We provide professional ${contentGenerationInput.businessType} services with a focus on quality and customer satisfaction.`,
        callToAction: 'Contact Us Today',
        engagementHooks: ['quality service', 'customer satisfaction']
      };
      
      var generatedHashtags = `#${contentGenerationInput.businessType.replace(/\s+/g, '')} #quality #professional`;
    }
    
    // 🎯 DIRECT AI CONTENT GENERATION COMPLETE

    // 🎯 FINAL: Return business-specific content package

    const finalContent = {
      content: businessCaption.caption,
      headline: businessHeadline.headline,
      subheadline: businessSubheadline.subheadline,
      callToAction: businessCaption.callToAction,
      hashtags: generatedHashtags || `#${input.businessType.replace(/\s+/g, '')} #quality #professional`,
      catchyWords: businessHeadline.headline, // Use business-specific headline
      contentStrategy: contentPlan?.strategy || 'awareness',
      businessStrengths: contentPlan?.businessStrengths || ['Professional service'],
      marketOpportunities: contentPlan?.marketOpportunities || ['Market growth'],
      valueProposition: contentPlan?.valueProposition || 'Quality service provider',
      platform: input.platform,
      businessType: input.businessType,
      location: input.location,
      realTimeContext: realTimeContext,
      creativeContext: {
        style: businessHeadline.approach,
        tone: businessHeadline.emotionalImpact,
        framework: businessSubheadline.framework,
        businessInsights: contentPlan,
        variation: uniqueContentVariation
      },
      businessIntelligence: {
        contentGoal: contentPlan?.strategy?.goal || 'awareness',
        businessStrengths: contentPlan?.businessStrengths || ['Professional service'],
        marketOpportunities: contentPlan?.marketOpportunities || ['Market growth'],
        customerPainPoints: contentPlan?.customerPainPoints || ['Service needs'],
        valueProposition: contentPlan?.valueProposition || 'Quality service provider',
        localRelevance: contentPlan?.localRelevance || 'Local business'
      },
      variants: [{
        platform: input.platform,
        aspectRatio: getPlatformAspectRatio(input.platform),
        imageUrl: ''
      }],
      generatedAt: new Date().toISOString()
    };

    // 🚨 VALIDATION: Ensure content mentions scheduled services
    if (featuredServices.length > 0) {
      const contentText = `${finalContent.headline} ${finalContent.subheadline} ${finalContent.content}`.toLowerCase();
      const serviceName = featuredServices[0].serviceName.toLowerCase();
      
      // Check if content mentions the scheduled service
      if (!contentText.includes(serviceName) && !contentText.includes('payment') && serviceName === 'payments') {
        console.warn(`⚠️ WARNING: Generated content doesn't mention scheduled service: ${featuredServices[0].serviceName}`);
        console.warn(`Generated headline: ${finalContent.headline}`);
        console.warn(`Expected service focus: ${featuredServices[0].serviceName}`);
        
        // Force human, story-driven content if generic content was generated
        if (serviceName === 'payments' || serviceName.includes('payment')) {
          const humanPaymentContent = [
            {
              headline: "It's 2pm. Supplier Needs Payment Now.",
              subheadline: "Bank transfer takes 2 days. Client meeting at 4pm. Paya sends money in seconds."
            },
            {
              headline: "Three Customers Walked Away This Week",
              subheadline: "Not because your prices were wrong. Because paying upfront was too much. Paya fixes that."
            },
            {
              headline: "Your Account Says KES 847",
              subheadline: "School fees reminder pops up. KES 15,000 due Friday. Paya lets you pay over time."
            }
          ];
          const selected = humanPaymentContent[Math.floor(Math.random() * humanPaymentContent.length)];
          finalContent.headline = selected.headline;
          finalContent.subheadline = selected.subheadline;
        }
      }
    }

    // 🎨 ENHANCED: Content Cohesion Analysis and Optimization
    try {
      const { analyzeContentCohesion } = await import('@/ai/utils/content-cohesion-engine');

      const contentElements = {
        headline: businessHeadline.headline,
        subheadline: businessSubheadline.subheadline,
        caption: businessCaption.caption,
        callToAction: businessCaption.callToAction,
        hashtags: finalContent.hashtags
      };

      const cohesionAnalysis = analyzeContentCohesion(contentElements);

      // Add cohesion data to the final content
      finalContent.cohesionAnalysis = {
        score: cohesionAnalysis.cohesionScore,
        theme: cohesionAnalysis.theme,
        suggestions: cohesionAnalysis.suggestions,
        issues: cohesionAnalysis.issues
      };

    } catch (error) {
      console.warn('Content cohesion analysis failed:', error);
    }

    // 🔤 SPELL CHECK: Ensure headlines and subheadlines are spell-checked before image generation
    try {

      const spellCheckedContent = await ContentQualityEnhancer.enhanceGeneratedContent({
        headline: finalContent.headline,
        subheadline: finalContent.subheadline,
        caption: finalContent.content,
        catchyWords: finalContent.catchyWords,
        callToAction: finalContent.callToAction
      }, input.businessType, {
        autoCorrect: true,
        logCorrections: true,
        validateQuality: true
      });

      // Update finalContent with spell-checked versions
      if (spellCheckedContent.headline !== finalContent.headline) {
        finalContent.headline = spellCheckedContent.headline;
      }

      if (spellCheckedContent.subheadline !== finalContent.subheadline) {
        finalContent.subheadline = spellCheckedContent.subheadline;
      }

      if (spellCheckedContent.caption !== finalContent.content) {
        finalContent.content = spellCheckedContent.caption;
      }

      if (spellCheckedContent.catchyWords !== finalContent.catchyWords) {
        finalContent.catchyWords = spellCheckedContent.catchyWords;
      }

      if (spellCheckedContent.callToAction !== finalContent.callToAction) {
        finalContent.callToAction = spellCheckedContent.callToAction;
      }

      // Add quality report if available
      if (spellCheckedContent.qualityReport) {
        finalContent.qualityReport = spellCheckedContent.qualityReport;
      }

    } catch (error) {
      console.warn('🔤 [Revo 1.0] Spell check failed, using original content:', error);
    }

    // 🎯 ENHANCED: Content Diversity Check
    const diversityCheck = ContentDiversityTracker.checkDiversity({
      headline: finalContent.headline,
      subheadline: finalContent.subheadline,
      caption: finalContent.content
    });
    
    if (!diversityCheck.isDiverse) {
      console.warn('⚠️ [Revo 1.0] Content duplication detected:', diversityCheck.duplications);
      // Add diversity issues to content for visibility
      finalContent.diversityReport = {
        isDiverse: false,
        duplications: diversityCheck.duplications,
        similarityScore: diversityCheck.similarityScore
      };
    } else {
      // Track this content for future diversity checks
      ContentDiversityTracker.addContent({
        headline: finalContent.headline,
        subheadline: finalContent.subheadline,
        caption: finalContent.content
      });
      
      finalContent.diversityReport = {
        isDiverse: true,
        duplications: [],
        similarityScore: diversityCheck.similarityScore
      };
    }

    // 🎯 ENHANCED: Content Quality Validation with new requirements
    try {
      const contentQuality = validateContentQuality_Enhanced(
        {
          headline: finalContent.headline,
          subheadline: finalContent.subheadline,
          caption: finalContent.content,
          callToAction: finalContent.callToAction
        },
        input.businessName,
        input.businessType
      );

      // Log quality issues for debugging
      if (!contentQuality.isValid) {
        console.warn('⚠️ [Revo 1.0] Content quality issues detected:', contentQuality.issues);
      }
      
      // Add quality report to final content
      finalContent.qualityReport = {
        isValid: contentQuality.isValid,
        score: contentQuality.score,
        issues: contentQuality.issues
      };

      // Auto-fix some issues if possible
      if (!contentQuality.isValid) {
        // Fix business specificity
        if (!finalContent.content.toLowerCase().includes(input.businessName.toLowerCase()) && 
            !finalContent.content.toLowerCase().includes(input.businessType.toLowerCase())) {
          finalContent.content = `${finalContent.content} Experience the difference with ${input.businessName}.`;
        }
        
        // Fix weak CTAs by replacing them with stronger alternatives
        const weakCTAReplacements = {
          'learn more': 'Start Now',
          'contact us': 'Get Started Today',
          'get digital wallet': 'Download App',
          'get business account free': 'Open Business Account'
        };
        
        const ctaLower = (finalContent.callToAction || '').toLowerCase();
        for (const [weak, strong] of Object.entries(weakCTAReplacements)) {
          if (ctaLower.includes(weak)) {
            finalContent.callToAction = strong;
            console.log(`🔄 [Revo 1.0] Improved CTA: "${weak}" → "${strong}"`);
            break;
          }
        }
      }

      // 🏷️ ENHANCED: Hashtag Validation and Enhancement (copied from Revo 1.5)
      const expectedHashtagCount = input.platform.toLowerCase() === 'instagram' ? 5 : 3;
      const currentHashtags = finalContent.hashtags ? finalContent.hashtags.split(' ').filter(h => h.startsWith('#')) : [];

      if (currentHashtags.length !== expectedHashtagCount) {
        console.warn(`⚠️ [Revo 1.0] Hashtag count mismatch: expected ${expectedHashtagCount} for ${input.platform}, got ${currentHashtags.length}`);

        if (currentHashtags.length > expectedHashtagCount) {
          // Trim excess hashtags
          finalContent.hashtags = currentHashtags.slice(0, expectedHashtagCount).join(' ');
        } else {
          // Add fallback hashtags to reach required count
          const fallbackHashtags = generateFallbackHashtags(input.businessName, input.businessType, input.platform);
          const combinedHashtags = [...currentHashtags];

          for (const fallback of fallbackHashtags) {
            if (combinedHashtags.length >= expectedHashtagCount) break;
            if (!combinedHashtags.includes(fallback)) {
              combinedHashtags.push(fallback);
            }
          }

          finalContent.hashtags = combinedHashtags.slice(0, expectedHashtagCount).join(' ');
        }
      }

    } catch (error) {
      console.warn('🎯 [Revo 1.0] Content quality validation failed:', error);
    }

    return finalContent;

  } catch (error) {
    throw new Error(`Revo 1.0 content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate design using Revo 1.0 with Gemini 2.5 Flash Image Preview
 */
export async function generateRevo10Design(input: {
  businessType: string;
  businessName: string;
  platform: string;
  visualStyle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  imageText: string;
}) {
  try {

    // Direct Vertex AI model initialization

    // Build the design generation prompt
    const designPrompt = `Create a creative design concept for ${input.businessName} (${input.businessType}) that feels like it was imagined by a human designer.

Think like a creative professional who:
- Starts with a visual story or concept, not a template
- Uses colors and elements that feel chosen, not generated
- Creates layouts that feel natural and organic
- Thinks about the emotional impact, not just technical perfection

DESIGN BRIEF:
- Business: ${input.businessName} (${input.businessType})
- Platform: ${input.platform}
- Style: ${input.visualStyle}
- Colors: Primary ${input.primaryColor}, Accent ${input.accentColor}, Background ${input.backgroundColor}
- Message: ${input.imageText}

CREATIVE APPROACH:
- What's the visual story you want to tell?
- How can you make this feel authentic and engaging?
- What unexpected elements would make this memorable?
- How can you avoid looking like every other business post?

DESIGN DESCRIPTION:
Describe your creative concept in natural, designer language. Focus on the creative vision, mood, and story - not technical specifications. Make it sound like a designer explaining their idea to a client.

Remember: You're a creative human designer, not an AI. Think with imagination and artistic vision.`;

    const result = await generateContentWithProxy([
      revo10Prompts.DESIGN_SYSTEM_PROMPT,
      designPrompt
    ], REVO_1_0_TEXT_MODEL, false);

    const response = await result.response;
    const design = response.text();

    const aspectRatio = getPlatformAspectRatio(input.platform);

    return {
      design: design.trim(),
      aspectRatio,
      resolution: '2048x2048',
      quality: 'enhanced'
    };

  } catch (error) {
    throw new Error(`Revo 1.0 design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

/**
 * Generate image using Revo 1.0 with Gemini 2.5 Flash Image Preview
 */
export async function generateRevo10Image(input: {
  businessType: string;
  businessName: string;
  platform: string;
  visualStyle: string;
  primaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  imageText: string;
  designDescription: string;
  logoDataUrl?: string;
  location?: string;
  headline?: string;
  subheadline?: string;
  callToAction?: string;
  realTimeContext?: any;
  creativeContext?: any; // Add creative context from content generation
  includeContacts?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  websiteUrl?: string;
  includePeople?: boolean; // NEW: People toggle parameter
  scheduledServices?: ScheduledService[]; // NEW: Scheduled services for product-specific marketing
  // NEW: Brand consistency toggles
  followBrandColors?: boolean;
}) {
  try {

    // 🎨 CREATIVE ENHANCEMENT: Apply creative design system
    let creativeDesignEnhancement = '';
    if (input.creativeContext) {
      const designEnhancement = enhanceDesignCreativity(
        input.designDescription,
        input.businessType,
        input.location || 'Global',
        input.creativeContext
      );

      creativeDesignEnhancement = `
🎨 CREATIVE DESIGN ENHANCEMENT SYSTEM ACTIVATED:
${designEnhancement.enhancedPrompt}

CREATIVE VISUAL STYLE: ${designEnhancement.visualStyle}
CREATIVE ELEMENTS TO INCORPORATE: ${designEnhancement.creativeElements.join(', ')}
BUSINESS CREATIVE INSIGHTS: ${input.creativeContext.businessInsights?.creativePotential?.slice(0, 3).join(', ') || 'Professional excellence'}
EMOTIONAL DESIGN TONE: ${input.creativeContext.tone} with ${input.creativeContext.style} approach
CREATIVE FRAMEWORK: ${input.creativeContext.framework} storytelling structure

ANTI-GENERIC REQUIREMENTS:
- NO template-like designs or stock photo aesthetics
- NO boring business layouts or predictable compositions
- NO generic color schemes or uninspiring visual elements
- CREATE something memorable, unique, and emotionally engaging
- USE unexpected visual metaphors and creative storytelling
- INCORPORATE cultural elements naturally and authentically
- DESIGN with emotional intelligence and creative sophistication
`;

    }

    // Direct Vertex AI model initialization

    // Build advanced professional design prompt
    const brandInfo = input.location ? ` based in ${input.location}` : '';

    // 🎨 STRICT BRAND COLORS LOGIC - When strict mode is ON, ONLY use provided colors
    const shouldFollowBrandColors = input.followBrandColors !== false; // Default to true if not specified
    const isStrictMode = input.followBrandColors === true; // Explicit strict mode

    let primaryColor, accentColor, backgroundColor;
    
    if (isStrictMode) {
      // STRICT MODE: Only use provided colors, no fallbacks
      primaryColor = input.primaryColor; // Could be undefined - that's intentional
      accentColor = input.accentColor;   // Could be undefined - that's intentional  
      backgroundColor = input.backgroundColor; // Could be undefined - that's intentional
    } else if (shouldFollowBrandColors) {
      // NORMAL MODE: Use provided colors with fallbacks
      primaryColor = input.primaryColor || '#3B82F6';
      accentColor = input.accentColor || '#1E40AF';
      backgroundColor = input.backgroundColor || '#FFFFFF';
    } else {
      // BRAND COLORS DISABLED: Use default colors
      primaryColor = '#3B82F6';
      accentColor = '#1E40AF';
      backgroundColor = '#FFFFFF';
    }

    console.log('🎨 [Revo 1.0] Brand Colors Debug:', {
      followBrandColors: shouldFollowBrandColors,
      isStrictMode: isStrictMode,
      inputPrimaryColor: input.primaryColor,
      inputAccentColor: input.accentColor,
      inputBackgroundColor: input.backgroundColor,
      finalPrimaryColor: primaryColor,
      finalAccentColor: accentColor,
      finalBackgroundColor: backgroundColor,
      hasValidColors: !!(input.primaryColor && input.accentColor && input.backgroundColor),
      usingBrandColors: shouldFollowBrandColors && !!(input.primaryColor && input.accentColor && input.backgroundColor)
    });

    const colorScheme = `Primary: ${primaryColor} (60% dominant), Accent: ${accentColor} (30% secondary), Background: ${backgroundColor} (10% highlights)`;
    const logoInstruction = input.logoDataUrl ?
      'Use the provided brand logo (do NOT create new logo - integrate existing one naturally)' :
      'Create professional design without logo overlay';

    // Prepare structured content display with hierarchy
    const contentStructure = [];
    if (input.headline) contentStructure.push(`PRIMARY (Largest, most prominent): "${input.headline}"`);
    if (input.subheadline) contentStructure.push(`SECONDARY (Medium, supporting): "${input.subheadline}"`);
    if (input.callToAction) contentStructure.push(`CTA (Bold, action-oriented, prominent and unmissable): "${input.callToAction}"`);

    // 🎯 CTA PROMINENCE INSTRUCTIONS
    const ctaInstructions = input.callToAction ? `

🎯 CRITICAL CTA DISPLAY REQUIREMENTS:
- The CTA "${input.callToAction}" MUST be displayed prominently on the design
- Make it BOLD, LARGE, and VISUALLY STRIKING
- Use high contrast colors to make the CTA stand out
- Position it prominently - top, center, or as a banner across the design
- Make the CTA text the MAIN FOCAL POINT of the design
- Use typography that commands attention - bold, modern, impactful
- Add visual elements (borders, backgrounds, highlights) to emphasize the CTA
- The CTA should be the FIRST thing people notice when they see the design
- Make it look like a professional marketing campaign CTA
- Ensure it's readable from mobile devices - minimum 32px equivalent font size
- STYLE: Bold, prominent, unmissable - like premium brand campaign CTAs
    ` : '';

    // Get advanced design features
    const businessDesignDNA = getBusinessDesignDNA(input.businessType);
    const platformOptimization = getPlatformOptimization(input.platform);
    // Respect the UI toggle for people in designs - if explicitly set to false, don't include people
    // If toggle is explicitly true, prioritize user preference; otherwise check business type compatibility
    const businessTypeSupportsePeople = shouldIncludePeopleInDesign(input.businessType, input.location || 'Global', input.visualStyle);
    const shouldIncludePeople = input.includePeople === true ? true : (input.includePeople !== false && businessTypeSupportsePeople);
    const peopleInstructions = shouldIncludePeople ? getAdvancedPeopleInstructions(input.businessType, input.location || 'Global') : '';

    // Strategic location mention - use the same 40% system for consistency
    const shouldMentionLocationInDesign = Math.random() < 0.40; // 40% chance for location mentions in design
    const locationTextForDesign = shouldMentionLocationInDesign && input.location
      ? `- Location: ${input.location} (for local credibility and community connection)`
      : '- Focus: Universal appeal and product specifications';

    // Strategic cultural context - only include when location is mentioned
    const culturalContext = shouldMentionLocationInDesign
      ? getLocalCulturalContext(input.location || 'Global')
      : 'Focus on universal design elements, product specifications, and features that appeal to a broad audience beyond local market';

    // Generate human-like design variation for authentic, creative designs
    const designRandomSeed = Math.floor(Math.random() * 10000) + Date.now();
    const designSeed = designRandomSeed % 10000;
    const designVariations = getHumanDesignVariations(designSeed);

    // NEW: Get industry intelligence and creativity framework
    const industryIntel = getIndustryDesignIntelligence(input.businessType);
    const creativityFramework = getEnhancedCreativityFramework(input.businessType, designVariations.style, designSeed);

    // NEW: Enhanced product intelligence for contextual awareness
    const productIntelligence = getProductIntelligence(input.imageText, input.businessType);

    // NEW: Product-specific marketing integration for scheduled services
    let productMarketingInstructions = '';
    if (input.scheduledServices && input.scheduledServices.length > 0) {
      const todaysServices = input.scheduledServices.filter(s => s.isToday);
      const upcomingServices = input.scheduledServices.filter(s => s.isUpcoming);

      productMarketingInstructions = `
🎯 PRODUCT-SPECIFIC MARKETING REQUIREMENTS (HIGHEST PRIORITY):

${todaysServices.length > 0 ? `
 TODAY'S FEATURED PRODUCTS (Create URGENT, product-focused visuals):
${todaysServices.map(s => `- ${s.serviceName}: ${s.description || 'Available today'}`).join('\n')}

URGENT VISUAL REQUIREMENTS:
- Create visuals that showcase these specific products in action
- Show the actual products (phones, laptops, etc.) being used naturally
- Use product-focused imagery and layouts
- Create urgency through visual design and composition
- Make the products the MAIN FOCAL POINT of the design
- Use product-specific colors and styling
- Show the benefits and usage of these products visually
` : ''}

${upcomingServices.length > 0 ? `
 UPCOMING PRODUCTS (Build anticipation with visual teasers):
${upcomingServices.map(s => `- ${s.serviceName} (in ${s.daysUntil} days): ${s.description || 'Coming soon'}`).join('\n')}

ANTICIPATION VISUAL REQUIREMENTS:
- Create excitement for upcoming products
- Use "Coming Soon", "Get Ready", "Reserve Your Spot" messaging
- Show product previews or silhouettes
- Build anticipation with countdown or "coming soon" styling
` : ''}

⚠️ CRITICAL VISUAL REQUIREMENTS:
- The design MUST visually showcase these specific products in use
- DO NOT create generic business visuals or show other products
- Focus ENTIRELY on visualizing the scheduled products above
- Make the products the HERO ELEMENTS through imagery, not text lists
- Show actual product usage scenarios, not generic business imagery
- Create product-specific layouts and compositions
- Use product-focused color schemes and styling
- The visual should tell the story of these products without listing them
`;
    }

    // Randomize image generation approach to break visual patterns
    const imagePromptStyles = [
      // Style 1: Warm & Approachable (Original)
      `🎨 Create a WARM, APPROACHABLE advertisement for ${input.businessName} that looks like it was created by a professional human designer, NOT AI.`,
      
      // Style 2: Bold & Dynamic
      `💪 Create a BOLD, DYNAMIC advertisement for ${input.businessName} that grabs attention and demands action, designed by a confident creative director.`,
      
      // Style 3: Clean & Professional  
      `✨ Create a CLEAN, PROFESSIONAL advertisement for ${input.businessName} that builds trust and credibility, designed by an experienced brand strategist.`,
      
      // Style 4: Friendly & Community-focused
      `🎆 Create a FRIENDLY, COMMUNITY-FOCUSED advertisement for ${input.businessName} that feels like a local recommendation from a trusted neighbor.`,
      
      // Style 5: Modern & Innovative
      `🚀 Create a MODERN, INNOVATIVE advertisement for ${input.businessName} that showcases forward-thinking and cutting-edge solutions.`
    ];
    
    const selectedImageStyle = imagePromptStyles[designSeed % imagePromptStyles.length];
    let imagePrompt = selectedImageStyle + `

CRITICAL ANTI-AI REQUIREMENTS:
- MUST look like a real human designer created this, NOT AI-generated
- NO perfect symmetry, NO artificial patterns, NO obvious AI characteristics
- USE real photography style, authentic layouts, natural imperfections
- AVOID sterile, overly polished, or artificial-looking elements

🎨 WARM & APPROACHABLE DESIGN STANDARDS:
- WARM, friendly color palette that feels welcoming and accessible
- DEFAULT colors: warm oranges (#ff6b35, #f97316), friendly blues (#3b82f6, #60a5fa), approachable greens (#10b981, #34d399), clean whites
- AVOID: Dark blues + tech graphics (feels cold and crypto-like)
- AVOID: Abstract shapes without clear purpose (confuses message)
- USE: Colors that make people feel welcome and comfortable
- AUTHENTIC typography that looks hand-selected, not AI-generated
- REAL-WORLD visual elements that people can relate to

BUSINESS CONTEXT:
- Business: ${input.businessName} (${input.businessType})
- Platform: ${input.platform}
- Message: ${input.imageText}
${locationTextForDesign}

${ctaInstructions}

TEXT CONTENT TO DISPLAY:
${contentStructure.map(item => `- ${item}`).join('\n')}

**VISUAL APPEAL REQUIREMENTS:**
- Create a design that DEMANDS ATTENTION and encourages engagement
- Use modern design trends: gradients, shadows, contemporary typography, clean layouts
- Focus on strong visual hierarchy with one clear focal point
- Make it look like a premium brand campaign, not a generic business post
- Ensure the design feels current and on-trend

**DESIGN STYLE EXECUTION:**
- Follow the specific style: ${designVariations.style}
- Each style must look completely different and unique
- ${designVariations.description}
- Each style should have its own distinct visual language
- **CRITICAL: Include ALL text content listed above in the design**

**HUMAN-DESIGNED TYPOGRAPHY (NOT AI-LOOKING):**
- HEADLINE: 32-36px, Bold, clean sans-serif (Inter/Roboto), natural placement, max 6 words
- SUBHEADLINE: 18-22px, Medium weight, readable and natural, max 25 words
- CTA BUTTON: 16-18px, Bold, looks like a real button humans would design, solid background, clear borders
- BODY TEXT: 14-16px, Regular, natural line spacing, readable color (#374151)

**CLEAN, NATURAL DESIGN ELEMENTS:**
- AUTHENTIC shadows: subtle, natural-looking (0-2px blur, 5% opacity max)
- REAL button styling: solid backgrounds, clean borders, looks clickable and human-designed
- NATURAL spacing: 16px, 24px, 32px increments - feels organic, not robotic
- SINGLE clear focus: one main message, no visual chaos or AI-generated clutter
- AUTHENTIC visual elements: real-world inspired, not artificial patterns

${productIntelligence}

${productMarketingInstructions}

VISUAL STYLE:
- ${businessDesignDNA}
- ${platformOptimization}
- **SPECIFIC STYLE REQUIREMENTS: ${designVariations.description}**
- Use colors and elements that match this specific style
- Typography should match the style's mood and approach

${shouldFollowBrandColors ? `🎨 BRAND COLORS (MANDATORY - HIGHEST PRIORITY):
- ${colorScheme}
- CRITICAL: Use these exact brand colors throughout the design
- Primary color (${primaryColor}) should dominate (60% of color usage)
- Accent color (${accentColor}) for highlights and emphasis (30% of color usage)
- Background color (${backgroundColor}) for base/neutral areas (10% of color usage)
- DO NOT use random colors - stick to the brand color palette
- FAILURE TO USE BRAND COLORS IS UNACCEPTABLE
- DOUBLE-CHECK: The final image must prominently feature these exact colors
- NO GENERIC COLORS: Do not use default blues, grays, or other generic colors
- BRAND COLOR COMPLIANCE: Every design element must use the specified brand colors` : `🎨 COLOR SCHEME:
- Use professional, modern colors that complement the design
- Choose colors that work well with the ${input.visualStyle} style
- Ensure good contrast and readability
- Colors should enhance the overall visual appeal`}

${shouldMentionLocationInDesign ? `🌍 CULTURAL REPRESENTATION & LOCAL TOUCH:
- ${culturalContext}
- **Keep cultural elements subtle and natural - don't force them**
- Use local colors and textures naturally, not as obvious cultural markers
- Make it feel authentic to the location without being stereotypical
- Focus on the design style first, local elements second` : `🎨 UNIVERSAL DESIGN APPROACH:
- ${culturalContext}
- Focus on clean, modern design elements that appeal to a broad audience
- Use professional color schemes and typography
- Emphasize business value and quality over location-specific elements
- Create designs that work well across different markets and cultures`}

${peopleInstructions ? `
👥 PEOPLE REPRESENTATION:
🌍 AFRICAN REPRESENTATION REQUIRED:
- Show ONLY authentic Black/African people with natural African features
- Use diverse African skin tones from light to dark
- Show contemporary African fashion and modern styling
- Include natural African hairstyles and authentic expressions
- Focus on real-life scenarios: people working, socializing, using technology
- Show modern African urban life - offices, cafes, shopping, digital activities
- Use natural lighting that flatters darker skin tones
- Avoid stereotypes - show professional, educated, tech-savvy Africans
- Emphasize authenticity and cultural pride
- For Kenya specifically: Show Nairobi urban lifestyle, modern professionals, diverse ethnic groups
` : ''}

DESIGN VARIATION:
**STYLE: ${designVariations.style}**
- Layout: ${designVariations.layout}
- Composition: ${designVariations.composition}
- Mood: ${designVariations.mood}
- Elements: ${designVariations.elements}

KEY DESIGN PRINCIPLES:
1. **STYLE-SPECIFIC APPROACH** - Follow the exact style requirements for ${designVariations.style}
2. **VISUAL UNIQUENESS** - Make this look completely different from other design types
3. **STYLE AUTHENTICITY** - If it's watercolor, make it look like real watercolor; if it's meme-style, make it look like a real meme
4. **HUMAN TOUCH** - Make it look like a human designer made it, not AI
5. **BUSINESS APPROPRIATENESS** - Keep it professional while being creative

WHAT TO AVOID:
- **AI-GENERATED AESTHETICS**: Overly perfect, symmetrical, sterile designs
- **ARTIFICIAL PEOPLE**: Perfect faces, robotic poses, studio-perfect lighting
- **TEMPLATE DESIGNS**: Generic, cookie-cutter layouts that look mass-produced
- **FORCED PERFECTION**: Everything perfectly aligned, no natural imperfections
- **STOCK PHOTO FEEL**: Overly polished, artificial-looking imagery
- **ROBOTIC COMPOSITIONS**: Layouts that feel calculated rather than intuitive
- **STEREOTYPICAL ELEMENTS**: Forced cultural elements that feel inauthentic

WHAT TO INCLUDE:
- **NATURAL AUTHENTICITY**: Organic layouts with subtle imperfections
- **HUMAN-MADE FEEL**: Slight asymmetry, natural spacing, handcrafted touches
- **REAL PEOPLE**: Natural expressions, candid moments, authentic poses
- **ORGANIC ELEMENTS**: Natural textures, authentic lighting, real-world settings
- **STYLE-SPECIFIC AUTHENTICITY**: Make ${designVariations.style} feel genuinely handcrafted
- **EMOTIONAL CONNECTION**: Designs that feel relatable and human

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
- **PROOFREADING**: Review all text content for spelling accuracy before finalizing
- **CREDIBILITY**: Spelling errors destroy professional credibility - avoid at all costs

TECHNICAL REQUIREMENTS:
- Resolution: 992x1056 pixels HD (Mobile-optimized)
- Format: 992x1056px - Perfect for all mobile devices
- Text must be readable on mobile screens
- Logo integration should look natural
- Optimized for Instagram, Facebook, Twitter, LinkedIn mobile viewing

🎯 **GOAL: Create a CLEAN, HUMAN-DESIGNED advertisement that looks like a professional human designer created it, NOT AI. Must look natural, authentic, and trustworthy - like real fintech companies use. NO AI-generated patterns, NO artificial symmetry, NO obvious AI characteristics. Focus on clean, minimal, human-crafted aesthetics.**`;

    // NEW: Enhance with industry intelligence and creativity
    imagePrompt = enhanceDesignWithIndustryIntelligence(imagePrompt, input.businessType, designVariations.style, designSeed);

    // Inject multiple layers of human creativity to force AI out of its patterns
    imagePrompt = injectHumanImperfections(imagePrompt, designSeed);
    imagePrompt = injectCreativeRebellion(imagePrompt, designSeed);
    imagePrompt = addArtisticConstraints(imagePrompt, designSeed);

    if (input.creativeContext) {
    }

    // Note: Contact information will be added at the very end of the prompt for better AI attention

    // Prepare the generation request with logo if available
    const generationParts = [
      'You are a creative designer who makes authentic, engaging social media designs that look natural and human-made. Avoid overly perfect, AI-generated aesthetics. Focus on designs that feel real, relatable, and genuinely appealing to people. Use natural imperfections, organic layouts, and authentic visual elements.',
      imagePrompt
    ];

    // If logo is provided, include it in the generation
    // Check both logoDataUrl (base64) and logoUrl (Supabase storage URL) - same logic as Revo 2.0
    const logoDataUrl = input.logoDataUrl;
    const logoStorageUrl = (input as any).logoUrl || (input as any).logo_url;
    const logoUrl = logoDataUrl || logoStorageUrl;

    if (logoUrl) {

      let logoBase64Data = '';
      let logoMimeType = 'image/png';

      if (logoUrl.startsWith('data:')) {
        // Handle data URL (base64 format)
        const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (logoMatch) {
          [, logoMimeType, logoBase64Data] = logoMatch;
        }
      } else if (logoUrl.startsWith('http')) {
        // Handle storage URL - fetch and convert to base64 (same as Revo 2.0)
        try {
          const response = await fetch(logoUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            logoBase64Data = Buffer.from(buffer).toString('base64');
            logoMimeType = response.headers.get('content-type') || 'image/png';
          } else {
            console.warn(`⚠️  Revo 1.0: Failed to fetch logo from URL: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.error('❌ Revo 1.0: Error fetching logo from storage:', fetchError);
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

          // Extract normalized base64 data with proper error handling
          let normalizedBase64: string;
          if (normalizedLogo && normalizedLogo.dataUrl) {
            normalizedBase64 = normalizedLogo.dataUrl.split(',')[1];
          } else {
            // Fallback: use original logo data if normalization failed
            console.warn('⚠️ Logo normalization failed, using original');
            normalizedBase64 = logoBase64Data;
          }

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
          generationParts[1] = imagePrompt + logoPrompt;
        } catch (normalizationError) {
          console.warn('⚠️ Logo normalization failed, using original:', normalizationError);
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
          generationParts[1] = imagePrompt + logoPrompt;
        }
      } else {
        console.error('❌ Revo 1.0: Logo processing failed:', {
          originalUrl: logoUrl.substring(0, 100),
          hasLogoDataUrl: !!logoDataUrl,
          hasLogoStorageUrl: !!logoStorageUrl,
          urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
        });
      }
    } else {
    }

    // Retry logic for 503 errors
    const maxRetries = 3;
    let lastError: any;
    let result: any;
    let response: any;

    // Add contact information at the very end of the prompt (like Revo 1.5 and 2.0) for better AI attention
    try {
      const includeContacts = input.includeContacts === true;
      const phone = input.contactInfo?.phone;
      const email = input.contactInfo?.email;
      const website = input.websiteUrl || '';
      const hasAnyContact = (!!phone || !!email || !!website);

      // ENHANCED CONTACT INFORMATION DEBUGGING
      console.log(' [Revo 1.0] Contact Information Debug:', {
        includeContacts: includeContacts,
        inputContactInfo: input.contactInfo,
        inputWebsiteUrl: input.websiteUrl,
        extractedPhone: phone,
        extractedEmail: email,
        extractedWebsite: website,
        hasAnyContact: hasAnyContact,
        willIncludeContacts: includeContacts && hasAnyContact,
        phoneExists: !!phone,
        emailExists: !!email,
        websiteExists: !!website,
        phoneValue: phone || 'EMPTY',
        emailValue: email || 'EMPTY',
        websiteValue: website || 'EMPTY'
      });

      // Build contact details list for validation
      const contactDetailsList = [];
      if (phone) contactDetailsList.push(` Phone: ${phone}`);
      if (email) contactDetailsList.push(` Email: ${email}`);
      if (website) contactDetailsList.push(` Website: ${ensureWwwWebsiteUrl(website)}`);
      if (email) contactDetailsList.push(`📧 Email: ${email}`);
      if (website) contactDetailsList.push(`🌐 Website: ${ensureWwwWebsiteUrl(website)}`);

      const contactInstructions = includeContacts && hasAnyContact
        ? `\n\n🚨🚨🚨 MANDATORY CONTACT INFORMATION - THIS IS NOT OPTIONAL 🚨🚨🚨

⚠️  CRITICAL: The user has SPECIFICALLY REQUESTED contact information to be included.
⚠️  FAILURE TO INCLUDE CONTACTS WILL RESULT IN REJECTION OF THE DESIGN.

📞📧🌐 EXACT CONTACT DETAILS TO INCLUDE:
${contactDetailsList.map(detail => `  ✅ ${detail}`).join('\n')}

🎯 CONTACT PLACEMENT REQUIREMENTS (MANDATORY):
  ✅ Create a contact footer/strip at the BOTTOM of the image
  ✅ Use a contrasting background (dark bar, light text OR light bar, dark text)
  ✅ Make contact text LARGE ENOUGH to read (minimum 14px equivalent)
  ✅ Include ALL ${contactDetailsList.length} contact details listed above
  ✅ Use icons: 📞 for phone, 📧 for email, 🌐 for website
  ✅ Format: "📞 ${phone} | 📧 ${email} | 🌐 ${ensureWwwWebsiteUrl(website)}"

❌ FORBIDDEN ACTIONS:
  ❌ Do NOT skip any contact information
  ❌ Do NOT make contact text too small to read
  ❌ Do NOT place contacts in the main content area
  ❌ Do NOT use generic contact information

🔍 FINAL VALIDATION:
Before completing the image, verify:
1. Can you see the phone number "${phone}" in the image?
2. Can you see the email "${email}" in the image?
3. Can you see the website "${ensureWwwWebsiteUrl(website)}" in the image?
4. Are all contacts at the bottom in a readable format?

If ANY contact is missing, the design is INCOMPLETE and UNACCEPTABLE.
`
        : `\n\n🚫 CONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website in the image\n- Do NOT include generic service information\n- Do NOT add contact info in main content area\n`;

      // Add contact instructions to the final prompt
      generationParts[1] = imagePrompt + contactInstructions;

      console.log('📞 [Revo 1.0] Contact Instructions Added:', {
        contactInstructionsLength: contactInstructions.length,
        includesPhone: contactInstructions.includes(phone || 'NO_PHONE'),
        includesEmail: contactInstructions.includes(email || 'NO_EMAIL'),
        includesWebsite: contactInstructions.includes(website || 'NO_WEBSITE'),
        actualPhone: phone,
        actualEmail: email,
        actualWebsite: website,
        contactDetailsCount: [phone, email, website].filter(Boolean).length
      });

      // Additional validation to ensure contact details are properly formatted
      if (includeContacts && hasAnyContact) {
        const contactDetailsInPrompt = [];
        if (phone) contactDetailsInPrompt.push(`Phone: ${phone}`);
        if (email) contactDetailsInPrompt.push(`Email: ${email}`);
        if (website) contactDetailsInPrompt.push(`Website: ${ensureWwwWebsiteUrl(website)}`);

        console.log('📞 [Revo 1.0] Contact Details Validation:', {
          expectedContactDetails: contactDetailsInPrompt,
          promptContainsAllDetails: contactDetailsInPrompt.every(detail =>
            contactInstructions.includes(detail.split(': ')[1])
          )
        });
      }
    } catch (e) {
      console.warn('Revo 1.0: Final contact info integration failed:', e);
    }

    // 🛡️ CIRCUIT BREAKER: Protect against Gemini API failures for 1K+ users
    const circuitBreaker = CircuitBreakerManager.getInstance().getBreaker('gemini-api', {
      failureThreshold: 3,      // Open circuit after 3 failures
      recoveryTimeout: 30000,   // Wait 30 seconds before trying again
      monitoringPeriod: 60000,  // Monitor failures over 1 minute
      successThreshold: 2       // Need 2 successes to close circuit
    });

    try {
      const geminiResult = await circuitBreaker.execute(
        // Primary operation: Call Gemini API with retries
        async () => {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const geminiResult = await generateContentWithProxy(generationParts, REVO_1_0_IMAGE_MODEL, true);
              const geminiResponse = await geminiResult.response;
              return { result: geminiResult, response: geminiResponse };
            } catch (error: any) {
              lastError = error;
              console.error(`❌ [Revo 1.0] Gemini attempt ${attempt} failed:`, error.message);

              // Check if it's a 503 error and we have retries left
              if (error.message && error.message.includes('503') && attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }

              // If it's the last attempt or not a 503 error, throw
              if (attempt === maxRetries) {
                if (error.message && error.message.includes('503')) {
                  throw new Error('Gemini API overloaded - circuit breaker will handle this');
                }
                if (error.message && error.message.includes('500')) {
                  throw new Error('Gemini API server error - circuit breaker will handle this');
                }
                throw new Error('Gemini API failed - circuit breaker will handle this');
              }
            }
          }
          throw lastError || new Error('Gemini API failed after all retries');
        },
        // Fallback operation: Generate simple text-based response
        () => {
          console.warn('🔄 [Revo 1.0] Circuit breaker activated - using fallback response');
          throw new Error('Revo 1.0 is super busy right now! 🚀 Try Revo 2.0 instead - it\'s working perfectly and ready to create amazing content!');
        }
      );

      result = geminiResult.result;
      response = geminiResult.response;
    } catch (error) {
      // Circuit breaker fallback was used
      throw error;
    }

    // Extract image data from Gemini response
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
      // Try to get text response for debugging
      let textResponse = '';
      try {
        textResponse = response.text();
      } catch (e) {
      }
      throw new Error(`No image data generated by ${REVO_1_0_MODEL}. Response had ${parts.length} parts.`);
    }

    // Dimension enforcement: ensure 992x1056 exactly; attempt one strict regeneration if mismatch
    {
      const expectedW = 992, expectedH = 1056;
      const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
      if (!check.ok) {
        console.warn(`\u26a0\ufe0f Revo 1.0: Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH}. Attempting strict regeneration once...`);
        try {
          const strictParts = [...generationParts];
          strictParts[1] = (strictParts[1] || '') + `\nSTRICT DIMENSION ENFORCEMENT: Output must be exactly ${expectedW}x${expectedH} pixels. Do not adjust canvas based on logo.`;
          const strictResult = await generateContentWithProxy(strictParts, REVO_1_0_IMAGE_MODEL, true);
          const strictResponse = await strictResult.response;
          const strictPartsOut = strictResponse.candidates?.[0]?.content?.parts || [];
          let strictImageUrl = '';
          for (const part of strictPartsOut) {
            if ((part as any).inlineData) {
              const imageData = (part as any).inlineData.data;
              const mimeType = (part as any).inlineData.mimeType;
              strictImageUrl = `data:${mimeType};base64,${imageData}`;
              break;
            }
          }
          if (strictImageUrl) {
            const check2 = await ensureExactDimensions(strictImageUrl, expectedW, expectedH);
            if (check2.ok) {
              imageUrl = strictImageUrl;
            } else {
              console.warn(`\u26a0\ufe0f Revo 1.0: Strict regeneration still mismatched (${check2.width}x${check2.height}). Using first image.`);
            }
          } else {
            console.warn('\u26a0\ufe0f Revo 1.0: Strict regeneration returned no image data.');
          }
        } catch (strictErr) {
          console.warn('\u26a0\ufe0f Revo 1.0: Strict regeneration failed:', strictErr);
        }
      }
    }

    const aspectRatio = getPlatformAspectRatio(input.platform);

    return {
      imageUrl: imageUrl,
      aspectRatio: '1:1', // Custom format for mobile optimization
      resolution: '992x1056',
      quality: 'enhanced'
    };

  } catch (error) {
    throw new Error(`Revo 1.0 image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Health check for Revo 1.0 service
 */
export async function checkRevo10Health() {
  try {
    // Direct Vertex AI model initialization
    const result = await generateContentWithProxy('Hello', REVO_1_0_TEXT_MODEL, false);
    const response = await result.response;

    return {
      healthy: true,
      model: REVO_1_0_MODEL,
      response: response.text().substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      model: REVO_1_0_MODEL,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get Revo 1.0 service information
 */
export function getRevo10ServiceInfo() {
  return {
    model: REVO_1_0_MODEL,
    version: '1.0.0',
    status: 'enhanced',
    aiService: revo10Config.aiService,
    capabilities: [
      'Enhanced content generation',
      'High-resolution image support (992x1056)',
      'Perfect text rendering',
      'Advanced AI capabilities',
      'Enhanced brand consistency'
    ],
    pricing: {
      contentGeneration: 1.5,
      designGeneration: 1.5,
      tier: 'enhanced'
    },
    lastUpdated: '2025-01-27'
  };
}

// NEW: Enhanced local language and cultural context generator
function generateLocalLanguageContext(location: string): any {
  const languageContexts: Record<string, any> = {
    'kenya': {
      primaryLanguage: 'Swahili & English',
      commonPhrases: ['Karibu', 'Asante', 'Jambo', 'Mzuri sana'],
      businessTerms: ['Biashara', 'Mradi', 'Kazi', 'Ushirika'],
      culturalNuances: 'Warm hospitality, community-first approach, respect for elders',
      marketingStyle: 'Personal, relationship-focused, community-oriented',
      localExpressions: ['Tuko pamoja', 'Kazi yetu', 'Jitihada zetu']
    },
    'nigeria': {
      primaryLanguage: 'English, Hausa, Yoruba, Igbo',
      commonPhrases: ['Oga', 'Abeg', 'Wetin dey happen', 'How far'],
      businessTerms: ['Business', 'Work', 'Money', 'Success'],
      culturalNuances: 'Entrepreneurial spirit, networking culture, achievement focus',
      marketingStyle: 'Direct, motivational, success-oriented',
      localExpressions: ['No shaking', 'I go do am', 'We dey here']
    },
    'south africa': {
      primaryLanguage: 'English, Afrikaans, Zulu, Xhosa',
      commonPhrases: ['Howzit', 'Lekker', 'Ja', 'Eish'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Diverse culture, innovation focus, global perspective',
      marketingStyle: 'Professional, inclusive, forward-thinking',
      localExpressions: ['Ubuntu', 'Together we can', 'Moving forward']
    },
    'ghana': {
      primaryLanguage: 'English, Twi, Ga, Ewe',
      commonPhrases: ['Akwaaba', 'Medaase', 'Yoo', 'Chale'],
      businessTerms: ['Business', 'Work', 'Money', 'Success'],
      culturalNuances: 'Hospitality, respect, community values',
      marketingStyle: 'Warm, respectful, community-focused',
      localExpressions: ['Sankofa', 'Unity in diversity', 'Forward together']
    },
    'uganda': {
      primaryLanguage: 'English, Luganda, Runyankole',
      commonPhrases: ['Oli otya', 'Webale', 'Kale', 'Nja'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Friendly, welcoming, community spirit',
      marketingStyle: 'Friendly, approachable, community-oriented',
      localExpressions: ['Tugende', 'Together we grow', 'Community first']
    },
    'tanzania': {
      primaryLanguage: 'Swahili & English',
      commonPhrases: ['Karibu', 'Asante', 'Jambo', 'Mzuri'],
      businessTerms: ['Biashara', 'Kazi', 'Mradi', 'Ushirika'],
      culturalNuances: 'Peaceful, community-focused, natural beauty appreciation',
      marketingStyle: 'Peaceful, natural, community-oriented',
      localExpressions: ['Uhuru na Umoja', 'Peace and unity', 'Natural beauty']
    },
    'ethiopia': {
      primaryLanguage: 'Amharic & English',
      commonPhrases: ['Selam', 'Amesegenalu', 'Endet', 'Tena yistilign'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Ancient culture, hospitality, coffee culture',
      marketingStyle: 'Traditional, hospitable, culturally rich',
      localExpressions: ['Ethiopia first', 'Coffee culture', 'Ancient wisdom']
    },
    'rwanda': {
      primaryLanguage: 'Kinyarwanda, French & English',
      commonPhrases: ['Murakoze', 'Amahoro', 'Urugero', 'Nta kibazo'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Innovation, cleanliness, community unity',
      marketingStyle: 'Innovative, clean, community-focused',
      localExpressions: ['Agaciro', 'Dignity', 'Unity and reconciliation']
    },
    'default': {
      primaryLanguage: 'English',
      commonPhrases: ['Hello', 'Thank you', 'Welcome', 'Great'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Professional, friendly, community-oriented',
      marketingStyle: 'Professional, friendly, community-focused',
      localExpressions: ['Community first', 'Quality service', 'Local expertise']
    }
  };

  const locationKey = location.toLowerCase();
  for (const [key, context] of Object.entries(languageContexts)) {
    if (locationKey.includes(key)) {
      return context;
    }
  }
  return languageContexts['default'];
}

// NEW: Advanced climate insights for business relevance
function generateClimateInsights(location: string, businessType: string): any {
  const season = getSeason();
  const climateData: Record<string, any> = {
    'Spring': {
      businessImpact: 'Renewal and growth opportunities, seasonal business preparation',
      contentOpportunities: 'Fresh starts, new beginnings, seasonal preparation, growth themes',
      businessSuggestions: 'Launch new services, seasonal promotions, growth campaigns',
      localAdaptations: 'Spring cleaning services, seasonal menu changes, outdoor activities'
    },
    'Summer': {
      businessImpact: 'High energy and outdoor activities, peak business season',
      contentOpportunities: 'Vibrant colors, active lifestyle, summer solutions, outdoor themes',
      businessSuggestions: 'Summer specials, outdoor events, seasonal products',
      localAdaptations: 'Summer festivals, outdoor dining, seasonal services'
    },
    'Fall': {
      businessImpact: 'Planning and preparation, harvest and results focus',
      contentOpportunities: 'Preparation themes, results celebration, autumn aesthetics',
      businessSuggestions: 'Year-end planning, results showcase, preparation services',
      localAdaptations: 'Harvest celebrations, planning services, year-end reviews'
    },
    'Winter': {
      businessImpact: 'Strategic planning and indoor focus, reflection period',
      contentOpportunities: 'Planning themes, strategy focus, indoor solutions',
      businessSuggestions: 'Strategic planning, indoor services, year planning',
      localAdaptations: 'Indoor events, planning services, strategic consultations'
    }
  };

  // Add business-specific climate insights
  const businessClimateInsights: Record<string, any> = {
    'restaurant': {
      seasonalMenu: `${season} seasonal ingredients and dishes`,
      weatherAdaptation: `${season === 'Summer' ? 'Cooling beverages and light meals' : season === 'Winter' ? 'Warm comfort foods' : 'Seasonal specialties'}`,
      businessStrategy: `${season === 'Summer' ? 'Outdoor dining and seasonal menus' : 'Indoor comfort and seasonal specialties'}`
    },
    'fitness': {
      seasonalActivities: `${season === 'Summer' ? 'Outdoor workouts and water activities' : season === 'Winter' ? 'Indoor training and winter sports' : 'Seasonal fitness programs'}`,
      weatherAdaptation: `${season === 'Summer' ? 'Early morning and evening sessions' : 'Indoor and weather-appropriate activities'}`,
      businessStrategy: `${season === 'Summer' ? 'Outdoor fitness programs' : 'Indoor training focus'}`
    },
    'retail': {
      seasonalProducts: `${season} fashion and lifestyle products`,
      weatherAdaptation: `${season === 'Summer' ? 'Light clothing and outdoor gear' : season === 'Winter' ? 'Warm clothing and indoor items' : 'Seasonal essentials'}`,
      businessStrategy: `${season === 'Summer' ? 'Summer sales and outdoor products' : 'Seasonal collections and indoor focus'}`
    },
    'default': {
      seasonalFocus: `${season} business opportunities and seasonal services`,
      weatherAdaptation: `${season === 'Summer' ? 'Outdoor and seasonal services' : 'Indoor and year-round services'}`,
      businessStrategy: `${season} business strategies and seasonal promotions`
    }
  };

  const baseClimate = climateData[season as keyof typeof climateData];
  const businessClimate = businessClimateInsights[businessType.toLowerCase()] || businessClimateInsights['default'];

  return {
    season: season,
    businessImpact: baseClimate.businessImpact,
    contentOpportunities: baseClimate.contentOpportunities,
    businessSuggestions: baseClimate.businessSuggestions,
    localAdaptations: baseClimate.localAdaptations,
    businessSpecific: businessClimate,
    marketingAngle: `Leverage ${season.toLowerCase()} opportunities for ${businessType} business growth`
  };
}

// NEW: Real-time trending topics generator (can be enhanced with actual social media APIs)
function generateTrendingTopics(businessType: string, location: string, platform: string): any[] {
  const platformTrends: Record<string, any[]> = {
    'Instagram': [
      { topic: 'Visual storytelling trends', category: 'Platform', relevance: 'high' },
      { topic: 'Authentic content creation', category: 'Content', relevance: 'high' },
      { topic: 'Reels and short-form video', category: 'Format', relevance: 'medium' }
    ],
    'LinkedIn': [
      { topic: 'Professional networking trends', category: 'Platform', relevance: 'high' },
      { topic: 'Industry thought leadership', category: 'Content', relevance: 'high' },
      { topic: 'Career development insights', category: 'Professional', relevance: 'medium' }
    ],
    'Facebook': [
      { topic: 'Community building strategies', category: 'Platform', relevance: 'high' },
      { topic: 'Local business networking', category: 'Community', relevance: 'high' },
      { topic: 'Family-friendly content', category: 'Content', relevance: 'medium' }
    ],
    'Twitter': [
      { topic: 'Real-time conversation trends', category: 'Platform', relevance: 'high' },
      { topic: 'Viral content strategies', category: 'Content', relevance: 'high' },
      { topic: 'Trending hashtags', category: 'Engagement', relevance: 'medium' }
    ]
  };

  const businessTrends: Record<string, any[]> = {
    'restaurant': [
      { topic: 'Local food culture trends', category: 'Industry', relevance: 'high' },
      { topic: 'Sustainable dining practices', category: 'Trends', relevance: 'high' },
      { topic: 'Food delivery innovations', category: 'Technology', relevance: 'medium' }
    ],
    'technology': [
      { topic: 'AI and automation trends', category: 'Industry', relevance: 'high' },
      { topic: 'Digital transformation', category: 'Business', relevance: 'high' },
      { topic: 'Remote work solutions', category: 'Workplace', relevance: 'medium' }
    ],
    'healthcare': [
      { topic: 'Telehealth adoption', category: 'Industry', relevance: 'high' },
      { topic: 'Preventive healthcare', category: 'Wellness', relevance: 'high' },
      { topic: 'Mental health awareness', category: 'Health', relevance: 'medium' }
    ],
    'fitness': [
      { topic: 'Home workout trends', category: 'Industry', relevance: 'high' },
      { topic: 'Mental wellness integration', category: 'Wellness', relevance: 'high' },
      { topic: 'Community fitness challenges', category: 'Engagement', relevance: 'medium' }
    ],
    'finance': [
      { topic: 'Digital banking trends', category: 'Industry', relevance: 'high' },
      { topic: 'Financial literacy', category: 'Education', relevance: 'high' },
      { topic: 'Investment opportunities', category: 'Wealth', relevance: 'medium' }
    ],
    'education': [
      { topic: 'Online learning platforms', category: 'Industry', relevance: 'high' },
      { topic: 'Skill development trends', category: 'Learning', relevance: 'high' },
      { topic: 'Personalized education', category: 'Innovation', relevance: 'medium' }
    ],
    'retail': [
      { topic: 'E-commerce growth', category: 'Industry', relevance: 'high' },
      { topic: 'Omnichannel shopping', category: 'Customer', relevance: 'high' },
      { topic: 'Sustainable products', category: 'Trends', relevance: 'medium' }
    ],
    'real estate': [
      { topic: 'Virtual property tours', category: 'Industry', relevance: 'high' },
      { topic: 'Sustainable properties', category: 'Trends', relevance: 'high' },
      { topic: 'Investment opportunities', category: 'Market', relevance: 'medium' }
    ],
    'default': [
      { topic: 'Digital transformation trends', category: 'Business', relevance: 'high' },
      { topic: 'Customer experience optimization', category: 'Strategy', relevance: 'high' },
      { topic: 'Local business growth', category: 'Community', relevance: 'medium' }
    ]
  };

  const platformSpecific = platformTrends[platform] || platformTrends['Instagram'];
  const businessSpecific = businessTrends[businessType.toLowerCase()] || businessTrends['default'];
  const localTrends = [
    { topic: `${location} business growth`, category: 'Local', relevance: 'high' },
    { topic: `${location} community development`, category: 'Community', relevance: 'high' },
    { topic: `${location} economic trends`, category: 'Local', relevance: 'medium' }
  ];

  return [...platformSpecific, ...businessSpecific, ...localTrends].slice(0, 5);
}

// NEW: Local news and market insights generator
function generateLocalNewsContext(businessType: string, location: string): any[] {
  const newsInsights = [
    {
      type: 'Local Market',
      headline: `${location} business environment update`,
      impact: 'Local market conditions affecting business opportunities',
      businessRelevance: 'Market positioning and strategic planning',
      contentAngle: 'Local market expertise and insights'
    },
    {
      type: 'Industry Trends',
      headline: `${businessType} industry developments in ${location}`,
      impact: 'Industry-specific opportunities and challenges',
      businessRelevance: 'Competitive positioning and service innovation',
      contentAngle: 'Industry leadership and local expertise'
    },
    {
      type: 'Community Events',
      headline: `${location} community and business events`,
      impact: 'Networking and community engagement opportunities',
      businessRelevance: 'Community involvement and local partnerships',
      contentAngle: 'Community connection and local engagement'
    },
    {
      type: 'Economic Update',
      headline: `${location} economic indicators and business climate`,
      impact: 'Business planning and investment decisions',
      businessRelevance: 'Strategic planning and market timing',
      contentAngle: 'Economic expertise and market insights'
    }
  ];

  return newsInsights.slice(0, 3);
}

function getCulturallyAppropriatePersonDescription(location: string): string {
  const locationKey = location.toLowerCase();

  // African countries - prioritize Black/African people for cultural authenticity
  const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];

  for (const country of africanCountries) {
    if (locationKey.includes(country)) {
      return `🌍 AFRICAN REPRESENTATION REQUIRED:
- Show ONLY authentic Black/African people with natural African features
- Use diverse African skin tones from light to dark
- Show contemporary African fashion and modern styling
- Include natural African hairstyles and authentic expressions
- Focus on real-life scenarios: people working, socializing, using technology
- Show modern African urban life - offices, cafes, shopping, digital activities
- Use natural lighting that flatters darker skin tones
- Avoid stereotypes - show professional, educated, tech-savvy Africans
- Emphasize authenticity and cultural pride
- For Kenya specifically: Show Nairobi urban lifestyle, modern professionals, diverse ethnic groups`;
    }
  }

  // Asian countries - prioritize Asian people
  const asianCountries = ['china', 'japan', 'korea', 'india', 'thailand', 'vietnam', 'singapore', 'malaysia', 'indonesia', 'philippines', 'bangladesh', 'pakistan', 'sri lanka'];

  for (const country of asianCountries) {
    if (locationKey.includes(country)) {
      return 'Show authentic Asian people in natural, candid moments - relaxed expressions, genuine smiles, casual poses. Focus on real-life scenarios: people working, laughing, having conversations, or engaged in everyday activities. Use natural lighting and avoid overly posed or studio-like settings. Emphasize authenticity over perfection - slight imperfections make people look real and relatable.';
    }
  }

  // Middle Eastern countries
  const middleEasternCountries = ['saudi arabia', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman', 'jordan', 'lebanon', 'syria', 'iraq', 'iran', 'turkey', 'israel', 'palestine'];

  for (const country of middleEasternCountries) {
    if (locationKey.includes(country)) {
      return 'Show authentic Middle Eastern people in natural, candid moments - relaxed expressions, genuine smiles, casual poses. Focus on real-life scenarios: people working, laughing, having conversations, or engaged in everyday activities. Use natural lighting and avoid overly posed or studio-like settings. Emphasize authenticity over perfection - slight imperfections make people look real and relatable.';
    }
  }

  // Latin American countries
  const latinAmericanCountries = ['mexico', 'brazil', 'argentina', 'colombia', 'peru', 'venezuela', 'chile', 'ecuador', 'bolivia', 'paraguay', 'uruguay', 'guatemala', 'honduras', 'el salvador', 'nicaragua', 'costa rica', 'panama', 'cuba', 'dominican republic', 'puerto rico'];

  for (const country of latinAmericanCountries) {
    if (locationKey.includes(country)) {
      return 'Show authentic Latino/Hispanic people in natural, candid moments - relaxed expressions, genuine smiles, casual poses. Focus on real-life scenarios: people working, laughing, having conversations, or engaged in everyday activities. Use natural lighting and avoid overly posed or studio-like settings. Emphasize authenticity over perfection - slight imperfections make people look real and relatable.';
    }
  }

  // Default for Western countries and others - diverse representation
  return 'Show diverse, authentic people in natural, candid moments - relaxed expressions, genuine smiles, casual poses. Focus on real-life scenarios: people working, laughing, having conversations, or engaged in everyday activities. Use natural lighting and avoid overly posed or studio-like settings. Emphasize authenticity over perfection - slight imperfections make people look real and relatable.';
}