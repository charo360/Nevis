/**
 * Visual Design Agent - Specialized in ensuring design variety and brand consistency
 * Focuses on color accuracy, layout diversity, and visual coherence
 */

import { ChatOpenAI } from "@langchain/openai";

export interface VisualDesignRequest {
  brandProfile: any;
  concept: string;
  marketingAngle: string;
  platform: string;
}

export interface VisualDesignStrategy {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    usage: "dominant" | "balanced" | "minimal" | "accent-heavy";
  };
  layout: {
    style: string;
    structure: string;
    textPlacement: string;
  };
  visualStyle: {
    mood: string;
    imageryType: string;
    filtering: string;
  };
  promptInstructions: string;
}

export interface DesignHistory {
  colorUsage: string;
  layoutStyle: string;
  timestamp: number;
}

/**
 * Generates a visual design strategy that ensures variety while maintaining strict brand compliance
 */
export async function generateVisualStrategy(
  request: VisualDesignRequest,
  history: DesignHistory[] = []
): Promise<VisualDesignStrategy> {
  console.log('\n🎨 [Visual Agent] Generating visual strategy...');

  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7, // Higher temperature for visual creativity
    openAIApiKey: process.env.OPENAI_API_KEY
  });


  // Extract colors with fallbacks handling both data structures
  const colors = {
    primary: request.brandProfile.brandColors?.primary || request.brandProfile.primaryColor || '#000000',
    secondary: request.brandProfile.brandColors?.secondary || request.brandProfile.secondaryColor || request.brandProfile.accentColor || '#FFFFFF',
    accent: request.brandProfile.brandColors?.accent || request.brandProfile.accentColor || '#FF0000',
    background: request.brandProfile.brandColors?.background || request.brandProfile.backgroundColor || '#FFFFFF'
  };

  const prompt = `You are an Expert Visual Director Agent. Your goal is to create a specific visual strategy for a social media ad.
  
  CRITICAL GOAL: Solve "Same Design Syndrome" and "Color Inaccuracy".
  
  BRAND CONTEXT:
  Brand Name: ${request.brandProfile.businessName}
  Brand Colors: ${JSON.stringify(colors)}
  Industry: ${request.brandProfile.businessType}
  
  CONTENT CONTEXT:
  Concept: ${request.concept}
  Marketing Angle: ${request.marketingAngle}
  Platform: ${request.platform}
  
  DESIGN HISTORY (Last 5 ads):
  ${history.map(h => `- Used ${h.layoutStyle} layout with ${h.colorUsage} color scheme`).join('\n')}
  
  INSTRUCTIONS:
  1. **Color Strategy**: STRICTLY use the provided brand colors. Do NOT invent colors.
     - Decide on a "Color Mode": 
       - "Dominant" (Primary color covers 70%)
       - "Balanced" (50/50 mix)
       - "Minimal" (White/Dark background with color accents)
       - "Accent-Heavy" (Neutral base with strong pops of accent)
     - MUST vary from recent history if possible.
  
  2. **Layout Strategy**: Choose a distinctive layout structure.
     - Examples: "Split Screen", "Diagonal Grid", "Central Hero", "Typographic Heavy", "Minimalist Frame", "Off-Center Focus".
     - MUST vary from recent history.
  
  3. **Visual Style**: Define the mood and imagery treatment.
     - Examples: "High Contrast", "Soft & Warm", "Desaturated/Cinematic", "Vibrant/Pop".
  
  OUTPUT JSON ONLY:
  {
    "colorPalette": {
      "primary": "HEX code from brand",
      "secondary": "HEX code from brand",
      "accent": "HEX code from brand or complementary",
      "background": "HEX code",
      "usage": "dominant|balanced|minimal|accent-heavy"
    },
    "layout": {
      "style": "Name of style",
      "structure": "Description of grid/arrangement",
      "textPlacement": "Top-Left|Center|Bottom-Right|etc"
    },
    "visualStyle": {
      "mood": "Mood description",
      "imageryType": "Photo|Illustration|3D Render|Mixed Media",
      "filtering": "Description of color grading"
    },
    "promptInstructions": "A concise paragraph of visual instructions for the image generator model, enforcing these choices."
  }
  `;

  try {
    const response = await model.invoke(prompt);
    const content = response.content as string;
    
    // Clean JSON
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
      
    const strategy: VisualDesignStrategy = JSON.parse(jsonContent);
    
    console.log(`🎨 [Visual Agent] Strategy defined: ${strategy.layout.style} with ${strategy.colorPalette.usage} colors`);
    return strategy;
    
  } catch (error) {
    console.error('❌ [Visual Agent] Error generating strategy:', error);
    // Fallback strategy
    return {
      colorPalette: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: colors.background,
        usage: 'balanced'
      },
      layout: {
        style: 'Standard Hero',
        structure: 'Central image with bottom text',
        textPlacement: 'Bottom-Center'
      },
      visualStyle: {
        mood: 'Professional',
        imageryType: 'Photo',
        filtering: 'Natural'
      },
      promptInstructions: 'Create a professional, balanced composition using brand colors.'
    };
  }
}
