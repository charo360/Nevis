/**
 * Claude-based Website Analysis API Route
 * Simple, reliable approach using direct Claude API calls
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🎯 [analyze-website-claude] POST endpoint called');
  
  try {
    const body = await request.json();
    console.log('📦 [analyze-website-claude] Request body:', body);
    
    const { url, websiteUrl, analysisType = 'products' } = body;
    
    const targetUrl = url || websiteUrl;
    console.log('🌐 [analyze-website-claude] Target URL:', targetUrl);
    console.log('📊 [analyze-website-claude] Analysis type:', analysisType);
    
    if (!targetUrl) {
      console.error('❌ [analyze-website-claude] No URL provided');
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Support multiple Claude API keys for fallback/rotation
    const apiKeys = [
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_API_KEY_2,
      process.env.ANTHROPIC_API_KEY_3,
    ].filter(Boolean); // Remove undefined/null keys
    
    if (apiKeys.length === 0) {
      console.error('❌ No ANTHROPIC_API_KEY found in environment variables');
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Starting Claude analysis for: ${targetUrl}`);
    console.log(`📊 Analysis type: ${analysisType}`);
    console.log(`🔑 Available API Keys: ${apiKeys.length}`);

    // Step 1: Fetch website content
    const websiteResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!websiteResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch website content' },
        { status: 400 }
      );
    }

    const html = await websiteResponse.text();
    console.log(`📄 Website HTML length: ${html.length}`);

    // Step 2: Extract basic content using simple parsing
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title';
    const metaDescription = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)?.[1] || '';
    
    // Extract navigation items
    const navMatches = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/gi) || [];
    const navText = navMatches.join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Clean body text
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Increased limit to capture many more products

    console.log(`📝 Extracted - Title: ${title}, Nav: ${navText.length} chars, Body: ${bodyText.length} chars`);

    // Step 3: Build analysis prompt based on type
    let dataStructure;
    let analysisInstructions;

    if (analysisType === 'products') {
      dataStructure = {
        business_analysis: {
          business_type: "string", // e.g., "Electronics Retailer", "Fashion E-commerce", "Tech Store"
          industry: "string", // e.g., "Consumer Electronics", "Fashion & Apparel", "Technology"
          target_market: "string", // e.g., "Tech enthusiasts, professionals, students"
          business_model: "string" // e.g., "B2C E-commerce", "Retail + Online", "Wholesale + Retail"
        },
        store_info: {
          name: "string",
          detailed_description: "string", // 3-4 sentences with specific details about what they do, their specialties, and unique value
          location: "string",
          established: "string",
          specialties: ["string"] // What they're known for or specialize in
        },
        products: [
          {
            name: "string", // e.g., "iPhone 14 Plus", "Samsung Galaxy S23", "Silicone AirPods Case"
            category: "string", // e.g., "Smartphones", "Accessories", "Laptops"
            description: "string", // Brief product description
            price: "string", // e.g., "KSh 120,000" or "KSh 750.00"
            specifications: ["string"], // e.g., ["128GB Storage", "6GB RAM", "Cordless"]
            payment_options: ["string"], // e.g., ["Lipa Polepole available", "Deposit KSh 48,000"]
            availability: "string", // e.g., "In Stock", "Out of Stock"
            brand: "string" // e.g., "Apple", "Samsung", "Oraimo"
          }
        ],
        services_offered: ["string"], // Installation, warranty, support, etc.
        payment_options: ["string"],
        delivery_info: {
          methods: ["string"],
          coverage: "string",
          timeframe: "string"
        },
        contact_info: {
          phone: "string",
          email: "string",
          address: "string",
          hours: "string",
          social_media: ["string"]
        },
        visual_style: "string", // e.g., "Modern design with blue and white colors, product-focused imagery"
        writing_tone: "string" // e.g., "Professional and approachable, customer-focused language"
      };
      
      analysisInstructions = `This is a retail/e-commerce website. Extract comprehensive business information:

BUSINESS ANALYSIS:
- Determine specific business type (not just "retail" - be specific like "Electronics Retailer", "Fashion Boutique")
- Identify the industry and target market
- Understand their business model

DETAILED DESCRIPTIONS:
- Business description should be 3-4 detailed sentences explaining what they do, their specialties, and what makes them unique
- Product descriptions should include features, specifications, and key selling points
- Be specific about what products they actually sell, not generic categories

PRODUCT DETAILS (CRITICAL FOR RETAIL):
🎯 **EXTRACT 10-20 PRODUCTS WITH SPECIFIC EXAMPLES**
- For each product category, include 2-3 SPECIFIC models/variants with their exact prices
- Example: Instead of just "iPhones", extract "iPhone 14 Pro Max - KSh 150,000, iPhone 13 - KSh 100,000, iPhone 12 - KSh 85,000"
- Extract SPECIFIC product names AND their variants (iPhone 14 Plus 128GB, Samsung Galaxy S23 Ultra, MacBook Pro M2 16GB, etc.)
- Extract EXACT prices with currency for EACH variant (KSh 150,000, KSh 100,000, KSh 85,000)
- In the DESCRIPTION field, list 2-3 specific models with their prices
- Keep specifications simple and focused (2-3 key specs per product)
- Include payment options if visible (Lipa Polepole, installments, etc.)

🎯 **DESCRIPTION FORMAT (CRITICAL):**
Start with: "Model 1 - KSh X,XXX, Model 2 - KSh X,XXX. Features and payment options."
Example: "iPhone 14 Pro Max - KSh 150,000, iPhone 13 - KSh 100,000. iOS smartphones. Lipa Polepole available."

🎯 **WHERE TO LOOK:**
- Product listings and grids on homepage
- "Featured Products", "Best Sellers", "On Sale" sections
- Navigation menu items with product models
- Product showcases with pricing
- Aim for 10-20 product categories, each with 2-3 specific examples

PAYMENT OPTIONS TO EXTRACT:
- Cash prices
- Installment plans (Lipa Polepole, hire purchase, etc.)
- Deposit amounts and payment schedules
- Credit terms and conditions
- Mobile money options (M-Pesa, Airtel Money, etc.)

LOOK EVERYWHERE FOR PRODUCTS:
- Product listing pages with individual items
- Navigation menus and category links
- Featured/recommended product sections
- "Shop by Category" sections
- Pricing tables with different storage/memory options
- Payment plan calculators or options
- Product specification sheets
- Stock availability indicators
- Brand-specific sections (Apple Store, Samsung section, etc.)
- Homepage product showcases
- "Popular Products" or "Trending" sections

VISUAL STYLE & WRITING TONE (keep brief):
- visual_style: One sentence describing colors, design style, and imagery (e.g., "Modern blue and white design with product photos")
- writing_tone: One sentence about style and personality (e.g., "Professional and customer-focused")`;
      
    } else {
      dataStructure = {
        business_analysis: {
          business_type: "string", // e.g., "Digital Marketing Agency", "Financial Services", "Consulting Firm"
          industry: "string", // e.g., "Marketing & Advertising", "Financial Services", "Business Consulting"
          target_market: "string", // e.g., "Small businesses, startups, enterprises"
          business_model: "string" // e.g., "B2B Services", "Subscription-based", "Project-based"
        },
        company_info: {
          name: "string",
          detailed_description: "string", // 3-4 sentences with specific details about their expertise and unique value
          location: "string",
          established: "string",
          team_size: "string",
          specialties: ["string"], // What they specialize in or are known for
          certifications: ["string"] // Any certifications, awards, or credentials
        },
        services: [
          {
            service_name: "string",
            detailed_description: "string", // Comprehensive description of what this service includes
            features: ["string"], // Specific features or components of this service
            benefits: ["string"], // Key benefits or outcomes for clients
            process: ["string"], // Steps or methodology if mentioned
            pricing_model: "string", // How they price this service (hourly, project-based, etc.)
            target_clients: "string" // Who this service is for
          }
        ],
        client_info: {
          typical_clients: ["string"], // Types of clients they work with
          case_studies: ["string"], // Any success stories or examples mentioned
          testimonials: ["string"] // Client testimonials if visible
        },
        contact: {
          phone: "string",
          email: "string",
          address: "string",
          hours: "string",
          social_media: ["string"]
        },
        visual_style: "string",
        writing_tone: "string"
      };
      
      analysisInstructions = `This is a service-based business. Extract comprehensive business information:

BUSINESS ANALYSIS:
- Determine specific business type (be precise like "Digital Marketing Agency", "Financial Advisory", "IT Consulting")
- Identify the industry and target market
- Understand their business model and approach

DETAILED DESCRIPTIONS:
- Business description should be 3-4 detailed sentences explaining their expertise, experience, and unique value proposition
- Service descriptions should be comprehensive, explaining what's included, the process, and expected outcomes
- Focus on their methodology, approach, and what makes them different

SERVICE DETAILS:
- Extract specific service offerings with detailed descriptions
- Include pricing models when mentioned (hourly, project-based, retainer, etc.)
- Note any specializations or niche expertise
- Look for process descriptions or methodologies

LOOK FOR:
- About us sections for company background
- Service pages with detailed descriptions
- Team information and expertise
- Client testimonials or case studies
- Certifications or credentials

VISUAL STYLE & WRITING TONE (keep brief):
- visual_style: One sentence describing colors, design, and imagery
- writing_tone: One sentence about style and personality`;
    }

    const prompt = `Analyze this website and extract business information in JSON format.

Website: ${targetUrl}
Title: ${title}
Meta Description: ${metaDescription}
Navigation: ${navText}
Content: ${bodyText}

${analysisInstructions}

Return JSON in this exact format:
${JSON.stringify(dataStructure, null, 2)}

CRITICAL RULES:
- Extract 10-20 product categories
- EACH description starts with 2-3 models and prices: "Model 1 - KSh X, Model 2 - KSh Y"
- NO "varies by model" - give specific examples
- Return ONLY valid JSON, no markdown
- Keep it simple and parseable

EXAMPLE of what to extract:
{
  "name": "iPhones",
  "description": "iPhone 14 Pro Max 256GB - KSh 150,000, iPhone 13 128GB - KSh 100,000, iPhone 12 64GB - KSh 85,000. Premium Apple smartphones with iOS, advanced camera systems, and Face ID. Lipa Polepole installments available.",
      "payment_options": ["Deposit KSh 48,000, Weekly KSh 5,400 for 6 months"]
    },
    {
      "model": "256GB", 
      "price": "KSh 125,000",
      "specifications": ["256GB Storage", "6GB RAM", "6.7-inch Display"],
      "payment_options": ["Deposit KSh 50,000, Weekly KSh 5,625 for 6 months"]
    }
  ]
}

JSON Response:`;

    // Step 4: Call Claude API with multiple key fallback
    let claudeResponse;
    let lastError;
    
    // Try each API key
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
      const currentKey = apiKeys[keyIndex] as string; // Type assertion - we filtered out undefined
      console.log(`🔑 Trying API key ${keyIndex + 1}/${apiKeys.length}...`);
      
      // Try with retry logic for overload errors
      let retryCount = 0;
      const maxRetries = 2; // 2 retries per key
      
      while (retryCount <= maxRetries) {
        try {
          claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': currentKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 4096, // Increased to handle longer responses
              temperature: 0.7,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ]
            })
          });
          
          // If successful, we're done!
          if (claudeResponse.ok) {
            console.log(`✅ Success with API key ${keyIndex + 1}`);
            break;
          }
          
          // If overloaded and retries left, wait and retry with same key
          if (claudeResponse.status === 529 && retryCount < maxRetries) {
            const waitTime = Math.pow(2, retryCount) * 500; // 500ms, 1s
            console.log(`⏳ Key ${keyIndex + 1} overloaded, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
            continue;
          }
          
          // Non-retryable error or max retries reached
          lastError = { status: claudeResponse.status, response: claudeResponse };
          console.log(`❌ Key ${keyIndex + 1} failed with status ${claudeResponse.status}`);
          break; // Try next key
          
        } catch (error) {
          lastError = error;
          console.log(`❌ Key ${keyIndex + 1} threw error:`, error.message);
          break; // Try next key
        }
      }
      
      // If we got a successful response, stop trying other keys
      if (claudeResponse?.ok) {
        break;
      }
    }

    // Check if we got a successful response
    if (!claudeResponse || !claudeResponse.ok) {
      console.error('❌ All Claude API keys failed');
      
      if (claudeResponse) {
        const errorText = await claudeResponse.text();
        console.error('   Status:', claudeResponse.status, claudeResponse.statusText);
        console.error('   Response:', errorText);
        
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorJson.message || errorText;
        } catch {
          // Keep as text
        }
        
        return NextResponse.json(
          { 
            success: false,
            error: `Claude API failed: ${errorDetails}`,
            details: errorText,
            status: claudeResponse.status
          },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'All Claude API keys failed or are overloaded',
            details: lastError
          },
          { status: 500 }
        );
      }
    }

    const claudeResult = await claudeResponse.json();
    console.log('✅ Claude responded successfully');

    // Step 5: Parse Claude's response
    const responseText = claudeResult.content?.[0]?.text || '';
    let parsedData = null;

    try {
      // Clean up the response text
      let cleanText = responseText.trim();
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0].trim();
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0].trim();
      }
      
      parsedData = JSON.parse(cleanText);
      console.log('✅ Successfully parsed JSON response');
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw response length:', responseText.length);
      console.log('Raw response preview (first 1000 chars):', responseText.substring(0, 1000));
      console.log('Raw response preview (last 500 chars):', responseText.substring(Math.max(0, responseText.length - 500)));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse Claude response as JSON',
          raw_response: responseText.substring(0, 1000),
          response_length: responseText.length
        },
        { status: 422 }
      );
    }

    console.log(`✅ Claude analysis completed successfully for ${targetUrl}`);
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      url: targetUrl,
      timestamp: Date.now(),
      analysisType
    });

  } catch (error) {
    console.error('Claude website analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to analyze website: ${errorMessage}`,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const analysisType = searchParams.get('type') || 'services';

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Convert GET to POST format
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url, analysisType }),
    headers: { 'Content-Type': 'application/json' }
  });

  return POST(postRequest);
}
