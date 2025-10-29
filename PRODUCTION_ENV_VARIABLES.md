# 🔐 Production Environment Variables for Vercel

## ✅ REQUIRED - Must Have (Critical)

### **1. Stripe Payment (LIVE MODE)**

```bash
# Primary Stripe Keys (LIVE)
STRIPE_SECRET_KEY_LIVE=sk_live_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET_LIVE=whsec_YOUR_WEBHOOK_SECRET

# Fallback Stripe Keys (Also set these)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**Where to get them:**
- API Keys: https://dashboard.stripe.com/apikeys (use LIVE keys)
- Webhook Secret: https://dashboard.stripe.com/webhooks → Your webhook → Signing secret

**CRITICAL:**
- ⚠️ Use `sk_live_` NOT `sk_test_` for production
- ⚠️ Use `pk_live_` NOT `pk_test_` for production
- ⚠️ Get webhook secret from YOUR specific webhook endpoint in dashboard

---

### **2. Supabase Database**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get them:**
- Supabase Dashboard → Settings → API
- Service Role Key: Keep SECRET (server only)
- Anon Key: Safe to expose (client side)

---

### **3. Authentication**

```bash
JWT_SECRET=your-32-char-random-secret-string-here
```

**Generate one:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Keep this SECRET!** Used to sign/verify user tokens.

---

### **4. Application Config**

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crevo.app
```

**Purpose:**
- `NODE_ENV=production` → Tells app to use LIVE Stripe keys
- `NEXT_PUBLIC_APP_URL` → Base URL for redirects

---

## 🎯 OPTIONAL - Highly Recommended

### **5. Stripe Price Overrides**

```bash
STRIPE_PRICE_STARTER=price_1SDqfQELJu3kIHjxzHWPNMPs
STRIPE_PRICE_GROWTH=price_YOUR_GROWTH_ID
STRIPE_PRICE_PRO=price_YOUR_PRO_ID
STRIPE_PRICE_ENTERPRISE=price_YOUR_ENTERPRISE_ID
```

**Purpose:** Override hardcoded price IDs (useful for testing/changing prices)

---

### **6. AI Keys (For Content Generation)**

```bash
# Primary Gemini API keys for different Revo versions
GEMINI_API_KEY_REVO_1_0_PRIMARY=AIzaSy...
GEMINI_API_KEY_REVO_1_5_PRIMARY=AIzaSy...
GEMINI_API_KEY_REVO_2_0_PRIMARY=AIzaSy...

# Fallback key
GEMINI_API_KEY=AIzaSy...
```

**Where to get:** https://makersuite.google.com/app/apikey

---

## ❌ NOT NEEDED

These are **NOT used** in your code:

```bash
❌ NEXT_PUBLIC_WEBHOOK_BASE_URL  # Not referenced anywhere
❌ FIREBASE_*                    # Using Supabase, not Firebase
```

---

## 📋 **Complete Checklist for Vercel**

Copy this and verify each one:

### **CRITICAL (Must Have)** ⚠️

- [ ] `STRIPE_SECRET_KEY_LIVE=sk_live_...`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET_LIVE=whsec_...` 🔴 **Most Important!**
- [ ] `STRIPE_SECRET_KEY=sk_live_...` (same as _LIVE)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (same as _LIVE)
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (same as _LIVE)
- [ ] `NEXT_PUBLIC_SUPABASE_URL=https://...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`
- [ ] `JWT_SECRET=...` (32+ chars)
- [ ] `NODE_ENV=production`

### **Recommended** ⭐

- [ ] `NEXT_PUBLIC_APP_URL=https://crevo.app`
- [ ] `STRIPE_PRICE_STARTER=price_1SDqfQELJu3kIHjxzHWPNMPs`
- [ ] `GEMINI_API_KEY=AIzaSy...` (for AI features)

---

## 🔍 **How to Verify in Vercel:**

1. **Go to:** https://vercel.com/dashboard
2. **Select your project** (crevo)
3. **Click:** Settings → Environment Variables
4. **Check each variable** from CRITICAL list above
5. **Make sure "Production" is selected** for each
6. **Look for duplicates** - remove any duplicates

---

## 🚨 **Common Mistakes:**

### ❌ Using Test Keys in Production
```bash
WRONG: STRIPE_SECRET_KEY_LIVE=sk_test_...  ← TEST key!
RIGHT: STRIPE_SECRET_KEY_LIVE=sk_live_...  ← LIVE key!
```

### ❌ Missing the _LIVE Suffix
```bash
WRONG: Only set STRIPE_SECRET_KEY
RIGHT: Set BOTH STRIPE_SECRET_KEY_LIVE and STRIPE_SECRET_KEY
```

### ❌ Wrong Webhook Secret
```bash
WRONG: Using secret from different webhook
WRONG: Using secret from Stripe CLI
RIGHT: Using secret from YOUR webhook in dashboard
```

### ❌ Extra Spaces/Quotes
```bash
WRONG: STRIPE_WEBHOOK_SECRET_LIVE="whsec_..."  ← Has quotes!
WRONG: STRIPE_WEBHOOK_SECRET_LIVE=whsec_... ← Has space!
RIGHT: STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
```

---

## 🎯 **Current Production Issue:**

Your webhooks are failing with "Invalid signature". This means:

**Either:**
1. `STRIPE_WEBHOOK_SECRET_LIVE` is NOT set in Vercel
2. It's set to the WRONG value
3. It has extra spaces/quotes
4. Latest code isn't deployed

**Fix:**
1. **Go to Vercel** → Settings → Environment Variables
2. **Delete** `STRIPE_WEBHOOK_SECRET_LIVE`
3. **Add fresh:**
   - Name: `STRIPE_WEBHOOK_SECRET_LIVE`
   - Value: Get from https://dashboard.stripe.com/webhooks
   - Environment: Production
4. **Do same** for `STRIPE_WEBHOOK_SECRET`
5. **Redeploy**

---

## 🔍 **Quick Diagnostic:**

Run this to check current production config:

```bash
curl https://crevo.app/api/webhooks/stripe | jq
```

Should show:
```json
{
  "webhook_configured": true,
  "diagnostics": {
    "has_STRIPE_WEBHOOK_SECRET_LIVE": true,
    "webhook_secret_length": 40,
    "webhook_secret_format_valid": true
  }
}
```

**If `has_STRIPE_WEBHOOK_SECRET_LIVE` is false** → Not set in Vercel!

---

## 📞 **Verification Script:**

```bash
./diagnose-webhook-production.sh
```

This will show you exactly what's wrong with production config.

---

**First: Run the diagnostic script and show me the output!** 🔍













