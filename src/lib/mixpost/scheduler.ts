/**
 * Mixpost Scheduler
 * Handles optimal posting time calculation and schedule management
 */

import { getMixpostClient, MixpostAnalytics } from './client';

export interface ScheduleConfig {
  timezone: string;
  preferredDays: number[]; // 0 = Sunday, 6 = Saturday
  preferredHours: number[]; // 0-23
  maxPostsPerDay: number;
  minHoursBetweenPosts: number;
}

export interface OptimalTimeSlot {
  dayOfWeek: number;
  hour: number;
  engagementScore: number;
}

export interface ScheduleResult {
  times: Date[];
  strategy: string;
  confidence: number;
}

// Default schedule configurations by industry
const INDUSTRY_DEFAULTS: Record<string, ScheduleConfig> = {
  retail: {
    timezone: 'Africa/Nairobi',
    preferredDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    preferredHours: [9, 12, 17, 19],
    maxPostsPerDay: 2,
    minHoursBetweenPosts: 4,
  },
  food: {
    timezone: 'Africa/Nairobi',
    preferredDays: [0, 1, 2, 3, 4, 5, 6], // All week
    preferredHours: [8, 11, 13, 18, 20], // Meal times
    maxPostsPerDay: 3,
    minHoursBetweenPosts: 3,
  },
  finance: {
    timezone: 'Africa/Nairobi',
    preferredDays: [1, 2, 3, 4, 5], // Weekdays only
    preferredHours: [8, 10, 14, 16],
    maxPostsPerDay: 2,
    minHoursBetweenPosts: 4,
  },
  healthcare: {
    timezone: 'Africa/Nairobi',
    preferredDays: [1, 2, 3, 4, 5],
    preferredHours: [9, 11, 15, 17],
    maxPostsPerDay: 1,
    minHoursBetweenPosts: 6,
  },
  default: {
    timezone: 'Africa/Nairobi',
    preferredDays: [1, 2, 3, 4, 5, 6],
    preferredHours: [9, 12, 17, 19],
    maxPostsPerDay: 2,
    minHoursBetweenPosts: 4,
  },
};

// Platform-specific optimal times (based on general social media research)
const PLATFORM_OPTIMAL_TIMES: Record<string, { days: number[]; hours: number[] }> = {
  instagram: {
    days: [1, 2, 3, 4, 5], // Tue-Fri best
    hours: [11, 13, 19, 21], // 11am, 1pm, 7pm, 9pm
  },
  facebook: {
    days: [2, 3, 4], // Wed-Fri best
    hours: [9, 13, 16], // 9am, 1pm, 4pm
  },
  twitter: {
    days: [1, 2, 3, 4], // Mon-Thu best
    hours: [8, 12, 17], // 8am, 12pm, 5pm
  },
  linkedin: {
    days: [1, 2, 3], // Tue-Thu best
    hours: [7, 10, 12], // 7am, 10am, 12pm
  },
  tiktok: {
    days: [1, 2, 4], // Tue, Wed, Fri best
    hours: [19, 21, 22], // 7pm, 9pm, 10pm
  },
};

/**
 * Get optimal posting schedule based on analytics and industry
 */
export async function getOptimalSchedule(
  workspaceId: string,
  numPosts: number,
  options: {
    industry?: string;
    platform?: string;
    startDate?: Date;
    useAnalytics?: boolean;
  } = {}
): Promise<ScheduleResult> {
  const {
    industry = 'default',
    platform = 'instagram',
    startDate = new Date(),
    useAnalytics = true,
  } = options;

  console.log(`📅 [Scheduler] Calculating optimal schedule for ${numPosts} posts`);
  console.log(`   Industry: ${industry}, Platform: ${platform}`);

  let optimalSlots: OptimalTimeSlot[] = [];
  let confidence = 0.5; // Default confidence
  let strategy = 'default';

  // Try to get analytics-based schedule
  if (useAnalytics && workspaceId) {
    try {
      const analyticsSlots = await getAnalyticsBasedSlots(workspaceId);
      if (analyticsSlots.length > 0) {
        optimalSlots = analyticsSlots;
        confidence = 0.9;
        strategy = 'analytics-based';
        console.log(`✅ [Scheduler] Using analytics-based schedule (${analyticsSlots.length} slots)`);
      }
    } catch (error) {
      console.warn(`⚠️ [Scheduler] Could not get analytics, falling back to defaults`);
    }
  }

  // Fall back to industry + platform defaults
  if (optimalSlots.length === 0) {
    optimalSlots = getDefaultSlots(industry, platform);
    strategy = 'industry-platform-defaults';
    confidence = 0.7;
    console.log(`📊 [Scheduler] Using ${industry}/${platform} defaults`);
  }

  // Generate actual dates from optimal slots
  const times = generateScheduleDates(optimalSlots, numPosts, startDate);

  return {
    times,
    strategy,
    confidence,
  };
}

/**
 * Get optimal time slots based on historical analytics
 */
async function getAnalyticsBasedSlots(workspaceId: string): Promise<OptimalTimeSlot[]> {
  const client = getMixpostClient();
  
  if (!client.isConfigured()) {
    return [];
  }

  const analytics = await client.getAnalytics(workspaceId, 90); // Last 90 days
  
  if (!analytics || analytics.length === 0) {
    return [];
  }

  // Analyze engagement patterns by day and hour
  const engagementBySlot: Map<string, { total: number; count: number }> = new Map();

  // TODO: When Mixpost provides detailed time-based analytics,
  // parse and aggregate engagement by day/hour here
  
  // For now, return empty to trigger fallback
  return [];
}

/**
 * Get default optimal slots based on industry and platform
 */
function getDefaultSlots(industry: string, platform: string): OptimalTimeSlot[] {
  const industryConfig = INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS.default;
  const platformConfig = PLATFORM_OPTIMAL_TIMES[platform] || PLATFORM_OPTIMAL_TIMES.instagram;

  // Combine industry and platform preferences
  const slots: OptimalTimeSlot[] = [];

  // Find intersection of preferred days
  const preferredDays = industryConfig.preferredDays.filter(
    day => platformConfig.days.includes(day)
  );
  const days = preferredDays.length > 0 ? preferredDays : industryConfig.preferredDays;

  // Find intersection of preferred hours
  const preferredHours = industryConfig.preferredHours.filter(
    hour => platformConfig.hours.some(h => Math.abs(h - hour) <= 1)
  );
  const hours = preferredHours.length > 0 ? preferredHours : industryConfig.preferredHours;

  // Generate slots
  for (const day of days) {
    for (const hour of hours) {
      slots.push({
        dayOfWeek: day,
        hour,
        engagementScore: 0.7 + Math.random() * 0.3, // Simulated score
      });
    }
  }

  // Sort by engagement score
  slots.sort((a, b) => b.engagementScore - a.engagementScore);

  return slots;
}

/**
 * Generate actual schedule dates from optimal slots
 */
function generateScheduleDates(
  slots: OptimalTimeSlot[],
  numPosts: number,
  startDate: Date
): Date[] {
  const dates: Date[] = [];
  const usedSlots = new Set<string>();

  let currentDate = new Date(startDate);
  let postsScheduled = 0;
  let daysChecked = 0;
  const maxDays = 30; // Don't schedule more than 30 days out

  while (postsScheduled < numPosts && daysChecked < maxDays) {
    const dayOfWeek = currentDate.getDay();
    
    // Find slots for this day of week
    const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      if (postsScheduled >= numPosts) break;

      const slotKey = `${currentDate.toDateString()}-${slot.hour}`;
      if (usedSlots.has(slotKey)) continue;

      const postDate = new Date(currentDate);
      postDate.setHours(slot.hour, 0, 0, 0);

      // Don't schedule in the past
      if (postDate > new Date()) {
        dates.push(postDate);
        usedSlots.add(slotKey);
        postsScheduled++;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }

  // Sort by date
  dates.sort((a, b) => a.getTime() - b.getTime());

  return dates;
}

/**
 * Get schedule configuration for a specific industry
 */
export function getIndustryScheduleConfig(industry: string): ScheduleConfig {
  return INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS.default;
}

/**
 * Validate a proposed schedule
 */
export function validateSchedule(
  times: Date[],
  config: ScheduleConfig
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check posts per day
  const postsByDay = new Map<string, number>();
  for (const time of times) {
    const dayKey = time.toDateString();
    postsByDay.set(dayKey, (postsByDay.get(dayKey) || 0) + 1);
  }

  for (const [day, count] of postsByDay) {
    if (count > config.maxPostsPerDay) {
      issues.push(`Too many posts on ${day}: ${count} (max: ${config.maxPostsPerDay})`);
    }
  }

  // Check minimum hours between posts
  const sortedTimes = [...times].sort((a, b) => a.getTime() - b.getTime());
  for (let i = 1; i < sortedTimes.length; i++) {
    const hoursDiff = (sortedTimes[i].getTime() - sortedTimes[i - 1].getTime()) / (1000 * 60 * 60);
    if (hoursDiff < config.minHoursBetweenPosts) {
      issues.push(
        `Posts too close together: ${sortedTimes[i - 1].toISOString()} and ${sortedTimes[i].toISOString()} (${hoursDiff.toFixed(1)}h apart, min: ${config.minHoursBetweenPosts}h)`
      );
    }
  }

  // Check preferred days
  for (const time of times) {
    if (!config.preferredDays.includes(time.getDay())) {
      issues.push(`Post scheduled on non-preferred day: ${time.toDateString()}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Suggest schedule adjustments based on validation issues
 */
export function suggestScheduleAdjustments(
  times: Date[],
  config: ScheduleConfig
): Date[] {
  const validation = validateSchedule(times, config);
  
  if (validation.valid) {
    return times;
  }

  // Redistribute posts to fix issues
  const adjustedTimes: Date[] = [];
  const usedSlots = new Set<string>();

  for (const time of times) {
    let adjustedTime = new Date(time);
    let attempts = 0;
    const maxAttempts = 48; // Try up to 48 hours of adjustments

    while (attempts < maxAttempts) {
      const slotKey = `${adjustedTime.toDateString()}-${adjustedTime.getHours()}`;
      const dayKey = adjustedTime.toDateString();
      
      // Count posts on this day
      const postsOnDay = adjustedTimes.filter(
        t => t.toDateString() === dayKey
      ).length;

      // Check if slot is valid
      const isPreferredDay = config.preferredDays.includes(adjustedTime.getDay());
      const isPreferredHour = config.preferredHours.includes(adjustedTime.getHours());
      const isUnderDayLimit = postsOnDay < config.maxPostsPerDay;
      const isSlotFree = !usedSlots.has(slotKey);

      if (isPreferredDay && isPreferredHour && isUnderDayLimit && isSlotFree) {
        adjustedTimes.push(adjustedTime);
        usedSlots.add(slotKey);
        break;
      }

      // Try next hour
      adjustedTime = new Date(adjustedTime.getTime() + 60 * 60 * 1000);
      attempts++;
    }
  }

  return adjustedTimes.sort((a, b) => a.getTime() - b.getTime());
}

export default {
  getOptimalSchedule,
  getIndustryScheduleConfig,
  validateSchedule,
  suggestScheduleAdjustments,
};
