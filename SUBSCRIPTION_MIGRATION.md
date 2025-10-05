# Subscription Model Migration Plan

## Current Problem
- Users buy credits once and use them for months
- No recurring revenue
- Revenue leakage from heavy users

## Solution: Hybrid Subscription Model

### New Pricing Structure

#### 🥉 **Starter Plan - $19/month**
- 50 generations per month
- Revo 1.0 access only
- Basic templates
- Email support
- Credits reset monthly

#### 🥈 **Business Plan - $49/month** 
- 200 generations per month
- Revo 1.5 + cultural intelligence
- Logo integration
- Priority support
- Advanced analytics
- Credits reset monthly

#### 🥇 **Agency Plan - $99/month**
- 500 generations per month
- All Revo models (1.0, 1.5, 2.0)
- White-label options
- API access
- Dedicated support
- Credits reset monthly

### Implementation Steps

#### 1. Database Schema Changes
```sql
-- Add subscription tables
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  used_credits INTEGER DEFAULT 0,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migrate existing users
INSERT INTO subscriptions (user_id, plan_type, status, monthly_credits, used_credits)
SELECT id, 'starter', 'active', 50, 0 FROM users;
```

#### 2. Stripe Integration
```typescript
// Monthly subscription products
const STRIPE_PLANS = {
  starter: 'price_starter_monthly',
  business: 'price_business_monthly', 
  agency: 'price_agency_monthly'
};
```

#### 3. Credit System Overhaul
```typescript
interface MonthlyUsage {
  planCredits: number;
  usedCredits: number;
  remainingCredits: number;
  resetDate: Date;
  overage: number;
}
```

### Migration Strategy

#### For Existing Users:
1. **Grandfather existing credits** - Honor current credit balances
2. **Offer upgrade incentive** - "Get 3 months free when you upgrade"
3. **Gradual transition** - 60-day notice period

#### Revenue Projections:
- **100 Starter users**: $1,900/month
- **50 Business users**: $2,450/month  
- **10 Agency users**: $990/month
- **Total MRR**: $5,340/month vs current one-time purchases

### Additional Revenue Streams

#### 1. Overage Charges
- $0.50 per generation over monthly limit
- Auto-purchase 20-credit packs for $10

#### 2. Premium Features
- **Logo library**: $9/month add-on
- **Advanced analytics**: $19/month add-on
- **API access**: $29/month add-on

#### 3. Enterprise Sales
- Custom pricing for 1000+ generations
- White-label licensing
- On-premise deployment

### Implementation Timeline

#### Week 1-2: Backend Changes
- [ ] Update database schema
- [ ] Implement subscription logic
- [ ] Create credit reset system

#### Week 3-4: Stripe Integration  
- [ ] Set up subscription products
- [ ] Implement billing webhooks
- [ ] Create upgrade/downgrade flows

#### Week 5-6: Frontend Updates
- [ ] New pricing page
- [ ] Subscription management
- [ ] Usage dashboards

#### Week 7-8: Migration
- [ ] Notify existing users
- [ ] Implement grandfather period
- [ ] Launch new pricing

### Success Metrics
- **MRR Growth**: Target $10k MRR in 6 months
- **Churn Rate**: Keep below 5% monthly
- **Upgrade Rate**: 20% of starter users upgrade within 3 months
- **LTV**: Increase from $50 (one-time) to $300+ (annual)