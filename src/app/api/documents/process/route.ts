import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/services/document-processor';
import type { BrandDocument } from '@/types/documents';
import type { BusinessTypeCategory } from '@/ai/adaptive/business-type-detector';

/**
 * POST /api/documents/process
 * Process a document by uploading it to OpenAI and attaching to appropriate assistant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, businessType } = body as {
      document: BrandDocument;
      businessType: BusinessTypeCategory;
    };

    console.log(`📄 [Process API] Processing document: ${document.filename}`);
    console.log(`🏢 [Process API] Business type: ${businessType}`);

    // Validate inputs
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document is required' },
        { status: 400 }
      );
    }

    if (!businessType) {
      return NextResponse.json(
        { success: false, error: 'Business type is required' },
        { status: 400 }
      );
    }

    // Process the document
    const result = await documentProcessor.processDocument(document, businessType);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || 'Document processing failed',
          processingStatus: result.processingStatus,
        },
        { status: 500 }
      );
    }

    // Return updated document metadata
    const updatedDocument: BrandDocument = {
      ...document,
      processingStatus: result.processingStatus,
      openaiFileId: result.openaiFileId,
      openaiAssistantId: result.assistantId,
      openaiUploadDate: new Date().toISOString(),
    };

    console.log(`✅ [Process API] Document processed successfully`);

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      openaiFileId: result.openaiFileId,
      assistantId: result.assistantId,
    });

  } catch (error) {
    console.error('❌ [Process API] Document processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process document',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/documents/process
 * Retry processing a failed document
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, businessType } = body as {
      document: BrandDocument;
      businessType: BusinessTypeCategory;
    };

    console.log(`🔄 [Process API] Retrying document: ${document.filename}`);

    // Validate inputs
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document is required' },
        { status: 400 }
      );
    }

    if (!businessType) {
      return NextResponse.json(
        { success: false, error: 'Business type is required' },
        { status: 400 }
      );
    }

    // Retry processing
    const result = await documentProcessor.retryProcessing(document, businessType);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || 'Document processing failed',
          processingStatus: result.processingStatus,
        },
        { status: 500 }
      );
    }

    // Return updated document metadata
    const updatedDocument: BrandDocument = {
      ...document,
      processingStatus: result.processingStatus,
      openaiFileId: result.openaiFileId,
      openaiAssistantId: result.assistantId,
      openaiUploadDate: new Date().toISOString(),
      errorMessage: undefined, // Clear any previous error
    };

    console.log(`✅ [Process API] Document retry successful`);

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      openaiFileId: result.openaiFileId,
      assistantId: result.assistantId,
    });

  } catch (error) {
    console.error('❌ [Process API] Document retry error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retry document processing',
      },
      { status: 500 }
    );
  }
}

