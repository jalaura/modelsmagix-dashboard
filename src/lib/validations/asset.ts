/**
 * Asset Validation Schemas
 * Zod schemas for asset-related API requests
 */

import { z } from 'zod'

// Asset type enum matching Prisma
export const AssetTypeSchema = z.enum(['REFERENCE', 'GENERATED'])
export type AssetType = z.infer<typeof AssetTypeSchema>

// Asset status enum matching Prisma
export const AssetStatusSchema = z.enum([
  'PENDING',
  'READY',
  'REVISION_REQUESTED',
  'APPROVED',
])
export type AssetStatus = z.infer<typeof AssetStatusSchema>

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MimeTypeSchema = z.enum(ALLOWED_MIME_TYPES)

// Max file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Request presigned upload URL
export const RequestUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  mimeType: MimeTypeSchema,
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  projectId: z.string().uuid().optional(), // Optional for temp uploads
  type: AssetTypeSchema.default('REFERENCE'),
})

export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>

// Confirm upload (after presigned URL upload completes)
export const ConfirmUploadSchema = z.object({
  key: z.string().min(1, 'Storage key is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Valid URL is required'),
  mimeType: MimeTypeSchema,
  fileSize: z.number().positive(),
  projectId: z.string().uuid(),
  type: AssetTypeSchema.default('REFERENCE'),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

export type ConfirmUploadInput = z.infer<typeof ConfirmUploadSchema>

// Update asset (client - request revision)
export const RequestRevisionSchema = z.object({
  revisionNotes: z
    .string()
    .min(10, 'Revision notes must be at least 10 characters')
    .max(2000, 'Revision notes must be less than 2000 characters'),
})

export type RequestRevisionInput = z.infer<typeof RequestRevisionSchema>

// Admin: Update asset status
export const UpdateAssetStatusSchema = z.object({
  status: AssetStatusSchema,
  revisionNotes: z.string().optional(),
})

export type UpdateAssetStatusInput = z.infer<typeof UpdateAssetStatusSchema>

// Admin: Bulk upload generated assets
export const BulkUploadAssetsSchema = z.object({
  projectId: z.string().uuid(),
  assets: z
    .array(
      z.object({
        key: z.string(),
        fileName: z.string(),
        fileUrl: z.string().url(),
        mimeType: MimeTypeSchema,
        fileSize: z.number().positive(),
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
      })
    )
    .min(1, 'At least one asset is required'),
})

export type BulkUploadAssetsInput = z.infer<typeof BulkUploadAssetsSchema>

// Query params for listing assets
export const ListAssetsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  type: AssetTypeSchema.optional(),
  status: AssetStatusSchema.optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(50),
})

export type ListAssetsQuery = z.infer<typeof ListAssetsQuerySchema>
