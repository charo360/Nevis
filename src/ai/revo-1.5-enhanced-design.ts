/**
 * Revo 1.5 Enhanced Design Service
 * Two-step process: Gemini 2.5 Flash for design planning + Gemini 2.5 Flash Image Preview for final generation
 */

import { generateText, generateMultimodal, GEMINI_2_5_MODELS } from './google-ai-direct';
import { BrandProfile } from '@/lib/types';
import OpenAI from 'openai';
import { TrendingHashtagsService } from '@/services/trending-hashtags-service';
import { RegionalSocialTrendsService } from '@/services/regional-social-trends-service';
import type { ScheduledService } from '@/services/calendar-service';

import { ensureExactDimensions } from './utils/image-dimensions';

// OpenAI client instance
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Helper function to convert logo URL to base64 data URL for AI models (matching Revo 1.0)
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // If it's a Supabase Storage URL, fetch and convert to base64
  if (logoUrl.startsWith('http')) {
    try {
      console.log('🔄 [Revo 1.5] Converting logo URL to base64 for AI generation:', logoUrl.substring(0, 50) + '...');

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ [Revo 1.5] Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log('✅ [Revo 1.5] Logo converted to base64 successfully (' + buffer.byteLength + ' bytes)');
      return dataUrl;
    } catch (error) {
      console.error('❌ [Revo 1.5] Error converting logo URL to base64:', error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Analyze business to generate intelligent content strategy
 */
async function analyzeBusinessForContentStrategy(
  businessType: string,
  businessName: string,
  brandProfile: BrandProfile,
  platform: string,
  trendingData: any,
  useLocalLanguage: boolean = false
): Promise<{
  contentApproach: string;
  keyMessages: string[];
  targetPainPoints: string[];
  uniqueValueProps: string[];
  emotionalTriggers: string[];
  contentTone: string;
  localInsights: string[];
}> {
  try {
    console.log('🧠 [Revo 1.5] Analyzing business for intelligent content strategy:', {
      businessType,
      businessName,
      location: brandProfile.location
    });

    // Strategic location mention in business analysis - only include sometimes
    const shouldMentionLocationInAnalysis = Math.random() < 0.5; // 50% chance to mention location
    const locationTextForAnalysis = shouldMentionLocationInAnalysis && brandProfile.location
      ? `- Location: ${brandProfile.location}`
      : '';

    const analysisPrompt = `Analyze this ${businessType} business and create a unique content strategy:

BUSINESS CONTEXT:
- Name: ${businessName}
- Type: ${businessType}
${locationTextForAnalysis}
- Target Audience: ${brandProfile.targetAudience || 'General audience'}
- Platform: ${platform}
- Services: ${brandProfile.services || 'Business services'}
- Use Local Language: ${useLocalLanguage ? 'Yes - mix English with local language elements' : 'No - English only'}

CURRENT TRENDS & EVENTS:
${trendingData.currentEvents.length > 0 ? `- Current Events: ${trendingData.currentEvents.join(', ')}` : ''}
${trendingData.businessTrends.length > 0 ? `- Business Trends: ${trendingData.businessTrends.join(', ')}` : ''}
${trendingData.socialBuzz.length > 0 ? `- Social Buzz: ${trendingData.socialBuzz.join(', ')}` : ''}

ANALYZE AND PROVIDE:
1. Content Approach: What unique angle should we take? (e.g., "problem-solution", "benefit-driven", "storytelling", "educational", "community-focused", "innovation-highlight", "trust-building", "convenience-emphasis", "growth-oriented", "security-focused", "accessibility-focused", "local-cultural", "future-forward", "challenge-overcome", "success-stories", "expertise-demonstration")
2. Key Messages: 3-5 core messages this business should communicate
3. Target Pain Points: What problems does this business solve for customers?
4. Unique Value Props: What makes this business different and valuable?
5. Emotional Triggers: What emotions should the content evoke? (trust, excitement, security, growth, convenience, community, innovation, etc.)
6. Content Tone: What tone works best? (professional, friendly, authoritative, approachable, innovative, trustworthy, etc.)
7. Local Insights: What local/cultural elements should be considered?

${useLocalLanguage ? `
LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${brandProfile.location || 'the location'}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing

HEADLINE & SUBHEADLINE LOCAL LANGUAGE GUIDANCE:
- Add contextually appropriate local greetings to headlines based on business type
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
- Keep content in English for universal accessibility`}

Be specific to THIS business, not generic. Think like a marketing expert who deeply understands this industry and location.

Format as JSON:
{
  "contentApproach": "specific approach for this business",
  "keyMessages": ["message1", "message2", "message3"],
  "targetPainPoints": ["pain1", "pain2", "pain3"],
  "uniqueValueProps": ["value1", "value2", "value3"],
  "emotionalTriggers": ["emotion1", "emotion2", "emotion3"],
  "contentTone": "specific tone for this business",
  "localInsights": ["insight1", "insight2", "insight3"]
}`;

    const response = await generateText(analysisPrompt, GEMINI_2_5_MODELS.FLASH);

    try {
      const analysis = JSON.parse(response);
      console.log('✅ [Revo 1.5] Business analysis completed:', analysis.contentApproach);
      return analysis;
    } catch (parseError) {
      console.warn('⚠️ [Revo 1.5] Failed to parse business analysis, using fallback');
      return {
        contentApproach: 'benefit-driven',
        keyMessages: [`${businessName} delivers exceptional services`],
        targetPainPoints: ['Finding reliable service providers'],
        uniqueValueProps: ['Quality service', 'Local expertise'],
        emotionalTriggers: ['trust', 'confidence'],
        contentTone: 'professional',
        localInsights: [`Serving ${brandProfile.location || 'the local community'}`]
      };
    }

  } catch (error) {
    console.warn('⚠️ [Revo 1.5] Business analysis failed, using fallback:', error);
    return {
      contentApproach: 'benefit-driven',
      keyMessages: [`${businessName} delivers exceptional services`],
      targetPainPoints: ['Finding reliable service providers'],
      uniqueValueProps: ['Quality service', 'Local expertise'],
      emotionalTriggers: ['trust', 'confidence'],
      contentTone: 'professional',
      localInsights: [`Serving ${brandProfile.location || 'the local community'}`]
    };
  }
}

/**
 * Fetch trending data for content generation
 */
async function fetchTrendingData(
  businessType: string,
  location: string,
  platform: string
): Promise<{
  trendingHashtags: string[];
  currentEvents: string[];
  businessTrends: string[];
  socialBuzz: string[];
}> {
  try {
    console.log('📈 [Revo 1.5] Fetching trending data for:', { businessType, location, platform });

    // Fetch trending hashtags
    const trendingHashtags = await TrendingHashtagsService.getTrendingHashtags(
      businessType,
      location,
      10
    );

    // Fetch regional social trends
    const regionalData = await RegionalSocialTrendsService.getRegionalSocialData(
      businessType,
      location
    );

    return {
      trendingHashtags: trendingHashtags || [],
      currentEvents: regionalData.currentEvents || [],
      businessTrends: regionalData.businessTrends || [],
      socialBuzz: regionalData.socialBuzz || []
    };

  } catch (error) {
    console.warn('⚠️ [Revo 1.5] Failed to fetch trending data:', error);
    return {
      trendingHashtags: [],
      currentEvents: [],
      businessTrends: [],
      socialBuzz: []
    };
  }
}

/**
 * Generate caption, hashtags, headlines, subheadlines, and CTAs for Revo 1.5 (matching Revo 1.0 approach)
 */
async function generateCaptionAndHashtags(
  businessType: string,
  businessName: string,
  platform: string,
  designPlan: any,
  brandProfile: BrandProfile,
  useLocalLanguage: boolean = false,
  scheduledServices?: ScheduledService[]
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {
    console.log('🎯 [Revo 1.5] Generating caption and hashtags for:', {
      businessName,
      businessType,
      platform,
      location: brandProfile.location || 'Local area',
      designConcept: designPlan?.concept || 'Professional business content'
    });

    // Fetch trending data for current, relevant content
    // PRIORITY: Use scheduled services if available, otherwise fall back to brand services or business type
    let trendingContext = businessType;

    if (scheduledServices && scheduledServices.length > 0) {
      // Use scheduled services with ABSOLUTE PRIORITY - never fall back to brand services
      const todaysServices = scheduledServices.filter(s => s.isToday);
      const upcomingServices = scheduledServices.filter(s => s.isUpcoming);

      if (todaysServices.length > 0) {
        // ABSOLUTE PRIORITY: Today's services override everything
        trendingContext = todaysServices.map(s => s.serviceName).join('\n');
        console.log('🎯 [Revo 1.5] ABSOLUTE PRIORITY: Using TODAY\'S scheduled services:', todaysServices.map(s => s.serviceName));
        console.log('🚫 [Revo 1.5] Ignoring brand services due to today\'s scheduled services');
      } else if (upcomingServices.length > 0) {
        // Use upcoming services
        trendingContext = upcomingServices.map(s => s.serviceName).join('\n');
        console.log('📅 [Revo 1.5] Using UPCOMING scheduled services for trending context:', upcomingServices.map(s => s.serviceName));
      } else {
        // Use all scheduled services
        trendingContext = scheduledServices.map(s => s.serviceName).join('\n');
        console.log('📋 [Revo 1.5] Using ALL scheduled services for trending context:', scheduledServices.map(s => s.serviceName));
      }
    } else if (brandProfile.services) {
      // Only fall back to general brand services if NO scheduled services exist
      trendingContext = brandProfile.services;
      console.log('🏢 [Revo 1.5] FALLBACK: Using general brand services (no scheduled services found)');
    }

    console.log('🔍 [Revo 1.5] Final trending context:', {
      hasScheduledServices: !!(scheduledServices && scheduledServices.length > 0),
      scheduledServicesCount: scheduledServices?.length || 0,
      todaysServicesCount: scheduledServices?.filter(s => s.isToday).length || 0,
      upcomingServicesCount: scheduledServices?.filter(s => s.isUpcoming).length || 0,
      services: brandProfile.services,
      businessType,
      finalContext: trendingContext
    });

    const trendingData = await fetchTrendingData(
      trendingContext,
      brandProfile.location || 'Local area',
      platform
    );

    // Generate intelligent content strategy based on business analysis
    const businessAnalysis = await analyzeBusinessForContentStrategy(
      businessType,
      businessName,
      brandProfile,
      platform,
      trendingData,
      useLocalLanguage
    );

    // 🔍 DEBUG: Local language parameter tracing for Revo 1.5
    console.log('🌍 [Revo 1.5] Local Language Debug:', {
      useLocalLanguage: useLocalLanguage,
      location: brandProfile.location,
      businessType: businessType,
      platform: platform
    });

    // 🚨 ALERT: Make this debug message very visible
    if (useLocalLanguage) {
      console.log('🚨🌍 REVO 1.5 LOCAL LANGUAGE IS ENABLED! Should generate local language content for:', brandProfile.location);
    } else {
      console.log('❌🌍 REVO 1.5 LOCAL LANGUAGE IS DISABLED - English only');
    }

    const languageInstruction = useLocalLanguage
      ? `- LANGUAGE: Use English with natural local language elements appropriate for ${brandProfile.location || 'the location'} (mix English with local language for authentic feel)`
      : `- LANGUAGE: Use English only, do not use local language`;

    // Strategic location mention - only include location sometimes for variety
    const shouldMentionLocation = Math.random() < 0.4; // 40% chance to mention location
    const locationText = shouldMentionLocation && brandProfile.location
      ? `- Location: ${brandProfile.location}`
      : '';

    const prompt = `Create engaging ${platform} content for a ${businessType} business.

Business Details:
- Name: ${businessName}
- Type: ${businessType}
${locationText}
- Design Concept: ${designPlan?.concept || 'Professional business content'}
- Key Elements: ${designPlan?.keyElements?.join(', ') || 'Modern design elements'}
${languageInstruction}

${scheduledServices && scheduledServices.length > 0 ? `
🎯 SCHEDULED SERVICES (HIGHEST PRIORITY - Focus content on these specific services):
${scheduledServices.filter(s => s.isToday).length > 0 ? `
⚡ TODAY'S SERVICES (Create URGENT, action-focused content):
${scheduledServices.filter(s => s.isToday).map(s => `- ${s.serviceName}: ${s.description || 'Available today'}`).join('\n')}

URGENT CONTENT REQUIREMENTS:
- Use TODAY-focused language: "today", "now", "available today", "don't miss out"
- Create urgency and immediate action
- Mention specific service names in headlines/content
- Use urgent CTAs: "Book now", "Available today", "Don't wait"
` : ''}
${scheduledServices.filter(s => s.isUpcoming).length > 0 ? `
📅 UPCOMING SERVICES (Build anticipation and early booking):
${scheduledServices.filter(s => s.isUpcoming).map(s => `- ${s.serviceName} (in ${s.daysUntil} days): ${s.description || 'Coming soon'}`).join('\n')}

ANTICIPATION CONTENT REQUIREMENTS:
- Build excitement for upcoming services
- Use anticipation language: "coming soon", "get ready", "reserve your spot"
- Create early booking incentives
- Mention specific dates/timing
` : ''}

⚠️ CRITICAL REQUIREMENT:
- The content MUST specifically promote ONLY these scheduled services
- DO NOT create generic business content or mention other services
- Focus ENTIRELY on the scheduled services listed above
- Use the EXACT service names in headlines and content
- Ignore any other business services not listed above
` : ''}

CURRENT TRENDING DATA (Use these to make content current and relevant):
${trendingData.trendingHashtags.length > 0 ? `- Trending Hashtags: ${trendingData.trendingHashtags.slice(0, 5).join(', ')}` : ''}
${trendingData.currentEvents.length > 0 ? `- Current Events: ${trendingData.currentEvents.slice(0, 3).join(', ')}` : ''}
${trendingData.businessTrends.length > 0 ? `- Business Trends: ${trendingData.businessTrends.slice(0, 3).join(', ')}` : ''}
${trendingData.socialBuzz.length > 0 ? `- Social Buzz: ${trendingData.socialBuzz.slice(0, 3).join(', ')}` : ''}

INTELLIGENT CONTENT STRATEGY (Based on business analysis):
- Content Approach: ${businessAnalysis.contentApproach}
- Key Messages: ${businessAnalysis.keyMessages.join(', ')}
- Target Pain Points: ${businessAnalysis.targetPainPoints.join(', ')}
- Unique Value Props: ${businessAnalysis.uniqueValueProps.join(', ')}
- Emotional Triggers: ${businessAnalysis.emotionalTriggers.join(', ')}
- Content Tone: ${businessAnalysis.contentTone}
- Local Insights: ${businessAnalysis.localInsights.join(', ')}

Use this analysis to create content that is:
- SPECIFIC to this business and industry
- RELEVANT to the target audience and pain points
- UNIQUE in approach and messaging
- AUTHENTIC to the business's value proposition
- ENGAGING through the identified emotional triggers

Create:
1. A catchy, engaging caption (2-3 sentences max) that:
   - Uses the identified content approach and tone
   - Addresses the target pain points naturally
   - Incorporates the unique value propositions
   - Evokes the identified emotional triggers
   - Includes local insights when relevant
   - Varies the opening approach to avoid repetition

2. A compelling headline (5-8 words max) that:
   - GRABS ATTENTION immediately with emotional hooks, power words, or curiosity
   - Uses strong action words, emotional triggers, or intriguing statements
   - Creates urgency, excitement, or desire (e.g., "Transform Your Life Today!", "Why Everyone's Switching to...", "The Secret to...")
   - Avoids boring corporate language - be bold, exciting, and engaging
   - Uses numbers, questions, or bold claims when appropriate
   - Makes people want to read more or take action
   - Examples of engaging styles: "Stop Struggling, Start Succeeding!", "The Game-Changer You've Been Waiting For", "Why 10,000+ People Choose Us"

3. A supporting subheadline (8-15 words) that:
   - Builds on the headline's excitement with specific benefits or results
   - Uses emotional language that connects with the target audience
   - Creates desire by highlighting what they'll gain or achieve
   - Uses power words like "discover", "achieve", "transform", "master", "dominate"
   - Avoids generic phrases - be specific and compelling
   - Makes a promise or shows a clear benefit
   - Examples: "Join thousands who've already transformed their lives", "Discover the secret that's changing everything", "Get results in 30 days or less"

4. A strong call-to-action (3-6 words) that:
   - Aligns with the emotional triggers
   - Encourages action relevant to this business type
   - Uses language appropriate for the target audience
   - Reflects the business's unique positioning
   - Avoids generic action words
5. 10 highly relevant, specific hashtags that are:
   - Specific to this business and location
   - Mix of business-specific, location-based, industry-relevant, and platform-optimized
   - Include trending hashtags from the current data above when relevant
   - Avoid generic hashtags like #business, #professional, #quality, #local
   - Discoverable and relevant to the target audience
   - Appropriate for ${platform}
   - Use current events and trends to make hashtags timely and engaging

Make the content authentic, locally relevant, and engaging for ${platform}.
The headline, subheadline, and CTA will be displayed directly on the design image.

IMPORTANT: Use the trending data above to make your content current and relevant:
- Incorporate trending hashtags naturally into your hashtag list
- Reference current events or business trends when relevant to the business
- Use social buzz topics to make content more engaging and timely
- Make headlines and captions feel current and connected to what's happening now

${useLocalLanguage ? `
CRITICAL LANGUAGE REQUIREMENTS:
- Use English as the primary language (70%)
- Include natural local language elements (30%) - words, phrases, expressions that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${brandProfile.location || 'the location'}
- Examples: "Welcome to [Business Name]" + local greeting, or "Best [Service]" + local term
- Avoid 100% local language - aim for natural mixing
- Headlines, captions, and CTAs should include local language elements when appropriate

HEADLINE & SUBHEADLINE LOCAL LANGUAGE INTEGRATION:
- Add contextually appropriate local greetings to headlines based on business type
- Use local expressions in subheadlines that relate to the specific business industry
- Include relevant local terms that match the business offerings and target audience
- Mix naturally: Don't force local language - only add when it makes sense and flows well
- Keep it relevant: Use local language that relates to the specific business context and audience
- Maintain engagement: Ensure the local language enhances rather than distracts from the message
- Be dynamic: Generate unique local language for each business, avoid repetitive patterns
- Think creatively: Use different local greetings, expressions, and terms for each business type` : `
LANGUAGE REQUIREMENTS:
- Use English only, do not use local language
- Keep all content in English for universal accessibility`}

CRITICAL: CREATE INTELLIGENT, BUSINESS-SPECIFIC CONTENT:
- ANALYZE the business deeply: Understand the industry, target audience, and unique positioning
- THINK like a marketing expert: What would resonate with THIS specific business's customers?
- AVOID generic content: Every piece should feel tailored to this exact business
- USE the business analysis: Let the identified approach, pain points, and value props guide your content
- BE AUTHENTIC: Content should reflect the business's actual strengths and positioning
- VARY your approach: Use different angles, but always relevant to this business
- AVOID repetitive patterns: Each generation should feel fresh and unique
- STAY RELEVANT: Connect content to current trends and local context when appropriate

HEADLINE & SUBHEADLINE CREATIVITY REQUIREMENTS:
- MAKE HEADLINES IRRESISTIBLE: Use emotional hooks, power words, curiosity gaps, or bold claims
- AVOID BORING LANGUAGE: No corporate speak, generic phrases, or dull statements
- CREATE URGENCY: Use words that make people want to act now
- USE PSYCHOLOGICAL TRIGGERS: Scarcity, social proof, fear of missing out, curiosity
- BE BOLD: Don't be afraid to make strong claims or use exciting language
- FOCUS ON BENEFITS: What will the customer gain, achieve, or experience?
- USE NUMBERS: "10,000+ customers", "30 days", "5x results" - numbers grab attention
- ASK QUESTIONS: "Tired of...?", "Ready to...?", "Why do...?" - questions engage
- MAKE PROMISES: "Guaranteed results", "Transform your life", "Join the winners"

HEADLINE & SUBHEADLINE EXAMPLES BY BUSINESS TYPE:
- RESTAURANT: "Taste the Difference!" + "Where every bite tells a story of passion and flavor"
- FITNESS: "Transform Your Body in 30 Days!" + "Join 5,000+ people who've already changed their lives"
- TECH: "The Future is Here!" + "Discover the technology that's revolutionizing everything"
- BEAUTY: "Reveal Your True Beauty!" + "Professional results that make you feel confident every day"
- FINANCE: "Your Money, Your Future!" + "Smart banking solutions that put you in control"
- HEALTHCARE: "Your Health, Our Priority!" + "Expert care that puts your wellbeing first"
- EDUCATION: "Reveal Your Potential!" + "Learn from the best and achieve your dreams"
- REAL ESTATE: "Find Your Dream Home!" + "Where every property tells a story of new beginnings"

${useLocalLanguage ? `
LANGUAGE GUIDANCE:
- Use English as the primary language (70%)
- Include natural local language elements (30%) that locals would use
- Mix English with local language for an authentic, natural feel
- Make it sound natural and culturally appropriate for ${brandProfile.location || 'the location'}
- Avoid 100% local language - aim for 70% English, 30% local elements

HEADLINE & SUBHEADLINE LOCAL LANGUAGE GUIDANCE:
- Generate contextually appropriate local language based on the specific business type
- Use local greetings that fit the business context (e.g., "Karibu!" for hospitality, "Habari!" for general, "Hujambo!" for friendly)
- Include local expressions that relate to the business industry and services
- Use local terms that are relevant to the specific business offerings
- Make the local language feel natural and authentic for that particular business
- Avoid repetitive patterns - each business should have unique local language integration

LOCAL LANGUAGE INTEGRATION RULES:
- Add appropriate local greetings based on business context (hospitality, general, friendly, professional)
- Use local expressions that relate to the specific business industry and services
- Include local terms that are relevant to the business offerings and target audience
- Mix naturally: Don't force it - only add when it makes sense and flows well
- Keep it relevant: Use local language that relates to the specific business context
- Maintain flow: Ensure the mix sounds natural and not forced
- Be dynamic: Generate unique local language for each business, avoid repetitive patterns` : ''}

Format as JSON:
{
  "caption": "Your engaging caption here",
  "headline": "Your compelling headline here",
  "subheadline": "Your supporting subheadline here",
  "callToAction": "Your strong CTA here",
  "hashtags": ["#SpecificHashtag1", "#LocationBasedHashtag", "#IndustryRelevant", ...]
}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 600
    });

    console.log('✅ [Revo 1.5] OpenAI response received for caption generation');

    try {
      let responseContent = response.choices[0].message.content || '{}';

      // Clean up the response if it has markdown formatting
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1] || responseContent;
      }

      const parsed = JSON.parse(responseContent);

      console.log('✅ [Revo 1.5] Content generation successful:', {
        caption: parsed.caption?.substring(0, 100) + '...',
        headline: parsed.headline || 'No headline',
        subheadline: parsed.subheadline?.substring(0, 50) + '...' || 'No subheadline',
        callToAction: parsed.callToAction || 'No CTA',
        hashtagsCount: parsed.hashtags?.length || 0,
        hashtags: parsed.hashtags?.slice(0, 3) || []
      });

      // VALIDATION: Check if content mentions scheduled services
      if (scheduledServices && scheduledServices.length > 0) {
        const todaysServices = scheduledServices.filter(s => s.isToday);
        if (todaysServices.length > 0) {
          const contentText = `${parsed.headline} ${parsed.subheadline} ${parsed.caption}`.toLowerCase();
          const mentionsScheduledService = todaysServices.some(service =>
            contentText.includes(service.serviceName.toLowerCase())
          );

          if (mentionsScheduledService) {
            console.log('✅ [Revo 1.5] VALIDATION PASSED: Content mentions scheduled services');
          } else {
            console.warn('⚠️ [Revo 1.5] VALIDATION WARNING: Content does not mention today\'s scheduled services:', {
              todaysServices: todaysServices.map(s => s.serviceName),
              generatedContent: contentText.substring(0, 200)
            });
          }
        }
      }

      return {
        caption: parsed.caption || `Enhanced ${businessName} content with premium design`,
        headline: parsed.headline || `Premium ${businessName} Solutions`,
        subheadline: parsed.subheadline || `Experience the future of ${businessType.toLowerCase()} with ${businessName}`,
        callToAction: parsed.callToAction || `Discover ${businessName} Today`,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#enhanced', '#AI', '#design', '#premium', '#quality']
      };
    } catch (parseError) {
      console.warn('⚠️ [Revo 1.5] Failed to parse caption response, using fallback');
      return {
        caption: `Enhanced ${businessName} content with premium design and professional quality`,
        headline: `Premium ${businessName} Solutions`,
        subheadline: `Experience the future of ${businessType.toLowerCase()} with ${businessName}`,
        callToAction: `Discover ${businessName} Today`,
        hashtags: ['#enhanced', '#AI', '#design', '#premium', '#quality', `#${businessName.replace(/\s+/g, '')}`, `#${businessType.replace(/\s+/g, '')}`]
      };
    }
  } catch (error) {
    console.error('❌ [Revo 1.5] Content generation failed:', error);
    return {
      caption: `Enhanced ${businessName} content with premium design and professional quality`,
      headline: `Premium ${businessName} Solutions`,
      subheadline: `Experience the future of ${businessType.toLowerCase()} with ${businessName}`,
      callToAction: `Discover ${businessName} Today`,
      hashtags: ['#enhanced', '#AI', '#design', '#premium', '#quality', `#${businessName.replace(/\s+/g, '')}`, `#${businessType.replace(/\s+/g, '')}`]
    };
  }
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
 * STANDARDIZED: ALL platforms use 992x1056px format (no stories/reels)
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  // ALL platforms use 992x1056px format for maximum quality
  return '992x1056px HD (Maximum quality)';
}

export interface Revo15DesignInput {
  businessType: string;
  platform: string;
  visualStyle: string;
  imageText: string;
  brandProfile: BrandProfile;
  brandConsistency?: {
    strictConsistency: boolean;
    followBrandColors: boolean;
    includeContacts?: boolean;
  };
  artifactInstructions?: string;
  designReferences?: string[]; // Base64 encoded reference images
  includePeopleInDesigns?: boolean; // Control whether designs should include people (default: true)
  useLocalLanguage?: boolean; // Control whether to use local language in text (default: false)
  logoDataUrl?: string; // Base64 logo data
  logoUrl?: string; // Storage URL for logo
  scheduledServices?: ScheduledService[]; // NEW: Scheduled services from calendar
}

export interface Revo15DesignResult {
  imageUrl: string;
  designSpecs: any;
  qualityScore: number;
  enhancementsApplied: string[];
  processingTime: number;
  model: string;
  planningModel: string;
  generationModel: string;
  caption?: string;
  hashtags?: string[];
  headline?: string;
  subheadline?: string;
  callToAction?: string;
}

/**
 * Clean website URL by removing https://, http://, and www.
 */
function cleanWebsiteUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Ensure website URL is displayed as www.example.com (strip protocol, add www., no trailing slash)
 */
function ensureWwwWebsiteUrl(url: string): string {
  if (!url) return '';
  const base = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
  return base ? `www.${base}` : '';
}


/**
 * Step 1: Generate design specifications using Gemini 2.5 Flash
 */
export async function generateDesignPlan(
  input: Revo15DesignInput
): Promise<any> {

  const brandColors = [
    input.brandProfile.primaryColor,
    input.brandProfile.accentColor,
    input.brandProfile.backgroundColor
  ].filter(Boolean);

  // Strategic location mention in design planning - only include sometimes
  const shouldMentionLocationInPlanning = Math.random() < 0.3; // 30% chance to mention location
  const locationTextForPlanning = shouldMentionLocationInPlanning && input.brandProfile.location
    ? `- Location: ${input.brandProfile.location}`
    : '';

  const designPlanningPrompt = `You are an expert design strategist for Revo 1.5. Create a comprehensive design plan for a ${input.platform} post.

BUSINESS CONTEXT:
- Business: ${input.brandProfile.businessName}
- Type: ${input.businessType}
${locationTextForPlanning}
- Website: ${cleanWebsiteUrl((input.brandProfile as any).websiteUrl || '')}

BRAND PROFILE:
- Primary Color: ${input.brandProfile.primaryColor || '#000000'}
- Accent Color: ${input.brandProfile.accentColor || '#666666'}
- Background Color: ${input.brandProfile.backgroundColor || '#FFFFFF'}
- Writing Tone: ${input.brandProfile.writingTone || 'professional'}
- Target Audience: ${input.brandProfile.targetAudience || 'General audience'}

DESIGN REQUIREMENTS:
- Platform: ${input.platform}
- Aspect Ratio: ${(input as any).aspectRatio || getPlatformAspectRatio(input.platform)} (${getPlatformDimensionsText((input as any).aspectRatio || getPlatformAspectRatio(input.platform))})
- Visual Style: ${input.visualStyle}
- Text Content: "${input.imageText}"
- Include People: ${input.includePeopleInDesigns !== false ? 'Yes' : 'No'}
- Use Local Language: ${input.useLocalLanguage === true ? 'Yes' : 'No'}

REVO 1.5 PREMIUM DESIGN PRINCIPLES (UNIQUE TO REVO 1.5):
1. **Ultra-Modern Composition**: Use cutting-edge layout principles (asymmetrical balance, dynamic grids, fluid compositions)
2. **Intelligent Color Psychology**: Create sophisticated color schemes that trigger specific emotions and actions
3. **Premium Typography System**: Use exclusive font combinations with perfect weight distribution and spacing
4. **Advanced Visual Depth**: Multi-layered designs with sophisticated shadows, glows, and dimensional effects
5. **Seamless Brand Fusion**: Integrate brand elements as natural design components, not add-ons
6. **Platform-Specific Intelligence**: Optimize for each platform's unique algorithm and user behavior
7. **Emotional Architecture**: Design that builds emotional connection through visual storytelling
8. **Cultural Intelligence**: Subtle, authentic cultural elements that enhance rather than distract
9. **Micro-Interactions**: Design elements that suggest interactivity and engagement
10. **Future-Forward Aesthetics**: Trends that will remain relevant for 2+ years

REVO 1.5 EXCLUSIVE DESIGN STYLES (CHOOSE ONE):
1. **Neo-Minimalist**: Ultra-clean with strategic negative space, single focal point, premium typography
2. **Fluid Dynamics**: Organic shapes, flowing lines, gradient overlays, dynamic movement
3. **Geometric Precision**: Sharp angles, perfect symmetry, mathematical proportions, bold contrasts
4. **Layered Depth**: Multiple transparent layers, sophisticated shadows, 3D-like depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with artistic overlays, filters, and effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest buttons, hover effects, and engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Future-Tech**: Cutting-edge aesthetics, metallic elements, neon accents, sci-fi inspired

REVO 1.5 PREMIUM TYPOGRAPHY SYSTEM:
- **Headlines**: Use bold, modern fonts (Inter Bold, Poppins Black, Montserrat ExtraBold)
- **Subheadings**: Medium-weight fonts (Inter Medium, Poppins SemiBold, Montserrat Bold)
- **Body Text**: Clean, readable fonts (Inter Regular, Poppins Regular, Montserrat Regular)
- **Accent Text**: Distinctive fonts for CTAs (Nunito Bold, Source Sans Pro Bold)
- **Font Pairing Rules**: Maximum 2 fonts with strong contrast and complementary personalities
- **Weight Hierarchy**: 900 (headlines), 600 (subheadings), 400 (body), 700 (CTAs)
- **Spacing**: Generous letter-spacing for headlines, tight for body text
- **Line Height**: 1.2 for headlines, 1.4 for subheadings, 1.6 for body text

Create a detailed design plan including:
1. **Layout Strategy**: Composition approach and element placement
2. **Color Palette**: Extended palette based on brand colors
3. **Typography Plan**: Font selections and text hierarchy
4. **Visual Elements**: Icons, shapes, patterns to include
5. **Brand Integration**: How to incorporate logo and brand elements
   - Logo Status: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'AVAILABLE - Must be prominently integrated' : 'NOT AVAILABLE - Focus on typography and colors'}
   - Logo Requirements: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'Use actual provided logo, ensure visibility and proper placement' : 'No logo to integrate'}
6. **Mood & Atmosphere**: Overall feeling and aesthetic direction
7. **Technical Specs**: Aspect ratio, resolution, key measurements
8. **Style Selection**: Choose one of the 10 exclusive Revo 1.5 design styles
9. **Typography Hierarchy**: Specific font selections and weight distribution
10. **Visual Storytelling**: How the design tells the brand story

Provide a structured plan that will guide the image generation process.`;

  try {
    const planResponse = await generateText(
      designPlanningPrompt,
      {
        model: GEMINI_2_5_MODELS.FLASH,
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    );

    return {
      plan: planResponse.text,
      brandColors,
      timestamp: Date.now()
    };

  } catch (error) {
    throw new Error(`Design planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Step 2: Generate final image using Gemini 2.5 Flash Image Preview
 */
export async function generateFinalImage(
  input: Revo15DesignInput,
  designPlan: any,
  contentResult?: {
    headline: string;
    subheadline: string;
    callToAction: string;
  }
): Promise<string> {

  // Build comprehensive image generation prompt based on the design plan
  let imagePrompt = buildEnhancedImagePrompt(input, designPlan, contentResult);

  // Contact information integration based on toggle
  try {
    const includeContacts = (input.brandConsistency as any)?.includeContacts === true;
    const phone = input.brandProfile?.contactInfo?.phone;
    const email = input.brandProfile?.contactInfo?.email;
    const address = input.brandProfile?.contactInfo?.address;
    const website = (input.brandProfile as any)?.websiteUrl || '';

    const hasAnyContact = (!!phone || !!email || !!website);

    const contactInstructions = includeContacts && hasAnyContact
      ? `\n\n🎯 CRITICAL CONTACT INFORMATION INTEGRATION (FINAL INSTRUCTION):\n- MUST integrate these EXACT contact details prominently in the design:\n${phone ? `  📞 Phone: ${phone}\n` : ''}${email ? `  📧 Email: ${email}\n` : ''}${website ? `  🌐 Website: ${ensureWwwWebsiteUrl(website)}\n` : ''}- Place ONLY in footer bar, corner block, or contact strip at the BOTTOM of the image\n- DO NOT include contact info in main content area, headlines, or call-to-action blocks\n- DO NOT use generic service information like "BANKING", "PAYMENTS", etc.\n- ONLY use the specific contact details provided above\n- Make contact info clearly readable and professionally integrated\n- This is a PRIORITY requirement - contact info MUST be visible in the final image\n`
      : `\n\n🚫 CONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website in the image\n- Do NOT include generic service information\n- Do NOT add contact info in main content area\n`;

    imagePrompt += contactInstructions;
  } catch (e) {
    console.warn('Revo 1.5: Contact info prompt augmentation skipped:', e);
  }

  // Retry logic for 503 errors
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use direct Gemini generation like Revo 2.0 for proper logo integration
      const { GoogleGenerativeAI } = await import('@google/generative-ai');

      const apiKey = process.env.GEMINI_API_KEY_REVO_1_5 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        throw new Error('Revo 1.5: No Gemini API key found. Please set GEMINI_API_KEY_REVO_1_5 or GEMINI_API_KEY in your environment variables.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-image-preview', // Same model as Revo 1.0 and 2.0
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });

      // Prepare the generation request with logo if available (exactly like Revo 2.0)
      const generationParts = [
        'You are an expert Revo 1.5 designer using Gemini 2.5 Flash Image Preview (same model as Revo 1.0 and 2.0). Create professional, high-quality social media images with perfect text rendering and ultra-premium visual quality.',
        imagePrompt
      ];

      // Logo processing exactly like Revo 1.0 (working implementation)
      const logoDataUrl = input.brandProfile.logoDataUrl;
      const logoStorageUrl = input.brandProfile.logoUrl;
      const logoUrl = logoDataUrl || logoStorageUrl;

      console.log('🔍 [Revo 1.5] Logo availability check:', {
        businessName: input.brandProfile.businessName,
        hasLogoDataUrl: !!logoDataUrl,
        hasLogoStorageUrl: !!logoStorageUrl,
        logoDataUrlLength: logoDataUrl?.length || 0,
        logoStorageUrlLength: logoStorageUrl?.length || 0,
        finalLogoUrl: logoUrl ? logoUrl.substring(0, 100) + '...' : 'None'
      });

      if (logoUrl) {
        console.log('🎨 [Revo 1.5] Processing brand logo for generation using:', logoDataUrl ? 'base64 data' : 'storage URL');

        let logoBase64Data = '';
        let logoMimeType = 'image/png';

        if (logoUrl.startsWith('data:')) {
          // Handle data URL (base64 format)
          const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (logoMatch) {
            [, logoMimeType, logoBase64Data] = logoMatch;
            console.log('✅ [Revo 1.5] Using base64 logo data directly');
          }
        } else if (logoUrl.startsWith('http')) {
          // Handle storage URL - fetch and convert to base64 (same as Revo 1.0)
          console.log('📡 [Revo 1.5] Fetching logo from storage URL...');
          try {
            const response = await fetch(logoUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              logoBase64Data = Buffer.from(buffer).toString('base64');
              logoMimeType = response.headers.get('content-type') || 'image/png';
              console.log(`✅ [Revo 1.5] Logo fetched and converted to base64 (${buffer.byteLength} bytes)`);
            } else {
              console.warn(`⚠️  [Revo 1.5] Failed to fetch logo from URL: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error('❌ [Revo 1.5] Error fetching logo from storage:', fetchError);
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

            // Extract normalized base64 data
            const normalizedBase64 = normalizedLogo.dataUrl.split(',')[1];

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
            console.log('✅ [Revo 1.5] NORMALIZED logo integration prompt added');
          } catch (normalizationError) {
            console.warn('⚠️ [Revo 1.5] Logo normalization failed, using original:', normalizationError);
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
            console.log('✅ [Revo 1.5] FALLBACK logo integration prompt added');
          }
        } else {
          console.error('❌ [Revo 1.5] Logo processing failed:', {
            originalUrl: logoUrl.substring(0, 100),
            hasLogoDataUrl: !!logoDataUrl,
            hasLogoStorageUrl: !!logoStorageUrl,
            urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
          });
        }
      } else {
        console.log('ℹ️  [Revo 1.5] No logo provided for generation:', {
          businessName: input.brandProfile.businessName,
          availableInputKeys: Object.keys(input.brandProfile).filter(key => key.toLowerCase().includes('logo'))
        });
      }

      const result = await model.generateContent(generationParts);
      const response = await result.response;

      // Extract image data from Gemini response (same as Revo 2.0)
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
        throw new Error('No image data generated by Gemini 2.5 Flash Image Preview for Revo 1.5');
      }

      // Dimension enforcement: ensure 992x1056 exactly
      {
        const expectedW = 992, expectedH = 1056;
        const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
        if (!check.ok) {
          console.warn(`\u26a0\ufe0f [Revo 1.5] Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH}. Enforcing strict dimensions and retrying (attempt ${attempt + 1}/${maxRetries})...`);
          if (attempt < maxRetries) {
            imagePrompt += `\nSTRICT DIMENSION ENFORCEMENT: Output must be exactly ${expectedW}x${expectedH} pixels. Do not adjust canvas based on logo.`;
            continue;
          }
        }
      }

      return imageUrl;

    } catch (error: any) {
      lastError = error;
      console.error(`❌ [Revo 1.5] Attempt ${attempt} failed:`, error.message);

      // Check if it's a 503 error and we have retries left
      if (error.message && error.message.includes('503') && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ [Revo 1.5] Waiting ${waitTime}ms before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's the last attempt or not a 503 error, break
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  // If we get here, all retries failed
  if (lastError?.message?.includes('503')) {
    throw new Error('Oops! Revo 1.5 is taking a quick break due to high demand. 😅 Try Revo 2.0 instead - it\'s working great right now!');
  }

  if (lastError?.message?.includes('500')) {
    throw new Error('Revo 1.5 is having a moment! 🤖 No worries - switch to Revo 2.0 for awesome results while we wait for it to get back up.');
  }

  throw new Error('Revo 1.5 isn\'t feeling well right now. 😔 Good news: Revo 2.0 is ready to create amazing content for you!');
}

/**
 * Build enhanced image prompt based on design plan
 */
function buildEnhancedImagePrompt(
  input: Revo15DesignInput,
  designPlan: any,
  contentResult?: {
    headline: string;
    subheadline: string;
    callToAction: string;
  }
): string {
  const brandColors = [
    input.brandProfile.primaryColor,
    input.brandProfile.accentColor,
    input.brandProfile.backgroundColor
  ].filter(Boolean);

  // Enhanced target market representation for all locations
  const getTargetMarketInstructions = (location: string, businessType: string, targetAudience: string, includePeople: boolean, useLocalLanguage: boolean) => {
    const locationKey = location.toLowerCase();
    const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];

    // Get business-specific target market
    const getBusinessTargetMarket = (businessType: string) => {
      const businessTypeLower = businessType.toLowerCase();

      if (businessTypeLower.includes('restaurant') || businessTypeLower.includes('food') || businessTypeLower.includes('cafe')) {
        return 'diverse families, couples, food enthusiasts, local community members';
      } else if (businessTypeLower.includes('fitness') || businessTypeLower.includes('gym') || businessTypeLower.includes('health')) {
        return 'fitness enthusiasts, health-conscious individuals, athletes, people working out';
      } else if (businessTypeLower.includes('beauty') || businessTypeLower.includes('salon') || businessTypeLower.includes('spa')) {
        return 'beauty-conscious individuals, people getting beauty treatments, fashion-forward people';
      } else if (businessTypeLower.includes('retail') || businessTypeLower.includes('shop') || businessTypeLower.includes('store')) {
        return 'shoppers, customers browsing products, families shopping, fashion enthusiasts';
      } else if (businessTypeLower.includes('finance') || businessTypeLower.includes('bank') || businessTypeLower.includes('payment')) {
        return 'business professionals, entrepreneurs, people using financial services, tech-savvy individuals';
      } else if (businessTypeLower.includes('tech') || businessTypeLower.includes('software') || businessTypeLower.includes('digital')) {
        return 'tech professionals, entrepreneurs, digital natives, people using technology';
      } else if (businessTypeLower.includes('education') || businessTypeLower.includes('school') || businessTypeLower.includes('training')) {
        return 'students, teachers, parents, people learning, educational professionals';
      } else if (businessTypeLower.includes('real estate') || businessTypeLower.includes('property') || businessTypeLower.includes('housing')) {
        return 'homebuyers, families, property investors, people looking for homes';
      } else if (businessTypeLower.includes('automotive') || businessTypeLower.includes('car') || businessTypeLower.includes('vehicle')) {
        return 'car owners, drivers, automotive enthusiasts, people with vehicles';
      } else if (businessTypeLower.includes('healthcare') || businessTypeLower.includes('medical') || businessTypeLower.includes('clinic')) {
        return 'patients, healthcare workers, families, people seeking medical care';
      } else {
        return 'local community members, customers, people using the service';
      }
    };

    const targetMarket = getBusinessTargetMarket(businessType);

    // Check if it's an African country
    const isAfricanCountry = africanCountries.some(country => locationKey.includes(country));

    // Language instruction
    const languageInstruction = useLocalLanguage
      ? `- LANGUAGE: Use English with natural local language elements appropriate for ${location} (mix English with local language for authentic feel)`
      : `- LANGUAGE: Use English only, do not use local language`;

    if (!includePeople) {
      return `
**CLEAN PROFESSIONAL DESIGN WITHOUT PEOPLE FOR ${location.toUpperCase()}:**
- MANDATORY: Create a clean, professional design WITHOUT any people or human figures
- AVOID: AI-generated elements, artificial patterns, or obvious AI design characteristics
- FOCUS: Natural, real-world elements that look authentic and professional
- USE: Real products, services, environments, or clean abstract elements
- STYLE: Clean, minimalist, professional aesthetics that look human-designed
- QUALITY: High-end, polished design that appears professionally created
- ELEMENTS: Use ${businessType}-relevant objects, settings, or visual elements
- BRAND: Emphasize brand elements, colors, and professional aesthetics
- AVOID: Generic AI patterns, artificial textures, or obvious AI-generated elements
- GOAL: Create engaging, clean visuals that look professionally designed, not AI-generated
${languageInstruction}
- Target Audience: ${targetAudience || targetMarket}`;
    }

    if (isAfricanCountry) {
      return `
**CRITICAL TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- MANDATORY: Include authentic Black/African people who represent the target market
- Show people who would actually use the services: ${targetMarket}
- Display local African people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct with no deformations
- Emphasize cultural authenticity and local representation
- AVOID: Generic office workers - show people who match the target audience
- PRIORITY: 80%+ of people in the image should be Black/African when business is in African country
- Context: Show people in ${businessType}-relevant settings, not generic offices

**CLEAN, DIVERSE PEOPLE REPRESENTATION:**
- STYLE: Clean, modern design with diverse people (like Canva templates)
- BACKGROUND: Clean, minimal background with subtle gradients or solid colors
- DIVERSITY: Include diverse people of different ages, ethnicities, and backgrounds
- PEOPLE: Natural, approachable people in appropriate attire for the business
- POSES: Natural, confident poses that look authentic and engaging
- EXPRESSIONS: Friendly, genuine expressions that connect with the audience
- LIGHTING: Clean, even lighting that looks professional and polished
- SETTINGS: Clean, modern environments or neutral backgrounds
- QUALITY: High-quality, natural appearance (like professional stock photos)
- AVOID: Overly complex backgrounds, cluttered scenes, or distracting elements
- GOAL: Clean, diverse design that looks like a high-quality Canva template
${languageInstruction}
- Target Audience: ${targetAudience || targetMarket}`;
    } else {
      return `
**TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- Include people who represent the target market: ${targetMarket}
- Show people who would actually use the services
- Display people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- Context: Show people in ${businessType}-relevant settings, not generic offices

**CLEAN, DIVERSE PEOPLE REPRESENTATION:**
- STYLE: Clean, modern design with diverse people (like Canva templates)
- BACKGROUND: Clean, minimal background with subtle gradients or solid colors
- DIVERSITY: Include diverse people of different ages, ethnicities, and backgrounds
- PEOPLE: Natural, approachable people in appropriate attire for the business
- POSES: Natural, confident poses that look authentic and engaging
- EXPRESSIONS: Friendly, genuine expressions that connect with the audience
- LIGHTING: Clean, even lighting that looks professional and polished
- SETTINGS: Clean, modern environments or neutral backgrounds
- QUALITY: High-quality, natural appearance (like professional stock photos)
- AVOID: Overly complex backgrounds, cluttered scenes, or distracting elements
- GOAL: Clean, diverse design that looks like a high-quality Canva template
${languageInstruction}
- Target Audience: ${targetAudience || targetMarket}`;
    }
  };

  const targetMarketInstructions = getTargetMarketInstructions(
    input.brandProfile.location || '',
    input.businessType,
    input.brandProfile.targetAudience || '',
    input.includePeopleInDesigns !== false, // Default to true if not specified
    input.useLocalLanguage === true // Default to false if not specified
  );

  // Clean business name pattern from image text
  const cleanBusinessNamePattern = (text: string): string => {
    if (!text || text.trim().length === 0) {
      return '';
    }

    let cleaned = text
      .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
      .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
      .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
      .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
      .trim();

    if (cleaned.length < 3) {
      return '';
    }

    return cleaned;
  };

  const cleanedImageText = cleanBusinessNamePattern(input.imageText);

  return `Create a premium ${input.platform} design following this comprehensive plan:

DESIGN PLAN CONTEXT:
${designPlan.plan}

BRAND INTEGRATION:
|- Business: ${input.brandProfile.businessName}
|- Colors: ${brandColors.join(', ')}
|- Style: ${input.visualStyle}
|- Logo Status: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? '✅ BRAND LOGO AVAILABLE - Must be integrated prominently' : '❌ No logo available - do not add any logo'}
|- Logo Integration: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'CRITICAL: The actual brand logo will be provided and MUST be used in the design' : 'Design without logo - focus on typography and brand colors'}

${cleanedImageText ? `ADDITIONAL TEXT CONTENT TO INCLUDE:
"${cleanedImageText}"` : 'TEXT CONTENT: Use the generated headline, subheadline, and CTA from the content generation above'}

${contentResult ? `
🎯 CRITICAL TEXT ELEMENTS TO DISPLAY ON DESIGN:
- PRIMARY HEADLINE (Largest, most prominent): "${contentResult.headline}"
- SECONDARY SUBHEADLINE (Medium, supporting): "${contentResult.subheadline}"
- CALL-TO-ACTION (Bold, action-oriented, prominent): "${contentResult.callToAction}"

🎯 CTA DISPLAY REQUIREMENTS (LIKE PAYA EXAMPLE):
- The CTA "${contentResult.callToAction}" MUST be displayed prominently on the design
- Make it BOLD, LARGE, and VISUALLY STRIKING like "PAYA: YOUR FUTURE, NOW!"
- Use high contrast colors to make the CTA stand out
- Position it prominently - top, center, or as a banner across the design
- Make the CTA text the MAIN FOCAL POINT of the design
- Use typography that commands attention - bold, modern, impactful
- Add visual elements (borders, backgrounds, highlights) to emphasize the CTA
- The CTA should be the FIRST thing people notice when they see the design
- Make it look like a professional marketing campaign CTA
- Ensure it's readable from mobile devices - minimum 32px equivalent font size
- EXAMPLE STYLE: Like "PAYA: YOUR FUTURE, NOW!" - bold, prominent, unmissable

TEXT HIERARCHY REQUIREMENTS:
1. HEADLINE: Most prominent, largest text, primary attention-grabber
2. SUBHEADLINE: Supporting text, explains the value proposition
3. CTA: Action-oriented, bold, encourages immediate response
4. All text must be readable and well-spaced
5. Use professional typography that matches the design style
` : ''}

${targetMarketInstructions}

${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? `
🚨🚨🚨 CRITICAL LOGO REQUIREMENT 🚨🚨🚨
- A BRAND LOGO IMAGE WILL BE PROVIDED ABOVE
- YOU MUST USE THE EXACT LOGO PROVIDED - DO NOT CREATE ANY NEW LOGO
- PLACE THE PROVIDED LOGO PROMINENTLY IN THE DESIGN
- DO NOT IGNORE THE PROVIDED LOGO - IT IS MANDATORY
- DO NOT CREATE ANY TEXT-BASED LOGO OR BRAND SYMBOL
- THE PROVIDED LOGO IS THE ONLY LOGO THAT SHOULD APPEAR
` : ''}

REVO 1.5 EXCLUSIVE PREMIUM REQUIREMENTS:
✨ ULTRA-MODERN AESTHETICS: Cutting-edge design that stands out from Revo 1.0
🎨 DYNAMIC COMPOSITION: Asymmetrical balance, fluid layouts, sophisticated visual hierarchy
🌈 INTELLIGENT COLOR PSYCHOLOGY: Color schemes that trigger specific emotions and actions
📝 PREMIUM TYPOGRAPHY SYSTEM: Exclusive font combinations with perfect weight distribution
🏢 SEAMLESS BRAND FUSION: Brand elements as natural design components, not add-ons
📱 PLATFORM-SPECIFIC INTELLIGENCE: Optimized for ${input.platform} algorithm and user behavior
🎯 EMOTIONAL ARCHITECTURE: Visual storytelling that builds emotional connection
✨ ADVANCED VISUAL DEPTH: Multi-layered designs with sophisticated shadows and glows
🚀 FUTURE-FORWARD AESTHETICS: Trends that will remain relevant for 2+ years
💫 MICRO-INTERACTIONS: Design elements that suggest interactivity and engagement

REVO 1.5 EXCLUSIVE DESIGN STYLE SELECTION:
Choose ONE of these 10 exclusive Revo 1.5 design styles (completely different from Revo 1.0):

1. **Neo-Minimalist**: Ultra-clean with strategic negative space, single focal point, premium typography
2. **Fluid Dynamics**: Organic shapes, flowing lines, gradient overlays, dynamic movement
3. **Geometric Precision**: Sharp angles, perfect symmetry, mathematical proportions, bold contrasts
4. **Layered Depth**: Multiple transparent layers, sophisticated shadows, 3D-like depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with artistic overlays, filters, and effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest buttons, hover effects, and engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Future-Tech**: Cutting-edge aesthetics, metallic elements, neon accents, sci-fi inspired

${input.includePeopleInDesigns === false ? `
CLEAN DESIGN STYLE RECOMMENDATIONS (NO PEOPLE):
- PREFERRED: Neo-Minimalist, Typography-First, Brand-Centric, or Geometric Precision
- AVOID: Future-Tech, Interactive-Style, or overly complex styles that look AI-generated
- FOCUS: Clean, professional, human-designed aesthetics` : `
CLEAN, DIVERSE PEOPLE STYLE RECOMMENDATIONS (WITH PEOPLE):
- PREFERRED: Photo-Artistic, Brand-Centric, Neo-Minimalist, or Cultural-Fusion
- AVOID: Future-Tech, Interactive-Style, or overly complex styles that look AI-generated
- FOCUS: Clean, diverse, Canva-style aesthetics with natural-looking people`}

CRITICAL REQUIREMENTS:
- Dimensions: 992x1056px - ALL PLATFORMS USE THIS EXACT SIZE FOR MAXIMUM QUALITY
- Resolution: Ultra-high quality (992x1056px)
- Text readability: ALL text must be crystal clear and readable
- Brand consistency: Follow brand colors and style guidelines
- Professional finish: Add depth, shadows, and premium visual effects
- No generic templates: Create unique, custom design
- MUST be completely different from Revo 1.0 designs
- Use one of the 10 exclusive Revo 1.5 design styles above
${input.includePeopleInDesigns === false ? `
CLEAN DESIGN REQUIREMENTS (NO PEOPLE):
- AVOID: AI-generated elements, artificial patterns, or obvious AI design characteristics
- FOCUS: Natural, real-world elements that look authentic and professional
- STYLE: Clean, minimalist, professional aesthetics that look human-designed
- QUALITY: High-end, polished design that appears professionally created
- AVOID: Generic AI patterns, artificial textures, or obvious AI-generated elements
- GOAL: Create engaging, clean visuals that look professionally designed, not AI-generated` : `
CLEAN, DIVERSE PEOPLE REQUIREMENTS (WITH PEOPLE):
- STYLE: Clean, modern design with diverse people (like Canva templates)
- BACKGROUND: Clean, minimal background with subtle gradients or solid colors
- DIVERSITY: Include diverse people of different ages, ethnicities, and backgrounds
- PEOPLE: Natural, approachable people in appropriate attire for the business
- POSES: Natural, confident poses that look authentic and engaging
- EXPRESSIONS: Friendly, genuine expressions that connect with the audience
- LIGHTING: Clean, even lighting that looks professional and polished
- SETTINGS: Clean, modern environments or neutral backgrounds
- QUALITY: High-quality, natural appearance (like professional stock photos)
- AVOID: Overly complex backgrounds, cluttered scenes, or distracting elements
- GOAL: Clean, diverse design that looks like a high-quality Canva template`}

Generate a stunning, cutting-edge design that represents the pinnacle of ${input.platform} visual content using Revo 1.5's exclusive design system.`;
}

/**
 * Fetch logo from storage URL and convert to base64
 */
async function fetchAndConvertLogo(logoUrl: string): Promise<string> {
  try {
    console.log('🖼️  [Revo 1.5] Fetching logo from storage:', logoUrl.substring(0, 100) + '...');
    const response = await fetch(logoUrl);

    if (!response.ok) {
      console.warn('⚠️  [Revo 1.5] Logo fetch failed:', response.status, response.statusText);
      return '';
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/png';
    const logoDataUrl = `data:${contentType};base64,${base64String}`;

    console.log('✅ [Revo 1.5] Logo converted to base64:', logoDataUrl.length, 'characters');
    return logoDataUrl;
  } catch (error) {
    console.error('❌ [Revo 1.5] Error fetching logo:', error);
    return '';
  }
}

/**
 * Main Revo 1.5 Enhanced Design Generation Function
 */
export async function generateRevo15EnhancedDesign(
  input: Revo15DesignInput
): Promise<Revo15DesignResult> {
  const startTime = Date.now();

  // Logo processing is now handled in generateFinalImage (same as Revo 1.0)

  // Auto-detect platform-specific aspect ratio
  const aspectRatio = getPlatformAspectRatio(input.platform);
  const enhancedInput = {
    ...input,
    aspectRatio
  };

  // Check if logo is available for enhancement tracking
  const hasLogo = !!(input.brandProfile?.logoDataUrl || input.brandProfile?.logoUrl || input.logoDataUrl || input.logoUrl);

  const enhancementsApplied: string[] = [
    'Two-Step Design Process',
    'Gemini 2.5 Flash Planning',
    'Gemini 2.5 Flash Image Preview Generation',
    'Advanced Design Strategy',
    'Premium Visual Quality',
    `Platform-Optimized ${aspectRatio} Format`,
    hasLogo ? 'Enhanced Logo Integration' : 'Logo Processing (No Logo Available)',
    'Revo 2.0-Level Logo Processing',
    'Comprehensive Logo Fallback System'
  ];

  try {

    // Step 1: Generate design plan with Gemini 2.5 Flash
    const designPlan = await generateDesignPlan(enhancedInput);
    enhancementsApplied.push('Strategic Design Planning');

    // Step 2: Always generate caption, hashtags, headlines, subheadlines, and CTAs for design
    const contentResult = await generateCaptionAndHashtags(
      input.businessType,
      input.brandProfile.businessName || input.businessType,
      input.platform,
      designPlan,
      input.brandProfile,
      input.useLocalLanguage === true, // Default to false if not specified
      input.scheduledServices // NEW: Pass scheduled services to content generation
    );
    enhancementsApplied.push('AI-Generated Content & Design Text');

    // Step 3: Generate final image with text elements on design (matching Revo 1.0 approach)
    const imageUrl = await generateFinalImage(enhancedInput, designPlan, contentResult);
    enhancementsApplied.push('Premium Image Generation with Text Elements');

    const result: Revo15DesignResult = {
      imageUrl,
      designSpecs: designPlan,
      qualityScore: 9.8, // Higher quality score for two-step process
      enhancementsApplied,
      processingTime: Date.now() - startTime,
      model: 'revo-1.5-enhanced (gemini-2.5-flash-image-preview)',
      planningModel: GEMINI_2_5_MODELS.FLASH,
      generationModel: 'gemini-2.5-flash-image-preview', // Same model as Revo 1.0 and 2.0
      caption: contentResult.caption,
      hashtags: contentResult.hashtags,
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      callToAction: contentResult.callToAction
    };

    return result;

  } catch (error) {
    // Extract user-friendly message if it exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If it's already a user-friendly message, use it directly
    if (errorMessage.includes('😅') || errorMessage.includes('🤖') || errorMessage.includes('😔')) {
      throw new Error(errorMessage);
    }

    // Check for specific error types and make them friendly
    if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      throw new Error('Oops! Revo 1.5 is taking a quick break due to high demand. 😅 Try Revo 2.0 instead - it\'s working great right now!');
    }

    if (errorMessage.includes('500') || errorMessage.includes('Internal error')) {
      throw new Error('Revo 1.5 is having a moment! 🤖 No worries - switch to Revo 2.0 for awesome results while we wait for it to get back up.');
    }

    // Generic friendly message
    throw new Error('Revo 1.5 isn\'t feeling well right now. 😔 Good news: Revo 2.0 is ready to create amazing content for you!');
  }
}
