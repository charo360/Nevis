/**
 * Test Text Readability Improvements
 * Verify that the enhanced prompt engineering prevents corrupted text
 */

import { TextValidationService } from './services/text-validation-service';
import { ENHANCED_PROMPT_TEMPLATE, NEGATIVE_PROMPT_ADDITIONS } from './prompts/text-readability-prompts';

// Test cases with known corrupted patterns
const TEST_CASES = [
  {
    name: 'Clean English Text',
    input: 'Professional Services Available',
    shouldPass: true
  },
  {
    name: 'Corrupted Pattern 1',
    input: 'AUTTENG, BAMALE, COMEASUE, YOUR',
    shouldPass: false,
    expectedIssues: ['Detected corrupted text pattern']
  },
  {
    name: 'Corrupted Pattern 2', 
    input: 'repairent tyaathfcoligetrick marchtstrg',
    shouldPass: false,
    expectedIssues: ['Detected corrupted text pattern']
  },
  {
    name: 'Mixed Clean and Corrupted',
    input: 'Professional AUTTENG Services',
    shouldPass: false,
    expectedIssues: ['Detected corrupted text pattern']
  },
  {
    name: 'Random Character Sequences',
    input: 'XYZQWRTYP MNBVCXZ Professional',
    shouldPass: false,
    expectedIssues: ['Detected corrupted text pattern']
  },
  {
    name: 'Normal Business Text',
    input: 'Get Started Today - Professional Quality',
    shouldPass: true
  },
  {
    name: 'Empty Text',
    input: '',
    shouldPass: false,
    expectedIssues: ['Text is empty']
  },
  {
    name: 'Too Long Text',
    input: 'This is a very long text that exceeds the maximum word limit for image generation and should be truncated to maintain quality and readability standards for social media posts and marketing materials',
    shouldPass: false,
    expectedIssues: ['Text exceeds 25 words']
  }
];

/**
 * Run text validation tests
 */
export function runTextValidationTests(): void {

  let passedTests = 0;
  let totalTests = TEST_CASES.length;

  TEST_CASES.forEach((testCase, index) => {

    const result = TextValidationService.validateText(testCase.input, {
      maxWords: 25,
      preventCorruption: true,
      requireEnglish: true
    });

    
    if (result.issues.length > 0) {
    }
    
    if (result.correctionsMade.length > 0) {
    }

    // Check if test passed
    const testPassed = result.isValid === testCase.shouldPass;
    if (testCase.expectedIssues && !testCase.shouldPass) {
      const hasExpectedIssues = testCase.expectedIssues.some(expectedIssue =>
        result.issues.some(actualIssue => actualIssue.includes(expectedIssue))
      );
      if (hasExpectedIssues) {
        passedTests++;
      } else {
      }
    } else if (testPassed) {
      passedTests++;
    } else {
    }

  });

  
  if (passedTests === totalTests) {
  } else {
  }
}

/**
 * Test prompt template generation
 */
export function testPromptTemplates(): void {

  const testTexts = [
    'Professional Services',
    'Get Started Today',
    'Quality Solutions Available'
  ];

  testTexts.forEach(text => {
    
    const enhancedPrompt = ENHANCED_PROMPT_TEMPLATE(text);
    
    // Check if anti-corruption measures are included
    const hasAntiCorruption = enhancedPrompt.includes('AUTTENG') && 
                             enhancedPrompt.includes('BAMALE') && 
                             enhancedPrompt.includes('COMEASUE');
    
    if (hasAntiCorruption) {
    } else {
    }

    // Check if negative prompt additions are comprehensive
    const hasNegativePrompts = NEGATIVE_PROMPT_ADDITIONS.includes('corrupted text') &&
                              NEGATIVE_PROMPT_ADDITIONS.includes('garbled text') &&
                              NEGATIVE_PROMPT_ADDITIONS.includes('AUTTENG');

    if (hasNegativePrompts) {
    } else {
    }

  });
}

/**
 * Run all tests
 */
export function runAllTextReadabilityTests(): void {
  
  runTextValidationTests();
  testPromptTemplates();
  
}

// Export for use in other files
export { TextValidationService };
