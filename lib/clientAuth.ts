// Client-side authentication module
// Uses Google OAuth for sign-in, then exchanges token with backend for session

import { authApi } from './api'

declare global {
  interface Window {
    google?: any
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

let tokenClient: any = null
let accessToken: string | null = null
let accessTokenExpiresAt = 0

// Load Google Identity Services
function loadGis(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('GIS must be loaded in browser'))
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

// Initialize token client
function ensureTokenClient(clientId: string, scope: string) {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not loaded')
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope,
    prompt: '',
    callback: () => {}, // Will be overridden per request
  })

  return tokenClient
}

// Request access token from Google
async function requestAccessToken(
  clientId: string,
  scope: string,
  prompt = ''
): Promise<string> {
  await loadGis()
  return new Promise((resolve, reject) => {
    try {
      const client = ensureTokenClient(clientId, scope)
      client.callback = (resp: any) => {
        if (resp?.access_token) {
          accessToken = resp.access_token
          const expiresIn = Number(resp.expires_in) || 3600
          accessTokenExpiresAt = Date.now() + expiresIn * 1000
          resolve(accessToken as string)
        } else {
          reject(new Error('Failed to obtain access token'))
        }
      }
      client.requestAccessToken({ prompt })
    } catch (err) {
      reject(err)
    }
  })
}

// Sign in with Google and create backend session
export async function signIn(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const scope = 'openid profile email'

  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set')
  }

  // Get access token from Google
  const token = await requestAccessToken(clientId, scope, 'consent')

  // Exchange token with backend to create session
  await authApi.signIn(token)

  // Notify app of auth change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('finance:auth:changed'))
  }
}

// Sign out
export async function signOut(): Promise<void> {
  // Revoke Google token if present
  if (accessToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      })
    } catch (err) {
      console.warn('Token revoke failed', err)
    }
  }

  // Clear local state
  accessToken = null
  accessTokenExpiresAt = 0
  tokenClient = null

  // Sign out from backend (clear session)
  try {
    await authApi.signOut()
  } catch (err) {
    console.warn('Backend signout failed', err)
  }

  // Notify app of auth change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('finance:auth:changed'))
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await authApi.getCurrentUser()
    return response.authenticated === true
  } catch {
    return false
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const response = await authApi.getCurrentUser()
    return response.authenticated ? response.user : null
  } catch {
    return null
  }
}
