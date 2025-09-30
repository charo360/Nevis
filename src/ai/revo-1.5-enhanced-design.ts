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
import { CulturalIntelligenceService } from '@/services/cultural-intelligence-service';
import { NaturalContextMarketingService } from '@/services/natural-context-marketing';
import { EnhancedCTAGenerator, type CTAGenerationContext } from '@/services/enhanced-cta-generator';
import { AIContentGenerator, type AIContentRequest } from '@/services/ai-content-generator';
import { ClaudeSonnet4Generator, type ClaudeContentRequest } from '@/services/claude-sonnet-4-generator';

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
  naturalContextStrategy?: any;
}> {
  // 🎯 Generate Product-Lifestyle Integration Strategy (Fixed Over-Correction)
  let naturalContextStrategy;
  try {
    naturalContextStrategy = NaturalContextMarketingService.generateProductLifestyleIntegration(
      businessType,
      businessName,
      brandProfile.location || 'Local area',
      brandProfile.services || 'Business services',
      brandProfile.targetAudience || 'General audience',
      platform
    );
  } catch (strategyError) {
    console.warn('⚠️ [Revo 1.5] Natural context strategy generation failed:', strategyError);
    // Provide a fallback strategy
    naturalContextStrategy = {
      primaryScenarios: [],
      contextualApproaches: ['product-showcase', 'lifestyle-integration'],
      lifestyleTouchpoints: ['daily-use', 'problem-solving'],
      authenticUseCases: ['professional-use', 'personal-benefit'],
      behavioralPatterns: ['regular-usage', 'problem-resolution'],
      emotionalConnections: ['trust', 'satisfaction', 'reliability']
    };
  }

  try {
    console.log('🧠 [Revo 1.5] Analyzing business for intelligent content strategy:', {
      businessType,
      businessName,
      location: brandProfile.location
    });

    console.log('🌟 [Revo 1.5] Natural Context Marketing Strategy Generated:', {
      scenariosCount: naturalContextStrategy.primaryScenarios.length,
      contextualApproaches: naturalContextStrategy.contextualApproaches.length,
      lifestyleTouchpoints: naturalContextStrategy.lifestyleTouchpoints.length
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

🌟 NATURAL CONTEXT MARKETING APPROACH:
Use these authentic lifestyle scenarios to create natural, non-promotional content:
${naturalContextStrategy.primaryScenarios.map((scenario, index) => `
${index + 1}. ${scenario.context}: ${scenario.scenario}
   - User Behavior: ${scenario.userBehavior}
   - Emotional Trigger: ${scenario.emotionalTrigger}
   - Natural Integration: ${scenario.naturalIntegration}`).join('')}

CONTEXTUAL APPROACHES AVAILABLE:
${naturalContextStrategy.contextualApproaches.map(approach => `- ${approach}`).join('\n')}

LIFESTYLE TOUCHPOINTS:
${naturalContextStrategy.lifestyleTouchpoints.map(touchpoint => `- ${touchpoint}`).join('\n')}

ANALYZE AND PROVIDE:
1. Content Approach: Focus on NATURAL CONTEXT MARKETING - choose from lifestyle scenarios above. Avoid direct promotion. Show the business naturally integrated into daily life scenarios.
2. Key Messages: 3-5 core messages that fit naturally into the chosen lifestyle scenarios
3. Target Pain Points: What problems does this business solve within the natural contexts above?
4. Unique Value Props: What makes this business valuable in the authentic scenarios?
5. Emotional Triggers: Use the emotional triggers from the lifestyle scenarios above
6. Content Tone: What tone works best for authentic lifestyle integration? (natural, relatable, authentic, lifestyle-focused, scenario-based)
7. Local Insights: What local/cultural elements enhance the natural scenarios?

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

CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no code blocks, no additional text.

EXAMPLE RESPONSE FORMAT:
{"contentApproach": "product-showcase", "keyMessages": ["Professional electronics services", "Quality tech solutions", "Expert electronics support"], "targetPainPoints": ["Finding reliable tech services", "Quality concerns", "Trust issues"], "uniqueValueProps": ["Professional expertise", "Quality service", "Local presence"], "emotionalTriggers": ["trust", "quality", "innovation"], "contentTone": "professional", "localInsights": ["Serving local community", "Local tech expertise", "Trusted locally"]}

Return ONLY valid JSON in this exact format:`;

    console.log('🧠 [Revo 1.5] Using Gemini 2.5 Flash for business analysis and strategy planning');
    console.log('📝 [Revo 1.5] Analysis prompt length:', analysisPrompt.length);
    console.log('📝 [Revo 1.5] Analysis prompt preview:', analysisPrompt.substring(0, 200) + '...');

    const response = await generateText(analysisPrompt, { model: GEMINI_2_5_MODELS.FLASH });

    console.log('🔍 [Revo 1.5] Raw AI response for business analysis:', response);
    console.log('🔍 [Revo 1.5] Response type:', typeof response);
    console.log('🔍 [Revo 1.5] Response text:', response.text || response);

    try {
      // Handle both string and object responses
      let responseText = typeof response === 'string' ? response : response.text || JSON.stringify(response);
      console.log('🧹 [Revo 1.5] Response text extracted:', responseText);

      // Clean the response to extract JSON
      let cleanResponse = responseText.trim();
      console.log('🧹 [Revo 1.5] Cleaning response, original length:', cleanResponse.length);

      // Remove markdown code blocks
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        console.log('🧹 [Revo 1.5] Removed ```json markers');
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/g, '');
        console.log('🧹 [Revo 1.5] Removed ``` markers');
      }

      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const extractedJson = cleanResponse.substring(jsonStart, jsonEnd + 1);
        console.log('🧹 [Revo 1.5] Extracted JSON from position', jsonStart, 'to', jsonEnd);
        console.log('🧹 [Revo 1.5] Extracted JSON:', extractedJson);
        cleanResponse = extractedJson;
      }

      // Additional cleanup - remove any remaining non-JSON text
      cleanResponse = cleanResponse.trim();

      console.log('🧹 [Revo 1.5] Final cleaned response:', cleanResponse);

      let analysis;
      try {
        analysis = JSON.parse(cleanResponse);
      } catch (firstParseError) {
        console.warn('🔄 [Revo 1.5] First JSON parse failed, trying alternative parsing...');

        // Try to find and extract JSON more aggressively
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🔄 [Revo 1.5] Found JSON match:', jsonMatch[0]);
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw firstParseError;
        }
      }

      console.log('✅ [Revo 1.5] Business analysis completed successfully:', analysis.contentApproach);
      return {
        ...analysis,
        naturalContextStrategy
      };
    } catch (parseError) {
      console.error('❌ [Revo 1.5] Failed to parse business analysis');
      console.error('📝 [Revo 1.5] Raw response:', response);
      console.error('🧹 [Revo 1.5] Cleaned response:', cleanResponse || 'undefined');
      console.error('⚠️ [Revo 1.5] Parse error:', parseError);
      console.error('🔍 [Revo 1.5] Response type check:', typeof response, typeof cleanResponse);

      // Product-focused fallback based on business type
      const businessType = brandProfile.businessType || 'business';
      return {
        contentApproach: 'product-showcase',
        keyMessages: [
          `Professional ${businessType.toLowerCase()} services you can trust`,
          `Quality ${businessType.toLowerCase()} solutions for your needs`,
          `Expert ${businessType.toLowerCase()} services in ${brandProfile.location || 'your area'}`
        ],
        targetPainPoints: [
          `Finding reliable ${businessType.toLowerCase()} services`,
          'Quality and professional service concerns',
          'Trust and credibility in service providers'
        ],
        uniqueValueProps: [
          'Professional expertise and experience',
          'Quality service delivery',
          'Trusted local presence'
        ],
        emotionalTriggers: ['trust', 'quality', 'professionalism'],
        contentTone: 'professional and trustworthy',
        localInsights: [
          `Serving the ${brandProfile.location || 'local'} community`,
          `Local expertise in ${businessType.toLowerCase()}`,
          `Trusted by locals for quality service`
        ],
        naturalContextStrategy
      };
    }

  } catch (error) {
    console.warn('⚠️ [Revo 1.5] Business analysis failed completely:', error);

    // Product-focused fallback based on business type
    const businessType = brandProfile.businessType || 'business';
    return {
      contentApproach: 'product-showcase',
      keyMessages: [
        `Excellence in ${businessType.toLowerCase()} services`,
        `Your trusted ${businessType.toLowerCase()} partner`,
        `Quality ${businessType.toLowerCase()} solutions delivered`
      ],
      targetPainPoints: [
        `Need for reliable ${businessType.toLowerCase()} services`,
        'Quality service expectations',
        'Professional service delivery'
      ],
      uniqueValueProps: [
        'Proven expertise and results',
        'Professional service standards',
        'Customer-focused approach'
      ],
      emotionalTriggers: ['confidence', 'reliability', 'excellence'],
      contentTone: 'professional and confident',
      localInsights: [
        `Leading ${businessType.toLowerCase()} services locally`,
        `Community-trusted expertise`,
        `Local knowledge and experience`
      ],
      naturalContextStrategy
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
 * Validate content quality and business specificity
 */
function validateContentQuality(
  content: any,
  businessName: string,
  businessType: string,
  brandProfile: BrandProfile
): { isBusinessSpecific: boolean; issues: string[] } {
  const issues: string[] = [];
  let isBusinessSpecific = true;

  // Check if content mentions business name
  const contentText = `${content.headline || ''} ${content.subheadline || ''} ${content.caption || ''}`.toLowerCase();
  const businessNameLower = businessName.toLowerCase();
  const businessTypeLower = businessType.toLowerCase();

  if (!contentText.includes(businessNameLower)) {
    issues.push('Content does not mention business name');
    isBusinessSpecific = false;
  }

  // Check for generic phrases that indicate template content
  const genericPhrases = [
    'your business', 'our company', 'we provide', 'contact us',
    'lorem ipsum', 'placeholder', 'example business'
  ];

  const hasGenericContent = genericPhrases.some(phrase =>
    contentText.includes(phrase.toLowerCase())
  );

  if (hasGenericContent) {
    issues.push('Content contains generic template phrases');
    isBusinessSpecific = false;
  }

  // Check if content relates to business type/industry
  if (brandProfile.services) {
    const services = typeof brandProfile.services === 'string'
      ? brandProfile.services.toLowerCase()
      : brandProfile.services.join(' ').toLowerCase();

    const mentionsServices = services.split(' ').some(service =>
      service.length > 3 && contentText.includes(service)
    );

    if (!mentionsServices && !contentText.includes(businessTypeLower)) {
      issues.push('Content does not relate to business services or type');
      isBusinessSpecific = false;
    }
  }

  return { isBusinessSpecific, issues };
}

/**
 * Generate fallback hashtags based on platform requirements
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

/**
 * Validate and optimize CTA selection
 */
function validateAndOptimizeCTA(
  aiGeneratedCTA: string,
  enhancedCTA: string,
  businessType: string,
  platform: string
): string {
  // Generic CTAs that should be replaced
  const genericCTAs = [
    'learn more', 'contact us', 'get started', 'click here', 'find out more',
    'discover more', 'see more', 'read more', 'choose us', 'visit us'
  ];

  // Check if AI-generated CTA is generic
  const isGeneric = !aiGeneratedCTA ||
    genericCTAs.some(generic => aiGeneratedCTA.toLowerCase().includes(generic));

  // Check if AI-generated CTA is business-appropriate
  const isBusinessAppropriate = isBusinessAppropriateCTA(aiGeneratedCTA, businessType);

  // Use enhanced CTA if AI CTA is generic or inappropriate
  if (isGeneric || !isBusinessAppropriate) {
    console.log('🔄 [Revo 1.5] Using enhanced CTA due to generic/inappropriate AI CTA');
    return EnhancedCTAGenerator.generatePlatformSpecificCTA(enhancedCTA, platform);
  }

  // Use AI-generated CTA if it's specific and appropriate
  return EnhancedCTAGenerator.generatePlatformSpecificCTA(aiGeneratedCTA, platform);
}

/**
 * Check if CTA is appropriate for business type
 */
function isBusinessAppropriateCTA(cta: string, businessType: string): boolean {
  if (!cta) return false;

  const type = businessType.toLowerCase();
  const ctaLower = cta.toLowerCase();

  // Restaurant/Food business should have booking/ordering CTAs
  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) {
    return ctaLower.includes('book') || ctaLower.includes('order') ||
      ctaLower.includes('reserve') || ctaLower.includes('table');
  }

  // Service businesses should have booking/scheduling CTAs
  if (type.includes('salon') || type.includes('spa') || type.includes('fitness') ||
    type.includes('medical') || type.includes('dental')) {
    return ctaLower.includes('book') || ctaLower.includes('schedule') ||
      ctaLower.includes('appointment') || ctaLower.includes('session');
  }

  // Retail businesses should have shopping CTAs
  if (type.includes('retail') || type.includes('store') || type.includes('shop') ||
    type.includes('electronics') || type.includes('fashion')) {
    return ctaLower.includes('shop') || ctaLower.includes('buy') ||
      ctaLower.includes('browse') || ctaLower.includes('view');
  }

  // Professional services should have consultation CTAs
  if (type.includes('consulting') || type.includes('legal') || type.includes('financial')) {
    return ctaLower.includes('schedule') || ctaLower.includes('consult') ||
      ctaLower.includes('meeting') || ctaLower.includes('call');
  }

  // If we can't determine, assume it's appropriate
  return true;
}

/**
 * Validate word count for headlines and subheadlines
 */
function validateWordCount(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }

  const truncated = words.slice(0, maxWords).join(' ');
  console.log(`⚠️ [Enhanced Simple AI] Text truncated from ${words.length} to ${maxWords} words: "${truncated}"`);
  return truncated;
}

/**
 * Generate Enhanced Simple Content (NO hardcoded patterns - last resort fallback)
 */
async function generateEnhancedSimpleContent(
  businessType: string,
  businessName: string,
  platform: string,
  brandProfile: any,
  useLocalLanguage: boolean = false
): Promise<{
  caption: string;
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {
    console.log('🔧 [Enhanced Simple AI] Generating content with NO hardcoded patterns for:', {
      businessName,
      businessType,
      platform,
      useLocalLanguage
    });

    // Platform-specific hashtag count
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

    // Enhanced prompt with product intelligence and cultural context
    const prompt = `Create marketing content for ${businessName} (${businessType}) on ${platform}.

Business: ${businessName}
Type: ${businessType}
Services: ${brandProfile.services || 'Professional services'}
Location: ${brandProfile.location || 'Not specified'}
Target Audience: ${brandProfile.targetAudience || 'General customers'}
Platform: ${platform}

REQUIREMENTS:
1. Use SPECIFIC product names, models, and pricing
2. Include LOCAL cultural references and language
3. Mention WHY choose this business over competitors
4. Include REAL numbers, testimonials, or achievements
5. Provide SPECIFIC contact methods and locations

BANNED PHRASES (DO NOT USE):
- "wide range of products" / "comprehensive solutions"
- "quality at an affordable price" / "best value"
- "we understand that" / "we know that"
- "revolutionize your" / "transform your"
- "experience the future" / "embrace innovation"
- "redefining" / "cutting-edge"
- "innovative approach" / "next-generation"
- "staying connected" / "staying ahead"
- "wide selection" / "extensive range"
- "premium quality" / "superior quality"
- "upgrade your" / "enhance your"
- "unlock potential" / "unlock possibilities"
- "fuel your" / "power your"
- "empower your" / "elevate your"
- "partners in" / "tools for"
- "exceptional work" / "exceptional results"
- "perfect blend" / "perfect combination"

MANDATORY ELEMENTS:
- SPECIFIC product names (e.g., "Samsung Galaxy S23 Ultra", "iPhone 15 Pro")
- EXACT pricing (e.g., "KSh 120,000", "Lipa Pole Pole available")
- LOCAL references (e.g., "M-Pesa payments", "Nairobi delivery")
- COMPETITIVE advantages (e.g., "vs Safaricom Shop", "genuine warranty")
- SOCIAL proof (e.g., "500+ customers", "3 years in business")
- CONTACT info (e.g., "WhatsApp +254", "Visit Bazaar Plaza")
- LOCATION details (e.g., "Nairobi CBD", "Bazaar Plaza 10th Floor")

Respond with ONLY valid JSON:
{
  "headline": "Specific, benefit-driven headline (MAX 6 WORDS)",
  "subheadline": "Supporting subheadline with specific features, numbers, or social proof (MAX 14 WORDS)",
  "callToAction": "Actionable call-to-action with specific next steps",
  "caption": "Engaging caption with specific products, pricing, and cultural context",
  "hashtags": [${Array(hashtagCount).fill('"#relevant"').join(', ')}]
}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You are an expert content creator who creates authentic, business-specific content.

STRICT RULES:
- NEVER use these overused words: upgrade, transform, revolutionize, solutions, excellence, premium, ultimate, cutting-edge, innovative, breakthrough, game-changer, elevate, empower, unlock, discover
- ALWAYS be specific to the actual business and services
- ALWAYS use natural, conversational language
- ALWAYS make content feel like a real person wrote it
- ALWAYS focus on real, tangible benefits
- Generate exactly ${hashtagCount} hashtags for ${platform}
- Vary your approach - don't repeat the same patterns
- Be creative and authentic for each business`
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.8, // Increase creativity
      max_tokens: 600
    });

    let responseContent = response.choices[0].message.content || '{}';

    // Clean up response
    if (responseContent.includes('```json')) {
      responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.split('```')[1] || responseContent;
    }

    const parsed = JSON.parse(responseContent);

    // Ensure correct hashtag count
    if (parsed.hashtags && parsed.hashtags.length !== hashtagCount) {
      if (parsed.hashtags.length > hashtagCount) {
        parsed.hashtags = parsed.hashtags.slice(0, hashtagCount);
      } else {
        // Add simple, relevant hashtags
        const simpleHashtags = [`#${businessType.toLowerCase().replace(/\s+/g, '')}`, '#local', '#business', '#quality', '#professional'];
        while (parsed.hashtags.length < hashtagCount && simpleHashtags.length > 0) {
          const tag = simpleHashtags.shift();
          if (tag && !parsed.hashtags.includes(tag)) {
            parsed.hashtags.push(tag);
          }
        }
      }
    }

    console.log('✅ [Enhanced Simple AI] Content generated successfully:', {
      headline: parsed.headline,
      hashtagCount: parsed.hashtags?.length || 0,
      businessSpecific: true
    });

    // Validate and adjust word counts
    const validatedHeadline = this.validateWordCount(parsed.headline || `${businessName} Excellence`, 6);
    const validatedSubheadline = this.validateWordCount(parsed.subheadline || `Quality ${businessType.toLowerCase()} services you can trust`, 14);

    return {
      caption: parsed.caption || `${businessName} provides excellent ${businessType.toLowerCase()} services. Contact us to learn more about what we can do for you.`,
      hashtags: parsed.hashtags || [`#${businessType.toLowerCase().replace(/\s+/g, '')}`, '#local', '#business'].slice(0, hashtagCount),
      headline: validatedHeadline,
      subheadline: validatedSubheadline,
      callToAction: parsed.callToAction || 'Contact Us'
    };

  } catch (error) {
    console.error('❌ [Enhanced Simple AI] Content generation failed:', error);

    // Ultimate fallback with NO hardcoded patterns
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
    const simpleHashtags = [
      `#${businessType.toLowerCase().replace(/\s+/g, '')}`,
      '#local',
      '#business',
      '#quality',
      '#professional'
    ].slice(0, hashtagCount);

    return {
      caption: `${businessName} is your trusted ${businessType.toLowerCase()} partner. We're committed to providing excellent service and results.`,
      hashtags: simpleHashtags,
      headline: `${businessName} Quality`,
      subheadline: `Professional ${businessType.toLowerCase()} services`,
      callToAction: 'Get Started'
    };
  }
}

/**
 * Generate content using Pure AI (ZERO hardcoding)
 */
async function generatePureAIContent(
  businessType: string,
  businessName: string,
  platform: string,
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
    console.log('🧠 [Pure AI] Generating content with ZERO hardcoding for:', {
      businessName,
      businessType,
      platform,
      useLocalLanguage
    });

    // Prepare context for Pure AI
    const services = Array.isArray(brandProfile.services)
      ? brandProfile.services.join(', ')
      : brandProfile.services || `${businessType} services`;

    const pureAIRequest: PureAIRequest = {
      businessType,
      businessName,
      services,
      platform,
      contentType: 'all',
      targetAudience: brandProfile.targetAudience,
      location: brandProfile.location,
      websiteUrl: brandProfile.websiteUrl,
      brandContext: {
        colors: [brandProfile.primaryColor, brandProfile.secondaryColor].filter(Boolean),
        personality: brandProfile.brandPersonality,
        values: brandProfile.brandValues
      }
    };

    // Let Minimal AI make ALL decisions with product intelligence
    const aiResult = await WorkingPureAIContentGenerator.generateContent(pureAIRequest);

    console.log('✅ [Pure AI] Content generated successfully:', {
      headline: aiResult.content.headline,
      cta: aiResult.content.cta,
      confidence: aiResult.confidence,
      reasoning: aiResult.strategic_reasoning?.substring(0, 100) + '...'
    });

    return {
      caption: aiResult.content.caption,
      hashtags: aiResult.content.hashtags,
      headline: aiResult.content.headline,
      subheadline: aiResult.content.subheadline,
      callToAction: aiResult.content.cta
    };

  } catch (error) {
    console.error('❌ [Pure AI] Content generation failed:', error);
    console.error('❌ [Pure AI] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      businessName,
      businessType,
      platform
    });

    // Re-throw error to let the main system handle fallbacks
    throw new Error(`Pure AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  brandProfile: any,
  trendingData: any = { trendingHashtags: [], currentEvents: [] },
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

    console.log('🔄 [Revo 1.5] FRESH SCHEDULED SERVICES CHECK:', {
      timestamp: new Date().toISOString(),
      receivedScheduledServices: scheduledServices?.length || 0,
      receivedServiceNames: scheduledServices?.map(s => s.serviceName) || [],
      todaysServicesReceived: scheduledServices?.filter(s => s.isToday).length || 0,
      upcomingServicesReceived: scheduledServices?.filter(s => s.isUpcoming).length || 0
    });

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

    console.log('🔍 [Revo 1.5] Final trending context (FRESH DATA):', {
      timestamp: new Date().toISOString(),
      hasScheduledServices: !!(scheduledServices && scheduledServices.length > 0),
      scheduledServicesCount: scheduledServices?.length || 0,
      todaysServicesCount: scheduledServices?.filter(s => s.isToday).length || 0,
      upcomingServicesCount: scheduledServices?.filter(s => s.isUpcoming).length || 0,
      scheduledServiceNames: scheduledServices?.map(s => s.serviceName) || [],
      todaysServiceNames: scheduledServices?.filter(s => s.isToday).map(s => s.serviceName) || [],
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

    // Apply Cultural Intelligence System
    const culturalContent = CulturalIntelligenceService.generateCulturalContent(
      businessName,
      businessType,
      brandProfile.location || 'USA',
      useLocalLanguage
    );

    console.log('🌍 [Revo 1.5] Cultural Intelligence Applied:', {
      location: brandProfile.location,
      culturalContext: culturalContent.culturalContext,
      useLocalLanguage,
      headlinesGenerated: culturalContent.headlines.length,
      subheadlinesGenerated: culturalContent.subheadlines.length
    });

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
- Services: ${brandProfile.services || 'Business services'}
- Target Audience: ${brandProfile.targetAudience || 'General audience'}
- Design Concept: ${designPlan?.concept || 'Professional business content'}
- Key Elements: ${designPlan?.keyElements?.join(', ') || 'Modern design elements'}
${languageInstruction}

ADAPT CONTENT TO THIS SPECIFIC BUSINESS:
- Use the EXACT business name "${businessName}" naturally in content
- Reference the SPECIFIC business type "${businessType}" and its unique challenges
- Include ACTUAL services offered: ${brandProfile.services || 'the services provided'}
- Target the REAL audience: ${brandProfile.targetAudience || 'the target customers'}
- Use LOCATION context: ${brandProfile.location || 'the local area'} when relevant
- Address INDUSTRY-SPECIFIC pain points for ${businessType} businesses
- Use terminology and language appropriate for ${businessType} industry

CULTURAL INTELLIGENCE INTEGRATION:
- Cultural Context: ${culturalContent.culturalContext}
- Use these culturally-adapted headlines as inspiration: ${culturalContent.headlines.join(', ')}
- Use these culturally-adapted subheadlines as inspiration: ${culturalContent.subheadlines.join(', ')}
- Use these culturally-adapted CTAs as inspiration: ${culturalContent.ctas.join(', ')}
- Apply cultural communication style and values appropriate for ${brandProfile.location || 'the location'}
- Include location-specific trust signals and social proof patterns

🌟 PRODUCT-LIFESTYLE INTEGRATION STRATEGY (CRITICAL - BALANCED APPROACH):
Content Approach: ${businessAnalysis.contentApproach}
${businessAnalysis.naturalContextStrategy ? `
BALANCED SCENARIOS (40% Product Demo, 30% Lifestyle, 20% Features, 10% Community) - Choose ONE scenario:
${businessAnalysis.naturalContextStrategy.primaryScenarios.map((scenario, index) => `
${index + 1}. ${scenario.context} [${scenario.contentBalance?.toUpperCase()}]:
   Scenario: ${scenario.scenario}
   User Behavior: ${scenario.userBehavior}
   Product Function: ${scenario.productFunction || 'Core product functionality'}
   Real Benefit: ${scenario.realBenefit || 'Tangible user benefit'}
   Authentic Use: ${scenario.authenticUse || 'Real product interaction'}
   Emotional Trigger: ${scenario.emotionalTrigger}
   Natural Integration: ${scenario.naturalIntegration}
   Cultural Relevance: ${scenario.culturalRelevance || 'Universal appeal'}`).join('')}

CONTEXTUAL APPROACHES TO USE:
${businessAnalysis.naturalContextStrategy.contextualApproaches.map(approach => `- ${approach}`).join('\n')}

LIFESTYLE TOUCHPOINTS:
${businessAnalysis.naturalContextStrategy.lifestyleTouchpoints.map(touchpoint => `- ${touchpoint}`).join('\n')}

AUTHENTIC USE CASES:
${businessAnalysis.naturalContextStrategy.authenticUseCases.map(useCase => `- ${useCase}`).join('\n')}

BEHAVIORAL PATTERNS:
${businessAnalysis.naturalContextStrategy.behavioralPatterns.map(pattern => `- ${pattern}`).join('\n')}

EMOTIONAL CONNECTIONS:
${businessAnalysis.naturalContextStrategy.emotionalConnections.map(emotion => `- ${emotion}`).join('\n')}
` : ''}

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

🎯 CRITICAL PRODUCT-CONTENT ALIGNMENT (MANDATORY):
The IMAGE must EXACTLY match the CONTENT being generated:
- IF content is about "YOUR desk setup" → IMAGE must show HOME OFFICE/DESK setup
- IF content mentions "individual professionals" → IMAGE must show SOLO person, NOT groups
- IF content promotes specific PRODUCT → IMAGE must show that EXACT product prominently
- IF content says "home workers" → IMAGE must show HOME environment, NOT corporate office
- NEVER show corporate meetings when content is about personal/individual use
- NEVER show office buildings when content is about home/desk setups
- ALWAYS show the ACTUAL product being promoted in the content
- ALWAYS match the SETTING described in the content (home vs office vs store)
- ALWAYS match the AUDIENCE described in the content (individual vs team vs family)

CRITICAL CONTENT-IMAGE ALIGNMENT RULE: The image MUST visually represent exactly what the content describes

Example of GOOD Content-Image Alignment:
- Content: "Your Desk, Your Kenyan Hustle" (Logitech keyboard for home workers)
- Image: Person at HOME desk using Logitech keyboard, home environment visible
- Shows: INDIVIDUAL person, HOME setting, ACTUAL product (keyboard/mouse)
- Matches: Personal desk setup, solo worker, product prominently featured

Example of BAD Content-Image Mismatch:
- Content: "Your Desk, Your Kenyan Hustle" (individual home office setup)
- Image: Corporate boardroom with 5 people in office building
- Problem: Content says "YOUR desk" but shows corporate meeting
- Problem: Content targets home workers but shows office environment
- Problem: No product visible despite being product-focused content

Example of BAD Direct Promotion:
- Headline: "Best Smartphone Camera"
- Subheadline: "Professional photos with advanced features"
- CTA: "Buy Now"
- Context: Direct sales pitch without lifestyle context

Create CONTENT-ALIGNED VISUAL content:
1. A product-in-action caption (2-3 sentences max) that:
   - SHOWS specific product/service being used in the natural scenario
   - DESCRIBES the authentic product interaction and its benefit
   - CAPTURES the emotional trigger while highlighting product value
   - DEMONSTRATES real product function solving a real need
   - FEELS like authentic user experience sharing, not advertising
   - USES product-integrated storytelling: "Using [product feature] to...", "The [specific function] helped us...", "[Product] made it possible to..."
   - AVOIDS vague lifestyle scenes: Must show actual product use
   - BALANCES scenarios: product demos (40%), lifestyle integration (30%), feature benefits (20%), community (10%)

2. A compelling headline (5-8 words max) that:
   - ANALYZE the business and determine what makes them unique or valuable
   - CREATE headlines that capture attention and generate interest
   - AVOID repetitive words or phrases from recent content
   - BE SPECIFIC to this business, not generic
   - MAKE INTELLIGENT DECISIONS about what will resonate with their audience
   - CONSIDER the business context and what customers really want
   - USE fresh, engaging language that stands out
   - FOCUS on benefits, outcomes, or compelling value propositions
   - AVOID overused marketing words like "effortless", "solutions", "excellence"
   - THINK creatively about what would make someone stop scrolling

3. A product-function subheadline (8-15 words) that:
   - EXPLAINS HOW the product delivers the benefit mentioned in headline
   - SHOWS the specific product function or feature in action
   - DESCRIBES the authentic product interaction that creates value
   - MAINTAINS natural tone while highlighting product capability
   - VARIES PRODUCT FUNCTIONS: core features, unique capabilities, user experience benefits
   - FEATURE DEMONSTRATION: "HD video calls make family time feel like being together"
   - CAPABILITY HIGHLIGHT: "Portrait mode captures professional family photos instantly"
   - USER EXPERIENCE: "All-day battery keeps you connected during adventures"
   - FUNCTION BENEFIT: "Smart assistant organizes your entire morning routine"
   - QUALITY OUTCOME: "Advanced camera turns everyday moments into memories"
   - EFFICIENCY GAIN: "Fast charging gives you hours of power in minutes"
   - EASE OF USE: "Intuitive interface makes video calling effortless for everyone"
   - ALWAYS connect product function to real user benefit - show the "how"

4. A business-specific CTA (2-4 words) that:
   - ANALYZE the business type and services to determine their PRIMARY conversion goal
   - USE action verbs that match what customers actually do with this business
   - BE SPECIFIC to their services, not generic
   - MAKE INTELLIGENT DECISIONS based on business context:
     * Banking business → "Open Account" (not "Learn More")
     * Restaurant with delivery → "Order Now" (not "Reserve Table")
     * Salon → "Book Session" (not "Contact Us")
     * Software with trial → "Try Free" (not "Buy Now")
   - PLATFORM CONSIDERATIONS:
     * Instagram: Short, punchy (2-3 words)
     * LinkedIn: Professional, action-oriented
     * Facebook: Clear, descriptive
   - AVOID generic CTAs unless they truly fit the business model
   - THINK about what action the customer would naturally take next
5. 10 lifestyle-focused hashtags that are:
   - RELATED to the natural lifestyle scenario, not direct business promotion
   - MIX of lifestyle themes, community aspects, and authentic experiences
   - INCLUDE trending hashtags that relate to the lifestyle context
   - AVOID promotional hashtags like #BestService, #ChooseUs, #Professional
   - FOCUS on lifestyle themes: #FamilyTraditions, #DailyRituals, #CommunityLife, #AuthenticMoments
   - LOCATION-BASED lifestyle: #LocalLife, #CommunityGathering, #NeighborhoodFavorite
   - EMOTIONAL CONNECTIONS: #MakingMemories, #LifesMoments, #SimpleJoys, #Belonging
   - NATURAL INTEGRATION: Show hashtags that people would naturally use when sharing these moments
   - DISCOVERABLE by people interested in the lifestyle, not just the business category
   - APPROPRIATE for ${platform} and the natural context

Make the content feel like authentic lifestyle documentation, not business advertising.
The headline, subheadline, and CTA will be displayed directly on the design image.
Focus on creating content that people would naturally share about their real life experiences.

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

🎯 FINAL CONTENT-IMAGE ALIGNMENT CHECKLIST:
✅ MATCH setting: If content mentions "home office" → show home office, NOT corporate office
✅ MATCH audience: If content says "individual" → show solo person, NOT group meetings
✅ MATCH product: If content promotes specific product → show that exact product prominently
✅ MATCH context: If content says "your desk" → show personal desk setup, NOT boardroom
✅ AVOID mismatches: Corporate scenes for home-focused content, groups for individual content
✅ INCLUDE ${businessName} product/service exactly as described in the content
✅ GENERATE images that visually represent the exact scenario described in content
✅ EMPHASIZE visual consistency between what content says and what image shows

CRITICAL SUCCESS CRITERIA FOR CONTENT-IMAGE ALIGNMENT:
- Image should visually match exactly what the content describes
- Headlines should be reflected in the visual scene shown in the image
- Subheadlines should describe what's actually visible in the image
- CTAs should relate to the action/scenario shown in the image
- Overall approach should be perfect visual representation of written content
- NEVER create images that contradict the content messaging
- ALWAYS show the exact scenario, setting, and context described in the content
- AVOID generic content: Every piece should feel tailored to this exact business
- AVOID template phrases: No "your business", "our company", "we provide", "contact us"
- USE the business analysis: Let the identified approach, pain points, and value props guide your content
- BE AUTHENTIC: Content should reflect the business's actual strengths and positioning
- VARY your approach: Use different angles, but always relevant to this business
- AVOID repetitive patterns: Each generation should feel fresh and unique
- STAY RELEVANT: Connect content to current trends and local context when appropriate
- CREATIVE VARIATION: Same business info, different angles - pain-focused, benefit-focused, social proof, urgency, curiosity, comparison, fear-based, success stories, emotional appeals, time-sensitive, location-pride, challenge-based, testimonial-style, competitive, aspirational
- ROTATE MESSAGING: "What if...", "Stop...", "Join...", "Before vs After", "Don't miss...", "Why wait...", "Imagine...", "How many...", "Are you still...", "Think it's impossible?", "Ready to...", "Tired of...", "What would happen if...", "The secret to...", "Finally...", "Never again..."

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
- FITNESS: "Achieve Your Fitness Goals!" + "Join 5,000+ people who've already changed their lives"
- TECH: "${businessName} Innovation!" + "Experience the technology that's changing everything"
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

    // Platform-specific hashtag requirements
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
    const hashtagInstruction = `Generate exactly ${hashtagCount} hashtags for ${platform} (${platform.toLowerCase() === 'instagram' ? 'Instagram requires 5 hashtags' : 'Facebook, Twitter, LinkedIn require 3 hashtags'})`;

    const updatedPrompt = prompt.replace(
      '5. 10 highly relevant, specific hashtags that are:',
      `5. ${hashtagCount} highly relevant, specific hashtags that are:`
    ).replace(
      'hashtags: ["#SpecificHashtag1", "#LocationBasedHashtag", "#IndustryRelevant", ...]',
      `hashtags: [${Array(hashtagCount).fill('"#SpecificHashtag"').join(', ')}] (EXACTLY ${hashtagCount} hashtags for ${platform})`
    );

    console.log(`🎯 [Revo 1.5] Using GPT-4o for content generation with ${hashtagCount} hashtags for ${platform}`);
    console.log('🔑 [Revo 1.5] OpenAI API Key check:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You are a direct-response copywriter for Revo 1.5. COHERENCE RULE: Headline + Subheadline + CTA must tell ONE complete story. VARIETY RULE: Never repeat the same subheadline approach - always vary between social proof, benefits, transformation, credibility, etc. ADAPT TO EACH COMPANY: Use their exact business name, industry, services, location, and target audience. FORBIDDEN WORDS (NEVER USE): transform, unlock, discover, revolutionize, solutions, elevate, empower, cutting-edge, innovative, future, advanced, premium, exclusive, ultimate, breakthrough, game-changer, journey, experience, excellence, why choose us, start your, connect with us. Focus on specific problems, quantified benefits, and social proof. ${hashtagInstruction}`
      }, {
        role: 'user',
        content: `FORBIDDEN WORDS (DO NOT USE): transform, unlock, discover, revolutionize, solutions, elevate, empower, cutting-edge, innovative, future, advanced, premium, exclusive, ultimate, breakthrough, game-changer\n\nHEADLINE FORMAT VARIETY: Avoid rigid "${businessName}:" prefix. Use natural formats like:\n- Problem-focused: "Tired of Manual Processes?"\n- Solution-focused: "Process Loans in 3 Minutes"\n- Question format: "Still Using Paper Forms?"\n- Stat-focused: "50+ SACCOs Choose Digital"\n- Curiosity: "What Takes 3 Minutes?"\n- Urgency: "Don't Lose Another Member"\n- Comparison: "Paper vs Digital Processing"\n- Benefit: "Cut Wait Times 90%"\n- Fear: "Members Switching to Faster SACCOs?"\n- Success Story: "How 50+ SACCOs Went Digital"\n- Challenge: "Think 3-Minute Loans Are Impossible?"\n- Emotional: "Happy Members, Happy SACCO"\n- Time-based: "From Hours to Minutes"\n- Location: "Kenya's Fastest SACCO System"\n- Integrate business name naturally within headline, not as prefix\n\n${updatedPrompt}`
      }],
      temperature: 0.8,
      max_tokens: 800
    });

    console.log('✅ [Revo 1.5] GPT-4o response received for content generation (headlines, captions, hashtags, CTAs)');

    try {
      let responseContent = response.choices[0].message.content || '{}';
      console.log('🔍 [Revo 1.5] Raw GPT response:', responseContent.substring(0, 500));

      // Clean up the response if it has markdown formatting
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1] || responseContent;
      }

      console.log('🧹 [Revo 1.5] Cleaned response:', responseContent.substring(0, 300));
      const parsed = JSON.parse(responseContent);
      console.log('✅ [Revo 1.5] Successfully parsed JSON response');

      // Validate hashtag count
      const expectedHashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;
      if (parsed.hashtags && parsed.hashtags.length !== expectedHashtagCount) {
        console.warn(`⚠️ [Revo 1.5] Hashtag count mismatch: expected ${expectedHashtagCount} for ${platform}, got ${parsed.hashtags.length}`);
        // Adjust hashtag count
        if (parsed.hashtags.length > expectedHashtagCount) {
          parsed.hashtags = parsed.hashtags.slice(0, expectedHashtagCount);
        } else {
          // Add generic hashtags to reach required count
          const genericHashtags = ['#business', '#professional', '#quality', '#service', '#local'];
          while (parsed.hashtags.length < expectedHashtagCount && genericHashtags.length > 0) {
            parsed.hashtags.push(genericHashtags.shift()!);
          }
        }
      }

      console.log('✅ [Revo 1.5] Content generation successful:', {
        caption: parsed.caption?.substring(0, 100) + '...',
        headline: parsed.headline || 'No headline',
        subheadline: parsed.subheadline?.substring(0, 50) + '...' || 'No subheadline',
        callToAction: parsed.callToAction || 'No CTA',
        hashtagsCount: parsed.hashtags?.length || 0,
        hashtags: parsed.hashtags || [],
        platform: platform,
        expectedHashtags: expectedHashtagCount
      });

      // VALIDATION: Check content quality and business specificity
      const contentQuality = validateContentQuality(parsed, businessName, businessType, brandProfile);
      if (!contentQuality.isBusinessSpecific) {
        console.warn('⚠️ [Revo 1.5] Content appears generic, enhancing with business details');
        // Enhance generic content with business specifics
        if (parsed.headline && !parsed.headline.includes(businessName)) {
          parsed.headline = `${businessName}: ${parsed.headline}`;
        }
        if (parsed.caption && !parsed.caption.toLowerCase().includes(businessName.toLowerCase())) {
          parsed.caption = `${parsed.caption} Experience the difference with ${businessName}.`;
        }
      }

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

      // Generate business-specific CTA using enhanced generator
      const ctaContext: CTAGenerationContext = {
        businessType,
        businessName,
        services: brandProfile.services || 'Professional services',
        platform,
        contentScenario: designPlan?.concept || 'business showcase',
        targetAudience: brandProfile.targetAudience,
        location: brandProfile.location,
        productFunction: parsed.productFunction,
        realBenefit: parsed.realBenefit
      };

      const enhancedCTA = EnhancedCTAGenerator.generateBusinessSpecificCTA(ctaContext);

      // Use AI-generated CTA if it's business-specific, otherwise use enhanced generator
      const finalCTA = validateAndOptimizeCTA(
        parsed.callToAction,
        enhancedCTA.primary,
        businessType,
        platform
      );

      console.log('🎯 [Revo 1.5] CTA Selection:', {
        aiGenerated: parsed.callToAction,
        enhanced: enhancedCTA.primary,
        final: finalCTA,
        reasoning: enhancedCTA.reasoning
      });

      // NO FALLBACKS - All content must come from Pure AI
      if (!parsed.caption || !parsed.headline || !parsed.subheadline || !parsed.hashtags) {
        throw new Error('🚫 [Revo 1.5] Pure AI response incomplete - missing required fields. No fallbacks allowed!');
      }

      return {
        caption: parsed.caption,
        headline: parsed.headline,
        subheadline: parsed.subheadline,
        callToAction: finalCTA,
        hashtags: parsed.hashtags
      };
    } catch (parseError) {
      console.error('❌ [Revo 1.5] JSON Parse Error:', parseError);
      console.error('❌ [Revo 1.5] Failed response content:', response.choices[0].message.content);

      // NO FALLBACKS - JSON parsing must work or system fails
      throw new Error(`🚫 [Revo 1.5] JSON parsing failed and ALL fallbacks are disabled. Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Please fix the Pure AI system!`);
    }
  } catch (error) {
    console.error('❌ [Revo 1.5] Content generation failed - MAIN ERROR:', error);
    console.error('❌ [Revo 1.5] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [Revo 1.5] Error message:', error instanceof Error ? error.message : String(error));

    // NO FALLBACKS - Main content generation must work or system fails
    throw new Error(`🚫 [Revo 1.5] Main content generation failed and ALL fallbacks are disabled. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please fix the Pure AI system!`);
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
  format?: string;
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
4. **Layered Depth**: Multiple transparent layers, subtle shadows, natural depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with natural overlays, realistic effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest natural user engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Natural-Professional**: Clean business aesthetics, natural materials, authentic lighting

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

BUSINESS-TYPE VISUAL REQUIREMENTS (MANDATORY):
- If business type indicates E-commerce: MUST show product with packaging and brand logo visible in-scene (not overlaid), clean background, subtle shadow, and a contextual prop that matches use-case.
- If App/Software: MUST show a realistic device screen with the interface visible and a hand/user interaction; include brand colors in UI elements.
- If Food: MUST show the actual dish/product, a natural consumption scenario, steam/texture details, and people enjoying when appropriate.
- If Services: MUST show before/after or the service in action with tools/equipment visible; avoid generic stock meeting scenes.
- Always include brand colors and respect the aspect ratio and text blocks for headline/subheadline/CTA.


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
        model: 'gemini-2.5-flash-image-preview', // Use the model that works with Revo 1.5 API key
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

            // Extract normalized base64 data with proper error handling
            let normalizedBase64: string;
            if (normalizedLogo && normalizedLogo.dataUrl) {
              normalizedBase64 = normalizedLogo.dataUrl.split(',')[1];
            } else {
              // Fallback: use original logo data if normalization failed
              console.warn('⚠️ [Revo 1.5] Logo normalization failed, using original');
              normalizedBase64 = logoBase64Data;
            }

            generationParts.push({
              inlineData: {
                data: normalizedBase64,
                mimeType: 'image/png'
              }
            });

            // Get AI prompt instructions for normalized logo
            const logoInstructions = normalizedLogo ? LogoNormalizationService.getLogoPromptInstructions(normalizedLogo) : '';

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

  // Apply Cultural Intelligence for Visual Adaptation
  const visualInstructions = CulturalIntelligenceService.getVisualInstructions(
    input.brandProfile.location || 'USA',
    input.businessType
  );

  const targetMarketInstructions = getTargetMarketInstructions(
    input.brandProfile.location || '',
    input.businessType,
    input.brandProfile.targetAudience || '',
    input.includePeopleInDesigns !== false, // Default to true if not specified
    input.useLocalLanguage === true // Default to false if not specified
  );

  console.log('🎨 [Revo 1.5] Cultural Visual Instructions Applied:', {
    location: input.brandProfile.location,
    businessType: input.businessType,
    visualInstructionsLength: visualInstructions.length
  });

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
🎯 CRITICAL CONTENT-IMAGE ALIGNMENT REQUIREMENTS:
- The IMAGE must visually represent exactly what these text elements describe:
- PRIMARY HEADLINE: "${contentResult.headline}" → Image must show this scenario/benefit
- SECONDARY SUBHEADLINE: "${contentResult.subheadline}" → Image must demonstrate this feature/context
- CALL-TO-ACTION: "${contentResult.callToAction}" → Image must show the action/setting this CTA relates to

🚨 MANDATORY VISUAL MATCHING:
- IF headline mentions "your desk" → SHOW personal desk setup, NOT corporate office
- IF headline mentions "home office" → SHOW home environment, NOT office building
- IF headline mentions individual/personal → SHOW solo person, NOT group meetings
- IF headline mentions specific product → SHOW that exact product prominently
- IF subheadline describes a feature → SHOW that feature being used in the image
- IF CTA is about booking/buying → SHOW the product/service being offered

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

${visualInstructions}

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
✨ NATURAL MODERN AESTHETICS: Clean, professional design that looks human-created
🎨 BALANCED COMPOSITION: Well-structured layouts with natural visual hierarchy
🌈 AUTHENTIC COLOR PSYCHOLOGY: Natural color schemes that feel genuine
📝 PROFESSIONAL TYPOGRAPHY: Clean font combinations with proper spacing
🏢 ORGANIC BRAND FUSION: Brand elements integrated naturally into real scenarios
📱 PLATFORM-OPTIMIZED DESIGN: Clean visuals optimized for ${input.platform}
🎯 AUTHENTIC STORYTELLING: Real-world scenarios that build genuine connection
✨ NATURAL VISUAL DEPTH: Subtle shadows and realistic lighting effects
🚀 TIMELESS AESTHETICS: Classic design principles that remain effective
💫 REALISTIC INTERACTIONS: Design elements that suggest natural user engagement

❌ CRITICAL VISUAL RESTRICTIONS - NEVER INCLUDE:
❌ Glowing AI portals and tech visualizations
❌ Perfect corporate stock scenarios
❌ Overly dramatic lighting effects
❌ Artificial neon glows or sci-fi elements
❌ Generic stock photo poses
❌ Unrealistic perfect lighting setups
❌ AI-generated abstract patterns
❌ Futuristic tech interfaces
❌ Holographic or digital overlays

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

    // Step 2: Generate content using Claude Sonnet 4 (PRIMARY AND ONLY SYSTEM - NO FALLBACKS)
    console.log('🧠 [Revo 1.5] Generating content with Claude Sonnet 4...');

    // Check if Claude API key is available
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    if (!claudeKey) {
      throw new Error('🚫 [Revo 1.5] Claude Sonnet 4 unavailable - ANTHROPIC_API_KEY not found. Please configure ANTHROPIC_API_KEY to use Revo 1.5.');
    }

    console.log('🔑 [Revo 1.5] Claude API Key Status:', {
      hasClaudeKey: !!claudeKey,
      claudeKeyPrefix: claudeKey.substring(0, 10) + '...'
    });

    // Build services string robustly from scraped brand services (could be string | string[] | object[])
    const rawServices: any = (input.brandProfile as any).services;
    let servicesStr = '';
    if (Array.isArray(rawServices)) {
      if (rawServices.length > 0 && typeof rawServices[0] === 'object') {
        servicesStr = rawServices
          .map((s: any) => [s.name, s.description, s.price ? String(s.price) : ''].filter(Boolean).join(' - '))
          .join('; ');
      } else {
        servicesStr = (rawServices as any[]).filter(Boolean).join(', ');
      }
    } else {
      servicesStr = rawServices || `${input.businessType} services`;
    }

    const claudeRequest: ClaudeContentRequest = {
      businessType: input.businessType,
      businessName: input.brandProfile.businessName || input.businessType,
      services: servicesStr,
      platform: input.platform,
      targetAudience: input.brandProfile.targetAudience,
      location: input.brandProfile.location,
      useLocalLanguage: input.useLocalLanguage === true,
      brandProfileId: (input.brandProfile as any).id,
      brandContext: {
        colors: [input.brandProfile.primaryColor, input.brandProfile.accentColor].filter(Boolean),
        personality: input.brandProfile.brandPersonality,
        values: input.brandProfile.brandValues
      }
    } as any;
    // Preserve raw services for deeper parsing in the generator
    (claudeRequest as any).servicesRaw = rawServices;

    const claudeResult = await ClaudeSonnet4Generator.generateContent(claudeRequest);

    const contentResult = {
      caption: claudeResult.caption,
      hashtags: claudeResult.hashtags,
      headline: claudeResult.headline,
      subheadline: claudeResult.subheadline,
      callToAction: claudeResult.cta
    };

    enhancementsApplied.push('Claude Sonnet 4 Content Generation');
    console.log('✅ [Revo 1.5] Claude Sonnet 4 content generation successful');
    console.log('🎯 [Revo 1.5] CONTENT SYSTEM USED: Claude Sonnet 4 (Primary - No Fallbacks)');

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
      generationModel: 'gemini-2.5-flash-image-preview', // Model that works with Revo 1.5 API key
      format: claudeResult.format,
      caption: contentResult.caption,
      hashtags: contentResult.hashtags,
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      callToAction: contentResult.callToAction
    };

    return result;

  } catch (error) {
    // Log the actual error for debugging
    console.error('❌ [Revo 1.5] Detailed error information:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

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
