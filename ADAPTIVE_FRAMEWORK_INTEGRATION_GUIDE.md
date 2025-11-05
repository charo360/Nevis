# Adaptive Framework Integration Guide for Revo 2.0

## Quick Start

### 1. Import the Framework

```typescript
import { initializeAdaptiveFramework, validateAdaptiveContent } from '@/ai/adaptive';
```

### 2. Initialize Before Content Generation

```typescript
// In your content generation function (e.g., revo-2.0-service.ts)

export async function generateRevo2Content(options: any) {
  const { brandProfile } = options;
  
  // Initialize adaptive framework
  const adaptiveFramework = initializeAdaptiveFramework({
    brandProfile: brandProfile,
    enableLogging: true,
    strictValidation: false
  });
  
  console.log(`🎯 Business Type: ${adaptiveFramework.detection.primaryType}`);
  console.log(`📋 Framework: ${adaptiveFramework.primaryModule?.name || 'Generic'}`);
  
  // Continue with content generation...
}
```

### 3. Use Combined Prompt

```typescript
// Replace or enhance your existing prompt with the adaptive framework prompt

const contentPrompt = `
${adaptiveFramework.combinedPrompt}

🎨 BRAND CONTEXT:
Brand: ${brandProfile.businessName}
Description: ${brandProfile.description}

[Your existing prompt sections...]
`;
```

### 4. Validate Generated Content

```typescript
// After AI generates content

const generatedContent = {
  headline: aiResponse.headline,
  caption: aiResponse.caption,
  cta: aiResponse.cta,
  coherenceScore: 85,
  marketingAngle: assignedAngle.name,
  emotionalTone: 'Professional',
  visualGuidance: 'Product shot',
  isRepetitive: false
};

const validation = validateAdaptiveContent(generatedContent, adaptiveFramework);

if (validation.passed) {
  console.log('✅ Content passed adaptive validation');
  console.log(`📊 Score: ${validation.overallScore}/100`);
  return generatedContent;
} else {
  console.log('❌ Content failed validation');
  console.log('Failed rules:', validation.failedRules);
  // Retry or use fallback
}
```

## Complete Integration Example

```typescript
// src/ai/revo-2.0-service.ts

import { initializeAdaptiveFramework, validateAdaptiveContent } from '@/ai/adaptive';

export async function generateRevo2Content(options: any) {
  const { brandProfile, theme, culturalContext } = options;
  
  // STEP 1: Initialize Adaptive Framework
  console.log('\n🚀 Initializing Adaptive Marketing Framework...');
  const adaptiveFramework = initializeAdaptiveFramework({
    brandProfile: brandProfile,
    enableLogging: true
  });
  
  // STEP 2: Assign Marketing Angle (existing logic)
  const brandKey = `${brandProfile.id}-${brandProfile.businessName}`;
  const assignedAngle = assignMarketingAngle(brandKey, options);
  
  console.log(`🎯 Assigned Angle: ${assignedAngle.name}`);
  console.log(`📊 Business Type: ${adaptiveFramework.detection.primaryType}`);
  
  // STEP 3: Build Enhanced Prompt
  const contentPrompt = `
${adaptiveFramework.combinedPrompt}

🎨 BRAND CONTEXT:
Brand: ${brandProfile.businessName}
Type: ${brandProfile.businessType}
Description: ${brandProfile.description}

🎯 ASSIGNED MARKETING ANGLE:
${assignedAngle.name}: ${assignedAngle.description}
${assignedAngle.promptInstructions}

🌍 CULTURAL CONTEXT:
${culturalContext || 'General audience'}

📝 THEME: ${theme}

GENERATE:
1. Headline (max 8 words)
2. Subheadline (optional, max 25 words)
3. Caption (max 100 words)
4. CTA (max 5 words)

CRITICAL REQUIREMENTS:
- Follow ALL universal rules (10 rules)
- Follow ALL type-specific rules for ${adaptiveFramework.detection.primaryType}
- Use assigned marketing angle: ${assignedAngle.name}
- Ensure headline-caption-visual coherence
- No banned patterns or overused words
`;

  // STEP 4: Generate Content with AI
  let attempts = 0;
  let validatedContent = null;
  
  while (attempts < 3 && !validatedContent) {
    attempts++;
    console.log(`\n🎨 Generation Attempt ${attempts}/3...`);
    
    const aiResponse = await callAIModel(contentPrompt);
    
    // Parse AI response
    const generatedContent = {
      headline: aiResponse.headline,
      subheadline: aiResponse.subheadline,
      caption: aiResponse.caption,
      cta: aiResponse.cta,
      coherenceScore: calculateCoherence(aiResponse),
      marketingAngle: assignedAngle.name,
      emotionalTone: aiResponse.tone || 'Professional',
      visualGuidance: adaptiveFramework.primaryModule?.visualRequirements || '',
      isRepetitive: checkRepetition(aiResponse, brandKey)
    };
    
    // STEP 5: Validate with Adaptive Framework
    const validation = validateAdaptiveContent(generatedContent, adaptiveFramework);
    
    if (validation.passed) {
      console.log(`✅ Content passed validation (Score: ${validation.overallScore}/100)`);
      validatedContent = generatedContent;
    } else {
      console.log(`❌ Attempt ${attempts} failed validation`);
      console.log('Failed rules:', validation.failedRules);
      
      if (attempts < 3) {
        console.log('🔄 Retrying with stricter guidance...');
      }
    }
  }
  
  // STEP 6: Return validated content or fallback
  if (validatedContent) {
    return {
      success: true,
      content: validatedContent,
      framework: adaptiveFramework.detection.primaryType,
      validationScore: validation.overallScore
    };
  } else {
    console.log('⚠️ All attempts failed, using fallback content');
    return {
      success: false,
      content: generateFallbackContent(brandProfile, theme),
      framework: 'fallback'
    };
  }
}
```

## Integration Points

### 1. Content Generation Prompt

**Location**: `src/ai/revo-2.0-service.ts` (around line 1900)

**Change**: Add adaptive framework prompt before existing prompt sections

```typescript
// OLD
const contentPrompt = `
🎯 UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK
...
`;

// NEW
const adaptiveFramework = initializeAdaptiveFramework({ brandProfile });
const contentPrompt = `
${adaptiveFramework.combinedPrompt}

🎯 UNIVERSAL MULTI-ANGLE MARKETING FRAMEWORK
...
`;
```

### 2. Image Generation Prompt

**Location**: `src/ai/revo-2.0-service.ts` (around line 1400)

**Change**: Add type-specific visual guidance

```typescript
// Get visual requirements from adaptive framework
const visualGuidance = adaptiveFramework.primaryModule?.visualRequirements || '';

const imagePrompt = `
${visualGuidance}

[Your existing image prompt]
`;
```

### 3. CTA Generation

**Location**: `src/ai/revo-2.0-service.ts` (around line 3130)

**Change**: Use type-specific CTAs

```typescript
function generateUniqueCTA(theme: string, businessType?: string): string {
  // Check adaptive framework for type-specific CTAs
  const module = getTypeSpecificModule(businessType);
  if (module) {
    const ctaExamples = module.ctaGuidance.match(/"([^"]+)"/g);
    if (ctaExamples && ctaExamples.length > 0) {
      const cleanedCTAs = ctaExamples.map(cta => cta.replace(/"/g, ''));
      return cleanedCTAs[Math.floor(Math.random() * cleanedCTAs.length)];
    }
  }
  
  // Fallback to theme-based CTAs
  return getThemeBasedCTA(theme);
}
```

### 4. Validation Layer

**Location**: After content generation, before returning

**Change**: Add adaptive validation

```typescript
// After AI generates content
const validation = validateAdaptiveContent(generatedContent, adaptiveFramework);

if (!validation.passed) {
  console.log('⚠️ Content failed adaptive validation');
  // Log specific failures
  validation.universalValidation.failedRules.forEach(rule => {
    console.log(`  ❌ Universal: ${rule}`);
  });
  validation.typeSpecificValidation.failedRules.forEach(rule => {
    console.log(`  ❌ Type-Specific: ${rule}`);
  });
  
  // Retry or use fallback
}
```

## Testing the Integration

### Test 1: Retail Business

```typescript
const retailBrand = {
  businessName: 'TechHub Electronics',
  businessType: 'Electronics Store',
  description: 'We sell smartphones, laptops, and accessories',
  productCatalog: [
    { name: 'iPhone 15 Pro', price: 'KES 145,000', discount: '12% off' }
  ]
};

const result = await generateRevo2Content({ brandProfile: retailBrand });

// Expected: Product-focused ad with pricing and "Shop Now" CTA
console.log(result.content.headline); // e.g., "iPhone 15 Pro - Save 12%"
console.log(result.content.cta); // e.g., "Shop Now"
```

### Test 2: Service Business

```typescript
const serviceBrand = {
  businessName: 'Kariuki Law Firm',
  businessType: 'Legal Services',
  description: 'Experienced attorneys providing legal counsel',
  services: ['Corporate law', 'Litigation', 'Real estate law']
};

const result = await generateRevo2Content({ brandProfile: serviceBrand });

// Expected: Expertise-focused ad with consultation CTA
console.log(result.content.headline); // e.g., "15+ Years Legal Experience"
console.log(result.content.cta); // e.g., "Book Consultation"
```

### Test 3: Restaurant

```typescript
const restaurantBrand = {
  businessName: 'Bella Cucina',
  businessType: 'Italian Restaurant',
  description: 'Authentic Italian cuisine with wood-fired pizzas',
  services: ['Dine-in', 'Takeout', 'Delivery']
};

const result = await generateRevo2Content({ brandProfile: restaurantBrand });

// Expected: Appetite-appeal ad with sensory language
console.log(result.content.headline); // e.g., "Wood-Fired Pizza Perfection"
console.log(result.content.cta); // e.g., "Reserve Table"
```

## Monitoring and Debugging

### Enable Detailed Logging

```typescript
const adaptiveFramework = initializeAdaptiveFramework({
  brandProfile: brandProfile,
  enableLogging: true // Shows detection and framework loading
});
```

### Check Detection Results

```typescript
console.log('Detection Results:', {
  primaryType: adaptiveFramework.detection.primaryType,
  secondaryType: adaptiveFramework.detection.secondaryType,
  confidence: adaptiveFramework.detection.confidence,
  signals: adaptiveFramework.detection.detectionSignals,
  isHybrid: adaptiveFramework.isHybrid
});
```

### Validate Content Manually

```typescript
import { validateAdaptiveContent, logValidationResults } from '@/ai/adaptive';

const validation = validateAdaptiveContent(content, framework);
logValidationResults(validation, true); // Detailed logging
```

## Troubleshooting

### Issue: Wrong Business Type Detected

**Solution**: Add more specific keywords to brand profile
```typescript
// Enhance description with type-specific keywords
brandProfile.description = 'Electronics retail store selling smartphones...';
// Keywords: 'retail', 'store', 'selling' trigger retail detection
```

### Issue: Validation Always Fails

**Solution**: Check which rules are failing
```typescript
const validation = validateAdaptiveContent(content, framework);
console.log('Failed Universal Rules:', validation.universalValidation.failedRules);
console.log('Failed Type Rules:', validation.typeSpecificValidation.failedRules);
```

### Issue: Hybrid Business Not Detected

**Solution**: Ensure both business aspects are mentioned
```typescript
brandProfile.description = 'Restaurant serving meals and selling packaged spices online';
// Keywords for both 'food' and 'retail' should be present
```

## Performance Considerations

1. **Cache Framework Initialization**: Initialize once per brand, reuse for multiple content generations
2. **Async Detection**: Business type detection is synchronous and fast (<10ms)
3. **Validation Overhead**: Minimal (<5ms per validation)

## Summary

The Adaptive Framework integration is straightforward:
1. Initialize framework with brand profile
2. Use combined prompt for content generation
3. Validate generated content
4. Retry if validation fails

**Result**: Every business type gets industry-appropriate marketing content automatically! 🎉

