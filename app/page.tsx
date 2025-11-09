'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Page from '../components/page';
import Section from '../components/section';
import { transactionsApi, analyticsApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense';
  category_name: string;
  currency_symbol: string;
}

export default function Home() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Get current month's date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = endOfMonth.toISOString().split('T')[0];

        // Load recent transactions and analytics in parallel
        const [txResponse, analyticsResponse] = await Promise.all([
          transactionsApi.getAll(10, 0),
          analyticsApi.get(startDate, endDate)
        ]);

        setTransactions(txResponse.transactions);
        setSummary(analyticsResponse.summary);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        if (err.message?.includes('Unauthorized')) {
          router.push('/login');
        } else {
          setError(err.message || 'Failed to load dashboard');
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

    // Listen for currency changes and reload data
    const handleCurrencyChange = () => {
      setLoading(true);
      loadDashboard();
    };

    window.addEventListener('finance:currency:changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('finance:currency:changed', handleCurrencyChange);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading Finance Tracker...</p>
        </div>
      </div>
    );
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
    );
  }

  const balance = summary.income - summary.expense;

  return (
    <Page>
      <Section>
        <h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4'>
          Dashboard
        </h2>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
          <div className='p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>Income (This Month)</p>
            <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {currency?.symbol || '$'}{summary.income.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>

          <div className='p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>Expenses (This Month)</p>
            <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
              {currency?.symbol || '$'}{summary.expense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>

          <div className={`p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg ${balance >= 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'}`}>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {currency?.symbol || '$'}{Math.abs(balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-lg'>Recent Transactions</h3>
            <Link href="/transactions" className='text-sm text-indigo-600 dark:text-indigo-400 hover:underline'>
              View All
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className='text-center py-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg'>
              <p className='text-zinc-600 dark:text-zinc-400 mb-3'>No transactions yet</p>
              <Link href="/add-transaction" className='inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700'>
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className='space-y-2'>
              {transactions.map((t) => (
                <div key={t.id} className='flex items-center justify-between p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow'>
                  <div className='flex-1'>
                    <div className='font-medium text-zinc-900 dark:text-zinc-100'>{t.category_name}</div>
                    {t.description && <div className='text-sm text-zinc-600 dark:text-zinc-400'>{t.description}</div>}
                    <div className='text-xs text-zinc-500 mt-1'>{new Date(t.transaction_date).toLocaleDateString()}</div>
                  </div>
                  <div className={`font-semibold text-lg ${t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {t.type === 'expense' ? '-' : '+'}{t.currency_symbol}{Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section>
        <h3 className='font-semibold text-lg mb-4'>Quick Actions</h3>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <Link href="/add-transaction" className='block p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer'>
            <h4 className='font-medium text-zinc-900 dark:text-zinc-100'>Add Transaction</h4>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-1'>Record income or expenses</p>
          </Link>
          <Link href="/analytics" className='block p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer'>
            <h4 className='font-medium text-zinc-900 dark:text-zinc-100'>Analytics Dashboard</h4>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-1'>Visualize your financial data</p>
          </Link>
          <Link href="/transactions" className='block p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer'>
            <h4 className='font-medium text-zinc-900 dark:text-zinc-100'>View All Transactions</h4>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-1'>Review your transaction history</p>
          </Link>
        </div>
      </Section>
    </Page>
  );
}
