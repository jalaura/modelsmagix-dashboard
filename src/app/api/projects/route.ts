/**
 * Projects API Routes
 * GET: List projects (authenticated)
 * POST: Create new project (public intake)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projectService } from '@/lib/services'
import { CreateProjectSchema, ListProjectsQuerySchema } from '@/lib/validations'
import { sendIntakeConfirmation } from '@/lib/services/email.service'

/**
 * GET /api/projects
 * List projects for authenticated user (filtered by role)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = ListProjectsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    // Clients can only see their own projects
    const userId = session.user.role === 'ADMIN' ? undefined : session.user.id

    const result = await projectService.listProjects({
      ...query,
      userId,
      includeUser: session.user.role === 'ADMIN',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to list projects:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create new project (public intake form - no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = CreateProjectSchema.parse(body)

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: 'CLIENT',
        },
      })
    }

    // Create project with reference images
    const project = await projectService.createProject({
      userId: user.id,
      productType: data.productType,
      creativeBrief: data.creativeBrief,
      referenceImages: data.referenceImages,
    })

    // Send confirmation email
    await sendIntakeConfirmation(user.email, {
      clientName: user.name || 'Customer',
      projectId: project.id,
      productType: data.productType,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          projectId: project.id,
          message: 'Project submitted successfully. Check your email for confirmation.',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create project:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
