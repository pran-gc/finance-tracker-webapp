import { NextResponse } from 'next/server'
import { getSessionIdFromCookie, deleteSession, deleteSessionCookie } from '@/lib/session'

export async function POST() {
  try {
    const sessionId = await getSessionIdFromCookie()

    if (sessionId) {
      // Delete session from database
      await deleteSession(sessionId)
    }

    // Delete session cookie
    await deleteSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sign out error:', error)
    // Still try to delete the cookie even if database operation fails
    try {
      await deleteSessionCookie()
    } catch (e) {
      // Ignore cookie deletion errors
    }
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
