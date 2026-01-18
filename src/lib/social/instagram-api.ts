/**
 * Instagram Graph API Client
 * Handles Instagram Business account operations
 */

import { SocialToken } from './token-manager';

export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  followersCount: number;
  mediaCount: number;
  biography?: string;
}

export interface InstagramPage {
  id: string;
  name: string;
  accessToken: string;
  instagramBusinessAccount?: InstagramAccount;
}

export interface MediaContainer {
  id: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  statusCode?: string;
}

export interface PublishedMedia {
  id: string;
  permalink?: string;
  timestamp?: string;
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Exchange short-lived token for long-lived token
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${process.env.META_APP_ID}&` +
    `client_secret=${process.env.META_APP_SECRET}&` +
    `fb_exchange_token=${shortLivedToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange token: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // Default 60 days
  };
}

/**
 * Get Facebook Pages the user manages
 */
export async function getUserPages(accessToken: string): Promise<InstagramPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?` +
    `fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count,biography}&` +
    `access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get pages: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return (data.data || []).map((page: any) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
    instagramBusinessAccount: page.instagram_business_account ? {
      id: page.instagram_business_account.id,
      username: page.instagram_business_account.username,
      name: page.instagram_business_account.name,
      profilePictureUrl: page.instagram_business_account.profile_picture_url,
      followersCount: page.instagram_business_account.followers_count,
      mediaCount: page.instagram_business_account.media_count,
      biography: page.instagram_business_account.biography,
    } : undefined,
  }));
}

/**
 * Get Instagram Business Account details
 */
export async function getInstagramAccount(
  instagramAccountId: string,
  accessToken: string
): Promise<InstagramAccount> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}?` +
    `fields=id,username,name,profile_picture_url,followers_count,media_count,biography&` +
    `access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Instagram account: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    username: data.username,
    name: data.name,
    profilePictureUrl: data.profile_picture_url,
    followersCount: data.followers_count,
    mediaCount: data.media_count,
    biography: data.biography,
  };
}

/**
 * Create a media container for publishing
 */
export async function createMediaContainer(
  instagramAccountId: string,
  accessToken: string,
  options: {
    imageUrl: string;
    caption?: string;
    mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  }
): Promise<MediaContainer> {
  const params = new URLSearchParams({
    image_url: options.imageUrl,
    access_token: accessToken,
  });

  if (options.caption) {
    params.append('caption', options.caption);
  }

  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}/media?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create media container: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return { id: data.id, status: 'IN_PROGRESS' };
}

/**
 * Check media container status
 */
export async function checkMediaStatus(
  containerId: string,
  accessToken: string
): Promise<MediaContainer> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${containerId}?` +
    `fields=status_code&` +
    `access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to check media status: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    id: containerId,
    status: data.status_code === 'FINISHED' ? 'FINISHED' : 
            data.status_code === 'ERROR' ? 'ERROR' : 'IN_PROGRESS',
    statusCode: data.status_code,
  };
}

/**
 * Publish a media container
 */
export async function publishMedia(
  instagramAccountId: string,
  containerId: string,
  accessToken: string
): Promise<PublishedMedia> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}/media_publish?` +
    `creation_id=${containerId}&` +
    `access_token=${accessToken}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to publish media: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  // Get permalink
  const mediaResponse = await fetch(
    `${GRAPH_API_BASE}/${data.id}?` +
    `fields=permalink,timestamp&` +
    `access_token=${accessToken}`
  );

  if (mediaResponse.ok) {
    const mediaData = await mediaResponse.json();
    return {
      id: data.id,
      permalink: mediaData.permalink,
      timestamp: mediaData.timestamp,
    };
  }

  return { id: data.id };
}

/**
 * Full publish flow: create container, wait for processing, publish
 */
export async function publishToInstagram(
  token: SocialToken,
  imageUrl: string,
  caption: string
): Promise<PublishedMedia> {
  console.log(`📸 [Instagram] Publishing to account ${token.accountId}`);

  // Step 1: Create media container
  const container = await createMediaContainer(
    token.accountId,
    token.accessToken,
    { imageUrl, caption }
  );

  console.log(`📦 [Instagram] Created container ${container.id}`);

  // Step 2: Wait for processing (poll status)
  let status = container;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max

  while (status.status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await checkMediaStatus(container.id, token.accessToken);
    attempts++;
  }

  if (status.status === 'ERROR') {
    throw new Error(`Media processing failed: ${status.statusCode}`);
  }

  if (status.status !== 'FINISHED') {
    throw new Error('Media processing timed out');
  }

  console.log(`✅ [Instagram] Container ready, publishing...`);

  // Step 3: Publish
  const published = await publishMedia(
    token.accountId,
    container.id,
    token.accessToken
  );

  console.log(`🎉 [Instagram] Published! ID: ${published.id}`);
  return published;
}

/**
 * Get recent media insights
 */
export async function getMediaInsights(
  mediaId: string,
  accessToken: string
): Promise<Record<string, number>> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${mediaId}/insights?` +
    `metric=impressions,reach,engagement,saved&` +
    `access_token=${accessToken}`
  );

  if (!response.ok) {
    return {};
  }

  const data = await response.json();
  const insights: Record<string, number> = {};

  for (const metric of data.data || []) {
    insights[metric.name] = metric.values?.[0]?.value || 0;
  }

  return insights;
}

export default {
  exchangeForLongLivedToken,
  getUserPages,
  getInstagramAccount,
  createMediaContainer,
  checkMediaStatus,
  publishMedia,
  publishToInstagram,
  getMediaInsights,
};
