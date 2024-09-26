// app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://firebase-auth-data.vercel.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token with your auth system
    const verifyResponse = await fetch(`${AUTH_APP_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!verifyResponse.ok) {
      throw new Error('Token verification failed');
    }

    const { valid, uid } = await verifyResponse.json();

    if (!valid) {
      throw new Error('Invalid token');
    }

    // Set the auth token as a cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Redirect to the original destination
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}