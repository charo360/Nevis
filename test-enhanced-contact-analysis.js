/**
 * Test the enhanced website analysis with contact information extraction
 */

const testWebsiteAnalysis = async () => {
  console.log('🧪 Testing Enhanced Website Analysis with Contact Information...\n');

  // Test with a business website that should have contact info
  const testUrl = 'https://www.starbucks.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    
    // Test the analyze-brand API endpoint
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
      console.log('✅ Website analysis completed successfully!\n');
      
      const data = result.data;
      
      console.log('📊 ANALYSIS RESULTS:');
      console.log('='.repeat(50));
      console.log(`Business Name: ${data.businessName}`);
      console.log(`Business Type: ${data.businessType}`);
      console.log(`Description: ${data.description?.substring(0, 100)}...`);
      console.log(`Location: ${data.location}`);
      
      console.log('\n📞 CONTACT INFORMATION:');
      console.log('-'.repeat(30));
      if (data.contactInfo) {
        console.log(`Phone: ${data.contactInfo.phone || 'Not found'}`);
        console.log(`Email: ${data.contactInfo.email || 'Not found'}`);
        console.log(`Address: ${data.contactInfo.address || 'Not found'}`);
        console.log(`Hours: ${data.contactInfo.hours || 'Not found'}`);
      } else {
        console.log('❌ No contact info structure found');
      }
      
      console.log('\n📱 SOCIAL MEDIA:');
      console.log('-'.repeat(30));
      if (data.socialMedia) {
        console.log(`Facebook: ${data.socialMedia.facebook || 'Not found'}`);
        console.log(`Instagram: ${data.socialMedia.instagram || 'Not found'}`);
        console.log(`Twitter: ${data.socialMedia.twitter || 'Not found'}`);
        console.log(`LinkedIn: ${data.socialMedia.linkedin || 'Not found'}`);
        console.log(`YouTube: ${data.socialMedia.youtube || 'Not found'}`);
        console.log(`TikTok: ${data.socialMedia.tiktok || 'Not found'}`);
        if (data.socialMedia.other && data.socialMedia.other.length > 0) {
          console.log(`Other: ${data.socialMedia.other.join(', ')}`);
        }
      } else {
        console.log('❌ No social media structure found');
      }
      
      console.log('\n🏢 ADDITIONAL BUSINESS INFO:');
      console.log('-'.repeat(30));
      console.log(`Established Year: ${data.establishedYear || 'Not found'}`);
      console.log(`Team Size: ${data.teamSize || 'Not found'}`);
      console.log(`Pricing: ${data.pricing || 'Not found'}`);
      if (data.certifications && data.certifications.length > 0) {
        console.log(`Certifications: ${data.certifications.join(', ')}`);
      }
      if (data.specialties && data.specialties.length > 0) {
        console.log(`Specialties: ${data.specialties.join(', ')}`);
      }
      if (data.serviceAreas && data.serviceAreas.length > 0) {
        console.log(`Service Areas: ${data.serviceAreas.join(', ')}`);
      }
      
      console.log('\n🎯 BRAND ANALYSIS:');
      console.log('-'.repeat(30));
      console.log(`Brand Archetype: ${data.brandArchetype || 'Not specified'}`);
      console.log(`Communication Style: ${data.communicationStyle || 'Not specified'}`);
      console.log(`Visual Style: ${data.visualStyle || 'Not specified'}`);
      
      if (data.brandPersonality) {
        console.log(`Brand Tone: ${data.brandPersonality.tone || 'Not specified'}`);
        console.log(`Brand Style: ${data.brandPersonality.style || 'Not specified'}`);
        if (data.brandPersonality.values && data.brandPersonality.values.length > 0) {
          console.log(`Brand Values: ${data.brandPersonality.values.join(', ')}`);
        }
      }
      
      console.log('\n📈 METADATA:');
      console.log('-'.repeat(30));
      if (result.metadata) {
        console.log(`Content Length: ${result.metadata.contentLength} characters`);
        console.log(`Analyzed At: ${result.metadata.analyzedAt}`);
      }
      if (data._metadata) {
        console.log(`Analyzed By: ${data._metadata.analyzedBy}`);
        console.log(`Source: ${data._metadata.source}`);
      }
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testWebsiteAnalysis();
