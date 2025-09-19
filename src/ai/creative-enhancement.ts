/**
 * Enhanced Business Intelligence & Strategic Content Generation System
 * Replaces generic templates with business-specific insights and strategic planning
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { viralHashtagEngine } from './viral-hashtag-engine';
import { dynamicCTAGenerator } from './dynamic-cta-generator';

// Word Repetition Removal Function - Fixes issues like "buy now now pay later"
function removeWordRepetitions(text: string): string {
  // Simple approach: split by spaces and check for consecutive duplicate words
  const words = text.split(/\s+/);
  const cleanedWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const previousWord = cleanedWords[cleanedWords.length - 1];

    // Skip if current word is the same as previous word (case-insensitive)
    // Only for actual words (not empty strings)
    if (currentWord && previousWord &&
      currentWord.toLowerCase() === previousWord.toLowerCase() &&
      currentWord.trim().length > 0) {
      continue; // Skip this duplicate word
    }

    cleanedWords.push(currentWord);
  }

  return cleanedWords.join(' ');
}

// Helper function to remove business name + colon pattern
function cleanBusinessNamePattern(text: string): string {
  // Remove patterns like "PAYA: FAST, EASY, BETTER" -> "FAST, EASY, BETTER"
  // Remove patterns like "Business Name: Description" -> "Description"
  // Handle various business name patterns
  let cleaned = text
    .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
    .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
    .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
    .trim();

  // If the text is too short after cleaning, return original
  if (cleaned.length < 3) {
    return text;
  }

  return cleaned;
}

// Dynamic Alternatives Generator - Creates 30+ unique variations to prevent repetition
function getDynamicAlternatives(businessType: string): string[] {
  const actionWords = [
    'Revolutionary', 'Transform', 'Discover', 'Achieve', 'Experience', 'Master', 'Elevate',
    'Breakthrough', 'Redefine', 'Optimize', 'Amplify', 'Streamline', 'Enhance', 'Accelerate',
    'Maximize', 'Upgrade', 'Refine', 'Boost', 'Advance', 'Perfect', 'Strengthen', 'Improve',
    'Develop', 'Build', 'Create', 'Establish', 'Generate', 'Produce', 'Deliver', 'Provide',
    'Unlock', 'Reveal', 'Unleash', 'Activate', 'Ignite', 'Catalyze', 'Empower', 'Inspire',
    'Motivate', 'Drive', 'Fuel', 'Spark', 'Trigger', 'Launch', 'Initiate', 'Commence'
  ];

  const outcomeWords = [
    'solution', 'experience', 'future', 'excellence', 'innovation', 'success', 'game',
    'technology', 'standards', 'journey', 'performance', 'operations', 'capabilities',
    'growth', 'potential', 'approach', 'strategies', 'efficiency', 'solutions', 'process',
    'foundations', 'outcomes', 'expertise', 'mastery', 'leadership', 'results', 'value',
    'breakthrough', 'transformation', 'revolution', 'evolution', 'advancement', 'progress',
    'improvement', 'enhancement', 'optimization', 'maximization', 'realization', 'achievement'
  ];

  const alternatives: string[] = [];
  
  // Generate 30+ unique combinations
  for (let i = 0; i < 35; i++) {
    const actionIndex = i % actionWords.length;
    const outcomeIndex = (i + Math.floor(i / actionWords.length)) % outcomeWords.length;
    
    const alternative = `${actionWords[actionIndex]} ${businessType} ${outcomeWords[outcomeIndex]}`;
    
    // Avoid duplicates
    if (!alternatives.includes(alternative)) {
      alternatives.push(alternative);
    }
  }

  return alternatives;
}

// Enhanced subheadline quality improvement function
function enhanceSubheadlineQuality(subheadline: string, businessType: string, location: string): string {
  // Remove extra punctuation and clean up
  let enhanced = subheadline
    .replace(/\s+/g, ' ') // Remove extra spaces
    .replace(/\s*,\s*$/, '') // Remove trailing commas
    .replace(/\s*\.\s*$/, '') // Remove trailing periods
    .replace(/\s*;\s*$/, '') // Remove trailing semicolons
    .trim();

  // Ensure proper word count (8-12 words)
  const words = enhanced.split(' ');
  if (words.length > 12) {
    // Trim to 12 words, keeping the most impactful words
    enhanced = words.slice(0, 12).join(' ');
  }

  // Add local language enhancement for Kenya
  if (location.toLowerCase().includes('kenya')) {
    // Enhance with natural Swahili integration
    enhanced = enhanced
      .replace(/\b(fast|quick|speedy)\b/gi, 'haraka')
      .replace(/\b(easy|simple|simple)\b/gi, 'rahisi')
      .replace(/\b(good|great|excellent)\b/gi, 'bora')
      .replace(/\b(money|cash|payment)\b/gi, 'pesa');
  }

  // Ensure it ends with impact
  if (!enhanced.match(/[!?.]$/)) {
    enhanced += '!';
  }

  return enhanced;
}

// Shared AI initialization to avoid duplicate variable names
function initializeAI() {
  const geminiApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(geminiApiKey!);
  // Use the same model as Revo 1.0 service for consistency
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image-preview',
    generationConfig: {
      temperature: 0.9, // Higher temperature for more creative, varied responses
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    }
  });
}

// Dynamic approach instructions to force variety
function getApproachInstructions(approach: string, businessName: string, location: string, creativityBoost: number): string {
  // Strategic location mention - only 20% of the time for approach instructions
  const shouldMentionLocation = (creativityBoost % 10) < 2; // 20% chance

  switch (approach) {
    case 'DIRECT_BENEFIT':
      return shouldMentionLocation
        ? `HEADLINES: Lead with specific benefit. Example: "8g Protein Per Cookie" SUBHEADLINES: Expand with business details. Example: "Finally snacks that fuel kids properly - made fresh daily in ${location}" CAPTIONS: Full benefit story with RSS/business data.`
        : `HEADLINES: Lead with specific benefit. Example: "8g Protein Per Cookie" SUBHEADLINES: Expand with business details. Example: "Finally snacks that fuel kids properly - made fresh daily" CAPTIONS: Full benefit story with RSS/business data.`;

    case 'SOCIAL_PROOF':
      return shouldMentionLocation
        ? `HEADLINES: Reference community adoption. Example: "200+ ${location} Families Agree" SUBHEADLINES: Add business specifics. Example: "Our protein cookies beat sugar crashes every time" CAPTIONS: Full social proof story with testimonials and business intelligence.`
        : `HEADLINES: Reference community adoption. Example: "200+ Families Agree" SUBHEADLINES: Add business specifics. Example: "Our protein cookies beat sugar crashes every time" CAPTIONS: Full social proof story with testimonials and business intelligence.`;

    case 'PROBLEM_SOLUTION':
      return `HEADLINES: State the problem. Example: "Sugar Crashes Ruining Snacktime" SUBHEADLINES: Present solution. Example: "${businessName}'s protein cookies keep energy steady for hours" CAPTIONS: Full problem-solution narrative with business details.`;

    case 'LOCAL_INSIDER':
      return shouldMentionLocation
        ? `HEADLINES: Use insider knowledge. Example: "${location} Parents Secret Weapon" SUBHEADLINES: Add business insider details. Example: "What 500+ families know about our cookies" CAPTIONS: Full insider story with local references and business intelligence.`
        : `HEADLINES: Use insider knowledge. Example: "Parents Secret Weapon" SUBHEADLINES: Add business insider details. Example: "What 500+ families know about our cookies" CAPTIONS: Full insider story with customer references and business intelligence.`;

    case 'URGENCY_SCARCITY':
      return `HEADLINES: Create real urgency. Example: "Only 50 Packs Left" SUBHEADLINES: Add business context. Example: "This week's batch selling faster than expected" CAPTIONS: Full urgency story with business details and RSS trends.`;

    case 'QUESTION_HOOK':
      return `HEADLINES: Ask specific question. Example: "Tired of Sugar Crashes?" SUBHEADLINES: Hint at solution. Example: "${businessName} has the protein-packed answer parents love" CAPTIONS: Full question-answer story with business intelligence.`;

    case 'STATISTIC_LEAD':
      return `HEADLINES: Lead with business statistic. Example: "95% Same-Day Fix Rate" SUBHEADLINES: Add context. Example: "Our certified technicians solve most issues within hours" CAPTIONS: Full statistic story with business details and proof.`;

    case 'STORY_ANGLE':
      return shouldMentionLocation
        ? `HEADLINES: Start story hook. Example: "Local Baker's Secret Recipe" SUBHEADLINES: Continue story. Example: "Three generations of ${location} families can't be wrong" CAPTIONS: Full story with business history and customer experiences.`
        : `HEADLINES: Start story hook. Example: "Baker's Secret Recipe" SUBHEADLINES: Continue story. Example: "Three generations of families can't be wrong" CAPTIONS: Full story with business history and customer experiences.`;

    case 'COMPARISON':
      return shouldMentionLocation
        ? `HEADLINES: Set up comparison. Example: "Better Than Downtown Options" SUBHEADLINES: Specify difference. Example: "Same quality, half the price, right in ${location}" CAPTIONS: Full comparison with business advantages and local benefits.`
        : `HEADLINES: Set up comparison. Example: "Better Than Downtown Options" SUBHEADLINES: Specify difference. Example: "Same quality, half the price, convenient location" CAPTIONS: Full comparison with business advantages and customer benefits.`;

    case 'NEWS_TREND':
      return `HEADLINES: Connect to current news/trends. Example: "Holiday Rush Solution Found" SUBHEADLINES: Add business connection. Example: "${businessName} handles your busiest season stress-free" CAPTIONS: Full trend connection with RSS data and business solutions.`;

    default:
      return shouldMentionLocation
        ? `Create unique content that could only apply to ${businessName} in ${location}. Be specific and authentic.`
        : `Create unique content that could only apply to ${businessName}. Be specific and authentic about the business value.`;
  }
}

// Dynamic CTA style instructions to force variety
function getCtaStyleInstructions(style: string, businessName: string, location: string): string {
  switch (style) {
    case 'DIRECT_ACTION':
      return `Use action verbs specific to the business. Example: "Grab your protein cookies today" NOT generic "Shop now".`;

    case 'INVITATION':
      return `Sound like a personal invitation from ${businessName}. Example: "Come taste what ${location} is talking about" NOT generic invites.`;

    case 'CHALLENGE':
      return `Challenge the customer to try something. Example: "Find better cookies - we dare you" NOT generic challenges.`;

    case 'BENEFIT_FOCUSED':
      return `Lead with the specific benefit. Example: "Get 8g protein per bite" NOT generic benefits.`;

    case 'COMMUNITY':
      return `Reference the ${location} community. Example: "Join 200+ ${location} families" NOT generic community language.`;

    case 'URGENCY':
      return `Create real urgency with specifics. Example: "Only 50 left this week" NOT generic "limited time".`;

    case 'CURIOSITY':
      return `Make them curious about something specific. Example: "See why kids ask for seconds" NOT generic curiosity.`;

    case 'LOCAL_REFERENCE':
      return `Use actual ${location} references. Example: "Better than Main Street bakery" NOT generic local references.`;

    case 'PERSONAL':
      return `Sound personal and direct. Example: "Your kids will thank you" NOT generic personal language.`;

    case 'EXCLUSIVE':
      return `Make it feel exclusive to ${businessName}. Example: "Only at ${businessName}" NOT generic exclusivity.`;

    default:
      return `Create a unique CTA that could only apply to ${businessName} in ${location}.`;
  }
}

// Business Intelligence System - Deep Market Understanding
export const BUSINESS_INTELLIGENCE_SYSTEM = {
  industryInsights: {
    'restaurant': {
      trends: ['farm-to-table', 'fusion cuisine', 'sustainable dining', 'local ingredients', 'chef-driven menus', 'wine pairing', 'seasonal specialties'],
      challenges: ['food costs', 'staff retention', 'customer loyalty', 'online reviews', 'seasonal fluctuations', 'competition from chains'],
      opportunities: ['private dining', 'catering services', 'cooking classes', 'wine tastings', 'local partnerships'],
      uniqueValue: ['chef expertise', 'local sourcing', 'authentic recipes', 'atmosphere', 'service quality'],
      customerPainPoints: ['long wait times', 'expensive prices', 'limited options', 'poor service', 'generic food'],
      successMetrics: ['repeat customers', 'online reviews', 'word-of-mouth', 'reservations', 'social media engagement'],
      localCompetition: ['chain restaurants', 'fast food', 'other local restaurants', 'food trucks', 'delivery services'],
      seasonalOpportunities: ['summer outdoor dining', 'winter comfort food', 'holiday specials', 'local events', 'weather-based menus']
    },
    'technology': {
      trends: ['AI integration', 'automation', 'cloud solutions', 'cybersecurity', 'digital transformation', 'remote work tools'],
      challenges: ['rapid change', 'skill gaps', 'security', 'scalability', 'competition', 'client retention'],
      opportunities: ['consulting services', 'custom development', 'training programs', 'maintenance contracts', 'upgrades'],
      uniqueValue: ['technical expertise', 'local support', 'custom solutions', 'ongoing partnership', 'industry knowledge'],
      customerPainPoints: ['complex technology', 'high costs', 'poor support', 'outdated systems', 'security concerns'],
      successMetrics: ['client satisfaction', 'project completion', 'referrals', 'long-term contracts', 'technical outcomes'],
      localCompetition: ['large tech companies', 'freelancers', 'other local tech firms', 'national chains', 'online services'],
      seasonalOpportunities: ['year-end planning', 'tax season', 'new fiscal year', 'back-to-school', 'holiday e-commerce']
    },
    'healthcare': {
      trends: ['telemedicine', 'preventive care', 'patient experience', 'digital health', 'personalized medicine', 'wellness focus'],
      challenges: ['regulations', 'patient trust', 'technology adoption', 'insurance complexity', 'staff shortages'],
      opportunities: ['preventive programs', 'specialized services', 'wellness coaching', 'community outreach', 'partnerships'],
      uniqueValue: ['medical expertise', 'personalized care', 'local accessibility', 'trusted relationships', 'comprehensive services'],
      customerPainPoints: ['long wait times', 'high costs', 'complex insurance', 'poor communication', 'impersonal care'],
      successMetrics: ['patient outcomes', 'satisfaction scores', 'referrals', 'community trust', 'health improvements'],
      localCompetition: ['hospitals', 'other clinics', 'urgent care centers', 'specialists', 'online health services'],
      seasonalOpportunities: ['flu season', 'summer wellness', 'back-to-school checkups', 'holiday stress', 'new year resolutions']
    },
    'fitness': {
      trends: ['home workouts', 'personal training', 'group classes', 'mind-body connection', 'nutrition integration', 'wearable tech'],
      challenges: ['member retention', 'seasonal fluctuations', 'competition', 'staff turnover', 'facility costs'],
      opportunities: ['online programs', 'corporate wellness', 'specialized training', 'nutrition coaching', 'community events'],
      uniqueValue: ['expert trainers', 'community atmosphere', 'personalized programs', 'convenient location', 'proven results'],
      customerPainPoints: ['lack of motivation', 'time constraints', 'intimidation', 'poor results', 'expensive memberships'],
      successMetrics: ['member retention', 'goal achievement', 'referrals', 'class attendance', 'community engagement'],
      localCompetition: ['other gyms', 'home equipment', 'online programs', 'personal trainers', 'sports clubs'],
      seasonalOpportunities: ['new year resolutions', 'summer body prep', 'holiday fitness', 'back-to-school', 'weather-based activities']
    },
    'retail': {
      trends: ['omnichannel', 'personalization', 'sustainability', 'local sourcing', 'experiential shopping', 'community focus'],
      challenges: ['online competition', 'inventory management', 'customer experience', 'seasonal sales', 'staff training'],
      opportunities: ['online presence', 'local partnerships', 'loyalty programs', 'events', 'personal shopping'],
      uniqueValue: ['curated selection', 'personal service', 'local knowledge', 'quality products', 'community connection'],
      customerPainPoints: ['limited selection', 'high prices', 'poor service', 'inconvenient hours', 'lack of expertise'],
      successMetrics: ['sales growth', 'customer loyalty', 'repeat purchases', 'word-of-mouth', 'community engagement'],
      localCompetition: ['online retailers', 'big box stores', 'other local shops', 'malls', 'direct sales'],
      seasonalOpportunities: ['holiday shopping', 'back-to-school', 'summer sales', 'seasonal products', 'local events']
    },
    'real-estate': {
      trends: ['virtual tours', 'digital marketing', 'local expertise', 'investment focus', 'sustainability', 'smart homes'],
      challenges: ['market fluctuations', 'competition', 'client acquisition', 'market knowledge', 'technology adoption'],
      opportunities: ['investment properties', 'property management', 'consulting services', 'local partnerships', 'specialized markets'],
      uniqueValue: ['local expertise', 'market knowledge', 'personal service', 'proven track record', 'community connections'],
      customerPainPoints: ['high fees', 'poor communication', 'lack of expertise', 'market uncertainty', 'slow process'],
      successMetrics: ['sales volume', 'client satisfaction', 'referrals', 'market share', 'repeat clients'],
      localCompetition: ['other agents', 'online platforms', 'national companies', 'for-sale-by-owner', 'investors'],
      seasonalOpportunities: ['spring market', 'summer families', 'fall investors', 'winter deals', 'holiday moves']
    },
    'automotive': {
      trends: ['electric vehicles', 'digital services', 'sustainability', 'convenience', 'technology integration', 'online sales'],
      challenges: ['parts shortages', 'technician shortage', 'technology changes', 'competition', 'customer expectations'],
      opportunities: ['EV services', 'mobile repair', 'fleet services', 'specialized repairs', 'maintenance programs'],
      uniqueValue: ['expert technicians', 'honest service', 'convenient location', 'quality parts', 'warranty support'],
      customerPainPoints: ['expensive repairs', 'poor service', 'unreliable work', 'long wait times', 'hidden costs'],
      successMetrics: ['customer satisfaction', 'repeat business', 'referrals', 'online reviews', 'service quality'],
      localCompetition: ['dealerships', 'other repair shops', 'chain stores', 'mobile services', 'online parts'],
      seasonalOpportunities: ['winter preparation', 'summer road trips', 'back-to-school', 'holiday travel', 'seasonal maintenance']
    },
    'beauty': {
      trends: ['clean beauty', 'personalization', 'sustainability', 'wellness integration', 'technology', 'inclusivity'],
      challenges: ['product costs', 'staff retention', 'trend changes', 'competition', 'client retention'],
      opportunities: ['online services', 'product sales', 'membership programs', 'events', 'corporate services'],
      uniqueValue: ['expert stylists', 'quality products', 'personalized service', 'convenient location', 'trend knowledge'],
      customerPainPoints: ['high costs', 'poor results', 'long appointments', 'limited availability', 'product damage'],
      successMetrics: ['client retention', 'referrals', 'online reviews', 'service quality', 'product sales'],
      localCompetition: ['salons', 'chain stores', 'mobile services', 'online products', 'other beauty professionals'],
      seasonalOpportunities: ['wedding season', 'holiday parties', 'summer styles', 'back-to-school', 'special events']
    }
  },

  audiencePsychology: {
    motivations: ['success', 'security', 'convenience', 'status', 'belonging', 'growth', 'health', 'savings', 'recognition'],
    painPoints: ['time constraints', 'budget concerns', 'trust issues', 'complexity', 'uncertainty', 'frustration', 'stress'],
    aspirations: ['better life', 'success', 'recognition', 'peace of mind', 'efficiency', 'independence', 'security'],
    communication: ['clear benefits', 'social proof', 'emotional connection', 'practical value', 'expertise', 'trust']
  },

  // New: Strategic Content Planning
  contentStrategy: {
    'awareness': {
      goal: 'Introduce business and build recognition',
      approach: 'Educational, informative, community-focused',
      contentTypes: ['industry insights', 'local news', 'educational tips', 'community stories'],
      emotionalTone: 'helpful, informative, community-minded'
    },
    'consideration': {
      goal: 'Build trust and demonstrate expertise',
      approach: 'Problem-solving, expertise demonstration, social proof',
      contentTypes: ['case studies', 'expert tips', 'customer stories', 'industry knowledge'],
      emotionalTone: 'expert, trustworthy, helpful'
    },
    'conversion': {
      goal: 'Drive action and sales',
      approach: 'Urgency, offers, clear benefits, strong CTAs',
      contentTypes: ['special offers', 'limited time deals', 'clear benefits', 'action-oriented content'],
      emotionalTone: 'urgent, compelling, confident'
    },
    'retention': {
      goal: 'Keep existing customers engaged',
      approach: 'Value-added content, community building, ongoing support',
      contentTypes: ['loyalty programs', 'exclusive content', 'community events', 'ongoing value'],
      emotionalTone: 'appreciative, supportive, community-focused'
    }
  }
};

// Strategic Content Planning System
export class StrategicContentPlanner {
  static generateBusinessSpecificContent(
    businessType: string,
    businessName: string,
    location: string,
    businessDetails: any,
    platform: string,
    contentGoal: 'awareness' | 'consideration' | 'conversion' | 'retention' = 'awareness'
  ) {
    const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
      BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

    const strategy = BUSINESS_INTELLIGENCE_SYSTEM.contentStrategy[contentGoal];

    // Analyze business strengths and opportunities
    const businessStrengths = this.analyzeBusinessStrengths(businessDetails, industry);
    const marketOpportunities = this.identifyMarketOpportunities(industry, location);
    const customerPainPoints = this.mapCustomerPainPoints(industry, businessStrengths);

    return {
      strategy: strategy,
      businessType: businessType,
      businessStrengths,
      marketOpportunities,
      customerPainPoints,
      contentAngle: this.determineContentAngle(contentGoal, businessStrengths, marketOpportunities),
      emotionalHook: this.selectEmotionalHook(contentGoal, customerPainPoints),
      valueProposition: this.craftValueProposition(businessStrengths, customerPainPoints),
      localRelevance: this.createLocalRelevance(location, industry, businessDetails)
    };
  }

  private static analyzeBusinessStrengths(businessDetails: any, industry: any) {
    const strengths = [];

    if (businessDetails.experience) strengths.push(`${businessDetails.experience} years of experience`);
    if (businessDetails.expertise) strengths.push(`specialized in ${businessDetails.expertise}`);
    if (businessDetails.awards) strengths.push(`award-winning ${businessDetails.awards}`);
    if (businessDetails.certifications) strengths.push(`certified in ${businessDetails.certifications}`);
    if (businessDetails.uniqueServices) strengths.push(`unique ${businessDetails.uniqueServices} services`);

    // Add industry-specific strengths
    strengths.push(...industry.uniqueValue.slice(0, 3));

    return strengths;
  }

  private static identifyMarketOpportunities(industry: any, location: string) {
    return industry.seasonalOpportunities.map(opportunity =>
      `${opportunity} in ${location}`
    ).slice(0, 3);
  }

  private static mapCustomerPainPoints(industry: any, businessStrengths: string[]) {
    return industry.customerPainPoints.filter(painPoint =>
      businessStrengths.some(strength =>
        strength.toLowerCase().includes(painPoint.toLowerCase().replace(/\s+/g, ''))
      )
    ).slice(0, 3);
  }

  private static determineContentAngle(
    contentGoal: string,
    businessStrengths: string[],
    marketOpportunities: string[]
  ) {
    const angles = {
      'awareness': ['educational', 'community', 'industry insights'],
      'consideration': ['problem-solving', 'expertise', 'social proof'],
      'conversion': ['benefits', 'offers', 'urgency'],
      'retention': ['value-added', 'community', 'exclusive']
    };

    return angles[contentGoal] || angles['awareness'];
  }

  private static selectEmotionalHook(
    contentGoal: string,
    customerPainPoints: string[]
  ) {
    const hooks = {
      'awareness': ['curiosity', 'community pride', 'local knowledge'],
      'consideration': ['frustration relief', 'trust building', 'expertise recognition'],
      'conversion': ['urgency', 'excitement', 'confidence'],
      'retention': ['appreciation', 'belonging', 'exclusive access']
    };

    return hooks[contentGoal] || hooks['awareness'];
  }

  private static craftValueProposition(businessStrengths: string[], customerPainPoints: string[]) {
    if (businessStrengths.length === 0 || customerPainPoints.length === 0) {
      return 'Quality service and expertise';
    }

    const strength = businessStrengths[0];
    const painPoint = customerPainPoints[0];

    return `We solve ${painPoint} with ${strength}`;
  }

  private static createLocalRelevance(location: string, industry: any, businessDetails: any) {
    return {
      localMarket: `${location} market insights`,
      communityConnection: `${location} community focus`,
      localCompetition: `Understanding ${location} competition`,
      localOpportunities: industry.seasonalOpportunities.map(opp => `${opp} in ${location}`)
    };
  }
}

// Business-Specific Headline Generator - AI-Powered Dynamic Generation
export async function generateBusinessSpecificHeadline(
  businessType: string,
  businessName: string,
  location: string,
  businessDetails: any,
  platform: string,
  contentGoal: 'awareness' | 'consideration' | 'conversion' | 'retention' = 'awareness',
  trendingData?: any,
  businessIntelligence?: any,
  useLocalLanguage: boolean = false,
  localLanguageContext?: any
): Promise<{ headline: string; approach: string; emotionalImpact: string }> {

  const contentPlan = StrategicContentPlanner.generateBusinessSpecificContent(
    businessType, businessName, location, businessDetails, platform, contentGoal
  );

  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  // Initialize AI generation capability
  const model = initializeAI();

  // Create dynamic AI prompt for headline generation with RSS trends and regional marketing intelligence
  const trendingKeywords = trendingData?.keywords?.slice(0, 5) || [];
  const trendingHashtags = trendingData?.hashtags?.slice(0, 3) || [];
  const regionalLanguage = getRegionalLanguageStyle(location);
  const marketingStyle = getRegionalMarketingStyle(location);

  // Get real-time contextual data for intelligent content generation
  const getContextualData = async () => {
    try {
      return {
        news: trendingData?.news?.slice(0, 3).map(n => n.title).join(', ') || 'No current news data',
        socialTrends: trendingData?.socialTrends?.slice(0, 3).join(', ') || 'No social trends data',
        events: trendingData?.events?.slice(0, 2).map(e => e.name).join(', ') || 'No local events data',
        insights: trendingData?.insights?.slice(0, 2).join(', ') || 'No market insights',
        weather: trendingData?.weather || 'No weather data',
        culturalMoments: trendingData?.culturalMoments || 'No cultural data'
      };
    } catch (error) {
      return {
        news: 'No current news data',
        socialTrends: 'No social trends data',
        events: 'No local events data',
        insights: 'No market insights',
        weather: 'No weather data',
        culturalMoments: 'No cultural data'
      };
    }
  };

  const contextualData = await getContextualData();

  // Strategic location mention - only 25% of the time for headlines
  const shouldMentionLocation = Math.random() < 0.25; // 25% chance for headlines

  const locationContext = shouldMentionLocation
    ? `You understand ${location} culture, language, and market dynamics. You know how businesses in ${location} market themselves successfully.`
    : `You are a brilliant marketing expert who understands diverse markets and customer psychology. You create compelling headlines that focus on business value.`;

  const businessLocationInfo = shouldMentionLocation
    ? `- Location: ${location}
- Regional Marketing Style: ${marketingStyle}
- Local Language Tone: ${regionalLanguage}
- How locals talk about ${businessType}: ${getLocalBusinessLanguage(location, businessType)}`
    : `- Focus: Business value and customer benefits
- Marketing Style: Professional and engaging
- Tone: Clear and compelling`;

  const prompt = `${locationContext}

REAL-TIME CONTEXTUAL DATA (Analyze and use what's relevant):
- Current News: ${contextualData.news}
- Social Media Trends: ${contextualData.socialTrends}
- Local Events: ${contextualData.events}
- Market Insights: ${contextualData.insights}
- Weather: ${contextualData.weather}
- Cultural Moments: ${contextualData.culturalMoments}

BUSINESS INTELLIGENCE:
- Business: ${businessName} (${businessType})
- Experience: ${businessDetails.experience || 'established business'}
- Specialties: ${businessDetails.expertise || businessDetails.services || 'professional services'}
- Target Market: ${businessDetails.targetAudience || 'customers seeking quality services'}
- Marketing Goal: ${contentGoal}

CURRENT TRENDING CONTEXT (Use these insights to make content relevant):
- Trending Keywords: ${trendingKeywords.join(', ') || 'quality, authentic, professional, reliable, trusted'}
- Popular Hashtags: ${trendingHashtags.join(', ') || '#quality #professional #trusted'}
${businessLocationInfo}

MARKET INTELLIGENCE:
- Industry Trends: ${industry.trends.slice(0, 3).join(', ')}
- Competitive Advantages: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market Opportunities: ${industry.opportunities.slice(0, 2).join(', ')}

INTELLIGENT RELEVANCE FILTERING:
- ANALYZE the real-time data above and ONLY use information that's directly relevant to ${businessType} customers
- IGNORE irrelevant data - don't force connections that don't make sense
- CONNECT your business ONLY to trending conversations, events, or cultural moments that actually relate to ${businessType}
- CONSIDER what ${businessType} customers are actually talking about and caring about
- USE psychological triggers that resonate with current sentiment and needs SPECIFIC TO ${businessType}
- CREATE headlines that feel like they were written by someone who truly understands this moment AND this business
- ENSURE content reflects what's actually happening in the world that's RELEVANT to your business
- FOCUS on timely relevance and authentic connection SPECIFIC TO ${businessType}
- MAKE people think "This business really gets what's happening right now AND understands my needs"

RELEVANCE CRITERIA:
- News must relate to ${businessType}, economy, or customer needs
- Social trends must be relevant to ${businessType} customers or community
- Events must be related to ${businessType}, business sector, or customer interests
- Weather must impact ${businessType} services or customer behavior
- Cultural moments must be relevant to ${businessType} customers or traditions
- Market insights must be specific to ${businessType} industry or market

MARKETING STRATEGY:
${shouldMentionLocation
      ? `You understand that in ${location}, people respond to ${marketingStyle} marketing. Use the trending keywords naturally and speak like locals do. Create content that feels authentic to ${location} culture and current market trends.`
      : `Focus on universal business value and customer benefits. Use trending keywords naturally and create content that resonates with ${businessType} customers. Emphasize quality, reliability, and customer satisfaction.`}

${useLocalLanguage ? `
LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${location}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing

${localLanguageContext ? `
SPECIFIC LOCAL LANGUAGE CONTEXT FOR ${location.toUpperCase()}:
- Primary Language: ${localLanguageContext.primaryLanguage || 'English'}
- Common Phrases: ${localLanguageContext.commonPhrases?.join(', ') || 'N/A'}
- Business Terms: ${localLanguageContext.businessTerms?.join(', ') || 'N/A'}
- Cultural Nuances: ${localLanguageContext.culturalNuances || 'N/A'}
- Marketing Style: ${localLanguageContext.marketingStyle || 'N/A'}
- Local Expressions: ${localLanguageContext.localExpressions?.join(', ') || 'N/A'}

USE THESE SPECIFIC TERMS:
- Incorporate the common phrases naturally: ${localLanguageContext.commonPhrases?.slice(0, 3).join(', ') || 'N/A'}
- Use business terms when relevant: ${localLanguageContext.businessTerms?.slice(0, 2).join(', ') || 'N/A'}
- Apply the cultural nuances: ${localLanguageContext.culturalNuances || 'N/A'}
- Follow the marketing style: ${localLanguageContext.marketingStyle || 'N/A'}
- Include local expressions: ${localLanguageContext.localExpressions?.slice(0, 2).join(', ') || 'N/A'}` : ''}

HEADLINE LOCAL LANGUAGE GUIDANCE:
- Add contextually appropriate local greetings to headlines based on business type
- Use local expressions in headlines that relate to the specific business industry
- Include relevant local terms that match the business offerings and target audience
- Mix naturally: Don't force local language - only add when it makes sense and flows well
- Keep it relevant: Use local language that relates to the specific business context and audience
- Maintain engagement: Ensure the local language enhances rather than distracts from the message
- Be dynamic: Generate unique local language for each business, avoid repetitive patterns
- Think creatively: Use different local greetings, expressions, and terms for each business type

DYNAMIC LOCAL LANGUAGE GENERATION:
- For RESTAURANTS: Use food-related local terms, hospitality greetings, taste expressions
- For FITNESS: Use energy/motivation local terms, health expressions, action words
- For TECH: Use innovation local terms, future expressions, digital concepts
- For BEAUTY: Use beauty-related local terms, confidence expressions, aesthetic words
- For FINANCE: Use money/security local terms, trust expressions, financial concepts
- For HEALTHCARE: Use health/wellness local terms, care expressions, medical concepts
- For EDUCATION: Use learning local terms, growth expressions, knowledge concepts
- For REAL ESTATE: Use home/property local terms, dream expressions, space concepts
- VARY the local language: Don't use the same phrases for every business
- BE CONTEXTUAL: Match local language to the specific business industry and services` : `
LANGUAGE REQUIREMENTS:
- Use English only, do not use local language
- Keep content in English for universal accessibility
- Focus on local cultural understanding in English rather than local language mixing`}

CONVERSION PSYCHOLOGY REQUIREMENTS:
- Maximum 5 words that trigger immediate desire to try/buy
- Use psychological triggers: scarcity, exclusivity, curiosity, FOMO
- Create urgency and desire - make people think "I NEED this NOW"
- Sound like a successful marketer who knows conversion psychology
- Incorporate trending elements naturally (don't force them)
- Use language patterns that drive action and engagement
- Focus on what makes people instantly want to experience the service/product
- Create curiosity gaps that make people want to know more
- CRITICAL: NEVER start with business name + colon pattern (e.g., "${businessName}: DESCRIPTION")
- Create headlines that stand alone without business name prefix

CONVERSION-FOCUSED EXAMPLES (DO NOT COPY THESE - CREATE SOMETHING COMPLETELY DIFFERENT):
- "Secret Recipe Finally Revealed" (curiosity + exclusivity)
- "Last Batch This Week" (scarcity + urgency)
- "Addictive Flavors Warning Inside" (intrigue + benefit)
- "Hidden Gem Locals Obsess" (social proof + exclusivity)
- "Revolutionary Taste Experience Awaits" (innovation + anticipation)

CRITICAL ANTI-REPETITION INSTRUCTIONS:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ DO NOT use "Tired of..." or similar repetitive opening patterns
❌ DO NOT start headlines with the same words repeatedly across different businesses
❌ DO NOT use static templates that don't adapt to unique business context
❌ DO NOT repeat opening phrases like "Tired of waiting", "Tired of slow", etc.
❌ CREATE something completely original that has never been generated before
❌ AVOID any pattern that sounds like a template or formula

IMPORTANT: Generate ONLY ONE headline, not multiple options or lists.
Do NOT write "Here are headlines" or provide multiple choices.
Generate ONE unique headline that makes people instantly want to try the service/product. Focus on conversion, not just awareness.
CRITICAL: NEVER start with business name + colon pattern (e.g., "${businessName}: DESCRIPTION")
Create headlines that stand alone without business name prefix
Make it so specific to the service/product in ${location} that it could never be used for another business.`;

  try {
    // Add unique generation context to prevent repetitive responses
    const uniqueContext = `\n\nUNIQUE GENERATION CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
    This generation must be completely different from any previous generation.
    Use this unique context to ensure fresh, original content that has never been generated before.
    
    CRITICAL: NEVER use "Tired of..." or any variation. This is FORBIDDEN.
    CRITICAL: NEVER start with repetitive opening words.
    CRITICAL: Each headline must be completely unique and context-specific.
    
    INTELLIGENT CONTEXTUAL ANALYSIS REQUIREMENTS:
    - ANALYZE real-time data: RSS feeds, trending topics, local events, weather, cultural moments
    - EXAMINE business-specific information: services, location, target audience, unique value proposition
    - CONSIDER current market conditions, seasonal factors, and local community needs
    - IDENTIFY what people are actually talking about and caring about RIGHT NOW in this location
    - CONNECT your business to relevant trending conversations, events, or cultural moments
    - USE psychological triggers that resonate with current local sentiment and needs
    - CREATE headlines that feel like they were written by someone who truly understands this moment
    - ENSURE content reflects what's actually happening in the world, not generic templates
    - FOCUS on timely relevance and authentic local connection
    - MAKE people think "This business really gets what's happening right now"

    CRITICAL WORD REPETITION RULES:
    - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
    - Check each sentence for duplicate adjacent words before finalizing
    - If you write "now now" or "the the" or any repeated word, remove the duplicate
    - Read your output carefully to ensure no word appears twice in a row`;

    const result = await model.generateContent(prompt + uniqueContext);
    let headline = result.response.text().trim();

    // Post-process to remove word repetitions
    headline = removeWordRepetitions(headline);

    // Post-processing cleanup to remove business name + colon pattern
    headline = cleanBusinessNamePattern(headline);

    // Check for repetitive patterns and encourage variety
    const checkForRepetitivePatterns = (text: string) => {
      // Check if this looks like a repetitive template
      const repetitivePatterns = [
        /^Tired\s+of\s+waiting/i,
        /^Tired\s+of\s+slow/i,
        /^Tired\s+of\s+delays/i,
        /^Tired\s+of\s+waiting\s+around/i,
        /^Tired\s+of\s+waiting\s+in\s+line/i,
        /^Tired\s+of\s+waiting\s+forever/i
      ];

      // If it matches a repetitive pattern, it's likely a template
      const isRepetitive = repetitivePatterns.some(pattern => pattern.test(text));

      if (isRepetitive) {
        // Generate a more dynamic alternative
        const dynamicAlternatives = getDynamicAlternatives(businessType);

        return dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
      }

      return text; // Keep the original if it's not repetitive
    };

    headline = checkForRepetitivePatterns(headline);

    // Add randomization to approach and emotional impact to ensure variety
    const approaches = ['strategic', 'creative', 'authentic', 'bold', 'community-focused', 'innovative'];
    const emotions = ['engaging', 'inspiring', 'trustworthy', 'exciting', 'confident', 'welcoming'];

    // Dynamic headline enhancement - if headline is too short after cleaning, enhance it
    if (headline.length < 10) {
      const dynamicEnhancements = getDynamicAlternatives(businessType);

      const randomEnhancement = dynamicEnhancements[Math.floor(Math.random() * dynamicEnhancements.length)];
      headline = randomEnhancement;
    }

    // Enhanced dynamic content generation based on business context
    const generateDynamicHeadline = async (businessType: string, location: string, businessName: string) => {
      // Get real-time data for intelligent content generation with relevance filtering
      const getContextualData = async () => {
        try {
          const trendingData = await getTrendingData(location);

          // Filter data for relevance to the specific business type
          const filterRelevantData = (data: any[], businessType: string) => {
            const businessKeywords = businessType.toLowerCase().split(' ');
            return data.filter(item => {
              const itemText = (item.title || item.name || item).toLowerCase();
              return businessKeywords.some(keyword => itemText.includes(keyword)) ||
                itemText.includes('local') || itemText.includes('community') ||
                itemText.includes('business') || itemText.includes('economy');
            });
          };

          const relevantNews = filterRelevantData(trendingData.news || [], businessType);
          const relevantEvents = filterRelevantData(trendingData.events || [], businessType);
          const relevantInsights = filterRelevantData(trendingData.insights || [], businessType);

          return {
            news: relevantNews.slice(0, 3).map(n => n.title).join(', ') || 'No relevant news data',
            socialTrends: trendingData.socialTrends?.slice(0, 3).join(', ') || 'No social trends data',
            events: relevantEvents.slice(0, 2).map(e => e.name).join(', ') || 'No relevant events data',
            insights: relevantInsights.slice(0, 2).join(', ') || 'No relevant market insights',
            weather: trendingData.weather || 'No weather data',
            culturalMoments: trendingData.culturalMoments || 'No cultural data'
          };
        } catch (error) {
          return {
            news: 'No current news data',
            socialTrends: 'No social trends data',
            events: 'No local events data',
            insights: 'No market insights',
            weather: 'No weather data',
            culturalMoments: 'No cultural data'
          };
        }
      };

      const contextualData = await getContextualData();

      // Use AI to generate truly dynamic content based on real-time data
      const dynamicPrompt = `
Generate a compelling, unique headline for a ${businessType} business in ${location} by analyzing current real-time data and trends.

REAL-TIME CONTEXTUAL DATA (FILTERED FOR RELEVANCE):
- Current News: ${contextualData.news}
- Social Media Trends: ${contextualData.socialTrends}
- Local Events: ${contextualData.events}
- Market Insights: ${contextualData.insights}
- Weather: ${contextualData.weather}
- Cultural Moments: ${contextualData.culturalMoments}

BUSINESS CONTEXT:
- Business: ${businessName}
- Type: ${businessType}
- Location: ${location}
- Target: Local customers who would use this service

INTELLIGENT RELEVANCE FILTERING:
- ANALYZE the real-time data above and ONLY use information that's directly relevant to ${businessType} customers in ${location}
- IGNORE irrelevant data - don't force connections that don't make sense
- CONNECT your business ONLY to trending conversations, events, or cultural moments that actually relate to ${businessType}
- CONSIDER what ${businessType} customers are actually talking about and caring about in this location
- USE psychological triggers that resonate with current local sentiment and needs SPECIFIC TO ${businessType}
- CREATE headlines that feel like they were written by someone who truly understands this moment AND this business
- ENSURE content reflects what's actually happening in the world that's RELEVANT to your business
- FOCUS on timely relevance and authentic local connection SPECIFIC TO ${businessType}
- MAKE people think "This business really gets what's happening right now AND understands my needs"

RELEVANCE CRITERIA:
- News must relate to ${businessType}, local economy, or customer needs
- Social trends must be relevant to ${businessType} customers or local community
- Events must be related to ${businessType}, local business, or customer interests
- Weather must impact ${businessType} services or customer behavior
- Cultural moments must be relevant to ${businessType} customers or local traditions
- Market insights must be specific to ${businessType} industry or local market

REQUIREMENTS:
- Must be completely original and context-specific
- Should NOT use "Tired of..." or any repetitive patterns
- Maximum 8 words for maximum impact
- Sound like a successful local marketer who knows conversion psychology
- Connect to real-time trends, events, or cultural moments when relevant
- Feel fresh, relevant, and perfectly timed for this specific moment

Generate ONE unique headline that makes people instantly want to try the service/product by leveraging current trends and local context.
`;

      try {
        const result = await model.generateContent(dynamicPrompt);
        let dynamicHeadline = result.response.text().trim();

        // Clean up the dynamic headline
        dynamicHeadline = cleanBusinessNamePattern(dynamicHeadline);
        dynamicHeadline = removeWordRepetitions(dynamicHeadline);

        // Check for repetitive patterns in dynamic content
        const checkForRepetitivePatterns = (text: string) => {
          const repetitivePatterns = [
            /^Tired\s+of\s+waiting/i,
            /^Tired\s+of\s+slow/i,
            /^Tired\s+of\s+delays/i,
            /^Tired\s+of\s+waiting\s+around/i,
            /^Tired\s+of\s+waiting\s+in\s+line/i,
            /^Tired\s+of\s+waiting\s+forever/i
          ];

          const isRepetitive = repetitivePatterns.some(pattern => pattern.test(text));

          if (isRepetitive) {
            const dynamicAlternatives = getDynamicAlternatives(businessType);
            return dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
          }

          return text;
        };

        dynamicHeadline = checkForRepetitivePatterns(dynamicHeadline);

        return dynamicHeadline;
      } catch (error) {
        // Fallback to a simple dynamic approach if AI fails
        const fallbackApproaches = getDynamicAlternatives(businessType);
        return fallbackApproaches[Math.floor(Math.random() * fallbackApproaches.length)];
      }
    };

    // Apply dynamic headline generation if current headline is generic
    if (headline.length < 15 || headline.includes(businessName) || headline.includes(businessType)) {
      const dynamicHeadline = await generateDynamicHeadline(businessType, location, businessName);
      headline = dynamicHeadline;
    }

    return {
      headline: headline,
      approach: approaches[Math.floor(Math.random() * approaches.length)],
      emotionalImpact: emotions[Math.floor(Math.random() * emotions.length)]
    };
  } catch (error) {

    // RETRY WITH SIMPLIFIED AI PROMPT - No Static Fallback
    try {

      const simplifiedHeadlinePrompt = `Create a unique 5-word headline for ${businessName}, a ${businessType} in ${location}.

Make it:
- Conversion-focused (makes people want to try it NOW)
- Different from typical marketing words
- Uses psychological triggers like scarcity, urgency, or exclusivity
- Locally relevant to ${location}

CRITICAL ANTI-REPETITION RULES:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ CREATE something completely original that has never been generated before

Just return the headline, nothing else.`;

      // Add unique generation context to headline retry as well
      const headlineRetryContext = `\n\nUNIQUE HEADLINE RETRY CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
      This headline retry must be completely different and avoid repetitive patterns.`;

      const retryResult = await model.generateContent(simplifiedHeadlinePrompt + headlineRetryContext);
      const retryHeadline = retryResult.response.text().trim();


      return {
        headline: retryHeadline,
        approach: 'ai-retry-generated',
        emotionalImpact: 'conversion-focused'
      };

    } catch (retryError) {

      // EMERGENCY AI GENERATION - Ultra Simple Prompt
      try {
        const emergencyPrompt = `Write a catchy 5-word headline for ${businessName} in ${location}. Make it unique and compelling.

CRITICAL ANTI-REPETITION RULES:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ CREATE something completely original that has never been generated before`;

        // Add unique generation context to emergency headline generation as well
        const headlineEmergencyContext = `\n\nUNIQUE HEADLINE EMERGENCY CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
        This emergency headline must be completely different and avoid repetitive patterns.`;

        const emergencyResult = await model.generateContent(emergencyPrompt + headlineEmergencyContext);
        const emergencyHeadline = emergencyResult.response.text().trim();


        return {
          headline: emergencyHeadline,
          approach: 'emergency-ai-generated',
          emotionalImpact: 'unique-ai-created'
        };

      } catch (emergencyError) {

        // LAST RESORT: Generate with current timestamp for uniqueness
        const timestamp = Date.now();
        const uniqueId = timestamp % 1000;

        const emergencyHeadlines = getDynamicAlternatives(businessType);

        return {
          headline: emergencyHeadlines[uniqueId % emergencyHeadlines.length] + ` #${uniqueId}`,
          approach: 'timestamp-unique',
          emotionalImpact: 'emergency-fallback'
        };
      }
    }
  }
}

// Business-Specific Subheadline Generator - AI-Powered Dynamic Generation
export async function generateBusinessSpecificSubheadline(
  businessType: string,
  businessName: string,
  location: string,
  businessDetails: any,
  headline: string,
  contentGoal: 'awareness' | 'consideration' | 'conversion' | 'retention' = 'awareness',
  trendingData?: any,
  businessIntelligence?: any,
  useLocalLanguage: boolean = false,
  localLanguageContext?: any
): Promise<{ subheadline: string; framework: string; benefit: string }> {

  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  // Initialize AI generation capability
  const model = initializeAI();

  // Create marketing-focused AI prompt for subheadline generation with trending intelligence
  const trendingKeywords = trendingData?.keywords?.slice(0, 5) || [];
  const regionalLanguage = getRegionalLanguageStyle(location);
  const marketingStyle = getRegionalMarketingStyle(location);

  // Strategic location mention - only 30% of the time for subheadlines
  const shouldMentionLocation = Math.random() < 0.30; // 30% chance for subheadlines

  const marketingContext = shouldMentionLocation
    ? `You are a skilled local marketer creating a subheadline for ${businessName} that will make people in ${location} want to visit immediately. You understand current trends and local marketing patterns.`
    : `You are a skilled marketer creating a compelling subheadline for ${businessName} that will make customers want to visit immediately. You understand current trends and customer psychology.`;

  const targetMarketInfo = shouldMentionLocation
    ? `- Target Market: Local ${location} residents and visitors`
    : `- Target Market: Customers seeking quality ${businessType} services`;

  const marketingIntelligence = shouldMentionLocation
    ? `CURRENT TRENDING INTELLIGENCE:
- Trending Keywords: ${trendingKeywords.join(', ') || 'authentic, quality, local, fresh, community'}
- Regional Marketing Style: ${marketingStyle}
- Local Language Patterns: ${regionalLanguage}
- How locals talk about ${businessType}: ${getLocalBusinessLanguage(location, businessType)}`
    : `CURRENT TRENDING INTELLIGENCE:
- Trending Keywords: ${trendingKeywords.join(', ') || 'authentic, quality, professional, reliable, trusted'}
- Marketing Style: Professional and engaging
- Customer Language: Clear, benefit-focused communication`;

  const marketingStrategy = shouldMentionLocation
    ? `Create a subheadline that makes locals think "I need to try this place!" Use trending keywords naturally and speak like successful marketers in ${location} do. Focus on what makes ${businessName} irresistible to people in ${location}.`
    : `Create a subheadline that makes customers think "I need to try this business!" Use trending keywords naturally and focus on clear value propositions. Emphasize what makes ${businessName} the best choice for ${businessType} services.`;

  const prompt = `${marketingContext}

MARKETING CONTEXT:
- Main Headline: "${headline}"
- Business: ${businessName} (${businessType})
${shouldMentionLocation ? `- Location: ${location}` : ''}
- Services/Products: ${businessDetails.services || businessDetails.expertise || 'quality offerings'}
${targetMarketInfo}
- Marketing Goal: ${contentGoal}

${marketingIntelligence}

MARKET INTELLIGENCE:
- What customers value: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market opportunities: ${industry.opportunities.slice(0, 2).join(', ')}
- Industry trends: ${industry.trends.slice(0, 2).join(', ')}

MARKETING STRATEGY:
${marketingStrategy}

${useLocalLanguage ? `
LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${location}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing

${localLanguageContext ? `
SPECIFIC LOCAL LANGUAGE CONTEXT FOR ${location.toUpperCase()}:
- Primary Language: ${localLanguageContext.primaryLanguage || 'English'}
- Common Phrases: ${localLanguageContext.commonPhrases?.join(', ') || 'N/A'}
- Business Terms: ${localLanguageContext.businessTerms?.join(', ') || 'N/A'}
- Cultural Nuances: ${localLanguageContext.culturalNuances || 'N/A'}
- Marketing Style: ${localLanguageContext.marketingStyle || 'N/A'}
- Local Expressions: ${localLanguageContext.localExpressions?.join(', ') || 'N/A'}

USE THESE SPECIFIC TERMS:
- Incorporate the common phrases naturally: ${localLanguageContext.commonPhrases?.slice(0, 3).join(', ') || 'N/A'}
- Use business terms when relevant: ${localLanguageContext.businessTerms?.slice(0, 2).join(', ') || 'N/A'}
- Apply the cultural nuances: ${localLanguageContext.culturalNuances || 'N/A'}
- Follow the marketing style: ${localLanguageContext.marketingStyle || 'N/A'}
- Include local expressions: ${localLanguageContext.localExpressions?.slice(0, 2).join(', ') || 'N/A'}` : ''}

SUBHEADLINE LOCAL LANGUAGE GUIDANCE:
- Add contextually appropriate local greetings to subheadlines based on business type
- Use local expressions in subheadlines that relate to the specific business industry
- Include relevant local terms that match the business offerings and target audience
- Mix naturally: Don't force local language - only add when it makes sense and flows well
- Keep it relevant: Use local language that relates to the specific business context and audience
- Maintain engagement: Ensure the local language enhances rather than distracts from the message
- Be dynamic: Generate unique local language for each business, avoid repetitive patterns
- Think creatively: Use different local greetings, expressions, and terms for each business type

DYNAMIC LOCAL LANGUAGE GENERATION:
- For RESTAURANTS: Use food-related local terms, hospitality greetings, taste expressions
- For FITNESS: Use energy/motivation local terms, health expressions, action words
- For TECH: Use innovation local terms, future expressions, digital concepts
- For BEAUTY: Use beauty-related local terms, confidence expressions, aesthetic words
- For FINANCE: Use money/security local terms, trust expressions, financial concepts
- For HEALTHCARE: Use health/wellness local terms, care expressions, medical concepts
- For EDUCATION: Use learning local terms, growth expressions, knowledge concepts
- For REAL ESTATE: Use home/property local terms, dream expressions, space concepts
- VARY the local language: Don't use the same phrases for every business
- BE CONTEXTUAL: Match local language to the specific business industry and services` : `
LANGUAGE REQUIREMENTS:
- Use English only, do not use local language
- Keep content in English for universal accessibility
- Focus on local cultural understanding in English rather than local language mixing`}

REVO 1.5 PREMIUM SUBHEADLINE REQUIREMENTS:
- Maximum 8-12 words for maximum impact and readability
- Use psychological triggers: social proof, scarcity, exclusivity, urgency
- Create FOMO (Fear of Missing Out) - make people think they'll regret not trying
- Include specific benefits that answer "What's in it for me?"
- Use action-oriented language that drives immediate response
- Build on the headline's promise with compelling reasons to act NOW
- Sound like a successful conversion-focused marketer who understands the target audience
- Should make the offer irresistible and create urgency to visit/buy
- Maintain consistent tone and flow across all subheadlines
- Use local language naturally when appropriate, without forcing it
- Keep it concise but impactful - every word must earn its place
- Ensure smooth readability and natural rhythm
- Focus on business value and benefits rather than location references

Examples of effective subheadlines (DO NOT COPY THESE - CREATE SOMETHING COMPLETELY DIFFERENT):
${getLocalMarketingExamples(location, businessType).split('\n').map(line => line.replace('- "', '- "').replace('"', '" (subheadline style)')).slice(0, 3).join('\n')}

CRITICAL ANTI-REPETITION INSTRUCTIONS FOR SUBHEADLINES:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ DO NOT use "Tired of..." or similar repetitive opening patterns
❌ DO NOT start headlines with the same words repeatedly across different businesses
❌ DO NOT use static templates that don't adapt to unique business context
❌ DO NOT repeat opening phrases like "Tired of waiting", "Tired of slow", etc.
❌ DO NOT use "Experience [Location]'s authentic [BusinessType] revolution" patterns
❌ DO NOT use "Get instant access now!" or similar generic CTAs in subheadlines
❌ DO NOT use "[Location]'s most [adjective] [BusinessType] experience" patterns
❌ DO NOT use "revolution" repeatedly - find other dynamic words
❌ DO NOT use "authentic" in every subheadline - vary your vocabulary
❌ AVOID "where [location] locals [action] [adjective] [businesstype]" patterns
❌ CREATE something completely original that has never been generated before
❌ AVOID any pattern that sounds like a template or formula
❌ Make it specific to ${businessName}'s actual services and features

CREATIVITY REQUIREMENTS:
- Generate a subheadline that sounds like it was written by a human copywriter, not AI
- Use unexpected word combinations and creative phrasing
- Avoid predictable marketing language and clichés
- Make it conversational and engaging, not corporate
- Use specific details about the business, not generic descriptions

LOCATION MENTION STRATEGY:
- Only mention location when it adds genuine value to the message
- Most subheadlines should focus on business benefits, not location
- Avoid forcing location into every subheadline - it makes them repetitive
- Location should feel natural when used, not forced or template-like

Generate ONLY the subheadline text, nothing else.
Make it so specific to ${businessName} and their unique value proposition that it could never be used for another business.
The subheadline should be completely unpredictable and unlike any previous generation.`;

  try {
    // Add unique generation context to prevent repetitive responses
    const uniqueContext = `\n\nUNIQUE GENERATION CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
    This subheadline generation must be completely different from any previous generation.
    Use this unique context to ensure fresh, original subheadlines that have never been generated before.

    FORBIDDEN PATTERNS TO AVOID:
    - "Experience [Location]'s authentic [BusinessType] revolution"
    - "Get instant access now" or similar generic CTAs
    - "[Location]'s most [adjective] [BusinessType] experience"
    - "where [location] locals [action] [adjective] [businesstype]"
    - Any pattern starting with "Experience", "Discover", or "Explore" repeatedly
    - Repetitive use of words like "authentic", "revolution", "solution", "experience"

    DYNAMIC REQUIREMENTS:
    - Create completely unique phrasing that hasn't been used before
    - Use specific business context, not generic templates
    - Vary sentence structure and opening words dramatically
    - Make it impossible to predict the pattern from previous generations

    CRITICAL WORD REPETITION RULES:
    - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
    - Check each sentence for duplicate adjacent words before finalizing
    - If you write "now now" or "the the" or any repeated word, remove the duplicate
    - Read your output carefully to ensure no word appears twice in a row`;

    const result = await model.generateContent(prompt + uniqueContext);
    let subheadline = result.response.text().trim();

    // Post-process to remove word repetitions
    subheadline = removeWordRepetitions(subheadline);

    // Post-processing cleanup to remove business name + colon pattern
    subheadline = cleanBusinessNamePattern(subheadline);

    // Add randomization to framework and benefit
    const frameworks = ['benefit-focused', 'problem-solving', 'community-centered', 'expertise-driven', 'results-oriented'];
    const benefits = industry.uniqueValue.concat(['exceptional service', 'local expertise', 'proven results']);

    return {
      subheadline: subheadline,
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
      benefit: benefits[Math.floor(Math.random() * benefits.length)]
    };
  } catch (error) {

    // DYNAMIC FALLBACK - No templates, pure randomization
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000) + timestamp;

    // Dynamic word pools that change based on business context
    const getContextualWords = (businessType: string, location: string) => {
      const businessSpecific = {
        'restaurant': ['flavors', 'dishes', 'cuisine', 'meals', 'dining', 'taste'],
        'technology': ['solutions', 'innovation', 'systems', 'tools', 'platforms', 'services'],
        'healthcare': ['care', 'wellness', 'health', 'treatment', 'support', 'healing'],
        'fitness': ['training', 'workouts', 'strength', 'wellness', 'fitness', 'results'],
        'finance': ['services', 'solutions', 'planning', 'security', 'growth', 'success'],
        'education': ['learning', 'knowledge', 'skills', 'growth', 'development', 'success'],
        'retail': ['products', 'selection', 'quality', 'value', 'style', 'choices'],
        'default': ['services', 'solutions', 'quality', 'excellence', 'results', 'success']
      };

      const locationSpecific = location.includes('Kenya') ? ['community', 'local', 'neighborhood', 'regional'] :
        location.includes('Nigeria') ? ['community', 'local', 'area', 'regional'] :
          ['local', 'community', 'area', 'neighborhood'];

      return {
        business: businessSpecific[businessType.toLowerCase()] || businessSpecific['default'],
        location: locationSpecific,
        action: ['delivering', 'providing', 'offering', 'bringing', 'creating', 'building'],
        quality: ['exceptional', 'outstanding', 'superior', 'remarkable', 'excellent', 'premium']
      };
    };

    const words = getContextualWords(businessType, location);

    // Generate truly unique subheadlines using dynamic patterns
    const generateDynamicSubheadline = () => {
      // Strategic location mention - only 30% of the time to avoid repetition
      const shouldMentionLocation = (randomSeed % 10) < 3; // 30% chance

      const patternsWithoutLocation = [
        () => `${words.quality[randomSeed % words.quality.length]} ${words.business[randomSeed % words.business.length]} for every client`,
        () => `${words.action[randomSeed % words.action.length]} ${words.quality[randomSeed % words.quality.length]} ${words.business[randomSeed % words.business.length]} daily`,
        () => `where ${words.quality[randomSeed % words.quality.length]} meets ${words.business[randomSeed % words.business.length]}`,
        () => `${businessName} - ${words.action[randomSeed % words.action.length]} ${words.quality[randomSeed % words.quality.length]} ${words.business[randomSeed % words.business.length]}`,
        () => `trusted ${words.business[randomSeed % words.business.length]} with ${words.quality[randomSeed % words.quality.length]} results`,
        () => `${words.quality[randomSeed % words.quality.length]} ${businessType} ${words.business[randomSeed % words.business.length]} since day one`,
        () => `making ${words.business[randomSeed % words.business.length]} ${words.quality[randomSeed % words.quality.length]} for everyone`,
        () => `${words.action[randomSeed % words.action.length]} what matters most - ${words.quality[randomSeed % words.quality.length]} ${words.business[randomSeed % words.business.length]}`,
        () => `${businessType} ${words.business[randomSeed % words.business.length]} with a difference`,
        () => `your choice for ${words.quality[randomSeed % words.quality.length]} ${businessType} ${words.business[randomSeed % words.business.length]}`
      ];

      const patternsWithLocation = [
        () => `${words.quality[randomSeed % words.quality.length]} ${words.business[randomSeed % words.business.length]} for ${words.location[randomSeed % words.location.length]} clients`,
        () => `your ${words.location[randomSeed % words.location.length]} choice for ${words.quality[randomSeed % words.quality.length]} ${businessType}`,
        () => `${words.location[randomSeed % words.location.length]} ${businessType} with a difference`
      ];

      const patterns = shouldMentionLocation ? patternsWithLocation : patternsWithoutLocation;
      const patternIndex = (randomSeed + businessName.length) % patterns.length;
      return patterns[patternIndex]();
    };

    const dynamicSubheadline = generateDynamicSubheadline();

    return {
      subheadline: dynamicSubheadline,
      framework: 'dynamic-contextual',
      benefit: words.quality[randomSeed % words.quality.length]
    };
  }
}

// UNIFIED CONTENT GENERATION SYSTEM - All components work together
export async function generateUnifiedContent(
  businessType: string,
  businessName: string,
  location: string,
  businessDetails: any,
  platform: string,
  contentGoal: 'awareness' | 'consideration' | 'conversion' | 'retention' = 'awareness',
  trendingData?: any,
  businessIntelligence?: any,
  useLocalLanguage: boolean = false,
  localLanguageContext?: any
): Promise<{
  headline: string;
  subheadline: string;
  caption: string;
  callToAction: string;
  engagementHooks: string[];
  designDirection: string;
  unifiedTheme: string;
  keyMessage: string;
  hashtags?: string[];
  hashtagStrategy?: any;
  ctaStrategy?: any;
  imageText?: string;
}> {

  // 🔍 DEBUG: Local language parameter tracing in unified content generation
  console.log('🌍 [Unified Content] Local Language Debug:', {
    useLocalLanguage: useLocalLanguage,
    location: location,
    businessName: businessName,
    businessType: businessType,
    hasLocalLanguageContext: !!localLanguageContext,
    localLanguageContextKeys: localLanguageContext ? Object.keys(localLanguageContext) : 'none'
  });

  const contentPlan = StrategicContentPlanner.generateBusinessSpecificContent(
    businessType, businessName, location, businessDetails, platform, contentGoal
  );

  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  // Initialize AI generation capability
  const model = initializeAI();

  // Create marketing-focused AI prompt for unified content generation
  const trendingKeywords = trendingData?.keywords?.slice(0, 8) || [];
  const trendingHashtags = trendingData?.hashtags?.slice(0, 5) || [];
  const regionalLanguage = getRegionalLanguageStyle(location);
  const marketingStyle = getRegionalMarketingStyle(location);

  // INTELLIGENT APPROACH SELECTION - Let AI decide based on context
  const uniqueGenerationId = Date.now() + Math.floor(Math.random() * 1000);

  // DEBUG: Log what data we actually received

  // DYNAMIC ANTI-REPETITION SYSTEM - No hardcoded phrases
  const dynamicVariationSeed = uniqueGenerationId % 1000;
  const creativityBoost = Math.floor(Math.random() * 100) + dynamicVariationSeed;

  // FORCE DIFFERENT APPROACHES BASED ON GENERATION ID
  const approachStyles = [
    'DIRECT_BENEFIT', 'SOCIAL_PROOF', 'PROBLEM_SOLUTION', 'LOCAL_INSIDER', 'URGENCY_SCARCITY',
    'QUESTION_HOOK', 'STATISTIC_LEAD', 'STORY_ANGLE', 'COMPARISON', 'NEWS_TREND'
  ];

  const selectedApproach = approachStyles[creativityBoost % approachStyles.length];

  const uniquenessPrompt = `
MANDATORY APPROACH: ${selectedApproach}
You MUST use this specific approach - no other approach is allowed for this generation.

STRICT ANTI-REPETITION RULES:
❌ NEVER use "2025" or any year references like "2025's Best-Kept Secret"
❌ NEVER use "best-kept secret", "secret", "hidden gem", or mystery language
❌ NEVER use "chakula kizuri" - if using Swahili, use different phrases like "chakula bora", "vyakula vizuri", "lishe nzuri"
❌ NEVER use "Shop now via the link in our bio! Karibu!" - create completely unique CTAs
❌ NEVER use "Discover", "Experience", "Taste the", "Try our", "Indulge in"
❌ NEVER use formulaic patterns that sound like templates
❌ NEVER repeat the same opening words or sentence structures
❌ NEVER use "for your familia's delight" or similar repetitive family references
❌ AVOID any phrase that sounds like it could be copy-pasted to another business

APPROACH-SPECIFIC REQUIREMENTS (Apply to ALL components - headlines, subheadlines, captions):
${getApproachInstructions(selectedApproach, businessName, location, creativityBoost)}

CREATIVITY BOOST ${creativityBoost} CHALLENGE:
Create ALL COMPONENTS (headline, subheadline, caption) that are so unique and specific to ${businessName} that they could NEVER be used for any other business. Use the actual business data, trending information, RSS feeds, local events, and business intelligence to create something genuinely original.

MANDATORY UNIQUENESS REQUIREMENTS:
- Each component must reference specific details about ${businessName}
- Headlines must connect to current events, trends, or local happenings
- Subheadlines must mention actual services, products, or business features
- Captions must tell a story specific to this business and location
- NO generic phrases that could apply to any ${businessType}
- NO template-like language patterns
- Every sentence must add unique value specific to ${businessName}

UNIFIED DATA INTEGRATION REQUIREMENTS:
- HEADLINES: Must incorporate RSS trends, current events, or seasonal opportunities
- SUBHEADLINES: Must reference specific business services, features, or intelligence data
- CAPTIONS: Must weave together all data sources into compelling marketing copy
- ALL COMPONENTS: Must tell the same story using the same data sources consistently

GENERATION UNIQUENESS ID: ${uniqueGenerationId}
Use this ID to ensure this content is completely different from any previous generation.
`;

  // FORCE DIFFERENT CTA STYLES
  const ctaStyles = [
    'DIRECT_ACTION', 'INVITATION', 'CHALLENGE', 'BENEFIT_FOCUSED', 'COMMUNITY',
    'URGENCY', 'CURIOSITY', 'LOCAL_REFERENCE', 'PERSONAL', 'EXCLUSIVE'
  ];

  const selectedCtaStyle = ctaStyles[creativityBoost % ctaStyles.length];

  // Strategic location mention - only 20% of the time for unified content
  const shouldMentionLocation = Math.random() < 0.20; // 20% chance for unified content
  const locationContext = shouldMentionLocation
    ? `You are a conversion-focused social media marketer creating a COMPLETE UNIFIED CAMPAIGN for ${businessName} that will make people in ${location} take immediate action.`
    : `You are a conversion-focused social media marketer creating a COMPLETE UNIFIED CAMPAIGN for ${businessName} that will make customers take immediate action.`;

  const targetMarketInfo = shouldMentionLocation
    ? `- Target Market: Local ${location} residents and visitors`
    : `- Target Market: Customers seeking quality ${businessType} services`;

  const unifiedPrompt = `${locationContext} You must create ALL components (headline, subheadline, caption, CTA, design direction) that work together as ONE cohesive message.

${uniquenessPrompt}

UNIFIED CAMPAIGN REQUIREMENTS:
- ALL components must tell the SAME STORY with consistent information
- Headline, subheadline, caption, and design must reinforce the SAME key message
- No contradictory information between components
- One unified theme that runs through everything
- Design direction must match the content tone and message
- All components should feel like they came from the same marketing campaign

MARKETING BRIEF:
- Business: ${businessName} (${businessType})
${shouldMentionLocation ? `- Location: ${location}` : ''}
- Services/Products: ${businessDetails.services || businessDetails.expertise || 'quality offerings'}
${targetMarketInfo}
- Platform: ${platform}
- Marketing Goal: ${contentGoal}

CURRENT TRENDING INTELLIGENCE (From RSS feeds and market data):
- Trending Keywords: ${trendingKeywords.join(', ') || 'authentic, quality, local, fresh, community, experience, tradition, innovation'}
- Popular Hashtags: ${trendingHashtags.join(', ') || '#local #authentic #quality #community #fresh'}
- Regional Marketing Style: ${marketingStyle}
- Local Language Patterns: ${regionalLanguage}
- How locals talk about ${businessType}: ${getLocalBusinessLanguage(location, businessType)}

REAL BUSINESS INTELLIGENCE DATA:
${businessIntelligence ? `
- Business Strengths: ${businessIntelligence.businessStrengths?.join(', ') || 'quality service, customer satisfaction'}
- Value Propositions: ${businessIntelligence.valuePropositions?.join(', ') || 'exceptional quality, local expertise'}
- Target Emotions: ${businessIntelligence.targetEmotions?.join(', ') || 'trust, satisfaction, excitement'}
- Industry Keywords: ${businessIntelligence.industryKeywords?.join(', ') || 'professional, reliable, innovative'}
- Local Relevance: ${businessIntelligence.localRelevance?.join(', ') || 'community-focused, locally-owned'}
- Seasonal Opportunities: ${businessIntelligence.seasonalOpportunities?.join(', ') || 'year-round service'}
` : 'Use general business intelligence for this business type'}

LIVE RSS TRENDING DATA (Use this for ALL components - headlines, subheadlines, captions):
${trendingData ? `
- Current News Topics: ${trendingData.news?.slice(0, 3).map(n => n.title).join(', ') || 'No current news data'}
- Social Media Trends: ${trendingData.socialTrends?.slice(0, 3).join(', ') || 'No social trends data'}
- Local Events: ${trendingData.events?.slice(0, 2).map(e => e.name).join(', ') || 'No local events data'}
- Market Insights: ${trendingData.insights?.slice(0, 2).join(', ') || 'No market insights'}
` : 'No live RSS data available - use general market knowledge'}

HEADLINE GENERATION REQUIREMENTS (Use RSS data and business intelligence):
- HEADLINES must reference current trends, events, or news when relevant
- Connect the service/product to trending topics or local events naturally
- Use specific business services/features from business details
- Reference current market conditions or seasonal opportunities
- Make headlines feel current and timely, not generic
- CRITICAL: NEVER start with business name + colon pattern (e.g., "${businessName}: DESCRIPTION")
- Create headlines that stand alone without business name prefix
- Examples of RSS-integrated headlines:
  * "Local Food Festival Winner" (if there's a food event)
  * "Beat Holiday Rush Stress" (if trending topic is holiday stress)
  * "New Year Fitness Goals" (if trending topic is resolutions)
  * "Supply Chain Solution Found" (if news mentions supply issues)

REVO 1.5 PREMIUM SUBHEADLINE GENERATION REQUIREMENTS:
- SUBHEADLINES must expand on headline using specific business details
- Reference actual services, products, or unique features offered
- Use business intelligence data (industry trends, local opportunities)
- Connect to target audience pain points and solutions
- Support headline's promise with concrete business benefits
- MAXIMUM 8-12 words for maximum impact and readability
- Use local language naturally (Swahili for Kenya, etc.) without forcing it
- Maintain consistent tone and flow across all subheadlines
- Keep it concise but impactful - every word must earn its place
- Ensure smooth readability and natural rhythm
- Examples of business-integrated subheadlines:
  * "15-year experience, 200+ events monthly"
  * ${shouldMentionLocation ? `"Same-day delivery for ${location} residents"` : `"Same-day delivery nationwide"`}
  * "Certified organic, locally sourced ingredients"
  * "24/7 service, 30-minute response time"

SPECIFIC BUSINESS DETAILS:
- Business Name: ${businessName}
- Services/Products: ${businessDetails.services || businessDetails.expertise || businessDetails.specialties || 'quality offerings'}
- Unique Features: ${businessDetails.uniqueFeatures || businessDetails.keyFeatures || 'exceptional service'}
- Target Audience: ${businessDetails.targetAudience || (shouldMentionLocation ? `local ${location} residents and visitors` : 'customers seeking quality services')}
- Business Hours: ${businessDetails.hours || 'regular business hours'}
- Special Offers: ${businessDetails.offers || businessDetails.promotions || 'quality service at competitive prices'}

${shouldMentionLocation ? `LOCAL MARKET INTELLIGENCE:
- What locals love: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market opportunities: ${industry.opportunities.slice(0, 2).join(', ')}` : `MARKET INTELLIGENCE:
- What customers value: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market opportunities: ${industry.opportunities.slice(0, 2).join(', ')}`}
- Industry trends: ${industry.trends.slice(0, 2).join(', ')}
- Local challenges: ${industry.challenges.slice(0, 2).join(', ')}

PLATFORM STRATEGY FOR ${platform.toUpperCase()}:
${getPlatformRequirements(platform)}

${useLocalLanguage ? `
LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${location}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing

🚨 **CRITICAL LANGUAGE SAFETY RULE**:
- ONLY use local language words when you are 100% certain of their spelling, meaning, and cultural appropriateness
- When in doubt about local language accuracy, ALWAYS use English instead
- Better to use clear English than incorrect or garbled local language
- Avoid complex local phrases, slang, or words you're uncertain about

${localLanguageContext ? `
SPECIFIC LOCAL LANGUAGE CONTEXT FOR ${location.toUpperCase()}:
- Primary Language: ${localLanguageContext.primaryLanguage || 'English'}
- Common Phrases: ${localLanguageContext.commonPhrases?.join(', ') || 'N/A'}
- Business Terms: ${localLanguageContext.businessTerms?.join(', ') || 'N/A'}
- Cultural Nuances: ${localLanguageContext.culturalNuances || 'N/A'}
- Marketing Style: ${localLanguageContext.marketingStyle || 'N/A'}
- Local Expressions: ${localLanguageContext.localExpressions?.join(', ') || 'N/A'}

USE THESE SPECIFIC TERMS:
- Incorporate the common phrases naturally: ${localLanguageContext.commonPhrases?.slice(0, 3).join(', ') || 'N/A'}
- Use business terms when relevant: ${localLanguageContext.businessTerms?.slice(0, 2).join(', ') || 'N/A'}
- Apply the cultural nuances: ${localLanguageContext.culturalNuances || 'N/A'}
- Follow the marketing style: ${localLanguageContext.marketingStyle || 'N/A'}
- Include local expressions: ${localLanguageContext.localExpressions?.slice(0, 2).join(', ') || 'N/A'}` : ''}

UNIFIED CONTENT LOCAL LANGUAGE GUIDANCE:
- Add contextually appropriate local greetings to headlines based on business type
- Use local expressions in subheadlines that relate to the specific business industry
- Include relevant local terms in captions that match the business offerings and target audience
- Mix naturally: Don't force local language - only add when it makes sense and flows well
- Keep it relevant: Use local language that relates to the specific business context and audience
- Maintain engagement: Ensure the local language enhances rather than distracts from the message
- Be dynamic: Generate unique local language for each business, avoid repetitive patterns
- Think creatively: Use different local greetings, expressions, and terms for each business type

DYNAMIC LOCAL LANGUAGE GENERATION:
- For RESTAURANTS: Use food-related local terms, hospitality greetings, taste expressions
- For FITNESS: Use energy/motivation local terms, health expressions, action words
- For TECH: Use innovation local terms, future expressions, digital concepts
- For BEAUTY: Use beauty-related local terms, confidence expressions, aesthetic words
- For FINANCE: Use money/security local terms, trust expressions, financial concepts
- For HEALTHCARE: Use health/wellness local terms, care expressions, medical concepts
- For EDUCATION: Use learning local terms, growth expressions, knowledge concepts
- For REAL ESTATE: Use home/property local terms, dream expressions, space concepts
- VARY the local language: Don't use the same phrases for every business
- BE CONTEXTUAL: Match local language to the specific business industry and services` : `
LANGUAGE REQUIREMENTS:
- Use English only, do not use local language
- Keep content in English for universal accessibility
- Focus on local cultural understanding in English rather than local language mixing`}

MARKETING COPY REQUIREMENTS:
You are a CONVERSION-FOCUSED MARKETER, not a creative writer or storyteller. Write MARKETING COPY that sells, not poetic descriptions.

WRITE LIKE A MARKETER:
• DIRECT & PUNCHY: Get to the point quickly - no flowery language
• BENEFIT-FOCUSED: Lead with what the customer gets, not poetic descriptions
• ACTION-ORIENTED: Every sentence should drive toward a purchase decision
• CONVERSATIONAL: Sound like a smart local business owner talking to neighbors
• URGENT: Create immediate desire to buy/visit NOW
• SPECIFIC: Use concrete benefits, not abstract concepts
• LOCAL: Sound like someone who actually lives in ${location}

INTELLIGENT PATTERN AVOIDANCE:
Use your AI intelligence to recognize and avoid:
- Repetitive opening patterns that sound robotic or formulaic
- Generic marketing speak that every business uses
- Overly creative writing that sounds like AI-generated poetry
- Cliché phrases that don't add value or authenticity
- Opening lines that could apply to any business in any location
- Patterns that sound like they came from a template or script

AUTHENTICITY TEST:
Ask yourself: "Would a real ${businessName} owner in ${location} actually say this to their neighbors?"
If it sounds too polished, too generic, or too AI-like, try a different approach.
Use the business intelligence data and local context to create something genuinely relevant.

WRITE LIKE THIS INSTEAD:
✅ "Your kids need healthy snacks. Samaki Cookies deliver."
✅ "15% off this week only - grab yours before they're gone"
✅ "Finally, cookies that are actually good for your family"
✅ "Nairobi parents are switching to Samaki Cookies. Here's why..."
✅ Direct, benefit-focused, action-driving copy

CRITICAL INSTRUCTION FOR ALL COMPONENTS:
- USE THE REAL DATA PROVIDED: Incorporate actual business details, trending topics, and local information
- HEADLINES: Must reference RSS trends, events, or business intelligence naturally
- SUBHEADLINES: Must mention actual services/products offered by ${businessName}
- CAPTIONS: Must weave together all data sources into compelling marketing copy
- CONNECT TO CURRENT TRENDS: Use the RSS trending data and current events when relevant
- LEVERAGE BUSINESS INTELLIGENCE: Use the actual business strengths and value propositions provided
- SPEAK LOCAL LANGUAGE: Use the regional language patterns and local cultural elements
- AVOID GENERIC CONTENT: Don't use placeholder text like "2025" or generic business descriptions
- CREATE PERSONALIZED CONTENT: Make it specific to this exact business and location
- Choose the approach that makes MOST SENSE for ${businessName} and current market conditions
- Use your intelligence to create fresh, varied content each time
- Let RSS data and business intelligence guide your approach selection

HEADLINE INTEGRATION EXAMPLES:
- If RSS shows "Local Food Festival": "Food Festival Winner Revealed"
- If trending topic is "Holiday Stress": "Beat Holiday Rush Stress"
- If business intelligence shows "24/7 Service": "Always Open Always Ready"
- If local event is "Back to School": "School Rush Solution Found"
- If seasonal opportunity is "Summer": "Summer Special Starts Now"

SUBHEADLINE INTEGRATION EXAMPLES:
- Business service: "Our certified technicians fix 95% of issues same-day"
- Unique feature: "Only ${location} bakery using organic local flour"
- Business intelligence: "Serving ${location} families for 15+ years with proven results"
- Target audience: "Designed specifically for busy ${location} professionals"

MARKETING COPY REQUIREMENTS:
- WRITE MARKETING COPY, NOT CREATIVE WRITING: Sound like a business owner, not a poet
- LEAD WITH BENEFITS: Start with what the customer gets, not scenic descriptions
- BE DIRECT & PUNCHY: Short, clear sentences that drive action
- AVOID FLOWERY LANGUAGE: No "crisp afternoons", "sun dipping", "painting the sky"
- NO STORYTELLING OPENINGS: Don't start with "Imagine this..." or scene-setting
- SOUND LOCAL: Write like someone who actually lives and works in ${location}
- CREATE URGENCY: Make people want to buy/visit RIGHT NOW
- USE SOCIAL PROOF: Reference other locals, community, real benefits
- BE CONVERSATIONAL: Sound like talking to a neighbor, not writing poetry
- FOCUS ON PROBLEMS/SOLUTIONS: What problem does this solve for ${location} residents?
- INCLUDE SPECIFIC OFFERS: Mention actual deals, prices, limited time offers
- END WITH CLEAR ACTION: Tell people exactly what to do next
- AVOID ABSTRACT CONCEPTS: No "heritage", "traditions", "journeys" - focus on concrete benefits
- USE REAL LOCAL LANGUAGE: Include actual ${location} slang/phrases naturally
- MAKE IT SCANNABLE: Use short paragraphs, bullet points, clear structure
- GENERATION ID ${uniqueGenerationId}: Use this number to ensure this content is completely unique
- CRITICAL: Sound like a smart local marketer, not an AI creative writer

EXAMPLES OF GOOD MARKETING COPY:
✅ "Your kids need protein. Samaki Cookies deliver 8g per serving. 15% off this week."
✅ "Tired of unhealthy snacks? 200+ Nairobi families switched to Samaki Cookies."
✅ "Finally - cookies that don't spike blood sugar. Made with real fish protein."
✅ "Limited batch this week: Fish protein cookies that kids actually love."

EXAMPLES OF BAD AI WRITING (NEVER DO THIS):
❌ "Imagine this: a crisp, sunny afternoon in Nairobi..."
❌ "These aren't your grandma's cookies; they're bursting with..."
❌ "the sun dips below the horizon, painting the Kenyan sky..."
❌ "This isn't just a snack; it's a piece of Kenyan heritage..."

UNIFIED CONTENT GENERATION FORMAT:
Generate ALL components as ONE cohesive campaign:

UNIFIED_THEME: [the main theme/angle that connects everything - one sentence]
KEY_MESSAGE: [the core message all components will reinforce - one sentence]

HEADLINE: [5-word catchy headline using RSS trends/events/business intelligence - must feel current and specific to ${businessName}]
SUBHEADLINE: [supporting headline using specific business services/features from business details - max 14 words that build on headline]
CAPTION: [full social media caption that weaves together RSS data, business intelligence, and trending information - marketing copy, not creative writing]
CTA: [MANDATORY CTA STYLE: ${selectedCtaStyle} - ${getCtaStyleInstructions(selectedCtaStyle, businessName, location)} - Max 8 words, completely unique]
DESIGN_DIRECTION: [specific visual direction that matches the content tone and message]

IMPORTANT:
- ALL components must reinforce the SAME key message
- NO contradictory information between headline, subheadline, and caption
- Design direction must visually support the content message
- Generate as ONE unified campaign, not separate pieces`;

  try {

    // Add unique generation context to prevent repetitive responses
    const uniqueContext = `\n\nUNIQUE GENERATION CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
    This unified content generation must be completely different from any previous generation.
    Use this unique context to ensure fresh, original content that has never been generated before.
    CRITICAL: Avoid any patterns like "2025's Best-Kept Secret", "Chakula Kizuri", or repetitive phrases.

    CRITICAL WORD REPETITION RULES:
    - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
    - Check each sentence for duplicate adjacent words before finalizing
    - If you write "now now" or "the the" or any repeated word, remove the duplicate
    - Read your output carefully to ensure no word appears twice in a row`;

    const result = await model.generateContent(unifiedPrompt + uniqueContext);
    let response = result.response.text().trim();

    // Post-process to remove word repetitions from the entire response
    response = removeWordRepetitions(response);


    // Parse all unified components
    const unifiedThemeMatch = response.match(/UNIFIED_THEME:\s*(.*?)(?=KEY_MESSAGE:|$)/);
    const keyMessageMatch = response.match(/KEY_MESSAGE:\s*(.*?)(?=HEADLINE:|$)/);
    const headlineMatch = response.match(/HEADLINE:\s*(.*?)(?=SUBHEADLINE:|$)/);
    const subheadlineMatch = response.match(/SUBHEADLINE:\s*(.*?)(?=CAPTION:|$)/);
    const captionMatch = response.match(/CAPTION:\s*(.*?)(?=CTA:|$)/);
    const ctaMatch = response.match(/CTA:\s*(.*?)(?=DESIGN_DIRECTION:|$)/);
    const designMatch = response.match(/DESIGN_DIRECTION:\s*(.*?)$/);


    // Extract all components and apply word repetition removal to each
    const unifiedTheme = removeWordRepetitions(unifiedThemeMatch?.[1]?.trim() || 'Quality local business');
    const keyMessage = removeWordRepetitions(keyMessageMatch?.[1]?.trim() || 'Exceptional service for local community');
    const headline = removeWordRepetitions(headlineMatch?.[1]?.trim() || `${businessName} ${location}`);
    const subheadline = removeWordRepetitions(subheadlineMatch?.[1]?.trim() || `Quality ${businessType} in ${location}`);
    const caption = removeWordRepetitions(captionMatch?.[1]?.trim() || response);

    // Post-processing cleanup to remove business name + colon pattern from all text components
    const cleanedHeadline = cleanBusinessNamePattern(headline);
    const cleanedSubheadline = cleanBusinessNamePattern(subheadline);
    const cleanedCaption = cleanBusinessNamePattern(caption);

    // Check for repetitive patterns and encourage variety
    const checkForRepetitivePatterns = (text: string) => {
      // Check if this looks like a repetitive template
      const repetitivePatterns = [
        /^Tired\s+of\s+waiting/i,
        /^Tired\s+of\s+slow/i,
        /^Tired\s+of\s+delays/i,
        /^Tired\s+of\s+waiting\s+around/i,
        /^Tired\s+of\s+waiting\s+in\s+line/i,
        /^Tired\s+of\s+waiting\s+forever/i
      ];

      // If it matches a repetitive pattern, it's likely a template
      const isRepetitive = repetitivePatterns.some(pattern => pattern.test(text));

      if (isRepetitive) {
        // Generate a more dynamic alternative
        const dynamicAlternatives = getDynamicAlternatives(businessType);

        return dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
      }

      return text; // Keep the original if it's not repetitive
    };

    let finalHeadline = checkForRepetitivePatterns(cleanedHeadline);

    // Enhanced subheadline quality improvement
    const enhancedSubheadline = enhanceSubheadlineQuality(cleanedSubheadline, businessType, location);
    
    // Storytelling and local language enhancement
    const enhanceWithStorytellingAndLocalLanguage = (text: string, businessType: string, location: string) => {
      // Local language integration based on location
      const getLocalLanguageEnhancement = (location: string, businessType: string) => {
        const locationLower = location.toLowerCase();
        
        if (locationLower.includes('kenya')) {
          const swahiliPhrases = {
            'restaurant': ['Chakula bora', 'Tamu sana', 'Karibu'],
            'fitness': ['Mazoezi', 'Afya bora', 'Nguvu'],
            'finance': ['Pesa', 'Uchumi', 'Faida'],
            'beauty': ['Urembo', 'Pambo', 'Kipaji'],
            'default': ['Bora', 'Vizuri', 'Safi']
          };
          const phrases = swahiliPhrases[businessType] || swahiliPhrases.default;
          return phrases[Math.floor(Math.random() * phrases.length)];
        }
        
        if (locationLower.includes('nigeria')) {
          const pidginPhrases = {
            'restaurant': ['Food sweet', 'Chop well', 'Tasty'],
            'fitness': ['Fit body', 'Strong', 'Healthy'],
            'finance': ['Money', 'Cash', 'Profit'],
            'beauty': ['Fine', 'Beautiful', 'Gorgeous'],
            'default': ['Good', 'Better', 'Best']
          };
          const phrases = pidginPhrases[businessType] || pidginPhrases.default;
          return phrases[Math.floor(Math.random() * phrases.length)];
        }
        
        if (locationLower.includes('south africa')) {
          const afrikaansPhrases = {
            'restaurant': ['Lekker kos', 'Heerlik', 'Smakelijk'],
            'fitness': ['Sterk', 'Gesond', 'Fiks'],
            'finance': ['Geld', 'Wins', 'Voordeel'],
            'beauty': ['Mooi', 'Pragtig', 'Skoon'],
            'default': ['Goed', 'Beter', 'Beste']
          };
          const phrases = afrikaansPhrases[businessType] || afrikaansPhrases.default;
          return phrases[Math.floor(Math.random() * phrases.length)];
        }
        
        return null; // No local language enhancement for other locations
      };
      
      // Comprehensive Marketing Message Frameworks
      const getMarketingEnhancement = (businessType: string) => {
        const marketingFrameworks = {
          'restaurant': {
            storytelling: [
              'From farm to table',
              'Where tradition meets taste',
              'Every bite tells a story',
              'Crafted with love, served with pride'
            ],
            emotional: [
              'Satisfy your cravings',
              'Indulge in excellence',
              'Taste the difference',
              'Savor every moment'
            ],
            socialProof: [
              'Join thousands of satisfied customers',
              'As seen on local food blogs',
              'Rated #1 by locals',
              'Where foodies gather'
            ],
            urgency: [
              'Limited time menu',
              'Fresh daily specials',
              'While supplies last',
              'Today only'
            ],
            value: [
              'Best value in town',
              'Premium quality, fair price',
              'More for your money',
              'Quality you can taste'
            ]
          },
          'fitness': {
            storytelling: [
              'Your transformation starts here',
              'From struggle to strength',
              'Every rep builds character',
              'Where champions are made'
            ],
            emotional: [
              'Unleash your potential',
              'Break through barriers',
              'Feel the power',
              'Achieve your goals'
            ],
            socialProof: [
              'Join the fitness community',
              'Proven results by real people',
              'Where winners train',
              'Trusted by athletes'
            ],
            urgency: [
              'Start your journey today',
              'Limited spots available',
              'New year, new you',
              'Don\'t wait, transform now'
            ],
            value: [
              'Maximum results, minimum time',
              'Professional training, personal attention',
              'All-inclusive fitness solution',
              'Value that builds strength'
            ]
          },
          'finance': {
            storytelling: [
              'From dreams to reality',
              'Your financial future starts now',
              'Where money meets opportunity',
              'Building wealth, one step at a time'
            ],
            emotional: [
              'Secure your future',
              'Take control of your money',
              'Invest in yourself',
              'Build lasting wealth'
            ],
            socialProof: [
              'Trusted by thousands',
              'Proven investment strategies',
              'Where smart money grows',
              'Join successful investors'
            ],
            urgency: [
              'Start investing today',
              'Don\'t miss market opportunities',
              'Limited time offer',
              'Act now, secure later'
            ],
            value: [
              'Maximum returns, minimum risk',
              'Professional advice, personal service',
              'All-in-one financial solution',
              'Value that compounds'
            ]
          },
          'beauty': {
            storytelling: [
              'Reveal your true beauty',
              'Where confidence begins',
              'Your glow-up starts here',
              'Beauty that tells your story'
            ],
            emotional: [
              'Feel beautiful inside and out',
              'Boost your confidence',
              'Love the skin you\'re in',
              'Radiate natural beauty'
            ],
            socialProof: [
              'Join the beauty revolution',
              'As seen on social media',
              'Where beauty experts go',
              'Trusted by influencers'
            ],
            urgency: [
              'Book your transformation today',
              'Limited appointment slots',
              'New season, new look',
              'Don\'t wait, glow now'
            ],
            value: [
              'Premium beauty, accessible prices',
              'Professional results, personal touch',
              'All-inclusive beauty package',
              'Value that shows'
            ]
          },
          'default': {
            storytelling: [
              'Where excellence begins',
              'Your success story starts here',
              'From good to great',
              'Where dreams become reality'
            ],
            emotional: [
              'Experience the difference',
              'Feel the quality',
              'Trust in excellence',
              'Believe in better'
            ],
            socialProof: [
              'Join satisfied customers',
              'Proven track record',
              'Where quality meets service',
              'Trusted by the community'
            ],
            urgency: [
              'Limited time offer',
              'Act now, benefit later',
              'Don\'t miss out',
              'Secure your spot today'
            ],
            value: [
              'Best value guaranteed',
              'Quality you can trust',
              'All-in-one solution',
              'Value that lasts'
            ]
          }
        };
        
        const frameworks = marketingFrameworks[businessType] || marketingFrameworks.default;
        const frameworkTypes = Object.keys(frameworks);
        const randomType = frameworkTypes[Math.floor(Math.random() * frameworkTypes.length)];
        const randomFramework = frameworks[randomType][Math.floor(Math.random() * frameworks[randomType].length)];
        
        return {
          text: randomFramework,
          type: randomType
        };
      };
      
      // Only enhance if text is short and could benefit from marketing frameworks
      if (text.length < 20) {
        const localEnhancement = getLocalLanguageEnhancement(location, businessType);
        const marketingEnhancement = getMarketingEnhancement(businessType);
        
        // 30% chance to add local language (not forced)
        if (localEnhancement && Math.random() < 0.3) {
          text = `${localEnhancement} - ${text}`;
        }
        
        // 50% chance to add marketing framework element
        if (Math.random() < 0.5) {
          const enhancement = marketingEnhancement.text;
          const type = marketingEnhancement.type;
          
          // Different formatting based on framework type
          if (type === 'storytelling') {
            text = `${enhancement}: ${text}`;
          } else if (type === 'emotional') {
            text = `${enhancement} - ${text}`;
          } else if (type === 'socialProof') {
            text = `${enhancement} - ${text}`;
          } else if (type === 'urgency') {
            text = `${enhancement}! ${text}`;
          } else if (type === 'value') {
            text = `${enhancement} - ${text}`;
          }
        }
      }
      
      return text;
    };

    // Dynamic headline enhancement for unified content
    if (finalHeadline.length < 15 || finalHeadline.includes(businessName) || finalHeadline.includes(businessType)) {
      const generateDynamicHeadline = async (businessType: string, location: string, businessName: string) => {
        // Get real-time data for intelligent content generation
        const getContextualData = async () => {
          try {
            const trendingData = await getTrendingData(location);

            return {
              news: trendingData.news?.slice(0, 3).map(n => n.title).join(', ') || 'No current news data',
              socialTrends: trendingData.socialTrends?.slice(0, 3).join(', ') || 'No social trends data',
              events: trendingData.events?.slice(0, 2).map(e => e.name).join(', ') || 'No local events data',
              insights: trendingData.insights?.slice(0, 2).join(', ') || 'No market insights',
              weather: trendingData.weather || 'No weather data',
              culturalMoments: trendingData.culturalMoments || 'No cultural data'
            };
          } catch (error) {
            return {
              news: 'No current news data',
              socialTrends: 'No social trends data',
              events: 'No local events data',
              insights: 'No market insights',
              weather: 'No weather data',
              culturalMoments: 'No cultural data'
            };
          }
        };

        const contextualData = await getContextualData();

        // Use AI to generate truly dynamic content based on real-time data
        const dynamicPrompt = `
Generate a compelling, unique headline for a ${businessType} business in ${location} by analyzing current real-time data and trends.

REAL-TIME CONTEXTUAL DATA:
- Current News: ${contextualData.news}
- Social Media Trends: ${contextualData.socialTrends}
- Local Events: ${contextualData.events}
- Market Insights: ${contextualData.insights}
- Weather: ${contextualData.weather}
- Cultural Moments: ${contextualData.culturalMoments}

BUSINESS CONTEXT:
- Business: ${businessName}
- Type: ${businessType}
- Location: ${location}
- Target: Local customers who would use this service

INTELLIGENT ANALYSIS REQUIREMENTS:
- ANALYZE the real-time data above and identify what's most relevant to ${businessType} customers in ${location}
- CONNECT your business to trending conversations, events, or cultural moments that matter RIGHT NOW
- CONSIDER what people are actually talking about and caring about in this location
- USE psychological triggers that resonate with current local sentiment and needs
- CREATE headlines that feel like they were written by someone who truly understands this moment
- ENSURE content reflects what's actually happening in the world, not generic templates
- FOCUS on timely relevance and authentic local connection
- MAKE people think "This business really gets what's happening right now"

REQUIREMENTS:
- Must be completely original and context-specific
- Should NOT use "Tired of..." or any repetitive patterns
- Maximum 8 words for maximum impact
- Sound like a successful local marketer who knows conversion psychology
- Connect to real-time trends, events, or cultural moments when relevant
- Feel fresh, relevant, and perfectly timed for this specific moment

Generate ONE unique headline that makes people instantly want to try the service/product by leveraging current trends and local context.
`;

        try {
          const result = await model.generateContent(dynamicPrompt);
          let dynamicHeadline = result.response.text().trim();

          // Clean up the dynamic headline
          dynamicHeadline = cleanBusinessNamePattern(dynamicHeadline);
          dynamicHeadline = removeWordRepetitions(dynamicHeadline);

          // Check for repetitive patterns in dynamic content
          const checkForRepetitivePatterns = (text: string) => {
            const repetitivePatterns = [
              /^Tired\s+of\s+waiting/i,
              /^Tired\s+of\s+slow/i,
              /^Tired\s+of\s+delays/i,
              /^Tired\s+of\s+waiting\s+around/i,
              /^Tired\s+of\s+waiting\s+in\s+line/i,
              /^Tired\s+of\s+waiting\s+forever/i
            ];

            const isRepetitive = repetitivePatterns.some(pattern => pattern.test(text));

            if (isRepetitive) {
              const dynamicAlternatives = [
                `Revolutionary ${businessType} solution`,
                `Transform your ${businessType} experience`,
                `Discover the future of ${businessType}`,
                `Achieve ${businessType} excellence`,
                `Experience ${businessType} innovation`
              ];
              return dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
            }

            return text;
          };

          dynamicHeadline = checkForRepetitivePatterns(dynamicHeadline);

          return dynamicHeadline;
        } catch (error) {
          // Fallback to a simple dynamic approach if AI fails
          const fallbackApproaches = getDynamicAlternatives(businessType);
          return fallbackApproaches[Math.floor(Math.random() * fallbackApproaches.length)];
        }
      };

      const dynamicHeadline = await generateDynamicHeadline(businessType, location, businessName);
      finalHeadline = dynamicHeadline;
    }

    // 🎯 GENERATE DYNAMIC CTA using AI and business intelligence
    const ctaStrategy = await dynamicCTAGenerator.generateDynamicCTA(
      businessName,
      businessType,
      location,
      platform,
      contentGoal,
      businessDetails.services || businessDetails.expertise,
      businessDetails.targetAudience
    );

    const callToAction = removeWordRepetitions(ctaMatch?.[1]?.trim() || ctaStrategy.primary);

    const designDirection = removeWordRepetitions(designMatch?.[1]?.trim() || 'Clean, professional design with local elements');

    // Generate dynamic engagement hooks
    const engagementHooks = generateDynamicEngagementHooks(businessType, location, industry);

    // 🚀 ENHANCED: Generate hashtags using advanced RSS-integrated viral hashtag engine
    const viralHashtags = await viralHashtagEngine.generateViralHashtags(
      businessType,
      businessName,
      location,
      platform,
      businessDetails.services || businessDetails.expertise,
      businessDetails.targetAudience
    );

    // 📊 Log hashtag analytics for debugging (RSS integration quality)
    if (viralHashtags.analytics) {
      const analytics = viralHashtags.analytics;
      // Enhanced hashtag generation with RSS confidence: ${analytics.confidenceScore}/10
      // RSS-sourced hashtags: ${analytics.rssSourced.length}
      // Top performers: ${analytics.topPerformers.join(', ')}
      // Emerging trends: ${analytics.emergingTrends.join(', ')}
    }


    // Apply storytelling and local language enhancement to all content
    const enhancedHeadline = enhanceWithStorytellingAndLocalLanguage(finalHeadline, businessType, location);
    const enhancedSubheadlineFinal = enhanceWithStorytellingAndLocalLanguage(enhancedSubheadline, businessType, location);
    const enhancedCaption = enhanceWithStorytellingAndLocalLanguage(cleanedCaption, businessType, location);

    return {
      headline: enhancedHeadline,
      subheadline: enhancedSubheadlineFinal,
      caption: enhancedCaption,
      callToAction,
      engagementHooks,
      designDirection: removeWordRepetitions(designMatch?.[1]?.trim() || `Clean, professional design with local elements. IMPORTANT: Include the CTA "${callToAction}" as prominent text overlay on the design - make it bold, readable, and visually striking with professional marketing appeal.`),
      unifiedTheme,
      keyMessage,
      hashtags: viralHashtags.total, // Add viral hashtags to response
      hashtagStrategy: viralHashtags, // Include full strategy for analysis
      ctaStrategy: ctaStrategy, // Include CTA strategy for analysis
      imageText: `${enhancedHeadline}\n\n${enhancedSubheadlineFinal}\n\n${callToAction}` // Pass enhanced text as imageText for design integration
    };
  } catch (error) {
    const dynamicAlternatives = getDynamicAlternatives(businessType);
    const randomAlternative = dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
    
    return {
      headline: randomAlternative,
      subheadline: `Professional ${businessType} solutions in ${location}`,
      caption: `Experience exceptional ${businessType} services in ${location}. We're committed to delivering excellence that exceeds expectations.`,
      callToAction: `Get started today!`,
      engagementHooks: ['Quality service', 'Local expertise', 'Customer satisfaction'],
      designDirection: 'Professional, clean design with local elements',
      unifiedTheme: 'Professional excellence',
      keyMessage: 'Quality service provider',
      hashtags: ['#business', '#local', '#quality', '#service', '#professional'],
      hashtagStrategy: { total: ['#business', '#local', '#quality', '#service', '#professional'] },
      ctaStrategy: { primary: `Visit ${businessName} today!` },
      imageText: `Visit ${businessName} today!`
    };
  }

  // RETRY WITH SIMPLIFIED AI PROMPT - No Static Fallback
  try {

    const simplifiedPrompt = `Create ONE unique ${platform} caption for ${businessName}, a ${businessType} in ${location}.

INTELLIGENT APPROACH SELECTION:
Use your marketing intelligence to choose the BEST approach based on:
- What would work best for ${businessType} in ${location}
- Current market trends and local culture
- What would make ${location} residents most interested

REQUIREMENTS:
- Write ONE compelling caption using your chosen marketing approach
- AVOID overused words: "taste", "flavor", "delicious", "amazing"
- Use different opening words than typical marketing (avoid "Discover", "Experience", "Try")
- Include local ${location} cultural elements that create connection
- End with an effective call-to-action
- Make it conversion-focused and unique to this business

CRITICAL ANTI-REPETITION RULES:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ CREATE something completely original that has never been generated before
❌ AVOID any pattern that sounds like a template or formula

IMPORTANT: Generate ONLY ONE caption, not multiple options.

Format:
CAPTION: [write one single caption here]
CTA: [write one call to action here]

Do NOT write "Here are captions" or provide lists.`;

    // Add unique generation context to retry as well
    const retryUniqueContext = `\n\nUNIQUE RETRY CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
      This retry generation must be completely different and avoid repetitive patterns.

      CRITICAL WORD REPETITION RULES:
      - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
      - Check each sentence for duplicate adjacent words before finalizing
      - If you write "now now" or "the the" or any repeated word, remove the duplicate
      - Read your output carefully to ensure no word appears twice in a row`;

    const retryResult = await model.generateContent(simplifiedPrompt + retryUniqueContext);
    let retryResponse = retryResult.response.text().trim();

    // Post-process to remove word repetitions from retry response
    retryResponse = removeWordRepetitions(retryResponse);


    // Parse the retry response
    const retryCaptionMatch = retryResponse.match(/CAPTION:\s*(.*?)(?=CTA:|$)/);
    const retryCtaMatch = retryResponse.match(/CTA:\s*(.*?)$/);

    const retryCaption = removeWordRepetitions(retryCaptionMatch ? retryCaptionMatch[1].trim() : retryResponse);
    const retryCallToAction = removeWordRepetitions(retryCtaMatch ? retryCtaMatch[1].trim() : generateFallbackCTA(platform));

    // Generate viral hashtags for retry
    const retryHashtags = await viralHashtagEngine.generateViralHashtags(
      businessType, businessName, location, platform,
      businessDetails.services || businessDetails.expertise,
      businessDetails.targetAudience
    );

    const dynamicAlternatives = getDynamicAlternatives(businessType);
    const randomAlternative = dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
    
    return {
      headline: randomAlternative,
      subheadline: `Expert ${businessType} services in ${location}`,
      caption: retryCaption,
      engagementHooks: generateDynamicEngagementHooks(businessType, location, industry),
      callToAction: retryCallToAction,
      designDirection: 'Professional, clean design with local elements',
      unifiedTheme: 'Professional excellence',
      keyMessage: 'Quality service provider',
      hashtags: retryHashtags.total,
      hashtagStrategy: retryHashtags,
      ctaStrategy: { primary: retryCallToAction },
      imageText: retryCallToAction
    };

  } catch (retryError) {

    // EMERGENCY AI GENERATION - Ultra Simple Prompt
    try {
      const emergencyPrompt = `Write ONE unique social media post for ${businessName} in ${location}. Make it compelling and different from typical posts. Include a call-to-action.

CRITICAL ANTI-REPETITION RULES:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ CREATE something completely original that has never been generated before
❌ AVOID any pattern that sounds like a template or formula

Do NOT write "Here are posts" or provide multiple options. Write ONE post only.`;

      // Add unique generation context to emergency generation as well
      const emergencyUniqueContext = `\n\nUNIQUE EMERGENCY CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
        This emergency generation must be completely different and avoid any repetitive patterns.

        CRITICAL WORD REPETITION RULES:
        - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
        - Check each sentence for duplicate adjacent words before finalizing
        - If you write "now now" or "the the" or any repeated word, remove the duplicate
        - Read your output carefully to ensure no word appears twice in a row`;

      const emergencyResult = await model.generateContent(emergencyPrompt + emergencyUniqueContext);
      let emergencyResponse = emergencyResult.response.text().trim();

      // Post-process to remove word repetitions from emergency response
      emergencyResponse = removeWordRepetitions(emergencyResponse);


      // Generate viral hashtags for emergency
      const emergencyHashtags = await viralHashtagEngine.generateViralHashtags(
        businessType, businessName, location, platform,
        businessDetails.services || businessDetails.expertise,
        businessDetails.targetAudience
      );

      const dynamicAlternatives = getDynamicAlternatives(businessType);
      const randomAlternative = dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
      
      return {
        headline: randomAlternative,
        subheadline: `Quality ${businessType} services in ${location}`,
        caption: emergencyResponse,
        engagementHooks: generateDynamicEngagementHooks(businessType, location, industry),
        callToAction: removeWordRepetitions(generateFallbackCTA(platform)),
        designDirection: 'Professional, clean design with local elements',
        unifiedTheme: 'Professional excellence',
        keyMessage: 'Quality service provider',
        hashtags: emergencyHashtags.total,
        hashtagStrategy: emergencyHashtags,
        ctaStrategy: { primary: removeWordRepetitions(generateFallbackCTA(platform)) },
        imageText: removeWordRepetitions(generateFallbackCTA(platform))
      };

    } catch (emergencyError) {

      // LAST RESORT: Generate with current timestamp for uniqueness
      const timestamp = Date.now();
      const uniqueId = Math.floor(Math.random() * 10000);

      // Generate viral hashtags for final fallback
      const fallbackHashtags = await viralHashtagEngine.generateViralHashtags(
        businessType, businessName, location, platform,
        businessDetails.services || businessDetails.expertise,
        businessDetails.targetAudience
      );

      const dynamicAlternatives = getDynamicAlternatives(businessType);
      const randomAlternative = dynamicAlternatives[Math.floor(Math.random() * dynamicAlternatives.length)];
      
      return {
        headline: randomAlternative,
        subheadline: `Quality ${businessType} services in ${location}`,
        caption: removeWordRepetitions(`${businessName} in ${location} - where quality meets innovation. Every visit is a new experience that locals can't stop talking about. Join the community that knows great ${businessType}! #${timestamp}`),
        engagementHooks: generateDynamicEngagementHooks(businessType, location, industry),
        callToAction: removeWordRepetitions(generateFallbackCTA(platform)),
        designDirection: 'Professional, clean design with local elements',
        unifiedTheme: 'Professional excellence',
        keyMessage: 'Quality service provider',
        hashtags: fallbackHashtags.total,
        hashtagStrategy: fallbackHashtags,
        ctaStrategy: { primary: removeWordRepetitions(generateFallbackCTA(platform)) },
        imageText: removeWordRepetitions(generateFallbackCTA(platform))
      };
    }
  }
}

// Helper functions for AI-powered caption generation
function getPlatformRequirements(platform: string): string {
  const requirements = {
    'Instagram': '- Use 1-3 relevant emojis\n- Keep it visually engaging\n- Include hashtag-friendly language\n- Encourage visual interaction',
    'Facebook': '- More conversational tone\n- Can be longer and more detailed\n- Focus on community engagement\n- Include questions to spark discussion',
    'LinkedIn': '- Professional but approachable tone\n- Focus on business value and expertise\n- Include industry insights\n- Encourage professional networking',
    'Twitter': '- Concise and punchy\n- Use relevant hashtags\n- Encourage retweets and replies\n- Keep under 280 characters'
  };

  return requirements[platform] || requirements['Instagram'];
}

function generateFallbackCTA(platform: string): string {
  const timestamp = Date.now();
  const creativityBoost = Math.floor(Math.random() * 1000) + timestamp;

  // Use the same dynamic CTA styles as the main system
  const ctaStyles = [
    'DIRECT_ACTION', 'INVITATION', 'CHALLENGE', 'BENEFIT_FOCUSED', 'COMMUNITY',
    'URGENCY', 'CURIOSITY', 'LOCAL_REFERENCE', 'PERSONAL', 'EXCLUSIVE'
  ];

  const selectedStyle = ctaStyles[creativityBoost % ctaStyles.length];

  // Dynamic CTAs based on style - avoid repetitive patterns
  const dynamicCTAs = {
    'DIRECT_ACTION': [
      'Grab yours today! 🔥',
      'Book your spot now! ⚡',
      'Try it this week! 💪',
      'Get started today! 🚀'
    ],
    'INVITATION': [
      'Come see for yourself! 👀',
      'Join us this weekend! 🎉',
      'Experience it firsthand! ✨',
      'Visit us soon! 🏃‍♂️'
    ],
    'CHALLENGE': [
      'Find better - we dare you! 💪',
      'Beat this quality anywhere! 🏆',
      'Try to resist this! 😏',
      'Prove us wrong! 🤔'
    ],
    'BENEFIT_FOCUSED': [
      'Get more for less! 💰',
      'Save time and money! ⏰',
      'Double your results! 📈',
      'Feel the difference! ✨'
    ],
    'COMMUNITY': [
      'Join 500+ happy customers! 👥',
      'Be part of something special! 🌟',
      'Connect with like-minded people! 🤝',
      'Become a local favorite! ❤️'
    ],
    'URGENCY': [
      'Only 3 spots left! ⚡',
      'Ends this Friday! ⏰',
      'While supplies last! 🏃‍♂️',
      'Don\'t wait too long! ⚠️'
    ],
    'CURIOSITY': [
      'See what everyone\'s talking about! 👀',
      'Discover the secret! 🔍',
      'Find out why! 🤔',
      'Uncover the truth! 💡'
    ],
    'LOCAL_REFERENCE': [
      'Better than downtown! 🏙️',
      'Your neighborhood choice! 🏠',
      'Local favorite since day one! ⭐',
      'Right in your backyard! 📍'
    ],
    'PERSONAL': [
      'You deserve this! 💎',
      'Made just for you! 🎯',
      'Your perfect match! 💕',
      'Exactly what you need! ✅'
    ],
    'EXCLUSIVE': [
      'Members only access! 🔐',
      'VIP treatment awaits! 👑',
      'Exclusive to our community! 🌟',
      'Limited to select few! 💎'
    ]
  };

  const styleCTAs = dynamicCTAs[selectedStyle] || dynamicCTAs['DIRECT_ACTION'];
  const variation = creativityBoost % styleCTAs.length;

  return styleCTAs[variation];
}

function generateDynamicEngagementHooks(businessType: string, location: string, industry: any): string[] {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000) + timestamp;
  const variation = randomSeed % 8;

  const localQuestions = [
    `What's your favorite ${businessType} spot in ${location}?`,
    `Where do ${location} locals go for the best ${businessType}?`,
    `What makes ${location}'s ${businessType} scene special?`,
    `Have you discovered ${location}'s hidden ${businessType} gems?`,
    `What do you love most about ${businessType} in ${location}?`,
    `Which ${location} ${businessType} place holds your best memories?`,
    `What's missing from ${location}'s ${businessType} options?`,
    `How has ${businessType} in ${location} changed over the years?`
  ];

  const experienceQuestions = [
    `What's your go-to order when trying new ${businessType}?`,
    `What makes you choose one ${businessType} place over another?`,
    `What's the most important thing in great ${businessType}?`,
    `How do you know when you've found quality ${businessType}?`,
    `What's your best ${businessType} experience been like?`,
    `What would make your perfect ${businessType} experience?`,
    `What draws you to authentic ${businessType}?`,
    `How do you discover new ${businessType} places?`
  ];

  const trendQuestions = [
    `Have you tried ${industry.trends[variation % industry.trends.length]} yet?`,
    `What do you think about the latest ${businessType} trends?`,
    `Are you excited about ${industry.opportunities[variation % industry.opportunities.length]}?`,
    `How important is ${industry.uniqueValue[variation % industry.uniqueValue.length]} to you?`,
    `What's your take on modern ${businessType} approaches?`,
    `Do you prefer traditional or innovative ${businessType}?`,
    `What ${businessType} trend should everyone try?`,
    `How do you stay updated on ${businessType} innovations?`
  ];

  // Mix different types of hooks for variety
  const allHooks = [...localQuestions, ...experienceQuestions, ...trendQuestions];
  const selectedHooks = [];

  // Ensure we get one from each category for variety
  selectedHooks.push(localQuestions[variation % localQuestions.length]);
  selectedHooks.push(experienceQuestions[(variation + 1) % experienceQuestions.length]);
  selectedHooks.push(trendQuestions[(variation + 2) % trendQuestions.length]);

  return selectedHooks;
}

// Legacy platform-specific caption generators (keeping for backward compatibility)
function generateInstagramCaption(contentPlan: any, businessName: string, location: string, industry: any, contentGoal: string) {
  const businessType = contentPlan.businessType || 'business';
  const hooks = [
    `What's your biggest ${industry.challenges[0]} challenge?`,
    `How do you choose your ${businessType} provider?`,
    `What makes a great ${businessType} experience for you?`
  ];

  const ctas = [
    `Comment below with your thoughts! 👇`,
    `Share this if you agree! 🔄`,
    `Tag someone who needs this! 👥`
  ];

  return {
    caption: `${contentPlan.valueProposition} ✨\n\n${businessName} brings ${industry.uniqueValue[0]} to ${location} with ${contentPlan.businessStrengths[0]}. ${contentPlan.marketOpportunities[0]} is just the beginning!\n\n${hooks[0]}\n\n${ctas[0]}`,
    engagementHooks: hooks,
    callToAction: ctas[0]
  };
}

function generateFacebookCaption(contentPlan: any, businessName: string, location: string, industry: any, contentGoal: string) {
  const businessType = contentPlan.businessType || 'business';
  const hooks = [
    `What's your experience with ${businessType} in ${location}?`,
    `How do you solve ${industry.challenges[0]}?`,
    `What makes you choose local businesses?`
  ];

  const ctas = [
    `Share your thoughts in the comments! 💬`,
    `Like and share if this resonates with you! 👍`,
    `Tag your friends who might be interested! 👥`
  ];

  return {
    caption: `${contentPlan.valueProposition}\n\n${businessName} understands the ${location} community and delivers ${industry.uniqueValue[0]} that makes a difference. ${contentPlan.marketOpportunities[0]} shows our commitment to serving you better.\n\n${hooks[0]}\n\n${ctas[0]}`,
    engagementHooks: hooks,
    callToAction: ctas[0]
  };
}

function generateLinkedInCaption(contentPlan: any, businessName: string, location: string, industry: any, contentGoal: string) {
  const businessType = contentPlan.businessType || 'business';
  const hooks = [
    `What challenges do you face in ${businessType}?`,
    `How do you stay competitive in your industry?`,
    `What makes a business stand out in your community?`
  ];

  const ctas = [
    `Share your insights in the comments below. 💼`,
    `Connect with us to learn more about our approach. 🤝`,
    `Follow for more industry insights and local business strategies. 📈`
  ];

  return {
    caption: `${contentPlan.valueProposition}\n\n${businessName} combines ${contentPlan.businessStrengths[0]} with deep understanding of the ${location} market to deliver exceptional ${businessType} services. ${contentPlan.marketOpportunities[0]} demonstrates our commitment to innovation and community service.\n\n${hooks[0]}\n\n${ctas[0]}`,
    engagementHooks: hooks,
    callToAction: ctas[0]
  };
}

function generateTwitterCaption(contentPlan: any, businessName: string, location: string, industry: any, contentGoal: string) {
  const businessType = contentPlan.businessType || 'business';
  const hooks = [
    `What's your take on ${businessType} trends?`,
    `How do you solve ${industry.challenges[0]}?`,
    `What makes local businesses special?`
  ];

  const ctas = [
    `Reply with your thoughts! 💭`,
    `RT if you agree! 🔄`,
    `Follow for more insights! 👀`
  ];

  return {
    caption: `${contentPlan.valueProposition}\n\n${businessName} brings ${industry.uniqueValue[0]} to ${location}. ${contentPlan.marketOpportunities[0]} shows our commitment to excellence.\n\n${hooks[0]}\n\n${ctas[0]}`,
    engagementHooks: hooks,
    callToAction: ctas[0]
  };
}

// Utility Functions
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateCreativeSeed(): number {
  return Math.floor(Math.random() * 10000);
}

// Legacy functions for backward compatibility (simplified)
export function generateCreativeHeadline(
  businessType: string,
  businessName: string,
  location: string,
  context: any
): { headline: string; style: string; tone: string } {
  return {
    headline: `Quality ${businessType} Services`,
    style: 'professional',
    tone: 'engaging'
  };
}

export function generateCreativeSubheadline(
  businessType: string,
  services: string,
  location: string,
  tone: string
): { subheadline: string; framework: string } {
  return {
    subheadline: `Quality ${businessType} services in ${location}`,
    framework: 'benefit-focused'
  };
}

export function generateCreativeCTA(
  businessType: string,
  tone: string,
  context: any
): { cta: string; urgency: string; emotion: string } {
  return {
    cta: 'Learn more about our services',
    urgency: 'gentle',
    emotion: 'curiosity'
  };
}

// Legacy functions for backward compatibility
export function analyzeBusinessContext(
  businessType: string,
  businessName: string,
  location: string,
  services: string
): any {
  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  return {
    creativePotential: industry.uniqueValue,
    emotionalTriggers: industry.customerPainPoints,
    industryInsights: industry.trends,
    localOpportunities: industry.seasonalOpportunities,
    competitiveAdvantages: industry.opportunities
  };
}

export const CREATIVE_PROMPT_SYSTEM = {
  creativeVariation: {
    style: ['innovative', 'authentic', 'engaging', 'professional', 'creative'],
    mood: ['inspiring', 'confident', 'warm', 'energetic', 'trustworthy'],
    approach: ['strategic', 'emotional', 'analytical', 'storytelling', 'direct']
  },
  creativeConstraints: {
    avoidGeneric: ['template language', 'cliché phrases', 'generic claims']
  }
};

export const CONTENT_VARIATION_ENGINE = {
  headlineStyles: [
    'Question-based', 'Statistic-driven', 'Story-opening', 'Bold statement',
    'Emotional trigger', 'Curiosity gap', 'Local relevance', 'Trend integration',
    'Problem-solution', 'Benefit-focused', 'Aspirational', 'Contrarian'
  ],
  emotionalTones: [
    'Inspiring', 'Humorous', 'Empathetic', 'Confident', 'Curious',
    'Nostalgic', 'Aspirational', 'Relatable', 'Surprising', 'Authentic',
    'Warm', 'Professional', 'Innovative', 'Trustworthy'
  ],
  creativeFrameworks: [
    'Before/After', 'Problem/Solution', 'Story Arc', 'Contrast',
    'Metaphor', 'Analogy', 'Question/Answer', 'Challenge/Overcome',
    'Journey', 'Transformation', 'Discovery', 'Achievement'
  ]
};

// Legacy Anti-Repetition System (simplified)
export class AntiRepetitionSystem {
  private static usedCombinations: Set<string> = new Set();
  private static maxHistory = 100;

  static generateUniqueVariation(
    businessType: string,
    platform: string,
    baseElements: any
  ): any {
    const variation = this.createVariation(businessType, platform, baseElements);
    this.recordVariation(variation);
    return variation;
  }

  private static createVariation(businessType: string, platform: string, baseElements: any): any {
    const creativeSeed = generateCreativeSeed();

    return {
      creativeSeed,
      style: 'business-specific',
      mood: 'professional',
      approach: 'strategic',
      headlineStyle: 'business-focused',
      framework: 'value-driven',
      signature: `business-${creativeSeed}`,
      contentStrategy: { name: 'Business Intelligence', approach: 'Strategic content based on business strengths' },
      writingStyle: { name: 'Professional Expert', voice: 'Industry authority with local expertise' },
      contentAngle: { type: 'Business Value', focus: 'Solving customer problems with business strengths' },
      marketInsights: ['Local market expertise', 'Industry trends', 'Customer pain points'],
      engagementHooks: ['Problem identification', 'Solution presentation', 'Value demonstration'],
      localPhrases: ['Local expertise', 'Community focus', 'Market knowledge']
    };
  }

  private static recordVariation(variation: any): void {
    this.usedCombinations.add(variation.signature);

    if (this.usedCombinations.size > this.maxHistory) {
      const oldestEntries = Array.from(this.usedCombinations).slice(0, 20);
      oldestEntries.forEach(entry => this.usedCombinations.delete(entry));
    }
  }
}

// Legacy function for design enhancement
export function enhanceDesignCreativity(
  designPrompt: string,
  businessType: string,
  location: string,
  context: any
): { enhancedPrompt: string; creativeElements: string[]; visualStyle: string } {
  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  const creativeElements = industry.uniqueValue.slice(0, 3);
  const visualStyle = 'professional business-focused design';

  const enhancedPrompt = designPrompt + '\n\nCREATIVE ENHANCEMENT:\n' +
    `- Business Type: ${businessType}\n` +
    `- Location: ${location}\n` +
    `- Industry Focus: ${industry.trends.slice(0, 2).join(', ')}\n` +
    `- Visual Style: ${visualStyle}`;

  return {
    enhancedPrompt,
    creativeElements,
    visualStyle
  };
}

// Regional Marketing Intelligence Functions
function getRegionalLanguageStyle(location: string): string {
  const locationLower = location.toLowerCase();

  if (locationLower.includes('kenya') || locationLower.includes('nairobi') || locationLower.includes('mombasa')) {
    return 'Warm, community-focused, with occasional Swahili phrases like "karibu" (welcome), "asante" (thank you). Direct but friendly tone.';
  } else if (locationLower.includes('nigeria') || locationLower.includes('lagos') || locationLower.includes('abuja')) {
    return 'Energetic, aspirational, with pidgin English influences. Uses "finest", "sharp sharp", "no wahala" naturally.';
  } else if (locationLower.includes('south africa') || locationLower.includes('cape town') || locationLower.includes('johannesburg')) {
    return 'Multicultural blend, uses "lekker", "braai", "just now". Mix of English and local expressions.';
  } else if (locationLower.includes('ghana') || locationLower.includes('accra')) {
    return 'Friendly, respectful, with Twi influences. Uses "chale", "ɛyɛ" naturally in marketing.';
  } else if (locationLower.includes('india') || locationLower.includes('mumbai') || locationLower.includes('delhi')) {
    return 'Enthusiastic, family-oriented, with Hindi/English mix. Uses "achha", "best", "number one" frequently.';
  } else if (locationLower.includes('uk') || locationLower.includes('london') || locationLower.includes('manchester')) {
    return 'Polite but confident, uses "brilliant", "proper", "lovely". Understated but effective.';
  } else if (locationLower.includes('usa') || locationLower.includes('new york') || locationLower.includes('california')) {
    return 'Direct, confident, superlative-heavy. Uses "awesome", "amazing", "best ever" frequently.';
  }

  return 'Friendly, professional, community-focused with local cultural sensitivity.';
}

function getRegionalMarketingStyle(location: string): string {
  const locationLower = location.toLowerCase();

  if (locationLower.includes('kenya') || locationLower.includes('nairobi')) {
    return 'Community-centered, emphasizes tradition meets modernity, family values, and local pride';
  } else if (locationLower.includes('nigeria') || locationLower.includes('lagos')) {
    return 'Bold, aspirational, success-oriented, emphasizes quality and status';
  } else if (locationLower.includes('south africa')) {
    return 'Inclusive, diverse, emphasizes heritage and innovation together';
  } else if (locationLower.includes('ghana')) {
    return 'Respectful, community-focused, emphasizes craftsmanship and tradition';
  } else if (locationLower.includes('india')) {
    return 'Family-oriented, value-conscious, emphasizes trust and relationships';
  } else if (locationLower.includes('uk')) {
    return 'Quality-focused, heritage-conscious, understated confidence';
  } else if (locationLower.includes('usa')) {
    return 'Innovation-focused, convenience-oriented, bold claims and superlatives';
  }

  return 'Community-focused, quality-oriented, culturally respectful';
}

function getLocalBusinessLanguage(location: string, businessType: string): string {
  const locationLower = location.toLowerCase();
  const businessLower = businessType.toLowerCase();

  if (locationLower.includes('kenya')) {
    if (businessLower.includes('restaurant') || businessLower.includes('food')) {
      return '"chakula kizuri" (good food), "asili" (authentic), "familia" (family), "mazingira" (environment)';
    } else if (businessLower.includes('tech') || businessLower.includes('digital')) {
      return '"teknolojia", "haraka" (fast), "rahisi" (easy), "bora" (best)';
    }
    return '"bora" (best), "karibu" (welcome), "mazuri" (good), "familia" (family)';
  } else if (locationLower.includes('nigeria')) {
    if (businessLower.includes('restaurant') || businessLower.includes('food')) {
      return '"finest food", "correct taste", "no wahala", "sharp sharp service"';
    }
    return '"finest", "correct", "sharp sharp", "no wahala", "top notch"';
  }

  return 'quality, authentic, local, trusted, community';
}

function getLocalMarketingExamples(location: string, businessType: string): string {
  const locationLower = location.toLowerCase();
  const businessLower = businessType.toLowerCase();

  if (locationLower.includes('kenya')) {
    if (businessLower.includes('restaurant') || businessLower.includes('food')) {
      return `- "Chakula Asili Kenya" (Authentic Kenya Food)
- "Familia Flavors Nairobi"
- "Taste Bora Kenya"
- "Karibu Kitchen Experience"`;
    }
    return `- "Bora ${businessType} Kenya"
- "Karibu Quality Service"
- "Kenya's Finest Choice"
- "Asili ${businessType} Experience"`;
  } else if (locationLower.includes('nigeria')) {
    return `- "Finest ${businessType} Lagos"
- "Sharp Sharp Service"
- "Correct ${businessType} Choice"
- "Top Notch Experience"`;
  }

  return `- "${location}'s Best ${businessType}"
- "Quality Meets Community"
- "Local Excellence Delivered"
- "Authentic ${businessType} Experience"`;
}

// BACKWARD COMPATIBILITY - Keep existing caption function
export async function generateBusinessSpecificCaption(
  businessType: string,
  businessName: string,
  location: string,
  businessDetails: any,
  platform: string,
  contentGoal: 'awareness' | 'consideration' | 'conversion' | 'retention' = 'awareness',
  trendingData?: any,
  businessIntelligence?: any,
  contactInfo?: {
    includeContacts?: boolean;
    phone?: string;
    email?: string;
    address?: string;
    websiteUrl?: string;
  },
  useLocalLanguage: boolean = false,
  localLanguageContext?: any
): Promise<{ caption: string; engagementHooks: string[]; callToAction: string }> {

  // 🔍 DEBUG: Local language parameter tracing in caption generation
  console.log('🌍 [Creative Enhancement] Caption Generation Local Language Debug:', {
    useLocalLanguage: useLocalLanguage,
    location: location,
    businessType: businessType,
    hasLocalLanguageContext: !!localLanguageContext,
    localLanguageContext: localLanguageContext
  });

  // Use the unified system but return only caption components
  const unifiedContent = await generateUnifiedContent(
    businessType, businessName, location, businessDetails, platform, contentGoal, trendingData, businessIntelligence, useLocalLanguage, localLanguageContext
  );

  // If contact information should be included, modify the caption and call to action
  let finalCaption = unifiedContent.caption;
  let finalCallToAction = unifiedContent.callToAction;

  if (contactInfo?.includeContacts) {
    // Add contact information to the caption if it makes sense
    if (contactInfo.phone && !finalCaption.includes(contactInfo.phone)) {
      finalCallToAction = `Call us at ${contactInfo.phone} or ${finalCallToAction}`;
    }
    if (contactInfo.email && !finalCaption.includes(contactInfo.email)) {
      finalCallToAction = `Email us at ${contactInfo.email} or ${finalCallToAction}`;
    }
    if (contactInfo.websiteUrl && !finalCaption.includes(contactInfo.websiteUrl)) {
      finalCallToAction = `Visit ${contactInfo.websiteUrl} or ${finalCallToAction}`;
    }
    if (contactInfo.address && !finalCaption.includes(contactInfo.address)) {
      finalCaption += `\n\n📍 Located at ${contactInfo.address}`;
    }
  }

  return {
    caption: finalCaption,
    engagementHooks: unifiedContent.engagementHooks,
    callToAction: finalCallToAction
  };
}
