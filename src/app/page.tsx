
import SideBar from "./ui/sidebar"
import { useEffect, useState } from "react";
import { useRouter } from "next/router"
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getUserData(userId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/user/${userId}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
}


export default async function Page() {
  const headersList = headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    console.error('User ID not found in request headers');
    redirect('/login');
  }

  try {
    const userData = await getUserData(userId);

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