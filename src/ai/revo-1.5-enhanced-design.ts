/**
 * Revo 1.5 Enhanced Design Service - PROXY ONLY VERSION
 * Uses AI proxy for all requests - no direct API calls or fallbacks
 */

import { BrandProfile } from '@/lib/types';
import { TrendingHashtagsService } from '@/services/trending-hashtags-service';
import { RegionalSocialTrendsService } from '@/services/regional-social-trends-service';
import type { ScheduledService } from '@/services/calendar-service';
import { aiProxyClient, getUserIdForProxy, getUserTierForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';

// Helper function to route AI calls through proxy - PROXY ONLY, NO FALLBACK
async function generateContentWithProxy(promptOrParts: string | any[], modelName: string, isImageGeneration: boolean = false): Promise<any> {
  if (!shouldUseProxy()) {
    throw new Error('🚫 Proxy is disabled. This system requires AI_PROXY_ENABLED=true for cost control and model management.');
  }

  try {
    const userId = getUserIdForProxy();

    // Handle multimodal requests (text + images) properly
    let prompt: string;
    let imageData: string | undefined;

    if (Array.isArray(promptOrParts)) {
      // Extract text parts
      const textParts = promptOrParts.filter(part => typeof part === 'string');
      prompt = textParts.join(' ');

      // Extract image data from inlineData parts (for logo integration)
      const imageParts = promptOrParts.filter(part =>
        typeof part === 'object' && part.inlineData && part.inlineData.data
      );

      if (imageParts.length > 0) {
        // Use the first image (logo) - convert back to data URL format for proxy
        const firstImage = imageParts[0];
        const mimeType = firstImage.inlineData.mimeType || 'image/png';
        imageData = `data:${mimeType};base64,${firstImage.inlineData.data}`;
        console.log('🖼️ Revo 1.5: Logo data extracted for proxy transmission');
      }
    } else {
      prompt = promptOrParts;
    }

    if (isImageGeneration) {
      console.log(`🔒 Revo 1.5: Generating image with model ${modelName} via proxy`);
      const result = await aiProxyClient.generateImage({
        prompt,
        user_id: userId,
        model: modelName,
        max_tokens: 8192,
        temperature: 0.7,
        ...(imageData && { logoImage: imageData })
      });

      if (!result.success) {
        throw new Error(`Image generation failed: ${result.error || 'Unknown error'}`);
      }

      // Extract image data from proxy response (Fixed: match Revo 2.0 structure)
      const candidates = result.data?.candidates;
      if (!candidates || !candidates[0]?.content?.parts?.[0]?.inlineData?.data) {
        throw new Error('Invalid image response from proxy - no image data found');
      }

      // Return the same structure as Revo 2.0 for consistency
      return {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'image/png',
                data: candidates[0].content.parts[0].inlineData.data
              }
            }]
          }
        }]
      };
    } else {
      console.log(`🔒 Revo 1.5: Generating text with model ${modelName} via proxy`);
      const result = await aiProxyClient.generateText({
        prompt,
        user_id: userId,
        model: modelName,
        max_tokens: 8192,
        temperature: 0.7
      });

      if (!result.success) {
        throw new Error(`Text generation failed: ${result.error || 'Unknown error'}`);
      }

      // Extract content from Google API response format
      console.log('🔍 [Revo 1.5] Proxy result structure:', JSON.stringify(result, null, 2));
      console.log('🔍 [Revo 1.5] Result.data type:', typeof result.data);
      console.log('🔍 [Revo 1.5] Result.data structure:', JSON.stringify(result.data, null, 2));

      let content = '';
      if (result.data && result.data.candidates && result.data.candidates[0] &&
        result.data.candidates[0].content && result.data.candidates[0].content.parts) {
        content = result.data.candidates[0].content.parts[0].text || '';
        console.log('🔍 [Revo 1.5] Extracted content from candidates:', content.substring(0, 200));
      } else if (result.data && typeof result.data === 'string') {
        content = result.data;
        console.log('🔍 [Revo 1.5] Using string data directly:', content.substring(0, 200));
      } else if (result.data && result.data.content) {
        content = result.data.content;
        console.log('🔍 [Revo 1.5] Using data.content:', content.substring(0, 200));
      } else if (result.data && result.data.candidates && result.data.candidates[0] &&
        result.data.candidates[0].finishReason === 'MAX_TOKENS') {
        console.log('🔍 [Revo 1.5] Response truncated due to MAX_TOKENS limit');
        throw new Error('🚫 [Revo 1.5] Response truncated due to token limit. Please reduce prompt length.');
      } else {
        console.log('🔍 [Revo 1.5] No matching content structure found');
      }

      return {
        response: {
          text: () => content
        }
      };
    }
  } catch (error) {
    console.error(`❌ Revo 1.5: Proxy ${isImageGeneration ? 'image' : 'text'} generation failed:`, error);
    throw error;
  }
}
// import { CulturalIntelligenceService } from '@/services/cultural-intelligence-service';
// import { NaturalContextMarketingService } from '@/services/natural-context-marketing';
// import { EnhancedCTAGenerator, type CTAGenerationContext } from '@/services/enhanced-cta-generator';
// import { AIContentGenerator, type AIContentRequest } from '@/services/ai-content-generator';
// import { ClaudeSonnet4Generator, type ClaudeContentRequest } from '@/services/claude-sonnet-4-generator';

import { ensureExactDimensions } from './utils/image-dimensions';

// Removed OpenAI dependency - using proxy-only approach

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
  // 🎯 Generate Product-Lifestyle Integration Strategy (Fallback)
  const naturalContextStrategy = {
    primaryScenarios: [],
    contextualApproaches: ['product-showcase', 'lifestyle-integration'],
    lifestyleTouchpoints: ['daily-use', 'problem-solving'],
    authenticUseCases: ['professional-use', 'personal-benefit'],
    behavioralPatterns: ['regular-usage', 'problem-resolution'],
    emotionalConnections: ['trust', 'satisfaction', 'reliability']
  };

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

    const response = await generateContentWithProxy(analysisPrompt, 'gemini-2.5-flash', false);

    console.log('🔍 [Revo 1.5] Raw proxy response for business analysis:', response);
    console.log('🔍 [Revo 1.5] Response type:', typeof response);

    // Extract text from proxy response format
    let responseText = '';
    if (response.response && typeof response.response.text === 'function') {
      const rawResponse = response.response.text();
      if (typeof rawResponse === 'string') {
        responseText = rawResponse;
      } else if (rawResponse && rawResponse.candidates && rawResponse.candidates[0] && rawResponse.candidates[0].content && rawResponse.candidates[0].content.parts) {
        responseText = rawResponse.candidates[0].content.parts[0].text || '';
      }
    }

    console.log('🔍 [Revo 1.5] Extracted response text:', responseText);

    try {
      // Handle proxy response format
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
      console.error('⚠️ [Revo 1.5] Parse error:', parseError);
      console.error('🔍 [Revo 1.5] Response type check:', typeof response);

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
 * Fix grammatically incorrect CTAs by adding proper prepositions
 */
function fixCTAGrammar(cta: string, businessName: string, businessType: string, location: string): string {
  if (!cta) return cta;

  const ctaLower = cta.toLowerCase();
  const type = businessType.toLowerCase();

  // Common grammatical errors to fix
  const grammarFixes: Array<{ pattern: RegExp, replacement: string, condition?: (match: string) => boolean }> = [
    // Fix "Shop [City] Now" -> "Shop in [City] Now" if it matches location
    {
      pattern: /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Shop in $1 $2',
      condition: (match) => {
        if (/(at|in|with|from)\s/i.test(match)) return false; // Already has preposition
        const shopMatch = match.match(/^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        return shopMatch && location && shopMatch[1].toLowerCase().trim() === location.toLowerCase().trim();
      }
    },
    // Fix "Shop [BusinessName] Now" -> "Shop at [BusinessName] Now" (only if not already has preposition and not a city)
    {
      pattern: /^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Shop at $1 $2',
      condition: (match) => {
        if (/(at|in|with|from)\s/i.test(match)) return false; // Already has preposition
        const shopMatch = match.match(/^shop\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        // Don't apply if it's a city name
        return !(shopMatch && location && shopMatch[1].toLowerCase().trim() === location.toLowerCase().trim());
      }
    },
    // Fix "Visit [City] Now" -> "Shop in [City] Now" if it matches location
    {
      pattern: /^visit\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Shop in $1 $2',
      condition: (match) => {
        const cityMatch = match.match(/^visit\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i);
        return cityMatch && location && cityMatch[1].toLowerCase().trim() === location.toLowerCase().trim();
      }
    },
    // Fix "Order [BusinessName] Now" -> "Order from [BusinessName] Now" (only if not already has preposition)
    {
      pattern: /^order\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Order from $1 $2',
      condition: (match) => !/(from|at|with)\s/i.test(match)
    },
    // Fix "Book [BusinessName] Now" -> "Book with [BusinessName] Now" (only if not already has preposition)
    {
      pattern: /^book\s+([A-Za-z][A-Za-z0-9\s]*?)\s*(now|today)?$/i,
      replacement: 'Book with $1 $2',
      condition: (match) => !/(with|at)\s/i.test(match)
    }
  ];

  let fixedCTA = cta;

  for (const fix of grammarFixes) {
    if (fix.pattern.test(fixedCTA)) {
      // Check condition if provided
      if (!fix.condition || fix.condition(fixedCTA)) {
        fixedCTA = fixedCTA.replace(fix.pattern, fix.replacement);
        console.log(`🔧 [Revo 1.5] Fixed CTA grammar: "${cta}" -> "${fixedCTA}"`);
        break;
      }
    }
  }

  // Clean up extra spaces
  fixedCTA = fixedCTA.replace(/\s+/g, ' ').trim();

  // Ensure proper capitalization
  fixedCTA = fixedCTA.charAt(0).toUpperCase() + fixedCTA.slice(1);

  return fixedCTA;
}

/**
 * Generate contextually appropriate CTA based on business type
 */
function generateContextualCTA(businessType: string, businessName: string, location: string): string {
  const type = businessType.toLowerCase();

  // Business-specific CTA patterns with proper grammar
  const ctaPatterns: Record<string, string[]> = {
    restaurant: ['Dine with Us', 'Order from Us', 'Reserve Table', 'Book Now'],
    food: ['Order from Us', 'Taste Today', 'Try Now', 'Order Online'],
    cafe: ['Visit Us', 'Order from Us', 'Try Today', 'Come In'],
    retail: ['Shop with Us', 'Browse Store', 'View Products', 'Shop Now'],
    store: ['Shop with Us', 'Visit Store', 'Browse Now', 'Shop Today'],
    electronics: ['Shop with Us', 'View Products', 'Compare Now', 'Browse Tech'],
    fashion: ['Shop with Us', 'Browse Style', 'View Collection', 'Shop Fashion'],
    salon: ['Book with Us', 'Schedule Now', 'Book Today', 'Reserve Spot'],
    spa: ['Book with Us', 'Relax Today', 'Schedule Now', 'Book Session'],
    fitness: ['Join Us', 'Start Today', 'Book Session', 'Get Fit'],
    medical: ['Schedule Now', 'Book Appointment', 'Call Today', 'Contact Us'],
    dental: ['Schedule Now', 'Book Appointment', 'Call Today', 'Book Visit'],
    consulting: ['Contact Us', 'Schedule Call', 'Get Quote', 'Learn More'],
    legal: ['Contact Us', 'Schedule Consultation', 'Get Help', 'Call Now'],
    financial: ['Contact Us', 'Schedule Meeting', 'Get Quote', 'Learn More']
  };

  // Find matching business type
  for (const [businessKey, ctas] of Object.entries(ctaPatterns)) {
    if (type.includes(businessKey)) {
      const randomIndex = Math.floor(Math.random() * ctas.length);
      return ctas[randomIndex];
    }
  }

  // Default professional CTAs
  const defaultCTAs = ['Contact Us', 'Learn More', 'Get Started', 'Call Today', 'Visit Us'];
  const randomIndex = Math.floor(Math.random() * defaultCTAs.length);
  return defaultCTAs[randomIndex];
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
      ctaLower.includes('reserve') || ctaLower.includes('table') ||
      ctaLower.includes('dine') || ctaLower.includes('taste') || ctaLower.includes('try');
  }

  // Service businesses should have booking/scheduling CTAs
  if (type.includes('salon') || type.includes('spa') || type.includes('fitness') ||
    type.includes('medical') || type.includes('dental')) {
    return ctaLower.includes('book') || ctaLower.includes('schedule') ||
      ctaLower.includes('appointment') || ctaLower.includes('session') ||
      ctaLower.includes('join') || ctaLower.includes('start');
  }

  // Retail businesses should have shopping CTAs
  if (type.includes('retail') || type.includes('store') || type.includes('shop') ||
    type.includes('electronics') || type.includes('fashion')) {
    return ctaLower.includes('shop') || ctaLower.includes('buy') ||
      ctaLower.includes('browse') || ctaLower.includes('view') ||
      ctaLower.includes('compare');
  }

  // Professional services should have consultation CTAs
  if (type.includes('consulting') || type.includes('legal') || type.includes('financial')) {
    return ctaLower.includes('schedule') || ctaLower.includes('consult') ||
      ctaLower.includes('meeting') || ctaLower.includes('call') ||
      ctaLower.includes('contact') || ctaLower.includes('quote');
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

    const fullPrompt = `You are an expert content creator who creates authentic, business-specific content.

STRICT RULES:
- NEVER use these overused words: upgrade, transform, revolutionize, solutions, excellence, premium, ultimate, cutting-edge, innovative, breakthrough, game-changer, elevate, empower, unlock, discover
- ALWAYS be specific to the actual business and services
- ALWAYS use natural, conversational language
- ALWAYS make content feel like a real person wrote it
- ALWAYS focus on real, tangible benefits
- Generate exactly ${hashtagCount} hashtags for ${platform}
- Vary your approach - don't repeat the same patterns
- Be creative and authentic for each business

${prompt}`;

    const response = await generateContentWithProxy(fullPrompt, 'gemini-2.5-flash', false);
    let responseContent = response.response.text() || '{}';

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
      callToAction: parsed.callToAction ?
        fixCTAGrammar(parsed.callToAction, businessName, businessType, brandProfile.location || '') :
        generateContextualCTA(businessType, businessName, brandProfile.location || '')
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
      callToAction: generateContextualCTA(businessType, businessName, brandProfile.location || '')
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

    // Apply Cultural Intelligence System (Fallback) with proper CTA grammar
    const culturalContent = {
      headlines: [`${businessName} Excellence`, `Professional ${businessType} Services`, `Quality ${businessType} Solutions`],
      subheadlines: [`Quality service you can trust`, `Professional results delivered`, `Expert ${businessType} services`],
      ctas: [
        generateContextualCTA(businessType, businessName, brandProfile.location || ''),
        'Contact Us',
        'Learn More',
        'Get Started'
      ],
      culturalContext: `${brandProfile.location || 'Global'} - Professional business focus`
    };

    console.log('🌍 [Revo 1.5] Cultural Intelligence Applied (Fallback):', {
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

    // Platform-specific hashtag count
    const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

    const prompt = `Create engaging ${platform} content for ${businessName}, a ${businessType} business in ${brandProfile.location || 'the local area'}.

Business Context:
- Services: ${brandProfile.services || 'Business services'}
- Target: ${brandProfile.targetAudience || 'General audience'}
- Approach: ${businessAnalysis.contentApproach}
${languageInstruction}

Key Messages: ${businessAnalysis.keyMessages?.slice(0, 2).join(', ') || 'Professional service, customer satisfaction'}
Pain Points: ${businessAnalysis.targetPainPoints?.slice(0, 2).join(', ') || 'Common industry challenges'}
Value Props: ${businessAnalysis.uniqueValueProps?.slice(0, 2).join(', ') || 'Quality service, reliable results'}

${scheduledServices && scheduledServices.length > 0 ? `
Services Focus: ${scheduledServices.map(s => s.serviceName).join(', ')}` : ''}

Trending: ${trendingData.trendingHashtags.slice(0, 3).join(', ')}

Create engaging content:
1. Caption (2-3 sentences): Authentic business story with specific benefits
2. Headline (5-8 words): Compelling, specific to this business
3. Subheadline (8-15 words): Explains how the service delivers value
4. Business-specific CTA (2-5 words): Use proper English grammar with prepositions when needed
   - CORRECT: "Shop at [Business]", "Visit [Business]", "Order from [Business]", "Book with [Business]"
   - INCORRECT: "Shop [Business]", "Visit [City]", "Order [Business]"
   - Examples by business type:
     * Retail/Store: "Shop at [Business]", "Browse Our Store", "View Products"
     * Restaurant: "Dine at [Business]", "Order from [Business]", "Reserve Table"
     * Services: "Book with [Business]", "Schedule Today", "Get Quote"
     * Professional: "Consult with [Business]", "Contact [Business]", "Learn More"
5. ${hashtagCount} relevant hashtags for ${platform}



Format as JSON:
{
  "caption": "Your engaging caption here",
  "headline": "Your compelling headline here",
  "subheadline": "Your supporting subheadline here",
  "callToAction": "Your strong CTA here",
  "hashtags": [${Array(hashtagCount).fill('"#SpecificHashtag"').join(', ')}]
}`;

    console.log(`🎯[Revo 1.5] Using proxy for content generation with ${hashtagCount} hashtags for ${platform}`);

    const fullPrompt = `Create ${platform} content for ${businessName} (${businessType} in ${brandProfile.location || 'local area'}).

${prompt}`;

    console.log('📝 [Revo 1.5] Content generation prompt length:', fullPrompt.length);
    console.log('📝 [Revo 1.5] Content generation prompt preview:', fullPrompt.substring(0, 300) + '...');

    const response = await generateContentWithProxy(fullPrompt, 'gemini-2.5-flash', false);

    console.log('✅ [Revo 1.5] Proxy response received for content generation (headlines, captions, hashtags, CTAs)');
    console.log('🔍 [Revo 1.5] Full response object:', JSON.stringify(response, null, 2));

    let responseContent = '';
    try {
      // Extract text from proxy response format
      if (response.response && typeof response.response.text === 'function') {
        const rawResponse = response.response.text();
        console.log('🔍 [Revo 1.5] Raw response from text():', rawResponse);
        console.log('🔍 [Revo 1.5] Raw response type:', typeof rawResponse);

        if (typeof rawResponse === 'string') {
          responseContent = rawResponse;
        } else if (rawResponse && rawResponse.candidates && rawResponse.candidates[0] && rawResponse.candidates[0].content && rawResponse.candidates[0].content.parts) {
          responseContent = rawResponse.candidates[0].content.parts[0].text || '{}';
        } else {
          console.log('🔍 [Revo 1.5] Raw response structure:', JSON.stringify(rawResponse, null, 2));
          responseContent = '{}';
        }
      } else {
        console.log('🔍 [Revo 1.5] Response structure issue:', {
          hasResponse: !!response.response,
          textType: typeof response.response?.text
        });
        responseContent = '{}';
      }

      console.log('🔍 [Revo 1.5] Raw proxy response:', responseContent.substring(0, 500));

      // Clean up the response if it has markdown formatting
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1] || responseContent;
      }

      console.log('🧹 [Revo 1.5] Cleaned response:', responseContent.substring(0, 300));
      let parsed = JSON.parse(responseContent);

      // Handle array response - take the first item if it's an array
      if (Array.isArray(parsed)) {
        console.log('🔄 [Revo 1.5] Response is array, taking first item (Fixed Array Handling)');
        parsed = parsed[0] || {};
      }

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

      // Fix CTA grammar and validate appropriateness
      let finalCTA = parsed.callToAction || 'Get Started';

      // Apply grammar fixes to correct common issues
      if (finalCTA) {
        const originalCTA = finalCTA;
        finalCTA = fixCTAGrammar(finalCTA, businessName, businessType, brandProfile.location || '');

        // If CTA is still inappropriate after grammar fix, generate a contextual one
        if (!isBusinessAppropriateCTA(finalCTA, businessType)) {
          console.log('⚠️ [Revo 1.5] CTA not appropriate for business type, generating contextual CTA');
          finalCTA = generateContextualCTA(businessType, businessName, brandProfile.location || '');
        }

        console.log('🎯 [Revo 1.5] CTA Processing:', {
          original: originalCTA,
          grammarFixed: finalCTA,
          businessType: businessType,
          isAppropriate: isBusinessAppropriateCTA(finalCTA, businessType)
        });
      }

      // Validate required fields from proxy response
      if (!parsed.caption || !parsed.headline || !parsed.subheadline || !parsed.hashtags) {
        throw new Error('🚫 [Revo 1.5] Proxy AI response incomplete - missing required fields.');
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
      console.error('❌ [Revo 1.5] Failed response content:', responseContent);

      // JSON parsing must work with proxy system
      throw new Error(`🚫 [Revo 1.5] JSON parsing failed with proxy response. Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ [Revo 1.5] Content generation failed - MAIN ERROR:', error);
    console.error('❌ [Revo 1.5] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [Revo 1.5] Error message:', error instanceof Error ? error.message : String(error));

    // Main content generation must work with proxy system
    throw new Error(`🚫 [Revo 1.5] Main content generation failed with proxy system. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const designPlanningPrompt = `Create a design plan for ${input.businessType} business "${input.brandProfile.businessName}" on ${input.platform}.

Business: ${input.brandProfile.businessName} (${input.businessType})
Colors: ${input.brandProfile.primaryColor || '#000000'}, ${input.brandProfile.accentColor || '#666666'}
Style: ${input.visualStyle}
Aspect: ${(input as any).aspectRatio || getPlatformAspectRatio(input.platform)}
Logo: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'Available - integrate prominently' : 'None - focus on typography'}

Create a brief plan with:
1. Layout approach and composition
2. Color scheme based on brand colors
3. Typography style (modern, clean fonts)
4. Visual elements to include
5. Brand integration approach
6. Overall mood and style

Keep it concise and actionable.`;

  try {
    const planResponse = await generateContentWithProxy(designPlanningPrompt, 'gemini-2.5-flash', false);

    return {
      plan: planResponse.response.text(),
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

  // Retry logic for 503 errors (Performance Optimized: Reduced retries)
  const maxRetries = 1;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use proxy for image generation - no direct API calls
      console.log('🔒 [Revo 1.5] Using proxy for image generation');

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

      const result = await generateContentWithProxy(generationParts, 'gemini-2.5-flash-image-preview', true);

      // Extract image data from proxy response (Fixed: use inlineData like Revo 2.0)
      let imageUrl = '';
      if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        const parts = result.candidates[0].content.parts;

        // Look for inlineData (correct format for images)
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${imageData}`;
            console.log('✅ [Revo 1.5] Image data extracted from inlineData (Fixed)');
            break;
          }
        }

        // Fallback: try text format (legacy support)
        if (!imageUrl) {
          const textPart = parts[0];
          if (textPart && textPart.text) {
            imageUrl = textPart.text;
            console.log('⚠️ [Revo 1.5] Using text fallback for image URL');
          }
        }
      }

      if (!imageUrl) {
        throw new Error('No image data generated by proxy for Revo 1.5');
      }

      // Optional dimension checking (Performance Optimized: No retries)
      {
        const expectedW = 992, expectedH = 1056;
        const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
        if (!check.ok) {
          console.warn(`⚠️ [Revo 1.5] Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH} (Performance Optimized: No retries)`);
        } else {
          console.log(`✅ [Revo 1.5] Image dimensions verified: ${check.width}x${check.height}`);
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
  const visualInstructions = `
CULTURAL VISUAL ADAPTATION FOR ${(input.brandProfile.location || 'USA').toUpperCase()}:
- People: Professional representation appropriate for ${input.brandProfile.location || 'USA'}
- Settings: Modern business environments
- Colors: Professional color schemes
- Business Context: ${input.businessType} professionals
- Trust Elements: Professional credentials and quality indicators
- Cultural Values: Professional excellence and quality service
`;

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
    'Proxy-Based Logo Integration System'
  ];

  try {

    // Step 1: Generate design plan with Gemini 2.5 Flash
    const designPlan = await generateDesignPlan(enhancedInput);
    enhancementsApplied.push('Strategic Design Planning');

    // Step 2: Generate content using proxy system
    console.log('🧠 [Revo 1.5] Generating content with proxy system...');

    // Use proxy for content generation
    const contentResult = await generateCaptionAndHashtags(
      input.businessType,
      input.brandProfile.businessName || input.businessType,
      input.platform,
      designPlan,
      input.brandProfile,
      { trendingHashtags: [], currentEvents: [] },
      input.useLocalLanguage === true,
      input.scheduledServices
    );

    enhancementsApplied.push('Proxy Content Generation');
    console.log('✅ [Revo 1.5] Proxy content generation successful');
    console.log('🎯 [Revo 1.5] CONTENT SYSTEM USED: Proxy (gemini-2.5-flash)');

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
      planningModel: 'gemini-2.5-flash',
      generationModel: 'gemini-2.5-flash-image-preview', // Model that works with Revo 1.5 API key
      // format: claudeResult.format,
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
