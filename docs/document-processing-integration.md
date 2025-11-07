# Document Processing Integration with OpenAI Assistants

## Overview

The document processing system automatically uploads business documents to OpenAI and makes them available to the appropriate Brand Agent Assistant for content generation and business insights.

## Architecture

### Components

1. **Document Processor Service** (`src/lib/services/document-processor.ts`)
   - Handles document upload to OpenAI Files API
   - Maps business types to appropriate OpenAI Assistants
   - Manages file lifecycle (upload, delete, retry)

2. **Upload API** (`src/app/api/documents/upload/route.ts`)
   - Receives document uploads from client
   - Stores files in Supabase Storage
   - Triggers automatic OpenAI processing in background

3. **Process API** (`src/app/api/documents/process/route.ts`)
   - Manual document processing endpoint
   - Retry functionality for failed uploads
   - Returns updated document metadata with OpenAI file IDs

4. **Document Upload Zone** (`src/components/documents/document-upload-zone.tsx`)
   - Client-side upload component
   - Drag-and-drop interface
   - Progress tracking and status display

## Workflow

### Automatic Processing Flow

```
1. User uploads document via DocumentUploadZone
   ↓
2. File uploaded to Supabase Storage
   ↓
3. Document metadata created with status: 'pending'
   ↓
4. If businessType provided:
   - Status updated to 'processing'
   - Background job initiated
   ↓
5. Document Processor:
   - Downloads file from Supabase
   - Uploads to OpenAI Files API (purpose: 'assistants')
   - Returns OpenAI file ID
   ↓
6. Document metadata updated:
   - openaiFileId: stored
   - openaiAssistantId: stored
   - processingStatus: 'completed'
   - openaiUploadDate: timestamp
```

### Manual Retry Flow

```
1. User clicks retry on failed document
   ↓
2. PUT /api/documents/process
   ↓
3. Document Processor retries upload
   ↓
4. Document metadata updated with new status
```

## Usage

### In Brand Profile Wizard

```typescript
<DocumentUploadZone
  brandProfileId={brandProfile.id}
  businessType={brandProfile.businessType}
  existingDocuments={brandProfile.documents}
  onDocumentsChange={(documents) => {
    updateBrandProfile({ documents });
  }}
  maxFiles={10}
  maxFileSize={50 * 1024 * 1024}
/>
```

### Manual Processing

```typescript
// Process a document manually
const response = await fetch('/api/documents/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document: documentObject,
    businessType: 'retail'
  })
});

const result = await response.json();
console.log('OpenAI File ID:', result.openaiFileId);
console.log('Assistant ID:', result.assistantId);
```

### Retry Failed Processing

```typescript
// Retry a failed document
const response = await fetch('/api/documents/process', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document: failedDocument,
    businessType: 'retail'
  })
});
```

## Document Types

### Supported File Formats

- **PDF** (`.pdf`) - Pitch decks, brochures, reports
- **Word** (`.docx`) - Business plans, case studies
- **PowerPoint** (`.pptx`) - Presentations, slide decks
- **Excel** (`.xlsx`) - Pricing sheets, product catalogs
- **Text** (`.txt`) - Plain text documents
- **CSV** (`.csv`) - Data tables, pricing lists

### Document Categories

- `pitch-deck` - Investor presentations
- `pricing-sheet` - Product/service pricing
- `product-catalog` - Product listings
- `service-brochure` - Service descriptions
- `brand-guidelines` - Brand identity docs
- `marketing-materials` - Marketing collateral
- `business-plan` - Business strategy docs
- `case-study` - Customer success stories
- `other` - Miscellaneous documents

## Assistant Integration

### Business Type Mapping

Each business type maps to a specific OpenAI Assistant:

```typescript
const ASSISTANT_ENV_VARS = {
  retail: 'OPENAI_ASSISTANT_RETAIL',
  finance: 'OPENAI_ASSISTANT_FINANCE',
  service: 'OPENAI_ASSISTANT_SERVICE',
  saas: 'OPENAI_ASSISTANT_SAAS',
  food: 'OPENAI_ASSISTANT_FOOD',
  healthcare: 'OPENAI_ASSISTANT_HEALTHCARE',
  realestate: 'OPENAI_ASSISTANT_REALESTATE',
  education: 'OPENAI_ASSISTANT_EDUCATION',
  b2b: 'OPENAI_ASSISTANT_B2B',
  nonprofit: 'OPENAI_ASSISTANT_NONPROFIT',
};
```

### How Assistants Access Documents

When generating content, the Assistant Manager:

1. Checks for documents in brand profile
2. Uploads documents to OpenAI (if not already uploaded)
3. Creates a Vector Store with uploaded files
4. Attaches Vector Store to thread
5. Enables `file_search` tool
6. Assistant can now query document contents

Example from `assistant-manager.ts`:

```typescript
// Create vector store with uploaded files
const vectorStore = await openAIFileService.createVectorStore(
  uploadedFileIds,
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

// Enable file_search tool
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistantId,
  tools: [{ type: 'file_search' }]
});
```

## Document Metadata Structure

```typescript
interface BrandDocument {
  id: string;
  filename: string;
  fileType: DocumentType;
  fileFormat: DocumentFileFormat;
  fileSize: number;
  url: string;                    // Supabase Storage URL
  path: string;                   // Supabase Storage path
  uploadDate: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  
  // OpenAI Integration
  openaiFileId?: string;          // OpenAI file ID
  openaiAssistantId?: string;     // Assistant with access
  openaiUploadDate?: string;      // Upload timestamp
  
  // Error handling
  errorMessage?: string;
  
  // Extracted data (future enhancement)
  extractedData?: ExtractedDocumentData;
}
```

## Error Handling

### Common Errors

1. **Unsupported File Type**
   - Status: `failed`
   - Message: "File type X is not supported for AI processing"
   - Solution: Only upload supported formats

2. **OpenAI API Key Missing**
   - Status: `failed`
   - Message: "OpenAI API key not configured"
   - Solution: Set `OPENAI_API_KEY` in environment

3. **No Assistant Configured**
   - Status: `failed`
   - Message: "No assistant configured for business type: X"
   - Solution: Set appropriate `OPENAI_ASSISTANT_X` env var

4. **File Download Failed**
   - Status: `failed`
   - Message: "Failed to download file: X"
   - Solution: Check Supabase Storage permissions

5. **OpenAI Upload Failed**
   - Status: `failed`
   - Message: OpenAI API error
   - Solution: Check API key, rate limits, file size

### Retry Strategy

Failed documents can be retried using the PUT endpoint:

```typescript
await fetch('/api/documents/process', {
  method: 'PUT',
  body: JSON.stringify({ document, businessType })
});
```

## Testing

### Test Storage Configuration

```bash
# Visit this endpoint to test Supabase storage
GET /api/documents/test-storage
```

### Initialize Storage Bucket

```bash
# Create nevis-storage bucket if it doesn't exist
POST /api/documents/init-storage
```

### Test Document Upload

```bash
# Upload a test document
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf" \
  -F "brandProfileId=test-123" \
  -F "businessType=retail" \
  -F "documentType=pitch-deck"
```

## Future Enhancements

1. **Document Extraction**
   - Extract pricing, products, services from documents
   - Store in `extractedData` field
   - Use for automated content generation

2. **Document Versioning**
   - Track document updates
   - Maintain version history
   - Re-process on updates

3. **Batch Processing**
   - Process multiple documents simultaneously
   - Progress tracking for batch uploads

4. **Document Search**
   - Search across all uploaded documents
   - Filter by type, date, status
   - Full-text search

5. **Analytics**
   - Track document usage in content generation
   - Measure impact on content quality
   - Document effectiveness metrics

