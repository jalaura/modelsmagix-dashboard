/**
 * Database Client (Prisma with Neon Serverless)
 * Configured for Edge Runtime (Cloudflare Pages)
 */

import { neon } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL!

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const sql = neon(connectionString)
  const adapter = new PrismaNeon(sql)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
