import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, code, type } = body as { email?: string; code?: string; type?: string }
    if (!email || !code) return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })

    const normalizedEmail = String(email).trim().toLowerCase()

    // Query latest unused code for this email and type
    const q = adminDb.collection('authCodes')
      .where('email', '==', normalizedEmail)
      .where('type', '==', type || 'signup')
      .where('used', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(5)

    let matched: { id?: string; data: any } | undefined
    try {
      const snaps = await q.get()
      type CodeDoc = { id: string; data: any }
      snaps.forEach(doc => {
        const data: any = doc.data()
        if (data.code === code) matched = { id: doc.id, data }
      })
    } catch (readErr) {
      // fallback to local file store
      try {
        const file = path.resolve(process.cwd(), 'tmp', 'authCodes.json')
        const raw = await fs.readFile(file, 'utf-8')
        const arr = JSON.parse(raw || '[]')
        for (const item of arr.reverse()) {
          if (item.email === normalizedEmail && item.type === (type || 'signup') && item.code === code && !item.used) {
            matched = { data: item }
            break
          }
        }
      } catch (fileErr) {
        console.warn('No local fallback for verify-code or read failed', fileErr)
      }
    }

    if (!matched) return NextResponse.json({ ok: false, error: 'Invalid or expired code' }, { status: 400 })

    const expiresAt = matched.data.expiresAt instanceof Timestamp ? (matched.data.expiresAt as Timestamp).toDate() : new Date(matched.data.expiresAt)
    if (expiresAt < new Date()) return NextResponse.json({ ok: false, error: 'Code expired' }, { status: 400 })

    // Mark code used (try Firestore, otherwise update local file)
    try {
      if (matched.id) await adminDb.collection('authCodes').doc(matched.id).update({ used: true })
      else {
        const file = path.resolve(process.cwd(), 'tmp', 'authCodes.json')
        const raw = await fs.readFile(file, 'utf-8')
        const arr = JSON.parse(raw || '[]')
        for (const it of arr) {
          if (it.email === normalizedEmail && it.code === code && !it.used) { it.used = true; break }
        }
        await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf-8')
      }
    } catch (markErr) {
      console.warn('Failed to mark code used in primary store', markErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('verify-code error', err)
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}
