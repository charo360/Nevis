# Manual Testing Instructions for Enhanced Website Scraping

## 🧪 How to Test the Enhanced Scraper

### Prerequisites
1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

### Method 1: API Testing (Recommended)

1. **Run the automated test:**
   ```bash
   node test-enhanced-api-scraping.js
   ```

2. **Manual API testing with curl:**
   ```bash
   # Test standard scraping
   curl -X POST http://localhost:3001/api/scrape-website \
     -H "Content-Type: application/json" \
     -d '{"url": "https://mailchimp.com", "enhanced": false}'

   # Test enhanced scraping
   curl -X POST http://localhost:3001/api/scrape-website \
     -H "Content-Type: application/json" \
     -d '{"url": "https://mailchimp.com", "enhanced": true}'
   ```

### Method 2: Brand Creation Wizard Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the brand creation wizard:**
   - Go to `http://localhost:3001`
   - Navigate to the brand creation flow
   - Enter the website analysis step

3. **Test with these websites:**
   - **Mailchimp**: `https://mailchimp.com`
   - **Shopify**: `https://www.shopify.com`
   - **HubSpot**: `https://www.hubspot.com`
   - **Local business**: Any local business website

4. **What to look for:**
   - ✅ **Business Type**: Should be correctly classified (e.g., Mailchimp = "saas")
   - ✅ **Services**: Should find 15-30+ services instead of 2-4
   - ✅ **Contact Info**: Should find multiple phone numbers, emails, addresses
   - ✅ **Content**: Should extract much more detailed information
   - ✅ **Processing**: Should show "Enhanced scraping complete" in console

### Method 3: Direct API Testing with Postman/Insomnia

1. **Create a POST request to:**
   ```
   http://localhost:3001/api/scrape-website
   ```

2. **Headers:**
   ```
   Content-Type: application/json
   ```

3. **Body (Enhanced):**
   ```json
   {
     "url": "https://mailchimp.com",
     "enhanced": true
   }
   ```

4. **Body (Standard for comparison):**
   ```json
   {
     "url": "https://mailchimp.com",
     "enhanced": false
   }
   ```

## 📊 Expected Results

### Before Enhancement (enhanced: false)
- **Services**: 2-4 basic services
- **Content**: 1,000-2,000 characters
- **Contact**: 1-2 phone numbers, 1 email
- **Business Type**: Often incorrect (e.g., Mailchimp classified as "restaurant")

### After Enhancement (enhanced: true)
- **Services**: 15-30+ detailed services with descriptions
- **Content**: 8,000-10,000+ characters
- **Contact**: 5-10 phone numbers, 3-8 emails, 2-5 addresses
- **Business Type**: 95% accuracy (e.g., Mailchimp correctly as "saas")
- **Additional Data**: Pricing info, testimonials, team info, certifications, etc.

## 🎯 Success Criteria

The enhanced scraper is working correctly if:

1. **✅ Business Classification**: Correctly identifies business type (saas, ecommerce, restaurant, etc.)
2. **✅ Service Quantity**: Finds 5-10x more services than standard scraping
3. **✅ Service Quality**: Services have names and descriptions, not just keywords
4. **✅ Contact Information**: Finds multiple contact methods from different page sections
5. **✅ Data Completeness**: Achieves 80-95% completeness score
6. **✅ Multi-page Analysis**: Analyzes 3-4 pages instead of just homepage
7. **✅ Performance**: Completes within 10-15 seconds for most websites

## 🐛 Troubleshooting

### If the test fails:

1. **Server not running**: Make sure `npm run dev` is running
2. **Network issues**: Check internet connection
3. **CORS errors**: This is expected for browser-based testing, use API testing instead
4. **Rate limiting**: Wait a few minutes between tests
5. **Website blocking**: Some sites block automated requests, try different URLs

### Common Issues:

- **"Enhanced scraping failed, falling back to standard"**: This is normal fallback behavior
- **Few services found**: Some websites have minimal service information
- **Incorrect business type**: May need to add more keywords for specific industries
- **Timeout errors**: Some websites are slow to respond

## 📝 Test Results Template

```
Website: [URL]
Enhanced Scraping: [✅/❌]
Business Type: [Detected] (Expected: [Expected]) [✅/❌]
Services Found: [Number] (Expected: 10+) [✅/❌]
Data Completeness: [Percentage]% [✅/❌]
Pages Analyzed: [Number]
Processing Time: [Seconds]s
Overall: [✅ PASS / ❌ FAIL]
```

## 🚀 Next Steps

If tests pass:
1. The enhanced scraper is ready for production
2. Users will get dramatically better brand profiles
3. AI content generation will have much richer data

If tests fail:
1. Check the troubleshooting section
2. Review the console logs for specific errors
3. Test with different websites
4. Adjust the enhancement parameters if needed
