/**
 * Project Validation Schemas
 * Zod schemas for project-related API requests
 */

import { z } from 'zod'

// Project status enum matching Prisma
export const ProjectStatusSchema = z.enum([
  'INTAKE_NEW',
  'AWAITING_PAYMENT',
  'PAID',
  'IN_QUEUE',
  'GENERATING',
  'REVIEW_READY',
  'COMPLETED',
])

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

// Public intake form submission
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Valid email is required'),
  productType: z.string().min(1, 'Product type is required'),
  creativeBrief: z
    .string()
    .min(10, 'Creative brief must be at least 10 characters')
    .max(5000, 'Creative brief must be less than 5000 characters'),
  referenceImages: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        mimeType: z.string(),
        fileSize: z.number().positive(),
      })
    )
    .min(1, 'At least one reference image is required')
    .max(20, 'Maximum 20 reference images allowed'),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

// Update project (client - limited fields)
export const UpdateProjectClientSchema = z.object({
  creativeBrief: z
    .string()
    .min(10)
    .max(5000)
    .optional(),
})

export type UpdateProjectClientInput = z.infer<typeof UpdateProjectClientSchema>

// Admin: Assign package
export const AssignPackageSchema = z.object({
  packageType: z.enum(['10-shots', '20-shots', '30-shots', 'custom']),
  paymentLinkUrl: z.string().url('Valid payment URL is required'),
  customDescription: z.string().optional(),
  sendEmail: z.boolean().default(true),
})

export type AssignPackageInput = z.infer<typeof AssignPackageSchema>

// Admin: Mark as paid
export const MarkPaidSchema = z.object({
  sendMagicLink: z.boolean().default(true),
  notes: z.string().optional(),
})

export type MarkPaidInput = z.infer<typeof MarkPaidSchema>

// Admin: Update project status
export const UpdateStatusSchema = z.object({
  status: ProjectStatusSchema,
  notes: z.string().optional(),
})

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>

// Query params for listing projects
export const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  status: ProjectStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>

// Product types (for dropdown)
export const PRODUCT_TYPES = [
  'Clothing',
  'Accessories',
  'Footwear',
  'Jewelry',
  'Bags',
  'Eyewear',
  'Watches',
  'Other',
] as const

export const ProductTypeSchema = z.enum(PRODUCT_TYPES)

// Package types
export const PACKAGE_TYPES = [
  { value: '10-shots', label: '10 Model Shots', description: 'Perfect for small collections' },
  { value: '20-shots', label: '20 Model Shots', description: 'Great for medium catalogs' },
  { value: '30-shots', label: '30 Model Shots', description: 'Ideal for large collections' },
  { value: 'custom', label: 'Custom Package', description: 'Contact us for custom needs' },
] as const
