import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorageService } from '@/lib/services/supabase-storage';
import type { BrandDocument, DocumentFileFormat, DocumentType } from '@/types/documents';

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

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
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
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedFilename}`;
    const path = `brands/${brandProfileId}/documents/${filename}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const uploadResult = await supabaseStorageService.uploadFile(buffer, path, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

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

    // TODO: Trigger document processing in background
    // This would extract data from the document and update the extractedData field
    // For now, we'll just return the document with pending status

    return NextResponse.json({
      success: true,
      document,
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document',
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

