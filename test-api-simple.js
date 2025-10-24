// Simple test for the analyze-brand API
async function testAPI() {
  try {
    console.log('🧪 Testing analyze-brand API...');

    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: 'https://stripe.com'
      })
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('✅ Success:', data.success);

    if (data.success) {
      console.log('📊 Business Name:', data.data?.businessName || 'none');
      console.log('📊 Competitive Advantages:', data.data?.competitiveAdvantages?.length || 0, 'items');
      console.log('📊 Content Themes:', data.data?.contentThemes?.length || 0, 'items');
      console.log('📊 Phone:', data.data?.contactInfo?.phone || 'none');
      console.log('📊 Email:', data.data?.contactInfo?.email || 'none');

      if (data.data?.competitiveAdvantages?.length > 0) {
        console.log('🎯 First Competitive Advantage:', data.data.competitiveAdvantages[0].substring(0, 100) + '...');
      }

      if (data.data?.contentThemes?.length > 0) {
        const themes = Array.isArray(data.data.contentThemes) ? data.data.contentThemes : [data.data.contentThemes];
        console.log('🎨 Content Themes:', themes.join(', '));
      }
    } else {
      console.log('❌ Error:', data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
