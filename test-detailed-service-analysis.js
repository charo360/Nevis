/**
 * Test the enhanced website analysis focusing on detailed service extraction
 */

const testDetailedServiceAnalysis = async () => {
  console.log('🧪 Testing Enhanced Service Analysis with Detailed Extraction...\n');

  // Test with a service-based business that should have detailed service descriptions
  const testUrl = 'https://www.mailchimp.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    console.log('⏳ Analyzing website for detailed service information...\n');
    
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
      console.log('✅ Enhanced service analysis completed!\n');
      
      const data = result.data;
      
      console.log('🏢 BUSINESS OVERVIEW:');
      console.log('='.repeat(60));
      console.log(`Name: ${data.businessName}`);
      console.log(`Type: ${data.businessType}`);
      console.log(`Industry: ${data.industry}`);
      console.log(`Description: ${data.description}`);
      console.log(`Target Audience: ${data.targetAudience}`);
      console.log(`Value Proposition: ${data.valueProposition}`);
      
      console.log('\n🛠️  DETAILED SERVICES ANALYSIS:');
      console.log('='.repeat(60));
      
      if (data.services && data.services.length > 200) {
        console.log('✅ COMPREHENSIVE SERVICE DESCRIPTIONS FOUND:');
        console.log('-'.repeat(50));
        console.log(data.services);
        console.log(`\n📊 Service Description Length: ${data.services.length} characters`);
      } else {
        console.log('❌ LIMITED SERVICE INFORMATION:');
        console.log('-'.repeat(50));
        console.log(data.services || 'No services found');
        console.log(`\n📊 Service Description Length: ${(data.services || '').length} characters`);
      }
      
      console.log('\n🔧 KEY FEATURES:');
      console.log('='.repeat(60));
      if (data.keyFeatures && data.keyFeatures.length > 100) {
        console.log('✅ DETAILED FEATURES FOUND:');
        console.log(data.keyFeatures);
      } else {
        console.log('❌ LIMITED FEATURE INFORMATION:');
        console.log(data.keyFeatures || 'No features found');
      }
      
      console.log('\n💰 PRICING & PACKAGES:');
      console.log('='.repeat(60));
      if (data.pricing && data.pricing.length > 50) {
        console.log('✅ PRICING INFORMATION FOUND:');
        console.log(data.pricing);
      } else {
        console.log('❌ LIMITED PRICING INFORMATION:');
        console.log(data.pricing || 'No pricing found');
      }
      
      console.log('\n🎯 COMPETITIVE ADVANTAGES:');
      console.log('='.repeat(60));
      console.log(data.competitiveAdvantages || 'Not specified');
      
      console.log('\n📞 CONTACT INFORMATION:');
      console.log('='.repeat(60));
      if (data.contactInfo) {
        const contactItems = [];
        if (data.contactInfo.phone) contactItems.push(`Phone: ${data.contactInfo.phone}`);
        if (data.contactInfo.email) contactItems.push(`Email: ${data.contactInfo.email}`);
        if (data.contactInfo.address) contactItems.push(`Address: ${data.contactInfo.address}`);
        if (data.contactInfo.hours) contactItems.push(`Hours: ${data.contactInfo.hours}`);
        
        if (contactItems.length > 0) {
          console.log('✅ CONTACT DETAILS FOUND:');
          contactItems.forEach(item => console.log(`  ${item}`));
        } else {
          console.log('❌ No contact details found');
        }
      }
      
      console.log('\n📱 SOCIAL MEDIA:');
      console.log('='.repeat(60));
      if (data.socialMedia) {
        const socialItems = [];
        if (data.socialMedia.facebook) socialItems.push(`Facebook: ${data.socialMedia.facebook}`);
        if (data.socialMedia.instagram) socialItems.push(`Instagram: ${data.socialMedia.instagram}`);
        if (data.socialMedia.twitter) socialItems.push(`Twitter: ${data.socialMedia.twitter}`);
        if (data.socialMedia.linkedin) socialItems.push(`LinkedIn: ${data.socialMedia.linkedin}`);
        if (data.socialMedia.youtube) socialItems.push(`YouTube: ${data.socialMedia.youtube}`);
        
        if (socialItems.length > 0) {
          console.log('✅ SOCIAL MEDIA FOUND:');
          socialItems.forEach(item => console.log(`  ${item}`));
        } else {
          console.log('❌ No social media found');
        }
      }
      
      console.log('\n📈 ANALYSIS QUALITY METRICS:');
      console.log('='.repeat(60));
      
      // Calculate detailed analysis score
      let detailScore = 0;
      let maxScore = 100;
      
      // Service detail scoring (40 points max)
      const serviceLength = (data.services || '').length;
      if (serviceLength > 500) detailScore += 40;
      else if (serviceLength > 200) detailScore += 25;
      else if (serviceLength > 100) detailScore += 15;
      else if (serviceLength > 50) detailScore += 5;
      
      // Business description detail (20 points max)
      const descLength = (data.description || '').length;
      if (descLength > 200) detailScore += 20;
      else if (descLength > 100) detailScore += 10;
      else if (descLength > 50) detailScore += 5;
      
      // Contact information (20 points max)
      if (data.contactInfo?.phone) detailScore += 5;
      if (data.contactInfo?.email) detailScore += 5;
      if (data.contactInfo?.address) detailScore += 5;
      if (data.contactInfo?.hours) detailScore += 5;
      
      // Social media (10 points max)
      const socialCount = Object.values(data.socialMedia || {}).filter(v => v && v !== '').length;
      detailScore += Math.min(socialCount * 2, 10);
      
      // Additional details (10 points max)
      if (data.pricing && data.pricing.length > 50) detailScore += 5;
      if (data.establishedYear) detailScore += 2;
      if (data.certifications && data.certifications.length > 0) detailScore += 3;
      
      console.log(`Model Used: ${data._metadata?.analyzedBy || 'Unknown'}`);
      console.log(`Content Length: ${result.metadata?.contentLength || 0} characters`);
      console.log(`Service Detail Score: ${detailScore}/${maxScore}`);
      
      if (detailScore >= 80) {
        console.log('🎉 EXCELLENT - Comprehensive detailed analysis!');
      } else if (detailScore >= 60) {
        console.log('👍 GOOD - Solid analysis with good detail');
      } else if (detailScore >= 40) {
        console.log('⚠️  FAIR - Basic analysis, needs more detail');
      } else {
        console.log('❌ POOR - Insufficient detail extracted');
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testDetailedServiceAnalysis();
