# OpenAI File Integration - Test Plan

## Overview

This document outlines the testing strategy for the OpenAI file upload and file_search integration.

## Test Environment

- **Dev Server**: http://localhost:3000
- **Branch**: `documents`
- **Commit**: `5ed62c8`

## Prerequisites

1. ✅ Dev server running on port 3000
2. ✅ OpenAI API key configured in `.env.local`
3. ✅ Supabase credentials configured
4. ✅ User account with brand profile

## Test Scenarios

### 1. Document Upload (UI Test)

**Objective**: Verify users can upload documents in Brand Profile

**Steps**:
1. Navigate to http://localhost:3000
2. Log in with test account
3. Go to Brand Profile page
4. Click on "Documents (Optional)" tab
5. Upload a test document (PDF, DOCX, or XLSX)
6. Verify document appears in uploaded list
7. Verify file metadata is displayed (name, size, type)
8. Verify processing status shows "pending"

**Expected Results**:
- ✅ Document uploads successfully
- ✅ File appears in list with correct metadata
- ✅ Status indicator shows "pending"
- ✅ No errors in browser console

**Test Files**:
- `test-pricing.pdf` - Sample pricing sheet
- `test-catalog.docx` - Sample product catalog
- `test-services.xlsx` - Sample services list

---

### 2. File Type Validation (UI Test)

**Objective**: Verify only supported file types can be uploaded

**Steps**:
1. Try uploading supported file types:
   - PDF (`.pdf`)
   - Word (`.docx`, `.doc`)
   - Excel (`.xlsx`, `.xls`)
   - PowerPoint (`.pptx`, `.ppt`)
   - CSV (`.csv`)
   - Text (`.txt`)
2. Try uploading unsupported file types:
   - Images (`.jpg`, `.png`, `.webp`)
   - Videos (`.mp4`)
   - Archives (`.zip`)

**Expected Results**:
- ✅ Supported files upload successfully
- ✅ Unsupported files show error message
- ✅ Error message explains which types are supported

---

### 3. File Size Validation (UI Test)

**Objective**: Verify file size limits are enforced

**Steps**:
1. Try uploading file under 50MB (Supabase limit)
2. Try uploading file over 50MB

**Expected Results**:
- ✅ Files under 50MB upload successfully
- ✅ Files over 50MB show error message
- ✅ Error message shows size limit

---

### 4. OpenAI File Upload (Backend Test)

**Objective**: Verify files are uploaded to OpenAI when generating content

**Steps**:
1. Upload a PDF pricing sheet in Brand Profile Documents tab
2. Go to Creative Studio
3. Generate content for a post
4. Check browser console for logs
5. Check server logs for OpenAI file upload

**Expected Logs**:
```
📄 [Assistant Manager] Found 1 documents to upload
📥 [OpenAI File Service] Downloading file from: https://...
📤 [OpenAI File Service] Uploading file to OpenAI: pricing.pdf (245KB)
✅ [OpenAI File Service] File uploaded successfully: file-abc123
📚 [Assistant Manager] Created vector store: vs-xyz789
🔍 [Assistant Manager] Enabled file_search tool for document analysis
```

**Expected Results**:
- ✅ File downloads from Supabase
- ✅ File uploads to OpenAI
- ✅ Vector store created
- ✅ file_search tool enabled
- ✅ No errors during upload

---

### 5. Content Generation with Documents (Integration Test)

**Objective**: Verify generated content uses data from uploaded documents

**Test Case 1: Pricing Sheet**

**Setup**:
1. Create PDF with pricing:
   ```
   Basic Plan: $29/month
   Pro Plan: $99/month
   Enterprise: Custom pricing
   ```
2. Upload to Brand Profile Documents tab
3. Generate content in Creative Studio

**Expected Results**:
- ✅ Generated content mentions actual prices ($29, $99)
- ✅ No hallucinated prices
- ✅ Pricing matches document exactly

**Test Case 2: Product Catalog**

**Setup**:
1. Create DOCX with products:
   ```
   Product A: Advanced analytics dashboard
   Product B: Real-time reporting
   Product C: Custom integrations
   ```
2. Upload to Brand Profile Documents tab
3. Generate content in Creative Studio

**Expected Results**:
- ✅ Generated content mentions actual products
- ✅ Product names match document
- ✅ No invented products

**Test Case 3: Service Brochure**

**Setup**:
1. Create PDF with services:
   ```
   Service 1: Website Design - $5,000
   Service 2: SEO Optimization - $2,000/month
   Service 3: Content Marketing - $3,000/month
   ```
2. Upload to Brand Profile Documents tab
3. Generate content in Creative Studio

**Expected Results**:
- ✅ Generated content mentions actual services
- ✅ Service prices match document
- ✅ No hallucinated services or prices

---

### 6. Resource Cleanup (Backend Test)

**Objective**: Verify OpenAI resources are cleaned up after generation

**Steps**:
1. Generate content with documents
2. Check logs for cleanup messages
3. Verify no resource leaks

**Expected Logs**:
```
✅ [Assistant Manager] Generation successful in 8500ms
🗑️  [Assistant Manager] Deleted thread: thread-def456
🗑️  [Assistant Manager] Deleted vector store: vs-xyz789
🗑️  [Assistant Manager] Deleted 1 uploaded files
```

**Expected Results**:
- ✅ Thread deleted
- ✅ Vector store deleted
- ✅ Files deleted
- ✅ No orphaned resources in OpenAI

---

### 7. Error Handling - Upload Failure (Backend Test)

**Objective**: Verify graceful fallback when file upload fails

**Steps**:
1. Temporarily break OpenAI API key
2. Try generating content with documents
3. Check logs and results

**Expected Logs**:
```
⚠️  [Assistant Manager] File upload failed, continuing without files: [error]
```

**Expected Results**:
- ✅ Content generation continues
- ✅ Falls back to extracted data
- ✅ No crash or error to user
- ✅ Warning logged

---

### 8. Error Handling - Unsupported File Type (Backend Test)

**Objective**: Verify unsupported files are skipped gracefully

**Steps**:
1. Upload mix of supported (PDF) and unsupported (JPG) files
2. Generate content
3. Check logs

**Expected Logs**:
```
⚠️  [OpenAI File Service] Skipping unsupported file type: jpg
✅ [OpenAI File Service] File uploaded successfully: file-abc123
```

**Expected Results**:
- ✅ Supported files uploaded
- ✅ Unsupported files skipped
- ✅ No errors
- ✅ Content generation succeeds

---

### 9. Multiple Documents (Integration Test)

**Objective**: Verify multiple documents can be uploaded and used

**Steps**:
1. Upload 3 documents:
   - Pricing sheet (PDF)
   - Product catalog (DOCX)
   - Service brochure (XLSX)
2. Generate content
3. Verify content uses data from all documents

**Expected Results**:
- ✅ All 3 files uploaded to OpenAI
- ✅ Vector store contains all files
- ✅ Generated content references data from multiple documents
- ✅ All resources cleaned up

---

### 10. Performance Test

**Objective**: Measure impact of file upload on generation time

**Test Cases**:
1. Generate content WITHOUT documents
2. Generate content WITH 1 document (1MB PDF)
3. Generate content WITH 3 documents (total 5MB)
4. Generate content WITH 5 documents (total 10MB)

**Metrics to Track**:
- Total generation time
- File upload time
- Vector store creation time
- Assistant run time

**Expected Results**:
- ✅ File upload adds 2-5 seconds
- ✅ Vector store creation adds 1-3 seconds
- ✅ Total time increase: 3-8 seconds
- ✅ Acceptable performance impact

---

## Manual Testing Checklist

### UI Tests
- [ ] Document upload works
- [ ] File type validation works
- [ ] File size validation works
- [ ] Uploaded documents display correctly
- [ ] Delete document works
- [ ] Processing status updates

### Backend Tests
- [ ] Files upload to OpenAI
- [ ] Vector stores created
- [ ] file_search tool enabled
- [ ] Content uses document data
- [ ] Resources cleaned up
- [ ] Error handling works

### Integration Tests
- [ ] Pricing data accurate
- [ ] Product data accurate
- [ ] Service data accurate
- [ ] Multiple documents work
- [ ] No hallucination
- [ ] Performance acceptable

---

## Automated Testing (Future)

### Unit Tests
```typescript
describe('OpenAIFileService', () => {
  it('should upload file to OpenAI', async () => {
    const result = await openAIFileService.uploadFile(
      'https://example.com/test.pdf',
      'test.pdf',
      'application/pdf'
    );
    expect(result.fileId).toBeDefined();
  });

  it('should create vector store', async () => {
    const vectorStore = await openAIFileService.createVectorStore(
      ['file-123'],
      'Test Store'
    );
    expect(vectorStore.vectorStoreId).toBeDefined();
  });

  it('should reject unsupported file types', async () => {
    await expect(
      openAIFileService.uploadFile(
        'https://example.com/test.jpg',
        'test.jpg',
        'image/jpeg'
      )
    ).rejects.toThrow('Unsupported file type');
  });
});
```

### Integration Tests
```typescript
describe('Assistant Manager with Documents', () => {
  it('should generate content with documents', async () => {
    const request = {
      businessType: 'saas',
      brandProfile: {
        businessName: 'Test SaaS',
        documents: [mockDocument],
      },
      concept: mockConcept,
      imagePrompt: 'test prompt',
      platform: 'instagram',
    };

    const response = await assistantManager.generateContent(request);
    expect(response.headline).toBeDefined();
    expect(response.caption).toContain('$29'); // From document
  });
});
```

---

## Success Criteria

### Must Have
- ✅ Documents upload to OpenAI successfully
- ✅ Vector stores created and attached to threads
- ✅ file_search tool enabled
- ✅ Generated content uses document data
- ✅ Resources cleaned up after generation
- ✅ No errors in production

### Nice to Have
- ✅ Performance impact < 10 seconds
- ✅ Graceful error handling
- ✅ Detailed logging for debugging
- ✅ User feedback on processing status

---

## Known Limitations

1. **Image Files Not Supported**
   - JPG, PNG, WEBP cannot be processed by file_search
   - These files are automatically skipped
   - User should be informed in UI

2. **File Size Limits**
   - Supabase: 50MB per file
   - OpenAI: 50MB per file (our limit)
   - Large files may take longer to process

3. **Processing Time**
   - File upload adds 2-5 seconds
   - Vector store creation adds 1-3 seconds
   - Total impact: 3-8 seconds per generation

4. **Cost Considerations**
   - Files and vector stores are ephemeral
   - No long-term storage costs
   - Standard Assistant API rates apply

---

## Troubleshooting

### Issue: File upload fails
**Solution**: Check OpenAI API key, verify file type and size

### Issue: Vector store creation fails
**Solution**: Check file IDs are valid, verify OpenAI quota

### Issue: Generated content doesn't use document data
**Solution**: Verify file_search tool is enabled, check document content

### Issue: Resources not cleaned up
**Solution**: Check cleanup logic in try/catch blocks, verify OpenAI API access

---

## Next Steps

1. ✅ Complete manual testing
2. ✅ Fix any bugs found
3. ✅ Add automated tests
4. ✅ Update user documentation
5. ✅ Merge to main branch
6. ✅ Deploy to production

