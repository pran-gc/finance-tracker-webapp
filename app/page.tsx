'use client';

import { useEffect, useState } from 'react';
import { initDB } from '../lib/db';
import Page from '../components/page';
import Section from '../components/section';

export default function Home() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading Finance Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <Page>
      <Section>
        <h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
          Welcome to Finance Tracker
        </h2>

        <div className='mt-2'>
          <p className='text-zinc-600 dark:text-zinc-400'>
            Track your finances locally and sync with Google Drive for cross-device access.
            Your data stays private and secure.
          </p>

          <br />

          <p className='text-sm text-zinc-600 dark:text-zinc-400'>
            Built with Next.js 16, React 19, and modern web technologies for the best PWA experience.
          </p>
        </div>
      </Section>

      <Section>
        <h3 className='font-medium mb-4'>Quick Actions</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg'>
            <h4 className='font-medium text-zinc-900 dark:text-zinc-100'>Add Transaction</h4>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-1'>Record income or expenses</p>
          </div>
          <div className='p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg'>
            <h4 className='font-medium text-zinc-900 dark:text-zinc-100'>View Reports</h4>
            <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-1'>Analyze your spending patterns</p>
          </div>
        </div>
      </Section>
    </Page>
  );
}
