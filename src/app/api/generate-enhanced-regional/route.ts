// src/app/api/generate-enhanced-regional/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EnhancedRegionalCaptionSystem } from '@/ai/enhanced-regional-caption-system';
import { RegionalSocialTrendsService } from '@/services/regional-social-trends-service';
import type { BrandProfile, Platform } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessType,
      businessName,
      location,
      platform,
      brandProfile,
      useLocalLanguage = false,
      targetAudience
    } = body;

    console.log(`🌍 Generating enhanced regional content for ${businessType} in ${location}`);

    // Initialize enhanced regional caption system
    const captionSystem = new EnhancedRegionalCaptionSystem();

    // Generate comprehensive regional content
    const captionComponents = await captionSystem.generateRegionalCaption({
      businessType,
      businessName,
      location,
      platform: platform as Platform,
      targetAudience,
      brandProfile: brandProfile as BrandProfile,
      useLocalLanguage
    });

    // Get additional regional social intelligence
    const regionalTrends = await RegionalSocialTrendsService.getRegionalTrends(
      location,
      businessType
    );

    // Get Instagram/Twitter alternatives
    const socialAlternatives = await RegionalSocialTrendsService.getInstagramTwitterAlternatives(
      businessType,
      location
    );

    console.log(`✅ Generated regional content with ${captionComponents.hashtags.length} hashtags and local context`);

    return NextResponse.json({
      success: true,
      data: {
        ...captionComponents,
        regionalIntelligence: {
          currentEvents: regionalTrends.currentEvents,
          culturalMoments: regionalTrends.culturalMoments,
          socialBuzz: regionalTrends.socialBuzz,
          businessTrends: regionalTrends.businessTrends,
          socialAlternativeHashtags: socialAlternatives
        },
        generationMetadata: {
          model: 'Enhanced Regional AI',
          location: location,
          localLanguageUsed: useLocalLanguage,
          regionalDataSources: regionalTrends.currentEvents.length + regionalTrends.socialBuzz.length,
          processingTime: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('Enhanced regional generation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Enhanced regional content generation failed',
      fallback: {
        headline: `Great ${body.businessType || 'Business'}`,
        subheadline: `Quality services in ${body.location || 'your area'}`,
        caption: `Looking for exceptional ${body.businessType || 'business'} services? We're here to help with professional solutions.`,
        callToAction: 'Contact us today!',
        hashtags: [`#${body.businessType || 'Business'}`, '#Quality', '#Local'],
        localFlavor: {
          language: 'english',
          culturalRef: 'local community',
          regionalTrend: 'business growth'
        }
      }
    }, { status: 200 }); // Return 200 with fallback instead of error
  }
}
