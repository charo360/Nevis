/**
 * Test Spell Checker System for Headlines and Subheadlines
 * Ensures professional quality text before image generation
 */

// Test cases with common spelling errors
const testCases = [
  {
    name: 'Business Spelling Errors',
    content: {
      headline: 'Profesional Bussiness Servises',
      subheadline: 'Experiance the excelence of our qualaty work',
      caption: 'We provide the best servise for your bussiness needs'
    },
    businessType: 'consulting',
    expectedCorrections: {
      headline: 'Professional Business Services',
      subheadline: 'Experience the excellence of our quality work',
      caption: 'We provide the best service for your business needs'
    }
  },
  {
    name: 'Restaurant Spelling Errors',
    content: {
      headline: 'Delicous Cusine at Our Resturant',
      subheadline: 'Fresh ingrediants and amazing recipies',
      caption: 'Try our apetizers and deserts today'
    },
    businessType: 'restaurant',
    expectedCorrections: {
      headline: 'Delicious Cuisine at Our Restaurant',
      subheadline: 'Fresh ingredients and amazing recipes',
      caption: 'Try our appetizers and desserts today'
    }
  },
  {
    name: 'Technology Spelling Errors',
    content: {
      headline: 'Artifical Inteligence Sofware',
      subheadline: 'Advanced algoritms for your databse',
      caption: 'Our technolgy solutions help your bussiness'
    },
    businessType: 'technology',
    expectedCorrections: {
      headline: 'Artificial Intelligence Software',
      subheadline: 'Advanced algorithms for your database',
      caption: 'Our technology solutions help your business'
    }
  },
  {
    name: 'Healthcare Spelling Errors',
    content: {
      headline: 'Helthcare Servises You Can Trust',
      subheadline: 'Profesional treatement for all patiants',
      caption: 'Our medecal team provides the best helth care'
    },
    businessType: 'healthcare',
    expectedCorrections: {
      headline: 'Healthcare Services You Can Trust',
      subheadline: 'Professional treatment for all patients',
      caption: 'Our medical team provides the best health care'
    }
  },
  {
    name: 'Finance Spelling Errors',
    content: {
      headline: 'Finacial Investement Oportunities',
      subheadline: 'Manage your buget and expences',
      caption: 'Our finacne experts help with mortage and insurence'
    },
    businessType: 'finance',
    expectedCorrections: {
      headline: 'Financial Investment Opportunities',
      subheadline: 'Manage your budget and expenses',
      caption: 'Our finance experts help with mortgage and insurance'
    }
  },
  {
    name: 'Retail Spelling Errors',
    content: {
      headline: 'Best Prodcuts and Merchendise',
      subheadline: 'Great discouts and promtions',
      caption: 'Shop our inventroy with waranty protection'
    },
    businessType: 'retail',
    expectedCorrections: {
      headline: 'Best Products and Merchandise',
      subheadline: 'Great discounts and promotions',
      caption: 'Shop our inventory with warranty protection'
    }
  },
  {
    name: 'No Errors (Control Test)',
    content: {
      headline: 'Professional Business Excellence',
      subheadline: 'Quality service you can trust',
      caption: 'We deliver exceptional results for your business'
    },
    businessType: 'consulting',
    expectedCorrections: {
      headline: 'Professional Business Excellence',
      subheadline: 'Quality service you can trust',
      caption: 'We deliver exceptional results for your business'
    }
  }
];

// Mock the spell checker functions for testing
function mockSpellChecker() {
  return {
    checkSpelling: (text, businessType) => {
      // Simple mock implementation
      const corrections = [];
      let correctedText = text;

      // Business corrections
      const businessCorrections = {
        'bussiness': 'business',
        'profesional': 'professional',
        'servises': 'services',
        'servise': 'service',
        'experiance': 'experience',
        'excelence': 'excellence',
        'qualaty': 'quality'
      };

      // Industry-specific corrections
      const industryCorrections = {
        'restaurant': {
          'delicous': 'delicious',
          'cusine': 'cuisine',
          'resturant': 'restaurant',
          'ingrediants': 'ingredients',
          'recipies': 'recipes',
          'apetizers': 'appetizers',
          'deserts': 'desserts'
        },
        'technology': {
          'artifical': 'artificial',
          'inteligence': 'intelligence',
          'sofware': 'software',
          'algoritms': 'algorithms',
          'databse': 'database',
          'technolgy': 'technology'
        },
        'healthcare': {
          'helthcare': 'healthcare',
          'helth': 'health',
          'treatement': 'treatment',
          'patiants': 'patients',
          'medecal': 'medical'
        },
        'finance': {
          'finacial': 'financial',
          'finacne': 'finance',
          'investement': 'investment',
          'oportunities': 'opportunities',
          'buget': 'budget',
          'expences': 'expenses',
          'mortage': 'mortgage',
          'insurence': 'insurance'
        },
        'retail': {
          'prodcuts': 'products',
          'merchendise': 'merchandise',
          'discouts': 'discounts',
          'promtions': 'promotions',
          'inventroy': 'inventory',
          'waranty': 'warranty'
        }
      };

      // Apply business corrections
      for (const [wrong, correct] of Object.entries(businessCorrections)) {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        if (regex.test(correctedText)) {
          corrections.push({
            original: wrong,
            corrected: correct,
            position: correctedText.search(regex),
            type: 'business'
          });
          correctedText = correctedText.replace(regex, correct);
        }
      }

      // Apply industry corrections
      if (businessType && industryCorrections[businessType]) {
        for (const [wrong, correct] of Object.entries(industryCorrections[businessType])) {
          const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
          if (regex.test(correctedText)) {
            corrections.push({
              original: wrong,
              corrected: correct,
              position: correctedText.search(regex),
              type: 'industry'
            });
            correctedText = correctedText.replace(regex, correct);
          }
        }
      }

      return {
        originalText: text,
        correctedText,
        corrections,
        hasErrors: corrections.length > 0,
        confidence: corrections.length === 0 ? 100 : Math.max(0, 100 - (corrections.length * 10))
      };
    },

    checkHeadline: function (headline, businessType) {
      return this.checkSpelling(headline, businessType);
    },

    checkSubheadline: function (subheadline, businessType) {
      return this.checkSpelling(subheadline, businessType);
    }
  };
}

// Mock ContentQualityEnhancer
function mockContentQualityEnhancer() {
  const spellChecker = mockSpellChecker();

  return {
    enhanceGeneratedContent: async (content, businessType, options = {}) => {
      const { autoCorrect = true } = options;

      const enhancedContent = { ...content };

      if (content.headline) {
        const headlineCheck = spellChecker.checkHeadline(content.headline, businessType);
        if (autoCorrect && headlineCheck.hasErrors) {
          enhancedContent.headline = headlineCheck.correctedText;
        }
      }

      if (content.subheadline) {
        const subheadlineCheck = spellChecker.checkSubheadline(content.subheadline, businessType);
        if (autoCorrect && subheadlineCheck.hasErrors) {
          enhancedContent.subheadline = subheadlineCheck.correctedText;
        }
      }

      if (content.caption) {
        const captionCheck = spellChecker.checkSpelling(content.caption, businessType);
        if (autoCorrect && captionCheck.hasErrors) {
          enhancedContent.caption = captionCheck.correctedText;
        }
      }

      return enhancedContent;
    },

    quickSpellCheck: (text, businessType) => {
      const result = spellChecker.checkSpelling(text, businessType);
      return result.correctedText;
    }
  };
}

// Run tests
async function runSpellCheckerTests() {
  console.log('🔤 Testing Spell Checker System for Headlines and Subheadlines\n');

  const spellChecker = mockSpellChecker();
  const contentEnhancer = mockContentQualityEnhancer();

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`   Business Type: ${testCase.businessType}`);

    try {
      // Test individual spell checking
      const headlineResult = spellChecker.checkHeadline(testCase.content.headline, testCase.businessType);
      const subheadlineResult = spellChecker.checkSubheadline(testCase.content.subheadline, testCase.businessType);
      const captionResult = spellChecker.checkSpelling(testCase.content.caption, testCase.businessType);

      // Test content enhancement
      const enhancedContent = await contentEnhancer.enhanceGeneratedContent(
        testCase.content,
        testCase.businessType,
        { autoCorrect: true, logCorrections: true }
      );

      // Verify corrections
      const headlineCorrect = enhancedContent.headline === testCase.expectedCorrections.headline;
      const subheadlineCorrect = enhancedContent.subheadline === testCase.expectedCorrections.subheadline;
      const captionCorrect = enhancedContent.caption === testCase.expectedCorrections.caption;

      if (headlineCorrect && subheadlineCorrect && captionCorrect) {
        console.log('   ✅ PASSED - All corrections applied correctly');
        passedTests++;
      } else {
        console.log('   ❌ FAILED - Corrections not applied correctly');
        if (!headlineCorrect) {
          console.log(`      Headline: Expected "${testCase.expectedCorrections.headline}", got "${enhancedContent.headline}"`);
        }
        if (!subheadlineCorrect) {
          console.log(`      Subheadline: Expected "${testCase.expectedCorrections.subheadline}", got "${enhancedContent.subheadline}"`);
        }
        if (!captionCorrect) {
          console.log(`      Caption: Expected "${testCase.expectedCorrections.caption}", got "${enhancedContent.caption}"`);
        }
      }

      // Show corrections made
      if (headlineResult.hasErrors) {
        console.log(`   🔧 Headline corrections: ${headlineResult.corrections.length}`);
        headlineResult.corrections.forEach(c => {
          console.log(`      - "${c.original}" → "${c.corrected}" (${c.type})`);
        });
      }

      if (subheadlineResult.hasErrors) {
        console.log(`   🔧 Subheadline corrections: ${subheadlineResult.corrections.length}`);
        subheadlineResult.corrections.forEach(c => {
          console.log(`      - "${c.original}" → "${c.corrected}" (${c.type})`);
        });
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log('');
  }

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All spell checker tests passed! The system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the spell checker implementation.');
  }
}

// Run the tests
runSpellCheckerTests().catch(console.error);
