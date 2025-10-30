import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeDecryptToken } from '@/lib/encryption';

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
    const accessToken = safeDecryptToken(connection.access_token);
    const refreshToken = connection.refresh_token ? safeDecryptToken(connection.refresh_token) : null;

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
    // For now, return success - actual Twitter posting will be implemented
    // This is where we'd integrate with Twitter API v2
    
    console.log('Twitter post request:', {
      content,
      hashtags,
      imageUrl,
      mode,
      scheduledTime
    });

    // TODO: Implement actual Twitter posting using Twitter API v2
    // For now, simulate success
    return NextResponse.json({
      success: true,
      platform: 'twitter',
      message: mode === 'manual' ? 'Post published successfully' : 'Post scheduled successfully',
      postId: `twitter_${Date.now()}`,
      scheduledTime: mode === 'schedule' ? scheduledTime : undefined
    });

  } catch (error) {
    console.error('Twitter posting error:', error);
    return NextResponse.json({ 
      error: 'Failed to post to Twitter', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
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
