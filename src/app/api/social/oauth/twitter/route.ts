import { NextResponse } from 'next/server';
import { GET as startGET } from './start/route';

export async function POST(req: Request) {
  try {
    // Debug: log the incoming headers
    console.log('[twitter-post] Authorization header:', req.headers.get('authorization'));

    // Create a new Request object with GET method but preserve headers and URL
    const url = new URL(req.url);
    const getRequest = new Request(url.toString(), {
      method: 'GET',
      headers: req.headers,
    });

    // Call the start GET handler to generate the OAuth redirect response
    const startResponse: any = await startGET(getRequest);

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
