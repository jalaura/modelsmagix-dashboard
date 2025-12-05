/**
 * Database Client (Prisma with Neon Serverless)
 * Configured for Edge Runtime (Cloudflare Pages)
 */

import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL!

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new Pool({ connectionString })
  // Type assertion needed due to version mismatch between packages
  const adapter = new PrismaNeon(pool as any)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
