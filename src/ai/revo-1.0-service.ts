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
  const businessTypeLower = businessType.toLowerCase();
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
// NEW: Human Writing Style Generator - Authentic, Engaging
function getHumanWritingStyle(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);
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
function generateUniqueContentVariation(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);
  const contentStrategy = getDynamicContentStrategy(businessType, location, seed);
  const writingStyle = getHumanWritingStyle(businessType, location, seed);
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
 * Generate content using Revo 1.0 with Gemini (following Revo 2.0 architecture)
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
        websiteUrl: input.websiteUrl
      }
    };
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
/**
 * Generate content using Gemini (following Revo 2.0 advanced content generation pattern)
 */
async function generateRevo10ContentWithGemini(options: any, concept: any): Promise<any> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  // Get brand key for anti-repetition system
  const brandKey = getBrandKey(options.brandProfile, options.platform);
  const recentData = recentOutputs.get(brandKey) || { headlines: [], captions: [], concepts: [] };

  console.log('🚀 [Revo 1.0] Starting advanced content generation with Gemini');
  console.log('🔍 [Revo 1.0] Options:', {
    businessType: options.businessType,
    businessName: options.brandProfile?.businessName,
    platform: options.platform,
    useLocalLanguage: options.useLocalLanguage
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 [Revo 1.0] Content Generation Attempt ${attempt}/${maxRetries} - Using Gemini 2.5 Flash`);

      // Build advanced prompt using Revo 2.0 system
      const prompt = buildRevo10ContentPrompt(options, concept);
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

        // Content validation (similar to Revo 2.0) - MADE MORE LENIENT FOR DEBUGGING
        const headlineValid = parsed.headline && parsed.headline.trim().length > 0 && parsed.headline.split(' ').length <= 8; // Increased from 6 to 8
        const subheadlineValid = parsed.subheadline && parsed.subheadline.trim().length > 0 && parsed.subheadline.split(' ').length <= 30; // Increased from 25 to 30
        const captionValid = parsed.caption && parsed.caption.trim().length >= 10; // Reduced from 20 to 10
        const ctaValid = parsed.cta && parsed.cta.trim().length > 0;
        const hashtagsValid = Array.isArray(parsed.hashtags) && parsed.hashtags.length >= 1; // Reduced from 3 to 1

        // Check for banned patterns and repetition
        const headlineHasBannedPatterns = hasBannedPattern(parsed.headline);
        const captionHasBannedPatterns = hasBannedPattern(parsed.caption);
        const headlineTooSimilar = tooSimilar(parsed.headline, recentData.headlines, 0.55);
        const captionTooSimilar = tooSimilar(parsed.caption, recentData.captions, 0.40);

        // Enhanced validation checks
        const headlineIsGeneric = /^[a-z]+ your [a-z]+$/i.test(parsed.headline.trim()) ||
          parsed.headline.includes('Experience the excellence') ||
          parsed.headline.includes('Transform your');

        const captionIsGeneric = parsed.caption.includes('Experience the excellence of') ||
          parsed.caption.includes('makes financial technology company effortless') ||
          /makes .+ effortless and effective/i.test(parsed.caption);

        console.log('🔍 [Revo 1.0] Content validation results:', {
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
          captionIsGeneric
        });

        // NEW: Add headline-caption coherence validation (ported from Revo 2.0) - ENHANCED FOR FINANCIAL TECH
        const headlineWords = (parsed.headline || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const captionWords = parsed.caption.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        console.log(`🔍 [Revo 1.0] COHERENCE DEBUG - Headline: "${parsed.headline}"`);
        console.log(`🔍 [Revo 1.0] COHERENCE DEBUG - Caption: "${parsed.caption}"`);
        console.log(`🔍 [Revo 1.0] COHERENCE DEBUG - Headline words: ${headlineWords.join(', ')}`);
        console.log(`🔍 [Revo 1.0] COHERENCE DEBUG - Caption words: ${captionWords.slice(0, 10).join(', ')}`);

        // Enhanced semantic matching for financial technology business
        const hasCommonWords = headlineWords.some(headlineWord =>
          captionWords.some(captionWord => {
            // Exact match
            if (headlineWord === captionWord) return true;

            // Financial Technology specific semantic matches
            if (headlineWord === 'finance' && ['financial', 'money', 'payment', 'banking', 'cash', 'paya'].includes(captionWord)) return true;
            if (headlineWord === 'financial' && ['finance', 'money', 'payment', 'banking', 'cash', 'paya'].includes(captionWord)) return true;
            if (headlineWord === 'technology' && ['tech', 'digital', 'mobile', 'app', 'system', 'solution'].includes(captionWord)) return true;
            if (headlineWord === 'paya' && ['finance', 'financial', 'money', 'payment', 'banking'].includes(captionWord)) return true;

            // General business semantic matches
            if (headlineWord === 'banking' && ['bank', 'money', 'payment', 'finance', 'financial', 'paya'].includes(captionWord)) return true;
            if (headlineWord === 'payment' && ['pay', 'money', 'banking', 'finance', 'financial', 'paya'].includes(captionWord)) return true;
            if (headlineWord === 'secure' && ['security', 'safe', 'protection', 'protect', 'trust'].includes(captionWord)) return true;
            if (headlineWord === 'daily' && ['every', 'everyday', 'routine', 'regular'].includes(captionWord)) return true;
            if (headlineWord === 'business' && ['company', 'shop', 'enterprise', 'commercial', 'work'].includes(captionWord)) return true;
            if (headlineWord === 'money' && ['cash', 'payment', 'finance', 'financial', 'banking', 'paya'].includes(captionWord)) return true;
            if (headlineWord === 'smart' && ['intelligent', 'clever', 'advanced', 'modern', 'tech'].includes(captionWord)) return true;

            // Root word matching (more conservative)
            if (headlineWord.length > 4 && captionWord.length > 4) {
              const headlineRoot = headlineWord.substring(0, Math.min(5, headlineWord.length));
              const captionRoot = captionWord.substring(0, Math.min(5, captionWord.length));
              if (headlineRoot === captionRoot) return true;
            }
            return false;
          })
        );

        // More lenient coherence check - only flag as disconnected if caption is substantial AND has no semantic connection
        const captionDisconnected = !hasCommonWords && parsed.caption.length > 80; // Increased threshold

        console.log(`🔗 [Revo 1.0] COHERENCE DEBUG - Has common words: ${hasCommonWords}`);
        console.log(`🚫 [Revo 1.0] COHERENCE DEBUG - Caption disconnected: ${captionDisconnected}`);

        // Enhanced validation debugging
        console.log(`🔍 [Revo 1.0] VALIDATION DEBUG:`);
        console.log(`   📏 headlineValid: ${headlineValid}`);
        console.log(`   📏 subheadlineValid: ${subheadlineValid}`);
        console.log(`   📏 captionValid: ${captionValid}`);
        console.log(`   📏 ctaValid: ${ctaValid}`);
        console.log(`   📏 hashtagsValid: ${hashtagsValid}`);
        console.log(`   🚫 headlineHasBannedPatterns: ${headlineHasBannedPatterns}`);
        console.log(`   🚫 captionHasBannedPatterns: ${captionHasBannedPatterns}`);
        console.log(`   🔄 headlineTooSimilar: ${headlineTooSimilar}`);
        console.log(`   🔄 captionTooSimilar: ${captionTooSimilar}`);
        console.log(`   📝 headlineIsGeneric: ${headlineIsGeneric}`);
        console.log(`   📝 captionIsGeneric: ${captionIsGeneric}`);
        console.log(`   🔗 captionDisconnected: ${captionDisconnected}`);

        // TEMPORARILY DISABLE COHERENCE VALIDATION TO DEBUG
        const skipCoherenceValidation = true; // TODO: Remove this after debugging

        // If content passes validation, apply quality enhancement
        if (headlineValid && subheadlineValid && captionValid && ctaValid && hashtagsValid &&
          !headlineHasBannedPatterns && !captionHasBannedPatterns &&
          !headlineTooSimilar && !captionTooSimilar &&
          !headlineIsGeneric && !captionIsGeneric && (skipCoherenceValidation || !captionDisconnected)) {

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

          console.log('✅ [Revo 1.0] Final enhanced result:', finalResult);
          return finalResult;
        } else {
          // Enhanced validation failure logging
          const reasons = [];
          if (!headlineValid) reasons.push('invalid headline');
          if (!subheadlineValid) reasons.push('invalid subheadline');
          if (!captionValid) reasons.push('invalid caption');
          if (!ctaValid) reasons.push('invalid CTA');
          if (!hashtagsValid) reasons.push('invalid hashtags');
          if (headlineHasBannedPatterns) reasons.push('headline has banned patterns');
          if (captionHasBannedPatterns) reasons.push('caption has banned patterns');
          if (headlineTooSimilar) reasons.push('headline too similar');
          if (captionTooSimilar) reasons.push('caption too similar');
          if (headlineIsGeneric) reasons.push('headline is generic');
          if (captionIsGeneric) reasons.push('caption is generic');
          if (captionDisconnected) reasons.push('caption disconnected from headline');

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

  return generateUniqueFallbackContent(options.brandProfile, options.businessType, options.platform, 3, Date.now() % 10, concept);
}
/**
 * Build advanced content prompt for Revo 1.0 (using Revo 2.0 sophisticated system)
 */
function buildRevo10ContentPrompt(options: any, concept: any): string {
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

💼 BUSINESS INTELLIGENCE:
${keyFeaturesList.length > 0 ? `- Key Features: ${keyFeaturesList.slice(0, 5).join(', ')}` : ''}
${competitiveAdvantagesList.length > 0 ? `- Competitive Advantages: ${competitiveAdvantagesList.slice(0, 3).join(', ')}` : ''}
${servicesList.length > 0 ? `- Services: ${servicesList.slice(0, 4).join(', ')}` : ''}
${brandProfile.targetAudience ? `- Target Audience: ${brandProfile.targetAudience}` : ''}
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

📝 CONTENT REQUIREMENTS - MUST WORK TOGETHER AS ONE STORY:
1. HEADLINE (max 6 words): This will appear as text IN the image design - make it compelling
2. SUBHEADLINE (max 25 words): This will also appear IN the image - should support the headline

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
- SPECIFIC ACTION: "Open Account" not generic "Learn More"
- BENEFIT-DRIVEN: "Start Saving" not "Get Started"
- URGENCY WHEN APPROPRIATE: "Join Today" not "Contact Us"
- CONTEXTUAL: Match the headline theme - if headline is about speed, CTA should be "Get Instant Access"
- CLEAR VALUE: "Try Free" better than "Sign Up"
- WEBSITE PROMINENCE: Always include website URL prominently in design

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
4. HASHTAGS (exactly ${hashtagCount} tags): REFLECT the same theme as headline/caption
5. CALL-TO-ACTION: COMPLETES the story with clear next step

🎯 HEADLINE CLARITY REQUIREMENTS (BASED ON USER FEEDBACK):
- SPECIFIC BENEFITS: "Accept Payments Instantly", "Zero Transaction Fees", "Open Account 5 Minutes"
- AVOID VAGUE: Never use "Business flows. Money moves." - too unclear
- CLEAR VALUE: What exactly does Paya do? Be specific about the benefit
- BENEFIT-FIRST: Lead with what customer gets, not abstract concepts
- PAIN POINT DIRECT: "End Payment Delays", "Skip Bank Queues", "Stop Cash Flow Issues"
- READABLE: Ensure text works well in image designs and mobile viewing

💡 VALUE PROPOSITION CLARITY (USER FEEDBACK):
- EXPLAIN WHY: Don't just say "Easy banking" - explain WHY it's easy
- DIFFERENTIATION: What makes Paya different from other options?
- SPECIFIC FEATURES: "5-minute setup", "No hidden fees", "24/7 support"
- PROOF POINTS: Use numbers, timeframes, guarantees when possible
- CUSTOMER BENEFIT: Focus on what the customer gains, not what Paya offers
- CLEAR COMPARISON: "Traditional banks: 3 days. Paya: 3 seconds"

🚨 BUSINESS RELEVANCE VALIDATION (CRITICAL):
- NEVER create content about industries/services the business doesn't offer
- If business is FINTECH → Focus ONLY on payments, banking, transfers, business finance, mobile money
- If business is HEALTHCARE → Focus ONLY on medical services, patient care, health solutions
- If business is EDUCATION → Focus ONLY on learning, courses, academic services
- ALWAYS check: Does this headline relate to the actual business services?
- BANNED for Paya Finance: Education themes, academic scenarios, student content, textbook references
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
- AVOID: Education themes, academic scenarios, student content, textbook references, school-related content
- CREATE: Authentic fintech scenarios that Paya customers actually experience

📊 USE ACTUAL COMPANY DATA (MANDATORY):
- Business Name: ${brandProfile.businessName}
- Location: ${brandProfile.location || 'Kenya'}
- Services: ${normalizeStringList(brandProfile.services || []).join(', ') || 'Financial Technology Services'}
- Key Features: ${normalizeStringList(brandProfile.keyFeatures || []).join(', ') || 'Mobile Banking, Instant Payments'}
- Unique Selling Points: ${normalizeStringList(brandProfile.uniqueSellingPoints || []).join(', ') || 'Fast, Secure, Affordable'}
- Target Audience: ${brandProfile.targetAudience || 'Small Business Owners, Entrepreneurs'}
- NEVER use generic placeholders - ALWAYS reference actual business data above

🎯 REAL BUSINESS SCENARIOS TO USE (SPECIFIC & RELATABLE):
- "Supplier payment due today, bank transfer takes 3 days"
- "Customer wants to pay, but your POS machine is down"
- "Rent collection from 50 tenants, manual tracking nightmare"
- "Business growing fast, need instant payment solutions"
- "M-Pesa limits hit, need bigger transaction capacity"
- "International client wants to pay, bank charges 15%"
- "Cash flow tight, need Buy Now Pay Later for inventory"

🧪 A/B TESTING PAIN POINTS (USER SUGGESTION):
- "Tired of waiting for payments?" vs "Payment delays killing sales?"
- "Cash flow problems?" vs "Need money faster?"
- "Bank queues wasting time?" vs "Skip the bank entirely"
- "High transaction fees?" vs "Pay zero fees"
- "Complicated banking?" vs "Banking made simple"
- "Slow money transfers?" vs "Instant money movement"

🎯 DIVERSE MARKETING APPROACHES (USE DIFFERENT ONES EACH TIME):
1. SPECIFIC BENEFIT-FOCUSED: "Accept payments instantly", "No transaction fees", "Open account in 5 minutes"
2. PAIN POINT DIRECT: "Tired of waiting for payments?", "Cash flow problems?", "Bank queues wasting your time?"
3. COMPARISON CLEAR: "Traditional banks: 3 days. Paya: 3 seconds"
4. URGENCY WITH BENEFIT: "Stop losing sales to payment delays - Get Paya today"
5. SOCIAL PROOF SPECIFIC: "10,000+ Kenyan businesses trust Paya for payments"
6. FEATURE SPOTLIGHT CLEAR: "Instant M-Pesa integration", "Zero setup fees", "24/7 customer support"
7. LIFESTYLE BENEFIT: "Run your business from anywhere with mobile banking"
8. EMOTIONAL RELIEF: "Sleep better knowing payments are secure and instant"
9. TECHNICAL ADVANTAGE: "99.9% uptime, bank-level security, instant notifications"
10. LOCAL SOLUTION: "Built for Kenyan businesses, by Kenyan entrepreneurs"

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
- Example format: #Paya #DigitalBanking #Kenya #Fintech #MobileMoney
- DO NOT include: #PayaFintech #BNPLKenya #SmartSpending #NairobiFinance #FinTechKenya #PaymentPlans #BuyNowPayLater #DeferredPayment #FlexiblePayment #InstallmentPlans
- PRIORITIZE: Brand name (#Paya) + Service type + Location + Industry + One specific feature
- QUALITY over quantity - ${hashtagCount} strategic hashtags perform better than 10 generic ones

🇰🇪 KENYAN CULTURAL CONNECTION (MANDATORY):
- Reference real Kenyan experiences: matatu rides, M-Pesa, university fees, family support
- Use locally relevant scenarios: "When your cousin needs school fees", "After a long day at work"
- Include Kenyan context: Nairobi traffic, campus life, family obligations, side hustles
- Sound like someone who actually lives in Kenya and understands daily challenges
- Reference local pain points: expensive bank charges, long queues, complicated processes

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

// Normalize service list helper
function normalizeServiceList(input: any): string[] {
  if (Array.isArray(input)) {
    return input.map(service => {
      if (typeof service === 'string') return service;
      if (typeof service === 'object' && service.name) return service.name;
      if (typeof service === 'object' && service.serviceName) return service.serviceName;
      return String(service);
    }).filter(s => s && s.trim().length > 0);
  }
  if (typeof input === 'string') return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return [];
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

// Get location-specific language instructions
function getLocationSpecificLanguageInstructions(location: string): string {
  const locationKey = location.toLowerCase();

  if (locationKey.includes('kenya')) {
    return `- SWAHILI ELEMENTS: "Karibu" (welcome), "Asante" (thank you), "Haraka" (fast), "Poa" (cool/good), "Mambo" (what's up)
- BUSINESS CONTEXT: "Biashara" (business), "Huduma" (service), "Kazi" (work), "Pesa" (money), "Benki" (bank)
- FINTECH TERMS: "M-Pesa" (mobile money), "Simu" (phone), "Mitandao" (networks), "Usalama" (security)
- INTEGRATION EXAMPLES:
  * "Fast payments" → "Malipo ya haraka"
  * "No worries" → "Hakuna wasiwasi"
  * "Let's start" → "Twende tuanze"
  * "Very secure" → "Salama sana"`;
  }

  if (locationKey.includes('nigeria')) {
    return `- PIDGIN ELEMENTS: "How far?" (how are you), "No wahala" (no problem), "Chop money" (spend money), "Sharp sharp" (quickly)
- BUSINESS CONTEXT: "Business" (business), "Work" (work), "Money" (money), "Bank" (bank)
- FINTECH TERMS: "Transfer" (transfer), "Account" (account), "Card" (card), "Mobile banking"
- INTEGRATION EXAMPLES:
  * "Fast payments" → "Quick transfer, no wahala"
  * "No worries" → "No stress at all"
  * "Let's start" → "Make we start"
  * "Very secure" → "100% secure"`;
  }

  // Default for other locations
  return `- Use appropriate local language elements for ${location}
- Mix English (70%) with local language (30%) naturally
- Include culturally relevant terms and expressions
- Maintain professional tone while being locally authentic`;
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

// Get authentic story scenarios
function getAuthenticStoryScenarios(brandProfile: any, businessType: string): string {
  const scenarios = [];

  if (businessType.toLowerCase().includes('fintech') || businessType.toLowerCase().includes('finance')) {
    scenarios.push(
      '- Small business owner needs to pay suppliers quickly to maintain relationships',
      '- University student managing limited budget while supporting family',
      '- Entrepreneur growing business but struggling with traditional banking limitations',
      '- Family member sending money home for school fees or medical expenses'
    );
  } else if (businessType.toLowerCase().includes('health')) {
    scenarios.push(
      '- Patient needing convenient access to healthcare services',
      '- Family caring for elderly relative with ongoing medical needs',
      '- Professional managing health while maintaining busy work schedule',
      '- Community member seeking preventive care and wellness support'
    );
  } else {
    scenarios.push(
      '- Customer facing daily challenges that your service solves',
      '- Professional needing reliable solutions for work efficiency',
      '- Family member seeking quality services for loved ones',
      '- Community member looking for trusted local business'
    );
  }

  return scenarios.join('\n');
}

// Get customer pain points for business
function getCustmerPainPointsForBusiness(businessType: string, brandProfile: any): string {
  const painPoints = [];

  if (businessType.toLowerCase().includes('fintech') || businessType.toLowerCase().includes('finance')) {
    painPoints.push(
      '- Long bank queues and limited banking hours',
      '- High transaction fees and hidden charges',
      '- Complicated account opening processes',
      '- Limited access to credit and financial services',
      '- Slow money transfers and payment processing'
    );
  } else if (businessType.toLowerCase().includes('health')) {
    painPoints.push(
      '- Long waiting times for appointments',
      '- Limited access to quality healthcare',
      '- High medical costs and insurance complications',
      '- Difficulty finding trusted healthcare providers',
      '- Lack of convenient healthcare options'
    );
  } else {
    painPoints.push(
      '- Limited access to quality services',
      '- High costs and hidden fees',
      '- Poor customer service experience',
      '- Complicated processes and procedures',
      '- Lack of reliable service providers'
    );
  }

  return painPoints.join('\n');
}

// Get value propositions for business
function getValuePropositionsForBusiness(businessType: string, brandProfile: any): string {
  const valueProps = [];

  if (businessType.toLowerCase().includes('fintech') || businessType.toLowerCase().includes('finance')) {
    valueProps.push(
      '- Instant account opening with no paperwork',
      '- Zero hidden fees and transparent pricing',
      '- 24/7 mobile banking convenience',
      '- Fast money transfers and payments',
      '- No minimum balance requirements'
    );
  } else if (businessType.toLowerCase().includes('health')) {
    valueProps.push(
      '- Quick appointment scheduling and minimal wait times',
      '- Affordable healthcare with transparent pricing',
      '- Qualified and experienced healthcare professionals',
      '- Convenient location and flexible hours',
      '- Comprehensive care and follow-up support'
    );
  } else {
    valueProps.push(
      '- High-quality service delivery',
      '- Competitive and transparent pricing',
      '- Professional and reliable service',
      '- Convenient and accessible solutions',
      '- Excellent customer support'
    );
  }

  return valueProps.join('\n');
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
    // TEXTBOOK AND EDUCATION BANS FOR FINTECH
    /textbook/i,
    /semester/i,
    /professor/i,
    /student/i,
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

  const ctaVariations = [
    'Get Started',
    'Learn More',
    'Contact Us',
    'Try Today',
    'Book Now',
    'Call Now',
    'Visit Us',
    'Join Now'
  ];

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
  const businessLower = businessType.toLowerCase();

  if (businessLower.includes('bank') || businessLower.includes('financial') || businessLower.includes('money')) {
    return `💰 FINANCIAL SERVICES GUIDANCE:
- GOOD: Show families saving for goals, mobile money transfers, small business growth
- GOOD: People using mobile banking for everyday transactions, paying school fees
- GOOD: Small business owners managing cash flow, market vendors using digital payments
- AVOID: Complex trading floors, stock market graphs, corporate boardrooms
- AVOID: Western banking imagery that doesn't reflect local financial habits`;
  }

  if (businessLower.includes('tech') || businessLower.includes('software') || businessLower.includes('app')) {
    return `💻 TECHNOLOGY SERVICES GUIDANCE:
- GOOD: People using phones naturally, simple app interfaces, everyday tech use
- GOOD: Small business owners using tech to grow, students learning online
- GOOD: Community members connecting through technology, solving real problems
- AVOID: Complex coding screens, server rooms, abstract tech concepts
- AVOID: Futuristic interfaces that feel disconnected from daily life`;
  }

  if (businessLower.includes('education') || businessLower.includes('school') || businessLower.includes('learning')) {
    return `📚 EDUCATION SERVICES GUIDANCE:
- GOOD: Students in local classroom settings, community learning spaces
- GOOD: Teachers and students interacting, practical learning scenarios
- GOOD: Family education moments, skill development in real contexts
- AVOID: Generic classroom stock photos, overly formal academic settings
- AVOID: Western educational imagery that doesn't reflect local learning culture`;
  }

  return `🏢 GENERAL BUSINESS GUIDANCE:
- GOOD: Real people in authentic local business settings
- GOOD: Community-focused business interactions, local market contexts
- GOOD: Service providers helping real customers with genuine needs
- AVOID: Generic corporate imagery, stock photo business scenarios
- AVOID: Western business culture that doesn't resonate locally`;
}

function getVisualContextForBusiness(businessType: string, concept: string): string {
  const businessLower = businessType.toLowerCase();

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
        websiteUrl: input.websiteUrl
      },
      aspectRatio: '1:1',
      visualStyle: input.visualStyle || 'modern',
      scheduledServices: input.scheduledServices,
      followBrandColors: input.followBrandColors,
      includePeopleInDesigns: input.includePeople,
      includeContacts: input.includeContacts
    };

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

  // Extract brand colors from profile with toggle support
  const shouldFollowBrandColors = options.followBrandColors !== false; // Default to true if not specified

  const primaryColor = shouldFollowBrandColors ? (brandProfile.primaryColor || '#3B82F6') : '#3B82F6';
  const accentColor = shouldFollowBrandColors ? (brandProfile.accentColor || '#1E40AF') : '#1E40AF';
  const backgroundColor = shouldFollowBrandColors ? (brandProfile.backgroundColor || '#FFFFFF') : '#FFFFFF';

  console.log('🎨 [Revo 1.0] Brand Colors Debug:', {
    followBrandColors: shouldFollowBrandColors,
    inputPrimaryColor: brandProfile.primaryColor,
    inputAccentColor: brandProfile.accentColor,
    inputBackgroundColor: brandProfile.backgroundColor,
    finalPrimaryColor: primaryColor,
    finalAccentColor: accentColor,
    finalBackgroundColor: backgroundColor,
    hasValidColors: !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor),
    usingBrandColors: shouldFollowBrandColors && !!(brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor)
  });

  // Build color scheme instruction
  const colorScheme = `Primary: ${primaryColor} (60% dominant), Accent: ${accentColor} (30% secondary), Background: ${backgroundColor} (10% highlights)`;

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
  const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'botswana', 'malawi'];
  const isAfricanCountry = africanCountries.some(country => location.toLowerCase().includes(country.toLowerCase()));

  // Build people inclusion instructions based on toggle
  let peopleInstructions = '';
  if (options.includePeopleInDesigns === false) {
    peopleInstructions = `\n\n👥 PEOPLE EXCLUSION REQUIREMENT:\n- MANDATORY: Create a clean, professional design WITHOUT any people or human figures\n- AVOID: Any human faces, bodies, or silhouettes\n- FOCUS: Products, services, abstract elements, or clean minimalist design\n- STYLE: Professional, clean aesthetics without human elements\n- EMPHASIS: Brand elements, typography, and non-human visual elements`;
  } else {
    if (isAfricanCountry) {
      peopleInstructions = `\n\n👥 PEOPLE INCLUSION (AFRICAN REPRESENTATION):\n- Include authentic Black/African people who represent the target market\n- Show people who would actually use ${businessType} services\n- Display local African people in settings relevant to ${businessType} business\n- Ensure faces are fully visible, well-lit, and anatomically correct\n- PRIORITY: 80%+ of people should be Black/African for cultural authenticity\n- Context: Show people in ${businessType}-relevant settings, not generic offices`;
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

🎯 STRONG FLEXIBLE TEMPLATE STRUCTURE (MANDATORY):
1. NEUTRAL BACKGROUND: White or soft gradient (never busy patterns)
2. ACCENT COLOR: Tied to post theme using brand colors strategically
3. SINGLE FOCAL ELEMENT: 1 person photo OR 1 relatable object (never both)
4. EMOTIONAL HEADLINE: Human tone, not corporate speak
5. OPTIONAL IDENTITY ELEMENT: Small icon or motif for brand consistency

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
- BACKGROUND: Clean white (#FFFFFF) or subtle gradient using brand colors
- ACCENT COLOR: Use ${primaryColor} or ${accentColor} strategically for theme connection
- FOCAL ELEMENT: Choose ONE - either person OR object, positioned prominently

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
- Write like a REAL PERSON talking to a friend, not a corporate press release
- Use conversational, warm tone: "Hey" instead of "We are pleased to announce"
- Include personality and character - sound distinctly like ${brandProfile.businessName}, not generic fintech
- Use specific, concrete language instead of vague corporate buzzwords
- Sound like someone who actually understands ${location} life and challenges
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
- USE REAL SCENARIOS: "It's month-end. Rent is due tomorrow. Your business account shows KSh 15,000 but you need KSh 25,000."

🎭 REAL HUMAN STORYTELLING (MANDATORY):
- START with a REAL SCENARIO: "Three weeks waiting for bank loan approval. Your supplier needs payment today."
- CREATE A SCENE: Paint a picture people can see and feel
- USE REAL EMOTIONS: stress, relief, hope, frustration, excitement
- SHOW, DON'T TELL: "Mom's birthday is coming up" vs "family obligations"
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

REVO 1.0 ENHANCED FEATURES:
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
${contactInstruction}`;
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
