/**
 * Enhanced Simple Website Scraper
 * Uses fetch + Cheerio for immediate compatibility while providing enhanced analysis
 * Fallback implementation that doesn't require Playwright
 */

import * as cheerio from 'cheerio';
import { URL } from 'url';

// Import interfaces from enhanced scraper
export interface EnhancedWebsiteAnalysis {
  basicInfo: BasicWebsiteInfo;
  businessIntelligence: BusinessIntelligence;
  visualBrand: VisualBrandAnalysis;
  contentStrategy: ContentStrategyAnalysis;
  technicalSEO: TechnicalSEOAnalysis;
  contactInformation: ContactInformation;
  analysisMetadata: AnalysisMetadata;
}

export interface BasicWebsiteInfo {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  language: string;
  favicon: string;
  sitemap?: string;
}

export interface BusinessIntelligence {
  businessType: string;
  industry: string;
  mission: string;
  vision: string;
  values: string[];
  services: ServiceDetail[];
  products: ProductDetail[];
  pricing: PricingModel[];
  testimonials: Testimonial[];
  teamInfo: TeamMember[];
  companyHistory: string;
  uniqueValueProposition: string;
  competitiveAdvantages: string[];
}

export interface VisualBrandAnalysis {
  colors: {
    primary: string;
    secondary: string[];
    accent: string[];
    background: string;
    text: string;
  };
  typography: {
    headingFonts: string[];
    bodyFonts: string[];
  };
  logoUrls: string[];
  imageStyle: 'photography' | 'illustration' | 'mixed' | 'minimal';
  designStyle: 'modern' | 'traditional' | 'minimalist' | 'bold' | 'elegant' | 'playful';
  visualThemes: string[];
}

export interface ContentStrategyAnalysis {
  contentThemes: string[];
  callToActionPatterns: string[];
  customerPainPoints: string[];
  contentTone: 'formal' | 'casual' | 'friendly' | 'professional' | 'technical' | 'conversational';
  messagingFramework: string[];
  blogTopics: string[];
  socialProof: string[];
}

export interface TechnicalSEOAnalysis {
  metaData: {
    title: string;
    description: string;
    keywords: string[];
  };
  headingStructure: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  structuredData: any[];
  altTextPatterns: string[];
  internalLinking: {
    totalLinks: number;
    navigationStructure: string[];
  };
}

export interface ContactInformation {
  phone: string[];
  email: string[];
  address: string[];
  socialMedia: SocialMediaProfile[];
  businessHours: string;
  locations: BusinessLocation[];
}

export interface AnalysisMetadata {
  analyzedAt: Date;
  analysisVersion: string;
  pagesAnalyzed: string[];
  dataCompleteness: number;
  confidenceScore: number;
  processingTime: number;
  errors: string[];
}

// Supporting interfaces
export interface ServiceDetail {
  name: string;
  description: string;
  features: string[];
  pricing?: string;
  category?: string;
}

export interface ProductDetail {
  name: string;
  description: string;
  price?: string;
  images: string[];
  category?: string;
  features: string[];
}

export interface PricingModel {
  planName: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  billingCycle?: string;
}

export interface Testimonial {
  content: string;
  author: string;
  company?: string;
  rating?: number;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  image?: string;
}

export interface SocialMediaProfile {
  platform: string;
  url: string;
  handle?: string;
}

export interface BusinessLocation {
  address: string;
  city: string;
  state?: string;
  country?: string;
  phone?: string;
  hours?: string;
}

export class EnhancedSimpleScraper {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async analyzeWebsiteComprehensively(url: string): Promise<EnhancedWebsiteAnalysis> {
    const startTime = Date.now();
    console.log(`🔍 Starting enhanced simple analysis of: ${url}`);

    try {
      // Fetch the main page
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Extract all data sections
      const [
        basicInfo,
        businessIntelligence,
        visualBrand,
        contentStrategy,
        technicalSEO,
        contactInformation
      ] = await Promise.all([
        this.extractBasicInfo($, url),
        this.extractBusinessIntelligence($),
        this.extractVisualBrand($),
        this.extractContentStrategy($),
        this.extractTechnicalSEO($),
        this.extractContactInformation($)
      ]);

      const processingTime = Date.now() - startTime;
      const qualityMetrics = this.calculateQualityMetrics({
        basicInfo,
        businessIntelligence,
        visualBrand,
        contentStrategy,
        technicalSEO,
        contactInformation
      });

      const analysis: EnhancedWebsiteAnalysis = {
        basicInfo,
        businessIntelligence,
        visualBrand,
        contentStrategy,
        technicalSEO,
        contactInformation,
        analysisMetadata: {
          analyzedAt: new Date(),
          analysisVersion: '2.0.0-simple',
          pagesAnalyzed: [url],
          dataCompleteness: qualityMetrics.completeness,
          confidenceScore: qualityMetrics.confidence,
          processingTime,
          errors: []
        }
      };

      console.log(`✅ Enhanced simple analysis complete for: ${url}`);
      console.log(`📊 Data completeness: ${analysis.analysisMetadata.dataCompleteness}%`);
      console.log(`🎯 Confidence score: ${analysis.analysisMetadata.confidenceScore}%`);

      return analysis;

    } catch (error) {
      console.error(`❌ Enhanced simple analysis failed for ${url}:`, error);
      throw error;
    }
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  }

  private extractBasicInfo($: cheerio.CheerioAPI, url: string): BasicWebsiteInfo {
    const getMetaContent = (name: string) => {
      return $(`meta[name="${name}"], meta[property="${name}"]`).attr('content') || '';
    };

    return {
      url,
      title: $('title').text().trim(),
      description: getMetaContent('description'),
      keywords: getMetaContent('keywords').split(',').map(k => k.trim()).filter(k => k),
      language: $('html').attr('lang') || 'en',
      favicon: $('link[rel*="icon"]').attr('href') || '',
      sitemap: this.findSitemap($, url)
    };
  }

  private findSitemap($: cheerio.CheerioAPI, url: string): string | undefined {
    // Look for sitemap references
    const sitemapLink = $('link[rel="sitemap"]').attr('href');
    if (sitemapLink) {
      return new URL(sitemapLink, url).href;
    }
    
    // Common sitemap locations
    const commonPaths = ['/sitemap.xml', '/sitemap_index.xml'];
    return new URL(commonPaths[0], url).href;
  }

  private extractBusinessIntelligence($: cheerio.CheerioAPI): BusinessIntelligence {
    // Extract business information using enhanced patterns
    const extractTextFromSelectors = (selectors: string[]) => {
      for (const selector of selectors) {
        const text = $(selector).text().trim();
        if (text && text.length > 20) return text;
      }
      return '';
    };

    const extractListFromSelectors = (selectors: string[]) => {
      const items: string[] = [];
      selectors.forEach(selector => {
        $(selector).each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 10) items.push(text);
        });
      });
      return [...new Set(items)]; // Remove duplicates
    };

    return {
      businessType: this.inferBusinessType($),
      industry: this.inferIndustry($),
      mission: extractTextFromSelectors(['.mission', '[class*="mission"]', '[id*="mission"]']),
      vision: extractTextFromSelectors(['.vision', '[class*="vision"]', '[id*="vision"]']),
      values: extractListFromSelectors(['.values li', '[class*="values"] li', '[class*="value"] li']),
      services: this.extractServices($),
      products: this.extractProducts($),
      pricing: this.extractPricing($),
      testimonials: this.extractTestimonials($),
      teamInfo: this.extractTeamInfo($),
      companyHistory: extractTextFromSelectors(['.history', '[class*="history"]', '[class*="story"]']),
      uniqueValueProposition: this.extractUVP($),
      competitiveAdvantages: this.extractCompetitiveAdvantages($)
    };
  }

  private inferBusinessType($: cheerio.CheerioAPI): string {
    const text = $('body').text().toLowerCase();
    const title = $('title').text().toLowerCase();
    const metaDescription = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
    const headings = $('h1, h2, h3').text().toLowerCase();
    const combinedText = `${title} ${metaDescription} ${headings} ${text}`;

    // Enhanced business type detection with weighted scoring
    const businessTypes = {
      'saas': {
        keywords: ['saas', 'software as a service', 'cloud platform', 'api', 'dashboard', 'automation', 'workflow', 'integration', 'subscription', 'enterprise software'],
        strongIndicators: ['pricing plans', 'free trial', 'api documentation', 'integrations', 'enterprise', 'scalable'],
        domains: ['mailchimp', 'slack', 'hubspot', 'salesforce', 'stripe', 'zoom', 'asana', 'trello'],
        weight: 3
      },
      'technology': {
        keywords: ['software', 'app', 'tech', 'digital', 'platform', 'development', 'programming', 'coding', 'ai', 'machine learning'],
        strongIndicators: ['developers', 'github', 'open source', 'documentation', 'sdk'],
        domains: ['github', 'stackoverflow', 'microsoft', 'google', 'apple'],
        weight: 2
      },
      'ecommerce': {
        keywords: ['shop', 'store', 'buy', 'cart', 'checkout', 'payment', 'shipping', 'orders', 'inventory'],
        strongIndicators: ['add to cart', 'free shipping', 'return policy', 'customer reviews'],
        domains: ['shopify', 'amazon', 'etsy', 'ebay'],
        weight: 3
      },
      'finance': {
        keywords: ['finance', 'banking', 'investment', 'loan', 'credit', 'payment', 'financial', 'money', 'trading'],
        strongIndicators: ['interest rate', 'apr', 'fdic insured', 'securities'],
        domains: ['paypal', 'stripe', 'square', 'mint'],
        weight: 3
      },
      'healthcare': {
        keywords: ['health', 'medical', 'doctor', 'clinic', 'hospital', 'patient', 'treatment', 'therapy'],
        strongIndicators: ['appointment', 'insurance', 'hipaa', 'medical records'],
        domains: ['webmd', 'mayoclinic'],
        weight: 3
      },
      'education': {
        keywords: ['education', 'school', 'course', 'training', 'learn', 'student', 'teacher', 'university'],
        strongIndicators: ['enroll', 'curriculum', 'degree', 'certification'],
        domains: ['coursera', 'udemy', 'khan academy'],
        weight: 2
      },
      'restaurant': {
        keywords: ['restaurant', 'cafe', 'food', 'menu', 'dining', 'cuisine', 'chef', 'reservation'],
        strongIndicators: ['book table', 'delivery', 'takeout', 'hours'],
        domains: ['opentable', 'grubhub'],
        weight: 2
      },
      'retail': {
        keywords: ['retail', 'store', 'product', 'sale', 'brand', 'fashion', 'clothing'],
        strongIndicators: ['size guide', 'in stock', 'sale price'],
        domains: ['target', 'walmart'],
        weight: 2
      },
      'service': {
        keywords: ['service', 'consulting', 'professional', 'expert', 'agency', 'solutions'],
        strongIndicators: ['contact us', 'consultation', 'portfolio'],
        domains: [],
        weight: 1
      }
    };

    // Check domain for strong indicators
    const url = $('link[rel="canonical"]').attr('href') || window?.location?.href || '';
    const domain = url.toLowerCase();

    let scores: Record<string, number> = {};

    for (const [type, config] of Object.entries(businessTypes)) {
      let score = 0;

      // Domain matching (highest weight)
      if (config.domains.some(d => domain.includes(d))) {
        score += 10;
      }

      // Special domain-specific adjustments
      if (domain.includes('stripe') || domain.includes('paypal') || domain.includes('square')) {
        if (type === 'finance') score += 8; // Boost finance for payment companies
        if (type === 'saas') score -= 3; // Reduce SaaS score for payment companies
      }

      // Strong indicators (high weight)
      const strongMatches = config.strongIndicators.filter(indicator =>
        combinedText.includes(indicator)
      ).length;
      score += strongMatches * 3;

      // Regular keywords (medium weight)
      const keywordMatches = config.keywords.filter(keyword =>
        combinedText.includes(keyword)
      ).length;
      score += keywordMatches * config.weight;

      // Title and meta description get extra weight
      const titleMatches = config.keywords.filter(keyword =>
        title.includes(keyword)
      ).length;
      score += titleMatches * 2;

      const metaMatches = config.keywords.filter(keyword =>
        metaDescription.includes(keyword)
      ).length;
      score += metaMatches * 2;

      scores[type] = score;
    }

    // Find the type with the highest score
    const bestMatch = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b
    );

    // Only return a specific type if the score is above threshold
    return bestMatch[1] > 2 ? bestMatch[0] : 'business';
  }

  private inferIndustry($: cheerio.CheerioAPI): string {
    const businessType = this.inferBusinessType($);
    const industryMap: Record<string, string> = {
      'saas': 'Software as a Service',
      'technology': 'Technology & Software',
      'ecommerce': 'E-commerce & Retail',
      'finance': 'Financial Services',
      'healthcare': 'Healthcare & Medical',
      'education': 'Education & Training',
      'restaurant': 'Food & Beverage',
      'retail': 'Retail & Consumer Goods',
      'service': 'Professional Services'
    };

    return industryMap[businessType] || 'General Business';
  }

  private extractServices($: cheerio.CheerioAPI): ServiceDetail[] {
    const services: ServiceDetail[] = [];

    // Enhanced service detection patterns
    const serviceSelectors = [
      '.service, [class*="service"]',
      '.feature, [class*="feature"]',
      '.solution, [class*="solution"]',
      '.offering, [class*="offering"]',
      '.capability, [class*="capability"]',
      '.product, [class*="product"]',
      '[data-service], [data-feature]',
      '.card, [class*="card"]',
      '.item, [class*="item"]'
    ];

    // Look for services in navigation menus
    $('nav a, .nav a, .menu a, .navigation a').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const href = $el.attr('href') || '';

      // Skip common navigation items
      const skipItems = ['home', 'about', 'contact', 'blog', 'news', 'login', 'signup', 'privacy', 'terms'];
      if (text.length > 3 && text.length < 50 && !skipItems.some(skip => text.toLowerCase().includes(skip))) {
        services.push({
          name: text,
          description: `Service offering: ${text}`,
          features: [],
          category: this.categorizeService(text)
        });
      }
    });

    // Look for service sections with enhanced patterns
    for (const selector of serviceSelectors) {
      $(selector).each((_, el) => {
        const $el = $(el);

        // Skip if this element is too small or likely not a service
        const text = $el.text().trim();
        if (text.length < 20) return;

        const name = this.extractServiceName($el);
        const description = this.extractServiceDescription($el);

        if (name && name.length > 3 && name.length < 100) {
          // Check for duplicates
          const isDuplicate = services.some(s =>
            s.name.toLowerCase() === name.toLowerCase() ||
            this.calculateSimilarity(s.name, name) > 0.8
          );

          if (!isDuplicate) {
            services.push({
              name,
              description: description || `${name} service offering`,
              features: this.extractServiceFeatures($, $el),
              category: this.categorizeService(name)
            });
          }
        }
      });
    }

    // Look for services in structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}');
        if (data['@type'] === 'Service' || data['@type'] === 'Product') {
          services.push({
            name: data.name || 'Service',
            description: data.description || '',
            features: [],
            category: 'Structured Data'
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    });

    // Look for services in headings followed by descriptions
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $heading = $(el);
      const headingText = $heading.text().trim();

      if (headingText.length > 5 && headingText.length < 80) {
        const $next = $heading.next();
        const description = $next.is('p, div, span') ? $next.text().trim() : '';

        if (description.length > 20) {
          const isDuplicate = services.some(s =>
            this.calculateSimilarity(s.name, headingText) > 0.7
          );

          if (!isDuplicate) {
            services.push({
              name: headingText,
              description,
              features: [],
              category: this.categorizeService(headingText)
            });
          }
        }
      }
    });

    // Remove duplicates and sort by relevance
    const uniqueServices = this.deduplicateServices(services);
    return uniqueServices.slice(0, 15); // Increased limit
  }

  private extractServiceName($el: cheerio.Cheerio<cheerio.Element>): string {
    const nameSelectors = [
      'h1, h2, h3, h4, h5, h6',
      '.title, [class*="title"]',
      '.name, [class*="name"]',
      '.heading, [class*="heading"]',
      '.label, [class*="label"]',
      'strong, b',
      '.service-name, .feature-name'
    ];

    for (const selector of nameSelectors) {
      const name = $el.find(selector).first().text().trim();
      if (name && name.length > 3 && name.length < 100) {
        return name;
      }
    }

    // Fallback to first meaningful text
    const text = $el.text().trim();
    const firstLine = text.split('\n')[0].trim();
    return firstLine.length < 100 ? firstLine : '';
  }

  private extractServiceDescription($el: cheerio.Cheerio<cheerio.Element>): string {
    const descSelectors = [
      'p, .description, [class*="description"]',
      '.summary, [class*="summary"]',
      '.content, [class*="content"]',
      '.text, [class*="text"]',
      '.details, [class*="details"]'
    ];

    for (const selector of descSelectors) {
      const desc = $el.find(selector).first().text().trim();
      if (desc && desc.length > 20 && desc.length < 500) {
        return desc;
      }
    }

    return '';
  }

  private extractServiceFeatures($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>): string[] {
    const features: string[] = [];

    // Look for lists
    $el.find('ul li, ol li, .feature, [class*="feature"]').each((_, featureEl) => {
      const feature = $(featureEl).text().trim();
      if (feature && feature.length > 5 && feature.length < 100) {
        features.push(feature);
      }
    });

    return features.slice(0, 5);
  }

  private categorizeService(serviceName: string): string {
    const name = serviceName.toLowerCase();

    const categories = {
      'Marketing': ['marketing', 'advertising', 'seo', 'social media', 'email', 'campaign'],
      'Development': ['development', 'coding', 'programming', 'software', 'app', 'web'],
      'Design': ['design', 'ui', 'ux', 'graphic', 'branding', 'creative'],
      'Analytics': ['analytics', 'data', 'reporting', 'insights', 'metrics'],
      'Support': ['support', 'help', 'customer service', 'assistance'],
      'Integration': ['integration', 'api', 'connect', 'sync', 'workflow'],
      'Security': ['security', 'protection', 'privacy', 'encryption', 'safe'],
      'Communication': ['communication', 'chat', 'messaging', 'collaboration']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private deduplicateServices(services: ServiceDetail[]): ServiceDetail[] {
    const unique: ServiceDetail[] = [];

    for (const service of services) {
      const isDuplicate = unique.some(existing =>
        this.calculateSimilarity(existing.name, service.name) > 0.8
      );

      if (!isDuplicate) {
        unique.push(service);
      }
    }

    return unique;
  }

  private extractProducts($: cheerio.CheerioAPI): ProductDetail[] {
    const products: ProductDetail[] = [];

    // Enhanced product detection patterns
    const productSelectors = [
      '.product, [class*="product"]',
      '.item, [class*="item"]',
      '.plan, [class*="plan"]',
      '.package, [class*="package"]',
      '.tier, [class*="tier"]',
      '.option, [class*="option"]',
      '.card, [class*="card"]',
      '[data-product], [data-plan]'
    ];

    // Look for pricing plans (common in SaaS)
    $('.pricing .plan, .plans .plan, [class*="pricing"] [class*="plan"]').each((_, el) => {
      const $el = $(el);
      const name = this.extractProductName($el);
      const price = this.extractProductPrice($el);
      const description = this.extractProductDescription($el);

      if (name) {
        products.push({
          name,
          description: description || `${name} pricing plan`,
          price,
          images: this.extractProductImages($, $el),
          features: this.extractProductFeatures($, $el)
        });
      }
    });

    // Look for general products
    for (const selector of productSelectors) {
      $(selector).each((_, el) => {
        const $el = $(el);

        // Skip if this element is too small
        const text = $el.text().trim();
        if (text.length < 15) return;

        const name = this.extractProductName($el);
        const price = this.extractProductPrice($el);
        const description = this.extractProductDescription($el);

        if (name && name.length > 2 && name.length < 100) {
          // Check for duplicates
          const isDuplicate = products.some(p =>
            p.name.toLowerCase() === name.toLowerCase() ||
            this.calculateSimilarity(p.name, name) > 0.8
          );

          if (!isDuplicate) {
            products.push({
              name,
              description: description || '',
              price: price || '',
              images: this.extractProductImages($, $el),
              features: this.extractProductFeatures($, $el)
            });
          }
        }
      });
    }

    // Look for products in structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}');
        if (data['@type'] === 'Product') {
          products.push({
            name: data.name || 'Product',
            description: data.description || '',
            price: data.offers?.price ? `$${data.offers.price}` : '',
            images: data.image ? [data.image] : [],
            features: []
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    });

    // Look for software features as products (for SaaS)
    if (products.length < 3) {
      $('h2, h3, h4').each((_, el) => {
        const $heading = $(el);
        const headingText = $heading.text().trim();

        // Look for feature-like headings
        const featureKeywords = ['feature', 'tool', 'solution', 'capability', 'module', 'component'];
        const isFeature = featureKeywords.some(keyword =>
          headingText.toLowerCase().includes(keyword)
        );

        if (isFeature && headingText.length > 5 && headingText.length < 80) {
          const $next = $heading.next();
          const description = $next.is('p, div') ? $next.text().trim() : '';

          if (description.length > 20) {
            products.push({
              name: headingText,
              description,
              price: '',
              images: [],
              features: []
            });
          }
        }
      });
    }

    return this.deduplicateProducts(products).slice(0, 12);
  }

  private extractProductName($el: cheerio.Cheerio<cheerio.Element>): string {
    const nameSelectors = [
      'h1, h2, h3, h4, h5',
      '.title, [class*="title"]',
      '.name, [class*="name"]',
      '.plan-name, .product-name',
      '.heading, [class*="heading"]',
      'strong, b'
    ];

    for (const selector of nameSelectors) {
      const name = $el.find(selector).first().text().trim();
      if (name && name.length > 2 && name.length < 100) {
        return name;
      }
    }

    // Fallback to data attributes
    const dataName = $el.attr('data-name') || $el.attr('data-product') || $el.attr('data-plan');
    if (dataName) return dataName;

    return '';
  }

  private extractProductPrice($el: cheerio.Cheerio<cheerio.Element>): string {
    const priceSelectors = [
      '.price, [class*="price"]',
      '.cost, [class*="cost"]',
      '.amount, [class*="amount"]',
      '.fee, [class*="fee"]',
      '[data-price]'
    ];

    for (const selector of priceSelectors) {
      const price = $el.find(selector).first().text().trim();
      if (price && (price.includes('$') || price.includes('€') || price.includes('£') || /\d/.test(price))) {
        return price;
      }
    }

    // Look for price patterns in text
    const text = $el.text();
    const pricePattern = /\$\d+(?:\.\d{2})?(?:\/\w+)?|\d+\s*(?:USD|EUR|GBP)(?:\/\w+)?/i;
    const match = text.match(pricePattern);
    return match ? match[0] : '';
  }

  private extractProductDescription($el: cheerio.Cheerio<cheerio.Element>): string {
    const descSelectors = [
      'p, .description, [class*="description"]',
      '.summary, [class*="summary"]',
      '.details, [class*="details"]',
      '.content, [class*="content"]',
      '.text, [class*="text"]'
    ];

    for (const selector of descSelectors) {
      const desc = $el.find(selector).first().text().trim();
      if (desc && desc.length > 15 && desc.length < 500) {
        return desc;
      }
    }

    return '';
  }

  private extractProductImages($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>): string[] {
    const images: string[] = [];

    $el.find('img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('icon') && !src.includes('logo')) {
        images.push(src);
      }
    });

    return images.slice(0, 3);
  }

  private extractProductFeatures($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>): string[] {
    const features: string[] = [];

    // Look for feature lists
    $el.find('ul li, ol li, .feature, [class*="feature"], .benefit, [class*="benefit"]').each((_, featureEl) => {
      const feature = $(featureEl).text().trim();
      if (feature && feature.length > 5 && feature.length < 150) {
        features.push(feature);
      }
    });

    // Look for checkmark lists (common in pricing plans)
    $el.find('[class*="check"], [class*="tick"], .included').each((_, featureEl) => {
      const feature = $(featureEl).text().trim();
      if (feature && feature.length > 5 && feature.length < 150) {
        features.push(feature);
      }
    });

    return features.slice(0, 8);
  }

  private deduplicateProducts(products: ProductDetail[]): ProductDetail[] {
    const unique: ProductDetail[] = [];

    for (const product of products) {
      const isDuplicate = unique.some(existing =>
        this.calculateSimilarity(existing.name, product.name) > 0.8
      );

      if (!isDuplicate) {
        unique.push(product);
      }
    }

    return unique;
  }

  private extractPricing($: cheerio.CheerioAPI): PricingModel[] {
    const pricing: PricingModel[] = [];
    
    $('.pricing, [class*="pricing"], .plan, [class*="plan"]').each((_, el) => {
      const $el = $(el);
      const planName = $el.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
      const price = $el.find('.price, [class*="price"]').first().text().trim();
      
      if (planName && price) {
        pricing.push({
          planName,
          price,
          features: []
        });
      }
    });

    return pricing;
  }

  private extractTestimonials($: cheerio.CheerioAPI): Testimonial[] {
    const testimonials: Testimonial[] = [];
    
    $('.testimonial, [class*="testimonial"], .review, [class*="review"]').each((_, el) => {
      const $el = $(el);
      const content = $el.find('p, .content, [class*="content"]').first().text().trim();
      const author = $el.find('.author, [class*="author"], .name, [class*="name"]').first().text().trim();
      
      if (content && author) {
        testimonials.push({
          content,
          author
        });
      }
    });

    return testimonials.slice(0, 5); // Limit to 5 testimonials
  }

  private extractTeamInfo($: cheerio.CheerioAPI): TeamMember[] {
    const team: TeamMember[] = [];
    
    $('.team-member, [class*="team"], .staff, [class*="staff"]').each((_, el) => {
      const $el = $(el);
      const name = $el.find('h1, h2, h3, h4, .name, [class*="name"]').first().text().trim();
      const role = $el.find('.role, [class*="role"], .title, [class*="title"]').first().text().trim();
      
      if (name && role) {
        team.push({
          name,
          role
        });
      }
    });

    return team.slice(0, 10); // Limit to 10 team members
  }

  private extractUVP($: cheerio.CheerioAPI): string {
    // Look for unique value proposition in common locations
    const uvpSelectors = [
      '.hero h1',
      '.banner h1', 
      '.value-proposition',
      '[class*="value-prop"]',
      '.tagline',
      '[class*="tagline"]'
    ];

    for (const selector of uvpSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 20 && text.length < 200) {
        return text;
      }
    }

    return '';
  }

  private extractCompetitiveAdvantages($: cheerio.CheerioAPI): string[] {
    const advantages: string[] = [];
    
    // Look for advantage/benefit sections
    $('.advantage, [class*="advantage"], .benefit, [class*="benefit"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 100) {
        advantages.push(text);
      }
    });

    return advantages.slice(0, 5); // Limit to 5 advantages
  }

  // Additional extraction methods will be implemented...
  private extractVisualBrand($: cheerio.CheerioAPI): VisualBrandAnalysis {
    return {
      colors: {
        primary: '',
        secondary: [],
        accent: [],
        background: '',
        text: ''
      },
      typography: {
        headingFonts: [],
        bodyFonts: []
      },
      logoUrls: this.extractLogos($),
      imageStyle: 'mixed',
      designStyle: 'modern',
      visualThemes: []
    };
  }

  private extractLogos($: cheerio.CheerioAPI): string[] {
    const logos: string[] = [];
    
    // Common logo selectors
    const logoSelectors = [
      'img[class*="logo"]',
      'img[id*="logo"]',
      'img[alt*="logo"]',
      '.logo img',
      '#logo img',
      'header img:first-child'
    ];

    logoSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('data:')) {
          logos.push(src);
        }
      });
    });

    return [...new Set(logos)]; // Remove duplicates
  }

  private extractContentStrategy($: cheerio.CheerioAPI): ContentStrategyAnalysis {
    return {
      contentThemes: this.extractContentThemes($),
      callToActionPatterns: this.extractCTAPatterns($),
      customerPainPoints: [],
      contentTone: this.inferContentTone($),
      messagingFramework: [],
      blogTopics: [],
      socialProof: []
    };
  }

  private extractContentThemes($: cheerio.CheerioAPI): string[] {
    const themes: string[] = [];
    
    // Extract from headings
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 100) {
        themes.push(text);
      }
    });

    return themes.slice(0, 10);
  }

  private extractCTAPatterns($: cheerio.CheerioAPI): string[] {
    const ctas: string[] = [];
    
    // Common CTA selectors
    const ctaSelectors = [
      'button',
      'a[class*="btn"]',
      'a[class*="button"]',
      'input[type="submit"]',
      '[class*="cta"]'
    ];

    ctaSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && text.length < 50) {
          ctas.push(text);
        }
      });
    });

    return [...new Set(ctas)]; // Remove duplicates
  }

  private inferContentTone($: cheerio.CheerioAPI): ContentStrategyAnalysis['contentTone'] {
    const text = $('body').text().toLowerCase();
    
    if (text.includes('professional') || text.includes('expert') || text.includes('certified')) {
      return 'professional';
    } else if (text.includes('friendly') || text.includes('welcome') || text.includes('hello')) {
      return 'friendly';
    } else if (text.includes('technical') || text.includes('specification') || text.includes('advanced')) {
      return 'technical';
    }
    
    return 'conversational';
  }

  private extractTechnicalSEO($: cheerio.CheerioAPI): TechnicalSEOAnalysis {
    return {
      metaData: {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: ($('meta[name="keywords"]').attr('content') || '').split(',').map(k => k.trim()).filter(k => k)
      },
      headingStructure: {
        h1: $('h1').map((_, el) => $(el).text().trim()).get(),
        h2: $('h2').map((_, el) => $(el).text().trim()).get(),
        h3: $('h3').map((_, el) => $(el).text().trim()).get()
      },
      structuredData: this.extractStructuredData($),
      altTextPatterns: this.extractAltTextPatterns($),
      internalLinking: {
        totalLinks: $('a[href]').length,
        navigationStructure: this.extractNavigationStructure($)
      }
    };
  }

  private extractStructuredData($: cheerio.CheerioAPI): any[] {
    const structuredData: any[] = [];
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).text());
        structuredData.push(data);
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    return structuredData;
  }

  private extractAltTextPatterns($: cheerio.CheerioAPI): string[] {
    const altTexts: string[] = [];
    
    $('img[alt]').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt && alt.trim()) {
        altTexts.push(alt.trim());
      }
    });

    return altTexts.slice(0, 20); // Limit to 20 alt texts
  }

  private extractNavigationStructure($: cheerio.CheerioAPI): string[] {
    const navItems: string[] = [];
    
    $('nav a, .navigation a, .menu a').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 1 && text.length < 50) {
        navItems.push(text);
      }
    });

    return [...new Set(navItems)]; // Remove duplicates
  }

  private extractContactInformation($: cheerio.CheerioAPI): ContactInformation {
    return {
      phone: this.extractPhoneNumbers($),
      email: this.extractEmailAddresses($),
      address: this.extractAddresses($),
      socialMedia: this.extractSocialMedia($),
      businessHours: this.extractBusinessHours($),
      locations: []
    };
  }

  private extractPhoneNumbers($: cheerio.CheerioAPI): string[] {
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
    const text = $('body').text();
    const matches = text.match(phoneRegex) || [];
    return [...new Set(matches.map(match => match.trim()))].slice(0, 5);
  }

  private extractEmailAddresses($: cheerio.CheerioAPI): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = $('body').text();
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches)].slice(0, 5);
  }

  private extractAddresses($: cheerio.CheerioAPI): string[] {
    const addressRegex = /\d+\s+[A-Za-z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)/gi;
    const text = $('body').text();
    const matches = text.match(addressRegex) || [];
    return [...new Set(matches.map(match => match.trim()))].slice(0, 3);
  }

  private extractSocialMedia($: cheerio.CheerioAPI): SocialMediaProfile[] {
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
    const socialLinks: SocialMediaProfile[] = [];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.toLowerCase() || '';
      socialPlatforms.forEach(platform => {
        if (href.includes(platform + '.com')) {
          socialLinks.push({
            platform,
            url: $(el).attr('href') || ''
          });
        }
      });
    });
    
    return socialLinks;
  }

  private extractBusinessHours($: cheerio.CheerioAPI): string {
    const hoursSelectors = [
      '.hours',
      '[class*="hours"]',
      '.schedule',
      '[class*="schedule"]',
      '.open',
      '[class*="open"]'
    ];

    for (const selector of hoursSelectors) {
      const text = $(selector).text().trim();
      if (text && text.length > 10) {
        return text;
      }
    }

    return '';
  }

  private calculateQualityMetrics(data: any): { completeness: number; confidence: number } {
    let completenessScore = 0;
    let totalFields = 0;

    // Check basic info completeness
    const basicFields = ['title', 'description', 'language'];
    basicFields.forEach(field => {
      totalFields++;
      if (data.basicInfo[field]) completenessScore++;
    });

    // Check business intelligence completeness
    const biFields = ['businessType', 'industry', 'services', 'products'];
    biFields.forEach(field => {
      totalFields++;
      if (data.businessIntelligence[field] && 
          (typeof data.businessIntelligence[field] === 'string' ? 
           data.businessIntelligence[field] : 
           data.businessIntelligence[field].length > 0)) {
        completenessScore++;
      }
    });

    // Check contact info completeness
    const contactFields = ['phone', 'email', 'socialMedia'];
    contactFields.forEach(field => {
      totalFields++;
      if (data.contactInformation[field] && data.contactInformation[field].length > 0) {
        completenessScore++;
      }
    });

    const completeness = Math.round((completenessScore / totalFields) * 100);
    const confidence = Math.min(completeness + 10, 95); // Confidence is slightly higher than completeness, max 95%

    return { completeness, confidence };
  }
}

// Usage example
export async function analyzeWebsiteWithEnhancedSimpleScraper(url: string): Promise<EnhancedWebsiteAnalysis> {
  const scraper = new EnhancedSimpleScraper();
  return await scraper.analyzeWebsiteComprehensively(url);
}
