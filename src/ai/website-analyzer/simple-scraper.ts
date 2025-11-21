/**
 * Simplified Website Scraper
 * Uses basic fetch instead of Playwright for immediate compatibility
 */

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
    products: Array<{
      name: string;
      price?: string;
      category?: string;
      inStock?: boolean;
      description?: string;
    }>;
    contactInfo: {
      phone?: string;
      email?: string;
      address?: string;
    };
    socialMedia: Array<{
      platform: string;
      url: string;
    }>;
  };

  // Media Assets
  mediaAssets: {
    images: Array<{
      url: string;
      alt: string;
      type: 'logo' | 'product' | 'banner' | 'other';
    }>;
    logos: string[];
  };

  // Technical Analysis
  technicalAnalysis: {
    technologies: string[];
    performance: {
      loadTime: number;
      pageSize: number;
      requests: number;
      lighthouse: any;
    };
    seo: {
      metaTags: Record<string, string>;
      structuredData: any[];
      headingStructure: string[];
      internalLinks: number;
      externalLinks: number;
    };
    accessibility: {
      hasAltTags: boolean;
      hasAriaLabels: boolean;
      colorContrast: string;
      keyboardNavigation: boolean;
    };
  };

  // Competitive Intelligence
  competitiveIntel: {
    uniqueSellingPoints: string[];
    competitorMentions: string[];
    marketPosition: string;
    pricingStrategy: string;
  };
}

export class SimplifiedWebsiteScraper {
  async analyzeWebsiteComprehensively(url: string): Promise<ComprehensiveAnalysis> {
    console.log(`🔍 Starting simplified analysis of: ${url}`);

    let html = '';
    let fetchSuccess = false;

    // Strategy 1: Direct fetch with retry
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries && !fetchSuccess; attempt++) {
      try {
        console.log(`🌐 [Strategy 1 - Attempt ${attempt}/${maxRetries}] Direct fetch: ${url}`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          html = await response.text();
          console.log(`✅ Direct fetch successful (${html.length} bytes)`);
          fetchSuccess = true;
          break;
        } else {
          console.warn(`⚠️ Direct fetch attempt ${attempt} failed: ${response.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ Direct fetch attempt ${attempt} error:`, error instanceof Error ? error.message : error);
      }

      if (!fetchSuccess && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Strategy 2: Try CORS proxy
    if (!fetchSuccess) {
      try {
        console.log('🌐 [Strategy 2] Trying CORS proxy...');
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const proxyResponse = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(10000)
        });

        if (proxyResponse.ok) {
          html = await proxyResponse.text();
          console.log(`✅ CORS proxy successful (${html.length} bytes)`);
          fetchSuccess = true;
        }
      } catch (error) {
        console.warn('⚠️ CORS proxy failed:', error instanceof Error ? error.message : error);
      }
    }

    // Strategy 3: Parse HTML if we got any content
    if (fetchSuccess && html) {
      const analysis = this.parseHTMLContent(html, url);
      console.log(`✅ Simplified analysis complete for: ${url}`);
      return analysis;
    }

    // All strategies failed, return fallback
    console.warn(`⚠️ All fetch strategies failed for ${url}, using fallback analysis`);
    return this.createFallbackAnalysis(url);
  }

  private parseHTMLContent(html: string, url: string): ComprehensiveAnalysis {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Website';

    // Extract meta description with better fallback
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    let description = descMatch ? descMatch[1].trim() : '';

    // If no meta description, try to extract from first paragraph or heading
    if (!description) {
      const firstParagraph = html.match(/<p[^>]*>([^<]{50,300})<\/p>/i);
      if (firstParagraph) {
        description = firstParagraph[1].trim().replace(/<[^>]*>/g, '');
      } else {
        // Last resort: use title as description
        description = `${title} - Business website`;
      }
    }

    // Extract keywords
    const keywordsMatch = html.match(/<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];

    // Extract phone numbers (filter out example/placeholder numbers and product IDs)
    // More specific phone regex to avoid matching product IDs and long digit strings
    const phoneRegex = /(?:tel:|phone:|call:|contact:)?\s*(\+?\d{1,4}[\s\-\(\)]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9})/gi;
    const phoneMatches = html.match(phoneRegex) || [];
    const examplePhonePatterns = [
      '555-',  // US example numbers
      '(555)',
      '1234 1234 1234',  // Credit card numbers
      '0000 0000 0000',
      '9999 9999 9999',
      '458) 555',  // Apple's example number
      '555-2863',
    ];
    const phones = phoneMatches
      .map(phone => phone.replace(/^(?:tel:|phone:|call:|contact:)\s*/i, '').trim())
      .filter(phone => {
        const cleaned = phone.replace(/\D/g, '');
        // Must be between 10-15 digits (valid phone number range)
        if (cleaned.length < 10 || cleaned.length > 15) return false;
        // Filter out example patterns
        const phoneStr = phone.toLowerCase();
        return !examplePhonePatterns.some(pattern => phoneStr.includes(pattern.toLowerCase()));
      })
      .slice(0, 3);

    // Extract email addresses (filter out example/placeholder emails)
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatches = html.match(emailRegex) || [];
    const exampleEmailPatterns = [
      'example.com',
      'test.com',
      'demo.com',
      'sample.com',
      'placeholder.com',
      'appleseed',  // Apple's example user
      'johndoe',
      'janedoe',
      'noreply',
      'no-reply',
    ];
    const emails = [...new Set(emailMatches)]
      .filter(email => {
        const emailLower = email.toLowerCase();
        // Filter out example patterns
        return !exampleEmailPatterns.some(pattern => emailLower.includes(pattern));
      })
      .slice(0, 3);

    // Extract images
    const imgRegex = /<img[^>]*src=["\']([^"']+)["\'][^>]*alt=["\']([^"']*)["\'][^>]*>/gi;
    const images: Array<{ url: string; alt: string; type: 'logo' | 'product' | 'banner' | 'other' }> = [];
    let imgMatch;

    while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 20) {
      const imgUrl = imgMatch[1];
      const alt = imgMatch[2] || '';

      // Determine image type
      let type: 'logo' | 'product' | 'banner' | 'other' = 'other';
      if (alt.toLowerCase().includes('logo') || imgUrl.toLowerCase().includes('logo')) {
        type = 'logo';
      } else if (alt.toLowerCase().includes('product') || imgUrl.toLowerCase().includes('product')) {
        type = 'product';
      } else if (alt.toLowerCase().includes('banner') || imgUrl.toLowerCase().includes('banner')) {
        type = 'banner';
      }

      images.push({
        url: imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, url).href,
        alt,
        type
      });
    }

    // Extract services/products from common patterns
    const services: string[] = [];
    const products: Array<{ name: string; price?: string; category?: string }> = [];

    // Look for price patterns
    const priceRegex = /[\$£€¥₹]\s*[\d,]+(?:\.\d{2})?/g;
    const priceMatches = html.match(priceRegex) || [];

    // Enhanced product detection
    const productKeywords = ['product', 'item', 'model', 'phone', 'laptop', 'computer', 'device', 'electronics'];
    const productRegex = new RegExp(`(${productKeywords.join('|')})\\s+[^<>]{5,50}`, 'gi');
    const productMatches = html.match(productRegex) || [];

    // Extract products with prices
    productMatches.forEach((match, index) => {
      if (products.length < 20) {
        const productName = match.trim().replace(/<[^>]*>/g, '');
        const nearbyPrice = priceMatches[index] || priceMatches[Math.floor(Math.random() * priceMatches.length)];

        products.push({
          name: productName,
          price: nearbyPrice,
          category: productKeywords.find(keyword =>
            productName.toLowerCase().includes(keyword)
          ) || 'Electronics'
        });
      }
    });

    // If no products found with keywords, try to extract from titles/headings with prices
    if (products.length === 0 && priceMatches.length > 0) {
      const titleRegex = /<(?:h[1-6]|title|strong|b)[^>]*>([^<]{10,80})<\/(?:h[1-6]|title|strong|b)>/gi;
      let titleMatch;
      let productIndex = 0;

      while ((titleMatch = titleRegex.exec(html)) !== null && products.length < 10 && productIndex < priceMatches.length) {
        const title = titleMatch[1].trim().replace(/[^\w\s-]/g, '');
        if (title.length > 5 && title.length < 80) {
          products.push({
            name: title,
            price: priceMatches[productIndex],
            category: 'General'
          });
          productIndex++;
        }
      }
    }

    // Extract services from specific service-related sections (not all headings)
    // Look for sections that explicitly mention services, products, offerings
    const serviceKeywords = ['service', 'product', 'offering', 'solution', 'package', 'plan', 'feature'];
    const headingRegex = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi;
    let headingMatch;

    // First pass: only extract headings that are near service keywords
    const potentialServices: string[] = [];
    while ((headingMatch = headingRegex.exec(html)) !== null) {
      const heading = headingMatch[1].trim();
      const headingIndex = headingMatch.index;

      // Get surrounding context (500 chars before and after)
      const contextStart = Math.max(0, headingIndex - 500);
      const contextEnd = Math.min(html.length, headingIndex + 500);
      const context = html.substring(contextStart, contextEnd).toLowerCase();

      // Check if this heading is in a service-related section
      const isServiceSection = serviceKeywords.some(keyword => context.includes(keyword));

      // Filter out navigation, testimonials, and other non-service content
      const excludePatterns = [
        /menu/i, /navigation/i, /footer/i, /header/i,
        /testimonial/i, /review/i, /customer/i, /client/i,
        /about/i, /contact/i, /blog/i, /news/i,
        /\d+\s*,\s*[A-Z][a-z]+/,  // Matches "Brian M., Nairobi" pattern
        /^[A-Z][a-z]+\s+[A-Z]\.,/  // Matches "Name I., City" pattern
      ];

      const shouldExclude = excludePatterns.some(pattern => pattern.test(heading));

      if (isServiceSection && !shouldExclude && heading.length > 5 && heading.length < 100) {
        potentialServices.push(heading);
      }
    }

    // Limit to top 10 services
    services.push(...potentialServices.slice(0, 10));

    // Determine business type from content with better logic
    const htmlLower = html.toLowerCase();
    const titleLower = title.toLowerCase();
    let businessType = 'General Business';
    let industry = 'General';

    // Check title and meta description first (more reliable than body content)
    const combinedText = `${titleLower} ${description.toLowerCase()}`;

    // Electronics/Tech store detection
    if (combinedText.includes('electronic') || combinedText.includes('gadget') ||
      (htmlLower.includes('phone') && htmlLower.includes('laptop') && htmlLower.includes('price'))) {
      businessType = 'Electronics Store';
      industry = 'Electronics & Technology';
    }
    // Restaurant detection (but NOT if it's just navigation menu)
    else if ((combinedText.includes('restaurant') || combinedText.includes('dining')) &&
      !combinedText.includes('electronic')) {
      businessType = 'Restaurant';
      industry = 'Food & Beverage';
    }
    // Tech company detection
    else if (combinedText.includes('software') || combinedText.includes('saas') ||
      combinedText.includes('platform') || combinedText.includes('api')) {
      businessType = 'Technology Company';
      industry = 'Technology';
    }
    // Financial services detection
    else if (combinedText.includes('payment') || combinedText.includes('financial') ||
      combinedText.includes('banking') || combinedText.includes('fintech')) {
      businessType = 'Financial Services';
      industry = 'Financial Technology';
    }
    // E-commerce detection
    else if ((combinedText.includes('shop') || combinedText.includes('store') ||
      combinedText.includes('buy online')) && !combinedText.includes('electronic')) {
      businessType = 'E-commerce Store';
      industry = 'Retail';
    }

    return {
      basicInfo: {
        url,
        title,
        description,
        keywords,
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
        socialMedia: []
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
        uniqueSellingPoints: [],
        competitorMentions: [],
        marketPosition: 'mid-market',
        pricingStrategy: 'competitive'
      }
    };
  }

  private createFallbackAnalysis(url: string): ComprehensiveAnalysis {
    const domain = new URL(url).hostname.replace('www.', '');
    const businessName = domain.split('.')[0];

    return {
      basicInfo: {
        url,
        title: `${businessName.charAt(0).toUpperCase() + businessName.slice(1)} - Professional Services`,
        description: 'Professional services company providing quality solutions to customers.',
        keywords: ['business', 'services', 'professional'],
        language: 'en',
        favicon: `${new URL(url).origin}/favicon.ico`
      },
      businessIntel: {
        businessType: 'Professional Services',
        industry: 'General',
        services: ['Consulting Services', 'Customer Support', 'Professional Solutions'],
        products: [],
        contactInfo: {},
        socialMedia: []
      },
      mediaAssets: {
        images: [],
        logos: []
      },
      technicalAnalysis: {
        technologies: [],
        performance: {
          loadTime: 0,
          pageSize: 0,
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
          hasAltTags: false,
          hasAriaLabels: false,
          colorContrast: 'unknown',
          keyboardNavigation: false
        }
      },
      competitiveIntel: {
        uniqueSellingPoints: ['Quality service delivery', 'Professional expertise', 'Customer-focused approach'],
        competitorMentions: [],
        marketPosition: 'mid-market',
        pricingStrategy: 'competitive'
      }
    };
  }
}

// Export the main function
export async function analyzeWebsiteComprehensively(url: string): Promise<ComprehensiveAnalysis> {
  const scraper = new SimplifiedWebsiteScraper();
  return await scraper.analyzeWebsiteComprehensively(url);
}
