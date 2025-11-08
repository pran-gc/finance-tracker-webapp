"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Page from '@/components/page'
import Section from '@/components/section'
import { initDB } from '@/lib/db'
import { getCategories, addTransaction, seedCategories, getDefaultCurrency } from '@/lib/data'
import { isSignedIn } from '@/lib/googleDrive'
import { syncService } from '@/lib/sync'

export default function AddTransactionPage() {
  const router = useRouter()
  const [dbReady, setDbReady] = useState(false)
  const [allCategories, setAllCategories] = useState<Array<any>>([])
  const [categories, setCategories] = useState<Array<any>>([])
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
      await initDB()

      // Ensure categories exist (seed if empty)
      let cats = await getCategories()
      if (cats.length === 0) {
        await seedCategories()
        cats = await getCategories()
      }

      // Deduplicate categories by name (some environments may have seeded twice)
      const uniqueByName = Array.from(
        new Map(cats.map((c: any) => [String(c.name).trim(), c])).values()
      )

  if (!mounted) return
  setAllCategories(uniqueByName)
  // apply initial filter by current type (initial)
  const filtered = uniqueByName.filter((c: any) => c.type === type)
  setCategories(filtered)
  setCategoryId(filtered[0]?.id ?? null)
      // load default currency symbol
      try {
        const def = await getDefaultCurrency()
        if (def && def.symbol) setCurrencySymbol(def.symbol)
      } catch (e) {
        // ignore
      }
      setDbReady(true)
    }

    prepare()

    return () => {
      mounted = false
    }
  }, [])

  // Update visible categories whenever the selected type or allCategories change
  useEffect(() => {
    const filtered = allCategories.filter((c: any) => c.type === type)
    setCategories(filtered)
    // if the currently selected category is not in filtered list, pick the first
    if (!filtered.find((c: any) => c.id === categoryId)) {
      setCategoryId(filtered[0]?.id ?? null)
    }
  }, [type, allCategories])

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
      await addTransaction({
        category_id: Number(categoryId),
        amount: parsedAmount,
        description: description || '',
        transaction_date: transactionDate,
        type,
      })

        // If signed in, back up to Drive to keep cloud copy as source-of-truth
        try {
          if (await isSignedIn()) {
            await syncService.backupToDrive()
          }
        } catch (backupErr) {
          console.warn('Backup after transaction failed', backupErr)
        }

      // Brief confirmation then navigate back
      router.push('/')
    } catch (err: any) {
      console.error('Failed to save transaction', err)
      setError(err?.message || 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Preparing data…</p>
        </div>
      </div>
    )
  }

  return (
    <Page>
      <Section>
        <h1 className="text-2xl font-bold mb-4">Add Transaction</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`px-3 py-2 rounded-md ${type === 'expense' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`px-3 py-2 rounded-md ${type === 'income' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 px-10 py-2 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Date</label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900"
            />
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Transaction'}
            </button>

            <button type="button" onClick={() => router.back()} className="text-sm text-zinc-600 dark:text-zinc-300">
              Cancel
            </button>
          </div>
        </form>
      </Section>
    </Page>
  )
}
