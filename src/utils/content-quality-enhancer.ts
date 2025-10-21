/**
 * Content Quality Enhancer with Spell Checking
 * Ensures all headlines and subheadlines are spell-checked before image generation
 */

import { SpellChecker, SpellCheckResult } from './spell-checker';

export interface ContentQualityResult {
  headline: {
    original: string;
    corrected: string;
    spellCheck: SpellCheckResult;
    isValid: boolean;
  };
  subheadline: {
    original: string;
    corrected: string;
    spellCheck: SpellCheckResult;
    isValid: boolean;
  };
  caption?: {
    original: string;
    corrected: string;
    spellCheck: SpellCheckResult;
    isValid: boolean;
  };
  overallQuality: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export class ContentQualityEnhancer {
  /**
   * Enhance content quality with spell checking and validation
   */
  static enhanceContent(content: {
    headline: string;
    subheadline: string;
    caption?: string;
  }, businessType?: string): ContentQualityResult {
    
    // Check headline
    const headlineCheck = SpellChecker.checkHeadline(content.headline, businessType);
    
    // Check subheadline
    const subheadlineCheck = SpellChecker.checkSubheadline(content.subheadline, businessType);
    
    // Check caption if provided
    let captionCheck: SpellCheckResult | undefined;
    if (content.caption) {
      captionCheck = SpellChecker.checkSpelling(content.caption, businessType);
    }
    
    // Calculate overall quality
    const overallQuality = this.calculateOverallQuality(headlineCheck, subheadlineCheck, captionCheck);
    
    return {
      headline: {
        original: content.headline,
        corrected: headlineCheck.correctedText,
        spellCheck: headlineCheck,
        isValid: headlineCheck.confidence > 80
      },
      subheadline: {
        original: content.subheadline,
        corrected: subheadlineCheck.correctedText,
        spellCheck: subheadlineCheck,
        isValid: subheadlineCheck.confidence > 80
      },
      caption: captionCheck ? {
        original: content.caption!,
        corrected: captionCheck.correctedText,
        spellCheck: captionCheck,
        isValid: captionCheck.confidence > 80
      } : undefined,
      overallQuality
    };
  }
  
  /**
   * Quick spell check and correction for headlines/subheadlines before image generation
   */
  static quickSpellCheck(text: string, businessType?: string): string {
    const result = SpellChecker.checkSpelling(text, businessType);
    
    // Log corrections if any were made
    if (result.hasErrors) {
      
      // Log specific corrections
      result.corrections.forEach(correction => {
      });
    }
    
    return result.correctedText;
  }
  
  /**
   * Validate content before sending to image generation
   */
  static validateForImageGeneration(content: {
    headline: string;
    subheadline: string;
    callToAction?: string;
  }, businessType?: string): {
    isValid: boolean;
    correctedContent: typeof content;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check headline
    const headlineResult = SpellChecker.checkHeadline(content.headline, businessType);
    if (headlineResult.hasErrors) {
      issues.push(`Headline had ${headlineResult.corrections.length} spelling errors`);
    }
    
    // Check subheadline
    const subheadlineResult = SpellChecker.checkSubheadline(content.subheadline, businessType);
    if (subheadlineResult.hasErrors) {
      issues.push(`Subheadline had ${subheadlineResult.corrections.length} spelling errors`);
    }
    
    // Check CTA if provided
    let ctaResult: SpellCheckResult | undefined;
    if (content.callToAction) {
      ctaResult = SpellChecker.checkSpelling(content.callToAction, businessType);
      if (ctaResult.hasErrors) {
        issues.push(`Call-to-action had ${ctaResult.corrections.length} spelling errors`);
      }
    }
    
    // Return corrected content
    const correctedContent = {
      headline: headlineResult.correctedText,
      subheadline: subheadlineResult.correctedText,
      callToAction: ctaResult ? ctaResult.correctedText : content.callToAction
    };
    
    const isValid = headlineResult.confidence > 80 && subheadlineResult.confidence > 80 && 
                   (!ctaResult || ctaResult.confidence > 80);
    
    return {
      isValid,
      correctedContent,
      issues
    };
  }
  
  /**
   * Calculate overall content quality score
   */
  private static calculateOverallQuality(
    headlineCheck: SpellCheckResult,
    subheadlineCheck: SpellCheckResult,
    captionCheck?: SpellCheckResult
  ) {
    const scores = [headlineCheck.confidence, subheadlineCheck.confidence];
    if (captionCheck) scores.push(captionCheck.confidence);
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze issues
    if (headlineCheck.hasErrors) {
      issues.push(`Headline spelling errors: ${headlineCheck.corrections.length}`);
      recommendations.push('Review headline for spelling accuracy');
    }
    
    if (subheadlineCheck.hasErrors) {
      issues.push(`Subheadline spelling errors: ${subheadlineCheck.corrections.length}`);
      recommendations.push('Review subheadline for spelling accuracy');
    }
    
    if (captionCheck?.hasErrors) {
      issues.push(`Caption spelling errors: ${captionCheck.corrections.length}`);
      recommendations.push('Review caption for spelling accuracy');
    }
    
    // Quality recommendations
    if (averageScore < 70) {
      recommendations.push('Consider regenerating content for better quality');
    } else if (averageScore < 90) {
      recommendations.push('Content quality is good but could be improved');
    }
    
    return {
      score: Math.round(averageScore),
      issues,
      recommendations
    };
  }
  
  /**
   * Enhanced content generation wrapper with spell checking
   */
  static async enhanceGeneratedContent<T extends {
    headline?: string;
    subheadline?: string;
    caption?: string;
    catchyWords?: string;
    callToAction?: string;
  }>(
    content: T,
    businessType?: string,
    options: {
      autoCorrect?: boolean;
      logCorrections?: boolean;
      validateQuality?: boolean;
    } = {}
  ): Promise<T & { qualityReport?: ContentQualityResult }> {
    const { autoCorrect = true, logCorrections = true, validateQuality = true } = options;
    
    const enhancedContent = { ...content };
    let qualityReport: ContentQualityResult | undefined;
    
    // Process headline
    if (content.headline) {
      const headlineCheck = SpellChecker.checkHeadline(content.headline, businessType);
      
      if (autoCorrect && headlineCheck.hasErrors) {
        enhancedContent.headline = headlineCheck.correctedText;
        
        if (logCorrections) {
        }
      }
    }
    
    // Process subheadline
    if (content.subheadline) {
      const subheadlineCheck = SpellChecker.checkSubheadline(content.subheadline, businessType);
      
      if (autoCorrect && subheadlineCheck.hasErrors) {
        enhancedContent.subheadline = subheadlineCheck.correctedText;
        
        if (logCorrections) {
        }
      }
    }
    
    // Process caption
    if (content.caption) {
      const captionCheck = SpellChecker.checkSpelling(content.caption, businessType);
      
      if (autoCorrect && captionCheck.hasErrors) {
        enhancedContent.caption = captionCheck.correctedText;
        
        if (logCorrections) {
        }
      }
    }
    
    // Process catchyWords
    if (content.catchyWords) {
      const catchyWordsCheck = SpellChecker.checkSpelling(content.catchyWords, businessType);
      
      if (autoCorrect && catchyWordsCheck.hasErrors) {
        enhancedContent.catchyWords = catchyWordsCheck.correctedText;
        
        if (logCorrections) {
        }
      }
    }
    
    // Process callToAction
    if (content.callToAction) {
      const ctaCheck = SpellChecker.checkSpelling(content.callToAction, businessType);
      
      if (autoCorrect && ctaCheck.hasErrors) {
        enhancedContent.callToAction = ctaCheck.correctedText;
        
        if (logCorrections) {
        }
      }
    }
    
    // Generate quality report if requested
    if (validateQuality && content.headline && content.subheadline) {
      qualityReport = this.enhanceContent({
        headline: enhancedContent.headline!,
        subheadline: enhancedContent.subheadline!,
        caption: enhancedContent.caption
      }, businessType);
    }
    
    return qualityReport ? { ...enhancedContent, qualityReport } : enhancedContent;
  }
}
