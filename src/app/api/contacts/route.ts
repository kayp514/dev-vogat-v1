import { NextResponse } from 'next/server'
import { auth } from '@tern-secure/nextjs/server'
import { getMyContacts, searchMyContacts, addContact } from '@/lib/db/queries'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (query) {
      const result = await searchMyContacts(user.uid, query)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        contacts: result.contacts
      })
    }

    const result = await getMyContacts(user.uid)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contacts: result.contacts
    })

  } catch (error) {
    console.error('Get contacts API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to get contacts' 
        } 
      },
      { status: 500 }
    )
  }
}

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
    const { identifier } = body // email, phone, or uid

    if (!identifier) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'User identifier (email/phone/uid) is required' 
          } 
        },
        { status: 400 }
      )
    }

    const result = await addContact(user.uid, identifier)

    if (!result.success) {
      const status = result.error?.code === 'USER_NOT_FOUND' ? 404 : 
                     result.error?.code === 'ALREADY_CONTACT' ? 409 : 500
      
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      contact: result.contact
    }, { status: 201 })

  } catch (error) {
    console.error('Add contact API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to add contact' 
        } 
      },
      { status: 500 }
    )
  }
}
