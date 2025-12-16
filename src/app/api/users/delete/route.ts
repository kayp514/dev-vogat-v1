import { softDeleteUser } from '@/lib/db/queries';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid } = body;

        if (!uid) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'uid is required'
                    }
                },
                { status: 400 }
            );
        }

        const result = await softDeleteUser(uid);

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error('Delete user API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to delete user'
                }
            },
            { status: 500 }
        );
    }
}
