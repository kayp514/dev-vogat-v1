import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://firebase-auth-data.vercel.app';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get('auth_token')?.value;

  if (token) {
    try {
      // Call the authentication service to invalidate the token
      const authResponse = await fetch(`${AUTH_APP_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!authResponse.ok) {
        throw new Error('Logout failed on authentication server');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if the auth server call fails, we'll still clear the local cookie
    }
  }

  // Clear the auth token cookie
  (await cookies()).delete('auth_token');

  return NextResponse.json({ message: 'Logged out successfully' });
}