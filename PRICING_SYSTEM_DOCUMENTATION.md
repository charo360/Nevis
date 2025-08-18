# Crevo AI Pricing System Documentation

## Overview

The Crevo AI pricing system implements a **credit-based model** with variable costs depending on the AI model (Revo version) used. This documentation covers the complete pricing architecture, components, and integration guide.

## Credit System Architecture

### Credit Cost Structure
- **Revo 1.0**: 1 credit per generation (Basic AI)
- **Revo 1.5**: 1.5 credits per generation (Enhanced AI)
- **Revo 2.0**: 2 credits per generation (Premium AI)

### Key Principles
- ✅ **Credits never expire**
- ✅ **No monthly subscriptions**
- ✅ **One-time purchases**
- ✅ **Variable costs based on AI quality**
- ✅ **Real-time credit validation**

## Pricing Plans

### 1. Free Plan
- **Price**: $0
- **Credits**: 10 (one-time)
- **Features**: Basic AI generation, manual approval, limited support

### 2. Starter Pack
- **Price**: $10
- **Credits**: 50
- **Cost per credit**: $0.20
- **Features**: HD generation, basic templates, email support

### 3. Growth Pack (Most Popular)
- **Price**: $29
- **Credits**: 150
- **Cost per credit**: $0.19
- **Bonus**: Priority generation speed

### 4. Pro Pack
- **Price**: $49
- **Credits**: 250
- **Cost per credit**: $0.196
- **Bonus**: Early access to new features

### 5. Power Users Pack
- **Price**: $99
- **Credits**: 550
- **Cost per credit**: $0.18
- **Bonus**: Dedicated support, custom styles

## File Structure

```
src/
├── lib/
│   └── pricing-data.ts              # Centralized pricing configuration
├── app/
│   ├── pricing/
│   │   └── page.tsx                 # Main pricing page
│   ├── payment/
│   │   ├── checkout/page.tsx        # Checkout flow
│   │   └── success/page.tsx         # Success page
│   └── actions/
│       └── pricing-actions.ts       # Server actions for credit management
├── components/
│   ├── pricing/
│   │   ├── PricingCard.tsx          # Individual pricing plan card
│   │   ├── CreditsDisplay.tsx       # User credit balance display
│   │   ├── RevoCreditCosts.tsx      # AI model cost breakdown
│   │   └── RevoGenerationWrapper.tsx # Complete generation flow handler
│   └── ui/
│       └── revo-model-selector.tsx  # Enhanced AI model selector
```

## Core Components

### 1. PricingCard Component
```tsx
<PricingCard
  id="growth"
  name="Growth Pack"
  price={29}
  credits={150}
  costPerCredit={0.19}
  popular={true}
  features={["Advanced AI", "Priority support"]}
  onSelect={handleSelect}
/>
```

### 2. CreditsDisplay Component
```tsx
<CreditsDisplay
  userId="user-123"
  showBuyButton={true}
  compact={false}
/>
```

### 3. RevoVersionSelector Component
```tsx
<RevoVersionSelector
  selectedVersion="revo-1.5"
  onVersionChange={setVersion}
  userCredits={50}
/>
```

### 4. RevoGenerationWrapper Component
```tsx
<RevoGenerationWrapper
  userId="user-123"
  onGenerate={handleGenerate}
  defaultVersion="revo-1.5"
>
  {/* Custom content */}
</RevoGenerationWrapper>
```

## Server Actions

### Credit Management Functions

#### `getUserCredits(userId: string)`
```typescript
const credits = await getUserCredits(userId);
// Returns: { totalCredits, usedCredits, remainingCredits, lastUpdated }
```

#### `deductCreditsForRevo(userId: string, revoVersion: string, generations: number)`
```typescript
const result = await deductCreditsForRevo(userId, "revo-2.0", 1);
// Returns: { success, remainingCredits, creditsCost }
```

#### `validateCreditsForRevo(userId: string, revoVersion: string)`
```typescript
const validation = await validateCreditsForRevo(userId, "revo-2.0");
// Returns: { canAfford, creditsCost, remainingCredits }
```

#### `initiatePurchase(planId: string, userId: string)`
```typescript
const result = await initiatePurchase("growth", userId);
// Returns: { success, message, checkoutUrl?, error? }
```

## Integration Guide

### 1. Adding Credit Costs to Existing Components

#### Step 1: Import Required Functions
```typescript
import {
  getUserCredits,
  validateCreditsForRevo,
  deductCreditsForRevo
} from '@/app/actions/pricing-actions';
import { revoCreditCosts } from '@/lib/pricing-data';
```

#### Step 2: Add Credit State
```typescript
const [userCredits, setUserCredits] = useState(0);

useEffect(() => {
  async function loadCredits() {
    if (userId) {
      const credits = await getUserCredits(userId);
      setUserCredits(credits.remainingCredits);
    }
  }
  loadCredits();
}, [userId]);
```

#### Step 3: Update Model Selector
```typescript
<RevoModelSelector
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  showCredits={true}
  userCredits={userCredits}
/>
```

### 2. Implementing Generation with Credit Deduction

```typescript
const handleGenerate = async () => {
  // Validate credits first
  const validation = await validateCreditsForRevo(userId, selectedModel);

  if (!validation.canAfford) {
    setError('Insufficient credits');
    return;
  }

  // Deduct credits
  const deductResult = await deductCreditsForRevo(userId, selectedModel);

  if (!deductResult.success) {
    setError('Failed to deduct credits');
    return;
  }

  // Update local credit count
  setUserCredits(deductResult.remainingCredits);

  // Proceed with generation
  await generateContent(selectedModel, prompt);
};
```

## Core Components

### 1. PricingCard Component
```tsx
<PricingCard
  id="growth"
  name="Growth Pack"
  price={29}
  credits={150}
  costPerCredit={0.19}
  popular={true}
  features={["Advanced AI", "Priority support"]}
  onSelect={handleSelect}
/>
```

### 2. CreditsDisplay Component
```tsx
<CreditsDisplay
  userId="user-123"
  showBuyButton={true}
  compact={false}
/>
```

### 3. RevoVersionSelector Component
```tsx
<RevoVersionSelector
  selectedVersion="revo-1.5"
  onVersionChange={setVersion}
  userCredits={50}
/>
```

### 4. RevoGenerationWrapper Component
```tsx
<RevoGenerationWrapper
  userId="user-123"
  onGenerate={handleGenerate}
  defaultVersion="revo-1.5"
>
  {/* Custom content */}
</RevoGenerationWrapper>
```

## Server Actions

### Credit Management Functions

#### `getUserCredits(userId: string)`
```typescript
const credits = await getUserCredits(userId);
// Returns: { totalCredits, usedCredits, remainingCredits, lastUpdated }
```

#### `deductCreditsForRevo(userId: string, revoVersion: string, generations: number)`
```typescript
const result = await deductCreditsForRevo(userId, "revo-2.0", 1);
// Returns: { success, remainingCredits, creditsCost }
```

#### `validateCreditsForRevo(userId: string, revoVersion: string)`
```typescript
const validation = await validateCreditsForRevo(userId, "revo-2.0");
// Returns: { canAfford, creditsCost, remainingCredits }
```

#### `initiatePurchase(planId: string, userId: string)`
```typescript
const result = await initiatePurchase("growth", userId);
// Returns: { success, message, checkoutUrl?, error? }
```

## Integration Guide

### 1. Adding Credit Costs to Existing Components

#### Step 1: Import Required Functions
```typescript
import { 
  getUserCredits, 
  validateCreditsForRevo, 
  deductCreditsForRevo 
} from '@/app/actions/pricing-actions';
import { revoCreditCosts } from '@/lib/pricing-data';
```

#### Step 2: Add Credit State
```typescript
const [userCredits, setUserCredits] = useState(0);

useEffect(() => {
  async function loadCredits() {
    if (userId) {
      const credits = await getUserCredits(userId);
      setUserCredits(credits.remainingCredits);
    }
  }
  loadCredits();
}, [userId]);
```

#### Step 3: Update Model Selector
```typescript
<RevoModelSelector
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  showCredits={true}
  userCredits={userCredits}
/>
```

### 2. Implementing Generation with Credit Deduction

```typescript
const handleGenerate = async () => {
  // Validate credits first
  const validation = await validateCreditsForRevo(userId, selectedModel);
  
  if (!validation.canAfford) {
    setError('Insufficient credits');
    return;
  }

  // Deduct credits
  const deductResult = await deductCreditsForRevo(userId, selectedModel);
  
  if (!deductResult.success) {
    setError('Failed to deduct credits');
    return;
  }

  // Update local credit count
  setUserCredits(deductResult.remainingCredits);

  // Proceed with generation
  await generateContent(selectedModel, prompt);
};
```

## Database Schema (Recommended)

### Users Collection
```typescript
interface User {
  uid: string;
  email: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  lastUpdated: Date;
  purchases: Purchase[];
}
```

### Purchases Collection
```typescript
interface Purchase {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  stripeSessionId?: string;
}
```

### Generations Collection
```typescript
interface Generation {
  id: string;
  userId: string;
  revoVersion: string;
  creditsCost: number;
  prompt: string;
  result: string;
  createdAt: Date;
}
```

## Payment Integration

### Stripe Integration Setup

#### 1. Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 2. Create Checkout Session
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(planId: string, userId: string) {
  const plan = getPlanById(planId);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: plan.name,
          description: `${plan.credits} credits for Crevo AI`,
        },
        unit_amount: plan.price * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: {
      userId,
      planId,
      credits: plan.credits.toString(),
    },
  });

  return session;
}
```

#### 3. Webhook Handler
```typescript
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, credits } = session.metadata!;
      
      // Add credits to user account
      await addCreditsToUser(userId, parseInt(credits));
      break;
  }
}
```

## Testing

### Unit Tests
```typescript
// Test credit calculation
describe('Credit Calculations', () => {
  test('calculates Revo 2.0 cost correctly', () => {
    const cost = calculateGenerationCost('revo-2.0', 1);
    expect(cost).toBe(2);
  });

  test('validates insufficient credits', () => {
    const canAfford = canAffordGeneration(1, 'revo-2.0', 1);
    expect(canAfford).toBe(false);
  });
});
```

### Integration Tests
```typescript
// Test complete generation flow
describe('Generation Flow', () => {
  test('deducts credits after successful generation', async () => {
    const initialCredits = await getUserCredits(userId);
    await deductCreditsForRevo(userId, 'revo-2.0', 1);
    const finalCredits = await getUserCredits(userId);
    
    expect(finalCredits.remainingCredits).toBe(
      initialCredits.remainingCredits - 2
    );
  });
});
```

## Error Handling

### Common Error Scenarios
1. **Insufficient Credits**: Show upgrade prompt
2. **Payment Failed**: Retry mechanism
3. **Generation Failed**: Refund credits
4. **Network Issues**: Graceful degradation

### Error Messages
```typescript
const ERROR_MESSAGES = {
  INSUFFICIENT_CREDITS: 'You need more credits to use this AI model',
  PAYMENT_FAILED: 'Payment processing failed. Please try again',
  GENERATION_FAILED: 'Generation failed. Credits have been refunded',
  NETWORK_ERROR: 'Connection issue. Please check your internet'
};
```

## Performance Considerations

### Optimization Strategies
1. **Credit Caching**: Cache user credits for 5 minutes
2. **Lazy Loading**: Load pricing data on demand
3. **Batch Operations**: Group credit operations
4. **Real-time Updates**: Use WebSockets for credit updates

### Monitoring
- Track credit usage patterns
- Monitor payment success rates
- Alert on unusual credit consumption
- Performance metrics for generation times

## Security

### Best Practices
1. **Server-side Validation**: Always validate credits on server
2. **Rate Limiting**: Prevent credit abuse
3. **Audit Logging**: Track all credit transactions
4. **Secure Payments**: Use Stripe's secure checkout

### Credit Protection
```typescript
// Always validate on server before generation
export async function validateAndDeductCredits(
  userId: string, 
  revoVersion: string
) {
  const userCredits = await getUserCredits(userId);
  const requiredCredits = getCreditCostForRevo(revoVersion);
  
  if (userCredits.remainingCredits < requiredCredits) {
    throw new Error('Insufficient credits');
  }
  
  return await deductCredits(userId, requiredCredits);
}
```

## Future Enhancements

### Planned Features
1. **Credit Gifting**: Allow users to gift credits
2. **Bulk Discounts**: Volume pricing for large purchases
3. **Subscription Plans**: Optional monthly plans
4. **Credit Expiry**: Optional expiry for promotional credits
5. **Referral System**: Earn credits for referrals

### API Extensions
1. **Credit History API**: Detailed usage analytics
2. **Webhook Events**: Real-time credit notifications
3. **Admin Dashboard**: Credit management interface
4. **Reporting API**: Usage and revenue reports

## Troubleshooting

### Common Issues

#### Credits Not Updating
```typescript
// Force refresh credits
const refreshCredits = async () => {
  const credits = await getUserCredits(userId);
  setUserCredits(credits.remainingCredits);
};
```

#### Payment Not Processing
1. Check Stripe webhook configuration
2. Verify environment variables
3. Check network connectivity
4. Review Stripe dashboard logs

#### Generation Failing
1. Validate credit deduction occurred
2. Check AI service availability
3. Verify user permissions
4. Review error logs

## Support

### Documentation Links
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Firebase Auth](https://firebase.google.com/docs/auth)

### Contact
For technical support or questions about the pricing system implementation, contact the development team.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
