/**
 * Visual Style Enhancement Configuration
 * 
 * Defines specific enhancements for different visual styles to create
 * more sophisticated and engaging designs.
 */

export interface StyleEnhancement {
  name: string;
  description: string;
  colorEnhancements: string[];
  typographyEnhancements: string[];
  compositionEnhancements: string[];
  effectsEnhancements: string[];
  qualityMultiplier: number;
}

export const VISUAL_STYLE_ENHANCEMENTS: Record<string, StyleEnhancement> = {
  'tier1-fintech': {
    name: 'Tier-1 Fintech',
    description: 'Professional fintech design system (Flutterwave/Kuda/M-Pesa level)',
    colorEnhancements: [
      'Use trusted fintech color palette: deep blues (#1e40af, #3b82f6), professional greens (#059669, #10b981), clean whites (#ffffff)',
      'Avoid neon, crypto-style colors, or overly bright/flashy schemes',
      'Apply high contrast ratios (7:1 minimum) for accessibility and trust',
      'Use subtle gradients only for depth, never for flashy effects'
    ],
    typographyEnhancements: [
      'HEADLINE (H1): 32-36px, Bold (700), Inter/Roboto, max 6 words, high contrast',
      'SUBHEADLINE (H2): 18-22px, Medium (500), same font family, max 25 words',
      'CTA BUTTON: 16-18px, Bold (700), high contrast background, 12px padding, 8px border radius',
      'BODY TEXT: 14-16px, Regular (400), optimal line height 1.5, readable color (#374151)'
    ],
    compositionEnhancements: [
      'Clean, minimal layouts with 40%+ white space for trust and clarity',
      'Grid-based alignment following banking app standards',
      'Single focal point per design - no visual clutter',
      'Professional spacing: 16px, 24px, 32px increments only'
    ],
    effectsEnhancements: [
      'Subtle shadows: 0-2px blur, 5% opacity maximum',
      'NO neon glows, crypto effects, or flashy animations',
      'Clean button styling with solid backgrounds and clear borders',
      'Professional depth through layering, not effects'
    ],
    qualityMultiplier: 1.5
  },
  'modern-professional': {
    name: 'Modern Professional',
    description: 'Clean, sophisticated design with premium business appeal',
    colorEnhancements: [
      'Use sophisticated color gradients with subtle transitions',
      'Apply corporate color psychology for trust and authority',
      'Implement monochromatic schemes with strategic accent colors',
      'Ensure high contrast ratios for premium accessibility (7:1 minimum)'
    ],
    typographyEnhancements: [
      'Use clean, geometric sans-serif fonts for headers',
      'Apply perfect kerning and letter spacing for professional finish',
      'Create clear hierarchy with size ratios of 1.618 (golden ratio)',
      'Ensure optimal line height (1.4-1.6) for readability'
    ],
    compositionEnhancements: [
      'Apply grid-based layouts with mathematical precision',
      'Use generous white space for premium feel (minimum 30% negative space)',
      'Implement asymmetrical balance for dynamic interest',
      'Position elements using rule of thirds for optimal visual flow'
    ],
    effectsEnhancements: [
      'Add subtle drop shadows (0-4px blur, 10% opacity)',
      'Use minimal gradients for depth without distraction',
      'Apply consistent border radius (4-8px) throughout design',
      'Implement hover states and micro-interactions suggestions'
    ],
    qualityMultiplier: 1.2
  },

  'creative-bold': {
    name: 'Creative Bold',
    description: 'Dynamic, attention-grabbing design with artistic flair',
    colorEnhancements: [
      'Use vibrant, high-saturation colors for maximum impact',
      'Apply complementary color schemes for visual tension',
      'Implement bold color blocking with strategic contrast',
      'Use color psychology to evoke energy and excitement'
    ],
    typographyEnhancements: [
      'Mix serif and sans-serif fonts for dynamic contrast',
      'Use oversized typography as design elements',
      'Apply creative text treatments (outlines, shadows, gradients)',
      'Experiment with unconventional text layouts and angles'
    ],
    compositionEnhancements: [
      'Break traditional grid systems for creative freedom',
      'Use diagonal compositions for dynamic energy',
      'Implement overlapping elements for depth and interest',
      'Create strong focal points with size and color contrast'
    ],
    effectsEnhancements: [
      'Add bold shadows and 3D effects for dimension',
      'Use creative gradients and color overlays',
      'Implement artistic filters and texture overlays',
      'Apply dynamic shapes and geometric elements'
    ],
    qualityMultiplier: 1.3
  },

  'minimalist-elegant': {
    name: 'Minimalist Elegant',
    description: 'Refined, sophisticated design with focus on essential elements',
    colorEnhancements: [
      'Use restrained color palettes with maximum 3 colors',
      'Apply subtle, muted tones for sophisticated appeal',
      'Implement monochromatic schemes with tonal variations',
      'Use color sparingly for maximum impact when applied'
    ],
    typographyEnhancements: [
      'Use elegant, refined typefaces with excellent readability',
      'Apply generous letter spacing for premium feel',
      'Create subtle hierarchy with minimal size variations',
      'Focus on perfect alignment and spacing relationships'
    ],
    compositionEnhancements: [
      'Maximize white space usage (40-60% of design)',
      'Use centered, symmetrical layouts for balance',
      'Apply minimal elements with maximum impact',
      'Create breathing room around all design elements'
    ],
    effectsEnhancements: [
      'Use extremely subtle shadows (1-2px blur, 5% opacity)',
      'Apply minimal, refined gradients if any',
      'Focus on clean lines and perfect alignment',
      'Implement subtle texture overlays for depth'
    ],
    qualityMultiplier: 1.1
  },

  'luxury-premium': {
    name: 'Luxury Premium',
    description: 'High-end, exclusive design with premium materials and finishes',
    colorEnhancements: [
      'Use sophisticated color palettes with gold/silver accents',
      'Apply rich, deep colors that convey luxury and exclusivity',
      'Implement metallic gradients and premium color treatments',
      'Use color psychology for luxury positioning and desire'
    ],
    typographyEnhancements: [
      'Use premium, custom-style fonts with character',
      'Apply elegant serif fonts for luxury appeal',
      'Create sophisticated hierarchy with refined proportions',
      'Use typography that conveys exclusivity and craftsmanship'
    ],
    compositionEnhancements: [
      'Apply classical proportions and golden ratio relationships',
      'Use symmetrical, balanced layouts for premium feel',
      'Implement generous spacing that suggests exclusivity',
      'Create compositions that feel curated and intentional'
    ],
    effectsEnhancements: [
      'Add premium shadows and lighting effects',
      'Use metallic gradients and luxury material textures',
      'Apply sophisticated depth and dimensionality',
      'Implement premium finishes and surface treatments'
    ],
    qualityMultiplier: 1.5
  },

  'playful-friendly': {
    name: 'Playful Friendly',
    description: 'Approachable, fun design that creates emotional connection',
    colorEnhancements: [
      'Use warm, inviting colors that create positive emotions',
      'Apply bright, cheerful palettes with good contrast',
      'Implement rainbow or multi-color schemes thoughtfully',
      'Use color psychology for happiness and approachability'
    ],
    typographyEnhancements: [
      'Use rounded, friendly fonts that feel approachable',
      'Apply playful font combinations with personality',
      'Create dynamic hierarchy with varied sizes and weights',
      'Use typography that feels human and conversational'
    ],
    compositionEnhancements: [
      'Use organic, flowing layouts that feel natural',
      'Apply asymmetrical compositions for dynamic interest',
      'Implement curved lines and organic shapes',
      'Create compositions that feel alive and energetic'
    ],
    effectsEnhancements: [
      'Add playful shadows and fun visual effects',
      'Use colorful gradients and cheerful overlays',
      'Apply rounded corners and soft edges throughout',
      'Implement fun illustrations and decorative elements'
    ],
    qualityMultiplier: 1.1
  }
};

/**
 * Get enhancement configuration for a visual style
 */
export function getStyleEnhancement(visualStyle: string): StyleEnhancement {
  const normalizedStyle = visualStyle.toLowerCase().replace(/[^a-z]/g, '-');

  // Try exact match first
  if (VISUAL_STYLE_ENHANCEMENTS[normalizedStyle]) {
    return VISUAL_STYLE_ENHANCEMENTS[normalizedStyle];
  }

  // Try partial matches
  for (const [key, enhancement] of Object.entries(VISUAL_STYLE_ENHANCEMENTS)) {
    if (normalizedStyle.includes(key.split('-')[0]) || key.includes(normalizedStyle.split('-')[0])) {
      return enhancement;
    }
  }

  // Default to modern professional
  return VISUAL_STYLE_ENHANCEMENTS['modern-professional'];
}

/**
 * Generate style-specific enhancement prompt
 */
export function generateStyleEnhancementPrompt(visualStyle: string): string {
  const enhancement = getStyleEnhancement(visualStyle);

  return `
**VISUAL STYLE: ${enhancement.name.toUpperCase()}**
${enhancement.description}

**COLOR ENHANCEMENTS:**
${enhancement.colorEnhancements.map(e => `- ${e}`).join('\n')}

**TYPOGRAPHY ENHANCEMENTS:**
${enhancement.typographyEnhancements.map(e => `- ${e}`).join('\n')}

**COMPOSITION ENHANCEMENTS:**
${enhancement.compositionEnhancements.map(e => `- ${e}`).join('\n')}

**EFFECTS ENHANCEMENTS:**
${enhancement.effectsEnhancements.map(e => `- ${e}`).join('\n')}

**QUALITY MULTIPLIER: ${enhancement.qualityMultiplier}x**
Apply these enhancements to elevate the design quality by ${Math.round((enhancement.qualityMultiplier - 1) * 100)}% above standard expectations.
`;
}

/**
 * Calculate enhanced quality score based on style multiplier
 */
export function calculateEnhancedQualityScore(baseScore: number, visualStyle: string): number {
  const enhancement = getStyleEnhancement(visualStyle);
  return Math.min(10, baseScore * enhancement.qualityMultiplier);
}
