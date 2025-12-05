/**
 * Next.js Middleware for Route Protection
 * Handles authentication and role-based access control
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Route definitions
const publicRoutes = [
  '/',
  '/submit',
  '/auth/signin',
  '/auth/verify',
  '/auth/error',
]

const authRoutes = [
  '/auth/signin',
  '/auth/verify',
]

const clientRoutes = [
  '/dashboard',
]

const adminRoutes = [
  '/admin',
]

// Helper to check if path matches any route patterns
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('*')) {
      return path.startsWith(route.slice(0, -1))
    }
    return path === route || path.startsWith(route + '/')
  })
}

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const path = nextUrl.pathname

  // Allow all API routes to pass through (they handle their own auth)
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (matchesRoute(path, publicRoutes)) {
    // If logged in and trying to access auth pages, redirect to dashboard
    if (isLoggedIn && matchesRoute(path, authRoutes)) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Redirect unauthenticated users to signin
  if (!isLoggedIn) {
    const signInUrl = new URL('/auth/signin', nextUrl)
    signInUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(signInUrl)
  }

  // Admin routes - require ADMIN role
  if (matchesRoute(path, adminRoutes)) {
    if (userRole !== 'ADMIN') {
      // Redirect non-admins to client dashboard
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Client routes - allow any authenticated user
  if (matchesRoute(path, clientRoutes)) {
    return NextResponse.next()
  }

  // Default: allow the request
  return NextResponse.next()
})

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
