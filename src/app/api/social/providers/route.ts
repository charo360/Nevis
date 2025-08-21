import { NextResponse } from 'next/server';

export async function GET() {
  const facebook = !!(
    process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_API_KEY
  );
  const twitter = !!(process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID || process.env.TWITTER_CLIENT_SECRET);
  const instagram = !!(process.env.INSTAGRAM_APP_ID || process.env.INSTAGRAM_CLIENT_ID);
  const linkedin = !!(process.env.LINKEDIN_CLIENT_ID || process.env.LINKEDIN_APP_ID || process.env.LINKEDIN_CLIENT_SECRET);

  return NextResponse.json({ providers: { facebook, twitter, instagram, linkedin } });
}
