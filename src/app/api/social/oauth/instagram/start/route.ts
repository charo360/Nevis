import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const STATE_STORE = path.resolve(process.cwd(), 'tmp', 'oauth-states.json');

async function readStates() {
  try {
    const raw = await fs.readFile(STATE_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writeStates(data: any) {
  await fs.mkdir(path.dirname(STATE_STORE), { recursive: true });
  await fs.writeFile(STATE_STORE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const demoUser = url.searchParams.get('demoUser') || 'demo-user';

  const state = crypto.randomBytes(12).toString('hex');
  const states = await readStates();
  states[state] = { demoUser, createdAt: Date.now() };
  await writeStates(states);

  const clientId = process.env.INSTAGRAM_APP_ID;
  if (!clientId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    console.error('Instagram client id missing');
    return NextResponse.redirect(`${baseUrl}/social-connect?error=instagram_not_configured`);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/oauth/instagram/callback`;
  const scope = 'user_profile,user_media';

  const igUrl = new URL('https://api.instagram.com/oauth/authorize');
  igUrl.searchParams.append('client_id', clientId);
  igUrl.searchParams.append('redirect_uri', redirectUri);
  igUrl.searchParams.append('scope', scope);
  igUrl.searchParams.append('response_type', 'code');
  igUrl.searchParams.append('state', state);

  console.log('Instagram start:', { state, demoUser, redirect: igUrl.toString() });

  return NextResponse.redirect(igUrl.toString());
}
