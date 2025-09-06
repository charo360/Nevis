// Simple test script to call Imagen 4 API
const fetch = require('node-fetch');

async function testImagen4() {
  try {
    console.log('🧪 Testing Imagen 4 API...');
    
    const response = await fetch('http://localhost:9002/api/test-imagen4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A professional business card with clear text saying NEVIS AI'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result);
    } else {
      console.log('❌ Error:', result);
      console.log('Status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testImagen4();
