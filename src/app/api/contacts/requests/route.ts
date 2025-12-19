import { NextResponse } from 'next/server'
import { auth } from '@tern-secure/nextjs/server'
import { 
  getPendingContactRequests, 
  acceptContactRequest, 
  rejectContactRequest 
} from '@/lib/db/queries'

// GET - Fetch pending contact requests
export async function GET() {
  try {
    const { user } = await auth()
    
    if (!user?.uid) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      )
    }

    const result = await getPendingContactRequests(user.uid)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requests: result.requests,
      count: result.count
    })

  } catch (error) {
    console.error('Get pending requests API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to get pending requests' 
        } 
      },
      { status: 500 }
    )
  }
}

// POST - Accept or reject a contact request
export async function POST(request: Request) {
  try {
    const { user } = await auth()
    
    if (!user?.uid) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { requesterId, action } = body

    if (!requesterId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Requester ID is required' 
          } 
        },
        { status: 400 }
      )
    }

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Action must be "accept" or "reject"' 
          } 
        },
        { status: 400 }
      )
    }

    const result = action === 'accept' 
      ? await acceptContactRequest(user.uid, requesterId)
      : await rejectContactRequest(user.uid, requesterId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'error' in result ? result.error : { code: 'UNKNOWN', message: 'Unknown error' } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Contact request accepted' : 'Contact request rejected'
    })

  } catch (error) {
    console.error('Process contact request API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to process contact request' 
        } 
      },
      { status: 500 }
    )
  }
}
