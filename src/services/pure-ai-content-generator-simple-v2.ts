import { generateText } from '@/ai/google-ai-direct';

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

export class SimpleV2PureAIContentGenerator {
  /**
   * Generate content using simple, reliable approach
   */
  static async generateContent(request: PureAIRequest): Promise<PureAIResponse> {
    console.log('🚀 [Simple V2 Pure AI] Starting content generation');
    
    try {
      const prompt = this.buildSimplePrompt(request);
      console.log('📝 [Simple V2 Pure AI] Generated prompt');
      
      const response = await generateText(prompt, {
        temperature: 0.7,
        maxOutputTokens: 2000
      });

      const content = response.text;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      console.log('✅ [Simple V2 Pure AI] AI response received:', content.substring(0, 200) + '...');

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);
      console.log('✅ [Simple V2 Pure AI] JSON parsing successful');
      
      // Validate and adjust word counts
      if (parsed.content) {
        const validatedContent = this.validateWordCounts(parsed.content);
        parsed.content = { ...parsed.content, ...validatedContent };
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ [Simple V2 Pure AI] Generation failed:', error);
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
      console.log(`⚠️ [Simple V2 Pure AI] Headline truncated from ${headlineWords} to 6 words: "${adjustedHeadline}"`);
    }
    
    // Truncate subheadline if over 14 words
    if (subheadlineWords > 14) {
      const words = content.subheadline.trim().split(/\s+/);
      adjustedSubheadline = words.slice(0, 14).join(' ');
      console.log(`⚠️ [Simple V2 Pure AI] Subheadline truncated from ${subheadlineWords} to 14 words: "${adjustedSubheadline}"`);
    }
    
    return {
      headline: adjustedHeadline,
      subheadline: adjustedSubheadline
    };
  }

  /**
   * Build a simple, reliable prompt
   */
  private static buildSimplePrompt(request: PureAIRequest): string {
    const { businessName, businessType, platform, services, location, targetAudience, brandContext, recentContent, websiteUrl } = request;
    
    return `Create marketing content for ${businessName} (${businessType}) on ${platform}.

Business: ${businessName}
Type: ${businessType}
Services: ${services}
Location: ${location || 'Not specified'}
Target Audience: ${targetAudience || 'General'}
Platform: ${platform}

Requirements:
- Use specific product names and pricing
- Include local cultural references
- Mention competitive advantages
- Include social proof numbers
- Provide specific contact methods

Respond with ONLY valid JSON in this exact format:
{
  "business_analysis": {
    "product_intelligence": "Analysis of their products with specific names and features",
    "cultural_context": "Local cultural insights for their location",
    "emotional_drivers": "Emotional triggers for their audience",
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
  "strategic_reasoning": "Your strategic thinking about why this content will work",
  "confidence": 9
}

Generate exactly ${platform === 'Instagram' ? '5' : '3'} hashtags. Be specific to this business and location.`;
  }
}




