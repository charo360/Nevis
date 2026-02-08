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

const DEBUG_LOG = path.resolve(process.cwd(), 'tmp', 'oauth-start.log');

async function logDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  try {
    await fs.mkdir(path.dirname(DEBUG_LOG), { recursive: true });
    await fs.appendFile(DEBUG_LOG, logEntry, 'utf-8');
  } catch (e) {
    console.error('Failed to write debug log:', e);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization') || '';

  // Get user ID from Bearer token or query param
  let userId: string | null = null;
  let accessToken: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
    userId = url.searchParams.get('userId') || 'user_' + Date.now();
  } else {
    // If accessed via browser navigation, check for userId query param or default to demo
    userId = url.searchParams.get('userId') || 'demo';
  }

  // Get brand profile ID from query params
  const brandProfileId = url.searchParams.get('brandProfileId') || '';

  try {
    // Determine Base URL
    // Priority: Env Var -> Request Origin -> Default
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      baseUrl = `${url.protocol}//${url.host}`;
    }
    
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    const callbackUrl = `${baseUrl}/api/social/oauth/instagram/callback`;
    
    await logDebug('Starting Instagram OAuth', { 
      baseUrl, 
      callbackUrl, 
      userId, 
      brandProfileId,
      envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      requestUrl: req.url
    });
    
    // Instagram Business accounts use Facebook's OAuth system
    // This is required because Instagram Graph API only supports business accounts
    const clientId = process.env.META_APP_ID!;
    
    console.log('Instagram OAuth - Using Facebook OAuth for Instagram Business accounts');
    console.log('Instagram OAuth - Callback URL:', callbackUrl);
    console.log('Instagram OAuth - Client ID:', clientId);

    if (!clientId) {
      await logDebug('Error: META_APP_ID is missing');
      return NextResponse.redirect(`${baseUrl}/settings?error=config_error&message=Missing_App_ID`);
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(12).toString('hex');
    const states = await readStates();
    states[state] = {
      userId,
      accessToken,
      brandProfileId,
      createdAt: Date.now()
    };
    await writeStates(states);

    // Instagram Graph API scopes for business accounts
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'business_management'
    ];

    // Facebook OAuth URL with Instagram permissions
    const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&scope=${encodeURIComponent(scopes.join(','))}` +
      `&response_type=code` +
      `&state=${state}`;

    console.log('Instagram OAuth - Redirecting to Facebook OAuth:', facebookAuthUrl);
    await logDebug('Redirecting to Facebook', { facebookAuthUrl });

    return NextResponse.redirect(facebookAuthUrl);
  } catch (error) {
    await logDebug('Exception during start', { error: String(error) });
    console.error('Instagram OAuth initiation error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/settings?error=instagram_oauth_failed`);
  }
}
