import { auth } from '@tern-secure/nextjs/server'
import { removeMemberFromWorkspace, updateMemberRole } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

// DELETE /api/workspace/[workspaceId]/members/[userId] - Remove member from workspace
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> }
) {
  const { workspaceId, userId } = await params

  if (!workspaceId || !userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'workspaceId and userId are required'
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

    const result = await removeMemberFromWorkspace(
      workspaceId,
      user.uid,
      userId
    )

    if (!result.success) {
      const statusCode = 
        result.error?.code === 'UNAUTHORIZED' ? 403 :
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'CANNOT_REMOVE_OWNER' ? 400 :
        500

      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('Error removing workspace member:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove member'
        }
      },
      { status: 500 }
    )
  }
}

// PATCH /api/workspace/[workspaceId]/members/[userId] - Update member role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> }
) {
  const { workspaceId, userId } = await params

  if (!workspaceId || !userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'workspaceId and userId are required'
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

    const { role } = await request.json()

    if (!role || !['member', 'admin'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Valid role is required (member or admin)'
          }
        },
        { status: 400 }
      )
    }

    const result = await updateMemberRole(
      workspaceId,
      user.uid,
      userId,
      role
    )

    if (!result.success) {
      const statusCode = 
        result.error?.code === 'UNAUTHORIZED' ? 403 :
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'CANNOT_CHANGE_OWNER_ROLE' ? 400 :
        500

      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      member: result.member
    })

  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update member role'
        }
      },
      { status: 500 }
    )
  }
}
