/**
 * Admin Mark Paid API Route
 * POST: Mark project as paid
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { projectService } from '@/lib/services'
import { MarkPaidSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/projects/[id]/mark-paid
 * Mark project as paid and transition to IN_QUEUE
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = MarkPaidSchema.parse(body)

    const result = await projectService.markProjectPaid(id, {
      changedById: session.user.id,
      sendMagicLink: data.sendMagicLink,
      notes: data.notes,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.project,
    })
  } catch (error) {
    console.error('Failed to mark paid:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to mark paid' },
      { status: 500 }
    )
  }
}
