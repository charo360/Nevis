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
    
    
    
    
    // Check for repetitive content
    const contentAnalysis = analyzeContentVariety(result);
    
  } catch (error) {
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
