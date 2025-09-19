/**
 * Revo 1.0 - Enhanced AI Service with Gemini 2.5 Flash Image Preview
 * Enhanced with Gemini 2.5 Flash Image Preview for enhanced quality and perfect text rendering
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BrandProfile } from '@/lib/types';
import { revo10Config, revo10Prompts } from './models/versions/revo-1.0/config';
import { advancedContentGenerator, BusinessProfile } from './advanced-content-generator';
import { performanceAnalyzer } from './content-performance-analyzer';
import { trendingEnhancer } from './trending-content-enhancer';
import {
  generateCreativeHeadline,
  generateCreativeSubheadline,
  enhanceDesignCreativity,
  generateCreativeCTA,
  analyzeBusinessContext,
  AntiRepetitionSystem,
  CREATIVE_PROMPT_SYSTEM,
  CONTENT_VARIATION_ENGINE,
  // NEW: Import business-specific content generation
  StrategicContentPlanner,
  generateBusinessSpecificHeadline,
  generateBusinessSpecificSubheadline,
  generateBusinessSpecificCaption
} from './creative-enhancement';

// Advanced features integration (simplified for now)
// TODO: Import advanced features from Revo 1.5 when available

import { ensureExactDimensions } from './utils/image-dimensions';

// Helper functions for advanced design generation
function getBusinessDesignDNA(businessType: string): string {
  const designDNA: Record<string, string> = {
    'restaurant': 'Warm, appetizing colors (reds, oranges, warm yellows). High-quality food photography. Cozy, inviting atmosphere. Emphasis on freshness and quality.',
    'technology': 'Clean, modern aesthetics. Blue and tech-forward color schemes. Geometric shapes. Innovation and reliability focus. Professional typography.',
    'healthcare': 'Clean, trustworthy design. Calming blues and greens. Professional imagery. Focus on care and expertise. Accessible design principles.',
    'fitness': 'Dynamic, energetic design. Bold colors and strong contrasts. Action-oriented imagery. Motivational messaging. Strong, athletic typography.',
    'finance': 'Professional, trustworthy design. Conservative color palette. Clean lines. Security and stability focus. Authoritative typography.',
    'education': 'Approachable, inspiring design. Bright, optimistic colors. Clear information hierarchy. Growth and learning focus. Readable typography.',
    'retail': 'Attractive, commercial design. Brand-focused colors. Product-centric imagery. Sales and value focus. Eye-catching typography.',
    'real estate': 'Luxurious, aspirational design. Sophisticated color palette. High-quality property imagery. Trust and expertise focus. Elegant typography.',
    'default': 'Professional, modern design. Balanced color scheme. Clean, contemporary aesthetics. Quality and reliability focus. Professional typography.'
  };

  return designDNA[businessType.toLowerCase()] || designDNA['default'];
}

// NEW: 7 truly different design types for dynamic social media feeds
function getHumanDesignVariations(seed: number): any {
  const variations = [
    {
      style: 'Watercolor Quotes',
      layout: 'Soft, artistic watercolor background with elegant typography overlay',
      composition: 'Centered or asymmetrical text with flowing watercolor elements',
      mood: 'Artistic, elegant, inspirational',
      elements: 'Watercolor textures, elegant fonts, soft color transitions, artistic backgrounds',
      description: 'Create a design that looks like an artist painted it with watercolors, with flowing, organic shapes and elegant typography that feels handcrafted and artistic.'
    },
    {
      style: 'Split Photo Collages',
      layout: 'Two or three photo sections with text overlay on one section',
      composition: 'Grid-based photo layout with text integrated naturally',
      mood: 'Modern, dynamic, photo-driven',
      elements: 'Photo sections, clean grid lines, integrated text, modern typography',
      description: 'Design with a clean grid layout that splits the image into photo sections, with text naturally integrated into one section. Think Instagram grid meets modern magazine layout.'
    },
    {
      style: 'Meme-Style Posts',
      layout: 'Bold, punchy text with minimal background and high contrast',
      composition: 'Centered text with simple, impactful background',
      mood: 'Fun, viral, shareable',
      elements: 'Bold typography, simple backgrounds, high contrast, meme-like simplicity',
      description: 'Create a design that feels like a viral meme - bold, simple text with minimal background elements. Think Twitter meme aesthetics but professional.'
    },
    {
      style: 'Polaroid-Style Testimonials',
      layout: 'Polaroid frame with photo area and handwritten-style text',
      composition: 'Polaroid border with content inside, vintage feel',
      mood: 'Authentic, personal, nostalgic',
      elements: 'Polaroid borders, vintage textures, handwritten fonts, authentic feel',
      description: 'Design that looks like a vintage Polaroid photo with a white border, containing either a photo area or text that feels handwritten and personal.'
    },
    {
      style: 'Minimal Photo-Driven Promos',
      layout: 'Large photo background with minimal text overlay',
      composition: 'Photo as hero element with subtle text placement',
      mood: 'Clean, premium, photo-focused',
      elements: 'Large photos, minimal text, clean typography, lots of white space',
      description: 'Create a design where a beautiful photo is the main focus, with minimal, elegant text overlay. Think high-end magazine or premium brand aesthetics.'
    },
    {
      style: 'Mixed-Media Artistic Posts',
      layout: 'Layered design with multiple textures, patterns, and artistic elements',
      composition: 'Complex layering with artistic elements and modern typography',
      mood: 'Creative, artistic, unique',
      elements: 'Multiple textures, artistic patterns, layered elements, creative typography',
      description: 'Design with multiple artistic layers - think digital art meets graphic design. Include textures, patterns, and creative elements that feel like modern digital art.'
    },
    {
      style: 'Branded Posters (Current Style)',
      layout: 'Illustration-heavy design with brand elements and structured layout',
      composition: 'Illustrated background with organized text and brand placement',
      mood: 'Professional, branded, consistent',
      elements: 'Illustrations, brand colors, structured typography, consistent branding',
      description: 'The current style - professional illustrated posters with brand consistency. Use when you need to maintain strong brand identity.'
    }
  ];

  return variations[seed % variations.length];
}

// NEW: Simple, clean design instructions for better visual appeal
function injectHumanImperfections(designPrompt: string, seed: number): string {
  const instructions = [
    'Use natural spacing and proportions that feel balanced and appealing',
    'Create a design that feels modern and current, not overly perfect',
    'Focus on visual appeal and what people actually like to see',
    'Make it look like something from a successful, popular brand'
  ];

  const selectedInstruction = instructions[seed % instructions.length];

  return designPrompt + `

🎨 DESIGN FOCUS:
${selectedInstruction}

Keep the design simple, clean, and visually appealing.`;
}

// NEW: Simple creative approach for better designs
function injectCreativeRebellion(designPrompt: string, seed: number): string {
  const approaches = [
    `DESIGN APPROACH: Create a design that's visually appealing and engaging. Focus on what looks good and what people want to engage with.`,

    `CREATIVE STYLE: Use a clean, modern approach that feels current and appealing. Make it look like something people would actually want to interact with.`,

    `VISUAL APPROACH: Design with a focus on visual appeal and engagement. Create something that stands out and looks good.`,

    `DESIGN PHILOSOPHY: Focus on creating designs that people want to engage with - clean, modern, and visually appealing.`
  ];

  const selectedApproach = approaches[seed % approaches.length];

  return designPrompt + `

🎨 DESIGN APPROACH:
${selectedApproach}

Focus on creating designs that are visually appealing and engaging.`;
}

// NEW: Simple design guidelines for better results
function addArtisticConstraints(designPrompt: string, seed: number): string {
  const constraints = [
    `DESIGN FOCUS: Create a design that's visually appealing and engaging. Focus on clean, modern aesthetics that people actually like.`,

    `COMPOSITION APPROACH: Use simple, clean layouts that are easy to read and understand. Less is more.`,

    `CREATIVE ELEMENTS: Add modern, contemporary elements that make the design look good and engaging.`,

    `VISUAL BALANCE: Create a design that feels balanced and appealing, with elements that work together well.`,

    `DESIGN STYLE: Use a clean, modern approach that feels current and professional. Focus on visual appeal.`,

    `CREATIVE APPROACH: Design with a focus on what people actually want to see and engage with.`,

    `VISUAL HIERARCHY: Create clear visual hierarchy that guides the eye naturally through the design.`,

    `DESIGN PRINCIPLES: Focus on creating a design that's both beautiful and engaging. Make it look good.`
  ];

  const selectedConstraint = constraints[seed % constraints.length];

  return designPrompt + `

🎨 DESIGN GUIDELINE:
${selectedConstraint}

Keep the design simple, clean, and visually appealing.`;
}

function getPlatformOptimization(platform: string): string {
  const optimizations: Record<string, string> = {
    'instagram': `
- Mobile-first design with bold, clear elements
- High contrast colors that pop on small screens
- Text minimum 24px equivalent for readability
- Center important elements for square crop compatibility
- Thumb-stopping power for fast scroll feeds
- Logo: Bottom right corner or naturally integrated`,

    'linkedin': `
- Professional, business-appropriate aesthetics
- Corporate design standards and clean look
- Clear value proposition for business audience
- Professional photography and imagery
- Thought leadership positioning
- Logo: Prominent placement for brand authority`,

    'facebook': `
- Desktop and mobile viewing optimization
- Engagement and shareability focus
- Clear value proposition in visual hierarchy
- Authentic, relatable imagery
- Community-focused design elements
- Logo: Top left or bottom right corner`,

    'twitter': `
- Rapid consumption and high engagement design
- Bold, contrasting colors for timeline visibility
- Minimal, impactful text elements
- Trending visual styles integration
- Real-time relevance
- Logo: Small, subtle placement`,

    'default': `
- Cross-platform compatibility
- Universal appeal and accessibility
- Balanced design for multiple contexts
- Professional appearance across devices
- Logo: Flexible placement based on composition`
  };

  return optimizations[platform.toLowerCase()] || optimizations['default'];
}

// Advanced real-time context gathering for Revo 1.0 (enhanced version)
async function gatherRealTimeContext(businessType: string, location: string, platform: string) {
  const context: any = {
    trends: [],
    weather: null,
    events: [],
    news: [],
    localLanguage: {},
    climateInsights: {},
    trendingTopics: [],
    timeContext: {
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      season: getSeason(),
      timeOfDay: getTimeOfDay()
    }
  };

  try {
    // Generate contextual trends based on business type and location
    context.trends = generateContextualTrends(businessType, location);

    // Generate weather-appropriate content suggestions
    context.weather = generateWeatherContext(location);

    // Generate local business opportunities
    context.events = generateLocalOpportunities(businessType, location);

    // NEW: Enhanced local language and cultural context
    context.localLanguage = generateLocalLanguageContext(location);

    // NEW: Advanced climate insights for business relevance
    context.climateInsights = generateClimateInsights(location, businessType);

    // NEW: Real-time trending topics (simulated for now, can be enhanced with actual APIs)
    context.trendingTopics = generateTrendingTopics(businessType, location, platform);

    // NEW: Local news and market insights
    context.news = generateLocalNewsContext(businessType, location);

    return context;

  } catch (error) {
    return context; // Return partial context
  }
}

// Advanced design enhancement functions
function shouldIncludePeopleInDesign(businessType: string, location: string, visualStyle: string): boolean {
  const peopleBusinessTypes = [
    'restaurant', 'fitness', 'healthcare', 'education', 'retail', 'hospitality',
    'beauty', 'wellness', 'consulting', 'coaching', 'real estate', 'finance',
    'technology', 'marketing', 'events', 'photography', 'fashion'
  ];

  return peopleBusinessTypes.some(type =>
    businessType.toLowerCase().includes(type) ||
    visualStyle === 'lifestyle' ||
    visualStyle === 'authentic'
  );
}

function getLocalCulturalContext(location: string): string {
  const culturalContexts: Record<string, string> = {
    'kenya': 'Subtle Kenyan elements: warm earth tones, natural textures, community feel',
    'nigeria': 'Subtle Nigerian elements: vibrant accents, natural patterns, community warmth',
    'south africa': 'Subtle South African elements: diverse representation, natural colors, community spirit',
    'ghana': 'Subtle Ghanaian elements: warm tones, natural textures, community connection',
    'uganda': 'Subtle Ugandan elements: natural colors, community feel, authentic representation',
    'tanzania': 'Subtle Tanzanian elements: coastal influences, natural textures, community warmth',
    'ethiopia': 'Subtle Ethiopian elements: natural earth tones, community connection, authentic feel',
    'rwanda': 'Subtle Rwandan elements: natural colors, community spirit, authentic representation',
    'default': 'Natural, authentic feel with subtle local elements that feel genuine, not forced'
  };

  const locationKey = location.toLowerCase();
  for (const [key, context] of Object.entries(culturalContexts)) {
    if (locationKey.includes(key)) {
      return context;
    }
  }
  return culturalContexts['default'];
}

function getDesignVariations(seed: number) {
  const variations = [
    {
      style: 'Modern Minimalist',
      layout: 'Clean geometric layout with plenty of white space, single focal point, minimal text overlay',
      composition: 'Centered composition with asymmetrical elements, bold typography hierarchy',
      mood: 'Professional, clean, sophisticated',
      elements: 'Subtle gradients, clean lines, modern sans-serif fonts, minimal color palette'
    },
    {
      style: 'Dynamic Action',
      layout: 'Diagonal composition with movement, multiple focal points, energetic flow',
      composition: 'Rule of thirds with dynamic angles, overlapping elements, motion blur effects',
      mood: 'Energetic, exciting, forward-moving',
      elements: 'Bold colors, dynamic shapes, action-oriented imagery, strong directional lines'
    },
    {
      style: 'Lifestyle Authentic',
      layout: 'Natural, candid composition with real-world settings, human-centered design',
      composition: 'Environmental context, natural lighting, authentic moments captured',
      mood: 'Warm, relatable, trustworthy, human',
      elements: 'Natural lighting, authentic people, real environments, warm color tones'
    },
    {
      style: 'Corporate Professional',
      layout: 'Structured grid layout, balanced composition, formal presentation',
      composition: 'Symmetrical balance, clear hierarchy, professional spacing',
      mood: 'Trustworthy, established, reliable, premium',
      elements: 'Corporate colors, professional imagery, clean typography, structured layout'
    },
    {
      style: 'Creative Artistic',
      layout: 'Artistic composition with creative elements, unique perspectives, artistic flair',
      composition: 'Creative angles, artistic overlays, unique visual treatments',
      mood: 'Creative, innovative, unique, inspiring',
      elements: 'Artistic effects, creative typography, unique color combinations, artistic imagery'
    },
    {
      style: 'Tech Innovation',
      layout: 'Futuristic design with tech elements, digital aesthetics, modern interfaces',
      composition: 'Digital grid systems, tech-inspired layouts, modern UI elements',
      mood: 'Innovative, cutting-edge, digital, forward-thinking',
      elements: 'Digital effects, tech imagery, modern interfaces, futuristic elements'
    },
    {
      style: 'Cultural Heritage',
      layout: 'Traditional patterns mixed with modern design, cultural elements integrated',
      composition: 'Cultural motifs, traditional-modern fusion, heritage-inspired layouts',
      mood: 'Cultural, authentic, heritage-proud, modern-traditional',
      elements: 'Traditional patterns, cultural colors, heritage imagery, modern interpretation'
    },
    {
      style: 'Luxury Premium',
      layout: 'Elegant, sophisticated layout with premium materials and finishes',
      composition: 'Luxurious spacing, premium typography, elegant proportions',
      mood: 'Luxurious, premium, exclusive, sophisticated',
      elements: 'Premium materials, elegant typography, sophisticated colors, luxury imagery'
    }
  ];

  return variations[seed % variations.length];
}

function getAdvancedPeopleInstructions(businessType: string, location: string): string {
  const culturalContext = getLocalCulturalContext(location);

  return `
**ADVANCED PEOPLE INTEGRATION:**
- ${getCulturallyAppropriatePersonDescription(location)}
- Cultural Context: ${culturalContext}
- Show people in varied, engaging settings:
  * Professional environments (modern offices, studios, workshops)
  * Lifestyle settings (contemporary homes, trendy cafes, outdoor spaces)
  * Industry-specific contexts (${businessType} environments)
  * Cultural celebrations and modern community gatherings
  * Urban settings (co-working spaces, tech hubs, modern city life)
  * Traditional meets modern (cultural heritage with contemporary life)
- Ensure representation reflects local demographics and cultural values
- Show real people in natural, engaging situations that vary by design
- People should be actively engaged with the business/service context
- Use authentic expressions of joy, confidence, success, and community
- Include intergenerational representation when appropriate
- Show modern African/local fashion and styling
- Ensure people are central to the story, not just decorative elements`;
}

// NEW: Industry Intelligence System with World-Class Design Benchmarks
function getIndustryDesignIntelligence(businessType: string): any {
  const industryIntelligence: Record<string, any> = {
    'restaurant': {
      name: 'Restaurant & Food Service',
      worldClassBrands: ['Noma', 'Eleven Madison Park', 'The French Laundry', 'Osteria Francescana', 'Gaggan'],
      designBenchmarks: {
        visualStyle: 'Sophisticated, appetizing, experiential',
        colorPalettes: ['Warm earth tones', 'Rich burgundies', 'Cream whites', 'Deep greens', 'Gold accents'],
        typography: 'Elegant serifs, sophisticated sans-serifs, handwritten touches',
        imagery: 'Food photography, intimate dining scenes, chef portraits, ingredient close-ups',
        layout: 'Clean, spacious, food-focused, premium feel',
        creativeElements: ['Food textures', 'Culinary tools', 'Seasonal ingredients', 'Dining atmosphere', 'Chef artistry']
      },
      creativityFrameworks: [
        'Culinary storytelling through visual narrative',
        'Seasonal and ingredient-driven design evolution',
        'Chef personality and restaurant atmosphere integration',
        'Food photography as art form',
        'Dining experience visualization'
      ],
      industryTrends: ['Farm-to-table aesthetics', 'Minimalist plating influence', 'Chef celebrity culture', 'Sustainable dining', 'Global fusion']
    },

    'technology': {
      name: 'Technology & Innovation',
      worldClassBrands: ['Apple', 'Tesla', 'SpaceX', 'Google', 'Microsoft', 'Adobe'],
      designBenchmarks: {
        visualStyle: 'Futuristic, clean, innovative, premium',
        colorPalettes: ['Deep blues', 'Pure whites', 'Accent colors', 'Gradients', 'Neon highlights'],
        typography: 'Modern sans-serifs, geometric precision, clean hierarchy',
        imagery: 'Abstract tech elements, clean interfaces, innovation concepts, premium materials',
        layout: 'Grid-based, clean lines, lots of white space, focused messaging',
        creativeElements: ['Geometric shapes', 'Digital interfaces', 'Innovation metaphors', 'Premium materials', 'Future concepts']
      },
      creativityFrameworks: [
        'Technology as art and innovation',
        'Clean, premium aesthetic with bold innovation',
        'Future-focused visual storytelling',
        'Interface and product integration',
        'Innovation and progress visualization'
      ],
      industryTrends: ['AI integration', 'Sustainable tech', 'Minimalist interfaces', 'Premium positioning', 'Innovation focus']
    },

    'healthcare': {
      name: 'Healthcare & Wellness',
      worldClassBrands: ['Mayo Clinic', 'Cleveland Clinic', 'Johns Hopkins', 'Stanford Health', 'Cleveland Clinic'],
      designBenchmarks: {
        visualStyle: 'Trustworthy, caring, professional, accessible',
        colorPalettes: ['Calming blues', 'Soft greens', 'Warm whites', 'Accent colors', 'Professional tones'],
        typography: 'Clean, readable fonts, professional hierarchy, accessible sizing',
        imagery: 'Caring professionals, modern facilities, wellness concepts, community health',
        layout: 'Clean, organized, easy to navigate, trustworthy appearance',
        creativeElements: ['Medical symbols', 'Wellness imagery', 'Community health', 'Professional care', 'Modern facilities']
      },
      creativityFrameworks: [
        'Care and compassion through visual design',
        'Trust and professionalism building',
        'Wellness and health promotion',
        'Community health engagement',
        'Modern healthcare accessibility'
      ],
      industryTrends: ['Telehealth integration', 'Patient-centered care', 'Digital health', 'Wellness focus', 'Community health']
    },

    'fitness': {
      name: 'Fitness & Wellness',
      worldClassBrands: ['Peloton', 'Nike', 'Adidas', 'Equinox', 'Planet Fitness', 'CrossFit'],
      designBenchmarks: {
        visualStyle: 'Energetic, motivational, premium, inclusive',
        colorPalettes: ['Bold reds', 'Energetic oranges', 'Motivational yellows', 'Strong blacks', 'Accent colors'],
        typography: 'Bold, energetic fonts, motivational messaging, strong hierarchy',
        imagery: 'Action shots, diverse athletes, motivational scenes, fitness environments',
        layout: 'Dynamic, energetic, motivational, inclusive',
        creativeElements: ['Movement lines', 'Athletic energy', 'Diversity representation', 'Motivational elements', 'Fitness environments']
      },
      creativityFrameworks: [
        'Energy and motivation through visual design',
        'Inclusive fitness for all',
        'Athletic achievement celebration',
        'Community and belonging',
        'Personal transformation stories'
      ],
      industryTrends: ['Digital fitness', 'Inclusive representation', 'Community building', 'Personal transformation', 'Wellness integration']
    },

    'finance': {
      name: 'Finance & Banking',
      worldClassBrands: ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'BlackRock', 'Visa', 'Mastercard'],
      designBenchmarks: {
        visualStyle: 'Trustworthy, sophisticated, stable, premium',
        colorPalettes: ['Deep blues', 'Professional grays', 'Gold accents', 'Clean whites', 'Trustworthy tones'],
        typography: 'Professional serifs, clean sans-serifs, authoritative hierarchy',
        imagery: 'Modern buildings, professional environments, growth concepts, stability symbols',
        layout: 'Structured, professional, trustworthy, premium',
        creativeElements: ['Financial symbols', 'Growth metaphors', 'Stability elements', 'Professional environments', 'Premium materials']
      },
      creativityFrameworks: [
        'Trust and stability through design',
        'Sophistication and premium positioning',
        'Growth and progress visualization',
        'Professional excellence',
        'Financial security representation'
      ],
      industryTrends: ['Digital banking', 'Fintech innovation', 'Sustainable finance', 'Personal finance', 'Cryptocurrency']
    },

    'education': {
      name: 'Education & Learning',
      worldClassBrands: ['Harvard', 'MIT', 'Stanford', 'Coursera', 'Khan Academy', 'Duolingo'],
      designBenchmarks: {
        visualStyle: 'Inspiring, accessible, modern, engaging',
        colorPalettes: ['Inspiring blues', 'Creative purples', 'Warm oranges', 'Growth greens', 'Accent colors'],
        typography: 'Readable fonts, inspiring hierarchy, accessible design',
        imagery: 'Learning environments, diverse students, innovation concepts, growth metaphors',
        layout: 'Engaging, organized, inspiring, accessible',
        creativeElements: ['Learning symbols', 'Growth metaphors', 'Innovation elements', 'Diversity representation', 'Knowledge visualization']
      },
      creativityFrameworks: [
        'Inspiration and learning through design',
        'Accessibility and inclusion',
        'Innovation and progress',
        'Community and collaboration',
        'Personal growth stories'
      ],
      industryTrends: ['Online learning', 'Personalized education', 'STEM focus', 'Global accessibility', 'Innovation in learning']
    },

    'retail': {
      name: 'Retail & E-commerce',
      worldClassBrands: ['Amazon', 'Apple', 'Nike', 'IKEA', 'Zara', 'Uniqlo'],
      designBenchmarks: {
        visualStyle: 'Attractive, commercial, engaging, conversion-focused',
        colorPalettes: ['Brand colors', 'Attractive accents', 'Commercial tones', 'Engaging highlights'],
        typography: 'Commercial fonts, conversion-focused messaging, attractive hierarchy',
        imagery: 'Product showcases, lifestyle integration, commercial appeal, brand personality',
        layout: 'Commercial, attractive, conversion-optimized, engaging',
        creativeElements: ['Product elements', 'Lifestyle integration', 'Commercial appeal', 'Brand personality', 'Conversion elements']
      },
      creativityFrameworks: [
        'Commercial appeal and conversion',
        'Brand personality expression',
        'Lifestyle integration',
        'Product storytelling',
        'Customer engagement'
      ],
      industryTrends: ['E-commerce growth', 'Personalization', 'Sustainability', 'Mobile commerce', 'Social commerce']
    },

    'real estate': {
      name: 'Real Estate & Property',
      worldClassBrands: ['Sotheby\'s', 'Christie\'s', 'Douglas Elliman', 'Compass', 'Zillow'],
      designBenchmarks: {
        visualStyle: 'Luxurious, aspirational, trustworthy, premium',
        colorPalettes: ['Luxury golds', 'Sophisticated grays', 'Premium whites', 'Rich browns', 'Accent colors'],
        typography: 'Luxury fonts, sophisticated hierarchy, premium appearance',
        imagery: 'Luxury properties, premium environments, aspirational lifestyles, professional service',
        layout: 'Luxurious, sophisticated, premium, aspirational',
        creativeElements: ['Luxury elements', 'Premium materials', 'Aspirational lifestyles', 'Professional service', 'Property showcase']
      },
      creativityFrameworks: [
        'Luxury and aspiration through design',
        'Trust and professionalism',
        'Premium positioning',
        'Lifestyle visualization',
        'Property storytelling'
      ],
      industryTrends: ['Digital property viewing', 'Sustainable properties', 'Luxury market growth', 'Technology integration', 'Global investment']
    },

    'default': {
      name: 'Professional Services',
      worldClassBrands: ['McKinsey', 'Bain', 'BCG', 'Deloitte', 'PwC', 'EY'],
      designBenchmarks: {
        visualStyle: 'Professional, trustworthy, modern, sophisticated',
        colorPalettes: ['Professional blues', 'Trustworthy grays', 'Modern accents', 'Clean whites'],
        typography: 'Professional fonts, clean hierarchy, trustworthy appearance',
        imagery: 'Professional environments, modern offices, business concepts, trust symbols',
        layout: 'Professional, organized, trustworthy, modern',
        creativeElements: ['Professional elements', 'Business concepts', 'Trust symbols', 'Modern environments', 'Success indicators']
      },
      creativityFrameworks: [
        'Professional excellence through design',
        'Trust and credibility building',
        'Modern sophistication',
        'Business success visualization',
        'Professional service representation'
      ],
      industryTrends: ['Digital transformation', 'Remote work', 'Sustainability', 'Innovation focus', 'Global expansion']
    }
  };

  return industryIntelligence[businessType.toLowerCase()] || industryIntelligence['default'];
}

// NEW: Enhanced Creativity System with Industry Intelligence
function getEnhancedCreativityFramework(businessType: string, designStyle: string, seed: number): any {
  const industryIntel = getIndustryDesignIntelligence(businessType);

  const creativityFrameworks = [
    {
      name: 'World-Class Benchmarking',
      approach: `Study and emulate the design excellence of ${industryIntel.worldClassBrands.slice(0, 3).join(', ')}`,
      focus: 'Premium positioning, industry best practices, sophisticated aesthetics',
      elements: industryIntel.designBenchmarks.creativeElements,
      description: `Create designs that rival the sophistication and quality of ${industryIntel.name} industry leaders`
    },
    {
      name: 'Industry Trend Integration',
      approach: `Incorporate current ${industryIntel.name} trends: ${industryIntel.industryTrends.slice(0, 3).join(', ')}`,
      focus: 'Modern relevance, industry innovation, forward-thinking design',
      elements: ['Trend elements', 'Innovation concepts', 'Modern aesthetics', 'Industry relevance'],
      description: 'Design that feels current and relevant to the industry while maintaining creativity'
    },
    {
      name: 'Creative Storytelling',
      approach: industryIntel.creativityFrameworks[seed % industryIntel.creativityFrameworks.length],
      focus: 'Narrative design, emotional connection, brand storytelling',
      elements: ['Story elements', 'Emotional triggers', 'Narrative flow', 'Brand personality'],
      description: 'Use visual design to tell compelling stories that connect with the audience'
    },
    {
      name: 'Innovation & Disruption',
      approach: 'Challenge industry conventions with creative innovation',
      focus: 'Breaking norms, creative disruption, unique positioning',
      elements: ['Innovation elements', 'Disruptive concepts', 'Unique approaches', 'Creative risk-taking'],
      description: 'Create designs that stand out by challenging industry conventions'
    },
    {
      name: 'Cultural & Global Fusion',
      approach: 'Blend local cultural elements with global industry standards',
      focus: 'Cultural authenticity, global relevance, unique positioning',
      elements: ['Cultural elements', 'Global standards', 'Local authenticity', 'Fusion concepts'],
      description: 'Create designs that feel both locally authentic and globally competitive'
    }
  ];

  return creativityFrameworks[seed % creativityFrameworks.length];
}

// NEW: Industry-Specific Design Enhancement
function enhanceDesignWithIndustryIntelligence(designPrompt: string, businessType: string, designStyle: string, seed: number): string {
  const industryIntel = getIndustryDesignIntelligence(businessType);
  const creativityFramework = getEnhancedCreativityFramework(businessType, designStyle, seed);

  const industryEnhancement = `
🏭 INDUSTRY INTELLIGENCE INTEGRATION:
**Industry:** ${industryIntel.name}
**World-Class Benchmarks:** ${industryIntel.worldClassBrands.slice(0, 3).join(', ')}
**Industry Visual Style:** ${industryIntel.designBenchmarks.visualStyle}
**Industry Color Palettes:** ${industryIntel.designBenchmarks.colorPalettes.slice(0, 3).join(', ')}
**Industry Typography:** ${industryIntel.designBenchmarks.typography}
**Industry Imagery:** ${industryIntel.designBenchmarks.imagery}
**Industry Layout:** ${industryIntel.designBenchmarks.layout}

🎨 CREATIVITY FRAMEWORK: ${creativityFramework.name}
**Approach:** ${creativityFramework.approach}
**Focus:** ${creativityFramework.focus}
**Creative Elements:** ${creativityFramework.elements.slice(0, 3).join(', ')}
**Description:** ${creativityFramework.description}

🚀 INDUSTRY TRENDS TO INCORPORATE:
${industryIntel.industryTrends.slice(0, 3).map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

🎯 DESIGN REQUIREMENTS:
- **Industry Benchmarking:** Create designs that rival ${industryIntel.name} industry leaders
- **Trend Integration:** Incorporate current industry trends naturally
- **Creative Innovation:** Use ${creativityFramework.name} approach for unique positioning
- **Quality Standards:** Match world-class design quality and sophistication
- **Industry Relevance:** Ensure design feels authentic to ${industryIntel.name} industry`;

  return designPrompt + industryEnhancement;
}

// NEW: Business Intelligence Engine - Local Marketing Expert System
function getBusinessIntelligenceEngine(businessType: string, location: string): any {
  const businessIntelligence: Record<string, any> = {
    'restaurant': {
      name: 'Restaurant & Food Service',
      localExpertise: {
        experience: '25+ years in hospitality and culinary marketing',
        marketDynamics: [
          'Seasonal menu optimization and local ingredient sourcing',
          'Customer loyalty programs and repeat business strategies',
          'Local competition analysis and unique positioning',
          'Food trends and cultural preferences in the area',
          'Pricing strategies for local market conditions'
        ],
        localPhrases: [
          'Taste of [location]',
          'Where locals eat',
          'Fresh from our kitchen',
          'Made with love',
          'Family recipe',
          'Local favorite',
          'Chef\'s special',
          'Daily fresh',
          'Home-cooked taste',
          'Local ingredients'
        ],
        contentStrategies: [
          'Behind-the-scenes kitchen stories',
          'Chef personality and cooking philosophy',
          'Local ingredient sourcing stories',
          'Customer testimonials and success stories',
          'Seasonal menu highlights',
          'Local food culture integration',
          'Community involvement and events',
          'Sustainability and local farming partnerships'
        ],
        engagementHooks: [
          'Food memories and nostalgia',
          'Local pride and community connection',
          'Health and wellness benefits',
          'Family traditions and gatherings',
          'Adventure and trying new flavors',
          'Social sharing and food photography',
          'Exclusive offers and VIP experiences',
          'Local events and celebrations'
        ]
      }
    },

    'technology': {
      name: 'Technology & Innovation',
      localExpertise: {
        experience: '22+ years in tech marketing and digital transformation',
        marketDynamics: [
          'Local tech ecosystem and startup culture',
          'Digital adoption rates in the region',
          'Competitive landscape and innovation gaps',
          'Local talent pool and skill development',
          'Government tech initiatives and support'
        ],
        localPhrases: [
          'Innovation hub',
          'Digital transformation',
          'Tech-forward solutions',
          'Future-ready',
          'Smart [location]',
          'Digital innovation',
          'Tech excellence',
          'Innovation center',
          'Digital leadership',
          'Tech ecosystem'
        ],
        contentStrategies: [
          'Local tech success stories',
          'Innovation case studies',
          'Digital transformation journeys',
          'Tech talent development',
          'Local startup ecosystem',
          'Government tech partnerships',
          'Digital skills training',
          'Smart city initiatives'
        ],
        engagementHooks: [
          'Career advancement and skill development',
          'Innovation and future thinking',
          'Local tech community building',
          'Digital transformation success',
          'Tech entrepreneurship',
          'Smart city development',
          'Digital inclusion',
          'Tech for social good'
        ]
      }
    },

    'healthcare': {
      name: 'Healthcare & Wellness',
      localExpertise: {
        experience: '28+ years in healthcare marketing and patient care',
        marketDynamics: [
          'Local health demographics and needs',
          'Healthcare accessibility and insurance coverage',
          'Competing healthcare providers and services',
          'Local health trends and concerns',
          'Community health initiatives and partnerships'
        ],
        localPhrases: [
          'Your health, our priority',
          'Caring for [location] families',
          'Local healthcare excellence',
          'Community health partner',
          'Your wellness journey',
          'Health close to home',
          'Caring professionals',
          'Local health experts',
          'Community wellness',
          'Health for everyone'
        ],
        contentStrategies: [
          'Patient success stories and testimonials',
          'Local health education and prevention',
          'Community health initiatives',
          'Healthcare professional spotlights',
          'Local health trends and insights',
          'Wellness tips and advice',
          'Health technology integration',
          'Community partnerships and events'
        ],
        engagementHooks: [
          'Family health and wellness',
          'Preventive care and early detection',
          'Local health community',
          'Professional healthcare expertise',
          'Health technology innovation',
          'Community health improvement',
          'Patient-centered care',
          'Health education and awareness'
        ]
      }
    },

    'fitness': {
      name: 'Fitness & Wellness',
      localExpertise: {
        experience: '24+ years in fitness marketing and community building',
        marketDynamics: [
          'Local fitness culture and preferences',
          'Competing gyms and fitness options',
          'Seasonal fitness trends and activities',
          'Local sports teams and community events',
          'Health awareness and wellness trends'
        ],
        localPhrases: [
          'Your fitness journey starts here',
          'Stronger [location] community',
          'Local fitness excellence',
          'Your wellness partner',
          'Fitness for everyone',
          'Local strength',
          'Community fitness',
          'Your health transformation',
          'Local fitness family',
          'Wellness close to home'
        ],
        contentStrategies: [
          'Member transformation stories',
          'Local fitness challenges and events',
          'Community fitness initiatives',
          'Trainer spotlights and expertise',
          'Local sports team partnerships',
          'Seasonal fitness programs',
          'Wellness education and tips',
          'Community health partnerships'
        ],
        engagementHooks: [
          'Personal transformation and goals',
          'Community fitness challenges',
          'Local sports pride',
          'Health and wellness education',
          'Fitness community building',
          'Seasonal fitness motivation',
          'Professional training expertise',
          'Inclusive fitness for all'
        ]
      }
    },

    'finance': {
      name: 'Finance & Banking',
      localExpertise: {
        experience: '26+ years in financial services and local banking',
        marketDynamics: [
          'Local economic conditions and growth',
          'Competing financial institutions',
          'Local business financing needs',
          'Personal finance trends in the area',
          'Community investment opportunities'
        ],
        localPhrases: [
          'Your financial partner in [location]',
          'Local financial expertise',
          'Community banking excellence',
          'Your financial future',
          'Local financial solutions',
          'Community financial partner',
          'Your money, our care',
          'Local financial guidance',
          'Community wealth building',
          'Financial security close to home'
        ],
        contentStrategies: [
          'Local business success stories',
          'Financial education and literacy',
          'Community investment initiatives',
          'Local economic insights',
          'Personal finance success stories',
          'Business financing solutions',
          'Local financial trends',
          'Community financial partnerships'
        ],
        engagementHooks: [
          'Financial security and planning',
          'Local business growth',
          'Community economic development',
          'Personal finance education',
          'Investment opportunities',
          'Business financing solutions',
          'Local economic pride',
          'Financial wellness for families'
        ]
      }
    },

    'education': {
      name: 'Education & Learning',
      localExpertise: {
        experience: '23+ years in educational marketing and community learning',
        marketDynamics: [
          'Local education standards and performance',
          'Competing educational institutions',
          'Local learning needs and preferences',
          'Community education initiatives',
          'Employment and skill development needs'
        ],
        localPhrases: [
          'Learning excellence in [location]',
          'Your educational journey',
          'Local learning excellence',
          'Community education partner',
          'Your learning success',
          'Local educational leadership',
          'Community learning center',
          'Your knowledge partner',
          'Local educational excellence',
          'Learning close to home'
        ],
        contentStrategies: [
          'Student success stories',
          'Local educational achievements',
          'Community learning initiatives',
          'Educational innovation and technology',
          'Local employment partnerships',
          'Skill development programs',
          'Community education events',
          'Local learning trends'
        ],
        engagementHooks: [
          'Personal growth and development',
          'Career advancement opportunities',
          'Local educational pride',
          'Community learning initiatives',
          'Innovation in education',
          'Skill development and training',
          'Local employment success',
          'Educational excellence recognition'
        ]
      }
    },

    'retail': {
      name: 'Retail & E-commerce',
      localExpertise: {
        experience: '25+ years in retail marketing and customer experience',
        marketDynamics: [
          'Local shopping preferences and trends',
          'Competing retail options and malls',
          'Local economic conditions and spending',
          'Seasonal shopping patterns',
          'Community shopping habits and events'
        ],
        localPhrases: [
          'Your local shopping destination',
          'Shopping excellence in [location]',
          'Local retail leadership',
          'Your shopping partner',
          'Local retail excellence',
          'Community shopping center',
          'Your retail destination',
          'Local shopping experience',
          'Community retail partner',
          'Shopping close to home'
        ],
        contentStrategies: [
          'Local product highlights',
          'Customer success stories',
          'Community shopping events',
          'Local brand partnerships',
          'Seasonal shopping guides',
          'Local shopping trends',
          'Community retail initiatives',
          'Local customer appreciation'
        ],
        engagementHooks: [
          'Local product discovery',
          'Community shopping events',
          'Seasonal shopping excitement',
          'Local brand support',
          'Customer appreciation',
          'Shopping convenience',
          'Local retail pride',
          'Community shopping experience'
        ]
      }
    },

    'real estate': {
      name: 'Real Estate & Property',
      localExpertise: {
        experience: '27+ years in real estate marketing and local property',
        marketDynamics: [
          'Local property market conditions',
          'Competing real estate agencies',
          'Local property trends and values',
          'Community development and growth',
          'Local investment opportunities'
        ],
        localPhrases: [
          'Your local real estate expert',
          'Real estate excellence in [location]',
          'Local property specialist',
          'Your property partner',
          'Local real estate leadership',
          'Community property expert',
          'Your real estate guide',
          'Local property excellence',
          'Community real estate partner',
          'Property close to home'
        ],
        contentStrategies: [
          'Local property success stories',
          'Community development updates',
          'Local property market insights',
          'Property investment opportunities',
          'Local neighborhood highlights',
          'Community real estate events',
          'Local property trends',
          'Community property partnerships'
        ],
        engagementHooks: [
          'Property investment opportunities',
          'Local neighborhood pride',
          'Community development',
          'Property market insights',
          'Local real estate success',
          'Community property events',
          'Property investment guidance',
          'Local real estate expertise'
        ]
      }
    },

    'default': {
      name: 'Professional Services',
      localExpertise: {
        experience: '20+ years in professional services and local business',
        marketDynamics: [
          'Local business environment and competition',
          'Community business needs and trends',
          'Local economic conditions',
          'Business development opportunities',
          'Community partnerships and networking'
        ],
        localPhrases: [
          'Your local business partner',
          'Professional excellence in [location]',
          'Local business expertise',
          'Your success partner',
          'Local professional leadership',
          'Community business partner',
          'Your business guide',
          'Local professional excellence',
          'Community business expert',
          'Success close to home'
        ],
        contentStrategies: [
          'Local business success stories',
          'Community business initiatives',
          'Local business insights',
          'Business development opportunities',
          'Local business trends',
          'Community business events',
          'Local business partnerships',
          'Community business support'
        ],
        engagementHooks: [
          'Business growth and success',
          'Local business community',
          'Professional development',
          'Business opportunities',
          'Local business pride',
          'Community business support',
          'Business innovation',
          'Local business expertise'
        ]
      }
    },
    'financial technology software': {
      name: 'Financial Technology Software',
      localExpertise: {
        experience: '15+ years in fintech and digital payments',
        marketDynamics: [
          'Digital payment adoption rates in the region',
          'Mobile banking and fintech competition',
          'Financial inclusion and accessibility needs',
          'Regulatory compliance and security requirements',
          'Local banking partnerships and integrations'
        ],
        contentStrategies: [
          'Digital financial innovation',
          'Payment security and trust',
          'Financial inclusion stories',
          'Fintech industry insights',
          'User experience excellence',
          'Local market expansion',
          'Partnership announcements',
          'Technology advancement'
        ],
        engagementHooks: [
          'Financial innovation',
          'Digital payments',
          'Financial inclusion',
          'Secure transactions',
          'Fintech solutions',
          'Payment convenience',
          'Financial empowerment',
          'Digital banking'
        ]
      },
      localPhrases: [
        'Your digital payment partner',
        'Fintech innovation in [location]',
        'Digital financial solutions',
        'Your payment solution',
        'Financial technology excellence',
        'Digital banking for [location]',
        'Your fintech partner',
        'Payment innovation'
      ]
    },
    'default': {
      name: 'Professional Services',
      localExpertise: {
        experience: '20+ years in professional services',
        marketDynamics: [
          'Local business environment and competition',
          'Market trends and opportunities',
          'Customer needs and preferences',
          'Industry best practices and standards',
          'Local economic conditions and growth'
        ],
        contentStrategies: [
          'Professional excellence and expertise',
          'Client success stories',
          'Industry insights and trends',
          'Local market knowledge',
          'Service quality and reliability',
          'Innovation and solutions',
          'Community involvement',
          'Professional development'
        ],
        engagementHooks: [
          'Professional excellence',
          'Client success',
          'Industry expertise',
          'Local market knowledge',
          'Quality service',
          'Innovation solutions',
          'Community partnership',
          'Professional growth'
        ]
      },
      localPhrases: [
        'Your local professional partner',
        'Excellence in [location]',
        'Local expertise you can trust',
        'Your success partner',
        'Professional solutions for [location]',
        'Local industry leadership',
        'Your trusted advisor',
        'Professional excellence'
      ]
    }
  };

  const result = businessIntelligence[businessType.toLowerCase()] || businessIntelligence['default'];
  return result;
}

// NEW: Dynamic Content Strategy Engine - Never Repetitive
function getDynamicContentStrategy(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);

  const contentStrategies = [
    {
      name: 'Local Market Expert',
      approach: `Position as the ${businessIntel.name} expert in ${location} with ${businessIntel.localExpertise.experience}`,
      focus: 'Local expertise, community knowledge, market insights',
      hooks: businessIntel.localExpertise.engagementHooks.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['local expertise', 'community focused', 'trusted service', 'proven results']).slice(0, 4),
      description: `Write like a ${businessIntel.localExpertise.experience} professional who knows ${location} inside and out`
    },
    {
      name: 'Community Storyteller',
      approach: `Share authentic stories about local ${businessIntel.name} success and community impact`,
      focus: 'Real stories, community connection, authentic experiences',
      hooks: businessIntel.localExpertise.engagementHooks.slice(4, 8),
      phrases: (businessIntel.localPhrases || ['community stories', 'local success', 'authentic experiences', 'real results']).slice(4, 8),
      description: 'Share real, relatable stories that connect with the local community'
    },
    {
      name: 'Industry Innovator',
      approach: `Showcase cutting-edge ${businessIntel.name} solutions and industry leadership`,
      focus: 'Innovation, industry trends, competitive advantage',
      hooks: businessIntel.localExpertise.contentStrategies.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['innovative solutions', 'industry leader', 'cutting-edge', 'advanced technology']).slice(0, 4),
      description: 'Position as an industry leader with innovative solutions and insights'
    },
    {
      name: 'Problem Solver',
      approach: `Address specific ${businessIntel.name} challenges that local businesses and people face`,
      focus: 'Problem identification, solution offering, value demonstration',
      hooks: businessIntel.localExpertise.marketDynamics.slice(0, 4),
      phrases: (businessIntel.localPhrases || ['problem solver', 'effective solutions', 'proven results', 'reliable service']).slice(0, 4),
      description: 'Identify and solve real problems that matter to the local community'
    },
    {
      name: 'Success Catalyst',
      approach: `Inspire and guide local ${businessIntel.name} success through proven strategies`,
      focus: 'Success stories, proven methods, inspirational guidance',
      hooks: businessIntel.localExpertise.contentStrategies.slice(4, 8),
      phrases: (businessIntel.localPhrases || ['success catalyst', 'proven strategies', 'inspiring results', 'growth partner']).slice(4, 8),
      description: 'Inspire success through proven strategies and real results'
    }
  ];

  return contentStrategies[seed % contentStrategies.length];
}

// NEW: Human Writing Style Generator - Authentic, Engaging
function getHumanWritingStyle(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);

  const writingStyles = [
    {
      name: 'Conversational Expert',
      tone: 'Friendly, knowledgeable, approachable',
      voice: `Like a ${businessIntel.localExpertise.experience} professional chatting with a friend over coffee`,
      characteristics: [
        'Use local phrases naturally',
        'Share personal insights and experiences',
        'Ask engaging questions',
        'Use conversational language',
        'Show genuine enthusiasm for the business'
      ],
      examples: [
        `"You know what I love about ${location}? The way our community..."`,
        `"After ${businessIntel.localExpertise.experience} in this industry, I've learned..."`,
        `"Here's something that always makes me smile about our business..."`
      ]
    },
    {
      name: 'Storytelling Mentor',
      tone: 'Inspirational, narrative, engaging',
      voice: 'Like sharing a compelling story that teaches and inspires',
      characteristics: [
        'Start with intriguing hooks',
        'Build narrative tension',
        'Include relatable characters',
        'End with meaningful insights',
        'Use vivid, descriptive language'
      ],
      examples: [
        `"Last week, something incredible happened that reminded me why..."`,
        `"I'll never forget the day when..."`,
        `"There's a story behind every success, and this one..."`
      ]
    },
    {
      name: 'Local Champion',
      tone: 'Proud, community-focused, authentic',
      voice: 'Like a proud local business owner celebrating community success',
      characteristics: [
        'Celebrate local achievements',
        'Use local pride and identity',
        'Highlight community connections',
        'Show genuine local love',
        'Connect business to community values'
      ],
      examples: [
        `"This is why I'm so proud to be part of the ${location} community..."`,
        `"Our ${location} neighbors never cease to amaze me..."`,
        `"There's something special about doing business in ${location}..."`
      ]
    },
    {
      name: 'Problem-Solving Partner',
      tone: 'Helpful, solution-oriented, trustworthy',
      voice: 'Like a trusted advisor helping solve real problems',
      characteristics: [
        'Identify real problems',
        'Offer practical solutions',
        'Show understanding and empathy',
        'Build trust through expertise',
        'Focus on customer benefit'
      ],
      examples: [
        `"I've noticed that many ${location} businesses struggle with..."`,
        `"Here's a solution that's worked for countless local businesses..."`,
        `"Let me share what I've learned about solving this common challenge..."`
      ]
    },
    {
      name: 'Success Celebrator',
      tone: 'Enthusiastic, celebratory, motivational',
      voice: 'Like celebrating wins and inspiring future success',
      characteristics: [
        'Celebrate achievements',
        'Share success stories',
        'Inspire future action',
        'Use positive, uplifting language',
        'Connect success to community'
      ],
      examples: [
        `"I'm thrilled to share some amazing news from our ${location} community..."`,
        `"This success story is exactly why I love ${businessIntel.name} in ${location}..."`,
        `"Let's celebrate this incredible achievement together..."`
      ]
    }
  ];

  return writingStyles[seed % writingStyles.length];
}

// NEW: Anti-Repetition Content Engine
function generateUniqueContentVariation(businessType: string, location: string, seed: number): any {
  const businessIntel = getBusinessIntelligenceEngine(businessType, location);
  const contentStrategy = getDynamicContentStrategy(businessType, location, seed);
  const writingStyle = getHumanWritingStyle(businessType, location, seed);

  // Generate unique content angle based on multiple factors
  const contentAngles = [
    {
      type: 'Local Insight',
      focus: `Share unique ${businessIntel.name} insights specific to ${location}`,
      examples: [
        `"What I've learned about ${businessIntel.name} in ${location} after ${businessIntel.localExpertise.experience}..."`,
        `"The ${businessIntel.name} landscape in ${location} is unique because..."`,
        `"Here's what makes ${location} special for ${businessIntel.name} businesses..."`
      ]
    },
    {
      type: 'Community Story',
      focus: `Tell a compelling story about local ${businessIntel.name} impact`,
      examples: [
        `"Last month, something incredible happened in our ${location} community..."`,
        `"I want to share a story that perfectly captures why we do what we do..."`,
        `"This is the kind of moment that makes ${businessIntel.name} in ${location} special..."`
      ]
    },
    {
      type: 'Industry Innovation',
      focus: `Showcase cutting-edge ${businessIntel.name} solutions`,
      examples: [
        `"We're excited to introduce something that's changing ${businessIntel.name} in ${location}..."`,
        `"Here's how we're innovating in the ${businessIntel.name} space..."`,
        `"This new approach is revolutionizing how we do ${businessIntel.name} in ${location}..."`
      ]
    },
    {
      type: 'Problem Solution',
      focus: `Address specific ${businessIntel.name} challenges in ${location}`,
      examples: [
        `"I've noticed that many ${location} businesses struggle with..."`,
        `"Here's a common challenge in ${businessIntel.name} and how we solve it..."`,
        `"Let me share what I've learned about overcoming this ${businessIntel.name} obstacle..."`
      ]
    },
    {
      type: 'Success Celebration',
      focus: `Celebrate local ${businessIntel.name} achievements`,
      examples: [
        `"I'm thrilled to share some amazing news from our ${location} community..."`,
        `"This success story is exactly why I love ${businessIntel.name} in ${location}..."`,
        `"Let's celebrate this incredible achievement together..."`
      ]
    }
  ];

  const selectedAngle = contentAngles[seed % contentAngles.length];

  return {
    contentStrategy: contentStrategy,
    writingStyle: writingStyle,
    contentAngle: selectedAngle,
    uniqueSignature: `${selectedAngle.type}-${contentStrategy.name}-${writingStyle.name}-${seed}`,
    localPhrases: (businessIntel.localPhrases || ['professional service', 'quality results', 'trusted expertise']).slice(0, 3),
    engagementHooks: businessIntel.localExpertise.engagementHooks.slice(0, 3),
    marketInsights: businessIntel.localExpertise.marketDynamics.slice(0, 2)
  };
}

// Helper functions for context generation
function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

function generateContextualTrends(businessType: string, location: string): any[] {
  const trends = [
    { topic: `${businessType} innovation trends`, category: 'Industry', relevance: 'high' },
    { topic: `${location} business growth`, category: 'Local', relevance: 'high' },
    { topic: 'Digital transformation', category: 'Technology', relevance: 'medium' },
    { topic: 'Customer experience optimization', category: 'Business', relevance: 'high' },
    { topic: 'Sustainable business practices', category: 'Trends', relevance: 'medium' }
  ];
  return trends.slice(0, 3);
}

function generateWeatherContext(location: string): any {
  // Simplified weather context based on location and season
  const season = getSeason();
  const contexts = {
    'Spring': { condition: 'Fresh and energizing', business_impact: 'New beginnings, growth opportunities', content_opportunities: 'Renewal, fresh starts, growth themes' },
    'Summer': { condition: 'Bright and active', business_impact: 'High energy, outdoor activities', content_opportunities: 'Vibrant colors, active lifestyle, summer solutions' },
    'Fall': { condition: 'Cozy and productive', business_impact: 'Planning, preparation, harvest', content_opportunities: 'Preparation, results, autumn themes' },
    'Winter': { condition: 'Focused and strategic', business_impact: 'Planning, reflection, indoor focus', content_opportunities: 'Planning, strategy, winter solutions' }
  };

  return {
    temperature: '22',
    condition: contexts[season as keyof typeof contexts].condition,
    business_impact: contexts[season as keyof typeof contexts].business_impact,
    content_opportunities: contexts[season as keyof typeof contexts].content_opportunities
  };
}

function generateLocalOpportunities(businessType: string, location: string): any[] {
  const opportunities = [
    { name: `${location} Business Expo`, venue: 'Local Convention Center', relevance: 'networking' },
    { name: `${businessType} Innovation Summit`, venue: 'Business District', relevance: 'industry' },
    { name: 'Local Entrepreneur Meetup', venue: 'Community Center', relevance: 'community' }
  ];
  return opportunities.slice(0, 2);
}

// Get API keys (supporting both server-side and client-side)
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

if (!apiKey) {
}

// Initialize Google GenAI client with Revo 1.0 configuration
const ai = new GoogleGenerativeAI(apiKey);

// Revo 1.0 uses the configured Gemini model
const REVO_1_0_MODEL = revo10Config.aiService;

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
 * MOBILE-FIRST: Optimized for 992x1056px format
 */
function getPlatformDimensionsText(aspectRatio: string): string {
  switch (aspectRatio) {
    case '1:1': return '992x1056px HD (Mobile-optimized)';
    case '16:9': return '992x1056px HD (Mobile-optimized)';
    case '9:16': return 'Portrait format - 1080x1920px (Stories/Reels)';
    case '4:5': return '992x1056px HD (Mobile-optimized)';
    case '21:9': return '992x1056px HD (Mobile-optimized)';
    default: return '992x1056px HD (Mobile-optimized)';
  }
}

/**
 * Generate content using Revo 1.0 with Gemini 2.5 Flash Image Preview
 */
export async function generateRevo10Content(input: {
  businessType: string;
  businessName: string;
  location: string;
  platform: string;
  writingTone: string;
  contentThemes: string[];
  targetAudience: string;
  services: string;
  keyFeatures: string;
  competitiveAdvantages: string;
  dayOfWeek: string;
  currentDate: string;
  primaryColor?: string;
  visualStyle?: string;
  includeContacts?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  websiteUrl?: string;
}) {
  try {
    // Auto-detect platform-specific aspect ratio
    const aspectRatio = getPlatformAspectRatio(input.platform);
    console.log(`🎯 Revo 1.0: Using ${aspectRatio} aspect ratio for ${input.platform}`);

    // Convert input to BusinessProfile for advanced analysis
    const businessProfile: BusinessProfile = {
      businessName: input.businessName,
      businessType: input.businessType,
      location: input.location,
      targetAudience: input.targetAudience,
      brandVoice: input.writingTone,
      uniqueSellingPoints: [input.competitiveAdvantages || 'Quality service'],
      competitors: [], // Could be enhanced with competitor data
    };

    // 📊 GENERATE ADVANCED CONTENT WITH DEEP ANALYSIS
    const advancedContent = await advancedContentGenerator.generateEngagingContent(
      businessProfile,
      input.platform,
      'promotional'
    );

    // 🎯 GET TRENDING INSIGHTS FOR ENHANCED RELEVANCE
    const trendingEnhancement = await trendingEnhancer.getTrendingEnhancement({
      businessType: input.businessType,
      platform: input.platform,
      location: input.location,
      targetAudience: input.targetAudience,
    });

    // 📈 ANALYZE PERFORMANCE FOR CONTINUOUS IMPROVEMENT
    const performanceAnalysis = performanceAnalyzer.analyzePerformance(
      advancedContent,
      businessProfile
    );

    // Extract hashtags from advanced content for use in business-specific generation
    const hashtags = advancedContent.hashtags;

    // Gather real-time context data (keeping existing functionality)
    const realTimeContext = await gatherRealTimeContext(input.businessType, input.location, input.platform);

    const model = ai.getGenerativeModel({
      model: REVO_1_0_MODEL,
      generationConfig: {
        temperature: revo10Config.promptSettings.temperature,
        topP: revo10Config.promptSettings.topP,
        topK: revo10Config.promptSettings.topK,
        maxOutputTokens: revo10Config.promptSettings.maxTokens,
      },
    });

    // Debug logging for contact information
    console.log('🔍 [Revo 1.0] Contact Information Debug:', {
      includeContacts: input.includeContacts,
      contactInfo: input.contactInfo,
      websiteUrl: input.websiteUrl,
      hasPhone: !!input.contactInfo?.phone,
      hasEmail: !!input.contactInfo?.email,
      hasAddress: !!input.contactInfo?.address
    });

    // Store original contact info for image generation, but remove from content generation
    const originalContactInfo = input.contactInfo;
    const originalWebsiteUrl = input.websiteUrl;
    const originalIncludeContacts = input.includeContacts;

    // Temporarily remove contact info during content generation to prevent AI from accessing it
    const contentGenerationInput = {
      ...input,
      contactInfo: undefined,
      websiteUrl: undefined,
      includeContacts: false
    };

    // Build the content generation prompt with enhanced brand context (using contact-free input)
    const contentPrompt = revo10Prompts.CONTENT_USER_PROMPT_TEMPLATE
      .replace('{businessName}', contentGenerationInput.businessName)
      .replace('{businessType}', contentGenerationInput.businessType)
      .replace('{platform}', contentGenerationInput.platform)
      .replace('{writingTone}', contentGenerationInput.writingTone)
      .replace('{location}', contentGenerationInput.location)
      .replace('{primaryColor}', contentGenerationInput.primaryColor || '#3B82F6')
      .replace('{visualStyle}', contentGenerationInput.visualStyle || 'modern')
      .replace('{targetAudience}', contentGenerationInput.targetAudience)
      .replace('{services}', contentGenerationInput.services || '')
      .replace('{keyFeatures}', contentGenerationInput.keyFeatures || '')
      .replace('{competitiveAdvantages}', contentGenerationInput.competitiveAdvantages || '')
      .replace('{contentThemes}', Array.isArray(contentGenerationInput.contentThemes) ? contentGenerationInput.contentThemes.join(', ') : 'general business content')
      .replace('{contactPhone}', '') // Contact details will be added during image generation
      .replace('{contactEmail}', '') // Contact details will be added during image generation
      .replace('{contactAddress}', '') // Contact details will be added during image generation
      .replace('{websiteUrl}', ''); // Contact details will be added during image generation

    // Debug logging for the final prompt
    console.log('🔍 [Revo 1.0] Final Prompt Contact Section:', {
      includeContactsInPrompt: contentPrompt.includes('Include Contacts: true'),
      contactPhoneInPrompt: contentPrompt.includes(input.contactInfo?.phone || ''),
      contactEmailInPrompt: contentPrompt.includes(input.contactInfo?.email || ''),
      contactAddressInPrompt: contentPrompt.includes(input.contactInfo?.address || ''),
      websiteUrlInPrompt: contentPrompt.includes(input.websiteUrl || '')
    });

    // Show the actual contact section of the prompt
    const contactSection = contentPrompt.split('Contact Information:')[1]?.split('Requirements:')[0] || 'NOT FOUND';
    console.log('🔍 [Revo 1.0] Contact Section of Prompt:', contactSection);


    // 🎨 CREATIVE CAPTION GENERATION: Apply creative enhancement system

    // NEW: Get business intelligence and local marketing expertise
    const businessIntel = getBusinessIntelligenceEngine(input.businessType, input.location);
    const randomSeed = Math.floor(Math.random() * 10000) + Date.now();
    const uniqueContentVariation = generateUniqueContentVariation(input.businessType, input.location, randomSeed % 1000);


    // 🎯 NEW: Generate business-specific content strategy

    const businessDetails = {
      experience: '5+ years', // Could be extracted from business profile
      expertise: input.keyFeatures,
      services: input.services,
      location: input.location,
      targetAudience: input.targetAudience
    };

    // Generate strategic content plan based on business type and goals
    const contentPlan = StrategicContentPlanner.generateBusinessSpecificContent(
      input.businessType,
      input.businessName,
      input.location,
      businessDetails,
      input.platform,
      'awareness' // Can be dynamic based on business goals
    );


    // 🎨 NEW: Generate business-specific headlines and subheadlines with AI

    const businessHeadline = await generateBusinessSpecificHeadline(
      contentGenerationInput.businessType,
      contentGenerationInput.businessName,
      contentGenerationInput.location,
      businessDetails,
      contentGenerationInput.platform,
      'awareness',
      trendingEnhancement,
      advancedContent
    );

    const businessSubheadline = await generateBusinessSpecificSubheadline(
      contentGenerationInput.businessType,
      contentGenerationInput.businessName,
      contentGenerationInput.location,
      businessDetails,
      businessHeadline.headline,
      'awareness',
      trendingEnhancement,
      advancedContent
    );


    // 📝 NEW: Generate AI-powered business-specific caption

    const businessCaption = await generateBusinessSpecificCaption(
      contentGenerationInput.businessType,
      contentGenerationInput.businessName,
      contentGenerationInput.location,
      businessDetails,
      contentGenerationInput.platform,
      'awareness',
      trendingEnhancement,
      advancedContent,
      {
        includeContacts: false, // Always false for content generation
        phone: undefined, // No contact info in content generation
        email: undefined, // No contact info in content generation
        address: undefined, // No contact info in content generation
        websiteUrl: undefined // No contact info in content generation
      }
    );


    // 🎯 BUSINESS-SPECIFIC CAPTION GENERATION COMPLETE

    // 🎯 BUSINESS-SPECIFIC CONTENT GENERATION COMPLETE

    // 🎯 FINAL: Return business-specific content package

    const finalContent = {
      content: businessCaption.caption,
      headline: businessHeadline.headline,
      subheadline: businessSubheadline.subheadline,
      callToAction: businessCaption.callToAction,
      hashtags: hashtags,
      catchyWords: businessHeadline.headline, // Use business-specific headline
      contentStrategy: contentPlan.strategy,
      businessStrengths: contentPlan.businessStrengths,
      marketOpportunities: contentPlan.marketOpportunities,
      valueProposition: contentPlan.valueProposition,
      platform: input.platform,
      businessType: input.businessType,
      location: input.location,
      realTimeContext: realTimeContext, // Pass context to image generator
      creativeContext: { // Enhanced creative context for image generation
        style: businessHeadline.approach,
        tone: businessHeadline.emotionalImpact,
        framework: businessSubheadline.framework,
        businessInsights: contentPlan,
        variation: uniqueContentVariation
      },
      // 🧠 BUSINESS INTELLIGENCE DATA
      businessIntelligence: {
        contentGoal: contentPlan.strategy.goal,
        businessStrengths: contentPlan.businessStrengths,
        marketOpportunities: contentPlan.marketOpportunities,
        customerPainPoints: contentPlan.customerPainPoints,
        valueProposition: contentPlan.valueProposition,
        localRelevance: contentPlan.localRelevance
      },
      variants: [{
        platform: input.platform,
        aspectRatio: getPlatformAspectRatio(input.platform),
        imageUrl: '' // Will be generated separately
      }],
      generatedAt: new Date().toISOString()
    };


    return finalContent;

  } catch (error) {
    throw new Error(`Revo 1.0 content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate design using Revo 1.0 with Gemini 2.5 Flash Image Preview
 */
export async function generateRevo10Design(input: {
  businessType: string;
  businessName: string;
  platform: string;
  visualStyle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  imageText: string;
}) {
  try {

    const model = ai.getGenerativeModel({
      model: REVO_1_0_MODEL,
      generationConfig: {
        temperature: revo10Config.promptSettings.temperature,
        topP: revo10Config.promptSettings.topP,
        topK: revo10Config.promptSettings.topK,
        maxOutputTokens: revo10Config.promptSettings.maxTokens,
      },
    });

    // Build the design generation prompt
    const designPrompt = `Create a creative design concept for ${input.businessName} (${input.businessType}) that feels like it was imagined by a human designer.

Think like a creative professional who:
- Starts with a visual story or concept, not a template
- Uses colors and elements that feel chosen, not generated
- Creates layouts that feel natural and organic
- Thinks about the emotional impact, not just technical perfection

DESIGN BRIEF:
- Business: ${input.businessName} (${input.businessType})
- Platform: ${input.platform}
- Style: ${input.visualStyle}
- Colors: Primary ${input.primaryColor}, Accent ${input.accentColor}, Background ${input.backgroundColor}
- Message: ${input.imageText}

CREATIVE APPROACH:
- What's the visual story you want to tell?
- How can you make this feel authentic and engaging?
- What unexpected elements would make this memorable?
- How can you avoid looking like every other business post?

DESIGN DESCRIPTION:
Describe your creative concept in natural, designer language. Focus on the creative vision, mood, and story - not technical specifications. Make it sound like a designer explaining their idea to a client.

Remember: You're a creative human designer, not an AI. Think with imagination and artistic vision.`;


    const result = await model.generateContent([
      revo10Prompts.DESIGN_SYSTEM_PROMPT,
      designPrompt
    ]);

    const response = await result.response;
    const design = response.text();


    const aspectRatio = getPlatformAspectRatio(input.platform);

    return {
      design: design.trim(),
      aspectRatio,
      resolution: '2048x2048',
      quality: 'enhanced'
    };

  } catch (error) {
    throw new Error(`Revo 1.0 design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


// Ensure website URL is displayed as www.example.com (strip protocol, add www., no trailing slash)
function ensureWwwWebsiteUrl(url?: string): string {
  if (!url) return '';
  const base = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
  return base ? `www.${base}` : '';
}

/**
 * Generate image using Revo 1.0 with Gemini 2.5 Flash Image Preview
 */
export async function generateRevo10Image(input: {
  businessType: string;
  businessName: string;
  platform: string;
  visualStyle: string;
  primaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  imageText: string;
  designDescription: string;
  logoDataUrl?: string;
  location?: string;
  headline?: string;
  subheadline?: string;
  callToAction?: string;
  realTimeContext?: any;
  creativeContext?: any; // Add creative context from content generation
  includeContacts?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  websiteUrl?: string;
}) {
  try {

    // 🎨 CREATIVE ENHANCEMENT: Apply creative design system
    let creativeDesignEnhancement = '';
    if (input.creativeContext) {
      const designEnhancement = enhanceDesignCreativity(
        input.designDescription,
        input.businessType,
        input.location || 'Global',
        input.creativeContext
      );

      creativeDesignEnhancement = `
🎨 CREATIVE DESIGN ENHANCEMENT SYSTEM ACTIVATED:
${designEnhancement.enhancedPrompt}

CREATIVE VISUAL STYLE: ${designEnhancement.visualStyle}
CREATIVE ELEMENTS TO INCORPORATE: ${designEnhancement.creativeElements.join(', ')}
BUSINESS CREATIVE INSIGHTS: ${input.creativeContext.businessInsights?.creativePotential?.slice(0, 3).join(', ') || 'Professional excellence'}
EMOTIONAL DESIGN TONE: ${input.creativeContext.tone} with ${input.creativeContext.style} approach
CREATIVE FRAMEWORK: ${input.creativeContext.framework} storytelling structure

ANTI-GENERIC REQUIREMENTS:
- NO template-like designs or stock photo aesthetics
- NO boring business layouts or predictable compositions
- NO generic color schemes or uninspiring visual elements
- CREATE something memorable, unique, and emotionally engaging
- USE unexpected visual metaphors and creative storytelling
- INCORPORATE cultural elements naturally and authentically
- DESIGN with emotional intelligence and creative sophistication
`;

    }

    const model = ai.getGenerativeModel({
      model: REVO_1_0_MODEL,
      generationConfig: {
        temperature: revo10Config.promptSettings.temperature,
        topP: revo10Config.promptSettings.topP,
        topK: revo10Config.promptSettings.topK,
        maxOutputTokens: revo10Config.promptSettings.maxTokens,
      },
    });

    // Build advanced professional design prompt
    const brandInfo = input.location ? ` based in ${input.location}` : '';
    const colorScheme = `Primary: ${input.primaryColor} (60% dominant), Accent: ${input.accentColor || '#1E40AF'} (30% secondary), Background: ${input.backgroundColor || '#FFFFFF'} (10% highlights)`;
    const logoInstruction = input.logoDataUrl ?
      'Use the provided brand logo (do NOT create new logo - integrate existing one naturally)' :
      'Create professional design without logo overlay';

    // Prepare structured content display with hierarchy
    const contentStructure = [];
    if (input.headline) contentStructure.push(`PRIMARY (Largest, most prominent): "${input.headline}"`);
    if (input.subheadline) contentStructure.push(`SECONDARY (Medium, supporting): "${input.subheadline}"`);
    if (input.callToAction) contentStructure.push(`CTA (Bold, action-oriented, prominent like "PAYA: YOUR FUTURE, NOW!" style): "${input.callToAction}"`);

    // 🎯 CTA PROMINENCE INSTRUCTIONS (like Paya example)
    const ctaInstructions = input.callToAction ? `

🎯 CRITICAL CTA DISPLAY REQUIREMENTS (LIKE PAYA EXAMPLE):
- The CTA "${input.callToAction}" MUST be displayed prominently on the design
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
    ` : '';


    // Get advanced design features
    const businessDesignDNA = getBusinessDesignDNA(input.businessType);
    const platformOptimization = getPlatformOptimization(input.platform);
    const shouldIncludePeople = shouldIncludePeopleInDesign(input.businessType, input.location || 'Global', input.visualStyle);
    const peopleInstructions = shouldIncludePeople ? getAdvancedPeopleInstructions(input.businessType, input.location || 'Global') : '';
    const culturalContext = getLocalCulturalContext(input.location || 'Global');


    // Generate human-like design variation for authentic, creative designs
    const designRandomSeed = Math.floor(Math.random() * 10000) + Date.now();
    const designSeed = designRandomSeed % 10000;
    const designVariations = getHumanDesignVariations(designSeed);

    // NEW: Get industry intelligence and creativity framework
    const industryIntel = getIndustryDesignIntelligence(input.businessType);
    const creativityFramework = getEnhancedCreativityFramework(input.businessType, designVariations.style, designSeed);


    let imagePrompt = `🎨 Create a ${designVariations.style.toLowerCase()} social media design for ${input.businessName} that looks completely different from typical business posts and feels genuinely human-made.

BUSINESS CONTEXT:
- Business: ${input.businessName} (${input.businessType})
- Platform: ${input.platform}
- Message: ${input.imageText}
- Location: ${input.location || 'Global'}

${ctaInstructions}

TEXT CONTENT TO DISPLAY:
${contentStructure.map(item => `- ${item}`).join('\n')}

DESIGN APPROACH:
- Create a design that's VISUALLY APPEALING and engaging
- Focus on the specific style: ${designVariations.style}
- Make it look genuinely different from other design types
- Each design type should have its own unique visual language
- **MOST IMPORTANT: Make it look like a human designer made it, not AI**
- **CRITICAL: Include ALL text content listed above in the design**

VISUAL STYLE:
- ${businessDesignDNA}
- ${platformOptimization}
- **SPECIFIC STYLE REQUIREMENTS: ${designVariations.description}**
- Use colors and elements that match this specific style
- Typography should match the style's mood and approach

🌍 CULTURAL REPRESENTATION & LOCAL TOUCH:
- ${culturalContext}
- **Keep cultural elements subtle and natural - don't force them**
- Use local colors and textures naturally, not as obvious cultural markers
- Make it feel authentic to the location without being stereotypical
- Focus on the design style first, local elements second

${peopleInstructions ? `
👥 PEOPLE REPRESENTATION:
${peopleInstructions}
` : ''}

DESIGN VARIATION:
**STYLE: ${designVariations.style}**
- Layout: ${designVariations.layout}
- Composition: ${designVariations.composition}
- Mood: ${designVariations.mood}
- Elements: ${designVariations.elements}

KEY DESIGN PRINCIPLES:
1. **STYLE-SPECIFIC APPROACH** - Follow the exact style requirements for ${designVariations.style}
2. **VISUAL UNIQUENESS** - Make this look completely different from other design types
3. **STYLE AUTHENTICITY** - If it's watercolor, make it look like real watercolor; if it's meme-style, make it look like a real meme
4. **HUMAN TOUCH** - Make it look like a human designer made it, not AI
5. **BUSINESS APPROPRIATENESS** - Keep it professional while being creative

WHAT TO AVOID:
- Overly complex layouts
- Too many competing elements
- Boring, generic business designs
- Poor contrast or readability
- Outdated design styles
- **MOST IMPORTANT: Don't make this look like the other design types - each should be genuinely unique**
- **AVOID: Overly perfect, symmetrical, AI-generated looking designs**
- **AVOID: Forced cultural elements that feel stereotypical**

WHAT TO INCLUDE:
- **Style-specific elements** that match ${designVariations.style}
- **Unique visual approach** for this specific style
- **Subtle local touches** that feel natural, not forced
- **Human imperfections** - slight asymmetry, natural spacing, organic feel
- **Style-appropriate typography** and layout

TECHNICAL REQUIREMENTS:
- Resolution: 992x1056 pixels HD (Mobile-optimized)
- Format: 992x1056px - Perfect for all mobile devices
- Text must be readable on mobile screens
- Logo integration should look natural
- Optimized for Instagram, Facebook, Twitter, LinkedIn mobile viewing

🎨 GOAL: Create a ${designVariations.style.toLowerCase()} design that looks completely different from other design types while feeling genuinely human-made. Focus on the specific style requirements, make it unique, and add subtle local touches without being overwhelming. The design should look like a skilled human designer created it, not AI.`;

    // NEW: Enhance with industry intelligence and creativity
    imagePrompt = enhanceDesignWithIndustryIntelligence(imagePrompt, input.businessType, designVariations.style, designSeed);

    // Inject multiple layers of human creativity to force AI out of its patterns
    imagePrompt = injectHumanImperfections(imagePrompt, designSeed);
    imagePrompt = injectCreativeRebellion(imagePrompt, designSeed);
    imagePrompt = addArtisticConstraints(imagePrompt, designSeed);


    if (input.creativeContext) {
    }


    // Note: Contact information will be added at the very end of the prompt for better AI attention

    // Prepare the generation request with logo if available
    const generationParts = [
      'You are a skilled graphic designer who creates visually appealing social media designs. Focus on creating designs that people actually want to engage with - clean, modern, and appealing. Keep it simple and focus on visual impact.',
      imagePrompt
    ];

    // If logo is provided, include it in the generation
    // Check both logoDataUrl (base64) and logoUrl (Supabase storage URL) - same logic as Revo 2.0
    const logoDataUrl = input.logoDataUrl;
    const logoStorageUrl = (input as any).logoUrl || (input as any).logo_url;
    const logoUrl = logoDataUrl || logoStorageUrl;

    console.log('🔍 Revo 1.0 Logo availability check:', {
      businessName: input.businessName,
      hasLogoDataUrl: !!logoDataUrl,
      hasLogoStorageUrl: !!logoStorageUrl,
      logoDataUrlLength: logoDataUrl?.length || 0,
      logoStorageUrlLength: logoStorageUrl?.length || 0,
      finalLogoUrl: logoUrl ? logoUrl.substring(0, 100) + '...' : 'None'
    });

    if (logoUrl) {
      console.log('🎨 Revo 1.0: Processing brand logo for generation using:', logoDataUrl ? 'base64 data' : 'storage URL');

      let logoBase64Data = '';
      let logoMimeType = 'image/png';

      if (logoUrl.startsWith('data:')) {
        // Handle data URL (base64 format)
        const logoMatch = logoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (logoMatch) {
          [, logoMimeType, logoBase64Data] = logoMatch;
          console.log('✅ Revo 1.0: Using base64 logo data directly');
        }
      } else if (logoUrl.startsWith('http')) {
        // Handle storage URL - fetch and convert to base64 (same as Revo 2.0)
        console.log('📡 Revo 1.0: Fetching logo from storage URL...');
        try {
          const response = await fetch(logoUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            logoBase64Data = Buffer.from(buffer).toString('base64');
            logoMimeType = response.headers.get('content-type') || 'image/png';
            console.log(`✅ Revo 1.0: Logo fetched and converted to base64 (${buffer.byteLength} bytes)`);
          } else {
            console.warn(`⚠️  Revo 1.0: Failed to fetch logo from URL: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.error('❌ Revo 1.0: Error fetching logo from storage:', fetchError);
        }
      }

      // Normalize logo before adding to generation to prevent dimension influence
      if (logoBase64Data) {
        try {
          // Import logo normalization service
          const { LogoNormalizationService } = await import('@/lib/services/logo-normalization-service');

          // Normalize logo to prevent it from affecting design dimensions
          const normalizedLogo = await LogoNormalizationService.normalizeLogo(
            `data:${logoMimeType};base64,${logoBase64Data}`,
            { standardSize: 200, format: 'png', quality: 0.9 }
          );

          // Extract normalized base64 data
          const normalizedBase64 = normalizedLogo.dataUrl.split(',')[1];

          generationParts.push({
            inlineData: {
              data: normalizedBase64,
              mimeType: 'image/png'
            }
          });

          // Get AI prompt instructions for normalized logo
          const logoInstructions = LogoNormalizationService.getLogoPromptInstructions(normalizedLogo);

          // Update the prompt with normalized logo instructions
          const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.

${logoInstructions}

LOGO INTEGRATION RULES:
✅ REQUIRED: Place the provided logo prominently in the design (top corner, header, or center)
✅ REQUIRED: Use the EXACT logo image provided - do not modify, recreate, or stylize it
✅ REQUIRED: Make the logo clearly visible and readable
✅ REQUIRED: Size the logo appropriately - not too small, not too large
✅ REQUIRED: Ensure good contrast against the background
✅ CRITICAL: Design dimensions must remain exactly 992x1056px regardless of logo size

❌ FORBIDDEN: Do NOT create a new logo
❌ FORBIDDEN: Do NOT ignore the provided logo
❌ FORBIDDEN: Do NOT make the logo too small to see
❌ FORBIDDEN: Do NOT place logo where it can't be seen
❌ FORBIDDEN: Do NOT let logo size influence overall design dimensions

The client specifically requested their brand logo to be included. FAILURE TO INCLUDE THE LOGO IS UNACCEPTABLE.`;
          generationParts[1] = imagePrompt + logoPrompt;
          console.log('✅ Revo 1.0: NORMALIZED logo integration prompt added');
        } catch (normalizationError) {
          console.warn('⚠️ Logo normalization failed, using original:', normalizationError);
          // Fallback to original logo processing
          generationParts.push({
            inlineData: {
              data: logoBase64Data,
              mimeType: logoMimeType
            }
          });

          const logoPrompt = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
You MUST include the exact brand logo image that was provided above in your design. This is not optional.
✅ CRITICAL: Design dimensions must remain exactly 992x1056px regardless of logo size.`;
          generationParts[1] = imagePrompt + logoPrompt;
          console.log('✅ Revo 1.0: FALLBACK logo integration prompt added');
        }
      } else {
        console.error('❌ Revo 1.0: Logo processing failed:', {
          originalUrl: logoUrl.substring(0, 100),
          hasLogoDataUrl: !!logoDataUrl,
          hasLogoStorageUrl: !!logoStorageUrl,
          urlType: logoUrl.startsWith('data:') ? 'base64' : logoUrl.startsWith('http') ? 'storage' : 'unknown'
        });
      }
    } else {
      console.log('ℹ️  Revo 1.0: No logo provided for generation:', {
        businessName: input.businessName,
        availableInputKeys: Object.keys(input).filter(key => key.toLowerCase().includes('logo'))
      });
    }

    // Retry logic for 503 errors
    const maxRetries = 3;
    let lastError: any;
    let result: any;
    let response: any;

    // Add contact information at the very end of the prompt (like Revo 1.5 and 2.0) for better AI attention
    try {
      const includeContacts = input.includeContacts === true;
      const phone = input.contactInfo?.phone;
      const email = input.contactInfo?.email;
      const website = input.websiteUrl || '';
      const hasAnyContact = (!!phone || !!email || !!website);

      const contactInstructions = includeContacts && hasAnyContact
        ? `\n\n🎯 CRITICAL CONTACT INFORMATION INTEGRATION (FINAL INSTRUCTION):\n- MUST integrate these EXACT contact details prominently in the design:\n${phone ? `  📞 Phone: ${phone}\n` : ''}${email ? `  📧 Email: ${email}\n` : ''}${website ? `  🌐 Website: ${ensureWwwWebsiteUrl(website)}\n` : ''}- Place ONLY in footer bar, corner block, or contact strip at the BOTTOM of the image\n- DO NOT include contact info in main content area, headlines, or call-to-action blocks\n- DO NOT use generic service information like "BANKING", "PAYMENTS", etc.\n- ONLY use the specific contact details provided above\n- Make contact info clearly readable and professionally integrated\n- This is a PRIORITY requirement - contact info MUST be visible in the final image\n`
        : `\n\n🚫 CONTACT INFORMATION RULE:\n- Do NOT include phone, email, or website in the image\n- Do NOT include generic service information\n- Do NOT add contact info in main content area\n`;

      // Add contact instructions to the final prompt
      generationParts[1] = imagePrompt + contactInstructions;
    } catch (e) {
      console.warn('Revo 1.0: Final contact info integration failed:', e);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await model.generateContent(generationParts);
        response = await result.response;
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [Revo 1.0] Attempt ${attempt} failed:`, error.message);

        // Check if it's a 503 error and we have retries left
        if (error.message && error.message.includes('503') && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ [Revo 1.0] Waiting ${waitTime}ms before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // If it's the last attempt or not a 503 error, throw
        if (attempt === maxRetries) {
          if (error.message && error.message.includes('503')) {
            throw new Error('Revo 1.0 is super busy right now! 🚀 Try Revo 2.0 instead - it\'s working perfectly and ready to create amazing content!');
          }
          if (error.message && error.message.includes('500')) {
            throw new Error('Revo 1.0 needs a quick tech break! 🔧 Switch to Revo 2.0 for fantastic results while we wait.');
          }
          throw new Error('Revo 1.0 is taking a breather! 😴 Good news: Revo 2.0 is wide awake and ready to help you create stunning designs!');
        }
      }
    }

    // Extract image data from Gemini response
    const parts = response.candidates?.[0]?.content?.parts || [];
    let imageUrl = '';

    console.log('🔍 Revo 1.0: Analyzing Gemini response:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      firstCandidateHasContent: !!response.candidates?.[0]?.content,
      partsLength: parts.length,
      partsTypes: parts.map(p => Object.keys(p))
    });

    for (const part of parts) {
      console.log('🔍 Revo 1.0: Checking part:', Object.keys(part));
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        imageUrl = `data:${mimeType};base64,${imageData}`;
        console.log(`✅ Revo 1.0: Found image data (${imageData.length} chars, ${mimeType})`);
        break;
      }
    }

    if (!imageUrl) {
      // Try to get text response for debugging
      let textResponse = '';
      try {
        textResponse = response.text();
        console.log('🔍 Revo 1.0: Text response:', textResponse.substring(0, 200));
      } catch (e) {
        console.log('🔍 Revo 1.0: No text response available');
      }
      throw new Error(`No image data generated by ${REVO_1_0_MODEL}. Response had ${parts.length} parts.`);
    }

    // Dimension enforcement: ensure 992x1056 exactly; attempt one strict regeneration if mismatch
    {
      const expectedW = 992, expectedH = 1056;
      const check = await ensureExactDimensions(imageUrl, expectedW, expectedH);
      if (!check.ok) {
        console.warn(`\u26a0\ufe0f Revo 1.0: Generated image dimensions ${check.width}x${check.height} != ${expectedW}x${expectedH}. Attempting strict regeneration once...`);
        try {
          const strictParts = [...generationParts];
          strictParts[1] = (strictParts[1] || '') + `\nSTRICT DIMENSION ENFORCEMENT: Output must be exactly ${expectedW}x${expectedH} pixels. Do not adjust canvas based on logo.`;
          const strictResult = await model.generateContent(strictParts);
          const strictResponse = await strictResult.response;
          const strictPartsOut = strictResponse.candidates?.[0]?.content?.parts || [];
          let strictImageUrl = '';
          for (const part of strictPartsOut) {
            if ((part as any).inlineData) {
              const imageData = (part as any).inlineData.data;
              const mimeType = (part as any).inlineData.mimeType;
              strictImageUrl = `data:${mimeType};base64,${imageData}`;
              break;
            }
          }
          if (strictImageUrl) {
            const check2 = await ensureExactDimensions(strictImageUrl, expectedW, expectedH);
            if (check2.ok) {
              imageUrl = strictImageUrl;
              console.log('✅ Revo 1.0: Strict regeneration produced correct dimensions.');
            } else {
              console.warn(`\u26a0\ufe0f Revo 1.0: Strict regeneration still mismatched (${check2.width}x${check2.height}). Using first image.`);
            }
          } else {
            console.warn('\u26a0\ufe0f Revo 1.0: Strict regeneration returned no image data.');
          }
        } catch (strictErr) {
          console.warn('\u26a0\ufe0f Revo 1.0: Strict regeneration failed:', strictErr);
        }
      }
    }



    const aspectRatio = getPlatformAspectRatio(input.platform);

    return {
      imageUrl: imageUrl,
      aspectRatio: '1:1', // Custom format for mobile optimization
      resolution: '992x1056',
      quality: 'enhanced'
    };

  } catch (error) {
    throw new Error(`Revo 1.0 image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Health check for Revo 1.0 service
 */
export async function checkRevo10Health() {
  try {
    const model = ai.getGenerativeModel({ model: REVO_1_0_MODEL });
    const result = await model.generateContent('Hello');
    const response = await result.response;

    return {
      healthy: true,
      model: REVO_1_0_MODEL,
      response: response.text().substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      model: REVO_1_0_MODEL,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get Revo 1.0 service information
 */
export function getRevo10ServiceInfo() {
  return {
    model: REVO_1_0_MODEL,
    version: '1.0.0',
    status: 'enhanced',
    aiService: revo10Config.aiService,
    capabilities: [
      'Enhanced content generation',
      'High-resolution image support (992x1056)',
      'Perfect text rendering',
      'Advanced AI capabilities',
      'Enhanced brand consistency'
    ],
    pricing: {
      contentGeneration: 1.5,
      designGeneration: 1.5,
      tier: 'enhanced'
    },
    lastUpdated: '2025-01-27'
  };
}

// NEW: Enhanced local language and cultural context generator
function generateLocalLanguageContext(location: string): any {
  const languageContexts: Record<string, any> = {
    'kenya': {
      primaryLanguage: 'Swahili & English',
      commonPhrases: ['Karibu', 'Asante', 'Jambo', 'Mzuri sana'],
      businessTerms: ['Biashara', 'Mradi', 'Kazi', 'Ushirika'],
      culturalNuances: 'Warm hospitality, community-first approach, respect for elders',
      marketingStyle: 'Personal, relationship-focused, community-oriented',
      localExpressions: ['Tuko pamoja', 'Kazi yetu', 'Jitihada zetu']
    },
    'nigeria': {
      primaryLanguage: 'English, Hausa, Yoruba, Igbo',
      commonPhrases: ['Oga', 'Abeg', 'Wetin dey happen', 'How far'],
      businessTerms: ['Business', 'Work', 'Money', 'Success'],
      culturalNuances: 'Entrepreneurial spirit, networking culture, achievement focus',
      marketingStyle: 'Direct, motivational, success-oriented',
      localExpressions: ['No shaking', 'I go do am', 'We dey here']
    },
    'south africa': {
      primaryLanguage: 'English, Afrikaans, Zulu, Xhosa',
      commonPhrases: ['Howzit', 'Lekker', 'Ja', 'Eish'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Diverse culture, innovation focus, global perspective',
      marketingStyle: 'Professional, inclusive, forward-thinking',
      localExpressions: ['Ubuntu', 'Together we can', 'Moving forward']
    },
    'ghana': {
      primaryLanguage: 'English, Twi, Ga, Ewe',
      commonPhrases: ['Akwaaba', 'Medaase', 'Yoo', 'Chale'],
      businessTerms: ['Business', 'Work', 'Money', 'Success'],
      culturalNuances: 'Hospitality, respect, community values',
      marketingStyle: 'Warm, respectful, community-focused',
      localExpressions: ['Sankofa', 'Unity in diversity', 'Forward together']
    },
    'uganda': {
      primaryLanguage: 'English, Luganda, Runyankole',
      commonPhrases: ['Oli otya', 'Webale', 'Kale', 'Nja'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Friendly, welcoming, community spirit',
      marketingStyle: 'Friendly, approachable, community-oriented',
      localExpressions: ['Tugende', 'Together we grow', 'Community first']
    },
    'tanzania': {
      primaryLanguage: 'Swahili & English',
      commonPhrases: ['Karibu', 'Asante', 'Jambo', 'Mzuri'],
      businessTerms: ['Biashara', 'Kazi', 'Mradi', 'Ushirika'],
      culturalNuances: 'Peaceful, community-focused, natural beauty appreciation',
      marketingStyle: 'Peaceful, natural, community-oriented',
      localExpressions: ['Uhuru na Umoja', 'Peace and unity', 'Natural beauty']
    },
    'ethiopia': {
      primaryLanguage: 'Amharic & English',
      commonPhrases: ['Selam', 'Amesegenalu', 'Endet', 'Tena yistilign'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Ancient culture, hospitality, coffee culture',
      marketingStyle: 'Traditional, hospitable, culturally rich',
      localExpressions: ['Ethiopia first', 'Coffee culture', 'Ancient wisdom']
    },
    'rwanda': {
      primaryLanguage: 'Kinyarwanda, French & English',
      commonPhrases: ['Murakoze', 'Amahoro', 'Urugero', 'Nta kibazo'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Innovation, cleanliness, community unity',
      marketingStyle: 'Innovative, clean, community-focused',
      localExpressions: ['Agaciro', 'Dignity', 'Unity and reconciliation']
    },
    'default': {
      primaryLanguage: 'English',
      commonPhrases: ['Hello', 'Thank you', 'Welcome', 'Great'],
      businessTerms: ['Business', 'Work', 'Success', 'Growth'],
      culturalNuances: 'Professional, friendly, community-oriented',
      marketingStyle: 'Professional, friendly, community-focused',
      localExpressions: ['Community first', 'Quality service', 'Local expertise']
    }
  };

  const locationKey = location.toLowerCase();
  for (const [key, context] of Object.entries(languageContexts)) {
    if (locationKey.includes(key)) {
      return context;
    }
  }
  return languageContexts['default'];
}

// NEW: Advanced climate insights for business relevance
function generateClimateInsights(location: string, businessType: string): any {
  const season = getSeason();
  const climateData: Record<string, any> = {
    'Spring': {
      businessImpact: 'Renewal and growth opportunities, seasonal business preparation',
      contentOpportunities: 'Fresh starts, new beginnings, seasonal preparation, growth themes',
      businessSuggestions: 'Launch new services, seasonal promotions, growth campaigns',
      localAdaptations: 'Spring cleaning services, seasonal menu changes, outdoor activities'
    },
    'Summer': {
      businessImpact: 'High energy and outdoor activities, peak business season',
      contentOpportunities: 'Vibrant colors, active lifestyle, summer solutions, outdoor themes',
      businessSuggestions: 'Summer specials, outdoor events, seasonal products',
      localAdaptations: 'Summer festivals, outdoor dining, seasonal services'
    },
    'Fall': {
      businessImpact: 'Planning and preparation, harvest and results focus',
      contentOpportunities: 'Preparation themes, results celebration, autumn aesthetics',
      businessSuggestions: 'Year-end planning, results showcase, preparation services',
      localAdaptations: 'Harvest celebrations, planning services, year-end reviews'
    },
    'Winter': {
      businessImpact: 'Strategic planning and indoor focus, reflection period',
      contentOpportunities: 'Planning themes, strategy focus, indoor solutions',
      businessSuggestions: 'Strategic planning, indoor services, year planning',
      localAdaptations: 'Indoor events, planning services, strategic consultations'
    }
  };

  // Add business-specific climate insights
  const businessClimateInsights: Record<string, any> = {
    'restaurant': {
      seasonalMenu: `${season} seasonal ingredients and dishes`,
      weatherAdaptation: `${season === 'Summer' ? 'Cooling beverages and light meals' : season === 'Winter' ? 'Warm comfort foods' : 'Seasonal specialties'}`,
      businessStrategy: `${season === 'Summer' ? 'Outdoor dining and seasonal menus' : 'Indoor comfort and seasonal specialties'}`
    },
    'fitness': {
      seasonalActivities: `${season === 'Summer' ? 'Outdoor workouts and water activities' : season === 'Winter' ? 'Indoor training and winter sports' : 'Seasonal fitness programs'}`,
      weatherAdaptation: `${season === 'Summer' ? 'Early morning and evening sessions' : 'Indoor and weather-appropriate activities'}`,
      businessStrategy: `${season === 'Summer' ? 'Outdoor fitness programs' : 'Indoor training focus'}`
    },
    'retail': {
      seasonalProducts: `${season} fashion and lifestyle products`,
      weatherAdaptation: `${season === 'Summer' ? 'Light clothing and outdoor gear' : season === 'Winter' ? 'Warm clothing and indoor items' : 'Seasonal essentials'}`,
      businessStrategy: `${season === 'Summer' ? 'Summer sales and outdoor products' : 'Seasonal collections and indoor focus'}`
    },
    'default': {
      seasonalFocus: `${season} business opportunities and seasonal services`,
      weatherAdaptation: `${season === 'Summer' ? 'Outdoor and seasonal services' : 'Indoor and year-round services'}`,
      businessStrategy: `${season} business strategies and seasonal promotions`
    }
  };

  const baseClimate = climateData[season as keyof typeof climateData];
  const businessClimate = businessClimateInsights[businessType.toLowerCase()] || businessClimateInsights['default'];

  return {
    season: season,
    businessImpact: baseClimate.businessImpact,
    contentOpportunities: baseClimate.contentOpportunities,
    businessSuggestions: baseClimate.businessSuggestions,
    localAdaptations: baseClimate.localAdaptations,
    businessSpecific: businessClimate,
    marketingAngle: `Leverage ${season.toLowerCase()} opportunities for ${businessType} business growth`
  };
}

// NEW: Real-time trending topics generator (can be enhanced with actual social media APIs)
function generateTrendingTopics(businessType: string, location: string, platform: string): any[] {
  const platformTrends: Record<string, any[]> = {
    'Instagram': [
      { topic: 'Visual storytelling trends', category: 'Platform', relevance: 'high' },
      { topic: 'Authentic content creation', category: 'Content', relevance: 'high' },
      { topic: 'Reels and short-form video', category: 'Format', relevance: 'medium' }
    ],
    'LinkedIn': [
      { topic: 'Professional networking trends', category: 'Platform', relevance: 'high' },
      { topic: 'Industry thought leadership', category: 'Content', relevance: 'high' },
      { topic: 'Career development insights', category: 'Professional', relevance: 'medium' }
    ],
    'Facebook': [
      { topic: 'Community building strategies', category: 'Platform', relevance: 'high' },
      { topic: 'Local business networking', category: 'Community', relevance: 'high' },
      { topic: 'Family-friendly content', category: 'Content', relevance: 'medium' }
    ],
    'Twitter': [
      { topic: 'Real-time conversation trends', category: 'Platform', relevance: 'high' },
      { topic: 'Viral content strategies', category: 'Content', relevance: 'high' },
      { topic: 'Trending hashtags', category: 'Engagement', relevance: 'medium' }
    ]
  };

  const businessTrends: Record<string, any[]> = {
    'restaurant': [
      { topic: 'Local food culture trends', category: 'Industry', relevance: 'high' },
      { topic: 'Sustainable dining practices', category: 'Trends', relevance: 'high' },
      { topic: 'Food delivery innovations', category: 'Technology', relevance: 'medium' }
    ],
    'technology': [
      { topic: 'AI and automation trends', category: 'Industry', relevance: 'high' },
      { topic: 'Digital transformation', category: 'Business', relevance: 'high' },
      { topic: 'Remote work solutions', category: 'Workplace', relevance: 'medium' }
    ],
    'healthcare': [
      { topic: 'Telehealth adoption', category: 'Industry', relevance: 'high' },
      { topic: 'Preventive healthcare', category: 'Wellness', relevance: 'high' },
      { topic: 'Mental health awareness', category: 'Health', relevance: 'medium' }
    ],
    'fitness': [
      { topic: 'Home workout trends', category: 'Industry', relevance: 'high' },
      { topic: 'Mental wellness integration', category: 'Wellness', relevance: 'high' },
      { topic: 'Community fitness challenges', category: 'Engagement', relevance: 'medium' }
    ],
    'finance': [
      { topic: 'Digital banking trends', category: 'Industry', relevance: 'high' },
      { topic: 'Financial literacy', category: 'Education', relevance: 'high' },
      { topic: 'Investment opportunities', category: 'Wealth', relevance: 'medium' }
    ],
    'education': [
      { topic: 'Online learning platforms', category: 'Industry', relevance: 'high' },
      { topic: 'Skill development trends', category: 'Learning', relevance: 'high' },
      { topic: 'Personalized education', category: 'Innovation', relevance: 'medium' }
    ],
    'retail': [
      { topic: 'E-commerce growth', category: 'Industry', relevance: 'high' },
      { topic: 'Omnichannel shopping', category: 'Customer', relevance: 'high' },
      { topic: 'Sustainable products', category: 'Trends', relevance: 'medium' }
    ],
    'real estate': [
      { topic: 'Virtual property tours', category: 'Industry', relevance: 'high' },
      { topic: 'Sustainable properties', category: 'Trends', relevance: 'high' },
      { topic: 'Investment opportunities', category: 'Market', relevance: 'medium' }
    ],
    'default': [
      { topic: 'Digital transformation trends', category: 'Business', relevance: 'high' },
      { topic: 'Customer experience optimization', category: 'Strategy', relevance: 'high' },
      { topic: 'Local business growth', category: 'Community', relevance: 'medium' }
    ]
  };

  const platformSpecific = platformTrends[platform] || platformTrends['Instagram'];
  const businessSpecific = businessTrends[businessType.toLowerCase()] || businessTrends['default'];
  const localTrends = [
    { topic: `${location} business growth`, category: 'Local', relevance: 'high' },
    { topic: `${location} community development`, category: 'Community', relevance: 'high' },
    { topic: `${location} economic trends`, category: 'Local', relevance: 'medium' }
  ];

  return [...platformSpecific, ...businessSpecific, ...localTrends].slice(0, 5);
}

// NEW: Local news and market insights generator
function generateLocalNewsContext(businessType: string, location: string): any[] {
  const newsInsights = [
    {
      type: 'Local Market',
      headline: `${location} business environment update`,
      impact: 'Local market conditions affecting business opportunities',
      businessRelevance: 'Market positioning and strategic planning',
      contentAngle: 'Local market expertise and insights'
    },
    {
      type: 'Industry Trends',
      headline: `${businessType} industry developments in ${location}`,
      impact: 'Industry-specific opportunities and challenges',
      businessRelevance: 'Competitive positioning and service innovation',
      contentAngle: 'Industry leadership and local expertise'
    },
    {
      type: 'Community Events',
      headline: `${location} community and business events`,
      impact: 'Networking and community engagement opportunities',
      businessRelevance: 'Community involvement and local partnerships',
      contentAngle: 'Community connection and local engagement'
    },
    {
      type: 'Economic Update',
      headline: `${location} economic indicators and business climate`,
      impact: 'Business planning and investment decisions',
      businessRelevance: 'Strategic planning and market timing',
      contentAngle: 'Economic expertise and market insights'
    }
  ];

  return newsInsights.slice(0, 3);
}


function getCulturallyAppropriatePersonDescription(location: string): string {
  const locationKey = location.toLowerCase();

  // African countries - prioritize Black/African people for cultural authenticity
  const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];

  for (const country of africanCountries) {
    if (locationKey.includes(country)) {
      return 'MANDATORY: Include authentic Black/African people with PERFECT FACIAL FEATURES - complete faces, symmetrical features, natural expressions, professional poses. Show local African people in modern, professional settings that reflect contemporary African life. Ensure faces are fully visible, well-lit, and anatomically correct with no deformations or missing features. PRIORITY: 80%+ of people in the image should be Black/African when business is in African country. AVOID: Non-African people as primary subjects when business is in Africa. Emphasize cultural authenticity and local representation.';
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