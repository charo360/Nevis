// MongoDB disabled stub: all functions now throw to avoid accidental usage
import type { MongoClient, Db } from 'mongodb';
import type mongoose from 'mongoose';

// MongoDB connection string from environment
const MONGODB_URI = undefined;

// Only check for environment variables on the server side
// Intentionally do not initiate MongoDB

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
  throw new Error('MongoDB is disabled. Use Supabase instead.');
}

/**
 * Connect to MongoDB using Mongoose
 * This is used for schema-based operations
 */
export async function connectWithMongoose(): Promise<typeof mongoose> {
  throw new Error('MongoDB/Mongoose is disabled. Use Supabase instead.');
}

/**
 * Get database instance (creates connection if needed)
 */
export async function getDatabase(): Promise<Db> {
  throw new Error('MongoDB is disabled. Use Supabase instead.');
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  // no-op in stub
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
