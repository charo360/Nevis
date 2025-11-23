# Revo 2.0 Production Issue - Gemini 3 Pro Not Working

## Problem
Revo 2.0 works correctly on localhost (uses Gemini 3 Pro) but falls back to Gemini 2.5 in production.

## Root Cause
The Gemini API client requires `GEMINI_API_KEY` environment variable to access Gemini 3 Pro via direct API. In production, this key is likely missing, causing the system to fall back to Vertex AI (Gemini 2.5).

## How Revo 2.0 Works

### Model Hierarchy:
1. **PRIMARY**: Gemini 3 Pro via Direct Gemini API (best quality, aspect ratio control)
   - Requires: `GEMINI_API_KEY` or `GEMINI_IMAGE_EDIT_API_KEY`
   - Model: `gemini-3-pro-image-preview`

2. **FALLBACK**: Gemini 2.5 via Vertex AI (if Gemini 3 Pro fails)
   - Requires: `VERTEX_AI_ENABLED=true` + Vertex AI credentials
   - Model: `gemini-2.5-flash-image`

### Code Flow (src/ai/revo-2.0-service.ts):
```typescript
if (isGemini3Pro) {
  try {
    // PRIMARY: Try Gemini 3 Pro via direct API first
    result = await getGeminiAPIClient().generateImage(...)
  } catch (gemini3Error) {
    // FALLBACK: Use Vertex AI if Gemini 3 Pro fails
    result = await getVertexAIClient().generateImage(...)
  }
}
```

## Solution

### Add to Production Environment Variables:

```bash
# Required for Gemini 3 Pro (Revo 2.0)
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Secondary/fallback key for rate limiting
GEMINI_API_KEY_SECONDARY=your-secondary-gemini-api-key-here
```

### Where to Get the API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your production environment variables

### Deployment Platforms:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add `GEMINI_API_KEY` with your key
3. Redeploy

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add `GEMINI_API_KEY` with your key
3. Trigger new deploy

**Other platforms:**
- Add the environment variable through your platform's dashboard
- Ensure it's available at build time and runtime

## Verification

After adding the API key and redeploying, check the logs for:

✅ **Success (Gemini 3 Pro working):**
```
🎨 [Revo 2.0] PRIMARY: Using Gemini 3 Pro via direct API
✅ [Revo 2.0] Gemini 3 Pro generation successful
```

❌ **Fallback (Missing API key):**
```
⚠️ [Revo 2.0] Gemini 3 Pro failed, falling back to Vertex AI
🔄 [Revo 2.0] FALLBACK: Using Gemini 2.5 via Vertex AI
```

## Current Status

- **Localhost**: ✅ Working (has GEMINI_API_KEY in .env.local)
- **Production**: ❌ Falling back to Gemini 2.5 (missing GEMINI_API_KEY)

## Files Involved

- `src/ai/revo-2.0-service.ts` - Main service with fallback logic
- `src/lib/services/gemini-api-client.ts` - Direct Gemini API client
- `.env.local` (localhost) - Has the key
- Production environment - Missing the key

## Next Steps

1. ✅ Get Gemini API key from Google AI Studio
2. ✅ Add `GEMINI_API_KEY` to production environment
3. ✅ Redeploy
4. ✅ Test Revo 2.0 in production
5. ✅ Verify logs show "Gemini 3 Pro generation successful"
