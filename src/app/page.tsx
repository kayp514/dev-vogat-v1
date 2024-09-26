
import SideBar from "./ui/sidebar"
import { useEffect, useState } from "react";
import { useRouter } from "next/router"
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://firebase-auth-data.vercel.app';

async function getUserData(token: string) {
  const response = await fetch(`${AUTH_APP_URL}/api/user`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
}


export default async function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    redirect('/login');
  }

  try {
    const userData = await getUserData(token.value);

  return (
    <div>
      Email: {userData.email}
      <SideBar />
    </div>
  )
} catch (error) {
  console.error('Error in dashboard:', error);
  redirect('/login');
}
}