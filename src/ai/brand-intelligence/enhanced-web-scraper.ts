// Enhanced Web Scraping Engine for Brand Intelligence
// Builds upon existing scraping infrastructure with advanced features

import * as cheerio from 'cheerio';
import { randomBytes } from 'crypto';

interface ScrapingConfig {
  maxPages: number;
  maxDepth: number;
  respectRobots: boolean;
  delayBetweenRequests: number;
  maxRetries: number;
  timeout: number;
}

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    ogTags: Record<string, string>;
    jsonLd: any[];
    images: Array<{
      src: string;
      alt: string;
      title?: string;
    }>;
    links: Array<{
      href: string;
      text: string;
      type: 'internal' | 'external' | 'social';
    }>;
  };
  extractedData: {
    phoneNumbers: string[];
    emailAddresses: string[];
    socialMediaHandles: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      tiktok?: string;
    };
    businessInfo: {
      name?: string;
      address?: string;
      hours?: string;
      services?: string[];
      products?: Array<{
        name: string;
        price?: string;
        description?: string;
      }>;
    };
  };
  performance: {
    loadTime: number;
    contentLength: number;
    imageCount: number;
    linkCount: number;
  };
}

interface ComprehensiveBrandData {
  website: {
    pages: ScrapedPage[];
    sitemap?: string[];
    robotsTxt?: string;
    technicalInfo: {
      cms?: string;
      technologies: string[];
      performance: {
        averageLoadTime: number;
        totalPages: number;
        totalImages: number;
      };
    };
  };
  socialMedia: {
    handles: Record<string, string>;
    discoveredProfiles: Array<{
      platform: string;
      username: string;
      url: string;
      verified?: boolean;
    }>;
  };
  brandAssets: {
    logos: string[];
    colors: string[];
    fonts: string[];
    images: Array<{
      url: string;
      type: 'logo' | 'hero' | 'product' | 'team' | 'other';
      alt?: string;
    }>;
  };
  businessIntelligence: {
    industry: string;
    businessType: string;
    targetAudience: string[];
    competitiveAdvantages: string[];
    keyMessages: string[];
    contentThemes: string[];
  };
}

export class EnhancedWebScraper {
  private config: ScrapingConfig;
  private userAgents: string[];
  private visitedUrls: Set<string>;
  private requestQueue: Array<{ url: string; depth: number }>;

  constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = {
      maxPages: 50,
      maxDepth: 3,
      respectRobots: true,
      delayBetweenRequests: 1000,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];

    this.visitedUrls = new Set();
    this.requestQueue = [];
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, retries: number = this.config.maxRetries): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        if (response.status === 429) {
          // Rate limited - exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
          console.log(`⏳ Rate limited, waiting ${backoffDelay}ms before retry ${attempt}/${retries}`);
          await this.delay(backoffDelay);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        console.log(`❌ Attempt ${attempt}/${retries} failed for ${url}:`, error.message);

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff for retries
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.delay(backoffDelay);
      }
    }

    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  private extractMetadata($: cheerio.CheerioAPI): ScrapedPage['metadata'] {
    const metadata: ScrapedPage['metadata'] = {
      ogTags: {},
      jsonLd: [],
      images: [],
      links: []
    };

    // Extract meta description
    metadata.description = $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content');

    // Extract keywords
    const keywordsContent = $('meta[name="keywords"]').attr('content');
    metadata.keywords = keywordsContent ? keywordsContent.split(',').map(k => k.trim()) : [];

    // Extract Open Graph tags
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        metadata.ogTags[property] = content;
      }
    });

    // Extract JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || '');
        metadata.jsonLd.push(jsonData);
      } catch (error) {
        // Ignore invalid JSON-LD
      }
    });

    // Extract images with metadata
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const title = $(el).attr('title');

      if (src) {
        metadata.images.push({
          src: this.resolveUrl(src, ''),
          alt,
          title
        });
      }
    });

    // Extract links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      if (href && text) {
        const type = this.classifyLink(href);
        metadata.links.push({
          href: this.resolveUrl(href, ''),
          text,
          type
        });
      }
    });

    return metadata;
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  private classifyLink(href: string): 'internal' | 'external' | 'social' {
    const socialDomains = [
      'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
      'youtube.com', 'tiktok.com', 'pinterest.com', 'snapchat.com'
    ];

    const lowerHref = href.toLowerCase();

    if (socialDomains.some(domain => lowerHref.includes(domain))) {
      return 'social';
    }

    if (href.startsWith('http') && !href.includes(window?.location?.hostname || '')) {
      return 'external';
    }

    return 'internal';
  }

  async scrapeComprehensively(startUrl: string): Promise<ComprehensiveBrandData> {
    console.log(`🚀 Starting comprehensive brand analysis for: ${startUrl}`);

    this.visitedUrls.clear();
    this.requestQueue = [{ url: startUrl, depth: 0 }];

    const scrapedPages: ScrapedPage[] = [];
    const socialHandles: Record<string, string> = {};
    const brandAssets = {
      logos: [] as string[],
      colors: [] as string[],
      fonts: [] as string[],
      images: [] as Array<{ url: string; type: string; alt?: string }>
    };

    while (this.requestQueue.length > 0 && scrapedPages.length < this.config.maxPages) {
      const { url, depth } = this.requestQueue.shift()!;

      if (this.visitedUrls.has(url) || depth > this.config.maxDepth) {
        continue;
      }

      try {
        console.log(`🔍 Scraping page ${scrapedPages.length + 1}/${this.config.maxPages}: ${url}`);

        const startTime = Date.now();
        const response = await this.fetchWithRetry(url);
        const html = await response.text();
        const loadTime = Date.now() - startTime;

        const $ = cheerio.load(html);

        // Extract page data
        const pageData = await this.extractPageData($, url, html, loadTime);
        scrapedPages.push(pageData);

        // Collect social media handles
        Object.assign(socialHandles, pageData.extractedData.socialMediaHandles);

        // Collect brand assets
        this.collectBrandAssets($, brandAssets, url);

        // Add internal links to queue for further crawling
        if (depth < this.config.maxDepth) {
          pageData.metadata.links
            .filter(link => link.type === 'internal')
            .slice(0, 10) // Limit links per page
            .forEach(link => {
              if (!this.visitedUrls.has(link.href)) {
                this.requestQueue.push({ url: link.href, depth: depth + 1 });
              }
            });
        }

        this.visitedUrls.add(url);

        // Respectful delay between requests
        await this.delay(this.config.delayBetweenRequests);

      } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error.message);
        continue;
      }
    }

    console.log(`✅ Completed scraping ${scrapedPages.length} pages`);

    return this.compileBrandData(scrapedPages, socialHandles, brandAssets);
  }

  private async extractPageData(
    $: cheerio.CheerioAPI,
    url: string,
    html: string,
    loadTime: number
  ): Promise<ScrapedPage> {
    const title = $('title').text().trim() || '';

    // Clean content extraction
    $('script, style, nav, footer, header, .cookie-banner, .popup, .modal').remove();
    const content = $('body').text().replace(/\s+/g, ' ').trim();

    // Extract structured data
    const extractedData = {
      phoneNumbers: this.extractPhoneNumbers(html),
      emailAddresses: this.extractEmailAddresses(html),
      socialMediaHandles: this.extractSocialMediaHandles($),
      businessInfo: this.extractBusinessInfo($, content)
    };

    return {
      url,
      title,
      content,
      metadata: this.extractMetadata($),
      extractedData,
      performance: {
        loadTime,
        contentLength: content.length,
        imageCount: $('img').length,
        linkCount: $('a').length
      }
    };
  }

  private extractPhoneNumbers(html: string): string[] {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const matches = html.match(phoneRegex) || [];
    return [...new Set(matches)].slice(0, 5); // Dedupe and limit
  }

  private extractEmailAddresses(html: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = html.match(emailRegex) || [];
    return [...new Set(matches)].slice(0, 5); // Dedupe and limit
  }

  private extractSocialMediaHandles($: cheerio.CheerioAPI): Record<string, string> {
    const handles: Record<string, string> = {};

    const socialPatterns = {
      instagram: /(?:instagram\.com\/|@)([a-zA-Z0-9_.]+)/i,
      facebook: /(?:facebook\.com\/|fb\.com\/)([a-zA-Z0-9_.]+)/i,
      twitter: /(?:twitter\.com\/|@)([a-zA-Z0-9_]+)/i,
      linkedin: /(?:linkedin\.com\/(?:in|company)\/?)([a-zA-Z0-9-]+)/i,
      youtube: /(?:youtube\.com\/(?:c\/|channel\/|user\/)?@?)([a-zA-Z0-9_-]+)/i,
      tiktok: /(?:tiktok\.com\/@?)([a-zA-Z0-9_.]+)/i
    };

    $('a[href*="instagram"], a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="youtube"], a[href*="tiktok"]').each((_, el) => {
      const href = $(el).attr('href') || '';

      for (const [platform, pattern] of Object.entries(socialPatterns)) {
        const match = href.match(pattern);
        if (match && match[1] && !handles[platform]) {
          handles[platform] = match[1];
        }
      }
    });

    return handles;
  }

  private extractBusinessInfo($: cheerio.CheerioAPI, content: string): ScrapedPage['extractedData']['businessInfo'] {
    // Extract business name from various sources
    const name = $('h1').first().text().trim() ||
      $('[class*="company"], [class*="business"], [class*="brand"]').first().text().trim() ||
      $('title').text().split('|')[0].trim();

    // Extract services from common patterns
    const services: string[] = [];
    $('[class*="service"], [class*="offering"], .services li, .offerings li').each((_, el) => {
      const service = $(el).text().trim();
      if (service && service.length > 3 && service.length < 100) {
        services.push(service);
      }
    });

    // Extract products with pricing
    const products: Array<{ name: string; price?: string; description?: string }> = [];
    $('[class*="product"], [class*="item"], .products .item, .shop .item').each((_, el) => {
      const name = $(el).find('h1, h2, h3, h4, .title, .name').first().text().trim();
      const priceEl = $(el).find('[class*="price"], .cost, .amount');
      const price = priceEl.text().match(/[\$£€¥₹]\s*[\d,]+(?:\.\d{2})?/)?.[0];
      const description = $(el).find('p, .description, .desc').first().text().trim();

      if (name && name.length > 2) {
        products.push({
          name,
          price,
          description: description.length > 10 ? description.substring(0, 200) : undefined
        });
      }
    });

    // Extract address
    const addressSelectors = [
      '[class*="address"]', '[class*="location"]', '.contact-info address',
      '[itemtype*="PostalAddress"]', '.footer address'
    ];

    let address = '';
    for (const selector of addressSelectors) {
      address = $(selector).first().text().trim();
      if (address && address.length > 10) break;
    }

    // Extract business hours
    const hoursSelectors = [
      '[class*="hours"]', '[class*="schedule"]', '.opening-hours', '.business-hours'
    ];

    let hours = '';
    for (const selector of hoursSelectors) {
      hours = $(selector).first().text().trim();
      if (hours && hours.length > 5) break;
    }

    return {
      name: name || undefined,
      address: address || undefined,
      hours: hours || undefined,
      services: services.slice(0, 20),
      products: products.slice(0, 50)
    };
  }

  private collectBrandAssets($: cheerio.CheerioAPI, brandAssets: any, baseUrl: string): void {
    // Collect logos
    $('img[class*="logo"], img[alt*="logo"], .logo img, header img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        brandAssets.logos.push(this.resolveUrl(src, baseUrl));
      }
    });

    // Collect hero/banner images
    $('img[class*="hero"], img[class*="banner"], .hero img, .banner img').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      if (src) {
        brandAssets.images.push({
          url: this.resolveUrl(src, baseUrl),
          type: 'hero',
          alt
        });
      }
    });

    // Extract colors from CSS (basic implementation)
    $('style').each((_, el) => {
      const css = $(el).html() || '';
      const colorMatches = css.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)/g);
      if (colorMatches) {
        brandAssets.colors.push(...colorMatches.slice(0, 10));
      }
    });

    // Extract fonts from CSS
    $('style, link[rel="stylesheet"]').each((_, el) => {
      const content = $(el).html() || $(el).attr('href') || '';
      const fontMatches = content.match(/font-family:\s*([^;]+)/g);
      if (fontMatches) {
        brandAssets.fonts.push(...fontMatches.slice(0, 5));
      }
    });
  }

  private compileBrandData(
    pages: ScrapedPage[],
    socialHandles: Record<string, string>,
    brandAssets: any
  ): ComprehensiveBrandData {
    // Aggregate all content for analysis
    const allContent = pages.map(p => p.content).join(' ');
    const allServices = pages.flatMap(p => p.extractedData.businessInfo.services || []);
    const allProducts = pages.flatMap(p => p.extractedData.businessInfo.products || []);

    // Determine business type and industry
    const businessType = this.inferBusinessType(allContent, allServices);
    const industry = this.inferIndustry(allContent, allServices);

    return {
      website: {
        pages,
        technicalInfo: {
          technologies: this.detectTechnologies(pages),
          performance: {
            averageLoadTime: pages.reduce((sum, p) => sum + p.performance.loadTime, 0) / pages.length,
            totalPages: pages.length,
            totalImages: pages.reduce((sum, p) => sum + p.performance.imageCount, 0)
          }
        }
      },
      socialMedia: {
        handles: socialHandles,
        discoveredProfiles: Object.entries(socialHandles).map(([platform, username]) => ({
          platform,
          username,
          url: this.buildSocialUrl(platform, username)
        }))
      },
      brandAssets: {
        logos: [...new Set(brandAssets.logos)],
        colors: [...new Set(brandAssets.colors)],
        fonts: [...new Set(brandAssets.fonts)],
        images: brandAssets.images
      },
      businessIntelligence: {
        industry,
        businessType,
        targetAudience: this.inferTargetAudience(allContent),
        competitiveAdvantages: this.extractCompetitiveAdvantages(allContent),
        keyMessages: this.extractKeyMessages(allContent),
        contentThemes: this.extractContentThemes(allContent)
      }
    };
  }

  private inferBusinessType(content: string, services: string[]): string {
    const businessKeywords = {
      'restaurant': ['restaurant', 'food', 'dining', 'menu', 'cuisine'],
      'retail': ['shop', 'store', 'buy', 'product', 'sale'],
      'healthcare': ['health', 'medical', 'doctor', 'clinic', 'treatment'],
      'technology': ['software', 'tech', 'digital', 'app', 'platform'],
      'finance': ['financial', 'bank', 'investment', 'money', 'loan'],
      'education': ['school', 'education', 'learning', 'course', 'training'],
      'consulting': ['consulting', 'advisory', 'strategy', 'expert', 'professional']
    };

    const contentLower = content.toLowerCase();
    const servicesLower = services.join(' ').toLowerCase();
    const combinedText = `${contentLower} ${servicesLower}`;

    let bestMatch = 'business';
    let maxScore = 0;

    for (const [type, keywords] of Object.entries(businessKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        const matches = (combinedText.match(new RegExp(keyword, 'g')) || []).length;
        return sum + matches;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = type;
      }
    }

    return bestMatch;
  }

  private inferIndustry(content: string, services: string[]): string {
    // Similar to business type but more specific
    return this.inferBusinessType(content, services);
  }

  private inferTargetAudience(content: string): string[] {
    const audienceKeywords = {
      'small business': ['small business', 'entrepreneur', 'startup'],
      'enterprise': ['enterprise', 'corporation', 'large business'],
      'consumers': ['customer', 'client', 'individual', 'personal'],
      'professionals': ['professional', 'expert', 'specialist']
    };

    const contentLower = content.toLowerCase();
    const audiences: string[] = [];

    for (const [audience, keywords] of Object.entries(audienceKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (contentLower.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > 0) {
        audiences.push(audience);
      }
    }

    return audiences.length > 0 ? audiences : ['general'];
  }

  private extractCompetitiveAdvantages(content: string): string[] {
    const advantageKeywords = [
      'best', 'leading', 'top', 'premium', 'quality', 'expert', 'experienced',
      'fast', 'quick', 'instant', 'reliable', 'trusted', 'secure', 'affordable'
    ];

    const advantages: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const hasAdvantageKeyword = advantageKeywords.some(keyword =>
        sentenceLower.includes(keyword)
      );

      if (hasAdvantageKeyword && sentence.length > 20 && sentence.length < 200) {
        advantages.push(sentence.trim());
      }
    }

    return advantages.slice(0, 10);
  }

  private extractKeyMessages(content: string): string[] {
    // Extract sentences that appear to be key messages
    const sentences = content.split(/[.!?]+/);
    const keyMessages: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 30 && trimmed.length < 150) {
        // Simple heuristic: sentences with action words or value propositions
        if (/\b(we|our|your|get|achieve|improve|save|grow|success)\b/i.test(trimmed)) {
          keyMessages.push(trimmed);
        }
      }
    }

    return keyMessages.slice(0, 15);
  }

  private extractContentThemes(content: string): string[] {
    const themeKeywords = {
      'innovation': ['innovation', 'innovative', 'cutting-edge', 'advanced'],
      'quality': ['quality', 'premium', 'excellence', 'superior'],
      'service': ['service', 'support', 'help', 'assistance'],
      'trust': ['trust', 'reliable', 'dependable', 'secure'],
      'growth': ['growth', 'success', 'achieve', 'improve']
    };

    const contentLower = content.toLowerCase();
    const themes: string[] = [];

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (contentLower.split(keyword).length - 1);
      }, 0);

      if (score > 2) {
        themes.push(theme);
      }
    }

    return themes;
  }

  private detectTechnologies(pages: ScrapedPage[]): string[] {
    const technologies: string[] = [];

    for (const page of pages) {
      // Check for common CMS/framework indicators in content
      const content = page.content.toLowerCase();

      if (content.includes('wordpress') || content.includes('wp-content')) {
        technologies.push('WordPress');
      }
      if (content.includes('shopify')) {
        technologies.push('Shopify');
      }
      if (content.includes('wix')) {
        technologies.push('Wix');
      }
      if (content.includes('squarespace')) {
        technologies.push('Squarespace');
      }
    }

    return [...new Set(technologies)];
  }

  private buildSocialUrl(platform: string, username: string): string {
    const baseUrls = {
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      twitter: 'https://twitter.com/',
      linkedin: 'https://linkedin.com/company/',
      youtube: 'https://youtube.com/@',
      tiktok: 'https://tiktok.com/@'
    };

    return `${baseUrls[platform] || ''}${username}`;
  }
}
