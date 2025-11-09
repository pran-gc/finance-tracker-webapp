import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { query } from '@/lib/database'

// GET /api/analytics/detailed - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    // Get spending by category
    const spendingByCategory = await query<any[]>(
      `SELECT
        c.name,
        c.type,
        SUM(t.amount) as total,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense'
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      GROUP BY c.id, c.name, c.type
      ORDER BY total DESC`,
      [user.id, startDate, endDate]
    )

    // Get income by category
    const incomeByCategory = await query<any[]>(
      `SELECT
        c.name,
        c.type,
        SUM(t.amount) as total,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'income'
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      GROUP BY c.id, c.name, c.type
      ORDER BY total DESC`,
      [user.id, startDate, endDate]
    )

    // Get daily trend (income vs expense over time)
    const dailyTrend = await query<any[]>(
      `SELECT
        t.transaction_date as date,
        t.type,
        SUM(t.amount) as total
      FROM transactions t
      WHERE t.user_id = ?
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      GROUP BY t.transaction_date, t.type
      ORDER BY t.transaction_date ASC`,
      [user.id, startDate, endDate]
    )

    // Get monthly comparison (current period vs previous period)
    const currentPeriodStats = await query<any[]>(
      `SELECT
        type,
        SUM(amount) as total,
        COUNT(id) as count,
        AVG(amount) as average
      FROM transactions
      WHERE user_id = ?
        AND transaction_date >= ? AND transaction_date <= ?
      GROUP BY type`,
      [user.id, startDate, endDate]
    )

    // Calculate date range for previous period
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - daysDiff)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const previousPeriodStats = await query<any[]>(
      `SELECT
        type,
        SUM(amount) as total,
        COUNT(id) as count
      FROM transactions
      WHERE user_id = ?
        AND transaction_date >= ? AND transaction_date <= ?
      GROUP BY type`,
      [user.id, prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]]
    )

    // Get top expense categories
    const topExpenses = await query<any[]>(
      `SELECT
        c.name,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense'
        AND t.transaction_date >= ? AND t.transaction_date <= ?
      GROUP BY c.id, c.name
      ORDER BY total DESC
      LIMIT 10`,
      [user.id, startDate, endDate]
    )

    // Get transaction count by day of week
    const transactionsByDayOfWeek = await query<any[]>(
      `SELECT
        DAYOFWEEK(transaction_date) as day_of_week,
        COUNT(id) as count,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense_total,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income_total
      FROM transactions
      WHERE user_id = ?
        AND transaction_date >= ? AND transaction_date <= ?
      GROUP BY DAYOFWEEK(transaction_date)
      ORDER BY day_of_week`,
      [user.id, startDate, endDate]
    )

    return NextResponse.json({
      spendingByCategory,
      incomeByCategory,
      dailyTrend,
      currentPeriodStats,
      previousPeriodStats,
      topExpenses,
      transactionsByDayOfWeek,
    })
  } catch (error) {
    console.error('Get detailed analytics error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
