/**
 * Master Intelligence Router
 * 
 * Replaces ALL template-based and pattern-following systems with unified intelligence.
 * Routes content generation through the most appropriate intelligent system.
 */

import { intelligentContentOrchestrator } from './intelligent-content-orchestrator';
import { templateEliminationSystem } from './template-elimination-system';
import { patternBreakingSystem } from './pattern-breaking-system';

export interface MasterIntelligenceRequest {
  businessProfile: any;
  platform: string;
  userIntent?: string;
  contentGoal?: 'awareness' | 'conversion' | 'engagement' | 'education';
  intelligenceLevel?: 'standard' | 'advanced' | 'maximum';
  avoidPatterns?: boolean;
  previousContent?: string[];
}

export interface MasterIntelligenceResult {
  content: {
    headline: string;
    subheadline: string;
    caption: string;
    cta: string;
    hashtags: string[];
  };
  intelligence: {
    systemUsed: string;
    intelligenceScore: number;
    contextualRelevance: number;
    uniquenessScore: number;
    businessAlignment: number;
  };
  reasoning: {
    whyThisApproach: string;
    keyInsights: string[];
    differentiationFactors: string[];
    audienceConsiderations: string[];
  };
  quality: {
    templateAvoidance: boolean;
    patternBreaking: boolean;
    contextualIntelligence: boolean;
    businessSpecificity: boolean;
    overallQuality: number;
  };
}

/**
 * Master Intelligence Router Class
 * Routes to the most appropriate intelligent system based on requirements
 */
export class MasterIntelligenceRouter {

  /**
   * Route content generation through the most intelligent system
   */
  async routeToIntelligentSystem(request: MasterIntelligenceRequest): Promise<MasterIntelligenceResult> {
    console.log(`🧠 [Master Intelligence] Routing intelligent generation for ${request.businessProfile.businessName}`);
    
    const startTime = Date.now();

    // Step 1: Analyze requirements and determine best system
    const systemAnalysis = this.analyzeSystemRequirements(request);
    
    // Step 2: Route to appropriate intelligent system
    const intelligentResult = await this.executeIntelligentGeneration(request, systemAnalysis);
    
    // Step 3: Validate and enhance result
    const validatedResult = await this.validateAndEnhanceResult(intelligentResult, request);
    
    // Step 4: Calculate comprehensive quality metrics
    const qualityMetrics = this.calculateQualityMetrics(validatedResult, request);

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Master Intelligence] Generated intelligent content in ${processingTime}ms using ${systemAnalysis.recommendedSystem}`);

    return {
      content: validatedResult.content,
      intelligence: {
        systemUsed: systemAnalysis.recommendedSystem,
        intelligenceScore: qualityMetrics.intelligenceScore,
        contextualRelevance: qualityMetrics.contextualRelevance,
        uniquenessScore: qualityMetrics.uniquenessScore,
        businessAlignment: qualityMetrics.businessAlignment
      },
      reasoning: validatedResult.reasoning,
      quality: qualityMetrics.quality
    };
  }

  /**
   * Analyze requirements to determine the best intelligent system
   */
  private analyzeSystemRequirements(request: MasterIntelligenceRequest): any {
    console.log(`🔍 [Master Intelligence] Analyzing system requirements`);

    const businessProfile = request.businessProfile;
    const intelligenceLevel = request.intelligenceLevel || 'advanced';
    
    // Analyze business complexity
    const businessComplexity = this.assessBusinessComplexity(businessProfile);
    
    // Analyze content requirements
    const contentComplexity = this.assessContentComplexity(request);
    
    // Analyze pattern breaking needs
    const patternBreakingNeeds = this.assessPatternBreakingNeeds(request);
    
    // Determine recommended system
    const recommendedSystem = this.determineRecommendedSystem(
      businessComplexity,
      contentComplexity,
      patternBreakingNeeds,
      intelligenceLevel
    );

    return {
      businessComplexity,
      contentComplexity,
      patternBreakingNeeds,
      recommendedSystem,
      systemReasoning: this.explainSystemChoice(recommendedSystem, businessComplexity, contentComplexity)
    };
  }

  /**
   * Execute generation using the most appropriate intelligent system
   */
  private async executeIntelligentGeneration(request: MasterIntelligenceRequest, systemAnalysis: any): Promise<any> {
    console.log(`🚀 [Master Intelligence] Executing ${systemAnalysis.recommendedSystem} generation`);

    try {
      switch (systemAnalysis.recommendedSystem) {
        case 'pattern_breaking':
          return await this.executePatternBreaking(request);
          
        case 'template_elimination':
          return await this.executeTemplateElimination(request);
          
        case 'intelligent_orchestrator':
          return await this.executeIntelligentOrchestrator(request);
          
        case 'hybrid_intelligence':
          return await this.executeHybridIntelligence(request);
          
        default:
          return await this.executeIntelligentOrchestrator(request);
      }
    } catch (error) {
      console.warn(`⚠️ [Master Intelligence] Primary system failed, using fallback:`, error);
      return await this.executeFallbackIntelligence(request);
    }
  }

  /**
   * Execute pattern breaking system
   */
  private async executePatternBreaking(request: MasterIntelligenceRequest): Promise<any> {
    const patternBreakingRequest = {
      businessProfile: request.businessProfile,
      platform: request.platform,
      contentGoal: request.contentGoal || 'conversion',
      previousContent: request.previousContent,
      antiPatterns: this.identifyAntiPatterns(request)
    };

    const result = await patternBreakingSystem.breakPatternsAndGenerateIntelligent(patternBreakingRequest);
    
    return {
      content: result.content,
      reasoning: {
        whyThisApproach: 'Pattern breaking system used to avoid templates and demonstrate contextual understanding',
        keyInsights: result.patternAnalysis.intelligenceIndicators,
        differentiationFactors: result.patternAnalysis.uniquenessFactors,
        audienceConsiderations: result.patternAnalysis.contextualElements
      },
      systemMetrics: result.breakingScore
    };
  }

  /**
   * Execute template elimination system
   */
  private async executeTemplateElimination(request: MasterIntelligenceRequest): Promise<any> {
    const templateEliminationRequest = {
      businessProfile: request.businessProfile,
      platform: request.platform,
      userIntent: request.userIntent,
      businessContext: this.extractBusinessContext(request.businessProfile),
      realTimeFactors: this.extractRealTimeFactors(request)
    };

    const suggestions = await templateEliminationSystem.generateContextualSuggestions(templateEliminationRequest);
    const bestSuggestion = suggestions[0]; // Use highest-ranked suggestion
    
    return {
      content: bestSuggestion.content,
      reasoning: {
        whyThisApproach: 'Template elimination system used to generate contextual, business-specific content',
        keyInsights: [bestSuggestion.reasoning],
        differentiationFactors: ['Contextual relevance', 'Business specificity'],
        audienceConsiderations: ['Real business opportunities', 'Market positioning']
      },
      systemMetrics: {
        contextualRelevance: bestSuggestion.contextualRelevance,
        uniquenessScore: bestSuggestion.uniquenessScore,
        businessAlignment: bestSuggestion.businessAlignment
      }
    };
  }

  /**
   * Execute intelligent orchestrator system
   */
  private async executeIntelligentOrchestrator(request: MasterIntelligenceRequest): Promise<any> {
    const orchestratorRequest = {
      businessProfile: request.businessProfile,
      platform: request.platform,
      contentGoal: request.contentGoal || 'conversion',
      currentContext: this.buildCurrentContext(request),
      audienceState: this.determineAudienceState(request),
      avoidancePatterns: this.buildAvoidancePatterns(request)
    };

    const result = await intelligentContentOrchestrator.generateIntelligentContent(orchestratorRequest);
    
    return {
      content: result.content,
      reasoning: {
        whyThisApproach: 'Intelligent orchestrator used for comprehensive contextual analysis and strategic content creation',
        keyInsights: result.reasoning.psychologicalTriggers,
        differentiationFactors: [result.reasoning.differentiationStrategy],
        audienceConsiderations: result.reasoning.culturalAdaptations
      },
      systemMetrics: result.intelligence
    };
  }

  /**
   * Execute hybrid intelligence combining multiple systems
   */
  private async executeHybridIntelligence(request: MasterIntelligenceRequest): Promise<any> {
    console.log(`🔄 [Master Intelligence] Executing hybrid intelligence approach`);

    // Generate content using multiple systems
    const [orchestratorResult, patternBreakingResult] = await Promise.allSettled([
      this.executeIntelligentOrchestrator(request),
      this.executePatternBreaking(request)
    ]);

    // Select best result based on quality metrics
    const results = [];
    if (orchestratorResult.status === 'fulfilled') results.push(orchestratorResult.value);
    if (patternBreakingResult.status === 'fulfilled') results.push(patternBreakingResult.value);

    if (results.length === 0) {
      return await this.executeFallbackIntelligence(request);
    }

    // Score and select best result
    const scoredResults = results.map(result => ({
      ...result,
      hybridScore: this.calculateHybridScore(result, request)
    }));

    const bestResult = scoredResults.sort((a, b) => b.hybridScore - a.hybridScore)[0];
    
    return {
      ...bestResult,
      reasoning: {
        ...bestResult.reasoning,
        whyThisApproach: 'Hybrid intelligence system selected best result from multiple intelligent approaches'
      }
    };
  }

  /**
   * Validate and enhance the generated result
   */
  private async validateAndEnhanceResult(intelligentResult: any, request: MasterIntelligenceRequest): Promise<any> {
    console.log(`✅ [Master Intelligence] Validating and enhancing result`);

    // Validate content quality
    const qualityValidation = this.validateContentQuality(intelligentResult.content, request);
    
    // Enhance if needed
    if (qualityValidation.needsEnhancement) {
      const enhancedContent = await this.enhanceContent(intelligentResult.content, request, qualityValidation);
      return {
        ...intelligentResult,
        content: enhancedContent,
        enhanced: true
      };
    }

    return {
      ...intelligentResult,
      enhanced: false
    };
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private calculateQualityMetrics(validatedResult: any, request: MasterIntelligenceRequest): any {
    const content = validatedResult.content;
    const businessProfile = request.businessProfile;
    
    // Calculate individual metrics
    const intelligenceScore = this.calculateIntelligenceScore(content, businessProfile);
    const contextualRelevance = this.calculateContextualRelevance(content, businessProfile);
    const uniquenessScore = this.calculateUniquenessScore(content, request.previousContent);
    const businessAlignment = this.calculateBusinessAlignment(content, businessProfile);
    
    // Calculate quality flags
    const templateAvoidance = this.checkTemplateAvoidance(content);
    const patternBreaking = this.checkPatternBreaking(content, request.previousContent);
    const contextualIntelligence = this.checkContextualIntelligence(content, businessProfile);
    const businessSpecificity = this.checkBusinessSpecificity(content, businessProfile);
    
    // Calculate overall quality
    const overallQuality = Math.round((intelligenceScore + contextualRelevance + uniquenessScore + businessAlignment) / 4);

    return {
      intelligenceScore,
      contextualRelevance,
      uniquenessScore,
      businessAlignment,
      quality: {
        templateAvoidance,
        patternBreaking,
        contextualIntelligence,
        businessSpecificity,
        overallQuality
      }
    };
  }

  // Helper methods for system analysis
  private assessBusinessComplexity(businessProfile: any): string {
    let complexity = 0;
    
    if (businessProfile.services && businessProfile.services.length > 3) complexity += 1;
    if (businessProfile.targetAudience && businessProfile.targetAudience.length > 50) complexity += 1;
    if (businessProfile.competitiveAdvantages && businessProfile.competitiveAdvantages.length > 2) complexity += 1;
    if (businessProfile.specialties && businessProfile.specialties.length > 0) complexity += 1;
    if (businessProfile.certifications && businessProfile.certifications.length > 0) complexity += 1;
    
    if (complexity >= 4) return 'high';
    if (complexity >= 2) return 'medium';
    return 'low';
  }

  private assessContentComplexity(request: MasterIntelligenceRequest): string {
    let complexity = 0;
    
    if (request.contentGoal === 'education') complexity += 2;
    if (request.userIntent && request.userIntent.length > 100) complexity += 1;
    if (request.previousContent && request.previousContent.length > 5) complexity += 1;
    if (request.intelligenceLevel === 'maximum') complexity += 2;
    
    if (complexity >= 4) return 'high';
    if (complexity >= 2) return 'medium';
    return 'low';
  }

  private assessPatternBreakingNeeds(request: MasterIntelligenceRequest): string {
    if (request.avoidPatterns === true) return 'high';
    if (request.previousContent && request.previousContent.length > 3) return 'medium';
    if (request.intelligenceLevel === 'maximum') return 'high';
    return 'low';
  }

  private determineRecommendedSystem(
    businessComplexity: string,
    contentComplexity: string,
    patternBreakingNeeds: string,
    intelligenceLevel: string
  ): string {
    // High pattern breaking needs
    if (patternBreakingNeeds === 'high') {
      return 'pattern_breaking';
    }
    
    // High complexity cases
    if (businessComplexity === 'high' && contentComplexity === 'high') {
      return 'hybrid_intelligence';
    }
    
    // Maximum intelligence requested
    if (intelligenceLevel === 'maximum') {
      return 'intelligent_orchestrator';
    }
    
    // Medium complexity cases
    if (businessComplexity === 'medium' || contentComplexity === 'medium') {
      return 'template_elimination';
    }
    
    // Default to intelligent orchestrator
    return 'intelligent_orchestrator';
  }

  private explainSystemChoice(recommendedSystem: string, businessComplexity: string, contentComplexity: string): string {
    const explanations = {
      pattern_breaking: 'High pattern breaking needs detected - using pattern breaking system to avoid templates',
      template_elimination: 'Medium complexity business - using template elimination for contextual content',
      intelligent_orchestrator: 'Standard intelligent generation - using orchestrator for comprehensive analysis',
      hybrid_intelligence: 'High complexity detected - using hybrid approach for maximum intelligence'
    };
    
    return explanations[recommendedSystem as keyof typeof explanations] || 'Using intelligent orchestrator as default';
  }

  // Execution helper methods
  private identifyAntiPatterns(request: MasterIntelligenceRequest): string[] {
    const antiPatterns = [];
    
    if (request.previousContent) {
      // Extract patterns from previous content
      request.previousContent.forEach(content => {
        const words = content.toLowerCase().split(' ');
        for (let i = 0; i < words.length - 1; i++) {
          const phrase = words.slice(i, i + 2).join(' ');
          if (phrase.length > 5) antiPatterns.push(phrase);
        }
      });
    }
    
    return antiPatterns.slice(0, 10);
  }

  private extractBusinessContext(businessProfile: any): any {
    return {
      currentSituation: `${businessProfile.businessType} business in ${businessProfile.location}`,
      specificGoals: ['Increase awareness', 'Drive engagement', 'Generate leads'],
      targetOutcome: 'Business growth and customer acquisition'
    };
  }

  private extractRealTimeFactors(request: MasterIntelligenceRequest): any {
    return {
      currentEvents: [],
      marketConditions: ['Standard market conditions'],
      competitorActions: [],
      customerFeedback: []
    };
  }

  private buildCurrentContext(request: MasterIntelligenceRequest): any {
    return {
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
      seasonality: this.getCurrentSeason(),
      localEvents: [],
      marketTrends: [],
      competitorActivity: []
    };
  }

  private determineAudienceState(request: MasterIntelligenceRequest): any {
    return {
      awarenessLevel: 'problem-aware',
      emotionalState: 'curious',
      urgencyLevel: 'medium'
    };
  }

  private buildAvoidancePatterns(request: MasterIntelligenceRequest): any {
    return {
      recentContent: request.previousContent || [],
      overusedPhrases: ['experience the', 'your trusted', 'quality you can trust'],
      competitorLanguage: []
    };
  }

  // Fallback and enhancement methods
  private async executeFallbackIntelligence(request: MasterIntelligenceRequest): Promise<any> {
    const businessProfile = request.businessProfile;
    
    return {
      content: {
        headline: `${businessProfile.businessName} Solutions`,
        subheadline: `Professional ${businessProfile.businessType} services in ${businessProfile.location}`,
        caption: `${businessProfile.businessName} provides reliable ${businessProfile.businessType} solutions for customers in ${businessProfile.location}. Our experienced team delivers quality results.`,
        cta: 'Learn More',
        hashtags: [`#${businessProfile.businessType.replace(/\s+/g, '')}`, `#${businessProfile.location}`, '#Professional']
      },
      reasoning: {
        whyThisApproach: 'Fallback intelligence used due to system errors',
        keyInsights: ['Professional credibility', 'Local presence'],
        differentiationFactors: ['Experience', 'Quality'],
        audienceConsiderations: ['Trust building', 'Local relevance']
      },
      systemMetrics: {
        intelligenceScore: 60,
        contextualRelevance: 70,
        uniquenessScore: 50,
        businessAlignment: 80
      }
    };
  }

  private validateContentQuality(content: any, request: MasterIntelligenceRequest): any {
    const issues = [];
    
    // Check for generic content
    const contentText = JSON.stringify(content).toLowerCase();
    if (contentText.includes('quality you can trust')) issues.push('Generic phrasing detected');
    if (contentText.includes('your trusted')) issues.push('Template language detected');
    
    // Check for business specificity
    if (!contentText.includes(request.businessProfile.businessName.toLowerCase())) {
      issues.push('Missing business name');
    }
    
    return {
      needsEnhancement: issues.length > 0,
      issues
    };
  }

  private async enhanceContent(content: any, request: MasterIntelligenceRequest, qualityValidation: any): Promise<any> {
    // Simple enhancement - replace generic phrases
    let enhancedContent = { ...content };
    
    if (qualityValidation.issues.includes('Generic phrasing detected')) {
      enhancedContent.subheadline = enhancedContent.subheadline.replace(/quality you can trust/gi, 'reliable service');
    }
    
    if (qualityValidation.issues.includes('Missing business name')) {
      enhancedContent.caption = `${request.businessProfile.businessName} ${enhancedContent.caption}`;
    }
    
    return enhancedContent;
  }

  // Quality calculation methods
  private calculateIntelligenceScore(content: any, businessProfile: any): number {
    let score = 60;
    const contentText = JSON.stringify(content).toLowerCase();
    
    if (contentText.includes(businessProfile.businessName.toLowerCase())) score += 15;
    if (contentText.includes(businessProfile.location?.toLowerCase())) score += 10;
    if (businessProfile.services && businessProfile.services.some((s: string) => contentText.includes(s.toLowerCase()))) score += 15;
    
    return Math.min(score, 100);
  }

  private calculateContextualRelevance(content: any, businessProfile: any): number {
    let score = 50;
    const contentText = JSON.stringify(content).toLowerCase();
    
    if (contentText.includes(businessProfile.businessType?.toLowerCase())) score += 20;
    if (contentText.includes(businessProfile.location?.toLowerCase())) score += 15;
    if (businessProfile.targetAudience && contentText.includes(businessProfile.targetAudience.toLowerCase())) score += 15;
    
    return Math.min(score, 100);
  }

  private calculateUniquenessScore(content: any, previousContent?: string[]): number {
    if (!previousContent || previousContent.length === 0) return 85;
    
    let score = 100;
    const contentText = JSON.stringify(content).toLowerCase();
    
    previousContent.forEach(prev => {
      const similarity = this.calculateSimilarity(contentText, prev.toLowerCase());
      if (similarity > 0.7) score -= 20;
      else if (similarity > 0.5) score -= 10;
    });
    
    return Math.max(score, 20);
  }

  private calculateBusinessAlignment(content: any, businessProfile: any): number {
    let score = 60;
    const contentText = JSON.stringify(content).toLowerCase();
    
    if (businessProfile.brandValues) {
      businessProfile.brandValues.forEach((value: string) => {
        if (contentText.includes(value.toLowerCase())) score += 8;
      });
    }
    
    if (businessProfile.keyFeatures) {
      businessProfile.keyFeatures.forEach((feature: string) => {
        if (contentText.includes(feature.toLowerCase())) score += 6;
      });
    }
    
    return Math.min(score, 100);
  }

  private calculateHybridScore(result: any, request: MasterIntelligenceRequest): number {
    const metrics = result.systemMetrics || {};
    return (metrics.intelligenceScore || 70) + (metrics.contextualRelevance || 70) + (metrics.uniquenessScore || 70);
  }

  // Quality check methods
  private checkTemplateAvoidance(content: any): boolean {
    const templatePhrases = ['experience the', 'your trusted', 'quality you can trust', 'leading provider'];
    const contentText = JSON.stringify(content).toLowerCase();
    
    return !templatePhrases.some(phrase => contentText.includes(phrase));
  }

  private checkPatternBreaking(content: any, previousContent?: string[]): boolean {
    if (!previousContent || previousContent.length === 0) return true;
    
    const contentText = JSON.stringify(content).toLowerCase();
    return !previousContent.some(prev => this.calculateSimilarity(contentText, prev.toLowerCase()) > 0.6);
  }

  private checkContextualIntelligence(content: any, businessProfile: any): boolean {
    const contentText = JSON.stringify(content).toLowerCase();
    return contentText.includes(businessProfile.businessName.toLowerCase()) && 
           contentText.includes(businessProfile.location?.toLowerCase() || '');
  }

  private checkBusinessSpecificity(content: any, businessProfile: any): boolean {
    const contentText = JSON.stringify(content).toLowerCase();
    return businessProfile.services?.some((service: string) => contentText.includes(service.toLowerCase())) || false;
  }

  // Utility methods
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}

// Export singleton instance
export const masterIntelligenceRouter = new MasterIntelligenceRouter();
