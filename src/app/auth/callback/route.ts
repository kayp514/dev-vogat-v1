// app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect') || '/v0';

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Set the auth token as a cookie
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  // Redirect to the original destination within the main app
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}