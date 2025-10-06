// src/app/api/scrape-website/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Debug: Log the raw request body to see what's being sent
    const rawBody = await request.text();
    console.log('🔍 Raw request body:', rawBody);
    console.log('🔍 Raw body length:', rawBody.length);
    console.log('🔍 Raw body first 50 chars:', rawBody.substring(0, 50));

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

    const { url } = parsedBody;

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
      // Look for common business sections
      aboutSection: $('section:contains("About"), div:contains("About Us"), .about, #about, section:contains("Who We Are"), div:contains("Our Story"), .story, #story').text().trim(),
      servicesSection: $('section:contains("Services"), div:contains("Services"), .services, #services, section:contains("What We Do"), div:contains("What We Do"), section:contains("Solutions"), div:contains("Solutions"), .solutions, #solutions, section:contains("Offerings"), div:contains("Offerings")').text().trim(),
      contactSection: $('section:contains("Contact"), div:contains("Contact"), .contact, #contact, section:contains("Get in Touch"), div:contains("Reach Us")').text().trim(),
      // Enhanced target audience extraction
      targetAudienceSection: $('section:contains("Who We Serve"), div:contains("Who We Serve"), section:contains("Our Clients"), div:contains("Our Clients"), section:contains("Target"), div:contains("Target"), section:contains("For"), div:contains("Perfect For"), .clients, #clients, .audience, #audience').text().trim(),
      // More comprehensive service extraction
      featuresSection: $('section:contains("Features"), div:contains("Features"), .features, #features, section:contains("Benefits"), div:contains("Benefits"), .benefits, #benefits').text().trim(),
      packagesSection: $('section:contains("Packages"), div:contains("Packages"), .packages, #packages, section:contains("Plans"), div:contains("Plans"), .plans, #plans, section:contains("Pricing"), div:contains("Pricing"), .pricing, #pricing').text().trim(),
      // Extract all paragraph text
      paragraphs: $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20),
      // Extract list items (often contain services/features)
      listItems: $('li').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 10),
      // Extract any text that might contain business info
      mainContent: $('main, .main, .content, .container').text().trim(),
    };

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
      structuredContent += `ABOUT SECTION: ${extractedContent.aboutSection}\n\n`;
    }

    if (extractedContent.servicesSection) {
      structuredContent += `SERVICES SECTION: ${extractedContent.servicesSection}\n\n`;
    }

    if (extractedContent.targetAudienceSection) {
      structuredContent += `TARGET AUDIENCE SECTION: ${extractedContent.targetAudienceSection}\n\n`;
    }

    if (extractedContent.featuresSection) {
      structuredContent += `FEATURES/BENEFITS SECTION: ${extractedContent.featuresSection}\n\n`;
    }

    if (extractedContent.packagesSection) {
      structuredContent += `PACKAGES/PRICING SECTION: ${extractedContent.packagesSection}\n\n`;
    }

    if (extractedContent.contactSection) {
      structuredContent += `CONTACT SECTION: ${extractedContent.contactSection}\n\n`;
    }

    if (extractedContent.listItems.length > 0) {
      structuredContent += `KEY POINTS/SERVICES: ${extractedContent.listItems.slice(0, 20).join(' | ')}\n\n`;
    }

    if (extractedContent.paragraphs.length > 0) {
      structuredContent += `MAIN CONTENT: ${extractedContent.paragraphs.slice(0, 10).join(' ')}\n\n`;
    }

    // Fallback to main content if structured extraction didn't work well
    if (structuredContent.length < 500 && extractedContent.mainContent) {
      structuredContent += `FULL CONTENT: ${extractedContent.mainContent}`;
    }

    // Clean up and limit content length
    structuredContent = structuredContent
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length to avoid token limits
    if (structuredContent.length > 15000) {
      structuredContent = structuredContent.substring(0, 15000) + '...';
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
      content: structuredContent,
      url: targetUrl
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