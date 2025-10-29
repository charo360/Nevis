/**
 * Calendar Prefill Service
 * Automatically populate calendar with services for multiple days
 */

import { createClient } from '@supabase/supabase-js';

export interface ServiceTemplate {
  serviceName: string;
  contentType: 'post' | 'story' | 'reel' | 'ad';
  platform: 'All' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number; // For monthly patterns
  endDate?: string; // When to stop recurring
}

export interface PrefillOptions {
  startDate: string;
  endDate: string;
  services: ServiceTemplate[];
  pattern?: RecurringPattern;
  overwriteExisting?: boolean;
}

export class CalendarPrefillService {
  private supabase;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing for calendar prefill');
    }
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Get actual brand services from database
   */
  async getBrandServices(brandId: string): Promise<ServiceTemplate[]> {
    try {
      console.log('🔍 Fetching brand services for brandId:', brandId);
      
      const { data, error } = await this.supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', brandId)
        .single();

      console.log('📊 Brand profile data:', data);
      console.log('❌ Query error:', error);

      if (error) {
        console.error('Database error:', error);
        return [];
      }

      if (!data) {
        console.warn('No brand profile found for ID:', brandId);
        return [];
      }

      // Check different possible service field names
      let services = null;
      if (data.services) {
        services = data.services;
        console.log('✅ Found services in "services" field:', services);
      } else if (data.business_services) {
        services = data.business_services;
        console.log('✅ Found services in "business_services" field:', services);
      } else if (data.key_features) {
        services = data.key_features;
        console.log('✅ Found services in "key_features" field:', services);
      } else {
        console.warn('⚠️ No services found in any expected field');
        console.log('Available fields:', Object.keys(data));
        return [];
      }

      // Handle different service formats
      let serviceArray = [];
      if (Array.isArray(services)) {
        serviceArray = services;
      } else if (typeof services === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(services);
          if (Array.isArray(parsed)) {
            serviceArray = parsed;
            console.log('✅ Parsed services as JSON array:', serviceArray);
          } else {
            console.log('⚠️ Parsed JSON but not an array, treating as single service');
            serviceArray = [parsed];
          }
        } catch (e) {
          // If JSON parsing fails, split by newlines or commas
          console.log('⚠️ JSON parsing failed, splitting string:', e.message);
          serviceArray = services.split(/[\n,]/).map(s => s.trim()).filter(s => s);
        }
      } else {
        console.warn('Unknown services format:', typeof services, services);
        return [];
      }

      console.log('📋 Processed service array:', serviceArray);

      // Transform to service templates
      const templates = serviceArray.map((service: any, index: number) => {
        let serviceName = '';
        let serviceDesc = '';
        
        if (typeof service === 'string') {
          serviceName = service;
          serviceDesc = `Content for ${service}`;
        } else if (typeof service === 'object' && service !== null) {
          serviceName = service.name || service.title || service.serviceName || 'Unknown Service';
          serviceDesc = service.description || `Content for ${serviceName}`;
        } else {
          serviceName = 'Unknown Service';
          serviceDesc = 'Content for unknown service';
        }
        
        console.log(`🏷️ Service ${index + 1}: "${serviceName}" - ${serviceDesc.substring(0, 50)}...`);
        
        return {
          serviceName: serviceName,
          contentType: ['post', 'story', 'reel'][index % 3] as any,
          platform: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter'][index % 4] as any,
          notes: serviceDesc,
          priority: index === 0 ? 'high' : (index === 1 ? 'medium' : 'low') as any
        };
      });

      console.log('✅ Generated service templates:', templates);
      return templates;

    } catch (error) {
      console.error('Failed to get brand services:', error);
      return [];
    }
  }

  /**
   * Prefill calendar with services for a date range
   */
  async prefillCalendar(brandId: string, options: PrefillOptions): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      created: 0,
      skipped: 0,
      errors: []
    };

    try {
      const dates = this.generateDateRange(options.startDate, options.endDate);
      const servicesToCreate: any[] = [];

      for (const date of dates) {
        // Check if we should add services for this date based on pattern
        if (options.pattern && !this.shouldAddForDate(date, options.pattern)) {
          continue;
        }

        // Check if services already exist for this date
        if (!options.overwriteExisting) {
          const existing = await this.getExistingServices(brandId, date);
          if (existing.length > 0) {
            result.skipped += options.services.length;
            continue;
          }
        }

        // Add ONE random service per day instead of all services
        const randomService = options.services[Math.floor(Math.random() * options.services.length)];
        
        // Vary the content type and platform for the same service
        const contentTypes = ['post', 'story', 'reel'];
        const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter'];
        const randomContentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
        
        servicesToCreate.push({
          brand_id: brandId,
          service_name: randomService.serviceName,
          date: date,
          content_type: randomContentType,
          platform: randomPlatform,
          notes: randomService.notes || `Auto-generated for ${randomService.serviceName}`,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        console.log(`📅 ${date}: Selected "${randomService.serviceName}" (${randomPlatform} ${randomContentType})`);
      }

      // Bulk insert services
      if (servicesToCreate.length > 0) {
        // Delete existing if overwrite is enabled
        if (options.overwriteExisting) {
          await this.deleteExistingServices(brandId, options.startDate, options.endDate);
        }

        const { data, error } = await this.supabase
          .from('scheduled_content')
          .insert(servicesToCreate);

        if (error) {
          result.errors.push(`Database insert error: ${error.message}`);
          return result;
        }

        result.created = servicesToCreate.length;
      }

      result.success = true;
      return result;

    } catch (error) {
      result.errors.push(`Prefill failed: ${error}`);
      return result;
    }
  }

  /**
   * Create predefined service templates for different business types
   */
  static getServiceTemplates(businessType: string): ServiceTemplate[] {
    console.log('⚠️ WARNING: Using generic templates for businessType:', businessType);
    console.log('🚨 This should NOT happen if brand services are working correctly!');
    
    const templates: Record<string, ServiceTemplate[]> = {
      'financial': [
        {
          serviceName: 'Merchant Float',
          contentType: 'post',
          platform: 'Instagram',
          notes: 'Working capital for SMEs',
          priority: 'high'
        },
        {
          serviceName: 'Fast Disbursement',
          contentType: 'story',
          platform: 'Facebook',
          notes: 'Quick payment processing',
          priority: 'medium'
        },
        {
          serviceName: 'Buy Now Pay Later',
          contentType: 'reel',
          platform: 'Instagram',
          notes: 'Flexible payment options',
          priority: 'high'
        }
      ],
      'technology': [
        {
          serviceName: 'Software Development',
          contentType: 'post',
          platform: 'LinkedIn',
          notes: 'Custom software solutions',
          priority: 'high'
        },
        {
          serviceName: 'API Integration',
          contentType: 'post',
          platform: 'Twitter',
          notes: 'Seamless system integration',
          priority: 'medium'
        },
        {
          serviceName: 'Tech Consulting',
          contentType: 'story',
          platform: 'LinkedIn',
          notes: 'Expert technology advice',
          priority: 'medium'
        }
      ],
      'restaurant': [
        {
          serviceName: 'Daily Special',
          contentType: 'post',
          platform: 'Instagram',
          notes: 'Today\'s featured dish',
          priority: 'high'
        },
        {
          serviceName: 'Happy Hour',
          contentType: 'story',
          platform: 'Facebook',
          notes: 'Special drink prices',
          priority: 'medium'
        },
        {
          serviceName: 'Weekend Brunch',
          contentType: 'reel',
          platform: 'Instagram',
          notes: 'Weekend brunch menu',
          priority: 'high'
        }
      ],
      'retail': [
        {
          serviceName: 'New Arrivals',
          contentType: 'post',
          platform: 'Instagram',
          notes: 'Latest product showcase',
          priority: 'high'
        },
        {
          serviceName: 'Flash Sale',
          contentType: 'story',
          platform: 'Facebook',
          notes: 'Limited time offers',
          priority: 'high'
        },
        {
          serviceName: 'Customer Spotlight',
          contentType: 'post',
          platform: 'All',
          notes: 'Feature satisfied customers',
          priority: 'medium'
        }
      ],
      'default': [
        {
          serviceName: 'Daily Service Highlight',
          contentType: 'post',
          platform: 'All',
          notes: 'Showcase main service',
          priority: 'high'
        },
        {
          serviceName: 'Customer Testimonial',
          contentType: 'story',
          platform: 'Instagram',
          notes: 'Share customer feedback',
          priority: 'medium'
        },
        {
          serviceName: 'Behind the Scenes',
          contentType: 'reel',
          platform: 'Instagram',
          notes: 'Show business operations',
          priority: 'low'
        }
      ]
    };

    const businessKey = businessType.toLowerCase();
    return templates[businessKey] || templates['default'];
  }

  /**
   * Generate array of dates between start and end
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  /**
   * Check if services should be added for a specific date based on pattern
   */
  private shouldAddForDate(date: string, pattern: RecurringPattern): boolean {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayOfMonth = dateObj.getDate();

    switch (pattern.frequency) {
      case 'daily':
        return true;
      
      case 'weekly':
        return pattern.daysOfWeek ? pattern.daysOfWeek.includes(dayOfWeek) : true;
      
      case 'monthly':
        return pattern.dayOfMonth ? dayOfMonth === pattern.dayOfMonth : true;
      
      default:
        return true;
    }
  }

  /**
   * Get existing services for a date
   */
  private async getExistingServices(brandId: string, date: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('scheduled_content')
      .select('*')
      .eq('brand_id', brandId)
      .eq('date', date);

    return data || [];
  }

  /**
   * Delete existing services in date range
   */
  private async deleteExistingServices(brandId: string, startDate: string, endDate: string) {
    const { error } = await this.supabase
      .from('scheduled_content')
      .delete()
      .eq('brand_id', brandId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      throw new Error(`Failed to delete existing services: ${error.message}`);
    }
  }

  /**
   * Quick prefill for next 30 days with actual brand services
   */
  async quickPrefill30Days(brandId: string, businessType: string): Promise<{
    success: boolean;
    created: number;
    message: string;
  }> {
    console.log('🚀 Starting quick prefill for brandId:', brandId, 'businessType:', businessType);
    
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    // Get actual brand services instead of generic templates
    console.log('📋 Fetching brand services...');
    const brandServices = await this.getBrandServices(brandId);
    console.log('📊 Brand services found:', brandServices.length);
    
    // If no brand services found, fall back to business type templates
    const services = brandServices.length > 0 
      ? brandServices 
      : CalendarPrefillService.getServiceTemplates(businessType);
    
    console.log('🎯 Using services:', services.length > 0 ? services.map(s => s.serviceName) : 'none');
    console.log('📦 Service source:', brandServices.length > 0 ? 'BRAND SERVICES' : 'GENERIC TEMPLATES');
    
    if (brandServices.length === 0) {
      console.warn('⚠️ No brand services found! Using generic templates as fallback');
      console.log('🔍 Generic templates:', CalendarPrefillService.getServiceTemplates(businessType).map(s => s.serviceName));
    }
    
    const result = await this.prefillCalendar(brandId, {
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      services: services,
      pattern: {
        frequency: 'daily'
      },
      overwriteExisting: false
    });

    const serviceSource = brandServices.length > 0 ? 'your brand services' : 'business type templates';
    
    console.log('✅ Prefill result:', result);
    
    return {
      success: result.success,
      created: result.created,
      message: result.success 
        ? `Successfully created ${result.created} scheduled services using ${serviceSource} for the next 30 days`
        : `Failed to prefill calendar: ${result.errors.join(', ')}`
    };
  }
}
