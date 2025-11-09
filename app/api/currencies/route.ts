import { NextRequest, NextResponse } from 'next/server'
import { getCurrencies } from '@/lib/dataService'

// GET /api/currencies - Get all active currencies
export async function GET(request: NextRequest) {
  try {
    const currencies = await getCurrencies()
    return NextResponse.json({ currencies })
  } catch (error) {
    console.error('Get currencies error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
