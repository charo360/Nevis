# Google Vision API Setup Instructions

## Prerequisites
1. Google Cloud account
2. Google Cloud project created
3. Vision API enabled

## Step-by-Step Setup

### 1. Enable Vision API
1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Cloud Vision API"
5. Click "Enable"

### 2. Create Service Account (Recommended) OR API Key

#### Option A: Service Account (More Secure)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in details, click "Create"
4. Click "Done" (no roles needed for Vision API)
5. Click on the service account you just created
6. Go to "Keys" tab
7. Click "Add Key" > "Create New Key"
8. Choose "JSON" format
9. Save the JSON file to your project (e.g., `google-credentials.json`)

**Add to `.env.local`:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

#### Option B: API Key (Simpler, Less Secure)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Click "Restrict Key" (recommended)
5. Under "API restrictions", select "Cloud Vision API"
6. Save

**Add to `.env.local`:**
```bash
GOOGLE_VISION_API_KEY=your_api_key_here
```

**Note:** If using API key, update `src/app/api/vision/analyze/route.ts`:
```typescript
const client = new vision.ImageAnnotatorClient({
  apiKey: process.env.GOOGLE_VISION_API_KEY,
});
```

### 3. Add Credentials to .gitignore
```
google-credentials.json
.env.local
```

### 4. Test the Integration
1. Restart your Next.js server
2. Upload an image in Creative Studio
3. Check browser console for Vision API logs
4. Verify analysis data appears

## Cost & Quotas

### Free Tier
- **1,000 requests/month FREE**
- Includes all detection types

### After Free Tier
- $1.50 per 1,000 images (all features)

### Your Estimated Usage
- ~500 images/month = **FREE** or $0.75/month

## Troubleshooting

### "API key not configured"
- Check `.env.local` has correct variable name
- Restart Next.js dev server after adding env vars

### "Quota exceeded"
- Check usage in Google Cloud Console
- Enable billing if needed
- Requests reset monthly

### "Permission denied"
- Ensure Vision API is enabled
- Check service account has Vision API access (usually automatic)

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `google-credentials.json` to `.gitignore`
   - Use environment variables

2. **Restrict API keys**
   - Limit to Vision API only
   - Add HTTP referrer restrictions

3. **Use Service Account in production**
   - More secure than API keys
   - Better access control

## Environment Variables Summary

Add ONE of these to `.env.local`:

```bash
# Option A: Service Account (recommended)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Option B: API Key (simpler)
# GOOGLE_VISION_API_KEY=your_api_key_here
```

Then restart the dev server:
```bash
npm run dev
```
