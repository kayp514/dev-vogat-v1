'use client'

import React, { useState, useCallback, useEffect, ReactNode } from 'react'
import { initializeSIP, 
    registerUserAgent, 
    unregisterUserAgent, 
    handleRegistrationStateChange,
 } from '@/lib/call'

import { type ConnectionState, type RegistrationState } from '@/lib/type'
import { removeConnectionListener, addConnectionListener } from '@/lib/network'
import { toast } from '@/hooks/use-toast'
import { SipProviderCtx,
  type SIPStatus,
  type TransportStatus,
  type NetworkStatus,
 } from './SipProviderCtx'


export function SIPProvider({ children }: { children: ReactNode }) {
  const [sipStatus, setSipStatus] = useState<SIPStatus>('uninitialized')
  const [transportStatus, setTransportStatus] = useState<TransportStatus>('disconnected' )
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'online'
  )

  const [isInitialized, setIsInitialized] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [reconnectionAttempt, setReconnectionAttempt] = useState(0)

    useEffect(() => {
      const handleOnline = () => {
        console.log('Network: Online')
        setNetworkStatus('online')
        setReconnectionAttempt(0) /// Reset reconnection attempts
      }
  
      const handleOffline = () => {
        console.log('Network: Offline')
        setNetworkStatus('offline')
        setTransportStatus('disconnected')
        setSipStatus('disconnected')
      }
  
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
  
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }, [])

  const handleConnectionState = useCallback((state: ConnectionState) => {
    setTransportStatus(state.transport)
    setSipStatus(state.sip)

    setIsInitialized(state.transport === 'connected')
    setIsRegistered(state.sip === 'registered')

    if (typeof state.reconnectionAttempt === 'number') {
      setReconnectionAttempt(state.reconnectionAttempt)
    }

    if (state.transport === 'disconnected' && networkStatus === 'online') {
      toast({
        title: "Connection Lost",
        description: `Attempting to reconnect... (${reconnectionAttempt}/3)`,
        variant: "destructive",
      })
    }

    if (state.lastError) {
      toast({
        title: "Connection Error",
        description: state.lastError.message,
        variant: "destructive",
      })
    }

  }, [networkStatus, reconnectionAttempt])

  useEffect(() => {
    addConnectionListener(handleConnectionState)
    return () => removeConnectionListener(handleConnectionState)
  }, [handleConnectionState])

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
    setTransportStatus('connecting')

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
    <SipProviderCtx.Provider value={{
      sipStatus,
      transportStatus,
      networkStatus,
      isInitialized,
      isRegistered,
      reconnectionAttempt,
      initializeSIP: initializeSIPContext,
      register,
      unregister,
    }}>
      {children}
    </SipProviderCtx.Provider>
  )
}