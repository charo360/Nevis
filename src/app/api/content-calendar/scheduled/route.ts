/**
 * API endpoint for retrieving scheduled content from content calendar
 * Used by AI generation systems to access scheduled services for specific dates
 */

import { NextRequest, NextResponse } from 'next/server';
import { STORAGE_FEATURES } from '@/lib/services/brand-scoped-storage';

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
}

/**
 * GET /api/content-calendar/scheduled
 * Retrieve scheduled content for specific dates and brands
 * 
 * Query Parameters:
 * - brandId: Brand profile ID (required)
 * - userId: User ID (required)
 * - date: Specific date (YYYY-MM-DD) or 'today' (optional)
 * - dateRange: Number of days to include (default: 1)
 * - status: Filter by status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const userId = searchParams.get('userId');
    const dateParam = searchParams.get('date') || 'today';
    const dateRange = parseInt(searchParams.get('dateRange') || '1');
    const statusFilter = searchParams.get('status');

    // Validate required parameters
    if (!brandId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: brandId and userId' },
        { status: 400 }
      );
    }

    // Calculate target date(s)
    const targetDate = dateParam === 'today' ? new Date() : new Date(dateParam);
    const targetDateString = targetDate.toISOString().split('T')[0];

    // Get brand-scoped storage for scheduled content
    const scheduleStorage = STORAGE_FEATURES.getScheduledContent(brandId);
    if (!scheduleStorage) {
      return NextResponse.json(
        { error: 'Unable to access calendar storage for brand' },
        { status: 500 }
      );
    }

    // Retrieve all scheduled content for the brand
    const allScheduledContent = scheduleStorage.getItem<ScheduledContent[]>() || [];

    // Filter by date range
    const filteredContent = allScheduledContent.filter(item => {
      const itemDate = new Date(item.date);
      const daysDiff = Math.floor((itemDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff < dateRange;
    });

    // Filter by status if provided
    const finalContent = statusFilter 
      ? filteredContent.filter(item => item.status === statusFilter)
      : filteredContent;

    // Transform to ScheduledService format for AI consumption
    const scheduledServices: ScheduledService[] = finalContent.map(item => ({
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      description: item.notes,
      contentType: item.contentType,
      platform: item.platform,
      notes: item.notes,
      priority: determinePriority(item),
      scheduledTime: item.date
    }));

    // Group by date for better organization
    const groupedByDate = finalContent.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, ScheduledContent[]>);

    return NextResponse.json({
      success: true,
      data: {
        scheduledServices,
        scheduledContent: finalContent,
        groupedByDate,
        summary: {
          totalItems: finalContent.length,
          targetDate: targetDateString,
          dateRange,
          brandId,
          platforms: [...new Set(finalContent.map(item => item.platform))],
          contentTypes: [...new Set(finalContent.map(item => item.contentType))],
          services: [...new Set(finalContent.map(item => item.serviceName))]
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving scheduled content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve scheduled content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Determine priority based on content characteristics
 */
function determinePriority(item: ScheduledContent): 'low' | 'medium' | 'high' {
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
 * POST /api/content-calendar/scheduled
 * Update scheduled content status (e.g., mark as generated)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, userId, contentId, status, generatedPostId } = body;

    // Validate required parameters
    if (!brandId || !userId || !contentId || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters: brandId, userId, contentId, status' },
        { status: 400 }
      );
    }

    // Get brand-scoped storage
    const scheduleStorage = STORAGE_FEATURES.getScheduledContent(brandId);
    if (!scheduleStorage) {
      return NextResponse.json(
        { error: 'Unable to access calendar storage for brand' },
        { status: 500 }
      );
    }

    // Retrieve and update scheduled content
    const allScheduledContent = scheduleStorage.getItem<ScheduledContent[]>() || [];
    const updatedContent = allScheduledContent.map(item => {
      if (item.id === contentId) {
        return {
          ...item,
          status: status as ScheduledContent['status'],
          ...(generatedPostId && { generatedPostId })
        };
      }
      return item;
    });

    // Save updated content
    scheduleStorage.setItem(updatedContent);

    return NextResponse.json({
      success: true,
      message: 'Scheduled content updated successfully',
      updatedItem: updatedContent.find(item => item.id === contentId),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating scheduled content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update scheduled content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
