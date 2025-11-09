import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import {
  getIncomeAndExpenseForPeriod,
  getSpendingByCategory,
  getIncomeByCategory,
} from '@/lib/dataService'

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing start_date or end_date parameters' },
        { status: 400 }
      )
    }

    const [summary, spendingByCategory, incomeByCategory] = await Promise.all([
      getIncomeAndExpenseForPeriod(user.id, startDate, endDate),
      getSpendingByCategory(user.id, startDate, endDate),
      getIncomeByCategory(user.id, startDate, endDate),
    ])

    return NextResponse.json({
      summary,
      spendingByCategory,
      incomeByCategory,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
