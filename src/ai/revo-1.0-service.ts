/**
 * Revo 1.0 - Enhanced AI Service with Gemini 2.5 Flash Image Preview
 * Enhanced with Gemini 2.5 Flash Image Preview for enhanced quality and perfect text rendering
 */
// Updated: Using direct Vertex AI for all AI generation (no proxy dependencies)
import { BrandProfile } from '@/lib/types';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';
import { generateContentDirect } from './revo-2.0-service';
import { revo10Config, revo10Prompts } from './models/versions/revo-1.0/config';
import type { ScheduledService } from '@/services/calendar-service';
import { advancedContentGenerator, BusinessProfile } from './advanced-content-generator';
import { CircuitBreakerManager } from './utils/circuit-breaker';
import { performanceAnalyzer } from './content-performance-analyzer';
import { trendingEnhancer } from './trending-content-enhancer';
import { ContentQualityEnhancer } from '@/utils/content-quality-enhancer';
import { BUSINESS_TYPE_DESIGN_DNA } from '@/ai/prompts/advanced-design-prompts';
// Multi-Assistant Architecture imports
import { assistantManager } from './assistants';
import { detectBusinessType } from './adaptive/business-type-detector';
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
// Import shared pipeline utilities
import {
  TextGenerationHandler
} from './revo/shared-pipeline';
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
  const contentText = `${content.headline || ''}${content.subheadline || ''}${content.caption || ''}`.toLowerCase();
  const businessNameLower = businessName.toLowerCase();
  const businessTypeLower = String(businessType || 'general business').toLowerCase();
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
// Get business-specific design DNA
function getBusinessDesignDNA(businessType: string): string {
  const businessTypeLower = String(businessType || 'general business').toLowerCase();
  return BUSINESS_TYPE_DESIGN_DNA[businessTypeLower as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default || '';
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
          insights: [`RSS data temporarily unavailable for ${businessType}in ${location}`],
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
  const businessTypeLower = String(businessType || 'general business').toLowerCase();
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
function getHumanDesignVariations(seed: number) {
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
  * Authentic ${businessType}contexts with real interactions
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
    'beauty': {
      name: 'Beauty & Wellness',
      worldClassBrands: ['Sephora', 'Ulta', 'L\'Oréal', 'MAC', 'Fenty Beauty', 'Glossier'],
      designBenchmarks: {
        visualStyle: 'Elegant, aspirational, luxurious, inclusive',
        colorPalettes: ['Soft pinks', 'Elegant golds', 'Pure whites', 'Rich purples', 'Natural tones'],
        typography: 'Elegant serifs, modern sans-serifs, luxury hierarchy',
        imagery: 'Beauty transformations, product close-ups, diverse models, spa environments',
        layout: 'Clean, luxurious, product-focused, aspirational',
        creativeElements: ['Beauty transformation scenes', 'Elegant spa environments', 'Product showcase displays', 'Diverse beauty representation', 'Luxurious texture elements']
      },
      creativityFrameworks: [
        'Beauty transformation storytelling',
        'Inclusive representation',
        'Luxury experience creation',
        'Product showcase excellence',
        'Confidence building imagery'
      ],
      industryTrends: ['Inclusive beauty', 'Natural ingredients', 'Sustainable packaging', 'Personalized beauty', 'Social media influence']
    },
    'automotive': {
      name: 'Automotive & Transportation',
      worldClassBrands: ['BMW', 'Mercedes-Benz', 'Tesla', 'Toyota', 'Audi', 'Porsche'],
      designBenchmarks: {
        visualStyle: 'Dynamic, powerful, premium, innovative',
        colorPalettes: ['Metallic silvers', 'Deep blacks', 'Racing reds', 'Premium blues', 'Bold accents'],
        typography: 'Bold, dynamic fonts, automotive hierarchy, strong messaging',
        imagery: 'Vehicles in motion, premium interiors, road scenes, technology features',
        layout: 'Dynamic, powerful, motion-focused, premium',
        creativeElements: ['Vehicles in dynamic motion', 'Premium interior showcases', 'Technology integration displays', 'Road and lifestyle scenes', 'Performance and luxury elements']
      },
      creativityFrameworks: [
        'Dynamic motion storytelling',
        'Premium luxury positioning',
        'Technology innovation showcase',
        'Performance demonstration',
        'Lifestyle integration'
      ],
      industryTrends: ['Electric vehicles', 'Autonomous driving', 'Connected cars', 'Sustainable mobility', 'Luxury experiences']
    },
    'legal': {
      name: 'Legal & Professional Services',
      worldClassBrands: ['Baker McKenzie', 'Clifford Chance', 'Latham & Watkins', 'Skadden', 'White & Case'],
      designBenchmarks: {
        visualStyle: 'Authoritative, trustworthy, professional, sophisticated',
        colorPalettes: ['Deep navy', 'Professional grays', 'Gold accents', 'Clean whites', 'Trustworthy blues'],
        typography: 'Authoritative serifs, professional hierarchy, legal clarity',
        imagery: 'Professional environments, legal symbols, handshakes, document signing',
        layout: 'Structured, authoritative, professional, trustworthy',
        creativeElements: ['Professional consultation scenes', 'Legal document environments', 'Handshake and agreement imagery', 'Courthouse and office settings', 'Justice and balance symbols']
      },
      creativityFrameworks: [
        'Authority and trust building',
        'Professional expertise demonstration',
        'Legal solution storytelling',
        'Client success representation',
        'Justice and fairness imagery'
      ],
      industryTrends: ['Legal technology', 'Remote consultations', 'Document automation', 'Client experience', 'Specialized expertise']
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
  return getBusinessTypeIntelligence(businessType, industryIntelligence);
}

/**
 * Enhanced business type intelligence matching
 */
function getBusinessTypeIntelligence(businessType: string, industryIntelligence: Record<string, any>): any {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Direct matches first
  if (industryIntelligence[businessLower]) {
    return industryIntelligence[businessLower];
  }

  // Keyword-based matching for better coverage
  if (businessLower.includes('restaurant') || businessLower.includes('food') || businessLower.includes('cafe') || businessLower.includes('dining')) {
    return industryIntelligence['restaurant'];
  } else if (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('digital') || businessLower.includes('app')) {
    return industryIntelligence['technology'];
  } else if (businessLower.includes('health') || businessLower.includes('medical') || businessLower.includes('clinic') || businessLower.includes('hospital')) {
    return industryIntelligence['healthcare'];
  } else if (businessLower.includes('fitness') || businessLower.includes('gym') || businessLower.includes('workout') || businessLower.includes('training')) {
    return industryIntelligence['fitness'];
  } else if (businessLower.includes('bank') || businessLower.includes('finance') || businessLower.includes('fintech') || businessLower.includes('payment')) {
    return industryIntelligence['finance'];
  } else if (businessLower.includes('education') || businessLower.includes('school') || businessLower.includes('learning') || businessLower.includes('course')) {
    return industryIntelligence['education'];
  } else if (businessLower.includes('retail') || businessLower.includes('shop') || businessLower.includes('store') || businessLower.includes('ecommerce')) {
    return industryIntelligence['retail'];
  } else if (businessLower.includes('real estate') || businessLower.includes('property') || businessLower.includes('housing') || businessLower.includes('realty')) {
    return industryIntelligence['real estate'];
  } else if (businessLower.includes('beauty') || businessLower.includes('salon') || businessLower.includes('spa') || businessLower.includes('cosmetic')) {
    return industryIntelligence['beauty'];
  } else if (businessLower.includes('automotive') || businessLower.includes('car') || businessLower.includes('vehicle') || businessLower.includes('auto')) {
    return industryIntelligence['automotive'];
  } else if (businessLower.includes('legal') || businessLower.includes('law') || businessLower.includes('attorney') || businessLower.includes('lawyer')) {
    return industryIntelligence['legal'];
  }

  // Default fallback
  return industryIntelligence['default'];
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
      description: `Create designs that rival the sophistication and quality of ${industryIntel.name}industry leaders`
    },
    {
      name: 'Industry Trend Integration',
      approach: `Incorporate current ${industryIntel.name}trends: ${industryIntel.industryTrends.slice(0, 3).join(', ')}`,
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
- **Industry Benchmarking:** Create designs that rival ${industryIntel.name}industry leaders
- **Trend Integration:** Incorporate current industry trends naturally
- **Creative Innovation:** Use ${creativityFramework.name}approach for unique positioning
- **Quality Standards:** Match world-class design quality and sophistication
- **Industry Relevance:** Ensure design feels authentic to ${industryIntel.name}industry`;
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
        experience: '20+ years in professional services and business solutions',
        marketDynamics: [
          'Local market competition and positioning',
          'Customer service expectations in the region',
          'Industry trends and best practices',
          'Quality standards and professional requirements',
          'Local business partnerships and networking'
        ],
        contentStrategies: [
          'Professional expertise showcase',
          'Customer success stories',
          'Industry insights and trends',
          'Quality service delivery',
          'Local market knowledge',
          'Professional development',
          'Community involvement',
          'Business growth strategies'
        ],
        engagementHooks: [
          'Professional excellence',
          'Quality service delivery',
          'Customer satisfaction',
          'Industry expertise',
          'Reliable solutions',
          'Professional growth',
          'Business success',
          'Trusted partnership'
        ]
      },
      localPhrases: [
        'Your professional partner',
        'Excellence in [location]',
        'Professional solutions',
        'Your trusted advisor',
        'Quality service provider',
        'Professional expertise in [location]',
        'Your business partner',
        'Professional excellence'
      ]
    }
  };
  let result = businessIntelligence[String(businessType || 'general business').toLowerCase()] || businessIntelligence['default'];

  // If no specific business type found, generate dynamic engagement hooks
  if (!businessIntelligence[String(businessType || 'general business').toLowerCase()]) {
    result = {
      ...result,
      name: businessType.charAt(0).toUpperCase() + businessType.slice(1),
      localExpertise: {
        ...result.localExpertise,
        engagementHooks: generateDynamicEngagementHooks(businessType),
        contentStrategies: generateDynamicContentStrategies(businessType),
        marketDynamics: generateDynamicMarketDynamics(businessType)
      },
      localPhrases: generateDynamicLocalPhrases(businessType)
    };
  }

  return result;
}

/**
 * Generate dynamic engagement hooks based on business type
 */
function generateDynamicEngagementHooks(businessType: string): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Base hooks that work for any business
  const baseHooks = [
    'Professional excellence',
    'Customer satisfaction',
    'Quality service delivery',
    'Trusted expertise'
  ];

  // Business-type-specific hooks
  const specificHooks: Record<string, string[]> = {
    'healthcare': ['Patient care', 'Health improvement', 'Medical expertise', 'Wellness solutions'],
    'education': ['Learning success', 'Student achievement', 'Educational excellence', 'Knowledge growth'],
    'consulting': ['Business growth', 'Strategic solutions', 'Expert guidance', 'Results delivery'],
    'retail': ['Product quality', 'Shopping experience', 'Customer value', 'Local shopping'],
    'restaurant': ['Culinary excellence', 'Dining experience', 'Fresh ingredients', 'Food satisfaction'],
    'fitness': ['Health transformation', 'Fitness goals', 'Wellness journey', 'Active lifestyle'],
    'beauty': ['Beauty enhancement', 'Self-care', 'Confidence building', 'Personal style'],
    'automotive': ['Vehicle reliability', 'Service quality', 'Transportation solutions', 'Automotive expertise'],
    'legal': ['Legal protection', 'Justice advocacy', 'Legal expertise', 'Rights protection'],
    'accounting': ['Financial clarity', 'Tax solutions', 'Business finances', 'Financial growth']
  };

  // Find matching business type or use base hooks
  for (const [type, hooks] of Object.entries(specificHooks)) {
    if (businessLower.includes(type)) {
      return [...hooks, ...baseHooks.slice(0, 4)];
    }
  }

  // Generate generic hooks based on business type keywords
  const generatedHooks = [
    `${businessType} excellence`,
    `Quality ${businessType} solutions`,
    `Professional ${businessType} service`,
    `${businessType} expertise`
  ];

  return [...generatedHooks, ...baseHooks];
}

/**
 * Generate dynamic content strategies based on business type
 */
function generateDynamicContentStrategies(businessType: string): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  const baseStrategies = [
    'Customer success stories',
    'Professional expertise showcase',
    'Industry insights and trends',
    'Local market knowledge',
    'Quality service delivery',
    'Community involvement',
    'Business growth strategies',
    'Professional development'
  ];

  const specificStrategies: Record<string, string[]> = {
    'healthcare': ['Patient testimonials', 'Health education', 'Medical breakthroughs', 'Wellness tips'],
    'education': ['Student success stories', 'Learning methodologies', 'Educational resources', 'Academic achievements'],
    'consulting': ['Business case studies', 'Strategic insights', 'Industry analysis', 'Growth strategies'],
    'retail': ['Product highlights', 'Shopping guides', 'Customer reviews', 'Seasonal promotions'],
    'restaurant': ['Menu highlights', 'Chef stories', 'Ingredient sourcing', 'Dining experiences'],
    'fitness': ['Transformation stories', 'Workout tips', 'Nutrition advice', 'Fitness challenges'],
    'beauty': ['Beauty tutorials', 'Style guides', 'Product reviews', 'Transformation stories'],
    'automotive': ['Vehicle features', 'Maintenance tips', 'Service quality', 'Customer experiences'],
    'legal': ['Legal insights', 'Case studies', 'Rights education', 'Legal updates'],
    'accounting': ['Financial tips', 'Tax strategies', 'Business insights', 'Financial planning']
  };

  // Find matching business type or use base strategies
  for (const [type, strategies] of Object.entries(specificStrategies)) {
    if (businessLower.includes(type)) {
      return [...strategies, ...baseStrategies.slice(0, 4)];
    }
  }

  return baseStrategies;
}

/**
 * Generate dynamic market dynamics based on business type
 */
function generateDynamicMarketDynamics(businessType: string): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  const baseDynamics = [
    'Local market competition and positioning',
    'Customer service expectations in the region',
    'Industry trends and best practices',
    'Quality standards and professional requirements',
    'Local business partnerships and networking'
  ];

  const specificDynamics: Record<string, string[]> = {
    'healthcare': ['Healthcare regulations', 'Patient care standards', 'Medical technology advances', 'Insurance requirements'],
    'education': ['Educational standards', 'Learning technology trends', 'Student performance metrics', 'Curriculum requirements'],
    'consulting': ['Business consulting demand', 'Industry expertise requirements', 'Strategic planning trends', 'Client success metrics'],
    'retail': ['Consumer shopping patterns', 'Product demand trends', 'Seasonal sales cycles', 'Customer loyalty programs'],
    'restaurant': ['Food service regulations', 'Culinary trends', 'Customer dining preferences', 'Local ingredient sourcing'],
    'fitness': ['Health and wellness trends', 'Fitness equipment innovations', 'Member retention strategies', 'Health regulations'],
    'beauty': ['Beauty industry trends', 'Product innovation cycles', 'Customer beauty preferences', 'Seasonal beauty demands'],
    'automotive': ['Vehicle technology advances', 'Service quality standards', 'Customer transportation needs', 'Automotive regulations'],
    'legal': ['Legal service demand', 'Regulatory changes', 'Client legal needs', 'Legal technology adoption'],
    'accounting': ['Tax regulation changes', 'Financial reporting standards', 'Business accounting needs', 'Technology adoption']
  };

  // Find matching business type or use base dynamics
  for (const [type, dynamics] of Object.entries(specificDynamics)) {
    if (businessLower.includes(type)) {
      return [...dynamics, ...baseDynamics.slice(0, 1)];
    }
  }

  return baseDynamics;
}

/**
 * Generate dynamic local phrases based on business type
 */
function generateDynamicLocalPhrases(businessType: string): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  const basePhrases = [
    'Your professional partner',
    'Excellence in [location]',
    'Professional solutions',
    'Your trusted advisor',
    'Quality service provider',
    'Professional expertise in [location]',
    'Your business partner',
    'Professional excellence'
  ];

  const specificPhrases: Record<string, string[]> = {
    'healthcare': ['Your health partner', 'Healthcare excellence in [location]', 'Your medical team', 'Health solutions'],
    'education': ['Your learning partner', 'Educational excellence in [location]', 'Your academic guide', 'Learning solutions'],
    'consulting': ['Your business advisor', 'Consulting excellence in [location]', 'Your strategic partner', 'Business solutions'],
    'retail': ['Your shopping destination', 'Retail excellence in [location]', 'Your local store', 'Shopping solutions'],
    'restaurant': ['Your dining destination', 'Culinary excellence in [location]', 'Your local restaurant', 'Dining solutions'],
    'fitness': ['Your fitness partner', 'Wellness excellence in [location]', 'Your health journey', 'Fitness solutions'],
    'beauty': ['Your beauty partner', 'Beauty excellence in [location]', 'Your style guide', 'Beauty solutions'],
    'automotive': ['Your automotive partner', 'Service excellence in [location]', 'Your vehicle expert', 'Automotive solutions'],
    'legal': ['Your legal advocate', 'Legal excellence in [location]', 'Your rights protector', 'Legal solutions'],
    'accounting': ['Your financial partner', 'Accounting excellence in [location]', 'Your financial advisor', 'Financial solutions']
  };

  // Find matching business type or use base phrases
  for (const [type, phrases] of Object.entries(specificPhrases)) {
    if (businessLower.includes(type)) {
      return [...phrases, ...basePhrases.slice(0, 4)];
    }
  }

  return basePhrases;
}

// NEW: Dynamic Content Strategy Engine - Never Repetitive
function getDynamicContentStrategy(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);
  const contentStrategies = [
    {
      name: 'Local Market Expert',
      approach: `Position as the ${businessIntel.name}expert in ${location}with ${businessIntel.localExpertise.experience}`,
      focus: 'Local expertise, community knowledge, market insights',
      hooks: businessIntel.localExpertise.engagementHooks.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['local expertise', 'community focused', 'trusted service', 'proven results']).slice(0, 4),
      description: `Write like a ${businessIntel.localExpertise.experience}professional who knows ${location}inside and out`
    },
    {
      name: 'Community Storyteller',
      approach: `Share authentic stories about local ${businessIntel.name}success and community impact`,
      focus: 'Real stories, community connection, authentic experiences',
      hooks: businessIntel.localExpertise.engagementHooks.slice(4, 8),
      phrases: (businessIntel.localPhrases || ['community stories', 'local success', 'authentic experiences', 'real results']).slice(4, 8),
      description: 'Share real, relatable stories that connect with the local community'
    },
    {
      name: 'Industry Innovator',
      approach: `Showcase cutting-edge ${businessIntel.name}solutions and industry leadership`,
      focus: 'Innovation, industry trends, competitive advantage',
      hooks: businessIntel.localExpertise.contentStrategies.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['innovative solutions', 'industry leader', 'cutting-edge', 'advanced technology']).slice(0, 4),
      description: 'Position as an industry leader with innovative solutions and insights'
    },
    {
      name: 'Problem Solver',
      approach: `Address specific ${businessIntel.name}challenges that local businesses and people face`,
      focus: 'Problem identification, solution offering, value demonstration',
      hooks: businessIntel.localExpertise.marketDynamics.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['problem solver', 'effective solutions', 'proven results', 'reliable service']).slice(0, 4),
      description: 'Identify and solve real problems that matter to the local community'
    },
    {
      name: 'Success Catalyst',
      approach: `Inspire and guide local ${businessIntel.name}success through proven strategies`,
      focus: 'Success stories, proven methods, inspirational guidance',
      hooks: businessIntel.localExpertise.contentStrategies.slice(4, 8),
      phrases: (businessIntel.localPhrases || ['success catalyst', 'proven strategies', 'inspiring results', 'growth partner']).slice(4, 8),
      description: 'Inspire success through proven strategies and real results'
    }
  ];
  return contentStrategies[seed % contentStrategies.length];
}
// NEW: Human Writing Style Generator - Authentic, Engaging with Brand Voice Integration
function getHumanWritingStyle(businessType: string, location: string, seed: number, brandProfile?: any): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);

  // Check for brand voice override
  const brandVoice = brandProfile?.brandVoice || brandProfile?.writingTone;
  if (brandVoice) {
    return generateBrandVoiceStyle(brandVoice, businessType, businessIntel);
  }

  const writingStyles = [
    {
      name: 'Conversational Expert',
      tone: 'Friendly, knowledgeable, approachable',
      voice: `Like a ${businessIntel.localExpertise.experience}professional chatting with a friend over coffee`,
      characteristics: [
        'Use local phrases naturally',
        'Share personal insights and experiences',
        'Ask engaging questions',
        'Use conversational language',
        'Show genuine enthusiasm for the business'
      ],
      examples: [
        `"You know what I love about ${location}? The way our community..."`,
        `"After ${businessIntel.localExpertise.experience}in this industry, I've learned..."`,
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
        `"This is why I'm so proud to be part of the ${location}community..."`,
        `"Our ${location}neighbors never cease to amaze me..."`,
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
        `"I've noticed that many ${location}businesses struggle with..."`,
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
        `"I'm thrilled to share some amazing news from our ${location}community..."`,
        `"This success story is exactly why I love ${businessIntel.name}in ${location}..."`,
        `"Let's celebrate this incredible achievement together..."`
      ]
    }
  ];
  return writingStyles[seed % writingStyles.length];
}
// NEW: Anti-Repetition Content Engine
function generateUniqueContentVariation(businessType: string, location: string, seed: number, brandProfile?: any): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);
  const contentStrategy = getDynamicContentStrategy(businessType, location, seed);
  const writingStyle = getHumanWritingStyle(businessType, location, seed, brandProfile);
  // Generate unique content angle based on multiple factors
  const contentAngles = [
    {
      type: 'Local Insight',
      focus: `Share unique ${businessIntel.name}insights specific to ${location}`,
      examples: [
        `"What I've learned about ${businessIntel.name}in ${location}after ${businessIntel.localExpertise.experience}..."`,
        `"The ${businessIntel.name}landscape in ${location}is unique because..."`,
        `"Here's what makes ${location}special for ${businessIntel.name}businesses..."`
      ]
    },
    {
      type: 'Community Story',
      focus: `Tell a compelling story about local ${businessIntel.name}impact`,
      examples: [
        `"Last month, something incredible happened in our ${location}community..."`,
        `"I want to share a story that perfectly captures why we do what we do..."`,
        `"This is the kind of moment that makes ${businessIntel.name}in ${location}special..."`
      ]
    },
    {
      type: 'Industry Innovation',
      focus: `Showcase cutting-edge ${businessIntel.name}solutions`,
      examples: [
        `"We're excited to introduce something that's changing ${businessIntel.name}in ${location}..."`,
        `"Here's how we're innovating in the ${businessIntel.name}space..."`,
        `"This new approach is revolutionizing how we do ${businessIntel.name}in ${location}..."`
      ]
    },
    {
      type: 'Problem Solution',
      focus: `Address specific ${businessIntel.name}challenges in ${location}`,
      examples: [
        `"I've noticed that many ${location}businesses struggle with..."`,
        `"Here's a common challenge in ${businessIntel.name}and how we solve it..."`,
        `"Let me share what I've learned about overcoming this ${businessIntel.name}obstacle..."`
      ]
    },
    {
      type: 'Success Celebration',
      focus: `Celebrate local ${businessIntel.name}achievements`,
      examples: [
        `"I'm thrilled to share some amazing news from our ${location}community..."`,
        `"This success story is exactly why I love ${businessIntel.name}in ${location}..."`,
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
    { topic: `${businessType}innovation trends`, category: 'Industry', relevance: 'high' },
    { topic: `${location}business growth`, category: 'Local', relevance: 'high' },
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
  const businessImpacts = businessWeatherImpacts[String(businessType || 'general business').toLowerCase()] || businessWeatherImpacts['retail'];
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
  const opportunities = contentOpportunities[String(businessType || 'general business').toLowerCase()] || contentOpportunities['retail'];
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
    { name: `${location}Business Expo`, venue: 'Local Convention Center', relevance: 'networking' },
    { name: `${businessType}Innovation Summit`, venue: 'Business District', relevance: 'industry' },
    { name: 'Local Entrepreneur Meetup', venue: 'Community Center', relevance: 'community' }
  ];
  return opportunities.slice(0, 2);
}
// Direct Vertex AI models (no proxy dependencies)
const REVO_1_0_IMAGE_MODEL = 'gemini-2.5-flash-image'; // Same model as Revo 2.0 (confirmed working)
const REVO_1_0_TEXT_MODEL = 'gemini-2.5-flash'; // Direct Vertex AI model
// Using imported generateContentDirect from revo-2.0-service.ts
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
  const contentText = `${content.headline || ''}${content.subheadline || ''}${content.caption || ''}`.toLowerCase();
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
  const hasBusinessType = contentText.includes(String(businessType || 'general business').toLowerCase());
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
 * Check if we should use assistant for this business type (Revo 1.0)
 */
function shouldUseAssistant(businessType: string): boolean {
  // Safety check: ensure businessType is a valid string
  if (!businessType || typeof businessType !== 'string') {
    console.warn(`⚠️ [Revo 1.0] Invalid businessType for assistant check:`, businessType);
    return false;
  }

  const envVar = `ASSISTANT_ROLLOUT_${businessType.toUpperCase()}`;
  const percentage = parseInt(process.env[envVar] || '0', 10);
  const random = Math.random() * 100;
  return random < percentage;
}

/**
 * Generate content using Revo 1.0 with Gemini (following Revo 2.0 architecture)
 * Now with Multi-Assistant Architecture support
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
  useLocalLanguage?: boolean;
  scheduledServices?: ScheduledService[];
  includePeople?: boolean;
  designExamples?: string[];
  accentColor?: string;
  backgroundColor?: string;
}) {
  const startTime = Date.now();
  try {
    // Convert input to Revo 2.0 compatible options format
    const options = {
      businessType: input.businessType,
      platform: input.platform,
      aspectRatio: getPlatformAspectRatio(input.platform),
      visualStyle: input.visualStyle || 'modern',
      followBrandColors: input.followBrandColors !== false,
      includePeopleInDesigns: input.includePeople !== false,
      useLocalLanguage: input.useLocalLanguage || false,
      scheduledServices: input.scheduledServices || [],
      brandProfile: {
        businessName: input.businessName,
        businessType: input.businessType,
        location: input.location,
        targetAudience: input.targetAudience,
        brandVoice: input.writingTone,
        uniqueSellingPoints: input.competitiveAdvantages ? [input.competitiveAdvantages] : [],
        services: input.services ? [input.services] : [],
        keyFeatures: input.keyFeatures ? [input.keyFeatures] : [],
        brandColors: {
          primary: input.primaryColor || '#1a73e8',
          secondary: '#34a853',
          background: '#ffffff'
        },
        contactInfo: input.contactInfo,
        websiteUrl: input.websiteUrl,
        designExamples: input.designExamples || [],
        primaryColor: input.primaryColor,
        accentColor: input.accentColor,
        backgroundColor: input.backgroundColor
      }
    };

    // TASK 21: Log brand profile data usage for analytics
    const usageLog = logBrandProfileUsage(options.brandProfile, 'content', input.platform);

    // Multi-Assistant Architecture Integration
    const detectionResult = detectBusinessType(options.brandProfile);
    const detectedType = typeof detectionResult === 'string' ? detectionResult : detectionResult.primaryType;
    console.log(`🔍 [Revo 1.0] Detected business type: ${detectedType}`);

    const useAssistant = shouldUseAssistant(detectedType);
    const fallbackEnabled = process.env.ENABLE_ASSISTANT_FALLBACK !== 'false';

    if (useAssistant && assistantManager.isAvailable(detectedType)) {
      console.log(`🤖 [Revo 1.0] Using Multi-Assistant Architecture for ${detectedType}`);
      console.log(`🔧 [Revo 1.0] Fallback to standard generation: ${fallbackEnabled ? 'ENABLED' : 'DISABLED'}`);

      try {
        // Generate content using specialized assistant
        const assistantResponse = await assistantManager.generateContent({
          businessType: detectedType,
          brandProfile: options.brandProfile,
          concept: await generateRevo10CreativeConcept(options),
          imagePrompt: '', // Will be generated by assistant
          platform: input.platform,
          marketingAngle: undefined,
          useLocalLanguage: options.useLocalLanguage,
        });

        console.log(`✅ [Revo 1.0] Assistant generation successful`);

        // Validate story coherence between headline and caption
        const coherenceValidation = validateStoryCoherence(
          assistantResponse.headline,
          assistantResponse.caption,
          detectedType
        );

        console.log('🔗 [Revo 1.0] Story coherence validation:', coherenceValidation);

        if (coherenceValidation.issues.length > 0) {
          console.log(`🚨 [Revo 1.0 COHERENCE ISSUES] Found ${coherenceValidation.issues.length} coherence issues:`);
          coherenceValidation.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
          });
        } else {
          console.log(`✅ [Revo 1.0 COHERENCE SUCCESS] No coherence issues found`);
        }

        // Check if coherence is acceptable
        const coherenceAcceptable = coherenceValidation.isCoherent && coherenceValidation.coherenceScore >= 60;

        if (!coherenceAcceptable) {
          console.warn(`⚠️ [Revo 1.0] Assistant content has poor coherence (score: ${coherenceValidation.coherenceScore})`);

          if (!fallbackEnabled) {
            console.error(`🚫 [Revo 1.0] Fallback is DISABLED - throwing error for debugging`);
            throw new Error(`Assistant content failed coherence validation (score: ${coherenceValidation.coherenceScore})`);
          }

          console.warn(`⚠️ [Revo 1.0] Falling back to standard Gemini generation due to poor coherence`);
          // Fall through to standard generation
        } else {
          console.log(`✅ [Revo 1.0] Assistant content passed coherence validation (score: ${coherenceValidation.coherenceScore})`);

          // Return assistant-generated content
          const processingTime = Date.now() - startTime;
          return {
            content: assistantResponse.caption,
            headline: assistantResponse.headline,
            subheadline: assistantResponse.subheadline || '',
            callToAction: assistantResponse.cta,
            hashtags: Array.isArray(assistantResponse.hashtags)
              ? assistantResponse.hashtags.join(' ')
              : assistantResponse.hashtags,
            catchyWords: assistantResponse.headline,
            contentStrategy: 'assistant-generated',
            businessStrengths: ['Specialized content'],
            marketOpportunities: ['AI-optimized'],
            valueProposition: 'Assistant-powered content',
            platform: input.platform,
            businessType: detectedType,
            location: input.location,
            processingTime,
            model: 'Revo 1.0 + OpenAI Assistant',
            qualityScore: 9.0,
            coherenceScore: coherenceValidation.coherenceScore
          };
        }

      } catch (error) {
        console.error(`❌ [Revo 1.0] Assistant generation failed for ${detectedType}:`, error);

        if (!fallbackEnabled) {
          console.error(`🚫 [Revo 1.0] Fallback is DISABLED - throwing error for debugging`);
          throw new Error(`Assistant generation failed for ${detectedType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        console.warn(`⚠️ [Revo 1.0] Fallback ENABLED - falling back to standard Gemini generation`);
      }
    }

    // Step 1: Generate creative concept (using Revo 2.0 logic)
    const concept = await generateRevo10CreativeConcept(options);
    // Step 2: Generate content using Gemini (instead of Claude)
    const contentResult = await generateRevo10ContentWithGemini(options, concept);
    const processingTime = Date.now() - startTime;
    return {
      content: contentResult.caption,
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      callToAction: contentResult.cta,
      hashtags: Array.isArray(contentResult.hashtags) ? contentResult.hashtags.join(' ') : contentResult.hashtags,
      catchyWords: contentResult.headline,
      contentStrategy: concept.contentStrategy || 'awareness',
      businessStrengths: concept.businessStrengths || ['Professional service'],
      marketOpportunities: concept.marketOpportunities || ['Market growth'],
      valueProposition: concept.valueProposition || 'Quality service provider',
      platform: input.platform,
      businessType: input.businessType,
      location: input.location,
      processingTime,
      model: 'Revo 1.0 Gemini Edition',
      qualityScore: 8.5
    };
  } catch (error) {
    console.error('❌ [Revo 1.0] Content generation failed:', error);
    throw new Error(`Revo 1.0 content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
/**
 * Generate creative concept for Revo 1.0 (following Revo 2.0 architecture)
 */
async function generateRevo10CreativeConcept(options: any): Promise<any> {
  // Use same logic as Revo 2.0 but adapted for Revo 1.0
  const { businessType, brandProfile, platform, scheduledServices } = options;
  // Extract today's services for focused content
  const todaysServices = scheduledServices?.filter((s: any) => s.isToday) || [];
  const upcomingServices = scheduledServices?.filter((s: any) => s.isUpcoming) || [];
  // Generate creative concept using same approach as Revo 2.0
  return {
    concept: `Dynamic ${businessType} content for ${platform}`,
    visualTheme: options.visualStyle || 'modern',
    contentStrategy: 'engagement',
    businessStrengths: brandProfile.uniqueSellingPoints || ['Professional service'],
    marketOpportunities: ['Market growth', 'Customer engagement'],
    valueProposition: `Quality ${businessType} services`,
    todaysServices,
    upcomingServices
  };
}

// ============================================================================
// ENHANCED HEADLINES & SUBHEADLINES SYSTEM
// Addresses critical issues: duplicate headlines, brand names as headlines,
// vague subheadlines, poor message hierarchy, generic corporate jargon
// ============================================================================

/**
 * Story Coherence Engine - Ensures headlines and captions tell ONE complete story
 */
interface StoryCoherence {
  storyTheme: string;
  emotionalTone: 'urgent' | 'playful' | 'professional' | 'confident' | 'caring' | 'innovative';
  visualContext: string;
  moneyFlowDirection: 'incoming' | 'outgoing' | 'neutral';
  specificBenefit: string;
  targetAction: string;
}

/**
 * Headline Uniqueness Tracking System - Prevents duplicate headlines across campaigns
 */
const headlineUniquenessTracker = new Map<string, { headlines: string[], lastUsed: number }>();

/**
 * Formula Anti-Repetition System - Tracks headline formulas to prevent overuse
 */
const headlineFormulaTracker = new Map<string, { formulas: string[], lastUsed: number }>();

/**
 * Enhanced Cliché Filter - Comprehensive list of banned generic phrases
 */
const BANNED_HEADLINE_CLICHES = [
  // User-identified weak patterns
  'your way', 'anywhere anytime', 'simple tech for everyone', 'brighter tomorrow',
  'for all', 'financial technology for a brighter tomorrow', 'manage your money your way',

  // Generic corporate jargon
  'professional services that', 'solutions that actually work', 'serving the community with',
  'quality service you can trust', 'experience the excellence of', 'committed to providing',
  'dedicated to serving', 'excellence in', 'trusted by', 'leading provider of',

  // Vague aspirational phrases
  'unlock your potential', 'transform your business', 'revolutionize your', 'next level',
  'cutting edge', 'state of the art', 'world class', 'premium quality', 'innovative solutions'
];

/**
 * Proven Headline/Subheadline Patterns - Based on user's best practices
 */
interface HeadlinePattern {
  name: string;
  headlineStructure: string;
  subheadlineStructure: string;
  example: { headline: string; subheadline: string };
}

const PROVEN_HEADLINE_PATTERNS: HeadlinePattern[] = [
  {
    name: 'Problem → Solution',
    headlineStructure: 'Tired of [problem]?',
    subheadlineStructure: '[Specific solution] from your [device/location]',
    example: { headline: 'Tired of 3-Day Transfer Waits?', subheadline: 'Instant payments from your phone' }
  },
  {
    name: 'Benefit → How',
    headlineStructure: '[Specific benefit] in [timeframe]',
    subheadlineStructure: '[How it works] that actually works',
    example: { headline: 'Pay Rent in Seconds', subheadline: 'Mobile banking that actually works' }
  },
  {
    name: 'Big Promise → Specific Proof',
    headlineStructure: '[Aspirational outcome], Unlocked',
    subheadlineStructure: '[Specific features]. [Specific benefits]. [Specific guarantee].',
    example: { headline: 'Financial Freedom, Unlocked', subheadline: 'Zero fees. Instant transfers. 24/7 access.' }
  },
  {
    name: 'Urgent → Relief',
    headlineStructure: '[Urgent situation]',
    subheadlineStructure: '[Immediate solution], right now',
    example: { headline: "Rent's Due Tomorrow", subheadline: 'Transfer instantly, right now' }
  },
  {
    name: 'Direct Benefit → Proof',
    headlineStructure: '[Action] [Benefit]',
    subheadlineStructure: '[Specific proof/guarantee]',
    example: { headline: 'Accept Payments Instantly', subheadline: 'Zero setup fees, live in 5 minutes' }
  }
];

// ============================================================================
// UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK
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
      headline: 'Student Budget Tight?',
      subheadline: 'Banking with zero monthly fees',
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
    console.log(`🔄 [Revo 1.0] All angles used for ${brandKey}, starting new campaign cycle`);
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

  console.log(`🎯 [Revo 1.0] Assigned marketing angle: ${selectedAngle.name} (${selectedAngle.id})`);
  console.log(`📊 [Revo 1.0] Campaign progress: ${tracker.usedAngles.length}/${MARKETING_ANGLES.length} angles used`);

  return selectedAngle;
}

/**
 * Select optimal angle based on business context
 */
function selectOptimalAngle(availableAngles: MarketingAngle[], options: any): MarketingAngle {
  const businessType = options.businessType?.toLowerCase() || '';
  const brandProfile = options.brandProfile || {};

  // Business type preferences for angle selection
  const businessAnglePreferences: { [key: string]: string[] } = {
    'finance': ['feature', 'problem', 'benefit', 'transformation'],
    'fintech': ['feature', 'usecase', 'transformation', 'social_proof'],
    'banking': ['problem', 'benefit', 'usecase', 'transformation'],
    'restaurant': ['usecase', 'audience', 'social_proof', 'transformation'],
    'healthcare': ['benefit', 'problem', 'social_proof', 'audience'],
    'technology': ['feature', 'usecase', 'transformation', 'benefit'],
    'retail': ['audience', 'usecase', 'social_proof', 'problem'],
    'education': ['benefit', 'transformation', 'audience', 'social_proof'],
    'fitness': ['transformation', 'benefit', 'audience', 'social_proof'],
    'beauty': ['transformation', 'audience', 'social_proof', 'benefit']
  };

  const preferredAngles = businessAnglePreferences[businessType] || ['feature', 'benefit', 'usecase', 'problem'];

  // Find first available preferred angle
  for (const preferredId of preferredAngles) {
    const angle = availableAngles.find(a => a.id === preferredId);
    if (angle) {
      console.log(`🎯 [Revo 1.0] Selected optimal angle for ${businessType}: ${angle.name}`);
      return angle;
    }
  }

  // Fallback to random available angle
  const randomAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
  console.log(`🎲 [Revo 1.0] Selected random angle: ${randomAngle.name}`);
  return randomAngle;
}

/**
 * Generate unique campaign ID for angle tracking
 */
function generateCampaignId(brandKey: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${brandKey}-${timestamp}-${random}`;
}

/**
 * Validate that generated content matches assigned marketing angle
 */
function validateAngleAdherence(content: any, assignedAngle: MarketingAngle, options: any): {
  isValid: boolean;
  adherenceScore: number;
  issues: string[];
} {
  const issues: string[] = [];
  let adherenceScore = 100;

  const headline = content.headline?.toLowerCase() || '';
  const caption = content.caption?.toLowerCase() || '';
  const businessType = options.businessType?.toLowerCase() || '';

  // Angle-specific validation
  switch (assignedAngle.id) {
    case 'feature':
      // Should focus on ONE specific feature
      if (caption.includes('and') && caption.includes('also') && caption.includes('plus')) {
        issues.push('Feature angle should focus on ONE feature, not list multiple features');
        adherenceScore -= 30;
      }
      break;

    case 'usecase':
      // Should reference specific scenario/context
      const scenarioKeywords = ['when', 'during', 'while', 'at home', 'at work', 'traveling', 'emergency'];
      const hasScenario = scenarioKeywords.some(keyword => caption.includes(keyword));
      if (!hasScenario) {
        issues.push('Use-case angle should reference specific scenario or context');
        adherenceScore -= 25;
      }
      break;

    case 'audience':
      // Should speak to specific demographic
      const audienceKeywords = ['student', 'parent', 'business owner', 'professional', 'family', 'entrepreneur'];
      const hasAudience = audienceKeywords.some(keyword => caption.includes(keyword));
      if (!hasAudience) {
        issues.push('Audience angle should speak directly to specific demographic');
        adherenceScore -= 25;
      }
      break;

    case 'problem':
      // Should lead with problem, then solution
      const problemKeywords = ['tired of', 'frustrated', 'struggling', 'difficult', 'problem', 'challenge'];
      const hasProblem = problemKeywords.some(keyword => caption.includes(keyword));
      if (!hasProblem) {
        issues.push('Problem-solution angle should clearly state the problem');
        adherenceScore -= 30;
      }
      break;

    case 'transformation':
      // Should show before/after contrast
      const transformationKeywords = ['before', 'after', 'was', 'now', 'used to', 'today', 'from', 'to'];
      const hasTransformation = transformationKeywords.some(keyword => caption.includes(keyword));
      if (!hasTransformation) {
        issues.push('Transformation angle should show clear before/after contrast');
        adherenceScore -= 30;
      }
      break;

    case 'social_proof':
      // Should include testimonial, stats, or customer story
      const proofKeywords = ['customers', 'users', 'saved', 'testimonial', 'success', 'trust', 'reviews'];
      const hasProof = proofKeywords.some(keyword => caption.includes(keyword));
      if (!hasProof) {
        issues.push('Social proof angle should include customer success or statistics');
        adherenceScore -= 30;
      }
      break;
  }

  // Check for anti-patterns (everything in every ad)
  const featureCount = (caption.match(/feature|benefit|advantage/g) || []).length;
  if (featureCount > 3 && assignedAngle.id !== 'feature') {
    issues.push('Avoid listing multiple features - focus on assigned angle');
    adherenceScore -= 20;
  }

  return {
    isValid: adherenceScore >= 70,
    adherenceScore: Math.max(0, adherenceScore),
    issues
  };
}

/**
 * Check if headline is a duplicate across campaigns
 */
function isHeadlineDuplicate(brandKey: string, headline: string): boolean {
  const tracker = headlineUniquenessTracker.get(brandKey) || { headlines: [], lastUsed: 0 };
  return tracker.headlines.includes(headline.toLowerCase().trim());
}

/**
 * Remember headline usage to prevent duplicates
 */
function rememberHeadlineUsage(brandKey: string, headline: string): void {
  const tracker = headlineUniquenessTracker.get(brandKey) || { headlines: [], lastUsed: Date.now() };
  tracker.headlines.push(headline.toLowerCase().trim());
  tracker.lastUsed = Date.now();

  // Keep only last 50 headlines to prevent memory bloat
  if (tracker.headlines.length > 50) {
    tracker.headlines = tracker.headlines.slice(-50);
  }

  headlineUniquenessTracker.set(brandKey, tracker);
}

/**
 * Check if headline uses brand name (should be avoided)
 */
function isHeadlineBrandName(headline: string, brandName: string): boolean {
  const cleanHeadline = headline.toLowerCase().trim();
  const cleanBrandName = brandName.toLowerCase().trim();

  // Check if headline starts with brand name
  if (cleanHeadline.startsWith(cleanBrandName)) {
    return true;
  }

  // Check if headline is just the brand name
  if (cleanHeadline === cleanBrandName) {
    return true;
  }

  // Check if headline is brand name followed by colon or dash
  if (cleanHeadline.startsWith(cleanBrandName + ':') || cleanHeadline.startsWith(cleanBrandName + ' -')) {
    return true;
  }

  return false;
}

/**
 * Check if text contains clichés from the banned list
 */
function containsCliche(text: string): { hasCliche: boolean; cliches: string[] } {
  const lowerText = text.toLowerCase();
  const foundCliches: string[] = [];

  for (const cliche of BANNED_HEADLINE_CLICHES) {
    if (lowerText.includes(cliche.toLowerCase())) {
      foundCliches.push(cliche);
    }
  }

  return {
    hasCliche: foundCliches.length > 0,
    cliches: foundCliches
  };
}

/**
 * Validate message hierarchy between headline and subheadline
 */
function validateMessageHierarchy(headline: string, subheadline: string): {
  isValid: boolean;
  issues: string[];
  hierarchyScore: number;
} {
  const issues: string[] = [];
  let hierarchyScore = 100;

  // Check if both are vague (anti-pattern)
  const headlineVague = isTextVague(headline);
  const subheadlineVague = isTextVague(subheadline);

  if (headlineVague && subheadlineVague) {
    issues.push('Both headline and subheadline are vague - one must be specific');
    hierarchyScore -= 40;
  }

  // Check for proper hierarchy (headline should be hook, subheadline should be specific or vice versa)
  const headlineSpecific = isTextSpecific(headline);
  const subheadlineSpecific = isTextSpecific(subheadline);

  if (!headlineSpecific && !subheadlineSpecific) {
    issues.push('Neither headline nor subheadline provides specific value');
    hierarchyScore -= 30;
  }

  // Check for clichés in both
  const headlineCliches = containsCliche(headline);
  const subheadlineCliches = containsCliche(subheadline);

  if (headlineCliches.hasCliche) {
    issues.push(`Headline contains clichés: ${headlineCliches.cliches.join(', ')}`);
    hierarchyScore -= 25;
  }

  if (subheadlineCliches.hasCliche) {
    issues.push(`Subheadline contains clichés: ${subheadlineCliches.cliches.join(', ')}`);
    hierarchyScore -= 25;
  }

  return {
    isValid: issues.length === 0,
    issues,
    hierarchyScore: Math.max(0, hierarchyScore)
  };
}

/**
 * Check if text is vague/generic
 */
function isTextVague(text: string): boolean {
  const vaguePhrases = [
    'money moves', 'simple tech', 'for everyone', 'made simple', 'that works',
    'solutions', 'services', 'technology', 'innovation', 'excellence'
  ];

  const lowerText = text.toLowerCase();
  return vaguePhrases.some(phrase => lowerText.includes(phrase)) && text.split(' ').length <= 4;
}

/**
 * Check if text is specific/concrete
 */
function isTextSpecific(text: string): boolean {
  // Look for specific indicators: numbers, timeframes, concrete benefits
  const specificIndicators = [
    /\d+\s*(second|minute|hour|day|week|month|year)s?/i, // timeframes
    /\d+%/i, // percentages
    /zero|free|instant|immediate/i, // concrete benefits
    /\$\d+|\d+\s*fee/i, // pricing
    /24\/7|round.the.clock/i, // availability
    /guarantee|promise|ensure/i // commitments
  ];

  return specificIndicators.some(pattern => pattern.test(text));
}

/**
 * Extract headline formula pattern
 */
function extractHeadlineFormula(headline: string): string {
  // Common formula patterns (enhanced with user's patterns)
  const patterns = [
    /^Your .+, Your .+$/i,
    /^Finally, .+$/i,
    /^.+ on the Go$/i,
    /^.+ Made Simple$/i,
    /^.+ That Works$/i,
    /^.+ in Minutes$/i,
    /^.+ Without .+$/i,
    /^.+ for .+$/i,
    /^.+ Like Never Before$/i,
    /^The .+ Solution$/i,
    // User's proven patterns
    /^Tired of .+\?$/i,
    /^.+ in \d+ .+$/i,
    /^.+, Unlocked$/i,
    /^.+'s Due .+$/i,
    /^Accept .+ Instantly$/i,
    /^Pay .+ in .+$/i
  ];

  for (const pattern of patterns) {
    if (pattern.test(headline)) {
      return pattern.source;
    }
  }

  // Extract general structure
  const words = headline.split(' ');
  if (words.length >= 2) {
    return `${words[0]} ... ${words[words.length - 1]}`;
  }

  return 'unique';
}

/**
 * Check if headline formula is overused
 */
function isFormulaOverused(brandKey: string, formula: string, maxUsage: number = 2): boolean {
  const tracker = headlineFormulaTracker.get(brandKey) || { formulas: [], lastUsed: 0 };
  const formulaCount = tracker.formulas.filter(f => f === formula).length;
  return formulaCount >= maxUsage;
}

/**
 * Remember headline formula usage
 */
function rememberFormulaUsage(brandKey: string, formula: string): void {
  const tracker = headlineFormulaTracker.get(brandKey) || { formulas: [], lastUsed: Date.now() };
  tracker.formulas.push(formula);
  tracker.lastUsed = Date.now();

  // Keep only last 20 formulas to prevent memory bloat
  if (tracker.formulas.length > 20) {
    tracker.formulas = tracker.formulas.slice(-20);
  }

  headlineFormulaTracker.set(brandKey, tracker);
}

/**
 * Analyze emotional tone of text
 */
function analyzeEmotionalTone(text: string): 'urgent' | 'playful' | 'professional' | 'confident' | 'caring' | 'innovative' {
  const lowerText = text.toLowerCase();

  // Urgent indicators
  if (/\b(now|today|urgent|deadline|due|fast|quick|instant|immediately)\b/.test(lowerText)) {
    return 'urgent';
  }

  // Playful indicators
  if (/\b(fun|enjoy|love|amazing|awesome|cool|exciting|celebrate)\b/.test(lowerText)) {
    return 'playful';
  }

  // Caring indicators
  if (/\b(care|support|help|family|community|together|trust|safe)\b/.test(lowerText)) {
    return 'caring';
  }

  // Innovative indicators
  if (/\b(new|innovative|smart|advanced|future|technology|digital|modern)\b/.test(lowerText)) {
    return 'innovative';
  }

  // Confident indicators
  if (/\b(best|top|leading|expert|proven|guaranteed|success|achieve)\b/.test(lowerText)) {
    return 'confident';
  }

  return 'professional';
}

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

  console.log(`🔍 [Story Coherence] Headline theme: ${headlineTheme.primary} (${headlineTheme.secondary})`);
  console.log(`🔍 [Story Coherence] Caption theme: ${captionTheme.primary} (${captionTheme.secondary})`);

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

  // ADJUSTED: More lenient coherence requirements to reduce fallback usage
  // Allow content with minor issues if coherence score is decent
  const isCoherent = coherenceScore >= 45 && (issues.length === 0 || coherenceScore >= 60);

  console.log(`🔍 [COHERENCE DECISION] Score: ${coherenceScore}, Issues: ${issues.length}, IsCoherent: ${isCoherent}`);

  return {
    isCoherent,
    issues,
    coherenceScore: Math.max(0, coherenceScore),
    storyTheme: headlineTheme.primary,
    emotionalTone: headlineTone
  };
}

/**
 * Extract the primary story theme from text
 */
function extractStoryTheme(text: string, businessType: string): { primary: string; secondary?: string } {
  const lowerText = text.toLowerCase();
  const businessKey = String(businessType || 'general').toLowerCase();

  // Define story themes with their indicators
  const storyThemes = {
    'speed': ['fast', 'quick', 'instant', 'immediate', 'seconds', 'now', 'rapid'],
    'security': ['safe', 'secure', 'protected', 'trust', 'reliable', 'guaranteed'],
    'convenience': ['easy', 'simple', 'effortless', 'convenient', 'hassle-free', 'smooth'],
    'savings': ['save', 'cheap', 'affordable', 'discount', 'deal', 'budget', 'cost'],
    'quality': ['best', 'premium', 'excellent', 'top', 'superior', 'quality'],
    'support': ['help', 'support', 'care', 'service', 'assistance', 'guidance'],
    'innovation': ['new', 'modern', 'advanced', 'smart', 'innovative', 'technology'],
    'community': ['together', 'family', 'community', 'local', 'neighborhood'],
    'success': ['achieve', 'success', 'win', 'accomplish', 'reach', 'goal'],
    'transformation': ['change', 'transform', 'improve', 'better', 'upgrade', 'evolve'],
    'urgency': ['urgent', 'deadline', 'due', 'limited', 'hurry', 'act now'],
    'exclusivity': ['exclusive', 'special', 'unique', 'limited', 'select', 'premium']
  };

  // Find primary theme
  let primaryTheme = 'general';
  let maxMatches = 0;

  for (const [theme, indicators] of Object.entries(storyThemes)) {
    const matches = indicators.filter(indicator => lowerText.includes(indicator)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      primaryTheme = theme;
    }
  }

  // Find secondary theme (if any)
  let secondaryTheme: string | undefined;
  let secondMaxMatches = 0;

  for (const [theme, indicators] of Object.entries(storyThemes)) {
    if (theme === primaryTheme) continue;
    const matches = indicators.filter(indicator => lowerText.includes(indicator)).length;
    if (matches > secondMaxMatches && matches > 0) {
      secondMaxMatches = matches;
      secondaryTheme = theme;
    }
  }

  return { primary: primaryTheme, secondary: secondaryTheme };
}

/**
 * Check if secondary themes are compatible
 */
function areCompatibleSecondaryThemes(theme1: string, theme2: string): boolean {
  const compatiblePairs = [
    ['speed', 'convenience'],
    ['security', 'trust'],
    ['quality', 'premium'],
    ['innovation', 'technology'],
    ['savings', 'budget'],
    ['support', 'care'],
    ['success', 'achievement'],
    ['community', 'local']
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

  // Check if caption feels like the natural next sentence
  const headlineWords = headline.toLowerCase().split(/\s+/);
  const captionWords = caption.toLowerCase().split(/\s+/);

  // Look for connecting words/concepts
  const sharedConcepts = headlineWords.filter(word =>
    word.length > 3 && captionWords.some(capWord =>
      capWord.includes(word) || word.includes(capWord) ||
      areRelatedConcepts(word, capWord, businessType)
    )
  );

  if (sharedConcepts.length === 0 && caption.length > 30) {
    issues.push('Caption has no conceptual connection to headline - feels like separate message');
    penalty += 25;
  }

  // Check for abrupt topic changes
  const headlineContext = extractContext(headline);
  const captionContext = extractContext(caption);

  if (headlineContext && captionContext && headlineContext !== captionContext) {
    issues.push(`Context shift: headline is about '${headlineContext}' but caption shifts to '${captionContext}'`);
    penalty += 20;
  }

  return {
    isValid: issues.length === 0,
    issues,
    penalty
  };
}

/**
 * Extract context from text (what the text is primarily about)
 */
function extractContext(text: string): string | null {
  const lowerText = text.toLowerCase();

  const contexts = {
    'payment': ['pay', 'payment', 'money', 'transfer', 'send', 'receive'],
    'service': ['service', 'help', 'support', 'care', 'assistance'],
    'product': ['product', 'item', 'goods', 'merchandise', 'offer'],
    'experience': ['experience', 'feel', 'enjoy', 'satisfaction', 'journey'],
    'technology': ['app', 'digital', 'online', 'tech', 'platform', 'system'],
    'business': ['business', 'company', 'professional', 'work', 'office']
  };

  for (const [context, indicators] of Object.entries(contexts)) {
    if (indicators.some(indicator => lowerText.includes(indicator))) {
      return context;
    }
  }

  return null;
}

/**
 * Check if two words are related concepts for a business type
 */
function areRelatedConcepts(word1: string, word2: string, businessType: string): boolean {
  const conceptMaps: Record<string, string[][]> = {
    'finance': [
      ['money', 'cash', 'payment', 'pay', 'send', 'transfer'],
      ['fast', 'quick', 'instant', 'immediate', 'speed'],
      ['safe', 'secure', 'trust', 'reliable', 'protected'],
      ['mobile', 'phone', 'app', 'digital', 'online']
    ],
    'restaurant': [
      ['food', 'meal', 'dining', 'eat', 'taste', 'flavor'],
      ['fresh', 'quality', 'delicious', 'authentic', 'local'],
      ['service', 'experience', 'atmosphere', 'hospitality']
    ],
    'healthcare': [
      ['health', 'medical', 'care', 'treatment', 'wellness'],
      ['professional', 'expert', 'qualified', 'experienced'],
      ['patient', 'family', 'community', 'support']
    ]
  };

  const businessKey = String(businessType || 'general business').toLowerCase();
  const concepts = conceptMaps[businessKey] || [];

  return concepts.some(conceptGroup =>
    conceptGroup.includes(word1) && conceptGroup.includes(word2)
  );
}

/**
 * Extract target audience from text
 */
function extractTargetAudience(text: string): string | null {
  const lowerText = text.toLowerCase();

  const audiences = {
    'students': ['student', 'college', 'university', 'school', 'study'],
    'parents': ['parent', 'family', 'children', 'kids', 'mom', 'dad'],
    'professionals': ['professional', 'business', 'work', 'office', 'career'],
    'entrepreneurs': ['entrepreneur', 'startup', 'business owner', 'founder'],
    'seniors': ['senior', 'elderly', 'retirement', 'mature', 'older'],
    'youth': ['young', 'teen', 'youth', 'millennial', 'gen z']
  };

  for (const [audience, indicators] of Object.entries(audiences)) {
    if (indicators.some(indicator => lowerText.includes(indicator))) {
      return audience;
    }
  }

  return null;
}

/**
 * Extract promised benefit from headline
 */
function extractPromisedBenefit(headline: string): string | null {
  const lowerHeadline = headline.toLowerCase();

  const benefits = {
    'speed': ['fast', 'quick', 'instant', 'immediate', 'seconds'],
    'savings': ['save', 'cheap', 'affordable', 'discount', 'free'],
    'security': ['safe', 'secure', 'protected', 'guaranteed'],
    'convenience': ['easy', 'simple', 'effortless', 'convenient'],
    'quality': ['best', 'premium', 'excellent', 'top', 'superior'],
    'success': ['success', 'achieve', 'win', 'accomplish', 'reach']
  };

  for (const [benefit, indicators] of Object.entries(benefits)) {
    if (indicators.some(indicator => lowerHeadline.includes(indicator))) {
      return benefit;
    }
  }

  return null;
}

/**
 * Extract delivered benefit from caption
 */
function extractDeliveredBenefit(caption: string): string | null {
  const lowerCaption = caption.toLowerCase();

  const benefits = {
    'speed': ['fast', 'quick', 'instant', 'immediate', 'seconds', 'rapid', 'swift'],
    'savings': ['save', 'cheap', 'affordable', 'discount', 'free', 'budget', 'cost-effective'],
    'security': ['safe', 'secure', 'protected', 'guaranteed', 'trust', 'reliable'],
    'convenience': ['easy', 'simple', 'effortless', 'convenient', 'hassle-free', 'smooth'],
    'quality': ['best', 'premium', 'excellent', 'top', 'superior', 'quality', 'high-grade'],
    'success': ['success', 'achieve', 'win', 'accomplish', 'reach', 'attain', 'realize']
  };

  for (const [benefit, indicators] of Object.entries(benefits)) {
    if (indicators.some(indicator => lowerCaption.includes(indicator))) {
      return benefit;
    }
  }

  return null;
}

/**
 * Check if promised and delivered benefits are aligned
 */
function areBenefitsAligned(promisedBenefit: string, deliveredBenefit: string): boolean {
  // Direct match
  if (promisedBenefit === deliveredBenefit) {
    return true;
  }

  // Compatible benefit pairs
  const compatibleBenefits = [
    ['speed', 'convenience'],
    ['security', 'trust'],
    ['quality', 'premium'],
    ['savings', 'budget'],
    ['success', 'achievement']
  ];

  return compatibleBenefits.some(pair =>
    (pair.includes(promisedBenefit) && pair.includes(deliveredBenefit))
  );
}

/**
 * Validate story completion - ensure caption completes the story started by headline
 */
function validateStoryCompletion(headline: string, caption: string): {
  isComplete: boolean;
  issues: string[];
  penalty: number;
} {
  const issues: string[] = [];
  let penalty = 0;

  // Check if caption provides the "how" or "why" for headline's "what"
  const headlineIsPromise = /\b(get|achieve|save|win|earn|gain|receive)\b/i.test(headline);
  const captionExplainsHow = /\b(by|through|with|using|via|because|since|when|while)\b/i.test(caption);

  if (headlineIsPromise && !captionExplainsHow && caption.length > 40) {
    issues.push('Headline makes promise but caption doesn\'t explain how to achieve it');
    penalty += 20;
  }

  // Check if caption answers the natural question raised by headline
  const headlineRaisesQuestion = /\b(why|how|what|when|where)\b/i.test(headline) ||
    headline.includes('?') ||
    /\b(tired of|frustrated|struggling|need|want)\b/i.test(headline);

  const captionAnswersQuestion = caption.length > 20 &&
    /\b(because|since|with|through|by|our|we|this|that)\b/i.test(caption);

  if (headlineRaisesQuestion && !captionAnswersQuestion) {
    issues.push('Headline raises question/problem but caption doesn\'t provide answer/solution');
    penalty += 25;
  }

  return {
    isComplete: issues.length === 0,
    issues,
    penalty
  };
}

/**
 * Enhanced content specificity validation
 */
function validateContentSpecificity(headline: string, caption: string, businessType: string): {
  isGeneric: boolean;
  issues: string[];
  penalty: number;
} {
  const issues: string[] = [];
  let penalty = 0;

  // Enhanced generic phrase detection
  const genericPhrases = [
    'professional services that',
    'solutions that actually work',
    'serving the community with',
    'quality service you can trust',
    'experience the excellence of',
    'committed to providing',
    'dedicated to serving',
    'your trusted partner',
    'we are here for you',
    'contact us today',
    'call us now',
    'visit our website',
    'learn more about',
    'discover the difference',
    'experience the best',
    'join thousands of',
    'don\'t wait, act now'
  ];

  const captionLower = caption.toLowerCase();
  const genericPhrasesFound = genericPhrases.filter(phrase =>
    captionLower.includes(phrase.toLowerCase())
  );

  if (genericPhrasesFound.length > 0) {
    issues.push(`Caption contains generic corporate jargon: ${genericPhrasesFound.join(', ')}`);
    penalty += 20 * genericPhrasesFound.length;
  }

  // Check if content could work for any competitor
  const businessKey = String(businessType || 'general').toLowerCase();
  const headlineWords = headline.toLowerCase().split(/\s+/);
  const captionWords = caption.toLowerCase().split(/\s+/);

  const hasBusinessSpecificContent =
    captionLower.includes(businessKey) ||
    captionWords.some(word => headlineWords.includes(word)) ||
    hasBusinessSpecificTerms(caption, businessType);

  if (!hasBusinessSpecificContent && caption.length > 30) {
    issues.push('Caption is too generic - could work for any competitor in any industry');
    penalty += 25;
  }

  // Check for vague benefit claims without specifics
  const vagueBenefits = [
    'better experience',
    'improved service',
    'enhanced quality',
    'superior results',
    'excellent value',
    'outstanding performance'
  ];

  const vagueBenefitsFound = vagueBenefits.filter(benefit =>
    captionLower.includes(benefit.toLowerCase())
  );

  if (vagueBenefitsFound.length > 0) {
    issues.push(`Caption uses vague benefit claims: ${vagueBenefitsFound.join(', ')}`);
    penalty += 15 * vagueBenefitsFound.length;
  }

  return {
    isGeneric: issues.length > 0,
    issues,
    penalty
  };
}

/**
 * Check if content has business-specific terms
 */
function hasBusinessSpecificTerms(text: string, businessType: string): boolean {
  const lowerText = text.toLowerCase();
  const businessKey = String(businessType || 'general').toLowerCase();

  const businessTerms: Record<string, string[]> = {
    'finance': ['payment', 'transfer', 'account', 'balance', 'transaction', 'banking'],
    'fintech': ['app', 'digital', 'mobile', 'wallet', 'crypto', 'blockchain'],
    'restaurant': ['menu', 'food', 'dining', 'kitchen', 'chef', 'recipe', 'ingredients'],
    'healthcare': ['patient', 'treatment', 'diagnosis', 'medical', 'clinic', 'doctor'],
    'retail': ['product', 'inventory', 'shopping', 'store', 'merchandise', 'customer'],
    'technology': ['software', 'platform', 'system', 'data', 'cloud', 'integration'],
    'education': ['student', 'learning', 'course', 'curriculum', 'teacher', 'classroom'],
    'fitness': ['workout', 'exercise', 'training', 'gym', 'health', 'nutrition']
  };

  const terms = businessTerms[businessKey] || [];
  return terms.some(term => lowerText.includes(term));
}

/**
 * Generate contextual CTA based on story and business type
 */
function generateContextualCTA(
  headline: string,
  caption: string,
  businessType: string,
  moneyFlowDirection: 'incoming' | 'outgoing' | 'neutral'
): string {
  const tone = analyzeEmotionalTone(headline);
  const lowerBusinessType = String(businessType || 'general business').toLowerCase();

  // Context-aware CTAs based on story and business type
  if (lowerBusinessType.includes('finance') || lowerBusinessType.includes('banking')) {
    if (moneyFlowDirection === 'outgoing') {
      return tone === 'urgent' ? 'Send Now' : 'Start Transfer';
    } else if (moneyFlowDirection === 'incoming') {
      return tone === 'urgent' ? 'Get Paid Now' : 'Open Account';
    } else {
      return tone === 'urgent' ? 'Download App' : 'Get Started';
    }
  }

  if (lowerBusinessType.includes('restaurant') || lowerBusinessType.includes('food')) {
    return tone === 'urgent' ? 'Order Now' : tone === 'playful' ? 'Taste Today' : 'Book Table';
  }

  if (lowerBusinessType.includes('healthcare') || lowerBusinessType.includes('medical')) {
    return tone === 'urgent' ? 'Book Now' : tone === 'caring' ? 'Schedule Care' : 'Get Consultation';
  }

  if (lowerBusinessType.includes('retail') || lowerBusinessType.includes('shop')) {
    return tone === 'urgent' ? 'Shop Now' : tone === 'playful' ? 'Discover More' : 'Browse Collection';
  }

  // Default contextual CTAs
  const urgentCTAs = ['Act Now', 'Get Started', 'Try Today'];
  const playfulCTAs = ['Explore More', 'Join Us', 'Discover'];
  const professionalCTAs = ['Learn More', 'Contact Us', 'Get Info'];

  switch (tone) {
    case 'urgent': return urgentCTAs[Math.floor(Math.random() * urgentCTAs.length)];
    case 'playful': return playfulCTAs[Math.floor(Math.random() * playfulCTAs.length)];
    default: return professionalCTAs[Math.floor(Math.random() * professionalCTAs.length)];
  }
}

/**
 * Generate content using Gemini (following Revo 2.0 advanced content generation pattern)
 */
async function generateRevo10ContentWithGemini(options: any, concept: any): Promise<any> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  // Get brand key for anti-repetition system
  const brandKey = getBrandKey(options.brandProfile, options.platform);
  const recentData = recentOutputs.get(brandKey) || { headlines: [], captions: [], concepts: [] };

  // ============================================================================
  // UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK - ANGLE ASSIGNMENT
  // ============================================================================

  // Assign strategic marketing angle for campaign diversity
  const assignedAngle = assignMarketingAngle(brandKey, options);
  console.log(`🎯 [Revo 1.0] Marketing Angle: ${assignedAngle.name}`);
  console.log(`📋 [Revo 1.0] Angle Focus: ${assignedAngle.focusArea}`);
  console.log(`💡 [Revo 1.0] Angle Instructions: ${assignedAngle.promptInstructions}`);

  console.log('🚀 [Revo 1.0] Starting advanced content generation with Gemini');
  console.log('🔍 [Revo 1.0] Options:', {
    businessType: options.businessType,
    businessName: options.brandProfile?.businessName,
    platform: options.platform,
    useLocalLanguage: options.useLocalLanguage,
    assignedAngle: assignedAngle.name
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 [Revo 1.0] Content Generation Attempt ${attempt}/${maxRetries} - Using Gemini 2.5 Flash`);

      // Build advanced prompt using Revo 2.0 system with assigned marketing angle
      const prompt = buildRevo10ContentPrompt(options, concept, assignedAngle);
      console.log('📝 [Revo 1.0] Generated advanced prompt length:', prompt.length);

      // Add randomization to temperature for more variety
      const temperature = 0.8 + (Math.random() * 0.3); // 0.8-1.1 range
      console.log(`🎲 [Revo 1.0] Using temperature: ${temperature.toFixed(2)} for content variety`);

      // Call Gemini for content generation with enhanced options
      const response = await callGeminiForContent(prompt, { ...options, temperature });
      console.log('📥 [Revo 1.0] Received response from Gemini:', JSON.stringify(response, null, 2));
      console.log('📥 [Revo 1.0] Response type:', typeof response);
      console.log('📥 [Revo 1.0] Response keys:', response ? Object.keys(response) : 'null');

      // Validate and enhance the response
      if (response && (response.headline || response.caption)) {
        console.log('✅ [Revo 1.0] Response structure validation PASSED');
        // Parse and validate content structure
        const parsed = {
          headline: response.headline || '',
          subheadline: response.subheadline || '',
          caption: response.caption || '',
          cta: response.cta || response.callToAction || '',
          hashtags: Array.isArray(response.hashtags) ? response.hashtags : []
        };

        // ============================================================================
        // NEW COHERENT STORY-BASED VALIDATION SYSTEM
        // ============================================================================

        console.log('🎯 [Revo 1.0] Starting coherent story-based validation');

        // Basic content validation
        const headlineValid = parsed.headline && parsed.headline.trim().length > 0 && parsed.headline.split(' ').length <= 8;
        const subheadlineValid = parsed.subheadline && parsed.subheadline.trim().length > 0 && parsed.subheadline.split(' ').length <= 30;
        const captionValid = parsed.caption && parsed.caption.trim().length >= 10;
        const ctaValid = parsed.cta && parsed.cta.trim().length > 0;
        const hashtagsValid = Array.isArray(parsed.hashtags) && parsed.hashtags.length >= 1;

        // ============================================================================
        // ENHANCED HEADLINES & SUBHEADLINES VALIDATION SYSTEM
        // ============================================================================

        // 1. Check for duplicate headlines across campaigns
        const headlineDuplicate = isHeadlineDuplicate(brandKey, parsed.headline);
        if (headlineDuplicate) {
          console.log(`🚫 [Revo 1.0] Duplicate headline detected: "${parsed.headline}"`);
        }

        // 2. Check if headline uses brand name (should be avoided)
        const headlineIsBrandName = isHeadlineBrandName(parsed.headline, options.brandProfile?.businessName || '');
        if (headlineIsBrandName) {
          console.log(`🚫 [Revo 1.0] Headline uses brand name: "${parsed.headline}"`);
        }

        // 3. Validate message hierarchy between headline and subheadline
        const hierarchyValidation = validateMessageHierarchy(parsed.headline, parsed.subheadline);
        console.log('📊 [Revo 1.0] Message hierarchy validation:', hierarchyValidation);

        // 4. Check headline formula repetition
        const headlineFormula = extractHeadlineFormula(parsed.headline);
        const formulaOverused = isFormulaOverused(brandKey, headlineFormula);

        if (formulaOverused) {
          console.log(`🚫 [Revo 1.0] Headline formula overused: ${headlineFormula}`);
        }

        // 5. Validate story coherence between headline and caption
        const coherenceValidation = validateStoryCoherence(
          parsed.headline,
          parsed.caption,
          options.businessType
        );

        console.log('🔗 [Revo 1.0] Story coherence validation:', coherenceValidation);

        // Enhanced coherence validation logging for debugging
        if (coherenceValidation.issues.length > 0) {
          console.log(`🚨 [COHERENCE ISSUES] Found ${coherenceValidation.issues.length} coherence issues:`);
          coherenceValidation.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
          });
        } else {
          console.log(`✅ [COHERENCE SUCCESS] No coherence issues found`);
        }

        // 6. Validate marketing angle adherence
        const angleValidation = validateAngleAdherence(parsed, assignedAngle, options);
        console.log('🎯 [Revo 1.0] Marketing angle validation:', angleValidation);

        // Check for banned patterns and repetition
        const headlineHasBannedPatterns = hasBannedPattern(parsed.headline);
        const captionHasBannedPatterns = hasBannedPattern(parsed.caption);
        const headlineTooSimilar = tooSimilar(parsed.headline, recentData.headlines, 0.55);
        const captionTooSimilar = tooSimilar(parsed.caption, recentData.captions, 0.40);

        // Enhanced specificity checks
        const headlineIsGeneric = /^[a-z]+ your [a-z]+$/i.test(parsed.headline.trim()) ||
          parsed.headline.includes('Experience the excellence') ||
          parsed.headline.includes('Transform your');

        // Check if caption could work for competitors (specificity test)
        const captionTooGeneric = coherenceValidation.issues.includes('Caption is too generic - could work for any competitor');

        console.log('🔍 [Revo 1.0] Enhanced validation results:', {
          headlineValid,
          subheadlineValid,
          captionValid,
          ctaValid,
          hashtagsValid,
          headlineHasBannedPatterns,
          captionHasBannedPatterns,
          headlineTooSimilar,
          captionTooSimilar,
          headlineIsGeneric,
          captionTooGeneric,
          formulaOverused,
          coherenceScore: coherenceValidation.coherenceScore,
          coherenceIssues: coherenceValidation.issues,
          storyTheme: coherenceValidation.storyTheme,
          emotionalTone: coherenceValidation.emotionalTone,
          // New headline/subheadline validation results
          headlineDuplicate,
          headlineIsBrandName,
          hierarchyScore: hierarchyValidation.hierarchyScore,
          hierarchyIssues: hierarchyValidation.issues,
          // Multi-angle marketing framework validation results
          assignedAngle: assignedAngle.name,
          angleAdherenceScore: angleValidation.adherenceScore,
          angleIssues: angleValidation.issues
        });

        // Determine money flow direction for contextual CTA
        const moneyFlowDirection: 'incoming' | 'outgoing' | 'neutral' =
          parsed.headline.toLowerCase().includes('send') || parsed.caption.toLowerCase().includes('send') ? 'outgoing' :
            parsed.headline.toLowerCase().includes('receive') || parsed.caption.toLowerCase().includes('receive') ||
              parsed.headline.toLowerCase().includes('paid') || parsed.caption.toLowerCase().includes('paid') ? 'incoming' : 'neutral';

        // Generate contextual CTA if current one is generic
        const genericCTAs = ['learn more', 'get started', 'contact us', 'find out more'];
        const isGenericCTA = genericCTAs.some(generic => parsed.cta.toLowerCase().includes(generic));

        if (isGenericCTA || !ctaValid) {
          const contextualCTA = generateContextualCTA(
            parsed.headline,
            parsed.caption,
            options.businessType,
            moneyFlowDirection
          );
          parsed.cta = contextualCTA;
          console.log(`🎯 [Revo 1.0] Generated contextual CTA: ${contextualCTA}`);
        }

        // ============================================================================
        // ENHANCED VALIDATION LOGGING FOR DEBUGGING FALLBACK CAPTION ISSUE
        // ============================================================================

        console.log(`🔍 [VALIDATION DEBUG] Detailed validation breakdown:`);
        console.log(`   📰 headlineValid: ${headlineValid}`);
        console.log(`   📝 subheadlineValid: ${subheadlineValid}`);
        console.log(`   📄 captionValid: ${captionValid}`);
        console.log(`   🏷️ hashtagsValid: ${hashtagsValid}`);
        console.log(`   🚫 headlineHasBannedPatterns: ${headlineHasBannedPatterns}`);
        console.log(`   🚫 captionHasBannedPatterns: ${captionHasBannedPatterns}`);
        console.log(`   🔄 headlineTooSimilar: ${headlineTooSimilar}`);
        console.log(`   🔄 captionTooSimilar: ${captionTooSimilar}`);
        console.log(`   📊 coherenceScore: ${coherenceValidation.coherenceScore} (min: 45)`);
        console.log(`   📊 hierarchyScore: ${hierarchyValidation.hierarchyScore} (min: 70)`);
        console.log(`   📊 angleScore: ${angleValidation.adherenceScore} (min: 70)`);
        console.log(`   🚫 headlineDuplicate: ${headlineDuplicate}`);
        console.log(`   🚫 headlineIsBrandName: ${headlineIsBrandName}`);
        console.log(`   🚫 formulaOverused: ${formulaOverused}`);

        // ============================================================================
        // SMART FALLBACK PREVENTION SYSTEM
        // ============================================================================

        // Basic validation (must pass)
        const basicValidation = headlineValid && subheadlineValid && captionValid && hashtagsValid &&
          !headlineHasBannedPatterns && !captionHasBannedPatterns &&
          !headlineDuplicate && !headlineIsBrandName;

        // Quality validation (more lenient)
        const qualityValidation = !headlineTooSimilar && !captionTooSimilar &&
          !headlineIsGeneric && !captionTooGeneric && !formulaOverused;

        // Advanced validation (most lenient)
        const advancedValidation = coherenceValidation.coherenceScore >= 35 && // Further lowered
          hierarchyValidation.hierarchyScore >= 60 && // Lowered from 70
          angleValidation.adherenceScore >= 60; // Lowered from 70

        // Smart validation logic: prefer AI content over fallback
        let passesValidation = false;
        let validationLevel = 'FAILED';

        if (basicValidation && qualityValidation && advancedValidation) {
          passesValidation = true;
          validationLevel = 'EXCELLENT';
        } else if (basicValidation && qualityValidation) {
          passesValidation = true;
          validationLevel = 'GOOD';
          console.log(`⚠️ [SMART VALIDATION] Accepting content with minor advanced validation issues to avoid fallback`);
        } else if (basicValidation && advancedValidation) {
          passesValidation = true;
          validationLevel = 'ACCEPTABLE';
          console.log(`⚠️ [SMART VALIDATION] Accepting content with minor quality issues to avoid fallback`);
        } else if (basicValidation) {
          // Last chance: if basic validation passes, check if it's better than fallback
          const hasReasonableCoherence = coherenceValidation.coherenceScore >= 25;
          if (hasReasonableCoherence) {
            passesValidation = true;
            validationLevel = 'MINIMAL';
            console.log(`⚠️ [SMART VALIDATION] Accepting minimal quality content to avoid template fallback`);
          }
        }

        console.log(`🎯 [VALIDATION RESULT] Level: ${validationLevel}, Passes: ${passesValidation}`);

        if (passesValidation) {

          console.log('✅ [Revo 1.0] Content passed validation, applying quality enhancement');

          // Apply spell checking and content quality enhancement
          let finalResult = parsed;

          // TODO: Re-enable ContentQualityEnhancer after debugging
          console.log('🔤 [Revo 1.0] Skipping spell checking for debugging - using original content');
          finalResult = parsed;

          /* TEMPORARILY DISABLED FOR DEBUGGING
          try {
            const spellCheckedContent = await ContentQualityEnhancer.enhanceGeneratedContent({
              headline: parsed.headline,
              subheadline: parsed.subheadline,
              caption: parsed.caption,
              callToAction: parsed.cta
            }, options.businessType, {
              autoCorrect: true,
              logCorrections: true,
              validateQuality: true
            });
 
            // Update content with spell-checked versions
            finalResult = {
              caption: spellCheckedContent.caption || parsed.caption,
              headline: spellCheckedContent.headline || parsed.headline,
              subheadline: spellCheckedContent.subheadline || parsed.subheadline,
              cta: spellCheckedContent.callToAction || parsed.cta,
              hashtags: parsed.hashtags
            };
 
            console.log('🔤 [Revo 1.0] Applied spell checking and quality enhancement');
          } catch (spellError) {
            console.warn('⚠️ [Revo 1.0] Spell check failed, using original content:', spellError);
            finalResult = parsed;
          }
          */

          // Remember this content to avoid repetition
          rememberOutput(brandKey, {
            headline: finalResult.headline,
            caption: finalResult.caption
          });

          // Remember headline formula usage to prevent overuse
          rememberFormulaUsage(brandKey, headlineFormula);

          // Remember headline usage to prevent duplicates
          rememberHeadlineUsage(brandKey, finalResult.headline);

          console.log('✅ [Revo 1.0] Final enhanced result with coherent story:', finalResult);
          console.log('📊 [Revo 1.0] Enhanced story coherence validation:');
          console.log(`   📈 Coherence Score: ${coherenceValidation.coherenceScore}/100`);
          console.log(`   🎭 Story Theme: ${coherenceValidation.storyTheme}`);
          console.log(`   💭 Emotional Tone: ${coherenceValidation.emotionalTone}`);
          console.log(`   ✅ Story Coherent: ${coherenceValidation.isCoherent}`);
          console.log(`🎉 [AI CONTENT SUCCESS] Using AI-generated content (not fallback):`);
          console.log(`   📰 AI Headline: "${finalResult.headline}"`);
          console.log(`   📝 AI Caption: "${finalResult.caption}"`);
          console.log(`   🎯 AI CTA: "${finalResult.cta}"`);
          return finalResult;
        } else {
          // Enhanced validation failure logging with new coherence checks
          const reasons = [];
          if (!headlineValid) reasons.push('invalid headline');
          if (!subheadlineValid) reasons.push('invalid subheadline');
          if (!captionValid) reasons.push('invalid caption');
          if (!hashtagsValid) reasons.push('invalid hashtags');
          if (headlineHasBannedPatterns) reasons.push('headline has banned patterns');
          if (captionHasBannedPatterns) reasons.push('caption has banned patterns');
          if (headlineTooSimilar) reasons.push('headline too similar');
          if (captionTooSimilar) reasons.push('caption too similar');
          if (headlineIsGeneric) reasons.push('headline is generic');
          if (captionTooGeneric) reasons.push('caption too generic');
          if (formulaOverused) reasons.push(`headline formula overused: ${headlineFormula}`);
          if (coherenceValidation.coherenceScore < 25) reasons.push(`very low coherence score: ${coherenceValidation.coherenceScore}`);
          if (coherenceValidation.issues.length > 0) reasons.push(`coherence issues: ${coherenceValidation.issues.join(', ')}`);
          // New headline/subheadline validation failures
          if (headlineDuplicate) reasons.push('duplicate headline');
          if (headlineIsBrandName) reasons.push('headline uses brand name');
          if (hierarchyValidation.hierarchyScore < 70) reasons.push(`poor message hierarchy: ${hierarchyValidation.hierarchyScore}`);
          if (hierarchyValidation.issues.length > 0) reasons.push(`hierarchy issues: ${hierarchyValidation.issues.join(', ')}`);

          console.warn(`⚠️ [Revo 1.0] Content validation failed on attempt ${attempt} - Reasons: ${reasons.join(', ')}`);
          console.warn(`🔍 [Revo 1.0] Headline: "${parsed.headline}"`);
          console.warn(`🔍 [Revo 1.0] Caption: "${parsed.caption}"`);

          if (captionDisconnected) {
            console.warn(`🚫 [Revo 1.0] COHERENCE ISSUE: Caption doesn't share keywords with headline`);
            console.warn(`📝 [Revo 1.0] Headline words: ${headlineWords.filter(w => w.length > 3).join(', ')}`);
            console.warn(`📝 [Revo 1.0] Caption words: ${captionWords.filter(w => w.length > 3).slice(0, 10).join(', ')}`);
          }

          lastError = new Error(`Content validation failed: ${reasons.join(', ')}`);
          continue;
        }
      } else {
        console.warn(`⚠️ [Revo 1.0] Invalid response structure on attempt ${attempt}, retrying...`);
        console.warn(`🔍 [Revo 1.0] Response was:`, response);
        console.warn(`🔍 [Revo 1.0] Expected: response.headline or response.caption to exist`);
        console.warn(`🔍 [Revo 1.0] Got headline:`, response?.headline);
        console.warn(`🔍 [Revo 1.0] Got caption:`, response?.caption);
        lastError = new Error('Invalid response structure');
        continue;
      }
    } catch (error) {
      console.error(`❌ [Revo 1.0] Content generation attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  // All retries failed, generate unique fallback content
  console.warn(`❌ [Revo 1.0] All ${maxRetries} attempts failed. Generating unique fallback content.`);
  console.warn(`Last error: ${lastError?.message || 'Unknown error'}`);
  console.warn(`🚨 [Revo 1.0] CRITICAL: AI content generation is failing - using templates instead of real AI content!`);
  console.warn(`🔧 [Revo 1.0] This means validation is too strict or AI responses are malformed`);
  console.warn(`🚨 [FALLBACK CAPTION ISSUE] Using template captions instead of AI-generated captions!`);
  console.warn(`🔧 [FALLBACK CAPTION ISSUE] This will cause caption-headline story mismatch!`);

  const fallbackContent = generateUniqueFallbackContent(options.brandProfile, options.businessType, options.platform, 3, Date.now() % 10, concept);

  // Mark this as fallback content for debugging
  console.warn(`🚨 [FALLBACK CONTENT] Generated fallback content:`);
  console.warn(`   📰 Headline: "${fallbackContent.headline}"`);
  console.warn(`   📝 Caption: "${fallbackContent.caption}"`);
  console.warn(`   🎯 CTA: "${fallbackContent.cta}"`);

  return fallbackContent;
}
/**
 * Build advanced content prompt for Revo 1.0 (using Revo 2.0 sophisticated system + multi-angle framework)
 */
function buildRevo10ContentPrompt(options: any, concept: any, assignedAngle?: MarketingAngle): string {
  const { businessType, brandProfile, platform, scheduledServices } = options;

  // Normalize platform and determine hashtag count
  const normalizedPlatform = String(platform).toLowerCase();
  const hashtagCount = normalizedPlatform === 'instagram' ? 5 : 3;

  // Extract business intelligence data
  const keyFeaturesList = normalizeStringList((brandProfile as any).keyFeatures ?? brandProfile.keyFeatures);
  const competitiveAdvantagesList = normalizeStringList((brandProfile as any).competitiveAdvantages ?? brandProfile.competitiveAdvantages);
  const servicesList = normalizeServiceList((brandProfile as any).services ?? brandProfile.services);
  const positioning = (brandProfile as any).competitivePositioning;

  // Build service-specific content context
  let serviceContentContext = '';
  if (concept.featuredServices && concept.featuredServices.length > 0) {
    const todayService = concept.featuredServices[0];
    serviceContentContext = `\n\n🎯 TODAY'S FEATURED SERVICE (Primary Focus):\n- Service: ${todayService.serviceName}\n- Description: ${todayService.description || 'Premium service offering'}\n- Content Focus: Write about THIS specific service as today's highlight\n- Call-to-Action: Encourage engagement with this service`;

    if (concept.upcomingServices && concept.upcomingServices.length > 0) {
      serviceContentContext += `\n\n📅 UPCOMING SERVICES (Mention briefly):\n${concept.upcomingServices.map((s: any) => `- ${s.serviceName}`).join('\n')}`;
    }
  }

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

  return `Create engaging social media content for ${brandProfile.businessName} (${businessType}) on ${platform}.

🎯 BUSINESS CONTEXT:
- Business: ${brandProfile.businessName}
- Industry: ${businessType}
- Location: ${brandProfile.location || 'Global'}
- Platform: ${platform}
- Content Approach: ${selectedApproach} (use this strategic angle)${localLanguageInstructions}

${assignedAngle ? `
🎯 UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK - ASSIGNED ANGLE:

📋 MARKETING ANGLE: ${assignedAngle.name}
📝 DESCRIPTION: ${assignedAngle.description}
🎯 FOCUS AREA: ${assignedAngle.focusArea}

🚨 CRITICAL ANGLE INSTRUCTIONS (MANDATORY):
${assignedAngle.promptInstructions}

📰 HEADLINE GUIDANCE:
${assignedAngle.headlineGuidance}

📝 CAPTION GUIDANCE:
${assignedAngle.captionGuidance}

📸 VISUAL GUIDANCE:
${assignedAngle.visualGuidance}

✅ ANGLE EXAMPLE (FOR REFERENCE ONLY - DO NOT COPY):
- Headline: "${assignedAngle.examples.headline}"
- Subheadline: "${assignedAngle.examples.subheadline}"
- Caption: "${assignedAngle.examples.caption}"

🚫 ANTI-PATTERNS TO AVOID:
- DO NOT mix multiple angles in one ad
- DO NOT list all features if angle is "Feature" (focus on ONE)
- DO NOT use generic language if angle requires specificity
- DO NOT ignore the assigned angle focus area
- DO NOT create content that could work for any competitor

⚠️ ANGLE ADHERENCE REQUIREMENT:
Your content MUST clearly reflect the assigned ${assignedAngle.name} angle. This is not optional.
` : ''}

💼 BUSINESS INTELLIGENCE:
${keyFeaturesList.length > 0 ? `- Key Features: ${keyFeaturesList.slice(0, 5).join(', ')}` : ''}
${competitiveAdvantagesList.length > 0 ? `- Competitive Advantages: ${competitiveAdvantagesList.slice(0, 3).join(', ')}` : ''}
${generateEnhancedServicesDisplay(brandProfile.services)}
${generateEnhancedTargetAudienceDisplay(brandProfile, businessType)}
${typeof positioning === 'string' && positioning.trim().length > 0 ? `- Positioning: ${positioning}` : ''}
${brandProfile.description ? `- Business Description: ${brandProfile.description.substring(0, 200)}` : ''}

🏆 COMPETITIVE ANALYSIS:
${getCompetitorAnalysis(brandProfile)}
The generated image shows: ${concept.concept}${serviceContentContext}

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

📝 ENHANCED HEADLINES & SUBHEADLINES REQUIREMENTS (CRITICAL):

🚫 HEADLINE RESTRICTIONS (NEVER DO):
- NEVER use the same headline twice in a campaign (each ad needs unique headline)
- NEVER start headline with company/brand name (e.g., "Paya Finance:", "Zentech:")
- NEVER use vague phrases: "Money Moves", "Simple tech for everyone", "Your way"
- NEVER use generic corporate jargon: "Solutions that work", "Excellence in service"

✅ PROVEN HEADLINE PATTERNS (USE THESE):
1. Problem → Solution: "Tired of 3-Day Transfer Waits?"
2. Benefit → Timeframe: "Pay Rent in Seconds"
3. Big Promise → Proof: "Financial Freedom, Unlocked"
4. Urgent → Relief: "Rent's Due Tomorrow"
5. Direct Benefit: "Accept Payments Instantly"

📊 MESSAGE HIERARCHY RULES (MANDATORY):
- ONE element must be SPECIFIC (numbers, timeframes, concrete benefits)
- ONE element can be broader (but still meaningful)
- NEVER stack vague on vague (e.g., "Money Moves" + "Simple tech for everyone")

🔗 ENHANCED STORY COHERENCE REQUIREMENTS (CRITICAL - FIXES CAPTION-HEADLINE MISMATCH):

🚨 STORY UNITY PRINCIPLE:
Headline + Caption must tell ONE unified story, not two separate messages.
The caption should feel like the natural next sentence after reading the headline.

✅ STORY COHERENCE CHECKLIST (MANDATORY):
1. **Theme Consistency**: If headline focuses on SPEED, caption must also focus on SPEED (not security/quality/etc.)
2. **Tone Matching**: If headline is URGENT, caption must be URGENT (not calm/professional)
3. **Audience Alignment**: If headline targets STUDENTS, caption must speak to STUDENTS (not business owners)
4. **Benefit Delivery**: If headline promises INSTANT PAYMENTS, caption must explain HOW to get instant payments
5. **Narrative Flow**: Caption must answer the question or complete the thought started by headline

🚫 STORY MISMATCH PATTERNS TO AVOID:
- Headline: "Pay in 3 Seconds" → Caption talks about security features ❌
- Headline: "Student Budget Tight?" → Caption speaks to business owners ❌
- Headline: "Tired of Bank Queues?" → Caption discusses app features (not queue solution) ❌
- Headline: Urgent tone → Caption: Professional/calm tone ❌

✅ CORRECT STORY COHERENCE EXAMPLES:
- Headline: "Pay in 3 Seconds" → Caption: "No more waiting. Our instant transfer system processes your payment in just 3 seconds..." ✅
- Headline: "Student Budget Tight?" → Caption: "We understand student life. Split payments, track expenses, and save money with features designed for students..." ✅
- Headline: "Tired of Bank Queues?" → Caption: "Skip the lines forever. Send money, pay bills, and check balances from your phone..." ✅

🎯 STORY COMPLETION REQUIREMENTS:
- If headline asks a question → Caption must answer it
- If headline makes a promise → Caption must explain how to achieve it
- If headline identifies a problem → Caption must provide the solution
- If headline uses urgent tone → Caption must maintain urgency and provide immediate action
- ENSURE proper relationship: Headline hooks → Subheadline explains/proves

📝 CONTENT REQUIREMENTS - MUST WORK TOGETHER AS ONE STORY:
1. HEADLINE (max 6 words): Lead with SPECIFIC BENEFIT, not brand name. Use proven patterns above.
2. SUBHEADLINE (max 25 words): DIRECTLY supports headline with specific proof/how/guarantee.

✏️ GRAMMAR & LANGUAGE RULES (CRITICAL):
- CORRECT: "Payments that fit your day" (plural subject = plural verb)
- WRONG: "Payments that fits your day" (grammar error)
- CORRECT: "Business that grows" (singular) / "Businesses that grow" (plural)
- CHECK subject-verb agreement in ALL content
- USE proper English grammar throughout
- AVOID grammatical errors that make content look unprofessional
- AVOID awkward phrasing like "Finance my service banking enterprise"
- KEEP language natural and conversational

📱 COPY READABILITY & VISUAL HIERARCHY (USER FEEDBACK):
- MOBILE-FIRST: All text must be easily readable on mobile devices
- CONCISE SUBHEADINGS: Make subheadings scannable and concise
- AVOID CLUTTER: Don't have too many elements competing for attention
- CLEAR HIERARCHY: Primary message should dominate, supporting text secondary
- NO SMALL TEXT: Avoid text that becomes unreadable when compressed
- READABLE CONTRAST: Ensure text works well when overlaid on images
3. CAPTION (50-100 words): Should continue the story started by the headline/subheadline in the image
4. CALL-TO-ACTION (2-4 words): Action-oriented and contextually appropriate
5. HASHTAGS (EXACTLY ${hashtagCount}): ${normalizedPlatform === 'instagram' ? '5 hashtags for Instagram' : '3 hashtags for other platforms'}

🎯 CTA IMPROVEMENT REQUIREMENTS (USER FEEDBACK):
${generateBusinessContextAwareCTAGuidance(brandProfile, businessType, concept)}

🔗 CONTENT COHESION REQUIREMENTS:
- The headline and subheadline will be embedded as text elements in the visual design
- Your caption must continue and expand on the message shown in the image text
- Think of it as: Image shows the "hook" → Caption provides the "story" → CTA drives "action"
- Example: If image shows "Smart Banking" → Caption explains why it's smart and what that means for the customer

🚫 CRITICAL HEADLINE RESTRICTIONS:
- NEVER start with company name followed by colon (e.g., "COMPANY:", "BUSINESS:")
- NEVER use "journey", "everyday", or repetitive corporate language
- Headlines should be engaging standalone phrases, not company announcements

🚨 CRITICAL: COHERENT STORY-BASED CONTENT SYSTEM (MANDATORY):
Each ad must tell ONE complete, coherent story. NO generic corporate jargon allowed!

📖 STORY COHERENCE REQUIREMENTS:
1. HEADLINE (max 6 words): Establishes the SPECIFIC story theme and emotional tone
2. SUBHEADLINE (max 25 words): DIRECTLY continues the headline's story - same tone, same theme
3. CAPTION: COMPLETES the story the headline started - must reference headline concepts
4. CTA: MATCHES the story context and emotional tone (urgent story = urgent CTA)
5. HASHTAGS (exactly ${hashtagCount} tags): REFLECT the same story theme

🎭 TONE MATCHING REQUIREMENTS:
- If headline is URGENT → Caption must be URGENT (no calm explanations)
- If headline is PLAYFUL → Caption must be PLAYFUL (no serious corporate speak)
- If headline is PROFESSIONAL → Caption must be PROFESSIONAL (consistent throughout)

🚫 BANNED GENERIC PHRASES (NEVER USE):
- "Professional services that..."
- "Solutions that actually work"
- "Serving the community with..."
- "Quality service you can trust"
- "Experience the excellence of..."
- "Committed to providing..."
- "Dedicated to serving..."

✅ SPECIFICITY TEST:
Could this caption work for ANY competitor? If YES, rewrite to be business-specific!

💰 MONEY FLOW AWARENESS:
- SENDING money scenarios: Use "Send Now", "Transfer Today"
- RECEIVING money scenarios: Use "Get Paid", "Open Account"
- General banking: Use contextual CTAs based on the story

🎯 HEADLINE CLARITY REQUIREMENTS (BASED ON USER FEEDBACK):
- SPECIFIC BENEFITS: "Accept Payments Instantly", "Zero Transaction Fees", "Open Account 5 Minutes"
- AVOID VAGUE: Never use "Business flows. Money moves." - too unclear
- CLEAR VALUE: What exactly does Paya do? Be specific about the benefit
- BENEFIT-FIRST: Lead with what customer gets, not abstract concepts
- PAIN POINT DIRECT: "End Payment Delays", "Skip Bank Queues", "Stop Cash Flow Issues"
- READABLE: Ensure text works well in image designs and mobile viewing

💡 VALUE PROPOSITION CLARITY (USER FEEDBACK):
- EXPLAIN WHY: Don't just say "Easy ${businessType}" - explain WHY it's easy
- DIFFERENTIATION: What makes ${brandProfile.businessName} different from other options?
- SPECIFIC FEATURES: Use concrete details like timeframes, guarantees, unique features
- PROOF POINTS: Use numbers, timeframes, guarantees when possible
- CUSTOMER BENEFIT: Focus on what the customer gains, not what the business offers
- CLEAR COMPARISON: "Traditional providers: 3 days. ${brandProfile.businessName}: 3 seconds"

🚨 BUSINESS RELEVANCE VALIDATION (CRITICAL):
- NEVER create content about industries/services the business doesn't offer
- If business is FINTECH → Focus ONLY on payments, banking, transfers, business finance, mobile money
- If business is HEALTHCARE → Focus ONLY on medical services, patient care, health solutions
- If business is EDUCATION → Focus ONLY on learning, courses, academic services
- ALWAYS check: Does this headline relate to the actual business services?
- FOCUS for Paya Finance: Mobile banking, instant payments, business growth, cash flow solutions
- REQUIRED: Headlines must connect to actual business services and target audience

🔗 STORY COHERENCE VALIDATION (NON-NEGOTIABLE):
- HEADLINE and CAPTION must share common keywords or themes
- If headline mentions "PAYMENTS" → caption MUST mention money transfers/transactions/payments
- If headline mentions "SECURE" → caption MUST mention security/protection/safety
- If headline mentions "DAILY" → caption MUST mention everyday/routine activities
- If headline mentions "BUSINESS" → caption MUST mention business operations/growth/management
- If headline mentions "MOBILE" → caption MUST mention phone/app/mobile banking
- NEVER write generic captions that could work with any headline
- Caption must SPECIFICALLY relate to and expand on the headline message
- NO corporate filler language: "puts BNPL front and center today"

💡 SERVICE-SPECIFIC CONTENT RULES:
${generateEnhancedServiceContentRules(brandProfile.services, keyFeaturesList, competitiveAdvantagesList)}

🎯 CUSTOMER PAIN POINTS & SOLUTIONS:
${getCustmerPainPointsForBusiness(businessType, brandProfile)}

💰 VALUE PROPOSITIONS (USE THESE):
${getValuePropositionsForBusiness(businessType, brandProfile)}

🎯 BUSINESS-SPECIFIC CONTENT FOCUS (DYNAMIC):
- Focus on REAL ${brandProfile.businessName} services: ${normalizeStringList(brandProfile.services || []).join(', ') || `${businessType} services`}
- Target REAL audiences: ${generateEnhancedTargetAudienceContent(brandProfile, businessType)}
- Address REAL pain points: ${getCustmerPainPointsForBusiness(businessType, brandProfile).replace(/^- /gm, '').split('\n').slice(0, 3).join(', ')}
- Use REAL benefits: ${getValuePropositionsForBusiness(businessType, brandProfile).replace(/^- /gm, '').split('\n').slice(0, 3).join(', ')}
- AVOID: Generic content that could apply to any business - be specific to ${businessType}
- CREATE: Authentic ${businessType} scenarios that ${brandProfile.businessName} customers actually experience

📊 USE ACTUAL COMPANY DATA (MANDATORY):
- Business Name: ${brandProfile.businessName}
- Location: ${brandProfile.location || 'Local area'}
- Business Type: ${businessType}
- Services: ${normalizeStringList(brandProfile.services || []).join(', ') || `${businessType} services`}
- Key Features: ${normalizeStringList(brandProfile.keyFeatures || []).join(', ') || `Professional ${businessType} solutions`}
- Unique Selling Points: ${normalizeStringList(brandProfile.uniqueSellingPoints || []).join(', ') || 'Quality, Reliable, Professional'}
- Target Audience: ${brandProfile.targetAudience || `${businessType} customers`}
- NEVER use generic placeholders - ALWAYS reference actual business data above

🎯 DYNAMIC BUSINESS SCENARIOS (ADAPT TO BUSINESS TYPE):
${getAuthenticStoryScenarios(businessType, brandProfile)}

🎯 DIVERSE MARKETING APPROACHES (USE DIFFERENT ONES EACH TIME):
1. SPECIFIC BENEFIT-FOCUSED: Highlight concrete benefits of ${brandProfile.businessName} services
2. PAIN POINT DIRECT: Address specific challenges ${generateAudienceSpecificPainPoints(brandProfile, businessType)}
3. COMPARISON CLEAR: Show how ${brandProfile.businessName} outperforms alternatives
4. URGENCY WITH BENEFIT: Create urgency around ${businessType} needs
5. SOCIAL PROOF SPECIFIC: Reference real customer success with ${brandProfile.businessName}
6. FEATURE SPOTLIGHT CLEAR: Highlight unique features of ${brandProfile.businessName}
7. LIFESTYLE BENEFIT: Show how ${brandProfile.businessName} improves daily life
8. EMOTIONAL RELIEF: Address emotional benefits of choosing ${brandProfile.businessName}
9. TECHNICAL ADVANTAGE: Emphasize superior ${businessType} capabilities
10. LOCAL SOLUTION: Position as the local expert in ${brandProfile.location || 'the area'}

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

📱 HASHTAG REQUIREMENTS (CRITICAL - EXACTLY ${hashtagCount} ONLY):
- MAXIMUM ${hashtagCount} hashtags total - NO MORE than ${hashtagCount}
- NEVER exceed ${hashtagCount} hashtags - this is non-negotiable
- Choose the BEST ${hashtagCount} most relevant hashtags only
- Example format: #${brandProfile.businessName.replace(/\s+/g, '')} #${businessType.replace(/\s+/g, '')} #${(brandProfile.location || 'Local').replace(/\s+/g, '')} #Professional #Quality
- PRIORITIZE: Brand name (#${brandProfile.businessName.replace(/\s+/g, '')}) + Service type + Location + Industry + One specific feature
- QUALITY over quantity - ${hashtagCount} strategic hashtags perform better than 10 generic ones

🌍 LOCAL CULTURAL CONNECTION (DYNAMIC):
${getLocalCulturalConnectionInstructions(brandProfile.location, businessType)}

CRITICAL: You MUST return ONLY valid JSON in this exact format. No additional text, no explanations, no markdown formatting:

{
  "headline": "your 6-word headline here",
  "subheadline": "your subheadline here (max 25 words)",
  "caption": "your caption here (50-100 words)",
  "cta": "your call-to-action here",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}

IMPORTANT: Return ONLY the JSON object above. Do not include any other text, explanations, or formatting.`;
}

/**
 * Helper functions for advanced prompt system (ported from Revo 2.0)
 */

// Normalize string list helper
function normalizeStringList(input: any): string[] {
  if (Array.isArray(input)) return input.filter(item => typeof item === 'string' && item.trim().length > 0);
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return [];
}

// Enhanced service list processor with rich descriptions
function normalizeServiceList(input: any): string[] {
  if (Array.isArray(input)) {
    return input.map(service => {
      if (typeof service === 'string') return service;
      if (typeof service === 'object') {
        // Extract rich service information
        const serviceName = service.name || service.serviceName || service.title;
        const description = service.description || service.details || service.summary;

        if (serviceName && description) {
          // Combine name with key description points
          const shortDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;
          return `${serviceName} (${shortDesc})`;
        }

        return serviceName || String(service);
      }
      return String(service);
    }).filter(s => s && s.trim().length > 0);
  }
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return [];
}

/**
 * Get detailed service information for content generation
 */
function getDetailedServiceInfo(services: any[]): any[] {
  if (!Array.isArray(services)) return [];

  return services.map(service => {
    if (typeof service === 'string') {
      return {
        name: service,
        description: null,
        benefits: [],
        features: [],
        targetAudience: null
      };
    }

    if (typeof service === 'object') {
      return {
        name: service.name || service.serviceName || service.title || 'Service',
        description: service.description || service.details || service.summary || null,
        benefits: extractServiceBenefits(service),
        features: extractServiceFeatures(service),
        targetAudience: service.targetAudience || service.audience || null,
        pricing: service.pricing || service.price || null,
        duration: service.duration || service.timeframe || null
      };
    }

    return {
      name: String(service),
      description: null,
      benefits: [],
      features: [],
      targetAudience: null
    };
  });
}

/**
 * Extract service benefits from service object
 */
function extractServiceBenefits(service: any): string[] {
  const benefits: string[] = [];

  if (service.benefits && Array.isArray(service.benefits)) {
    benefits.push(...service.benefits);
  }

  if (service.advantages && Array.isArray(service.advantages)) {
    benefits.push(...service.advantages);
  }

  if (service.value && typeof service.value === 'string') {
    benefits.push(service.value);
  }

  return benefits.filter(b => b && typeof b === 'string').slice(0, 3);
}

/**
 * Extract service features from service object
 */
function extractServiceFeatures(service: any): string[] {
  const features: string[] = [];

  if (service.features && Array.isArray(service.features)) {
    features.push(...service.features);
  }

  if (service.includes && Array.isArray(service.includes)) {
    features.push(...service.includes);
  }

  if (service.specifications && Array.isArray(service.specifications)) {
    features.push(...service.specifications);
  }

  return features.filter(f => f && typeof f === 'string').slice(0, 3);
}

/**
 * Generate enhanced service content rules using detailed service information
 */
function generateEnhancedServiceContentRules(services: any, keyFeaturesList: string[], competitiveAdvantagesList: string[]): string {
  const rules: string[] = [];

  // Process detailed service information
  const detailedServices = getDetailedServiceInfo(services || []);

  if (detailedServices.length > 0) {
    detailedServices.slice(0, 4).forEach(service => {
      let serviceRule = `- ${service.name}:`;

      if (service.description) {
        serviceRule += ` ${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}`;
      }

      if (service.benefits.length > 0) {
        serviceRule += ` | Benefits: ${service.benefits.slice(0, 2).join(', ')}`;
      }

      if (service.features.length > 0) {
        serviceRule += ` | Features: ${service.features.slice(0, 2).join(', ')}`;
      }

      if (service.targetAudience) {
        serviceRule += ` | Target: ${service.targetAudience}`;
      }

      serviceRule += ' - Focus on specific outcomes and customer value';
      rules.push(serviceRule);
    });
  }

  // Add key features if available
  if (keyFeaturesList.length > 0) {
    rules.push(`- Use these key features: ${keyFeaturesList.slice(0, 3).join(', ')}`);
  }

  // Add competitive advantages if available
  if (competitiveAdvantagesList.length > 0) {
    rules.push(`- Highlight advantages: ${competitiveAdvantagesList.slice(0, 2).join(', ')}`);
  }

  // Add fallback if no services
  if (rules.length === 0) {
    rules.push('- Focus on core business value and customer benefits');
    rules.push('- Highlight unique selling points and competitive advantages');
    rules.push('- Emphasize quality, reliability, and customer satisfaction');
  }

  return rules.join('\n');
}

/**
 * Generate enhanced services display for business intelligence
 */
function generateEnhancedServicesDisplay(services: any): string {
  if (!services) return '';

  const detailedServices = getDetailedServiceInfo(services);
  if (detailedServices.length === 0) return '';

  const serviceDisplays: string[] = [];

  detailedServices.slice(0, 3).forEach(service => {
    let display = service.name;

    if (service.description) {
      const shortDesc = service.description.length > 60 ?
        service.description.substring(0, 60) + '...' :
        service.description;
      display += ` (${shortDesc})`;
    }

    if (service.benefits.length > 0) {
      display += ` - ${service.benefits[0]}`;
    }

    serviceDisplays.push(display);
  });

  return serviceDisplays.length > 0 ? `- Services: ${serviceDisplays.join(' | ')}` : '';
}

/**
 * Enhanced target audience processing and analysis
 */
function getEnhancedTargetAudienceInfo(brandProfile: any, businessType: string): any {
  const targetAudience = brandProfile.targetAudience || '';

  return {
    primary: targetAudience || `${businessType} customers and clients`,
    segments: extractAudienceSegments(targetAudience, businessType),
    demographics: extractAudienceDemographics(targetAudience),
    painPoints: extractAudiencePainPoints(targetAudience, businessType),
    motivations: extractAudienceMotivations(targetAudience, businessType),
    communicationStyle: getAudienceCommunicationStyle(targetAudience, businessType)
  };
}

/**
 * Extract audience segments from target audience description
 */
function extractAudienceSegments(targetAudience: string, businessType: string): string[] {
  if (!targetAudience) return [`${businessType} customers`];

  const segments: string[] = [];
  const audienceLower = targetAudience.toLowerCase();

  // Common audience segments
  const segmentKeywords = {
    'small business': 'Small business owners',
    'entrepreneur': 'Entrepreneurs',
    'professional': 'Working professionals',
    'student': 'Students',
    'family': 'Families',
    'parent': 'Parents',
    'senior': 'Senior citizens',
    'young adult': 'Young adults',
    'millennial': 'Millennials',
    'gen z': 'Gen Z',
    'corporate': 'Corporate clients',
    'individual': 'Individual consumers',
    'b2b': 'Business clients',
    'b2c': 'Individual customers'
  };

  for (const [keyword, segment] of Object.entries(segmentKeywords)) {
    if (audienceLower.includes(keyword)) {
      segments.push(segment);
    }
  }

  return segments.length > 0 ? segments : [targetAudience];
}

/**
 * Extract demographic information from target audience
 */
function extractAudienceDemographics(targetAudience: string): any {
  if (!targetAudience) return {};

  const demographics: any = {};
  const audienceLower = targetAudience.toLowerCase();

  // Age groups
  if (audienceLower.includes('young') || audienceLower.includes('millennial') || audienceLower.includes('gen z')) {
    demographics.ageGroup = 'young adults (18-35)';
  } else if (audienceLower.includes('professional') || audienceLower.includes('working')) {
    demographics.ageGroup = 'working adults (25-55)';
  } else if (audienceLower.includes('senior') || audienceLower.includes('elderly')) {
    demographics.ageGroup = 'seniors (55+)';
  }

  // Income level
  if (audienceLower.includes('premium') || audienceLower.includes('luxury') || audienceLower.includes('high-end')) {
    demographics.incomeLevel = 'high income';
  } else if (audienceLower.includes('budget') || audienceLower.includes('affordable') || audienceLower.includes('student')) {
    demographics.incomeLevel = 'budget-conscious';
  } else if (audienceLower.includes('professional') || audienceLower.includes('business')) {
    demographics.incomeLevel = 'middle to high income';
  }

  // Lifestyle
  if (audienceLower.includes('busy') || audienceLower.includes('professional')) {
    demographics.lifestyle = 'busy professionals';
  } else if (audienceLower.includes('family')) {
    demographics.lifestyle = 'family-oriented';
  } else if (audienceLower.includes('health') || audienceLower.includes('fitness')) {
    demographics.lifestyle = 'health-conscious';
  }

  return demographics;
}

/**
 * Extract audience pain points from target audience description
 */
function extractAudiencePainPoints(targetAudience: string, businessType: string): string[] {
  if (!targetAudience) return [];

  const painPoints: string[] = [];
  const audienceLower = targetAudience.toLowerCase();

  // Common pain point indicators
  if (audienceLower.includes('busy') || audienceLower.includes('time-constrained')) {
    painPoints.push('Limited time for complex processes');
  }
  if (audienceLower.includes('budget') || audienceLower.includes('cost-conscious')) {
    painPoints.push('Need for cost-effective solutions');
  }
  if (audienceLower.includes('small business') || audienceLower.includes('entrepreneur')) {
    painPoints.push('Limited resources and need for efficiency');
  }
  if (audienceLower.includes('professional') || audienceLower.includes('working')) {
    painPoints.push('Need for reliable, professional-grade solutions');
  }

  return painPoints;
}

/**
 * Extract audience motivations from target audience description
 */
function extractAudienceMotivations(targetAudience: string, businessType: string): string[] {
  if (!targetAudience) return [];

  const motivations: string[] = [];
  const audienceLower = targetAudience.toLowerCase();

  // Common motivations
  if (audienceLower.includes('growth') || audienceLower.includes('entrepreneur')) {
    motivations.push('Business growth and success');
  }
  if (audienceLower.includes('family') || audienceLower.includes('parent')) {
    motivations.push('Family well-being and security');
  }
  if (audienceLower.includes('professional') || audienceLower.includes('career')) {
    motivations.push('Professional advancement and efficiency');
  }
  if (audienceLower.includes('health') || audienceLower.includes('wellness')) {
    motivations.push('Health and wellness improvement');
  }
  if (audienceLower.includes('quality') || audienceLower.includes('premium')) {
    motivations.push('Quality and excellence');
  }

  return motivations;
}

/**
 * Determine appropriate communication style for target audience
 */
function getAudienceCommunicationStyle(targetAudience: string, businessType: string): string {
  if (!targetAudience) return 'professional and approachable';

  const audienceLower = targetAudience.toLowerCase();

  if (audienceLower.includes('young') || audienceLower.includes('millennial') || audienceLower.includes('gen z')) {
    return 'casual, energetic, and relatable';
  } else if (audienceLower.includes('professional') || audienceLower.includes('corporate') || audienceLower.includes('b2b')) {
    return 'professional, authoritative, and results-focused';
  } else if (audienceLower.includes('family') || audienceLower.includes('parent')) {
    return 'warm, trustworthy, and family-focused';
  } else if (audienceLower.includes('luxury') || audienceLower.includes('premium')) {
    return 'sophisticated, exclusive, and premium';
  } else if (audienceLower.includes('student') || audienceLower.includes('budget')) {
    return 'friendly, supportive, and value-focused';
  }

  return 'professional and approachable';
}

/**
 * Generate enhanced target audience content for prompts
 */
function generateEnhancedTargetAudienceContent(brandProfile: any, businessType: string): string {
  const audienceInfo = getEnhancedTargetAudienceInfo(brandProfile, businessType);

  let content = audienceInfo.primary;

  if (audienceInfo.segments.length > 1) {
    content += ` (${audienceInfo.segments.slice(0, 3).join(', ')})`;
  }

  if (audienceInfo.demographics.ageGroup) {
    content += ` - ${audienceInfo.demographics.ageGroup}`;
  }

  if (audienceInfo.demographics.lifestyle) {
    content += ` - ${audienceInfo.demographics.lifestyle}`;
  }

  if (audienceInfo.motivations.length > 0) {
    content += ` - motivated by ${audienceInfo.motivations.slice(0, 2).join(' and ')}`;
  }

  return content;
}

/**
 * Generate enhanced target audience display for business intelligence
 */
function generateEnhancedTargetAudienceDisplay(brandProfile: any, businessType: string): string {
  if (!brandProfile.targetAudience) return '';

  const audienceInfo = getEnhancedTargetAudienceInfo(brandProfile, businessType);

  let display = `- Target Audience: ${audienceInfo.primary}`;

  if (audienceInfo.segments.length > 1) {
    display += ` | Segments: ${audienceInfo.segments.slice(0, 3).join(', ')}`;
  }

  if (audienceInfo.demographics.ageGroup || audienceInfo.demographics.incomeLevel) {
    const demographics = [audienceInfo.demographics.ageGroup, audienceInfo.demographics.incomeLevel]
      .filter(Boolean).join(', ');
    if (demographics) {
      display += ` | Demographics: ${demographics}`;
    }
  }

  if (audienceInfo.communicationStyle) {
    display += ` | Communication: ${audienceInfo.communicationStyle}`;
  }

  return display;
}

/**
 * Generate audience-specific pain points for marketing approaches
 */
function generateAudienceSpecificPainPoints(brandProfile: any, businessType: string): string {
  const audienceInfo = getEnhancedTargetAudienceInfo(brandProfile, businessType);

  if (audienceInfo.painPoints.length > 0) {
    return `${audienceInfo.primary} face: ${audienceInfo.painPoints.slice(0, 2).join(' and ')}`;
  }

  return `${audienceInfo.primary} face`;
}

// Get enhanced content approaches
function getEnhancedContentApproaches(): string[] {
  return [
    'Storytelling-Master', 'Cultural-Connector', 'Problem-Solver-Pro',
    'Innovation-Showcase', 'Trust-Builder-Elite', 'Community-Champion',
    'Speed-Emphasis', 'Security-Focus', 'Accessibility-First',
    'Growth-Enabler', 'Cost-Savings-Expert', 'Convenience-King',
    'Social-Proof-Power', 'Transformation-Story', 'Local-Hero'
  ];
}

// Get location-specific language instructions (dynamic)
function getLocationSpecificLanguageInstructions(location: string): string {
  if (!location || location.toLowerCase() === 'global') {
    return `- Use professional, universally accessible language
- Maintain clear, engaging communication
- Include culturally neutral terms and expressions
- Keep professional tone while being approachable`;
  }

  const locationKey = location.toLowerCase();

  // Dynamic language instructions based on location
  const locationLanguageMap: Record<string, any> = {
    'kenya': {
      language: 'Swahili',
      elements: ['Karibu (welcome)', 'Asante (thank you)', 'Haraka (fast)', 'Poa (cool/good)'],
      businessTerms: ['Biashara (business)', 'Huduma (service)', 'Kazi (work)', 'Pesa (money)'],
      examples: ['Fast service → Huduma ya haraka', 'Welcome → Karibu', 'Thank you → Asante sana']
    },
    'nigeria': {
      language: 'Pidgin English',
      elements: ['How far? (how are you)', 'No wahala (no problem)', 'Sharp sharp (quickly)'],
      businessTerms: ['Business', 'Work', 'Money', 'Service'],
      examples: ['Fast service → Quick service, no wahala', 'No worries → No stress at all']
    },
    'south africa': {
      language: 'Local expressions',
      elements: ['Howzit (hello)', 'Lekker (good/nice)', 'Sharp (okay/good)', 'Eish (expression of concern)'],
      businessTerms: ['Business', 'Service', 'Work', 'Money'],
      examples: ['Good service → Lekker service', 'Hello → Howzit']
    },
    'ghana': {
      language: 'Twi/Local expressions',
      elements: ['Akwaaba (welcome)', 'Medaase (thank you)', 'Eye (good)', 'Yie (well done)'],
      businessTerms: ['Business', 'Service', 'Work', 'Money'],
      examples: ['Welcome → Akwaaba', 'Thank you → Medaase', 'Good → Eye']
    }
  };

  // Find matching location
  for (const [key, config] of Object.entries(locationLanguageMap)) {
    if (locationKey.includes(key)) {
      return `- ${config.language.toUpperCase()} ELEMENTS: ${config.elements.join(', ')}
- BUSINESS CONTEXT: ${config.businessTerms.join(', ')}
- INTEGRATION EXAMPLES: ${config.examples.join(', ')}
- Mix English (70%) with local language (30%) naturally
- Keep culturally authentic while maintaining professionalism`;
    }
  }

  // Default for other locations
  return `- Use appropriate local language elements for ${location}
- Mix English (70%) with local language (30%) naturally
- Include culturally relevant terms and expressions
- Maintain professional tone while being locally authentic
- Research common greetings and business terms for ${location}`;
}

/**
 * Generate dynamic local cultural connection instructions
 */
function getLocalCulturalConnectionInstructions(location: string, businessType: string): string {
  if (!location || location.toLowerCase() === 'global') {
    return `- Reference universal business experiences and challenges
- Use scenarios that resonate across cultures
- Include professional contexts that apply globally
- Sound like someone who understands modern business challenges
- Reference common pain points: time constraints, quality concerns, cost considerations`;
  }

  const locationKey = location.toLowerCase();

  // Dynamic cultural contexts based on location and business type
  const culturalContexts: Record<string, any> = {
    'kenya': {
      experiences: ['public transport', 'mobile payments', 'university fees', 'family support'],
      scenarios: ['When your cousin needs school fees', 'After a long day at work', 'During city traffic'],
      context: ['campus life', 'family obligations', 'side hustles', 'community support'],
      painPoints: ['expensive bank charges', 'long queues', 'complicated processes', 'unreliable services']
    },
    'nigeria': {
      experiences: ['Lagos traffic', 'mobile banking', 'family support', 'business ventures'],
      scenarios: ['When family needs support', 'After work in Lagos', 'During busy market days'],
      context: ['family obligations', 'business hustle', 'community support', 'entrepreneurship'],
      painPoints: ['high transaction fees', 'network issues', 'complex procedures', 'unreliable systems']
    },
    'south africa': {
      experiences: ['taxi rides', 'mobile payments', 'family support', 'local business'],
      scenarios: ['When family needs help', 'After work commute', 'During weekend shopping'],
      context: ['family support', 'community involvement', 'local business', 'social connections'],
      painPoints: ['high costs', 'long wait times', 'complicated systems', 'poor service']
    },
    'usa': {
      experiences: ['commuting', 'online banking', 'family support', 'career growth'],
      scenarios: ['When you need quick service', 'After a busy workday', 'During weekend errands'],
      context: ['work-life balance', 'family time', 'career goals', 'convenience needs'],
      painPoints: ['high fees', 'poor customer service', 'time-consuming processes', 'lack of transparency']
    },
    'uk': {
      experiences: ['public transport', 'digital banking', 'family support', 'local services'],
      scenarios: ['When you need reliable service', 'After work hours', 'During weekend activities'],
      context: ['work commitments', 'family priorities', 'local community', 'quality expectations'],
      painPoints: ['expensive services', 'poor communication', 'lengthy procedures', 'unreliable providers']
    }
  };

  // Find matching location or use generic approach
  let context = culturalContexts['usa']; // Default to universal context
  for (const [key, config] of Object.entries(culturalContexts)) {
    if (locationKey.includes(key)) {
      context = config;
      break;
    }
  }

  return `- Reference real ${location} experiences: ${context.experiences.join(', ')}
- Use locally relevant scenarios: ${context.scenarios.join(', ')}
- Include ${location} context: ${context.context.join(', ')}
- Sound like someone who actually lives in ${location} and understands daily challenges
- Reference local pain points: ${context.painPoints.join(', ')}
- Adapt language and references to ${businessType} industry context`;
}

/**
 * Get dynamic cultural context for visual design
 */
function getDynamicCulturalContext(location: string): any {
  if (!location || location.toLowerCase() === 'global') {
    return {
      region: 'global',
      representation: 'diverse',
      culturalElements: 'universal',
      visualStyle: 'professional'
    };
  }

  const locationKey = location.toLowerCase();

  // Regional cultural contexts
  const culturalContexts: Record<string, any> = {
    'africa': {
      region: 'african',
      representation: 'african',
      culturalElements: 'african',
      visualStyle: 'authentic-african',
      countries: ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'botswana', 'malawi']
    },
    'asia': {
      region: 'asian',
      representation: 'asian',
      culturalElements: 'asian',
      visualStyle: 'authentic-asian',
      countries: ['india', 'china', 'japan', 'thailand', 'vietnam', 'philippines', 'indonesia', 'malaysia', 'singapore']
    },
    'europe': {
      region: 'european',
      representation: 'european',
      culturalElements: 'european',
      visualStyle: 'authentic-european',
      countries: ['uk', 'france', 'germany', 'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark']
    },
    'americas': {
      region: 'american',
      representation: 'diverse-american',
      culturalElements: 'american',
      visualStyle: 'authentic-american',
      countries: ['usa', 'canada', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru']
    }
  };

  // Find matching region
  for (const [region, config] of Object.entries(culturalContexts)) {
    if (config.countries.some((country: string) => locationKey.includes(country))) {
      return {
        ...config,
        specificCountry: config.countries.find((country: string) => locationKey.includes(country)) || location
      };
    }
  }

  // Default to diverse representation
  return {
    region: 'global',
    representation: 'diverse',
    culturalElements: 'universal',
    visualStyle: 'professional',
    specificCountry: location
  };
}

/**
 * Generate dynamic people inclusion instructions based on cultural context
 */
function getDynamicPeopleInstructions(culturalContext: any, businessType: string): string {
  const representationMap: Record<string, string> = {
    'african': `👥 PEOPLE INCLUSION (AFRICAN REPRESENTATION):
- Include authentic Black/African people who represent the target market
- Show people who would actually use ${businessType} services
- Display local African people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- PRIORITY: 80%+ of people should be Black/African for cultural authenticity
- Context: Show people in ${businessType}-relevant settings, not generic offices`,

    'asian': `👥 PEOPLE INCLUSION (ASIAN REPRESENTATION):
- Include authentic Asian people who represent the target market
- Show people who would actually use ${businessType} services
- Display local Asian people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- PRIORITY: 80%+ of people should be Asian for cultural authenticity
- Context: Show people in ${businessType}-relevant settings`,

    'european': `👥 PEOPLE INCLUSION (EUROPEAN REPRESENTATION):
- Include authentic European people who represent the target market
- Show people who would actually use ${businessType} services
- Display local European people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- Context: Show people in ${businessType}-relevant settings`,

    'diverse': `👥 PEOPLE INCLUSION (DIVERSE REPRESENTATION):
- Include diverse, authentic people who represent the target market
- Show people who would actually use ${businessType} services
- Display people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- Context: Show people in ${businessType}-relevant settings`
  };

  return `\n\n${representationMap[culturalContext.representation] || representationMap['diverse']}`;
}

/**
 * Generate dynamic cultural instructions for visual design
 */
function getDynamicCulturalInstructions(culturalContext: any, businessType: string): string {
  if (culturalContext.region === 'global') {
    return '';
  }

  const culturalInstructionsMap: Record<string, any> = {
    'african': {
      title: 'AFRICAN CULTURAL INTELLIGENCE',
      avoid: [
        'Complex trading graphs, stock charts, or financial diagrams that are hard to understand',
        'Western corporate imagery that doesn\'t resonate locally',
        'Abstract business concepts that feel disconnected from daily life'
      ],
      use: [
        'Simple, clear visuals that everyday people can relate to',
        'Local cultural elements, colors, and symbols that feel familiar',
        'Real-life scenarios people experience (family, community, daily activities)'
      ],
      focus: 'Visual storytelling that connects with local values and experiences',
      authenticity: 'Show genuine African environments, not generic stock imagery'
    },
    'asian': {
      title: 'ASIAN CULTURAL INTELLIGENCE',
      avoid: [
        'Western-centric imagery that doesn\'t resonate locally',
        'Generic corporate visuals that feel disconnected',
        'Cultural stereotypes or outdated representations'
      ],
      use: [
        'Modern Asian aesthetics and design principles',
        'Local cultural elements that feel authentic',
        'Contemporary Asian lifestyle scenarios'
      ],
      focus: 'Visual storytelling that reflects modern Asian values and experiences',
      authenticity: 'Show genuine Asian environments and contemporary culture'
    },
    'european': {
      title: 'EUROPEAN CULTURAL INTELLIGENCE',
      avoid: [
        'Generic American corporate imagery',
        'Outdated European stereotypes',
        'One-size-fits-all European representations'
      ],
      use: [
        'Modern European design aesthetics',
        'Local cultural elements specific to the region',
        'Contemporary European lifestyle scenarios'
      ],
      focus: 'Visual storytelling that reflects European values and sophistication',
      authenticity: 'Show genuine European environments and modern culture'
    },
    'american': {
      title: 'AMERICAN CULTURAL INTELLIGENCE',
      avoid: [
        'Generic corporate imagery that lacks personality',
        'Outdated American stereotypes',
        'One-dimensional representations'
      ],
      use: [
        'Modern American design trends',
        'Diverse American cultural elements',
        'Contemporary American lifestyle scenarios'
      ],
      focus: 'Visual storytelling that reflects American diversity and innovation',
      authenticity: 'Show genuine American environments and modern culture'
    }
  };

  const config = culturalInstructionsMap[culturalContext.region];
  if (!config) return '';

  const businessSpecificGuidance = getCulturalBusinessGuidance(businessType);

  return `\n\n🌍 ${config.title}:
- AVOID: ${config.avoid.join('\n- AVOID: ')}
- USE: ${config.use.join('\n- USE: ')}
- FOCUS: ${config.focus}
- SIMPLICITY: Keep visual elements clean and easy to understand at first glance
- AUTHENTICITY: ${config.authenticity}

${businessSpecificGuidance}`;
}

// Get competitor analysis
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

  return analysis || '- Focus on unique value proposition and market differentiation';
}

// Get authentic story scenarios (dynamic generation)
function getAuthenticStoryScenarios(brandProfile: any, businessType: string): string {
  // First, try to extract scenarios from brand profile data
  const brandSpecificScenarios = extractScenariosFromBrandProfile(brandProfile);
  if (brandSpecificScenarios.length > 0) {
    return brandSpecificScenarios.map(scenario => `- ${scenario}`).join('\n');
  }

  // Generate dynamic scenarios based on business type and brand profile
  const scenarios = generateDynamicStoryScenarios(businessType, brandProfile);
  return scenarios.map(scenario => `- ${scenario}`).join('\n');
}

/**
 * Extract story scenarios from brand profile data
 */
function extractScenariosFromBrandProfile(brandProfile: any): string[] {
  const scenarios: string[] = [];

  // Extract from target audience
  if (brandProfile.targetAudience) {
    const audience = brandProfile.targetAudience.toLowerCase();
    if (audience.includes('small business')) {
      scenarios.push('Small business owner seeking efficient solutions to grow their business');
    }
    if (audience.includes('family') || audience.includes('parent')) {
      scenarios.push('Family member looking for reliable services for their loved ones');
    }
    if (audience.includes('professional') || audience.includes('executive')) {
      scenarios.push('Professional needing quality services to support their career');
    }
    if (audience.includes('student')) {
      scenarios.push('Student seeking affordable and accessible services');
    }
  }

  // Extract from services context
  if (brandProfile.services && Array.isArray(brandProfile.services)) {
    const detailedServices = getDetailedServiceInfo(brandProfile.services);
    detailedServices.slice(0, 2).forEach(service => {
      if (service.targetAudience) {
        scenarios.push(`${service.targetAudience} needing ${service.name.toLowerCase()} solutions`);
      }
    });
  }

  return scenarios.slice(0, 4); // Limit to 4 most relevant
}

/**
 * Generate dynamic story scenarios based on business type
 */
function generateDynamicStoryScenarios(businessType: string, brandProfile: any): string[] {
  // Ensure businessType is a string - comprehensive type safety
  const businessTypeStr = String(businessType || 'general business');
  const businessLower = businessTypeStr.toLowerCase();
  const location = brandProfile?.location || 'local area';
  const businessName = brandProfile?.businessName || 'the business';

  // Business-type-specific scenario templates
  const scenarioTemplates: Record<string, string[]> = {
    'fintech': [
      'Small business owner needs to pay suppliers quickly to maintain relationships',
      'University student managing limited budget while supporting family',
      'Entrepreneur growing business but struggling with traditional banking limitations',
      'Family member sending money home for school fees or medical expenses'
    ],
    'healthcare': [
      'Patient needing convenient access to healthcare services',
      'Family caring for elderly relative with ongoing medical needs',
      'Professional managing health while maintaining busy work schedule',
      'Community member seeking preventive care and wellness support'
    ],
    'restaurant': [
      `Local resident looking for quality dining experience in ${location}`,
      'Family celebrating special occasion and wanting memorable meal',
      'Professional needing convenient lunch option during busy workday',
      'Food lover seeking authentic cuisine and fresh ingredients'
    ],
    'retail': [
      `Customer shopping for quality products in ${location}`,
      'Family member looking for gifts and special items',
      'Professional needing reliable products for work or home',
      'Community member supporting local businesses'
    ],
    'fitness': [
      'Person starting fitness journey and needing supportive environment',
      'Professional balancing work-life and prioritizing health',
      'Family member seeking active lifestyle for better wellness',
      'Community member looking for local fitness solutions'
    ],
    'beauty': [
      'Person preparing for special event and wanting to look their best',
      'Professional maintaining appearance for career confidence',
      'Individual seeking self-care and wellness treatments',
      'Community member looking for trusted beauty services'
    ],
    'education': [
      'Student seeking quality education to advance their career',
      'Parent looking for educational opportunities for their children',
      'Professional needing skills development for career growth',
      'Community member pursuing lifelong learning goals'
    ],
    'consulting': [
      'Business owner needing expert guidance to solve challenges',
      'Professional seeking strategic advice for career advancement',
      'Organization looking for specialized expertise and solutions',
      'Entrepreneur needing support to scale their business'
    ],
    'automotive': [
      'Vehicle owner needing reliable maintenance and repair services',
      'Family ensuring their car is safe and dependable',
      'Professional requiring efficient automotive solutions',
      'Community member seeking trustworthy local automotive service'
    ],
    'legal': [
      'Individual facing legal challenge and needing expert representation',
      'Business owner requiring legal guidance for operations',
      'Family member needing legal support for important matters',
      'Professional seeking legal advice for career decisions'
    ]
  };

  // Find matching business type
  for (const [type, scenarios] of Object.entries(scenarioTemplates)) {
    if (businessLower.includes(type)) {
      return scenarios;
    }
  }

  // Generate generic scenarios with business context
  return [
    `Customer in ${location} facing daily challenges that ${businessName} solves`,
    `Professional needing reliable ${businessType} solutions for work efficiency`,
    `Family member seeking quality ${businessType} services for loved ones`,
    `Community member looking for trusted local ${businessType} provider`
  ];
}

// Get customer pain points for business (dynamic generation)
function getCustmerPainPointsForBusiness(businessType: string, brandProfile: any): string {
  // First, try to use brand profile data to identify specific pain points
  const brandSpecificPainPoints = extractPainPointsFromBrandProfile(brandProfile);
  if (brandSpecificPainPoints.length > 0) {
    return brandSpecificPainPoints.map(point => `- ${point}`).join('\n');
  }

  // Generate dynamic pain points based on business type
  const painPoints = generateDynamicPainPoints(businessType, brandProfile);
  return painPoints.map(point => `- ${point}`).join('\n');
}

/**
 * Extract pain points from brand profile data
 */
function extractPainPointsFromBrandProfile(brandProfile: any): string[] {
  const painPoints: string[] = [];

  // Look for pain points in competitive advantages (what they solve)
  if (brandProfile.competitiveAdvantages && Array.isArray(brandProfile.competitiveAdvantages)) {
    brandProfile.competitiveAdvantages.forEach((advantage: string) => {
      if (advantage.toLowerCase().includes('unlike') || advantage.toLowerCase().includes('no more') || advantage.toLowerCase().includes('eliminates')) {
        // Extract implied pain point from competitive advantage
        const painPoint = extractPainPointFromAdvantage(advantage);
        if (painPoint) painPoints.push(painPoint);
      }
    });
  }

  // Look for pain points in business description
  if (brandProfile.description) {
    const description = brandProfile.description.toLowerCase();
    if (description.includes('solve') || description.includes('problem') || description.includes('challenge')) {
      // Extract pain points from description context
      const extractedPainPoints = extractPainPointsFromDescription(brandProfile.description);
      painPoints.push(...extractedPainPoints);
    }
  }

  return painPoints.slice(0, 5); // Limit to 5 most relevant
}

/**
 * Generate dynamic pain points based on business type
 */
function generateDynamicPainPoints(businessType: string, brandProfile: any): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Business-type-specific pain point templates
  const painPointTemplates: Record<string, string[]> = {
    'fintech': [
      'Long bank queues and limited banking hours',
      'High transaction fees and hidden charges',
      'Complicated account opening processes',
      'Limited access to credit and financial services',
      'Slow money transfers and payment processing'
    ],
    'healthcare': [
      'Long waiting times for appointments',
      'Limited access to quality healthcare',
      'High medical costs and insurance complications',
      'Difficulty finding trusted healthcare providers',
      'Lack of convenient healthcare options'
    ],
    'restaurant': [
      'Long wait times for food delivery',
      'Limited healthy dining options',
      'Inconsistent food quality and service',
      'High dining costs for quality meals',
      'Difficulty finding authentic local cuisine'
    ],
    'retail': [
      'Limited product selection and availability',
      'High prices and lack of competitive deals',
      'Poor customer service and return policies',
      'Inconvenient shopping hours and locations',
      'Difficulty finding quality products locally'
    ],
    'fitness': [
      'Expensive gym memberships and hidden fees',
      'Crowded facilities and limited equipment access',
      'Lack of personalized fitness guidance',
      'Inconvenient class schedules and locations',
      'Difficulty maintaining consistent workout routines'
    ],
    'beauty': [
      'Expensive beauty treatments and services',
      'Difficulty finding skilled beauty professionals',
      'Limited appointment availability',
      'Inconsistent service quality and results',
      'Lack of personalized beauty solutions'
    ],
    'education': [
      'High tuition costs and educational expenses',
      'Limited access to quality educational resources',
      'Inflexible class schedules and learning formats',
      'Difficulty finding qualified instructors',
      'Lack of personalized learning approaches'
    ],
    'consulting': [
      'High consulting fees and unclear pricing',
      'Difficulty finding industry-specific expertise',
      'Long project timelines and delayed results',
      'Poor communication and project management',
      'Lack of measurable business outcomes'
    ],
    'automotive': [
      'High vehicle maintenance and repair costs',
      'Unreliable service and poor workmanship',
      'Long wait times for service appointments',
      'Difficulty finding trustworthy mechanics',
      'Lack of transparent pricing and estimates'
    ],
    'legal': [
      'High legal fees and unexpected costs',
      'Difficulty understanding complex legal processes',
      'Long case resolution times',
      'Limited access to specialized legal expertise',
      'Poor communication from legal representatives'
    ]
  };

  // Find matching business type
  for (const [type, painPoints] of Object.entries(painPointTemplates)) {
    if (businessLower.includes(type)) {
      return painPoints;
    }
  }

  // Generate generic pain points with business type context
  return [
    `Limited access to quality ${businessType} services`,
    `High costs and hidden fees for ${businessType} solutions`,
    `Poor customer service experience with ${businessType} providers`,
    `Complicated processes and procedures in ${businessType} industry`,
    `Lack of reliable ${businessType} service providers`
  ];
}

/**
 * Helper functions for extracting pain points from brand profile text
 */
function extractPainPointFromAdvantage(advantage: string): string | null {
  // Simple extraction logic - can be enhanced
  if (advantage.toLowerCase().includes('no more')) {
    return advantage.replace(/no more/i, '').trim();
  }
  if (advantage.toLowerCase().includes('eliminates')) {
    return advantage.replace(/eliminates/i, '').trim();
  }
  return null;
}

function extractPainPointsFromDescription(description: string): string[] {
  // Simple extraction logic - can be enhanced with NLP
  const painPoints: string[] = [];
  const sentences = description.split(/[.!?]+/);

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (lower.includes('problem') || lower.includes('challenge') || lower.includes('difficulty')) {
      painPoints.push(sentence.trim());
    }
  });

  return painPoints.slice(0, 2); // Limit to 2 from description
}

// Get value propositions for business (dynamic generation)
function getValuePropositionsForBusiness(businessType: string, brandProfile: any): string {
  // First, try to use brand profile data for specific value propositions
  const brandSpecificValueProps = extractValuePropsFromBrandProfile(brandProfile);
  if (brandSpecificValueProps.length > 0) {
    return brandSpecificValueProps.map(prop => `- ${prop}`).join('\n');
  }

  // Generate dynamic value propositions based on business type
  const valueProps = generateDynamicValuePropositions(businessType, brandProfile);
  return valueProps.map(prop => `- ${prop}`).join('\n');
}

/**
 * Extract value propositions from brand profile data
 */
function extractValuePropsFromBrandProfile(brandProfile: any): string[] {
  const valueProps: string[] = [];

  // Use competitive advantages directly
  if (brandProfile.competitiveAdvantages && Array.isArray(brandProfile.competitiveAdvantages)) {
    valueProps.push(...brandProfile.competitiveAdvantages.slice(0, 3));
  }

  // Use key features as value propositions
  if (brandProfile.keyFeatures && Array.isArray(brandProfile.keyFeatures)) {
    valueProps.push(...brandProfile.keyFeatures.slice(0, 2));
  }

  // Use unique selling points
  if (brandProfile.uniqueSellingPoints && Array.isArray(brandProfile.uniqueSellingPoints)) {
    valueProps.push(...brandProfile.uniqueSellingPoints.slice(0, 2));
  }

  return valueProps.slice(0, 5); // Limit to 5 most relevant
}

/**
 * Generate dynamic value propositions based on business type
 */
function generateDynamicValuePropositions(businessType: string, brandProfile: any): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Business-type-specific value proposition templates
  const valuePropsTemplates: Record<string, string[]> = {
    'fintech': [
      'Instant account opening with no paperwork',
      'Zero hidden fees and transparent pricing',
      '24/7 mobile banking convenience',
      'Fast money transfers and payments',
      'No minimum balance requirements'
    ],
    'healthcare': [
      'Quick appointment scheduling and minimal wait times',
      'Affordable healthcare with transparent pricing',
      'Qualified and experienced healthcare professionals',
      'Convenient location and flexible hours',
      'Comprehensive care and follow-up support'
    ],
    'restaurant': [
      'Fresh, high-quality ingredients and authentic flavors',
      'Fast service and convenient dining options',
      'Affordable prices with generous portions',
      'Clean, comfortable dining environment',
      'Friendly service and customer satisfaction guarantee'
    ],
    'retail': [
      'Wide selection of quality products',
      'Competitive prices and regular promotions',
      'Excellent customer service and easy returns',
      'Convenient shopping hours and locations',
      'Expert product knowledge and recommendations'
    ],
    'fitness': [
      'State-of-the-art equipment and clean facilities',
      'Flexible membership options and affordable rates',
      'Expert trainers and personalized fitness programs',
      'Convenient class schedules and multiple locations',
      'Supportive community and proven results'
    ],
    'beauty': [
      'Skilled professionals and latest beauty techniques',
      'High-quality products and personalized treatments',
      'Relaxing atmosphere and excellent customer care',
      'Flexible scheduling and convenient location',
      'Competitive pricing and satisfaction guarantee'
    ],
    'education': [
      'Expert instructors and proven teaching methods',
      'Flexible learning options and personalized approach',
      'Comprehensive curriculum and practical skills',
      'Affordable tuition and payment plans',
      'Career support and job placement assistance'
    ],
    'consulting': [
      'Industry expertise and proven track record',
      'Customized solutions and strategic insights',
      'Clear communication and project transparency',
      'Measurable results and ROI focus',
      'Competitive rates and flexible engagement models'
    ],
    'automotive': [
      'Certified technicians and quality workmanship',
      'Transparent pricing and detailed estimates',
      'Fast, reliable service and convenient scheduling',
      'Warranty on all work and customer satisfaction',
      'State-of-the-art equipment and genuine parts'
    ],
    'legal': [
      'Experienced attorneys and specialized expertise',
      'Clear communication and case transparency',
      'Competitive fees and flexible payment options',
      'Personalized attention and dedicated support',
      'Proven track record and successful outcomes'
    ]
  };

  // Find matching business type
  for (const [type, valueProps] of Object.entries(valuePropsTemplates)) {
    if (businessLower.includes(type)) {
      return valueProps;
    }
  }

  // Generate generic value propositions with business type context
  return [
    `High-quality ${businessType} service delivery`,
    `Competitive and transparent pricing for ${businessType} solutions`,
    `Professional and reliable ${businessType} service`,
    `Convenient and accessible ${businessType} solutions`,
    `Excellent customer support and satisfaction guarantee`
  ];
}

// Get competitive messaging rules
function getCompetitiveMessagingRules(brandProfile: any): string {
  return `- Focus on unique differentiators and competitive advantages
- Highlight specific benefits that competitors don't offer
- Use concrete examples and measurable outcomes
- Address customer pain points that competitors ignore
- Emphasize superior value proposition and customer experience`;
}

// Anti-repetition system helpers (ported from Revo 2.0)
type RecentOutput = { headlines: string[]; captions: string[]; concepts: string[] };
const recentOutputs = new Map<string, RecentOutput>();
const recentStyles = new Map<string, string>();
const recentConcepts = new Map<string, Array<{ concept: string; timestamp: number }>>();

function getBrandKey(brandProfile: any, platform: string): string {
  return `${brandProfile.businessName || 'unknown'}-${platform}`.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Generate location-appropriate scenario examples for storytelling
 */
function generateLocationAppropriateScenario(location: string, businessType: string): string {
  const locationLower = (location || '').toLowerCase();
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Currency mapping based on location
  const currencyMap: Record<string, string> = {
    'kenya': 'KES',
    'nigeria': '₦',
    'south africa': 'R',
    'ghana': 'GH₵',
    'usa': '$',
    'united states': '$',
    'uk': '£',
    'united kingdom': '£',
    'canada': 'CAD$',
    'australia': 'AUD$',
    'india': '₹',
    'philippines': '₱',
    'indonesia': 'Rp',
    'thailand': '฿',
    'vietnam': '₫',
    'brazil': 'R$',
    'mexico': 'MX$',
    'spain': '€',
    'france': '€',
    'germany': '€',
    'italy': '€'
  };

  // Find appropriate currency
  let currency = '$'; // Default to USD
  for (const [loc, curr] of Object.entries(currencyMap)) {
    if (locationLower.includes(loc)) {
      currency = curr;
      break;
    }
  }

  // Business-type-specific scenarios
  if (businessLower.includes('finance') || businessLower.includes('bank') || businessLower.includes('fintech')) {
    return `"It's month-end. Rent is due tomorrow. Your business account shows ${currency}15,000 but you need ${currency}25,000."`;
  } else if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    return `"Friday night rush. 50 orders waiting. Your POS system crashes and customers are getting impatient."`;
  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    return `"Black Friday sale starts in 2 hours. Your inventory system shows 'out of stock' for your bestselling item."`;
  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    return `"Patient needs urgent consultation. It's 8 PM and your regular clinic is closed."`;
  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    return `"New Year resolution starts Monday. You need a gym that fits your busy schedule and budget."`;
  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    return `"Wedding is next week. You need a beauty treatment that guarantees perfect results."`;
  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    return `"Career advancement depends on new skills. You need flexible learning that fits your work schedule."`;
  } else if (businessLower.includes('legal') || businessLower.includes('law')) {
    return `"Contract dispute threatens your business. You need legal expertise that understands your industry."`;
  } else if (businessLower.includes('automotive') || businessLower.includes('car')) {
    return `"Car breaks down on highway. You need reliable service that gets you back on the road quickly."`;
  } else {
    return `"Deadline is tomorrow. You need professional ${businessType} service that delivers results on time."`;
  }
}

/**
 * Generate enhanced brand voice instructions based on brand profile
 */
function generateEnhancedBrandVoiceInstructions(brandProfile: any, businessType: string, location: string): string {
  const brandVoice = brandProfile.brandVoice || brandProfile.writingTone || '';
  const businessName = brandProfile.businessName || 'the business';

  // Base voice requirements
  let instructions = [
    '- Write like a REAL PERSON talking to a friend, not a corporate press release',
    '- Use conversational, warm tone: "Welcome" instead of "We are pleased to announce"',
    `- Include personality and character - sound distinctly like ${businessName}, not generic ${businessType}`,
    '- Use specific, concrete language instead of vague corporate buzzwords',
    `- Sound like someone who actually understands ${location} life and challenges`
  ];

  // Enhanced brand voice integration
  if (brandVoice) {
    const voiceLower = brandVoice.toLowerCase();

    // Professional voice variations
    if (voiceLower.includes('professional')) {
      instructions.push('- Maintain professional credibility while being approachable and human');
      instructions.push('- Use industry expertise to build trust, but avoid jargon that confuses customers');
    }

    // Friendly voice variations
    if (voiceLower.includes('friendly') || voiceLower.includes('casual')) {
      instructions.push('- Use warm, welcoming language that makes customers feel comfortable');
      instructions.push('- Include conversational elements like "you know what?" or "here\'s the thing"');
    }

    // Authoritative voice variations
    if (voiceLower.includes('authoritative') || voiceLower.includes('expert')) {
      instructions.push('- Demonstrate expertise through specific knowledge and proven results');
      instructions.push('- Use confident language that shows mastery of the subject matter');
    }

    // Inspirational voice variations
    if (voiceLower.includes('inspirational') || voiceLower.includes('motivational')) {
      instructions.push('- Use uplifting language that motivates and encourages action');
      instructions.push('- Include success stories and positive outcomes to inspire confidence');
    }

    // Trustworthy voice variations
    if (voiceLower.includes('trustworthy') || voiceLower.includes('reliable')) {
      instructions.push('- Use honest, transparent language that builds credibility');
      instructions.push('- Include specific details and proof points to demonstrate reliability');
    }

    // Innovative voice variations
    if (voiceLower.includes('innovative') || voiceLower.includes('modern')) {
      instructions.push('- Use forward-thinking language that shows industry leadership');
      instructions.push('- Include references to latest trends and cutting-edge solutions');
    }

    // Caring voice variations
    if (voiceLower.includes('caring') || voiceLower.includes('compassionate')) {
      instructions.push('- Use empathetic language that shows genuine concern for customer needs');
      instructions.push('- Include supportive phrases that demonstrate understanding and care');
    }

    // Add brand voice override instruction
    instructions.push(`- BRAND VOICE OVERRIDE: Adapt all content to match ${businessName}'s ${brandVoice} voice`);
    instructions.push(`- CONSISTENCY: Ensure all content reflects the ${brandVoice} personality consistently`);
  }

  // Business type specific voice adjustments
  const businessLower = String(businessType || 'general business').toLowerCase();
  if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    instructions.push('- Use caring, professional language that builds trust in health matters');
  } else if (businessLower.includes('finance') || businessLower.includes('bank')) {
    instructions.push('- Use trustworthy, secure language that demonstrates financial expertise');
  } else if (businessLower.includes('education')) {
    instructions.push('- Use encouraging, knowledgeable language that supports learning goals');
  } else if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    instructions.push('- Use appetizing, welcoming language that creates desire and comfort');
  }

  return instructions.join('\n');
}

/**
 * Generate brand voice specific writing style
 */
function generateBrandVoiceStyle(brandVoice: string, businessType: string, businessIntel: any): any {
  const voiceLower = brandVoice.toLowerCase();

  // Professional brand voice
  if (voiceLower.includes('professional')) {
    return {
      name: 'Professional Brand Voice',
      tone: 'Professional, credible, trustworthy',
      voice: `Professional ${businessType} expert with ${businessIntel.localExpertise.experience}`,
      characteristics: [
        'Use industry expertise to build credibility',
        'Maintain professional standards while being approachable',
        'Include specific details and proof points',
        'Demonstrate knowledge through concrete examples'
      ]
    };
  }

  // Friendly brand voice
  if (voiceLower.includes('friendly') || voiceLower.includes('casual')) {
    return {
      name: 'Friendly Brand Voice',
      tone: 'Warm, approachable, conversational',
      voice: `Friendly ${businessType} professional who makes customers feel welcome`,
      characteristics: [
        'Use warm, welcoming language',
        'Include conversational elements and personal touches',
        'Make complex topics easy to understand',
        'Create a comfortable, non-intimidating atmosphere'
      ]
    };
  }

  // Authoritative brand voice
  if (voiceLower.includes('authoritative') || voiceLower.includes('expert')) {
    return {
      name: 'Authoritative Brand Voice',
      tone: 'Confident, knowledgeable, commanding',
      voice: `Leading ${businessType} authority with proven expertise`,
      characteristics: [
        'Demonstrate mastery through specific knowledge',
        'Use confident, decisive language',
        'Include industry insights and trends',
        'Position as the go-to expert in the field'
      ]
    };
  }

  // Inspirational brand voice
  if (voiceLower.includes('inspirational') || voiceLower.includes('motivational')) {
    return {
      name: 'Inspirational Brand Voice',
      tone: 'Uplifting, motivational, encouraging',
      voice: `Inspiring ${businessType} leader who motivates positive change`,
      characteristics: [
        'Use uplifting, encouraging language',
        'Include success stories and positive outcomes',
        'Focus on transformation and growth',
        'Motivate customers to take action'
      ]
    };
  }

  // Trustworthy brand voice
  if (voiceLower.includes('trustworthy') || voiceLower.includes('reliable')) {
    return {
      name: 'Trustworthy Brand Voice',
      tone: 'Honest, transparent, dependable',
      voice: `Reliable ${businessType} professional with proven track record`,
      characteristics: [
        'Use honest, transparent communication',
        'Include specific proof points and guarantees',
        'Demonstrate consistency and reliability',
        'Build trust through authentic storytelling'
      ]
    };
  }

  // Default to conversational if no specific match
  return {
    name: 'Custom Brand Voice',
    tone: brandVoice,
    voice: `${businessType} professional with ${brandVoice} communication style`,
    characteristics: [
      `Maintain ${brandVoice} personality consistently`,
      'Adapt content to match brand voice requirements',
      'Use authentic, brand-appropriate language',
      'Ensure voice consistency across all content'
    ]
  };
}

/**
 * Generate business-context-aware CTA guidance
 */
function generateBusinessContextAwareCTAGuidance(brandProfile: any, businessType: string, concept: any): string {
  const businessName = brandProfile?.businessName || 'the business';
  const businessLower = String(businessType || 'general business').toLowerCase();

  let guidance = [
    '- SPECIFIC ACTION: Use business-specific actions, not generic "Learn More"',
    '- BENEFIT-DRIVEN: Focus on the primary benefit customers get',
    '- URGENCY WHEN APPROPRIATE: Add time-sensitive elements when relevant',
    '- CONTEXTUAL: Match the headline theme and business context',
    '- CLEAR VALUE: Communicate what customers get from taking action',
    '- WEBSITE PROMINENCE: Always include website URL prominently in design'
  ];

  // Business-type-specific CTA guidance
  if (businessLower.includes('bank') || businessLower.includes('finance') || businessLower.includes('fintech')) {
    guidance.push('- FINANCIAL CTAs: "Open Account", "Start Saving", "Apply Now", "Get Approved", "Transfer Money"');
    guidance.push('- AVOID: Generic "Learn More" - use specific financial actions');
    guidance.push('- SECURITY FOCUS: "Secure Transfer", "Protected Banking", "Safe Payments"');
  } else if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    guidance.push('- FOOD CTAs: "Order Now", "Book Table", "Try Today", "Taste Fresh", "Delivery Available"');
    guidance.push('- APPETITE APPEAL: "Satisfy Cravings", "Fresh Daily", "Order Fresh"');
    guidance.push('- CONVENIENCE: "Quick Delivery", "Easy Pickup", "Reserve Now"');
  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    guidance.push('- RETAIL CTAs: "Shop Now", "Buy Today", "Get Yours", "Limited Stock", "Free Shipping"');
    guidance.push('- PRODUCT FOCUS: "View Collection", "Try On", "Compare Prices"');
    guidance.push('- DEALS: "Save Now", "Special Offer", "Limited Time"');
  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    guidance.push('- HEALTHCARE CTAs: "Book Appointment", "Get Care", "Schedule Now", "Consult Doctor", "Health Check"');
    guidance.push('- CARE FOCUS: "Get Better", "Feel Better", "Improve Health"');
    guidance.push('- ACCESSIBILITY: "Same Day", "Walk-in Welcome", "24/7 Care"');
  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    guidance.push('- FITNESS CTAs: "Start Training", "Join Gym", "Get Fit", "Build Strength", "Transform Body"');
    guidance.push('- MOTIVATION: "Start Today", "Change Life", "Get Strong"');
    guidance.push('- TRIAL: "Free Trial", "First Class Free", "Try Workout"');
  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    guidance.push('- BEAUTY CTAs: "Book Session", "Look Amazing", "Get Pampered", "Transform Look", "Feel Beautiful"');
    guidance.push('- TRANSFORMATION: "New Look", "Glow Up", "Style Refresh"');
    guidance.push('- EXPERIENCE: "Relax Today", "Treat Yourself", "Feel Special"');
  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    guidance.push('- EDUCATION CTAs: "Enroll Now", "Start Learning", "Join Course", "Advance Career", "Gain Skills"');
    guidance.push('- GROWTH FOCUS: "Level Up", "Master Skills", "Achieve Goals"');
    guidance.push('- OPPORTUNITY: "Apply Today", "Secure Spot", "Limited Seats"');
  } else if (businessLower.includes('legal') || businessLower.includes('law')) {
    guidance.push('- LEGAL CTAs: "Get Consultation", "Protect Rights", "Legal Help", "Free Advice", "Resolve Issue"');
    guidance.push('- PROTECTION: "Secure Future", "Get Justice", "Defend Rights"');
    guidance.push('- URGENCY: "Act Now", "Time Sensitive", "Don\'t Wait"');
  } else if (businessLower.includes('automotive') || businessLower.includes('car')) {
    guidance.push('- AUTOMOTIVE CTAs: "Test Drive", "Get Quote", "Service Now", "Buy Today", "Trade In"');
    guidance.push('- VEHICLE FOCUS: "Drive Away", "Own Today", "Upgrade Now"');
    guidance.push('- SERVICE: "Book Service", "Fix Today", "Maintain Car"');
  } else if (businessLower.includes('real estate') || businessLower.includes('property')) {
    guidance.push('- REAL ESTATE CTAs: "View Property", "Schedule Tour", "Make Offer", "Find Home", "Invest Now"');
    guidance.push('- PROPERTY FOCUS: "Own Home", "Perfect Location", "Dream Property"');
    guidance.push('- OPPORTUNITY: "Act Fast", "Prime Location", "Great Deal"');
  }

  // Featured service specific CTAs
  if (concept?.featuredServices && concept.featuredServices.length > 0) {
    const service = concept.featuredServices[0];
    guidance.push(`- TODAY'S SERVICE: Create CTA specifically for "${service.serviceName}"`);
    guidance.push(`- SERVICE ACTION: Use action words that relate to "${service.serviceName}"`);
  }

  // Location-specific CTA elements
  const location = brandProfile?.location || '';
  if (location) {
    guidance.push(`- LOCAL APPEAL: Consider location-appropriate language for ${location}`);
    guidance.push('- CULTURAL CONTEXT: Use locally appropriate action phrases when relevant');
  }

  return guidance.join('\n');
}

/**
 * Generate business-specific CTA variations with enhanced service-based intelligence
 */
function generateBusinessSpecificCTAs(businessType: string, brandProfile?: any): string[] {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // First, try to generate service-specific CTAs from brand profile
  const serviceBasedCTAs = generateServiceSpecificCTAs(brandProfile);
  if (serviceBasedCTAs.length > 0) {
    return serviceBasedCTAs;
  }

  // Base CTAs that work for most businesses
  let ctas = ['Get Started', 'Contact Us', 'Learn More'];

  // Enhanced business-type-specific CTAs with more variations
  if (businessLower.includes('bank') || businessLower.includes('finance') || businessLower.includes('fintech')) {
    ctas = [
      'Open Account',
      'Start Saving',
      'Apply Now',
      'Get Approved',
      'Transfer Money',
      'Secure Banking',
      'Join Today',
      'Send Money',
      'Pay Bills',
      'Invest Now'
    ];
  } else if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    ctas = [
      'Order Now',
      'Book Table',
      'Try Today',
      'Taste Fresh',
      'Call Now',
      'Reserve Now',
      'Delivery Available',
      'Menu Online',
      'Order Ahead',
      'Dine In'
    ];
  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    ctas = [
      'Shop Now',
      'Buy Today',
      'Get Yours',
      'View Collection',
      'Save Now',
      'Limited Time',
      'Free Shipping',
      'Browse Catalog',
      'Compare Prices',
      'Add to Cart'
    ];
  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    ctas = [
      'Book Appointment',
      'Get Care',
      'Schedule Now',
      'Consult Doctor',
      'Health Check',
      'Feel Better',
      'Same Day',
      'Emergency Care',
      'Online Booking',
      'Call Doctor'
    ];
  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    ctas = [
      'Start Training',
      'Join Gym',
      'Get Fit',
      'Free Trial',
      'Transform Body',
      'Start Today',
      'First Class Free',
      'Build Muscle',
      'Lose Weight',
      'Get Strong'
    ];
  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    ctas = [
      'Book Session',
      'Look Amazing',
      'Get Pampered',
      'New Look',
      'Feel Beautiful',
      'Treat Yourself',
      'Transform Look',
      'Book Appointment',
      'Style Hair',
      'Glow Up'
    ];
  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    ctas = [
      'Enroll Now',
      'Start Learning',
      'Join Course',
      'Apply Today',
      'Gain Skills',
      'Level Up',
      'Secure Spot',
      'Register Now',
      'Study Online',
      'Get Certified'
    ];
  } else if (businessLower.includes('legal') || businessLower.includes('law')) {
    ctas = [
      'Get Consultation',
      'Free Advice',
      'Protect Rights',
      'Legal Help',
      'Act Now',
      'Resolve Issue',
      'Get Justice',
      'Call Lawyer',
      'Free Review',
      'Legal Support'
    ];
  } else if (businessLower.includes('automotive') || businessLower.includes('car')) {
    ctas = [
      'Test Drive',
      'Get Quote',
      'Service Now',
      'Buy Today',
      'Trade In',
      'Drive Away',
      'Book Service',
      'Schedule Repair',
      'View Inventory',
      'Finance Options'
    ];
  } else if (businessLower.includes('real estate') || businessLower.includes('property')) {
    ctas = [
      'View Property',
      'Schedule Tour',
      'Find Home',
      'Make Offer',
      'Invest Now',
      'Own Home',
      'Act Fast',
      'Property Search',
      'Market Analysis',
      'List Property'
    ];
  } else if (businessLower.includes('consulting') || businessLower.includes('professional')) {
    ctas = [
      'Get Consultation',
      'Book Meeting',
      'Start Project',
      'Free Analysis',
      'Solve Problem',
      'Expert Help',
      'Schedule Call',
      'Strategy Session',
      'Business Review',
      'Growth Plan'
    ];
  } else if (businessLower.includes('technology') || businessLower.includes('tech') || businessLower.includes('software')) {
    ctas = [
      'Try Free',
      'Start Trial',
      'Get Demo',
      'Sign Up',
      'Download Now',
      'Go Digital',
      'Upgrade Now',
      'Free Version',
      'Test Drive',
      'See Features'
    ];
  } else if (businessLower.includes('insurance')) {
    ctas = [
      'Get Quote',
      'Compare Rates',
      'Save Money',
      'Get Protected',
      'Free Quote',
      'Coverage Now',
      'Secure Future',
      'Lower Rates',
      'Get Covered',
      'Peace of Mind'
    ];
  }

  // Add location-specific CTAs if location is available
  const locationCTAs = generateLocationSpecificCTAs(brandProfile?.location);
  if (locationCTAs.length > 0) {
    ctas = [...ctas, ...locationCTAs];
  }

  // Add generic fallbacks if list is too short
  if (ctas.length < 7) {
    ctas.push('Try Today', 'Book Now', 'Call Now', 'Visit Us', 'Join Now', 'Start Free', 'Get Info');
  }

  // Remove duplicates and return top 10
  return [...new Set(ctas)].slice(0, 10);
}

/**
 * Generate CTAs based on specific services from brand profile
 */
function generateServiceSpecificCTAs(brandProfile?: any): string[] {
  if (!brandProfile?.services) return [];

  const services = Array.isArray(brandProfile.services)
    ? brandProfile.services
    : brandProfile.services.split(',').map((s: string) => s.trim());

  const ctas: string[] = [];

  services.forEach((service: string) => {
    const serviceLower = service.toLowerCase();

    // Generate action-oriented CTAs based on service keywords
    if (serviceLower.includes('delivery') || serviceLower.includes('shipping')) {
      ctas.push('Order Now', 'Fast Delivery', 'Ship Today');
    } else if (serviceLower.includes('consultation') || serviceLower.includes('advice')) {
      ctas.push('Get Advice', 'Book Consultation', 'Expert Help');
    } else if (serviceLower.includes('repair') || serviceLower.includes('fix')) {
      ctas.push('Fix Now', 'Book Repair', 'Service Today');
    } else if (serviceLower.includes('design') || serviceLower.includes('creative')) {
      ctas.push('See Designs', 'Create Now', 'Design Today');
    } else if (serviceLower.includes('training') || serviceLower.includes('course')) {
      ctas.push('Start Training', 'Join Course', 'Learn Now');
    } else if (serviceLower.includes('installation') || serviceLower.includes('setup')) {
      ctas.push('Install Now', 'Setup Today', 'Get Installed');
    } else if (serviceLower.includes('maintenance') || serviceLower.includes('support')) {
      ctas.push('Get Support', 'Maintain Now', 'Service Plan');
    } else if (serviceLower.includes('cleaning') || serviceLower.includes('wash')) {
      ctas.push('Book Cleaning', 'Clean Today', 'Fresh Start');
    } else if (serviceLower.includes('photography') || serviceLower.includes('photo')) {
      ctas.push('Book Session', 'Capture Moments', 'Photo Shoot');
    } else if (serviceLower.includes('catering') || serviceLower.includes('event')) {
      ctas.push('Book Event', 'Plan Party', 'Cater Now');
    }
  });

  // Remove duplicates and return unique CTAs
  return [...new Set(ctas)];
}

/**
 * Generate location-specific CTAs
 */
function generateLocationSpecificCTAs(location?: string): string[] {
  if (!location) return [];

  const ctas: string[] = [];
  const locationLower = location.toLowerCase();

  // Add location-appropriate CTAs
  if (locationLower.includes('online') || locationLower.includes('digital')) {
    ctas.push('Go Online', 'Digital Service', 'Remote Help');
  } else {
    ctas.push('Visit Us', 'Come In', 'Stop By', 'Local Service');
  }

  return ctas;
}

/**
 * Enhanced business-type-aware template selection system
 */
function selectOptimalDesignTemplate(businessType: string, brandProfile: any, platform: string): any {
  const businessLower = String(businessType || 'general business').toLowerCase();
  const location = brandProfile?.location || '';
  const brandVoice = brandProfile?.brandVoice || brandProfile?.writingTone || '';

  // Define business-type-specific template preferences
  const templatePreferences: Record<string, any> = {
    'restaurant': {
      preferredStyles: ['Photo-Driven Modern', 'Lifestyle Aspirational', 'Bold Vibrant'],
      visualFocus: 'food-photography',
      colorScheme: 'warm-appetizing',
      layoutStyle: 'image-dominant',
      designPriority: 'visual-appeal'
    },
    'healthcare': {
      preferredStyles: ['Modern Minimalist', 'Luxury Premium', 'Tech Modern'],
      visualFocus: 'trust-building',
      colorScheme: 'professional-calming',
      layoutStyle: 'clean-structured',
      designPriority: 'credibility'
    },
    'fitness': {
      preferredStyles: ['Bold Vibrant', 'Lifestyle Aspirational', 'Photo-Driven Modern'],
      visualFocus: 'energy-motivation',
      colorScheme: 'energetic-bold',
      layoutStyle: 'dynamic-action',
      designPriority: 'motivation'
    },
    'retail': {
      preferredStyles: ['Photo-Driven Modern', 'Creative Artistic', 'Bold Vibrant'],
      visualFocus: 'product-showcase',
      colorScheme: 'brand-aligned',
      layoutStyle: 'product-focused',
      designPriority: 'conversion'
    },
    'finance': {
      preferredStyles: ['Modern Minimalist', 'Luxury Premium', 'Tech Modern'],
      visualFocus: 'trust-security',
      colorScheme: 'professional-trustworthy',
      layoutStyle: 'clean-authoritative',
      designPriority: 'trust-building'
    },
    'beauty': {
      preferredStyles: ['Luxury Premium', 'Creative Artistic', 'Lifestyle Aspirational'],
      visualFocus: 'transformation-elegance',
      colorScheme: 'elegant-sophisticated',
      layoutStyle: 'aesthetic-focused',
      designPriority: 'aspiration'
    },
    'education': {
      preferredStyles: ['Modern Minimalist', 'Tech Modern', 'Creative Artistic'],
      visualFocus: 'knowledge-growth',
      colorScheme: 'inspiring-professional',
      layoutStyle: 'information-clear',
      designPriority: 'clarity'
    },
    'legal': {
      preferredStyles: ['Luxury Premium', 'Modern Minimalist', 'Tech Modern'],
      visualFocus: 'authority-trust',
      colorScheme: 'professional-authoritative',
      layoutStyle: 'structured-formal',
      designPriority: 'credibility'
    },
    'automotive': {
      preferredStyles: ['Tech Modern', 'Bold Vibrant', 'Photo-Driven Modern'],
      visualFocus: 'performance-reliability',
      colorScheme: 'bold-technical',
      layoutStyle: 'feature-focused',
      designPriority: 'performance'
    },
    'technology': {
      preferredStyles: ['Tech Modern', 'Modern Minimalist', 'Creative Artistic'],
      visualFocus: 'innovation-future',
      colorScheme: 'modern-digital',
      layoutStyle: 'interface-inspired',
      designPriority: 'innovation'
    }
  };

  // Find best matching business type
  let selectedPreference = templatePreferences['default'] || {
    preferredStyles: ['Modern Minimalist', 'Photo-Driven Modern', 'Creative Artistic'],
    visualFocus: 'professional-quality',
    colorScheme: 'brand-appropriate',
    layoutStyle: 'balanced-modern',
    designPriority: 'engagement'
  };

  for (const [type, preference] of Object.entries(templatePreferences)) {
    if (businessLower.includes(type)) {
      selectedPreference = preference;
      break;
    }
  }

  // Platform-specific adjustments
  if (platform === 'instagram') {
    selectedPreference.layoutStyle = 'square-optimized';
    selectedPreference.visualFocus += '-instagram-native';
  } else if (platform === 'linkedin') {
    selectedPreference.preferredStyles = ['Modern Minimalist', 'Luxury Premium', 'Tech Modern'];
    selectedPreference.designPriority = 'professional-credibility';
  }

  // Brand voice adjustments
  if (brandVoice.toLowerCase().includes('luxury') || brandVoice.toLowerCase().includes('premium')) {
    selectedPreference.preferredStyles = ['Luxury Premium', 'Modern Minimalist', 'Creative Artistic'];
  } else if (brandVoice.toLowerCase().includes('fun') || brandVoice.toLowerCase().includes('energetic')) {
    selectedPreference.preferredStyles = ['Bold Vibrant', 'Creative Artistic', 'Lifestyle Aspirational'];
  }

  return selectedPreference;
}

/**
 * Enhanced brand color extraction with intelligent processing
 */
function extractEnhancedBrandColors(brandProfile: any, shouldFollowBrandColors: boolean): any {
  // Extract colors from multiple possible sources
  const extractedColors = {
    primary: brandProfile.primaryColor || brandProfile.brandColors?.primary || brandProfile.colors?.primary,
    accent: brandProfile.accentColor || brandProfile.brandColors?.secondary || brandProfile.brandColors?.accent || brandProfile.colors?.accent,
    background: brandProfile.backgroundColor || brandProfile.brandColors?.background || brandProfile.colors?.background
  };

  // Default colors for fallback
  const defaultColors = {
    primary: '#3B82F6',
    accent: '#1E40AF',
    background: '#FFFFFF'
  };

  // Business-type-specific color optimization
  const businessType = brandProfile.businessType || '';
  const businessOptimizedColors = getBusinessTypeOptimizedColors(businessType, extractedColors);

  let finalColors;
  if (shouldFollowBrandColors && extractedColors.primary) {
    // Use brand colors with business-type optimization
    finalColors = {
      primary: extractedColors.primary,
      accent: extractedColors.accent || businessOptimizedColors.accent || defaultColors.accent,
      background: extractedColors.background || businessOptimizedColors.background || defaultColors.background
    };
  } else if (shouldFollowBrandColors && businessOptimizedColors.primary) {
    // Use business-optimized colors when brand colors are incomplete
    finalColors = businessOptimizedColors;
  } else {
    // Use default colors
    finalColors = defaultColors;
  }

  // Color harmony analysis
  const colorHarmony = analyzeColorHarmony(finalColors.primary, finalColors.accent, finalColors.background);

  return {
    primary: finalColors.primary,
    accent: finalColors.accent,
    background: finalColors.background,
    hasValidColors: !!(extractedColors.primary && extractedColors.accent && extractedColors.background),
    usingBrandColors: shouldFollowBrandColors && !!extractedColors.primary,
    colorHarmony: colorHarmony,
    businessTypeOptimized: !!businessOptimizedColors.primary
  };
}

/**
 * Get business-type-optimized colors
 */
function getBusinessTypeOptimizedColors(businessType: string, extractedColors: any): any {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Business-type-specific color recommendations
  const businessColorMappings: Record<string, any> = {
    'restaurant': {
      primary: extractedColors.primary || '#FF6B35', // Warm orange
      accent: extractedColors.accent || '#D73502',    // Deep red
      background: extractedColors.background || '#FFF8F5' // Warm white
    },
    'healthcare': {
      primary: extractedColors.primary || '#0EA5E9', // Medical blue
      accent: extractedColors.accent || '#10B981',    // Healing green
      background: extractedColors.background || '#F8FAFC' // Clean white
    },
    'fitness': {
      primary: extractedColors.primary || '#EF4444', // Energy red
      accent: extractedColors.accent || '#F97316',    // Orange energy
      background: extractedColors.background || '#FEF2F2' // Light red
    },
    'finance': {
      primary: extractedColors.primary || '#1E40AF', // Trust blue
      accent: extractedColors.accent || '#059669',    // Success green
      background: extractedColors.background || '#F8FAFC' // Professional white
    },
    'beauty': {
      primary: extractedColors.primary || '#EC4899', // Beauty pink
      accent: extractedColors.accent || '#A855F7',    // Luxury purple
      background: extractedColors.background || '#FDF2F8' // Soft pink
    },
    'education': {
      primary: extractedColors.primary || '#3B82F6', // Knowledge blue
      accent: extractedColors.accent || '#10B981',    // Growth green
      background: extractedColors.background || '#F0F9FF' // Light blue
    },
    'legal': {
      primary: extractedColors.primary || '#1F2937', // Authority dark
      accent: extractedColors.accent || '#B91C1C',    // Power red
      background: extractedColors.background || '#F9FAFB' // Professional gray
    },
    'technology': {
      primary: extractedColors.primary || '#6366F1', // Tech purple
      accent: extractedColors.accent || '#06B6D4',    // Cyan tech
      background: extractedColors.background || '#F8FAFC' // Clean tech
    }
  };

  // Find matching business type
  for (const [type, colors] of Object.entries(businessColorMappings)) {
    if (businessLower.includes(type)) {
      return colors;
    }
  }

  return {}; // No specific optimization found
}

/**
 * Analyze color harmony and provide recommendations
 */
function analyzeColorHarmony(primary: string, accent: string, background: string): string {
  // Simple color harmony analysis based on color theory
  const primaryHue = getColorHue(primary);
  const accentHue = getColorHue(accent);

  const hueDifference = Math.abs(primaryHue - accentHue);

  if (hueDifference < 30) {
    return 'monochromatic'; // Similar hues
  } else if (hueDifference >= 150 && hueDifference <= 210) {
    return 'complementary'; // Opposite hues
  } else if (hueDifference >= 90 && hueDifference <= 150) {
    return 'triadic'; // 120-degree separation
  } else {
    return 'analogous'; // Adjacent hues
  }
}

/**
 * Extract hue from hex color (simplified)
 */
function getColorHue(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
  }

  return Math.round(hue * 60);
}

/**
 * Enhanced design examples processing for brand consistency
 */
function processDesignExamplesForBrandConsistency(brandProfile: any, businessType: string, platform: string): string {
  const designExamples = brandProfile.designExamples || [];

  if (!designExamples || designExamples.length === 0) {
    return generateDefaultDesignGuidance(businessType, platform);
  }

  // Analyze design examples for key patterns
  const designAnalysis = analyzeDesignExamplesPatterns(designExamples, businessType);

  let guidance = `🎨 BRAND DESIGN CONSISTENCY (Based on ${designExamples.length} Design Examples):

**Visual Style Analysis:**
- Design Pattern: ${designAnalysis.dominantStyle}
- Color Approach: ${designAnalysis.colorPattern}
- Layout Preference: ${designAnalysis.layoutStyle}
- Typography Style: ${designAnalysis.typographyPattern}
- Brand Element Usage: ${designAnalysis.brandElementPattern}

**MANDATORY CONSISTENCY REQUIREMENTS:**
1. VISUAL STYLE: Match the ${designAnalysis.dominantStyle} aesthetic from provided examples
2. COLOR HARMONY: Follow the ${designAnalysis.colorPattern} color approach consistently
3. LAYOUT STRUCTURE: Use ${designAnalysis.layoutStyle} layout patterns from examples
4. TYPOGRAPHY: Apply ${designAnalysis.typographyPattern} typography style
5. BRAND ELEMENTS: Integrate brand elements using ${designAnalysis.brandElementPattern} approach

**DESIGN EXAMPLES INTEGRATION:**
- STYLE REFERENCE: Use provided design examples as visual style guide
- CONSISTENCY PRIORITY: Maintain visual consistency with existing brand designs
- ADAPTATION: Adapt example styles to current content while preserving brand identity
- QUALITY MATCH: Match the professional quality and aesthetic of provided examples`;

  // Add business-type-specific design consistency guidance
  const businessLower = String(businessType || 'general business').toLowerCase();

  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    guidance += `
- FOOD PRESENTATION: Match food photography style and presentation from examples
- MENU CONSISTENCY: Align with menu design patterns and food styling approach
- ATMOSPHERE: Maintain restaurant ambiance and dining experience consistency`;

  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    guidance += `
- MEDICAL PROFESSIONALISM: Maintain clinical and professional design standards
- TRUST ELEMENTS: Preserve trust-building visual elements from examples
- PATIENT COMFORT: Keep calming and reassuring design characteristics`;

  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    guidance += `
- ENERGY CONSISTENCY: Maintain motivational and energetic design approach
- FITNESS IMAGERY: Match exercise and fitness photography style
- MOTIVATION ELEMENTS: Preserve inspiring and action-oriented design elements`;

  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    guidance += `
- PRODUCT SHOWCASE: Match product presentation and photography style
- SHOPPING EXPERIENCE: Maintain retail-focused design and layout approach
- BRAND RECOGNITION: Preserve consistent product and brand presentation`;

  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    guidance += `
- BEAUTY AESTHETICS: Match elegant and sophisticated design approach
- TRANSFORMATION FOCUS: Maintain before/after and beauty enhancement style
- LUXURY ELEMENTS: Preserve premium and aspirational design characteristics`;
  }

  // Add platform-specific consistency guidance
  if (platform.toLowerCase() === 'instagram') {
    guidance += `
- INSTAGRAM CONSISTENCY: Maintain cohesive Instagram feed aesthetic
- STORY COMPATIBILITY: Ensure designs work well in both feed and stories
- MOBILE OPTIMIZATION: Preserve mobile-first design approach from examples`;
  } else if (platform.toLowerCase() === 'linkedin') {
    guidance += `
- PROFESSIONAL CONSISTENCY: Maintain business-appropriate design standards
- CORPORATE ALIGNMENT: Preserve professional and authoritative design approach
- B2B FOCUS: Keep business-to-business communication style consistent`;
  }

  return guidance;
}

/**
 * Analyze design examples to extract key patterns
 */
function analyzeDesignExamplesPatterns(designExamples: string[], businessType: string): any {
  // Since we can't actually analyze images in this context, we'll provide intelligent defaults
  // based on business type and common design patterns

  const businessLower = String(businessType || 'general business').toLowerCase();

  // Business-type-specific design pattern analysis
  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    return {
      dominantStyle: 'warm and appetizing with food-focused imagery',
      colorPattern: 'warm color palette with appetite-stimulating tones',
      layoutStyle: 'food-centric with prominent product imagery',
      typographyPattern: 'friendly and inviting typography',
      brandElementPattern: 'integrated with food presentation'
    };
  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    return {
      dominantStyle: 'clean, professional, and trustworthy',
      colorPattern: 'calming blues and greens with professional neutrals',
      layoutStyle: 'structured and organized with clear information hierarchy',
      typographyPattern: 'clean and readable professional fonts',
      brandElementPattern: 'authoritative and trust-building placement'
    };
  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    return {
      dominantStyle: 'energetic and motivational with dynamic imagery',
      colorPattern: 'bold and energetic colors that inspire action',
      layoutStyle: 'dynamic with action-oriented visual flow',
      typographyPattern: 'bold and strong typography that motivates',
      brandElementPattern: 'integrated with fitness and energy themes'
    };
  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    return {
      dominantStyle: 'elegant and sophisticated with luxury appeal',
      colorPattern: 'sophisticated color palette with premium feel',
      layoutStyle: 'aesthetic-focused with beauty and transformation emphasis',
      typographyPattern: 'elegant and refined typography',
      brandElementPattern: 'luxurious and aspirational integration'
    };
  } else if (businessLower.includes('finance') || businessLower.includes('fintech')) {
    return {
      dominantStyle: 'professional and trustworthy with modern tech appeal',
      colorPattern: 'trustworthy blues and greens with professional accents',
      layoutStyle: 'clean and organized with clear value propositions',
      typographyPattern: 'modern and professional typography',
      brandElementPattern: 'authoritative and security-focused placement'
    };
  } else {
    // Default professional pattern
    return {
      dominantStyle: 'modern and professional with business focus',
      colorPattern: 'professional color palette with brand consistency',
      layoutStyle: 'balanced and organized with clear messaging',
      typographyPattern: 'professional and readable typography',
      brandElementPattern: 'consistent and professional brand integration'
    };
  }
}

/**
 * Generate default design guidance when no examples are available
 */
function generateDefaultDesignGuidance(businessType: string, platform: string): string {
  const businessLower = String(businessType || 'general business').toLowerCase();

  let guidance = `🎨 DEFAULT DESIGN GUIDANCE (No Design Examples Available):

**BUSINESS-TYPE-SPECIFIC DESIGN APPROACH:**`;

  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    guidance += `
- FOOD-FIRST DESIGN: Prioritize appetizing food imagery and warm, inviting colors
- HOSPITALITY FEEL: Create welcoming and community-focused design atmosphere
- APPETITE APPEAL: Use colors and imagery that stimulate appetite and dining desire`;

  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    guidance += `
- TRUST-BUILDING DESIGN: Use clean, professional aesthetics that inspire confidence
- CALMING APPROACH: Apply soothing colors and organized layouts for patient comfort
- CREDIBILITY FOCUS: Emphasize professional competence and medical authority`;

  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    guidance += `
- ENERGY-DRIVEN DESIGN: Use bold, motivational colors and dynamic imagery
- ACTION-ORIENTED: Create designs that inspire movement and fitness goals
- STRENGTH EMPHASIS: Apply strong typography and powerful visual elements`;

  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    guidance += `
- ELEGANCE-FOCUSED DESIGN: Use sophisticated colors and refined aesthetics
- TRANSFORMATION THEME: Emphasize beauty enhancement and personal improvement
- LUXURY APPEAL: Apply premium design elements that suggest high-quality service`;

  } else {
    guidance += `
- PROFESSIONAL DESIGN: Use clean, modern aesthetics appropriate for business context
- BRAND-FOCUSED: Emphasize brand identity and professional competence
- AUDIENCE-APPROPRIATE: Design for target audience expectations and preferences`;
  }

  guidance += `

**PLATFORM OPTIMIZATION:**`;

  if (platform.toLowerCase() === 'instagram') {
    guidance += `
- INSTAGRAM NATIVE: Design for mobile-first, square format optimization
- VISUAL IMPACT: Create thumb-stopping designs that stand out in feed
- STORY READY: Ensure designs work well in both feed and stories format`;
  } else if (platform.toLowerCase() === 'linkedin') {
    guidance += `
- PROFESSIONAL STANDARD: Maintain business-appropriate design aesthetics
- B2B FOCUS: Design for professional audience and business context
- AUTHORITY BUILDING: Use design elements that establish professional credibility`;
  }

  return guidance;
}

/**
 * Generate enhanced color scheme instructions
 */
function generateEnhancedColorSchemeInstructions(brandColorData: any, businessType: string): string {
  const { primary, accent, background, colorHarmony, businessTypeOptimized } = brandColorData;

  let instructions = `Primary: ${primary} (60% dominant), Accent: ${accent} (30% secondary), Background: ${background} (10% highlights)`;

  // Add color harmony guidance
  if (colorHarmony === 'complementary') {
    instructions += ` - COMPLEMENTARY HARMONY: High contrast, vibrant combination`;
  } else if (colorHarmony === 'analogous') {
    instructions += ` - ANALOGOUS HARMONY: Smooth, harmonious blend`;
  } else if (colorHarmony === 'monochromatic') {
    instructions += ` - MONOCHROMATIC HARMONY: Unified, sophisticated palette`;
  } else if (colorHarmony === 'triadic') {
    instructions += ` - TRIADIC HARMONY: Balanced, dynamic color relationship`;
  }

  // Add business-type-specific color psychology
  const businessLower = String(businessType || 'general business').toLowerCase();
  if (businessLower.includes('restaurant')) {
    instructions += ` - APPETITE STIMULATION: Warm colors to enhance food appeal`;
  } else if (businessLower.includes('healthcare')) {
    instructions += ` - TRUST & CALM: Professional colors that inspire confidence`;
  } else if (businessLower.includes('fitness')) {
    instructions += ` - ENERGY & MOTIVATION: Bold colors that inspire action`;
  } else if (businessLower.includes('finance')) {
    instructions += ` - STABILITY & TRUST: Conservative colors that suggest reliability`;
  } else if (businessLower.includes('beauty')) {
    instructions += ` - ELEGANCE & ASPIRATION: Sophisticated colors that inspire transformation`;
  }

  if (businessTypeOptimized) {
    instructions += ` - INDUSTRY OPTIMIZED: Colors selected for maximum ${businessType} industry impact`;
  }

  return instructions;
}

/**
 * Generate business-type-specific design template guidance
 */
function generateBusinessTypeDesignGuidance(businessType: string, brandProfile: any, platform: string): string {
  const templateSelection = selectOptimalDesignTemplate(businessType, brandProfile, platform);
  const businessName = brandProfile?.businessName || 'the business';

  let guidance = `🎨 BUSINESS-TYPE-AWARE TEMPLATE SELECTION:
**Selected Template Style:** ${templateSelection.preferredStyles[0]}
**Alternative Styles:** ${templateSelection.preferredStyles.slice(1).join(', ')}
**Visual Focus:** ${templateSelection.visualFocus}
**Color Scheme:** ${templateSelection.colorScheme}
**Layout Style:** ${templateSelection.layoutStyle}
**Design Priority:** ${templateSelection.designPriority}

🏢 BUSINESS-SPECIFIC DESIGN REQUIREMENTS:`;

  const businessLower = String(businessType || 'general business').toLowerCase();

  // Add business-type-specific design requirements
  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    guidance += `
- FOOD PHOTOGRAPHY: High-quality, appetizing food images as primary visual elements
- WARM COLORS: Use warm, inviting colors that stimulate appetite (reds, oranges, warm yellows)
- LIFESTYLE CONTEXT: Show people enjoying food, dining experiences, social moments
- TEXTURE FOCUS: Emphasize food textures, freshness, and visual appeal
- ATMOSPHERE: Create warm, welcoming, community-focused design atmosphere`;

  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    guidance += `
- TRUST BUILDING: Clean, professional design that builds confidence and trust
- CALMING COLORS: Use calming blues, greens, and neutral tones for comfort
- PEOPLE FOCUS: Show caring interactions, professional staff, patient satisfaction
- CLEAN AESTHETICS: Minimize clutter, use plenty of white space, ensure readability
- CREDIBILITY: Professional imagery that conveys expertise and reliability`;

  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    guidance += `
- ENERGY & MOTIVATION: Dynamic, high-energy design that inspires action
- BOLD COLORS: Use energetic colors (bright blues, oranges, reds) that motivate
- ACTION SHOTS: Show people exercising, achieving goals, transformation results
- STRENGTH IMAGERY: Emphasize strength, progress, achievement, and transformation
- MOTIVATIONAL TONE: Design should inspire and energize viewers to take action`;

  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    guidance += `
- PRODUCT SHOWCASE: Make products the hero of the design with clear visibility
- BRAND COLORS: Use brand colors consistently to reinforce brand recognition
- LIFESTYLE CONTEXT: Show products in use, lifestyle integration, customer satisfaction
- CONVERSION FOCUS: Design should drive purchase decisions and shopping behavior
- QUALITY EMPHASIS: Highlight product quality, craftsmanship, and value proposition`;

  } else if (businessLower.includes('finance') || businessLower.includes('fintech')) {
    guidance += `
- TRUST & SECURITY: Professional design that conveys security and reliability
- PROFESSIONAL COLORS: Use trustworthy colors (blues, grays, subtle greens)
- CLEAN LAYOUTS: Structured, organized design that suggests financial competence
- PEOPLE FOCUS: Show satisfied customers, financial success, peace of mind
- AUTHORITY: Design should convey expertise and financial leadership

🚨 FINTECH DESIGN OVERRIDE (ABSOLUTELY CRITICAL):
- ZERO TECH AESTHETIC: Despite being fintech, use CLEAN, SIMPLE designs
- NO CIRCULAR PATTERNS: No concentric circles, segmented circles, or circular tech overlays
- NO CIRCUIT PATTERNS: No circuit board lines, connection nodes, or tech visualizations
- NO FUTURISTIC ELEMENTS: No holographic displays, floating UI, or digital overlays
- SOLID BACKGROUNDS ONLY: White or brand colors - NO patterns, NO lines, NO circles
- HUMAN-FOCUSED: Show people using services naturally, not tech visualizations
- TRUST THROUGH SIMPLICITY: Clean, minimal design builds more trust than tech patterns`;

  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    guidance += `
- TRANSFORMATION: Show before/after, beauty enhancement, personal transformation
- ELEGANT COLORS: Use sophisticated, elegant color palettes (soft pinks, golds, neutrals)
- LIFESTYLE ASPIRATION: Create aspirational imagery that customers want to achieve
- QUALITY FOCUS: Emphasize luxury, pampering, self-care, and personal investment
- AESTHETIC APPEAL: Design itself should be beautiful and visually inspiring`;

  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    guidance += `
- GROWTH & LEARNING: Show progress, achievement, knowledge acquisition, success
- INSPIRING COLORS: Use colors that inspire learning (blues, greens, warm oranges)
- PEOPLE FOCUS: Show students succeeding, teachers caring, learning environments
- CLARITY: Clean, clear design that's easy to read and understand
- FUTURE FOCUS: Emphasize career advancement, skill development, opportunity`;

  } else if (businessLower.includes('legal') || businessLower.includes('law')) {
    guidance += `
- AUTHORITY & TRUST: Professional, authoritative design that conveys legal expertise
- PROFESSIONAL COLORS: Use traditional professional colors (navy, gray, burgundy)
- STRUCTURED LAYOUT: Organized, formal design that suggests legal competence
- PEOPLE FOCUS: Show professional interactions, successful outcomes, client satisfaction
- CREDIBILITY: Design should reinforce legal authority and professional competence`;

  } else if (businessLower.includes('automotive') || businessLower.includes('car')) {
    guidance += `
- PERFORMANCE FOCUS: Emphasize vehicle performance, reliability, and quality
- BOLD COLORS: Use strong, confident colors that suggest power and reliability
- TECHNICAL IMAGERY: Show vehicles, technical expertise, service quality
- LIFESTYLE CONTEXT: Show vehicles enhancing lifestyle, family safety, adventure
- TRUST BUILDING: Emphasize reliability, expertise, and customer satisfaction`;

  } else if (businessLower.includes('technology') || businessLower.includes('tech')) {
    guidance += `
- INNOVATION FOCUS: Modern, cutting-edge design that suggests technological advancement
- DIGITAL COLORS: Use modern digital colors (blues, teals, modern gradients)
- INTERFACE INSPIRATION: Clean, interface-inspired layouts with modern aesthetics
- FUTURE FOCUS: Emphasize innovation, efficiency, digital transformation
- CLEAN AESTHETICS: Minimalist, modern design that suggests technological sophistication`;
  }

  return guidance;
}

/**
 * Generate industry-specific design guidance for image generation
 */
function generateIndustrySpecificDesignGuidance(businessType: string, brandProfile: any): string {
  const industryIntel = getIndustryDesignIntelligence(businessType);
  const businessName = brandProfile?.businessName || 'the business';

  let guidance = `🏭 INDUSTRY-SPECIFIC DESIGN INTELLIGENCE:
**Industry:** ${industryIntel.name}
**World-Class Benchmarks:** ${industryIntel.worldClassBrands.slice(0, 3).join(', ')}
**Visual Style:** ${industryIntel.designBenchmarks.visualStyle}
**Color Palettes:** ${industryIntel.designBenchmarks.colorPalettes.slice(0, 3).join(', ')}
**Typography:** ${industryIntel.designBenchmarks.typography}
**Imagery Focus:** ${industryIntel.designBenchmarks.imagery}
**Layout Style:** ${industryIntel.designBenchmarks.layout}`;

  const businessLower = String(businessType || 'general business').toLowerCase();

  // Add business-type-specific design guidance
  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    guidance += `

🍽️ RESTAURANT DESIGN SPECIFICS:
- FOOD IMAGERY: Show appetizing food presentations, fresh ingredients, dining experiences
- ATMOSPHERE: Warm, inviting restaurant environments with natural lighting
- PEOPLE: Diners enjoying meals, chefs in action, family dining moments
- COLORS: Warm earth tones, rich food colors, appetizing palettes
- MOOD: Welcoming, satisfying, community-focused, comfort-oriented
- AVOID: Generic food stock photos, artificial food styling, cold environments`;

  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    guidance += `

🏥 HEALTHCARE DESIGN SPECIFICS:
- MEDICAL IMAGERY: Modern medical facilities, caring professionals, wellness concepts
- ATMOSPHERE: Clean, trustworthy, professional yet caring environments
- PEOPLE: Healthcare professionals, patients receiving care, wellness activities
- COLORS: Calming blues, soft greens, clean whites, trustworthy tones
- MOOD: Caring, professional, trustworthy, healing-focused
- AVOID: Sterile hospital imagery, intimidating medical equipment, cold clinical settings`;

  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    guidance += `

💪 FITNESS DESIGN SPECIFICS:
- FITNESS IMAGERY: Active people exercising, modern gym equipment, transformation results
- ATMOSPHERE: Energetic, motivational, inclusive fitness environments
- PEOPLE: Diverse people working out, trainers coaching, group fitness activities
- COLORS: Bold energetic colors, motivational reds/oranges, strong contrasts
- MOOD: Energetic, motivational, empowering, achievement-focused
- AVOID: Intimidating bodybuilder imagery, exclusive gym environments, unrealistic fitness standards`;

  } else if (businessLower.includes('finance') || businessLower.includes('bank') || businessLower.includes('fintech')) {
    guidance += `

💰 FINANCIAL DESIGN SPECIFICS:
- FINANCIAL IMAGERY: People managing money, mobile banking, business growth, financial security
- ATMOSPHERE: Trustworthy, secure, professional yet approachable environments
- PEOPLE: Diverse customers using financial services, business owners, families planning
- COLORS: Trustworthy blues, professional grays, gold accents, stable tones
- MOOD: Trustworthy, secure, empowering, growth-oriented
- AVOID: Complex trading floors, intimidating corporate imagery, generic banking clichés

🚨 FINTECH BACKGROUND RESTRICTIONS (ZERO TOLERANCE):
- ABSOLUTELY NO circular tech patterns (concentric circles, segmented circles, radar style)
- ABSOLUTELY NO circuit board patterns (lines with nodes, connection points)
- ABSOLUTELY NO tech overlays (holographic UI, floating dashboards, digital visualizations)
- ABSOLUTELY NO line patterns of any kind (diagonal, curved, straight, grid)
- ONLY SOLID BACKGROUNDS: White, brand colors, or simple 2-color gradients
- TRUST THROUGH SIMPLICITY: Clean backgrounds build more trust than tech patterns
- HUMAN-FOCUSED: Show people naturally, not surrounded by tech visualizations`;

  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    guidance += `

🛍️ RETAIL DESIGN SPECIFICS:
- RETAIL IMAGERY: Product showcases, shopping experiences, lifestyle integration, customer satisfaction
- ATMOSPHERE: Attractive, commercial, engaging, conversion-focused environments
- PEOPLE: Customers shopping, trying products, enjoying purchases, lifestyle moments
- COLORS: Brand-appropriate colors, attractive accents, commercial appeal
- MOOD: Attractive, desirable, lifestyle-focused, satisfaction-oriented
- AVOID: Generic product shots, sterile retail environments, pushy sales imagery`;

  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    guidance += `

📚 EDUCATION DESIGN SPECIFICS:
- EDUCATION IMAGERY: Learning environments, students engaged, knowledge sharing, skill development
- ATMOSPHERE: Inspiring, accessible, modern, engaging learning spaces
- PEOPLE: Students learning, teachers instructing, collaborative study, diverse learners
- COLORS: Inspiring blues, creative purples, growth greens, engaging tones
- MOOD: Inspiring, accessible, growth-focused, achievement-oriented
- AVOID: Boring classroom imagery, intimidating academic settings, outdated educational concepts`;

  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    guidance += `

💄 BEAUTY DESIGN SPECIFICS:
- BEAUTY IMAGERY: Beauty transformations, elegant spa environments, diverse beauty representation
- ATMOSPHERE: Luxurious, elegant, inclusive, confidence-building environments
- PEOPLE: Diverse models, beauty professionals, transformation moments, self-care activities
- COLORS: Elegant golds, soft pinks, luxurious purples, natural tones
- MOOD: Luxurious, confident, transformative, inclusive, empowering
- AVOID: Unrealistic beauty standards, exclusive imagery, artificial beauty concepts`;

  } else if (businessLower.includes('automotive') || businessLower.includes('car')) {
    guidance += `

🚗 AUTOMOTIVE DESIGN SPECIFICS:
- AUTOMOTIVE IMAGERY: Vehicles in motion, premium interiors, road scenes, technology features
- ATMOSPHERE: Dynamic, powerful, premium, innovation-focused environments
- PEOPLE: Drivers enjoying vehicles, families traveling, professional commuting
- COLORS: Metallic silvers, deep blacks, racing reds, premium blues
- MOOD: Dynamic, aspirational, powerful, premium, adventure-oriented
- AVOID: Generic car lot imagery, static vehicle shots, unrealistic driving scenarios`;

  } else if (businessLower.includes('legal') || businessLower.includes('law')) {
    guidance += `

⚖️ LEGAL DESIGN SPECIFICS:
- LEGAL IMAGERY: Professional consultations, legal environments, handshakes, document signing
- ATMOSPHERE: Authoritative, trustworthy, professional, sophisticated environments
- PEOPLE: Legal professionals, clients receiving advice, business meetings, consultation scenes
- COLORS: Deep navy, professional grays, gold accents, trustworthy blues
- MOOD: Authoritative, trustworthy, professional, solution-oriented
- AVOID: Intimidating courtroom imagery, complex legal documents, cold professional settings`;
  }

  guidance += `

🎯 INDUSTRY EXCELLENCE STANDARDS:
- QUALITY: Match the design sophistication of ${industryIntel.worldClassBrands.slice(0, 2).join(' and ')}
- AUTHENTICITY: Create designs that feel genuine to ${industryIntel.name} industry
- RELEVANCE: Ensure all visual elements are appropriate for ${businessName}'s business context
- DIFFERENTIATION: Stand out from generic ${businessType} imagery while maintaining industry relevance`;

  return guidance;
}

/**
 * Generate enhanced logo integration guidance
 */
function generateEnhancedLogoIntegrationGuidance(hasLogo: boolean, businessName: string, businessType: string, brandProfile: any, platform: string): string {
  const businessLower = String(businessType || 'general business').toLowerCase();
  const platformLower = platform.toLowerCase();

  if (hasLogo) {
    let logoGuidance = `
**Enhanced Logo Integration:** MANDATORY - Include ${businessName} logo prominently`;

    // Platform-specific logo placement
    if (platformLower === 'instagram') {
      logoGuidance += `
- INSTAGRAM OPTIMIZATION: Logo in top-right corner for Stories/Feed compatibility
- LOGO SIZE: 15-20% of total design area for mobile visibility
- SQUARE FORMAT: Ensure logo works well in 1:1 aspect ratio`;
    } else if (platformLower === 'linkedin') {
      logoGuidance += `
- LINKEDIN PROFESSIONAL: Logo in bottom-right for business credibility
- LOGO SIZE: 12-18% of design area for professional appearance
- CORPORATE PLACEMENT: Consistent with business document standards`;
    } else {
      logoGuidance += `
- PLATFORM OPTIMIZED: Logo placement optimized for ${platform} engagement
- LOGO SIZE: 15-20% of design area for optimal brand recognition`;
    }

    // Business-type-specific logo integration
    if (businessLower.includes('restaurant') || businessLower.includes('food')) {
      logoGuidance += `
- FOOD CONTEXT: Integrate logo naturally with food imagery
- APPETITE APPEAL: Ensure logo doesn't compete with food visuals
- BRAND APPETITE: Logo should enhance, not distract from food presentation`;
    } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
      logoGuidance += `
- TRUST BUILDING: Logo placement that reinforces medical credibility
- PROFESSIONAL STANDARD: Clean, clinical logo presentation
- PATIENT CONFIDENCE: Logo positioning that inspires trust`;
    } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
      logoGuidance += `
- ENERGY ALIGNMENT: Logo placement that complements dynamic imagery
- MOTIVATION SUPPORT: Logo should enhance, not diminish energy
- ACTION CONTEXT: Integrate logo with fitness/movement visuals`;
    } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
      logoGuidance += `
- PRODUCT HARMONY: Logo placement that doesn't compete with products
- BRAND RECOGNITION: Consistent logo positioning for shopping recall
- PURCHASE DECISION: Logo should support, not distract from products`;
    } else if (businessLower.includes('finance') || businessLower.includes('fintech')) {
      logoGuidance += `
- AUTHORITY PLACEMENT: Logo positioning that reinforces financial trust
- SECURITY EMPHASIS: Clean, professional logo presentation
- FINANCIAL CONFIDENCE: Logo should inspire monetary trust`;
    }

    // Universal logo requirements
    logoGuidance += `
- LOGO CONTRAST: Ensure logo stands out against all background colors
- LOGO QUALITY: Use high-resolution logo that maintains clarity at all sizes
- LOGO SPACING: Adequate white space around logo for visual breathing room
- LOGO CONSISTENCY: Same placement and size across all designs for brand memory
- LOGO PROTECTION: Never overlay text or other elements on top of logo`;

    return logoGuidance;

  } else {
    let nameGuidance = `
**Enhanced Brand Name Integration:** Since no logo is available, emphasize business name`;

    // Business-type-specific name styling
    if (businessLower.includes('restaurant') || businessLower.includes('food')) {
      nameGuidance += `
- RESTAURANT TYPOGRAPHY: Use warm, inviting fonts that suggest hospitality
- APPETITE TYPOGRAPHY: Font style that complements food imagery
- DINING EXPERIENCE: Typography that reflects restaurant's atmosphere`;
    } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
      nameGuidance += `
- MEDICAL TYPOGRAPHY: Clean, professional fonts that inspire trust
- HEALTH AUTHORITY: Typography that suggests medical expertise
- PATIENT COMFORT: Font style that's reassuring and professional`;
    } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
      nameGuidance += `
- FITNESS TYPOGRAPHY: Bold, energetic fonts that motivate action
- STRENGTH EMPHASIS: Typography that suggests power and energy
- MOTIVATION DESIGN: Font style that inspires fitness goals`;
    } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
      nameGuidance += `
- BEAUTY TYPOGRAPHY: Elegant, sophisticated fonts that suggest luxury
- TRANSFORMATION STYLE: Typography that implies beauty enhancement
- ELEGANCE EMPHASIS: Font style that's aspirational and refined`;
    } else if (businessLower.includes('legal') || businessLower.includes('law')) {
      nameGuidance += `
- LEGAL TYPOGRAPHY: Authoritative, traditional fonts that suggest expertise
- AUTHORITY EMPHASIS: Typography that implies legal competence
- PROFESSIONAL STANDARD: Font style that's formal and trustworthy`;
    }

    // Universal name requirements
    nameGuidance += `
- BUSINESS NAME: Include "${businessName}" prominently in design
- NAME STYLING: Use distinctive typography that becomes brand recognition element
- NAME PLACEMENT: Consistent positioning across all designs for brand memory
- NAME CONTRAST: Ensure business name is highly visible and readable
- BRAND CONSISTENCY: Use consistent typography style across all designs
- NAME HIERARCHY: Business name should be secondary to main headline but clearly visible`;

    return nameGuidance;
  }
}

/**
 * Generate enhanced brand integration guidance for all business types
 */
function generateEnhancedBrandIntegrationGuidance(brandProfile: any, businessType: string): string {
  const businessName = brandProfile?.businessName || 'the business';
  const businessLower = String(businessType || 'general business').toLowerCase();
  const logoUrl = brandProfile?.logoUrl;
  const hasLogo = logoUrl && logoUrl.trim() && !logoUrl.includes('placeholder');

  let guidance = `🏢 ENHANCED BRAND INTEGRATION (MANDATORY):
**Business Name:** ${businessName}
**Brand Identity:** Ensure all design elements reflect ${businessName}'s unique identity
**Brand Consistency:** Maintain consistent brand representation across all visual elements`;

  // Enhanced logo integration guidance
  const logoGuidance = generateEnhancedLogoIntegrationGuidance(hasLogo, businessName, businessType, brandProfile, 'instagram');
  guidance += logoGuidance;

  // Business-type-specific brand integration
  if (businessLower.includes('restaurant') || businessLower.includes('food')) {
    guidance += `
**Restaurant Brand Elements:**
- FOOD SIGNATURE: Showcase signature dishes or specialties that define ${businessName}
- AMBIANCE: Reflect restaurant's unique atmosphere and dining experience
- CUISINE STYLE: Visual elements should match cuisine type and restaurant personality
- MENU HIGHLIGHTS: Feature popular or signature menu items as brand differentiators`;

  } else if (businessLower.includes('healthcare') || businessLower.includes('medical')) {
    guidance += `
**Healthcare Brand Elements:**
- TRUST SYMBOLS: Include elements that build medical credibility and trust
- CARE PHILOSOPHY: Reflect ${businessName}'s approach to patient care
- SPECIALIZATION: Highlight medical specialties or unique healthcare services
- PROFESSIONAL CREDENTIALS: Subtly incorporate professional certifications or awards`;

  } else if (businessLower.includes('fitness') || businessLower.includes('gym')) {
    guidance += `
**Fitness Brand Elements:**
- TRAINING PHILOSOPHY: Reflect ${businessName}'s unique approach to fitness
- EQUIPMENT/FACILITIES: Showcase distinctive gym features or equipment
- COMMUNITY ASPECT: Highlight the fitness community and supportive environment
- RESULTS FOCUS: Include elements that emphasize transformation and achievement`;

  } else if (businessLower.includes('finance') || businessLower.includes('bank') || businessLower.includes('fintech')) {
    guidance += `
**Financial Brand Elements:**
- SECURITY SYMBOLS: Include trust and security indicators appropriate for financial services
- SERVICE DIFFERENTIATION: Highlight unique financial products or services
- CUSTOMER SUCCESS: Show financial growth, security, or customer satisfaction
- INNOVATION: Reflect modern financial technology and user-friendly services`;

  } else if (businessLower.includes('retail') || businessLower.includes('shop')) {
    guidance += `
**Retail Brand Elements:**
- PRODUCT SHOWCASE: Feature signature products or bestselling items
- SHOPPING EXPERIENCE: Reflect the unique shopping atmosphere of ${businessName}
- BRAND PERSONALITY: Show the lifestyle and values associated with the brand
- CUSTOMER SATISFACTION: Include elements showing happy customers and quality products`;

  } else if (businessLower.includes('education') || businessLower.includes('school')) {
    guidance += `
**Education Brand Elements:**
- LEARNING ENVIRONMENT: Showcase modern, engaging educational facilities
- SUCCESS STORIES: Include elements showing student achievement and growth
- TEACHING APPROACH: Reflect ${businessName}'s unique educational methodology
- COMMUNITY: Show collaborative learning and supportive educational community`;

  } else if (businessLower.includes('beauty') || businessLower.includes('salon')) {
    guidance += `
**Beauty Brand Elements:**
- TRANSFORMATION: Show before/after concepts or beauty enhancement
- LUXURY EXPERIENCE: Reflect the premium, pampering experience of ${businessName}
- EXPERTISE: Highlight professional skills and beauty expertise
- INCLUSIVITY: Show diverse beauty and inclusive representation`;

  } else if (businessLower.includes('automotive') || businessLower.includes('car')) {
    guidance += `
**Automotive Brand Elements:**
- VEHICLE SHOWCASE: Feature vehicles in premium, aspirational settings
- PERFORMANCE: Highlight speed, luxury, or reliability depending on brand positioning
- LIFESTYLE: Show the lifestyle and status associated with the vehicles
- TECHNOLOGY: Include modern automotive technology and innovation features`;

  } else if (businessLower.includes('legal') || businessLower.includes('law')) {
    guidance += `
**Legal Brand Elements:**
- AUTHORITY: Include elements that establish legal expertise and authority
- CLIENT SUCCESS: Show successful case outcomes or satisfied clients
- PROFESSIONALISM: Maintain sophisticated, trustworthy professional appearance
- SPECIALIZATION: Highlight specific legal expertise areas or practice focus`;
  }

  // Universal brand integration elements
  guidance += `

🎯 UNIVERSAL BRAND INTEGRATION REQUIREMENTS:
- BRAND VOICE: Ensure visual style matches ${businessName}'s personality and values
- COMPETITIVE DIFFERENTIATION: Show what makes ${businessName} unique in the market
- TARGET AUDIENCE: Design elements should appeal to ${businessName}'s specific customers
- BRAND MEMORY: Create consistent visual elements that customers will remember
- QUALITY STANDARDS: Maintain premium quality that reflects ${businessName}'s standards
- AUTHENTICITY: Ensure all brand elements feel genuine and true to ${businessName}'s identity`;

  // Brand profile specific enhancements
  if (brandProfile?.uniqueSellingPoints && brandProfile.uniqueSellingPoints.length > 0) {
    guidance += `
- UNIQUE SELLING POINTS: Visually represent: ${brandProfile.uniqueSellingPoints.slice(0, 2).join(', ')}`;
  }

  if (brandProfile?.keyFeatures && brandProfile.keyFeatures.length > 0) {
    guidance += `
- KEY FEATURES: Highlight: ${brandProfile.keyFeatures.slice(0, 2).join(', ')}`;
  }

  return guidance;
}

function rememberOutput(brandKey: string, output: { headline?: string; caption?: string; concept?: string }) {
  if (!recentOutputs.has(brandKey)) {
    recentOutputs.set(brandKey, { headlines: [], captions: [], concepts: [] });
  }

  const data = recentOutputs.get(brandKey)!;

  if (output.headline) {
    data.headlines.push(output.headline);
    if (data.headlines.length > 10) data.headlines.shift(); // Keep only last 10
  }

  if (output.caption) {
    data.captions.push(output.caption);
    if (data.captions.length > 10) data.captions.shift(); // Keep only last 10
  }

  if (output.concept) {
    data.concepts.push(output.concept);
    if (data.concepts.length > 10) data.concepts.shift(); // Keep only last 10
  }
}

function tooSimilar(text: string, recentTexts: string[], threshold: number): boolean {
  if (!text || recentTexts.length === 0) return false;

  const textWords = text.toLowerCase().split(/\s+/);

  for (const recentText of recentTexts) {
    const recentWords = recentText.toLowerCase().split(/\s+/);
    const commonWords = textWords.filter(word => recentWords.includes(word));
    const similarity = commonWords.length / Math.max(textWords.length, recentWords.length);

    if (similarity > threshold) {
      return true;
    }
  }

  return false;
}

function hasBannedPattern(text: string): boolean {
  if (!text) return false;

  const bannedPatterns = [
    /unlock\s+.*('s|s)?\s+/i,
    /.*'s\s+best\s+/i,
    /experience\s+the\s+/i,
    /discover\s+.*\s+in\s+/i,
    /transform\s+your\s+/i,
    /your\s+.*\s+solution/i,
    /journey/i,
    /everyday/i,
    /streamlined solutions/i,
    /seamless experience/i,
    /cutting-edge technology/i,
    /empowering businesses/i,
    /driving growth/i,
    /innovative solutions/i,
    /best-in-class/i,
    /world-class/i,
    /industry-leading/i,
    // GENERIC EDUCATION TERMS FOR FINTECH
    /semester/i,
    /professor/i,
    /academic/i,
    /school/i,
    /university/i,
    /college/i,
    /education/i,
    /study/i,
    /studying/i,
    /homework/i,
    /assignment/i,
    /exam/i,
    /grade/i,
    /class/i,
    /course/i,
    /tuition/i,
    /scholarship/i
  ];

  return bannedPatterns.some(pattern => pattern.test(text));
}

// Generate unique fallback content (ported from Revo 2.0)
function generateUniqueFallbackContent(brandProfile: any, businessType: string, platform: string, hashtagCount: number, creativityBoost: number, concept: any): any {
  const businessName = brandProfile.businessName || 'Business';
  const location = brandProfile.location || 'Local';

  // Generate unique variations based on creativity boost
  const headlineVariations = [
    `${businessName} Delivers`,
    `Smart ${businessType} Solutions`,
    `${location} Trusts ${businessName}`,
    `Quality ${businessType} Services`,
    `${businessName} Excellence`,
    `Professional ${businessType} Care`,
    `Reliable ${businessType} Partner`,
    `${businessName} Innovation`
  ];

  const subheadlineVariations = [
    `Experience professional ${businessType} services tailored for ${location}`,
    `Quality solutions that deliver real results for your business`,
    `Trusted by customers across ${location} for reliable service`,
    `Professional expertise meets innovative ${businessType} solutions`,
    `Your success is our priority with dedicated ${businessType} support`,
    `Comprehensive ${businessType} services designed for modern needs`,
    `Excellence in ${businessType} with personalized customer care`,
    `Leading ${businessType} provider committed to your success`
  ];

  const captionVariations = [
    `At ${businessName}, we understand the unique challenges facing ${businessType} customers in ${location}. Our dedicated team works tirelessly to provide solutions that make a real difference in your daily operations.`,
    `Quality ${businessType} services shouldn't be complicated. That's why ${businessName} focuses on delivering straightforward, effective solutions that work for businesses like yours in ${location}.`,
    `When you choose ${businessName}, you're choosing a partner committed to your success. Our ${businessType} expertise combined with local knowledge makes us the right choice for ${location} businesses.`,
    `${businessName} has been serving the ${location} community with professional ${businessType} services that businesses can rely on. Experience the difference that dedicated service makes.`,
    `Your business deserves ${businessType} solutions that actually work. ${businessName} combines industry expertise with personalized service to deliver results that matter to your bottom line.`
  ];

  const ctaVariations = generateBusinessSpecificCTAs(businessType, brandProfile);

  // Select variations based on creativity boost
  const selectedHeadline = headlineVariations[creativityBoost % headlineVariations.length];
  const selectedSubheadline = subheadlineVariations[creativityBoost % subheadlineVariations.length];
  const selectedCaption = captionVariations[creativityBoost % captionVariations.length];
  const selectedCta = ctaVariations[creativityBoost % ctaVariations.length];

  // Generate hashtags
  const baseHashtags = [
    `#${businessName.replace(/\s+/g, '')}`,
    `#${businessType.replace(/\s+/g, '')}`,
    `#${location.replace(/\s+/g, '')}`
  ];

  const additionalHashtags = ['#Quality', '#Professional', '#Trusted', '#Local', '#Service', '#Excellence'];
  const selectedHashtags = baseHashtags.concat(
    additionalHashtags.slice(0, Math.max(0, hashtagCount - baseHashtags.length))
  );

  return {
    headline: selectedHeadline,
    subheadline: selectedSubheadline,
    caption: selectedCaption,
    cta: selectedCta,
    hashtags: selectedHashtags.slice(0, hashtagCount)
  };
}

// === MISSING HELPER FUNCTIONS FROM REVO 2.0 ===

function pickNonRepeating<T>(arr: T[], last?: T): T {
  if (!arr.length) throw new Error('Empty choices');
  if (arr.length === 1) return arr[0];
  const filtered = last == null ? arr : arr.filter((x) => x !== last);
  return filtered[Math.floor(Math.random() * filtered.length)] || arr[0];
}

function getCulturalBusinessGuidance(businessType: string): string {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Enhanced business-specific guidance with more categories
  const businessGuidanceMap: Record<string, any> = {
    'financial': {
      icon: '💰',
      title: 'FINANCIAL SERVICES GUIDANCE',
      good: [
        'Show families saving for goals, mobile money transfers, small business growth',
        'People using mobile banking for everyday transactions, paying school fees',
        'Small business owners managing cash flow, market vendors using digital payments'
      ],
      avoid: [
        'Complex trading floors, stock market graphs, corporate boardrooms',
        'Western banking imagery that doesn\'t reflect local financial habits'
      ]
    },
    'technology': {
      icon: '💻',
      title: 'TECHNOLOGY SERVICES GUIDANCE',
      good: [
        'People using phones naturally, simple app interfaces, everyday tech use',
        'Small business owners using tech to grow, students learning online',
        'Community members connecting through technology, solving real problems'
      ],
      avoid: [
        'Complex coding screens, server rooms, abstract tech concepts',
        'Futuristic interfaces that feel disconnected from daily life'
      ]
    },
    'education': {
      icon: '📚',
      title: 'EDUCATION SERVICES GUIDANCE',
      good: [
        'Students in local classroom settings, community learning spaces',
        'Teachers and students interacting, practical learning scenarios',
        'Family education moments, skill development in real contexts'
      ],
      avoid: [
        'Generic classroom stock photos, overly formal academic settings',
        'Western educational imagery that doesn\'t reflect local learning culture'
      ]
    },
    'healthcare': {
      icon: '🏥',
      title: 'HEALTHCARE SERVICES GUIDANCE',
      good: [
        'Patients receiving care in clean, professional medical settings',
        'Healthcare providers showing compassion and expertise',
        'Families supporting each other through health journeys'
      ],
      avoid: [
        'Overly clinical or sterile imagery that feels impersonal',
        'Generic medical stock photos that lack authenticity'
      ]
    },
    'restaurant': {
      icon: '🍽️',
      title: 'RESTAURANT SERVICES GUIDANCE',
      good: [
        'Fresh ingredients and authentic cooking processes',
        'Families and friends enjoying meals together',
        'Local dining atmosphere that reflects community culture'
      ],
      avoid: [
        'Generic food photography that lacks personality',
        'Overly staged dining scenarios that feel artificial'
      ]
    },
    'retail': {
      icon: '🛍️',
      title: 'RETAIL SERVICES GUIDANCE',
      good: [
        'Customers discovering and enjoying quality products',
        'Local shopping experiences that feel authentic',
        'Product displays that showcase quality and value'
      ],
      avoid: [
        'Generic retail imagery that could be anywhere',
        'Overly commercial product shots without context'
      ]
    },
    'fitness': {
      icon: '💪',
      title: 'FITNESS SERVICES GUIDANCE',
      good: [
        'Real people achieving fitness goals in supportive environments',
        'Community members engaging in healthy activities',
        'Authentic workout scenarios that inspire motivation'
      ],
      avoid: [
        'Overly perfect fitness models that feel unattainable',
        'Generic gym imagery that lacks personality'
      ]
    }
  };

  // Find matching business type
  for (const [type, config] of Object.entries(businessGuidanceMap)) {
    if (businessLower.includes(type) ||
      (type === 'financial' && (businessLower.includes('bank') || businessLower.includes('money') || businessLower.includes('fintech'))) ||
      (type === 'technology' && (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('app'))) ||
      (type === 'education' && (businessLower.includes('school') || businessLower.includes('learning')))) {

      return `${config.icon} ${config.title}:
- GOOD: ${config.good.join('\n- GOOD: ')}
- AVOID: ${config.avoid.join('\n- AVOID: ')}`;
    }
  }

  return `🏢 GENERAL BUSINESS GUIDANCE:
- GOOD: Real people in authentic local business settings
- GOOD: Community-focused business interactions, local market contexts
- GOOD: Service providers helping real customers with genuine needs
- AVOID: Generic corporate imagery, stock photo business scenarios
- AVOID: Western business culture that doesn't resonate locally`;
}

function getVisualContextForBusiness(businessType: string, concept: string): string {
  const businessLower = String(businessType || 'general business').toLowerCase();

  // Financial services - culturally appropriate visuals
  if (businessLower.includes('bank') || businessLower.includes('financial') || businessLower.includes('money') || businessLower.includes('payment')) {
    return 'Simple, relatable financial scenarios: people saving money, family financial planning, mobile money transactions, or small business growth - AVOID complex charts or trading graphs';
  }

  // Technology services - realistic tech use
  if (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('app') || businessLower.includes('digital')) {
    return 'Natural technology usage: people using phones/computers for real tasks, simple app interfaces, everyday digital solutions - AVOID futuristic tech or complex coding imagery';
  }

  // Education services - authentic learning
  if (businessLower.includes('education') || businessLower.includes('school') || businessLower.includes('learning') || businessLower.includes('training')) {
    return 'Authentic learning environments: students in classrooms, practical skill development, community education - AVOID generic academic stock photos';
  }

  // Healthcare services - caring and professional
  if (businessLower.includes('health') || businessLower.includes('medical') || businessLower.includes('clinic') || businessLower.includes('hospital')) {
    return 'Professional healthcare settings: caring medical professionals, clean clinic environments, patient care scenarios - AVOID overly clinical or intimidating imagery';
  }

  // Retail/E-commerce - product focus
  if (businessLower.includes('retail') || businessLower.includes('shop') || businessLower.includes('store') || businessLower.includes('commerce')) {
    return 'Product-focused visuals: attractive product displays, shopping experiences, customer satisfaction - AVOID cluttered or overwhelming retail imagery';
  }

  // Food services - appetizing and inviting
  if (businessLower.includes('food') || businessLower.includes('restaurant') || businessLower.includes('cafe') || businessLower.includes('catering')) {
    return 'Appetizing food presentation: beautifully prepared dishes, inviting dining environments, satisfied customers - AVOID messy or unappetizing food imagery';
  }

  // Real estate - property and lifestyle
  if (businessLower.includes('real estate') || businessLower.includes('property') || businessLower.includes('housing')) {
    return 'Attractive property visuals: well-presented homes/offices, happy families in properties, professional real estate interactions - AVOID cluttered or poorly lit property images';
  }

  // Professional services - trustworthy and competent
  if (businessLower.includes('consulting') || businessLower.includes('legal') || businessLower.includes('accounting') || businessLower.includes('professional')) {
    return 'Professional service delivery: competent professionals helping clients, clean office environments, successful business outcomes - AVOID intimidating or overly formal imagery';
  }

  // Default for other business types
  return `Professional ${businessType} service delivery: competent professionals, clean business environments, satisfied customers - AVOID generic stock imagery`;
}

function getPlatformDimensions(platform: string): string {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('instagram')) return '1080x1080px (1:1 square)';
  if (platformLower.includes('facebook')) return '1200x630px (1.91:1)';
  if (platformLower.includes('twitter') || platformLower.includes('x')) return '1200x675px (16:9)';
  if (platformLower.includes('linkedin')) return '1200x627px (1.91:1)';
  return '1080x1080px (1:1 square)';
}

/**
 * Call Gemini for content generation (clean API call)
 */
async function callGeminiForContent(prompt: string, options: any): Promise<any> {
  try {
    console.log('🔍 [Revo 1.0] Calling Vertex AI with prompt length:', prompt.length);
    console.log('🔍 [Revo 1.0] Using model: gemini-2.5-flash');

    // Use direct Vertex AI call (same as Revo 2.0)
    const response = await generateContentDirect(prompt, 'gemini-2.5-flash', false);

    console.log('📥 [Revo 1.0] Vertex AI response:', {
      hasText: Boolean(response.text),
      hasContent: Boolean(response.content),
      textLength: response.text?.length || 0,
      contentLength: response.content?.length || 0,
      responseKeys: Object.keys(response)
    });

    // Try to parse JSON response
    try {
      // FIXED: response.text is a function, not a string!
      let text = '';
      if (typeof response.response?.text === 'function') {
        text = response.response.text();
      } else if (response.response?.text) {
        text = response.response.text;
      } else if (response.text) {
        text = response.text;
      } else if (response.content) {
        text = response.content;
      } else {
        text = '{}';
      }

      console.log('🔍 [Revo 1.0] Raw response text:', text);

      // Clean up the text to extract JSON
      let cleanText = text.trim();

      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Find JSON object boundaries
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }

      console.log('🔍 [Revo 1.0] Cleaned text for JSON parsing:', cleanText.substring(0, 200) + '...');
      const parsed = JSON.parse(cleanText);
      console.log('✅ [Revo 1.0] Successfully parsed JSON:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('❌ [Revo 1.0] JSON parse failed. Parse error:', parseError.message);
      console.error('❌ [Revo 1.0] Raw text that failed to parse:', text);
      console.error('❌ [Revo 1.0] This indicates the AI is not following JSON format instructions');

      // Don't return fallback content here - let the retry logic handle it
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
  } catch (error) {
    console.error('❌ [Revo 1.0] Gemini API call failed:', error);
    throw error;
  }
}
/**
 * Generate image using Revo 1.0 with Gemini (following Revo 2.0 architecture)
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
  creativeContext?: any;
  includeContacts?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  websiteUrl?: string;
  includePeople?: boolean;
  scheduledServices?: ScheduledService[];
  followBrandColors?: boolean;
  designExamples?: string[];
}) {
  try {
    // Create concept object for enhanced prompt
    const concept = {
      concept: input.designDescription || `Professional ${input.businessType} design`,
      composition: 'balanced',
      featuredServices: input.scheduledServices?.filter(s => s.isToday) || []
    };

    // Use Revo 2.0 style image generation with enhanced prompt
    const options = {
      businessType: input.businessType,
      platform: input.platform,
      brandProfile: {
        businessName: input.businessName,
        location: input.location,
        primaryColor: input.primaryColor,
        accentColor: input.accentColor || input.primaryColor,
        backgroundColor: input.backgroundColor || '#FFFFFF',
        contactInfo: input.contactInfo,
        websiteUrl: input.websiteUrl,
        designExamples: input.designExamples || [],
        businessType: input.businessType
      },
      aspectRatio: '1:1',
      visualStyle: input.visualStyle || 'modern',
      scheduledServices: input.scheduledServices,
      followBrandColors: input.followBrandColors,
      includePeopleInDesigns: input.includePeople,
      includeContacts: input.includeContacts
    };

    // TASK 21: Log brand profile data usage for analytics
    const usageLog = logBrandProfileUsage(options.brandProfile, 'image', input.platform);

    const prompt = buildRevo10ImagePrompt(options, concept);
    // Call Gemini for image generation
    const response = await callGeminiForImage(prompt, input);
    return {
      imageUrl: response.imageUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      design: prompt,
      aspectRatio: getPlatformAspectRatio(input.platform),
      resolution: '2048x2048',
      quality: 'enhanced'
    };
  } catch (error) {
    throw new Error('Revo 1.0 design generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
/**
 * Build enhanced prompt for Revo 1.0 with brand integration, visual consistency, and scheduled services
 * (COMPLETE COPY FROM REVO 2.0)
 */
function buildRevo10ImagePrompt(options: any, concept: any): string {
  const { businessType, platform, brandProfile, aspectRatio = '1:1', visualStyle = 'modern', scheduledServices } = options;

  // Enhanced brand colors extraction with intelligent processing
  const shouldFollowBrandColors = options.followBrandColors !== false; // Default to true if not specified
  const brandColorData = extractEnhancedBrandColors(brandProfile, shouldFollowBrandColors);

  const primaryColor = brandColorData.primary;
  const accentColor = brandColorData.accent;
  const backgroundColor = brandColorData.background;

  console.log('🎨 [Revo 1.0] Enhanced Brand Colors Debug:', {
    followBrandColors: shouldFollowBrandColors,
    inputPrimaryColor: brandProfile.primaryColor,
    inputAccentColor: brandProfile.accentColor,
    inputBackgroundColor: brandProfile.backgroundColor,
    finalPrimaryColor: primaryColor,
    finalAccentColor: accentColor,
    finalBackgroundColor: backgroundColor,
    hasValidColors: brandColorData.hasValidColors,
    usingBrandColors: brandColorData.usingBrandColors,
    colorHarmony: brandColorData.colorHarmony,
    businessTypeOptimized: brandColorData.businessTypeOptimized
  });

  // Build enhanced color scheme instruction with business-type optimization
  const colorScheme = generateEnhancedColorSchemeInstructions(brandColorData, businessType);

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
  const culturalContext = getDynamicCulturalContext(location);

  // Build people inclusion instructions based on toggle
  let peopleInstructions = '';
  if (options.includePeopleInDesigns === false) {
    peopleInstructions = `\n\n👥 PEOPLE EXCLUSION REQUIREMENT:\n- MANDATORY: Create a clean, professional design WITHOUT any people or human figures\n- AVOID: Any human faces, bodies, or silhouettes\n- FOCUS: Products, services, abstract elements, or clean minimalist design\n- STYLE: Professional, clean aesthetics without human elements\n- EMPHASIS: Brand elements, typography, and non-human visual elements`;
  } else {
    peopleInstructions = getDynamicPeopleInstructions(culturalContext, businessType);
  }

  // Add cultural intelligence for visual elements
  culturalInstructions = getDynamicCulturalInstructions(culturalContext, businessType);

  // Style/Layout/Typography variation (avoid repeating last style per brand/platform)
  const styles = ['modern-minimal', 'bold-color-blocking', 'editorial-magazine', 'organic-textured', 'geometric-abstract', 'photo-forward', 'duotone', 'retro-modern', 'ultra-clean', 'dynamic-diagonal'];
  const layouts = ['grid', 'asymmetrical', 'centered', 'diagonal-flow', 'layered-collage', 'rule-of-thirds', 'framed', 'split-screen'];
  const typographySet = ['bold sans-serif headline + light subhead', 'elegant serif display + sans body', 'condensed uppercase headline', 'playful rounded sans', 'high-contrast modern serif'];
  const effects = ['subtle grain', 'soft vignette', 'gentle drop shadow', 'glassmorphism card', 'gradient overlay'];

  const bKey = getBrandKey(brandProfile, platform);
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

${generateBusinessTypeDesignGuidance(businessType, brandProfile, platform)}

${processDesignExamplesForBrandConsistency(brandProfile, businessType, platform)}

${generateIndustrySpecificDesignGuidance(businessType, brandProfile)}

🎯 BUSINESS-TYPE-OPTIMIZED TEMPLATE STRUCTURE (MANDATORY):
1. TEMPLATE SELECTION: Use business-type-appropriate template style from guidance above
2. VISUAL HIERARCHY: Prioritize elements based on business type (product, service, people, etc.)
3. COLOR STRATEGY: Apply business-type-specific color psychology and brand alignment
4. LAYOUT OPTIMIZATION: Use layout style recommended for this business type and platform
5. CONTENT FOCUS: Emphasize the design priority identified for this business type

🎯 ENHANCED FLEXIBLE TEMPLATE STRUCTURE (MANDATORY):
1. NEUTRAL BACKGROUND: White or soft gradient ONLY (NEVER busy patterns, lines, grids, or decorative overlays)
2. ACCENT COLOR: Tied to post theme using brand colors strategically
3. SINGLE FOCAL ELEMENT: 1 person photo OR 1 relatable object (never both)
4. EMOTIONAL HEADLINE: Human tone, not corporate speak
5. OPTIONAL IDENTITY ELEMENT: Small icon or motif for brand consistency

🚫 CRITICAL: ABSOLUTELY NO BUSY BACKGROUNDS, LINES, OR TECH ELEMENTS:
═══════════════════════════════════════════════════════════════
⚠️  ZERO TOLERANCE POLICY - IMMEDIATE REJECTION IF VIOLATED:
═══════════════════════════════════════════════════════════════

❌ ABSOLUTELY NO LINES (ANY TYPE):
   • NO curved lines (digital circuits, wavy patterns)
   • NO straight lines (grids, borders, dividers)
   • NO diagonal lines (circuit boards, geometric patterns)
   • NO connection lines (networks, nodes, tech visualizations)
   • NO decorative lines (overlays, patterns, tech aesthetic)
   • NO line patterns of ANY kind on the background
   • ZERO LINES ALLOWED - background must be COMPLETELY CLEAN

❌ ABSOLUTELY NO CIRCULAR PATTERNS (CRITICAL):
   • NO concentric circles (radar style, target style)
   • NO segmented circles (pie chart style, circular tech overlays)
   • NO circular tech patterns (HUD style, futuristic circles)
   • NO circular gradients with segments or divisions
   • NO circular overlays of any kind
   • NO circular geometric patterns
   • ZERO CIRCULAR PATTERNS - background must be flat and solid

❌ ABSOLUTELY NO TECH ELEMENTS:
   • NO floating UI elements (dashboards, panels, screens)
   • NO holographic displays or transparent interfaces
   • NO data visualizations (charts, graphs, analytics)
   • NO glass-effect panels or futuristic overlays
   • NO digital mockups or tech aesthetic elements
   • ZERO TECH AESTHETIC - keep it simple and clean

❌ ABSOLUTELY NO DOTS OR NODES:
   • NO dots at intersections or connection points
   • NO network nodes or geometric dot patterns
   • NO decorative dot overlays of any kind

✅ ONLY THESE BACKGROUNDS ARE ALLOWED:
   ✓ SOLID white (#FFFFFF) - completely flat, no patterns
   ✓ SOLID brand color (${primaryColor}) - completely flat, no patterns
   ✓ Simple 2-color gradient using ONLY brand colors
   ✓ NO patterns, NO lines, NO overlays, NO decorations

✅ DESIGN COMPOSITION (ONLY THESE ELEMENTS):
   ✓ People (if applicable) - real, natural, authentic
   ✓ Text overlay - clean typography
   ✓ Logo - in corner with proper spacing
   ✓ SOLID background - no decorations
   ✓ NOTHING ELSE - keep it minimal and professional

═══════════════════════════════════════════════════════════════
🎯 CRITICAL: Background must be COMPLETELY SOLID and CLEAN
═══════════════════════════════════════════════════════════════

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
- BACKGROUND: Clean white (#FFFFFF) or subtle gradient using ONLY brand colors (${primaryColor}, ${accentColor}, ${backgroundColor})
- ABSOLUTELY NO BLACK (#000000) OR DARK GRAY BACKGROUNDS - these are NOT brand colors
- ACCENT COLOR: Use ${primaryColor} or ${accentColor} strategically for theme connection
- FOCAL ELEMENT: Choose ONE - either person OR object, positioned prominently

🚫 FORBIDDEN BACKGROUND COLORS (CRITICAL):
- NO black (#000000) backgrounds
- NO dark gray (#333333, #444444, #555555) backgrounds
- NO charcoal or dark neutral backgrounds
- ONLY use: White, brand colors (${primaryColor}, ${accentColor}, ${backgroundColor}), or light gradients
- If brand colors are dark, use WHITE background with dark text instead

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
${generateEnhancedBrandVoiceInstructions(brandProfile, businessType, location)}
- NO corporate jargon: "featuring", "thoughtful details", "measurable outcomes"

🚨 ELIMINATE ALL CORPORATE SPEAK (ABSOLUTELY CRITICAL):
- BANNED PHRASES (NEVER USE THESE):
  * "authentic, high-impact"
  * "BNPL is today's focus"
  * "${brandProfile.businessName} puts Buy Now Pay Later (BNPL) front and center today"
  * "makes it practical, useful, and..."
  * "timing is everything"
  * "We've all been there"
  * "brings a human, professional touch"
  * "See how ${brandProfile.businessName} makes it..."
- NEVER sound like a PowerPoint presentation or press release
- NEVER use generic filler text that could apply to any product
- WRITE LIKE: A friend explaining a solution they discovered
- USE REAL SCENARIOS: ${generateLocationAppropriateScenario(brandProfile.location, businessType)}

🎭 REAL HUMAN STORYTELLING (MANDATORY):
- START with a REAL SCENARIO: ${generateLocationAppropriateScenario(brandProfile.location, businessType)}
- CREATE A SCENE: Paint a picture people can see and feel
- USE REAL EMOTIONS: stress, relief, hope, frustration, excitement
- SHOW, DON'T TELL: Use specific scenarios instead of generic concepts
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

${generateEnhancedBrandIntegrationGuidance(brandProfile, businessType)}

REVO 1.0 ENHANCED FEATURES:
🚀 Next-generation AI design with sophisticated visual storytelling
🎯 Advanced brand consistency and cultural intelligence
🌟 Premium quality with authentic human-made aesthetics
🔥 Platform-optimized for maximum engagement
🎨 Precise brand color integration and logo placement

❌ CRITICAL VISUAL RESTRICTIONS - NEVER INCLUDE:
❌ Company name with colon format in text (e.g., "COMPANY:", "BUSINESS:")
❌ Text containing "journey", "everyday", or repetitive corporate language
❌ Fake website URLs or made-up domain names (e.g., "fakewebsite.com")
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
❌ FLOATING TRANSPARENT UI ELEMENTS (dashboards, charts, graphs, tables)
❌ HOLOGRAPHIC SCREENS or transparent glass-effect interface panels
❌ FLOATING DATA VISUALIZATIONS or chart overlays in the air
❌ TRANSPARENT DASHBOARD MOCKUPS showing analytics or metrics
❌ GLASS-EFFECT PANELS with financial data or statistics
❌ ANY floating/hovering digital interface elements
❌ ELECTRICAL/DIGITAL CONNECTION LINES from phones or devices
❌ Network visualization lines, nodes, or connection patterns
❌ Digital current/electricity effects around electronics
❌ Tech circuit patterns or digital network overlays (STRAIGHT OR CURVED)
❌ DIAGONAL LINE PATTERNS forming circuit board aesthetics
❌ GEOMETRIC LINE OVERLAYS creating tech-style backgrounds
❌ Artificial connection lines between person and device
❌ Glowing digital pathways or data streams
❌ Electronic signal visualizations or tech auras
❌ ANY LINES OR PATTERNS on the background (curved, straight, diagonal, geometric)

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

${peopleInstructions}
${culturalInstructions}
${contactInstruction}

🚨 FINAL CRITICAL REMINDER - ABSOLUTELY MANDATORY:
═══════════════════════════════════════════════════════════════
❌ ZERO TOLERANCE - THESE WILL RESULT IN IMMEDIATE REJECTION:
═══════════════════════════════════════════════════════════════

🚫 NO LINES OF ANY KIND:
   ❌ NO diagonal lines
   ❌ NO curved lines
   ❌ NO straight lines
   ❌ NO grid lines
   ❌ NO connection lines
   ❌ NO network lines
   ❌ NO circuit patterns
   ❌ NO geometric line overlays
   ❌ NO tech line patterns
   ❌ ABSOLUTELY NO LINES ON THE BACKGROUND

🚫 NO CIRCULAR PATTERNS (ULTRA-CRITICAL):
   ❌ NO concentric circles (like the image you just generated - BANNED!)
   ❌ NO segmented circles (pie chart style, radar style)
   ❌ NO circular tech overlays (HUD style, futuristic circles)
   ❌ NO circular gradients with segments
   ❌ NO target-style circular patterns
   ❌ NO circular geometric patterns of ANY kind
   ❌ ABSOLUTELY NO CIRCULAR TECH PATTERNS

🚫 NO TECH ELEMENTS:
   ❌ NO floating UI elements
   ❌ NO holographic dashboards
   ❌ NO transparent screens
   ❌ NO data visualizations
   ❌ NO charts or graphs floating in air
   ❌ NO glass-effect panels
   ❌ NO digital overlays
   ❌ NO tech aesthetic of any kind

🚫 NO DOTS OR NODES:
   ❌ NO dots at line intersections
   ❌ NO network nodes
   ❌ NO connection points
   ❌ NO geometric dot patterns

✅ ONLY ALLOWED BACKGROUNDS:
   ✓ SOLID white (#FFFFFF)
   ✓ SOLID brand color (${primaryColor})
   ✓ Simple 2-color gradient (brand colors only)
   ✓ COMPLETELY CLEAN - no patterns, no lines, no overlays

✅ DESIGN SHOULD CONTAIN ONLY:
   ✓ People (if applicable)
   ✓ Text overlay
   ✓ Logo
   ✓ SOLID background
   ✓ Nothing else

═══════════════════════════════════════════════════════════════
🎯 REMEMBER: Clean, simple, professional. NO TECH AESTHETIC.
═══════════════════════════════════════════════════════════════`;
}
/**
 * Call Gemini for image generation (clean API call)
 */
async function callGeminiForImage(prompt: string, input: any): Promise<any> {
  try {
    console.log('🖼️ [Revo 1.0] Calling Vertex AI for IMAGE with model:', REVO_1_0_IMAGE_MODEL);

    // Prefer direct Vertex client to avoid shape mismatches
    const client = getVertexAIClient();
    const res = await client.generateImage(prompt, REVO_1_0_IMAGE_MODEL, {
      temperature: 0.7,
      maxOutputTokens: 8192,
      logoImage: input?.logoDataUrl
    });

    if (!res || !res.imageData) {
      console.error('❌ [Revo 1.0] Vertex returned no image data');
      throw new Error('No image data returned from Vertex AI');
    }

    const mime = res.mimeType || 'image/png';
    const dataUrl = 'data:' + mime + ';base64,' + res.imageData;
    return { imageUrl: dataUrl };
  } catch (error) {
    console.error('❌ [Revo 1.0] Gemini Image API call failed:', error);
    throw error;
  }
}

// ============================================================================
// TASK 20: CONTENT QUALITY CHECKS FOR DIFFERENT BUSINESS TYPES
// ============================================================================

/**
 * Business-type-specific quality validation system
 */
interface ContentQualityScore {
  overallScore: number;
  industryAppropriate: number;
  toneConsistency: number;
  terminologyAccuracy: number;
  contentStructure: number;
  culturalRelevance: number;
  brandAlignment: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Validate content quality for specific business types
 */
export function validateContentQualityForBusinessTypes(
  content: string,
  businessType: string,
  brandProfile: any,
  location: string
): ContentQualityScore {
  const qualityScore: ContentQualityScore = {
    overallScore: 0,
    industryAppropriate: 0,
    toneConsistency: 0,
    terminologyAccuracy: 0,
    contentStructure: 0,
    culturalRelevance: 0,
    brandAlignment: 0,
    issues: [],
    recommendations: []
  };

  // Industry-appropriate language validation
  qualityScore.industryAppropriate = validateIndustryLanguage(content, businessType, qualityScore);

  // Tone consistency validation
  qualityScore.toneConsistency = validateToneConsistency(content, brandProfile.writingTone || brandProfile.brandVoice, qualityScore);

  // Terminology accuracy validation
  qualityScore.terminologyAccuracy = validateTerminologyAccuracy(content, businessType, qualityScore);

  // Content structure validation
  qualityScore.contentStructure = validateContentStructure(content, businessType, qualityScore);

  // Cultural relevance validation
  qualityScore.culturalRelevance = validateCulturalRelevance(content, location, qualityScore);

  // Brand alignment validation
  qualityScore.brandAlignment = validateBrandAlignment(content, brandProfile, qualityScore);

  // Calculate overall score
  qualityScore.overallScore = Math.round(
    (qualityScore.industryAppropriate +
      qualityScore.toneConsistency +
      qualityScore.terminologyAccuracy +
      qualityScore.contentStructure +
      qualityScore.culturalRelevance +
      qualityScore.brandAlignment) / 6
  );

  return qualityScore;
}

/**
 * Validate industry-appropriate language
 */
function validateIndustryLanguage(content: string, businessType: string, qualityScore: ContentQualityScore): number {
  const contentLower = content.toLowerCase();
  let score = 100;

  const industryTerms: Record<string, { required: string[], inappropriate: string[] }> = {
    'restaurant': {
      required: ['food', 'meal', 'dish', 'taste', 'fresh', 'delicious', 'cuisine'],
      inappropriate: ['prescription', 'diagnosis', 'treatment', 'surgery', 'medication']
    },
    'healthcare': {
      required: ['health', 'care', 'medical', 'treatment', 'doctor', 'patient', 'wellness'],
      inappropriate: ['delicious', 'tasty', 'workout', 'exercise', 'fashion', 'style']
    },
    'fitness gym': {
      required: ['fitness', 'workout', 'training', 'exercise', 'strength', 'health', 'gym'],
      inappropriate: ['prescription', 'surgery', 'legal', 'lawsuit', 'contract']
    },
    'beauty salon': {
      required: ['beauty', 'style', 'treatment', 'skin', 'hair', 'elegant', 'glamour'],
      inappropriate: ['workout', 'exercise', 'medical', 'diagnosis', 'legal']
    },
    'finance': {
      required: ['money', 'financial', 'savings', 'investment', 'banking', 'secure', 'trust'],
      inappropriate: ['delicious', 'workout', 'beauty', 'style', 'fashion']
    },
    'retail store': {
      required: ['fashion', 'style', 'clothing', 'shopping', 'collection', 'trendy', 'quality'],
      inappropriate: ['medical', 'treatment', 'workout', 'banking', 'financial']
    },
    'legal services': {
      required: ['legal', 'law', 'attorney', 'counsel', 'advice', 'professional', 'expertise'],
      inappropriate: ['delicious', 'workout', 'beauty', 'fashion', 'medical']
    },
    'technology': {
      required: ['technology', 'digital', 'innovation', 'solution', 'software', 'tech', 'advanced'],
      inappropriate: ['delicious', 'workout', 'beauty', 'medical', 'legal']
    },
    'education': {
      required: ['learning', 'education', 'knowledge', 'skills', 'training', 'course', 'study'],
      inappropriate: ['delicious', 'workout', 'medical', 'legal', 'banking']
    },
    'automotive': {
      required: ['car', 'vehicle', 'automotive', 'driving', 'service', 'maintenance', 'reliable'],
      inappropriate: ['delicious', 'beauty', 'medical', 'legal', 'education']
    }
  };

  const businessTerms = industryTerms[String(businessType || 'general business').toLowerCase()];
  if (businessTerms) {
    // Check for required terms
    const requiredTermsFound = businessTerms.required.filter(term => contentLower.includes(term));
    if (requiredTermsFound.length < businessTerms.required.length * 0.3) {
      score -= 30;
      qualityScore.issues.push(`Missing industry-specific terminology for ${businessType}`);
      qualityScore.recommendations.push(`Include more ${businessType}-specific terms like: ${businessTerms.required.slice(0, 3).join(', ')}`);
    }

    // Check for inappropriate terms
    const inappropriateTermsFound = businessTerms.inappropriate.filter(term => contentLower.includes(term));
    if (inappropriateTermsFound.length > 0) {
      score -= inappropriateTermsFound.length * 20;
      qualityScore.issues.push(`Contains inappropriate terminology: ${inappropriateTermsFound.join(', ')}`);
      qualityScore.recommendations.push(`Remove terms not relevant to ${businessType} industry`);
    }
  }

  return Math.max(0, score);
}

/**
 * Validate tone consistency
 */
function validateToneConsistency(content: string, expectedTone: string, qualityScore: ContentQualityScore): number {
  if (!expectedTone) return 100;

  const contentLower = content.toLowerCase();
  let score = 100;

  const toneIndicators: Record<string, { positive: string[], negative: string[] }> = {
    'professional': {
      positive: ['expertise', 'professional', 'quality', 'reliable', 'trusted', 'experienced'],
      negative: ['awesome', 'super cool', 'amazing', 'wow', 'epic', 'lit']
    },
    'casual': {
      positive: ['friendly', 'easy', 'simple', 'fun', 'relaxed', 'comfortable'],
      negative: ['pursuant', 'heretofore', 'aforementioned', 'whereas', 'thereby']
    },
    'luxury': {
      positive: ['premium', 'exclusive', 'elegant', 'sophisticated', 'refined', 'exquisite'],
      negative: ['cheap', 'budget', 'basic', 'simple', 'ordinary', 'standard']
    },
    'energetic': {
      positive: ['exciting', 'dynamic', 'vibrant', 'powerful', 'active', 'energizing'],
      negative: ['boring', 'dull', 'slow', 'tired', 'passive', 'quiet']
    },
    'trustworthy': {
      positive: ['reliable', 'secure', 'trusted', 'dependable', 'honest', 'transparent'],
      negative: ['risky', 'uncertain', 'questionable', 'unreliable', 'sketchy']
    }
  };

  const toneData = toneIndicators[expectedTone.toLowerCase()];
  if (toneData) {
    const positiveFound = toneData.positive.filter(term => contentLower.includes(term)).length;
    const negativeFound = toneData.negative.filter(term => contentLower.includes(term)).length;

    if (positiveFound === 0) {
      score -= 20;
      qualityScore.issues.push(`Content doesn't reflect ${expectedTone} tone`);
      qualityScore.recommendations.push(`Include ${expectedTone} language like: ${toneData.positive.slice(0, 3).join(', ')}`);
    }

    if (negativeFound > 0) {
      score -= negativeFound * 15;
      qualityScore.issues.push(`Content contains tone-inappropriate language`);
      qualityScore.recommendations.push(`Avoid language that conflicts with ${expectedTone} tone`);
    }
  }

  return Math.max(0, score);
}

/**
 * Validate terminology accuracy
 */
function validateTerminologyAccuracy(content: string, businessType: string, qualityScore: ContentQualityScore): number {
  const contentLower = content.toLowerCase();
  let score = 100;

  // Check for common terminology mistakes by business type
  const terminologyRules: Record<string, { correct: string[], incorrect: string[] }> = {
    'healthcare': {
      correct: ['patient', 'consultation', 'treatment', 'diagnosis', 'medical care'],
      incorrect: ['customer', 'client', 'buyer', 'shopper', 'user']
    },
    'legal services': {
      correct: ['client', 'consultation', 'legal advice', 'attorney', 'counsel'],
      incorrect: ['patient', 'customer', 'buyer', 'user', 'member']
    },
    'restaurant': {
      correct: ['customer', 'guest', 'diner', 'patron', 'reservation'],
      incorrect: ['patient', 'client', 'member', 'user', 'subscriber']
    },
    'fitness gym': {
      correct: ['member', 'client', 'fitness enthusiast', 'athlete', 'trainee'],
      incorrect: ['patient', 'customer', 'buyer', 'shopper', 'guest']
    }
  };

  const rules = terminologyRules[String(businessType || 'general business').toLowerCase()];
  if (rules) {
    const incorrectTermsFound = rules.incorrect.filter(term => contentLower.includes(term));
    if (incorrectTermsFound.length > 0) {
      score -= incorrectTermsFound.length * 15;
      qualityScore.issues.push(`Uses incorrect terminology: ${incorrectTermsFound.join(', ')}`);
      qualityScore.recommendations.push(`Use industry-appropriate terms like: ${rules.correct.slice(0, 3).join(', ')}`);
    }
  }

  return Math.max(0, score);
}

/**
 * Validate content structure
 */
function validateContentStructure(content: string, businessType: string, qualityScore: ContentQualityScore): number {
  let score = 100;

  // Check for proper content length
  if (content.length < 50) {
    score -= 30;
    qualityScore.issues.push('Content too short for effective communication');
    qualityScore.recommendations.push('Expand content to provide more value and context');
  }

  if (content.length > 500) {
    score -= 20;
    qualityScore.issues.push('Content may be too long for social media');
    qualityScore.recommendations.push('Consider condensing content for better engagement');
  }

  // Check for call-to-action presence
  const ctaPatterns = ['call', 'visit', 'book', 'contact', 'learn', 'discover', 'try', 'get', 'start', 'join'];
  const hasCTA = ctaPatterns.some(pattern => content.toLowerCase().includes(pattern));

  if (!hasCTA) {
    score -= 25;
    qualityScore.issues.push('Missing clear call-to-action');
    qualityScore.recommendations.push('Add a compelling call-to-action to drive engagement');
  }

  return Math.max(0, score);
}

/**
 * Validate cultural relevance
 */
function validateCulturalRelevance(content: string, location: string, qualityScore: ContentQualityScore): number {
  let score = 100;

  // Extract country from location
  const country = location.split(',').pop()?.trim().toLowerCase();

  // Check for cultural sensitivity
  const culturalElements: Record<string, string[]> = {
    'kenya': ['kenyan', 'nairobi', 'sheng', 'harambee', 'safari'],
    'nigeria': ['nigerian', 'lagos', 'nollywood', 'naira', 'jollof'],
    'ghana': ['ghanaian', 'accra', 'highlife', 'cedi', 'kente'],
    'egypt': ['egyptian', 'cairo', 'nile', 'pyramid', 'arabic'],
    'south africa': ['south african', 'cape town', 'rainbow nation', 'rand', 'ubuntu'],
    'uk': ['british', 'london', 'pound', 'uk', 'britain'],
    'usa': ['american', 'dollar', 'usa', 'us', 'america'],
    'japan': ['japanese', 'tokyo', 'yen', 'japan', 'nippon'],
    'germany': ['german', 'berlin', 'euro', 'germany', 'deutsch'],
    'australia': ['australian', 'sydney', 'aussie', 'australia', 'oz']
  };

  if (country && culturalElements[country]) {
    const hasCulturalElement = culturalElements[country].some(element =>
      content.toLowerCase().includes(element)
    );

    if (!hasCulturalElement) {
      score -= 15;
      qualityScore.recommendations.push(`Consider adding local cultural context for ${location}`);
    }
  }

  return Math.max(0, score);
}

/**
 * Validate brand alignment
 */
function validateBrandAlignment(content: string, brandProfile: any, qualityScore: ContentQualityScore): number {
  let score = 100;

  // Check if business name is mentioned
  if (brandProfile.businessName && !content.includes(brandProfile.businessName)) {
    score -= 20;
    qualityScore.issues.push('Business name not prominently featured');
    qualityScore.recommendations.push(`Include business name "${brandProfile.businessName}" in content`);
  }

  // Check if key services are mentioned
  if (brandProfile.services && Array.isArray(brandProfile.services)) {
    const servicesInContent = brandProfile.services.filter((service: string) =>
      content.toLowerCase().includes(service.toLowerCase())
    );

    if (servicesInContent.length === 0) {
      score -= 15;
      qualityScore.issues.push('Key services not highlighted in content');
      qualityScore.recommendations.push('Mention specific services offered by the business');
    }
  }

  // Check for competitive advantages
  if (brandProfile.competitiveAdvantages && Array.isArray(brandProfile.competitiveAdvantages)) {
    const advantagesInContent = brandProfile.competitiveAdvantages.filter((advantage: string) =>
      content.toLowerCase().includes(advantage.toLowerCase())
    );

    if (advantagesInContent.length === 0) {
      score -= 10;
      qualityScore.recommendations.push('Consider highlighting unique competitive advantages');
    }
  }

  return Math.max(0, score);
}

// ============================================================================
// TASK 21: BRAND PROFILE DATA USAGE LOGGING
// ============================================================================

/**
 * Brand profile data usage tracking interface
 */
interface BrandProfileUsageLog {
  timestamp: string;
  businessName: string;
  businessType: string;
  location: string;
  platform: string;
  usedFields: string[];
  missingFields: string[];
  utilizationScore: number;
  fieldUsageDetails: Record<string, {
    used: boolean;
    value?: any;
    importance: 'critical' | 'high' | 'medium' | 'low';
    impact: string;
  }>;
  recommendations: string[];
}

/**
 * Log brand profile data usage for analytics and optimization
 */
export function logBrandProfileUsage(
  brandProfile: any,
  generationType: 'content' | 'image',
  platform: string
): BrandProfileUsageLog {
  const timestamp = new Date().toISOString();

  // Define field importance levels
  const fieldImportance: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    businessName: 'critical',
    businessType: 'critical',
    location: 'critical',
    services: 'high',
    keyFeatures: 'high',
    targetAudience: 'high',
    brandColors: 'high',
    writingTone: 'high',
    brandVoice: 'high',
    competitiveAdvantages: 'medium',
    uniqueSellingPoints: 'medium',
    websiteUrl: 'medium',
    designExamples: 'medium',
    logoUrl: 'low',
    contactInfo: 'low',
    description: 'low'
  };

  const usageLog: BrandProfileUsageLog = {
    timestamp,
    businessName: brandProfile.businessName || 'Unknown',
    businessType: brandProfile.businessType || 'Unknown',
    location: brandProfile.location || 'Unknown',
    platform,
    usedFields: [],
    missingFields: [],
    utilizationScore: 0,
    fieldUsageDetails: {},
    recommendations: []
  };

  let totalFields = 0;
  let usedFields = 0;
  let criticalFieldsUsed = 0;
  let totalCriticalFields = 0;

  // Analyze each field
  Object.keys(fieldImportance).forEach(field => {
    totalFields++;
    const importance = fieldImportance[field];
    const hasValue = brandProfile[field] &&
      (typeof brandProfile[field] !== 'string' || brandProfile[field].trim() !== '') &&
      (Array.isArray(brandProfile[field]) ? brandProfile[field].length > 0 : true);

    if (importance === 'critical') {
      totalCriticalFields++;
    }

    usageLog.fieldUsageDetails[field] = {
      used: hasValue,
      value: hasValue ? brandProfile[field] : undefined,
      importance,
      impact: getFieldImpact(field, importance, generationType)
    };

    if (hasValue) {
      usageLog.usedFields.push(field);
      usedFields++;
      if (importance === 'critical') {
        criticalFieldsUsed++;
      }
    } else {
      usageLog.missingFields.push(field);

      // Add recommendations for missing important fields
      if (importance === 'critical' || importance === 'high') {
        usageLog.recommendations.push(getFieldRecommendation(field, importance, generationType));
      }
    }
  });

  // Calculate utilization score
  usageLog.utilizationScore = Math.round((usedFields / totalFields) * 100);

  // Add critical field warnings
  if (criticalFieldsUsed < totalCriticalFields) {
    usageLog.recommendations.unshift(
      `⚠️ Missing ${totalCriticalFields - criticalFieldsUsed} critical field(s) - this may significantly impact ${generationType} quality`
    );
  }

  // Log to console for development (in production, this would go to a proper logging service)
  console.log(`📊 [Brand Profile Usage] ${usageLog.businessName} (${generationType}):`, {
    utilizationScore: usageLog.utilizationScore,
    usedFields: usageLog.usedFields.length,
    missingFields: usageLog.missingFields.length,
    criticalFieldsUsed: `${criticalFieldsUsed}/${totalCriticalFields}`
  });

  return usageLog;
}

/**
 * Get field impact description
 */
function getFieldImpact(field: string, importance: string, generationType: string): string {
  const impacts: Record<string, Record<string, string>> = {
    businessName: {
      content: 'Essential for brand recognition and personalization',
      image: 'Required for logo integration and brand consistency'
    },
    businessType: {
      content: 'Determines industry-specific language and messaging',
      image: 'Influences design template selection and visual style'
    },
    location: {
      content: 'Enables cultural context and local relevance',
      image: 'Affects cultural visual elements and local appeal'
    },
    services: {
      content: 'Core for value proposition and service highlighting',
      image: 'Influences design focus and service representation'
    },
    keyFeatures: {
      content: 'Important for competitive differentiation',
      image: 'Affects feature highlighting in visual design'
    },
    targetAudience: {
      content: 'Shapes tone, language, and messaging approach',
      image: 'Influences visual style and demographic appeal'
    },
    brandColors: {
      content: 'Minimal impact on text content',
      image: 'Critical for brand consistency and visual identity'
    },
    writingTone: {
      content: 'Determines content voice and communication style',
      image: 'Influences design tone and visual messaging'
    },
    brandVoice: {
      content: 'Shapes overall communication personality',
      image: 'Affects design personality and visual communication'
    },
    competitiveAdvantages: {
      content: 'Enhances unique positioning and differentiation',
      image: 'Can be highlighted in design messaging'
    },
    designExamples: {
      content: 'No direct impact on text content',
      image: 'Crucial for maintaining visual consistency'
    }
  };

  return impacts[field]?.[generationType] || `${importance} importance for ${generationType} generation`;
}

/**
 * Get field recommendation
 */
function getFieldRecommendation(field: string, importance: string, generationType: string): string {
  const recommendations: Record<string, string> = {
    businessName: 'Add business name for proper brand recognition',
    businessType: 'Specify business type for industry-appropriate content',
    location: 'Add location for cultural context and local relevance',
    services: 'List key services to highlight value proposition',
    keyFeatures: 'Add key features for competitive differentiation',
    targetAudience: 'Define target audience for better messaging',
    brandColors: 'Add brand colors for consistent visual identity',
    writingTone: 'Specify writing tone for consistent communication',
    brandVoice: 'Define brand voice for personality consistency',
    competitiveAdvantages: 'Add competitive advantages for unique positioning',
    designExamples: 'Upload design examples for visual consistency'
  };

  return recommendations[field] || `Consider adding ${field} to improve ${generationType} quality`;
}

// ============================================================================
// TASK 22: FALLBACK MECHANISMS FOR MISSING BRAND PROFILE DATA
// ============================================================================

/**
 * Enhanced brand profile with intelligent fallbacks
 */
interface EnhancedBrandProfile {
  businessName: string;
  businessType: string;
  location: string;
  services: string[];
  keyFeatures: string[];
  targetAudience: string;
  brandColors: {
    primary: string;
    secondary: string;
    background: string;
  };
  writingTone: string;
  brandVoice: string;
  competitiveAdvantages: string[];
  uniqueSellingPoints: string[];
  websiteUrl?: string;
  designExamples: string[];
  logoUrl?: string;
  contactInfo?: any;
  description: string;
  fallbacksUsed: string[];
}

/**
 * Apply intelligent fallbacks to incomplete brand profile data
 */
export function applyBrandProfileFallbacks(
  brandProfile: any,
  businessType?: string,
  location?: string
): EnhancedBrandProfile {
  const fallbacksUsed: string[] = [];

  // Determine business type with fallback
  const resolvedBusinessType = brandProfile.businessType || businessType || inferBusinessTypeFromServices(brandProfile.services) || 'Business';
  if (!brandProfile.businessType) {
    fallbacksUsed.push('businessType');
  }

  // Determine location with fallback
  const resolvedLocation = brandProfile.location || location || 'Global';
  if (!brandProfile.location) {
    fallbacksUsed.push('location');
  }

  // Business name fallback
  const resolvedBusinessName = brandProfile.businessName || generateBusinessNameFallback(resolvedBusinessType);
  if (!brandProfile.businessName) {
    fallbacksUsed.push('businessName');
  }

  // Services fallback
  const resolvedServices = brandProfile.services && Array.isArray(brandProfile.services) && brandProfile.services.length > 0
    ? brandProfile.services
    : generateServicesFallback(resolvedBusinessType);
  if (!brandProfile.services || !Array.isArray(brandProfile.services) || brandProfile.services.length === 0) {
    fallbacksUsed.push('services');
  }

  // Key features fallback
  const resolvedKeyFeatures = brandProfile.keyFeatures && Array.isArray(brandProfile.keyFeatures) && brandProfile.keyFeatures.length > 0
    ? brandProfile.keyFeatures
    : generateKeyFeaturesFallback(resolvedBusinessType);
  if (!brandProfile.keyFeatures || !Array.isArray(brandProfile.keyFeatures) || brandProfile.keyFeatures.length === 0) {
    fallbacksUsed.push('keyFeatures');
  }

  // Target audience fallback
  const resolvedTargetAudience = brandProfile.targetAudience || generateTargetAudienceFallback(resolvedBusinessType);
  if (!brandProfile.targetAudience) {
    fallbacksUsed.push('targetAudience');
  }

  // Brand colors fallback
  const resolvedBrandColors = brandProfile.brandColors && brandProfile.brandColors.primary
    ? brandProfile.brandColors
    : generateBrandColorsFallback(resolvedBusinessType);
  if (!brandProfile.brandColors || !brandProfile.brandColors.primary) {
    fallbacksUsed.push('brandColors');
  }

  // Writing tone fallback
  const resolvedWritingTone = brandProfile.writingTone || brandProfile.brandVoice || generateWritingToneFallback(resolvedBusinessType);
  if (!brandProfile.writingTone && !brandProfile.brandVoice) {
    fallbacksUsed.push('writingTone');
  }

  // Brand voice fallback
  const resolvedBrandVoice = brandProfile.brandVoice || brandProfile.writingTone || generateBrandVoiceFallback(resolvedBusinessType);
  if (!brandProfile.brandVoice && !brandProfile.writingTone) {
    fallbacksUsed.push('brandVoice');
  }

  // Competitive advantages fallback
  const resolvedCompetitiveAdvantages = brandProfile.competitiveAdvantages && Array.isArray(brandProfile.competitiveAdvantages) && brandProfile.competitiveAdvantages.length > 0
    ? brandProfile.competitiveAdvantages
    : generateCompetitiveAdvantagesFallback(resolvedBusinessType);
  if (!brandProfile.competitiveAdvantages || !Array.isArray(brandProfile.competitiveAdvantages) || brandProfile.competitiveAdvantages.length === 0) {
    fallbacksUsed.push('competitiveAdvantages');
  }

  // Unique selling points fallback
  const resolvedUniqueSellingPoints = brandProfile.uniqueSellingPoints && Array.isArray(brandProfile.uniqueSellingPoints) && brandProfile.uniqueSellingPoints.length > 0
    ? brandProfile.uniqueSellingPoints
    : generateUniqueSellingPointsFallback(resolvedBusinessType);
  if (!brandProfile.uniqueSellingPoints || !Array.isArray(brandProfile.uniqueSellingPoints) || brandProfile.uniqueSellingPoints.length === 0) {
    fallbacksUsed.push('uniqueSellingPoints');
  }

  // Description fallback
  const resolvedDescription = brandProfile.description || generateDescriptionFallback(resolvedBusinessName, resolvedBusinessType, resolvedServices);
  if (!brandProfile.description) {
    fallbacksUsed.push('description');
  }

  // Design examples fallback (empty array is acceptable)
  const resolvedDesignExamples = brandProfile.designExamples || [];

  return {
    businessName: resolvedBusinessName,
    businessType: resolvedBusinessType,
    location: resolvedLocation,
    services: resolvedServices,
    keyFeatures: resolvedKeyFeatures,
    targetAudience: resolvedTargetAudience,
    brandColors: {
      primary: resolvedBrandColors.primary || '#1a73e8',
      secondary: resolvedBrandColors.secondary || '#34a853',
      background: resolvedBrandColors.background || '#ffffff'
    },
    writingTone: resolvedWritingTone,
    brandVoice: resolvedBrandVoice,
    competitiveAdvantages: resolvedCompetitiveAdvantages,
    uniqueSellingPoints: resolvedUniqueSellingPoints,
    websiteUrl: brandProfile.websiteUrl,
    designExamples: resolvedDesignExamples,
    logoUrl: brandProfile.logoUrl,
    contactInfo: brandProfile.contactInfo,
    description: resolvedDescription,
    fallbacksUsed
  };
}

/**
 * Infer business type from services
 */
function inferBusinessTypeFromServices(services: any): string | null {
  if (!services || !Array.isArray(services) || services.length === 0) return null;

  const servicesText = services.join(' ').toLowerCase();

  if (servicesText.includes('food') || servicesText.includes('restaurant') || servicesText.includes('dining')) return 'Restaurant';
  if (servicesText.includes('health') || servicesText.includes('medical') || servicesText.includes('doctor')) return 'Healthcare';
  if (servicesText.includes('fitness') || servicesText.includes('gym') || servicesText.includes('workout')) return 'Fitness Gym';
  if (servicesText.includes('beauty') || servicesText.includes('salon') || servicesText.includes('spa')) return 'Beauty Salon';
  if (servicesText.includes('finance') || servicesText.includes('banking') || servicesText.includes('money')) return 'Finance';
  if (servicesText.includes('retail') || servicesText.includes('shopping') || servicesText.includes('store')) return 'Retail Store';
  if (servicesText.includes('legal') || servicesText.includes('law') || servicesText.includes('attorney')) return 'Legal Services';
  if (servicesText.includes('tech') || servicesText.includes('software') || servicesText.includes('digital')) return 'Technology';
  if (servicesText.includes('education') || servicesText.includes('learning') || servicesText.includes('training')) return 'Education';
  if (servicesText.includes('car') || servicesText.includes('auto') || servicesText.includes('vehicle')) return 'Automotive';

  return null;
}

/**
 * Generate business name fallback
 */
function generateBusinessNameFallback(businessType: string): string {
  const fallbackNames: Record<string, string[]> = {
    'Restaurant': ['Local Eatery', 'Family Restaurant', 'Dining Place', 'Food Corner'],
    'Healthcare': ['Health Center', 'Medical Clinic', 'Wellness Center', 'Care Facility'],
    'Fitness Gym': ['Fitness Center', 'Gym & Wellness', 'Active Life Gym', 'Fitness Hub'],
    'Beauty Salon': ['Beauty Studio', 'Style Salon', 'Glamour Spa', 'Beauty Corner'],
    'Finance': ['Financial Services', 'Money Solutions', 'Finance Hub', 'Banking Center'],
    'Retail Store': ['Retail Shop', 'Shopping Store', 'Fashion Outlet', 'Style Store'],
    'Legal Services': ['Law Firm', 'Legal Associates', 'Attorney Services', 'Legal Solutions'],
    'Technology': ['Tech Solutions', 'Digital Services', 'Tech Hub', 'Innovation Center'],
    'Education': ['Learning Center', 'Education Hub', 'Training Institute', 'Knowledge Center'],
    'Automotive': ['Auto Service', 'Car Care Center', 'Vehicle Services', 'Auto Hub']
  };

  const names = fallbackNames[businessType] || ['Professional Services', 'Business Solutions', 'Service Provider'];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Generate services fallback
 */
function generateServicesFallback(businessType: string): string[] {
  const fallbackServices: Record<string, string[]> = {
    'Restaurant': ['Quality dining', 'Fresh ingredients', 'Takeaway service', 'Catering'],
    'Healthcare': ['General consultation', 'Health checkups', 'Medical care', 'Wellness services'],
    'Fitness Gym': ['Fitness training', 'Group classes', 'Personal training', 'Wellness programs'],
    'Beauty Salon': ['Hair styling', 'Beauty treatments', 'Skincare services', 'Wellness spa'],
    'Finance': ['Financial planning', 'Banking services', 'Investment advice', 'Money management'],
    'Retail Store': ['Quality products', 'Customer service', 'Shopping experience', 'Product variety'],
    'Legal Services': ['Legal consultation', 'Professional advice', 'Legal representation', 'Document services'],
    'Technology': ['Digital solutions', 'Technical support', 'Software services', 'Innovation'],
    'Education': ['Learning programs', 'Skill development', 'Educational services', 'Training courses'],
    'Automotive': ['Vehicle maintenance', 'Auto repair', 'Car services', 'Technical support']
  };

  return fallbackServices[businessType] || ['Professional services', 'Quality solutions', 'Customer support'];
}

/**
 * Generate key features fallback
 */
function generateKeyFeaturesFallback(businessType: string): string[] {
  const fallbackFeatures: Record<string, string[]> = {
    'Restaurant': ['Fresh ingredients', 'Authentic recipes', 'Friendly service', 'Clean environment'],
    'Healthcare': ['Experienced professionals', 'Modern equipment', 'Comprehensive care', 'Patient-focused'],
    'Fitness Gym': ['Modern equipment', 'Expert trainers', 'Flexible schedules', 'Results-oriented'],
    'Beauty Salon': ['Skilled professionals', 'Premium products', 'Relaxing atmosphere', 'Personalized service'],
    'Finance': ['Trusted expertise', 'Secure transactions', 'Competitive rates', 'Professional advice'],
    'Retail Store': ['Quality products', 'Competitive prices', 'Excellent service', 'Wide selection'],
    'Legal Services': ['Experienced attorneys', 'Professional expertise', 'Confidential service', 'Results-focused'],
    'Technology': ['Cutting-edge solutions', 'Expert team', 'Reliable service', 'Innovation-driven'],
    'Education': ['Qualified instructors', 'Comprehensive curriculum', 'Flexible learning', 'Practical approach'],
    'Automotive': ['Certified technicians', 'Quality parts', 'Reliable service', 'Fair pricing']
  };

  return fallbackFeatures[businessType] || ['Professional service', 'Quality focus', 'Customer satisfaction'];
}

/**
 * Generate target audience fallback
 */
function generateTargetAudienceFallback(businessType: string): string {
  const fallbackAudiences: Record<string, string> = {
    'Restaurant': 'Families, food lovers, local community',
    'Healthcare': 'Patients, families, health-conscious individuals',
    'Fitness Gym': 'Fitness enthusiasts, health-conscious individuals, athletes',
    'Beauty Salon': 'Beauty-conscious individuals, professionals, special occasion clients',
    'Finance': 'Individuals, families, small businesses, investors',
    'Retail Store': 'Shoppers, fashion-conscious individuals, local community',
    'Legal Services': 'Individuals, families, small businesses, corporations',
    'Technology': 'Businesses, entrepreneurs, tech-savvy individuals',
    'Education': 'Students, professionals, lifelong learners',
    'Automotive': 'Vehicle owners, drivers, automotive enthusiasts'
  };

  return fallbackAudiences[businessType] || 'General public, local community, professionals';
}

/**
 * Generate brand colors fallback
 */
function generateBrandColorsFallback(businessType: string): { primary: string; secondary: string; background: string } {
  const fallbackColors: Record<string, { primary: string; secondary: string; background: string }> = {
    'Restaurant': { primary: '#FF6B35', secondary: '#F7931E', background: '#FFF8F0' },
    'Healthcare': { primary: '#0EA5E9', secondary: '#10B981', background: '#F0F9FF' },
    'Fitness Gym': { primary: '#EF4444', secondary: '#F97316', background: '#FEF2F2' },
    'Beauty Salon': { primary: '#EC4899', secondary: '#A855F7', background: '#FDF2F8' },
    'Finance': { primary: '#1E40AF', secondary: '#059669', background: '#EFF6FF' },
    'Retail Store': { primary: '#7C3AED', secondary: '#DB2777', background: '#F5F3FF' },
    'Legal Services': { primary: '#374151', secondary: '#6B7280', background: '#F9FAFB' },
    'Technology': { primary: '#3B82F6', secondary: '#8B5CF6', background: '#EFF6FF' },
    'Education': { primary: '#059669', secondary: '#0891B2', background: '#ECFDF5' },
    'Automotive': { primary: '#DC2626', secondary: '#EA580C', background: '#FEF2F2' }
  };

  return fallbackColors[businessType] || { primary: '#1a73e8', secondary: '#34a853', background: '#ffffff' };
}

/**
 * Generate writing tone fallback
 */
function generateWritingToneFallback(businessType: string): string {
  const fallbackTones: Record<string, string> = {
    'Restaurant': 'friendly',
    'Healthcare': 'professional',
    'Fitness Gym': 'energetic',
    'Beauty Salon': 'elegant',
    'Finance': 'trustworthy',
    'Retail Store': 'trendy',
    'Legal Services': 'professional',
    'Technology': 'innovative',
    'Education': 'informative',
    'Automotive': 'reliable'
  };

  return fallbackTones[businessType] || 'professional';
}

/**
 * Generate brand voice fallback
 */
function generateBrandVoiceFallback(businessType: string): string {
  const fallbackVoices: Record<string, string> = {
    'Restaurant': 'warm and welcoming',
    'Healthcare': 'caring and professional',
    'Fitness Gym': 'motivating and energetic',
    'Beauty Salon': 'sophisticated and elegant',
    'Finance': 'trustworthy and reliable',
    'Retail Store': 'trendy and approachable',
    'Legal Services': 'authoritative and professional',
    'Technology': 'innovative and forward-thinking',
    'Education': 'knowledgeable and supportive',
    'Automotive': 'dependable and expert'
  };

  return fallbackVoices[businessType] || 'professional and reliable';
}

/**
 * Generate competitive advantages fallback
 */
function generateCompetitiveAdvantagesFallback(businessType: string): string[] {
  const fallbackAdvantages: Record<string, string[]> = {
    'Restaurant': ['Fresh local ingredients', 'Authentic recipes', 'Excellent customer service'],
    'Healthcare': ['Experienced medical professionals', 'Modern medical equipment', 'Comprehensive care'],
    'Fitness Gym': ['State-of-the-art equipment', 'Certified trainers', 'Flexible membership options'],
    'Beauty Salon': ['Skilled beauty professionals', 'Premium beauty products', 'Relaxing atmosphere'],
    'Finance': ['Competitive interest rates', 'Personalized financial advice', 'Secure transactions'],
    'Retail Store': ['Wide product selection', 'Competitive pricing', 'Excellent customer service'],
    'Legal Services': ['Experienced legal team', 'Proven track record', 'Personalized attention'],
    'Technology': ['Cutting-edge technology', 'Expert technical team', 'Reliable support'],
    'Education': ['Qualified instructors', 'Comprehensive curriculum', 'Practical learning approach'],
    'Automotive': ['Certified mechanics', 'Quality auto parts', 'Competitive pricing']
  };

  return fallbackAdvantages[businessType] || ['Professional expertise', 'Quality service', 'Customer satisfaction'];
}

/**
 * Generate unique selling points fallback
 */
function generateUniqueSellingPointsFallback(businessType: string): string[] {
  const fallbackUSPs: Record<string, string[]> = {
    'Restaurant': ['Family recipes passed down generations', 'Farm-to-table freshness'],
    'Healthcare': ['24/7 emergency care', 'Comprehensive health screenings'],
    'Fitness Gym': ['Personal training included', 'Results guarantee program'],
    'Beauty Salon': ['Organic beauty treatments', 'Customized beauty solutions'],
    'Finance': ['No hidden fees', 'Same-day loan approval'],
    'Retail Store': ['Exclusive designer collections', 'Price match guarantee'],
    'Legal Services': ['Free initial consultation', 'No win, no fee policy'],
    'Technology': ['24/7 technical support', 'Custom software solutions'],
    'Education': ['Job placement assistance', 'Industry-recognized certifications'],
    'Automotive': ['Lifetime warranty on repairs', 'Mobile service available']
  };

  return fallbackUSPs[businessType] || ['Exceptional service quality', 'Customer-first approach'];
}

/**
 * Generate description fallback
 */
function generateDescriptionFallback(businessName: string, businessType: string, services: string[]): string {
  const serviceText = services.length > 0 ? services.slice(0, 2).join(' and ') : 'quality services';

  const templates: Record<string, string> = {
    'Restaurant': `${businessName} offers exceptional dining with ${serviceText}. Quality ingredients and outstanding service.`,
    'Healthcare': `${businessName} provides comprehensive healthcare including ${serviceText}. Experienced professionals committed to your wellbeing.`,
    'Fitness Gym': `${businessName} is your fitness destination offering ${serviceText}. Achieve your goals with expert guidance.`,
    'Beauty Salon': `${businessName} delivers premium beauty services including ${serviceText}. Skilled professionals, finest products.`,
    'Finance': `${businessName} provides trusted financial services including ${serviceText}. Expert advice, reliable solutions.`,
    'Retail Store': `${businessName} offers exceptional shopping with ${serviceText}. Quality products, outstanding service.`,
    'Legal Services': `${businessName} provides professional legal services including ${serviceText}. Experienced attorneys, proven results.`,
    'Technology': `${businessName} delivers innovative solutions including ${serviceText}. Cutting-edge technology, expert support.`,
    'Education': `${businessName} offers comprehensive education including ${serviceText}. Practical skills for success.`,
    'Automotive': `${businessName} provides reliable automotive services including ${serviceText}. Certified technicians, peak performance.`
  };

  return templates[businessType] || `${businessName} provides professional ${serviceText} with quality and customer satisfaction.`;
}

// ============================================================================
// TASK 24: STANDARDIZE BRAND PROFILE DATA PROCESSING
// ============================================================================

/**
 * Standardized brand profile processing pipeline
 */
interface ProcessedBrandProfile {
  // Core identifiers
  businessName: string;
  businessType: string;
  location: string;

  // Business details
  services: string[];
  keyFeatures: string[];
  targetAudience: string;
  competitiveAdvantages: string[];
  uniqueSellingPoints: string[];
  description: string;

  // Brand identity
  brandColors: {
    primary: string;
    secondary: string;
    background: string;
    accent?: string;
  };
  brandVoice: string;
  writingTone: string;

  // Assets and contact
  logoUrl?: string;
  websiteUrl?: string;
  designExamples: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };

  // Processing metadata
  processingTimestamp: string;
  dataQualityScore: number;
  validationErrors: string[];
  normalizations: string[];
  fallbacksApplied: string[];
}

/**
 * Unified brand profile data processing pipeline
 */
export function processBrandProfileData(
  rawBrandProfile: any,
  options: {
    businessType?: string;
    location?: string;
    applyFallbacks?: boolean;
    validateData?: boolean;
    normalizeData?: boolean;
  } = {}
): ProcessedBrandProfile {
  const processingTimestamp = new Date().toISOString();
  const validationErrors: string[] = [];
  const normalizations: string[] = [];
  const fallbacksApplied: string[] = [];

  // Step 1: Input validation and sanitization
  const sanitizedProfile = sanitizeBrandProfileInput(rawBrandProfile, validationErrors);

  // Step 2: Data normalization
  const normalizedProfile = options.normalizeData !== false
    ? normalizeBrandProfileData(sanitizedProfile, normalizations)
    : sanitizedProfile;

  // Step 3: Apply intelligent fallbacks if enabled
  const enhancedProfile = options.applyFallbacks !== false
    ? applyBrandProfileFallbacks(normalizedProfile, options.businessType, options.location)
    : { ...normalizedProfile, fallbacksUsed: [] };

  if (enhancedProfile.fallbacksUsed) {
    fallbacksApplied.push(...enhancedProfile.fallbacksUsed);
  }

  // Step 4: Final validation and quality scoring
  const dataQualityScore = calculateDataQualityScore(enhancedProfile);

  // Step 5: Construct standardized profile
  const processedProfile: ProcessedBrandProfile = {
    // Core identifiers
    businessName: enhancedProfile.businessName || 'Business',
    businessType: enhancedProfile.businessType || 'Business',
    location: enhancedProfile.location || 'Global',

    // Business details
    services: Array.isArray(enhancedProfile.services) ? enhancedProfile.services : [],
    keyFeatures: Array.isArray(enhancedProfile.keyFeatures) ? enhancedProfile.keyFeatures : [],
    targetAudience: enhancedProfile.targetAudience || 'General public',
    competitiveAdvantages: Array.isArray(enhancedProfile.competitiveAdvantages) ? enhancedProfile.competitiveAdvantages : [],
    uniqueSellingPoints: Array.isArray(enhancedProfile.uniqueSellingPoints) ? enhancedProfile.uniqueSellingPoints : [],
    description: enhancedProfile.description || '',

    // Brand identity
    brandColors: {
      primary: enhancedProfile.brandColors?.primary || '#1a73e8',
      secondary: enhancedProfile.brandColors?.secondary || '#34a853',
      background: enhancedProfile.brandColors?.background || '#ffffff',
      accent: enhancedProfile.accentColor || enhancedProfile.brandColors?.accent
    },
    brandVoice: enhancedProfile.brandVoice || 'professional',
    writingTone: enhancedProfile.writingTone || 'professional',

    // Assets and contact
    logoUrl: enhancedProfile.logoUrl,
    websiteUrl: enhancedProfile.websiteUrl,
    designExamples: Array.isArray(enhancedProfile.designExamples) ? enhancedProfile.designExamples : [],
    contactInfo: enhancedProfile.contactInfo,

    // Processing metadata
    processingTimestamp,
    dataQualityScore,
    validationErrors,
    normalizations,
    fallbacksApplied
  };

  return processedProfile;
}

/**
 * Sanitize brand profile input data
 */
function sanitizeBrandProfileInput(rawProfile: any, validationErrors: string[]): any {
  if (!rawProfile || typeof rawProfile !== 'object') {
    validationErrors.push('Invalid brand profile: not an object');
    return {};
  }

  const sanitized: any = {};

  // Sanitize string fields
  const stringFields = ['businessName', 'businessType', 'location', 'targetAudience', 'brandVoice', 'writingTone', 'description', 'logoUrl', 'websiteUrl'];
  stringFields.forEach(field => {
    if (rawProfile[field] !== undefined && rawProfile[field] !== null) {
      if (typeof rawProfile[field] === 'string') {
        const trimmed = rawProfile[field].trim();
        if (trimmed.length > 0) {
          sanitized[field] = trimmed.length > 500 ? trimmed.substring(0, 500) + '...' : trimmed;
        }
      } else {
        validationErrors.push(`Invalid ${field}: expected string, got ${typeof rawProfile[field]}`);
      }
    }
  });

  // Sanitize array fields
  const arrayFields = ['services', 'keyFeatures', 'competitiveAdvantages', 'uniqueSellingPoints', 'designExamples'];
  arrayFields.forEach(field => {
    if (rawProfile[field] !== undefined && rawProfile[field] !== null) {
      if (Array.isArray(rawProfile[field])) {
        const sanitizedArray = rawProfile[field]
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any) => typeof item === 'string' ? item.trim() : String(item).trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20); // Limit array size

        if (sanitizedArray.length > 0) {
          sanitized[field] = sanitizedArray;
        }
      } else {
        validationErrors.push(`Invalid ${field}: expected array, got ${typeof rawProfile[field]}`);
      }
    }
  });

  // Sanitize brand colors
  if (rawProfile.brandColors && typeof rawProfile.brandColors === 'object') {
    const colors: any = {};
    const colorFields = ['primary', 'secondary', 'background', 'accent'];

    colorFields.forEach(colorField => {
      if (rawProfile.brandColors[colorField] && typeof rawProfile.brandColors[colorField] === 'string') {
        const color = rawProfile.brandColors[colorField].trim();
        if (color.match(/^#[0-9A-Fa-f]{6}$/) || color.match(/^#[0-9A-Fa-f]{3}$/)) {
          colors[colorField] = color;
        } else {
          validationErrors.push(`Invalid brand color ${colorField}: ${color}`);
        }
      }
    });

    if (Object.keys(colors).length > 0) {
      sanitized.brandColors = colors;
    }
  }

  // Sanitize contact info
  if (rawProfile.contactInfo && typeof rawProfile.contactInfo === 'object') {
    const contactInfo: any = {};

    if (rawProfile.contactInfo.phone && typeof rawProfile.contactInfo.phone === 'string') {
      contactInfo.phone = rawProfile.contactInfo.phone.trim();
    }

    if (rawProfile.contactInfo.email && typeof rawProfile.contactInfo.email === 'string') {
      const email = rawProfile.contactInfo.email.trim();
      if (email.includes('@')) {
        contactInfo.email = email;
      } else {
        validationErrors.push(`Invalid email format: ${email}`);
      }
    }

    if (rawProfile.contactInfo.address && typeof rawProfile.contactInfo.address === 'string') {
      contactInfo.address = rawProfile.contactInfo.address.trim();
    }

    if (Object.keys(contactInfo).length > 0) {
      sanitized.contactInfo = contactInfo;
    }
  }

  return sanitized;
}

/**
 * Normalize brand profile data
 */
function normalizeBrandProfileData(profile: any, normalizations: string[]): any {
  const normalized = { ...profile };

  // Normalize business type
  if (normalized.businessType) {
    const businessTypeMap: Record<string, string> = {
      'restaurant': 'Restaurant',
      'food': 'Restaurant',
      'dining': 'Restaurant',
      'cafe': 'Restaurant',
      'health': 'Healthcare',
      'medical': 'Healthcare',
      'clinic': 'Healthcare',
      'hospital': 'Healthcare',
      'fitness': 'Fitness Gym',
      'gym': 'Fitness Gym',
      'workout': 'Fitness Gym',
      'beauty': 'Beauty Salon',
      'salon': 'Beauty Salon',
      'spa': 'Beauty Salon',
      'finance': 'Finance',
      'bank': 'Finance',
      'financial': 'Finance',
      'retail': 'Retail Store',
      'shop': 'Retail Store',
      'store': 'Retail Store',
      'legal': 'Legal Services',
      'law': 'Legal Services',
      'attorney': 'Legal Services',
      'tech': 'Technology',
      'software': 'Technology',
      'it': 'Technology',
      'education': 'Education',
      'school': 'Education',
      'training': 'Education',
      'auto': 'Automotive',
      'car': 'Automotive',
      'automotive': 'Automotive'
    };

    const lowerType = String(normalized.businessType || 'general business').toLowerCase();
    for (const [key, value] of Object.entries(businessTypeMap)) {
      if (lowerType.includes(key)) {
        if (normalized.businessType !== value) {
          normalizations.push(`businessType: "${normalized.businessType}" → "${value}"`);
          normalized.businessType = value;
        }
        break;
      }
    }
  }

  // Normalize location format
  if (normalized.location) {
    // Capitalize first letter of each word
    const normalizedLocation = normalized.location
      .split(',')
      .map((part: string) => part.trim())
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(', ');

    if (normalized.location !== normalizedLocation) {
      normalizations.push(`location: "${normalized.location}" → "${normalizedLocation}"`);
      normalized.location = normalizedLocation;
    }
  }

  // Normalize writing tone
  if (normalized.writingTone) {
    const toneMap: Record<string, string> = {
      'casual': 'friendly',
      'informal': 'friendly',
      'formal': 'professional',
      'business': 'professional',
      'corporate': 'professional',
      'fun': 'energetic',
      'exciting': 'energetic',
      'sophisticated': 'elegant',
      'classy': 'elegant',
      'reliable': 'trustworthy',
      'dependable': 'trustworthy',
      'modern': 'innovative',
      'cutting-edge': 'innovative'
    };

    const lowerTone = normalized.writingTone.toLowerCase();
    if (toneMap[lowerTone] && normalized.writingTone !== toneMap[lowerTone]) {
      normalizations.push(`writingTone: "${normalized.writingTone}" → "${toneMap[lowerTone]}"`);
      normalized.writingTone = toneMap[lowerTone];
    }
  }

  // Normalize brand voice
  if (normalized.brandVoice) {
    const voiceMap: Record<string, string> = {
      'casual and friendly': 'warm and welcoming',
      'professional and reliable': 'trustworthy and reliable',
      'modern and innovative': 'innovative and forward-thinking',
      'elegant and sophisticated': 'sophisticated and elegant'
    };

    const lowerVoice = normalized.brandVoice.toLowerCase();
    if (voiceMap[lowerVoice] && normalized.brandVoice !== voiceMap[lowerVoice]) {
      normalizations.push(`brandVoice: "${normalized.brandVoice}" → "${voiceMap[lowerVoice]}"`);
      normalized.brandVoice = voiceMap[lowerVoice];
    }
  }

  // Normalize services (remove duplicates, standardize format)
  if (normalized.services && Array.isArray(normalized.services)) {
    const originalLength = normalized.services.length;
    const uniqueServices = [...new Set(normalized.services.map((s: string) =>
      s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    ))];

    if (originalLength !== uniqueServices.length) {
      normalizations.push(`services: removed ${originalLength - uniqueServices.length} duplicates`);
    }

    normalized.services = uniqueServices;
  }

  // Normalize key features (remove duplicates, standardize format)
  if (normalized.keyFeatures && Array.isArray(normalized.keyFeatures)) {
    const originalLength = normalized.keyFeatures.length;
    const uniqueFeatures = [...new Set(normalized.keyFeatures.map((f: string) =>
      f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()
    ))];

    if (originalLength !== uniqueFeatures.length) {
      normalizations.push(`keyFeatures: removed ${originalLength - uniqueFeatures.length} duplicates`);
    }

    normalized.keyFeatures = uniqueFeatures;
  }

  return normalized;
}

/**
 * Calculate data quality score for brand profile
 */
function calculateDataQualityScore(profile: any): number {
  let score = 0;
  let maxScore = 0;

  // Critical fields (40 points total)
  const criticalFields = [
    { field: 'businessName', weight: 15 },
    { field: 'businessType', weight: 15 },
    { field: 'location', weight: 10 }
  ];

  criticalFields.forEach(({ field, weight }) => {
    maxScore += weight;
    if (profile[field] && typeof profile[field] === 'string' && profile[field].trim().length > 0) {
      score += weight;
    }
  });

  // High importance fields (35 points total)
  const highImportanceFields = [
    { field: 'services', weight: 10, isArray: true },
    { field: 'keyFeatures', weight: 8, isArray: true },
    { field: 'targetAudience', weight: 7 },
    { field: 'brandColors', weight: 10, isObject: true }
  ];

  highImportanceFields.forEach(({ field, weight, isArray, isObject }) => {
    maxScore += weight;
    if (isArray && Array.isArray(profile[field]) && profile[field].length > 0) {
      score += weight;
    } else if (isObject && profile[field] && typeof profile[field] === 'object' && profile[field].primary) {
      score += weight;
    } else if (!isArray && !isObject && profile[field] && typeof profile[field] === 'string' && profile[field].trim().length > 0) {
      score += weight;
    }
  });

  // Medium importance fields (20 points total)
  const mediumImportanceFields = [
    { field: 'competitiveAdvantages', weight: 5, isArray: true },
    { field: 'uniqueSellingPoints', weight: 5, isArray: true },
    { field: 'brandVoice', weight: 5 },
    { field: 'writingTone', weight: 5 }
  ];

  mediumImportanceFields.forEach(({ field, weight, isArray }) => {
    maxScore += weight;
    if (isArray && Array.isArray(profile[field]) && profile[field].length > 0) {
      score += weight;
    } else if (!isArray && profile[field] && typeof profile[field] === 'string' && profile[field].trim().length > 0) {
      score += weight;
    }
  });

  // Low importance fields (5 points total)
  const lowImportanceFields = [
    { field: 'description', weight: 2 },
    { field: 'logoUrl', weight: 1 },
    { field: 'websiteUrl', weight: 1 },
    { field: 'designExamples', weight: 1, isArray: true }
  ];

  lowImportanceFields.forEach(({ field, weight, isArray }) => {
    maxScore += weight;
    if (isArray && Array.isArray(profile[field]) && profile[field].length > 0) {
      score += weight;
    } else if (!isArray && profile[field] && typeof profile[field] === 'string' && profile[field].trim().length > 0) {
      score += weight;
    }
  });

  return Math.round((score / maxScore) * 100);
}

// ============================================================================
// TASK 25: CREATE REUSABLE BUSINESS INTELLIGENCE FUNCTIONS
// ============================================================================

/**
 * Business intelligence context for content generation
 */
interface BusinessIntelligenceContext {
  businessType: string;
  location: string;
  services: string[];
  targetAudience: string;
  keyFeatures: string[];
  competitiveAdvantages: string[];
  brandVoice: string;
  writingTone: string;
}

/**
 * Generated business intelligence data
 */
interface BusinessIntelligence {
  engagementHooks: string[];
  painPoints: string[];
  valuePropositions: string[];
  emotionalTriggers: string[];
  industryInsights: string[];
  competitiveEdges: string[];
  callToActions: string[];
  culturalContext: {
    language: string;
    culturalReferences: string[];
    localContext: string[];
    communicationStyle: string;
  };
}

/**
 * Reusable business intelligence generator
 * Generates contextually appropriate business intelligence for any business type and location
 */
export function generateBusinessIntelligence(context: BusinessIntelligenceContext): BusinessIntelligence {
  return {
    engagementHooks: generateEngagementHooks(context),
    painPoints: generateIndustryPainPoints(context),
    valuePropositions: generateValuePropositions(context),
    emotionalTriggers: generateEmotionalTriggers(context),
    industryInsights: generateIndustryInsights(context),
    competitiveEdges: generateCompetitiveEdges(context),
    callToActions: generateContextualCTAs(context),
    culturalContext: generateCulturalContext(context.location, context.businessType)
  };
}

/**
 * Generate engagement hooks based on business context
 */
function generateEngagementHooks(context: BusinessIntelligenceContext): string[] {
  const businessTypeHooks: Record<string, string[]> = {
    'Restaurant': [
      'Craving authentic flavors?',
      'Hungry for something special?',
      'Ready for a culinary adventure?',
      'Taste the difference quality makes',
      'Where every meal tells a story'
    ],
    'Healthcare': [
      'Your health is our priority',
      'Expert care when you need it most',
      'Comprehensive healthcare solutions',
      'Taking care of your wellbeing',
      'Professional medical expertise'
    ],
    'Fitness Gym': [
      'Ready to transform your fitness?',
      'Achieve your fitness goals faster',
      'Unlock your potential',
      'Stronger starts here',
      'Your fitness journey begins now'
    ],
    'Beauty Salon': [
      'Ready to look and feel amazing?',
      'Discover your natural beauty',
      'Pamper yourself today',
      'Beauty that radiates confidence',
      'Transform your look, transform your day'
    ],
    'Finance': [
      'Secure your financial future',
      'Smart money decisions start here',
      'Financial freedom within reach',
      'Your trusted financial partner',
      'Building wealth, building dreams'
    ],
    'Retail Store': [
      'Discover something special',
      'Quality products, unbeatable value',
      'Find exactly what you need',
      'Shopping made simple',
      'Your style, your choice'
    ],
    'Legal Services': [
      'Protecting your rights',
      'Expert legal guidance',
      'Justice you can trust',
      'Legal solutions that work',
      'Your advocate in legal matters'
    ],
    'Technology': [
      'Innovation that transforms',
      'Technology solutions that work',
      'Digital transformation starts here',
      'Cutting-edge solutions',
      'Future-ready technology'
    ],
    'Education': [
      'Unlock your learning potential',
      'Knowledge that empowers',
      'Learn, grow, succeed',
      'Education that makes a difference',
      'Your path to success starts here'
    ],
    'Automotive': [
      'Keep your vehicle running smooth',
      'Expert automotive care',
      'Reliable service you can trust',
      'Your car deserves the best',
      'Professional automotive solutions'
    ]
  };

  const hooks = businessTypeHooks[context.businessType] || [
    'Quality service you can trust',
    'Professional solutions that work',
    'Excellence in everything we do',
    'Your success is our mission',
    'Experience the difference'
  ];

  // Personalize hooks based on services and features
  const personalizedHooks = hooks.map(hook => {
    if (context.keyFeatures.length > 0) {
      const feature = context.keyFeatures[0].toLowerCase();
      return hook.replace(/quality|professional|expert/i, feature);
    }
    return hook;
  });

  return personalizedHooks.slice(0, 3);
}

/**
 * Generate industry-specific pain points
 */
function generateIndustryPainPoints(context: BusinessIntelligenceContext): string[] {
  const businessTypePainPoints: Record<string, string[]> = {
    'Restaurant': [
      'Tired of bland, overpriced food?',
      'Long waits for mediocre meals?',
      'Searching for authentic flavors?',
      'Disappointed by poor service?',
      'Craving fresh, quality ingredients?'
    ],
    'Healthcare': [
      'Struggling with health concerns?',
      'Long wait times for appointments?',
      'Confused by complex medical processes?',
      'Need reliable healthcare advice?',
      'Worried about medical costs?'
    ],
    'Fitness Gym': [
      'Struggling to stay motivated?',
      'Not seeing fitness results?',
      'Intimidated by crowded gyms?',
      'Lack of proper guidance?',
      'Inconsistent workout routine?'
    ],
    'Beauty Salon': [
      'Tired of bad hair days?',
      'Struggling with skincare issues?',
      'Need professional beauty advice?',
      'Looking for relaxation time?',
      'Want to enhance your natural beauty?'
    ],
    'Finance': [
      'Worried about financial security?',
      'Confused by investment options?',
      'Struggling with debt management?',
      'Need better financial planning?',
      'Concerned about retirement savings?'
    ],
    'Retail Store': [
      'Can\'t find what you\'re looking for?',
      'Tired of poor quality products?',
      'Frustrated with high prices?',
      'Need better customer service?',
      'Want more shopping convenience?'
    ],
    'Legal Services': [
      'Facing legal challenges?',
      'Confused by legal procedures?',
      'Need expert legal advice?',
      'Worried about legal costs?',
      'Dealing with complex legal matters?'
    ],
    'Technology': [
      'Struggling with outdated systems?',
      'Need digital transformation?',
      'Facing technical challenges?',
      'Want to improve efficiency?',
      'Need reliable tech support?'
    ],
    'Education': [
      'Struggling to learn new skills?',
      'Need career advancement?',
      'Want practical knowledge?',
      'Looking for quality education?',
      'Need flexible learning options?'
    ],
    'Automotive': [
      'Car troubles disrupting your day?',
      'Worried about vehicle reliability?',
      'Need trustworthy mechanics?',
      'Facing unexpected repair costs?',
      'Want preventive maintenance?'
    ]
  };

  return businessTypePainPoints[context.businessType] || [
    'Facing challenges in your industry?',
    'Need reliable professional services?',
    'Looking for better solutions?',
    'Want to improve your situation?',
    'Seeking expert guidance?'
  ];
}

/**
 * Generate value propositions based on business context
 */
function generateValuePropositions(context: BusinessIntelligenceContext): string[] {
  const basePropositions = [
    `${context.services[0] || 'Our services'} that exceed expectations`,
    `${context.keyFeatures[0] || 'Quality'} you can count on`,
    `Trusted by ${context.targetAudience || 'customers'} everywhere`
  ];

  // Add competitive advantages as value propositions
  const competitiveProps = context.competitiveAdvantages.slice(0, 2).map(advantage =>
    `Experience the advantage of ${advantage.toLowerCase()}`
  );

  return [...basePropositions, ...competitiveProps].slice(0, 4);
}

/**
 * Generate emotional triggers based on business context
 */
function generateEmotionalTriggers(context: BusinessIntelligenceContext): string[] {
  const businessTypeEmotions: Record<string, string[]> = {
    'Restaurant': ['satisfaction', 'comfort', 'joy', 'nostalgia', 'community'],
    'Healthcare': ['security', 'trust', 'relief', 'hope', 'care'],
    'Fitness Gym': ['confidence', 'achievement', 'energy', 'transformation', 'strength'],
    'Beauty Salon': ['confidence', 'relaxation', 'self-love', 'transformation', 'elegance'],
    'Finance': ['security', 'confidence', 'peace of mind', 'prosperity', 'stability'],
    'Retail Store': ['excitement', 'satisfaction', 'discovery', 'value', 'style'],
    'Legal Services': ['security', 'justice', 'protection', 'peace of mind', 'trust'],
    'Technology': ['innovation', 'efficiency', 'progress', 'empowerment', 'success'],
    'Education': ['growth', 'achievement', 'empowerment', 'confidence', 'success'],
    'Automotive': ['reliability', 'safety', 'peace of mind', 'trust', 'convenience']
  };

  const emotions = businessTypeEmotions[context.businessType] || ['satisfaction', 'trust', 'confidence', 'success'];

  return emotions.map(emotion => `Feel the ${emotion} of choosing us`).slice(0, 3);
}

/**
 * Generate industry insights
 */
function generateIndustryInsights(context: BusinessIntelligenceContext): string[] {
  const businessTypeInsights: Record<string, string[]> = {
    'Restaurant': [
      'Fresh ingredients make all the difference',
      'Authentic recipes create memorable experiences',
      'Quality service enhances every meal'
    ],
    'Healthcare': [
      'Early prevention saves lives and costs',
      'Personalized care leads to better outcomes',
      'Expert diagnosis is crucial for treatment'
    ],
    'Fitness Gym': [
      'Consistency beats intensity in fitness',
      'Proper form prevents injuries',
      'Community support accelerates results'
    ],
    'Beauty Salon': [
      'Professional products deliver lasting results',
      'Skilled techniques enhance natural beauty',
      'Regular care maintains healthy appearance'
    ],
    'Finance': [
      'Diversification reduces investment risk',
      'Early planning maximizes compound growth',
      'Professional advice prevents costly mistakes'
    ],
    'Retail Store': [
      'Quality products provide lasting value',
      'Customer service builds loyalty',
      'Competitive pricing attracts smart shoppers'
    ],
    'Legal Services': [
      'Early legal advice prevents bigger problems',
      'Experienced representation improves outcomes',
      'Understanding your rights protects your interests'
    ],
    'Technology': [
      'Digital transformation drives business growth',
      'Reliable systems prevent costly downtime',
      'Innovation creates competitive advantages'
    ],
    'Education': [
      'Practical skills drive career advancement',
      'Continuous learning ensures relevance',
      'Quality education opens opportunities'
    ],
    'Automotive': [
      'Regular maintenance prevents major repairs',
      'Quality parts ensure vehicle longevity',
      'Expert service maintains safety standards'
    ]
  };

  return businessTypeInsights[context.businessType] || [
    'Professional expertise makes the difference',
    'Quality service builds lasting relationships',
    'Experience guides better decisions'
  ];
}

/**
 * Generate competitive edges based on context
 */
function generateCompetitiveEdges(context: BusinessIntelligenceContext): string[] {
  const edges = [];

  // Use competitive advantages from profile
  if (context.competitiveAdvantages.length > 0) {
    edges.push(...context.competitiveAdvantages.slice(0, 2));
  }

  // Add business-type-specific edges
  const businessTypeEdges: Record<string, string[]> = {
    'Restaurant': ['Farm-to-table freshness', 'Authentic family recipes'],
    'Healthcare': ['24/7 availability', 'Comprehensive care approach'],
    'Fitness Gym': ['Personal attention', 'Results-driven programs'],
    'Beauty Salon': ['Premium products', 'Skilled professionals'],
    'Finance': ['Personalized strategies', 'Transparent pricing'],
    'Retail Store': ['Curated selection', 'Exceptional service'],
    'Legal Services': ['Proven track record', 'Client-focused approach'],
    'Technology': ['Cutting-edge solutions', '24/7 support'],
    'Education': ['Industry-relevant curriculum', 'Experienced instructors'],
    'Automotive': ['Certified technicians', 'Quality guarantee']
  };

  const typeEdges = businessTypeEdges[context.businessType] || ['Professional expertise', 'Customer satisfaction'];
  edges.push(...typeEdges);

  return [...new Set(edges)].slice(0, 3);
}

/**
 * Generate contextual call-to-actions
 */
function generateContextualCTAs(context: BusinessIntelligenceContext): string[] {
  const businessTypeCTAs: Record<string, string[]> = {
    'Restaurant': ['Book Your Table', 'Order Now', 'Taste the Difference', 'Reserve Today'],
    'Healthcare': ['Schedule Appointment', 'Get Care Now', 'Book Consultation', 'Start Treatment'],
    'Fitness Gym': ['Start Your Journey', 'Join Today', 'Get Fit Now', 'Begin Training'],
    'Beauty Salon': ['Book Appointment', 'Pamper Yourself', 'Look Amazing', 'Schedule Service'],
    'Finance': ['Get Started', 'Secure Future', 'Plan Today', 'Invest Now'],
    'Retail Store': ['Shop Now', 'Discover More', 'Find Yours', 'Browse Collection'],
    'Legal Services': ['Get Legal Help', 'Schedule Consultation', 'Protect Rights', 'Contact Us'],
    'Technology': ['Get Solution', 'Start Today', 'Upgrade Now', 'Contact Expert'],
    'Education': ['Enroll Now', 'Start Learning', 'Join Course', 'Begin Journey'],
    'Automotive': ['Book Service', 'Get Quote', 'Schedule Repair', 'Contact Us']
  };

  return businessTypeCTAs[context.businessType] || ['Get Started', 'Contact Us', 'Learn More', 'Try Now'];
}

/**
 * Generate cultural context based on location
 */
function generateCulturalContext(location: string, businessType: string): {
  language: string;
  culturalReferences: string[];
  localContext: string[];
  communicationStyle: string;
} {
  const locationLower = location.toLowerCase();

  // Determine primary language and cultural context
  let language = 'English';
  let culturalReferences: string[] = [];
  let localContext: string[] = [];
  let communicationStyle = 'professional';

  // African countries
  if (locationLower.includes('kenya')) {
    language = 'English with Swahili influences';
    culturalReferences = ['community spirit', 'ubuntu philosophy', 'local traditions'];
    localContext = ['local markets', 'community gatherings', 'family values'];
    communicationStyle = 'warm and community-focused';
  } else if (locationLower.includes('nigeria')) {
    language = 'English with local expressions';
    culturalReferences = ['community bonds', 'entrepreneurial spirit', 'cultural diversity'];
    localContext = ['local businesses', 'community support', 'family networks'];
    communicationStyle = 'energetic and community-oriented';
  } else if (locationLower.includes('ghana')) {
    language = 'English with local flavor';
    culturalReferences = ['hospitality', 'community values', 'cultural heritage'];
    localContext = ['local traditions', 'community events', 'family connections'];
    communicationStyle = 'friendly and welcoming';
  } else if (locationLower.includes('south africa')) {
    language = 'English with multicultural influences';
    culturalReferences = ['diversity', 'rainbow nation', 'ubuntu'];
    localContext = ['diverse communities', 'local businesses', 'cultural exchange'];
    communicationStyle = 'inclusive and diverse';
  }

  // European countries
  else if (locationLower.includes('uk') || locationLower.includes('britain') || locationLower.includes('england')) {
    language = 'British English';
    culturalReferences = ['tradition', 'quality', 'heritage'];
    localContext = ['local communities', 'high street', 'traditional values'];
    communicationStyle = 'polite and professional';
  } else if (locationLower.includes('germany')) {
    language = 'English with German precision';
    culturalReferences = ['efficiency', 'quality', 'reliability'];
    localContext = ['precision engineering', 'quality standards', 'systematic approach'];
    communicationStyle = 'direct and efficient';
  } else if (locationLower.includes('france')) {
    language = 'English with French elegance';
    culturalReferences = ['elegance', 'sophistication', 'artistry'];
    localContext = ['cultural refinement', 'artistic heritage', 'quality craftsmanship'];
    communicationStyle = 'sophisticated and refined';
  }

  // American countries
  else if (locationLower.includes('usa') || locationLower.includes('america') || locationLower.includes('united states')) {
    language = 'American English';
    culturalReferences = ['innovation', 'entrepreneurship', 'opportunity'];
    localContext = ['local communities', 'business innovation', 'customer service'];
    communicationStyle = 'confident and direct';
  } else if (locationLower.includes('canada')) {
    language = 'Canadian English';
    culturalReferences = ['politeness', 'multiculturalism', 'community'];
    localContext = ['diverse communities', 'quality service', 'friendly approach'];
    communicationStyle = 'polite and inclusive';
  }

  // Asian countries
  else if (locationLower.includes('japan')) {
    language = 'English with Japanese courtesy';
    culturalReferences = ['respect', 'quality', 'attention to detail'];
    localContext = ['meticulous service', 'quality focus', 'customer respect'];
    communicationStyle = 'respectful and detail-oriented';
  } else if (locationLower.includes('singapore')) {
    language = 'English with multicultural blend';
    culturalReferences = ['efficiency', 'multiculturalism', 'innovation'];
    localContext = ['diverse community', 'business efficiency', 'modern approach'];
    communicationStyle = 'efficient and multicultural';
  }

  // Australian/Oceania
  else if (locationLower.includes('australia')) {
    language = 'Australian English';
    culturalReferences = ['laid-back attitude', 'quality lifestyle', 'community spirit'];
    localContext = ['local communities', 'quality living', 'friendly service'];
    communicationStyle = 'friendly and relaxed';
  }

  // Adapt context based on business type
  if (businessType === 'Restaurant') {
    localContext = localContext.map(ctx => ctx.replace(/business|service/, 'dining'));
  } else if (businessType === 'Healthcare') {
    communicationStyle = 'caring and professional';
  } else if (businessType === 'Fitness Gym') {
    communicationStyle = 'motivating and energetic';
  }

  return {
    language,
    culturalReferences,
    localContext,
    communicationStyle
  };
}

/**
 * Helper function to get business intelligence for specific use cases
 */
export function getBusinessIntelligenceForContent(
  businessType: string,
  location: string,
  services: string[],
  targetAudience: string,
  keyFeatures: string[],
  competitiveAdvantages: string[],
  brandVoice: string,
  writingTone: string
): BusinessIntelligence {
  const context: BusinessIntelligenceContext = {
    businessType,
    location,
    services,
    targetAudience,
    keyFeatures,
    competitiveAdvantages,
    brandVoice,
    writingTone
  };

  return generateBusinessIntelligence(context);
}

/**
 * Helper function to get specific business intelligence elements
 */
export function getBusinessIntelligenceElement(
  elementType: 'hooks' | 'painPoints' | 'valueProps' | 'emotions' | 'insights' | 'edges' | 'ctas' | 'cultural',
  context: BusinessIntelligenceContext
): string[] | object {
  switch (elementType) {
    case 'hooks':
      return generateEngagementHooks(context);
    case 'painPoints':
      return generateIndustryPainPoints(context);
    case 'valueProps':
      return generateValuePropositions(context);
    case 'emotions':
      return generateEmotionalTriggers(context);
    case 'insights':
      return generateIndustryInsights(context);
    case 'edges':
      return generateCompetitiveEdges(context);
    case 'ctas':
      return generateContextualCTAs(context);
    case 'cultural':
      return generateCulturalContext(context.location, context.businessType);
    default:
      return [];
  }
}

// ============================================================================
// TASK 26: IMPLEMENT CONSISTENT ERROR HANDLING
// ============================================================================

/**
 * Error categories for business intelligence and content generation
 */
enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  DATA_PROCESSING = 'DATA_PROCESSING',
  BUSINESS_INTELLIGENCE = 'BUSINESS_INTELLIGENCE',
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  SYSTEM = 'SYSTEM'
}

/**
 * Error severity levels
 */
enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Standardized error interface
 */
interface BusinessIntelligenceError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: {
    businessType?: string;
    location?: string;
    function?: string;
    input?: any;
  };
  recoveryStrategy?: string;
  fallbackApplied?: boolean;
}

/**
 * Error handling result
 */
interface ErrorHandlingResult<T> {
  success: boolean;
  data?: T;
  error?: BusinessIntelligenceError;
  fallbackData?: T;
  warnings?: string[];
}

/**
 * Centralized error handler for business intelligence operations
 */
class BusinessIntelligenceErrorHandler {
  private static instance: BusinessIntelligenceErrorHandler;
  private errorLog: BusinessIntelligenceError[] = [];

  static getInstance(): BusinessIntelligenceErrorHandler {
    if (!BusinessIntelligenceErrorHandler.instance) {
      BusinessIntelligenceErrorHandler.instance = new BusinessIntelligenceErrorHandler();
    }
    return BusinessIntelligenceErrorHandler.instance;
  }

  /**
   * Handle errors with automatic recovery strategies
   */
  handleError<T>(
    error: Error | BusinessIntelligenceError,
    context: {
      category: ErrorCategory;
      severity: ErrorSeverity;
      function: string;
      input?: any;
      businessType?: string;
      location?: string;
    },
    fallbackFunction?: () => T
  ): ErrorHandlingResult<T> {
    const biError: BusinessIntelligenceError = this.normalizeError(error, context);
    this.logError(biError);

    // Apply recovery strategy
    const recoveryResult = this.applyRecoveryStrategy(biError, fallbackFunction);

    return {
      success: recoveryResult.success,
      data: recoveryResult.data,
      error: biError,
      fallbackData: recoveryResult.fallbackData,
      warnings: recoveryResult.warnings
    };
  }

  /**
   * Normalize different error types to BusinessIntelligenceError
   */
  private normalizeError(
    error: Error | BusinessIntelligenceError,
    context: {
      category: ErrorCategory;
      severity: ErrorSeverity;
      function: string;
      input?: any;
      businessType?: string;
      location?: string;
    }
  ): BusinessIntelligenceError {
    if ('category' in error && 'severity' in error) {
      return error as BusinessIntelligenceError;
    }

    const standardError = error as Error;
    return {
      category: context.category,
      severity: context.severity,
      code: this.generateErrorCode(context.category, context.function),
      message: standardError.message || 'Unknown error occurred',
      details: standardError.stack,
      timestamp: new Date().toISOString(),
      context: {
        businessType: context.businessType,
        location: context.location,
        function: context.function,
        input: context.input
      },
      recoveryStrategy: this.determineRecoveryStrategy(context.category, context.severity),
      fallbackApplied: false
    };
  }

  /**
   * Generate standardized error codes
   */
  private generateErrorCode(category: ErrorCategory, functionName: string): string {
    const timestamp = Date.now().toString().slice(-6);
    return `${category}_${functionName.toUpperCase()}_${timestamp}`;
  }

  /**
   * Determine appropriate recovery strategy
   */
  private determineRecoveryStrategy(category: ErrorCategory, severity: ErrorSeverity): string {
    const strategies: Record<ErrorCategory, Record<ErrorSeverity, string>> = {
      [ErrorCategory.VALIDATION]: {
        [ErrorSeverity.LOW]: 'Use default values and continue',
        [ErrorSeverity.MEDIUM]: 'Apply data sanitization and retry',
        [ErrorSeverity.HIGH]: 'Use fallback data source',
        [ErrorSeverity.CRITICAL]: 'Abort operation and notify user'
      },
      [ErrorCategory.DATA_PROCESSING]: {
        [ErrorSeverity.LOW]: 'Skip invalid data and continue',
        [ErrorSeverity.MEDIUM]: 'Apply data normalization and retry',
        [ErrorSeverity.HIGH]: 'Use cached or fallback data',
        [ErrorSeverity.CRITICAL]: 'Abort processing and use emergency fallback'
      },
      [ErrorCategory.BUSINESS_INTELLIGENCE]: {
        [ErrorSeverity.LOW]: 'Use generic business intelligence',
        [ErrorSeverity.MEDIUM]: 'Apply business-type fallback',
        [ErrorSeverity.HIGH]: 'Use minimal intelligence set',
        [ErrorSeverity.CRITICAL]: 'Use emergency static content'
      },
      [ErrorCategory.CONTENT_GENERATION]: {
        [ErrorSeverity.LOW]: 'Use alternative content template',
        [ErrorSeverity.MEDIUM]: 'Apply simplified content generation',
        [ErrorSeverity.HIGH]: 'Use cached content or template',
        [ErrorSeverity.CRITICAL]: 'Use emergency static content'
      },
      [ErrorCategory.EXTERNAL_SERVICE]: {
        [ErrorSeverity.LOW]: 'Retry with exponential backoff',
        [ErrorSeverity.MEDIUM]: 'Use alternative service endpoint',
        [ErrorSeverity.HIGH]: 'Use cached data or offline mode',
        [ErrorSeverity.CRITICAL]: 'Abort external operation and use local fallback'
      },
      [ErrorCategory.SYSTEM]: {
        [ErrorSeverity.LOW]: 'Log error and continue',
        [ErrorSeverity.MEDIUM]: 'Restart component and retry',
        [ErrorSeverity.HIGH]: 'Use degraded mode operation',
        [ErrorSeverity.CRITICAL]: 'Initiate emergency shutdown procedure'
      }
    };

    return strategies[category]?.[severity] || 'Apply generic error recovery';
  }

  /**
   * Apply recovery strategy
   */
  private applyRecoveryStrategy<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    const warnings: string[] = [];

    try {
      // Apply category-specific recovery
      switch (error.category) {
        case ErrorCategory.VALIDATION:
          return this.handleValidationError(error, fallbackFunction, warnings);

        case ErrorCategory.DATA_PROCESSING:
          return this.handleDataProcessingError(error, fallbackFunction, warnings);

        case ErrorCategory.BUSINESS_INTELLIGENCE:
          return this.handleBusinessIntelligenceError(error, fallbackFunction, warnings);

        case ErrorCategory.CONTENT_GENERATION:
          return this.handleContentGenerationError(error, fallbackFunction, warnings);

        case ErrorCategory.EXTERNAL_SERVICE:
          return this.handleExternalServiceError(error, fallbackFunction, warnings);

        case ErrorCategory.SYSTEM:
          return this.handleSystemError(error, fallbackFunction, warnings);

        default:
          warnings.push('Unknown error category, applying generic recovery');
          return this.applyGenericRecovery(error, fallbackFunction, warnings);
      }
    } catch (recoveryError) {
      warnings.push(`Recovery strategy failed: ${recoveryError.message}`);
      return this.applyGenericRecovery(error, fallbackFunction, warnings);
    }
  }

  /**
   * Handle validation errors
   */
  private handleValidationError<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (error.severity === ErrorSeverity.CRITICAL) {
      warnings.push('Critical validation error, operation aborted');
      return { success: false, warnings };
    }

    if (fallbackFunction) {
      try {
        const fallbackData = fallbackFunction();
        warnings.push('Validation error recovered using fallback data');
        error.fallbackApplied = true;
        return { success: true, fallbackData, warnings };
      } catch (fallbackError) {
        warnings.push(`Fallback function failed: ${fallbackError.message}`);
      }
    }

    warnings.push('Validation error, continuing with default behavior');
    return { success: true, warnings };
  }

  /**
   * Handle data processing errors
   */
  private handleDataProcessingError<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (fallbackFunction) {
      try {
        const fallbackData = fallbackFunction();
        warnings.push('Data processing error recovered using fallback');
        error.fallbackApplied = true;
        return { success: true, fallbackData, warnings };
      } catch (fallbackError) {
        warnings.push(`Data processing fallback failed: ${fallbackError.message}`);
      }
    }

    warnings.push('Data processing error, using minimal data set');
    return { success: true, warnings };
  }

  /**
   * Handle business intelligence errors
   */
  private handleBusinessIntelligenceError<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (fallbackFunction) {
      try {
        const fallbackData = fallbackFunction();
        warnings.push('Business intelligence error recovered using fallback');
        error.fallbackApplied = true;
        return { success: true, fallbackData, warnings };
      } catch (fallbackError) {
        warnings.push(`Business intelligence fallback failed: ${fallbackError.message}`);
      }
    }

    // Provide minimal business intelligence
    const minimalIntelligence = {
      engagementHooks: ['Quality service you can trust'],
      painPoints: ['Looking for reliable solutions?'],
      valuePropositions: ['Professional service that delivers'],
      callToActions: ['Contact Us', 'Learn More']
    } as T;

    warnings.push('Using minimal business intelligence due to error');
    error.fallbackApplied = true;
    return { success: true, fallbackData: minimalIntelligence, warnings };
  }

  /**
   * Handle content generation errors
   */
  private handleContentGenerationError<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (fallbackFunction) {
      try {
        const fallbackData = fallbackFunction();
        warnings.push('Content generation error recovered using fallback');
        error.fallbackApplied = true;
        return { success: true, fallbackData, warnings };
      } catch (fallbackError) {
        warnings.push(`Content generation fallback failed: ${fallbackError.message}`);
      }
    }

    warnings.push('Content generation error, using template content');
    return { success: true, warnings };
  }

  /**
   * Handle external service errors
   */
  private handleExternalServiceError<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (error.severity === ErrorSeverity.CRITICAL) {
      warnings.push('Critical external service error, using offline mode');
      if (fallbackFunction) {
        try {
          const fallbackData = fallbackFunction();
          error.fallbackApplied = true;
          return { success: true, fallbackData, warnings };
        } catch (fallbackError) {
          warnings.push(`Offline fallback failed: ${fallbackError.message}`);
        }
      }
      return { success: false, warnings };
    }

    warnings.push('External service error, retrying with fallback');
    return { success: true, warnings };
  }

  /**
   * Handle system errors
   */
  private handleSystemError<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (error.severity === ErrorSeverity.CRITICAL) {
      warnings.push('Critical system error detected');
      return { success: false, warnings };
    }

    if (fallbackFunction) {
      try {
        const fallbackData = fallbackFunction();
        warnings.push('System error recovered using fallback');
        error.fallbackApplied = true;
        return { success: true, fallbackData, warnings };
      } catch (fallbackError) {
        warnings.push(`System fallback failed: ${fallbackError.message}`);
      }
    }

    warnings.push('System error, continuing with degraded functionality');
    return { success: true, warnings };
  }

  /**
   * Apply generic recovery strategy
   */
  private applyGenericRecovery<T>(
    error: BusinessIntelligenceError,
    fallbackFunction?: () => T,
    warnings: string[] = []
  ): { success: boolean; data?: T; fallbackData?: T; warnings: string[] } {
    if (fallbackFunction) {
      try {
        const fallbackData = fallbackFunction();
        warnings.push('Generic recovery applied using fallback');
        error.fallbackApplied = true;
        return { success: true, fallbackData, warnings };
      } catch (fallbackError) {
        warnings.push(`Generic fallback failed: ${fallbackError.message}`);
      }
    }

    warnings.push('Generic recovery applied, continuing with limited functionality');
    return { success: true, warnings };
  }

  /**
   * Log error to internal error log
   */
  private logError(error: BusinessIntelligenceError): void {
    this.errorLog.push(error);

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console based on severity
    const logMessage = `[${error.severity}] ${error.category}: ${error.message} (${error.code})`;

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.log(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(logMessage);
        break;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: BusinessIntelligenceError[];
  } {
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10)
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Utility functions for consistent error handling
 */

/**
 * Safe execution wrapper with error handling
 */
export function safeExecute<T>(
  operation: () => T,
  context: {
    category: ErrorCategory;
    severity: ErrorSeverity;
    function: string;
    businessType?: string;
    location?: string;
  },
  fallbackFunction?: () => T
): ErrorHandlingResult<T> {
  const errorHandler = BusinessIntelligenceErrorHandler.getInstance();

  try {
    const result = operation();
    return {
      success: true,
      data: result,
      warnings: []
    };
  } catch (error) {
    return errorHandler.handleError(error as Error, context, fallbackFunction);
  }
}

/**
 * Create standardized error
 */
export function createBusinessIntelligenceError(
  category: ErrorCategory,
  severity: ErrorSeverity,
  message: string,
  context?: {
    businessType?: string;
    location?: string;
    function?: string;
    details?: any;
  }
): BusinessIntelligenceError {
  return {
    category,
    severity,
    code: `${category}_${context?.function?.toUpperCase() || 'UNKNOWN'}_${Date.now().toString().slice(-6)}`,
    message,
    details: context?.details,
    timestamp: new Date().toISOString(),
    context: context ? {
      businessType: context.businessType,
      location: context.location,
      function: context.function
    } : undefined,
    recoveryStrategy: 'Apply appropriate recovery based on category and severity',
    fallbackApplied: false
  };
}

// ============================================================================
// TASK 27: CREATE UNIFIED GLOBAL CULTURAL CONTEXT APPROACH
// ============================================================================

/**
 * Comprehensive cultural context data structure
 */
interface GlobalCulturalContext {
  region: string;
  country: string;
  primaryLanguage: string;
  secondaryLanguages: string[];
  communicationStyle: string;
  businessEtiquette: string;
  culturalValues: string[];
  localReferences: string[];
  marketingApproach: string;
  colorPreferences: {
    preferred: string[];
    avoided: string[];
    meanings: Record<string, string>;
  };
  timeFormat: '12h' | '24h';
  dateFormat: string;
  currency: {
    symbol: string;
    code: string;
    position: 'before' | 'after';
  };
  businessHours: {
    weekdays: string;
    weekends: string;
    timezone: string;
  };
  holidays: string[];
  socialNorms: string[];
  contentTone: string;
  trustBuilders: string[];
  localCompetitors: string[];
}

/**
 * Cultural intelligence patterns for different regions
 */
const GLOBAL_CULTURAL_PATTERNS: Record<string, GlobalCulturalContext> = {
  // African Countries
  'kenya': {
    region: 'East Africa',
    country: 'Kenya',
    primaryLanguage: 'English',
    secondaryLanguages: ['Swahili', 'Kikuyu', 'Luo'],
    communicationStyle: 'warm and community-focused',
    businessEtiquette: 'relationship-first, respectful greetings',
    culturalValues: ['ubuntu', 'community spirit', 'family bonds', 'respect for elders'],
    localReferences: ['matatu', 'boda boda', 'nyama choma', 'harambee'],
    marketingApproach: 'community-centered, family-focused, value-driven',
    colorPreferences: {
      preferred: ['green', 'red', 'black', 'gold'],
      avoided: ['purple'],
      meanings: { 'green': 'prosperity', 'red': 'strength', 'black': 'heritage' }
    },
    timeFormat: '12h',
    dateFormat: 'DD/MM/YYYY',
    currency: { symbol: 'KSh', code: 'KES', position: 'before' },
    businessHours: { weekdays: '8:00-17:00', weekends: '9:00-13:00', timezone: 'EAT' },
    holidays: ['Jamhuri Day', 'Mashujaa Day', 'Madaraka Day'],
    socialNorms: ['respect for authority', 'community consultation', 'hospitality'],
    contentTone: 'conversational with Sheng influences',
    trustBuilders: ['local testimonials', 'community endorsements', 'family references'],
    localCompetitors: ['Safaricom', 'Equity Bank', 'KCB']
  },
  'nigeria': {
    region: 'West Africa',
    country: 'Nigeria',
    primaryLanguage: 'English',
    secondaryLanguages: ['Hausa', 'Yoruba', 'Igbo', 'Pidgin'],
    communicationStyle: 'energetic and expressive',
    businessEtiquette: 'hierarchical respect, extended greetings',
    culturalValues: ['entrepreneurship', 'education', 'family success', 'community support'],
    localReferences: ['Nollywood', 'jollof rice', 'Lagos hustle', 'Abuja'],
    marketingApproach: 'aspirational, success-focused, community-driven',
    colorPreferences: {
      preferred: ['green', 'white', 'gold', 'blue'],
      avoided: ['black for celebrations'],
      meanings: { 'green': 'agriculture', 'white': 'peace', 'gold': 'wealth' }
    },
    timeFormat: '12h',
    dateFormat: 'DD/MM/YYYY',
    currency: { symbol: '₦', code: 'NGN', position: 'before' },
    businessHours: { weekdays: '8:00-17:00', weekends: '10:00-14:00', timezone: 'WAT' },
    holidays: ['Independence Day', 'Democracy Day', 'Eid festivals'],
    socialNorms: ['respect for elders', 'extended family importance', 'religious observance'],
    contentTone: 'enthusiastic with local expressions',
    trustBuilders: ['success stories', 'celebrity endorsements', 'peer recommendations'],
    localCompetitors: ['GTBank', 'Dangote', 'MTN Nigeria']
  },
  'ghana': {
    region: 'West Africa',
    country: 'Ghana',
    primaryLanguage: 'English',
    secondaryLanguages: ['Twi', 'Ga', 'Ewe', 'Dagbani'],
    communicationStyle: 'friendly and diplomatic',
    businessEtiquette: 'polite, patient, relationship-building',
    culturalValues: ['hospitality', 'peace', 'cultural heritage', 'education'],
    localReferences: ['Accra', 'kente cloth', 'highlife music', 'fufu'],
    marketingApproach: 'heritage-focused, peaceful, community-oriented',
    colorPreferences: {
      preferred: ['red', 'gold', 'green', 'black'],
      avoided: ['white for mourning'],
      meanings: { 'red': 'bloodshed for independence', 'gold': 'mineral wealth', 'green': 'forests' }
    },
    timeFormat: '12h',
    dateFormat: 'DD/MM/YYYY',
    currency: { symbol: 'GH₵', code: 'GHS', position: 'before' },
    businessHours: { weekdays: '8:00-17:00', weekends: '9:00-13:00', timezone: 'GMT' },
    holidays: ['Independence Day', 'Republic Day', 'Farmers Day'],
    socialNorms: ['respect for chiefs', 'communal decision making', 'hospitality to strangers'],
    contentTone: 'warm and respectful',
    trustBuilders: ['traditional endorsements', 'community leaders', 'cultural symbols'],
    localCompetitors: ['MTN Ghana', 'Vodafone Ghana', 'GCB Bank']
  },
  'south_africa': {
    region: 'Southern Africa',
    country: 'South Africa',
    primaryLanguage: 'English',
    secondaryLanguages: ['Afrikaans', 'Zulu', 'Xhosa', 'Sotho'],
    communicationStyle: 'direct but respectful',
    businessEtiquette: 'punctual, professional, multicultural awareness',
    culturalValues: ['ubuntu', 'diversity', 'transformation', 'reconciliation'],
    localReferences: ['braai', 'rugby', 'Cape Town', 'Johannesburg'],
    marketingApproach: 'inclusive, diverse, transformation-focused',
    colorPreferences: {
      preferred: ['rainbow colors', 'gold', 'green', 'blue'],
      avoided: ['none specifically'],
      meanings: { 'rainbow': 'diversity', 'gold': 'mineral wealth', 'green': 'land' }
    },
    timeFormat: '24h',
    dateFormat: 'YYYY/MM/DD',
    currency: { symbol: 'R', code: 'ZAR', position: 'before' },
    businessHours: { weekdays: '8:00-17:00', weekends: '9:00-13:00', timezone: 'SAST' },
    holidays: ['Freedom Day', 'Heritage Day', 'Human Rights Day'],
    socialNorms: ['multicultural respect', 'ubuntu philosophy', 'transformation support'],
    contentTone: 'inclusive and professional',
    trustBuilders: ['diverse testimonials', 'transformation credentials', 'community impact'],
    localCompetitors: ['Standard Bank', 'FNB', 'Shoprite']
  },

  // North American Countries
  'usa': {
    region: 'North America',
    country: 'United States',
    primaryLanguage: 'English',
    secondaryLanguages: ['Spanish', 'Chinese', 'French'],
    communicationStyle: 'direct and confident',
    businessEtiquette: 'punctual, results-oriented, individual achievement',
    culturalValues: ['innovation', 'entrepreneurship', 'individual success', 'efficiency'],
    localReferences: ['American Dream', 'Main Street', 'hometown', 'local community'],
    marketingApproach: 'benefit-focused, competitive, innovation-driven',
    colorPreferences: {
      preferred: ['blue', 'red', 'white', 'green'],
      avoided: ['none specifically'],
      meanings: { 'blue': 'trust', 'red': 'energy', 'white': 'purity', 'green': 'money' }
    },
    timeFormat: '12h',
    dateFormat: 'MM/DD/YYYY',
    currency: { symbol: '$', code: 'USD', position: 'before' },
    businessHours: { weekdays: '9:00-17:00', weekends: '10:00-18:00', timezone: 'varies' },
    holidays: ['Independence Day', 'Thanksgiving', 'Memorial Day'],
    socialNorms: ['individual achievement', 'time consciousness', 'direct communication'],
    contentTone: 'confident and direct',
    trustBuilders: ['reviews and ratings', 'certifications', 'guarantees'],
    localCompetitors: ['varies by industry']
  },
  'canada': {
    region: 'North America',
    country: 'Canada',
    primaryLanguage: 'English',
    secondaryLanguages: ['French', 'Chinese', 'Punjabi'],
    communicationStyle: 'polite and inclusive',
    businessEtiquette: 'courteous, multicultural sensitivity, consensus-building',
    culturalValues: ['multiculturalism', 'politeness', 'equality', 'environmental consciousness'],
    localReferences: ['Tim Hortons', 'hockey', 'maple syrup', 'the Great White North'],
    marketingApproach: 'inclusive, environmentally conscious, community-focused',
    colorPreferences: {
      preferred: ['red', 'white', 'blue', 'green'],
      avoided: ['none specifically'],
      meanings: { 'red': 'Canada', 'white': 'peace', 'blue': 'loyalty', 'green': 'environment' }
    },
    timeFormat: '12h',
    dateFormat: 'DD/MM/YYYY',
    currency: { symbol: '$', code: 'CAD', position: 'before' },
    businessHours: { weekdays: '9:00-17:00', weekends: '10:00-17:00', timezone: 'varies' },
    holidays: ['Canada Day', 'Victoria Day', 'Thanksgiving'],
    socialNorms: ['politeness', 'multiculturalism', 'environmental awareness'],
    contentTone: 'polite and inclusive',
    trustBuilders: ['community involvement', 'environmental credentials', 'inclusivity'],
    localCompetitors: ['varies by province']
  }
};

/**
 * Unified global cultural context generator
 */
export function getGlobalCulturalContext(location: string, businessType?: string): GlobalCulturalContext {
  const locationKey = detectLocationKey(location);
  const baseContext = GLOBAL_CULTURAL_PATTERNS[locationKey];

  if (!baseContext) {
    return getDefaultCulturalContext(location, businessType);
  }

  // Adapt context based on business type if provided
  if (businessType) {
    return adaptContextForBusinessType(baseContext, businessType);
  }

  return baseContext;
}

/**
 * Detect location key from location string
 */
function detectLocationKey(location: string): string {
  const locationLower = location.toLowerCase();

  // African countries
  if (locationLower.includes('kenya') || locationLower.includes('nairobi') || locationLower.includes('mombasa')) {
    return 'kenya';
  }
  if (locationLower.includes('nigeria') || locationLower.includes('lagos') || locationLower.includes('abuja')) {
    return 'nigeria';
  }
  if (locationLower.includes('ghana') || locationLower.includes('accra') || locationLower.includes('kumasi')) {
    return 'ghana';
  }
  if (locationLower.includes('south africa') || locationLower.includes('cape town') || locationLower.includes('johannesburg')) {
    return 'south_africa';
  }

  // North American countries
  if (locationLower.includes('usa') || locationLower.includes('united states') || locationLower.includes('america')) {
    return 'usa';
  }
  if (locationLower.includes('canada') || locationLower.includes('toronto') || locationLower.includes('vancouver')) {
    return 'canada';
  }

  return 'unknown';
}

/**
 * Get default cultural context for unknown locations
 */
function getDefaultCulturalContext(location: string, businessType?: string): GlobalCulturalContext {
  return {
    region: 'Global',
    country: location.split(',').pop()?.trim() || 'Unknown',
    primaryLanguage: 'English',
    secondaryLanguages: [],
    communicationStyle: 'professional and respectful',
    businessEtiquette: 'punctual and courteous',
    culturalValues: ['quality', 'reliability', 'customer service', 'innovation'],
    localReferences: ['local community', 'neighborhood', 'city center'],
    marketingApproach: 'value-focused, professional, customer-centric',
    colorPreferences: {
      preferred: ['blue', 'green', 'white', 'gray'],
      avoided: [],
      meanings: { 'blue': 'trust', 'green': 'growth', 'white': 'clarity' }
    },
    timeFormat: '24h',
    dateFormat: 'YYYY-MM-DD',
    currency: { symbol: '$', code: 'USD', position: 'before' },
    businessHours: { weekdays: '9:00-17:00', weekends: '10:00-16:00', timezone: 'local' },
    holidays: ['New Year', 'National Day'],
    socialNorms: ['respect', 'punctuality', 'professionalism'],
    contentTone: 'professional and clear',
    trustBuilders: ['testimonials', 'certifications', 'guarantees'],
    localCompetitors: ['local businesses']
  };
}

/**
 * Adapt cultural context based on business type
 */
function adaptContextForBusinessType(baseContext: GlobalCulturalContext, businessType: string): GlobalCulturalContext {
  const adaptedContext = { ...baseContext };

  // Business-type-specific adaptations
  switch (businessType) {
    case 'Restaurant':
      adaptedContext.localReferences = [
        ...baseContext.localReferences,
        'local cuisine', 'traditional dishes', 'family recipes'
      ];
      adaptedContext.culturalValues = [
        ...baseContext.culturalValues,
        'hospitality', 'food culture', 'family traditions'
      ];
      adaptedContext.contentTone = 'warm and inviting';
      break;

    case 'Healthcare':
      adaptedContext.communicationStyle = 'caring and professional';
      adaptedContext.culturalValues = [
        ...baseContext.culturalValues,
        'health', 'family wellbeing', 'trust'
      ];
      adaptedContext.contentTone = 'reassuring and professional';
      adaptedContext.trustBuilders = [
        'medical credentials', 'patient testimonials', 'health certifications'
      ];
      break;

    case 'Finance':
      adaptedContext.communicationStyle = 'trustworthy and professional';
      adaptedContext.culturalValues = [
        ...baseContext.culturalValues,
        'financial security', 'prosperity', 'future planning'
      ];
      adaptedContext.contentTone = 'confident and trustworthy';
      adaptedContext.trustBuilders = [
        'financial credentials', 'security certifications', 'regulatory compliance'
      ];
      break;

    case 'Technology':
      adaptedContext.culturalValues = [
        ...baseContext.culturalValues,
        'innovation', 'efficiency', 'digital transformation'
      ];
      adaptedContext.contentTone = 'innovative and forward-thinking';
      adaptedContext.trustBuilders = [
        'technical certifications', 'case studies', 'innovation awards'
      ];
      break;

    case 'Education':
      adaptedContext.culturalValues = [
        ...baseContext.culturalValues,
        'knowledge', 'growth', 'achievement', 'future success'
      ];
      adaptedContext.contentTone = 'encouraging and knowledgeable';
      adaptedContext.trustBuilders = [
        'educational credentials', 'student success stories', 'accreditations'
      ];
      break;
  }

  return adaptedContext;
}

/**
 * Generate culturally appropriate content elements
 */
export function generateCulturallyAdaptedContent(
  baseContent: string,
  culturalContext: GlobalCulturalContext,
  contentType: 'headline' | 'description' | 'cta' | 'general' = 'general'
): string {
  let adaptedContent = baseContent;

  // Apply cultural tone
  switch (culturalContext.communicationStyle) {
    case 'warm and community-focused':
      adaptedContent = addCommunityFocus(adaptedContent);
      break;
    case 'energetic and expressive':
      adaptedContent = addEnergeticTone(adaptedContent);
      break;
    case 'direct and confident':
      adaptedContent = addConfidentTone(adaptedContent);
      break;
    case 'polite and inclusive':
      adaptedContent = addPoliteTone(adaptedContent);
      break;
  }

  // Add local references if appropriate
  if (contentType === 'description' && culturalContext.localReferences.length > 0) {
    const localRef = culturalContext.localReferences[0];
    adaptedContent = adaptedContent.replace(/community/gi, localRef);
  }

  // Adapt currency format
  if (adaptedContent.includes('$') && culturalContext.currency.symbol !== '$') {
    adaptedContent = adaptedContent.replace(/\$/g, culturalContext.currency.symbol);
  }

  return adaptedContent;
}

/**
 * Helper functions for tone adaptation
 */
function addCommunityFocus(content: string): string {
  return content
    .replace(/\byou\b/gi, 'you and your family')
    .replace(/\bservice\b/gi, 'community service')
    .replace(/\bquality\b/gi, 'trusted quality');
}

function addEnergeticTone(content: string): string {
  return content
    .replace(/\bgreat\b/gi, 'amazing')
    .replace(/\bgood\b/gi, 'fantastic')
    .replace(/\bhelp\b/gi, 'empower');
}

function addConfidentTone(content: string): string {
  return content
    .replace(/\bmay\b/gi, 'will')
    .replace(/\bcould\b/gi, 'can')
    .replace(/\btry\b/gi, 'achieve');
}

function addPoliteTone(content: string): string {
  return content
    .replace(/\bneed\b/gi, 'would benefit from')
    .replace(/\bmust\b/gi, 'should consider')
    .replace(/\bbuy\b/gi, 'choose');
}

/**
 * Get cultural context summary for AI prompts
 */
export function getCulturalContextSummary(location: string, businessType?: string): string {
  const context = getGlobalCulturalContext(location, businessType);

  return `Cultural Context for ${context.country}:
- Communication Style: ${context.communicationStyle}
- Primary Values: ${context.culturalValues.slice(0, 3).join(', ')}
- Content Tone: ${context.contentTone}
- Local References: ${context.localReferences.slice(0, 2).join(', ')}
- Trust Builders: ${context.trustBuilders.slice(0, 2).join(', ')}
- Marketing Approach: ${context.marketingApproach}`;
}

/**
 * Validate cultural appropriateness of content
 */
export function validateCulturalAppropriateness(
  content: string,
  culturalContext: GlobalCulturalContext
): {
  isAppropriate: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for avoided colors in color-related content
  if (culturalContext.colorPreferences.avoided.length > 0) {
    culturalContext.colorPreferences.avoided.forEach(color => {
      if (content.toLowerCase().includes(color.toLowerCase())) {
        issues.push(`Contains avoided color: ${color}`);
        suggestions.push(`Consider using preferred colors: ${culturalContext.colorPreferences.preferred.join(', ')}`);
      }
    });
  }

  // Check for inappropriate time references
  if (content.includes('AM') || content.includes('PM')) {
    if (culturalContext.timeFormat === '24h') {
      issues.push('Uses 12-hour time format in 24-hour culture');
      suggestions.push('Use 24-hour time format (e.g., 14:00 instead of 2:00 PM)');
    }
  }

  // Check for currency format
  if (content.includes('$') && culturalContext.currency.symbol !== '$') {
    issues.push('Uses incorrect currency symbol');
    suggestions.push(`Use local currency symbol: ${culturalContext.currency.symbol}`);
  }

  // Check communication style alignment
  if (culturalContext.communicationStyle.includes('polite') &&
    (content.includes('must') || content.includes('need to'))) {
    issues.push('Too direct for polite communication culture');
    suggestions.push('Use softer language like "would benefit from" or "consider"');
  }

  return {
    isAppropriate: issues.length === 0,
    issues,
    suggestions
  };
}

// ============================================================================
// TASK 28: ENSURE CONTENT-DESIGN GENERATION CONSISTENCY
// ============================================================================

/**
 * Content-Design consistency validation interface
 */
interface ContentDesignConsistency {
  isConsistent: boolean;
  consistencyScore: number;
  alignmentIssues: string[];
  brandingIssues: string[];
  messagingIssues: string[];
  visualTextualIssues: string[];
  recommendations: string[];
}

/**
 * Content-Design alignment data structure
 */
interface ContentDesignAlignment {
  content: {
    headline: string;
    subheadline?: string;
    callToAction: string;
    businessName: string;
    businessType: string;
    keyMessage: string;
    tone: string;
    targetAudience: string;
  };
  design: {
    visualStyle: string;
    colorScheme: string[];
    brandElements: string[];
    imagePrompt: string;
    designType: string;
    aspectRatio: string;
  };
  brandProfile: {
    businessName: string;
    businessType: string;
    brandColors: any;
    brandVoice: string;
    writingTone: string;
    keyFeatures: string[];
    targetAudience: string;
    location: string;
  };
}

/**
 * Validate content-design consistency
 */
export function validateContentDesignConsistency(
  contentData: any,
  designPrompt: string,
  brandProfile: any
): ContentDesignConsistency {
  const alignment: ContentDesignAlignment = {
    content: extractContentElements(contentData),
    design: extractDesignElements(designPrompt),
    brandProfile: extractBrandElements(brandProfile)
  };

  const consistencyScore = calculateConsistencyScore(alignment);
  const issues = identifyConsistencyIssues(alignment);
  const recommendations = generateConsistencyRecommendations(alignment, issues);

  return {
    isConsistent: consistencyScore >= 80,
    consistencyScore,
    alignmentIssues: issues.alignment,
    brandingIssues: issues.branding,
    messagingIssues: issues.messaging,
    visualTextualIssues: issues.visualTextual,
    recommendations
  };
}

/**
 * Extract content elements for consistency checking
 */
function extractContentElements(contentData: any): ContentDesignAlignment['content'] {
  return {
    headline: contentData.headline || '',
    subheadline: contentData.subheadline || '',
    callToAction: contentData.callToAction || '',
    businessName: contentData.businessName || '',
    businessType: contentData.businessType || '',
    keyMessage: contentData.keyMessage || contentData.headline || '',
    tone: contentData.tone || 'professional',
    targetAudience: contentData.targetAudience || 'general'
  };
}

/**
 * Extract design elements for consistency checking
 */
function extractDesignElements(designPrompt: string): ContentDesignAlignment['design'] {
  const prompt = designPrompt.toLowerCase();

  return {
    visualStyle: extractVisualStyle(prompt),
    colorScheme: extractColorScheme(prompt),
    brandElements: extractBrandElements(prompt),
    imagePrompt: designPrompt,
    designType: extractDesignType(prompt),
    aspectRatio: extractAspectRatio(prompt)
  };
}

/**
 * Extract brand elements for consistency checking
 */
function extractBrandElements(brandProfile: any): ContentDesignAlignment['brandProfile'] {
  return {
    businessName: brandProfile.businessName || '',
    businessType: brandProfile.businessType || '',
    brandColors: brandProfile.brandColors || {},
    brandVoice: brandProfile.brandVoice || '',
    writingTone: brandProfile.writingTone || '',
    keyFeatures: brandProfile.keyFeatures || [],
    targetAudience: brandProfile.targetAudience || '',
    location: brandProfile.location || ''
  };
}

/**
 * Helper functions for design element extraction
 */
function extractVisualStyle(prompt: string): string {
  if (prompt.includes('modern')) return 'modern';
  if (prompt.includes('professional')) return 'professional';
  if (prompt.includes('friendly')) return 'friendly';
  if (prompt.includes('elegant')) return 'elegant';
  if (prompt.includes('vibrant')) return 'vibrant';
  return 'standard';
}

function extractColorScheme(prompt: string): string[] {
  const colors: string[] = [];
  const colorKeywords = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'gray'];

  colorKeywords.forEach(color => {
    if (prompt.includes(color)) {
      colors.push(color);
    }
  });

  return colors;
}



/**
 * Calculate overall consistency score
 */
function calculateConsistencyScore(alignment: ContentDesignAlignment): number {
  let score = 100;

  // Business name consistency (20 points)
  if (alignment.content.businessName !== alignment.brandProfile.businessName) {
    score -= 20;
  }

  // Business type consistency (15 points)
  if (alignment.content.businessType !== alignment.brandProfile.businessType) {
    score -= 15;
  }

  // Brand voice/tone consistency (20 points)
  const contentTone = alignment.content.tone.toLowerCase();
  const brandTone = alignment.brandProfile.writingTone.toLowerCase();
  if (!contentTone.includes(brandTone) && !brandTone.includes(contentTone)) {
    score -= 20;
  }

  // Target audience consistency (15 points)
  if (alignment.content.targetAudience !== alignment.brandProfile.targetAudience) {
    score -= 15;
  }

  // Visual-textual coherence (15 points)
  const visualStyle = alignment.design.visualStyle;
  const contentToneMatch =
    (visualStyle === 'professional' && contentTone.includes('professional')) ||
    (visualStyle === 'friendly' && contentTone.includes('friendly')) ||
    (visualStyle === 'modern' && contentTone.includes('innovative'));

  if (!contentToneMatch) {
    score -= 15;
  }

  // Brand color usage (15 points)
  const brandColors = alignment.brandProfile.brandColors;
  const designColors = alignment.design.colorScheme;

  if (brandColors.primary && designColors.length > 0) {
    const primaryColorUsed = designColors.some(color =>
      brandColors.primary.toLowerCase().includes(color) ||
      color.includes(brandColors.primary.toLowerCase())
    );
    if (!primaryColorUsed) {
      score -= 15;
    }
  }

  return Math.max(0, score);
}

/**
 * Identify specific consistency issues
 */
function identifyConsistencyIssues(alignment: ContentDesignAlignment): {
  alignment: string[];
  branding: string[];
  messaging: string[];
  visualTextual: string[];
} {
  const issues = {
    alignment: [] as string[],
    branding: [] as string[],
    messaging: [] as string[],
    visualTextual: [] as string[]
  };

  // Business alignment issues
  if (alignment.content.businessName !== alignment.brandProfile.businessName) {
    issues.alignment.push('Business name mismatch between content and brand profile');
  }

  if (alignment.content.businessType !== alignment.brandProfile.businessType) {
    issues.alignment.push('Business type inconsistency between content and brand profile');
  }

  // Branding issues
  const brandColors = alignment.brandProfile.brandColors;
  const designColors = alignment.design.colorScheme;

  if (brandColors.primary && designColors.length > 0) {
    const primaryColorUsed = designColors.some(color =>
      brandColors.primary.toLowerCase().includes(color) ||
      color.includes(brandColors.primary.toLowerCase())
    );
    if (!primaryColorUsed) {
      issues.branding.push('Brand primary color not reflected in design color scheme');
    }
  }

  if (!alignment.design.brandElements.includes('logo') && alignment.brandProfile.businessName) {
    issues.branding.push('Business logo/name not prominently featured in design');
  }

  // Messaging issues
  const contentTone = alignment.content.tone.toLowerCase();
  const brandTone = alignment.brandProfile.writingTone.toLowerCase();

  if (!contentTone.includes(brandTone) && !brandTone.includes(contentTone)) {
    issues.messaging.push(`Content tone (${alignment.content.tone}) doesn't match brand voice (${alignment.brandProfile.writingTone})`);
  }

  if (alignment.content.targetAudience !== alignment.brandProfile.targetAudience) {
    issues.messaging.push('Target audience mismatch between content and brand profile');
  }

  // Visual-textual coherence issues
  const visualStyle = alignment.design.visualStyle;
  const visualTextualMatch =
    (visualStyle === 'professional' && contentTone.includes('professional')) ||
    (visualStyle === 'friendly' && contentTone.includes('friendly')) ||
    (visualStyle === 'modern' && contentTone.includes('innovative')) ||
    (visualStyle === 'vibrant' && contentTone.includes('energetic'));

  if (!visualTextualMatch) {
    issues.visualTextual.push(`Visual style (${visualStyle}) doesn't align with content tone (${alignment.content.tone})`);
  }

  if (alignment.content.keyMessage && alignment.design.imagePrompt) {
    const keyMessageWords = alignment.content.keyMessage.toLowerCase().split(' ');
    const designPromptLower = alignment.design.imagePrompt.toLowerCase();

    const messageReflectedInDesign = keyMessageWords.some(word =>
      word.length > 3 && designPromptLower.includes(word)
    );

    if (!messageReflectedInDesign) {
      issues.visualTextual.push('Key message from content not reflected in visual design prompt');
    }
  }

  return issues;
}

/**
 * Generate consistency improvement recommendations
 */
function generateConsistencyRecommendations(
  alignment: ContentDesignAlignment,
  issues: {
    alignment: string[];
    branding: string[];
    messaging: string[];
    visualTextual: string[];
  }
): string[] {
  const recommendations: string[] = [];

  // Address alignment issues
  if (issues.alignment.length > 0) {
    recommendations.push('Ensure business name and type are consistent across content and design');
    recommendations.push('Verify brand profile data accuracy and completeness');
  }

  // Address branding issues
  if (issues.branding.length > 0) {
    if (alignment.brandProfile.brandColors.primary) {
      recommendations.push(`Incorporate brand primary color (${alignment.brandProfile.brandColors.primary}) into design`);
    }
    recommendations.push('Include business logo or name prominently in visual design');
    recommendations.push('Ensure brand elements are consistently applied across all materials');
  }

  // Address messaging issues
  if (issues.messaging.length > 0) {
    recommendations.push(`Align content tone with brand voice (${alignment.brandProfile.writingTone})`);
    recommendations.push(`Target content to specified audience (${alignment.brandProfile.targetAudience})`);
    recommendations.push('Review brand voice guidelines and apply consistently');
  }

  // Address visual-textual coherence issues
  if (issues.visualTextual.length > 0) {
    recommendations.push('Ensure visual style matches content tone and messaging');
    recommendations.push('Reflect key content messages in visual design elements');
    recommendations.push('Create cohesive visual-textual narrative that supports business goals');
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Content and design are well-aligned - maintain current consistency standards');
  } else {
    recommendations.push('Review and update content generation and design prompts for better alignment');
    recommendations.push('Consider creating brand guidelines document for consistent application');
  }

  return recommendations;
}

/**
 * Synchronize content and design generation
 */
export function synchronizeContentDesignGeneration(
  brandProfile: any,
  platform: string = 'instagram'
): {
  synchronizedContent: any;
  synchronizedDesignPrompt: string;
  consistencyValidation: ContentDesignConsistency;
} {
  // Generate synchronized content
  const synchronizedContent = generateSynchronizedContent(brandProfile, platform);

  // Generate synchronized design prompt
  const synchronizedDesignPrompt = generateSynchronizedDesignPrompt(
    synchronizedContent,
    brandProfile,
    platform
  );

  // Validate consistency
  const consistencyValidation = validateContentDesignConsistency(
    synchronizedContent,
    synchronizedDesignPrompt,
    brandProfile
  );

  return {
    synchronizedContent,
    synchronizedDesignPrompt,
    consistencyValidation
  };
}

/**
 * Generate content with design synchronization in mind
 */
function generateSynchronizedContent(brandProfile: any, platform: string): any {
  const businessIntelligence = generateBusinessIntelligence({
    businessType: brandProfile.businessType,
    location: brandProfile.location,
    services: brandProfile.services || [],
    targetAudience: brandProfile.targetAudience,
    keyFeatures: brandProfile.keyFeatures || [],
    competitiveAdvantages: brandProfile.competitiveAdvantages || [],
    brandVoice: brandProfile.brandVoice,
    writingTone: brandProfile.writingTone
  });

  const culturalContext = getGlobalCulturalContext(brandProfile.location, brandProfile.businessType);

  return {
    businessName: brandProfile.businessName,
    businessType: brandProfile.businessType,
    headline: generateSynchronizedHeadline(brandProfile, businessIntelligence),
    subheadline: generateSynchronizedSubheadline(brandProfile, businessIntelligence),
    callToAction: generateSynchronizedCTA(brandProfile, businessIntelligence),
    keyMessage: businessIntelligence.valuePropositions[0] || 'Quality service you can trust',
    tone: brandProfile.writingTone || culturalContext.contentTone,
    targetAudience: brandProfile.targetAudience,
    platform,
    culturalContext: culturalContext.contentTone,
    brandVoice: brandProfile.brandVoice,
    designHints: {
      visualStyle: determineVisualStyleFromTone(brandProfile.writingTone),
      colorPreferences: brandProfile.brandColors,
      businessContext: brandProfile.businessType
    }
  };
}

/**
 * Generate design prompt synchronized with content
 */
function generateSynchronizedDesignPrompt(
  content: any,
  brandProfile: any,
  platform: string
): string {
  const visualStyle = content.designHints.visualStyle;
  const businessType = content.businessType;
  const keyMessage = content.keyMessage;

  let basePrompt = `Create a ${visualStyle} ${platform} post design for ${businessType} business. `;

  // Add business context
  basePrompt += `The business "${content.businessName}" focuses on ${keyMessage.toLowerCase()}. `;

  // Add visual style guidance
  basePrompt += `Design should be ${visualStyle} and reflect ${content.tone} tone. `;

  // Add brand color integration
  if (brandProfile.brandColors?.primary) {
    basePrompt += `Use brand primary color ${brandProfile.brandColors.primary} prominently. `;
  }

  if (brandProfile.brandColors?.secondary) {
    basePrompt += `Incorporate secondary color ${brandProfile.brandColors.secondary} as accent. `;
  }

  // Add content-specific elements
  basePrompt += `Include business name "${content.businessName}" prominently. `;

  if (content.headline) {
    basePrompt += `Reflect the message "${content.headline}" in the visual composition. `;
  }

  // Add business-type-specific visual elements
  basePrompt += getBusinessTypeVisualElements(businessType);

  // Add cultural context
  const culturalContext = getGlobalCulturalContext(brandProfile.location, businessType);
  if (culturalContext.localReferences.length > 0) {
    basePrompt += `Include subtle cultural elements appropriate for ${culturalContext.country}. `;
  }

  // Add technical specifications
  basePrompt += `Create in 1:1 aspect ratio suitable for ${platform}. `;
  basePrompt += `Ensure text is readable and professional. `;
  basePrompt += `Design should be eye-catching but maintain brand consistency.`;

  return basePrompt;
}

/**
 * Helper functions for synchronized generation
 */
function generateSynchronizedHeadline(brandProfile: any, businessIntelligence: any): string {
  const hooks = businessIntelligence.engagementHooks;
  if (hooks.length > 0) {
    return hooks[0];
  }

  return `${brandProfile.businessName} - Quality ${brandProfile.businessType} Service`;
}

function generateSynchronizedSubheadline(brandProfile: any, businessIntelligence: any): string {
  const valueProps = businessIntelligence.valuePropositions;
  if (valueProps.length > 0) {
    return valueProps[0];
  }

  return `Professional ${String(brandProfile.businessType || 'general business').toLowerCase()} services you can trust`;
}

function generateSynchronizedCTA(brandProfile: any, businessIntelligence: any): string {
  const ctas = businessIntelligence.callToActions;
  if (ctas.length > 0) {
    return ctas[0];
  }

  // Business-type-specific CTAs
  switch (brandProfile.businessType) {
    case 'Restaurant':
      return 'Order Now';
    case 'Healthcare':
      return 'Book Appointment';
    case 'Finance':
      return 'Get Started';
    case 'Technology':
      return 'Learn More';
    case 'Education':
      return 'Enroll Today';
    default:
      return 'Contact Us';
  }
}

function determineVisualStyleFromTone(writingTone: string): string {
  if (!writingTone) return 'professional';

  const tone = writingTone.toLowerCase();

  if (tone.includes('friendly') || tone.includes('casual')) return 'friendly';
  if (tone.includes('professional') || tone.includes('formal')) return 'professional';
  if (tone.includes('energetic') || tone.includes('enthusiastic')) return 'vibrant';
  if (tone.includes('elegant') || tone.includes('sophisticated')) return 'elegant';
  if (tone.includes('modern') || tone.includes('innovative')) return 'modern';

  return 'professional';
}

function getBusinessTypeVisualElements(businessType: string): string {
  const visualElements: Record<string, string> = {
    'Restaurant': 'Include food-related imagery and warm, inviting atmosphere. ',
    'Healthcare': 'Use clean, medical-appropriate imagery with calming colors. ',
    'Finance': 'Include professional financial imagery with trust-building elements. ',
    'Technology': 'Use modern, tech-focused imagery with innovative elements. ',
    'Education': 'Include learning-related imagery with growth and achievement themes. ',
    'Fitness Gym': 'Use active, energetic imagery with health and fitness themes. ',
    'Beauty Salon': 'Include beauty and wellness imagery with elegant styling. ',
    'Retail Store': 'Use product-focused imagery with shopping and lifestyle themes. ',
    'Legal Services': 'Include professional legal imagery with authority and trust themes. ',
    'Automotive': 'Use vehicle-related imagery with quality and reliability themes. '
  };

  return visualElements[businessType] || 'Use business-appropriate professional imagery. ';
}

/**
 * Validate and improve content-design alignment
 */
export function improveContentDesignAlignment(
  content: any,
  designPrompt: string,
  brandProfile: any
): {
  improvedContent: any;
  improvedDesignPrompt: string;
  improvementLog: string[];
} {
  const validation = validateContentDesignConsistency(content, designPrompt, brandProfile);
  const improvementLog: string[] = [];

  let improvedContent = { ...content };
  let improvedDesignPrompt = designPrompt;

  if (validation.consistencyScore < 80) {
    // Improve content based on issues
    if (validation.alignmentIssues.length > 0) {
      improvedContent.businessName = brandProfile.businessName;
      improvedContent.businessType = brandProfile.businessType;
      improvementLog.push('Aligned business name and type with brand profile');
    }

    if (validation.messagingIssues.length > 0) {
      improvedContent.tone = brandProfile.writingTone || improvedContent.tone;
      improvedContent.targetAudience = brandProfile.targetAudience || improvedContent.targetAudience;
      improvementLog.push('Aligned messaging tone and target audience');
    }

    // Improve design prompt based on issues
    if (validation.brandingIssues.length > 0) {
      if (brandProfile.brandColors?.primary && !improvedDesignPrompt.includes(brandProfile.brandColors.primary)) {
        improvedDesignPrompt += ` Use brand primary color ${brandProfile.brandColors.primary}.`;
        improvementLog.push('Added brand primary color to design prompt');
      }

      if (!improvedDesignPrompt.includes(brandProfile.businessName)) {
        improvedDesignPrompt += ` Prominently feature business name "${brandProfile.businessName}".`;
        improvementLog.push('Added business name prominence to design prompt');
      }
    }

    if (validation.visualTextualIssues.length > 0) {
      const visualStyle = determineVisualStyleFromTone(brandProfile.writingTone);
      if (!improvedDesignPrompt.includes(visualStyle)) {
        improvedDesignPrompt += ` Design should be ${visualStyle} to match brand tone.`;
        improvementLog.push(`Added visual style (${visualStyle}) to match content tone`);
      }

      if (improvedContent.keyMessage && !improvedDesignPrompt.includes(improvedContent.keyMessage)) {
        improvedDesignPrompt += ` Reflect the key message "${improvedContent.keyMessage}" visually.`;
        improvementLog.push('Added key message reflection to design prompt');
      }
    }
  }

  return {
    improvedContent,
    improvedDesignPrompt,
    improvementLog
  };
}

// ============================================================================
// TASK 29: IMPROVE BRAND PROFILE TO AI PROMPT DATA FLOW
// ============================================================================

/**
 * Optimized brand profile data flow interface
 */
interface OptimizedBrandProfileFlow {
  coreIdentity: {
    businessName: string;
    businessType: string;
    location: string;
    description: string;
  };
  businessIntelligence: {
    services: string[];
    keyFeatures: string[];
    competitiveAdvantages: string[];
    uniqueSellingPoints: string[];
    targetAudience: string;
  };
  brandIdentity: {
    brandVoice: string;
    writingTone: string;
    brandColors: any;
    logoUrl?: string;
    designExamples: string[];
  };
  contextualData: {
    culturalContext: any;
    businessIntelligence: any;
    marketingContext: string;
  };
  promptOptimization: {
    relevanceScore: number;
    dataCompleteness: number;
    promptReadiness: boolean;
    missingCriticalData: string[];
  };
}

/**
 * AI prompt data structure optimized for different generation types
 */
interface OptimizedAIPromptData {
  contentGeneration: {
    businessContext: string;
    brandVoice: string;
    targetAudience: string;
    keyMessages: string[];
    culturalContext: string;
    competitiveEdge: string;
    callToActionContext: string;
  };
  designGeneration: {
    visualIdentity: string;
    brandColors: string;
    businessType: string;
    designStyle: string;
    brandElements: string[];
    culturalVisualContext: string;
  };
  unified: {
    businessSummary: string;
    brandEssence: string;
    marketPosition: string;
    audienceProfile: string;
    locationContext: string;
  };
}

/**
 * Optimize brand profile data flow for AI prompt generation
 */
export function optimizeBrandProfileDataFlow(
  brandProfile: any,
  generationType: 'content' | 'design' | 'unified' = 'unified'
): OptimizedBrandProfileFlow {
  // Process and enhance brand profile data
  const processedProfile = processBrandProfileData(brandProfile, {
    applyFallbacks: true,
    validateData: true,
    normalizeData: true
  });

  // Generate contextual intelligence
  const businessIntelligence = generateBusinessIntelligence({
    businessType: processedProfile.businessType,
    location: processedProfile.location,
    services: processedProfile.services,
    targetAudience: processedProfile.targetAudience,
    keyFeatures: processedProfile.keyFeatures,
    competitiveAdvantages: processedProfile.competitiveAdvantages,
    brandVoice: processedProfile.brandVoice,
    writingTone: processedProfile.writingTone
  });

  // Get cultural context
  const culturalContext = getGlobalCulturalContext(
    processedProfile.location,
    processedProfile.businessType
  );

  // Build optimized flow structure
  const optimizedFlow: OptimizedBrandProfileFlow = {
    coreIdentity: {
      businessName: processedProfile.businessName,
      businessType: processedProfile.businessType,
      location: processedProfile.location,
      description: processedProfile.description
    },
    businessIntelligence: {
      services: processedProfile.services,
      keyFeatures: processedProfile.keyFeatures,
      competitiveAdvantages: processedProfile.competitiveAdvantages,
      uniqueSellingPoints: processedProfile.uniqueSellingPoints,
      targetAudience: processedProfile.targetAudience
    },
    brandIdentity: {
      brandVoice: processedProfile.brandVoice,
      writingTone: processedProfile.writingTone,
      brandColors: processedProfile.brandColors,
      logoUrl: processedProfile.logoUrl,
      designExamples: processedProfile.designExamples
    },
    contextualData: {
      culturalContext,
      businessIntelligence,
      marketingContext: generateMarketingContext(processedProfile, culturalContext)
    },
    promptOptimization: calculatePromptOptimization(processedProfile, generationType)
  };

  return optimizedFlow;
}

/**
 * Generate marketing context from brand profile and cultural data
 */
function generateMarketingContext(brandProfile: any, culturalContext: any): string {
  const contextElements = [];

  // Business positioning
  contextElements.push(`${brandProfile.businessName} is a ${String(brandProfile.businessType || 'general business').toLowerCase()} business`);

  if (brandProfile.location) {
    contextElements.push(`located in ${brandProfile.location}`);
  }

  // Target audience context
  if (brandProfile.targetAudience) {
    contextElements.push(`serving ${brandProfile.targetAudience}`);
  }

  // Key differentiators
  if (brandProfile.competitiveAdvantages && brandProfile.competitiveAdvantages.length > 0) {
    contextElements.push(`known for ${brandProfile.competitiveAdvantages.slice(0, 2).join(' and ')}`);
  }

  // Cultural adaptation
  if (culturalContext.marketingApproach) {
    contextElements.push(`with a ${culturalContext.marketingApproach} approach`);
  }

  // Brand voice integration
  if (brandProfile.brandVoice) {
    contextElements.push(`communicating in a ${brandProfile.brandVoice} manner`);
  }

  return contextElements.join(', ') + '.';
}

/**
 * Calculate prompt optimization metrics
 */
function calculatePromptOptimization(
  brandProfile: any,
  generationType: 'content' | 'design' | 'unified'
): OptimizedBrandProfileFlow['promptOptimization'] {
  const criticalFields = {
    content: ['businessName', 'businessType', 'services', 'targetAudience', 'brandVoice'],
    design: ['businessName', 'businessType', 'brandColors', 'designExamples'],
    unified: ['businessName', 'businessType', 'location', 'services', 'targetAudience']
  };

  const relevantFields = criticalFields[generationType] || criticalFields.unified;
  const missingCriticalData: string[] = [];
  let presentFields = 0;

  relevantFields.forEach(field => {
    const value = brandProfile[field];
    if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
      missingCriticalData.push(field);
    } else {
      presentFields++;
    }
  });

  const dataCompleteness = (presentFields / relevantFields.length) * 100;
  const relevanceScore = calculateRelevanceScore(brandProfile, generationType);
  const promptReadiness = dataCompleteness >= 80 && relevanceScore >= 70;

  return {
    relevanceScore,
    dataCompleteness,
    promptReadiness,
    missingCriticalData
  };
}

/**
 * Calculate relevance score based on data quality and completeness
 */
function calculateRelevanceScore(brandProfile: any, generationType: string): number {
  let score = 0;

  // Business identity completeness (30 points)
  if (brandProfile.businessName) score += 10;
  if (brandProfile.businessType) score += 10;
  if (brandProfile.location) score += 10;

  // Business intelligence completeness (40 points)
  if (brandProfile.services && brandProfile.services.length > 0) score += 15;
  if (brandProfile.keyFeatures && brandProfile.keyFeatures.length > 0) score += 10;
  if (brandProfile.targetAudience) score += 15;

  // Brand identity completeness (30 points)
  if (brandProfile.brandVoice) score += 10;
  if (brandProfile.writingTone) score += 10;
  if (brandProfile.brandColors && brandProfile.brandColors.primary) score += 10;

  // Generation-type-specific bonuses
  if (generationType === 'design') {
    if (brandProfile.designExamples && brandProfile.designExamples.length > 0) score += 10;
    if (brandProfile.logoUrl) score += 5;
  }

  if (generationType === 'content') {
    if (brandProfile.competitiveAdvantages && brandProfile.competitiveAdvantages.length > 0) score += 10;
    if (brandProfile.uniqueSellingPoints && brandProfile.uniqueSellingPoints.length > 0) score += 5;
  }

  return Math.min(100, score);
}

/**
 * Generate optimized AI prompts from brand profile flow
 */
export function generateOptimizedAIPrompts(
  optimizedFlow: OptimizedBrandProfileFlow,
  generationType: 'content' | 'design' | 'unified' = 'unified'
): OptimizedAIPromptData {
  const promptData: OptimizedAIPromptData = {
    contentGeneration: generateContentPromptData(optimizedFlow),
    designGeneration: generateDesignPromptData(optimizedFlow),
    unified: generateUnifiedPromptData(optimizedFlow)
  };

  return promptData;
}

/**
 * Generate content-specific prompt data
 */
function generateContentPromptData(flow: OptimizedBrandProfileFlow): OptimizedAIPromptData['contentGeneration'] {
  const businessContext = `${flow.coreIdentity.businessName} is a ${flow.coreIdentity.businessType} business in ${flow.coreIdentity.location}. ${flow.coreIdentity.description}`;

  const keyMessages = [
    ...flow.contextualData.businessIntelligence.valuePropositions.slice(0, 2),
    ...flow.businessIntelligence.competitiveAdvantages.slice(0, 1)
  ];

  const competitiveEdge = flow.businessIntelligence.competitiveAdvantages.length > 0
    ? `Key differentiator: ${flow.businessIntelligence.competitiveAdvantages[0]}`
    : 'Focus on quality and customer satisfaction';

  const callToActionContext = flow.contextualData.businessIntelligence.callToActions.length > 0
    ? `Preferred CTA style: ${flow.contextualData.businessIntelligence.callToActions[0]}`
    : 'Use business-appropriate call-to-action';

  return {
    businessContext,
    brandVoice: `${flow.brandIdentity.brandVoice} with ${flow.brandIdentity.writingTone} tone`,
    targetAudience: flow.businessIntelligence.targetAudience,
    keyMessages,
    culturalContext: `${flow.contextualData.culturalContext.contentTone} communication style appropriate for ${flow.contextualData.culturalContext.country}`,
    competitiveEdge,
    callToActionContext
  };
}

/**
 * Generate design-specific prompt data
 */
function generateDesignPromptData(flow: OptimizedBrandProfileFlow): OptimizedAIPromptData['designGeneration'] {
  const visualIdentity = `${flow.coreIdentity.businessName} visual identity should reflect ${flow.coreIdentity.businessType} industry standards with ${flow.brandIdentity.brandVoice} personality`;

  const brandColors = flow.brandIdentity.brandColors.primary
    ? `Primary color: ${flow.brandIdentity.brandColors.primary}${flow.brandIdentity.brandColors.secondary ? `, Secondary: ${flow.brandIdentity.brandColors.secondary}` : ''}`
    : 'Use business-appropriate professional colors';

  const designStyle = determineDesignStyleFromBrand(flow.brandIdentity.writingTone, flow.coreIdentity.businessType);

  const brandElements = [
    `Business name: ${flow.coreIdentity.businessName}`,
    `Business type: ${flow.coreIdentity.businessType}`,
    ...(flow.brandIdentity.logoUrl ? ['Company logo integration'] : []),
    ...(flow.brandIdentity.designExamples.length > 0 ? ['Consistent with existing design examples'] : [])
  ];

  const culturalVisualContext = `Visual style appropriate for ${flow.contextualData.culturalContext.country} market with ${flow.contextualData.culturalContext.marketingApproach} approach`;

  return {
    visualIdentity,
    brandColors,
    businessType: flow.coreIdentity.businessType,
    designStyle,
    brandElements,
    culturalVisualContext
  };
}

/**
 * Generate unified prompt data
 */
function generateUnifiedPromptData(flow: OptimizedBrandProfileFlow): OptimizedAIPromptData['unified'] {
  const businessSummary = `${flow.coreIdentity.businessName} is a ${flow.coreIdentity.businessType} business serving ${flow.businessIntelligence.targetAudience} in ${flow.coreIdentity.location}`;

  const brandEssence = `Brand communicates with ${flow.brandIdentity.brandVoice} voice using ${flow.brandIdentity.writingTone} tone, emphasizing ${flow.businessIntelligence.competitiveAdvantages.slice(0, 2).join(' and ')}`;

  const marketPosition = flow.businessIntelligence.uniqueSellingPoints.length > 0
    ? `Positioned as ${flow.businessIntelligence.uniqueSellingPoints[0]}`
    : `Professional ${String(flow.coreIdentity.businessType || 'general business').toLowerCase()} service provider`;

  const audienceProfile = `Target audience: ${flow.businessIntelligence.targetAudience} who value ${flow.businessIntelligence.keyFeatures.slice(0, 2).join(' and ')}`;

  const locationContext = `Operating in ${flow.coreIdentity.location} with ${flow.contextualData.culturalContext.communicationStyle} approach suitable for ${flow.contextualData.culturalContext.region}`;

  return {
    businessSummary,
    brandEssence,
    marketPosition,
    audienceProfile,
    locationContext
  };
}

/**
 * Helper function to determine design style from brand attributes
 */
function determineDesignStyleFromBrand(writingTone: string, businessType: string): string {
  const tone = writingTone?.toLowerCase() || '';
  const type = businessType?.toLowerCase() || '';

  // Tone-based style determination
  if (tone.includes('professional') || tone.includes('formal')) return 'professional and clean';
  if (tone.includes('friendly') || tone.includes('casual')) return 'approachable and warm';
  if (tone.includes('energetic') || tone.includes('enthusiastic')) return 'dynamic and vibrant';
  if (tone.includes('elegant') || tone.includes('sophisticated')) return 'refined and elegant';
  if (tone.includes('modern') || tone.includes('innovative')) return 'contemporary and sleek';

  // Business-type-based style determination
  if (type.includes('healthcare') || type.includes('medical')) return 'clean and trustworthy';
  if (type.includes('finance') || type.includes('legal')) return 'professional and authoritative';
  if (type.includes('technology') || type.includes('tech')) return 'modern and innovative';
  if (type.includes('restaurant') || type.includes('food')) return 'warm and inviting';
  if (type.includes('beauty') || type.includes('salon')) return 'elegant and stylish';

  return 'professional and balanced';
}

/**
 * Validate and enhance prompt data flow
 */
export function validatePromptDataFlow(
  brandProfile: any,
  generatedPrompts: OptimizedAIPromptData
): {
  isValid: boolean;
  completenessScore: number;
  dataLossIssues: string[];
  relevanceIssues: string[];
  recommendations: string[];
} {
  const dataLossIssues: string[] = [];
  const relevanceIssues: string[] = [];
  const recommendations: string[] = [];

  // Check for data loss in content generation
  if (brandProfile.businessName && !generatedPrompts.contentGeneration.businessContext.includes(brandProfile.businessName)) {
    dataLossIssues.push('Business name not properly integrated into content context');
  }

  if (brandProfile.targetAudience && generatedPrompts.contentGeneration.targetAudience !== brandProfile.targetAudience) {
    dataLossIssues.push('Target audience information lost in content generation');
  }

  // Check for data loss in design generation
  if (brandProfile.brandColors?.primary && !generatedPrompts.designGeneration.brandColors.includes(brandProfile.brandColors.primary)) {
    dataLossIssues.push('Brand primary color not integrated into design prompts');
  }

  // Check relevance
  if (brandProfile.businessType && !generatedPrompts.unified.businessSummary.includes(brandProfile.businessType)) {
    relevanceIssues.push('Business type not prominently featured in unified summary');
  }

  // Calculate completeness score
  const totalChecks = 10;
  const passedChecks = totalChecks - dataLossIssues.length - relevanceIssues.length;
  const completenessScore = (passedChecks / totalChecks) * 100;

  // Generate recommendations
  if (dataLossIssues.length > 0) {
    recommendations.push('Review data mapping to ensure all critical brand profile elements are preserved');
  }

  if (relevanceIssues.length > 0) {
    recommendations.push('Enhance prompt generation to better highlight key business attributes');
  }

  if (completenessScore < 80) {
    recommendations.push('Improve brand profile completeness before generating AI prompts');
  } else {
    recommendations.push('Data flow optimization is working well - maintain current standards');
  }

  return {
    isValid: completenessScore >= 70,
    completenessScore,
    dataLossIssues,
    relevanceIssues,
    recommendations
  };
}

// ============================================================================
// TASK 30: ADD BRAND PROFILE COMPLETENESS VALIDATION
// ============================================================================

/**
 * Brand profile completeness assessment interface
 */
interface BrandProfileCompletenessAssessment {
  overallCompleteness: number;
  categoryScores: {
    coreIdentity: number;
    businessIntelligence: number;
    brandIdentity: number;
    contactInformation: number;
    visualAssets: number;
  };
  missingCriticalFields: string[];
  missingRecommendedFields: string[];
  missingOptionalFields: string[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  impactAnalysis: {
    contentGenerationImpact: string;
    designGenerationImpact: string;
    overallQualityImpact: string;
  };
  completenessLevel: 'Critical' | 'Basic' | 'Good' | 'Excellent';
}

/**
 * Field importance levels and categories
 */
const BRAND_PROFILE_FIELD_DEFINITIONS = {
  critical: {
    coreIdentity: ['businessName', 'businessType', 'location'],
    businessIntelligence: ['services', 'targetAudience'],
    brandIdentity: ['brandVoice', 'writingTone']
  },
  recommended: {
    coreIdentity: ['description'],
    businessIntelligence: ['keyFeatures', 'competitiveAdvantages'],
    brandIdentity: ['brandColors'],
    visualAssets: ['logoUrl']
  },
  optional: {
    businessIntelligence: ['uniqueSellingPoints'],
    contactInformation: ['websiteUrl', 'contactInfo'],
    visualAssets: ['designExamples']
  }
};

/**
 * Assess brand profile completeness
 */
export function assessBrandProfileCompleteness(brandProfile: any): BrandProfileCompletenessAssessment {
  const categoryScores = calculateCategoryScores(brandProfile);
  const overallCompleteness = calculateOverallCompleteness(categoryScores);

  const missingFields = identifyMissingFields(brandProfile);
  const recommendations = generateCompletenessRecommendations(brandProfile, missingFields, categoryScores);
  const impactAnalysis = analyzeCompletenessImpact(brandProfile, missingFields);
  const completenessLevel = determineCompletenessLevel(overallCompleteness);

  return {
    overallCompleteness,
    categoryScores,
    missingCriticalFields: missingFields.critical,
    missingRecommendedFields: missingFields.recommended,
    missingOptionalFields: missingFields.optional,
    recommendations,
    impactAnalysis,
    completenessLevel
  };
}

/**
 * Calculate completeness scores for each category
 */
function calculateCategoryScores(brandProfile: any): BrandProfileCompletenessAssessment['categoryScores'] {
  const scores = {
    coreIdentity: 0,
    businessIntelligence: 0,
    brandIdentity: 0,
    contactInformation: 0,
    visualAssets: 0
  };

  // Core Identity Score (30% weight)
  const coreFields = [
    ...BRAND_PROFILE_FIELD_DEFINITIONS.critical.coreIdentity,
    ...BRAND_PROFILE_FIELD_DEFINITIONS.recommended.coreIdentity
  ];
  scores.coreIdentity = calculateFieldCategoryScore(brandProfile, coreFields, [3, 1]); // Critical: 3 points, Recommended: 1 point

  // Business Intelligence Score (35% weight)
  const businessFields = [
    ...BRAND_PROFILE_FIELD_DEFINITIONS.critical.businessIntelligence,
    ...BRAND_PROFILE_FIELD_DEFINITIONS.recommended.businessIntelligence,
    ...BRAND_PROFILE_FIELD_DEFINITIONS.optional.businessIntelligence
  ];
  scores.businessIntelligence = calculateFieldCategoryScore(brandProfile, businessFields, [3, 2, 1]);

  // Brand Identity Score (25% weight)
  const brandFields = [
    ...BRAND_PROFILE_FIELD_DEFINITIONS.critical.brandIdentity,
    ...BRAND_PROFILE_FIELD_DEFINITIONS.recommended.brandIdentity
  ];
  scores.brandIdentity = calculateFieldCategoryScore(brandProfile, brandFields, [3, 2]);

  // Contact Information Score (5% weight)
  const contactFields = BRAND_PROFILE_FIELD_DEFINITIONS.optional.contactInformation;
  scores.contactInformation = calculateFieldCategoryScore(brandProfile, contactFields, [1]);

  // Visual Assets Score (5% weight)
  const visualFields = [
    ...BRAND_PROFILE_FIELD_DEFINITIONS.recommended.visualAssets,
    ...BRAND_PROFILE_FIELD_DEFINITIONS.optional.visualAssets
  ];
  scores.visualAssets = calculateFieldCategoryScore(brandProfile, visualFields, [2, 1]);

  return scores;
}

/**
 * Calculate score for a specific field category
 */
function calculateFieldCategoryScore(
  brandProfile: any,
  fields: string[],
  weights: number[]
): number {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let weightIndex = 0;

  fields.forEach((field, index) => {
    // Determine weight based on field importance
    const currentWeight = weights[Math.min(weightIndex, weights.length - 1)];
    maxPossibleScore += currentWeight;

    // Check if field has value
    const value = brandProfile[field];
    const hasValue = value &&
      (typeof value === 'string' ? value.trim() !== '' : true) &&
      (Array.isArray(value) ? value.length > 0 : true) &&
      (typeof value === 'object' && value !== null ? Object.keys(value).length > 0 : true);

    if (hasValue) {
      totalScore += currentWeight;
    }

    // Move to next weight group based on field definitions
    if (field === BRAND_PROFILE_FIELD_DEFINITIONS.critical.coreIdentity?.slice(-1)[0] ||
      field === BRAND_PROFILE_FIELD_DEFINITIONS.critical.businessIntelligence?.slice(-1)[0] ||
      field === BRAND_PROFILE_FIELD_DEFINITIONS.critical.brandIdentity?.slice(-1)[0]) {
      weightIndex++;
    }
  });

  return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
}

/**
 * Calculate overall completeness score
 */
function calculateOverallCompleteness(categoryScores: BrandProfileCompletenessAssessment['categoryScores']): number {
  const weights = {
    coreIdentity: 0.30,
    businessIntelligence: 0.35,
    brandIdentity: 0.25,
    contactInformation: 0.05,
    visualAssets: 0.05
  };

  return (
    categoryScores.coreIdentity * weights.coreIdentity +
    categoryScores.businessIntelligence * weights.businessIntelligence +
    categoryScores.brandIdentity * weights.brandIdentity +
    categoryScores.contactInformation * weights.contactInformation +
    categoryScores.visualAssets * weights.visualAssets
  );
}

/**
 * Identify missing fields by importance level
 */
function identifyMissingFields(brandProfile: any): {
  critical: string[];
  recommended: string[];
  optional: string[];
} {
  const missing = {
    critical: [] as string[],
    recommended: [] as string[],
    optional: [] as string[]
  };

  // Check critical fields
  Object.values(BRAND_PROFILE_FIELD_DEFINITIONS.critical).flat().forEach(field => {
    if (!hasFieldValue(brandProfile, field)) {
      missing.critical.push(field);
    }
  });

  // Check recommended fields
  Object.values(BRAND_PROFILE_FIELD_DEFINITIONS.recommended).flat().forEach(field => {
    if (!hasFieldValue(brandProfile, field)) {
      missing.recommended.push(field);
    }
  });

  // Check optional fields
  Object.values(BRAND_PROFILE_FIELD_DEFINITIONS.optional).flat().forEach(field => {
    if (!hasFieldValue(brandProfile, field)) {
      missing.optional.push(field);
    }
  });

  return missing;
}

/**
 * Check if a field has a meaningful value
 */
function hasFieldValue(brandProfile: any, field: string): boolean {
  const value = brandProfile[field];

  if (!value) return false;

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item =>
      typeof item === 'string' ? item.trim() !== '' : !!item
    );
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0 &&
      Object.values(value).some(val =>
        typeof val === 'string' ? val.trim() !== '' : !!val
      );
  }

  return true;
}

/**
 * Generate completeness improvement recommendations
 */
function generateCompletenessRecommendations(
  brandProfile: any,
  missingFields: { critical: string[]; recommended: string[]; optional: string[] },
  categoryScores: BrandProfileCompletenessAssessment['categoryScores']
): BrandProfileCompletenessAssessment['recommendations'] {
  const recommendations = {
    immediate: [] as string[],
    shortTerm: [] as string[],
    longTerm: [] as string[]
  };

  // Immediate recommendations (critical missing fields)
  if (missingFields.critical.length > 0) {
    recommendations.immediate.push('Complete critical business information to enable basic content generation');

    missingFields.critical.forEach(field => {
      const fieldRecommendation = getFieldRecommendation(field, 'critical');
      if (fieldRecommendation) {
        recommendations.immediate.push(fieldRecommendation);
      }
    });
  }

  // Short-term recommendations (recommended missing fields)
  if (missingFields.recommended.length > 0) {
    recommendations.shortTerm.push('Add recommended information to improve content quality and brand consistency');

    missingFields.recommended.forEach(field => {
      const fieldRecommendation = getFieldRecommendation(field, 'recommended');
      if (fieldRecommendation) {
        recommendations.shortTerm.push(fieldRecommendation);
      }
    });
  }

  // Long-term recommendations (optional fields and enhancements)
  if (missingFields.optional.length > 0) {
    recommendations.longTerm.push('Consider adding optional information for enhanced personalization');

    missingFields.optional.forEach(field => {
      const fieldRecommendation = getFieldRecommendation(field, 'optional');
      if (fieldRecommendation) {
        recommendations.longTerm.push(fieldRecommendation);
      }
    });
  }

  // Category-specific recommendations
  if (categoryScores.coreIdentity < 80) {
    recommendations.immediate.push('Strengthen core business identity information for better brand representation');
  }

  if (categoryScores.businessIntelligence < 70) {
    recommendations.shortTerm.push('Expand business intelligence data to improve content relevance and targeting');
  }

  if (categoryScores.brandIdentity < 60) {
    recommendations.shortTerm.push('Develop comprehensive brand identity guidelines for consistent communication');
  }

  // Ensure we have recommendations even for complete profiles
  if (recommendations.immediate.length === 0 && recommendations.shortTerm.length === 0 && recommendations.longTerm.length === 0) {
    recommendations.longTerm.push('Brand profile is comprehensive - consider periodic reviews to keep information current');
    recommendations.longTerm.push('Monitor content generation quality and update profile based on performance insights');
  }

  return recommendations;
}



/**
 * Analyze impact of missing fields on content generation
 */
function analyzeCompletenessImpact(
  brandProfile: any,
  missingFields: { critical: string[]; recommended: string[]; optional: string[] }
): BrandProfileCompletenessAssessment['impactAnalysis'] {
  let contentGenerationImpact = 'Minimal impact';
  let designGenerationImpact = 'Minimal impact';
  let overallQualityImpact = 'High quality';

  // Analyze content generation impact
  if (missingFields.critical.some(field => ['businessName', 'businessType', 'services', 'targetAudience'].includes(field))) {
    contentGenerationImpact = 'Severe impact - content will be generic and less relevant';
  } else if (missingFields.recommended.some(field => ['keyFeatures', 'competitiveAdvantages', 'brandVoice'].includes(field))) {
    contentGenerationImpact = 'Moderate impact - content quality and personalization reduced';
  } else if (missingFields.optional.length > 0) {
    contentGenerationImpact = 'Minor impact - some personalization opportunities missed';
  }

  // Analyze design generation impact
  if (missingFields.critical.some(field => ['businessName', 'businessType'].includes(field))) {
    designGenerationImpact = 'Severe impact - designs will lack business context and branding';
  } else if (missingFields.recommended.some(field => ['brandColors', 'logoUrl'].includes(field))) {
    designGenerationImpact = 'Moderate impact - visual consistency and brand recognition reduced';
  } else if (missingFields.optional.some(field => ['designExamples'].includes(field))) {
    designGenerationImpact = 'Minor impact - some visual consistency opportunities missed';
  }

  // Determine overall quality impact
  if (missingFields.critical.length > 2) {
    overallQualityImpact = 'Significantly reduced quality - critical information missing';
  } else if (missingFields.critical.length > 0 || missingFields.recommended.length > 3) {
    overallQualityImpact = 'Moderately reduced quality - important information missing';
  } else if (missingFields.recommended.length > 0) {
    overallQualityImpact = 'Slightly reduced quality - some optimization opportunities missed';
  }

  return {
    contentGenerationImpact,
    designGenerationImpact,
    overallQualityImpact
  };
}

/**
 * Determine completeness level based on overall score
 */
function determineCompletenessLevel(overallCompleteness: number): BrandProfileCompletenessAssessment['completenessLevel'] {
  if (overallCompleteness >= 90) return 'Excellent';
  if (overallCompleteness >= 75) return 'Good';
  if (overallCompleteness >= 50) return 'Basic';
  return 'Critical';
}

/**
 * Generate completeness improvement action plan
 */
export function generateCompletenessActionPlan(
  assessment: BrandProfileCompletenessAssessment
): {
  priorityActions: string[];
  quickWins: string[];
  longTermGoals: string[];
  estimatedImprovementScore: number;
} {
  const priorityActions: string[] = [];
  const quickWins: string[] = [];
  const longTermGoals: string[] = [];

  // Priority actions (critical missing fields)
  if (assessment.missingCriticalFields.length > 0) {
    priorityActions.push('Complete all critical business information immediately');
    assessment.missingCriticalFields.forEach(field => {
      const recommendation = getFieldRecommendation(field, 'critical');
      if (recommendation) {
        priorityActions.push(`• ${recommendation}`);
      }
    });
  }

  // Quick wins (easy recommended fields)
  const easyFields = ['description', 'brandColors', 'logoUrl'];
  const easyMissingFields = assessment.missingRecommendedFields.filter(field => easyFields.includes(field));

  if (easyMissingFields.length > 0) {
    quickWins.push('Add these easy improvements for immediate quality boost:');
    easyMissingFields.forEach(field => {
      const recommendation = getFieldRecommendation(field, 'recommended');
      if (recommendation) {
        quickWins.push(`• ${recommendation}`);
      }
    });
  }

  // Long-term goals (comprehensive improvements)
  const comprehensiveFields = assessment.missingRecommendedFields.filter(field => !easyFields.includes(field));

  if (comprehensiveFields.length > 0 || assessment.missingOptionalFields.length > 0) {
    longTermGoals.push('Comprehensive profile enhancement for maximum quality:');

    [...comprehensiveFields, ...assessment.missingOptionalFields.slice(0, 3)].forEach(field => {
      const recommendation = getFieldRecommendation(field, 'optional');
      if (recommendation) {
        longTermGoals.push(`• ${recommendation}`);
      }
    });
  }

  // Calculate estimated improvement score
  const criticalFieldsWeight = assessment.missingCriticalFields.length * 15;
  const recommendedFieldsWeight = assessment.missingRecommendedFields.length * 8;
  const optionalFieldsWeight = assessment.missingOptionalFields.length * 3;

  const estimatedImprovementScore = Math.min(100,
    assessment.overallCompleteness + criticalFieldsWeight + recommendedFieldsWeight + optionalFieldsWeight
  );

  return {
    priorityActions,
    quickWins,
    longTermGoals,
    estimatedImprovementScore
  };
}

/**
 * Validate brand profile completeness for specific use cases
 */
export function validateCompletenessForUseCase(
  brandProfile: any,
  useCase: 'content_generation' | 'design_generation' | 'full_marketing'
): {
  isReady: boolean;
  readinessScore: number;
  blockers: string[];
  recommendations: string[];
} {
  const useCaseRequirements = {
    content_generation: {
      critical: ['businessName', 'businessType', 'services', 'targetAudience', 'brandVoice'],
      recommended: ['keyFeatures', 'competitiveAdvantages', 'writingTone'],
      minScore: 70
    },
    design_generation: {
      critical: ['businessName', 'businessType', 'brandColors'],
      recommended: ['logoUrl', 'designExamples', 'writingTone'],
      minScore: 65
    },
    full_marketing: {
      critical: ['businessName', 'businessType', 'location', 'services', 'targetAudience', 'brandVoice', 'brandColors'],
      recommended: ['keyFeatures', 'competitiveAdvantages', 'uniqueSellingPoints', 'logoUrl', 'writingTone'],
      minScore: 80
    }
  };

  const requirements = useCaseRequirements[useCase];
  const blockers: string[] = [];
  const recommendations: string[] = [];

  // Check critical requirements
  requirements.critical.forEach(field => {
    if (!hasFieldValue(brandProfile, field)) {
      blockers.push(`Missing critical field: ${field}`);
    }
  });

  // Check recommended requirements
  requirements.recommended.forEach(field => {
    if (!hasFieldValue(brandProfile, field)) {
      recommendations.push(`Add recommended field: ${field}`);
    }
  });

  // Calculate readiness score
  const criticalPresent = requirements.critical.filter(field => hasFieldValue(brandProfile, field)).length;
  const recommendedPresent = requirements.recommended.filter(field => hasFieldValue(brandProfile, field)).length;

  const criticalScore = (criticalPresent / requirements.critical.length) * 70;
  const recommendedScore = (recommendedPresent / requirements.recommended.length) * 30;
  const readinessScore = criticalScore + recommendedScore;

  const isReady = readinessScore >= requirements.minScore && blockers.length === 0;

  return {
    isReady,
    readinessScore,
    blockers,
    recommendations
  };
}

// ============================================================================
// TASK 31: CREATE FALLBACK STRATEGIES FOR INCOMPLETE PROFILES
// ============================================================================

/**
 * Sophisticated fallback strategies interface
 */
interface FallbackStrategy {
  fieldName: string;
  fallbackValue: any;
  confidence: number;
  source: 'industry_standard' | 'business_type_inference' | 'location_inference' | 'ai_inference' | 'generic_default';
  reasoning: string;
}

interface IncompleteBrandProfileFallbacks {
  appliedFallbacks: FallbackStrategy[];
  enhancedProfile: any;
  qualityScore: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  recommendations: string[];
}

/**
 * Apply sophisticated fallback strategies for incomplete brand profiles
 */
export function applySophisticatedFallbacks(
  brandProfile: any,
  useCase: 'content_generation' | 'design_generation' | 'full_marketing' = 'full_marketing'
): IncompleteBrandProfileFallbacks {
  const appliedFallbacks: FallbackStrategy[] = [];
  const enhancedProfile = { ...brandProfile };

  // Apply fallbacks in order of importance
  applyBusinessNameFallback(enhancedProfile, appliedFallbacks);
  applyBusinessTypeFallback(enhancedProfile, appliedFallbacks);
  applyLocationFallback(enhancedProfile, appliedFallbacks);
  applyServicesFallback(enhancedProfile, appliedFallbacks);
  applyTargetAudienceFallback(enhancedProfile, appliedFallbacks);
  applyBrandVoiceFallback(enhancedProfile, appliedFallbacks);
  applyWritingToneFallback(enhancedProfile, appliedFallbacks);
  applyBrandColorsFallback(enhancedProfile, appliedFallbacks);
  applyKeyFeaturesFallback(enhancedProfile, appliedFallbacks);
  applyCompetitiveAdvantagesFallback(enhancedProfile, appliedFallbacks);
  applyDescriptionFallback(enhancedProfile, appliedFallbacks);

  // Calculate quality and confidence
  const qualityScore = calculateFallbackQualityScore(enhancedProfile, appliedFallbacks);
  const confidenceLevel = determineFallbackConfidenceLevel(appliedFallbacks);
  const recommendations = generateFallbackRecommendations(appliedFallbacks, useCase);

  return {
    appliedFallbacks,
    enhancedProfile,
    qualityScore,
    confidenceLevel,
    recommendations
  };
}

/**
 * Apply business name fallback
 */
function applyBusinessNameFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.businessName || profile.businessName.trim() === '') {
    const fallbackName = profile.businessType ?
      `Professional ${profile.businessType} Service` :
      'Professional Business Service';

    profile.businessName = fallbackName;
    fallbacks.push({
      fieldName: 'businessName',
      fallbackValue: fallbackName,
      confidence: 30,
      source: 'business_type_inference',
      reasoning: 'Generated generic business name based on business type'
    });
  }
}

/**
 * Apply business type fallback
 */
function applyBusinessTypeFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.businessType || profile.businessType.trim() === '') {
    // Try to infer from services
    if (profile.services && profile.services.length > 0) {
      const inferredType = inferBusinessTypeFromServices(profile.services);
      profile.businessType = inferredType;
      fallbacks.push({
        fieldName: 'businessType',
        fallbackValue: inferredType,
        confidence: 70,
        source: 'ai_inference',
        reasoning: `Inferred business type from services: ${profile.services.slice(0, 2).join(', ')}`
      });
    } else {
      profile.businessType = 'General Business';
      fallbacks.push({
        fieldName: 'businessType',
        fallbackValue: 'General Business',
        confidence: 20,
        source: 'generic_default',
        reasoning: 'No business type or services provided - using generic default'
      });
    }
  }
}

/**
 * Apply location fallback
 */
function applyLocationFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.location || profile.location.trim() === '') {
    profile.location = 'Global';
    fallbacks.push({
      fieldName: 'location',
      fallbackValue: 'Global',
      confidence: 40,
      source: 'generic_default',
      reasoning: 'No location specified - using global context for universal appeal'
    });
  }
}

/**
 * Apply services fallback
 */
function applyServicesFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.services || profile.services.length === 0) {
    const businessType = profile.businessType || 'General Business';
    const inferredServices = inferServicesFromBusinessType(businessType);

    profile.services = inferredServices;
    fallbacks.push({
      fieldName: 'services',
      fallbackValue: inferredServices,
      confidence: 60,
      source: 'business_type_inference',
      reasoning: `Generated services based on business type: ${businessType}`
    });
  }
}

/**
 * Apply target audience fallback
 */
function applyTargetAudienceFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.targetAudience || profile.targetAudience.trim() === '') {
    const businessType = profile.businessType || 'General Business';
    const inferredAudience = inferTargetAudienceFromBusinessType(businessType);

    profile.targetAudience = inferredAudience;
    fallbacks.push({
      fieldName: 'targetAudience',
      fallbackValue: inferredAudience,
      confidence: 65,
      source: 'business_type_inference',
      reasoning: `Inferred target audience based on business type: ${businessType}`
    });
  }
}

/**
 * Apply brand voice fallback
 */
function applyBrandVoiceFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.brandVoice || profile.brandVoice.trim() === '') {
    const businessType = profile.businessType || 'General Business';
    const inferredVoice = inferBrandVoiceFromBusinessType(businessType);

    profile.brandVoice = inferredVoice;
    fallbacks.push({
      fieldName: 'brandVoice',
      fallbackValue: inferredVoice,
      confidence: 70,
      source: 'industry_standard',
      reasoning: `Applied industry-standard brand voice for ${businessType} businesses`
    });
  }
}

/**
 * Apply writing tone fallback
 */
function applyWritingToneFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.writingTone || profile.writingTone.trim() === '') {
    const businessType = profile.businessType || 'General Business';
    const brandVoice = profile.brandVoice || 'professional';
    const inferredTone = inferWritingToneFromContext(businessType, brandVoice);

    profile.writingTone = inferredTone;
    fallbacks.push({
      fieldName: 'writingTone',
      fallbackValue: inferredTone,
      confidence: 75,
      source: 'industry_standard',
      reasoning: `Derived writing tone from business type (${businessType}) and brand voice (${brandVoice})`
    });
  }
}

/**
 * Apply brand colors fallback
 */
function applyBrandColorsFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.brandColors || !profile.brandColors.primary) {
    const businessType = profile.businessType || 'General Business';
    const inferredColors = generateBrandColorsFallback(businessType);

    profile.brandColors = inferredColors;
    fallbacks.push({
      fieldName: 'brandColors',
      fallbackValue: inferredColors,
      confidence: 80,
      source: 'industry_standard',
      reasoning: `Applied industry-standard color palette for ${businessType} businesses`
    });
  }
}

/**
 * Apply key features fallback
 */
function applyKeyFeaturesFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.keyFeatures || profile.keyFeatures.length === 0) {
    const businessType = profile.businessType || 'General Business';
    const services = profile.services || [];
    const inferredFeatures = inferKeyFeaturesFromContext(businessType, services);

    profile.keyFeatures = inferredFeatures;
    fallbacks.push({
      fieldName: 'keyFeatures',
      fallbackValue: inferredFeatures,
      confidence: 65,
      source: 'business_type_inference',
      reasoning: `Generated key features based on business type and services`
    });
  }
}

/**
 * Apply competitive advantages fallback
 */
function applyCompetitiveAdvantagesFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.competitiveAdvantages || profile.competitiveAdvantages.length === 0) {
    const businessType = profile.businessType || 'General Business';
    const keyFeatures = profile.keyFeatures || [];
    const inferredAdvantages = inferCompetitiveAdvantagesFromContext(businessType, keyFeatures);

    profile.competitiveAdvantages = inferredAdvantages;
    fallbacks.push({
      fieldName: 'competitiveAdvantages',
      fallbackValue: inferredAdvantages,
      confidence: 60,
      source: 'business_type_inference',
      reasoning: `Generated competitive advantages based on business context and key features`
    });
  }
}

/**
 * Apply description fallback
 */
function applyDescriptionFallback(profile: any, fallbacks: FallbackStrategy[]): void {
  if (!profile.description || profile.description.trim() === '') {
    const businessType = profile.businessType || 'General Business';
    const services = profile.services || [];
    const location = profile.location || 'Global';
    const inferredDescription = generateBusinessDescription(businessType, services, location);

    profile.description = inferredDescription;
    fallbacks.push({
      fieldName: 'description',
      fallbackValue: inferredDescription,
      confidence: 70,
      source: 'ai_inference',
      reasoning: `Generated business description from available context (type, services, location)`
    });
  }
}



/**
 * Infer services from business type
 */
function inferServicesFromBusinessType(businessType: string): string[] {
  const type = String(businessType || 'general business').toLowerCase();

  const serviceMap: Record<string, string[]> = {
    'restaurant': ['Fine dining', 'Takeout orders', 'Catering services'],
    'healthcare': ['Medical consultations', 'Health screenings', 'Treatment services'],
    'fitness': ['Personal training', 'Group fitness classes', 'Wellness programs'],
    'beauty': ['Hair styling', 'Beauty treatments', 'Wellness services'],
    'finance': ['Financial planning', 'Investment advice', 'Banking services'],
    'retail': ['Product sales', 'Customer service', 'Online shopping'],
    'legal': ['Legal consultation', 'Document preparation', 'Legal representation'],
    'technology': ['Software development', 'Technical consulting', 'Digital solutions'],
    'education': ['Educational programs', 'Training courses', 'Academic support'],
    'automotive': ['Vehicle services', 'Maintenance', 'Automotive solutions']
  };

  for (const [key, services] of Object.entries(serviceMap)) {
    if (type.includes(key)) {
      return services;
    }
  }

  return ['Professional services', 'Customer consultation', 'Quality solutions'];
}

/**
 * Infer target audience from business type
 */
function inferTargetAudienceFromBusinessType(businessType: string): string {
  const type = String(businessType || 'general business').toLowerCase();

  const audienceMap: Record<string, string> = {
    'restaurant': 'Food enthusiasts and families',
    'healthcare': 'Patients and health-conscious individuals',
    'fitness': 'Health and fitness enthusiasts',
    'beauty': 'Beauty and wellness seekers',
    'finance': 'Individuals and businesses seeking financial services',
    'retail': 'Consumers and shoppers',
    'legal': 'Individuals and businesses needing legal services',
    'technology': 'Businesses and tech-savvy consumers',
    'education': 'Students and lifelong learners',
    'automotive': 'Vehicle owners and automotive enthusiasts'
  };

  for (const [key, audience] of Object.entries(audienceMap)) {
    if (type.includes(key)) {
      return audience;
    }
  }

  return 'General public and potential customers';
}

/**
 * Infer brand voice from business type
 */
function inferBrandVoiceFromBusinessType(businessType: string): string {
  const type = String(businessType || 'general business').toLowerCase();

  const voiceMap: Record<string, string> = {
    'restaurant': 'warm and welcoming',
    'healthcare': 'caring and professional',
    'fitness': 'motivational and energetic',
    'beauty': 'elegant and inspiring',
    'finance': 'trustworthy and professional',
    'retail': 'friendly and helpful',
    'legal': 'authoritative and trustworthy',
    'technology': 'innovative and professional',
    'education': 'knowledgeable and supportive',
    'automotive': 'reliable and expert'
  };

  for (const [key, voice] of Object.entries(voiceMap)) {
    if (type.includes(key)) {
      return voice;
    }
  }

  return 'professional and reliable';
}

/**
 * Infer writing tone from business context
 */
function inferWritingToneFromContext(businessType: string, brandVoice: string): string {
  const type = String(businessType || 'general business').toLowerCase();
  const voice = brandVoice.toLowerCase();

  // Combine business type and brand voice for more nuanced tone
  if (voice.includes('warm') || voice.includes('welcoming')) {
    return 'friendly and inviting';
  }
  if (voice.includes('caring') || voice.includes('professional')) {
    return 'professional and caring';
  }
  if (voice.includes('motivational') || voice.includes('energetic')) {
    return 'enthusiastic and motivating';
  }
  if (voice.includes('elegant') || voice.includes('inspiring')) {
    return 'sophisticated and inspiring';
  }
  if (voice.includes('trustworthy')) {
    return 'professional and trustworthy';
  }
  if (voice.includes('innovative')) {
    return 'modern and innovative';
  }

  // Fallback based on business type
  const toneMap: Record<string, string> = {
    'restaurant': 'warm and conversational',
    'healthcare': 'professional and reassuring',
    'fitness': 'energetic and motivational',
    'beauty': 'elegant and uplifting',
    'finance': 'professional and confident',
    'retail': 'friendly and helpful',
    'legal': 'formal and authoritative',
    'technology': 'professional and innovative',
    'education': 'informative and encouraging',
    'automotive': 'knowledgeable and reliable'
  };

  for (const [key, tone] of Object.entries(toneMap)) {
    if (type.includes(key)) {
      return tone;
    }
  }

  return 'professional and approachable';
}

/**
 * Infer key features from business context
 */
function inferKeyFeaturesFromContext(businessType: string, services: string[]): string[] {
  const type = String(businessType || 'general business').toLowerCase();

  const featureMap: Record<string, string[]> = {
    'restaurant': ['Fresh ingredients', 'Authentic recipes', 'Quality service'],
    'healthcare': ['Experienced professionals', 'Modern facilities', 'Comprehensive care'],
    'fitness': ['Expert trainers', 'Modern equipment', 'Personalized programs'],
    'beauty': ['Skilled professionals', 'Premium products', 'Relaxing environment'],
    'finance': ['Expert advice', 'Personalized solutions', 'Trusted service'],
    'retail': ['Quality products', 'Competitive prices', 'Excellent service'],
    'legal': ['Experienced attorneys', 'Personalized attention', 'Proven results'],
    'technology': ['Cutting-edge solutions', 'Expert team', 'Reliable support'],
    'education': ['Qualified instructors', 'Comprehensive curriculum', 'Flexible learning'],
    'automotive': ['Expert technicians', 'Quality parts', 'Reliable service']
  };

  for (const [key, features] of Object.entries(featureMap)) {
    if (type.includes(key)) {
      return features;
    }
  }

  // If services are provided, try to derive features from them
  if (services.length > 0) {
    return [
      'Professional service',
      'Quality solutions',
      'Customer satisfaction'
    ];
  }

  return ['Professional approach', 'Quality service', 'Customer focus'];
}

/**
 * Infer competitive advantages from business context
 */
function inferCompetitiveAdvantagesFromContext(businessType: string, keyFeatures: string[]): string[] {
  const type = String(businessType || 'general business').toLowerCase();

  const advantageMap: Record<string, string[]> = {
    'restaurant': ['Unique recipes', 'Local sourcing', 'Family atmosphere'],
    'healthcare': ['Personalized care', 'Advanced technology', 'Comprehensive services'],
    'fitness': ['Customized programs', 'Expert guidance', 'Supportive community'],
    'beauty': ['Latest techniques', 'Premium products', 'Personalized treatments'],
    'finance': ['Tailored strategies', 'Market expertise', 'Long-term relationships'],
    'retail': ['Curated selection', 'Competitive pricing', 'Exceptional service'],
    'legal': ['Specialized expertise', 'Strategic approach', 'Client-focused service'],
    'technology': ['Innovation focus', 'Scalable solutions', 'Technical expertise'],
    'education': ['Practical approach', 'Industry connections', 'Flexible scheduling'],
    'automotive': ['Certified expertise', 'Warranty coverage', 'Quick turnaround']
  };

  for (const [key, advantages] of Object.entries(advantageMap)) {
    if (type.includes(key)) {
      return advantages;
    }
  }

  // Try to derive from key features
  if (keyFeatures.length > 0) {
    return [
      'Industry expertise',
      'Customer-focused approach',
      'Proven track record'
    ];
  }

  return ['Professional excellence', 'Customer satisfaction', 'Reliable service'];
}

/**
 * Generate business description from context
 */
function generateBusinessDescription(businessType: string, services: string[], location: string): string {
  const type = String(businessType || 'general business').toLowerCase();
  const locationText = location !== 'Global' ? ` in ${location}` : '';
  const servicesText = services.length > 0 ? ` specializing in ${services.slice(0, 2).join(' and ')}` : '';

  const descriptionTemplates: Record<string, string> = {
    'restaurant': `A welcoming restaurant${locationText}${servicesText}, committed to providing exceptional dining experiences with quality ingredients and outstanding service.`,
    'healthcare': `A trusted healthcare provider${locationText}${servicesText}, dedicated to delivering comprehensive medical care with compassion and expertise.`,
    'fitness': `A dynamic fitness center${locationText}${servicesText}, helping individuals achieve their health and wellness goals through expert guidance and support.`,
    'beauty': `A premier beauty destination${locationText}${servicesText}, offering professional treatments and services to help clients look and feel their best.`,
    'finance': `A reliable financial services provider${locationText}${servicesText}, helping individuals and businesses achieve their financial goals through expert advice and personalized solutions.`,
    'retail': `A quality retail business${locationText}${servicesText}, committed to providing customers with excellent products and exceptional shopping experiences.`,
    'legal': `A professional law firm${locationText}${servicesText}, providing expert legal counsel and representation with dedication to client success.`,
    'technology': `An innovative technology company${locationText}${servicesText}, delivering cutting-edge solutions and expert technical services to drive business success.`,
    'education': `A dedicated educational institution${locationText}${servicesText}, committed to providing quality learning experiences and supporting student success.`,
    'automotive': `A trusted automotive service provider${locationText}${servicesText}, delivering expert vehicle care and maintenance with reliability and professionalism.`
  };

  for (const [key, template] of Object.entries(descriptionTemplates)) {
    if (type.includes(key)) {
      return template;
    }
  }

  return `A professional ${String(businessType || 'general business').toLowerCase()} business${locationText}${servicesText}, committed to delivering quality services and exceptional customer experiences.`;
}

/**
 * Calculate fallback quality score
 */
function calculateFallbackQualityScore(enhancedProfile: any, appliedFallbacks: FallbackStrategy[]): number {
  let baseScore = 100;

  // Reduce score based on number and confidence of fallbacks
  appliedFallbacks.forEach(fallback => {
    const confidencePenalty = (100 - fallback.confidence) * 0.3;
    baseScore -= confidencePenalty;
  });

  // Bonus for having real data
  const realDataFields = ['businessName', 'businessType', 'location', 'services', 'targetAudience'];
  const realDataCount = realDataFields.filter(field => {
    const fallback = appliedFallbacks.find(f => f.fieldName === field);
    return !fallback || fallback.confidence > 80;
  }).length;

  const realDataBonus = (realDataCount / realDataFields.length) * 20;
  baseScore += realDataBonus;

  return Math.max(0, Math.min(100, baseScore));
}

/**
 * Determine fallback confidence level
 */
function determineFallbackConfidenceLevel(appliedFallbacks: FallbackStrategy[]): 'High' | 'Medium' | 'Low' {
  if (appliedFallbacks.length === 0) return 'High';

  const averageConfidence = appliedFallbacks.reduce((sum, f) => sum + f.confidence, 0) / appliedFallbacks.length;
  const criticalFallbacks = appliedFallbacks.filter(f =>
    ['businessName', 'businessType', 'services', 'targetAudience'].includes(f.fieldName)
  );

  if (averageConfidence >= 70 && criticalFallbacks.length <= 1) return 'High';
  if (averageConfidence >= 50 && criticalFallbacks.length <= 3) return 'Medium';
  return 'Low';
}

/**
 * Generate fallback recommendations
 */
function generateFallbackRecommendations(
  appliedFallbacks: FallbackStrategy[],
  useCase: string
): string[] {
  const recommendations: string[] = [];

  if (appliedFallbacks.length === 0) {
    recommendations.push('Brand profile is complete - no fallbacks needed');
    return recommendations;
  }

  // Critical field recommendations
  const criticalFallbacks = appliedFallbacks.filter(f =>
    ['businessName', 'businessType', 'services', 'targetAudience'].includes(f.fieldName)
  );

  if (criticalFallbacks.length > 0) {
    recommendations.push('Complete critical business information for better content quality:');
    criticalFallbacks.forEach(fallback => {
      recommendations.push(`• Add real ${fallback.fieldName} - currently using: ${fallback.reasoning}`);
    });
  }

  // Low confidence recommendations
  const lowConfidenceFallbacks = appliedFallbacks.filter(f => f.confidence < 60);
  if (lowConfidenceFallbacks.length > 0) {
    recommendations.push('Improve low-confidence fallback fields:');
    lowConfidenceFallbacks.forEach(fallback => {
      recommendations.push(`• Provide real ${fallback.fieldName} data for better accuracy`);
    });
  }

  // Use case specific recommendations
  if (useCase === 'design_generation') {
    const designFallbacks = appliedFallbacks.filter(f =>
      ['brandColors', 'logoUrl', 'designExamples'].includes(f.fieldName)
    );
    if (designFallbacks.length > 0) {
      recommendations.push('Add visual brand elements for better design consistency');
    }
  }

  if (useCase === 'content_generation') {
    const contentFallbacks = appliedFallbacks.filter(f =>
      ['brandVoice', 'writingTone', 'keyFeatures', 'competitiveAdvantages'].includes(f.fieldName)
    );
    if (contentFallbacks.length > 0) {
      recommendations.push('Define brand voice and messaging for more personalized content');
    }
  }

  // General improvement recommendation
  recommendations.push('Consider completing your brand profile for optimal content generation quality');

  return recommendations;
}

/**
 * Validate fallback strategies effectiveness
 */
export function validateFallbackStrategies(
  originalProfile: any,
  enhancedProfile: any,
  appliedFallbacks: FallbackStrategy[]
): {
  isEffective: boolean;
  improvementScore: number;
  strategiesUsed: string[];
  qualityAssessment: string;
  recommendations: string[];
} {
  // Calculate improvement
  const originalCompleteness = assessBrandProfileCompleteness(originalProfile).overallCompleteness;
  const enhancedCompleteness = assessBrandProfileCompleteness(enhancedProfile).overallCompleteness;
  const improvementScore = enhancedCompleteness - originalCompleteness;

  // Assess strategies used
  const strategiesUsed = [...new Set(appliedFallbacks.map(f => f.source))];

  // Determine effectiveness
  const isEffective = improvementScore > 20 && enhancedCompleteness > 60;

  // Quality assessment
  let qualityAssessment = 'Poor';
  if (enhancedCompleteness >= 80) qualityAssessment = 'Excellent';
  else if (enhancedCompleteness >= 65) qualityAssessment = 'Good';
  else if (enhancedCompleteness >= 50) qualityAssessment = 'Fair';

  // Generate recommendations
  const recommendations = [];
  if (improvementScore < 20) {
    recommendations.push('Fallback strategies had limited impact - consider providing more original data');
  }
  if (appliedFallbacks.some(f => f.confidence < 50)) {
    recommendations.push('Some fallbacks have low confidence - verify and improve these fields');
  }
  if (strategiesUsed.includes('generic_default')) {
    recommendations.push('Generic defaults were used - provide specific business information for better results');
  }

  return {
    isEffective,
    improvementScore,
    strategiesUsed,
    qualityAssessment,
    recommendations
  };
}


