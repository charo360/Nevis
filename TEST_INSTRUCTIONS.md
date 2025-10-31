# Creative Studio Local Testing Instructions

## ✅ Server Status
The dev server is running on **http://localhost:3001**

## 🧪 How to Test

### Method 1: Browser Console Test (Recommended)

1. **Open Creative Studio page:**
   ```
   http://localhost:3001/creative-studio
   ```

2. **Make sure you're logged in** (if not, log in first)

3. **Open Browser Console:**
   - Press `F12` or `Ctrl+Shift+J` (Windows/Linux)
   - Or `Cmd+Option+J` (Mac)

4. **Copy and paste this test script:**

```javascript
// Creative Studio Test Functions
async function testCreativeStudio() {
  console.log('🧪 Testing Creative Studio...\n');
  
  try {
    // Test with Revo 1.0 (should use 2 credits)
    console.log('📝 Testing Revo 1.0 (2 credits)...');
    const result1 = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        prompt: 'two people',
        outputType: 'image',
        preferredModel: 'revo-1.0-gemini-2.5-flash-image-preview'
      })
    });
    
    const data1 = await result1.json();
    console.log('✅ Revo 1.0 Result:', data1);
    console.log(`   Credits used: ${data1.credits?.used}, Expected: 2`);
    console.log(`   Model version: ${data1.credits?.modelVersion}\n`);
    
    // Test with Revo 1.5 (should use 3 credits)
    console.log('📝 Testing Revo 1.5 (3 credits)...');
    const result2 = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        prompt: 'two people',
        outputType: 'image',
        preferredModel: 'revo-1.5-gemini-2.5-flash-image-preview'
      })
    });
    
    const data2 = await result2.json();
    console.log('✅ Revo 1.5 Result:', data2);
    console.log(`   Credits used: ${data2.credits?.used}, Expected: 3`);
    console.log(`   Model version: ${data2.credits?.modelVersion}\n`);
    
    // Test with Revo 2.0 (should use 4 credits)
    console.log('📝 Testing Revo 2.0 (4 credits)...');
    const result3 = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        prompt: 'two people',
        outputType: 'image',
        preferredModel: 'revo-2.0-gemini-2.5-flash-image-preview'
      })
    });
    
    const data3 = await result3.json();
    console.log('✅ Revo 2.0 Result:', data3);
    console.log(`   Credits used: ${data3.credits?.used}, Expected: 4`);
    console.log(`   Model version: ${data3.credits?.modelVersion}\n`);
    
    console.log('✨ All tests completed! Check results above.');
    
    return { result1: data1, result2: data2, result3: data3 };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
}

// Quick auth test
async function testAuth() {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    const result = await fetch('/api/test-creative-studio-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt: 'test' })
    });
    
    const data = await result.json();
    
    if (data.error && data.error.includes('Unauthorized')) {
      console.log('❌ Authentication failed - Please log in first');
      return false;
    } else {
      console.log('✅ Authentication successful!');
      console.log('   User credits:', data.credits?.before?.remaining || 'N/A');
      return true;
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

console.log(`
🧪 Creative Studio Test Functions Loaded!

Available functions:
- testCreativeStudio() - Test all three models and credit deduction
- testAuth() - Quick authentication test

Run: testCreativeStudio() or testAuth()
`);
```

5. **Run the tests:**
   ```javascript
   testAuth()           // First test authentication
   testCreativeStudio() // Then test all models
   ```

### Method 2: Direct UI Test

1. Go to **http://localhost:3001/creative-studio**
2. Enter a prompt (e.g., "two people")
3. Select different models from the dropdown
4. Click generate
5. Check:
   - ✅ Image is generated
   - ✅ No "Unauthorized" error
   - ✅ Credits are deducted correctly
   - ✅ Check `/credits` page for usage history

## 📊 What to Verify

### ✅ Authentication
- Should work without "Unauthorized" errors
- User session should be read from cookies

### ✅ Model Mapping
- Revo 1.0 → 2 credits
- Revo 1.5 → 3 credits
- Revo 2.0 → 4 credits

### ✅ Credit Deduction
- Credits deducted before generation
- Usage recorded in `credit_usage_history` table
- Credits page shows correct usage

### ✅ Generation
- Images generate successfully
- Error handling works for failed generations

## 🔍 Debugging

If you see errors:

1. **"Unauthorized" error:**
   - Make sure you're logged in
   - Check browser cookies for Supabase session

2. **Wrong credit amount:**
   - Check model mapping in console logs
   - Verify `preferredModel` parameter matches model selector

3. **Generation fails:**
   - Check server logs for detailed errors
   - Verify API keys are set correctly

## 📝 Test Results Checklist

- [ ] Authentication works
- [ ] Revo 1.0 uses 2 credits
- [ ] Revo 1.5 uses 3 credits
- [ ] Revo 2.0 uses 4 credits
- [ ] Credits are deducted correctly
- [ ] Usage appears in Credits page
- [ ] Generation works for all models
- [ ] No "Unauthorized" errors

