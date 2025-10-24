// Test the updated email template
require('dotenv').config({ path: '.env.local' });

async function testEmailTemplate() {
  console.log('🧪 Testing updated email template...');
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'josephwamiti8711@gmail.com'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Check your email for the new template');
      if (result.developmentCode) {
        console.log('🔧 Development code:', result.developmentCode);
      }
    } else {
      console.log('❌ Email failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailTemplate();



