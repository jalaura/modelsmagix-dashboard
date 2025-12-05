/**
 * Admin Status Update API Route
 * PATCH: Update project status
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { projectService } from '@/lib/services'
import { UpdateStatusSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/projects/[id]/status
 * Update project status (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = UpdateStatusSchema.parse(body)

    const result = await projectService.updateProjectStatus(
      id,
      data.status,
      session.user.id,
      data.notes
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.project,
      previousStatus: result.previousStatus,
    })
  } catch (error) {
    console.error('Failed to update status:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
