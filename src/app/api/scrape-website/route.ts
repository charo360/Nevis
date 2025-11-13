// src/app/api/scrape-website/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EnhancedBrandScraper } from '@/ai/website-analyzer/enhanced-brand-scraper';

export async function POST(request: NextRequest) {
  try {
    // Debug: Log the raw request body to see what's being sent
    const rawBody = await request.text();

    // Try to parse the JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed to parse body:', rawBody);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          errorType: 'invalid_json',
          details: parseError.message
        },
        { status: 400 }
      );
    }

    const { url, enhanced = false } = parsedBody;

    // 🚀 ENHANCED BRAND SCRAPING for Brand Creation
    if (enhanced) {
      console.log('🔍 Using Enhanced Brand Scraper for comprehensive analysis...');
      
      try {
        const enhancedScraper = new EnhancedBrandScraper();
        const result = await enhancedScraper.scrapeForBrandCreation(url);
        
        console.log(`✅ Enhanced scraping complete - ${result.dataCompleteness}% completeness, ${result.pagesAnalyzed} pages analyzed`);
        
        // Map enhanced result to expected format for brand creation
        return NextResponse.json({
          success: true,
          data: {
            content: `${result.title}\n\n${result.aboutSection}\n\n${result.servicesSection}\n\n${result.detailedServicesContent}`,
            title: result.title,
            metaDescription: result.metaDescription,
            businessType: result.businessType,
            phoneNumbers: result.phoneNumbers,
            emailAddresses: result.emailAddresses,
            competitiveAdvantages: result.competitiveAdvantages,
            contentThemes: result.contentThemes,
            targetAudience: result.targetAudience,
            socialMediaLinks: result.socialMediaLinks,
            addresses: result.addresses,
            // Enhanced data for better brand creation
            enhancedData: {
              keyPages: result.keyPages,
              aggregatedServices: result.aggregatedServices,
              dataCompleteness: result.dataCompleteness,
              pagesAnalyzed: result.pagesAnalyzed,
              businessClassification: result.businessType
            }
          }
        });
        
      } catch (enhancedError) {
        console.warn('⚠️ Enhanced scraping failed, falling back to standard scraping:', enhancedError);
        // Fall through to standard scraping
      }
    }

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate and normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Import cheerio for HTML parsing
    const cheerio = await import('cheerio');

    // Use fetch with proper headers to scrape the website
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: 'Website blocks automated access. This is common for security reasons.',
            errorType: 'blocked'
          },
          { status: 403 }
        );
      } else if (response.status === 404) {
        return NextResponse.json(
          {
            error: 'Website not found. Please check the URL is correct.',
            errorType: 'not_found'
          },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          {
            error: `Failed to access website (HTTP ${response.status})`,
            errorType: 'http_error'
          },
          { status: response.status }
        );
      }
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, .cookie-banner, .popup, .modal').remove();

    // Extract structured content
    const extractedContent = {
      title: $('title').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      headings: {
        h1: $('h1').map((_, el) => $(el).text().trim()).get(),
        h2: $('h2').map((_, el) => $(el).text().trim()).get(),
        h3: $('h3').map((_, el) => $(el).text().trim()).get(),
      },
      // Enhanced business sections with more comprehensive extraction
      aboutSection: extractDetailedSection($, [
        'About', 'About Us', 'Who We Are', 'Our Story', 'Our Mission', 'Our Vision',
        'Company', 'History', 'Background', 'Overview', 'Introduction'
      ]),
      servicesSection: extractDetailedSection($, [
        'Services', 'What We Do', 'Solutions', 'Offerings', 'Products', 'Capabilities',
        'Specialties', 'Expertise', 'Service Areas', 'Our Work', 'What We Offer'
      ]),
      detailedServicesContent: extractServiceDetails($),
      contactSection: extractDetailedSection($, [
        'Contact', 'Get in Touch', 'Reach Us', 'Contact Us', 'Get Started', 'Book Now'
      ]),
      targetAudienceSection: extractDetailedSection($, [
        'Who We Serve', 'Our Clients', 'Target', 'Perfect For', 'Ideal For',
        'Client Types', 'Industries', 'Markets'
      ]),
      featuresSection: extractDetailedSection($, [
        'Features', 'Benefits', 'Advantages', 'Why Choose Us', 'What Makes Us Different',
        'Our Approach', 'Methodology', 'Process'
      ]),
      packagesSection: extractDetailedSection($, [
        'Packages', 'Plans', 'Pricing', 'Options', 'Tiers', 'Service Levels',
        'Membership', 'Subscriptions'
      ]),
      // Extract all paragraph text
      paragraphs: $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20),
      // Extract list items (often contain services/features)
      listItems: $('li').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 10),
      // Extract any text that might contain business info
      mainContent: $('main, .main, .content, .container').text().trim(),
      // Enhanced contact information extraction
      phoneNumbers: extractPhoneNumbers($),
      emailAddresses: extractEmailAddresses($),
      socialMediaLinks: extractSocialMediaLinks($),
      businessHours: extractBusinessHours($),
      addresses: extractAddresses($),
      // Extract competitive advantages and themes
      competitiveAdvantages: extractCompetitiveAdvantages($),
      contentThemes: extractContentThemes($),
    };

    console.log(`🔍 [Scraper] Extracted ${extractedContent.phoneNumbers.length} phone numbers:`, extractedContent.phoneNumbers);
    console.log(`🔍 [Scraper] Extracted ${extractedContent.competitiveAdvantages.length} competitive advantages:`, extractedContent.competitiveAdvantages);
    console.log(`🔍 [Scraper] Extracted ${extractedContent.contentThemes.length} content themes:`, extractedContent.contentThemes);

    // Helper functions for contact extraction
    function extractPhoneNumbers($: any): string[] {
      const phoneRegexes = [
        /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
        /(\+?[1-9]\d{0,3}[-.\s]?)?\(?([0-9]{2,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})/g, // International
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Simple format
        /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g // (xxx) xxx-xxxx
      ];

      const allText = $('body').text();
      let allMatches: string[] = [];

      phoneRegexes.forEach(regex => {
        const matches = allText.match(regex) || [];
        allMatches = allMatches.concat(matches);
      });

      // Also check specific elements that commonly contain phone numbers
      const phoneElements = $('a[href^="tel:"], .phone, .contact-phone, [class*="phone"], [id*="phone"]');
      phoneElements.each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 5) allMatches.push(text);
      });

      // Filter out example/placeholder phone numbers
      const examplePhonePatterns = [
        '555-',  // US example numbers
        '(555)',
        '1234 1234 1234',  // Credit card numbers
        '0000 0000 0000',
        '9999 9999 9999',
        '458) 555',  // Apple's example number
        '555-2863',  // Common example suffix
      ];

      const filtered = allMatches.filter(phone => {
        const phoneLower = phone.toLowerCase();
        // Filter out example patterns
        return !examplePhonePatterns.some(pattern => phoneLower.includes(pattern.toLowerCase()));
      });

      return [...new Set(filtered)]; // Remove duplicates
    }

    function extractEmailAddresses($: any): string[] {
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const emails: string[] = [];

      // First, try to find emails in specific elements that commonly contain contact info
      const contactElements = $('a[href^="mailto:"], .email, .contact-email, [class*="email"], [id*="email"], .contact, .footer, .header');
      contactElements.each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');

        // Extract from mailto links
        if (href && href.startsWith('mailto:')) {
          const email = href.replace('mailto:', '').split('?')[0].trim();
          if (email && email.includes('@')) {
            emails.push(email);
          }
        }

        // Extract from text content
        const textMatches = text.match(emailRegex) || [];
        emails.push(...textMatches);
      });

      // If no emails found in specific elements, search the entire body text
      if (emails.length === 0) {
        const allText = $('body').text();
        const bodyMatches = allText.match(emailRegex) || [];
        emails.push(...bodyMatches);
      }

      // Clean and validate emails
      const cleanEmails = emails
        .map(email => {
          // Clean the email by removing common prefixes and suffixes
          let cleaned = email.trim().toLowerCase();

          // Remove common prefixes like "email", "e-mail", "contact", etc.
          cleaned = cleaned.replace(/^(email|e-mail|contact|mail|send|write|reach)\s*:?\s*/i, '');

          // Extract just the email part using a more precise regex
          const emailMatch = cleaned.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
          if (emailMatch) {
            cleaned = emailMatch[0];
          }

          // Remove common suffixes that might be attached (like "addressnairobi")
          // Look for patterns where the email ends with a domain, then has extra text
          const domainMatch = cleaned.match(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (domainMatch) {
            cleaned = domainMatch[1];
          }

          // Additional cleaning: remove common suffixes that get attached
          cleaned = cleaned.replace(/(address|location|city|phone|tel|contact|info|details)[a-z]*$/i, '');

          // Final validation: ensure it ends with a proper domain
          const finalMatch = cleaned.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
          if (finalMatch) {
            cleaned = finalMatch[0];
          }

          return cleaned;
        })
        .filter(email => {
          // Basic validation: must contain @ and a dot after @
          const parts = email.split('@');
          return parts.length === 2 &&
            parts[0].length > 0 &&
            parts[1].includes('.') &&
            parts[1].length > 3 &&
            parts[1].length < 50 && // Domain shouldn't be too long
            !email.includes(' ') && // No spaces
            email.length < 100 && // Reasonable length limit
            email.length > 5; // Minimum reasonable length
        });

      const finalEmails = [...new Set(cleanEmails)]; // Remove duplicates

      // Filter out example/placeholder email addresses
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
        'donotreply',
      ];

      const filteredEmails = finalEmails.filter(email => {
        const emailLower = email.toLowerCase();
        // Filter out example patterns
        return !exampleEmailPatterns.some(pattern => emailLower.includes(pattern));
      });

      // Debug logging
      if (filteredEmails.length > 0) {
        console.log(`🔍 [Scraper] Extracted ${filteredEmails.length} email addresses:`, filteredEmails);
      }

      return filteredEmails;
    }

    function extractSocialMediaLinks($: any): { [key: string]: string[] } {
      const socialMedia: { [key: string]: string[] } = {
        facebook: [],
        instagram: [],
        twitter: [],
        linkedin: [],
        youtube: [],
        tiktok: [],
        other: []
      };

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const lowerHref = href.toLowerCase();

        if (lowerHref.includes('facebook.com')) {
          socialMedia.facebook.push(href);
        } else if (lowerHref.includes('instagram.com')) {
          socialMedia.instagram.push(href);
        } else if (lowerHref.includes('twitter.com') || lowerHref.includes('x.com')) {
          socialMedia.twitter.push(href);
        } else if (lowerHref.includes('linkedin.com')) {
          socialMedia.linkedin.push(href);
        } else if (lowerHref.includes('youtube.com')) {
          socialMedia.youtube.push(href);
        } else if (lowerHref.includes('tiktok.com')) {
          socialMedia.tiktok.push(href);
        } else if (lowerHref.match(/\.(com|org|net|io|co)/) && !lowerHref.includes(new URL(targetUrl).hostname)) {
          socialMedia.other.push(href);
        }
      });

      // Remove duplicates and clean up
      Object.keys(socialMedia).forEach(key => {
        socialMedia[key] = [...new Set(socialMedia[key])];
      });

      return socialMedia;
    }

    function extractBusinessHours($: any): string[] {
      const hoursKeywords = ['hours', 'open', 'closed', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const timeRegex = /\d{1,2}:\d{2}\s*(am|pm|AM|PM)/g;

      const hoursElements = $('*').filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return hoursKeywords.some(keyword => text.includes(keyword)) && timeRegex.test($(el).text());
      });

      return hoursElements.map((_, el) => $(el).text().trim()).get().filter(text => text.length > 10);
    }

    function extractAddresses($: any): string[] {
      const addressKeywords = ['address', 'location', 'street', 'avenue', 'road', 'blvd', 'suite', 'apt'];
      const zipRegex = /\b\d{5}(-\d{4})?\b/;

      const addressElements = $('*').filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return (addressKeywords.some(keyword => text.includes(keyword)) || zipRegex.test($(el).text())) && $(el).text().length > 15 && $(el).text().length < 200;
      });

      return addressElements.map((_, el) => $(el).text().trim()).get();
    }

    function extractCompetitiveAdvantages($: any): string[] {
      const advantageKeywords = [
        'why choose', 'why us', 'our advantage', 'what makes us', 'unique', 'different',
        'award', 'certified', 'licensed', 'accredited', 'trusted', 'proven', 'leader',
        'first', 'best', 'top', 'premium', 'exclusive', 'patented', 'innovative',
        'guarantee', 'warranty', 'satisfaction', 'quality', 'experience', 'expertise'
      ];

      const advantages: string[] = [];
      const allText = $('body').text().toLowerCase();

      // Look for sections with advantage keywords
      advantageKeywords.forEach(keyword => {
        const elements = $('*').filter((_, el) => {
          const text = $(el).text().toLowerCase();
          const hasKeyword = text.includes(keyword);
          const isReasonableLength = text.length > 20 && text.length < 500;
          return hasKeyword && isReasonableLength;
        });

        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) {
            advantages.push(text);
          }
        });
      });

      return [...new Set(advantages)].slice(0, 5); // Remove duplicates, limit to 5
    }

    function extractContentThemes($: any): string[] {
      const themeKeywords = [
        'mission', 'vision', 'values', 'commitment', 'dedication', 'passion',
        'innovation', 'quality', 'service', 'customer', 'community', 'sustainability',
        'excellence', 'integrity', 'trust', 'reliability', 'professional', 'expert'
      ];

      const themes: string[] = [];

      // Look for theme-related content
      themeKeywords.forEach(keyword => {
        const elements = $('*').filter((_, el) => {
          const text = $(el).text().toLowerCase();
          const hasKeyword = text.includes(keyword);
          const isReasonableLength = text.length > 15 && text.length < 300;
          return hasKeyword && isReasonableLength;
        });

        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 15) {
            themes.push(keyword); // Add the theme keyword, not the full text
          }
        });
      });

      return [...new Set(themes)].slice(0, 8); // Remove duplicates, limit to 8
    }

    // Enhanced content extraction functions
    function extractDetailedSection($: any, keywords: string[]): string {
      const selectors = [];

      // Build comprehensive selectors for each keyword
      keywords.forEach(keyword => {
        selectors.push(
          `section:contains("${keyword}")`,
          `div:contains("${keyword}")`,
          `.${keyword.toLowerCase().replace(/\s+/g, '-')}`,
          `#${keyword.toLowerCase().replace(/\s+/g, '-')}`,
          `[class*="${keyword.toLowerCase().replace(/\s+/g, '')}"]`,
          `[id*="${keyword.toLowerCase().replace(/\s+/g, '')}"]`
        );
      });

      // Find all matching elements and extract comprehensive content
      const matchingElements = $(selectors.join(', '));
      let content = '';

      matchingElements.each((_, el) => {
        const elementText = $(el).text().trim();
        if (elementText.length > 50) { // Only include substantial content
          content += elementText + ' ';
        }
      });

      // Also look for content in paragraphs and divs that contain keywords
      keywords.forEach(keyword => {
        $('p, div').each((_, el) => {
          const text = $(el).text();
          if (text.toLowerCase().includes(keyword.toLowerCase()) && text.length > 100) {
            content += text.trim() + ' ';
          }
        });
      });

      return content.trim();
    }

    function extractServiceDetails($: any): string {
      let serviceContent = '';

      // Enhanced service selectors for modern websites
      const serviceSelectors = [
        'section[class*="service"], div[class*="service"]',
        'section[class*="product"], div[class*="product"]',
        'section[class*="offering"], div[class*="offering"]',
        'section[class*="solution"], div[class*="solution"]',
        'section[class*="feature"], div[class*="feature"]',
        '.service-item, .product-item, .offering-item, .solution-item',
        '.service-card, .product-card, .offering-card, .feature-card',
        '.service-description, .product-description, .feature-description',
        '[class*="service-detail"], [class*="product-detail"], [class*="feature-detail"]',
        '[data-testid*="service"], [data-testid*="product"], [data-testid*="feature"]',
        '.pricing-card, .plan-card, .package-card',
        '[class*="capability"], [class*="benefit"]'
      ];

      serviceSelectors.forEach(selector => {
        $(selector).each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 60) { // Substantial service descriptions
            serviceContent += text + '\n\n';
          }
        });
      });

      // Enhanced service keyword detection
      const serviceKeywords = [
        'we offer', 'we provide', 'our services', 'we specialize', 'we help',
        'our expertise', 'we deliver', 'what we do', 'how we help', 'our solutions',
        'capabilities include', 'services include', 'we enable', 'we support',
        'features include', 'benefits include', 'includes', 'get access to',
        'you can', 'helps you', 'allows you to', 'designed to', 'built for'
      ];

      // Look for service lists with enhanced detection
      $('ul, ol').each((_, listEl) => {
        const listText = $(listEl).text().toLowerCase();
        const hasServiceKeywords = serviceKeywords.some(keyword => listText.includes(keyword));
        const hasServiceContext = listText.includes('service') || listText.includes('feature') ||
          listText.includes('benefit') || listText.includes('solution') ||
          listText.includes('capability') || listText.includes('tool');

        if (hasServiceKeywords || hasServiceContext) {
          $(listEl).find('li').each((_, liEl) => {
            const itemText = $(liEl).text().trim();
            if (itemText.length > 20) { // More inclusive for detailed list items
              serviceContent += '• ' + itemText + '\n';
            }
          });
          serviceContent += '\n';
        }
      });

      // Extract service information from paragraphs with enhanced keywords
      $('p').each((_, pEl) => {
        const text = $(pEl).text();
        const hasServiceKeywords = serviceKeywords.some(keyword => text.toLowerCase().includes(keyword));

        if (hasServiceKeywords && text.length > 80) { // Slightly lower threshold for more content
          serviceContent += text.trim() + '\n\n';
        }
      });

      // Extract from headings that might describe services
      $('h2, h3, h4').each((_, headingEl) => {
        const headingText = $(headingEl).text().toLowerCase();
        if (headingText.includes('service') || headingText.includes('feature') ||
          headingText.includes('solution') || headingText.includes('what') ||
          headingText.includes('how') || headingText.includes('why')) {

          // Get the content after this heading
          const nextElements = $(headingEl).nextUntil('h1, h2, h3, h4').filter('p, div, ul, ol');
          nextElements.each((_, el) => {
            const text = $(el).text().trim();
            if (text.length > 50) {
              serviceContent += text + '\n\n';
            }
          });
        }
      });

      return serviceContent.trim();
    }

    // Combine all extracted content into a structured format
    let structuredContent = '';

    if (extractedContent.title) {
      structuredContent += `WEBSITE TITLE: ${extractedContent.title}\n\n`;
    }

    if (extractedContent.metaDescription) {
      structuredContent += `META DESCRIPTION: ${extractedContent.metaDescription}\n\n`;
    }

    if (extractedContent.headings.h1.length > 0) {
      structuredContent += `MAIN HEADINGS: ${extractedContent.headings.h1.join(' | ')}\n\n`;
    }

    if (extractedContent.aboutSection) {
      structuredContent += `ABOUT SECTION (DETAILED): ${extractedContent.aboutSection}\n\n`;
    }

    if (extractedContent.servicesSection) {
      structuredContent += `SERVICES SECTION (COMPREHENSIVE): ${extractedContent.servicesSection}\n\n`;
    }

    // Add the detailed service content separately for maximum detail
    if (extractedContent.detailedServicesContent) {
      structuredContent += `DETAILED SERVICE DESCRIPTIONS:\n${extractedContent.detailedServicesContent}\n\n`;
    }

    if (extractedContent.targetAudienceSection) {
      structuredContent += `TARGET AUDIENCE SECTION (DETAILED): ${extractedContent.targetAudienceSection}\n\n`;
    }

    if (extractedContent.featuresSection) {
      structuredContent += `FEATURES/BENEFITS SECTION (COMPREHENSIVE): ${extractedContent.featuresSection}\n\n`;
    }

    if (extractedContent.packagesSection) {
      structuredContent += `PACKAGES/PRICING SECTION (DETAILED): ${extractedContent.packagesSection}\n\n`;
    }

    if (extractedContent.contactSection) {
      structuredContent += `CONTACT SECTION: ${extractedContent.contactSection}\n\n`;
    }

    // Add extracted contact information
    if (extractedContent.phoneNumbers.length > 0) {
      structuredContent += `PHONE NUMBERS: ${extractedContent.phoneNumbers.join(', ')}\n\n`;
    }

    if (extractedContent.emailAddresses.length > 0) {
      structuredContent += `EMAIL ADDRESSES: ${extractedContent.emailAddresses.join(', ')}\n\n`;
    }

    if (extractedContent.addresses.length > 0) {
      structuredContent += `ADDRESSES: ${extractedContent.addresses.slice(0, 3).join(' | ')}\n\n`;
    }

    if (extractedContent.businessHours.length > 0) {
      structuredContent += `BUSINESS HOURS: ${extractedContent.businessHours.slice(0, 2).join(' | ')}\n\n`;
    }

    // Add social media links
    const socialLinks = extractedContent.socialMediaLinks;
    const socialMediaText = [];
    if (socialLinks.facebook.length > 0) socialMediaText.push(`Facebook: ${socialLinks.facebook[0]}`);
    if (socialLinks.instagram.length > 0) socialMediaText.push(`Instagram: ${socialLinks.instagram[0]}`);
    if (socialLinks.twitter.length > 0) socialMediaText.push(`Twitter: ${socialLinks.twitter[0]}`);
    if (socialLinks.linkedin.length > 0) socialMediaText.push(`LinkedIn: ${socialLinks.linkedin[0]}`);
    if (socialLinks.youtube.length > 0) socialMediaText.push(`YouTube: ${socialLinks.youtube[0]}`);
    if (socialLinks.tiktok.length > 0) socialMediaText.push(`TikTok: ${socialLinks.tiktok[0]}`);

    if (socialMediaText.length > 0) {
      structuredContent += `SOCIAL MEDIA: ${socialMediaText.join(', ')}\n\n`;
    }

    if (extractedContent.listItems.length > 0) {
      structuredContent += `KEY POINTS/SERVICES (COMPREHENSIVE): ${extractedContent.listItems.slice(0, 30).join(' | ')}\n\n`;
    }

    if (extractedContent.paragraphs.length > 0) {
      structuredContent += `MAIN CONTENT (DETAILED): ${extractedContent.paragraphs.slice(0, 20).join(' ')}\n\n`;
    }

    // Add more comprehensive content if available
    if (extractedContent.mainContent && extractedContent.mainContent.length > 200) {
      structuredContent += `COMPREHENSIVE WEBSITE CONTENT: ${extractedContent.mainContent}\n\n`;
    }

    // Clean up content but preserve more detail
    structuredContent = structuredContent
      .replace(/\s+/g, ' ')
      .trim();

    // Significantly increase content length limit for more comprehensive analysis
    if (structuredContent.length > 35000) {
      // Instead of truncating, prioritize service and about content
      const prioritySections = [];

      if (extractedContent.detailedServicesContent) {
        prioritySections.push(`DETAILED SERVICE DESCRIPTIONS:\n${extractedContent.detailedServicesContent}`);
      }
      if (extractedContent.aboutSection) {
        prioritySections.push(`ABOUT SECTION: ${extractedContent.aboutSection}`);
      }
      if (extractedContent.servicesSection) {
        prioritySections.push(`SERVICES SECTION: ${extractedContent.servicesSection}`);
      }

      const priorityContent = prioritySections.join('\n\n');
      if (priorityContent.length < 35000) {
        structuredContent = priorityContent + '\n\n' + structuredContent.substring(0, 35000 - priorityContent.length);
      } else {
        structuredContent = structuredContent.substring(0, 35000) + '...';
      }
    }

    // Allow analysis of all websites, even with minimal content
    if (!structuredContent || structuredContent.length < 10) {
      // Only reject if there's absolutely no content at all
      return NextResponse.json(
        {
          error: 'Unable to extract any content from the website. The website may be completely empty or have content protection.',
          errorType: 'no_content'
        },
        { status: 422 }
      );
    }

    // For websites with minimal content, add a helpful note
    if (structuredContent.length < 100) {
      structuredContent = `[NOTE: This website has minimal content - analysis will be basic]\n\n${structuredContent}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        content: structuredContent,
        url: targetUrl,
        ...extractedContent
      }
    });

  } catch (error) {
    console.error('Website scraping error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Unable to connect to the website. Please check the URL and try again.',
          errorType: 'network'
        },
        { status: 408 }
      );
    } else if (errorMessage.includes('blocked') || errorMessage.includes('403')) {
      return NextResponse.json(
        {
          error: 'Website blocks automated access. This is common for security reasons.',
          errorType: 'blocked'
        },
        { status: 403 }
      );
    } else {
      return NextResponse.json(
        {
          error: `Failed to scrape website: ${errorMessage}`,
          errorType: 'error'
        },
        { status: 500 }
      );
    }
  }
}