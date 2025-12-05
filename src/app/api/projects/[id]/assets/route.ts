/**
 * Project Assets API Routes
 * GET: List assets for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assetService, projectService } from '@/lib/services'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]/assets
 * List assets for a project
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await projectService.getProjectById(id, { includeAssets: false })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Clients can only view their own projects
    if (session.user.role !== 'ADMIN' && project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assets = await assetService.getProjectAssets(id)

    return NextResponse.json({ data: assets })
  } catch (error) {
    console.error('Failed to list project assets:', error)
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 }
    )
  }
}
