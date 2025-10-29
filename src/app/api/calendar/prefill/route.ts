import { NextRequest, NextResponse } from 'next/server';
import { CalendarPrefillService } from '@/services/calendar-prefill-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      brandId, 
      businessType, 
      startDate, 
      endDate, 
      services, 
      pattern, 
      overwriteExisting = false,
      quickPrefill = false 
    } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    const prefillService = new CalendarPrefillService();

    // Quick prefill for 30 days
    if (quickPrefill) {
      if (!businessType) {
        return NextResponse.json(
          { error: 'Business type is required for quick prefill' },
          { status: 400 }
        );
      }

      console.log('🚀 API: Starting quick prefill for brandId:', brandId, 'businessType:', businessType);
      
      // Test if we can fetch brand services in API context
      try {
        const testServices = await prefillService.getBrandServices(brandId);
        console.log('🧪 API: Test brand services fetch result:', testServices.length, 'services found');
        if (testServices.length > 0) {
          console.log('✅ API: Brand services found:', testServices.map(s => s.serviceName));
        } else {
          console.warn('⚠️ API: No brand services found, will use generic templates');
        }
      } catch (error) {
        console.error('❌ API: Error testing brand services fetch:', error);
      }

      const result = await prefillService.quickPrefill30Days(brandId, businessType);
      console.log('📊 API: Quick prefill result:', result);
      return NextResponse.json(result);
    }

    // Custom prefill
    console.log('🎯 API: Using custom prefill path');
    console.log('📊 API: Received services:', services?.length || 0, 'services');
    if (services && services.length > 0) {
      console.log('✅ API: Service names:', services.map((s: any) => s.serviceName || s.name));
    }
    
    if (!startDate || !endDate || !services) {
      return NextResponse.json(
        { error: 'Start date, end date, and services are required for custom prefill' },
        { status: 400 }
      );
    }

    const result = await prefillService.prefillCalendar(brandId, {
      startDate,
      endDate,
      services,
      pattern,
      overwriteExisting
    });

    return NextResponse.json({
      success: result.success,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
      message: result.success 
        ? `Successfully created ${result.created} scheduled services${result.skipped > 0 ? ` (skipped ${result.skipped} existing)` : ''}`
        : `Failed to prefill calendar: ${result.errors.join(', ')}`
    });

  } catch (error) {
    console.error('Calendar prefill error:', error);
    return NextResponse.json(
      { error: 'Failed to prefill calendar' },
      { status: 500 }
    );
  }
}

// Get available service templates (actual brand services + fallback templates)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('businessType') || 'default';
    const brandId = searchParams.get('brandId');

    const prefillService = new CalendarPrefillService();
    let templates = [];

    // Try to get actual brand services first
    if (brandId) {
      const brandServices = await prefillService.getBrandServices(brandId);
      if (brandServices.length > 0) {
        templates = brandServices;
      }
    }

    // Fallback to business type templates if no brand services
    if (templates.length === 0) {
      templates = CalendarPrefillService.getServiceTemplates(businessType);
    }

    return NextResponse.json({
      businessType,
      templates,
      source: brandId && templates.length > 0 ? 'brand_services' : 'business_templates',
      availableBusinessTypes: ['financial', 'technology', 'restaurant', 'retail', 'default']
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to get service templates' },
      { status: 500 }
    );
  }
}
