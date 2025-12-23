'use client'

import React, { useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import { makeOutgoingCall, 
  terminateCall, 
  listenForIncomingCalls, 
  acceptIncomingCall, 
  getUserAgent,
  getCurrentSession,
  setCallStateChangeHandler, 
  cleanupCall,
  } from '@/lib/call'
import { toast } from '@/hooks/use-toast'
import { useSIP } from './SipProviderCtx'
import { Session, SessionState } from 'sip.js'
import { CallSipProviderCtx } from './CallSipProviderCtx'
import { type Invitation, type SIPResponse, type CallState, type CallType } from '@/lib/type'



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
    console.log('📱 CallSipProvider: handleIncomingCall triggered');
    console.log('   From:', invitation.remoteIdentity.uri.toString());
    console.log('   Invitation state:', invitation.state);
    
    setIsCallActive(true)
    setActiveNumber(invitation.remoteIdentity.uri.user || 'unknown')
    setCallType('incoming')
    setIncomingInvitation(invitation)

    // Initial state set to establishing (call is ringing)
    handleCallStateChangeContext('establishing')
    
    console.log('✅ CallSipProvider: Incoming call state initialized, UI should show CallNotification');
    
    // Note: State change handling is done in call.ts listenForIncomingCalls
    // We don't need duplicate listeners here
  }, [handleCallStateChangeContext]);


  const handleAcceptCall = useCallback(() => {
    if (incomingInvitation) {
      console.log('📞 User clicked Accept button, calling acceptIncomingCall...');
      acceptIncomingCall(incomingInvitation)
        .then(() => {
          console.log('✅ acceptIncomingCall promise resolved');
          console.log('   Note: State will be updated by stateChange listener in call.ts');
          // DO NOT manually update state here - let the state change listener handle it
          // The listener in listenForIncomingCalls will update to 'established' when ready
          currentSessionRef.current = getCurrentSession();
        })
        .catch((error) => {
          console.error('❌ Error accepting call:', error);
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          // Provide more specific error messages
          let errorMessage = 'Failed to accept call';
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'No microphone found. Please connect a microphone and try again.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast({
            title: "Call Failed",
            description: errorMessage,
            variant: "destructive",
          });
          handleCallStateChangeContext('error');
          
          // Clean up and reset state
          setIsCallActive(false);
          setIncomingInvitation(null);
        });
    } else {
      console.error('⚠️ handleAcceptCall called but no incomingInvitation exists');
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
    <CallSipProviderCtx.Provider value={{ 
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
    </CallSipProviderCtx.Provider>
  )
}