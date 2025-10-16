# Production Deployment Fixes

## 🚨 Current Production Issue

**Error:** POST /quick-content returns 500

**Likely Causes:**
1. Supabase environment variables not set in Vercel
2. Database functions not applied to production Supabase
3. Auth cookies issue in production

---

## ✅ Required Steps for Production

### 1. Apply Database Functions to Production Supabase

Open your **PRODUCTION** Supabase SQL Editor and run:
```sql
-- Copy entire contents of database/functions/apply_to_supabase.sql
-- This creates:
-- - process_payment_with_idempotency (for webhooks)
-- - deduct_credits_with_tracking_v2 (for credit deduction)
-- - auto_grant_signup_credits trigger (for new users)
```

### 2. Set Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these for **Production**:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Stripe Live (Production)
STRIPE_SECRET_KEY_LIVE=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_... (from Stripe Dashboard)

# Stripe Fallback (will use LIVE in production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vertex AI (for Revo 2.0)
VERTEX_AI_ENABLED=true
VERTEX_AI_CREDENTIALS={"type":"service_account",...}
GOOGLE_PROJECT_ID=nevis-474518
GOOGLE_LOCATION=us-central1

# Google API Keys
GEMINI_API_KEY=your-production-gemini-key
GEMINI_API_KEY_REVO_1_0=your-key
GEMINI_API_KEY_REVO_1_5=your-key
GEMINI_API_KEY_REVO_2_0=your-key

# Environment
NODE_ENV=production
```

### 3. Configure Production Stripe Webhook

In Stripe Dashboard → Developers → Webhooks:

**Endpoint URL:** `https://crevo.app/api/webhooks/stripe`

**Events to listen for:**
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
- charge.dispute.created

**API Version:** `2025-08-27.basil`

After adding, copy the **Signing secret** (whsec_...) and add it to Vercel as `STRIPE_WEBHOOK_SECRET_LIVE`

### 4. Redeploy on Vercel

After setting all env vars:
1. Go to Vercel Dashboard
2. Click "Redeploy" on latest deployment
3. Or push a new commit to trigger deployment

### 5. Test Production

After redeployment:
- Sign up a new user → Check 10 credits granted
- Generate content → Check credits deducted
- Buy credits → Check payment processed and credits added

---

## 🔍 Debug Production Errors

If still getting 500 errors, check Vercel logs:

```bash
vercel logs --follow
```

Look for:
- `❌ [QuickContent] Supabase client error:`
- `❌ [QuickContent] Auth error:`
- Any database function errors

---

## ✅ Development Status

**All working in development:**
- ✅ Signup credits (10 free)
- ✅ Credit deduction (Quick Content & Creative Studio)
- ✅ Payment processing (verified with sam@crevo.app)
- ✅ Stripe webhooks (all 5 events)
- ✅ Database transactions

**To deploy to production:** Follow steps 1-5 above

