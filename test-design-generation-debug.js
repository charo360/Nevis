/**
 * Debug design generation to see where images are being lost
 */

const testDesignGenerationDebug = async () => {
  console.log('🔍 Testing Design Generation Debug...\n');

  try {
    console.log('🎯 Step 1: Testing content generation action...');

    // Test the generateContentAction directly
    const response = await fetch('http://localhost:3001/api/test-analyze-brand-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: 'https://www.starbucks.com',
        designImageUris: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Server action completed successfully!\n');

      const brandProfile = result.data;

      console.log('🏢 Brand Profile Created:');
      console.log('Business Name:', brandProfile.businessName);
      console.log('Business Type:', brandProfile.businessType);
      console.log('Location:', brandProfile.location);

      console.log('\n🎯 Step 2: Testing content generation with this brand profile...');

      // Now test content generation using the correct endpoint
      const contentResponse = await fetch('http://localhost:3001/api/quick-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revoModel: 'revo-1.0',
          brandProfile: brandProfile,
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

      if (contentResponse.ok) {
        const contentResult = await contentResponse.json();

        if (contentResult.success) {
          console.log('✅ Content generation successful!\n');

          const post = contentResult.data;

          console.log('📝 GENERATED POST STRUCTURE:');
          console.log('='.repeat(60));
          console.log('Post ID:', post.id);
          console.log('Content Length:', (post.content || '').length);
          console.log('Hashtags:', post.hashtags);
          console.log('Catchy Words:', post.catchyWords);
          console.log('Subheadline:', post.subheadline);
          console.log('Call to Action:', post.callToAction);

          console.log('\n🖼️  VARIANTS ANALYSIS:');
          console.log('='.repeat(60));
          console.log('Variants Count:', post.variants?.length || 0);

          if (post.variants && post.variants.length > 0) {
            post.variants.forEach((variant, index) => {
              console.log(`\nVariant ${index + 1}:`);
              console.log('  Platform:', variant.platform);
              console.log('  Image URL Type:', typeof variant.imageUrl);
              console.log('  Image URL Length:', (variant.imageUrl || '').length);
              console.log('  Has Image URL:', !!variant.imageUrl);

              if (variant.imageUrl) {
                if (variant.imageUrl.startsWith('data:')) {
                  console.log('  ✅ Image URL: Data URL (base64 image)');
                  console.log('  Image URL Preview:', variant.imageUrl.substring(0, 50) + '...');
                } else if (variant.imageUrl.startsWith('http')) {
                  console.log('  ✅ Image URL: HTTP URL');
                  console.log('  Image URL:', variant.imageUrl);
                } else if (variant.imageUrl === '') {
                  console.log('  ❌ Image URL: Empty string');
                } else {
                  console.log('  ⚠️  Image URL: Unknown format');
                  console.log('  Image URL Preview:', variant.imageUrl.substring(0, 100));
                }
              } else {
                console.log('  ❌ Image URL: Missing/null');
              }

              console.log('  Aspect Ratio:', variant.aspectRatio);
              console.log('  Resolution:', variant.resolution);
              console.log('  Quality:', variant.quality);
            });
          } else {
            console.log('❌ No variants found in the post');
          }

          console.log('\n🔍 DEBUGGING SUMMARY:');
          console.log('='.repeat(60));

          const hasContent = !!(post.content && post.content.length > 0);
          const hasVariants = !!(post.variants && post.variants.length > 0);
          const hasImages = post.variants?.some(v => v.imageUrl && v.imageUrl.length > 0);

          console.log(`Content Generated: ${hasContent ? '✅' : '❌'}`);
          console.log(`Variants Created: ${hasVariants ? '✅' : '❌'}`);
          console.log(`Images Generated: ${hasImages ? '✅' : '❌'}`);

          if (hasContent && hasVariants && hasImages) {
            console.log('\n🎉 SUCCESS: Design generation is working properly!');
            console.log('The issue might be in the UI display or data handling.');
          } else if (hasContent && hasVariants && !hasImages) {
            console.log('\n⚠️  ISSUE FOUND: Content and variants are created but images are missing!');
            console.log('This suggests the image generation step is failing.');
          } else {
            console.log('\n❌ MULTIPLE ISSUES: Content generation has fundamental problems.');
          }

        } else {
          console.log('❌ Content generation failed:', contentResult.error);
        }
      } else {
        const errorText = await contentResponse.text();
        console.log('❌ Content generation request failed:', errorText);
      }

    } else {
      console.log('❌ Brand profile creation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
};

// Run the debug test
testDesignGenerationDebug();
