# Nevis AI Pricing System API Reference

## Overview

This document provides a comprehensive API reference for the Nevis AI pricing system, including all server actions, database operations, and integration endpoints.

## Server Actions API

### Credit Management

#### `getUserCredits(userId: string)`

**Description**: Retrieves the current credit balance for a user.

**Parameters**:
- `userId` (string): The unique identifier for the user

**Returns**:
```typescript
interface UserCredits {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  lastUpdated: Date;
}
```

**Example**:
```typescript
const credits = await getUserCredits("user-123");
console.log(`User has ${credits.remainingCredits} credits remaining`);
```

**Error Handling**:
- Returns `{ totalCredits: 0, usedCredits: 0, remainingCredits: 0, lastUpdated: new Date() }` on error

---

#### `deductCredits(userId: string, amount: number)`

**Description**: Deducts a specified amount of credits from a user's account.

**Parameters**:
- `userId` (string): The unique identifier for the user
- `amount` (number): Number of credits to deduct (default: 1)

**Returns**:
```typescript
interface DeductResult {
  success: boolean;
  remainingCredits?: number;
}
```

**Example**:
```typescript
const result = await deductCredits("user-123", 2);
if (result.success) {
  console.log(`Credits deducted. Remaining: ${result.remainingCredits}`);
}
```

---

#### `deductCreditsForRevo(userId: string, revoVersion: string, generations: number)`

**Description**: Deducts credits based on the Revo version and number of generations.

**Parameters**:
- `userId` (string): The unique identifier for the user
- `revoVersion` (string): The Revo version ('revo-1.0', 'revo-1.5', 'revo-2.0')
- `generations` (number): Number of generations (default: 1)

**Returns**:
```typescript
interface RevoDeductResult {
  success: boolean;
  remainingCredits?: number;
  creditsCost?: number;
}
```

**Example**:
```typescript
const result = await deductCreditsForRevo("user-123", "revo-2.0", 1);
if (result.success) {
  console.log(`Deducted ${result.creditsCost} credits for Revo 2.0`);
}
```

---

#### `validateCreditsForRevo(userId: string, revoVersion: string, generations: number)`

**Description**: Validates if a user has sufficient credits for a Revo generation.

**Parameters**:
- `userId` (string): The unique identifier for the user
- `revoVersion` (string): The Revo version to validate
- `generations` (number): Number of generations (default: 1)

**Returns**:
```typescript
interface ValidationResult {
  canAfford: boolean;
  creditsCost: number;
  remainingCredits: number;
}
```

**Example**:
```typescript
const validation = await validateCreditsForRevo("user-123", "revo-2.0");
if (!validation.canAfford) {
  console.log(`Need ${validation.creditsCost} credits, have ${validation.remainingCredits}`);
}
```

---

#### `addCreditsToUser(userId: string, credits: number)`

**Description**: Adds credits to a user's account (typically after purchase).

**Parameters**:
- `userId` (string): The unique identifier for the user
- `credits` (number): Number of credits to add

**Returns**:
```typescript
interface AddCreditsResult {
  success: boolean;
  newTotal?: number;
}
```

**Example**:
```typescript
const result = await addCreditsToUser("user-123", 150);
if (result.success) {
  console.log(`Credits added. New total: ${result.newTotal}`);
}
```

### Purchase Management

#### `initiatePurchase(planId: string, userId: string)`

**Description**: Initiates a purchase flow for a pricing plan.

**Parameters**:
- `planId` (string): The ID of the pricing plan ('free', 'starter', 'growth', 'pro', 'power')
- `userId` (string): The unique identifier for the user

**Returns**:
```typescript
interface PurchaseResult {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  error?: string;
}
```

**Example**:
```typescript
const result = await initiatePurchase("growth", "user-123");
if (result.success && result.checkoutUrl) {
  window.location.href = result.checkoutUrl;
}
```

---

#### `handlePaymentSuccess(sessionId: string, planId: string, userId: string)`

**Description**: Handles successful payment webhook and adds credits to user account.

**Parameters**:
- `sessionId` (string): Stripe session ID
- `planId` (string): The purchased plan ID
- `userId` (string): The unique identifier for the user

**Returns**:
```typescript
boolean // Success status
```

**Example**:
```typescript
const success = await handlePaymentSuccess(sessionId, "growth", "user-123");
if (success) {
  console.log("Payment processed and credits added");
}
```

## Utility Functions

### Credit Calculations

#### `getCreditCostForRevo(revoVersion: string)`

**Description**: Gets the credit cost for a specific Revo version.

**Parameters**:
- `revoVersion` (string): The Revo version

**Returns**:
```typescript
number // Credit cost (1, 1.5, or 2)
```

**Example**:
```typescript
const cost = getCreditCostForRevo("revo-2.0"); // Returns 2
```

---

#### `calculateGenerationCost(revoVersion: string, generations: number)`

**Description**: Calculates total credit cost for multiple generations.

**Parameters**:
- `revoVersion` (string): The Revo version
- `generations` (number): Number of generations

**Returns**:
```typescript
number // Total credit cost
```

**Example**:
```typescript
const totalCost = calculateGenerationCost("revo-1.5", 3); // Returns 4.5
```

---

#### `canAffordGeneration(userCredits: number, revoVersion: string, generations: number)`

**Description**: Checks if user can afford a generation.

**Parameters**:
- `userCredits` (number): User's current credit balance
- `revoVersion` (string): The Revo version
- `generations` (number): Number of generations

**Returns**:
```typescript
boolean // True if user can afford the generation
```

**Example**:
```typescript
const canAfford = canAffordGeneration(5, "revo-2.0", 2); // Returns true (5 >= 4)
```

### Plan Management

#### `getPlanById(planId: string)`

**Description**: Retrieves a pricing plan by its ID.

**Parameters**:
- `planId` (string): The plan ID

**Returns**:
```typescript
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  costPerCredit: number;
  icon: string;
  popular?: boolean;
  features: string[];
  bonuses?: string[];
  description: string;
  stripePriceId?: string;
}
```

**Example**:
```typescript
const plan = getPlanById("growth");
console.log(`${plan.name}: $${plan.price} for ${plan.credits} credits`);
```

---

#### `getBestValuePlan()`

**Description**: Gets the plan marked as most popular/best value.

**Returns**:
```typescript
PricingPlan // The popular plan
```

**Example**:
```typescript
const bestPlan = getBestValuePlan(); // Returns Growth Pack
```

---

#### `calculateSavings(planId: string)`

**Description**: Calculates savings compared to the base plan.

**Parameters**:
- `planId` (string): The plan ID to calculate savings for

**Returns**:
```typescript
number // Savings amount in dollars
```

**Example**:
```typescript
const savings = calculateSavings("power"); // Returns savings vs starter pack
```

## Error Codes

### Common Error Types

```typescript
enum PricingErrorCodes {
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_PLAN = 'INVALID_PLAN',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  PURCHASE_ERROR = 'PURCHASE_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CREDIT_DEDUCTION_FAILED = 'CREDIT_DEDUCTION_FAILED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_REVO_VERSION = 'INVALID_REVO_VERSION'
}
```

### Error Handling Examples

```typescript
try {
  const result = await deductCreditsForRevo(userId, revoVersion);
  if (!result.success) {
    throw new Error('CREDIT_DEDUCTION_FAILED');
  }
} catch (error) {
  switch (error.message) {
    case 'INSUFFICIENT_CREDITS':
      // Show upgrade prompt
      break;
    case 'CREDIT_DEDUCTION_FAILED':
      // Show retry option
      break;
    default:
      // Show generic error
      break;
  }
}
```

## Rate Limiting

### Credit Operations
- **getUserCredits**: 100 requests per minute per user
- **deductCredits**: 10 requests per minute per user
- **validateCredits**: 200 requests per minute per user

### Purchase Operations
- **initiatePurchase**: 5 requests per minute per user
- **handlePaymentSuccess**: No limit (webhook)

## Webhooks

### Stripe Webhook Events

#### `checkout.session.completed`
```typescript
interface CheckoutSessionCompleted {
  type: 'checkout.session.completed';
  data: {
    object: {
      id: string;
      metadata: {
        userId: string;
        planId: string;
        credits: string;
      };
    };
  };
}
```

#### `payment_intent.succeeded`
```typescript
interface PaymentIntentSucceeded {
  type: 'payment_intent.succeeded';
  data: {
    object: {
      id: string;
      amount: number;
      metadata: {
        userId: string;
        planId: string;
      };
    };
  };
}
```

## Testing

### Mock Functions

```typescript
// Mock credit functions for testing
export const mockPricingActions = {
  getUserCredits: jest.fn().mockResolvedValue({
    totalCredits: 100,
    usedCredits: 20,
    remainingCredits: 80,
    lastUpdated: new Date()
  }),
  
  deductCreditsForRevo: jest.fn().mockResolvedValue({
    success: true,
    remainingCredits: 78,
    creditsCost: 2
  }),
  
  validateCreditsForRevo: jest.fn().mockResolvedValue({
    canAfford: true,
    creditsCost: 2,
    remainingCredits: 80
  })
};
```

### Test Examples

```typescript
describe('Credit System', () => {
  test('should deduct correct credits for Revo 2.0', async () => {
    const result = await deductCreditsForRevo('user-123', 'revo-2.0', 1);
    expect(result.creditsCost).toBe(2);
    expect(result.success).toBe(true);
  });

  test('should prevent generation with insufficient credits', async () => {
    const validation = await validateCreditsForRevo('user-123', 'revo-2.0', 5);
    expect(validation.canAfford).toBe(false);
  });
});
```

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
