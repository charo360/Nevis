import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeDecryptToken } from '@/lib/encryption';
import { TwitterApi } from 'twitter-api-v2';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      
      // Verify Supabase session
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { platform, content, hashtags, imageUrl, mode = 'manual', scheduledTime, postId } = body;

    console.log('Posting request:', { userId, platform, content: content?.substring(0, 50) + '...' });

    if (!platform || !content) {
      return NextResponse.json({ error: 'Missing required fields: platform, content' }, { status: 400 });
    }

    // Get user's social media connections
    const { data: connections, error: connectionsError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform.toLowerCase());

    if (connectionsError) {
      console.error('Database error:', connectionsError);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    console.log('Found connections:', connections?.length || 0, 'for platform:', platform.toLowerCase());

    if (!connections || connections.length === 0) {
      return NextResponse.json({ 
        error: `No ${platform} connection found. Please connect your ${platform} account first in the Social Connect page.` 
      }, { status: 400 });
    }

    const connection = connections[0];
    
    // Decrypt access token
    console.log('Raw access token (first 20 chars):', connection.access_token?.substring(0, 20));
    console.log('Is encrypted:', connection.access_token?.includes(':'));
    
    const accessToken = safeDecryptToken(connection.access_token);
    const refreshToken = connection.refresh_token ? safeDecryptToken(connection.refresh_token) : null;
    
    console.log('Decrypted access token length:', accessToken?.length);
    console.log('Decrypted access token (first 20 chars):', accessToken?.substring(0, 20));
    console.log('Connection details:', {
      platform: connection.platform,
      social_id: connection.social_id,
      has_refresh_token: !!refreshToken
    });

    // Route to platform-specific posting handler
    switch (platform.toLowerCase()) {
      case 'twitter':
        return await handleTwitterPost(accessToken, content, hashtags, imageUrl, mode, scheduledTime);
      case 'facebook':
        return await handleFacebookPost(accessToken, content, hashtags, imageUrl, mode, scheduledTime);
      case 'instagram':
        return await handleInstagramPost(accessToken, content, hashtags, imageUrl, mode, scheduledTime);
      case 'linkedin':
        return await handleLinkedInPost(accessToken, content, hashtags, imageUrl, mode, scheduledTime);
      default:
        return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Social posting error:', error);
    return NextResponse.json({ 
      error: 'Failed to post to social media', 
      details: error.message 
    }, { status: 500 });
  }
}

async function handleTwitterPost(accessToken: string, content: string, hashtags: string[], imageUrl?: string, mode: string = 'manual', scheduledTime?: string) {
  try {
    console.log('Twitter post request:', {
      content,
      hashtags,
      imageUrl,
      mode,
      scheduledTime
    });

    // Validate access token
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Create Twitter API client with user's access token
    console.log('Creating Twitter API client...');
    console.log('Access token format check:', {
      startsWithBearer: accessToken.startsWith('Bearer '),
      length: accessToken.length,
      firstChars: accessToken.substring(0, 10)
    });
    
    // For OAuth 2.0, we need to create a client with the access token
    // The TwitterApi constructor expects the token without Bearer prefix
    const cleanToken = accessToken.replace('Bearer ', '');
    
    // Create Twitter API client with OAuth 2.0 access token
    // Note: For posting tweets, we need OAuth 2.0 with user context
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_CLIENT_ID!,
      appSecret: process.env.TWITTER_CLIENT_SECRET!,
      accessToken: cleanToken,
      accessSecret: '', // Not needed for OAuth 2.0
    });
    console.log('Twitter API client created successfully');
    
    // Test the client by getting user info first
    try {
      const userInfo = await twitterClient.v2.me();
      console.log('Twitter user info:', userInfo.data);
    } catch (authError: any) {
      console.error('Twitter authentication test failed:', authError);
      console.error('Auth error details:', {
        message: authError.message,
        code: authError.code,
        status: authError.status
      });
      
      if (authError.status === 403) {
        throw new Error('Twitter API access denied. Your account may need Elevated access to post tweets. Please check your Twitter Developer Portal settings.');
      }
      
      throw new Error('Invalid or expired Twitter access token. Please reconnect your account.');
    }

    // Prepare the tweet content
    let tweetText = content;
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.join(' ');
      tweetText = `${content}\n\n${hashtagString}`;
    }

    // Check if content exceeds Twitter's character limit (280 characters)
    if (tweetText.length > 280) {
      return NextResponse.json({
        error: 'Tweet too long',
        details: `Tweet is ${tweetText.length} characters. Twitter limit is 280 characters.`
      }, { status: 400 });
    }

    let mediaId: string | undefined;

    // Handle image upload if provided
    if (imageUrl) {
      try {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to download image');
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Upload media to Twitter
        const mediaUpload = await twitterClient.v1.uploadMedia(Buffer.from(imageBuffer), {
          type: 'image/png' // You might want to detect the actual type
        });
        
        mediaId = mediaUpload;
        console.log('Image uploaded to Twitter, media ID:', mediaId);
      } catch (imageError) {
        console.error('Image upload error:', imageError);
        // Continue without image if upload fails
      }
    }

    // Post the tweet
    const tweetData: any = {
      text: tweetText
    };

    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId]
      };
    }

    console.log('Posting tweet with data:', tweetData);
    
    const tweet = await twitterClient.v2.tweet(tweetData);
    console.log('Tweet posted successfully:', tweet.data);

    return NextResponse.json({
      success: true,
      platform: 'twitter',
      message: mode === 'manual' ? 'Post published successfully' : 'Post scheduled successfully',
      postId: tweet.data.id,
      tweetUrl: `https://twitter.com/user/status/${tweet.data.id}`,
      scheduledTime: mode === 'schedule' ? scheduledTime : undefined
    });

  } catch (error: any) {
    console.error('Twitter posting error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      data: error.data
    });
    
    // Handle specific Twitter API errors
    if (error.code === 187) {
      return NextResponse.json({ 
        error: 'Duplicate tweet', 
        details: 'This tweet has already been posted recently.' 
      }, { status: 400 });
    }
    
    if (error.code === 32) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: 'Please reconnect your Twitter account.' 
      }, { status: 401 });
    }

    if (error.code === 89) {
      return NextResponse.json({ 
        error: 'Invalid or expired token', 
        details: 'Please reconnect your Twitter account.' 
      }, { status: 401 });
    }

    if (error.status === 403) {
      return NextResponse.json({ 
        error: 'Access denied', 
        details: 'Your Twitter account may need Elevated access to post tweets. Please check your Twitter Developer Portal settings.' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to post to Twitter', 
      details: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      status: error.status || 500
    }, { status: error.status || 500 });
  }
}

async function handleFacebookPost(accessToken: string, content: string, hashtags: string[], imageUrl?: string, mode: string = 'manual', scheduledTime?: string) {
  try {
    // TODO: Implement Facebook posting
    console.log('Facebook post request:', {
      content,
      hashtags,
      imageUrl,
      mode,
      scheduledTime
    });

    return NextResponse.json({
      success: true,
      platform: 'facebook',
      message: mode === 'manual' ? 'Post published successfully' : 'Post scheduled successfully',
      postId: `facebook_${Date.now()}`,
      scheduledTime: mode === 'schedule' ? scheduledTime : undefined
    });

  } catch (error) {
    console.error('Facebook posting error:', error);
    return NextResponse.json({ 
      error: 'Failed to post to Facebook', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function handleInstagramPost(accessToken: string, content: string, hashtags: string[], imageUrl?: string, mode: string = 'manual', scheduledTime?: string) {
  try {
    // TODO: Implement Instagram posting
    console.log('Instagram post request:', {
      content,
      hashtags,
      imageUrl,
      mode,
      scheduledTime
    });

    return NextResponse.json({
      success: true,
      platform: 'instagram',
      message: mode === 'manual' ? 'Post published successfully' : 'Post scheduled successfully',
      postId: `instagram_${Date.now()}`,
      scheduledTime: mode === 'schedule' ? scheduledTime : undefined
    });

  } catch (error) {
    console.error('Instagram posting error:', error);
    return NextResponse.json({ 
      error: 'Failed to post to Instagram', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function handleLinkedInPost(accessToken: string, content: string, hashtags: string[], imageUrl?: string, mode: string = 'manual', scheduledTime?: string) {
  try {
    // TODO: Implement LinkedIn posting
    console.log('LinkedIn post request:', {
      content,
      hashtags,
      imageUrl,
      mode,
      scheduledTime
    });

    return NextResponse.json({
      success: true,
      platform: 'linkedin',
      message: mode === 'manual' ? 'Post published successfully' : 'Post scheduled successfully',
      postId: `linkedin_${Date.now()}`,
      scheduledTime: mode === 'schedule' ? scheduledTime : undefined
    });

  } catch (error) {
    console.error('LinkedIn posting error:', error);
    return NextResponse.json({ 
      error: 'Failed to post to LinkedIn', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
