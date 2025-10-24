/**
 * Test server action directly to debug design generation
 */

const testServerActionDirect = async () => {
  console.log('🔍 Testing Server Action Direct...\n');

  try {
    console.log('🎯 Step 1: Creating a test brand profile...');
    
    // Create a simple brand profile for testing
    const testBrandProfile = {
      id: 'test-brand-123',
      businessName: 'Test Coffee Shop',
      businessType: 'Restaurant',
      location: 'New York, NY',
      targetAudience: 'Coffee lovers and professionals',
      services: 'Premium coffee, pastries, and light meals',
      keyFeatures: 'Artisan coffee, cozy atmosphere, free WiFi',
      competitiveAdvantages: 'Locally sourced beans, expert baristas',
      brandPersonality: 'Warm, welcoming, professional',
      writingTone: 'friendly',
      visualStyle: 'modern',
      colorPalette: ['#8B4513', '#D2691E', '#F5DEB3'],
      typography: 'Clean, modern fonts',
      contentThemes: ['coffee culture', 'community', 'quality'],
      callsToAction: ['Visit us today', 'Try our signature blend'],
      valueProposition: 'The perfect cup of coffee in a welcoming environment',
      archetypeRecommendation: 'The Caregiver',
      contactInfo: {
        phone: '+1-555-0123',
        email: 'hello@testcoffee.com',
        address: '123 Main St, New York, NY 10001',
        website: 'https://testcoffee.com',
        hours: 'Mon-Fri 7AM-7PM, Sat-Sun 8AM-6PM'
      },
      socialMedia: {
        facebook: 'https://facebook.com/testcoffee',
        instagram: 'https://instagram.com/testcoffee',
        twitter: 'https://twitter.com/testcoffee'
      },
      industry: 'Food & Beverage',
      establishedYear: '2020',
      teamSize: '5-10 employees',
      certifications: ['Organic Coffee Certified'],
      specialties: ['Espresso', 'Latte Art', 'Local Pastries'],
      pricing: 'Mid-range ($3-8 per item)',
      serviceAreas: ['Manhattan', 'Brooklyn'],
      websiteUrl: 'https://testcoffee.com',
      logoUrl: '',
      primaryColor: '#8B4513',
      accentColor: '#D2691E',
      backgroundColor: '#F5DEB3'
    };
    
    console.log('✅ Test brand profile created');
    console.log('Business Name:', testBrandProfile.businessName);
    console.log('Business Type:', testBrandProfile.businessType);
    console.log('Location:', testBrandProfile.location);
    
    console.log('\n🎯 Step 2: Testing generateContentAction server action...');
    
    // Test the server action by calling it through the test endpoint
    const response = await fetch('http://localhost:3001/api/test-revo-1.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandProfile: testBrandProfile,
        platform: 'instagram',
        brandConsistency: {
          strictConsistency: false,
          followBrandColors: true,
          includeContacts: false
        },
        useLocalLanguage: false,
        scheduledServices: [],
        includePeopleInDesigns: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Server action request failed:', response.status, errorText.substring(0, 200));
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Server action completed successfully!\n');
      
      const post = result.data;
      
      console.log('📝 GENERATED POST ANALYSIS:');
      console.log('='.repeat(60));
      console.log('Post ID:', post.id);
      console.log('Date:', post.date);
      console.log('Status:', post.status);
      
      console.log('\n📄 CONTENT ANALYSIS:');
      console.log('Content Type:', typeof post.content);
      console.log('Content Length:', (post.content || '').length);
      console.log('Content Preview:', (post.content || '').substring(0, 100) + '...');
      
      console.log('\n🏷️  HASHTAGS ANALYSIS:');
      console.log('Hashtags Type:', typeof post.hashtags);
      console.log('Hashtags:', post.hashtags);
      
      console.log('\n🎯 ADDITIONAL FIELDS:');
      console.log('Catchy Words:', post.catchyWords);
      console.log('Subheadline:', post.subheadline);
      console.log('Call to Action:', post.callToAction);
      
      console.log('\n🖼️  VARIANTS DETAILED ANALYSIS:');
      console.log('='.repeat(60));
      console.log('Variants Type:', typeof post.variants);
      console.log('Variants Count:', Array.isArray(post.variants) ? post.variants.length : 'Not array');
      
      if (Array.isArray(post.variants) && post.variants.length > 0) {
        post.variants.forEach((variant, index) => {
          console.log(`\n--- Variant ${index + 1} ---`);
          console.log('Platform:', variant.platform);
          console.log('Aspect Ratio:', variant.aspectRatio);
          console.log('Resolution:', variant.resolution);
          console.log('Quality:', variant.quality);
          
          console.log('Image URL Type:', typeof variant.imageUrl);
          console.log('Image URL Exists:', !!variant.imageUrl);
          console.log('Image URL Length:', (variant.imageUrl || '').length);
          
          if (variant.imageUrl) {
            if (variant.imageUrl.startsWith('data:image/')) {
              console.log('✅ Image Format: Base64 Data URL');
              console.log('Image MIME Type:', variant.imageUrl.split(';')[0].split(':')[1]);
              console.log('Image Size (approx):', Math.round((variant.imageUrl.length * 3) / 4 / 1024), 'KB');
            } else if (variant.imageUrl.startsWith('http')) {
              console.log('✅ Image Format: HTTP URL');
              console.log('Image URL:', variant.imageUrl);
            } else if (variant.imageUrl === '') {
              console.log('❌ Image URL: Empty string');
            } else {
              console.log('⚠️  Image Format: Unknown');
              console.log('Image URL Preview:', variant.imageUrl.substring(0, 50) + '...');
            }
          } else {
            console.log('❌ Image URL: Missing/null/undefined');
          }
        });
      } else {
        console.log('❌ No variants found or variants is not an array');
      }
      
      console.log('\n🔍 FINAL DIAGNOSIS:');
      console.log('='.repeat(60));
      
      const hasContent = !!(post.content && post.content.length > 0);
      const hasVariants = !!(Array.isArray(post.variants) && post.variants.length > 0);
      const hasValidImages = post.variants?.some(v => v.imageUrl && v.imageUrl.length > 0 && !v.imageUrl.includes('['));
      const hasDataUrlImages = post.variants?.some(v => v.imageUrl && v.imageUrl.startsWith('data:image/'));
      
      console.log(`✅ Content Generated: ${hasContent ? 'YES' : 'NO'}`);
      console.log(`✅ Variants Created: ${hasVariants ? 'YES' : 'NO'}`);
      console.log(`✅ Images Generated: ${hasValidImages ? 'YES' : 'NO'}`);
      console.log(`✅ Base64 Images: ${hasDataUrlImages ? 'YES' : 'NO'}`);
      
      if (hasContent && hasVariants && hasValidImages && hasDataUrlImages) {
        console.log('\n🎉 SUCCESS: Design generation is working perfectly!');
        console.log('✅ Content: Generated');
        console.log('✅ Variants: Created');
        console.log('✅ Images: Generated as base64 data URLs');
        console.log('\n💡 The issue is likely in the UI display or data persistence, not generation.');
      } else if (hasContent && hasVariants && !hasValidImages) {
        console.log('\n⚠️  ISSUE IDENTIFIED: Content and variants created but images missing!');
        console.log('🔧 This indicates the image generation step is failing.');
        console.log('🔍 Check Vertex AI configuration and image generation service.');
      } else {
        console.log('\n❌ MULTIPLE ISSUES: Fundamental problems with content generation.');
        console.log('🔧 Check the entire generation pipeline.');
      }
      
    } else {
      console.log('❌ Server action failed:', result.error);
      console.log('Error details:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Run the test
testServerActionDirect();
