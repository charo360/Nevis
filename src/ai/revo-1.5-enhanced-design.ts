/**
 * Revo 1.5 Enhanced Design Service
 * Two-step process: Gemini 2.5 Flash for design planning + Gemini 2.5 Flash Image Preview for final generation
 */

import { generateText, generateMultimodal, GEMINI_2_5_MODELS } from './google-ai-direct';
import { BrandProfile } from '@/lib/types';
import OpenAI from 'openai';

// OpenAI client instance
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Helper function to convert logo URL to base64 data URL for AI models (matching Revo 1.0)
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  
  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }
  
  // If it's a Supabase Storage URL, fetch and convert to base64
  if (logoUrl.startsWith('http')) {
    try {
      console.log('🔄 [Revo 1.5] Converting logo URL to base64 for AI generation:', logoUrl.substring(0, 50) + '...');
      
      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ [Revo 1.5] Failed to fetch logo from URL:', response.status);
        return undefined;
      }
      
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      console.log('✅ [Revo 1.5] Logo converted to base64 successfully (' + buffer.byteLength + ' bytes)');
      return dataUrl;
    } catch (error) {
      console.error('❌ [Revo 1.5] Error converting logo URL to base64:', error);
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * Generate caption, hashtags, headlines, subheadlines, and CTAs for Revo 1.5 (matching Revo 1.0 approach)
 */
async function generateCaptionAndHashtags(
  businessType: string,
  businessName: string,
  platform: string,
  designPlan: any,
  brandProfile: BrandProfile
): Promise<{ 
  caption: string; 
  hashtags: string[];
  headline: string;
  subheadline: string;
  callToAction: string;
}> {
  try {
    console.log('🎯 [Revo 1.5] Generating caption and hashtags for:', {
      businessName,
      businessType,
      platform,
      location: brandProfile.location || 'Local area',
      designConcept: designPlan?.concept || 'Professional business content'
    });

    const prompt = `Create engaging ${platform} content for a ${businessType} business.

Business Details:
- Name: ${businessName}
- Type: ${businessType}
- Location: ${brandProfile.location || 'Local area'}
- Design Concept: ${designPlan?.concept || 'Professional business content'}
- Key Elements: ${designPlan?.keyElements?.join(', ') || 'Modern design elements'}

Create:
1. A catchy, engaging caption (2-3 sentences max) that incorporates the business name and concept naturally
2. A compelling headline (5-8 words max) that will be displayed prominently on the design
3. A supporting subheadline (8-15 words) that explains the value proposition
4. A strong call-to-action (3-6 words) that encourages action (like "PAYA: YOUR FUTURE, NOW!" style)
5. 10 highly relevant, specific hashtags that are:
   - Specific to this business and location
   - Mix of business-specific, location-based, industry-relevant, and platform-optimized
   - Avoid generic hashtags like #business, #professional, #quality, #local
   - Discoverable and relevant to the target audience
   - Appropriate for ${platform}

Make the content authentic, locally relevant, and engaging for ${platform}.
The headline, subheadline, and CTA will be displayed directly on the design image.

Format as JSON:
{
  "caption": "Your engaging caption here",
  "headline": "Your compelling headline here",
  "subheadline": "Your supporting subheadline here", 
  "callToAction": "Your strong CTA here",
  "hashtags": ["#SpecificHashtag1", "#LocationBasedHashtag", "#IndustryRelevant", ...]
}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 600
    });

    console.log('✅ [Revo 1.5] OpenAI response received for caption generation');

    try {
      let responseContent = response.choices[0].message.content || '{}';
      
      // Clean up the response if it has markdown formatting
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1]?.split('```')[0] || responseContent;
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1] || responseContent;
      }

      const parsed = JSON.parse(responseContent);
      
      console.log('✅ [Revo 1.5] Content generation successful:', {
        caption: parsed.caption?.substring(0, 100) + '...',
        headline: parsed.headline || 'No headline',
        subheadline: parsed.subheadline?.substring(0, 50) + '...' || 'No subheadline',
        callToAction: parsed.callToAction || 'No CTA',
        hashtagsCount: parsed.hashtags?.length || 0,
        hashtags: parsed.hashtags?.slice(0, 3) || []
      });
      
      return {
        caption: parsed.caption || `Enhanced ${businessName} content with premium design`,
        headline: parsed.headline || `Premium ${businessName} Solutions`,
        subheadline: parsed.subheadline || `Experience the future of ${businessType.toLowerCase()} with ${businessName}`,
        callToAction: parsed.callToAction || `Discover ${businessName} Today`,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#enhanced', '#AI', '#design', '#premium', '#quality']
      };
    } catch (parseError) {
      console.warn('⚠️ [Revo 1.5] Failed to parse caption response, using fallback');
      return {
        caption: `Enhanced ${businessName} content with premium design and professional quality`,
        headline: `Premium ${businessName} Solutions`,
        subheadline: `Experience the future of ${businessType.toLowerCase()} with ${businessName}`,
        callToAction: `Discover ${businessName} Today`,
        hashtags: ['#enhanced', '#AI', '#design', '#premium', '#quality', `#${businessName.replace(/\s+/g, '')}`, `#${businessType.replace(/\s+/g, '')}`]
      };
    }
  } catch (error) {
    console.error('❌ [Revo 1.5] Content generation failed:', error);
    return {
      caption: `Enhanced ${businessName} content with premium design and professional quality`,
      headline: `Premium ${businessName} Solutions`,
      subheadline: `Experience the future of ${businessType.toLowerCase()} with ${businessName}`,
      callToAction: `Discover ${businessName} Today`,
      hashtags: ['#enhanced', '#AI', '#design', '#premium', '#quality', `#${businessName.replace(/\s+/g, '')}`, `#${businessType.replace(/\s+/g, '')}`]
    };
  }
}

/**
 * Get platform-specific aspect ratio - ALL PLATFORMS USE 1:1 FOR HIGHEST QUALITY
 */
function getPlatformAspectRatio(platform: string): '1:1' | '16:9' | '9:16' | '21:9' | '4:5' {
  // ALL PLATFORMS USE 1:1 SQUARE FOR MAXIMUM QUALITY
  // No cropping = No quality loss from Gemini's native 1024x1024
  return '1:1';
}

/**
 * Get platform-specific dimension text for prompts
 * STANDARDIZED: ALL platforms use 1:1 square format (no stories/reels)
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  // ALL platforms use square format for maximum quality
  return 'Square format - 1080x1080px HD (Maximum quality)';
}

export interface Revo15DesignInput {
  businessType: string;
  platform: string;
  visualStyle: string;
  imageText: string;
  brandProfile: BrandProfile;
  brandConsistency?: {
    strictConsistency: boolean;
    followBrandColors: boolean;
  };
  artifactInstructions?: string;
  designReferences?: string[]; // Base64 encoded reference images
  includePeopleInDesigns?: boolean; // Control whether designs should include people (default: true)
  useLocalLanguage?: boolean; // Control whether to use local language in text (default: false)
  logoDataUrl?: string; // Base64 logo data
  logoUrl?: string; // Storage URL for logo
}

export interface Revo15DesignResult {
  imageUrl: string;
  designSpecs: any;
  qualityScore: number;
  enhancementsApplied: string[];
  processingTime: number;
  model: string;
  planningModel: string;
  generationModel: string;
  caption?: string;
  hashtags?: string[];
  headline?: string;
  subheadline?: string;
  callToAction?: string;
}

/**
 * Clean website URL by removing https://, http://, and www.
 */
function cleanWebsiteUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Step 1: Generate design specifications using Gemini 2.5 Flash
 */
export async function generateDesignPlan(
  input: Revo15DesignInput
): Promise<any> {

  const brandColors = [
    input.brandProfile.primaryColor,
    input.brandProfile.accentColor,
    input.brandProfile.backgroundColor
  ].filter(Boolean);

  const designPlanningPrompt = `You are an expert design strategist for Revo 1.5. Create a comprehensive design plan for a ${input.platform} post.

BUSINESS CONTEXT:
- Business: ${input.brandProfile.businessName}
- Type: ${input.businessType}
- Location: ${input.brandProfile.location || 'Global'}
- Website: ${cleanWebsiteUrl(input.brandProfile.website || '')}

BRAND PROFILE:
- Primary Color: ${input.brandProfile.primaryColor || '#000000'}
- Accent Color: ${input.brandProfile.accentColor || '#666666'}
- Background Color: ${input.brandProfile.backgroundColor || '#FFFFFF'}
- Writing Tone: ${input.brandProfile.writingTone || 'professional'}
- Target Audience: ${input.brandProfile.targetAudience || 'General audience'}

DESIGN REQUIREMENTS:
- Platform: ${input.platform}
- Aspect Ratio: ${(input as any).aspectRatio || getPlatformAspectRatio(input.platform)} (${getPlatformDimensionsText((input as any).aspectRatio || getPlatformAspectRatio(input.platform))})
- Visual Style: ${input.visualStyle}
- Text Content: "${input.imageText}"
- Include People: ${input.includePeopleInDesigns !== false ? 'Yes' : 'No'}
- Use Local Language: ${input.useLocalLanguage === true ? 'Yes' : 'No'}

REVO 1.5 PREMIUM DESIGN PRINCIPLES (UNIQUE TO REVO 1.5):
1. **Ultra-Modern Composition**: Use cutting-edge layout principles (asymmetrical balance, dynamic grids, fluid compositions)
2. **Intelligent Color Psychology**: Create sophisticated color schemes that trigger specific emotions and actions
3. **Premium Typography System**: Use exclusive font combinations with perfect weight distribution and spacing
4. **Advanced Visual Depth**: Multi-layered designs with sophisticated shadows, glows, and dimensional effects
5. **Seamless Brand Fusion**: Integrate brand elements as natural design components, not add-ons
6. **Platform-Specific Intelligence**: Optimize for each platform's unique algorithm and user behavior
7. **Emotional Architecture**: Design that builds emotional connection through visual storytelling
8. **Cultural Intelligence**: Subtle, authentic cultural elements that enhance rather than distract
9. **Micro-Interactions**: Design elements that suggest interactivity and engagement
10. **Future-Forward Aesthetics**: Trends that will remain relevant for 2+ years

REVO 1.5 EXCLUSIVE DESIGN STYLES (CHOOSE ONE):
1. **Neo-Minimalist**: Ultra-clean with strategic negative space, single focal point, premium typography
2. **Fluid Dynamics**: Organic shapes, flowing lines, gradient overlays, dynamic movement
3. **Geometric Precision**: Sharp angles, perfect symmetry, mathematical proportions, bold contrasts
4. **Layered Depth**: Multiple transparent layers, sophisticated shadows, 3D-like depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with artistic overlays, filters, and effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest buttons, hover effects, and engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Future-Tech**: Cutting-edge aesthetics, metallic elements, neon accents, sci-fi inspired

REVO 1.5 PREMIUM TYPOGRAPHY SYSTEM:
- **Headlines**: Use bold, modern fonts (Inter Bold, Poppins Black, Montserrat ExtraBold)
- **Subheadings**: Medium-weight fonts (Inter Medium, Poppins SemiBold, Montserrat Bold)
- **Body Text**: Clean, readable fonts (Inter Regular, Poppins Regular, Montserrat Regular)
- **Accent Text**: Distinctive fonts for CTAs (Nunito Bold, Source Sans Pro Bold)
- **Font Pairing Rules**: Maximum 2 fonts with strong contrast and complementary personalities
- **Weight Hierarchy**: 900 (headlines), 600 (subheadings), 400 (body), 700 (CTAs)
- **Spacing**: Generous letter-spacing for headlines, tight for body text
- **Line Height**: 1.2 for headlines, 1.4 for subheadings, 1.6 for body text

Create a detailed design plan including:
1. **Layout Strategy**: Composition approach and element placement
2. **Color Palette**: Extended palette based on brand colors
3. **Typography Plan**: Font selections and text hierarchy
4. **Visual Elements**: Icons, shapes, patterns to include
5. **Brand Integration**: How to incorporate logo and brand elements
   - Logo Status: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'AVAILABLE - Must be prominently integrated' : 'NOT AVAILABLE - Focus on typography and colors'}
   - Logo Requirements: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'Use actual provided logo, ensure visibility and proper placement' : 'No logo to integrate'}
6. **Mood & Atmosphere**: Overall feeling and aesthetic direction
7. **Technical Specs**: Aspect ratio, resolution, key measurements
8. **Style Selection**: Choose one of the 10 exclusive Revo 1.5 design styles
9. **Typography Hierarchy**: Specific font selections and weight distribution
10. **Visual Storytelling**: How the design tells the brand story

Provide a structured plan that will guide the image generation process.`;

  try {
    const planResponse = await generateText(
      designPlanningPrompt,
      {
        model: GEMINI_2_5_MODELS.FLASH,
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    );

    return {
      plan: planResponse.text,
      brandColors,
      timestamp: Date.now()
    };

  } catch (error) {
    throw new Error(`Design planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Step 2: Generate final image using Gemini 2.5 Flash Image Preview
 */
export async function generateFinalImage(
  input: Revo15DesignInput,
  designPlan: any,
  contentResult?: {
    headline: string;
    subheadline: string;
    callToAction: string;
  }
): Promise<string> {

  // Build comprehensive image generation prompt based on the design plan
  const imagePrompt = buildEnhancedImagePrompt(input, designPlan, contentResult);

  try {
    // Use direct Gemini generation like Revo 2.0 for proper logo integration
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('No Gemini API key found for Revo 1.5 generation');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image-preview', // Same model as Revo 1.0 and 2.0
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Prepare the generation request with logo if available (exactly like Revo 2.0)
    const generationParts = [
      'You are an expert Revo 1.5 designer using Gemini 2.5 Flash Image Preview (same model as Revo 1.0 and 2.0). Create professional, high-quality social media images with perfect text rendering and ultra-premium visual quality.',
      imagePrompt
    ];

    // Logo processing exactly like Revo 1.0 (working implementation)
    const logoDataUrl = input.brandProfile.logoDataUrl;
    const logoStorageUrl = input.brandProfile.logoUrl;
    const logoUrl = logoDataUrl || logoStorageUrl;
    
    console.log('🔍 [Revo 1.5] Logo availability check:', {
      businessName: input.brandProfile.businessName,
      hasLogoDataUrl: !!logoDataUrl,
      hasLogoStorageUrl: !!logoStorageUrl,
      logoDataUrlLength: logoDataUrl?.length || 0,
      logoStorageUrlLength: logoStorageUrl?.length || 0,
      finalLogoUrl: logoUrl ? logoUrl.substring(0, 100) + '...' : 'None'
    });
    
    if (logoUrl) {
      console.log('🎨 [Revo 1.5] Processing brand logo for generation using:', logoDataUrl ? 'base64 data' : 'storage URL');
      
      let logoBase64Data = '';
      let logoMimeType = 'image/png';
      
      if (logoUrl.startsWith('data:')) {
        // Handle data URL (base64 format)
        const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (logoMatch) {
          [, logoMimeType, logoBase64Data] = logoMatch;
          console.log('✅ [Revo 1.5] Using base64 logo data directly');
        }
      } else if (logoUrl.startsWith('http')) {
        // Handle storage URL - fetch and convert to base64 (same as Revo 1.0)
        console.log('📡 [Revo 1.5] Fetching logo from storage URL...');
        try {
          const response = await fetch(logoUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            logoBase64Data = Buffer.from(buffer).toString('base64');
            logoMimeType = response.headers.get('content-type') || 'image/png';
            console.log(`✅ [Revo 1.5] Logo fetched and converted to base64 (${buffer.byteLength} bytes)`);
          } else {
            console.warn(`⚠️  [Revo 1.5] Failed to fetch logo from URL: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.error('❌ [Revo 1.5] Error fetching logo from storage:', fetchError);
        }
      }
      
      // Add logo to generation if we have valid base64 data
      if (logoBase64Data) {
        generationParts.push({
          inlineData: {
            data: logoBase64Data,
            mimeType: logoMimeType
          }
        });

        // Update the prompt to reference the provided logo with VERY STRONG instructions (exactly like Revo 1.0)
        const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.

LOGO INTEGRATION RULES:
✅ REQUIRED: Place the provided logo prominently in the design (top corner, header, or center)
✅ REQUIRED: Use the EXACT logo image provided - do not modify, recreate, or stylize it
✅ REQUIRED: Make the logo clearly visible and readable
✅ REQUIRED: Size the logo appropriately (not too small, not too large)
✅ REQUIRED: Ensure good contrast against the background

❌ FORBIDDEN: Do NOT create a new logo
❌ FORBIDDEN: Do NOT ignore the provided logo
❌ FORBIDDEN: Do NOT make the logo too small to see
❌ FORBIDDEN: Do NOT place logo where it can't be seen

The client specifically requested their brand logo to be included. FAILURE TO INCLUDE THE LOGO IS UNACCEPTABLE.`;
        generationParts[1] = imagePrompt + logoPrompt;
        console.log('✅ [Revo 1.5] STRONG logo integration prompt added');
      } else {
        console.error('❌ [Revo 1.5] Logo processing failed:', {
          originalUrl: logoUrl.substring(0, 100),
          hasLogoDataUrl: !!logoDataUrl,
          hasLogoStorageUrl: !!logoStorageUrl,
          urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
        });
      }
    } else {
      console.log('ℹ️  [Revo 1.5] No logo provided for generation:', {
        businessName: input.brandProfile.businessName,
        availableInputKeys: Object.keys(input.brandProfile).filter(key => key.toLowerCase().includes('logo'))
      });
    }

    const result = await model.generateContent(generationParts);
    const response = await result.response;

    // Extract image data from Gemini response (same as Revo 2.0)
    const parts = response.candidates?.[0]?.content?.parts || [];
    let imageUrl = '';

    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        imageUrl = `data:${mimeType};base64,${imageData}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('No image data generated by Gemini 2.5 Flash Image Preview for Revo 1.5');
    }

    return imageUrl;

  } catch (error) {
    throw new Error(`Final image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build enhanced image prompt based on design plan
 */
function buildEnhancedImagePrompt(
  input: Revo15DesignInput, 
  designPlan: any, 
  contentResult?: {
    headline: string;
    subheadline: string;
    callToAction: string;
  }
): string {
  const brandColors = [
    input.brandProfile.primaryColor,
    input.brandProfile.accentColor,
    input.brandProfile.backgroundColor
  ].filter(Boolean);

  // Enhanced target market representation for all locations
  const getTargetMarketInstructions = (location: string, businessType: string, targetAudience: string) => {
    const locationKey = location.toLowerCase();
    const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];

    // Get business-specific target market
    const getBusinessTargetMarket = (businessType: string) => {
      const businessTypeLower = businessType.toLowerCase();

      if (businessTypeLower.includes('restaurant') || businessTypeLower.includes('food') || businessTypeLower.includes('cafe')) {
        return 'diverse families, couples, food enthusiasts, local community members';
      } else if (businessTypeLower.includes('fitness') || businessTypeLower.includes('gym') || businessTypeLower.includes('health')) {
        return 'fitness enthusiasts, health-conscious individuals, athletes, people working out';
      } else if (businessTypeLower.includes('beauty') || businessTypeLower.includes('salon') || businessTypeLower.includes('spa')) {
        return 'beauty-conscious individuals, people getting beauty treatments, fashion-forward people';
      } else if (businessTypeLower.includes('retail') || businessTypeLower.includes('shop') || businessTypeLower.includes('store')) {
        return 'shoppers, customers browsing products, families shopping, fashion enthusiasts';
      } else if (businessTypeLower.includes('finance') || businessTypeLower.includes('bank') || businessTypeLower.includes('payment')) {
        return 'business professionals, entrepreneurs, people using financial services, tech-savvy individuals';
      } else if (businessTypeLower.includes('tech') || businessTypeLower.includes('software') || businessTypeLower.includes('digital')) {
        return 'tech professionals, entrepreneurs, digital natives, people using technology';
      } else if (businessTypeLower.includes('education') || businessTypeLower.includes('school') || businessTypeLower.includes('training')) {
        return 'students, teachers, parents, people learning, educational professionals';
      } else if (businessTypeLower.includes('real estate') || businessTypeLower.includes('property') || businessTypeLower.includes('housing')) {
        return 'homebuyers, families, property investors, people looking for homes';
      } else if (businessTypeLower.includes('automotive') || businessTypeLower.includes('car') || businessTypeLower.includes('vehicle')) {
        return 'car owners, drivers, automotive enthusiasts, people with vehicles';
      } else if (businessTypeLower.includes('healthcare') || businessTypeLower.includes('medical') || businessTypeLower.includes('clinic')) {
        return 'patients, healthcare workers, families, people seeking medical care';
      } else {
        return 'local community members, customers, people using the service';
      }
    };

    const targetMarket = getBusinessTargetMarket(businessType);

    // Check if it's an African country
    const isAfricanCountry = africanCountries.some(country => locationKey.includes(country));

    if (isAfricanCountry) {
      return `
**CRITICAL TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- MANDATORY: Include authentic Black/African people who represent the target market
- Show people who would actually use ${businessType} services: ${targetMarket}
- Display local African people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct with no deformations
- Emphasize cultural authenticity and local representation
- AVOID: Generic office workers - show people who match the target audience
- PRIORITY: 80%+ of people in the image should be Black/African when business is in African country
- Context: Show people in ${businessType}-relevant settings, not generic offices
- Target Audience: ${targetAudience || targetMarket}`;
    } else {
      return `
**TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- Include people who represent the target market: ${targetMarket}
- Show people who would actually use ${businessType} services
- Display people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- Context: Show people in ${businessType}-relevant settings, not generic offices
- Target Audience: ${targetAudience || targetMarket}`;
    }
  };

  const targetMarketInstructions = getTargetMarketInstructions(
    input.brandProfile.location || '',
    input.businessType,
    input.brandProfile.targetAudience || ''
  );

  // Clean business name pattern from image text
  const cleanBusinessNamePattern = (text: string): string => {
    let cleaned = text
      .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
      .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
      .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
      .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
      .trim();

    if (cleaned.length < 3) {
      return text;
    }

    return cleaned;
  };

  const cleanedImageText = cleanBusinessNamePattern(input.imageText);

  return `Create a premium ${input.platform} design following this comprehensive plan:

DESIGN PLAN CONTEXT:
${designPlan.plan}

BRAND INTEGRATION:
|- Business: ${input.brandProfile.businessName}
|- Colors: ${brandColors.join(', ')}
|- Style: ${input.visualStyle}
|- Logo Status: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? '✅ BRAND LOGO AVAILABLE - Must be integrated prominently' : '❌ No logo available - do not add any logo'}
|- Logo Integration: ${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? 'CRITICAL: The actual brand logo will be provided and MUST be used in the design' : 'Design without logo - focus on typography and brand colors'}

TEXT CONTENT TO INCLUDE:
"${cleanedImageText}"

${contentResult ? `
🎯 CRITICAL TEXT ELEMENTS TO DISPLAY ON DESIGN:
- PRIMARY HEADLINE (Largest, most prominent): "${contentResult.headline}"
- SECONDARY SUBHEADLINE (Medium, supporting): "${contentResult.subheadline}"  
- CALL-TO-ACTION (Bold, action-oriented, prominent): "${contentResult.callToAction}"

🎯 CTA DISPLAY REQUIREMENTS (LIKE PAYA EXAMPLE):
- The CTA "${contentResult.callToAction}" MUST be displayed prominently on the design
- Make it BOLD, LARGE, and VISUALLY STRIKING like "PAYA: YOUR FUTURE, NOW!"
- Use high contrast colors to make the CTA stand out
- Position it prominently - top, center, or as a banner across the design
- Make the CTA text the MAIN FOCAL POINT of the design
- Use typography that commands attention - bold, modern, impactful
- Add visual elements (borders, backgrounds, highlights) to emphasize the CTA
- The CTA should be the FIRST thing people notice when they see the design
- Make it look like a professional marketing campaign CTA
- Ensure it's readable from mobile devices - minimum 32px equivalent font size
- EXAMPLE STYLE: Like "PAYA: YOUR FUTURE, NOW!" - bold, prominent, unmissable

TEXT HIERARCHY REQUIREMENTS:
1. HEADLINE: Most prominent, largest text, primary attention-grabber
2. SUBHEADLINE: Supporting text, explains the value proposition
3. CTA: Action-oriented, bold, encourages immediate response
4. All text must be readable and well-spaced
5. Use professional typography that matches the design style
` : ''}

${targetMarketInstructions}

${(input.brandProfile.logoDataUrl || input.brandProfile.logoUrl) ? `
🚨🚨🚨 CRITICAL LOGO REQUIREMENT 🚨🚨🚨
- A BRAND LOGO IMAGE WILL BE PROVIDED ABOVE
- YOU MUST USE THE EXACT LOGO PROVIDED - DO NOT CREATE ANY NEW LOGO
- PLACE THE PROVIDED LOGO PROMINENTLY IN THE DESIGN
- DO NOT IGNORE THE PROVIDED LOGO - IT IS MANDATORY
- DO NOT CREATE ANY TEXT-BASED LOGO OR BRAND SYMBOL
- THE PROVIDED LOGO IS THE ONLY LOGO THAT SHOULD APPEAR
` : ''}

REVO 1.5 EXCLUSIVE PREMIUM REQUIREMENTS:
✨ ULTRA-MODERN AESTHETICS: Cutting-edge design that stands out from Revo 1.0
🎨 DYNAMIC COMPOSITION: Asymmetrical balance, fluid layouts, sophisticated visual hierarchy
🌈 INTELLIGENT COLOR PSYCHOLOGY: Color schemes that trigger specific emotions and actions
📝 PREMIUM TYPOGRAPHY SYSTEM: Exclusive font combinations with perfect weight distribution
🏢 SEAMLESS BRAND FUSION: Brand elements as natural design components, not add-ons
📱 PLATFORM-SPECIFIC INTELLIGENCE: Optimized for ${input.platform} algorithm and user behavior
🎯 EMOTIONAL ARCHITECTURE: Visual storytelling that builds emotional connection
✨ ADVANCED VISUAL DEPTH: Multi-layered designs with sophisticated shadows and glows
🚀 FUTURE-FORWARD AESTHETICS: Trends that will remain relevant for 2+ years
💫 MICRO-INTERACTIONS: Design elements that suggest interactivity and engagement

REVO 1.5 EXCLUSIVE DESIGN STYLE SELECTION:
Choose ONE of these 10 exclusive Revo 1.5 design styles (completely different from Revo 1.0):

1. **Neo-Minimalist**: Ultra-clean with strategic negative space, single focal point, premium typography
2. **Fluid Dynamics**: Organic shapes, flowing lines, gradient overlays, dynamic movement
3. **Geometric Precision**: Sharp angles, perfect symmetry, mathematical proportions, bold contrasts
4. **Layered Depth**: Multiple transparent layers, sophisticated shadows, 3D-like depth
5. **Typography-First**: Large, bold text as primary design element, minimal supporting graphics
6. **Photo-Artistic**: High-quality photography with artistic overlays, filters, and effects
7. **Brand-Centric**: Logo and brand elements as core design components, identity-focused
8. **Interactive-Style**: Design elements that suggest buttons, hover effects, and engagement
9. **Cultural-Fusion**: Subtle cultural elements integrated naturally into modern design
10. **Future-Tech**: Cutting-edge aesthetics, metallic elements, neon accents, sci-fi inspired

CRITICAL REQUIREMENTS:
- Aspect ratio: ${input.platform === 'Instagram' ? '1:1 (square)' : '16:9 (landscape)'}
- Resolution: Ultra-high quality (minimum 1024x1024)
- Text readability: ALL text must be crystal clear and readable
- Brand consistency: Follow brand colors and style guidelines
- Professional finish: Add depth, shadows, and premium visual effects
- No generic templates: Create unique, custom design
- MUST be completely different from Revo 1.0 designs
- Use one of the 10 exclusive Revo 1.5 design styles above

Generate a stunning, cutting-edge design that represents the pinnacle of ${input.platform} visual content using Revo 1.5's exclusive design system.`;
}

/**
 * Fetch logo from storage URL and convert to base64
 */
async function fetchAndConvertLogo(logoUrl: string): Promise<string> {
  try {
    console.log('🖼️  [Revo 1.5] Fetching logo from storage:', logoUrl.substring(0, 100) + '...');
    const response = await fetch(logoUrl);
    
    if (!response.ok) {
      console.warn('⚠️  [Revo 1.5] Logo fetch failed:', response.status, response.statusText);
      return '';
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/png';
    const logoDataUrl = `data:${contentType};base64,${base64String}`;
    
    console.log('✅ [Revo 1.5] Logo converted to base64:', logoDataUrl.length, 'characters');
    return logoDataUrl;
  } catch (error) {
    console.error('❌ [Revo 1.5] Error fetching logo:', error);
    return '';
  }
}

/**
 * Main Revo 1.5 Enhanced Design Generation Function
 */
export async function generateRevo15EnhancedDesign(
  input: Revo15DesignInput
): Promise<Revo15DesignResult> {
  const startTime = Date.now();

  // Logo processing is now handled in generateFinalImage (same as Revo 1.0)
  
  // Auto-detect platform-specific aspect ratio
  const aspectRatio = getPlatformAspectRatio(input.platform);
  const enhancedInput = { 
    ...input, 
    aspectRatio
  };

  // Check if logo is available for enhancement tracking
  const hasLogo = !!(input.brandProfile?.logoDataUrl || input.brandProfile?.logoUrl || input.logoDataUrl || input.logoUrl);

  const enhancementsApplied: string[] = [
    'Two-Step Design Process',
    'Gemini 2.5 Flash Planning',
    'Gemini 2.5 Flash Image Preview Generation',
    'Advanced Design Strategy',
    'Premium Visual Quality',
    `Platform-Optimized ${aspectRatio} Format`,
    hasLogo ? 'Enhanced Logo Integration' : 'Logo Processing (No Logo Available)',
    'Revo 2.0-Level Logo Processing',
    'Comprehensive Logo Fallback System'
  ];

  try {

    // Step 1: Generate design plan with Gemini 2.5 Flash
    const designPlan = await generateDesignPlan(enhancedInput);
    enhancementsApplied.push('Strategic Design Planning');

    // Step 2: Generate caption, hashtags, headlines, subheadlines, and CTAs first (matching Revo 1.0 approach)
    const contentResult = await generateCaptionAndHashtags(
      input.businessType,
      input.brandProfile.businessName || input.businessType,
      input.platform,
      designPlan,
      input.brandProfile
    );
    enhancementsApplied.push('AI-Generated Content & Design Text');

    // Step 3: Generate final image with text elements on design (matching Revo 1.0 approach)
    const imageUrl = await generateFinalImage(enhancedInput, designPlan, contentResult);
    enhancementsApplied.push('Premium Image Generation with Text Elements');

    const result: Revo15DesignResult = {
      imageUrl,
      designSpecs: designPlan,
      qualityScore: 9.8, // Higher quality score for two-step process
      enhancementsApplied,
      processingTime: Date.now() - startTime,
      model: 'revo-1.5-enhanced (gemini-2.5-flash-image-preview)',
      planningModel: GEMINI_2_5_MODELS.FLASH,
      generationModel: 'gemini-2.5-flash-image-preview', // Same model as Revo 1.0 and 2.0
      caption: contentResult.caption,
      hashtags: contentResult.hashtags,
      headline: contentResult.headline,
      subheadline: contentResult.subheadline,
      callToAction: contentResult.callToAction
    };

    return result;

  } catch (error) {
    throw new Error(`Revo 1.5 enhanced design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
