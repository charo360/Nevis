/**
 * Template Elimination System
 * 
 * Replaces all rigid templates with dynamic, contextual content generation.
 * No more "Flash Sale", "Grand Opening", "We're Hiring" generic templates.
 */

export interface ContextualContentRequest {
  businessProfile: any;
  platform: string;
  userIntent?: string; // What the user actually wants to communicate
  businessContext?: {
    currentSituation: string;
    specificGoals: string[];
    targetOutcome: string;
  };
  realTimeFactors?: {
    currentEvents: string[];
    marketConditions: string[];
    competitorActions: string[];
    customerFeedback: string[];
  };
}

export interface DynamicContentSuggestion {
  contentType: string;
  reasoning: string;
  content: {
    headline: string;
    subheadline: string;
    description: string;
    cta: string;
  };
  contextualRelevance: number;
  uniquenessScore: number;
  businessAlignment: number;
}

/**
 * Template Elimination System Class
 * Generates contextual content suggestions instead of rigid templates
 */
export class TemplateEliminationSystem {

  /**
   * Generate contextual content suggestions based on business reality
   */
  async generateContextualSuggestions(request: ContextualContentRequest): Promise<DynamicContentSuggestion[]> {
    console.log(`🚫 [Template Elimination] Generating contextual suggestions for ${request.businessProfile.businessName}`);
    
    // Step 1: Analyze current business situation
    const businessSituation = this.analyzeBusinessSituation(request);
    
    // Step 2: Identify real opportunities
    const realOpportunities = this.identifyRealOpportunities(request, businessSituation);
    
    // Step 3: Generate contextual suggestions
    const contextualSuggestions = await this.generateContextualContent(request, realOpportunities);
    
    // Step 4: Rank by relevance and uniqueness
    const rankedSuggestions = this.rankSuggestionsByIntelligence(contextualSuggestions, request);

    console.log(`✅ [Template Elimination] Generated ${rankedSuggestions.length} contextual suggestions`);
    
    return rankedSuggestions;
  }

  /**
   * Analyze current business situation to understand real context
   */
  private analyzeBusinessSituation(request: ContextualContentRequest): any {
    const businessProfile = request.businessProfile;
    
    // Analyze business maturity and stage
    const businessStage = this.determineBusinessStage(businessProfile);
    
    // Identify current challenges and opportunities
    const currentChallenges = this.identifyCurrentChallenges(businessProfile, request.realTimeFactors);
    
    // Assess market position
    const marketPosition = this.assessMarketPosition(businessProfile);
    
    // Identify growth opportunities
    const growthOpportunities = this.identifyGrowthOpportunities(businessProfile, request.realTimeFactors);

    return {
      stage: businessStage,
      challenges: currentChallenges,
      position: marketPosition,
      opportunities: growthOpportunities,
      uniqueStrengths: this.identifyUniqueStrengths(businessProfile)
    };
  }

  /**
   * Identify real business opportunities instead of generic templates
   */
  private identifyRealOpportunities(request: ContextualContentRequest, businessSituation: any): any[] {
    const opportunities = [];
    
    // Business stage-specific opportunities
    if (businessSituation.stage === 'startup') {
      opportunities.push({
        type: 'credibility_building',
        description: 'Build trust and credibility in the market',
        urgency: 'high',
        approach: 'expertise_demonstration'
      });
    } else if (businessSituation.stage === 'growth') {
      opportunities.push({
        type: 'expansion_announcement',
        description: 'Communicate growth and expanded capabilities',
        urgency: 'medium',
        approach: 'success_story_sharing'
      });
    } else if (businessSituation.stage === 'established') {
      opportunities.push({
        type: 'innovation_showcase',
        description: 'Highlight continuous innovation and improvement',
        urgency: 'medium',
        approach: 'thought_leadership'
      });
    }

    // Challenge-based opportunities
    businessSituation.challenges.forEach((challenge: string) => {
      opportunities.push({
        type: 'challenge_addressing',
        description: `Address ${challenge} proactively`,
        urgency: 'high',
        approach: 'solution_focused'
      });
    });

    // Market position opportunities
    if (businessSituation.position === 'leader') {
      opportunities.push({
        type: 'leadership_reinforcement',
        description: 'Reinforce market leadership position',
        urgency: 'low',
        approach: 'authority_building'
      });
    } else if (businessSituation.position === 'challenger') {
      opportunities.push({
        type: 'differentiation_emphasis',
        description: 'Emphasize unique differentiators',
        urgency: 'high',
        approach: 'competitive_positioning'
      });
    }

    // Real-time opportunities
    if (request.realTimeFactors?.currentEvents) {
      request.realTimeFactors.currentEvents.forEach(event => {
        opportunities.push({
          type: 'event_relevance',
          description: `Leverage ${event} for business relevance`,
          urgency: 'high',
          approach: 'timely_connection'
        });
      });
    }

    return opportunities;
  }

  /**
   * Generate contextual content based on real opportunities
   */
  private async generateContextualContent(
    request: ContextualContentRequest, 
    opportunities: any[]
  ): Promise<DynamicContentSuggestion[]> {
    const suggestions: DynamicContentSuggestion[] = [];
    
    for (const opportunity of opportunities.slice(0, 5)) { // Limit to top 5 opportunities
      try {
        const suggestion = await this.generateOpportunityContent(request, opportunity);
        suggestions.push(suggestion);
      } catch (error) {
        console.warn(`⚠️ [Template Elimination] Failed to generate content for opportunity:`, error);
      }
    }

    return suggestions;
  }

  /**
   * Generate content for a specific opportunity
   */
  private async generateOpportunityContent(
    request: ContextualContentRequest, 
    opportunity: any
  ): Promise<DynamicContentSuggestion> {
    console.log(`🎯 [Template Elimination] Generating content for ${opportunity.type}`);

    try {
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const contextualPrompt = this.buildContextualPrompt(request, opportunity);
      
      const result = await generateContentDirect(contextualPrompt, 'claude-3-5-sonnet-20241022', false);
      const response = await result.response;
      const contentText = response.text();

      try {
        const parsedContent = JSON.parse(this.extractJSON(contentText));
        
        return {
          contentType: opportunity.type,
          reasoning: opportunity.description,
          content: parsedContent,
          contextualRelevance: this.calculateContextualRelevance(parsedContent, request),
          uniquenessScore: this.calculateUniquenessScore(parsedContent),
          businessAlignment: this.calculateBusinessAlignment(parsedContent, request.businessProfile)
        };
      } catch (parseError) {
        return this.generateFallbackSuggestion(request, opportunity);
      }

    } catch (error) {
      return this.generateFallbackSuggestion(request, opportunity);
    }
  }

  /**
   * Build contextual prompt that avoids generic templates
   */
  private buildContextualPrompt(request: ContextualContentRequest, opportunity: any): string {
    const businessProfile = request.businessProfile;
    
    return `You are a strategic marketing consultant creating contextual content for a specific business opportunity. Avoid all generic templates and create content that reflects the real business situation.

BUSINESS CONTEXT:
- Business: ${businessProfile.businessName}
- Type: ${businessProfile.businessType}
- Location: ${businessProfile.location}
- Services: ${businessProfile.services?.join(', ') || 'Not specified'}
- Current Stage: ${opportunity.approach}

OPPORTUNITY CONTEXT:
- Opportunity Type: ${opportunity.type}
- Description: ${opportunity.description}
- Urgency: ${opportunity.urgency}
- Strategic Approach: ${opportunity.approach}

USER INTENT: ${request.userIntent || 'Create engaging content that drives business results'}

CONTEXTUAL REQUIREMENTS:
1. **NO GENERIC TEMPLATES**: Avoid "Flash Sale", "Grand Opening", "We're Hiring" type content
2. **BUSINESS-SPECIFIC**: Content must reflect this specific business and situation
3. **OPPORTUNITY-FOCUSED**: Address the specific opportunity identified
4. **AUTHENTIC VOICE**: Sound like someone who knows this business intimately
5. **ACTIONABLE**: Create content that drives specific business outcomes

BANNED GENERIC PHRASES:
- "Grand Opening"
- "Flash Sale" 
- "We're Hiring"
- "Free Consultation"
- "Limited Time Offer"
- "Don't Miss Out"
- "Act Now"
- "Special Promotion"

CONTENT REQUIREMENTS:
- Headline (4-8 words): Specific to this business and opportunity
- Subheadline (10-20 words): Explains the specific value or situation
- Description (30-60 words): Tells the story of this specific opportunity
- CTA (2-4 words): Natural action that makes sense for this business

Generate content in JSON format:
{
  "headline": "...",
  "subheadline": "...",
  "description": "...",
  "cta": "..."
}

Be specific, contextual, and completely avoid generic marketing templates.`;
  }

  /**
   * Rank suggestions by intelligence metrics
   */
  private rankSuggestionsByIntelligence(
    suggestions: DynamicContentSuggestion[], 
    request: ContextualContentRequest
  ): DynamicContentSuggestion[] {
    return suggestions.sort((a, b) => {
      const scoreA = (a.contextualRelevance + a.uniquenessScore + a.businessAlignment) / 3;
      const scoreB = (b.contextualRelevance + b.uniquenessScore + b.businessAlignment) / 3;
      return scoreB - scoreA;
    });
  }

  // Business analysis helper methods
  private determineBusinessStage(businessProfile: any): string {
    if (businessProfile.yearsInBusiness) {
      const years = parseInt(businessProfile.yearsInBusiness);
      if (years < 2) return 'startup';
      if (years < 5) return 'growth';
      return 'established';
    }
    
    // Analyze other indicators
    if (businessProfile.teamSize && businessProfile.teamSize < 5) return 'startup';
    if (businessProfile.locations && businessProfile.locations.length > 1) return 'established';
    
    return 'growth'; // Default assumption
  }

  private identifyCurrentChallenges(businessProfile: any, realTimeFactors: any): string[] {
    const challenges = [];
    
    // Business type-specific challenges
    const businessType = businessProfile.businessType?.toLowerCase();
    if (businessType?.includes('restaurant')) {
      challenges.push('customer retention', 'seasonal fluctuations', 'supply chain management');
    } else if (businessType?.includes('retail')) {
      challenges.push('inventory management', 'online competition', 'customer acquisition');
    } else if (businessType?.includes('service')) {
      challenges.push('service differentiation', 'pricing pressure', 'client acquisition');
    } else {
      challenges.push('market competition', 'customer acquisition', 'brand awareness');
    }

    // Real-time challenges
    if (realTimeFactors?.marketConditions) {
      challenges.push(...realTimeFactors.marketConditions.map((condition: string) => `market ${condition}`));
    }

    return challenges.slice(0, 3); // Top 3 challenges
  }

  private assessMarketPosition(businessProfile: any): string {
    // Analyze competitive position indicators
    if (businessProfile.marketShare && businessProfile.marketShare > 30) return 'leader';
    if (businessProfile.competitiveAdvantages && businessProfile.competitiveAdvantages.length > 3) return 'challenger';
    if (businessProfile.yearsInBusiness && parseInt(businessProfile.yearsInBusiness) > 10) return 'established';
    
    return 'challenger'; // Default assumption
  }

  private identifyGrowthOpportunities(businessProfile: any, realTimeFactors: any): string[] {
    const opportunities = [];
    
    // Location-based opportunities
    if (businessProfile.location) {
      opportunities.push(`${businessProfile.location} market expansion`);
    }

    // Service-based opportunities
    if (businessProfile.services && businessProfile.services.length > 0) {
      opportunities.push(`${businessProfile.services[0]} specialization`);
    }

    // Real-time opportunities
    if (realTimeFactors?.currentEvents) {
      opportunities.push(...realTimeFactors.currentEvents.map((event: string) => `${event} leverage`));
    }

    return opportunities.slice(0, 3);
  }

  private identifyUniqueStrengths(businessProfile: any): string[] {
    const strengths = [];
    
    if (businessProfile.competitiveAdvantages) strengths.push(...businessProfile.competitiveAdvantages);
    if (businessProfile.certifications) strengths.push(...businessProfile.certifications);
    if (businessProfile.specialties) strengths.push(...businessProfile.specialties);
    if (businessProfile.awards) strengths.push(...businessProfile.awards);
    
    return strengths.length > 0 ? strengths : ['Local expertise', 'Customer focus', 'Quality service'];
  }

  // Scoring methods
  private calculateContextualRelevance(content: any, request: ContextualContentRequest): number {
    let score = 70; // Base score
    
    // Check for business-specific terms
    const businessName = request.businessProfile.businessName?.toLowerCase();
    const contentText = JSON.stringify(content).toLowerCase();
    
    if (businessName && contentText.includes(businessName)) score += 10;
    if (request.businessProfile.location && contentText.includes(request.businessProfile.location.toLowerCase())) score += 10;
    if (request.businessProfile.businessType && contentText.includes(request.businessProfile.businessType.toLowerCase())) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateUniquenessScore(content: any): number {
    const genericPhrases = [
      'grand opening', 'flash sale', 'limited time', 'don\'t miss out', 
      'act now', 'special offer', 'free consultation', 'quality service'
    ];
    
    let score = 100;
    const contentText = JSON.stringify(content).toLowerCase();
    
    genericPhrases.forEach(phrase => {
      if (contentText.includes(phrase)) score -= 15;
    });
    
    return Math.max(score, 20);
  }

  private calculateBusinessAlignment(content: any, businessProfile: any): number {
    let score = 60; // Base score
    
    // Check alignment with business services
    if (businessProfile.services) {
      const contentText = JSON.stringify(content).toLowerCase();
      businessProfile.services.forEach((service: string) => {
        if (contentText.includes(service.toLowerCase())) score += 10;
      });
    }
    
    // Check alignment with business values
    if (businessProfile.brandValues) {
      const contentText = JSON.stringify(content).toLowerCase();
      businessProfile.brandValues.forEach((value: string) => {
        if (contentText.includes(value.toLowerCase())) score += 5;
      });
    }
    
    return Math.min(score, 100);
  }

  // Fallback methods
  private generateFallbackSuggestion(request: ContextualContentRequest, opportunity: any): DynamicContentSuggestion {
    const businessProfile = request.businessProfile;
    
    return {
      contentType: opportunity.type,
      reasoning: opportunity.description,
      content: {
        headline: `${businessProfile.businessName} Update`,
        subheadline: `New developments in ${businessProfile.businessType}`,
        description: `${businessProfile.businessName} continues to serve ${businessProfile.location} with quality ${businessProfile.businessType} services. Stay connected for the latest updates.`,
        cta: 'Learn More'
      },
      contextualRelevance: 60,
      uniquenessScore: 70,
      businessAlignment: 80
    };
  }

  // Utility methods
  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}

// Export singleton instance
export const templateEliminationSystem = new TemplateEliminationSystem();
