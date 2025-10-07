/**
 * Test endpoint for Revo 1.0 proxy-only functionality
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing Revo 1.0 proxy-only functionality...');
    
    // Test basic imports
    const { generateRevo10Content } = await import('@/ai/revo-1.0-service');
    console.log('✅ Revo 1.0 service imported successfully');
    
    // Test creative enhancement imports
    const { 
      StrategicContentPlanner,
      generateBusinessSpecificHeadline,
      generateBusinessSpecificSubheadline,
      generateBusinessSpecificCaption
    } = await import('@/ai/creative-enhancement');
    console.log('✅ Creative enhancement functions imported successfully');
    
    // Test proxy client import
    const { aiProxyClient, shouldUseProxy } = await import('@/lib/services/ai-proxy-client');
    console.log('✅ Proxy client imported successfully');
    console.log('🔍 Proxy enabled:', shouldUseProxy());
    
    // Test a simple headline generation
    console.log('🔄 Testing headline generation...');
    const headline = await generateBusinessSpecificHeadline(
      'restaurant',
      'Test Restaurant',
      'Kenya',
      { description: 'Test restaurant' },
      'instagram',
      { useLocalLanguage: false }
    );
    console.log('✅ Headline generated:', headline);
    
    return NextResponse.json({
      success: true,
      message: 'Revo 1.0 proxy-only test successful',
      data: {
        proxyEnabled: shouldUseProxy(),
        headline: headline,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Revo 1.0 test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
