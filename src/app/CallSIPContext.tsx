'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { makeOutgoingCall, terminateCall, SIPResponse, CallState } from '@/lib/call'
import { toast } from '@/hooks/use-toast'
import { useSIP } from './SIPContext'

export type CallType = 'outgoing' | 'incoming'
export type {CallState} from '@/lib/call'


interface CallSIPContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  callState: CallState
  handleOutgoingCall: (phoneNumber: string) => Promise<void>
  handleIncomingCall: (phoneNumber: string) => void
  handleEndCall: () => void
  setIsCallActive: (isCallActive: boolean) => void
}

const CallSIPContext = createContext<CallSIPContextType | undefined>(undefined)

export function CallSIPProvider({ children }: { children: ReactNode }) {
  const { isInitialized, isRegistered } = useSIP()
  const [activeNumber, setActiveNumber] = useState('')
  const [callType, setCallType] = useState<CallType>('outgoing')
  const [callState, setCallState] = useState<CallState>('idle')
  const [isCallActive, setIsCallActive] = useState(false)


  const handleCallStateChange = useCallback((newState: CallState) => {
    console.log('Call state changed to:', newState)
    setCallState(newState)
    if (newState === 'terminated' || newState === 'error') {
      setIsCallActive(false)
      setActiveNumber('')
    }
  }, [])


  const handleOutgoingCall = async (phoneNumber: string) => {
    if (!isInitialized || !isRegistered) {
      handleCallStateChange('error')
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
    handleCallStateChange('establishing')

    try {
      const response: SIPResponse = await makeOutgoingCall(phoneNumber, handleCallStateChange)
        console.log('makeOutgoingCall:', response)
        if (response.status !== 'success') {
          handleCallStateChange('error')
          toast({
            title: "Call Failed",
            description: response.message,
            variant: "destructive",
          })
        }
    } catch (error) {
      console.error('Error in makeOutgoingCall:', error)
      handleCallStateChange('error')
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleIncomingCall = (phoneNumber: string) => {
    console.log('handleIncomingCall triggered with number:', phoneNumber)
    setActiveNumber(phoneNumber)
    setCallType('incoming')
    handleCallStateChange('establishing')
  }

  const handleEndCall = () => {
    console.log('handleEndCall triggered')
    const response: SIPResponse = terminateCall()
    if (response.status === 'success') {
      handleCallStateChange('terminated')
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
      activeNumber,
      callType,
      callState,
      handleOutgoingCall,
      handleIncomingCall,
      handleEndCall,
      setIsCallActive 
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