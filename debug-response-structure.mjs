import fetch from 'node-fetch';

async function testProxyResponse() {
  try {
    console.log('🔍 Testing proxy response structure...');
    
    const response = await fetch('http://localhost:8000/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test-user',
        user_tier: 'free',
        model: 'gemini-2.5-flash-image-preview',
        prompt: 'A simple red circle'
      })
    });

    const data = await response.json();
    
    console.log('📦 Full response structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Try to find the base64 data
    console.log('\n🔍 Looking for base64 data...');
    
    if (data.success && data.data) {
      console.log('✅ Response is successful');
      console.log('📊 data keys:', Object.keys(data.data));
      
      if (data.data.response) {
        console.log('📊 data.response keys:', Object.keys(data.data.response));
        
        if (data.data.response.candidates) {
          console.log('📊 candidates length:', data.data.response.candidates.length);
          
          if (data.data.response.candidates[0]) {
            console.log('📊 candidate[0] keys:', Object.keys(data.data.response.candidates[0]));
            
            if (data.data.response.candidates[0].content) {
              console.log('📊 content keys:', Object.keys(data.data.response.candidates[0].content));
              
              if (data.data.response.candidates[0].content.parts) {
                console.log('📊 parts length:', data.data.response.candidates[0].content.parts.length);
                
                if (data.data.response.candidates[0].content.parts[0]) {
                  console.log('📊 part[0] keys:', Object.keys(data.data.response.candidates[0].content.parts[0]));
                  
                  if (data.data.response.candidates[0].content.parts[0].inlineData) {
                    console.log('📊 inlineData keys:', Object.keys(data.data.response.candidates[0].content.parts[0].inlineData));
                    
                    const base64Data = data.data.response.candidates[0].content.parts[0].inlineData.data;
                    console.log('🎯 Found base64 data!');
                    console.log('📏 Base64 data type:', typeof base64Data);
                    console.log('📏 Base64 data length:', base64Data ? base64Data.length : 'null');
                    console.log('📏 First 100 chars:', base64Data ? base64Data.substring(0, 100) : 'null');
                  }
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProxyResponse();
