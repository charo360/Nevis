# 🔄 AI Proxy Integration Guide

## 📋 **Integration Strategy & Production Deployment**

### **Phase 1: Local Development Integration**

#### **1. Environment Configuration**
Your `.env.local` is already configured with:
```bash
# AI Proxy Server Configuration (Cost Protection)
AI_PROXY_URL=http://localhost:8000
AI_PROXY_ENABLED=true
AI_PROXY_TIMEOUT=30000
```

#### **2. Integration Pattern**
Replace direct Google AI calls with proxy calls in your Revo services:

**Before (Direct Google AI):**
```typescript
// src/ai/revo-2.0-service.ts
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

**After (Through Proxy):**
```typescript
// src/ai/revo-2.0-service.ts
import { aiProxyClient, getUserIdForProxy, shouldUseProxy } from '@/lib/services/ai-proxy-client';

if (shouldUseProxy()) {
  const result = await aiProxyClient.generateImage({
    prompt: enhancedPrompt,
    user_id: getUserIdForProxy(),
    model: 'gemini-2.5-flash-image-preview'
  });
  return result.data;
} else {
  // Fallback to direct API call
  // ... existing code
}
```

#### **3. Quick Integration Steps**

1. **Update Revo 1.0 Service:**
```typescript
// In src/ai/revo-1.0-service.ts
import { aiProxyClient, getUserIdForProxy } from '@/lib/services/ai-proxy-client';

// Replace image generation calls
const imageResult = await aiProxyClient.generateImage({
  prompt: imagePrompt,
  user_id: getUserIdForProxy(),
  model: 'gemini-2.5-flash-image-preview'
});
```

2. **Update Revo 1.5 Service:**
```typescript
// In src/ai/revo-1.5-enhanced-design.ts
import { aiProxyClient, getUserIdForProxy } from '@/lib/services/ai-proxy-client';

// Replace content generation calls
const contentResult = await aiProxyClient.generateText({
  prompt: contentPrompt,
  user_id: getUserIdForProxy(),
  model: 'gemini-2.5-flash-lite' // Use cheapest model for content
});
```

3. **Update Revo 2.0 Service:**
```typescript
// In src/ai/revo-2.0-service.ts
import { aiProxyClient, getUserIdForProxy } from '@/lib/services/ai-proxy-client';

// Replace all AI calls with proxy calls
const result = await aiProxyClient.generateImage({
  prompt: sophisticatedPrompt,
  user_id: getUserIdForProxy(),
  model: 'gemini-2.5-flash-image-preview'
});
```

### **Phase 2: Production Deployment**

#### **🚀 Production Architecture Options**

**Option A: Simple Cloud Deployment**
```
[Your Nevis App] → [AI Proxy Server] → [Google AI API]
     (Vercel)         (Railway/Render)      (Google)
```

**Option B: Container Deployment**
```
[Your Nevis App] → [AI Proxy Container] → [Google AI API]
     (Vercel)         (Docker/K8s)          (Google)
```

#### **🔧 Production Environment Variables**

**For your Nevis app (.env.production):**
```bash
# Production Proxy Configuration
AI_PROXY_URL=https://your-proxy-server.railway.app
AI_PROXY_ENABLED=true
AI_PROXY_TIMEOUT=30000
```

**For your Proxy server (.env.production):**
```bash
# Production API Keys
GOOGLE_API_KEY=your_production_key
GOOGLE_API_KEY_REVO_1_0=your_revo_1_0_key
GOOGLE_API_KEY_REVO_1_5=your_revo_1_5_key
GOOGLE_API_KEY_REVO_2_0=your_revo_2_0_key

# Production Settings
PROXY_HOST=0.0.0.0
PROXY_PORT=8000
DEFAULT_MONTHLY_QUOTA=40
MAX_REQUESTS_PER_MINUTE=10
```

#### **🐳 Docker Deployment (Recommended)**

Your proxy server already includes:
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Easy deployment
- `requirements.txt` - Python dependencies

**Deploy to Railway/Render:**
1. Push your Proxy branch to GitHub
2. Connect Railway/Render to your repo
3. Deploy the `proxy-server` folder
4. Set environment variables
5. Update `AI_PROXY_URL` in your Nevis app

#### **📊 Production Monitoring**

**Health Checks:**
```typescript
// Add to your app's health check
const proxyHealth = await aiProxyClient.checkHealth();
console.log('Proxy Status:', proxyHealth.status);
```

**Cost Monitoring:**
```typescript
// Monitor user quotas
const quota = await aiProxyClient.getUserQuota(userId);
if (quota.remaining < 5) {
  // Warn user about quota limit
}
```

**Usage Analytics:**
```typescript
// Get proxy statistics
const stats = await aiProxyClient.getStats();
console.log('Total Users:', stats.total_users);
console.log('Cost per Generation:', stats.cost_per_generation);
```

### **🔄 Migration Strategy**

#### **Step 1: Gradual Rollout**
```typescript
// Feature flag approach
const USE_PROXY_PERCENTAGE = 10; // Start with 10% of users

if (Math.random() * 100 < USE_PROXY_PERCENTAGE && shouldUseProxy()) {
  // Use proxy
  return await aiProxyClient.generateImage(request);
} else {
  // Use direct API (existing code)
  return await directGoogleAICall(request);
}
```

#### **Step 2: A/B Testing**
```typescript
// Test proxy vs direct for performance/cost
const userGroup = getUserGroup(userId);
if (userGroup === 'proxy' && shouldUseProxy()) {
  return await aiProxyClient.generateImage(request);
} else {
  return await directGoogleAICall(request);
}
```

#### **Step 3: Full Migration**
```typescript
// Once confident, switch to proxy-only
if (shouldUseProxy()) {
  return await aiProxyClient.generateImage(request);
} else {
  throw new Error('Proxy is required but not enabled');
}
```

### **💰 Cost Benefits in Production**

#### **Before Proxy (Risk):**
- ❌ Accidental `gemini-2.5-pro` calls: **$21.50** per 50 generations
- ❌ Unknown experimental model costs
- ❌ No usage limits or tracking
- ❌ Surprise bills from model switching

#### **After Proxy (Protected):**
- ✅ Only approved models: **$1.96** per 50 generations
- ✅ 40 requests/month per user limit
- ✅ Complete cost visibility
- ✅ **90%+ cost savings** guaranteed

### **🚨 Production Checklist**

- [ ] Proxy server deployed and accessible
- [ ] Environment variables configured
- [ ] Health checks implemented
- [ ] Monitoring/logging set up
- [ ] Quota limits configured
- [ ] Fallback strategy defined
- [ ] Cost alerts configured
- [ ] Load testing completed

### **📈 Scaling Considerations**

**For High Traffic:**
- Use Redis for quota tracking instead of in-memory
- Implement rate limiting per API key
- Add load balancing for multiple proxy instances
- Monitor API key usage across all keys

**For Multiple Environments:**
- Dev: `AI_PROXY_URL=http://localhost:8000`
- Staging: `AI_PROXY_URL=https://staging-proxy.railway.app`
- Production: `AI_PROXY_URL=https://prod-proxy.railway.app`

---

## 🎯 **Summary**

Your AI Proxy provides:
- **Complete cost control** (~$0.039 per generation)
- **Model whitelisting** (only 4 approved models)
- **User quotas** (40 requests/month)
- **Production-ready** deployment options
- **90%+ cost savings** vs uncontrolled usage

**Ready to integrate and deploy for maximum cost protection!** 🚀
