
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import SideBar from "@/app/ui/sidebar";
import UserInfo from './userinfo'; // We'll create this component
import { error } from "console";

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://firebase-auth-data.vercel.app';

async function getUserData(token: string) {
  try {
    const response = await fetch(`${AUTH_APP_URL}/api/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export default async function VzeroPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    console.error('invalid token', error);
    redirect('/login');
  }

  try {
    const userData = await getUserData(token.value);

    return (
      <div>
        <SideBar />
        <UserInfo userData={userData} />
      </div>
    );
  } catch (error) {
    console.error('Error in VzeroPage:', error);
    redirect('/login');
  }
}