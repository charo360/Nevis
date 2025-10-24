/**
 * Test the service mapping logic to see what's being returned
 */

const testServiceMapping = async () => {
  console.log('🔍 Testing Service Mapping Logic...\n');

  const testUrl = 'https://www.mailchimp.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    
    // Test the server action directly to see the mapped result
    const response = await fetch('http://localhost:3001/api/test-analyze-brand-action', {
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
      console.log('✅ Server action completed successfully!\n');
      
      const data = result.data;
      
      console.log('🔍 SERVICE MAPPING ANALYSIS:');
      console.log('='.repeat(60));
      console.log('Services field type:', typeof data.services);
      console.log('Services field length:', (data.services || '').length);
      console.log('Services field content preview:');
      console.log((data.services || 'No services').substring(0, 500) + '...');
      
      console.log('\n🔍 KEY FEATURES MAPPING:');
      console.log('='.repeat(60));
      console.log('Key features type:', typeof data.keyFeatures);
      console.log('Key features length:', (data.keyFeatures || '').length);
      console.log('Key features content:');
      console.log((data.keyFeatures || 'No features').substring(0, 300) + '...');
      
      console.log('\n🔍 BUSINESS DESCRIPTION:');
      console.log('='.repeat(60));
      console.log('Description type:', typeof data.description);
      console.log('Description length:', (data.description || '').length);
      console.log('Description content:');
      console.log(data.description || 'No description');
      
      console.log('\n🔍 CONTACT INFORMATION:');
      console.log('='.repeat(60));
      if (data.contactInfo) {
        console.log('Contact info structure:', Object.keys(data.contactInfo));
        console.log('Phone:', data.contactInfo.phone || 'Not found');
        console.log('Email:', data.contactInfo.email || 'Not found');
        console.log('Address:', data.contactInfo.address || 'Not found');
        console.log('Hours:', data.contactInfo.hours || 'Not found');
      } else {
        console.log('No contact info structure');
      }
      
      console.log('\n🔍 SOCIAL MEDIA:');
      console.log('='.repeat(60));
      if (data.socialMedia) {
        console.log('Social media structure:', Object.keys(data.socialMedia));
        Object.entries(data.socialMedia).forEach(([platform, url]) => {
          if (url && url !== '') {
            console.log(`${platform}: ${url}`);
          }
        });
      } else {
        console.log('No social media structure');
      }
      
      console.log('\n🎯 OVERALL ANALYSIS QUALITY:');
      console.log('='.repeat(60));
      
      let qualityScore = 0;
      
      // Service detail quality (40 points)
      const serviceLength = (data.services || '').length;
      if (serviceLength > 1000) qualityScore += 40;
      else if (serviceLength > 500) qualityScore += 30;
      else if (serviceLength > 200) qualityScore += 20;
      else if (serviceLength > 100) qualityScore += 10;
      
      // Business description quality (20 points)
      const descLength = (data.description || '').length;
      if (descLength > 300) qualityScore += 20;
      else if (descLength > 150) qualityScore += 15;
      else if (descLength > 100) qualityScore += 10;
      else if (descLength > 50) qualityScore += 5;
      
      // Contact information (20 points)
      if (data.contactInfo?.phone) qualityScore += 5;
      if (data.contactInfo?.email) qualityScore += 5;
      if (data.contactInfo?.address) qualityScore += 5;
      if (data.contactInfo?.hours) qualityScore += 5;
      
      // Social media (10 points)
      const socialCount = Object.values(data.socialMedia || {}).filter(v => v && v !== '').length;
      qualityScore += Math.min(socialCount * 2, 10);
      
      // Additional details (10 points)
      if (data.valueProposition && data.valueProposition.length > 100) qualityScore += 5;
      if (data.targetAudience && data.targetAudience.length > 100) qualityScore += 5;
      
      console.log(`Quality Score: ${qualityScore}/100`);
      
      if (qualityScore >= 80) {
        console.log('🎉 EXCELLENT - Comprehensive analysis achieved!');
      } else if (qualityScore >= 60) {
        console.log('👍 GOOD - Solid analysis quality');
      } else if (qualityScore >= 40) {
        console.log('⚠️  FAIR - Needs improvement');
      } else {
        console.log('❌ POOR - Major improvements needed');
      }
      
    } else {
      console.log('❌ Server action failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testServiceMapping();
