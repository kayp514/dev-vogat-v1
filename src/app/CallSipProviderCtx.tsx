'use client'

import { createContext, useContext } from 'react'
import { type Invitation, type CallState, type CallType } from '@/lib/type'


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