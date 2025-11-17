# 🔧 **STRIPE TEST KEYS SETUP GUIDE**

## 🎯 **Quick Setup Instructions**

You now have Stripe configuration placeholders in your `.env.local` file. Follow these steps to get your actual test keys:

### **Step 1: Get Your Stripe Test Keys**

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/
2. **Make sure you're in TEST mode** (toggle in top-left should say "Test mode")
3. **Navigate to**: Developers → API keys
4. **Copy the following keys**:
   - **Publishable key**: Starts with `pk_test_...`
   - **Secret key**: Starts with `sk_test_...` (click "Reveal live key token")

### **Step 2: Update Your .env.local File**

Replace the placeholders in your `.env.local` file:

```bash
# Replace these lines in .env.local:
STRIPE_SECRET_KEY_TEST=sk_test_YOUR_ACTUAL_TEST_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_YOUR_ACTUAL_TEST_PUBLISHABLE_KEY
```

### **Step 3: Set Up Webhook Endpoint (Optional for now)**

1. **Go to**: Developers → Webhooks in Stripe Dashboard
2. **Add endpoint**: `http://localhost:3001/api/webhooks/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
4. **Copy the webhook secret**: Starts with `whsec_...`
5. **Update .env.local**:
   ```bash
   STRIPE_WEBHOOK_SECRET_TEST=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
   ```

### **Step 4: Test the Configuration**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Check webhook status**:
   ```bash
   curl http://localhost:3001/api/webhooks/stripe
   ```

3. **Look for**:
   ```json
   {
     "environment": "development",
     "isLive": false,
     "secret_key_prefix": "sk_test_...",  // ✅ Should be test key now
     "webhook_configured": true
   }
   ```

### **Step 5: Test Payment Flow**

1. **Go to**: http://localhost:3001/pricing
2. **Try purchasing a plan**
3. **Use Stripe test card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
   - **ZIP**: Any 5 digits

## 🔍 **Verification Checklist**

- [ ] Test keys added to `.env.local`
- [ ] Development server restarted
- [ ] Webhook endpoint shows test keys
- [ ] Payment flow works with test card
- [ ] No real money transactions possible

## 🚨 **Important Security Notes**

1. **Never commit real keys to git**
2. **Keep test and live keys separate**
3. **Use environment variables for all keys**
4. **Test thoroughly before going live**

## 🎉 **You're Ready!**

Once you've completed these steps, your Stripe integration will be properly configured for development with test keys, making it safe to test payments without any risk of real charges.

## 🆘 **Need Help?**

If you encounter any issues:
1. Check the browser console for errors
2. Check the server logs for Stripe-related messages
3. Verify your keys are correctly formatted
4. Make sure you're in Stripe's test mode

Your Stripe integration code is excellent - you just need the right keys! 🚀
