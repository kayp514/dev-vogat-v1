import { NextResponse } from 'next/server'
import { auth } from '@tern-secure/nextjs/server'
import { getAllWorkspaces, createWorkspace, getUserWorkspaces } from '@/lib/db/queries'

const DEFAULT_TENANT_ID = 'default'

// GET /api/workspace - List all workspaces (with optional filtering)
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
        const maxResults = searchParams.get('maxResults')
        const nextPage = searchParams.get('nextPage')
        const forCurrentUser = searchParams.get('forCurrentUser') === 'true'

        // If forCurrentUser=true, return only current user's workspaces
        if (forCurrentUser) {
            const result = await getUserWorkspaces(user.uid)

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
                workspaces: result.workspaces
            })
        }

        // Otherwise, return all workspaces (admin view)
        const result = await getAllWorkspaces(
            maxResults ? parseInt(maxResults) : undefined,
            nextPage ? parseInt(nextPage) : undefined
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
            workspaces: result.workspaces,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            hasMore: result.hasMore
        })

    } catch (error) {
        console.error('Workspace API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch workspaces'
                }
            },
            { status: 500 }
        )
    }
}

// POST /api/workspace - Create a new workspace
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

        const { name, description, type } = await request.json()

        if (!name?.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Workspace name is required'
                    }
                },
                { status: 400 }
            )
        }

        // Validate workspace type
        if (type && !['personal', 'business'].includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Workspace type must be either "personal" or "business"'
                    }
                },
                { status: 400 }
            )
        }

        const result = await createWorkspace(
            user.uid,
            user.tenantId || DEFAULT_TENANT_ID,
            name,
            description,
            type || 'personal'
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

        return NextResponse.json(
            {
                success: true,
                workspace: result.workspace
            },
            { status: 201 }
        )

    } catch (error) {
        console.error('Error creating workspace:', error)
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to create workspace'
                }
            },
            { status: 500 }
        )
    }
}