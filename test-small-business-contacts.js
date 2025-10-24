/**
 * Test contact extraction with a smaller business website
 */

const testSmallBusinessAnalysis = async () => {
  console.log('🧪 Testing Contact Extraction with Small Business Website...\n');

  // Test with a smaller business that should have contact info
  const testUrl = 'https://www.joespizza.com';
  
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
      console.log('✅ Small business analysis completed!\n');
      
      const data = result.data;
      
      console.log('📊 BUSINESS OVERVIEW:');
      console.log('='.repeat(40));
      console.log(`Name: ${data.businessName}`);
      console.log(`Type: ${data.businessType}`);
      console.log(`Location: ${data.location}`);
      
      console.log('\n📞 CONTACT INFORMATION:');
      console.log('='.repeat(40));
      if (data.contactInfo) {
        const hasAnyContact = data.contactInfo.phone || data.contactInfo.email || data.contactInfo.address || data.contactInfo.hours;
        
        if (hasAnyContact) {
          console.log('✅ Contact information found:');
          if (data.contactInfo.phone) console.log(`📞 Phone: ${data.contactInfo.phone}`);
          if (data.contactInfo.email) console.log(`📧 Email: ${data.contactInfo.email}`);
          if (data.contactInfo.address) console.log(`📍 Address: ${data.contactInfo.address}`);
          if (data.contactInfo.hours) console.log(`🕒 Hours: ${data.contactInfo.hours}`);
        } else {
          console.log('❌ No contact information found');
        }
      }
      
      console.log('\n📱 SOCIAL MEDIA:');
      console.log('='.repeat(40));
      if (data.socialMedia) {
        const socialLinks = [];
        if (data.socialMedia.facebook) socialLinks.push(`Facebook: ${data.socialMedia.facebook}`);
        if (data.socialMedia.instagram) socialLinks.push(`Instagram: ${data.socialMedia.instagram}`);
        if (data.socialMedia.twitter) socialLinks.push(`Twitter: ${data.socialMedia.twitter}`);
        if (data.socialMedia.linkedin) socialLinks.push(`LinkedIn: ${data.socialMedia.linkedin}`);
        if (data.socialMedia.youtube) socialLinks.push(`YouTube: ${data.socialMedia.youtube}`);
        if (data.socialMedia.tiktok) socialLinks.push(`TikTok: ${data.socialMedia.tiktok}`);
        
        if (socialLinks.length > 0) {
          console.log('✅ Social media found:');
          socialLinks.forEach(link => console.log(`  ${link}`));
        } else {
          console.log('❌ No social media links found');
        }
      }
      
      console.log('\n🎯 ANALYSIS QUALITY:');
      console.log('='.repeat(40));
      console.log(`Model Used: ${data._metadata?.analyzedBy || 'Unknown'}`);
      console.log(`Content Length: ${result.metadata?.contentLength || 0} chars`);
      
      // Score the analysis completeness
      let completenessScore = 0;
      if (data.businessName && data.businessName !== 'Unknown Business') completenessScore += 20;
      if (data.contactInfo?.phone) completenessScore += 15;
      if (data.contactInfo?.email) completenessScore += 15;
      if (data.contactInfo?.address) completenessScore += 15;
      if (data.socialMedia?.facebook || data.socialMedia?.instagram) completenessScore += 10;
      if (data.establishedYear) completenessScore += 5;
      if (data.specialties && data.specialties.length > 0) completenessScore += 10;
      if (data.pricing) completenessScore += 10;
      
      console.log(`Completeness Score: ${completenessScore}/100`);
      
      if (completenessScore >= 70) {
        console.log('🎉 Excellent analysis quality!');
      } else if (completenessScore >= 50) {
        console.log('👍 Good analysis quality');
      } else {
        console.log('⚠️  Basic analysis - could be improved');
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSmallBusinessAnalysis();
