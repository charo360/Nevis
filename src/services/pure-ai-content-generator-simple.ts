import { generateText } from '@/ai/google-ai-direct';
import OpenAI from 'openai';

export interface PureAIRequest {
  businessName: string;
  businessType: string;
  platform: string;
  services: string;
  location?: string;
  targetAudience?: string;
  brandContext?: {
    colors?: string[];
    personality?: string;
    values?: string[];
  };
  recentContent?: string;
  contentType?: string;
  websiteUrl?: string;
}

export interface PureAIResponse {
  business_analysis: {
    product_intelligence: string;
    cultural_context: string;
    emotional_drivers: string;
    natural_scenarios: string;
    competitive_advantage: string;
    content_format: string;
  };
  content: {
    headline: string;
    subheadline: string;
    cta: string;
    caption: string;
    hashtags: string[];
  };
  performance_prediction: {
    engagement_score: number;
    conversion_probability: string;
    viral_potential: string;
    cultural_resonance: string;
  };
  strategic_reasoning: string;
  confidence: number;
}

export class PureAIContentGenerator {
  /**
   * Generate content using Pure AI approach with Gemini backend (DISABLED - Using OpenAI instead)
   */
  static async generateContent(request: PureAIRequest): Promise<PureAIResponse> {
    console.log('🚀 [Pure AI] Gemini disabled - Using OpenAI instead');
    
    // Force fallback to OpenAI since Gemini has too many issues
    return this.generateContentWithOpenAI(request);
  }

  /**
   * Generate content using Pure AI approach with OpenAI backend (fallback)
   */
  static async generateContentWithOpenAI(request: PureAIRequest): Promise<PureAIResponse> {
    console.log('🚀 [Pure AI] Starting content generation with OpenAI');
    
    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      throw new Error('OpenAI API key not found. Please configure OPENAI_API_KEY');
    }

    const openai = new OpenAI({ apiKey: openAIKey });
    const prompt = this.buildSimplePrompt(request);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('✅ [Pure AI] OpenAI response received:', content.substring(0, 200) + '...');

      // Simple JSON extraction
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);
      console.log('✅ [Pure AI] OpenAI JSON parsing successful');
      
      // Validate and adjust word counts
      if (parsed.content) {
        const validatedContent = this.validateWordCounts(parsed.content);
        parsed.content = { ...parsed.content, ...validatedContent };
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ [Pure AI] OpenAI generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate word counts for headline and subheadline
   */
  private static validateWordCounts(content: { headline: string; subheadline: string }): { headline: string; subheadline: string } {
    const headlineWords = content.headline.trim().split(/\s+/).length;
    const subheadlineWords = content.subheadline.trim().split(/\s+/).length;
    
    let adjustedHeadline = content.headline;
    let adjustedSubheadline = content.subheadline;
    
    // Truncate headline if over 6 words
    if (headlineWords > 6) {
      const words = content.headline.trim().split(/\s+/);
      adjustedHeadline = words.slice(0, 6).join(' ');
      console.log(`⚠️ [Pure AI] Headline truncated from ${headlineWords} to 6 words: "${adjustedHeadline}"`);
    }
    
    // Truncate subheadline if over 14 words
    if (subheadlineWords > 14) {
      const words = content.subheadline.trim().split(/\s+/);
      adjustedSubheadline = words.slice(0, 14).join(' ');
      console.log(`⚠️ [Pure AI] Subheadline truncated from ${subheadlineWords} to 14 words: "${adjustedSubheadline}"`);
    }
    
    return {
      headline: adjustedHeadline,
      subheadline: adjustedSubheadline
    };
  }

  /**
   * Build an aggressive, results-driven prompt that forces specificity and cultural awareness
   */
  private static buildSimplePrompt(request: PureAIRequest): string {
    const { businessName, businessType, platform, services, location, targetAudience, brandContext, recentContent, websiteUrl } = request;
    
    // Build brand context text
    let brandContextText = '';
    if (brandContext) {
      const parts = [];
      if (brandContext.colors && brandContext.colors.length > 0) {
        parts.push(`Colors: ${brandContext.colors.join(', ')}`);
      }
      if (brandContext.personality) {
        parts.push(`Personality: ${brandContext.personality}`);
      }
      if (brandContext.values && brandContext.values.length > 0) {
        parts.push(`Values: ${brandContext.values.join(', ')}`);
      }
      if (parts.length > 0) {
        brandContextText = `\nBrand Context: ${parts.join(' | ')}`;
      }
    }
    
    const recentContentText = recentContent ? `\nRecent Content: ${recentContent}` : '';
    const websiteText = websiteUrl ? `\nWebsite: ${websiteUrl}` : '';

    return `You are a marketing expert whose job depends on creating content that drives REAL business results. Your performance is measured by engagement, conversions, and cultural resonance.

BUSINESS INTELLIGENCE REQUIRED:
Business: ${businessName}
Type: ${businessType}
Services: ${services}
Location: ${location || 'Not specified'}
Target Audience: ${targetAudience || 'General'}
Platform: ${platform}${brandContextText}${recentContentText}${websiteText}

CRITICAL REQUIREMENTS - Your job depends on this:

1. PRODUCT INTELLIGENCE: Analyze their specific services and create content that shows you understand what they actually do. Include specific features, benefits, or processes that make them unique.

2. CULTURAL CONTEXT: If location is specified, integrate local language, cultural references, pain points, and behaviors. For Kenya, include Swahili phrases, local payment methods (M-Pesa), and address real local challenges.

3. SPECIFIC VALUE PROPOSITIONS: Avoid generic corporate speak. Create headlines that mention specific benefits, numbers, or outcomes. Instead of "Revolutionize Your Finances," use "Skip Bank Queues - Send Money in 30 Seconds."

4. ACTIONABLE CTAs: Create calls-to-action that tell people exactly what to do next. Include specific steps, contact methods, or app downloads.

5. SOCIAL PROOF: Include numbers, testimonials, or user counts when relevant. Show credibility and popularity.

6. EMOTIONAL INTELLIGENCE: Address real pain points your audience faces. What problems does this business solve? What frustrations do they eliminate?

BANNED PHRASES - Never use these generic terms:
- "Revolutionize" / "Redefine" / "Transform"
- "Experience the future" / "Next generation"
- "Join the movement" / "Be part of something"
- "Your future, now" / "Unlock potential"
- Any corporate buzzwords without specific meaning

REQUIRED FORMAT - Respond with ONLY valid JSON:
{
  "business_analysis": {
    "product_intelligence": "Specific analysis of their actual products/services, features, and unique selling points",
    "cultural_context": "Deep cultural insights for their location, including local language, customs, pain points, and behaviors",
    "emotional_drivers": "Real emotional triggers that motivate their specific audience",
    "natural_scenarios": "Concrete, specific usage scenarios that their customers actually experience",
    "competitive_advantage": "What makes them genuinely different from competitors, with specific examples",
    "content_format": "Optimal content approach for this specific business and platform"
  },
  "content": {
    "headline": "Specific, benefit-driven headline (MAX 6 WORDS)",
    "subheadline": "Supporting subheadline with specific features, numbers, or social proof (MAX 14 WORDS)",
    "cta": "Actionable call-to-action with specific next steps",
    "caption": "Engaging caption that tells a story, addresses pain points, and includes cultural context",
    "hashtags": ["#specific1", "#specific2", "#specific3", "#specific4", "#specific5"]
  },
  "performance_prediction": {
    "engagement_score": 8,
    "conversion_probability": "High",
    "viral_potential": "Medium",
    "cultural_resonance": "High"
  },
  "strategic_reasoning": "Your detailed strategic thinking about why this content will drive real business results",
  "confidence": 9
}

Generate exactly ${platform === 'Instagram' ? '5' : '3'} hashtags that are specific to this business, location, and industry. Avoid generic hashtags.

CRITICAL WORD LIMITS:
- Headline: MAXIMUM 6 words - make it punchy and impactful
- Subheadline: MAXIMUM 14 words - provide supporting details concisely
- These limits are MANDATORY - count your words carefully

REMEMBER: Your job depends on creating content that drives real business results. Be specific, culturally aware, and results-focused.`;
  }
}
