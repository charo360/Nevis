/**
 * Facebook Graph API Client
 * Handles Facebook Page operations
 */

import { SocialToken } from './token-manager';

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  category?: string;
  picture?: string;
  fanCount?: number;
}

export interface FacebookPost {
  id: string;
  postId: string;
  permalink?: string;
  createdTime?: string;
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Get Facebook Pages the user manages
 */
export async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?` +
    `fields=id,name,access_token,category,picture,fan_count&` +
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
    category: page.category,
    picture: page.picture?.data?.url,
    fanCount: page.fan_count,
  }));
}

/**
 * Get page access token (long-lived)
 */
export async function getPageAccessToken(
  pageId: string,
  userAccessToken: string
): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}?` +
    `fields=access_token&` +
    `access_token=${userAccessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get page token: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Publish a photo post to Facebook Page
 */
export async function publishPhotoPost(
  pageId: string,
  pageAccessToken: string,
  options: {
    imageUrl: string;
    message?: string;
    published?: boolean;
    scheduledPublishTime?: number; // Unix timestamp
  }
): Promise<FacebookPost> {
  const params = new URLSearchParams({
    url: options.imageUrl,
    access_token: pageAccessToken,
  });

  if (options.message) {
    params.append('message', options.message);
  }

  if (options.published === false) {
    params.append('published', 'false');
  }

  if (options.scheduledPublishTime) {
    params.append('scheduled_publish_time', options.scheduledPublishTime.toString());
    params.append('published', 'false');
  }

  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/photos?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to publish photo: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    postId: data.post_id || data.id,
  };
}

/**
 * Publish a text post to Facebook Page
 */
export async function publishTextPost(
  pageId: string,
  pageAccessToken: string,
  options: {
    message: string;
    link?: string;
    published?: boolean;
    scheduledPublishTime?: number;
  }
): Promise<FacebookPost> {
  const params = new URLSearchParams({
    message: options.message,
    access_token: pageAccessToken,
  });

  if (options.link) {
    params.append('link', options.link);
  }

  if (options.published === false) {
    params.append('published', 'false');
  }

  if (options.scheduledPublishTime) {
    params.append('scheduled_publish_time', options.scheduledPublishTime.toString());
    params.append('published', 'false');
  }

  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/feed?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to publish post: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    postId: data.id,
  };
}

/**
 * Get post permalink
 */
export async function getPostPermalink(
  postId: string,
  accessToken: string
): Promise<string | null> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${postId}?` +
    `fields=permalink_url&` +
    `access_token=${accessToken}`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.permalink_url || null;
}

/**
 * Full publish flow for Facebook
 */
export async function publishToFacebook(
  token: SocialToken,
  options: {
    message: string;
    imageUrl?: string;
    scheduledTime?: Date;
  }
): Promise<FacebookPost> {
  console.log(`📘 [Facebook] Publishing to page ${token.accountId}`);

  const scheduledPublishTime = options.scheduledTime
    ? Math.floor(options.scheduledTime.getTime() / 1000)
    : undefined;

  let post: FacebookPost;

  if (options.imageUrl) {
    post = await publishPhotoPost(token.accountId, token.accessToken, {
      imageUrl: options.imageUrl,
      message: options.message,
      scheduledPublishTime,
    });
  } else {
    post = await publishTextPost(token.accountId, token.accessToken, {
      message: options.message,
      scheduledPublishTime,
    });
  }

  // Get permalink
  const permalink = await getPostPermalink(post.postId, token.accessToken);
  post.permalink = permalink || undefined;

  console.log(`🎉 [Facebook] Published! ID: ${post.postId}`);
  return post;
}

/**
 * Get post insights
 */
export async function getPostInsights(
  postId: string,
  accessToken: string
): Promise<Record<string, number>> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${postId}/insights?` +
    `metric=post_impressions,post_reach,post_engaged_users,post_clicks&` +
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

/**
 * Delete a scheduled post
 */
export async function deletePost(
  postId: string,
  accessToken: string
): Promise<boolean> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${postId}?access_token=${accessToken}`,
    { method: 'DELETE' }
  );

  return response.ok;
}

export default {
  getUserPages,
  getPageAccessToken,
  publishPhotoPost,
  publishTextPost,
  getPostPermalink,
  publishToFacebook,
  getPostInsights,
  deletePost,
};
