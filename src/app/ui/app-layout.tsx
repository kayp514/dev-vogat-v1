'use client'

import { useState } from 'react'
import { AppSideBar } from './sidebar'
import { Header } from "@/app/ui/header"
import { ChatLayout } from '../chat/chat-layout'
import { CallLayout } from '../calls/call-layout'
import { useCallSIP } from '@/app/CallSipProviderCtx'
import CallUI from '@/app/ui/callui'
import { CallNotification } from './callnotify'
import { cn } from "@/lib/utils"
import { type UserData, type Participant, type CallSession, initializeCallSession} from "../type"
//import { type CallSession, type Participant, type UserInfo, type CallerInfo } from '../types/call'
import { Toaster } from '@/components/ui/toaster';
import { SIPInitializer } from "../SIPInitializer";
import { ConsoleLayout } from './console/console-layout'


interface AppLayoutProps {
  userData: UserData; 
}

const createParticipant = (userInfo: UserData, role: 'caller' | 'callee' | 'participant'): Participant => ({
  id: userInfo.id,
  uid: userInfo.uid,
  name: userInfo.name,
  email: userInfo.email,
  phoneNumber: userInfo.phoneNumber,
  avatar: userInfo.avatar,
  status: userInfo.status,
  isVideoOn: false,
  isMuted: false,
  role,
})

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

  const currentUser: UserData = {
    id: 'me',
    uid: userData.uid,
    name: userData.name || 'Me',
    email: userData.email,
    avatar: userData.avatar,
    phoneNumber: userData.phoneNumber,
    status: userData.status || 'online'
  }

  const defaultCallee: UserData = {
    id: activeNumber,
    uid: activeNumber,
    name: activeNumber,
    email: '',
    avatar: '',
    phoneNumber: activeNumber,
    status: userData.status
  }


  const [callSession, setCallSession] = useState<CallSession>(
    initializeCallSession(
      `call-${Date.now()}`,
      currentUser,
      defaultCallee,
      'outgoing'
    )
  )


  const toggleMaximize = () => {
    setCallSession(prev => ({
      ...prev,
      isMaximized: !prev.isMaximized
    }))
  }

  const updateParticipant = (participantId: string, updates: Partial<Participant>) => {
    setCallSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.uid === participantId ? { ...p, ...updates } : p
      )
    }))
  }

  const addParticipant = (userInfo: UserData) => {
    const newParticipant: Participant = {
      ...userInfo,
      isVideoOn: false,
      isMuted: false,
      isHost: false,
      role: 'participant'
    }

    setCallSession(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant]
    }))
  }

  const removeParticipant = (participantId: string) => {
    setCallSession(prev => {
      const participant = prev.participants.find(p => p.uid === participantId)
      if (participant?.role === 'caller' || participant?.role === 'callee') {
        return prev
      }
      return {
        ...prev,
        participants: prev.participants.filter(p => p.uid !== participantId)
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
          callSession.isMaximized && "mr-[400px]"
        )}>
          {activeTab === "chat" && <ChatLayout />}
          {activeTab === "calls" && <CallLayout />}
          {activeTab === "console" && <ConsoleLayout />}
        </div>
        <Toaster />
      </div>
      {isCallActive &&  (
        <div className={cn(
          "fixed transition-all duration-300",
          callSession.isMaximized 
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
              callerInfo={currentUser}
              calleeInfo={callSession.callee}
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