import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamically import to avoid initialization issues
    const { assistantManager } = await import('@/ai/assistants/assistant-manager');
    
    const businessTypes = ['retail', 'finance', 'service', 'saas', 'food', 'healthcare', 'realestate', 'education', 'b2b', 'nonprofit'];
    
    const status = businessTypes.map(type => ({
      type,
      available: assistantManager.isAvailable(type as any),
      envVar: `OPENAI_ASSISTANT_${type.toUpperCase()}`,
      envValue: process.env[`OPENAI_ASSISTANT_${type.toUpperCase()}`] ? 'Set ✅' : 'Not set ❌',
      rolloutVar: `ASSISTANT_ROLLOUT_${type.toUpperCase()}`,
      rolloutValue: process.env[`ASSISTANT_ROLLOUT_${type.toUpperCase()}`] || 'Not set ❌'
    }));

    return NextResponse.json({
      success: true,
      assistantsStatus: status,
      openAIKeySet: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
