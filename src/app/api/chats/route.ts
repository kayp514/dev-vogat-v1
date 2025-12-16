import { auth } from '@tern-secure/nextjs/server'
import { getUserChats, createNewChat, getUserWorkspaces } from '@/lib/db/queries'
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

    if (!workspaceId) {
      const workspacesResult = await getUserWorkspaces(user.uid)
      
      if (!workspacesResult.success || !workspacesResult.workspaces?.length) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_WORKSPACE',
              message: 'User has no workspaces. Please create a workspace first.'
            }
          },
          { status: 400 }
        )
      }

      // Use the first workspace (typically the user's personal workspace)
      const defaultWorkspaceId = workspacesResult.workspaces[0].id
      const result = await getUserChats(user.uid, defaultWorkspaceId)

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
        workspaceId: defaultWorkspaceId
      })
    }

    // Verify user has access to this workspace
    const workspacesResult = await getUserWorkspaces(user.uid)
    if (!workspacesResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: workspacesResult.error
        },
        { status: 500 }
      )
    }

    const hasAccess = workspacesResult.workspaces?.some((w: { id: string }) => w.id === workspaceId)
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WORKSPACE_ACCESS_DENIED',
            message: 'You do not have access to this workspace'
          }
        },
        { status: 403 }
      )
    }

    const result = await getUserChats(user.uid, workspaceId)

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
      workspaceId
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

    // Determine which workspace to use
    let targetWorkspaceId = workspaceId

    if (!targetWorkspaceId) {
      // Get user's workspaces to find default
      const workspacesResult = await getUserWorkspaces(user.uid)
      
      if (!workspacesResult.success || !workspacesResult.workspaces?.length) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_WORKSPACE',
              message: 'User has no workspaces. Please create a workspace first.'
            }
          },
          { status: 400 }
        )
      }

      targetWorkspaceId = workspacesResult.workspaces[0].id
    } else {
      // Verify user has access to specified workspace
      const workspacesResult = await getUserWorkspaces(user.uid)
      if (!workspacesResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: workspacesResult.error
          },
          { status: 500 }
        )
      }

      const hasAccess = workspacesResult.workspaces?.some((w: { id: string }) => w.id === targetWorkspaceId)
      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'WORKSPACE_ACCESS_DENIED',
              message: 'You do not have access to this workspace'
            }
          },
          { status: 403 }
        )
      }
    }

    const result = await createNewChat(
      user.uid,
      recipientId,
      targetWorkspaceId,
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
      workspaceId: targetWorkspaceId
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