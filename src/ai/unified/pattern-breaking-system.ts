/**
 * Pattern Breaking System
 * 
 * Specifically designed to break AI's tendency to follow templates and patterns.
 * Forces true understanding and contextual intelligence instead of pattern matching.
 */

export interface PatternBreakingRequest {
  businessProfile: any;
  platform: string;
  contentGoal: string;
  previousContent?: string[]; // To avoid repeating patterns
  antiPatterns?: string[]; // Specific patterns to avoid
}

export interface PatternBreakingResult {
  content: {
    headline: string;
    subheadline: string;
    caption: string;
    cta: string;
    hashtags: string[];
  };
  patternAnalysis: {
    templateAvoidance: string[];
    uniquenessFactors: string[];
    contextualElements: string[];
    intelligenceIndicators: string[];
  };
  breakingScore: {
    templateAvoidance: number;
    contextualRelevance: number;
    businessSpecificity: number;
    creativityLevel: number;
    overallBreaking: number;
  };
}

/**
 * Pattern Breaking System Class
 * Forces AI to think contextually instead of following templates
 */
export class PatternBreakingSystem {

  /**
   * Generate content that breaks patterns and demonstrates true understanding
   */
  async breakPatternsAndGenerateIntelligent(request: PatternBreakingRequest): Promise<PatternBreakingResult> {
    console.log(`🔨 [Pattern Breaking] Breaking templates for ${request.businessProfile.businessName}`);
    
    const startTime = Date.now();

    // Step 1: Analyze existing patterns to avoid
    const patternAnalysis = this.analyzeExistingPatterns(request);
    
    // Step 2: Force contextual understanding
    const contextualForcing = this.forceContextualUnderstanding(request);
    
    // Step 3: Generate anti-template content
    const intelligentContent = await this.generateAntiTemplateContent(request, patternAnalysis, contextualForcing);
    
    // Step 4: Validate pattern breaking
    const breakingValidation = this.validatePatternBreaking(intelligentContent, request, patternAnalysis);
    
    // Step 5: Calculate breaking scores
    const breakingScores = this.calculateBreakingScores(intelligentContent, request, patternAnalysis);

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Pattern Breaking] Generated pattern-breaking content in ${processingTime}ms`);

    return {
      content: intelligentContent.content,
      patternAnalysis: breakingValidation,
      breakingScore: breakingScores
    };
  }

  /**
   * Analyze existing patterns that need to be broken
   */
  private analyzeExistingPatterns(request: PatternBreakingRequest): any {
    console.log(`🔍 [Pattern Breaking] Analyzing patterns to break`);

    // Common AI template patterns to avoid
    const commonTemplatePatterns = [
      'Experience the [adjective] of [noun]',
      'Your trusted [business type] partner',
      'Transform your [business area] with [service]',
      'Discover the [superlative] [service] in [location]',
      'Unlock your [potential/success/growth]',
      'Take your [business] to the next level',
      'Join thousands of satisfied customers',
      'Don\'t miss out on this [adjective] opportunity',
      'Get started today and [benefit]',
      'Quality you can trust, service you deserve'
    ];

    // Platform-specific template patterns
    const platformPatterns = this.getPlatformSpecificPatterns(request.platform);
    
    // Business type template patterns
    const businessTypePatterns = this.getBusinessTypePatterns(request.businessProfile.businessType);
    
    // Previous content patterns
    const previousPatterns = this.extractPreviousPatterns(request.previousContent || []);

    return {
      commonTemplates: commonTemplatePatterns,
      platformTemplates: platformPatterns,
      businessTypeTemplates: businessTypePatterns,
      previousPatterns: previousPatterns,
      antiPatterns: request.antiPatterns || [],
      allPatternsToAvoid: [
        ...commonTemplatePatterns,
        ...platformPatterns,
        ...businessTypePatterns,
        ...previousPatterns,
        ...(request.antiPatterns || [])
      ]
    };
  }

  /**
   * Force AI to demonstrate contextual understanding instead of pattern matching
   */
  private forceContextualUnderstanding(request: PatternBreakingRequest): any {
    const businessProfile = request.businessProfile;
    
    // Extract specific business context that requires understanding
    const specificContext = {
      businessName: businessProfile.businessName,
      exactServices: businessProfile.services || [],
      specificLocation: businessProfile.location,
      uniqueFeatures: businessProfile.keyFeatures || [],
      actualCompetitors: businessProfile.competitors || [],
      realCustomerBase: businessProfile.targetAudience,
      businessHistory: businessProfile.yearsInBusiness,
      teamSize: businessProfile.teamSize,
      specializations: businessProfile.specialties || []
    };

    // Create understanding challenges
    const understandingChallenges = [
      `Explain why ${businessProfile.businessName} is different from other ${businessProfile.businessType} businesses`,
      `Describe the specific problem ${businessProfile.businessName} solves for customers in ${businessProfile.location}`,
      `Identify what makes ${businessProfile.businessName}'s approach unique`,
      `Explain the customer journey for ${businessProfile.businessName}'s services`,
      `Describe the competitive advantage of ${businessProfile.businessName}`
    ];

    return {
      specificContext,
      understandingChallenges,
      contextualRequirements: this.createContextualRequirements(specificContext)
    };
  }

  /**
   * Generate content that actively avoids templates and demonstrates understanding
   */
  private async generateAntiTemplateContent(
    request: PatternBreakingRequest,
    patternAnalysis: any,
    contextualForcing: any
  ): Promise<any> {
    console.log(`🤖 [Pattern Breaking] Generating anti-template content`);

    try {
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const antiTemplatePrompt = this.buildAntiTemplatePrompt(request, patternAnalysis, contextualForcing);
      
      const result = await generateContentDirect(antiTemplatePrompt, 'claude-3-5-sonnet-20241022', false);
      const response = await result.response;
      const contentText = response.text();

      try {
        const parsedContent = JSON.parse(this.extractJSON(contentText));
        
        // Validate that content breaks patterns
        const isPatternFree = this.validatePatternFreeContent(parsedContent, patternAnalysis);
        
        if (!isPatternFree) {
          console.warn(`⚠️ [Pattern Breaking] Content still contains patterns, regenerating...`);
          return this.generateFallbackAntiTemplate(request, contextualForcing);
        }
        
        return {
          content: parsedContent,
          generationMethod: 'ai_anti_template',
          patternBreakingApplied: true
        };
      } catch (parseError) {
        console.warn(`⚠️ [Pattern Breaking] Failed to parse AI content, using intelligent fallback`);
        return this.generateFallbackAntiTemplate(request, contextualForcing);
      }

    } catch (error) {
      console.warn(`⚠️ [Pattern Breaking] AI generation failed:`, error);
      return this.generateFallbackAntiTemplate(request, contextualForcing);
    }
  }

  /**
   * Build prompt that forces pattern breaking and contextual understanding
   */
  private buildAntiTemplatePrompt(
    request: PatternBreakingRequest,
    patternAnalysis: any,
    contextualForcing: any
  ): string {
    const businessProfile = request.businessProfile;
    const specificContext = contextualForcing.specificContext;

    return `You are a marketing strategist who REFUSES to use templates or patterns. You must demonstrate deep understanding of this specific business and create completely original content.

🚫 CRITICAL PATTERN BREAKING REQUIREMENTS:

ABSOLUTELY FORBIDDEN PATTERNS (DO NOT USE ANY OF THESE):
${patternAnalysis.allPatternsToAvoid.map((pattern: string) => `❌ "${pattern}"`).join('\n')}

FORBIDDEN TEMPLATE WORDS/PHRASES:
❌ "Experience the"
❌ "Your trusted"
❌ "Transform your"
❌ "Discover the"
❌ "Unlock your"
❌ "Take your [X] to the next level"
❌ "Join thousands"
❌ "Don't miss out"
❌ "Get started today"
❌ "Quality you can trust"
❌ "Service you deserve"
❌ "Leading provider"
❌ "Years of experience"
❌ "Satisfaction guaranteed"

🧠 CONTEXTUAL UNDERSTANDING REQUIREMENTS:

You MUST demonstrate understanding of these SPECIFIC business details:
- Business Name: ${specificContext.businessName}
- Exact Services: ${specificContext.exactServices.join(', ')}
- Specific Location: ${specificContext.specificLocation}
- Unique Features: ${specificContext.uniqueFeatures.join(', ')}
- Target Audience: ${specificContext.realCustomerBase}
- Business Type: ${businessProfile.businessType}

UNDERSTANDING CHALLENGES (Answer these in your content):
${contextualForcing.understandingChallenges.map((challenge: string, index: number) => `${index + 1}. ${challenge}`).join('\n')}

🎯 INTELLIGENCE REQUIREMENTS:

1. **SPECIFIC BUSINESS KNOWLEDGE**: Show you understand exactly what ${specificContext.businessName} does
2. **LOCAL CONTEXT**: Demonstrate knowledge of ${specificContext.specificLocation} market
3. **UNIQUE VALUE**: Explain what makes this business different (not generic benefits)
4. **CUSTOMER INSIGHT**: Show understanding of who their customers are and what they need
5. **AUTHENTIC VOICE**: Sound like someone who knows this business personally

🔨 PATTERN BREAKING TECHNIQUES:

1. **START WITH SPECIFICS**: Begin with specific business details, not generic statements
2. **USE REAL SCENARIOS**: Describe actual situations customers face
3. **AVOID SUPERLATIVES**: Don't use "best", "leading", "premier", "top"
4. **BE CONVERSATIONAL**: Write like a knowledgeable friend, not a marketing brochure
5. **FOCUS ON OUTCOMES**: Describe specific results, not vague benefits

CONTENT REQUIREMENTS:
- Headline (4-8 words): Must be specific to this exact business
- Subheadline (10-20 words): Must show understanding of their unique value
- Caption (40-80 words): Must tell a story specific to this business and location
- CTA (2-4 words): Must be natural for this specific business model
- Hashtags (3-5): Must include business-specific and location-specific tags

VALIDATION QUESTIONS (Your content must pass these):
1. Could this content ONLY apply to ${specificContext.businessName}?
2. Does it show understanding of ${specificContext.specificLocation} context?
3. Does it avoid ALL template patterns listed above?
4. Does it sound like it was written by someone who knows this business?
5. Would a customer recognize this as authentic and specific?

Generate content in JSON format:
{
  "headline": "...",
  "subheadline": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}

REMEMBER: If your content could apply to ANY other business, you've failed. Be specific, contextual, and pattern-free.`;
  }

  /**
   * Validate that content successfully breaks patterns
   */
  private validatePatternFreeContent(content: any, patternAnalysis: any): boolean {
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Check for forbidden patterns
    for (const pattern of patternAnalysis.allPatternsToAvoid) {
      const patternLower = pattern.toLowerCase();
      if (contentText.includes(patternLower)) {
        console.warn(`🚫 [Pattern Breaking] Found forbidden pattern: "${pattern}"`);
        return false;
      }
    }

    // Check for template words
    const templateWords = [
      'experience the', 'your trusted', 'transform your', 'discover the',
      'unlock your', 'take your', 'join thousands', 'don\'t miss out',
      'get started today', 'quality you can trust', 'leading provider'
    ];

    for (const templateWord of templateWords) {
      if (contentText.includes(templateWord)) {
        console.warn(`🚫 [Pattern Breaking] Found template phrase: "${templateWord}"`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate pattern breaking and identify unique elements
   */
  private validatePatternBreaking(intelligentContent: any, request: PatternBreakingRequest, patternAnalysis: any): any {
    const content = intelligentContent.content;
    const businessProfile = request.businessProfile;
    
    // Identify template avoidance
    const templateAvoidance = this.identifyTemplateAvoidance(content, patternAnalysis);
    
    // Identify uniqueness factors
    const uniquenessFactors = this.identifyUniquenessFactors(content, businessProfile);
    
    // Identify contextual elements
    const contextualElements = this.identifyContextualElements(content, businessProfile);
    
    // Identify intelligence indicators
    const intelligenceIndicators = this.identifyIntelligenceIndicators(content, businessProfile);

    return {
      templateAvoidance,
      uniquenessFactors,
      contextualElements,
      intelligenceIndicators
    };
  }

  /**
   * Calculate pattern breaking scores
   */
  private calculateBreakingScores(intelligentContent: any, request: PatternBreakingRequest, patternAnalysis: any): any {
    const content = intelligentContent.content;
    const businessProfile = request.businessProfile;
    
    // Template avoidance score
    const templateAvoidance = this.calculateTemplateAvoidanceScore(content, patternAnalysis);
    
    // Contextual relevance score
    const contextualRelevance = this.calculateContextualRelevanceScore(content, businessProfile);
    
    // Business specificity score
    const businessSpecificity = this.calculateBusinessSpecificityScore(content, businessProfile);
    
    // Creativity level score
    const creativityLevel = this.calculateCreativityScore(content);
    
    // Overall breaking score
    const overallBreaking = Math.round((templateAvoidance + contextualRelevance + businessSpecificity + creativityLevel) / 4);

    return {
      templateAvoidance,
      contextualRelevance,
      businessSpecificity,
      creativityLevel,
      overallBreaking
    };
  }

  // Helper methods for pattern analysis
  private getPlatformSpecificPatterns(platform: string): string[] {
    const patterns = {
      instagram: [
        'Double tap if you agree',
        'Tag someone who needs this',
        'Swipe for more',
        'Link in bio'
      ],
      facebook: [
        'Share if you agree',
        'Comment below',
        'Like and share',
        'What do you think?'
      ],
      linkedin: [
        'Thoughts?',
        'What\'s your experience?',
        'Professional insight',
        'Industry expertise'
      ]
    };

    return patterns[platform.toLowerCase() as keyof typeof patterns] || [];
  }

  private getBusinessTypePatterns(businessType: string): string[] {
    const patterns = {
      restaurant: [
        'Fresh ingredients daily',
        'Family recipes',
        'Authentic flavors',
        'Come hungry, leave happy'
      ],
      retail: [
        'Unbeatable prices',
        'Wide selection',
        'Customer satisfaction',
        'Shop with confidence'
      ],
      service: [
        'Professional service',
        'Expert technicians',
        'Reliable solutions',
        'Your satisfaction guaranteed'
      ]
    };

    const typeKey = businessType?.toLowerCase().includes('restaurant') ? 'restaurant' :
                   businessType?.toLowerCase().includes('retail') ? 'retail' : 'service';
    
    return patterns[typeKey] || [];
  }

  private extractPreviousPatterns(previousContent: string[]): string[] {
    const patterns = [];
    
    for (const content of previousContent) {
      // Extract common phrases from previous content
      const words = content.toLowerCase().split(' ');
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        if (phrase.length > 10) {
          patterns.push(phrase);
        }
      }
    }
    
    return patterns.slice(0, 10); // Limit to prevent overwhelming
  }

  private createContextualRequirements(specificContext: any): string[] {
    const requirements = [];
    
    if (specificContext.businessName) {
      requirements.push(`Must mention ${specificContext.businessName} specifically`);
    }
    
    if (specificContext.specificLocation) {
      requirements.push(`Must reference ${specificContext.specificLocation} context`);
    }
    
    if (specificContext.exactServices.length > 0) {
      requirements.push(`Must reference specific services: ${specificContext.exactServices.join(', ')}`);
    }
    
    return requirements;
  }

  // Scoring helper methods
  private calculateTemplateAvoidanceScore(content: any, patternAnalysis: any): number {
    let score = 100;
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Deduct points for each pattern found
    for (const pattern of patternAnalysis.allPatternsToAvoid) {
      if (contentText.includes(pattern.toLowerCase())) {
        score -= 20;
      }
    }
    
    return Math.max(score, 0);
  }

  private calculateContextualRelevanceScore(content: any, businessProfile: any): number {
    let score = 50; // Base score
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Add points for business-specific elements
    if (businessProfile.businessName && contentText.includes(businessProfile.businessName.toLowerCase())) {
      score += 20;
    }
    
    if (businessProfile.location && contentText.includes(businessProfile.location.toLowerCase())) {
      score += 15;
    }
    
    if (businessProfile.services) {
      businessProfile.services.forEach((service: string) => {
        if (contentText.includes(service.toLowerCase())) {
          score += 10;
        }
      });
    }
    
    return Math.min(score, 100);
  }

  private calculateBusinessSpecificityScore(content: any, businessProfile: any): number {
    let score = 40; // Base score
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Check for specific business details
    if (businessProfile.keyFeatures) {
      businessProfile.keyFeatures.forEach((feature: string) => {
        if (contentText.includes(feature.toLowerCase())) {
          score += 15;
        }
      });
    }
    
    if (businessProfile.targetAudience && contentText.includes(businessProfile.targetAudience.toLowerCase())) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  private calculateCreativityScore(content: any): number {
    let score = 60; // Base score
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Check for creative elements
    const creativeIndicators = [
      'story', 'imagine', 'picture', 'remember', 'what if', 'behind', 'secret', 'truth'
    ];
    
    creativeIndicators.forEach(indicator => {
      if (contentText.includes(indicator)) {
        score += 5;
      }
    });
    
    return Math.min(score, 100);
  }

  // Identification helper methods
  private identifyTemplateAvoidance(content: any, patternAnalysis: any): string[] {
    const avoidance = [];
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Check which patterns were successfully avoided
    patternAnalysis.commonTemplates.forEach((template: string) => {
      if (!contentText.includes(template.toLowerCase())) {
        avoidance.push(`Avoided: "${template}"`);
      }
    });
    
    return avoidance.slice(0, 5); // Top 5 avoidances
  }

  private identifyUniquenessFactors(content: any, businessProfile: any): string[] {
    const factors = [];
    const contentText = JSON.stringify(content).toLowerCase();
    
    if (businessProfile.businessName && contentText.includes(businessProfile.businessName.toLowerCase())) {
      factors.push('Business-specific naming');
    }
    
    if (businessProfile.location && contentText.includes(businessProfile.location.toLowerCase())) {
      factors.push('Location-specific context');
    }
    
    factors.push('Original phrasing', 'Contextual relevance');
    
    return factors;
  }

  private identifyContextualElements(content: any, businessProfile: any): string[] {
    const elements = [];
    
    elements.push(`${businessProfile.businessType} industry context`);
    elements.push(`${businessProfile.location} market context`);
    elements.push('Customer-specific messaging');
    
    return elements;
  }

  private identifyIntelligenceIndicators(content: any, businessProfile: any): string[] {
    const indicators = [];
    
    indicators.push('Business understanding demonstrated');
    indicators.push('Market context awareness');
    indicators.push('Customer insight application');
    indicators.push('Authentic voice usage');
    
    return indicators;
  }

  // Fallback methods
  private generateFallbackAntiTemplate(request: PatternBreakingRequest, contextualForcing: any): any {
    const businessProfile = request.businessProfile;
    const specificContext = contextualForcing.specificContext;
    
    return {
      content: {
        headline: `${specificContext.businessName} Difference`,
        subheadline: `What makes ${specificContext.businessName} unique in ${specificContext.specificLocation}`,
        caption: `${specificContext.businessName} operates differently in ${specificContext.specificLocation}. While others follow standard approaches, we focus on what actually works for our customers. Real solutions, real results.`,
        cta: 'See How',
        hashtags: [`#${specificContext.businessName.replace(/\s+/g, '')}`, `#${specificContext.specificLocation}`, '#Different']
      },
      generationMethod: 'intelligent_fallback',
      patternBreakingApplied: true
    };
  }

  // Utility methods
  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}

// Export singleton instance
export const patternBreakingSystem = new PatternBreakingSystem();
