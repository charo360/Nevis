# Gemini 3 Pro Image Generation Integration

## Overview

Gemini 3 Pro is now integrated into Revo 2.0 for high-resolution, photorealistic image generation with advanced configuration options.

## Key Features

- **High Resolution**: Generate images up to 2K resolution
- **Aspect Ratio Control**: Support for 1:1, 3:4, 4:3, 9:16, 16:9
- **Platform-Specific**: Auto-configure for Instagram, Facebook, TikTok, etc.
- **Brand Logo Integration**: Seamlessly add brand logos to generated images
- **Influencer Personas**: Generate consistent persona images across scenarios
- **Batch Generation**: Create multiple variations efficiently

## Configuration Options

### Aspect Ratios

```typescript
type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

// Platform defaults:
- Instagram: '3:4' (portrait)
- Facebook: '4:3' (landscape)
- Twitter: '16:9' (wide)
- LinkedIn: '4:3' (landscape)
- TikTok: '9:16' (vertical)
```

### Image Sizes

```typescript
type ImageSize = '256' | '512' | '1K' | '2K';

// Recommended:
- Quick previews: '256' or '512'
- Production ads: '1K'
- High-quality prints: '2K'
```

## Usage Examples

### Basic Image Generation

```typescript
import { generateGemini3ProImage } from '@/lib/services/gemini-3-pro';

const imageUrl = await generateGemini3ProImage(
  'Professional Kenyan businesswoman using mobile banking app',
  {
    aspectRatio: '3:4',
    imageSize: '1K',
    temperature: 0.7
  }
);
```

### Influencer-Style Personas

```typescript
import { generateInfluencerImage } from '@/lib/services/gemini-3-pro';

const personaDescription = `
  28-year-old Kenyan woman with natural curly hair, 
  warm brown skin tone, bright smile, modern casual attire
`;

const scenario = 'Working on laptop in trendy Nairobi coffee shop';

const image = await generateInfluencerImage(personaDescription, scenario, {
  aspectRatio: '3:4',
  imageSize: '1K'
});
```

### Platform-Specific Ads (Revo 2.0)

```typescript
import { generateRevo2AdImage } from '@/lib/services/gemini-3-pro';

const adPrompt = `
  Paya mobile banking ad. Young entrepreneur accepting payment.
  Text: "Get Paid Instantly". Brand colors: #E4574C, #2A2A2A
`;

// Automatically uses correct aspect ratio for platform
const instagramAd = await generateRevo2AdImage(adPrompt, 'instagram');
const tiktokAd = await generateRevo2AdImage(adPrompt, 'tiktok');
```

### Brand Logo Integration

```typescript
const logoBase64 = 'data:image/png;base64,...';

const image = await generateGemini3ProImage(prompt, {
  aspectRatio: '3:4',
  imageSize: '1K',
  logoImage: logoBase64 // Logo will be integrated into image
});
```

### Batch Variations

```typescript
import { generateAdVariations } from '@/lib/services/gemini-3-pro';

const variations = await generateAdVariations(
  'Paya payment ad with market setting',
  5, // Generate 5 variations
  { aspectRatio: '3:4', imageSize: '1K' }
);
```

## Integration with Revo 2.0

### Using Gemini 3 Pro in Revo 2.0 Service

```typescript
import { generateContentDirect, REVO_2_0_GEMINI_3_PRO_MODEL } from '@/ai/revo-2.0-service';

// Generate image with Gemini 3 Pro
const result = await generateContentDirect(
  prompt,
  REVO_2_0_GEMINI_3_PRO_MODEL,
  true, // isImageGeneration
  {
    temperature: 0.7,
    aspectRatio: '3:4',
    imageSize: '1K',
    logoImage: brandLogoBase64
  }
);

const imageData = result.response.candidates[0].content.parts[0].inlineData;
const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
```

### Switching Between Models

```typescript
import { REVO_2_0_MODEL, REVO_2_0_GEMINI_3_PRO_MODEL } from '@/ai/revo-2.0-service';

// Use Gemini 2.5 Flash (faster, lower cost)
const quickImage = await generateContentDirect(prompt, REVO_2_0_MODEL, true);

// Use Gemini 3 Pro (higher quality, more control)
const highQualityImage = await generateContentDirect(
  prompt, 
  REVO_2_0_GEMINI_3_PRO_MODEL, 
  true,
  { aspectRatio: '3:4', imageSize: '1K' }
);
```

## Multi-Angle Marketing Campaigns

Gemini 3 Pro works seamlessly with Revo 2.0's multi-angle framework:

```typescript
const angles = [
  {
    name: 'Feature Focus',
    prompt: 'Close-up of instant payment notification on smartphone'
  },
  {
    name: 'Use Case',
    prompt: 'Person paying rent at 11 PM from home using mobile app'
  },
  {
    name: 'Problem-Solution',
    prompt: 'Split screen: bank queue vs mobile banking at home'
  },
  {
    name: 'Social Proof',
    prompt: 'Group of business owners using app in Nairobi market'
  }
];

const campaignImages = await Promise.all(
  angles.map(angle => 
    generateGemini3ProImage(angle.prompt, {
      aspectRatio: '3:4',
      imageSize: '1K'
    })
  )
);
```

## Best Practices

### Prompt Engineering

```typescript
// ✅ GOOD: Specific, detailed prompts
const goodPrompt = `
  Professional Kenyan businesswoman, 30s, using smartphone for mobile payment.
  Modern office with natural lighting. She's smiling confidently.
  Brand colors: #E4574C (red) and #2A2A2A (dark gray).
  Cinematic lighting, photorealistic, 8k quality.
`;

// ❌ BAD: Vague, generic prompts
const badPrompt = 'Woman using phone';
```

### Aspect Ratio Selection

```typescript
// Social Media
- Instagram Posts: '3:4' (portrait) or '1:1' (square)
- Instagram Stories: '9:16' (vertical)
- Facebook Ads: '4:3' (landscape)
- TikTok: '9:16' (vertical)
- LinkedIn: '4:3' (landscape)
- Twitter: '16:9' (wide)

// Print/Web
- Website Banners: '16:9'
- Product Images: '1:1' or '3:4'
- Blog Headers: '16:9'
```

### Image Size Selection

```typescript
// Development/Testing
imageSize: '256' // Fast generation, low cost

// Production Ads
imageSize: '1K' // High quality, reasonable cost

// Premium/Print
imageSize: '2K' // Maximum quality, higher cost
```

### Temperature Settings

```typescript
// Consistent, predictable results
temperature: 0.5

// Balanced creativity
temperature: 0.7 // Recommended default

// Maximum variety and creativity
temperature: 0.9
```

## Performance Considerations

### Generation Times (Approximate)

- **256px**: ~2-3 seconds
- **512px**: ~3-5 seconds
- **1K**: ~5-8 seconds
- **2K**: ~8-12 seconds

### Cost Optimization

```typescript
// Development: Use smaller sizes
const devImage = await generateGemini3ProImage(prompt, {
  imageSize: '256',
  aspectRatio: '3:4'
});

// Production: Use 1K for best quality/cost balance
const prodImage = await generateGemini3ProImage(prompt, {
  imageSize: '1K',
  aspectRatio: '3:4'
});

// Premium: Use 2K only when necessary
const premiumImage = await generateGemini3ProImage(prompt, {
  imageSize: '2K',
  aspectRatio: '3:4'
});
```

## Error Handling

```typescript
try {
  const image = await generateGemini3ProImage(prompt, options);
  console.log('✅ Image generated successfully');
} catch (error) {
  if (error.message.includes('quota')) {
    console.error('❌ API quota exceeded');
    // Fallback to Gemini 2.5 Flash
  } else if (error.message.includes('credentials')) {
    console.error('❌ Invalid credentials');
  } else {
    console.error('❌ Generation failed:', error);
  }
}
```

## Environment Setup

Required environment variables:

```bash
# Vertex AI Configuration
VERTEX_AI_ENABLED=true
VERTEX_AI_CREDENTIALS={"type":"service_account",...}
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1

# Optional: Secondary fallback
VERTEX_AI_SECONDARY_ENABLED=true
VERTEX_AI_SECONDARY_CREDENTIALS={"type":"service_account",...}
VERTEX_FALLBACK_ENABLED=true
```

## Migration from Gemini 2.5

```typescript
// Before (Gemini 2.5 Flash)
const image = await generateContentDirect(
  prompt,
  'gemini-2.5-flash-image',
  true
);

// After (Gemini 3 Pro with enhanced control)
const image = await generateContentDirect(
  prompt,
  'gemini-3-pro-image-preview',
  true,
  {
    aspectRatio: '3:4',
    imageSize: '1K',
    temperature: 0.7
  }
);
```

## Examples Repository

See `/src/lib/examples/gemini-3-pro-revo-integration.ts` for complete working examples:

- Basic image generation
- Influencer persona consistency
- Platform-specific ads
- Multi-angle campaigns
- Brand logo integration
- Batch variations

## Support

For issues or questions:
1. Check error logs for specific error messages
2. Verify environment variables are set correctly
3. Ensure Vertex AI credentials have proper permissions
4. Review prompt engineering best practices above

## Future Enhancements

Coming soon:
- ~~Video generation with Veo 3.1~~ (Not implemented yet)
- Style transfer and image editing
- Advanced persona management
- Campaign analytics integration
