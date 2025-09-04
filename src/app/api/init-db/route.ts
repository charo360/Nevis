// Initialize MongoDB database and indexes
import { NextRequest, NextResponse } from 'next/server';
import { initializeIndexes } from '@/lib/mongodb/database';
import { connectToDatabase } from '@/lib/mongodb/config';

export async function POST(request: NextRequest) {
  try {
    // Test MongoDB connection
    const { db } = await connectToDatabase();
    await db.admin().ping();
    
    // Initialize indexes
    await initializeIndexes();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB database initialized successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check for MongoDB
    const { db } = await connectToDatabase();
    await db.admin().ping();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
