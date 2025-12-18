import { auth } from '@tern-secure/nextjs/server'
import { getUserChats, createNewChat } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

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
    const workspaceId = searchParams.get('workspaceId')

    // Fetch all chats for user (direct + workspace if provided)
    const result = await getUserChats(user.uid, workspaceId || undefined)

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
      chats: result.chats,
      workspaceId: workspaceId || null
    })

  } catch (error) {
    console.error('Chats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch chats'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const { recipientId, content, workspaceId } = await request.json()

    if (!recipientId || !content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Recipient and message content are required'
          }
        },
        { status: 400 }
      )
    }

    // workspaceId is now optional for direct (1-on-1) chats
    // If not provided, creates a direct chat (room-based)
    // If provided, creates a workspace chat (group chat)
    const result = await createNewChat(
      user.uid,
      recipientId,
      workspaceId || '', // Pass empty string for direct chats
      content
    )

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
      chat: result.chat,
      workspaceId: workspaceId || null,
      roomId: result.roomId
    })

  } catch (error) {
    console.error('Error in Sending Message:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send message'
        }
      },
      { status: 500 }
    )
  }
}