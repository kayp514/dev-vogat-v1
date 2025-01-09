'use client'

import { redirect } from "next/navigation";
import { AppLayout } from "../ui/app-layout";
import { CallSIPProvider } from "@/app/CallSIPContext";
import { SIPProvider } from "@/app/SIPContext";
import { SIPInitializer } from "../SIPInitializer";
import { useAuth } from "@tern-secure/nextjs";


export default function VzeroPage() {
  const { user, error, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    redirect('/sign-in')
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> Failed to load user data. Please try again later or contact support.</span>
        </div>
      </div>
    )
  }

  const userData = {
    displayName: user?.displayName,
    email: user?.email,
    uid: user?.uid
  }

    return (
      <SIPProvider>
        <CallSIPProvider>
        <SIPInitializer />
        <AppLayout userData={userData} />
       </CallSIPProvider>
       </SIPProvider>
    )
}