# 💳 **Credit-Based AI Proxy System**

## 🎯 **Credit System Overview**

Your system is now **credit-based** - users purchase credit packages and use them over time, not monthly subscriptions.

### **📦 Credit Packages & Pricing:**

| Package | Credits | Suggested Price | Max AI Cost | Your Profit |
|---------|---------|-----------------|-------------|-------------|
| **Free Trial** | 10 credits | $0 (Free) | $0.39 | -$0.39 (lead gen) |
| **Basic Pack** | 40 credits | $9.99 | $1.56 | **$8.43** |
| **Premium Pack** | 100 credits | $24.99 | $3.90 | **$21.09** |
| **Pro Pack** | 250 credits | $59.99 | $9.75 | **$50.24** |
| **Enterprise Pack** | 1000 credits | $199.99 | $39.00 | **$160.99** |

### **💡 How It Works:**

#### **Credit Purchase:**
```typescript
// User buys Basic Pack (40 credits for $9.99)
await aiProxyClient.purchaseCredits('user123', 'basic');
// Result: User gets 40 credits added to their balance
```

#### **Credit Usage:**
```typescript
// Each AI request costs 1 credit
await aiProxyClient.generateImage({
  prompt: "business logo",
  user_id: "user123",
  user_tier: "basic"
});
// Result: 1 credit deducted, 39 credits remaining
```

#### **Credit Balance:**
```typescript
// Check remaining credits
const credits = await aiProxyClient.getUserCredits('user123');
console.log(`${credits.credits_remaining} credits left`);
// Result: "39 credits left"
```

---

## 🔧 **Implementation Benefits**

### **✅ For Your Business:**

#### **Revenue Advantages:**
- **Upfront payment**: Users pay before using credits
- **Higher margins**: 80%+ profit on each package
- **No monthly churn**: Credits don't expire
- **Upsell opportunities**: Users buy more when they run out

#### **Cost Control:**
- **Predictable costs**: Each credit = max $0.039 AI cost
- **No overages**: Users can't spend more than their credits
- **Bulk purchasing**: Users buy larger packages for better value

### **✅ For Your Users:**

#### **Flexibility:**
- **Use anytime**: Credits don't expire monthly
- **Buy as needed**: Purchase more when running low
- **Clear value**: Know exactly what they're paying for
- **No subscriptions**: One-time purchases, no recurring billing

#### **Transparency:**
- **Real-time balance**: Always know credits remaining
- **Cost per use**: 1 credit = 1 AI generation
- **No surprises**: Can't accidentally overspend

---

## 🚀 **Integration Examples**

### **1. Credit Purchase Flow:**

```typescript
// When user clicks "Buy Credits" button
async function handleCreditPurchase(userId: string, packageTier: string) {
  try {
    // Process payment first (Stripe, PayPal, etc.)
    const payment = await processPayment(packageTier);
    
    if (payment.success) {
      // Add credits to user account
      const result = await aiProxyClient.purchaseCredits(userId, packageTier);
      
      console.log(`Added ${result.credits_added} credits`);
      console.log(`Total balance: ${result.total_credits} credits`);
      
      return {
        success: true,
        message: `Successfully added ${result.credits_added} credits!`,
        newBalance: result.total_credits
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### **2. Credit Check Before Generation:**

```typescript
// Before generating content
async function generateWithCreditCheck(prompt: string, userId: string) {
  // Check credits first
  const credits = await aiProxyClient.getUserCredits(userId);
  
  if (credits.credits_remaining <= 0) {
    return {
      success: false,
      error: "No credits remaining. Please purchase more credits.",
      showPurchaseModal: true
    };
  }
  
  if (credits.credits_remaining <= 5) {
    // Warn user about low credits
    console.warn(`Low credits: ${credits.credits_remaining} remaining`);
  }
  
  // Generate content (will deduct 1 credit)
  const result = await aiProxyClient.generateImage({
    prompt,
    user_id: userId,
    user_tier: credits.tier
  });
  
  return {
    success: true,
    data: result,
    creditsRemaining: credits.credits_remaining - 1
  };
}
```

### **3. Credit Balance Display:**

```typescript
// Show credit balance in UI
function CreditBalance({ userId }: { userId: string }) {
  const [credits, setCredits] = useState(null);
  
  useEffect(() => {
    async function fetchCredits() {
      const balance = await aiProxyClient.getUserCredits(userId);
      setCredits(balance);
    }
    fetchCredits();
  }, [userId]);
  
  if (!credits) return <div>Loading...</div>;
  
  return (
    <div className="credit-balance">
      <h3>{credits.credits_remaining} Credits</h3>
      <p>Tier: {credits.tier}</p>
      {credits.credits_remaining <= 5 && (
        <button onClick={() => showPurchaseModal()}>
          Buy More Credits
        </button>
      )}
    </div>
  );
}
```

---

## 💰 **Pricing Strategy**

### **Package Pricing Recommendations:**

#### **Free Trial (10 credits)**
- **Price**: Free
- **Purpose**: User acquisition and testing
- **Value**: Let users try before buying

#### **Basic Pack (40 credits)**
- **Price**: $9.99
- **Target**: Casual users, small businesses
- **Value**: ~1 month of regular use

#### **Premium Pack (100 credits)**
- **Price**: $24.99 (Best Value!)
- **Target**: Growing businesses
- **Value**: 2.5x credits for 2.5x price

#### **Pro Pack (250 credits)**
- **Price**: $59.99
- **Target**: Power users, agencies
- **Value**: Bulk discount for heavy usage

#### **Enterprise Pack (1000 credits)**
- **Price**: $199.99
- **Target**: Large organizations
- **Value**: Maximum bulk discount

### **Psychology of Credit Pricing:**

#### **Value Perception:**
- **"40 credits"** sounds more valuable than **"40 requests"**
- **Package deals** encourage larger purchases
- **No expiration** reduces purchase anxiety

#### **Upselling Strategy:**
- **Show savings**: "Premium Pack saves you $15!"
- **Recommend popular**: "Most Popular" badge on Premium
- **Low credit warnings**: Prompt purchase when running low

---

## 🔄 **Migration from Monthly to Credits**

### **For Existing Users:**

```typescript
// Convert existing monthly users to credits
async function migrateUserToCredits(userId: string, currentTier: string) {
  const tierToCredits = {
    'free': 10,
    'basic': 40,
    'premium': 100,
    'pro': 250,
    'enterprise': 1000
  };
  
  const credits = tierToCredits[currentTier] || 10;
  
  // Add credits to user account
  await aiProxyClient.addCredits(userId, credits, currentTier);
  
  console.log(`Migrated ${userId} to ${credits} credits (${currentTier} tier)`);
}
```

### **Database Updates:**

```sql
-- Add credits column to users table
ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_credit_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create credit transactions table
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'admin_add'
  credits_amount INTEGER NOT NULL,
  tier_package VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 **Analytics & Monitoring**

### **Key Metrics to Track:**

#### **Revenue Metrics:**
- **Average package size**: Which packages sell most?
- **Customer lifetime value**: Total credits purchased per user
- **Conversion rate**: Free trial → paid package

#### **Usage Metrics:**
- **Credit utilization**: How fast do users consume credits?
- **Popular features**: Image vs text generation usage
- **Refill patterns**: When do users buy more credits?

### **Business Intelligence:**

```typescript
// Track credit package performance
async function getCreditAnalytics() {
  const stats = await aiProxyClient.getCreditPackages();
  
  return {
    totalUsers: stats.tier_breakdown.total_users,
    revenueByPackage: {
      basic: stats.tier_breakdown.basic.users * 9.99,
      premium: stats.tier_breakdown.premium.users * 24.99,
      pro: stats.tier_breakdown.pro.users * 59.99,
      enterprise: stats.tier_breakdown.enterprise.users * 199.99
    },
    totalCreditsInCirculation: stats.total_credits_remaining
  };
}
```

---

## 🎯 **Success Factors**

### **✅ Credit System Advantages:**
- **Higher revenue per user**: Upfront payments
- **Better cash flow**: Money before service delivery
- **Reduced churn**: No monthly cancellations
- **Upsell opportunities**: Natural purchase points

### **🔧 Implementation Tips:**
- **Clear pricing**: Make credit value obvious
- **Purchase prompts**: Warn before credits run out
- **Package recommendations**: Guide users to best value
- **Usage tracking**: Show credit consumption patterns

**Your credit-based system maximizes revenue while providing users with flexible, transparent pricing!** 💳🚀
