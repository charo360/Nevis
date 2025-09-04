// MongoDB configuration and connection
import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

// MongoDB connection string from environment
const MONGODB_URI = process.env.DATABASE || process.env.MONGODB_URI;

// Only check for environment variables on the server side
if (typeof window === 'undefined' && !MONGODB_URI) {
  throw new Error('Please define the DATABASE or MONGODB_URI environment variable inside .env.local');
}

// Global variables to cache the connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let mongooseConnection: typeof mongoose | null = null;

// Database name (extracted from connection string or default)
const DB_NAME = 'nevis_ai';

/**
 * Connect to MongoDB using native driver
 * This is used for direct database operations
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Only allow server-side connections
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB connections can only be made on the server side');
  }

  if (!MONGODB_URI) {
    throw new Error('MongoDB connection string is not defined');
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Connect to MongoDB using Mongoose
 * This is used for schema-based operations
 */
export async function connectWithMongoose(): Promise<typeof mongoose> {
  if (mongooseConnection && mongoose.connection.readyState === 1) {
    return mongooseConnection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongooseConnection = connection;
    console.log('✅ Connected to MongoDB with Mongoose');
    return connection;
  } catch (error) {
    console.error('❌ Mongoose connection error:', error);
    throw error;
  }
}

/**
 * Get database instance (creates connection if needed)
 */
export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    if (cachedClient) {
      await cachedClient.close();
      cachedClient = null;
      cachedDb = null;
    }

    if (mongooseConnection) {
      await mongoose.disconnect();
      mongooseConnection = null;
    }

    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
}

// Collection names (matching Firebase collections)
export const COLLECTIONS = {
  USERS: 'users',
  BRAND_PROFILES: 'brandProfiles',
  GENERATED_POSTS: 'generatedPosts',
  ARTIFACTS: 'artifacts',
  DESIGN_ANALYTICS: 'designAnalytics',
  CONTENT_CALENDAR: 'contentCalendar',
} as const;

// Export types
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
