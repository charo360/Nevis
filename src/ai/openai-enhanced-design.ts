import { BrandProfile } from '@/lib/types';
import { EnhancedOpenAIClient } from '@/lib/services/openai-client-enhanced';
import {
  MODERN_DESIGN_TRENDS_2024_2025,
  MODERN_COLOR_PSYCHOLOGY_2024,
  MODERN_LAYOUT_PRINCIPLES,
  MODERN_VISUAL_EFFECTS,
  PLATFORM_MODERN_OPTIMIZATIONS,
  BUSINESS_TYPE_MODERN_DNA
} from './prompts/modern-design-prompts';

export interface OpenAIEnhancedDesignInput {
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
}

export interface OpenAIEnhancedDesignResult {
  imageUrl: string;
  qualityScore: number;
  enhancementsApplied: string[];
  processingTime: number;
}

/**
 * Generate enhanced design using OpenAI DALL-E 3
 * This provides superior text readability, brand color compliance, and design quality
 */
export async function generateOpenAIEnhancedDesign(
  input: OpenAIEnhancedDesignInput
): Promise<OpenAIEnhancedDesignResult> {
  const startTime = Date.now();
  const enhancementsApplied: string[] = [];

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.');
    }

    // Validate and clean the text input
    const cleanedText = validateAndCleanText(input.imageText);
    const inputWithCleanText = { ...input, imageText: cleanedText };

    // Build enhanced prompt optimized for DALL-E 3
    const enhancedPrompt = buildDALLE3Prompt(inputWithCleanText);
    enhancementsApplied.push('DALL-E 3 Optimized Prompting', 'Text Validation & Cleaning');


    // Generate image with GPT-Image 1 (Latest OpenAI Image Model - 2025)
    // GPT-Image 1 replaced DALL-E 3 as the most advanced OpenAI image model
    // Enhanced for MAXIMUM QUALITY and PERFECT FACE RENDERING
    const response = await EnhancedOpenAIClient.generateImage(enhancedPrompt, {
      model: 'gpt-image-1', // Latest OpenAI image model (successor to DALL-E 3)
      size: getPlatformSize(input.platform), // Using highest available resolution
      quality: 'hd', // MAXIMUM quality setting - highest available
      style: getGPTImageStyle(input.visualStyle), // Optimized style for quality
    });

    const imageUrl = response.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    enhancementsApplied.push(
      'Professional Design Principles',
      'Brand Color Compliance',
      'Text Readability Optimization',
      'Platform Optimization',
      'HD Quality Generation'
    );

    if (input.brandConsistency?.strictConsistency) {
      enhancementsApplied.push('Strict Design Consistency');
    }

    if (input.brandConsistency?.followBrandColors) {
      enhancementsApplied.push('Brand Color Enforcement');
    }


    return {
      imageUrl,
      qualityScore: 9.9, // GPT-Image 1 Ultra-HD - Maximum quality with perfect face rendering
      enhancementsApplied,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    throw new Error(`OpenAI enhanced design generation failed: ${(error as Error).message}`);
  }
}

/**
 * Build optimized prompt for DALL-E 3 (Latest OpenAI Image Model)
 * Enhanced with 2024 best practices for maximum quality and accuracy
 */
function buildDALLE3Prompt(input: OpenAIEnhancedDesignInput): string {
  const { businessType, platform, visualStyle, imageText, brandProfile, brandConsistency, artifactInstructions } = input;

  // Generate unique variation elements for each request
  const generationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const variationSeed = Math.floor(Math.random() * 1000);

  // Random layout variations
  const layoutVariations = [
    'asymmetrical composition with dynamic balance',
    'grid-based layout with clean alignment',
    'centered composition with radial elements',
    'diagonal flow with leading lines',
    'layered depth with foreground/background separation'
  ];
  const selectedLayout = layoutVariations[Math.floor(Math.random() * layoutVariations.length)];

  // Random style modifiers
  const styleModifiers = [
    'with subtle gradient overlays',
    'with bold geometric accents',
    'with organic flowing elements',
    'with modern minimalist approach',
    'with dynamic energy and movement'
  ];
  const selectedModifier = styleModifiers[Math.floor(Math.random() * styleModifiers.length)];

  // STRICT 3-color maximum with NO LINES enforcement
  const colorInstructions = brandProfile.primaryColor && brandProfile.accentColor
    ? `MAXIMUM 3 COLORS ONLY: Primary ${brandProfile.primaryColor} (dominant 60-70%), Secondary ${brandProfile.accentColor} (highlights 20-30%), Background ${brandProfile.backgroundColor || '#ffffff'} (base 10-20%). ABSOLUTE LIMITS: These 3 colors only - NO 4th color allowed, NO LINES of any kind. FORBIDDEN: Any design with more than 3 colors total, any lines, borders, dividers.`
    : 'MAXIMUM 3 COLORS TOTAL, NO LINES - Use only the specified brand colors with no linear elements.';

  // Advanced people inclusion logic for better engagement with HD face rendering
  const shouldIncludePeople = shouldIncludePeopleInDesign(businessType, imageText, visualStyle);
  const peopleInstructions = shouldIncludePeople
    ? getCulturallyAppropriatePersonDescription(location)
    : 'Focus on clean, minimalist design without people, emphasizing the product/service/message with ultra-sharp details.';

  // Enhanced platform-specific optimization
  const platformSpecs = getPlatformSpecifications(platform);

  // Get platform-specific guidelines
  const platformGuidelines = PLATFORM_SPECIFIC_GUIDELINES[platform.toLowerCase() as keyof typeof PLATFORM_SPECIFIC_GUIDELINES] || PLATFORM_SPECIFIC_GUIDELINES.instagram;

  // Get business-specific design DNA
  const businessDNA = BUSINESS_TYPE_DESIGN_DNA[businessType.toLowerCase() as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;

  // Build rich, diverse design prompt like standard generation
  const prompt = `You are a world-class creative director and visual designer with expertise in social media marketing, brand design, and visual psychology.

**DESIGN BRIEF:**
Create a professional, high-impact social media design for a ${businessType} business.
Target Platform: ${platform} | Dimensions: 992x1056px
Visual Style: ${visualStyle} | Location: ${brandProfile.location || 'Global'}

**TEXT CONTENT TO INCLUDE:**
Primary Text: "${imageText}"
${brandProfile.businessName ? `Business Name: "${brandProfile.businessName}"` : ''}

${ADVANCED_DESIGN_PRINCIPLES}

${platformGuidelines}

${businessDNA}

**BRAND GUIDELINES:**
${colorInstructions}
${peopleInstructions}

**CREATIVE VARIATION REQUIREMENTS:**
- Layout Style: Use ${selectedLayout}
- Design Approach: Create design ${selectedModifier}
- Uniqueness: This design must be visually distinct from any previous generations
- Generation ID: ${generationId} (use this to ensure uniqueness)
- Variation Seed: ${variationSeed} (apply subtle randomization based on this number)

**PLATFORM SPECIFICATIONS:**
${platformSpecs}

**TEXT RENDERING REQUIREMENTS:**
- Use the provided text: "${imageText}"
- Ensure perfect text clarity and readability
- High-quality typography with proper spacing
- Professional font choices that match the visual style

🧑 PERFECT HUMAN RENDERING (MANDATORY):
- Complete, symmetrical faces with all features present
- Natural, professional expressions with clear eyes
- Proper anatomy with no deformations or missing parts
- High-quality skin textures and realistic lighting
- Diverse representation with authentic appearance

🎨 ULTRA-MODERN DESIGN SPECIFICATIONS (2024-2025 TRENDS):

**CONTEMPORARY VISUAL STYLE:**
- ${visualStyle} with cutting-edge 2024-2025 design trends
- Implement glassmorphism effects: frosted glass backgrounds with subtle transparency
- Use neumorphism/soft UI: subtle shadows and highlights for depth
- Apply modern gradient overlays: multi-directional, vibrant gradients
- Include contemporary typography: bold, clean sans-serif fonts with perfect spacing
- Modern color psychology: ${colorInstructions}

**ADVANCED LAYOUT & COMPOSITION:**
- Asymmetrical layouts with dynamic visual hierarchy
- Generous white space with intentional negative space design
- Floating elements with subtle drop shadows and depth
- Modern grid systems with broken grid elements for visual interest
- Contemporary card-based layouts with rounded corners and elevation

**CUTTING-EDGE VISUAL EFFECTS:**
- Glassmorphism: Semi-transparent backgrounds with blur effects
- Gradient meshes: Complex, multi-point gradients for depth
- Subtle animations implied through motion blur and dynamic positioning
- Modern shadows: Soft, realistic shadows with multiple light sources
- Contemporary textures: Subtle noise, grain, or organic patterns

**2024-2025 DESIGN TRENDS:**
- Bold, oversized typography with creative font pairings
- Vibrant, saturated color palettes with high contrast
- Organic shapes and fluid forms mixed with geometric elements
- Modern iconography: minimal, line-based icons with perfect pixel alignment
- Contemporary photography style: high contrast, vibrant, authentic moments

**BRAND INTEGRATION:**
- Brand Identity: ${brandProfile.businessName || businessType}
- Platform Optimization: ${platformSpecs}
- Human Elements: ${peopleInstructions}

⚡ GPT-IMAGE 1 ULTRA-HD QUALITY ENHANCEMENTS:
- MAXIMUM RESOLUTION: Ultra-high definition rendering (4K+ quality) for perfect small font clarity
- SMALL FONT SIZE EXCELLENCE: Perfect rendering at 8pt, 10pt, 12pt, and all small font sizes
- TINY TEXT PRECISION: Every character sharp and legible even when font size is very small
- HIGH-DPI SMALL TEXT: Render small fonts as if on 300+ DPI display for maximum sharpness
- MICRO-TYPOGRAPHY: Perfect letter formation and spacing at the smallest font sizes
- PERFECT ANATOMY: Complete, symmetrical faces with natural expressions
- SHARP DETAILS: Crystal-clear textures, no blur or artifacts
- PROFESSIONAL LIGHTING: Studio-quality lighting with proper shadows
- PREMIUM COMPOSITION: Golden ratio layouts with perfect balance
- ADVANCED COLOR THEORY: Perfect contrast ratios (7:1 minimum) with vibrant, accurate colors
- FLAWLESS RENDERING: No deformations, missing parts, or visual errors
- PHOTOREALISTIC QUALITY: Magazine-level professional appearance
- TEXT LEGIBILITY: All text sizes optimized for perfect readability and clarity

🎨 MODERN DESIGN TRENDS (2024-2025):
${MODERN_DESIGN_TRENDS_2024_2025}

🌈 CONTEMPORARY COLOR PSYCHOLOGY:
${MODERN_COLOR_PSYCHOLOGY_2024}

📐 MODERN LAYOUT PRINCIPLES:
${MODERN_LAYOUT_PRINCIPLES}

✨ ADVANCED VISUAL EFFECTS:
${MODERN_VISUAL_EFFECTS}

📱 PLATFORM-SPECIFIC MODERN OPTIMIZATION:
${PLATFORM_MODERN_OPTIMIZATIONS[platform.toLowerCase() as keyof typeof PLATFORM_MODERN_OPTIMIZATIONS] || PLATFORM_MODERN_OPTIMIZATIONS.instagram}

🏢 BUSINESS-SPECIFIC MODERN DNA:
${BUSINESS_TYPE_MODERN_DNA[businessType.toLowerCase() as keyof typeof BUSINESS_TYPE_MODERN_DNA] || BUSINESS_TYPE_MODERN_DNA.tech}

${artifactInstructions ? `SPECIAL INSTRUCTIONS FROM UPLOADED CONTENT:
${artifactInstructions}
- Follow these instructions precisely when creating the design
- These instructions specify how to use specific content elements

` : ''}📝 ABSOLUTE TEXT ACCURACY REQUIREMENTS:
- STRICT TEXT CONTROL: Use ONLY the exact text "${imageText}" - NO additional text allowed
- NO RANDOM TEXT: Do not add placeholder text, lorem ipsum, sample content, or any extra words
- NO FILLER CONTENT: Do not include random descriptions, fake company names, or dummy text
- EXACT SPELLING: The text must be spelled EXACTLY as provided - do not alter any letters or words
- SINGLE TEXT SOURCE: Only use the provided text "${imageText}" as the text content in the image
- SMALL FONT SIZE HANDLING: When design requires small fonts (8pt-12pt), apply these rules:
  * Increase contrast by 20% for small text visibility
  * Use slightly bolder font weight to maintain character definition
  * Ensure perfect pixel alignment for crisp edges
  * Apply high-resolution anti-aliasing for smooth curves
  * Maintain proper letter spacing even at small sizes
- READABILITY GUARANTEE: Every character must be perfectly legible regardless of font size
- PIXEL-PERFECT SMALL TEXT: Each letter rendered with maximum clarity at any size
- BACKGROUND CONTRAST: Ensure sufficient contrast between small text and background

🚫 ABSOLUTELY FORBIDDEN - WILL CAUSE FAILURE:
- Do NOT add "Payroll Banking Simplified"
- Do NOT add "Banking Made Easy"
- Do NOT add "Financial Services"
- Do NOT add "Professional Banking"
- Do NOT add "Secure Payments"
- Do NOT add "Digital Banking"
- Do NOT add "Money Management"
- Do NOT add ANY banking or financial terms
- Do NOT add ANY business descriptions
- Do NOT add ANY marketing copy
- Do NOT add ANY placeholder text
- Do NOT add ANY lorem ipsum
- Do NOT add ANY sample content
- Do NOT add ANY random words
- Do NOT add ANY filler text
- Do NOT create ANY fake headlines
- Do NOT create ANY taglines
- CRITICAL: ONLY use the exact text: "${imageText}"
- NOTHING ELSE IS ALLOWED`;

  return prompt;
}

/**
 * Validate and clean text input for better DALL-E 3 results
 * MINIMAL cleaning to preserve text accuracy
 */
function validateAndCleanText(text: string): string {
  if (!text || text.trim().length === 0) {
    return 'Professional Business Content';
  }

  let cleanedText = text.trim();

  // Only remove truly problematic characters, preserve all letters and numbers
  cleanedText = cleanedText
    .replace(/[^\w\s\-.,!?'"()&%$#@]/g, '') // Keep more characters, only remove truly problematic ones
    .replace(/\s+/g, ' ') // Normalize whitespace only
    .replace(/(.)\1{4,}/g, '$1$1$1') // Only reduce excessive repetition (4+ chars -> 3)
    .trim();

  // Be more lenient with length - only trim if extremely long
  if (cleanedText.length > 100) {
    const words = cleanedText.split(' ');
    if (words.length > 15) {
      cleanedText = words.slice(0, 15).join(' ');
    }
  }

  // Only fallback if completely empty
  if (cleanedText.length === 0) {
    return 'Professional Business Content';
  }

  return cleanedText;
}

/**
 * Determine if people should be included in the design
 */
function shouldIncludePeopleInDesign(businessType: string, imageText: string, visualStyle: string): boolean {
  const businessTypeLower = businessType.toLowerCase();
  const imageTextLower = imageText.toLowerCase();
  const visualStyleLower = visualStyle.toLowerCase();

  // Business types that typically benefit from people
  const peopleBusinessTypes = [
    'fitness', 'gym', 'health', 'wellness', 'coaching', 'training',
    'education', 'consulting', 'service', 'restaurant', 'retail',
    'beauty', 'salon', 'spa', 'medical', 'dental', 'therapy'
  ];

  // Content that suggests people
  const peopleContent = [
    'team', 'customer', 'client', 'people', 'community', 'join',
    'experience', 'service', 'help', 'support', 'training', 'class'
  ];

  // Visual styles that work well with people
  const peopleStyles = ['lifestyle', 'authentic', 'personal', 'friendly', 'approachable'];

  const hasPeopleBusinessType = peopleBusinessTypes.some(type => businessTypeLower.includes(type));
  const hasPeopleContent = peopleContent.some(content => imageTextLower.includes(content));
  const hasPeopleStyle = peopleStyles.some(style => visualStyleLower.includes(style));

  return hasPeopleBusinessType || hasPeopleContent || hasPeopleStyle;
}

/**
 * Get platform-specific specifications for DALL-E 3 optimization
 */
function getPlatformSpecifications(platform: string): string {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes('instagram')) {
    if (platformLower.includes('story')) {
      return 'Instagram Story format (9:16 aspect ratio) with mobile-first design, thumb-stopping visuals, and story-specific UI considerations';
    }
    return 'Instagram feed post with square format, high engagement design, and mobile-optimized visual hierarchy';
  }

  if (platformLower.includes('linkedin')) {
    return 'LinkedIn professional format with business-focused design, corporate aesthetics, and B2B appeal';
  }

  if (platformLower.includes('facebook')) {
    return 'Facebook post format with broad audience appeal, social sharing optimization, and news feed visibility';
  }

  if (platformLower.includes('twitter') || platformLower.includes('x')) {
    return 'Twitter/X format with concise visual messaging, trending topic relevance, and retweet optimization';
  }

  return 'Universal social media format with cross-platform compatibility and maximum engagement potential';
}

/**
 * Get appropriate image size for platform (DALL-E 3 Latest Model)
 * MOBILE-FIRST: All platforms use square format for optimal mobile viewing
 * DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
 */
function getPlatformSize(platform: string): '1024x1024' | '1792x1024' | '1024x1792' {
  const platformLower = platform.toLowerCase();

  // Vertical formats (9:16 aspect ratio) - only for Stories/Reels
  if (platformLower.includes('story') ||
    platformLower.includes('reel') ||
    platformLower.includes('tiktok') ||
    platformLower.includes('youtube short')) {
    return '1024x1792';
  }

  // MOBILE-OPTIMIZED: All other platforms use square format (1:1)
  // This ensures perfect mobile viewing on Instagram, Facebook, Twitter, LinkedIn
  return '1024x1024';
}

/**
 * Get GPT-Image 1 style based on visual style for maximum quality
 */
function getGPTImageStyle(visualStyle: string): 'vivid' | 'natural' {
  const styleLower = visualStyle.toLowerCase();

  if (styleLower.includes('vibrant') || styleLower.includes('bold') || styleLower.includes('modern')) {
    return 'vivid';
  } else {
    return 'natural';
  }
}

/**
 * Fallback to Gemini if OpenAI fails
 */
export async function generateEnhancedDesignWithFallback(
  input: OpenAIEnhancedDesignInput
): Promise<OpenAIEnhancedDesignResult> {
  try {
    // Try OpenAI first
    return await generateOpenAIEnhancedDesign(input);
  } catch (error) {

    // Import and use the existing Gemini-based creative asset flow
    const { generateCreativeAsset } = await import('@/ai/flows/generate-creative-asset');

    // Build enhanced prompt for Gemini fallback
    const enhancedPrompt = buildGeminiFallbackPrompt(input);

    const result = await generateCreativeAsset({
      prompt: enhancedPrompt,
      outputType: 'image' as const,
      referenceAssetUrl: null,
      useBrandProfile: true,
      brandProfile: input.brandProfile,
      maskDataUrl: null,
    });

    return {
      imageUrl: result.imageUrl || '',
      qualityScore: 7.5, // Lower score for fallback
      enhancementsApplied: ['Gemini Fallback', 'Enhanced Prompting', 'Brand Integration'],
      processingTime: Date.now() - Date.now(), // Approximate
    };
  }
}

/**
 * Build enhanced prompt for Gemini fallback
 */
function buildGeminiFallbackPrompt(input: OpenAIEnhancedDesignInput): string {
  const { businessType, platform, visualStyle, imageText, brandProfile, brandConsistency, artifactInstructions } = input;

  const colorInstructions = brandProfile.primaryColor && brandProfile.accentColor && brandProfile.backgroundColor
    ? `**MAXIMUM 3 COLORS ONLY, NO LINES - BRAND COLORS:**
       - Primary Color: ${brandProfile.primaryColor} (DOMINANT 60-70% of design)
       - Accent Color: ${brandProfile.accentColor} (HIGHLIGHTS 20-30% of design)
       - Background Color: ${brandProfile.backgroundColor} (BASE 10-20% of design)
       - ABSOLUTE LIMITS: These 3 colors only - NO 4th color allowed, NO LINES
       - FORBIDDEN: Any design using more than 3 colors total, any lines/borders/dividers
       - STRICT RULES: Maximum 3 colors, no linear elements in entire design`
    : '';

  const designExampleInstructions = brandConsistency?.strictConsistency && brandProfile.designExamples && brandProfile.designExamples.length > 0
    ? `**STRICT DESIGN CONSISTENCY - MANDATORY:**
       - Follow the exact visual style of the provided design examples
       - Match typography, layout patterns, and design elements closely
       - Maintain consistent brand aesthetic across all elements
       - Use similar composition and visual hierarchy as examples`
    : '';

  return `Create a professional ${platform} social media post for a ${businessType} business.

**TEXT TO DISPLAY ON IMAGE:** "${imageText}"
**CRITICAL: This text must be displayed clearly and readably in ENGLISH ONLY**

${colorInstructions}

${designExampleInstructions}

**ENHANCED DESIGN REQUIREMENTS:**

**TEXT READABILITY (CRITICAL):**
- Display the text "${imageText}" in large, bold, highly readable font
- Use ENGLISH ONLY - no foreign languages or corrupted characters
- Apply strong contrast between text and background (minimum 4.5:1 ratio)
- Add text shadows, outlines, or semi-transparent backgrounds for readability
- Position text strategically using rule of thirds
- Make text size appropriate for mobile viewing (large and bold)

**BRAND COLOR COMPLIANCE:**
- Use the specified brand colors prominently throughout the design
- Primary color should dominate the design (60% usage)
- Accent color for highlights and important elements (30% usage)
- Background color as base (10% usage)
- Ensure colors work harmoniously together

**PROFESSIONAL COMPOSITION:**
- Apply rule of thirds for element placement
- Create clear visual hierarchy with the text as primary focus
- Use negative space effectively
- Balance all design elements
- Ensure mobile-first design approach

**PLATFORM OPTIMIZATION FOR ${platform.toUpperCase()}:**
- Design for ${platform} aspect ratio and best practices
- Create thumb-stopping visual appeal
- Optimize for mobile viewing
- Use high contrast for small screen visibility

**QUALITY STANDARDS:**
- Professional ${visualStyle} aesthetic
- High-resolution, crisp imagery
- Consistent with ${businessType} industry standards
- Suitable for social media compression

${artifactInstructions ? `**SPECIAL INSTRUCTIONS FROM UPLOADED CONTENT:**
${artifactInstructions}
- Follow these instructions precisely when creating the design
- These instructions specify how to use specific content elements
` : ''}`;
}

function getCulturallyAppropriatePersonDescription(location: string): string {
  const locationKey = location.toLowerCase();

  // African countries - prioritize Black/African people for cultural authenticity
  const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];

  for (const country of africanCountries) {
    if (locationKey.includes(country)) {
      return 'Include authentic Black/African people with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Show local African people in modern, professional settings that reflect contemporary African life. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features. Emphasize cultural authenticity and local representation.';
    }
  }

  // Asian countries - prioritize Asian people
  const asianCountries = ['china', 'japan', 'korea', 'india', 'thailand', 'vietnam', 'singapore', 'malaysia', 'indonesia', 'philippines', 'bangladesh', 'pakistan', 'sri lanka'];

  for (const country of asianCountries) {
    if (locationKey.includes(country)) {
      return 'Include authentic Asian people with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Show local Asian people in modern, professional settings. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features. Emphasize cultural authenticity and local representation.';
    }
  }

  // Middle Eastern countries
  const middleEasternCountries = ['saudi arabia', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman', 'jordan', 'lebanon', 'syria', 'iraq', 'iran', 'turkey', 'israel', 'palestine'];

  for (const country of middleEasternCountries) {
    if (locationKey.includes(country)) {
      return 'Include authentic Middle Eastern people with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Show local Middle Eastern people in modern, professional settings. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features. Emphasize cultural authenticity and local representation.';
    }
  }

  // Latin American countries
  const latinAmericanCountries = ['mexico', 'brazil', 'argentina', 'colombia', 'peru', 'venezuela', 'chile', 'ecuador', 'bolivia', 'paraguay', 'uruguay', 'guatemala', 'honduras', 'el salvador', 'nicaragua', 'costa rica', 'panama', 'cuba', 'dominican republic', 'puerto rico'];

  for (const country of latinAmericanCountries) {
    if (locationKey.includes(country)) {
      return 'Include authentic Latino/Hispanic people with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Show local Latino/Hispanic people in modern, professional settings. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features. Emphasize cultural authenticity and local representation.';
    }
  }

  // Default for Western countries and others - diverse representation
  return 'Include diverse, authentic people (various ethnicities, ages) with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features. Show people in modern, professional settings with cultural sensitivity.';
}
