import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorage } from '@/lib/services/supabase-storage';
import { documentProcessor } from '@/lib/services/document-processor';
import type { BrandDocument, DocumentFileFormat, DocumentType } from '@/types/documents';
import type { BusinessTypeCategory } from '@/ai/adaptive/business-type-detector';

/**
 * POST /api/documents/upload
 * Upload a business document to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandProfileId = formData.get('brandProfileId') as string;
    const documentType = formData.get('documentType') as DocumentType;
    const businessType = formData.get('businessType') as BusinessTypeCategory | null;

    console.log('📄 Document upload request:', {
      filename: file?.name,
      size: file?.size,
      type: file?.type,
      brandProfileId,
      documentType,
      businessType
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!brandProfileId) {
      return NextResponse.json(
        { success: false, error: 'Brand profile ID is required' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedFilename}`;
    const path = `brands/${brandProfileId}/documents/${filename}`;

    console.log('📤 Uploading to path:', path);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const uploadResult = await supabaseStorage.uploadFile(buffer, path, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    console.log('✅ Upload successful:', uploadResult);

    // Detect file format
    const fileFormat = detectFileFormat(file.type);

    // Create document metadata
    const document: BrandDocument = {
      id: generateDocumentId(),
      filename: file.name,
      fileType: documentType || 'other',
      fileFormat: fileFormat,
      fileSize: file.size,
      url: uploadResult.url,
      path: uploadResult.path,
      uploadDate: new Date().toISOString(),
      processingStatus: 'pending',
    };

    // Automatically process document with OpenAI if business type is provided
    if (businessType) {
      console.log(`🤖 Processing document with OpenAI for business type: ${businessType}`);

      try {
        // Update status to processing
        document.processingStatus = 'processing';

        // Process document and WAIT for completion
        // This uploads to OpenAI and attaches to the appropriate assistant
        const result = await documentProcessor.processDocument(document, businessType);

        if (result.success) {
          console.log(`✅ Document processed successfully: ${document.filename}`);
          console.log(`📎 OpenAI File ID: ${result.openaiFileId}`);
          console.log(`🤖 Assistant ID: ${result.assistantId}`);

          // Update document with OpenAI details
          document.processingStatus = result.processingStatus;
          document.openaiFileId = result.openaiFileId;
          document.openaiAssistantId = result.assistantId;
          document.openaiUploadDate = new Date().toISOString();

          return NextResponse.json({
            success: true,
            document,
            message: 'Document uploaded and processed successfully',
            openai: {
              fileId: result.openaiFileId,
              assistantId: result.assistantId,
            },
          });
        } else {
          console.error(`❌ Document processing failed: ${result.errorMessage}`);

          // Update status to failed
          document.processingStatus = 'failed';
          document.errorMessage = result.errorMessage;

          return NextResponse.json({
            success: true,
            document,
            message: 'Document uploaded but OpenAI processing failed',
            warning: result.errorMessage,
          });
        }
      } catch (error) {
        console.error(`⚠️  Document processing error:`, error);

        // Update status to failed
        document.processingStatus = 'failed';
        document.errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Don't fail the upload if processing fails - document is still uploaded to storage
        return NextResponse.json({
          success: true,
          document,
          message: 'Document uploaded but OpenAI processing failed',
          warning: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      console.log(`ℹ️  No business type provided - skipping OpenAI processing`);
    }

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded successfully',
    });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
    console.error('Error details:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to detect file format from MIME type
 */
function detectFileFormat(mimeType: string): DocumentFileFormat {
  const formatMap: Record<string, DocumentFileFormat> = {
    'application/pdf': 'pdf',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/csv': 'csv',
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return formatMap[mimeType] || 'pdf';
}

/**
 * Helper function to generate unique document ID
 */
function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

