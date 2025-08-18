# 💰 Nevis AI Pricing System

## 🎯 Overview

The Nevis AI Pricing System is a comprehensive **credit-based monetization solution** with variable costs based on AI model quality. Users purchase credits once and use them across different AI models with transparent, fair pricing.

## ✨ Key Features

### 💳 **Credit-Based Model**
- **Revo 1.0**: 1 credit per generation (Basic AI)
- **Revo 1.5**: 1.5 credits per generation (Enhanced AI)
- **Revo 2.0**: 2 credits per generation (Premium AI)

### 🎁 **Pricing Plans**
- **Free Plan**: $0 - 10 credits (one-time)
- **Starter Pack**: $10 - 50 credits ($0.20/credit)
- **Growth Pack**: $29 - 150 credits ($0.19/credit) ⭐ *Most Popular*
- **Pro Pack**: $49 - 250 credits ($0.196/credit)
- **Power Users**: $99 - 550 credits ($0.18/credit)

### 🔧 **Smart Features**
- ✅ **Credits never expire**
- ✅ **No monthly subscriptions**
- ✅ **Real-time credit validation**
- ✅ **Automatic credit deduction**
- ✅ **Visual affordability indicators**
- ✅ **Stripe payment integration**

## 📁 Documentation Suite

### 📚 **[PRICING_SYSTEM_DOCUMENTATION.md](./PRICING_SYSTEM_DOCUMENTATION.md)**
Complete system overview, architecture, and integration guide.

**Contents:**
- Credit system architecture
- Component documentation
- Integration examples
- Database schema

### 🔧 **[PRICING_API_REFERENCE.md](./PRICING_API_REFERENCE.md)**
Detailed API reference for all server actions and utilities.

**Contents:**
- Server action signatures
- Error codes and handling
- Testing utilities
- Webhook integration

### 🚀 **[PRICING_DEPLOYMENT_GUIDE.md](./PRICING_DEPLOYMENT_GUIDE.md)**
Step-by-step deployment instructions for production.

**Contents:**
- Environment setup
- Firebase configuration
- Stripe integration
- Security setup

### 🛠️ **[PRICING_TROUBLESHOOTING_GUIDE.md](./PRICING_TROUBLESHOOTING_GUIDE.md)**
Common issues, solutions, and maintenance procedures.

**Contents:**
- Common issues & fixes
- Performance optimization
- Monitoring & alerts
- Emergency procedures

## 🚀 Quick Start

### 1. **Installation**
```bash
# Clone the repository
git clone https://github.com/your-org/nevis.git
cd nevis

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 2. **Environment Setup**
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_URL=http://localhost:3000
```

### 3. **Database Setup**
```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### 4. **Run Development Server**
```bash
npm run dev
```

## 🎨 Component Usage

### **Basic Credit Display**
```tsx
import { CreditsDisplay } from '@/components/pricing/CreditsDisplay';

<CreditsDisplay
  userId="user-123"
  showBuyButton={true}
  compact={false}
/>
```

### **AI Model Selection with Credits**
```tsx
import { RevoModelSelector } from '@/components/ui/revo-model-selector';

<RevoModelSelector
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  showCredits={true}
  userCredits={userCredits}
/>
```

### **Complete Generation Flow**
```tsx
import { RevoGenerationWrapper } from '@/components/pricing/RevoGenerationWrapper';

<RevoGenerationWrapper
  userId="user-123"
  onGenerate={handleGenerate}
  defaultVersion="revo-1.5"
>
  {/* Your custom content */}
</RevoGenerationWrapper>
```

## 🔄 Integration Flow

### **1. Credit Validation**
```typescript
const validation = await validateCreditsForRevo(userId, "revo-2.0");
if (!validation.canAfford) {
  // Show upgrade prompt
  return;
}
```

### **2. Credit Deduction**
```typescript
const result = await deductCreditsForRevo(userId, "revo-2.0", 1);
if (result.success) {
  // Proceed with generation
  await generateContent();
}
```

### **3. Purchase Flow**
```typescript
const purchase = await initiatePurchase("growth", userId);
if (purchase.checkoutUrl) {
  window.location.href = purchase.checkoutUrl;
}
```

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Server Actions │    │    Database     │
│                 │    │                 │    │                 │
│ • Credit Display│◄──►│ • getUserCredits│◄──►│ • Users         │
│ • Model Selector│    │ • deductCredits │    │ • Purchases     │
│ • Purchase Flow │    │ • validateCredits│   │ • Generations   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Stripe Payment │    │   Webhooks      │    │   Monitoring    │
│                 │    │                 │    │                 │
│ • Checkout      │◄──►│ • Payment Events│◄──►│ • Error Tracking│
│ • Subscriptions │    │ • Credit Updates│    │ • Analytics     │
│ • Refunds       │    │ • Notifications │    │ • Health Checks │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Security Features

- **Server-side Validation**: All credit operations validated on server
- **Webhook Verification**: Stripe webhook signature verification
- **Rate Limiting**: Prevents credit abuse and API spam
- **Audit Logging**: Complete transaction history tracking
- **Error Recovery**: Automatic rollback on failed operations

## 📈 Performance Optimizations

- **Credit Caching**: 5-minute cache for credit balances
- **Batch Operations**: Efficient bulk credit updates
- **Optimistic Updates**: Immediate UI feedback
- **Real-time Sync**: WebSocket updates for credit changes
- **Database Indexing**: Optimized queries for fast lookups

## 🎯 Production Checklist

### **Pre-deployment**
- [ ] Environment variables configured
- [ ] Firebase project setup complete
- [ ] Stripe products and webhooks configured
- [ ] Database rules and indexes deployed
- [ ] SSL certificate configured

### **Post-deployment**
- [ ] Payment flow tested (test mode)
- [ ] Webhook processing verified
- [ ] Credit deduction working
- [ ] Error handling tested
- [ ] Performance monitoring active

## 📞 Support

### **Documentation**
- 📚 [System Documentation](./PRICING_SYSTEM_DOCUMENTATION.md)
- 🔧 [API Reference](./PRICING_API_REFERENCE.md)
- 🚀 [Deployment Guide](./PRICING_DEPLOYMENT_GUIDE.md)
- 🛠️ [Troubleshooting](./PRICING_TROUBLESHOOTING_GUIDE.md)

### **Quick Links**
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Firebase Console](https://console.firebase.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)

### **Emergency Contacts**
- **Technical Issues**: dev-team@nevis.ai
- **Payment Issues**: finance@nevis.ai
- **Security Issues**: security@nevis.ai

## 🎉 Success Metrics

### **User Experience**
- ✅ **Transparent Pricing**: Users see exact costs before generation
- ✅ **No Surprises**: Clear affordability indicators
- ✅ **Flexible Usage**: Choose AI quality based on needs/budget
- ✅ **Fair Pricing**: Pay only for what you use

### **Business Benefits**
- 💰 **Predictable Revenue**: Credit-based model with clear pricing
- 📈 **Scalable Growth**: Higher-tier models drive more revenue
- 🎯 **User Retention**: Credits never expire encourages return visits
- 📊 **Clear Analytics**: Track usage patterns and optimize pricing

---

## 🏆 **Status: Production Ready**

The Nevis AI Pricing System is fully implemented, documented, and ready for production deployment. All components are tested, secure, and optimized for scale.

**Version**: 1.0.0  
**Last Updated**: December 2024  
**License**: Proprietary

---

*Built with ❤️ by the Nevis AI Team*
