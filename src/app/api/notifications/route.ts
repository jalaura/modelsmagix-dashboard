/**
 * Notifications API Routes
 * GET: List notifications for authenticated user
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationService } from '@/lib/services'
import { ListNotificationsQuerySchema } from '@/lib/validations'

/**
 * GET /api/notifications
 * List notifications for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = ListNotificationsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      unreadOnly: searchParams.get('unreadOnly'),
    })

    const result = await notificationService.getUserNotifications(
      session.user.id,
      query
    )

    // Also get unread count
    const unreadCount = await notificationService.getUnreadCount(session.user.id)

    return NextResponse.json({
      ...result,
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to list notifications:', error)
    return NextResponse.json(
      { error: 'Failed to list notifications' },
      { status: 500 }
    )
  }
}
