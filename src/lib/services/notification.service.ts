/**
 * Notification Service
 * Handles in-app notifications for users
 */

import { db } from '@/lib/db'
import { NotificationType } from '@prisma/client'

export interface CreateNotificationData {
  userId: string
  projectId?: string
  type: NotificationType
  title: string
  message: string
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: CreateNotificationData) {
  return db.notification.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      message: data.message,
    },
  })
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number
    limit?: number
    unreadOnly?: boolean
  } = {}
) {
  const { page = 1, limit = 20, unreadOnly = false } = options

  const where = {
    userId,
    ...(unreadOnly && { read: false }),
  }

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            productType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where }),
  ])

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: { userId, read: false },
  })
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  return db.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      read: true, // Only delete read notifications
    },
  })
}

// Notification templates for common events
export const NotificationTemplates = {
  paymentRequested: (projectId: string) => ({
    type: 'PAYMENT_REQUESTED' as NotificationType,
    title: 'Payment Required',
    message: 'A package has been assigned to your project. Please complete payment to proceed.',
    projectId,
  }),

  paymentConfirmed: (projectId: string) => ({
    type: 'PAYMENT_CONFIRMED' as NotificationType,
    title: 'Payment Confirmed',
    message: 'Your payment has been confirmed. Your project is now in the production queue.',
    projectId,
  }),

  assetsReady: (projectId: string, assetCount: number) => ({
    type: 'ASSETS_READY' as NotificationType,
    title: 'Images Ready for Review',
    message: `${assetCount} model shots are ready for your review.`,
    projectId,
  }),

  revisionSubmitted: (projectId: string) => ({
    type: 'REVISION_SUBMITTED' as NotificationType,
    title: 'Revision Request Submitted',
    message: 'Your revision request has been submitted. Our team will work on it shortly.',
    projectId,
  }),

  projectCompleted: (projectId: string) => ({
    type: 'PROJECT_COMPLETED' as NotificationType,
    title: 'Project Completed!',
    message: 'Your project is complete. All images are ready for download.',
    projectId,
  }),
}
