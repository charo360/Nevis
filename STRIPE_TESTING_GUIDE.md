# Stripe Payment Testing Guide

## ✅ Completed Setup

### 1. Stripe Event Handlers Added
The webhook now handles all required events:
- ✅ `checkout.session.completed` - Credits added to user
- ✅ `payment_intent.succeeded` - Logged (handled by checkout.session.completed)
- ✅ `payment_intent.payment_failed` - Transaction marked as failed
- ✅ `charge.refunded` - Transaction updated with refund status
- ✅ `charge.dispute.created` - Transaction marked as disputed

### 2. Stripe CLI Setup
```bash
# Login with your Stripe test key
stripe login --api-key $(grep STRIPE_SECRET_KEY_TEST .env.local | cut -d= -f2)

# Webhook forwarding is running in background
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## 🧪 Testing Payments

### Method 1: Run Test Script
```bash
node test-stripe-payments.mjs
```

This will:
1. Create a test checkout session
2. Generate a payment URL
3. Check database for transactions
4. Verify user credits

### Method 2: Manual Testing

#### Step 1: Create Test Payment
Visit: http://localhost:3001/pricing

#### Step 2: Use Test Card
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

#### Step 3: Watch Logs
Check your dev server terminal for webhook events:
```
🎯 Received Stripe webhook: checkout.session.completed
✅ Payment processed successfully
💳 Credits added: 50
```

### Method 3: Trigger Events via CLI

```bash
# Successful payment
stripe trigger checkout.session.completed

# Failed payment
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded

# Dispute
stripe trigger charge.dispute.created
```

## 📊 Verify Database

### Check Payment Transactions
```sql
SELECT 
  id, 
  user_id, 
  plan_id, 
  amount, 
  credits_added, 
  status, 
  created_at 
FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check User Credits
```sql
SELECT 
  user_id, 
  total_credits, 
  remaining_credits, 
  used_credits, 
  last_payment_at 
FROM user_credits 
WHERE user_id = '3d60b964-0f6f-4c34-a08f-b522263192db';
```

### Check Credit Usage History
```sql
SELECT 
  user_id, 
  credits_used, 
  feature, 
  model_version,
  created_at 
FROM credit_usage_history 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔧 API Versions

### Development (Current)
- API Version: `2024-06-20`
- Environment: Test mode
- Webhook Secret: Set in `.env.local` as `STRIPE_WEBHOOK_SECRET_TEST`

### Production (Vercel)
- API Version: `2025-08-27.basil` (configured in Stripe Dashboard)
- Environment: Live mode
- Webhook Secret: Set in Vercel env as `STRIPE_WEBHOOK_SECRET_LIVE`

## 🎯 Event Flow

### Successful Payment
```
1. User clicks "Buy Now" → Creates checkout session
2. User completes payment → Stripe processes
3. Stripe sends webhook: checkout.session.completed
4. Server calls: process_payment_with_idempotency(session_id, user_id, plan_id, amount, credits)
5. Database atomically:
   - Creates payment_transactions record
   - Adds credits to user_credits
   - Returns new balance
6. User sees updated credits
```

### Failed Payment
```
1. Payment fails (card declined, etc.)
2. Stripe sends: payment_intent.payment_failed
3. Server updates payment_transactions.status = 'failed'
4. No credits added
```

### Refund
```
1. Admin issues refund in Stripe Dashboard
2. Stripe sends: charge.refunded
3. Server updates payment_transactions.status = 'refunded' or 'partially_refunded'
4. Logs refund details in metadata
5. (Optional) Deduct credits from user if business logic requires
```

### Dispute
```
1. Customer disputes charge
2. Stripe sends: charge.dispute.created
3. Server updates payment_transactions.status = 'disputed'
4. Logs dispute details in metadata
```

## 🔐 Security

### Webhook Signature Verification
All webhooks verify the Stripe signature before processing:
```typescript
const event = stripe.webhooks.constructEvent(
  body, 
  signature, 
  webhookSecret
);
```

### Idempotency Protection
Duplicate webhooks are ignored via `process_payment_with_idempotency`:
- Uses `stripe_session_id` as unique constraint
- Prevents double-crediting
- Returns `was_duplicate: true` for repeat calls

## 📝 Test Checklist

- [x] Stripe CLI logged in
- [x] Webhook forwarding active
- [x] Event handlers implemented
- [ ] Run test script: `node test-stripe-payments.mjs`
- [ ] Complete test payment with card `4242...`
- [ ] Verify credits in database
- [ ] Test refund event
- [ ] Test dispute event
- [ ] Verify idempotency (trigger same event twice)

## 🚀 Production Deployment

Before going live:
1. Update API version in code to match Dashboard (`2025-08-27.basil`)
2. Add live webhook endpoint in Stripe Dashboard
3. Set `STRIPE_WEBHOOK_SECRET_LIVE` in Vercel env
4. Test with live mode test card: `4000 0000 0000 0077` (requires 3D Secure)
5. Monitor webhook logs in Stripe Dashboard

## 📞 Support

If webhooks aren't firing:
1. Check Stripe CLI is running: `stripe listen`
2. Verify dev server is on port 3001
3. Check webhook secret matches between Stripe CLI output and `.env.local`
4. Review server logs for signature verification errors
5. Test endpoint health: `curl http://localhost:3001/api/webhooks/stripe`

