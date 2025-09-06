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

    // Get the access token from local store (previously stored)
    const localStore = await readLocalStore();
    const userConnections = localStore[userId] || {};
    const instagramConnection = userConnections.instagram;

    if (!instagramConnection || !instagramConnection.accessToken) {
      return NextResponse.json({ error: 'No Instagram access token found' }, { status: 401 });
    }

    const fbAccessToken = instagramConnection.accessToken;

    // Get Facebook pages associated with the user
    const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
    pagesUrl.searchParams.append('access_token', fbAccessToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson: any = await pagesRes.json();

    if (pagesJson.error) {
      console.error('Facebook pages error:', pagesJson.error);
      return NextResponse.json({ error: 'Failed to get Facebook pages' }, { status: 500 });
    }

    const accounts: any[] = [];

    // For each page, check if it has an Instagram business account
    for (const page of pagesJson.data || []) {
      const igAccountUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}`);
      igAccountUrl.searchParams.append('fields', 'instagram_business_account');
      igAccountUrl.searchParams.append('access_token', fbAccessToken);

      const igAccountRes = await fetch(igAccountUrl.toString());
      const igAccountJson: any = await igAccountRes.json();

      if (!igAccountJson.error && igAccountJson.instagram_business_account) {
        // Get Instagram account info
        const igInfoUrl = new URL(`https://graph.facebook.com/v19.0/${igAccountJson.instagram_business_account.id}`);
        igInfoUrl.searchParams.append('fields', 'username,profile_picture_url');
        igInfoUrl.searchParams.append('access_token', fbAccessToken);

        const igInfoRes = await fetch(igInfoUrl.toString());
        const igInfoJson: any = await igInfoRes.json();

        if (!igInfoJson.error) {
          accounts.push({
            id: igAccountJson.instagram_business_account.id,
            username: igInfoJson.username,
            profile_picture: igInfoJson.profile_picture_url,
            page_id: page.id,
            page_name: page.name
          });
        }
      }
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Instagram accounts error:', error);
    return NextResponse.json({ error: 'Failed to load Instagram accounts' }, { status: 500 });
  }
}
