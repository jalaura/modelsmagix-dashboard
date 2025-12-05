/**
 * Project Service
 * Business logic for project operations
 */

import { db } from '@/lib/db'
import { ProjectStatus, AssetType, Prisma } from '@prisma/client'
import {
  executeTransition,
  getSideEffects,
  type SideEffect,
} from '@/lib/state-machine/project-state-machine'
import * as emailService from './email.service'
import * as notificationService from './notification.service'

export interface CreateProjectData {
  userId: string
  productType: string
  creativeBrief: string
  referenceImages: Array<{
    fileName: string
    fileUrl: string
    fileKey: string
    mimeType: string
    fileSize: number
  }>
}

export interface ListProjectsOptions {
  userId?: string
  status?: ProjectStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'status'
  sortOrder?: 'asc' | 'desc'
  includeUser?: boolean
}

/**
 * Create a new project with reference images
 */
export async function createProject(data: CreateProjectData) {
  const project = await db.$transaction(async (tx) => {
    // Create project
    const project = await tx.project.create({
      data: {
        userId: data.userId,
        productType: data.productType,
        creativeBrief: data.creativeBrief,
        status: 'INTAKE_NEW',
      },
    })

    // Create reference assets
    if (data.referenceImages.length > 0) {
      await tx.asset.createMany({
        data: data.referenceImages.map((img) => ({
          projectId: project.id,
          type: 'REFERENCE' as AssetType,
          status: 'PENDING',
          fileName: img.fileName,
          fileUrl: img.fileUrl,
          fileKey: img.fileKey,
          mimeType: img.mimeType,
          fileSize: img.fileSize,
        })),
      })
    }

    // Create initial status history
    await tx.projectStatusHistory.create({
      data: {
        projectId: project.id,
        fromStatus: null,
        toStatus: 'INTAKE_NEW',
        notes: 'Project created via intake form',
      },
    })

    return project
  })

  return project
}

/**
 * Get project by ID with related data
 */
export async function getProjectById(
  projectId: string,
  options: { includeAssets?: boolean; includeUser?: boolean; includeHistory?: boolean } = {}
) {
  return db.project.findUnique({
    where: { id: projectId },
    include: {
      assets: options.includeAssets ?? true,
      user: options.includeUser
        ? { select: { id: true, name: true, email: true } }
        : false,
      statusHistory: options.includeHistory
        ? {
            include: {
              changedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          }
        : false,
    },
  })
}

/**
 * List projects with filtering and pagination
 */
export async function listProjects(options: ListProjectsOptions = {}) {
  const {
    userId,
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeUser = false,
  } = options

  const where: Prisma.ProjectWhereInput = {
    ...(userId && { userId }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { productType: { contains: search, mode: 'insensitive' } },
        { creativeBrief: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        user: includeUser ? { select: { id: true, name: true, email: true } } : false,
        _count: { select: { assets: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.project.count({ where }),
  ])

  return {
    projects,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Update project status with state machine
 */
export async function updateProjectStatus(
  projectId: string,
  toStatus: ProjectStatus,
  changedById?: string,
  notes?: string
) {
  const result = await executeTransition({
    projectId,
    toStatus,
    changedById,
    notes,
  })

  if (result.success) {
    // Execute side effects
    await executeSideEffects(projectId, result.sideEffectsToExecute)
  }

  return result
}

/**
 * Assign package to project (admin)
 */
export async function assignPackage(
  projectId: string,
  data: {
    packageType: string
    paymentLinkUrl: string
    changedById: string
    sendEmail?: boolean
  }
) {
  const project = await db.project.update({
    where: { id: projectId },
    data: {
      packageType: data.packageType,
      paymentLinkUrl: data.paymentLinkUrl,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  // Transition to AWAITING_PAYMENT
  const result = await updateProjectStatus(
    projectId,
    'AWAITING_PAYMENT',
    data.changedById,
    `Package assigned: ${data.packageType}`
  )

  // Send payment email if requested
  if (data.sendEmail && project.user.email) {
    await emailService.sendPaymentRequest(project.user.email, {
      clientName: project.user.name || 'Customer',
      projectId: project.id,
      packageType: data.packageType,
      paymentUrl: data.paymentLinkUrl,
    })
  }

  return { project, transition: result }
}

/**
 * Mark project as paid (admin)
 */
export async function markProjectPaid(
  projectId: string,
  data: {
    changedById: string
    sendMagicLink?: boolean
    notes?: string
  }
) {
  // Transition to PAID, then to IN_QUEUE
  let result = await updateProjectStatus(
    projectId,
    'PAID',
    data.changedById,
    data.notes || 'Payment confirmed'
  )

  if (result.success) {
    // Auto-transition to IN_QUEUE
    result = await updateProjectStatus(
      projectId,
      'IN_QUEUE',
      data.changedById,
      'Added to production queue'
    )
  }

  return result
}

/**
 * Execute side effects for state transitions
 */
async function executeSideEffects(projectId: string, sideEffects: SideEffect[]) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { assets: { where: { type: 'GENERATED' } } } },
    },
  })

  if (!project) return

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  for (const effect of sideEffects) {
    try {
      switch (effect) {
        case 'SEND_PAYMENT_EMAIL':
          if (project.user.email && project.paymentLinkUrl) {
            await emailService.sendPaymentRequest(project.user.email, {
              clientName: project.user.name || 'Customer',
              projectId: project.id,
              packageType: project.packageType || 'Standard',
              paymentUrl: project.paymentLinkUrl,
            })
          }
          break

        case 'SEND_MAGIC_LINK':
          // Magic link is handled by NextAuth
          break

        case 'SEND_ASSETS_READY_EMAIL':
          if (project.user.email) {
            await emailService.sendAssetsReady(project.user.email, {
              clientName: project.user.name || 'Customer',
              projectId: project.id,
              assetCount: project._count.assets,
              dashboardUrl: `${APP_URL}/dashboard/projects/${project.id}`,
            })
          }
          break

        case 'SEND_COMPLETION_EMAIL':
          if (project.user.email) {
            await emailService.sendProjectCompleted(project.user.email, {
              clientName: project.user.name || 'Customer',
              projectId: project.id,
              dashboardUrl: `${APP_URL}/dashboard/projects/${project.id}`,
            })
          }
          break

        case 'CREATE_NOTIFICATION':
          // Create appropriate notification based on current status
          const notificationData = getNotificationForStatus(project.status, project.id)
          if (notificationData) {
            await notificationService.createNotification({
              userId: project.userId,
              ...notificationData,
            })
          }
          break
      }
    } catch (error) {
      console.error(`Failed to execute side effect ${effect}:`, error)
    }
  }
}

/**
 * Get notification data for a status
 */
function getNotificationForStatus(status: ProjectStatus, projectId: string) {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return notificationService.NotificationTemplates.paymentRequested(projectId)
    case 'PAID':
    case 'IN_QUEUE':
      return notificationService.NotificationTemplates.paymentConfirmed(projectId)
    case 'REVIEW_READY':
      return notificationService.NotificationTemplates.assetsReady(projectId, 0)
    case 'COMPLETED':
      return notificationService.NotificationTemplates.projectCompleted(projectId)
    default:
      return null
  }
}

/**
 * Get project statistics for dashboard
 */
export async function getProjectStats(userId?: string) {
  const where = userId ? { userId } : {}

  const [total, byStatus] = await Promise.all([
    db.project.count({ where }),
    db.project.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
  ])

  const statusCounts = byStatus.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count
      return acc
    },
    {} as Record<ProjectStatus, number>
  )

  return {
    total,
    byStatus: statusCounts,
    active: (statusCounts.IN_QUEUE || 0) + (statusCounts.GENERATING || 0),
    completed: statusCounts.COMPLETED || 0,
    pendingReview: statusCounts.REVIEW_READY || 0,
  }
}
