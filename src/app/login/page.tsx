// app/login/page.tsx

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://firebase-auth-data.vercel.app';

export default function Login({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const headersList = headers();
  const host = headersList.get('host') || '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  const redirectParam = searchParams.redirect;
  const redirectUrl = typeof redirectParam === 'string' ? redirectParam : '/dashboard';
  
  // Create a callback URL that points back to our application
  const callbackUrl = `${protocol}://${host}/auth/callback`;
  const encodedCallback = encodeURIComponent(callbackUrl);
  
  // Include both the callback URL and the final redirect URL in the auth request
  const encodedRedirect = encodeURIComponent(redirectUrl);
  const loginUrl = `${AUTH_APP_URL}/login?callback=${encodedCallback}&redirect=${encodedRedirect}`;

  redirect(loginUrl);
}