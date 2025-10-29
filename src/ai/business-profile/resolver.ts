/**
 * Business Profile Resolver
 * Ensures only real business data is used in content generation
 * Eliminates generic templates and random context
 */

import { createClient } from '@supabase/supabase-js';

export interface BusinessProfileSource {
  businessName: string;
  businessType: string;
  description?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  services?: Array<{
    name: string;
    description?: string;
  }>;
  keyFeatures?: string[];
  competitiveAdvantages?: string[];
  targetAudience?: string;
  brandVoice?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  logoUrl?: string;
  logoDataUrl?: string;
  designExamples?: string[];
}

export interface ResolvedBusinessProfile extends BusinessProfileSource {
  id: string;
  sources: {
    [K in keyof BusinessProfileSource]: 'db' | 'user' | 'website' | 'missing';
  };
  completeness: {
    score: number; // 0-100
    missingCritical: string[];
    missingOptional: string[];
  };
}

export interface BusinessProfileResolverOptions {
  allowExternalContext?: boolean;
  requireContacts?: boolean;
  strictValidation?: boolean;
}

export class BusinessProfileResolver {
  private supabase;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Resolve business profile from multiple sources with source tracking
   */
  async resolveProfile(
    businessId: string,
    userId: string,
    userOverrides?: Partial<BusinessProfileSource>,
    options: BusinessProfileResolverOptions = {}
  ): Promise<ResolvedBusinessProfile> {
    
    // 1. Load from Supabase
    const dbProfile = await this.loadFromDatabase(businessId, userId);
    if (!dbProfile) {
      throw new Error(`Business profile not found: ${businessId}`);
    }

    // 2. Initialize resolved profile with source tracking
    const resolved: ResolvedBusinessProfile = {
      id: businessId,
      businessName: dbProfile.business_name,
      businessType: dbProfile.business_type,
      description: dbProfile.description,
      location: dbProfile.location as any,
      contact: dbProfile.contact as any,
      services: dbProfile.services as any,
      targetAudience: dbProfile.target_audience,
      brandVoice: dbProfile.brand_voice,
      brandColors: dbProfile.brand_colors as any,
      logoUrl: dbProfile.logo_url,
      logoDataUrl: dbProfile.logo_data_url,
      designExamples: dbProfile.design_examples,
      sources: {
        businessName: 'db',
        businessType: 'db',
        description: dbProfile.description ? 'db' : 'missing',
        location: dbProfile.location ? 'db' : 'missing',
        contact: dbProfile.contact ? 'db' : 'missing',
        services: dbProfile.services ? 'db' : 'missing',
        keyFeatures: 'missing',
        competitiveAdvantages: 'missing',
        targetAudience: dbProfile.target_audience ? 'db' : 'missing',
        brandVoice: dbProfile.brand_voice ? 'db' : 'missing',
        brandColors: dbProfile.brand_colors ? 'db' : 'missing',
        logoUrl: dbProfile.logo_url ? 'db' : 'missing',
        logoDataUrl: dbProfile.logo_data_url ? 'db' : 'missing',
        designExamples: dbProfile.design_examples ? 'db' : 'missing'
      },
      completeness: { score: 0, missingCritical: [], missingOptional: [] }
    };

    // 3. Apply user overrides with source tracking
    if (userOverrides) {
      Object.keys(userOverrides).forEach(key => {
        const typedKey = key as keyof BusinessProfileSource;
        if (userOverrides[typedKey] !== undefined) {
          (resolved as any)[typedKey] = userOverrides[typedKey];
          resolved.sources[typedKey] = 'user';
        }
      });
    }

    // 4. Extract key features and competitive advantages from services/description
    if (resolved.services && resolved.services.length > 0) {
      resolved.keyFeatures = resolved.services.map(s => s.name);
      resolved.competitiveAdvantages = resolved.services
        .filter(s => s.description)
        .map(s => s.description!);
      resolved.sources.keyFeatures = 'db';
      resolved.sources.competitiveAdvantages = 'db';
    }

    // 5. Calculate completeness
    resolved.completeness = this.calculateCompleteness(resolved, options);

    return resolved;
  }

  /**
   * Load business profile from Supabase
   */
  private async loadFromDatabase(businessId: string, userId: string) {
    try {
      // Try by ID first
      let { data, error } = await this.supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', businessId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // If not found by ID, try by business name (for paya.co.ke case)
      if (error && businessId.includes('.')) {
        const businessName = businessId.split('.')[0];
        ({ data, error } = await this.supabase
          .from('brand_profiles')
          .select('*')
          .ilike('business_name', `%${businessName}%`)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single());
      }

      if (error) {
        console.error('Database query error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load business profile:', error);
      return null;
    }
  }

  /**
   * Calculate profile completeness and identify missing fields
   */
  private calculateCompleteness(
    profile: ResolvedBusinessProfile,
    options: BusinessProfileResolverOptions
  ) {
    const critical = ['businessName', 'businessType'];
    const important = ['services', 'contact', 'description'];
    const optional = ['location', 'targetAudience', 'brandColors', 'logoUrl'];

    if (options.requireContacts) {
      critical.push('contact');
    }

    const missingCritical: string[] = [];
    const missingOptional: string[] = [];

    // Check critical fields
    critical.forEach(field => {
      const typedField = field as keyof BusinessProfileSource;
      if (profile.sources[typedField] === 'missing' || !profile[typedField]) {
        missingCritical.push(field);
      }
    });

    // Check important fields
    important.forEach(field => {
      const typedField = field as keyof BusinessProfileSource;
      if (profile.sources[typedField] === 'missing' || !profile[typedField]) {
        if (!critical.includes(field)) {
          missingOptional.push(field);
        }
      }
    });

    // Check optional fields
    optional.forEach(field => {
      const typedField = field as keyof BusinessProfileSource;
      if (profile.sources[typedField] === 'missing' || !profile[typedField]) {
        missingOptional.push(field);
      }
    });

    // Calculate score
    const totalFields = critical.length + important.length + optional.length;
    const presentFields = totalFields - missingCritical.length - missingOptional.length;
    const score = Math.round((presentFields / totalFields) * 100);

    return {
      score,
      missingCritical,
      missingOptional
    };
  }

  /**
   * Validate if profile is ready for content generation
   */
  validateForGeneration(
    profile: ResolvedBusinessProfile,
    options: BusinessProfileResolverOptions = {}
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Critical field validation
    if (profile.completeness.missingCritical.length > 0) {
      errors.push(`Missing critical fields: ${profile.completeness.missingCritical.join(', ')}`);
    }

    // Services validation
    if (!profile.services || profile.services.length === 0) {
      errors.push('At least one service must be defined');
    }

    // Contact validation (if required)
    if (options.requireContacts && (!profile.contact || 
        (!profile.contact.phone && !profile.contact.email && !profile.contact.website))) {
      errors.push('At least one contact method (phone, email, or website) is required');
    }

    // Strict validation
    if (options.strictValidation && profile.completeness.score < 70) {
      errors.push(`Profile completeness too low: ${profile.completeness.score}% (minimum 70% required)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get a sample business profile for testing (paya.co.ke)
   * Based on REAL data from their website - no assumptions or hallucinations
   */
  static getSampleProfile(): BusinessProfileSource {
    return {
      businessName: 'Paya',
      businessType: 'Financial Technology (Fintech)',
      description: 'Digital financial services platform bringing financial inclusivity to all citizens across Kenya. Groundbreaking financial technology software with universally accessible banking services.',
      location: {
        country: 'KE'
      },
      contact: {
        website: 'https://paya.co.ke',
        email: 'support@paya.co.ke'
      },
      services: [
        {
          name: 'Digital Banking',
          description: 'Full suite of regulated banking products through mobile application in partnership with regulated banking partners'
        },
        {
          name: 'Payment Solutions',
          description: 'Seamless and secure payment solutions through robust APIs empowering businesses to streamline transactions'
        },
        {
          name: 'Buy Now Pay Later',
          description: 'Freedom to make purchases immediately and pay over time with easy installment plans tailored to budget. No credit checks required.'
        }
      ],
      keyFeatures: [
        'No credit checks required',
        'Quick setup - open in minutes', 
        '1M+ customers',
        'Regulated banking partnerships',
        'Mobile application',
        'API integration'
      ],
      competitiveAdvantages: [
        'Financial inclusivity mission',
        'Universally accessible banking',
        'Quick setup process',
        'No credit check requirement',
        'Trusted by 1M+ customers'
      ],
      targetAudience: 'Consumers and businesses across Kenya',
      brandColors: {
        primary: '#E4574C',
        secondary: '#2A2A2A'
      }
    };
  }
}
