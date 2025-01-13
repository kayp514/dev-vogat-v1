'use client'

import { AppLayout } from "../ui/app-layout";
import { useAuth } from "@tern-secure/nextjs";


export default function VzeroPage() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }


  const userData = {
    displayName: user?.displayName || '',
    email: user?.email || '',
    uid: user?.uid || '',
    photoURL: user?.photoURL || '',
    status: 'online' as const,
  }

    return (
        <AppLayout userData={userData} /> 
    )
}