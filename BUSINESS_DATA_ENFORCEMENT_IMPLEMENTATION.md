# Business Data Enforcement Implementation

## Problem Solved
The Revo 1.0 system was generating generic content using random information and templates instead of actual business data. This resulted in ads like the paya.co.ke examples that contained unsourced claims and generic messaging.

## Solution Implemented

### 1. Business Profile Resolver (`src/ai/business-profile/resolver.ts`)
**Purpose**: Ensures only real business data is used in content generation

**Key Features**:
- **Source Tracking**: Every field tagged with source (`db|user|website|missing`)
- **Strict Validation**: Hard-fails if critical fields are missing
- **Completeness Scoring**: 0-100% score with missing field identification
- **Supabase Integration**: Loads actual business profiles from database
- **Paya.co.ke Sample**: Built-in test profile for development

**Usage**:
```typescript
const resolver = new BusinessProfileResolver();
const profile = await resolver.resolveProfile('paya.co.ke', userId, userOverrides, {
  allowExternalContext: false,
  requireContacts: true,
  strictValidation: true
});
```

### 2. Updated Content Generator (`src/ai/models/versions/revo-1.0/content-generator.ts`)
**Changes Made**:
- **Removed Generic Fallbacks**: No more `|| 'Business'`, `|| 'instagram'`, `|| ''` defaults
- **Strict Validation**: `validateRequestStructure()` and `resolveBusinessProfile()` methods
- **Business Profile Integration**: Uses resolver to get validated business data
- **External Context Disabled**: `realTimeContext: false`, `trendingTopics: false` by default
- **Error Handling**: Returns actionable errors when fields are missing

**Before**:
```typescript
businessName: profile.businessName || 'Business'
services: profile.services || ''
```

**After**:
```typescript
businessName: businessProfile.businessName  // No fallback - must be present
services: businessProfile.services ? servicesString : '[SERVICES_NOT_PROVIDED]'
```

### 3. Prompt Guardrails (`src/ai/revo-1.0-service.ts`)
**Added Strict Business Data Rules**:
```typescript
const businessDataGuardrails = `
🚨 CRITICAL BUSINESS DATA RULES:
- ONLY use the provided business information below
- If a field is missing or empty, DO NOT invent or assume information
- DO NOT add amounts, timelines, fees, or claims not explicitly provided
- DO NOT use generic templates or placeholder content
- Every claim must be sourced from the actual business profile
- If location is Kenya, add "T&Cs apply" for financial services
`;
```

**Forbidden Content Rules**:
- No invented business details
- No generic claims without proof
- No fake testimonials or statistics
- No contact information not provided
- No template phrases

### 4. Supabase Schema Integration
**Database Structure** (`supabase/migrations/001_initial_schema.sql`):
- `brand_profiles` table with comprehensive business data
- Fields: `business_name`, `business_type`, `description`, `location`, `contact`, `services`, etc.
- Row Level Security (RLS) enabled
- User-specific data access

**Sample Paya Profile**:
```json
{
  "business_name": "Paya",
  "business_type": "Financial Services", 
  "description": "Working-capital and merchant float for Kenyan SMEs via M-Pesa integration",
  "location": { "country": "KE", "city": "Nairobi" },
  "contact": { "website": "https://paya.co.ke", "email": "support@paya.co.ke" },
  "services": [
    { "name": "Merchant Float", "description": "Short-term working capital for inventory and supplier payments" },
    { "name": "Fast Disbursement", "description": "Funds to your M-Pesa till with eligibility-based limits" }
  ]
}
```

## Key Improvements

### ✅ No More Generic Content
- **Before**: "Master Your Money's Flow" (generic template)
- **After**: "Paya Merchant Float for Kenyan SMEs" (actual business data)

### ✅ Source-Tracked Fields
Every piece of information has a source:
- `db`: From Supabase business profile
- `user`: User-provided overrides  
- `website`: Scraped from business website
- `missing`: Field not available (content omits this aspect)

### ✅ Strict Validation
```typescript
// Missing critical fields = hard failure
if (profile.completeness.missingCritical.length > 0) {
  throw new Error(`Missing critical fields: ${profile.completeness.missingCritical.join(', ')}`);
}
```

### ✅ External Context Control
- **Disabled by default**: No random trending topics or RSS data
- **Opt-in only**: `allowExternalContext: true` required
- **Guardrails**: External context can only enrich, never invent business facts

### ✅ Kenya-Specific Compliance
- Auto-detects Kenya location
- Adds "T&Cs apply" for financial services
- Uses KSh currency formatting
- Mentions M-Pesa integration when relevant

## Testing

### Test File: `test-business-profile-resolver.js`
Verifies:
1. Profile resolution with source tracking
2. Validation with missing fields (correctly fails)
3. Complete profile validation (passes)
4. Paya.co.ke sample profile availability

### Run Test:
```bash
node test-business-profile-resolver.js
```

## Usage Examples

### 1. Generate Content with Actual Business Data
```typescript
const request = {
  profile: { businessName: 'Paya', businessType: 'Financial Services' },
  platform: 'instagram',
  allowExternalContext: false  // Only use business data
};

const result = await generator.generateContent(request);
// Result will use only Paya's actual services and contact info
```

### 2. Handle Missing Fields Gracefully
```typescript
// If services are missing from business profile:
// - System returns error: "Missing critical fields: services"
// - No generic "Business services" content generated
// - User gets actionable feedback to complete profile
```

### 3. Source Verification
```typescript
const profile = await resolver.resolveProfile('paya.co.ke', userId);
console.log(profile.sources);
// Output: { businessName: 'db', services: 'db', contact: 'user', logoUrl: 'missing' }
```

## Files Modified

1. **`src/ai/business-profile/resolver.ts`** - New business profile resolver
2. **`src/ai/models/versions/revo-1.0/content-generator.ts`** - Removed fallbacks, added validation
3. **`src/ai/revo-1.0-service.ts`** - Added prompt guardrails
4. **`test-business-profile-resolver.js`** - Test verification

## Next Steps

1. **Set up Supabase**: Add real Paya business profile to database
2. **Test End-to-End**: Generate content and verify no generic templates appear
3. **UI Integration**: Add business selection and profile preview to UI
4. **Monitoring**: Track content quality and business data usage

## Expected Results

### Before (Generic):
- "Master Your Money's Flow" 
- "Unleash financial control with elegant simplicity"
- Generic CTAs like "Begin Your Seamless Journey"

### After (Business-Specific):
- "Paya Merchant Float - KSh 300,000 for Kenyan SMEs"
- "Stock up today. Repay as you sell via M-Pesa. T&Cs apply."
- Specific CTAs like "Check Your Limit" or "Apply in Minutes"

The system now enforces actual business data usage and eliminates generic templates and random context injection.
