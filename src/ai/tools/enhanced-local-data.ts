/**
 * Enhanced Local Data Tools - Events and Weather Integration
 * 
 * This module provides real-time local events and weather data
 * for contextually aware content generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export interface LocalEvent {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  venue?: string;
  category: string;
  url?: string;
  is_free: boolean;
  relevance_score: number; // 1-10 based on business type
}

export interface WeatherContext {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  feels_like: number;
  location: string;
  content_opportunities: string[];
  business_impact: string;
}

/**
 * Enhanced Eventbrite Events Tool
 */
export const getEnhancedEventsTool = ai.defineTool({
  name: 'getEnhancedEvents',
  description: 'Fetch local events from Eventbrite API that are relevant to the business type and location',
  input: z.object({
    location: z.string().describe('Location for events (city, country or coordinates)'),
    businessType: z.string().describe('Business type to filter relevant events'),
    radius: z.string().optional().default('25km').describe('Search radius for events'),
    timeframe: z.string().optional().default('this_week').describe('Time period: today, this_week, this_month')
  }),
  output: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    start_date: z.string(),
    venue: z.string().optional(),
    category: z.string(),
    url: z.string().optional(),
    is_free: z.boolean(),
    relevance_score: z.number()
  })),
}, async (input) => {
  try {
    if (!process.env.EVENTBRITE_API_KEY) {
      console.log('Eventbrite API key not configured, using fallback events');
      return getEventsFallback(input.location, input.businessType);
    }

    console.log(`🎪 Fetching events from Eventbrite for ${input.location}...`);

    // Convert location to coordinates if needed
    const locationQuery = await geocodeLocation(input.location);
    
    // Build Eventbrite API request
    const params = new URLSearchParams({
      'location.address': input.location,
      'location.within': input.radius,
      'start_date.range_start': getDateRange(input.timeframe).start,
      'start_date.range_end': getDateRange(input.timeframe).end,
      'sort_by': 'relevance',
      'page_size': '20',
      'expand': 'venue,category'
    });

    const response = await fetch(
      `https://www.eventbriteapi.com/v3/events/search/?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.log(`Eventbrite API error: ${response.status} ${response.statusText}`);
      throw new Error(`Eventbrite API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Eventbrite returned ${data.events?.length || 0} events`);

    // Process and filter events by business relevance
    const relevantEvents = processEventbriteEvents(data.events || [], input.businessType);
    
    return relevantEvents.slice(0, 10);

  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    return getEventsFallback(input.location, input.businessType);
  }
});

/**
 * Enhanced OpenWeather Tool
 */
export const getEnhancedWeatherTool = ai.defineTool({
  name: 'getEnhancedWeather',
  description: 'Fetch current weather and forecast with business context and content opportunities',
  input: z.object({
    location: z.string().describe('Location for weather (city, country)'),
    businessType: z.string().describe('Business type to provide relevant weather context'),
    includeForecast: z.boolean().optional().default(false).describe('Include 5-day forecast')
  }),
  output: z.object({
    temperature: z.number(),
    condition: z.string(),
    description: z.string(),
    humidity: z.number(),
    feels_like: z.number(),
    location: z.string(),
    content_opportunities: z.array(z.string()),
    business_impact: z.string(),
    forecast: z.array(z.object({
      date: z.string(),
      temperature: z.number(),
      condition: z.string(),
      business_opportunity: z.string()
    })).optional()
  }),
}, async (input) => {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      console.log('OpenWeather API key not configured, using fallback weather');
      return getWeatherFallback(input.location, input.businessType);
    }

    console.log(`🌤️ Fetching weather from OpenWeather for ${input.location}...`);

    // Current weather
    const currentParams = new URLSearchParams({
      q: input.location,
      appid: process.env.OPENWEATHER_API_KEY!,
      units: 'metric'
    });

    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${currentParams}`
    );

    if (!currentResponse.ok) {
      console.log(`OpenWeather API error: ${currentResponse.status} ${currentResponse.statusText}`);
      throw new Error(`OpenWeather API error: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();
    console.log(`✅ OpenWeather returned current weather for ${currentData.name}`);

    // Process weather data with business context
    const weatherContext = processWeatherData(currentData, input.businessType);

    // Get forecast if requested
    if (input.includeForecast) {
      const forecastParams = new URLSearchParams({
        q: input.location,
        appid: process.env.OPENWEATHER_API_KEY!,
        units: 'metric'
      });

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?${forecastParams}`
      );

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        weatherContext.forecast = processForecastData(forecastData, input.businessType);
      }
    }

    return weatherContext;

  } catch (error) {
    console.error('Error fetching weather:', error);
    return getWeatherFallback(input.location, input.businessType);
  }
});

/**
 * Helper functions
 */
async function geocodeLocation(location: string): Promise<{lat: number, lon: number} | null> {
  try {
    if (!process.env.OPENWEATHER_API_KEY) return null;

    const params = new URLSearchParams({
      q: location,
      limit: '1',
      appid: process.env.OPENWEATHER_API_KEY!
    });

    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?${params}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
    }
  } catch (error) {
    console.error('Error geocoding location:', error);
  }
  return null;
}

function getDateRange(timeframe: string): {start: string, end: string} {
  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  switch (timeframe) {
    case 'today':
      end.setDate(end.getDate() + 1);
      break;
    case 'this_week':
      end.setDate(end.getDate() + 7);
      break;
    case 'this_month':
      end.setMonth(end.getMonth() + 1);
      break;
    default:
      end.setDate(end.getDate() + 7);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function processEventbriteEvents(events: any[], businessType: string): LocalEvent[] {
  return events.map(event => {
    const relevanceScore = calculateEventRelevance(event, businessType);
    
    return {
      name: event.name?.text || 'Unnamed Event',
      description: event.description?.text?.substring(0, 200) || '',
      start_date: event.start?.local || event.start?.utc || '',
      end_date: event.end?.local || event.end?.utc,
      venue: event.venue?.name || 'Online Event',
      category: event.category?.name || 'General',
      url: event.url,
      is_free: event.is_free || false,
      relevance_score: relevanceScore
    };
  }).filter(event => event.relevance_score >= 5)
    .sort((a, b) => b.relevance_score - a.relevance_score);
}

function calculateEventRelevance(event: any, businessType: string): number {
  let score = 5; // Base score

  const eventName = (event.name?.text || '').toLowerCase();
  const eventDescription = (event.description?.text || '').toLowerCase();
  const eventCategory = (event.category?.name || '').toLowerCase();

  // Business type relevance
  const businessKeywords = getBusinessKeywords(businessType);
  for (const keyword of businessKeywords) {
    if (eventName.includes(keyword) || eventDescription.includes(keyword) || eventCategory.includes(keyword)) {
      score += 2;
    }
  }

  // Event category bonus
  if (eventCategory.includes('business') || eventCategory.includes('networking')) {
    score += 1;
  }

  // Free events get slight bonus for broader appeal
  if (event.is_free) {
    score += 1;
  }

  return Math.min(10, score);
}

function getBusinessKeywords(businessType: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'financial technology software': ['fintech', 'finance', 'banking', 'payment', 'blockchain', 'cryptocurrency', 'startup', 'tech'],
    'restaurant': ['food', 'culinary', 'cooking', 'dining', 'chef', 'restaurant', 'hospitality'],
    'fitness': ['fitness', 'health', 'wellness', 'gym', 'workout', 'nutrition', 'sports'],
    'technology': ['tech', 'software', 'programming', 'ai', 'digital', 'innovation', 'startup'],
    'beauty': ['beauty', 'cosmetics', 'skincare', 'wellness', 'spa', 'fashion'],
    'retail': ['retail', 'shopping', 'ecommerce', 'business', 'sales', 'marketing']
  };

  return keywordMap[businessType.toLowerCase()] || ['business', 'networking', 'professional'];
}

function processWeatherData(weatherData: any, businessType: string): WeatherContext {
  const temperature = Math.round(weatherData.main.temp);
  const condition = weatherData.weather[0].main;
  const description = weatherData.weather[0].description;
  
  return {
    temperature,
    condition,
    description,
    humidity: weatherData.main.humidity,
    feels_like: Math.round(weatherData.main.feels_like),
    location: weatherData.name,
    content_opportunities: generateWeatherContentOpportunities(condition, temperature, businessType),
    business_impact: generateBusinessWeatherImpact(condition, temperature, businessType)
  };
}

function processForecastData(forecastData: any, businessType: string): any[] {
  const dailyForecasts = forecastData.list.filter((_: any, index: number) => index % 8 === 0).slice(0, 5);
  
  return dailyForecasts.map((forecast: any) => ({
    date: new Date(forecast.dt * 1000).toLocaleDateString(),
    temperature: Math.round(forecast.main.temp),
    condition: forecast.weather[0].main,
    business_opportunity: generateBusinessWeatherImpact(forecast.weather[0].main, forecast.main.temp, businessType)
  }));
}

function generateWeatherContentOpportunities(condition: string, temperature: number, businessType: string): string[] {
  const opportunities: string[] = [];

  // Temperature-based opportunities
  if (temperature > 25) {
    opportunities.push('Hot weather content angle', 'Summer promotion opportunity', 'Cooling solutions messaging');
  } else if (temperature < 10) {
    opportunities.push('Cold weather content angle', 'Winter comfort messaging', 'Warm-up solutions');
  }

  // Condition-based opportunities
  switch (condition.toLowerCase()) {
    case 'rain':
      opportunities.push('Rainy day indoor activities', 'Weather protection messaging', 'Cozy atmosphere content');
      break;
    case 'sunny':
    case 'clear':
      opportunities.push('Beautiful weather celebration', 'Outdoor activity promotion', 'Sunshine positivity');
      break;
    case 'clouds':
      opportunities.push('Perfect weather for activities', 'Comfortable conditions messaging');
      break;
  }

  // Business-specific weather opportunities
  const businessOpportunities = getBusinessWeatherOpportunities(businessType, condition, temperature);
  opportunities.push(...businessOpportunities);

  return opportunities;
}

function generateBusinessWeatherImpact(condition: string, temperature: number, businessType: string): string {
  const businessImpacts: Record<string, Record<string, string>> = {
    'restaurant': {
      'sunny': 'Perfect weather for outdoor dining and patio service',
      'rain': 'Great opportunity to promote cozy indoor dining experience',
      'hot': 'Ideal time to highlight refreshing drinks and cool dishes',
      'cold': 'Perfect weather for warm comfort food and hot beverages'
    },
    'fitness': {
      'sunny': 'Excellent conditions for outdoor workouts and activities',
      'rain': 'Great time to promote indoor fitness programs',
      'hot': 'Important to emphasize hydration and cooling strategies',
      'cold': 'Perfect for promoting warm-up routines and indoor training'
    },
    'retail': {
      'sunny': 'Great shopping weather, people are out and about',
      'rain': 'Perfect time for online shopping promotions',
      'hot': 'Opportunity to promote summer collections and cooling products',
      'cold': 'Ideal for promoting warm clothing and comfort items'
    }
  };

  const businessKey = businessType.toLowerCase();
  const impacts = businessImpacts[businessKey] || businessImpacts['retail'];

  if (temperature > 25) return impacts['hot'] || 'Weather creates opportunities for seasonal promotions';
  if (temperature < 10) return impacts['cold'] || 'Weather creates opportunities for comfort-focused messaging';
  
  return impacts[condition.toLowerCase()] || impacts['sunny'] || 'Current weather conditions are favorable for business';
}

function getBusinessWeatherOpportunities(businessType: string, condition: string, temperature: number): string[] {
  // Business-specific weather content opportunities
  const opportunities: string[] = [];

  if (businessType.toLowerCase().includes('restaurant')) {
    if (condition === 'sunny') opportunities.push('Outdoor dining promotion', 'Fresh seasonal menu highlight');
    if (condition === 'rain') opportunities.push('Cozy indoor atmosphere', 'Comfort food specials');
  }

  if (businessType.toLowerCase().includes('fitness')) {
    if (condition === 'sunny') opportunities.push('Outdoor workout motivation', 'Vitamin D benefits');
    if (temperature > 25) opportunities.push('Hydration importance', 'Summer fitness tips');
  }

  return opportunities;
}

// Fallback functions
function getEventsFallback(location: string, businessType: string): LocalEvent[] {
  return [
    {
      name: `${businessType} networking event in ${location}`,
      description: `Local networking opportunity for ${businessType} professionals`,
      start_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      venue: `${location} Business Center`,
      category: 'Business & Professional',
      is_free: true,
      relevance_score: 8
    }
  ];
}

function getWeatherFallback(location: string, businessType: string): WeatherContext {
  return {
    temperature: 22,
    condition: 'Clear',
    description: 'clear sky',
    humidity: 60,
    feels_like: 24,
    location: location,
    content_opportunities: ['Pleasant weather content opportunity', 'Comfortable conditions messaging'],
    business_impact: 'Current weather conditions are favorable for business activities'
  };
}
