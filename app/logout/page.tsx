"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing out...')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const gd = await import('@/lib/googleDrive')
        const sync = await import('@/lib/sync')
        const db = await import('@/lib/db')

        // Attempt best-effort backup only if we have a valid in-memory token
        try {
          if (gd.hasValidAccessToken && gd.hasValidAccessToken()) {
            setMessage('Backing up to Drive before sign out...')
            await sync.syncService.backupToDrive()
          }
        } catch (err) {
          console.warn('pre-signout backup failed', err)
        }

        setMessage('Clearing local data...')
        try { await gd.signOut() } catch (e) { console.warn('signOut failed', e) }
        try { await db.clearDB() } catch (e) { console.warn('clearDB failed', e) }

        if (!mounted) return
        router.replace('/login')
      } catch (err) {
        console.error('Logout flow failed', err)
        router.replace('/login')
      }
    })()

    return () => { mounted = false }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6">
        <div className="mb-4">{message}</div>
        <div className="text-sm text-zinc-500">Redirecting…</div>
      </div>
    </div>
  )
}
