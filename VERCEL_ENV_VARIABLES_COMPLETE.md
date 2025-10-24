# 🔐 Complete Vercel Environment Variables Guide

## ✅ REQUIRED Environment Variables for Production

### 1. **Stripe Payment Processing**

#### Primary (Production) - HIGHEST PRIORITY
```bash
STRIPE_SECRET_KEY_LIVE=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET_LIVE=whsec_YOUR_WEBHOOK_SECRET_FROM_DASHBOARD
```

#### Fallback (Also needed)
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_FROM_DASHBOARD
```

**Why both?** The code checks `_LIVE` first, then falls back to non-suffixed versions.

#### Optional Stripe Price Overrides
```bash
STRIPE_PRICE_STARTER=price_1SDqfQELJu3kIHjxzHWPNMPs
STRIPE_PRICE_TRY_FREE=price_YOUR_FREE_PLAN_ID
STRIPE_PRICE_GROWTH=price_YOUR_GROWTH_PLAN_ID
STRIPE_PRICE_PRO=price_YOUR_PRO_PLAN_ID
STRIPE_PRICE_ENTERPRISE=price_YOUR_ENTERPRISE_PLAN_ID
```

---

### 2. **Supabase Database**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Purpose:**
- `NEXT_PUBLIC_SUPABASE_URL` - Public URL for client & server
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access for server operations (bypasses RLS)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public key for client-side operations

---

### 3. **Authentication**

```bash
JWT_SECRET=your-super-secret-random-string-min-32-chars
```

**Purpose:** Used to sign and verify JWT tokens for user authentication.

**Generate one:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 4. **Google Gemini AI (For Content Generation)**

```bash
# Primary API keys for different Revo versions
GEMINI_API_KEY_REVO_1_0_PRIMARY=AIzaSy...
GEMINI_API_KEY_REVO_1_5_PRIMARY=AIzaSy...
GEMINI_API_KEY_REVO_2_0_PRIMARY=AIzaSy...

# Fallback/general key
GEMINI_API_KEY=AIzaSy...
```

**Purpose:** Powers the AI content generation (Revo 1.0, 1.5, 2.0 models)

**Get keys from:** https://makersuite.google.com/app/apikey

---

### 5. **Application Configuration**

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crevo.app
```

**Purpose:**
- `NODE_ENV` - Tells the app it's in production mode
- `NEXT_PUBLIC_APP_URL` - Base URL for redirects and webhook URLs

---

### 6. **Google Vertex AI (Optional - For Advanced AI)**

```bash
VERTEX_AI_ENABLED=true
VERTEX_AI_CREDENTIALS={"type":"service_account",...}
GOOGLE_PROJECT_ID=nevis-474518
GOOGLE_LOCATION=us-central1
```

**Purpose:** Advanced AI features using Google Cloud Vertex AI

---

## ❌ NOT NEEDED / NOT USED

These variables are **NOT** used in your codebase:

```bash
❌ NEXT_PUBLIC_WEBHOOK_BASE_URL  # Not used anywhere
❌ FIREBASE_* variables          # You're using Supabase, not Firebase
```

---

## 📋 Quick Checklist

Copy this checklist and verify each variable in Vercel:

### Critical (Must Have) ✅
- [ ] `STRIPE_SECRET_KEY_LIVE`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
- [ ] `STRIPE_WEBHOOK_SECRET_LIVE` ⚠️ **GET FROM STRIPE DASHBOARD**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `JWT_SECRET`
- [ ] `NODE_ENV=production`

### Important (Highly Recommended) ⭐
- [ ] `STRIPE_SECRET_KEY` (fallback)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (fallback)
- [ ] `STRIPE_WEBHOOK_SECRET` (fallback)
- [ ] `STRIPE_PRICE_STARTER`
- [ ] `GEMINI_API_KEY` or `GEMINI_API_KEY_REVO_*`
- [ ] `NEXT_PUBLIC_APP_URL`

### Optional (For Specific Features) 🔧
- [ ] `VERTEX_AI_ENABLED`
- [ ] `VERTEX_AI_CREDENTIALS`
- [ ] `GOOGLE_PROJECT_ID`
- [ ] Other `STRIPE_PRICE_*` overrides

---

## 🔍 How to Verify in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Check each variable from the "Critical" list above
5. Make sure **Production** is selected for each

---

## 🚨 **CRITICAL: Webhook Secret Issue**

Your webhook is failing because `STRIPE_WEBHOOK_SECRET_LIVE` doesn't match Stripe.

### To Fix:

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/webhooks
   - Click on: `https://crevo.app/api/webhooks/stripe`
   - Scroll to "Signing secret"
   - Click **"Reveal"**
   - **Copy the ENTIRE secret** (starts with `whsec_`)

2. **Update in Vercel:**
   - Go to Vercel → Settings → Environment Variables
   - Find `STRIPE_WEBHOOK_SECRET_LIVE`
   - Click **Edit (⋮)**
   - **Paste the NEW secret** from Stripe
   - Click **Save**

3. **Also update the fallback:**
   - Update `STRIPE_WEBHOOK_SECRET` with the same value
   - Click **Save**

4. **Redeploy:**
   - Go to Deployments → Latest → Redeploy
   - Wait for deployment to complete

---

## 🎯 Priority Order for Setup

If setting up from scratch, do in this order:

1. **Supabase** (Database must work first)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Stripe** (Payment processing)
   - `STRIPE_SECRET_KEY_LIVE`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
   - `STRIPE_WEBHOOK_SECRET_LIVE` ⚠️ **FROM STRIPE DASHBOARD**

3. **Auth** (User authentication)
   - `JWT_SECRET`

4. **AI** (Content generation)
   - `GEMINI_API_KEY` or specific version keys

5. **Config** (General settings)
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_APP_URL=https://crevo.app`

---

## 💡 Pro Tips

### Security Best Practices
- ✅ **Never** commit secrets to Git
- ✅ Use different keys for production vs development
- ✅ Rotate secrets periodically
- ✅ Use Vercel's environment variable encryption
- ✅ Limit who has access to Vercel settings

### Testing After Changes
After updating environment variables:
1. Always redeploy
2. Test the webhook endpoint: `https://crevo.app/api/webhooks/stripe`
3. Try a test payment
4. Check Stripe webhook logs for 200 OK

### Common Mistakes
- ❌ Using test keys (`sk_test_`) in production
- ❌ Missing the `_LIVE` suffix on Stripe vars
- ❌ Using old/wrong webhook secret
- ❌ Forgetting to select "Production" environment
- ❌ Not redeploying after changes

---

## 📞 Need Help?

If variables are set correctly but still having issues:

1. Check Vercel deployment logs
2. Test webhook endpoint: `curl https://crevo.app/api/webhooks/stripe`
3. Run diagnostic: `./diagnose-webhook-production.sh`
4. Check Stripe Dashboard webhook logs
5. Verify environment in response matches "production"


