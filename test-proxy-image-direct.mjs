import fetch from 'node-fetch';

async function testProxyImageDirect() {
  try {
    console.log('🔧 Testing Proxy Image Generation Directly...');
    
    // Test simple image generation without logo first
    console.log('\n1️⃣ Testing simple image generation...');
    
    const simpleResponse = await fetch('http://localhost:8000/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test-user',
        user_tier: 'free',
        model: 'gemini-2.5-flash-image-preview',
        prompt: 'A simple red circle on white background'
      })
    });

    console.log('Simple Image Response Status:', simpleResponse.status);
    
    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log('✅ Simple image generation working!');
      console.log('Model used:', simpleData.model_used);
      console.log('Provider:', simpleData.provider_used);
      
      // Now test with logo
      console.log('\n2️⃣ Testing image generation with logo...');
      
      const testLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABYSURBVBiVY2RgYPgPBQw4wH8cYBQqZGBg+I8VjEKFDAwM/7GCUaiQgYHhP1YwChUyMDD8xwpGoUIGBob/WMEoVMjAwPAfKxiFChkYGP5jBaNQIQMDw3+sAADKVQX/2JK1NQAAAABJRU5ErkJggg==';
      
      const logoResponse = await fetch('http://localhost:8000/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'test-user',
          user_tier: 'free',
          model: 'gemini-2.5-flash-image-preview',
          prompt: 'Create a professional business card design. You must prominently include the provided logo image.',
          logoImage: testLogo
        })
      });

      console.log('Logo Image Response Status:', logoResponse.status);
      
      if (logoResponse.ok) {
        const logoData = await logoResponse.json();
        console.log('✅ Logo image generation working!');
        console.log('Model used:', logoData.model_used);
        console.log('Provider:', logoData.provider_used);
        console.log('Credits remaining:', logoData.user_credits);
      } else {
        const logoError = await logoResponse.text();
        console.log('❌ Logo image generation failed:', logoError);
      }
      
    } else {
      const simpleError = await simpleResponse.text();
      console.log('❌ Simple image generation failed:', simpleError);
    }
    
  } catch (error) {
    console.error('❌ Error testing proxy:', error.message);
  }
}

testProxyImageDirect();
