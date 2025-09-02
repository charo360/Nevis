import { NextRequest, NextResponse } from 'next/server';
import { SocialMediaExpertSystem } from '@/ai/social-media-expert-system';
import { ContentGenerationEngine } from '@/ai/content-generation-engine';
import { AdvancedContentGenerator } from '@/ai/advanced-content-generator';
import { BusinessProfile } from '@/lib/types/business-profile';

/**
 * AI Social Media Expert API
 * 
 * This endpoint provides:
 * 1. Business analysis and social media strategy
 * 2. Generated social media posts
 * 3. Content calendar recommendations
 * 4. Platform-specific optimization
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, businessProfile, platform, postType, category, count = 1 } = body;

    // Validate required fields
    if (!businessProfile || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: businessProfile and action' },
        { status: 400 }
      );
    }

    // Validate business profile
    const validationError = validateBusinessProfile(businessProfile);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Initialize the AI Social Media Expert System
    const expertSystem = new SocialMediaExpertSystem(businessProfile);
    const contentStrategy = expertSystem.getContentStrategy();

    // Initialize the Content Generation Engine
    const contentEngine = new ContentGenerationEngine(businessProfile, contentStrategy);

    switch (action) {
      case 'analyze':
        return handleBusinessAnalysis(expertSystem);

      case 'generate-posts':
        return handlePostGeneration(contentEngine, platform, postType, category, count);

      case 'generate-strategy':
        return handleStrategyGeneration(expertSystem, contentStrategy);

      case 'generate-calendar':
        return handleCalendarGeneration(contentEngine, contentStrategy, count);

      case 'complete-package':
        return handleCompletePackage(expertSystem, contentEngine, platform, count);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: analyze, generate-posts, generate-strategy, generate-calendar, complete-package' },
          { status: 400 }
        );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle business analysis request
 */
async function handleBusinessAnalysis(expertSystem: SocialMediaExpertSystem) {
  const businessAnalysis = expertSystem.getBusinessAnalysis();
  const contentStrategy = expertSystem.getContentStrategy();
  const summaryReport = expertSystem.generateSummaryReport();

  return NextResponse.json({
    success: true,
    action: 'analyze',
    data: {
      businessAnalysis,
      contentStrategy,
      summaryReport,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Handle post generation request using Advanced Content Generator
 */
async function handlePostGeneration(
  contentEngine: ContentGenerationEngine,
  platform: string,
  postType: string,
  category: string,
  count: number
) {
  const posts = [];

  // Get business profile from content engine
  const businessProfile = (contentEngine as any).businessProfile;

  // Initialize advanced content generator
  const advancedGenerator = new AdvancedContentGenerator();

  for (let i = 0; i < count; i++) {
    try {
      // Use the advanced content generator instead of the old one
      const post = await advancedGenerator.generateEngagingContent(
        businessProfile,
        platform,
        postType || 'social_post'
      );
      posts.push(post);
    } catch (error) {
      // Fallback to old system if advanced fails
      const fallbackPost = contentEngine.generatePost(platform, postType, category);
      posts.push(fallbackPost);
    }
  }

  return NextResponse.json({
    success: true,
    action: 'generate-posts',
    data: {
      posts,
      count: posts.length,
      platform,
      postType,
      category,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Handle strategy generation request
 */
async function handleStrategyGeneration(
  expertSystem: SocialMediaExpertSystem,
  contentStrategy: any
) {
  const businessAnalysis = expertSystem.getBusinessAnalysis();
  const businessProfile = expertSystem.getBusinessProfile();

  // Generate content calendar recommendations
  const contentCalendar = generateContentCalendar(contentStrategy, businessProfile);

  return NextResponse.json({
    success: true,
    action: 'generate-strategy',
    data: {
      businessAnalysis,
      contentStrategy,
      contentCalendar,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Handle calendar generation request using Advanced Content Generator
 */
async function handleCalendarGeneration(
  contentEngine: ContentGenerationEngine,
  contentStrategy: any,
  count: number
) {
  const platforms = contentStrategy.platformMix;
  const calendar = [];

  // Get business profile from content engine
  const businessProfile = (contentEngine as any).businessProfile;

  // Initialize advanced content generator
  const advancedGenerator = new AdvancedContentGenerator();

  for (const platform of platforms) {
    const platformPosts = [];

    for (let i = 0; i < count; i++) {
      try {
        // Use the advanced content generator
        const post = await advancedGenerator.generateEngagingContent(
          businessProfile,
          platform,
          'social_post'
        );
        platformPosts.push(post);
      } catch (error) {
        // Fallback to old system
        const categories = Object.keys(contentStrategy.contentMix);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const fallbackPost = contentEngine.generatePost(platform, 'caption', randomCategory);
        platformPosts.push(fallbackPost);
      }
    }

    calendar.push({
      platform,
      posts: platformPosts
    });
  }

  return NextResponse.json({
    success: true,
    action: 'generate-calendar',
    data: {
      calendar,
      count,
      platforms,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Handle complete package request (analysis + strategy + posts)
 */
async function handleCompletePackage(
  expertSystem: SocialMediaExpertSystem,
  contentEngine: ContentGenerationEngine,
  platform: string,
  count: number
) {
  const businessAnalysis = expertSystem.getBusinessAnalysis();
  const contentStrategy = expertSystem.getContentStrategy();
  const summaryReport = expertSystem.generateSummaryReport();

  // Generate sample posts using advanced content generator
  const businessProfile = expertSystem.getBusinessProfile();
  const advancedGenerator = new AdvancedContentGenerator();
  const categories = ['behind-the-scenes', 'educational', 'community', 'customer-spotlight'];
  const samplePosts = [];

  for (const category of categories) {
    try {
      const post = await advancedGenerator.generateEngagingContent(
        businessProfile,
        platform,
        'social_post'
      );
      samplePosts.push(post);
    } catch (error) {
      // Fallback to old system
      const fallbackPost = contentEngine.generatePost(platform, 'caption', category);
      samplePosts.push(fallbackPost);
    }
  }

  // Generate content calendar
  const contentCalendar = generateContentCalendar(contentStrategy, expertSystem.getBusinessProfile());

  return NextResponse.json({
    success: true,
    action: 'complete-package',
    data: {
      businessAnalysis,
      contentStrategy,
      summaryReport,
      samplePosts,
      contentCalendar,
      platform,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Generate content calendar recommendations
 */
function generateContentCalendar(contentStrategy: any, businessProfile: BusinessProfile) {
  const postingFrequency = contentStrategy.postingFrequency;
  const platforms = contentStrategy.platformMix;
  const contentMix = contentStrategy.contentMix;

  const calendar = {
    weeklySchedule: [],
    contentThemes: [],
    platformStrategy: [],
    engagementTactics: [],
    hashtagStrategy: contentStrategy.hashtagStrategy,
    seasonalContent: contentStrategy.seasonalContent,
    localRelevance: contentStrategy.localRelevance
  };

  // Generate weekly schedule
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (postingFrequency === 'Daily') {
    daysOfWeek.forEach(day => {
      calendar.weeklySchedule.push({
        day,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        category: getRandomCategoryByWeight(contentMix),
        time: getOptimalPostingTime(day)
      });
    });
  } else if (postingFrequency === '2-3 times per week') {
    const selectedDays = daysOfWeek.sort(() => 0.5 - Math.random()).slice(0, 3);
    selectedDays.forEach(day => {
      calendar.weeklySchedule.push({
        day,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        category: getRandomCategoryByWeight(contentMix),
        time: getOptimalPostingTime(day)
      });
    });
  } else {
    const selectedDays = daysOfWeek.sort(() => 0.5 - Math.random()).slice(0, 4);
    selectedDays.forEach(day => {
      calendar.weeklySchedule.push({
        day,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        category: getRandomCategoryByWeight(contentMix),
        time: getOptimalPostingTime(day)
      });
    });
  }

  // Generate content themes
  calendar.contentThemes = contentStrategy.primaryContentThemes.slice(0, 5);

  // Generate platform strategy
  calendar.platformStrategy = platforms.map(platform => ({
    platform,
    focus: getPlatformFocus(platform, businessProfile.businessType),
    contentTypes: getPlatformContentTypes(platform),
    postingTimes: getPlatformPostingTimes(platform)
  }));

  // Generate engagement tactics
  calendar.engagementTactics = contentStrategy.engagementTactics.slice(0, 8);

  return calendar;
}

/**
 * Get random category based on content mix weights
 */
function getRandomCategoryByWeight(contentMix: any): string {
  const categories = Object.keys(contentMix);
  const weights = Object.values(contentMix) as number[];

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < categories.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return categories[i];
    }
  }

  return categories[0];
}

/**
 * Get optimal posting time for each day
 */
function getOptimalPostingTime(day: string): string {
  const postingTimes: Record<string, string[]> = {
    'Monday': ['9:00 AM', '12:00 PM', '5:00 PM'],
    'Tuesday': ['9:00 AM', '2:00 PM', '6:00 PM'],
    'Wednesday': ['10:00 AM', '1:00 PM', '5:00 PM'],
    'Thursday': ['9:00 AM', '3:00 PM', '7:00 PM'],
    'Friday': ['8:00 AM', '12:00 PM', '4:00 PM'],
    'Saturday': ['10:00 AM', '2:00 PM', '6:00 PM'],
    'Sunday': ['11:00 AM', '3:00 PM', '5:00 PM']
  };

  const times = postingTimes[day];
  return times[Math.floor(Math.random() * times.length)];
}

/**
 * Get platform focus based on business type
 */
function getPlatformFocus(platform: string, businessType: string): string {
  const platformFocus: Record<string, Record<string, string>> = {
    'Instagram': {
      'restaurant': 'Visual food content and behind-the-scenes',
      'retail': 'Product showcases and lifestyle content',
      'default': 'Visual storytelling and brand awareness'
    },
    'Facebook': {
      'restaurant': 'Community engagement and local events',
      'retail': 'Customer service and community building',
      'default': 'Community engagement and local presence'
    },
    'LinkedIn': {
      'default': 'Professional expertise and industry insights'
    },
    'Twitter': {
      'default': 'Real-time updates and customer service'
    }
  };

  return platformFocus[platform]?.[businessType] || platformFocus[platform]?.['default'] || 'General business content';
}

/**
 * Get platform content types
 */
function getPlatformContentTypes(platform: string): string[] {
  const contentTypes: Record<string, string[]> = {
    'Instagram': ['Posts', 'Stories', 'Reels', 'IGTV'],
    'Facebook': ['Posts', 'Stories', 'Live Videos', 'Events'],
    'LinkedIn': ['Posts', 'Articles', 'Company Updates'],
    'Twitter': ['Tweets', 'Threads', 'Spaces']
  };

  return contentTypes[platform] || ['Posts'];
}

/**
 * Get platform posting times
 */
function getPlatformPostingTimes(platform: string): string[] {
  const postingTimes: Record<string, string[]> = {
    'Instagram': ['9:00 AM', '12:00 PM', '5:00 PM', '8:00 PM'],
    'Facebook': ['8:00 AM', '1:00 PM', '3:00 PM', '7:00 PM'],
    'LinkedIn': ['8:00 AM', '12:00 PM', '5:00 PM'],
    'Twitter': ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM']
  };

  return postingTimes[platform] || ['9:00 AM', '5:00 PM'];
}

/**
 * Validate business profile
 */
function validateBusinessProfile(businessProfile: any): string | null {
  const requiredFields = [
    'businessName',
    'businessType',
    'industry',
    'location',
    'city',
    'country',
    'description',
    'targetAudience',
    'services',
    'brandColors',
    'visualStyle'
  ];

  for (const field of requiredFields) {
    if (!businessProfile[field]) {
      return `Missing required field: ${field}`;
    }
  }

  return null;
}

/**
 * GET method for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Social Media Expert System is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/social-media-expert': 'Main endpoint for social media expertise',
      'GET /api/social-media-expert': 'Health check and system info'
    },
    supportedActions: [
      'analyze',
      'generate-posts',
      'generate-strategy',
      'generate-calendar',
      'complete-package'
    ]
  });
}
