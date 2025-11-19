# Revo 2.0 Hashtag Limit Fix

## Issue Description
Revo 2.0 was generating 10 hashtags for all platforms, regardless of platform-specific requirements.

**Expected behavior:**
- **Instagram**: Maximum of 5 hashtags
- **All other platforms** (Facebook, Twitter, LinkedIn, etc.): Maximum of 3 hashtags

## Root Cause - COMPREHENSIVE ANALYSIS

After thorough investigation, we discovered **FIVE separate issues** that all contributed to the problem:

### 1. Assistant Instruction Not Strong Enough
In `src/ai/assistants/assistant-manager.ts` (line 1071), the assistant was told to generate the correct number of hashtags, but the instruction wasn't emphatic enough:
- Old: `5. Hashtags (${count} relevant tags)`
- The assistant was generating 10 hashtags and ignoring this instruction

### 2. No Hashtag Count Enforcement in Main Service
In both `src/ai/revo-2.0-service.ts` and `src/ai/revo-2.0-optimized.ts`, the hashtags from the assistant response were used directly without validation or enforcement:
- Line 3882 (revo-2.0-service.ts): `hashtags: assistantResponse.content.hashtags`
- Line 91 (revo-2.0-optimized.ts): `hashtags: assistantResponse.content.hashtags`
- No trimming or validation was performed

### 3. Missing Enforcement in `generateCaptionAndHashtags` Function ⚠️ CRITICAL
The `generateCaptionAndHashtags` function (line 2207 in `revo-2.0-service.ts`) had hashtag enforcement for the Claude fallback path, but **NOT for the assistant-first path**. When the assistant was used, hashtags were returned directly without enforcement (line 2330).

### 4. Missing Enforcement in Performance Optimizer ⚠️ CRITICAL
The `parseContentQuickly` function in `revo-performance-optimizer.ts` (line 309) was returning hashtags without enforcing platform-specific limits. This affected the optimized Claude content generation path.

### 5. Hashtag Merging in Content Calendar 🔥 **THE MAIN CULPRIT!**
The content calendar component (`content-calendar.tsx` line 258) was combining AI-generated hashtags with trending hashtags and then slicing to **10 hashtags** for most platforms, completely overriding ALL the platform-specific limits we had set in the backend!

## The Fix

### Fix 1: Strengthen Assistant Instructions
**File:** `src/ai/assistants/assistant-manager.ts`
**Line:** 1071

**Changed from:**
```typescript
message += `5. Hashtags (${safePlatform.toLowerCase() === 'instagram' ? '5' : '3'} relevant tags)\n\n`;
```

**To:**
```typescript
message += `5. Hashtags (EXACTLY ${safePlatform.toLowerCase() === 'instagram' ? '5' : '3'} hashtags - ${safePlatform.toLowerCase() === 'instagram' ? 'Instagram requires 5' : 'this platform requires 3'}, NO MORE, NO LESS)\n\n`;
```

**What changed:**
- Added "EXACTLY" to emphasize the requirement
- Added explicit platform explanation
- Added "NO MORE, NO LESS" to prevent the assistant from generating extra hashtags

### Fix 2: Enforce Hashtag Limits in Main Service
**File:** `src/ai/revo-2.0-service.ts`
**Lines:** 3879-3889 (new lines added)

**Added hashtag enforcement logic:**
```typescript
// Enforce platform-specific hashtag limits
const normalizedPlatform = String(enhancedOptions.platform).toLowerCase();
const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
let finalHashtags = assistantResponse.content.hashtags || [];

if (finalHashtags.length > maxHashtags) {
  console.log(`📊 [Revo 2.0] Trimming hashtags from ${finalHashtags.length} to ${maxHashtags} for ${enhancedOptions.platform}`);
  finalHashtags = finalHashtags.slice(0, maxHashtags);
} else if (finalHashtags.length < maxHashtags) {
  console.warn(`⚠️ [Revo 2.0] Assistant returned ${finalHashtags.length} hashtags, expected ${maxHashtags} for ${enhancedOptions.platform}`);
}

// Use finalHashtags instead of assistantResponse.content.hashtags
finalContent = {
  caption: assistantResponse.content.caption,
  hashtags: finalHashtags,  // ← Using enforced hashtags
  headline: assistantResponse.content.headline,
  subheadline: assistantResponse.content.subheadline,
  cta: assistantResponse.content.cta,
  captionVariations: [assistantResponse.content.caption]
};

console.log(`#️⃣ [Revo 2.0] Final hashtag count: ${finalHashtags.length} for ${enhancedOptions.platform}`);
```

### Fix 3: Enforce Hashtag Limits in Optimized Service
**File:** `src/ai/revo-2.0-optimized.ts`
**Lines:** 90-99 (new lines added)

**Added the same hashtag enforcement logic:**
```typescript
// Enforce platform-specific hashtag limits
const normalizedPlatform = String(enhancedOptions.platform).toLowerCase();
const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
let finalHashtags = assistantResponse.content.hashtags || [];

if (finalHashtags.length > maxHashtags) {
  console.log(`📊 [Revo 2.0 OPTIMIZED] Trimming hashtags from ${finalHashtags.length} to ${maxHashtags} for ${enhancedOptions.platform}`);
  finalHashtags = finalHashtags.slice(0, maxHashtags);
}

finalContent = {
  caption: assistantResponse.content.caption,
  hashtags: finalHashtags,  // ← Using enforced hashtags
  headline: assistantResponse.content.headline,
  subheadline: assistantResponse.content.subheadline,
  cta: assistantResponse.content.cta,
  captionVariations: [assistantResponse.content.caption]
};

console.log(`#️⃣ [Revo 2.0 OPTIMIZED] Final hashtag count: ${finalHashtags.length} for ${enhancedOptions.platform}`);
```

### Fix 4: Enforce Hashtag Limits in `generateCaptionAndHashtags` Function ⚠️ CRITICAL FIX
**File:** `src/ai/revo-2.0-service.ts`
**Lines:** 2323-2345 (new lines added)

**Problem:** The `generateCaptionAndHashtags` function returns content when the assistant path is used, but it was returning hashtags without enforcement.

**Added hashtag enforcement for assistant response:**
```typescript
// Enforce platform-specific hashtag limits for assistant response
const normalizedPlatform = String(platform).toLowerCase();
const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
let finalHashtags = assistantResponse.content.hashtags || [];

if (finalHashtags.length > maxHashtags) {
  console.log(`📊 [generateCaptionAndHashtags] Trimming hashtags from ${finalHashtags.length} to ${maxHashtags} for ${platform}`);
  finalHashtags = finalHashtags.slice(0, maxHashtags);
} else if (finalHashtags.length < maxHashtags) {
  console.warn(`⚠️ [generateCaptionAndHashtags] Assistant returned ${finalHashtags.length} hashtags, expected ${maxHashtags} for ${platform}`);
}

console.log(`#️⃣ [generateCaptionAndHashtags] Final hashtag count: ${finalHashtags.length} for ${platform}`);

return {
  headline: assistantResponse.content.headline,
  subheadline: assistantResponse.content.subheadline,
  caption: assistantResponse.content.caption,
  cta: assistantResponse.content.cta,
  hashtags: finalHashtags,  // ← Using enforced hashtags
};
```

### Fix 5: Enforce Hashtag Limits in Claude Fallback Path
**File:** `src/ai/revo-2.0-service.ts`
**Lines:** 3917-3940 (new lines added)

**Problem:** The Claude fallback path in the main generation function wasn't enforcing hashtag limits.

**Added hashtag enforcement for Claude fallback:**
```typescript
} else {
  // Use traditional approach for Claude fallback
  imagePrompt = buildEnhancedPrompt(enhancedOptions, concept);

  // Enforce platform-specific hashtag limits for Claude fallback as well
  const normalizedPlatform = String(enhancedOptions.platform).toLowerCase();
  const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
  let fallbackHashtags = assistantResponse.hashtags || [];

  if (fallbackHashtags.length > maxHashtags) {
    console.log(`📊 [Revo 2.0 Claude Fallback] Trimming hashtags from ${fallbackHashtags.length} to ${maxHashtags} for ${enhancedOptions.platform}`);
    fallbackHashtags = fallbackHashtags.slice(0, maxHashtags);
  } else if (fallbackHashtags.length < maxHashtags) {
    console.warn(`⚠️ [Revo 2.0 Claude Fallback] Received ${fallbackHashtags.length} hashtags, expected ${maxHashtags} for ${enhancedOptions.platform}`);
  }

  finalContent = {
    ...assistantResponse,
    hashtags: fallbackHashtags  // ← Using enforced hashtags
  };

  console.log(`📝 [Revo 2.0] Using traditional prompt approach for fallback`);
  console.log(`#️⃣ [Revo 2.0 Claude Fallback] Final hashtag count: ${fallbackHashtags.length} for ${enhancedOptions.platform}`);
}
```

### Fix 6: Enforce Hashtag Limits in Performance Optimizer ⚠️ CRITICAL FIX
**File:** `src/ai/performance/revo-performance-optimizer.ts`
**Lines:** 306-363 (updated)

**Problem:** The `parseContentQuickly` function was returning hashtags without enforcing platform-specific limits.

**Added hashtag enforcement in quick parsing:**
```typescript
// Enforce platform-specific hashtag limits
const normalizedPlatform = String(options.platform).toLowerCase();
const maxHashtags = normalizedPlatform === 'instagram' ? 5 : 3;
let hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];

if (hashtags.length > maxHashtags) {
  console.log(`📊 [Performance Optimizer] Trimming hashtags from ${hashtags.length} to ${maxHashtags} for ${options.platform}`);
  hashtags = hashtags.slice(0, maxHashtags);
}

console.log(`#️⃣ [Performance Optimizer] Final hashtag count: ${hashtags.length} for ${options.platform}`);

return {
  caption: parsed.caption,
  hashtags: hashtags,  // ← Using enforced hashtags
  headline: parsed.headline,
  subheadline: parsed.subheadline || '',
  cta: parsed.cta || 'Learn More',
  captionVariations: [parsed.caption]
};
```

### Fix 7: Remove Hashtag Merging in Content Calendar 🔥 **THE CRITICAL FIX!**
**File:** `src/components/dashboard/content-calendar.tsx`
**Lines:** 251-257 (completely rewritten)

**Problem:** This was the MAIN CULPRIT! The content calendar was combining AI-generated hashtags with trending hashtags and then slicing to 10 hashtags, completely overriding all backend limits.

**Before (WRONG):**
```typescript
// Combine AI-generated hashtags with trending hashtags
const combinedHashtags = [
  ...(revo20Result.hashtags || ['#NextGen', '#AI', '#Innovation']),
  ...platformHashtags // Add platform-optimized trending hashtags
]
  // Remove duplicates and limit based on platform
  .filter((tag, index, arr) => arr.indexOf(tag) === index)
  .slice(0, platform === 'Twitter' ? 5 : platform === 'LinkedIn' ? 8 : 10);  // ← WRONG! 10 hashtags!
```

**After (CORRECT):**
```typescript
// Use AI-generated hashtags directly - they already have platform-specific limits enforced
// Instagram: 5 hashtags, Other platforms: 3 hashtags
const platformHashtagLimit = platform === 'Instagram' ? 5 : 3;
const combinedHashtags = (revo20Result.hashtags || ['#NextGen', '#AI', '#Innovation'])
  .slice(0, platformHashtagLimit);

console.log(`#️⃣ [Content Calendar] Using ${combinedHashtags.length} hashtags for ${platform} (limit: ${platformHashtagLimit})`);
```

**What changed:**
- Removed hashtag merging with trending hashtags
- Removed the incorrect 10-hashtag limit
- Now uses platform-specific limits (Instagram: 5, Others: 3)
- Added debug logging to track hashtag count

## How It Works Now

The fix implements a **defense-in-depth strategy** with multiple enforcement layers:

1. **Assistant receives stronger instruction** about exact hashtag count required (Fix 1)
2. **After assistant generates content in main service**, hashtag count is validated and enforced (Fix 2, 3)
3. **After assistant generates content in `generateCaptionAndHashtags`**, hashtag count is validated and enforced (Fix 4)
4. **After Claude generates content in fallback path**, hashtag count is validated and enforced (Fix 5)
5. **After performance optimizer parses content**, hashtag count is validated and enforced (Fix 6)
6. **In the content calendar UI**, hashtags are used directly without merging or overriding (Fix 7)
7. **If too many hashtags** at any layer, they are trimmed to the correct count using `.slice(0, maxHashtags)`
8. **Debug logging** at every layer shows the trimming action and final hashtag count

This ensures that **no matter which code path is taken**, the platform-specific hashtag limits are always enforced!

## Platform-Specific Limits

| Platform | Max Hashtags | Logic |
|----------|--------------|-------|
| Instagram | 5 | `platform.toLowerCase() === 'instagram' ? 5 : 3` |
| Facebook | 3 | Default (not Instagram) |
| Twitter | 3 | Default (not Instagram) |
| LinkedIn | 3 | Default (not Instagram) |
| All Others | 3 | Default (not Instagram) |

## All Files Modified

1. **`src/ai/assistants/assistant-manager.ts`** (Fix 1)
   - Line 1071: Strengthened assistant instructions for hashtag count

2. **`src/ai/revo-2.0-service.ts`** (Fixes 2, 4, 5)
   - Lines 2323-2345: Added hashtag enforcement in `generateCaptionAndHashtags` for assistant path
   - Lines 3893-3916: Added hashtag enforcement in main service for assistant path
   - Lines 3917-3940: Added hashtag enforcement in main service for Claude fallback path

3. **`src/ai/revo-2.0-optimized.ts`** (Fix 3)
   - Lines 89-108: Added hashtag enforcement in optimized service

4. **`src/ai/performance/revo-performance-optimizer.ts`** (Fix 6)
   - Lines 306-363: Added hashtag enforcement in `parseContentQuickly` function

5. **`src/components/dashboard/content-calendar.tsx`** (Fix 7) 🔥 **CRITICAL**
   - Lines 251-257: Removed hashtag merging and enforced platform-specific limits

## Impact
- **Scope**: Revo 2.0 design generation (both assistant-first and Claude fallback paths)
- **Revo 1.5**: Not affected (already has correct hashtag limits)
- **Revo 1.0**: Not affected (different implementation)
- **Breaking Changes**: None
- **Backward Compatibility**: Fully compatible

## Testing Recommendations

1. **Test Instagram generation:**
   - Generate content for Instagram platform
   - Verify exactly 5 hashtags are returned
   - Check console logs for: `#️⃣ [Revo 2.0] Final hashtag count: 5 for Instagram`

2. **Test Facebook generation:**
   - Generate content for Facebook platform
   - Verify exactly 3 hashtags are returned
   - Check console logs for: `#️⃣ [Revo 2.0] Final hashtag count: 3 for Facebook`

3. **Test other platforms:**
   - Generate content for Twitter, LinkedIn, etc.
   - Verify exactly 3 hashtags are returned

4. **Check trimming logs:**
   - If assistant generates 10 hashtags, look for: `📊 [Revo 2.0] Trimming hashtags from 10 to 5 for Instagram`

## Notes
- The fix is defensive - even if the assistant ignores the instruction, the code enforces the limit
- Hashtags are trimmed using `.slice(0, maxHashtags)` which takes the first N hashtags
- The assistant instruction was strengthened to reduce the need for trimming
- Both the main service and optimized service have the same enforcement logic
- Debug logging helps track when trimming occurs

