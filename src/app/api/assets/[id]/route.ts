/**
 * Asset Detail API Routes
 * GET: Get asset details
 * PATCH: Update asset (request revision)
 * DELETE: Delete asset (admin only)
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assetService } from '@/lib/services'
import { RequestRevisionSchema, UpdateAssetStatusSchema } from '@/lib/validations'
import { canRequestRevision } from '@/lib/state-machine/project-state-machine'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/assets/[id]
 * Get asset details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const asset = await assetService.getAssetById(id)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check access
    if (
      session.user.role !== 'ADMIN' &&
      asset.project?.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: asset })
  } catch (error) {
    console.error('Failed to get asset:', error)
    return NextResponse.json({ error: 'Failed to get asset' }, { status: 500 })
  }
}

/**
 * PATCH /api/assets/[id]
 * Update asset - clients can request revisions, admins can update status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const asset = await assetService.getAssetById(id)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check access
    if (
      session.user.role !== 'ADMIN' &&
      asset.project?.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Admin can update any status
    if (session.user.role === 'ADMIN') {
      const data = UpdateAssetStatusSchema.parse(body)
      const updated = await assetService.updateAssetStatus(
        id,
        data.status,
        data.revisionNotes
      )
      return NextResponse.json({ data: updated })
    }

    // Client can only request revisions
    if (!asset.project || !canRequestRevision(asset.project.status)) {
      return NextResponse.json(
        { error: 'Revisions not allowed in current project status' },
        { status: 400 }
      )
    }

    const data = RequestRevisionSchema.parse(body)
    const updated = await assetService.requestRevision(id, data.revisionNotes)

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to update asset:', error)
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete asset (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await assetService.deleteAsset(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete asset:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
