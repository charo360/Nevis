# Payment System Deployment Guide

## 🚀 **Deployment Overview**

This guide provides step-by-step instructions for deploying the Nevis AI payment system with zero downtime and backward compatibility.

## 📋 **Pre-Deployment Checklist**

### Environment Variables
Add these to your `.env.local`:
```bash
# Admin secret for migration endpoints
ADMIN_SECRET=your-secure-admin-secret-key-here

# Stripe configuration (already configured)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Dependencies
Ensure all required packages are installed:
```bash
npm install @supabase/supabase-js stripe jsonwebtoken bcryptjs
```

## 🗄️ **Database Migration**

### Step 1: Run Database Migration
```bash
# Apply the payment system migration
npx supabase migration up --file 003_payment_system_enhancement.sql

# Verify migration was successful
npx supabase db diff
```

### Step 2: Verify Database Schema
Check that these tables were created:
- `subscriptions`
- `payment_transactions` 
- `usage_logs`

And these columns were added to `users`:
- `stripe_customer_id`
- `stripe_subscription_id`
- `trial_ends_at`
- `last_payment_at`
- `total_credits`
- `used_credits`
- `remaining_credits`

## 👥 **User Migration**

### Step 1: Check Current User Status
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  http://localhost:3001/api/admin/migrate-users
```

### Step 2: Run User Migration
```bash
curl -X POST http://localhost:3001/api/admin/migrate-users \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate_all"}'
```

### Step 3: Verify Migration Results
```bash
curl -X POST http://localhost:3001/api/admin/migrate-users \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

Expected response:
```json
{
  "success": true,
  "status": {
    "totalUsers": 150,
    "migratedUsers": 150,
    "pendingUsers": 0,
    "migrationProgress": 100
  }
}
```

## 🔧 **Application Deployment**

### Step 1: Deploy Backend Changes
The following files contain the core payment system:

**New Files:**
- `src/lib/subscription/subscription-service.ts`
- `src/lib/middleware/subscription-guard.ts`
- `src/lib/migration/user-migration.ts`
- `src/app/api/subscription/check-access/route.ts`
- `src/app/api/admin/migrate-users/route.ts`
- `src/components/subscription/subscription-status.tsx`

**Modified Files:**
- `src/app/api/generate-revo-2.0/route.ts` (added subscription guard)
- `src/app/api/webhooks/stripe/route.ts` (enhanced with subscription service)

### Step 2: Deploy Frontend Changes
Update your components to use the new subscription system:

```typescript
// Example: Protect a component
import { SubscriptionGuard } from '@/components/subscription/subscription-status';

function MyComponent() {
  return (
    <SubscriptionGuard feature="revo-2.0">
      <RevoGenerationInterface />
    </SubscriptionGuard>
  );
}
```

### Step 3: Update Existing API Routes
Apply subscription guards to other Revo API routes:

```typescript
// For Revo 1.0 and 1.5 routes
import { withSubscriptionGuard } from '@/lib/middleware/subscription-guard';

export async function POST(request: NextRequest) {
  const accessControl = await withSubscriptionGuard(request, {
    feature: 'revo-1.0', // or 'revo-1.5'
    requireAuth: true,
    allowTrial: true
  });

  if (!accessControl.hasAccess) {
    return accessControl.response!;
  }

  // Continue with generation logic...
}
```

## 🧪 **Testing Deployment**

### Step 1: Test API Endpoints
```bash
# Test subscription check
curl -X POST http://localhost:3001/api/subscription/check-access \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature": "revo-2.0"}'

# Test Revo generation with subscription
curl -X POST http://localhost:3001/api/generate-revo-2.0 \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "Restaurant",
    "platform": "Instagram", 
    "brandProfile": {"businessName": "Test"}
  }'
```

### Step 2: Test Frontend Components
1. Login as an existing user
2. Verify trial period is active
3. Test Revo generation features
4. Check subscription status display

### Step 3: Test Payment Flow
1. Create test subscription in Stripe
2. Verify webhook processing
3. Check user access is granted
4. Test subscription cancellation

## 📊 **Monitoring Setup**

### Key Metrics to Track
```bash
# API response times
curl -w "@curl-format.txt" -s -o /dev/null \
  http://localhost:3001/api/subscription/check-access

# Database query performance
SELECT avg(duration) FROM pg_stat_statements 
WHERE query LIKE '%check_subscription_access%';

# User conversion rates
SELECT 
  COUNT(*) as trial_users,
  COUNT(CASE WHEN subscription_plan != 'free' THEN 1 END) as paid_users
FROM users 
WHERE trial_ends_at > NOW();
```

### Error Monitoring
Set up alerts for:
- Subscription API errors > 2%
- Payment webhook failures > 5%
- Database query timeouts
- User complaints about access issues

## 🔄 **Rollback Procedures**

### Emergency Rollback
If critical issues occur:

```bash
# 1. Rollback user migration
curl -X POST http://localhost:3001/api/admin/migrate-users \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback"}'

# 2. Revert code changes
git revert PAYMENT_COMMIT_HASH
npm run build && npm run deploy

# 3. Verify system is working
curl http://localhost:3001/api/generate-revo-2.0 # Should work without auth
```

### Partial Rollback
To rollback specific components:

```bash
# Disable subscription checks (graceful degradation)
export DISABLE_SUBSCRIPTION_CHECKS=true

# Or modify subscription guard to always return true
# This allows continued operation while fixing issues
```

## 📈 **Post-Deployment Tasks**

### Week 1: Immediate Monitoring
- [ ] Monitor error rates and response times
- [ ] Check user feedback and support tickets
- [ ] Verify payment processing is working
- [ ] Track trial user engagement

### Week 2-4: Optimization
- [ ] Analyze subscription conversion rates
- [ ] Optimize trial period lengths
- [ ] Improve upgrade messaging
- [ ] Add usage analytics

### Month 1: Feature Enhancement
- [ ] Add subscription management UI
- [ ] Implement usage-based billing
- [ ] Add team/organization features
- [ ] Plan advanced payment features

## ✅ **Success Validation**

### Technical Validation
- [ ] Zero downtime during deployment
- [ ] All existing users maintain access
- [ ] API response times < 200ms
- [ ] Payment success rate > 98%

### Business Validation
- [ ] Trial-to-paid conversion > 5%
- [ ] User satisfaction maintained
- [ ] Revenue generation started
- [ ] Support ticket volume stable

## 🆘 **Troubleshooting**

### Common Issues and Solutions

**Issue**: Users can't access features after migration
```bash
# Check user trial status
SELECT user_id, trial_ends_at, remaining_credits, subscription_status 
FROM users WHERE user_id = 'USER_ID';

# Grant bonus credits if needed
curl -X POST http://localhost:3001/api/admin/migrate-users \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{"action": "grant_bonus", "userId": "USER_ID", "bonusCredits": 50}'
```

**Issue**: Subscription checks are slow
```sql
-- Add database indexes
CREATE INDEX CONCURRENTLY idx_users_subscription_status ON users(subscription_status);
CREATE INDEX CONCURRENTLY idx_users_trial_ends ON users(trial_ends_at);
```

**Issue**: Payment webhooks failing
```bash
# Check Stripe webhook logs
stripe logs tail --filter-account ACCOUNT_ID

# Retry failed webhooks
stripe events resend EVENT_ID
```

## 📞 **Support Contacts**

- **Technical Issues**: Check logs and error monitoring
- **Payment Issues**: Review Stripe dashboard and webhook logs  
- **User Issues**: Check subscription status and trial periods
- **Database Issues**: Monitor query performance and connection pools

---

**Deployment Checklist Complete**: ✅ Ready for production deployment
