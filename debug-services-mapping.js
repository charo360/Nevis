/**
 * Debug the services mapping to see what's happening
 */

const debugServicesMapping = async () => {
  console.log('🔍 Debugging Services Mapping...\n');

  const testUrl = 'https://www.starbucks.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    
    const response = await fetch('http://localhost:3001/api/analyze-brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: testUrl,
        designImageUris: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Response received!\n');
      
      const data = result.data;
      
      console.log('🔍 RAW SERVICE DATA FROM OPENROUTER:');
      console.log('='.repeat(60));
      console.log('keyServices type:', typeof data.keyServices);
      console.log('keyServices value:', data.keyServices);
      console.log('keyServices length:', Array.isArray(data.keyServices) ? data.keyServices.length : 'Not array');
      
      console.log('\ndetailedServiceDescriptions type:', typeof data.detailedServiceDescriptions);
      console.log('detailedServiceDescriptions value:', data.detailedServiceDescriptions);
      console.log('detailedServiceDescriptions length:', (data.detailedServiceDescriptions || '').length);
      
      console.log('\n🔍 WHAT THE MAPPING LOGIC SHOULD DO:');
      console.log('='.repeat(60));
      
      // Simulate the mapping logic
      let mappedServices = '';
      
      // First try to get detailed service descriptions
      if (data.detailedServiceDescriptions && data.detailedServiceDescriptions.length > 100) {
        mappedServices = data.detailedServiceDescriptions;
        console.log('✅ Using detailedServiceDescriptions');
      }
      // Then try service array
      else if (Array.isArray(data.keyServices) && data.keyServices.length > 0) {
        mappedServices = data.keyServices.join('\n\n');
        console.log('✅ Using keyServices array');
      }
      // Fallback to simple service list
      else if (typeof data.keyServices === 'string') {
        mappedServices = data.keyServices;
        console.log('✅ Using keyServices string');
      }
      else {
        mappedServices = 'Professional services';
        console.log('❌ Using fallback');
      }
      
      console.log('\nMapped services result:');
      console.log('Length:', mappedServices.length);
      console.log('Content preview:', mappedServices.substring(0, 200) + '...');
      
      console.log('\n🔍 ACTUAL MAPPED RESULT FROM SERVER ACTION:');
      console.log('='.repeat(60));
      
      // Test the server action to see what it actually returns
      const serverActionResponse = await fetch('http://localhost:3001/api/test-analyze-brand-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: testUrl,
          designImageUris: []
        })
      });

      if (serverActionResponse.ok) {
        const serverResult = await serverActionResponse.json();
        if (serverResult.success) {
          console.log('Server action services type:', typeof serverResult.data.services);
          console.log('Server action services length:', (serverResult.data.services || '').length);
          console.log('Server action services preview:', (serverResult.data.services || '').substring(0, 200) + '...');
        }
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

// Run the debug
debugServicesMapping();
