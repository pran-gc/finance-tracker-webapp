import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

// Get current authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
