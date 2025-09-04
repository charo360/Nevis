import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/config';
import { COLLECTIONS } from '@/lib/mongodb/config';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all users (limit to 10 for debugging)
    const users = await db.collection(COLLECTIONS.USERS).find({}).limit(10).toArray();
    
    // Count total users
    const totalUsers = await db.collection(COLLECTIONS.USERS).countDocuments();
    
    // Get collection stats
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    return NextResponse.json({
      totalUsers,
      users: users.map(user => ({
        id: user._id,
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      })),
      availableCollections: collectionNames,
      databaseName: db.databaseName,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
