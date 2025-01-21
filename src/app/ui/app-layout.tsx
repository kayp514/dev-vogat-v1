'use client'

import { useState } from 'react'
import { AppSideBar } from './sidebar'
import { Header } from "@/app/ui/header"
import { ChatLayout } from '../chat/chat-layout'
import { CallLayout } from '../calls/call-layout'
import { useCallSIP } from '@/app/CallSipProviderCtx'
import { CallUI } from '@/app/ui/callui'
import { CallNotification } from './callnotify'
import { cn } from "@/lib/utils"
import { type UserData, type Participant, type CallSession, type CallerInfo, initializeCallSession} from "../type"
import { Toaster } from '@/components/ui/toaster';
import { SIPInitializer } from "../SIPInitializer";
import { ConsoleLayout } from './console/console-layout'


interface AppLayoutProps {
  userData: UserData; 
}


export function AppLayout({ userData }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState("chat")
  const [isMaximized, setCallMaximized] = useState(false)
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

  const currentUser: CallerInfo = {
    ...userData,
    id: "me",
    isHost: true,
    isVideoOn: false,
    isMuted: false,
  }

  const defaultCallee: CallerInfo = {
    id: activeNumber || "callee", // Provide a default ID for callee
    uid: activeNumber || "callee",
    name: activeNumber,
    email: "",
    avatar: "",
    phoneNumber: activeNumber || "",
    status: "unknown",
    isVideoOn: false,
    isMuted: false,
  }

  const [callSession, setCallSession] = useState<CallSession | null>(null)

  const handleCall = async (phoneNumber: string, callerInfo: CallerInfo, calleeInfo: CallerInfo) => {
    setCurrentCallerInfo(callerInfo)
    setCurrentCalleeInfo(calleeInfo)

    // Initialize call session with the provided info
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

  
  return (
    <div className="flex min-h-screen">
      <div className="w-[60px] flex-shrink-0 h-screen">
        <AppSideBar setActiveTab={setActiveTab} activeTab={activeTab} />
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="absolute top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-[100]">
          <SIPInitializer />
          <Header userData={userData} />
        </div>
        <div className={cn(
          "h-[calc(100vh-3.5rem)] mt-14 transition-all duration-300 relative z-0",
          isMaximized && "mr-[400px]"
        )}>
          {activeTab === "chat" && <ChatLayout />}
          {activeTab === "calls" && <CallLayout userData={userData} onCall={handleCall} />}
          {activeTab === "console" && <ConsoleLayout />}
        </div>
        <Toaster />
      </div>
      {isCallActive && callSession && currentCalleeInfo && currentCallerInfo && (
        <div className={cn(
          "fixed transition-all duration-300",
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