import { auth } from '@tern-secure/nextjs/server'
import { getWorkspaceMembers, inviteToWorkspace } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

// GET /api/workspace/[workspaceId]/members - List all members in a workspace
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params

  if (!workspaceId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'workspaceId is required'
        }
      },
      { status: 400 }
    )
  }

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

    const result = await getWorkspaceMembers(workspaceId, user.uid)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: result.error?.code === 'UNAUTHORIZED' ? 403 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members: result.members
    })

  } catch (error) {
    console.error('Get workspace members API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch workspace members'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/workspace/[workspaceId]/members - Invite a user to workspace
export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params

  if (!workspaceId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'workspaceId is required'
        }
      },
      { status: 400 }
    )
  }

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

    const { userId, role } = await request.json()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'userId is required'
          }
        },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !['member', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Role must be either "member" or "admin"'
          }
        },
        { status: 400 }
      )
    }

    const result = await inviteToWorkspace(
      workspaceId,
      user.uid,
      userId,
      role || 'member'
    )

    if (!result.success) {
      const statusCode = 
        result.error?.code === 'UNAUTHORIZED' ? 403 :
        result.error?.code === 'ALREADY_MEMBER' ? 409 :
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'TENANT_MISMATCH' ? 400 :
        500

      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: true,
        member: result.member
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error inviting member to workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to invite member'
        }
      },
      { status: 500 }
    )
  }
}
