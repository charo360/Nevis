// src/app/api/quick-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateContentAction } from '@/app/actions';
import { generateRevo15ContentAction } from '@/app/actions/revo-1.5-actions';
import type { BrandProfile, Platform, BrandConsistencyPreferences } from '@/lib/types';
import type { ScheduledService } from '@/services/calendar-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      revoModel,
      brandProfile,
      platform,
      brandConsistency,
      useLocalLanguage = false,
      scheduledServices = [],
      includePeopleInDesigns = true
    }: {
      revoModel: 'revo-1.0' | 'revo-1.5';
      brandProfile: BrandProfile;
      platform: Platform;
      brandConsistency?: BrandConsistencyPreferences;
      useLocalLanguage?: boolean;
      scheduledServices?: ScheduledService[];
      includePeopleInDesigns?: boolean;
    } = body;

    console.log(`🚀 Quick Content API: Processing ${revoModel} request for ${platform}`);

    // Validate required parameters
    if (!brandProfile || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: brandProfile and platform are required' },
        { status: 400 }
      );
    }

    let result;

    if (revoModel === 'revo-1.5') {
      // Use Revo 1.5 enhanced generation
      result = await generateRevo15ContentAction(
        brandProfile,
        platform,
        brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
        '',
        {
          aspectRatio: '1:1',
          visualStyle: brandProfile.visualStyle || 'modern',
          includePeopleInDesigns,
          useLocalLanguage
        },
        scheduledServices
      );
    } else {
      // Use Revo 1.0 standard generation
      result = await generateContentAction(
        brandProfile,
        platform,
        brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
        useLocalLanguage,
        scheduledServices,
        includePeopleInDesigns
      );
    }

    // Validate result before returning
    if (!result) {
      return NextResponse.json(
        { error: `${revoModel} generation returned null result` },
        { status: 500 }
      );
    }

    console.log(`✅ Quick Content API: ${revoModel} generation successful`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Quick Content API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Content generation failed' },
      { status: 500 }
    );
  }
}