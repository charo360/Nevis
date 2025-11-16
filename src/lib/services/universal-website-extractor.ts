/**
 * Universal Website Extractor - TypeScript Version
 * Automatically detects structure and extracts products/services from ANY website
 */

interface BusinessInfo {
  name: string;
  type: 'e-commerce' | 'service' | 'saas' | 'marketplace' | 'other';
  description: string;
  website: string;
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
    social_media: Record<string, string>;
    hours: string | null;
  };
}

interface PricingInfo {
  base_price: {
    amount: number | null;
    currency: string;
    formatted: string;
    price_type: 'fixed' | 'range' | 'contact' | 'free';
  };
  original_price: {
    amount: number | null;
    formatted: string | null;
  };
  discount: {
    percentage: number | null;
    amount: number | null;
    description: string | null;
  };
  price_range: {
    min: number | null;
    max: number | null;
  };
  pricing_note: string | null;
}

interface PaymentOption {
  type: string;
  name: string;
  amount: number | null;
  period: string;
  duration: string;
  formatted: string;
}

interface ProductVariant {
  name: string;
  options: string[];
  price_difference: string | null;
}

interface ExtractedItem {
  name: string;
  full_description: string;
  specifications: Record<string, string>;
  pricing: PricingInfo;
  payment_options: PaymentOption[];
  features: string[];
  availability: 'in stock' | 'out of stock' | 'pre-order' | 'contact';
  variants: ProductVariant[];
  images: string[];
  tags: string[];
  metadata: {
    sku: string | null;
    brand: string | null;
    model: string | null;
    warranty: string | null;
    additional_info: Record<string, any>;
  };
}

interface OfferingCategory {
  category: string;
  subcategory: string | null;
  type: 'product' | 'service' | 'subscription' | 'other';
  items: ExtractedItem[];
}

interface SpecialOffer {
  title: string;
  description: string;
  conditions: string;
  valid_until: string | null;
}

interface ShippingDelivery {
  available: boolean;
  methods: string[];
  cost: string | null;
  locations: string[];
  estimated_time: string | null;
}

interface UniversalExtractionResult {
  business_info: BusinessInfo;
  offerings: OfferingCategory[];
  special_offers: SpecialOffer[];
  shipping_delivery: ShippingDelivery;
  return_policy: string | null;
  total_items_extracted: number;
  extraction_metadata: {
    timestamp: string;
    completeness: 'complete' | 'partial';
    notes: string | null;
  };
}

interface WebsiteAnalysis {
  type: 'e-commerce' | 'service' | 'saas' | 'marketplace' | 'other';
  primary_offerings: string[];
  has_pricing: boolean;
  has_payment_plans: boolean;
  category_structure: string[];
  special_features: string[];
}

export class UniversalWebsiteExtractor {
  private apiKey: string;
  private model = 'claude-sonnet-4-20250514';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Universal extraction that works on ANY website
   */
  async extractEverything(
    url: string,
    outputFormat: 'formatted' | 'json' | 'both' = 'both'
  ): Promise<{
    url: string;
    extraction_date: string;
    website_type: string;
    formatted_text?: string;
    json_data?: UniversalExtractionResult;
  }> {
    console.log(`🔍 Starting universal extraction for: ${url}`);

    // Step 1: Analyze website structure first
    const websiteAnalysis = await this.analyzeWebsiteStructure(url);
    console.log(`📊 Website type detected: ${websiteAnalysis.type}`);

    // Step 2: Extract based on detected type
    let formattedText: string | undefined;
    let jsonData: UniversalExtractionResult | undefined;

    if (outputFormat === 'formatted' || outputFormat === 'both') {
      formattedText = await this.extractFormatted(url, websiteAnalysis);
    }

    if (outputFormat === 'json' || outputFormat === 'both') {
      jsonData = await this.extractJson(url, websiteAnalysis);
    }

    return {
      url,
      extraction_date: new Date().toISOString(),
      website_type: websiteAnalysis.type,
      formatted_text: formattedText,
      json_data: jsonData
    };
  }

  /**
   * Analyze website to understand its structure
   */
  private async analyzeWebsiteStructure(url: string): Promise<WebsiteAnalysis> {
    const prompt = `Analyze the website at ${url} and determine:

1. What type of website is this?
   - E-commerce store (selling physical products)
   - Service provider (offering services)
   - SaaS platform (software/digital products)
   - Marketplace
   - Other

2. What does it sell/offer?
   - List main categories
   - Identify if there are prices
   - Note if there are payment plans or special offers

3. How is content organized?
   - Category structure
   - Subcategories
   - Product/service groupings

Return as JSON:
{
  "type": "e-commerce|service|saas|marketplace|other",
  "primary_offerings": ["string"],
  "has_pricing": boolean,
  "has_payment_plans": boolean,
  "category_structure": ["string"],
  "special_features": ["string"]
}

Analyze now.`;

    const response = await this.callClaude(prompt, 2000);
    return this.parseJsonResponse(response) as WebsiteAnalysis;
  }

  /**
   * Extract in formatted text - works for ANY website
   */
  private async extractFormatted(url: string, analysis: WebsiteAnalysis): Promise<string> {
    const websiteType = analysis.type || 'unknown';

    const prompt = `Extract ALL offerings from ${url} in this format:

[COMPANY/STORE NAME] - [PRODUCT LIST / SERVICES / OFFERINGS]

[CATEGORY 1]
[Subcategory if exists]
* Item name (specifications/details) - Price/Info (additional details like payment plans, discounts)
* Item name (specifications/details) - Price/Info

[CATEGORY 2]
* Item name (details) - Price/Info

FORMATTING RULES:
1. Use asterisks (*) for bullet points
2. Put ALL specifications/details in parentheses: (RAM, storage, size, duration, etc.)
3. Show price with currency exactly as shown on site
4. If discount exists: "Price (was OldPrice)"
5. If payment plans exist: "(Payment plan: amount/period)"
6. Use "From Price" if price ranges exist
7. Use "Contact for pricing" if no price shown
8. Group logically by category and subcategory
9. Extract EVERYTHING - don't miss any items
10. Maintain hierarchical structure

IMPORTANT:
- Extract ALL products/services on the website
- Include ALL details (specs, features, descriptions)
- Capture ALL pricing information
- Note ALL special offers, discounts, payment options
- Be comprehensive and thorough

Website type detected: ${websiteType}

Begin extraction now.`;

    const response = await this.callClaude(prompt, 4000);
    return this.extractTextResponse(response);
  }

  /**
   * Extract as structured JSON - works for ANY website
   */
  private async extractJson(url: string, analysis: WebsiteAnalysis): Promise<UniversalExtractionResult> {
    const prompt = `Extract ALL offerings from ${url} in this universal JSON structure:

{
  "business_info": {
    "name": "string",
    "type": "e-commerce|service|saas|marketplace|other",
    "description": "string",
    "website": "${url}",
    "contact": {
      "phone": "string or null",
      "email": "string or null",
      "address": "string or null",
      "social_media": {},
      "hours": "string or null"
    }
  },
  "offerings": [
    {
      "category": "string",
      "subcategory": "string or null",
      "type": "product|service|subscription|other",
      "items": [
        {
          "name": "string",
          "full_description": "string",
          "specifications": {
            "key1": "value1",
            "key2": "value2"
          },
          "pricing": {
            "base_price": {
              "amount": "number or null",
              "currency": "string",
              "formatted": "string",
              "price_type": "fixed|range|contact|free"
            },
            "original_price": {
              "amount": "number or null",
              "formatted": "string or null"
            },
            "discount": {
              "percentage": "number or null",
              "amount": "number or null",
              "description": "string or null"
            },
            "price_range": {
              "min": "number or null",
              "max": "number or null"
            },
            "pricing_note": "string or null"
          },
          "payment_options": [
            {
              "type": "string (e.g., installment, subscription, one-time)",
              "name": "string (e.g., Lipa Polepole, Monthly Plan)",
              "amount": "number or null",
              "period": "string (e.g., daily, weekly, monthly)",
              "duration": "string (e.g., 6 months, 1 year)",
              "formatted": "string (e.g., KSh 155/day)"
            }
          ],
          "features": ["string"],
          "availability": "string (in stock|out of stock|pre-order|contact)",
          "variants": [
            {
              "name": "string (e.g., size, color, storage)",
              "options": ["string"],
              "price_difference": "string or null"
            }
          ],
          "images": ["string (URLs if available)"],
          "tags": ["string (brand, model, category tags)"],
          "metadata": {
            "sku": "string or null",
            "brand": "string or null",
            "model": "string or null",
            "warranty": "string or null",
            "additional_info": {}
          }
        }
      ]
    }
  ],
  "special_offers": [
    {
      "title": "string",
      "description": "string",
      "conditions": "string",
      "valid_until": "string or null"
    }
  ],
  "shipping_delivery": {
    "available": "boolean",
    "methods": ["string"],
    "cost": "string or null",
    "locations": ["string"],
    "estimated_time": "string or null"
  },
  "return_policy": "string or null",
  "total_items_extracted": "number",
  "extraction_metadata": {
    "timestamp": "${new Date().toISOString()}",
    "completeness": "string (complete|partial)",
    "notes": "string or null"
  }
}

CRITICAL INSTRUCTIONS:
1. Extract EVERY SINGLE item/product/service from the website
2. Use web_fetch to get the main page, then web_search to find all product pages
3. Parse ALL pricing information (numbers, currency, payment plans)
4. Capture ALL specifications and features
5. Note ALL discounts and special offers
6. Include ALL payment options and plans
7. Extract contact information
8. Be extremely thorough - check multiple pages if needed
9. Return ONLY valid JSON - no explanations, no markdown
10. If information is missing, use null, don't skip fields

Begin comprehensive extraction now.`;

    const response = await this.callClaude(prompt, 8000);
    return this.parseJsonResponse(response) as UniversalExtractionResult;
  }

  /**
   * Smart extraction that automatically finds and extracts from all relevant pages
   */
  async smartExtract(url: string): Promise<{
    base_url: string;
    pages_analyzed: number;
    extraction_date: string;
    all_offerings: OfferingCategory[];
    total_items: number;
  }> {
    console.log(`🧠 Starting smart extraction for: ${url}`);

    const prompt = `Analyze ${url} and:

1. Identify ALL pages that contain products/services/offerings
2. Find category pages, product listing pages, service pages
3. Extract the complete sitemap structure

Return as JSON:
{
  "main_page": "${url}",
  "category_pages": ["url1", "url2"],
  "product_pages": ["url1", "url2"],
  "service_pages": ["url1", "url2"],
  "other_important_pages": ["url1", "url2"]
}

Then extract everything from all these pages.`;

    // First, discover all pages
    const discoveryResponse = await this.callClaude(prompt, 2000);
    const pages = this.parseJsonResponse(discoveryResponse) as any;

    // Now extract from all discovered pages
    const allPages: string[] = [];
    allPages.push(pages.main_page || url);
    allPages.push(...(pages.category_pages || []));
    allPages.push(...(pages.product_pages || []));
    allPages.push(...(pages.service_pages || []));

    return this.extractFromMultiplePages(url, allPages.slice(0, 10)); // Limit to 10 pages
  }

  /**
   * Extract from multiple pages of the same website
   */
  async extractFromMultiplePages(baseUrl: string, pageUrls: string[]): Promise<{
    base_url: string;
    pages_analyzed: number;
    extraction_date: string;
    all_offerings: OfferingCategory[];
    total_items: number;
  }> {
    const allData = {
      base_url: baseUrl,
      pages_analyzed: pageUrls.length,
      extraction_date: new Date().toISOString(),
      all_offerings: [] as OfferingCategory[],
      total_items: 0
    };

    for (const pageUrl of pageUrls) {
      console.log(`📄 Extracting from: ${pageUrl}`);
      try {
        const result = await this.extractEverything(pageUrl, 'json');

        if (result.json_data) {
          allData.all_offerings.push(...result.json_data.offerings);
        }
      } catch (error) {
        console.error(`❌ Failed to extract from ${pageUrl}:`, error);
      }
    }

    // Calculate total items
    allData.total_items = allData.all_offerings.reduce(
      (total, category) => total + category.items.length,
      0
    );

    return allData;
  }

  /**
   * Call Claude API with tools
   */
  private async callClaude(prompt: string, maxTokens: number = 2000): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        tools: this.getTools(),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Web tools for Claude API
   */
  private getTools() {
    return [
      {
        name: 'web_search',
        description: 'Search the web for information',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      },
      {
        name: 'web_fetch',
        description: 'Fetch content from a specific URL',
        input_schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch' }
          },
          required: ['url']
        }
      }
    ];
  }

  /**
   * Extract text from Claude response
   */
  private extractTextResponse(response: any): string {
    for (const block of response.content || []) {
      if (block.type === 'text') {
        return block.text;
      }
    }
    return '';
  }

  /**
   * Parse JSON from Claude response
   */
  private parseJsonResponse(response: any): any {
    for (const block of response.content || []) {
      if (block.type === 'text') {
        let text = block.text.trim();

        // Remove markdown code blocks
        if (text.includes('```json')) {
          text = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
          text = text.split('```')[1].split('```')[0].trim();
        }

        try {
          return JSON.parse(text);
        } catch (error) {
          console.error('JSON parse error:', error);
          return { error: 'Failed to parse', raw: text.substring(0, 500) };
        }
      }
    }

    return {};
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * One-liner: Get formatted text from any website
 */
export async function quickExtractFormatted(url: string, apiKey: string): Promise<string> {
  const extractor = new UniversalWebsiteExtractor(apiKey);
  const result = await extractor.extractEverything(url, 'formatted');
  return result.formatted_text || '';
}

/**
 * One-liner: Get JSON data from any website
 */
export async function quickExtractJson(url: string, apiKey: string): Promise<UniversalExtractionResult | null> {
  const extractor = new UniversalWebsiteExtractor(apiKey);
  const result = await extractor.extractEverything(url, 'json');
  return result.json_data || null;
}
