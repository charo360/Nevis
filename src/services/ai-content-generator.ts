/**
 * AI-Driven Content Generator for Revo 1.5
 * Uses intelligent AI decision-making for headlines, CTAs, and content variety
 * 
 * PHILOSOPHY: Let AI make smart decisions with proper context instead of hardcoding patterns
 */

export interface AIContentRequest {
  businessType: string;
  businessName: string;
  services: string;
  platform: string;
  contentType: 'headline' | 'cta' | 'caption' | 'subheadline';
  contentScenario?: string;
  targetAudience?: string;
  location?: string;
  recentContent?: string[]; // Recent headlines/CTAs to avoid repetition
  overusedWords?: string[]; // Words to avoid due to overuse
}

export interface AIContentResponse {
  primary: string;
  alternatives: string[];
  reasoning: string;
  confidence: number;
  wordsToAvoid: string[]; // Words that should be avoided in future content
}

export class AIContentGenerator {
  
  /**
   * Generate intelligent content using AI decision-making
   */
  static async generateIntelligentContent(request: AIContentRequest): Promise<AIContentResponse> {
    const prompt = this.buildIntelligentPrompt(request);
    
    try {
      // This would integrate with your AI service (Gemini, OpenAI, etc.)
      const aiResponse = await this.callAIService(prompt);
      
      return {
        primary: aiResponse.content,
        alternatives: aiResponse.alternatives,
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        wordsToAvoid: this.extractOverusedWords(request.recentContent || [])
      };
    } catch (error) {
      console.warn('AI content generation failed, using intelligent fallback');
      return this.generateIntelligentFallback(request);
    }
  }

  /**
   * Build intelligent prompt for AI content generation
   */
  private static buildIntelligentPrompt(request: AIContentRequest): string {
    const { 
      businessType, 
      businessName, 
      services, 
      platform, 
      contentType, 
      recentContent, 
      overusedWords 
    } = request;
    
    const recentContentText = recentContent && recentContent.length > 0 
      ? `Recent ${contentType}s used: ${recentContent.join(', ')}\n` 
      : '';
    
    const overusedWordsText = overusedWords && overusedWords.length > 0
      ? `Overused words to AVOID: ${overusedWords.join(', ')}\n`
      : '';

    const contentTypeInstructions = this.getContentTypeInstructions(contentType, platform);

    return `
Generate a compelling ${contentType} for this business:

BUSINESS CONTEXT:
- Business Type: ${businessType}
- Business Name: ${businessName}
- Services: ${services}
- Platform: ${platform}

${recentContentText}${overusedWordsText}

INTELLIGENT GUIDELINES:
1. ANALYZE the business and services to understand their unique value proposition
2. CREATE ${contentType} that's specific to their business model and offerings
3. AVOID repetition - if recent content used similar words/phrases, be creative with alternatives
4. NEVER use overused words - find fresh, engaging alternatives
5. BE SPECIFIC to their services, not generic
6. MATCH the platform style and audience expectations

${contentTypeInstructions}

CREATIVITY REQUIREMENTS:
- Use varied vocabulary and fresh approaches
- Avoid clichés and overused marketing phrases
- Make it sound natural and authentic
- Focus on what makes THIS business unique

Generate:
1. Primary ${contentType}
2. 3 alternative options
3. Brief reasoning for your choice
4. Confidence level (1-10)

Be intelligent, creative, and avoid repetitive patterns. Make decisions based on what makes sense for THIS specific business.
`;
  }

  /**
   * Get content-type specific instructions
   */
  private static getContentTypeInstructions(contentType: string, platform: string): string {
    switch (contentType) {
      case 'headline':
        return `
HEADLINE GUIDELINES:
- Keep it under 6 words for maximum impact
- Focus on the main benefit or unique value
- Make it memorable and engaging
- Avoid generic phrases like "Quality Service" or "Professional Excellence"
- Platform considerations:
  * Instagram: Visual, punchy headlines
  * LinkedIn: Professional, benefit-focused
  * Facebook: Engaging, conversational
`;

      case 'cta':
        return `
CTA GUIDELINES:
- 2-4 words maximum
- Use action verbs that match the business's conversion goal
- Be specific to what the customer will actually do
- Platform considerations:
  * Instagram: Short, visual (2-3 words)
  * LinkedIn: Professional action words
  * Facebook: Clear, descriptive actions
`;

      case 'subheadline':
        return `
SUBHEADLINE GUIDELINES:
- Maximum 25 words
- Expand on the headline with specific benefits
- Include what makes this business different
- Be conversational and relatable
`;

      case 'caption':
        return `
CAPTION GUIDELINES:
- Tell a story that connects with the audience
- Include specific benefits and outcomes
- Make it engaging and shareable
- End with a natural call-to-action flow
`;

      default:
        return '';
    }
  }

  /**
   * Call AI service (mock implementation - replace with actual AI integration)
   */
  private static async callAIService(prompt: string): Promise<any> {
    // Mock response - replace with actual AI API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: "Smart Business Solutions",
          alternatives: ["Innovative Services", "Expert Solutions", "Trusted Partners"],
          reasoning: "AI-generated response based on business context",
          confidence: 8
        });
      }, 100);
    });
  }

  /**
   * Generate intelligent fallback when AI fails
   */
  private static generateIntelligentFallback(request: AIContentRequest): AIContentResponse {
    const { businessType, businessName, contentType, recentContent } = request;
    
    let primary = "";
    let alternatives: string[] = [];
    
    // Simple intelligent fallback based on content type
    switch (contentType) {
      case 'headline':
        primary = `${businessName} Excellence`;
        alternatives = [`Quality ${businessType}`, `Trusted ${businessType}`, `Professional Service`];
        break;
        
      case 'cta':
        primary = this.getSimpleCTA(businessType);
        alternatives = ["Get Started", "Learn More", "Contact Us"];
        break;
        
      case 'subheadline':
        primary = `Professional ${businessType.toLowerCase()} services you can trust`;
        alternatives = [
          `Quality ${businessType.toLowerCase()} solutions`,
          `Expert ${businessType.toLowerCase()} services`,
          `Reliable ${businessType.toLowerCase()} expertise`
        ];
        break;
        
      default:
        primary = `${businessName} delivers exceptional service`;
        alternatives = ["Quality service", "Professional excellence", "Trusted expertise"];
    }
    
    // Avoid recent content if provided
    if (recentContent && recentContent.includes(primary)) {
      primary = alternatives[0];
      alternatives = alternatives.slice(1);
    }
    
    return {
      primary,
      alternatives,
      reasoning: `Intelligent fallback for ${contentType} based on ${businessType} business`,
      confidence: 6,
      wordsToAvoid: this.extractOverusedWords(recentContent || [])
    };
  }

  /**
   * Get simple CTA based on business type
   */
  private static getSimpleCTA(businessType: string): string {
    const type = businessType.toLowerCase();
    
    if (type.includes('bank') || type.includes('finance')) return 'Open Account';
    if (type.includes('restaurant') || type.includes('food')) return 'Reserve Table';
    if (type.includes('salon') || type.includes('beauty')) return 'Book Session';
    if (type.includes('software') || type.includes('app')) return 'Try Free';
    if (type.includes('shop') || type.includes('retail')) return 'Shop Now';
    
    return 'Get Started';
  }

  /**
   * Extract overused words from recent content
   */
  private static extractOverusedWords(recentContent: string[]): string[] {
    if (recentContent.length === 0) return [];
    
    const allText = recentContent.join(' ').toLowerCase();
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return words used more than twice
    return Object.entries(wordCount)
      .filter(([_, count]) => count > 2)
      .map(([word, _]) => word);
  }
}
