'use server';

/**
 * @fileOverview Analyzes a brand's website and design examples to extract brand voice, visual style, and other key business details.
 *
 * - analyzeBrand - A function that initiates the brand analysis process.
 * - AnalyzeBrandInput - The input type for the analyzeBrand function.
 * - AnalyzeBrandOutput - The return type for the analyzeBrand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
  establishedYear: z.union([z.string(), z.number()]).optional().describe('Year the business was established if mentioned.'),
  teamSize: z.string().optional().describe('Information about team size or company size if mentioned.'),
  certifications: z.array(z.string()).optional().describe('Professional certifications, awards, or credentials mentioned.'),

  // Content and Marketing Insights
  contentStrategy: z.string().optional().describe('Insights into their content marketing strategy based on website content.'),
  callsToAction: z.array(z.string()).optional().describe('Common calls-to-action used throughout the website.'),
  valueProposition: z.string().optional().describe('The main value proposition or promise to customers.'),

  // Brand Archetype Recommendation
  archetypeRecommendation: z.object({
    recommendedArchetype: z.string().describe('The recommended brand archetype ID (e.g., "caregiver", "hero", "sage").'),
    archetypeName: z.string().describe('The human-readable name of the recommended archetype (e.g., "The Caregiver").'),
    archetypeDescription: z.string().describe('Description of the recommended archetype.'),
    confidence: z.number().describe('Confidence score (0-100) for the archetype recommendation.'),
    matchedKeywords: z.array(z.string()).describe('Keywords from the content that matched this archetype.'),
    reasoning: z.string().describe('Explanation of why this archetype was recommended.'),
  }).optional().describe('AI-recommended brand archetype based on website content analysis.'),
});
export type BrandAnalysisResult = z.infer<typeof AnalyzeBrandOutputSchema>;

export async function analyzeBrand(input: AnalyzeBrandInput): Promise<BrandAnalysisResult> {
  // Direct OpenRouter analysis (bypass Genkit flow to avoid proxy requirements)
  try {
    console.log('🔍 Starting direct OpenRouter brand analysis...');
    console.log('🔍 [FORCE RECOMPILE] This should trigger recompilation');

    // First, scrape the website content
    const scrapedData = await scrapeWebsiteContent(input.websiteUrl);

    // Debug: Log scraped data
    console.log(`🔍 [Brand Analysis] Scraped data:`, {
      contentLength: scrapedData.content?.length || 0,
      phoneNumbers: scrapedData.phoneNumbers?.length || 0,
      emailAddresses: scrapedData.emailAddresses?.length || 0,
      competitiveAdvantages: scrapedData.competitiveAdvantages?.length || 0,
      contentThemes: scrapedData.contentThemes?.length || 0
    });

    // Use direct OpenRouter analysis (no proxy dependencies)
    const output = await analyzeWebsiteWithOpenRouter(
      scrapedData.content,
      input.websiteUrl,
      input.designImageUris,
      scrapedData
    );

    console.log('✅ Direct OpenRouter brand analysis completed successfully');
    // Force recompilation - updated
    return output;

  } catch (error) {
    console.error('❌ Direct OpenRouter brand analysis failed:', error);
    throw error;
  }
}

// Old Genkit prompt removed - now using multi-model proxy system

// Website scraping function using server-side API
async function scrapeWebsiteContent(url: string): Promise<{
  content: string;
  phoneNumbers?: string[];
  emailAddresses?: string[];
  competitiveAdvantages?: string[];
  contentThemes?: string[];
}> {
  try {
    // Use the server-side scraping API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3001';

    const response = await fetch(`${baseUrl}/api/scrape-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const result = await response.json();

    if (!response.ok) {
      // Re-throw with the specific error type for proper handling
      const error = new Error(result.error || 'Failed to scrape website');
      if (result.errorType === 'blocked') {
        throw new Error('blocked: ' + result.error);
      } else if (result.errorType === 'network') {
        throw new Error('timeout: ' + result.error);
      } else if (result.errorType === 'not_found') {
        throw new Error('not_found: ' + result.error);
      } else {
        throw error;
      }
    }

    // Handle both old and new response structures
    const content = result.data?.content || result.content;
    const phoneNumbers = result.data?.phoneNumbers || result.phoneNumbers || [];
    const emailAddresses = result.data?.emailAddresses || result.emailAddresses || [];
    const competitiveAdvantages = result.data?.competitiveAdvantages || result.competitiveAdvantages || [];
    const contentThemes = result.data?.contentThemes || result.contentThemes || [];

    if (!result.success || !content) {
      throw new Error('No content could be extracted from the website');
    }

    return {
      content,
      phoneNumbers,
      emailAddresses,
      competitiveAdvantages,
      contentThemes
    };

  } catch (error) {
    // Pass through the error with proper typing for upstream handling
    throw error;
  }
}

// Direct OpenRouter website analysis function (no proxy dependencies)
async function analyzeWebsiteWithOpenRouter(
  websiteContent: string,
  websiteUrl: string,
  designImageUris: string[] = [],
  scrapedData?: {
    phoneNumbers?: string[];
    competitiveAdvantages?: string[];
    contentThemes?: string[];
  }
): Promise<BrandAnalysisResult> {
  try {
    console.log('🌐 Using direct OpenRouter multi-model website analysis...');
    console.log(`📄 Content length: ${websiteContent.length} characters`);

    // Import the OpenRouter client
    const { openRouterClient } = await import('@/lib/services/openrouter-client');

    // Analyze website using direct OpenRouter calls with multi-model fallback
    const result = await openRouterClient.analyzeWebsite(
      websiteContent,
      websiteUrl,
      designImageUris,
      scrapedData
    );

    console.log('✅ Direct OpenRouter analysis completed successfully');

    // Validate the response structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format from OpenRouter');
    }

    // Map OpenRouter response to our expected schema
    const analysisData = result;

    return {
      businessName: analysisData.businessName || 'Unknown Business',
      description: analysisData.description || 'Professional services company',
      businessType: analysisData.businessType || analysisData.industry || 'general',
      industry: analysisData.industry || analysisData.businessType || 'general',
      targetAudience: analysisData.targetAudience || 'General business customers',

      // Enhanced service extraction with detailed descriptions
      services: (() => {
        // First try to get detailed service descriptions
        if (analysisData.detailedServiceDescriptions && analysisData.detailedServiceDescriptions.length > 100) {
          return analysisData.detailedServiceDescriptions;
        }

        // Then try service array (now simplified)
        if (Array.isArray(analysisData.keyServices) && analysisData.keyServices.length > 0) {
          return analysisData.keyServices.join('\n\n');
        }

        // Fallback to simple service list
        if (typeof analysisData.keyServices === 'string') {
          return analysisData.keyServices;
        }

        return 'Professional services';
      })(),

      keyFeatures: (() => {
        // Use service descriptions as features if available
        if (Array.isArray(analysisData.keyServices) && analysisData.keyServices.length > 0) {
          return analysisData.keyServices.join('\n');
        }

        return analysisData.keyServices || 'Quality features';
      })(),
      competitiveAdvantages: Array.isArray(analysisData.competitiveAdvantages)
        ? analysisData.competitiveAdvantages.join(', ')
        : (analysisData.competitiveAdvantages || 'Quality service'),
      visualStyle: analysisData.visualStyle || 'Modern and professional design approach',
      writingTone: analysisData.brandPersonality?.tone || analysisData.communicationStyle || 'Professional and customer-focused',
      contentThemes: Array.isArray(analysisData.contentThemes)
        ? analysisData.contentThemes.join(', ')
        : (analysisData.contentThemes || 'Quality and professionalism'),
      brandPersonality: typeof analysisData.brandPersonality === 'object'
        ? `${analysisData.brandPersonality.tone || 'professional'}, ${analysisData.brandPersonality.style || 'modern'}`
        : (analysisData.brandPersonality || 'Professional and reliable'),
      colorPalette: analysisData.colorScheme || {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#8B5CF6',
        description: 'Professional color scheme'
      },
      typography: {
        style: 'Modern and clean',
        characteristics: 'Professional typography'
      },
      contactInfo: {
        phone: analysisData.contactInfo?.phone || '',
        email: analysisData.contactInfo?.email || '',
        address: analysisData.contactInfo?.address || analysisData.location || '',
        website: websiteUrl,
        hours: analysisData.contactInfo?.hours || ''
      },
      socialMedia: {
        facebook: analysisData.socialMedia?.facebook || '',
        instagram: analysisData.socialMedia?.instagram || '',
        twitter: analysisData.socialMedia?.twitter || '',
        linkedin: analysisData.socialMedia?.linkedin || '',
        youtube: analysisData.socialMedia?.youtube || '',
        other: analysisData.socialMedia?.other || []
      },
      location: analysisData.location || 'not specified',
      establishedYear: analysisData.establishedYear || '',
      teamSize: analysisData.teamSize || '',
      certifications: analysisData.certifications || [],
      contentStrategy: Array.isArray(analysisData.marketingAngles)
        ? analysisData.marketingAngles.join(', ')
        : (analysisData.marketingAngles || 'Quality-focused approach'),
      callsToAction: ['Contact Us', 'Learn More', 'Get Started'],
      valueProposition: analysisData.valueProposition || 'Quality service provider',

      // Include archetype recommendation from OpenRouter analysis
      archetypeRecommendation: analysisData.brandArchetype || undefined
    };

  } catch (error) {
    console.error('❌ OpenRouter website analysis failed:', error);
    throw error;
  }
}

const analyzeBrandFlow = ai.defineFlow(
  {
    name: 'analyzeBrandFlow',
    inputSchema: AnalyzeBrandInputSchema,
    outputSchema: AnalyzeBrandOutputSchema,
  },
  async input => {
    try {
      // First, scrape the website content
      const websiteContent = await scrapeWebsiteContent(input.websiteUrl);

      console.log('🔍 Analyzing brand with direct OpenRouter multi-model system...');

      // Use the new direct OpenRouter analysis (no proxy dependencies)
      const output = await analyzeWebsiteWithOpenRouter(
        websiteContent,
        input.websiteUrl,
        input.designImageUris
      );

      // Validate the OpenRouter response
      if (!output || typeof output !== 'object') {
        console.error('❌ Invalid OpenRouter response format:', typeof output);
        throw new Error('Invalid OpenRouter response format');
      }

      // Validate required fields are present
      if (!output.businessName || !output.description ||
        output.businessName.length < 2 ||
        output.description.length < 10) {
        console.error('❌ Proxy returned invalid or incomplete analysis:', {
          businessName: output.businessName,
          descriptionLength: output.description?.length || 0
        });
        throw new Error('Proxy returned incomplete or invalid analysis');
      }

      console.log('✅ Multi-model website analysis completed successfully');
      return output;
    } catch (error) {
      // Enhanced fallback analysis with better error handling
      console.warn('Brand analysis failed, returning enhanced fallback analysis:', error);

      // Try to extract basic info from URL if possible
      let businessName = 'New Business';
      try {
        const urlObj = new URL(input.websiteUrl.startsWith('http') ? input.websiteUrl : `https://${input.websiteUrl}`);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const domainParts = domain.split('.');
        businessName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      } catch (urlError) {
        // Keep default business name
      }

      return {
        businessName,
        description: 'This business provides professional services and solutions to help customers achieve their goals. We are committed to delivering quality results and excellent customer service.',
        businessType: 'Professional Services',
        services: 'Consulting Services: Professional consulting and advisory services\nSupport Services: Customer support and assistance\nCustom Solutions: Tailored solutions to meet specific needs',
        targetAudience: 'Small to medium-sized businesses, entrepreneurs, and professionals seeking quality services and solutions',
        visualStyle: 'Professional and clean design approach with modern aesthetics',
        writingTone: 'Professional, clear, and customer-focused communication style',
        contentThemes: 'Quality, professionalism, customer success, innovation, and reliability',
        keyFeatures: 'Professional service delivery, experienced team, customer-focused approach, quality results',
        competitiveAdvantages: 'Experienced professionals, personalized service, proven track record, commitment to quality',
        contactInfo: {
          phone: '',
          email: '',
          address: '',
          website: input.websiteUrl,
          hours: ''
        },
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: ''
        },
        location: '',
        colorPalette: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          description: 'Professional blue and green color scheme with modern accent colors'
        }
      };
    }
  }
);
