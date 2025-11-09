import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import {
  getTransactionsWithDetails,
  createTransaction,
} from '@/lib/dataService'

// GET /api/transactions - Get user's transactions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const transactions = await getTransactionsWithDetails(user.id, limit, offset)

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { category_id, amount, description, transaction_date, type } = body

    // Validate required fields
    if (!category_id || !amount || !transaction_date || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    const transactionId = await createTransaction(
      user.id,
      category_id,
      amount,
      description || null,
      transaction_date,
      type
    )

    return NextResponse.json({ id: transactionId }, { status: 201 })
  } catch (error: any) {
    console.error('Create transaction error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Invalid category') {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
