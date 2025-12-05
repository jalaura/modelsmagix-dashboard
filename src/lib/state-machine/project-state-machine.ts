/**
 * Project State Machine
 * Manages project workflow transitions and side effects
 */

import { ProjectStatus } from '@prisma/client'
import { db } from '@/lib/db'

// Valid state transitions
const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  INTAKE_NEW: ['AWAITING_PAYMENT'],
  AWAITING_PAYMENT: ['PAID'],
  PAID: ['IN_QUEUE'],
  IN_QUEUE: ['GENERATING'],
  GENERATING: ['REVIEW_READY'],
  REVIEW_READY: ['COMPLETED', 'GENERATING'], // Revision loop
  COMPLETED: [], // Terminal state
}

// Side effects triggered by transitions
export type SideEffect =
  | 'SEND_PAYMENT_EMAIL'
  | 'SEND_MAGIC_LINK'
  | 'SEND_ASSETS_READY_EMAIL'
  | 'SEND_REVISION_EMAIL_TO_ADMIN'
  | 'SEND_COMPLETION_EMAIL'
  | 'CREATE_NOTIFICATION'

const STATE_SIDE_EFFECTS: Record<string, SideEffect[]> = {
  'INTAKE_NEW->AWAITING_PAYMENT': ['SEND_PAYMENT_EMAIL', 'CREATE_NOTIFICATION'],
  'AWAITING_PAYMENT->PAID': ['SEND_MAGIC_LINK', 'CREATE_NOTIFICATION'],
  'PAID->IN_QUEUE': ['CREATE_NOTIFICATION'],
  'IN_QUEUE->GENERATING': ['CREATE_NOTIFICATION'],
  'GENERATING->REVIEW_READY': ['SEND_ASSETS_READY_EMAIL', 'CREATE_NOTIFICATION'],
  'REVIEW_READY->GENERATING': ['SEND_REVISION_EMAIL_TO_ADMIN', 'CREATE_NOTIFICATION'],
  'REVIEW_READY->COMPLETED': ['SEND_COMPLETION_EMAIL', 'CREATE_NOTIFICATION'],
}

// Status display information
export const STATUS_INFO: Record<
  ProjectStatus,
  { label: string; description: string; color: string }
> = {
  INTAKE_NEW: {
    label: 'New Request',
    description: 'Awaiting admin review',
    color: 'blue',
  },
  AWAITING_PAYMENT: {
    label: 'Awaiting Payment',
    description: 'Payment link sent to client',
    color: 'yellow',
  },
  PAID: {
    label: 'Paid',
    description: 'Payment confirmed, entering queue',
    color: 'green',
  },
  IN_QUEUE: {
    label: 'In Queue',
    description: 'Waiting for production to start',
    color: 'purple',
  },
  GENERATING: {
    label: 'Generating',
    description: 'AI model shots being created',
    color: 'indigo',
  },
  REVIEW_READY: {
    label: 'Ready for Review',
    description: 'Assets ready for client review',
    color: 'orange',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Project delivered',
    color: 'green',
  },
}

export interface StateTransitionRequest {
  projectId: string
  toStatus: ProjectStatus
  changedById?: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface StateTransitionResult {
  success: boolean
  project: {
    id: string
    status: ProjectStatus
  }
  previousStatus: ProjectStatus
  sideEffectsToExecute: SideEffect[]
  error?: string
}

/**
 * Check if a transition is valid
 */
export function canTransition(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  return PROJECT_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get valid next statuses for a project
 */
export function getValidNextStatuses(currentStatus: ProjectStatus): ProjectStatus[] {
  return PROJECT_TRANSITIONS[currentStatus] || []
}

/**
 * Get side effects for a transition
 */
export function getSideEffects(
  from: ProjectStatus,
  to: ProjectStatus
): SideEffect[] {
  const key = `${from}->${to}`
  return STATE_SIDE_EFFECTS[key] || []
}

/**
 * Validate and execute a state transition
 */
export async function executeTransition(
  request: StateTransitionRequest
): Promise<StateTransitionResult> {
  const { projectId, toStatus, changedById, notes } = request

  // Get current project state
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true },
  })

  if (!project) {
    return {
      success: false,
      project: { id: projectId, status: toStatus },
      previousStatus: toStatus,
      sideEffectsToExecute: [],
      error: 'Project not found',
    }
  }

  const fromStatus = project.status

  // Validate transition
  if (!canTransition(fromStatus, toStatus)) {
    return {
      success: false,
      project: { id: projectId, status: fromStatus },
      previousStatus: fromStatus,
      sideEffectsToExecute: [],
      error: `Invalid transition from ${fromStatus} to ${toStatus}`,
    }
  }

  // Execute transition in a transaction
  const updatedProject = await db.$transaction(async (tx) => {
    // Update project status
    const updated = await tx.project.update({
      where: { id: projectId },
      data: {
        status: toStatus,
        ...(toStatus === 'COMPLETED' && { completedAt: new Date() }),
        ...(toStatus === 'PAID' && { paidAt: new Date() }),
      },
      select: { id: true, status: true },
    })

    // Record status history
    await tx.projectStatusHistory.create({
      data: {
        projectId,
        fromStatus,
        toStatus,
        changedById,
        notes,
      },
    })

    return updated
  })

  // Get side effects to execute
  const sideEffectsToExecute = getSideEffects(fromStatus, toStatus)

  return {
    success: true,
    project: updatedProject,
    previousStatus: fromStatus,
    sideEffectsToExecute,
  }
}

/**
 * Get transition history for a project
 */
export async function getTransitionHistory(projectId: string) {
  return db.projectStatusHistory.findMany({
    where: { projectId },
    include: {
      changedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Check if project is in a terminal state
 */
export function isTerminalState(status: ProjectStatus): boolean {
  return PROJECT_TRANSITIONS[status]?.length === 0
}

/**
 * Check if project can be edited by client
 */
export function canClientEdit(status: ProjectStatus): boolean {
  return ['INTAKE_NEW'].includes(status)
}

/**
 * Check if project can accept revisions
 */
export function canRequestRevision(status: ProjectStatus): boolean {
  return status === 'REVIEW_READY'
}
