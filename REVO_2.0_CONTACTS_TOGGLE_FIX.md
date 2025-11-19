# Revo 2.0 Contacts Toggle Bug Fix (COMPLETE)

## Issue Description
Contact information (phone number, email, address, website) was still being displayed on generated designs even when the contacts toggle/switch was turned OFF in the UI.

## Root Cause (UPDATED - Multiple Issues Found)
The bug existed in **TWO separate code paths** in Revo 2.0:

### Issue 1: `buildEnhancedPrompt` function (Claude Fallback Path)
In `src/ai/revo-2.0-service.ts`, the `buildEnhancedPrompt` function had conflicting logic:

1. **Line 1679**: Contact instructions were built ONLY when `options.includeContacts === true`
2. **Line 2034**: A "DO NOT INCLUDE CONTACT INFORMATION" message was added when `options.includeContacts !== true`
3. **Line 2036 (BUG)**: The `contactInstruction` variable was ALWAYS appended to the prompt, regardless of toggle state

This created conflicting instructions in the AI prompt when contacts were OFF.

### Issue 2: `integrated-prompt-generator.ts` (Assistant-First Path - PRIMARY ISSUE)
In `src/ai/image/integrated-prompt-generator.ts`, the integrated prompt generator **ALWAYS included contact information** without checking the toggle:

1. **Line 170**: Always added "Contact Info: Include phone, email, website at bottom in contrasting footer"
2. **Line 173**: Always called `this.buildContactSection(brandProfile)`
3. **Lines 263-303**: `buildContactSection()` always built contact section with "MANDATORY" instructions
4. **Lines 308-325**: `buildContactInstructions()` always built contact instructions
5. **Interface (lines 10-16)**: `IntegratedPromptRequest` didn't include `includeContacts` parameter

**This was the PRIMARY bug** because Revo 2.0 uses the assistant-first path by default, which uses the integrated prompt generator, NOT the `buildEnhancedPrompt` function.

## The Fix (Multiple Files Updated)

### Fix 1: `src/ai/revo-2.0-service.ts` (Claude Fallback Path)
**Line 2036** - Changed from:
```typescript
Create a visually stunning design...${contactInstruction}${peopleInstructions}${culturalInstructions}`;
```

**To:**
```typescript
Create a visually stunning design...${options.includeContacts === true ? contactInstruction : ''}${peopleInstructions}${culturalInstructions}`;
```

**Line 3876** - Added `includeContacts` parameter when calling integrated prompt generator:
```typescript
const integratedPrompt = integratedPromptGenerator.generateIntegratedPrompt({
  assistantResponse,
  brandProfile: enhancedOptions.brandProfile,
  platform: enhancedOptions.platform,
  aspectRatio: aspectRatio,
  businessType: businessType.primaryType,
  includeContacts: enhancedOptions.includeContacts  // ← ADDED THIS
});
```

### Fix 2: `src/ai/image/integrated-prompt-generator.ts` (PRIMARY FIX)

**Lines 10-17** - Added `includeContacts` to interface:
```typescript
export interface IntegratedPromptRequest {
  assistantResponse: AssistantContentResponse;
  brandProfile: any;
  platform: string;
  aspectRatio: string;
  businessType: string;
  includeContacts?: boolean; // ← ADDED THIS
}
```

**Line 46** - Extract `includeContacts` with default value:
```typescript
const { assistantResponse, brandProfile, platform, aspectRatio, businessType, includeContacts = true } = request;
```

**Lines 62, 79** - Pass `includeContacts` to helper methods:
```typescript
const imagePrompt = this.buildUnifiedImagePrompt(
  content, designSpecs, brandProfile, platform, aspectRatio, businessType,
  includeContacts  // ← ADDED THIS
);

const designInstructions = this.buildDesignInstructions(
  designSpecs, brandProfile, platform, businessType,
  includeContacts  // ← ADDED THIS
);
```

**Lines 99-110** - Updated `buildUnifiedImagePrompt` signature:
```typescript
private buildUnifiedImagePrompt(
  content: AssistantContentResponse['content'],
  designSpecs: DesignSpecifications,
  brandProfile: any,
  platform: string,
  aspectRatio: string,
  businessType: string,
  includeContacts: boolean = true  // ← ADDED THIS
): string {
```

**Lines 169-187** - Conditional contact section logic:
```typescript
// Only add contact info instruction if contacts toggle is ON
if (includeContacts) {
  prompt += `- Contact Info: Include phone, email, website at bottom in contrasting footer\n\n`;
  // CONTACT INFORMATION
  prompt += this.buildContactSection(brandProfile);
} else {
  prompt += `\n🚫 **CRITICAL: DO NOT INCLUDE CONTACT INFORMATION:**\n`;
  prompt += `- DO NOT include phone numbers, email addresses, or website URLs in the design\n`;
  prompt += `- DO NOT add contact details in footer or anywhere else\n`;
  prompt += `- Contact toggle is OFF - no contact information should appear\n`;
  prompt += `- Focus on the main message without contact details\n\n`;
}
```

**Lines 195-211** - Updated `buildDesignInstructions` signature and logic:
```typescript
private buildDesignInstructions(
  designSpecs: DesignSpecifications,
  brandProfile: any,
  platform: string,
  businessType: string,
  includeContacts: boolean = true  // ← ADDED THIS
): IntegratedPromptResult['designInstructions'] {
  return {
    layout: `${designSpecs.text_placement} with ${this.getLayoutStyle(platform, businessType)}`,
    colors: designSpecs.color_scheme,
    typography: `Headline (largest) > Subheadline > Caption > CTA hierarchy`,
    contact: includeContacts ? this.buildContactInstructions(brandProfile) : 'No contact information',  // ← CONDITIONAL
  };
}
```

### Fix 3: `src/ai/revo-2.0-optimized.ts` (Optimized Path)

**Line 125** - Added `includeContacts` parameter:
```typescript
const integratedPrompt = integratedPromptGenerator.generateIntegratedPrompt({
  assistantResponse,
  brandProfile: enhancedOptions.brandProfile,
  platform: enhancedOptions.platform,
  aspectRatio: aspectRatio,
  businessType: businessType.primaryType,
  includeContacts: enhancedOptions.includeContacts  // ← ADDED THIS
});
```

## Verification

### Expected Behavior After Fix

#### When Contacts Toggle is ON (`includeContacts: true`):
1. Contact information is extracted from brand profile
2. Contact instructions are built with exact contact details
3. Contact instructions are appended to the AI prompt
4. AI generates design WITH contact information in footer

#### When Contacts Toggle is OFF (`includeContacts: false`):
1. "DO NOT INCLUDE CONTACT INFORMATION" message is added to prompt
2. Contact instructions are NOT appended (empty string instead)
3. AI generates design WITHOUT any contact information
4. No phone, email, website, or address appears on the design

## Testing Recommendations

### Manual Testing Steps:
1. Go to Content Calendar or Revo 2.0 generation page
2. Turn contacts toggle OFF
3. Generate a design
4. Verify NO contact information appears on the generated image
5. Turn contacts toggle ON
6. Generate another design
7. Verify contact information DOES appear in the footer

### Test Cases:
- ✅ Contacts OFF → No contact info in design
- ✅ Contacts ON → Contact info appears in footer
- ✅ Toggle state persists across page refreshes (localStorage)
- ✅ Different brands have independent toggle states

## Related Files (All Updated)
- `src/ai/revo-2.0-service.ts` - Main service, buildEnhancedPrompt fix, and integrated prompt generator call
- `src/ai/image/integrated-prompt-generator.ts` - **PRIMARY FIX** - Integrated prompt generator with contact toggle support
- `src/ai/revo-2.0-optimized.ts` - Optimized version with integrated prompt generator call
- `src/components/dashboard/content-calendar.tsx` - UI toggle component (lines 63-67, 519-523, 578-582)
- `src/app/actions/revo-2-actions.ts` - Server action that passes toggle state (line 100)
- `src/lib/types.ts` - BrandConsistencyPreferences type definition (line 6)

## Impact
- **Scope**: Revo 2.0 design generation (all code paths)
- **Revo 1.5**: Not affected (different logic, no conflicting instructions)
- **Revo 1.0**: Not affected (different implementation)
- **Breaking Changes**: None
- **Backward Compatibility**: Fully compatible
- **Default Behavior**: Contacts ON (when `includeContacts` is undefined, defaults to `true`)

## Why the Initial Fix Didn't Work
The initial fix only addressed the `buildEnhancedPrompt` function, which is used in the **Claude fallback path**. However, Revo 2.0 primarily uses the **assistant-first path** which calls the `integrated-prompt-generator.ts` module. This module had no awareness of the `includeContacts` toggle and always included contact information.

## Code Path Analysis
Revo 2.0 has two generation paths:

1. **Assistant-First Path** (PRIMARY - used by default):
   - Uses OpenAI GPT-4 assistant for content generation
   - Calls `integratedPromptGenerator.generateIntegratedPrompt()` for image prompts
   - **This path was broken** - always included contacts

2. **Claude Fallback Path** (SECONDARY - used when assistant fails):
   - Uses Claude Sonnet 4.5 for content generation
   - Calls `buildEnhancedPrompt()` for image prompts
   - This path was fixed in the initial attempt

## Server Restart Required
**YES** - A development server restart is required because:
1. TypeScript/JavaScript modules are cached in memory
2. Changes to `.ts` files require recompilation
3. Next.js may cache the compiled modules

**To restart the development server:**
```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart with:
npm run dev
```

## Notes
- The fix updates **3 files** across **multiple code paths**
- Interface changes are backward compatible (optional parameter with default)
- Toggle state is properly saved to localStorage
- Default behavior: contacts ON (line 66 in content-calendar.tsx)
- Debug logging added to track contact toggle state

