import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { getCategories, createCategory } from '@/lib/dataService'

// GET /api/categories - Get global categories
export async function GET(request: NextRequest) {
  try {
    await requireAuth() // Still require auth for API access
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'income' | 'expense' | null

    const categories = await getCategories(type || undefined)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST /api/categories - Create a new global category
export async function POST(request: NextRequest) {
  try {
    await requireAuth() // Still require auth for API access
    const body = await request.json()

    const { name, type } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Invalid category type' },
        { status: 400 }
      )
    }

    const categoryId = await createCategory(name, type)

    return NextResponse.json({ id: categoryId }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
