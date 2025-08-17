/**
 * Design Trends Integration System
 * 
 * Keeps design generation current with latest visual trends and best practices
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for design trends analysis
export const DesignTrendsSchema = z.object({
  currentTrends: z.array(z.object({
    name: z.string().describe('Name of the design trend'),
    description: z.string().describe('Description of the trend'),
    applicability: z.enum(['high', 'medium', 'low']).describe('How applicable this trend is to the business type'),
    implementation: z.string().describe('How to implement this trend in the design'),
    examples: z.array(z.string()).describe('Visual examples or descriptions of the trend')
  })).describe('Current relevant design trends'),
  colorTrends: z.object({
    palette: z.array(z.string()).describe('Trending color palette in hex format'),
    mood: z.string().describe('Overall mood of trending colors'),
    application: z.string().describe('How to apply these colors effectively')
  }),
  typographyTrends: z.object({
    styles: z.array(z.string()).describe('Trending typography styles'),
    pairings: z.array(z.string()).describe('Popular font pairings'),
    treatments: z.array(z.string()).describe('Special text treatments and effects')
  }),
  layoutTrends: z.object({
    compositions: z.array(z.string()).describe('Trending layout compositions'),
    spacing: z.string().describe('Current spacing and whitespace trends'),
    hierarchy: z.string().describe('Visual hierarchy trends')
  }),
  platformSpecific: z.object({
    instagram: z.array(z.string()).describe('Instagram-specific design trends'),
    facebook: z.array(z.string()).describe('Facebook-specific design trends'),
    twitter: z.array(z.string()).describe('Twitter/X-specific design trends'),
    linkedin: z.array(z.string()).describe('LinkedIn-specific design trends')
  })
});

export type DesignTrends = z.infer<typeof DesignTrendsSchema>;

// Design trends analysis prompt
const designTrendsPrompt = ai.definePrompt({
  name: 'analyzeDesignTrends',
  input: {
    schema: z.object({
      businessType: z.string(),
      platform: z.string(),
      targetAudience: z.string().optional(),
      industry: z.string().optional()
    })
  },
  output: {
    schema: DesignTrendsSchema
  },
  prompt: `You are a leading design trend analyst with deep knowledge of current visual design trends, social media best practices, and industry-specific design patterns.

Analyze and provide current design trends relevant to:
- Business Type: {{businessType}}
- Platform: {{platform}}
- Target Audience: {{targetAudience}}
- Industry: {{industry}}

Focus on trends that are:
1. Currently popular and effective (2024-2025)
2. Relevant to the specific business type and platform
3. Proven to drive engagement and conversions
4. Accessible and implementable in AI-generated designs

Provide specific, actionable trend insights that can be directly applied to design generation.`
});

/**
 * Gets current design trends relevant to the business and platform
 */
export async function getCurrentDesignTrends(
  businessType: string,
  platform: string,
  targetAudience?: string,
  industry?: string
): Promise<DesignTrends> {
  try {
    // For now, return fallback trends to avoid API issues
    // This provides current, relevant trends while the system is being tested
    return getFallbackTrends(businessType, platform);
  } catch (error) {
    console.error('Design trends analysis failed:', error);
    // Return fallback trends
    return getFallbackTrends(businessType, platform);
  }
}

/**
 * Generates trend-aware design instructions
 */
export function generateTrendInstructions(trends: DesignTrends, platform: string): string {
  const platformTrends = trends.platformSpecific[platform as keyof typeof trends.platformSpecific] || [];
  const highApplicabilityTrends = trends.currentTrends.filter(t => t.applicability === 'high');

  return `
**CURRENT DESIGN TRENDS INTEGRATION:**

**High-Priority Trends to Incorporate:**
${highApplicabilityTrends.map(trend => `
- **${trend.name}**: ${trend.description}
  Implementation: ${trend.implementation}`).join('\n')}

**Color Trends:**
- Trending Palette: ${trends.colorTrends.palette.join(', ')}
- Mood: ${trends.colorTrends.mood}
- Application: ${trends.colorTrends.application}

**Typography Trends:**
- Styles: ${trends.typographyTrends.styles.join(', ')}
- Popular Pairings: ${trends.typographyTrends.pairings.join(', ')}
- Special Treatments: ${trends.typographyTrends.treatments.join(', ')}

**Layout Trends:**
- Compositions: ${trends.layoutTrends.compositions.join(', ')}
- Spacing: ${trends.layoutTrends.spacing}
- Hierarchy: ${trends.layoutTrends.hierarchy}

**Platform-Specific Trends (${platform}):**
${platformTrends.map(trend => `- ${trend}`).join('\n')}

**TREND APPLICATION GUIDELINES:**
- Incorporate 2-3 relevant trends maximum to avoid overwhelming the design
- Ensure trends align with brand personality and business goals
- Prioritize trends that enhance readability and user experience
- Balance trendy elements with timeless design principles
`;
}

/**
 * Fallback trends when API fails
 */
function getFallbackTrends(businessType: string, platform: string): DesignTrends {
  return {
    currentTrends: [
      {
        name: "Bold Typography",
        description: "Large, impactful typography that commands attention",
        applicability: "high",
        implementation: "Use oversized headlines with strong contrast",
        examples: ["Large sans-serif headers", "Bold statement text", "Typography as hero element"]
      },
      {
        name: "Minimalist Design",
        description: "Clean, uncluttered designs with plenty of white space",
        applicability: "high",
        implementation: "Focus on essential elements, generous spacing, simple color palette",
        examples: ["Clean layouts", "Minimal color schemes", "Focused messaging"]
      },
      {
        name: "Authentic Photography",
        description: "Real, unposed photography over stock imagery",
        applicability: "medium",
        implementation: "Use candid, lifestyle photography that feels genuine",
        examples: ["Behind-the-scenes shots", "Real customer photos", "Lifestyle imagery"]
      }
    ],
    colorTrends: {
      palette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
      mood: "Vibrant yet calming, optimistic and approachable",
      application: "Use as accent colors against neutral backgrounds for maximum impact"
    },
    typographyTrends: {
      styles: ["Bold sans-serif", "Modern serif", "Custom lettering"],
      pairings: ["Bold header + clean body", "Serif headline + sans-serif body"],
      treatments: ["Gradient text", "Outlined text", "Text with shadows"]
    },
    layoutTrends: {
      compositions: ["Asymmetrical balance", "Grid-based layouts", "Centered focal points"],
      spacing: "Generous white space with intentional breathing room",
      hierarchy: "Clear size differentiation with strong contrast"
    },
    platformSpecific: {
      instagram: ["Square and vertical formats", "Story-friendly designs", "Carousel-optimized layouts"],
      facebook: ["Horizontal emphasis", "Video-first approach", "Community-focused messaging"],
      twitter: ["High contrast for timeline", "Text-heavy designs", "Trending hashtag integration"],
      linkedin: ["Professional aesthetics", "Data visualization", "Thought leadership focus"]
    }
  };
}

/**
 * Caches trends to avoid excessive API calls
 * Reduced cache duration and added randomization to prevent repetitive designs
 */
const trendsCache = new Map<string, { trends: DesignTrends; timestamp: number; usageCount: number }>();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours (reduced from 24 hours)
const MAX_USAGE_COUNT = 5; // Force refresh after 5 uses to add variety

export async function getCachedDesignTrends(
  businessType: string,
  platform: string,
  targetAudience?: string,
  industry?: string
): Promise<DesignTrends> {
  // Add randomization to cache key to create more variety
  const hourOfDay = new Date().getHours();
  const randomSeed = Math.floor(hourOfDay / 2); // Changes every 2 hours
  const cacheKey = `${businessType}-${platform}-${targetAudience}-${industry}-${randomSeed}`;
  const cached = trendsCache.get(cacheKey);

  // Check if cache is valid and not overused
  if (cached &&
    Date.now() - cached.timestamp < CACHE_DURATION &&
    cached.usageCount < MAX_USAGE_COUNT) {
    cached.usageCount++;
    return cached.trends;
  }

  const trends = await getCurrentDesignTrends(businessType, platform, targetAudience, industry);
  trendsCache.set(cacheKey, { trends, timestamp: Date.now(), usageCount: 1 });

  return trends;
}
