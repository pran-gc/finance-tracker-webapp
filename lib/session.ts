import { cookies } from 'next/headers'
import { query } from './database'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'ft_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export interface Session {
  id: string
  user_id: number
  expires_at: Date
  created_at: Date
}

export interface User {
  id: number
  google_id: string
  email: string
  name: string
  picture: string | null
  created_at: Date
  updated_at: Date
  last_login: Date
}

// Generate a cryptographically secure session ID
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Create a new session for a user
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await query(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    [sessionId, userId, expiresAt]
  )

  return sessionId
}

// Get session from database by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessions = await query<Session[]>(
    'SELECT id, user_id, expires_at, created_at FROM sessions WHERE id = ? AND expires_at > NOW()',
    [sessionId]
  )

  return sessions.length > 0 ? sessions[0] : null
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<void> {
  await query('DELETE FROM sessions WHERE id = ?', [sessionId])
}

// Delete all sessions for a user
export async function deleteUserSessions(userId: number): Promise<void> {
  await query('DELETE FROM sessions WHERE user_id = ?', [userId])
}

// Clean up expired sessions (should be run periodically)
export async function cleanupExpiredSessions(): Promise<void> {
  await query('DELETE FROM sessions WHERE expires_at <= NOW()')
}

// Set session cookie
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // in seconds
    path: '/',
  })
}

// Get session ID from cookie
export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  return sessionCookie?.value || null
}

// Delete session cookie
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  const sessionId = await getSessionIdFromCookie()
  if (!sessionId) return null

  const session = await getSession(sessionId)
  if (!session) return null

  const users = await query<User[]>(
    'SELECT id, google_id, email, name, picture, created_at, updated_at, last_login FROM users WHERE id = ?',
    [session.user_id]
  )

  return users.length > 0 ? users[0] : null
}

// Require authentication (throws if not authenticated)
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Create or update user from Google OAuth
export async function upsertUser(googleId: string, email: string, name: string, picture: string | null): Promise<number> {
  // Check if user exists
  const existingUsers = await query<{ id: number }[]>(
    'SELECT id FROM users WHERE google_id = ?',
    [googleId]
  )

  if (existingUsers.length > 0) {
    // Update existing user
    await query(
      'UPDATE users SET email = ?, name = ?, picture = ?, last_login = NOW() WHERE google_id = ?',
      [email, name, picture, googleId]
    )
    return existingUsers[0].id
  } else {
    // Create new user
    const result = await query<mysql.ResultSetHeader>(
      'INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)',
      [googleId, email, name, picture]
    )
    return result.insertId
  }
}

// Import mysql types for ResultSetHeader
import type mysql from 'mysql2/promise'
