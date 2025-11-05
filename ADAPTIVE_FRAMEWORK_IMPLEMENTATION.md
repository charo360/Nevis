# Adaptive Business-Type Marketing Framework

## Overview

The Adaptive Marketing Framework is a sophisticated system that automatically detects business types and applies appropriate marketing strategies. It ensures that retail businesses get product-focused ads, service businesses get expertise-focused ads, SaaS companies get feature-benefit ads, and so on.

## Problem Solved

**Before**: Revo 2.0 was applying the same generic marketing approach to all businesses, resulting in:
- Retail businesses getting service-style ads without product focus
- Service businesses getting product-style ads without expertise emphasis
- Financial services getting casual retail-style messaging
- One-size-fits-all content that didn't match industry best practices

**After**: Each business type gets industry-appropriate marketing with:
- Type-specific content focus and messaging tone
- Industry-appropriate CTAs and visual requirements
- Additional marketing angles relevant to that industry
- Validation that ensures type-specific requirements are met

## System Architecture

```
┌─────────────────────────────────┐
│   UNIVERSAL MARKETING CORE      │
│ - 10 universal rules            │
│ - 7 universal angles            │
│ - Quality standards             │
└───────────────┬─────────────────┘
                │
                ↓
┌───────────────────────────────────────┐
│     BUSINESS TYPE DETECTOR            │
│  Analyzes: description, keywords,     │
│  website, products/services           │
└───────────────┬───────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ↓                       ↓
┌─────────┐           ┌─────────┐
│ PRIMARY │           │SECONDARY│
│  TYPE   │           │  TYPE   │
└────┬────┘           └────┬────┘
     │                     │
     ↓                     ↓
┌──────────────────────────────┐
│   LOAD RELEVANT MODULES      │
│ ✓ Retail rules               │
│ ✓ Service rules              │
│ ✓ SaaS rules                 │
│ ✓ Food rules                 │
│ ✓ Finance rules              │
│ ✓ Healthcare rules           │
└────────────┬─────────────────┘
             │
             ↓
    ┌────────────────┐
    │ GENERATE ADS   │
    │ Using combined │
    │    ruleset     │
    └────────┬───────┘
             │
             ↓
    ┌────────────────┐
    │ QUALITY CHECK  │
    │ Universal + Type│
    │ -specific rules │
    └────────┬───────┘
             │
             ↓
       ┌─────────┐
       │ OUTPUT  │
       └─────────┘
```

## Components

### 1. Business Type Detector (`business-type-detector.ts`)

**Purpose**: Automatically identifies business type from brand profile data

**Supported Types**:
1. Retail/E-commerce
2. Service Business
3. SaaS/Digital Product
4. Food & Beverage
5. Financial Services
6. Healthcare/Wellness
7. Real Estate
8. Education/Training
9. B2B/Enterprise
10. Nonprofit/Advocacy

**Detection Method**:
- Analyzes business description, name, services, products, website content
- Uses keyword matching with weighted scoring
- Detects primary and secondary types for hybrid businesses
- Returns confidence score (0-100%)

**Example**:
```typescript
const detection = detectBusinessType(brandProfile);
// Result: { primaryType: 'retail', confidence: 85%, detectionSignals: ['shop', 'products', 'buy'] }
```

### 2. Universal Rules (`universal-rules.ts`)

**Purpose**: Core rules that apply to ALL business types

**10 Universal Rules**:
1. ✅ Headline-Visual-Caption Coherence
2. ✅ Marketing Angle Diversity
3. ✅ No Generic Corporate Jargon
4. ✅ Clear Call-to-Action
5. ✅ Target Audience Clarity
6. ✅ Tone Matches Audience and Context
7. ✅ One Main Message Per Ad
8. ✅ Visual Supports Headline Story
9. ✅ No Formula Repetition
10. ✅ Specific Benefits Over Vague Claims

**Banned Patterns**:
- "Finance Your Ambitions"
- "Transform Your Business"
- "Empower Your Journey"
- "Unlock Your Tomorrow"
- "The Future is Now"
- "Banking Made Simple"
- "Seamless Experience"

**Overused Words** (automatically stripped):
- journey, seamless, effortless, transform, empower, revolutionize, innovative, cutting-edge

### 3. Type-Specific Rules (`type-specific-rules.ts`)

**Purpose**: Modular rule sets conditionally loaded based on business type

#### Retail/E-commerce Module

**Required Elements**:
1. ✅ Product Visibility - Specific product must be shown/mentioned
2. ✅ Pricing Signals - Include price, discount, or savings
3. ✅ Stock Status - Indicate availability
4. ✅ Trust Signals - Authenticity, warranty, quality indicators
5. ✅ Transactional CTA - "Shop Now", "Buy Today", "Order Now"

**Additional Angles**:
- Price-focused angle
- Product launch angle
- Seasonal/sale angle
- Payment/financing angle
- Bundle/package angle

**Example Ad**:
```
Headline: "iPhone 15 Pro - In Stock Now"
Caption: "128GB from KES 145,000. Save 12% on genuine products. 
         1-year warranty included. Shop online or visit showroom."
CTA: "Shop Now"
```

#### Service Business Module

**Required Elements**:
1. ✅ Expertise/Credentials - Show qualifications
2. ✅ Problem-Solution Focus - Address pain points
3. ✅ Consultation CTA - "Book Appointment", "Schedule Consultation"
4. ✅ Professional Imagery - Show professionals at work
5. ✅ Transformation/Results - Demonstrate outcomes

**Additional Angles**:
- Expertise/credential angle
- Process/methodology angle
- Specialization angle
- Consultation offer angle
- Emergency/urgent service angle

**Example Ad**:
```
Headline: "Facing a Legal Dispute?"
Caption: "Our team of 15+ experienced attorneys has won 200+ cases. 
         Get a free consultation to discuss your options."
CTA: "Book Free Consultation"
```

#### SaaS/Digital Product Module

**Required Elements**:
1. ✅ Feature Benefits - Show what it does and why it matters
2. ✅ Interface Showcase - Include screenshots
3. ✅ Use-Case Scenario - Demonstrate practical application
4. ✅ Trial CTA - "Try Free", "Start Free Trial"
5. ✅ Ease of Use - Highlight simplicity

**Additional Angles**:
- Feature comparison angle
- Integration angle
- Automation/time-saving angle
- Scalability angle
- ROI/cost-savings angle

**Example Ad**:
```
Headline: "Your Team, Finally Organized"
Caption: "Stop losing track of projects. Our intuitive platform 
         keeps everyone aligned. Used by 500+ teams in Kenya."
CTA: "Start Free 14-Day Trial"
```

#### Food & Beverage Module

**Required Elements**:
1. ✅ Food Imagery Primary - Food must be main visual focus
2. ✅ Sensory Language - Describe taste, texture, aroma
3. ✅ Signature Items - Feature specific dishes
4. ✅ Dining CTA - "Reserve Table", "Order Now"
5. ✅ Location/Delivery Info - How to access the food

**Additional Angles**:
- Signature dish angle
- Cuisine/style angle
- Occasion angle (date night, family dinner)
- Dietary accommodation angle
- Chef/expertise angle

**Example Ad**:
```
Headline: "Nyama Choma Like Mama Used to Make"
Caption: "Authentic Kenyan BBQ, slow-cooked to perfection. 
         Dine-in or delivery within 30 minutes."
CTA: "Order Now"
```

#### Financial Services Module

**Required Elements**:
1. ✅ Security/Trust Signals - Emphasize safety
2. ✅ Rates/Fees Transparency - Show pricing clearly
3. ✅ Financial Benefits/ROI - Quantify outcomes
4. ✅ Low-Friction CTA - "Learn More", "Get Quote"
5. ✅ Regulatory Compliance - Show licenses/certifications

**Additional Angles**:
- Security/protection angle
- ROI/growth angle
- Simplification angle
- Speed/convenience angle
- Expert guidance angle

**Example Ad**:
```
Headline: "Grow Your Savings by 5% APY"
Caption: "High-yield savings with no minimum balance and no fees. 
         FDIC insured up to $250,000. Start saving smarter today."
CTA: "Learn More"
```

#### Healthcare Module

**Required Elements**:
1. ✅ Health Outcomes Focus - Emphasize benefits
2. ✅ Professional Expertise - Show credentials
3. ✅ Patient-Centered Care - Emphasize personalized service
4. ✅ Appointment CTA - "Book Appointment"
5. ✅ Facility/Equipment Quality - Highlight modern facilities

**Additional Angles**:
- Prevention angle
- Expertise angle
- Technology angle
- Comfort angle
- Results angle

### 4. Adaptive Framework Orchestrator (`adaptive-framework.ts`)

**Purpose**: Coordinates detection, rule loading, and validation

**Main Functions**:

#### `initializeAdaptiveFramework(config)`
- Detects business type
- Loads appropriate modules
- Generates combined prompt with universal + type-specific rules
- Returns framework configuration

#### `validateAdaptiveContent(content, framework)`
- Validates against universal rules
- Validates against type-specific rules
- Checks for banned patterns
- Returns overall score and pass/fail status

#### `getMarketingAnglesForType(framework)`
- Returns all available angles (universal + type-specific)
- Used for angle rotation and diversity

## Hybrid Business Support

The system handles businesses with multiple types (e.g., restaurant with online store):

**Detection**:
- Primary Type: Most prominent business model (70% weight)
- Secondary Type: Supporting business model (30% weight)

**Framework Loading**:
- Loads primary module fully
- Loads selected rules from secondary module
- Provides guidance on content distribution

**Example**: Restaurant with Packaged Goods Store
- Primary: Food & Beverage (dining ads)
- Secondary: Retail (product ads for packaged goods)
- Content Mix: 70% dining ads, 30% product ads

## Integration with Revo 2.0

### Step 1: Initialize Framework
```typescript
import { initializeAdaptiveFramework } from '@/ai/adaptive';

const framework = initializeAdaptiveFramework({
  brandProfile: brandProfile,
  enableLogging: true
});
```

### Step 2: Use Combined Prompt
```typescript
const contentPrompt = `
${framework.combinedPrompt}

[Your existing prompt content]
`;
```

### Step 3: Validate Generated Content
```typescript
const validation = validateAdaptiveContent(generatedContent, framework);

if (!validation.passed) {
  console.log('Validation failed:', validation.failedRules);
  // Retry or use fallback
}
```

## Benefits

### 1. Industry-Appropriate Marketing
- Retail: Product-focused with pricing
- Service: Expertise-focused with consultation CTAs
- SaaS: Feature-benefit with trial CTAs
- Food: Appetite-appeal with sensory language
- Finance: Trust-focused with security emphasis

### 2. Automatic Adaptation
- No manual configuration needed
- Detects business type automatically
- Loads appropriate rules dynamically

### 3. Quality Assurance
- Multi-layer validation
- Universal + type-specific checks
- Banned pattern detection
- Coherence scoring

### 4. Flexibility
- Supports hybrid businesses
- Allows for secondary business types
- Graceful fallback for unknown types

### 5. Consistency
- Universal rules ensure baseline quality
- Type-specific rules ensure industry appropriateness
- Angle diversity prevents repetition

## Files Created

1. **`src/ai/adaptive/business-type-detector.ts`** - Business type detection logic
2. **`src/ai/adaptive/universal-rules.ts`** - Universal marketing rules
3. **`src/ai/adaptive/type-specific-rules.ts`** - Type-specific rule modules
4. **`src/ai/adaptive/adaptive-framework.ts`** - Framework orchestrator
5. **`src/ai/adaptive/index.ts`** - Export all components
6. **`src/ai/adaptive/test-adaptive-system.ts`** - Test suite

## Next Steps

1. ✅ Integrate with Revo 2.0 content generation
2. ✅ Add remaining business type modules (Real Estate, Education, B2B, Nonprofit)
3. ✅ Test with real brand profiles
4. ✅ Monitor and refine detection accuracy
5. ✅ Collect feedback and iterate

## Summary

The Adaptive Marketing Framework ensures that every business type gets marketing content that follows industry best practices. It combines universal quality standards with type-specific requirements to generate appropriate, effective marketing content automatically.

**Result**: Retail businesses get product-focused ads, service businesses get expertise-focused ads, restaurants get appetite-appeal ads, and financial services get trust-focused ads - all automatically based on business type detection.

