/**
 * Deep Business Understanding System
 * 
 * This system analyzes businesses in-depth to understand:
 * - Business model and revenue streams
 * - Core innovation and differentiators
 * - Mission, purpose, and impact
 * - Real target audience and customer segments
 * - Value proposition and problem-solution fit
 * - Distribution and delivery model
 * 
 * NO TEMPLATES - Each business is analyzed uniquely based on their actual data.
 */

import { getClaudeClient } from '@/lib/services/claude-client';

export interface DeepBusinessInsight {
  // Business Model
  businessModel: {
    type: 'B2C' | 'B2B' | 'B2B2C' | 'marketplace' | 'subscription' | 'wholesale' | 'hybrid';
    revenueStreams: string[];
    pricingModel: string;
    distributionChannels: string[];
    customerAcquisition: string;
  };

  // Core Innovation
  innovation: {
    uniqueApproach: string;
    keyDifferentiator: string;
    competitiveAdvantage: string;
    technologyOrMethod: string;
    innovationLevel: 'incremental' | 'disruptive' | 'revolutionary';
  };

  // Mission & Purpose
  mission: {
    corePurpose: string;
    problemSolved: string;
    impactGoal: string;
    socialImpact: boolean;
    sustainabilityFocus: boolean;
    communityFocus: boolean;
  };

  // Target Audience (Real)
  targetAudience: {
    primary: {
      segment: string;
      demographics: string;
      psychographics: string;
      painPoints: string[];
      motivations: string[];
      buyingBehavior: string;
    };
    secondary?: {
      segment: string;
      demographics: string;
      painPoints: string[];
    };
    decisionMaker: string; // Who actually makes the purchase decision
    endUser: string; // Who actually uses the product/service
    influencers: string[]; // Who influences the decision
  };

  // Value Proposition
  valueProposition: {
    coreValue: string;
    functionalBenefits: string[];
    emotionalBenefits: string[];
    socialBenefits: string[];
    economicBenefits: string[];
    uniqueSellingPoints: string[];
  };

  // Product/Service Delivery
  delivery: {
    howItWorks: string;
    customerJourney: string[];
    keyTouchpoints: string[];
    deliveryMethod: string;
    geographicScope: string;
    scalability: string;
  };

  // Market Position
  marketPosition: {
    category: string;
    subcategory: string;
    positioning: string;
    competitors: string[];
    marketGap: string;
    barriers: string[];
  };

  // Brand Essence
  brandEssence: {
    personality: string[];
    tone: string;
    values: string[];
    emotionalConnection: string;
    brandStory: string;
  };

  // Marketing Implications
  marketingImplications: {
    keyMessages: string[];
    contentThemes: string[];
    visualDirection: string;
    callToActions: string[];
    proofPoints: string[];
    avoidances: string[]; // What NOT to say/show
  };
}

export class DeepBusinessAnalyzer {
  private claudeClient: any;

  constructor() {
    this.claudeClient = getClaudeClient();
  }

  /**
   * Perform deep analysis of a business
   */
  async analyzeBusinessDeeply(
    businessData: {
      businessName: string;
      website?: string;
      description?: string;
      industry?: string;
      documents?: any[];
      products?: any[];
      services?: any[];
      pricing?: any[];
      about?: string;
      mission?: string;
      values?: string[];
    }
  ): Promise<DeepBusinessInsight> {
    console.log(`🔍 [Deep Business Analyzer] Starting deep analysis for ${businessData.businessName}`);

    // Compile all available data
    const dataContext = this.compileBusinessData(businessData);

    // Generate deep analysis using Claude
    const analysis = await this.generateDeepAnalysis(dataContext);

    console.log(`✅ [Deep Business Analyzer] Analysis complete for ${businessData.businessName}`);
    return analysis;
  }

  /**
   * Compile all business data into a comprehensive context
   */
  private compileBusinessData(businessData: any): string {
    let context = `# BUSINESS DATA FOR DEEP ANALYSIS\n\n`;
    context += `## Business Name: ${businessData.businessName}\n\n`;

    if (businessData.website) {
      context += `## Website: ${businessData.website}\n\n`;
    }

    if (businessData.description) {
      context += `## Description:\n${businessData.description}\n\n`;
    }

    if (businessData.about) {
      context += `## About:\n${businessData.about}\n\n`;
    }

    if (businessData.mission) {
      context += `## Mission:\n${businessData.mission}\n\n`;
    }

    if (businessData.values && businessData.values.length > 0) {
      context += `## Values:\n${businessData.values.join(', ')}\n\n`;
    }

    if (businessData.products && businessData.products.length > 0) {
      context += `## Products:\n`;
      businessData.products.forEach((product: any) => {
        context += `- ${product.name}: ${product.description || ''}\n`;
        if (product.price) context += `  Price: ${product.price}\n`;
        if (product.features) context += `  Features: ${product.features.join(', ')}\n`;
      });
      context += `\n`;
    }

    if (businessData.services && businessData.services.length > 0) {
      context += `## Services:\n`;
      businessData.services.forEach((service: any) => {
        context += `- ${service.name}: ${service.description || ''}\n`;
        if (service.price) context += `  Price: ${service.price}\n`;
      });
      context += `\n`;
    }

    if (businessData.pricing && businessData.pricing.length > 0) {
      context += `## Pricing:\n`;
      businessData.pricing.forEach((price: any) => {
        context += `- ${price.item}: ${price.amount}\n`;
      });
      context += `\n`;
    }

    if (businessData.documents && businessData.documents.length > 0) {
      context += `## Additional Documents:\n`;
      businessData.documents.forEach((doc: any) => {
        context += `### ${doc.name || 'Document'}\n`;
        if (doc.content) {
          context += `${doc.content.substring(0, 2000)}...\n\n`;
        }
      });
    }

    return context;
  }

  /**
   * Generate deep analysis using Claude
   */
  private async generateDeepAnalysis(dataContext: string): Promise<DeepBusinessInsight> {
    const prompt = `You are a business strategy analyst with expertise in understanding businesses deeply.

Analyze the following business data and provide a COMPREHENSIVE, SPECIFIC understanding of this business.

${dataContext}

Your task is to understand this business IN-DEPTH, not to categorize it into templates.

Provide a detailed analysis covering:

1. **BUSINESS MODEL**: How do they make money? Who pays? What's the revenue model?
2. **CORE INNOVATION**: What makes THIS business unique? What's their special approach/method/technology?
3. **MISSION & PURPOSE**: Why does this business exist? What impact are they trying to make?
4. **REAL TARGET AUDIENCE**: Who ACTUALLY needs this? Who makes buying decisions? Who uses it?
5. **VALUE PROPOSITION**: What specific value do they provide? What problems do they solve?
6. **DELIVERY MODEL**: HOW do they deliver their product/service? What's the customer journey?
7. **MARKET POSITION**: Where do they fit in the market? What gap do they fill?
8. **BRAND ESSENCE**: What's their personality, tone, and emotional connection?
9. **MARKETING IMPLICATIONS**: Based on ALL of the above, how should they be marketed?

CRITICAL RULES:
- Be SPECIFIC to this business - use their actual data
- NO generic statements that could apply to any business
- Identify what makes them DIFFERENT from competitors
- Understand the REAL customer (not assumed)
- Extract the actual INNOVATION or unique approach
- If it's a social impact business, identify that clearly
- If B2B vs B2C, be explicit about the model
- Identify who PAYS vs who USES (they may be different)

Return your analysis as a JSON object matching this structure:
{
  "businessModel": {
    "type": "B2C|B2B|B2B2C|marketplace|subscription|wholesale|hybrid",
    "revenueStreams": ["..."],
    "pricingModel": "...",
    "distributionChannels": ["..."],
    "customerAcquisition": "..."
  },
  "innovation": {
    "uniqueApproach": "...",
    "keyDifferentiator": "...",
    "competitiveAdvantage": "...",
    "technologyOrMethod": "...",
    "innovationLevel": "incremental|disruptive|revolutionary"
  },
  "mission": {
    "corePurpose": "...",
    "problemSolved": "...",
    "impactGoal": "...",
    "socialImpact": true|false,
    "sustainabilityFocus": true|false,
    "communityFocus": true|false
  },
  "targetAudience": {
    "primary": {
      "segment": "...",
      "demographics": "...",
      "psychographics": "...",
      "painPoints": ["..."],
      "motivations": ["..."],
      "buyingBehavior": "..."
    },
    "decisionMaker": "...",
    "endUser": "...",
    "influencers": ["..."]
  },
  "valueProposition": {
    "coreValue": "...",
    "functionalBenefits": ["..."],
    "emotionalBenefits": ["..."],
    "socialBenefits": ["..."],
    "economicBenefits": ["..."],
    "uniqueSellingPoints": ["..."]
  },
  "delivery": {
    "howItWorks": "...",
    "customerJourney": ["..."],
    "keyTouchpoints": ["..."],
    "deliveryMethod": "...",
    "geographicScope": "...",
    "scalability": "..."
  },
  "marketPosition": {
    "category": "...",
    "subcategory": "...",
    "positioning": "...",
    "competitors": ["..."],
    "marketGap": "...",
    "barriers": ["..."]
  },
  "brandEssence": {
    "personality": ["..."],
    "tone": "...",
    "values": ["..."],
    "emotionalConnection": "...",
    "brandStory": "..."
  },
  "marketingImplications": {
    "keyMessages": ["..."],
    "contentThemes": ["..."],
    "visualDirection": "...",
    "callToActions": ["..."],
    "proofPoints": ["..."],
    "avoidances": ["... things to NOT say or show"]
  }
}

Return ONLY the JSON object, no other text.`;

    try {
      const response = await this.claudeClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3, // Lower temperature for analytical accuracy
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis as DeepBusinessInsight;

    } catch (error) {
      console.error('❌ [Deep Business Analyzer] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate marketing strategy based on deep understanding
   */
  async generateMarketingStrategy(insight: DeepBusinessInsight): Promise<{
    targetingStrategy: string;
    messagingFramework: string;
    contentPillars: string[];
    visualStrategy: string;
    channelRecommendations: string[];
    campaignIdeas: string[];
  }> {
    console.log('📊 [Deep Business Analyzer] Generating marketing strategy from insights');

    const prompt = `Based on this deep business understanding, create a comprehensive marketing strategy:

${JSON.stringify(insight, null, 2)}

Generate a marketing strategy that is SPECIFIC to this business's unique characteristics.

Return as JSON:
{
  "targetingStrategy": "How to reach and engage the real target audience",
  "messagingFramework": "Core messaging approach based on their unique value",
  "contentPillars": ["3-5 main content themes"],
  "visualStrategy": "Visual direction that reflects their brand essence and appeals to target",
  "channelRecommendations": ["Best channels for reaching their audience"],
  "campaignIdeas": ["3-5 specific campaign concepts based on their differentiators"]
}`;

    try {
      const response = await this.claudeClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from strategy response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('❌ [Deep Business Analyzer] Strategy generation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deepBusinessAnalyzer = new DeepBusinessAnalyzer();
