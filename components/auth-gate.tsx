"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated } from '@/lib/clientAuth'

export default function AuthGate() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const authed = await isAuthenticated()
        if (!authed) {
          // If not already on /login, redirect there
          if (mounted && pathname !== '/login') {
            router.push('/login')
          }
        } else {
          // If signed in and currently on /login, send them home
          if (mounted && pathname === '/login') {
            router.push('/')
          }
        }
      } catch (err) {
        console.warn('AuthGate check failed', err)
      }
    }

    check()

    const handler = () => check()
    window.addEventListener('finance:auth:changed', handler)

    return () => {
      mounted = false
      window.removeEventListener('finance:auth:changed', handler)
    }
  }, [pathname, router])

  return null
}
