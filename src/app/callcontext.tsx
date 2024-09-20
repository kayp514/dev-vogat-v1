'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import CallUI from './ui/callui'

type CallType = 'outgoing' | 'incoming'

interface CallContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  handleOutgoingCall: (phoneNumber: string) => void
  handleIncomingCall: (phoneNumber: string) => void
  handleEndCall: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: ReactNode }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeNumber, setActiveNumber] = useState('')
  const [callType, setCallType] = useState<CallType>('outgoing')

  const handleOutgoingCall = (phoneNumber: string) => {
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('outgoing')
  }

  const handleIncomingCall = (phoneNumber: string) => {
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('incoming')
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setActiveNumber('')
  }

  return (
    <CallContext.Provider value={{ 
      isCallActive,
      activeNumber,
      callType,
      handleOutgoingCall,
      handleIncomingCall,
      handleEndCall
      }}>
      {children}
      {isCallActive && (
        <CallUI
        phoneNumber={activeNumber}
        onEndCall={handleEndCall}
        callType={callType}
        />
      )}
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}