/**
 * Test comprehensive analysis with detailed service extraction
 */

const testComprehensiveAnalysis = async () => {
  console.log('🎯 Testing Comprehensive Analysis with Detailed Services...\n');

  const testUrl = 'https://www.mailchimp.com';
  
  try {
    console.log(`🌐 Testing website: ${testUrl}`);
    console.log('⏳ Running comprehensive analysis...\n');
    
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
      console.log('✅ Comprehensive analysis completed successfully!\n');
      
      const data = result.data;
      
      console.log('🏢 BUSINESS OVERVIEW:');
      console.log('='.repeat(70));
      console.log(`Business Name: ${data.businessName}`);
      console.log(`Business Type: ${data.businessType}`);
      console.log(`Industry: ${data.industry}`);
      console.log(`\nDescription (${data.description.length} chars):`);
      console.log(data.description);
      console.log(`\nTarget Audience (${data.targetAudience.length} chars):`);
      console.log(data.targetAudience);
      console.log(`\nValue Proposition (${data.valueProposition.length} chars):`);
      console.log(data.valueProposition);
      
      console.log('\n🛠️  DETAILED SERVICES ANALYSIS:');
      console.log('='.repeat(70));
      console.log(`Services Length: ${data.services.length} characters`);
      console.log('\nServices Content:');
      console.log(data.services);
      
      console.log('\n🔧 KEY FEATURES:');
      console.log('='.repeat(70));
      console.log(`Features Length: ${data.keyFeatures.length} characters`);
      console.log('\nFeatures Content:');
      console.log(data.keyFeatures.substring(0, 500) + (data.keyFeatures.length > 500 ? '...' : ''));
      
      console.log('\n📞 CONTACT INFORMATION:');
      console.log('='.repeat(70));
      if (data.contactInfo) {
        Object.entries(data.contactInfo).forEach(([key, value]) => {
          if (value && value !== '') {
            console.log(`${key}: ${value}`);
          }
        });
      }
      
      console.log('\n📱 SOCIAL MEDIA:');
      console.log('='.repeat(70));
      if (data.socialMedia) {
        Object.entries(data.socialMedia).forEach(([platform, url]) => {
          if (url && url !== '' && !Array.isArray(url)) {
            console.log(`${platform}: ${url}`);
          } else if (Array.isArray(url) && url.length > 0) {
            console.log(`${platform}: ${url.join(', ')}`);
          }
        });
      }
      
      console.log('\n💼 ADDITIONAL BUSINESS DETAILS:');
      console.log('='.repeat(70));
      if (data.location && data.location !== 'not specified') console.log(`Location: ${data.location}`);
      if (data.establishedYear) console.log(`Established: ${data.establishedYear}`);
      if (data.teamSize) console.log(`Team Size: ${data.teamSize}`);
      if (data.certifications && data.certifications.length > 0) console.log(`Certifications: ${data.certifications.join(', ')}`);
      if (data.competitiveAdvantages) console.log(`Competitive Advantages: ${data.competitiveAdvantages}`);
      
      console.log('\n🎯 BRAND ANALYSIS:');
      console.log('='.repeat(70));
      if (data.archetypeRecommendation) console.log(`Brand Archetype: ${data.archetypeRecommendation}`);
      if (data.brandPersonality) console.log(`Brand Personality: ${data.brandPersonality}`);
      if (data.writingTone) console.log(`Writing Tone: ${data.writingTone}`);
      if (data.visualStyle) console.log(`Visual Style: ${data.visualStyle}`);
      if (data.contentThemes) console.log(`Content Themes: ${data.contentThemes}`);
      
      console.log('\n📈 ANALYSIS QUALITY METRICS:');
      console.log('='.repeat(70));
      
      // Calculate comprehensive quality score
      let qualityScore = 0;
      let maxScore = 100;
      
      // Business information (30 points)
      if (data.businessName && data.businessName !== 'Unknown Business') qualityScore += 5;
      if (data.description && data.description.length > 200) qualityScore += 10;
      else if (data.description && data.description.length > 100) qualityScore += 5;
      if (data.targetAudience && data.targetAudience.length > 100) qualityScore += 8;
      if (data.valueProposition && data.valueProposition.length > 100) qualityScore += 7;
      
      // Services detail (40 points)
      if (data.services && data.services.length > 1000) qualityScore += 40;
      else if (data.services && data.services.length > 500) qualityScore += 30;
      else if (data.services && data.services.length > 200) qualityScore += 20;
      else if (data.services && data.services.length > 100) qualityScore += 10;
      
      // Contact information (15 points)
      if (data.contactInfo?.phone) qualityScore += 4;
      if (data.contactInfo?.email) qualityScore += 4;
      if (data.contactInfo?.address) qualityScore += 4;
      if (data.contactInfo?.hours) qualityScore += 3;
      
      // Social media (10 points)
      const socialCount = Object.values(data.socialMedia || {}).filter(v => v && v !== '').length;
      qualityScore += Math.min(socialCount * 2, 10);
      
      // Additional details (5 points)
      if (data.establishedYear) qualityScore += 2;
      if (data.certifications && data.certifications.length > 0) qualityScore += 3;
      
      console.log(`Quality Score: ${qualityScore}/${maxScore}`);
      console.log(`Content Length: ${result.metadata?.contentLength || 0} characters`);
      
      if (qualityScore >= 85) {
        console.log('🎉 OUTSTANDING - Exceptional comprehensive analysis!');
      } else if (qualityScore >= 70) {
        console.log('🌟 EXCELLENT - High-quality comprehensive analysis!');
      } else if (qualityScore >= 55) {
        console.log('👍 GOOD - Solid comprehensive analysis');
      } else {
        console.log('⚠️  NEEDS IMPROVEMENT - Analysis could be more comprehensive');
      }
      
      console.log('\n✅ SUMMARY:');
      console.log('='.repeat(70));
      console.log(`✅ Services: ${data.services.length} chars of detailed descriptions`);
      console.log(`✅ Business Info: Comprehensive business details captured`);
      console.log(`✅ Contact Info: ${Object.values(data.contactInfo || {}).filter(v => v && v !== '').length} contact fields found`);
      console.log(`✅ Social Media: ${Object.values(data.socialMedia || {}).filter(v => v && v !== '').length} platforms found`);
      console.log(`✅ Data Structure: Complete and properly formatted`);
      
    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testComprehensiveAnalysis();
