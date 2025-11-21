import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EcommerceAnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function analyzeEcommerceBrandWithClaude(
  websiteUrl: string,
  ecommerceContext: any
): Promise<EcommerceAnalysisResult> {
  try {
    console.log('🤖 Starting Claude e-commerce analysis...');

    // Create e-commerce specific prompt
    const prompt = createEcommerceAnalysisPrompt(websiteUrl, ecommerceContext);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse Claude's response
    const analysisResult = parseClaudeEcommerceResponse(content.text);

    console.log('✅ Claude e-commerce analysis complete');
    return {
      success: true,
      data: analysisResult
    };

  } catch (error) {
    console.error('❌ Claude e-commerce analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Claude analysis failed'
    };
  }
}

function createEcommerceAnalysisPrompt(websiteUrl: string, ecommerceContext: any): string {
  const products = ecommerceContext?.products || [];
  const platform = ecommerceContext?.platform || 'unknown';
  const totalProducts = ecommerceContext?.totalProducts || 0;
  const brandColors = ecommerceContext?.brandColors || [];

  return `You are an expert e-commerce brand analyst. I need you to analyze an e-commerce store and extract comprehensive brand information.

**STORE INFORMATION:**
- Website URL: ${websiteUrl}
- Platform: ${platform}
- Total Products: ${totalProducts}
- Brand Colors: ${brandColors.join(', ')}

**EXTRACTED PRODUCTS (First 10):**
${products.slice(0, 10).map((product: any, index: number) => 
  `${index + 1}. ${product.name || 'Unnamed Product'}
     Price: ${product.price || 'N/A'}
     Description: ${product.description?.substring(0, 100) || 'No description'}...`
).join('\n')}

**ANALYSIS TASK:**
Based on the extracted e-commerce data above, analyze this store and provide a comprehensive brand profile. Focus on:

1. **Business Analysis**: What type of business is this? What do they sell?
2. **Target Audience**: Who are their customers based on products and pricing?
3. **Brand Positioning**: How do they position themselves in the market?
4. **Product Categories**: What are their main product categories/services?
5. **Brand Voice**: What tone and style would fit this brand?
6. **Competitive Advantages**: What makes them unique?

**IMPORTANT**: Base your analysis primarily on the EXTRACTED PRODUCT DATA above, not on trying to visit the website. The products, prices, and descriptions tell the real story of this business.

**OUTPUT FORMAT (JSON):**
{
  "businessName": "Extract or infer business name",
  "description": "2-3 sentence business description based on products",
  "businessType": "E-commerce category (e.g., Fashion Retailer, Electronics Store, etc.)",
  "services": "Main product categories, one per line:\\nCategory 1: Description\\nCategory 2: Description",
  "targetAudience": "Primary customer demographic based on products and pricing",
  "visualStyle": "Recommended visual style based on product types",
  "writingTone": "Recommended brand voice (professional, casual, luxury, etc.)",
  "contentThemes": "Content themes that would resonate with this audience",
  "keyFeatures": "Key selling points based on product analysis",
  "competitiveAdvantages": "What makes this store unique based on product mix",
  "location": "If determinable from context",
  "colorPalette": {
    "primary": "${brandColors[0] || '#3B82F6'}",
    "secondary": "${brandColors[1] || '#10B981'}"
  },
  "contactInfo": {
    "phone": "",
    "email": "",
    "address": ""
  },
  "socialMedia": {
    "facebook": "",
    "instagram": "",
    "twitter": "",
    "linkedin": ""
  }
}

Respond with ONLY the JSON object, no additional text.`;
}

function parseClaudeEcommerceResponse(response: string): any {
  try {
    // Clean the response to extract JSON
    let cleanedResponse = response.trim();
    
    // Remove any markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find JSON object
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON object found in response');
    }
    
    const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);
    
    // Validate required fields
    if (!parsed.businessName || !parsed.description) {
      throw new Error('Missing required fields in Claude response');
    }
    
    return parsed;
    
  } catch (error) {
    console.error('❌ Failed to parse Claude e-commerce response:', error);
    console.error('Raw response:', response);
    
    // Return fallback data
    return {
      businessName: 'E-commerce Store',
      description: 'An online store offering various products to customers.',
      businessType: 'E-commerce Store',
      services: 'Online Retail: Various products and services',
      targetAudience: 'Online shoppers',
      visualStyle: 'Modern and clean e-commerce design',
      writingTone: 'Professional and customer-friendly',
      contentThemes: 'Product showcases, customer testimonials, shopping guides',
      keyFeatures: 'Online shopping, product variety, customer service',
      competitiveAdvantages: 'Convenient online shopping experience',
      location: '',
      colorPalette: {
        primary: '#3B82F6',
        secondary: '#10B981'
      },
      contactInfo: {
        phone: '',
        email: '',
        address: ''
      },
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: ''
      }
    };
  }
}
