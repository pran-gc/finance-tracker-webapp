import { NextResponse } from 'next/server'

export async function GET() {
  // Server-side status route disabled for client-only auth
  return NextResponse.json({ error: 'Server-side status disabled. Use client gapi status.' }, { status: 410 })
}
