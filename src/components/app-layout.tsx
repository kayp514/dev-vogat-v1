'use client'

import { useState } from 'react'
import { AppSideBar } from './sidebar'
import { Header } from "@/components/header"
import { ChatLayout } from '@/app/chat/chat-layout'
import { CallLayout } from '@/app/calls/call-layout'
import { useCallSIP } from '@/app/providers/CallSipProviderCtx'
import { CallUI } from '@/components/callui'
import { CallNotification } from './callnotify'
import { cn } from "@/lib/utils"
import type { UserData, Participant, CallSession, CallerInfo } from "../app/type"
import { initializeCallSession} from "../app/type"
import { Toaster } from '@/components/ui/toaster';
import { SIPInitializer } from "../app/SIPInitializer";
import { NotificationLayout } from '@/app/notifications/notification-layout'


interface AppLayoutProps {
  userData: UserData; 
}


export function AppLayout({ userData }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState("chat")
  const [currentCallerInfo, setCurrentCallerInfo] = useState<CallerInfo | null>(null)
  const [currentCalleeInfo, setCurrentCalleeInfo] = useState<CallerInfo | null>(null)

  const { 
    isCallActive, 
    activeNumber, 
    callState, 
    callType, 
    handleEndCall, 
    setIsCallActive, 
    handleAcceptCall, 
    handleRejectCall, 
    handleOutgoingCall,
  } = useCallSIP()



  const [callSession, setCallSession] = useState<CallSession | null>(null)

  // Initialize call session for incoming calls when they arrive
  if (isCallActive && callType === 'incoming' && activeNumber && !callSession) {
    console.log('🔔 AppLayout: Initializing call session for incoming call from:', activeNumber);
    
    const incomingCallerInfo: CallerInfo = {
      id: activeNumber,
      uid: '',
      name: activeNumber,
      phoneNumber: activeNumber,
      email: '',
      avatar: '',
    };
    
    const incomingCalleeInfo: CallerInfo = {
      id: userData.id,
      uid: userData.uid,
      name: userData.name,
      phoneNumber: userData.phoneNumber || '',
      email: userData.email || '',
      avatar: userData.avatar || '',
    };
    
    const newSession = initializeCallSession(
      `call-${Date.now()}`, 
      incomingCallerInfo, 
      incomingCalleeInfo, 
      "incoming"
    );
    
    setCurrentCallerInfo(incomingCallerInfo);
    setCurrentCalleeInfo(incomingCalleeInfo);
    setCallSession(newSession);
  }
  
  // Clean up call session when call ends
  if (!isCallActive && callSession) {
    console.log('🧹 AppLayout: Cleaning up call session');
    setCallSession(null);
    setCurrentCallerInfo(null);
    setCurrentCalleeInfo(null);
  }

  const handleCall = async (phoneNumber: string, callerInfo: CallerInfo, calleeInfo: CallerInfo) => {
    setCurrentCallerInfo(callerInfo)
    setCurrentCalleeInfo(calleeInfo)

    const newSession = initializeCallSession(`call-${Date.now()}`, callerInfo, calleeInfo, "outgoing")
    setCallSession(newSession)

    await handleOutgoingCall(phoneNumber)
  }


  const toggleMaximize = () => {
    setCallSession((prev) =>
      prev
        ? {
            ...prev,
            isMaximized: !prev.isMaximized,
          }
        : null,
    )
  }

  const updateParticipant = (participantId: string, updates: Partial<Participant>) => {
    setCallSession((prev) => {
      if (!prev) return null
      return {
        ...prev,
        participants: prev.participants.map((p) => (p.id === participantId ? { ...p, ...updates } : p)),
      }
    })
  }

  const addParticipant = (userInfo: CallerInfo) => {
    const newParticipant: Participant = {
      ...userInfo,
      isVideoOn: false,
      isMuted: false,
      isHost: false,
      role: "participant",
    }

    setCallSession((prev) => {
      if (!prev) return null
      return {
        ...prev,
        participants: [...prev.participants, newParticipant],
      }
    })
  }


  const removeParticipant = (participantId: string) => {
    setCallSession((prev) => {
      if (!prev) return null
      const participant = prev.participants.find((p) => p.id === participantId)
      if (participant?.role === "caller" || participant?.role === "callee") {
        return prev
      }
      return {
        ...prev,
        participants: prev.participants.filter((p) => p.id !== participantId),
      }
    })
  }

  const isMaximized = callSession?.isMaximized || false

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="fixed top-0 left-0 right-0 z-20 h-16 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80 shadow-xs">
      <SIPInitializer />
      <Header userData={userData} />
      </header>
      <div className="flex mt-16 h-[calc(100vh-4rem)]">
        <aside className="w-16 h-full bg-muted/20 shadow-xs">
        <AppSideBar setActiveTab={setActiveTab} activeTab={activeTab} />
        </aside>
      <main className="flex-1 h-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-opacity duration-300 relative z-0",
            isCallActive && isMaximized && "opacity-50",
          )}
        >
          {activeTab === "chat" && <ChatLayout />}
          {activeTab === "calls" && <CallLayout userData={userData} onCall={handleCall} />}
          {activeTab === "notifications" && <NotificationLayout />}
          {/**activeTab === "console" && <ConsoleLayout />**/}
        </div>
        <Toaster />
        </main>
      </div>
      {isCallActive && callSession && currentCalleeInfo && currentCallerInfo && (
        <div className={cn(
          "fixed transition-all duration-300 z-50",
          isMaximized 
            ? "inset-0 ml-[60px] mt-14"
            : "right-0 top-14 w-[300px]"
        )}>
          {callType === 'incoming' && callState === 'establishing' ? (
            <CallNotification
              callerNumber={activeNumber}
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
            />
          ) : (
            <CallUI
              callerInfo={currentCallerInfo}
              calleeInfo={currentCalleeInfo}
              activeNumber={activeNumber}
              callState={callState}
              callType={callType}
              handleEndCall={handleEndCall}
              setIsCallActive={setIsCallActive}
              isMaximized={callSession.isMaximized}
              setIsMaximized={toggleMaximize}
              participants={callSession.participants}
              onParticipantUpdate={updateParticipant}
              onParticipantAdd={addParticipant}
              onParticipantRemove={removeParticipant}
            />
            )}
        </div>
      )}
    </div>
  )
}