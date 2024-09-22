'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import CallUI from './ui/callui'

type CallType = 'outgoing' | 'incoming'
type CallState = 'idle' | 'ringing' | 'active' | 'ended'

interface CallContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  callState: CallState
  handleOutgoingCall: (phoneNumber: string) => void
  handleIncomingCall: (phoneNumber: string) => void
  handleEndCall: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: ReactNode }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeNumber, setActiveNumber] = useState('')
  const [callType, setCallType] = useState<CallType>('outgoing')
  const [callState, setCallState] = useState<CallState>('idle')

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (callState === 'ringing') {
      timer = setTimeout(() => {
        setCallState('active')
      }, 3000) // Simulate ringing for 3 seconds
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [callState])

  const handleOutgoingCall = (phoneNumber: string) => {
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('outgoing')
    setCallState('ringing')
  }

  const handleIncomingCall = (phoneNumber: string) => {
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('incoming')
    setCallState('ringing')
  }

  const handleEndCall = () => {
    setCallState('ended')
    setTimeout(() => {
      setIsCallActive(false)
      setActiveNumber('')
      setCallState('idle')
    }, 1000)
  }

  return (
    <CallContext.Provider value={{ 
      isCallActive,
      activeNumber,
      callType,
      callState,
      handleOutgoingCall,
      handleIncomingCall,
      handleEndCall
      }}>
      {children}
      {isCallActive && (
        <CallUI />
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