import { NextRequest, NextResponse } from 'next/server'
import { upsertUser, createSession, setSessionCookie } from '@/lib/session'
import { query } from '@/lib/database'

// This endpoint receives the Google OAuth token from the frontend
// and creates a server-side session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Verify the token with Google
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const profile = await response.json()

    // Create or update user in database
    const userId = await upsertUser(
      profile.sub,
      profile.email,
      profile.name || profile.email,
      profile.picture || null
    )

    // Check if user needs initial setup (first time login)
    const settings = await query<any[]>(
      'SELECT id FROM app_settings WHERE user_id = ? LIMIT 1',
      [userId]
    )

    const needsSetup = settings.length === 0

    // If first time user, seed default settings
    if (needsSetup) {
      await seedUserData(userId)
    }

    // Create session
    const sessionId = await createSession(userId)
    await setSessionCookie(sessionId)

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: profile.email,
        name: profile.name || profile.email,
        picture: profile.picture || null,
      },
      needsSetup,
    })
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Seed default settings for a new user (categories are global now)
async function seedUserData(userId: number) {
  // Get USD currency (should exist from schema.sql)
  const currencies = await query<{ id: number }[]>(
    'SELECT id FROM currencies WHERE code = ? LIMIT 1',
    ['USD']
  )

  const usdCurrencyId = currencies.length > 0 ? currencies[0].id : 1

  // Create default app settings
  await query(
    'INSERT INTO app_settings (user_id, default_currency_id) VALUES (?, ?)',
    [userId, usdCurrencyId]
  )
}
