'use client'

import { AppLayout } from "../ui/app-layout";
import { useAuth } from "@tern-secure/nextjs";


export default function VzeroPage() {
  const { user, isAuthenticated } = useAuth()



  const userData = {
    id: 'me',
    name: user?.displayName || 'LifesprintCare',
    email: user?.email || '',
    uid: user?.uid || '',
    avatar: user?.photoURL || '',
    phoneNumber: user?.phoneNumber || '+1 (647) 243-8101',
    status: 'online' as const,
  }

    return (
        <AppLayout userData={userData} /> 
    )
}