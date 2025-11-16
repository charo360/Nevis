/**
 * Integration utilities for Claude-based website analysis with brand creation
 */

import { EnhancedWebsiteExtractor, ServicesExtractionResult, ProductsExtractionResult } from '@/lib/services/claude-website-extractor';

export interface BrandAnalysisInput {
  websiteUrl: string;
  businessType?: 'services' | 'products' | 'auto-detect';
  includeCompetitorAnalysis?: boolean;
}

export interface EnhancedBrandAnalysis {
  // Basic brand info
  businessName: string;
  description: string;
  businessType: string;
  industry: string;
  targetAudience: string;

  // Services/Products (detailed)
  services: string; // Formatted string for compatibility
  detailedServices: any[]; // Raw structured data
  
  // Enhanced data from Claude
  keyFeatures: string;
  competitiveAdvantages: string;
  contentThemes: string;
  brandPersonality: string;
  
  // Contact and business info
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    website: string;
    hours?: string;
  };
  
  // Additional insights
  marketPositioning?: string;
  pricingStrategy?: string;
  uniqueValueProposition?: string;
  
  // Metadata
  analysisTimestamp: number;
  dataCompleteness: number;
}

export class ClaudeBrandIntegration {
  private extractor: EnhancedWebsiteExtractor;

  constructor(apiKey: string) {
    this.extractor = new EnhancedWebsiteExtractor(apiKey);
  }

  /**
   * Perform comprehensive brand analysis using Claude
   */
  async analyzeBrandComprehensively(input: BrandAnalysisInput): Promise<EnhancedBrandAnalysis> {
    console.log(`🔍 Starting comprehensive Claude brand analysis for: ${input.websiteUrl}`);

    // Step 1: Detect business type if not specified
    let businessType = input.businessType;
    if (!businessType || businessType === 'auto-detect') {
      businessType = await this.detectBusinessType(input.websiteUrl);
    }

    // Step 2: Extract primary data based on business type
    let primaryData: ServicesExtractionResult | ProductsExtractionResult;
    if (businessType === 'products') {
      const result = await this.extractor.extractProducts(input.websiteUrl);
      if (!result.success) {
        throw new Error(`Failed to extract products: ${result.error}`);
      }
      primaryData = result.data!;
    } else {
      const result = await this.extractor.extractServices(input.websiteUrl);
      if (!result.success) {
        throw new Error(`Failed to extract services: ${result.error}`);
      }
      primaryData = result.data!;
    }

    // Step 3: Optional competitor analysis
    let competitorInsights: any = null;
    if (input.includeCompetitorAnalysis) {
      const competitorResult = await this.extractor.analyzeCompetitor(input.websiteUrl);
      if (competitorResult.success) {
        competitorInsights = competitorResult.data;
      }
    }

    // Step 4: Transform to enhanced brand analysis format
    return this.transformToEnhancedBrandAnalysis(
      primaryData,
      businessType,
      input.websiteUrl,
      competitorInsights
    );
  }

  /**
   * Auto-detect business type from website
   */
  private async detectBusinessType(url: string): Promise<'services' | 'products'> {
    // Use a simple custom extraction to determine business type
    const structure = {
      business_analysis: {
        type: "string", // 'ecommerce', 'retail', 'services', 'saas', etc.
        indicators: ["string"],
        confidence: "number"
      }
    };

    const instructions = `
    Analyze this website and determine if it's primarily:
    - 'products': E-commerce, retail store, selling physical/digital products
    - 'services': Service business, consulting, professional services, SaaS
    
    Look for indicators like:
    - Shopping cart, product listings, prices = products
    - Service descriptions, consulting, solutions = services
    `;

    const result = await this.extractor.customExtract(url, structure, instructions);
    
    if (result.success && result.data) {
      const analysis = result.data as any;
      const type = analysis.business_analysis?.type?.toLowerCase();
      
      if (type?.includes('ecommerce') || type?.includes('retail') || type?.includes('shop')) {
        return 'products';
      }
    }
    
    // Default to services if unclear
    return 'services';
  }

  /**
   * Transform Claude extraction results to brand analysis format
   */
  private transformToEnhancedBrandAnalysis(
    data: ServicesExtractionResult | ProductsExtractionResult,
    businessType: string,
    websiteUrl: string,
    competitorInsights?: any
  ): EnhancedBrandAnalysis {
    const isProductBusiness = businessType === 'products';
    const productData = isProductBusiness ? data as ProductsExtractionResult : null;
    const serviceData = !isProductBusiness ? data as ServicesExtractionResult : null;

    // Format services/products for compatibility
    let servicesText = '';
    let detailedServices: any[] = [];

    if (productData) {
      // Transform product categories to services format
      productData.product_categories.forEach(category => {
        servicesText += `${category.category}\n`;
        if (category.products.length > 0) {
          const productNames = category.products.map(p => p.name).slice(0, 3);
          servicesText += `Products: ${productNames.join(', ')}\n`;
          if (category.products[0].price) {
            servicesText += `Pricing: ${category.products[0].price}\n`;
          }
        }
        servicesText += '\n';
      });
      detailedServices = productData.product_categories;
    } else if (serviceData) {
      serviceData.services.forEach(service => {
        servicesText += `${service.service_name}\n`;
        servicesText += `${service.description}\n`;
        if (service.pricing) {
          servicesText += `Pricing: ${service.pricing}\n`;
        }
        servicesText += '\n';
      });
      detailedServices = serviceData.services;
    }

    // Extract competitive advantages and features
    const advantages: string[] = [];
    const features: string[] = [];
    
    if (competitorInsights) {
      const compAdvantages = competitorInsights.competitive_advantages || [];
      const serviceDescriptions = competitorInsights.service_offerings?.map((s: any) => s.description) || [];
      advantages.push(...compAdvantages);
      features.push(...serviceDescriptions);
    }

    if (serviceData) {
      serviceData.services.forEach(service => {
        features.push(...service.key_features);
        advantages.push(...service.benefits);
      });
    }

    // Determine business name and description
    const businessName = productData?.store_info?.name || 
                        serviceData?.company_info?.name || 
                        'Business Name';
    
    const description = productData?.store_info?.description || 
                       serviceData?.company_info?.description || 
                       'Business Description';

    return {
      businessName,
      description,
      businessType: isProductBusiness ? 'E-commerce Store' : 'Service Business',
      industry: this.inferIndustry(servicesText, businessName),
      targetAudience: serviceData?.services?.[0]?.target_audience || 'General customers',
      
      services: servicesText.trim(),
      detailedServices,
      
      keyFeatures: features.slice(0, 10).join(', '),
      competitiveAdvantages: advantages.slice(0, 8).join(', '),
      contentThemes: competitorInsights?.content_strategy?.messaging_themes?.join(', ') || 'Quality, Service, Innovation',
      brandPersonality: competitorInsights?.brand_intelligence?.brand_voice || 'Professional and customer-focused',
      
      contactInfo: {
        phone: productData?.delivery_info || serviceData?.contact?.phone || '',
        email: serviceData?.contact?.email || '',
        address: serviceData?.contact?.address || '',
        website: websiteUrl,
        hours: ''
      },
      
      marketPositioning: competitorInsights?.market_positioning,
      pricingStrategy: competitorInsights?.service_offerings?.[0]?.pricing_model,
      uniqueValueProposition: competitorInsights?.brand_intelligence?.value_proposition,
      
      analysisTimestamp: Date.now(),
      dataCompleteness: this.calculateCompleteness(data, competitorInsights)
    };
  }

  /**
   * Infer industry from services and business name
   */
  private inferIndustry(servicesText: string, businessName: string): string {
    const text = `${servicesText} ${businessName}`.toLowerCase();
    
    const industries = {
      'Technology': ['software', 'app', 'digital', 'tech', 'ai', 'automation'],
      'Healthcare': ['health', 'medical', 'clinic', 'doctor', 'wellness'],
      'Finance': ['finance', 'accounting', 'tax', 'investment', 'banking'],
      'Retail': ['shop', 'store', 'retail', 'products', 'electronics'],
      'Education': ['education', 'training', 'course', 'learning', 'school'],
      'Consulting': ['consulting', 'advisory', 'strategy', 'management'],
      'Marketing': ['marketing', 'advertising', 'branding', 'social media']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }

    return 'General Business';
  }

  /**
   * Calculate data completeness score
   */
  private calculateCompleteness(data: any, competitorInsights?: any): number {
    let score = 0;
    let maxScore = 10;

    // Basic info (3 points)
    if (data.company_info?.name || data.store_info?.name) score += 1;
    if (data.company_info?.description || data.store_info?.description) score += 1;
    if (data.contact?.phone || data.contact?.email) score += 1;

    // Services/Products (4 points)
    const services = data.services || data.product_categories || [];
    if (services.length > 0) score += 2;
    if (services.length > 2) score += 1;
    if (services.some((s: any) => s.pricing || s.products?.some((p: any) => p.price))) score += 1;

    // Additional insights (3 points)
    if (competitorInsights) score += 1;
    if (data.statistics || data.payment_options) score += 1;
    if (data.company_info?.mission || data.delivery_info) score += 1;

    return Math.round((score / maxScore) * 100);
  }
}
