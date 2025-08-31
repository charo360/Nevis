/**
 * Revo 1.0 - Enhanced AI Service with Gemini 2.5 Flash Image Preview
 * Upgraded from Gemini 2.0 to provide enhanced quality and perfect text rendering
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BrandProfile } from '@/lib/types';
import { revo10Config, revo10Prompts } from './models/versions/revo-1.0/config';
import {
  generateCreativeHeadline,
  generateCreativeSubheadline,
  enhanceDesignCreativity,
  generateCreativeCTA,
  analyzeBusinessContext,
  AntiRepetitionSystem,
  CREATIVE_PROMPT_SYSTEM,
  CONTENT_VARIATION_ENGINE
} from './creative-enhancement';

// Advanced features integration (simplified for now)
// TODO: Import advanced features from Revo 1.5 when available

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

// Advanced real-time context gathering for Revo 1.0 (simplified version)
async function gatherRealTimeContext(businessType: string, location: string, platform: string) {
  console.log('🌐 Revo 1.0: Gathering enhanced context data...');

  const context: any = {
    trends: [],
    weather: null,
    events: [],
    news: [],
    timeContext: {
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      season: getSeason(),
      timeOfDay: getTimeOfDay()
    }
  };

  try {
    // Generate contextual trends based on business type and location
    console.log('📈 Generating contextual trends...');
    context.trends = generateContextualTrends(businessType, location);
    console.log(`✅ Generated ${context.trends.length} contextual trends`);

    // Generate weather-appropriate content suggestions
    console.log('🌤️ Generating weather context...');
    context.weather = generateWeatherContext(location);
    console.log(`✅ Weather context: ${context.weather.condition}`);

    // Generate local business opportunities
    console.log('🎪 Generating local opportunities...');
    context.events = generateLocalOpportunities(businessType, location);
    console.log(`✅ Found ${context.events.length} business opportunities`);

    console.log('✅ Enhanced context gathered successfully');
    return context;

  } catch (error) {
    console.error('❌ Error gathering enhanced context:', error);
    return context; // Return partial context
  }
}

// Advanced design enhancement functions
function shouldIncludePeopleInDesign(businessType: string, location: string, visualStyle: string): boolean {
  const peopleBusinessTypes = [
    'restaurant', 'fitness', 'healthcare', 'education', 'retail', 'hospitality',
    'beauty', 'wellness', 'consulting', 'coaching', 'real estate', 'finance',
    'technology', 'marketing', 'events', 'photography', 'fashion'
  ];

  return peopleBusinessTypes.some(type =>
    businessType.toLowerCase().includes(type) ||
    visualStyle === 'lifestyle' ||
    visualStyle === 'authentic'
  );
}

function getLocalCulturalContext(location: string): string {
  const culturalContexts: Record<string, string> = {
    'kenya': 'Kenyan culture with vibrant colors, traditional patterns, modern African aesthetics, diverse ethnic representation (Kikuyu, Luo, Luhya, Kalenjin), urban Nairobi style mixed with traditional elements',
    'nigeria': 'Nigerian culture with bold Ankara patterns, diverse ethnic representation, modern Lagos urban style, traditional and contemporary fusion',
    'south africa': 'South African rainbow nation diversity, modern Cape Town/Johannesburg aesthetics, traditional and contemporary blend',
    'ghana': 'Ghanaian Kente patterns, warm earth tones, modern Accra style, traditional craftsmanship meets contemporary design',
    'uganda': 'Ugandan cultural diversity, vibrant textiles, modern Kampala urban style, traditional meets modern aesthetics',
    'tanzania': 'Tanzanian Maasai influences, Swahili coastal culture, modern Dar es Salaam style, traditional patterns with contemporary flair',
    'default': 'Diverse, inclusive representation with modern professional aesthetics, cultural sensitivity, and authentic human connections'
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
**ADVANCED PEOPLE INTEGRATION:**
- Include diverse, authentic people with PERFECT FACIAL FEATURES
- Complete faces, symmetrical features, natural expressions, professional poses
- Faces fully visible, well-lit, anatomically correct with no deformations
- Cultural Context: ${culturalContext}
- Show people in varied, engaging settings:
  * Professional environments (modern offices, studios, workshops)
  * Lifestyle settings (contemporary homes, trendy cafes, outdoor spaces)
  * Industry-specific contexts (${businessType} environments)
  * Cultural celebrations and modern community gatherings
  * Urban settings (co-working spaces, tech hubs, modern city life)
  * Traditional meets modern (cultural heritage with contemporary life)
- Ensure representation reflects local demographics and cultural values
- Show real people in natural, engaging situations that vary by design
- People should be actively engaged with the business/service context
- Use authentic expressions of joy, confidence, success, and community
- Include intergenerational representation when appropriate
- Show modern African/local fashion and styling
- Ensure people are central to the story, not just decorative elements`;
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

function generateLocalOpportunities(businessType: string, location: string): any[] {
  const opportunities = [
    { name: `${location} Business Expo`, venue: 'Local Convention Center', relevance: 'networking' },
    { name: `${businessType} Innovation Summit`, venue: 'Business District', relevance: 'industry' },
    { name: 'Local Entrepreneur Meetup', venue: 'Community Center', relevance: 'community' }
  ];
  return opportunities.slice(0, 2);
}

// Get API keys (supporting both server-side and client-side)
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error("❌ No Google AI API key found for Revo 1.0");
  console.error("Available env vars:", {
    server: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
      GOOGLE_GENAI_API_KEY: !!process.env.GOOGLE_GENAI_API_KEY
    },
    client: {
      NEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      NEXT_PUBLIC_GOOGLE_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
      NEXT_PUBLIC_GOOGLE_GENAI_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY
    }
  });
}

// Initialize Google GenAI client with Revo 1.0 configuration
const ai = new GoogleGenerativeAI(apiKey);

// Revo 1.0 uses Gemini 2.5 Flash Image Preview
const REVO_1_0_MODEL = 'gemini-2.5-flash-image-preview';

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
}) {
  try {
    console.log('🚀 Revo 1.0: Starting enhanced content generation with real-time context...');

    // Gather real-time context data
    const realTimeContext = await gatherRealTimeContext(input.businessType, input.location, input.platform);

    const model = ai.getGenerativeModel({
      model: REVO_1_0_MODEL,
      generationConfig: {
        temperature: revo10Config.promptSettings.temperature,
        topP: revo10Config.promptSettings.topP,
        topK: revo10Config.promptSettings.topK,
        maxOutputTokens: revo10Config.promptSettings.maxTokens,
      },
    });

    // Build the content generation prompt with enhanced brand context
    const contentPrompt = revo10Prompts.CONTENT_USER_PROMPT_TEMPLATE
      .replace('{businessName}', input.businessName)
      .replace('{businessType}', input.businessType)
      .replace('{platform}', input.platform)
      .replace('{writingTone}', input.writingTone)
      .replace('{location}', input.location)
      .replace('{primaryColor}', input.primaryColor || '#3B82F6')
      .replace('{visualStyle}', input.visualStyle || 'modern')
      .replace('{targetAudience}', input.targetAudience)
      .replace('{services}', input.services || '')
      .replace('{keyFeatures}', input.keyFeatures || '')
      .replace('{competitiveAdvantages}', input.competitiveAdvantages || '')
      .replace('{contentThemes}', input.contentThemes.join(', ') || 'general business content');

    console.log('📝 Revo 1.0: Generating content with enhanced AI capabilities...');

    // Generate enhanced caption using advanced copywriting techniques
    const enhancedCaptionPrompt = `You are an elite social media strategist and copywriting expert with deep expertise in the ${input.businessType} industry.
Your mission is to create scroll-stopping content that maximizes engagement, drives conversions, and builds authentic connections.

COMPREHENSIVE BUSINESS INTELLIGENCE:
- Business Name: ${input.businessName}
- Industry: ${input.businessType}
- Location: ${input.location}
- Brand Voice: ${input.writingTone}
- Visual Style: ${input.visualStyle || 'modern'}
- Primary Color: ${input.primaryColor || '#3B82F6'}
- Target Audience: ${input.targetAudience}
- Services Offered: ${input.services || 'Professional services'}
- Key Features: ${input.keyFeatures || 'Quality and reliability'}
- Competitive Advantages: ${input.competitiveAdvantages || 'Unique value proposition'}
- Content Themes: ${input.contentThemes.join(', ') || 'Business excellence'}
- Platform: ${input.platform}
- Day: ${input.dayOfWeek}
- Date: ${input.currentDate}

BRAND IDENTITY INTEGRATION:
- Use business name "${input.businessName}" naturally in content
- Reflect ${input.businessType} industry expertise
- Incorporate ${input.location} local relevance
- Match ${input.writingTone} brand voice consistently
- Highlight unique services and competitive advantages
- Appeal to ${input.targetAudience} specifically

ADVANCED COPYWRITING FRAMEWORKS TO USE:
1. **AIDA Framework**: Attention → Interest → Desire → Action
2. **PAS Framework**: Problem → Agitation → Solution
3. **Storytelling Elements**: Character, conflict, resolution
4. **Social Proof Integration**: Success stories, testimonials

PSYCHOLOGICAL TRIGGERS TO IMPLEMENT:
✅ **Curiosity Gaps**: Intriguing questions that demand answers
✅ **Emotional Resonance**: Joy, surprise, inspiration, empathy
✅ **Authority**: Expert insights, industry knowledge
✅ **Reciprocity**: Valuable tips, free insights
✅ **Social Proof**: Customer success, popularity indicators

PLATFORM-SPECIFIC OPTIMIZATION FOR ${input.platform.toUpperCase()}:
${input.platform === 'Instagram' ? `
- Visual storytelling, lifestyle integration, authentic moments
- Length: 150-300 words, emoji-rich, story-driven
- Include 2-3 engagement questions
- End with compelling call-to-action` : ''}
${input.platform === 'LinkedIn' ? `
- Professional insights, industry expertise, thought leadership
- Length: 100-200 words, professional tone, value-driven
- Focus on business solutions and career growth
- Minimal but strategic emoji usage` : ''}
${input.platform === 'Facebook' ? `
- Community building, detailed storytelling, discussion starters
- Length: 100-250 words, community-focused
- Local community engagement, family-friendly content
- Encourage sharing and group discussions` : ''}
${input.platform === 'Twitter' ? `
- Trending topics, quick insights, conversation starters
- Length: 50-150 words, concise, witty commentary
- Real-time engagement, thread potential
- Sharp, clever, conversation-starting tone` : ''}

ENGAGEMENT OPTIMIZATION:
🎯 **Hook Techniques**: Surprising statistics, personal anecdotes, thought-provoking questions, bold predictions
🎯 **Interaction Drivers**: "Comment below with...", "Tag someone who...", "Share if you agree...", "What's your experience with..."
🎯 **Call-to-Action Mastery**: Create urgency without being pushy, offer clear value, use action-oriented language

CONTENT REQUIREMENTS:
- Start with a powerful hook using psychological triggers
- Apply a copywriting framework (AIDA, PAS, or storytelling)
- Include 2-3 engagement questions throughout
- Incorporate relevant emojis strategically (${input.platform === 'Instagram' ? '8-12' : input.platform === 'LinkedIn' ? '2-4' : '4-8'} emojis)
- End with a compelling, specific call-to-action
- Make it location-relevant for ${input.location} when appropriate
- NO HASHTAGS in caption (provided separately)
- Create unique, varied content - avoid generic templates

VARIETY REQUIREMENTS:
- Use different hook styles each time (statistics, questions, stories, bold statements)
- Vary the copywriting framework (rotate between AIDA, PAS, storytelling)
- Change the emotional tone (inspirational, educational, entertaining, motivational)
- Alternate engagement techniques (questions, polls, challenges, tips)
- Mix content angles (behind-the-scenes, customer focus, industry insights, local relevance)

REAL-TIME CONTEXT INTEGRATION:
${realTimeContext.weather ? `
🌤️ CURRENT WEATHER: ${realTimeContext.weather.temperature}°C, ${realTimeContext.weather.condition}
- Business Impact: ${realTimeContext.weather.business_impact}
- Content Opportunities: ${realTimeContext.weather.content_opportunities}` : ''}

${realTimeContext.trends.length > 0 ? `
📈 TRENDING TOPICS:
${realTimeContext.trends.map((trend: any, i: number) => `${i + 1}. ${trend.topic} (${trend.category})`).join('\n')}` : ''}

${realTimeContext.events.length > 0 ? `
🎪 LOCAL EVENTS:
${realTimeContext.events.map((event: any, i: number) => `${i + 1}. ${event.name} - ${event.venue}`).join('\n')}` : ''}

${realTimeContext.news.length > 0 ? `
📰 RELEVANT NEWS:
${realTimeContext.news.map((news: any, i: number) => `${i + 1}. ${news.topic}`).join('\n')}` : ''}

CONTEXT INTEGRATION INSTRUCTIONS:
- Strategically reference weather when relevant to business (e.g., seasonal services, weather-dependent activities)
- Incorporate trending topics that align with business values and audience interests
- Mention local events when they create business opportunities or community engagement
- Use news trends to position business as current and relevant
- Only include context that adds genuine value - don't force irrelevant connections

RANDOMIZATION SEED: ${Date.now() % 1000} (Use this to ensure variety in approach)

IMPORTANT: Generate ONLY the actual social media caption content. Do NOT include any meta-text, explanations, or descriptions. Start directly with the engaging hook and write as if you are posting for the business.

Example format:
🚀 Did you know 73% of Kenyan businesses are still using outdated payment systems?

[Continue with engaging content...]

What's your biggest financial challenge? Drop a comment below! 👇

NOW GENERATE THE ACTUAL CAPTION WITH SMART CONTEXT INTEGRATION:`;

    const result = await model.generateContent([
      revo10Prompts.CONTENT_SYSTEM_PROMPT,
      enhancedCaptionPrompt
    ]);

    const response = await result.response;
    const content = response.text();

    console.log('📝 Enhanced caption generated:');
    console.log(`- Length: ${content.length} characters`);
    console.log(`- Platform: ${input.platform}`);
    console.log(`- Tone: ${input.writingTone}`);
    console.log(`- Preview: ${content.substring(0, 100)}...`);

    // Generate strategic hashtags with different categories
    const hashtagPrompt = `Generate strategic hashtags for ${input.businessName} (${input.businessType}) in ${input.location} for ${input.platform}.

COMPREHENSIVE BUSINESS CONTEXT:
- Business Name: ${input.businessName}
- Industry: ${input.businessType}
- Location: ${input.location}
- Target Audience: ${input.targetAudience}
- Services Offered: ${input.services}
- Key Features: ${input.keyFeatures}
- Competitive Advantages: ${input.competitiveAdvantages}
- Content Themes: ${input.contentThemes.join(', ')}
- Brand Voice: ${input.writingTone}
- Visual Style: ${input.visualStyle}

HASHTAG STRATEGY:
Create 15 hashtags in these categories:
1. Brand/Business (2-3 hashtags): Company name, business type
2. Industry/Niche (3-4 hashtags): Specific to ${input.businessType}
3. Location (2-3 hashtags): ${input.location} and surrounding areas
4. Trending/Popular (2-3 hashtags): Current trending topics in the industry
5. Community/Engagement (2-3 hashtags): Encourage interaction
6. Long-tail (2-3 hashtags): Specific, less competitive phrases

REQUIREMENTS:
- Mix of high, medium, and low competition hashtags
- Include local hashtags for ${input.location}
- Relevant to ${input.platform} audience
- No spaces in hashtags
- Each hashtag on a new line starting with #
- Focus on discoverability and engagement

Generate exactly 15 hashtags:`;

    const hashtagResult = await model.generateContent(hashtagPrompt);
    const hashtagResponse = await hashtagResult.response;
    const hashtags = hashtagResponse.text()
      .split('\n')
      .filter(tag => tag.trim().startsWith('#'))
      .map(tag => tag.trim())
      .slice(0, 15);

    console.log('📱 Generated hashtag strategy:');
    console.log(`- Total hashtags: ${hashtags.length}`);
    console.log(`- Hashtags: ${hashtags.join(' ')}`);

    // Analyze hashtag categories for logging
    const brandHashtags = hashtags.filter(tag =>
      tag.toLowerCase().includes(input.businessName.toLowerCase().replace(/\s+/g, '')) ||
      tag.toLowerCase().includes(input.businessType.toLowerCase().replace(/\s+/g, ''))
    );
    const locationHashtags = hashtags.filter(tag =>
      tag.toLowerCase().includes(input.location.toLowerCase().replace(/\s+/g, ''))
    );

    console.log(`- Brand hashtags: ${brandHashtags.length}`);
    console.log(`- Location hashtags: ${locationHashtags.length}`);

    // 🎨 CREATIVE ENHANCEMENT: Generate creative, unique content components
    console.log('🎨 Revo 1.0: Applying creative enhancement system...');

    // Analyze business context for creative insights
    const businessContext = analyzeBusinessContext(
      input.businessType,
      input.businessName,
      input.location,
      input.services
    );

    // Generate unique variation to prevent repetition
    const uniqueVariation = AntiRepetitionSystem.generateUniqueVariation(
      input.businessType,
      input.platform,
      { businessName: input.businessName, location: input.location }
    );

    console.log('🎯 Creative variation applied:', uniqueVariation.signature);
    console.log('🧠 Business insights:', businessContext.creativePotential.slice(0, 2));

    // Generate creative headline using enhancement system
    const creativeHeadlineResult = generateCreativeHeadline(
      input.businessType,
      input.businessName,
      input.location,
      { platform: input.platform, variation: uniqueVariation, context: businessContext }
    );

    // Generate creative subheadline using enhancement system
    const creativeSubheadlineResult = generateCreativeSubheadline(
      input.businessType,
      input.services,
      input.location,
      creativeHeadlineResult.tone
    );

    // Generate creative CTA using enhancement system
    const creativeCTAResult = generateCreativeCTA(
      input.businessType,
      creativeHeadlineResult.tone,
      { platform: input.platform, businessContext }
    );

    // Extract creative components
    const headline = creativeHeadlineResult.headline;
    const subheadline = creativeSubheadlineResult.subheadline;
    const callToAction = creativeCTAResult.cta;

    console.log('✨ Creative components generated:');
    console.log(`- Headline Style: ${creativeHeadlineResult.style}`);
    console.log(`- Emotional Tone: ${creativeHeadlineResult.tone}`);
    console.log(`- Subheadline Framework: ${creativeSubheadlineResult.framework}`);
    console.log(`- CTA Urgency: ${creativeCTAResult.urgency}`);
    console.log(`- Creative Elements: ${businessContext.creativePotential.slice(0, 2).join(', ')}`);

    // Fallback to generic only if creative generation fails
    const finalHeadline = headline || 'Your Business';
    const finalSubheadline = subheadline || '';
    const finalCallToAction = callToAction || '';

    console.log('📝 Creative content structure generated:');
    console.log('- Headline:', finalHeadline);
    console.log('- Subheadline:', finalSubheadline || '(none)');
    console.log('- CTA:', finalCallToAction || '(none)');

    console.log('✅ Revo 1.0: Enhanced creative content generated successfully with Gemini 2.5 Flash Image Preview');

    // Final content package summary
    console.log('📦 Complete creative content package:');
    console.log(`- Caption: ${content.length} chars`);
    console.log(`- Creative Headline: "${finalHeadline}"`);
    console.log(`- Creative Subheadline: "${finalSubheadline || 'None'}"`);
    console.log(`- Creative CTA: "${finalCallToAction || 'None'}"`);
    console.log(`- Hashtags: ${hashtags.length} strategic tags`);
    console.log(`- Platform: ${input.platform} optimized`);
    console.log(`- Creative Style: ${creativeHeadlineResult.style} with ${creativeHeadlineResult.tone} tone`);

    return {
      content: content.trim(),
      hashtags: hashtags,
      catchyWords: finalHeadline, // Use creative headline as catchy words for image
      subheadline: finalSubheadline,
      callToAction: finalCallToAction,
      headline: finalHeadline, // Add creative headline as separate field
      realTimeContext: realTimeContext, // Pass context to image generator
      creativeContext: { // Add creative context for image generation
        style: creativeHeadlineResult.style,
        tone: creativeHeadlineResult.tone,
        framework: creativeSubheadlineResult.framework,
        businessInsights: businessContext,
        variation: uniqueVariation
      },
      variants: [{
        platform: input.platform,
        aspectRatio: '1:1',
        imageUrl: '' // Will be generated separately
      }]
    };

  } catch (error) {
    console.error('❌ Revo 1.0: Content generation failed:', error);
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
    console.log('🎨 Revo 1.0: Starting design generation with Gemini 2.5 Flash Image Preview...');

    const model = ai.getGenerativeModel({
      model: REVO_1_0_MODEL,
      generationConfig: {
        temperature: revo10Config.promptSettings.temperature,
        topP: revo10Config.promptSettings.topP,
        topK: revo10Config.promptSettings.topK,
        maxOutputTokens: revo10Config.promptSettings.maxTokens,
      },
    });

    // Build the design generation prompt
    const designPrompt = revo10Prompts.DESIGN_USER_PROMPT_TEMPLATE
      .replace('{businessName}', input.businessName)
      .replace('{businessType}', input.businessType)
      .replace('{platform}', input.platform)
      .replace('{visualStyle}', input.visualStyle)
      .replace('{primaryColor}', input.primaryColor)
      .replace('{accentColor}', input.accentColor)
      .replace('{backgroundColor}', input.backgroundColor)
      .replace('{imageText}', input.imageText);

    console.log('🎨 Revo 1.0: Generating design with enhanced AI capabilities...');

    const result = await model.generateContent([
      revo10Prompts.DESIGN_SYSTEM_PROMPT,
      designPrompt
    ]);

    const response = await result.response;
    const design = response.text();

    console.log('✅ Revo 1.0: Design generated successfully with Gemini 2.5 Flash Image Preview');

    return {
      design: design.trim(),
      aspectRatio: '1:1',
      resolution: '2048x2048',
      quality: 'enhanced'
    };

  } catch (error) {
    console.error('❌ Revo 1.0: Design generation failed:', error);
    throw new Error(`Revo 1.0 design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
}) {
  try {
    console.log('🖼️ Revo 1.0: Starting enhanced creative image generation with Gemini 2.5 Flash Image Preview...');

    // 🎨 CREATIVE ENHANCEMENT: Apply creative design system
    let creativeDesignEnhancement = '';
    if (input.creativeContext) {
      console.log('🎨 Applying creative design enhancement system...');
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

      console.log('✨ Creative design enhancement applied:');
      console.log(`- Visual Style: ${designEnhancement.visualStyle}`);
      console.log(`- Creative Elements: ${designEnhancement.creativeElements.slice(0, 3).join(', ')}`);
      console.log(`- Emotional Tone: ${input.creativeContext.tone}`);
    }

    const model = ai.getGenerativeModel({
      model: REVO_1_0_MODEL,
      generationConfig: {
        temperature: revo10Config.promptSettings.temperature,
        topP: revo10Config.promptSettings.topP,
        topK: revo10Config.promptSettings.topK,
        maxOutputTokens: revo10Config.promptSettings.maxTokens,
      },
    });

    // Build advanced professional design prompt
    const brandInfo = input.location ? ` based in ${input.location}` : '';
    const colorScheme = `Primary: ${input.primaryColor} (60% dominant), Accent: ${input.accentColor || '#1E40AF'} (30% secondary), Background: ${input.backgroundColor || '#FFFFFF'} (10% highlights)`;
    const logoInstruction = input.logoDataUrl ?
      'Use the provided brand logo (do NOT create new logo - integrate existing one naturally)' :
      'Create professional design without logo overlay';

    // Prepare structured content display with hierarchy
    const contentStructure = [];
    if (input.headline) contentStructure.push(`PRIMARY (Largest, most prominent): "${input.headline}"`);
    if (input.subheadline) contentStructure.push(`SECONDARY (Medium, supporting): "${input.subheadline}"`);
    if (input.callToAction) contentStructure.push(`TERTIARY (Smaller, action-oriented): "${input.callToAction}"`);

    // Get advanced design features
    const businessDesignDNA = getBusinessDesignDNA(input.businessType);
    const platformOptimization = getPlatformOptimization(input.platform);
    const shouldIncludePeople = shouldIncludePeopleInDesign(input.businessType, input.location || 'Global', input.visualStyle);
    const peopleInstructions = shouldIncludePeople ? getAdvancedPeopleInstructions(input.businessType, input.location || 'Global') : '';
    const culturalContext = getLocalCulturalContext(input.location || 'Global');

    console.log('👥 People Integration:', shouldIncludePeople ? 'Enabled' : 'Disabled');
    console.log('🌍 Cultural Context:', culturalContext.substring(0, 100) + '...');

    // Generate design variation seed for unique designs
    const designSeed = Date.now() % 10000;
    const designVariations = getDesignVariations(designSeed);
    console.log('🎲 Design Variation Selected:', designVariations.style);

    const imagePrompt = `Create a professional-grade 2048x2048 social media design that surpasses Canva quality for ${input.businessName} (${input.businessType})${brandInfo}.

${creativeDesignEnhancement}

BUSINESS CONTEXT:
- Business: ${input.businessName}
- Industry: ${input.businessType}
- Platform: ${input.platform}
- Visual Style: ${input.visualStyle}
- Location: ${input.location || 'Global'}

BRAND IDENTITY SYSTEM:
- Color Scheme: ${colorScheme}
- Logo Integration: ${logoInstruction}
- Brand Personality: Professional, modern, trustworthy

STRUCTURED CONTENT HIERARCHY:
${contentStructure.length > 0 ? contentStructure.join('\n') : `- PRIMARY MESSAGE: ${input.imageText}`}

ADVANCED COMPOSITION REQUIREMENTS:
- Apply Rule of Thirds: Position key elements along grid intersections
- Create strong focal point with primary message as center of attention
- Use sophisticated asymmetrical balance for modern appeal
- Implement clear visual hierarchy: ${input.headline || 'Headline'} → ${input.subheadline || 'Supporting text'} → ${input.callToAction || 'Call-to-action'}
- Strategic negative space for premium, uncluttered feel
- Leading lines and visual flow to guide eye movement

PLATFORM-SPECIFIC OPTIMIZATION:
${platformOptimization}

BUSINESS TYPE DESIGN DNA:
${businessDesignDNA}

TYPOGRAPHY EXCELLENCE:
- Primary headline: Bold, attention-grabbing, high contrast against background
- Secondary text: Supporting, readable, complementary to headline
- Ensure 4.5:1 contrast ratio minimum for accessibility
- Professional font pairing (maximum 2-3 font families)
- Proper letter spacing, line height, and alignment
- Scale typography appropriately for mobile viewing

COLOR IMPLEMENTATION STRATEGY:
- Dominant color (${input.primaryColor}): 60% usage for backgrounds, main elements
- Secondary color (${input.accentColor || '#1E40AF'}): 30% for supporting elements, borders
- Accent color (${input.backgroundColor || '#FFFFFF'}): 10% for highlights, details
- Apply color psychology appropriate for ${input.businessType} industry
- Ensure sufficient contrast between all text and background elements

MODERN DESIGN ELEMENTS:
- Subtle gradients and depth effects for dimensionality
- Clean geometric shapes with consistent border radius
- Professional drop shadows and lighting effects
- Premium visual texture and sophisticated finish
- Consistent spacing and alignment throughout
- Modern minimalist approach with purposeful elements

${shouldIncludePeople ? peopleInstructions : ''}

CULTURAL & LOCAL INTEGRATION:
- Cultural Context: ${culturalContext}
- Incorporate local aesthetic preferences and visual language
- Use culturally appropriate colors, patterns, and design elements
- Ensure authentic representation of local community and values
- Blend traditional elements with modern design sensibilities
- Show contemporary local lifestyle and business culture
- Use authentic local fashion, architecture, and environmental elements

QUALITY STANDARDS:
- Professional agency-level design quality that surpasses Canva
- Superior visual storytelling with authentic human connections
- Print-ready resolution and crystal-clear clarity
- Perfect text rendering with no pixelation or artifacts
- Sophisticated visual appeal that commands attention and drives engagement
- Commercial-grade finish suitable for professional marketing use
- Design that converts viewers into customers through emotional connection
- Authentic representation that builds trust and relatability
- Cultural sensitivity and local relevance that resonates with target audience
- Premium aesthetic that positions the brand as industry-leading
- Visual hierarchy that guides the eye and communicates value proposition clearly

DESIGN VARIATION & UNIQUENESS:
**SPECIFIC DESIGN STYLE: ${designVariations.style}**
- Layout Approach: ${designVariations.layout}
- Composition Style: ${designVariations.composition}
- Visual Mood: ${designVariations.mood}
- Key Elements: ${designVariations.elements}
- Create a completely unique design that stands out from typical social media posts
- Avoid repetitive layouts, compositions, or visual treatments
- Use creative angles, perspectives, and visual storytelling techniques
- Ensure each design feels fresh, original, and professionally crafted
- Incorporate unexpected visual elements that enhance the message
- NEVER repeat the same visual concept, layout, or composition from previous generations
- Generate completely different visual approaches each time

REAL-TIME CONTEXT INTEGRATION:
${input.realTimeContext?.weather ? `
🌤️ WEATHER CONTEXT: ${input.realTimeContext.weather.temperature}°C, ${input.realTimeContext.weather.condition}
- Visual Mood: Adapt colors and imagery to reflect current weather
- Seasonal Elements: Include weather-appropriate visual cues when relevant` : ''}

${input.realTimeContext?.trends?.length > 0 ? `
📈 TRENDING VISUAL THEMES:
${input.realTimeContext.trends.slice(0, 3).map((trend: any, i: number) => `${i + 1}. ${trend.topic} - Consider visual elements that align with this trend`).join('\n')}` : ''}

${input.realTimeContext?.events?.length > 0 ? `
🎪 LOCAL EVENT INSPIRATION:
${input.realTimeContext.events.slice(0, 2).map((event: any, i: number) => `${i + 1}. ${event.name} - Use event energy/theme for visual inspiration`).join('\n')}` : ''}

CONTEXT-AWARE DESIGN INSTRUCTIONS:
- Incorporate weather mood into color temperature and visual atmosphere
- Reference trending topics through subtle visual elements or color choices
- Use local event energy to inform design dynamism and visual style
- Ensure context integration feels natural and enhances the core message

TECHNICAL SPECIFICATIONS:
- Resolution: 2048x2048 pixels (high-definition)
- Aspect ratio: 1:1 (perfect square)
- Color space: sRGB for digital display
- Text readability: Optimized for mobile viewing
- File quality: Maximum clarity and sharpness
- Use contrasting colors for text readability
- Create visual separation between different text elements
- Professional typography that matches the brand personality

DESIGN REQUIREMENTS:
- Create depth and visual interest with gradients or subtle patterns
- IMPORTANT: If a logo is provided as an image, use that exact logo - do not create, modify, or redesign it
- Position the logo appropriately within the design layout
- Balance text elements with visual design elements
- Ensure the overall composition is visually appealing and professional`;

    console.log('🎨 Brand-aware prompt created with colors:', colorScheme);

    console.log('🖼️ Revo 1.0: Generating image with enhanced creative AI capabilities...');
    console.log('🎨 Advanced Creative Features:');
    console.log(`  👥 People Integration: ${shouldIncludePeople ? 'Enabled' : 'Disabled'}`);
    console.log(`  🌍 Cultural Context: ${input.location || 'Global'}`);
    console.log(`  🎭 Visual Style: ${input.visualStyle}`);
    console.log(`  🏢 Business DNA: ${input.businessType} optimized`);
    console.log(`  🎲 Design Variation: ${designVariations.style} (Seed: ${designSeed})`);
    console.log(`  ✨ Creative Enhancement: ${input.creativeContext ? 'ACTIVE' : 'Standard'}`);
    if (input.creativeContext) {
      console.log(`  🎨 Creative Style: ${input.creativeContext.style} with ${input.creativeContext.tone} tone`);
      console.log(`  🧠 Creative Framework: ${input.creativeContext.framework}`);
    }

    // Prepare the generation request with logo if available
    const generationParts = [
      'You are an expert graphic designer using Gemini 2.5 Flash Image Preview. Create professional, high-quality social media images with perfect text rendering and 2048x2048 resolution.',
      imagePrompt
    ];

    // If logo is provided, include it in the generation
    if (input.logoDataUrl) {
      console.log('🏢 Including brand logo in image generation...');

      // Extract the base64 data and mime type from the data URL
      const logoMatch = input.logoDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (logoMatch) {
        const [, mimeType, base64Data] = logoMatch;

        generationParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });

        // Update the prompt to reference the provided logo
        const logoPrompt = `\n\nIMPORTANT: Use the provided logo image above in your design. Integrate it naturally into the layout - do not create a new logo. The logo should be prominently displayed but not overwhelming the design.`;
        generationParts[1] = imagePrompt + logoPrompt;
      } else {
        console.log('⚠️ Invalid logo data URL format, proceeding without logo');
      }
    }

    const result = await model.generateContent(generationParts);

    const response = await result.response;

    // Extract image data from Gemini response
    const parts = response.candidates?.[0]?.content?.parts || [];
    let imageUrl = '';

    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        imageUrl = `data:${mimeType};base64,${imageData}`;
        console.log('🖼️ Revo 1.0: Image data extracted successfully');
        break;
      }
    }

    if (!imageUrl) {
      // Fallback: try to get text response if no image data
      const textResponse = response.text();
      console.log('⚠️ Revo 1.0: No image data found, got text response instead');
      throw new Error('No image data generated by Gemini 2.5 Flash Image Preview');
    }

    console.log('✅ Revo 1.0: Image generated successfully with Gemini 2.5 Flash Image Preview');

    return {
      imageUrl: imageUrl,
      aspectRatio: '1:1',
      resolution: '2048x2048',
      quality: 'enhanced'
    };

  } catch (error) {
    console.error('❌ Revo 1.0: Image generation failed:', error);
    throw new Error(`Revo 1.0 image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Health check for Revo 1.0 service
 */
export async function checkRevo10Health() {
  try {
    const model = ai.getGenerativeModel({ model: REVO_1_0_MODEL });
    const result = await model.generateContent('Hello');
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
    aiService: 'gemini-2.5-flash-image-preview',
    capabilities: [
      'Enhanced content generation',
      'High-resolution image support (2048x2048)',
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

