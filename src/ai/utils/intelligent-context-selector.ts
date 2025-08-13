/**
 * Intelligent Context Selector
 * 
 * This module acts like a local expert who knows what information
 * is relevant for each business type, location, and content context.
 * It intelligently selects which data to use and which to ignore.
 */

export interface ContextRelevance {
  weather: {
    useWeather: boolean;
    relevanceReason: string;
    priority: 'high' | 'medium' | 'low' | 'ignore';
  };
  events: {
    useEvents: boolean;
    relevanceReason: string;
    priority: 'high' | 'medium' | 'low' | 'ignore';
    eventTypes: string[];
  };
  trends: {
    useTrends: boolean;
    relevanceReason: string;
    priority: 'high' | 'medium' | 'low' | 'ignore';
    trendTypes: string[];
  };
  cultural: {
    useCultural: boolean;
    relevanceReason: string;
    priority: 'high' | 'medium' | 'low' | 'ignore';
    culturalElements: string[];
  };
}

/**
 * Intelligently determines what context information to use
 * based on business type, location, and content purpose
 */
export function selectRelevantContext(
  businessType: string,
  location: string,
  platform: string,
  contentThemes?: string,
  dayOfWeek?: string
): ContextRelevance {
  
  const businessKey = businessType.toLowerCase();
  const locationKey = location.toLowerCase();
  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
  
  return {
    weather: analyzeWeatherRelevance(businessKey, locationKey, platform, isWeekend),
    events: analyzeEventsRelevance(businessKey, locationKey, platform, isWeekend),
    trends: analyzeTrendsRelevance(businessKey, locationKey, platform),
    cultural: analyzeCulturalRelevance(businessKey, locationKey, platform)
  };
}

/**
 * Determines if weather information is relevant for this business/location
 */
function analyzeWeatherRelevance(
  businessType: string,
  location: string,
  platform: string,
  isWeekend: boolean
): ContextRelevance['weather'] {
  
  // High weather relevance businesses
  const weatherSensitiveBusinesses = [
    'restaurant', 'cafe', 'food', 'dining',
    'fitness', 'gym', 'sports', 'outdoor',
    'retail', 'shopping', 'fashion',
    'tourism', 'travel', 'hotel',
    'construction', 'agriculture',
    'delivery', 'transportation'
  ];
  
  // Medium weather relevance
  const moderateWeatherBusinesses = [
    'beauty', 'spa', 'wellness',
    'entertainment', 'events',
    'real estate', 'automotive'
  ];
  
  // Low/No weather relevance
  const weatherIndependentBusinesses = [
    'financial technology software', 'fintech', 'banking',
    'software', 'technology', 'saas',
    'consulting', 'legal', 'accounting',
    'insurance', 'healthcare', 'education',
    'digital marketing', 'design'
  ];
  
  // Check business type relevance
  const isHighRelevance = weatherSensitiveBusinesses.some(type => 
    businessType.includes(type)
  );
  
  const isMediumRelevance = moderateWeatherBusinesses.some(type => 
    businessType.includes(type)
  );
  
  const isLowRelevance = weatherIndependentBusinesses.some(type => 
    businessType.includes(type)
  );
  
  // Location-based adjustments
  const isExtremeWeatherLocation = location.includes('nairobi') || 
                                   location.includes('kenya') ||
                                   location.includes('tropical');
  
  if (isHighRelevance) {
    return {
      useWeather: true,
      relevanceReason: `${businessType} customers are highly influenced by weather conditions`,
      priority: 'high'
    };
  }
  
  if (isMediumRelevance) {
    return {
      useWeather: true,
      relevanceReason: `Weather can impact ${businessType} customer behavior`,
      priority: 'medium'
    };
  }
  
  if (isLowRelevance) {
    return {
      useWeather: false,
      relevanceReason: `${businessType} operates independently of weather conditions`,
      priority: 'ignore'
    };
  }
  
  // Default case
  return {
    useWeather: isExtremeWeatherLocation,
    relevanceReason: isExtremeWeatherLocation ? 
      'Local weather is culturally significant' : 
      'Weather has minimal business impact',
    priority: isExtremeWeatherLocation ? 'low' : 'ignore'
  };
}

/**
 * Determines if local events are relevant for this business/location
 */
function analyzeEventsRelevance(
  businessType: string,
  location: string,
  platform: string,
  isWeekend: boolean
): ContextRelevance['events'] {
  
  // Always relevant for networking/community businesses
  const networkingBusinesses = [
    'consulting', 'marketing', 'business services',
    'financial technology software', 'fintech',
    'real estate', 'insurance', 'legal'
  ];
  
  // Event-dependent businesses
  const eventDependentBusinesses = [
    'restaurant', 'entertainment', 'retail',
    'fitness', 'beauty', 'tourism'
  ];
  
  // B2B vs B2C consideration
  const isB2B = networkingBusinesses.some(type => businessType.includes(type)) ||
                businessType.includes('software') ||
                businessType.includes('technology');
  
  const isB2C = eventDependentBusinesses.some(type => businessType.includes(type));
  
  // Relevant event types based on business
  let eventTypes: string[] = [];
  
  if (isB2B) {
    eventTypes = ['business', 'networking', 'conference', 'workshop', 'professional'];
  }
  
  if (isB2C) {
    eventTypes = ['community', 'festival', 'entertainment', 'cultural', 'local'];
  }
  
  // Location-based event culture
  const isEventCentricLocation = location.includes('nairobi') ||
                                 location.includes('new york') ||
                                 location.includes('london');
  
  if (isB2B && isEventCentricLocation) {
    return {
      useEvents: true,
      relevanceReason: `${businessType} benefits from professional networking events`,
      priority: 'high',
      eventTypes
    };
  }
  
  if (isB2C) {
    return {
      useEvents: true,
      relevanceReason: `Local events drive foot traffic for ${businessType}`,
      priority: 'medium',
      eventTypes
    };
  }
  
  return {
    useEvents: isEventCentricLocation,
    relevanceReason: isEventCentricLocation ? 
      'Local events show community engagement' : 
      'Events have minimal business relevance',
    priority: isEventCentricLocation ? 'low' : 'ignore',
    eventTypes: ['community']
  };
}

/**
 * Determines trending topics relevance
 */
function analyzeTrendsRelevance(
  businessType: string,
  location: string,
  platform: string
): ContextRelevance['trends'] {
  
  // Always use trends for social media businesses
  const trendDependentBusinesses = [
    'marketing', 'social media', 'content',
    'entertainment', 'fashion', 'beauty',
    'technology', 'startup'
  ];
  
  // Industry-specific trend types
  let trendTypes: string[] = [];
  
  if (businessType.includes('technology') || businessType.includes('fintech')) {
    trendTypes = ['technology', 'business', 'innovation', 'startup'];
  } else if (businessType.includes('restaurant') || businessType.includes('food')) {
    trendTypes = ['food', 'lifestyle', 'local', 'cultural'];
  } else if (businessType.includes('fitness')) {
    trendTypes = ['health', 'wellness', 'lifestyle', 'sports'];
  } else {
    trendTypes = ['business', 'local', 'community'];
  }
  
  const isTrendSensitive = trendDependentBusinesses.some(type => 
    businessType.includes(type)
  );
  
  // Platform consideration
  const isSocialPlatform = platform === 'instagram' || platform === 'twitter';
  
  return {
    useTrends: true, // Most businesses benefit from some trending topics
    relevanceReason: isTrendSensitive ? 
      `${businessType} thrives on current trends and conversations` :
      'Trending topics increase content relevance and engagement',
    priority: isTrendSensitive ? 'high' : 'medium',
    trendTypes
  };
}

/**
 * Determines cultural context relevance
 */
function analyzeCulturalRelevance(
  businessType: string,
  location: string,
  platform: string
): ContextRelevance['cultural'] {
  
  // Always high relevance for local businesses
  const localBusinesses = [
    'restaurant', 'retail', 'fitness', 'beauty',
    'real estate', 'healthcare', 'education'
  ];
  
  // Cultural elements to emphasize
  let culturalElements: string[] = [];
  
  if (location.includes('nairobi') || location.includes('kenya')) {
    culturalElements = ['ubuntu philosophy', 'harambee spirit', 'swahili expressions', 'community values'];
  } else if (location.includes('new york')) {
    culturalElements = ['diversity', 'hustle culture', 'innovation', 'fast-paced lifestyle'];
  } else if (location.includes('london')) {
    culturalElements = ['tradition', 'multiculturalism', 'business etiquette', 'dry humor'];
  } else {
    culturalElements = ['local customs', 'community values', 'regional preferences'];
  }
  
  const isLocalBusiness = localBusinesses.some(type => businessType.includes(type));
  const isInternationalLocation = !location.includes('united states');
  
  return {
    useCultural: true, // Cultural context is almost always relevant
    relevanceReason: isLocalBusiness ? 
      `Local ${businessType} must connect with community culture` :
      'Cultural awareness builds authentic connections',
    priority: isLocalBusiness || isInternationalLocation ? 'high' : 'medium',
    culturalElements
  };
}

/**
 * Filters and prioritizes available context data based on relevance analysis
 */
export function filterContextData(
  relevance: ContextRelevance,
  availableData: {
    weather?: any;
    events?: any[];
    trends?: any[];
    cultural?: any;
  }
): {
  selectedWeather?: any;
  selectedEvents?: any[];
  selectedTrends?: any[];
  selectedCultural?: any;
  contextInstructions: string;
} {
  
  const result: any = {
    contextInstructions: generateContextInstructions(relevance)
  };
  
  // Filter weather data
  if (relevance.weather.useWeather && availableData.weather) {
    result.selectedWeather = availableData.weather;
  }
  
  // Filter events data
  if (relevance.events.useEvents && availableData.events) {
    result.selectedEvents = availableData.events
      .filter(event => 
        relevance.events.eventTypes.some(type => 
          event.category?.toLowerCase().includes(type) ||
          event.name?.toLowerCase().includes(type)
        )
      )
      .slice(0, relevance.events.priority === 'high' ? 3 : 1);
  }
  
  // Filter trends data
  if (relevance.trends.useTrends && availableData.trends) {
    result.selectedTrends = availableData.trends
      .filter(trend => 
        relevance.trends.trendTypes.some(type => 
          trend.category?.toLowerCase().includes(type) ||
          trend.topic?.toLowerCase().includes(type)
        )
      )
      .slice(0, relevance.trends.priority === 'high' ? 5 : 3);
  }
  
  // Filter cultural data
  if (relevance.cultural.useCultural && availableData.cultural) {
    result.selectedCultural = {
      ...availableData.cultural,
      cultural_nuances: availableData.cultural.cultural_nuances?.filter(nuance =>
        relevance.cultural.culturalElements.some(element =>
          nuance.toLowerCase().includes(element.toLowerCase())
        )
      ).slice(0, 3)
    };
  }
  
  return result;
}

/**
 * Generates context-specific instructions for the AI
 */
function generateContextInstructions(relevance: ContextRelevance): string {
  const instructions: string[] = [];
  
  if (relevance.weather.useWeather) {
    if (relevance.weather.priority === 'high') {
      instructions.push('WEATHER: Integrate weather naturally as it significantly impacts customer behavior');
    } else if (relevance.weather.priority === 'medium') {
      instructions.push('WEATHER: Mention weather subtly if it adds value to the message');
    }
  } else {
    instructions.push('WEATHER: Ignore weather data - not relevant for this business type');
  }
  
  if (relevance.events.useEvents) {
    if (relevance.events.priority === 'high') {
      instructions.push('EVENTS: Highlight relevant local events as key business opportunities');
    } else {
      instructions.push('EVENTS: Reference events only if they add community connection value');
    }
  } else {
    instructions.push('EVENTS: Skip event references - focus on core business value');
  }
  
  if (relevance.trends.priority === 'high') {
    instructions.push('TRENDS: Lead with trending topics to maximize engagement and relevance');
  } else {
    instructions.push('TRENDS: Use trends subtly to add contemporary relevance');
  }
  
  if (relevance.cultural.priority === 'high') {
    instructions.push('CULTURE: Deeply integrate local cultural elements for authentic connection');
  } else {
    instructions.push('CULTURE: Include respectful cultural awareness without overdoing it');
  }
  
  return instructions.join('\n');
}
