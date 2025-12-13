/**
 * Revo 2.0 Agentic Service
 * Entry point for the Multi-Agent Content Generation Workflow
 */

import { orchestrateGeneration, GenerationRequest } from './orchestrator-agent';
import { generateContentDirect, VertexGenerationOptions } from '../revo-2.0-service';
import type { BrandProfile, Platform } from '@/lib/types';

export interface RevoAgentOptions {
  businessType: string;
  brandProfile: BrandProfile;
  platform: Platform;
  concept?: string;
  previousAds?: any[];
  useLocalLanguage?: boolean;
}

export interface AgentGenerationResult {
  imageUrl: string;
  headline: string;
  subheadline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  visualStrategy: any;
}

/**
 * Generates content using the Multi-Agent System
 * 1. Orchestrator plans the strategy (Visual & Content)
 * 2. Visual Agent defines the image look
 * 3. Gemini 3 Pro generates the image based on Visual Agent's strict prompt
 * 4. Content is generated matching the strategy
 */
export async function generateRevoAgentContent(
  options: RevoAgentOptions
): Promise<AgentGenerationResult> {
  console.log('🤖 [Revo Agents] Starting agentic generation...');

  // 1. Orchestrate & Plan
  const orchestrated = await orchestrateGeneration({
    businessType: options.businessType,
    brandProfile: options.brandProfile,
    concept: options.concept || 'Showcasing our core service',
    platform: options.platform,
    previousAds: options.previousAds
  });

  const { visualStrategy, contentStrategy } = orchestrated;

  // 2. Construct the Enhanced Image Prompt
  // We use the output from VisualDesignAgent to force variety and brand compliance
  const imagePrompt = `
    Create a high-quality social media image for ${options.brandProfile.businessName} (${options.businessType}).
    
    VISUAL STRATEGY (STRICTLY FOLLOW):
    - Layout: ${visualStrategy.layout.style} - ${visualStrategy.layout.structure}
    - Text Placement: ${visualStrategy.layout.textPlacement}
    - Visual Mood: ${visualStrategy.visualStyle.mood}
    - Imagery: ${visualStrategy.visualStyle.imageryType}
    
    COLOR PALETTE (NON-NEGOTIABLE):
    - Primary: ${visualStrategy.colorPalette.primary}
    - Secondary: ${visualStrategy.colorPalette.secondary}
    - Background: ${visualStrategy.colorPalette.background}
    - Usage Mode: ${visualStrategy.colorPalette.usage}
    
    DETAILED INSTRUCTIONS:
    ${visualStrategy.promptInstructions}
    
    CONTENT TO INCLUDE IN IMAGE:
    - Headline context: ${contentStrategy.angle}
    
    EXCLUDE:
    - Corporate stock photo look
    - Generic AI artifacts
    - Text spelling errors
  `;

  console.log('🎨 [Revo Agents] Generating image with strategy:', visualStrategy.layout.style);

  // 3. Generate Image (Gemini 3 Pro)
  // We use the existing direct integration
  const imageResult = await generateContentDirect(
    imagePrompt,
    'gemini-3-pro-image-preview', // Force the high-quality model
    true,
    {
      aspectRatio: options.platform === 'Instagram' ? '1:1' : '1:1',
      logoImage: options.brandProfile.logoDataUrl
    }
  );

  const generatedImageUrl = imageResult.response.candidates[0].content.parts[0].inlineData.data; // Base64 usually, needs handling

  // 4. Generate Text Content (matching the strategy)
  // This simulates the Content Agent
  const textPrompt = `
    Generate social media text for ${options.brandProfile.businessName}.
    Strategy: ${contentStrategy.angle}
    Tone: ${contentStrategy.tone}
    Visual Context: ${visualStrategy.layout.style} layout with ${visualStrategy.visualStyle.mood} mood.
    
    Return JSON:
    {
      "headline": "...",
      "subheadline": "...",
      "caption": "...",
      "cta": "...",
      "hashtags": ["..."]
    }
  `;
  
  const textResult = await generateContentDirect(
    textPrompt,
    'gemini-2.5-flash',
    false
  );
  
  const textContent = JSON.parse(textResult.response.text());

  return {
    imageUrl: `data:image/png;base64,${generatedImageUrl}`, // Ensure proper format
    headline: textContent.headline,
    subheadline: textContent.subheadline,
    caption: textContent.caption,
    cta: textContent.cta,
    hashtags: textContent.hashtags,
    visualStrategy: visualStrategy
  };
}
