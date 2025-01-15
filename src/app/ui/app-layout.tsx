'use client'

import { useState } from 'react'
import { AppSideBar } from './sidebar'
import { Header } from "@/app/ui/header"
import ChatPage from "@/app/chat/page"
import CallsPage from "../calls/page"
import { useCallSIP } from '@/app/CallSipProviderCtx'
import CallUI from '@/app/ui/callui'
import { CallNotification } from './callnotify'
import { cn } from "@/lib/utils"
import { type UserData } from "../types/chat"
import { Toaster } from '@/components/ui/toaster';
import { SIPInitializer } from "../SIPInitializer";
import { ConsoleLayout } from './console/console-layout'


interface AppLayoutProps {
  userData: UserData; 
}

export function AppLayout({ userData }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState("chat")
  const [isMaximized, setIsMaximized] = useState(false)


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
        <SIPInitializer />
          <Header userData={userData} />
        </div>
        <div className={cn(
          "h-[calc(100vh-3.5rem)] mt-14 transition-all duration-300",
          isCallActive && !isMaximized // Adjust main content when call UI is shown
        )}>
          {activeTab === "chat" && <ChatPage />}
          {activeTab === "calls" && <CallsPage />}
          {activeTab === "console" && <ConsoleLayout />}
        </div>
        <Toaster />
      </div>
      {isCallActive && (
                  <div className={cn(
                    "fixed transition-all duration-300",
                    isMaximized 
                      ? "inset-0 ml-[60px] mt-14" // Align with sidebar and header
                      : "right-0 top-14 w-[300px]"
                  )}>
        {callType === 'outgoing' && (
          <CallUI
          callerInfo={{
            name: "John Doe",
            avatar: "/path/to/avatar.jpg",
            phoneNumber: "+1 (555) 123-4567",

          }}
            activeNumber={activeNumber}
            callState={callState}
            callType={callType}
            handleEndCall={handleEndCall}
            setIsCallActive={setIsCallActive}
            isMaximized={isMaximized}
            setIsMaximized={setIsMaximized} 
            
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
          callerInfo={{
            name: "John Doe",
            avatar: "/path/to/avatar.jpg",
            phoneNumber: "+1 (555) 123-4567",

          }}
            activeNumber={activeNumber}
            callState={callState}
            callType={callType}
            handleEndCall={handleEndCall}
            setIsCallActive={setIsCallActive}
            isMaximized={isMaximized}
            setIsMaximized={setIsMaximized} 
          />
        )}
    </div>
      )}
    </div>

  )
}