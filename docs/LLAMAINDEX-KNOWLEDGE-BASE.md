# LlamaIndex Knowledge Base System

## Overview

The LlamaIndex Knowledge Base provides **persistent, intelligent memory** for Revo 2.0, maintaining knowledge across sessions about:

1. **Past Successful Posts** - Avoid repetition, learn from performance
2. **Brand Guidelines** - Ensure consistent brand voice and compliance
3. **Cultural Context** - Culturally appropriate content for different markets
4. **Competitor Analysis** - Maintain differentiation and competitive advantage

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE SYSTEM                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              LlamaIndex Vector Store                     │  │
│  │  - Semantic search across all knowledge                  │  │
│  │  - GPT-4 powered embeddings                              │  │
│  │  - Fast similarity queries                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase PostgreSQL                         │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │  Past Posts    │  │  Brand         │                 │  │
│  │  │  - Headlines   │  │  Guidelines    │                 │  │
│  │  │  - Captions    │  │  - Voice       │                 │  │
│  │  │  - Performance │  │  - Prohibited  │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │  Cultural      │  │  Competitor    │                 │  │
│  │  │  Context       │  │  Analysis      │                 │  │
│  │  │  - Phrases     │  │  - Strengths   │                 │  │
│  │  │  - Norms       │  │  - Weaknesses  │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Enhanced Validation Agent                        │  │
│  │  - Validates against all knowledge sources               │  │
│  │  - Comprehensive compliance checking                     │  │
│  │  - Intelligent suggestions                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 1. Past Successful Posts

### Purpose
- **Avoid Repetition**: Never generate similar content twice
- **Learn from Performance**: Prioritize approaches that worked well
- **Track Patterns**: Identify overused selling angles or tones

### Data Stored
```typescript
interface PastPost {
  id: string;
  businessId: string;
  platform: string;
  headline: string;
  caption: string;
  sellingAngle: string;
  emotionalTone: string;
  targetAudience: string;
  performanceScore?: number; // Engagement metrics
  createdAt: Date;
}
```

### Usage
```typescript
import { getKnowledgeBase } from '@/ai/knowledge/llamaindex-knowledge-base';

const kb = getKnowledgeBase();

// Query past posts
const pastPosts = await kb.queryPastPosts('paya-kenya', 'payment solutions', 20);

// Store new post
await kb.storePastPost({
  id: 'post-123',
  businessId: 'paya-kenya',
  platform: 'instagram',
  headline: 'Digital Banking Made Simple',
  caption: 'Open account in minutes...',
  sellingAngle: 'speed',
  emotionalTone: 'reassuring',
  targetAudience: 'small-business-owners',
  performanceScore: 8.5,
  createdAt: new Date()
});
```

### Analytics
```sql
-- Get content variety statistics
SELECT * FROM get_content_variety_stats('paya-kenya', 30);

-- Results:
-- selling_angle | count | percentage
-- speed         | 15    | 30.00
-- price         | 12    | 24.00
-- security      | 10    | 20.00
-- convenience   | 8     | 16.00
-- social-proof  | 5     | 10.00
```

## 2. Brand Guidelines

### Purpose
- **Consistent Voice**: Maintain brand personality across all content
- **Compliance**: Avoid prohibited words or phrases
- **Quality Control**: Ensure content aligns with brand standards

### Data Stored
```typescript
interface BrandGuidelines {
  businessId: string;
  brandVoice: string;
  prohibitedWords: string[];
  preferredPhrases: string[];
  colorPalette: string[];
  logoUsageRules: string;
  targetAudience: string;
  competitiveAdvantages: string[];
  updatedAt: Date;
}
```

### Usage
```typescript
// Store brand guidelines
await kb.storeBrandGuidelines({
  businessId: 'paya-kenya',
  brandVoice: 'Professional, trustworthy, empowering',
  prohibitedWords: ['cheap', 'discount', 'limited time'],
  preferredPhrases: ['instant', 'secure', 'trusted by'],
  colorPalette: ['#E4574C', '#2A2A2A', '#FFFFFF'],
  logoUsageRules: 'Always bottom right, 20px margin',
  targetAudience: 'Small business owners in Kenya',
  competitiveAdvantages: [
    'No credit checks required',
    'Instant account opening',
    'Trusted by 1M+ Kenyans'
  ],
  updatedAt: new Date()
});

// Retrieve guidelines
const guidelines = await kb.getBrandGuidelines('paya-kenya');
```

### Validation
```typescript
// Automatic validation during content generation
const validation = validateBrandGuidelines(content, guidelines);

if (!validation.passed) {
  console.log('Violations:', validation.violations);
  // Example: "Contains prohibited word: 'cheap'"
}
```

## 3. Cultural Context

### Purpose
- **Culturally Appropriate**: Avoid offensive or insensitive content
- **Local Relevance**: Use appropriate local phrases and imagery
- **Market Adaptation**: Understand cultural norms and business etiquette

### Data Stored
```typescript
interface CulturalContext {
  country: string;
  language: string;
  localPhrases: { phrase: string; meaning: string; usage: string }[];
  culturalNorms: string[];
  avoidTopics: string[];
  preferredImagery: string[];
  businessEtiquette: string[];
  updatedAt: Date;
}
```

### Pre-Seeded Countries
- **Kenya** (Swahili)
- **Nigeria** (Pidgin English)
- **India** (Hindi)
- More countries can be added via SQL

### Usage
```typescript
// Get cultural context
const context = await kb.getCulturalContext('Kenya');

console.log(context.localPhrases);
// [
//   { phrase: "Karibu", meaning: "Welcome", usage: "Greetings, invitations" },
//   { phrase: "Haraka", meaning: "Fast/Quick", usage: "Speed emphasis" },
//   { phrase: "Hakuna matata", meaning: "No worries", usage: "Reassurance" }
// ]

console.log(context.avoidTopics);
// ["Political topics", "Tribal divisions"]

console.log(context.preferredImagery);
// ["Local markets (Gikomba, Eastleigh)", "Matatu culture", "Mobile money (M-Pesa)"]
```

### Validation
```typescript
// Automatic cultural validation
const validation = validateCulturalContext(content, context);

if (!validation.passed) {
  console.log('Cultural issues:', validation.issues);
  // Example: "Contains sensitive topic: 'Political topics'"
}
```

## 4. Competitor Analysis

### Purpose
- **Differentiation**: Ensure content stands out from competitors
- **Avoid Similarity**: Don't copy competitor messaging
- **Opportunity Identification**: Highlight unique advantages

### Data Stored
```typescript
interface CompetitorAnalysis {
  businessId: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  contentApproaches: string[];
  differentiationOpportunities: string[];
  analyzedAt: Date;
}
```

### Usage
```typescript
// Store competitor analysis
await kb.storeCompetitorAnalysis({
  businessId: 'paya-kenya',
  competitorName: 'M-Pesa',
  strengths: [
    'Market leader',
    'Widespread adoption',
    'Strong brand recognition'
  ],
  weaknesses: [
    'Limited to mobile money',
    'No credit facilities',
    'High transaction fees'
  ],
  contentApproaches: [
    'Focus on ubiquity',
    'Emphasize trust',
    'Highlight simplicity'
  ],
  differentiationOpportunities: [
    'Offer credit without checks',
    'Lower transaction fees',
    'Full banking features'
  ],
  analyzedAt: new Date()
});

// Retrieve competitor analysis
const competitors = await kb.getCompetitorAnalysis('paya-kenya');
```

### Validation
```typescript
// Automatic competitor differentiation check
const validation = validateCompetitorDifferentiation(content, competitors);

if (!validation.passed) {
  console.log('Too similar to:', validation.tooSimilarTo);
  // Example: "M-Pesa (uses similar approach: 'Focus on ubiquity')"
}
```

## Enhanced Validation Workflow

### Complete Validation Process

```typescript
import { validateWithKnowledgeBase } from '@/ai/agents/enhanced-validation-agent';

const result = await validateWithKnowledgeBase(
  'paya-kenya',
  'Kenya',
  {
    headline: 'Digital Banking Made Simple',
    caption: 'Open account in minutes. No credit checks required...'
  }
);

console.log(result);
// {
//   isUnique: true,
//   similarityScore: 88,
//   brandGuidelineCompliance: {
//     passed: true,
//     violations: []
//   },
//   culturalAppropriate: {
//     passed: true,
//     issues: []
//   },
//   competitorDifferentiation: {
//     passed: true,
//     tooSimilarTo: []
//   },
//   suggestions: []
// }
```

### Validation Criteria

| Check | Weight | Pass Threshold |
|-------|--------|----------------|
| **Uniqueness** | 40% | Score >= 75 |
| **Brand Guidelines** | 25% | No violations |
| **Cultural Appropriateness** | 20% | No issues |
| **Competitor Differentiation** | 15% | Not too similar |

### Automatic Storage

```typescript
// Store successful generation
await storeSuccessfulGeneration(
  'paya-kenya',
  'instagram',
  {
    headline: 'Digital Banking Made Simple',
    caption: 'Open account in minutes...',
    sellingAngle: 'speed',
    emotionalTone: 'reassuring'
  },
  8.5 // Performance score (optional)
);
```

## Database Schema

### Tables Created

1. **knowledge_base_posts** - Past successful posts
2. **knowledge_base_guidelines** - Brand guidelines per business
3. **knowledge_base_cultural** - Cultural context per country
4. **knowledge_base_competitors** - Competitor analysis

### Indexes

- Fast queries by business_id
- Time-based queries (created_at, analyzed_at)
- Platform and selling angle filters

### Row Level Security (RLS)

- Users can only access their own business data
- Cultural context is public (read-only)
- Service role has full access

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the schema
supabase db push

# Or manually run the SQL file
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/20241130_knowledge_base_schema.sql
```

### 2. Initialize Knowledge Base

```typescript
import { getKnowledgeBase } from '@/ai/knowledge/llamaindex-knowledge-base';

const kb = getKnowledgeBase();

// Initialize for a business
await kb.initialize('paya-kenya');
```

### 3. Configure Environment Variables

```env
# Already configured
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Integration with Revo 2.0

### Modified Validation Wrapper

```typescript
// In revo-2.0-validation-wrapper.ts
import { validateWithKnowledgeBase, storeSuccessfulGeneration } from './enhanced-validation-agent';

export async function generateWithValidation(
  businessId: string,
  country: string,
  generateFunction: () => Promise<any>,
  config: ValidationConfig
): Promise<any> {
  
  // Generate content
  const content = await generateFunction();
  
  // Enhanced validation with knowledge base
  const validation = await validateWithKnowledgeBase(
    businessId,
    country,
    {
      headline: content.headline,
      caption: content.caption
    }
  );
  
  if (validation.isUnique) {
    // Store successful generation
    await storeSuccessfulGeneration(
      businessId,
      'instagram',
      {
        headline: content.headline,
        caption: content.caption,
        sellingAngle: content.sellingAngle,
        emotionalTone: content.emotionalTone
      }
    );
  }
  
  return { content, validation };
}
```

## Benefits

### 1. Long-Term Memory
- **Persistent**: Knowledge survives server restarts
- **Scalable**: Handles millions of posts
- **Fast**: Vector search for instant retrieval

### 2. Intelligent Validation
- **Multi-Dimensional**: 4 validation checks
- **Context-Aware**: Understands business and market
- **Actionable**: Provides specific improvement suggestions

### 3. Continuous Learning
- **Performance Tracking**: Learn from successful posts
- **Pattern Recognition**: Identify what works
- **Adaptive**: Improves over time

### 4. Brand Consistency
- **Automated Compliance**: No manual checking needed
- **Cultural Sensitivity**: Avoid offensive content
- **Competitive Edge**: Maintain differentiation

## Performance Metrics

### Expected Results
- **95%+ unique content** across all generations
- **100% brand compliance** with automated checking
- **Zero cultural issues** with pre-seeded context
- **Clear differentiation** from competitors

### Query Performance
- **Vector search**: < 100ms
- **Database queries**: < 50ms
- **Total validation**: < 2 seconds

### Storage
- **10,000 posts**: ~5MB
- **100 businesses**: ~1MB guidelines
- **50 countries**: ~500KB cultural context

## Future Enhancements

### Phase 2: Advanced Features

1. **Performance Analytics**
   - Track engagement metrics
   - Learn from high-performing content
   - Suggest optimal posting times

2. **Automated Competitor Monitoring**
   - Scrape competitor content
   - Analyze messaging trends
   - Alert on new approaches

3. **Multi-Language Support**
   - Automatic translation
   - Language-specific validation
   - Cultural adaptation

4. **A/B Testing Integration**
   - Generate variations
   - Track performance
   - Optimize automatically

## Troubleshooting

### Issue: LlamaIndex not finding documents

**Solution**: Initialize the knowledge base first
```typescript
await kb.initialize('your-business-id');
```

### Issue: Supabase connection errors

**Solution**: Check environment variables
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Issue: Slow vector search

**Solution**: Reduce query limit
```typescript
const posts = await kb.queryPastPosts(businessId, query, 10); // Instead of 50
```

## Conclusion

The LlamaIndex Knowledge Base transforms Revo 2.0 from a stateless content generator into an **intelligent system with memory**. It:

✅ **Prevents repetition** through persistent post history
✅ **Ensures brand compliance** with automated guideline checking
✅ **Maintains cultural sensitivity** with pre-seeded context
✅ **Preserves differentiation** through competitor analysis

This creates a **continuously improving system** that gets smarter with every generation.
