import { getVertexAIClient } from '../../lib/services/vertex-ai-client';
import { ComprehensiveAnalysis } from './comprehensive-scraper';

export interface BusinessIntelligenceReport {
  // Core Business Analysis
  businessProfile: {
    businessType: string;
    industry: string;
    targetAudience: string;
    businessModel: string;
    revenueStreams: string[];
    marketPosition: 'budget' | 'mid-market' | 'premium' | 'luxury';
  };

  // Competitive Analysis
  competitiveAnalysis: {
    uniqueSellingPropositions: string[];
    competitiveAdvantages: string[];
    weaknesses: string[];
    marketDifferentiators: string[];
    pricingStrategy: string;
    competitorComparisons: string[];
  };

  // Marketing Intelligence
  marketingIntel: {
    brandPersonality: string[];
    messagingThemes: string[];
    contentStrategy: string;
    visualBranding: string;
    customerPainPoints: string[];
    valuePropositions: string[];
  };

  // Product/Service Analysis
  offeringAnalysis: {
    coreOfferings: string[];
    productCategories: string[];
    serviceTiers: string[];
    pricingModel: string;
    keyFeatures: string[];
    customerBenefits: string[];
  };

  // Content Recommendations
  contentRecommendations: {
    adCampaignAngles: string[];
    headlineFormulas: string[];
    contentPillars: string[];
    socialMediaStrategy: string[];
    seoKeywords: string[];
  };

  // Business Opportunities
  opportunities: {
    marketGaps: string[];
    contentOpportunities: string[];
    productExpansion: string[];
    targetAudienceExpansion: string[];
    improvementAreas: string[];
  };
}

export class BusinessIntelligenceAnalyzer {
  private vertexAI = getVertexAIClient();

  async analyzeBusinessIntelligence(
    websiteData: ComprehensiveAnalysis,
    websiteUrl: string
  ): Promise<BusinessIntelligenceReport> {
    console.log(`🧠 Starting AI-powered business intelligence analysis for: ${websiteUrl}`);

    const analysisPrompt = this.buildAnalysisPrompt(websiteData, websiteUrl);
    
    try {
      const response = await this.vertexAI.generateText(analysisPrompt, 'gemini-2.5-flash');
      const report = this.parseAnalysisResponse(response);
      
      console.log(`✅ Business intelligence analysis complete`);
      return report;
    } catch (error) {
      console.error('❌ Business intelligence analysis failed:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(data: ComprehensiveAnalysis, url: string): string {
    return `
You are a senior business intelligence analyst. Analyze this comprehensive website data and provide deep business insights.

WEBSITE: ${url}
BUSINESS TYPE: ${data.businessIntel.businessType}
INDUSTRY: ${data.businessIntel.industry}

=== WEBSITE DATA ===

BASIC INFO:
- Title: ${data.basicInfo.title}
- Description: ${data.basicInfo.description}
- Keywords: ${data.basicInfo.keywords.join(', ')}

BUSINESS INTELLIGENCE:
- Services: ${data.businessIntel.services.join(', ')}
- Products: ${data.businessIntel.products.length} products found
- Contact: ${JSON.stringify(data.contactInfo)}
- Social Media: ${data.businessIntel.socialMedia.map(s => s.platform).join(', ')}

CONTENT ANALYSIS:
- Main Headings: ${data.contentAnalysis.headings.slice(0, 10).join(' | ')}
- Features: ${data.contentAnalysis.features.slice(0, 10).join(' | ')}
- Call to Actions: ${data.contentAnalysis.callToActions.slice(0, 5).join(' | ')}
- Testimonials: ${data.contentAnalysis.testimonials.length} testimonials found

COMPETITIVE INTELLIGENCE:
- Market Position: ${data.competitiveIntel.marketPosition}
- USPs: ${data.competitiveIntel.uniqueSellingPoints.join(' | ')}
- Competitor Mentions: ${data.competitiveIntel.competitorMentions.join(' | ')}

TECHNICAL INFO:
- Technologies: ${data.technicalInfo.technologies.join(', ')}
- SEO Headings: ${data.technicalInfo.seo.headingStructure.slice(0, 5).join(' | ')}

=== ANALYSIS REQUIREMENTS ===

Provide a comprehensive business intelligence report in this EXACT JSON format:

{
  "businessProfile": {
    "businessType": "Specific business type (e.g., 'SaaS Platform', 'E-commerce Store', 'Digital Agency')",
    "industry": "Industry vertical (e.g., 'Fintech', 'Healthcare', 'E-commerce')",
    "targetAudience": "Primary target audience description",
    "businessModel": "Revenue model (B2B, B2C, Marketplace, Subscription, etc.)",
    "revenueStreams": ["List of revenue streams"],
    "marketPosition": "budget|mid-market|premium|luxury"
  },
  "competitiveAnalysis": {
    "uniqueSellingPropositions": ["List of unique selling points"],
    "competitiveAdvantages": ["List of competitive advantages"],
    "weaknesses": ["Potential weaknesses or gaps"],
    "marketDifferentiators": ["What sets them apart"],
    "pricingStrategy": "Pricing strategy analysis",
    "competitorComparisons": ["Implied competitor comparisons"]
  },
  "marketingIntel": {
    "brandPersonality": ["Brand personality traits"],
    "messagingThemes": ["Key messaging themes"],
    "contentStrategy": "Overall content strategy",
    "visualBranding": "Visual branding description",
    "customerPainPoints": ["Customer pain points addressed"],
    "valuePropositions": ["Core value propositions"]
  },
  "offeringAnalysis": {
    "coreOfferings": ["Main products/services"],
    "productCategories": ["Product categories"],
    "serviceTiers": ["Service tiers if applicable"],
    "pricingModel": "Pricing model description",
    "keyFeatures": ["Key features highlighted"],
    "customerBenefits": ["Customer benefits emphasized"]
  },
  "contentRecommendations": {
    "adCampaignAngles": ["Recommended ad campaign angles"],
    "headlineFormulas": ["Effective headline formulas for this business"],
    "contentPillars": ["Content marketing pillars"],
    "socialMediaStrategy": ["Social media content recommendations"],
    "seoKeywords": ["Recommended SEO keywords"]
  },
  "opportunities": {
    "marketGaps": ["Identified market gaps"],
    "contentOpportunities": ["Content opportunities"],
    "productExpansion": ["Product expansion opportunities"],
    "targetAudienceExpansion": ["New audience opportunities"],
    "improvementAreas": ["Areas for improvement"]
  }
}

=== ANALYSIS GUIDELINES ===

1. **BE SPECIFIC**: Use concrete insights, not generic business advice
2. **USE DATA**: Base insights on actual website content and structure
3. **IDENTIFY PATTERNS**: Look for messaging patterns, feature emphasis, customer focus
4. **COMPETITIVE CONTEXT**: Understand market positioning and differentiation
5. **ACTIONABLE INSIGHTS**: Provide insights that can drive marketing decisions
6. **INDUSTRY EXPERTISE**: Apply industry-specific knowledge and best practices

=== SPECIAL FOCUS AREAS ===

For FINTECH businesses: Focus on trust, security, speed, accessibility
For ECOMMERCE: Focus on product variety, pricing, customer experience
For SAAS: Focus on features, integrations, scalability, ROI
For SERVICES: Focus on expertise, results, process, testimonials

Analyze the business deeply and provide strategic insights that would help create better marketing campaigns.

RESPOND ONLY WITH THE JSON - NO OTHER TEXT.
`;
  }

  private parseAnalysisResponse(response: string): BusinessIntelligenceReport {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      // Validate required fields
      const requiredFields = [
        'businessProfile',
        'competitiveAnalysis', 
        'marketingIntel',
        'offeringAnalysis',
        'contentRecommendations',
        'opportunities'
      ];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return parsed as BusinessIntelligenceReport;
    } catch (error) {
      console.error('❌ Failed to parse business intelligence response:', error);
      
      // Return fallback structure
      return this.createFallbackReport();
    }
  }

  private createFallbackReport(): BusinessIntelligenceReport {
    return {
      businessProfile: {
        businessType: 'Unknown',
        industry: 'Unknown',
        targetAudience: 'General audience',
        businessModel: 'Unknown',
        revenueStreams: [],
        marketPosition: 'mid-market'
      },
      competitiveAnalysis: {
        uniqueSellingPropositions: [],
        competitiveAdvantages: [],
        weaknesses: [],
        marketDifferentiators: [],
        pricingStrategy: 'Unknown',
        competitorComparisons: []
      },
      marketingIntel: {
        brandPersonality: [],
        messagingThemes: [],
        contentStrategy: 'Unknown',
        visualBranding: 'Unknown',
        customerPainPoints: [],
        valuePropositions: []
      },
      offeringAnalysis: {
        coreOfferings: [],
        productCategories: [],
        serviceTiers: [],
        pricingModel: 'Unknown',
        keyFeatures: [],
        customerBenefits: []
      },
      contentRecommendations: {
        adCampaignAngles: [],
        headlineFormulas: [],
        contentPillars: [],
        socialMediaStrategy: [],
        seoKeywords: []
      },
      opportunities: {
        marketGaps: [],
        contentOpportunities: [],
        productExpansion: [],
        targetAudienceExpansion: [],
        improvementAreas: []
      }
    };
  }

  async generateCompetitorAnalysis(
    primaryBusiness: BusinessIntelligenceReport,
    competitorUrls: string[]
  ): Promise<any> {
    // This would analyze multiple competitors and compare
    // Implementation would scrape competitor sites and compare
    console.log(`🔍 Analyzing ${competitorUrls.length} competitors...`);
    
    // Placeholder for competitor analysis
    return {
      competitorComparison: [],
      marketPositioning: {},
      opportunityGaps: []
    };
  }
}

// Enhanced analysis function that combines scraping + AI analysis
export async function analyzeWebsiteWithAI(url: string): Promise<{
  websiteData: ComprehensiveAnalysis;
  businessIntelligence: BusinessIntelligenceReport;
}> {
  const { analyzeWebsiteComprehensively } = await import('./comprehensive-scraper');
  
  console.log(`🚀 Starting comprehensive website analysis with AI for: ${url}`);
  
  // Step 1: Scrape everything
  const websiteData = await analyzeWebsiteComprehensively(url);
  
  // Step 2: AI-powered business intelligence
  const analyzer = new BusinessIntelligenceAnalyzer();
  const businessIntelligence = await analyzer.analyzeBusinessIntelligence(websiteData, url);
  
  console.log(`✅ Complete analysis finished for: ${url}`);
  console.log(`📊 Business Type: ${businessIntelligence.businessProfile.businessType}`);
  console.log(`🎯 Target Audience: ${businessIntelligence.businessProfile.targetAudience}`);
  console.log(`💡 USPs: ${businessIntelligence.competitiveAnalysis.uniqueSellingPropositions.length}`);
  console.log(`📈 Opportunities: ${businessIntelligence.opportunities.marketGaps.length}`);
  
  return {
    websiteData,
    businessIntelligence
  };
}
