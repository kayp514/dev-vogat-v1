import { auth } from '@tern-secure/nextjs/server'
import { getUser } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

/**
 * GET /api/user/me
 * Get current authenticated user's information
 */
export async function GET() {
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

    const result = await getUser(user.uid)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user
    })

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user'
        }
      },
      { status: 500 }
    )
  }
}
