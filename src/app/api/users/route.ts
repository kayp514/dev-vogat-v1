import { createUser, getAllUsers } from '@/lib/db/queries'
import { NextResponse } from 'next/server'
import type { DatabaseUserInput } from '@/lib/db/types'

const DEFAULT_TENANT_ID = 'default'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const maxResults = searchParams.get('maxResults')
  const nextPage = searchParams.get('nextPage')

  try {
    const result = await getAllUsers(
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
      users: result.users,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      hasMore: result.hasMore
    })
  } catch (error) {
    console.error('Get all users API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get users'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      uid,
      email,
      name,
      avatar,
      tenantId,
      isAdmin,
      phoneNumber,
      emailVerified,
      createdAt,
      lastSignInAt
    } = body

    if (!uid || !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'uid and email are required'
          }
        },
        { status: 400 }
      )
    }

    const userData: DatabaseUserInput = {
      uid,
      email,
      name: name || null,
      avatar: avatar || null,
      tenantId: tenantId || DEFAULT_TENANT_ID,
      isAdmin: isAdmin || false,
      phoneNumber: phoneNumber || null,
      emailVerified: emailVerified || false,
      createdAt: createdAt ? new Date(createdAt) : null,
      lastSignInAt: lastSignInAt ? new Date(lastSignInAt) : null,
    }

    const result = await createUser(userData)

    return NextResponse.json(
      {
        success: true,
        user: result.user
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create user API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create user'
        }
      },
      { status: 500 }
    )
  }
}