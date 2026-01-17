/**
 * Learning API - Track Edit
 * Endpoint for tracking user edits to learn preferences
 * Part of Layer 5: Iteration & Learning Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackUserEdit } from '@/lib/learning/feedbackProcessor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      postId,
      clientId,
      originalContent,
      editedContent,
    } = body;

    if (!postId || !clientId || !originalContent || !editedContent) {
      return NextResponse.json(
        { error: 'postId, clientId, originalContent, and editedContent are required' },
        { status: 400 }
      );
    }

    // Don't track if content is identical
    if (originalContent === editedContent) {
      return NextResponse.json({
        success: true,
        tracked: false,
        message: 'No changes detected',
      });
    }

    console.log(`📝 [Learning API] Tracking edit for post ${postId}`);

    const edit = await trackUserEdit(postId, clientId, originalContent, editedContent);

    return NextResponse.json({
      success: true,
      tracked: true,
      data: {
        editId: edit.id,
        editType: edit.editType,
        timestamp: edit.timestamp,
      },
    });
  } catch (error) {
    console.error('❌ [Learning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track edit', details: String(error) },
      { status: 500 }
    );
  }
}
