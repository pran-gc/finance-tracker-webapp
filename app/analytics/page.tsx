'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Page from '@/components/page'
import Section from '@/components/section'
import { analyticsApi } from '@/lib/api'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6',
  '#ef4444', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
]

export default function AnalyticsPage() {
  const router = useRouter()
  const { currency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const getDateRange = (selectedPeriod: TimePeriod): { start: string; end: string } => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (selectedPeriod) {
      case 'week':
        start = subDays(now, 7)
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'quarter':
        start = subDays(now, 90)
        break
      case 'year':
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case 'custom':
        if (customStart && customEnd) {
          return { start: customStart, end: customEnd }
        }
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      default:
        start = startOfMonth(now)
        end = endOfMonth(now)
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    }
  }

  useEffect(() => {
    async function loadAnalytics() {
      try {
        // Keep existing data visible while loading new data (no flash)
        if (!data) setLoading(true)
        setError(null)
        const { start, end } = getDateRange(period)
        const response = await analyticsApi.getDetailed(start, end)
        setData(response)
      } catch (err: any) {
        console.error('Failed to load analytics:', err)
        if (err.message?.includes('Unauthorized')) {
          router.push('/login')
        } else {
          setError(err.message || 'Failed to load analytics')
        }
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [period, customStart, customEnd, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Page>
        <Section>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        </Section>
      </Page>
    )
  }

  if (!data) return null

  const currSymbol = currency?.symbol || '$'

  // Calculate summary statistics
  const currentIncome = data.currentPeriodStats.find((s: any) => s.type === 'income')?.total || 0
  const currentExpense = data.currentPeriodStats.find((s: any) => s.type === 'expense')?.total || 0
  const currentBalance = currentIncome - currentExpense
  const prevIncome = data.previousPeriodStats.find((s: any) => s.type === 'income')?.total || 0
  const prevExpense = data.previousPeriodStats.find((s: any) => s.type === 'expense')?.total || 0

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0

  // Transform daily trend data for line chart
  const trendData: any[] = []
  const dateMap = new Map<string, any>()

  data.dailyTrend.forEach((item: any) => {
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, { date: format(new Date(item.date), 'MMM dd'), income: 0, expense: 0 })
    }
    const entry = dateMap.get(item.date)
    if (item.type === 'income') {
      entry.income = Number(item.total)
    } else {
      entry.expense = Number(item.total)
    }
  })

  dateMap.forEach((value) => trendData.push(value))
  trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Prepare expense pie chart data
  const expensePieData = data.spendingByCategory.map((item: any) => ({
    name: item.name,
    value: Number(item.total),
  }))

  // Prepare income pie chart data
  const incomePieData = data.incomeByCategory.map((item: any) => ({
    name: item.name,
    value: Number(item.total),
  }))

  // Day of week data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekdayData = data.transactionsByDayOfWeek.map((item: any) => ({
    day: dayNames[item.day_of_week - 1],
    income: Number(item.income_total),
    expense: Number(item.expense_total),
  }))

  return (
    <Page>
      <Section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 sm:mb-0">
            Analytics Dashboard
          </h1>

          {/* Time Period Selector */}
          <div className="flex flex-wrap gap-2">
            {(['week', 'month', 'quarter', 'year', 'custom'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {period === 'custom' && (
          <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards with Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {currSymbol}
              {currentIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {prevIncome > 0 && (
              <p
                className={`text-xs mt-1 ${
                  incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange).toFixed(1)}% vs previous period
              </p>
            )}
          </div>

          <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {currSymbol}
              {currentExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {prevExpense > 0 && (
              <p
                className={`text-xs mt-1 ${
                  expenseChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange).toFixed(1)}% vs previous period
              </p>
            )}
          </div>

          <div
            className={`p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg ${
              currentBalance >= 0
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
                : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
            }`}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Net Balance</p>
            <p
              className={`text-2xl font-bold ${
                currentBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              {currentBalance >= 0 ? '+' : '-'}
              {currSymbol}
              {Math.abs(currentBalance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Savings Rate: {currentIncome > 0 ? ((currentBalance / currentIncome) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Income vs Expense Trend */}
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Income vs Expense Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Expense Distribution */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Expense Distribution by Category
            </h3>
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensePieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      `${currSymbol}${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-zinc-500 py-12">No expense data available</p>
            )}
          </div>

          {/* Income Distribution */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Income Distribution by Category
            </h3>
            {incomePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomePieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      `${currSymbol}${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-zinc-500 py-12">No income data available</p>
            )}
          </div>
        </div>

        {/* Spending by Day of Week */}
        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Activity by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value: any) =>
                  `${currSymbol}${Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Expenses */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Top 10 Expense Categories</h3>
          <div className="space-y-3">
            {data.topExpenses.map((item: any, index: number) => {
              const percentage = currentExpense > 0 ? (item.total / currentExpense) * 100 : 0
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {currSymbol}
                      {Number(item.total).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {percentage.toFixed(1)}% of total expenses • {item.count} transactions
                  </p>
                </div>
              )
            })}
            {data.topExpenses.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No expense data available</p>
            )}
          </div>
        </div>
      </Section>
    </Page>
  )
}
