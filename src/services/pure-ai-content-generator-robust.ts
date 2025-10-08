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

export class RobustPureAIContentGenerator {
  /**
   * Generate content using robust, product-specific approach
   */
  static async generateContent(request: PureAIRequest): Promise<PureAIResponse> {
    console.log('🚀 [Robust Pure AI] Starting content generation');
    
    try {
      const prompt = this.buildRobustPrompt(request);
      console.log('📝 [Robust Pure AI] Generated prompt');
      
      const response = await generateText(prompt, {
        temperature: 0.8,
        maxOutputTokens: 3000
      });

      const content = response.text;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      console.log('✅ [Robust Pure AI] AI response received:', content.substring(0, 200) + '...');

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);
      console.log('✅ [Robust Pure AI] JSON parsing successful');
      
      // Validate and adjust word counts
      if (parsed.content) {
        const validatedContent = this.validateWordCounts(parsed.content);
        parsed.content = { ...parsed.content, ...validatedContent };
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ [Robust Pure AI] Generation failed:', error);
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
      console.log(`⚠️ [Robust Pure AI] Headline truncated from ${headlineWords} to 6 words: "${adjustedHeadline}"`);
    }
    
    // Truncate subheadline if over 14 words
    if (subheadlineWords > 14) {
      const words = content.subheadline.trim().split(/\s+/);
      adjustedSubheadline = words.slice(0, 14).join(' ');
      console.log(`⚠️ [Robust Pure AI] Subheadline truncated from ${subheadlineWords} to 14 words: "${adjustedSubheadline}"`);
    }
    
    return {
      headline: adjustedHeadline,
      subheadline: adjustedSubheadline
    };
  }

  /**
   * Build a robust prompt that forces specific, intelligent content
   */
  private static buildRobustPrompt(request: PureAIRequest): string {
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

    return `Create marketing content for ${businessName} (${businessType}) on ${platform}.

Business: ${businessName}
Type: ${businessType}
Services: ${services}
Location: ${location || 'Not specified'}
Target Audience: ${targetAudience || 'General'}
Platform: ${platform}${brandContextText}${recentContentText}${websiteText}

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

Respond with ONLY valid JSON in this exact format:
{
  "business_analysis": {
    "product_intelligence": "Specific analysis with actual product names, models, features, and pricing",
    "cultural_context": "Local cultural insights specific to their location and audience",
    "emotional_drivers": "Real emotional triggers that motivate their specific audience",
    "natural_scenarios": "Concrete, specific usage scenarios that their customers actually experience",
    "competitive_advantage": "What makes them genuinely different from specific competitors with examples",
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

REMEMBER: Your content must be so specific and intelligent that it could ONLY work for this exact business. Generic content = FAILURE.`;
  }
}






