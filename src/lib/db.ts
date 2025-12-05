/**
 * Database Client (Prisma)
 * Singleton pattern to prevent multiple instances in development
 * Optimized for Neon PostgreSQL with connection pooling
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
