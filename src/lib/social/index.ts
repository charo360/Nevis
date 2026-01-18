/**
 * Social Media Integration Module
 * Central export for all social media functionality
 */

// OAuth Configuration
export {
  SOCIAL_PLATFORMS,
  getPlatform,
  getEnabledPlatforms,
  buildAuthorizationUrl,
  type OAuthConfig,
  type SocialPlatform,
} from './oauth-config';

// Token Management
export {
  saveToken,
  getToken,
  getConnectedAccounts,
  disconnectAccount,
  isTokenExpired,
  refreshMetaToken,
  getValidToken,
  type SocialToken,
  type ConnectedAccount,
} from './token-manager';

// Instagram API
export {
  exchangeForLongLivedToken,
  getUserPages,
  getInstagramAccount,
  publishToInstagram,
  getMediaInsights,
  type InstagramAccount,
  type InstagramPage,
  type PublishedMedia,
} from './instagram-api';

// Facebook API
export {
  getUserPages as getFacebookPages,
  publishToFacebook,
  getPostInsights,
  type FacebookPage,
  type FacebookPost,
} from './facebook-api';

/**
 * Unified publish function - routes to correct platform
 */
export async function publishToSocial(
  brandProfileId: string,
  platform: string,
  content: {
    message: string;
    imageUrl?: string;
    scheduledTime?: Date;
  }
): Promise<{ success: boolean; postId?: string; permalink?: string; error?: string }> {
  const { getValidToken } = await import('./token-manager');
  
  const token = await getValidToken(brandProfileId, platform);
  
  if (!token) {
    return {
      success: false,
      error: `No valid ${platform} token found. Please reconnect your account.`,
    };
  }

  try {
    switch (platform) {
      case 'instagram': {
        if (!content.imageUrl) {
          return { success: false, error: 'Instagram requires an image' };
        }
        const { publishToInstagram } = await import('./instagram-api');
        const result = await publishToInstagram(token, content.imageUrl, content.message);
        return {
          success: true,
          postId: result.id,
          permalink: result.permalink,
        };
      }

      case 'facebook': {
        const { publishToFacebook } = await import('./facebook-api');
        const result = await publishToFacebook(token, content);
        return {
          success: true,
          postId: result.postId,
          permalink: result.permalink,
        };
      }

      default:
        return { success: false, error: `Platform ${platform} not supported yet` };
    }
  } catch (error) {
    console.error(`❌ [Social] Failed to publish to ${platform}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all connected accounts across all platforms for a brand
 */
export async function getAllConnectedAccounts(brandProfileId: string) {
  const { getConnectedAccounts } = await import('./token-manager');
  return getConnectedAccounts(brandProfileId);
}
