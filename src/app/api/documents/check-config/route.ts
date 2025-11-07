import { NextResponse } from 'next/server';

/**
 * GET /api/documents/check-config
 * Check if OpenAI and assistants are properly configured
 */
export async function GET() {
  const config = {
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    openaiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + '...',
    assistants: {
      retail: !!process.env.OPENAI_ASSISTANT_RETAIL,
      finance: !!process.env.OPENAI_ASSISTANT_FINANCE,
      service: !!process.env.OPENAI_ASSISTANT_SERVICE,
      saas: !!process.env.OPENAI_ASSISTANT_SAAS,
      food: !!process.env.OPENAI_ASSISTANT_FOOD,
      healthcare: !!process.env.OPENAI_ASSISTANT_HEALTHCARE,
      realestate: !!process.env.OPENAI_ASSISTANT_REALESTATE,
      education: !!process.env.OPENAI_ASSISTANT_EDUCATION,
      b2b: !!process.env.OPENAI_ASSISTANT_B2B,
      nonprofit: !!process.env.OPENAI_ASSISTANT_NONPROFIT,
    },
    assistantIds: {
      retail: process.env.OPENAI_ASSISTANT_RETAIL || 'NOT SET',
      finance: process.env.OPENAI_ASSISTANT_FINANCE || 'NOT SET',
      service: process.env.OPENAI_ASSISTANT_SERVICE || 'NOT SET',
      saas: process.env.OPENAI_ASSISTANT_SAAS || 'NOT SET',
      food: process.env.OPENAI_ASSISTANT_FOOD || 'NOT SET',
      healthcare: process.env.OPENAI_ASSISTANT_HEALTHCARE || 'NOT SET',
      realestate: process.env.OPENAI_ASSISTANT_REALESTATE || 'NOT SET',
      education: process.env.OPENAI_ASSISTANT_EDUCATION || 'NOT SET',
      b2b: process.env.OPENAI_ASSISTANT_B2B || 'NOT SET',
      nonprofit: process.env.OPENAI_ASSISTANT_NONPROFIT || 'NOT SET',
    },
  };

  const configuredCount = Object.values(config.assistants).filter(Boolean).length;
  const allConfigured = config.openaiConfigured && configuredCount > 0;

  return NextResponse.json({
    success: true,
    configured: allConfigured,
    openaiKey: config.openaiConfigured ? '✅ Configured' : '❌ Missing',
    assistantsConfigured: `${configuredCount}/10`,
    details: config,
    warnings: [
      !config.openaiConfigured && '⚠️ OPENAI_API_KEY is not set in .env.local',
      configuredCount === 0 && '⚠️ No assistant IDs configured',
    ].filter(Boolean),
  });
}

