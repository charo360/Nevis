// MongoDB schemas using Mongoose
import mongoose, { Schema, Document, Types } from 'mongoose';
import { z } from 'zod';

// Base document interface
interface BaseDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Document Schema
export interface UserDocument extends BaseDocument {
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSave: boolean;
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt?: Date;
  };
}

const UserSchema = new Schema<UserDocument>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String },
  photoURL: { type: String },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true },
  },
  subscription: {
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
    expiresAt: { type: Date },
  },
}, {
  timestamps: true,
});

// Brand Profile Document Schema
export interface BrandProfileDocument extends BaseDocument {
  businessName: string;
  businessType: string;
  description?: string;
  location?: {
    country: string;
    city: string;
    address?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
  };
  brandColors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  logoUrl?: string;
  designExamples?: string[];
  targetAudience?: string;
  brandVoice?: string;
  services?: Array<{
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>;
  isActive: boolean;
}

const BrandProfileSchema = new Schema<BrandProfileDocument>({
  userId: { type: String, required: true, index: true },
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  description: { type: String },
  location: {
    country: { type: String },
    city: { type: String },
    address: { type: String },
  },
  contact: {
    email: { type: String },
    phone: { type: String },
    website: { type: String },
  },
  socialMedia: {
    instagram: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
    tiktok: { type: String },
  },
  brandColors: {
    primary: { type: String },
    secondary: { type: String },
    accent: { type: String },
  },
  logoUrl: { type: String },
  designExamples: [{ type: String }],
  targetAudience: { type: String },
  brandVoice: { type: String },
  services: [{
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number },
    currency: { type: String, default: 'USD' },
  }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Generated Post Document Schema
export interface GeneratedPostDocument extends BaseDocument {
  brandProfileId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  postType: 'post' | 'story' | 'reel' | 'advertisement';
  content: {
    text: string;
    hashtags?: string[];
    mentions?: string[];
    imageUrl?: string;
    videoUrl?: string;
  };
  // Support for multi-platform variants
  variants?: {
    platform: string;
    imageUrl: string;
  }[];
  // Legacy fields for backward compatibility
  imageUrl?: string;
  catchyWords?: string;
  subheadline?: string;
  callToAction?: string;
  metadata?: {
    businessType?: string;
    visualStyle?: string;
    targetAudience?: string;
    generationPrompt?: string;
    aiModel?: string;
  };
  analytics?: {
    qualityScore?: number;
    engagementPrediction?: number;
    brandAlignmentScore?: number;
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: Date;
  publishedAt?: Date;
}

const GeneratedPostSchema = new Schema<GeneratedPostDocument>({
  userId: { type: String, required: true, index: true },
  brandProfileId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'], required: true },
  postType: { type: String, enum: ['post', 'story', 'reel', 'advertisement'], required: true },
  content: {
    text: { type: String, required: true },
    hashtags: [{ type: String }],
    mentions: [{ type: String }],
    imageUrl: { type: String },
    videoUrl: { type: String },
  },
  // Support for multi-platform variants
  variants: [{
    platform: { type: String },
    imageUrl: { type: String },
  }],
  // Legacy fields for backward compatibility
  imageUrl: { type: String },
  catchyWords: { type: String },
  subheadline: { type: String },
  callToAction: { type: String },
  metadata: {
    businessType: { type: String },
    visualStyle: { type: String },
    targetAudience: { type: String },
    generationPrompt: { type: String },
    aiModel: { type: String },
  },
  analytics: {
    qualityScore: { type: Number, min: 0, max: 100 },
    engagementPrediction: { type: Number, min: 0, max: 100 },
    brandAlignmentScore: { type: Number, min: 0, max: 100 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['draft', 'scheduled', 'published', 'archived'], default: 'draft' },
  scheduledAt: { type: Date },
  publishedAt: { type: Date },
}, {
  timestamps: true,
});

// Export models
export const User = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
export const BrandProfile = mongoose.models.BrandProfile || mongoose.model<BrandProfileDocument>('BrandProfile', BrandProfileSchema);
export const GeneratedPost = mongoose.models.GeneratedPost || mongoose.model<GeneratedPostDocument>('GeneratedPost', GeneratedPostSchema);

// Zod validation schemas (for API validation)
export const UserValidationSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.boolean().default(true),
    autoSave: z.boolean().default(true),
  }).optional(),
  subscription: z.object({
    plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
    status: z.enum(['active', 'inactive', 'cancelled']).default('active'),
    expiresAt: z.date().optional(),
  }).optional(),
});

export const BrandProfileValidationSchema = z.object({
  userId: z.string(),
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  description: z.string().optional(),
  location: z.object({
    country: z.string(),
    city: z.string(),
    address: z.string().optional(),
  }).optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  brandColors: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  logoUrl: z.string().url().optional(),
  designExamples: z.array(z.string().url()).optional(),
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
  services: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().default('USD'),
  })).optional(),
  isActive: z.boolean().default(true),
});

// Artifact Document Schema
export interface ArtifactDocument extends BaseDocument {
  name: string;
  type: 'image' | 'video' | 'document' | 'text';
  category: 'exact-use' | 'reference';
  usageType: 'exact' | 'reference';
  uploadType: 'file' | 'text' | 'url';
  folderId?: string;
  isActive: boolean;
  instructions?: string;
  textOverlay?: {
    headline?: string;
    message?: string;
    cta?: string;
    contact?: string;
  };
  filePath?: string;
  thumbnailPath?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    duration?: number;
  };
  tags: string[];
  usage: {
    usageCount: number;
    usedInContexts: string[];
    lastUsedAt?: Date;
  };
  discountInfo?: {
    hasDiscount: boolean;
    discountPercentage?: number;
    discountText?: string;
    validUntil?: Date;
  };
}

const ArtifactSchema = new Schema<ArtifactDocument>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'document', 'text'], required: true },
  category: { type: String, enum: ['exact-use', 'reference'], required: true },
  usageType: { type: String, enum: ['exact', 'reference'], required: true },
  uploadType: { type: String, enum: ['file', 'text', 'url'], required: true },
  folderId: { type: String },
  isActive: { type: Boolean, default: true },
  instructions: { type: String },
  textOverlay: {
    headline: { type: String },
    message: { type: String },
    cta: { type: String },
    contact: { type: String },
  },
  filePath: { type: String },
  thumbnailPath: { type: String },
  fileUrl: { type: String },
  thumbnailUrl: { type: String },
  metadata: {
    fileSize: { type: Number },
    mimeType: { type: String },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
    },
    duration: { type: Number },
  },
  tags: [{ type: String }],
  usage: {
    usageCount: { type: Number, default: 0 },
    usedInContexts: [{ type: String }],
    lastUsedAt: { type: Date },
  },
  discountInfo: {
    hasDiscount: { type: Boolean, default: false },
    discountPercentage: { type: Number },
    discountText: { type: String },
    validUntil: { type: Date },
  },
}, {
  timestamps: true,
});

// Design Analytics Document Schema
export interface DesignAnalyticsDocument extends BaseDocument {
  designId: string;
  businessType: string;
  platform: string;
  visualStyle: string;
  generatedAt: Date;
  metrics: {
    qualityScore: number;
    engagementPrediction: number;
    brandAlignmentScore: number;
    technicalQuality: number;
    trendRelevance: number;
  };
  designElements: {
    colorPalette: string[];
    typography: string;
    composition: string;
    trends: string[];
    businessDNA: string;
  };
}

const DesignAnalyticsSchema = new Schema<DesignAnalyticsDocument>({
  userId: { type: String, required: true, index: true },
  designId: { type: String, required: true },
  businessType: { type: String, required: true },
  platform: { type: String, required: true },
  visualStyle: { type: String, required: true },
  generatedAt: { type: Date, required: true },
  metrics: {
    qualityScore: { type: Number, min: 1, max: 10, required: true },
    engagementPrediction: { type: Number, min: 1, max: 10, required: true },
    brandAlignmentScore: { type: Number, min: 1, max: 10, required: true },
    technicalQuality: { type: Number, min: 1, max: 10, required: true },
    trendRelevance: { type: Number, min: 1, max: 10, required: true },
  },
  designElements: {
    colorPalette: [{ type: String }],
    typography: { type: String, required: true },
    composition: { type: String, required: true },
    trends: [{ type: String }],
    businessDNA: { type: String, required: true },
  },
}, {
  timestamps: true,
});

// Content Calendar Document Schema
export interface ContentCalendarDocument extends BaseDocument {
  brandProfileId: string;
  date: Date;
  services: Array<{
    serviceId: string;
    serviceName: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  generatedPosts: string[]; // Array of post IDs
  notes?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
}

const ContentCalendarSchema = new Schema<ContentCalendarDocument>({
  userId: { type: String, required: true, index: true },
  brandProfileId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  services: [{
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  }],
  generatedPosts: [{ type: String }],
  notes: { type: String },
  status: { type: String, enum: ['planned', 'in-progress', 'completed', 'cancelled'], default: 'planned' },
}, {
  timestamps: true,
});

// Export additional models
export const Artifact = mongoose.models.Artifact || mongoose.model<ArtifactDocument>('Artifact', ArtifactSchema);
export const DesignAnalytics = mongoose.models.DesignAnalytics || mongoose.model<DesignAnalyticsDocument>('DesignAnalytics', DesignAnalyticsSchema);
export const ContentCalendar = mongoose.models.ContentCalendar || mongoose.model<ContentCalendarDocument>('ContentCalendar', ContentCalendarSchema);
