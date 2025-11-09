"use client"

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Page from '@/components/page'
import Section from '@/components/section'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import dynamic from 'next/dynamic'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt, faPalette } from '@fortawesome/free-solid-svg-icons'

import { signOut } from '@/lib/clientAuth'

const CurrencyModal = dynamic(() => import('@/components/currency-modal'), { ssr: false })

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [openCurrencyModal, setOpenCurrencyModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (!confirm('Are you sure you want to sign out?')) return

    setSigningOut(true)
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Sign out failed', err)
      alert('Sign out failed. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <Page>
      <Section>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Manage your preferences and account</p>
        </div>

        <div className="space-y-3">
          <div className="grid gap-2">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <FontAwesomeIcon icon={faPalette} aria-hidden className="h-5 w-5" />
              <span className="flex-1 text-left">{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setOpenCurrencyModal(true)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1 text-left">Change Currency</span>
            </Button>
          </div>
        </div>
      </Section>

      {openCurrencyModal && (
        <CurrencyModal open={openCurrencyModal} onClose={() => setOpenCurrencyModal(false)} />
      )}

      <div className="mt-auto w-full">
        <div className="p-6 pt-8 w-full">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center gap-3 px-4 py-3"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <FontAwesomeIcon icon={faSignOutAlt} aria-hidden className="h-5 w-5" />
            <span className="text-center">{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </Button>
        </div>
      </div>
    </Page>
  )
}