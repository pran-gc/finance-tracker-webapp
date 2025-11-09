import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { getAppSettings, updateAppSettings, getDefaultCurrency } from '@/lib/dataService'

// GET /api/settings - Get user's app settings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const settings = await getAppSettings(user.id)
    const defaultCurrency = await getDefaultCurrency(user.id)

    return NextResponse.json({
      settings: settings || null,
      defaultCurrency: defaultCurrency || null,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// PUT /api/settings - Update user's app settings
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { default_currency_id } = body

    if (!default_currency_id || typeof default_currency_id !== 'number') {
      return NextResponse.json(
        { error: 'Invalid default_currency_id' },
        { status: 400 }
      )
    }

    await updateAppSettings(user.id, default_currency_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
