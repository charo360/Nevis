// Test script to verify Crevo website can be scraped properly

async function testCrevoScraping() {
  const fetch = (await import('node-fetch')).default;
  console.log('🧪 Testing Crevo website scraping...\n');

  try {
    // Fetch the website
    const response = await fetch('https://crevo.app', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    console.log(`✅ Fetched HTML (${html.length} chars)\n`);

    // Extract metadata
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title';
    console.log(`📌 Title: ${title}\n`);

    // Extract meta description (try multiple sources)
    const metaDescription = 
      html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]+)"/i)?.[1] ||
      '';
    
    console.log(`📝 Meta Description (${metaDescription.length} chars):`);
    console.log(metaDescription.substring(0, 500));
    console.log('...\n');

    // Extract keywords
    const metaKeywords = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i)?.[1] || '';
    console.log(`🔑 Keywords: ${metaKeywords}\n`);

    // Extract JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    console.log(`📊 Found ${jsonLdMatches.length} JSON-LD schemas\n`);

    jsonLdMatches.forEach((match, index) => {
      const jsonContent = match.replace(/<script[^>]*type="application\/ld\+json"[^>]*>/, '').replace(/<\/script>/, '');
      try {
        const parsed = JSON.parse(jsonContent);
        console.log(`Schema ${index + 1} (@type: ${parsed['@type']}):`);
        console.log(JSON.stringify(parsed, null, 2).substring(0, 300));
        console.log('...\n');
      } catch (e) {
        console.log(`Schema ${index + 1}: Invalid JSON\n`);
      }
    });

    // Check if we have enough content
    const hasRichMetadata = metaDescription.length > 200 || metaKeywords.length > 50 || jsonLdMatches.length > 0;
    
    console.log('\n📊 SCRAPING ASSESSMENT:');
    console.log(`✅ Title: ${title.length > 0 ? 'Found' : 'Missing'}`);
    console.log(`✅ Meta Description: ${metaDescription.length} chars (${metaDescription.length > 200 ? 'Rich' : 'Minimal'})`);
    console.log(`✅ Keywords: ${metaKeywords.length > 0 ? 'Found' : 'Missing'}`);
    console.log(`✅ Structured Data: ${jsonLdMatches.length} schemas`);
    console.log(`\n${hasRichMetadata ? '✅ SUCCESS' : '❌ FAILED'}: ${hasRichMetadata ? 'Website has rich metadata for scraping' : 'Insufficient metadata'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCrevoScraping();
