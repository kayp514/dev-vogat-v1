import { auth } from '@tern-secure/nextjs/server'
import { getRoomMessages } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

/**
 * GET /api/messages
 * Fetch messages from DB for a room (direct chat between two users)
 * Room ID format: room_email1_email2 (emails sorted alphabetically)
 * 
 * Query params:
 * - roomId: The room identifier (required)
 * - cursor: Message ID for pagination (optional)
 * - limit: Number of messages to fetch (optional, default 50)
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const cursor = searchParams.get('cursor')
    const limit = searchParams.get('limit')

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

    // Fetch messages with pagination
    const result = await getRoomMessages(roomId, {
      cursor: cursor || undefined,
      limit: limit ? parseInt(limit) : undefined
    })

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
      messages: result.messages,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore
    })

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch messages'
        }
      },
      { status: 500 }
    )
  }
}
