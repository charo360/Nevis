/**
 * Unified Business Intelligence Gatherer
 * 
 * Collects, analyzes, and enriches business data to provide comprehensive
 * context for content generation and marketing strategy.
 */

import type { BusinessTypeCategory } from '../adaptive/business-type-detector';

export interface BusinessIntelligenceRequest {
  brandProfile: any;
  businessType: BusinessTypeCategory;
  platform: string;
  location?: string;
}

export interface CompetitiveAnalysis {
  mainCompetitors: string[];
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  competitiveAdvantages: string[];
  marketGaps: string[];
  differentiationOpportunities: string[];
}

export interface CustomerInsights {
  primaryAudience: string;
  painPoints: string[];
  motivations: string[];
  preferredChannels: string[];
  demographicProfile: string;
  behaviorPatterns: string[];
}

export interface MarketIntelligence {
  marketSize: string;
  growthTrends: string[];
  seasonalPatterns: string[];
  pricingStrategy: string;
  distributionChannels: string[];
  regulatoryFactors: string[];
}

export interface ContentStrategy {
  keyMessages: string[];
  valuePropositions: string[];
  contentPillars: string[];
  toneOfVoice: string;
  contentTypes: string[];
  engagementTactics: string[];
}

export interface BusinessIntelligenceResult {
  competitive: CompetitiveAnalysis;
  customer: CustomerInsights;
  market: MarketIntelligence;
  content: ContentStrategy;
  businessContext: {
    strengths: string[];
    opportunities: string[];
    challenges: string[];
    uniqueSellingPoints: string[];
  };
  recommendations: {
    immediate: string[];
    strategic: string[];
    content: string[];
  };
}

/**
 * Business Intelligence Gatherer Class
 * Provides comprehensive business analysis for enhanced content generation
 */
export class BusinessIntelligenceGatherer {

  /**
   * Main intelligence gathering method
   */
  async gatherBusinessIntelligence(request: BusinessIntelligenceRequest): Promise<BusinessIntelligenceResult> {
    console.log(`🧠 [Business Intelligence] Gathering intelligence for ${request.brandProfile.businessName}`);
    console.log(`📊 [BI] Business type: ${request.businessType}, Platform: ${request.platform}`);

    const startTime = Date.now();

    // Step 1: Analyze competitive landscape
    const competitive = await this.analyzeCompetitiveLandscape(request);
    
    // Step 2: Generate customer insights
    const customer = await this.generateCustomerInsights(request);
    
    // Step 3: Analyze market intelligence
    const market = await this.analyzeMarketIntelligence(request);
    
    // Step 4: Develop content strategy
    const content = await this.developContentStrategy(request, competitive, customer);
    
    // Step 5: Extract business context
    const businessContext = this.extractBusinessContext(request, competitive, market);
    
    // Step 6: Generate recommendations
    const recommendations = this.generateRecommendations(request, competitive, customer, market);

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Business Intelligence] Analysis complete in ${processingTime}ms`);

    return {
      competitive,
      customer,
      market,
      content,
      businessContext,
      recommendations
    };
  }

  /**
   * Analyze competitive landscape using AI
   */
  private async analyzeCompetitiveLandscape(request: BusinessIntelligenceRequest): Promise<CompetitiveAnalysis> {
    console.log(`🏢 [BI] Analyzing competitive landscape for ${request.businessType}`);

    try {
      // Use existing business data if available
      if (request.brandProfile.competitors && request.brandProfile.competitors.length > 0) {
        return this.processExistingCompetitorData(request.brandProfile.competitors, request);
      }

      // Generate competitive analysis using AI
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const competitivePrompt = `Analyze the competitive landscape for a ${request.businessType} business named "${request.brandProfile.businessName}" in ${request.location || 'the market'}.

Provide analysis in the following format:
{
  "mainCompetitors": ["competitor1", "competitor2", "competitor3"],
  "marketPosition": "leader|challenger|follower|niche",
  "competitiveAdvantages": ["advantage1", "advantage2", "advantage3"],
  "marketGaps": ["gap1", "gap2"],
  "differentiationOpportunities": ["opportunity1", "opportunity2"]
}

Focus on:
- Realistic competitors in the ${request.businessType} space
- Specific competitive advantages this business could have
- Real market gaps and opportunities
- Actionable differentiation strategies`;

      const result = await generateContentDirect(competitivePrompt, 'gemini-2.5-flash', false);
      const response = await result.response;
      const analysisText = response.text();

      try {
        const analysis = JSON.parse(this.extractJSON(analysisText));
        console.log(`✅ [BI] Competitive analysis generated: ${analysis.mainCompetitors.length} competitors identified`);
        return analysis;
      } catch (parseError) {
        console.warn(`⚠️ [BI] Failed to parse competitive analysis, using fallback`);
        return this.getFallbackCompetitiveAnalysis(request);
      }

    } catch (error) {
      console.warn(`⚠️ [BI] Competitive analysis failed, using fallback:`, error);
      return this.getFallbackCompetitiveAnalysis(request);
    }
  }

  /**
   * Generate customer insights using AI
   */
  private async generateCustomerInsights(request: BusinessIntelligenceRequest): Promise<CustomerInsights> {
    console.log(`👥 [BI] Generating customer insights for ${request.businessType}`);

    try {
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const customerPrompt = `Analyze the target customers for a ${request.businessType} business named "${request.brandProfile.businessName}" in ${request.location || 'the market'}.

Provide analysis in the following format:
{
  "primaryAudience": "detailed description of primary target audience",
  "painPoints": ["pain1", "pain2", "pain3"],
  "motivations": ["motivation1", "motivation2", "motivation3"],
  "preferredChannels": ["channel1", "channel2", "channel3"],
  "demographicProfile": "age, income, lifestyle description",
  "behaviorPatterns": ["behavior1", "behavior2", "behavior3"]
}

Focus on:
- Specific pain points this business type solves
- Real motivations that drive purchase decisions
- Actual communication channels customers use
- Realistic demographic and behavioral insights`;

      const result = await generateContentDirect(customerPrompt, 'gemini-2.5-flash', false);
      const response = await result.response;
      const analysisText = response.text();

      try {
        const insights = JSON.parse(this.extractJSON(analysisText));
        console.log(`✅ [BI] Customer insights generated: ${insights.painPoints.length} pain points identified`);
        return insights;
      } catch (parseError) {
        console.warn(`⚠️ [BI] Failed to parse customer insights, using fallback`);
        return this.getFallbackCustomerInsights(request);
      }

    } catch (error) {
      console.warn(`⚠️ [BI] Customer insights failed, using fallback:`, error);
      return this.getFallbackCustomerInsights(request);
    }
  }

  /**
   * Analyze market intelligence using AI
   */
  private async analyzeMarketIntelligence(request: BusinessIntelligenceRequest): Promise<MarketIntelligence> {
    console.log(`📈 [BI] Analyzing market intelligence for ${request.businessType}`);

    try {
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const marketPrompt = `Analyze the market conditions for a ${request.businessType} business in ${request.location || 'the market'}.

Provide analysis in the following format:
{
  "marketSize": "description of market size and potential",
  "growthTrends": ["trend1", "trend2", "trend3"],
  "seasonalPatterns": ["pattern1", "pattern2"],
  "pricingStrategy": "recommended pricing approach",
  "distributionChannels": ["channel1", "channel2", "channel3"],
  "regulatoryFactors": ["factor1", "factor2"]
}

Focus on:
- Realistic market size and growth potential
- Current industry trends affecting this business type
- Seasonal patterns that impact demand
- Effective pricing and distribution strategies
- Relevant regulatory considerations`;

      const result = await generateContentDirect(marketPrompt, 'gemini-2.5-flash', false);
      const response = await result.response;
      const analysisText = response.text();

      try {
        const intelligence = JSON.parse(this.extractJSON(analysisText));
        console.log(`✅ [BI] Market intelligence generated: ${intelligence.growthTrends.length} trends identified`);
        return intelligence;
      } catch (parseError) {
        console.warn(`⚠️ [BI] Failed to parse market intelligence, using fallback`);
        return this.getFallbackMarketIntelligence(request);
      }

    } catch (error) {
      console.warn(`⚠️ [BI] Market intelligence failed, using fallback:`, error);
      return this.getFallbackMarketIntelligence(request);
    }
  }

  /**
   * Develop content strategy based on insights
   */
  private async developContentStrategy(
    request: BusinessIntelligenceRequest, 
    competitive: CompetitiveAnalysis, 
    customer: CustomerInsights
  ): Promise<ContentStrategy> {
    console.log(`📝 [BI] Developing content strategy`);

    try {
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const strategyPrompt = `Develop a content strategy for a ${request.businessType} business named "${request.brandProfile.businessName}" on ${request.platform}.

Context:
- Competitive advantages: ${competitive.competitiveAdvantages.join(', ')}
- Customer pain points: ${customer.painPoints.join(', ')}
- Customer motivations: ${customer.motivations.join(', ')}
- Preferred channels: ${customer.preferredChannels.join(', ')}

Provide strategy in the following format:
{
  "keyMessages": ["message1", "message2", "message3"],
  "valuePropositions": ["prop1", "prop2", "prop3"],
  "contentPillars": ["pillar1", "pillar2", "pillar3"],
  "toneOfVoice": "description of recommended tone",
  "contentTypes": ["type1", "type2", "type3"],
  "engagementTactics": ["tactic1", "tactic2", "tactic3"]
}

Focus on:
- Messages that address specific customer pain points
- Clear value propositions that differentiate from competitors
- Content pillars that support business goals
- Tone that resonates with target audience
- Content types that work well on ${request.platform}`;

      const result = await generateContentDirect(strategyPrompt, 'gemini-2.5-flash', false);
      const response = await result.response;
      const strategyText = response.text();

      try {
        const strategy = JSON.parse(this.extractJSON(strategyText));
        console.log(`✅ [BI] Content strategy developed: ${strategy.keyMessages.length} key messages`);
        return strategy;
      } catch (parseError) {
        console.warn(`⚠️ [BI] Failed to parse content strategy, using fallback`);
        return this.getFallbackContentStrategy(request, competitive, customer);
      }

    } catch (error) {
      console.warn(`⚠️ [BI] Content strategy failed, using fallback:`, error);
      return this.getFallbackContentStrategy(request, competitive, customer);
    }
  }

  /**
   * Extract business context from existing data and analysis
   */
  private extractBusinessContext(
    request: BusinessIntelligenceRequest, 
    competitive: CompetitiveAnalysis, 
    market: MarketIntelligence
  ) {
    const strengths = [
      ...competitive.competitiveAdvantages,
      ...(request.brandProfile.keyFeatures || []),
      ...(request.brandProfile.competitiveAdvantages || [])
    ].slice(0, 5);

    const opportunities = [
      ...competitive.marketGaps,
      ...competitive.differentiationOpportunities,
      ...market.growthTrends.map(trend => `Capitalize on ${trend}`)
    ].slice(0, 5);

    const challenges = [
      `Competition from ${competitive.mainCompetitors.slice(0, 2).join(' and ')}`,
      'Market saturation in traditional channels',
      'Need for digital transformation',
      'Customer acquisition costs'
    ].slice(0, 4);

    const uniqueSellingPoints = [
      ...strengths.slice(0, 3),
      ...(request.brandProfile.valuePropositions || []).slice(0, 2)
    ].slice(0, 4);

    return {
      strengths,
      opportunities,
      challenges,
      uniqueSellingPoints
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    request: BusinessIntelligenceRequest,
    competitive: CompetitiveAnalysis,
    customer: CustomerInsights,
    market: MarketIntelligence
  ) {
    const immediate = [
      `Focus content on top customer pain point: ${customer.painPoints[0]}`,
      `Emphasize key competitive advantage: ${competitive.competitiveAdvantages[0]}`,
      `Target primary audience: ${customer.primaryAudience}`,
      `Leverage preferred channel: ${customer.preferredChannels[0]}`
    ];

    const strategic = [
      `Develop market position as ${competitive.marketPosition} in ${request.businessType}`,
      `Capitalize on market trend: ${market.growthTrends[0]}`,
      `Address market gap: ${competitive.marketGaps[0]}`,
      `Implement pricing strategy: ${market.pricingStrategy}`
    ];

    const content = [
      `Create content addressing ${customer.painPoints.slice(0, 2).join(' and ')}`,
      `Highlight differentiation from ${competitive.mainCompetitors[0]}`,
      `Use ${customer.preferredChannels[0]} for primary distribution`,
      `Develop seasonal content around ${market.seasonalPatterns[0]}`
    ];

    return {
      immediate,
      strategic,
      content
    };
  }

  // Fallback methods for when AI analysis fails
  private getFallbackCompetitiveAnalysis(request: BusinessIntelligenceRequest): CompetitiveAnalysis {
    const businessTypeCompetitors = {
      finance: ['Traditional banks', 'Digital wallets', 'Peer-to-peer platforms'],
      retail: ['E-commerce giants', 'Local retailers', 'Specialty stores'],
      service: ['Established service providers', 'Digital platforms', 'Freelance networks'],
      saas: ['Enterprise solutions', 'Startup competitors', 'Open source alternatives']
    };

    return {
      mainCompetitors: businessTypeCompetitors[request.businessType as keyof typeof businessTypeCompetitors] || ['Industry leaders', 'Local competitors', 'Digital disruptors'],
      marketPosition: 'challenger',
      competitiveAdvantages: ['Better customer service', 'Competitive pricing', 'Local expertise'],
      marketGaps: ['Underserved customer segments', 'Technology gaps'],
      differentiationOpportunities: ['Personalized service', 'Innovative features', 'Better user experience']
    };
  }

  private getFallbackCustomerInsights(request: BusinessIntelligenceRequest): CustomerInsights {
    return {
      primaryAudience: `Small to medium businesses and individuals seeking ${request.businessType} solutions`,
      painPoints: ['High costs', 'Complex processes', 'Poor customer service'],
      motivations: ['Save money', 'Save time', 'Improve efficiency'],
      preferredChannels: ['Social media', 'Word of mouth', 'Online search'],
      demographicProfile: 'Ages 25-45, middle income, tech-savvy professionals',
      behaviorPatterns: ['Research online before purchasing', 'Value recommendations', 'Price-conscious']
    };
  }

  private getFallbackMarketIntelligence(request: BusinessIntelligenceRequest): MarketIntelligence {
    return {
      marketSize: `Growing market with significant potential in ${request.location || 'the region'}`,
      growthTrends: ['Digital transformation', 'Mobile-first solutions', 'Sustainability focus'],
      seasonalPatterns: ['Higher demand in Q4', 'Summer slowdown'],
      pricingStrategy: 'Competitive pricing with value-added services',
      distributionChannels: ['Digital marketing', 'Referral programs', 'Partnership networks'],
      regulatoryFactors: ['Data privacy compliance', 'Industry-specific regulations']
    };
  }

  private getFallbackContentStrategy(
    request: BusinessIntelligenceRequest, 
    competitive: CompetitiveAnalysis, 
    customer: CustomerInsights
  ): ContentStrategy {
    return {
      keyMessages: [
        `${request.brandProfile.businessName} delivers superior ${request.businessType} solutions`,
        'Trusted by customers for quality and reliability',
        'Your success is our priority'
      ],
      valuePropositions: competitive.competitiveAdvantages.slice(0, 3),
      contentPillars: ['Expertise', 'Customer Success', 'Innovation'],
      toneOfVoice: 'Professional yet approachable, trustworthy, solution-focused',
      contentTypes: ['Educational content', 'Customer testimonials', 'Behind-the-scenes'],
      engagementTactics: ['Ask questions', 'Share tips', 'Showcase results']
    };
  }

  // Utility methods
  private processExistingCompetitorData(competitors: any[], request: BusinessIntelligenceRequest): CompetitiveAnalysis {
    const mainCompetitors = competitors.slice(0, 3).map(c => c.name || c);
    const competitiveAdvantages = competitors.flatMap(c => c.ourAdvantages || []).slice(0, 3);
    const marketGaps = competitors.flatMap(c => c.weaknesses || []).slice(0, 2);

    return {
      mainCompetitors,
      marketPosition: 'challenger',
      competitiveAdvantages: competitiveAdvantages.length > 0 ? competitiveAdvantages : ['Better service', 'Competitive pricing'],
      marketGaps: marketGaps.length > 0 ? marketGaps : ['Service gaps', 'Technology gaps'],
      differentiationOpportunities: ['Personalized approach', 'Better customer experience']
    };
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}

// Export singleton instance
export const businessIntelligenceGatherer = new BusinessIntelligenceGatherer();
