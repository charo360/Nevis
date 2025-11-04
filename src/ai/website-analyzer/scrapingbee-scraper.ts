/**
 * Professional Website Scraper using ScrapingBee
 * Much more reliable than our simple fetch-based scraper
 */

interface ScrapingBeeResponse {
  url: string;
  status_code: number;
  body: string;
  resolved_url: string;
}

interface ScrapingBeeExtractResponse {
  url: string;
  status_code: number;
  extracted_data: {
    products?: Array<{
      name: string;
      price: string;
      image: string;
      description?: string;
    }>;
    business_info?: {
      name: string;
      description: string;
      phone: string;
      email: string;
    };
    images?: string[];
  };
}

export class ScrapingBeeScraper {
  private apiKey: string;
  private baseUrl = 'https://app.scrapingbee.com/api/v1/';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SCRAPINGBEE_API_KEY || '02TZC1IMIV78HEGQVKQ5OXCHX15C41DTZGK7YLPAGZNO4CA8VXKC9V7TG6BR2OX5GX84OS0Q9KMLH2DF';
    if (!this.apiKey) {
      console.warn('⚠️ ScrapingBee API key not found. Using fallback scraper.');
    } else {
      console.log('🐝 ScrapingBee API key configured successfully!');
    }
  }

  async analyzeWebsiteComprehensively(url: string): Promise<any> {
    console.log(`🐝 Starting ScrapingBee analysis of: ${url}`);
    
    if (!this.apiKey) {
      console.log('🔄 No ScrapingBee API key, falling back to simple scraper...');
      const { analyzeWebsiteComprehensively } = await import('./simple-scraper');
      return analyzeWebsiteComprehensively(url);
    }

    try {
      // Step 1: Get basic HTML content with JavaScript rendering
      const htmlResponse = await this.scrapeWithJS(url);
      
      // Step 2: Extract structured data using ScrapingBee's extraction rules
      const extractedData = await this.extractStructuredData(url);
      
      // Step 3: Combine and process the data
      return this.processScrapingBeeData(url, htmlResponse, extractedData);
      
    } catch (error) {
      console.warn(`⚠️ ScrapingBee failed for ${url}:`, error);
      console.log('🔄 Falling back to simple scraper...');
      
      // Fallback to simple scraper
      const { analyzeWebsiteComprehensively } = await import('./simple-scraper');
      return analyzeWebsiteComprehensively(url);
    }
  }

  private async scrapeWithJS(url: string): Promise<ScrapingBeeResponse> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url,
      render_js: 'true',
      premium_proxy: 'true',
      country_code: 'US'
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`ScrapingBee HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      url,
      status_code: response.status,
      body: await response.text(),
      resolved_url: url
    };
  }

  private async extractStructuredData(url: string): Promise<ScrapingBeeExtractResponse> {
    const extractRules = {
      products: {
        selector: '.product, .product-item, [class*="product"], [data-product]',
        type: 'list',
        output: {
          name: '.product-name, .title, h1, h2, h3, [class*="name"], [class*="title"]',
          price: '.price, .cost, [class*="price"], [class*="cost"]',
          image: 'img@src',
          description: '.description, .desc, p'
        }
      },
      business_info: {
        selector: 'body',
        output: {
          name: 'title, h1',
          description: 'meta[name="description"]@content',
          phone: 'text',
          email: 'text'
        }
      },
      images: {
        selector: 'img',
        type: 'list',
        output: '@src'
      }
    };

    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url,
      extract_rules: JSON.stringify(extractRules),
      render_js: 'true'
    });

    const response = await fetch(`${this.baseUrl}extract?${params}`);
    
    if (!response.ok) {
      throw new Error(`ScrapingBee Extract HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  private async processScrapingBeeData(url: string, htmlResponse: ScrapingBeeResponse, extractedData: ScrapingBeeExtractResponse): Promise<any> {
    const html = htmlResponse.body;
    const extracted = extractedData.extracted_data || {};

    // Extract title and description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : extracted.business_info?.name || 'Website';
    
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : extracted.business_info?.description || 'Professional services website';

    // Use AI to analyze the website content and extract real business information
    const businessAnalysis = await this.analyzeBusinessWithAI(html, title, description);

    // Process products from ScrapingBee extraction + AI analysis
    let products = (extracted.products || []).map(product => ({
      name: product.name || 'Product',
      price: product.price || undefined,
      category: this.categorizeProduct(product.name || ''),
      inStock: true,
      description: product.description || ''
    }));

    // If no products found, use AI-extracted products
    if (products.length === 0 && businessAnalysis.products) {
      products = businessAnalysis.products;
    }

    // Extract contact information using regex
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    
    const phoneMatches = html.match(phoneRegex) || [];
    const emailMatches = html.match(emailRegex) || [];
    
    const phones = phoneMatches.filter(phone => phone.replace(/\D/g, '').length >= 10).slice(0, 3);
    const emails = [...new Set(emailMatches)].slice(0, 3);

    // Process images
    const images = (extracted.images || []).map(imgSrc => ({
      url: imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, url).href,
      alt: '',
      type: this.categorizeImage(imgSrc) as 'logo' | 'product' | 'banner' | 'other'
    }));

    // Use AI analysis for business type and services
    const businessType = businessAnalysis.businessType || this.detectBusinessType(html, products);
    const industry = businessAnalysis.industry || this.detectIndustry(businessType);
    const services = businessAnalysis.services || this.extractServices(html);

    return {
      basicInfo: {
        url,
        title: businessAnalysis.businessName || title,
        description: businessAnalysis.description || description,
        keywords: this.extractKeywords(html),
        language: 'en',
        favicon: `${new URL(url).origin}/favicon.ico`
      },
      businessIntel: {
        businessType,
        industry,
        services,
        products,
        contactInfo: {
          phone: phones[0] || undefined,
          email: emails[0] || undefined,
          address: undefined
        },
        socialMedia: this.extractSocialMedia(html)
      },
      mediaAssets: {
        images,
        logos: images.filter(img => img.type === 'logo').map(img => img.url)
      },
      technicalAnalysis: {
        technologies: [],
        performance: {
          loadTime: 0,
          pageSize: html.length,
          requests: 0,
          lighthouse: null
        },
        seo: {
          metaTags: {},
          structuredData: [],
          headingStructure: [],
          internalLinks: 0,
          externalLinks: 0
        },
        accessibility: {
          hasAltTags: images.some(img => img.alt.length > 0),
          hasAriaLabels: html.includes('aria-label'),
          colorContrast: 'unknown',
          keyboardNavigation: false
        }
      },
      competitiveIntel: {
        uniqueSellingPoints: businessAnalysis.uniqueSellingPoints || this.extractUSPs(html, businessType),
        competitorMentions: [],
        marketPosition: 'mid-market',
        pricingStrategy: 'competitive'
      }
    };
  }

  private async analyzeBusinessWithAI(html: string, title: string, description: string): Promise<any> {
    try {
      // Import AI client
      const { getOpenAIClient } = await import('../../lib/services/openai-client');
      
      // Clean HTML content for AI analysis
      const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000); // Limit to 8000 chars for AI

      const prompt = `Analyze this website content and extract REAL business information. Do not make up generic information.

WEBSITE TITLE: ${title}
WEBSITE DESCRIPTION: ${description}
WEBSITE CONTENT: ${cleanText}

Extract the following information in JSON format:
{
  "businessName": "actual business name from the website",
  "businessType": "specific business type (e.g., Electronics Store, Restaurant, Software Company)",
  "industry": "specific industry",
  "description": "what this business actually does based on content",
  "services": ["actual service 1", "actual service 2", "actual service 3"],
  "products": [
    {"name": "actual product name", "price": "actual price if found", "category": "product category"},
    {"name": "actual product name", "price": "actual price if found", "category": "product category"}
  ],
  "uniqueSellingPoints": ["actual unique advantage 1", "actual unique advantage 2", "actual unique advantage 3"]
}

IMPORTANT RULES:
- Only extract information that is actually present on the website
- Do not use generic terms like "Professional service delivery"
- Use actual product names, not "Product A" or "Featured Product"
- Use actual service names, not people names
- If information is not clear, use "Not specified" rather than making it up
- Focus on what the business actually offers, not generic business advice`;

      const aiClient = getOpenAIClient();
      const response = await aiClient.generateText(prompt, 'gpt-4', { temperature: 0.3 });
      
      // Parse AI response - handle both string and object responses
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object' && 'text' in response) {
        responseText = response.text;
      } else {
        console.warn('⚠️ Unexpected AI response format:', response);
        return {};
      }
      
      // Parse JSON from response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('🤖 AI Business Analysis:', analysis);
        return analysis;
      }
      
      return {};
    } catch (error) {
      console.warn('⚠️ AI business analysis failed:', error);
      return {};
    }
  }

  private categorizeProduct(name: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('phone') || nameLower.includes('mobile')) return 'Mobile Phones';
    if (nameLower.includes('laptop') || nameLower.includes('computer')) return 'Computers';
    if (nameLower.includes('headphone') || nameLower.includes('audio')) return 'Audio';
    if (nameLower.includes('camera')) return 'Photography';
    return 'Electronics';
  }

  private categorizeImage(src: string): string {
    const srcLower = src.toLowerCase();
    if (srcLower.includes('logo')) return 'logo';
    if (srcLower.includes('product') || srcLower.includes('item')) return 'product';
    if (srcLower.includes('banner') || srcLower.includes('hero')) return 'banner';
    return 'other';
  }

  private detectBusinessType(html: string, products: any[]): string {
    const htmlLower = html.toLowerCase();
    
    if (products.length > 5) return 'E-commerce Store';
    if (htmlLower.includes('restaurant') || htmlLower.includes('food')) return 'Restaurant';
    if (htmlLower.includes('tech') || htmlLower.includes('software')) return 'Technology Company';
    if (htmlLower.includes('finance') || htmlLower.includes('bank')) return 'Financial Services';
    
    return 'Professional Services';
  }

  private detectIndustry(businessType: string): string {
    const industryMap: Record<string, string> = {
      'E-commerce Store': 'Retail',
      'Technology Company': 'Technology',
      'Financial Services': 'Financial Technology',
      'Restaurant': 'Food & Beverage',
      'Professional Services': 'General'
    };
    
    return industryMap[businessType] || 'General';
  }

  private extractKeywords(html: string): string[] {
    const keywordsMatch = html.match(/<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    return keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];
  }

  private extractServices(html: string): string[] {
    const services: string[] = [];
    const headingRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null && services.length < 10) {
      const heading = match[1].trim();
      if (heading.length > 3 && heading.length < 100) {
        services.push(heading);
      }
    }
    
    return services;
  }

  private extractSocialMedia(html: string): Array<{platform: string; url: string}> {
    const socialMedia: Array<{platform: string; url: string}> = [];
    const platforms = {
      facebook: /facebook\.com\/[^"'\s]+/gi,
      instagram: /instagram\.com\/[^"'\s]+/gi,
      twitter: /twitter\.com\/[^"'\s]+/gi,
      linkedin: /linkedin\.com\/[^"'\s]+/gi
    };

    Object.entries(platforms).forEach(([platform, regex]) => {
      const matches = html.match(regex);
      if (matches) {
        socialMedia.push({
          platform,
          url: `https://${matches[0]}`
        });
      }
    });

    return socialMedia;
  }

  private extractUSPs(html: string, businessType: string): string[] {
    // Generate USPs based on business type and content analysis
    const baseUSPs = {
      'E-commerce Store': ['Wide product selection', 'Fast shipping', 'Competitive pricing'],
      'Technology Company': ['Cutting-edge solutions', 'Expert technical support', 'Innovative development'],
      'Financial Services': ['Secure transactions', 'Fast processing', 'No hidden fees'],
      'Restaurant': ['Fresh ingredients', 'Authentic flavors', 'Fast service'],
      'Professional Services': ['Expert consultation', 'Quality service', 'Customer-focused approach']
    };

    return baseUSPs[businessType as keyof typeof baseUSPs] || baseUSPs['Professional Services'];
  }
}

// Export the main function
export async function analyzeWebsiteWithScrapingBee(url: string): Promise<any> {
  const scraper = new ScrapingBeeScraper();
  return await scraper.analyzeWebsiteComprehensively(url);
}
