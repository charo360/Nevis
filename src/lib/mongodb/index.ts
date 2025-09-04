// MongoDB services main export
export * from './config';
export * from './database';
export * from './schemas';
export * from './storage';

// Service exports
export { brandProfileMongoService } from './services/brand-profile-service';
export { generatedPostMongoService } from './services/generated-post-service';

// Re-export MongoDB types and utilities
export {
  ObjectId,
  MongoClient,
  Db,
  Collection,
} from 'mongodb';

// Utility functions
export const createUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createDocumentId = (): string => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Initialize database (call this in your app startup)
export async function initializeMongoDB(): Promise<void> {
  try {
    const { connectToDatabase, initializeIndexes } = await import('./database');
    
    // Test connection
    await connectToDatabase();
    console.log('✅ MongoDB connection established');
    
    // Initialize indexes
    await initializeIndexes();
    console.log('✅ MongoDB indexes initialized');
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error);
    throw error;
  }
}
