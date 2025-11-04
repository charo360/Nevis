// Note: Playwright import commented out for now - can be enabled when needed
// import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ComprehensiveAnalysis {
  // Basic Info
  basicInfo: {
    url: string;
    title: string;
    description: string;
    keywords: string[];
    language: string;
    favicon: string;
  };
  
  // Business Intelligence
  businessIntel: {
    businessType: string;
    industry: string;
    services: string[];
    products: ProductInfo[];
    pricing: PricingInfo[];
    contactInfo: ContactInfo;
    socialMedia: SocialMediaInfo[];
  };
  
  // Content Analysis
  contentAnalysis: {
    headings: string[];
    mainContent: string;
    testimonials: string[];
    features: string[];
    benefits: string[];
    callToActions: string[];
  };
  
  // Media Assets
  mediaAssets: {
    images: ImageInfo[];
    videos: VideoInfo[];
    logos: string[];
    downloadedAssets: string[];
  };
  
  // Technical Analysis
  technicalInfo: {
    technologies: string[];
    performance: PerformanceMetrics;
    seo: SEOAnalysis;
    accessibility: AccessibilityInfo;
  };
  
  // Competitive Intelligence
  competitiveIntel: {
    uniqueSellingPoints: string[];
    competitorMentions: string[];
    marketPosition: string;
    pricingStrategy: string;
  };
}

export interface ProductInfo {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  images: string[];
  category: string;
  inStock: boolean;
  rating?: number;
  reviews?: number;
}

export interface PricingInfo {
  planName: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  hours?: string;
}

export interface SocialMediaInfo {
  platform: string;
  url: string;
  followers?: string;
}

export interface ImageInfo {
  url: string;
  alt: string;
  localPath?: string;
  type: 'logo' | 'product' | 'hero' | 'testimonial' | 'other';
}

export interface VideoInfo {
  url: string;
  title: string;
  thumbnail?: string;
  duration?: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  pageSize: number;
  requests: number;
  lighthouse?: any;
}

export interface SEOAnalysis {
  metaTags: Record<string, string>;
  structuredData: any[];
  headingStructure: string[];
  internalLinks: number;
  externalLinks: number;
}

export interface AccessibilityInfo {
  hasAltTags: boolean;
  hasAriaLabels: boolean;
  colorContrast: string;
  keyboardNavigation: boolean;
}

export class ComprehensiveWebsiteScraper {
  private browser: Browser | null = null;
  private downloadDir: string;

  constructor(downloadDir: string = './scraped-assets') {
    this.downloadDir = downloadDir;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create download directory
    await fs.mkdir(this.downloadDir, { recursive: true });
  }

  async analyzeWebsite(url: string): Promise<ComprehensiveAnalysis> {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser!.newPage();
    
    try {
      console.log(`🔍 Starting comprehensive analysis of: ${url}`);
      
      // Navigate and wait for content
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Allow dynamic content to load
      
      // Run all analysis in parallel for speed
      const [
        basicInfo,
        businessIntel,
        contentAnalysis,
        mediaAssets,
        technicalInfo,
        competitiveIntel
      ] = await Promise.all([
        this.extractBasicInfo(page),
        this.extractBusinessIntelligence(page),
        this.extractContentAnalysis(page),
        this.extractMediaAssets(page, url),
        this.extractTechnicalInfo(page),
        this.extractCompetitiveIntelligence(page)
      ]);

      return {
        basicInfo,
        businessIntel,
        contentAnalysis,
        mediaAssets,
        technicalInfo,
        competitiveIntel
      };
      
    } finally {
      await page.close();
    }
  }

  private async extractBasicInfo(page: Page): Promise<ComprehensiveAnalysis['basicInfo']> {
    return await page.evaluate(() => {
      const getMetaContent = (name: string) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta?.getAttribute('content') || '';
      };

      return {
        url: window.location.href,
        title: document.title,
        description: getMetaContent('description'),
        keywords: getMetaContent('keywords').split(',').map(k => k.trim()).filter(Boolean),
        language: document.documentElement.lang || 'en',
        favicon: document.querySelector('link[rel*="icon"]')?.getAttribute('href') || ''
      };
    });
  }

  private async extractBusinessIntelligence(page: Page): Promise<ComprehensiveAnalysis['businessIntel']> {
    return await page.evaluate(() => {
      // Extract business type and industry
      const businessKeywords = {
        'ecommerce': ['shop', 'buy', 'cart', 'checkout', 'product', 'store'],
        'saas': ['software', 'platform', 'dashboard', 'api', 'subscription'],
        'fintech': ['payment', 'bank', 'finance', 'money', 'transaction'],
        'healthcare': ['health', 'medical', 'doctor', 'clinic', 'treatment'],
        'education': ['course', 'learn', 'student', 'education', 'training'],
        'restaurant': ['menu', 'food', 'restaurant', 'order', 'delivery']
      };

      const pageText = document.body.innerText.toLowerCase();
      let businessType = 'general';
      let maxMatches = 0;

      for (const [type, keywords] of Object.entries(businessKeywords)) {
        const matches = keywords.filter(keyword => pageText.includes(keyword)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          businessType = type;
        }
      }

      // Extract services
      const serviceSelectors = [
        'h2, h3, h4',
        '.service',
        '.feature',
        '[class*="service"]',
        '[class*="feature"]'
      ];
      
      const services: string[] = [];
      serviceSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length < 100 && text.length > 5) {
            services.push(text);
          }
        });
      });

      // Extract products (for e-commerce)
      const products: ProductInfo[] = [];
      document.querySelectorAll('[class*="product"], .item, [data-product]').forEach(productEl => {
        const name = productEl.querySelector('h1, h2, h3, .title, [class*="title"]')?.textContent?.trim();
        const price = productEl.querySelector('[class*="price"], .price')?.textContent?.trim();
        const description = productEl.querySelector('.description, [class*="desc"]')?.textContent?.trim();
        
        if (name) {
          products.push({
            name,
            description: description || '',
            price: price || '',
            images: Array.from(productEl.querySelectorAll('img')).map(img => img.src),
            category: '',
            inStock: !productEl.textContent?.toLowerCase().includes('out of stock')
          });
        }
      });

      // Extract contact info
      const contactInfo: ContactInfo = {};
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
      
      const emails = pageText.match(emailRegex);
      const phones = pageText.match(phoneRegex);
      
      if (emails) contactInfo.email = emails[0];
      if (phones) contactInfo.phone = phones[0];

      // Extract social media
      const socialMedia: SocialMediaInfo[] = [];
      document.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="instagram"], a[href*="linkedin"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          const platform = href.includes('facebook') ? 'Facebook' :
                          href.includes('twitter') ? 'Twitter' :
                          href.includes('instagram') ? 'Instagram' :
                          href.includes('linkedin') ? 'LinkedIn' : 'Other';
          socialMedia.push({ platform, url: href });
        }
      });

      return {
        businessType,
        industry: businessType,
        services: [...new Set(services)].slice(0, 10),
        products: products.slice(0, 20),
        pricing: [],
        contactInfo,
        socialMedia
      };
    });
  }

  private async extractContentAnalysis(page: Page): Promise<ComprehensiveAnalysis['contentAnalysis']> {
    return await page.evaluate(() => {
      // Extract headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim())
        .filter(Boolean) as string[];

      // Extract main content
      const contentSelectors = ['main', '.content', '#content', '.main', 'article'];
      let mainContent = '';
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element.textContent?.trim() || '';
          break;
        }
      }
      if (!mainContent) {
        mainContent = document.body.textContent?.trim().slice(0, 1000) || '';
      }

      // Extract testimonials
      const testimonials = Array.from(document.querySelectorAll('[class*="testimonial"], [class*="review"], .quote'))
        .map(el => el.textContent?.trim())
        .filter(Boolean) as string[];

      // Extract features
      const features = Array.from(document.querySelectorAll('[class*="feature"], .benefit, [class*="advantage"]'))
        .map(el => el.textContent?.trim())
        .filter(Boolean) as string[];

      // Extract CTAs
      const callToActions = Array.from(document.querySelectorAll('button, .btn, [class*="cta"], a[class*="button"]'))
        .map(el => el.textContent?.trim())
        .filter(Boolean) as string[];

      return {
        headings: headings.slice(0, 20),
        mainContent,
        testimonials: testimonials.slice(0, 10),
        features: features.slice(0, 15),
        benefits: features.slice(0, 10), // Similar to features
        callToActions: [...new Set(callToActions)].slice(0, 10)
      };
    });
  }

  private async extractMediaAssets(page: Page, baseUrl: string): Promise<ComprehensiveAnalysis['mediaAssets']> {
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        url: img.src,
        alt: img.alt || '',
        type: img.className.includes('logo') ? 'logo' as const :
              img.closest('[class*="product"]') ? 'product' as const :
              img.closest('header, .hero') ? 'hero' as const :
              img.closest('[class*="testimonial"]') ? 'testimonial' as const :
              'other' as const
      }));
    });

    const videos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]')).map(video => ({
        url: video.getAttribute('src') || '',
        title: video.getAttribute('title') || '',
        thumbnail: video.getAttribute('poster') || ''
      }));
    });

    return {
      images: images.slice(0, 50),
      videos: videos.slice(0, 10),
      logos: images.filter(img => img.type === 'logo').map(img => img.url),
      downloadedAssets: [] // Will be populated if we download assets
    };
  }

  private async extractTechnicalInfo(page: Page): Promise<ComprehensiveAnalysis['technicalInfo']> {
    const startTime = Date.now();
    
    const techInfo = await page.evaluate(() => {
      // Detect technologies
      const technologies: string[] = [];
      
      // Check for common frameworks/libraries
      if (window.React) technologies.push('React');
      if (window.Vue) technologies.push('Vue.js');
      if (window.angular) technologies.push('Angular');
      if (window.jQuery) technologies.push('jQuery');
      if (document.querySelector('[data-react-helmet]')) technologies.push('React Helmet');
      if (document.querySelector('script[src*="shopify"]')) technologies.push('Shopify');
      if (document.querySelector('script[src*="wordpress"]')) technologies.push('WordPress');

      // SEO Analysis
      const metaTags: Record<string, string> = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metaTags[name] = content;
        }
      });

      const headingStructure = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => `${h.tagName}: ${h.textContent?.trim().slice(0, 50)}`);

      const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]').length;
      const externalLinks = document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])').length;

      return {
        technologies,
        seo: {
          metaTags,
          structuredData: [], // Would need more complex extraction
          headingStructure,
          internalLinks,
          externalLinks
        }
      };
    });

    const loadTime = Date.now() - startTime;

    return {
      technologies: techInfo.technologies,
      performance: {
        loadTime,
        pageSize: 0, // Would need network monitoring
        requests: 0,
        lighthouse: null
      },
      seo: techInfo.seo,
      accessibility: {
        hasAltTags: false, // Would need detailed analysis
        hasAriaLabels: false,
        colorContrast: 'unknown',
        keyboardNavigation: false
      }
    };
  }

  private async extractCompetitiveIntelligence(page: Page): Promise<ComprehensiveAnalysis['competitiveIntel']> {
    return await page.evaluate(() => {
      const pageText = document.body.textContent?.toLowerCase() || '';
      
      // Extract unique selling points
      const uspKeywords = ['unique', 'only', 'first', 'best', 'leading', 'exclusive', 'patented'];
      const uniqueSellingPoints: string[] = [];
      
      document.querySelectorAll('h1, h2, h3, .highlight, [class*="usp"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text && uspKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
          uniqueSellingPoints.push(text);
        }
      });

      // Look for competitor mentions
      const competitorKeywords = ['vs', 'compared to', 'unlike', 'better than', 'alternative'];
      const competitorMentions: string[] = [];
      
      competitorKeywords.forEach(keyword => {
        if (pageText.includes(keyword)) {
          competitorMentions.push(`Mentions: ${keyword}`);
        }
      });

      // Determine market position
      const premiumKeywords = ['premium', 'luxury', 'enterprise', 'professional'];
      const budgetKeywords = ['affordable', 'cheap', 'budget', 'free'];
      
      let marketPosition = 'mid-market';
      if (premiumKeywords.some(keyword => pageText.includes(keyword))) {
        marketPosition = 'premium';
      } else if (budgetKeywords.some(keyword => pageText.includes(keyword))) {
        marketPosition = 'budget';
      }

      return {
        uniqueSellingPoints: uniqueSellingPoints.slice(0, 5),
        competitorMentions: competitorMentions.slice(0, 3),
        marketPosition,
        pricingStrategy: marketPosition
      };
    });
  }

  async downloadAssets(analysis: ComprehensiveAnalysis, maxImages: number = 10): Promise<string[]> {
    const downloadedPaths: string[] = [];
    
    // Download top images
    const topImages = analysis.mediaAssets.images.slice(0, maxImages);
    
    for (const [index, image] of topImages.entries()) {
      try {
        const response = await fetch(image.url);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const extension = path.extname(new URL(image.url).pathname) || '.jpg';
          const filename = `image_${index}_${image.type}${extension}`;
          const filepath = path.join(this.downloadDir, filename);
          
          await fs.writeFile(filepath, Buffer.from(buffer));
          downloadedPaths.push(filepath);
          
          console.log(`📥 Downloaded: ${filename}`);
        }
      } catch (error) {
        console.log(`❌ Failed to download: ${image.url}`);
      }
    }
    
    return downloadedPaths;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Usage example
export async function analyzeWebsiteComprehensively(url: string): Promise<ComprehensiveAnalysis> {
  const scraper = new ComprehensiveWebsiteScraper();
  
  try {
    const analysis = await scraper.analyzeWebsite(url);
    
    // Download assets if needed
    await scraper.downloadAssets(analysis, 5);
    
    console.log(`✅ Comprehensive analysis complete for: ${url}`);
    console.log(`📊 Found: ${analysis.businessIntel.products.length} products, ${analysis.mediaAssets.images.length} images`);
    
    return analysis;
  } finally {
    await scraper.close();
  }
}
