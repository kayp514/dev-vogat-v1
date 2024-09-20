'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import CallUI from './ui/callui'

interface CallContextType {
  isCallActive: boolean
  activeNumber: string
  handleCall: (phoneNumber: string) => void
  handleEndCall: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: ReactNode }) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeNumber, setActiveNumber] = useState('')

  const handleCall = (phoneNumber: string) => {
    setIsCallActive(true)
    setActiveNumber(phoneNumber)
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setActiveNumber('')
  }

  return (
    <CallContext.Provider value={{ isCallActive, activeNumber, handleCall, handleEndCall }}>
      {children}
      {isCallActive && (
        <CallUI phoneNumber={activeNumber} onEndCall={handleEndCall} />
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