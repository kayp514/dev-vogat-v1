'use client'

import { useState } from 'react'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSideBar } from './sidebar'
import { Header } from "@/app/ui/header"
import { ChatPage } from "@/app/chat/page"
import { CallsPage } from "@/app/calls/page"
import { useCallSIP } from '@/app/CallSIPContext'
import { useSIP } from '@/app/SIPContext'
import CallUI from '@/app/ui/callui'
import { CallNotification } from './callnotify'



interface AppLayoutProps {
  userData: {
    displayName?: string;
    email?: string;
    uid?: string;
  }
}

export function AppLayout({ userData }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState("chat")

  const { isInitialized, isRegistered } = useSIP()
  const { 
    isCallActive, 
    activeNumber, 
    callState, 
    callType, 
    handleEndCall, 
    setIsCallActive, 
    handleAcceptCall, 
    handleRejectCall 
  } = useCallSIP()

  return (
    <div className="flex min-h-screen">
      <div className="w-[60px] flex-shrink-0 h-screen">
        <AppSideBar setActiveTab={setActiveTab} activeTab={activeTab} />
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="absolute top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Header userData={userData} />
        </div>
        <div className="h-[calc(100vh-3.5rem)] mt-14">
          {activeTab === "chat" && <ChatPage />}
          {activeTab === "calls" && <CallsPage />}
        </div>
      </div>
      {isCallActive && callType === 'outgoing' && (
          <CallUI
            activeNumber={activeNumber}
            callState={callState}
            callType={callType}
            handleEndCall={handleEndCall}
            setIsCallActive={setIsCallActive}
          />
        )}
        {isCallActive && callType === 'incoming' && callState === 'establishing' && (
          <CallNotification
            callerNumber={activeNumber}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )}
        {isCallActive && callType === 'incoming' && callState === 'established' && (
          <CallUI
            activeNumber={activeNumber}
            callState={callState}
            callType={callType}
            handleEndCall={handleEndCall}
            setIsCallActive={setIsCallActive}
          />
        )}
    </div>
  )
}