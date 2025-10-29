import { NextResponse } from 'next/server';

export async function GET() {
  // Only Twitter is currently implemented
  const twitter = !!(process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID || process.env.TWITTER_CLIENT_SECRET);
  
  // Facebook, Instagram, and LinkedIn are coming soon
  const facebook = false; // Coming soon
  const instagram = false; // Coming soon  
  const linkedin = false; // Coming soon

  return NextResponse.json({ providers: { facebook, twitter, instagram, linkedin } });
}
