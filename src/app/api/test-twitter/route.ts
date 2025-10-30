import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeDecryptToken } from '@/lib/encryption';
import { TwitterApi } from 'twitter-api-v2';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get user's Twitter connection
    const { data: connections, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: 'No Twitter connection found' }, { status: 404 });
    }

    const connection = connections[0];
    
    // Decrypt access token
    console.log('Raw access token (first 20 chars):', connection.access_token?.substring(0, 20));
    console.log('Is encrypted:', connection.access_token?.includes(':'));
    
    const accessToken = safeDecryptToken(connection.access_token);
    const refreshToken = connection.refresh_token ? safeDecryptToken(connection.refresh_token) : null;
    
    console.log('Decrypted access token length:', accessToken?.length);
    console.log('Decrypted access token (first 20 chars):', accessToken?.substring(0, 20));
    
    // Test Twitter API connection
    const cleanToken = accessToken.replace('Bearer ', '');
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_CLIENT_ID!,
      appSecret: process.env.TWITTER_CLIENT_SECRET!,
      accessToken: cleanToken,
      accessSecret: '', // Not needed for OAuth 2.0
    });
    
    // Test getting user info
    const userInfo = await twitterClient.v2.me();
    console.log('Twitter user info:', userInfo.data);
    
    // Test posting a simple tweet
    const testTweet = await twitterClient.v2.tweet({
      text: 'Test tweet from Crevo app - ' + new Date().toISOString()
    });
    
    console.log('Test tweet posted:', testTweet.data);
    
    return NextResponse.json({
      success: true,
      user: userInfo.data,
      tweet: testTweet.data,
      connection: {
        platform: connection.platform,
        social_id: connection.social_id,
        has_refresh_token: !!refreshToken
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message,
      code: error.code,
      status: error.status
    }, { status: 500 });
  }
}
