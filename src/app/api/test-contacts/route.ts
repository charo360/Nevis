/**
 * Test Contacts API
 * Simple test to verify contact information is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRevo10Content } from '@/ai/revo-1.0-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test data with contact information
    const testData = {
      businessType: 'restaurant',
      businessName: 'Test Restaurant',
      location: 'New York, NY',
      platform: 'instagram',
      writingTone: 'friendly',
      contentThemes: ['food', 'dining'],
      targetAudience: 'food lovers',
      services: 'Fine dining, catering',
      keyFeatures: 'Fresh ingredients, authentic recipes',
      competitiveAdvantages: 'Family-owned, locally sourced',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      currentDate: new Date().toLocaleDateString(),
      primaryColor: '#D97706',
      visualStyle: 'warm and inviting',
      includeContacts: true, // Force include contacts
      contactInfo: {
        phone: '+1 (555) 123-4567',
        email: 'info@testrestaurant.com',
        address: '123 Test Street, New York, NY 10001'
      },
      websiteUrl: 'www.testrestaurant.com'
    };

    console.log('🧪 [Test Contacts API] Test Data:', testData);

    // Generate content
    const result = await generateRevo10Content(testData);

    console.log('🧪 [Test Contacts API] Generated Content:', {
      content: result.content,
      catchyWords: result.catchyWords,
      callToAction: result.callToAction,
      hasPhone: result.content?.includes('555-123-4567') || result.content?.includes('(555) 123-4567'),
      hasEmail: result.content?.includes('info@testrestaurant.com'),
      hasAddress: result.content?.includes('123 Test Street'),
      hasWebsite: result.content?.includes('www.testrestaurant.com')
    });

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        catchyWords: result.catchyWords,
        callToAction: result.callToAction,
        contactAnalysis: {
          hasPhone: result.content?.includes('555-123-4567') || result.content?.includes('(555) 123-4567'),
          hasEmail: result.content?.includes('info@testrestaurant.com'),
          hasAddress: result.content?.includes('123 Test Street'),
          hasWebsite: result.content?.includes('www.testrestaurant.com')
        }
      }
    });

  } catch (error) {
    console.error('❌ [Test Contacts API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}











