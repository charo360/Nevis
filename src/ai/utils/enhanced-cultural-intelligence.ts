/**
 * Enhanced Cultural Intelligence for Revo 1.0 AI Content Generation
 * Provides comprehensive cultural context for Kenya, South Africa, and Nigeria
 */

export interface CulturalContext {
  primaryLanguage: string;
  commonPhrases: string[];
  businessTerms: string[];
  culturalValues: string[];
  businessEtiquette: string[];
  communicationStyle: string;
  marketingPreferences: string[];
  localExpressions: string[];
  culturalNuances: string;
  marketingStyle: string;
  socialMediaBehavior: string[];
  businessHours: string;
  currencySymbol: string;
  timeZone: string;
}

/**
 * Comprehensive cultural database
 */
const CULTURAL_DATABASE: Record<string, CulturalContext> = {
  'Kenya': {
    primaryLanguage: 'English and Swahili',
    commonPhrases: [
      'Karibu', // Welcome
      'Asante sana', // Thank you very much
      'Pole sana', // Very sorry
      'Hakuna matata', // No problem
      'Mambo vipi' // How are things
    ],
    businessTerms: [
      'Biashara', // Business
      'Kazi', // Work
      'Mafanikio', // Success
      'Ukuaji', // Growth
      'Huduma' // Service
    ],
    culturalValues: [
      'Ubuntu - interconnectedness and community',
      'Respect for elders and authority',
      'Family-centered decision making',
      'Hospitality and warmth',
      'Hard work and perseverance'
    ],
    businessEtiquette: [
      'Greetings are important - take time for proper introductions',
      'Respect hierarchy and seniority',
      'Build personal relationships before business',
      'Be patient with decision-making processes',
      'Dress professionally and conservatively'
    ],
    communicationStyle: 'Indirect, relationship-focused, respectful',
    marketingPreferences: [
      'Community-focused messaging',
      'Family values emphasis',
      'Local language integration',
      'Success stories and testimonials',
      'Mobile-first approach'
    ],
    localExpressions: [
      'Harambee', // Pulling together
      'Pamoja', // Together
      'Maendeleo', // Development/Progress
      'Uongozi', // Leadership
      'Mafanikio' // Success
    ],
    culturalNuances: 'Kenyans value community, respect, and collective success. Business is relationship-driven.',
    marketingStyle: 'Community-focused, respectful, emphasizing collective benefits and family values',
    socialMediaBehavior: [
      'High mobile usage',
      'WhatsApp business communication',
      'Facebook for community engagement',
      'Instagram for visual storytelling'
    ],
    businessHours: '8:00 AM - 5:00 PM EAT',
    currencySymbol: 'KSh',
    timeZone: 'EAT (UTC+3)'
  },

  'South Africa': {
    primaryLanguage: 'English, Afrikaans, Zulu, Xhosa',
    commonPhrases: [
      'Howzit', // How are you
      'Sharp sharp', // Alright/OK
      'Eish', // Expression of frustration/sympathy
      'Lekker', // Nice/good
      'Sawubona' // Hello (Zulu)
    ],
    businessTerms: [
      'Besigheid', // Business (Afrikaans)
      'Werk', // Work (Afrikaans)
      'Sukses', // Success (Afrikaans)
      'Groei', // Growth (Afrikaans)
      'Diens' // Service (Afrikaans)
    ],
    culturalValues: [
      'Rainbow Nation diversity and inclusion',
      'Ubuntu philosophy - humanity through others',
      'Resilience and adaptability',
      'Community solidarity',
      'Entrepreneurial spirit'
    ],
    businessEtiquette: [
      'Punctuality is important',
      'Firm handshakes and eye contact',
      'Address people by titles initially',
      'Be aware of cultural diversity',
      'Business cards exchanged formally'
    ],
    communicationStyle: 'Direct but diplomatic, multicultural awareness',
    marketingPreferences: [
      'Inclusive and diverse representation',
      'Local language options',
      'Economic value emphasis',
      'Quality and reliability focus',
      'Social responsibility messaging'
    ],
    localExpressions: [
      'Ubuntu', // Humanity/interconnectedness
      'Braai', // Barbecue/social gathering
      'Boet', // Brother/friend
      'Sho\'t left', // Goodbye/see you later
      'Aweh' // Hello/acknowledgment
    ],
    culturalNuances: 'South Africans appreciate diversity, directness balanced with respect, and economic value.',
    marketingStyle: 'Inclusive, value-focused, emphasizing quality and social responsibility',
    socialMediaBehavior: [
      'High smartphone penetration',
      'Facebook and WhatsApp dominant',
      'Twitter for news and discussions',
      'Instagram growing rapidly'
    ],
    businessHours: '8:00 AM - 5:00 PM SAST',
    currencySymbol: 'R',
    timeZone: 'SAST (UTC+2)'
  },

  'Nigeria': {
    primaryLanguage: 'English, Hausa, Yoruba, Igbo',
    commonPhrases: [
      'How far?', // How are you?
      'No wahala', // No problem
      'I dey kampe', // I am fine
      'Oya', // Come on/let\'s go
      'Wetin dey happen?' // What\'s happening?
    ],
    businessTerms: [
      'Biznes', // Business (Pidgin)
      'Work', // Work
      'Success', // Success
      'Progress', // Progress
      'Service' // Service
    ],
    culturalValues: [
      'Respect for age and wisdom',
      'Extended family importance',
      'Religious faith integration',
      'Entrepreneurial drive',
      'Community support systems'
    ],
    businessEtiquette: [
      'Greetings are elaborate and important',
      'Show respect to senior members',
      'Business cards received with both hands',
      'Patience with lengthy discussions',
      'Dress formally and conservatively'
    ],
    communicationStyle: 'Expressive, relationship-based, storytelling approach',
    marketingPreferences: [
      'Success and aspiration messaging',
      'Community and family focus',
      'Religious sensitivity',
      'Local language integration',
      'Celebrity endorsements effective'
    ],
    localExpressions: [
      'Naija', // Nigeria
      'Oga', // Boss/sir
      'Wahala', // Problem/trouble
      'Chop', // Eat/consume
      'Sabi' // Know/understand
    ],
    culturalNuances: 'Nigerians are expressive, relationship-focused, and value success stories and community achievement.',
    marketingStyle: 'Aspirational, community-focused, expressive, emphasizing success and family benefits',
    socialMediaBehavior: [
      'Very active on social media',
      'WhatsApp for business communication',
      'Instagram for lifestyle content',
      'Twitter for discussions and news'
    ],
    businessHours: '8:00 AM - 5:00 PM WAT',
    currencySymbol: '₦',
    timeZone: 'WAT (UTC+1)'
  }
};

/**
 * Get cultural context for a location
 */
export function getCulturalContext(location: string): CulturalContext | null {
  // Extract country from location string
  const country = extractCountryFromLocation(location);
  
  if (CULTURAL_DATABASE[country]) {
    console.log(`🌍 [Cultural Intelligence] Found context for ${country}`);
    return CULTURAL_DATABASE[country];
  }
  
  // Fallback for other locations
  console.log(`🌍 [Cultural Intelligence] No specific context for ${location}, using general approach`);
  return null;
}

/**
 * Extract country from location string
 */
function extractCountryFromLocation(location: string): string {
  const locationLower = location.toLowerCase();
  
  // Direct country matches
  if (locationLower.includes('kenya') || locationLower.includes('nairobi') || locationLower.includes('mombasa')) {
    return 'Kenya';
  }
  if (locationLower.includes('south africa') || locationLower.includes('johannesburg') || locationLower.includes('cape town') || locationLower.includes('durban')) {
    return 'South Africa';
  }
  if (locationLower.includes('nigeria') || locationLower.includes('lagos') || locationLower.includes('abuja') || locationLower.includes('kano')) {
    return 'Nigeria';
  }
  
  return location; // Return original if no match
}

/**
 * Generate culturally appropriate content suggestions
 */
export function generateCulturalContentSuggestions(
  businessType: string,
  location: string,
  contentType: 'caption' | 'hashtags' | 'headline' = 'caption'
): string[] {
  const context = getCulturalContext(location);
  if (!context) return [];
  
  const suggestions: string[] = [];
  
  switch (contentType) {
    case 'caption':
      suggestions.push(
        `Incorporate ${context.primaryLanguage} phrases naturally`,
        `Emphasize ${context.culturalValues[0]}`,
        `Use ${context.communicationStyle} tone`,
        `Reference local community benefits`
      );
      break;
      
    case 'hashtags':
      suggestions.push(
        ...context.localExpressions.slice(0, 3),
        `#${extractCountryFromLocation(location)}Business`,
        `#Local${businessType.replace(/\s+/g, '')}`
      );
      break;
      
    case 'headline':
      suggestions.push(
        `Use ${context.marketingPreferences[0]} approach`,
        `Incorporate success-oriented language`,
        `Reference community impact`
      );
      break;
  }
  
  return suggestions;
}

/**
 * Get local language context for content generation
 */
export function getLocalLanguageContext(location: string): {
  primaryLanguage: string;
  commonPhrases: string[];
  businessTerms: string[];
  culturalNuances: string;
  marketingStyle: string;
  localExpressions: string[];
} | null {
  const context = getCulturalContext(location);
  if (!context) return null;
  
  return {
    primaryLanguage: context.primaryLanguage,
    commonPhrases: context.commonPhrases,
    businessTerms: context.businessTerms,
    culturalNuances: context.culturalNuances,
    marketingStyle: context.marketingStyle,
    localExpressions: context.localExpressions
  };
}

/**
 * Validate cultural appropriateness of content
 */
export function validateCulturalAppropriateness(
  content: string,
  location: string
): {
  isAppropriate: boolean;
  suggestions: string[];
  culturalScore: number;
} {
  const context = getCulturalContext(location);
  if (!context) {
    return {
      isAppropriate: true,
      suggestions: [],
      culturalScore: 0.5
    };
  }
  
  let score = 0.5; // Base score
  const suggestions: string[] = [];
  
  // Check for cultural sensitivity
  const contentLower = content.toLowerCase();
  
  // Positive indicators
  const positiveMatches = context.culturalValues.filter(value =>
    contentLower.includes(value.toLowerCase().split(' ')[0])
  ).length;
  score += (positiveMatches / context.culturalValues.length) * 0.3;
  
  // Local language integration
  const languageMatches = context.commonPhrases.filter(phrase =>
    contentLower.includes(phrase.toLowerCase())
  ).length;
  score += (languageMatches / context.commonPhrases.length) * 0.2;
  
  // Generate suggestions
  if (score < 0.7) {
    suggestions.push(`Consider incorporating ${context.culturalValues[0]}`);
    suggestions.push(`Use ${context.communicationStyle} communication style`);
    suggestions.push(`Add local language elements: ${context.commonPhrases[0]}`);
  }
  
  return {
    isAppropriate: score >= 0.4,
    suggestions,
    culturalScore: Math.min(1, score)
  };
}
