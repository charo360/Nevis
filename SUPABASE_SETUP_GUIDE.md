# 🔧 Supabase Setup Guide - Fix "Invalid API key" Error

## 🚨 Current Issue
The application is showing "Invalid API key" error because the Supabase anon key in `.env.local` is a placeholder, not a real JWT token.

## ✅ Solution Steps

### Step 1: Get Your Real Supabase Anon Key

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv
   - Login with your Supabase account

2. **Navigate to API Settings**:
   - Click on **Settings** (gear icon) in the left sidebar
   - Click on **API** in the settings menu

3. **Copy the Anon Key**:
   - Look for **Project API keys** section
   - Copy the **anon public** key (it should start with `eyJ...`)
   - It should be a long JWT token, not the placeholder we currently have

### Step 2: Update Your .env.local File

Replace the placeholder anon key in your `.env.local` file:

```bash
# Current (WRONG):
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_REAL_ANON_KEY_FROM_SUPABASE_DASHBOARD

# Replace with (CORRECT):
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzQ4MDAsImV4cCI6MjA1MDU1MDgwMH0.YOUR_REAL_SIGNATURE_HERE
```

### Step 3: Restart Development Server

After updating the anon key:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔍 How to Verify the Fix

1. **Check Environment Variables**:
   ```bash
   grep "NEXT_PUBLIC_SUPABASE" .env.local
   ```

2. **Test the Application**:
   - Go to http://localhost:3001
   - Try to sign in
   - The "Invalid API key" error should be gone

3. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for any remaining Supabase errors

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid API key" persists
**Solution**: Double-check that you copied the entire anon key from Supabase dashboard

### Issue 2: "Project not found" error
**Solution**: Verify the Supabase URL is correct:
```
NEXT_PUBLIC_SUPABASE_URL=https://nrfceylvtiwpqsoxurrv.supabase.co
```

### Issue 3: Environment variables not loading
**Solution**: 
- Ensure `.env.local` is in the project root
- Restart the development server
- Check for typos in variable names

## 📋 Complete .env.local Structure

Your `.env.local` should have these Supabase variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nrfceylvtiwpqsoxurrv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_real_anon_key_from_dashboard

# Other variables...
GEMINI_API_KEY=your_gemini_key
STRIPE_SECRET_KEY=your_stripe_key
# etc...
```

## 🎯 Expected Result

After fixing the anon key:
- ✅ No more "Invalid API key" errors
- ✅ Supabase authentication works
- ✅ User sign-in/sign-up functions properly
- ✅ Database operations work correctly

## 🔧 Alternative: Test with Supabase CLI

If you have Supabase CLI installed:

```bash
# Get project info
supabase projects list

# Get API keys
supabase projects api-keys --project-ref nrfceylvtiwpqsoxurrv
```

---

**Note**: The anon key is safe to use in client-side code as it's designed for public access with Row Level Security (RLS) policies protecting your data.











