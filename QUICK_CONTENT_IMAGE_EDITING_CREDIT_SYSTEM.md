# Quick Content - Image Editing & Regeneration Credit System

## 📋 Overview
This document outlines the credit deduction implementation for image editing and regeneration features in the Quick Content section.

## ✅ Current Implementation Status

### 1. Image Editing (1 Credit) - ✅ ALREADY IMPLEMENTED

**Location**: `src/components/studio/image-editor.tsx` (Lines 260-276)

**Implementation**:
```typescript
const handleGenerate = async () => {
    // ... validation code ...
    
    // Deduct 1 credit for image editing
    const creditResult = await useCreditsForImageEdit({
        feature: 'image_editing',
        editType: 'ai_inpainting',
        prompt: prompt.substring(0, 100)
    });
    
    if (!creditResult.success) {
        toast({
            variant: "destructive",
            title: "Insufficient Credits",
            description: "You need 1 credit to edit this image. Please purchase more credits.",
            duration: 6000,
        });
        setIsLoading(false);
        return;
    }
    
    // ... proceed with image editing ...
}
```

**How It Works**:
1. User opens post card menu (⋮) and clicks "Edit Image"
2. Full-screen image editor opens with AI tools
3. User draws mask on areas to edit and enters prompt
4. User clicks "Generate" button
5. System deducts **1 credit** using `useCreditsForImageEdit` hook
6. If insufficient credits, shows error and aborts
7. If successful, applies AI edits and updates post

**Credit Integration**:
- Uses `useCreditsForImageEdit()` hook from `src/hooks/use-credits.ts`
- Calls `deductCreditsForImageEdit()` from `src/lib/credit-integration.ts`
- Records usage in `credit_usage_history` table with:
  - `credits_used`: 1
  - `feature`: 'image_editing'
  - `generation_type`: 'ai_inpainting'
  - `model_version`: 'gemini-2.0-flash-exp'

### 2. Image Regeneration (Model-Specific Credits) - ✅ ALREADY IMPLEMENTED

**Location**: `src/components/dashboard/post-card.tsx` (Lines 502-545)

**Implementation**:
```typescript
const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
        // Determine which model was used for this post
        const modelUsed = (post.aiModel?.includes('revo-2.0') || post.id?.includes('revo-2.0'))
            ? 'revo-2.0'
            : (post.aiModel?.includes('revo-1.5') || post.id?.includes('revo-1.5'))
            ? 'revo-1.5'
            : 'revo-1.0';

        // Deduct credits before regeneration
        const creditResult = await useCreditsForModel(
            modelUsed, 
            'image_generation', 
            'regeneration'
        );
        
        if (!creditResult.success) {
            toast({
                variant: "destructive",
                title: "Insufficient Credits",
                description: creditResult.error || 
                    `You need ${modelUsed === 'revo-1.0' ? '3' : modelUsed === 'revo-1.5' ? '4' : '5'} credits to regenerate with ${modelUsed}`,
                duration: 6000,
            });
            return;
        }

        // ... proceed with regeneration ...
    } finally {
        setIsRegenerating(false);
    }
};
```

**How It Works**:
1. User opens post card menu (⋮) and clicks "Regenerate Image"
2. System detects which Revo model was used for original post
3. System deducts model-specific credits:
   - **Revo 1.0**: 3 credits
   - **Revo 1.5**: 4 credits
   - **Revo 2.0**: 5 credits
4. If insufficient credits, shows error and aborts
5. If successful, generates new content and replaces old post

**Model Detection Logic**:
```typescript
// Priority order:
// 1. Check post.aiModel field
// 2. Check post.id for model identifier
// 3. Default to 'revo-1.0' if not found
```

**Credit Integration**:
- Uses `useCreditsForModel()` hook from `src/hooks/use-credits.ts`
- Calls `deductCreditsForGeneration()` from `src/lib/credit-integration.ts`
- Records usage in `credit_usage_history` table with:
  - `credits_used`: 3, 4, or 5 (based on model)
  - `feature`: 'image_generation'
  - `generation_type`: 'regeneration'
  - `model_version`: 'revo-1.0', 'revo-1.5', or 'revo-2.0'

## 📊 Credit Costs Summary

| Action | Cost | Function Used |
|--------|------|---------------|
| **Edit Image** | 1 credit | `useCreditsForImageEdit()` |
| **Regenerate (Revo 1.0)** | 3 credits | `useCreditsForModel('revo-1.0')` |
| **Regenerate (Revo 1.5)** | 4 credits | `useCreditsForModel('revo-1.5')` |
| **Regenerate (Revo 2.0)** | 5 credits | `useCreditsForModel('revo-2.0')` |

## 🔍 Testing Verification

### Test User
- **Email**: sm1761a@american.edu
- **User ID**: dd9f93dc-08c2-4086-9359-687fa6c5897d
- **Current Balance**: 15,802 credits remaining (18,090 total - 2,288 used)

### Test Scenarios

#### Scenario 1: Edit Image (1 Credit)
1. Navigate to Quick Content
2. Find any generated post
3. Click menu (⋮) → "Edit Image"
4. Draw mask and enter prompt (e.g., "change background to blue")
5. Click "Generate"
6. **Expected**: Credits deducted from 15,802 → 15,801
7. **Verify**: Check `credit_usage_history` for new record with `credits_used: 1`

#### Scenario 2: Regenerate Revo 1.0 Post (3 Credits)
1. Navigate to Quick Content
2. Find a Revo 1.0 generated post
3. Click menu (⋮) → "Regenerate Image"
4. **Expected**: Credits deducted from 15,802 → 15,799
5. **Verify**: Check `credit_usage_history` for new record with `credits_used: 3`

#### Scenario 3: Regenerate Revo 1.5 Post (4 Credits)
1. Navigate to Quick Content
2. Find a Revo 1.5 generated post
3. Click menu (⋮) → "Regenerate Image"
4. **Expected**: Credits deducted from 15,802 → 15,798
5. **Verify**: Check `credit_usage_history` for new record with `credits_used: 4`

#### Scenario 4: Regenerate Revo 2.0 Post (5 Credits)
1. Navigate to Quick Content
2. Find a Revo 2.0 generated post
3. Click menu (⋮) → "Regenerate Image"
4. **Expected**: Credits deducted from 15,802 → 15,797
5. **Verify**: Check `credit_usage_history` for new record with `credits_used: 5`

#### Scenario 5: Insufficient Credits
1. Temporarily set user credits to 0
2. Try to edit or regenerate an image
3. **Expected**: Error toast: "Insufficient Credits"
4. **Verify**: No credit deduction, no generation occurs

## 🗂️ Database Schema

### credit_usage_history Table
```sql
CREATE TABLE credit_usage_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    credits_used INTEGER NOT NULL,
    model_version TEXT,
    feature TEXT,
    generation_type TEXT,
    result_success BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP
);
```

### Example Records

**Image Edit Record**:
```json
{
    "id": "uuid-1",
    "user_id": "dd9f93dc-08c2-4086-9359-687fa6c5897d",
    "credits_used": 1,
    "model_version": "gemini-2.0-flash-exp",
    "feature": "image_editing",
    "generation_type": "ai_inpainting",
    "result_success": true,
    "metadata": {
        "editType": "ai_inpainting",
        "prompt": "change background to blue"
    },
    "created_at": "2025-11-15T15:53:02Z"
}
```

**Regeneration Record (Revo 2.0)**:
```json
{
    "id": "uuid-2",
    "user_id": "dd9f93dc-08c2-4086-9359-687fa6c5897d",
    "credits_used": 5,
    "model_version": "revo-2.0",
    "feature": "image_generation",
    "generation_type": "regeneration",
    "result_success": true,
    "metadata": {
        "platform": "instagram"
    },
    "created_at": "2025-11-15T15:54:15Z"
}
```

## 🎯 UI Flow Diagrams

### Image Editing Flow
```
User → Post Card (⋮ Menu) → Edit Image
  ↓
ImageEditor Component Opens
  ↓
User Draws Mask + Enters Prompt
  ↓
Click "Generate"
  ↓
Check Credits (1 credit required)
  ↓
├─ Insufficient? → Show Error Toast → Abort
└─ Sufficient? → Deduct 1 Credit → Call API → Update Image
```

### Image Regeneration Flow
```
User → Post Card (⋮ Menu) → Regenerate Image
  ↓
Detect Model Used (revo-1.0, 1.5, or 2.0)
  ↓
Check Credits (3/4/5 credits based on model)
  ↓
├─ Insufficient? → Show Error Toast → Abort
└─ Sufficient? → Deduct Credits → Generate New Post → Replace Old
```

## 🔧 Related Files

### Core Implementation Files
1. **`src/components/dashboard/post-card.tsx`**
   - Contains the three-dot menu with "Edit Image" and "Regenerate Image" options
   - Implements `handleRegenerate()` with model-specific credit deduction

2. **`src/components/studio/image-editor.tsx`**
   - Full-screen image editor component
   - Implements `handleGenerate()` with 1-credit deduction for edits

3. **`src/hooks/use-credits.ts`**
   - Provides `useCreditsForModel()` hook
   - Provides `useCreditsForImageEdit()` hook

4. **`src/lib/credit-integration.ts`**
   - Core credit deduction logic
   - Functions: `deductCreditsForGeneration()`, `deductCreditsForImageEdit()`

### Database Function
5. **`deduct_credits_with_tracking_v2`** (PostgreSQL)
   - Atomically deducts credits and records usage
   - Ensures consistency across all operations

## ✅ Verification Checklist

- [x] Image editing deducts 1 credit (implemented in image-editor.tsx)
- [x] Regeneration deducts model-specific credits (implemented in post-card.tsx)
- [x] Insufficient credit handling with error messages
- [x] Credit usage tracked in database
- [ ] Browser testing with test user sm1761a@american.edu
- [ ] Verify Credit Display updates after edit/regeneration
- [ ] Verify Credit Analytics shows edit and regeneration records

## 🚀 Next Steps

1. **Start Dev Server**: `npm run dev`
2. **Login**: Use sm1761a@american.edu
3. **Navigate**: Go to Quick Content
4. **Test Image Editing**: 
   - Open any post → Edit Image → Generate
   - Verify 1 credit deducted
5. **Test Regeneration**:
   - Find Revo 1.0 post → Regenerate → Verify 3 credits deducted
   - Find Revo 1.5 post → Regenerate → Verify 4 credits deducted
   - Find Revo 2.0 post → Regenerate → Verify 5 credits deducted
6. **Verify UI Updates**:
   - Check Credit Display component updates balance
   - Check Credit Analytics shows new records

## 📝 Notes

- ✅ **Image editing credit deduction is ALREADY IMPLEMENTED**
- ✅ **Image regeneration credit deduction is ALREADY IMPLEMENTED**
- ⚠️ Model detection in regeneration uses `post.aiModel` and `post.id` - ensure posts are tagged correctly
- ⚠️ Default model is 'revo-1.0' if detection fails - this is safe but may cause incorrect credit deduction
- 💡 Consider adding explicit model field to GeneratedPost type for more reliable detection

## 🎉 Summary

Both image editing (1 credit) and image regeneration (3/4/5 credits) features **already have credit deduction implemented**. The system:

1. ✅ Checks credits before operation
2. ✅ Shows error if insufficient
3. ✅ Deducts correct amount based on operation
4. ✅ Tracks usage in database
5. ✅ Uses proper error handling and user feedback

**Ready for browser testing!** 🚀
