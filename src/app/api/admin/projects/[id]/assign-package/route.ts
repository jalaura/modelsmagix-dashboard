/**
 * Admin Assign Package API Route
 * POST: Assign package to project and send payment link
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { projectService } from '@/lib/services'
import { AssignPackageSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/projects/[id]/assign-package
 * Assign package and payment link to project
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = AssignPackageSchema.parse(body)

    const result = await projectService.assignPackage(id, {
      packageType: data.packageType,
      paymentLinkUrl: data.paymentLinkUrl,
      changedById: session.user.id,
      sendEmail: data.sendEmail,
    })

    if (!result.transition.success) {
      return NextResponse.json(
        { error: result.transition.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.project,
    })
  } catch (error) {
    console.error('Failed to assign package:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to assign package' },
      { status: 500 }
    )
  }
}
