# 🚨 URGENT: Fix Stripe Webhook "Invalid Signature" Error in Production

## ⚠️ PROBLEM DIAGNOSIS

Your webhook is failing with `"Invalid signature"` because the **environment variable is not set correctly in Vercel**.

From your Stripe Dashboard, you have:
- Webhook URL: `https://crevo.app/api/webhooks/stripe`
- Signing Secret: `whsec_pud3vY1pfsT97COt1qGNasP4O8yMIRBR`

But your production environment is likely **missing** the correct environment variable.

---

## ✅ SOLUTION: Configure Vercel Environment Variables

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Select your project: **crevo** (or whatever your project is named)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add/Update These Environment Variables

Add or update the following variables. **Make sure to select "Production" environment for each:**

#### Required Production Variables:

```bash
# === STRIPE LIVE KEYS ===
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY_LIVE=sk_live_YOUR_LIVE_SECRET_KEY_HERE

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE

# === CRITICAL: Your Webhook Secret ===
# Get this from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET_LIVE=whsec_YOUR_WEBHOOK_SECRET_HERE

# === FALLBACK VARIABLES (optional but recommended) ===
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE

STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# === ENVIRONMENT ===
NODE_ENV=production
```

### Step 3: Save and Redeploy

After adding/updating the environment variables:

1. Click **Save** for each variable
2. Go to **Deployments** tab
3. Click on the **latest deployment**
4. Click the three dots menu (⋮) and select **Redeploy**
5. Select **Use existing Build Cache** (faster) and click **Redeploy**

---

## 🔍 VERIFICATION STEPS

### Test 1: Check Webhook Endpoint Health

After redeployment, visit this URL in your browser:
```
https://crevo.app/api/webhooks/stripe
```

**Expected Response:**
```json
{
  "status": "active",
  "message": "Stripe webhook endpoint is operational",
  "timestamp": "2025-10-18T...",
  "environment": "production",
  "isLive": true,
  "webhook_configured": true,
  "webhook_secret_prefix": "whsec_pud3v...",
  "diagnostics": {
    "NODE_ENV": "production",
    "has_STRIPE_WEBHOOK_SECRET_LIVE": true,
    "has_STRIPE_WEBHOOK_SECRET": true,
    "expected_env_var": "STRIPE_WEBHOOK_SECRET_LIVE",
    "webhook_secret_length": 40,
    "webhook_secret_format_valid": true
  }
}
```

**🚨 If you see:**
- `"webhook_configured": false` → Environment variable is NOT set
- `"has_STRIPE_WEBHOOK_SECRET_LIVE": false` → Missing the _LIVE variable
- `"webhook_secret_format_valid": false` → Wrong secret format
- `"webhook_secret_length": 0` → Secret is empty

### Test 2: Test Payment Flow

1. Go to your live site: `https://crevo.app`
2. Log in and try to purchase a plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Check Stripe Dashboard → Webhooks → Your endpoint
5. You should see `200 OK` instead of `400 Invalid signature`

### Test 3: Manually Resend Failed Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Find the failed events (the ones you showed me)
3. Click on each event
4. Click **Resend** button
5. They should now succeed with `200 OK`

---

## 🐛 TROUBLESHOOTING

### Issue: Still Getting "Invalid Signature"

**Possible Causes:**

1. **Wrong Secret in Vercel**
   - Double-check the secret matches EXACTLY (copy from Stripe Dashboard)
   - No extra spaces or quotes

2. **Environment Not Set to Production**
   - Make sure you selected "Production" when adding the variable
   - Or select "Production, Preview, Development" to apply to all

3. **Deployment Didn't Pick Up Changes**
   - Do a fresh deployment (not just redeploy)
   - Or clear cache and redeploy

4. **Wrong Webhook in Stripe**
   - Make sure the webhook endpoint in Stripe is `https://crevo.app/api/webhooks/stripe`
   - Not `https://www.crevo.app` or any other variation

### Issue: Environment Variable Not Showing Up

**Check Vercel Logs:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Click **Function Logs** tab
4. Trigger a webhook
5. Look for logs like:
   ```
   🔧 Webhook Request - Environment: production (LIVE)
   🔑 Webhook Secret Status: CONFIGURED (40 chars)
   ```

If it says `MISSING` or `0 chars`, the environment variable is not loaded.

---

## 📋 QUICK CHECKLIST

- [ ] Added `STRIPE_WEBHOOK_SECRET_LIVE` to Vercel (Production)
- [ ] Value is exactly: `whsec_pud3vY1pfsT97COt1qGNasP4O8yMIRBR`
- [ ] Redeployed the application
- [ ] Verified endpoint health check: `https://crevo.app/api/webhooks/stripe`
- [ ] `webhook_configured` is `true`
- [ ] `has_STRIPE_WEBHOOK_SECRET_LIVE` is `true`
- [ ] Tested a payment and webhook succeeded
- [ ] Resent failed webhooks from Stripe Dashboard

---

## 💡 WHY THIS HAPPENS

Your code uses environment-aware configuration:

- **Development**: Looks for `STRIPE_WEBHOOK_SECRET_TEST`
- **Production**: Looks for `STRIPE_WEBHOOK_SECRET_LIVE`

When `NODE_ENV=production` (which Vercel sets automatically), your app expects `STRIPE_WEBHOOK_SECRET_LIVE` to be set. If it's not, it falls back to `STRIPE_WEBHOOK_SECRET` (which might also be missing).

Stripe sends the webhook with a signature computed using the signing secret from the Stripe Dashboard. Your server must use the **exact same secret** to verify the signature. If the secret is missing or wrong, verification fails with "Invalid signature".

---

## 🎯 EXPECTED OUTCOME

After following these steps:

1. ✅ All webhooks from Stripe will succeed with `200 OK`
2. ✅ Payment transactions will be recorded in your database
3. ✅ Users will receive credits after successful payment
4. ✅ No more "Invalid signature" errors

---

## 📞 NEXT STEPS

1. Follow Step 1-3 above to configure Vercel
2. Run Verification Test 1 to confirm setup
3. Test a payment (Verification Test 2)
4. Check this document and report back with the results from the health check endpoint

**Need more help?** Share the response from `https://crevo.app/api/webhooks/stripe` after redeployment.

