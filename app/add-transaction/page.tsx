"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Page from '@/components/page'
import Section from '@/components/section'
import { categoriesApi, transactionsApi, settingsApi } from '@/lib/api'

interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
}

export default function AddTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [currencySymbol, setCurrencySymbol] = useState<string>('$')
  const [description, setDescription] = useState<string>('')
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function prepare() {
      try {
        // Load categories and settings in parallel
        const [categoriesResponse, settingsResponse] = await Promise.all([
          categoriesApi.getAll(),
          settingsApi.get()
        ])

        if (!mounted) return

        setAllCategories(categoriesResponse.categories)

        // Filter by initial type
        const filtered = categoriesResponse.categories.filter((c: Category) => c.type === type)
        setCategories(filtered)
        setCategoryId(filtered[0]?.id ?? null)

        // Set currency symbol
        if (settingsResponse.defaultCurrency?.symbol) {
          setCurrencySymbol(settingsResponse.defaultCurrency.symbol)
        }
      } catch (err: any) {
        console.error('Failed to load data:', err)
        if (err.message?.includes('Unauthorized')) {
          router.push('/login')
        } else {
          setError(err.message || 'Failed to load data')
        }
      } finally {
        setLoading(false)
      }
    }

    prepare()

    return () => {
      mounted = false
    }
  }, [router, type])

  // Update visible categories whenever the selected type changes
  useEffect(() => {
    const filtered = allCategories.filter((c) => c.type === type)
    setCategories(filtered)
    // if the currently selected category is not in filtered list, pick the first
    if (!filtered.find((c) => c.id === categoryId)) {
      setCategoryId(filtered[0]?.id ?? null)
    }
  }, [type, allCategories, categoryId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (!categoryId) {
      setError('Please select a category')
      return
    }

    setSaving(true)

    try {
      await transactionsApi.create({
        category_id: Number(categoryId),
        amount: parsedAmount,
        description: description || undefined,
        transaction_date: transactionDate,
        type,
      })

      // Clear form fields and stay on page (keep date for batch entry)
      setAmount('')
      setDescription('')

      // Show success message briefly
      setError('✓ Transaction added successfully!')
      setTimeout(() => setError(null), 3000)
    } catch (err: any) {
      console.error('Failed to save transaction', err)
      setError(err?.message || 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Page>
      <Section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Transaction</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Record a new income or expense</p>
        </div>

        {/* Opening Balance Info Box */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Setting Your Opening Balance</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                To match your current bank balance, add an <strong>"Opening Balance"</strong> income transaction dated at the start of your tracking period.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Formula: Opening Balance = Current Bank Balance - (Last Month Income - Expenses)
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-md ${
            error.startsWith('✓')
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              error.startsWith('✓')
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  type === 'expense'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  type === 'income'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Category</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 dark:text-zinc-400 font-medium">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Date</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Description <span className="text-zinc-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || !categoryId}
              className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? 'Saving…' : 'Save Transaction'}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Section>
    </Page>
  )
}
