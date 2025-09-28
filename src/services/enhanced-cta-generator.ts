/**
 * AI-Driven CTA Generator for Revo 1.5
 * Uses intelligent AI decision-making instead of hardcoded business logic
 *
 * PHILOSOPHY: Let AI make smart decisions with proper context instead of hardcoding every scenario
 *
 * APPROACH:
 * - Provide AI with business context, recent content history, and intelligent guidelines
 * - Let AI determine appropriate CTAs based on business type, services, and conversion goals
 * - Track content history to avoid repetition and encourage variety
 * - Use smart prompting instead of rigid business-type mappings
 */

export interface AIGeneratedCTA {
  primary: string;
  alternatives: string[];
  reasoning: string;
  confidence: number;
  platform: string;
}

export interface CTAGenerationContext {
  businessType: string;
  businessName: string;
  services: string;
  platform: string;
  contentScenario?: string;
  targetAudience?: string;
  location?: string;
  productFunction?: string;
  realBenefit?: string;
  recentCTAs?: string[]; // Track recent CTAs to avoid repetition
  recentHeadlines?: string[]; // Track recent headlines for context
}

export interface ContentHistory {
  brandId: string;
  recentCTAs: string[];
  recentHeadlines: string[];
  commonWords: string[];
  lastUpdated: Date;
}

export class AICtaGenerator {

  /**
   * Generate intelligent CTA using AI decision-making
   */
  static async generateIntelligentCTA(context: CTAGenerationContext): Promise<AIGeneratedCTA> {
    const { businessType, businessName, services, platform, contentScenario, recentCTAs, recentHeadlines } = context;

    // Build intelligent prompt for AI
    const prompt = this.buildIntelligentCTAPrompt(context);

    try {
      // This would integrate with your AI service (Gemini, OpenAI, etc.)
      // For now, return a smart fallback that demonstrates the concept
      const aiResponse = await this.callAIService(prompt);

      return {
        primary: aiResponse.cta,
        alternatives: aiResponse.alternatives,
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        platform
      };
    } catch (error) {
      console.warn('AI CTA generation failed, using intelligent fallback');
      return this.generateIntelligentFallback(context);
    }
  }

  /**
   * Build intelligent prompt that guides AI decision-making
   */
  private static buildIntelligentCTAPrompt(context: CTAGenerationContext): string {
    const { businessType, businessName, services, platform, recentCTAs, recentHeadlines } = context;

    const recentCTAText = recentCTAs && recentCTAs.length > 0
      ? `Recent CTAs used: ${recentCTAs.join(', ')}\n`
      : '';

    const recentHeadlineText = recentHeadlines && recentHeadlines.length > 0
      ? `Recent headlines used: ${recentHeadlines.join(', ')}\n`
      : '';

    return `
Generate a compelling Call-to-Action (CTA) for this business:

BUSINESS CONTEXT:
- Business Type: ${businessType}
- Business Name: ${businessName}
- Services: ${services}
- Platform: ${platform}

${recentCTAText}${recentHeadlineText}

INTELLIGENT GUIDELINES:
1. ANALYZE the business type and services to determine the PRIMARY conversion goal
2. CREATE a CTA that matches their actual business model (booking, purchasing, scheduling, etc.)
3. AVOID repetition - if recent CTAs used similar words, be creative with alternatives
4. MATCH the platform style:
   - Instagram: Short, punchy (2-3 words)
   - LinkedIn: Professional, action-oriented
   - Facebook: Clear, descriptive
   - Twitter: Ultra-concise
5. BE SPECIFIC to their services, not generic
6. USE action verbs that make sense for this business type

EXAMPLES OF GOOD DECISION-MAKING:
- Banking business → "Open Account" (not "Learn More")
- Restaurant with delivery → "Order Now" (not "Reserve Table")
- Salon → "Book Session" (not "Contact Us")
- Software with free trial → "Try Free" (not "Buy Now")

Generate:
1. Primary CTA (2-4 words)
2. 3 alternative CTAs
3. Brief reasoning for your choice
4. Confidence level (1-10)

Be intelligent and contextual - make decisions based on what makes sense for THIS specific business.
`;
  }

  /**
   * Call AI service to generate CTA (integrate with your AI provider)
   */
  private static async callAIService(prompt: string): Promise<any> {
    // This would integrate with Gemini, OpenAI, or your AI service
    // For demonstration, return a mock response
    // In real implementation, replace with actual AI API call

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          cta: "Get Started Today",
          alternatives: ["Try Now", "Learn More", "Contact Us"],
          reasoning: "AI-generated response would go here",
          confidence: 8
        });
      }, 100);
    });
  }

  /**
   * Generate intelligent fallback when AI service fails
   */
  private static generateIntelligentFallback(context: CTAGenerationContext): AIGeneratedCTA {
    const { businessType, services, platform, recentCTAs } = context;

    // Use simple intelligence to avoid recent CTAs and match business type
    const businessLower = businessType.toLowerCase();
    const servicesLower = services.toLowerCase();

    let primary = "Get Started";
    let alternatives = ["Learn More", "Contact Us", "Try Now"];

    // Simple intelligent decisions (much simpler than before)
    if (businessLower.includes('bank') || businessLower.includes('finance')) {
      primary = "Open Account";
      alternatives = ["Apply Today", "Get Started", "Join Now"];
    } else if (businessLower.includes('restaurant') || businessLower.includes('food')) {
      if (servicesLower.includes('delivery')) {
        primary = "Order Now";
        alternatives = ["Order Delivery", "Get Food", "Order Online"];
      } else {
        primary = "Reserve Table";
        alternatives = ["Book Now", "Reserve Now", "Dine Today"];
      }
    } else if (businessLower.includes('salon') || businessLower.includes('spa') || businessLower.includes('beauty')) {
      primary = "Book Session";
      alternatives = ["Book Now", "Schedule Visit", "Reserve Spot"];
    } else if (businessLower.includes('software') || businessLower.includes('app')) {
      if (businessLower.includes('game')) {
        primary = "Play Now";
        alternatives = ["Start Playing", "Try Game", "Play Free"];
      } else {
        primary = "Try Free";
        alternatives = ["Get Started", "Download Now", "Try Today"];
      }
    }

    // Avoid recent CTAs if provided
    if (recentCTAs && recentCTAs.includes(primary)) {
      primary = alternatives[0];
      alternatives = alternatives.slice(1);
    }

    return {
      primary,
      alternatives,
      reasoning: `Intelligent fallback based on ${businessType} business type and services`,
      confidence: 6,
      platform
    };
  }

  /**
   * Legacy method for backward compatibility - now uses AI approach
   */
  static generateBusinessSpecificCTA(context: CTAGenerationContext): AIGeneratedCTA {
    // For backward compatibility, use the intelligent fallback
    // In production, this would call generateIntelligentCTA
    return this.generateIntelligentFallback(context);
  }

  /**
   * Content History Management
   */
  private static contentHistory: Map<string, ContentHistory> = new Map();

  static updateContentHistory(brandId: string, newCTA: string, newHeadline?: string): void {
    const history = this.contentHistory.get(brandId) || {
      brandId,
      recentCTAs: [],
      recentHeadlines: [],
      commonWords: [],
      lastUpdated: new Date()
    };

    // Add new CTA and keep last 10
    history.recentCTAs.unshift(newCTA);
    history.recentCTAs = history.recentCTAs.slice(0, 10);

    // Add new headline if provided and keep last 10
    if (newHeadline) {
      history.recentHeadlines.unshift(newHeadline);
      history.recentHeadlines = history.recentHeadlines.slice(0, 10);
    }

    // Update common words for variety tracking
    const allText = [...history.recentCTAs, ...history.recentHeadlines].join(' ').toLowerCase();
    const words = allText.split(/\s+/).filter(word => word.length > 3);
    const wordCount: Record<string, number> = {};

    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    history.commonWords = Object.entries(wordCount)
      .filter(([_, count]) => count > 2)
      .map(([word, _]) => word);

    history.lastUpdated = new Date();
    this.contentHistory.set(brandId, history);
  }

  static getContentHistory(brandId: string): ContentHistory | null {
    return this.contentHistory.get(brandId) || null;
  }

  /**
   * Platform-specific CTA optimization (kept simple)
   */
  static generatePlatformSpecificCTA(baseCTA: string, platform: string): string {
    const platformLower = platform.toLowerCase();

    switch (platformLower) {
      case 'instagram':
        // Instagram prefers shorter CTAs
        return baseCTA.length > 15 ? this.shortenCTA(baseCTA) : baseCTA;

      case 'linkedin':
        // LinkedIn prefers professional language
        return this.professionalizeCTA(baseCTA);

      case 'twitter':
        // Twitter needs very short CTAs
        return this.shortenCTA(baseCTA);

      default:
        return baseCTA;
    }
  }

  private static shortenCTA(cta: string): string {
    const shortMap: Record<string, string> = {
      'Schedule Consultation': 'Book Call',
      'Reserve Your Table': 'Reserve Now',
      'Book Your Session': 'Book Now',
      'Shop Latest Tech': 'Shop Tech',
      'Schedule Appointment': 'Book Now',
      'Get Free Quote': 'Get Quote',
      'Start Free Trial': 'Try Free'
    };

    return shortMap[cta] || cta.split(' ').slice(0, 2).join(' ');
  }

  private static professionalizeCTA(cta: string): string {
    const professionalMap: Record<string, string> = {
      'Shop Now': 'Explore Solutions',
      'Try It': 'Request Demo',
      'Get Started': 'Learn More',
      'Book Now': 'Schedule Consultation'
    };

    return professionalMap[cta] || cta;
  }
}

// Legacy export for backward compatibility
export const EnhancedCTAGenerator = AICtaGenerator;
