/**
 * Database Health Check for Revo 1.0
 * Validates Supabase connections and data integrity
 */

import { createClient } from '@supabase/supabase-js';

export interface DatabaseHealthReport {
  supabaseConnection: boolean;
  brandProfilesTable: boolean;
  scheduledContentTable: boolean;
  sampleDataAvailable: boolean;
  errors: string[];
  recommendations: string[];
}

export class DatabaseHealthChecker {
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
   * Comprehensive database health check
   */
  async checkHealth(): Promise<DatabaseHealthReport> {
    const report: DatabaseHealthReport = {
      supabaseConnection: false,
      brandProfilesTable: false,
      scheduledContentTable: false,
      sampleDataAvailable: false,
      errors: [],
      recommendations: []
    };

    try {
      // 1. Test Supabase connection
      const { data, error } = await this.supabase.from('brand_profiles').select('count').limit(1);
      if (!error) {
        report.supabaseConnection = true;
        report.brandProfilesTable = true;
      } else {
        report.errors.push(`Supabase connection failed: ${error.message}`);
      }

      // 2. Test scheduled_content table
      const { data: scheduleData, error: scheduleError } = await this.supabase
        .from('scheduled_content')
        .select('count')
        .limit(1);
      
      if (!scheduleError) {
        report.scheduledContentTable = true;
      } else {
        report.errors.push(`Scheduled content table error: ${scheduleError.message}`);
      }

      // 3. Check for sample data (Paya profile)
      const { data: payaData, error: payaError } = await this.supabase
        .from('brand_profiles')
        .select('*')
        .ilike('business_name', '%paya%')
        .limit(1);

      if (!payaError && payaData && payaData.length > 0) {
        report.sampleDataAvailable = true;
      } else {
        report.recommendations.push('Consider adding Paya.co.ke sample profile for testing');
      }

      // 4. Generate recommendations
      if (!report.supabaseConnection) {
        report.recommendations.push('Check Supabase environment variables');
        report.recommendations.push('Verify Supabase project is active');
      }

      if (!report.scheduledContentTable) {
        report.recommendations.push('Run database migration: database-schema.sql');
      }

      if (report.errors.length === 0) {
        report.recommendations.push('Database is healthy - ready for Revo 1.0 generation');
      }

    } catch (error) {
      report.errors.push(`Health check failed: ${error}`);
    }

    return report;
  }

  /**
   * Test calendar integration specifically
   */
  async testCalendarIntegration(brandId: string): Promise<{
    success: boolean;
    todaysServices: number;
    totalScheduled: number;
    errors: string[];
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Test today's services
      const { data: todayData, error: todayError } = await this.supabase
        .from('scheduled_content')
        .select('*')
        .eq('brand_id', brandId)
        .eq('date', today)
        .eq('status', 'scheduled');

      // Test all scheduled services
      const { data: allData, error: allError } = await this.supabase
        .from('scheduled_content')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'scheduled');

      const errors: string[] = [];
      if (todayError) errors.push(`Today's services error: ${todayError.message}`);
      if (allError) errors.push(`All services error: ${allError.message}`);

      return {
        success: errors.length === 0,
        todaysServices: todayData?.length || 0,
        totalScheduled: allData?.length || 0,
        errors
      };

    } catch (error) {
      return {
        success: false,
        todaysServices: 0,
        totalScheduled: 0,
        errors: [`Calendar integration test failed: ${error}`]
      };
    }
  }

  /**
   * Create sample calendar data for testing
   */
  async createSampleCalendarData(brandId: string): Promise<boolean> {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sampleData = [
        {
          brand_id: brandId,
          service_name: 'Merchant Float',
          date: today.toISOString().split('T')[0],
          content_type: 'post',
          platform: 'Instagram',
          notes: 'Working capital for Kenyan SMEs - quick disbursement',
          status: 'scheduled'
        },
        {
          brand_id: brandId,
          service_name: 'Fast Disbursement',
          date: tomorrow.toISOString().split('T')[0],
          content_type: 'story',
          platform: 'Facebook',
          notes: 'M-Pesa integration for instant payments',
          status: 'scheduled'
        }
      ];

      const { error } = await this.supabase
        .from('scheduled_content')
        .insert(sampleData);

      return !error;
    } catch (error) {
      console.error('Failed to create sample calendar data:', error);
      return false;
    }
  }
}
