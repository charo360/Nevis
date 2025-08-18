# Crevo AI Pricing System Deployment Guide

## Overview

This guide covers the complete deployment process for the Crevo AI pricing system, including environment setup, database configuration, payment integration, and production deployment.

## Prerequisites

### Required Services
- ✅ **Firebase Project** (Authentication & Firestore)
- ✅ **Stripe Account** (Payment processing)
- ✅ **Vercel/Netlify** (Hosting platform)
- ✅ **Domain Name** (For production)

### Development Tools
- Node.js 18+ 
- npm/yarn/pnpm
- Git
- Firebase CLI
- Stripe CLI (for webhook testing)

## Environment Setup

### 1. Environment Variables

Create `.env.local` file in project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PROJECT_ID=your_project_id

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Use sk_live_ for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Use pk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URLs
NEXT_PUBLIC_URL=http://localhost:3000 # Your domain for production
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Optional: Analytics & Monitoring
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=https://...
```

### 2. Firebase Setup

#### Firestore Database Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own purchases
    match /purchases/{purchaseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Users can read/write their own generations
    match /generations/{generationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Public read access to pricing plans
    match /pricing-plans/{planId} {
      allow read: if true;
      allow write: if false; // Only admin can modify
    }
  }
}
```

#### Firestore Indexes
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "purchases",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "generations",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 3. Database Schema Implementation

#### User Document Structure
```typescript
// /users/{userId}
interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  createdAt: Date;
  lastUpdated: Date;
  subscription?: {
    planId: string;
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Date;
  };
}
```

#### Purchase Document Structure
```typescript
// /purchases/{purchaseId}
interface PurchaseDocument {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'free';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}
```

#### Generation Document Structure
```typescript
// /generations/{generationId}
interface GenerationDocument {
  id: string;
  userId: string;
  revoVersion: string;
  creditsCost: number;
  prompt: string;
  result?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    aspectRatio?: string;
    style?: string;
    brandProfile?: string;
  };
}
```

## Stripe Integration

### 1. Stripe Dashboard Setup

#### Create Products and Prices
```bash
# Using Stripe CLI
stripe products create --name "Starter Pack" --description "50 credits for Crevo AI"
stripe prices create --product prod_xxx --unit-amount 1000 --currency usd

stripe products create --name "Growth Pack" --description "150 credits for Crevo AI"
stripe prices create --product prod_xxx --unit-amount 2900 --currency usd

stripe products create --name "Pro Pack" --description "250 credits for Crevo AI"
stripe prices create --product prod_xxx --unit-amount 4900 --currency usd

stripe products create --name "Power Users Pack" --description "550 credits for Crevo AI"
stripe prices create --product prod_xxx --unit-amount 9900 --currency usd
```

#### Configure Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded` (for subscriptions)

### 2. Webhook Implementation

Create `/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addCreditsToUser } from '@/app/actions/pricing-actions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, planId, credits } = session.metadata!;
      
      // Add credits to user account
      await addCreditsToUser(userId, parseInt(credits));
      
      // Log purchase
      await logPurchase({
        userId,
        planId,
        amount: session.amount_total! / 100,
        credits: parseInt(credits),
        stripeSessionId: session.id,
        status: 'completed'
      });
      
      break;

    case 'payment_intent.payment_failed':
      // Handle failed payment
      console.error('Payment failed:', event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

## Database Integration

### 1. Firebase Admin Setup

Create `lib/firebase-admin.ts`:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore();
```

### 2. Update Pricing Actions with Database

Update `src/app/actions/pricing-actions.ts`:

```typescript
import { adminDb } from '@/lib/firebase-admin';

export async function getUserCredits(userId: string): Promise<UserCredits> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create new user with free credits
      const newUser = {
        uid: userId,
        totalCredits: 10,
        usedCredits: 0,
        remainingCredits: 10,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      await adminDb.collection('users').doc(userId).set(newUser);
      return newUser;
    }
    
    const userData = userDoc.data()!;
    return {
      totalCredits: userData.totalCredits || 0,
      usedCredits: userData.usedCredits || 0,
      remainingCredits: userData.remainingCredits || 0,
      lastUpdated: userData.lastUpdated?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Get user credits error:', error);
    throw error;
  }
}

export async function deductCredits(userId: string, amount: number): Promise<{ success: boolean; remainingCredits?: number }> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    
    return await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data()!;
      const currentCredits = userData.remainingCredits || 0;
      
      if (currentCredits < amount) {
        return { success: false };
      }
      
      const newRemaining = currentCredits - amount;
      const newUsed = (userData.usedCredits || 0) + amount;
      
      transaction.update(userRef, {
        usedCredits: newUsed,
        remainingCredits: newRemaining,
        lastUpdated: new Date()
      });
      
      return {
        success: true,
        remainingCredits: newRemaining
      };
    });
  } catch (error) {
    console.error('Deduct credits error:', error);
    return { success: false };
  }
}
```

## Deployment Steps

### 1. Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Firebase project setup complete
- [ ] Stripe products and webhooks configured
- [ ] Database rules and indexes deployed
- [ ] SSL certificate configured
- [ ] Domain DNS configured

### 2. Vercel Deployment

#### Install Vercel CLI
```bash
npm i -g vercel
```

#### Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
# ... add all other env vars
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "functions": {
    "app/api/webhooks/stripe/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/webhooks/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### 3. Firebase Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Firebase Functions (if using)
firebase deploy --only functions
```

### 4. Post-deployment Testing

#### Test Checklist
- [ ] User registration and credit allocation
- [ ] Credit deduction on generation
- [ ] Payment flow (test mode)
- [ ] Webhook processing
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Performance metrics

#### Test Commands
```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test payment flow
curl -X POST https://yourdomain.com/api/test-payment \
  -H "Content-Type: application/json" \
  -d '{"planId": "starter", "userId": "test-user"}'
```

## Monitoring & Analytics

### 1. Error Tracking (Sentry)

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 2. Analytics (Google Analytics)

```typescript
// lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

### 3. Performance Monitoring

```typescript
// lib/monitoring.ts
export const trackPurchase = (planId: string, amount: number) => {
  // Google Analytics
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: planId,
    value: amount
  });
  
  // Custom metrics
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'purchase',
      planId,
      amount,
      timestamp: new Date().toISOString()
    })
  });
};
```

## Security Considerations

### 1. API Security
- Rate limiting on credit operations
- Input validation and sanitization
- CORS configuration
- Authentication verification

### 2. Payment Security
- Webhook signature verification
- Idempotency keys for payments
- PCI compliance (handled by Stripe)
- Secure environment variable storage

### 3. Database Security
- Firestore security rules
- User data isolation
- Audit logging
- Backup strategies

## Maintenance

### 1. Regular Tasks
- Monitor credit usage patterns
- Review payment success rates
- Update pricing plans as needed
- Monitor system performance
- Security updates

### 2. Backup Strategy
- Automated Firestore backups
- Environment variable backups
- Code repository backups
- Documentation updates

---

**Deployment Status**: Ready for Production
**Last Updated**: December 2024
**Version**: 1.0.0
