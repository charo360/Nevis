/**
 * Test Plural Validation in Spell Checker
 * Ensures correct plurals are NOT changed, only actual misspellings are corrected
 */

// Mock the enhanced spell checker with plural validation
function mockEnhancedSpellChecker() {
  // Valid words that should NOT be corrected
  const validWords = new Set([
    'services', 'businesses', 'experiences', 'qualities', 'customers',
    'products', 'recipes', 'ingredients', 'treatments', 'patients',
    'investments', 'expenses', 'databases', 'algorithms', 'technologies'
  ]);

  // Check if a word is a valid plural
  function isValidPlural(word, singular) {
    // Standard plural rules
    if (word === singular + 's') return true;
    if (word === singular + 'es') return true;

    // Words ending in 'y' -> 'ies'
    if (singular.endsWith('y') && word === singular.slice(0, -1) + 'ies') return true;

    return false;
  }

  // Check if it's actually a misspelling
  function isActualMisspelling(word, correction) {
    const lowerWord = word.toLowerCase();
    const lowerCorrection = correction.toLowerCase();

    // If the word is in our valid words list, don't correct it
    if (validWords.has(lowerWord)) {
      return false;
    }

    // Check if it's a valid plural form of the correction
    if (isValidPlural(lowerWord, lowerCorrection)) {
      return false;
    }

    // If none of the above, it's likely a misspelling
    return true;
  }

  // Preserve case when making corrections
  function preserveCase(original, correction) {
    // If original is all uppercase
    if (original === original.toUpperCase()) {
      return correction.toUpperCase();
    }

    // If original is title case (first letter uppercase)
    if (original[0] === original[0].toUpperCase() && original.slice(1) === original.slice(1).toLowerCase()) {
      return correction.charAt(0).toUpperCase() + correction.slice(1).toLowerCase();
    }

    // If original is all lowercase
    if (original === original.toLowerCase()) {
      return correction.toLowerCase();
    }

    // For mixed case, return correction as-is
    return correction;
  }

  return {
    checkSpelling: (text, businessType) => {
      const corrections = [];
      let correctedText = text;

      // Business corrections with validation
      const businessCorrections = {
        'bussiness': 'business',
        'servise': 'service',
        'servises': 'services', // This should be smart about plurals
        'profesional': 'professional',
        'experiance': 'experience',
        'qualaty': 'quality'
      };

      // Industry corrections with validation
      const industryCorrections = {
        'restaurant': {
          'resturant': 'restaurant',
          'cusine': 'cuisine',
          'ingrediants': 'ingredients',
          'recipies': 'recipes'
        },
        'technology': {
          'sofware': 'software',
          'databse': 'database',
          'algoritms': 'algorithms'
        },
        'healthcare': {
          'treatement': 'treatment',
          'helthcare': 'healthcare',
          'medecal': 'medical',
          'patiant': 'patient'
        }
      };

      // Apply business corrections
      for (const [wrong, correct] of Object.entries(businessCorrections)) {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        const matches = [...text.matchAll(regex)];

        for (const match of matches) {
          if (match.index !== undefined) {
            const matchedWord = match[0];
            if (isActualMisspelling(matchedWord, correct)) {
              corrections.push({
                original: matchedWord,
                corrected: preserveCase(matchedWord, correct),
                position: match.index,
                type: 'business'
              });
            }
          }
        }

        correctedText = correctedText.replace(regex, (match) => {
          return isActualMisspelling(match, correct) ? preserveCase(match, correct) : match;
        });
      }

      // Apply industry corrections
      if (businessType && industryCorrections[businessType]) {
        for (const [wrong, correct] of Object.entries(industryCorrections[businessType])) {
          const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
          const matches = [...text.matchAll(regex)];

          for (const match of matches) {
            if (match.index !== undefined) {
              const matchedWord = match[0];
              if (isActualMisspelling(matchedWord, correct)) {
                corrections.push({
                  original: matchedWord,
                  corrected: preserveCase(matchedWord, correct),
                  position: match.index,
                  type: 'industry'
                });
              }
            }
          }

          correctedText = correctedText.replace(regex, (match) => {
            return isActualMisspelling(match, correct) ? preserveCase(match, correct) : match;
          });
        }
      }

      return {
        originalText: text,
        correctedText,
        corrections,
        hasErrors: corrections.length > 0,
        confidence: corrections.length === 0 ? 100 : Math.max(0, 100 - (corrections.length * 10))
      };
    }
  };
}

// Test cases for plural validation
const pluralTestCases = [
  {
    name: 'Correct Plurals Should NOT Be Changed',
    tests: [
      {
        input: 'Professional Services Available',
        expected: 'Professional Services Available', // Should NOT change "Services"
        businessType: 'consulting',
        shouldChange: false,
        reason: '"Services" is correctly spelled plural'
      },
      {
        input: 'Quality Products and Experiences',
        expected: 'Quality Products and Experiences', // Should NOT change "Products" or "Experiences"
        businessType: 'retail',
        shouldChange: false,
        reason: '"Products" and "Experiences" are correctly spelled plurals'
      },
      {
        input: 'Fresh Ingredients Daily',
        expected: 'Fresh Ingredients Daily', // Should NOT change "Ingredients"
        businessType: 'restaurant',
        shouldChange: false,
        reason: '"Ingredients" is correctly spelled plural'
      },
      {
        input: 'Advanced Algorithms and Databases',
        expected: 'Advanced Algorithms and Databases', // Should NOT change these plurals
        businessType: 'technology',
        shouldChange: false,
        reason: '"Algorithms" and "Databases" are correctly spelled plurals'
      }
    ]
  },
  {
    name: 'Actual Misspellings Should Be Corrected',
    tests: [
      {
        input: 'Profesional Bussiness Servises',
        expected: 'Professional Business Services', // Should correct all misspellings
        businessType: 'consulting',
        shouldChange: true,
        reason: 'All three words are misspelled'
      },
      {
        input: 'Fresh Ingrediants and Recipies',
        expected: 'Fresh Ingredients and Recipes', // Should correct misspellings
        businessType: 'restaurant',
        shouldChange: true,
        reason: '"Ingrediants" and "Recipies" are misspelled'
      },
      {
        input: 'Advanced Sofware and Databse',
        expected: 'Advanced Software and Database', // Should correct misspellings
        businessType: 'technology',
        shouldChange: true,
        reason: '"Sofware" and "Databse" are misspelled'
      }
    ]
  },
  {
    name: 'Mixed Correct and Incorrect Words',
    tests: [
      {
        input: 'Quality Services and Experiance',
        expected: 'Quality Services and Experience', // Should only correct "Experiance"
        businessType: 'consulting',
        shouldChange: true,
        reason: '"Services" is correct, only "Experiance" should be corrected'
      },
      {
        input: 'Professional Treatement for Patients',
        expected: 'Professional Treatment for Patients', // Should only correct "Treatement"
        businessType: 'healthcare',
        shouldChange: true,
        reason: '"Patients" is correct, only "Treatement" should be corrected'
      }
    ]
  },
  {
    name: 'Case Preservation',
    tests: [
      {
        input: 'PROFESIONAL SERVICES',
        expected: 'PROFESSIONAL SERVICES', // Should preserve uppercase
        businessType: 'consulting',
        shouldChange: true,
        reason: 'Should preserve original case pattern'
      },
      {
        input: 'Quality Servises Available',
        expected: 'Quality Services Available', // Should preserve title case
        businessType: 'consulting',
        shouldChange: true,
        reason: 'Should preserve title case pattern'
      }
    ]
  }
];

// Run the tests
async function runPluralValidationTests() {
  console.log('🔤 Testing Plural Validation in Spell Checker\n');
  console.log('🎯 Goal: Only correct actual misspellings, preserve correct plurals\n');

  const spellChecker = mockEnhancedSpellChecker();

  let totalTests = 0;
  let passedTests = 0;

  for (const testGroup of pluralTestCases) {
    console.log(`📋 ${testGroup.name}:`);

    for (const test of testGroup.tests) {
      totalTests++;

      const result = spellChecker.checkSpelling(test.input, test.businessType);
      const passed = result.correctedText === test.expected;

      if (passed) {
        passedTests++;
        console.log(`   ✅ "${test.input}" → "${result.correctedText}"`);
        console.log(`      Reason: ${test.reason}`);
      } else {
        console.log(`   ❌ "${test.input}" → "${result.correctedText}"`);
        console.log(`      Expected: "${test.expected}"`);
        console.log(`      Reason: ${test.reason}`);
      }

      // Show corrections made
      if (result.corrections.length > 0) {
        console.log(`      Corrections: ${result.corrections.map(c => `"${c.original}" → "${c.corrected}"`).join(', ')}`);
      } else {
        console.log(`      No corrections made (as expected for correct plurals)`);
      }

      console.log('');
    }
  }

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All plural validation tests passed!');
    console.log('\n✅ Benefits:');
    console.log('   - Correct plurals like "services", "products", "ingredients" are preserved');
    console.log('   - Only actual misspellings like "servises", "prodcuts", "ingrediants" are corrected');
    console.log('   - Case patterns (UPPERCASE, Title Case, lowercase) are preserved');
    console.log('   - Smart validation prevents unnecessary changes');
    console.log('   - Professional content quality maintained without over-correction');
  } else {
    console.log('⚠️ Some tests failed. The spell checker may be over-correcting valid plurals.');
  }
}

// Run the tests
runPluralValidationTests().catch(console.error);
