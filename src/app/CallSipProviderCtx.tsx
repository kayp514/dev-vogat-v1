'use client'

import { createContext, useContext } from 'react'
import { 
  CallState, 
  type Invitation,
  } from '@/lib/call'


export type CallType = 'outgoing' | 'incoming'
export type { CallState } from '@/lib/call'


interface CallSIPContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  callState: CallState
  handleOutgoingCall: (phoneNumber: string) => Promise<void>
  handleIncomingCall: (invitation: Invitation) => void
  handleAcceptCall: () => void
  handleRejectCall: () => void
  handleEndCall: () => void
  setIsCallActive: (isCallActive: boolean) => void
}

export const CallSipProviderCtx = createContext<CallSIPContextType | null>(null)

CallSipProviderCtx.displayName = 'CallSipProviderCtx'


export function useCallSIP() {
  const context = useContext(CallSipProviderCtx)
  if (!context) {
    throw new Error('useCallSIP must be used within a CallSIPProvider')
  }
  return context
}




{/* 
    
    'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import { makeOutgoingCall, 
  terminateCall, 
  SIPResponse, 
  CallState, 
  handleCallStateChange, 
  listenForIncomingCalls, 
  acceptIncomingCall, 
  type Invitation,
  getUserAgent,
  setCurrentSession,
  getCurrentSession,
  setCallStateChangeHandler, 
  cleanupCall,
  } from '@/lib/call'
import { toast } from '@/hooks/use-toast'
import { useSIP } from './SipProviderCtx'
import { Inviter, Session, SessionState } from 'sip.js'

export type CallType = 'outgoing' | 'incoming'
export type { CallState } from '@/lib/call'


interface CallSIPContextType {
  isCallActive: boolean
  activeNumber: string
  callType: CallType
  callState: CallState
  handleOutgoingCall: (phoneNumber: string) => Promise<void>
  handleIncomingCall: (invitation: Invitation) => void
  handleAcceptCall: () => void
  handleRejectCall: () => void
  handleEndCall: () => void
  setIsCallActive: (isCallActive: boolean) => void
}

const CallSIPContext = createContext<CallSIPContextType | undefined>(undefined)

export function CallSIPProvider({ children }: { children: ReactNode }) {
  const { isInitialized, isRegistered } = useSIP()
  const [activeNumber, setActiveNumber] = useState('')
  const [callType, setCallType] = useState<CallType>('outgoing')
  const [callState, setCallState] = useState<CallState>('initial')
  const [isCallActive, setIsCallActive] = useState(false)
  const [incomingInvitation, setIncomingInvitation] = useState<Invitation | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null)
  const currentSessionRef = useRef<Session | null>(null)


  const handleCallStateChangeContext = useCallback((newState: CallState) => {
    console.log('Call state changed to:', newState);
    setCallState(newState);
    if (newState === 'terminated' || newState === 'error') {
      setIsCallActive(false);
      setActiveNumber('');
      setIncomingInvitation(null);
      cleanupCall();
      //setCurrentSession(null);
    } else if (newState === 'established') {
      setIsCallActive(true);
    }
  }, [])


  useEffect(() => {
    setCallStateChangeHandler(handleCallStateChangeContext)
    return () => setCallStateChangeHandler(null)
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
    if (isCallActive) {
      await handleEndCall();
    }


    setIsCallActive(true)
    setActiveNumber(phoneNumber)
    setCallType('outgoing')
    handleCallStateChangeContext('initiating')

    try {
      const response: SIPResponse = await makeOutgoingCall(phoneNumber, handleCallStateChangeContext)
        console.log('makeOutgoingCall:', response)
        if (response.status !== 'success') {
          toast({
            title: "Call Failed",
            description: response.message,
            variant: "destructive",
          })
          setIsCallActive(false);
          setActiveNumber('');
          handleCallStateChangeContext('error')
        }
    } catch (error) {
      console.error('Error in makeOutgoingCall:', error)
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })

      handleCallStateChangeContext('terminated')
    }
  }, [isInitialized, isRegistered, isCallActive, handleCallStateChangeContext])

  const handleIncomingCall = useCallback((invitation: Invitation) => {
    console.log('handleIncomingCall triggered with invitation:', invitation)
    setIsCallActive(true)
    setActiveNumber(invitation.remoteIdentity.uri.user || 'unknown')
    setCallType('incoming')
    setIncomingInvitation(invitation)

    handleCallStateChangeContext('establishing')

    const stateChangeListener = (state: SessionState) => {
      console.log(`Incoming call session state changed to: ${state}`)
      if (state === SessionState.Terminated) {
        console.log('Incoming call terminated before being answered')
        handleCallStateChangeContext('terminated')
      }
    }

    invitation.stateChange.addListener(stateChangeListener)

    cleanupRef.current = () => {
      invitation.stateChange.removeListener(stateChangeListener)
    }
  }, [handleCallStateChangeContext]);


  const handleAcceptCall = useCallback(() => {
    if (incomingInvitation) {
      acceptIncomingCall(incomingInvitation)
        .then(() => {
          console.log('Call accepted successfully');
          handleCallStateChangeContext('established');
          setIsCallActive(true);
          currentSessionRef.current = getCurrentSession()
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
    }
  }, [incomingInvitation, handleCallStateChangeContext]);


  const handleRejectCall = useCallback(() => {
    if (incomingInvitation) {
      incomingInvitation.reject({ statusCode: 486, reasonPhrase: 'Busy Here' })
        .then(() => {
          console.log('Call rejected successfully')
          handleCallStateChangeContext('terminated')
        })
        .catch((error) => {
          console.error('Error rejecting call:', error)
          handleCallStateChangeContext('error')
        });
    }
  }, [incomingInvitation, handleCallStateChangeContext]);


  const handleEndCall = useCallback(async () => {
    console.log('handleEndCall triggered');
    try {
      const response = await terminateCall();
      console.log('Call termination response:', response);
      handleCallStateChangeContext('terminating');
      cleanupCall();
      setTimeout(() => {
       handleCallStateChangeContext('terminated');
        cleanupCall();
      }, 100);
    } catch (error) {
      console.error('Error terminating call:', error);
      handleCallStateChangeContext('error');
    }
  }, [handleCallStateChangeContext]);

  useEffect(() => {
    
    if (isInitialized && isRegistered) {
      console.log('Setting up listener for incoming calls')
      console.log('callState:', callState)
      const userAgent = getUserAgent()
      if (userAgent) {
        const cleanupListener = listenForIncomingCalls((invitation) => {
          console.log('Incoming call received:', invitation);
          handleIncomingCall(invitation);
        });
        return () => {
          console.log('Cleaning up listener')
          cleanupListener()
          if (cleanupRef.current) {
            cleanupRef.current()
            cleanupRef.current = null
          }
        }
      } else {
        console.error('UserAgent not initialized')
      }
    }
  }, [isInitialized, isRegistered, handleIncomingCall, callState])


  return (
    <CallSIPContext.Provider value={{ 
      isCallActive,
      activeNumber,
      callType,
      callState,
      handleOutgoingCall,
      handleIncomingCall,
      handleEndCall,
      handleAcceptCall,
      handleRejectCall,
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
    
*/}