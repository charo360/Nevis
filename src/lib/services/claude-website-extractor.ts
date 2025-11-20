/**
 * Enhanced Website Data Extractor using Claude API
 * Production-ready website analysis with comprehensive data extraction
 */

import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

export interface ExtractionResult<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  url: string;
  timestamp: number;
}

export interface CompanyInfo {
  name: string;
  description: string;
  mission: string;
  location: string;
}

export interface ServiceDetail {
  service_name: string;
  description: string;
  key_features: string[];
  benefits: string[];
  target_audience: string;
  pricing: string | null;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  website: string;
}

export interface CompanyStatistics {
  customers: string;
  years_experience: string;
  team_size: string;
}

export interface ServicesExtractionResult {
  company_info: CompanyInfo;
  services: ServiceDetail[];
  contact: ContactInfo;
  statistics: CompanyStatistics;
}

export interface ProductDetail {
  name: string;
  price: string;
  original_price: string | null;
  discount: string | null;
  specifications: Record<string, any>;
  availability: string;
  payment_plans: Record<string, any>;
}

export interface ProductCategory {
  category: string;
  products: ProductDetail[];
}

export interface StoreInfo {
  name: string;
  description: string;
}

export interface ProductsExtractionResult {
  store_info: StoreInfo;
  product_categories: ProductCategory[];
  payment_options: string[];
  delivery_info: string;
}

export interface BrandIntelligence {
  company_name: string;
  value_proposition: string;
  brand_voice: string;
  visual_identity: string;
}

export interface ServiceOffering {
  service: string;
  description: string;
  pricing_model: string;
  target_audience: string;
}

export interface ContentStrategy {
  content_types: string[];
  messaging_themes: string[];
  call_to_actions: string[];
}

export interface CompetitorAnalysisResult {
  brand_intelligence: BrandIntelligence;
  service_offerings: ServiceOffering[];
  content_strategy: ContentStrategy;
  competitive_advantages: string[];
  market_positioning: string;
}

export class EnhancedWebsiteExtractor {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  /**
   * Extract all services from a company website
   */
  async extractServices(url: string, retryCount: number = 3): Promise<ExtractionResult<ServicesExtractionResult>> {
    const dataStructure = {
      company_info: {
        name: "string",
        description: "string", 
        mission: "string",
        location: "string"
      },
      services: [
        {
          service_name: "string",
          description: "string",
          key_features: ["string"],
          benefits: ["string"],
          target_audience: "string",
          pricing: "string or null"
        }
      ],
      contact: {
        phone: "string",
        email: "string",
        address: "string",
        website: "string"
      },
      statistics: {
        customers: "string",
        years_experience: "string",
        team_size: "string"
      }
    };

    return this.extractWithRetry<ServicesExtractionResult>(url, dataStructure, retryCount);
  }

  /**
   * Extract all products and pricing from an e-commerce site
   */
  async extractProducts(url: string, retryCount: number = 2): Promise<ExtractionResult<ProductsExtractionResult>> {
    const dataStructure = {
      store_info: {
        name: "string",
        description: "string"
      },
      product_categories: [
        {
          category: "string",
          products: [
            {
              name: "string",
              price: "string",
              original_price: "string or null",
              discount: "string or null",
              specifications: {},
              availability: "string",
              payment_plans: {}
            }
          ]
        }
      ],
      payment_options: ["string"],
      delivery_info: "string"
    };

    return this.extractWithRetry<ProductsExtractionResult>(url, dataStructure, retryCount);
  }

  /**
   * Extract custom data structure from website
   */
  async customExtract<T = any>(
    url: string,
    dataStructure: Record<string, any>,
    additionalInstructions: string = "",
    retryCount: number = 3
  ): Promise<ExtractionResult<T>> {
    return this.extractWithRetry<T>(url, dataStructure, retryCount, additionalInstructions);
  }

  /**
   * Analyze competitor website for market intelligence
   */
  async analyzeCompetitor(url: string): Promise<ExtractionResult<CompetitorAnalysisResult>> {
    const structure = {
      brand_intelligence: {
        company_name: "string",
        value_proposition: "string",
        brand_voice: "string",
        visual_identity: "string"
      },
      service_offerings: [
        {
          service: "string",
          description: "string",
          pricing_model: "string",
          target_audience: "string"
        }
      ],
      content_strategy: {
        content_types: ["string"],
        messaging_themes: ["string"],
        call_to_actions: ["string"]
      },
      competitive_advantages: ["string"],
      market_positioning: "string"
    };

    const additionalInstructions = `
    Focus on:
    - Brand messaging and tone
    - Content marketing approach  
    - Unique value propositions
    - Target audience signals
    - Pricing and business model
    `;

    return this.customExtract<CompetitorAnalysisResult>(url, structure, additionalInstructions);
  }

  /**
   * Extract data from multiple websites
   */
  async batchExtract(
    urls: string[],
    extractionType: 'services' | 'products' = 'services'
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    for (const url of urls) {
      console.log(`Processing ${url}...`);

      let result: ExtractionResult;
      if (extractionType === 'services') {
        result = await this.extractServices(url);
      } else if (extractionType === 'products') {
        result = await this.extractProducts(url);
      } else {
        throw new Error(`Unknown extraction type: ${extractionType}`);
      }

      results.push(result);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Internal method to handle extraction with retries
   */
  private async extractWithRetry<T>(
    url: string,
    dataStructure: Record<string, any>,
    retryCount: number,
    additionalInstructions: string = ""
  ): Promise<ExtractionResult<T>> {
    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        console.log(`Attempting extraction from ${url} (attempt ${attempt + 1}/${retryCount})`);

        // First, fetch the website content
        const websiteContent = await this.fetchWebsiteContent(url);
        
        const prompt = this.buildPrompt(url, websiteContent, dataStructure, additionalInstructions);

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4000,
          tools: [
            {
              name: "web_search",
              description: "Search the web for information",
              input_schema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query"
                  }
                },
                required: ["query"]
              }
            },
            {
              name: "web_fetch",
              description: "Fetch content from a URL",
              input_schema: {
                type: "object",
                properties: {
                  url: {
                    type: "string",
                    description: "URL to fetch"
                  }
                },
                required: ["url"]
              }
            }
          ],
          messages: [{ role: 'user', content: prompt }]
        });

        // Handle tool calls if Claude wants to use them
        const data = await this.handleResponseWithTools<T>(response, url, dataStructure, additionalInstructions);

        if (data) {
          console.log(`Successfully extracted data from ${url}`);
          return {
            success: true,
            data,
            error: null,
            url,
            timestamp: Date.now()
          };
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Extraction attempt ${attempt + 1} failed:`, errorMessage);
        console.error('Full error:', error);
        
        if (attempt === retryCount - 1) {
          return {
            success: false,
            data: null,
            error: errorMessage,
            url,
            timestamp: Date.now()
          };
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      data: null,
      error: "Max retries exceeded",
      url,
      timestamp: Date.now()
    };
  }

  /**
   * Fetch website content using cheerio
   */
  private async fetchWebsiteContent(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts and styles but keep navigation and content
    $('script, style, noscript').remove();

    // Extract key content sections
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const headings = $('h1, h2, h3, h4, h5, h6').map((_, el) => $(el).text().trim()).get();
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20);
    const listItems = $('li').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 10);
    const navigationItems = $('nav a, header a, .menu a, .nav a').map((_, el) => $(el).text().trim()).get();

    return `
WEBSITE: ${url}
TITLE: ${title}
META DESCRIPTION: ${metaDescription}

HEADINGS:
${headings.join('\n')}

NAVIGATION ITEMS:
${navigationItems.join(' | ')}

MAIN CONTENT:
${paragraphs.slice(0, 20).join('\n\n')}

KEY POINTS:
${listItems.slice(0, 30).join('\n')}

FULL BODY TEXT:
${$('body').text().replace(/\s+/g, ' ').trim()}
    `.trim();
  }

  /**
   * Build the extraction prompt
   */
  private buildPrompt(
    url: string,
    websiteContent: string,
    dataStructure: Record<string, any>,
    additionalInstructions: string
  ): string {
    return `You are analyzing a website to extract business information. 

WEBSITE: ${url}
CONTENT: ${websiteContent.substring(0, 8000)}

Extract information in this JSON format:
${JSON.stringify(dataStructure, null, 2)}

RULES:
- Return ONLY valid JSON
- No explanations or markdown
- Use null for missing data
- For retail sites: List actual products (Smartphones, Laptops) not marketing slogans
- Extract real prices when visible

${additionalInstructions}

JSON Response:`;
  }

  /**
   * Handle Claude's response with potential tool calls
   */
  private async handleResponseWithTools<T>(
    response: Anthropic.Messages.Message,
    url: string,
    dataStructure: Record<string, any>,
    additionalInstructions: string
  ): Promise<T | null> {
    // Check if Claude wants to use tools
    const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
    
    if (toolUseBlocks.length > 0) {
      console.log(`🔧 Claude wants to use ${toolUseBlocks.length} tools`);
      
      // For now, we'll skip tool execution and just parse the text response
      // In a full implementation, we'd execute the tools and continue the conversation
      const textBlocks = response.content.filter(block => block.type === 'text');
      if (textBlocks.length > 0) {
        return this.parseTextResponse<T>(textBlocks[0].text);
      }
      
      // If no text response, return null to trigger retry
      return null;
    }
    
    // No tools used, parse normally
    return this.parseResponse<T>(response);
  }

  /**
   * Parse text response to extract JSON
   */
  private parseTextResponse<T>(text: string): T | null {
    let cleanText = text.trim();

    // Remove markdown code blocks
    if (cleanText.includes('```json')) {
      cleanText = cleanText.split('```json')[1].split('```')[0].trim();
    } else if (cleanText.includes('```')) {
      cleanText = cleanText.split('```')[1].split('```')[0].trim();
    }

    // Try to parse JSON
    try {
      return JSON.parse(cleanText) as T;
    } catch (error) {
      console.error('JSON parse error:', error);
      console.debug('Text that failed to parse:', cleanText.substring(0, 500));
      return null;
    }
  }

  /**
   * Parse Claude's response to extract JSON data
   */
  private parseResponse<T>(response: Anthropic.Messages.Message): T | null {
    for (const block of response.content) {
      if (block.type === 'text') {
        let text = block.text.trim();

        // Remove markdown code blocks
        if (text.includes('```json')) {
          text = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
          text = text.split('```')[1].split('```')[0].trim();
        }

        // Try to parse JSON
        try {
          return JSON.parse(text) as T;
        } catch (error) {
          console.error('JSON parse error:', error);
          console.debug('Text that failed to parse:', text.substring(0, 500));
          return null;
        }
      }
    }

    return null;
  }
}
