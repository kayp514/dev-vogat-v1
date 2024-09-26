
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import SideBar from "@/app/ui/sidebar";
import UserInfo from './userinfo';
import { error } from "console";

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL || 'https://firebase-auth-data.vercel.app';

async function getUserData(token: string) {
    try {
      const response = await fetch(`${AUTH_APP_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
  
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
      } else {
        // If the response is not JSON, read it as text
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('Received non-JSON response from server');
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
    console.error('no token found in cookies')
    redirect('/login');
  }
  console.log('Auth token found:', token.value);

  try {
    const userData = await getUserData(token.value);

    return (
      <div className="flex h-screen">
        <SideBar />
        <main className="flex-1 p-4 overflow-auto">
          <UserInfo userData={userData} />
        </main>
      </div>
    );
} catch (error) {
    console.error('Error in V0Page:', error);
    return (
      <div className="flex h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> Failed to load user data. Please try again later or contact support.</span>
        </div>
      </div>
    );
  }
}