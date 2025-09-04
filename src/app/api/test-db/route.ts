// Test database connection endpoint
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test MongoDB connection
    const { db } = await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
