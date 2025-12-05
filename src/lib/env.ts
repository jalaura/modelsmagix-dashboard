/**
 * Environment Variable Validation
 * Ensures all required environment variables are set at startup
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().email().optional().default('noreply@modelmagic.com'),

  // Storage - R2 or S3
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // AWS S3 fallback
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().optional().default('ModelMagic'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate storage credentials
const validateStorageCredentials = (data: z.infer<typeof envSchema>) => {
  const hasR2 = data.R2_ACCESS_KEY_ID && data.R2_SECRET_ACCESS_KEY
  const hasAWS = data.AWS_ACCESS_KEY_ID && data.AWS_SECRET_ACCESS_KEY

  if (!hasR2 && !hasAWS) {
    throw new Error(
      'Storage credentials required: Either R2 (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) or AWS (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) must be configured'
    )
  }
}

// Validate and export environment variables
function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('Environment validation failed:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  // Additional validation for storage
  validateStorageCredentials(parsed.data)

  return parsed.data
}

// Export validated env (call this at app startup)
export const env = validateEnv()

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>
