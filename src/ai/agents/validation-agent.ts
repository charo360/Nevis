/**
 * Validation Agent - Detects repetitive content and ensures uniqueness
 * Part of LangGraph multi-agent system for Revo 2.0 quality control
 */

import { ChatOpenAI } from "@langchain/openai";

export interface AdContent {
  headline: string;
  caption: string;
  sellingAngle?: string;
  emotionalTone?: string;
  targetAudience?: string;
}

export interface ValidationResult {
  isUnique: boolean;
  similarityScore: number; // 0-100 (100 = completely unique)
  rejectionReason?: string;
  suggestions: string[];
  detectedPatterns: string[];
}

/**
 * Validates content uniqueness against recent generations
 * Uses GPT-4 with low temperature for consistent validation
 */
export async function validateContentUniqueness(
  newContent: AdContent,
  recentContent: AdContent[]
): Promise<ValidationResult> {
  console.log('\n🔍 [Validation Agent] Starting content uniqueness check...');
  console.log(`📊 [Validation Agent] Comparing against ${recentContent.length} recent ads`);

  // If no recent content, automatically approve
  if (recentContent.length === 0) {
    console.log('✅ [Validation Agent] No recent content - auto-approved');
    return {
      isUnique: true,
      similarityScore: 100,
      suggestions: [],
      detectedPatterns: []
    };
  }

  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.3, // Low temperature for consistent validation
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `You are a Quality Validation Agent. Your job is to detect repetitive content patterns.

🆕 NEW CONTENT TO VALIDATE:
Headline: "${newContent.headline}"
Caption: "${newContent.caption.substring(0, 200)}..."

📚 RECENT ADS (Last ${recentContent.length}):
${recentContent.map((ad, i) => `
${i + 1}. Headline: "${ad.headline}"
   Caption: "${ad.caption.substring(0, 150)}..."
`).join('\n')}

🎯 VALIDATION CRITERIA:

1. **Selling Angle Variety** (30 points):
   - Is the selling angle different? (price vs features vs benefits vs social proof vs urgency)
   - Are we highlighting different value propositions?
   
2. **Opening Structure Variety** (25 points):
   - Is the opening structure different? (question vs statement vs story vs statistic)
   - Are we using different hooks?
   
3. **Emotional Tone Variety** (20 points):
   - Is the emotional tone different? (urgent vs calm vs exciting vs reassuring)
   - Are we creating different feelings?
   
4. **Word/Phrase Uniqueness** (15 points):
   - Are we avoiding exact phrase repetition?
   - Are we using fresh vocabulary?
   
5. **Target Audience Variety** (10 points):
   - Are we addressing different customer personas?
   - Are we varying the "who" we're speaking to?

📊 SCORING SYSTEM:
- 90-100: EXCELLENT - Completely unique, no concerning similarities
- 75-89: GOOD - Mostly unique, minor similarities acceptable
- 60-74: BORDERLINE - Some repetition, could be improved
- 0-59: REJECT - Too similar, must regenerate with different approach

🚨 AUTO-REJECT PATTERNS:
- Exact headline repetition
- Same opening phrase (first 5-7 words)
- Identical selling angle + tone combination
- Copy-paste phrases from recent ads

📋 RETURN FORMAT (JSON only, no markdown):
{
  "isUnique": boolean,
  "similarityScore": number,
  "rejectionReason": "specific reason if rejected, empty string if approved",
  "suggestions": ["alternative approach 1", "alternative approach 2", "alternative approach 3"],
  "detectedPatterns": ["pattern 1 if found", "pattern 2 if found"]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.`;

  try {
    const response = await model.invoke(prompt);
    const content = response.content as string;
    
    // Remove markdown code blocks if present
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const result: ValidationResult = JSON.parse(jsonContent);
    
    // Log validation results
    console.log(`📊 [Validation Agent] Similarity Score: ${result.similarityScore}/100`);
    console.log(`${result.isUnique ? '✅' : '❌'} [Validation Agent] ${result.isUnique ? 'APPROVED' : 'REJECTED'}`);
    
    if (!result.isUnique) {
      console.log(`🚫 [Validation Agent] Rejection Reason: ${result.rejectionReason}`);
      console.log(`💡 [Validation Agent] Suggestions:`, result.suggestions);
    }
    
    if (result.detectedPatterns.length > 0) {
      console.log(`⚠️ [Validation Agent] Detected Patterns:`, result.detectedPatterns);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [Validation Agent] Error during validation:', error);
    
    // Fail-safe: If validation fails, approve but log warning
    console.warn('⚠️ [Validation Agent] Validation error - defaulting to approval');
    return {
      isUnique: true,
      similarityScore: 75,
      suggestions: [],
      detectedPatterns: ['Validation error - could not complete check']
    };
  }
}

/**
 * Analyzes content to extract key characteristics for tracking
 */
export function extractContentCharacteristics(content: AdContent): {
  sellingAngle: string;
  emotionalTone: string;
  openingType: string;
} {
  // This is a simple heuristic - could be enhanced with AI analysis
  const headline = content.headline.toLowerCase();
  const caption = content.caption.toLowerCase();
  
  // Detect selling angle
  let sellingAngle = 'benefit';
  if (headline.includes('ksh') || headline.includes('kes') || caption.includes('save')) {
    sellingAngle = 'price';
  } else if (headline.includes('?')) {
    sellingAngle = 'question';
  } else if (caption.includes('trusted by') || caption.includes('join')) {
    sellingAngle = 'social-proof';
  } else if (caption.includes('limited') || caption.includes('now') || caption.includes('today')) {
    sellingAngle = 'urgency';
  }
  
  // Detect emotional tone
  let emotionalTone = 'neutral';
  if (caption.includes('!') || caption.includes('now') || caption.includes('hurry')) {
    emotionalTone = 'urgent';
  } else if (caption.includes('easy') || caption.includes('simple') || caption.includes('secure')) {
    emotionalTone = 'reassuring';
  } else if (caption.includes('transform') || caption.includes('grow') || caption.includes('achieve')) {
    emotionalTone = 'aspirational';
  }
  
  // Detect opening type
  let openingType = 'statement';
  if (headline.includes('?')) {
    openingType = 'question';
  } else if (caption.match(/^\d+%/) || caption.match(/^\d+\+/)) {
    openingType = 'statistic';
  } else if (caption.match(/^(imagine|picture|think about)/i)) {
    openingType = 'scenario';
  }
  
  return { sellingAngle, emotionalTone, openingType };
}
