# How to Verify Documents Are Uploaded to OpenAI

## Quick Verification Methods

### Method 1: Use the Test Page (Easiest) ⭐

1. **Navigate to the test page**:
   ```
   http://localhost:3001/test-documents
   ```

2. **Click "List All Files"** to see all documents in OpenAI

3. **Verify your uploaded documents** appear in the list

4. **Click "Verify"** on any file to see detailed information

---

### Method 2: Check Browser Console Logs

1. **Open browser console** (Press F12 or right-click → Inspect → Console)

2. **Upload a document** through the brand profile wizard

3. **Look for these log messages**:
   ```
   🤖 Triggering OpenAI document processing for business type: retail
   📄 [Document Processor] Processing document: your-file.pdf
   🏢 [Document Processor] Business type: retail
   🤖 [Document Processor] Using assistant: asst_xxxxx
   📥 [Document Processor] Downloading file from: https://...
   📤 [Document Processor] Uploading to OpenAI: your-file.pdf (123.45KB)
   ✅ [Document Processor] File uploaded to OpenAI: file-xxxxxxxxxxxxx
   ✅ [Document Processor] Document processing completed successfully
   ✅ Document processed successfully: your-file.pdf
   📎 OpenAI File ID: file-xxxxxxxxxxxxx
   🤖 Assistant ID: asst_xxxxxxxxxxxxx
   ```

4. **Copy the OpenAI File ID** (starts with `file-`)

5. **Verify it** using the test page or API endpoint

---

### Method 3: Use API Endpoints Directly

#### Verify a Specific File

```bash
# Replace file-xxxxx with your actual file ID from console logs
curl "http://localhost:3001/api/documents/verify-openai?fileId=file-xxxxxxxxxxxxx"
```

**Expected Response (if file exists)**:
```json
{
  "success": true,
  "exists": true,
  "file": {
    "id": "file-xxxxxxxxxxxxx",
    "filename": "your-document.pdf",
    "purpose": "assistants",
    "bytes": 123456,
    "sizeKB": "120.56",
    "sizeMB": "0.12",
    "created_at": 1234567890,
    "createdDate": "2024-01-15T10:30:00.000Z",
    "status": "processed"
  }
}
```

#### List All Files in OpenAI

```bash
curl -X POST http://localhost:3001/api/documents/verify-openai
```

**Expected Response**:
```json
{
  "success": true,
  "count": 5,
  "files": [
    {
      "id": "file-xxxxxxxxxxxxx",
      "filename": "pricing-sheet.pdf",
      "purpose": "assistants",
      "bytes": 234567,
      "sizeKB": "229.07",
      "sizeMB": "0.22",
      "created_at": 1234567890,
      "createdDate": "2024-01-15T10:30:00.000Z",
      "status": "processed"
    },
    // ... more files
  ]
}
```

---

### Method 4: Check OpenAI Dashboard

1. **Go to OpenAI Platform**:
   - Visit: https://platform.openai.com/storage/files

2. **Login** with your OpenAI account

3. **Filter by purpose**: Select "Assistants"

4. **Look for your uploaded files**:
   - Check filenames match your uploads
   - Verify upload timestamps
   - Confirm file sizes

---

## Troubleshooting

### Issue: No logs appear in console

**Possible Causes**:
- Business type not provided during upload
- OpenAI processing is happening in background
- Console was cleared

**Solution**:
- Make sure you're uploading through the brand profile wizard (not artifacts page)
- Keep console open during upload
- Use the test page to list all files

---

### Issue: File ID appears but verification fails

**Possible Causes**:
- File upload failed after logging started
- OpenAI API error occurred
- File was deleted

**Solution**:
- Check for error messages in console after the file ID
- Look for `❌` error logs
- Try uploading again

---

### Issue: "File not found in OpenAI"

**Possible Causes**:
- Wrong file ID copied
- File upload actually failed
- File was deleted from OpenAI

**Solution**:
- Double-check the file ID (should start with `file-`)
- Upload the document again
- Check console for error messages during upload

---

### Issue: No files appear when listing

**Possible Causes**:
- No documents have been uploaded yet
- OpenAI API key not configured
- Documents uploaded without business type

**Solution**:
- Upload a document through brand profile wizard
- Make sure business type is set in brand profile
- Verify `OPENAI_API_KEY` is in `.env.local`
- Check that assistant IDs are configured

---

## What Success Looks Like

### ✅ Successful Upload Indicators

1. **Console shows**:
   - ✅ File uploaded to OpenAI: file-xxxxx
   - ✅ Document processed successfully
   - 📎 OpenAI File ID: file-xxxxx

2. **Test page shows**:
   - File appears in "List All Files"
   - Verification shows "File Found in OpenAI!"
   - File details are displayed correctly

3. **OpenAI Dashboard shows**:
   - File appears in Files list
   - Purpose is "assistants"
   - Status is "processed"

---

## Common Scenarios

### Scenario 1: First Time Upload

**Steps**:
1. Open browser console (F12)
2. Navigate to brand profile wizard
3. Go to "Business Documents" tab
4. Upload a PDF file
5. Watch console for logs
6. Copy the file ID from logs
7. Go to http://localhost:3001/test-documents
8. Paste file ID and click "Verify"

**Expected Result**: ✅ File Found in OpenAI!

---

### Scenario 2: Checking All Uploaded Documents

**Steps**:
1. Go to http://localhost:3001/test-documents
2. Click "List All Files"
3. Review the list of uploaded documents

**Expected Result**: All your uploaded documents appear in the list

---

### Scenario 3: Verifying After Multiple Uploads

**Steps**:
1. Upload 3-5 documents through brand profile
2. Go to test page
3. Click "List All Files"
4. Verify count matches number of uploads

**Expected Result**: Count shows correct number of files

---

## Environment Variables to Check

Make sure these are set in `.env.local`:

```bash
# Required
OPENAI_API_KEY=sk-...

# At least one assistant ID should be set
OPENAI_ASSISTANT_RETAIL=asst_...
OPENAI_ASSISTANT_FINANCE=asst_...
OPENAI_ASSISTANT_SERVICE=asst_...
# ... etc
```

---

## Quick Test Script

Run this in your browser console after uploading a document:

```javascript
// Get the file ID from console logs, then run:
const fileId = 'file-xxxxxxxxxxxxx'; // Replace with your file ID

fetch(`/api/documents/verify-openai?fileId=${fileId}`)
  .then(r => r.json())
  .then(data => {
    if (data.exists) {
      console.log('✅ File found in OpenAI!');
      console.log('Filename:', data.file.filename);
      console.log('Size:', data.file.sizeMB, 'MB');
      console.log('Created:', data.file.createdDate);
    } else {
      console.log('❌ File not found in OpenAI');
    }
  });
```

---

## Summary

**Easiest Method**: 
1. Go to http://localhost:3001/test-documents
2. Click "List All Files"
3. See all your uploaded documents

**Most Detailed Method**:
1. Upload document with console open
2. Copy file ID from logs
3. Verify using test page or API

**Official Method**:
- Check OpenAI Dashboard at https://platform.openai.com/storage/files

---

## Next Steps After Verification

Once you've confirmed documents are in OpenAI:

1. ✅ Documents will be available to assistants during content generation
2. ✅ Assistants can search and reference document contents
3. ✅ Generated content will be more accurate and context-aware
4. ✅ You can upload more documents to build a knowledge base

The document processing integration is working correctly! 🎉

