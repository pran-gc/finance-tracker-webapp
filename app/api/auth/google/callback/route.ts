import { NextResponse } from 'next/server'

export async function GET() {
  // Server-side OAuth callback disabled — use client-side gapi flows instead.
  return NextResponse.json({ error: 'Server-side OAuth disabled. Use client sign-in.' }, { status: 410 })
}
