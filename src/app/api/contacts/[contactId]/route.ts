import { NextResponse } from 'next/server'
import { auth } from '@tern-secure/nextjs/server'
import { removeContact } from '@/lib/db/queries'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
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

    const { contactId } = await params

    const result = await removeContact(user.uid, contactId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact removed'
    })

  } catch (error) {
    console.error('Remove contact API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to remove contact' 
        } 
      },
      { status: 500 }
    )
  }
}
