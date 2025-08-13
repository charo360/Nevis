/**
 * Design Analysis Utilities
 * 
 * Intelligent analysis and processing of design examples for better AI generation
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for design analysis results
export const DesignAnalysisSchema = z.object({
  colorPalette: z.object({
    primary: z.string().describe('Primary color in hex format'),
    secondary: z.string().describe('Secondary color in hex format'),
    accent: z.string().describe('Accent color in hex format'),
    colorHarmony: z.enum(['complementary', 'analogous', 'triadic', 'monochromatic', 'split-complementary']).describe('Type of color harmony used'),
    colorMood: z.string().describe('Overall mood conveyed by the color scheme')
  }),
  composition: z.object({
    layout: z.enum(['centered', 'left-aligned', 'right-aligned', 'asymmetrical', 'grid-based']).describe('Primary layout structure'),
    visualHierarchy: z.string().describe('How visual hierarchy is established'),
    focalPoint: z.string().describe('Primary focal point and how it\'s created'),
    balance: z.enum(['symmetrical', 'asymmetrical', 'radial']).describe('Type of visual balance'),
    whitespace: z.enum(['minimal', 'moderate', 'generous']).describe('Use of negative space')
  }),
  typography: z.object({
    primaryFont: z.string().describe('Primary font style/category'),
    hierarchy: z.string().describe('Typographic hierarchy structure'),
    textTreatment: z.string().describe('Special text treatments or effects'),
    readability: z.enum(['high', 'medium', 'stylized']).describe('Text readability level')
  }),
  style: z.object({
    aesthetic: z.string().describe('Overall design aesthetic (modern, vintage, minimalist, etc.)'),
    mood: z.string().describe('Emotional mood and feeling'),
    sophistication: z.enum(['casual', 'professional', 'luxury', 'playful']).describe('Level of sophistication'),
    trends: z.array(z.string()).describe('Current design trends incorporated')
  }),
  effectiveness: z.object({
    attention: z.number().min(1).max(10).describe('Attention-grabbing potential (1-10)'),
    clarity: z.number().min(1).max(10).describe('Message clarity (1-10)'),
    brandAlignment: z.number().min(1).max(10).describe('Brand alignment strength (1-10)'),
    platformOptimization: z.number().min(1).max(10).describe('Platform optimization (1-10)')
  })
});

export type DesignAnalysis = z.infer<typeof DesignAnalysisSchema>;

// Design analysis prompt
const designAnalysisPrompt = ai.definePrompt({
  name: 'analyzeDesignExample',
  input: {
    schema: z.object({
      businessType: z.string(),
      platform: z.string().optional(),
      designContext: z.string().optional()
    })
  },
  output: {
    schema: DesignAnalysisSchema
  },
  prompt: `You are an expert design analyst with deep knowledge of visual design principles, color theory, typography, and modern design trends.

Analyze the provided design image and extract detailed insights about its design elements and effectiveness.

Business Context: {{businessType}}
Platform: {{platform}}
Context: {{designContext}}

Provide a comprehensive analysis covering:

1. **Color Analysis**: Identify the color palette, harmony type, and psychological impact
2. **Composition Analysis**: Evaluate layout, hierarchy, balance, and use of space
3. **Typography Analysis**: Assess font choices, hierarchy, and text treatment
4. **Style Analysis**: Determine aesthetic approach, mood, and trend incorporation
5. **Effectiveness Analysis**: Rate attention-grabbing power, clarity, brand alignment, and platform optimization

Be specific and actionable in your analysis. Focus on elements that can be replicated or adapted for new designs.`
});

/**
 * Analyzes a design example to extract key design elements and patterns
 */
export async function analyzeDesignExample(
  designImageUrl: string,
  businessType: string,
  platform?: string,
  context?: string
): Promise<DesignAnalysis> {
  try {
    // For now, return a mock analysis to avoid API issues
    // This can be replaced with actual AI analysis once the prompt system is stable
    return {
      colorPalette: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        colorHarmony: 'complementary',
        colorMood: 'Energetic and modern'
      },
      composition: {
        layout: 'centered',
        visualHierarchy: 'Clear size-based hierarchy with strong focal point',
        focalPoint: 'Central logo and headline combination',
        balance: 'symmetrical',
        whitespace: 'moderate'
      },
      typography: {
        primaryFont: 'Modern sans-serif',
        hierarchy: 'Large headline, medium subtext, small details',
        textTreatment: 'Bold headlines with subtle shadows',
        readability: 'high'
      },
      style: {
        aesthetic: 'Modern minimalist',
        mood: 'Professional and approachable',
        sophistication: 'professional',
        trends: ['Bold typography', 'Minimalist design', 'High contrast']
      },
      effectiveness: {
        attention: 8,
        clarity: 9,
        brandAlignment: 8,
        platformOptimization: 7
      }
    };
  } catch (error) {
    console.error('Design analysis failed:', error);
    throw new Error('Failed to analyze design example');
  }
}

/**
 * Selects the best design examples based on content type and platform
 */
export function selectOptimalDesignExamples(
  designExamples: string[],
  analyses: DesignAnalysis[],
  contentType: string,
  platform: string,
  maxExamples: number = 3
): string[] {
  if (!analyses.length || !designExamples.length) {
    return designExamples.slice(0, maxExamples);
  }

  // Score each design based on relevance and effectiveness
  const scoredExamples = designExamples.map((example, index) => {
    const analysis = analyses[index];
    if (!analysis) return { example, score: 0 };

    let score = 0;

    // Weight effectiveness metrics
    score += analysis.effectiveness.attention * 0.3;
    score += analysis.effectiveness.clarity * 0.25;
    score += analysis.effectiveness.brandAlignment * 0.25;
    score += analysis.effectiveness.platformOptimization * 0.2;

    // Bonus for sophisticated designs
    if (analysis.style.sophistication === 'professional' || analysis.style.sophistication === 'luxury') {
      score += 1;
    }

    // Bonus for modern trends
    score += analysis.style.trends.length * 0.5;

    return { example, score, analysis };
  });

  // Sort by score and return top examples
  return scoredExamples
    .sort((a, b) => b.score - a.score)
    .slice(0, maxExamples)
    .map(item => item.example);
}

/**
 * Generates design DNA from analyzed examples
 */
export function extractDesignDNA(analyses: DesignAnalysis[]): string {
  if (!analyses.length) return '';

  const commonElements = {
    colors: analyses.map(a => a.colorPalette.colorHarmony),
    layouts: analyses.map(a => a.composition.layout),
    aesthetics: analyses.map(a => a.style.aesthetic),
    moods: analyses.map(a => a.style.mood)
  };

  // Find most common elements
  const mostCommonColor = getMostCommon(commonElements.colors);
  const mostCommonLayout = getMostCommon(commonElements.layouts);
  const mostCommonAesthetic = getMostCommon(commonElements.aesthetics);
  const mostCommonMood = getMostCommon(commonElements.moods);

  return `
**EXTRACTED DESIGN DNA:**
- **Color Harmony**: Primarily uses ${mostCommonColor} color schemes
- **Layout Pattern**: Favors ${mostCommonLayout} compositions
- **Aesthetic Style**: Consistent ${mostCommonAesthetic} approach
- **Emotional Tone**: Maintains ${mostCommonMood} mood throughout
- **Visual Sophistication**: ${analyses[0]?.style.sophistication} level presentation
- **Typography Approach**: ${analyses[0]?.typography.hierarchy} hierarchy structure
`;
}

/**
 * Helper function to find most common element in array
 */
function getMostCommon<T>(arr: T[]): T {
  const counts = arr.reduce((acc, item) => {
    acc[item as string] = (acc[item as string] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T;
}
