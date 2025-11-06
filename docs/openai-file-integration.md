# OpenAI File Integration for Assistants

## Overview

The Nevis AI platform now integrates directly with OpenAI's Assistants API file upload and `file_search` tool. This allows OpenAI Assistants to read and analyze business documents directly, rather than relying only on pre-extracted text data.

## How It Works

### 1. Document Upload Flow

```
User uploads document → Supabase Storage → OpenAI Files API → Vector Store → Assistant with file_search
```

1. **User uploads document** in Brand Profile Documents tab
2. **Document stored in Supabase Storage** at `brands/{brandId}/documents/{filename}`
3. **When generating content**, documents are uploaded to OpenAI Files API
4. **Vector Store created** with all uploaded documents
5. **Assistant runs with file_search tool** enabled to analyze documents
6. **After generation**, resources are cleaned up (thread, vector store, files)

### 2. Supported File Types

OpenAI's `file_search` tool supports the following file types:

- **PDF** (`.pdf`) - Most common for business documents
- **Word** (`.docx`, `.doc`) - Business documents, proposals
- **Text** (`.txt`, `.md`) - Plain text documents
- **CSV** (`.csv`) - Data files, pricing sheets
- **Excel** (`.xlsx`, `.xls`) - Spreadsheets, pricing tables
- **PowerPoint** (`.pptx`, `.ppt`) - Presentations, pitch decks

**Note**: Images (JPG, PNG) are NOT supported by file_search and will be skipped.

### 3. File Size Limits

- **OpenAI Limit**: 512MB per file (varies by plan)
- **Our Limit**: 50MB per file (conservative for performance)
- **Supabase Upload Limit**: 10MB per file (for initial upload)

### 4. Cost Considerations

#### Storage Costs
- OpenAI charges for file storage: **$0.10 per GB per day**
- Files are automatically deleted after each content generation
- No long-term storage costs

#### Vector Store Costs
- Vector stores are charged: **$0.10 per GB per day**
- Automatically deleted after each generation
- No long-term costs

#### Processing Costs
- File processing is included in Assistant API usage
- No additional charges for file_search tool
- Standard Assistant API rates apply

**Total Cost Impact**: Minimal, as files and vector stores are ephemeral (created and deleted per generation).

## Implementation Details

### OpenAI File Service

**File**: `src/lib/services/openai-file-service.ts`

Key methods:
- `uploadFile(fileUrl, filename, mimeType)` - Upload single file to OpenAI
- `uploadMultipleFiles(documents)` - Upload multiple files
- `createVectorStore(fileIds, name)` - Create vector store with files
- `deleteFile(fileId)` - Delete file from OpenAI
- `deleteVectorStore(vectorStoreId)` - Delete vector store

### Assistant Manager Integration

**File**: `src/ai/assistants/assistant-manager.ts`

Enhanced `generateContent()` method:

1. **Check for documents** in brand profile
2. **Upload documents** to OpenAI Files API
3. **Create vector store** with uploaded file IDs
4. **Create thread** with vector store attached
5. **Enable file_search tool** in run options
6. **Generate content** with document context
7. **Clean up resources** (thread, vector store, files)

### Code Example

```typescript
// Upload documents to OpenAI
const uploadResults = await openAIFileService.uploadMultipleFiles(
  brandProfile.documents
);
const fileIds = uploadResults.map(r => r.fileId);

// Create vector store
const vectorStore = await openAIFileService.createVectorStore(
  fileIds,
  `${brandProfile.businessName} - Brand Documents`
);

// Create thread with vector store
const thread = await openai.beta.threads.create({
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.vectorStoreId]
    }
  }
});

// Run assistant with file_search tool
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistantId,
  tools: [{ type: 'file_search' }]
});
```

## Benefits

### 1. Native Document Understanding
- OpenAI's document parsing is more sophisticated than custom extraction
- Handles complex layouts, tables, images, formatting
- Better context understanding across multiple pages

### 2. Accurate Data Extraction
- No need to pre-process documents
- Assistant can search and reference specific information
- Reduces hallucination by grounding in actual documents

### 3. Reduced Development Overhead
- No need to build PDF/Excel/PPT parsers
- No need to maintain extraction logic
- OpenAI handles all document processing

### 4. Better Content Quality
- More accurate pricing information
- Specific product/service references
- Real value propositions from pitch decks
- Authentic brand messaging from guidelines

## Usage in Content Generation

When a user has uploaded documents, the Assistant will:

1. **Search documents** for relevant information using file_search
2. **Extract specific data** (pricing, products, services, features)
3. **Reference actual content** from documents in generated copy
4. **Avoid hallucination** by grounding in real data
5. **Create personalized content** based on authentic business information

### Example Prompt Enhancement

```
**Business Documents Data:**
The following information has been extracted from uploaded business documents:

**Pricing:**
- Basic Plan: $29/month (Monthly billing)
- Pro Plan: $99/month (Advanced features)
- Enterprise: Custom pricing (Dedicated support)

**NOTE:** The full business documents have been uploaded and are available 
for you to search and analyze using the file_search tool. You can reference 
specific details, pricing, and information directly from these documents.
```

## Error Handling

### File Upload Failures
- If file upload fails, content generation continues without files
- Logged as warning, not error
- Falls back to extracted data in brand profile

### Unsupported File Types
- Images (JPG, PNG, WEBP) are skipped automatically
- Only supported formats are uploaded
- User sees which files were processed

### Size Limit Exceeded
- Files over 50MB are rejected with clear error message
- User can compress or split large files
- Validation happens before upload

## Resource Cleanup

All OpenAI resources are automatically cleaned up after each generation:

1. **Thread deletion** - Saves storage costs
2. **Vector store deletion** - Removes indexed documents
3. **File deletion** - Removes uploaded files

**Cleanup happens even on errors** to prevent resource leaks.

## Future Enhancements

### 1. Persistent Vector Stores
- Create one vector store per brand profile
- Update when documents change
- Reuse across multiple generations
- **Trade-off**: Ongoing storage costs vs. faster generation

### 2. Document Caching
- Cache uploaded file IDs per document
- Skip re-upload if document hasn't changed
- **Benefit**: Faster generation, lower API usage

### 3. Selective Document Upload
- Let users choose which documents to use per generation
- Different document sets for different content types
- **Benefit**: More targeted context, lower costs

### 4. Document Analysis API
- Separate endpoint to analyze documents
- Extract structured data for preview
- Show what AI "sees" in documents
- **Benefit**: Better user understanding and trust

## Testing

### Manual Testing
1. Upload a PDF pricing sheet in Brand Profile Documents tab
2. Generate content in Creative Studio
3. Check logs for file upload confirmation
4. Verify generated content references actual prices from document

### Automated Testing
```typescript
// Test file upload
const result = await openAIFileService.uploadFile(
  'https://example.com/pricing.pdf',
  'pricing.pdf',
  'application/pdf'
);
expect(result.fileId).toBeDefined();

// Test vector store creation
const vectorStore = await openAIFileService.createVectorStore(
  [result.fileId],
  'Test Documents'
);
expect(vectorStore.vectorStoreId).toBeDefined();
```

## Monitoring

### Key Metrics to Track
- **File upload success rate** - % of successful uploads
- **Average upload time** - Time to upload documents
- **Vector store creation time** - Time to index documents
- **Generation time with files** - Compare with/without files
- **Cost per generation** - Track OpenAI file storage costs

### Logging
All file operations are logged with emojis for easy scanning:
- 📥 Downloading file from URL
- 📤 Uploading file to OpenAI
- ✅ File uploaded successfully
- 📚 Creating vector store
- 🔍 Enabled file_search tool
- 🗑️ Deleted resources
- ⚠️ Warning messages
- ❌ Error messages

## Security & Privacy

### Data Privacy
- Documents are uploaded to OpenAI temporarily
- Deleted immediately after generation
- Not stored long-term in OpenAI
- Only accessible during active thread

### Access Control
- Documents only accessible to brand owner
- Not shared across users or brands
- Isolated per generation session

### Compliance
- OpenAI is SOC 2 Type II certified
- GDPR compliant
- Data processing agreement available
- Enterprise plans offer additional security features

## References

- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants)
- [File Search Tool Documentation](https://platform.openai.com/docs/assistants/tools/file-search)
- [OpenAI Files API](https://platform.openai.com/docs/api-reference/files)
- [Vector Stores API](https://platform.openai.com/docs/api-reference/vector-stores)

