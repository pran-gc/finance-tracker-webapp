"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/clientAuth'

export default function LoginClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    setLoading(true)
    try {
      await signIn()
      router.push('/')
    } catch (err: any) {
      console.error('Sign in failed', err)
      setError(err?.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center"
      style={{ backgroundImage: "url('/financeapp.jpg')" }}
    >
      <div className="w-full">
        <div className="mx-auto max-w-screen-lg px-6">
          <div className="hidden lg:flex h-[80vh] items-stretch">
            <div className="flex-1" />

            <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 rounded-xl shadow-lg p-8 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Finance Tracker</h1>
                <p className="text-zinc-600 dark:text-zinc-300 mt-6 text-lg">Smart, secure budgeting with cloud database sync.</p>
              </div>

              <div className="mt-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Continue with your Google account to sync across devices.</p>

                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border rounded-md shadow-sm hover:shadow-md transition bg-white disabled:opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M533.5 278.4c0-18.5-1.5-37-4.6-54.8H272v103.8h147.4c-6.4 34.9-25.6 64.4-54.7 84.1v69.9h88.4c51.8-47.7 82.4-118.2 82.4-203z" fill="#4285F4"/>
                    <path d="M272 544.3c73.8 0 135.8-24.6 181.1-66.7l-88.4-69.9c-24.6 16.5-56.6 26.3-92.7 26.3-71 0-131.1-47.9-152.6-112.2H29.7v70.6C74.5 492 166 544.3 272 544.3z" fill="#34A853"/>
                    <path d="M119.4 326.8c-10.6-31.8-10.6-66 0-97.8V158.4H29.7c-40.9 80.3-40.9 175.2 0 255.6l89.7-87.2z" fill="#FBBC05"/>
                    <path d="M272 107.7c39.9 0 75.9 13.7 104.2 40.8l78.1-78.1C407.7 24.6 345.7 0 272 0 166 0 74.5 52.3 29.7 130.3l89.7 87.2C140.9 155.6 201 107.7 272 107.7z" fill="#EA4335"/>
                  </svg>

                  <span className="text-sm font-medium">{loading ? 'Signing in…' : 'Continue with Google'}</span>
                </button>

                {error && <p className="text-red-600 mt-3">{error}</p>}
              </div>
            </div>
          </div>

          <div className="lg:hidden min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 rounded-xl shadow-lg p-8 mx-4">
              <h1 className="text-2xl font-semibold">Finance Tracker</h1>
              <p className="text-zinc-600 dark:text-zinc-300 mt-4">Smart, secure budgeting with cloud database sync.</p>

              <div className="mt-6">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border rounded-md shadow-sm hover:shadow-md transition bg-white disabled:opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M533.5 278.4c0-18.5-1.5-37-4.6-54.8H272v103.8h147.4c-6.4 34.9-25.6 64.4-54.7 84.1v69.9h88.4c51.8-47.7 82.4-118.2 82.4-203z" fill="#4285F4"/>
                    <path d="M272 544.3c73.8 0 135.8-24.6 181.1-66.7l-88.4-69.9c-24.6 16.5-56.6 26.3-92.7 26.3-71 0-131.1-47.9-152.6-112.2H29.7v70.6C74.5 492 166 544.3 272 544.3z" fill="#34A853"/>
                    <path d="M119.4 326.8c-10.6-31.8-10.6-66 0-97.8V158.4H29.7c-40.9 80.3-40.9 175.2 0 255.6l89.7-87.2z" fill="#FBBC05"/>
                    <path d="M272 107.7c39.9 0 75.9 13.7 104.2 40.8l78.1-78.1C407.7 24.6 345.7 0 272 0 166 0 74.5 52.3 29.7 130.3l89.7 87.2C140.9 155.6 201 107.7 272 107.7z" fill="#EA4335"/>
                  </svg>

                  <span className="text-sm font-medium">{loading ? 'Signing in…' : 'Continue with Google'}</span>
                </button>

                {error && <p className="text-red-600 mt-3">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
