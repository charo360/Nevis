/**
 * Test Content Generation API
 * This file tests the actual API endpoint to verify business-specific content generation
 */

const testData = {
  businessType: 'restaurant',
  businessName: 'Samaki Cookies',
  location: 'Kenya',
  platform: 'Instagram',
  writingTone: 'friendly',
  contentThemes: ['quality', 'local', 'community'],
  targetAudience: 'food lovers, families, professionals',
  services: 'artisan cookies, custom orders, catering',
  keyFeatures: 'handmade, fresh ingredients, unique flavors',
  competitiveAdvantages: 'local ingredients, traditional recipes, community focus',
  dayOfWeek: 'Monday',
  currentDate: '2025-01-27',
  primaryColor: '#FF6B35',
  visualStyle: 'modern'
};

async function testContentGeneration() {
  console.log('🧪 Testing Content Generation API...\n');
  console.log('📊 Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n🚀 Making API request...\n');

  try {
    const response = await fetch('http://localhost:3000/api/advanced-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ API Response Received!');
    console.log('\n📝 Generated Content:');
    console.log('='.repeat(50));
    console.log(`🎯 Headline: "${result.headline}"`);
    console.log(`📝 Subheadline: "${result.subheadline}"`);
    console.log(`📱 Caption: "${result.content}"`);
    console.log(`🚀 CTA: "${result.callToAction}"`);
    console.log(`🏷️ Hashtags: ${result.hashtags.join(' ')}`);
    console.log('='.repeat(50));
    
    console.log('\n🧠 Business Intelligence:');
    console.log(`- Content Strategy: ${result.contentStrategy?.goal || 'N/A'}`);
    console.log(`- Business Strengths: ${result.businessStrengths?.join(', ') || 'N/A'}`);
    console.log(`- Market Opportunities: ${result.marketOpportunities?.join(', ') || 'N/A'}`);
    console.log(`- Value Proposition: ${result.valueProposition || 'N/A'}`);
    
    console.log('\n📊 Content Analysis:');
    console.log(`- Caption Length: ${result.content?.length || 0} characters`);
    console.log(`- Hashtag Count: ${result.hashtags?.length || 0}`);
    console.log(`- Platform: ${result.platform}`);
    console.log(`- Business Type: ${result.businessType}`);
    
    // Check for repetitive content
    const contentAnalysis = analyzeContentVariety(result);
    console.log('\n🔍 Content Variety Analysis:');
    console.log(`- Unique Phrases: ${contentAnalysis.uniquePhrases}`);
    console.log(`- Repetitive Elements: ${contentAnalysis.repetitiveElements.length > 0 ? contentAnalysis.repetitiveElements.join(', ') : 'None detected'}`);
    console.log(`- Variety Score: ${contentAnalysis.varietyScore}/10`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function analyzeContentVariety(result) {
  const allText = [
    result.headline || '',
    result.subheadline || '',
    result.content || '',
    result.callToAction || ''
  ].join(' ').toLowerCase();
  
  // Check for repetitive phrases
  const repetitivePhrases = [
    'kenya',
    'expert',
    'years experience',
    'comment below',
    'thoughts',
    'samaki cookies'
  ].filter(phrase => {
    const count = (allText.match(new RegExp(phrase, 'g')) || []).length;
    return count > 2; // More than 2 occurrences is repetitive
  });
  
  // Count unique words
  const words = allText.split(/\s+/).filter(word => word.length > 3);
  const uniqueWords = new Set(words);
  const uniquePhrases = uniqueWords.size;
  
  // Calculate variety score
  const varietyScore = Math.min(10, Math.floor((uniquePhrases / words.length) * 10));
  
  return {
    uniquePhrases,
    repetitiveElements: repetitivePhrases,
    varietyScore
  };
}

// Run the test
testContentGeneration();
