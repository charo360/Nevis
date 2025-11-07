import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * GET /api/documents/verify-openai?fileId=file-xxx
 * Verify if a document exists in OpenAI and get its details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`🔍 Verifying OpenAI file: ${fileId}`);

    // Retrieve file from OpenAI
    const file = await openai.files.retrieve(fileId);

    console.log(`✅ File found in OpenAI:`, {
      id: file.id,
      filename: file.filename,
      purpose: file.purpose,
      bytes: file.bytes,
      created_at: file.created_at,
      status: file.status,
    });

    return NextResponse.json({
      success: true,
      exists: true,
      file: {
        id: file.id,
        filename: file.filename,
        purpose: file.purpose,
        bytes: file.bytes,
        sizeKB: (file.bytes / 1024).toFixed(2),
        sizeMB: (file.bytes / 1024 / 1024).toFixed(2),
        created_at: file.created_at,
        createdDate: new Date(file.created_at * 1000).toISOString(),
        status: file.status,
      },
    });

  } catch (error: any) {
    console.error('❌ Error verifying OpenAI file:', error);

    // Check if it's a "not found" error
    if (error?.status === 404 || error?.code === 'file_not_found') {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'File not found in OpenAI',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to verify file in OpenAI',
        details: error?.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/verify-openai
 * List all files in OpenAI (for debugging)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`📋 Listing all files in OpenAI...`);

    // List all files
    const filesList = await openai.files.list({
      purpose: 'assistants',
    });

    const files = [];
    for await (const file of filesList) {
      files.push({
        id: file.id,
        filename: file.filename,
        purpose: file.purpose,
        bytes: file.bytes,
        sizeKB: (file.bytes / 1024).toFixed(2),
        sizeMB: (file.bytes / 1024 / 1024).toFixed(2),
        created_at: file.created_at,
        createdDate: new Date(file.created_at * 1000).toISOString(),
        status: file.status,
      });
    }

    console.log(`✅ Found ${files.length} files in OpenAI`);

    return NextResponse.json({
      success: true,
      count: files.length,
      files: files,
    });

  } catch (error: any) {
    console.error('❌ Error listing OpenAI files:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to list files in OpenAI',
        details: error?.toString(),
      },
      { status: 500 }
    );
  }
}

