"use client"

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Page from '@/components/page'
import Section from '@/components/section'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt, faUser, faShieldAlt, faCog, faBell, faPalette, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons'

import { signOut as clientSignOut, isSignedIn } from '@/lib/googleDrive'
import { syncService } from '@/lib/sync'
import { clearDB } from '@/lib/db'
import { exportSnapshotVisibleFolder } from '@/lib/remoteDb'
// NOTE: currency modal handles loading/updating currencies client-side

const CurrencyModal = dynamic(() => import('@/components/currency-modal'), { ssr: false })

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  async function handleSignOut() {
    try {
      // Only attempt final backup if we have a valid in-memory token
      try {
        const gd = await import('@/lib/googleDrive')
        if (gd.hasValidAccessToken && gd.hasValidAccessToken()) {
          try {
            await syncService.backupToDrive()
          } catch (err) {
            console.warn('Backup before sign-out failed', err)
          }
        }
      } catch (err) {
        console.warn('skip backup pre-signout', err)
      }

      // Perform client sign-out
      await clientSignOut()

      // Clear local DB to minimize leftover local data
      try {
        await clearDB()
      } catch (err) {
        console.warn('Clearing local DB failed', err)
      }

      router.push('/login')
    } catch (err) {
      console.error('Sign out failed', err)
      router.push('/login')
    }
  }

  // Currency modal state (opens client-only modal)
  const [openCurrencyModal, setOpenCurrencyModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const signed = await isSignedIn()
      if (!signed) {
        router.push('/login')
        return
      }

      const fileId = await exportSnapshotVisibleFolder()
      // Provide simple feedback
      alert('Exported data to Drive. File ID: ' + fileId)
    } catch (err) {
      console.error('Export failed', err)
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Page>
      <Section>

        <div className="space-y-3">
          <div className="grid gap-3">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <FontAwesomeIcon icon={faPalette} aria-hidden className="h-5 w-5" />
              <span className="text-center">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              onClick={() => router.push('/profile')}
            >
              <FontAwesomeIcon icon={faUser} aria-hidden className="h-5 w-5" />
              <span className="text-center">Profile</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              onClick={() => router.push('/security')}
            >
              <FontAwesomeIcon icon={faShieldAlt} aria-hidden className="h-5 w-5" />
              <span className="text-center">Security</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              onClick={() => router.push('/settings/general')}
            >
              <FontAwesomeIcon icon={faCog} aria-hidden className="h-5 w-5" />
              <span className="text-center">General</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              onClick={() => router.push('/settings/notifications')}
            >
              <FontAwesomeIcon icon={faBell} aria-hidden className="h-5 w-5" />
              <span className="text-center">Notifications</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-center gap-3 px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              onClick={() => setOpenCurrencyModal(true)}
            >
              <FontAwesomeIcon icon={faCog} aria-hidden className="h-5 w-5" />
              <span className="text-center">Change Currency</span>
            </Button>
          </div>
        </div>
      </Section>
      {openCurrencyModal && (
        <CurrencyModal open={openCurrencyModal} onClose={() => setOpenCurrencyModal(false)} />
      )}

      <div className="mt-auto w-full">
        <div className="p-6 pt-8 w-full">
          <div className="mb-4" />

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 px-3 py-3 mb-3"
            onClick={handleExport}
            disabled={exporting}
          >
            <FontAwesomeIcon icon={faCloudUploadAlt} aria-hidden className="h-5 w-5" />
            <span className="text-center">{exporting ? 'Exporting...' : 'Export Data'}</span>
          </Button>

          <Button
            variant="destructive"
            className="w-full flex items-center justify-center gap-3 px-3 py-3"
            onClick={handleSignOut}
          >
            <FontAwesomeIcon icon={faSignOutAlt} aria-hidden className="h-5 w-5" />
            <span className="text-center">Sign Out</span>
          </Button>
        </div>
      </div>
    </Page>
  )
}