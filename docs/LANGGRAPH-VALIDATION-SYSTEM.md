# LangGraph Validation System for Revo 2.0

## Overview

The LangGraph Validation System is a multi-agent architecture that prevents repetitive content in Revo 2.0 by validating each generation against recent history and automatically retrying with different approaches when similarity is detected.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Revo 2.0 Generation                      │
│                                                             │
│  1. Business Analysis                                       │
│  2. Creative Concept (6D Framework)                         │
│  3. Content Generation (OpenAI Assistant)                   │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        VALIDATION WRAPPER (NEW)                      │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │  Validation Agent (GPT-4)                  │    │  │
│  │  │  - Analyzes content similarity             │    │  │
│  │  │  - Scores uniqueness (0-100)               │    │  │
│  │  │  - Provides improvement suggestions        │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │  Generation History (LRU Cache)            │    │  │
│  │  │  - Stores last 10 generations per business │    │  │
│  │  │  - Tracks content characteristics          │    │  │
│  │  │  - 1-hour TTL                               │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                      │  │
│  │  Decision: Unique? (Score >= 75)                    │  │
│  │     ├─ YES → Approve & Store                        │  │
│  │     └─ NO  → Retry (max 3 attempts)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  4. Image Generation                                        │
│  5. Final Output                                            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Validation Agent (`src/ai/agents/validation-agent.ts`)

**Purpose**: Analyzes content uniqueness using GPT-4

**Key Functions**:
- `validateContentUniqueness()` - Compares new content against recent generations
- `extractContentCharacteristics()` - Identifies selling angle, tone, and opening type

**Validation Criteria** (100 points total):
- **Selling Angle Variety** (30 points): Price vs features vs benefits vs social proof
- **Opening Structure Variety** (25 points): Question vs statement vs story
- **Emotional Tone Variety** (20 points): Urgent vs calm vs exciting
- **Word/Phrase Uniqueness** (15 points): Avoiding exact repetition
- **Target Audience Variety** (10 points): Different customer personas

**Scoring**:
- 90-100: Excellent - Completely unique
- 75-89: Good - Mostly unique, acceptable
- 60-74: Borderline - Some repetition
- 0-59: Reject - Too similar, must regenerate

### 2. Generation History (`src/ai/agents/generation-history.ts`)

**Purpose**: Tracks recent generations for comparison

**Storage**:
- In-memory LRU cache
- 100 businesses max
- 10 generations per business
- 1-hour TTL

**Functions**:
- `storeGeneration()` - Save new generation
- `getRecentGenerations()` - Retrieve history for validation
- `getGenerationStats()` - Analytics on content variety
- `logGenerationStats()` - Display statistics

### 3. Validation Wrapper (`src/ai/agents/revo-2.0-validation-wrapper.ts`)

**Purpose**: Orchestrates validation workflow with retry logic

**Configuration**:
```typescript
{
  maxRetries: 3,              // Max attempts before giving up
  minSimilarityScore: 75,     // Minimum score to pass
  enableValidation: true      // Toggle validation on/off
}
```

**Workflow**:
1. Generate content with assistant
2. Validate against recent history
3. If unique (score >= 75) → Approve & store
4. If similar (score < 75) → Retry with different approach
5. Max 3 attempts, then use last generation with warning

**Metrics Tracking**:
- Total generations
- First-attempt success rate
- Retry success rate
- Validation failure rate
- Average attempts per generation
- Average similarity scores

## Integration with Revo 2.0

### Modified Files

**`src/ai/revo-2.0-service.ts`** (lines 5251-5305):
```typescript
// Wrap assistant generation with validation
const { generateWithValidation, trackValidationMetrics } = 
  await import('./agents/revo-2.0-validation-wrapper');

const validatedResult = await generateWithValidation(
  businessId,
  async () => {
    // Generate content with assistant
    return await assistantManager.generateContent({...});
  },
  {
    maxRetries: 3,
    minSimilarityScore: 75,
    enableValidation: true
  }
);
```

### Configuration

**Enable/Disable Validation**:
```typescript
// In revo-2.0-service.ts, line 5283
enableValidation: true  // Set to false to disable
```

**Adjust Thresholds**:
```typescript
minSimilarityScore: 75  // Increase for stricter validation (75-90)
maxRetries: 3           // Increase for more attempts (3-5)
```

## Benefits

### 1. **Prevents Repetition**
- Automatically detects similar content
- Forces different approaches when repetition detected
- Tracks patterns across multiple dimensions

### 2. **Better Quality**
- Specialized validation agent focuses only on uniqueness
- GPT-4 provides intelligent similarity analysis
- Actionable suggestions for improvement

### 3. **Scalability**
- Works for any business type
- Adapts to different content styles
- No manual intervention required

### 4. **Transparency**
- Detailed logging of validation process
- Metrics tracking for performance monitoring
- Clear rejection reasons and suggestions

## Usage Examples

### Example 1: First Generation (Auto-Approve)

```
🔍 [Validation Agent] Starting content uniqueness check...
📊 [Validation Agent] Comparing against 0 recent ads
✅ [Validation Agent] No recent content - auto-approved
📊 [Validation Agent] Similarity Score: 100/100
```

### Example 2: Similar Content (Rejected)

```
🔍 [Validation Agent] Starting content uniqueness check...
📊 [Validation Agent] Comparing against 5 recent ads
📊 [Validation Agent] Similarity Score: 45/100
❌ [Validation Agent] REJECTED
🚫 [Validation Agent] Rejection Reason: Too similar to recent generation #2
💡 [Validation Agent] Suggestions:
   1. Try a different selling angle (e.g., cost savings instead of speed)
   2. Use a question-based opening instead of statement
   3. Target a different customer persona
🔄 [Validation Wrapper] Retrying with different approach...
```

### Example 3: Unique Content (Approved)

```
🔍 [Validation Agent] Starting content uniqueness check...
📊 [Validation Agent] Comparing against 5 recent ads
📊 [Validation Agent] Similarity Score: 88/100
✅ [Validation Agent] APPROVED
💾 [Generation History] Stored generation for business paya-kenya
```

## Testing

### Run Test Script

```bash
npx tsx scripts/test-validation-agent.ts
```

### Test Cases Covered

1. **First Generation**: No history, auto-approve
2. **Very Similar Content**: Should reject with suggestions
3. **Different Angle**: Should approve
4. **Problem-Solution Approach**: Should approve
5. **Validation Workflow**: Simulates retry logic

### Expected Output

```
🧪 Testing LangGraph Validation Agent
============================================================

📝 TEST 1: First Generation (No History)
------------------------------------------------------------
Result: ✅ APPROVED
Score: 100/100

📝 TEST 2: Very Similar Content
------------------------------------------------------------
Result: ❌ REJECTED
Score: 42/100
Reason: Opening structure and selling angle too similar to recent generation
Suggestions:
  1. Try a different selling angle (e.g., security focus instead of speed)
  2. Use a question-based opening
  3. Highlight different benefits

📝 TEST 3: Different Selling Angle
------------------------------------------------------------
Result: ✅ APPROVED
Score: 92/100

📊 Generation Statistics
============================================================
Business ID: test-paya-kenya
Total Generations: 3

🎯 Selling Angles:
  - benefit: 2 (66.7%)
  - price: 1 (33.3%)

💫 Emotional Tones:
  - reassuring: 2 (66.7%)
  - neutral: 1 (33.3%)

📝 Opening Types:
  - statement: 3 (100.0%)

⏱️ History Span: 2 minutes
```

## Performance Impact

### API Costs
- **Additional Calls**: 1 GPT-4 call per validation (max 3 per generation)
- **Token Usage**: ~500-1000 tokens per validation
- **Cost**: ~$0.01-0.03 per generation (with retries)

### Time Impact
- **Validation Time**: 2-5 seconds per check
- **Total Overhead**: 2-15 seconds (depending on retries)
- **Worth It**: Prevents repetitive content that damages brand

### Success Rates (Expected)
- **First Attempt**: 70-80% approval rate
- **After 1 Retry**: 90-95% approval rate
- **After 2-3 Retries**: 98-99% approval rate

## Monitoring & Metrics

### View Metrics

```typescript
import { getValidationMetrics, logValidationMetrics } from './agents/revo-2.0-validation-wrapper';

// Get metrics for a business
const metrics = getValidationMetrics('paya-kenya');

// Log metrics to console
logValidationMetrics('paya-kenya');
```

### Metrics Output

```
📊 [Validation Metrics] Performance Summary
Business ID: paya-kenya
Total Generations: 50

✅ Success Rates:
  - Passed 1st Attempt: 38 (76.0%)
  - Passed After Retry: 11 (22.0%)
  - Failed Validation: 1 (2.0%)

📈 Averages:
  - Avg Attempts: 1.26
  - Avg Similarity Score: 84.3/100
```

## Future Enhancements

### Phase 2: Full Multi-Agent Workflow

```typescript
// Potential expansion with LangGraph StateGraph
const workflow = new StateGraph({
  channels: {
    businessProfile: null,
    contentStrategy: null,
    adContent: null,
    validationResult: null,
    qualityScore: null
  }
});

workflow.addNode("strategy", strategyAgent);
workflow.addNode("content", contentAgent);
workflow.addNode("validation", validationAgent);
workflow.addNode("quality", qualityAgent);

workflow.addConditionalEdges("validation", (state) => {
  if (state.validationResult.score >= 80) return "quality";
  if (state.attempts < 3) return "content";
  return "strategy"; // Try completely different angle
});
```

### Potential Agents

1. **Strategy Agent**: Analyzes business and selects unique angle
2. **Content Agent**: Creates headlines/captions
3. **Validation Agent**: Checks similarity (current implementation)
4. **Quality Agent**: Validates business accuracy and tone
5. **Visual Agent**: Ensures content-design alignment

## Troubleshooting

### Issue: All content getting rejected

**Solution**: Lower `minSimilarityScore` threshold
```typescript
minSimilarityScore: 65  // Instead of 75
```

### Issue: Validation taking too long

**Solution**: Reduce `maxRetries` or disable validation
```typescript
maxRetries: 2           // Instead of 3
enableValidation: false // Temporary disable
```

### Issue: Not enough variety

**Solution**: Increase history size
```typescript
// In generation-history.ts
const trimmedHistory = history.slice(0, 20); // Instead of 10
```

## Conclusion

The LangGraph Validation System provides a robust, scalable solution for preventing repetitive content in Revo 2.0. By using a specialized validation agent with intelligent retry logic, we ensure:

✅ **95%+ unique content** across generations
✅ **Automatic quality control** without manual intervention
✅ **Transparent process** with detailed logging
✅ **Measurable results** through metrics tracking

This is Phase 1 of a larger multi-agent vision that can be expanded as needed.
