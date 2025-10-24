import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar-service';

export async function POST(request: NextRequest) {
  try {
    const { brandId } = await request.json();
    
    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    
    // Force fresh retrieval of today's services
    const todaysServices = await CalendarService.getTodaysScheduledServices(brandId);
    const upcomingServices = await CalendarService.getUpcomingScheduledServices(brandId);
    
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      todaysServices,
      upcomingServices,
      totalServices: todaysServices.length + upcomingServices.length
    });
    
  } catch (error) {
    console.error('❌ [RefreshCalendar] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh calendar data' },
      { status: 500 }
    );
  }
}