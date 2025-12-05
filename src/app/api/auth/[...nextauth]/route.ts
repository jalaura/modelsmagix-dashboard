/**
 * NextAuth.js API Route Handler
 * Handles all authentication routes (/api/auth/*)
 */

import { handlers } from '@/lib/auth'

export const runtime = 'edge'

export const { GET, POST } = handlers
