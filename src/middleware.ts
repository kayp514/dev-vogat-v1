// middleware.ts
import { ternSecureMiddleware, createRouteMatcher } from '@tern-secure/nextjs/server';

const publicPaths = createRouteMatcher(['/sign-in', '/sign-up'])

export const config = {
  matcher: ['/v0/:path*', '/dashboard/:path*'],
};

export default ternSecureMiddleware(async (auth, request) => {
  if(!publicPaths(request)) {
    await auth.protect()
  }

})

