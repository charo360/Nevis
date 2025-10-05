/**
 * Test API endpoint to check proxy environment configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { shouldUseProxy, getUserIdForProxy, getUserTierForProxy } from '@/lib/services/ai-proxy-client';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      AI_PROXY_ENABLED: process.env.AI_PROXY_ENABLED,
      AI_PROXY_URL: process.env.AI_PROXY_URL,
      AI_PROXY_TIMEOUT: process.env.AI_PROXY_TIMEOUT,
      shouldUseProxy: shouldUseProxy(),
      userIdForProxy: getUserIdForProxy(),
      userTierForProxy: getUserTierForProxy(),
      geminiKeys: {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        GEMINI_API_KEY_REVO_1_0: !!process.env.GEMINI_API_KEY_REVO_1_0,
        GEMINI_API_KEY_REVO_1_5: !!process.env.GEMINI_API_KEY_REVO_1_5,
        GEMINI_API_KEY_REVO_2_0: !!process.env.GEMINI_API_KEY_REVO_2_0,
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Proxy environment check',
      data: envCheck,
      analysis: {
        proxyEnabled: shouldUseProxy(),
        expectedBehavior: shouldUseProxy() 
          ? 'All AI calls should go through proxy with cost protection'
          : 'Direct API calls without cost protection',
        recommendation: shouldUseProxy()
          ? 'Proxy integration is active ✅'
          : 'Enable proxy by setting AI_PROXY_ENABLED=true ❌'
      }
    });

  } catch (error: any) {
    console.error('❌ Proxy environment check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
