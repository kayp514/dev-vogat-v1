import { auth } from '@tern-secure/nextjs/server'
import { searchWorkspaceUsers } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

// GET /api/workspace/[workspaceId]/search - Search users within a workspace
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

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || searchParams.get('query') || ''
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        if (!query.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Search query is required'
                    }
                },
                { status: 400 }
            )
        }

        const result = await searchWorkspaceUsers(workspaceId, user.uid, query, limit)

        if (!result.success) {
            const statusCode = result.error?.code === 'UNAUTHORIZED' ? 403 : 500
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
            users: result.users
        })

    } catch (error) {
        console.error('Workspace search API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to search users'
                }
            },
            { status: 500 }
        )
    }
}
