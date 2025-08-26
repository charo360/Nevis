# Crevo AI Pricing System Troubleshooting Guide

## Common Issues & Solutions

### 1. Credits Not Updating After Purchase

#### Symptoms
- User completed payment but credits not added
- Payment successful in Stripe but user balance unchanged
- Webhook received but credits not processed

#### Diagnosis Steps
```bash
# Check Stripe webhook logs
stripe logs tail --filter-account=acct_xxx

# Check application logs
vercel logs --app=your-app-name

# Verify webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Solutions

**Solution 1: Webhook Configuration**
```typescript
// Verify webhook secret in environment
console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);

// Check webhook signature verification
const signature = req.headers.get('stripe-signature');
if (!signature) {
  console.error('Missing Stripe signature');
  return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
}
```

**Solution 2: Manual Credit Addition**
```typescript
// Emergency credit addition function
export async function emergencyAddCredits(userId: string, credits: number, reason: string) {
  try {
    const result = await addCreditsToUser(userId, credits);
    
    // Log the manual addition
    await adminDb.collection('manual-credits').add({
      userId,
      credits,
      reason,
      addedBy: 'admin',
      timestamp: new Date()
    });
    
    return result;
  } catch (error) {
    console.error('Emergency credit addition failed:', error);
    throw error;
  }
}
```

**Solution 3: Webhook Retry Mechanism**
```typescript
// Add retry logic for failed webhook processing
export async function processWebhookWithRetry(event: Stripe.Event, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processWebhookEvent(event);
      return { success: true };
    } catch (error) {
      console.error(`Webhook processing attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Log to error tracking service
        await logWebhookFailure(event, error);
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### 2. Credit Deduction Failures

#### Symptoms
- Generation starts but credits not deducted
- User has negative credit balance
- Credits deducted but generation failed

#### Diagnosis Steps
```typescript
// Check user credit balance
const credits = await getUserCredits(userId);
console.log('User credits:', credits);

// Verify credit deduction logic
const validation = await validateCreditsForRevo(userId, revoVersion);
console.log('Credit validation:', validation);

// Check transaction logs
const recentTransactions = await adminDb
  .collection('credit-transactions')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();
```

#### Solutions

**Solution 1: Transaction Integrity**
```typescript
// Ensure atomic credit deduction
export async function deductCreditsAtomic(userId: string, amount: number) {
  const userRef = adminDb.collection('users').doc(userId);
  
  return await adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const currentCredits = userDoc.data()!.remainingCredits || 0;
    
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Deduct credits
    transaction.update(userRef, {
      remainingCredits: currentCredits - amount,
      usedCredits: (userDoc.data()!.usedCredits || 0) + amount,
      lastUpdated: new Date()
    });
    
    // Log transaction
    transaction.set(adminDb.collection('credit-transactions').doc(), {
      userId,
      type: 'deduction',
      amount,
      balanceBefore: currentCredits,
      balanceAfter: currentCredits - amount,
      timestamp: new Date(),
      reason: 'generation'
    });
    
    return { success: true, remainingCredits: currentCredits - amount };
  });
}
```

**Solution 2: Credit Refund System**
```typescript
// Refund credits if generation fails
export async function refundCredits(userId: string, amount: number, reason: string) {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentCredits = userDoc.data()!.remainingCredits || 0;
      
      transaction.update(userRef, {
        remainingCredits: currentCredits + amount,
        usedCredits: Math.max(0, (userDoc.data()!.usedCredits || 0) - amount),
        lastUpdated: new Date()
      });
      
      // Log refund
      transaction.set(adminDb.collection('credit-transactions').doc(), {
        userId,
        type: 'refund',
        amount,
        reason,
        timestamp: new Date()
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Credit refund failed:', error);
    throw error;
  }
}
```

### 3. Payment Processing Issues

#### Symptoms
- Checkout session creation fails
- Payment succeeds but webhook not triggered
- Duplicate payments processed

#### Diagnosis Steps
```bash
# Check Stripe dashboard for payment status
# Verify webhook endpoint is reachable
curl -I https://yourdomain.com/api/webhooks/stripe

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Solutions

**Solution 1: Idempotency Keys**
```typescript
// Prevent duplicate payments
export async function createCheckoutSession(planId: string, userId: string) {
  const idempotencyKey = `checkout-${userId}-${planId}-${Date.now()}`;
  
  const session = await stripe.checkout.sessions.create({
    // ... session config
  }, {
    idempotencyKey
  });
  
  return session;
}
```

**Solution 2: Payment Status Verification**
```typescript
// Verify payment status before processing
export async function verifyPaymentStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed: ${session.payment_status}`);
    }
    
    return session;
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
}
```

### 4. UI/UX Issues

#### Symptoms
- Credit balance not updating in real-time
- Model selector showing incorrect affordability
- Generation button enabled when insufficient credits

#### Solutions

**Solution 1: Real-time Credit Updates**
```typescript
// Use React Query for real-time credit updates
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useUserCredits(userId: string) {
  const queryClient = useQueryClient();
  
  const { data: credits, isLoading } = useQuery({
    queryKey: ['userCredits', userId],
    queryFn: () => getUserCredits(userId),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });
  
  const updateCredits = (newCredits: number) => {
    queryClient.setQueryData(['userCredits', userId], (old: any) => ({
      ...old,
      remainingCredits: newCredits
    }));
  };
  
  return { credits, isLoading, updateCredits };
}
```

**Solution 2: Optimistic Updates**
```typescript
// Update UI immediately, rollback on error
const handleGenerate = async () => {
  const creditCost = getCreditCostForRevo(selectedModel);
  
  // Optimistic update
  setUserCredits(prev => prev - creditCost);
  
  try {
    await generateContent(selectedModel, prompt);
  } catch (error) {
    // Rollback on error
    setUserCredits(prev => prev + creditCost);
    throw error;
  }
};
```

### 5. Database Connection Issues

#### Symptoms
- Firestore operations timing out
- "Permission denied" errors
- Inconsistent data reads

#### Solutions

**Solution 1: Connection Retry Logic**
```typescript
// Add retry logic for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.warn(`Operation failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Usage
const credits = await withRetry(() => getUserCredits(userId));
```

**Solution 2: Firestore Rules Debugging**
```javascript
// Add logging to Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        debug(request.auth.uid); // Add debug logging
    }
  }
}
```

## Performance Optimization

### 1. Credit Caching Strategy

```typescript
// Implement credit caching
const creditCache = new Map<string, { credits: UserCredits; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedUserCredits(userId: string): Promise<UserCredits> {
  const cached = creditCache.get(userId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.credits;
  }
  
  const credits = await getUserCredits(userId);
  creditCache.set(userId, { credits, timestamp: Date.now() });
  
  return credits;
}
```

### 2. Batch Operations

```typescript
// Batch credit operations for better performance
export async function batchUpdateCredits(updates: Array<{
  userId: string;
  creditChange: number;
  reason: string;
}>) {
  const batch = adminDb.batch();
  
  for (const update of updates) {
    const userRef = adminDb.collection('users').doc(update.userId);
    
    // Note: This is simplified - in practice, you'd need to read first
    batch.update(userRef, {
      remainingCredits: admin.firestore.FieldValue.increment(update.creditChange),
      lastUpdated: new Date()
    });
  }
  
  await batch.commit();
}
```

## Monitoring & Alerts

### 1. Credit System Health Checks

```typescript
// Health check endpoint
export async function GET() {
  try {
    // Test database connection
    await adminDb.collection('users').limit(1).get();
    
    // Test Stripe connection
    await stripe.accounts.retrieve();
    
    // Check webhook endpoint
    const webhookTest = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/webhooks/stripe`, {
      method: 'HEAD'
    });
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        stripe: 'connected',
        webhooks: webhookTest.ok ? 'reachable' : 'unreachable'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

### 2. Alert System

```typescript
// Set up alerts for critical issues
export async function sendAlert(type: string, message: string, severity: 'low' | 'medium' | 'high') {
  const alerts = {
    webhook_failure: {
      threshold: 5, // Alert after 5 failures
      recipients: ['admin@nevis.ai']
    },
    credit_anomaly: {
      threshold: 1, // Alert immediately
      recipients: ['admin@nevis.ai', 'finance@nevis.ai']
    }
  };
  
  // Send to monitoring service (e.g., Sentry, Slack, email)
  await fetch('/api/alerts', {
    method: 'POST',
    body: JSON.stringify({ type, message, severity })
  });
}
```

## Emergency Procedures

### 1. Credit System Rollback

```typescript
// Emergency rollback procedure
export async function emergencyRollback(timestamp: Date) {
  console.log(`Starting emergency rollback to ${timestamp}`);
  
  // Get all transactions after timestamp
  const transactions = await adminDb
    .collection('credit-transactions')
    .where('timestamp', '>', timestamp)
    .get();
  
  const batch = adminDb.batch();
  
  transactions.forEach(doc => {
    const transaction = doc.data();
    const userRef = adminDb.collection('users').doc(transaction.userId);
    
    // Reverse the transaction
    if (transaction.type === 'deduction') {
      batch.update(userRef, {
        remainingCredits: admin.firestore.FieldValue.increment(transaction.amount),
        usedCredits: admin.firestore.FieldValue.increment(-transaction.amount)
      });
    } else if (transaction.type === 'addition') {
      batch.update(userRef, {
        remainingCredits: admin.firestore.FieldValue.increment(-transaction.amount),
        totalCredits: admin.firestore.FieldValue.increment(-transaction.amount)
      });
    }
  });
  
  await batch.commit();
  console.log(`Rollback completed for ${transactions.size} transactions`);
}
```

### 2. System Maintenance Mode

```typescript
// Enable maintenance mode
export async function enableMaintenanceMode(reason: string) {
  await adminDb.collection('system').doc('maintenance').set({
    enabled: true,
    reason,
    enabledAt: new Date(),
    enabledBy: 'admin'
  });
  
  // Notify users
  console.log('Maintenance mode enabled:', reason);
}

// Check maintenance mode in middleware
export function middleware(request: NextRequest) {
  // Check if maintenance mode is enabled
  // Redirect to maintenance page if needed
}
```

## Support Scripts

### 1. User Credit Audit

```bash
#!/bin/bash
# audit-user-credits.sh

USER_ID=$1
if [ -z "$USER_ID" ]; then
  echo "Usage: $0 <user_id>"
  exit 1
fi

echo "Auditing credits for user: $USER_ID"

# Get current balance
node -e "
const { getUserCredits } = require('./dist/app/actions/pricing-actions');
getUserCredits('$USER_ID').then(credits => {
  console.log('Current balance:', JSON.stringify(credits, null, 2));
});
"

# Get transaction history
node -e "
const { adminDb } = require('./dist/lib/firebase-admin');
adminDb.collection('credit-transactions')
  .where('userId', '==', '$USER_ID')
  .orderBy('timestamp', 'desc')
  .limit(20)
  .get()
  .then(snapshot => {
    console.log('Recent transactions:');
    snapshot.forEach(doc => {
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  });
"
```

### 2. System Health Report

```typescript
// Generate daily health report
export async function generateHealthReport() {
  const report = {
    timestamp: new Date(),
    metrics: {
      totalUsers: 0,
      totalCreditsIssued: 0,
      totalCreditsUsed: 0,
      totalRevenue: 0,
      activeUsers: 0
    },
    issues: []
  };
  
  // Collect metrics
  const usersSnapshot = await adminDb.collection('users').get();
  report.metrics.totalUsers = usersSnapshot.size;
  
  usersSnapshot.forEach(doc => {
    const user = doc.data();
    report.metrics.totalCreditsIssued += user.totalCredits || 0;
    report.metrics.totalCreditsUsed += user.usedCredits || 0;
    
    if (user.lastUpdated && user.lastUpdated.toDate() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      report.metrics.activeUsers++;
    }
  });
  
  // Check for issues
  if (report.metrics.totalCreditsUsed > report.metrics.totalCreditsIssued) {
    report.issues.push('Credit usage exceeds issued credits');
  }
  
  return report;
}
```

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
