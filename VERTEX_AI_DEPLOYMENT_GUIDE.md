# 🚀 Vertex AI Dual Account - Production Deployment Guide

**Date:** 2025-11-19  
**Status:** Ready for Production Deployment

---

## ✅ What Was Changed

### Code Changes:
1. **Updated `src/lib/services/vertex-ai-client.ts`:**
   - Added support for `VERTEX_AI_SECONDARY_CREDENTIALS` environment variable
   - Secondary credentials can now be loaded from env var (production) or file (local dev)
   - Maintains backward compatibility with file-based credentials

### Test Files Added (Not deployed to production):
- `src/app/api/test-vertex-both-accounts/` - Test endpoint
- `VERTEX_AI_SUCCESS.md` - Test results documentation
- `VERTEX_AI_DEPLOYMENT_GUIDE.md` - This file

---

## 🔧 Vercel Environment Variables to Add

You need to add the following environment variable to your Vercel production environment:

### **VERTEX_AI_SECONDARY_CREDENTIALS**

**How to get the value:**

1. Open the file `vertex-ai-secondary-credentials.json` on your local machine
2. Copy the ENTIRE contents
3. Remove all line breaks to make it a single line
4. Paste it as the value in Vercel

**Format:** The entire JSON content as a single-line string (no line breaks)

**Example format:**
```
{"type":"service_account","project_id":"nevis-474518","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"vertex-ai-app-service@nevis-474518.iam.gserviceaccount.com",...}
```

**Important:**
- Make sure it's all on ONE line with no line breaks!
- The `\n` characters inside the private_key are part of the string and should remain
- Copy from your local `vertex-ai-secondary-credentials.json` file

---

## 📋 Step-by-Step Deployment Instructions

### Step 1: Verify Existing Environment Variables

Make sure these are already set in Vercel (they should be):

```
VERTEX_AI_ENABLED=true
VERTEX_AI_PROJECT_ID=eco-theater-478004-b9
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_CREDENTIALS={...existing primary credentials...}

VERTEX_AI_SECONDARY_ENABLED=true
VERTEX_AI_SECONDARY_PROJECT_ID=nevis-474518
VERTEX_AI_SECONDARY_LOCATION=us-central1

VERTEX_FALLBACK_ENABLED=true
VERTEX_RETRY_ATTEMPTS=3
VERTEX_RETRY_DELAY_MS=2000
```

### Step 2: Add New Environment Variable

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Click "Add New"
3. Name: `VERTEX_AI_SECONDARY_CREDENTIALS`
4. Value: Paste the JSON from above (single line)
5. Environment: Select **Production**, **Preview**, and **Development**
6. Click "Save"

### Step 3: Deploy the Code

The code has been committed to the `test-vertex-api` branch and will be merged to `main`.

Vercel will automatically redeploy when:
- The environment variable is saved, OR
- The code is merged to main

### Step 4: Verify Deployment

After deployment, test the fallback system:

1. **Check logs** in Vercel dashboard for:
   ```
   ✅ [Vertex AI] Primary credentials loaded from environment variable
   ✅ [Vertex AI] Secondary credentials loaded from environment variable
   ```

2. **Test the endpoint** (optional):
   ```
   https://your-domain.vercel.app/api/test-vertex-both-accounts
   ```
   
   Should return:
   ```json
   {
     "status": "BOTH_WORKING",
     "message": "Both accounts are working and are from different Google accounts!"
   }
   ```

---

## 🔍 How It Works

### Local Development:
- Primary credentials: Loaded from `VERTEX_AI_CREDENTIALS` env var in `.env.local`
- Secondary credentials: Loaded from `vertex-ai-secondary-credentials.json` file

### Production (Vercel):
- Primary credentials: Loaded from `VERTEX_AI_CREDENTIALS` env var
- Secondary credentials: Loaded from `VERTEX_AI_SECONDARY_CREDENTIALS` env var

### Fallback Logic:
1. All requests try primary account first
2. If primary fails (quota, error, timeout), automatically tries secondary
3. If both fail, error is returned
4. Logs show which account was used

---

## ✅ Benefits

1. **Independent Quotas:**
   - Primary: `eco-theater-478004-b9` (Google account 1)
   - Secondary: `nevis-474518` (Google account 2)
   - Each has its own free tier and limits

2. **Automatic Failover:**
   - No downtime if primary hits quota
   - Seamless for end users
   - Logged for monitoring

3. **Cost Optimization:**
   - Use free tier on both accounts
   - Distribute load across accounts
   - Better quota management

---

## 🧪 Testing

### Local Testing:
```bash
# Quick check
node check-vertex-accounts.js

# Full test
node test-vertex-accounts.js

# Web test
npm run dev
# Visit: http://localhost:3001/api/test-vertex-both-accounts
```

### Production Testing:
```bash
# Test the endpoint
curl https://your-domain.vercel.app/api/test-vertex-both-accounts
```

---

## 📊 Monitoring

### Check Fallback Events:
Look for these in Vercel logs:
- `"Falling back to secondary Vertex AI account"`
- `"Secondary Vertex AI account used successfully"`
- `"Both Vertex AI accounts failed"`

### Monitor Quota:
- **Primary:** https://console.cloud.google.com/iam-admin/quotas?project=eco-theater-478004-b9
- **Secondary:** https://console.cloud.google.com/iam-admin/quotas?project=nevis-474518

---

## 🔐 Security Notes

- ✅ Credentials stored as environment variables (secure)
- ✅ Not committed to git (in `.gitignore`)
- ✅ Different Google accounts (isolation)
- ✅ Least-privilege service account roles

---

## 🆘 Troubleshooting

### "Secondary credentials not available"
- Check that `VERTEX_AI_SECONDARY_CREDENTIALS` is set in Vercel
- Verify it's valid JSON (use a JSON validator)
- Make sure there are no line breaks in the value

### "Permission denied" errors
- Verify the service account has "Vertex AI User" role
- Check that Vertex AI API is enabled in the project
- Wait 2-3 minutes for permissions to propagate

### Fallback not working
- Check that `VERTEX_FALLBACK_ENABLED=true`
- Verify both credentials are loaded (check logs)
- Test each account individually

---

## 📝 Summary

**What's Being Deployed:**
- ✅ Updated Vertex AI client with env var support for secondary credentials
- ✅ Backward compatible with existing setup
- ✅ Production-ready dual-account fallback system

**What You Need to Do:**
1. ✅ Add `VERTEX_AI_SECONDARY_CREDENTIALS` to Vercel
2. ✅ Merge code to main (automated)
3. ✅ Verify deployment (check logs)

**Result:**
- 🎉 Automatic failover between two independent Google accounts
- 🎉 No downtime if primary hits quota
- 🎉 Better cost optimization and reliability

---

**Last Updated:** 2025-11-19  
**Status:** Ready for Production Deployment

