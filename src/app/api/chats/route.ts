import { auth } from '@tern-secure/nextjs/server'
import { getUserChats, createNewChat } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

const DEFAULT_TENANT_ID = 'default'

export async function GET(request: Request) {
  try {

    const session = await auth()
    
    if (!session?.user?.uid) {
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

    const result = await getUserChats(session.user.uid, session.user.tenantId || '')

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
      chats: result.chats
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
    const {user } = await auth()
    console.log('api chat', user?.uid)
    
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

    const { recipientId, content } = await request.json()

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

    const result = await createNewChat(
      user.uid,
      recipientId,
      user.tenantId || DEFAULT_TENANT_ID,
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
      chat: result.chat
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