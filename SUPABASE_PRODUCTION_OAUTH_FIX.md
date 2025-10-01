# 🚨 URGENT: Fix Production Google OAuth Redirect Issue

## Problem
Google OAuth in production is redirecting to `localhost:3000` instead of `https://crevo.app`.

## Root Cause
The Supabase Google OAuth configuration in your dashboard has incorrect redirect URLs.

## 🔧 **IMMEDIATE FIX REQUIRED - Supabase Dashboard:**

### 1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project: **nrfceylvtiwpqsoxurrv**

### 2. **Navigate to Authentication → Providers**
   - Click **"Authentication"** in sidebar
   - Click **"Providers"** tab
   - Find **"Google"** provider

### 3. **Update Google OAuth Configuration**
   Replace the redirect URLs with these EXACT values:

   ```
   Authorized redirect URIs:
   http://localhost:3001/auth/callback
   https://crevo.app/auth/callback
   https://nrfceylvtiwpqsoxurrv.supabase.co/auth/v1/callback
   ```

### 4. **Verify Site URL Settings**
   Go to **Authentication → URL Configuration**:
   
   ```
   Site URL: https://crevo.app
   Redirect URLs: https://crevo.app/**, http://localhost:3001/**
   ```

### 5. **Save Changes**
   - Click **"Save"** on both sections
   - Wait 2-3 minutes for changes to propagate

## 🔧 **Code Changes Applied:**

### Fixed Environment Detection:
- ✅ Updated Google OAuth API route with better production URL detection
- ✅ Enhanced auth hook with environment-aware redirect URLs  
- ✅ Added production app URL to environment configuration
- ✅ Added debugging logs for redirect URL tracking

### Files Updated:
- `src/app/api/auth/google/route.ts` - Better production URL detection
- `src/hooks/use-auth-supabase.ts` - Fixed redirect URL generation
- `.env.production` - Added `NEXT_PUBLIC_APP_URL=https://crevo.app`

## 🧪 **Testing After Fix:**

1. **Deploy the updated code**
2. **Update Supabase dashboard settings** (above)
3. **Test Google OAuth on production**:
   - Go to https://crevo.app/auth
   - Click "Sign in with Google"
   - Should redirect to Google, then back to https://crevo.app/auth/callback

## 🚨 **If Still Not Working:**

Check the Supabase Auth logs:
- Go to **Authentication → Logs** in Supabase dashboard
- Look for any errors related to redirect URLs

## ✅ **Expected Result:**
After fix: `https://crevo.app/auth/callback#access_token=...` (correct!)
Instead of: `http://localhost:3000/#access_token=...` (wrong!)