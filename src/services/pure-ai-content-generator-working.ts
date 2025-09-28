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

export class WorkingPureAIContentGenerator {
  private static openai: OpenAI | null = null;

  private static getOpenAIClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('🚫 [Working Pure AI] OpenAI API key not found. Please configure OPENAI_API_KEY.');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Generate content using a working, reliable approach with OpenAI
   */
  static async generateContent(request: PureAIRequest): Promise<PureAIResponse> {
    console.log('🚀 [Working Pure AI] Starting content generation with OpenAI');
    
    try {
      const openai = this.getOpenAIClient();
      const prompt = this.buildWorkingPrompt(request);
      console.log('📝 [Working Pure AI] Generated prompt');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('✅ [Working Pure AI] OpenAI response received:', content.substring(0, 200) + '...');

      const parsed = JSON.parse(content);
      console.log('✅ [Working Pure AI] JSON parsing successful');
      
      // Validate and adjust word counts
      if (parsed.content) {
        const validatedContent = this.validateWordCounts(parsed.content);
        parsed.content = { ...parsed.content, ...validatedContent };
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ [Working Pure AI] Generation failed:', error);
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
      console.log(`⚠️ [Working Pure AI] Headline truncated from ${headlineWords} to 6 words: "${adjustedHeadline}"`);
    }
    
    // Truncate subheadline if over 14 words
    if (subheadlineWords > 14) {
      const words = content.subheadline.trim().split(/\s+/);
      adjustedSubheadline = words.slice(0, 14).join(' ');
      console.log(`⚠️ [Working Pure AI] Subheadline truncated from ${subheadlineWords} to 14 words: "${adjustedSubheadline}"`);
    }
    
    return {
      headline: adjustedHeadline,
      subheadline: adjustedSubheadline
    };
  }

  /**
   * Build a working, reliable prompt
   */
  private static buildWorkingPrompt(request: PureAIRequest): string {
    const { businessName, businessType, platform, services, location } = request;
    
    return `Create marketing content for ${businessName} (${businessType}) on ${platform}.

Business: ${businessName}
Type: ${businessType}
Services: ${services}
Location: ${location || 'Not specified'}
Platform: ${platform}

Create specific, engaging content that mentions actual products and includes local references.

Respond with ONLY valid JSON:
{
  "business_analysis": {
    "product_intelligence": "Analysis of their specific products and services",
    "cultural_context": "Local cultural insights for ${location || 'their location'}",
    "emotional_drivers": "Key emotional triggers for their audience",
    "natural_scenarios": "Real usage scenarios for their customers",
    "competitive_advantage": "What makes them different from competitors",
    "content_format": "Best content approach for this business"
  },
  "content": {
    "headline": "Compelling headline (MAX 6 WORDS)",
    "subheadline": "Supporting subheadline (MAX 14 WORDS)",
    "cta": "Call-to-action with specific next steps",
    "caption": "Engaging caption with cultural context",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
  },
  "performance_prediction": {
    "engagement_score": 8,
    "conversion_probability": "High",
    "viral_potential": "Medium",
    "cultural_resonance": "High"
  },
  "strategic_reasoning": "Why this content will work",
  "confidence": 9
}

Generate exactly ${platform === 'Instagram' ? '5' : '3'} hashtags. Be specific to this business.`;
  }
}
