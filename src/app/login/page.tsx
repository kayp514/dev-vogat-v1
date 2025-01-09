// app/login/page.tsx

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://ternsecure.com';

export default async function Login(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  const redirectParam = searchParams.redirect;
  const redirectUrl = typeof redirectParam === 'string' ? redirectParam : '/v0';

  // Create a callback URL that points back to our application
  const callbackUrl = `${protocol}://${host}/auth/callback`;
  const encodedCallback = encodeURIComponent(callbackUrl);

  // Include both the callback URL and the final redirect URL in the auth request
  const encodedRedirect = encodeURIComponent(redirectUrl);
  const loginUrl = `${AUTH_APP_URL}/api/auth/login?callback=${encodedCallback}&redirect=${encodedRedirect}`;

  console.log('Redirecting to login URL:', loginUrl);
  redirect(loginUrl);
}