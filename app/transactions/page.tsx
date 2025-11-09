"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Page from '@/components/page'
import Section from '@/components/section'
import { transactionsApi } from '@/lib/api'

interface Transaction {
  id: number
  amount: number
  description: string
  transaction_date: string
  type: 'income' | 'expense'
  category_name: string
  currency_symbol: string
}

export default function TransactionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadTransactions() {
    try {
      setLoading(true)
      const { transactions: data } = await transactionsApi.getAll(1000, 0)
      setTransactions(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load transactions', err)
      if (err.message?.includes('Unauthorized')) {
        router.push('/login')
      } else {
        setError(err.message || 'Failed to load transactions')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()

    // Listen for currency changes and reload data
    const handleCurrencyChange = () => {
      loadTransactions()
    }

    window.addEventListener('finance:currency:changed', handleCurrencyChange)

    return () => {
      window.removeEventListener('finance:currency:changed', handleCurrencyChange)
    }
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this transaction?')) return
    try {
      await transactionsApi.delete(id)
      // Reload transactions after delete
      await loadTransactions()
    } catch (err: any) {
      console.error('Failed to delete', err)
      alert('Failed to delete transaction: ' + (err.message || 'Unknown error'))
    }
  }

  return (
    <Page>
      <Section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Transactions</h1>
          <Link href="/add-transaction" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            Add New
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <div className="text-zinc-600 dark:text-zinc-400">Loading transactions…</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadTransactions()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No transactions yet.</p>
            <Link href="/add-transaction" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              Add your first transaction
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.category_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {new Date(t.transaction_date).toLocaleDateString()}
                    </span>
                  </div>
                  {t.description && <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.description}</div>}
                </div>

                <div className="flex items-center gap-4">
                  <div className={`font-bold text-lg ${t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {t.type === 'expense' ? '-' : '+'}{t.currency_symbol}{Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label="Delete transaction"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Page>
  )
}
