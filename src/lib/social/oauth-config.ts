/**
 * Social Media OAuth Configuration
 * Centralized configuration for all social platform OAuth flows
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  oauth: OAuthConfig;
}

// Base URL for OAuth redirects
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3001';
};

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    enabled: true,
    oauth: {
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement',
        'business_management',
      ],
      redirectUri: `${getBaseUrl()}/api/oauth/instagram/callback`,
    },
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    enabled: true,
    oauth: {
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_read_user_content',
        'business_management',
      ],
      redirectUri: `${getBaseUrl()}/api/oauth/facebook/callback`,
    },
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    color: '#1DA1F2',
    enabled: false, // Enable when ready
    oauth: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      redirectUri: `${getBaseUrl()}/api/oauth/twitter/callback`,
    },
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    enabled: false, // Enable when ready
    oauth: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_liteprofile', 'w_member_social'],
      redirectUri: `${getBaseUrl()}/api/oauth/linkedin/callback`,
    },
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    enabled: false, // Enable when ready
    oauth: {
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      scopes: ['user.info.basic', 'video.publish', 'video.upload'],
      redirectUri: `${getBaseUrl()}/api/oauth/tiktok/callback`,
    },
  },
};

export function getPlatform(platformId: string): SocialPlatform | null {
  return SOCIAL_PLATFORMS[platformId] || null;
}

export function getEnabledPlatforms(): SocialPlatform[] {
  return Object.values(SOCIAL_PLATFORMS).filter(p => p.enabled);
}

export function buildAuthorizationUrl(
  platform: SocialPlatform,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: platform.oauth.clientId,
    redirect_uri: platform.oauth.redirectUri,
    scope: platform.oauth.scopes.join(','),
    response_type: 'code',
    state,
  });

  return `${platform.oauth.authorizationUrl}?${params.toString()}`;
}
