# Payment System Testing Guide

## Overview
This guide provides comprehensive testing procedures for the Nevis AI payment system implementation to ensure no disruption to existing functionality.

## Pre-Deployment Testing

### 1. Database Migration Testing

#### Test Migration Script
```bash
# Run migration on staging database
npm run migrate:staging

# Verify migration status
curl -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  http://localhost:3001/api/admin/migrate-users
```

#### Expected Results
- All existing users should have `trial_ends_at` set
- Users older than 30 days get 14-day trial + 25 credits
- Users 7-30 days old get 10-day trial + 15 credits
- New users get 7-day trial + 10 credits

### 2. API Endpoint Testing

#### Test Subscription Access Check
```bash
# Test with valid token
curl -X POST http://localhost:3001/api/subscription/check-access \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature": "revo-2.0"}'

# Expected responses:
# Active subscription: {"hasAccess": true, "subscriptionStatus": "active"}
# Trial period: {"hasAccess": true, "subscriptionStatus": "trialing"}
# Expired: {"hasAccess": false, "subscriptionStatus": "trial_expired"}
```

#### Test Revo Generation with Subscription Guard
```bash
# Test Revo 2.0 generation
curl -X POST http://localhost:3001/api/generate-revo-2.0 \
  -H "Authorization: Bearer VALID_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "Restaurant",
    "platform": "Instagram",
    "brandProfile": {
      "businessName": "Test Restaurant",
      "businessType": "Restaurant"
    }
  }'

# Expected responses:
# Success: {"success": true, "imageUrl": "...", "model": "Revo 2.0"}
# No access: {"success": false, "code": "SUBSCRIPTION_REQUIRED", "upgradeUrl": "/pricing"}
```

### 3. Frontend Component Testing

#### Test Subscription Status Component
```typescript
// Test different subscription states
const testStates = [
  { status: 'active', hasAccess: true },
  { status: 'trialing', hasAccess: true },
  { status: 'trial_expired', hasAccess: false },
  { status: 'inactive', hasAccess: false }
];

// Verify component renders correctly for each state
```

#### Test Subscription Guard Component
```typescript
// Test access control wrapper
<SubscriptionGuard feature="revo-2.0">
  <RevoGenerationComponent />
</SubscriptionGuard>

// Should show upgrade prompt when access denied
// Should render component when access granted
```

## Deployment Testing Checklist

### Phase 1: Staging Deployment
- [ ] Deploy database migrations
- [ ] Run user migration script
- [ ] Verify all existing users have trial periods
- [ ] Test API endpoints with different user states
- [ ] Test frontend components with mock data

### Phase 2: Canary Deployment (10% of users)
- [ ] Deploy to 10% of production traffic
- [ ] Monitor error rates and user complaints
- [ ] Verify payment flows work correctly
- [ ] Check Stripe webhook processing
- [ ] Monitor subscription status checks

### Phase 3: Full Deployment
- [ ] Deploy to all users
- [ ] Monitor system performance
- [ ] Track subscription conversion rates
- [ ] Monitor support tickets for payment issues

## Rollback Procedures

### Emergency Rollback
If critical issues are detected:

```bash
# 1. Rollback database changes
curl -X POST http://localhost:3001/api/admin/migrate-users \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback"}'

# 2. Revert API routes to previous version
git revert PAYMENT_SYSTEM_COMMIT_HASH

# 3. Redeploy previous version
npm run deploy:rollback
```

### Graceful Degradation Testing
Test system behavior when payment services are unavailable:

```bash
# Simulate Stripe downtime
# Block requests to api.stripe.com

# Expected behavior:
# - Existing subscriptions continue working
# - New purchases show "try again later"
# - Free features remain accessible
```

## User Experience Testing

### Test User Journeys

#### New User Journey
1. Sign up → Gets 7-day trial automatically
2. Use Revo features → Works during trial
3. Trial expires → Shows upgrade prompt
4. Purchase subscription → Full access restored

#### Existing User Journey
1. Login → Gets extended trial based on account age
2. Continue using features → No interruption
3. Receives email about new payment system
4. Can upgrade when ready

#### Subscription User Journey
1. Purchase subscription → Immediate access
2. Use premium features → No restrictions
3. Subscription expires → Graceful degradation to trial
4. Renew subscription → Access restored

## Performance Testing

### Load Testing Subscription Checks
```bash
# Test subscription check performance
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/subscription/check-access

# Target: < 200ms response time
# Target: > 99% success rate
```

### Database Performance
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM check_subscription_access('user-123', 'revo-2.0');

-- Should use indexes efficiently
-- Should complete in < 50ms
```

## Monitoring and Alerts

### Key Metrics to Monitor
- Subscription check API response time
- Payment webhook processing success rate
- User trial conversion rate
- Support ticket volume related to payments
- API error rates for protected endpoints

### Alert Thresholds
- Subscription API response time > 500ms
- Payment webhook failure rate > 5%
- Protected API error rate > 2%
- Support tickets mentioning "payment" > 10/hour

## Post-Deployment Validation

### Week 1: Immediate Validation
- [ ] All existing users can still access features
- [ ] New signups get proper trial periods
- [ ] Payment flows work end-to-end
- [ ] No increase in error rates

### Week 2-4: Conversion Tracking
- [ ] Monitor trial-to-paid conversion rates
- [ ] Track user engagement during trial period
- [ ] Analyze subscription upgrade patterns
- [ ] Gather user feedback on payment experience

### Month 1: System Optimization
- [ ] Optimize subscription check performance
- [ ] Refine trial period lengths based on data
- [ ] Improve upgrade messaging based on user feedback
- [ ] Plan additional payment features

## Success Criteria

### Technical Success
- Zero downtime during deployment
- < 1% increase in API error rates
- All existing users maintain access during migration
- Payment processing success rate > 98%

### Business Success
- Trial-to-paid conversion rate > 5%
- User satisfaction score remains > 4.0/5.0
- Support ticket volume increase < 20%
- Revenue generation within 30 days

## Troubleshooting Common Issues

### Issue: Users Can't Access Features
**Diagnosis**: Check subscription status and trial expiration
**Solution**: Extend trial or grant bonus credits

### Issue: Payment Webhooks Failing
**Diagnosis**: Check Stripe webhook logs and endpoint status
**Solution**: Retry failed webhooks, fix endpoint issues

### Issue: Slow Subscription Checks
**Diagnosis**: Database query performance
**Solution**: Add indexes, optimize queries, implement caching

### Issue: Frontend Components Not Loading
**Diagnosis**: Authentication token issues
**Solution**: Refresh tokens, check localStorage, verify JWT validity
