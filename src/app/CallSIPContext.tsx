'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { initializeSIP, makeOutgoingCall, terminateCall, SIPResponse, monitorSIPStatus } from '@/lib/call'
import { toast } from '@/hooks/use-toast'

export type CallType = 'outgoing' | 'incoming'
export type CallState = 'idle' | 'ringing' | 'active' | 'ended' | 'error'

interface CallSIPContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  callState: CallState
  sipStatus: SIPResponse | null
  handleOutgoingCall: (phoneNumber: string) => Promise<void>
  handleIncomingCall: (phoneNumber: string) => void
  handleEndCall: () => void
  setIsCallActive: React.Dispatch<React.SetStateAction<boolean>>
}

const CallSIPContext = createContext<CallSIPContextType | undefined>(undefined)

export function CallSIPProvider({ children }: { children: ReactNode }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeNumber, setActiveNumber] = useState('')
  const [callType, setCallType] = useState<CallType>('outgoing')
  const [callState, setCallState] = useState<CallState>('idle')
  const [sipStatus, setSipStatus] = useState<SIPResponse | null>(null)

  useEffect(() => {
    const initSIP = async () => {
      if (!sipStatus) {
        const response = await initializeSIP()
        setSipStatus(response)
        if (response.status === 'error') {
          toast({
            title: "SIP Initialization Failed",
            description: response.message,
            variant: "destructive",
          })
        }
      }
    }
    initSIP()
  }, [sipStatus])

  useEffect(() => {
    const checkSIPStatus = () => {
      const status = monitorSIPStatus();
      setSipStatus(status);
      if (status.status === 'error') {
        toast({
          title: "SIP Status Error",
          description: status.message,
          variant: "destructive",
        })
      }
    };
    const interval = setInterval(checkSIPStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleOutgoingCall = async (phoneNumber: string) => {
    if (sipStatus?.status !== 'success') {
      toast({
        title: "Call Failed",
        description: "SIP is not initialized or registered. Please try again later.",
        variant: "destructive",
      })
      return
    }

    console.log('handleOutgoingCall triggered with number:', phoneNumber)
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('outgoing')
    setCallState('ringing')

    try {
      const response: SIPResponse = await makeOutgoingCall(phoneNumber)
      console.log('makeOutgoingCall response:', response)
      if (response.status === 'success') {
        setCallState('active')
        toast({
          title: "Call Connected",
          description: `Connected to ${phoneNumber}`,
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('Error in makeOutgoingCall:', error)
      setCallState('error')
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleIncomingCall = (phoneNumber: string) => {
    console.log('handleIncomingCall triggered with number:', phoneNumber)
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('incoming')
    setCallState('ringing')
  }

  const handleEndCall = () => {
    console.log('handleEndCall triggered')
    const response: SIPResponse = terminateCall()
    if (response.status === 'success') {
      setCallState('ended')
      setIsCallActive(false)
      setActiveNumber('')
    } else {
      toast({
        title: "Error Ending Call",
        description: response.message,
        variant: "destructive",
      })
    }
  }

  return (
    <CallSIPContext.Provider value={{ 
      isCallActive,
      setIsCallActive,
      activeNumber,
      callType,
      callState,
      sipStatus,
      handleOutgoingCall,
      handleIncomingCall,
      handleEndCall
    }}>
      {children}
    </CallSIPContext.Provider>
  )
}

export function useCallSIP() {
  const context = useContext(CallSIPContext)
  if (context === undefined) {
    throw new Error('useCallSIP must be used within a CallSIPProvider')
  }
  return context
}