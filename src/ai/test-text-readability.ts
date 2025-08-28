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
  console.log('🧪 Running Text Validation Tests...\n');

  let passedTests = 0;
  let totalTests = TEST_CASES.length;

  TEST_CASES.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);

    const result = TextValidationService.validateText(testCase.input, {
      maxWords: 25,
      preventCorruption: true,
      requireEnglish: true
    });

    console.log(`Expected to pass: ${testCase.shouldPass}`);
    console.log(`Actually passed: ${result.isValid}`);
    console.log(`Cleaned text: "${result.cleanedText}"`);
    
    if (result.issues.length > 0) {
      console.log(`Issues found: ${result.issues.join(', ')}`);
    }
    
    if (result.correctionsMade.length > 0) {
      console.log(`Corrections made: ${result.correctionsMade.join(', ')}`);
    }

    // Check if test passed
    const testPassed = result.isValid === testCase.shouldPass;
    if (testCase.expectedIssues && !testCase.shouldPass) {
      const hasExpectedIssues = testCase.expectedIssues.some(expectedIssue =>
        result.issues.some(actualIssue => actualIssue.includes(expectedIssue))
      );
      if (hasExpectedIssues) {
        console.log('✅ Test PASSED - Expected issues detected');
        passedTests++;
      } else {
        console.log('❌ Test FAILED - Expected issues not detected');
      }
    } else if (testPassed) {
      console.log('✅ Test PASSED');
      passedTests++;
    } else {
      console.log('❌ Test FAILED');
    }

    console.log('---\n');
  });

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Text validation is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review the validation logic.');
  }
}

/**
 * Test prompt template generation
 */
export function testPromptTemplates(): void {
  console.log('\n🎨 Testing Prompt Templates...\n');

  const testTexts = [
    'Professional Services',
    'Get Started Today',
    'Quality Solutions Available'
  ];

  testTexts.forEach(text => {
    console.log(`Testing prompt for: "${text}"`);
    
    const enhancedPrompt = ENHANCED_PROMPT_TEMPLATE(text);
    console.log('Enhanced prompt generated ✅');
    
    // Check if anti-corruption measures are included
    const hasAntiCorruption = enhancedPrompt.includes('AUTTENG') && 
                             enhancedPrompt.includes('BAMALE') && 
                             enhancedPrompt.includes('COMEASUE');
    
    if (hasAntiCorruption) {
      console.log('✅ Anti-corruption patterns included in prompt');
    } else {
      console.log('❌ Anti-corruption patterns missing from prompt');
    }

    // Check if negative prompt additions are comprehensive
    const hasNegativePrompts = NEGATIVE_PROMPT_ADDITIONS.includes('corrupted text') &&
                              NEGATIVE_PROMPT_ADDITIONS.includes('garbled text') &&
                              NEGATIVE_PROMPT_ADDITIONS.includes('AUTTENG');

    if (hasNegativePrompts) {
      console.log('✅ Comprehensive negative prompts included');
    } else {
      console.log('❌ Negative prompts incomplete');
    }

    console.log('---\n');
  });
}

/**
 * Run all tests
 */
export function runAllTextReadabilityTests(): void {
  console.log('🚀 Starting Comprehensive Text Readability Tests\n');
  
  runTextValidationTests();
  testPromptTemplates();
  
  console.log('\n✨ Text readability testing complete!');
  console.log('\n📋 Summary of Improvements:');
  console.log('• Anti-corruption pattern detection');
  console.log('• Comprehensive text validation');
  console.log('• Enhanced prompt templates');
  console.log('• Negative prompt additions');
  console.log('• English word validation');
  console.log('• Automatic text cleaning and correction');
}

// Export for use in other files
export { TextValidationService };
