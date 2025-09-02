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
      console.log(`🔧 Removed duplicate word: "${currentWord}"`);
      continue; // Skip this duplicate word
    }

    cleanedWords.push(currentWord);
  }

  return cleanedWords.join(' ');
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
  switch (approach) {
    case 'DIRECT_BENEFIT':
      return `HEADLINES: Lead with specific benefit. Example: "8g Protein Per Cookie" SUBHEADLINES: Expand with business details. Example: "Finally snacks that fuel kids properly - made fresh daily in ${location}" CAPTIONS: Full benefit story with RSS/business data.`;

    case 'SOCIAL_PROOF':
      return `HEADLINES: Reference community adoption. Example: "200+ ${location} Families Agree" SUBHEADLINES: Add business specifics. Example: "Our protein cookies beat sugar crashes every time" CAPTIONS: Full social proof story with testimonials and business intelligence.`;

    case 'PROBLEM_SOLUTION':
      return `HEADLINES: State the problem. Example: "Sugar Crashes Ruining Snacktime" SUBHEADLINES: Present solution. Example: "${businessName}'s protein cookies keep energy steady for hours" CAPTIONS: Full problem-solution narrative with business details.`;

    case 'LOCAL_INSIDER':
      return `HEADLINES: Use local insider knowledge. Example: "${location} Parents Secret Weapon" SUBHEADLINES: Add business insider details. Example: "What 500+ local families know about our cookies" CAPTIONS: Full insider story with local references and business intelligence.`;

    case 'URGENCY_SCARCITY':
      return `HEADLINES: Create real urgency. Example: "Only 50 Packs Left" SUBHEADLINES: Add business context. Example: "This week's batch selling faster than expected" CAPTIONS: Full urgency story with business details and RSS trends.`;

    case 'QUESTION_HOOK':
      return `HEADLINES: Ask specific question. Example: "Tired of Sugar Crashes?" SUBHEADLINES: Hint at solution. Example: "${businessName} has the protein-packed answer parents love" CAPTIONS: Full question-answer story with business intelligence.`;

    case 'STATISTIC_LEAD':
      return `HEADLINES: Lead with business statistic. Example: "95% Same-Day Fix Rate" SUBHEADLINES: Add context. Example: "Our certified technicians solve most issues within hours" CAPTIONS: Full statistic story with business details and proof.`;

    case 'STORY_ANGLE':
      return `HEADLINES: Start story hook. Example: "Local Baker's Secret Recipe" SUBHEADLINES: Continue story. Example: "Three generations of ${location} families can't be wrong" CAPTIONS: Full story with business history and customer experiences.`;

    case 'COMPARISON':
      return `HEADLINES: Set up comparison. Example: "Better Than Downtown Options" SUBHEADLINES: Specify difference. Example: "Same quality, half the price, right in ${location}" CAPTIONS: Full comparison with business advantages and local benefits.`;

    case 'NEWS_TREND':
      return `HEADLINES: Connect to current news/trends. Example: "Holiday Rush Solution Found" SUBHEADLINES: Add business connection. Example: "${businessName} handles your busiest season stress-free" CAPTIONS: Full trend connection with RSS data and business solutions.`;

    default:
      return `Create unique content that could only apply to ${businessName} in ${location}. Be specific and authentic.`;
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
  businessIntelligence?: any
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

  const prompt = `You are a brilliant local marketing expert who deeply understands ${location} culture, language, and market dynamics. You stay updated with current trends and know exactly how businesses in ${location} market themselves successfully.

BUSINESS INTELLIGENCE:
- Business: ${businessName} (${businessType})
- Location: ${location}
- Experience: ${businessDetails.experience || 'established business'}
- Specialties: ${businessDetails.expertise || businessDetails.services || 'professional services'}
- Target Market: ${businessDetails.targetAudience || 'local community'}
- Marketing Goal: ${contentGoal}

CURRENT TRENDING CONTEXT (Use these insights to make content relevant):
- Trending Keywords: ${trendingKeywords.join(', ') || 'quality, authentic, local, fresh, community'}
- Popular Hashtags: ${trendingHashtags.join(', ') || '#local #authentic #quality'}
- Regional Marketing Style: ${marketingStyle}
- Local Language Tone: ${regionalLanguage}

LOCAL MARKET INTELLIGENCE:
- Industry Trends: ${industry.trends.slice(0, 3).join(', ')}
- Competitive Advantages: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market Opportunities: ${industry.opportunities.slice(0, 2).join(', ')}
- How locals in ${location} talk about ${businessType}: ${getLocalBusinessLanguage(location, businessType)}

REGIONAL MARKETING STRATEGY:
You understand that in ${location}, people respond to ${marketingStyle} marketing. Use the trending keywords naturally and speak like locals do. Create content that feels authentic to ${location} culture and current market trends.

CONVERSION PSYCHOLOGY REQUIREMENTS:
- Maximum 5 words that trigger immediate desire to try/buy
- Use psychological triggers: scarcity, exclusivity, curiosity, FOMO
- Create urgency and desire - make people think "I NEED this NOW"
- Sound like a successful local marketer who knows conversion psychology
- Incorporate trending elements naturally (don't force them)
- Use language patterns that drive action in ${location}
- Focus on what makes people instantly want to experience ${businessName}
- Create curiosity gaps that make people want to know more

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
❌ CREATE something completely original that has never been generated before
❌ AVOID any pattern that sounds like a template or formula

IMPORTANT: Generate ONLY ONE headline, not multiple options or lists.
Do NOT write "Here are headlines" or provide multiple choices.
Generate ONE unique headline that makes people instantly want to try ${businessName}. Focus on conversion, not just awareness.
Make it so specific to ${businessName} in ${location} that it could never be used for another business.`;

  try {
    // Add unique generation context to prevent repetitive responses
    const uniqueContext = `\n\nUNIQUE GENERATION CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
    This generation must be completely different from any previous generation.
    Use this unique context to ensure fresh, original content that has never been generated before.

    CRITICAL WORD REPETITION RULES:
    - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
    - Check each sentence for duplicate adjacent words before finalizing
    - If you write "now now" or "the the" or any repeated word, remove the duplicate
    - Read your output carefully to ensure no word appears twice in a row`;

    const result = await model.generateContent(prompt + uniqueContext);
    let headline = result.response.text().trim();

    // Post-process to remove word repetitions
    headline = removeWordRepetitions(headline);

    // Add randomization to approach and emotional impact to ensure variety
    const approaches = ['strategic', 'creative', 'authentic', 'bold', 'community-focused', 'innovative'];
    const emotions = ['engaging', 'inspiring', 'trustworthy', 'exciting', 'confident', 'welcoming'];

    return {
      headline: headline,
      approach: approaches[Math.floor(Math.random() * approaches.length)],
      emotionalImpact: emotions[Math.floor(Math.random() * emotions.length)]
    };
  } catch (error) {
    console.error('❌ AI headline generation failed, attempting retry:', error);

    // RETRY WITH SIMPLIFIED AI PROMPT - No Static Fallback
    try {
      console.log('🔄 Retrying headline with simplified AI prompt...');

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

      console.log('✅ Headline retry successful:', retryHeadline);

      return {
        headline: retryHeadline,
        approach: 'ai-retry-generated',
        emotionalImpact: 'conversion-focused'
      };

    } catch (retryError) {
      console.error('❌ Headline retry failed, using emergency AI generation:', retryError);

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

        console.log('🚨 Emergency headline generation successful');

        return {
          headline: emergencyHeadline,
          approach: 'emergency-ai-generated',
          emotionalImpact: 'unique-ai-created'
        };

      } catch (emergencyError) {
        console.error('❌ All AI headline attempts failed:', emergencyError);

        // LAST RESORT: Generate with current timestamp for uniqueness
        const timestamp = Date.now();
        const uniqueId = timestamp % 1000;

        const emergencyHeadlines = [
          `${businessName} ${location} Experience`,
          `Exclusive ${businessType} ${location}`,
          `${location}'s Premium ${businessType}`,
          `Limited ${businessName} Access`,
          `Secret ${businessType} Discovery`
        ];

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
  businessIntelligence?: any
): Promise<{ subheadline: string; framework: string; benefit: string }> {

  const industry = BUSINESS_INTELLIGENCE_SYSTEM.industryInsights[businessType.toLowerCase()] ||
    BUSINESS_INTELLIGENCE_SYSTEM.industryInsights['retail'];

  // Initialize AI generation capability
  const model = initializeAI();

  // Create marketing-focused AI prompt for subheadline generation with trending intelligence
  const trendingKeywords = trendingData?.keywords?.slice(0, 5) || [];
  const regionalLanguage = getRegionalLanguageStyle(location);
  const marketingStyle = getRegionalMarketingStyle(location);

  const prompt = `You are a skilled local marketer creating a subheadline for ${businessName} that will make people in ${location} want to visit immediately. You understand current trends and local marketing patterns.

MARKETING CONTEXT:
- Main Headline: "${headline}"
- Business: ${businessName} (${businessType})
- Location: ${location}
- Services/Products: ${businessDetails.services || businessDetails.expertise || 'quality offerings'}
- Target Market: Local ${location} residents and visitors
- Marketing Goal: ${contentGoal}

CURRENT TRENDING INTELLIGENCE:
- Trending Keywords: ${trendingKeywords.join(', ') || 'authentic, quality, local, fresh, community'}
- Regional Marketing Style: ${marketingStyle}
- Local Language Patterns: ${regionalLanguage}
- How locals talk about ${businessType}: ${getLocalBusinessLanguage(location, businessType)}

LOCAL MARKET INTELLIGENCE:
- What locals value: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market opportunities: ${industry.opportunities.slice(0, 2).join(', ')}
- Industry trends: ${industry.trends.slice(0, 2).join(', ')}

REGIONAL MARKETING STRATEGY:
Create a subheadline that makes locals think "I need to try this place!" Use trending keywords naturally and speak like successful marketers in ${location} do. Focus on what makes ${businessName} irresistible to people in ${location}.

CONVERSION-FOCUSED SUBHEADLINE REQUIREMENTS:
- Maximum 14 words that trigger immediate action and desire
- Use psychological triggers: social proof, scarcity, exclusivity, urgency
- Create FOMO (Fear of Missing Out) - make people think they'll regret not trying
- Include specific benefits that answer "What's in it for me?"
- Use action-oriented language that drives immediate response
- Build on the headline's promise with compelling reasons to act NOW
- Sound like a successful conversion-focused marketer in ${location}
- Should make the offer irresistible and create urgency to visit/buy

Examples of effective ${location} subheadlines (DO NOT COPY THESE - CREATE SOMETHING COMPLETELY DIFFERENT):
${getLocalMarketingExamples(location, businessType).split('\n').map(line => line.replace('- "', '- "').replace('"', '" (subheadline style)')).slice(0, 3).join('\n')}

CRITICAL ANTI-REPETITION INSTRUCTIONS FOR SUBHEADLINES:
❌ DO NOT use "2025's Best-Kept Secret" or any variation
❌ DO NOT use "Chakula Kizuri" or repetitive Swahili phrases
❌ DO NOT use "for your familia's delight" or similar family references
❌ CREATE something completely original that has never been generated before
❌ AVOID any pattern that sounds like a template or formula
❌ Make it specific to ${businessName}'s actual services and features

Generate ONLY the subheadline text, nothing else.
Make it so specific to ${businessName} in ${location} that it could never be used for another business.`;

  try {
    // Add unique generation context to prevent repetitive responses
    const uniqueContext = `\n\nUNIQUE GENERATION CONTEXT: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}
    This subheadline generation must be completely different from any previous generation.
    Use this unique context to ensure fresh, original subheadlines that have never been generated before.

    CRITICAL WORD REPETITION RULES:
    - NEVER repeat the same word consecutively (e.g., "buy now now pay" should be "buy now pay")
    - Check each sentence for duplicate adjacent words before finalizing
    - If you write "now now" or "the the" or any repeated word, remove the duplicate
    - Read your output carefully to ensure no word appears twice in a row`;

    const result = await model.generateContent(prompt + uniqueContext);
    let subheadline = result.response.text().trim();

    // Post-process to remove word repetitions
    subheadline = removeWordRepetitions(subheadline);

    // Add randomization to framework and benefit
    const frameworks = ['benefit-focused', 'problem-solving', 'community-centered', 'expertise-driven', 'results-oriented'];
    const benefits = industry.uniqueValue.concat(['exceptional service', 'local expertise', 'proven results']);

    return {
      subheadline: subheadline,
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
      benefit: benefits[Math.floor(Math.random() * benefits.length)]
    };
  } catch (error) {
    console.error('AI subheadline generation failed, using fallback:', error);

    // Marketing-focused fallback with enhanced randomization
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 1000) + timestamp;
    const variation = randomSeed % 16;

    const experienceWords = ['authentic', 'fresh', 'handcrafted', 'traditional', 'artisan', 'premium', 'local', 'quality'];
    const actionWords = ['discover', 'experience', 'taste', 'enjoy', 'savor', 'explore', 'try', 'visit'];
    const benefitPhrases = [
      'where quality meets tradition',
      'crafted with care daily',
      'your local favorite since day one',
      'bringing authentic flavors to life',
      'where every detail matters',
      'made fresh, served with pride',
      'your neighborhood gem awaits',
      'experience the difference'
    ];

    const marketingSubheadlines = [
      `${experienceWords[variation % experienceWords.length]} ${businessType} ${actionWords[(variation + 1) % actionWords.length]} in ${location}`,
      `${benefitPhrases[variation % benefitPhrases.length]}`,
      `${actionWords[variation % actionWords.length]} ${experienceWords[(variation + 2) % experienceWords.length]} ${businessType} in ${location}`,
      `where ${location} locals ${actionWords[(variation + 3) % actionWords.length]} ${experienceWords[variation % experienceWords.length]} ${businessType}`,
      `${experienceWords[variation % experienceWords.length]} ingredients, ${experienceWords[(variation + 1) % experienceWords.length]} results`,
      `serving ${location} with ${experienceWords[(variation + 2) % experienceWords.length]} ${businessType}`,
      `your go-to spot for ${experienceWords[variation % experienceWords.length]} ${businessType}`,
      `${benefitPhrases[(variation + 4) % benefitPhrases.length]}`,
      `bringing ${experienceWords[(variation + 3) % experienceWords.length]} ${businessType} to ${location}`,
      `${location}'s most ${experienceWords[(variation + 4) % experienceWords.length]} ${businessType} experience`,
      `${experienceWords[(variation + 5) % experienceWords.length]} ${businessType} crafted for ${location}`,
      `where ${experienceWords[variation % experienceWords.length]} meets ${experienceWords[(variation + 2) % experienceWords.length]}`,
      `${location} deserves ${experienceWords[(variation + 1) % experienceWords.length]} ${businessType}`,
      `creating ${experienceWords[(variation + 3) % experienceWords.length]} moments in ${location}`,
      `${experienceWords[(variation + 4) % experienceWords.length]} ${businessType}, ${experienceWords[(variation + 5) % experienceWords.length]} service`,
      `your ${location} destination for ${experienceWords[variation % experienceWords.length]} ${businessType}`
    ];

    return {
      subheadline: marketingSubheadlines[variation],
      framework: 'benefit-focused',
      benefit: experienceWords[variation % experienceWords.length]
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
  businessIntelligence?: any
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
  console.log(`🎭 Generation ID: ${uniqueGenerationId} - AI will choose best marketing approach`);

  // DEBUG: Log what data we actually received
  console.log('📊 DEBUG - Data received for AI generation:');
  console.log('- Business Details:', JSON.stringify(businessDetails, null, 2));
  console.log('- Trending Data:', JSON.stringify(trendingData, null, 2));
  console.log('- Business Intelligence:', JSON.stringify(businessIntelligence, null, 2));

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
Create ALL COMPONENTS (headline, subheadline, caption) that are so unique and specific to ${businessName} in ${location} that they could NEVER be used for any other business. Use the actual business data, trending information, RSS feeds, local events, and business intelligence to create something genuinely original.

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

  const unifiedPrompt = `You are a conversion-focused social media marketer creating a COMPLETE UNIFIED CAMPAIGN for ${businessName} that will make people in ${location} take immediate action. You must create ALL components (headline, subheadline, caption, CTA, design direction) that work together as ONE cohesive message.

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
- Location: ${location}
- Services/Products: ${businessDetails.services || businessDetails.expertise || 'quality offerings'}
- Target Market: Local ${location} residents and visitors
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
- Connect ${businessName} to trending topics or local events naturally
- Use specific business services/features from business details
- Reference current market conditions or seasonal opportunities
- Make headlines feel current and timely, not generic
- Examples of RSS-integrated headlines:
  * "Local Food Festival Winner" (if there's a food event)
  * "Beat Holiday Rush Stress" (if trending topic is holiday stress)
  * "New Year Fitness Goals" (if trending topic is resolutions)
  * "Supply Chain Solution Found" (if news mentions supply issues)

SUBHEADLINE GENERATION REQUIREMENTS (Build on headline with business intelligence):
- SUBHEADLINES must expand on headline using specific business details
- Reference actual services, products, or unique features offered
- Use business intelligence data (industry trends, local opportunities)
- Connect to target audience pain points and solutions
- Support headline's promise with concrete business benefits
- Examples of business-integrated subheadlines:
  * "Our 15-year catering experience serves 200+ events monthly"
  * "Same-day delivery available for all ${location} residents"
  * "Certified organic ingredients sourced from local farms"
  * "24/7 emergency service with 30-minute response time"

SPECIFIC BUSINESS DETAILS:
- Business Name: ${businessName}
- Services/Products: ${businessDetails.services || businessDetails.expertise || businessDetails.specialties || 'quality offerings'}
- Unique Features: ${businessDetails.uniqueFeatures || businessDetails.keyFeatures || 'exceptional service'}
- Target Audience: ${businessDetails.targetAudience || `local ${location} residents and visitors`}
- Business Hours: ${businessDetails.hours || 'regular business hours'}
- Special Offers: ${businessDetails.offers || businessDetails.promotions || 'quality service at competitive prices'}

LOCAL MARKET INTELLIGENCE:
- What locals love: ${industry.uniqueValue.slice(0, 2).join(', ')}
- Market opportunities: ${industry.opportunities.slice(0, 2).join(', ')}
- Industry trends: ${industry.trends.slice(0, 2).join(', ')}
- Local challenges: ${industry.challenges.slice(0, 2).join(', ')}

PLATFORM STRATEGY FOR ${platform.toUpperCase()}:
${getPlatformRequirements(platform)}

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
    console.log('🤖 Attempting UNIFIED content generation with Gemini...');
    console.log('📝 Prompt preview:', unifiedPrompt.substring(0, 200) + '...');

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

    console.log('✅ AI Response received (FULL):', response);

    // Parse all unified components
    const unifiedThemeMatch = response.match(/UNIFIED_THEME:\s*(.*?)(?=KEY_MESSAGE:|$)/s);
    const keyMessageMatch = response.match(/KEY_MESSAGE:\s*(.*?)(?=HEADLINE:|$)/s);
    const headlineMatch = response.match(/HEADLINE:\s*(.*?)(?=SUBHEADLINE:|$)/s);
    const subheadlineMatch = response.match(/SUBHEADLINE:\s*(.*?)(?=CAPTION:|$)/s);
    const captionMatch = response.match(/CAPTION:\s*(.*?)(?=CTA:|$)/s);
    const ctaMatch = response.match(/CTA:\s*(.*?)(?=DESIGN_DIRECTION:|$)/s);
    const designMatch = response.match(/DESIGN_DIRECTION:\s*(.*?)$/s);

    console.log('🔍 Parsing Results:');
    console.log('- Theme:', unifiedThemeMatch?.[1]?.trim());
    console.log('- Key Message:', keyMessageMatch?.[1]?.trim());
    console.log('- Headline:', headlineMatch?.[1]?.trim());
    console.log('- Subheadline:', subheadlineMatch?.[1]?.trim());
    console.log('- Caption:', captionMatch?.[1]?.trim()?.substring(0, 100) + '...');
    console.log('- CTA:', ctaMatch?.[1]?.trim());
    console.log('- Design:', designMatch?.[1]?.trim());

    // Extract all components and apply word repetition removal to each
    const unifiedTheme = removeWordRepetitions(unifiedThemeMatch?.[1]?.trim() || 'Quality local business');
    const keyMessage = removeWordRepetitions(keyMessageMatch?.[1]?.trim() || 'Exceptional service for local community');
    const headline = removeWordRepetitions(headlineMatch?.[1]?.trim() || `${businessName} ${location}`);
    const subheadline = removeWordRepetitions(subheadlineMatch?.[1]?.trim() || `Quality ${businessType} in ${location}`);
    const caption = removeWordRepetitions(captionMatch?.[1]?.trim() || response);

    // 🎯 GENERATE DYNAMIC CTA using AI and business intelligence
    console.log('🎯 Generating dynamic CTA with business intelligence...');
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
    console.log(`✅ Generated CTA: "${callToAction}" (Style: ${ctaStrategy.style})`);

    const designDirection = removeWordRepetitions(designMatch?.[1]?.trim() || 'Clean, professional design with local elements');

    // Generate dynamic engagement hooks
    const engagementHooks = generateDynamicEngagementHooks(businessType, location, industry);

    // 🔥 GENERATE VIRAL HASHTAGS using trending data
    console.log('🔥 Generating viral hashtags with trending data...');
    const viralHashtags = await viralHashtagEngine.generateViralHashtags(
      businessType,
      businessName,
      location,
      platform,
      businessDetails.services || businessDetails.expertise,
      businessDetails.targetAudience
    );

    console.log(`✅ Generated ${viralHashtags.total.length} viral hashtags: ${viralHashtags.total.slice(0, 5).join(' ')}`);

    return {
      headline,
      subheadline,
      caption,
      callToAction,
      engagementHooks,
      designDirection: removeWordRepetitions(designMatch?.[1]?.trim() || `Clean, professional design with local elements. IMPORTANT: Include the CTA "${callToAction}" as prominent text overlay on the design - make it bold, readable, and visually striking like "PAYA: YOUR FUTURE, NOW!" style.`),
      unifiedTheme,
      keyMessage,
      hashtags: viralHashtags.total, // Add viral hashtags to response
      hashtagStrategy: viralHashtags, // Include full strategy for analysis
      ctaStrategy: ctaStrategy, // Include CTA strategy for analysis
      imageText: callToAction // Pass CTA as imageText for design integration
    };
  } catch (error) {
    console.error('❌ AI caption generation failed, attempting retry with simplified prompt:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });

    // RETRY WITH SIMPLIFIED AI PROMPT - No Static Fallback
    try {
      console.log('🔄 Retrying with simplified AI prompt...');

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

      console.log('✅ Retry successful:', retryResponse.substring(0, 100) + '...');

      // Parse the retry response
      const retryCaptionMatch = retryResponse.match(/CAPTION:\s*(.*?)(?=CTA:|$)/s);
      const retryCtaMatch = retryResponse.match(/CTA:\s*(.*?)$/s);

      const retryCaption = removeWordRepetitions(retryCaptionMatch ? retryCaptionMatch[1].trim() : retryResponse);
      const retryCallToAction = removeWordRepetitions(retryCtaMatch ? retryCtaMatch[1].trim() : generateFallbackCTA(platform));

      // Generate viral hashtags for retry
      const retryHashtags = await viralHashtagEngine.generateViralHashtags(
        businessType, businessName, location, platform,
        businessDetails.services || businessDetails.expertise,
        businessDetails.targetAudience
      );

      return {
        caption: retryCaption,
        engagementHooks: generateDynamicEngagementHooks(businessType, location, industry),
        callToAction: retryCallToAction,
        hashtags: retryHashtags.total,
        hashtagStrategy: retryHashtags
      };

    } catch (retryError) {
      console.error('❌ AI retry also failed, using emergency AI generation:', retryError);

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

        console.log('🚨 Emergency AI generation successful');

        // Generate viral hashtags for emergency
        const emergencyHashtags = await viralHashtagEngine.generateViralHashtags(
          businessType, businessName, location, platform,
          businessDetails.services || businessDetails.expertise,
          businessDetails.targetAudience
        );

        return {
          caption: emergencyResponse,
          engagementHooks: generateDynamicEngagementHooks(businessType, location, industry),
          callToAction: removeWordRepetitions(generateFallbackCTA(platform)),
          hashtags: emergencyHashtags.total,
          hashtagStrategy: emergencyHashtags
        };

      } catch (emergencyError) {
        console.error('❌ All AI generation attempts failed:', emergencyError);

        // LAST RESORT: Generate with current timestamp for uniqueness
        const timestamp = Date.now();
        const uniqueId = Math.floor(Math.random() * 10000);

        // Generate viral hashtags for final fallback
        const fallbackHashtags = await viralHashtagEngine.generateViralHashtags(
          businessType, businessName, location, platform,
          businessDetails.services || businessDetails.expertise,
          businessDetails.targetAudience
        );

        return {
          caption: removeWordRepetitions(`${businessName} in ${location} - where quality meets innovation. Every visit is a new experience that locals can't stop talking about. Join the community that knows great ${businessType}! #${timestamp}`),
          engagementHooks: generateDynamicEngagementHooks(businessType, location, industry),
          callToAction: removeWordRepetitions(generateFallbackCTA(platform)),
          hashtags: fallbackHashtags.total,
          hashtagStrategy: fallbackHashtags
        };
      }
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
  return generateBusinessSpecificHeadline(businessType, businessName, location, context, 'Instagram', 'awareness');
}

export function generateCreativeSubheadline(
  businessType: string,
  services: string,
  location: string,
  tone: string
): { subheadline: string; framework: string } {
  return generateBusinessSpecificSubheadline(businessType, 'Business', location, {}, 'Headline', 'awareness');
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
  businessIntelligence?: any
): Promise<{ caption: string; engagementHooks: string[]; callToAction: string }> {

  // Use the unified system but return only caption components
  const unifiedContent = await generateUnifiedContent(
    businessType, businessName, location, businessDetails, platform, contentGoal, trendingData, businessIntelligence
  );

  return {
    caption: unifiedContent.caption,
    engagementHooks: unifiedContent.engagementHooks,
    callToAction: unifiedContent.callToAction
  };
}
