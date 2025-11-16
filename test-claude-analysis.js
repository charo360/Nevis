/**
 * Simple test script to demonstrate Claude-based website analysis
 * Run with: node test-claude-analysis.js
 */

const { demonstrateClaudeAnalysis } = require('./src/lib/utils/claude-test-examples');

async function main() {
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY environment variable is required');
    console.log('Please set your Anthropic API key:');
    console.log('export ANTHROPIC_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  console.log('🚀 Testing Claude-Enhanced Website Analysis');
  console.log('==========================================');
  console.log(`API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');

  try {
    // Test the new Claude-based analysis
    const results = await demonstrateClaudeAnalysis(apiKey);
    
    console.log('\n🎉 DEMONSTRATION COMPLETE!');
    console.log('==========================');
    
    if (results.zenTechResult.success) {
      console.log('✅ ZenTech Electronics analysis: SUCCESS');
      console.log(`   Data quality: ${results.zenTechResult.dataQuality}`);
      console.log(`   Execution time: ${results.zenTechResult.executionTime}ms`);
    } else {
      console.log('❌ ZenTech Electronics analysis: FAILED');
      console.log(`   Error: ${results.zenTechResult.error}`);
    }
    
    console.log(`\n📊 Test Suite Summary:`);
    console.log(`   Total tests: ${results.suiteResults.summary.totalTests}`);
    console.log(`   Successful: ${results.suiteResults.summary.successful}`);
    console.log(`   Failed: ${results.suiteResults.summary.failed}`);
    console.log(`   Average time: ${results.suiteResults.summary.averageExecutionTime}ms`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
main().catch(console.error);
