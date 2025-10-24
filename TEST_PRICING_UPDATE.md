# ✅ Test Pricing Update Complete - $0.50 Starter Plan

## 🎯 Summary

The Starter Agent price has been updated from **$9.99** to **$0.50** for testing purposes, using the new Stripe price ID.

**Note:** Stripe requires a minimum charge of $0.50 USD for payments.

---

## 📝 Changes Made

### 1. **Stripe Configuration** (`src/lib/stripe-config.ts`)
- ✅ Updated production price ID: `price_1SDqfQELJu3kIHjxzHWPNMPs`
- ✅ Added comment: "Starter Agent TEST PRICE $0.50 (prod)"

### 2. **Secure Pricing** (`src/lib/secure-pricing.ts`)
- ✅ Updated display price: `9.99` → `0.50`
- ✅ Updated price ID with env var support: `process.env.STRIPE_PRICE_STARTER || 'price_1SDqfQELJu3kIHjxzHWPNMPs'`

### 3. **Pricing Data** (`src/lib/pricing-data.ts`)
- ✅ Updated display price: `9.99` → `0.50`
- ✅ Updated cost per credit: `0.25` → `0.0125`

### 4. **Pricing Page** (`src/app/pricing/page.tsx`)
- ✅ Updated displayed price: `$9.99` → `$0.50`
- ✅ Updated data attribute: `data-amount="999"` → `data-amount="50"`
- ✅ Updated cost per credit display: `$0.25` → `$0.0125`

### 5. **Homepage** (`src/app/page.tsx`)
- ✅ Updated displayed price: `$9.99` → `$0.50`
- ✅ Updated data attribute: `data-amount="999"` → `data-amount="50"`
- ✅ Updated cost per credit display: `$0.25` → `$0.0125`

### 6. **Payment API Fallback** (`src/app/api/payments/create-checkout-session/route.ts`)
- ✅ Updated fallback amount: `999` cents → `50` cents
- ✅ Added comment: "// TEST: $0.50 (Stripe minimum)"

---

## 🧪 Testing Checklist

### Before Testing
- [ ] Make sure `STRIPE_WEBHOOK_SECRET_LIVE` is set in Vercel (from previous fix)
- [ ] Verify Stripe price ID `price_1SDqfQELJu3kIHjxzHWPNMPs` exists in your Stripe Dashboard
- [ ] Verify `STRIPE_PRICE_STARTER` is set in Vercel to `price_1SDqfQELJu3kIHjxzHWPNMPs`
- [ ] Deploy these changes to production

### Test Flow
1. **Homepage Test**
   - [ ] Visit `https://crevo.app`
   - [ ] Scroll to pricing section
   - [ ] Verify "Starter Agent" shows **$0.50**
   - [ ] Verify shows "40 credits"
   - [ ] Verify shows "$0.0125 per credit"

2. **Pricing Page Test**
   - [ ] Visit `https://crevo.app/pricing`
   - [ ] Verify "Starter Agent" shows **$0.50**
   - [ ] Verify all pricing displays correctly

3. **Checkout Test**
   - [ ] Click "Buy Credits" on Starter Agent
   - [ ] Login if needed
   - [ ] Verify Stripe checkout shows **$0.50 USD**
   - [ ] Complete test payment using test card: `4242 4242 4242 4242`
   - [ ] Verify payment succeeds

4. **Webhook Test**
   - [ ] Check Stripe Dashboard → Webhooks
   - [ ] Verify `checkout.session.completed` event shows `200 OK` (not 400)
   - [ ] Verify `payment_intent.succeeded` event shows `200 OK`

5. **Database Test**
   - [ ] Check Supabase `payment_transactions` table
   - [ ] Verify new record with `amount: 0.50`
   - [ ] Verify user received 40 credits

6. **User Experience Test**
   - [ ] After payment, verify redirect to success page
   - [ ] Check user dashboard shows +40 credits
   - [ ] Try generating content to verify credits work

---

## 🔍 Verification URLs

### Health Check
```
https://crevo.app/api/webhooks/stripe
```

**Expected Response:**
```json
{
  "webhook_configured": true,
  "has_STRIPE_WEBHOOK_SECRET_LIVE": true,
  "webhook_secret_format_valid": true
}
```

### Test Payment Flow
1. Homepage: `https://crevo.app` → Scroll to pricing
2. Pricing Page: `https://crevo.app/pricing`
3. Login: `https://crevo.app/auth`

---

## 💡 Important Notes

### Price ID Details
- **Original Price ID**: `price_1SDqfQELJu3kIHjxzHWPNMPs` ($9.99 - original)
- **Test Price ID**: `price_1SDqfQELJu3kIHjxzHWPNMPs` ($0.50 - updated for testing)
- **Credits**: 40 (unchanged)
- **Stripe Minimum**: $0.50 USD (enforced by Stripe)

### How It Works
1. User clicks "Buy Credits" on Starter Agent
2. Frontend sends `planId: "starter"` to API
3. Backend looks up price ID: `price_1SDqfQELJu3kIHjxzHWPNMPs`
4. Stripe creates checkout session for $0.50
5. User completes payment
6. Webhook receives event and adds 40 credits to user

### Fallback Behavior
If the Stripe Price ID lookup fails, the system will fall back to creating an inline price with the amount from the PLANS map (now set to 50 cents).

---

## 🔄 Reverting to Original Price

When you're done testing and want to restore the original $9.99 price:

### Option 1: Quick Revert (Same Files)
Update these values back:
- `price: 0.50` → `price: 9.99`
- `amountCents: 50` → `amountCents: 999`
- `data-amount="50"` → `data-amount="999"`
- `costPerCredit: 0.0125` → `costPerCredit: 0.25`
- Update Stripe price in Dashboard to create a new $9.99 price

### Option 2: Git Revert
```bash
git diff HEAD~1  # Review changes
git revert HEAD  # Revert this commit
```

---

## 📊 Expected Stripe Dashboard View

After successful test payment, you should see:

**Products:**
- Product: "Starter Pack (40 credits)"
- Price: $0.50 USD
- Price ID: `price_1SDqfQELJu3kIHjxzHWPNMPs`

**Payments:**
- Amount: $0.50 USD
- Status: Succeeded
- Description: "Starter Pack (40 credits)"

**Webhooks:**
- Event: `checkout.session.completed` → 200 OK ✅
- Event: `payment_intent.succeeded` → 200 OK ✅

---

## 🐛 Troubleshooting

### Issue: Checkout still shows $9.99
**Cause:** Browser cache or CDN cache
**Solution:** 
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Try incognito/private mode

### Issue: Webhook still fails
**Cause:** Environment variable not set
**Solution:** 
- Check `STRIPE_WEBHOOK_SECRET_LIVE` in Vercel
- Follow `VERCEL_STRIPE_SETUP.md`
- Run `./diagnose-webhook-production.sh`

### Issue: Wrong amount charged
**Cause:** Old price ID still cached or wrong price configured
**Solution:**
- Verify price ID `price_1SDqfQELJu3kIHjxzHWPNMPs` exists in Stripe Dashboard
- Verify it's set to $0.50 USD
- Check `STRIPE_PRICE_STARTER` environment variable in Vercel
- Check deployment picked up latest code
- Redeploy if necessary

---

## ✅ Success Criteria

Test is successful when:
- ✅ Homepage displays "$0.50"
- ✅ Pricing page displays "$0.50"
- ✅ Stripe checkout shows $0.50 USD
- ✅ Payment completes successfully
- ✅ Webhooks return 200 OK (not 400)
- ✅ User receives 40 credits
- ✅ Database shows amount: 0.50

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check Stripe Dashboard webhook logs
3. Run `./diagnose-webhook-production.sh`
4. Verify all environment variables are set correctly
5. Check browser console for errors

**Common Files to Check:**
- Vercel Environment Variables
- Stripe Dashboard → Products & Prices
- Stripe Dashboard → Webhooks
- Supabase → payment_transactions table

