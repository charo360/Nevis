# Brand Visibility Fix Summary

## Issue
User `sm1761a@american.edu` could see brands in production but not in development, even though using the same database.

## Root Causes Identified

### 1. Users Table Sync Issue ✅ FIXED
- **Problem**: The `users` table had `user_id = null` while brands were stored with the auth user ID
- **Fix**: Updated `users.user_id` to match `auth.users.id` (`dd9f93dc-08c2-4086-9359-687fa6c5897d`)
- **Script**: `fix-user-id-in-users-table.mjs`

### 2. Client-Side Service Call Issue ✅ FIXED
- **Problem**: `BrandProvider` was calling `supabaseService.getBrandProfiles()` which uses server-side cookies
- **Fix**: Updated to use API endpoint `/api/brand-profiles` with proper authentication
- **File**: `src/contexts/brand-context-supabase.tsx`

### 3. Supabase Client Initialization Issue ✅ FIXED
- **Problem**: `brand-profile-service.ts` was creating Supabase client at module load time, causing "Invalid API key" errors
- **Fix**: Implemented lazy client creation with `getSupabaseClient()` function
- **File**: `src/lib/supabase/services/brand-profile-service.ts`

## Changes Made

### 1. Database Fix
```bash
node fix-user-id-in-users-table.mjs
```
- Updated `users` table to sync `user_id` with auth ID

### 2. Brand Context Update
**File**: `src/contexts/brand-context-supabase.tsx`
- Changed from: Direct call to `supabaseService.getBrandProfiles(userId)`
- Changed to: API call to `/api/brand-profiles` with Bearer token authentication

```typescript
// OLD (doesn't work in browser)
const userBrands = await supabaseService.getBrandProfiles(user.userId);

// NEW (works in browser)
const response = await fetch('/api/brand-profiles', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});
const userBrands = await response.json();
```

### 3. Service Layer Fix
**File**: `src/lib/supabase/services/brand-profile-service.ts`
- Added lazy Supabase client initialization
- Replaced immediate client creation with `getSupabaseClient()` function
- Ensures environment variables are loaded before creating client

```typescript
// Lazy client creation
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}
```

## Verification

Run the debug script to verify:
```bash
node debug-user-brands.mjs
```

Expected output:
- ✅ Auth user found
- ✅ Users table user_id matches auth ID
- ✅ 5 brands accessible:
  - Black Panther TKN
  - Samaki Cookies
  - Byblos Deli
  - Zentech Electronics Kenya
  - Paya Finance

## Testing Steps

1. **Clear browser cache** and restart dev server
2. **Log out** and **log back in** as `sm1761a@american.edu`
3. Navigate to dashboard
4. Brands should now be visible

## Error Messages Fixed

### Before:
```
❌ Supabase select error: { message: 'Invalid API key' }
❌ Error loading brand profiles: Error: Failed to load brand profiles: Invalid API key
```

### After:
```
✅ Loaded brands: 5
```

## Notes

- The fix ensures that client-side code uses API routes (which run on the server) instead of directly calling server-side functions
- Lazy initialization prevents "Invalid API key" errors caused by environment variables not being loaded at module init time
- All 5 brands are confirmed accessible in the database with the correct user_id

## Related Files

- `src/contexts/brand-context-supabase.tsx` - Brand context provider
- `src/lib/supabase/services/brand-profile-service.ts` - Brand service layer
- `src/app/api/brand-profiles/route.ts` - Brand API endpoints
- `debug-user-brands.mjs` - Debug script
- `fix-user-id-in-users-table.mjs` - Fix script
