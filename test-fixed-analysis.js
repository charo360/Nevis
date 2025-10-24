/**
 * Test the fixed website analysis to ensure complete responses
 */

const testFixedAnalysis = async () => {
  console.log('🔧 Testing Fixed Website Analysis...\n');

  // Test with the Paya Finance website that was failing
  const testUrl = 'https://www.payafinance.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    console.log('⏳ Running fixed analysis...\n');
    
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
      console.log('✅ Fixed analysis completed successfully!\n');
      
      const data = result.data;
      
      console.log('🏢 BUSINESS INFORMATION:');
      console.log('='.repeat(60));
      console.log(`Business Name: ${data.businessName}`);
      console.log(`Business Type: ${data.businessType}`);
      console.log(`Industry: ${data.industry}`);
      console.log(`\nDescription: ${data.description}`);
      console.log(`\nTarget Audience: ${data.targetAudience}`);
      console.log(`\nValue Proposition: ${data.valueProposition}`);
      
      console.log('\n🛠️  SERVICES ANALYSIS:');
      console.log('='.repeat(60));
      
      if (data.services && data.services.length > 50) {
        console.log('✅ SERVICES FOUND:');
        console.log('-'.repeat(40));
        console.log(data.services);
        console.log(`\n📊 Service Description Length: ${data.services.length} characters`);
      } else {
        console.log('❌ LIMITED OR NO SERVICES:');
        console.log('-'.repeat(40));
        console.log(data.services || 'No services found');
      }
      
      console.log('\n📞 CONTACT INFORMATION:');
      console.log('='.repeat(60));
      if (data.contactInfo) {
        let contactFound = false;
        if (data.contactInfo.phone) {
          console.log(`📞 Phone: ${data.contactInfo.phone}`);
          contactFound = true;
        }
        if (data.contactInfo.email) {
          console.log(`📧 Email: ${data.contactInfo.email}`);
          contactFound = true;
        }
        if (data.contactInfo.address) {
          console.log(`📍 Address: ${data.contactInfo.address}`);
          contactFound = true;
        }
        if (data.contactInfo.hours) {
          console.log(`🕒 Hours: ${data.contactInfo.hours}`);
          contactFound = true;
        }
        
        if (!contactFound) {
          console.log('❌ No contact information found');
        }
      } else {
        console.log('❌ No contact info structure');
      }
      
      console.log('\n📱 SOCIAL MEDIA:');
      console.log('='.repeat(60));
      if (data.socialMedia) {
        let socialFound = false;
        Object.entries(data.socialMedia).forEach(([platform, url]) => {
          if (url && url !== '' && Array.isArray(url) ? url.length > 0 : true) {
            console.log(`${platform}: ${Array.isArray(url) ? url.join(', ') : url}`);
            socialFound = true;
          }
        });
        
        if (!socialFound) {
          console.log('❌ No social media found');
        }
      } else {
        console.log('❌ No social media structure');
      }
      
      console.log('\n💼 ADDITIONAL BUSINESS DETAILS:');
      console.log('='.repeat(60));
      if (data.location && data.location !== 'not specified') {
        console.log(`📍 Location: ${data.location}`);
      }
      if (data.establishedYear) {
        console.log(`📅 Established: ${data.establishedYear}`);
      }
      if (data.teamSize) {
        console.log(`👥 Team Size: ${data.teamSize}`);
      }
      if (data.pricing) {
        console.log(`💰 Pricing: ${data.pricing}`);
      }
      if (data.certifications && data.certifications.length > 0) {
        console.log(`🏆 Certifications: ${data.certifications.join(', ')}`);
      }
      if (data.specialties && data.specialties.length > 0) {
        console.log(`⭐ Specialties: ${data.specialties.join(', ')}`);
      }
      
      console.log('\n📈 ANALYSIS QUALITY CHECK:');
      console.log('='.repeat(60));
      
      // Check if we're getting complete data vs incomplete JSON strings
      const isCompleteData = typeof data.businessName === 'string' && 
                            typeof data.description === 'string' &&
                            typeof data.services === 'string' &&
                            data.contactInfo && typeof data.contactInfo === 'object' &&
                            data.socialMedia && typeof data.socialMedia === 'object';
      
      if (isCompleteData) {
        console.log('✅ DATA STRUCTURE: Complete and properly parsed');
      } else {
        console.log('❌ DATA STRUCTURE: Incomplete or malformed');
      }
      
      // Calculate quality score
      let qualityScore = 0;
      
      if (data.businessName && data.businessName !== 'Unknown Business') qualityScore += 10;
      if (data.description && data.description.length > 100) qualityScore += 20;
      if (data.services && data.services.length > 200) qualityScore += 30;
      if (data.contactInfo?.phone || data.contactInfo?.email) qualityScore += 15;
      if (data.socialMedia && Object.values(data.socialMedia).some(v => v && v !== '')) qualityScore += 10;
      if (data.targetAudience && data.targetAudience.length > 50) qualityScore += 10;
      if (data.valueProposition && data.valueProposition.length > 50) qualityScore += 5;
      
      console.log(`Quality Score: ${qualityScore}/100`);
      console.log(`Model Used: ${data._metadata?.analyzedBy || 'Unknown'}`);
      console.log(`Content Length: ${result.metadata?.contentLength || 0} characters`);
      
      if (qualityScore >= 70) {
        console.log('🎉 EXCELLENT - Analysis working properly!');
      } else if (qualityScore >= 50) {
        console.log('👍 GOOD - Solid analysis quality');
      } else {
        console.log('⚠️  NEEDS IMPROVEMENT - Analysis quality issues');
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testFixedAnalysis();
