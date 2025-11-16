# Vertex AI Secondary Fallback Setup

## 📝 Add these lines to your `.env.local` file:

```bash
# ========================================
# VERTEX AI SECONDARY FALLBACK
# ========================================

# Vertex AI Secondary Account (Fallback when primary hits rate limits)
VERTEX_AI_SECONDARY_ENABLED=true
VERTEX_AI_SECONDARY_PROJECT_ID=eco-theater-478004-b9
VERTEX_AI_SECONDARY_LOCATION=us-central1
VERTEX_AI_SECONDARY_KEY_FILE=vertex-ai-secondary-credentials.json

# Vertex AI Fallback System Configuration
VERTEX_FALLBACK_ENABLED=true
VERTEX_RETRY_ATTEMPTS=3
VERTEX_RETRY_DELAY_MS=2000
```

## ✅ What I've Already Done:

1. ✅ Created `vertex-ai-secondary-credentials.json` with your service account
2. ✅ File is gitignored (safe from commits)

## 🎯 What You Need to Do:

1. Open your `.env.local` file
2. Add the configuration above (copy-paste from above)
3. Save the file
4. Restart your dev server: `npm run dev`

## 🔄 How It Works:

```
Primary Vertex AI (Rate Limited 429)
         ↓ Fails
Secondary Vertex AI (eco-theater-478004-b9)
         ↓ Tries again
✅ Image generation succeeds!
```

## 🚀 Result:

- When primary hits rate limit → automatically uses secondary
- Doubles your Vertex AI capacity
- No more 429 errors stopping image generation!

## 📊 Expected Logs After Setup:

```
⚠️ Primary Vertex AI failed: 429 Resource exhausted
🔄 Trying secondary Vertex AI: eco-theater-478004-b9
✅ Secondary Vertex AI succeeded!
```

## 🔧 Optional: Tertiary Account

If you have a 3rd Google Cloud project, add:

```bash
VERTEX_AI_TERTIARY_ENABLED=true
VERTEX_AI_TERTIARY_PROJECT_ID=your-third-project
VERTEX_AI_TERTIARY_LOCATION=us-central1
VERTEX_AI_TERTIARY_KEY_FILE=vertex-ai-tertiary-credentials.json
```

---

**Copy the configuration block above into your `.env.local` file now!**
