# 🎯 **Tier-Based AI Proxy System**

## 📊 **Tier Configuration**

### **Available Tiers & Quotas:**

| Tier | Monthly Requests | Max Monthly Cost | Available Models | Use Case |
|------|------------------|------------------|------------------|----------|
| **Free** | 10 requests | $0.39 | flash-lite only | Trial users |
| **Basic** | 40 requests | $1.56 | flash-lite, flash | Small businesses |
| **Premium** | 100 requests | $3.90 | All except pro models | Growing businesses |
| **Pro** | 250 requests | $9.75 | All approved models | Power users |
| **Enterprise** | 1000 requests | $39.00 | All approved models | Large organizations |

### **Model Access by Tier:**

#### **Free Tier (10 requests/month)**
- ✅ `gemini-2.5-flash-lite` - Cheapest text generation
- ❌ Image generation models blocked
- **Perfect for**: Testing, light content generation

#### **Basic Tier (40 requests/month)**
- ✅ `gemini-2.5-flash-lite` - Cheap text generation
- ✅ `gemini-2.5-flash` - Standard text generation
- ❌ Image generation still blocked
- **Perfect for**: Text-only content creation

#### **Premium Tier (100 requests/month)**
- ✅ `gemini-2.5-flash-lite` - Cheap text generation
- ✅ `gemini-2.5-flash` - Standard text generation
- ✅ `gemini-2.5-flash-image-preview` - Image generation
- **Perfect for**: Complete content creation (text + images)

#### **Pro & Enterprise Tiers**
- ✅ All approved models
- ✅ Higher quotas for scale
- **Perfect for**: High-volume content creation

---

## 🔧 **Implementation Guide**

### **Step 1: Update Your User Database**

Add a `tier` field to your users table:

```sql
-- Add tier column to users table
ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'free';

-- Create index for performance
CREATE INDEX idx_users_tier ON users(tier);
```

### **Step 2: Integration with Your Auth System**

Update your authentication to include tier information:

```typescript
// In your auth/session logic
export function getCurrentUserTier(userId: string): string {
  // Get from your database
  const user = getUserFromDatabase(userId);
  return user.tier || 'free';
}

// Update the proxy helper function
export function getUserTierForProxy(): string {
  const user = getCurrentUser(); // Your auth function
  return user?.tier || 'free';
}
```

### **Step 3: Update Revo Services**

Modify your AI generation calls to include tier:

```typescript
// In src/ai/revo-2.0-service.ts
import { aiProxyClient, getUserIdForProxy, getUserTierForProxy } from '@/lib/services/ai-proxy-client';

export async function generateImageWithTier(prompt: string): Promise<string> {
  const userId = getUserIdForProxy();
  const userTier = getUserTierForProxy();
  
  const result = await aiProxyClient.generateImage({
    prompt,
    user_id: userId,
    user_tier: userTier, // Include tier
    model: 'gemini-2.5-flash-image-preview'
  });
  
  return result.data;
}
```

### **Step 4: Subscription Management**

Create tier upgrade/downgrade functionality:

```typescript
// Tier management API
export async function upgradeUserTier(userId: string, newTier: string) {
  // Update in your database
  await updateUserInDatabase(userId, { tier: newTier });
  
  // Update in proxy server
  await aiProxyClient.updateUserTier(userId, newTier);
  
  return { success: true, newTier };
}

// Stripe webhook handler (example)
export async function handleStripeWebhook(event: any) {
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const userId = subscription.metadata.user_id;
    
    // Map Stripe price to tier
    const tierMapping = {
      'price_basic': 'basic',
      'price_premium': 'premium',
      'price_pro': 'pro'
    };
    
    const newTier = tierMapping[subscription.items.data[0].price.id] || 'free';
    await upgradeUserTier(userId, newTier);
  }
}
```

---

## 🚀 **Testing the Tier System**

### **Test Different Tiers Locally:**

```typescript
// Set tier in localStorage for testing
localStorage.setItem('proxy_user_tier', 'premium');

// Test quota limits
const quota = await aiProxyClient.getUserQuota('test_user');
console.log(`Tier: ${quota.tier}, Limit: ${quota.monthly_limit}`);

// Test model access
try {
  await aiProxyClient.generateImage({
    prompt: 'test image',
    user_id: 'test_user',
    user_tier: 'free', // Should fail for image generation
    model: 'gemini-2.5-flash-image-preview'
  });
} catch (error) {
  console.log('Expected error for free tier:', error.message);
}
```

### **Test Tier Upgrades:**

```bash
# Test tier update endpoint
curl -X POST "http://localhost:8000/update-tier/test_user?tier=premium" \
  -H "Content-Type: application/json"

# Check updated quota
curl "http://localhost:8000/quota/test_user"
```

---

## 📊 **Monitoring & Analytics**

### **Track Tier Usage:**

```typescript
// Get tier statistics
const stats = await aiProxyClient.getTierInfo();
console.log('Tier breakdown:', stats.tier_breakdown);

// Example output:
// {
//   "free": { "users": 150, "quota_limit": 10, "max_monthly_cost": "$0.39" },
//   "basic": { "users": 45, "quota_limit": 40, "max_monthly_cost": "$1.56" },
//   "premium": { "users": 12, "quota_limit": 100, "max_monthly_cost": "$3.90" }
// }
```

### **Revenue Tracking:**

```typescript
// Calculate potential revenue
function calculateTierRevenue(tierStats: any, pricing: any) {
  let totalRevenue = 0;
  
  Object.entries(tierStats).forEach(([tier, stats]: [string, any]) => {
    const tierPrice = pricing[tier] || 0;
    totalRevenue += stats.users * tierPrice;
  });
  
  return totalRevenue;
}

const monthlyRevenue = calculateTierRevenue(stats.tier_breakdown, {
  free: 0,
  basic: 9.99,
  premium: 29.99,
  pro: 99.99,
  enterprise: 299.99
});
```

---

## 🎯 **Business Benefits**

### **Revenue Optimization:**
- **Free Tier**: Lead generation and user acquisition
- **Basic Tier**: Convert free users with text-only needs
- **Premium Tier**: Full feature access for growing businesses
- **Pro/Enterprise**: High-volume users with premium support

### **Cost Control:**
- **Predictable costs**: Each tier has maximum monthly AI cost
- **No overages**: Hard limits prevent unexpected bills
- **Scalable pricing**: Higher tiers = higher quotas = more revenue

### **User Experience:**
- **Clear value proposition**: Users know exactly what they get
- **Upgrade path**: Natural progression from free to paid
- **Fair usage**: Quotas prevent abuse while serving real needs

---

## 🔄 **Migration Strategy**

### **Phase 1: Deploy Tier System**
1. ✅ Update proxy server with tier support
2. ✅ Add tier field to user database
3. ✅ Update client code to pass tier information

### **Phase 2: Set User Tiers**
1. Assign existing users to appropriate tiers
2. Integrate with payment system (Stripe, etc.)
3. Create tier management UI

### **Phase 3: Monitor & Optimize**
1. Track tier usage and conversion rates
2. Adjust quotas based on actual usage patterns
3. Add new tiers or modify existing ones

**Your tier-based proxy system provides complete cost control while creating clear upgrade paths for revenue growth!** 🚀
