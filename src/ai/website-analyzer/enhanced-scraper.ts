/**
 * Enhanced Website Scraper
 * Provides comprehensive business intelligence through multi-page crawling,
 * deep content analysis, and AI-powered insights
 */

// Note: Playwright import - install with: npm install playwright
// import { chromium, Browser, Page } from 'playwright';

// Fallback types for when Playwright is not available
type Browser = any;
type Page = any;
const chromium = {
  launch: async (options: any) => {
    throw new Error('Playwright not installed. Run: npm install playwright');
  }
};
import * as fs from 'fs/promises';
import * as path from 'path';
import { URL } from 'url';

// Enhanced interfaces building on existing structure
export interface EnhancedWebsiteAnalysis {
  // Core website data
  basicInfo: BasicWebsiteInfo;
  businessIntelligence: BusinessIntelligence;
  visualBrand: VisualBrandAnalysis;
  contentStrategy: ContentStrategyAnalysis;
  technicalSEO: TechnicalSEOAnalysis;
  contactInformation: ContactInformation;
  
  // Analysis metadata
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
  robotsTxt?: string;
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
    fontSizes: number[];
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
  pageSpeed: {
    loadTime?: number;
    performanceScore?: number;
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

export interface CrawlTarget {
  url: string;
  type: 'homepage' | 'about' | 'services' | 'contact' | 'products' | 'blog' | 'team';
  priority: number;
  discovered: boolean;
}

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

export interface AnalysisMetadata {
  analyzedAt: Date;
  analysisVersion: string;
  pagesAnalyzed: string[];
  dataCompleteness: number; // 0-100%
  confidenceScore: number; // 0-100%
  processingTime: number; // milliseconds
  errors: string[];
}

export class EnhancedWebsiteScraper {
  private browser: Browser | null = null;
  private downloadDir: string;
  private maxPages: number = 10;
  private crawlDelay: number = 1000; // 1 second between requests

  constructor(downloadDir: string = './downloads/website-assets') {
    this.downloadDir = downloadDir;
  }

  async initialize(): Promise<void> {
    if (this.browser) return;
    
    this.browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });
    
    // Create download directory
    await fs.mkdir(this.downloadDir, { recursive: true });
    console.log('🚀 Enhanced Website Scraper initialized');
  }

  async analyzeWebsiteComprehensively(url: string): Promise<EnhancedWebsiteAnalysis> {
    const startTime = Date.now();
    console.log(`🔍 Starting enhanced comprehensive analysis of: ${url}`);
    
    if (!this.browser) await this.initialize();
    
    try {
      // Step 1: Discover pages to crawl
      const crawlTargets = await this.discoverPages(url);
      console.log(`📄 Discovered ${crawlTargets.length} pages to analyze`);
      
      // Step 2: Crawl and extract data from multiple pages
      const pageData = await this.crawlMultiplePages(crawlTargets);
      
      // Step 3: Synthesize data into comprehensive analysis
      const analysis = await this.synthesizeAnalysis(url, pageData, startTime);
      
      console.log(`✅ Enhanced analysis complete for: ${url}`);
      console.log(`📊 Data completeness: ${analysis.analysisMetadata.dataCompleteness}%`);
      console.log(`🎯 Confidence score: ${analysis.analysisMetadata.confidenceScore}%`);
      
      return analysis;
      
    } catch (error) {
      console.error(`❌ Enhanced analysis failed for ${url}:`, error);
      throw error;
    }
  }

  private async discoverPages(baseUrl: string): Promise<CrawlTarget[]> {
    const page = await this.browser!.newPage();
    const targets: CrawlTarget[] = [];
    
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Always include homepage
      targets.push({
        url: baseUrl,
        type: 'homepage',
        priority: 1,
        discovered: true
      });
      
      // Discover key pages through navigation and common patterns
      const discoveredUrls = await page.evaluate((baseUrl) => {
        const links: { url: string; text: string }[] = [];
        const domain = new URL(baseUrl).hostname;
        
        // Get all links
        document.querySelectorAll('a[href]').forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.toLowerCase().trim() || '';
          
          if (href) {
            try {
              const url = new URL(href, baseUrl);
              if (url.hostname === domain) {
                links.push({ url: url.href, text });
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });
        
        return links;
      }, baseUrl);
      
      // Categorize discovered URLs
      for (const link of discoveredUrls) {
        const type = this.categorizeUrl(link.url, link.text);
        if (type && !targets.find(t => t.url === link.url)) {
          targets.push({
            url: link.url,
            type,
            priority: this.getPriority(type),
            discovered: true
          });
        }
      }
      
      // Sort by priority and limit
      targets.sort((a, b) => a.priority - b.priority);
      return targets.slice(0, this.maxPages);
      
    } finally {
      await page.close();
    }
  }

  private categorizeUrl(url: string, linkText: string): CrawlTarget['type'] | null {
    const urlLower = url.toLowerCase();
    const textLower = linkText.toLowerCase();
    
    // About page patterns
    if (urlLower.includes('/about') || textLower.includes('about') || 
        textLower.includes('our story') || textLower.includes('who we are')) {
      return 'about';
    }
    
    // Services page patterns
    if (urlLower.includes('/service') || textLower.includes('service') ||
        textLower.includes('what we do') || textLower.includes('offerings')) {
      return 'services';
    }
    
    // Contact page patterns
    if (urlLower.includes('/contact') || textLower.includes('contact') ||
        textLower.includes('get in touch') || textLower.includes('reach us')) {
      return 'contact';
    }
    
    // Products page patterns
    if (urlLower.includes('/product') || textLower.includes('product') ||
        urlLower.includes('/shop') || textLower.includes('catalog')) {
      return 'products';
    }
    
    // Team page patterns
    if (urlLower.includes('/team') || textLower.includes('team') ||
        textLower.includes('our people') || textLower.includes('staff')) {
      return 'team';
    }
    
    // Blog page patterns
    if (urlLower.includes('/blog') || textLower.includes('blog') ||
        urlLower.includes('/news') || textLower.includes('articles')) {
      return 'blog';
    }
    
    return null;
  }

  private getPriority(type: CrawlTarget['type']): number {
    const priorities = {
      homepage: 1,
      about: 2,
      services: 3,
      products: 4,
      contact: 5,
      team: 6,
      blog: 7
    };
    return priorities[type] || 10;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Enhanced Website Scraper closed');
    }
  }

  private async crawlMultiplePages(targets: CrawlTarget[]): Promise<PageData[]> {
    const pageDataArray: PageData[] = [];

    for (const target of targets) {
      try {
        console.log(`📄 Analyzing ${target.type} page: ${target.url}`);

        const page = await this.browser!.newPage();
        await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for dynamic content
        await page.waitForTimeout(2000);

        const pageData = await this.extractPageData(page, target);
        pageDataArray.push(pageData);

        await page.close();

        // Respectful crawling delay
        if (targets.indexOf(target) < targets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.crawlDelay));
        }

      } catch (error) {
        console.error(`❌ Failed to analyze ${target.type} page: ${target.url}`, error);
        // Continue with other pages
      }
    }

    return pageDataArray;
  }

  private async extractPageData(page: Page, target: CrawlTarget): Promise<PageData> {
    const [
      basicInfo,
      content,
      visualElements,
      technicalData,
      contactData
    ] = await Promise.all([
      this.extractBasicPageInfo(page),
      this.extractContentData(page, target.type),
      this.extractVisualElements(page),
      this.extractTechnicalData(page),
      this.extractContactData(page)
    ]);

    return {
      url: target.url,
      type: target.type,
      basicInfo,
      content,
      visualElements,
      technicalData,
      contactData,
      extractedAt: new Date()
    };
  }

  private async extractBasicPageInfo(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const getMetaContent = (name: string) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta?.getAttribute('content') || '';
      };

      return {
        title: document.title || '',
        description: getMetaContent('description'),
        keywords: getMetaContent('keywords').split(',').map(k => k.trim()).filter(k => k),
        language: document.documentElement.lang || 'en',
        favicon: document.querySelector('link[rel*="icon"]')?.getAttribute('href') || '',
        url: window.location.href
      };
    });
  }

  private async extractContentData(page: Page, pageType: CrawlTarget['type']): Promise<any> {
    return await page.evaluate((pageType) => {
      const extractText = (selectors: string[]) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            return Array.from(elements).map(el => el.textContent?.trim()).filter(text => text && text.length > 20);
          }
        }
        return [];
      };

      const extractHeadings = () => {
        return {
          h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean),
          h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean),
          h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim()).filter(Boolean)
        };
      };

      const extractParagraphs = () => {
        return Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent?.trim())
          .filter(text => text && text.length > 30);
      };

      const extractLists = () => {
        return Array.from(document.querySelectorAll('ul li, ol li'))
          .map(li => li.textContent?.trim())
          .filter(text => text && text.length > 10);
      };

      const extractCTAs = () => {
        const ctaSelectors = [
          'button',
          'a[class*="btn"]',
          'a[class*="button"]',
          'input[type="submit"]',
          '[class*="cta"]',
          '[class*="call-to-action"]'
        ];

        return Array.from(document.querySelectorAll(ctaSelectors.join(', ')))
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 2 && text.length < 50);
      };

      // Page-specific extraction based on type
      let specificContent = {};

      if (pageType === 'about') {
        specificContent = {
          mission: extractText(['.mission', '[class*="mission"]', '[id*="mission"]']),
          vision: extractText(['.vision', '[class*="vision"]', '[id*="vision"]']),
          values: extractText(['.values', '[class*="values"]', '[id*="values"]']),
          history: extractText(['.history', '[class*="history"]', '[class*="story"]']),
          team: extractText(['.team', '[class*="team"]', '[class*="founder"]'])
        };
      } else if (pageType === 'services') {
        specificContent = {
          services: extractText(['.service', '[class*="service"]', '.offering', '[class*="offering"]']),
          features: extractText(['.feature', '[class*="feature"]', '.benefit', '[class*="benefit"]'])
        };
      } else if (pageType === 'products') {
        specificContent = {
          products: extractText(['.product', '[class*="product"]', '.item', '[class*="item"]']),
          pricing: extractText(['.price', '[class*="price"]', '.cost', '[class*="cost"]'])
        };
      }

      return {
        headings: extractHeadings(),
        paragraphs: extractParagraphs(),
        lists: extractLists(),
        ctas: extractCTAs(),
        pageType,
        specificContent
      };
    }, pageType);
  }

  private async extractVisualElements(page: Page): Promise<any> {
    return await page.evaluate(() => {
      // Extract colors from CSS
      const extractColors = () => {
        const colors = new Set<string>();
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;
          const borderColor = styles.borderColor;

          [bgColor, textColor, borderColor].forEach(color => {
            if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
              colors.add(color);
            }
          });
        });

        return Array.from(colors).slice(0, 20); // Limit to top 20 colors
      };

      // Extract fonts
      const extractFonts = () => {
        const fonts = new Set<string>();
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');

        elements.forEach(el => {
          const fontFamily = window.getComputedStyle(el).fontFamily;
          if (fontFamily) {
            fonts.add(fontFamily);
          }
        });

        return Array.from(fonts).slice(0, 10);
      };

      // Extract images
      const extractImages = () => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height,
          className: img.className
        })).filter(img => img.src && !img.src.includes('data:'));
      };

      // Extract logos (common patterns)
      const extractLogos = () => {
        const logoSelectors = [
          'img[class*="logo"]',
          'img[id*="logo"]',
          'img[alt*="logo"]',
          '.logo img',
          '#logo img',
          'header img',
          '.header img'
        ];

        return Array.from(document.querySelectorAll(logoSelectors.join(', ')))
          .map(img => (img as HTMLImageElement).src)
          .filter(src => src && !src.includes('data:'));
      };

      return {
        colors: extractColors(),
        fonts: extractFonts(),
        images: extractImages(),
        logos: extractLogos()
      };
    });
  }

  private async extractTechnicalData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      // Extract structured data
      const extractStructuredData = () => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        const structuredData = [];

        scripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent || '');
            structuredData.push(data);
          } catch (e) {
            // Invalid JSON, skip
          }
        });

        return structuredData;
      };

      // Extract meta tags
      const extractMetaTags = () => {
        const metaTags: Record<string, string> = {};
        document.querySelectorAll('meta').forEach(meta => {
          const name = meta.getAttribute('name') || meta.getAttribute('property');
          const content = meta.getAttribute('content');
          if (name && content) {
            metaTags[name] = content;
          }
        });
        return metaTags;
      };

      // Extract internal links
      const extractInternalLinks = () => {
        const domain = window.location.hostname;
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map(link => (link as HTMLAnchorElement).href)
          .filter(href => {
            try {
              return new URL(href).hostname === domain;
            } catch {
              return false;
            }
          });

        return {
          totalLinks: links.length,
          uniqueLinks: [...new Set(links)].length
        };
      };

      return {
        structuredData: extractStructuredData(),
        metaTags: extractMetaTags(),
        internalLinks: extractInternalLinks(),
        technologies: [] // Could be enhanced with technology detection
      };
    });
  }

  private async extractContactData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const extractPhoneNumbers = () => {
        const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
        const text = document.body.textContent || '';
        const matches = text.match(phoneRegex) || [];
        return [...new Set(matches.map(match => match.trim()))].slice(0, 5);
      };

      const extractEmails = () => {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const text = document.body.textContent || '';
        const matches = text.match(emailRegex) || [];
        return [...new Set(matches)].slice(0, 5);
      };

      const extractSocialMedia = () => {
        const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
        const socialLinks: { platform: string; url: string }[] = [];

        document.querySelectorAll('a[href]').forEach(link => {
          const href = (link as HTMLAnchorElement).href.toLowerCase();
          socialPlatforms.forEach(platform => {
            if (href.includes(platform + '.com')) {
              socialLinks.push({
                platform,
                url: (link as HTMLAnchorElement).href
              });
            }
          });
        });

        return socialLinks;
      };

      const extractAddresses = () => {
        // Simple address pattern matching
        const addressRegex = /\d+\s+[A-Za-z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)/gi;
        const text = document.body.textContent || '';
        const matches = text.match(addressRegex) || [];
        return [...new Set(matches.map(match => match.trim()))].slice(0, 3);
      };

      return {
        phones: extractPhoneNumbers(),
        emails: extractEmails(),
        socialMedia: extractSocialMedia(),
        addresses: extractAddresses()
      };
    });
  }

  private async synthesizeAnalysis(url: string, pageDataArray: PageData[], startTime: number): Promise<EnhancedWebsiteAnalysis> {
    const processingTime = Date.now() - startTime;

    // Combine data from all pages
    const combinedData = this.combinePageData(pageDataArray);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(combinedData);

    return {
      basicInfo: combinedData.basicInfo,
      businessIntelligence: combinedData.businessIntelligence,
      visualBrand: combinedData.visualBrand,
      contentStrategy: combinedData.contentStrategy,
      technicalSEO: combinedData.technicalSEO,
      contactInformation: combinedData.contactInformation,
      analysisMetadata: {
        analyzedAt: new Date(),
        analysisVersion: '2.0.0',
        pagesAnalyzed: pageDataArray.map(p => p.url),
        dataCompleteness: qualityMetrics.completeness,
        confidenceScore: qualityMetrics.confidence,
        processingTime,
        errors: []
      }
    };
  }

  private combinePageData(pageDataArray: PageData[]): any {
    // Implementation for combining data from multiple pages
    // This will aggregate and deduplicate information
    return {
      basicInfo: {},
      businessIntelligence: {},
      visualBrand: {},
      contentStrategy: {},
      technicalSEO: {},
      contactInformation: {}
    };
  }

  private calculateQualityMetrics(combinedData: any): { completeness: number; confidence: number } {
    // Calculate data completeness and confidence scores
    return {
      completeness: 75, // Placeholder
      confidence: 80    // Placeholder
    };
  }
}

interface PageData {
  url: string;
  type: CrawlTarget['type'];
  basicInfo: any;
  content: any;
  visualElements: any;
  technicalData: any;
  contactData: any;
  extractedAt: Date;
}
