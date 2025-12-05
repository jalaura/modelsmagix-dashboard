/**
 * User Validation Schemas
 * Zod schemas for user-related API requests
 */

import { z } from 'zod'

// User role enum matching Prisma
export const UserRoleSchema = z.enum(['CLIENT', 'ADMIN'])
export type UserRole = z.infer<typeof UserRoleSchema>

// Send magic link
export const SendMagicLinkSchema = z.object({
  email: z.string().email('Valid email is required'),
})

export type SendMagicLinkInput = z.infer<typeof SendMagicLinkSchema>

// Verify magic link
export const VerifyMagicLinkSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type VerifyMagicLinkInput = z.infer<typeof VerifyMagicLinkSchema>

// Update user profile (self)
export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  image: z.string().url().optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

// Admin: Update user
export const AdminUpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: UserRoleSchema.optional(),
  email: z.string().email().optional(),
})

export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>

// Admin: List users query
export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  role: UserRoleSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'email', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>

// Notification type enum
export const NotificationTypeSchema = z.enum([
  'PAYMENT_REQUESTED',
  'PAYMENT_CONFIRMED',
  'MAGIC_LINK_SENT',
  'ASSETS_READY',
  'REVISION_SUBMITTED',
  'PROJECT_COMPLETED',
])

export type NotificationType = z.infer<typeof NotificationTypeSchema>

// Mark notification as read
export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
})

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>

// List notifications query
export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
})

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>
