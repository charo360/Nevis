# Revo 1.5 AI Model Configuration

## Overview
Updated Revo 1.5 to ensure proper AI model usage and content generation requirements with business-specific, dynamic content.

## AI Model Configuration

### Content Generation (GPT-4o)
- **Model**: `gpt-4o` (OpenAI)
- **Purpose**: Generate headlines, subheadlines, captions, CTAs, and hashtags
- **Temperature**: 0.8 (increased for more creative, varied content)
- **Max Tokens**: 800 (increased for detailed content)
- **System Prompt**: Enhanced with business-specific instructions

### Design Planning (Gemini 2.5 Flash)
- **Model**: `gemini-2.5-flash` (Google AI)
- **Purpose**: Business analysis and design strategy planning
- **API Key**: `GEMINI_API_KEY_REVO_1_5`

### Image Generation (Gemini 2.5 Flash Image Preview)
- **Model**: `gemini-2.5-flash-image-preview` (Google AI)
- **Purpose**: Final image generation with logo integration
- **API Key**: `GEMINI_API_KEY_REVO_1_5`

## Hashtag Requirements

### Platform-Specific Counts
- **Instagram**: Exactly 5 hashtags
- **Facebook**: Exactly 3 hashtags
- **Twitter**: Exactly 3 hashtags
- **LinkedIn**: Exactly 3 hashtags

### Implementation
- Dynamic hashtag count based on platform
- Validation and adjustment if count doesn't match
- Fallback hashtag generation for error cases

## Content Quality Requirements

### Business Specificity Validation
- **Mandatory**: Include exact business name in content
- **Mandatory**: Reference specific business type/services
- **Forbidden**: Generic template phrases ("your business", "our company", etc.)
- **Required**: Industry-specific terminology and context

### Content Enhancement
- Automatic enhancement of generic content with business details
- Business name integration in headlines if missing
- Service-specific content validation
- Quality scoring and improvement suggestions

### Dynamic Content Features
- Business-specific pain point addressing
- Industry-relevant emotional triggers
- Location-based cultural elements (when enabled)
- Service-specific messaging priority

## Key Improvements

### 1. Enhanced Content Generation
```typescript
// Platform-specific hashtag requirements
const hashtagCount = platform.toLowerCase() === 'instagram' ? 5 : 3;

// Business-specific content validation
const contentQuality = validateContentQuality(parsed, businessName, businessType, brandProfile);
```

### 2. Quality Validation System
- Content specificity checking
- Generic phrase detection
- Business name/service integration validation
- Automatic content enhancement

### 3. Improved AI Instructions
- Mandatory business name inclusion
- Specific service reference requirements
- Template phrase avoidance
- Industry-specific content generation

## Configuration Files Updated

### Primary File
- `src/ai/revo-1.5-enhanced-design.ts`
  - Updated GPT-4o configuration
  - Added hashtag count validation
  - Implemented content quality validation
  - Enhanced business-specific prompts

### Functions Added
- `generateFallbackHashtags()`: Platform-specific hashtag generation
- `validateContentQuality()`: Business specificity validation

## Usage Example

```typescript
// Revo 1.5 will now generate:
// Instagram: 5 hashtags + business-specific content
// Other platforms: 3 hashtags + business-specific content

const result = await generateRevo15ContentAction(
  brandProfile,
  'Instagram', // Will generate exactly 5 hashtags
  brandConsistency,
  '',
  options,
  scheduledServices
);
```

## Quality Assurance

### Content Validation Checks
1. Business name mentioned in content ✅
2. Industry/service relevance ✅
3. No generic template phrases ✅
4. Correct hashtag count per platform ✅
5. Dynamic, non-repetitive content ✅

### AI Model Verification
1. GPT-4o for text generation ✅
2. Gemini 2.5 Flash for planning ✅
3. Gemini 2.5 Flash Image Preview for images ✅
4. Proper API key usage (`GEMINI_API_KEY_REVO_1_5`) ✅

## Expected Results

- **Instagram Posts**: 5 relevant hashtags, business-specific content
- **Other Platforms**: 3 relevant hashtags, business-specific content
- **Content Quality**: Dynamic, tailored to exact business profile
- **No Generic Content**: All content specifically mentions business name and services
- **Proper AI Usage**: GPT-4o for content, Gemini for planning and images