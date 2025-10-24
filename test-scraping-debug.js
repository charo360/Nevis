/**
 * Simple test to check scraping debug output
 */

async function testScraping() {
  console.log('🔍 Testing scraping debug...');

  try {
    const response = await fetch('http://localhost:3001/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://shopify.com' })
    });

    const result = await response.json();
    console.log('📊 Response Status:', response.status);
    console.log('📊 Success:', result.success);

    if (result.success) {
      console.log('📄 Content Length:', result.data?.content?.length || 0);
      console.log('📄 Content Preview:', result.data?.content?.substring(0, 200) + '...');
      console.log('📞 Phone Numbers:', result.data?.phoneNumbers || []);
      console.log('🏆 Competitive Advantages:', result.data?.competitiveAdvantages || []);
      console.log('🎯 Content Themes:', result.data?.contentThemes || []);
      console.log('📋 Headings:', result.data?.headings || {});
      console.log('📝 Paragraphs Count:', result.data?.paragraphs?.length || 0);
    } else {
      console.log('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testScraping().catch(console.error);
