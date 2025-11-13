/**
 * Direct OpenRouter Client for Website Analysis
 * Implements multi-model fallback: claude-3-haiku → gpt-4o-mini → gpt-3.5-turbo
 * No proxy dependencies - direct API calls
 */
import { formatContactForAI, isContactInfoTooLong } from '@/lib/utils/smart-contact-formatter';

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Multi-model fallback configuration (same as proxy server had)
const WEBSITE_ANALYSIS_MODELS = [
  'anthropic/claude-3-haiku',      // Primary: Best for website analysis, 85% cheaper
  'openai/gpt-4o-mini',            // Secondary: Most reliable, 70% cheaper  
  'openai/gpt-3.5-turbo',          // Tertiary: Budget backup, 90% cheaper
];

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('🚫 OpenRouter API key not found. Please set OPENROUTER_API_KEY environment variable.');
    }
  }

  /**
   * Analyze website content with multi-model fallback
   */
  async analyzeWebsite(
    websiteContent: string,
    websiteUrl: string,
    designImages: string[] = [],
    scrapedData?: {
      phoneNumbers?: string[];
      emailAddresses?: string[];
      competitiveAdvantages?: string[];
      contentThemes?: string[];
    }
  ): Promise<any> {
    console.log('🌐 [OpenRouter] Starting website analysis with multi-model fallback...');
    console.log(`📄 Content length: ${websiteContent.length} characters`);

    const prompt = this.buildWebsiteAnalysisPrompt(websiteContent, websiteUrl, designImages, scrapedData);

    // Debug: Log scraped data being passed to AI
    if (scrapedData) {
      console.log(`🔍 [OpenRouter] Scraped data being sent to AI:`, {
        phoneNumbers: scrapedData.phoneNumbers?.length || 0,
        emailAddresses: scrapedData.emailAddresses?.length || 0,
        competitiveAdvantages: scrapedData.competitiveAdvantages?.length || 0,
        contentThemes: scrapedData.contentThemes?.length || 0
      });
    }

    // Try each model in sequence until one succeeds
    for (let i = 0; i < WEBSITE_ANALYSIS_MODELS.length; i++) {
      const model = WEBSITE_ANALYSIS_MODELS[i];
      try {
        console.log(`🔄 [OpenRouter] Attempting analysis with ${model} (attempt ${i + 1}/${WEBSITE_ANALYSIS_MODELS.length})`);

        const result = await this.callOpenRouterAPI(model, prompt);

        console.log(`✅ [OpenRouter] Analysis successful with ${model}`);
        return this.parseAnalysisResult(result, model, scrapedData);

      } catch (error: any) {
        console.warn(`⚠️ [OpenRouter] ${model} failed:`, error.message);

        // If this is the last model, throw the error
        if (i === WEBSITE_ANALYSIS_MODELS.length - 1) {
          throw new Error(`All OpenRouter models failed. Last error: ${error.message}`);
        }

        // Otherwise, continue to next model
        continue;
      }
    }

    throw new Error('All OpenRouter models failed for website analysis');
  }

  /**
   * Call OpenRouter API with specific model
   */
  async callOpenRouterAPI(model: string, prompt: string): Promise<string> {
    const request: OpenRouterRequest = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 8192
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nevis-ai.com', // Required by OpenRouter
        'X-Title': 'Nevis AI - Website Analysis' // Optional but recommended
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    return data.choices[0].message.content;
  }

  /**
   * Build comprehensive website analysis prompt
   */
  private buildWebsiteAnalysisPrompt(
    websiteContent: string,
    websiteUrl: string,
    designImages: string[],
    scrapedData?: {
      phoneNumbers?: string[];
      emailAddresses?: string[];
      competitiveAdvantages?: string[];
      contentThemes?: string[];
    }
  ): string {
    return `You are an expert business analyst specializing in comprehensive website analysis. Your task is to extract detailed business information and provide thorough service descriptions.

WEBSITE URL: ${websiteUrl}

WEBSITE CONTENT:
${websiteContent}

${scrapedData ? `
EXTRACTED DATA FROM WEBSITE:
- Phone Numbers Found: ${scrapedData.phoneNumbers?.length || 0} (${scrapedData.phoneNumbers?.join(', ') || 'none'})
- Email Addresses Found: ${scrapedData.emailAddresses?.length || 0} (${scrapedData.emailAddresses?.join(', ') || 'none'})
- Competitive Advantages Found: ${scrapedData.competitiveAdvantages?.length || 0} (${scrapedData.competitiveAdvantages?.slice(0, 3).join('; ') || 'none'})
- Content Themes Found: ${scrapedData.contentThemes?.length || 0} (${scrapedData.contentThemes?.join(', ') || 'none'})
` : ''}

${designImages.length > 0 ? `DESIGN IMAGES PROVIDED: ${designImages.length} images` : ''}

CRITICAL INSTRUCTIONS:
1. Extract DETAILED service descriptions - include what each service involves, benefits, processes, and specific details
2. Find ALL contact information, social media links, and business details
3. Provide comprehensive descriptions, not brief summaries
4. Focus on extracting maximum detail about services and offerings
5. MANDATORY: You MUST include competitive advantages in the competitiveAdvantages field - look for unique selling points, awards, certifications, "why choose us" content, guarantees, or any differentiating factors
6. MANDATORY: You MUST include content themes in the contentThemes field - identify key themes like "innovation", "quality", "service", "community", "sustainability", etc.
7. MANDATORY: You MUST include phone numbers in the contactInfo.phone field if any are found in the content
8. CONTACT INFO VALIDATION: Only include VALID contact information:
   - Phone: Must be a real phone number (7-15 digits), not truncated or shortened
   - Email: Must be a complete, valid email address with @ and domain
   - Website: Must be a complete URL, not truncated or shortened
   - Address: Must be a complete address, not truncated
   - If contact info is too long to fit properly, prioritize phone and email over website and address
   - DO NOT include partial, truncated, or invalid contact information
9. Return ONLY valid JSON - no markdown, no explanations, no text before or after
10. Ensure all strings are properly escaped (no unescaped quotes, newlines, or control characters)
11. If a field has no information, use empty string "" or empty array []
12. DO NOT leave competitiveAdvantages, contentThemes, or contactInfo.phone empty unless absolutely no relevant information exists

Respond with ONLY valid JSON in this exact format:

{
  "businessName": "extracted business name",
  "businessType": "primary business category",
  "description": "comprehensive business description with full details about what the business does, their approach, and what makes them unique",
  "targetAudience": "detailed description of primary target audience",
  "valueProposition": "main value proposition and unique benefits",
  "keyServices": ["service 1 with detailed description", "service 2 with detailed description", "service 3 with detailed description"],
  "detailedServiceDescriptions": "Comprehensive description of ALL services offered, including what each service includes, how they work, benefits, and any specific details mentioned on the website",
  "contactInfo": {
    "phone": "phone number if found",
    "email": "email address if found",
    "address": "full physical address if found",
    "website": "${websiteUrl}",
    "hours": "business hours if mentioned"
  },
  "socialMedia": {
    "facebook": "facebook URL if found",
    "instagram": "instagram URL if found",
    "twitter": "twitter URL if found",
    "linkedin": "linkedin URL if found",
    "youtube": "youtube URL if found",
    "tiktok": "tiktok URL if found",
    "other": ["any other social media URLs found"]
  },
  "brandPersonality": {
    "tone": "brand tone (professional/friendly/casual/etc)",
    "style": "brand style description",
    "values": ["value1", "value2", "value3"]
  },
  "colorScheme": {
    "primary": "#hexcolor or color name",
    "secondary": "#hexcolor or color name",
    "accent": "#hexcolor or color name"
  },
  "contentThemes": ["theme1", "theme2", "theme3"],
  "competitiveAdvantages": ["advantage1", "advantage2"],
  "marketingAngles": ["angle1", "angle2", "angle3"],
  "brandArchetype": "primary brand archetype (The Hero, The Sage, The Explorer, etc.)",
  "communicationStyle": "how the brand communicates with customers",
  "visualStyle": "visual design preferences and aesthetic",
  "location": "business location/city/region if mentioned",
  "industry": "specific industry classification",
  "establishedYear": "founding year if mentioned",
  "teamSize": "number of employees if mentioned",
  "certifications": ["any certifications, awards, or credentials mentioned"],
  "specialties": ["specific specializations or focus areas"],
  "pricing": "pricing information if available (ranges, starting prices, etc.)",
  "serviceAreas": ["geographic areas served if mentioned"]
}

EXTRACTION GUIDELINES:
- Extract detailed service descriptions, not just service names
- Include complete contact information (phone, email, address, hours) - search thoroughly in headers, footers, contact pages
- Find all social media links and profiles
- Capture comprehensive business details and background
- For competitiveAdvantages: Look for ANY unique selling points, awards, certifications, special features, differentiators, company strengths, what makes them special or different. If not explicitly stated, infer from the business description and services. Examples: "Industry leader", "Award-winning", "Trusted by millions", "24/7 support", "Free shipping", "Money-back guarantee", etc.
- For contentThemes: Identify recurring topics, messaging themes, brand values, key topics the business focuses on. Look for themes like "innovation", "quality", "customer service", "sustainability", "community", "expertise", "reliability", etc. If not explicit, infer from the overall messaging and business focus.
- For phone numbers: Search in all text, headers, footers, contact sections - include any format (xxx-xxx-xxxx, (xxx) xxx-xxxx, +1-xxx-xxx-xxxx)
- Provide full descriptions, not summaries
- If information is not found, use empty string "" or empty array []
- Ensure the JSON response is complete and properly formatted

Respond with complete, valid JSON only. Do not include any text before or after the JSON.`;
  }

  /**
   * Parse and validate analysis result with robust JSON handling
   */
  private parseAnalysisResult(content: string, model: string, scrapedData?: {
    phoneNumbers?: string[];
    emailAddresses?: string[];
    competitiveAdvantages?: string[];
    contentThemes?: string[];
  }): any {
    try {
      console.log(`🔍 [OpenRouter] Parsing response from ${model}...`);

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let jsonString = jsonMatch[0];

      // Clean up common JSON formatting issues
      jsonString = this.cleanJsonString(jsonString);

      const parsed = JSON.parse(jsonString);
      console.log(`🔍 [OpenRouter] Raw competitiveAdvantages:`, parsed.competitiveAdvantages);
      console.log(`🔍 [OpenRouter] Raw contentThemes:`, parsed.contentThemes);
      console.log(`🔍 [OpenRouter] Raw contactInfo.phone:`, parsed.contactInfo?.phone);

      // Normalize field names to match expected schema
      const normalized = this.normalizeAnalysisFields(parsed);

      // Add metadata about the analysis
      normalized._metadata = {
        analyzedBy: model,
        analyzedAt: new Date().toISOString(),
        source: 'openrouter-direct'
      };

      console.log(`✅ [OpenRouter] Successfully parsed analysis from ${model}`);
      console.log(`🔍 [OpenRouter] Normalized keyServices:`, normalized.keyServices?.length || 0, 'items');
      console.log(`🔍 [OpenRouter] Normalized detailedServiceDescriptions:`, normalized.detailedServiceDescriptions?.length || 0, 'chars');
      console.log(`🔍 [OpenRouter] Normalized competitiveAdvantages:`, normalized.competitiveAdvantages?.length || 0, 'chars');
      console.log(`🔍 [OpenRouter] Normalized contentThemes:`, normalized.contentThemes?.length || 0, 'items');
      console.log(`🔍 [OpenRouter] Normalized phone:`, normalized.contactInfo?.phone || 'none');

      // Post-process: Merge scraped data if AI didn't include it and we have scraped data
      if (scrapedData) {
        console.log(`🔍 [OpenRouter] Post-processing with scraped data...`);

        // Merge competitive advantages if AI response is empty but we have scraped data
        if ((!normalized.competitiveAdvantages || normalized.competitiveAdvantages.length === 0) &&
          scrapedData.competitiveAdvantages && scrapedData.competitiveAdvantages.length > 0) {
          console.log(`🔍 [OpenRouter] Merging ${scrapedData.competitiveAdvantages.length} competitive advantages from scraped data`);
          normalized.competitiveAdvantages = scrapedData.competitiveAdvantages.slice(0, 5); // Limit to 5
        }

        // Merge content themes if AI response is empty but we have scraped data
        if ((!normalized.contentThemes || normalized.contentThemes.length === 0) &&
          scrapedData.contentThemes && scrapedData.contentThemes.length > 0) {
          console.log(`🔍 [OpenRouter] Merging ${scrapedData.contentThemes.length} content themes from scraped data`);
          normalized.contentThemes = scrapedData.contentThemes;
        }

        // Merge phone numbers if AI response is empty but we have scraped data
        if ((!normalized.contactInfo?.phone || normalized.contactInfo.phone === '') &&
          scrapedData.phoneNumbers && scrapedData.phoneNumbers.length > 0) {
          console.log(`🔍 [OpenRouter] Merging phone number from scraped data: ${scrapedData.phoneNumbers[0]}`);
          if (!normalized.contactInfo) normalized.contactInfo = {};
          normalized.contactInfo.phone = scrapedData.phoneNumbers[0]; // Use first phone number
        }

        // Merge email addresses if AI response is empty but we have scraped data
        if ((!normalized.contactInfo?.email || normalized.contactInfo.email === '') &&
          scrapedData.emailAddresses && scrapedData.emailAddresses.length > 0) {
          console.log(`🔍 [OpenRouter] Merging email address from scraped data: ${scrapedData.emailAddresses[0]}`);
          if (!normalized.contactInfo) normalized.contactInfo = {};
          normalized.contactInfo.email = scrapedData.emailAddresses[0]; // Use first email address
        }
      }

      return normalized;

    } catch (error) {
      console.error(`❌ [OpenRouter] Failed to parse JSON from ${model}:`, error);
      console.log(`📄 [OpenRouter] Raw content preview:`, content.substring(0, 1000));

      // Try alternative parsing methods
      try {
        console.log(`🔍 [OpenRouter] Attempting alternative parsing with scrapedData:`, !!scrapedData);
        const alternativeParsed = this.tryAlternativeJsonParsing(content, scrapedData);
        if (alternativeParsed) {
          console.log(`✅ [OpenRouter] Alternative parsing succeeded for ${model}`);
          console.log(`🔍 [OpenRouter] Alt keyServices:`, alternativeParsed.keyServices?.length || 0, 'items');
          console.log(`🔍 [OpenRouter] Alt detailedServiceDescriptions:`, alternativeParsed.detailedServiceDescriptions?.length || 0, 'chars');
          console.log(`🔍 [OpenRouter] Alt competitiveAdvantages:`, alternativeParsed.competitiveAdvantages?.length || 0, 'chars');
          console.log(`🔍 [OpenRouter] Alt contentThemes:`, alternativeParsed.contentThemes?.length || 0, 'items');
          console.log(`🔍 [OpenRouter] Alt phone:`, alternativeParsed.contactInfo?.phone || 'none');

          return alternativeParsed;
        }
      } catch (altError) {
        console.error(`❌ [OpenRouter] Alternative parsing also failed:`, altError);
      }

      // Fallback: return a basic structure with the raw content
      return {
        businessName: 'Unknown Business',
        businessType: 'general',
        description: content.substring(0, 500) + '...',
        targetAudience: 'general audience',
        valueProposition: 'extracted from website analysis',
        keyServices: ['service analysis'],
        contactInfo: {
          phone: '',
          email: '',
          address: '',
          website: '',
          hours: ''
        },
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
          tiktok: '',
          other: []
        },
        brandPersonality: {
          tone: 'professional',
          style: 'modern',
          values: ['quality', 'service', 'reliability']
        },
        colorScheme: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#f59e0b'
        },
        contentThemes: ['business', 'service', 'quality'],
        competitiveAdvantages: ['unique service'],
        marketingAngles: ['quality focus'],
        brandArchetype: 'The Expert',
        communicationStyle: 'professional and informative',
        visualStyle: 'clean and modern',
        location: 'not specified',
        industry: 'general business',
        establishedYear: '',
        teamSize: '',
        certifications: [],
        specialties: [],
        pricing: '',
        serviceAreas: [],
        _metadata: {
          analyzedBy: model,
          analyzedAt: new Date().toISOString(),
          source: 'openrouter-direct',
          parseError: true,
          rawContent: content.substring(0, 1000)
        }
      };
    }
  }

  /**
   * Clean JSON string to handle common formatting issues
   */
  private cleanJsonString(jsonString: string): string {
    // Remove any text before the first { and after the last }
    const start = jsonString.indexOf('{');
    const end = jsonString.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      jsonString = jsonString.substring(start, end + 1);
    }

    // Only fix control characters that are actually breaking JSON
    // Be more conservative to avoid breaking valid JSON
    jsonString = jsonString
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove problematic control characters
      .replace(/\n/g, '\\n')           // Escape literal newlines in strings
      .replace(/\r/g, '\\r')           // Escape literal carriage returns
      .replace(/\t/g, '\\t');          // Escape literal tabs

    return jsonString;
  }

  /**
   * Try alternative JSON parsing methods
   */
  private tryAlternativeJsonParsing(content: string, scrapedData?: {
    phoneNumbers?: string[];
    emailAddresses?: string[];
    competitiveAdvantages?: string[];
    contentThemes?: string[];
  }): any | null {
    // Method 1: Try to find and parse multiple JSON objects
    const jsonObjects = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonObjects && jsonObjects.length > 0) {
      for (const jsonObj of jsonObjects) {
        try {
          const cleaned = this.cleanJsonString(jsonObj);
          const parsed = JSON.parse(cleaned);
          if (parsed.businessName || parsed.description) {
            const normalized = this.normalizeAnalysisFields(parsed);
            console.log(`🔍 [OpenRouter] Alt method 1 - keyServices:`, normalized.keyServices?.length || 0, 'items');
            console.log(`🔍 [OpenRouter] Alt method 1 - detailedServiceDescriptions:`, normalized.detailedServiceDescriptions?.length || 0, 'chars');

            // Post-process method 1: Merge scraped data if AI didn't include it
            if (scrapedData) {
              console.log(`🔍 [OpenRouter] Alt method 1 post-processing with scraped data...`);

              // Merge competitive advantages if AI response is empty but we have scraped data
              if ((!normalized.competitiveAdvantages || normalized.competitiveAdvantages.length === 0) &&
                scrapedData.competitiveAdvantages && scrapedData.competitiveAdvantages.length > 0) {
                console.log(`🔍 [OpenRouter] Alt method 1 merging ${scrapedData.competitiveAdvantages.length} competitive advantages from scraped data`);
                normalized.competitiveAdvantages = scrapedData.competitiveAdvantages.slice(0, 5); // Limit to 5
              }

              // Merge content themes if AI response is empty but we have scraped data
              if ((!normalized.contentThemes || normalized.contentThemes.length === 0) &&
                scrapedData.contentThemes && scrapedData.contentThemes.length > 0) {
                console.log(`🔍 [OpenRouter] Alt method 1 merging ${scrapedData.contentThemes.length} content themes from scraped data`);
                normalized.contentThemes = scrapedData.contentThemes;
              }

              // Merge phone numbers if AI response is empty but we have scraped data
              if ((!normalized.contactInfo?.phone || normalized.contactInfo.phone === '') &&
                scrapedData.phoneNumbers && scrapedData.phoneNumbers.length > 0) {
                console.log(`🔍 [OpenRouter] Alt method 1 merging phone number from scraped data: ${scrapedData.phoneNumbers[0]}`);
                if (!normalized.contactInfo) normalized.contactInfo = {};
                normalized.contactInfo.phone = scrapedData.phoneNumbers[0]; // Use first phone number
              }

              // Merge email addresses if AI response is empty but we have scraped data
              if ((!normalized.contactInfo?.email || normalized.contactInfo.email === '') &&
                scrapedData.emailAddresses && scrapedData.emailAddresses.length > 0) {
                console.log(`🔍 [OpenRouter] Alt method 1 merging email address from scraped data: ${scrapedData.emailAddresses[0]}`);
                if (!normalized.contactInfo) normalized.contactInfo = {};
                normalized.contactInfo.email = scrapedData.emailAddresses[0]; // Use first email address
              }
            }

            return normalized;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Method 2: Try to extract key-value pairs manually
    try {
      const extracted = this.extractKeyValuePairs(content);
      if (extracted && Object.keys(extracted).length > 3) {
        const normalized = this.normalizeAnalysisFields(extracted);
        console.log(`🔍 [OpenRouter] Alt method 2 - keyServices:`, normalized.keyServices?.length || 0, 'items');
        console.log(`🔍 [OpenRouter] Alt method 2 - detailedServiceDescriptions:`, normalized.detailedServiceDescriptions?.length || 0, 'chars');

        // Post-process method 2: Merge scraped data if AI didn't include it
        if (scrapedData) {
          console.log(`🔍 [OpenRouter] Alt method 2 post-processing with scraped data...`);

          // Merge competitive advantages if AI response is empty but we have scraped data
          if ((!normalized.competitiveAdvantages || normalized.competitiveAdvantages.length === 0) &&
            scrapedData.competitiveAdvantages && scrapedData.competitiveAdvantages.length > 0) {
            console.log(`🔍 [OpenRouter] Alt method 2 merging ${scrapedData.competitiveAdvantages.length} competitive advantages from scraped data`);
            normalized.competitiveAdvantages = scrapedData.competitiveAdvantages.slice(0, 5); // Limit to 5
          }

          // Merge content themes if AI response is empty but we have scraped data
          if ((!normalized.contentThemes || normalized.contentThemes.length === 0) &&
            scrapedData.contentThemes && scrapedData.contentThemes.length > 0) {
            console.log(`🔍 [OpenRouter] Alt method 2 merging ${scrapedData.contentThemes.length} content themes from scraped data`);
            normalized.contentThemes = scrapedData.contentThemes;
          }

          // Merge phone numbers if AI response is empty but we have scraped data
          if ((!normalized.contactInfo?.phone || normalized.contactInfo.phone === '') &&
            scrapedData.phoneNumbers && scrapedData.phoneNumbers.length > 0) {
            console.log(`🔍 [OpenRouter] Alt method 2 merging phone number from scraped data: ${scrapedData.phoneNumbers[0]}`);
            if (!normalized.contactInfo) normalized.contactInfo = {};
            normalized.contactInfo.phone = scrapedData.phoneNumbers[0]; // Use first phone number
          }

          // Merge email addresses if AI response is empty but we have scraped data
          if ((!normalized.contactInfo?.email || normalized.contactInfo.email === '') &&
            scrapedData.emailAddresses && scrapedData.emailAddresses.length > 0) {
            console.log(`🔍 [OpenRouter] Alt method 2 merging email address from scraped data: ${scrapedData.emailAddresses[0]}`);
            if (!normalized.contactInfo) normalized.contactInfo = {};
            normalized.contactInfo.email = scrapedData.emailAddresses[0]; // Use first email address
          }
        }

        return normalized;
      }
    } catch (e) {
      // Continue to next method
    }

    return null;
  }

  /**
   * Extract key-value pairs from malformed JSON
   */
  private extractKeyValuePairs(content: string): any {
    const result: any = {};

    // Common patterns to extract
    const patterns = [
      /"businessName":\s*"([^"]+)"/,
      /"businessType":\s*"([^"]+)"/,
      /"description":\s*"([^"]+)"/,
      /"targetAudience":\s*"([^"]+)"/,
      /"valueProposition":\s*"([^"]+)"/,
      /"location":\s*"([^"]+)"/,
      /"industry":\s*"([^"]+)"/
    ];

    patterns.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        const key = pattern.source.match(/"(\w+)":/)?.[1];
        if (key) {
          result[key] = match[1];
        }
      }
    });

    // Extract arrays
    const serviceMatch = content.match(/"keyServices":\s*\[(.*?)\]/s);
    if (serviceMatch) {
      try {
        result.keyServices = JSON.parse(`[${serviceMatch[1]}]`);
      } catch (e) {
        result.keyServices = [];
      }
    }

    return result;
  }

  /**
   * Normalize field names to match expected schema
   */
  private normalizeAnalysisFields(data: any): any {
    // Convert services string to array if needed
    let keyServices = data.keyServices || [];
    if (typeof data.services === 'string' && data.services.length > 0) {
      // Split services string into array by common delimiters
      keyServices = data.services.split(/\n\n|\n•|\n-|•|-/).map(s => s.trim()).filter(s => s.length > 10);
    } else if (Array.isArray(data.services)) {
      keyServices = data.services;
    }

    // Get detailed service descriptions from multiple possible fields
    const detailedServiceDescriptions = data.detailedServiceDescriptions ||
      data.serviceDetails ||
      data.servicesDescription ||
      data.services ||
      data.keyFeatures ||
      data.features || '';

    const normalized: any = {
      businessName: data.businessName || data.name || 'Unknown Business',
      businessType: data.businessType || data.type || data.category || 'general',
      description: data.description || data.about || data.overview || '',
      targetAudience: data.targetAudience || data.audience || data.target || '',
      valueProposition: data.valueProposition || data.value || data.proposition || '',
      keyServices: keyServices,
      detailedServiceDescriptions: detailedServiceDescriptions,
      contactInfo: data.contactInfo || {},
      socialMedia: data.socialMedia || {},
      brandPersonality: data.brandPersonality || {},
      colorScheme: data.colorScheme || data.colors || data.colorPalette || {},
      contentThemes: data.contentThemes || data.themes || [],
      competitiveAdvantages: data.competitiveAdvantages || data.advantages || [],
      marketingAngles: data.marketingAngles || data.angles || [],
      brandArchetype: data.brandArchetype || data.archetype || '',
      communicationStyle: data.communicationStyle || data.style || data.writingTone || '',
      visualStyle: data.visualStyle || data.visual || '',
      location: data.location || data.address || '',
      industry: data.industry || data.sector || data.businessType || '',
      establishedYear: data.establishedYear || data.founded || '',
      teamSize: data.teamSize || data.employees || '',
      certifications: data.certifications || data.credentials || [],
      specialties: data.specialties || data.focus || [],
      pricing: data.pricing || data.prices || '',
      serviceAreas: data.serviceAreas || data.areas || []
    };

    // Preserve any additional fields that might be useful
    Object.keys(data).forEach(key => {
      if (!normalized.hasOwnProperty(key) && key !== '_metadata') {
        normalized[key] = data[key];
      }
    });

    return normalized;
  }

  /**
   * Health check for OpenRouter connection
   */
  async healthCheck(): Promise<{ healthy: boolean; model?: string; error?: string }> {
    try {
      const testResult = await this.callOpenRouterAPI(
        WEBSITE_ANALYSIS_MODELS[0],
        'Test connection - respond with "OK"'
      );

      return {
        healthy: true,
        model: WEBSITE_ANALYSIS_MODELS[0]
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();
