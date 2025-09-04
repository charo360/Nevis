// MongoDB database service layer
import { Collection, Db, ObjectId, Filter, UpdateFilter, FindOptions } from 'mongodb';
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
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  // Get collection
  private async getCollection(): Promise<Collection<T>> {
    const db = await this.getDb();
    return db.collection<T>(this.collectionName);
  }

  // Create a new document
  async create(data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    } as T;

    const result = await collection.insertOne(docData);
    return result.insertedId.toString();
  }

  // Create multiple documents
  async createMany(data: Array<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>): Promise<string[]> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const docsData = data.map(item => ({
      ...item,
      createdAt: now,
      updatedAt: now,
    })) as T[];

    const result = await collection.insertMany(docsData);
    return Object.values(result.insertedIds).map(id => id.toString());
  }

  // Get a document by ID
  async getById(id: string): Promise<T | null> {
    const collection = await this.getCollection();
    const objectId = new ObjectId(id);
    
    const document = await collection.findOne({ _id: objectId } as Filter<T>);
    return document;
  }

  // Get documents by user ID
  async getByUserId(userId: string, options?: FindOptions<T>): Promise<T[]> {
    const collection = await this.getCollection();
    
    const documents = await collection.find({ userId } as Filter<T>, options).toArray();
    return documents;
  }

  // Get all documents with optional filter
  async getAll(filter: Filter<T> = {}, options?: FindOptions<T>): Promise<T[]> {
    const collection = await this.getCollection();
    
    const documents = await collection.find(filter, options).toArray();
    return documents;
  }

  // Update a document by ID
  async updateById(id: string, updates: Partial<Omit<T, '_id' | 'createdAt'>>): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = new ObjectId(id);
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: objectId } as Filter<T>,
      { $set: updateData } as UpdateFilter<T>
    );

    return result.modifiedCount > 0;
  }

  // Update documents by filter
  async updateMany(filter: Filter<T>, updates: Partial<Omit<T, '_id' | 'createdAt'>>): Promise<number> {
    const collection = await this.getCollection();
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const result = await collection.updateMany(
      filter,
      { $set: updateData } as UpdateFilter<T>
    );

    return result.modifiedCount;
  }

  // Delete a document by ID
  async deleteById(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = new ObjectId(id);
    
    const result = await collection.deleteOne({ _id: objectId } as Filter<T>);
    return result.deletedCount > 0;
  }

  // Delete documents by filter
  async deleteMany(filter: Filter<T>): Promise<number> {
    const collection = await this.getCollection();
    
    const result = await collection.deleteMany(filter);
    return result.deletedCount;
  }

  // Count documents
  async count(filter: Filter<T> = {}): Promise<number> {
    const collection = await this.getCollection();
    return await collection.countDocuments(filter);
  }

  // Check if document exists
  async exists(filter: Filter<T>): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments(filter, { limit: 1 });
    return count > 0;
  }

  // Find one document
  async findOne(filter: Filter<T>, options?: FindOptions<T>): Promise<T | null> {
    const collection = await this.getCollection();
    return await collection.findOne(filter, options);
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
    const collection = await this.getCollection();
    const skip = (page - 1) * limit;

    const [documents, totalCount] = await Promise.all([
      collection.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      documents,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  // Aggregate query
  async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
    const collection = await this.getCollection();
    return await collection.aggregate<R>(pipeline).toArray();
  }

  // Create indexes for better performance
  async createIndexes(indexes: Array<{ key: any; options?: any }>): Promise<void> {
    const collection = await this.getCollection();
    
    for (const index of indexes) {
      await collection.createIndex(index.key, index.options);
    }
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
