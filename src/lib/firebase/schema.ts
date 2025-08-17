// Firestore database schema definitions
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Base schema for all documents
export const BaseDocumentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.union([z.date(), z.custom<Timestamp>()]),
  updatedAt: z.union([z.date(), z.custom<Timestamp>()]),
});

// User document schema
export const UserDocumentSchema = BaseDocumentSchema.extend({
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
    expiresAt: z.union([z.date(), z.custom<Timestamp>()]).optional(),
  }).optional(),
});

// Brand Profile document schema
export const BrandProfileDocumentSchema = BaseDocumentSchema.extend({
  name: z.string(),
  businessType: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  logoDataUrl: z.string().optional(), // Added logo support
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  brandColors: z.array(z.string()).optional(),
  brandFonts: z.array(z.string()).optional(),
  visualStyle: z.string().optional(),
  targetAudience: z.string().optional(),
  brandVoice: z.string().optional(),
  services: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
  })).optional(),
  designExamples: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
    type: z.enum(['logo', 'banner', 'post', 'story', 'other']),
  })).optional(),
  isComplete: z.boolean().default(false),
  version: z.string().default('1.0'),
});

// Generated Post document schema
export const GeneratedPostDocumentSchema = BaseDocumentSchema.extend({
  brandProfileId: z.string(),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok']),
  postType: z.enum(['post', 'story', 'reel', 'advertisement']),
  content: z.object({
    text: z.string(),
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
  }),
  metadata: z.object({
    businessType: z.string(),
    visualStyle: z.string().optional(),
    targetAudience: z.string().optional(),
    generationPrompt: z.string().optional(),
    aiModel: z.string().optional(),
  }),
  analytics: z.object({
    qualityScore: z.number().min(0).max(100).optional(),
    engagementPrediction: z.number().min(0).max(100).optional(),
    brandAlignmentScore: z.number().min(0).max(100).optional(),
    views: z.number().default(0),
    likes: z.number().default(0),
    shares: z.number().default(0),
    comments: z.number().default(0),
  }).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).default('draft'),
  scheduledAt: z.union([z.date(), z.custom<Timestamp>()]).optional(),
  publishedAt: z.union([z.date(), z.custom<Timestamp>()]).optional(),
});

// Artifact document schema
export const ArtifactDocumentSchema = BaseDocumentSchema.extend({
  name: z.string(),
  type: z.enum(['image', 'video', 'document', 'text']),
  category: z.enum(['exact-use', 'reference']),
  usageType: z.enum(['exact', 'reference']),
  uploadType: z.enum(['file', 'text', 'url']),
  folderId: z.string().optional(),
  isActive: z.boolean().default(true),
  instructions: z.string().optional(),
  textOverlay: z.object({
    headline: z.string().optional(),
    message: z.string().optional(),
    cta: z.string().optional(),
    contact: z.string().optional(),
  }).optional(),
  filePath: z.string().optional(),
  thumbnailPath: z.string().optional(),
  fileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  metadata: z.object({
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    duration: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  usage: z.object({
    usageCount: z.number().default(0),
    usedInContexts: z.array(z.string()).default([]),
    lastUsedAt: z.union([z.date(), z.custom<Timestamp>()]).optional(),
  }),
  discountInfo: z.object({
    hasDiscount: z.boolean().default(false),
    discountPercentage: z.number().optional(),
    discountText: z.string().optional(),
    validUntil: z.union([z.date(), z.custom<Timestamp>()]).optional(),
  }).optional(),
});

// Design Analytics document schema
export const DesignAnalyticsDocumentSchema = BaseDocumentSchema.extend({
  designId: z.string(),
  businessType: z.string(),
  platform: z.string(),
  visualStyle: z.string(),
  generatedAt: z.union([z.date(), z.custom<Timestamp>()]),
  metrics: z.object({
    qualityScore: z.number().min(1).max(10),
    engagementPrediction: z.number().min(1).max(10),
    brandAlignmentScore: z.number().min(1).max(10),
    technicalQuality: z.number().min(1).max(10),
    trendRelevance: z.number().min(1).max(10),
  }),
  designElements: z.object({
    colorPalette: z.array(z.string()),
    typography: z.string(),
    composition: z.string(),
    trends: z.array(z.string()),
    businessDNA: z.string(),
  }),
  tags: z.array(z.string()).default([]),
  performance: z.object({
    actualEngagement: z.number().optional(),
    actualReach: z.number().optional(),
    conversionRate: z.number().optional(),
    updatedAt: z.union([z.date(), z.custom<Timestamp>()]).optional(),
  }).optional(),
});

// Content Calendar document schema
export const ContentCalendarDocumentSchema = BaseDocumentSchema.extend({
  brandProfileId: z.string(),
  date: z.union([z.date(), z.custom<Timestamp>()]),
  services: z.array(z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  })),
  generatedPosts: z.array(z.string()).default([]), // Array of post IDs
  notes: z.string().optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'cancelled']).default('planned'),
});

// Export types
export type UserDocument = z.infer<typeof UserDocumentSchema>;
export type BrandProfileDocument = z.infer<typeof BrandProfileDocumentSchema>;
export type GeneratedPostDocument = z.infer<typeof GeneratedPostDocumentSchema>;
export type ArtifactDocument = z.infer<typeof ArtifactDocumentSchema>;
export type DesignAnalyticsDocument = z.infer<typeof DesignAnalyticsDocumentSchema>;
export type ContentCalendarDocument = z.infer<typeof ContentCalendarDocumentSchema>;

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  BRAND_PROFILES: 'brandProfiles',
  GENERATED_POSTS: 'generatedPosts',
  ARTIFACTS: 'artifacts',
  DESIGN_ANALYTICS: 'designAnalytics',
  CONTENT_CALENDAR: 'contentCalendar',
} as const;
