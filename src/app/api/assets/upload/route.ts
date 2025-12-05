/**
 * Asset Upload API Routes
 * POST: Get presigned upload URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { assetService } from '@/lib/services'
import { RequestUploadUrlSchema } from '@/lib/validations'

/**
 * POST /api/assets/upload
 * Get presigned URL for direct upload to R2/S3
 * This endpoint is public to allow intake form uploads
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = RequestUploadUrlSchema.parse(body)

    const result = await assetService.requestUploadUrl(
      data.fileName,
      data.mimeType,
      data.fileSize,
      data.projectId,
      data.type
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Failed to generate upload URL:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
