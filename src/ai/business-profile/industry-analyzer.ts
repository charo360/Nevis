/**
 * AI-Powered Industry Analysis System
 * Dynamically analyzes any business type and generates relevant marketing data
 */

import { getOpenAIClient } from '../../lib/services/openai-client';

export interface IndustryAnalysis {
  keyFeatures: string[];
  painPoints: string[];
  solutions: string[];
  competitors: Array<{
    name: string;
    weaknesses: string[];
    ourAdvantages: string[];
  }>;
  valuePropositions: string[];
  competitivePositioning: string;
  targetAudience: string;
  marketInsights: string[];
}

export class IndustryAnalyzer {
  private static cache = new Map<string, IndustryAnalysis>();

  /**
   * Get the appropriate currency for a location
   */
  private static getCurrencyForLocation(location: string): { currency: string; symbol: string; example: string } {
    const locationLower = location.toLowerCase();
    
    // African currencies
    if (locationLower.includes('kenya')) return { currency: 'Kenyan Shilling (KES)', symbol: 'KES', example: 'KES 1,000' };
    if (locationLower.includes('nigeria')) return { currency: 'Nigerian Naira (₦)', symbol: '₦', example: '₦2,500' };
    if (locationLower.includes('ghana')) return { currency: 'Ghanaian Cedi (GHS)', symbol: 'GHS', example: 'GHS 50' };
    if (locationLower.includes('south africa')) return { currency: 'South African Rand (R)', symbol: 'R', example: 'R150' };
    if (locationLower.includes('egypt')) return { currency: 'Egyptian Pound (EGP)', symbol: 'EGP', example: 'EGP 300' };
    
    // Asian currencies
    if (locationLower.includes('india')) return { currency: 'Indian Rupee (₹)', symbol: '₹', example: '₹1,500' };
    if (locationLower.includes('singapore')) return { currency: 'Singapore Dollar (S$)', symbol: 'S$', example: 'S$25' };
    if (locationLower.includes('thailand')) return { currency: 'Thai Baht (฿)', symbol: '฿', example: '฿800' };
    if (locationLower.includes('philippines')) return { currency: 'Philippine Peso (₱)', symbol: '₱', example: '₱1,200' };
    if (locationLower.includes('japan')) return { currency: 'Japanese Yen (¥)', symbol: '¥', example: '¥3,000' };
    
    // European currencies
    if (locationLower.includes('uk') || locationLower.includes('britain') || locationLower.includes('england')) {
      return { currency: 'British Pound (£)', symbol: '£', example: '£25' };
    }
    if (locationLower.includes('eu') || locationLower.includes('europe') || locationLower.includes('germany') || 
        locationLower.includes('france') || locationLower.includes('spain') || locationLower.includes('italy')) {
      return { currency: 'Euro (€)', symbol: '€', example: '€30' };
    }
    
    // Americas
    if (locationLower.includes('usa') || locationLower.includes('america') || locationLower.includes('united states')) {
      return { currency: 'US Dollar ($)', symbol: '$', example: '$25' };
    }
    if (locationLower.includes('canada')) return { currency: 'Canadian Dollar (CAD)', symbol: 'CAD', example: 'CAD 35' };
    if (locationLower.includes('brazil')) return { currency: 'Brazilian Real (R$)', symbol: 'R$', example: 'R$ 125' };
    if (locationLower.includes('mexico')) return { currency: 'Mexican Peso (MX$)', symbol: 'MX$', example: 'MX$ 450' };
    
    // Default to USD for unknown locations
    return { currency: 'US Dollar ($)', symbol: '$', example: '$25' };
  }

  /**
   * Analyze any business type and generate comprehensive industry data
   */
  static async analyzeIndustry(
    businessType: string, 
    businessName: string,
    location: string = 'Global'
  ): Promise<IndustryAnalysis> {
    
    const cacheKey = `${businessType.toLowerCase()}_${location.toLowerCase()}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`📋 [Industry Analyzer] Using cached analysis for ${businessType}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`🧠 [Industry Analyzer] Analyzing business type: ${businessType} in ${location}`);

    const currencyInfo = this.getCurrencyForLocation(location);
    const analysisPrompt = `
You are a business intelligence expert. Analyze this business type and location:

BUSINESS: "${businessType}"
COMPANY: "${businessName}" 
LOCATION: "${location}"

Generate comprehensive industry analysis with specific, actionable data:

1. KEY FEATURES (7 items): What features/services do customers expect from this industry?
2. CUSTOMER PAIN POINTS (5 items): What problems do customers face with this industry?
3. SOLUTIONS (5 items): How does this business type typically solve those problems?
4. MAIN COMPETITORS (3-4 items): Who are the main competitors in this industry/location?
5. COMPETITIVE ADVANTAGES (3-4 items): What advantages could this business have?
6. VALUE PROPOSITIONS (3-4 items): What compelling benefits can this business offer?
7. TARGET AUDIENCE: Who is the primary customer base?
8. COMPETITIVE POSITIONING: One-line unique market position
9. MARKET INSIGHTS (3 items): Key industry trends or local market factors

REQUIREMENTS:
- Be specific to the industry and location
- Use concrete, actionable language
- Consider local market conditions for ${location}
- Focus on customer-facing benefits
- Make it relevant for marketing content
- USE LOCAL CURRENCY: Always use ${currencyInfo.currency} (${currencyInfo.symbol}) for all monetary amounts
- Example pricing format: ${currencyInfo.example}
- Include specific local pricing examples where relevant (e.g., "Save ${currencyInfo.symbol}500 monthly")
- Consider local economic conditions and purchasing power in ${location}
- NEVER use USD ($) unless location is USA - always use ${currencyInfo.symbol}

Format as valid JSON:
{
  "keyFeatures": ["feature1", "feature2", ...],
  "painPoints": ["pain1", "pain2", ...],
  "solutions": ["solution1", "solution2", ...],
  "competitors": [
    {
      "name": "Competitor Name",
      "weaknesses": ["weakness1", "weakness2"],
      "ourAdvantages": ["advantage1", "advantage2"]
    }
  ],
  "valuePropositions": ["prop1", "prop2", ...],
  "competitivePositioning": "unique position statement",
  "targetAudience": "primary customer description",
  "marketInsights": ["insight1", "insight2", "insight3"]
}
`;

    try {
      const openAI = getOpenAIClient();
      const result = await openAI.generateText(analysisPrompt, 'gpt-4', {
        temperature: 0.7,
        maxTokens: 1500
      });

      const analysis: IndustryAnalysis = JSON.parse(result);
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      console.log(`✅ [Industry Analyzer] Generated analysis for ${businessType}:`, {
        features: analysis.keyFeatures.length,
        painPoints: analysis.painPoints.length,
        competitors: analysis.competitors.length,
        positioning: analysis.competitivePositioning
      });

      return analysis;

    } catch (error) {
      console.error('❌ [Industry Analyzer] Failed to analyze industry:', error);
      
      // Fallback to basic analysis
      return this.generateFallbackAnalysis(businessType, businessName, location);
    }
  }

  /**
   * Generate basic fallback analysis if AI fails
   */
  private static generateFallbackAnalysis(
    businessType: string, 
    businessName: string,
    location: string
  ): IndustryAnalysis {
    return {
      keyFeatures: [
        'Professional Service',
        'Customer Focused',
        'Quality Results',
        'Competitive Pricing',
        'Reliable Support',
        'Local Expertise',
        'Proven Experience'
      ],
      painPoints: [
        'Slow, inefficient processes',
        'High costs without clear value',
        'Poor customer service',
        'Lack of transparency',
        'Limited options available'
      ],
      solutions: [
        'Fast, efficient service',
        'Clear, competitive pricing',
        'Excellent customer support',
        'Complete transparency',
        'Wide range of options'
      ],
      competitors: [
        {
          name: 'Local Competitors',
          weaknesses: ['Limited service options', 'Higher prices'],
          ourAdvantages: ['Better service quality', 'More competitive pricing']
        }
      ],
      valuePropositions: [
        `${businessName} delivers exceptional value`,
        'Faster service than competitors',
        'Personalized customer experience',
        `Trusted by customers in ${location}`
      ],
      competitivePositioning: `Leading ${businessType.toLowerCase()} provider in ${location}`,
      targetAudience: `Local customers seeking quality ${businessType.toLowerCase()} services`,
      marketInsights: [
        'Growing demand for quality service',
        'Customers value transparency and reliability',
        'Local market prefers personalized attention'
      ]
    };
  }

  /**
   * Clear the analysis cache (useful for testing)
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ [Industry Analyzer] Cache cleared');
  }
}
