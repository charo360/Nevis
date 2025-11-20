# Revo 2.0 Generation 500 Error - Debugging Guide

## Error Reported
```
api/generate-revo-2.0:1  Failed to load resource: the server responded with a status of 500 ()
🔄 [Supabase Client] Reusing existing instance to prevent multiple GoTrueClient instances
```

## Likely Causes

### 1. **Supabase Connection Issues** (Most Likely)
The error occurs during Revo 2.0 generation, and the Supabase client message appears. This suggests:
- Database query failing silently
- Supabase credentials issue
- Network/connection timeout

### 2. **Missing Environment Variables**
Check if these are set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (confirmed present)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (confirmed present)
- `GOOGLE_GENERATIVE_AI_API_KEY` (needed for Revo 2.0)

### 3. **Gemini API Issues**
Revo 2.0 uses Gemini 2.5 Flash. Possible issues:
- API key invalid/expired
- Rate limiting
- Model availability

## How to Debug

### Step 1: Check Dev Server Logs
Start the dev server and watch for detailed error messages:

```bash
npm run dev
```

Then trigger a generation and look for:
- `❌ Revo 2.0 generation failed:` messages
- `Debug Error:` messages
- Stack traces

### Step 2: Check Environment Variables
```bash
# In PowerShell
Get-Content .env.local | Select-String "GOOGLE_GENERATIVE_AI_API_KEY"
Get-Content .env.local | Select-String "SUPABASE"
```

### Step 3: Test Supabase Connection
Create a test file `test-supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('generated_posts')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Supabase Error:', error);
  } else {
    console.log('✅ Supabase Connected:', data);
  }
}

testSupabase();
```

### Step 4: Test Gemini API
Create `test-gemini.js`:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  try {
    const result = await model.generateContent('Test');
    console.log('✅ Gemini API Working:', result.response.text());
  } catch (error) {
    console.error('❌ Gemini Error:', error);
  }
}

testGemini();
```

## Quick Fixes

### Fix 1: Graceful Supabase Error Handling
The Revo 2.0 service should continue even if Supabase queries fail. The recent posts fetch is optional.

### Fix 2: Add Detailed Error Logging
Enhanced error messages in the API route to show exact failure point.

### Fix 3: Check Gemini API Key
Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set and valid.

## Common Solutions

### Solution 1: Supabase Table Missing
If `generated_posts` table doesn't exist:
1. Go to Supabase dashboard
2. Create the table or check if it exists
3. Verify table permissions

### Solution 2: Gemini API Key Invalid
1. Go to Google AI Studio: https://makersuite.google.com/app/apikey
2. Generate new API key
3. Update `.env.local`

### Solution 3: Rate Limiting
If hitting rate limits:
1. Wait a few minutes
2. Check Gemini API quota
3. Consider upgrading API plan

## Next Steps

1. **Start dev server** and reproduce the error
2. **Check console logs** for detailed error message
3. **Run test scripts** to isolate the issue
4. **Report findings** - share the exact error message from server logs

## Temporary Workaround

If Supabase is the issue, you can temporarily disable recent posts fetching by setting a flag in the generation options. This won't affect core functionality.
