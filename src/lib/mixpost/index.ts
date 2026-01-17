/**
 * Mixpost Integration Module
 * Central export for all Mixpost-related functionality
 */

// Client
export { 
  MixpostClient, 
  getMixpostClient,
  type MixpostConfig,
  type MixpostWorkspace,
  type MixpostAccount,
  type MixpostPost,
  type MixpostMedia,
  type MixpostAnalytics,
  type CreatePostOptions,
  type PublishBatchOptions,
} from './client';

// Scheduler
export {
  getOptimalSchedule,
  getIndustryScheduleConfig,
  validateSchedule,
  suggestScheduleAdjustments,
  type ScheduleConfig,
  type OptimalTimeSlot,
  type ScheduleResult,
} from './scheduler';

// Media Handler
export {
  uploadImage,
  uploadBatch,
  validateImageForPlatform,
  optimizeForPlatform,
  getMediaLibrary,
  type MediaUploadResult,
  type ProcessedMedia,
} from './mediaHandler';

// Webhooks
export {
  verifyWebhookSignature,
  processWebhook,
  registerWebhook,
  type MixpostWebhookPayload,
  type WebhookVerification,
} from './webhooks';
