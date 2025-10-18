# 🌐 ngrok Setup for Local Webhook Testing

## ✅ You already configured ngrok!

Now let's test the payment flow with HTTPS webhooks.

---

## 🚀 **STEP-BY-STEP GUIDE**

### **Terminal 1: Dev Server** (Should already be running)
```bash
npm run dev
```
✅ Keep this running on http://localhost:3001

---

### **Terminal 2: Start ngrok Tunnel**

Run this command (port 3001, not 80):
```bash
ngrok http 3001
```

You'll see output like:
```
Session Status                online
Account                       Your Account (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-xyz.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**COPY THIS URL:** `https://abc123-xyz.ngrok-free.app` ⚠️ Important!

---

### **Step 1: Add Webhook to Stripe Dashboard**

1. **Open:** https://dashboard.stripe.com/test/webhooks

2. **Click "Add endpoint"**

3. **Endpoint URL:**
   ```
   https://your-ngrok-url.ngrok-free.app/api/webhooks/stripe
   ```
   Replace `your-ngrok-url` with the URL from ngrok output

4. **Description:** `Local Development Webhook`

5. **Select events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

6. **Click "Add endpoint"**

---

### **Step 2: Get the Signing Secret**

After creating the endpoint:

1. Click on the endpoint you just created
2. Scroll to **"Signing secret"**
3. Click **"Reveal"**
4. **Copy the secret** (starts with `whsec_`)

---

### **Step 3: Update .env.local**

Add this to your `.env.local` file:
```bash
STRIPE_WEBHOOK_SECRET_TEST=whsec_your_secret_from_step_2
```

**Save the file**

---

### **Step 4: Restart Dev Server**

In **Terminal 1**:
- Press `Ctrl+C` to stop
- Run `npm run dev` again

This loads the new webhook secret.

---

### **Step 5: Test Payment in Browser**

**Terminal 3:**
```bash
node test-payment-local.mjs
```

This will:
1. Show your current credits
2. Create a checkout session
3. Display a checkout URL (in cyan)

**Copy the checkout URL** and open in browser

**Fill in the form:**
- Email: `test@example.com`
- Card: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`
- Name: `Test User`

**Click "Pay"**

---

### **Step 6: Watch the Results! 🎉**

**Terminal 2 (ngrok)** - Will show:
```
POST /api/webhooks/stripe      200 OK
```

**Terminal 1 (dev server)** - Will show:
```
🎯 Received Stripe webhook: checkout.session.completed
✅ Webhook signature verified successfully
🎉 Processing completed checkout session: cs_test_xxxxx
✅ Found plan: { planId: 'starter', credits: 40 }
✅ Payment processed successfully: { credits_added: 40 }
```

**Terminal 3 (test script)** - After 30 seconds, will show:
```
✅ User credits AFTER:  17891  (was 17851)
✅ Credits ADDED:       40

🎉 SUCCESS! Credits were added correctly!
```

---

### **Step 7: Verify Credits**

Run:
```bash
node check-credits.mjs
```

Should show:
```
✅ Current Credits:
   Remaining:   17891  (← increased by 40!)
   
📋 Recent Transactions:
   [NEW] 1. starter - $0.5
         Credits Added: 40
         Status: completed
```

---

## 🎯 **Quick Reference**

### Start ngrok:
```bash
ngrok http 3001
```

### Test payment:
```bash
node test-payment-local.mjs
```

### Check credits:
```bash
node check-credits.mjs
```

---

## ✅ **Success Criteria**

Test passes when:
- ✅ ngrok shows webhook POST requests
- ✅ Dev server shows "Payment processed successfully"
- ✅ Credits increase by 40
- ✅ Payment transaction record created

---

## 🎉 **After Success**

Once this works locally:
- ✅ Your code is 100% ready
- ✅ Deploy to production with confidence
- ✅ Production webhooks will work the same way

**Let's do it!** 🚀


