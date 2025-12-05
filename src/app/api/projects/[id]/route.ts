/**
 * Project Detail API Routes
 * GET: Get project details
 * PATCH: Update project
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { projectService } from '@/lib/services'
import { UpdateProjectClientSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]
 * Get project details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await projectService.getProjectById(id, {
      includeAssets: true,
      includeUser: session.user.role === 'ADMIN',
      includeHistory: session.user.role === 'ADMIN',
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Clients can only view their own projects
    if (session.user.role !== 'ADMIN' && project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    console.error('Failed to get project:', error)
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project (limited fields for clients)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await projectService.getProjectById(id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check ownership for clients
    if (session.user.role !== 'ADMIN' && project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Clients can only edit in INTAKE_NEW status
    if (session.user.role !== 'ADMIN' && project.status !== 'INTAKE_NEW') {
      return NextResponse.json(
        { error: 'Project cannot be edited in current status' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = UpdateProjectClientSchema.parse(body)

    const { db } = await import('@/lib/db')
    const updated = await db.project.update({
      where: { id },
      data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}
