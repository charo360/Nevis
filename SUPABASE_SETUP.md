# 🚀 Supabase + Firebase Setup Guide

## 📋 **What We're Building:**
- **Supabase**: Database + Authentication (replaces MongoDB)
- **Firebase**: Image storage only (already working)

## 🎯 **Step 1: Create Supabase Project**

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** with your account
3. **Create New Project**:
   - Project name: `nevis-app` (or your choice)
   - Database password: Choose a strong password
   - Region: Choose closest to your users
   - Pricing: Free tier (500MB database + 1GB file storage)

## 🔧 **Step 2: Get Supabase Credentials**

1. **In your Supabase dashboard**, go to **Settings** → **API**
2. **Copy these values**:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 📝 **Step 3: Update Environment Variables**

Update your `.env.local` file:

```env
# Replace these with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ **Step 4: Create Database Schema**

1. **In Supabase dashboard**, go to **SQL Editor**
2. **Copy the entire content** from `supabase-schema.sql`
3. **Paste and run** the SQL script
4. **Verify tables created**: Go to **Table Editor** and see:
   - `users`
   - `brands` 
   - `posts`
   - `user_preferences`

## ✅ **Step 5: Test Configuration**

Once you've updated the environment variables, I'll:

1. **Update the auth system** to use Supabase
2. **Migrate brand profiles** to Supabase
3. **Update post saving** to use Supabase
4. **Keep images in Firebase** (already working)

## 🎉 **Benefits After Setup:**

- ✅ **No more MongoDB quota issues**
- ✅ **Better authentication** (no token refresh problems)
- ✅ **Real-time features** available
- ✅ **500MB free database** (PostgreSQL)
- ✅ **Images stay in Firebase** (5GB free)
- ✅ **Better scaling** and pricing

## 🔄 **Migration Process:**

1. **Phase 1**: Setup Supabase (this step)
2. **Phase 2**: Replace authentication system
3. **Phase 3**: Migrate brand profiles
4. **Phase 4**: Update post management
5. **Phase 5**: Test everything

## 📞 **Next Steps:**

1. **Complete Steps 1-4 above**
2. **Update your `.env.local`** with real Supabase credentials
3. **Let me know when done** - I'll continue with the migration!

---

**Once you have the Supabase project created and environment variables updated, we can proceed with the migration!** 🚀
