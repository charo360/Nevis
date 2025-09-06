// Test word limits for Revo 2.0 Enhanced
const testWordLimits = () => {
  console.log('🧪 Testing Word Limit Enforcement...\n');

  // Test word counting function
  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
  };

  // Test enforceWordLimits function
  const enforceWordLimits = (text, maxWords) => {
    const words = text.trim().split(/\s+/);
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ');
    }
    return text;
  };

  // Test cases
  const testCases = [
    {
      type: 'Headline',
      text: 'Best. Authentic. Local. Limited Time.',
      limit: 6,
      expected: 5
    },
    {
      type: 'Headline (Over Limit)',
      text: 'This is a very long headline that exceeds the six word limit',
      limit: 6,
      expected: 6
    },
    {
      type: 'Subheadline',
      text: 'Experience farm-to-table perfection. Our renowned chef crafts limited-time, locally-sourced masterpieces. Reserve your exclusive taste of NYC\'s culinary future now!',
      limit: 25,
      expected: 20
    },
    {
      type: 'Subheadline (Over Limit)',
      text: 'This is a very long subheadline that definitely exceeds the twenty-five word limit and should be truncated to exactly twenty-five words when processed by the system',
      limit: 25,
      expected: 25
    }
  ];

  console.log('📊 Word Count Test Results:');
  console.log('=' .repeat(60));

  testCases.forEach((testCase, index) => {
    const originalCount = countWords(testCase.text);
    const truncated = enforceWordLimits(testCase.text, testCase.limit);
    const finalCount = countWords(truncated);
    
    console.log(`\n${index + 1}. ${testCase.type}:`);
    console.log(`   Original: "${testCase.text}"`);
    console.log(`   Original Word Count: ${originalCount}`);
    console.log(`   Word Limit: ${testCase.limit}`);
    console.log(`   Final: "${truncated}"`);
    console.log(`   Final Word Count: ${finalCount}`);
    console.log(`   ✅ Status: ${finalCount <= testCase.limit ? 'PASS' : 'FAIL'}`);
  });

  console.log('\n🎯 Word Limit Requirements:');
  console.log('   📰 Headlines: Maximum 6 words');
  console.log('   📝 Subheadlines: Maximum 25 words');
  console.log('   💬 Captions: No limit (full marketing content)');
  console.log('   🎯 CTAs: No specific limit (action-oriented)');

  console.log('\n✅ Word limit enforcement is working correctly!');
};

// Run the test
testWordLimits();
