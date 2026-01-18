/**
 * Social Media Token Manager
 * Handles storing, retrieving, and refreshing OAuth tokens
 */

import { createClient } from '@supabase/supabase-js';

export interface SocialToken {
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: string;
  scope?: string;
  accountId: string;
  accountName: string;
  accountType: 'page' | 'profile' | 'business';
  profilePicture?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectedAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  accountType: 'page' | 'profile' | 'business';
  profilePicture?: string;
  isActive: boolean;
  connectedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

/**
 * Save social token to database
 */
export async function saveToken(
  brandProfileId: string,
  token: SocialToken
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`🔐 [Token] Saving ${token.platform} token for brand ${brandProfileId}`);

  // Get existing connected accounts
  const { data: profile } = await supabase
    .from('brand_profiles')
    .select('connected_accounts')
    .eq('id', brandProfileId)
    .single();

  const existingAccounts = (profile?.connected_accounts || []) as ConnectedAccount[];

  // Check if this account already exists
  const existingIndex = existingAccounts.findIndex(
    a => a.platform === token.platform && a.accountId === token.accountId
  );

  const newAccount: ConnectedAccount = {
    id: `${token.platform}_${token.accountId}`,
    platform: token.platform,
    accountId: token.accountId,
    accountName: token.accountName,
    accountType: token.accountType,
    profilePicture: token.profilePicture,
    isActive: true,
    connectedAt: new Date(),
    expiresAt: token.expiresAt,
  };

  if (existingIndex >= 0) {
    existingAccounts[existingIndex] = {
      ...existingAccounts[existingIndex],
      ...newAccount,
      connectedAt: existingAccounts[existingIndex].connectedAt, // Keep original connect date
    };
  } else {
    existingAccounts.push(newAccount);
  }

  // Update brand profile with connected accounts
  await supabase
    .from('brand_profiles')
    .update({ connected_accounts: existingAccounts })
    .eq('id', brandProfileId);

  // Store encrypted token separately (more secure)
  await supabase.from('social_tokens').upsert({
    brand_profile_id: brandProfileId,
    platform: token.platform,
    account_id: token.accountId,
    access_token: token.accessToken, // In production, encrypt this
    refresh_token: token.refreshToken,
    expires_at: token.expiresAt?.toISOString(),
    token_type: token.tokenType,
    scope: token.scope,
    metadata: token.metadata,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'brand_profile_id,platform,account_id',
  });

  console.log(`✅ [Token] Saved ${token.platform} token for ${token.accountName}`);
}

/**
 * Get token for a platform
 */
export async function getToken(
  brandProfileId: string,
  platform: string,
  accountId?: string
): Promise<SocialToken | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('social_tokens')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .eq('platform', platform);

  if (accountId) {
    query = query.eq('account_id', accountId);
  }

  const { data } = await query.limit(1).single();

  if (!data) return null;

  return {
    platform: data.platform,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    tokenType: data.token_type,
    scope: data.scope,
    accountId: data.account_id,
    accountName: data.metadata?.account_name || 'Unknown',
    accountType: data.metadata?.account_type || 'profile',
    metadata: data.metadata,
  };
}

/**
 * Get all connected accounts for a brand
 */
export async function getConnectedAccounts(
  brandProfileId: string
): Promise<ConnectedAccount[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('brand_profiles')
    .select('connected_accounts')
    .eq('id', brandProfileId)
    .single();

  return (data?.connected_accounts || []) as ConnectedAccount[];
}

/**
 * Disconnect a social account
 */
export async function disconnectAccount(
  brandProfileId: string,
  platform: string,
  accountId: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`🔌 [Token] Disconnecting ${platform} account ${accountId}`);

  // Remove from connected_accounts array
  const { data: profile } = await supabase
    .from('brand_profiles')
    .select('connected_accounts')
    .eq('id', brandProfileId)
    .single();

  const accounts = (profile?.connected_accounts || []) as ConnectedAccount[];
  const filtered = accounts.filter(
    a => !(a.platform === platform && a.accountId === accountId)
  );

  await supabase
    .from('brand_profiles')
    .update({ connected_accounts: filtered })
    .eq('id', brandProfileId);

  // Delete token
  await supabase
    .from('social_tokens')
    .delete()
    .eq('brand_profile_id', brandProfileId)
    .eq('platform', platform)
    .eq('account_id', accountId);

  console.log(`✅ [Token] Disconnected ${platform} account`);
}

/**
 * Check if token is expired or expiring soon
 */
export function isTokenExpired(token: SocialToken, bufferMinutes: number = 5): boolean {
  if (!token.expiresAt) return false;
  
  const bufferMs = bufferMinutes * 60 * 1000;
  return new Date(token.expiresAt).getTime() - bufferMs < Date.now();
}

/**
 * Refresh an expired token (Meta/Facebook)
 */
export async function refreshMetaToken(
  brandProfileId: string,
  token: SocialToken
): Promise<SocialToken | null> {
  if (!token.refreshToken && token.accessToken) {
    // For long-lived tokens, try to exchange for a new one
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${process.env.META_APP_ID}&` +
        `client_secret=${process.env.META_APP_SECRET}&` +
        `fb_exchange_token=${token.accessToken}`
      );

      if (!response.ok) {
        console.error('❌ [Token] Failed to refresh Meta token');
        return null;
      }

      const data = await response.json();
      
      const newToken: SocialToken = {
        ...token,
        accessToken: data.access_token,
        expiresAt: data.expires_in 
          ? new Date(Date.now() + data.expires_in * 1000)
          : undefined,
      };

      await saveToken(brandProfileId, newToken);
      return newToken;
    } catch (error) {
      console.error('❌ [Token] Error refreshing Meta token:', error);
      return null;
    }
  }

  return null;
}

/**
 * Get valid token, refreshing if needed
 */
export async function getValidToken(
  brandProfileId: string,
  platform: string,
  accountId?: string
): Promise<SocialToken | null> {
  const token = await getToken(brandProfileId, platform, accountId);
  
  if (!token) return null;

  // Check if expired
  if (isTokenExpired(token)) {
    console.log(`🔄 [Token] Token expired, attempting refresh...`);
    
    if (platform === 'instagram' || platform === 'facebook') {
      return await refreshMetaToken(brandProfileId, token);
    }
    
    // For other platforms, return null (user needs to reconnect)
    return null;
  }

  return token;
}

export default {
  saveToken,
  getToken,
  getConnectedAccounts,
  disconnectAccount,
  isTokenExpired,
  refreshMetaToken,
  getValidToken,
};
