import fetch from 'node-fetch';

async function testWebsiteAnalysis() {
  const payload = {
    website_content: "Welcome to TechCorp - We provide innovative technology solutions for businesses. Our services include web development, mobile apps, and cloud consulting. Contact us at info@techcorp.com or call 555-0123.",
    website_url: "https://techcorp.com",
    user_id: "test_user",
    user_tier: "free",
    design_images: null,
    temperature: 0.3,
    max_tokens: 8192
  };

  try {
    console.log('🔗 Making request to proxy server...');

    const response = await fetch('http://localhost:8000/analyze-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error response: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ Success! Result structure:');
    console.log('Keys:', Object.keys(result));

    if (result.data) {
      console.log('Data keys:', Object.keys(result.data));
      console.log('Business Name:', result.data.businessName);
      console.log('Description:', result.data.description?.substring(0, 100) + '...');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWebsiteAnalysis();
