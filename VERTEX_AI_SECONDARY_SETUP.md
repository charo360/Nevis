# 🔧 Vertex AI Secondary Account - Permission Fix

## ❌ Current Issue
Your secondary Vertex AI account is getting a **403 Permission Denied** error:
```
Permission 'aiplatform.endpoints.predict' denied on resource
'//aiplatform.googleapis.com/projects/nevis-474518/locations/us-central1/publishers/google/models/gemini-2.5-flash-image'
```

## 🎯 What This Means
The service account in `vertex-ai-secondary-credentials.json` doesn't have permission to use Vertex AI models.

---

## ✅ How to Fix (Google Cloud Console)

### **Option 1: Grant Vertex AI User Role (Recommended)**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select project: `nevis-474518`

2. **Navigate to IAM & Admin**
   - Left menu → "IAM & Admin" → "IAM"

3. **Find Your Service Account**
   - Look for the email from your `vertex-ai-secondary-credentials.json` file
   - It looks like: `something@nevis-474518.iam.gserviceaccount.com`

4. **Add Vertex AI User Role**
   - Click the pencil icon (Edit) next to the service account
   - Click "+ ADD ANOTHER ROLE"
   - Search for: **"Vertex AI User"**
   - Select it and click "SAVE"

---

### **Option 2: Grant Specific Permissions (More Restrictive)**

If you want minimal permissions, grant these specific roles:

1. **Vertex AI User** (`roles/aiplatform.user`)
   - Allows using Vertex AI endpoints

2. **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`)
   - Allows creating access tokens

---

### **Option 3: Use Primary Account Only**

If you don't want to fix the secondary account, you can disable it:

**In `.env.local`:**
```env
# Disable secondary fallback
VERTEX_AI_SECONDARY_ENABLED=false
VERTEX_FALLBACK_ENABLED=false
```

This will make the system only use your primary Vertex AI account.

---

## 🧪 Test After Fixing

After granting permissions, test the secondary account:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Visit the test endpoint:**
   ```
   http://localhost:3001/api/test-vertex-all
   ```

3. **Check the results:**
   - Look for "Secondary Account: ✅ WORKING"
   - Check server console logs for success messages

---

## 📊 Current Configuration

**From your `.env.local`:**
```env
VERTEX_AI_SECONDARY_ENABLED=true
VERTEX_AI_SECONDARY_PROJECT_ID=nevis-474518
VERTEX_AI_SECONDARY_LOCATION=us-central1
VERTEX_AI_SECONDARY_KEY_FILE=vertex-ai-secondary-credentials.json
VERTEX_FALLBACK_ENABLED=true
```

**Status:**
- ✅ Secondary credentials file exists
- ✅ Environment variables configured
- ❌ Service account lacks permissions

---

## 🔍 How to Find Your Service Account Email

Run this command in the project directory:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('vertex-ai-secondary-credentials.json', 'utf8')).client_email)"
```

This will show you the exact service account email that needs permissions.

---

## 💡 Why You Have Two Accounts

Based on your config:
- **Primary Account**: Higher quota/credits (main production use)
- **Secondary Account** (`nevis-474518`): Fallback when primary hits quota limits

The secondary account is a smart backup strategy, but it needs the same permissions as the primary account to work.

---

## ⚠️ Important Notes

1. **Permissions take ~1 minute to propagate** after you grant them in Google Cloud Console
2. **Both accounts need the same roles** to work interchangeably
3. **The 429 error on primary** means you hit quota limits - this is normal and will reset daily
4. **The 403 error on secondary** means missing permissions - this needs to be fixed

---

## 🎯 Recommended Action

**Fix the secondary account permissions** so you have a working fallback when the primary account hits quota limits. This gives you:
- ✅ Continuous operation even when primary quota is exhausted
- ✅ Better reliability
- ✅ More total quota across both accounts
