import { NextResponse } from 'next/server';
import { GET as startGET } from './start/route';

export async function POST(req: Request) {
  try {
    // Call the start GET handler to generate the OAuth redirect response
    const startResponse: any = await startGET(req as any);

    // The start handler issues a redirect; extract the Location header
    const location = startResponse?.headers?.get?.('location') || startResponse?.headers?.get('Location');

    if (location) {
      return NextResponse.json({ url: location });
    }

    return NextResponse.json({ error: 'failed_to_generate_oauth_url' }, { status: 500 });
  } catch (err) {
    console.error('Twitter OAuth POST proxy error:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
