/**
 * Orchestrator Agent - Coordinates the specialized agents for Revo 2.0
 * Manages the workflow between Strategy, Visual, and Content agents
 */

import { generateVisualStrategy, VisualDesignRequest, VisualDesignStrategy } from './visual-design-agent';
import { validateContentUniqueness, AdContent } from './validation-agent';

export interface GenerationRequest {
  businessType: string;
  brandProfile: any;
  concept: string;
  platform: string;
  previousAds?: any[]; // For history context
}

export interface OrchestratedResult {
  visualStrategy: VisualDesignStrategy;
  contentStrategy: {
    angle: string;
    tone: string;
  };
  validationPassed: boolean;
}

/**
 * Coordinates the generation process using specialized agents
 */
export async function orchestrateGeneration(
  request: GenerationRequest
): Promise<OrchestratedResult> {
  console.log('\n🎼 [Orchestrator] Starting multi-agent generation workflow...');
  
  // Step 1: Determine Strategy (Angle & Tone)
  // For now, we'll use a simplified logic or existing Revo logic, 
  // but in a full system, a Strategy Agent would decide this.
  const marketingAngle = 'Benefit-Driven'; // This would come from Strategy Agent
  
  // Step 2: Visual Design Agent
  // Determines HOW it looks (solving the "same design" issue)
  const visualHistory = request.previousAds?.map(ad => ({
    colorUsage: ad.visual_strategy?.colorUsage || 'balanced',
    layoutStyle: ad.visual_strategy?.layoutStyle || 'standard',
    timestamp: Date.parse(ad.created_at) || Date.now()
  })) || [];
  
  const visualRequest: VisualDesignRequest = {
    brandProfile: request.brandProfile,
    concept: request.concept,
    marketingAngle: marketingAngle,
    platform: request.platform
  };
  
  const visualStrategy = await generateVisualStrategy(visualRequest, visualHistory);
  
  // Step 3: Content Generation (Placeholder for Content Agent)
  // In the full flow, this would generate the text. 
  // For now, we return the strategy to be used by the main Gemini 2.0 service.
  
  console.log('✅ [Orchestrator] Workflow planning complete');
  
  return {
    visualStrategy,
    contentStrategy: {
      angle: marketingAngle,
      tone: 'Professional'
    },
    validationPassed: true // Placeholder
  };
}
