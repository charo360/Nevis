# Quick Twitter Integration Testing Guide

## ✅ **Setup Complete!**

Your Twitter integration is now configured to work in **both development and production**.

---

## 🚀 **How to Test (Development)**

### **Step 1: Verify Environment Variables**

Make sure your `.env.local` file has:

```bash
TWITTER_CLIENT_ID=bUwxbjBHMFFlSms5aFVfZ2s1SU06MTpjaQ
TWITTER_CLIENT_SECRET=your_client_secret_here

# Optional (leave as localhost for development)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### **Step 2: Start Development Server**

```bash
npm run dev
```

Server starts at: `http://localhost:3001`

### **Step 3: Test the Connection**

1. **Navigate to**: `http://localhost:3001/social-connect`

2. **Click**: "Connect Twitter / X" button

3. **You should**:
   - Stay on localhost (not redirect to crevo.app)
   - See Twitter's authorization page
   - Be able to authorize the app
   - Get redirected back to `http://localhost:3001/social-connect`
   - See success message and connected status

---

## 🔍 **What Was Fixed?**

### **Before:**
- Development always used production URL (`https://crevo.app`)
- OAuth callback redirected to live site
- Couldn't test locally

### **After:**
- Development uses `http://localhost:3001`
- Production uses `https://crevo.app`
- Automatically detects environment based on `NEXT_PUBLIC_APP_URL`

---

## 🎯 **Expected Behavior**

### **In Development (`localhost:3001`)**
- OAuth starts from: `http://localhost:3001`
- Twitter redirects to: `http://localhost:3001/api/social/oauth/twitter/callback`
- Success redirects to: `http://localhost:3001/social-connect`

### **In Production (`crevo.app`)**
- OAuth starts from: `https://crevo.app`
- Twitter redirects to: `https://crevo.app/api/social/oauth/twitter/callback`
- Success redirects to: `https://crevo.app/social-connect`

---

## 🐛 **Troubleshooting**

### **Issue**: Still redirecting to production
**Solution**:
1. Restart your development server
2. Clear browser cache
3. Check `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3001`

### **Issue**: "Invalid callback URL"
**Solution**:
- Verify both URLs are in Twitter Developer Portal:
  - ✅ `https://crevo.app/api/social/oauth/twitter/callback`
  - ✅ `http://localhost:3001/api/social/oauth/twitter/callback`

### **Issue**: "Unauthorized"
**Solution**:
- Double-check `TWITTER_CLIENT_SECRET` is correct
- Reveal the secret in Twitter Developer Portal and copy it again

---

## 📝 **Testing Checklist**

- [ ] Development server running on `localhost:3001`
- [ ] Navigate to `/social-connect`
- [ ] Click "Connect Twitter / X"
- [ ] URL stays on localhost (not crevo.app)
- [ ] Twitter authorization page loads
- [ ] Authorize the app
- [ ] Redirected back to localhost
- [ ] Success message appears
- [ ] Twitter account shows as connected
- [ ] Username displays correctly
- [ ] Can disconnect and reconnect

---

## 🎉 **Ready to Test!**

Everything is set up. Just:
1. Run `npm run dev`
2. Go to `http://localhost:3001/social-connect`
3. Click "Connect Twitter / X"
4. Enjoy! 🚀

---

**Need Help?** Check `TWITTER_INTEGRATION_GUIDE.md` for detailed documentation.


