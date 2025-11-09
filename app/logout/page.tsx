"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/clientAuth'

export default function LogoutPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Signing out...')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        setMessage('Signing out...')
        await signOut()

        if (!mounted) return
        router.replace('/login')
      } catch (err) {
        console.error('Logout failed', err)
        router.replace('/login')
      }
    })()

    return () => { mounted = false }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <div className="mb-4 text-zinc-700 dark:text-zinc-300">{message}</div>
        <div className="text-sm text-zinc-500">Redirecting…</div>
      </div>
    </div>
  )
}
