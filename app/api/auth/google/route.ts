import { NextResponse } from 'next/server'

export async function GET() {
  // Server-side OAuth is disabled — this app uses client-side gapi authentication only.
  return NextResponse.json({ error: 'Server-side OAuth disabled. Use client sign-in.' }, { status: 410 })
}
