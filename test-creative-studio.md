# Creative Studio Test Plan

## Test Cases

### 1. Authentication Test
- ✅ Verify user can authenticate via cookies
- ✅ Verify unauthorized users get proper error message

### 2. Model Mapping Test
- ✅ Verify Revo 1.0 → 2 credits
- ✅ Verify Revo 1.5 → 3 credits  
- ✅ Verify Revo 2.0 → 4 credits

### 3. Credit Deduction Test
- ✅ Verify credits are deducted before generation
- ✅ Verify credit usage is recorded in database
- ✅ Verify insufficient credits error handling

### 4. Generation Test
- ✅ Verify image generation works
- ✅ Verify error handling for failed generations

## How to Test

1. **Test Authentication:**
   ```bash
   curl -X POST http://localhost:3000/api/test-creative-studio-fixed \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test", "outputType": "image"}'
   ```

2. **Test with Different Models:**
   ```bash
   # Revo 1.0 (2 credits)
   curl -X POST http://localhost:3000/api/test-creative-studio-fixed \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "two people",
       "outputType": "image",
       "preferredModel": "revo-1.0-gemini-2.5-flash-image-preview"
     }'
   
   # Revo 1.5 (3 credits)
   curl -X POST http://localhost:3000/api/test-creative-studio-fixed \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "two people",
       "outputType": "image",
       "preferredModel": "revo-1.5-gemini-2.5-flash-image-preview"
     }'
   
   # Revo 2.0 (4 credits)
   curl -X POST http://localhost:3000/api/test-creative-studio-fixed \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "two people",
       "outputType": "image",
       "preferredModel": "revo-2.0-gemini-2.5-flash-image-preview"
     }'
   ```

## Expected Results

- Authentication should work with session cookies
- Credits should be deducted correctly based on model version
- Generation should work or show clear error messages
- Credit usage should be recorded in `credit_usage_history` table

