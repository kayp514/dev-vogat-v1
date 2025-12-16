import { auth } from '@tern-secure/nextjs/server'
import { getWorkspace, updateWorkspace, deleteWorkspace } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

// GET /api/workspace/[workspaceId] - Get a specific workspace
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

    const result = await getWorkspace(workspaceId, user.uid)

    if (!result.success) {
      const statusCode = result.error?.code === 'WORKSPACE_NOT_FOUND' ? 404 : 500
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
      workspace: result.workspace
    })

  } catch (error) {
    console.error('Get workspace API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch workspace'
        }
      },
      { status: 500 }
    )
  }
}

// PATCH /api/workspace/[workspaceId] - Update workspace
export async function PATCH(
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

    const { name, description, disabled, settings } = await request.json()

    // Validate at least one field is provided
    if (!name && !description && disabled === undefined && !settings) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'At least one field to update is required'
          }
        },
        { status: 400 }
      )
    }

    const updateData: {
      name?: string
      description?: string
      disabled?: boolean
      settings?: any
    } = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (disabled !== undefined) updateData.disabled = disabled
    if (settings !== undefined) updateData.settings = settings

    const result = await updateWorkspace(workspaceId, user.uid, updateData)

    if (!result.success) {
      const statusCode = 
        result.error?.code === 'UNAUTHORIZED' ? 403 :
        result.error?.code === 'WORKSPACE_NOT_FOUND' ? 404 :
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
      workspace: result.workspace
    })

  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update workspace'
        }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/workspace/[workspaceId] - Delete workspace
export async function DELETE(
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

    const result = await deleteWorkspace(workspaceId, user.uid)

    if (!result.success) {
      const statusCode = 
        result.error?.code === 'UNAUTHORIZED' ? 403 :
        result.error?.code === 'WORKSPACE_NOT_FOUND' ? 404 :
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
      message: 'Workspace deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete workspace'
        }
      },
      { status: 500 }
    )
  }
}
