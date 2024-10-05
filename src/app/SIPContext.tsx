// src/app/SIPContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { initializeSIP, 
    isUserAgentRegistered, 
    registerUserAgent, 
    unregisterUserAgent, 
    getRegistrationState, 
    handleRegistrationStateChange, 
    RegistrationState,
 } from '@/lib/call'
import { toast } from '@/hooks/use-toast'

type SIPStatus = 'uninitialized' | 'initializing' | 'initialized' | 'registering' | 'registered' | 'unregistering' | 'error'

interface SIPContextType {
  sipStatus: SIPStatus
  isInitialized: boolean
  isRegistered: boolean
  initializeSIP: () => Promise<void>
  register: () => Promise<void>
  unregister: () => Promise<void>
}

const SIPContext = createContext<SIPContextType | undefined>(undefined)

export function SIPProvider({ children }: { children: ReactNode }) {
  const [sipStatus, setSipStatus] = useState<SIPStatus>('uninitialized')
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const updateRegistrationState = useCallback((state: RegistrationState) => {
    switch (state) {
      case 'Initial':
        setSipStatus('initialized')
        setIsRegistered(false)
        break
      case 'Registered':
        setSipStatus('registered')
        setIsRegistered(true)
        break
      case 'Unregistered':
        setSipStatus('initialized')
        setIsRegistered(false)
        break
      case 'Terminated':
        setSipStatus('error')
        setIsRegistered(false)
        break
      default:
        break
    }
  }, [])

  useEffect(() => {
    handleRegistrationStateChange(updateRegistrationState)
  }, [updateRegistrationState])

  const initializeSIPContext = useCallback(async () => {
    setSipStatus('initializing')
    const response = await initializeSIP()
    if (response.status === 'success') {
      setSipStatus('registered')
      setIsInitialized(true)
      setIsRegistered(true)
    } else {
      setSipStatus('error')
      toast({
        title: "SIP Initialization Failed",
        description: response.message,
        variant: "destructive",
      })
    }
  }, [])

  const register = useCallback(async () => {
    if (!isInitialized) {
      toast({
        title: "SIP Not Initialized",
        description: "SIP is not initialized. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (isRegistered) {
      return // Already registered, do nothing
    }

    if (sipStatus === 'registering') {
      return // Already registering, do nothing
    }

    setSipStatus('registering')
    try {
      const response = await registerUserAgent()
      if (response.status === 'success') {
        setSipStatus('registered')
        setIsRegistered(true)
      } else if (response.status === 'warning') {
        // Registration already in progress, do nothing
      } else {
        setSipStatus('error')
        toast({
          title: "SIP Registration Failed",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setSipStatus('error')
      toast({
        title: "SIP Registration Failed",
        description: "An error occurred while registering the user agent.",
        variant: "destructive",
      })
    }
  }, [isInitialized, isRegistered, sipStatus])

  const unregister = useCallback(async () => {
    if (!isInitialized || !isRegistered) {
      return // Not initialized or not registered, do nothing
    }
    setSipStatus('unregistering')
    try {
      const response = await unregisterUserAgent()
      if (response.status === 'success') {
        setSipStatus('initialized')
        setIsRegistered(false)
      } else {
        toast({
          title: "SIP Unregistration Failed",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "SIP Unregistration Failed",
        description: "An error occurred while unregistering the user agent.",
        variant: "destructive",
      })
    }
  }, [isInitialized, isRegistered])

  return (
    <SIPContext.Provider value={{
      sipStatus,
      isInitialized,
      isRegistered,
      initializeSIP: initializeSIPContext,
      register,
      unregister,
    }}>
      {children}
    </SIPContext.Provider>
  )
}

export function useSIP() {
  const context = useContext(SIPContext)
  if (context === undefined) {
    throw new Error('useSIP must be used within a SIPProvider')
  }
  return context
}