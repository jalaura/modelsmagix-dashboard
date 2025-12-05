/**
 * Mark Notification Read API Route
 * PATCH: Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationService } from '@/lib/services'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/notifications/[id]/read
 * Mark notification as read
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await notificationService.markNotificationRead(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notification read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification read' },
      { status: 500 }
    )
  }
}
