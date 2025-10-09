# 🚀 Production Environment Setup Guide

## Environment Variables for Production (Vercel/Netlify/etc)

### Required Production Environment Variables

```bash
# Environment
NODE_ENV=production

# Stripe Production/Live Keys
STRIPE_SECRET_KEY_LIVE=sk_live_YOUR_LIVE_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE  
STRIPE_WEBHOOK_SECRET_LIVE=whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE

# Stripe Fallback Keys (will use LIVE keys in production)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE

# Other required production variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## 🔧 How Environment Detection Works

### Development (NODE_ENV !== 'production')
- **Priority 1**: `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET_TEST` 
- **Fallback**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Keys Expected**: `sk_test_*`, `pk_test_*`, `whsec_*`

### Production (NODE_ENV === 'production')  
- **Priority 1**: `STRIPE_SECRET_KEY_LIVE`, `STRIPE_WEBHOOK_SECRET_LIVE`
- **Fallback**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Keys Expected**: `sk_live_*`, `pk_live_*`, `whsec_*`

## 🚨 Critical Steps for Production Deployment

### 1. Update Stripe Webhook URLs
In Stripe Dashboard → Webhooks:
- **Development**: `http://localhost:3001/api/webhooks/stripe` (via Stripe CLI)
- **Production**: `https://your-domain.com/api/webhooks/stripe`

### 2. Webhook Events to Listen For
- `checkout.session.completed` (for successful payments)
- `payment_intent.payment_failed` (for failed payments)

### 3. Test Production Configuration
```bash
# Test endpoint health
curl https://your-domain.com/api/webhooks/stripe

# Should return:
{
  "status": "active",
  "environment": "production", 
  "isLive": true,
  "webhook_configured": true
}
```

## 🔍 Troubleshooting

### "Invalid Signature" Errors
1. Check webhook secret matches Stripe Dashboard
2. Verify environment variables are set correctly
3. Ensure webhook URL is correct: `/api/webhooks/stripe`

### Payment Status Stuck on "Pending"
1. Check webhook events are being delivered (Stripe Dashboard)
2. Verify webhook secret is correct for environment
3. Check server logs for webhook processing errors

### Environment Key Mismatches  
The system will warn you if:
- Test keys are used in production
- Live keys are used in development
- Webhook secret format is invalid

## 🔐 Security Best Practices

1. **Never commit real keys** to git - use environment variables only
2. **Use different keys** for test vs production 
3. **Rotate webhook secrets** periodically
4. **Monitor webhook delivery** in Stripe Dashboard
5. **Set up alerts** for failed webhook deliveries