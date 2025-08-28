/**
 * Text Validation Service
 * Comprehensive text validation and corruption prevention
 */

export interface TextValidationResult {
  isValid: boolean;
  cleanedText: string;
  issues: string[];
  correctionsMade: string[];
}

export interface TextValidationOptions {
  maxWords?: number;
  allowSpecialChars?: boolean;
  requireEnglish?: boolean;
  preventCorruption?: boolean;
}

export class TextValidationService {
  
  /**
   * Known corrupted text patterns to detect and prevent
   */
  private static readonly CORRUPTED_PATTERNS = [
    /AUTTENG/gi,
    /BAMALE/gi,
    /COMEASUE/gi,
    /repairent/gi,
    /tyaathfcoligetrick/gi,
    /marchtstrg/gi,
    /areadnr/gi,
    /gaod/gi,
    /vester/gi,
    /watuting/gi,
    /Strvlla/gi,
    /Cemulre/gi,
    // Pattern for random character sequences (3+ consonants in a row without vowels)
    /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/g,
    // Pattern for encoding-like errors
    /[^\w\s\-'&.,!?]{2,}/g,
    // Pattern for repeated character corruption
    /(.)\1{5,}/g
  ];

  /**
   * Common English words that should be preserved
   */
  private static readonly COMMON_WORDS = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'your', 'our', 'we', 'you', 'they', 'it', 'is', 'are', 'was', 'were', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'professional', 'business', 'service', 'services', 'company', 'quality',
    'best', 'top', 'great', 'excellent', 'amazing', 'perfect', 'premium',
    'now', 'today', 'new', 'fresh', 'modern', 'innovative', 'creative',
    'contact', 'call', 'visit', 'learn', 'more', 'about', 'get', 'started'
  ]);

  /**
   * Validate and clean text input
   */
  static validateText(
    text: string, 
    options: TextValidationOptions = {}
  ): TextValidationResult {
    const {
      maxWords = 25,
      allowSpecialChars = true,
      requireEnglish = true,
      preventCorruption = true
    } = options;

    const issues: string[] = [];
    const correctionsMade: string[] = [];
    let cleanedText = text.trim();

    // Check for empty text
    if (!cleanedText) {
      return {
        isValid: false,
        cleanedText: 'Professional Services',
        issues: ['Text is empty'],
        correctionsMade: ['Applied fallback text']
      };
    }

    // Detect and flag corrupted patterns
    if (preventCorruption) {
      for (const pattern of this.CORRUPTED_PATTERNS) {
        if (pattern.test(cleanedText)) {
          issues.push(`Detected corrupted text pattern: ${pattern.source}`);
          cleanedText = cleanedText.replace(pattern, '');
          correctionsMade.push(`Removed corrupted pattern: ${pattern.source}`);
        }
      }
    }

    // Clean special characters if not allowed
    if (!allowSpecialChars) {
      const originalLength = cleanedText.length;
      cleanedText = cleanedText.replace(/[^\w\s\-'&.,!?]/g, '');
      if (cleanedText.length !== originalLength) {
        correctionsMade.push('Removed special characters');
      }
    }

    // Normalize whitespace
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    // Check word count
    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
    if (words.length > maxWords) {
      issues.push(`Text exceeds ${maxWords} words (${words.length} words)`);
      cleanedText = words.slice(0, maxWords).join(' ');
      correctionsMade.push(`Truncated to ${maxWords} words`);
    }

    // Validate English words if required
    if (requireEnglish) {
      const suspiciousWords = words.filter(word => 
        !this.isLikelyEnglishWord(word.toLowerCase())
      );
      
      if (suspiciousWords.length > 0) {
        issues.push(`Suspicious non-English words: ${suspiciousWords.join(', ')}`);
      }
    }

    // Final quality check
    if (cleanedText.length < 3) {
      return {
        isValid: false,
        cleanedText: 'Professional Services',
        issues: [...issues, 'Text too short after cleaning'],
        correctionsMade: [...correctionsMade, 'Applied fallback text']
      };
    }

    return {
      isValid: issues.length === 0,
      cleanedText,
      issues,
      correctionsMade
    };
  }

  /**
   * Check if a word is likely to be English
   */
  private static isLikelyEnglishWord(word: string): boolean {
    // Check common words first
    if (this.COMMON_WORDS.has(word)) {
      return true;
    }

    // Check basic English patterns
    const englishPatterns = [
      /^[a-z]+$/,           // Only letters
      /^[a-z]+'[a-z]*$/,    // Contractions (don't, can't)
      /^[a-z]+ing$/,        // -ing endings
      /^[a-z]+ed$/,         // -ed endings
      /^[a-z]+er$/,         // -er endings
      /^[a-z]+ly$/,         // -ly endings
      /^[a-z]+tion$/,       // -tion endings
      /^[a-z]+ness$/,       // -ness endings
    ];

    return englishPatterns.some(pattern => pattern.test(word));
  }

  /**
   * Generate anti-corruption prompt additions
   */
  static getAntiCorruptionPrompt(targetText: string): string {
    return `
🚨 CRITICAL TEXT VALIDATION FOR: "${targetText}"

CORRUPTION PREVENTION CHECKLIST:
✅ Every character must be readable
✅ Every word must be proper English
✅ No random character sequences
✅ No encoding errors or artifacts
✅ Text must match exactly: "${targetText}"

FORBIDDEN PATTERNS (NEVER GENERATE):
❌ AUTTENG, BAMALE, COMEASUE
❌ repairent, tyaathfcoligetrick
❌ marchtstrg, areadnr, gaod
❌ Any corrupted character sequences
❌ Any non-English gibberish
❌ Any encoding-like errors

VALIDATION REQUIREMENTS:
- Use ONLY the text: "${targetText}"
- Ensure perfect spelling and readability
- Apply high contrast and clear typography
- Make text large, bold, and prominent
- Use professional fonts only
`;
  }

  /**
   * Pre-validate text before sending to AI
   */
  static preValidateForAI(text: string): { isValid: boolean; safeText: string; warnings: string[] } {
    const validation = this.validateText(text, {
      maxWords: 25,
      preventCorruption: true,
      requireEnglish: true
    });

    return {
      isValid: validation.isValid,
      safeText: validation.cleanedText,
      warnings: validation.issues
    };
  }
}
