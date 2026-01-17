/**
 * Humanization API
 * Endpoint for humanizing AI-generated content
 * Part of Layer 4: Humanization Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { performHumanization, humanizeCaption, humanizeHeadline } from '@/lib/humanization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      brandProfileId,
      industry = 'service',
      type = 'full', // 'full', 'caption', 'headline'
      options = {},
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    console.log(`🤖➡️👤 [Humanize API] Humanizing ${type} content`);

    let result;

    switch (type) {
      case 'caption':
        result = {
          original: content,
          humanized: humanizeCaption(content),
          changesApplied: ['Caption humanization'],
          humanScore: 0.8,
        };
        break;

      case 'headline':
        result = {
          original: content,
          humanized: humanizeHeadline(content),
          changesApplied: ['Headline humanization'],
          humanScore: 0.85,
        };
        break;

      case 'full':
      default:
        result = await performHumanization(content, {
          brandProfileId,
          industry,
          removeAIPatterns: options.removeAIPatterns ?? true,
          injectBrandVoice: options.injectBrandVoice ?? true,
          addConversational: options.addConversational ?? true,
          addContractions: options.addContractions ?? true,
        });
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        original: result.original,
        humanized: result.humanized,
        changesApplied: result.changesApplied,
        humanScore: result.humanScore,
        brandVoiceScore: (result as any).brandVoiceScore,
      },
    });
  } catch (error) {
    console.error('❌ [Humanize API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to humanize content', details: String(error) },
      { status: 500 }
    );
  }
}
