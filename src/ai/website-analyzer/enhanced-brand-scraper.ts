/**
 * Enhanced Brand Website Scraper for Brand Creation
 * 
 * Clean, working version that dramatically improves service identification
 * and data collection for brand creation
 */

import * as cheerio from 'cheerio';

interface EnhancedScrapingResult {
  // Basic Information
  title: string;
  metaDescription: string;
  businessType: string;
  
  // Enhanced Content Sections
  aboutSection: string;
  servicesSection: string;
  detailedServicesContent: string;
  contactSection: string;
  
  // Multi-page Data
  keyPages: KeyPageInfo[];
  aggregatedServices: ServiceDetail[];
  
  // Contact Information
  phoneNumbers: string[];
  emailAddresses: string[];
  socialMediaLinks: { [key: string]: string[] };
  addresses: string[];
  
  // Business Intelligence
  competitiveAdvantages: string[];
  contentThemes: string[];
  targetAudience: string;
  
  // Additional Business Data
  pricingInfo: string[];
  teamInfo: string[];
  testimonials: string[];
  businessHours: string[];
  certifications: string[];
  companyStats: string[];
  industryKeywords: string[];
  
  // Quality Metrics
  dataCompleteness: number;
  pagesAnalyzed: number;
}

interface KeyPageInfo {
  url: string;
  type: 'homepage' | 'about' | 'services' | 'contact' | 'pricing' | 'team';
  title: string;
  priority: number;
}

interface ServiceDetail {
  name: string;
  description: string;
  features: string[];
  category?: string;
}

export class EnhancedBrandScraper {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private maxPages = 4;
  private crawlDelay = 800;
  private visitedUrls = new Set<string>();

  async scrapeForBrandCreation(url: string): Promise<EnhancedScrapingResult> {
    console.log(`🔍 Starting enhanced brand scraping for: ${url}`);
    this.visitedUrls.clear();

    try {
      // Step 1: Scrape homepage
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      this.visitedUrls.add(url);

      // Step 2: Enhanced business type classification
      const businessType = this.classifyBusinessType($, url);
      console.log(`🏢 Business classified as: ${businessType}`);

      // Step 3: Discover key pages
      const keyPages = this.discoverBrandPages($, url);
      console.log(`📄 Found ${keyPages.length} key pages`);

      // Step 4: Crawl key pages (limited for performance)
      const multiPageData = await this.crawlKeyPages(keyPages.slice(0, 3));

      // Step 5: Extract comprehensive data
      const result: EnhancedScrapingResult = {
        title: $('title').text().trim(),
        metaDescription: $('meta[name="description"]').attr('content') || '',
        businessType,
        
        aboutSection: this.extractSection($, ['about', 'who we are', 'our story', 'company', 'history']),
        servicesSection: this.extractSection($, ['services', 'what we do', 'solutions', 'offerings']),
        detailedServicesContent: this.extractServices($),
        contactSection: this.extractSection($, ['contact', 'get in touch', 'reach us']),
        
        keyPages,
        aggregatedServices: this.extractAllServices($, multiPageData),
        
        phoneNumbers: this.extractPhoneNumbers($),
        emailAddresses: this.extractEmailAddresses($),
        socialMediaLinks: this.extractSocialMedia($),
        addresses: this.extractAddresses($),
        
        competitiveAdvantages: this.extractAdvantages($),
        contentThemes: this.extractThemes($),
        targetAudience: this.extractTargetAudience($),
        
        pricingInfo: this.extractPricing($),
        teamInfo: this.extractTeam($),
        testimonials: this.extractTestimonials($),
        businessHours: this.extractHours($),
        certifications: this.extractCertifications($),
        companyStats: this.extractStats($),
        industryKeywords: this.extractKeywords($),
        
        dataCompleteness: this.calculateCompleteness($),
        pagesAnalyzed: this.visitedUrls.size
      };

      console.log(`✅ Enhanced scraping complete - ${result.dataCompleteness}% completeness`);
      return result;

    } catch (error) {
      console.error(`❌ Enhanced scraping failed:`, error);
      throw error;
    }
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  }

  private classifyBusinessType($: cheerio.CheerioAPI, url: string): string {
    const text = $('body').text().toLowerCase();
    const title = $('title').text().toLowerCase();
    const metaDescription = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
    
    const businessTypes = {
      'saas': {
        keywords: ['saas', 'software as a service', 'api', 'dashboard', 'automation', 'subscription'],
        strongIndicators: ['pricing plans', 'free trial', 'integrations', 'admin dashboard'],
        domains: ['mailchimp', 'slack', 'hubspot', 'salesforce'],
        exclusions: ['restaurant', 'food', 'menu'],
        weight: 4
      },
      'ecommerce': {
        keywords: ['shop', 'store', 'buy', 'cart', 'products', 'catalog'],
        strongIndicators: ['add to cart', 'free shipping', 'product pages'],
        domains: ['shopify', 'amazon', 'etsy'],
        exclusions: ['saas', 'software'],
        weight: 4
      },
      'restaurant': {
        keywords: ['restaurant', 'cafe', 'food', 'menu', 'dining'],
        strongIndicators: ['book table', 'delivery', 'reservations'],
        domains: ['opentable', 'grubhub'],
        exclusions: ['saas', 'software', 'api'],
        weight: 4
      }
    };

    let scores: Record<string, number> = {};
    Object.keys(businessTypes).forEach(type => scores[type] = 0);

    const combinedText = `${title} ${title} ${metaDescription} ${text}`;
    const domain = url.toLowerCase();

    for (const [type, config] of Object.entries(businessTypes)) {
      let score = 0;

      // Domain matching (15 points)
      if (config.domains.some(d => domain.includes(d))) score += 15;

      // Strong indicators (5 points each)
      score += config.strongIndicators.filter(indicator => 
        combinedText.includes(indicator)
      ).length * 5;

      // Keywords (weighted)
      score += config.keywords.filter(keyword => 
        combinedText.includes(keyword)
      ).length * config.weight;

      // Exclusion penalties (-3 points each)
      score -= config.exclusions.filter(exclusion => 
        combinedText.includes(exclusion)
      ).length * 3;

      scores[type] = Math.max(0, score);
    }

    const winner = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score >= 5)[0];

    return winner ? winner[0] : 'general business';
  }

  private discoverBrandPages($: cheerio.CheerioAPI, baseUrl: string): KeyPageInfo[] {
    const pages: KeyPageInfo[] = [
      { url: baseUrl, type: 'homepage', title: 'Homepage', priority: 1 }
    ];

    const patterns = {
      'about': ['about', 'who we are', 'our story'],
      'services': ['services', 'what we do', 'solutions'],
      'contact': ['contact', 'get in touch'],
      'pricing': ['pricing', 'plans', 'packages']
    };

    $('nav a, .nav a, .navbar a, .menu a').each((_, el) => {
      const text = $(el).text().toLowerCase().trim();
      const href = $(el).attr('href');
      
      if (href) {
        for (const [type, keywords] of Object.entries(patterns)) {
          if (keywords.some(keyword => text.includes(keyword))) {
            const fullUrl = new URL(href, baseUrl).href;
            pages.push({
              url: fullUrl,
              type: type as any,
              title: text,
              priority: this.getPagePriority(type)
            });
            break;
          }
        }
      }
    });

    return pages.sort((a, b) => a.priority - b.priority);
  }

  private getPagePriority(pageType: string): number {
    const priorities = { 'homepage': 1, 'about': 2, 'services': 3, 'contact': 4, 'pricing': 5 };
    return priorities[pageType as keyof typeof priorities] || 9;
  }

  private async crawlKeyPages(pages: KeyPageInfo[]): Promise<any[]> {
    const results = [];

    for (const page of pages) {
      if (this.visitedUrls.has(page.url)) continue;

      try {
        await new Promise(resolve => setTimeout(resolve, this.crawlDelay));
        const html = await this.fetchPage(page.url);
        const $ = cheerio.load(html);
        
        results.push({
          page,
          content: $('body').text().substring(0, 2000)
        });

        this.visitedUrls.add(page.url);
        console.log(`📄 Crawled: ${page.type} page`);

      } catch (error) {
        console.warn(`⚠️ Failed to crawl ${page.type} page:`, error);
      }
    }

    return results;
  }

  private extractSection($: cheerio.CheerioAPI, keywords: string[]): string {
    let content = '';
    
    keywords.forEach(keyword => {
      // Look for sections containing the keyword
      $('section, div, article').each((_, el) => {
        const text = $(el).text().toLowerCase();
        const classes = $(el).attr('class')?.toLowerCase() || '';
        const id = $(el).attr('id')?.toLowerCase() || '';
        
        if (text.includes(keyword) || classes.includes(keyword) || id.includes(keyword)) {
          const elementText = $(el).text().trim();
          if (elementText.length > 50) {
            content += elementText + '\n\n';
          }
        }
      });
    });

    return content.substring(0, 2000);
  }

  private extractServices($: cheerio.CheerioAPI): string {
    let services = '';
    
    // 1. Service-specific selectors
    const serviceSelectors = [
      '.service', '.services', '.offering', '.solution', '.product', '.package',
      '[class*="service"]', '[class*="product"]', '[class*="offering"]',
      '.specialty', '.expertise', '.capability', '.treatment', '.procedure'
    ];

    serviceSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          services += text + '\n\n';
        }
      });
    });

    // 2. Extract from headings with service content
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const heading = $(el).text().toLowerCase();
      if (heading.includes('service') || heading.includes('what we do') || 
          heading.includes('solution') || heading.includes('offering')) {
        
        let nextContent = '';
        $(el).nextUntil('h1, h2, h3, h4, h5, h6').each((_, nextEl) => {
          nextContent += $(nextEl).text().trim() + ' ';
        });
        
        if (nextContent.length > 50) {
          services += `${$(el).text().trim()}: ${nextContent}\n\n`;
        }
      }
    });

    // 3. Extract from lists
    $('ul, ol').each((_, listEl) => {
      const listText = $(listEl).text().toLowerCase();
      if (listText.includes('service') || listText.includes('offer') || 
          listText.includes('provide') || listText.includes('specialize')) {
        
        $(listEl).find('li').each((_, liEl) => {
          const itemText = $(liEl).text().trim();
          if (itemText.length > 15) {
            services += `• ${itemText}\n`;
          }
        });
        services += '\n';
      }
    });

    return services.substring(0, 3000);
  }

  private extractAllServices($: cheerio.CheerioAPI, multiPageData: any[]): ServiceDetail[] {
    const services: ServiceDetail[] = [];
    
    // Extract from homepage
    this.extractServiceDetails($).forEach(service => {
      services.push(service);
    });

    // Extract from other pages
    multiPageData.forEach(pageData => {
      const pageServices = this.extractServiceDetails(cheerio.load(pageData.content || ''));
      pageServices.forEach(service => {
        if (!services.find(s => s.name.toLowerCase().includes(service.name.toLowerCase().substring(0, 10)))) {
          services.push(service);
        }
      });
    });

    return services.slice(0, 30);
  }

  private extractServiceDetails($: cheerio.CheerioAPI): ServiceDetail[] {
    const services: ServiceDetail[] = [];
    
    // From service cards/sections
    $('.service, .services, .product, .offering, .solution, .package').each((_, el) => {
      const name = $(el).find('h1, h2, h3, h4, .title, .name').first().text().trim();
      const description = $(el).find('p, .description, .summary').first().text().trim();
      const features = $(el).find('li').map((_, li) => $(li).text().trim()).get();
      
      if (name && name.length > 3) {
        services.push({ 
          name, 
          description: description.substring(0, 200), 
          features: features.slice(0, 5) 
        });
      }
    });

    // From lists
    $('ul, ol').each((_, listEl) => {
      $(listEl).find('li').each((_, liEl) => {
        const text = $(liEl).text().trim();
        if (text.length > 10 && text.length < 150) {
          const colonIndex = text.indexOf(':');
          if (colonIndex > 0) {
            services.push({
              name: text.substring(0, colonIndex).trim(),
              description: text.substring(colonIndex + 1).trim(),
              features: []
            });
          } else {
            // Check if it looks like a service
            const serviceWords = ['consulting', 'design', 'development', 'marketing', 'support', 'training'];
            if (serviceWords.some(word => text.toLowerCase().includes(word))) {
              services.push({
                name: text,
                description: '',
                features: []
              });
            }
          }
        }
      });
    });

    return services;
  }

  private extractPhoneNumbers($: cheerio.CheerioAPI): string[] {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const text = $('body').text();
    const matches = text.match(phoneRegex) || [];
    
    // Also check tel: links
    const telLinks: string[] = [];
    $('a[href^="tel:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        telLinks.push(href.replace('tel:', '').trim());
      }
    });
    
    const allPhones = [...matches, ...telLinks];
    return Array.from(new Set(allPhones.filter(phone => 
      phone.length > 7 && !phone.includes('555-555')
    )));
  }

  private extractEmailAddresses($: cheerio.CheerioAPI): string[] {
    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const text = $('body').text();
    const matches = text.match(emailRegex) || [];
    
    // Also check mailto: links
    const mailtoLinks: string[] = [];
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim();
        if (email.includes('@')) mailtoLinks.push(email);
      }
    });
    
    const allEmails = [...matches, ...mailtoLinks];
    return Array.from(new Set(allEmails.filter(email => 
      !email.includes('example.com') && email.length < 50
    )));
  }

  private extractSocialMedia($: cheerio.CheerioAPI): { [key: string]: string[] } {
    const social = { facebook: [], instagram: [], twitter: [], linkedin: [], youtube: [] };
    
    $('a[href*="facebook"], a[href*="instagram"], a[href*="twitter"], a[href*="linkedin"], a[href*="youtube"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        if (href.includes('facebook.com')) social.facebook.push(href);
        if (href.includes('instagram.com')) social.instagram.push(href);
        if (href.includes('twitter.com')) social.twitter.push(href);
        if (href.includes('linkedin.com')) social.linkedin.push(href);
        if (href.includes('youtube.com')) social.youtube.push(href);
      }
    });

    return social;
  }

  private extractAddresses($: cheerio.CheerioAPI): string[] {
    const addresses: string[] = [];
    
    $('.address, .location, [class*="address"], [class*="location"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 15 && text.length < 200) {
        addresses.push(text);
      }
    });

    return Array.from(new Set(addresses));
  }

  private extractAdvantages($: cheerio.CheerioAPI): string[] {
    const advantages: string[] = [];
    const keywords = ['why choose', 'advantage', 'benefit', 'unique', 'award', 'certified', 'trusted'];
    
    keywords.forEach(keyword => {
      $(`*:contains("${keyword}")`).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30 && text.length < 300) {
          advantages.push(text);
        }
      });
    });

    return Array.from(new Set(advantages)).slice(0, 10);
  }

  private extractThemes($: cheerio.CheerioAPI): string[] {
    const themes: string[] = [];
    const keywords = ['quality', 'innovation', 'service', 'excellence', 'trust', 'professional'];
    
    const bodyText = $('body').text().toLowerCase();
    keywords.forEach(keyword => {
      if (bodyText.includes(keyword)) {
        themes.push(keyword);
      }
    });

    return Array.from(new Set(themes));
  }

  private extractTargetAudience($: cheerio.CheerioAPI): string {
    const keywords = ['for', 'perfect for', 'ideal for', 'designed for'];
    
    for (const keyword of keywords) {
      const match = $(`*:contains("${keyword}")`).first().text();
      if (match && match.length > 10) {
        return match.substring(0, 200);
      }
    }

    return 'General business customers';
  }

  private extractPricing($: cheerio.CheerioAPI): string[] {
    const pricing: string[] = [];
    
    $('.price, .pricing, [class*="price"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.match(/\$|€|£/) && text.length < 100) {
        pricing.push(text);
      }
    });

    return Array.from(new Set(pricing));
  }

  private extractTeam($: cheerio.CheerioAPI): string[] {
    const team: string[] = [];
    
    $('.team, .staff, [class*="team"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20 && text.length < 200) {
        team.push(text);
      }
    });

    return team;
  }

  private extractTestimonials($: cheerio.CheerioAPI): string[] {
    const testimonials: string[] = [];
    
    $('.testimonial, .review, [class*="testimonial"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 30) {
        testimonials.push(text.substring(0, 200));
      }
    });

    return testimonials;
  }

  private extractHours($: cheerio.CheerioAPI): string[] {
    const hours: string[] = [];
    
    $('.hours, [class*="hours"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.match(/\d+:\d+|am|pm|monday|tuesday/i)) {
        hours.push(text);
      }
    });

    return Array.from(new Set(hours));
  }

  private extractCertifications($: cheerio.CheerioAPI): string[] {
    const certs: string[] = [];
    const keywords = ['certified', 'accredited', 'licensed', 'award'];
    
    keywords.forEach(keyword => {
      $(`*:contains("${keyword}")`).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 10 && text.length < 150) {
          certs.push(text);
        }
      });
    });

    return Array.from(new Set(certs)).slice(0, 5);
  }

  private extractStats($: cheerio.CheerioAPI): string[] {
    const stats: string[] = [];
    const text = $('body').text();
    
    const patterns = [
      /\d+\+?\s*(years?|customers?|clients?|projects?)/gi,
      /over\s+\d+/gi,
      /\d+%\s*(satisfaction|success)/gi
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      stats.push(...matches);
    });

    return Array.from(new Set(stats));
  }

  private extractKeywords($: cheerio.CheerioAPI): string[] {
    const keywords: string[] = [];
    
    // From meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      keywords.push(...metaKeywords.split(',').map(k => k.trim()));
    }

    // From headings
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 5 && text.length < 50) {
        keywords.push(text);
      }
    });

    return Array.from(new Set(keywords)).slice(0, 20);
  }

  private calculateCompleteness($: cheerio.CheerioAPI): number {
    const checks = [
      $('title').text().length > 0,
      $('meta[name="description"]').attr('content')?.length > 0,
      $('h1').length > 0,
      $('p').length > 3,
      this.extractPhoneNumbers($).length > 0,
      this.extractEmailAddresses($).length > 0,
      this.extractAddresses($).length > 0,
      this.extractAdvantages($).length > 0
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
}

export type { EnhancedScrapingResult, KeyPageInfo, ServiceDetail };
