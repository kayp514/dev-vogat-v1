// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/v0/:path*', '/dashboard/:path*'],
};

export async function middleware(request: NextRequest) {

  const url = request.nextUrl
  const { pathname } = url

  
  const isLoginPage = pathname === '/sign-in'
  const isSignup = pathname === '/signup'
  const isPublicRoute = isLoginPage || isSignup

  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next()
}
