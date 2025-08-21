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

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    console.error('LinkedIn client id missing');
    return NextResponse.redirect(`${baseUrl}/social-connect?error=linkedin_not_configured`);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/oauth/linkedin/callback`;
  // pass space-separated scopes and let URLSearchParams encode them once
  const scope = 'r_liteprofile r_emailaddress';

  const linkedinUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  linkedinUrl.searchParams.append('response_type', 'code');
  linkedinUrl.searchParams.append('client_id', clientId);
  linkedinUrl.searchParams.append('redirect_uri', redirectUri);
  linkedinUrl.searchParams.append('state', state);
  linkedinUrl.searchParams.append('scope', scope);

  console.log('LinkedIn start:', { state, demoUser, redirect: linkedinUrl.toString() });

  return NextResponse.redirect(linkedinUrl.toString());
}
