'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { makeOutgoingCall, 
  terminateCall, 
  SIPResponse, 
  CallState, 
  handleCallStateChange, 
  listenForIncomingCalls, 
  acceptIncomingCall, 
  type Invitation,
  getUserAgent,
  setCallStateChangeHandler } from '@/lib/call'
import { toast } from '@/hooks/use-toast'
import { useSIP } from './SIPContext'

export type CallType = 'outgoing' | 'incoming'
export type { CallState } from '@/lib/call'


interface CallSIPContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  callState: CallState
  handleOutgoingCall: (phoneNumber: string) => Promise<void>
  handleIncomingCall: (invitation: Invitation) => void
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


  const handleCallStateChangeContext = useCallback((newState: CallState) => {
    console.log('Call state changed to:', newState);
    setCallState(newState);
    if (newState === 'terminated' || newState === 'error') {
      setIsCallActive(false);
      setActiveNumber('');
    } else if (newState === 'established') {
      setIsCallActive(true);
    }
  }, []);

  useEffect(() => {
    setCallStateChangeHandler(handleCallStateChangeContext)
  }, [handleCallStateChangeContext])


  const handleOutgoingCall = useCallback(async (phoneNumber: string) => {
    if (!isInitialized || !isRegistered) {
      handleCallStateChangeContext('error')
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
    handleCallStateChangeContext('establishing')

    try {
      const response: SIPResponse = await makeOutgoingCall(phoneNumber, handleCallStateChangeContext)
        console.log('makeOutgoingCall:', response)
        if (response.status !== 'success') {
          handleCallStateChangeContext('error')
          toast({
            title: "Call Failed",
            description: response.message,
            variant: "destructive",
          })
        }
    } catch (error) {
      console.error('Error in makeOutgoingCall:', error)
      handleCallStateChangeContext('error')
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }, [isInitialized, isRegistered, makeOutgoingCall, handleCallStateChangeContext])

  const handleIncomingCall = useCallback((invitation: Invitation) => {
    console.log('handleIncomingCall triggered with invitation:', invitation);
    setIsCallActive(true);
    setActiveNumber(invitation.request?.ruri?.user || 'unknown');
    setCallType('incoming');
    handleCallStateChangeContext('establishing');

    acceptIncomingCall(invitation)
      .then(() => {
        console.log('Call accepted successfully');
        handleCallStateChangeContext('established');
      })
      .catch((error) => {
        console.error('Error accepting call:', error);
        toast({
          title: "Call Failed",
          description: error.message,
          variant: "destructive",
        });
        handleCallStateChangeContext('error');
      });
  }, [handleCallStateChangeContext]);


  const handleEndCall = useCallback(() => {
    console.log('handleEndCall triggered')
    const response: SIPResponse = terminateCall()
    toast({
      title: "Error Ending Call",
      description: response.message,
      variant: "destructive",
    })
  }, [])

useEffect(() => {
    if (isInitialized && isRegistered) {
      console.log('Setting up listener for incoming calls')
      const userAgent = getUserAgent()
      if (userAgent) {
        const cleanupListener = listenForIncomingCalls((invitation) => {
          console.log('Incoming call received:', invitation);
          handleIncomingCall(invitation);
        });
        return () => {
          console.log('Cleaning up listener')
          cleanupListener()
        }
      } else {
        console.error('UserAgent not initialized')
      }
    }
  }, [isInitialized, isRegistered, handleIncomingCall])


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