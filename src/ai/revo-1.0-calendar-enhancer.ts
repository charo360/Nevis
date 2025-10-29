/**
 * Revo 1.0 Calendar Enhancement
 * Automatically integrates today's services into content generation
 */

import { CalendarService, type ScheduledService } from '@/services/calendar-service';
import type { BrandProfile } from '@/lib/types';

export interface CalendarEnhancedContext {
  todaysServices: ScheduledService[];
  primaryService?: ScheduledService;
  serviceCategory: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  contentStrategy: {
    focus: string;
    tone: string;
    cta: string;
  };
}

export class Revo10CalendarEnhancer {
  /**
   * Get enhanced calendar context for Revo 1.0 generation
   */
  static async getEnhancedCalendarContext(
    brandId: string,
    brandProfile: BrandProfile
  ): Promise<CalendarEnhancedContext> {
    try {
      // Get today's scheduled services
      const todaysServices = await CalendarService.getTodaysScheduledServices(brandId);
      
      // Determine primary service (highest priority or first)
      const primaryService = todaysServices.find(s => s.priority === 'high') || todaysServices[0];
      
      // Categorize service type
      const serviceCategory = this.categorizeService(primaryService?.serviceName || '');
      
      // Determine urgency based on calendar data
      const urgencyLevel = this.calculateUrgency(todaysServices);
      
      // Generate content strategy
      const contentStrategy = this.generateContentStrategy(primaryService, brandProfile);
      
      return {
        todaysServices,
        primaryService,
        serviceCategory,
        urgencyLevel,
        contentStrategy
      };
    } catch (error) {
      console.error('Calendar enhancement failed:', error);
      return {
        todaysServices: [],
        serviceCategory: 'general',
        urgencyLevel: 'low',
        contentStrategy: {
          focus: 'brand awareness',
          tone: 'professional',
          cta: 'Learn more about our services'
        }
      };
    }
  }

  /**
   * Categorize service based on name and description
   */
  private static categorizeService(serviceName: string): string {
    const service = serviceName.toLowerCase();
    
    // Financial services
    if (service.includes('loan') || service.includes('payment') || 
        service.includes('banking') || service.includes('finance') ||
        service.includes('merchant') || service.includes('float')) {
      return 'financial';
    }
    
    // Technology services
    if (service.includes('software') || service.includes('api') ||
        service.includes('platform') || service.includes('tech')) {
      return 'technology';
    }
    
    // Consultation services
    if (service.includes('consultation') || service.includes('advisory') ||
        service.includes('consulting') || service.includes('strategy')) {
      return 'consultation';
    }
    
    // Training/Education
    if (service.includes('training') || service.includes('workshop') ||
        service.includes('education') || service.includes('course')) {
      return 'education';
    }
    
    return 'general';
  }

  /**
   * Calculate urgency based on scheduled services
   */
  private static calculateUrgency(services: ScheduledService[]): 'low' | 'medium' | 'high' {
    if (services.length === 0) return 'low';
    
    // High urgency if any high-priority services today
    if (services.some(s => s.priority === 'high' && s.isToday)) {
      return 'high';
    }
    
    // Medium urgency if services scheduled for today
    if (services.some(s => s.isToday)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Generate content strategy based on primary service
   */
  private static generateContentStrategy(
    primaryService?: ScheduledService,
    brandProfile?: BrandProfile
  ) {
    if (!primaryService) {
      return {
        focus: 'brand awareness',
        tone: 'professional',
        cta: 'Discover our services'
      };
    }

    const serviceName = primaryService.serviceName.toLowerCase();
    
    // Financial services strategy
    if (serviceName.includes('loan') || serviceName.includes('payment') || 
        serviceName.includes('merchant') || serviceName.includes('float')) {
      return {
        focus: `${primaryService.serviceName} for ${brandProfile?.location || 'businesses'}`,
        tone: 'trustworthy and professional',
        cta: 'Apply now - Quick approval process'
      };
    }
    
    // Technology services strategy
    if (serviceName.includes('software') || serviceName.includes('api') ||
        serviceName.includes('platform')) {
      return {
        focus: `${primaryService.serviceName} solutions`,
        tone: 'innovative and technical',
        cta: 'Get started today - Free trial available'
      };
    }
    
    // Default strategy
    return {
      focus: primaryService.serviceName,
      tone: 'engaging and professional',
      cta: `Book your ${primaryService.serviceName} today`
    };
  }

  /**
   * Generate service-specific headlines
   */
  static generateServiceHeadline(
    context: CalendarEnhancedContext,
    businessName: string
  ): string {
    const { primaryService, serviceCategory, urgencyLevel } = context;
    
    if (!primaryService) {
      return `${businessName} - Your Trusted Partner`;
    }

    const urgencyWords = {
      high: ['Today Only', 'Limited Time', 'Act Fast'],
      medium: ['Available Now', 'This Week', 'Don\'t Miss'],
      low: ['Discover', 'Explore', 'Learn About']
    };

    const urgencyWord = urgencyWords[urgencyLevel][
      Math.floor(Math.random() * urgencyWords[urgencyLevel].length)
    ];

    return `${urgencyWord}: ${primaryService.serviceName} by ${businessName}`;
  }

  /**
   * Generate service-specific captions
   */
  static generateServiceCaption(
    context: CalendarEnhancedContext,
    businessName: string,
    businessType: string
  ): string {
    const { primaryService, contentStrategy } = context;
    
    if (!primaryService) {
      return `${businessName} provides quality ${businessType.toLowerCase()} services. ${contentStrategy.cta}`;
    }

    const description = primaryService.description || primaryService.serviceName;
    
    return `${description} 

🎯 ${contentStrategy.focus}
✨ Trusted by thousands of customers
📞 ${contentStrategy.cta}

#${businessName.replace(/\s+/g, '')} #${primaryService.serviceName.replace(/\s+/g, '')}`;
  }
}
