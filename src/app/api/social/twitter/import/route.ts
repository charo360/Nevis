import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { TwitterApi } from 'twitter-api-v2'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const LOCAL_CONN = path.resolve(process.cwd(), 'tmp', 'social-connections.json')
const VOICE_STORE = path.resolve(process.cwd(), 'tmp', 'voice-samples.json')

async function readJson(file: string): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

async function writeJson(file: string, data: Record<string, any>) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
}

function getTwitterClientCredentials() {
  const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_SECRET_KEY
  if (!clientId || !clientSecret) throw new Error('Twitter client credentials missing (TWITTER_CLIENT_ID/SECRET)')
  return { clientId, clientSecret } as const
}

async function fetchSamples(client: TwitterApi, limit: number) {
  // Get the authenticated user id
  const me = await client.v2.me()
  const max = Math.max(1, Math.min(limit, 100))
  const timeline = await client.v2.userTimeline(me.data.id, {
    max_results: max,
    exclude: ['replies', 'retweets'],
    'tweet.fields': ['created_at', 'lang', 'public_metrics'],
  } as any)

  const tweets = (timeline as any).tweets || (timeline as any).data || []
  return (tweets as any[]).slice(0, limit).map((t) => ({
    id: t.id,
    text: t.text,
    created_at: t.created_at,
    lang: t.lang,
    metrics: t.public_metrics,
  }))
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    let userId: string | null = null

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1]
      const decoded = verifyToken(idToken)
      userId = decoded?.userId || null
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'))
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse optional limit
    let limit = 25
    try {
      const body = await req.json().catch(() => ({}))
      if (body && typeof body.limit === 'number') limit = Math.max(1, Math.min(50, body.limit))
    } catch {}

    // Load connection
    const conns = await readJson(LOCAL_CONN)
    const key = `${userId}_twitter`
    const conn = conns[key]
    if (!conn || !conn.accessToken) {
      return NextResponse.json({ error: 'Twitter account not connected' }, { status: 400 })
    }

    let accessToken: string = conn.accessToken
    let refreshToken: string | null = conn.accessTokenSecret || null // stored as accessTokenSecret historically

    async function runWith(client: TwitterApi) {
      const samples = await fetchSamples(client, limit)
      // Persist to voice store
      const store = await readJson(VOICE_STORE)
      store[`${userId}_twitter`] = {
        userId,
        platform: 'twitter',
        updatedAt: new Date().toISOString(),
        count: samples.length,
        samples,
      }
      await writeJson(VOICE_STORE, store)
      return samples
    }

    try {
      const client = new TwitterApi(accessToken)
      const samples = await runWith(client)
      return NextResponse.json({ ok: true, imported: samples.length, platform: 'twitter' })
    } catch (e: any) {
      const isAuthError = e?.code === 401 || /Unauthorized|expired|invalid/i.test(String(e?.message || ''))
      if (!isAuthError || !refreshToken) {
        console.error('Twitter import failed:', e?.message || e)
        return NextResponse.json({ error: 'Failed to import tweets' }, { status: 500 })
      }
    }

    // Refresh and retry
    try {
      const { clientId, clientSecret } = getTwitterClientCredentials()
      const appClient = new TwitterApi({ clientId, clientSecret })
      const { client: refreshed, accessToken: at, refreshToken: rt } = await appClient.refreshOAuth2Token(refreshToken!)

      // Persist fresh tokens
      conns[key] = { ...conn, accessToken: at, accessTokenSecret: rt || conn.accessTokenSecret || null, updatedAt: new Date().toISOString() }
      await writeJson(LOCAL_CONN, conns)

      const samples = await runWith(refreshed)
      return NextResponse.json({ ok: true, imported: samples.length, platform: 'twitter', refreshed: true })
    } catch (err: any) {
      console.error('Twitter import (refresh) failed:', err?.message || err)
      return NextResponse.json({ error: 'Failed to import tweets (refresh failed)' }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

