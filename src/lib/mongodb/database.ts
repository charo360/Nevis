// MongoDB disabled service layer (stub)
import type { Collection, Db, ObjectId, Filter, UpdateFilter, FindOptions } from 'mongodb';
import { getDatabase } from './config';

// Generic database service class
export class MongoDBService<T extends { _id?: ObjectId; userId: string }> {
  private collectionName: string;
  private db: Db | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get database connection
  private async getDb(): Promise<Db> {
    // Stub throws to prevent usage
    return await getDatabase();
  }

  // Get collection
  private async getCollection(): Promise<Collection<T>> {
    const db = await this.getDb();
    return db.collection<T>(this.collectionName);
  }

  // Create a new document
  async create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Create multiple documents
  async createMany(data: Array<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>): Promise<string[]> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Get a document by ID
  async getById(id: string): Promise<T | null> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Get documents by user ID
  async getByUserId(userId: string, options?: FindOptions<T>): Promise<T[]> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Get all documents with optional filter
  async getAll(filter: Filter<T> = {}, options?: FindOptions<T>): Promise<T[]> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Update a document by ID
  async updateById(id: string, updates: Partial<Omit<T, '_id' | 'createdAt'>>): Promise<boolean> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Update documents by filter
  async updateMany(filter: Filter<T>, updates: Partial<Omit<T, '_id' | 'createdAt'>>): Promise<number> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Delete a document by ID
  async deleteById(id: string): Promise<boolean> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Delete documents by filter
  async deleteMany(filter: Filter<T>): Promise<number> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Count documents
  async count(filter: Filter<T> = {}): Promise<number> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Check if document exists
  async exists(filter: Filter<T>): Promise<boolean> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Find one document
  async findOne(filter: Filter<T>, options?: FindOptions<T>): Promise<T | null> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Find documents with pagination
  async findWithPagination(
    filter: Filter<T> = {},
    page: number = 1,
    limit: number = 10,
    sort?: { [key: string]: 1 | -1 }
  ): Promise<{
    documents: T[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Aggregate query
  async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
    throw new Error('MongoDB is disabled. Use Supabase services instead.');
  }

  // Create indexes for better performance
  async createIndexes(indexes: Array<{ key: any; options?: any }>): Promise<void> {
    // no-op
  }
}

// Specific service instances for each collection
import { COLLECTIONS } from './config';
import type {
  UserDocument,
  BrandProfileDocument,
  GeneratedPostDocument,
  ArtifactDocument,
  DesignAnalyticsDocument,
  ContentCalendarDocument,
} from './schemas';

export const userService = new MongoDBService<UserDocument>(COLLECTIONS.USERS);
export const brandProfileService = new MongoDBService<BrandProfileDocument>(COLLECTIONS.BRAND_PROFILES);
export const generatedPostService = new MongoDBService<GeneratedPostDocument>(COLLECTIONS.GENERATED_POSTS);
export const artifactService = new MongoDBService<ArtifactDocument>(COLLECTIONS.ARTIFACTS);
export const designAnalyticsService = new MongoDBService<DesignAnalyticsDocument>(COLLECTIONS.DESIGN_ANALYTICS);
export const contentCalendarService = new MongoDBService<ContentCalendarDocument>(COLLECTIONS.CONTENT_CALENDAR);

// Initialize database indexes for better performance
export async function initializeIndexes(): Promise<void> {
  try {
    // User indexes
    await userService.createIndexes([
      { key: { userId: 1 }, options: { unique: true } },
      { key: { email: 1 }, options: { unique: true } },
    ]);

    // Brand Profile indexes
    await brandProfileService.createIndexes([
      { key: { userId: 1 } },
      { key: { businessName: 1 } },
      { key: { isActive: 1 } },
    ]);

    // Generated Post indexes
    await generatedPostService.createIndexes([
      { key: { userId: 1 } },
      { key: { brandProfileId: 1 } },
      { key: { platform: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ]);

    // Artifact indexes
    await artifactService.createIndexes([
      { key: { userId: 1 } },
      { key: { category: 1 } },
      { key: { isActive: 1 } },
      { key: { tags: 1 } },
    ]);

    // Design Analytics indexes
    await designAnalyticsService.createIndexes([
      { key: { userId: 1 } },
      { key: { designId: 1 } },
      { key: { businessType: 1 } },
      { key: { generatedAt: -1 } },
    ]);

    // Content Calendar indexes
    await contentCalendarService.createIndexes([
      { key: { userId: 1 } },
      { key: { brandProfileId: 1 } },
      { key: { date: 1 } },
      { key: { status: 1 } },
    ]);

    console.log('✅ Database indexes initialized');
  } catch (error) {
    console.error('❌ Error initializing database indexes:', error);
  }
}
