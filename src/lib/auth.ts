/**
 * NextAuth.js Configuration
 * Handles authentication with magic links (Resend) and OAuth providers
 */

import NextAuth from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Resend from 'next-auth/providers/resend'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { db } from '@/lib/db'
import type { UserRole } from '@prisma/client'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,

  providers: [
    // Magic Link via Resend
    Resend({
      from: process.env.EMAIL_FROM || 'noreply@modelmagic.com',
    }),

    // OAuth Providers (optional - configured via env)
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  events: {
    async createUser({ user }) {
      // Log new user creation
      console.log(`New user created: ${user.email}`)
    },
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
})

/**
 * Helper to check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN'
}

/**
 * Helper to get auth or redirect
 */
export async function getAuthOrRedirect() {
  const session = await auth()
  if (!session?.user) {
    return null
  }
  return session
}
