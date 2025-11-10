/**
 * Calendar Service - Utility functions for accessing scheduled content
 * Provides easy access to calendar data for AI generation systems
 */

// Database-only calendar service - no localStorage dependency

export interface ScheduledContent {
  id: string;
  date: string;
  serviceId: string;
  serviceName: string;
  contentType: 'post' | 'story' | 'reel' | 'ad';
  platform: 'All' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';
  notes?: string;
  status: 'scheduled' | 'generated' | 'published';
}

export interface ScheduledService {
  serviceId: string;
  serviceName: string;
  description?: string;
  contentType: string;
  platform: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  scheduledTime?: string;
  isToday?: boolean;
  isUpcoming?: boolean;
  daysUntil?: number;
}

export interface CalendarContext {
  todaysServices: ScheduledService[];
  upcomingServices: ScheduledService[];
  totalScheduledItems: number;
  priorityServices: ScheduledService[];
  platformDistribution: Record<string, number>;
  serviceTypes: string[];
  hasScheduledContent: boolean;
}

export class CalendarService {
  /**
   * Get today's scheduled services for a brand from database
   */
  static async getTodaysScheduledServices(brandId: string): Promise<ScheduledService[]> {
    try {
      // Validate brandId before making API call
      if (!brandId || brandId === 'undefined' || brandId === 'null') {
        console.warn('⚠️ [Calendar Service] Invalid brandId provided:', brandId);
        return [];
      }

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const response = await fetch(`/api/calendar?brandId=${encodeURIComponent(brandId)}&date=${today}`);
      if (!response.ok) {
        console.warn('⚠️ [Calendar Service] API returned error:', response.status, response.statusText);
        return [];
      }
      
      const allScheduledContent = await response.json();

      const transformedServices = this.transformDatabaseToScheduledServices(allScheduledContent, true);

      return transformedServices;
    } catch (error) {
      console.error('❌ [Calendar Service] Error fetching today\'s scheduled services:', error);
      // Database-only mode - never fallback to localStorage
      return [];
    }
  }

  /**
   * Get upcoming scheduled services (next 7 days) from database
   */
  static async getUpcomingScheduledServices(brandId: string, days: number = 7): Promise<ScheduledService[]> {
    try {
      // Validate brandId before making API call
      if (!brandId || brandId === 'undefined' || brandId === 'null') {
        console.warn('⚠️ [Calendar Service] Invalid brandId provided:', brandId);
        return [];
      }

      const response = await fetch(`/api/calendar?brandId=${encodeURIComponent(brandId)}`);
      if (!response.ok) {
        console.warn('⚠️ [Calendar Service] API returned error:', response.status, response.statusText);
        return [];
      }
      
      const allScheduledContent = await response.json();
      const today = new Date();
      const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));

      const upcomingContent = allScheduledContent.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate > today && itemDate <= futureDate && item.status === 'scheduled';
      });

      return this.transformDatabaseToScheduledServices(upcomingContent, false, true);
    } catch (error) {
      console.error('❌ [Calendar Service] Error fetching upcoming scheduled services:', error);
      return [];
    }
  }

  /**
   * Get comprehensive calendar context for AI generation
   */
  static async getCalendarContext(brandId: string): Promise<CalendarContext> {
    try {
      // Validate brandId before making API calls
      if (!brandId || brandId === 'undefined' || brandId === 'null') {
        console.warn('⚠️ [Calendar Service] Invalid brandId provided to getCalendarContext:', brandId);
        return {
          todaysServices: [],
          upcomingServices: [],
          totalScheduledItems: 0,
          priorityServices: [],
          platformDistribution: {},
          serviceTypes: [],
          hasScheduledContent: false
        };
      }

      const [todaysServices, upcomingServices] = await Promise.all([
        this.getTodaysScheduledServices(brandId),
        this.getUpcomingScheduledServices(brandId)
      ]);

      const allServices = [...todaysServices, ...upcomingServices];
      const priorityServices = allServices.filter(service => service.priority === 'high');

      // Calculate platform distribution
      const platformDistribution = allServices.reduce((acc, service) => {
        const platform = service.platform;
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get unique service types
      const serviceTypes = [...new Set(allServices.map(service => service.serviceName))];

      return {
        todaysServices,
        upcomingServices,
        totalScheduledItems: allServices.length,
        priorityServices,
        platformDistribution,
        serviceTypes,
        hasScheduledContent: allServices.length > 0
      };
    } catch (error) {
      console.error('Error getting calendar context:', error);
      return {
        todaysServices: [],
        upcomingServices: [],
        totalScheduledItems: 0,
        priorityServices: [],
        platformDistribution: {},
        serviceTypes: [],
        hasScheduledContent: false
      };
    }
  }

  /**
   * Get scheduled services for a specific date from database
   */
  static async getScheduledServicesForDate(brandId: string, date: string): Promise<ScheduledService[]> {
    try {
      // Validate brandId before making API call
      if (!brandId || brandId === 'undefined' || brandId === 'null') {
        console.warn('⚠️ [Calendar Service] Invalid brandId provided:', brandId);
        return [];
      }

      const response = await fetch(`/api/calendar?brandId=${encodeURIComponent(brandId)}&date=${date}`);
      if (!response.ok) {
        console.warn('⚠️ [Calendar Service] API returned error:', response.status, response.statusText);
        return [];
      }
      
      const dateContent = await response.json();
      return this.transformDatabaseToScheduledServices(dateContent);
    } catch (error) {
      console.error('❌ [Calendar Service] Error fetching scheduled services for date:', error);
      return [];
    }
  }

  /**
   * Mark scheduled content as generated in database
   */
  static async markAsGenerated(brandId: string, contentId: string, generatedPostId?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contentId,
          status: 'generated',
          generatedPostId
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking content as generated:', error);
      return false;
    }
  }

  /**
   * Get priority services for immediate content generation
   */
  static async getPriorityServices(brandId: string): Promise<ScheduledService[]> {
    const context = await this.getCalendarContext(brandId);
    return context.priorityServices;
  }

  /**
   * Check if there are services scheduled for today
   */
  static async hasTodaysServices(brandId: string): Promise<boolean> {
    const todaysServices = await this.getTodaysScheduledServices(brandId);
    return todaysServices.length > 0;
  }

  /**
   * Transform database records to ScheduledService format
   */
  private static transformDatabaseToScheduledServices(
    content: any[],
    isToday: boolean = false,
    isUpcoming: boolean = false
  ): ScheduledService[] {
    const today = new Date();

    return content.map(item => {
      const itemDate = new Date(item.date);
      const daysUntil = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        serviceId: item.id.toString(),
        serviceName: item.service_name,
        description: item.notes,
        contentType: item.content_type,
        platform: item.platform,
        notes: item.notes,
        priority: this.determineDatabasePriority(item),
        scheduledTime: item.date,
        isToday,
        isUpcoming,
        daysUntil: daysUntil > 0 ? daysUntil : 0
      };
    });
  }

  /**
   * Transform ScheduledContent to ScheduledService format (legacy)
   */
  private static transformToScheduledServices(
    content: ScheduledContent[],
    isToday: boolean = false,
    isUpcoming: boolean = false
  ): ScheduledService[] {
    const today = new Date();

    return content.map(item => {
      const itemDate = new Date(item.date);
      const daysUntil = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        description: item.notes,
        contentType: item.contentType,
        platform: item.platform,
        notes: item.notes,
        priority: this.determinePriority(item),
        scheduledTime: item.date,
        isToday,
        isUpcoming,
        daysUntil: daysUntil > 0 ? daysUntil : 0
      };
    });
  }

  /**
   * Determine priority based on database content characteristics
   */
  private static determineDatabasePriority(item: any): 'low' | 'medium' | 'high' {
    // High priority for posts and ads
    if (item.content_type === 'post' || item.content_type === 'ad') {
      return 'high';
    }

    // Medium priority for reels
    if (item.content_type === 'reel') {
      return 'medium';
    }

    // Low priority for stories (temporary content)
    return 'low';
  }

  /**
   * Determine priority based on content characteristics (legacy)
   */
  private static determinePriority(item: ScheduledContent): 'low' | 'medium' | 'high' {
    // High priority for posts and ads
    if (item.contentType === 'post' || item.contentType === 'ad') {
      return 'high';
    }

    // Medium priority for reels
    if (item.contentType === 'reel') {
      return 'medium';
    }

    // Low priority for stories (temporary content)
    return 'low';
  }

  /**
   * Get services summary for AI context
   */
  static async getServicesContextSummary(brandId: string): Promise<string> {
    const context = await this.getCalendarContext(brandId);

    if (!context.hasScheduledContent) {
      return "No services are currently scheduled.";
    }

    const todayCount = context.todaysServices.length;
    const upcomingCount = context.upcomingServices.length;
    const serviceNames = context.serviceTypes.slice(0, 5).join(', ');

    let summary = '';

    if (todayCount > 0) {
      summary += `Today: ${todayCount} scheduled service${todayCount > 1 ? 's' : ''} (${context.todaysServices.map(s => s.serviceName).join(', ')}). `;
    }

    if (upcomingCount > 0) {
      summary += `Upcoming: ${upcomingCount} service${upcomingCount > 1 ? 's' : ''} in the next week. `;
    }

    if (serviceNames) {
      summary += `Key services: ${serviceNames}.`;
    }

    return summary.trim();
  }

  /**
   * Get content strategy based on scheduled services
   */
  static getContentStrategy(services: ScheduledService[]): {
    primaryFocus: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    contentType: 'promotional' | 'informational' | 'engagement';
    suggestedCTA: string;
  } {
    if (services.length === 0) {
      return {
        primaryFocus: 'general brand awareness',
        urgencyLevel: 'low',
        contentType: 'engagement',
        suggestedCTA: 'Learn more about our services'
      };
    }

    // Check for today's high-priority services
    const todaysHighPriority = services.filter(s => s.isToday && s.priority === 'high');
    if (todaysHighPriority.length > 0) {
      return {
        primaryFocus: todaysHighPriority[0].serviceName,
        urgencyLevel: 'high',
        contentType: 'promotional',
        suggestedCTA: 'Book now - limited spots available!'
      };
    }

    // Check for today's services
    const todaysServices = services.filter(s => s.isToday);
    if (todaysServices.length > 0) {
      return {
        primaryFocus: todaysServices[0].serviceName,
        urgencyLevel: 'medium',
        contentType: 'promotional',
        suggestedCTA: 'Join us today!'
      };
    }

    // Check for upcoming services
    const upcomingServices = services.filter(s => s.isUpcoming);
    if (upcomingServices.length > 0) {
      const nextService = upcomingServices.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0))[0];
      return {
        primaryFocus: nextService.serviceName,
        urgencyLevel: 'medium',
        contentType: 'informational',
        suggestedCTA: `Save the date - ${nextService.daysUntil} day${nextService.daysUntil !== 1 ? 's' : ''} to go!`
      };
    }

    return {
      primaryFocus: 'general services',
      urgencyLevel: 'low',
      contentType: 'engagement',
      suggestedCTA: 'Discover our services'
    };
  }

  /**
   * Generate service-specific hashtags
   */
  static generateServiceHashtags(services: ScheduledService[], businessType: string): string[] {
    const hashtags = new Set<string>();

    // Add business type hashtags
    const businessTypeTag = businessType.toLowerCase().replace(/\s+/g, '');
    hashtags.add(`#${businessTypeTag}`);

    // Add service-specific hashtags
    services.forEach(service => {
      const serviceTag = service.serviceName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '');
      if (serviceTag.length > 2) {
        hashtags.add(`#${serviceTag}`);
      }

      // Add platform-specific hashtags
      if (service.platform.toLowerCase() === 'instagram') {
        hashtags.add('#instagrampost');
      } else if (service.platform.toLowerCase() === 'facebook') {
        hashtags.add('#facebookpost');
      }
    });

    // Add timing-based hashtags
    const todaysServices = services.filter(s => s.isToday);
    if (todaysServices.length > 0) {
      hashtags.add('#today');
      hashtags.add('#now');
    }

    const upcomingServices = services.filter(s => s.isUpcoming);
    if (upcomingServices.length > 0) {
      hashtags.add('#upcoming');
      hashtags.add('#savethedate');
    }

    return Array.from(hashtags).slice(0, 10); // Limit to 10 hashtags
  }
}

export default CalendarService;
