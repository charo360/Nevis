// Debug script to test the analysis flow
const { analyzeBrand } = require('./src/ai/flows/analyze-brand.ts');

async function debugAnalysis() {
  try {
    console.log('🔍 Testing brand analysis...');
    
    const result = await analyzeBrand({
      websiteUrl: 'https://techcorp.com',
      designImageUris: []
    });
    
    console.log('✅ Analysis result:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugAnalysis();
