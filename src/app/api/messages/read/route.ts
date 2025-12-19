import { auth } from '@tern-secure/nextjs/server'
import { markRoomMessagesAsRead } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

/**
 * PATCH /api/messages/read
 * Mark all unread messages in a room as read for the current user
 * This is called when a user opens a conversation
 * 
 * Body:
 * - roomId: The room identifier (required)
 */
export async function PATCH(request: Request) {
  try {
    const { user } = await auth()

    if (!user?.uid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated'
          }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { roomId } = body

    if (!roomId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'roomId is required'
          }
        },
        { status: 400 }
      )
    }

    // Mark all unread messages from other users as read
    const result = await markRoomMessagesAsRead(roomId, user.uid)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount
    })

  } catch (error) {
    console.error('Mark messages read API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark messages as read'
        }
      },
      { status: 500 }
    )
  }
}
