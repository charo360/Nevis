# 🚨 PRODUCTION ENVIRONMENT VARIABLES SETUP

## Critical Environment Variables for Production

Copy these to your hosting platform's environment variables section:

### 1. **Supabase (Required)**
```
NEXT_PUBLIC_SUPABASE_URL=https://nrfceylvtiwpqsoxurrv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI5ODY3MywiZXhwIjoyMDcyODc0NjczfQ.R6x0E0YbYxOyDRCBzpHjzYxj-JuPdvuuv8JfHJhYMhM
```

### 2. **Google AI Keys (Required for Revo models)**
```
GEMINI_API_KEY=AIzaSyDwxxaDbNw8yLJ0gzvFrYwO0lL90J-eCuQ
GEMINI_API_KEY_REVO_1_0=AIzaSyCb2a9V_rvOOFPf6RPG_ZqCeSuVv81m04E
GEMINI_API_KEY_REVO_1_5=AIzaSyAvdNIzYryHC8koa0dA62F0C-p0nfQwMvU
GEMINI_API_KEY_REVO_2_0=AIzaSyBF9eiIyay6GwoVyF1JOgx2jjvLfiY2_vI
```

### 3. **OpenAI (Required for Revo 1.5 & Assistants)**
```
OPENAI_API_KEY=your-production-openai-api-key
OPENAI_FALLBACK_ENABLED=true
OPENAI_KEY_ROTATION_ENABLED=true
```

### 4. **JWT Secrets (Required)**
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

### 5. **Production URL**
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crevo.app
```

### 6. **SendGrid Email (For auth emails)**
```
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=sam@crevo.app
SENDGRID_FROM_NAME=Crevo AI
```

### 7. **Stripe Payments (If enabled)**
```
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
PAYMENTS_ENABLED=true
```

### 8. **Social Media OAuth (If using)**
```
TWITTER_CLIENT_ID=ZnVGZlNNM3RETksxNlFBb2xqM0o6MTpjaQ
TWITTER_CLIENT_SECRET=PicB4co8XNB8tTUtpUXrjhukIbRhdZMD-tIiKtq_3PYlwT1h55
TWITTER_REDIRECT_URI=https://crevo.app/api/twitter/auth/callback
```

### 9. **Vertex AI Credentials (As JSON string)**
```
VERTEX_AI_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
```

---

## How to Add to Your Platform:

### **Vercel:**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable one by one
4. Redeploy

### **Netlify:**
1. Site settings → Build & deploy → Environment
2. Add each variable
3. Trigger new deploy

### **Railway:**
1. Project → Variables
2. Add variables
3. Redeploy

---

## After Adding Variables:
1. Trigger a new deployment
2. Check deployment logs for any errors
3. Test your site

## If Still Getting 500 Error:
Check the deployment logs for specific error messages about which variable is missing.
