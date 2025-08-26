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
  const clientId = process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/oauth/facebook/callback`;
  
  // Updated scope with proper formatting
  const scope = encodeURIComponent('public_profile,email'); // Note: email requires review for production
  
  // Added response_type and auth_type parameters
  const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&auth_type=rerequest`; // Important for getting email permission

  return NextResponse.redirect(fbUrl);
}
