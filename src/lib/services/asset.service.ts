/**
 * Asset Service
 * Business logic for asset operations
 */

import { db } from '@/lib/db'
import { AssetType, AssetStatus, Prisma } from '@prisma/client'
import {
  generateFileKey,
  generateTempFileKey,
  getPresignedUploadUrl,
  deleteFile,
  moveFile,
} from '@/lib/storage'

export interface CreateAssetData {
  projectId: string
  type: AssetType
  fileName: string
  fileUrl: string
  fileKey: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
}

export interface ListAssetsOptions {
  projectId?: string
  type?: AssetType
  status?: AssetStatus
  page?: number
  limit?: number
}

/**
 * Create a new asset record
 */
export async function createAsset(data: CreateAssetData) {
  return db.asset.create({
    data: {
      projectId: data.projectId,
      type: data.type,
      status: data.type === 'GENERATED' ? 'READY' : 'PENDING',
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
    },
  })
}

/**
 * Create multiple assets in bulk
 */
export async function createAssetsBulk(
  projectId: string,
  assets: Omit<CreateAssetData, 'projectId'>[]
) {
  return db.asset.createMany({
    data: assets.map((asset) => ({
      projectId,
      type: asset.type,
      status: asset.type === 'GENERATED' ? 'READY' : 'PENDING',
      fileName: asset.fileName,
      fileUrl: asset.fileUrl,
      fileKey: asset.fileKey,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    })),
  })
}

/**
 * Get asset by ID
 */
export async function getAssetById(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    include: {
      project: {
        select: {
          id: true,
          userId: true,
          status: true,
        },
      },
    },
  })
}

/**
 * List assets with filtering
 */
export async function listAssets(options: ListAssetsOptions = {}) {
  const { projectId, type, status, page = 1, limit = 50 } = options

  const where: Prisma.AssetWhereInput = {
    ...(projectId && { projectId }),
    ...(type && { type }),
    ...(status && { status }),
  }

  const [assets, total] = await Promise.all([
    db.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.asset.count({ where }),
  ])

  return {
    assets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get assets for a project grouped by type
 */
export async function getProjectAssets(projectId: string) {
  const assets = await db.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })

  return {
    reference: assets.filter((a) => a.type === 'REFERENCE'),
    generated: assets.filter((a) => a.type === 'GENERATED'),
    total: assets.length,
  }
}

/**
 * Request presigned URL for upload
 */
export async function requestUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number,
  projectId?: string,
  type: AssetType = 'REFERENCE'
) {
  // Generate file key
  const key = projectId
    ? generateFileKey(projectId, fileName, type === 'REFERENCE' ? 'reference' : 'generated')
    : generateTempFileKey(fileName)

  // Get presigned URL
  const result = await getPresignedUploadUrl(key, mimeType)

  return {
    ...result,
    fileName,
    mimeType,
    fileSize,
    type,
  }
}

/**
 * Update asset status
 */
export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
  revisionNotes?: string
) {
  return db.asset.update({
    where: { id: assetId },
    data: {
      status,
      ...(revisionNotes && { revisionNotes }),
    },
  })
}

/**
 * Request revision for an asset
 */
export async function requestRevision(assetId: string, revisionNotes: string) {
  return updateAssetStatus(assetId, 'REVISION_REQUESTED', revisionNotes)
}

/**
 * Approve an asset
 */
export async function approveAsset(assetId: string) {
  return updateAssetStatus(assetId, 'APPROVED')
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
  })

  if (!asset) {
    throw new Error('Asset not found')
  }

  // Delete from storage
  try {
    await deleteFile(asset.fileKey)
  } catch (error) {
    console.error('Failed to delete file from storage:', error)
  }

  // Delete from database
  return db.asset.delete({
    where: { id: assetId },
  })
}

/**
 * Move assets from temp storage to project storage
 */
export async function moveAssetsToProject(
  tempAssets: Array<{ key: string; fileName: string }>,
  projectId: string,
  type: AssetType = 'REFERENCE'
) {
  const movedAssets = []

  for (const asset of tempAssets) {
    const newKey = generateFileKey(
      projectId,
      asset.fileName,
      type === 'REFERENCE' ? 'reference' : 'generated'
    )
    const result = await moveFile(asset.key, newKey)
    movedAssets.push({
      ...result,
      fileName: asset.fileName,
    })
  }

  return movedAssets
}

/**
 * Get asset statistics for a project
 */
export async function getAssetStats(projectId: string) {
  const [byType, byStatus, totalSize] = await Promise.all([
    db.asset.groupBy({
      by: ['type'],
      where: { projectId },
      _count: true,
    }),
    db.asset.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    }),
    db.asset.aggregate({
      where: { projectId },
      _sum: { fileSize: true },
    }),
  ])

  return {
    byType: byType.reduce(
      (acc, curr) => {
        acc[curr.type] = curr._count
        return acc
      },
      {} as Record<AssetType, number>
    ),
    byStatus: byStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count
        return acc
      },
      {} as Record<AssetStatus, number>
    ),
    totalSize: totalSize._sum.fileSize || 0,
    totalCount: byType.reduce((sum, curr) => sum + curr._count, 0),
  }
}
