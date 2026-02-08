'use client';

/**
 * Connect Social Accounts Card
 * UI component for connecting and managing social media accounts
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-supabase';

interface ConnectedAccount {
  id: string;
  platform: string;
  accountId: string;
  accountName: string;
  accountType: 'page' | 'profile' | 'business';
  profilePicture?: string;
  isActive: boolean;
  connectedAt: string;
  expiresAt?: string;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

const PLATFORMS: Platform[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2', enabled: true },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', enabled: false },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', enabled: false },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000', enabled: false },
];

interface ConnectAccountsCardProps {
  brandProfileId: string;
  onAccountsChange?: (accounts: ConnectedAccount[]) => void;
}

export function ConnectAccountsCard({ brandProfileId, onAccountsChange }: ConnectAccountsCardProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Debug user state
  console.log('ConnectAccountsCard: User from useAuth:', user);

  // Fetch connected accounts
  useEffect(() => {
    fetchAccounts();
  }, [brandProfileId]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Get Supabase session for proper authentication
      if (user?.userId) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data: { session } } = await supabase.auth.getSession();

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('ConnectAccountsCard: Using Supabase session token');
          } else {
            headers['x-demo-user'] = user.userId;
            console.log('ConnectAccountsCard: No session, using demo user header');
          }
        } catch (error) {
          console.error('ConnectAccountsCard: Error getting session:', error);
          headers['x-demo-user'] = user.userId;
        }
      } else {
        headers['x-demo-user'] = 'demo';
        console.log('ConnectAccountsCard: No user, using demo header');
      }

      console.log('ConnectAccountsCard: Fetching accounts with headers:', headers);

      const response = await fetch(`/api/social/connections?brandProfileId=${brandProfileId}`, { headers });
      const data = await response.json();

      console.log('ConnectAccountsCard: API response status:', response.status);
      console.log('ConnectAccountsCard: API response:', data);

      if (response.ok && data.connections) {
        // Transform connections to match expected format
        const transformedAccounts = data.connections.map((conn: any) => ({
          id: conn.id,
          platform: conn.platform,
          accountId: conn.socialId,
          accountName: conn.profile?.username || conn.profile?.name || 'Unknown',
          accountType: conn.profile?.accountType || 'profile',
          profilePicture: conn.profile?.profile_picture_url,
          isActive: true,
          connectedAt: conn.createdAt,
          expiresAt: conn.updatedAt
        }));

        console.log('ConnectAccountsCard: Transformed accounts:', transformedAccounts);
        setAccounts(transformedAccounts);
        onAccountsChange?.(transformedAccounts);
      } else {
        console.log('ConnectAccountsCard: No connections found or API error:', data);
        setAccounts([]);
      }
    } catch (error) {
      console.error('ConnectAccountsCard: Failed to fetch accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = (platformId: string) => {
    setConnecting(platformId);
    // Redirect to OAuth flow - use correct endpoint structure
    // Pass userId to ensure the server knows who is connecting
    const userIdParam = user?.userId ? `&userId=${user.userId}` : '';
    window.location.href = `/api/social/oauth/${platformId}/start?brandProfileId=${brandProfileId}${userIdParam}`;
  };

  const disconnectAccount = async (platform: string, accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    try {
      setDisconnecting(`${platform}_${accountId}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Get proper authentication headers
      if (user?.userId) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data: { session } } = await supabase.auth.getSession();

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          } else {
            headers['x-demo-user'] = user.userId;
          }
        } catch (error) {
          headers['x-demo-user'] = user.userId;
        }
      } else {
        headers['x-demo-user'] = 'demo';
      }

      const response = await fetch(`/api/social/connections?platform=${platform}&brandProfileId=${brandProfileId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    } finally {
      setDisconnecting(null);
    }
  };

  const getAccountsForPlatform = (platformId: string) => {
    return accounts.filter(a => a.platform === platformId);
  };

  const isTokenExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔗 Connected Accounts
        </CardTitle>
        <CardDescription>
          Connect your social media accounts to publish content directly from Crevo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLATFORMS.map((platform) => {
          const platformAccounts = getAccountsForPlatform(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <div
              key={platform.id}
              className="flex items-start justify-between p-4 border rounded-lg"
              style={{ borderLeftColor: platform.color, borderLeftWidth: 4 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{platform.icon}</span>
                  <span className="font-medium">{platform.name}</span>
                  {!platform.enabled && (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  )}
                </div>

                {/* Connected accounts list */}
                {platformAccounts.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {platformAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between bg-muted/50 rounded-md p-2"
                      >
                        <div className="flex items-center gap-2">
                          {account.profilePicture ? (
                            <img
                              src={account.profilePicture}
                              alt={account.accountName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {platform.icon}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{account.accountName}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.accountType === 'business' ? 'Business Account' :
                                account.accountType === 'page' ? 'Page' : 'Profile'}
                            </p>
                          </div>
                          {isTokenExpiringSoon(account.expiresAt) ? (
                            <Badge variant="destructive" className="text-xs ml-2">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Expires Soon
                            </Badge>
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectAccount(account.platform, account.accountId)}
                          disabled={disconnecting === `${account.platform}_${account.accountId}`}
                        >
                          {disconnecting === `${account.platform}_${account.accountId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No accounts connected</p>
                )}
              </div>

              <Button
                variant={platformAccounts.length > 0 ? 'outline' : 'default'}
                size="sm"
                onClick={() => connectAccount(platform.id)}
                disabled={!platform.enabled || isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {platformAccounts.length > 0 ? 'Add Another' : 'Connect'}
              </Button>
            </div>
          );
        })}

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> For Instagram, you need an Instagram Business or Creator account
            connected to a Facebook Page. For Facebook, you need to be an admin of the Page you want to connect.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConnectAccountsCard;
