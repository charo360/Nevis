# Website Analysis Feature - Testing Guide

## Quick Test Checklist

### ✅ Pre-flight Checks

1. **Environment Variables Set?**
   ```bash
   # Check if keys are configured
   echo $OPENROUTER_API_KEY
   ```

2. **Server Running?**
   ```bash
   npm run dev
   # Should be running on http://localhost:3001
   ```

---

## 🧪 Test Scenarios

### Test 1: API Health Check
```bash
curl http://localhost:3001/api/analyze-brand
```

**Expected Response:**
```json
{
  "message": "Website Analysis API",
  "status": "ready",
  "provider": "OpenRouter (direct)",
  "models": ["anthropic/claude-3-haiku", "openai/gpt-4o-mini", "openai/gpt-3.5-turbo"]
}
```

---

### Test 2: Simple Website Analysis
```bash
curl -X POST http://localhost:3001/api/analyze-brand \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://stripe.com"
  }'
```

**Expected Response Structure:**
```json
{
  "success": true,
  "data": {
    "businessName": "Stripe",
    "description": "...",
    "businessType": "...",
    "services": "...",
    "contactInfo": { ... },
    "colorPalette": { ... }
  },
  "metadata": {
    "websiteUrl": "https://stripe.com",
    "contentLength": 12345,
    "analyzedAt": "2025-..."
  }
}
```

---

### Test 3: Test Server Action (What UI Uses)
```bash
curl -X POST http://localhost:3001/api/test-analyze-brand-action \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://openai.com",
    "designImageUris": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "businessName": "OpenAI",
    "description": "...",
    "enhancedData": {
      "products": [...],
      "uniqueSellingPropositions": [...],
      "analysisMetadata": { ... }
    }
  }
}
```

---

### Test 4: Scraping Only
```bash
curl -X POST http://localhost:3001/api/scrape-website \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "content": "...",
    "phoneNumbers": [...],
    "emailAddresses": [...],
    "socialMediaLinks": [...],
    "competitiveAdvantages": [...],
    "contentThemes": [...]
  }
}
```

---

### Test 5: Error Handling - Invalid URL
```bash
curl -X POST http://localhost:3001/api/analyze-brand \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "not-a-valid-url"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid URL format..."
}
```

---

### Test 6: Error Handling - Blocked Website
```bash
curl -X POST http://localhost:3001/api/analyze-brand \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://facebook.com"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Website blocks automated access...",
  "errorType": "blocked"
}
```

---

## 🎨 UI Testing

### Test in Brand Setup Wizard

1. **Navigate to Brand Profile Creation**
   - Go to: `http://localhost:3001/dashboard/brand-profiles`
   - Click "Create New Brand Profile"

2. **Enter Website URL**
   - Enter: `https://stripe.com`
   - Click "Analyze Website with AI"

3. **Verify Progress Indicators**
   - Should show: "🌐 Scraping website content..."
   - Then: "🤖 AI is analyzing..."
   - Then: "📊 Processing results..."

4. **Check Analysis Results**
   - Business name should be extracted
   - Description should be comprehensive
   - Services should be listed
   - Contact info should be populated
   - Colors should be extracted

5. **Edit and Save**
   - Review extracted data
   - Make any edits needed
   - Click "Save Brand Profile"

---

## 🔍 Debugging

### Check Server Logs

Look for these log messages:

```
✅ Good Signs:
🌐 Starting website analysis for: https://...
📄 Scraped content length: 12345 characters
🔄 [OpenRouter] Attempting analysis with anthropic/claude-3-haiku
✅ [OpenRouter] Analysis successful with anthropic/claude-3-haiku
✅ Website analysis completed successfully

❌ Warning Signs:
⚠️ [OpenRouter] anthropic/claude-3-haiku failed (tries next model)
❌ Website scraping failed
❌ All OpenRouter models failed
```

### Common Issues & Solutions

**Issue 1: "OpenRouter API key not found"**
```bash
# Solution: Set environment variable
export OPENROUTER_API_KEY=your_key_here
# Or add to .env.local file
```

**Issue 2: "Failed to scrape website content"**
```
Possible causes:
- Website blocks bots (403 error)
- Website doesn't exist (404 error)
- Network timeout
- Invalid URL format

Solution: Try a different website or check URL
```

**Issue 3: "AI could not extract business name"**
```
Possible causes:
- Website has very little content
- Website is mostly images/videos
- Website uses heavy JavaScript

Solution: Try enhanced analysis or manual entry
```

**Issue 4: Analysis takes too long**
```
Possible causes:
- Large website with lots of content
- OpenRouter API slow response
- Network latency

Solution: Normal for first analysis, typically completes in 10-20 seconds
```

---

## 📊 Performance Benchmarks

### Expected Timing
- **Scraping**: 2-5 seconds (simple fetch-based scraper)
- **AI Analysis**: 5-15 seconds (depends on model and content length)
- **Total**: 10-20 seconds for complete analysis

### Expected Costs
- **OpenRouter**: $0.001 - $0.01 per analysis (Claude Haiku is cheapest)
- **Scraping**: Free (no external scraping service)

---

## ✅ Success Criteria

Analysis is working correctly if:

1. ✅ API returns `success: true`
2. ✅ Business name is extracted (not "Unknown Business")
3. ✅ Description is comprehensive (>100 characters)
4. ✅ Services are listed (at least 1-2 services)
5. ✅ Contact info is populated (at least 1 field)
6. ✅ Analysis completes in <30 seconds
7. ✅ No server errors in console
8. ✅ UI displays results correctly

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Feature is production-ready
2. ✅ Can be used in brand profile creation
3. ✅ Can be deployed to production

If tests fail:
1. Check environment variables
2. Check API keys are valid
3. Check server logs for errors
4. Try different test websites
5. Verify network connectivity

---

## 📞 Support

If you encounter issues:
1. Check `WEBSITE_ANALYSIS_STATUS.md` for architecture details
2. Review server logs for error messages
3. Test with simple websites first (e.g., example.com)
4. Verify API keys are valid and have credits
5. Check network/firewall settings

---

## 🎉 Conclusion

The website analysis feature is **fully functional**. Run these tests to verify everything is working correctly in your environment!

