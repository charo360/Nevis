# Multi-Assistant Architecture - Proof of Concept Guide

## Overview

This guide explains how to use and extend the Multi-Assistant Architecture for Revo 2.0. The system is designed to be **configuration-driven** and **easily extensible** - adding new assistants requires minimal code changes.

---

## 🎯 What Was Implemented

### Phase 1: Core Infrastructure ✅

1. **Configuration System** (`src/ai/assistants/assistant-configs.ts`)
   - Centralized configuration for all assistants
   - Retail and Finance fully implemented
   - 8 placeholder configs ready for future implementation

2. **Assistant Manager** (`src/ai/assistants/assistant-manager.ts`)
   - Generic orchestration system
   - Works with any business type
   - No business-specific logic in core

3. **Revo 2.0 Integration** (`src/ai/revo-2.0-service.ts`)
   - Feature flag system for gradual rollout
   - Automatic fallback to adaptive framework
   - Business type detection

4. **Creation Script** (`scripts/create-assistants.ts`)
   - Automatically creates assistants in OpenAI
   - Generates environment variable configuration
   - Supports list, create, and delete operations

5. **Test Suite** (`scripts/test-assistants.ts`)
   - Validates assistant functionality
   - Quality analysis per business type
   - Performance metrics

---

## 🚀 Quick Start

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env.local`:

```bash
OPENAI_API_KEY=sk-...your-key-here
```

### Step 2: Create Assistants

Run the creation script to generate assistants in OpenAI:

```bash
npx ts-node scripts/create-assistants.ts
```

This will:
- Create Retail and Finance assistants in OpenAI
- Display assistant IDs
- Generate environment variable configuration

### Step 3: Configure Environment

Copy the assistant IDs from the script output and add to `.env.local`:

```bash
# OpenAI Assistant IDs
OPENAI_ASSISTANT_RETAIL=asst_...
OPENAI_ASSISTANT_FINANCE=asst_...

# Enable gradual rollout (start with 10%)
ASSISTANT_ROLLOUT_RETAIL=10
ASSISTANT_ROLLOUT_FINANCE=10
```

### Step 4: Test Assistants

Validate that assistants work correctly:

```bash
npx ts-node scripts/test-assistants.ts
```

This will:
- Test both Retail and Finance assistants
- Generate sample content
- Analyze quality scores
- Show performance metrics

### Step 5: Monitor in Production

1. Start with 10% rollout
2. Monitor quality and performance
3. Gradually increase to 25%, 50%, 75%, 100%
4. Compare with adaptive framework

---

## 📊 Feature Flag System

The system uses environment variables to control rollout:

```bash
# 0 = Disabled (use adaptive framework)
# 10 = 10% of traffic uses assistant
# 50 = 50% of traffic uses assistant
# 100 = 100% of traffic uses assistant

ASSISTANT_ROLLOUT_RETAIL=10
ASSISTANT_ROLLOUT_FINANCE=10
```

**How it works:**
- Random selection per request
- Automatic fallback if assistant fails
- Logs which system is used
- No code changes needed to adjust rollout

---

## ➕ Adding New Assistants (3 Simple Steps)

The system is designed to make adding new assistants trivial. Here's how:

### Step 1: Add Configuration

Edit `src/ai/assistants/assistant-configs.ts`:

```typescript
const FOOD_CONFIG: AssistantConfig = {
  type: 'food',
  name: 'Revo 2.0 - Food & Beverage Specialist',
  model: 'gpt-4-turbo-preview',
  implemented: true,  // Change from false to true
  envVar: 'OPENAI_ASSISTANT_FOOD',
  instructions: `You are a specialized marketing content generator for food and beverage businesses.

🎯 YOUR EXPERTISE:
You are an expert in restaurant marketing, food photography, and appetite appeal.

📋 CORE REQUIREMENTS:
1. Use sensory language (taste, texture, aroma, visual appeal)
2. Feature signature dishes and specialties
3. Use dining CTAs: "Reserve Table", "Order Now", "View Menu"
4. Include location and delivery information
5. Create mouth-watering descriptions

... (add full instructions)
`,
};
```

### Step 2: Create Assistant in OpenAI

Run the creation script:

```bash
npx ts-node scripts/create-assistants.ts
```

The script automatically detects the new configuration and creates the assistant.

### Step 3: Add Environment Variables

Copy the assistant ID from script output to `.env.local`:

```bash
OPENAI_ASSISTANT_FOOD=asst_...
ASSISTANT_ROLLOUT_FOOD=10
```

**That's it!** No changes to core logic needed. The system automatically:
- Detects the new assistant
- Loads it at startup
- Routes food businesses to the new assistant
- Falls back to adaptive framework if needed

---

## 🏗️ Architecture Design

### Configuration-Driven Approach

```
┌─────────────────────────────────────────────────────────────┐
│                   assistant-configs.ts                       │
│  (Single source of truth for all assistant configurations)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   assistant-manager.ts                       │
│         (Generic orchestration - no business logic)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   revo-2.0-service.ts                        │
│              (Feature flags + automatic fallback)            │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**
   - Configuration in one file
   - Orchestration is generic
   - Business logic in assistant instructions

2. **Zero Core Changes**
   - Adding assistants doesn't modify core logic
   - Only configuration and environment variables

3. **Safe Rollout**
   - Feature flags control traffic
   - Automatic fallback on errors
   - Gradual migration path

4. **Easy Testing**
   - Test each assistant independently
   - Quality analysis per business type
   - Performance monitoring

---

## 📝 Assistant Instructions Template

When creating new assistants, follow this template:

```typescript
instructions: `You are a specialized marketing content generator for [BUSINESS TYPE].

🎯 YOUR EXPERTISE:
[Describe domain expertise]

📋 CORE REQUIREMENTS:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]
4. [Requirement 4]
5. [Requirement 5]

📝 CONTENT STRUCTURE:
- Headline (4-6 words): [Guidance]
- Subheadline (15-25 words): [Guidance]
- Caption (50-100 words): [Guidance]
- CTA (2-4 words): [Guidance]
- Hashtags: [Guidance]

🎪 MARKETING ANGLES FOR [BUSINESS TYPE]:
1. [Angle 1]: [Description]
2. [Angle 2]: [Description]
3. [Angle 3]: [Description]

💡 [BUSINESS TYPE]-SPECIFIC TACTICS:
- [Tactic 1]
- [Tactic 2]
- [Tactic 3]

🚫 BANNED PATTERNS:
- [Pattern 1]
- [Pattern 2]
- [Pattern 3]

✅ QUALITY CHECKLIST:
- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]

📊 OUTPUT FORMAT:
Return ONLY valid JSON in this exact format:
{
  "headline": "...",
  "subheadline": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": ["...", "...", "..."]
}

⚠️ CRITICAL: Always return valid JSON. No additional text before or after the JSON object.
`,
```

---

## 🧪 Testing New Assistants

### Add Test Case

Edit `scripts/test-assistants.ts`:

```typescript
const TEST_BRANDS = {
  // ... existing brands
  
  food: {
    businessName: 'Bella Napoli',
    businessType: 'Italian Restaurant',
    description: 'Authentic Italian cuisine with wood-fired pizzas',
    location: 'Nairobi, Kenya',
    services: ['Dine-in', 'Takeaway', 'Delivery', 'Catering'],
    targetAudience: 'Food lovers aged 25-55',
  },
};

const TEST_CONCEPTS = {
  // ... existing concepts
  
  food: {
    concept: 'Wood-fired pizza fresh from the oven',
    imagePrompt: 'Margherita pizza with bubbling cheese, wood-fired oven in background',
  },
};
```

### Run Tests

```bash
npx ts-node scripts/test-assistants.ts
```

---

## 📊 Monitoring and Optimization

### Quality Metrics to Track

1. **Content Relevance** (1-10)
   - Does content match business type?
   - Are industry-specific terms used?

2. **Specificity** (1-10)
   - Are specific products/services mentioned?
   - Are prices/numbers included?

3. **Engagement** (1-10)
   - Is CTA appropriate?
   - Does it drive action?

4. **Creativity** (1-10)
   - Is content unique?
   - Avoids repetitive patterns?

### Performance Metrics

1. **Latency**
   - Target: < 5 seconds per generation
   - Monitor: Average, P95, P99

2. **Success Rate**
   - Target: > 95% success rate
   - Monitor: Failures and fallbacks

3. **Cost**
   - Track: Cost per generation
   - Compare: Assistant vs Adaptive Framework

### Optimization Tips

1. **Improve Instructions**
   - Add more specific examples
   - Clarify ambiguous requirements
   - Add quality checklists

2. **A/B Testing**
   - Create v2 of assistant with different approach
   - Split traffic 50/50
   - Measure quality difference

3. **Model Selection**
   - Use GPT-4 Turbo for complex business types (finance, healthcare)
   - Use GPT-4o-mini for simpler types (retail, food)
   - Balance quality vs cost

---

## 🔧 Troubleshooting

### Assistant Not Loading

**Problem**: "No assistant available for business type: retail"

**Solution**:
1. Check `.env.local` has `OPENAI_ASSISTANT_RETAIL=asst_...`
2. Verify assistant ID is correct
3. Restart development server

### Generation Fails

**Problem**: "Assistant run failed: ..."

**Solution**:
1. Check OpenAI API key is valid
2. Verify assistant exists in OpenAI dashboard
3. Check assistant instructions are valid
4. System automatically falls back to adaptive framework

### Invalid JSON Response

**Problem**: "Invalid response format from assistant"

**Solution**:
1. Update assistant instructions to emphasize JSON format
2. Add more examples of correct JSON
3. Test with simpler prompts first

---

## 📚 Additional Resources

### Scripts

- `scripts/create-assistants.ts` - Create assistants in OpenAI
- `scripts/test-assistants.ts` - Test assistant functionality
- `npx ts-node scripts/create-assistants.ts list` - List all assistants
- `npx ts-node scripts/create-assistants.ts delete` - Delete all assistants

### Files

- `src/ai/assistants/assistant-configs.ts` - Configuration
- `src/ai/assistants/assistant-manager.ts` - Core orchestration
- `src/ai/assistants/index.ts` - Exports
- `src/ai/revo-2.0-service.ts` - Integration

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_ASSISTANT_[TYPE]` - Assistant IDs
- `ASSISTANT_ROLLOUT_[TYPE]` - Rollout percentages (0-100)

---

## ✅ Success Criteria

The POC is successful if:

1. ✅ Both assistants (Retail + Finance) generate content
2. ✅ Quality scores > 70% on test suite
3. ✅ Latency < 5 seconds per generation
4. ✅ Feature flags work correctly
5. ✅ Fallback to adaptive framework works
6. ✅ Adding new assistant takes < 30 minutes

---

## 🎯 Next Steps

1. **Validate Quality** - Generate 50+ posts per business type, review quality
2. **Enable Rollout** - Start with 10% traffic, monitor metrics
3. **Add More Assistants** - Implement Service, SaaS, Food, Healthcare
4. **Optimize Instructions** - Refine based on quality feedback
5. **Scale to 100%** - Gradually increase rollout percentage

---

## 📞 Support

For questions or issues:
1. Check this guide first
2. Review code comments in source files
3. Test with `scripts/test-assistants.ts`
4. Check OpenAI dashboard for assistant status

