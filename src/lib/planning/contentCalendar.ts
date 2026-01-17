/**
 * Content Calendar
 * Generates and manages content posting schedules
 * Part of Layer 2: Planning Layer
 */

import { createClient } from '@supabase/supabase-js';
import { getUpcomingEvents, SeasonalEvent } from '../research/seasonalEvents';

export interface ContentSlot {
  id?: string;
  date: Date;
  time?: string;
  platform: string;
  contentType: ContentType;
  contentPillar?: string;
  marketingAngle?: string;
  topicSuggestion?: string;
  status: 'planned' | 'content_generated' | 'scheduled' | 'published' | 'skipped';
  scheduledPostId?: string;
  event?: SeasonalEvent;
}

export type ContentType = 
  | 'promotional' 
  | 'educational' 
  | 'engagement' 
  | 'behind-the-scenes' 
  | 'user-generated' 
  | 'seasonal'
  | 'product-showcase'
  | 'testimonial';

export interface CalendarConfig {
  postsPerWeek: number;
  contentMix: Record<ContentType, number>; // Percentage for each type
  preferredDays: number[]; // 0 = Sunday, 6 = Saturday
  preferredTimes: string[]; // e.g., ['09:00', '12:00', '17:00']
  platforms: string[];
}

export interface GeneratedCalendar {
  slots: ContentSlot[];
  config: CalendarConfig;
  startDate: Date;
  endDate: Date;
  summary: {
    totalSlots: number;
    byContentType: Record<string, number>;
    byPlatform: Record<string, number>;
    eventsIncluded: number;
  };
}

// Default content mix (percentages should sum to 100)
const DEFAULT_CONTENT_MIX: Record<ContentType, number> = {
  'promotional': 20,
  'educational': 30,
  'engagement': 20,
  'behind-the-scenes': 10,
  'user-generated': 5,
  'seasonal': 5,
  'product-showcase': 5,
  'testimonial': 5,
};

// Industry-specific content mixes
const INDUSTRY_CONTENT_MIX: Record<string, Record<ContentType, number>> = {
  retail: {
    'promotional': 30,
    'educational': 15,
    'engagement': 15,
    'behind-the-scenes': 10,
    'user-generated': 10,
    'seasonal': 5,
    'product-showcase': 10,
    'testimonial': 5,
  },
  food: {
    'promotional': 20,
    'educational': 20,
    'engagement': 15,
    'behind-the-scenes': 20,
    'user-generated': 10,
    'seasonal': 5,
    'product-showcase': 5,
    'testimonial': 5,
  },
  finance: {
    'promotional': 15,
    'educational': 40,
    'engagement': 15,
    'behind-the-scenes': 5,
    'user-generated': 5,
    'seasonal': 5,
    'product-showcase': 5,
    'testimonial': 10,
  },
  healthcare: {
    'promotional': 10,
    'educational': 45,
    'engagement': 15,
    'behind-the-scenes': 10,
    'user-generated': 5,
    'seasonal': 5,
    'product-showcase': 0,
    'testimonial': 10,
  },
  service: {
    'promotional': 20,
    'educational': 25,
    'engagement': 20,
    'behind-the-scenes': 10,
    'user-generated': 5,
    'seasonal': 5,
    'product-showcase': 5,
    'testimonial': 10,
  },
};

// Marketing angles for rotation
const MARKETING_ANGLES = [
  'price-value',
  'quality-premium',
  'convenience-ease',
  'trust-reliability',
  'innovation-modern',
  'community-belonging',
  'urgency-scarcity',
];

/**
 * Generate a content calendar for a specified period
 */
export async function generateContentCalendar(
  brandProfileId: string,
  options: {
    weeks?: number;
    industry?: string;
    location?: string;
    platforms?: string[];
    postsPerWeek?: number;
    startDate?: Date;
  } = {}
): Promise<GeneratedCalendar> {
  const {
    weeks = 4,
    industry = 'retail',
    location,
    platforms = ['instagram'],
    postsPerWeek = 7,
    startDate = new Date(),
  } = options;

  console.log(`📅 [Calendar] Generating ${weeks}-week calendar for ${industry}`);

  // Get industry-specific content mix
  const contentMix = INDUSTRY_CONTENT_MIX[industry] || DEFAULT_CONTENT_MIX;

  // Get upcoming events
  const eventCalendar = getUpcomingEvents({ location, industry, daysAhead: weeks * 7 });

  // Build calendar config
  const config: CalendarConfig = {
    postsPerWeek,
    contentMix,
    preferredDays: [1, 2, 3, 4, 5, 6], // Mon-Sat by default
    preferredTimes: ['09:00', '12:00', '17:00', '19:00'],
    platforms,
  };

  // Generate slots
  const slots = generateSlots(startDate, weeks, config, eventCalendar.upcoming);

  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);

  // Build summary
  const summary = buildSummary(slots);

  const calendar: GeneratedCalendar = {
    slots,
    config,
    startDate,
    endDate,
    summary,
  };

  // Save to database
  await saveCalendarToDatabase(brandProfileId, calendar);

  console.log(`✅ [Calendar] Generated ${slots.length} content slots`);
  return calendar;
}

/**
 * Generate content slots for the calendar
 */
function generateSlots(
  startDate: Date,
  weeks: number,
  config: CalendarConfig,
  events: SeasonalEvent[]
): ContentSlot[] {
  const slots: ContentSlot[] = [];
  const totalPosts = weeks * config.postsPerWeek;

  // Calculate how many posts of each type we need
  const postsByType: Record<ContentType, number> = {} as Record<ContentType, number>;
  for (const [type, percentage] of Object.entries(config.contentMix)) {
    postsByType[type as ContentType] = Math.round((percentage / 100) * totalPosts);
  }

  // Create a pool of content types to assign
  const typePool: ContentType[] = [];
  for (const [type, count] of Object.entries(postsByType)) {
    for (let i = 0; i < count; i++) {
      typePool.push(type as ContentType);
    }
  }

  // Shuffle the pool for variety
  shuffleArray(typePool);

  // Generate dates for posting
  const postDates = generatePostDates(startDate, weeks, config);

  // Assign content types to dates
  let angleIndex = 0;
  for (let i = 0; i < Math.min(postDates.length, typePool.length); i++) {
    const date = postDates[i];
    let contentType = typePool[i];

    // Check if there's an event on this day
    const dayEvent = events.find(e => {
      const eventDate = new Date(e.date);
      return eventDate.toDateString() === date.toDateString();
    });

    // If there's an event, make it seasonal content
    if (dayEvent) {
      contentType = 'seasonal';
    }

    // Assign marketing angle (rotate through them)
    const marketingAngle = MARKETING_ANGLES[angleIndex % MARKETING_ANGLES.length];
    angleIndex++;

    // Generate topic suggestion based on content type
    const topicSuggestion = generateTopicSuggestion(contentType, dayEvent);

    // Assign platform (rotate if multiple)
    const platform = config.platforms[i % config.platforms.length];

    slots.push({
      date,
      time: config.preferredTimes[i % config.preferredTimes.length],
      platform,
      contentType,
      marketingAngle,
      topicSuggestion,
      status: 'planned',
      event: dayEvent,
    });
  }

  // Sort by date
  slots.sort((a, b) => a.date.getTime() - b.date.getTime());

  return slots;
}

/**
 * Generate posting dates based on config
 */
function generatePostDates(
  startDate: Date,
  weeks: number,
  config: CalendarConfig
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);

  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay();

    if (config.preferredDays.includes(dayOfWeek)) {
      // Add a post for this day
      dates.push(new Date(currentDate));
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Limit to posts per week * weeks
  const maxPosts = config.postsPerWeek * weeks;
  return dates.slice(0, maxPosts);
}

/**
 * Generate topic suggestion based on content type
 */
function generateTopicSuggestion(
  contentType: ContentType,
  event?: SeasonalEvent
): string {
  if (event) {
    return `${event.name}: ${event.contentIdeas[0]}`;
  }

  const suggestions: Record<ContentType, string[]> = {
    'promotional': [
      'Special offer announcement',
      'Limited time deal',
      'New product launch',
      'Flash sale',
    ],
    'educational': [
      'How-to guide',
      'Tips and tricks',
      'Industry insights',
      'FAQ answered',
    ],
    'engagement': [
      'Question for followers',
      'Poll or quiz',
      'Caption this',
      'Share your story',
    ],
    'behind-the-scenes': [
      'Team spotlight',
      'Day in the life',
      'How we make it',
      'Office tour',
    ],
    'user-generated': [
      'Customer spotlight',
      'Review showcase',
      'User photos',
      'Success story',
    ],
    'seasonal': [
      'Holiday celebration',
      'Seasonal special',
      'Event countdown',
      'Festive content',
    ],
    'product-showcase': [
      'Product feature highlight',
      'New arrival',
      'Best seller',
      'Product comparison',
    ],
    'testimonial': [
      'Customer review',
      'Success story',
      'Before and after',
      'Case study',
    ],
  };

  const options = suggestions[contentType] || suggestions.promotional;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Build summary statistics for the calendar
 */
function buildSummary(slots: ContentSlot[]): GeneratedCalendar['summary'] {
  const byContentType: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  let eventsIncluded = 0;

  for (const slot of slots) {
    byContentType[slot.contentType] = (byContentType[slot.contentType] || 0) + 1;
    byPlatform[slot.platform] = (byPlatform[slot.platform] || 0) + 1;
    if (slot.event) eventsIncluded++;
  }

  return {
    totalSlots: slots.length,
    byContentType,
    byPlatform,
    eventsIncluded,
  };
}

/**
 * Save calendar to database
 */
async function saveCalendarToDatabase(
  brandProfileId: string,
  calendar: GeneratedCalendar
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Clear existing planned slots for this brand
  await supabase
    .from('content_calendar')
    .delete()
    .eq('brand_profile_id', brandProfileId)
    .eq('status', 'planned');

  // Insert new slots
  const rows = calendar.slots.map(slot => ({
    brand_profile_id: brandProfileId,
    planned_date: slot.date.toISOString().split('T')[0],
    planned_time: slot.time,
    platform: slot.platform,
    content_type: slot.contentType,
    marketing_angle: slot.marketingAngle,
    topic_suggestion: slot.topicSuggestion,
    status: slot.status,
  }));

  await supabase.from('content_calendar').insert(rows);
}

/**
 * Get existing calendar for a brand
 */
export async function getCalendar(
  brandProfileId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    status?: ContentSlot['status'][];
  } = {}
): Promise<ContentSlot[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('content_calendar')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .order('planned_date', { ascending: true });

  if (options.startDate) {
    query = query.gte('planned_date', options.startDate.toISOString().split('T')[0]);
  }

  if (options.endDate) {
    query = query.lte('planned_date', options.endDate.toISOString().split('T')[0]);
  }

  if (options.status && options.status.length > 0) {
    query = query.in('status', options.status);
  }

  const { data } = await query;

  return (data || []).map(row => ({
    id: row.id,
    date: new Date(row.planned_date),
    time: row.planned_time,
    platform: row.platform,
    contentType: row.content_type,
    contentPillar: row.content_pillar_id,
    marketingAngle: row.marketing_angle,
    topicSuggestion: row.topic_suggestion,
    status: row.status,
    scheduledPostId: row.scheduled_post_id,
  }));
}

/**
 * Update a calendar slot
 */
export async function updateCalendarSlot(
  slotId: string,
  updates: Partial<ContentSlot>
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('content_calendar')
    .update({
      planned_date: updates.date?.toISOString().split('T')[0],
      planned_time: updates.time,
      platform: updates.platform,
      content_type: updates.contentType,
      marketing_angle: updates.marketingAngle,
      topic_suggestion: updates.topicSuggestion,
      status: updates.status,
      scheduled_post_id: updates.scheduledPostId,
    })
    .eq('id', slotId);
}

/**
 * Get next content slot to generate
 */
export async function getNextSlotToGenerate(
  brandProfileId: string
): Promise<ContentSlot | null> {
  const slots = await getCalendar(brandProfileId, {
    status: ['planned'],
    startDate: new Date(),
  });

  return slots[0] || null;
}

/**
 * Shuffle array in place
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export default {
  generateContentCalendar,
  getCalendar,
  updateCalendarSlot,
  getNextSlotToGenerate,
};
