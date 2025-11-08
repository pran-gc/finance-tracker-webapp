"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Page from '@/components/page'
import Section from '@/components/section'
import { initDB } from '@/lib/db'
import { getTransactionsWithDetails, deleteTransaction } from '@/lib/data'

// Auth helper will be dynamically imported when needed to avoid triggering GIS flows

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Array<any>>([])
  const [signedIn, setSignedIn] = useState<boolean>(false)

  async function load() {
      try {
      // Ensure user is signed in and we have a valid token before attempting Drive calls.
      const auth = await import('@/lib/googleDrive')
      const signed = await auth.isSignedIn()
      const hasToken = typeof auth.hasValidAccessToken === 'function' ? auth.hasValidAccessToken() : false
      setSignedIn(Boolean(signed))
      if (!signed || !hasToken) {
        // Do not attempt remote Drive calls; leave transactions empty and show sign-in prompt.
        setTransactions([])
        return
      }

      await initDB()
      const txs = await getTransactionsWithDetails(1000)
      setTransactions(txs)
    } catch (err) {
      console.error('Failed to load transactions', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    load()

    function onChanged() {
      if (!mounted) return
      load()
    }

    window.addEventListener('finance:data:changed', onChanged)

    return () => {
      mounted = false
      window.removeEventListener('finance:data:changed', onChanged)
    }
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this transaction?')) return
    try {
      await deleteTransaction(id)
      // data change event will refresh the list
    } catch (err) {
      console.error('Failed to delete', err)
      alert('Failed to delete transaction')
    }
  }

  return (
    <Page>
      <Section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Transactions</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <div className="text-zinc-600 dark:text-zinc-400">Loading transactions…</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            {!signedIn ? (
              <>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">You must sign in with Google to view your transactions.</p>
                <button
                  onClick={async () => {
                    try {
                      const auth = await import('@/lib/googleDrive')
                      await auth.signIn()
                      // After interactive sign-in, try loading again
                      setLoading(true)
                      await load()
                    } catch (err) {
                      console.error('Sign in failed', err)
                      alert('Sign in failed')
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white"
                >
                  Sign in with Google
                </button>
              </>
            ) : (
              <>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">No transactions yet.</p>
                <Link href="/add-transaction" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white">
                  Add your first transaction
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                <div>
                  <div className="font-medium">{t.category_name} • <span className="text-sm text-zinc-500">{new Date(t.transaction_date).toLocaleDateString()}</span></div>
                  {t.description && <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.description}</div>}
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`font-semibold ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.currency_symbol}{Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>

                  <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600" aria-label="Delete">
                    <FontAwesomeIcon icon={faTimes} />
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
