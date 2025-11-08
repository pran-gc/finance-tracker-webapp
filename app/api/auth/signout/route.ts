import { NextResponse } from 'next/server'

export async function GET() {
  // Server-side signout disabled — client-side gapi signOut should be used.
  return NextResponse.json({ error: 'Server-side signout disabled. Use client signOut.' }, { status: 410 })
}
