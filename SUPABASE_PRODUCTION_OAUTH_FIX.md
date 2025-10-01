# 🚨 URGENT: Fix Production Google OAuth Redirect Issue

## Problem
Google OAuth in production is redirecting to `localhost:3000` instead of `https://crevo.app`.

## Root Cause
The Supabase Google OAuth configuration in your dashboard has incorrect redirect URLs.

## 🔧 **CRITICAL FIX - Update These 2 Places NOW:**

### ⚠️ **STEP 1: Supabase Dashboard (THIS IS THE MAIN ISSUE)**
   1. **Go to**: https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv
   2. **Click**: Authentication → URL Configuration
   3. **Set SITE_URL to**: `https://crevo.app`
   4. **Set Redirect URLs to** (one per line):
   ```
   https://crevo.app/**
   http://localhost:3001/**
   http://localhost:3000/**
   ```
   5. **Click SAVE** and wait 2-3 minutes for changes to propagate

### ⚠️ **STEP 2: Google Cloud Console** 
   1. **Go to**: https://console.cloud.google.com/apis/credentials
   2. **Find your OAuth Client ID**: `418420515689-dlm5rnns6h06oa1d5ghd6rc6beqh4vsp.apps.googleusercontent.com`
   3. **Update Authorized redirect URIs to** (these are the Supabase callback URLs):
   ```
   https://nrfceylvtiwpqsoxurrv.supabase.co/auth/v1/callback
   ```
   4. **Click SAVE**

### 📝 **Important Notes:**
- **SITE_URL** controls the default redirect after OAuth success
- **Redirect URLs** with `/**` wildcard allows any path under those domains
- Google Cloud Console needs Supabase's callback URL, not your app's callback URL
- The `**` wildcard matches any sequence including subdirectories

### 🚨 **The Root Problem:**
Your Supabase project has `localhost:3000` configured as the Site URL, which overrides everything else. The OAuth token response you showed proves this - it's coming from Supabase's auth system, not our code.

## 🔄 **How OAuth Flow Actually Works:**

1. **User clicks "Sign in with Google"** → Your app calls Supabase Auth
2. **Supabase redirects to Google** → User authenticates with Google
3. **Google redirects back to Supabase** → Using the URL from Google Cloud Console
4. **Supabase processes the token** → Then redirects to your app using SITE_URL
5. **Your app receives the user** → At `/auth/callback` page

**The issue:** Step 4 is using `localhost:3000` because that's your current SITE_URL in Supabase.

## ✅ **After the Fix:**
- SITE_URL = `https://crevo.app` → OAuth will redirect to production
- Redirect URLs include wildcards → Supports all your app routes
- Google Cloud Console has correct Supabase callback → OAuth chain works

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