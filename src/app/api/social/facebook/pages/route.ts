import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const LOCAL_STORE = path.resolve(process.cwd(), 'tmp', 'social-connections.json');

async function readLocalStore(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization') || '';
  const demoUser = url.searchParams.get('demoUser') || 'demo';

  try {
    let userId: string | null = null;
    let accessToken: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.split(' ')[1];
      // For now, we'll use a simple userId from query or generate one
      userId = url.searchParams.get('userId') || 'user_' + Date.now();
    } else {
      // Fallback for demo/development
      userId = demoUser;
    }

    // Get stored Facebook connection
    const store = await readLocalStore();
    const userConnections = store[userId] || {};
    const facebookConnection = userConnections.facebook;

    if (!facebookConnection || !facebookConnection.accessToken) {
      return NextResponse.json({ error: 'No Facebook access token found' }, { status: 401 });
    }

    // Fetch user's pages
    const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
    pagesUrl.searchParams.append('access_token', facebookConnection.accessToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson: any = await pagesRes.json();

    if (pagesJson.error) {
      console.error('Facebook pages error:', pagesJson.error);
      return NextResponse.json({ error: pagesJson.error }, { status: 400 });
    }

    return NextResponse.json(pagesJson.data || []);
  } catch (error) {
    console.error('Facebook pages API error:', error);
    return NextResponse.json({ error: 'Failed to load Facebook pages' }, { status: 500 });
  }
}
