'use server';

/**
 * @fileOverview Analyzes a brand's website and design examples to extract brand voice, visual style, and other key business details.
 *
 * - analyzeBrand - A function that initiates the brand analysis process.
 * - AnalyzeBrandInput - The input type for the analyzeBrand function.
 * - AnalyzeBrandOutput - The return type for the analyzeBrand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeBrandInputSchema = z.object({
  websiteUrl: z.string().describe('The URL of the brand\'s website to analyze.'),
  designImageUris: z.array(z.string()).describe("A list of data URIs of previous design examples. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  websiteContent: z.string().optional().describe('The scraped content from the website for analysis.'),
});
export type AnalyzeBrandInput = z.infer<typeof AnalyzeBrandInputSchema>;

const AnalyzeBrandOutputSchema = z.object({
  // Core Business Information
  businessName: z.string().describe('The EXACT business name, company name, or brand name as it appears on the website. This should be the PROPER NAME like "Apple Inc.", "Microsoft Corporation", "Joe\'s Pizza", NOT a description of what they do. Look for the company name in headers, logos, titles, "About Us" sections, or anywhere the business identifies itself. Extract the precise name they use, not their business type or industry.'),
  description: z.string().describe('A comprehensive, detailed summary of the business that includes: what they do, how they do it, their mission/values, their approach, their history, and what makes them unique. Combine information from multiple website sections to create a thorough description. Minimum 3-4 sentences using the company\'s own words.'),
  businessType: z.string().optional().describe('The specific type/category of business like "Software Company", "Restaurant", "Consulting Firm", "E-commerce Store" - this describes WHAT they do, not WHO they are. This is different from the business name.'),
  industry: z.string().optional().describe('The specific industry sector the business operates in using their own terminology.'),
  targetAudience: z.string().describe('DETAILED description of the specific target audience, customer base, client types, demographics, business types, industries, or customer characteristics this company mentions they serve. Be very specific and comprehensive. Include customer examples, business sizes, industries, or any specific customer details mentioned on the website.'),

  // Services and Products
  services: z.string().describe('A comprehensive newline-separated list of ALL services, products, packages, plans, or offerings this specific company provides. Search the entire website content thoroughly. Format each as "Service Name: Detailed description as written on their website including features, benefits, what\'s included". Extract the company\'s own descriptions, not generic ones. Include pricing, packages, service tiers, features, or any details mentioned. Be comprehensive and don\'t miss any services.'),
  keyFeatures: z.string().optional().describe('ALL the SPECIFIC key features, benefits, or unique selling propositions that THIS company highlights about their offerings. Use their exact wording and claims. Be comprehensive and detailed.'),
  competitiveAdvantages: z.string().optional().describe('What THIS specific company says makes them different from competitors. Extract their own competitive claims and differentiators, not generic industry advantages. Use their exact wording.'),

  // Brand Identity and Voice
  visualStyle: z.string().describe('A detailed description of THIS company\'s specific visual style based on their actual design examples and website. Describe the exact colors, typography, layout patterns, imagery style, and aesthetic choices THEY use. Reference specific design elements visible in their materials.'),
  writingTone: z.string().describe('The SPECIFIC writing tone and voice THIS company uses in their actual website content. Analyze their actual text, headlines, and copy to describe their unique communication style. Use examples from their content.'),
  contentThemes: z.string().describe('The SPECIFIC themes, topics, and messaging patterns THIS company focuses on in their actual content. Extract the exact topics they discuss and how they position themselves.'),
  brandPersonality: z.string().optional().describe('THIS company\'s specific brand personality as expressed through their actual content and design choices. Base this on their real communications, not generic assumptions.'),

  // Visual Design Analysis
  colorPalette: z.object({
    primary: z.string().optional().describe('Primary brand color in hex format extracted from the uploaded design examples. Look carefully at the most prominent color used in logos, headers, buttons, or main design elements in the images.'),
    secondary: z.string().optional().describe('Secondary brand color in hex format extracted from the uploaded design examples. Look for the second most used color in the designs.'),
    accent: z.string().optional().describe('Accent color in hex format extracted from the uploaded design examples. Look for colors used for highlights, calls-to-action, or accent elements in the images.'),
    description: z.string().optional().describe('Detailed description of the overall color scheme and palette used in the design examples. Describe the colors you can actually see in the uploaded images and the mood/feeling they create.'),
  }).optional().describe('Color palette analysis extracted from the uploaded design examples. Analyze the actual colors visible in the design images provided.'),

  typography: z.object({
    style: z.string().optional().describe('Typography style (e.g., modern, classic, playful, professional).'),
    characteristics: z.string().optional().describe('Font characteristics and typography choices observed.'),
  }).optional().describe('Typography analysis from design examples and website.'),

  // Contact and Location Information
  contactInfo: z.object({
    phone: z.string().optional().describe('The main contact phone number.'),
    email: z.string().optional().describe('The main contact email address.'),
    address: z.string().optional().describe('The physical business address.'),
    website: z.string().optional().describe('Additional website URLs or domains mentioned.'),
    hours: z.string().optional().describe('Business hours if mentioned on the website.'),
  }).describe('The contact information for the business, extracted from the website.'),

  // Social Media and Online Presence
  socialMedia: z.object({
    facebook: z.string().optional().describe('Facebook page URL if found on the website.'),
    instagram: z.string().optional().describe('Instagram profile URL if found on the website.'),
    twitter: z.string().optional().describe('Twitter profile URL if found on the website.'),
    linkedin: z.string().optional().describe('LinkedIn profile URL if found on the website.'),
    youtube: z.string().optional().describe('YouTube channel URL if found on the website.'),
    other: z.array(z.string()).optional().describe('Other social media or platform URLs found.'),
  }).optional().describe('Social media presence and URLs found on the website.'),

  // Additional Business Details
  location: z.string().optional().describe('Geographic location or service area of the business.'),
  establishedYear: z.string().optional().describe('Year the business was established if mentioned.'),
  teamSize: z.string().optional().describe('Information about team size or company size if mentioned.'),
  certifications: z.array(z.string()).optional().describe('Professional certifications, awards, or credentials mentioned.'),

  // Content and Marketing Insights
  contentStrategy: z.string().optional().describe('Insights into their content marketing strategy based on website content.'),
  callsToAction: z.array(z.string()).optional().describe('Common calls-to-action used throughout the website.'),
  valueProposition: z.string().optional().describe('The main value proposition or promise to customers.'),
});
export type BrandAnalysisResult = z.infer<typeof AnalyzeBrandOutputSchema>;

export async function analyzeBrand(input: AnalyzeBrandInput): Promise<BrandAnalysisResult> {
  return analyzeBrandFlow(input);
}

const analyzeBrandPrompt = ai.definePrompt({
  name: 'analyzeBrandPrompt',
  input: { schema: AnalyzeBrandInputSchema },
  output: { schema: AnalyzeBrandOutputSchema },
  prompt: `You are an expert brand strategist, business analyst, and design consultant with deep expertise in brand identity, visual design, and digital marketing. Your task is to perform an extremely comprehensive and detailed analysis of THIS SPECIFIC BUSINESS based on its website and design examples.

  **CRITICAL INSTRUCTION: BE COMPANY-SPECIFIC, NOT GENERIC**
  - Extract ONLY information that is specifically mentioned on THIS company's website
  - Use the EXACT wording and terminology that THIS company uses
  - Do NOT provide generic industry descriptions or assumptions
  - Focus on what makes THIS specific business unique and different
  - Extract the company's OWN words about their services, not generic descriptions

  **Source Information:**
  - Website URL: {{{websiteUrl}}}
  - Website Content: {{{websiteContent}}}
  - Design Examples: These are crucial for understanding visual style, color palette, typography, and brand aesthetic.
  {{#each designImageUris}}
  Design Example: {{media url=this}}
  {{/each}}

  **COMPANY-SPECIFIC ANALYSIS REQUIREMENTS:**

  **🏢 THIS COMPANY'S BUSINESS DETAILS (Extract from Website Content Above):**
  1. **Business Name:** Extract the EXACT business name, company name, or brand name as it appears on the website. Look for the company name in headers, logos, page titles, "About Us" sections, contact information, or anywhere the business identifies itself. Extract the precise name they use - this is critical for brand identity.
  2. **Business Description:** Find and extract a COMPREHENSIVE and DETAILED description of this company from the website content. Look for "About Us", "Who We Are", "Our Story", "Mission", "Vision" sections. Combine multiple sections to create a thorough description that includes: what they do, how they do it, their mission/values, their history, their approach, and what makes them unique. Use their own words but create a complete picture. Minimum 3-4 sentences.
  3. **Business Type & Industry:** Use the SPECIFIC terms this company uses in their website content to describe their business type and industry. Be precise and specific.
  4. **Target Audience:** This is CRITICAL - Extract EXACTLY who this company says they serve from the website content. Look for "Who We Serve", "Our Clients", "Target Market", "Perfect For", "Ideal Customers", "We Help" sections. Also look for customer testimonials, case studies, or examples that indicate their target market. Include demographics, business types, industries, or specific customer characteristics they mention. Be very detailed and specific.
  5. **Services/Products:** Extract EVERY service and product this company specifically offers from the website content. Look in "Services", "What We Do", "Products", "Solutions", "Offerings", "Packages", "Plans", "Pricing" sections. Use their EXACT service names and descriptions as written. Include ALL services, packages, tiers, or offerings mentioned. Format as "Service Name: Detailed description as written on their website" on separate lines. Don't miss any services.
  6. **Key Features & Benefits:** Extract ALL the SPECIFIC features and benefits this company highlights about their offerings from the website content. Look in "Features", "Benefits", "Why Choose Us" sections. Use their exact wording and claims. Be comprehensive.
  7. **Competitive Advantages:** Extract what THIS company specifically says makes them different or better from the website content. Look for "Why Choose Us", "What Makes Us Different", "Our Advantage", "Why We're Better" sections. Use their own competitive claims and differentiators.
  8. **Value Proposition:** Extract the EXACT value proposition or promises this company makes to their customers from the website content. What do they promise to deliver?

  **🎨 VISUAL DESIGN DEEP ANALYSIS (Analyze the Design Examples Carefully):**
  8. **Visual Style:** Provide a detailed analysis of the overall visual aesthetic, design approach, imagery style, layout patterns, and visual hierarchy. Base this primarily on the design examples provided. Describe the specific design elements you can see in the uploaded images.
  9. **Color Palette Analysis - CRITICAL:**
     - CAREFULLY examine each design example image to identify the EXACT colors used
     - Extract specific colors in hex format from the designs (look at backgrounds, text, buttons, accents, logos)
     - Identify the primary brand color (most prominent color in the designs)
     - Identify secondary colors and accent colors used in the designs
     - Describe the overall color scheme and mood it creates
     - Be very specific about the colors you can see in the uploaded design examples
  10. **Typography Analysis:**
     - Examine the design examples to describe the actual font styles and typography choices used
     - Identify if fonts are modern, classic, playful, professional, etc. based on what you see in the images
     - Note any distinctive typographic elements visible in the design examples

  **✍️ BRAND VOICE & CONTENT ANALYSIS:**
  11. **Writing Tone:** Analyze the brand's communication style in detail (formal, casual, witty, professional, friendly, authoritative, conversational, etc.).
  12. **Content Themes:** Identify recurring themes, topics, and messaging patterns throughout the website and designs.
  13. **Brand Personality:** Describe the overall brand character and personality as expressed through content and design.
  14. **Content Strategy:** Analyze their approach to content marketing and communication.
  15. **Calls to Action:** Extract common CTAs and action-oriented language used.

  **📞 CONTACT & BUSINESS DETAILS:**
  16. **Complete Contact Information:** Extract phone numbers, email addresses, physical addresses, business hours, and any additional contact methods.
  17. **Location & Service Area:** Identify geographic location and areas they serve.
  18. **Business Details:** Look for establishment year, team size, company history, certifications, awards, or credentials.

  **🌐 DIGITAL PRESENCE ANALYSIS:**
  19. **Social Media Presence:** Extract ALL social media URLs found (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok, etc.).
  20. **Additional Websites:** Note any additional domains, subdomains, or related websites mentioned.

  **CRITICAL ANALYSIS INSTRUCTIONS - COMPANY-SPECIFIC EXTRACTION:**

  **FOR SERVICES/PRODUCTS (Search ALL Sections in Website Content Above):**
  - Search the website content for "Services", "What We Do", "Our Services", "Products", "Solutions", "Offerings", "Packages", "Plans", "Pricing" sections
  - Extract EVERY service name as the company lists them in their website content - don't miss any
  - Include the company's OWN descriptions of each service from their website text
  - Look for pricing information, package details, service tiers, features included in each service
  - Look in multiple sections - services might be mentioned in different parts of the website
  - Format as: "Service Name: Company's exact description of what this service includes, features, benefits, etc."
  - Include any pricing tiers, packages, or service levels mentioned in the content
  - Be comprehensive - extract ALL services, not just the main ones

  **FOR TARGET AUDIENCE (Search ALL Sections for Customer Information):**
  - Search the website content for "Who We Serve", "Our Clients", "Target Market", "Perfect For", "Ideal Customers", "We Help", "Client Types" sections
  - Look for customer testimonials, case studies, or examples that indicate their target market
  - Extract specific demographics, business types, industries, company sizes, or customer characteristics they mention
  - Look for phrases like "small businesses", "enterprise clients", "startups", "restaurants", "healthcare providers", etc.
  - Include any specific customer examples or client types mentioned
  - Be very detailed and specific about who they serve

  **FOR BUSINESS DESCRIPTION (Create Comprehensive Description):**
  - Search the website content for "About Us", "Who We Are", "Our Story", "Mission", "Vision", "Company" sections
  - Combine information from multiple sections to create a thorough, detailed description
  - Include what they do, how they do it, their mission/values, their approach, their history, what makes them unique
  - Use their own words but create a complete, comprehensive picture
  - Make it detailed and informative - minimum 3-4 sentences

  **FOR TARGET AUDIENCE:**
  - Look for "Who We Serve", "Our Clients", "Target Market" information
  - Extract the SPECIFIC customer types they mention
  - Use their exact terminology for their customer base

  **FOR COMPETITIVE ADVANTAGES:**
  - Find "Why Choose Us", "What Makes Us Different", "Our Advantage" sections
  - Extract their SPECIFIC claims about what makes them unique
  - Use their exact competitive positioning statements

  **GENERAL EXTRACTION RULES:**
  - Be extremely thorough and detailed in your analysis
  - Extract every piece of relevant information you can find
  - For design analysis, pay close attention to the uploaded design examples
  - Look for subtle details like color codes, font choices, layout patterns
  - Extract contact information from headers, footers, contact pages, and anywhere else it appears
  - Look for social media links in headers, footers, and throughout the site
  - If information is not available, leave those fields empty rather than guessing
  - NEVER use generic industry descriptions - only use company-specific information
  - Quote the company's exact wording whenever possible

  **FINAL REQUIREMENTS:**
  - Be EXTREMELY thorough and comprehensive in your analysis
  - Extract EVERY piece of relevant information from the website content
  - Don't miss any services, features, or customer details
  - Analyze the design examples carefully for exact colors
  - Create detailed, informative descriptions using the company's own words
  - Target audience description must be specific and detailed
  - Services list must be comprehensive and complete
  - Color analysis must be based on actual colors visible in the design examples

  **OUTPUT FORMAT:**
  Provide a complete, detailed analysis in the required JSON format with all available information extracted and organized according to the schema.
  `,
});

// Website scraping function with enhanced content extraction
async function scrapeWebsiteContent(url: string): Promise<string> {
  try {

    // Import cheerio for HTML parsing
    const cheerio = await import('cheerio');

    // Use fetch to get the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
      // Look for common business sections with more comprehensive selectors
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

    // Limit content length to avoid token limits (increased for better analysis)
    if (structuredContent.length > 15000) {
      structuredContent = structuredContent.substring(0, 15000) + '...';
    }


    return structuredContent;

  } catch (error) {
    throw new Error(`Failed to scrape website content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const analyzeBrandFlow = ai.defineFlow(
  {
    name: 'analyzeBrandFlow',
    inputSchema: AnalyzeBrandInputSchema,
    outputSchema: AnalyzeBrandOutputSchema,
  },
  async input => {
    // First, scrape the website content
    const websiteContent = await scrapeWebsiteContent(input.websiteUrl);

    // Create enhanced input with website content
    const enhancedInput = {
      ...input,
      websiteContent
    };

    const { output } = await analyzeBrandPrompt(enhancedInput);
    return output!;
  }
);
