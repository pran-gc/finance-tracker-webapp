/*
  Google Identity Services (GIS) client-only implementation.
  Uses the OAuth2 token client to obtain short-lived access tokens for Drive API calls.
  No server-side token exchange or refresh tokens are used (client-only app).

  Exports:
    - signIn(): Promise<void>
    - signOut(): Promise<void>
    - isSignedIn(): Promise<boolean>
    - getAccessToken(): Promise<string>
    - uploadData(data, filename): Promise<any>
    - downloadData(fileId): Promise<string>
    - listFiles(query): Promise<any>
    - findFolder(name): Promise<string|null>
    - createFolder(name, parentId?): Promise<string>

  Behavior notes:
    - Access tokens are kept in memory and refreshed via the token client when required.
    - Because this is client-only, refresh tokens are not available; the token client will request a new access token
      when needed (may prompt the user if consent is required again).
*/

declare global {
  interface Window { google?: any }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

let tokenClient: any = null
let accessToken: string | null = null
let accessTokenExpiresAt = 0

export class InteractiveAuthRequired extends Error {
  code = 'INTERACTIVE_AUTH_REQUIRED'
  constructor(message?: string) {
    super(message || 'Interactive authentication is required')
    this.name = 'InteractiveAuthRequired'
  }
}

function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('GIS must be loaded in browser'))
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = (ev) => reject(new Error(`Failed to load GIS script (${GIS_SRC})`))
    document.head.appendChild(s)
  })
}

function ensureTokenClient(clientId: string, scope: string) {
  // Always (re)create a token client for the requested scope. GIS token clients are lightweight
  // and the client must be initialized with the exact scope you intend to request. Reusing a
  // previously-initialized client with a different scope can cause tokens to lack newly-requested
  // scopes and lead to 403s when accessing resources like appDataFolder.
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    throw new Error('Google GIS not loaded')
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope,
    prompt: '',
    callback: (resp: any) => {
      // callback is set per-request below; we still accept this default
    },
  })

  return tokenClient
}

// Basic token storage and refresh helper
async function requestAccessToken(clientId: string, scope: string, prompt = ''): Promise<string> {
  await loadGis()
  return new Promise((resolve, reject) => {
    try {
      const client = ensureTokenClient(clientId, scope)
      // provide a one-off callback to receive the token
      client.callback = (resp: any) => {
        if (resp && resp.access_token) {
          accessToken = resp.access_token
          // expires_in is in seconds
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

export async function signIn() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  // Include drive.appdata so the app can access the appDataFolder.
  const scope = 'openid profile email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
  if (!clientId) throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set')

  // request access token (may prompt)
  await requestAccessToken(clientId, scope, 'consent')

  // fetch profile info and store locally
  try {
    const token = await getAccessToken()
    const resp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (resp.ok) {
      const profile = await resp.json()
      // store minimal profile locally
      const user = {
        id: profile.sub,
        name: profile.name || profile.email,
        email: profile.email,
        picture: profile.picture,
      }
      try {
        localStorage.setItem('ft_user', JSON.stringify(user))
        // Also set a simple auth cookie so server-side middleware can detect
        // authenticated users and avoid rendering /login then redirecting.
        try {
          // Compute remaining token lifetime in seconds and set cookie max-age accordingly.
          const remaining = Math.max(60, Math.floor((accessTokenExpiresAt - Date.now()) / 1000))
          document.cookie = `ft_authenticated=1; path=/; max-age=${remaining}`
        } catch (e) {
          // ignore cookie set failures
        }
        window.dispatchEvent(new Event('finance:auth:changed'))
      } catch (err) {
        console.warn('storing user profile failed', err)
      }
    }
  } catch (err) {
    console.warn('failed to fetch user profile', err)
  }
}

export async function isSignedIn() {
  // If we already have a non-expired access token in memory, consider signed in
  if (accessToken && Date.now() < accessTokenExpiresAt) return true

  // Fall back to local marker: if we have a stored user profile, consider the
  // user signed in for the purposes of UI persistence across refreshes. Actual
  // Drive operations will still attempt to obtain an access token and may
  // prompt if consent is required.
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('ft_user') : null
    return Boolean(raw)
  } catch (err) {
    return false
  }
}

import { clearDB } from './db'

export async function signOut() {
  // Attempt to revoke the token if present (best-effort). Proceed regardless
  // so local state is always cleared even when no in-memory token exists.
  if (accessToken) {
    try {
      console.debug('googleDrive.signOut: revoking access token')
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: 'POST', headers: { 'Content-type': 'application/x-www-form-urlencoded' }})
    } catch (err) {
      console.warn('token revoke failed', err)
    }
  }

  accessToken = null
  accessTokenExpiresAt = 0
  // Reset token client so future sign-ins can re-request different scopes.
  try {
    tokenClient = null
  } catch (e) {
    // ignore
  }
  try {
    localStorage.removeItem('ft_user')
  } catch (err) {
    // ignore
  }

  // Clear local IndexedDB so app data is removed on sign-out
  try {
    await clearDB()
  } catch (err) {
    console.warn('clearDB during signOut failed', err)
  }

  // Clear the auth cookie so server middleware knows the user is signed out
  try {
    document.cookie = 'ft_authenticated=; path=/; max-age=0'
  } catch (e) {
    // ignore
  }

  try {
    console.debug('googleDrive.signOut: dispatching finance:auth:changed')
    window.dispatchEvent(new Event('finance:auth:changed'))
  } catch (err) {
    // ignore
  }
}

export function hasValidAccessToken() {
  return Boolean(accessToken && Date.now() < accessTokenExpiresAt - 5000)
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  // Include drive.appdata so we can read/write the appDataFolder
  const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
  if (!clientId) throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set')

  if (accessToken && Date.now() < accessTokenExpiresAt - 5000) {
    return accessToken
  }

  // Do NOT attempt interactive or silent token acquisition here. Background callers
  // should not trigger a user prompt. Instead, signal that interactive auth is
  // required so the UI can present a sign-in flow (user gesture).
  throw new InteractiveAuthRequired()
}

async function authFetch(url: string, opts: RequestInit = {}) {
  const token = await getAccessToken()
  const headers = new Headers(opts.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...opts, headers })
}

export async function createFolder(name: string, parentId?: string): Promise<string> {
  const metadata: any = { name, mimeType: 'application/vnd.google-apps.folder' }
  if (parentId) metadata.parents = [parentId]

  const res = await authFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  })

  if (!res.ok) throw new Error(`createFolder failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.id
}

export async function findFolder(name: string): Promise<string | null> {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await authFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error(`findFolder failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.files && data.files.length > 0 ? data.files[0].id : null
}

export async function uploadData(data: string, filename: string, parentId?: string) {
  // multipart upload similar to previous approach
  const metadata: any = { name: filename }
  if (parentId) metadata.parents = [parentId]

  const boundary = '-------314159265358979323846'
  const delimiter = '\r\n--' + boundary + '\r\n'
  const close_delim = '\r\n--' + boundary + '--'

  const body =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    data +
    close_delim

  const res = await authFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
    body,
  })

  if (!res.ok) throw new Error(`uploadData failed: ${res.status} ${await res.text()}`)
  return await res.json()
}

export async function downloadData(fileId: string) {
  const res = await authFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`)
  if (!res.ok) throw new Error(`downloadData failed: ${res.status} ${await res.text()}`)
  return await res.text()
}

export async function listFiles(query?: string) {
  const q = query ? `?q=${encodeURIComponent(query)}` : ''
  const res = await authFetch(`https://www.googleapis.com/drive/v3/files${q}`)
  if (!res.ok) throw new Error(`listFiles failed: ${res.status} ${await res.text()}`)
  return await res.json()
}

export async function findFile(name: string, parentId?: string): Promise<string | null> {
  let q = `name='${name}' and trashed=false`
  if (parentId) q += ` and '${parentId}' in parents`
  const r = await listFiles(q)
  return r.files && r.files.length > 0 ? r.files[0].id : null
}

export async function updateFile(fileId: string, content: string): Promise<void> {
  const res = await authFetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: content,
  })
  if (!res.ok) throw new Error(`updateFile failed: ${res.status} ${await res.text()}`)
}

export default null