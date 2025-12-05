/**
 * Storage Utility for Cloudflare R2 / AWS S3
 * Handles file uploads, presigned URLs, and file management
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

// Validate required environment variables
function getStorageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'modelmagic-assets'
  const publicUrl = process.env.R2_PUBLIC_URL || `https://${bucketName}.s3.amazonaws.com`

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing storage credentials: R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY or AWS equivalents required')
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  }
}

// Lazy initialization of S3 client
let s3ClientInstance: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const config = getStorageConfig()
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }
  return s3ClientInstance
}

// File type restrictions
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface UploadResult {
  key: string
  url: string
  bucket: string
}

export interface PresignedUploadResult {
  uploadUrl: string
  key: string
  publicUrl: string
}

/**
 * Validate file before upload
 */
export function validateFile(
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Generate a unique file key with organized path structure
 * Path: projects/{projectId}/{type}/{timestamp}-{uuid}.{ext}
 */
export function generateFileKey(
  projectId: string,
  filename: string,
  type: 'reference' | 'generated' = 'reference'
): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const uniqueId = uuidv4()
  const timestamp = Date.now()
  return `projects/${projectId}/${type}/${timestamp}-${uniqueId}.${ext}`
}

/**
 * Generate a file key for user uploads (before project assignment)
 */
export function generateTempFileKey(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const uniqueId = uuidv4()
  const timestamp = Date.now()
  return `temp/${timestamp}-${uniqueId}.${ext}`
}

/**
 * Upload a file to R2/S3 (server-side)
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  const config = getStorageConfig()
  const client = getS3Client()

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await client.send(command)

  return {
    key,
    url: `${config.publicUrl}/${key}`,
    bucket: config.bucketName,
  }
}

/**
 * Delete a file from R2/S3
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getStorageConfig()
  const client = getS3Client()

  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })

  await client.send(command)
}

/**
 * Generate a presigned URL for direct client upload
 * Used for large files to bypass server memory limits
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<PresignedUploadResult> {
  const config = getStorageConfig()
  const client = getS3Client()

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn })

  return {
    uploadUrl,
    key,
    publicUrl: `${config.publicUrl}/${key}`,
  }
}

/**
 * Generate a presigned URL for downloading a private file
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const client = getS3Client()
  const config = getStorageConfig()

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })

  return await getSignedUrl(client, command, { expiresIn })
}

/**
 * Move a file from temp to permanent location
 */
export async function moveFile(
  sourceKey: string,
  destinationKey: string
): Promise<UploadResult> {
  const config = getStorageConfig()
  const client = getS3Client()

  // Copy to new location
  const { CopyObjectCommand } = await import('@aws-sdk/client-s3')
  const copyCommand = new CopyObjectCommand({
    Bucket: config.bucketName,
    CopySource: `${config.bucketName}/${sourceKey}`,
    Key: destinationKey,
  })
  await client.send(copyCommand)

  // Delete original
  await deleteFile(sourceKey)

  return {
    key: destinationKey,
    url: `${config.publicUrl}/${destinationKey}`,
    bucket: config.bucketName,
  }
}
