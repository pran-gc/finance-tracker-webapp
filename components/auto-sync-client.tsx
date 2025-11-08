"use client"

import { useEffect, useRef } from 'react'
import { startAutoSync } from '@/lib/autoSync'

export default function AutoSyncClient() {
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    // Start seeding and auto-sync only when the user is signed in.
    async function startIfSignedIn() {
      try {
        const auth = await import('@/lib/googleDrive')
        // Only proceed when the user is marked signed-in AND we have a valid in-memory access token.
        // Avoid attempting to silently obtain a token (which may open a popup and be blocked) during
        // background initialization. This prevents the GSI popup-blocked console error.
        const signed = await auth.isSignedIn()
        const hasValidToken = typeof auth.hasValidAccessToken === 'function' ? auth.hasValidAccessToken() : false
        if (!signed || !hasValidToken) return

        // Seed initial app data on first signed-in client load: currencies, categories, and settings.
        try {
          const mod = await import('@/lib/data')
          // seedCurrencies/seedCategories are idempotent (they check existing data)
          try { await mod.seedCurrencies() } catch (e) { console.warn('seedCurrencies failed', e) }
          try { await mod.seedCategories() } catch (e) { console.warn('seedCategories failed', e) }
          try { await mod.initializeSettings() } catch (e) { console.warn('initializeSettings failed', e) }
        } catch (err) {
          console.warn('initial seeding failed', err)
        }

        // Start auto-sync and keep stop function for cleanup
        try {
          const stop = startAutoSync()
          if (typeof stop === 'function') stopRef.current = stop
        } catch (err) {
          console.warn('startAutoSync failed', err)
        }
      } catch (err) {
        console.warn('AutoSyncClient auth check failed', err)
      }
    }

    startIfSignedIn()

    // Listen for auth changes so we can start/stop accordingly
    const handler = async () => {
      try {
        const auth = await import('@/lib/googleDrive')
        const signed = await auth.isSignedIn()
        if (signed) {
          // start if not already started
          if (!stopRef.current) await startIfSignedIn()
        } else {
          // stop auto-sync when signed out
          if (stopRef.current) {
            try { stopRef.current(); } catch (e) { console.warn('stopping autoSync failed', e) }
            stopRef.current = null
          }
        }
      } catch (err) {
        console.warn('auth change handler failed', err)
      }
    }

    window.addEventListener('finance:auth:changed', handler)

    return () => {
      if (stopRef.current) {
        try { stopRef.current(); } catch (e) { /* ignore */ }
        stopRef.current = null
      }
      window.removeEventListener('finance:auth:changed', handler)
      mounted = false
    }
  }, [])

  return null
}
