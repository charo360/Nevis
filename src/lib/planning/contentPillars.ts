/**
 * Content Pillars
 * Defines and manages content themes/pillars for consistent brand messaging
 * Part of Layer 2: Planning Layer
 */

import { createClient } from '@supabase/supabase-js';

export interface ContentPillar {
  id?: string;
  name: string;
  description: string;
  percentage: number; // Target percentage of content
  exampleTopics: string[];
  toneGuidelines: string;
  visualStyle: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface PillarSuggestion {
  name: string;
  description: string;
  percentage: number;
  exampleTopics: string[];
  toneGuidelines: string;
  visualStyle: string;
}

// Industry-specific pillar templates
const INDUSTRY_PILLARS: Record<string, PillarSuggestion[]> = {
  retail: [
    {
      name: 'Product Showcase',
      description: 'Highlight products, new arrivals, and bestsellers',
      percentage: 30,
      exampleTopics: ['New arrivals', 'Bestsellers', 'Product features', 'Styling tips'],
      toneGuidelines: 'Aspirational, exciting, descriptive',
      visualStyle: 'Clean product photography, lifestyle shots',
    },
    {
      name: 'Deals & Promotions',
      description: 'Sales, discounts, and special offers',
      percentage: 25,
      exampleTopics: ['Flash sales', 'Seasonal discounts', 'Bundle deals', 'Member exclusives'],
      toneGuidelines: 'Urgent, exciting, value-focused',
      visualStyle: 'Bold graphics, price callouts, countdown timers',
    },
    {
      name: 'Customer Stories',
      description: 'Reviews, testimonials, and user-generated content',
      percentage: 20,
      exampleTopics: ['Customer reviews', 'Unboxing', 'Style inspiration', 'Success stories'],
      toneGuidelines: 'Authentic, relatable, grateful',
      visualStyle: 'Real customer photos, quote graphics',
    },
    {
      name: 'Behind the Brand',
      description: 'Company culture, team, and values',
      percentage: 15,
      exampleTopics: ['Team spotlight', 'How we source', 'Our story', 'Sustainability efforts'],
      toneGuidelines: 'Personal, transparent, warm',
      visualStyle: 'Candid photos, behind-the-scenes footage',
    },
    {
      name: 'Lifestyle & Tips',
      description: 'Educational content and lifestyle inspiration',
      percentage: 10,
      exampleTopics: ['Styling guides', 'Care tips', 'Trend reports', 'How-to content'],
      toneGuidelines: 'Helpful, expert, friendly',
      visualStyle: 'Infographics, tutorial format, clean layouts',
    },
  ],
  food: [
    {
      name: 'Menu Highlights',
      description: 'Showcase dishes, drinks, and specials',
      percentage: 30,
      exampleTopics: ['Signature dishes', 'New menu items', 'Chef specials', 'Seasonal offerings'],
      toneGuidelines: 'Appetizing, descriptive, enticing',
      visualStyle: 'Food photography, close-ups, steam/action shots',
    },
    {
      name: 'Behind the Kitchen',
      description: 'Cooking process, ingredients, and team',
      percentage: 25,
      exampleTopics: ['Recipe secrets', 'Ingredient sourcing', 'Chef stories', 'Kitchen prep'],
      toneGuidelines: 'Authentic, passionate, educational',
      visualStyle: 'Action shots, process videos, candid moments',
    },
    {
      name: 'Customer Experience',
      description: 'Reviews, dining moments, and celebrations',
      percentage: 20,
      exampleTopics: ['Happy customers', 'Celebrations', 'Reviews', 'Dining atmosphere'],
      toneGuidelines: 'Warm, celebratory, grateful',
      visualStyle: 'Candid customer photos, ambiance shots',
    },
    {
      name: 'Promotions & Events',
      description: 'Special offers, events, and occasions',
      percentage: 15,
      exampleTopics: ['Happy hour', 'Special events', 'Holiday menus', 'Catering offers'],
      toneGuidelines: 'Exciting, inviting, urgent',
      visualStyle: 'Event graphics, promotional designs',
    },
    {
      name: 'Food Education',
      description: 'Tips, recipes, and food knowledge',
      percentage: 10,
      exampleTopics: ['Cooking tips', 'Ingredient facts', 'Pairing suggestions', 'Food history'],
      toneGuidelines: 'Educational, expert, approachable',
      visualStyle: 'Infographics, step-by-step visuals',
    },
  ],
  finance: [
    {
      name: 'Financial Education',
      description: 'Tips, guides, and financial literacy',
      percentage: 35,
      exampleTopics: ['Saving tips', 'Budgeting guides', 'Investment basics', 'Financial planning'],
      toneGuidelines: 'Educational, trustworthy, empowering',
      visualStyle: 'Clean infographics, data visualizations',
    },
    {
      name: 'Product Features',
      description: 'Service highlights and how-to guides',
      percentage: 25,
      exampleTopics: ['App features', 'Service benefits', 'How to use', 'New features'],
      toneGuidelines: 'Clear, helpful, professional',
      visualStyle: 'App screenshots, feature highlights, demos',
    },
    {
      name: 'Success Stories',
      description: 'Customer testimonials and case studies',
      percentage: 20,
      exampleTopics: ['Customer success', 'Business growth', 'Savings achieved', 'Goals met'],
      toneGuidelines: 'Inspiring, authentic, relatable',
      visualStyle: 'Quote graphics, real customer photos',
    },
    {
      name: 'Trust & Security',
      description: 'Security features, compliance, and reliability',
      percentage: 10,
      exampleTopics: ['Security measures', 'Data protection', 'Compliance', 'Reliability'],
      toneGuidelines: 'Reassuring, professional, authoritative',
      visualStyle: 'Trust badges, security icons, clean design',
    },
    {
      name: 'Company Updates',
      description: 'News, milestones, and community',
      percentage: 10,
      exampleTopics: ['Company news', 'Milestones', 'Team updates', 'Community involvement'],
      toneGuidelines: 'Transparent, celebratory, connected',
      visualStyle: 'Team photos, milestone graphics',
    },
  ],
  healthcare: [
    {
      name: 'Health Education',
      description: 'Medical information and wellness tips',
      percentage: 40,
      exampleTopics: ['Health tips', 'Prevention', 'Symptoms explained', 'Wellness advice'],
      toneGuidelines: 'Authoritative, caring, clear',
      visualStyle: 'Clean infographics, medical illustrations',
    },
    {
      name: 'Services & Treatments',
      description: 'Available services and treatment options',
      percentage: 25,
      exampleTopics: ['Service overview', 'Treatment options', 'Specialties', 'Technology'],
      toneGuidelines: 'Professional, informative, reassuring',
      visualStyle: 'Facility photos, service graphics',
    },
    {
      name: 'Patient Stories',
      description: 'Testimonials and recovery journeys',
      percentage: 15,
      exampleTopics: ['Recovery stories', 'Patient testimonials', 'Before/after', 'Thank you notes'],
      toneGuidelines: 'Empathetic, inspiring, hopeful',
      visualStyle: 'Patient photos (with consent), quote graphics',
    },
    {
      name: 'Team & Expertise',
      description: 'Doctor profiles and team highlights',
      percentage: 10,
      exampleTopics: ['Doctor profiles', 'Staff spotlight', 'Credentials', 'Continuing education'],
      toneGuidelines: 'Professional, warm, trustworthy',
      visualStyle: 'Professional headshots, team photos',
    },
    {
      name: 'Community & Events',
      description: 'Health events and community involvement',
      percentage: 10,
      exampleTopics: ['Health camps', 'Awareness days', 'Community events', 'Partnerships'],
      toneGuidelines: 'Community-focused, inviting, caring',
      visualStyle: 'Event photos, community graphics',
    },
  ],
  service: [
    {
      name: 'Service Showcase',
      description: 'Highlight services and capabilities',
      percentage: 30,
      exampleTopics: ['Service features', 'Process explained', 'Capabilities', 'Specializations'],
      toneGuidelines: 'Professional, confident, clear',
      visualStyle: 'Service photos, process visuals',
    },
    {
      name: 'Client Success',
      description: 'Case studies and testimonials',
      percentage: 25,
      exampleTopics: ['Case studies', 'Client testimonials', 'Results achieved', 'Partnerships'],
      toneGuidelines: 'Proud, authentic, results-focused',
      visualStyle: 'Before/after, quote graphics, results data',
    },
    {
      name: 'Expert Insights',
      description: 'Industry knowledge and tips',
      percentage: 20,
      exampleTopics: ['Industry tips', 'Best practices', 'Trends', 'How-to guides'],
      toneGuidelines: 'Expert, helpful, educational',
      visualStyle: 'Infographics, tip cards, educational content',
    },
    {
      name: 'Behind the Scenes',
      description: 'Team, culture, and process',
      percentage: 15,
      exampleTopics: ['Team spotlight', 'Work process', 'Company culture', 'Day in the life'],
      toneGuidelines: 'Personal, transparent, relatable',
      visualStyle: 'Candid team photos, workspace shots',
    },
    {
      name: 'Promotions',
      description: 'Special offers and announcements',
      percentage: 10,
      exampleTopics: ['Special offers', 'New services', 'Seasonal promotions', 'Referral programs'],
      toneGuidelines: 'Exciting, value-focused, urgent',
      visualStyle: 'Promotional graphics, offer callouts',
    },
  ],
};

/**
 * Get suggested pillars for an industry
 */
export function getSuggestedPillars(industry: string): PillarSuggestion[] {
  return INDUSTRY_PILLARS[industry] || INDUSTRY_PILLARS.service;
}

/**
 * Create content pillars for a brand
 */
export async function createContentPillars(
  brandProfileId: string,
  pillars: PillarSuggestion[]
): Promise<ContentPillar[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validate percentages sum to 100
  const totalPercentage = pillars.reduce((sum, p) => sum + p.percentage, 0);
  if (totalPercentage !== 100) {
    console.warn(`⚠️ [Pillars] Percentages sum to ${totalPercentage}, not 100`);
  }

  const rows = pillars.map(pillar => ({
    brand_profile_id: brandProfileId,
    name: pillar.name,
    description: pillar.description,
    percentage: pillar.percentage,
    example_topics: pillar.exampleTopics,
    tone_guidelines: pillar.toneGuidelines,
    visual_style: pillar.visualStyle,
    is_active: true,
    usage_count: 0,
  }));

  const { data, error } = await supabase
    .from('content_pillars')
    .insert(rows)
    .select();

  if (error) {
    console.error('❌ [Pillars] Failed to create pillars:', error);
    throw error;
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    percentage: row.percentage,
    exampleTopics: row.example_topics,
    toneGuidelines: row.tone_guidelines,
    visualStyle: row.visual_style,
    isActive: row.is_active,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
  }));
}

/**
 * Get content pillars for a brand
 */
export async function getContentPillars(
  brandProfileId: string,
  activeOnly: boolean = true
): Promise<ContentPillar[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('content_pillars')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .order('percentage', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data } = await query;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    percentage: row.percentage,
    exampleTopics: row.example_topics || [],
    toneGuidelines: row.tone_guidelines,
    visualStyle: row.visual_style,
    isActive: row.is_active,
    usageCount: row.usage_count || 0,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
  }));
}

/**
 * Get the next pillar to use based on usage balance
 */
export async function getNextPillarToUse(
  brandProfileId: string
): Promise<ContentPillar | null> {
  const pillars = await getContentPillars(brandProfileId);

  if (pillars.length === 0) return null;

  // Calculate actual usage percentages
  const totalUsage = pillars.reduce((sum, p) => sum + p.usageCount, 0);

  if (totalUsage === 0) {
    // No usage yet, return the one with highest target percentage
    return pillars[0];
  }

  // Find the pillar that's most under-used relative to its target
  let mostUnderused: ContentPillar | null = null;
  let biggestGap = -Infinity;

  for (const pillar of pillars) {
    const actualPercentage = (pillar.usageCount / totalUsage) * 100;
    const gap = pillar.percentage - actualPercentage;

    if (gap > biggestGap) {
      biggestGap = gap;
      mostUnderused = pillar;
    }
  }

  return mostUnderused;
}

/**
 * Record pillar usage
 */
export async function recordPillarUsage(pillarId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get current usage count
  const { data: current } = await supabase
    .from('content_pillars')
    .select('usage_count')
    .eq('id', pillarId)
    .single();

  await supabase
    .from('content_pillars')
    .update({
      usage_count: (current?.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', pillarId);
}

/**
 * Update a content pillar
 */
export async function updateContentPillar(
  pillarId: string,
  updates: Partial<ContentPillar>
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('content_pillars')
    .update({
      name: updates.name,
      description: updates.description,
      percentage: updates.percentage,
      example_topics: updates.exampleTopics,
      tone_guidelines: updates.toneGuidelines,
      visual_style: updates.visualStyle,
      is_active: updates.isActive,
    })
    .eq('id', pillarId);
}

/**
 * Format pillars for AI assistant
 */
export function formatPillarsForAssistant(pillars: ContentPillar[]): string {
  if (pillars.length === 0) {
    return 'No content pillars defined.';
  }

  let formatted = '📚 CONTENT PILLARS:\n\n';

  for (const pillar of pillars) {
    formatted += `**${pillar.name}** (${pillar.percentage}%)\n`;
    formatted += `${pillar.description}\n`;
    formatted += `Tone: ${pillar.toneGuidelines}\n`;
    formatted += `Visual: ${pillar.visualStyle}\n`;
    formatted += `Topics: ${pillar.exampleTopics.slice(0, 3).join(', ')}\n\n`;
  }

  return formatted;
}

export default {
  getSuggestedPillars,
  createContentPillars,
  getContentPillars,
  getNextPillarToUse,
  recordPillarUsage,
  updateContentPillar,
  formatPillarsForAssistant,
};
