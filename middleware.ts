import { NextRequest, NextResponse } from 'next/server'

// Paths that don't require auth check
const PUBLIC_PATHS = [
  '/login',
  '/api',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
]

function isPublicPath(pathname: string) {
  // allow /_next/* and /api/* and public assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.startsWith('/public')) return true
  if (PUBLIC_PATHS.includes(pathname)) return true
  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) return NextResponse.next()

  const cookie = req.cookies.get('ft_authenticated')
  const authed = Boolean(cookie && cookie.value === '1')

  // If user is not authenticated, redirect to /login
  if (!authed && pathname !== '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access /login, send them home
  if (authed && pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
